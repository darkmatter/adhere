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
    /**
     * Per rule, the partner Jev names as impossible to follow in the same code,
     * as `[rule, partner]` indexes into `rules`. A rule Jev names none for is
     * left out.
     */
    readonly conflicts: (
      rules: ReadonlyArray<ComparedRule>,
      partners: ReadonlyArray<ReadonlyArray<number>>,
    ) => Effect.Effect<ReadonlyArray<Pair>, JevUnavailable>;
    /**
     * Per pair, in order, Jev's probability that no code can follow both rules,
     * each pair asked on its own.
     */
    readonly contradicts: (
      rules: ReadonlyArray<ComparedRule>,
      pairs: ReadonlyArray<Pair>,
    ) => Effect.Effect<ReadonlyArray<number>, JevUnavailable>;
  }
>()("@drkmttr/adhere/services/Jev") {}

/** A rule compared with other rules rather than with a file. */
export interface ComparedRule {
  readonly id: RuleId;
  readonly rule: Rule;
}

/** Two rules, as indexes into the rules being compared. */
export type Pair = readonly [number, number];

/** A `choice` question accepts at most this many criteria. */
const CHOICE_LIMIT = 255;
const LINES_PER_BLOCK = 20;
const MAX_LINES = CHOICE_LIMIT * LINES_PER_BLOCK;

/**
 * Jev 1.13's context, from its model card: the state with its longest
 * question, and the state with every question in the request.
 */
const QUESTION_CONTEXT = 32_000;
const REQUEST_CONTEXT = 64_000;
/** Room for what Jev wraps around a request, which `tokensOf` does not see. */
const WRAPPER = 1_000;

const encoder = new TextEncoder();

/**
 * An estimate, meant to run high, of the tokens Jev reads for a value: one
 * per three bytes of its JSON. Code runs a little over three bytes a token,
 * prose about four.
 */
export const tokensOf = (value: unknown): number =>
  Math.ceil(encoder.encode(JSON.stringify(value)).length / 3);

export const snippetOf = (line: string): string => line.trim().slice(0, 120);

const isBlank = (line: string): boolean => line.trim().length === 0;

export const needsBlocks = (lines: Lines): boolean =>
  lines.filter((line) => !isBlank(line)).length > CHOICE_LIMIT;

/** The file, numbered so a line question can name a line. The only thing the questions share. */
const stateOf = (lines: Lines) => ({
  code: lines.map((line, index) => `${index + 1} | ${line}`).join("\n"),
});

/** The rule as its questions carry it: the description, and its code on either side. */
const ruleFields = (rule: Rule) => ({
  rule: rule.description,
  ...(rule.reference === undefined ? {} : { reference: rule.reference }),
  ...(rule.avoid === undefined ? {} : { avoid: rule.avoid }),
});

/** A rule's text as a comparison of rules reads it. Code a rule lacks is left out, not sent empty. */
const ruleState = ({ description, reference, avoid }: Rule) => ({
  description,
  ...(reference === undefined ? {} : { reference }),
  ...(avoid === undefined ? {} : { avoid }),
});

/**
 * The compared rules a question mentions, keyed by index: ids alone would
 * collide, since a nested rule can share its id with the rule it shadows.
 */
const comparedState = (rules: ReadonlyArray<ComparedRule>, mentioned: Iterable<number>) => {
  const state: Record<string, { readonly id: RuleId } & ReturnType<typeof ruleState>> = {};
  for (const index of [...new Set(mentioned)].sort((a, b) => a - b)) {
    const compared = rules[index];
    if (compared !== undefined) {
      state[String(index)] = { id: compared.id, ...ruleState(compared.rule) };
    }
  }
  return { rules: state };
};

/**
 * Whether the file breaks the rule. The rule rides in the question, not the
 * state, so each question reads its own rule and no other. A rule with a
 * reference asks whether the file diverges from it, with the code to avoid
 * as an example when there is some. A rule without one asks whether the file
 * contains the code to avoid. The criteria draw the line at the rule's scope:
 * a file with no code the rule is about is a no.
 */
export const judgeQuestion = (rule: Rule) => {
  const example = rule.avoid === undefined ? "" : ", for example by doing what `avoid` shows";
  const [question, yes, no] =
    rule.reference === undefined
      ? [
          "Does `code` contain the pattern shown in `avoid`, which `rule` rules out? Answer no if nothing in this file resembles it.",
          "`code` contains the pattern shown in `avoid`",
          "`code` has nothing like `avoid`",
        ]
      : [
          `Does \`code\` diverge from the pattern shown in \`reference\`${example}, as described by \`rule\`? Answer no if the pattern does not apply to this file.`,
          `\`code\` diverges from the pattern shown in \`reference\`${example}`,
          "`code` follows the pattern",
        ];
  return {
    type: "noul" as const,
    instructions: { question, ...ruleFields(rule) },
    criteria: {
      true: `${yes}, in code that \`rule\` is about`,
      false: `${no}, or has no code that \`rule\` is about`,
    },
  };
};

/** What the offending line does, for the line and block questions. */
const offense = (rule: Rule): string =>
  rule.reference === undefined
    ? "shows the pattern in `avoid`"
    : rule.avoid === undefined
      ? "diverges from `reference`"
      : "diverges from `reference` or resembles `avoid`";

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
  state: stateOf(lines),
  questions: Record.map(rules, (rule) => judgeQuestion(rule)),
});

export const locateBody = (
  model: string,
  lines: Lines,
  rules: Rules,
  blocks?: Readonly<Record<RuleId, number>>,
) => ({
  model,
  state: stateOf(lines),
  questions: Record.map(rules, (rule, id) => {
    const block = blocks?.[id];
    return {
      type: "choice" as const,
      instructions: {
        question: `Which line of \`code\` most clearly ${offense(rule)}?`,
        ...ruleFields(rule),
      },
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
    state: stateOf(lines),
    questions: Record.map(rules, (rule) => ({
      type: "choice" as const,
      instructions: {
        question: `Which block of \`code\` contains the line that most clearly ${offense(rule)}?`,
        ...ruleFields(rule),
      },
      criteria,
    })),
  };
};

/**
 * Whether Jev can take every request a file may need: its lines within two
 * line choices, and its code beside the longest question any rule asks.
 */
export const fits = (lines: Lines, rules: Rules): boolean => {
  if (lines.length > MAX_LINES) return false;
  const located = needsBlocks(lines) ? blockBody("", lines, rules) : locateBody("", lines, rules);
  const questions = [
    ...Object.values(judgeBody("", lines, rules).questions),
    ...Object.values(located.questions),
  ];
  const longest = Math.max(0, ...questions.map(tokensOf));
  return tokensOf(stateOf(lines)) + longest <= QUESTION_CONTEXT - WRAPPER;
};

export interface Body {
  readonly model: string;
  readonly state: unknown;
  readonly questions: Readonly<Record<string, unknown>>;
}

/**
 * A body as requests Jev can take: its questions in order, with a new
 * request whenever the next question would not fit beside the state and
 * the questions before it.
 */
export const requestsOf = (body: Body): ReadonlyArray<Body> => {
  const room = REQUEST_CONTEXT - WRAPPER - tokensOf(body.state);
  const requests: Array<{ readonly questions: Record<string, unknown>; tokens: number }> = [];
  for (const [id, question] of Object.entries(body.questions)) {
    const tokens = tokensOf(question);
    const last = requests.at(-1);
    if (last !== undefined && last.tokens + tokens <= room) {
      last.questions[id] = question;
      last.tokens += tokens;
    } else {
      requests.push({ questions: { [id]: question }, tokens });
    }
  }
  return requests.map(({ questions }) => ({ ...body, questions }));
};

/** The requests judging `rules` over a file takes: the judge body, split to fit, as `judge` sends it. */
export const judgeRequests = (lines: Lines, rules: Rules): number =>
  requestsOf(judgeBody("", lines, rules)).length;

/**
 * The requests locating `rules` in a file takes, split to fit as `locate`
 * sends them: a block choice first for a long file, then a line choice. For a
 * long file the line choice is counted before a block is chosen, so it can
 * run high.
 */
export const locateRequests = (lines: Lines, rules: Rules): number =>
  (needsBlocks(lines) ? requestsOf(blockBody("", lines, rules)).length : 0) +
  requestsOf(locateBody("", lines, rules)).length;

/** A choice keeps one criterion for "none", which leaves this many for partners. */
const PARTNERS_PER_QUESTION = CHOICE_LIMIT - 1;

interface ChoiceQuestion {
  readonly type: "choice";
  readonly instructions: string;
  readonly criteria: Record<string, string>;
}

/**
 * Per rule, one `choice` among the rules that apply to the same files: which
 * of them cannot be followed in the same code, or none. The questions grow
 * with the rules, not with every pair of them. A rule with more partners than
 * a choice holds gets one question per chunk, keyed `rule:chunk`.
 */
export const conflictBody = (
  model: string,
  rules: ReadonlyArray<ComparedRule>,
  partners: ReadonlyArray<ReadonlyArray<number>>,
) => {
  const questions: Record<string, ChoiceQuestion> = {};
  const mentioned: Array<number> = [];
  partners.forEach((some, index) => {
    for (let chunk = 0; chunk * PARTNERS_PER_QUESTION < some.length; chunk++) {
      const from = chunk * PARTNERS_PER_QUESTION;
      const offered = some.slice(from, from + PARTNERS_PER_QUESTION);
      const criteria: Record<string, string> = { none: "None of them" };
      for (const partner of offered) {
        criteria[String(partner)] = rules[partner]?.rule.description ?? "";
      }
      mentioned.push(index, ...offered);
      questions[`${index}:${chunk}`] = {
        type: "choice",
        instructions: `Each choice other than none is the rule in state.rules under its key. Which of them demands the opposite of what state.rules["${index}"] demands of the same code, so that following one breaks the other? Choose none if code can follow each of them alongside it.`,
        criteria,
      };
    }
  });
  return { model, state: comparedState(rules, mentioned), questions };
};

const pairKey = ([first, second]: Pair): string => `${first}-${second}`;

/**
 * A `noul` for one pair Jev named: do the two rules demand opposite things of
 * the same code? One pair per request, with only its two rules in the state.
 * Other rules beside them dilute the judgment: over the effect preset, a real
 * contradiction scored 0.89 alone and 0.59 among the other named pairs.
 */
export const contradictBody = (model: string, rules: ReadonlyArray<ComparedRule>, pair: Pair) => ({
  model,
  state: comparedState(rules, pair),
  questions: {
    [pairKey(pair)]: {
      type: "noul" as const,
      instructions: `Do state.rules["${pair[0]}"] and state.rules["${pair[1]}"] demand opposite things of the same code, so that following one breaks the other? Answer no if code can follow both, or if they are about different things.`,
    },
  },
});

/**
 * The pairs a conflict answer names: per question, the partner Jev chose, when
 * it was one the question offered. "none", or a stray answer, names no pair.
 */
export const namedPairs = (
  answers: Readonly<Record<string, { readonly choice: string }>>,
  partners: ReadonlyArray<ReadonlyArray<number>>,
): ReadonlyArray<Pair> =>
  Object.entries(answers).flatMap(([key, { choice }]): ReadonlyArray<Pair> => {
    const rule = Number(key.split(":")[0]);
    const partner = Number(choice);
    return partners[rule]?.includes(partner) === true ? [[rule, partner]] : [];
  });

/** The probability a contradiction answer gives its pair; 0 when it gives none. */
export const pairProbability = (
  answers: Readonly<Record<string, { readonly noul: number }>>,
  pair: Pair,
): number => answers[pairKey(pair)]?.noul ?? 0;
