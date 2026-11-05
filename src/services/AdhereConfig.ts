import {
  AdhereConfig as AdhereConfigSchema,
  CONFIG_FILES,
  ConfigUnavailable,
  declaresNativeReads,
  decodeConfig,
  type Loaded,
  type Flags,
  type Preset,
  presetsOf,
  type ResolvedConfig,
  resolveConfig,
  RULES_DIRECTORY,
  typeAwareOf,
} from "#config.ts";
import { type PresetName, presetOf, presets, wholePresetOf } from "#presets.ts";
import {
  applicableRules,
  globalRuleSet,
  loadAdhereRuleSet,
  materializeRules,
  type RuleSet,
  shownId,
  withOverrides,
} from "#rules.ts";
import { workspaceDependentsOf, workspacePackagesOf } from "#workspaces.ts";
import { Context, Effect, FileSystem, Layer, Path, Record } from "effect";

export class AdhereConfig extends Context.Service<AdhereConfig, ResolvedConfig>()(
  "@drkmttr/adhere/services/AdhereConfig",
) {}

export const loadConfigFile = Effect.fn("AdhereConfig.load")(function* (file: string) {
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

export const loadPreset = Effect.fn("AdhereConfig.loadPreset")(function* (
  name: PresetName,
  base: string,
) {
  const { topic, ...preset } = presetOf(name);
  const all = yield* materializeRules(preset.rules, base);
  const rules =
    topic === undefined ? all : Record.filter(all, (_, id) => id.startsWith(`${topic}/`));
  return [name, { ...preset, rules } satisfies Loaded<Preset>] as const;
});

/** Locate the optional config without loading rules or presets. */
export const findConfigFile = Effect.fn("AdhereConfig.find")(function* (cwd: string) {
  const path = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const found = yield* Effect.filter(CONFIG_FILES, (file) =>
    fs
      .exists(path.join(cwd, file))
      .pipe(Effect.mapError((problem) => ConfigUnavailable.make({ message: problem.message }))),
  );
  if (found.length > 1) {
    return yield* ConfigUnavailable.make({
      message: `More than one config file: ${found.join(", ")}. Keep one.`,
    });
  }
  return found[0];
});

/** Every rule of every built-in preset, by the id a report names it with. */
const everyPresetRule = Effect.fn("AdhereConfig.everyPresetRule")(function* (base: string) {
  const loaded = yield* Effect.forEach(Object.entries(presets), ([name, preset]) =>
    Effect.map(materializeRules(preset.rules, base), (rules) =>
      Object.keys(rules).map((id) => `${name}/${id}`),
    ),
  );
  return new Set(loaded.flat());
});

/**
 * The config file in the working directory (one of `CONFIG_FILES`) with the
 * command-line flags applied. The file is optional when `.adhere/` holds
 * rules or a preset is named. Rule directories resolve against the working
 * directory.
 */
export const AdhereConfigLive = (flags: Flags) =>
  Layer.effect(AdhereConfig)(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const cwd = path.resolve();
      const configFile = yield* findConfigFile(cwd);
      const hasPreset = flags.presets !== undefined && flags.presets.length > 0;
      const config: typeof AdhereConfigSchema.Type =
        configFile === undefined
          ? yield* decodeConfig({})
          : yield* loadConfigFile(path.join(cwd, configFile));
      const discoveredEntries = config.rules === undefined ? yield* loadAdhereRuleSet(cwd) : [];
      const hasProjectRules = discoveredEntries.length > 0;
      if (configFile === undefined && !hasProjectRules && !hasPreset) {
        return yield* ConfigUnavailable.make({
          message: `Nothing to audit against: no config file (${CONFIG_FILES.join(", ")}), no rules in ${RULES_DIRECTORY}/, and no --preset. Pass --preset effect to use the built-in rules.`,
        });
      }
      const projectEntries: RuleSet =
        config.rules === undefined
          ? discoveredEntries
          : globalRuleSet(yield* materializeRules(config.rules ?? {}, cwd), cwd);
      const rules = applicableRules(cwd, projectEntries);
      const loadedPresets = yield* Effect.forEach(presetsOf(config, flags), (name) =>
        loadPreset(name, cwd),
      ).pipe(Effect.map(Record.fromEntries));
      // A bundled rule that declares the compiler's native reads is left out
      // unless this run enables them; a project's own rule stays and warns.
      const registry = typeAwareOf(config, flags)
        ? loadedPresets
        : Record.map(loadedPresets, (preset) => ({
            ...preset,
            rules: Record.filter(preset.rules, (rule) => !declaresNativeReads(rule)),
          }));
      const resolved = resolveConfig({ ...config, rules }, flags, registry);
      const presetEntries = Object.entries(registry).flatMap(([name, preset]) =>
        globalRuleSet(preset.rules, cwd).map((entry) => ({
          ...entry,
          preset: wholePresetOf(name as PresetName),
        })),
      );
      yield* Effect.logDebug(
        `config: ${configFile ?? "no config file"}; presets ${Object.keys(registry).join(", ") || "none"}; ${presetEntries.length} preset and ${projectEntries.length} project rules; model ${resolved.model}, threshold ${resolved.threshold}${resolved.rpm === undefined ? "" : `, at most ${resolved.rpm} requests a minute`}`,
      );
      const entries = [...presetEntries, ...projectEntries];
      const overrides = config.overrides ?? {};
      const loaded = new Set(entries.map(shownId));
      const elsewhere = Object.keys(overrides).filter((id) => !loaded.has(id));
      if (elsewhere.length > 0) {
        // A rule of a preset this run leaves out, or skips without type awareness,
        // may be overridden; one no rule has is a typo.
        const every = yield* everyPresetRule(cwd);
        const unknown = elsewhere.filter((id) => !every.has(id));
        if (unknown.length > 0) {
          return yield* ConfigUnavailable.make({
            message: `overrides names ${unknown.join(", ")}, which is no preset or project rule. A preset's rule is named with its preset first, as in alchemy/providers/idempotent-delete.`,
          });
        }
      }
      const scopedRules = yield* withOverrides(entries, overrides);
      for (const entry of scopedRules) {
        const missing = (entry.rule.reads ?? []).filter((read) => !resolved.reads.includes(read));
        if (missing.length === 0) continue;
        const workspaceMissing = missing.filter(
          (read) => read === "workspacePackages" || read === "dependents",
        );
        const nativeMissing = missing.filter((read) => read === "symbols" || read === "references");
        const enable = [
          ...(workspaceMissing.length === 0
            ? []
            : [
                `add ${workspaceMissing.map((read) => `"${read}"`).join(", ")} to the config's reads`,
              ]),
          ...(nativeMissing.length === 0 ? [] : ["enable typeAware: true (or pass --type-aware)"]),
        ].join(" and ");
        yield* Effect.logWarning(
          `${shownId(entry)} declares reads ${missing.join(", ")}, which this run does not enable; the rule may be less accurate until enabled. ${enable}.`,
        );
      }
      // Read on every run so workspace edits are seen, but only when the config enables this context.
      const dependents = resolved.reads.includes("dependents");
      const workspacePackages =
        dependents || resolved.reads.includes("workspacePackages")
          ? yield* workspacePackagesOf(cwd)
          : undefined;
      const workspaceDependents =
        dependents && workspacePackages !== undefined
          ? yield* workspaceDependentsOf(cwd, workspacePackages)
          : undefined;
      return AdhereConfig.of({
        ...resolved,
        scopedRules,
        ...(workspacePackages === undefined ? {} : { workspacePackages }),
        ...(workspaceDependents === undefined ? {} : { workspaceDependents }),
      });
    }),
  );
