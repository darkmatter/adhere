import {
  planOf,
  a,
  b,
  rules,
  code1,
  testCrypto,
  memoryCache,
  sectionAt,
  placedAt,
  recordingJev,
  source,
  fixtureWalker,
  audit,
  findingA,
} from "./audit.fixtures.ts";

import { Effect, Layer, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { NO_SUPPRESSIONS, suppressionsOf } from "../src/suppress.ts";
import {
  DEFAULT_READS,
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
} from "../src/config.ts";
import { type ScannedFile, WalkUnavailable } from "../src/models/Audit.ts";
import { type RuleSet } from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { type Answers, AuditCache, type Live, type Tally } from "../src/services/AuditCache.ts";

import {
  fits,
  Jev,
  JevUnavailable,
  judgeLoad,
  locateRequests,
  type Rules,
} from "../src/services/Jev.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
import { Status } from "../src/services/Status.ts";
import { SAMPLE, tallyKeyOf } from "../src/mechanical.ts";
import {
  type AuditPlan,
  executeAudit,
  type FileDone,
  type FilePlan,
  planAudit,
  pruneCache,
  runAudit,
} from "../src/workflows/audit.ts";
import { describePlan, progressLine, sendQuestion } from "../src/workflows/format.ts";

describe("plan", () => {
  const other: ScannedFile = { path: "/repo/src/other.ts", lines: ["const x = 1;"] };

  it("consumes bounded source prefetch while retaining only compact file metadata", async () => {
    const paths = Array.from({ length: 64 }, (_, index) => ({
      path: `/repo/src/f${String(index).padStart(2, "0")}.ts`,
    }));
    let loaded = 0;
    let consumed = 0;
    let peak = 0;
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed(paths),
      read: (file) =>
        Effect.sync(() => {
          loaded += 1;
          peak = Math.max(peak, loaded - consumed);
          return { ...file, lines: [`export const bounded = ${loaded};`] };
        }),
    });
    const status = Layer.succeed(Status, {
      show: () =>
        Effect.sync(() => {
          consumed += 1;
        }),
      clear: Effect.void,
    });
    const planned = await Effect.runPromise(
      planAudit({ limit: 0 }).pipe(
        Effect.provide(
          Layer.mergeAll(
            walker,
            status,
            memoryCache(),
            testCrypto,
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
          ),
        ),
      ),
    );
    expect(loaded).toBe(paths.length);
    expect(consumed).toBe(paths.length);
    expect(peak).toBeLessThanOrEqual(16);
    expect(planned.files.map((plan) => plan.file)).toEqual(paths);
    expect(planned.files.every((plan) => !Object.hasOwn(plan, "original"))).toBe(true);
    expect(JSON.stringify(planned)).not.toContain("export const bounded");
    expect(planned).toMatchObject({ checks: 128, deferred: 64, requests: 0, tokens: 0 });
  });

  it("refuses the whole audit without pruning when a later prefetched source read fails", async () => {
    const paths = Array.from({ length: 64 }, (_, index) => ({
      path: `/repo/src/f${String(index).padStart(2, "0")}.ts`,
    }));
    const refusal = WalkUnavailable.make({ message: `${paths.at(-1)!.path}: unreadable source` });
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed(paths),
      read: (file) =>
        file.path === paths.at(-1)!.path
          ? Effect.fail(refusal)
          : Effect.succeed({ ...file, lines: ["export const value = 1;"] }),
    });
    let progress = 0;
    let cleared = 0;
    const status = Layer.succeed(Status, {
      show: () =>
        Effect.sync(() => {
          progress += 1;
        }),
      clear: Effect.sync(() => {
        cleared += 1;
      }),
    });
    const pruned: Array<Live> = [];
    const jev = recordingJev({ judge: { a: 0.1, b: 0.1 }, locate: {} });
    const result = await Effect.runPromise(
      Effect.result(
        Effect.flatMap(planAudit(), (plan) =>
          executeAudit(plan).pipe(Effect.tap(() => pruneCache(plan))),
        ),
      ).pipe(
        Effect.provide(
          Layer.mergeAll(
            walker,
            status,
            jev.layer,
            memoryCache({}, new Map(), pruned),
            testCrypto,
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
          ),
        ),
      ),
    );
    expect(result).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "WalkUnavailable", message: refusal.message },
    });
    expect(progress).toBeGreaterThan(0);
    expect(cleared).toBe(1);
    expect(jev.calls).toEqual({ judge: [], locate: [] });
    expect(pruned).toEqual([]);
  });

  it.each([
    { directive: "adhere-ignore", before: "a", after: "b", cached: true },
    { directive: "adhere-ignore-file", before: "b", after: "a", cached: false },
  ])(
    "refuses changed $directive metadata before requests or cache writes",
    async ({ directive, before, after, cached }) => {
      const cache = memoryCache();
      let current = { ...source, lines: [`// ${directive} ${before} -- before`, ...code1] };
      if (cached) {
        await audit({
          rules,
          files: [{ ...source, lines: ["// before", ...code1] }],
          cache,
          jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } }).layer,
        });
      }
      const walker = Layer.succeed(SourceWalker, {
        files: Effect.succeed([{ path: source.path }]),
        read: () => Effect.sync(() => current),
      });
      const planned = await planOf({ rules, files: [], cache, walker });
      const oldLines = current.lines;
      current = { ...current, lines: [`// ${directive} ${after} -- after`, ...code1] };
      expect(suppressionsOf(current.lines).lines).toEqual(suppressionsOf(oldLines).lines);
      let writes = 0;
      const guardedCache = Layer.effect(AuditCache)(
        Effect.map(AuditCache, (cache) => ({
          ...cache,
          put: () =>
            Effect.sync(() => {
              writes += 1;
            }),
          putTally: () =>
            Effect.sync(() => {
              writes += 1;
            }),
        })),
      ).pipe(Layer.provide(cache));
      const jev = recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: { a: 2 } });
      const result = await Effect.runPromise(
        Effect.result(executeAudit(planned)).pipe(
          Effect.provide(Layer.mergeAll(walker, guardedCache, jev.layer, testCrypto)),
        ),
      );
      expect(result).toMatchObject({
        _tag: "Failure",
        failure: {
          _tag: "WalkUnavailable",
          message: expect.stringContaining(
            `${source.path}: source changed since planning. Rerun adhere lint`,
          ),
        },
      });
      expect(jev.calls).toEqual({ judge: [], locate: [] });
      expect(writes).toBe(0);
      const replanned = await planOf({ rules, files: [], cache, walker });
      expect(replanned.files[0]?.hash).toBe(planned.files[0]?.hash);
      if (cached) expect(replanned.files[0]?.kept.a).toEqual(planned.files[0]?.kept.a);
      else expect(Object.keys(replanned.files[0]!.prepared)).toEqual(["b"]);
    },
  );

  it("accepts reordered ignore rule sets and edited reasons without changing suppression semantics", async () => {
    const cache = memoryCache();
    let current = {
      ...source,
      lines: [
        "// adhere-ignore-file outside-a, outside-b -- before",
        "// adhere-ignore a, outside-c -- before",
        ...code1,
      ],
    };
    await audit({
      rules,
      files: [{ ...source, lines: ["// before", "// before", ...code1] }],
      cache,
      jev: recordingJev({ judge: { a: 0.1, b: 0.9 }, locate: { b: 3 } }).layer,
    });
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed([{ path: source.path }]),
      read: () => Effect.sync(() => current),
    });
    const planned = await planOf({ rules, files: [], cache, walker });
    current = {
      ...current,
      lines: [
        "// adhere-ignore-file outside-b, outside-a -- after",
        "// adhere-ignore outside-c, a -- after",
        ...code1,
      ],
    };
    const jev = recordingJev({ judge: {}, locate: {} });
    const result = await Effect.runPromise(
      executeAudit(planned).pipe(
        Effect.provide(Layer.mergeAll(walker, cache, jev.layer, testCrypto)),
      ),
    );
    expect(result.cached).toBe(1);
    expect(result.findings.map((finding) => finding.rule)).toEqual(["b"]);
    expect(jev.calls).toEqual({ judge: [], locate: [] });
  });

  it.each([false, true])(
    "refuses changed source before execution, including cached excerpts (cached: %s)",
    async (cached) => {
      const cache = memoryCache();
      let current = source;
      if (cached) {
        await audit({
          rules: { a },
          cache,
          jev: recordingJev({ judge: { a: 0.9 }, locate: { a: 2 } }).layer,
        });
      }
      const walker = Layer.succeed(SourceWalker, {
        files: Effect.succeed([{ path: source.path }]),
        read: () => Effect.sync(() => current),
      });
      const planned = await planOf({ rules: { a }, files: [], cache, walker });
      const before = await Effect.runPromise(
        Effect.flatMap(AuditCache, (cache) => cache.get(planned.files[0]!.hash, source.path)).pipe(
          Effect.provide(cache),
        ),
      );
      current = { ...source, lines: ["export const changed = 2;"] };
      const jev = recordingJev({ judge: { a: 0.9 }, locate: { a: 1 } });
      const result = await Effect.runPromise(
        Effect.result(executeAudit(planned)).pipe(
          Effect.provide(Layer.mergeAll(walker, cache, jev.layer, testCrypto)),
        ),
      );
      expect(result).toMatchObject({
        _tag: "Failure",
        failure: {
          _tag: "WalkUnavailable",
          message: expect.stringContaining(
            `${source.path}: source changed since planning. Rerun adhere lint`,
          ),
        },
      });
      expect(jev.calls).toEqual({ judge: [], locate: [] });
      const after = await Effect.runPromise(
        Effect.flatMap(AuditCache, (cache) => cache.get(planned.files[0]!.hash, source.path)).pipe(
          Effect.provide(cache),
        ),
      );
      expect(after).toEqual(before);
    },
  );

  it("reloads cached report excerpts while accepting comment-only changes to the same normalized hash", async () => {
    const cache = memoryCache();
    let current = { ...source, lines: ["// before", ...source.lines] };
    await audit({
      rules: { a },
      files: [current],
      cache,
      jev: recordingJev({ judge: { a: 0.9 }, locate: { a: 3 } }).layer,
    });
    let reads = 0;
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed([{ path: source.path }]),
      read: () =>
        Effect.sync(() => {
          reads += 1;
          return current;
        }),
    });
    const planned = await planOf({ rules: { a }, files: [], cache, walker });
    expect(reads).toBe(1);
    current = { ...source, lines: ["// after", ...source.lines] };
    const jev = recordingJev({ judge: {}, locate: {} });
    const result = await Effect.runPromise(
      executeAudit(planned).pipe(
        Effect.provide(Layer.mergeAll(walker, cache, jev.layer, testCrypto)),
      ),
    );
    expect(reads).toBe(2);
    expect(result.cached).toBe(1);
    expect(result.findings[0]?.excerpt.lines).toEqual(current.lines);
    expect(jev.calls).toEqual({ judge: [], locate: [] });
  });

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

  it.each(["preset", "full tally", "already tallied"] as const)(
    "estimates judging and cached locating in one source pass without sample additions (%s)",
    async (sampling) => {
      const imported = {
        ...source,
        lines: [...source.lines, 'import type { Order } from "@repo/orders/core";'],
      };
      const files = [imported, other];
      const workspacePackages = { "@repo/orders": "packages/orders", unused: "x".repeat(110_000) };
      const tallies = new Map<string, Tally>();
      if (sampling !== "preset") {
        const paths =
          sampling === "full tally"
            ? Array.from({ length: SAMPLE }, (_, index) => `/repo/previous${index}.ts`)
            : files.map((file) => file.path);
        for (const rule of Object.values(rules)) {
          const key = await Effect.runPromise(
            tallyKeyOf("jev-latest", rule).pipe(Effect.provide(testCrypto)),
          );
          tallies.set(key, { files: Object.fromEntries(paths.map((path) => [path, 0.9])) });
        }
      }
      const cache = memoryCache({}, tallies);
      await audit({
        rules: { a },
        files: [imported],
        cache,
        jev: recordingJev({ judge: { a: 0.9 }, locate: {} }).layer,
      });
      const reads: Array<string> = [];
      const walker = Layer.succeed(SourceWalker, {
        files: Effect.succeed(files.map(({ path }) => ({ path }))),
        read: ({ path }) =>
          Effect.sync(() => {
            reads.push(path);
            return files.find((file) => file.path === path)!;
          }),
      });
      const planned = await planOf({
        rules,
        files,
        cache,
        walker,
        reads: ["workspacePackages"],
        workspacePackages,
        ...(sampling === "preset"
          ? {
              scopedRules: Object.entries(rules).map(([id, rule]) => ({
                id,
                rule,
                scope: "/repo",
                preset: "example",
              })),
            }
          : {}),
      });
      expect(reads.toSorted()).toEqual(files.map((file) => file.path).toSorted());
      expect(planned.files.every((file) => Record.isEmptyRecord(file.sampled))).toBe(true);
      const loads = planned.files.map((plan) =>
        judgeLoad(
          files.find((file) => file.path === plan.file.path)!.lines,
          Record.map(plan.pending, ({ rule }) => rule),
          [],
          plan.readState,
        ),
      );
      expect(planned.requests).toBe(loads.reduce((sum, load) => sum + load.requests, 0));
      expect(planned.tokens).toBe(loads.reduce((sum, load) => sum + load.tokens, 0));
      expect(planned.skipped).toBe(0);
      const importedPlan = planned.files.find((plan) => plan.file.path === imported.path)!;
      expect(importedPlan.readState).toEqual({
        workspacePackages: { "@repo/orders": "packages/orders" },
      });
      expect(planned.files.find((plan) => plan.file.path === other.path)?.readState).toEqual({
        workspacePackages: {},
      });
      expect(planned.cachedLocateRequests).toBe(
        locateRequests(imported.lines, { a }, importedPlan.readState),
      );
    },
  );

  it.each(["code", "ignore directives"])(
    "revalidates %s changes when sampled estimates need a reread",
    async (change) => {
      const original = { ...source, lines: ["// adhere-ignore b", ...code1] };
      let reads = 0;
      const walker = Layer.succeed(SourceWalker, {
        files: Effect.succeed([{ path: source.path }]),
        read: () =>
          Effect.sync(() => {
            reads += 1;
            return reads === 1
              ? original
              : {
                  ...original,
                  lines:
                    change === "code"
                      ? ["// adhere-ignore b", "export const changed = 2;"]
                      : ["// adhere-ignore a", ...code1],
                };
          }),
      });
      await expect(
        planOf({ rules: { a }, files: [], cache: memoryCache(), walker }),
      ).rejects.toThrow(`${source.path}: source changed since planning. Rerun adhere lint`);
      expect(reads).toBe(2);
    },
  );

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
      model: "jev-latest",
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
      threshold: 0.7,
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
              typeAware: false,
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
              maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
              reads: [],
              rules,
            }),
            fixtureWalker([source, other]),
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
      ).pipe(
        Effect.provide(Layer.mergeAll(jev, cache, fixtureWalker([source, other]), testCrypto)),
      ),
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

  const summary = (
    fields: Omit<
      AuditPlan,
      "files" | "tokens" | "unjudged" | "threshold" | "sufficiencyThreshold" | "model"
    > & {
      readonly tokens?: number;
    },
    files = 200,
  ): AuditPlan => {
    const prepared: FilePlan["prepared"] = Object.fromEntries(
      Array.from({ length: fields.rules }, (_, index) => [
        `rule${index}`,
        {
          rule: { ...a, description: `Summary rule ${index}.` },
          fingerprint: `rule${index}`,
          threshold: 0.7,
        },
      ]),
    );
    const cachedFiles = fields.cached / fields.rules;
    return {
      files: Array.from({ length: files }, (_, index): FilePlan => {
        const cached = index < cachedFiles;
        const skipped = index >= files - fields.skipped;
        const deferred = !skipped && index >= files - fields.skipped - fields.deferred;
        return {
          file: { path: `/repo/${String(index).padStart(3, "0")}.ts` },
          skipped,
          hash: "",
          readState: {},
          prepared,
          kept: cached
            ? Record.map(prepared, ({ fingerprint }) => ({ fingerprint, probability: 0.2 }))
            : {},
          pending: cached || skipped || deferred ? {} : prepared,
          deferred,
          sampled: {},
          suppressions: NO_SUPPRESSIONS,
        };
      }),
      unjudged: [],
      tokens: 0,
      model: "jev-latest",
      threshold: 0.7,
      sufficiencyThreshold: 0.7,
      ...fields,
    };
  };

  it("selects whole pending rule maps for --limit files in path order, without charging cached files", async () => {
    const manyRules: Rules = {
      ...rules,
      names: { description: "Constants must be named.", must: "const named = 1;" },
      numbers: { description: "Numbers must be branded.", must: "const count = Count.make(1);" },
    };
    const cache = memoryCache();
    const one = await planOf({ rules: manyRules, files: [source, other], cache, limit: 1 });
    expect(one.files.map((plan) => [Object.keys(plan.pending), plan.deferred])).toEqual([
      [Object.keys(manyRules), false],
      [[], true],
    ]);
    expect(one).toMatchObject({ checks: 8, cached: 0, deferred: 1, requests: 1 });
    const answers = { judge: { ...Record.map(manyRules, () => 0.2), a: 0.9 }, locate: { a: 1 } };
    const jev = recordingJev(answers);
    const result = await Effect.runPromise(
      executeAudit(one).pipe(
        Effect.provide(
          Layer.mergeAll(jev.layer, cache, fixtureWalker([source, other]), testCrypto),
        ),
      ),
    );
    expect(jev.calls.judge).toEqual([manyRules]);
    expect({ judged: result.judged, waiting: result.waiting }).toEqual({ judged: 1, waiting: 1 });

    // The cached, located first file reports its finding without taking the next run's slot.
    const next = recordingJev(answers);
    const nextPlan = await planOf({ rules: manyRules, files: [source, other], cache, limit: 1 });
    expect(nextPlan.files.map((plan) => [Object.keys(plan.pending), plan.deferred])).toEqual([
      [[], false],
      [Object.keys(manyRules), false],
    ]);
    const again = await Effect.runPromise(
      executeAudit(nextPlan).pipe(
        Effect.provide(
          Layer.mergeAll(next.layer, cache, fixtureWalker([source, other]), testCrypto),
        ),
      ),
    );
    expect(next.calls.judge).toEqual([manyRules]);
    expect(again).toMatchObject({ judged: 1, cached: 1, waiting: 0 });
    expect(
      again.findings.some((finding) => finding.file === other.path && finding.rule === "a"),
    ).toBe(true);
  });

  it("budgets only selected files, leaving later overflow and cached locating unbudgeted", async () => {
    const cache = memoryCache();
    const first = { ...other, path: "/repo/src/a-first.ts" };
    const cached = { ...source, path: "/repo/src/b-cached.ts" };
    await audit({
      rules,
      files: [cached],
      cache,
      jev: recordingJev({ judge: { a: 0.9, b: 0.2 }, locate: {} }).layer,
    });
    const generated: ScannedFile = {
      path: "/repo/src/z-generated.ts",
      lines: ["x".repeat(110_000)],
    };
    expect(fits(generated.lines, rules)).toBe(false);
    const planned = await planOf({
      rules,
      typeAware: true,
      reads: DEFAULT_READS,
      files: [generated, cached, first],
      cache,
      limit: 1,
    });
    expect(
      planned.files.map((plan) => ({
        path: plan.file.path,
        pending: Object.keys(plan.pending),
        deferred: plan.deferred,
        skipped: plan.skipped,
      })),
    ).toEqual([
      { path: first.path, pending: ["a", "b"], deferred: false, skipped: false },
      { path: cached.path, pending: [], deferred: true, skipped: false },
      { path: generated.path, pending: [], deferred: true, skipped: false },
    ]);
    expect(planned).toMatchObject({
      rules: 2,
      checks: 6,
      cached: 2,
      skipped: 0,
      deferred: 2,
      requests: 1,
    });
    expect(planned.cachedLocateRequests ?? 0).toBe(0);
  });

  it("refills the limit in path order after selected work fails the cheap budget", async () => {
    const generated: ScannedFile = {
      path: "/repo/src/a-generated.ts",
      lines: ["x".repeat(110_000)],
    };
    const first = { ...other, path: "/repo/src/b-first.ts" };
    const last = { ...source, path: "/repo/src/c-last.ts" };
    const planned = await planOf({
      rules,
      files: [last, generated, first],
      cache: memoryCache(),
      limit: 1,
    });
    expect(
      planned.files.map((plan) => ({
        path: plan.file.path,
        pending: Object.keys(plan.pending),
        deferred: plan.deferred,
        skipped: plan.skipped,
      })),
    ).toEqual([
      { path: generated.path, pending: [], deferred: false, skipped: true },
      { path: first.path, pending: ["a", "b"], deferred: false, skipped: false },
      { path: last.path, pending: [], deferred: true, skipped: false },
    ]);
    expect(planned).toMatchObject({
      rules: 2,
      checks: 4,
      cached: 0,
      skipped: 1,
      deferred: 1,
      requests: 1,
    });
  });

  it("describes diagnostic checks and selected, cached, skipped, and deferred files", () => {
    const partly = summary({
      rules: 14,
      checks: 2758,
      cached: 1400,
      skipped: 3,
      deferred: 0,
      requests: 197,
    });
    expect(describePlan(partly)).toEqual([
      "200 files and 14 rules: 2758 checks, 1400 cached, 3 files too long to judge.",
      "Judging 97 files takes 197 requests to Jev, plus 1 or more for each file with a finding.",
    ]);
    expect(sendQuestion(partly)).toBe("Send 197 requests to Jev?");
    expect(describePlan({ ...partly, provider: "clef-flash" })[1]).toBe(
      "Judging 97 files takes 197 requests to clef-flash, plus 1 or more for each file with a finding.",
    );
    expect(sendQuestion({ ...partly, provider: "clef-flash" })).toBe(
      "Send 197 requests to clef-flash?",
    );
    expect(
      describePlan(
        summary({ rules: 1, checks: 1, cached: 0, skipped: 0, deferred: 0, requests: 1 }, 1),
      ),
    ).toEqual([
      "1 file and 1 rule: 1 check.",
      "Judging 1 file takes 1 request to Jev, plus 1 or more for each file with a finding.",
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
      deferred: 64,
      requests: 42,
    });
    expect(describePlan(limited, { filter: ["src/**"], rpm: 30 })).toEqual([
      "200 files matching the filter and 14 rules: 2800 checks, 1400 cached.",
      "Judging 36 files takes 42 requests to Jev, plus 1 or more for each file with a finding. At 30 a minute, they take about 1 minute. 64 files wait for a later run.",
    ]);
    expect(
      describePlan(
        summary({ rules: 2, checks: 4, cached: 0, skipped: 0, deferred: 2, requests: 0 }, 2),
      )[1],
    ).toBe("The limit leaves all 2 files needing requests for a later run.");
    expect(
      describePlan(
        summary({ rules: 1, checks: 1, cached: 0, skipped: 0, deferred: 1, requests: 0 }, 1),
      )[1],
    ).toBe("The limit leaves 1 file needing requests for a later run.");
    const one = summary(
      { rules: 1, checks: 4, cached: 0, skipped: 0, deferred: 1, requests: 3 },
      4,
    );
    expect(describePlan(one)[1]).toBe(
      "Judging 3 files takes 3 requests to Jev, plus 1 or more for each file with a finding. 1 file waits for a later run.",
    );
    expect(progressLine({ files: 37, requests: 41, findings: 1 }, partly)).toBe(
      "37/200 files, 41 requests sent, 1 finding",
    );
  });

  it("describes a plan-only limit in files without prompting to send requests", () => {
    const plan = summary(
      {
        rules: 2,
        checks: 4,
        cached: 0,
        skipped: 0,
        deferred: 2,
        requests: 0,
        planOnly: true,
      },
      2,
    );
    expect(describePlan(plan)).toEqual([
      "2 files and 2 rules: 4 checks.",
      "Plan only (--limit 0): no native reads will be resolved and no requests will be sent.",
      "2 files left for a later run.",
    ]);
    expect(sendQuestion(plan)).toBe(
      "Plan only (--limit 0): no native reads will be resolved and no requests will be sent.",
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

  it("labels native-read plan costs and prompts as base estimates that exclude execution-time native context", () => {
    const plan = summary(
      {
        rules: 2,
        checks: 4,
        cached: 0,
        skipped: 0,
        deferred: 0,
        requests: 2,
        tokens: 41_234,
        price: 0.042,
        nativeReads: {
          symbols: true,
          references: true,
          includeComments: false,
          maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
          maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
        },
      },
      2,
    );
    const description = describePlan(plan).join("\n");
    expect(description).toContain("41,000");
    expect(description).toMatch(/native|symbols?|references?/i);
    expect(description).toMatch(/base|estim|exclud|not includ/i);
    const prompt = sendQuestion(plan);
    expect(prompt).toMatch(/native|symbols?|references?/i);
    expect(prompt).toMatch(/base|estim|extra|additional|increas|exclud/i);
    const { price: _price, ...unpricedPlan } = plan;
    const unpriced = describePlan(unpricedPlan).join("\n");
    expect(unpriced).toMatch(/native|symbols?|references?/i);
    expect(unpriced).not.toContain("$");
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
              typeAware: false,
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
              maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
              reads: [],
              rules,
              scopedRules,
            }),
            fixtureWalker([source]),
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
        const lines = [source, other].find((file) => file.path === plan.file.path)!.lines;
        return sum + judgeLoad(lines, pending, ids, plan.readState).tokens;
      }, 0);
    expect({ tokens: planned.tokens, price: planned.price }).toEqual({
      tokens: load(true),
      price: 0.042,
    });
    expect(planned.tokens).toBeGreaterThan(load(false));
  });
});
