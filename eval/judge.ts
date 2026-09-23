/**
 * Compares ways of asking Jev whether a file breaks a rule. `cases/` plants,
 * for each Effect preset rule, files that break it and files that follow it.
 * Every arm asks every rule of every file, one request per file as a cold
 * `adhere lint` would, over the planted files and adhere's own `src/`: 0.4's
 * rules in the state, adhere's questions without their criteria, and
 * adhere's questions as it sends them.
 *
 *   bun eval/judge.ts [results.json]
 *
 * Needs a TypeSafe AI API key, as `adhere lint` does, and sends one request
 * per file per arm. With a path, also writes every probability and each
 * request's size and token usage there.
 */
import { DEFAULT_THRESHOLD, examplesOf, type Rule } from "#config.ts";
import { loadRules } from "#rules.ts";
import { Credentials, CredentialsLive } from "#services/Credentials.ts";
import {
  type Body,
  judgeBody,
  type Lines,
  requestsOf,
  type Rules,
  tokensOf,
} from "#services/Jev.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Layer, Path, Record, Schedule, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/unstable/http";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";

type Ask = (model: string, lines: Lines, rules: Rules) => Body;

const numbered = (lines: Lines) => lines.map((line, index) => `${index + 1} | ${line}`).join("\n");

/** A rule as 0.4 held it: the code to write as `reference`, and the code not to as `avoid`. */
const asHeld = (rule: Rule) => {
  const { good, bad } = examplesOf(rule);
  return {
    description: rule.description,
    ...(good === undefined ? {} : { reference: good.code }),
    ...(bad === undefined ? {} : { avoid: bad.code }),
  };
};

/** adhere 0.4: every rule in the state, each question reaching its own rule by path. */
const inState: Ask = (model, lines, rules) => {
  const held = Record.map(rules, asHeld);
  const field = (id: string, key: "avoid" | "description" | "reference") =>
    `state.rules["${id}"].${key}`;
  return {
    model,
    state: { code: numbered(lines), rules: held },
    questions: Record.map(held, (rule, id) => ({
      type: "noul",
      instructions:
        rule.reference === undefined
          ? `Does state.code contain the pattern shown in ${field(id, "avoid")}, which ${field(id, "description")} rules out? Answer no if nothing in this file resembles it.`
          : `Does state.code diverge from the pattern shown in ${field(id, "reference")}${
              rule.avoid === undefined
                ? ""
                : `, for example by doing what ${field(id, "avoid")} shows`
            }, as described by ${field(id, "description")}? Answer no if the pattern does not apply to this file.`,
    })),
  };
};

/** adhere's questions without their criteria, which TypeSafe says to try both with and without. */
const withoutCriteria: Ask = (model, lines, rules) => {
  const body = judgeBody(model, lines, rules);
  return {
    ...body,
    questions: Record.map(body.questions, ({ type, instructions }) => ({ type, instructions })),
  };
};

/** In report order. `current` is what adhere sends. */
const arms: ReadonlyArray<readonly [string, Ask]> = [
  ["0.4", inState],
  ["no criteria", withoutCriteria],
  ["current", judgeBody],
];

type Label = "breaks" | "follows";

interface Sample {
  readonly name: string;
  readonly lines: Lines;
  /** The rule a planted file was written for, and which side of it the file is on. */
  readonly planted?: { readonly rule: string; readonly label: Label };
}

/** A planted file is a fenced block whose info string is `ts breaks` or `ts follows`. */
const FENCE = /^```ts (breaks|follows)\n([\s\S]*?)\n```$/gm;

const plantedIn = (rule: string, text: string): ReadonlyArray<Sample> =>
  Array.from(text.matchAll(FENCE), (match, index) => ({
    name: `${rule}#${index + 1}`,
    lines: (match[2] ?? "").split("\n"),
    planted: { rule, label: match[1] === "breaks" ? "breaks" : "follows" },
  }));

const Answered = Schema.Struct({
  model: Schema.String,
  answers: Schema.Record(Schema.String, Schema.Struct({ noul: Schema.Finite })),
  usage: Schema.Struct({ input_tokens: Schema.Finite }),
});

/** Where a probability falls: on a planted file's own rule, another rule, or adhere's source. */
type Kind = Label | "off-target" | "src";

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
      ? sample.planted.label
      : "off-target";

/** The chance a random breaking file outscores a random following one; ties count half. */
const auc = (positives: ReadonlyArray<number>, negatives: ReadonlyArray<number>): number => {
  let wins = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      wins += positive > negative ? 1 : positive === negative ? 0.5 : 0;
    }
  }
  return wins / (positives.length * negatives.length);
};

const above = (probabilities: ReadonlyArray<number>) =>
  `${probabilities.filter((p) => p > DEFAULT_THRESHOLD).length}/${probabilities.length}`;

const row = (cells: ReadonlyArray<string>) => `| ${cells.join(" | ")} |`;

const table = (header: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) =>
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

const main = Effect.gen(function* () {
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

  const answered = yield* Effect.forEach(
    jobs,
    (job) => Effect.map(ask(job.body), (response) => ({ ...job, response })),
    { concurrency: 8 },
  );

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

  const of = (arm: string, kind: Kind, rule?: string) =>
    judgments
      .filter((j) => j.arm === arm && j.kind === kind && (rule === undefined || j.rule === rule))
      .map((j) => j.probability);
  const ruleIds = Object.keys(rules).sort();
  const separated = (arm: string) =>
    ruleIds.filter(
      (rule) => Math.min(...of(arm, "breaks", rule)) > Math.max(...of(arm, "follows", rule)),
    ).length;
  const ratios = (arm: string) =>
    requests.filter((r) => r.arm === arm).map((r) => r.used / r.estimated);

  const models = [...new Set(answered.map(({ response }) => response.model))].join(", ");
  const breaking = planted.filter((sample) => sample.planted?.label === "breaks").length;
  yield* Console.log(
    `${models}: ${ruleIds.length} rules, ${planted.length} planted files (${breaking} break their rule, ${planted.length - breaking} follow it), ${sources.length} files of src/.\n`,
  );
  yield* Console.log(
    table(
      [
        "arm",
        "AUC",
        "rules separated",
        `breaks > ${DEFAULT_THRESHOLD}`,
        `follows > ${DEFAULT_THRESHOLD}`,
        `off-target > ${DEFAULT_THRESHOLD}`,
        `src > ${DEFAULT_THRESHOLD}`,
        "used / estimated tokens",
      ],
      arms.map(([arm]) => [
        arm,
        auc(of(arm, "breaks"), of(arm, "follows")).toFixed(3),
        `${separated(arm)}/${ruleIds.length}`,
        above(of(arm, "breaks")),
        above(of(arm, "follows")),
        above(of(arm, "off-target")),
        above(of(arm, "src")),
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

  const out = process.argv[2];
  if (out !== undefined) {
    yield* fs.writeFileString(out, `${JSON.stringify({ models, judgments, requests }, null, 2)}\n`);
    yield* Console.error(`wrote ${out}`);
  }
});

main.pipe(
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this script is its own entry point.
  Effect.provide(Layer.mergeAll(FetchHttpClient.layer, CredentialsLive)),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this script is its own entry point.
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
