import { AdhereConfigLive } from "#services/AdhereConfig.ts";
import { AuditCacheLive } from "#services/AuditCache.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { render, runAudit } from "#workflows/audit.ts";
import { Console, Effect, Layer, Path, Runtime, Schema, Stdio } from "effect";
import { Command } from "effect/unstable/cli";
import { FetchHttpClient } from "effect/unstable/http";

/** Exit 1 after the report. Already printed, so the runtime must not log it. */
class FindingsReported extends Schema.TaggedError<FindingsReported>()(
  "FindingsReported",
  { count: Schema.Finite },
) {
  readonly [Runtime.errorReported] = false;
}

export const auditCommand = Command.make("adhere", {}, () =>
  Effect.gen(function* () {
    const result = yield* runAudit;
    const stdio = yield* Stdio.Stdio;
    const color = yield* stdio.stdoutIsTerminal;
    const path = yield* Path.Path;
    // One write, so the frames stay in order.
    yield* Console.log(
      render(result, { color, root: path.resolve() }).join("\n"),
    );
    if (result.findings.length > 0) {
      yield* FindingsReported.make({ count: result.findings.length });
    }
  }),
).pipe(
  Command.withDescription(
    "Audit the working directory against the reference code in adhere.config.ts, judged by Jev.",
  ),
);

export const auditLayer = Layer.mergeAll(
  SourceWalkerLive,
  AuditCacheLive,
  JevLive.pipe(Layer.provide(FetchHttpClient.layer)),
).pipe(Layer.provideMerge(AdhereConfigLive));
