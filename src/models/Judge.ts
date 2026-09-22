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
  /** `rule` when a line test decided it. `jev` when the rule cannot be a line test. */
  decidedBy: Schema.Literals(["rule", "jev"]),
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
  /** The pattern text from the rule, for a judgment Jev has to make. */
  readonly pattern: string;
}

/** The judge's refusal: the evaluation service could not be consulted. */
export class JevUnavailable extends Schema.TaggedError<JevUnavailable>()(
  "JevUnavailable",
  { message: Schema.String },
) { }

/**
 * Jev, TypeSafe's System One model, as the audit's judge. One call decides
 * a rule that has no line test: the topic's documented pattern, plus the file.
 */
export class JevJudge extends Context.Service<
  JevJudge,
  {
    /**
     * Decide whether one file violates a rule that cannot be a line test.
     * Returns the probability it does, the line Jev points at, and a reason.
     */
    readonly judge: (
      candidate: Candidate,
      pattern: string,
    ) => Effect.Effect<Verdict, JevUnavailable>;
  }
>()("@darkmatter/adhere/models/Judge/JevJudge") { }
