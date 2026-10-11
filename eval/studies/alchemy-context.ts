/**
 * Paired, fixed-gold Alchemy context study. Only --run <saved-manifest.json> sends paid requests.
 *
 * bun eval/studies/alchemy-context.ts --plan [fresh-output-directory]
 * bun eval/studies/alchemy-context.ts --run <saved-plan-directory>/manifest.json
 *
 * A plan uses a network-disabled simulated provider, including worst-case locating.
 * Paid execution is one-shot per plan, sequential, capped at $1 across all attempts.
 * Existing study files and /tmp/alchemy are strictly read-only.
 */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";

import {
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
  type ResolvedConfig,
  type Rule,
} from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { WalkUnavailable } from "#models/Audit.ts";
import { priceOf } from "#pricing.ts";
import { jev } from "#providers/jev.ts";
import { ContextOverflow, type Answered, type Provider } from "#providers/provider.ts";
import { requestOf, type SystemOneRequest } from "#providers/systemOne.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { AuditCache, type Answer, type Answers } from "#services/AuditCache.ts";
import { CredentialsLive } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { matcherKey, sufficiencyKey, tokensOf } from "#services/Jev.ts";
import { SourceReads, SourceReadsLive, type SourceReadState } from "#services/SourceReads.ts";
import { SourceWalker } from "#services/SourceWalker.ts";

import { walkFiles } from "#walk.ts";
import { executeAudit, inScope, planAudit, type AuditResult } from "#workflows/audit.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Layer, Path, Result, Schema, Stream } from "effect";
import { FetchHttpClient } from "effect/http";
import { ChildProcess } from "effect/process";
import { auc, table } from "../harness.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const STUDIES = join(ROOT, "eval/studies");
const TARGET = "/tmp/alchemy";
const HEAD = "8a284d039387f63690225b9c86c738696af52358";
const ID = "providers/idempotent-delete";
const MODEL = "jev-1.13.0";
const THRESHOLD = 0.8;
const PRICE = 0.042;
const RPM = 1200;
const CAP_NANODOLLARS = 1_000_000_000;
const NANODOLLARS_PER_TOKEN = 42;
const FORMAT = "alchemy-production-flat-declarations-builtins-v1";
const PREFIX = "alchemy-context-2026-10-11";
const POLICY = {
  model: MODEL,
  threshold: THRESHOLD,
  pricePerMillion: PRICE,
  rpm: RPM,
  maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
  maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  includeComments: false,
  nativeContext:
    "typeAware explicitly enables both maps; the experimental symbols-only adapter masks references",
  nativeBatchSize: 8,
  paidJobConcurrency: 1,
  mechanicalQuestions: "disabled by shipped preset/scopedRules membership; no fabricated tallies",
  simulation:
    "force every judge/matcher positive and locate first available line; estimates, not gold predictions",
  questionPolicy:
    "judge/matchers identical across arms; preserve and record production context-dependent sufficiency wording",
  budget:
    "reserve max(64000, estimated body tokens + 1000) before each attempt; retain failures/missing usage; reconcile valid usage",
};
const ARMS = [
  { name: "code-only", typeAware: false },
  { name: "symbols", typeAware: true },
  { name: "symbols+references", typeAware: true },
] as const;
type Arm = (typeof ARMS)[number];
const sha = (text: string | Uint8Array) => createHash("sha256").update(text).digest("hex");
const digest = (value: unknown) => sha(JSON.stringify(value));
const textOf = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

const Source = Schema.Struct({
  file: Schema.String,
  label: Schema.Literals(["real", "false"]),
  text: Schema.String,
  sha256: Schema.String,
});
type Source = typeof Source.Type;
const ContextFile = Schema.Struct({
  file: Schema.String,
  artifact: Schema.String,
  sha256: Schema.String,
  milliseconds: Schema.Finite,
});
type ContextFile = typeof ContextFile.Type;
const NativeState = Schema.Struct({
  symbols: Schema.Record(Schema.String, Schema.String),
  references: Schema.Record(Schema.String, Schema.String),
});
const Manifest = Schema.Struct({
  format: Schema.Literal(FORMAT),
  mode: Schema.Literal("plan"),
  checkout: Schema.Literal(TARGET),
  head: Schema.Literal(HEAD),
  model: Schema.Literal(MODEL),
  guard: Schema.String,
  goldDigest: Schema.String,
  ruleDigest: Schema.String,
  sources: Schema.Array(Source),
  contexts: Schema.Array(ContextFile),
});
type Attempt = {
  arm: string;
  file: string;
  kind: "judge" | "locate";
  ordinal: number;
  artifact: string;
  started: string;
  estimatedTokens: number;
  reservedTokens: number;
  chargedTokens: number;
  outcome: string;
  milliseconds: number;
  inputTokens?: number;
  returnedModel?: string;
  answers?: Answered["answers"];
  error?: string;
  wireVerified?: boolean;
  referencesPresent: boolean;
  bodyDigest: string;
  httpStatus?: number;
  rawResponse?: string;
};
type Job = {
  arm: string;
  file: string;
  gold: "real" | "false";
  probability: number | null;
  appliesTo: Array<number | null>;
  excludeIf: Array<number | null>;
  answered: boolean;
  flagged: boolean | null;
  status: string;
  result: AuditResult | null;
  cachedAnswer: Answer | null;
  error: string | null;
  milliseconds: number;
  fallback: string | null;
  questions: Record<string, string>;
};

const git = Effect.fn("alchemyContext.git")(
  function* (cwd: string, args: readonly string[]) {
    const process = yield* ChildProcess.make(
      "git",
      ["--no-pager", "--no-optional-locks", ...args],
      { cwd, stdin: "ignore", forceKillAfter: "2 seconds" },
    );
    const { code, output } = yield* Effect.all(
      { code: process.exitCode, output: Stream.mkString(Stream.decodeText(process.all)) },
      { concurrency: "unbounded" },
    );
    assert.equal(code, 0, `git ${args.join(" ")}: ${output}`);
    return output;
  },
  Effect.scoped,
  Effect.timeout("20 seconds"),
);

const inspect = Effect.fn("alchemyContext.inspect")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  assert.equal((yield* git(TARGET, ["rev-parse", "HEAD"])).trim(), HEAD, "Alchemy HEAD changed");
  const goldText = yield* fs.readFileString(join(STUDIES, "idempotent-delete.ts"));
  const block = goldText.match(/const VERDICTS[^=]*=\s*(\{[\s\S]*?\n\});/)?.[1];
  assert(block, "Cannot read frozen VERDICTS; never import its paid study entrypoint");
  const gold = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(Schema.Record(Schema.String, Schema.Literals(["real", "false"]))),
  )(block.replace(/,\s*}/g, "}"));
  assert.equal(Object.keys(gold).length, 51);
  assert.equal(Object.values(gold).filter((label) => label === "real").length, 9);
  assert.equal(Object.values(gold).filter((label) => label === "false").length, 42);
  const sources = yield* Effect.forEach(
    Object.entries(gold).sort(([a], [b]) => a.localeCompare(b)),
    ([file, label]) =>
      Effect.gen(function* () {
        const bytes = yield* fs.readFile(join(TARGET, file));
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        assert.equal(
          text,
          yield* git(TARGET, ["show", `${HEAD}:${file}`]),
          `${file} differs from HEAD`,
        );
        return { file, label, text, sha256: sha(bytes) };
      }),
    { concurrency: 4 },
  );
  const tracked = (yield* git(TARGET, ["ls-files", "-z"])).split("\0").filter(Boolean);
  const configNames = tracked.filter((file) =>
    /(?:^|\/)(?:[jt]sconfig[^/]*\.json|package\.json|(?:pnpm|package|yarn|bun)[^/]*lock[^/]*)$/.test(
      file,
    ),
  );
  // Native discovery can see these untracked configuration files too; record, never import them.
  for (const file of ["vite.config.ts", ".adhere/config.ts"])
    if (yield* fs.exists(join(TARGET, file))) configNames.push(file);
  const environment = yield* Effect.forEach(
    [...new Set(configNames)].sort(),
    (file) =>
      Effect.gen(function* () {
        const bytes = yield* fs.readFile(join(TARGET, file));
        const headText = tracked.includes(file)
          ? yield* git(TARGET, ["show", `${HEAD}:${file}`])
          : null;
        return {
          file,
          sha256: sha(bytes),
          headSha256: headText === null ? null : sha(headText),
          modified: headText === null || sha(bytes) !== sha(headText),
          ...(basename(file).startsWith("tsconfig")
            ? { text: new TextDecoder().decode(bytes) }
            : {}),
        };
      }),
    { concurrency: 4 },
  );
  const implementationNames = (yield* walkFiles(fs, path, join(ROOT, "src"), () => true))
    .filter((file) => file.endsWith(".ts"))
    .map((file) => `src/${file}`);
  implementationNames.push("package.json", "bun.lock", "eval/studies/alchemy-context.ts");
  const implementation = Object.fromEntries(
    yield* Effect.forEach(
      [...new Set(implementationNames)].sort(),
      (file) => Effect.map(fs.readFile(join(ROOT, file)), (bytes) => [file, sha(bytes)] as const),
      { concurrency: 8 },
    ),
  );
  const require = createRequire(import.meta.url);
  const sdk = require.resolve("typescript/package.json");
  const native = createRequire(sdk).resolve(
    `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
  );
  const sdkFiles = [
    ...(yield* walkFiles(fs, path, dirname(sdk), () => true))
      .filter((file) => /\.(?:js|json)$|\.d\.ts$/.test(file))
      .map((file) => join(dirname(sdk), file)),
    native,
    ...(yield* walkFiles(fs, path, join(dirname(native), "lib"), () => true))
      .filter((file) => file.endsWith(".d.ts") || file === "tsc" || file === "tsc.exe")
      .map((file) => join(dirname(native), "lib", file)),
  ];
  const compiler = Object.fromEntries(
    yield* Effect.forEach(
      sdkFiles,
      (file) => Effect.map(fs.readFile(file), (bytes) => [file, sha(bytes)] as const),
      { concurrency: 2 },
    ),
  );
  const ruleText = yield* fs.readFileString(join(ROOT, "presets/alchemy", ID, "RULE.md"));
  const rule = yield* parseRuleMarkdown(ruleText, join(ROOT, "presets/alchemy", ID, "RULE.md"));
  assert.equal(rule.appendState, undefined, "This study only uses the shipped Markdown rule");
  assert.equal(priceOf(MODEL), PRICE);
  const goldDigest = sha(goldText);
  const ruleDigest = sha(ruleText);
  const stamp = {
    head: HEAD,
    goldDigest,
    ruleDigest,
    environment,
    implementation,
    compiler,
    policy: POLICY,
    sources: sources.map(({ file, label, sha256 }) => ({ file, label, sha256 })),
  };
  return {
    sources,
    rule,
    ruleText,
    goldDigest,
    ruleDigest,
    environment,
    implementation,
    compiler,
    guard: digest(stamp),
    gitStatus: yield* git(TARGET, ["status", "--porcelain=v1", "--untracked-files=normal"]),
  };
});

const blockedFetch: typeof globalThis.fetch = Object.assign(
  () => Promise.reject<Response>(new Error("Dry plan forbids network requests")),
  {
    preconnect: () => {
      throw new Error("Dry plan forbids network preconnections");
    },
  },
);
const configOf = (arm: Arm, rule: Rule, provider: Provider): ResolvedConfig => ({
  model: MODEL,
  provider,
  threshold: THRESHOLD,
  sufficiencyThreshold: 0.6,
  rpm: RPM,
  typeAware: arm.typeAware,
  reads: [],
  includeComments: false,
  maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
  maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  rules: { [ID]: rule },
  scopedRules: [{ id: ID, rule, scope: TARGET, preset: "alchemy" }],
});

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const [mode, argument, extra] = process.argv.slice(2);
  assert(
    (mode === "--plan" || mode === "--run") && extra === undefined,
    "usage: --plan [fresh-directory] | --run saved-plan/manifest.json",
  );
  if (mode === "--run") assert(argument, "Paid execution requires an explicit saved plan path");
  const paid = mode === "--run";
  const before = yield* inspect();
  const saved = paid
    ? yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Manifest))(
        yield* fs.readFileString(resolve(argument!)),
      )
    : null;
  if (saved) {
    assert.equal(
      saved.guard,
      before.guard,
      "Sources, environment, rule, implementation or native format changed; make a new dry plan",
    );
    assert.deepEqual(saved.sources, before.sources, "Saved source/gold snapshot changed");
    assert.equal(saved.goldDigest, before.goldDigest);
    assert.equal(saved.ruleDigest, before.ruleDigest);
    assert.equal(saved.contexts.length, 51, "Plan did not prepare all labeled files");
  }
  const planDirectory = paid
    ? dirname(resolve(argument!))
    : resolve(
        argument ??
          join(
            STUDIES,
            `${PREFIX}-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`,
          ),
      );
  assert.equal(
    dirname(planDirectory),
    STUDIES,
    "Artifacts must be direct children of eval/studies",
  );
  assert(
    basename(planDirectory).startsWith(PREFIX),
    "Use a fresh alchemy-context-2026-10-11* directory",
  );
  if (!paid) {
    assert(!(yield* fs.exists(planDirectory)), "Refusing to overwrite existing artifacts");
    yield* fs.makeDirectory(planDirectory);
  } else {
    // This marker never disappears, even on interruption: a repeated run cannot reset spent budget.
    yield* fs.writeFileString(
      join(planDirectory, "paid-once.json"),
      textOf({
        started: new Date().toISOString(),
        manifestSha256: sha(yield* fs.readFileString(resolve(argument!))),
        cap: 1,
      }),
      { flag: "wx" },
    );
    yield* fs.makeDirectory(join(planDirectory, "paid"));
  }
  const output = paid ? join(planDirectory, "paid") : planDirectory;
  const save = (name: string, value: unknown, fresh = false) =>
    fs.writeFileString(join(output, name), textOf(value), { flag: fresh ? "wx" : "w" });
  const attempts: Attempt[] = [];
  const jobs: Job[] = [];
  const contexts = new Map<string, ContextFile>();
  const contextFiles: ContextFile[] = saved ? [...saved.contexts] : [];
  let spent = 0;
  let budgetRefused = false;
  const started = performance.now();
  const checkpoint = () =>
    save("results.json", {
      mode: paid ? "paid" : "simulated-plan",
      model: MODEL,
      policy: POLICY,
      guard: before.guard,
      attempts,
      jobs,
      chargedTokens: attempts.reduce((sum, attempt) => sum + attempt.chargedTokens, 0),
      conservativeDollars: spent / 1e9,
      inputTokens: attempts.reduce((sum, attempt) => sum + (attempt.inputTokens ?? 0), 0),
      milliseconds: performance.now() - started,
    });
  yield* save(
    "inputs.json",
    {
      ...before,
      rule: before.rule,
      policy: POLICY,
      runtime: { bun: Bun.version, platform: process.platform, arch: process.arch },
    },
    true,
  );
  yield* checkpoint();
  if (saved) {
    for (const ref of saved.contexts) {
      assert(/^context-\d{3}\.json$/.test(ref.artifact), "Unexpected context artifact path");
      const text = yield* fs.readFileString(join(planDirectory, ref.artifact));
      assert.equal(sha(text), ref.sha256, `${ref.file}: context changed`);
      const state = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(NativeState))(text);
      assert(!contexts.has(ref.file), "Duplicate context file");
      assert(state.symbols && state.references);
      contexts.set(ref.file, ref);
    }
  }

  const providerFor = (arm: Arm, source: Source): Provider => ({
    model: MODEL,
    ...(paid ? { savedKey: "typesafe" as const } : {}),
    ask: async (state, questions, options) => {
      const body = requestOf(MODEL, state, questions);
      assert(
        !questions.some(({ id }) => id.startsWith("linter:")),
        "Mechanical sampling must be disabled",
      );
      const kind = questions.some(({ id, type }) => id === ID && type === "noul")
        ? "judge"
        : "locate";
      const estimatedTokens = tokensOf(body) + 1000;
      const reservedTokens = Math.max(64_000, estimatedTokens);
      if (paid && spent + reservedTokens * NANODOLLARS_PER_TOKEN > CAP_NANODOLLARS) {
        budgetRefused = true;
        throw new Error("Study's global $1 budget refuses this attempt before HTTP");
      }
      const ordinal = attempts.length;
      const record: Attempt = {
        arm: arm.name,
        file: source.file,
        kind,
        ordinal,
        artifact: `attempt-${String(ordinal).padStart(5, "0")}.json`,
        started: new Date().toISOString(),
        estimatedTokens,
        reservedTokens,
        chargedTokens: paid ? reservedTokens : 0,
        outcome: "reserved",
        milliseconds: 0,
        referencesPresent: Object.hasOwn(state, "references"),
        bodyDigest: digest(body),
      };
      if (paid) spent += reservedTokens * NANODOLLARS_PER_TOKEN;
      attempts.push(record);
      await Effect.runPromise(save(record.artifact, { ...record, body }, true));
      await Effect.runPromise(checkpoint());
      const begin = performance.now();
      try {
        assert(!options.signal.aborted, "Attempt was canceled before HTTP");
        let answered: Answered;
        if (!paid) {
          const longest = Math.max(0, ...Object.values(body.questions).map(tokensOf));
          if (tokensOf(state) + longest + 1000 > 32_000 || estimatedTokens > 64_000)
            throw new ContextOverflow("Simulated model's estimated context limit");
          answered = {
            answers: Object.fromEntries(
              questions.map((question) => [
                question.id,
                question.type === "choice"
                  ? Object.keys(question.options)[0]!
                  : question.id.startsWith("excludeIf:")
                    ? 0
                    : 0.99,
              ]),
            ),
            model: "SIMULATED-NOT-A-MODEL-RESULT",
          };
        } else {
          const wire: typeof globalThis.fetch = Object.assign(
            async (...[input, init]: Parameters<typeof globalThis.fetch>) => {
              assert.equal(input, "https://api.typesafe.ai/v1/systemone");
              assert.equal(init?.method, "POST");
              assert.equal(
                init?.body,
                JSON.stringify(body),
                "Recorded body differs from the actual standard request",
              );
              record.wireVerified = true;
              const response = await globalThis.fetch(input, init);
              record.httpStatus = response.status;
              record.rawResponse = await response.clone().text();
              const usage = Schema.decodeUnknownOption(
                Schema.fromJsonString(
                  Schema.Struct({ usage: Schema.Struct({ input_tokens: Schema.Finite }) }),
                ),
              )(record.rawResponse);
              if (
                usage._tag === "Some" &&
                Number.isSafeInteger(usage.value.usage.input_tokens) &&
                usage.value.usage.input_tokens >= 0
              )
                record.inputTokens = usage.value.usage.input_tokens;
              return response;
            },
            {
              preconnect: () => {
                throw new Error("Study does not preconnect");
              },
            },
          );
          answered = await jev({ model: MODEL, fetch: wire }).ask(state, questions, options);
        }
        record.answers = answered.answers;
        if (answered.model !== undefined) record.returnedModel = answered.model;
        if (
          answered.inputTokens !== undefined &&
          Number.isSafeInteger(answered.inputTokens) &&
          answered.inputTokens >= 0
        ) {
          record.inputTokens = answered.inputTokens;
          if (paid) {
            spent += (answered.inputTokens - record.chargedTokens) * NANODOLLARS_PER_TOKEN;
            record.chargedTokens = answered.inputTokens;
            assert(
              spent <= CAP_NANODOLLARS,
              "Provider exceeded its declared request capacity; stop immediately",
            );
          }
        }
        record.outcome = paid ? "answered" : "simulated-answered";
        return answered;
      } catch (cause) {
        record.outcome = options.signal.aborted
          ? "aborted"
          : cause instanceof ContextOverflow
            ? "overflow"
            : "failed";
        record.error = messageOf(cause);
        throw cause;
      } finally {
        record.milliseconds = performance.now() - begin;
        await Effect.runPromise(save(record.artifact, { ...record, body }));
        await Effect.runPromise(checkpoint());
      }
    },
  });

  const runFile = Effect.fn("alchemyContext.file")(function* (
    arm: Arm,
    source: Source,
    reader: SourceReads["Service"],
  ) {
    const began = performance.now();
    const provider = providerFor(arm, source);
    const config = Layer.succeed(AdhereConfig, configOf(arm, before.rule, provider));
    // Production type awareness includes both maps; only this experimental arm drops references.
    const armReader =
      arm.name === "symbols"
        ? SourceReads.of({
            prepare: (files) => reader.prepare(files),
            read: (file, lines, request) =>
              reader
                .read(file, lines, request)
                .pipe(
                  Effect.map((state) =>
                    Object.fromEntries(
                      Object.entries(state).filter(([name]) => name !== "references"),
                    ),
                  ),
                ),
          })
        : reader;
    const answers = new Map<string, Answers>();
    const cache = Layer.succeed(AuditCache, {
      get: (hash) => Effect.succeed(answers.get(hash) ?? {}),
      put: (hash, value) =>
        Effect.sync(() => {
          answers.set(hash, value);
        }),
      tally: () => Effect.succeed(undefined),
      putTally: () => Effect.die("Preset rules must not sample mechanical questions"),
      prune: () => Effect.succeed(0),
    });
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed([{ path: join(TARGET, source.file) }]),
      read: ({ path }) => {
        assert.equal(
          path,
          join(TARGET, source.file),
          "SourceWalker must read selected gold files only",
        );
        return fs.readFileString(path).pipe(
          Effect.map((text) => {
            assert.equal(
              sha(text),
              source.sha256,
              `${source.file}: source changed during execution`,
            );
            return { path, lines: text.split("\n") };
          }),
          Effect.mapError((problem) => WalkUnavailable.make({ message: messageOf(problem) })),
        );
      },
    });
    const jevLayer = JevLive.pipe(
      Layer.provide(config),
      Layer.provide(CredentialsLive),
      Layer.provide(Layer.succeed(FetchHttpClient.Fetch, blockedFetch)),
    );
    const run = yield* Effect.result(
      Effect.gen(function* () {
        const plan = yield* planAudit();
        assert(plan.files.every(({ sampled }) => Object.keys(sampled).length === 0));
        return yield* executeAudit(plan);
      }).pipe(
        Effect.provide(
          Layer.mergeAll(config, cache, walker, jevLayer, Layer.succeed(SourceReads, armReader)),
        ),
      ),
    );
    const result = Result.isSuccess(run) ? run.success : null;
    const error = Result.isFailure(run) ? messageOf(run.failure) : null;
    const ownAttempts = attempts.filter(
      (attempt) => attempt.arm === arm.name && attempt.file === source.file,
    );
    const raw = Object.assign(
      {},
      ...ownAttempts
        .filter((attempt) => attempt.kind === "judge" && attempt.answers !== undefined)
        .map((attempt) => attempt.answers),
    ) as Answered["answers"];
    const p = typeof raw[ID] === "number" ? raw[ID] : null;
    const scores = (kind: "appliesTo" | "excludeIf") =>
      (before.rule[kind] ?? []).map((_, index) => {
        const answer = raw[matcherKey(kind, ID, index)];
        return typeof answer === "number" ? answer : null;
      });
    const appliesTo = scores("appliesTo"),
      excludeIf = scores("excludeIf");
    const answered = p !== null && [...appliesTo, ...excludeIf].every((score) => score !== null);
    const firstJudge = ownAttempts.find((attempt) => attempt.kind === "judge");
    const fullReferences = arm.name === "symbols+references";
    const dropped = fullReferences && ownAttempts.some((attempt) => !attempt.referencesPresent);
    const questionHashes: Record<string, string> = {};
    for (const attempt of ownAttempts) {
      const savedBody = yield* fs.readFileString(join(output, attempt.artifact));
      const decoded = JSON.parse(savedBody) as { body: SystemOneRequest };
      for (const [id, question] of Object.entries(decoded.body.questions))
        questionHashes[`${attempt.kind}:${id}`] = digest(question);
    }
    const cachedAnswer = Object.values([...answers.values()][0] ?? {})[0] ?? null;
    const row: Job = {
      arm: arm.name,
      file: source.file,
      gold: source.label,
      probability: p,
      appliesTo,
      excludeIf,
      answered,
      flagged: answered
        ? p! > THRESHOLD &&
          inScope({ appliesTo: appliesTo as number[], excludeIf: excludeIf as number[] })
        : null,
      status:
        result === null
          ? budgetRefused
            ? "budget-refused"
            : "error"
          : result.skipped
            ? "skipped"
            : result.blocked.length
              ? "blocked"
              : result.judged
                ? answered
                  ? "answered"
                  : "missing"
                : "waiting",
      result,
      cachedAnswer,
      error,
      milliseconds: performance.now() - began,
      fallback: dropped
        ? firstJudge?.referencesPresent
          ? "provider-overflow"
          : "preflight"
        : null,
      questions: questionHashes,
    };
    jobs.push(row);
    yield* checkpoint();
    yield* Console.error(
      `${paid ? "PAID" : "DRY"} ${arm.name} ${source.file}: ${row.status}${row.fallback ? ` (${row.fallback} dropped references)` : ""}`,
    );
    return row;
  });

  // Prepare through actual production execution, one scoped compiler per <=8 files.
  if (!paid) {
    for (let offset = 0; offset < before.sources.length; offset += 8) {
      const group = before.sources.slice(offset, offset + 8);
      yield* Effect.gen(function* () {
        const native = yield* SourceReads;
        const reader = SourceReads.of({
          prepare: (files) => native.prepare(files),
          read: (file, lines, request) =>
            Effect.gen(function* () {
              const source = group.find((source) => join(TARGET, source.file) === file.path);
              assert(source);
              assert(!contexts.has(source.file), "Native preparation may run only once per file");
              const begin = performance.now();
              const state = (yield* native.read(file, lines, request)) as SourceReadState;
              assert(state.symbols && state.references, "Native context must be complete");
              const artifact = `context-${String(before.sources.indexOf(source)).padStart(3, "0")}.json`;
              const text = textOf(state);
              yield* fs.writeFileString(join(planDirectory, artifact), text, { flag: "wx" });
              const ref = {
                file: source.file,
                artifact,
                sha256: sha(text),
                milliseconds: performance.now() - begin,
              };
              contexts.set(source.file, ref);
              contextFiles.push(ref);
              return state;
            }).pipe(
              Effect.mapError((problem) => WalkUnavailable.make({ message: messageOf(problem) })),
            ),
        });
        for (const source of group) yield* runFile(ARMS[2], source, reader);
      }).pipe(Effect.provide(SourceReadsLive(TARGET)), Effect.scoped);
      yield* Console.error(
        `Native group ${offset / 8 + 1} closed; ${contexts.size}/51 contexts prepared`,
      );
    }
  }
  const preparedMilliseconds = contextFiles.reduce((sum, entry) => sum + entry.milliseconds, 0);
  const replay = SourceReads.of({
    prepare: (files) =>
      Effect.sync(() => {
        for (const file of files)
          assert(contexts.has(file.slice(TARGET.length + 1)), `Missing stored context for ${file}`);
      }),
    read: (file, _lines, request) =>
      Effect.gen(function* () {
        const ref = contexts.get(file.path.slice(TARGET.length + 1));
        assert(ref);
        const text = yield* fs.readFileString(join(planDirectory, ref.artifact));
        assert.equal(sha(text), ref.sha256, `${ref.file}: context changed during execution`);
        const state = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(NativeState))(text);
        return {
          ...(request.symbols ? { symbols: state.symbols } : {}),
          ...(request.references ? { references: state.references } : {}),
        };
      }).pipe(Effect.mapError((problem) => WalkUnavailable.make({ message: messageOf(problem) }))),
  });
  for (const source of before.sources) {
    for (const arm of ARMS) {
      if (!paid && arm === ARMS[2]) continue;
      if (budgetRefused) {
        jobs.push({
          arm: arm.name,
          file: source.file,
          gold: source.label,
          probability: null,
          appliesTo: [],
          excludeIf: [],
          answered: false,
          flagged: null,
          status: "not-run-budget",
          result: null,
          cachedAnswer: null,
          error: "Budget exhausted",
          milliseconds: 0,
          fallback: null,
          questions: {},
        });
      } else yield* runFile(arm, source, replay);
    }
  }
  for (const source of before.sources) {
    const matching = jobs.filter((job) => job.file === source.file);
    const hashes = matching.flatMap((job) =>
      job.questions[`judge:${ID}`] === undefined ? [] : [job.questions[`judge:${ID}`]],
    );
    assert(new Set(hashes).size <= 1, `${source.file}: judge question changed across arms`);
  }
  const after = yield* inspect();
  assert.equal(
    after.guard,
    before.guard,
    "Source/config/environment/implementation changed during execution",
  );
  const summaries = ARMS.map(({ name }) => {
    const rows = jobs.filter((job) => job.arm === name);
    const real = rows.filter((job) => job.answered && job.gold === "real");
    const negative = rows.filter((job) => job.answered && job.gold === "false");
    const tp = real.filter((job) => job.flagged).length;
    const fp = negative.filter((job) => job.flagged).length;
    const owned = attempts.filter((attempt) => attempt.arm === name);
    return {
      arm: name,
      answered: real.length + negative.length,
      known: 51,
      ...(paid
        ? {
            tp,
            fp,
            fn: real.length - tp,
            tn: negative.length - fp,
            precision: tp + fp ? tp / (tp + fp) : null,
            knownPositiveCoverage: tp / 9,
            unansweredKnownPositives: 9 - real.length,
            auc:
              real.length && negative.length
                ? auc(
                    real.map((job) => job.probability!),
                    negative.map((job) => job.probability!),
                  )
                : null,
          }
        : {}),
      skipped: rows.filter((job) => job.status === "skipped").length,
      blocked: rows.filter((job) => job.status === "blocked").length,
      missing: rows.filter((job) => job.status === "missing").length,
      unanswered: rows.filter((job) => !job.answered).length,
      failedAttempts: owned.filter(
        (attempt) => !["answered", "simulated-answered"].includes(attempt.outcome),
      ).length,
      missingUsageAttempts: owned.filter((attempt) => attempt.inputTokens === undefined).length,
      errors: rows.filter((job) => job.status === "error").length,
      referenceDrops: rows.filter((job) => job.fallback !== null).length,
      requests: owned.length,
      estimatedTokens: owned.reduce((sum, attempt) => sum + attempt.estimatedTokens, 0),
      inputTokens: owned.reduce((sum, attempt) => sum + (attempt.inputTokens ?? 0), 0),
      conservativeDollars: owned.reduce(
        (sum, attempt) => sum + (attempt.chargedTokens * NANODOLLARS_PER_TOKEN) / 1e9,
        0,
      ),
      worstCaseRetryTokens: owned.reduce((sum, attempt) => sum + attempt.reservedTokens * 4, 0),
      milliseconds: rows.reduce((sum, job) => sum + job.milliseconds, 0),
    };
  });
  const common = before.sources.filter((source) =>
    ARMS.every((arm) =>
      jobs.some((job) => job.arm === arm.name && job.file === source.file && job.answered),
    ),
  );
  const paired = paid
    ? common.map((source) => {
        const values = ARMS.map(
          (arm) =>
            jobs.find((job) => job.arm === arm.name && job.file === source.file)!.probability!,
        );
        return {
          file: source.file,
          gold: source.label,
          codeOnly: values[0],
          symbols: values[1],
          both: values[2],
          symbolsMinusCode: values[1]! - values[0]!,
          bothMinusCode: values[2]! - values[0]!,
          bothMinusSymbols: values[2]! - values[1]!,
        };
      })
    : [];
  const questionVariants = before.sources.map((source) => ({
    file: source.file,
    sufficiency: Object.fromEntries(
      jobs
        .filter((job) => job.file === source.file)
        .map((job) => [job.arm, job.questions[`locate:${sufficiencyKey(ID)}`] ?? null]),
    ),
  }));
  const summary = {
    mode: paid ? "paid" : "simulated-plan",
    model: MODEL,
    thresholdPolicy:
      "strictly greater than 0.8 plus shipped matchers; absence never means zero/clean",
    labels: { real: 9, false: 42, debatable: 0 },
    summaries,
    commonAnswered: common.length,
    paired,
    questionVariants,
    preparationMilliseconds: preparedMilliseconds,
    totalMilliseconds: performance.now() - started,
    actualPaidRequests: paid ? attempts.filter((attempt) => attempt.wireVerified).length : 0,
    inputTokens: attempts.reduce((sum, attempt) => sum + (attempt.inputTokens ?? 0), 0),
    estimatedNoRetryDollars:
      (summaries.reduce((sum, arm) => sum + arm.estimatedTokens, 0) * PRICE) / 1e6,
    maximumCapacityNoRetryDollars:
      (attempts.reduce((sum, attempt) => sum + attempt.reservedTokens, 0) * PRICE) / 1e6,
    pairedMeanDeltas:
      paid && paired.length
        ? {
            symbolsMinusCode:
              paired.reduce((sum, pair) => sum + pair.symbolsMinusCode, 0) / paired.length,
            bothMinusCode:
              paired.reduce((sum, pair) => sum + pair.bothMinusCode, 0) / paired.length,
            bothMinusSymbols:
              paired.reduce((sum, pair) => sum + pair.bothMinusSymbols, 0) / paired.length,
          }
        : null,
    conservativeDollars: spent / 1e9,
    estimatedWorstCaseRetryDollars:
      (summaries.reduce((sum, arm) => sum + arm.worstCaseRetryTokens, 0) * PRICE) / 1e6,
    gitStatusBefore: before.gitStatus,
    gitStatusAfter: after.gitStatus,
    limitations: [
      "Known-set case-control results are not population accuracy",
      "Locate sufficiency wording varies with context in production",
      "Simulator token counts are estimates, not provider measurements",
      "Worst-case locating assumes every judgment is in-scope above threshold",
      "No automatic resume: a paid-once marker prevents budget reset after interruption",
      "FN/TN are among answered judgments only; unavailable positives are reported separately and reduce known-positive coverage",
      "The $1 cap can stop the study before all arms complete if failures/retries consume the reserve",
    ],
  };
  if (!paid)
    yield* save(
      "manifest.json",
      {
        format: FORMAT,
        mode: "plan",
        checkout: TARGET,
        head: HEAD,
        model: MODEL,
        guard: before.guard,
        goldDigest: before.goldDigest,
        ruleDigest: before.ruleDigest,
        policy: POLICY,
        sources: before.sources,
        contexts: contextFiles,
        summary,
      },
      true,
    );
  yield* save("summary.json", summary, true);
  yield* checkpoint();
  yield* Console.log(
    table(
      [
        "arm",
        "answered / 51",
        "requests",
        "reference drops",
        "skipped",
        "estimated tokens",
        "retry reserve $",
      ],
      summaries.map((arm) => [
        arm.arm,
        `${arm.answered}/51`,
        String(arm.requests),
        String(arm.referenceDrops),
        String(arm.skipped),
        String(arm.estimatedTokens),
        ((arm.worstCaseRetryTokens * PRICE) / 1e6).toFixed(6),
      ]),
    ),
  );
  if (paid) {
    yield* Console.log(
      table(
        [
          "arm",
          "TP",
          "FP",
          "FN (answered)",
          "precision",
          "known positive coverage",
          "AUC (answered)",
          "skipped",
          "blocked",
          "missing",
          "input tokens",
          "charged $",
          "seconds",
        ],
        summaries.map((arm) => [
          arm.arm,
          String(arm.tp),
          String(arm.fp),
          String(arm.fn),
          arm.precision === null ? "–" : String(arm.precision),
          String(arm.knownPositiveCoverage),
          arm.auc === null ? "–" : String(arm.auc),
          String(arm.skipped),
          String(arm.blocked),
          String(arm.missing),
          String(arm.inputTokens),
          arm.conservativeDollars.toFixed(6),
          (arm.milliseconds / 1000).toFixed(2),
        ]),
      ),
    );
    yield* Console.log(
      `Paired common answered set: ${common.length}/51; mean deltas ${JSON.stringify(summary.pairedMeanDeltas)}; per-file deltas and raw probabilities are in summary.json/results.json.`,
    );
  }
  yield* Console.log(
    `Artifacts: ${output}\nManifest: ${join(planDirectory, "manifest.json")}\nPreparation: ${(preparedMilliseconds / 1000).toFixed(2)}s; total ${(summary.totalMilliseconds / 1000).toFixed(2)}s\nPaid requests: ${summary.actualPaidRequests}; conservative charge $${(spent / 1e9).toFixed(6)}`,
  );
});

program.pipe(
  Effect.scoped,
  Effect.timeout(process.argv[2] === "--plan" ? "3 minutes" : "20 minutes"),
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
