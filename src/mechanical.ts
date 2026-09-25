import type { Rule } from "#config.ts";
import { type RuleEntry, shownId } from "#rules.ts";
import { AuditCache, sha256, type Tally } from "#services/AuditCache.ts";
import { linterQuestion } from "#services/Jev.ts";
import { Effect } from "effect";

/**
 * The linter check asks, beside a rule's judge question, whether a regular
 * linter could have decided the file against the rule. The answer is about
 * the rule, so lint asks it on this many files per rule and then stops.
 */
export const SAMPLE = 10;

/** A tally's key: the model and the question, which carries the rule, so an edited rule starts over. */
export const tallyKeyOf = (model: string, rule: Rule) =>
  sha256(`${model}\u0000${JSON.stringify(linterQuestion(rule))}`);

/** A rule and its linter check so far: the files lint asked on, and how many Jev said a linter could check. */
export interface Tallied {
  readonly entry: RuleEntry;
  readonly asked: number;
  readonly flagged: number;
}

export const talliedOf = (entry: RuleEntry, tally: Tally | undefined): Tallied => {
  const answers = Object.values(tally?.files ?? {});
  return { entry, asked: answers.length, flagged: answers.filter((p) => p > 0.5).length };
};

/** The project's rules with their tallies. A preset's rules are left out: they are not the user's to change. */
export const tallyProjectRules = Effect.fn("mechanical.tally")(function* (
  entries: ReadonlyArray<RuleEntry>,
  model: string,
) {
  const cache = yield* AuditCache;
  return yield* Effect.forEach(
    entries.filter((entry) => entry.preset === undefined),
    (entry) =>
      Effect.map(Effect.flatMap(tallyKeyOf(model, entry.rule), cache.tally), (tally) =>
        talliedOf(entry, tally),
      ),
  );
});

/**
 * Of a full sample, the share Jev said a linter could check: from 0.7 a
 * linter should probably check the rule, and from 0.3 the rule reads
 * differently from file to file.
 */
const LINTER = 0.7;
const MIXED = 0.3;

const displayPath = (file: string, root: string): string =>
  file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;

/** One flagged rule's advice, from its tally. */
const adviceOf = ({ asked, flagged }: Tallied): string =>
  flagged >= LINTER * asked
    ? `Flagged on ${flagged} of ${asked} files: a regular linter should probably check this rule.`
    : `Flagged on ${flagged} of ${asked} files: say more precisely what the rule applies to.`;

/** The linter check's part of `adhere validate`'s report: each rule it flags, then any it has too few answers for. */
export const formatLinterCheck = (
  tallied: ReadonlyArray<Tallied>,
  root: string,
): ReadonlyArray<string> => {
  if (tallied.length === 0) return [];
  const sampled = tallied.filter((one) => one.asked >= SAMPLE);
  const flagged = sampled.filter((one) => one.flagged >= MIXED * one.asked);
  const waiting = tallied.length - sampled.length;
  return [
    ...(flagged.length === 0
      ? sampled.length === 0
        ? []
        : ["The linter check flags no rule."]
      : [
          `${flagged.length} ${flagged.length === 1 ? "rule" : "rules"} flagged by the linter check:`,
          ...flagged.flatMap((one) => [
            `  ${shownId(one.entry)}${one.entry.file === undefined ? "" : ` (${displayPath(one.entry.file, root)})`}`,
            `    ${adviceOf(one)}`,
          ]),
        ]),
    ...(waiting === 0
      ? []
      : [
          `${waiting} ${waiting === 1 ? "rule has" : "rules have"} fewer than ${SAMPLE} answers from lint yet, which asks as it judges files.`,
        ]),
  ];
};
