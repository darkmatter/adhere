import { defineConfig, includes } from "./src/rules.ts";

/**
 * The rules for this repository. A rule with `includes` (or its own `test`)
 * flags the matching line. A rule with `judged: true` and a `pattern` has no
 * line test: Jev reads the file and decides.
 */
export default defineConfig([
  {
    topic: "quick-start",
    rule: "hardcodes-effect-docs",
    message: "Effect docs URL is hardcoded.",
    help: "Look the topic up from the installed docs instead of linking a docs site.",
    ...includes("effect.website", "effect-ts.github.io"),
  },
  {
    topic: "basics",
    rule: "promise-then-chain",
    message: "Promise .then chain sequences async work.",
    help: "Sequence it with Effect.gen and yield* instead of .then.",
    ...includes(".then("),
  },
  {
    topic: "services-and-layers",
    rule: "context-tag-declaration",
    message: "Service is declared with Context.Tag.",
    help: "Declare it with Context.Service and provide it with Layer.effect.",
    ...includes("Context.Tag("),
  },
  {
    topic: "data-modeling",
    rule: "handrolled-tag-union",
    message: "Tagged union is written by hand.",
    help: "Define it with Schema.TaggedStruct or Schema.TaggedUnion.",
    ...includes("readonly _tag:"),
  },
  {
    topic: "data-modeling",
    rule: "raw-primitive-id",
    message: "Identifier is a raw string.",
    help: 'Brand it with Schema.String.pipe(Schema.brand("Name")).',
    ...includes("id: string"),
  },
  {
    topic: "error-handling",
    rule: "untagged-new-error",
    message: "Failure is a plain Error.",
    help: "Define a Schema.TaggedError and fail with that class instead.",
    ...includes("new Error("),
  },
  {
    topic: "config",
    rule: "process-env-read",
    message: "Configuration is read from process.env.",
    help: "Read it with Config.string, Config.int, or Config.redacted.",
    ...includes("process.env."),
  },
  {
    topic: "config",
    rule: "globalthis-process-env",
    message: "Configuration is read from globalThis.process.env.",
    help: "Read it with Config and supply values through a ConfigProvider.",
    ...includes("globalThis.process?.env"),
  },
  {
    topic: "testing",
    rule: "bun-test-import",
    message: "Test imports bun:test.",
    help: "Import the test APIs from vitest, or use @effect/vitest.",
    ...includes('from "bun:test"'),
  },
  {
    topic: "testing",
    rule: "console-assert",
    message: "Assertion uses console.assert.",
    help: "Replace it with expect from vitest.",
    ...includes("console.assert("),
  },
  {
    topic: "cli",
    rule: "raw-argv-read",
    message: "Arguments are read from process.argv.",
    help: "Parse them with Command and Flag from effect/unstable/cli.",
    ...includes("process.argv"),
  },
  {
    topic: "cli",
    rule: "yargs-minimist",
    message: "CLI parsing uses yargs or minimist.",
    help: "Replace it with Command and Flag from effect/unstable/cli.",
    ...includes('from "yargs"', 'from "minimist"'),
  },
  {
    topic: "tsconfig",
    rule: "loose-non-null",
    message: "Non-null assertion bypasses strict null checks.",
    help: "Narrow the value with a condition or Option instead of !.",
    test: (line) => line.includes("!.") && !line.includes("!=="),
    at: (line) => line.indexOf("!."),
  },
  {
    topic: "project-setup",
    rule: "direct-lsp-import",
    message: "@effect/language-service is imported in source.",
    help: "Register it under compilerOptions.plugins in tsconfig.",
    ...includes("@effect/language-service"),
  },
]);
