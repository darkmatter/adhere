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
  model: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("jev-latest")),
  ),
  threshold: Schema.Finite.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(0.7)),
  ),
  presets: Schema.Array(Schema.Literals(presetNames)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  rules: Schema.Record(Schema.String, Rule).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed({})),
  ),
});
export interface AdhereConfig extends Schema.Schema.Type<typeof AdhereConfig> {}

export const defineConfig = (config: typeof AdhereConfig.Encoded) => config;

/** A config with its presets folded into `rules`. A config rule wins over a preset rule of the same id. */
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

export const resolveConfig = (
  config: AdhereConfig,
  overrides: Overrides = {},
): ResolvedConfig => ({
  model: config.model,
  threshold: overrides.threshold ?? config.threshold,
  rules: Object.assign(
    {},
    ...[...(overrides.presets ?? []), ...config.presets].map(
      (name) => presets[name],
    ),
    config.rules,
  ),
});

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
