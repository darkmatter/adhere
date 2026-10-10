import { type PresetName, presetNames } from "#presets.ts";
import { type Provider, SAVED_KEYS } from "#providers/provider.ts";
import type { RuleSet } from "#rules.ts";
import { Effect, Predicate, Schema, SchemaTransformation } from "effect";

export type RuleId = string;

/** The state a request to Jev carries: the file's code as numbered sections, which every question reads. */
export interface JevState {
  readonly code: Readonly<Record<string, string>>;
}

/** The file a request is about, as a rule's hook gets it: its absolute path, and its text as written. */
export interface JudgedFile {
  readonly path: string;
  readonly contents: string;
}

/**
 * A config's provider, as `Provider` in `providers/provider.ts` describes it:
 * a model, and how to ask it. Checked rather than copied, so a class keeps
 * what its `ask` reads off `this`.
 */
const ProviderSchema = Schema.declare(
  (value: unknown): value is Provider =>
    Predicate.hasProperty(value, "model") &&
    Predicate.isString(value.model) &&
    Predicate.hasProperty(value, "ask") &&
    Predicate.isFunction(value.ask) &&
    (!Predicate.hasProperty(value, "savedKey") || SAVED_KEYS.some((key) => key === value.savedKey)),
  { expected: "a provider: a model, and a function to ask it" },
);

/**
 * Bun's API, typed when the project has Bun's types. Read off `globalThis`,
 * so this package's source type-checks in a project without them.
 */
type BunApi = typeof globalThis extends { Bun: infer B } ? B : unknown;

/**
 * A rule's hook on what Jev reads for it, run right before each request for
 * the rule goes out: what it returns is spread over the request's state.
 * Nothing it returns is checked, so it can replace `code` itself.
 */
export type AppendState = (
  state: JevState,
  file: JudgedFile,
  bun: BunApi,
) => Readonly<Record<string, unknown>> | Promise<Readonly<Record<string, unknown>>>;

/**
 * What a rule can have Jev read beside the code, each by the name of the key
 * the state carries it under, which the rule's description can name in
 * backticks. `workspacePackages` is the workspace's packages: each one's name
 * with its directory, so a rule can tell an import of the repository's own
 * package from an installed one's.
 */
export const Reads = Schema.Array(Schema.Literals(["workspacePackages"]));

/**
 * A rule's examples, named in RFC 2119's words, which Jev reads as written. A
 * requirement shows code that `must` be written and code that must `never`
 * be. A guideline, which asks for less, shows code that `should` be written
 * and code that `shouldNot` be.
 */
const RuleFields = Schema.Struct({
  description: Schema.String,
  /**
   * What the description leaves out, such as why the rule holds or where it
   * does not: in a `RULE.md`, the prose around its code. Jev reads it after
   * the description, as part of the rule; the report shows the description
   * alone.
   */
  details: Schema.optionalKey(Schema.String),
  must: Schema.optionalKey(Schema.String),
  never: Schema.optionalKey(Schema.String),
  should: Schema.optionalKey(Schema.String),
  shouldNot: Schema.optionalKey(Schema.String),
  threshold: Schema.optionalKey(Schema.Finite),
  /**
   * Test files, which a rule skips by default: `only` for a rule about tests,
   * which judges nothing else, and `include` for one that holds in tests too.
   */
  tests: Schema.optionalKey(Schema.Literals(["only", "include"])),
  /**
   * How a finding under the rule is reported: an `error`, the default, which
   * fails the run, or a `warning`, for a nit or a rule that errs toward false
   * findings, which does not.
   */
  level: Schema.optionalKey(Schema.Literals(["error", "warning"])),
  /**
   * Where the rule applies, each a description of code that breaks it: Jev is
   * asked of each whether any code that breaks the rule is as it describes,
   * and a finding stands only when it says yes to every one.
   */
  appliesTo: Schema.optionalKey(Schema.Array(Schema.String)),
  /**
   * Where the rule does not apply: Jev is asked of each whether all the code
   * that breaks the rule is as it describes, and a yes to any drops the finding.
   */
  excludeIf: Schema.optionalKey(Schema.Array(Schema.String)),
  /**
   * What Jev reads for the rule beside the code, by name (see `Reads`). The
   * rule's questions go in requests of their own, so only they read it, and
   * a change to what is read judges the rule again.
   */
  reads: Schema.optionalKey(Reads),
  /**
   * A hook on the state Jev reads for the rule, in a rule written in
   * TypeScript (see `AppendState`). The rule's questions go in requests of
   * their own, so only they read what it adds.
   */
  appendState: Schema.optionalKey(
    Schema.declare((value: unknown): value is AppendState => typeof value === "function", {
      expected: "a function",
    }),
  ),
});

/** Before 0.7, a rule's examples were `reference` and `avoid`: read as `must` and `never`. */
export const Rule = Schema.Struct({
  ...RuleFields.fields,
  reference: Schema.optionalKey(Schema.String),
  avoid: Schema.optionalKey(Schema.String),
})
  .pipe(
    Schema.decodeTo(
      RuleFields,
      SchemaTransformation.transform({
        decode: ({ reference, avoid, ...rule }) => ({
          ...rule,
          ...(rule.must === undefined && reference !== undefined ? { must: reference } : {}),
          ...(rule.never === undefined && avoid !== undefined ? { never: avoid } : {}),
        }),
        encode: (rule) => rule,
      }),
    ),
  )
  .check(
    Schema.makeFilter((rule) => {
      const requirement = rule.must !== undefined || rule.never !== undefined;
      const guideline = rule.should !== undefined || rule.shouldNot !== undefined;
      return requirement && guideline
        ? "a rule is a requirement (must, never) or a guideline (should, shouldNot), not both"
        : requirement || guideline
          ? undefined
          : "a rule needs an example: must, never, should, or shouldNot";
    }),
  );
export interface Rule extends Schema.Schema.Type<typeof Rule> {}

/** How a finding is reported: an error fails the run, a warning does not. */
export type Level = NonNullable<Rule["level"]>;

/** One of a rule's examples, under the word it is written with. */
export interface Example {
  readonly word: "must" | "never" | "should" | "should not";
  readonly code: string;
}

/** A rule's code to write and code not to write, each when the rule has it. */
export interface Examples {
  readonly good?: Example;
  readonly bad?: Example;
}

/** A guideline's examples are `should` and `should not`; any other rule's, `must` and `never`. */
export const examplesOf = (rule: Rule): Examples => {
  const guideline = rule.should !== undefined || rule.shouldNot !== undefined;
  const good = guideline ? rule.should : rule.must;
  const bad = guideline ? rule.shouldNot : rule.never;
  return {
    ...(good === undefined ? {} : { good: { word: guideline ? "should" : "must", code: good } }),
    ...(bad === undefined ? {} : { bad: { word: guideline ? "should not" : "never", code: bad } }),
  };
};

export type Rules = Readonly<Record<RuleId, Rule>>;

/** Rules inline, or a directory of Markdown rule files (see `markdown.ts`). */
export type RuleSource = Rules | string | URL;

/** A rule's setting in a config's `overrides`: `off`, a level, or a level and a threshold. */
const Override = Schema.Union([
  Schema.Literals(["off", "error", "warning"]),
  Schema.Struct({
    level: Schema.optionalKey(Schema.Literals(["off", "error", "warning"])),
    threshold: Schema.optionalKey(Schema.Finite),
  }),
]);
export type Override = typeof Override.Type;

export const AdhereConfig = Schema.Struct({
  /**
   * The model id sent to typesafe. Defaults to "jev-latest"
   */
  model: Schema.optionalKey(Schema.String),
  /** Where the questions go in place of TypeSafe's Jev, with its own model (see `Provider`). */
  provider: Schema.optionalKey(ProviderSchema),
  /**
   * The minimum confidence threshold for a positive match. Defaults to 0.8
   */
  threshold: Schema.optionalKey(Schema.Finite),
  /**
   * Below this, Jev's probability that a file shows enough to decide a
   * finding's rule adds a warning to the finding: check what the code relies
   * on outside the file. Defaults to 0.6
   */
  sufficiencyThreshold: Schema.optionalKey(Schema.Finite),
  /**
   * The presets to use for rule matching. Defaults to an empty array. Current presets
   * include "effect" and "alchemy". Subcategories can be expanded by appending `/<subcategory>`.
   */
  presets: Schema.Array(Schema.Literals(presetNames)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  /**
   * A record of rules, or a directory path relative to the config file,
   * which holds its rules as `.adhere/rules/` does. Unset: the rules in
   * `.adhere/rules/`, and in any nested `.adhere/rules/`.
   */
  rules: Schema.optionalKey(Schema.Union([Schema.Record(Schema.String, Rule), Schema.String])),
  /**
   * Globs, relative to the working directory, of files no rule judges: what
   * `--filter '!<glob>'` leaves out of one run, left out of every run.
   */
  exclude: Schema.optionalKey(Schema.Array(Schema.String)),
  /**
   * Settings for rules by the id a report names them with, a preset's with
   * its preset first, as in `alchemy/providers/idempotent-delete`: `off`, a
   * level, or `{ level, threshold }`. A preset's rule changes without its text
   * being copied into `rules`.
   */
  overrides: Schema.optionalKey(Schema.Record(Schema.String, Override)),
  /**
   * Whether Jev reads every comment, for rules about comments. By default
   * comments are taken out, since a comment changes nothing a file does, but
   * for the notes that say `@adhere`.
   */
  includeComments: Schema.optionalKey(Schema.Boolean),
});

/** Where a repo keeps what adhere reads and writes: its config, its rules, and the cache. */
export const ADHERE_DIRECTORY = ".adhere";
/** Where a repo keeps its rules by default, one to a directory: `<id>/RULE.md` or `<id>/RULE.ts`. */
export const RULES_DIRECTORY = `${ADHERE_DIRECTORY}/rules`;
export const CACHE_DIRECTORY = `${ADHERE_DIRECTORY}/cache`;
/** Where a config may live, relative to the working directory. Exactly one may exist. */
export const CONFIG_FILES = [
  `${ADHERE_DIRECTORY}/config.ts`,
  "adhere.config.ts",
  ".adhere.config.ts",
] as const;
/**
 * Directories never read into, for source files or for nested `.adhere/`
 * rules: dependency, generated, vendored, and tool trees. Matched as whole
 * path segments below the working directory, so a repo that itself sits under
 * one of these names is still read.
 */
export const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  ".agents",
  ".claude",
  ".direnv",
  ".alchemy",
  "coverage",
  ".vite",
  "references",
  "vendor",
  "e2e",
]);
/**
 * Directories whose files are tests, matched as whole path segments below the
 * working directory, as skipped directories are. Only a rule that says `tests`
 * judges them, or a `.test` or `.spec` file, such as `a.test.tsx`, anywhere.
 */
export const TEST_DIRECTORIES: ReadonlySet<string> = new Set([
  "test",
  "tests",
  "__tests__",
  "testing",
  "fixtures",
  "fixture",
  "__fixtures__",
  "__mocks__",
]);

/** The shape a config file default-exports: the schema's input, where `presets` is optional. */
export type Config = typeof AdhereConfig.Encoded;

export const defineConfig = (config: Config) => config;

/**
 * Types a rule written in TypeScript, which a `.adhere/` file default-exports,
 * and returns it as it is. It takes what a config's inline rule does.
 */
export const defineRule = (rule: typeof Rule.Encoded) => rule;

/** A built-in rule set. Same shape as a config, minus `presets`. */
export interface Preset {
  /**
   * Override the model id used. Defaults to "jev-latest"
   */
  readonly model?: string;
  /**
   * Override the threshold that determines a positive match. Defaults to 0.8
   */
  readonly threshold?: number;
  /**
   * Per-rule overrides.
   */
  readonly rules: RuleSource;
}

/** The same thing with its rules read from wherever they were. */
export type Loaded<T extends { readonly rules?: unknown }> = Omit<T, "rules"> & {
  readonly rules: Rules;
};

export const DEFAULT_MODEL = "jev-latest";
export const DEFAULT_THRESHOLD = 0.8;
export const DEFAULT_SUFFICIENCY_THRESHOLD = 0.6;

/** A config with its presets folded in and every default applied. */
export interface ResolvedConfig {
  readonly model: string;
  /** Where the questions go in place of Jev; `model` is its model. */
  readonly provider?: Provider;
  readonly threshold: number;
  /** Below this, a finding's sufficiency adds a warning to it. */
  readonly sufficiencyThreshold: number;
  readonly rules: Rules;
  readonly scopedRules?: RuleSet;
  /** Requests to Jev a minute, at most. Unset, requests go out as fast as they are made. */
  readonly rpm?: number;
  /** The config's globs of files no rule judges. */
  readonly exclude?: ReadonlyArray<string>;
  /** Whether Jev reads every comment; unset, only the `@adhere` notes. */
  readonly includeComments?: boolean;
  /**
   * The workspace's packages, each name with its directory from the working
   * directory, read from its manifests on every run, when a rule's `reads`
   * names them.
   */
  readonly workspacePackages?: Readonly<Record<string, string>>;
}

/** Command-line values that apply on top of the config file. */
export interface Flags {
  readonly presets?: ReadonlyArray<PresetName>;
  /** Replaces the config's global threshold. Per-rule thresholds still win. */
  readonly threshold?: number | undefined;
  /** Replaces the config's sufficiency threshold. */
  readonly sufficiencyThreshold?: number | undefined;
  /** Throttles requests to Jev to at most this many a minute. */
  readonly rpm?: number | undefined;
}

/**
 * The presets a run applies, command-line ones first, each once. A topic such
 * as `effect/basics` is left out when its whole preset is named too, since
 * the whole preset already holds its rules.
 */
export const presetsOf = (
  config: Pick<typeof AdhereConfig.Type, "presets">,
  flags: Flags,
): ReadonlyArray<PresetName> => {
  const named = [...new Set([...(flags.presets ?? []), ...config.presets])];
  return named.filter((name) => {
    const [whole] = name.split("/");
    return whole === name || !named.some((other) => other === whole);
  });
};

/**
 * Precedence, highest first: command line, config file, presets in order
 * (a later preset wins), then the defaults. A config rule replaces a preset
 * rule with the same id.
 */
export const resolveConfig = (
  config: Loaded<typeof AdhereConfig.Type>,
  flags: Flags = {},
  registry: Readonly<Partial<Record<PresetName, Loaded<Preset>>>> = {},
): ResolvedConfig => {
  const applied = presetsOf(config, flags).flatMap((name) => {
    const preset = registry[name];
    return preset === undefined ? [] : [preset];
  });
  const last = <K extends "model" | "threshold">(key: K) =>
    applied.map((preset) => preset[key]).findLast((value) => value !== undefined);
  return {
    model: config.provider?.model ?? config.model ?? last("model") ?? DEFAULT_MODEL,
    ...(config.provider === undefined ? {} : { provider: config.provider }),
    threshold: flags.threshold ?? config.threshold ?? last("threshold") ?? DEFAULT_THRESHOLD,
    sufficiencyThreshold:
      flags.sufficiencyThreshold ?? config.sufficiencyThreshold ?? DEFAULT_SUFFICIENCY_THRESHOLD,
    rules: Object.assign({}, ...applied.map((preset) => preset.rules), config.rules),
    ...(flags.rpm === undefined ? {} : { rpm: flags.rpm }),
    ...(config.exclude === undefined ? {} : { exclude: config.exclude }),
    ...(config.includeComments === undefined ? {} : { includeComments: config.includeComments }),
  };
};

export class ConfigUnavailable extends Schema.TaggedError<ConfigUnavailable>()(
  "ConfigUnavailable",
  { message: Schema.String },
) {}

/**
 * Decodes an in-memory value. @adhere The file-reading caller loadConfigFile
 * in services/AdhereConfig.ts prefixes these errors with the config path;
 * verified in its source and by CLI probes at all three config paths, 2026-09-26.
 */
export const decodeConfig = (
  value: unknown,
): Effect.Effect<typeof AdhereConfig.Type, ConfigUnavailable> =>
  Schema.decodeUnknownEffect(AdhereConfig)(value).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({
        message: `the config must default-export defineConfig({...}): ${problem.message}`,
      }),
    ),
  );
