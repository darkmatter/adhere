import { AdhereConfig, AdhereConfigLive } from "#services/AdhereConfig.ts";
import { AuditCacheLive } from "#services/AuditCache.ts";
import {
  Credentials,
  CredentialsLive,
  CredentialsUnavailable,
  KEYS,
} from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceReadsLive } from "#services/SourceReads.ts";
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
  renderJson,
  renderMarkdown,
  renderRuleReports,
  sendQuestion,
} from "#workflows/format.ts";
import type { Flags } from "#config.ts";
import { findContradictions, formatContradictions } from "#contradictions.ts";
import { createRule } from "#create/wizard.ts";
import { AGENTS } from "#create/agents.ts";
import { type Install, initProject } from "#init.ts";
import {
  type CatalogMatch,
  type InstallPicks,
  type Source,
  catalogOf,
  cloned,
  describeRules,
  installSelected,
  instructionPath,
  listRules,
  matchOf,
  parseSource,
  rulePath,
} from "#install.ts";
import { renderInstructions } from "#instructions.ts";
import { formatLinterCheck, tallyProjectRules } from "#mechanical.ts";
import { type PresetName, presetNames } from "#presets.ts";
import type { SavedKey } from "#providers/provider.ts";
import { refreshSharedReadme } from "#readme.ts";
import { globalRuleSet } from "#rules.ts";
import { formatStrays, straysAmong } from "#wording.ts";
import {
  Console,
  Effect,
  Exit,
  FileSystem,
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
  Terminal,
} from "effect";
import { Argument, CliError, Command, Flag, Prompt } from "effect/cli";
// A Bun text import (https://bun.sh/docs/bundler/loaders#text): the file's
// contents become a string at bundle time, so the compiled binary carries the
// skill without an --asset flag. `skills/` sits beside `src/`, outside the `#`
// import map, hence the relative path.
import skill from "../skills/adhere/SKILL.md" with { type: "text" };
import fixSkill from "../skills/adhere-fix/SKILL.md" with { type: "text" };
import setupSkill from "../skills/adhere-setup/SKILL.md" with { type: "text" };

// @adhere This file owns CLI flags, progress output, and command wiring. Audit execution,
// scaffolding, rule installation, credential storage, and rule checks are implemented in
// their own modules imported above; the commands here connect them to the CLI.

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

const preset = Flag.String("preset").pipe(
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

const threshold = Flag.Finite("threshold").pipe(
  Flag.optional,
  Flag.withDescription(
    "Report a rule when Jev's probability is above this value, 0 to 1. Replaces the config's threshold; per-rule thresholds still apply.",
  ),
);

const sufficiencyThreshold = Flag.Finite("sufficiency-threshold").pipe(
  Flag.optional,
  Flag.withDescription(
    "Warn on a finding when Jev's probability that the file shows enough to decide it is below this value, 0 to 1. Replaces the config's sufficiencyThreshold; the default is 0.6.",
  ),
);

const typeAware = Flag.Boolean("type-aware").pipe(
  Flag.optional,
  Flag.withDescription(
    "Include compiler-resolved symbols and declaration excerpts. Off by default.",
  ),
);

const limit = Flag.Int("limit").pipe(
  Flag.filter(
    (files) => files >= 0,
    (files) => `--limit is a number of files, 0 or more, not ${files}.`,
  ),
  Flag.optional,
  Flag.withDescription(
    "Process at most this many files needing requests, in path order, including every pending rule per selected file. Fully cached and located files do not count. A file can send multiple requests. --limit 0 shows the plan without resolving native reads or sending requests.",
  ),
);

const rpm = Flag.Int("rpm").pipe(
  Flag.filter(
    (requests) => requests > 0,
    (requests) => `--rpm is a number of requests a minute, more than 0, not ${requests}.`,
  ),
  Flag.optional,
  Flag.withDescription("Send at most this many requests to Jev a minute, evenly spaced."),
);

const filter = Flag.String("filter").pipe(
  Flag.atLeast(0),
  Flag.withDescription(
    "Read only files whose path from the working directory matches this glob, such as 'src/**' or '**/*.service.ts'. Repeat it for more; a pattern starting with ! leaves out what it matches.",
  ),
);

const denyWarnings = Flag.Boolean("deny-warnings").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Fail the run on warnings as well as errors."),
);

const yes = Flag.Boolean("yes").pipe(
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

const force = Flag.Boolean("force").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Overwrite existing scaffold files."),
);

export const auditLayer = (flags: Flags, filter: ReadonlyArray<string> = []) =>
  Layer.mergeAll(
    SourceWalkerLive(filter),
    SourceReadsLive(),
    AuditCacheLive,
    JevLive.pipe(Layer.provide(CredentialsLive)),
  ).pipe(Layer.provideMerge(AdhereConfigLive(flags)), Layer.provideMerge(statusLayer));

/** `adhere lint`: the audit. */
export const lintCommand = Command.make(
  "lint",
  {
    preset,
    threshold,
    sufficiencyThreshold,
    typeAware,
    yes,
    limit,
    rpm,
    filter,
    denyWarnings,
    json: Flag.Boolean("json").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Write one JSON file per violated rule to .adhere/reports/. Use --stdout for one combined report instead.",
      ),
    ),
    md: Flag.Boolean("md").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Write one Markdown file per violated rule to .adhere/reports/. Use --stdout for one combined report instead.",
      ),
    ),
    stdout: Flag.Boolean("stdout").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Print all findings together instead of writing files. Select either --json or --md for a formatted report.",
      ),
    ),
  },
  (input) =>
    Effect.gen(function* () {
      if (input.stdout && input.json && input.md) {
        return yield* CliError.UserError.make({
          cause:
            "Choose either --json or --md with --stdout; both formats can be written to files together.",
        });
      }
      const stdio = yield* Stdio.Stdio;
      const plan = yield* planAudit({ limit: Option.getOrUndefined(input.limit) });
      const limits = { filter: input.filter, rpm: Option.getOrUndefined(input.rpm) };
      yield* toStderr(`${describePlan(plan, limits).join("\n")}\n`);
      if (plan.planOnly === true) {
        // Planning still knows the live content keys, so a complete walk can prune without sending.
        if (input.filter.length === 0) yield* pruneCache(plan);
        return;
      }
      // Keep prompting limited to interactive runs, including when JSON is requested.
      const interactive = (yield* stdio.stdinIsTerminal) && (yield* stdio.stdoutIsTerminal);
      if (
        (plan.requests > 0 || (plan.cachedLocateRequests ?? 0) > 0) &&
        interactive &&
        !input.yes
      ) {
        const send = yield* Prompt.run(
          Prompt.Confirm({ message: sendQuestion(plan), initial: true }),
        ).pipe(
          Effect.updateService(Terminal.Terminal, (terminal) => ({
            ...terminal,
            display: toStderr,
          })),
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
      const options = {
        color,
        root: path.resolve(),
        threshold: plan.threshold,
        sufficiencyThreshold: plan.sufficiencyThreshold,
        ...(plan.provider === undefined ? {} : { provider: plan.provider }),
      };
      if (!input.stdout && (input.json || input.md)) {
        const fs = yield* FileSystem.FileSystem;
        const directory = path.join(options.root, ".adhere", "reports");
        const reports = renderRuleReports(result, input, options);
        yield* fs.remove(directory, { recursive: true, force: true });
        yield* fs.makeDirectory(directory, { recursive: true });
        for (const [name, report] of reports) {
          yield* fs.writeFileString(path.join(directory, name), report);
        }
        yield* toStderr(`Wrote ${reports.size} report files to .adhere/reports/.\n`);
      } else {
        // One write: separate Console.log calls have interleaved out of order here.
        yield* Console.log(
          input.json
            ? renderJson(result, options)
            : input.md
              ? renderMarkdown(result, options)
              : render(result, options).join("\n"),
        );
      }
      // Only errors fail the run, unless --deny-warnings: a warning is for a nit or a noisy rule.
      const failed = failing(result.findings, input.denyWarnings);
      if (failed.length > 0) {
        yield* FindingsReported.make({ count: failed.length });
      }
    }),
).pipe(
  Command.withDescription(
    "Audit the working directory against the rules in .adhere/rules/ or a preset, judged by Jev.",
  ),
  Command.provide((input) =>
    auditLayer(
      {
        presets: input.preset,
        threshold: Option.getOrUndefined(input.threshold),
        sufficiencyThreshold: Option.getOrUndefined(input.sufficiencyThreshold),
        typeAware: Option.getOrUndefined(input.typeAware),
        rpm: Option.getOrUndefined(input.rpm),
      },
      input.filter,
    ),
  ),
);

/** Jev, with the key `lint` uses, and the config it reads the model and threshold from. */
export const validateLayer = (flags: Flags) =>
  Layer.merge(JevLive.pipe(Layer.provide(CredentialsLive)), AuditCacheLive).pipe(
    Layer.provideMerge(AdhereConfigLive(flags)),
    Layer.provideMerge(statusLayer),
  );

/**
 * `adhere validate`: everything `lint` loads, then how each rule's wording
 * differs from the docs' rule writing tips, then the linter check's tallies
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
    "Load the config, rule files, and presets the way lint does, check each rule's wording against the docs' rule writing tips, report the rules lint's linter check flags, then ask Jev whether any two rules that apply to the same files contradict each other.",
  ),
  Command.provide((input) => validateLayer({ presets: input.preset })),
);

const installLine = (install: Install): string => {
  switch (install.status) {
    case "installed":
      return `installed: ${install.what} with ${install.packageManager}`;
    case "listed":
      return "installed: none, @drkmttr/adhere is already in package.json";
    case "no-package-json":
      return "installed: none, there is no package.json";
  }
};

const shared = Flag.String("shared").pipe(
  Flag.filter(
    (repo) => /^[\w.-]+\/[\w.-]+$/.test(repo),
    (repo) => `--shared names a GitHub repo as org/repo, not ${repo}.`,
  ),
  Flag.optional,
  Flag.withDescription(
    "Scaffold a repo of instructions, rules, and a lint package other repos use, named org/repo on GitHub: example instructions and rules, a README, a CI workflow that runs adhere validate, and an alchemy.run.ts that creates the repo, public unless you make it private when asked, and its TYPESAFE_API_KEY secret.",
  ),
);

/** `adhere init`: the scaffold. */
export const initCommand = Command.make("init", { force, shared }, (input) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const stdio = yield* Stdio.Stdio;
    // A shared repo is public unless the user, asked at a terminal, makes it private.
    const interactive = (yield* stdio.stdinIsTerminal) && (yield* stdio.stdoutIsTerminal);
    const makePrivate =
      Option.isSome(input.shared) && interactive
        ? yield* Prompt.run(Prompt.Confirm({ message: "Make the repo private?", initial: false }))
        : false;
    const result = yield* initProject(path.resolve(), {
      force: input.force,
      visibility: makePrivate ? "private" : "public",
      ...Option.match(input.shared, { onNone: () => ({}), onSome: (repo) => ({ shared: repo }) }),
    });
    const lines = [
      result.created.length > 0 ? `created: ${result.created.join(", ")}` : "created: none",
      result.skipped.length > 0 ? `skipped: ${result.skipped.join(", ")}` : "skipped: none",
      installLine(result.install),
    ];
    yield* Console.log(lines.join("\n"));
  }),
).pipe(
  Command.withDescription(
    "Scaffold .adhere/config.ts, .adhere/tsconfig.json, and example Markdown rules, and add @drkmttr/adhere to devDependencies with the project's package manager.",
  ),
);

const source = Argument.String("source").pipe(
  Argument.filterMap(
    (spec) => Option.fromNullishOr(parseSource(spec)),
    (spec) => `org/repo, then optionally a topic or rule and #ref, not ${spec}`,
  ),
  Argument.withDescription(
    "A GitHub repo with instructions in .adhere/instructions/ and rules in .adhere/rules/, as org/repo, optionally followed by a topic or a rule, as in org/repo/data/brand-ports, and by #branch or #tag.",
  ),
);

/** `adhere list org/repo`: the rules another repo's `.adhere/rules/` holds. */
export const listCommand = Command.make("list", { source }, (input) =>
  Effect.gen(function* () {
    const rules = yield* listRules(input.source);
    const width = Math.max(...rules.map(({ id }) => id.length));
    yield* Console.log(
      rules.map(({ id, description }) => `${id.padEnd(width)}  ${description}`).join("\n"),
    );
  }),
).pipe(
  Command.withDescription(
    "List the rules in a GitHub repo's .adhere/rules/, each with its description, for adhere install. Clones with git, so a private repo needs git's credentials for it.",
  ),
);

class InstallUnavailable extends Schema.TaggedError<InstallUnavailable>()("InstallUnavailable", {
  message: Schema.String,
}) {}

/**
 * What `adhere install` copies: one exact rule without asking, everything
 * when `--all` is given, or what the user picks at a terminal. Without a
 * terminal, a choice refuses and says what `--all` would copy and which exact
 * rule can be named instead. A choice already installed is preselected, so
 * running install again offers to bring it up to date, and deselecting it
 * leaves it as it is.
 */
const choosePicks = Effect.fn("install.choosePicks")(function* (
  source: Source,
  match: CatalogMatch,
  options: { readonly all: boolean; readonly root: string; readonly clone: string },
) {
  if (match.kind === "direct") {
    return { instructions: [], rules: [match.rule.id] } satisfies InstallPicks;
  }
  if (options.all) {
    return {
      instructions: match.instructions,
      rules: match.rules.map(({ id }) => id),
    } satisfies InstallPicks;
  }
  const pinned = source.ref === undefined ? "" : `#${source.ref}`;
  const stdio = yield* Stdio.Stdio;
  if (!(yield* stdio.stdinIsTerminal) || !(yield* stdio.stdoutIsTerminal)) {
    const [first] = match.rules;
    const ids = [
      ...match.instructions.map((file) => `instructions/${file}`),
      ...match.rules.map(({ id }) => id),
    ];
    const spec = `${source.repo}${source.rule === "" ? "" : `/${source.rule}`}${pinned}`;
    const exact =
      first === undefined
        ? ""
        : `, or name one rule exactly, as in ${source.repo}/${first.id}${pinned}`;
    return yield* new InstallUnavailable({
      message: `adhere install ${spec}: no terminal to choose from. Pass --all to copy every match (${ids.join(", ")})${exact}.`,
    });
  }
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  type Pick =
    | { readonly kind: "instruction"; readonly path: string }
    | { readonly kind: "rule"; readonly id: string };
  const instructionChoices = yield* Effect.forEach(match.instructions, (file) =>
    fs.exists(path.join(options.root, instructionPath(source, file))).pipe(
      Effect.orElseSucceed(() => false),
      Effect.map((selected) => ({
        title: `instructions/${file}`,
        value: { kind: "instruction", path: file } as const,
        selected,
      })),
    ),
  );
  const described = yield* describeRules(source, options.clone, match.rules);
  const ruleChoices = yield* Effect.forEach(described, (rule) =>
    fs.exists(path.join(options.root, rulePath(source, rule.id))).pipe(
      Effect.orElseSucceed(() => false),
      Effect.map((selected) => ({
        title: rule.id,
        description: rule.description,
        value: { kind: "rule", id: rule.id } as const,
        selected,
      })),
    ),
  );
  const picks: ReadonlyArray<Pick> = yield* Prompt.run(
    Prompt.MultiSelect<Pick>({
      message:
        source.rule === ""
          ? `What should adhere copy from ${source.repo}${pinned}?`
          : `Which rules under ${source.repo}/${source.rule}${pinned} should adhere copy?`,
      choices: [...instructionChoices, ...ruleChoices],
    }),
  );
  return {
    instructions: picks.flatMap((pick) => (pick.kind === "instruction" ? [pick.path] : [])),
    rules: picks.flatMap((pick) => (pick.kind === "rule" ? [pick.id] : [])),
  } satisfies InstallPicks;
});

/** `adhere install org/repo`: another repo's instructions and rules, copied into this one's `.adhere/`. */
export const installCommand = Command.make(
  "install",
  {
    source,
    force: Flag.Boolean("force").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Replace instruction files and rules already in .adhere/, file by file and directory by directory.",
      ),
    ),
    all: Flag.Boolean("all").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Copy every instruction file and rule the source names, without asking. Needs no terminal.",
      ),
    ),
  },
  (input) =>
    Effect.scoped(
      Effect.gen(function* () {
        const path = yield* Path.Path;
        const root = path.resolve();
        const clone = yield* cloned(input.source);
        const catalog = yield* catalogOf(input.source, clone);
        const match = yield* matchOf(input.source, catalog);
        const picks = yield* choosePicks(input.source, match, {
          all: input.all,
          root,
          clone,
        });
        const result = yield* installSelected(root, input.source, clone, picks, {
          force: input.force,
        });
        yield* Console.log(
          [
            result.created.length > 0 ? `created: ${result.created.join(", ")}` : "created: none",
            result.skipped.length > 0 ? `skipped: ${result.skipped.join(", ")}` : "skipped: none",
          ].join("\n"),
        );
      }),
    ),
).pipe(
  Command.withDescription(
    "Copy instruction files and rules from a GitHub repo's .adhere/ into this repo's .adhere/instructions/<org>/<repo>/ and .adhere/rules/<org>/<repo>/. At a terminal, choose which instruction files and rules to copy; name a topic for its rules, or name one rule exactly to copy it without asking. --all copies everything. Existing files are skipped unless --force.",
  ),
);

/**
 * The key typed at a masked prompt, or piped in: `adhere login < key.txt`.
 * Whitespace around it, like the newline a pipe ends with, is dropped.
 */
const readApiKey = Effect.fn("login.readApiKey")(function* (label: string) {
  const stdio = yield* Stdio.Stdio;
  const typed: string = (yield* stdio.stdinIsTerminal)
    ? Redacted.value(yield* Prompt.run(Prompt.Password({ message: label })))
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

/** `--openai`: the OpenAI key, for the `openai` provider, in place of TypeSafe AI's. */
const openaiKey = Flag.Boolean("openai").pipe(
  Flag.withDefault(false),
  Flag.withDescription(
    "The OpenAI API key, for a config whose provider is openai(), in place of the TypeSafe AI key Jev asks with.",
  ),
);

/** Which saved key a command means, and how it names it: TypeSafe AI's by default. */
const keyOf = (openai: boolean) => {
  const name: SavedKey = openai ? "openai" : "typesafe";
  return { name, ...KEYS[name] };
};

/** `adhere login`: save an API key, so a run needs no TYPESAFE_API_KEY, or with `--openai`, no OPENAI_API_KEY. */
export const loginCommand = Command.make("login", { openai: openaiKey }, ({ openai }) =>
  Effect.gen(function* () {
    const { name, label, said } = keyOf(openai);
    const credentials = yield* Credentials;
    yield* credentials.save(name, yield* readApiKey(label));
    yield* Console.log(`Saved the ${said} to ${yield* credentials.file}.`);
  }),
).pipe(
  Command.withDescription(
    "Save a TypeSafe AI API key in ~/.config/adhere ($XDG_CONFIG_HOME/adhere when set), readable only by you, so lint runs without TYPESAFE_API_KEY. With --openai, save an OpenAI API key beside it instead, for the openai provider. Prompts for the key, or reads it from stdin when piped.",
  ),
  Command.provide(CredentialsLive),
);

/** `adhere logout`: delete a saved API key. */
export const logoutCommand = Command.make("logout", { openai: openaiKey }, ({ openai }) =>
  Effect.gen(function* () {
    const { name, said } = keyOf(openai);
    const credentials = yield* Credentials;
    const file = yield* credentials.file;
    const removed = yield* credentials.remove(name);
    yield* Console.log(
      removed ? `Deleted the ${said} saved in ${file}.` : `No ${said} is saved in ${file}.`,
    );
  }),
).pipe(
  Command.withDescription(
    "Delete the API key adhere login saved, or with --openai, the OpenAI one. TYPESAFE_API_KEY or OPENAI_API_KEY, when set, still applies.",
  ),
  Command.provide(CredentialsLive),
);

/** The agent skills the binary carries, by the name `adhere skill` takes. */
const skills = { docs: skill, setup: setupSkill, fix: fixSkill } as const;

const skillName = Argument.Literals("skill", ["docs", "setup", "fix"] as const).pipe(
  Argument.withDefault("docs" as const),
  Argument.withDescription(
    "docs, the default, the reference for rules, the config, and reports; setup, to set adhere up in a repo with the user, through its first lint and CI; fix, to verify and fix the findings lint reports.",
  ),
);

/** `adhere skill [docs|setup|fix]`: an agent skill, as shipped in the binary. */
export const skillCommand = Command.make("skill", { name: skillName }, ({ name }) =>
  Console.log(skills[name].trimEnd()),
).pipe(
  Command.withDescription(
    "Print an agent skill: by default adhere's reference, for writing rules, configuring adhere, and reading reports; with setup, the one that sets adhere up in a repo with the user, from choosing rules through the first lint to CI; with fix, the one that verifies and fixes lint's findings. Pipe it into .agents/skills/<name>/SKILL.md or hand it to an agent.",
  ),
);

const agent = Flag.Literals("agent", AGENTS).pipe(
  Flag.optional,
  Flag.withDescription(
    "The coding agent to ask this time: claude, codex, or omp, in place of the one setup saved.",
  ),
);

/** `adhere rules create [idea]`: a wizard that writes one rule, with a coding agent's help. */
const rulesCreateCommand = Command.make(
  "create",
  {
    idea: Argument.String("idea").pipe(
      Argument.optional,
      Argument.withDescription("What the rule should enforce. Asked for when left out."),
    ),
    agent,
    setup: Flag.Boolean("setup").pipe(
      Flag.withDefault(false),
      Flag.withDescription(
        "Choose again which agent to ask and which GitHub repo, as org/repo, holds the organization's shared rules. The first run asks without it.",
      ),
    ),
  },
  (input) => createRule(input.idea, input.agent, input.setup).pipe(Effect.provide(statusLayer)),
).pipe(
  Command.withDescription(
    "Write a rule with a coding agent's help: it suggests whether the convention is a native oxlint rule (an id from adhere's catalog; unknown ids are rejected, with its exact option values and the config to print or enable in the shared repo), a mechanical rule (an oxlint JS plugin, approved before it runs and tested on Node 22 or newer; a failed test gets one repair and reapproval), or one adhere must judge. It then suggests whether the rule belongs to this project or the organization's shared rules repo, names it, chooses a RULE.md or, when Jev needs state the file cannot show, a RULE.ts, and says which config context (typeAware, reads) it needs. It finds code in the repo for you to judge, with the lines around it, and drafts the rule from your answers; the draft is checked as adhere validate checks wording. A project rule is written to .adhere/rules/ or .adhere/oxlint/; an organization rule is pushed to the shared repo on a branch for a pull request.",
  ),
);

/**
 * `adhere rules readme`: refresh the managed index in a shared rules repo's
 * README from the rules and lint config checked out there.
 */
const rulesReadmeCommand = Command.make("readme", {}, () =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const refreshed = yield* refreshSharedReadme(path.resolve());
    yield* Console.log(refreshed.message);
  }).pipe(Effect.provide(statusLayer)),
).pipe(
  Command.withDescription(
    "Refresh the managed index in a shared rules repo's README from .adhere/rules/ and lint/rules.json: each rule's link and description, each enabled native Oxlint setting, and each custom plugin's enabled rules. Run it in the shared repo after adding, renaming, or deleting a rule, or changing a lint setting; it preserves the rest of the README and refuses malformed markers.",
  ),
);

export const rulesCommand = Command.make("rules").pipe(
  Command.withDescription("Work on this repo's rules."),
  Command.withSubcommands([rulesCreateCommand, rulesReadmeCommand]),
);

export const postinstallCommand = Command.make("postinstall", {}, () =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    yield* Console.log(yield* renderInstructions(path.resolve()));
  }),
).pipe(
  Command.withDescription(
    "Render instruction files recursively into a managed block in AGENTS.md.",
  ),
);

/** The whole CLI. Bare `adhere` prints its help. */
export const cli = Command.make("adhere").pipe(
  Command.withDescription("Lint a repository against the rules in .adhere/rules/, judged by Jev."),
  Command.withExamples([
    {
      command: "adhere init",
      description: "Scaffold config, tsconfig, and two example rules",
    },
    {
      command: "adhere validate",
      description: "Check the rules' wording, and ask Jev whether any contradict",
    },
    { command: "adhere login", description: "Save your TypeSafe AI API key for later runs" },
    { command: "adhere lint", description: "Audit the working directory" },
    {
      command: "adhere install org/repo",
      description: "Copy another repo's instructions and rules into this one",
    },
    {
      command: "adhere lint --preset effect",
      description: "Audit against the built-in Effect rules",
    },
  ]),
  Command.withSubcommands([
    lintCommand,
    validateCommand,
    initCommand,
    postinstallCommand,
    listCommand,
    installCommand,
    loginCommand,
    logoutCommand,
    skillCommand,
    rulesCommand,
  ]),
);
