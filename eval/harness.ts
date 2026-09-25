/**
 * The eval's harness. Each arm is a way of building adhere's request; the
 * harness asks Jev every Effect preset rule, once per arm, about each file
 * planted in `cases/` to break or follow a rule and each file of adhere's own
 * `src/`, one request per file as a cold `adhere lint` would. It scores the
 * arms against the planted files and the hand labels in `labels.json`, and
 * prints Markdown tables. `judge.ts` and each study in `studies/` hand it
 * their arms.
 *
 * Needs a TypeSafe AI API key, as `adhere lint` does, and sends one request
 * per file per arm. With a path as the first argument, also writes every
 * probability and each request's size and token usage there; with
 * `--rescore` and such a file, reports it again against the current labels
 * without asking Jev anything.
 */
import { DEFAULT_THRESHOLD } from "#config.ts";
import { loadRules } from "#rules.ts";
import { Credentials, CredentialsLive } from "#services/Credentials.ts";
import { type Body, type Lines, requestsOf, type Rules, tokensOf } from "#services/Jev.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Layer, Path, Schedule, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/unstable/http";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
/** Where the labeled pairs are counted. */
const THRESHOLDS = [0.7, 0.8, 0.9] as const;

/** A way of building adhere's request: every rule, as questions about one file. */
export type Ask = (model: string, lines: Lines, rules: Rules) => Body;

/** An arm: its name in the report, and how it builds the request. */
export type Arm = readonly [name: string, ask: Ask];

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
    }),
  ),
});
export type Run = typeof Run.Type;

const Answered = Schema.Struct({
  model: Schema.String,
  answers: Schema.Record(Schema.String, Schema.Struct({ noul: Schema.Finite })),
  usage: Schema.Struct({ input_tokens: Schema.Finite }),
});

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
  const jobs = arms.flatMap(([arm, build]) =>
    samples.flatMap((sample) =>
      requestsOf(build(MODEL, sample.lines, rules)).map((body) => ({ arm, sample, body })),
    ),
  );
  yield* Console.error(
    `${jobs.length} requests, ${samples.length} files for each of ${arms.length} arms`,
  );

  const apiKey = yield* (yield* Credentials).apiKey;
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk,
    HttpClient.transformResponse(Effect.timeout("60 seconds")),
    HttpClient.retryTransient({ schedule: Schedule.exponential("1 second"), times: 5 }),
  );
  const ask = Effect.fn("eval.ask")(function* (body: Body) {
    const request = yield* HttpClientRequest.bodyJson(
      HttpClientRequest.post(SYSTEM_ONE),
      body,
    ).pipe(Effect.orDie);
    const response = yield* client.execute(HttpClientRequest.bearerToken(request, apiKey));
    return yield* HttpClientResponse.schemaBodyJson(Answered)(response);
  });

  const answered = (yield* Effect.forEach(
    jobs,
    (job) => {
      const asked = Effect.map(ask(job.body), (response) => ({ ...job, response }));
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
      probability: answer.noul,
    })),
  );
  const requests = answered.map(({ arm, sample, body, response }) => {
    const questions = Object.values(body.questions);
    return {
      arm,
      sample: sample.name,
      questions: questions.length,
      stateBytes: JSON.stringify(body.state).length,
      questionBytes: questions.reduce<number>((sum, q) => sum + JSON.stringify(q).length, 0),
      estimated: tokensOf(body.state) + questions.reduce<number>((sum, q) => sum + tokensOf(q), 0),
      used: response.usage.input_tokens,
    };
  });
  const models = [...new Set(answered.map(({ response }) => response.model))].join(", ");
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
        "used / estimated tokens",
      ],
      arms.map(([arm]) => [
        arm,
        auc(of(arm, "breaks"), of(arm, "follows")).toFixed(3),
        `${separated(arm)}/${ruleIds.length}`,
        `${above(of(arm, "breaks"), DEFAULT_THRESHOLD)}/${of(arm, "breaks").length}`,
        `${above(of(arm, "follows"), DEFAULT_THRESHOLD)}/${of(arm, "follows").length}`,
        `${above(of(arm, "off-target"), DEFAULT_THRESHOLD)}/${of(arm, "off-target").length}`,
        `${above(of(arm, "src"), DEFAULT_THRESHOLD)}/${of(arm, "src").length}`,
        `${Math.min(...ratios(arm)).toFixed(2)} to ${Math.max(...ratios(arm)).toFixed(2)}`,
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
export const runStudy = (arms: ReadonlyArray<Arm>): void =>
  study(arms).pipe(
    // oxlint-disable-next-line effecttsgo/strict-effect-provide -- each study script is an entry point.
    Effect.provide(Layer.mergeAll(FetchHttpClient.layer, CredentialsLive)),
    // oxlint-disable-next-line effecttsgo/strict-effect-provide -- each study script is an entry point.
    Effect.provide(BunServices.layer),
    BunRuntime.runMain,
  );
