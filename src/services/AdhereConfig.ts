import {
  type AdhereConfig as Decoded,
  ConfigUnavailable,
  decodeConfig,
  type Loaded,
  type Overrides,
  type Preset,
  presetsOf,
  type ResolvedConfig,
  resolveConfig,
} from "#config.ts";
import { type PresetName, presets } from "#presets.ts";
import { materializeRules } from "#rules.ts";
import { Context, Effect, FileSystem, Layer, Path, Record } from "effect";

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

const loadPreset = Effect.fn("AdhereConfig.loadPreset")(function* (
  name: PresetName,
  base: string,
) {
  const preset: Preset = presets[name];
  const rules = yield* materializeRules(preset.rules, base);
  return [name, { ...preset, rules } satisfies Loaded<Preset>] as const;
});

/**
 * `adhere.config.ts` from the working directory with the command-line
 * overrides applied. With a preset on the command line, the file is optional.
 * Rule directories in the config resolve against the working directory.
 */
export const AdhereConfigLive = (overrides: Overrides) =>
  Layer.effect(AdhereConfig)(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const fs = yield* FileSystem.FileSystem;
      const cwd = path.resolve();
      const file = path.join(cwd, CONFIG_FILE);
      const exists = yield* fs
        .exists(file)
        .pipe(
          Effect.mapError((problem) =>
            ConfigUnavailable.make({ message: problem.message }),
          ),
        );
      if (!exists && (overrides.presets === undefined || overrides.presets.length === 0)) {
        return yield* ConfigUnavailable.make({
          message: `${CONFIG_FILE} was not found in the working directory. Add one, or pass --preset effect to use the built-in rules.`,
        });
      }
      const config: Decoded = exists
        ? yield* loadConfigFile(file)
        : yield* decodeConfig({});
      const rules = yield* materializeRules(config.rules, cwd);
      const registry = yield* Effect.forEach(
        presetsOf(config, overrides),
        (name) => loadPreset(name, cwd),
      ).pipe(Effect.map(Record.fromEntries));
      return AdhereConfig.of(
        resolveConfig({ ...config, rules }, overrides, registry),
      );
    }),
  );
