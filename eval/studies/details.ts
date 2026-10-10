/**
 * Whether details, the prose a rule carries after its description, help Jev
 * tell a real finding from a false one. Each arm asks every rule of the
 * typescript, react, and security presets about each file a hand-labeled
 * finding is in, one request per file as a cold `adhere lint` would, with the
 * rules as the presets have them or with details added: why the rule holds,
 * where it does not apply, both, its matchers' words in place of its
 * matchers, or all three. A finding is reported as lint reports it: above 0.8, with a yes
 * to every `appliesTo` and to no `excludeIf`. The labels are
 * `presets-labels.json`'s, read from the repos as `sufficiency.ts` reads them,
 * and the added details `more-details.md`'s; `details.md` has the results.
 *
 *   bun eval/studies/details.ts [results.json]
 *   bun eval/studies/details.ts --rescore results.json
 */
import { isNote, withoutComments } from "#comments.ts";
import { DEFAULT_THRESHOLD, type Rule, type RuleId, type Rules } from "#config.ts";
import { priceOf } from "#pricing.ts";
import { judgeBody } from "#services/Jev.ts";
import { Console, Effect, FileSystem, Record, Schema } from "effect";
import {
  type Arm,
  aucOf,
  countedAt,
  judgeRepos,
  labeledRepos,
  nameOf,
  REPO_THRESHOLDS,
  reported,
  run,
  Run,
  scoredIn,
  table,
  verdictKey,
  verdictsOf,
} from "../harness.ts";
import moreDetails from "./more-details.md" with { type: "text" };

/** The repos the first round of labels came from; dub was labeled after, held out. */
const FIRST_REPOS = ["immich-app/immich", "honojs/hono", "excalidraw/excalidraw"];

interface Added {
  readonly why: string;
  readonly scope: string;
}

/** Under each `## <rule id>`, a `### why` and a `### scope` paragraph. */
const addedOf = (text: string): Readonly<Record<RuleId, Added>> =>
  Object.fromEntries(
    text
      .split(/^## /m)
      .slice(1)
      .map((section) => {
        const [id = "", ...parts] = section.split(/^### /m);
        const under = (name: string) =>
          parts
            .find((part) => part.startsWith(`${name}\n`))
            ?.slice(name.length)
            .trim() ?? "";
        return [id.trim(), { why: under("why"), scope: under("scope") }];
      }),
  );

const added = addedOf(moreDetails);

const adding =
  (paragraphs: (added: Added) => string) =>
  (rules: Rules): Rules =>
    Record.map(rules, (rule, id) => {
      const own = added[id];
      return own === undefined ? rule : { ...rule, details: paragraphs(own) };
    });

/** The rule without its matchers, their words a paragraph of details after any it has: a sentence each. */
const matchersAsDetails = (rule: Rule): Rule => {
  const { appliesTo = [], excludeIf = [], ...rest } = rule;
  const sentences = [
    ...appliesTo.map((matcher) => `It applies only to ${matcher}.`),
    ...excludeIf.map((matcher) => `It does not apply to ${matcher}.`),
  ].join(" ");
  if (sentences === "") return rest;
  return {
    ...rest,
    details: rest.details === undefined ? sentences : `${rest.details}\n\n${sentences}`,
  };
};

const both = adding(({ why, scope }) => `${why}\n\n${scope}`);

/** Each arm's rules, as it changes the presets'. The first two are the baseline, asked twice. */
const ARMS: ReadonlyArray<readonly [name: string, rules: (rules: Rules) => Rules]> = [
  ["shipped", (rules) => rules],
  ["shipped, again", (rules) => rules],
  ["why", adding(({ why }) => why)],
  ["scope", adding(({ scope }) => scope)],
  ["why and scope", both],
  ["matchers as details", (rules) => Record.map(rules, matchersAsDetails)],
  ["all as details", (rules) => Record.map(both(rules), matchersAsDetails)],
];

/** As `adhere lint` asks: without the file's comments, but its `@adhere` notes. */
const arms: ReadonlyArray<Arm> = ARMS.map(([name, change]) => [
  name,
  (model, lines, rules) => judgeBody(model, withoutComments(lines, isNote), change(rules)),
]);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const { rules, labels, files, samples, kept } = yield* labeledRepos(
    ["presets-labels.json"],
    ARMS.map(([, change]) => change),
  );
  const unwritten = Object.keys(rules).filter(
    (id) => added[id] === undefined || added[id].why === "" || added[id].scope === "",
  );
  if (unwritten.length > 0) {
    return yield* Effect.die(`more-details.md lacks a why or a scope for ${unwritten.join(", ")}`);
  }

  const [first, second] = process.argv.slice(2);
  const saved = first === "--rescore" ? second : undefined;
  const judged: Run =
    saved === undefined
      ? yield* judgeRepos(arms, samples, rules)
      : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Run))(
          yield* fs.readFileString(saved),
        );
  if (saved === undefined && first !== undefined) {
    yield* fs.writeFileString(first, `${JSON.stringify(judged, null, 2)}\n`);
    yield* Console.error(`wrote ${first}`);
  }
  const verdicts = verdictsOf(judged);

  const decided = kept.filter((entry) => entry.label !== "debatable");
  const count = (label: string) => kept.filter((entry) => entry.label === label).length;
  yield* Console.log(
    `${judged.models}: ${Object.keys(rules).length} rules; ${samples.length} files, ${files.length - samples.length} left out as too long; ${kept.length} labeled findings (${count("real")} real, ${count("false")} false, ${count("debatable")} debatable).\n`,
  );

  const scored = (arm: string, entries: typeof decided) => scoredIn(verdicts, arm, entries);

  yield* Console.log(
    "Real / false among the labeled findings lint would report, with precision: the share real.\n",
  );
  yield* Console.log(
    table(
      [
        "arm",
        "AUC, judge",
        "AUC, as reported",
        ...REPO_THRESHOLDS.map((t) => `real / false at ${t}`),
        "cost",
      ],
      arms.map(([arm]) => {
        const rows = scored(arm, decided);
        const tokens = judged.requests
          .filter((r) => r.arm === arm)
          .reduce((sum, r) => sum + r.used, 0);
        return [
          arm,
          aucOf(rows, (row) => row.verdict.judge),
          aucOf(rows, (row) => row.lint),
          ...REPO_THRESHOLDS.map((t) => countedAt(rows, t)),
          `$${((tokens / 1e6) * (priceOf("jev-latest") ?? 0)).toFixed(2)}`,
        ];
      }),
    ),
  );

  const first3 = decided.filter((entry) => FIRST_REPOS.includes(entry.repo));
  const dub = decided.filter((entry) => !FIRST_REPOS.includes(entry.repo));
  yield* Console.log(`\nBy repo, at ${DEFAULT_THRESHOLD}:\n`);
  yield* Console.log(
    table(
      ["arm", "immich, hono, excalidraw: AUC", "real / false", "dub: AUC", "real / false"],
      arms.map(([arm]) => {
        const a = scored(arm, first3);
        const b = scored(arm, dub);
        return [
          arm,
          aucOf(a, (row) => row.lint),
          countedAt(a, DEFAULT_THRESHOLD),
          aucOf(b, (row) => row.lint),
          countedAt(b, DEFAULT_THRESHOLD),
        ];
      }),
    ),
  );

  yield* Console.log(`\nPer rule, real / false reported at ${DEFAULT_THRESHOLD}:\n`);
  yield* Console.log(
    table(
      ["rule", ...arms.map(([arm]) => arm)],
      Object.keys(rules)
        .sort()
        .map((rule) => [
          rule,
          ...arms.map(([arm]) => {
            const rows = scored(
              arm,
              decided.filter((entry) => entry.rule === rule),
            ).filter((row) => reported(row.verdict, DEFAULT_THRESHOLD));
            const real = rows.filter((row) => row.real).length;
            return `${real} / ${rows.length - real}`;
          }),
        ]),
    ),
  );

  // Findings no one labeled: those an arm reports that neither shipped run does, to label.
  const labeled = new Set(labels.map((entry) => `${nameOf(entry)}\u0000${entry.rule}`));
  const unlabeled = (arm: string) =>
    new Set(
      [...verdicts.entries()]
        .filter(([key, verdict]) => {
          const [of, sample = "", rule = ""] = key.split("\u0000");
          return (
            of === arm &&
            !labeled.has(`${sample}\u0000${rule}`) &&
            reported(verdict, DEFAULT_THRESHOLD)
          );
        })
        .map(([key]) => key.split("\u0000").slice(1).join("\u0000")),
    );
  const [baseline, again] = [unlabeled("shipped"), unlabeled("shipped, again")];
  yield* Console.log(`\nUnlabeled findings reported at ${DEFAULT_THRESHOLD}:\n`);
  yield* Console.log(
    table(
      ["arm", "reported", "also reported by shipped", "by neither shipped run"],
      arms.map(([arm]) => {
        const own = [...unlabeled(arm)];
        return [
          arm,
          String(own.length),
          String(own.filter((pair) => baseline.has(pair)).length),
          String(own.filter((pair) => !baseline.has(pair) && !again.has(pair)).length),
        ];
      }),
    ),
  );
  const fresh = [...new Set(arms.slice(2).flatMap(([arm]) => [...unlabeled(arm)]))].filter(
    (pair) => !baseline.has(pair) && !again.has(pair),
  );
  if (fresh.length > 0) {
    yield* Console.log(`\nReported by a details arm and by neither shipped run, to label:\n`);
    for (const pair of fresh.sort()) {
      const [sample = "", rule = ""] = pair.split("\u0000");
      const scores = arms.map(([arm]) => {
        const verdict = verdicts.get(verdictKey(arm, sample, rule));
        return verdict === undefined ? "–" : verdict.judge.toFixed(2);
      });
      yield* Console.log(`- ${rule} on ${sample}: ${scores.join(" ")}`);
    }
  }
});

run(program);
