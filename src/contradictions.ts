import type { RuleEntry } from "#rules.ts";

export interface Contradiction {
  readonly first: RuleEntry;
  readonly second: RuleEntry;
  readonly reason: string;
}

type Polarity = "positive" | "negative";

const NEGATIVE = /\b(?:avoid|do not|don't|must not|never|no|should not)\b/gi;
const POSITIVE = /\b(?:always|must|prefer|require|requires|required|should|use)\b/gi;
const NEGATIVE_WORD = /\b(?:avoid|do not|don't|must not|never|no|should not)\b/i;
const POSITIVE_WORD = /\b(?:always|must|prefer|require|requires|required|should|use)\b/i;
const FILLER = /\b(?:a|an|the|for|to|with|by|in|of)\b/gi;

const normalized = (path: string): string => path.replaceAll("\\", "/");

const scopesOverlap = (a: string, b: string): boolean => {
  const first = normalized(a);
  const second = normalized(b);
  return (
    first === second ||
    first.startsWith(`${second}/`) ||
    second.startsWith(`${first}/`)
  );
};

const polarityOf = (text: string): Polarity | undefined => {
  if (NEGATIVE_WORD.test(text)) return "negative";
  if (POSITIVE_WORD.test(text)) return "positive";
  return undefined;
};

const topicOf = (text: string): string =>
  text
    .toLowerCase()
    .replaceAll(NEGATIVE, " ")
    .replaceAll(POSITIVE, " ")
    .replaceAll(FILLER, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const contradicts = (first: RuleEntry, second: RuleEntry): boolean => {
  if (first.id === second.id) return false;
  if (!scopesOverlap(first.scope, second.scope)) return false;
  const firstPolarity = polarityOf(first.rule.description);
  const secondPolarity = polarityOf(second.rule.description);
  if (
    firstPolarity === undefined ||
    secondPolarity === undefined ||
    firstPolarity === secondPolarity
  ) {
    return false;
  }
  const firstTopic = topicOf(first.rule.description);
  const secondTopic = topicOf(second.rule.description);
  return firstTopic.length > 0 && firstTopic === secondTopic;
};

export const findContradictions = (
  entries: ReadonlyArray<RuleEntry>,
): ReadonlyArray<Contradiction> => {
  const contradictions: Array<Contradiction> = [];
  for (let i = 0; i < entries.length; i++) {
    const first = entries[i];
    if (first === undefined) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const second = entries[j];
      if (second === undefined || !contradicts(first, second)) continue;
      contradictions.push({
        first,
        second,
        reason:
          "overlapping scopes contain opposite textual directives for the same topic",
      });
    }
  }
  return contradictions;
};

const locationOf = (entry: RuleEntry): string =>
  `${entry.id} (${entry.file ?? entry.scope})`;

export const formatContradictions = (
  contradictions: ReadonlyArray<Contradiction>,
): string => {
  if (contradictions.length === 0) {
    return "No contradictions found among configured rules.";
  }
  return [
    `Found ${contradictions.length} contradiction${
      contradictions.length === 1 ? "" : "s"
    } among configured rules:`,
    "",
    ...contradictions.flatMap((contradiction, index) => [
      `${index + 1}. ${contradiction.reason}`,
      `   - ${locationOf(contradiction.first)}`,
      `     ${contradiction.first.rule.description}`,
      `   - ${locationOf(contradiction.second)}`,
      `     ${contradiction.second.rule.description}`,
      "",
    ]),
    "Resolve by editing one rule, narrowing a nested rule's scope, or using the same rule id when the nested rule is meant to shadow the root rule.",
  ].join("\n");
};
