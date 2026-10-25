/**
 * What `adhere rules create` asks the coding agent, and the answers it
 * decodes: the rule's shape, code in the repo for the user to judge, and the
 * rule file itself.
 */
import { type Agent, askAgent } from "#create/agents.ts";
import { spinning } from "#create/look.ts";
import { Effect, Schema } from "effect";
import skill from "../../skills/adhere/SKILL.md" with { type: "text" };

export class RuleNotCreated extends Schema.TaggedError<RuleNotCreated>()("RuleNotCreated", {
  message: Schema.String,
}) {}

export const Shape = Schema.Struct({
  linter: Schema.NullOr(Schema.String),
  scope: Schema.Literals(["project", "org"]),
  scopeReason: Schema.String,
  format: Schema.Literals(["markdown", "typescript"]),
  formatReason: Schema.String,
  typeAware: Schema.Boolean,
  reads: Schema.Array(Schema.Literals(["workspacePackages", "dependents"])),
  contextReason: Schema.String,
  names: Schema.Array(Schema.String),
});
export type Shape = typeof Shape.Type;

const Candidate = Schema.Struct({
  file: Schema.String,
  startLine: Schema.Int,
  endLine: Schema.Int,
  violation: Schema.Boolean,
  reason: Schema.String,
});
export type Candidate = typeof Candidate.Type;
export const Candidates = Schema.Struct({ candidates: Schema.Array(Candidate) });

/** Code from the repo the user has judged: where it is, as the file holds it, and whether it breaks the rule. */
export interface Reviewed {
  readonly where: string;
  readonly code: string;
  readonly violation: boolean;
  /** Whether the user's call matched the agent's. */
  readonly agreed: boolean;
}

export const shapePrompt = (
  idea: string,
) => `You are helping write a rule for adhere, a linter for conventions a normal linter cannot check: a model, Jev, judges each source file against each rule. A rule lives in .adhere/rules/<topic>/<name>/, either in this repository, for its own code, or in the organization's shared rules repository, which every repository installs from.

The user wants a rule for: ${idea}

Look at this repository as much as you need, then answer:
- linter: an existing linter rule (ESLint, oxlint, TypeScript, or the like) that already checks this, by name, or null.
- scope: "project" when the rule is about this repository's own code, "org" when it would hold in any of the organization's repositories.
- scopeReason: one sentence saying why.
- format: "markdown" for a RULE.md, the rule's text and examples; nearly every rule is one. "typescript" for a RULE.ts, only when judging a file needs something neither the file nor the shared context below shows, such as a schema or a list another file holds: its appendState hook reads it and adds it to what Jev reads for that rule.
- formatReason: one sentence saying why.
- typeAware: true when judging needs the compiler's view of the file: the types of the names it uses, or the declarations of what it uses from other files. It is slower and costs more, so false unless the file cannot show it.
- reads: the shared context it needs: "workspacePackages", the workspace packages the file imports and their directories, and "dependents", what depends on the file. Empty when the code is enough.
- contextReason: one sentence saying why typeAware and reads are as you set them.
- names: three ids for the rule, each "topic/rule-name" in lowercase kebab case. Reuse a topic from .adhere/rules/ where one fits.`;

export const examplesPrompt = (
  idea: string,
  id: string,
) => `Find code in this repository to test the adhere rule ${id}: ${idea}

Give up to six excerpts, a mix of code that breaks the rule and code that follows it; borderline cases are the most useful. Each is the repo-relative file, the excerpt's first and last line numbers, at most 15 lines apart, violation: whether it breaks the rule, and reason: one sentence saying why. Use only code that exists, and give none when there is none.`;

const contextOf = (shape: Shape) =>
  [
    "`code`",
    ...shape.reads.map((read) => `\`${read}\``),
    ...(shape.typeAware ? ["`symbols`", "`references`"] : []),
  ].join(", ");

const typescriptFormat = (shape: Shape) =>
  `Write it as a RULE.ts, because ${shape.formatReason} It imports defineRule from "@drkmttr/adhere" and default-exports defineRule({ description, details, must, never, appendState }). appendState(state, file, Bun) runs before each request for the rule: file is { path, contents }, its path absolute, and Bun is Bun's API, as in Bun.file(path).text() or new Bun.Glob(pattern). What it returns is spread over the request's state; name each key it adds in the description, in backticks. Helpers go in the same file.`;

const reviewedOf = (reviewed: ReadonlyArray<Reviewed>) =>
  reviewed.length === 0
    ? "No code from the repository was judged: write short examples of your own."
    : `The user judged this code from the repository. Base the rule's examples on what shows it best; you need not use all of it. Where the user overruled your first call, word the rule so the difference is clear.\n\n${reviewed
        .map(
          ({ where, code, violation, agreed }) =>
            `${violation ? "Breaks the rule" : "Does not break the rule"}, ${where}${agreed ? "" : " (overruled)"}\n\`\`\`\n${code}\n\`\`\``,
        )
        .join("\n\n")}`;

export const writePrompt = (
  idea: string,
  id: string,
  shape: Shape,
  reviewed: ReadonlyArray<Reviewed>,
) => `${skill}

---

Using the reference above, write the rule file for this adhere rule.

Rule id: ${id}
What it enforces: ${idea}
What Jev reads beside the rule: ${contextOf(shape)}
${shape.format === "typescript" ? typescriptFormat(shape) : "Write it as a RULE.md."}

${reviewedOf(reviewed)}

Reply with only the file's contents, starting with its ${shape.format === "typescript" ? "imports" : "front matter"}.`;

/** An agent's reply as the file it holds, without the fence it may wrap it in. */
export const unfenced = (text: string) =>
  /^\s*```[a-z]*\n([\s\S]*?)\n```\s*$/.exec(text)?.[1] ?? text.trim();

export const asking = (agent: Agent, what: string, cwd: string, prompt: string, schema?: object) =>
  spinning(
    `Asking ${agent} ${what}`,
    Effect.tryPromise({
      try: () => askAgent(agent, prompt, cwd, schema),
      catch: (cause) =>
        new RuleNotCreated({ message: cause instanceof Error ? cause.message : String(cause) }),
    }),
  );

export const askingFor = <A>(
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
