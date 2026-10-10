/**
 * The providers study on four open-source repos, beside `providers.ts` on the
 * Effect preset: how gpt-6-luna, clef, and clef-flash judge and locate
 * findings beside Jev, against `presets-labels.json`'s labeled findings on
 * dub, immich, hono, and excalidraw, read from the repos at the commits
 * `presets.md` names, as `details.ts` reads them. Those labels began with
 * Jev's findings; `providers-labels.json` labels the findings only the other
 * models reported, the same way.
 *
 * Judging asks every rule of the typescript, react, and security presets
 * about each file a labeled finding is in, one request per file as a cold
 * `adhere lint` would. A finding counts as lint reports it: above the
 * threshold, with a yes to every `appliesTo` and to no `excludeIf`. Locating
 * asks where each real finding with lines in `violations.json` is, through
 * adhere's own Jev service with the arm's model as its config's provider, as
 * lint locates a finding, and scores it as `pinpoint.md` does: whether the
 * chosen section, and the chosen lines, hold the violation. `providers.md`
 * has the results.
 *
 *   himitsu exec common/openai-api-key cloudflare-account-id cloudflare-api-token typesafe-api-key -- \
 *     bun eval/studies/providers-repos.ts [results.json]
 *   bun eval/studies/providers-repos.ts --rescore results.json
 */
import { isNote, withoutComments } from "#comments.ts";
import { DEFAULT_THRESHOLD, resolveConfig } from "#config.ts";
import type { Range } from "#excerpt.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { CredentialsLive } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { Jev, judgeBody } from "#services/Jev.ts";
import { cloudflare, openai, type Provider } from "@drkmttr/adhere";
import { Console, Effect, FileSystem, Layer, Path, Schedule, Schema } from "effect";
import {
  type Arm,
  type Ask,
  aucOf,
  countedAt,
  judgeRepos,
  labeledRepos,
  nameOf,
  percent,
  percentile,
  REPO_THRESHOLDS,
  reported,
  run,
  Run,
  scoredIn,
  table,
  timingOf,
  verdictKey,
  verdictsOf,
} from "../harness.ts";

/** Dollars per million input tokens, from each model's page on 2026-10-07; output is free for all four. */
const PRICES: Readonly<Record<string, number>> = {
  jev: 0.042,
  "gpt-6-luna": 0.1,
  clef: 0.24,
  "clef-flash": 0.09,
};

/** As `adhere lint` asks: without the file's comments, but its `@adhere` notes. */
const asSent: Ask = (model, lines, rules) =>
  judgeBody(model, withoutComments(lines, isNote), rules);

const { OPENAI_API_KEY = "", CLOUDFLARE_ACCOUNT_ID = "", CLOUDFLARE_API_TOKEN = "" } = process.env;
const providers: ReadonlyArray<Provider> = [
  openai({ apiKey: OPENAI_API_KEY }),
  cloudflare({ accountId: CLOUDFLARE_ACCOUNT_ID, apiToken: CLOUDFLARE_API_TOKEN, model: "clef" }),
  cloudflare({
    accountId: CLOUDFLARE_ACCOUNT_ID,
    apiToken: CLOUDFLARE_API_TOKEN,
    model: "clef-flash",
  }),
];
const arms: ReadonlyArray<Arm> = [
  ["jev", asSent],
  ...providers.map((provider): Arm => [provider.model, asSent, provider]),
];

const Span = Schema.Struct({ first: Schema.Finite, last: Schema.Finite });
const Violations = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      repo: Schema.String,
      file: Schema.String,
      rule: Schema.String,
      ranges: Schema.Array(Span),
    }),
  ),
);

/** Where an arm located a real finding: the section and lines it chose, when it chose them. */
const Placed = Schema.Struct({
  arm: Schema.String,
  sample: Schema.String,
  rule: Schema.String,
  section: Schema.optionalKey(Span),
  lines: Schema.optionalKey(Span),
});
type Placed = typeof Placed.Type;

/** What a run of this study saves: its judging, and where each arm located each real finding. */
const Results = Schema.fromJsonString(Schema.Struct({ run: Run, placed: Schema.Array(Placed) }));

const overlaps = (a: Range, b: Range) => a.first <= b.last && b.first <= a.last;

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  // Findings only the other models reported are labeled in `providers-labels.json`, the same way.
  const { rules, labels, files, samples, kept } = yield* labeledRepos([
    "presets-labels.json",
    "providers-labels.json",
  ]);
  const judged = new Map(samples.map((sample) => [sample.name, sample]));
  const violations = (yield* Schema.decodeUnknownEffect(Violations)(
    yield* fs.readFileString(path.join(import.meta.dirname, "violations.json")),
  )).filter((entry) => rules[entry.rule] !== undefined && judged.has(nameOf(entry)));

  /** Where each arm locates each real finding, as lint locates it: through Jev's service, the arm's model its config's provider. */
  const locate = Effect.forEach(arms, ([arm, , provider]) =>
    Effect.forEach(
      violations,
      (finding) =>
        Effect.gen(function* () {
          const sample = judged.get(nameOf(finding));
          const rule = rules[finding.rule];
          if (sample === undefined || rule === undefined) return undefined;
          const jev = yield* Jev;
          const located = yield* jev.locate(
            withoutComments(sample.lines, isNote),
            { [finding.rule]: rule },
            { path: sample.path, contents: sample.text },
          );
          const at = located[finding.rule];
          return {
            arm,
            sample: sample.name,
            rule: finding.rule,
            ...(at === undefined ? {} : { section: at.section }),
            ...(at?.lines === undefined ? {} : { lines: at.lines }),
          } satisfies Placed;
        }).pipe(
          Effect.retry({ schedule: Schedule.exponential("1 second"), times: 3 }),
          Effect.catch((problem) =>
            Effect.as(
              Console.error(
                `left out ${arm} locating ${finding.rule} on ${nameOf(finding)}: ${String(problem)}`,
              ),
              undefined,
            ),
          ),
        ),
      { concurrency: 8 },
    ).pipe(
      Effect.provide(
        JevLive.pipe(
          Layer.provide([
            CredentialsLive,
            Layer.succeed(
              AdhereConfig,
              resolveConfig({
                presets: [],
                rules: {},
                ...(provider === undefined ? {} : { provider }),
              }),
            ),
          ]),
        ),
      ),
    ),
  );

  const [first, second] = process.argv.slice(2);
  const saved = first === "--rescore" ? second : undefined;
  const results =
    saved === undefined
      ? yield* Effect.gen(function* () {
          const run = yield* judgeRepos(arms, samples, rules);
          yield* Console.error(
            `locating ${violations.length} real findings for each of ${arms.length} arms`,
          );
          const placed = (yield* locate).flat().filter((entry) => entry !== undefined);
          return { run, placed };
        })
      : yield* Schema.decodeUnknownEffect(Results)(yield* fs.readFileString(saved));
  if (saved === undefined && first !== undefined) {
    yield* fs.writeFileString(first, `${JSON.stringify(results, null, 2)}\n`);
    yield* Console.error(`wrote ${first}`);
  }
  const { run, placed } = results;
  const verdicts = verdictsOf(run);

  const decided = kept.filter((entry) => entry.label !== "debatable");
  const count = (label: string) => kept.filter((entry) => entry.label === label).length;
  yield* Console.log(
    `${run.models}: ${Object.keys(rules).length} rules; ${samples.length} files, ${files.length - samples.length} left out as too long; ${kept.length} labeled findings (${count("real")} real, ${count("false")} false, ${count("debatable")} debatable); ${violations.length} real findings with their lines marked.\n`,
  );

  const requestsOf = (arm: string) => run.requests.filter((r) => r.arm === arm);

  yield* Console.log(
    "Judging: real / false among the labeled findings lint would report, with precision. Unanswered counts questions a model left out, such as refusals.\n",
  );
  yield* Console.log(
    table(
      [
        "arm",
        "labeled findings answered",
        "AUC, judge",
        "AUC, as reported",
        ...REPO_THRESHOLDS.map((t) => `real / false at ${t}`),
        "unanswered",
        "input tokens",
        "cost",
        "median / p95 ms",
      ],
      arms.map(([arm]) => {
        const rows = scoredIn(verdicts, arm, decided);
        const asked = requestsOf(arm).reduce((sum, r) => sum + r.questions, 0);
        const answered = run.judgments.filter((j) => j.arm === arm).length;
        const tokens = requestsOf(arm).reduce((sum, r) => sum + r.used, 0);
        return [
          arm,
          `${rows.length} of ${decided.length}`,
          aucOf(rows, (row) => row.verdict.judge),
          aucOf(rows, (row) => row.lint),
          ...REPO_THRESHOLDS.map((t) => countedAt(rows, t)),
          `${asked - answered} of ${asked}`,
          tokens.toLocaleString("en-US"),
          `$${((tokens / 1e6) * (PRICES[arm] ?? 0)).toFixed(2)}`,
          timingOf(requestsOf(arm).flatMap((r) => (r.ms === undefined ? [] : [r.ms]))),
        ];
      }),
    ),
  );

  yield* Console.log(
    `\nLocating the ${violations.length} real findings with marked lines, as lint locates them: whether the section it shows, and the lines it underlines, hold the violation.\n`,
  );
  yield* Console.log(
    table(
      [
        "arm",
        "located",
        "section holds the violation",
        "lines hold the violation",
        "lines underlined, median",
      ],
      arms.map(([arm]) => {
        const own = placed.filter((entry) => entry.arm === arm);
        const ranges = (entry: Placed) =>
          violations.find((v) => nameOf(v) === entry.sample && v.rule === entry.rule)?.ranges ?? [];
        const holds = (range: Range | undefined, entry: Placed) =>
          range !== undefined && ranges(entry).some((violation) => overlaps(range, violation));
        const underlined = own.flatMap((entry) =>
          entry.lines === undefined ? [] : [entry.lines.last - entry.lines.first + 1],
        );
        return [
          arm,
          `${own.filter((entry) => entry.section !== undefined).length} of ${violations.length}`,
          percent(own.filter((entry) => holds(entry.section, entry)).length, violations.length),
          percent(own.filter((entry) => holds(entry.lines, entry)).length, violations.length),
          String(percentile(underlined, 0.5) ?? "–"),
        ];
      }),
    ),
  );

  // Findings no one labeled: those an arm reports at the default threshold, with every arm's judge score.
  const labeled = new Set(labels.map((entry) => `${nameOf(entry)}\u0000${entry.rule}`));
  const unlabeled = new Map<string, Set<string>>();
  for (const [key, verdict] of verdicts) {
    const [arm = "", sample = "", rule = ""] = key.split("\u0000");
    const pair = `${sample}\u0000${rule}`;
    if (!labeled.has(pair) && reported(verdict, DEFAULT_THRESHOLD)) {
      unlabeled.set(pair, (unlabeled.get(pair) ?? new Set()).add(arm));
    }
  }
  yield* Console.log(`\nUnlabeled findings reported at ${DEFAULT_THRESHOLD}, by arm:\n`);
  yield* Console.log(
    table(
      ["arm", "reported", "by this arm alone"],
      arms.map(([arm]) => {
        const own = [...unlabeled.values()].filter((by) => by.has(arm));
        return [arm, String(own.length), String(own.filter((by) => by.size === 1).length)];
      }),
    ),
  );
  if (unlabeled.size > 0) {
    yield* Console.log(
      `\nTo label, with each arm's judge score (${arms.map(([arm]) => arm).join(", ")}):\n`,
    );
    for (const pair of [...unlabeled.keys()].sort()) {
      const [sample = "", rule = ""] = pair.split("\u0000");
      const scores = arms.map(
        ([arm]) => verdicts.get(verdictKey(arm, sample, rule))?.judge.toFixed(2) ?? "–",
      );
      yield* Console.log(`- ${rule} on ${sample}: ${scores.join(" ")}`);
    }
  }
});

run(program);
