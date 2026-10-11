import {
  planOf,
  loaded,
  a,
  b,
  rules,
  testCrypto,
  memoryCache,
  placedAt,
  sendingJev,
  recordingJev,
  source,
  fixtureWalker,
  audit,
  findingA,
  onDisk,
} from "./audit.fixtures.ts";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect, Layer, Path, Record, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { requestOf, type SystemOneRequest } from "../src/providers/systemOne.ts";
import { ContextOverflow, type Provider } from "../src/providers/provider.ts";
import { describe, expect, it } from "vite-plus/test";
import {
  type AppendState,
  DEFAULT_READS,
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
  type ReadState,
  resolveConfig,
} from "../src/config.ts";

import { type ScannedFile } from "../src/models/Audit.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { AuditCache, CacheEntry, type Live } from "../src/services/AuditCache.ts";
import { Credentials } from "../src/services/Credentials.ts";
import { JevLive } from "../src/services/Jev.http.ts";
import { SourceReads, SourceReadsLive } from "../src/services/SourceReads.ts";
import {
  fits,
  Jev,
  JevBlocked,
  JevOverflow,
  JevUnavailable,
  judgeLoad,
  type Rules,
} from "../src/services/Jev.ts";
import { tallyKeyOf } from "../src/mechanical.ts";
import {
  type AuditPlan,
  executeAudit,
  failing,
  type FileDone,
  planAudit,
  pruneCache,
  render,
} from "../src/workflows/audit.ts";
import { describePlan, sendQuestion } from "../src/workflows/format.ts";

describe("pipeline", () => {
  const execute = (
    plan: AuditPlan,
    jev: Layer.Layer<Jev>,
    cache: Layer.Layer<AuditCache>,
    sourceReads?: Layer.Layer<SourceReads>,
    files: ReadonlyArray<ScannedFile> = [source],
  ) =>
    Effect.runPromise(
      executeAudit(plan).pipe(
        Effect.provide(
          Layer.mergeAll(
            jev,
            cache,
            fixtureWalker(files),
            testCrypto,
            ...(sourceReads === undefined ? [] : [sourceReads]),
          ),
        ),
      ),
    );

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

    const changedModel = recordingJev({ judge: { a: 0.9, b: 0.3 }, locate: { a: 2 } });
    await audit({ rules: { a, b: editedB }, model: "jev-other", jev: changedModel.layer, cache });
    expect(changedModel.calls).toEqual({ judge: [{ a, b: editedB }], locate: [{ a }] });
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

  it("keeps judgments cached when workspace packages change, but refreshes an edited target", async () => {
    const imported = {
      ...source,
      lines: [...source.lines, 'import type { Order } from "orders-core/types";'],
    };
    const cache = memoryCache();
    const run = (
      workspacePackages: Readonly<Record<string, string>>,
      files: ReadonlyArray<ScannedFile> = [imported],
    ) => {
      const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      return audit({
        rules,
        reads: ["workspacePackages"],
        jev: jev.layer,
        cache,
        workspacePackages,
        files,
      }).then(() => jev.calls);
    };
    expect(await run({ "orders-core": "packages/orders" })).toEqual({
      judge: [rules],
      locate: [{ a }],
    });
    expect(await run({ "orders-core": "packages/orders" })).toEqual({ judge: [], locate: [] });
    expect(await run({ "orders-core": "packages/orders", billing: "packages/billing" })).toEqual({
      judge: [],
      locate: [],
    });
    expect(await run({ "orders-core": "packages/moved", billing: "packages/billing" })).toEqual({
      judge: [],
      locate: [],
    });
    expect(
      await run({ billing: "packages/billing" }, [
        { ...imported, lines: [...imported.lines, "const edited = true;"] },
      ]),
    ).toEqual({
      judge: [rules],
      locate: [{ a }],
    });
  });

  it("keeps explicit code-only reads lazy without a tsconfig and shares their cache entries", async () => {
    const imported = {
      ...source,
      lines: [...source.lines, 'import type { Order } from "orders-core/types";'],
    };
    const root = await onDisk({ "server.ts": imported.lines.join("\n") });
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () =>
        Effect.die("code-only and workspace-package reads must not prepare the compiler"),
      read: () => Effect.die("code-only and workspace-package reads must not query the compiler"),
    });
    const files = [{ ...imported, path: join(root, "server.ts") }];
    const cache = memoryCache();
    try {
      const first = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      const result = await audit({
        rules,
        reads: [],
        jev: first.layer,
        cache,
        files,
        sourceReads,
        workspacePackages: { "orders-core": "packages/orders" },
      });
      expect(result.judged).toBe(1);
      expect(first.states).toEqual({ judge: [{}], locate: [{}] });

      const second = recordingJev({ judge: {}, locate: {} });
      const cached = await audit({
        rules,
        reads: [],
        jev: second.layer,
        cache,
        files,
        sourceReads,
        workspacePackages: { billing: "packages/billing" },
      });
      expect(cached.cached).toBe(1);
      expect(second.calls).toEqual({ judge: [], locate: [] });
      expect(cached.findings).toEqual(result.findings);

      const enabled = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      await audit({
        rules,
        reads: ["workspacePackages"],
        jev: enabled.layer,
        cache,
        files,
        sourceReads,
        workspacePackages: { billing: "packages/billing" },
      });
      expect(enabled.calls).toEqual({ judge: [], locate: [] });
      expect(enabled.states).toEqual({ judge: [], locate: [] });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each([false, true])(
    "reuses only imported workspace context without the compiler (includeComments: %s)",
    async (includeComments) => {
      const files = [
        {
          ...source,
          lines: [
            ...source.lines,
            'import type { Order } from "@repo/orders/types";',
            '// import Unused from "unused";',
            "const text = 'require(\"unused\")';",
          ],
        },
        { path: "/repo/src/no-imports.ts", lines: ['export const name = "@repo/orders";'] },
      ];
      const workspacePackages = {
        "@repo/orders": "packages/orders",
        unused: "x".repeat(110_000),
      };
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: () => Effect.die("workspace-only reads must not prepare the compiler"),
        read: () => Effect.die("workspace-only reads must not query the compiler"),
      });
      const cache = memoryCache();
      const planned = await planOf({
        rules,
        files,
        cache,
        reads: ["workspacePackages"],
        includeComments,
        workspacePackages,
        sourceReads,
      });
      expect(planned.skipped).toBe(0);
      expect(planned.nativeReads).toBeUndefined();
      expect(planned.files.map(({ readState }) => readState)).toEqual([
        { workspacePackages: {} },
        { workspacePackages: { "@repo/orders": "packages/orders" } },
      ]);
      workspacePackages["@repo/orders"] = "packages/moved-after-planning";
      const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      const result = await execute(planned, jev.layer, cache, sourceReads, files);
      expect(result.judged).toBe(2);
      for (const file of planned.files) {
        expect(jev.states.judge).toContain(file.readState);
        expect(jev.states.locate).toContain(file.readState);
      }
    },
  );

  it.each([
    { policy: "default", reads: DEFAULT_READS, typeAware: undefined },
    {
      policy: "legacy native names",
      reads: ["workspacePackages", "symbols", "references"] as const,
      typeAware: undefined,
    },
    {
      policy: "explicit off",
      reads: ["workspacePackages", "symbols", "references"] as const,
      typeAware: false,
    },
  ])("judges and locates compiler-free with $policy context", async ({ reads, typeAware }) => {
    const imported = {
      ...source,
      lines: [...source.lines, 'import type { Order } from "orders-core/types";'],
    };
    const workspacePackages = { "orders-core": "packages/orders", unused: "packages/unused" };
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("non-type-aware work must not acquire the compiler"),
      read: () => Effect.die("non-type-aware work must not query native context"),
    });
    const cache = memoryCache();
    const plan = await planOf({
      rules,
      files: [imported],
      cache,
      reads,
      ...(typeAware === undefined ? {} : { typeAware }),
      sourceReads,
      workspacePackages,
    });
    expect(plan.nativeReads).toBeUndefined();
    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const result = await execute(plan, jev.layer, cache, sourceReads, [imported]);
    expect(result).toMatchObject({ judged: 1, skipped: 0 });
    expect(result.findings.map(({ rule }) => rule)).toEqual(["a"]);
    expect(jev.states).toEqual({
      judge: [{ workspacePackages: { "orders-core": "packages/orders" } }],
      locate: [{ workspacePackages: { "orders-core": "packages/orders" } }],
    });
  });

  it("keeps type-aware limit-zero plans and execution compiler-free even with uncached files", async () => {
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("planning and deferred files must not start the compiler"),
      read: () => Effect.die("planning and deferred files must not read native context"),
    });
    const cache = memoryCache();
    const generated: ScannedFile = {
      path: "/repo/src/generated.ts",
      lines: ["x".repeat(110_000)],
    };
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [source, generated],
      cache,
      limit: 0,
      sourceReads,
    });
    expect(planned.nativeReads).toEqual({
      symbols: true,
      references: true,
      includeComments: false,
      maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
      maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
    });
    expect(planned).toMatchObject({
      planOnly: true,
      checks: 4,
      cached: 0,
      skipped: 0,
      deferred: 2,
      requests: 0,
      tokens: 0,
    });
    expect(
      planned.files.map((plan) => [plan.skipped, Object.keys(plan.pending), plan.deferred]),
    ).toEqual([
      [false, [], true],
      [false, [], true],
    ]);
    const jev = recordingJev({ judge: {}, locate: {} });
    const result = await execute(planned, jev.layer, cache, sourceReads);
    expect(jev.calls).toEqual({ judge: [], locate: [] });
    expect({ judged: result.judged, waiting: result.waiting, skipped: result.skipped }).toEqual({
      judged: 0,
      waiting: 2,
      skipped: 0,
    });
  });

  it("keeps cached-unlocated limit-zero plans strictly dry-run with no SDK or HTTP", async () => {
    const cache = memoryCache();
    await audit({
      rules,
      cache,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: {} }).layer,
    });
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("a dry-run cached locate must not start the SDK"),
      read: () => Effect.die("a dry-run cached locate must not acquire native context"),
    });
    const noHttp = Layer.succeed(Jev, {
      judge: () => Effect.die("a dry run must not judge"),
      locate: () => Effect.die("a dry run must not locate cached flags"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [source],
      cache,
      limit: 0,
      sourceReads,
    });
    expect(planned.planOnly).toBe(true);
    expect(planned.cachedLocateRequests ?? 0).toBe(0);
    expect(planned.cached).toBe(2);
    expect(planned.requests).toBe(0);
    expect(planned.files[0]?.pending).toEqual({});
    expect(planned.files[0]?.deferred).toBe(true);
    expect(planned.deferred).toBe(1);
    const result = await execute(planned, noHttp, cache, sourceReads);
    expect(result).toMatchObject({ judged: 0, cached: 0, waiting: 1 });
    expect(result.findings).toEqual([]);
  });

  it.each([false, true])(
    "charges one file slot for cached locating and its pending rules, deferring later native/HTTP work (pending: %s)",
    async (pending) => {
      const files = [
        { path: "/repo/src/a-first.ts", lines: ["// first", "const port = 1001;"] },
        {
          path: "/repo/src/b-later.ts",
          lines: [
            pending ? "// adhere-ignore b -- cached finding" : "// later",
            "const port = 1002;",
          ],
        },
      ];
      const cache = memoryCache();
      await audit({
        rules,
        files,
        cache,
        jev: recordingJev({ judge: { a: 0.9, b: 0.9 }, locate: { b: 2 } }).layer,
      });
      const c = { description: "Ports must be named.", must: "const serverPort = 3000;" };
      const selectedRules = pending ? { ...rules, c } : rules;
      const preparations: Array<readonly string[]> = [];
      const queried: Array<string> = [];
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: (paths) =>
          Effect.sync(() => {
            preparations.push(paths);
          }),
        read: (file) =>
          Effect.sync(() => {
            queried.push(file.path);
            return {};
          }),
      });
      const planned = await planOf({
        rules: selectedRules,
        typeAware: true,
        reads: DEFAULT_READS,
        files: [...files].reverse(),
        cache,
        limit: 1,
        sourceReads,
      });
      expect(
        planned.files.map((plan) => [plan.file.path, Object.keys(plan.pending), plan.deferred]),
      ).toEqual([
        [files[0]!.path, pending ? ["c"] : [], false],
        [files[1]!.path, [], true],
      ]);
      expect(planned).toMatchObject({
        checks: pending ? 6 : 4,
        cached: 4,
        deferred: 1,
        requests: pending ? 1 : 0,
        cachedLocateRequests: 1,
      });
      expect(preparations).toEqual([]);
      const jev = recordingJev({ judge: { c: 0.2 }, locate: { a: 2 } });
      const result = await execute(planned, jev.layer, cache, sourceReads, files);
      expect(preparations).toEqual([[files[0]!.path]]);
      expect(queried).toEqual([files[0]!.path]);
      expect(jev.calls).toEqual({ judge: pending ? [{ c }] : [], locate: [{ a }] });
      expect(result).toMatchObject({
        judged: 1,
        cached: 0,
        waiting: 1,
        suppressed: pending ? 1 : 0,
      });
      expect(
        result.findings
          .filter((finding) => finding.file === files[1]!.path)
          .map((finding) => finding.rule),
      ).toEqual(pending ? [] : ["b"]);
    },
  );

  it.each(["native", "HTTP"])(
    "does not refill a selected file slot after %s overflow during execution",
    async (overflow) => {
      const files = [
        { ...source, path: "/repo/src/a-first.ts" },
        { path: "/repo/src/b-later.ts", lines: ["const other = 1;"] },
      ];
      const cache = memoryCache();
      const preparations: Array<readonly string[]> = [];
      const queried: Array<string> = [];
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: (paths) =>
          Effect.sync(() => {
            preparations.push(paths);
          }),
        read: (file) =>
          Effect.sync(() => {
            queried.push(file.path);
            return overflow === "native"
              ? { references: { "port:caller.ts": "x".repeat(110_000) } }
              : {};
          }),
      });
      const planned = await planOf({
        rules,
        typeAware: true,
        reads: ["references"],
        files,
        cache,
        limit: 1,
        sourceReads,
      });
      expect(planned.files.map((file) => file.deferred)).toEqual([false, true]);
      const sent: Array<Rules> = [];
      const jev = Layer.succeed(Jev, {
        judge: (_lines, asked) =>
          Effect.sync(() => {
            sent.push(asked);
          }).pipe(Effect.andThen(Effect.fail(JevOverflow.make({})))),
        locate: () => Effect.die("overflowing selected work must not locate"),
        conflicts: () => Effect.die("an audit compares no rules"),
        contradicts: () => Effect.die("an audit compares no rules"),
      });
      const result = await execute(planned, jev, cache, sourceReads, files);
      expect(result).toMatchObject({ judged: 0, skipped: 1, waiting: 1 });
      expect(preparations).toEqual([[files[0]!.path]]);
      expect(queried).toEqual([files[0]!.path]);
      expect(sent).toEqual([rules]);
    },
  );

  it("preserves fully located cached errors when cheap workspace context outgrows the budget", async () => {
    const imported = { ...source, lines: [...source.lines, 'import "@acme/workspace";'] };
    const cache = memoryCache();
    const first = await audit({
      rules,
      files: [imported],
      cache,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
    });
    const workspacePackages = { "@acme/workspace": "packages/" + "workspace-".repeat(12_000) };
    expect(fits(imported.lines, rules, { workspacePackages })).toBe(false);
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("fully located cached findings need no SDK"),
      read: () => Effect.die("fully located cached findings need no native context"),
    });
    const noHttp = Layer.succeed(Jev, {
      judge: () => Effect.die("fully cached checks must not be re-judged"),
      locate: () => Effect.die("fully located cached findings need no HTTP"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [imported],
      cache,
      sourceReads,
      workspacePackages,
    });
    expect(planned.cached).toBe(2);
    const result = await execute(planned, noHttp, cache, sourceReads, [imported]);
    expect(result.findings).toEqual(first.findings);
    expect(failing(result.findings)).toHaveLength(1);
    expect(render(result, { root: "/repo" }).join("\n")).toContain(a.description);
  });

  it("preserves cached located errors when native fallback also API-overflows without looping", async () => {
    const cache = memoryCache();
    const first = await audit({
      rules: { a },
      cache,
      jev: recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } }).layer,
    });
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.void,
      read: () => Effect.succeed({ references: { "port:caller.ts": "x".repeat(110_000) } }),
    });
    const attempts: ReadState[] = [];
    const noHttp = Layer.succeed(Jev, {
      judge: (_lines, _rules, _sampled, _file, state = {}) =>
        Effect.sync(() => attempts.push(state)).pipe(
          Effect.andThen(Effect.fail(JevOverflow.make())),
        ),
      locate: () => Effect.die("the cached error is already located"),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: ["references"],
      files: [source],
      cache,
      sourceReads,
    });
    expect(planned.cached).toBe(1);
    expect(planned.files[0]?.pending.b?.rule).toEqual(b);
    expect(planned.skipped).toBe(0);
    const result = await execute(planned, noHttp, cache, sourceReads);
    expect(result.skipped).toBe(1);
    expect(result.findings).toEqual(first.findings);
    expect(failing(result.findings)).toHaveLength(1);
    expect(attempts).toEqual([{}]);
    const reused = await audit({ rules: { a }, cache, jev: noHttp });
    expect(reused.findings).toEqual(first.findings);
  });

  it("prepares native context only before locating an unlocated cached flag, then skips the SDK on a fully cached run", async () => {
    const cache = memoryCache();
    await audit({
      rules,
      cache,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: {} }).layer,
    });
    const symbols = { port: "const port: number" };
    const references = { "port:caller.ts": "use(port);\n" };
    const events: string[] = [];
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: (files) =>
        Effect.sync(() => {
          expect(files).toEqual([source.path]);
          events.push("prepare");
        }),
      read: () =>
        Effect.sync(() => {
          events.push("read");
          return { symbols, references };
        }),
    });
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [source],
      cache,
      sourceReads,
      workspacePackages: {},
    });
    expect(planned.cached).toBe(2);
    expect(planned.requests).toBe(0);
    expect(planned.planOnly).not.toBe(true);
    expect(planned.cachedLocateRequests).toBe(1);
    const description = describePlan(planned).join("\n");
    expect(description).toMatch(/locat/i);
    expect(description).toMatch(/\b1 request\b/);
    const prompt = sendQuestion(planned);
    expect(prompt).toMatch(/locat/i);
    expect(prompt).toMatch(/\b1 request\b/);
    expect(prompt).not.toMatch(/Send (?:an estimated )?0 requests/i);
    expect(events).toEqual([]);
    const jev = Layer.succeed(Jev, {
      judge: () => Effect.die("cached judgments must not be re-judged"),
      locate: (lines, asked, _file, state = {}) =>
        Effect.sync(() => {
          events.push("locate");
          expect(asked).toEqual({ a });
          expect(state).toEqual({ workspacePackages: {}, symbols, references });
          return { a: placedAt(lines, 2) };
        }),
      conflicts: () => Effect.die("an audit compares no rules"),
      contradicts: () => Effect.die("an audit compares no rules"),
    });
    const result = await execute(planned, jev, cache, sourceReads);
    expect(events).toEqual(["prepare", "read", "locate"]);
    expect(result.findings).toEqual([findingA]);
    const noNative = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("fully cached files must not start the SDK"),
      read: () => Effect.die("fully cached files must not acquire native context"),
    });
    const cached = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [source],
      cache,
      sourceReads: noNative,
      workspacePackages: { changed: "packages/changed" },
    });
    expect(cached.cached).toBe(2);
    const again = recordingJev({ judge: {}, locate: {} });
    const reused = await execute(cached, again.layer, cache, noNative);
    expect(again.calls).toEqual({ judge: [], locate: [] });
    expect(reused.cached).toBe(1);
    expect(reused.findings).toEqual(result.findings);
  });

  it("enables both native fields with typeAware regardless of legacy read subsets", async () => {
    const symbols = { port: "const port: number" };
    const references = { "port:caller.ts": "use(port);\n" };
    for (const reads of [[], ["symbols"], ["references"]] as const) {
      const includeComments = reads[0] === "references";
      const requested = {
        symbols: true,
        references: true,
        includeComments,
        maxSymbolDocumentationLength: 32,
        maxSymbolLength: 64,
      };
      const preparations: Array<readonly string[]> = [];
      let queried = 0;
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: (files) =>
          Effect.sync(() => {
            preparations.push(files);
          }),
        read: (_file, _lines, flags) =>
          Effect.sync(() => {
            expect(flags).toEqual(requested);
            queried += 1;
            return { symbols, references, unrequested: true };
          }),
      });
      const cache = memoryCache();
      const planned = await planOf({
        rules,
        typeAware: true,
        reads,
        includeComments,
        maxSymbolDocumentationLength: requested.maxSymbolDocumentationLength,
        maxSymbolLength: requested.maxSymbolLength,
        files: [source],
        cache,
        sourceReads,
      });
      expect(planned.nativeReads).toEqual(requested);
      expect(planned.files[0]?.readState).toEqual({});
      expect(preparations).toEqual([]);
      expect(queried).toBe(0);
      const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      await execute(planned, jev.layer, cache, sourceReads);
      const state = { symbols, references };
      expect(jev.states).toEqual({ judge: [state], locate: [state] });
      expect(preparations).toEqual([[source.path]]);
      expect(queried).toBe(1);
      expect(planned.files[0]?.readState).toEqual({});
    }
  });

  it("does not prepare the compiler when there are no files to send", async () => {
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("an empty eligible set must not prepare the compiler"),
      read: () => Effect.die("an empty eligible set must not query the compiler"),
    });
    for (const files of [
      [],
      [{ ...source, test: true }],
      [{ ...source, lines: ["x".repeat(110_000)] }],
    ]) {
      const planned = await planOf({
        rules,
        typeAware: true,
        reads: DEFAULT_READS,
        files,
        cache: memoryCache(),
        sourceReads,
      });
      expect(planned.requests).toBe(0);
      expect(planned.tokens).toBe(0);
      const jev = recordingJev({ judge: {}, locate: {} });
      await execute(planned, jev.layer, memoryCache(), sourceReads);
      expect(jev.calls).toEqual({ judge: [], locate: [] });
    }
  });

  it("prepares only selected execution paths, excluding cached, deferred, and unjudged files", async () => {
    const other = { ...source, path: "/repo/src/other.ts", lines: ["export const other = 1;"] };
    const cached = { ...source, path: "/repo/src/cached.ts", lines: ["export const cached = 1;"] };
    const cache = memoryCache();
    await audit({
      rules,
      files: [cached],
      cache,
      jev: recordingJev({ judge: { a: 0.1, b: 0.2 }, locate: {} }).layer,
    });
    const preparations: Array<readonly string[]> = [];
    const queried: string[] = [];
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: (files) =>
        Effect.sync(() => {
          preparations.push(files);
        }),
      read: (file, _lines, requested) =>
        Effect.sync(() => {
          expect(preparations).toEqual([[other.path]]);
          expect(requested).toEqual({
            symbols: true,
            references: true,
            includeComments: false,
            maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
            maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          });
          queried.push(file.path);
          return { symbols: {}, references: {} };
        }),
    });
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: ["symbols", "references", "symbols"],
      cache,
      sourceReads,
      limit: 1,
      files: [
        source,
        other,
        cached,
        { ...source, path: "/repo/test/unjudged.ts", test: true },
        { ...source, path: "/repo/src/oversized.ts", lines: ["x".repeat(110_000)] },
      ],
    });
    expect(preparations).toEqual([]);
    expect(queried).toEqual([]);
    expect(planned.cached).toBe(2);
    expect(planned.deferred).toBe(2);
    expect(planned.skipped).toBe(0);
    expect(planned.unjudged).toHaveLength(1);
    const jev = recordingJev({ judge: { a: 0.1, b: 0.2 }, locate: {} });
    const result = await execute(planned, jev.layer, cache, sourceReads, [other]);
    expect(preparations).toEqual([[other.path]]);
    expect(queried).toEqual([other.path]);
    expect(jev.calls).toEqual({ judge: [rules], locate: [] });
    expect({
      judged: result.judged,
      cached: result.cached,
      waiting: result.waiting,
      skipped: result.skipped,
    }).toEqual({ judged: 1, cached: 1, waiting: 2, skipped: 0 });
  });

  it("ignores caller and reader changes in the cache but refreshes edited target code", async () => {
    const library = "export function parse(value: number) {\n\treturn value;\n}\n";
    const caller = 'import { parse as read } from "./library";\nexport const result = read(1);\n';
    const root = await onDisk({
      "library.ts": library,
      "caller.ts": caller,
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          types: [],
        },
        files: ["library.ts", "caller.ts"],
      }),
    });
    const cache = memoryCache();
    const noNative = Layer.succeed(SourceReads, {
      prepare: () => Effect.die("cached judgments must not start the SDK"),
      read: () => Effect.die("cached judgments must not acquire native context"),
    });
    const run = async (reader = SourceReadsLive(root).pipe(Layer.provide(Path.layer))) => {
      const text = await readFile(join(root, "library.ts"), "utf8");
      const jev = recordingJev({ judge: { a: 0.1, b: 0.9 }, locate: { b: 2 } });
      await audit({
        rules,
        typeAware: true,
        reads: ["symbols", "references"],
        jev: jev.layer,
        cache,
        // The caller is context, although this run only judges the declaration file.
        files: [{ path: join(root, "library.ts"), lines: text.split("\n") }],
        sourceReads: reader,
      });
      return jev.calls;
    };
    try {
      expect(await run()).toEqual({ judge: [rules], locate: [{ b }] });
      expect(await run(noNative)).toEqual({ judge: [], locate: [] });
      await writeFile(join(root, "caller.ts"), caller.replace("read(1)", "read(2)"));
      expect(await run(noNative)).toEqual({ judge: [], locate: [] });
      await writeFile(join(root, "caller.ts"), `${caller}read(3);\n`);
      expect(await run(noNative)).toEqual({ judge: [], locate: [] });
      await writeFile(
        join(root, "library.ts"),
        library.replace("return value", "return value + 1"),
      );
      expect(await run()).toEqual({ judge: [rules], locate: [{ b }] });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("plans type-aware reads without the compiler and acquires one shared context only during execution", async () => {
    const workspacePackages = { "orders-core": "packages/orders" };
    const catalog = { ...workspacePackages, unused: "packages/unused" };
    const files = [
      { ...source, lines: [...source.lines, 'import type { Order } from "orders-core/types";'] },
    ];
    const symbols = { port: "const port: number" };
    const references = { "port:caller.ts": "\tuse(port);\n  use(port);\n" };
    const readState = { workspacePackages, symbols, references };
    let reads = 0;
    const preparations: Array<readonly string[]> = [];
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: (files) =>
        Effect.sync(() => {
          preparations.push(files);
        }),
      read: (_file, _lines, requested) =>
        Effect.sync(() => {
          expect(preparations).toEqual([[source.path]]);
          expect(requested).toEqual({
            symbols: true,
            references: true,
            includeComments: false,
            maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
            maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          });
          reads += 1;
          return { symbols, references, unrequested: true };
        }),
    });
    const cache = memoryCache();
    const config = resolveConfig(await Effect.runPromise(loaded({}, rules)), {
      threshold: 0.7,
      sufficiencyThreshold: 0.7,
      typeAware: true,
    });
    expect(config.reads).toEqual(["workspacePackages", "symbols", "references"]);
    const planned = await Effect.runPromise(
      planAudit().pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, { ...config, workspacePackages: catalog }),
            fixtureWalker(files),
            cache,
            testCrypto,
            sourceReads,
          ),
        ),
      ),
    );
    expect(planned.files).toHaveLength(1);
    expect(preparations).toEqual([]);
    expect(reads).toBe(0);
    expect(planned.nativeReads).toEqual({
      symbols: true,
      references: true,
      includeComments: false,
      maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
      maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
    });
    expect(JSON.stringify(planned)).not.toContain("caller.ts");
    for (const file of planned.files) {
      expect(file.readState).toEqual({ workspacePackages });
      expect(file.readState.workspacePackages).not.toBe(catalog);
      expect(Object.values(file.prepared).some((rule) => Object.hasOwn(rule, "readState"))).toBe(
        false,
      );
      const pending = Record.map(file.pending, ({ rule }) => rule);
      const sampled = Object.keys(file.sampled);
      const load = judgeLoad(files[0]!.lines, pending, sampled, file.readState);
      expect(planned.requests).toBe(1);
      expect(planned.requests).toBe(load.requests);
      expect(planned.tokens).toBe(load.tokens);
      expect(planned.tokens).toBeGreaterThan(judgeLoad(files[0]!.lines, pending, sampled).tokens);

      const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      expect(planned.tokens).toBeLessThan(
        judgeLoad(files[0]!.lines, pending, sampled, readState).tokens,
      );
      await execute(planned, jev.layer, cache, sourceReads, files);
      expect(jev.calls).toEqual({ judge: [rules], locate: [{ a }] });
      expect(jev.states).toEqual({ judge: [readState], locate: [readState] });
      expect(jev.states.judge[0]).toBe(jev.states.locate[0]);
      expect(jev.states.judge[0]).not.toBe(file.readState);
      expect(file.readState).toEqual({ workspacePackages });
      expect(JSON.stringify(planned)).not.toContain("caller.ts");
    }
    expect(reads).toBe(1);
    expect(preparations).toEqual([[source.path]]);
  });

  it("rechecks real context and attempts judge and locate without oversized references", async () => {
    const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
    const preparations: Array<readonly string[]> = [];
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: (files) =>
        Effect.sync(() => {
          preparations.push(files);
        }),
      read: () => Effect.succeed({ references: { "port:caller.ts": "x".repeat(110_000) } }),
    });
    const cache = memoryCache();
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: ["references"],
      files: [source],
      cache,
      sourceReads,
    });
    expect(planned.skipped).toBe(0);
    expect(planned.requests).toBe(1);
    expect(Object.keys(planned.files[0]?.sampled ?? {}).sort()).toEqual(["a", "b"]);
    expect(preparations).toEqual([]);
    const result = await execute(planned, jev.layer, cache, sourceReads);
    expect(result.skipped).toBe(0);
    expect(result.judged).toBe(1);
    expect(preparations).toEqual([[source.path]]);
    expect(jev.calls.judge).toHaveLength(1);
    expect(jev.calls.locate).toHaveLength(1);
    expect(jev.states).toEqual({ judge: [{}], locate: [{}] });
  });

  it.each([
    ["judge", true],
    ["locate", true],
    ["judge", false],
    ["locate", false],
  ] as const)(
    "retries only the overflowing %s phase once without references (fallback succeeds: %s)",
    async (phase, succeeds) => {
      const references = { "port:caller.ts": "\tuse(port);\n" };
      const symbols = { port: "const port: number" };
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: () => Effect.void,
        read: () => Effect.succeed({ symbols, references }),
      });
      const cache = memoryCache();
      const plan = await planOf({
        rules,
        files: [source],
        cache,
        typeAware: true,
        reads: ["symbols", "references"],
      });
      const attempts = { judge: [] as ReadState[], locate: [] as ReadState[] };
      const jev = Layer.succeed(Jev, {
        judge: (lines, asked, _sampled, _file, state = {}) => {
          expect(lines).toEqual(source.lines);
          expect(Object.keys(asked)).toEqual(["a", "b"]);
          attempts.judge.push(state);
          return phase === "judge" && (state.references !== undefined || !succeeds)
            ? Effect.fail(JevOverflow.make())
            : Effect.succeed({ probabilities: { a: 0.9, b: 0.2 }, linter: {} });
        },
        locate: (lines, asked, _file, state = {}) => {
          expect(lines).toEqual(source.lines);
          expect(Object.keys(asked)).toEqual(["a"]);
          attempts.locate.push(state);
          return phase === "locate" && (state.references !== undefined || !succeeds)
            ? Effect.fail(JevOverflow.make())
            : Effect.succeed({ a: placedAt(lines, 2) });
        },
        conflicts: () => Effect.die("unused"),
        contradicts: () => Effect.die("unused"),
      });
      const done: FileDone[] = [];
      const result = await Effect.runPromise(
        executeAudit(plan, (file) =>
          Effect.sync(() => {
            done.push(file);
          }),
        ).pipe(
          Effect.provide(
            Layer.mergeAll(jev, cache, sourceReads, fixtureWalker([source]), testCrypto),
          ),
        ),
      );
      if (!succeeds) {
        expect(result).toMatchObject({ judged: 0, skipped: 1, findings: [] });
        expect(attempts[phase]).toEqual([{ symbols, references }, { symbols }]);
        expect(done[0]?.requests).toBe(phase === "judge" ? 2 : 3);
        const retry = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
        await audit({ rules, cache, jev: retry.layer });
        expect(retry.calls.judge).toHaveLength(1);
        expect(Object.keys(retry.calls.judge[0]!)).toEqual(["a", "b"]);
        return;
      }
      expect(result).toMatchObject({ judged: 1, skipped: 0 });
      expect(result.findings.map(({ rule }) => rule)).toEqual(["a"]);
      expect(attempts).toEqual(
        phase === "judge"
          ? { judge: [{ symbols, references }, { symbols }], locate: [{ symbols }] }
          : { judge: [{ symbols, references }], locate: [{ symbols, references }, { symbols }] },
      );
      expect(done[0]?.requests).toBe(3);
      const noRequests = Layer.succeed(Jev, {
        judge: () => Effect.die("successful fallback must be cached"),
        locate: () => Effect.die("successful fallback locations must be cached"),
        conflicts: () => Effect.die("unused"),
        contradicts: () => Effect.die("unused"),
      });
      const cached = await audit({ rules, cache, jev: noRequests });
      expect(cached.findings).toEqual(result.findings);
    },
  );

  it("strips hook-returned references on fallback but keeps original references available to hooks", async () => {
    const references = { "port:caller.ts": "\tuse(port);\n" };
    const symbols = { port: "const port: number" };
    const seen: ReadState[] = [];
    const appendState: AppendState = (state) => {
      seen.push(state);
      expect(state.references).toMatchObject(references);
      return {
        references: { "hook:caller.ts": "use(port);" },
        hookContext: (state.references as Record<string, string>)["port:caller.ts"],
      };
    };
    const hooked = { a: { ...a, appendState }, b: { ...b, appendState } };
    const sent: SystemOneRequest[] = [];
    const provider: Provider = {
      model: "jev-latest",
      ask: async (state, questions) => {
        const body = requestOf("jev-latest", state, questions);
        sent.push(body);
        if (sent.length === 2) throw new ContextOverflow("second group overflow");
        const locating = questions.some(({ id }) => id.startsWith("start:"));
        return {
          answers: Object.fromEntries(
            questions.map(({ id }) => [
              id,
              id.startsWith("start:") || id.startsWith("end:")
                ? "2"
                : locating
                  ? 0.9
                  : id === "b"
                    ? 0.9
                    : sent.length === 1
                      ? 0.99
                      : 0.1,
            ]),
          ),
        };
      },
    };
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.void,
      read: () => Effect.succeed({ symbols, references }),
    });
    const cache = memoryCache();
    const plan = await planOf({
      rules: hooked,
      files: [source],
      cache,
      typeAware: true,
      reads: ["symbols", "references"],
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(AdhereConfig, resolveConfig({ presets: [], rules: hooked, provider })),
        Layer.succeed(FetchHttpClient.Fetch, (() => {
          throw new Error("no real HTTP");
        }) as unknown as typeof globalThis.fetch),
        Layer.succeed(Credentials, {
          key: () => Effect.die("provider requires no credentials"),
          file: Effect.die("unused"),
          save: () => Effect.die("unused"),
          remove: () => Effect.die("unused"),
        }),
      ]),
    );
    const done: FileDone[] = [];
    const result = await Effect.runPromise(
      executeAudit(plan, (file) =>
        Effect.sync(() => {
          done.push(file);
        }),
      ).pipe(
        Effect.provide(
          Layer.mergeAll(layer, cache, sourceReads, fixtureWalker([source]), testCrypto),
        ),
      ),
    );
    expect(result).toMatchObject({ judged: 1, skipped: 0 });
    expect(result.findings.map(({ rule }) => rule)).toEqual(["b"]);
    expect(sent).toHaveLength(5);
    expect(seen).toHaveLength(5);
    expect(done[0]?.requests).toBe(5);
    for (const body of sent) {
      expect(Object.values(body.state.code as Record<string, string>).join("\n")).toBe(
        source.lines.join("\n"),
      );
      expect(body.state.symbols).toMatchObject(symbols);
      expect(body.state.hookContext).toBe(references["port:caller.ts"]);
    }
    for (const body of sent.slice(2)) expect(body.state).not.toHaveProperty("references");
    for (const body of sent.slice(0, 2))
      expect(body.state.references).toMatchObject({ "hook:caller.ts": "use(port);" });
    const again = recordingJev({ judge: {}, locate: {} });
    const cached = await audit({ rules: hooked, cache, jev: again.layer });
    expect(again.calls).toEqual({ judge: [], locate: [] });
    expect(cached.findings).toEqual(result.findings);
    expect(cached.cached).toBe(1);
  });

  it.each(["blocked", "unavailable"] as const)(
    "does not remove references after a %s refusal",
    async (kind) => {
      const references = { "port:caller.ts": "use(port);\n" };
      const attempts: ReadState[] = [];
      const jev = Layer.succeed(Jev, {
        judge: (_lines, _rules, _sampled, _file, state = {}) => {
          attempts.push(state);
          return kind === "blocked"
            ? Effect.fail(JevBlocked.make({ ray: "no-retry" }))
            : Effect.fail(JevUnavailable.make({ message: "no-retry" }));
        },
        locate: () => Effect.die("a refused judgment must not locate"),
        conflicts: () => Effect.die("unused"),
        contradicts: () => Effect.die("unused"),
      });
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: () => Effect.void,
        read: () => Effect.succeed({ references }),
      });
      const cache = memoryCache();
      const plan = await planOf({
        rules,
        files: [source],
        cache,
        typeAware: true,
        reads: ["references"],
      });
      const effect = executeAudit(plan).pipe(
        Effect.provide(
          Layer.mergeAll(jev, cache, sourceReads, fixtureWalker([source]), testCrypto),
        ),
      );
      if (kind === "blocked")
        expect(await Effect.runPromise(effect)).toMatchObject({
          judged: 0,
          blocked: [{ ray: "no-retry", file: source.path }],
        });
      else
        expect(await Effect.runPromise(Effect.flip(effect))).toMatchObject({
          _tag: "JevUnavailable",
        });
      expect(attempts).toEqual([{ references }]);
    },
  );

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
              typeAware: false,
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
              maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
              reads: [],
              rules,
            }),
            fixtureWalker([source]),
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

  it("keeps unjudged content live when pruning a limit-zero plan", async () => {
    const pruned: Array<Live> = [];
    const helper: ScannedFile = {
      path: "/repo/test/helper.ts",
      lines: ["const y = 2;"],
      test: true,
    };
    const plan = await Effect.runPromise(
      planAudit({ limit: 0 }).pipe(
        Effect.tap(pruneCache),
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(AdhereConfig, {
              typeAware: false,
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
              maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
              reads: [],
              rules,
            }),
            fixtureWalker([source, helper]),
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
