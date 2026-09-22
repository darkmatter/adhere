import { type PresetName, presetNames, presets } from "#presets.ts";
import { Effect, Schema } from "effect";

export type RuleId = string;

export const Rule = Schema.Struct({
  description: Schema.String,
  reference: Schema.String,
  threshold: Schema.optionalKey(Schema.Finite),
});
export interface Rule extends Schema.Schema.Type<typeof Rule> {}

export const AdhereConfig = Schema.Struct({
  model: Schema.optionalKey(Schema.String),
  threshold: Schema.optionalKey(Schema.Finite),
  presets: Schema.Array(Schema.Literals(presetNames)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  rules: Schema.Record(Schema.String, Rule).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed({})),
  ),
});
export interface AdhereConfig extends Schema.Schema.Type<typeof AdhereConfig> {}

export const defineConfig = (config: typeof AdhereConfig.Encoded) => config;

/** A built-in rule set. Same shape as a config, minus `presets`. */
export interface Preset {
  readonly model?: string;
  readonly threshold?: number;
  readonly rules: Readonly<Record<RuleId, Rule>>;
}

export const DEFAULT_MODEL = "jev-latest";
export const DEFAULT_THRESHOLD = 0.7;

/** A config with its presets folded in and every default applied. */
export interface ResolvedConfig {
  readonly model: string;
  readonly threshold: number;
  readonly rules: Readonly<Record<RuleId, Rule>>;
}

/** Command-line values that apply on top of the config file. */
export interface Overrides {
  readonly presets?: ReadonlyArray<PresetName>;
  /** Replaces the config's global threshold. Per-rule thresholds still win. */
  readonly threshold?: number;
}

/**
 * Precedence, highest first: command line, config file, presets in order
 * (a later preset wins), then the defaults. A config rule replaces a preset
 * rule with the same id.
 */
export const resolveConfig = (
  config: AdhereConfig,
  overrides: Overrides = {},
  registry: Readonly<Record<PresetName, Preset>> = presets,
): ResolvedConfig => {
  const applied = [...(overrides.presets ?? []), ...config.presets].map(
    (name) => registry[name],
  );
  const last = <K extends "model" | "threshold">(key: K) =>
    applied.map((preset) => preset[key]).findLast((value) => value !== undefined);
  return {
    model: config.model ?? last("model") ?? DEFAULT_MODEL,
    threshold:
      overrides.threshold ??
      config.threshold ??
      last("threshold") ??
      DEFAULT_THRESHOLD,
    rules: Object.assign(
      {},
      ...applied.map((preset) => preset.rules),
      config.rules,
    ),
  };
};

export class ConfigUnavailable extends Schema.TaggedError<ConfigUnavailable>()(
  "ConfigUnavailable",
  { message: Schema.String },
) {}

export const decodeConfig = (
  value: unknown,
): Effect.Effect<AdhereConfig, ConfigUnavailable> =>
  Schema.decodeUnknownEffect(AdhereConfig)(value).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({
        message: `adhere.config.ts must default-export defineConfig({...}): ${problem.message}`,
      }),
    ),
  );
