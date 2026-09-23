import { type Example, examplesOf, type Rule } from "#config.ts";
import type { RuleEntry } from "#rules.ts";

type Word = Example["word"];

/**
 * A way a rule's wording differs from the README's rule writing tips, which
 * the eval measured: the rule shows code of both kinds, and its description
 * says the words its code is under.
 */
export type Straying =
  /** The rule has code under `word`, and its description does not say it. */
  | { readonly _tag: "Unsaid"; readonly word: Word }
  /** The rule has code to write, and no example under `word` of code that breaks it. */
  | { readonly _tag: "Unshown"; readonly word: Word }
  /** The description says `word`, which belongs to the other kind of rule. */
  | { readonly _tag: "Mixed"; readonly word: Word };

/** A rule whose wording differs from the tips, with each way it does. */
export interface Stray {
  readonly entry: RuleEntry;
  readonly straying: ReadonlyArray<Straying>;
}

export const TIPS_URL = "https://github.com/darkmatter/adhere#rule-writing-tips";

/** Whether a description says a word, whole and in any case: "Must" does, "mustard" does not. */
const says = (description: string, word: Word): boolean =>
  new RegExp(`\\b${word.replace(" ", "\\s+")}\\b`, "i").test(description);

/**
 * How one rule strays from the tips. A rule with only code that breaks it
 * lacks no example: the README keeps that for a rule with no single correct
 * form to show.
 */
export const strayingOf = (rule: Rule): ReadonlyArray<Straying> => {
  const { good, bad } = examplesOf(rule);
  const guideline = good?.word === "should" || bad?.word === "should not";
  const shown = [good, bad].flatMap((example) => (example === undefined ? [] : [example.word]));
  const unshown: ReadonlyArray<Word> =
    good !== undefined && bad === undefined ? [guideline ? "should not" : "never"] : [];
  // "should" also finds "should not", so a requirement is checked for the one word.
  const others: ReadonlyArray<Word> = guideline ? ["must", "never"] : ["should"];
  return [
    ...shown
      .filter((word) => !says(rule.description, word))
      .map((word): Straying => ({ _tag: "Unsaid", word })),
    ...unshown.map((word): Straying => ({ _tag: "Unshown", word })),
    ...others
      .filter((word) => says(rule.description, word))
      .map((word): Straying => ({ _tag: "Mixed", word })),
  ];
};

/** The rules that stray, in the order given. */
export const straysAmong = (entries: ReadonlyArray<RuleEntry>): ReadonlyArray<Stray> =>
  entries.flatMap((entry) => {
    const straying = strayingOf(entry.rule);
    return straying.length === 0 ? [] : [{ entry, straying }];
  });

/** One way a rule strays, as a sentence. */
const sentenceOf = (straying: Straying): string => {
  switch (straying._tag) {
    case "Unsaid":
      return `The description does not say "${straying.word}", though the rule has a ${straying.word} example.`;
    case "Unshown":
      return `The rule has no ${straying.word} example. Rules with one example of each kind judge best.`;
    case "Mixed":
      return straying.word === "should"
        ? `The description says "should", a guideline's word, but the rule is a requirement.`
        : `The description says "${straying.word}", a requirement's word, but the rule is a guideline.`;
  }
};

const displayPath = (file: string, root: string): string =>
  file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;

/** The wording part of `adhere validate`'s report: each rule that strays, then how. */
export const formatStrays = (strays: ReadonlyArray<Stray>, root: string): ReadonlyArray<string> =>
  strays.length === 0
    ? ["Every rule is worded as the rule writing tips recommend."]
    : [
        `${strays.length} ${strays.length === 1 ? "rule is" : "rules are"} not worded as the rule writing tips recommend:`,
        ...strays.flatMap(({ entry, straying }) => [
          `  ${entry.id}${entry.file === undefined ? "" : ` (${displayPath(entry.file, root)})`}`,
          ...straying.map((one) => `    ${sentenceOf(one)}`),
        ]),
        `Rule writing tips: ${TIPS_URL}`,
      ];
