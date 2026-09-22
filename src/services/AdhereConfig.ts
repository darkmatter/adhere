import {
  ConfigUnavailable,
  decodeConfig,
  type Overrides,
  type ResolvedConfig,
  resolveConfig,
} from "#config.ts";
import { Context, Effect, FileSystem, Layer, Path } from "effect";

const CONFIG_FILE = "adhere.config.ts";

export class AdhereConfig extends Context.Service<
  AdhereConfig,
  ResolvedConfig
>()("@darkmatter/adhere/services/AdhereConfig") {}

const loadConfigFile = Effect.fn("AdhereConfig.load")(function* (file: string) {
  const path = yield* Path.Path;
  const url = yield* path.toFileUrl(file).pipe(Effect.orDie);
  const loaded = yield* Effect.tryPromise({
    try: () => import(url.href) as Promise<{ readonly default?: unknown }>,
    catch: (cause) =>
      ConfigUnavailable.make({
        message: `Could not load ${CONFIG_FILE}: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  });
  return yield* decodeConfig(loaded.default);
});

/**
 * `adhere.config.ts` from the working directory with the command-line
 * overrides applied. With a preset on the command line, the file is optional.
 */
export const AdhereConfigLive = (overrides: Overrides) =>
  Layer.effect(AdhereConfig)(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const fs = yield* FileSystem.FileSystem;
      const file = path.join(path.resolve(), CONFIG_FILE);
      const exists = yield* fs
        .exists(file)
        .pipe(
          Effect.mapError((problem) =>
            ConfigUnavailable.make({ message: problem.message }),
          ),
        );
      if (exists) {
        return AdhereConfig.of(
          resolveConfig(yield* loadConfigFile(file), overrides),
        );
      }
      if (overrides.presets !== undefined && overrides.presets.length > 0) {
        return AdhereConfig.of(
          resolveConfig(yield* decodeConfig({}), overrides),
        );
      }
      return yield* ConfigUnavailable.make({
        message: `${CONFIG_FILE} was not found in the working directory. Add one, or pass --preset effect to use the built-in rules.`,
      });
    }),
  );
