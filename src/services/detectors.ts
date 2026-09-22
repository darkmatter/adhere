import type { Detector, Finding, ScannedFile } from "#models/Audit.ts";

/**
 * One line-level test plus its evidence. A detector is a list of these; the
 * scan applies each test to every line and keeps the first match per line.
 */
interface LineRule {
  readonly rule: string;
  /** What is wrong when this rule matches. Printed as the diagnostic message. */
  readonly message: string;
  /** How to fix it. Printed on the hint line. */
  readonly help: string;
  readonly test: (line: string) => boolean;
  /** 0-based index of the span to underline, or -1 when the line does not match. */
  readonly at: (line: string) => number;
}

/** The line-level findings of one rule over one file: the loop a detector owns. */
const scanLines = (rules: ReadonlyArray<LineRule>, file: ScannedFile) => {
  const found: Array<Finding> = [];
  for (const [index, line] of file.lines.entries()) {
    const hit = rules.find((rule) => rule.test(line));
    if (hit === undefined) continue;
    const indent = line.length - line.trimStart().length;
    const snippet = line.trim().slice(0, 120);
    const raw = hit.at(line);
    const column = raw < indent ? 1 : raw - indent + 1;
    found.push({
      rule: hit.rule,
      message: hit.message,
      help: hit.help,
      line: index + 1,
      column: Math.min(column, Math.max(snippet.length, 1)),
      snippet,
    });
  }
  return found;
};

const detector = (topic: string, rules: ReadonlyArray<LineRule>): Detector => ({
  topic,
  rules: rules.map((rule) => rule.rule),
  descriptions: rules.map(
    (rule) => `${topic}/${rule.rule}\n${rule.message}\n${rule.help}`,
  ),
  scan: (file) => scanLines(rules, file),
});

/** A line test plus the column of the earliest needle, for the code frame. */
const mark = (...needles: ReadonlyArray<string>) => {
  const at = (line: string): number => {
    let found = -1;
    for (const needle of needles) {
      const index = line.indexOf(needle);
      if (index >= 0 && (found < 0 || index < found)) found = index;
    }
    return found;
  };
  return { test: (line: string) => at(line) >= 0, at };
};

/**
 * Detectors, keyed by the `effect-solutions` topic slugs. Each rule cites
 * the topic's documented pattern. `message` says what is wrong. `help`
 * says how to fix it.
 */
export const detectors: ReadonlyArray<Detector> = [
  // quick-start: agents consult the CLI rather than guessing docs.
  detector("quick-start", [
    {
      rule: "hardcodes-effect-docs",
      message: "Effect docs URL is hardcoded.",
      help: "Run `effect-solutions show <topic>` instead of linking a docs site.",
      ...mark("effect.website", "effect-ts.github.io"),
    },
  ]),
  // basics: Effect.gen/Effect.fn sequencing; no nested .then() chains.
  detector("basics", [
    {
      rule: "promise-then-chain",
      message: "Promise .then chain sequences async work.",
      help: "Sequence it with Effect.gen and yield* instead of .then.",
      ...mark(".then("),
    },
  ]),
  // services-and-layers: Context.Service declarations, named layer exports.
  detector("services-and-layers", [
    {
      rule: "context-tag-declaration",
      message: "Service is declared with Context.Tag.",
      help: "Declare it with Context.Service and provide it with Layer.effect.",
      ...mark("Context.Tag("),
    },
  ]),
  // data-modeling: schema-first models with branded primitives.
  detector("data-modeling", [
    {
      rule: "handrolled-tag-union",
      message: "Tagged union is written by hand.",
      help: "Define it with Schema.TaggedStruct or Schema.TaggedUnion.",
      ...mark("readonly _tag:"),
    },
    {
      rule: "raw-primitive-id",
      message: "Identifier is a raw string.",
      help: 'Brand it with Schema.String.pipe(Schema.brand("Name")).',
      ...mark("id: string"),
    },
  ]),
  // error-handling: Schema.TaggedError for typed failures.
  detector("error-handling", [
    {
      rule: "untagged-new-error",
      message: "Failure is a plain Error.",
      help: "Define a Schema.TaggedError and fail with that class instead.",
      ...mark("new Error("),
    },
  ]),
  // config: Config with providers; no process.env in application logic.
  detector("config", [
    {
      rule: "process-env-read",
      message: "Configuration is read from process.env.",
      help: "Read it with Config.string, Config.int, or Config.redacted.",
      ...mark("process.env."),
    },
    {
      rule: "globalthis-process-env",
      message: "Configuration is read from globalThis.process.env.",
      help: "Read it with Config and supply values through a ConfigProvider.",
      ...mark("globalThis.process?.env"),
    },
  ]),
  // testing: vitest (@effect/vitest style), never bun:test.
  detector("testing", [
    {
      rule: "bun-test-import",
      message: "Test imports bun:test.",
      help: "Import the test APIs from vitest, or use @effect/vitest.",
      ...mark('from "bun:test"'),
    },
    {
      rule: "console-assert",
      message: "Assertion uses console.assert.",
      help: "Replace it with expect from vitest.",
      ...mark("console.assert("),
    },
  ]),
  // cli: Effect's CLI module for command surfaces.
  detector("cli", [
    {
      rule: "raw-argv-read",
      message: "Arguments are read from process.argv.",
      help: "Parse them with Command and Flag from effect/unstable/cli.",
      ...mark("process.argv"),
    },
    {
      rule: "yargs-minimist",
      message: "CLI parsing uses yargs or minimist.",
      help: "Replace it with Command and Flag from effect/unstable/cli.",
      ...mark('from "yargs"', 'from "minimist"'),
    },
  ]),
  // tsconfig: strict flags that effect-solutions recommends.
  detector("tsconfig", [
    {
      rule: "loose-non-null",
      message: "Non-null assertion bypasses strict null checks.",
      help: "Narrow the value with a condition or Option instead of !.",
      test: (line) => line.includes("!.") && !line.includes("!=="),
      at: (line) => line.indexOf("!."),
    },
  ]),
  // project-setup: the language-service plugin belongs in tsconfig plugins.
  detector("project-setup", [
    {
      rule: "direct-lsp-import",
      message: "@effect/language-service is imported in source.",
      help: "Register it under compilerOptions.plugins in tsconfig.",
      ...mark("@effect/language-service"),
    },
  ]),
];

/** The slugs every detector serves; the audit checks the CLI publishes them. */
export const detectorTopics = (): ReadonlySet<string> =>
  new Set(detectors.map((each) => each.topic));
