/**
 * `adhere rules create`: a wizard that writes one rule with the user, asking
 * an installed coding agent three times along the way. It suggests a scope,
 * names, a RULE.md or a RULE.ts, and the context Jev needs; finds code in the
 * repo for the user to judge; and writes the rule, which adhere checks as
 * `validate` does and sends back once when it falls short. A rule for the
 * organization goes to its shared rules repo, cloned, on a branch pushed for a
 * pull request. The first run, or `--setup`, saves which agent to ask and
 * which repo is the organization's.
 */
import { CONFIG_FILES, DEFAULT_READS } from "#config.ts";
import { AGENTS, type Agent, installedAgents, run } from "#create/agents.ts";
import {
  RuleNotCreated,
  Shape,
  asking,
  askingFor,
  shapePrompt,
  unfenced,
  writePrompt,
} from "#create/ask.ts";
import { reviewedInRepository } from "#create/examples.ts";
import { createOxlintRule } from "#create/oxlint.ts";
import { oxlintRule } from "#oxlint/catalog.ts";
import { decided, indented, intro, line, look, note, outro, spinning, warn } from "#create/look.ts";
import { cloned } from "#install.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { isSharedRepo, refreshIndexIfShared, refreshReadme, validateReadme } from "#readme.ts";
import { importRule } from "#rules.ts";
import { findConfigFile, loadConfigFile } from "#services/AdhereConfig.ts";
import { adhereConfigDirectory } from "#services/Credentials.ts";
import { sentenceOf, strayingOf } from "#wording.ts";
import { Config, Effect, FileSystem, Option, Path, Schema } from "effect";
import { Prompt } from "effect/cli";

const RULE_ID = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)+$/;

/** What setup saves: the agent to ask, and the organization's shared rules repo, when it has one. */
const Settings = Schema.Struct({
  agent: Schema.Literals(AGENTS),
  sharedRules: Schema.optionalKey(Schema.String),
});
type Settings = typeof Settings.Type;

/** `settings.json` beside `adhere login`'s keys. */
const settingsFile = Effect.gen(function* () {
  const path = yield* Path.Path;
  return yield* adhereConfigDirectory(path).pipe(
    Config.map((directory) => path.join(directory, "settings.json")),
    Effect.mapError(
      () =>
        new RuleNotCreated({
          message: "No home directory to keep settings in: set HOME or XDG_CONFIG_HOME.",
        }),
    ),
  );
});

const setUp = (file: string, named: Option.Option<Agent>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const installed = installedAgents();
    const [only, ...others] = installed;
    if (Option.isNone(named) && only === undefined) {
      return yield* new RuleNotCreated({
        message:
          "No coding agent found on PATH: install claude, codex, or omp, or hand `adhere skill docs` to the agent you use.",
      });
    }
    const agent = Option.isSome(named)
      ? named.value
      : only !== undefined && others.length === 0
        ? only
        : yield* Prompt.run(
            Prompt.Select({
              message: "Which agent should help write rules?",
              choices: installed.map((agent) => ({ title: agent, value: agent })),
            }),
          );
    const shared = yield* Prompt.run(
      Prompt.String({
        message: "Your organization's shared rules repo on GitHub, as org/repo (empty for none)",
        validate: (value) =>
          value === "" || /^[\w.-]+\/[\w.-]+$/.test(value)
            ? Effect.succeed(value)
            : Effect.fail("org/repo, as on GitHub, or empty."),
      }),
    );
    const settings: Settings = { agent, ...(shared === "" ? {} : { sharedRules: shared }) };
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, `${JSON.stringify(settings, null, 2)}\n`);
    yield* note(`Saved to ${file}. Run adhere rules create --setup to change it.`);
    return settings;
  });

const failed = (cause: unknown) =>
  new RuleNotCreated({ message: cause instanceof Error ? cause.message : String(cause) });

const git = (cwd: string, args: ReadonlyArray<string>) =>
  Effect.tryPromise({ try: () => run("git", args, cwd, ""), catch: failed });

/**
 * What adhere can say of a draft without running it: for a RULE.md, what
 * `validate` would; for a RULE.ts, whether it parses and has a default export.
 */
const problemsOf = (text: string, file: string, format: Shape["format"]) =>
  format === "markdown"
    ? parseRuleMarkdown(text, file).pipe(
        Effect.map((rule) => strayingOf(rule).map(sentenceOf)),
        Effect.catchTag("ConfigUnavailable", ({ message }) => Effect.succeed([message])),
      )
    : Effect.try({
        try: () => new Bun.Transpiler({ loader: "ts" }).scan(text).exports,
        catch: (cause) => (cause instanceof Error ? cause.message : String(cause)),
      }).pipe(
        Effect.map((exports) =>
          exports.includes("default") ? [] : ["It has no default export: defineRule({...})."],
        ),
        Effect.catch((message) => Effect.succeed([`It does not parse: ${message}`])),
      );

/**
 * What `validate` would say of a RULE.ts the user has approved: imported from
 * a temporary directory, so its code runs.
 */
const loadedProblems = (text: string, shown: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const file = path.join(
      yield* fs.makeTempDirectoryScoped({ prefix: "adhere-rule-" }),
      "RULE.ts",
    );
    yield* fs.writeFileString(file, text);
    return yield* importRule(file).pipe(
      Effect.map((rule) => strayingOf(rule).map(sentenceOf)),
      Effect.catchTag("ConfigUnavailable", ({ message }) =>
        Effect.succeed([message.replaceAll(file, shown)]),
      ),
    );
  });

/**
 * The config settings the rule needs that `config` lacks, as they would be
 * written in it. The rule declares its reads, but the config still enables
 * them and type awareness.
 */
const settingsFor = (
  shape: Shape,
  config: { readonly typeAware?: boolean; readonly reads?: ReadonlyArray<string> },
) => {
  const reads = config.reads ?? DEFAULT_READS;
  const missing = shape.reads.filter((read) => !reads.includes(read));
  return [
    ...(shape.typeAware && config.typeAware !== true ? ["typeAware: true"] : []),
    ...(missing.length === 0
      ? []
      : [`reads: [${[...reads, ...missing].map((read) => `"${read}"`).join(", ")}]`]),
  ];
};

export const createRule = Effect.fn("createRule")(
  function* (given: Option.Option<string>, named: Option.Option<Agent>, setup: boolean) {
    yield* intro("adhere rules create");
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const root = path.resolve();
    const saved = yield* settingsFile;
    const settings =
      setup || !(yield* fs.exists(saved))
        ? yield* setUp(saved, named)
        : yield* fs.readFileString(saved).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(Settings))),
            Effect.mapError(
              (problem) =>
                new RuleNotCreated({
                  message: `${saved}: ${problem.message}. Run adhere rules create --setup to write it again.`,
                }),
            ),
          );
    const agent = Option.getOrElse(named, () => settings.agent);
    const shared = settings.sharedRules;
    const idea = Option.isSome(given)
      ? given.value
      : yield* Prompt.run(Prompt.String({ message: "What should the rule enforce?" }));

    const shape = yield* askingFor(agent, "how to shape it", root, shapePrompt(idea), Shape);
    const native = shape.linter === null ? undefined : oxlintRule(shape.linter);
    if (native !== undefined) {
      return yield* createOxlintRule({ agent, idea, shape, root, shared });
    }
    if (shape.mechanical && !shape.typeAware) {
      const approach = yield* Prompt.run(
        Prompt.Select({
          message: "A custom oxlint JS plugin can check this. Which do you want?",
          choices: [
            { title: "Write an oxlint plugin", value: "plugin" as const },
            { title: "Write an adhere rule", value: "adhere" as const },
          ],
        }),
      );
      if (approach === "plugin") {
        return yield* createOxlintRule({ agent, idea, shape, root, shared });
      }
    }
    const ruleFile = shape.format === "typescript" ? "RULE.ts" : "RULE.md";
    yield* decided(`A ${ruleFile}`, shape.formatReason);
    yield* decided(
      `Jev reads ${["the code", ...shape.reads, ...(shape.typeAware ? ["its types"] : [])].join(", ")}`,
      shape.contextReason,
    );

    const scopes = [
      { title: "This project", value: "project" as const, description: ".adhere/rules/" },
      { title: "The organization", value: "org" as const, description: shared ?? "" },
    ].map((choice) =>
      choice.value === shape.scope
        ? { ...choice, description: indented(shape.scopeReason) }
        : choice,
    );
    if (shared === undefined && shape.scope === "org") {
      yield* warn(
        `${agent} suggests the organization's shared rules, but none is set up, so the rule goes in this project.\nRun adhere rules create --setup to name the shared repo.`,
      );
    }
    const scope =
      shared === undefined
        ? "project"
        : yield* Prompt.run(
            Prompt.Select({
              message: "Where does the rule belong?",
              choices: shape.scope === "org" ? scopes.toReversed() : scopes,
            }),
          );
    const repo =
      scope === "org" && shared !== undefined
        ? yield* spinning(`Cloning ${shared}`, cloned({ repo: shared, rule: "" }))
        : root;
    const rules = path.join(repo, ".adhere", "rules");

    const free = (id: string) =>
      fs.exists(path.join(rules, id)).pipe(
        Effect.orElseSucceed(() => true),
        Effect.map((taken) => !taken),
      );
    const suggested = yield* Effect.filter(
      shape.names.filter((id) => RULE_ID.test(id)),
      free,
    );
    const picked = yield* Prompt.run(
      Prompt.Select({
        message: "Name",
        choices: [
          ...suggested.map((id) => ({ title: id, value: Option.some(id) })),
          { title: "Type my own", value: Option.none<string>() },
        ],
      }),
    );
    const id = Option.isSome(picked)
      ? picked.value
      : yield* Prompt.run(
          Prompt.String({
            message: "Rule id, as topic/rule-name",
            validate: (value) =>
              !RULE_ID.test(value)
                ? Effect.fail("Lowercase kebab case, under a topic: topic/rule-name.")
                : free(value).pipe(
                    Effect.flatMap((ok) =>
                      ok ? Effect.succeed(value) : Effect.fail("A rule by that id exists."),
                    ),
                  ),
          }),
        );

    const reviewed = yield* reviewedInRepository(agent, root, idea, id);

    const file = path.join(rules, id, ruleFile);
    const branch = `adhere/${id}`;
    const prompt = writePrompt(idea, id, shape, reviewed);
    const draft = unfenced(yield* asking(agent, "to write the rule", root, prompt));
    const draftProblems = yield* problemsOf(draft, file, shape.format);
    const text =
      draftProblems.length === 0
        ? draft
        : unfenced(
            yield* asking(
              agent,
              "to fix the rule",
              root,
              `${prompt}\n\nYour last draft:\n\n${draft}\n\nadhere found these problems with it:\n${draftProblems.map((problem) => `- ${problem}`).join("\n")}\n\nFix them, and reply with only the corrected file.`,
            ),
          );
    const problems = yield* problemsOf(text, file, shape.format);

    yield* line(`\n${text}\n`);
    for (const problem of problems) yield* warn(problem);
    const write = yield* Prompt.run(
      Prompt.Confirm({
        message:
          scope === "project"
            ? `Write ${path.relative(root, file)}?`
            : `Push it to ${shared} on the branch ${branch}?`,
        initial: problems.length === 0,
      }),
    );
    if (!write) return yield* outro("Nothing written.");
    // A RULE.ts is only imported, and its code run, once the user has read it.
    if (shape.format === "typescript") {
      const loaded = yield* loadedProblems(text, path.relative(root, file));
      for (const problem of loaded) yield* warn(problem);
      if (
        loaded.length > 0 &&
        !(yield* Prompt.run(Prompt.Confirm({ message: "Write it anyway?", initial: false })))
      ) {
        return yield* outro("Nothing written.");
      }
    }
    const sharedHere = scope === "project" ? yield* isSharedRepo(root) : false;
    if (sharedHere) yield* validateReadme(root);
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, `${text}\n`);

    if (scope === "project") {
      const configFile = yield* findConfigFile(root).pipe(Effect.orElseSucceed(() => undefined));
      const config =
        configFile === undefined
          ? {}
          : yield* loadConfigFile(path.join(root, configFile)).pipe(
              Effect.orElseSucceed(() => ({})),
            );
      const needed = settingsFor(shape, config);
      if (needed.length > 0) {
        yield* warn(
          `${id} needs ${needed.join(" and ")} in ${configFile ?? CONFIG_FILES[0]}${shape.typeAware ? " (or lint --type-aware)" : ""}. Until then, lint judges it without that context.`,
        );
      }
      const refreshed = sharedHere ? yield* refreshReadme(root) : undefined;
      return yield* outro(
        `Wrote ${path.relative(root, file)}.\n${refreshed === undefined ? "" : `${refreshed.message}\n`}Run adhere validate to check it against your other rules.`,
      );
    }
    const needed = settingsFor(shape, {});
    const needs =
      needed.length === 0
        ? []
        : [`Repos that install it need ${needed.join(" and ")} in their adhere config.`];
    // A shared repo's index joins the rule in one commit and one pull request;
    // a legacy rules-only repo has no index to refresh.
    const indexed = yield* refreshIndexIfShared(repo);
    yield* git(repo, ["switch", "--quiet", "--create", branch]);
    const staged = [path.relative(repo, file)];
    if (indexed) staged.push("README.md");
    yield* git(repo, ["add", "--", ...staged]);
    yield* git(repo, [
      "commit",
      "--quiet",
      "--message",
      `Add rule ${id}`,
      ...needs.flatMap((body) => ["--message", body]),
    ]);
    yield* git(repo, ["push", "--quiet", "origin", branch]);
    yield* outro(
      [
        `Pushed ${branch} to ${shared}.`,
        ...needs,
        `Open the pull request: https://github.com/${shared}/compare/${branch}?expand=1`,
      ].join("\n"),
    );
  },
  Effect.scoped,
  (effect) => Effect.provideService(effect, Prompt.Theme, Prompt.makeTheme(look)),
);
