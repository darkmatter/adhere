import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { ConfigProvider, Crypto, Effect, FileSystem, Layer, Path, Record, Redacted } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { describe, expect, it } from "vite-plus/test";
import { findContradictions, formatContradictions } from "../src/contradictions.ts";
import {
  AdhereConfig as AdhereConfigSchema,
  decodeConfig,
  type Loaded,
  type Preset,
  resolveConfig,
} from "../src/config.ts";
import { tokenize } from "../src/highlight.ts";
import { initProject } from "../src/init.ts";
import { parseRuleMarkdown } from "../src/markdown.ts";
import type { ScannedFile } from "../src/models/Audit.ts";
import { applicableRules, loadAdhereRuleSet, loadRules, type RuleEntry } from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { AuditCache, type CacheEntry } from "../src/services/AuditCache.ts";
import {
  Credentials,
  CredentialsLive,
  CredentialsUnavailable,
} from "../src/services/Credentials.ts";
import { JevLive } from "../src/services/Jev.http.ts";
import {
  blockBody,
  conflictBody,
  contradictBody,
  fits,
  Jev,
  judgeBody,
  locateBody,
  namedPairs,
  type Pair,
  pairProbability,
  requestsOf,
  type Rules,
  tokensOf,
} from "../src/services/Jev.ts";
import { isInSkippedTree, SourceWalker } from "../src/services/SourceWalker.ts";
import { render, runAudit } from "../src/workflows/audit.ts";

const a = {
  description: "Ports are branded.",
  reference: '\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type\n',
};
const b = {
  description: "Secrets are redacted.",
  reference: 'const key = yield* Config.redacted("API_KEY")',
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

const memoryCache = (seed: Readonly<Record<string, CacheEntry>> = {}) => {
  const entries = new Map<string, CacheEntry>(Object.entries(seed));
  return Layer.succeed(AuditCache, {
    get: (path) => Effect.sync(() => entries.get(path)),
    put: (path, entry) =>
      Effect.sync(() => {
        entries.set(path, entry);
      }),
  });
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
        return asked(answers.judge, rules);
      }),
    locate: (_lines, rules) =>
      Effect.sync(() => {
        calls.locate.push(rules);
        return asked(answers.locate, rules);
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
}) =>
  Effect.runPromise(
    runAudit.pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AdhereConfig, {
            model: "jev-latest",
            threshold: options.threshold ?? 0.7,
            rules: options.rules,
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
  reference: a.reference,
  file: "/repo/src/server.ts",
  line: 2,
  snippet: "const port: number = Number(process.env.PORT);",
  probability: 0.9,
};

describe("request bodies", () => {
  const code = ["const x = 1;", "", "  const y = 2;"];
  const numbered = "1 | const x = 1;\n2 | \n3 |   const y = 2;";
  const question = "Does `code` break `rule`?";
  const breaks = "Part of `code` breaks `rule`";
  const follows =
    "Every part of `code` that `rule` covers follows it, or `rule` covers no part of `code`";

  it("judge: the numbered code is the whole state, and each rule rides in its own noul", () => {
    expect(judgeBody("jev-latest", code, rules)).toEqual({
      model: "jev-latest",
      state: { code: numbered },
      questions: {
        a: {
          type: "noul",
          instructions: { question, rule: a.description },
          criteria: { true: { what: breaks }, false: { what: follows, examples: [a.reference] } },
        },
        b: {
          type: "noul",
          instructions: { question, rule: b.description },
          criteria: { true: { what: breaks }, false: { what: follows, examples: [b.reference] } },
        },
      },
    });
  });

  it("locate: one choice per rule, carrying the rule, with a criterion per non-blank line", () => {
    expect(locateBody("jev-latest", code, { a })).toEqual({
      model: "jev-latest",
      state: { code: numbered },
      questions: {
        a: {
          type: "choice",
          instructions: {
            question: "Which line of `code` most clearly breaks `rule`?",
            rule: a.description,
            follows_rule: a.reference,
          },
          criteria: { "1": "const x = 1;", "3": "const y = 2;" },
        },
      },
    });
  });

  it("a rule with code to avoid: that code is an example of a yes", () => {
    const avoidOnly = { description: "Domain code does not throw.", avoid: 'throw new Error("x")' };
    const both = { ...a, avoid: "const port: number = 3000" };
    expect(judgeBody("jev-latest", code, { c: avoidOnly, d: both }).questions).toEqual({
      c: {
        type: "noul",
        instructions: { question, rule: avoidOnly.description },
        criteria: { true: { what: breaks, examples: [avoidOnly.avoid] }, false: { what: follows } },
      },
      d: {
        type: "noul",
        instructions: { question, rule: both.description },
        criteria: {
          true: { what: breaks, examples: [both.avoid] },
          false: { what: follows, examples: [both.reference] },
        },
      },
    });

    const located = locateBody("jev-latest", code, { c: avoidOnly, d: both }).questions;
    expect(located.c?.instructions).toEqual({
      question: "Which line of `code` most clearly breaks `rule`?",
      rule: avoidOnly.description,
      breaks_rule: avoidOnly.avoid,
    });
    expect(located.d?.instructions).toEqual({
      question: "Which line of `code` most clearly breaks `rule`?",
      rule: both.description,
      follows_rule: both.reference,
      breaks_rule: both.avoid,
    });
  });

  it("over 255 lines: a choice over 20-line blocks, then a choice inside the chosen block", () => {
    const long = Array.from({ length: 300 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const blocks = blockBody("jev-latest", long, { a });
    expect(blocks.questions.a?.type).toBe("choice");
    expect(blocks.questions.a?.instructions).toEqual({
      question: "Which block of `code` contains the line that most clearly breaks `rule`?",
      rule: a.description,
      follows_rule: a.reference,
    });
    expect(Object.keys(blocks.questions.a?.criteria ?? {})).toHaveLength(15);
    expect(blocks.questions.a?.criteria["0"]).toBe("const v1 = 1;...");
    expect(blocks.questions.a?.criteria["14"]).toBe("const v281 = 281;...");

    const inside = locateBody("jev-latest", long, { a }, { a: 3 });
    expect(Object.keys(inside.questions.a?.criteria ?? {})).toEqual(
      Array.from({ length: 20 }, (_, index) => String(61 + index)),
    );
    expect(inside.questions.a?.criteria["61"]).toBe("const v61 = 61;");
    expect(inside.questions.a?.criteria["80"]).toBe("const v80 = 80;");
  });
});

describe("jev's context", () => {
  /** A rule whose question comes to about `tokens` by `tokensOf`'s count. */
  const sized = (tokens: number) => ({ description: "Sized.", reference: "x".repeat(tokens * 3) });
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

  it("keeps a body that fits as one request", () => {
    const body = judgeBody("jev-latest", code1, rules);
    expect(requestsOf(body)).toEqual([body]);
  });

  it("fits a file whose code and longest question come within 32k tokens, in at most 5100 lines", () => {
    expect(fits(linesOf(1000, line), rules)).toBe(true);
    expect(fits(linesOf(4000, line), rules)).toBe(false);
    expect(fits(linesOf(5101, ""), rules)).toBe(false);
    expect(fits(code1, { a: sized(20_000) })).toBe(true);
    expect(fits(code1, { a: sized(33_000) })).toBe(false);
  });
});

/** A decoded config whose rules are already in memory, as the loader hands them on. */
const loaded = (config: typeof AdhereConfigSchema.Encoded, rules: Rules = {}) =>
  Effect.map(decodeConfig(config), (decoded) => ({ ...decoded, rules }));

describe("config", () => {
  it("applies the default model and threshold", async () => {
    const config = await Effect.runPromise(
      loaded({}, { "data/brand": { description: "d", reference: "r" } }),
    );
    expect(resolveConfig(config)).toEqual({
      model: "jev-latest",
      threshold: 0.7,
      rules: { "data/brand": { description: "d", reference: "r" } },
    });
  });

  it("folds presets into the rules, with a config rule winning over a preset rule", async () => {
    const override = { description: "mine", reference: "mine" };
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

  it("threshold precedence: command line, then config, then preset, then 0.7", async () => {
    const registry = { effect: { threshold: 0.9, rules: {} } };
    const bare = await Effect.runPromise(loaded({}));
    expect(resolveConfig(bare).threshold).toBe(0.7);
    expect(resolveConfig(bare, { presets: ["effect"] }, registry).threshold).toBe(0.9);
    const configured = await Effect.runPromise(loaded({ presets: ["effect"], threshold: 0.6 }));
    expect(resolveConfig(configured, {}, registry).threshold).toBe(0.6);
    expect(resolveConfig(configured, { threshold: 0.85 }, registry).threshold).toBe(0.85);
  });

  it("refuses an unknown preset", async () => {
    const refused = await Effect.runPromise(Effect.flip(decodeConfig({ presets: ["react"] })));
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("effect");
  });

  it("refuses a rule with neither a reference nor code to avoid", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ rules: { "data/brand": { description: "d" } } })),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("a rule needs a reference, code to avoid, or both");
  });

  it("accepts a rule with only code to avoid", async () => {
    const rule = { description: "Domain code does not throw.", avoid: "throw new Error()" };
    const config = await Effect.runPromise(decodeConfig({ rules: { "errors/no-throw": rule } }));
    expect(config.rules).toEqual({ "errors/no-throw": rule });
  });
});

describe("markdown rules", () => {
  const parse = (text: string) => Effect.runPromise(parseRuleMarkdown(text, "rules/a.md"));

  it("front matter is the description and threshold; the fenced block is the reference", async () => {
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
      reference: 'const Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type',
    });
  });

  it("without a fence, the whole body is the reference", async () => {
    const rule = await parse("---\ndescription: d\n---\nconst x = 1\n");
    expect(rule).toEqual({ description: "d", reference: "const x = 1" });
  });

  it("a fence tagged avoid is the code to avoid, before or after the reference", async () => {
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
      reference: 'class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {}) {}',
      avoid: 'throw new Error("not found")',
    });
  });

  it("a rule can be only code to avoid", async () => {
    const rule = await parse(
      "---\ndescription: A module has no default export.\n---\n\n```ts avoid\nexport default {}\n```\n",
    );
    expect(rule).toEqual({
      description: "A module has no default export.",
      avoid: "export default {}",
    });
  });

  it("refuses a body with no code, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\ndescription: d\n---\n\n", "rules/a.md")),
    );
    expect(refused.message).toContain("rules/a.md: the body needs reference code");
  });

  it("refuses a file without a description, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\nthreshold: 0.8\n---\ncode", "rules/a.md")),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("rules/a.md");
    expect(refused.message).toContain("description");
  });

  it("loads a directory: the relative path without .md is the rule id", async () => {
    const tree: Record<string, string> = {
      "/repo/rules/basics/gen.md": "---\ndescription: gen\n---\n```ts\ngen()\n```\n",
      "/repo/rules/data/brand.md": "---\ndescription: brand\n---\nbrand()\n",
      "/repo/rules/README.md": "---\ndescription: readme\n---\nnot a rule\n",
      "/repo/rules/notes.txt": "ignored",
    };
    const fs = FileSystem.layerNoop({
      readDirectory: () =>
        Effect.succeed(["basics/gen.md", "data/brand.md", "README.md", "notes.txt"]),
      readFileString: (file) => Effect.succeed(tree[file] ?? ""),
    });
    const rules = await Effect.runPromise(
      loadRules("/repo/rules").pipe(Effect.provide(Layer.merge(fs, Path.layer))),
    );
    expect(rules).toEqual({
      README: { description: "readme", reference: "not a rule" },
      "basics/gen": { description: "gen", reference: "gen()" },
      "data/brand": { description: "brand", reference: "brand()" },
    });
  });
});

describe("nested .adhere rules", () => {
  it("loads every .adhere directory with the containing directory as scope", async () => {
    const tree: Record<string, string> = {
      "/repo/.adhere/style/service.md": "---\ndescription: root\n---\nroot()\n",
      "/repo/.adhere/cache/ignored.md": "---\ndescription: cache\n---\ncache()\n",
      "/repo/packages/api/.adhere/style/service.md": "---\ndescription: api\n---\napi()\n",
      "/repo/packages/api/.adhere/api/schema.md": "---\ndescription: schema\n---\nschema()\n",
    };
    const fs = FileSystem.layerNoop({
      readDirectory: () =>
        Effect.succeed([
          ".adhere/style/service.md",
          ".adhere/cache/ignored.md",
          "packages/api/.adhere/style/service.md",
          "packages/api/.adhere/api/schema.md",
        ]),
      readFileString: (file) => Effect.succeed(tree[file] ?? ""),
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet("/repo").pipe(Effect.provide(Layer.merge(fs, Path.layer))),
    );

    expect(entries).toEqual([
      {
        id: "style/service",
        file: "/repo/.adhere/style/service.md",
        scope: "/repo",
        rule: { description: "root", reference: "root()" },
      },
      {
        id: "api/schema",
        file: "/repo/packages/api/.adhere/api/schema.md",
        scope: "/repo/packages/api",
        rule: { description: "schema", reference: "schema()" },
      },
      {
        id: "style/service",
        file: "/repo/packages/api/.adhere/style/service.md",
        scope: "/repo/packages/api",
        rule: { description: "api", reference: "api()" },
      },
    ]);
  });

  it("skips .adhere directories inside dependency and generated trees", async () => {
    const tree: Record<string, string> = {
      "/repo/.adhere/e2e/isolated.md": "---\ndescription: isolated\n---\nisolated()\n",
    };
    // The skipped files read as empty, which would refuse the load if they were parsed.
    const fs = FileSystem.layerNoop({
      readDirectory: () =>
        Effect.succeed([
          ".adhere/e2e/isolated.md",
          "node_modules/@drkmttr/adhere/.adhere/rules/refusals-name-the-file.md",
          "dist/.adhere/style/service.md",
        ]),
      readFileString: (file) => Effect.succeed(tree[file] ?? ""),
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet("/repo").pipe(Effect.provide(Layer.merge(fs, Path.layer))),
    );

    expect(entries.map((entry) => entry.id)).toEqual(["e2e/isolated"]);
  });

  it("applies root rules globally and lets the nearest nested rule shadow the same id", () => {
    const rootOnly = { description: "Root only.", reference: "rootOnly()" };
    const rootShadowed = { description: "Root service.", reference: "root()" };
    const apiShadow = { description: "API service.", reference: "api()" };
    const apiOnly = { description: "API only.", reference: "apiOnly()" };

    const entries = [
      {
        id: "style/root-only",
        file: "/repo/.adhere/style/root-only.md",
        scope: "/repo",
        rule: rootOnly,
      },
      {
        id: "style/service",
        file: "/repo/.adhere/style/service.md",
        scope: "/repo",
        rule: rootShadowed,
      },
      {
        id: "style/service",
        file: "/repo/packages/api/.adhere/style/service.md",
        scope: "/repo/packages/api",
        rule: apiShadow,
      },
      {
        id: "api/schema",
        file: "/repo/packages/api/.adhere/api/schema.md",
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

describe("source walker", () => {
  it("skips dependency, generated, and .adhere trees by whole path segment", () => {
    expect(isInSkippedTree("src/server.ts")).toBe(false);
    expect(isInSkippedTree("vendorized/lib.ts")).toBe(false);
    expect(isInSkippedTree("packages/api/node_modules/pkg/index.ts")).toBe(true);
    expect(isInSkippedTree("dist/main.ts")).toBe(true);
    expect(isInSkippedTree(".adhere/config.ts")).toBe(true);
  });
});

describe("contradictions", () => {
  const entry = (id: string, scope: string, description: string): RuleEntry => ({
    id,
    scope,
    file: `${scope}/.adhere/${id}.md`,
    rule: { description, reference: `${id}()` },
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
    expect(report).toContain("/repo/.adhere/style/use-services.md");
    expect(report).toContain("/repo/packages/api/.adhere/style/plain-functions.md");
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
      { id: "x", rule: { description: "X.", reference: "x()" } },
      { id: "y", rule: { description: "Y.", avoid: "y()" } },
      { id: "z", rule: { description: "Z.", reference: "z()" } },
    ];
    const state = {
      rules: {
        "0": { id: "x", description: "X.", reference: "x()" },
        "1": { id: "y", description: "Y.", avoid: "y()" },
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
      rule: { description: `R${index}.`, reference: "r()" },
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

describe("init", () => {
  it("scaffolds config and example rules without clobbering existing files", async () => {
    const root = join(tmpdir(), `adhere-init-${Date.now()}`);
    await Effect.runPromise(initProject(root));
    const config = await readFile(join(root, ".adhere", "config.ts"), "utf8");
    const rule = await readFile(join(root, ".adhere", "style", "prefer-small-files.md"), "utf8");

    expect(config).toContain("satisfies Config");
    expect(rule).toContain("description:");

    const second = await Effect.runPromise(initProject(root));
    expect(second.created).toEqual([]);
    expect(second.skipped).toContain(".adhere/config.ts");
    expect(second.skipped).toContain(".adhere/style/prefer-small-files.md");
  });

  it("keeps a config at another accepted path instead of adding a second one", async () => {
    const root = join(tmpdir(), `adhere-init-existing-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "adhere.config.ts"), "export default {};\n", "utf8");

    const result = await Effect.runPromise(initProject(root, { force: true }));

    expect(result.skipped).toContain("adhere.config.ts");
    expect(result.created).not.toContain(".adhere/config.ts");
    await expect(access(join(root, ".adhere", "config.ts"))).rejects.toThrow();
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
      findings: [findingA],
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
      findings: [findingA],
    });

    const editedB = { ...b, reference: 'const token = yield* Config.redacted("TOKEN")' };
    const third = recordingJev({ judge: { a: 0.9, b: 0.3 }, locate: { a: 2 } });
    const edited = await audit({ rules: { a, b: editedB }, jev: third.layer, cache });
    expect(third.calls).toEqual({ judge: [{ b: editedB }], locate: [] });
    expect(edited.findings).toEqual([findingA]);
    expect(edited.judged).toBe(1);
  });

  it("re-judges what an earlier question judged, and a rule that gains code to avoid", async () => {
    const hexByte = (byte: number) => byte.toString(16).padStart(2, "0");
    const hex = (text: string) => Array.from(new TextEncoder().encode(text), hexByte).join("");
    // The entry as adhere 0.4 wrote it: the fingerprint hashed model, description, and reference.
    const cache = memoryCache({
      [source.path]: {
        hash: hex(source.lines.join("\n")),
        judgments: {
          a: {
            fingerprint: hex(`jev-latest${a.description}${a.reference}`),
            probability: 0.9,
            line: 2,
            snippet: findingA.snippet,
          },
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

    const withAvoid = { ...a, avoid: "const port: number = 3000" };
    const edited = recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } });
    const result = await audit({ rules: { a: withAvoid }, jev: edited.layer, cache });
    expect(edited.calls.judge).toEqual([{ a: withAvoid }]);
    expect(result.findings).toEqual([{ ...findingA, avoid: withAvoid.avoid }]);
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
      findings: [findingA],
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

  it("gives back every character of the input, however malformed", () => {
    for (const code of ['"unterminated', "/* open", "`open\n\n", "a\r\nb", "é → 🎉", "y / z /"]) {
      const text = tokenize(code).map((line) => line.map((token) => token.text).join(""));
      expect(text.join("\n")).toBe(code);
    }
  });
});

describe("render", () => {
  const result = { files: 1, judged: 1, cached: 0, skipped: 0, findings: [findingA] };

  it("prints the vp-lint frame with the reference as the hint", () => {
    expect(render(result, { root: "/repo" }).join("\n")).toBe(
      [
        "  × a (0.90): Ports are branded.",
        "   ╭─[src/server.ts:2:1]",
        " 2 │ const port: number = Number(process.env.PORT);",
        "   · ──────────────────────────────────────────────",
        "   ╰────",
        '  hint: const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "        type Port = typeof Port.Type",
        "",
        "Found 1 error.",
        "1 file, 1 judged, 0 cached.",
      ].join("\n"),
    );
  });

  it("shows the code to avoid, labeled, for a rule without a reference", () => {
    const { reference: _, ...withoutReference } = findingA;
    const finding = { ...withoutReference, avoid: 'throw new Error("x")\nthrow new Error("y")' };
    const lines = render({ ...result, findings: [finding] }, { root: "/repo" });
    expect(lines).toContain('  avoid: throw new Error("x")');
    expect(lines).toContain('         throw new Error("y")');
    expect(lines.some((line) => line.includes("hint:"))).toBe(false);
  });

  it("colors the header red on a terminal and counts skipped files", () => {
    const colored = render({ ...result, skipped: 2 }, { color: true }).join("\n");
    expect(colored).toContain("\u001b[38;2;219;91;81;1m×");
    expect(colored).toContain("\u001b[38;2;5;125;160;1m/repo/src/server.ts");
    expect(colored.endsWith("1 file, 1 judged, 0 cached, 2 skipped.")).toBe(true);
  });

  it("highlights the offending line and the hint on a terminal", () => {
    const sgr = (code: string, text: string) => `\u001b[${code}m${text}\u001b[0m`;
    const colored = render(result, { color: true });
    expect(colored).toContain(
      ` ${sgr("2", "2")} │ ${sgr("34", "const")} port: ${sgr("36", "number")} = ${sgr("36", "Number")}(process.env.PORT);`,
    );
    expect(colored).toContain(
      `${sgr("38;2;180;105;245", "  hint: ")}${sgr("34", "const")} ${sgr("36", "Port")} = ${sgr("36", "Schema")}.${sgr("36", "Int")}.pipe(${sgr("36", "Schema")}.brand(${sgr("32", '"Port"')}))`,
    );
  });

  it("adds color and nothing else, and closes every color on the line that opens it", () => {
    const reference =
      "/* Decoded once,\n\n   at the edge. */\nconst message = `${file}:\n  ${line}`;";
    const findings = [{ ...findingA, reference }];
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
    const files = new Map<string, { readonly text: string; readonly mode?: number }>(
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
  /**
   * Judges one file through the live client, which answers 0.25 to every
   * question it is sent, recording each request's authorization header and
   * question ids.
   */
  const judge = (
    key: Effect.Effect<Redacted.Redacted<string>, CredentialsUnavailable>,
    judgedRules: Rules = { a },
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
      return Effect.succeed(HttpClientResponse.fromWeb(request, Response.json({ answers })));
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(AdhereConfig, { model: "jev-latest", threshold: 0.7, rules: {} }),
        Layer.succeed(Credentials, {
          apiKey: key,
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: Effect.succeed(false),
        }),
      ]),
    );
    const judged = Effect.gen(function* () {
      return yield* (yield* Jev).judge(["const port = 3000;"], judgedRules);
    });
    const result = Effect.runPromise(Effect.result(Effect.provide(judged, layer)));
    return { authorizations, asked, judged: result };
  };

  it("sends the key from Credentials as a bearer token", async () => {
    const { authorizations, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")));
    expect(await judged).toMatchObject({ _tag: "Success", success: { a: 0.25 } });
    expect(authorizations).toEqual(["Bearer tsk_saved"]);
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
    const big = { description: "Big.", reference: "x".repeat(90_000) };
    const { asked, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")), {
      a: big,
      b: big,
      c: big,
    });
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: { a: 0.25, b: 0.25, c: 0.25 },
    });
    expect(asked).toEqual([["a", "b"], ["c"]]);
  });
});
