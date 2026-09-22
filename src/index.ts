export {
  type AdhereConfig,
  type Config,
  ConfigUnavailable,
  defineConfig,
  type Preset,
  type Rule,
  type RuleId,
  type Rules,
  type RuleSource,
} from "#config.ts";
export {
  findContradictions,
  formatContradictions,
  type Contradiction,
} from "#contradictions.ts";
export { initProject, type InitOptions, type InitResult } from "#init.ts";
export { parseRuleMarkdown } from "#markdown.ts";
export { type PresetName, presetNames } from "#presets.ts";
export {
  applicableRules,
  globalRuleSet,
  loadAdhereRuleSet,
  loadRules,
  type RuleEntry,
  type RuleSet,
} from "#rules.ts";
