/**
 * `adhere rules create`: a wizard that writes one rule with the user, asking
 * an installed coding agent three times along the way. It suggests a scope and
 * names, finds examples in the repo, and writes the RULE.md, which adhere
 * checks as `validate` does and sends back once when it falls short. A rule
 * for the organization goes to its shared rules repo, cloned, on a branch
 * pushed for a pull request. The first run, or `--setup`, saves which agent
 * to ask and which repo is the organization's.
 */
import { AGENTS, type Agent, askAgent, installedAgents, run } from "#agents.ts";
import { cloned } from "#install.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { sentenceOf, strayingOf } from "#wording.ts";
import { adhereConfigDirectory } from "#services/Credentials.ts";
import { Config, Console, Effect, FileSystem, Option, Path, Schema } from "effect";
import { Prompt } from "effect/cli";
import skill from "../skills/adhere/SKILL.md" with { type: "text" };

export class RuleNotCreated extends Schema.TaggedError<RuleNotCreated>()("RuleNotCreated", {
  message: Schema.String,
}) {}

const Shape = Schema.Struct({
  linter: Schema.NullOr(Schema.String),
  scope: Schema.Literals(["project", "org"]),
  scopeReason: Schema.String,
  names: Schema.Array(Schema.String),
});

const Snippet = Schema.Struct({ file: Schema.String, line: Schema.Finite, code: Schema.String });
const Examples = Schema.Struct({ must: Schema.Array(Snippet), never: Schema.Array(Snippet) });
type Example = { readonly word: "must" | "never" } & typeof Snippet.Type;

const RULE_ID = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)+$/;

const shapePrompt = (
  idea: string,
) => `You are helping write a rule for adhere, a linter for conventions a normal linter cannot check: a model judges code against each rule. A rule lives in .adhere/rules/<topic>/<name>/RULE.md, either in this repository, for its own code, or in the organization's shared rules repository, which every repository installs from.

The user wants a rule for: ${idea}

Look at this repository as much as you need, then answer:
- linter: an existing linter rule (ESLint, oxlint, TypeScript, or the like) that already checks this, by name, or null.
- scope: "project" when the rule is about this repository's own code, "org" when it would hold in any of the organization's repositories.
- scopeReason: one sentence saying why.
- names: three ids for the rule, each "topic/rule-name" in lowercase kebab case. Reuse a topic from .adhere/rules/ where one fits.`;

const examplesPrompt = (
  idea: string,
  id: string,
) => `Find code in this repository for the adhere rule ${id}: ${idea}

Under "must", give up to three excerpts that follow the rule; under "never", up to three that break it. Each is the repo-relative file, the excerpt's first line number, and the code, at most 15 lines. Use only code that exists, and leave a list empty when there is none.`;

const writePrompt = (idea: string, id: string, examples: ReadonlyArray<Example>) => `${skill}

---

Using the reference above, write the RULE.md for this adhere rule.

Rule id: ${id}
What it enforces: ${idea}
${
  examples.length === 0
    ? "No code from the repository was chosen: write short examples of your own."
    : `Code from the repository to base its examples on:\n\n${examples
        .map(({ word, file, line, code }) => `${word}, ${file}:${line}\n\`\`\`\n${code}\n\`\`\``)
        .join("\n\n")}`
}

Reply with only the file's contents, starting with its front matter.`;

/**
 * The wizard's look: Clack's rail, drawn by effect/cli's own prompts through
 * their theme, with the lines between prompts hung on the same rail. Every
 * row's text starts in the fourth column: after the prompt's symbol and two
 * spaces, a select's pointer and its two-wide paging arrow, or the paging
 * arrow and a space before a multi-select's checkbox.
 */
const look: Partial<Prompt.Theme> = {
  prefix: "◆ ",
  tick: "◇ ",
  pointer: "●",
  arrowUp: "↑ ",
  arrowDown: "↓ ",
  pointerSmall: "",
  ellipsis: "",
  descriptionSeparator: "\n   ",
  checkboxOn: "◼",
  checkboxOff: "◻",
};

/** `text` wrapped to the terminal, each further line indented under a choice's title as the first is. */
const indented = (text: string) =>
  Bun.wrapAnsi(text, Math.max((process.stdout.columns ?? 80) - 4, 20)).replaceAll("\n", "\n   ");

type Color = (theme: Prompt.Theme) => string;
const muted: Color = (theme) => theme.mutedColor;

/**
 * Prints `text` beside `symbol`, its further lines beside `bar`, in color
 * when the theme has colors.
 */
const rail = (symbol: string, symbolColor: Color, text: string, textColor?: Color, bar = "│") =>
  Effect.gen(function* () {
    const theme = yield* Prompt.Theme;
    const paint = (part: string, color?: Color) =>
      theme.colors && color !== undefined ? `${color(theme)}${part}\x1b[0m` : part;
    const [first = "", ...rest] = text.split("\n");
    yield* Console.error(
      [
        `${paint(symbol, symbolColor)}  ${paint(first, textColor)}`,
        ...rest.map((line) => `${paint(bar, muted)}  ${paint(line, textColor)}`),
      ].join("\n"),
    );
  });
const note = (text: string) => rail("│", muted, text, muted);
const warn = (text: string) => rail("▲", () => "\x1b[33m", text);
const outro = (text: string) => rail("└", (theme) => theme.successColor, text, undefined, " ");

/** An agent's reply as the file it holds, without the fence it may wrap it in. */
const unfenced = (text: string) =>
  /^\s*```[a-z]*\n([\s\S]*?)\n```\s*$/.exec(text)?.[1] ?? text.trim();

const asking = (agent: Agent, what: string, cwd: string, prompt: string, schema?: object) =>
  note(`Asking ${agent} ${what}…`).pipe(
    Effect.andThen(
      Effect.tryPromise({
        try: () => askAgent(agent, prompt, cwd, schema),
        catch: (cause) =>
          new RuleNotCreated({ message: cause instanceof Error ? cause.message : String(cause) }),
      }),
    ),
  );

const askingFor = <A>(
  agent: Agent,
  what: string,
  cwd: string,
  prompt: string,
  Answer: Schema.Codec<A, A>,
) =>
  asking(
    agent,
    what,
    cwd,
    prompt,
    Schema.toJsonSchemaDocument(Answer, { onExcessProperty: "error" }).schema,
  ).pipe(
    Effect.flatMap((text) =>
      Schema.decodeUnknownEffect(Schema.fromJsonString(Answer))(text).pipe(
        Effect.mapError(
          (problem) =>
            new RuleNotCreated({ message: `${agent}'s answer did not decode: ${problem.message}` }),
        ),
      ),
    ),
  );

/** What `validate` would say of the rule's text: why it does not parse, or how its wording strays. */
const problemsOf = (text: string, file: string) =>
  parseRuleMarkdown(text, file).pipe(
    Effect.map((rule) => strayingOf(rule).map(sentenceOf)),
    Effect.catchTag("ConfigUnavailable", ({ message }) => Effect.succeed([message])),
  );

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

const git = (cwd: string, args: ReadonlyArray<string>) =>
  Effect.tryPromise({
    try: () => run("git", args, cwd, ""),
    catch: (cause) =>
      new RuleNotCreated({ message: cause instanceof Error ? cause.message : String(cause) }),
  });

export const createRule = Effect.fn("createRule")(
  function* (given: Option.Option<string>, named: Option.Option<Agent>, setup: boolean) {
    yield* rail("┌", muted, "adhere rules create");
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
    if (shape.linter !== null) {
      const anyway = yield* Prompt.run(
        Prompt.Confirm({
          message: `A linter could check this: ${shape.linter}. Write an adhere rule anyway?`,
          initial: false,
        }),
      );
      if (!anyway) return yield* outro("Nothing written.");
    }

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
        ? yield* note(`Cloning ${shared}…`).pipe(Effect.andThen(cloned({ repo: shared, rule: "" })))
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

    // Examples are optional: an agent that cannot search the repo, such as codex
    // without its sandbox, leaves the rule's examples to the draft.
    const found = yield* askingFor(
      agent,
      "for examples in the repo",
      root,
      examplesPrompt(idea, id),
      Examples,
    ).pipe(
      Effect.catch(({ message }) =>
        warn(`No examples from the repo: ${message}`).pipe(Effect.as({ must: [], never: [] })),
      ),
    );
    const candidates: ReadonlyArray<Example> = [
      ...found.must.map((snippet) => ({ word: "must" as const, ...snippet })),
      ...found.never.map((snippet) => ({ word: "never" as const, ...snippet })),
    ];
    const examples =
      candidates.length === 0
        ? []
        : yield* Prompt.run(
            Prompt.MultiSelect({
              message: "Examples to base the rule on",
              choices: candidates.map((example) => ({
                title: `${example.word.padEnd(5)}  ${example.file}:${example.line}`,
                value: example,
                description: example.code.trim().split("\n", 1).join(""),
              })),
            }),
          );

    const file = path.join(rules, id, "RULE.md");
    const branch = `adhere/${id}`;
    const draft = unfenced(
      yield* asking(agent, "to write the rule", root, writePrompt(idea, id, examples)),
    );
    const draftProblems = yield* problemsOf(draft, file);
    const text =
      draftProblems.length === 0
        ? draft
        : unfenced(
            yield* asking(
              agent,
              "to fix the rule",
              root,
              `${writePrompt(idea, id, examples)}\n\nYour last draft:\n\n${draft}\n\nadhere found these problems with it:\n${draftProblems.map((problem) => `- ${problem}`).join("\n")}\n\nFix them, and reply with only the corrected file.`,
            ),
          );
    const problems = yield* problemsOf(text, file);

    yield* rail("│", muted, `\n${text}\n`);
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
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, `${text}\n`);
    if (scope === "project") {
      return yield* outro(
        `Wrote ${path.relative(root, file)}.\nRun adhere validate to check it against your other rules.`,
      );
    }
    yield* git(repo, ["switch", "--quiet", "--create", branch]);
    yield* git(repo, ["add", "--", path.relative(repo, file)]);
    yield* git(repo, ["commit", "--quiet", "--message", `Add rule ${id}`]);
    yield* git(repo, ["push", "--quiet", "origin", branch]);
    yield* outro(
      `Pushed ${branch} to ${shared}.\nOpen the pull request: https://github.com/${shared}/compare/${branch}?expand=1`,
    );
  },
  Effect.scoped,
  (effect) => Effect.provideService(effect, Prompt.Theme, Prompt.makeTheme(look)),
);
