import { type Example, examplesOf, type Rule, type RuleId, type Rules } from "#config.ts";
import { type Range, sectionsOf } from "#excerpt.ts";
import { Context, type Effect, Record, Schema } from "effect";

export type { Rules };
export type Lines = ReadonlyArray<string>;

export class JevUnavailable extends Schema.TaggedError<JevUnavailable>()("JevUnavailable", {
  message: Schema.String,
}) {}

/**
 * Jev's refusal of a request over its context. `fits` keeps such files from
 * being sent, but by an estimate; this is Jev's own count disagreeing.
 */
export class JevOverflow extends Schema.TaggedError<JevOverflow>()("JevOverflow", {}) {}

/**
 * A request the firewall in front of Jev's API refused: a 403 with an HTML
 * block page where Jev answers JSON. It reads some code as an attack, so the
 * same request is refused every time while the rest of a run goes through.
 * `ray` is Cloudflare's Ray ID, which TypeSafe AI can look the block up by.
 */
export class JevBlocked extends Schema.TaggedError<JevBlocked>()("JevBlocked", {
  ray: Schema.String,
}) {}

/** Jev's probability for each of a rule's matchers, in the order the rule lists them. */
export interface MatcherScores {
  readonly appliesTo: ReadonlyArray<number>;
  readonly excludeIf: ReadonlyArray<number>;
}

/** What judging a file answers: per rule, whether it breaks it, and the linter check's answers. */
export interface Judged {
  /** Per rule, Jev's probability that the file breaks it. */
  readonly probabilities: Readonly<Record<RuleId, number>>;
  /** Per sampled rule, Jev's probability that a regular linter could have decided the file against it. */
  readonly linter: Readonly<Record<RuleId, number>>;
  /** Per rule with `appliesTo` or `excludeIf`, the scores of its matchers. */
  readonly matchers?: Readonly<Record<RuleId, MatcherScores>>;
}

export class Jev extends Context.Service<
  Jev,
  {
    /**
     * Each rule's probability that the file breaks it. A rule in `sampled`
     * also carries the linter check's question, whose answer comes back
     * under `linter`.
     */
    readonly judge: (
      lines: Lines,
      rules: Rules,
      sampled?: ReadonlyArray<RuleId>,
    ) => Effect.Effect<Judged, JevUnavailable | JevOverflow | JevBlocked>;
    /** Per rule, the section of the file that most clearly breaks it. */
    readonly locate: (
      lines: Lines,
      rules: Rules,
    ) => Effect.Effect<Record<RuleId, Range>, JevUnavailable | JevOverflow | JevBlocked>;
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

/** A `choice` question accepts at most this many criteria, so a file has at most this many sections. */
const CHOICE_LIMIT = 255;

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
 * per three bytes of its JSON. Jev 1.13 reads numbered TypeScript at 3.2
 * bytes a token, and this ran 12 to 16 percent high on the eval's requests.
 * Text that packs more tokens into its bytes, such as CJK, can outrun it.
 */
export const tokensOf = (value: unknown): number =>
  Math.ceil(encoder.encode(JSON.stringify(value)).length / 3);

/**
 * The file as Jev reads it: its sections, by `sectionsOf`, under their
 * numbers from 1, so the locate question can name one. The only thing the
 * questions share. On the eval it judged as well as the file with every line
 * numbered, and located as well as a choice among the lines.
 */
const stateOf = (lines: Lines) => ({
  code: Object.fromEntries(
    sectionsOf(lines).map((section, index) => [
      String(index + 1),
      lines.slice(section.first - 1, section.last).join("\n"),
    ]),
  ),
});

/** The field an example goes under in a question: its word, with `should not` as `should_not`. */
const fieldOf = (example: Example): string => example.word.replace(" ", "_");

/** A rule's examples under their words. Code a rule lacks is left out, not sent empty. */
const exampleFields = (rule: Rule): Record<string, string> => {
  const { good, bad } = examplesOf(rule);
  return {
    ...(good === undefined ? {} : { [fieldOf(good)]: good.code }),
    ...(bad === undefined ? {} : { [fieldOf(bad)]: bad.code }),
  };
};

/** The rule as its questions carry it: the description, and its examples under their words. */
const ruleFields = (rule: Rule) => ({ rule: rule.description, ...exampleFields(rule) });

/** A rule's text as a comparison of rules reads it. */
const ruleState = (rule: Rule) => ({ description: rule.description, ...exampleFields(rule) });

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
 * state, so each question reads its own rule and no other, its code under its
 * own words: `must` and `never`, or a guideline's `should` and `should_not`.
 * A rule with code to write asks whether the file diverges from it, with the
 * code not to write as an example when there is some. A rule without any
 * asks whether the file contains the code not to write. The criteria draw the
 * line at the rule's scope: a file with no code the rule is about is a no.
 *
 * On the eval, "diverge from the pattern shown in `must`" judged better than
 * asking whether code "must be written the way `must` shows": the same words,
 * but a pattern to compare rather than code to match.
 */
export const judgeQuestion = (rule: Rule) => {
  const { good, bad } = examplesOf(rule);
  const avoided = fieldOf(bad ?? { word: "never", code: "" });
  const example = bad === undefined ? "" : `, for example by doing what \`${avoided}\` shows`;
  const [question, yes, no] =
    good === undefined
      ? [
          `Does \`code\` contain the pattern shown in \`${avoided}\`, which \`rule\` rules out? Answer no if nothing in this file resembles it.`,
          `\`code\` contains the pattern shown in \`${avoided}\``,
          `\`code\` has nothing like \`${avoided}\``,
        ]
      : [
          `Does \`code\` diverge from the pattern shown in \`${fieldOf(good)}\`${example}, as described by \`rule\`? Answer no if the pattern does not apply to this file.`,
          `\`code\` diverges from the pattern shown in \`${fieldOf(good)}\`${example}`,
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

/** What the offending section does, for the locate question. */
const offense = (rule: Rule): string => {
  const { good, bad } = examplesOf(rule);
  const avoided = `\`${fieldOf(bad ?? { word: "never", code: "" })}\``;
  return good === undefined
    ? `shows the pattern in ${avoided}`
    : bad === undefined
      ? `diverges from \`${fieldOf(good)}\``
      : `diverges from \`${fieldOf(good)}\` or resembles ${avoided}`;
};

/**
 * The linter check's question: whether a regular linter could have decided
 * `code` against the rule. It carries the judge question's fields, so Jev
 * sees the rule as it does when judging, with the file in view.
 */
export const linterQuestion = (rule: Rule) => {
  const { instructions } = judgeQuestion(rule);
  return {
    type: "noul" as const,
    instructions: {
      ...instructions,
      question:
        "Should `rule` have been checked by a regular linter? Consider `code`: could a linter or type checker have decided exactly whether it follows `rule`, without judgment?",
    },
    criteria: {
      true: "A regular linter or type checker could decide exactly whether `code` follows `rule`",
      false:
        "Deciding whether `code` follows `rule` takes judgment about what the code means or is for",
    },
  };
};

/** The key a rule's linter question rides under, beside its judge question. */
export const linterKey = (id: RuleId): string => `linter:${id}`;

type MatcherKind = keyof MatcherScores;

/**
 * A matcher's question: whether the code that breaks the rule is as the
 * matcher describes. It asks about that code rather than the file, so a file
 * with a real violation beside code a matcher excludes keeps its finding: for
 * `appliesTo`, whether any of that code is as described, and for `excludeIf`,
 * whether all of it is. It carries the rule as the judge question does.
 */
export const matcherQuestion = (rule: Rule, kind: MatcherKind, matcher: string) => {
  const { instructions } = judgeQuestion(rule);
  const [quantity, yes, no] =
    kind === "appliesTo" ? ["any", "Some", "None"] : ["all", "All", "Not all"];
  return {
    type: "noul" as const,
    instructions: {
      ...instructions,
      question: `Is ${quantity} of the code in \`code\` that breaks \`rule\` as \`matcher\` describes? Answer no if no code in \`code\` breaks \`rule\`.`,
      matcher,
    },
    criteria: {
      true: `${yes} of the code in \`code\` that breaks \`rule\` is as \`matcher\` describes`,
      false: `${no} of the code in \`code\` that breaks \`rule\` is as \`matcher\` describes, or no code in \`code\` breaks \`rule\``,
    },
  };
};

/** The key a rule's matcher question rides under, beside its judge question. */
export const matcherKey = (kind: MatcherKind, id: RuleId, index: number): string =>
  `${kind}:${id}:${index}`;

const MATCHER_KINDS: ReadonlyArray<MatcherKind> = ["appliesTo", "excludeIf"];

/** A rule's matcher questions under their keys, `appliesTo` first, each in the rule's order. */
export const matcherQuestions = (id: RuleId, rule: Rule) =>
  MATCHER_KINDS.flatMap((kind) =>
    (rule[kind] ?? []).map(
      (matcher, index) =>
        [matcherKey(kind, id, index), matcherQuestion(rule, kind, matcher)] as const,
    ),
  );

/** The tokens a file's code leaves in Jev's context for any one question beside it, as `fits` counts them. */
export const questionRoom = (lines: Lines): number =>
  QUESTION_CONTEXT - WRAPPER - tokensOf(stateOf(lines));

/**
 * One question per rule, one per matcher of each rule, and the linter
 * question beside each rule in `sampled`.
 */
export const judgeBody = (
  model: string,
  lines: Lines,
  rules: Rules,
  sampled: ReadonlyArray<RuleId> = [],
) => ({
  model,
  state: stateOf(lines),
  questions: {
    ...Record.map(rules, (rule): ReturnType<typeof judgeQuestion> => judgeQuestion(rule)),
    ...Object.fromEntries(
      Object.entries(rules).flatMap(([id, rule]) => matcherQuestions(id, rule)),
    ),
    ...Object.fromEntries(
      sampled.flatMap((id) => {
        const rule = rules[id];
        return rule === undefined ? [] : [[linterKey(id), linterQuestion(rule)] as const];
      }),
    ),
  },
});

/**
 * Per rule, which section of `code` breaks it: one choice among the
 * sections' numbers. The options carry no text: each is a key of the state,
 * and describing a section by its first line or by what it declares located
 * no better on the eval.
 */
export const locateBody = (model: string, lines: Lines, rules: Rules) => {
  const state = stateOf(lines);
  const criteria = Record.map(state.code, () => null);
  return {
    model,
    state,
    questions: Record.map(rules, (rule) => ({
      type: "choice" as const,
      instructions: {
        question: `Which entry of \`code\` most clearly ${offense(rule)}?`,
        ...ruleFields(rule),
      },
      criteria,
    })),
  };
};

/**
 * Whether Jev can take every request a file may need: its sections within
 * one choice, and its code beside the longest question any rule asks.
 */
export const fits = (lines: Lines, rules: Rules): boolean => {
  if (sectionsOf(lines).length > CHOICE_LIMIT) return false;
  const questions = [
    ...Object.values(judgeBody("", lines, rules).questions),
    ...Object.values(locateBody("", lines, rules).questions),
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

/**
 * The requests judging `rules` over a file takes, and about how many input
 * tokens they carry, by `tokensOf`: the judge body, split to fit, as `judge`
 * sends it, each request with the file again.
 */
export const judgeLoad = (
  lines: Lines,
  rules: Rules,
  sampled: ReadonlyArray<RuleId> = [],
): { readonly requests: number; readonly tokens: number } => {
  const requests = requestsOf(judgeBody("", lines, rules, sampled));
  return {
    requests: requests.length,
    tokens: requests.reduce((sum, request) => sum + tokensOf(request), 0),
  };
};

/** The requests judging `rules` over a file takes: the judge body, split to fit, as `judge` sends it. */
export const judgeRequests = (
  lines: Lines,
  rules: Rules,
  sampled: ReadonlyArray<RuleId> = [],
): number => requestsOf(judgeBody("", lines, rules, sampled)).length;

/**
 * The requests locating `rules` in a file takes, split to fit as `locate`
 * sends them: none for a file of one section, which is where every finding is.
 */
export const locateRequests = (lines: Lines, rules: Rules): number =>
  sectionsOf(lines).length <= 1 ? 0 : requestsOf(locateBody("", lines, rules)).length;

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
