import { Crypto, Effect, Layer } from "effect";
import { describe, expect, it } from "vite-plus/test";
import type { ScannedFile, SolutionsTopic } from "../src/models/Audit.ts";
import { type Candidate, JevJudge, type Verdict } from "../src/models/Judge.ts";
import { AuditCache, type CacheEntry } from "../src/services/AuditCache.ts";
import { EffectSolutions } from "../src/services/EffectSolutions.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
import { TopicPatterns } from "../src/services/TopicPatterns.ts";
import { render, runAudit } from "../src/workflows/audit.ts";

const topics: ReadonlyArray<SolutionsTopic> = [
  { slug: "quick-start", title: "Quick Start" },
  { slug: "basics", title: "Basics" },
  { slug: "config", title: "Config" },
];

const solutionsStub = Layer.succeed(EffectSolutions, {
  topics: Effect.succeed(topics),
});

const walkerStub = (files: ReadonlyArray<ScannedFile>) =>
  Layer.succeed(SourceWalker, { files: Effect.succeed(files) });

const patternsStub = Layer.succeed(TopicPatterns, {
  pattern: (topic: string) =>
    Effect.succeed(
      `## ${topic}\nUse Effect's documented pattern for ${topic}.`,
    ),
});

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
    get: (path: string) => entries.get(path),
    put: (path: string, entry: CacheEntry) =>
      Effect.sync(() => {
        entries.set(path, entry);
      }),
    save: Effect.void,
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
      Effect.provide(solutionsStub),
      Effect.provide(walkerStub(files)),
      Effect.provide(patternsStub),
      Effect.provide(judgeAlways(violates)),
      Effect.provide(memoryCache()),
      Effect.provide(testCrypto),
    ),
  );

describe("audit", () => {
  it("reports a Jev-confirmed config violation for a process.env read", async () => {
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
        violates: 0.9,
        reason: "stubbed verdict",
      },
    ]);
  });

  it("drops candidates the judge finds compliant", async () => {
    const result = await auditWith(
      [
        file("apps/demo/src/config.ts", [
          "export const port = process.env.PORT ?? 3000;",
        ]),
      ],
      0.2,
    );
    expect(result.candidates).toBe(1);
    expect(result.violations).toHaveLength(0);
  });

  it("respects a custom threshold", async () => {
    const result = await Effect.runPromise(
      runAudit({ threshold: 0.95 }).pipe(
        Effect.provide(solutionsStub),
        Effect.provide(
          walkerStub([
            file("apps/demo/src/config.ts", [
              "export const port = process.env.PORT ?? 3000;",
            ]),
          ]),
        ),
        Effect.provide(patternsStub),
        Effect.provide(judgeAlways(0.9)),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(result.violations).toHaveLength(0);
  });

  it("sends the judge an excerpt with the flagged line marked", async () => {
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
        Effect.provide(solutionsStub),
        Effect.provide(
          walkerStub([
            file("a.ts", [
              "const before = 1;",
              "const port = process.env.PORT;",
              "const after = 2;",
            ]),
          ]),
        ),
        Effect.provide(patternsStub),
        Effect.provide(judge),
        Effect.provide(memoryCache()),
        Effect.provide(testCrypto),
      ),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0]?.excerpt).toContain("> 2 |");
    expect(seen[0]?.pattern).toContain("## config");
  });

  it("filters to the requested topics only", async () => {
    const result = await Effect.runPromise(
      runAudit({ topics: ["config"] }).pipe(
        Effect.provide(solutionsStub),
        Effect.provide(
          walkerStub([
            file("a.ts", ["const url = process.env.API_URL;"]),
            file("b.ts", ['const x: { readonly _tag: "a" } = null!;']),
          ]),
        ),
        Effect.provide(patternsStub),
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
        "  × jev(config/process-env-read): Configuration is read from process.env.",
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
          Effect.provide(solutionsStub),
          Effect.provide(walkerStub([source])),
          Effect.provide(patternsStub),
          Effect.provide(judge),
          Effect.provide(cache),
          Effect.provide(testCrypto),
        ),
      );
    const first = await run();
    const second = await run();
    expect(calls).toBe(1);
    expect(first.cachedFiles).toBe(0);
    expect(second.cachedFiles).toBe(1);
    expect(second.violations).toEqual(first.violations);
  });
});
