import type { Finding, ScannedFile } from "#models/Audit.ts";

interface RuleText {
  readonly topic: string;
  readonly rule: string;
  /** What is wrong when this rule matches. Printed as the diagnostic message. */
  readonly message: string;
  /** How to fix it. Printed on the hint line. */
  readonly help: string;
}

/** A line test decides this rule. The match is the finding; Jev is not asked. */
export interface DeterministicRule extends RuleText {
  readonly judged?: false;
  readonly test: (line: string) => boolean;
  /** 0-based index of the span to underline, or -1 when the line does not match. */
  readonly at: (line: string) => number;
}

/** No line test can decide this rule. Jev sees the file and this pattern. */
export interface JudgedRule extends RuleText {
  readonly judged: true;
  /** The pattern Jev judges the file against. */
  readonly pattern: string;
}

/** One entry in `adhere.config.ts`. */
export type ConfiguredRule = DeterministicRule | JudgedRule;

const isDeterministic = (rule: ConfiguredRule): rule is DeterministicRule =>
  rule.judged !== true;

const isJudged = (rule: ConfiguredRule): rule is JudgedRule =>
  rule.judged === true;

/** The rule list a config file default-exports. */
export const defineConfig = (rules: ReadonlyArray<ConfiguredRule>) => rules;

/** A line test plus the column of the earliest needle, for the code frame. */
export const includes = (...needles: ReadonlyArray<string>) => {
  const at = (line: string): number => {
    let found = -1;
    for (const needle of needles) {
      const index = line.indexOf(needle);
      if (index >= 0 && (found < 0 || index < found)) found = index;
    }
    return found;
  };
  return { test: (line: string) => at(line) >= 0, at };
};

/** What the cache fingerprints, so an edited rule drops stored verdicts. */
export const describeRule = (rule: ConfiguredRule): string =>
  [
    `${rule.topic}/${rule.rule}`,
    rule.message,
    rule.help,
    isJudged(rule) ? `jev\n${rule.pattern}` : "rule",
  ].join("\n");

/** A line-test match, including the topic the rule belongs to. */
export interface LineHit extends Finding {
  readonly topic: string;
}

/** Line-test findings in one file. Judged rules are not included. */
export const lineFindings = (
  rules: ReadonlyArray<ConfiguredRule>,
  file: ScannedFile,
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<LineHit> => {
  const active = rules
    .filter(isDeterministic)
    .filter((rule) => wanted === undefined || wanted.has(rule.topic));
  const found: Array<LineHit> = [];
  for (const [index, line] of file.lines.entries()) {
    const seen = new Set<string>();
    for (const hit of active) {
      if (seen.has(hit.topic) || !hit.test(line)) continue;
      seen.add(hit.topic);
      const indent = line.length - line.trimStart().length;
      const snippet = line.trim().slice(0, 120);
      const raw = hit.at(line);
      const column = raw < indent ? 1 : raw - indent + 1;
      found.push({
        topic: hit.topic,
        rule: hit.rule,
        message: hit.message,
        help: hit.help,
        line: index + 1,
        column: Math.min(column, Math.max(snippet.length, 1)),
        snippet,
      });
    }
  }
  return found;
};

/** Judged rules whose topic is in scope. */
export const judgedRules = (
  rules: ReadonlyArray<ConfiguredRule>,
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<JudgedRule> =>
  rules
    .filter(isJudged)
    .filter((rule) => wanted === undefined || wanted.has(rule.topic));

/** True when a loaded config value is a rule. */
export const isConfiguredRule = (value: unknown): value is ConfiguredRule => {
  if (typeof value !== "object" || value === null) return false;
  const rule = value as ConfiguredRule;
  if (
    typeof rule.topic !== "string" ||
    typeof rule.rule !== "string" ||
    typeof rule.message !== "string" ||
    typeof rule.help !== "string"
  ) {
    return false;
  }
  if (rule.judged === true) return typeof rule.pattern === "string";
  return typeof rule.test === "function" && typeof rule.at === "function";
};
