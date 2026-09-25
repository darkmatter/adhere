import type { Rule } from "#config.ts";
import { judgesFile, type RuleEntry, shownId } from "#rules.ts";
import { Jev, type Pair } from "#services/Jev.ts";
import { Effect } from "effect";

export interface Contradiction {
  readonly first: RuleEntry;
  readonly second: RuleEntry;
  /** Jev's probability that no code can follow both rules. */
  readonly probability: number;
}

const normalized = (path: string): string => path.replaceAll("\\", "/");

const scopesOverlap = (a: string, b: string): boolean => {
  const first = normalized(a);
  const second = normalized(b);
  return first === second || first.startsWith(`${second}/`) || second.startsWith(`${first}/`);
};

/** Whether two rules judge any of the same kind of file: a rule on tests only shares none with one that skips them. */
const judgeSameKind = (a: Rule, b: Rule): boolean =>
  (judgesFile(a, true) && judgesFile(b, true)) || (judgesFile(a, false) && judgesFile(b, false));

/**
 * Per rule, the rules that apply to some of the same files. A rule with the
 * same id is left out: a nested rule that shares an id shadows the other on
 * purpose.
 */
const partnersOf = (entries: ReadonlyArray<RuleEntry>): ReadonlyArray<ReadonlyArray<number>> =>
  entries.map((first, index) =>
    entries.flatMap((second, other) =>
      other !== index &&
      first.id !== second.id &&
      scopesOverlap(first.scope, second.scope) &&
      judgeSameKind(first.rule, second.rule)
        ? [other]
        : [],
    ),
  );

/** Each pair Jev named once, lower index first. */
const distinctPairs = (named: ReadonlyArray<Pair>): ReadonlyArray<Pair> => {
  const pairs = new Map<string, Pair>();
  for (const [rule, partner] of named) {
    const pair: Pair = rule < partner ? [rule, partner] : [partner, rule];
    pairs.set(`${pair[0]}-${pair[1]}`, pair);
  }
  return [...pairs.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

/**
 * Pairs of rules that apply to the same files and that Jev judges no code can
 * follow both of, above `threshold`. Jev first names, per rule, which rule
 * sharing its files it conflicts with, then gives each named pair a
 * probability. Nothing is sent when no two rules share files, so such a run
 * needs no API key.
 */
export const findContradictions = Effect.fn("findContradictions")(function* (
  entries: ReadonlyArray<RuleEntry>,
  threshold: number,
) {
  const none: ReadonlyArray<Contradiction> = [];
  const partners = partnersOf(entries);
  if (partners.every((some) => some.length === 0)) return none;
  const jev = yield* Jev;
  const pairs = distinctPairs(yield* jev.conflicts(entries, partners));
  if (pairs.length === 0) return none;
  const probabilities = yield* jev.contradicts(entries, pairs);
  return pairs.flatMap(([first, second], index): ReadonlyArray<Contradiction> => {
    const one = entries[first];
    const other = entries[second];
    const probability = probabilities[index] ?? 0;
    return one !== undefined && other !== undefined && probability > threshold
      ? [{ first: one, second: other, probability }]
      : [];
  });
});

/** Where a rule lives: a preset's names the preset in its id; the project's own rule names its file. */
const locationOf = (entry: RuleEntry): string =>
  entry.preset === undefined ? `${entry.id} (${entry.file ?? entry.scope})` : shownId(entry);

export const formatContradictions = (contradictions: ReadonlyArray<Contradiction>): string => {
  if (contradictions.length === 0) {
    return "No contradictions found among configured rules.";
  }
  return [
    `Found ${contradictions.length} contradiction${
      contradictions.length === 1 ? "" : "s"
    } among configured rules:`,
    "",
    ...contradictions.flatMap((contradiction, index) => [
      `${index + 1}. No code can follow both (${contradiction.probability.toFixed(2)}):`,
      `   - ${locationOf(contradiction.first)}`,
      `     ${contradiction.first.rule.description}`,
      `   - ${locationOf(contradiction.second)}`,
      `     ${contradiction.second.rule.description}`,
      "",
    ]),
    "Resolve by editing one rule, narrowing a nested rule's scope, or using the same rule id when the nested rule is meant to shadow the root rule.",
  ].join("\n");
};
