import type { Rule, RuleId, Rules } from "#config.ts";
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
  rules: Record.map(rules, ({ description, reference, avoid }) => ({
    description,
    ...(reference === undefined ? {} : { reference }),
    ...(avoid === undefined ? {} : { avoid }),
  })),
});

const field = (id: RuleId, key: "avoid" | "description" | "reference") =>
  `state.rules["${id}"].${key}`;

/**
 * A rule with a reference asks whether the file diverges from it, with the
 * code to avoid as an example when there is some. A rule without one asks
 * whether the file contains the code to avoid.
 */
const judgeInstructions = (id: RuleId, rule: Rule): string =>
  rule.reference === undefined
    ? `Does state.code contain the pattern shown in ${field(id, "avoid")}, which ${field(id, "description")} rules out? Answer no if nothing in this file resembles it.`
    : `Does state.code diverge from the pattern shown in ${field(id, "reference")}${
        rule.avoid === undefined ? "" : `, for example by doing what ${field(id, "avoid")} shows`
      }, as described by ${field(id, "description")}? Answer no if the pattern does not apply to this file.`;

/** What the offending line does, for the line and block questions. */
const offense = (id: RuleId, rule: Rule): string =>
  rule.reference === undefined
    ? `shows the pattern in ${field(id, "avoid")}`
    : rule.avoid === undefined
      ? `diverges from ${field(id, "reference")}`
      : `diverges from ${field(id, "reference")} or resembles ${field(id, "avoid")}`;

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
  questions: Record.map(rules, (rule, id) => ({
    type: "noul" as const,
    instructions: judgeInstructions(id, rule),
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
  questions: Record.map(rules, (rule, id) => {
    const block = blocks?.[id];
    return {
      type: "choice" as const,
      instructions: `Which line of state.code most clearly ${offense(id, rule)}?`,
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
    questions: Record.map(rules, (rule, id) => ({
      type: "choice" as const,
      instructions: `Which block of state.code contains the line that most clearly ${offense(id, rule)}?`,
      criteria,
    })),
  };
};
