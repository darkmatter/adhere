/**
 * How the file should be laid out in Jev's state: as hundreds of numbered
 * lines, as lint sent it before sections, or as a few sections, each a run of
 * whole statements such as imports, constants, and functions, about 30 lines
 * long, a decorator with what it decorates (`sectionsOf`). For each
 * hand-labeled finding, each arm asks adhere's judge question, and each
 * sectioned arm also asks which section breaks the rule:
 *
 * - numbered: the file with every line numbered;
 * - isolated: one request per section, each request's state that section
 *   alone; the file's score is the highest of them, its place that section;
 * - marked: the whole file, only each section's first line numbered, as `[3]`;
 * - keyed: the sections as an object, `{ "1": "…", "2": "…" }`, as lint sends
 *   them now, each option of the locate question the section's first line;
 * - keyed-names and keyed-bare: the same, each option what its section
 *   declares, or nothing;
 * - array: the sections as an array, `["…", "…"]`.
 *
 * The labels are `presets-labels.json`'s; `sections.md` has the results.
 *
 *   bun eval/studies/sections.ts [results.json] [arm…]
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect } from "effect";
import { isNote, withoutComments } from "#comments.ts";
import type { Rule } from "#config.ts";
import { type Range, sectionsOf } from "#excerpt.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { judgeQuestion, locateBody } from "#services/Jev.ts";

interface Labeled {
  readonly repo: string;
  readonly file: string;
  readonly line: number;
  readonly rule: string;
  readonly label: "real" | "false" | "debatable";
}

type Lines = ReadonlyArray<string>;

interface Result extends Labeled {
  readonly sections: ReadonlyArray<Range>;
  /** Per arm, the judge question's answer. */
  readonly scores: Record<string, number>;
  /** Per sectioned arm, the section it placed the finding in. */
  readonly placed: Record<string, Range | undefined>;
}

/** An arm that sends the whole file in one request. */
interface Layout {
  readonly state: (lines: Lines, sections: ReadonlyArray<Range>) => unknown;
  /** What a section is called in the locate question, and the option naming each. */
  readonly noun?: string;
  readonly option?: (index: number) => string;
  /** How each option describes its section; its first line by default. */
  readonly describe?: (lines: Lines, section: Range) => string | null;
}

const codeOf = (lines: Lines, section: Range) =>
  lines.slice(section.first - 1, section.last).join("\n");

const layouts: Record<string, Layout> = {
  numbered: {
    state: (lines) => ({ code: lines.map((line, n) => `${n + 1} | ${line}`).join("\n") }),
  },
  marked: {
    state: (lines, sections) => {
      const starts = new Map(sections.map((section, index) => [section.first, index + 1]));
      return {
        code: lines
          .map((line, n) => (starts.has(n + 1) ? `[${starts.get(n + 1)}] ${line}` : line))
          .join("\n"),
      };
    },
    noun: "section",
    option: (index) => String(index + 1),
  },
  keyed: {
    state: (lines, sections) => ({
      code: Object.fromEntries(
        sections.map((section, index) => [String(index + 1), codeOf(lines, section)]),
      ),
    }),
    noun: "entry",
    option: (index) => String(index + 1),
  },
  "keyed-names": {
    state: (lines, sections) => ({
      code: Object.fromEntries(
        sections.map((section, index) => [String(index + 1), codeOf(lines, section)]),
      ),
    }),
    noun: "entry",
    option: (index) => String(index + 1),
    describe: (lines, section) => namesOf(lines, section.first, section.last),
  },
  "keyed-bare": {
    state: (lines, sections) => ({
      code: Object.fromEntries(
        sections.map((section, index) => [String(index + 1), codeOf(lines, section)]),
      ),
    }),
    noun: "entry",
    option: (index) => String(index + 1),
    describe: () => null,
  },
  array: {
    state: (lines, sections) => ({ code: sections.map((section) => codeOf(lines, section)) }),
    noun: "element",
    option: (index) => String(index),
  },
};

/** What a section declares, such as `class Context` or `test "New link"`: its option in the locate question. */
const DECLARATION =
  /^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(function\*?|class|interface|type|enum|const|let|var|namespace)\s+([\w$]+|\[[^\]]*\]|\{[^}]*\})/;
const METHOD =
  /^(?:(?:public|private|protected|static|readonly|async|override|get|set)\s+)*(#?[\w$]+)\s*[<(]/;
const FIELD =
  /^(?:(?:public|private|protected|static|readonly|override|declare)\s+)*(#?[\w$]+)\s*[?!]?\s*[:=][^=]/;
const CALL =
  /^(describe|it|test|beforeAll|beforeEach|afterAll|afterEach|useEffect|useLayoutEffect)(?:\.\w+)?\(\s*(?:(['"`])(.*?)\2)?/;
const namesOf = (lines: ReadonlyArray<string>, first: number, last: number): string => {
  const body = lines.slice(first - 1, last);
  const indent = Math.min(
    ...body.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length),
  );
  const names: Array<string> = [];
  let imports = false;
  for (const line of body) {
    if (line.trim() === "" || line.length - line.trimStart().length !== indent) continue;
    const text = line.trim();
    if (text.startsWith("import ")) {
      imports = true;
      continue;
    }
    const d = DECLARATION.exec(text);
    if (d) {
      names.push(`${d[1]!.replace("*", "")} ${d[2]!.replace(/\s+/g, " ")}`);
      continue;
    }
    const c = CALL.exec(text);
    if (c) {
      names.push(c[3] ? `${c[1]} "${c[3]}"` : c[1]!);
      continue;
    }
    const f = FIELD.exec(text);
    if (f) {
      names.push(f[1]!);
      continue;
    }
    const m = METHOD.exec(text);
    if (m && !["if", "for", "while", "switch", "return", "await", "catch"].includes(m[1]!))
      names.push(`${m[1]}()`);
  }
  const listed = [...(imports ? ["imports"] : []), ...names];
  return listed.length === 0
    ? (body.find((l) => l.trim()) ?? "").trim().slice(0, 80)
    : listed.slice(0, 6).join(", ") + (listed.length > 6 ? ", …" : "");
};

const presets = new URL("../../presets/", import.meta.url);

/** Where the repos the labels are about are checked out, at `<owner>/<repo>`. */
const repos = process.env.ADHERE_EVAL_REPOS ?? join(homedir(), ".agents/repos");

/** Whether a preset still has a rule; the labels name two that are gone. */
const exists = (id: string) => existsSync(fileURLToPath(new URL(`${id}/RULE.md`, presets)));

const ruleOf = (id: string): Promise<Rule> =>
  readFile(new URL(`${id}/RULE.md`, presets), "utf8").then((text) =>
    Effect.runPromise(parseRuleMarkdown(text, id)),
  );

/** The locate question, choosing among the sections, each option its first line. */
const sectionChoice = (
  rule: Rule,
  lines: Lines,
  sections: ReadonlyArray<Range>,
  noun: string,
  option: (index: number) => string,
  describe: (lines: Lines, section: Range) => string | null = (_, section) =>
    (lines[section.first - 1] ?? "").trim().slice(0, 120),
) => {
  const located = locateBody("", lines, { rule }).questions.rule;
  if (located === undefined) throw new Error("locateBody asked nothing");
  const { question, ...fields } = located.instructions;
  return {
    type: "choice" as const,
    instructions: { question: question.replace("Which line", `Which ${noun}`), ...fields },
    criteria: Object.fromEntries(
      sections.map((section, index) => [option(index), describe(lines, section)]),
    ),
  };
};

/** The judge question, about the code in the state rather than a whole file. */
const aboutCode = (rule: Rule) => {
  const question = judgeQuestion(rule);
  return {
    ...question,
    instructions: {
      ...question.instructions,
      question: question.instructions.question.replace("this file", "this code"),
    },
  };
};

type Answers = Record<string, { noul?: number; choice?: string }>;

const ask = async (key: string, body: unknown): Promise<Answers> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return ((await response.json()) as { answers: Answers }).answers;
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

const [output = "sections-results.json", ...named] = process.argv.slice(2);
const arms = named.length > 0 ? named : ["numbered", "isolated", "marked", "keyed", "array"];
const key = process.env.TYPESAFE_API_KEY;
if (key === undefined) {
  throw new Error("usage: TYPESAFE_API_KEY=… bun eval/studies/sections.ts [results.json] [arm…]");
}
const labeled = (
  JSON.parse(
    await readFile(new URL("presets-labels.json", import.meta.url), "utf8"),
  ) as ReadonlyArray<Labeled>
).filter((f) => exists(f.rule));
const rules = new Map<string, Rule>();
for (const id of new Set(labeled.map((f) => f.rule))) rules.set(id, await ruleOf(id));

/** One section per request; the file's score is the highest, its place that section. */
const isolated = async (
  apiKey: string,
  lines: Lines,
  sections: ReadonlyArray<Range>,
  findings: ReadonlyArray<Labeled>,
) => {
  const questions = Object.fromEntries(
    findings.map((f, index) => [`judge:${index}`, aboutCode(rules.get(f.rule)!)]),
  );
  const answers = await Promise.all(
    sections.map((section) =>
      ask(apiKey, { model: "jev-latest", state: { code: codeOf(lines, section) }, questions }),
    ),
  );
  return findings.map((_, index) =>
    sections
      .map((section, at) => ({ section, score: answers[at]?.[`judge:${index}`]?.noul ?? 0 }))
      .reduce((a, b) => (b.score > a.score ? b : a)),
  );
};

/** The whole file in one request, laid out as `layout` lays it out. */
const laidOut = async (
  apiKey: string,
  layout: Layout,
  lines: Lines,
  sections: ReadonlyArray<Range>,
  findings: ReadonlyArray<Labeled>,
) => {
  const { noun, option } = layout;
  const questions: Record<string, unknown> = {};
  findings.forEach((f, index) => {
    const rule = rules.get(f.rule)!;
    questions[`judge:${index}`] = judgeQuestion(rule);
    if (noun !== undefined && option !== undefined && sections.length > 1) {
      questions[`locate:${index}`] = sectionChoice(
        rule,
        lines,
        sections,
        noun,
        option,
        layout.describe,
      );
    }
  });
  const answers = await ask(apiKey, {
    model: "jev-latest",
    state: layout.state(lines, sections),
    questions,
  });
  return findings.map((_, index) => {
    const choice = answers[`locate:${index}`]?.choice;
    return {
      score: answers[`judge:${index}`]?.noul ?? Number.NaN,
      section:
        option === undefined
          ? undefined
          : sections.length === 1
            ? sections[0]
            : sections.find((_, at) => option(at) === choice),
    };
  });
};

const byFile = Map.groupBy(labeled, (f) => join(repos, f.repo, f.file));
const results: Array<Result> = [];
const files = [...byFile.entries()];
let done = 0;
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (files.length > 0) {
      const [path, findings] = files.shift()!;
      const lines = withoutComments((await readFile(path, "utf8")).split("\n"), isNote);
      const sections = sectionsOf(lines);
      const answered = await Promise.all(
        arms.map(async (arm) => {
          if (arm === "isolated") return isolated(key, lines, sections, findings);
          const layout = layouts[arm];
          if (layout === undefined) throw new Error(`no arm ${arm}`);
          return laidOut(key, layout, lines, sections, findings);
        }),
      );
      findings.forEach((f, index) =>
        results.push({
          ...f,
          sections,
          scores: Object.fromEntries(
            arms.map((arm, at) => [arm, answered[at]?.[index]?.score ?? Number.NaN]),
          ),
          placed: Object.fromEntries(arms.map((arm, at) => [arm, answered[at]?.[index]?.section])),
        }),
      );
      done += 1;
      if (done % 50 === 0) console.error(`${done} of ${byFile.size} files`);
    }
  }),
);
await writeFile(output, JSON.stringify(results, null, 1));

const decided = results.filter((r) => r.label !== "debatable");
for (const arm of arms) {
  const scored = decided.map((r) => ({
    score: r.scores[arm] ?? Number.NaN,
    real: r.label === "real",
  }));
  console.log(`${arm}: AUC ${auc(scored).toFixed(3)} over ${scored.length} labeled findings`);
}
