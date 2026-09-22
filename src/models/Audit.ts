import { Schema } from "effect";

/** A topic named by the rules in `adhere.config.ts`. */
export const SolutionsTopic = Schema.Struct({
  slug: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
});
export interface SolutionsTopic extends Schema.Schema.Type<
  typeof SolutionsTopic
> { }

/**
 * One place in the repo that diverges from a topic's patterns. The line is
 * 1-based to match editor jumps; the snippet is trimmed evidence.
 */
export const Violation = Schema.Struct({
  topic: Schema.NonEmptyString,
  rule: Schema.NonEmptyString,
  file: Schema.NonEmptyString,
  line: Schema.Natural,
  snippet: Schema.String,
});
export interface Violation extends Schema.Schema.Type<typeof Violation> { }

/** What one rule found in one file: the rule's slug, its message, and where. */
export interface Finding {
  readonly rule: string;
  /** What is wrong, from the rule definition. */
  readonly message: string;
  /** How to fix it, from the rule definition. */
  readonly help: string;
  readonly line: number;
  /** 1-based column within the snippet. */
  readonly column: number;
  readonly snippet: string;
}

/** One source file as the walker hands it to the rules: absolute path and its lines. */
export interface ScannedFile {
  readonly path: string;
  readonly lines: ReadonlyArray<string>;
}

/** The audit's refusal: `adhere.config.ts` could not be loaded. */
export class RulesUnavailable extends Schema.TaggedError<RulesUnavailable>()(
  "RulesUnavailable",
  { message: Schema.String },
) { }

/** A source walker's refusal: the tree it was asked to read is not readable. */
export class WalkUnavailable extends Schema.TaggedError<WalkUnavailable>()(
  "WalkUnavailable",
  { message: Schema.String },
) { }

export type AuditError = RulesUnavailable | WalkUnavailable;
