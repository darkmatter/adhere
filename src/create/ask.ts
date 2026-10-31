/**
 * What `adhere rules create` asks the coding agent, and the answers it
 * decodes: the rule's shape, code in the repo for the user to judge, and the
 * rule file itself.
 */
import { type Agent, askAgent } from "#create/agents.ts";
import { spinning } from "#create/look.ts";
import { type OxlintCatalog, oxlintCatalog, oxlintRuleIds } from "#oxlint/catalog.ts";
import { Effect, Schema, SchemaGetter } from "effect";
import skill from "../../skills/adhere/SKILL.md" with { type: "text" };

export class RuleNotCreated extends Schema.TaggedError<RuleNotCreated>()("RuleNotCreated", {
  message: Schema.String,
}) {}

const KNOWN_LINTERS = new Set(oxlintRuleIds);

/**
 * What a rule's options look like on the wire: one plain JSON string, parsed
 * once here. Not `Schema.fromJsonString`, which marks it with a
 * `contentMediaType` that strict structured outputs reject.
 */
const OptionsFromJson = Schema.String.pipe(
  Schema.decodeTo(Schema.Array(Schema.Json), {
    decode: SchemaGetter.parseJson() as SchemaGetter.Getter<ReadonlyArray<Schema.Json>, string>,
    encode: SchemaGetter.stringifyJson(),
  }),
);

/**
 * A native rule id, a plain string on the wire: the catalog has more ids than
 * a provider's largest enum takes, so the catalog check runs here instead.
 */
const Linter = Schema.String.check(
  Schema.makeFilter((id) =>
    KNOWN_LINTERS.has(id) ? undefined : "not an oxlint rule in adhere's catalog",
  ),
);

/** The agent's answer: `linter` and its options are compact on the wire, a decoded pair here. */
export const Shape = Schema.Struct({
  linter: Schema.NullOr(Linter),
  linterOptions: OptionsFromJson,
  mechanical: Schema.Boolean,
  mechanicalReason: Schema.String,
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

/**
 * A diagnostic location on the wire: strict structured outputs require every
 * property, so agents send `null` when a location does not matter. Internally
 * `null` decodes to `undefined`, which `JSON.stringify` then omits.
 */
const Location = Schema.NullOr(Schema.Int).pipe(
  Schema.decodeTo(Schema.UndefinedOr(Schema.Int), {
    decode: SchemaGetter.transform((value: number | null) => value ?? undefined),
    encode: SchemaGetter.transform((value: number | undefined) => value ?? null),
  }),
);

/** One diagnostic an oxlint plugin must report for an invalid example. */
const PluginError = Schema.Struct({
  message: Schema.String,
  line: Location,
  column: Location,
});

/** An invalid example for an oxlint plugin: code and the diagnostics it must produce. */
const PluginInvalid = Schema.Struct({
  code: Schema.String,
  errors: Schema.Array(PluginError),
});

/** An agent's oxlint JS plugin rule, and the examples that show it works. */
export const PluginDraft = Schema.Struct({
  plugin: Schema.String,
  pluginName: Schema.String,
  ruleName: Schema.String,
  valid: Schema.Array(Schema.String),
  invalid: Schema.Array(PluginInvalid),
});
export type PluginDraft = typeof PluginDraft.Type;

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
  catalog: OxlintCatalog = oxlintCatalog,
) => `You are helping write a rule for adhere, a linter for conventions a normal linter cannot check: a model, Jev, judges each source file against each rule. A rule lives in .adhere/rules/<topic>/<name>/, either in this repository, for its own code, or in the organization's shared rules repository, which every repository installs from.

The user wants a rule for: ${idea}

Look at this repository as much as you need, then answer:
- linter: a string holding the id of one native oxlint rule listed below that already checks exactly this, or null. Do not name a rule that is not listed.
- linterOptions: a string holding that rule's own settings as a JSON array, exactly as a config writes them after the severity; for example the string '[{"paths": [{"name": "lodash"}]}]' for no-restricted-imports banning lodash, or '[{"max": 200}]' for max-lines. Use '[]' only when the rule's default settings already enforce this idea; a rule that does nothing until configured (no-restricted-imports, no-restricted-globals, no-restricted-properties, no-restricted-exports, id-length, max-lines, max-params, no-magic-numbers, unicorn/filename-case, typescript/no-restricted-types) always needs its settings here. When linter is null, use '[]'.
- mechanical: true when a small custom oxlint JS plugin that sees only the syntax tree and its scopes could decide this; false when it needs TypeScript types, the text of other files, a different parser, or anything else oxlint's JS plugins cannot see. When typeAware is true, mechanical must be false.
- mechanicalReason: one sentence saying why.
- scope: "project" when the rule is about this repository's own code, "org" when it would hold in any of the organization's repositories.
- scopeReason: one sentence saying why.
- format: "markdown" for a RULE.md, the rule's text and examples; nearly every rule is one. "typescript" for a RULE.ts, only when judging a file needs something neither the file nor the shared context below shows, such as a schema or a list another file holds: its appendState hook reads it and adds it to what Jev reads for that rule.
- formatReason: one sentence saying why.
- typeAware: true when judging needs the compiler's view of the file: the types of the names it uses, or the declarations of what it uses from other files. It is slower and costs more, so false unless the file cannot show it.
- reads: the shared context it needs: "workspacePackages", the workspace packages the file imports and their directories, and "dependents", what depends on the file. Empty when the code is enough.
- contextReason: one sentence saying why typeAware and reads are as you set them.
- names: three ids for the rule, each "topic/rule-name" in lowercase kebab case. Reuse a topic from .adhere/rules/ where one fits.

The catalog below is bundled with adhere and was generated from oxlint ${catalog.version}; the oxlint installed in this repository may be a different version, so a listed rule can be absent there and an installed native rule can be missing from this list. Its native rules follow, one per line as "id — what it checks". Use these ids exactly; a rule not listed here is not one adhere treats as native.

${catalog.rules.map((rule) => `- ${rule.id} — ${rule.summary} (${rule.category}${rule.typeAware ? ", type-aware" : ""})`).join("\n")}`;

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

/**
 * Asks for an oxlint JS plugin rule. The reply is a self-contained ESLint v9
 * plain-ESM plugin: oxlint loads it as written, so no TypeScript, imports, or
 * build-tool helpers.
 */
export const pluginPrompt = (
  idea: string,
  id: string,
  reviewed: ReadonlyArray<Reviewed>,
) => `Write one rule for oxlint as a JS plugin. The rule is called ${id}; it enforces: ${idea}

Oxlint's JS plugin API is ESLint v9's. Write a plain ESM module:
- No TypeScript, no imports, no Vite+ or build-tool helpers, no dependencies: oxlint loads the file as it is.
- Default-export { meta: { name: "<pluginName>" }, rules: { "<ruleName>": rule } }.
- The rule is { meta: { schema: [], messages: {...} }, create(context) { return { SomeNode(node) { ... } }; } }.
- Report with context.report({ message: "a literal message", node }) so the expected diagnostic is exact. Do not use messageId.
- Judge only the syntax tree and scopes. Oxlint JS plugins cannot see TypeScript types, other files' contents, or another parser's AST; do not reach for them.
- pluginName and ruleName are lowercase kebab case. pluginName must not be one oxlint has natively, such as eslint, typescript, react, import, jsdoc, jest, vitest, unicorn, jsx-a11y, nextjs, node, promise, vue, oxc, or react-perf.
- Give at least two valid snippets that must report nothing, and at least two invalid snippets. Each invalid snippet carries every diagnostic it must produce: message exactly as context.report writes it; line (1-based) and column (0-based) are always present: use null when a diagnostic's position does not matter.

${reviewedOf(reviewed)}

Answer with JSON: plugin (the module's whole source), pluginName, ruleName, valid (code strings), invalid (objects with code and errors, each { message, line, column }, with line and column null when unspecified).`;

/** What to send back to the agent once its plugin or examples fail oxlint's RuleTester. */
export const pluginFixPrompt = (
  prompt: string,
  draft: PluginDraft,
  problems: ReadonlyArray<string>,
) => `${prompt}

Your last answer failed its own tests:
${problems.map((problem) => `- ${problem}`).join("\n")}

The plugin was:

\`\`\`js
${draft.plugin}
\`\`\`

The examples were:
${draft.valid.map((code, index) => `Valid ${index + 1}:\n\`\`\`\n${code}\n\`\`\``).join("\n")}
${draft.invalid
  .map(
    (example, index) =>
      `Invalid ${index + 1}:\n\`\`\`\n${example.code}\n\`\`\`\nExpected: ${JSON.stringify(example.errors.map((error) => ({ message: error.message, line: error.line ?? null, column: error.column ?? null })))}`,
  )
  .join("\n")}

Fix the rule or the examples so every valid example reports nothing and every invalid example reports exactly the diagnostics it expects. Reply with only the corrected JSON.`;

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

export const askingFor = <A, I>(
  agent: Agent,
  what: string,
  cwd: string,
  prompt: string,
  Answer: Schema.Codec<A, I>,
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
