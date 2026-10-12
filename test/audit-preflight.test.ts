import {
  planOf,
  a,
  b,
  rules,
  testCrypto,
  memoryCache,
  recordingJev,
  fixtureWalker,
} from "./audit.fixtures.ts";

import { Effect, Layer, Logger, Record, References } from "effect";
import { type SystemOneRequest } from "../src/providers/systemOne.ts";
import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_READS,
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
} from "../src/config.ts";
import { type ScannedFile } from "../src/models/Audit.ts";
import { type RuleEntry, type RuleSet } from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { AuditCache, type Tally } from "../src/services/AuditCache.ts";
import { SourceReads } from "../src/services/SourceReads.ts";
import {
  fits,
  Jev,
  judgeBody,
  judgeLoad,
  linterKey,
  linterQuestion,
  locateBody,
} from "../src/services/Jev.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
import {
  formatLinterCheck,
  SAMPLE,
  type Tallied,
  talliedOf,
  tallyKeyOf,
  tallyProjectRules,
} from "../src/mechanical.ts";
import { type AuditPlan, executeAudit, planAudit } from "../src/workflows/audit.ts";

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

  it("keeps exact split and token estimates while rereading only files that gain sample questions", async () => {
    const largeRules = {
      ports: { ...ports, must: "x".repeat(70_000) },
      secrets: { ...b, must: "y".repeat(70_000) },
    };
    const importedFiles = files.map((file, index) => ({
      ...file,
      lines: [
        ...file.lines,
        ...(index % 2 === 0 ? ['import type { Order } from "@repo/orders/types";'] : []),
      ],
    }));
    const workspacePackages = { "@repo/orders": "packages/orders", unused: "x".repeat(110_000) };
    const reads: Array<string> = [];
    const walker = Layer.succeed(SourceWalker, {
      files: Effect.succeed(importedFiles.map(({ path }) => ({ path }))),
      read: ({ path }) =>
        Effect.sync(() => {
          reads.push(path);
          return importedFiles.find((file) => file.path === path)!;
        }),
    });
    const planned = await planOf({
      rules: largeRules,
      files: importedFiles,
      cache: memoryCache(),
      walker,
      reads: ["workspacePackages"],
      workspacePackages,
    });
    const samples = new Set(sampledPaths(planned));
    expect(samples.size).toBe(SAMPLE);
    expect(reads).toHaveLength(importedFiles.length + samples.size);
    for (const file of importedFiles) {
      expect(reads.filter((path) => path === file.path)).toHaveLength(
        samples.has(file.path) ? 2 : 1,
      );
    }
    const loads = planned.files.map((plan) =>
      judgeLoad(
        importedFiles.find((file) => file.path === plan.file.path)!.lines,
        Record.map(plan.pending, ({ rule }) => rule),
        Object.keys(plan.sampled),
        plan.readState,
      ),
    );
    expect(planned.requests).toBe(loads.reduce((sum, load) => sum + load.requests, 0));
    expect(planned.tokens).toBe(loads.reduce((sum, load) => sum + load.tokens, 0));
    expect(planned.requests).toBeGreaterThan(
      importedFiles.reduce((sum, file) => sum + judgeLoad(file.lines, largeRules).requests, 0),
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
                typeAware: false,
                model: "jev-latest",
                threshold: 0.7,
                sufficiencyThreshold: 0.7,
                maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
                maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
                reads: [],
                rules: { ports, logs },
                scopedRules,
              }),
              fixtureWalker(files),
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

    await Effect.runPromise(
      executeAudit(planned).pipe(
        Effect.provide(Layer.mergeAll(jev, cache, fixtureWalker(files), testCrypto)),
      ),
    );

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

describe("oversized preflight payload logging", () => {
  // Restore JSON escapes only inside string tokens, leaving layout and source backslashes intact.
  const jsonFromDiagnostic = (text: string): string =>
    text.replace(/"(?:\\[\s\S]|[^"\\])*"/g, (token) =>
      token.replace(/\n/g, "\\n").replace(/\t/g, "\\t"),
    );

  const expectPayload = (
    messages: ReadonlyArray<unknown>,
    label: string,
    payload: { judge: SystemOneRequest; locate: SystemOneRequest },
    minimum: "All" | "Trace" | "Debug",
  ) => {
    const oversized = messages.filter((message) =>
      String(message).includes("too long preflight payload"),
    );
    if (minimum === "Debug") {
      expect(oversized).toEqual([]);
      return;
    }
    expect(oversized).toHaveLength(1);
    expect(String(oversized[0]).startsWith(`${label}\n`)).toBe(true);
    const text = String(oversized[0]).slice(label.length + 1);
    expect(text).toContain("\n\t");
    expect(text).toContain(String.raw`\\n\\t`);
    expect(text).not.toContain(String.raw`\n\tconst escaped`);
    const json = jsonFromDiagnostic(text);
    const logged = JSON.parse(json) as typeof payload;
    expect(logged.judge).toEqual(payload.judge);
    expect(logged.locate.model).toBe(payload.locate.model);
    expect(logged.locate.state).toEqual(payload.locate.state);
    if (minimum === "Trace") {
      expect(Object.keys(logged.judge.state)[0]).toBe("code");
      expect(Object.keys(logged.locate.state)[0]).toBe("code");
    }
    expect(Object.keys(logged.locate.questions)).toEqual(Object.keys(payload.locate.questions));
    const lineQuestions = Object.entries(payload.locate.questions).filter(([id]) =>
      /^(start|end):/.test(id),
    );
    expect(lineQuestions.length).toBeGreaterThan(0);
    for (const [id, question] of Object.entries(payload.locate.questions)) {
      if (minimum === "Trace" && question.type === "choice" && /^(start|end):/.test(id)) {
        const { criteria, ...withoutCriteria } = question;
        expect(Object.keys(criteria).length).toBeGreaterThan(0);
        expect(logged.locate.questions[id]).not.toHaveProperty("criteria");
        expect(logged.locate.questions[id]).toEqual(withoutCriteria);
      } else {
        expect(logged.locate.questions[id]).toEqual(question);
      }
    }
    if (minimum === "All") {
      expect(json).toBe(JSON.stringify(payload, null, 2));
      expect(logged).toEqual(payload);
    }
  };

  it.each(["All", "Trace", "Debug"] as const)(
    "logs planning payloads with line criteria only at All (minimum: %s)",
    async (minimum) => {
      const lines = [
        'import { orders } from "orders-core";',
        '\tconst escaped = "\\n\\t";',
        "export const generated = [",
        `  "${"source".repeat(20_000)}",`,
        "];",
      ];
      const workspacePackages = { "orders-core": "packages/orders" };
      const cheapState = { workspacePackages };
      const generated = { path: "/repo/generated.ts", lines };
      const logs: Array<Logger.Options<unknown>> = [];
      const cache = memoryCache();
      const jev = recordingJev({ judge: {}, locate: {} });
      const { plan, result } = await Effect.runPromise(
        Effect.gen(function* () {
          const plan = yield* planAudit();
          return { plan, result: yield* executeAudit(plan) };
        }).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(AdhereConfig, {
                typeAware: false,
                model: "jev-latest",
                threshold: 0.7,
                sufficiencyThreshold: 0.7,
                maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
                maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
                reads: ["workspacePackages"],
                workspacePackages,
                rules,
              }),
              fixtureWalker([generated]),
              cache,
              testCrypto,
              jev.layer,
              Logger.layer([Logger.make((entry) => logs.push(entry))]),
            ),
          ),
          Effect.provideService(References.MinimumLogLevel, minimum),
        ),
      );
      expect(plan.model).toBe("jev-latest");
      expect(plan.skipped).toBe(1);
      expect(plan.requests).toBe(0);
      expect(result).toMatchObject({ skipped: 1, judged: 0, findings: [] });
      expect(jev.calls).toEqual({ judge: [], locate: [] });
      const payload = {
        judge: judgeBody("jev-latest", lines, rules, [], cheapState),
        locate: locateBody("jev-latest", lines, rules, cheapState) as SystemOneRequest,
      };
      const messages = logs.flatMap(({ message }) =>
        Array.isArray(message) ? message : [message],
      );
      expectPayload(
        messages,
        `${generated.path}: too long preflight payload (planning)`,
        payload,
        minimum,
      );
      expect(Object.values(payload.judge.state.code).join("\n")).toBe(lines.join("\n"));
      expect(payload.judge.questions.a?.criteria).toBeDefined();
      expect(plan.files[0]?.readState).toEqual(cheapState);
      if (minimum === "Debug") expect(JSON.stringify(messages)).not.toContain("source".repeat(100));
    },
  );

  it.each(["All", "Trace", "Debug"] as const)(
    "logs full execution context with line criteria only at All (minimum: %s)",
    async (minimum) => {
      const lines = [
        'import { orders } from "orders-core";',
        ...Array.from({ length: 32 }, (_, index) => `  const port${index} = 3000;`),
      ];
      const file = { path: "/repo/server.ts", lines };
      const workspacePackages = { "orders-core": "packages/orders" };
      const symbols = { orders: "const orders: Order[]", oversized: "symbol".repeat(20_000) };
      const caller = `export function caller() {\n\tconst escaped = "\\n\\t";\n\treturn "${"context".repeat(20_000)}";\n}`;
      const references = { "port:caller.ts": caller };
      const readState = { workspacePackages, symbols, references };
      const originalState = JSON.stringify(readState);
      const sourceReads = Layer.succeed(SourceReads, {
        prepare: () => Effect.void,
        read: () => Effect.succeed({ symbols, references }),
      });
      const cache = memoryCache();
      const plan = await planOf({
        rules,
        files: [file],
        cache,
        typeAware: true,
        reads: DEFAULT_READS,
        workspacePackages,
      });
      expect(plan.skipped).toBe(0);
      const jev = recordingJev({ judge: {}, locate: {} });
      const logs: Array<Logger.Options<unknown>> = [];
      const result = await Effect.runPromise(
        executeAudit(plan).pipe(
          Effect.provide(
            Layer.mergeAll(
              cache,
              testCrypto,
              fixtureWalker([file]),
              sourceReads,
              jev.layer,
              Logger.layer([Logger.make((entry) => logs.push(entry))]),
            ),
          ),
          Effect.provideService(References.MinimumLogLevel, minimum),
        ),
      );
      expect(result).toMatchObject({ skipped: 0, judged: 1, findings: [] });
      expect(jev.calls.judge).toHaveLength(1);
      expect(jev.calls.locate).toHaveLength(0);
      expect(jev.states.judge).toEqual([{ workspacePackages, symbols }]);
      expect(fits(lines, rules, { workspacePackages, symbols })).toBe(false);
      const payload = {
        judge: judgeBody(plan.model, lines, rules, [], readState),
        locate: locateBody(plan.model, lines, rules, readState) as SystemOneRequest,
      };
      const messages = logs.flatMap(({ message }) =>
        Array.isArray(message) ? message : [message],
      );
      expectPayload(
        messages,
        `${file.path}: too long preflight payload (full context)`,
        payload,
        minimum,
      );
      expect(payload.judge.state).toMatchObject(readState);
      expect(Object.values(payload.judge.state.code).join("\n")).toBe(lines.join("\n"));
      expect(payload.locate.questions.a?.type).toBe("choice");
      expect(JSON.stringify(readState)).toBe(originalState);
      if (minimum === "Debug")
        expect(JSON.stringify(messages)).not.toContain("context".repeat(100));
      expect(messages.some((message) => String(message).includes("full context too long"))).toBe(
        true,
      );
    },
  );
});
