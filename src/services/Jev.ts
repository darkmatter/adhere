import type { Rule, RuleId } from "#config.ts";
import { Context, type Effect, Record, Schema } from "effect";

export type Rules = Readonly<Record<RuleId, Rule>>;

export class JevUnavailable extends Schema.TaggedError<JevUnavailable>()(
  "JevUnavailable",
  { message: Schema.String },
) {}

/**
 * Jev, TypeSafe's System One model. `code` is the file with numbered lines,
 * `N | text`. One call covers every rule passed to it.
 */
export class Jev extends Context.Service<
  Jev,
  {
    readonly judge: (
      code: string,
      rules: Rules,
    ) => Effect.Effect<Record<RuleId, number>, JevUnavailable>;
    readonly locate: (
      code: string,
      rules: Rules,
    ) => Effect.Effect<Record<RuleId, number>, JevUnavailable>;
  }
>()("@darkmatter/adhere/services/Jev") {}

/** A `choice` question accepts at most this many criteria. */
const CHOICE_LIMIT = 255;
/** Lines per block when a file has too many lines for one `choice`. */
const BLOCK = 20;
/** Longer files cannot be located in two steps and are skipped. */
export const MAX_LINES = CHOICE_LIMIT * BLOCK;

export const numbered = (lines: ReadonlyArray<string>): string =>
  lines.map((line, index) => `${index + 1} | ${line}`).join("\n");

export const snippetOf = (line: string): string => line.trim().slice(0, 120);

const isBlank = (line: string): boolean => line.trim().length === 0;

/** Line texts of numbered code; index 0 is line 1. */
const lineTexts = (code: string): ReadonlyArray<string> =>
  code.split("\n").map((row) => row.slice(row.indexOf(" | ") + 3));

export const needsBlocks = (code: string): boolean =>
  lineTexts(code).filter((line) => !isBlank(line)).length > CHOICE_LIMIT;

const stateOf = (code: string, rules: Rules) => ({
  code,
  rules: Record.map(rules, ({ description, reference }) => ({
    description,
    reference,
  })),
});

/** Non-blank lines `from`..`to` (1-based, inclusive), keyed by line number. */
const lineCriteria = (
  lines: ReadonlyArray<string>,
  from: number,
  to: number,
): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (let n = from; n <= Math.min(to, lines.length); n++) {
    const text = lines[n - 1] ?? "";
    if (!isBlank(text)) criteria[String(n)] = snippetOf(text);
  }
  return criteria;
};

export const judgeBody = (model: string, code: string, rules: Rules) => ({
  model,
  state: stateOf(code, rules),
  questions: Record.map(rules, (_, id) => ({
    type: "noul" as const,
    instructions: `Does state.code diverge from the pattern shown in state.rules["${id}"].reference, as described by state.rules["${id}"].description? Answer no if the pattern does not apply to this file.`,
  })),
});

/**
 * One `choice` over the file's non-blank lines per rule. With `blocks`, each
 * rule's choice is limited to the lines of the block chosen for it.
 */
export const locateBody = (
  model: string,
  code: string,
  rules: Rules,
  blocks?: Readonly<Record<RuleId, number>>,
) => {
  const lines = lineTexts(code);
  return {
    model,
    state: stateOf(code, rules),
    questions: Record.map(rules, (_, id) => {
      const block = blocks?.[id];
      return {
        type: "choice" as const,
        instructions: `Which line of state.code most clearly diverges from state.rules["${id}"].reference?`,
        criteria:
          block === undefined
            ? lineCriteria(lines, 1, lines.length)
            : lineCriteria(lines, block * BLOCK + 1, (block + 1) * BLOCK),
      };
    }),
  };
};

/** One `choice` over blocks of `BLOCK` lines per rule; blank blocks are omitted. */
export const blockBody = (model: string, code: string, rules: Rules) => {
  const lines = lineTexts(code);
  const criteria: Record<string, string> = {};
  for (let block = 0; block * BLOCK < lines.length; block++) {
    const first = lines
      .slice(block * BLOCK, (block + 1) * BLOCK)
      .find((line) => !isBlank(line));
    if (first !== undefined) criteria[String(block)] = `${snippetOf(first)}...`;
  }
  return {
    model,
    state: stateOf(code, rules),
    questions: Record.map(rules, (_, id) => ({
      type: "choice" as const,
      instructions: `Which block of state.code contains the line that most clearly diverges from state.rules["${id}"].reference?`,
      criteria,
    })),
  };
};
