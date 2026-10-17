import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Crypto, Effect, Layer, Path, Record } from "effect";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";

import {
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
  AdhereConfig as AdhereConfigSchema,
  decodeConfig,
  type ReadState,
  type ResolvedConfig,
} from "../src/config.ts";
import { type Range, sectionsOf } from "../src/excerpt.ts";
import { type ScannedFile } from "../src/models/Audit.ts";
import type { RuleSet } from "../src/rules.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { type Answers, AuditCache, type Live, type Tally } from "../src/services/AuditCache.ts";
import { SourceReads } from "../src/services/SourceReads.ts";
import { Jev, type Rules } from "../src/services/Jev.ts";
import { SourceWalker } from "../src/services/SourceWalker.ts";
import { runAudit, planAudit } from "../src/workflows/audit.ts";

export const a = {
  description: "Ports are branded.",
  must: '\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type\n',
};
export const b = {
  description: "Secrets are redacted.",
  must: 'const key = yield* Config.redacted("API_KEY")',
};
export const rules: Rules = { a, b };
export const code1 = ["const port = 3000;"];

/** Echoes the input as its digest, so equal text still shares a cache key. */
export const testCrypto = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) => new Uint8Array(size),
    digest: (_algorithm, data) => Effect.succeed(data),
  }),
);

/** Answers by content hash, as the cache keeps them; `pruned` holds what each prune was told is live. */
export const memoryCache = (
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
export const lineAt = (line: number): Range => ({ first: line, last: line });

/** The section of `lines` that holds `line`, as Jev's locate answer names it. */
export const sectionAt = (lines: ReadonlyArray<string>, line: number): Range =>
  sectionsOf(lines).find((section) => section.first <= line && line <= section.last) ?? {
    first: line,
    last: line,
  };

/** Jev's locate answer for a finding on `line`: its section, and the line, in a file that shows enough. */
export const placedAt = (lines: ReadonlyArray<string>, line: number) => ({
  section: sectionAt(lines, line),
  sufficiency: 0.9,
  lines: { first: line, last: line },
});

/** Jev that answers from tables, as `recordingJev` does, and keeps the code of every request. */
export const sendingJev = (answers: {
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

export const recordingJev = (answers: {
  readonly judge: Record<string, number>;
  readonly locate: Record<string, number>;
}) => {
  const calls = { judge: [] as Array<Rules>, locate: [] as Array<Rules> };
  const states = { judge: [] as Array<ReadState>, locate: [] as Array<ReadState> };
  const asked = (table: Record<string, number>, rules: Rules) =>
    Record.filter(table, (_, id) => rules[id] !== undefined);
  const layer = Layer.succeed(Jev, {
    judge: (_lines, rules, _sampled, _file, readState = {}) =>
      Effect.sync(() => {
        calls.judge.push(rules);
        states.judge.push(readState);
        return { probabilities: asked(answers.judge, rules), linter: {} };
      }),
    locate: (lines, rules, _file, readState = {}) =>
      Effect.sync(() => {
        calls.locate.push(rules);
        states.locate.push(readState);
        return Record.map(asked(answers.locate, rules), (line) => placedAt(lines, line));
      }),
    conflicts: () => Effect.die("an audit compares no rules"),
    contradicts: () => Effect.die("an audit compares no rules"),
  });
  return { calls, states, layer };
};

export const source: ScannedFile = {
  path: "/repo/src/server.ts",
  lines: [
    "const before = 1;",
    "  const port: number = Number(process.env.PORT);",
    "const after = 2;",
  ],
};

export const fixtureWalker = (files: ReadonlyArray<ScannedFile>) =>
  Layer.succeed(SourceWalker, {
    files: Effect.succeed(
      files.map(({ path, test }) => ({ path, ...(test === undefined ? {} : { test }) })),
    ),
    read: ({ path }) =>
      Effect.suspend(() => {
        const file = files.find((file) => file.path === path);
        return file === undefined
          ? Effect.die(`Missing source fixture: ${path}`)
          : Effect.succeed(file);
      }),
  });

/** Native reads that find nothing: for a run that must share the read settings, and so the cache, of another. */
export const emptySourceReads = Layer.succeed(SourceReads, {
  prepare: () => Effect.void,
  read: () => Effect.succeed({}),
});

export const audit = (options: {
  readonly rules: Rules;
  readonly model?: string;
  readonly threshold?: number;
  readonly jev: Layer.Layer<Jev>;
  readonly cache: Layer.Layer<AuditCache>;
  readonly files?: ReadonlyArray<ScannedFile>;
  readonly includeComments?: boolean;
  readonly typeAware?: boolean;
  readonly maxSymbolLength?: number;
  readonly reads?: ResolvedConfig["reads"];
  readonly workspacePackages?: Readonly<Record<string, string>>;
  readonly sourceReads?: Layer.Layer<SourceReads>;
}) =>
  Effect.runPromise(
    runAudit.pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AdhereConfig, {
            typeAware: options.typeAware ?? false,
            model: options.model ?? "jev-latest",
            threshold: options.threshold ?? 0.7,
            sufficiencyThreshold: 0.7,
            maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
            maxSymbolLength: options.maxSymbolLength ?? DEFAULT_MAX_SYMBOL_LENGTH,
            reads: options.reads ?? [],
            rules: options.rules,
            ...(options.includeComments === undefined
              ? {}
              : { includeComments: options.includeComments }),
            ...(options.workspacePackages === undefined
              ? {}
              : { workspacePackages: options.workspacePackages }),
          }),
          fixtureWalker(options.files ?? [source]),
          options.jev,
          options.cache,
          testCrypto,
          ...(options.sourceReads === undefined ? [] : [options.sourceReads]),
        ),
      ),
    ),
  );

export const findingA = {
  rule: "a",
  description: a.description,
  examples: { good: { word: "must" as const, code: a.must } },
  file: "/repo/src/server.ts",
  section: { first: 1, last: 3 },
  lines: { first: 2, last: 2 },
  excerpt: { start: 1, lines: source.lines },
  context: 0.9,
  probability: 0.9,
  threshold: 0.7,
  level: "error" as const,
};

export const realFileSystem = Layer.merge(BunFileSystem.layer, Path.layer);

/** Writes each file of `tree` under a new temporary directory, and returns the directory. */
export const onDisk = async (tree: Readonly<Record<string, string>>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "adhere-tree-"));
  for (const [relative, content] of Object.entries(tree)) {
    await mkdir(dirname(join(root, relative)), { recursive: true });
    await writeFile(join(root, relative), content, "utf8");
  }
  return root;
};

export const loaded = (config: typeof AdhereConfigSchema.Encoded, rules: Rules = {}) =>
  Effect.map(decodeConfig(config), (decoded) => ({ ...decoded, rules }));

export const planOf = (options: {
  readonly rules: Rules;
  readonly files: ReadonlyArray<ScannedFile>;
  readonly cache: Layer.Layer<AuditCache>;
  readonly limit?: number;
  readonly typeAware?: boolean;
  readonly reads?: ResolvedConfig["reads"];
  readonly maxSymbolDocumentationLength?: number;
  readonly maxSymbolLength?: number;
  readonly includeComments?: boolean;
  readonly workspacePackages?: Readonly<Record<string, string>>;
  readonly workspaceDependents?: ResolvedConfig["workspaceDependents"];
  readonly sourceReads?: Layer.Layer<SourceReads>;
  readonly walker?: Layer.Layer<SourceWalker>;
  readonly scopedRules?: RuleSet;
}) =>
  Effect.runPromise(
    planAudit({ limit: options.limit }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(AdhereConfig, {
            typeAware: options.typeAware ?? false,
            model: "jev-latest",
            threshold: 0.7,
            sufficiencyThreshold: 0.7,
            reads: options.reads ?? [],
            maxSymbolDocumentationLength:
              options.maxSymbolDocumentationLength ?? DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
            maxSymbolLength: options.maxSymbolLength ?? DEFAULT_MAX_SYMBOL_LENGTH,
            rules: options.rules,
            ...(options.scopedRules === undefined ? {} : { scopedRules: options.scopedRules }),
            ...(options.includeComments === undefined
              ? {}
              : { includeComments: options.includeComments }),
            ...(options.workspacePackages === undefined
              ? {}
              : { workspacePackages: options.workspacePackages }),
            ...(options.workspaceDependents === undefined
              ? {}
              : { workspaceDependents: options.workspaceDependents }),
          }),
          options.walker ?? fixtureWalker(options.files),
          options.cache,
          testCrypto,
          ...(options.sourceReads === undefined ? [] : [options.sourceReads]),
        ),
      ),
    ),
  );
