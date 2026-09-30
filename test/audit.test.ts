import { access, mkdir, mkdtemp, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import {
  ConfigProvider,
  Crypto,
  Effect,
  FileSystem,
  Layer,
  Path,
  Record,
  Redacted,
  Schema,
} from "effect";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { HttpClient, HttpClientResponse } from "effect/http";
import { describe, expect, it } from "vite-plus/test";
import { isNote, withoutComments } from "../src/comments.ts";
import { NO_SUPPRESSIONS, suppresses, suppressionsOf } from "../src/suppress.ts";
import { findContradictions, formatContradictions } from "../src/contradictions.ts";
import {
  AdhereConfig as AdhereConfigSchema,
  type AppendState,
  decodeConfig,
  type Loaded,
  type Preset,
  presetsOf,
  resolveConfig,
} from "../src/config.ts";
import { type Range, sectionsOf } from "../src/excerpt.ts";
import { tokenize } from "../src/highlight.ts";
import { initProject } from "../src/init.ts";
import { parseRuleMarkdown } from "../src/markdown.ts";
import { presetOf, presets, topicsOf, wholePresetOf } from "../src/presets.ts";
import type { ScannedFile } from "../src/models/Audit.ts";
import {
  applicableRules,
  loadAdhereRuleSet,
  loadRules,
  type RuleEntry,
  type RuleSet,
  shownId,
  withOverrides,
} from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import {
  type Answers,
  AuditCache,
  AuditCacheLive,
  CacheEntry,
  type Live,
  type Tally,
} from "../src/services/AuditCache.ts";
import {
  Credentials,
  CredentialsLive,
  CredentialsUnavailable,
} from "../src/services/Credentials.ts";
import { JevLive } from "../src/services/Jev.http.ts";
import {
  conflictBody,
  contradictBody,
  fits,
  Jev,
  JevBlocked,
  JevOverflow,
  JevUnavailable,
  judgeBody,
  judgeLoad,
  linterKey,
  linterQuestion,
  locateBody,
  locateRequests,
  namedPairs,
  type Pair,
  pairProbability,
  requestGroups,
  requestsOf,
  type Rules,
  tokensOf,
} from "../src/services/Jev.ts";
import {
  isInSkippedTree,
  isScannable,
  isTestFile,
  passesFilter,
  SourceWalker,
} from "../src/services/SourceWalker.ts";
import { formatStrays, straysAmong, strayingOf, TIPS_URL } from "../src/wording.ts";
import { walkFiles } from "../src/walk.ts";
import { Status } from "../src/services/Status.ts";
import {
  formatLinterCheck,
  SAMPLE,
  type Tallied,
  talliedOf,
  tallyKeyOf,
  tallyProjectRules,
} from "../src/mechanical.ts";
import {
  type AuditPlan,
  executeAudit,
  failing,
  type FileDone,
  type FilePlan,
  planAudit,
  pruneCache,
  render,
  runAudit,
} from "../src/workflows/audit.ts";
import { describePlan, progressLine, sendQuestion } from "../src/workflows/format.ts";

const a = {
  description: "Ports are branded.",
  must: '\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type\n',
};
const b = {
  description: "Secrets are redacted.",
  must: 'const key = yield* Config.redacted("API_KEY")',
};
const rules: Rules = { a, b };
const code1 = ["const port = 3000;"];

/** Echoes the input as its digest, so equal text still shares a cache key. */
const testCrypto = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) => new Uint8Array(size),
    digest: (_algorithm, data) => Effect.succeed(data),
  }),
);

/** Answers by content hash, as the cache keeps them; `pruned` holds what each prune was told is live. */
const memoryCache = (
  seed: Readonly<Record<string, Answers>> = {},
  tallies: Map<string, Tally> = new Map(),
  pruned: Array<Live> = [],
) => {
  const entries = new Map<string, Answers>(Object.entries(seed));
  return Layer.succeed(AuditCache, {
    get: (hash) => Effect.sync(() => entries.get(hash) ?? {}),
    put: (hash, answers) =>
      Effect.sync(() => {
        entries.set(hash, { ...entries.get(hash), ...answers });
      }),
    tally: (key) => Effect.sync(() => tallies.get(key)),
    putTally: (key, tally) =>
      Effect.sync(() => {
        tallies.set(key, tally);
      }),
    prune: (live) =>
      Effect.sync(() => {
        pruned.push(live);
        return 0;
      }),
  });
};

/** A section of one line. */
const lineAt = (line: number): Range => ({ first: line, last: line });

/** The section of `lines` that holds `line`, as Jev's locate answer names it. */
const sectionAt = (lines: ReadonlyArray<string>, line: number): Range =>
  sectionsOf(lines).find((section) => section.first <= line && line <= section.last) ?? {
    first: line,
    last: line,
  };

/** Jev's locate answer for a finding on `line`: its section, and the line, in a file that shows enough. */
const placedAt = (lines: ReadonlyArray<string>, line: number) => ({
  section: sectionAt(lines, line),
  sufficiency: 0.9,
  lines: { first: line, last: line },
});

/** Jev that answers from tables, as `recordingJev` does, and keeps the code of every request. */
const sendingJev = (answers: {
  readonly judge: Record<string, number>;
  readonly locate: Record<string, number>;
}) => {
  const sent: Array<string> = [];
  const answer = (table: Readonly<Record<string, number>>, asked: Rules) =>
    Record.filter(table, (_, id) => asked[id] !== undefined);
  const layer = Layer.succeed(Jev, {
    judge: (code, asked) =>
      Effect.sync(() => {
        sent.push(code.join("\n"));
        return { probabilities: answer(answers.judge, asked), linter: {} };
      }),
    locate: (code, asked) =>
      Effect.sync(() => {
        sent.push(code.join("\n"));
        return Record.map(answer(answers.locate, asked), (line) => placedAt(code, line));
      }),
    conflicts: () => Effect.die("an audit compares no rules"),
    contradicts: () => Effect.die("an audit compares no rules"),
  });
  return { sent, layer };
};

const recordingJev = (answers: {
  readonly judge: Record<string, number>;
  readonly locate: Record<string, number>;
}) => {
  const calls = { judge: [] as Array<Rules>, locate: [] as Array<Rules> };
  const asked = (table: Record<string, number>, rules: Rules) =>
    Record.filter(table, (_, id) => rules[id] !== undefined);
  const layer = Layer.succeed(Jev, {
    judge: (_lines, rules) =>
      Effect.sync(() => {
        calls.judge.push(rules);
        return { probabilities: asked(answers.judge, rules), linter: {} };
      }),
    locate: (lines, rules) =>
      Effect.sync(() => {
        calls.locate.push(rules);
        return Record.map(asked(answers.locate, rules), (line) => placedAt(lines, line));
      }),
    conflicts: () => Effect.die("an audit compares no rules"),
    contradicts: () => Effect.die("an audit compares no rules"),
  });
  return { calls, layer };
};

const source: ScannedFile = {
  path: "/repo/src/server.ts",
  lines: [
    "const before = 1;",
    "  const port: number = Number(process.env.PORT);",
    "const after = 2;",
  ],
};

const audit = (options: {
  readonly rules: Rules;
  readonly threshold?: number;
  readonly jev: Layer.Layer<Jev>;
  readonly cache: Layer.Layer<AuditCache>;
  readonly files?: ReadonlyArray<ScannedFile>;
  readonly includeComments?: boolean;
}) =>
  Effect.runPromise(
    runAudit.pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AdhereConfig, {
            model: "jev-latest",
            threshold: options.threshold ?? 0.7,
            sufficiencyThreshold: 0.7,
            rules: options.rules,
            ...(options.includeComments === undefined
              ? {}
              : { includeComments: options.includeComments }),
          }),
          Layer.succeed(SourceWalker, { files: Effect.succeed(options.files ?? [source]) }),
          options.jev,
          options.cache,
          testCrypto,
        ),
      ),
    ),
  );

const findingA = {
  rule: "a",
  description: a.description,
  examples: { good: { word: "must" as const, code: a.must } },
  file: "/repo/src/server.ts",
  section: { first: 1, last: 3 },
  lines: { first: 2, last: 2 },
  excerpt: { start: 1, lines: source.lines },
  context: 0.9,
  probability: 0.9,
  level: "error" as const,
};

describe("request bodies", () => {
  const code = ["const x = 1;", "", "  const y = 2;"];
  const sectioned = { "1": "const x = 1;\n\n  const y = 2;" };
  const diverges =
    "Does `code` diverge from the pattern shown in `must`, as described by `rule`? Answer no if the pattern does not apply to this file.";
  const scoped = {
    true: "`code` diverges from the pattern shown in `must`, in code that `rule` is about",
    false: "`code` follows the pattern, or has no code that `rule` is about",
  };

  it("judge: the code's sections are the whole state, and each rule rides in its own noul", () => {
    expect(judgeBody("jev-latest", code, rules)).toEqual({
      model: "jev-latest",
      state: { code: sectioned },
      questions: {
        a: {
          type: "noul",
          instructions: { question: diverges, rule: a.description, must: a.must },
          criteria: scoped,
        },
        b: {
          type: "noul",
          instructions: { question: diverges, rule: b.description, must: b.must },
          criteria: scoped,
        },
      },
    });
  });

  it("judge: each matcher rides in its own noul beside its rule, about the code that breaks it", () => {
    const scoped = { ...a, appliesTo: ["a port"], excludeIf: ["a port a third party fixes"] };
    const { questions } = judgeBody("jev-latest", code, { a: scoped });

    expect(Object.keys(questions)).toEqual(["a", "appliesTo:a:0", "excludeIf:a:0"]);
    expect(questions["appliesTo:a:0"]).toMatchObject({
      type: "noul",
      instructions: {
        question: expect.stringContaining("Is any of the code in `code` that breaks `rule`"),
        rule: a.description,
        must: a.must,
        matcher: "a port",
      },
    });
    expect(questions["excludeIf:a:0"]).toMatchObject({
      instructions: {
        question: expect.stringContaining("Is all of the code in `code` that breaks `rule`"),
        matcher: "a port a third party fixes",
      },
    });
  });

  it("locate: one choice per rule among the sections' numbers, carrying the rule", () => {
    const long = Array.from({ length: 70 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const body = locateBody("jev-latest", long, { a });
    expect(Object.keys(body.state.code)).toEqual(["1", "2", "3"]);
    expect(body.state.code["2"]?.split("\n")[0]).toBe("const v31 = 31;");
    expect(Object.keys(body.questions)).toEqual([
      "a",
      "start:a:1",
      "end:a:1",
      "start:a:2",
      "end:a:2",
      "start:a:3",
      "end:a:3",
      "sufficient:a",
    ]);
    // Where in a section it starts or ends: a choice among its lines, each its text.
    expect(body.questions["start:a:2"]).toMatchObject({
      type: "choice",
      instructions: {
        question: 'Which line of `code["2"]` does the code that breaks `rule` start on?',
        rule: a.description,
        must: a.must,
      },
    });
    expect(Object.entries(body.questions["start:a:2"]?.criteria ?? {})[0]).toEqual([
      "31",
      "const v31 = 31;",
    ]);
    expect(body.questions.a).toEqual({
      type: "choice",
      instructions: {
        question: "Which entry of `code` most clearly diverges from `must`?",
        rule: a.description,
        must: a.must,
      },
      criteria: { "1": null, "2": null, "3": null },
    });
    expect(body.questions["sufficient:a"]).toMatchObject({
      type: "noul",
      instructions: {
        question: expect.stringContaining("from `code` alone"),
        rule: a.description,
        must: a.must,
      },
    });
    // A file of one section has no section to choose.
    expect(Object.keys(locateBody("jev-latest", code, { a }).questions)).toEqual([
      "start:a:1",
      "end:a:1",
      "sufficient:a",
    ]);
  });

  it("carries the code under the rule's words: must and never, or should and should not", () => {
    const both = { ...a, never: "const port: number = 3000" };
    const neverOnly = {
      description: "Domain code must never throw.",
      never: 'throw new Error("x")',
    };
    const guideline = {
      description: "A file should be small.",
      should: "export const one = 1;",
      shouldNot: "export const a = 1, b = 2;",
    };
    const questions = judgeBody("jev-latest", code, { both, neverOnly, guideline }).questions;
    expect(questions.both).toEqual({
      type: "noul",
      instructions: {
        question:
          "Does `code` diverge from the pattern shown in `must`, for example by doing what `never` shows, as described by `rule`? Answer no if the pattern does not apply to this file.",
        rule: both.description,
        must: both.must,
        never: both.never,
      },
      criteria: {
        true: "`code` diverges from the pattern shown in `must`, for example by doing what `never` shows, in code that `rule` is about",
        false: scoped.false,
      },
    });
    expect(questions.neverOnly).toEqual({
      type: "noul",
      instructions: {
        question:
          "Does `code` contain the pattern shown in `never`, which `rule` rules out? Answer no if nothing in this file resembles it.",
        rule: neverOnly.description,
        never: neverOnly.never,
      },
      criteria: {
        true: "`code` contains the pattern shown in `never`, in code that `rule` is about",
        false: "`code` has nothing like `never`, or has no code that `rule` is about",
      },
    });
    expect(questions.guideline?.instructions).toEqual({
      question:
        "Does `code` diverge from the pattern shown in `should`, for example by doing what `should_not` shows, as described by `rule`? Answer no if the pattern does not apply to this file.",
      rule: guideline.description,
      should: guideline.should,
      should_not: guideline.shouldNot,
    });

    const long = Array.from({ length: 40 }, (_, index) => `const v${index} = ${index};`);
    const located = locateBody("jev-latest", long, { both, neverOnly }).questions;
    expect(located.both?.instructions.question).toBe(
      "Which entry of `code` most clearly diverges from `must` or resembles `never`?",
    );
    expect(located.neverOnly?.instructions.question).toBe(
      "Which entry of `code` most clearly shows the pattern in `never`?",
    );
  });
});

describe("jev's context", () => {
  /** A rule whose question comes to about `tokens` by `tokensOf`'s count. */
  const sized = (tokens: number) => ({ description: "Sized.", must: "x".repeat(tokens * 3) });
  const linesOf = (count: number, line: string) => Array.from({ length: count }, () => line);
  const line = "export const value = compute(input);";

  it("splits questions into requests that fit beside the state, in order", () => {
    const body = judgeBody("jev-latest", code1, {
      a: sized(20_000),
      b: sized(20_000),
      c: sized(20_000),
      d: sized(20_000),
    });
    const requests = requestsOf(body);
    expect(requests.map((request) => Object.keys(request.questions))).toEqual([
      ["a", "b", "c"],
      ["d"],
    ]);
    for (const request of requests) {
      expect(request.state).toEqual(body.state);
      const questions = Object.values(request.questions).map(tokensOf);
      expect(tokensOf(request.state) + questions.reduce((sum, n) => sum + n, 0)).toBeLessThan(
        64_000,
      );
    }
  });

  it("gives each rule with appendState requests of its own, to judge and to locate", () => {
    const hooked = { ...b, appendState: () => ({}) };
    expect(requestGroups({ a, hooked, b })).toEqual([{ a, b }, { hooked }]);
    expect(requestGroups({ hooked })).toEqual([{ hooked }]);
    expect(judgeLoad(code1, { a, b, hooked }).requests).toBe(2);
    expect(locateRequests(code1, { a, hooked })).toBe(2);
  });

  it("keeps a body that fits as one request", () => {
    const body = judgeBody("jev-latest", code1, rules);
    expect(requestsOf(body)).toEqual([body]);
  });

  it("fits a file whose code and longest question come within 32k tokens, in at most 255 sections", () => {
    expect(fits(linesOf(1000, line), rules)).toBe(true);
    expect(fits(linesOf(4000, line), rules)).toBe(false);
    expect(fits(linesOf(7650, "a;"), rules)).toBe(true);
    expect(fits(linesOf(7680, "a;"), rules)).toBe(false);
    expect(fits(code1, { a: sized(20_000) })).toBe(true);
    expect(fits(code1, { a: sized(33_000) })).toBe(false);
  });
});

/** A decoded config whose rules are already in memory, as the loader hands them on. */
const loaded = (config: typeof AdhereConfigSchema.Encoded, rules: Rules = {}) =>
  Effect.map(decodeConfig(config), (decoded) => ({ ...decoded, rules }));

describe("config", () => {
  it("applies the default model and thresholds", async () => {
    const config = await Effect.runPromise(
      loaded({}, { "data/brand": { description: "d", must: "r" } }),
    );
    expect(resolveConfig(config)).toEqual({
      model: "jev-latest",
      threshold: 0.8,
      sufficiencyThreshold: 0.6,
      rules: { "data/brand": { description: "d", must: "r" } },
    });
  });

  it("takes the sufficiency threshold from the flag, then the config, then the default", async () => {
    const config = await Effect.runPromise(loaded({ sufficiencyThreshold: 0.6 }));
    expect(resolveConfig(config).sufficiencyThreshold).toBe(0.6);
    expect(resolveConfig(config, { sufficiencyThreshold: 0.5 }).sufficiencyThreshold).toBe(0.5);
  });

  it("folds presets into the rules, with a config rule winning over a preset rule", async () => {
    const override = { description: "mine", must: "mine" };
    const preset: Loaded<Preset> = { rules: { a, b } };
    const config = await Effect.runPromise(loaded({}, { a: override }));
    const resolved = resolveConfig(config, { presets: ["effect"] }, { effect: preset });
    expect(resolved.rules).toEqual({ a: override, b });
  });

  it("leaves rules unset when the config names none, so the loader can pick .adhere/", async () => {
    const decoded = await Effect.runPromise(decodeConfig({}));
    expect(decoded.rules).toBeUndefined();
  });

  it("accepts a directory path as the rules of a config", async () => {
    const decoded = await Effect.runPromise(decodeConfig({ rules: "./team-rules" }));
    expect(decoded.rules).toBe("./team-rules");
  });

  it("decodes overrides by rule id: off, a level, or a level and a threshold", async () => {
    const overrides = {
      "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
      "effect/basics/gen-for-sequencing": "off",
    } as const;
    expect((await Effect.runPromise(decodeConfig({ overrides }))).overrides).toEqual(overrides);
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ overrides: { "effect/basics/gen-for-sequencing": "nit" } })),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
  });

  it("applies overrides by the id a report shows: off drops a rule, a level or threshold replaces its own", () => {
    const entry = (id: string, preset?: string): RuleEntry => ({
      id,
      ...(preset === undefined ? {} : { preset }),
      scope: "/repo",
      rule: { description: id, must: "a()", threshold: 0.7 },
    });
    const entries = [
      entry("providers/idempotent-delete", "alchemy"),
      entry("basics/gen-for-sequencing", "effect"),
      entry("style/names"),
      entry("style/kept"),
    ];
    const overridden = withOverrides(entries, {
      "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
      "effect/basics/gen-for-sequencing": "off",
      "style/names": "warning",
    });
    expect(overridden.map((one) => [shownId(one), one.rule.level, one.rule.threshold])).toEqual([
      ["alchemy/providers/idempotent-delete", "warning", 0.9],
      ["style/names", "warning", 0.7],
      ["style/kept", undefined, 0.7],
    ]);
  });

  it("keeps the config's exclude globs, and refuses a rule's tests other than only or include", async () => {
    const configured = await Effect.runPromise(loaded({ exclude: ["gen/**"] }));
    expect(resolveConfig(configured).exclude).toEqual(["gen/**"]);
    const refused = await Effect.runPromise(
      Effect.flip(
        decodeConfig({ rules: { a: { description: "d", must: "a()", tests: "sometimes" } } }),
      ),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
  });

  it("threshold precedence: command line, then config, then preset, then 0.8", async () => {
    const registry = { effect: { threshold: 0.9, rules: {} } };
    const bare = await Effect.runPromise(loaded({}));
    expect(resolveConfig(bare).threshold).toBe(0.8);
    expect(resolveConfig(bare, { presets: ["effect"] }, registry).threshold).toBe(0.9);
    const configured = await Effect.runPromise(loaded({ presets: ["effect"], threshold: 0.6 }));
    expect(resolveConfig(configured, {}, registry).threshold).toBe(0.6);
    expect(resolveConfig(configured, { threshold: 0.85 }, registry).threshold).toBe(0.85);
  });

  it("refuses an unknown preset", async () => {
    const refused = await Effect.runPromise(Effect.flip(decodeConfig({ presets: ["vue"] })));
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("effect");
  });

  it("refuses a rule without an example, or one that is both a requirement and a guideline", async () => {
    const refusal = (rule: typeof AdhereConfigSchema.Encoded.rules) =>
      Effect.runPromise(Effect.flip(decodeConfig({ rules: rule })));
    const bare = await refusal({ "data/brand": { description: "d" } });
    expect(bare._tag).toBe("ConfigUnavailable");
    expect(bare.message).toContain("a rule needs an example: must, never, should, or shouldNot");
    const mixed = await refusal({ "data/brand": { description: "d", must: "a()", should: "b()" } });
    expect(mixed.message).toContain(
      "a rule is a requirement (must, never) or a guideline (should, shouldNot), not both",
    );
  });

  it("accepts a rule with only code never to write, and a guideline", async () => {
    const never = { description: "Domain code does not throw.", never: "throw new Error()" };
    const guideline = { description: "A file should be small.", should: "export const one = 1;" };
    const config = await Effect.runPromise(decodeConfig({ rules: { never, guideline } }));
    expect(config.rules).toEqual({ never, guideline });
  });

  it("takes a function as a rule's appendState, and refuses anything else", async () => {
    const appendState = () => ({});
    const decoded = await Effect.runPromise(decodeConfig({ rules: { a: { ...a, appendState } } }));
    expect(decoded.rules).toEqual({ a: { ...a, appendState } });
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ rules: { a: { ...a, appendState: "{}" } } })),
    );
    expect(refused.message).toContain("Expected a function");
  });

  it("reads reference and avoid, the names before 0.7, as must and never", async () => {
    const config = await Effect.runPromise(
      decodeConfig({ rules: { old: { description: "d", reference: "a()", avoid: "b()" } } }),
    );
    expect(config.rules).toEqual({ old: { description: "d", must: "a()", never: "b()" } });
  });
});

describe("markdown rules", () => {
  const parse = (text: string) => Effect.runPromise(parseRuleMarkdown(text, "rules/a.md"));

  it("front matter is the description and threshold; an untagged fence is code to write", async () => {
    const rule = await parse(
      [
        "---",
        "description: Ports are branded.",
        "threshold: 0.8",
        "---",
        "",
        "Prose for GitHub, ignored by adhere.",
        "",
        "```ts",
        'const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "type Port = typeof Port.Type",
        "```",
        "",
      ].join("\n"),
    );
    expect(rule).toEqual({
      description: "Ports are branded.",
      threshold: 0.8,
      must: 'const Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type',
    });
  });

  it("without a fence, the whole body is code to write", async () => {
    const rule = await parse("---\ndescription: d\n---\nconst x = 1\n");
    expect(rule).toEqual({ description: "d", must: "const x = 1" });
  });

  it("fences tagged must and never, or should and should not, hold code under those words", async () => {
    const fenced = (...fences: ReadonlyArray<string>) =>
      parse(
        `---\ndescription: d\n---\n\n${fences.map((fence) => `\`\`\`${fence}\n\`\`\``).join("\n\n")}\n`,
      );
    expect(await fenced("ts never\nb()", "ts must\na()")).toEqual({
      description: "d",
      must: "a()",
      never: "b()",
    });
    expect(await fenced("ts should\na()", "ts should not\nb()")).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    // An untagged fence is code to write at the rule's level: should, in a guideline.
    expect(await fenced("ts\na()", "ts should not\nb()")).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    expect(await fenced("ts must not\nb()")).toEqual({ description: "d", never: "b()" });
  });

  it("a fence tagged avoid, the word before 0.7, is code never to write", async () => {
    const rule = await parse(
      [
        "---",
        "description: A domain failure is a tagged error.",
        "---",
        "",
        "Not this:",
        "",
        "```ts avoid",
        'throw new Error("not found")',
        "```",
        "",
        "This:",
        "",
        "```ts",
        'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {}) {}',
        "```",
        "",
      ].join("\n"),
    );
    expect(rule).toEqual({
      description: "A domain failure is a tagged error.",
      must: 'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {}) {}',
      never: 'throw new Error("not found")',
    });
  });

  it("a rule can be only code never to write", async () => {
    const rule = await parse(
      "---\ndescription: A module has no default export.\n---\n\n```ts avoid\nexport default {}\n```\n",
    );
    expect(rule).toEqual({
      description: "A module has no default export.",
      never: "export default {}",
    });
  });

  const body = (...lines: ReadonlyArray<string>) =>
    parse(["---", "description: d", "---", "", ...lines, ""].join("\n"));

  it("a heading of must and never, or should and should not, names the code in its section", async () => {
    expect(
      await body("## Must", "", "```ts", "a()", "```", "", "## Never", "", "```ts", "b()", "```"),
    ).toEqual({
      description: "d",
      must: "a()",
      never: "b()",
    });
    // In any case, with or without a colon or a closing run of #s.
    expect(
      await body("# should", "```ts", "a()", "```", "### Should not: ###", "```ts", "b()", "```"),
    ).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    expect(await body("## Must not", "```ts", "b()", "```")).toEqual({
      description: "d",
      never: "b()",
    });
  });

  it("a deeper heading stays in the section above it, and the next heading at its level ends it", async () => {
    const rule = await body(
      "## Never",
      "",
      "### A bare number",
      "",
      "```ts",
      "b()",
      "```",
      "",
      "## Notes",
      "",
      "```ts",
      "a()",
      "```",
    );
    expect(rule).toEqual({ description: "d", must: "a()", never: "b()" });
  });

  it("a fence's own word wins over its heading's", async () => {
    const rule = await body("## Must", "", "```ts never", "b()", "```", "", "```ts", "a()", "```");
    expect(rule).toEqual({ description: "d", must: "a()", never: "b()" });
  });

  it("names a word only in a heading that is the word alone, outside any fence", async () => {
    expect(await body("## Why never", "", "```ts", "a()", "```")).toEqual({
      description: "d",
      must: "a()",
    });
    // A `#` line in a fence is code, so the fence after it is still under Never.
    expect(
      await body("## Never", "", "```sh", "# Must", "b", "```", "", "```sh", "c", "```"),
    ).toEqual({
      description: "d",
      never: "# Must\nb",
    });
  });

  it("front matter's tests says a rule judges test files, only them or as well", async () => {
    expect(await parse("---\ndescription: d\ntests: only\n---\na()\n")).toEqual({
      description: "d",
      tests: "only",
      must: "a()",
    });
    expect(await parse("---\ndescription: d\ntests: include\n---\na()\n")).toMatchObject({
      tests: "include",
    });
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown("---\ndescription: d\ntests: always\n---\na()\n", "rules/a.md"),
      ),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("front matter's appliesTo and excludeIf are JSON arrays of strings", async () => {
    expect(
      await parse(
        '---\ndescription: d\nappliesTo: ["a declared union"]\nexcludeIf: ["a Slack block", "a row"]\n---\na()\n',
      ),
    ).toEqual({
      description: "d",
      appliesTo: ["a declared union"],
      excludeIf: ["a Slack block", "a row"],
      must: "a()",
    });
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown(
          "---\ndescription: d\nexcludeIf: a Slack block\n---\na()\n",
          "rules/a.md",
        ),
      ),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("front matter's level makes a rule's findings warnings", async () => {
    expect(await parse("---\ndescription: d\nlevel: warning\n---\na()\n")).toEqual({
      description: "d",
      level: "warning",
      must: "a()",
    });
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\ndescription: d\nlevel: nit\n---\na()\n", "rules/a.md")),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("refuses a body with no code, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\ndescription: d\n---\n\n", "rules/a.md")),
    );
    expect(refused.message).toContain("rules/a.md: the body needs code");
  });

  it("refuses a rule that is both a requirement and a guideline, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown(
          "---\ndescription: d\n---\n\n```ts must\na()\n```\n\n```ts should not\nb()\n```\n",
          "rules/a.md",
        ),
      ),
    );
    expect(refused.message).toBe(
      "rules/a.md: a rule is a requirement (must, never) or a guideline (should, should not), not both",
    );
  });

  it("refuses a file without a description, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\nthreshold: 0.8\n---\ncode", "rules/a.md")),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("rules/a.md");
    expect(refused.message).toContain("description");
  });

  it("loads a directory: each rule is a directory holding a RULE.md, and its path is the id", async () => {
    const tree: Record<string, string> = {
      "/repo/rules/basics/gen/RULE.md": "---\ndescription: gen\n---\n```ts\ngen()\n```\n",
      "/repo/rules/data/brand/RULE.md": "---\ndescription: brand\n---\nbrand()\n",
    };
    const fs = FileSystem.layerNoop({
      // A recursive listing names directories too. A README and a note in a rule's directory are no rules.
      readDirectory: () =>
        Effect.succeed([
          "basics",
          "basics/gen",
          "basics/gen/RULE.md",
          "data",
          "data/brand",
          "data/brand/RULE.md",
          "data/brand/why.md",
          "README.md",
          "notes.txt",
        ]),
      readFileString: (file) => Effect.succeed(tree[file] ?? ""),
    });
    const rules = await Effect.runPromise(
      loadRules("/repo/rules").pipe(Effect.provide(Layer.merge(fs, Path.layer))),
    );
    expect(rules).toEqual({
      "basics/gen": { description: "gen", must: "gen()" },
      "data/brand": { description: "brand", must: "brand()" },
    });
  });
});

/** Node's file system, as Bun's layer provides it, for tests that walk a real tree. */
const realFileSystem = Layer.merge(BunFileSystem.layer, Path.layer);

/** Writes each file of `tree` under a new temporary directory, and returns the directory. */
const onDisk = async (tree: Readonly<Record<string, string>>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "adhere-tree-"));
  for (const [relative, content] of Object.entries(tree)) {
    await mkdir(dirname(join(root, relative)), { recursive: true });
    await writeFile(join(root, relative), content, "utf8");
  }
  return root;
};

describe("rule ids in output", () => {
  it("puts a preset rule's whole preset first, and leaves the project's own ids alone", () => {
    expect(shownId({ id: "basics/gen-for-sequencing", preset: "effect" })).toBe(
      "effect/basics/gen-for-sequencing",
    );
    expect(shownId({ id: "data/brand-ports" })).toBe("data/brand-ports");
    expect(wholePresetOf("effect/basics")).toBe("effect");
    expect(wholePresetOf("alchemy")).toBe("alchemy");
  });
});

describe("walk", () => {
  it("lists files a directory at a time, never into a skipped one or through a link to one", async () => {
    const root = await onDisk({
      "src/a.ts": "",
      "src/deep/b.ts": "",
      "node_modules/pkg/index.ts": "",
      "packages/api/node_modules/dep/index.ts": "",
      ".git/HEAD": "",
    });
    await symlink(join(root, "src"), join(root, "packages", "api", "linked"));
    await symlink("..", join(root, "src", "deep", "up"));
    await symlink(join(root, "src", "a.ts"), join(root, "packages", "api", "alias.ts"));
    await symlink(join(root, "nowhere"), join(root, "src", "dangling"));

    const progress: Array<readonly [number, number]> = [];
    const files = await Effect.runPromise(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        return yield* walkFiles(
          fs,
          path,
          root,
          (relative) => {
            const name = relative.split("/").at(-1);
            return name !== "node_modules" && name !== ".git";
          },
          (directories, found) => Effect.sync(() => progress.push([directories, found])),
        );
      }).pipe(Effect.provide(realFileSystem)),
    );

    // The link to a file is listed; the link to src/, the cycle, and the link to nothing are not.
    expect(files).toEqual(["packages/api/alias.ts", "src/a.ts", "src/deep/b.ts"]);
    // The root, src/, src/deep/, packages/, and packages/api/ were read, in that many steps.
    expect(progress.at(-1)).toEqual([5, 3]);
  });
});

describe("nested .adhere rules", () => {
  it("loads every .adhere directory with the containing directory as scope", async () => {
    const root = await onDisk({
      ".adhere/rules/style/service/RULE.md": "---\ndescription: root\n---\nroot()\n",
      ".adhere/cache/ignored.md": "not a rule, so reading it would refuse the load",
      "packages/api/.adhere/rules/style/service/RULE.md": "---\ndescription: api\n---\napi()\n",
      "packages/api/.adhere/rules/api/schema/RULE.md": "---\ndescription: schema\n---\nschema()\n",
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries).toEqual([
      {
        id: "style/service",
        file: `${root}/.adhere/rules/style/service/RULE.md`,
        scope: root,
        rule: { description: "root", must: "root()" },
      },
      {
        id: "api/schema",
        file: `${root}/packages/api/.adhere/rules/api/schema/RULE.md`,
        scope: `${root}/packages/api`,
        rule: { description: "schema", must: "schema()" },
      },
      {
        id: "style/service",
        file: `${root}/packages/api/.adhere/rules/style/service/RULE.md`,
        scope: `${root}/packages/api`,
        rule: { description: "api", must: "api()" },
      },
    ]);
  });

  it("loads a RULE.ts by its default export, which can import a helper beside it", async () => {
    // Neither the config nor the helper default-exports a rule, so reading either as one would refuse the load.
    const root = await onDisk({
      ".adhere/config.ts": "export default {};\n",
      ".adhere/rules/data/ports/RULE.ts": [
        'import { ports } from "./ports.ts";',
        "",
        'export default { description: "A port must be branded.", must: "Port.make(3000)", appendState: () => ({ ports }) };',
        "",
      ].join("\n"),
      ".adhere/rules/data/ports/ports.ts": "export const ports = [3000];\n",
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries).toMatchObject([
      {
        id: "data/ports",
        file: `${root}/.adhere/rules/data/ports/RULE.ts`,
        scope: root,
        rule: { description: "A port must be branded.", must: "Port.make(3000)" },
      },
    ]);
    const added = await entries[0]?.rule.appendState?.(
      { code: {} },
      { path: "", contents: "" },
      undefined as never,
    );
    expect(added).toEqual({ ports: [3000] });
  });

  it("refuses a TypeScript rule file that default-exports no rule, naming the file", async () => {
    const root = await onDisk({
      ".adhere/rules/ports/RULE.ts": 'export const rule = { description: "d", must: "m()" };\n',
    });

    const refused = await Effect.runPromise(
      Effect.flip(loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem))),
    );

    expect(refused.message).toContain(
      `${root}/.adhere/rules/ports/RULE.ts: a rule file must default-export defineRule({...})`,
    );
  });

  it("refuses a Markdown file outside every rule's directory, saying where it goes to keep its id", async () => {
    const root = await onDisk({
      ".adhere/rules/data/ports/RULE.md": "---\ndescription: ports\n---\nports()\n",
      ".adhere/rules/data/ports/why.md": "In a rule's directory, so no rule.\n",
      ".adhere/rules/README.md": "# The rules\n",
      ".adhere/rules/secrets.md": "---\ndescription: secrets\n---\nsecrets()\n",
      ".adhere/style/service.md": "---\ndescription: service\n---\nservice()\n",
    });

    const refused = await Effect.runPromise(
      Effect.flip(loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem))),
    );

    expect(refused.message).toBe(
      [
        "Rules now live one to a directory, as .adhere/rules/<id>/RULE.md or RULE.ts. Move each of these to keep its id:",
        "  .adhere/rules/secrets.md → .adhere/rules/rules/secrets/RULE.md",
        "  .adhere/style/service.md → .adhere/rules/style/service/RULE.md",
      ].join("\n"),
    );
  });

  it("refuses a rule's directory that holds both a RULE.md and a RULE.ts", async () => {
    const root = await onDisk({
      ".adhere/rules/ports/RULE.md": "---\ndescription: ports\n---\nports()\n",
      ".adhere/rules/ports/RULE.ts": "export default {};\n",
    });

    const refused = await Effect.runPromise(
      Effect.flip(loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem))),
    );

    expect(refused.message).toBe(".adhere/rules/ports: a rule is a RULE.md or a RULE.ts, not both");
  });

  it("skips .adhere directories inside dependency and generated trees, and through links", async () => {
    // A skipped file is not a rule, so reading it would refuse the load.
    const root = await onDisk({
      ".adhere/rules/e2e/isolated/RULE.md": "---\ndescription: isolated\n---\nisolated()\n",
      "node_modules/@drkmttr/adhere/.adhere/rules/refusals-name-the-file/RULE.md": "not a rule",
      "dist/.adhere/rules/style/service/RULE.md": "not a rule",
      ".git/.adhere/rules/leftover/RULE.md": "not a rule",
    });
    // A workspace package linked into node_modules and back, as pnpm links them.
    await mkdir(join(root, "packages"), { recursive: true });
    await symlink(join(root, ".adhere"), join(root, "packages", "linked"));
    await symlink("..", join(root, "packages", "loop"));

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries.map((entry) => entry.id)).toEqual(["e2e/isolated"]);
  });

  it("applies root rules globally and lets the nearest nested rule shadow the same id", () => {
    const rootOnly = { description: "Root only.", must: "rootOnly()" };
    const rootShadowed = { description: "Root service.", must: "root()" };
    const apiShadow = { description: "API service.", must: "api()" };
    const apiOnly = { description: "API only.", must: "apiOnly()" };

    const entries = [
      {
        id: "style/root-only",
        file: "/repo/.adhere/rules/style/root-only/RULE.md",
        scope: "/repo",
        rule: rootOnly,
      },
      {
        id: "style/service",
        file: "/repo/.adhere/rules/style/service/RULE.md",
        scope: "/repo",
        rule: rootShadowed,
      },
      {
        id: "style/service",
        file: "/repo/packages/api/.adhere/rules/style/service/RULE.md",
        scope: "/repo/packages/api",
        rule: apiShadow,
      },
      {
        id: "api/schema",
        file: "/repo/packages/api/.adhere/rules/api/schema/RULE.md",
        scope: "/repo/packages/api",
        rule: apiOnly,
      },
    ];

    expect(applicableRules("/repo/packages/api/src/index.ts", entries)).toEqual({
      "api/schema": apiOnly,
      "style/root-only": rootOnly,
      "style/service": apiShadow,
    });
    expect(applicableRules("/repo/packages/web/src/index.ts", entries)).toEqual({
      "style/root-only": rootOnly,
      "style/service": rootShadowed,
    });
  });
});

describe("adhere-ignore", () => {
  const provider = [
    "export const Policy = Provider.effect({",
    "  // adhere-ignore alchemy/providers/idempotent-delete -- AWS returns success for a missing policy",
    "  delete: Effect.fn(function* ({ output }) {",
    "    yield* autoscaling.deletePolicy({ PolicyName: output.policyName });",
    "  }),",
    "  read: Effect.fn(function* ({ output }) {",
    "    return yield* autoscaling.describePolicy({ PolicyName: output.policyName });",
    "  }),",
    "});",
  ];

  it("covers the statement below the comment, wherever in it Jev points, and blanks the comment", () => {
    const { lines, suppressions } = suppressionsOf(provider);
    expect(lines).toHaveLength(provider.length);
    expect(lines[1]).toBe("");
    expect(lines.filter((line, index) => line !== provider[index])).toEqual([""]);
    const rule = "alchemy/providers/idempotent-delete";
    expect([3, 4, 5].map((line) => suppresses(suppressions, rule, lineAt(line)))).toEqual([
      true,
      true,
      true,
    ]);
    expect(suppresses(suppressions, rule, lineAt(7))).toBe(false);
    // A section that holds the statement, beside code it does not cover, is covered too.
    expect(suppresses(suppressions, rule, { first: 6, last: 9 })).toBe(false);
    expect(suppresses(suppressions, rule, { first: 1, last: 7 })).toBe(true);
    expect(suppresses(suppressions, "effect/data/brand-meaningful-primitives", lineAt(4))).toBe(
      false,
    );
  });

  it("covers a trailing comment's own line, a whole file, and several rules at once", () => {
    const { lines, suppressions } = suppressionsOf([
      "// adhere-ignore-file effect/basics/gen-for-sequencing -- generated",
      "const a = 1; // adhere-ignore data/ports, data/names -- a fixed port",
      "const b = 2;",
    ]);
    expect(lines).toEqual(["", "const a = 1;", "const b = 2;"]);
    expect(suppresses(suppressions, "effect/basics/gen-for-sequencing", lineAt(3))).toBe(true);
    expect(suppresses(suppressions, "data/ports", lineAt(2))).toBe(true);
    expect(suppresses(suppressions, "data/names", lineAt(2))).toBe(true);
    expect(suppresses(suppressions, "data/ports", lineAt(3))).toBe(false);
  });

  it("reads a comment only: a string that mentions adhere-ignore, or a comment naming no rule, suppresses nothing", () => {
    const code = [
      'const hint = "// adhere-ignore data/ports -- in a string";',
      "// adhere-ignore -- no rule named",
      "const port = 1;",
    ];
    const { lines, suppressions } = suppressionsOf(code);
    expect(lines).toEqual(code);
    expect(suppressions.statements).toEqual([]);
    expect(suppressions.file.size).toBe(0);
  });
});

describe("comments", () => {
  it("keeps a comment that says @adhere anywhere in it, and returns a file without comments as it is", () => {
    const lines = [
      "// plain",
      "/** Deletes the activity. @adhere DeleteActivity succeeds on a missing activity. */",
      "const x = 1; // trailing",
    ];
    expect(withoutComments(lines, isNote)).toEqual(["", lines[1], "const x = 1;"]);
    const bare = ["const x = 1;", "const y = x / 2;"];
    expect(withoutComments(bare, isNote)).toBe(bare);
  });

  it("takes comments out, keeping every line and its number", () => {
    const lines = [
      "/**",
      " * Deleting a missing policy returns success.",
      " */",
      "const retries = 3; // enough",
      "const every = /* seconds */ 5;",
      "  // gone",
      "export const x = 1;",
    ];
    expect(withoutComments(lines)).toEqual([
      "",
      "",
      "",
      "const retries = 3;",
      "const every =  5;",
      "",
      "export const x = 1;",
    ]);
  });

  it("keeps a string, template literal, or regular expression that holds a comment's marks", () => {
    const lines = [
      'const url = "https://example.com"; // the site',
      "const path = `a//b/*c*/`;",
      "const slashes = /\\/\\//g;",
    ];
    expect(withoutComments(lines)).toEqual([
      'const url = "https://example.com";',
      "const path = `a//b/*c*/`;",
      "const slashes = /\\/\\//g;",
    ]);
  });

  it("takes JSX comments out, and keeps a URL in JSX text", () => {
    const lines = [
      "return (",
      "  <div>",
      "    {/* the docs */}",
      '    <a href="https://example.com">https://example.com/docs</a>',
      "  </div>",
      ");",
    ];
    expect(withoutComments(lines)).toEqual([
      "return (",
      "  <div>",
      "    {}",
      '    <a href="https://example.com">https://example.com/docs</a>',
      "  </div>",
      ");",
    ]);
  });
});

describe("source walker", () => {
  it("keeps the files a filter's globs match, and leaves out what a ! pattern matches", () => {
    expect(passesFilter("src/a.ts", [])).toBe(true);
    expect(passesFilter("src/deep/a.ts", ["src/**"])).toBe(true);
    expect(passesFilter("lib/a.ts", ["src/**"])).toBe(false);
    expect(passesFilter("src/billing.service.ts", ["**/*.service.ts"])).toBe(true);
    expect(passesFilter("packages/web/a.ts", ["packages/{api,web}/**"])).toBe(true);
    expect(passesFilter("src/gen/a.ts", ["src/**", "!src/gen/**"])).toBe(false);
    expect(passesFilter("src/a.ts", ["!src/gen/**"])).toBe(true);
    expect(passesFilter("src\\a.ts", ["src/*.ts"])).toBe(true);
  });

  it("skips dependency, generated, and .adhere trees by whole path segment", () => {
    expect(isInSkippedTree("src/server.ts")).toBe(false);
    expect(isInSkippedTree("vendorized/lib.ts")).toBe(false);
    expect(isInSkippedTree("packages/api/node_modules/pkg/index.ts")).toBe(true);
    expect(isInSkippedTree("dist/main.ts")).toBe(true);
    expect(isInSkippedTree(".adhere/config.ts")).toBe(true);
  });

  it("reads .ts, .tsx, .mts, and .cts files, but not declaration files or JavaScript", () => {
    for (const name of ["a.ts", "Button.tsx", "a.mts", "a.cts"]) {
      expect(isScannable(`/repo/src/${name}`, "/adhere")).toBe(true);
    }
    for (const name of ["a.d.ts", "a.d.mts", "a.d.cts", "a.js", "a.jsx", "a.mjs"]) {
      expect(isScannable(`/repo/src/${name}`, "/adhere")).toBe(false);
    }
  });

  it("counts .test.ts and .spec.ts files, and files under a test directory, as tests", () => {
    expect(isTestFile("src/a.test.ts")).toBe(true);
    expect(isTestFile("src/a.spec.ts")).toBe(true);
    expect(isTestFile("src/Button.test.tsx")).toBe(true);
    expect(isTestFile("src/a.spec.mts")).toBe(true);
    expect(isTestFile("src/test-utils.tsx")).toBe(true);
    expect(isTestFile("packages/api/test/helpers/layer.ts")).toBe(true);
    expect(isTestFile("src/__tests__/a.ts")).toBe(true);
    expect(isTestFile("fixtures/worker.ts")).toBe(true);
    expect(isTestFile("src/testing/clock.ts")).toBe(true);
    expect(isTestFile("src/coder/fixture/case-env.ts")).toBe(true);
    expect(isTestFile("src/__mocks__/fs.ts")).toBe(true);
    for (const name of [
      "fixtures.ts",
      "GitHubHttpFixtures.ts",
      "ledger-copy.fixture.ts",
      "fetch-errors.fixtures.ts",
      "attribution-test-fixtures.ts",
      "linear-test-helpers.ts",
      "GitHubHttpTestUtils.ts",
      "test-utils.ts",
    ]) {
      expect(isTestFile(`src/${name}`)).toBe(true);
    }
    expect(isTestFile("src/test.ts")).toBe(false);
    expect(isTestFile("src/latest-utils.ts")).toBe(false);
    expect(isTestFile("src/tester/TestRun.ts")).toBe(false);
    expect(isTestFile("src/test-runs/test-draft.ts")).toBe(false);
    expect(isTestFile("src/AWS/B2BI/TestConversionHttp.ts")).toBe(false);
  });
});

describe("contradictions", () => {
  const entry = (id: string, scope: string, description: string): RuleEntry => ({
    id,
    scope,
    file: `${scope}/.adhere/rules/${id}/RULE.md`,
    rule: { description, must: `${id}()` },
  });
  const entries = [
    entry("style/use-services", "/repo", "Use service classes for IO."),
    entry("style/plain-functions", "/repo/packages/api", "IO is plain functions, not classes."),
    entry("style/unrelated", "/repo/packages/web", "Avoid mutable globals."),
    entry("style/use-services", "/repo/packages/api", "API services are classes too."),
  ];

  const comparingJev = (
    named: ReadonlyArray<Pair>,
    probabilities: Readonly<Record<string, number>>,
  ) => {
    const calls = {
      conflicts: [] as Array<ReadonlyArray<ReadonlyArray<number>>>,
      contradicts: [] as Array<ReadonlyArray<Pair>>,
    };
    const layer = Layer.succeed(Jev, {
      judge: () => Effect.die("comparing rules judges no file"),
      locate: () => Effect.die("comparing rules judges no file"),
      conflicts: (_rules, partners) =>
        Effect.sync(() => {
          calls.conflicts.push(partners);
          return named;
        }),
      contradicts: (_rules, pairs) =>
        Effect.sync(() => {
          calls.contradicts.push(pairs);
          return pairs.map(([first, second]) => probabilities[`${first}-${second}`] ?? 0);
        }),
    });
    return { calls, layer };
  };

  it("offers no pair of a rule on tests only and a rule that skips tests, which share no file", async () => {
    const jev = comparingJev([], {});
    const onTests: RuleEntry = {
      ...entry("testing/clock", "/repo", "A test must use the test clock."),
      rule: { description: "A test must use the test clock.", must: "clock()", tests: "only" },
    };
    const contradictions = await Effect.runPromise(
      findContradictions(
        [entry("style/use-services", "/repo", "Use service classes for IO."), onTests],
        0.7,
      ).pipe(Effect.provide(jev.layer)),
    );
    expect(contradictions).toEqual([]);
    expect(jev.calls.conflicts).toEqual([]);
  });

  it("offers each rule the rules sharing its files, then reports the pairs Jev confirms", async () => {
    const jev = comparingJev(
      [
        [0, 1],
        [1, 0],
        [3, 1],
      ],
      { "0-1": 0.9, "1-3": 0.4 },
    );
    const contradictions = await Effect.runPromise(
      findContradictions(entries, 0.7).pipe(Effect.provide(jev.layer)),
    );

    // A shared id is shadowing, and packages/api and packages/web share no files.
    expect(jev.calls.conflicts).toEqual([[[1, 2], [0, 3], [0], [1]]]);
    expect(jev.calls.contradicts).toEqual([
      [
        [0, 1],
        [1, 3],
      ],
    ]);
    expect(contradictions).toEqual([{ first: entries[0], second: entries[1], probability: 0.9 }]);
    const report = formatContradictions(contradictions);
    expect(report).toContain("1. No code can follow both (0.90):");
    expect(report).toContain("/repo/.adhere/rules/style/use-services/RULE.md");
    expect(report).toContain("/repo/packages/api/.adhere/rules/style/plain-functions/RULE.md");
    // A preset's rule names its preset, where the project's own names its file.
    const fromPreset: RuleEntry = {
      id: "services/provide-at-entry",
      scope: "/repo",
      preset: "effect",
      rule: { description: "Layers must be provided once, at the entry.", must: "run()" },
    };
    const mixed = formatContradictions([
      { first: entries[0]!, second: fromPreset, probability: 0.8 },
    ]);
    expect(mixed).toContain("   - effect/services/provide-at-entry\n");
    expect(mixed).toContain(
      "   - style/use-services (/repo/.adhere/rules/style/use-services/RULE.md)\n",
    );
  });

  it("asks nothing when no two rules share files", async () => {
    const jev = comparingJev([], {});
    const contradictions = await Effect.runPromise(
      findContradictions(entries.slice(1, 3), 0.7).pipe(Effect.provide(jev.layer)),
    );
    expect(jev.calls).toEqual({ conflicts: [], contradicts: [] });
    expect(contradictions).toEqual([]);
  });

  it("conflicts: per rule a choice among the rules sharing its files; then a noul per pair", () => {
    const compared = [
      { id: "x", rule: { description: "X.", must: "x()" } },
      { id: "y", rule: { description: "Y.", never: "y()" } },
      { id: "z", rule: { description: "Z.", must: "z()" } },
    ];
    const state = {
      rules: {
        "0": { id: "x", description: "X.", must: "x()" },
        "1": { id: "y", description: "Y.", never: "y()" },
      },
    };
    const choice = (rule: string, criteria: Record<string, string>) => ({
      type: "choice",
      instructions: `Each choice other than none is the rule in state.rules under its key. Which of them demands the opposite of what state.rules["${rule}"] demands of the same code, so that following one breaks the other? Choose none if code can follow each of them alongside it.`,
      criteria: { none: "None of them", ...criteria },
    });

    expect(conflictBody("jev-latest", compared, [[1], [0], []])).toEqual({
      model: "jev-latest",
      state,
      questions: { "0:0": choice("0", { "1": "Y." }), "1:0": choice("1", { "0": "X." }) },
    });
    expect(contradictBody("jev-latest", compared, [0, 1])).toEqual({
      model: "jev-latest",
      state,
      questions: {
        "0-1": {
          type: "noul",
          instructions:
            'Do state.rules["0"] and state.rules["1"] demand opposite things of the same code, so that following one breaks the other? Answer no if code can follow both, or if they are about different things.',
        },
      },
    });
  });

  it("reads a pair from each chosen partner that was offered, and a pair's probability", () => {
    const partners = [[1, 2], [0], [0]];
    expect(
      namedPairs(
        { "0:0": { choice: "2" }, "1:0": { choice: "none" }, "2:0": { choice: "7" } },
        partners,
      ),
    ).toEqual([[0, 2]]);
    expect(pairProbability({ "0-2": { noul: 0.8 } }, [0, 2])).toBe(0.8);
    expect(pairProbability({ "0-2": { noul: 0.8 } }, [0, 1])).toBe(0);
  });

  it("conflicts: a rule with more partners than a choice holds gets one question per chunk", () => {
    const compared = Array.from({ length: 300 }, (_, index) => ({
      id: `r${index}`,
      rule: { description: `R${index}.`, must: "r()" },
    }));
    const partners = compared.map((_, index) =>
      index === 0 ? Array.from({ length: 299 }, (__, other) => other + 1) : [],
    );
    const { questions } = conflictBody("jev-latest", compared, partners);
    expect(Object.keys(questions)).toEqual(["0:0", "0:1"]);
    expect(Object.keys(questions["0:0"]?.criteria ?? {})).toHaveLength(255);
    expect(Object.keys(questions["0:1"]?.criteria ?? {})).toHaveLength(46);
  });
});

describe("wording", () => {
  it("a rule worded as the tips recommend strays by nothing, whole words in any case", () => {
    expect(
      strayingOf({
        description: "A port must be branded, never a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([]);
    expect(
      strayingOf({ description: "Ports MUST be branded. Never bare.", must: "a()", never: "b()" }),
    ).toEqual([]);
    expect(
      strayingOf({
        description: "A file should be small, and should not do two jobs.",
        should: "a()",
        shouldNot: "b()",
      }),
    ).toEqual([]);
  });

  it("a description that does not say a word its code is under strays by each such word", () => {
    expect(
      strayingOf({
        description: "A port is branded, not a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([
      { _tag: "Unsaid", word: "must" },
      { _tag: "Unsaid", word: "never" },
    ]);
    // Part of a word is not the word.
    expect(strayingOf({ description: "Mustard, nevermore.", must: "a()", never: "b()" })).toEqual([
      { _tag: "Unsaid", word: "must" },
      { _tag: "Unsaid", word: "never" },
    ]);
    expect(
      strayingOf({ description: "A file should be small.", should: "a()", shouldNot: "b()" }),
    ).toEqual([{ _tag: "Unsaid", word: "should not" }]);
  });

  it("code to write without code that breaks the rule strays; code that breaks it alone does not", () => {
    expect(strayingOf({ description: "Ports must be branded.", must: "a()" })).toEqual([
      { _tag: "Unshown", word: "never" },
    ]);
    expect(strayingOf({ description: "A file should be small.", should: "a()" })).toEqual([
      { _tag: "Unshown", word: "should not" },
    ]);
    expect(strayingOf({ description: "Code must never retry by hand.", never: "b()" })).toEqual([]);
  });

  it("a description in the other kind of rule's words strays by each", () => {
    expect(
      strayingOf({
        description: "A port must be branded and should never be a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([{ _tag: "Mixed", word: "should" }]);
    expect(
      strayingOf({
        description: "A file should be small and should not do two jobs; it must never grow.",
        should: "a()",
        shouldNot: "b()",
      }),
    ).toEqual([
      { _tag: "Mixed", word: "must" },
      { _tag: "Mixed", word: "never" },
    ]);
  });

  it("lists each rule that strays, with its file and how, then the tips", () => {
    const entries: ReadonlyArray<RuleEntry> = [
      {
        id: "data/ports",
        scope: "/repo",
        file: "/repo/.adhere/rules/data/ports/RULE.md",
        rule: { description: "A port is branded.", must: "a()" },
      },
      {
        id: "data/ids",
        scope: "/repo",
        rule: {
          description: "An id must be branded, never a bare string.",
          must: "a()",
          never: "b()",
        },
      },
      {
        id: "style/small",
        scope: "/repo",
        rule: { description: "A file must be small.", should: "a()", shouldNot: "b()" },
      },
    ];
    expect(formatStrays(straysAmong(entries), "/repo")).toEqual([
      "2 rules are not worded as the rule writing tips recommend:",
      "  data/ports (.adhere/rules/data/ports/RULE.md)",
      '    The description does not say "must", though the rule has a must example.',
      "    The rule has no never example. Rules with one example of each kind judge best.",
      "  style/small",
      '    The description does not say "should", though the rule has a should example.',
      '    The description does not say "should not", though the rule has a should not example.',
      '    The description says "must", a requirement\'s word, but the rule is a guideline.',
      `Rule writing tips: ${TIPS_URL}`,
    ]);
    expect(formatStrays(straysAmong(entries.slice(1, 2)), "/repo")).toEqual([
      "Every rule is worded as the rule writing tips recommend.",
    ]);
  });

  it("every rule of every preset is worded as the tips recommend", async () => {
    const fs = FileSystem.layerNoop({
      readDirectory: (directory) => Effect.promise(() => readdir(directory, { recursive: true })),
      readFileString: (file) => Effect.promise(() => readFile(file, "utf8")),
    });
    for (const preset of Object.values(presets)) {
      const rules = await Effect.runPromise(
        loadRules(fileURLToPath(preset.rules)).pipe(Effect.provide(Layer.merge(fs, Path.layer))),
      );
      expect(Object.keys(rules).length).toBeGreaterThan(0);
      expect(
        Record.filter(Record.map(rules, strayingOf), (straying) => straying.length > 0),
      ).toEqual({});
    }
  });
});

describe("presets", () => {
  it("names each preset's topics after its subdirectories that are not rules", async () => {
    for (const name of Object.keys(presets) as ReadonlyArray<keyof typeof presets>) {
      const directory = fileURLToPath(presets[name].rules);
      const entries = await readdir(directory, { withFileTypes: true });
      const topics = entries.filter(
        (entry) => entry.isDirectory() && !existsSync(join(directory, entry.name, "RULE.md")),
      );
      expect([...topicsOf(name)].sort()).toEqual(topics.map((entry) => entry.name).sort());
    }
  });

  it("reads a topic from its whole preset's directory, keeping the preset's rule ids", () => {
    expect(presetOf("effect/basics")).toEqual({ rules: presets.effect.rules, topic: "basics" });
    expect(presetOf("alchemy")).toEqual({ rules: presets.alchemy.rules });
  });

  it("applies each preset once, and a topic only when its whole preset is not named", () => {
    expect(
      presetsOf(
        { presets: ["effect", "effect/basics", "alchemy/secrets"] },
        { presets: ["effect"] },
      ),
    ).toEqual(["effect", "alchemy/secrets"]);
    expect(presetsOf({ presets: ["effect/basics", "effect/data"] }, {})).toEqual([
      "effect/basics",
      "effect/data",
    ]);
  });
});

describe("init", () => {
  it("scaffolds config and example rules without clobbering existing files", async () => {
    const root = join(tmpdir(), `adhere-init-${Date.now()}`);
    await Effect.runPromise(initProject(root));
    const config = await readFile(join(root, ".adhere", "config.ts"), "utf8");
    const project = JSON.parse(await readFile(join(root, ".adhere", "tsconfig.json"), "utf8"));
    const rule = await readFile(
      join(root, ".adhere", "rules", "style", "prefer-small-files", "RULE.md"),
      "utf8",
    );

    expect(config).toContain('import { defineConfig } from "@drkmttr/adhere";');
    expect(config).toContain("export default defineConfig({");
    // A tsconfig's globs skip .adhere/, so the config and TypeScript rules get a project that resolves the package.
    expect(project).toMatchObject({
      compilerOptions: { moduleResolution: "bundler" },
      include: ["**/*.ts"],
    });
    expect(rule).toContain("description:");

    const second = await Effect.runPromise(initProject(root));
    expect(second.created).toEqual([]);
    expect(second.skipped).toContain(".adhere/config.ts");
    expect(second.skipped).toContain(".adhere/tsconfig.json");
    expect(second.skipped).toContain(".adhere/rules/style/prefer-small-files/RULE.md");
  });

  it("scaffolds example rules worded as the rule writing tips recommend", async () => {
    const root = join(tmpdir(), `adhere-init-wording-${Date.now()}`);
    await Effect.runPromise(initProject(root));

    for (const name of ["prefer-small-files", "name-domain-actions"]) {
      const file = join(root, ".adhere", "rules", "style", name, "RULE.md");
      const rule = await Effect.runPromise(parseRuleMarkdown(await readFile(file, "utf8"), file));
      expect(strayingOf(rule)).toEqual([]);
    }
  });

  it("adds adhere to package.json only where there is one without it", async () => {
    const bare = join(tmpdir(), `adhere-init-bare-${Date.now()}`);
    expect((await Effect.runPromise(initProject(bare))).install).toEqual({
      status: "no-package-json",
    });

    const listed = join(tmpdir(), `adhere-init-listed-${Date.now()}`);
    await mkdir(listed, { recursive: true });
    await writeFile(
      join(listed, "package.json"),
      JSON.stringify({ devDependencies: { "@drkmttr/adhere": "^0.9.0" } }),
      "utf8",
    );
    expect((await Effect.runPromise(initProject(listed))).install).toEqual({ status: "listed" });
  });

  it("scaffolds a shared repo with a README, a CI workflow that validates, and a stack, but no config", async () => {
    const root = join(tmpdir(), `adhere-init-shared-${Date.now()}`);
    await mkdir(root, { recursive: true });
    // An existing package.json with nothing to install keeps npm off the network.
    await writeFile(join(root, "package.json"), '{ "name": "standards" }\n', "utf8");
    const result = await Effect.runPromise(initProject(root, { shared: "acme/standards" }));
    const read = (path: string) => readFile(join(root, path), "utf8");

    expect(result.created).toEqual([
      "README.md",
      ".github/workflows/adhere.yaml",
      "alchemy.run.ts",
      ".gitignore",
      ".adhere/rules/style/prefer-small-files/RULE.md",
      ".adhere/rules/style/name-domain-actions/RULE.md",
    ]);
    expect(result.skipped).toEqual(["package.json"]);
    expect(result.install).toEqual({
      status: "installed",
      what: "package.json",
      packageManager: "npm",
    });
    expect(await read("README.md")).toContain("adhere install acme/standards\n");
    expect(await read(".github/workflows/adhere.yaml")).toContain(
      "npx --yes @drkmttr/adhere validate\n        env:\n          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}",
    );
    const stack = await read("alchemy.run.ts");
    expect(stack).toContain('const owner = "acme";');
    expect(stack).toContain('name: "standards",');
    expect(stack).toContain('name: "TYPESAFE_API_KEY",');
    expect(stack).toContain('visibility: "public",');
    await expect(access(join(root, ".adhere", "config.ts"))).rejects.toThrow();
  });

  it("makes a shared repo private when asked", async () => {
    const root = join(tmpdir(), `adhere-init-private-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "package.json"), '{ "name": "standards" }\n', "utf8");
    await Effect.runPromise(initProject(root, { shared: "acme/standards", visibility: "private" }));

    expect(await readFile(join(root, "alchemy.run.ts"), "utf8")).toContain(
      'visibility: "private",',
    );
  });

  it("keeps a config at another accepted path instead of adding a second one", async () => {
    const root = join(tmpdir(), `adhere-init-existing-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "adhere.config.ts"), "export default {};\n", "utf8");

    const result = await Effect.runPromise(initProject(root, { force: true }));

    expect(result.skipped).toContain("adhere.config.ts");
    expect(result.created).not.toContain(".adhere/config.ts");
    expect(result.created).not.toContain(".adhere/tsconfig.json");
    await expect(access(join(root, ".adhere", "config.ts"))).rejects.toThrow();
    await expect(access(join(root, ".adhere", "tsconfig.json"))).rejects.toThrow();
  });
});

const planOf = (options: {
  readonly rules: Rules;
  readonly files: ReadonlyArray<ScannedFile>;
  readonly cache: Layer.Layer<AuditCache>;
  readonly limit?: number;
}) =>
  Effect.runPromise(
    planAudit({ limit: options.limit }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AdhereConfig, {
            model: "jev-latest",
            threshold: 0.7,
            sufficiencyThreshold: 0.7,
            rules: options.rules,
          }),
          Layer.succeed(SourceWalker, { files: Effect.succeed(options.files) }),
          options.cache,
          testCrypto,
        ),
      ),
    ),
  );

describe("plan", () => {
  const other: ScannedFile = { path: "/repo/src/other.ts", lines: ["const x = 1;"] };

  it("judges a test file only by the rules that say tests, and leaves out a file no rule judges", async () => {
    const plain = { description: "Plain.", must: "plain()" };
    const onTests = { description: "On tests.", must: "tests()", tests: "only" as const };
    const alsoTests = { description: "Also tests.", must: "also()", tests: "include" as const };
    const helper: ScannedFile = {
      path: "/repo/test/helper.ts",
      lines: ["const y = 2;"],
      test: true,
    };
    const judgedBy = (planned: AuditPlan) =>
      Object.fromEntries(
        planned.files.map((plan) => [plan.file.path, Object.keys(plan.prepared).sort()]),
      );

    const all = await planOf({
      rules: { plain, onTests, alsoTests },
      files: [other, helper],
      cache: memoryCache(),
    });
    expect(judgedBy(all)).toEqual({
      [other.path]: ["alsoTests", "plain"],
      [helper.path]: ["alsoTests", "onTests"],
    });
    const plainOnly = await planOf({
      rules: { plain },
      files: [other, helper],
      cache: memoryCache(),
    });
    expect(judgedBy(plainOnly)).toEqual({ [other.path]: ["plain"] });
  });

  it("counts the checks, what the cache answers, and the requests the rest take", async () => {
    const cache = memoryCache();
    await audit({
      rules,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
      cache,
    });

    const planned = await planOf({ rules, files: [source, other], cache });
    expect(planned.files.map((plan) => plan.file.path)).toEqual([other.path, source.path]);
    expect({ ...planned, files: planned.files.length }).toEqual({
      files: 2,
      unjudged: [],
      rules: 2,
      checks: 4,
      cached: 2,
      skipped: 0,
      deferred: 0,
      requests: 1,
      tokens: expect.any(Number),
      price: 0.042,
      sufficiencyThreshold: 0.7,
    });
  });

  it("counts the files it has planned on the status line, and clears it after", async () => {
    const shown: Array<string> = [];
    const status = Layer.succeed(Status, {
      show: (text: string) => Effect.sync(() => void shown.push(text)),
      clear: Effect.sync(() => void shown.push("(cleared)")),
    });

    await Effect.runPromise(
      planAudit().pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, {
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              rules,
            }),
            Layer.succeed(SourceWalker, { files: Effect.succeed([source, other]) }),
            memoryCache(),
            testCrypto,
            status,
          ),
        ),
      ),
    );

    expect(shown).toEqual(["Planning: 1 of 2 files", "Planning: 2 of 2 files", "(cleared)"]);
  });

  it("tells progress each file's requests and findings as it finishes", async () => {
    const cache = memoryCache();
    const planned = await planOf({ rules, files: [source, other], cache });
    // Rule a is broken in server.ts, the three-line file, and nowhere else.
    const jev = Layer.succeed(Jev, {
      judge: (lines, asked) =>
        Effect.succeed({
          probabilities: Record.map(asked, (_, id) => (id === "a" && lines.length > 1 ? 0.9 : 0.2)),
          linter: {},
        }),
      locate: (lines, asked) => Effect.succeed(Record.map(asked, () => placedAt(lines, 2))),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const done: Array<FileDone> = [];
    const result = await Effect.runPromise(
      executeAudit(planned, (file) =>
        Effect.sync(() => {
          done.push(file);
        }),
      ).pipe(Effect.provide(Layer.merge(jev, cache))),
    );

    // Both files are judged; only server.ts has a finding, so only it is located too.
    expect([...done].sort((x, y) => x.findings - y.findings)).toEqual([
      { requests: 1, findings: 0 },
      { requests: 2, findings: 1 },
    ]);
    expect(result.findings).toEqual([findingA]);
  });

  it("gives each finding Jev's probability that the file shows enough to decide it, and locates again one cached without", async () => {
    const located: Array<ReadonlyArray<string>> = [];
    const jev = (sufficiency: Record<string, number>) =>
      Layer.succeed(Jev, {
        judge: () => Effect.succeed({ probabilities: { a: 0.9, b: 0.9 }, linter: {} }),
        locate: (lines, asked) =>
          Effect.sync(() => {
            located.push(Object.keys(asked));
            return Record.map(asked, (_, id) => ({
              section: sectionAt(lines, 2),
              sufficiency: sufficiency[id] ?? 0.9,
            }));
          }),
        conflicts: () => Effect.die("an audit compares no rules"),
        contradicts: () => Effect.die("an audit compares no rules"),
      });
    const result = await audit({ rules, jev: jev({ a: 0.25 }), cache: memoryCache() });
    expect(result.findings.map(({ rule, context }) => ({ rule, context }))).toEqual([
      { rule: "a", context: 0.25 },
      { rule: "b", context: 0.9 },
    ]);

    // An answer located before sufficiency was asked has none: its rule is located again,
    // and not judged again.
    const entries = new Map<string, Answers>();
    const withoutSufficiency = Layer.succeed(AuditCache, {
      get: (hash) =>
        Effect.sync(() =>
          Record.map(entries.get(hash) ?? {}, (answer) => {
            const { sufficiency, ...rest } = answer;
            return sufficiency === undefined ? answer : rest;
          }),
        ),
      put: (hash, answers) =>
        Effect.sync(() => {
          entries.set(hash, { ...entries.get(hash), ...answers });
        }),
      tally: () => Effect.succeed(undefined),
      putTally: () => Effect.void,
      prune: () => Effect.succeed(0),
    });
    await audit({ rules, jev: jev({}), cache: withoutSufficiency });
    located.length = 0;
    const again = recordingJev({ judge: {}, locate: { a: 2, b: 2 } });
    await audit({ rules, jev: again.layer, cache: withoutSufficiency });
    expect(again.calls).toEqual({ judge: [], locate: [rules] });
  });

  it("drops a finding its matchers put out of scope, and keeps their scores in the cache", async () => {
    const cache = memoryCache();
    const scoped: Rules = {
      a: { ...a, excludeIf: ["a port a third party fixes"] },
      b: { ...b, appliesTo: ["a secret read from config"] },
    };
    const located: Array<ReadonlyArray<string>> = [];
    const judging = Layer.succeed(Jev, {
      judge: () =>
        Effect.succeed({
          probabilities: { a: 0.9, b: 0.9 },
          linter: {},
          matchers: {
            a: { appliesTo: [], excludeIf: [0.8] },
            b: { appliesTo: [0.7], excludeIf: [] },
          },
        }),
      locate: (lines, asked) =>
        Effect.sync(() => {
          located.push(Object.keys(asked));
          return Record.map(asked, () => placedAt(lines, 2));
        }),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });

    const first = await audit({ rules: scoped, jev: judging, cache });
    // a breaks its rule, but only in code its excludeIf describes, so it is not even located.
    expect(first.findings.map((finding) => finding.rule)).toEqual(["b"]);
    expect(located).toEqual([["b"]]);

    // A rerun reads the matchers' scores from the cache, and asks Jev nothing.
    const cachedOnly = Layer.succeed(Jev, {
      judge: () => Effect.die("every check is cached"),
      locate: () => Effect.die("every finding is located"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const second = await audit({ rules: scoped, jev: cachedOnly, cache });
    expect(second.findings).toEqual(first.findings);
  });

  it("names the file a refusal stopped at, and that a rerun continues", async () => {
    const refusing = Layer.succeed(Jev, {
      judge: () => Effect.fail(JevUnavailable.make({ message: "Jev answered HTTP 429" })),
      locate: () => Effect.die("nothing judged, nothing to locate"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const refused = await Effect.runPromise(
      Effect.flip(
        runAudit.pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(AdhereConfig, {
                model: "jev-latest",
                threshold: 0.7,
                sufficiencyThreshold: 0.7,
                rules,
              }),
              Layer.succeed(SourceWalker, { files: Effect.succeed([source]) }),
              refusing,
              memoryCache(),
              testCrypto,
            ),
          ),
        ),
      ),
    );
    expect(refused.message).toBe(
      "/repo/src/server.ts: Jev answered HTTP 429. Files judged before it are cached, so a rerun continues from there.",
    );
  });

  const filePlan = (path: string): FilePlan => ({
    file: { path, lines: [] },
    skipped: false,
    hash: "",
    prepared: {},
    kept: {},
    pending: {},
    deferred: 0,
    sampled: {},
    suppressions: NO_SUPPRESSIONS,
    original: [],
  });
  const summary = (
    fields: Omit<AuditPlan, "files" | "tokens" | "unjudged" | "sufficiencyThreshold"> & {
      readonly tokens?: number;
    },
    files = 200,
  ): AuditPlan => ({
    files: Array.from({ length: files }, (_, index) => filePlan(`/repo/${index}.ts`)),
    unjudged: [],
    tokens: 0,
    sufficiencyThreshold: 0.7,
    ...fields,
  });

  it("judges at most --limit checks, in path order, and leaves the rest waiting", async () => {
    const cache = memoryCache();
    // other.ts sorts first, so it takes a and b, and server.ts gets the last one.
    const three = await planOf({ rules, files: [source, other], cache, limit: 3 });
    expect(three.files.map((plan) => [Object.keys(plan.pending), plan.deferred])).toEqual([
      [["a", "b"], 0],
      [["a"], 1],
    ]);
    expect({ deferred: three.deferred, requests: three.requests }).toEqual({
      deferred: 1,
      requests: 2,
    });

    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const two = await planOf({ rules, files: [source, other], cache, limit: 2 });
    const result = await Effect.runPromise(
      executeAudit(two).pipe(Effect.provide(Layer.merge(jev.layer, cache))),
    );
    expect(jev.calls.judge).toEqual([{ a, b }]);
    expect({ judged: result.judged, waiting: result.waiting }).toEqual({ judged: 1, waiting: 1 });

    // The next run judges what waited, and asks nothing already cached.
    const next = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    await Effect.runPromise(
      executeAudit(await planOf({ rules, files: [source, other], cache, limit: 2 })).pipe(
        Effect.provide(Layer.merge(next.layer, cache)),
      ),
    );
    expect(next.calls.judge).toEqual([{ a, b }]);
  });

  it("describes the plan: checks, the cache's share, and the requests the rest take", () => {
    const partly = summary({
      rules: 14,
      checks: 2800,
      cached: 1400,
      skipped: 3,
      deferred: 0,
      requests: 197,
    });
    expect(describePlan(partly)).toEqual([
      "200 files and 14 rules: 2800 checks, 1400 cached, 3 files too long to judge.",
      "Judging the other 1400 takes 197 requests to Jev, plus 1 or more for each file with a finding.",
    ]);
    expect(sendQuestion(partly)).toBe("Send 197 requests to Jev?");
    expect(
      describePlan(
        summary({ rules: 1, checks: 1, cached: 0, skipped: 0, deferred: 0, requests: 1 }, 1),
      ),
    ).toEqual([
      "1 file and 1 rule: 1 check.",
      "Judging them takes 1 request to Jev, plus 1 or more for each file with a finding.",
    ]);
    expect(
      describePlan(
        summary({ rules: 2, checks: 4, cached: 4, skipped: 0, deferred: 0, requests: 0 }, 2),
      )[1],
    ).toBe("The cache answers every check.");
    const limited = summary({
      rules: 14,
      checks: 2800,
      cached: 1400,
      skipped: 0,
      deferred: 900,
      requests: 42,
    });
    expect(describePlan(limited, { filter: ["src/**"], rpm: 30 })).toEqual([
      "200 files matching the filter and 14 rules: 2800 checks, 1400 cached.",
      "Judging 500 of the other 1400 takes 42 requests to Jev, plus 1 or more for each file with a finding. At 30 a minute, they take about 1 minute. The other 900 wait for a later run.",
    ]);
    expect(
      describePlan(
        summary({ rules: 2, checks: 4, cached: 0, skipped: 0, deferred: 4, requests: 0 }, 2),
      )[1],
    ).toBe("The limit leaves all 4 unjudged checks for a later run.");
    const one = summary(
      { rules: 1, checks: 4, cached: 0, skipped: 0, deferred: 1, requests: 3 },
      4,
    );
    expect(describePlan(one)[1]).toBe(
      "Judging 3 of them takes 3 requests to Jev, plus 1 or more for each file with a finding. The other 1 waits for a later run.",
    );
    expect(progressLine({ files: 37, requests: 41, findings: 1 }, partly)).toBe(
      "37/200 files, 41 requests sent, 1 finding",
    );
  });

  it("says what judging costs at the model's price, and only the tokens when the price is unknown", () => {
    const fields = {
      rules: 14,
      checks: 2800,
      cached: 1400,
      skipped: 0,
      deferred: 0,
      requests: 197,
    };
    const priced = summary({ ...fields, tokens: 3_217_450, price: 0.042 });
    expect(describePlan(priced)[2]).toBe(
      "Those carry about 3.2 million input tokens: about $0.14 at $0.042 per million, and more for locating findings.",
    );
    expect(sendQuestion(priced)).toBe("Send 197 requests to Jev, about $0.14?");
    const unpriced = summary({ ...fields, tokens: 41_234 });
    expect(describePlan(unpriced)[2]).toBe(
      "Those carry about 41,000 input tokens, and more for locating findings.",
    );
    expect(sendQuestion(unpriced)).toBe("Send 197 requests to Jev?");
    expect(describePlan(summary({ ...fields, tokens: 43_012_345, price: 0.042 }))[2]).toBe(
      "Those carry about 43 million input tokens: about $1.81 at $0.042 per million, and more for locating findings.",
    );
    expect(describePlan(summary({ ...fields, tokens: 612, price: 0.042 }))[2]).toBe(
      "Those carry about 612 input tokens: under $0.01 at $0.042 per million, and more for locating findings.",
    );
  });

  it("tells each finding the preset its rule came from, and nothing for the project's own", async () => {
    const scopedRules: RuleSet = [
      { id: "a", rule: a, scope: "/repo" },
      { id: "b", rule: b, scope: "/repo", preset: "effect" },
    ];
    const jev = recordingJev({ judge: { a: 0.9, b: 0.9 }, locate: { a: 2, b: 2 } });
    const result = await Effect.runPromise(
      runAudit.pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, {
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              rules,
              scopedRules,
            }),
            Layer.succeed(SourceWalker, { files: Effect.succeed([source]) }),
            jev.layer,
            memoryCache(),
            testCrypto,
          ),
        ),
      ),
    );
    expect(result.findings.map((finding) => [finding.rule, finding.preset])).toEqual([
      ["a", undefined],
      ["b", "effect"],
    ]);
  });

  it("counts the input tokens its judge requests carry, and the model's price", async () => {
    const planned = await planOf({ rules, files: [source, other], cache: memoryCache() });
    // Each file's pending rules, and the linter check's questions sampled beside them.
    const load = (sampled: boolean) =>
      planned.files.reduce((sum, plan) => {
        const pending = Record.map(plan.pending, ({ rule }) => rule);
        const ids = sampled ? Object.keys(plan.sampled) : [];
        return sum + judgeLoad(plan.file.lines, pending, ids).tokens;
      }, 0);
    expect({ tokens: planned.tokens, price: planned.price }).toEqual({
      tokens: load(true),
      price: 0.042,
    });
    expect(planned.tokens).toBeGreaterThan(load(false));
  });
});

describe("linter check", () => {
  const ports = {
    description: "A port must be a branded integer, never a bare number.",
    must: "const port = Port.make(8080);",
    never: "const port: number = 8080;",
  };
  const files: ReadonlyArray<ScannedFile> = Array.from({ length: 25 }, (_, index) => ({
    path: `/repo/src/f${String(index).padStart(2, "0")}.ts`,
    lines: [`export const x${index} = ${index};`],
  }));
  const keyOf = (rule: typeof ports) =>
    Effect.runPromise(tallyKeyOf("jev-latest", rule).pipe(Effect.provide(testCrypto)));
  const sampledPaths = (plan: AuditPlan) =>
    plan.files.filter((file) => !Record.isEmptyRecord(file.sampled)).map((file) => file.file.path);
  const tallyOf = (paths: ReadonlyArray<string>, probability: number): Tally => ({
    files: Object.fromEntries(paths.map((path) => [path, probability])),
  });

  it("rides beside a sampled rule's judge question, with the fields the judge question has", () => {
    const body = judgeBody("jev-latest", ["const x = 1;"], { ports, a }, ["ports"]);
    expect(Object.keys(body.questions)).toEqual(["ports", "a", linterKey("ports")]);
    expect(body.questions[linterKey("ports")]).toEqual(linterQuestion(ports));
    expect(linterQuestion(ports).instructions).toMatchObject({
      question:
        "Should `rule` have been checked by a regular linter? Consider `code`: could a linter or type checker have decided exactly whether it follows `rule`, without judgment?",
      rule: ports.description,
      must: ports.must,
      never: ports.never,
    });
  });

  it("asks on 10 of the files a rule is judged on, spread evenly over them in path order", async () => {
    const planned = await planOf({ rules: { ports }, files, cache: memoryCache() });
    const key = await keyOf(ports);

    expect(sampledPaths(planned)).toEqual(
      [0, 2, 5, 7, 10, 12, 15, 17, 20, 22].map((index) => files[index]?.path),
    );
    expect(planned.files.flatMap((file) => Object.values(file.sampled))).toEqual(
      Array.from({ length: SAMPLE }, () => key),
    );
  });

  it("asks only for the answers a rule's tally lacks, on files it has none from", async () => {
    const key = await keyOf(ports);
    const tallies = new Map([
      [
        key,
        tallyOf(
          files.slice(0, 7).map((file) => file.path),
          0.9,
        ),
      ],
    ]);

    const planned = await planOf({ rules: { ports }, files, cache: memoryCache({}, tallies) });

    expect(sampledPaths(planned)).toEqual([7, 13, 19].map((index) => files[index]?.path));
  });

  it("asks nothing for a rule whose tally is full, or for a preset's rule", async () => {
    const logs = {
      description: "Code must never call console.log.",
      must: "yield* Effect.log(message);",
      never: "console.log(message);",
    };
    const scopedRules: RuleSet = [
      { id: "ports", rule: ports, scope: "/repo" },
      { id: "logs", rule: logs, scope: "/repo", preset: "effect" },
    ];
    const plan = (cache: Layer.Layer<AuditCache>) =>
      Effect.runPromise(
        planAudit().pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(AdhereConfig, {
                model: "jev-latest",
                threshold: 0.7,
                sufficiencyThreshold: 0.7,
                rules: { ports, logs },
                scopedRules,
              }),
              Layer.succeed(SourceWalker, { files: Effect.succeed(files) }),
              cache,
              testCrypto,
            ),
          ),
        ),
      );

    const fresh = await plan(memoryCache());
    expect(new Set(fresh.files.flatMap((file) => Object.keys(file.sampled)))).toEqual(
      new Set(["ports"]),
    );
    const full = new Map([[await keyOf(ports), tallyOf(["/repo/elsewhere.ts"], 0.9)]]);
    for (let index = 1; index < SAMPLE; index++) {
      full.set(await keyOf(ports), {
        files: { ...full.get(await keyOf(ports))?.files, [`/repo/other${index}.ts`]: 0.9 },
      });
    }
    expect(sampledPaths(await plan(memoryCache({}, full)))).toEqual([]);
  });

  it("adds each sampled file's answer to the rule's tally", async () => {
    const key = await keyOf(ports);
    const tallies = new Map([[key, tallyOf(["/repo/elsewhere.ts"], 0.2)]]);
    const cache = memoryCache({}, tallies);
    const planned = await planOf({ rules: { ports }, files, cache });
    const asked: Array<ReadonlyArray<string>> = [];
    const jev = Layer.succeed(Jev, {
      judge: (_lines, rules, sampled = []) =>
        Effect.sync(() => {
          asked.push(sampled);
          return {
            probabilities: Record.map(rules, () => 0.1),
            linter: Object.fromEntries(sampled.map((id) => [id, 0.8])),
          };
        }),
      locate: () => Effect.die("no file breaks the rule"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });

    await Effect.runPromise(executeAudit(planned).pipe(Effect.provide(Layer.merge(jev, cache))));

    // The tally had one answer, so 9 of the 25 files carried the question.
    expect(asked.filter((ids) => ids.length > 0)).toEqual(
      Array.from({ length: 9 }, () => ["ports"]),
    );
    const answers = tallies.get(key)?.files ?? {};
    expect(Object.keys(answers)).toHaveLength(SAMPLE);
    expect(answers["/repo/elsewhere.ts"]).toBe(0.2);
    expect(Object.values(answers).filter((probability) => probability === 0.8)).toHaveLength(9);
  });

  it("counts a file as flagged when Jev says a linter more likely than not could check it", () => {
    const entry: RuleEntry = { id: "ports", rule: ports, scope: "/repo" };
    expect(talliedOf(entry, { files: { a: 0.9, b: 0.51, c: 0.5, d: 0.1 } })).toEqual({
      entry,
      asked: 4,
      flagged: 2,
    });
    expect(talliedOf(entry, undefined)).toEqual({ entry, asked: 0, flagged: 0 });
  });

  it("tallies only the project's rules: a preset's are not the user's to change", async () => {
    const cache = memoryCache({}, new Map([[await keyOf(ports), tallyOf(["/repo/a.ts"], 0.9)]]));
    const project: RuleEntry = { id: "ports", rule: ports, scope: "/repo" };

    const tallied = await Effect.runPromise(
      tallyProjectRules(
        [project, { id: "logs", rule: ports, scope: "/repo", preset: "effect" }],
        "jev-latest",
      ).pipe(Effect.provide(Layer.merge(cache, testCrypto))),
    );

    expect(tallied).toEqual([{ entry: project, asked: 1, flagged: 1 }]);
  });

  it("reports a rule most files flagged, one with mixed answers, and the rules with too few", () => {
    const tallied = (id: string, asked: number, flagged: number, file?: string): Tallied => ({
      entry: { id, rule: ports, scope: "/repo", ...(file === undefined ? {} : { file }) },
      asked,
      flagged,
    });

    expect(
      formatLinterCheck(
        [
          tallied("data/ports", 10, 9, "/repo/.adhere/rules/data/ports/RULE.md"),
          tallied("style/naming", 10, 5),
          tallied("style/small", 10, 2),
          tallied("style/new", 4, 4),
        ],
        "/repo",
      ),
    ).toEqual([
      "2 rules flagged by the linter check:",
      "  data/ports (.adhere/rules/data/ports/RULE.md)",
      "    Flagged on 9 of 10 files: a regular linter should probably check this rule.",
      "  style/naming",
      "    Flagged on 5 of 10 files: say more precisely what the rule applies to.",
      "1 rule has fewer than 10 answers from lint yet, which asks as it judges files.",
    ]);
    expect(formatLinterCheck([tallied("style/small", 10, 2)], "/repo")).toEqual([
      "The linter check flags no rule.",
    ]);
    expect(formatLinterCheck([], "/repo")).toEqual([]);
  });
});

describe("pipeline", () => {
  it("judges every rule in one call, locates only the flagged rule, reports the located line", async () => {
    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await audit({ rules, jev: jev.layer, cache: memoryCache() });
    expect(jev.calls.judge).toEqual([{ a, b }]);
    expect(jev.calls.locate).toEqual([{ a }]);
    expect(result).toEqual({
      files: 1,
      judged: 1,
      cached: 0,
      skipped: 0,
      waiting: 0,
      blocked: [],
      findings: [findingA],
      suppressed: 0,
    });
  });

  it("answers a second run from the cache and re-judges only an edited rule", async () => {
    const cache = memoryCache();
    const first = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    await audit({ rules, jev: first.layer, cache });

    const second = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const cached = await audit({ rules, jev: second.layer, cache });
    expect(second.calls).toEqual({ judge: [], locate: [] });
    expect(cached).toEqual({
      files: 1,
      judged: 0,
      cached: 1,
      skipped: 0,
      waiting: 0,
      blocked: [],
      findings: [findingA],
      suppressed: 0,
    });

    const editedB = { ...b, must: 'const token = yield* Config.redacted("TOKEN")' };
    const third = recordingJev({ judge: { a: 0.9, b: 0.3 }, locate: { a: 2 } });
    const edited = await audit({ rules: { a, b: editedB }, jev: third.layer, cache });
    expect(third.calls).toEqual({ judge: [{ b: editedB }], locate: [] });
    expect(edited.findings).toEqual([findingA]);
    expect(edited.judged).toBe(1);
  });

  it("re-judges a rule whose appendState is edited, by its source, and nothing else", async () => {
    const cache = memoryCache();
    const hooked = (version: number) => ({
      ...b,
      appendState: version === 1 ? () => ({ version: 1 }) : () => ({ version: 2 }),
    });
    await audit({
      rules: { a, b: hooked(1) },
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
      cache,
    });

    const edited = hooked(2);
    const second = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    await audit({ rules: { a, b: edited }, jev: second.layer, cache });
    expect(second.calls).toEqual({ judge: [{ b: edited }], locate: [] });

    // A run imports the rule again: a new function, with the same source.
    const third = recordingJev({ judge: {}, locate: {} });
    await audit({ rules: { a, b: hooked(2) }, jev: third.layer, cache });
    expect(third.calls).toEqual({ judge: [], locate: [] });
  });

  it("answers a file from the cache wherever its content moves", async () => {
    const cache = memoryCache();
    await audit({
      rules,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
      cache,
    });

    const moved = { ...source, path: "/repo/src/moved.ts" };
    const again = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await audit({ rules, jev: again.layer, cache, files: [moved] });
    expect(again.calls).toEqual({ judge: [], locate: [] });
    expect(result.findings).toEqual([{ ...findingA, file: moved.path }]);
  });

  it("prunes by what a run that read every file tells: its contents, and its rules' tallies", async () => {
    const pruned: Array<Live> = [];
    const plan = await Effect.runPromise(
      planAudit().pipe(
        Effect.tap(pruneCache),
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, {
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              rules,
            }),
            Layer.succeed(SourceWalker, { files: Effect.succeed([source]) }),
            memoryCache({}, new Map(), pruned),
            testCrypto,
          ),
        ),
      ),
    );
    const tallies = await Effect.runPromise(
      Effect.forEach([a, b], (rule) => tallyKeyOf("jev-latest", rule)).pipe(
        Effect.provide(testCrypto),
      ),
    );
    expect(pruned).toEqual([
      { hashes: new Set(plan.files.map((file) => file.hash)), tallies: new Set(tallies) },
    ]);
  });

  it("prunes nothing another run knows of a file this run's rules do not judge, such as a test", async () => {
    const pruned: Array<Live> = [];
    const helper: ScannedFile = {
      path: "/repo/test/helper.ts",
      lines: ["const y = 2;"],
      test: true,
    };
    const plan = await Effect.runPromise(
      planAudit().pipe(
        Effect.tap(pruneCache),
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, {
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              rules,
            }),
            Layer.succeed(SourceWalker, { files: Effect.succeed([source, helper]) }),
            memoryCache({}, new Map(), pruned),
            testCrypto,
          ),
        ),
      ),
    );
    expect(plan.files.map((file) => file.file.path)).toEqual([source.path]);
    expect(plan.unjudged).toHaveLength(1);
    expect(pruned[0]?.hashes).toEqual(
      new Set([...plan.files.map((file) => file.hash), ...plan.unjudged]),
    );
  });

  it("re-judges what an earlier question judged, and a rule that gains code never to write", async () => {
    const hexByte = (byte: number) => byte.toString(16).padStart(2, "0");
    const hex = (text: string) => Array.from(new TextEncoder().encode(text), hexByte).join("");
    // An answer under the fingerprint adhere 0.4 used: model, description, and reference.
    const cache = memoryCache({
      [hex(source.lines.join("\n"))]: {
        [hex(`jev-latest${a.description}${a.must}`)]: {
          probability: 0.9,
          section: { first: 1, last: 3 },
        },
      },
    });

    const upgraded = recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } });
    const rejudged = await audit({ rules: { a }, jev: upgraded.layer, cache });
    expect(upgraded.calls).toEqual({ judge: [{ a }], locate: [{ a }] });
    expect(rejudged.findings).toEqual([findingA]);

    const again = recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } });
    await audit({ rules: { a }, jev: again.layer, cache });
    expect(again.calls).toEqual({ judge: [], locate: [] });

    const withNever = { ...a, never: "const port: number = 3000" };
    const edited = recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } });
    const result = await audit({ rules: { a: withNever }, jev: edited.layer, cache });
    expect(edited.calls.judge).toEqual([{ a: withNever }]);
    expect(result.findings).toEqual([
      {
        ...findingA,
        examples: { ...findingA.examples, bad: { word: "never", code: withNever.never } },
      },
    ]);
  });

  it("reads a cache entry from before sections, dropping its line and the line's text", () => {
    const judgment = { fingerprint: "f", probability: 0.9 };
    const written = JSON.stringify({
      hash: "h",
      judgments: { a: { ...judgment, line: 2, snippet: "const port: number = 3000;" } },
    });
    expect(Schema.decodeUnknownSync(Schema.fromJsonString(CacheEntry))(written)).toEqual({
      hash: "h",
      judgments: { a: judgment },
    });
  });

  it("skips a file too long for Jev's context, and judges the rest", async () => {
    const generated: ScannedFile = {
      path: "/repo/src/generated.ts",
      lines: Array.from(
        { length: 4000 },
        (_, index) => `export const v${index} = compute(${index});`,
      ),
    };
    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await audit({
      rules,
      jev: jev.layer,
      cache: memoryCache(),
      files: [source, generated],
    });
    expect(jev.calls.judge).toEqual([{ a, b }]);
    expect(result).toEqual({
      files: 2,
      judged: 1,
      cached: 0,
      skipped: 1,
      waiting: 0,
      blocked: [],
      findings: [findingA],
      suppressed: 0,
    });
  });

  it("skips a file the firewall blocks, judges the rest, and lists it with its Ray ID", async () => {
    const other: ScannedFile = { path: "/repo/src/other.ts", lines: ["const x = 1;"] };
    const jev = Layer.succeed(Jev, {
      judge: (lines) =>
        lines.length === other.lines.length
          ? Effect.fail(JevBlocked.make({ ray: "a3fb098cae4f55a3-LAX" }))
          : Effect.succeed({ probabilities: { a: 0.9, b: 0.2 }, linter: {} }),
      locate: () =>
        Effect.succeed({
          a: { section: { first: 1, last: 3 }, sufficiency: 0.9, lines: { first: 2, last: 2 } },
        }),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const result = await audit({ rules, jev, cache: memoryCache(), files: [source, other] });
    expect(result).toMatchObject({
      files: 2,
      judged: 1,
      blocked: [{ file: other.path, ray: "a3fb098cae4f55a3-LAX" }],
      findings: [findingA],
    });
    const report = render(result, { root: "/repo" });
    expect(report).toContain("2 files, 1 judged, 0 cached, 1 blocked.");
    expect(report).toContain("  src/other.ts (Ray ID a3fb098cae4f55a3-LAX)");
  });

  it("keeps the judgments when only the line question is blocked, and asks it again", async () => {
    const cache = memoryCache();
    const blockedLines = Layer.succeed(Jev, {
      judge: () => Effect.succeed({ probabilities: { a: 0.9, b: 0.2 }, linter: {} }),
      locate: () => Effect.fail(JevBlocked.make({ ray: "b7c1-LAX" })),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const first = await audit({ rules, jev: blockedLines, cache });
    expect(first).toMatchObject({
      judged: 0,
      blocked: [{ file: source.path, ray: "b7c1-LAX" }],
      findings: [],
    });

    const again = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const second = await audit({ rules, jev: again.layer, cache });
    expect(again.calls).toEqual({ judge: [], locate: [{ a }] });
    expect(second.findings).toEqual([findingA]);
  });

  it("skips a file Jev says is over its context, and judges the rest", async () => {
    const dense: ScannedFile = {
      path: "/repo/src/strings.ts",
      lines: ["// 字", "// 字", "// 字", "// 字"],
    };
    const jev = Layer.succeed(Jev, {
      judge: (lines) =>
        lines.length === dense.lines.length
          ? Effect.fail(JevOverflow.make())
          : Effect.succeed({ probabilities: { a: 0.9, b: 0.2 }, linter: {} }),
      locate: () =>
        Effect.succeed({
          a: { section: { first: 1, last: 3 }, sufficiency: 0.9, lines: { first: 2, last: 2 } },
        }),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const result = await audit({ rules, jev, cache: memoryCache(), files: [source, dense] });
    expect(result).toEqual({
      files: 2,
      judged: 1,
      cached: 0,
      skipped: 1,
      waiting: 0,
      blocked: [],
      findings: [findingA],
      suppressed: 0,
    });
  });

  it("locates a cached judgment when a lower threshold flags it", async () => {
    const cache = memoryCache();
    const strict = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const quiet = await audit({ rules, threshold: 0.95, jev: strict.layer, cache });
    expect(strict.calls.locate).toEqual([]);
    expect(quiet.findings).toEqual([]);

    const lenient = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await audit({ rules, threshold: 0.7, jev: lenient.layer, cache });
    expect(lenient.calls).toEqual({ judge: [], locate: [{ a }] });
    expect(result.findings).toEqual([findingA]);
  });

  it("leaves out a finding an adhere-ignore comment covers, counts it, and never sends Jev the comment", async () => {
    const lines = [
      "const before = 1;",
      "// adhere-ignore a -- checked by hand",
      "  const port: number = Number(process.env.PORT);",
      "const after = 2;",
    ];
    const { sent, layer } = sendingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 3 } });
    const result = await audit({
      rules,
      jev: layer,
      cache: memoryCache(),
      files: [{ path: "/repo/src/server.ts", lines }],
    });
    expect(result.findings).toEqual([]);
    expect(result.suppressed).toBe(1);
    expect(sent.length).toBeGreaterThan(0);
    expect(sent.some((code) => code.includes("adhere-ignore"))).toBe(false);
  });

  it("sends Jev the file without its comments but its @adhere notes, and shows the report the file as written", async () => {
    const lines = [
      "const before = 1; // the port comes next",
      "  const port: number = Number(process.env.PORT); // @adhere read once, at startup",
      "const after = 2;",
    ];
    const { sent, layer } = sendingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await audit({
      rules,
      jev: layer,
      cache: memoryCache(),
      files: [{ path: "/repo/src/server.ts", lines }],
    });
    expect(sent.length).toBeGreaterThan(0);
    expect(sent.some((code) => code.includes("the port comes next"))).toBe(false);
    expect(sent.every((code) => code.includes("@adhere read once, at startup"))).toBe(true);
    expect(result.findings.map((finding) => finding.excerpt.lines)).toEqual([lines]);
  });

  it("re-judges nothing when only a file's comments change, and sends them all when the config includes comments", async () => {
    const cache = memoryCache();
    const written = (comment: string): ScannedFile => ({
      path: "/repo/src/server.ts",
      lines: [`const before = 1; // ${comment}`, ...source.lines.slice(1)],
    });
    await audit({
      rules,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
      cache,
      files: [written("first")],
    });
    const again = recordingJev({ judge: {}, locate: {} });
    const result = await audit({ rules, jev: again.layer, cache, files: [written("second")] });
    expect(again.calls).toEqual({ judge: [], locate: [] });
    expect(result.findings).toHaveLength(1);

    const { sent, layer } = sendingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    await audit({
      rules,
      jev: layer,
      cache: memoryCache(),
      files: [written("kept")],
      includeComments: true,
    });
    expect(sent.every((code) => code.includes("// kept"))).toBe(true);
  });

  it("judges no rule that an adhere-ignore-file comment names in that file", async () => {
    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 3 } });
    const result = await audit({
      rules,
      jev: jev.layer,
      cache: memoryCache(),
      files: [
        {
          path: "/repo/src/server.ts",
          lines: ["// adhere-ignore-file a -- generated", ...source.lines],
        },
      ],
    });
    expect(jev.calls.judge).toEqual([{ b }]);
    expect(result.findings).toEqual([]);
  });

  it("reports a warning rule's findings as warnings, from the same cached judgment", async () => {
    const cache = memoryCache();
    await audit({
      rules,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
      cache,
    });
    // The level is not part of the question, so the judgment stays cached.
    const again = recordingJev({ judge: {}, locate: {} });
    const result = await audit({
      rules: { a: { ...a, level: "warning" }, b },
      jev: again.layer,
      cache,
    });
    expect(again.calls).toEqual({ judge: [], locate: [] });
    expect(result.findings).toEqual([{ ...findingA, level: "warning" }]);
  });
});

describe("highlight", () => {
  /** Each line of the code, with every classified token marked `[kind text]`. */
  const marked = (code: string) =>
    tokenize(code).map((line) =>
      line.map(({ text, kind }) => (kind === undefined ? text : `[${kind} ${text}]`)).join(""),
    );

  it("marks keywords, type names, constants, strings, and comments", () => {
    expect(marked('const port: number = Number(process.env.PORT ?? "80"); // why')).toEqual([
      '[keyword const] port: [type number] = [type Number](process.env.PORT ?? [string "80"]); [comment // why]',
    ]);
  });

  it("reads a word after a dot or before a colon as a property, not a keyword", () => {
    expect(marked('cache.get(key); ({ type: "noul" as const })')).toEqual([
      'cache.get(key); ({ type: [string "noul"] [keyword as] [keyword const] })',
    ]);
  });

  it("reads a slash as a regex where an expression can start, and as division after a value", () => {
    expect(marked("const fence = /[/]`{3,}/g; const half = total / 2 / scale;")).toEqual([
      "[keyword const] fence = [string /[/]`{3,}/g]; [keyword const] half = total / [constant 2] / scale;",
    ]);
  });

  it("cuts a comment or template that crosses lines into one token per line", () => {
    expect(marked("/* one\n\n   two */ const s = `a\n${b}`;")).toEqual([
      "[comment /* one]",
      "",
      "[comment    two */] [keyword const] s = [string `a]",
      "[string ${b}`];",
    ]);
  });

  it("reads a template in another's ${…} as part of it, braces and all", () => {
    expect(marked("const list = `${xs.map((x) => `- ${x}`).join(`}`)}`; const n = 1;")).toEqual([
      "[keyword const] list = [string `${xs.map((x) => `- ${x}`).join(`}`)}`]; [keyword const] n = [constant 1];",
    ]);
  });

  it("gives back every character of the input, however malformed", () => {
    for (const code of [
      '"unterminated',
      "/* open",
      "`open\n\n",
      "`${open",
      "`${a}\\",
      "a\r\nb",
      "é → 🎉",
      "y / z /",
    ]) {
      const text = tokenize(code).map((line) => line.map((token) => token.text).join(""));
      expect(text.join("\n")).toBe(code);
    }
  });
});

describe("sections", () => {
  /** A statement of `n` lines: `const name = [` then its values, then `];`. */
  const statement = (name: string, n: number): ReadonlyArray<string> => [
    `const ${name} = [`,
    ...Array.from({ length: n - 2 }, (_, index) => `  ${index},`),
    "];",
  ];

  it("packs whole statements into sections of at most 30 lines, covering every line", () => {
    const code = [
      'import { a } from "a";',
      "",
      "// the first",
      ...statement("first", 20),
      "",
      ...statement("second", 20),
      ...statement("third", 5),
    ];
    expect(sectionsOf(code)).toEqual([
      { first: 1, last: 23 },
      { first: 24, last: 49 },
    ]);
  });

  it("splits a long statement into the statements of its largest group", () => {
    const code = [
      "export class Big {",
      ...Array.from({ length: 4 }, (_, index) => [
        `  method${index}() {`,
        ...Array.from({ length: 12 }, (_, line) => `    this.call(${line});`),
        "  }",
      ]).flat(),
      "}",
    ];
    const sections = sectionsOf(code);
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0]?.first).toBe(1);
    expect(sections.at(-1)?.last).toBe(code.length);
    for (const section of sections) expect(section.last - section.first).toBeLessThan(30);
  });

  it("keeps a decorator with the declaration it decorates", () => {
    const code = [
      ...statement("before", 28),
      "@Command({",
      "  name: 'reset',",
      "})",
      "export class Reset {}",
    ];
    expect(sectionsOf(code)).toEqual([
      { first: 1, last: 28 },
      { first: 29, last: 32 },
    ]);
  });
});

describe("render", () => {
  const result = {
    files: 1,
    judged: 1,
    cached: 0,
    skipped: 0,
    waiting: 0,
    blocked: [],
    findings: [findingA],
    suppressed: 0,
  };

  it("prints the vp-lint frame with the code to write as the hint, then the legend for its scores", () => {
    expect(render(result, { root: "/repo" }).join("\n")).toBe(
      [
        "  × a  confidence 0.90 · context 0.90",
        "    Ports are branded.",
        "   ╭─[src/server.ts:2:3]",
        " 1 │ const before = 1;",
        " 2 │   const port: number = Number(process.env.PORT);",
        "   ·   ──────────────────────────────────────────────",
        " 3 │ const after = 2;",
        "   ╰────",
        '  hint: const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "        type Port = typeof Port.Type",
        "",
        "confidence: Jev's probability that the file breaks the rule. Low, in amber, below 0.90.",
        "context: its probability that the file shows enough to decide. Low, in amber, below 0.60.",
        "",
        "Found 1 error.",
        "1 file, 1 judged, 0 cached.",
      ].join("\n"),
    );
  });

  it("numbers the section's lines right-aligned, and underlines the lines Jev names past a tab", () => {
    const excerpt = { start: 9, lines: ["\tif (port) {", "\t\tlisten(port);", "\t}"] };
    const finding = {
      ...findingA,
      section: { first: 9, last: 11 },
      lines: { first: 10, last: 10 },
      excerpt,
    };
    expect(render({ ...result, findings: [finding] }, { root: "/repo" }).slice(2, 8)).toEqual([
      "    ╭─[src/server.ts:10:3]",
      "  9 │ \tif (port) {",
      " 10 │ \t\tlisten(port);",
      "    · \t\t─────────────",
      " 11 │ \t}",
      "    ╰────",
    ]);
  });

  it("marks the lines of a span of several with a bar beside the code, not an underline each", () => {
    const finding = { ...findingA, lines: { first: 2, last: 3 } };
    expect(render({ ...result, findings: [finding] }, { root: "/repo" }).slice(2, 7)).toEqual([
      "   ╭─[src/server.ts:2:3]",
      " 1 │   const before = 1;",
      " 2 │ ┃   const port: number = Number(process.env.PORT);",
      " 3 │ ┃ const after = 2;",
      "   ╰────",
    ]);
  });

  it("places a finding without lines at its section's first line, with no underline", () => {
    const { lines: _, ...unlined } = findingA;
    expect(render({ ...result, findings: [unlined] }, { root: "/repo" }).slice(2, 7)).toEqual([
      "   ╭─[src/server.ts:1:1]",
      " 1 │ const before = 1;",
      " 2 │   const port: number = Number(process.env.PORT);",
      " 3 │ const after = 2;",
      "   ╰────",
    ]);
  });

  it("shows a finding's context after its confidence, and warns under the section when it is below the threshold", () => {
    const finding = { ...findingA, context: 0.45 };
    const lines = render({ ...result, findings: [finding] }, { root: "/repo" });
    expect(lines[0]).toBe("  × a  confidence 0.90 · context 0.45");
    expect(lines.slice(8, 12)).toEqual([
      "  warning: this file may not show enough to check this rule",
      "     help: add what the code relies on outside this file as a note Jev reads:",
      "           // @adhere <the fact>, and how you know it",
      '  hint: const Port = Schema.Int.pipe(Schema.brand("Port"))',
    ]);
    // Above the threshold, which the caller can set, there is no warning.
    const enough = render({ ...result, findings: [finding] }, { sufficiencyThreshold: 0.4 });
    expect(enough.some((line) => line.includes("warning:"))).toBe(false);
    expect(enough).toContain(
      "context: its probability that the file shows enough to decide. Low, in amber, below 0.40.",
    );
  });

  it("shows the code never to write, labeled with its word, for a rule without code to write", () => {
    const code = 'throw new Error("x")\nthrow new Error("y")';
    const finding = { ...findingA, examples: { bad: { word: "never" as const, code } } };
    const lines = render({ ...result, findings: [finding] }, { root: "/repo" });
    expect(lines).toContain('  never: throw new Error("x")');
    expect(lines).toContain('         throw new Error("y")');
    expect(lines.some((line) => line.includes("hint:"))).toBe(false);
  });

  const sgr = (code: string, text: string) => `\u001b[${code}m${text}\u001b[0m`;

  it("names a preset rule's preset first in its header, and a project rule plainly", () => {
    const fromPreset = { ...findingA, rule: "basics/ports", preset: "effect" };
    const lines = render({ ...result, findings: [fromPreset, findingA] }, { root: "/repo" });
    expect(lines.filter((line) => line.startsWith("  × "))).toEqual([
      "  × effect/basics/ports  confidence 0.90 · context 0.90",
      "  × a  confidence 0.90 · context 0.90",
    ]);
  });

  it("marks a warning's header and counts warnings apart from errors", () => {
    const warning = { ...findingA, rule: "b", level: "warning" as const };
    const lines = render({ ...result, findings: [findingA, warning] }, { root: "/repo" });
    expect(lines.filter((line) => /^  [×⚠] /.test(line))).toEqual([
      "  × a  confidence 0.90 · context 0.90",
      "  ⚠ b  confidence 0.90 · context 0.90",
    ]);
    expect(lines).toContain("Found 1 error and 1 warning.");
    expect(render({ ...result, findings: [warning] }, { root: "/repo" })).toContain(
      "Found 0 errors and 1 warning.",
    );
    const amber = "38;2;214;154;0;1";
    expect(render({ ...result, findings: [warning] }, { color: true }).join("\n")).toContain(
      `  ${sgr(amber, "⚠")} ${sgr(amber, "b")}  confidence `,
    );
  });

  it("fails a run on its errors, and on its warnings only when asked to", () => {
    const warning = { ...findingA, level: "warning" as const };
    expect(failing([findingA, warning])).toEqual([findingA]);
    expect(failing([warning])).toEqual([]);
    expect(failing([findingA, warning], true)).toEqual([findingA, warning]);
  });

  it("colors only the rule red in the header on a terminal and counts skipped files", () => {
    const red = "38;2;164;20;71;1";
    const colored = render({ ...result, skipped: 2 }, { color: true }).join("\n");
    expect(colored).toContain(
      `  ${sgr(red, "×")} ${sgr(red, "a")}  confidence ${sgr("38;5;156", "0.90")} · context ${sgr("38;5;156", "0.90")}\n    ${sgr("38;2;230;230;255", "Ports are branded.")}`,
    );
    expect(colored).toContain("\u001b[38;2;5;125;160;1m/repo/src/server.ts");
    expect(colored.endsWith("1 file, 1 judged, 0 cached, 2 skipped.")).toBe(true);
  });

  it("colors a score amber when it is low: confidence below 0.90, context below the threshold", () => {
    const amber = "38;2;214;154;0";
    const green = "38;5;156";
    const scores = (finding: typeof findingA & { readonly context: number }) =>
      render({ ...result, findings: [finding] }, { color: true })[0]?.split("  confidence ")[1];
    expect(scores({ ...findingA, probability: 0.93, context: 0.88 })).toBe(
      `${sgr(green, "0.93")} · context ${sgr(green, "0.88")}`,
    );
    expect(scores({ ...findingA, probability: 0.83, context: 0.45 })).toBe(
      `${sgr(amber, "0.83")} · context ${sgr(amber, "0.45")}`,
    );
  });

  it("sets the legend's words in bold, not in the hint label's color", () => {
    const colored = render(result, { color: true });
    expect(colored).toContain(
      `${sgr("1", "confidence")}: Jev's probability that the file breaks the rule. Low, in amber, below 0.90.`,
    );
    expect(colored.some((line) => line.startsWith(sgr("1", "context")))).toBe(true);
  });

  it("leaves the legend out of a report with no findings", () => {
    expect(render({ ...result, findings: [] })).toEqual([
      "Found 0 errors.",
      "1 file, 1 judged, 0 cached.",
    ]);
  });

  it("highlights the section and the hint on a terminal", () => {
    const colored = render(result, { color: true });
    expect(colored).toContain(
      ` ${sgr("2", "2")} │   ${sgr("34", "const")} port: ${sgr("36", "number")} = ${sgr("36", "Number")}(process.env.PORT);`,
    );
    expect(colored).toContain(
      `${sgr("38;2;242;205;205", "  hint: ")}${sgr("34", "const")} ${sgr("36", "Port")} = ${sgr("36", "Schema")}.${sgr("36", "Int")}.pipe(${sgr("36", "Schema")}.brand(${sgr("32", '"Port"')}))`,
    );
  });

  it("adds color and nothing else, and closes every color on the line that opens it", () => {
    const code = "/* Decoded once,\n\n   at the edge. */\nconst message = `${file}:\n  ${line}`;";
    const findings = [{ ...findingA, examples: { good: { word: "must" as const, code } } }];
    const colored = render({ ...result, findings }, { color: true });
    expect(colored.map((line) => stripVTControlCharacters(line))).toEqual(
      render({ ...result, findings }),
    );
    for (const line of colored) {
      expect(line.split("\u001b[").length - 1).toBe(2 * (line.split("\u001b[0m").length - 1));
    }
  });
});

describe("credentials", () => {
  const FILE = "/config/adhere/credentials.json";
  const SAVED = { [FILE]: '{"apiKey":"tsk_saved"}\n' };

  /** Files in a map, each with the mode it was created with, and each made directory's mode. */
  const memoryFiles = (seed: Readonly<Record<string, string>> = {}) => {
    const files = new Map<string, { readonly text: string; readonly mode?: number | undefined }>(
      Object.entries(seed).map(([path, text]) => [path, { text }]),
    );
    const directories = new Map<string, number | undefined>();
    const layer = FileSystem.layerNoop({
      exists: (path) => Effect.succeed(files.has(path)),
      readFileString: (path) => Effect.succeed(files.get(path)?.text ?? ""),
      writeFileString: (path, text, options) =>
        Effect.sync(() => {
          files.set(path, { text, mode: options?.mode });
        }),
      rename: (from, to) =>
        Effect.sync(() => {
          const file = files.get(from);
          files.delete(from);
          if (file !== undefined) files.set(to, file);
        }),
      remove: (path) =>
        Effect.sync(() => {
          files.delete(path);
        }),
      makeDirectory: (path, options) =>
        Effect.sync(() => {
          directories.set(path, options?.mode);
        }),
    });
    return { files, directories, layer };
  };

  /** The live service over `fs`, with `env` as the whole environment. */
  const run = <A, E>(
    env: Readonly<Record<string, string>>,
    fs: Layer.Layer<FileSystem.FileSystem>,
    program: Effect.Effect<A, E, Credentials>,
  ) =>
    Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.merge(
            CredentialsLive.pipe(Layer.provide(Layer.merge(fs, Path.layer))),
            ConfigProvider.layer(ConfigProvider.fromEnv({ env })),
          ),
        ),
      ),
    );

  const apiKey = Effect.gen(function* () {
    return Redacted.value(yield* (yield* Credentials).apiKey);
  });

  it("saves a key under XDG_CONFIG_HOME, readable only by the user, and reads it back", async () => {
    const memory = memoryFiles();
    const saved = Effect.gen(function* () {
      yield* (yield* Credentials).save(Redacted.make("tsk_saved"));
      return yield* apiKey;
    });
    expect(await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, saved)).toBe("tsk_saved");
    expect(Object.fromEntries(memory.files)).toEqual({
      [FILE]: { text: '{"apiKey":"tsk_saved"}\n', mode: 0o600 },
    });
    expect(memory.directories.get("/config/adhere")).toBe(0o700);
  });

  it("keeps the key under ~/.config without XDG_CONFIG_HOME", async () => {
    const file = Effect.gen(function* () {
      return yield* (yield* Credentials).file;
    });
    expect(await run({ HOME: "/home/me" }, memoryFiles().layer, file)).toBe(
      "/home/me/.config/adhere/credentials.json",
    );
  });

  it("prefers TYPESAFE_API_KEY to the saved key, and uses the saved key without it", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const fromEnvironment = { ...env, TYPESAFE_API_KEY: "tsk_env" };
    expect(await run(fromEnvironment, memoryFiles(SAVED).layer, apiKey)).toBe("tsk_env");
    expect(await run(env, memoryFiles(SAVED).layer, apiKey)).toBe("tsk_saved");
  });

  it("refuses without a key, naming adhere login, and refuses a file that holds none", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const missing = await run(env, memoryFiles().layer, Effect.flip(apiKey));
    expect(missing.message).toBe(
      "No TypeSafe AI API key. Run `adhere login` to save one, or set TYPESAFE_API_KEY.",
    );
    const broken = await run(env, memoryFiles({ [FILE]: "{}" }).layer, Effect.flip(apiKey));
    expect(broken.message).toBe(
      `${FILE} holds no API key. Run \`adhere login\` to save one again.`,
    );
  });

  it("refuses to save a key with a space, and writes nothing", async () => {
    const memory = memoryFiles();
    const save = Effect.gen(function* () {
      yield* (yield* Credentials).save(Redacted.make("tsk one"));
    });
    const refused = await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, Effect.flip(save));
    expect(refused.message).toBe("An API key is one word, with no spaces or line breaks.");
    expect(memory.files.size).toBe(0);
  });

  it("deletes the saved key, and says when there was none", async () => {
    const memory = memoryFiles(SAVED);
    const removed = Effect.gen(function* () {
      const credentials = yield* Credentials;
      return [yield* credentials.remove, yield* credentials.remove];
    });
    expect(await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, removed)).toEqual([true, false]);
    expect(memory.files.size).toBe(0);
  });
});

describe("jev over http", () => {
  /** The file a rule's appendState gets, beside the lines Jev reads. */
  const judgedFile = { path: "/repo/src/server.ts", contents: "const port = 3000;" };

  it("sends at most --rpm requests a minute, evenly spaced", async () => {
    const sent: Array<number> = [];
    const client = HttpClient.make((request) => {
      sent.push(Date.now());
      return Effect.succeed(
        HttpClientResponse.fromWeb(request, Response.json({ answers: { a: { noul: 0.25 } } })),
      );
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(HttpClient.HttpClient, client),
        // 1200 a minute is one every 50 milliseconds.
        Layer.succeed(AdhereConfig, {
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          rules: {},
          rpm: 1200,
        }),
        Layer.succeed(Credentials, {
          apiKey: Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: Effect.succeed(false),
        }),
      ]),
    );
    const four = Effect.gen(function* () {
      const jev = yield* Jev;
      for (let request = 0; request < 4; request++) {
        yield* jev.judge(["const port = 3000;"], { a }, [], judgedFile);
      }
    });
    await Effect.runPromise(Effect.provide(four, layer));
    const first = sent[0] ?? 0;
    expect(sent).toHaveLength(4);
    expect((sent.at(-1) ?? first) - first).toBeGreaterThanOrEqual(140);
  });

  /**
   * Judges one file through the live client, which answers 0.25 to every
   * question it is sent, or sends `reply` instead, recording each request's
   * authorization header and question ids.
   */
  const judge = (
    key: Effect.Effect<Redacted.Redacted<string>, CredentialsUnavailable>,
    judgedRules: Rules = { a },
    reply?: () => Response,
  ) => {
    const authorizations: Array<string | undefined> = [];
    const asked: Array<ReadonlyArray<string>> = [];
    const client = HttpClient.make((request) => {
      authorizations.push(request.headers.authorization);
      const body: { readonly questions: Record<string, unknown> } =
        request.body._tag === "Uint8Array"
          ? JSON.parse(new TextDecoder().decode(request.body.body))
          : { questions: {} };
      const ids = Object.keys(body.questions);
      asked.push(ids);
      const answers = Object.fromEntries(ids.map((id) => [id, { noul: 0.25 }]));
      return Effect.succeed(
        HttpClientResponse.fromWeb(request, reply?.() ?? Response.json({ answers })),
      );
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(AdhereConfig, {
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          rules: {},
        }),
        Layer.succeed(Credentials, {
          apiKey: key,
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: Effect.succeed(false),
        }),
      ]),
    );
    const judged = Effect.gen(function* () {
      return yield* (yield* Jev).judge(["const port = 3000;"], judgedRules, [], judgedFile);
    });
    const result = Effect.runPromise(Effect.result(Effect.provide(judged, layer)));
    return { authorizations, asked, judged: result };
  };

  it("locates each rule in the section Jev chooses, with its sufficiency, and chooses nothing in a file of one section", async () => {
    const sent: Array<ReadonlyArray<string>> = [];
    const client = HttpClient.make((request) => {
      const body: { readonly questions: Record<string, unknown> } =
        request.body._tag === "Uint8Array"
          ? JSON.parse(new TextDecoder().decode(request.body.body))
          : { questions: {} };
      const ids = Object.keys(body.questions);
      sent.push(ids);
      // b's choice names no section, which leaves it unlocated.
      const answers = Object.fromEntries(
        ids.map((id) => [
          id,
          id.startsWith("sufficient:")
            ? { noul: 0.4 }
            : // a starts on 35 and ends on 33 of section 2, lines 31 to 60; the edges are ordered.
              { choice: { a: "2", b: "9", "start:a:2": "35", "end:a:2": "33" }[id] ?? "1" },
        ]),
      );
      return Effect.succeed(HttpClientResponse.fromWeb(request, Response.json({ answers })));
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(AdhereConfig, {
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          rules: {},
        }),
        Layer.succeed(Credentials, {
          apiKey: Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: Effect.succeed(false),
        }),
      ]),
    );
    const long = Array.from({ length: 70 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const located = Effect.gen(function* () {
      const jev = yield* Jev;
      return [
        yield* jev.locate(long, { a, b }, judgedFile),
        yield* jev.locate(["const x = 1;"], { a }, judgedFile),
      ];
    });
    const [three, one] = await Effect.runPromise(Effect.provide(located, layer));
    expect(three).toEqual({
      a: { section: sectionsOf(long)[1], sufficiency: 0.4, lines: { first: 33, last: 35 } },
    });
    expect(one).toEqual({
      a: { section: { first: 1, last: 1 }, sufficiency: 0.4, lines: { first: 1, last: 1 } },
    });
    expect(sent[0]).toContain("start:b:3");
    expect(sent[1]).toEqual(["start:a:1", "end:a:1", "sufficient:a"]);
  });

  /** Jev over a client that records each request's state and question ids, and says yes to each. */
  const recordedJev = () => {
    const sent: Array<{ readonly state: unknown; readonly ids: ReadonlyArray<string> }> = [];
    const client = HttpClient.make((request) => {
      const body: {
        readonly state: unknown;
        readonly questions: Readonly<Record<string, { readonly type: string }>>;
      } =
        request.body._tag === "Uint8Array"
          ? JSON.parse(new TextDecoder().decode(request.body.body))
          : { state: undefined, questions: {} };
      sent.push({ state: body.state, ids: Object.keys(body.questions) });
      const answers = Record.map(body.questions, ({ type }) =>
        type === "noul" ? { noul: 0.9 } : { choice: "1" },
      );
      return Effect.succeed(HttpClientResponse.fromWeb(request, Response.json({ answers })));
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(AdhereConfig, {
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          rules: {},
        }),
        Layer.succeed(Credentials, {
          apiKey: Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: Effect.succeed(false),
        }),
      ]),
    );
    return { sent, layer };
  };

  it("runs a rule's appendState right before its own requests, over their state alone", async () => {
    // It adds a key and replaces the code, and nothing stops it.
    const appendState: AppendState = (state, file) => ({
      code: { "1": "const replaced = true;" },
      seen: { sections: Object.keys(state.code), path: file.path, contents: file.contents },
    });
    const hooked = { ...b, appendState };
    const { sent, layer } = recordedJev();
    const asked = Effect.gen(function* () {
      const jev = yield* Jev;
      const judged = yield* jev.judge(["const port = 3000;"], { a, hooked }, [], judgedFile);
      yield* jev.locate(["const port = 3000;"], { hooked }, judgedFile);
      return judged;
    });

    const judged = await Effect.runPromise(Effect.provide(asked, layer));

    expect(judged.probabilities).toEqual({ a: 0.9, hooked: 0.9 });
    const appended = {
      code: { "1": "const replaced = true;" },
      seen: { sections: ["1"], path: "/repo/src/server.ts", contents: "const port = 3000;" },
    };
    expect(sent).toEqual([
      { state: { code: { "1": "const port = 3000;" } }, ids: ["a"] },
      { state: appended, ids: ["hooked"] },
      { state: appended, ids: ["start:hooked:1", "end:hooked:1", "sufficient:hooked"] },
    ]);
  });

  it("refuses when a rule's appendState fails, naming the rule, and sends nothing for it", async () => {
    const hooked = {
      ...b,
      appendState: () => Promise.reject(new Error("db/schema.sql is missing")),
    };
    const { sent, layer } = recordedJev();

    const judged = Effect.gen(function* () {
      return yield* (yield* Jev).judge(["const port = 3000;"], { hooked }, [], judgedFile);
    });

    const refused = await Effect.runPromise(Effect.flip(Effect.provide(judged, layer)));

    expect(refused.message).toBe("the appendState of hooked failed: db/schema.sql is missing");
    expect(sent).toEqual([]);
  });

  it("sends the key from Credentials as a bearer token", async () => {
    const { authorizations, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")));
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: { probabilities: { a: 0.25 }, linter: {} },
    });
    expect(authorizations).toEqual(["Bearer tsk_saved"]);
  });

  it("asks each matcher beside its rule, in one request, and reads its score back", async () => {
    const scoped = { ...a, appliesTo: ["a port"], excludeIf: ["a test port", "a fixed port"] };
    const { asked, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")), {
      a: scoped,
      b,
    });
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: {
        probabilities: { a: 0.25, b: 0.25 },
        matchers: { a: { appliesTo: [0.25], excludeIf: [0.25, 0.25] } },
      },
    });
    expect(asked).toEqual([["a", "b", "appliesTo:a:0", "excludeIf:a:0", "excludeIf:a:1"]]);
  });

  it("refuses an answer outside 2xx with its status and what Jev said about it", async () => {
    const { judged } = judge(
      Effect.succeed(Redacted.make("tsk_saved")),
      { a },
      () => new Response('{\n  "detail": "request too large"\n}', { status: 413 }),
    );
    expect(await judged).toMatchObject({
      _tag: "Failure",
      failure: {
        _tag: "JevUnavailable",
        message: 'Jev answered HTTP 413: { "detail": "request too large" }',
      },
    });
  });

  it("refuses with Credentials' reason, before sending anything", async () => {
    const message = "No TypeSafe AI API key. Run `adhere login` to save one.";
    const { authorizations, judged } = judge(Effect.fail(CredentialsUnavailable.make({ message })));
    expect(await judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable", message },
    });
    expect(authorizations).toEqual([]);
  });

  it("asks what one request cannot hold over several, and merges the answers", async () => {
    // About 30k tokens a question: two fit in a 64k request, a third does not.
    const big = { description: "Big.", must: "x".repeat(90_000) };
    const { asked, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")), {
      a: big,
      b: big,
      c: big,
    });
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: { probabilities: { a: 0.25, b: 0.25, c: 0.25 }, linter: {} },
    });
    expect(asked).toEqual([["a", "b"], ["c"]]);
  });

  it("reads the firewall's HTML page as a block with its Ray ID, and a JSON 403 as a refusal", async () => {
    const key = Effect.succeed(Redacted.make("tsk_saved"));
    const page = () =>
      new Response(
        '<!DOCTYPE html>\n<html class="no-js ie6 oldie">Sorry, you have been blocked</html>',
        {
          status: 403,
          headers: { "content-type": "text/html; charset=UTF-8", "cf-ray": "a3fb098cae4f55a3-LAX" },
        },
      );
    expect(await judge(key, { a }, page).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevBlocked", ray: "a3fb098cae4f55a3-LAX" },
    });

    const denied = () => Response.json({ detail: "this key has no access" }, { status: 403 });
    expect(await judge(key, { a }, denied).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable" },
    });
  });

  it("reads Jev's max_tokens_exceeded as an overflow, and any other 400 as a refusal", async () => {
    const key = Effect.succeed(Redacted.make("tsk_saved"));
    const overflow = () =>
      Response.json({ detail: { error_type: "max_tokens_exceeded" } }, { status: 400 });
    expect(await judge(key, { a }, overflow).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevOverflow" },
    });

    const invalid = () => Response.json({ detail: "questions: field required" }, { status: 400 });
    expect(await judge(key, { a }, invalid).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable" },
    });
  });
});

describe("cache files", () => {
  const directory = join(process.cwd(), ".adhere", "cache");
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  const sha256Crypto = Layer.succeed(
    Crypto.Crypto,
    Crypto.make({
      randomBytes: (size) => new Uint8Array(size),
      digest: (_algorithm, data) =>
        Effect.sync(() => new Uint8Array(createHash("sha256").update(data).digest())),
    }),
  );

  /** Files in a map of path to text; listing a directory gives its direct children. */
  const memoryFiles = (seed: Readonly<Record<string, string>> = {}) => {
    const files = new Map(Object.entries(seed));
    const layer = FileSystem.layerNoop({
      readDirectory: (path) =>
        Effect.sync(() => [
          ...new Set(
            [...files.keys()]
              .filter((file) => file.startsWith(`${path}/`))
              .map((file) => file.slice(path.length + 1).split("/")[0] ?? ""),
          ),
        ]),
      readFileString: (path) => Effect.succeed(files.get(path) ?? ""),
      writeFileString: (path, text) =>
        Effect.sync(() => {
          files.set(path, text);
        }),
      makeDirectory: () => Effect.void,
      remove: (path) =>
        Effect.sync(() => {
          files.delete(path);
        }),
    });
    return { files, layer };
  };

  const run = <A>(
    fs: Layer.Layer<FileSystem.FileSystem>,
    program: Effect.Effect<A, never, AuditCache>,
  ) =>
    Effect.runPromise(
      program.pipe(
        Effect.provide(
          AuditCacheLive.pipe(Layer.provide(Layer.mergeAll(fs, Path.layer, sha256Crypto))),
        ),
      ),
    );

  /** The names of the cache's files in `folder`, in order. */
  const listed = (files: ReadonlyMap<string, string>, folder: string) =>
    [...files.keys()]
      .filter((file) => file.startsWith(`${directory}/${folder}/`))
      .map((file) => file.slice(`${directory}/${folder}/`.length))
      .sort();

  it("adds a file for each new set of answers, named for the content and its own text, and reads their union", async () => {
    const memory = memoryFiles();
    const union = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        yield* cache.put("c0ffee", { f1: { probability: 0.1 } });
        yield* cache.put("c0ffee", { f2: { probability: 0.9, section: { first: 3, last: 3 } } });
        yield* cache.put("c0ffee", { f2: { probability: 0.9, section: { first: 3, last: 3 } } });
        return yield* cache.get("c0ffee", join(process.cwd(), "src/a.ts"));
      }),
    );
    expect(union).toEqual({
      f1: { probability: 0.1 },
      f2: { probability: 0.9, section: { first: 3, last: 3 } },
    });
    const first = '{\n  "answers": {\n    "f1": {\n      "probability": 0.1\n    }\n  }\n}\n';
    expect(listed(memory.files, "files")).toHaveLength(2);
    expect(memory.files.get(`${directory}/files/c0ffee.${sha(first).slice(0, 16)}.json`)).toBe(
      first,
    );
  });

  it("carries entries and tallies over from the layout before content keys, with relative paths", async () => {
    const file = join(process.cwd(), "src/a.ts");
    const memory = memoryFiles({
      [`${directory}/${sha(file)}`]: JSON.stringify({
        hash: "c0ffee",
        judgments: { a: { fingerprint: "f1", probability: 0.8, line: 2 } },
      }),
      [`${directory}/${sha("\u0000tally\u0000k1")}`]: JSON.stringify({ files: { [file]: 0.3 } }),
    });
    const [answers, stale, tally] = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        return [
          yield* cache.get("c0ffee", file),
          // The same path with other content: the old entry was about an earlier version.
          yield* cache.get("decade", file),
          yield* cache.tally("k1"),
        ] as const;
      }),
    );
    // Its line, from before sections, is dropped.
    expect(answers).toEqual({ f1: { probability: 0.8 } });
    expect(stale).toEqual({});
    expect(tally).toEqual({ files: { [file]: 0.3 } });
    expect(listed(memory.files, "files")).toHaveLength(1);
    const [kept] = listed(memory.files, "tallies");
    expect(memory.files.get(`${directory}/tallies/${kept}`)).toBe(
      '{\n  "files": {\n    "src/a.ts": 0.3\n  }\n}\n',
    );
  });

  it("prunes answers about content no file has, keeps every rule's answers and tallies, and folds each group", async () => {
    const memory = memoryFiles({ [`${directory}/${"0".repeat(64)}`]: "{}" });
    const [deleted, kept] = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        yield* cache.put("live", { f1: { probability: 0.1 } });
        yield* cache.put("live", {
          f1: { probability: 0.1, section: { first: 4, last: 4 } },
          other: { probability: 0.5 },
        });
        yield* cache.put("gone", { f1: { probability: 0.2 } });
        yield* cache.putTally("k1", { files: { [join(process.cwd(), "src/a.ts")]: 0.3 } });
        yield* cache.putTally("k1", { files: { [join(process.cwd(), "src/b.ts")]: 0.6 } });
        yield* cache.putTally("k2", { files: {} });
        const deleted = yield* cache.prune({ hashes: new Set(["live"]), tallies: new Set(["k1"]) });
        return [deleted, yield* cache.get("live", join(process.cwd(), "src/a.ts"))] as const;
      }),
    );
    // "other" answers a rule the run left out, such as another preset's: it stays.
    expect(kept).toEqual({
      f1: { probability: 0.1, section: { first: 4, last: 4 } },
      other: { probability: 0.5 },
    });
    const folded =
      '{\n  "answers": {\n    "f1": {\n      "probability": 0.1,\n      "section": {\n        "first": 4,\n        "last": 4\n      }\n    },\n    "other": {\n      "probability": 0.5\n    }\n  }\n}\n';
    expect(listed(memory.files, "files")).toEqual([`live.${sha(folded).slice(0, 16)}.json`]);
    const tallies = listed(memory.files, "tallies");
    // k2 is the tally of a rule the run left out: it stays too.
    expect(tallies.map((name) => name.split(".")[0]).sort()).toEqual(["k1", "k2"]);
    const k1 = tallies.find((name) => name.startsWith("k1."));
    expect(memory.files.get(`${directory}/tallies/${k1}`)).toBe(
      '{\n  "files": {\n    "src/a.ts": 0.3,\n    "src/b.ts": 0.6\n  }\n}\n',
    );
    expect(memory.files.has(`${directory}/${"0".repeat(64)}`)).toBe(false);
    // Live's first file, which its second holds all of; gone's file; both of k1's; and the old file.
    expect(deleted).toBe(5);
  });
});
