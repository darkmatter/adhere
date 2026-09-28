/**
 * Once Jev has named the section a finding is in, can it name the lines?
 * For each real finding whose violating lines were marked by hand, in
 * `violations.json`, given the section that holds its clearest violation,
 * each arm places the finding in that section:
 *
 * - section: the whole section, as lint shows it;
 * - tenths: two ten-level Scores, where in the section's text the violation
 *   starts and ends, as its most likely tenth and as the expected position;
 * - choice: two choices among the section's lines, the one the violation
 *   starts on and the one it ends on, the state the section keyed by line;
 * - lines: a noul per non-blank line, whether it is part of the code that
 *   breaks the rule, the place the lines from the first above 0.5 to the
 *   last, or the most likely line when none is.
 *
 * With `halving` after the output path, it compares two ways to the line
 * the violation starts on instead: the choice among the section's lines,
 * and halving, a choice between the two halves of the lines left, asked
 * again of the chosen half until one line is left.
 *
 * `pinpoint.md` has the results.
 *
 *   bun eval/studies/pinpoint.ts [results.json] [halving]
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
import { judgeQuestion } from "#services/Jev.ts";

/** A real finding's violations, as marked by hand: the clearest first. */
interface Marked {
  readonly repo: string;
  readonly file: string;
  readonly rule: string;
  readonly ranges: ReadonlyArray<Range>;
}

type Answers = Record<
  string,
  { noul?: number; choice?: string; score?: number; probabilities?: Record<string, number> }
>;

const presets = new URL("../../presets/", import.meta.url);

/** Where the repos the labels are about are checked out, at `<owner>/<repo>`. */
const repos = process.env.ADHERE_EVAL_REPOS ?? join(homedir(), ".agents/repos");

/** Whether a preset still has a rule; the labels name two that are gone. */
const exists = (id: string) => existsSync(fileURLToPath(new URL(`${id}.md`, presets)));

const ruleOf = (id: string): Promise<Rule> =>
  readFile(new URL(`${id}.md`, presets), "utf8").then((text) =>
    Effect.runPromise(parseRuleMarkdown(text, id)),
  );

const ask = async (key: string, body: unknown): Promise<Answers> => {
  for (let attempt = 0; attempt < 6; attempt++) {
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

/** The rule as a question carries it: its description and its code under its words. */
const fieldsOf = (rule: Rule) => {
  const { question: _, ...fields } = judgeQuestion(rule).instructions;
  return fields;
};

const TENTHS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "last",
].map((ordinal) => `In the ${ordinal} tenth of \`code\``);

/** The line a position in the section, from 0 to 10 tenths, falls on. */
const lineAt = (section: Range, tenths: number): number => {
  const size = section.last - section.first + 1;
  return Math.min(section.last, section.first + Math.floor((tenths / 10) * size));
};

const mostLikely = (probabilities: Record<string, number> = {}): number =>
  Number(
    Object.entries(probabilities).reduce(
      (best, entry) => (entry[1] > best[1] ? entry : best),
      ["0", -1],
    )[0],
  );

const ordered = (first: number, last: number): Range =>
  first <= last ? { first, last } : { first: last, last: first };

const [output = "pinpoint-results.json", mode] = process.argv.slice(2);
const key = process.env.TYPESAFE_API_KEY;
if (key === undefined) {
  throw new Error(
    "usage: TYPESAFE_API_KEY=… bun eval/studies/pinpoint.ts [results.json] [halving]",
  );
}
const items = (
  JSON.parse(
    await readFile(new URL("violations.json", import.meta.url), "utf8"),
  ) as ReadonlyArray<Marked>
).filter((item) => exists(item.rule) && item.ranges.length > 0);
const rules = new Map<string, Rule>();
for (const id of new Set(items.map((item) => item.rule))) rules.set(id, await ruleOf(id));

/**
 * The line the violation starts on, by halving: a choice between the first
 * and second half of the non-blank lines left, asked again of the chosen
 * half until one line is left. Beside it, the choice among all the lines.
 */
const halve = async (
  fields: ReturnType<typeof fieldsOf>,
  keyed: Record<string, string | undefined>,
  written: ReadonlyArray<number>,
) => {
  const options = Object.fromEntries(written.map((n) => [String(n), null]));
  const chosen = ask(key, {
    model: "jev-latest",
    state: { code: keyed },
    questions: {
      start: {
        type: "choice",
        instructions: {
          question: "Which line of `code` does the code that breaks `rule` start on?",
          ...fields,
        },
        criteria: options,
      },
    },
  });
  let left = [...written];
  let rounds = 0;
  while (left.length > 1) {
    const middle = Math.ceil(left.length / 2);
    const [first, second] = [left.slice(0, middle), left.slice(middle)];
    const answers = await ask(key, {
      model: "jev-latest",
      state: { code: keyed },
      questions: {
        half: {
          type: "choice",
          instructions: {
            question:
              "In which of these ranges of `code`'s lines does the code that breaks `rule` start?",
            ...fields,
          },
          criteria: {
            first: `The lines keyed ${first[0]} to ${first.at(-1)}`,
            second: `The lines keyed ${second[0]} to ${second.at(-1)}`,
          },
        },
      },
    });
    left = answers.half?.choice === "second" ? second : first;
    rounds += 1;
  }
  const start = Number((await chosen).start?.choice ?? written[0]);
  return { halving: left[0] ?? written[0] ?? 0, choice: start, rounds };
};

const place = async (item: Marked) => {
  const truth = item.ranges;
  const lines = withoutComments(
    (await readFile(join(repos, item.repo, item.file), "utf8")).split("\n"),
    isNote,
  );
  const clearest = truth[0]!;
  const section = sectionsOf(lines).find(
    (s) => s.first <= clearest.first && clearest.first <= s.last,
  );
  if (section === undefined) return undefined;
  const rule = rules.get(item.rule)!;
  const fields = fieldsOf(rule);
  const numbers = Array.from(
    { length: section.last - section.first + 1 },
    (_, index) => section.first + index,
  );
  const code = numbers.map((n) => lines[n - 1] ?? "");
  const keyed = Object.fromEntries(numbers.map((n, index) => [String(n), code[index]]));
  const options = Object.fromEntries(numbers.map((n) => [String(n), null]));
  const written = numbers.filter((n) => (lines[n - 1] ?? "").trim() !== "");
  const inSection = truth.filter(
    (range) => range.first <= section.last && section.first <= range.last,
  );
  if (mode === "halving") {
    const { halving, choice } = await halve(fields, keyed, written);
    return {
      section,
      truth: inSection,
      places: {
        "choice (start line)": { first: choice, last: choice },
        "halving (start line)": { first: halving, last: halving },
      } as Record<string, Range>,
    };
  }

  const [tenths, choices, perLine] = await Promise.all([
    ask(key, {
      model: "jev-latest",
      state: { code: code.join("\n") },
      questions: {
        start: {
          type: "score",
          instructions: {
            question: "Where in `code` does the code that breaks `rule` start?",
            ...fields,
          },
          criteria: TENTHS,
        },
        end: {
          type: "score",
          instructions: {
            question: "Where in `code` does the code that breaks `rule` end?",
            ...fields,
          },
          criteria: TENTHS,
        },
      },
    }),
    ask(key, {
      model: "jev-latest",
      state: { code: keyed },
      questions: {
        start: {
          type: "choice",
          instructions: {
            question: "Which line of `code` does the code that breaks `rule` start on?",
            ...fields,
          },
          criteria: options,
        },
        end: {
          type: "choice",
          instructions: {
            question: "Which line of `code` does the code that breaks `rule` end on?",
            ...fields,
          },
          criteria: options,
        },
      },
    }),
    ask(key, {
      model: "jev-latest",
      state: { code: keyed },
      questions: Object.fromEntries(
        written.map((n) => [
          String(n),
          {
            type: "noul",
            instructions: {
              question: `Is \`code["${n}"]\` part of the code that breaks \`rule\`?`,
              ...fields,
            },
          },
        ]),
      ),
    }),
  ]);

  const yes = written.filter((n) => (perLine[String(n)]?.noul ?? 0) > 0.5);
  const top = written.reduce(
    (best, n) => ((perLine[String(n)]?.noul ?? 0) > (perLine[String(best)]?.noul ?? 0) ? n : best),
    written[0] ?? section.first,
  );
  return {
    section,
    truth: inSection,
    places: {
      section,
      "tenths (most likely)": ordered(
        lineAt(section, mostLikely(tenths.start?.probabilities)),
        lineAt(section, mostLikely(tenths.end?.probabilities) + 0.999),
      ),
      "tenths (expected)": ordered(
        lineAt(section, tenths.start?.score ?? 0),
        lineAt(section, (tenths.end?.score ?? 9) + 0.999),
      ),
      choice: ordered(
        Number(choices.start?.choice ?? section.first),
        Number(choices.end?.choice ?? section.last),
      ),
      lines: yes.length === 0 ? { first: top, last: top } : { first: yes[0]!, last: yes.at(-1)! },
    } as Record<string, Range>,
  };
};

const results: Array<
  { repo: string; file: string; rule: string } & NonNullable<Awaited<ReturnType<typeof place>>>
> = [];
const queue = [...items];
let done = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const placed = await place(item);
      if (placed !== undefined) {
        results.push({ repo: item.repo, file: item.file, rule: item.rule, ...placed });
      }
      done += 1;
      if (done % 40 === 0) console.error(`${done} placed`);
    }
  }),
);
await writeFile(output, JSON.stringify(results, null, 1));

/** Lines in a range. */
const size = ({ first, last }: Range) => last - first + 1;
const overlap = (a: Range, b: Range) =>
  Math.max(0, Math.min(a.last, b.last) - Math.max(a.first, b.first) + 1);
const median = (values: ReadonlyArray<number>) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
};

console.log(`${results.length} findings placed`);
for (const arm of Object.keys(results[0]?.places ?? {})) {
  const scored = results.map(({ section, places, truth }) => {
    const placed = places[arm] ?? section;
    const violating = truth.reduce((sum, range) => sum + overlap(placed, range), 0);
    return {
      hit: truth.some((range) => overlap(placed, range) > 0),
      lines: size(placed),
      /** Of the lines shown, the share that violate. */
      tight: violating / size(placed),
      /** Of the clearest violation's lines, the share shown. */
      covered: truth[0] === undefined ? 0 : overlap(placed, truth[0]) / size(truth[0]),
    };
  });
  const share = (pick: (s: (typeof scored)[number]) => number) =>
    scored.reduce((sum, s) => sum + pick(s), 0) / scored.length;
  console.log(
    `${arm.padEnd(22)} holds a violation ${(share((s) => Number(s.hit)) * 100).toFixed(0)}%, median ${median(scored.map((s) => s.lines))} lines shown, ${(share((s) => s.tight) * 100).toFixed(0)}% of them violating, ${(share((s) => s.covered) * 100).toFixed(0)}% of the clearest violation shown`,
  );
}
