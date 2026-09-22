import { Schema } from "effect";

/** One source file as the walker hands it to the audit: absolute path and its lines. */
export interface ScannedFile {
  readonly path: string;
  readonly lines: ReadonlyArray<string>;
}

/** A source walker's refusal: the tree it was asked to read is not readable. */
export class WalkUnavailable extends Schema.TaggedError<WalkUnavailable>()(
  "WalkUnavailable",
  { message: Schema.String },
) {}
