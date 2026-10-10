/**
 * Controlled cross-file accuracy pilot: four shipped rules, twelve fixed-gold
 * projects, six arms (including repeated baseline and combined reads).
 * New runs use compiler-rendered types/docs and complete outgoing declaration scopes.
 * Unversioned saved results describe historical declaration/count metadata and full source.
 *
 * bun eval/studies/semantic-reads.ts --plan
 * bun eval/studies/semantic-reads.ts # paid run; defaults to semantic-context-results.json
 * bun eval/studies/semantic-reads.ts --rescore eval/studies/semantic-reads-results.json
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { isNote, withoutComments } from "#comments.ts";
import { type ReadState, type Rules } from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { priceOf } from "#pricing.ts";
import { CredentialsLive } from "#services/Credentials.ts";
import { fits, judgeBody, matcherKey, requestsOf, tokensOf, type Lines } from "#services/Jev.ts";
import { SourceReads, SourceReadsLive, type SourceReadState } from "#services/SourceReads.ts";
import { suppressionsOf } from "#suppress.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Layer, Path, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { type Arm, askJev, auc, Run, type Sample, table } from "../harness.ts";
import { contextCases, type ContextCase } from "./semantic-reads-cases.ts";

const MODEL = "jev-1.13.0";
const THRESHOLD = 0.8;
const CONTEXT_FORMAT = "compiler-types-declaration-scopes-v1";
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const CASE_DIGEST = digest(contextCases);
const definitions = [
  { name: "baseline", reads: [] },
  { name: "baseline repeat", reads: [] },
  { name: "symbols", reads: ["symbols"] },
  { name: "references", reads: ["references"] },
  { name: "both", reads: ["symbols", "references"] },
  { name: "both repeat", reads: ["symbols", "references"] },
] as const;
const Saved = Schema.fromJsonString(
  Schema.Struct({
    caseDigest: Schema.String,
    ruleDigest: Schema.String,
    contextFormat: Schema.optionalKey(Schema.String),
    run: Run,
  }),
);
const keyOf = (arm: string, sample: string, rule: string) => `${arm}\u0000${sample}\u0000${rule}`;

function report(run: Run, rules: Rules, contextFormat?: string) {
  const scores = new Map(run.judgments.map((j) => [keyOf(j.arm, j.sample, j.rule), j.probability]));
  const probability = (arm: string, sample: ContextCase, rule = sample.rule) =>
    scores.get(keyOf(arm, sample.name, rule));
  const inScope = (arm: string, sample: ContextCase) => {
    const rule = rules[sample.rule]!;
    return (
      (rule.appliesTo ?? []).every(
        (_, index) => probability(arm, sample, matcherKey("appliesTo", sample.rule, index))! > 0.5,
      ) &&
      (rule.excludeIf ?? []).every(
        (_, index) => probability(arm, sample, matcherKey("excludeIf", sample.rule, index))! <= 0.5,
      )
    );
  };
  const complete = contextCases.filter((sample) =>
    definitions.every(({ name }) => {
      const rule = rules[sample.rule]!;
      const expected = [
        sample.rule,
        ...(rule.appliesTo ?? []).map((_, i) => matcherKey("appliesTo", sample.rule, i)),
        ...(rule.excludeIf ?? []).map((_, i) => matcherKey("excludeIf", sample.rule, i)),
      ];
      return expected.every((id) => probability(name, sample, id) !== undefined);
    }),
  );
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const flagged = (arm: string, sample: ContextCase) =>
    probability(arm, sample)! > THRESHOLD && inScope(arm, sample);
  const value = (arm: string, sample: ContextCase) => {
    const p = probability(arm, sample);
    return p === undefined ? "missing" : `${p.toFixed(3)}${inScope(arm, sample) ? "" : " (scope)"}`;
  };
  console.log(
    `Context format: ${contextFormat ?? "historical (declaration/count metadata and full related source)"}.`,
  );
  console.log(
    `Model: ${run.models}; complete matched cases: ${complete.length}/${contextCases.length}.`,
  );
  console.log(
    "Gold is target-only. Flag policy: p > 0.8 and shipped matchers pass. AUC uses raw judgment probabilities.",
  );
  console.log(
    table(
      ["arm", "correct", "TP", "FP", "FN", "AUC", "input tokens", "cost"],
      definitions.map(({ name }) => {
        const real = complete.filter((c) => c.label === "real");
        const negative = complete.filter((c) => c.label === "false");
        const tp = real.filter((c) => flagged(name, c)).length;
        const fp = negative.filter((c) => flagged(name, c)).length;
        const used = run.requests.filter((r) => r.arm === name).reduce((sum, r) => sum + r.used, 0);
        return [
          name,
          complete.length
            ? `${tp + negative.length - fp}/${complete.length} (${percent((tp + negative.length - fp) / complete.length)})`
            : "–",
          String(tp),
          String(fp),
          String(real.length - tp),
          real.length && negative.length
            ? auc(
                real.map((c) => probability(name, c)!),
                negative.map((c) => probability(name, c)!),
              ).toFixed(3)
            : "–",
          String(used),
          `$${((used * priceOf(MODEL)!) / 1_000_000).toFixed(5)}`,
        ];
      }),
    ),
  );
  console.log("\nPer case (scope means the shipped matchers suppressed a flag):");
  console.log(
    table(
      ["case", "gold", ...definitions.map(({ name }) => name)],
      contextCases.map((sample) => [
        sample.name,
        sample.label,
        ...definitions.map(({ name }) => value(name, sample)),
      ]),
    ),
  );
  console.log(
    "\nWithin-family violation separation (unchecked minus checked) and contamination (control minus checked):",
  );
  for (const mode of ["unchecked", "control"] as const) {
    console.log(
      table(
        [mode, ...definitions.map(({ name }) => name)],
        [...new Set(contextCases.map((c) => c.family))].map((family) => {
          const checked = contextCases.find((c) => c.family === family && c.variant === "checked")!;
          const other = contextCases.find((c) => c.family === family && c.variant === mode)!;
          return [
            family,
            ...definitions.map(({ name }) => {
              const a = probability(name, checked),
                b = probability(name, other);
              return a === undefined || b === undefined ? "missing" : (b - a).toFixed(3);
            }),
          ];
        }),
      ),
    );
  }
  for (const [first, second] of [
    ["baseline", "baseline repeat"],
    ["both", "both repeat"],
  ] as const) {
    const deltas = complete.map((c) => Math.abs(probability(first, c)! - probability(second, c)!));
    console.log(
      `${first} repeat: mean absolute p change ${deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(3) : "–"}; ${complete.filter((c) => flagged(first, c) !== flagged(second, c)).length} flag flips.`,
    );
  }
  console.log(
    "This is a 12-case synthetic capability pilot, not a population accuracy estimate. Repeats are not additional independent cases.",
  );
}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve(import.meta.dirname, "../..");
  const [first = path.join(root, "eval/studies/semantic-context-results.json"), second] =
    process.argv.slice(2);
  assert(
    first === "--plan" || first === "--rescore" || !first.startsWith("--"),
    "usage: bun eval/studies/semantic-reads.ts [new-results.json] | --plan | --rescore results.json",
  );
  if (first !== "--plan" && first !== "--rescore") {
    assert(
      !["semantic-reads-results.json", "semantic-reads-results.json.inputs.json"].includes(
        path.basename(first),
      ),
      "Historical semantic-reads artifacts are read-only; use --rescore or a fresh semantic-context result path.",
    );
    for (const output of [first, `${first}.inputs.json`])
      assert(!(yield* fs.exists(output)), `Refusing to overwrite ${output}; choose a fresh path.`);
  }
  const rules: Rules = Object.fromEntries(
    yield* Effect.forEach([...new Set(contextCases.map((c) => c.rule))], (id) =>
      Effect.map(fs.readFileString(path.join(root, "presets", id, "RULE.md")), (text) => ({
        id,
        text,
      })).pipe(
        Effect.flatMap(({ id, text }) =>
          Effect.map(parseRuleMarkdown(text, id), (rule) => [id, rule] as const),
        ),
      ),
    ),
  );
  const ruleDigest = digest(rules);
  if (first === "--rescore") {
    assert(second, "Provide the saved result path");
    const saved = yield* Schema.decodeUnknownEffect(Saved)(yield* fs.readFileString(second));
    assert.equal(
      saved.caseDigest,
      CASE_DIGEST,
      "Gold fixtures changed; do not rescore old results against new labels",
    );
    assert.equal(
      saved.ruleDigest,
      ruleDigest,
      "Rules changed; do not apply new questions or matchers to saved answers",
    );
    report(saved.run, rules, saved.contextFormat);
    return;
  }

  const temporary = yield* fs.makeTempDirectoryScoped({ prefix: "adhere-accuracy-" });
  const prepared = new Map<Lines, { sample: ContextCase; state: SourceReadState }>();
  const contexts: Record<string, SourceReadState> = {};

  const baselineByFamily = new Map<string, string>();
  const questionsByRule = new Map<string, string>();
  const samples: Sample[] = [];
  for (const sample of contextCases) {
    const directory = path.join(temporary, sample.name);
    yield* fs.makeDirectory(directory);
    for (const [file, text] of Object.entries(sample.files)) {
      yield* fs.writeFileString(path.join(directory, file), text);
    }
    yield* fs.writeFileString(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          types: [],
          lib: ["ES2022", "DOM"],
        },
        files: Object.keys(sample.files),
      }),
    );
    const text = sample.files["subject.ts"]!;
    const lines = withoutComments(suppressionsOf(text.split("\n")).lines, isNote);
    const state = (yield* Effect.flatMap(SourceReads, (reader) =>
      reader.read({ path: path.join(directory, "subject.ts"), contents: text }, lines, {
        symbols: true,
        references: true,
        includeComments: false,
      }),
    ).pipe(Effect.provide(SourceReadsLive(directory)))) as SourceReadState;
    assert(state.symbols, "Native provider must return requested compiler type/docs strings");
    assert(
      Object.keys(state.symbols).length > 0 &&
        Object.entries(state.symbols).every(
          ([name, hover]) =>
            name.length > 0 && typeof hover === "string" && hover.trim().length > 0,
        ),
      `${sample.name}: symbols must map identifier names to non-empty compiler type/docs strings`,
    );
    assert(state.references, "Native provider must return requested declaration snippets");
    // Helpers are declared on line 1; caller-only families have no outgoing neighbor declarations.
    const helper =
      sample.family === "timeout"
        ? "settings"
        : sample.family === "validation"
          ? "inspect"
          : undefined;
    assert.deepEqual(
      state.references,
      helper
        ? {
            [helper]: {
              "neighbor.ts": sample.files["neighbor.ts"]!.slice(
                0,
                sample.files["neighbor.ts"]!.indexOf("\n}") + 2,
              ),
            },
          }
        : {},
      `${sample.name}: expected the complete helper declaration without neighboring functions or location/count metadata`,
    );
    const baseline = JSON.stringify(
      judgeBody(MODEL, lines, { [sample.rule]: rules[sample.rule]! }),
    );
    if (baselineByFamily.has(sample.family))
      assert.equal(
        baseline,
        baselineByFamily.get(sample.family),
        "Paired target/request bytes must be identical",
      );
    else baselineByFamily.set(sample.family, baseline);
    prepared.set(lines, { sample, state });
    contexts[sample.name] = state;
    samples.push({
      name: sample.name,
      lines,
      planted: { rule: sample.rule, side: sample.label === "real" ? "breaks" : "follows" },
    });
  }
  const arms: Arm[] = definitions.map(({ name, reads }) => [
    name,
    (_model, lines) => {
      const own = prepared.get(lines)!;
      const judging = { [own.sample.rule]: rules[own.sample.rule]! };
      const state: ReadState = Object.fromEntries(reads.map((key) => [key, own.state[key]]));
      assert(
        fits(lines, judging, state),
        `${own.sample.name}/${name}: exceeds context; no silently omitted pilot cases`,
      );
      const body = judgeBody(MODEL, lines, judging, [], state);
      const questions = JSON.stringify(body.questions);
      if (questionsByRule.has(own.sample.rule))
        assert.equal(
          questions,
          questionsByRule.get(own.sample.rule),
          "All arms must have identical question bytes",
        );
      else questionsByRule.set(own.sample.rule, questions);
      return body;
    },
  ]);
  const jobs = arms.flatMap(([, build]) =>
    samples.flatMap((sample) => requestsOf(build(MODEL, sample.lines, rules))),
  );
  const estimated = jobs.reduce(
    (sum, body) =>
      sum +
      tokensOf(body.state) +
      Object.values(body.questions).reduce<number>((n, q) => n + tokensOf(q), 0),
    0,
  );
  assert(estimated <= 500_000, "Pilot exceeds its 500k estimated-input-token budget");
  yield* Console.error(
    `${jobs.length} requests; ${estimated} estimated input tokens; about $${((estimated * priceOf(MODEL)!) / 1_000_000).toFixed(5)} at the pinned model price. Cases/gold SHA256: ${CASE_DIGEST}`,
  );
  if (first === "--plan") {
    yield* Console.log(
      `Context format: ${CONTEXT_FORMAT}; references contain declarations, not callers.`,
    );
    yield* Console.log(
      table(
        ["case", "gold", "declaration paths", "snippet entries", "gold evidence"],
        contextCases.map((sample) => [
          sample.name,
          sample.label,
          [...new Set(Object.values(contexts[sample.name]!.references!).flatMap(Object.keys))].join(
            ", ",
          ),
          String(
            Object.values(contexts[sample.name]!.references!).reduce(
              (n, paths) => n + Object.keys(paths).length,
              0,
            ),
          ),
          sample.note,
        ]),
      ),
    );
    return;
  }
  // Save exact inputs/gold before asking; no API key is included in either artifact.
  yield* fs.writeFileString(
    `${first}.inputs.json`,
    `${JSON.stringify({ model: MODEL, caseDigest: CASE_DIGEST, ruleDigest, contextFormat: CONTEXT_FORMAT, cases: contextCases, rules, contexts, questionHashes: Object.fromEntries([...questionsByRule].map(([id, q]) => [id, digest(q)])) }, null, 2)}\n`,
    { flag: "wx" },
  );
  const run = yield* askJev(arms, samples, rules, true);
  yield* fs.writeFileString(
    first,
    `${JSON.stringify({ caseDigest: CASE_DIGEST, ruleDigest, contextFormat: CONTEXT_FORMAT, run }, null, 2)}\n`,
    { flag: "wx" },
  );
  report(run, rules, CONTEXT_FORMAT);
});

program.pipe(
  Effect.scoped,
  Effect.provide(Layer.mergeAll(FetchHttpClient.layer, CredentialsLive)),
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
