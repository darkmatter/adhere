/**
 * Whether a third question tells a real finding from a false one: does the
 * file hold enough to decide the rule at all? The preset eval found that the
 * weakest rules fail on facts a file does not show, such as a client's
 * default timeout or whether a key is public. For each hand-labeled finding,
 * it asks Jev the judge question again, over the file as lint sends it,
 * beside wordings of the sufficiency question, and prints how well each
 * separates the labels, and how a warning below each cutoff would do.
 * The labels are `presets-labels.json`'s; `sufficiency.md` has the results.
 *
 *   bun eval/studies/sufficiency.ts [results.json]
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect } from "effect";
import { isNote, withoutComments } from "#comments.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { judgeBody, judgeQuestion } from "#services/Jev.ts";
import type { Rule } from "#config.ts";

interface Labeled {
  readonly repo: string;
  readonly file: string;
  readonly rule: string;
  readonly p: number;
  readonly label: "real" | "false" | "debatable";
}

const presets = new URL("../../presets/", import.meta.url);

/** Where the repos the labels are about are checked out, at `<owner>/<repo>`. */
const repos = process.env.ADHERE_EVAL_REPOS ?? join(homedir(), ".agents/repos");

/** Whether a preset still has a rule; the labels name two that are gone. */
const exists = (id: string) => existsSync(fileURLToPath(new URL(`${id}/RULE.md`, presets)));

const ruleOf = (id: string): Promise<Rule> =>
  readFile(new URL(`${id}/RULE.md`, presets), "utf8").then((text) =>
    Effect.runPromise(parseRuleMarkdown(text, id)),
  );

/** The user's wording, with the judge question as the judgment it refers to. */
const bare = (rule: Rule) => {
  const { instructions } = judgeQuestion(rule);
  return {
    type: "noul" as const,
    instructions: {
      ...instructions,
      judgment: instructions.question,
      question: "Does `code` contain sufficient information to make `judgment`?",
    },
  };
};

/** The same, with criteria naming what a file cannot show: lint's wording until the direct one. */
const withCriteria = (rule: Rule) => ({
  ...bare(rule),
  criteria: {
    true: "Everything `judgment` turns on is in `code`",
    false:
      "`judgment` turns on something `code` does not show, such as what another file, a library, a service, or the program's configuration does",
  },
});

/** The condition itself, without a question about the judge question. */
const direct = (rule: Rule) => {
  const { question: _, ...fields } = judgeQuestion(rule).instructions;
  return {
    type: "noul" as const,
    instructions: {
      question:
        "Can you tell whether `code` breaks `rule` from `code` alone, without knowing what other files, libraries, services, or configuration do?",
      ...fields,
    },
    criteria: {
      true: "`code` shows everything needed to tell whether it breaks `rule`",
      false:
        "Whether `code` breaks `rule` depends on something `code` does not show, such as another file, a library, a service, or configuration",
    },
  };
};

const ask = async (key: string, body: unknown) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const { answers } = (await response.json()) as {
        answers: Record<string, { noul: number }>;
      };
      return answers;
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000 * (attempt + 1)));
  }
  throw new Error("Jev kept refusing");
};

/** How often a real finding outscores a false one: 0.5 is chance. */
const auc = (scored: ReadonlyArray<{ readonly score: number; readonly real: boolean }>) => {
  const real = scored.filter((s) => s.real).map((s) => s.score);
  const wrong = scored.filter((s) => !s.real).map((s) => s.score);
  let wins = 0;
  for (const r of real) for (const w of wrong) wins += r > w ? 1 : r === w ? 0.5 : 0;
  return wins / (real.length * wrong.length);
};

const [output = "sufficiency-results.json"] = process.argv.slice(2);
const key = process.env.TYPESAFE_API_KEY;
if (key === undefined) {
  throw new Error("usage: TYPESAFE_API_KEY=… bun eval/studies/sufficiency.ts [results.json]");
}
const labeled = (
  JSON.parse(
    await readFile(new URL("presets-labels.json", import.meta.url), "utf8"),
  ) as ReadonlyArray<Labeled>
).filter((f) => exists(f.rule));
const rules = new Map<string, Rule>();
for (const id of new Set(labeled.map((f) => f.rule))) rules.set(id, await ruleOf(id));

const byFile = Map.groupBy(labeled, (f) => join(repos, f.repo, f.file));
const results: Array<Labeled & { judge: number; bare: number; criteria: number; direct: number }> =
  [];
const files = [...byFile.entries()];
let done = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (files.length > 0) {
      const [path, findings] = files.shift()!;
      const lines = withoutComments((await readFile(path, "utf8")).split("\n"), isNote);
      const questions: Record<string, unknown> = {};
      for (const [index, f] of findings.entries()) {
        const rule = rules.get(f.rule)!;
        questions[`judge:${index}`] = judgeQuestion(rule);
        questions[`bare:${index}`] = bare(rule);
        questions[`criteria:${index}`] = withCriteria(rule);
        questions[`direct:${index}`] = direct(rule);
      }
      const answers = await ask(key, {
        model: "jev-latest",
        state: judgeBody("jev-latest", lines, {}).state,
        questions,
      });
      for (const [index, f] of findings.entries()) {
        results.push({
          ...f,
          judge: answers[`judge:${index}`]?.noul ?? Number.NaN,
          bare: answers[`bare:${index}`]?.noul ?? Number.NaN,
          criteria: answers[`criteria:${index}`]?.noul ?? Number.NaN,
          direct: answers[`direct:${index}`]?.noul ?? Number.NaN,
        });
      }
      done += 1;
      if (done % 50 === 0) console.error(`${done} of ${byFile.size} files`);
    }
  }),
);
await writeFile(output, JSON.stringify(results, null, 1));

const decided = results.filter((r) => r.label !== "debatable");
for (const field of ["judge", "bare", "criteria", "direct"] as const) {
  const scored = decided.map((r) => ({ score: r[field], real: r.label === "real" }));
  console.log(`${field}: AUC ${auc(scored).toFixed(3)} over ${scored.length} labeled findings`);
}

// As a warning on the findings the judge question reports: right when the finding is false.
const reported = decided.filter((r) => r.judge >= 0.8);
const wrong = reported.filter((r) => r.label === "false").length;
for (const field of ["criteria", "direct"] as const) {
  console.log(`\n${field}, as a warning on ${reported.length} findings above 0.8, ${wrong} false:`);
  for (const cutoff of [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9]) {
    const warned = reported.filter((r) => r[field] < cutoff);
    const right = warned.filter((r) => r.label === "false").length;
    const rest = reported.length - warned.length;
    const restReal = reported.filter((r) => r[field] >= cutoff && r.label === "real").length;
    console.log(
      `  below ${cutoff}: ${warned.length} warned, precision ${Math.round((100 * right) / Math.max(1, warned.length))}%, recall ${Math.round((100 * right) / Math.max(1, wrong))}% (${right}), real among the rest ${Math.round((100 * restReal) / Math.max(1, rest))}%`,
    );
  }
}
