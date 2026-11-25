/**
 * Every rule the pinned oxlint version knows, with the ID its configuration
 * accepts, and the one-line description from the rule's documentation.
 *
 * `catalog.json` is generated from the installed `oxlint --rules --format=json`
 * and the docs pages by `bun scripts/oxlint-catalog.ts`; CI rejects a snapshot
 * that drifts with `bun run oxlint:catalog:check`. Never edit it by hand.
 */
import { Schema } from "effect";
import catalogJson from "./catalog.json" with { type: "json" };

/** The category oxlint groups a rule under; a config can enable a whole one. */
export const OxlintCategory = Schema.Literals([
  "correctness",
  "nursery",
  "pedantic",
  "perf",
  "restriction",
  "style",
  "suspicious",
]);
export type OxlintCategory = typeof OxlintCategory.Type;

/** How oxlint reports a rule's availability for `--fix`. */
export const OxlintFix = Schema.Literals([
  "conditional_dangerous_fix",
  "conditional_dangerous_fix_or_suggestion",
  "conditional_fix",
  "conditional_safe_fix_or_suggestion",
  "conditional_suggestion",
  "fixable_dangerous_fix",
  "fixable_dangerous_fix_or_suggestion",
  "fixable_dangerous_suggestion",
  "fixable_fix",
  "fixable_safe_fix_or_suggestion",
  "fixable_suggestion",
  "none",
  "pending",
]);
export type OxlintFix = typeof OxlintFix.Type;

export const OxlintRule = Schema.Struct({
  /** The ID a `.oxlintrc.json` `rules` entry uses. */
  id: Schema.String,
  category: OxlintCategory,
  /** True for native type-aware rules; a JavaScript plugin cannot be one. */
  typeAware: Schema.Boolean,
  fix: OxlintFix,
  /** Whether oxlint enables the rule without configuration. */
  default: Schema.Boolean,
  docsUrl: Schema.String,
  /** The rule's "What it does" paragraph from `docsUrl`. */
  summary: Schema.String,
});
export type OxlintRule = typeof OxlintRule.Type;

export const OxlintCatalog = Schema.Struct({
  /** The oxlint version the snapshot was generated from. */
  version: Schema.String,
  rules: Schema.Array(OxlintRule),
});
export type OxlintCatalog = typeof OxlintCatalog.Type;

export const oxlintCatalog: OxlintCatalog = Schema.decodeUnknownSync(OxlintCatalog)(catalogJson);

export const oxlintRuleIds: readonly string[] = oxlintCatalog.rules.map((rule) => rule.id);

const rulesById = new Map(oxlintCatalog.rules.map((rule) => [rule.id, rule] as const));

export function oxlintRule(id: string): OxlintRule | undefined {
  return rulesById.get(id);
}
