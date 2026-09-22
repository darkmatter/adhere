import { AuditCacheLive } from "#services/AuditCache.ts";
import { EffectSolutionsLive } from "#services/EffectSolutions.ts";
import { JevJudgeLive, JevPlatform } from "#services/JevJudge.http.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { TopicPatternsLive } from "#services/TopicPatterns.ts";
import { render, runAudit } from "#workflows/audit.ts";
import { Console, Effect, Layer, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { isatty } from "node:tty";

/** Comma-separated topic filter; every topic when omitted. */
const topicsFlag = Flag.string("topics").pipe(
  Flag.withDescription(
    "Only audit these comma-separated effect-solutions topics.",
  ),
  Flag.optional,
);

/** The probability above which a verdict is reported as a violation. */
const thresholdFlag = Flag.float("threshold").pipe(
  Flag.withDescription(
    "Report only verdicts where Jev's violation probability exceeds this.",
  ),
  Flag.optional,
);

/** The topic filter a parsed flag resolved to: undefined audits every topic. */
const filterOf = (
  topics: Option.Option<string>,
): ReadonlyArray<string> | undefined =>
  Option.isSome(topics)
    ? topics.value.split(",").map((topic) => topic.trim())
    : undefined;

/** The audit over the repo's real tree, the real CLI, and the real Jev judge. */
export const auditCommand = Command.make(
  "adhere",
  { topics: topicsFlag, threshold: thresholdFlag },
  ({ topics, threshold }) =>
    Effect.gen(function* () {
      const parsed = Option.isSome(threshold) ? threshold.value : undefined;
      const result = yield* runAudit({
        topics: filterOf(topics),
        threshold: parsed,
      });
      // One write, so the frames stay in order. Color matches `vp lint` on a terminal.
      yield* Console.log(render(result, { color: isatty(1) }).join("\n"));
    }).pipe(
      // This command's handler is the audit app's entry point: it owns the
      // layer stack, so providing here is the one sanctioned place.
      // oxlint-disable-next-line effecttsgo/strict-effect-provide
      Effect.provide(auditLayer),
    ),
).pipe(
  Command.withDescription(
    "Audit the current repository's Effect code against the topics the effect-solutions CLI publishes, judged by Jev.",
  ),
);

/** Composed once: the CLI, the tree, the judge, and its platform. */
const auditLayer = Layer.mergeAll(
  EffectSolutionsLive,
  SourceWalkerLive,
  JevJudgeLive,
  TopicPatternsLive,
  AuditCacheLive,
).pipe(Layer.provideMerge(JevPlatform));
