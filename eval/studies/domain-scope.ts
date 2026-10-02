/**
 * Whether the Effect preset, with its data and service rules scoped to domain
 * types and two rules removed, drops the false findings it reported on
 * darkmatter/agents and keeps the real ones. Each arm asks every rule of the
 * preset that judges a file, one request per file as a cold `adhere lint`
 * would: the rules as 0.14.0 shipped them, twice to show the noise, and as the
 * preset has them now. The labels are `domain-scope-labels.json`'s, read from
 * the repo at the commit `domain-scope.md` names; that file has the results.
 *
 *   bun eval/studies/domain-scope.ts [results.json]
 *   bun eval/studies/domain-scope.ts --rescore results.json
 */
import { isNote, withoutComments } from "#comments.ts";
import { DEFAULT_THRESHOLD, type Rules } from "#config.ts";
import { judgesFile, loadRules } from "#rules.ts";
import { CredentialsLive } from "#services/Credentials.ts";
import { judgeBody } from "#services/Jev.ts";
import { isTestFile } from "#services/SourceWalker.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import {
  Console,
  Effect,
  FileSystem,
  Layer,
  Path,
  Record,
  Schema,
} from "effect";
import { FetchHttpClient } from "effect/http";
import { homedir } from "node:os";
import { type Arm, askJev, auc, Run, type Sample, table } from "../harness.ts";

/** The release whose rules the baseline arms ask. */
const SHIPPED = "v0.14.0";
const THRESHOLDS = [0.7, DEFAULT_THRESHOLD, 0.9] as const;

/** Where the labeled repo is checked out, at `<owner>/<repo>`. */
const repos = process.env.ADHERE_EVAL_REPOS ?? `${homedir()}/.agents/repos`;

const Labels = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      repo: Schema.String,
      file: Schema.String,
      rule: Schema.String,
      label: Schema.Literals(["real", "debatable", "false"]),
      note: Schema.String,
    }),
  ),
);

const prefixed = (rules: Rules): Rules =>
  Record.fromEntries(
    Object.entries(rules).map(([id, rule]) => [`effect/${id}`, rule]),
  );

/** The preset's rules as a release shipped them, from the repo's history. */
const shippedRules = Effect.fn("eval.shippedRules")(function* (
  root: string,
  ref: string,
) {
  const path = yield* Path.Path;
  const directory =
    yield* (yield* FileSystem.FileSystem).makeTempDirectoryScoped();
  const extracted = Bun.spawnSync(
    [
      "sh",
      "-c",
      `git archive ${ref} presets/effect | tar -x -C "${directory}"`,
    ],
    {
      cwd: root,
    },
  );
  if (extracted.exitCode !== 0) {
    return yield* Effect.die(
      `git archive ${ref}: ${extracted.stderr.toString()}`,
    );
  }
  return yield* loadRules(path.join(directory, "presets", "effect"));
});

const percent = (part: number, whole: number) =>
  whole === 0 ? "–" : `${Math.round((100 * part) / whole)}%`;

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve(import.meta.dirname, "../..");

  const shipped = prefixed(yield* shippedRules(root, SHIPPED));
  const current = prefixed(
    yield* loadRules(path.join(root, "presets", "effect")),
  );
  const ARMS: ReadonlyArray<readonly [name: string, rules: Rules]> = [
    ["0.14.0", shipped],
    ["0.14.0, again", shipped],
    ["domain scope", current],
    ["domain scope, again", current],
  ];
  const rulesOf = new Map(ARMS);

  const labels = yield* Schema.decodeUnknownEffect(Labels)(
    yield* fs.readFileString(
      path.join(import.meta.dirname, "domain-scope-labels.json"),
    ),
  );
  const nameOf = (entry: { readonly repo: string; readonly file: string }) =>
    `${entry.repo}/${entry.file}`;
  const files = [
    ...new Map(labels.map((entry) => [nameOf(entry), entry.file])).entries(),
  ].sort();
  const samples = yield* Effect.forEach(
    files,
    ([name, file]) =>
      Effect.map(fs.readFileString(path.join(repos, name)), (text) => ({
        name,
        lines: text.split("\n"),
        test: isTestFile(file),
      })),
    { concurrency: 16 },
  );

  const [first, second] = process.argv.slice(2);
  const saved = first === "--rescore" ? second : undefined;
  // Tests and the rest are asked apart, each with the rules that judge it, as lint asks them.
  const runs: ReadonlyArray<Run> =
    saved === undefined
      ? yield* Effect.forEach([false, true], (test) => {
          const group: ReadonlyArray<Sample> = samples.filter(
            (sample) => sample.test === test,
          );
          const arms: ReadonlyArray<Arm> = ARMS.map(([arm, rules]) => [
            arm,
            (model, lines) =>
              judgeBody(
                model,
                withoutComments(lines, isNote),
                Record.filter(rules, (rule) => judgesFile(rule, test)),
              ),
          ]);
          return askJev(arms, group, {}, true);
        })
      : [
          yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Run))(
            yield* fs.readFileString(saved),
          ),
        ];
  const run: Run = {
    models: [
      ...new Set(runs.flatMap((r) => r.models.split(", ")).filter(Boolean)),
    ].join(", "),
    judgments: runs.flatMap((r) => r.judgments),
    requests: runs.flatMap((r) => r.requests),
  };
  if (saved === undefined && first !== undefined) {
    yield* fs.writeFileString(first, `${JSON.stringify(run, null, 2)}\n`);
    yield* Console.error(`wrote ${first}`);
  }

  const scores = new Map(
    run.judgments.map((j) => [
      `${j.arm}\u0000${j.sample}\u0000${j.rule}`,
      j.probability,
    ]),
  );
  /** A rule the arm does not have scores 0, as lint, which does not ask it, reports nothing. */
  const scoreOf = (arm: string, sample: string, rule: string) =>
    scores.get(`${arm}\u0000${sample}\u0000${rule}`) ?? 0;

  const decided = labels.filter((entry) => entry.label !== "debatable");
  const count = (label: string) =>
    labels.filter((entry) => entry.label === label).length;
  yield* Console.log(
    `${run.models}: ${samples.length} files; ${labels.length} labeled findings (${count("real")} real, ${count("false")} false, ${count("debatable")} debatable).\n`,
  );

  /** Whether lint reports it: above the rule's own threshold, or the default. */
  const reportedBy = (arm: string, sample: string, rule: string) =>
    scoreOf(arm, sample, rule) >
    (rulesOf.get(arm)?.[rule]?.threshold ?? DEFAULT_THRESHOLD);

  const rowsOf = (arm: string, entries: typeof decided) =>
    entries.map((entry) => ({
      real: entry.label === "real",
      score: scoreOf(arm, nameOf(entry), entry.rule),
      reported: reportedBy(arm, nameOf(entry), entry.rule),
    }));
  const counted = (rows: ReturnType<typeof rowsOf>) => {
    const real = rows.filter((row) => row.real).length;
    return `${real} / ${rows.length - real} (${percent(real, rows.length)})`;
  };

  yield* Console.log(
    "Real / false among the labeled findings each arm reports, with precision: the share real. As lint reports is above each rule's own threshold.\n",
  );
  yield* Console.log(
    table(
      [
        "arm",
        "AUC",
        ...THRESHOLDS.map((t) => `real / false at ${t}`),
        "as lint reports",
      ],
      ARMS.map(([arm]) => {
        const rows = rowsOf(arm, decided);
        return [
          arm,
          auc(
            rows.filter((row) => row.real).map((row) => row.score),
            rows.filter((row) => !row.real).map((row) => row.score),
          ).toFixed(3),
          ...THRESHOLDS.map((t) =>
            counted(rows.filter((row) => row.score > t)),
          ),
          counted(rows.filter((row) => row.reported)),
        ];
      }),
    ),
  );

  const labeledRules = [...new Set(labels.map((entry) => entry.rule))].sort();
  yield* Console.log(
    "\nPer rule, real / false / debatable as lint reports them:\n",
  );
  yield* Console.log(
    table(
      ["rule", ...ARMS.map(([arm]) => arm)],
      labeledRules.map((rule) => [
        rule,
        ...ARMS.map(([arm]) => {
          const shown = labels.filter(
            (entry) =>
              entry.rule === rule && reportedBy(arm, nameOf(entry), rule),
          );
          const of = (label: string) =>
            shown.filter((entry) => entry.label === label).length;
          return `${of("real")} / ${of("false")} / ${of("debatable")}`;
        }),
      ]),
    ),
  );

  // Findings no one labeled that the new rules report and neither 0.14.0 run does: to label.
  const labeled = new Set(
    labels.map((entry) => `${nameOf(entry)}\u0000${entry.rule}`),
  );
  const reported = (arm: string) =>
    new Set(
      run.judgments
        .filter((j) => j.arm === arm && reportedBy(arm, j.sample, j.rule))
        .map((j) => `${j.sample}\u0000${j.rule}`)
        .filter((pair) => !labeled.has(pair)),
    );
  const [before, again, ...after] = ARMS.map(([arm]) => reported(arm));
  const fresh = [...new Set(after.flatMap((pairs) => [...pairs]))].filter(
    (pair) => !before?.has(pair) && !again?.has(pair),
  );
  yield* Console.log(
    `\nUnlabeled findings lint reports: ${before?.size} and ${again?.size} by 0.14.0, ${after.map((pairs) => pairs.size).join(" and ")} by domain scope, ${fresh.length} of them by neither 0.14.0 run.`,
  );
  for (const pair of fresh.sort()) {
    const [sample = "", rule = ""] = pair.split("\u0000");
    const each = ARMS.map(([arm]) =>
      scoreOf(arm, sample, rule).toFixed(2),
    ).join(" ");
    yield* Console.log(`- ${rule} on ${sample}: ${each}`);
  }
});

program.pipe(
  Effect.scoped,
  Effect.provide(Layer.mergeAll(FetchHttpClient.layer, CredentialsLive)),
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
