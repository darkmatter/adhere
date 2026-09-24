import {
  ConfigUnavailable,
  type Rule,
  type RuleId,
  type RuleSource,
  SKIPPED_DIRECTORIES,
} from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { walkFiles } from "#walk.ts";
import { Effect, FileSystem, Path, Record } from "effect";

const refused = (directory: string) => (problem: { readonly message: string }) =>
  ConfigUnavailable.make({
    message: `Could not read rules from ${directory}: ${problem.message}`,
  });

export interface RuleEntry {
  readonly id: RuleId;
  readonly rule: Rule;
  readonly scope: string;
  readonly file?: string;
  /** The built-in rule set the rule came from, when it is not the project's own. */
  readonly preset?: string;
}

export type RuleSet = ReadonlyArray<RuleEntry>;

const ADHERE_SEGMENT = ".adhere";
const CACHE_SEGMENT = "cache";

const normalized = (path: string): string => path.replaceAll("\\", "/");

const segmentsOf = (relative: string): ReadonlyArray<string> =>
  normalized(relative)
    .split("/")
    .filter((segment) => segment.length > 0);

const isMarkdown = (path: string): boolean => path.endsWith(".md");

/**
 * Whether the rule walk reads into a directory: on the way to a `.adhere/`,
 * not a skipped tree or `.git`; inside one, anything but its cache, since a
 * directory there such as `.adhere/e2e/` is a rule topic.
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

const isNestedRuleFile = (relative: string): boolean => {
  const segments = segmentsOf(relative);
  const adhere = segments.lastIndexOf(ADHERE_SEGMENT);
  return (
    adhere >= 0 &&
    segments[adhere + 1] !== CACHE_SEGMENT &&
    isMarkdown(relative) &&
    // Only the path to the `.adhere/`: `.adhere/e2e/` is a rule topic, not a skip.
    !segments.slice(0, adhere).some((segment) => SKIPPED_DIRECTORIES.has(segment))
  );
};

const rulePathOf = (segments: ReadonlyArray<string>): ReadonlyArray<string> => {
  const adhere = segments.lastIndexOf(ADHERE_SEGMENT);
  return adhere < 0 ? [] : segments.slice(adhere + 1);
};

const scopePathOf = (segments: ReadonlyArray<string>): ReadonlyArray<string> => {
  const adhere = segments.lastIndexOf(ADHERE_SEGMENT);
  return adhere < 0 ? [] : segments.slice(0, adhere);
};

const ruleIdOf = (relative: string): RuleId => {
  const rulePath = rulePathOf(segmentsOf(relative));
  const leaf = rulePath.join("/");
  return leaf.slice(0, -".md".length);
};

const joinPath = (path: Path.Path, root: string, parts: ReadonlyArray<string>): string =>
  parts.reduce((current, part) => path.join(current, part), root);

const scopedRule = (path: Path.Path, root: string, relative: string, rule: Rule): RuleEntry => {
  const segments = segmentsOf(relative);
  const scopeParts = scopePathOf(segments);
  const scope = scopeParts.length === 0 ? path.resolve(root) : joinPath(path, root, scopeParts);
  const file = joinPath(path, root, segments);
  return { id: ruleIdOf(relative), file, scope, rule };
};

const isInside = (file: string, scope: string): boolean =>
  file === scope || file.startsWith(`${scope}/`);

const moreSpecific = (a: RuleEntry, b: RuleEntry): RuleEntry =>
  normalized(a.scope).length >= normalized(b.scope).length ? a : b;

/**
 * Every `*.md` file under `directory`, validated and keyed by its path
 * relative to the directory without the extension: `basics/gen.md` is the
 * rule `basics/gen`.
 */
export const loadRules = Effect.fn("loadRules")(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* fs
    .readDirectory(directory, { recursive: true })
    .pipe(Effect.mapError(refused(directory)));
  const files = entries.filter((entry) => entry.endsWith(".md")).sort();
  const rules = yield* Effect.forEach(files, (relative) =>
    Effect.gen(function* () {
      const file = path.join(directory, relative);
      const text = yield* fs.readFileString(file).pipe(Effect.mapError(refused(directory)));
      const id: RuleId = relative.slice(0, -".md".length).split(path.sep).join("/");
      return [id, yield* parseRuleMarkdown(text, file)] as const;
    }),
  );
  return Record.fromEntries(rules) as Readonly<Record<RuleId, Rule>>;
});

/** Every nested `.adhere/` rule under `root`, scoped to its owner directory. */
export const loadAdhereRuleSet = Effect.fn("loadAdhereRuleSet")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* walkFiles(fs, path, root, entersForRules).pipe(
    Effect.mapError(refused(root)),
  );
  const files = entries.filter(isNestedRuleFile);
  return yield* Effect.forEach(files, (relative) =>
    Effect.gen(function* () {
      const file = joinPath(path, root, segmentsOf(relative));
      const text = yield* fs.readFileString(file).pipe(Effect.mapError(refused(root)));
      return scopedRule(path, root, relative, yield* parseRuleMarkdown(text, file));
    }),
  );
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
