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
 * With `inline`, it measures the lines end to end, in the one request lint
 * sends to locate a finding, its state the file's keyed sections: the choice
 * of a section, beside a choice of the start line and one of the end line,
 * either for every section, among its lines, keeping the pair of the section
 * chosen, or once among all the file's lines, for a file of at most 255.
 * Each line option is its text.
 *
 * `pinpoint.md` has the results.
 *
 *   bun eval/studies/pinpoint.ts [results.json] [halving | inline]
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
import { judgeBody, judgeQuestion, requestsOf, tokensOf } from "#services/Jev.ts";

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
const exists = (id: string) => existsSync(fileURLToPath(new URL(`${id}/RULE.md`, presets)));

const ruleOf = (id: string): Promise<Rule> =>
  readFile(new URL(`${id}/RULE.md`, presets), "utf8").then((text) =>
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
    "usage: TYPESAFE_API_KEY=… bun eval/studies/pinpoint.ts [results.json] [halving | inline]",
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

/** A choice among `lines`, each option its text, of where the code that breaks the rule starts or ends. */
const lineChoice = (
  fields: ReturnType<typeof fieldsOf>,
  where: string,
  edge: "start" | "end",
  numbers: ReadonlyArray<number>,
  lines: ReadonlyArray<string>,
) => ({
  type: "choice" as const,
  instructions: {
    question: `Which line of ${where} does the code that breaks \`rule\` ${edge} on?`,
    ...fields,
  },
  criteria: Object.fromEntries(
    numbers.map((n) => [String(n), (lines[n - 1] ?? "").trim().slice(0, 120)]),
  ),
});

/** How many requests each inline placement took. */
const split: Array<number> = [];

/**
 * The finding's place end to end, in lint's one locate request: the section
 * chosen, and the lines, from a start and end choice for every section or
 * once for the whole file.
 */
const inline = async (item: Marked) => {
  const lines = withoutComments(
    (await readFile(join(repos, item.repo, item.file), "utf8")).split("\n"),
    isNote,
  );
  const sections = sectionsOf(lines);
  const fields = fieldsOf(rules.get(item.rule)!);
  const written = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index).filter(
      (n) => (lines[n - 1] ?? "").trim() !== "",
    );
  const everyLine = written(1, lines.length);
  const state = judgeBody("jev-latest", lines, {}).state;
  // Jev reads the state and one question within 32k tokens: a long file's lines, as options, do not fit.
  const whole =
    everyLine.length <= 255 &&
    tokensOf(state) + tokensOf(lineChoice(fields, "`code`", "start", everyLine, lines)) <= 31_000;
  const questions: Record<string, unknown> = {
    section: {
      type: "choice",
      instructions: {
        question: "Which entry of `code` contains the code that breaks `rule`?",
        ...fields,
      },
      criteria: Object.fromEntries(sections.map((_, index) => [String(index + 1), null])),
    },
    ...Object.fromEntries(
      sections.flatMap((section, index) => {
        const numbers = written(section.first, section.last);
        const where = `\`code["${index + 1}"]\``;
        return numbers.length === 0
          ? []
          : [
              [`start:${index + 1}`, lineChoice(fields, where, "start", numbers, lines)],
              [`end:${index + 1}`, lineChoice(fields, where, "end", numbers, lines)],
            ];
      }),
    ),
    ...(whole
      ? {
          start: lineChoice(fields, "`code`", "start", everyLine, lines),
          end: lineChoice(fields, "`code`", "end", everyLine, lines),
        }
      : {}),
  };
  // Split as lint splits a body over Jev's context, and asked together.
  const requests = requestsOf({ model: "jev-latest", state, questions });
  const answers: Answers = Object.assign(
    {},
    ...(await Promise.all(requests.map((request) => ask(key, request)))),
  );
  split.push(requests.length);
  const chosen = Number(answers.section?.choice ?? 1);
  const section = sections[chosen - 1] ?? sections[0]!;
  const edge = (id: string, fallback: number) => Number(answers[id]?.choice ?? fallback);
  const inSection = ordered(
    edge(`start:${chosen}`, section.first),
    edge(`end:${chosen}`, section.last),
  );
  return {
    section,
    truth: [...item.ranges],
    places: {
      "section chosen": section,
      "lines, per section": inSection,
      ...(whole
        ? { "lines, whole file": ordered(edge("start", 1), edge("end", lines.length)) }
        : {}),
    } as Record<string, Range>,
  };
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
      const placed = await (mode === "inline" ? inline(item) : place(item)).catch((problem) => {
        // A file Jev counts as over its context, as lint skips one: counted, not placed.
        console.error(`${item.repo}/${item.file}: ${String(problem).slice(0, 120)}`);
        return undefined;
      });
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
if (split.length > 0) {
  console.log(
    `requests per finding: ${split.filter((n) => n === 1).length} took one, ${split.filter((n) => n > 1).length} more, at most ${Math.max(...split)}`,
  );
}
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
