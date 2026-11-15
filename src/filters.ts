import type { Rule, RuleFilter } from "#config.ts";
import { matchesGlob } from "node:path";

/** A repository path as every matcher here reads it: `/`-separated, without a leading `./`. */
export const normalizedPath = (path: string): string =>
  path.replaceAll("\\", "/").replace(/^\.\//, "");

interface CompiledSide {
  readonly names: ReadonlyArray<string>;
  readonly paths: ReadonlyArray<string>;
  readonly content: ReadonlyArray<RegExp>;
}

interface CompiledFilters {
  readonly include: CompiledSide;
  readonly exclude: CompiledSide;
  /** The paths a config's override narrows the rule to, beside the rule's own. */
  readonly override: ReadonlyArray<string>;
}

type Filtered = Pick<Rule, "include" | "exclude" | "overridePaths">;

const compiled = new WeakMap<Filtered, CompiledFilters>();

const compileSide = (filter: RuleFilter | undefined): CompiledSide => ({
  names: filter?.names ?? [],
  paths: (filter?.paths ?? []).map(normalizedPath),
  // Validated when the rule was decoded, so this cannot throw here.
  content: (filter?.content ?? []).map((source) => new RegExp(source)),
});

/**
 * A rule's filters, compiled once per rule: its name globs as written, its
 * path globs with `/` separators, and its content patterns as regular
 * expressions. Both sides are kept, since `include` and `exclude` differ only
 * in what a match means.
 */
export const compiledFiltersOf = (rule: Filtered): CompiledFilters => {
  const held = compiled.get(rule);
  if (held !== undefined) return held;
  const filters = {
    include: compileSide(rule.include),
    exclude: compileSide(rule.exclude),
    override: (rule.overridePaths ?? []).map(normalizedPath),
  };
  compiled.set(rule, filters);
  return filters;
};

/** Whether a rule has any filter, its own or an override's, so a run can leave unfiltered rules untouched. */
export const hasFilters = (rule: Filtered): boolean =>
  rule.include !== undefined || rule.exclude !== undefined || rule.overridePaths !== undefined;

/** Whether a rule's content patterns, if any, need the file's text to decide. */
export const filtersNeedText = (rule: Filtered): boolean => {
  const { include, exclude } = compiledFiltersOf(rule);
  return include.content.length > 0 || exclude.content.length > 0;
};

const matchesAny = (value: string, patterns: ReadonlyArray<string>): boolean =>
  patterns.some((pattern) => matchesGlob(value, pattern));

/**
 * Whether a repository-relative path passes a rule's name and path filters,
 * which need no text: `include.names` must match the file's own name, its
 * last segment, and `include.paths` the whole path, each only when it has
 * entries, and any `exclude.names` or `exclude.paths` match drops the file
 * even when it matched. A config override's paths narrow the rule further:
 * they must match too, so an override never widens what a rule takes.
 */
export const pathsPass = (rule: Rule, relativePath: string): boolean => {
  const { include, exclude, override } = compiledFiltersOf(rule);
  const path = normalizedPath(relativePath);
  const name = path.slice(path.lastIndexOf("/") + 1);
  return (
    (include.names.length === 0 || matchesAny(name, include.names)) &&
    (include.paths.length === 0 || matchesAny(path, include.paths)) &&
    (override.length === 0 || matchesAny(path, override)) &&
    !matchesAny(name, exclude.names) &&
    !matchesAny(path, exclude.paths)
  );
};

/**
 * Whether a rule's content filters allow `text`, the file as written: any
 * `include` entry matches, and no `exclude` entry does. A file's name and
 * path cannot change between planning and execution, so reloading a file
 * rechecks only this half.
 */
export const contentPasses = (rule: Rule, text: string): boolean => {
  const { include, exclude } = compiledFiltersOf(rule);
  return (
    (include.content.length === 0 || include.content.some((pattern) => pattern.test(text))) &&
    !(exclude.content.length > 0 && exclude.content.some((pattern) => pattern.test(text)))
  );
};

/**
 * Whether a rule applies to a file at a repository-relative path whose text
 * is `text`: `pathsPass` and `contentPasses`. An `include` category that is
 * set must match, while a match in any `exclude` category drops the file.
 */
export const ruleAppliesTo = (rule: Rule, relativePath: string, text: string): boolean =>
  pathsPass(rule, relativePath) && contentPasses(rule, text);
