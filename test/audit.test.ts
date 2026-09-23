import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Crypto, Effect, FileSystem, Layer, Path, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { findContradictions, formatContradictions } from "../src/contradictions.ts";
import {
  AdhereConfig as AdhereConfigSchema,
  decodeConfig,
  type Loaded,
  type Preset,
  resolveConfig,
} from "../src/config.ts";
import { initProject } from "../src/init.ts";
import { parseRuleMarkdown } from "../src/markdown.ts";
import type { ScannedFile } from "../src/models/Audit.ts";
import { applicableRules, loadAdhereRuleSet, loadRules } from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { AuditCache, type CacheEntry } from "../src/services/AuditCache.ts";
import { blockBody, Jev, judgeBody, locateBody, type Rules } from "../src/services/Jev.ts";
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

/** Echoes the input as its digest, so equal text still shares a cache key. */
const testCrypto = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) => new Uint8Array(size),
    digest: (_algorithm, data) => Effect.succeed(data),
  }),
);

const memoryCache = () => {
  const entries = new Map<string, CacheEntry>();
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
          Layer.succeed(SourceWalker, { files: Effect.succeed([source]) }),
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

  it("judge: one noul per rule over the numbered code and the rules", () => {
    expect(judgeBody("jev-latest", code, rules)).toEqual({
      model: "jev-latest",
      state: {
        code: "1 | const x = 1;\n2 | \n3 |   const y = 2;",
        rules: {
          a: { description: a.description, reference: a.reference },
          b: { description: b.description, reference: b.reference },
        },
      },
      questions: {
        a: {
          type: "noul",
          instructions:
            'Does state.code diverge from the pattern shown in state.rules["a"].reference, as described by state.rules["a"].description? Answer no if the pattern does not apply to this file.',
        },
        b: {
          type: "noul",
          instructions:
            'Does state.code diverge from the pattern shown in state.rules["b"].reference, as described by state.rules["b"].description? Answer no if the pattern does not apply to this file.',
        },
      },
    });
  });

  it("locate: one choice per rule with a criterion per non-blank line", () => {
    expect(locateBody("jev-latest", code, { a })).toEqual({
      model: "jev-latest",
      state: {
        code: "1 | const x = 1;\n2 | \n3 |   const y = 2;",
        rules: { a: { description: a.description, reference: a.reference } },
      },
      questions: {
        a: {
          type: "choice",
          instructions:
            'Which line of state.code most clearly diverges from state.rules["a"].reference?',
          criteria: { "1": "const x = 1;", "3": "const y = 2;" },
        },
      },
    });
  });

  it("over 255 lines: a choice over 20-line blocks, then a choice inside the chosen block", () => {
    const long = Array.from({ length: 300 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const blocks = blockBody("jev-latest", long, { a });
    expect(blocks.questions.a?.type).toBe("choice");
    expect(blocks.questions.a?.instructions).toBe(
      'Which block of state.code contains the line that most clearly diverges from state.rules["a"].reference?',
    );
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

  it("refuses a rule without a reference", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ rules: { "data/brand": { description: "d" } } })),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("reference");
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
  it("finds opposite textual rules that overlap in scope", () => {
    const contradictions = findContradictions([
      {
        id: "style/use-services",
        file: "/repo/.adhere/style/use-services.md",
        scope: "/repo",
        rule: { description: "Use service classes for IO.", reference: "class Api {}" },
      },
      {
        id: "style/avoid-services",
        file: "/repo/packages/api/.adhere/style/avoid-services.md",
        scope: "/repo/packages/api",
        rule: {
          description: "Do not use service classes for IO.",
          reference: "const Api = {}",
        },
      },
      {
        id: "style/unrelated",
        file: "/repo/packages/web/.adhere/style/unrelated.md",
        scope: "/repo/packages/web",
        rule: { description: "Avoid mutable globals.", reference: "x()" },
      },
    ]);

    expect(contradictions).toHaveLength(1);
    expect(formatContradictions(contradictions)).toContain("/repo/.adhere/style/use-services.md");
    expect(formatContradictions(contradictions)).toContain(
      "/repo/packages/api/.adhere/style/avoid-services.md",
    );
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

  it("colors the header red on a terminal and counts skipped files", () => {
    const colored = render({ ...result, skipped: 2 }, { color: true }).join("\n");
    expect(colored).toContain("\u001b[38;2;219;91;81;1m×");
    expect(colored).toContain("\u001b[38;2;5;125;160;1m/repo/src/server.ts");
    expect(colored.endsWith("1 file, 1 judged, 0 cached, 2 skipped.")).toBe(true);
  });
});
