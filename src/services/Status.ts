import { Context, Effect } from "effect";

export interface StatusLine {
  /** Shows what the run is doing now, in place of what was shown before. */
  readonly show: (text: string) => Effect.Effect<void>;
  /** Takes the line away, before anything else is written. */
  readonly clear: Effect.Effect<void>;
}

/**
 * What a run is doing before it has anything to report: walking the
 * checkout, reading files, planning. The CLI draws it as one line on
 * stderr; wherever nothing provides it, as in tests, it shows nothing.
 */
export const Status = Context.Reference<StatusLine>("@drkmttr/adhere/services/Status", {
  defaultValue: () => ({ show: () => Effect.void, clear: Effect.void }),
});

/** `effect`, with the status line cleared when it ends, however it ends. */
export const clearingStatus = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    const status = yield* Status;
    return yield* Effect.ensuring(effect, status.clear);
  });

/** A count as the status line shows it: 10,333. */
export const counted = (n: number): string => n.toLocaleString("en-US");

/** A count and its noun: 1 directory, 2,679 directories. */
export const countOf = (n: number, one: string, many: string): string =>
  `${counted(n)} ${n === 1 ? one : many}`;
