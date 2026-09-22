import {
  type AdhereConfig as Decoded,
  ConfigUnavailable,
  decodeConfig,
} from "#config.ts";
import { Context, Effect, FileSystem, Layer, Path } from "effect";

const CONFIG_FILE = "adhere.config.ts";

/** The decoded `adhere.config.ts` of the working directory, defaults applied. */
export class AdhereConfig extends Context.Service<AdhereConfig, Decoded>()(
  "@darkmatter/adhere/services/AdhereConfig",
) {}

export const AdhereConfigLive = Layer.effect(AdhereConfig)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    // No segments: Path resolves against the working directory.
    const file = path.join(path.resolve(), CONFIG_FILE);
    const exists = yield* fs
      .exists(file)
      .pipe(
        Effect.mapError((problem) =>
          ConfigUnavailable.make({ message: problem.message }),
        ),
      );
    if (!exists) {
      return yield* ConfigUnavailable.make({
        message: `${CONFIG_FILE} was not found in the working directory`,
      });
    }
    const url = yield* path.toFileUrl(file).pipe(Effect.orDie);
    const loaded = yield* Effect.tryPromise({
      try: () => import(url.href) as Promise<{ readonly default?: unknown }>,
      catch: (cause) =>
        ConfigUnavailable.make({
          message: `Could not load ${CONFIG_FILE}: ${cause instanceof Error ? cause.message : String(cause)}`,
        }),
    });
    return AdhereConfig.of(yield* decodeConfig(loaded.default));
  }),
);
