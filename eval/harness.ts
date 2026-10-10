/**
 * The eval's harness. Each arm is a way of building adhere's request; the
 * harness asks Jev every Effect preset rule, once per arm, about each file
 * planted in `cases/` to break or follow a rule and each file of adhere's own
 * `src/`, one request per file as a cold `adhere lint` would. An arm with a
 * provider asks it instead, as a config with that provider would. It scores
 * the arms against the planted files and the hand labels in `labels.json`,
 * and prints Markdown tables. `judge.ts` and each study in `studies/` hand it
 * their arms. At its end are the four repos `studies/presets.md` labeled
 * findings on, read and scored for the studies that judge them.
 *
 * Needs a TypeSafe AI API key, as `adhere lint` does, when an arm asks Jev,
 * and sends one request per file per arm. With a path as the first argument,
 * also writes every probability and each request's size, token usage, and
 * time there; with `--rescore` and such a file, reports it again against the
 * current labels without asking anything.
 */
import { isNote, withoutComments } from "#comments.ts";
import { DEFAULT_THRESHOLD, type RuleId } from "#config.ts";
import { questionsOf, type SystemOneQuestion } from "#providers/systemOne.ts";
import { judgesFile, loadRules } from "#rules.ts";
import { Credentials, CredentialsLive } from "#services/Credentials.ts";
import { askProvider, NoulAnswers } from "#services/Jev.http.ts";
import { type Body, fits, type Lines, requestsOf, type Rules, tokensOf } from "#services/Jev.ts";
import { isTestFile } from "#services/SourceWalker.ts";
import { inScope } from "#workflows/audit.ts";
import { jev, type Provider } from "@drkmttr/adhere";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Duration, Effect, FileSystem, Path, Record, Redacted, Schema } from "effect";
import { homedir } from "node:os";

const MODEL = "jev-latest";
/** Where the labeled pairs are counted. */
const THRESHOLDS = [0.7, 0.8, 0.9] as const;

/** A way of building adhere's request: every rule, as questions about one file. */
export type Ask = (model: string, lines: Lines, rules: Rules) => Body<SystemOneQuestion>;

/**
 * An arm: its name in the report, how it builds the request, and the provider
 * that answers it, as a config's would; Jev's, with adhere's key and the
 * request's model, when it names none.
 */
export type Arm = readonly [name: string, ask: Ask, provider?: Provider];

/** The value `share` of the way through `values`, sorted: 0.5 for the median. */
export const percentile = (values: ReadonlyArray<number>, share: number): number | undefined =>
  [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(share * values.length))];

/** Request times as the reports give them: the median and the 95th percentile. */
export const timingOf = (times: ReadonlyArray<number>): string =>
  times.length === 0 ? "–" : `${percentile(times, 0.5)} / ${percentile(times, 0.95)}`;

/** A file's lines numbered the way adhere numbers them, for arms that build their own state. */
export const numbered = (lines: Lines): string =>
  lines.map((line, index) => `${index + 1} | ${line}`).join("\n");

type Side = "breaks" | "follows";

export interface Sample {
  readonly name: string;
  readonly lines: Lines;
  /** The rule a planted file was written for, and which side of it the file is on. */
  readonly planted?: { readonly rule: string; readonly side: Side };
}

/** A planted file is a fenced block whose info string is `ts breaks` or `ts follows`. */
const FENCE = /^```ts (breaks|follows)\n([\s\S]*?)\n```$/gm;

const plantedIn = (rule: string, text: string): ReadonlyArray<Sample> =>
  Array.from(text.matchAll(FENCE), (match, index) => ({
    name: `${rule}#${index + 1}`,
    lines: (match[2] ?? "").split("\n"),
    planted: { rule, side: match[1] === "breaks" ? "breaks" : "follows" },
  }));

/** A pair judged by hand: whether the file really breaks the rule, and why. */
const Labels = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      rule: Schema.String,
      file: Schema.String,
      label: Schema.Literals(["real", "debatable", "false"]),
      note: Schema.String,
    }),
  ),
);

/** Every probability of a run, and each request's size and token usage. */
export const Run = Schema.Struct({
  models: Schema.String,
  judgments: Schema.Array(
    Schema.Struct({
      arm: Schema.String,
      sample: Schema.String,
      rule: Schema.String,
      kind: Schema.Literals(["breaks", "follows", "off-target", "src"]),
      probability: Schema.Finite,
    }),
  ),
  requests: Schema.Array(
    Schema.Struct({
      arm: Schema.String,
      sample: Schema.String,
      questions: Schema.Finite,
      stateBytes: Schema.Finite,
      questionBytes: Schema.Finite,
      estimated: Schema.Finite,
      used: Schema.Finite,
      /** How long the request took, sent beside the others; runs saved before it was recorded lack it. */
      ms: Schema.optionalKey(Schema.Finite),
    }),
  ),
});
export type Run = typeof Run.Type;

/** Where a probability falls: on a planted file's own rule, another rule, or adhere's source. */
type Kind = Side | "off-target" | "src";

interface Judgment {
  readonly arm: string;
  readonly sample: string;
  readonly rule: string;
  readonly kind: Kind;
  readonly probability: number;
}

const kindOf = (sample: Sample, rule: string): Kind =>
  sample.planted === undefined
    ? "src"
    : sample.planted.rule === rule
      ? sample.planted.side
      : "off-target";

/** The chance a random positive outscores a random negative; ties count half. */
export const auc = (positives: ReadonlyArray<number>, negatives: ReadonlyArray<number>): number => {
  let wins = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      wins += positive > negative ? 1 : positive === negative ? 0.5 : 0;
    }
  }
  return wins / (positives.length * negatives.length);
};

const above = (probabilities: ReadonlyArray<number>, threshold: number) =>
  probabilities.filter((p) => p > threshold).length;

const row = (cells: ReadonlyArray<string>) => `| ${cells.join(" | ")} |`;

export const table = (header: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) =>
  [row(header), row(header.map(() => "---")), ...rows.map(row)].join("\n");

const readTree = Effect.fn("eval.readTree")(function* (
  directory: string,
  keep: (file: string) => boolean,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const files = (yield* fs.readDirectory(directory, { recursive: true })).filter(keep).sort();
  return yield* Effect.forEach(files, (file) =>
    Effect.map(fs.readFileString(path.join(directory, file)), (text) => ({ file, text })),
  );
});

/**
 * Asks Jev each arm's request for each file: every probability, and each
 * request's usage. A request Jev refuses stops the run, unless `skipRefused`,
 * for a run long enough that losing what it paid for costs more: then the
 * refusal is printed and the request left out.
 */
export const askJev = Effect.fn("eval.askJev")(function* (
  arms: ReadonlyArray<Arm>,
  samples: ReadonlyArray<Sample>,
  rules: Rules,
  skipRefused = false,
) {
  const jobs = arms.flatMap(([arm, build, provider]) =>
    samples.flatMap((sample) =>
      requestsOf(build(provider?.model ?? MODEL, sample.lines, rules)).map((body) => ({
        arm,
        sample,
        body,
        provider,
      })),
    ),
  );
  yield* Console.error(
    `${jobs.length} requests, ${samples.length} files for each of ${arms.length} arms`,
  );

  // A provider that names a saved key gets it, as adhere passes it: read once, when one asks.
  const credentials = yield* Credentials;
  const savedKeys = {
    typesafe: yield* Effect.cached(credentials.key("typesafe")),
    openai: yield* Effect.cached(credentials.key("openai")),
  };
  /** One request's answers from the arm's provider, or Jev's for the request's model, as adhere asks it. */
  const ask = (body: Body<SystemOneQuestion>, provider: Provider = jev({ model: body.model })) =>
    Effect.gen(function* () {
      const apiKey =
        provider.savedKey === undefined
          ? undefined
          : Redacted.value(yield* savedKeys[provider.savedKey]);
      return yield* askProvider(
        provider,
        body.state,
        questionsOf(body.questions),
        NoulAnswers,
        apiKey,
      );
    });

  const answered = (yield* Effect.forEach(
    jobs,
    (job) => {
      const asked = Effect.map(
        Effect.timed(ask(job.body, job.provider)),
        ([elapsed, response]) => ({
          ...job,
          response,
          ms: Math.round(Duration.toMillis(elapsed)),
        }),
      );
      return skipRefused
        ? asked.pipe(
            Effect.catch((problem) =>
              Effect.as(
                Console.error(`left out ${job.arm}, ${job.sample.name}: ${String(problem)}`),
                undefined,
              ),
            ),
          )
        : asked;
    },
    { concurrency: 8 },
  )).filter((job) => job !== undefined);

  const judgments: ReadonlyArray<Judgment> = answered.flatMap(({ arm, sample, response }) =>
    Object.entries(response.answers).map(([rule, answer]) => ({
      arm,
      sample: sample.name,
      rule,
      kind: kindOf(sample, rule),
      probability: answer,
    })),
  );
  const requests = answered.map(({ arm, sample, body, response, ms }) => {
    const questions = Object.values(body.questions);
    return {
      arm,
      sample: sample.name,
      questions: questions.length,
      stateBytes: JSON.stringify(body.state).length,
      questionBytes: questions.reduce<number>((sum, q) => sum + JSON.stringify(q).length, 0),
      estimated: tokensOf(body.state) + questions.reduce<number>((sum, q) => sum + tokensOf(q), 0),
      used: response.inputTokens ?? 0,
      ms,
    };
  });
  const models = [
    ...new Set(
      answered.map(({ response, provider }) => response.model ?? provider?.model ?? MODEL),
    ),
  ].join(", ");
  return { models, judgments, requests };
});

const study = Effect.fn("eval.study")(function* (arms: ReadonlyArray<Arm>) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve(import.meta.dirname, "..");

  const rules = yield* loadRules(path.join(root, "presets", "effect"));
  const cases = yield* readTree(path.join(root, "eval", "cases"), (file) => file.endsWith(".md"));
  const planted = cases.flatMap(({ file, text }) => plantedIn(file.slice(0, -".md".length), text));
  const unknown = planted.filter((sample) => rules[sample.planted?.rule ?? ""] === undefined);
  if (unknown.length > 0) {
    return yield* Effect.die(
      `no preset rule for ${unknown.map((sample) => sample.name).join(", ")}`,
    );
  }
  const sources = yield* readTree(
    path.join(root, "src"),
    (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
  );
  const samples: ReadonlyArray<Sample> = [
    ...planted,
    ...sources.map(({ file, text }) => ({ name: `src/${file}`, lines: text.split("\n") })),
  ];
  const labels = yield* Schema.decodeUnknownEffect(Labels)(
    yield* fs.readFileString(path.join(root, "eval", "labels.json")),
  );
  const labeled = new Map(labels.map((entry) => [`${entry.file} ${entry.rule}`, entry.label]));

  const [first, second] = process.argv.slice(2);
  const saved = first === "--rescore" ? second : undefined;
  const { models, judgments, requests }: Run =
    saved === undefined
      ? yield* askJev(arms, samples, rules)
      : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Run))(
          yield* fs.readFileString(saved),
        );

  const labelOf = (j: Judgment) => labeled.get(`${j.sample} ${j.rule}`);
  /** A planted violation, or a pair labeled real. */
  const isPositive = (j: Judgment) => j.kind === "breaks" || labelOf(j) === "real";
  /** A planted compliant file, or a pair labeled false. */
  const isNegative = (j: Judgment) => j.kind === "follows" || labelOf(j) === "false";
  const judgedBy = (arm: string) => judgments.filter((j) => j.arm === arm);
  const of = (arm: string, kind: Kind, rule?: string) =>
    judgedBy(arm)
      .filter((j) => j.kind === kind && (rule === undefined || j.rule === rule))
      .map((j) => j.probability);
  const ruleIds = Object.keys(rules).sort();
  const separated = (arm: string) =>
    ruleIds.filter(
      (rule) => Math.min(...of(arm, "breaks", rule)) > Math.max(...of(arm, "follows", rule)),
    ).length;
  const counted = (arm: string, threshold: number) => {
    const flagged = judgedBy(arm).filter((j) => j.probability > threshold);
    return `${flagged.filter(isPositive).length} / ${flagged.filter(isNegative).length}`;
  };
  const ratios = (arm: string) =>
    requests.filter((r) => r.arm === arm).map((r) => r.used / r.estimated);
  /** The questions an arm sent that came back with no answer, such as those a provider refused. */
  const unanswered = (arm: string) =>
    requests.filter((r) => r.arm === arm).reduce((sum, r) => sum + r.questions, 0) -
    judgedBy(arm).length;
  const timing = (arm: string) =>
    timingOf(requests.flatMap((r) => (r.arm === arm && r.ms !== undefined ? [r.ms] : [])));

  const breaking = planted.filter((sample) => sample.planted?.side === "breaks").length;
  const count = (label: string) => labels.filter((entry) => entry.label === label).length;
  yield* Console.log(
    `${models}: ${ruleIds.length} rules, ${planted.length} planted files (${breaking} break their rule, ${planted.length - breaking} follow it), ${sources.length} files of src/, ${labels.length} labeled pairs (${count("real")} real, ${count("debatable")} debatable, ${count("false")} false).\n`,
  );
  yield* Console.log(
    "Caught is planted violations plus pairs labeled real; wrong is planted compliant files plus pairs labeled false. Hard AUC ranks the first against the second.\n",
  );
  yield* Console.log(
    table(
      ["arm", "hard AUC", ...THRESHOLDS.map((t) => `caught / wrong at ${t}`)],
      arms.map(([arm]) => [
        arm,
        auc(
          judgedBy(arm)
            .filter(isPositive)
            .map((j) => j.probability),
          judgedBy(arm)
            .filter(isNegative)
            .map((j) => j.probability),
        ).toFixed(3),
        ...THRESHOLDS.map((t) => counted(arm, t)),
      ]),
    ),
  );
  yield* Console.log(`\nAbove the default threshold, ${DEFAULT_THRESHOLD}:\n`);
  yield* Console.log(
    table(
      [
        "arm",
        "planted AUC",
        "rules separated",
        "breaks",
        "follows",
        "off-target",
        "src",
        "unanswered",
        "used / estimated tokens",
        "median / p95 ms",
      ],
      arms.map(([arm]) => [
        arm,
        auc(of(arm, "breaks"), of(arm, "follows")).toFixed(3),
        `${separated(arm)}/${ruleIds.length}`,
        `${above(of(arm, "breaks"), DEFAULT_THRESHOLD)}/${of(arm, "breaks").length}`,
        `${above(of(arm, "follows"), DEFAULT_THRESHOLD)}/${of(arm, "follows").length}`,
        `${above(of(arm, "off-target"), DEFAULT_THRESHOLD)}/${of(arm, "off-target").length}`,
        `${above(of(arm, "src"), DEFAULT_THRESHOLD)}/${of(arm, "src").length}`,
        String(unanswered(arm)),
        `${Math.min(...ratios(arm)).toFixed(2)} to ${Math.max(...ratios(arm)).toFixed(2)}`,
        timing(arm),
      ]),
    ),
  );
  const cell = (arm: string, rule: string) =>
    `${of(arm, "breaks", rule)
      .map((p) => p.toFixed(2))
      .join(" ")} / ${of(arm, "follows", rule)
      .map((p) => p.toFixed(2))
      .join(" ")}`;
  yield* Console.log(`\nPer rule, breaks / follows:\n`);
  yield* Console.log(
    table(
      ["rule", ...arms.map(([arm]) => arm)],
      ruleIds.map((rule) => [rule, ...arms.map(([arm]) => cell(arm, rule))]),
    ),
  );

  const unlabeled = judgments.filter(
    (j) =>
      (j.kind === "off-target" || j.kind === "src") &&
      j.probability > THRESHOLDS[0] &&
      labelOf(j) === undefined,
  );
  if (unlabeled.length > 0) {
    yield* Console.log(`\nAbove ${THRESHOLDS[0]} without a label, to add to eval/labels.json:\n`);
    for (const j of unlabeled) {
      yield* Console.log(`- ${j.rule} on ${j.sample}: ${j.probability.toFixed(2)} (${j.arm})`);
    }
  }

  if (saved === undefined && first !== undefined) {
    yield* fs.writeFileString(
      first,
      `${JSON.stringify({ models, judgments, requests }, null, 2)}\n`,
    );
    yield* Console.error(`wrote ${first}`);
  }
});

/** Runs a study's arms and prints its report: the entry point of `judge.ts` and each study. */
export const runStudy = (arms: ReadonlyArray<Arm>): void => run(study(arms));

/** Runs a study as its script's entry point, with adhere's saved keys and Bun's services. */
export const run = <A, E>(
  program: Effect.Effect<A, E, Credentials | FileSystem.FileSystem | Path.Path>,
): void =>
  program.pipe(
    Effect.provide(CredentialsLive),
    Effect.provide(BunServices.layer),
    BunRuntime.runMain,
  );

/**
 * The four repos `presets.md` labeled findings on, dub, immich, hono, and
 * excalidraw, as `details.ts` and `providers-repos.ts` judge them: checked
 * out at `<owner>/<repo>` under ADHERE_EVAL_REPOS or ~/.agents/repos, at the
 * commits `presets.md` names. The findings are of the typescript, react, and
 * security presets' rules, labeled in `studies/`.
 */
const REPOS = process.env.ADHERE_EVAL_REPOS ?? `${homedir()}/.agents/repos`;
const REPO_PRESETS = ["typescript", "react", "security"] as const;
/** Where the repos' studies count what lint would report. */
export const REPO_THRESHOLDS = [0.7, DEFAULT_THRESHOLD, 0.9] as const;

const RepoLabels = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      repo: Schema.String,
      file: Schema.String,
      rule: Schema.String,
      label: Schema.Literals(["real", "debatable", "false"]),
    }),
  ),
);
export type RepoLabel = (typeof RepoLabels.Type)[number];

/** A labeled finding's file, as its sample is named: `<owner>/<repo>/<path>`. */
export const nameOf = (entry: { readonly repo: string; readonly file: string }) =>
  `${entry.repo}/${entry.file}`;

/**
 * The presets' rules, each id under its preset; the labels in `labelFiles`,
 * in `studies/`, of rules the presets still have; the files they are in, read
 * from the repos; and the labels of the files kept. As lint does, a file too
 * long for Jev's context is left out: here, too long with any of `changes`
 * made to the rules.
 */
export const labeledRepos = Effect.fn("eval.labeledRepos")(function* (
  labelFiles: ReadonlyArray<string>,
  changes: ReadonlyArray<(rules: Rules) => Rules> = [(rules) => rules],
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve(import.meta.dirname, "..");

  const rules: Rules = Object.fromEntries(
    (yield* Effect.forEach(REPO_PRESETS, (preset) =>
      Effect.map(loadRules(path.join(root, "presets", preset)), (loaded) =>
        Object.entries(loaded).map(([id, rule]) => [`${preset}/${id}`, rule] as const),
      ),
    )).flat(),
  );
  const labels = (yield* Effect.forEach(labelFiles, (name) =>
    Effect.flatMap(
      fs.readFileString(path.join(root, "eval", "studies", name)),
      Schema.decodeUnknownEffect(RepoLabels),
    ),
  ))
    .flat()
    .filter((entry) => rules[entry.rule] !== undefined);
  const files = [...new Map(labels.map((entry) => [nameOf(entry), entry.file])).entries()].sort();
  const read = yield* Effect.forEach(
    files,
    ([name, file]) =>
      Effect.map(fs.readFileString(path.join(REPOS, name)), (text) => ({
        name,
        path: path.join(REPOS, name),
        text,
        lines: text.split("\n"),
        test: isTestFile(file),
      })),
    { concurrency: 16 },
  );
  const samples = read.filter((sample) =>
    changes.every((change) => fits(withoutComments(sample.lines, isNote), change(rules))),
  );
  const judged = new Set(samples.map((sample) => sample.name));
  const kept = labels.filter((entry) => judged.has(nameOf(entry)));
  return { rules, labels, files, samples, kept };
});

/**
 * Asks each arm about the samples as `askJev` does, leaving out what is
 * refused: the test files with the rules that judge test files, and the
 * rest with the rest, as lint asks them. One run of both.
 */
export const judgeRepos = Effect.fn("eval.judgeRepos")(function* (
  arms: ReadonlyArray<Arm>,
  samples: ReadonlyArray<Sample & { readonly test: boolean }>,
  rules: Rules,
) {
  const runs = yield* Effect.forEach([false, true], (test) => {
    const group = samples.filter((sample) => sample.test === test);
    return group.length === 0
      ? Effect.succeed({ models: "", judgments: [], requests: [] })
      : askJev(
          arms,
          group,
          Record.filter(rules, (rule) => judgesFile(rule, test)),
          true,
        );
  });
  return {
    models: [...new Set(runs.flatMap((r) => r.models.split(", ")).filter(Boolean))].join(", "),
    judgments: runs.flatMap((r) => r.judgments),
    requests: runs.flatMap((r) => r.requests),
  } satisfies Run;
});

/** A rule's answers for one file in one arm: its judge question's, and its matchers'. */
export interface Verdict {
  judge: number;
  readonly appliesTo: Array<number>;
  readonly excludeIf: Array<number>;
}

/** Whether lint reports it at `threshold`: above it, and in the rule's scope by its matchers. */
export const reported = (verdict: Verdict, threshold: number) =>
  verdict.judge > threshold && inScope(verdict);

/** Where `verdictsOf` keeps a rule's verdict for a file in an arm. */
export const verdictKey = (arm: string, sample: string, rule: RuleId) =>
  `${arm}\u0000${sample}\u0000${rule}`;

/** Each rule's answers per arm and file, from a run's judgments. A matcher's key is `<kind>:<rule id>:<index>`. */
export const verdictsOf = (run: Run): ReadonlyMap<string, Verdict> => {
  const verdicts = new Map<string, Verdict>();
  for (const judgment of run.judgments) {
    const [kind = "", id] = judgment.rule.split(":");
    const key = verdictKey(judgment.arm, judgment.sample, id ?? kind);
    const verdict = verdicts.get(key) ?? { judge: Number.NaN, appliesTo: [], excludeIf: [] };
    if (id === undefined) verdict.judge = judgment.probability;
    else if (kind === "appliesTo") verdict.appliesTo.push(judgment.probability);
    else verdict.excludeIf.push(judgment.probability);
    verdicts.set(key, verdict);
  }
  return verdicts;
};

/** Each labeled finding an arm judged: whether it is real, its verdict, and how lint scores it, its judge score when it stands and 0 when not. */
export const scoredIn = (
  verdicts: ReadonlyMap<string, Verdict>,
  arm: string,
  entries: ReadonlyArray<RepoLabel>,
) =>
  entries.flatMap((entry) => {
    const verdict = verdicts.get(verdictKey(arm, nameOf(entry), entry.rule));
    return verdict === undefined || Number.isNaN(verdict.judge)
      ? []
      : [{ real: entry.label === "real", verdict, lint: reported(verdict, 0) ? verdict.judge : 0 }];
  });
type Scored = ReturnType<typeof scoredIn>[number];

/** How well `score` ranks the real findings among `rows` above the false ones. */
export const aucOf = (rows: ReadonlyArray<Scored>, score: (row: Scored) => number) =>
  auc(
    rows.filter((row) => row.real).map(score),
    rows.filter((row) => !row.real).map(score),
  ).toFixed(3);

export const percent = (part: number, whole: number) =>
  whole === 0 ? "–" : `${Math.round((100 * part) / whole)}%`;

/** Real / false among the findings in `rows` lint reports at `threshold`, with precision: the share real. */
export const countedAt = (rows: ReadonlyArray<Scored>, threshold: number) => {
  const shown = rows.filter((row) => reported(row.verdict, threshold));
  const real = shown.filter((row) => row.real).length;
  return `${real} / ${shown.length - real} (${percent(real, shown.length)})`;
};
