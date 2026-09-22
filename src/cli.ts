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
// A Bun text import (https://bun.sh/docs/bundler/loaders#text): the file's
// contents become a string at bundle time, so the compiled binary carries the
// skill without an --asset flag. `skills/` sits beside `src/`, outside the `#`
// import map, hence the relative path.
import skill from "../skills/adhere/SKILL.md" with { type: "text" };

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

/** `adhere skill`: the agent skill for writing rules, as shipped in the binary. */
export const skillCommand = Command.make("skill", {}, () =>
  Console.log(skill.trimEnd()),
).pipe(
  Command.withDescription(
    "Print the agent skill that gathers a repo's conventions into rules and configures adhere. Pipe it into .agents/skills/adhere/SKILL.md or hand it to an agent.",
  ),
);

const audit = Command.make("adhere", { preset, threshold }, () =>
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

/** The whole CLI: `adhere` audits, `adhere skill` prints the skill. */
export const auditCommand = audit.pipe(Command.withSubcommands([skillCommand]));
