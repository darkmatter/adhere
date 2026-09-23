import type { RuleId, Rules } from "#config.ts";
import { Context, type Effect, Record, Schema } from "effect";

export type { Rules };
export type Lines = ReadonlyArray<string>;

export class JevUnavailable extends Schema.TaggedError<JevUnavailable>()("JevUnavailable", {
  message: Schema.String,
}) {}

export class Jev extends Context.Service<
  Jev,
  {
    readonly judge: (
      lines: Lines,
      rules: Rules,
    ) => Effect.Effect<Record<RuleId, number>, JevUnavailable>;
    readonly locate: (
      lines: Lines,
      rules: Rules,
    ) => Effect.Effect<Record<RuleId, number>, JevUnavailable>;
  }
>()("@drkmttr/adhere/services/Jev") {}

/** A `choice` question accepts at most this many criteria. */
const CHOICE_LIMIT = 255;
const LINES_PER_BLOCK = 20;
export const MAX_LINES = CHOICE_LIMIT * LINES_PER_BLOCK;

export const snippetOf = (line: string): string => line.trim().slice(0, 120);

const isBlank = (line: string): boolean => line.trim().length === 0;

export const needsBlocks = (lines: Lines): boolean =>
  lines.filter((line) => !isBlank(line)).length > CHOICE_LIMIT;

const stateOf = (lines: Lines, rules: Rules) => ({
  code: lines.map((line, index) => `${index + 1} | ${line}`).join("\n"),
  rules: Record.map(rules, ({ description, reference }) => ({
    description,
    reference,
  })),
});

const lineCriteria = (lines: Lines, from: number, to: number): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (let n = from; n <= Math.min(to, lines.length); n++) {
    const text = lines[n - 1] ?? "";
    if (!isBlank(text)) criteria[String(n)] = snippetOf(text);
  }
  return criteria;
};

export const judgeBody = (model: string, lines: Lines, rules: Rules) => ({
  model,
  state: stateOf(lines, rules),
  questions: Record.map(rules, (_, id) => ({
    type: "noul" as const,
    instructions: `Does state.code diverge from the pattern shown in state.rules["${id}"].reference, as described by state.rules["${id}"].description? Answer no if the pattern does not apply to this file.`,
  })),
});

export const locateBody = (
  model: string,
  lines: Lines,
  rules: Rules,
  blocks?: Readonly<Record<RuleId, number>>,
) => ({
  model,
  state: stateOf(lines, rules),
  questions: Record.map(rules, (_, id) => {
    const block = blocks?.[id];
    return {
      type: "choice" as const,
      instructions: `Which line of state.code most clearly diverges from state.rules["${id}"].reference?`,
      criteria:
        block === undefined
          ? lineCriteria(lines, 1, lines.length)
          : lineCriteria(lines, block * LINES_PER_BLOCK + 1, (block + 1) * LINES_PER_BLOCK),
    };
  }),
});

export const blockBody = (model: string, lines: Lines, rules: Rules) => {
  const criteria: Record<string, string> = {};
  for (let block = 0; block * LINES_PER_BLOCK < lines.length; block++) {
    const first = lines
      .slice(block * LINES_PER_BLOCK, (block + 1) * LINES_PER_BLOCK)
      .find((line) => !isBlank(line));
    if (first !== undefined) criteria[String(block)] = `${snippetOf(first)}...`;
  }
  return {
    model,
    state: stateOf(lines, rules),
    questions: Record.map(rules, (_, id) => ({
      type: "choice" as const,
      instructions: `Which block of state.code contains the line that most clearly diverges from state.rules["${id}"].reference?`,
      criteria,
    })),
  };
};
