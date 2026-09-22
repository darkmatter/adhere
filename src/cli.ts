import { AuditCacheLive } from "#services/AuditCache.ts";
import { JevJudgeLive, JevPlatform } from "#services/JevJudge.http.ts";
import { RulesLive } from "#services/Rules.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { render, runAudit } from "#workflows/audit.ts";
import { Console, Effect, Layer, Option, Stdio } from "effect";
import { Command, Flag } from "effect/unstable/cli";

/** Comma-separated topic filter; every topic when omitted. */
const topicsFlag = Flag.string("topics").pipe(
  Flag.withDescription(
    "Only audit these comma-separated rule topics.",
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

/** The audit over the working directory, using the rules in adhere.config.ts. */
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
      const stdio = yield* Stdio.Stdio;
      const color = yield* stdio.stdoutIsTerminal;
      // One write, so the frames stay in order. Color matches `vp lint` on a terminal.
      yield* Console.log(render(result, { color }).join("\n"));
    }),
).pipe(
  Command.withDescription(
    "Audit the working directory against the rules in adhere.config.ts. Line tests decide themselves; Jev decides rules that have no line test.",
  ),
);

/** Composed once: the config, the tree, the judge, and its platform. */
export const auditLayer = Layer.mergeAll(
  SourceWalkerLive,
  JevJudgeLive,
  AuditCacheLive.pipe(Layer.provideMerge(RulesLive)),
).pipe(Layer.provideMerge(JevPlatform));
