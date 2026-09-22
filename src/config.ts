import { Effect, Schema } from "effect";

/** "topic/slug", the key of a rule in `adhere.config.ts`. */
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
  rules: Schema.Record(Schema.String, Rule),
});
export interface AdhereConfig extends Schema.Schema.Type<typeof AdhereConfig> {}

export const defineConfig = (config: typeof AdhereConfig.Encoded) => config;

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
