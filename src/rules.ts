import {
  ConfigUnavailable,
  type Override,
  Rule,
  type RuleId,
  type RuleSource,
  SKIPPED_DIRECTORIES,
} from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { walkFiles } from "#walk.ts";
import { clearingStatus, countOf, Status } from "#services/Status.ts";
import { Effect, FileSystem, Path, Record, Schema } from "effect";

const refused = (directory: string) => (problem: { readonly message: string }) =>
  ConfigUnavailable.make({
    message: `Could not read rules from ${directory}: ${problem.message}`,
  });

export interface RuleEntry {
  readonly id: RuleId;
  readonly rule: Rule;
  readonly scope: string;
  readonly file?: string;
  /** The built-in preset the rule came from, by its whole name (effect for effect/basics), when it is not the project's own. */
  readonly preset?: string;
}

/**
 * A rule's id as output shows it: a preset's rule with the preset's name
 * first, as in effect/basics/gen-for-sequencing, so a report that
 * mixes presets with the project's own rules says where each came from. The
 * project's own rules show their `.adhere/` ids as they are.
 */
export const shownId = (entry: {
  readonly id: RuleId;
  readonly preset?: string | undefined;
}): string => (entry.preset === undefined ? entry.id : `${entry.preset}/${entry.id}`);

export type RuleSet = ReadonlyArray<RuleEntry>;

const ADHERE_SEGMENT = ".adhere";
const CACHE_SEGMENT = "cache";
/** Where in a `.adhere/` its rules sit, one to a directory. */
const RULES_PREFIX = "rules/";
/** The file in a rule's directory that is the rule: Markdown, or TypeScript that default-exports `defineRule({...})`. */
const RULE_FILES: ReadonlySet<string> = new Set(["RULE.md", "RULE.ts"]);

const normalized = (path: string): string => path.replaceAll("\\", "/");

const segmentsOf = (relative: string): ReadonlyArray<string> =>
  normalized(relative)
    .split("/")
    .filter((segment) => segment.length > 0);

/** A rule file, and its path in the directory it was read from. */
interface RuleFile {
  readonly id: RuleId;
  readonly leaf: string;
}

/**
 * The rules among `leaves`, the paths in `directory`, whose rules sit under
 * `prefix` one to a directory: `<id>/RULE.md` or `<id>/RULE.ts`. Anything else
 * in a rule's directory, such as a helper its RULE.ts imports, is not a rule.
 * A directory with both files refuses, and so does a Markdown file outside
 * every rule's directory, but a README.md: before rule directories, it was a
 * rule, and the refusal says where it goes now to keep its id.
 */
const ruleFilesIn = (
  directory: string,
  leaves: ReadonlyArray<string>,
  prefix: string,
): Effect.Effect<ReadonlyArray<RuleFile>, ConfigUnavailable> => {
  const files = leaves.flatMap((leaf): ReadonlyArray<RuleFile> => {
    const segments = segmentsOf(leaf.slice(prefix.length));
    return leaf.startsWith(prefix) && segments.length > 1 && RULE_FILES.has(segments.at(-1) ?? "")
      ? [{ id: segments.slice(0, -1).join("/"), leaf }]
      : [];
  });
  const both = files.find((file, index) => files.findIndex(({ id }) => id === file.id) < index);
  if (both !== undefined) {
    return Effect.fail(
      ConfigUnavailable.make({
        message: `${directory}/${prefix}${both.id}: a rule is a RULE.md or a RULE.ts, not both`,
      }),
    );
  }
  const homes = files.map(({ leaf }) => leaf.slice(0, leaf.lastIndexOf("/") + 1));
  const flat = leaves.filter((leaf) => {
    const name = segmentsOf(leaf).at(-1) ?? "";
    return (
      leaf.endsWith(".md") &&
      !RULE_FILES.has(name) &&
      name !== "README.md" &&
      !homes.some((home) => leaf.startsWith(home))
    );
  });
  if (flat.length > 0) {
    return Effect.fail(
      ConfigUnavailable.make({
        message: [
          `Rules now live one to a directory, as ${directory}/${prefix}<id>/RULE.md or RULE.ts. Move each of these to keep its id:`,
          ...flat.map(
            (leaf) =>
              `  ${directory}/${leaf} → ${directory}/${prefix}${leaf.slice(0, -".md".length)}/RULE.md`,
          ),
        ].join("\n"),
      }),
    );
  }
  return Effect.succeed(files);
};

/**
 * Whether the rule walk reads into a directory: on the way to a `.adhere/`,
 * not a skipped tree or `.git`; inside one, anything but its cache, since a
 * directory there such as `.adhere/rules/e2e/` is a rule topic.
 */
const entersForRules = (relative: string): boolean => {
  const segments = segmentsOf(relative);
  const name = segments.at(-1) ?? "";
  const adhere = segments.lastIndexOf(ADHERE_SEGMENT);
  if (adhere >= 0 && adhere < segments.length - 1) {
    return !(adhere === segments.length - 2 && name === CACHE_SEGMENT);
  }
  return name === ADHERE_SEGMENT || !(SKIPPED_DIRECTORIES.has(name) || name === ".git");
};

/**
 * Each `.adhere/` the walk found, by its path from the root, with the paths
 * of the files in it. Only the path to a `.adhere/` counts against skipped
 * trees: `.adhere/rules/e2e/` is a rule topic, not a skip.
 */
const adhereDirectoriesOf = (
  relatives: ReadonlyArray<string>,
): ReadonlyMap<string, ReadonlyArray<string>> => {
  const found = new Map<string, Array<string>>();
  for (const relative of relatives) {
    const segments = segmentsOf(relative);
    const adhere = segments.lastIndexOf(ADHERE_SEGMENT);
    if (adhere < 0 || segments.slice(0, adhere).some((name) => SKIPPED_DIRECTORIES.has(name))) {
      continue;
    }
    const directory = segments.slice(0, adhere + 1).join("/");
    found.set(directory, [...(found.get(directory) ?? []), segments.slice(adhere + 1).join("/")]);
  }
  return found;
};

const joinPath = (path: Path.Path, root: string, parts: ReadonlyArray<string>): string =>
  parts.reduce((current, part) => path.join(current, part), root);

const isInside = (file: string, scope: string): boolean =>
  file === scope || file.startsWith(`${scope}/`);

const moreSpecific = (a: RuleEntry, b: RuleEntry): RuleEntry =>
  normalized(a.scope).length >= normalized(b.scope).length ? a : b;

/**
 * A rule written in TypeScript: the file's default export, decoded as a
 * config's inline rule is, so a hook such as `appendState` comes with it.
 * Like a config, the file is imported, so its code runs.
 */
const importRule = Effect.fn("importRule")(function* (file: string) {
  const path = yield* Path.Path;
  const url = yield* path.toFileUrl(file).pipe(Effect.orDie);
  const loaded = yield* Effect.tryPromise({
    try: () => import(url.href) as Promise<{ readonly default?: unknown }>,
    catch: (cause) =>
      ConfigUnavailable.make({
        message: `Could not load ${file}: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  });
  return yield* Schema.decodeUnknownEffect(Rule)(loaded.default).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({
        message: `${file}: a rule file must default-export defineRule({...}): ${problem.message}`,
      }),
    ),
  );
});

/** A rule file's rule. A file that cannot be read refuses with the directory it was read from. */
const readRule = Effect.fn("readRule")(function* (file: string, directory: string) {
  if (file.endsWith(".ts")) return yield* importRule(file);
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString(file).pipe(Effect.mapError(refused(directory)));
  return yield* parseRuleMarkdown(text, file);
});

/**
 * Every rule under `directory`, validated and keyed by its directory's path
 * in it: `basics/gen/RULE.md` is the rule `basics/gen`.
 */
export const loadRules = Effect.fn("loadRules")(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* fs
    .readDirectory(directory, { recursive: true })
    .pipe(Effect.mapError(refused(directory)));
  const files = yield* ruleFilesIn(directory, entries.map(normalized).sort(), "");
  const rules = yield* Effect.forEach(files, ({ id, leaf }) =>
    Effect.map(readRule(path.join(directory, leaf), directory), (rule) => [id, rule] as const),
  );
  return Record.fromEntries(rules) as Readonly<Record<RuleId, Rule>>;
});

/**
 * Every rule in a `.adhere/rules/` under `root`, scoped to the directory that
 * holds its `.adhere/`: `packages/api/.adhere/rules/data/ports/RULE.md` is
 * `data/ports` for the files under `packages/api/`.
 */
export const loadAdhereRuleSet = Effect.fn("loadAdhereRuleSet")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const status = yield* Status;
  const entries = yield* clearingStatus(
    walkFiles(fs, path, root, entersForRules, (directories) =>
      status.show(
        `Looking for .adhere/ rules: ${countOf(directories, "directory", "directories")} read`,
      ),
    ),
  ).pipe(Effect.mapError(refused(root)));
  const found = yield* Effect.forEach(adhereDirectoriesOf(entries), ([adhere, leaves]) =>
    Effect.flatMap(ruleFilesIn(adhere, [...leaves].sort(), RULES_PREFIX), (files) => {
      const owner = segmentsOf(adhere).slice(0, -1);
      const scope = owner.length === 0 ? path.resolve(root) : joinPath(path, root, owner);
      return Effect.forEach(files, ({ id, leaf }) => {
        const file = joinPath(path, root, segmentsOf(`${adhere}/${leaf}`));
        return Effect.map(readRule(file, root), (rule): RuleEntry => ({ id, file, scope, rule }));
      });
    }),
  );
  return found.flat();
});

/** Rules as given, or loaded from the directory a source names. */
export const materializeRules = Effect.fn("materializeRules")(function* (
  source: RuleSource,
  base: string,
) {
  const path = yield* Path.Path;
  if (source instanceof URL) {
    return yield* loadRules(yield* path.fromFileUrl(source).pipe(Effect.orDie));
  }
  if (typeof source === "string") {
    return yield* loadRules(path.resolve(base, source));
  }
  return source;
});

export const globalRuleSet = (rules: Readonly<Record<RuleId, Rule>>, root: string) =>
  Object.entries(rules).map(([id, rule]): RuleEntry => ({ id, rule, scope: root }));

/**
 * The rules as a config's overrides leave them, each found by the id a report
 * names it with: a rule set `off` gone, and any other with the level and
 * threshold its override gives, over its own.
 */
export const withOverrides = (
  entries: RuleSet,
  overrides: Readonly<Record<string, Override>>,
): RuleSet =>
  entries.flatMap((entry) => {
    const override = overrides[shownId(entry)];
    if (override === undefined) return [entry];
    const { level, threshold }: Exclude<Override, string> =
      typeof override === "string" ? { level: override } : override;
    if (level === "off") return [];
    const rule: Rule = {
      ...entry.rule,
      ...(level === undefined ? {} : { level }),
      ...(threshold === undefined ? {} : { threshold }),
    };
    return [{ ...entry, rule }];
  });

/**
 * Whether a rule judges a file: a test file only when the rule says `tests`,
 * and any other file unless it says `tests: only`.
 */
export const judgesFile = (rule: Rule, test: boolean): boolean =>
  test ? rule.tests !== undefined : rule.tests !== "only";

/**
 * The flat rule map for one source file. Root rules apply everywhere. When a
 * nested `.adhere/` defines the same id, the deepest matching scope wins.
 */
export const applicableRules = (file: string, entries: RuleSet): Readonly<Record<RuleId, Rule>> => {
  const winners = new Map<RuleId, RuleEntry>();
  const normalizedFile = normalized(file);
  for (const entry of entries) {
    if (!isInside(normalizedFile, normalized(entry.scope))) continue;
    const previous = winners.get(entry.id);
    winners.set(entry.id, previous === undefined ? entry : moreSpecific(entry, previous));
  }
  return Record.fromEntries(
    [...winners.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, entry]) => [id, entry.rule] as const),
  ) as Readonly<Record<RuleId, Rule>>;
};
