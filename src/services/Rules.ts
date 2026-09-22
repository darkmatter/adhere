import { RulesUnavailable } from "#models/Audit.ts";
import {
  type ConfiguredRule,
  isConfiguredRule,
} from "#rules.ts";
import { Context, Effect, FileSystem, Layer, Path } from "effect";

/** The rules loaded from `adhere.config.ts` in the working directory. */
export class Rules extends Context.Service<
  Rules,
  {
    readonly rules: ReadonlyArray<ConfiguredRule>;
  }
>()("@darkmatter/adhere/services/Rules") {}

const CONFIG_FILE = "adhere.config.ts";

/** The default export, or a refusal when it is not a rule list. */
const accept = (value: unknown) =>
  Effect.gen(function* () {
    if (!Array.isArray(value) || !value.every(isConfiguredRule)) {
      return yield* Effect.fail(
        RulesUnavailable.make({
          message:
            "adhere.config.ts must default-export the array from defineConfig",
        }),
      );
    }
    return value;
  });

/**
 * Load `adhere.config.ts` from the working directory. The file is TypeScript
 * because a line test is a function, which Effect Config cannot express.
 */
export const RulesLive = Layer.effect(Rules)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    // No segments: Path resolves against the working directory.
    const file = path.join(path.resolve(), CONFIG_FILE);
    const exists = yield* fs.exists(file).pipe(
      Effect.mapError((problem) =>
        RulesUnavailable.make({ message: problem.message }),
      ),
    );
    if (!exists) {
      return yield* Effect.fail(
        RulesUnavailable.make({
          message: `${CONFIG_FILE} was not found in the working directory`,
        }),
      );
    }
    const url = yield* path.toFileUrl(file).pipe(Effect.orDie);
    const loaded = yield* Effect.tryPromise({
      try: () => import(url.href) as Promise<{ readonly default?: unknown }>,
      catch: (cause) =>
        RulesUnavailable.make({
          message: `Could not load ${CONFIG_FILE}: ${cause instanceof Error ? cause.message : String(cause)}`,
        }),
    });
    const rules = yield* accept(loaded.default);
    return Rules.of({ rules });
  }),
);
