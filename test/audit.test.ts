import { Crypto, Effect, Layer } from "effect";
import { describe, expect, it } from "vite-plus/test";
import type { ScannedFile } from "../src/models/Audit.ts";
import { type Candidate, JevJudge, type Verdict } from "../src/models/Judge.ts";
import config from "../adhere.config.ts";
import { includes } from "../src/rules.ts";
import { AuditCache, type CacheEntry } from "../src/services/AuditCache.ts";
import { Rules } from "../src/services/Rules.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
import { render, runAudit } from "../src/workflows/audit.ts";

const rulesStub = Layer.succeed(Rules, {
  rules: [
    {
      topic: "config",
      rule: "process-env-read",
      message: "Configuration is read from process.env.",
      help: "Read it with Config.string, Config.int, or Config.redacted.",
      ...includes("process.env."),
    },
    {
      topic: "data-modeling",
      rule: "handrolled-tag-union",
      message: "Tagged union is written by hand.",
      help: "Define it with Schema.TaggedStruct or Schema.TaggedUnion.",
      ...includes("readonly _tag:"),
    },
  ],
});

const walkerStub = (files: ReadonlyArray<ScannedFile>) =>
  Layer.succeed(SourceWalker, { files: Effect.succeed(files) });

/**
 * A judge stub that says every candidate violates with the same probability,
 * so tests assert what the audit does with verdicts, not Jev's opinion.
 */
const judged = (candidate: Candidate, violates: number): Verdict => ({
  topic: candidate.topic,
  rule: candidate.rule,
  file: candidate.file,
  line: candidate.line,
  column: candidate.column,
  message: candidate.message,
  help: candidate.help,
  snippet: candidate.snippet,
  violates,
  reason: "stubbed verdict",
  decidedBy: "jev",
});

const judgeAlways = (violates: number) =>
  Layer.succeed(JevJudge, {
    judge: (candidate: Candidate, _pattern: string) =>
      Effect.succeed(judged(candidate, violates)),
  });

/** One in-memory cache, shared across runs in a single test. */
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
    get: (path: string) => Effect.sync(() => entries.get(path)),
    put: (path: string, entry: CacheEntry) =>
      Effect.sync(() => {
        entries.set(path, entry);
      }),
  });
};

const file = (path: string, lines: ReadonlyArray<string>): ScannedFile => ({
  path,
  lines,
});

/** Runs the audit with every boundary stubbed; nothing leaves the test. */
const auditWith = (files: ReadonlyArray<ScannedFile>, violates = 0.9) =>
  Effect.runPromise(
    runAudit().pipe(
      Effect.provide(rulesStub),
      Effect.provide(walkerStub(files)),
      Effect.provide(judgeAlways(violates)),
      Effect.provide(memoryCache()),
      Effect.provide(testCrypto),
    ),
  );

describe("audit", () => {
  it("reports a process.env read from the line test, without asking Jev", async () => {
    const result = await auditWith([
      file("apps/demo/src/config.ts", [
        "export const port = process.env.PORT ?? 3000;",
      ]),
    ]);
    expect(result.violations).toEqual([
      {
        topic: "config",
        rule: "process-env-read",
        file: "apps/demo/src/config.ts",
        line: 1,
        column: 21,
        message: "Configuration is read from process.env.",
        help: "Read it with Config.string, Config.int, or Config.redacted.",
        snippet: "export const port = process.env.PORT ?? 3000;",
        violates: 1,
        reason: "matched the rule",
        decidedBy: "rule",
      },
    ]);
  });

  it("reports a line-test match even when the judge would call it compliant", async () => {
    const result = await auditWith(
      [
        file("apps/demo/src/config.ts", [
          "export const port = process.env.PORT ?? 3000;",
        ]),
      ],
      0.2,
    );
    expect(result.candidates).toBe(1);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.decidedBy).toBe("rule");
  });

  it("does not drop a line-test match because of the threshold", async () => {
    const result = await Effect.runPromise(
      runAudit({ threshold: 0.95 }).pipe(
        Effect.provide(rulesStub),
        Effect.provide(
          walkerStub([
            file("apps/demo/src/config.ts", [
              "export const port = process.env.PORT ?? 3000;",
            ]),
          ]),
        ),
        Effect.provide(judgeAlways(0.9)),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.decidedBy).toBe("rule");
  });

  it("does not ask Jev to confirm a line-test match", async () => {
    const seen: Array<{ excerpt: string; pattern: string }> = [];
    const judge = Layer.succeed(JevJudge, {
      judge: (candidate: Candidate, pattern: string) =>
        Effect.sync(() => {
          seen.push({ excerpt: candidate.excerpt, pattern });
          return judged(candidate, 0);
        }),
    });
    await Effect.runPromise(
      runAudit().pipe(
        Effect.provide(rulesStub),
        Effect.provide(
          walkerStub([
            file("a.ts", [
              "const before = 1;",
              "const port = process.env.PORT;",
              "const after = 2;",
            ]),
          ]),
        ),
        Effect.provide(judge),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(seen).toHaveLength(0);
  });

  it("filters to the requested topics only", async () => {
    const result = await Effect.runPromise(
      runAudit({ topics: ["config"] }).pipe(
        Effect.provide(rulesStub),
        Effect.provide(
          walkerStub([
            file("a.ts", ["const url = process.env.API_URL;"]),
            file("b.ts", ['const x: { readonly _tag: "a" } = null!;']),
          ]),
        ),
        Effect.provide(judgeAlways(0.9)),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(result.candidates).toBe(1);
    expect(result.violations[0]?.topic).toBe("config");
  });

  it("renders one vp-lint line per verdict, using the rule message", async () => {
    const result = await auditWith([
      file("/repo/apps/demo/src/config.ts", ["const a = process.env.A;"]),
    ]);
    const plain = render({ ...result, filesScanned: 1, cachedFiles: 0 });
    expect(plain.join("\n")).toBe(
      [
        "  × config/process-env-read: Configuration is read from process.env.",
        "   ╭─[apps/demo/src/config.ts:1:11]",
        " 1 │ const a = process.env.A;",
        "   ·           ─",
        "   ╰────",
        "  hint: Read it with Config.string, Config.int, or Config.redacted.",
        "",
        "Found 1 error.",
        "1 file, 1 candidate, 0 cached files.",
      ].join("\n"),
    );
    const colored = render(
      { ...result, filesScanned: 1, cachedFiles: 0 },
      { color: true },
    ).join("\n");
    expect(colored).toContain("\u001b[38;2;219;91;81;1m×");
    expect(colored).toContain(
      "\u001b[38;2;5;125;160;1mapps/demo/src/config.ts",
    );
  });

  it("does not judge a file again when its content hash is cached", async () => {
    let calls = 0;
    const judge = Layer.succeed(JevJudge, {
      judge: (candidate: Candidate) =>
        Effect.sync(() => {
          calls += 1;
          return judged(candidate, 0.9);
        }),
    });
    const cache = memoryCache();
    const source = file("apps/demo/src/config.ts", [
      "export const port = process.env.PORT ?? 3000;",
    ]);
    const run = () =>
      Effect.runPromise(
        runAudit().pipe(
          Effect.provide(rulesStub),
          Effect.provide(walkerStub([source])),
          Effect.provide(judge),
          Effect.provide(cache),
          Effect.provide(testCrypto),
        ),
      );
    const first = await run();
    const second = await run();
    expect(calls).toBe(0);
    expect(first.cachedFiles).toBe(0);
    expect(second.cachedFiles).toBe(1);
    expect(second.violations).toEqual(first.violations);
  });

  it("sends a judged rule's pattern to Jev", async () => {
    const seen: Array<string> = [];
    const judge = Layer.succeed(JevJudge, {
      judge: (candidate: Candidate, pattern: string) =>
        Effect.sync(() => {
          seen.push(pattern);
          return judged(candidate, 0.9);
        }),
    });
    const judgedOnly = Layer.succeed(Rules, {
      rules: [
        {
          topic: "config",
          rule: "secret-in-source",
          message: "A secret is written in source.",
          help: "Read it with Config.redacted.",
          judged: true,
          pattern: "No secret literals.",
        },
      ],
    });
    await Effect.runPromise(
      runAudit().pipe(
        Effect.provide(judgedOnly),
        Effect.provide(walkerStub([file("a.ts", ["const a = 1;"])])),
        Effect.provide(judge),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(seen).toEqual(["No secret literals."]);
  });
});

describe("adhere.config.ts", () => {
  it("exports the process.env rule", () => {
    expect(
      config.some(
        (rule) => rule.topic === "config" && rule.rule === "process-env-read",
      ),
    ).toBe(true);
  });
});
