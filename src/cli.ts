import { AdhereConfig, AdhereConfigLive } from "#services/AdhereConfig.ts";
import { AuditCacheLive } from "#services/AuditCache.ts";
import { Credentials, CredentialsLive, CredentialsUnavailable } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceWalkerLive } from "#services/SourceWalker.ts";
import { Status } from "#services/Status.ts";
import {
  type AuditPlan,
  executeAudit,
  failing,
  type FileDone,
  planAudit,
  pruneCache,
  render,
} from "#workflows/audit.ts";
import {
  describePlan,
  type Progress,
  progressAfter,
  progressLine,
  sendQuestion,
} from "#workflows/format.ts";
import type { Flags } from "#config.ts";
import { findContradictions, formatContradictions } from "#contradictions.ts";
import { type Install, initProject } from "#init.ts";
import { formatLinterCheck, tallyProjectRules } from "#mechanical.ts";
import { type PresetName, presetNames } from "#presets.ts";
import { globalRuleSet } from "#rules.ts";
import { formatStrays, straysAmong } from "#wording.ts";
import {
  Console,
  Effect,
  Exit,
  Layer,
  LogLevel,
  Option,
  Path,
  Redacted,
  References,
  Runtime,
  Schema,
  Stdio,
  Stream,
} from "effect";
import { Argument, Command, Flag, Prompt } from "effect/unstable/cli";
import { FetchHttpClient } from "effect/unstable/http";
// A Bun text import (https://bun.sh/docs/bundler/loaders#text): the file's
// contents become a string at bundle time, so the compiled binary carries the
// skill without an --asset flag. `skills/` sits beside `src/`, outside the `#`
// import map, hence the relative path.
import skill from "../skills/adhere/SKILL.md" with { type: "text" };
import fixSkill from "../skills/adhere-fix/SKILL.md" with { type: "text" };

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

/** The names each `--preset` gives, split at commas: `--preset effect,alchemy` gives two. */
const presetsIn = (values: ReadonlyArray<string>): ReadonlyArray<string> =>
  values
    .flatMap((value) => value.split(","))
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

const isPresetName = (name: string): name is PresetName =>
  (presetNames as ReadonlyArray<string>).includes(name);

const preset = Flag.string("preset").pipe(
  Flag.atLeast(0),
  Flag.filterMap(
    (values): Option.Option<ReadonlyArray<PresetName>> => {
      const names = presetsIn(values);
      return names.every(isPresetName) ? Option.some([...new Set(names)]) : Option.none();
    },
    // The CLI puts this after "Expected:".
    (values) => {
      const unknown = presetsIn(values).filter((name) => !isPresetName(name));
      return `one of ${presetNames.join(", ")}, or several separated by commas (not ${unknown.join(", ")})`;
    },
  ),
  Flag.withDescription(
    `Add built-in rule sets, or their topics, such as effect/basics. Repeat the flag or separate names with commas, as in --preset effect,alchemy. With a preset, .adhere/config.ts is optional. (choices: ${presetNames.join(", ")})`,
  ),
);

const threshold = Flag.float("threshold").pipe(
  Flag.optional,
  Flag.withDescription(
    "Report a rule when Jev's probability is above this value, 0 to 1. Replaces the config's threshold; per-rule thresholds still apply.",
  ),
);

const limit = Flag.integer("limit").pipe(
  Flag.filter(
    (checks) => checks >= 0,
    (checks) => `--limit is a number of checks, 0 or more, not ${checks}.`,
  ),
  Flag.optional,
  Flag.withDescription(
    "Judge at most this many checks. The rest wait for a later run, which picks up where this one stopped, since judgments are cached. --limit 0 shows the plan and judges nothing.",
  ),
);

const rpm = Flag.integer("rpm").pipe(
  Flag.filter(
    (requests) => requests > 0,
    (requests) => `--rpm is a number of requests a minute, more than 0, not ${requests}.`,
  ),
  Flag.optional,
  Flag.withDescription("Send at most this many requests to Jev a minute, evenly spaced."),
);

const filter = Flag.string("filter").pipe(
  Flag.atLeast(0),
  Flag.withDescription(
    "Read only files whose path from the working directory matches this glob, such as 'src/**' or '**/*.service.ts'. Repeat it for more; a pattern starting with ! leaves out what it matches.",
  ),
);

const denyWarnings = Flag.boolean("deny-warnings").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Fail the run on warnings as well as errors."),
);

const yes = Flag.boolean("yes").pipe(
  Flag.withAlias("y"),
  Flag.withDefault(false),
  Flag.withDescription(
    "Send the requests without asking first. lint only asks with a terminal on stdin and stdout.",
  ),
);

class Cancelled extends Schema.TaggedError<Cancelled>()("Cancelled", {}) {
  readonly [Runtime.errorReported] = false;
}

/** Text on stderr, beside the report on stdout. */
const toStderr = (text: string) =>
  Effect.sync(() => {
    process.stderr.write(text);
  });

/**
 * A counter on stderr, redrawn in place on a terminal as files finish. On
 * anything else it stays quiet, so a log gets the plan and the report rather
 * than a line per file. A failed run keeps its last count on screen.
 */
const counterFor = (plan: AuditPlan, logging: LogLevel.LogLevel) => {
  // Log lines at debug or below would land between redraws and garble the counter.
  const live = process.stderr.isTTY === true && LogLevel.isGreaterThan(logging, "Debug");
  let progress: Progress = { files: 0, requests: 0, findings: 0 };
  const draw = () => (live ? toStderr(`\r\u001b[2K${progressLine(progress, plan)}`) : Effect.void);
  return {
    start: Effect.suspend(draw),
    update: (done: FileDone) =>
      Effect.suspend(() => {
        progress = progressAfter(progress, done);
        return draw();
      }),
    finish: (failed: boolean) => (live ? toStderr(failed ? "\n" : "\r\u001b[2K") : Effect.void),
  };
};

/**
 * The status line for what a run does before its plan: walking the checkout,
 * reading files, planning. On a terminal it is one line of stderr, redrawn at
 * most every 100 ms and cut to the terminal's width; anywhere else, and at
 * debug or below, whose log lines would land in it, it shows nothing.
 */
const statusLayer = Layer.effect(Status)(
  Effect.gen(function* () {
    const logging = yield* References.MinimumLogLevel;
    if (process.stderr.isTTY !== true || !LogLevel.isGreaterThan(logging, "Debug")) {
      return Status.defaultValue();
    }
    let drawn = 0;
    let shown = false;
    return {
      show: (text: string) =>
        Effect.sync(() => {
          const now = Date.now();
          if (now - drawn < 100) return;
          drawn = now;
          shown = true;
          // A terminal that reports no width, as some report 0, gets 80 columns.
          const width = (process.stderr.columns || 80) - 1;
          process.stderr.write(`\r\u001b[2K${text.slice(0, width)}`);
        }),
      clear: Effect.sync(() => {
        if (shown) process.stderr.write("\r\u001b[2K");
        shown = false;
        drawn = 0;
      }),
    };
  }),
);

const force = Flag.boolean("force").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Overwrite existing scaffold files."),
);

export const auditLayer = (flags: Flags, filter: ReadonlyArray<string> = []) =>
  Layer.mergeAll(
    SourceWalkerLive(filter),
    AuditCacheLive,
    JevLive.pipe(Layer.provide([FetchHttpClient.layer, CredentialsLive])),
  ).pipe(Layer.provideMerge(AdhereConfigLive(flags)), Layer.provideMerge(statusLayer));

/** `adhere lint`: the audit. */
export const lintCommand = Command.make(
  "lint",
  { preset, threshold, yes, limit, rpm, filter, denyWarnings },
  (input) =>
    Effect.gen(function* () {
      const stdio = yield* Stdio.Stdio;
      const plan = yield* planAudit({ limit: Option.getOrUndefined(input.limit) });
      const limits = { filter: input.filter, rpm: Option.getOrUndefined(input.rpm) };
      yield* toStderr(`${describePlan(plan, limits).join("\n")}\n`);
      // A prompt draws on stdout, so it needs a terminal at both ends: none when
      // the report is redirected, or in CI.
      const interactive = (yield* stdio.stdinIsTerminal) && (yield* stdio.stdoutIsTerminal);
      if (plan.requests > 0 && interactive && !input.yes) {
        const send = yield* Prompt.run(
          Prompt.confirm({ message: sendQuestion(plan), initial: true }),
        );
        if (!send) {
          yield* toStderr("Nothing sent.\n");
          return yield* Cancelled.make({});
        }
      }
      const counter = counterFor(plan, yield* References.MinimumLogLevel);
      yield* counter.start;
      const result = yield* executeAudit(plan, counter.update).pipe(
        Effect.onExit((exit) => counter.finish(Exit.isFailure(exit))),
      );
      // Only a run that read every file knows what the cache still needs.
      if (input.filter.length === 0) yield* pruneCache(plan);
      const color = yield* stdio.stdoutIsTerminal;
      const path = yield* Path.Path;
      // One write: separate Console.log calls have interleaved out of order here.
      yield* Console.log(render(result, { color, root: path.resolve() }).join("\n"));
      // Only errors fail the run, unless --deny-warnings: a warning is for a nit or a noisy rule.
      const failed = failing(result.findings, input.denyWarnings);
      if (failed.length > 0) {
        yield* FindingsReported.make({ count: failed.length });
      }
    }),
).pipe(
  Command.withDescription(
    "Audit the working directory against the rules in .adhere/ or a preset, judged by Jev.",
  ),
  Command.provide((input) =>
    auditLayer(
      {
        presets: input.preset,
        threshold: Option.getOrUndefined(input.threshold),
        rpm: Option.getOrUndefined(input.rpm),
      },
      input.filter,
    ),
  ),
);

/** Jev, with the key `lint` uses, and the config it reads the model and threshold from. */
export const validateLayer = (flags: Flags) =>
  Layer.merge(
    JevLive.pipe(Layer.provide([FetchHttpClient.layer, CredentialsLive])),
    AuditCacheLive,
  ).pipe(Layer.provideMerge(AdhereConfigLive(flags)), Layer.provideMerge(statusLayer));

/**
 * `adhere validate`: everything `lint` loads, then how each rule's wording
 * differs from the README's rule writing tips, then the linter check's tallies
 * from lint, then Jev on whether any two rules that apply to the same files
 * contradict. Only a contradiction fails the run: the tips and the linter
 * check are advice. A config, rule file, or preset that does not decode
 * refuses here the way it would refuse `lint`.
 */
export const validateCommand = Command.make("validate", { preset }, () =>
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const path = yield* Path.Path;
    const root = path.resolve();
    const entries = config.scopedRules ?? globalRuleSet(config.rules, root);
    const loaded = `${entries.length} ${entries.length === 1 ? "rule" : "rules"} loaded.`;
    const tallied = yield* tallyProjectRules(entries, config.model);
    // The wording and the tallies need no request, so they show before Jev is asked anything.
    yield* Console.log(
      [
        loaded,
        ...formatStrays(straysAmong(entries), root),
        ...formatLinterCheck(tallied, root),
      ].join("\n"),
    );
    const contradictions = yield* findContradictions(entries, config.threshold);
    yield* Console.log(formatContradictions(contradictions));
    if (contradictions.length > 0) {
      return yield* ContradictionsReported.make({ count: contradictions.length });
    }
  }),
).pipe(
  Command.withDescription(
    "Load the config, rule files, and presets the way lint does, check each rule's wording against the README's rule writing tips, report the rules lint's linter check flags, then ask Jev whether any two rules that apply to the same files contradict each other.",
  ),
  Command.provide((input) => validateLayer({ presets: input.preset })),
);

const installLine = (install: Install): string => {
  switch (install.status) {
    case "installed":
      return `installed: @drkmttr/adhere with ${install.packageManager}`;
    case "listed":
      return "installed: none, @drkmttr/adhere is already in package.json";
    case "no-package-json":
      return "installed: none, there is no package.json";
  }
};

/** `adhere init`: the scaffold. */
export const initCommand = Command.make("init", { force }, (input) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const result = yield* initProject(path.resolve(), { force: input.force });
    const lines = [
      result.created.length > 0 ? `created: ${result.created.join(", ")}` : "created: none",
      result.skipped.length > 0 ? `skipped: ${result.skipped.join(", ")}` : "skipped: none",
      installLine(result.install),
    ];
    yield* Console.log(lines.join("\n"));
  }),
).pipe(
  Command.withDescription(
    "Scaffold .adhere/config.ts and example Markdown rules, and add @drkmttr/adhere to devDependencies with the project's package manager.",
  ),
);

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

/** The agent skills the binary carries, by the name `adhere skill` takes. */
const skills = { rules: skill, fix: fixSkill } as const;

const skillName = Argument.choice("skill", ["rules", "fix"] as const).pipe(
  Argument.withDefault("rules" as const),
  Argument.withDescription(
    "rules, the default, to gather a repo's conventions into rules and configure adhere; fix, to verify and fix the findings lint reports.",
  ),
);

/** `adhere skill [rules|fix]`: an agent skill, as shipped in the binary. */
export const skillCommand = Command.make("skill", { name: skillName }, ({ name }) =>
  Console.log(skills[name].trimEnd()),
).pipe(
  Command.withDescription(
    "Print an agent skill: by default the one that gathers a repo's conventions into rules and configures adhere, or with fix, the one that verifies and fixes lint's findings. Pipe it into .agents/skills/<name>/SKILL.md or hand it to an agent.",
  ),
);

/** The whole CLI. Bare `adhere` prints its help. */
export const cli = Command.make("adhere").pipe(
  Command.withDescription("Lint a repository against the rules in .adhere/, judged by Jev."),
  Command.withExamples([
    { command: "adhere init", description: "Scaffold .adhere/config.ts and two example rules" },
    {
      command: "adhere validate",
      description: "Check the rules' wording, and ask Jev whether any contradict",
    },
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
