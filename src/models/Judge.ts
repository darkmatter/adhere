import { Context, Effect, Schema } from "effect";

/** Jev's verdict on one candidate finding. */
export const Verdict = Schema.Struct({
  /** The topic slug the candidate was judged against. */
  topic: Schema.NonEmptyString,
  /** The rule that found the candidate. */
  rule: Schema.NonEmptyString,
  /** Where the candidate was found. */
  file: Schema.NonEmptyString,
  /** The 1-based line. */
  line: Schema.Natural,
  /** The 1-based column of the span, within the snippet. */
  column: Schema.Finite,
  /** What is wrong, copied from the rule definition. */
  message: Schema.String,
  /** How to fix it, copied from the rule definition. */
  help: Schema.String,
  /** The offending line. */
  snippet: Schema.String,
  /** Jev's probability that the code violates the topic's documented pattern. */
  violates: Schema.Finite,
  /** Jev's one-line reason, quoted from the pattern it applied. */
  reason: Schema.String,
});
export interface Verdict extends Schema.Schema.Type<typeof Verdict> { }

/** One candidate, as the judge receives it: where, what, and the code around it. */
export interface Candidate {
  readonly topic: string;
  readonly rule: string;
  readonly file: string;
  readonly line: number;
  /** 1-based column of the span, within the snippet. */
  readonly column: number;
  /** What is wrong, from the rule definition. */
  readonly message: string;
  /** How to fix it, from the rule definition. */
  readonly help: string;
  /** The single offending line, for the report. */
  readonly snippet: string;
  /** The code window around the line, for judgment. */
  readonly excerpt: string;
}

/** The judge's refusal: the evaluation service could not be consulted. */
export class JevUnavailable extends Schema.TaggedError<JevUnavailable>()(
  "JevUnavailable",
  { message: Schema.String },
) { }

/**
 * Jev, TypeSafe's System One model, as the audit's judge. One call judges
 * one candidate: the topic's documented pattern, plus the code excerpt.
 */
export class JevJudge extends Context.Service<
  JevJudge,
  {
    /**
     * Judge one candidate finding against one topic's documented pattern.
     * Returns the probability the code violates that pattern, with a reason.
     */
    readonly judge: (
      candidate: Candidate,
      pattern: string,
    ) => Effect.Effect<Verdict, JevUnavailable>;
  }
>()("@darkmatter/effect-audit/models/Judge/JevJudge") { }
