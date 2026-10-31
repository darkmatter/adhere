/**
 * The managed index in a shared repo's README: its `.adhere/rules/` with each
 * rule's description, the native Oxlint rules its `lint/rules.json` enables,
 * and the rules its custom Oxlint plugins add. Only a marked block is written,
 * so the rest of the README stays the author's.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describeRulesAt } from "#install.ts";
import { oxlintRule } from "#oxlint/catalog.ts";
import { SHARED_LINT_DIRECTORY, SHARED_LINT_EXPORT, SHARED_LINT_RULES } from "#oxlint/shared.ts";
import { Effect, Option, Schema } from "effect";

export const README_START = "<!-- adhere:rules:start -->";
export const README_END = "<!-- adhere:rules:end -->";

export class ReadmeUnavailable extends Schema.TaggedError<ReadmeUnavailable>()(
  "ReadmeUnavailable",
  { message: Schema.String },
) {}

/** A rule's description as `adhere list` shows it: never by running a RULE.ts. */
export interface ReadmeRule {
  readonly id: string;
  readonly name: "RULE.md" | "RULE.ts";
  readonly description: string;
}

/** The lint settings an index reads: enabled rules and configured plugin entries. */
export interface LintConfig {
  readonly rules?: Readonly<Record<string, unknown>>;
  readonly jsPlugins?: ReadonlyArray<unknown>;
}

const LintConfig = Schema.Struct({
  rules: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
  jsPlugins: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});

const Manifest = Schema.Struct({
  exports: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
});

/** What a README index wrote, and how much it listed. */
export interface ReadmeRefresh {
  readonly changed: boolean;
  readonly message: string;
}

const OFF = new Set<unknown>(["off", "allow", "0", 0]);

/** The severity a rule setting turns on, or undefined when it is off. */
const levelOf = (setting: unknown): "error" | "warn" | "on" | undefined => {
  const level = Array.isArray(setting) ? setting[0] : setting;
  if (OFF.has(level)) return undefined;
  if (level === "error" || level === 2) return "error";
  if (level === "warn" || level === 1) return "warn";
  return "on";
};

const enabledAs = (setting: unknown): string => {
  const level = levelOf(setting);
  return level === "on" || level === undefined ? "enabled" : `enabled as \`${level}\``;
};

/** A plugin entry's name and specifier: `{ name, specifier }` or a bare specifier. */
const pluginsIn = (config: LintConfig): ReadonlyMap<string, string | undefined> => {
  const plugins = new Map<string, string | undefined>();
  for (const entry of config.jsPlugins ?? []) {
    if (typeof entry === "string") {
      const base = entry.split("/").at(-1) ?? entry;
      plugins.set(base.replace(/\.(?:mjs|cjs|js)$/, ""), entry);
    } else if (
      typeof entry === "object" &&
      entry !== null &&
      "name" in entry &&
      typeof entry.name === "string"
    ) {
      plugins.set(
        entry.name,
        "specifier" in entry && typeof entry.specifier === "string" ? entry.specifier : undefined,
      );
    }
  }
  return plugins;
};

/** A `lint/rules.json` plugin path as a link from the README, or undefined when it is a package. */
const pluginLink = (specifier: string | undefined): string | undefined => {
  if (specifier === undefined || !specifier.startsWith("./") || specifier.includes("..")) {
    return undefined;
  }
  return `./${SHARED_LINT_DIRECTORY}/${specifier.slice(2)}`;
};

const link = (label: string, target: string | undefined) =>
  target === undefined ? `\`${label}\`` : `[\`${label}\`](${target})`;

/** One line per enabled lint setting; a rule with an off setting does nothing. */
const lintEntries = (config: LintConfig) => {
  const plugins = pluginsIn(config);
  const native: Array<string> = [];
  const custom: Array<string> = [];
  for (const id of Object.keys(config.rules ?? {}).sort()) {
    const setting = config.rules?.[id];
    const level = levelOf(setting);
    if (level === undefined) continue;
    const plugin = id.includes("/") ? id.slice(0, id.indexOf("/")) : undefined;
    const specifier = plugin === undefined ? undefined : plugins.get(plugin);
    if (plugin !== undefined && specifier !== undefined) {
      custom.push(
        `- ${link(id, pluginLink(specifier))}: custom plugin \`${plugin}\`, ${enabledAs(setting)}.`,
      );
      continue;
    }
    const summary = (oxlintRule(id)?.summary ?? "").replace(/\s+/g, " ").trim();
    native.push(
      summary === ""
        ? `- ${link(id, `./${SHARED_LINT_RULES}`)}: ${enabledAs(setting)}.`
        : `- ${link(id, `./${SHARED_LINT_RULES}`)}: ${summary} (${enabledAs(setting)}).`,
    );
  }
  return { native, custom };
};

/**
 * The managed block's body. Sorted by id, one bullet per entry, so the same
 * rules and settings always render the same text.
 */
export const renderReadmeIndex = (rules: ReadonlyArray<ReadmeRule>, config: LintConfig): string => {
  const entries = lintEntries(config);
  const rulesList =
    rules.length === 0
      ? ["- None."]
      : rules.map(({ id, name, description }) => {
          const text = description.replace(/\s+/g, " ").trim();
          const target = `./.adhere/rules/${id}/${name}`;
          return text === "" ? `- ${link(id, target)}` : `- ${link(id, target)}: ${text}`;
        });
  return [
    "**Rules**",
    "",
    ...rulesList,
    "",
    "**Lint settings**",
    "",
    ...(entries.native.length === 0 ? ["- None."] : entries.native),
    "",
    "**Custom lint plugins**",
    "",
    ...(entries.custom.length === 0 ? ["- None."] : entries.custom),
  ].join("\n");
};

const readOptional = (file: string): Effect.Effect<string | undefined, ReadmeUnavailable> =>
  Effect.tryPromise({
    try: async () => {
      try {
        return { text: await readFile(file, "utf8") };
      } catch (cause) {
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          cause.code === "ENOENT"
        ) {
          return {};
        }
        throw cause;
      }
    },
    catch: (cause) =>
      new ReadmeUnavailable({
        message: `Could not read ${file}: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  }).pipe(Effect.map(({ text }) => text));

/** The shared lint config, `{}` when absent; invalid JSON refuses the refresh. */
const lintConfigAt = (root: string): Effect.Effect<LintConfig, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const file = join(root, SHARED_LINT_RULES);
    const text = yield* readOptional(file);
    if (text === undefined) return {};
    const parsed = yield* Effect.try({
      try: () => JSON.parse(text) as unknown,
      catch: () =>
        new ReadmeUnavailable({
          message: `${file} is not valid JSON; left the README unchanged.`,
        }),
    });
    const decoded = Schema.decodeUnknownOption(LintConfig)(parsed);
    return Option.isSome(decoded)
      ? decoded.value
      : yield* ReadmeUnavailable.make({
          message: `${file} is not an object of rules and jsPlugins; left the README unchanged.`,
        });
  });

/**
 * Whether `root` is a shared rules repo, by the metadata `init --shared`
 * writes: a package.json whose exports name `./lint`. Its rules directory
 * alone is every project's, so this is what tells a shared repo from one that
 * merely has rules.
 */
export const isSharedRepo = (root: string): Effect.Effect<boolean> =>
  Effect.promise(async () => {
    try {
      const parsed: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
      const decoded = Schema.decodeUnknownOption(Manifest)(parsed);
      return Option.isSome(decoded) && decoded.value.exports?.[SHARED_LINT_EXPORT] !== undefined;
    } catch {
      return false;
    }
  });

/**
 * Replace only the marked block; append it when absent. A README that is
 * missing one marker, or repeats them, refuses before any write.
 */
export const applyReadmeIndex = (
  previous: string,
  block: string,
): Effect.Effect<string, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const start = previous.indexOf(README_START);
    const end = previous.indexOf(README_END);
    if (
      (start === -1) !== (end === -1) ||
      (start !== -1 &&
        (end < start ||
          previous.indexOf(README_START, start + README_START.length) !== -1 ||
          previous.indexOf(README_END, end + README_END.length) !== -1))
    ) {
      return yield* ReadmeUnavailable.make({
        message:
          "README.md has malformed or duplicate adhere rules markers. Fix them before running adhere rules readme.",
      });
    }
    const wrapped = `${README_START}\n${block}\n${README_END}`;
    return start === -1
      ? `${previous}${previous === "" ? "" : previous.endsWith("\n\n") ? "" : previous.endsWith("\n") ? "\n" : "\n\n"}${wrapped}\n`
      : `${previous.slice(0, start)}${wrapped}${previous.slice(end + README_END.length)}`;
  });

/**
 * Check that `root`'s README accepts an index refresh, without writing: a
 * local writer calls this before it writes a rule or plugin, so malformed
 * markers fail before a partial change lands.
 */
export const validateReadme = (root: string): Effect.Effect<void, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const previous = (yield* readOptional(join(root, "README.md"))) ?? "";
    yield* applyReadmeIndex(previous, "");
  });

/**
 * Refresh the README at `root` from its rules and lint config. `root` is
 * taken as shared because init knows it is; commands that start in a
 * directory check `isSharedRepo` first.
 */
export const refreshReadme = (root: string): Effect.Effect<ReadmeRefresh, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const rules = yield* describeRulesAt(root).pipe(
      Effect.mapError(
        (cause) =>
          new ReadmeUnavailable({
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      ),
    );
    for (const rule of rules) {
      if (rule.description.includes(README_START) || rule.description.includes(README_END)) {
        return yield* ReadmeUnavailable.make({
          message: `${rule.id} has an adhere rules marker in its description; left the README unchanged.`,
        });
      }
    }
    const config = yield* lintConfigAt(root);
    const entries = lintEntries(config);
    const block = renderReadmeIndex(rules, config);
    const target = join(root, "README.md");
    const previous = (yield* readOptional(target)) ?? "";
    const next = yield* applyReadmeIndex(previous, block);
    const changed = next !== previous;
    if (changed) {
      yield* Effect.tryPromise({
        try: () => writeFile(target, next, "utf8"),
        catch: (cause) =>
          new ReadmeUnavailable({
            message: `Could not write ${target}: ${cause instanceof Error ? cause.message : String(cause)}`,
          }),
      });
    }
    const settings = entries.native.length + entries.custom.length;
    return {
      changed,
      message: `${changed ? "Updated" : "Unchanged"} README.md: ${rules.length} ${rules.length === 1 ? "rule" : "rules"}, ${settings} enabled lint ${settings === 1 ? "setting" : "settings"}.`,
    };
  });

/**
 * Refresh `root`'s index only when it is a shared repo, as an org push
 * discovered it. A legacy rules-only repo is left exactly as it was: no README
 * is invented. Returns whether the root is shared, so the caller stages
 * README.md only then. Malformed markers propagate and stop the push.
 */
export const refreshIndexIfShared = (root: string): Effect.Effect<boolean, ReadmeUnavailable> =>
  Effect.gen(function* () {
    if (!(yield* isSharedRepo(root))) return false;
    yield* refreshReadme(root);
    return true;
  });

/** Refresh a shared repo's README, refusing a directory that is not one. */
export const refreshSharedReadme = (
  root: string,
): Effect.Effect<ReadmeRefresh, ReadmeUnavailable> =>
  Effect.gen(function* () {
    if (!(yield* isSharedRepo(root))) {
      return yield* ReadmeUnavailable.make({
        message: `${root} is not a shared rules repo: package.json must export ${SHARED_LINT_EXPORT}, as adhere init --shared writes it.`,
      });
    }
    return yield* refreshReadme(root);
  });
