import { AdhereConfigLive } from "#services/AdhereConfig.ts";
import { AuditCacheLive } from "#services/AuditCache.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { render, runAudit } from "#workflows/audit.ts";
import type { Overrides } from "#config.ts";
import { presetNames } from "#presets.ts";
import {
  Console,
  Effect,
  Layer,
  Option,
  Path,
  Runtime,
  Schema,
  Stdio,
} from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { FetchHttpClient } from "effect/unstable/http";

class FindingsReported extends Schema.TaggedError<FindingsReported>()(
  "FindingsReported",
  { count: Schema.Finite },
) {
  readonly [Runtime.errorReported] = false;
}

const preset = Flag.choice("preset", presetNames).pipe(
  Flag.optional,
  Flag.withDescription(
    "Add a built-in rule set. With a preset, adhere.config.ts is optional.",
  ),
);

const threshold = Flag.float("threshold").pipe(
  Flag.optional,
  Flag.withDescription(
    "Report a rule when Jev's probability is above this value, 0 to 1. Replaces the config's threshold; per-rule thresholds still apply.",
  ),
);

export const auditLayer = (overrides: Overrides) =>
  Layer.mergeAll(
    SourceWalkerLive,
    AuditCacheLive,
    JevLive.pipe(Layer.provide(FetchHttpClient.layer)),
  ).pipe(Layer.provideMerge(AdhereConfigLive(overrides)));

export const auditCommand = Command.make("adhere", { preset, threshold }, () =>
  Effect.gen(function* () {
    const result = yield* runAudit;
    const stdio = yield* Stdio.Stdio;
    const color = yield* stdio.stdoutIsTerminal;
    const path = yield* Path.Path;
    // One write: separate Console.log calls have interleaved out of order here.
    yield* Console.log(
      render(result, { color, root: path.resolve() }).join("\n"),
    );
    if (result.findings.length > 0) {
      yield* FindingsReported.make({ count: result.findings.length });
    }
  }),
).pipe(
  Command.withDescription(
    "Audit the working directory against reference code from adhere.config.ts or a preset, judged by Jev.",
  ),
  Command.provide((input) =>
    auditLayer({
      presets: Option.isSome(input.preset) ? [input.preset.value] : [],
      threshold: Option.getOrUndefined(input.threshold),
    }),
  ),
);
