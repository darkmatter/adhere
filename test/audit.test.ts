import { Crypto, Effect, Layer, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { decodeConfig } from "../src/config.ts";
import type { ScannedFile } from "../src/models/Audit.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { AuditCache, type CacheEntry } from "../src/services/AuditCache.ts";
import {
  blockBody,
  Jev,
  judgeBody,
  locateBody,
  numbered,
  type Rules,
} from "../src/services/Jev.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
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

/** A Jev that answers from fixed tables and records the rules of every call. */
const recordingJev = (answers: {
  readonly judge: Record<string, number>;
  readonly locate: Record<string, number>;
}) => {
  const calls = { judge: [] as Array<Rules>, locate: [] as Array<Rules> };
  const asked = (table: Record<string, number>, rules: Rules) =>
    Record.filter(table, (_, id) => rules[id] !== undefined);
  const layer = Layer.succeed(Jev, {
    judge: (_code, rules) =>
      Effect.sync(() => {
        calls.judge.push(rules);
        return asked(answers.judge, rules);
      }),
    locate: (_code, rules) =>
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
  const code = numbered(["const x = 1;", "", "  const y = 2;"]);

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
    const long = numbered(
      Array.from({ length: 300 }, (_, index) => `const v${index + 1} = ${index + 1};`),
    );
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

describe("config", () => {
  it("applies the default model and threshold", async () => {
    const decoded = await Effect.runPromise(
      decodeConfig({ rules: { "data/brand": { description: "d", reference: "r" } } }),
    );
    expect(decoded).toEqual({
      model: "jev-latest",
      threshold: 0.7,
      rules: { "data/brand": { description: "d", reference: "r" } },
    });
  });

  it("refuses a rule without a reference", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ rules: { "data/brand": { description: "d" } } })),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("reference");
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
    expect(render(result).join("\n")).toBe(
      [
        "  × a (0.90): Ports are branded.",
        "   ╭─[/repo/src/server.ts:2:1]",
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
