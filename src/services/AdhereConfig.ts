import {
  ADHERE_DIRECTORY,
  type AdhereConfig as Decoded,
  CONFIG_FILES,
  ConfigUnavailable,
  decodeConfig,
  type Loaded,
  type Overrides,
  type Preset,
  presetsOf,
  type ResolvedConfig,
  resolveConfig,
} from "#config.ts";
import { type PresetName, presetOf, wholePresetOf } from "#presets.ts";
import {
  applicableRules,
  globalRuleSet,
  loadAdhereRuleSet,
  materializeRules,
  type RuleSet,
} from "#rules.ts";
import { Context, Effect, FileSystem, Layer, Path, Record } from "effect";

export class AdhereConfig extends Context.Service<AdhereConfig, ResolvedConfig>()(
  "@drkmttr/adhere/services/AdhereConfig",
) {}

const loadConfigFile = Effect.fn("AdhereConfig.load")(function* (file: string) {
  const path = yield* Path.Path;
  const url = yield* path.toFileUrl(file).pipe(Effect.orDie);
  const loaded = yield* Effect.tryPromise({
    try: () => import(url.href) as Promise<{ readonly default?: unknown }>,
    catch: (cause) =>
      ConfigUnavailable.make({
        message: `Could not load ${file}: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  });
  return yield* decodeConfig(loaded.default).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({ message: `${file}: ${problem.message}` }),
    ),
  );
});

const loadPreset = Effect.fn("AdhereConfig.loadPreset")(function* (name: PresetName, base: string) {
  const { topic, ...preset } = presetOf(name);
  const all = yield* materializeRules(preset.rules, base);
  const rules =
    topic === undefined ? all : Record.filter(all, (_, id) => id.startsWith(`${topic}/`));
  return [name, { ...preset, rules } satisfies Loaded<Preset>] as const;
});

/**
 * The config file in the working directory (one of `CONFIG_FILES`) with the
 * command-line overrides applied. The file is optional when `.adhere/` holds
 * rules or a preset is named. Rule directories resolve against the working
 * directory.
 */
export const AdhereConfigLive = (overrides: Overrides) =>
  Layer.effect(AdhereConfig)(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const fs = yield* FileSystem.FileSystem;
      const cwd = path.resolve();
      const present = (target: string) =>
        fs
          .exists(path.join(cwd, target))
          .pipe(Effect.mapError((problem) => ConfigUnavailable.make({ message: problem.message })));
      const found = yield* Effect.filter(CONFIG_FILES, present);
      if (found.length > 1) {
        return yield* ConfigUnavailable.make({
          message: `More than one config file: ${found.join(", ")}. Keep one.`,
        });
      }
      const configFile = found[0];
      const hasPreset = overrides.presets !== undefined && overrides.presets.length > 0;
      const config: Decoded =
        configFile === undefined
          ? yield* decodeConfig({})
          : yield* loadConfigFile(path.join(cwd, configFile));
      const discoveredEntries = config.rules === undefined ? yield* loadAdhereRuleSet(cwd) : [];
      const hasProjectRules = discoveredEntries.length > 0;
      if (configFile === undefined && !hasProjectRules && !hasPreset) {
        return yield* ConfigUnavailable.make({
          message: `Nothing to audit against: no config file (${CONFIG_FILES.join(", ")}), no ${ADHERE_DIRECTORY}/ directory of rules, and no --preset. Pass --preset effect to use the built-in rules.`,
        });
      }
      const projectEntries: RuleSet =
        config.rules === undefined
          ? discoveredEntries
          : globalRuleSet(yield* materializeRules(config.rules ?? {}, cwd), cwd);
      const rules = applicableRules(cwd, projectEntries);
      const registry = yield* Effect.forEach(presetsOf(config, overrides), (name) =>
        loadPreset(name, cwd),
      ).pipe(Effect.map(Record.fromEntries));
      const resolved = resolveConfig({ ...config, rules }, overrides, registry);
      const presetEntries = Object.entries(registry).flatMap(([name, preset]) =>
        globalRuleSet(preset.rules, cwd).map((entry) => ({
          ...entry,
          preset: wholePresetOf(name as PresetName),
        })),
      );
      yield* Effect.logDebug(
        `config: ${configFile ?? "no config file"}; presets ${Object.keys(registry).join(", ") || "none"}; ${presetEntries.length} preset and ${projectEntries.length} project rules; model ${resolved.model}, threshold ${resolved.threshold}${resolved.rpm === undefined ? "" : `, at most ${resolved.rpm} requests a minute`}`,
      );
      return AdhereConfig.of({
        ...resolved,
        scopedRules: [...presetEntries, ...projectEntries],
      });
    }),
  );
