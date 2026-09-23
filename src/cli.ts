import { AdhereConfig, AdhereConfigLive } from "#services/AdhereConfig.ts";
import { AuditCacheLive } from "#services/AuditCache.ts";
import { Credentials, CredentialsLive, CredentialsUnavailable } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { render, runAudit } from "#workflows/audit.ts";
import type { Overrides } from "#config.ts";
import { findContradictions, formatContradictions } from "#contradictions.ts";
import { initProject } from "#init.ts";
import { type PresetName, presetNames } from "#presets.ts";
import { globalRuleSet } from "#rules.ts";
import {
  Console,
  Effect,
  Layer,
  Option,
  Path,
  Redacted,
  Runtime,
  Schema,
  Stdio,
  Stream,
} from "effect";
import { Command, Flag, Prompt } from "effect/unstable/cli";
import { FetchHttpClient } from "effect/unstable/http";
// A Bun text import (https://bun.sh/docs/bundler/loaders#text): the file's
// contents become a string at bundle time, so the compiled binary carries the
// skill without an --asset flag. `skills/` sits beside `src/`, outside the `#`
// import map, hence the relative path.
import skill from "../skills/adhere/SKILL.md" with { type: "text" };

class FindingsReported extends Schema.TaggedError<FindingsReported>()("FindingsReported", {
  count: Schema.Finite,
}) {
  readonly [Runtime.errorReported] = false;
}

class ContradictionsReported extends Schema.TaggedError<ContradictionsReported>()(
  "ContradictionsReported",
  { count: Schema.Finite },
) {
  readonly [Runtime.errorReported] = false;
}

const preset = Flag.choice("preset", presetNames).pipe(
  Flag.optional,
  Flag.withDescription("Add a built-in rule set. With a preset, .adhere/config.ts is optional."),
);

const threshold = Flag.float("threshold").pipe(
  Flag.optional,
  Flag.withDescription(
    "Report a rule when Jev's probability is above this value, 0 to 1. Replaces the config's threshold; per-rule thresholds still apply.",
  ),
);

const force = Flag.boolean("force").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Overwrite existing scaffold files."),
);

const chosenPresets = (flag: Option.Option<PresetName>): ReadonlyArray<PresetName> =>
  Option.isSome(flag) ? [flag.value] : [];

export const auditLayer = (overrides: Overrides) =>
  Layer.mergeAll(
    SourceWalkerLive,
    AuditCacheLive,
    JevLive.pipe(Layer.provide([FetchHttpClient.layer, CredentialsLive])),
  ).pipe(Layer.provideMerge(AdhereConfigLive(overrides)));

/** `adhere lint`: the audit. */
export const lintCommand = Command.make("lint", { preset, threshold }, () =>
  Effect.gen(function* () {
    const result = yield* runAudit;
    const stdio = yield* Stdio.Stdio;
    const color = yield* stdio.stdoutIsTerminal;
    const path = yield* Path.Path;
    // One write: separate Console.log calls have interleaved out of order here.
    yield* Console.log(render(result, { color, root: path.resolve() }).join("\n"));
    if (result.findings.length > 0) {
      yield* FindingsReported.make({ count: result.findings.length });
    }
  }),
).pipe(
  Command.withDescription(
    "Audit the working directory against reference code from .adhere/config.ts or a preset, judged by Jev.",
  ),
  Command.provide((input) =>
    auditLayer({
      presets: chosenPresets(input.preset),
      threshold: Option.getOrUndefined(input.threshold),
    }),
  ),
);

/**
 * `adhere validate`: everything `lint` loads, without Jev. A config, rule file,
 * or preset that does not decode refuses here the way it would refuse `lint`.
 */
export const validateCommand = Command.make("validate", { preset }, () =>
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const path = yield* Path.Path;
    const entries = config.scopedRules ?? globalRuleSet(config.rules, path.resolve());
    const contradictions = findContradictions(entries);
    const loaded = `${entries.length} ${entries.length === 1 ? "rule" : "rules"} loaded.`;
    yield* Console.log([loaded, formatContradictions(contradictions)].join("\n"));
    if (contradictions.length > 0) {
      return yield* ContradictionsReported.make({ count: contradictions.length });
    }
  }),
).pipe(
  Command.withDescription(
    "Load the config, rule files, and presets the way lint does, without calling Jev, and check the rules for contradictions.",
  ),
  Command.provide((input) => AdhereConfigLive({ presets: chosenPresets(input.preset) })),
);

/** `adhere init`: the scaffold. */
export const initCommand = Command.make("init", { force }, (input) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const result = yield* initProject(path.resolve(), { force: input.force });
    const lines = [
      result.created.length > 0 ? `created: ${result.created.join(", ")}` : "created: none",
      result.skipped.length > 0 ? `skipped: ${result.skipped.join(", ")}` : "skipped: none",
    ];
    yield* Console.log(lines.join("\n"));
  }),
).pipe(Command.withDescription("Scaffold .adhere/config.ts and example Markdown rules."));

/**
 * The key typed at a masked prompt, or piped in: `adhere login < key.txt`.
 * Whitespace around it, like the newline a pipe ends with, is dropped.
 */
const readApiKey = Effect.fn("login.readApiKey")(function* () {
  const stdio = yield* Stdio.Stdio;
  const typed: string = (yield* stdio.stdinIsTerminal)
    ? Redacted.value(yield* Prompt.run(Prompt.password({ message: "TypeSafe AI API key" })))
    : yield* stdio.stdin.pipe(
        Stream.decodeText(),
        Stream.mkString,
        Effect.mapError((problem) =>
          CredentialsUnavailable.make({
            message: `Cannot read the key from stdin: ${problem.message}`,
          }),
        ),
      );
  const key = typed.trim();
  if (key.length === 0) {
    return yield* CredentialsUnavailable.make({
      message: "No API key given: type it at the prompt, or pipe it in.",
    });
  }
  return Redacted.make(key);
});

/** `adhere login`: save the API key, so a run needs no TYPESAFE_API_KEY. */
export const loginCommand = Command.make("login", {}, () =>
  Effect.gen(function* () {
    const credentials = yield* Credentials;
    yield* credentials.save(yield* readApiKey());
    yield* Console.log(`Saved the API key to ${yield* credentials.file}.`);
  }),
).pipe(
  Command.withDescription(
    "Save a TypeSafe AI API key in ~/.config/adhere ($XDG_CONFIG_HOME/adhere when set), readable only by you, so lint runs without TYPESAFE_API_KEY. Prompts for the key, or reads it from stdin when piped.",
  ),
  Command.provide(CredentialsLive),
);

/** `adhere logout`: delete the saved API key. */
export const logoutCommand = Command.make("logout", {}, () =>
  Effect.gen(function* () {
    const credentials = yield* Credentials;
    const file = yield* credentials.file;
    const removed = yield* credentials.remove;
    yield* Console.log(
      removed ? `Deleted the API key saved in ${file}.` : `No API key is saved in ${file}.`,
    );
  }),
).pipe(
  Command.withDescription(
    "Delete the API key adhere login saved. TYPESAFE_API_KEY, when set, still applies.",
  ),
  Command.provide(CredentialsLive),
);

/** `adhere skill`: the agent skill for writing rules, as shipped in the binary. */
export const skillCommand = Command.make("skill", {}, () => Console.log(skill.trimEnd())).pipe(
  Command.withDescription(
    "Print the agent skill that gathers a repo's conventions into rules and configures adhere. Pipe it into .agents/skills/adhere/SKILL.md or hand it to an agent.",
  ),
);

/** The whole CLI. Bare `adhere` prints its help. */
export const cli = Command.make("adhere").pipe(
  Command.withDescription("Lint a repository against reference code in .adhere/, judged by Jev."),
  Command.withExamples([
    { command: "adhere init", description: "Scaffold .adhere/config.ts and two example rules" },
    { command: "adhere validate", description: "Check the config and rules without calling Jev" },
    { command: "adhere login", description: "Save your TypeSafe AI API key for later runs" },
    { command: "adhere lint", description: "Audit the working directory" },
    {
      command: "adhere lint --preset effect",
      description: "Audit against the built-in Effect rules",
    },
  ]),
  Command.withSubcommands([
    lintCommand,
    validateCommand,
    initCommand,
    loginCommand,
    logoutCommand,
    skillCommand,
  ]),
);
