import { Context, Effect, Layer, Stream } from "effect";
import * as ChildProcess from "effect/unstable/process/ChildProcess";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";
import { SolutionsUnavailable } from "#models/Audit.ts";

/**
 * The documented pattern for each `effect-solutions` topic. Jev judges
 * candidates against this text — the CLI's own documentation, not a
 * paraphrase — so a verdict cites what the CLI actually publishes.
 */
export class TopicPatterns extends Context.Service<
  TopicPatterns,
  {
    /** One topic's full documented pattern, from `effect-solutions show <topic>`. */
    readonly pattern: (
      topic: string,
    ) => Effect.Effect<string, SolutionsUnavailable>;
  }
>()("@darkmatter/adhere/services/TopicPatterns") {}

/** What one CLI run said: exit status plus both collected pipes. */
interface Shown {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Run `effect-solutions show <topic>` once, scoped to the call; the
 * refusal when the CLI itself could not run.
 */
const showOnce = Effect.fn("TopicPatterns.showOnce")(
  (spawner: typeof ChildProcessSpawner.Service, topic: string) =>
    Effect.gen(function* () {
      const handle = yield* spawner.spawn(
        ChildProcess.make("effect-solutions", ["show", topic]),
      );
      return yield* Effect.all(
        [
          handle.exitCode,
          Stream.mkString(Stream.decodeText(handle.stdout)),
          Stream.mkString(Stream.decodeText(handle.stderr)),
        ],
        { concurrency: "unbounded" },
      );
    }).pipe(
      Effect.scoped,
      Effect.mapError((problem) =>
        SolutionsUnavailable.make({
          message: `effect-solutions show ${topic} could not run: ${problem.message}`,
        }),
      ),
    ),
);

/** A shown pattern, or the refusal when the run failed or published nothing. */
const patternOrRefusal = (shown: Shown, topic: string) =>
  Effect.suspend(() => {
    if (shown.code !== 0) {
      return SolutionsUnavailable.make({
        message: `effect-solutions show ${topic} exited ${shown.code}: ${shown.stderr.trim()}`,
      });
    }
    if (shown.stdout.trim().length === 0) {
      return SolutionsUnavailable.make({
        message: `effect-solutions show ${topic} published no pattern; refusing to judge against an empty one`,
      });
    }
    return Effect.succeed(shown.stdout);
  });

/**
 * The real patterns: one `effect-solutions show <topic>` call per topic,
 * its stdout the pattern. A failed run refuses rather than judging against
 * a guessed pattern.
 */
export const TopicPatternsLive = Layer.effect(TopicPatterns)(
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner;
    const pattern = Effect.fn("TopicPatterns.pattern")(function* (
      topic: string,
    ) {
      const [code, stdout, stderr] = yield* showOnce(spawner, topic);
      return yield* patternOrRefusal({ code, stdout, stderr }, topic);
    });
    return TopicPatterns.of({ pattern });
  }),
);
