import type { Rule, RuleFilter } from "#config.ts";
import { matchesGlob } from "node:path";

/** A repository path as every matcher here reads it: `/`-separated, without a leading `./`. */
export const normalizedPath = (path: string): string =>
  path.replaceAll("\\", "/").replace(/^\.\//, "");

interface CompiledSide {
  readonly paths: ReadonlyArray<string>;
  readonly content: ReadonlyArray<RegExp>;
}

interface CompiledFilters {
  readonly include: CompiledSide;
  readonly exclude: CompiledSide;
}

const compiled = new WeakMap<Pick<Rule, "include" | "exclude">, CompiledFilters>();

const compileSide = (filter: RuleFilter | undefined): CompiledSide => ({
  paths: (filter?.paths ?? []).map(normalizedPath),
  // Validated when the rule was decoded, so this cannot throw here.
  content: (filter?.content ?? []).map((source) => new RegExp(source)),
});

/**
 * A rule's filters, compiled once per rule: its globs with `/` separators, and
 * its content patterns as regular expressions. Both sides are kept, since
 * `include` and `exclude` differ only in what a match means.
 */
export const compiledFiltersOf = (rule: Pick<Rule, "include" | "exclude">): CompiledFilters => {
  const held = compiled.get(rule);
  if (held !== undefined) return held;
  const filters = { include: compileSide(rule.include), exclude: compileSide(rule.exclude) };
  compiled.set(rule, filters);
  return filters;
};

/** Whether a rule has either filter, so a run can leave unfiltered rules untouched. */
export const hasFilters = (rule: Pick<Rule, "include" | "exclude">): boolean =>
  rule.include !== undefined || rule.exclude !== undefined;

/** Whether a rule's content patterns, if any, need the file's text to decide. */
export const filtersNeedText = (rule: Pick<Rule, "include" | "exclude">): boolean => {
  const { include, exclude } = compiledFiltersOf(rule);
  return include.content.length > 0 || exclude.content.length > 0;
};

const matchesAnyPath = (path: string, patterns: ReadonlyArray<string>): boolean =>
  patterns.some((pattern) => matchesGlob(path, pattern));

/**
 * Whether a repository-relative path passes a rule's path filters alone: an
 * `include.paths` list must match when it has entries, and any
 * `exclude.paths` match drops the file even when it matched.
 */
export const pathsPass = (rule: Rule, relativePath: string): boolean => {
  const { include, exclude } = compiledFiltersOf(rule);
  const path = normalizedPath(relativePath);
  return (
    (include.paths.length === 0 || matchesAnyPath(path, include.paths)) &&
    !(exclude.paths.length > 0 && matchesAnyPath(path, exclude.paths))
  );
};

/**
 * Whether a rule's content filters allow `text`, the file as written: any
 * `include` entry matches, and no `exclude` entry does. A path fix for one
 * file cannot change between planning and execution, so reloading a file
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
