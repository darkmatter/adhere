import { Schema } from "effect";

/** A topic from `effect-solutions list`: the slug the CLI publishes and its title. */
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

/** A detector: the topic it serves, the rule slugs it owns, and how it reads one file. */
export interface Detector {
  readonly topic: string;
  readonly rules: ReadonlyArray<string>;
  /** `topic/rule` plus the rule message, for cache invalidation. */
  readonly descriptions: ReadonlyArray<string>;
  readonly scan: (file: ScannedFile) => ReadonlyArray<Finding>;
}

/** One source file as the walker hands it to detectors: absolute path and its lines. */
export interface ScannedFile {
  readonly path: string;
  readonly lines: ReadonlyArray<string>;
}

/** The audit's refusal: the CLI that names the topics could not be consulted. */
export class SolutionsUnavailable extends Schema.TaggedError<SolutionsUnavailable>()(
  "SolutionsUnavailable",
  { message: Schema.String },
) { }

/** A source walker's refusal: the tree it was asked to read is not readable. */
export class WalkUnavailable extends Schema.TaggedError<WalkUnavailable>()(
  "WalkUnavailable",
  { message: Schema.String },
) { }

export type AuditError = SolutionsUnavailable | WalkUnavailable;
