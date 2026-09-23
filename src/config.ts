import { type PresetName, presetNames } from "#presets.ts";
import type { RuleSet } from "#rules.ts";
import { Effect, Schema } from "effect";

export type RuleId = string;

export const Rule = Schema.Struct({
  description: Schema.String,
  /** Correct code: the pattern a file should follow. */
  reference: Schema.optionalKey(Schema.String),
  /** Incorrect code: what a violation looks like. */
  avoid: Schema.optionalKey(Schema.String),
  threshold: Schema.optionalKey(Schema.Finite),
}).check(
  Schema.makeFilter((rule) =>
    rule.reference !== undefined || rule.avoid !== undefined
      ? undefined
      : "a rule needs a reference, code to avoid, or both",
  ),
);
export interface Rule extends Schema.Schema.Type<typeof Rule> {}

export type Rules = Readonly<Record<RuleId, Rule>>;

/** Rules inline, or a directory of Markdown rule files (see `markdown.ts`). */
export type RuleSource = Rules | string | URL;

export const AdhereConfig = Schema.Struct({
  model: Schema.optionalKey(Schema.String),
  threshold: Schema.optionalKey(Schema.Finite),
  presets: Schema.Array(Schema.Literals(presetNames)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  /**
   * A record of rules, or a directory path relative to the config file.
   * Unset: `.adhere/` when that directory exists, otherwise no rules.
   */
  rules: Schema.optionalKey(Schema.Union([Schema.Record(Schema.String, Rule), Schema.String])),
});

/** Where a repo keeps its rule files by default. The cache lives under it. */
export const ADHERE_DIRECTORY = ".adhere";
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
export interface AdhereConfig extends Schema.Schema.Type<typeof AdhereConfig> {}

/** The shape a config file default-exports. */
export type Config = typeof AdhereConfig.Encoded;

export const defineConfig = (config: Config) => config;

/** A built-in rule set. Same shape as a config, minus `presets`. */
export interface Preset {
  readonly model?: string;
  readonly threshold?: number;
  readonly rules: RuleSource;
}

/** The same thing with its rules read from wherever they were. */
export type Loaded<T extends { readonly rules?: unknown }> = Omit<T, "rules"> & {
  readonly rules: Rules;
};

export const DEFAULT_MODEL = "jev-latest";
export const DEFAULT_THRESHOLD = 0.7;

/** A config with its presets folded in and every default applied. */
export interface ResolvedConfig {
  readonly model: string;
  readonly threshold: number;
  readonly rules: Rules;
  readonly scopedRules?: RuleSet;
}

/** Command-line values that apply on top of the config file. */
export interface Overrides {
  readonly presets?: ReadonlyArray<PresetName>;
  /** Replaces the config's global threshold. Per-rule thresholds still win. */
  readonly threshold?: number;
}

/** The presets a run applies, command-line ones first. */
export const presetsOf = (
  config: Pick<AdhereConfig, "presets">,
  overrides: Overrides,
): ReadonlyArray<PresetName> => [...(overrides.presets ?? []), ...config.presets];

/**
 * Precedence, highest first: command line, config file, presets in order
 * (a later preset wins), then the defaults. A config rule replaces a preset
 * rule with the same id.
 */
export const resolveConfig = (
  config: Loaded<AdhereConfig>,
  overrides: Overrides = {},
  registry: Readonly<Partial<Record<PresetName, Loaded<Preset>>>> = {},
): ResolvedConfig => {
  const applied = presetsOf(config, overrides).flatMap((name) => {
    const preset = registry[name];
    return preset === undefined ? [] : [preset];
  });
  const last = <K extends "model" | "threshold">(key: K) =>
    applied.map((preset) => preset[key]).findLast((value) => value !== undefined);
  return {
    model: config.model ?? last("model") ?? DEFAULT_MODEL,
    threshold: overrides.threshold ?? config.threshold ?? last("threshold") ?? DEFAULT_THRESHOLD,
    rules: Object.assign({}, ...applied.map((preset) => preset.rules), config.rules),
  };
};

export class ConfigUnavailable extends Schema.TaggedError<ConfigUnavailable>()(
  "ConfigUnavailable",
  { message: Schema.String },
) {}

export const decodeConfig = (value: unknown): Effect.Effect<AdhereConfig, ConfigUnavailable> =>
  Schema.decodeUnknownEffect(AdhereConfig)(value).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({
        message: `the config must default-export defineConfig({...}): ${problem.message}`,
      }),
    ),
  );
