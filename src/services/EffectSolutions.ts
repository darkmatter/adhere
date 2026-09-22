import { Context, Effect, Layer, Stream } from "effect";
import * as ChildProcess from "effect/unstable/process/ChildProcess";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";
import { type SolutionsTopic, SolutionsUnavailable } from "#models/Audit.ts";

/** The `effect-solutions` CLI this audit consults for its topic list. */
export class EffectSolutions extends Context.Service<
  EffectSolutions,
  {
    /** The topics the CLI currently publishes, in the order it lists them. */
    readonly topics: Effect.Effect<
      ReadonlyArray<SolutionsTopic>,
      SolutionsUnavailable
    >;
  }
>()("@darkmatter/effect-audit/services/EffectSolutions") {}

/**
 * Parses the CLI's `list` output. Each topic is one `<slug>  Title` line;
 * indented description lines below it are not topics and are skipped.
 */
export const parseTopics = (output: string): ReadonlyArray<SolutionsTopic> => {
  const topics: Array<SolutionsTopic> = [];
  const entry = /^([a-z0-9-]+)\s{2,}(.+)$/u;
  for (const line of output.split("\n")) {
    const found = entry.exec(line.trim());
    const [slug, title] = [found?.[1], found?.[2]?.trim()];
    if (slug === undefined || title === undefined) continue;
    topics.push({ slug, title });
  }
  return topics;
};

/** What one CLI run said: exit status plus both collected pipes. */
interface Listing {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Run the listing once, scoped so the child never outlives the call. */
const runList = Effect.fn("EffectSolutions.runList")(
  (spawner: typeof ChildProcessSpawner.Service) =>
    Effect.gen(function* () {
      const handle = yield* spawner.spawn(
        ChildProcess.make("effect-solutions", ["list"]),
      );
      return yield* Effect.all(
        [
          handle.exitCode,
          Stream.mkString(Stream.decodeText(handle.stdout)),
          Stream.mkString(Stream.decodeText(handle.stderr)),
        ],
        { concurrency: "unbounded" },
      );
    }).pipe(Effect.scoped),
);

/** A spawn failure, as the listing's own refusal: the CLI could not run. */
const unavailable = (problem: { readonly message: string }) =>
  SolutionsUnavailable.make({
    message: `effect-solutions list could not run: ${problem.message}`,
  });

/** A failed or empty listing refuses the audit; only a real one proceeds. */
const refusedWhenBad = (
  listing: Listing,
): Effect.Effect<ReadonlyArray<SolutionsTopic>, SolutionsUnavailable> =>
  Effect.suspend(() => {
    if (listing.code !== 0) {
      return SolutionsUnavailable.make({
        message: `effect-solutions list exited ${listing.code}: ${listing.stderr.trim()}`,
      });
    }
    const listed = parseTopics(listing.stdout);
    if (listed.length === 0) {
      return SolutionsUnavailable.make({
        message:
          "effect-solutions list published no topics; refusing to audit against a guessed list",
      });
    }
    return Effect.succeed(listed);
  });

/**
 * The real CLI: `effect-solutions list`, its stdout parsed into topics. A
 * failed run or an empty listing refuses the audit rather than guessing
 * topics the documentation does not publish.
 */
export const EffectSolutionsLive = Layer.effect(EffectSolutions)(
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner;
    const listing = runList(spawner);
    const topics = Effect.fn("EffectSolutions.topics")(function* () {
      const [code, stdout, stderr] = yield* listing.pipe(
        Effect.mapError(unavailable),
      );
      return yield* refusedWhenBad({ code, stdout, stderr });
    });
    return EffectSolutions.of({ topics: topics() });
  }),
);
