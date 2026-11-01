/**
 * The oxlint side of `adhere rules create`: the exact config a native rule
 * needs, the files a custom JS plugin is written to, a check of that plugin
 * with oxlint's own RuleTester (installed in the project rather than bundled
 * with adhere), and the one operation that sets either up.
 */
import { type Agent, run } from "#create/agents.ts";
import {
  type Shape,
  NativeRevision,
  PluginDraft,
  RuleNotCreated,
  askingFor,
  nativeRevisionPrompt,
  pluginFixPrompt,
  pluginPrompt,
  pluginRevisionPrompt,
} from "#create/ask.ts";
import { reviewedInRepository } from "#create/examples.ts";
import { decided, line, note, outro, spinning, warn } from "#create/look.ts";
import { trialAndReview, trialStatus } from "#create/trial-review.ts";
import { cloned } from "#install.ts";
import { oxlintCatalog, oxlintRule, type OxlintRule } from "#oxlint/catalog.ts";
import { SHARED_LINT_RULES } from "#oxlint/shared.ts";
import { isSharedRepo, refreshIndexIfShared, refreshReadme, validateReadme } from "#readme.ts";
import { Effect, FileSystem, Option, Path } from "effect";
import { Prompt } from "effect/cli";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

/** One place a rule's example is expected to report. */
export interface PluginError {
  readonly message: string;
  /** Zero-indexed, as oxlint's RuleTester counts columns. Decoded drafts carry the key with `undefined` when the agent sent `null`. */
  readonly line?: number | undefined;
  readonly column?: number | undefined;
}

/** Code that breaks a plugin rule, and the diagnostics it must produce. */
export interface PluginInvalid {
  readonly code: string;
  readonly errors: ReadonlyArray<PluginError>;
}

/** An oxlint JS plugin rule, its self-contained module, and what shows it works. */
export interface PluginAnswer {
  readonly plugin: string;
  readonly pluginName: string;
  readonly ruleName: string;
  readonly valid: ReadonlyArray<string>;
  readonly invalid: ReadonlyArray<PluginInvalid>;
}

export type PluginCheck =
  | { readonly _tag: "Passed" }
  | { readonly _tag: "Unavailable"; readonly problems: ReadonlyArray<string> }
  | { readonly _tag: "Failed"; readonly problems: ReadonlyArray<string> };

export const PLUGIN_DIRECTORY = ".adhere/oxlint";

const NAME = /^[a-z][a-z0-9-]*$/;

/** The plugin part of a native rule id: `eslint` for an unprefixed rule. */
export const pluginOf = (id: string) => {
  const at = id.indexOf("/");
  return at === -1 ? "eslint" : id.slice(0, at);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const specifierOf = (entry: unknown) =>
  typeof entry === "string"
    ? entry
    : isRecord(entry) && typeof entry.specifier === "string"
      ? entry.specifier
      : undefined;

/** Native plugins oxlint runs without being asked; setting `plugins` replaces them. */
export const BASE_PLUGINS = ["eslint", "typescript", "unicorn", "oxc"];

const OFF = new Set<unknown>(["off", "allow", "0", 0]);

/** Whether a rule setting is off, whether written `"off"`, `"allow"`, `0`, or with options. */
const isOff = (setting: unknown) => OFF.has(Array.isArray(setting) ? setting[0] : setting);

/** Whether a config's setting already turns `id` on, whatever severity or options it carries. */
export const nativeOn = (config: unknown, id: string) => {
  const rules = isRecord(config) && isRecord(config.rules) ? config.rules : {};
  return rules[id] !== undefined && !isOff(rules[id]);
};

/** A config whose `plugins` is not a list of names cannot take another plugin without losing it. */
export const pluginsProblem = (config: unknown) =>
  isRecord(config) &&
  config.plugins !== undefined &&
  !(Array.isArray(config.plugins) && config.plugins.every((entry) => typeof entry === "string"))
    ? "plugins is not a list of plugin names"
    : undefined;

/** The setting a native rule takes: bare `"error"`, or its exact options after the severity. */
export const nativeSetting = (options: ReadonlyArray<unknown>) =>
  options.length === 0 ? "error" : ["error", ...options];

/**
 * The shared lint config with a native rule on with `options`: every other key
 * left as it was. An existing setting on with options of its own is replaced,
 * because the idea needs these; an off tuple keeps its options when the idea
 * needs none. Gives back the same object when nothing needs changing.
 */
export const enabledNative = (
  config: unknown,
  id: string,
  options: ReadonlyArray<unknown> = [],
) => {
  const base = isRecord(config) ? config : {};
  const rules = isRecord(base.rules) ? base.rules : {};
  const rule = oxlintRule(id);
  const plugin = pluginOf(id);
  const plugins = Array.isArray(base.plugins) ? base.plugins : undefined;
  const pluginMissing =
    plugins === undefined
      ? !BASE_PLUGINS.includes(plugin)
      : plugins.every((entry) => typeof entry === "string") && !plugins.includes(plugin);
  const typeAwareMissing =
    rule !== undefined &&
    rule.typeAware &&
    !(isRecord(base.options) && base.options.typeAware === true);
  const setting = rules[id];
  const off = setting !== undefined && isOff(setting);
  const on = setting !== undefined && !off;
  const desired = nativeSetting(options);
  const matches = on && (options.length === 0 || isDeepStrictEqual(setting, desired));
  if (isRecord(config) && matches && !pluginMissing && !typeAwareMissing) return base;
  const kept =
    on && options.length === 0
      ? setting
      : off && Array.isArray(setting) && options.length === 0
        ? ["error", ...setting.slice(1)]
        : desired;
  const next: Record<string, unknown> = { ...base, rules: { ...rules, [id]: kept } };
  if (plugins === undefined) {
    if (!BASE_PLUGINS.includes(plugin)) next.plugins = [...BASE_PLUGINS, plugin];
  } else if (pluginMissing) {
    next.plugins = [...plugins, plugin];
  }
  if (typeAwareMissing) {
    next.options = { ...(isRecord(base.options) ? base.options : {}), typeAware: true };
  }
  return next;
};

/** The shared lint config with a custom plugin registered and its rule on. */
export const enabledPlugin = (config: unknown, pluginName: string, ruleName: string) => {
  const base = isRecord(config) ? config : {};
  const rules = isRecord(base.rules) ? base.rules : {};
  const plugins = Array.isArray(base.jsPlugins) ? base.jsPlugins : [];
  const specifier = "./plugins/" + pluginName + ".js";
  const registered = plugins.some((entry) => specifierOf(entry) === specifier);
  return {
    ...base,
    jsPlugins: registered ? plugins : [...plugins, { name: pluginName, specifier }],
    rules: { ...rules, [pluginName + "/" + ruleName]: "error" },
  };
};

/** What to add to a project's own oxlint config to turn a native rule on. */
export const nativeSnippet = (id: string, options: ReadonlyArray<unknown> = []) =>
  JSON.stringify(enabledNative({}, id, options), null, 2);

/** What to add to a project's own oxlint config to register and turn on a plugin rule. */
export const pluginSnippet = (pluginName: string, ruleName: string) =>
  JSON.stringify(
    {
      jsPlugins: ["./" + PLUGIN_DIRECTORY + "/" + pluginName + ".mjs"],
      rules: { [pluginName + "/" + ruleName]: "error" },
    },
    null,
    2,
  );

/** The same, as the shared repo's `lint/rules.json` holds it. */
export const sharedSnippet = (pluginName: string, ruleName: string) =>
  JSON.stringify(
    {
      jsPlugins: [{ name: pluginName, specifier: "./plugins/" + pluginName + ".js" }],
      rules: { [pluginName + "/" + ruleName]: "error" },
    },
    null,
    2,
  );

/** Where a project keeps a custom plugin and its checked-in test; ESM whatever its package says. */
export const projectFiles = (root: string, pluginName: string) => ({
  plugin: join(root, PLUGIN_DIRECTORY, pluginName + ".mjs"),
  test: join(root, PLUGIN_DIRECTORY, pluginName + ".test.mjs"),
});

/** Where the shared repo keeps them: beside the lint config that reads them. */
export const sharedFiles = (repo: string, pluginName: string) => ({
  config: join(repo, "lint", "rules.json"),
  plugin: join(repo, "lint", "plugins", pluginName + ".js"),
  test: join(repo, "lint", "plugins", pluginName + ".test.js"),
});

/** A plugin's module and examples as they are checked into a project. */
export interface CheckInOptions {
  /** The entrypoint the project resolves: oxlint or Vite+. */
  readonly tester: string;
  readonly pluginFile: string;
  readonly ruleName: string;
  readonly valid: ReadonlyArray<string>;
  readonly invalid: ReadonlyArray<PluginInvalid>;
}

/**
 * The checked-in test: a plain ESM file for Node 22 or newer, so it needs
 * only the oxlint the project already has and no test runner.
 */
export const checkInTestSource = ({
  tester,
  pluginFile,
  ruleName,
  valid,
  invalid,
}: CheckInOptions) =>
  [
    "import { RuleTester } from " + JSON.stringify(tester) + ";",
    "import plugin from " + JSON.stringify("./" + pluginFile) + ";",
    "",
    "RuleTester.describe = (name, fn) => fn();",
    "RuleTester.it = (name, fn) => fn();",
    "",
    'const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });',
    "",
    "ruleTester.run(" +
      JSON.stringify(ruleName) +
      ", plugin.rules[" +
      JSON.stringify(ruleName) +
      "], " +
      JSON.stringify({ valid, invalid }, null, 2) +
      ");",
    "",
  ].join("\n");

/** Options for the temporary test verifyPlugin runs before anything is written. */
export interface TestOptions {
  /** The project's `oxlint/plugins-dev`, as a file URL. */
  readonly tester: string;
  /** The plugin under test, as a file URL. */
  readonly plugin: string;
  readonly ruleName: string;
  readonly valid: ReadonlyArray<string>;
  readonly invalid: ReadonlyArray<PluginInvalid>;
}

/** The throwaway test: RuleTester running synchronously, so a failure exits non-zero. */
export const pluginTestSource = ({ tester, plugin, ruleName, valid, invalid }: TestOptions) =>
  [
    "import { RuleTester } from " + JSON.stringify(tester) + ";",
    "const { default: plugin } = await import(" + JSON.stringify(plugin) + ");",
    "RuleTester.describe = (name, fn) => fn();",
    "RuleTester.it = (name, fn) => fn();",
    "const rule = plugin === undefined ? undefined : plugin.rules[" +
      JSON.stringify(ruleName) +
      "];",
    "if (rule === undefined) {",
    '  throw new Error("The plugin has no rule " + ' + JSON.stringify(ruleName) + ");",
    "}",
    'const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });',
    "ruleTester.run(" +
      JSON.stringify(ruleName) +
      ", rule, " +
      JSON.stringify({ valid, invalid }, null, 2) +
      ");",
    "",
  ].join("\n");

/** The project's oxlint or Vite+, which owns `plugins-dev`; never adhere's own copy. */
export interface RuleTesterModule {
  readonly specifier: string;
  /** The resolved file, for the temporary test. */
  readonly path: string;
}

const TESTER_SPECIFIERS = [
  { specifier: "oxlint/plugins-dev", package: "oxlint", subpath: "./plugins-dev" },
  {
    specifier: "vite-plus/lint/plugins-dev",
    package: "vite-plus",
    subpath: "./lint/plugins-dev",
  },
] as const;

/** The package.json of a package the consumer has installed, found from its root up. */
const installedIn = (root: string, name: string): string | undefined => {
  let directory = root;
  for (;;) {
    const found = join(directory, "node_modules", name, "package.json");
    if (existsSync(found)) return found;
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
};

/** The runtime file a package's exports map names for one subpath. */
const exportOf = (packageJson: string, subpath: string): string | undefined => {
  const parsed: unknown = JSON.parse(readFileSync(packageJson, "utf8"));
  if (!isRecord(parsed) || !isRecord(parsed.exports)) return undefined;
  const entry = parsed.exports[subpath];
  const target =
    typeof entry === "string"
      ? entry
      : isRecord(entry)
        ? (entry.default ?? entry.import ?? entry.require ?? entry.node ?? entry["module-sync"])
        : undefined;
  return typeof target === "string" ? join(dirname(packageJson), target) : undefined;
};

export const ruleTesterOf = (root: string): RuleTesterModule | undefined => {
  for (const { specifier, package: name, subpath } of TESTER_SPECIFIERS) {
    const installed = installedIn(root, name);
    if (installed === undefined) continue;
    // Read the consumer's own exports map instead of asking a resolver: Bun's
    // createRequire falls back to its global auto-install cache, compiled or not.
    const path = exportOf(installed, subpath);
    if (path !== undefined && existsSync(path)) return { specifier, path };
  }
  return undefined;
};

/**
 * A runtime for the temporary test, since a compiled adhere cannot run a
 * script itself. oxlint's RuleTester needs Node 22 or newer: it refuses Bun
 * outright, so there is no fallback.
 */
export interface TestRuntime {
  readonly kind: "node";
  readonly path: string;
}

export const testRuntime = (): TestRuntime | undefined => {
  const node = Bun.which("node");
  if (node === null) return undefined;
  const version = spawnSync(node, ["--version"], { encoding: "utf8" });
  const major = version.status === 0 ? Number(/^v(\d+)\./.exec(version.stdout ?? "")?.[1]) : NaN;
  return Number.isFinite(major) && major >= 22 ? { kind: "node", path: node } : undefined;
};

export const TESTER_PREREQUISITE =
  "This project has no oxlint to test the plugin with: add it (bun add --dev oxlint, or use the Vite+ version) and run this again. adhere does not bundle oxlint.";
export const RUNTIME_PREREQUISITE =
  "Put Node 22 or newer on PATH to run oxlint's RuleTester; it refuses Bun and older Node, and a compiled adhere cannot run a script by itself.";

/** Plugin names oxlint implements natively, so a JS plugin cannot take them. */
const NATIVE_PLUGINS = new Set([
  "eslint",
  "import",
  "jest",
  "jsdoc",
  "jsx-a11y",
  "nextjs",
  "node",
  "oxc",
  "promise",
  "react",
  "react-perf",
  "typescript",
  "unicorn",
  "vitest",
  "vue",
  ...oxlintCatalog.rules.map((rule) => pluginOf(rule.id)),
]);

/** The imports in a plugin's source, scanned rather than matched against its text. */
const importsIn = (source: string) => {
  try {
    return new Bun.Transpiler({ loader: "js" }).scanImports(source);
  } catch {
    return [];
  }
};

/** What keeps a generated plugin from being written or run, apart from its own tests. */
export const pluginProblems = (answer: PluginAnswer): ReadonlyArray<string> => [
  ...(NAME.test(answer.pluginName)
    ? []
    : ["pluginName must be lowercase kebab case, starting with a letter."]),
  ...(NAME.test(answer.ruleName)
    ? []
    : ["ruleName must be lowercase kebab case, starting with a letter."]),
  ...(NATIVE_PLUGINS.has(answer.pluginName)
    ? [
        "pluginName " +
          answer.pluginName +
          " clashes with a plugin oxlint has natively; choose another.",
      ]
    : []),
  ...(answer.plugin.includes("export default")
    ? []
    : ["The plugin must default-export its plugin object: export default { meta, rules }."]),
  ...(importsIn(answer.plugin).length > 0
    ? ["The plugin must be plain ESM with no imports; oxlint loads it as it is."]
    : []),
  ...(answer.valid.length === 0 ? ["Give at least one valid example."] : []),
  ...(answer.invalid.length === 0 ? ["Give at least one invalid example."] : []),
  ...answer.invalid.flatMap((example, index) =>
    example.errors.length === 0
      ? ["Invalid example " + (index + 1) + " has no expected diagnostic."]
      : [],
  ),
];

const tail = (text: string) => text.trim().slice(-4000);

const failed = (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause)));

const runFile = (runtime: TestRuntime, file: string, cwd: string) => {
  const { promise, resolve } = Promise.withResolvers<{
    readonly code: number;
    readonly output: string;
  }>();
  const child = spawn(runtime.path, [file], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  const timer = setTimeout(() => {
    child.kill("SIGKILL");
    resolve({ code: 1, output: output + "\nTimed out after 60 seconds." });
  }, 60_000);
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  child.on("error", (problem) => {
    clearTimeout(timer);
    resolve({ code: 1, output: problem.message });
  });
  child.on("close", (code) => {
    clearTimeout(timer);
    resolve({ code: code ?? 1, output });
  });
  return promise;
};

/**
 * Runs a generated plugin against its examples with the project's own oxlint.
 * Nothing is written to the project: the module and test live in a temporary
 * directory until the caller decides to keep them.
 */
export const verifyPlugin = (answer: PluginAnswer, root: string) =>
  Effect.scoped(
    Effect.gen(function* () {
      const problems = pluginProblems(answer);
      if (problems.length > 0) return { _tag: "Failed", problems } as const;
      const tester = ruleTesterOf(root);
      if (tester === undefined) {
        return { _tag: "Unavailable", problems: [TESTER_PREREQUISITE] } as const;
      }
      const runtime = testRuntime();
      if (runtime === undefined) {
        return { _tag: "Unavailable", problems: [RUNTIME_PREREQUISITE] } as const;
      }
      const directory = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () => mkdtemp(join(tmpdir(), "adhere-oxlint-")),
          catch: failed,
        }),
        (path) => Effect.promise(() => rm(path, { recursive: true, force: true })),
      );
      const pluginFile = join(directory, "plugin.mjs");
      const testFile = join(directory, "test.mjs");
      yield* Effect.tryPromise({
        try: () => writeFile(pluginFile, answer.plugin),
        catch: failed,
      });
      yield* Effect.tryPromise({
        try: () =>
          writeFile(
            testFile,
            pluginTestSource({
              tester: pathToFileURL(tester.path).href,
              plugin: pathToFileURL(pluginFile).href,
              ruleName: answer.ruleName,
              valid: answer.valid,
              invalid: answer.invalid,
            }),
          ),
        catch: failed,
      });
      const result = yield* Effect.tryPromise({
        try: () => runFile(runtime, testFile, root),
        catch: failed,
      });
      return result.code === 0
        ? ({ _tag: "Passed" } as const)
        : ({
            _tag: "Failed",
            problems: ["The RuleTester run failed:\n" + tail(result.output)],
          } as const);
    }).pipe(
      Effect.catch((cause) =>
        Effect.succeed({
          _tag: "Failed",
          problems: ["The plugin could not be checked: " + tail(failed(cause).message)],
        } as const),
      ),
    ),
  );

/** What the wizard knows when it hands the oxlint route over. */
export interface OxlintWork {
  readonly agent: Agent;
  readonly idea: string;
  readonly shape: Shape;
  readonly root: string;
  readonly shared: string | undefined;
}

const RULE_ID = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)+$/;

const git = (cwd: string, args: ReadonlyArray<string>) =>
  Effect.tryPromise({
    try: () => run("git", args, cwd, ""),
    catch: (cause) =>
      new RuleNotCreated({
        message: cause instanceof Error ? cause.message : String(cause),
      }),
  });

/** Where something that is not an adhere rule is set up: printed here, or written to the shared repo. */
const chooseWhere = (
  shared: string | undefined,
  suggested: Shape["scope"],
  projectDescription: string,
) =>
  Effect.gen(function* () {
    if (shared === undefined) {
      if (suggested === "org") {
        yield* warn(
          "The organization's shared rules repo is not set up, so this stays in this project.\nRun adhere rules create --setup to name the shared repo.",
        );
      }
      return "project" as const;
    }
    const choices = [
      { title: "This project", value: "project" as const, description: projectDescription },
      { title: "The organization", value: "org" as const, description: shared },
    ];
    return yield* Prompt.run(
      Prompt.Select({
        message: "Where should it be set up?",
        choices: suggested === "org" ? choices.toReversed() : choices,
      }),
    );
  });

/** The plugin and the examples that judge it, as the user approves or runs them. */
const showPlugin = (draft: PluginDraft) =>
  Effect.gen(function* () {
    yield* line("");
    yield* line(draft.pluginName + "/" + draft.ruleName + ":");
    yield* line("");
    yield* line(draft.plugin);
    yield* line("");
    yield* note("Valid examples:");
    for (const code of draft.valid) yield* line(code);
    yield* note("Invalid examples:");
    for (const example of draft.invalid) {
      yield* line(example.code);
      yield* note("expects: " + JSON.stringify(example.errors));
    }
    yield* line("");
  });

/**
 * Shows the generated plugin and fixtures, runs them with the project's own
 * oxlint once the user approves them, and lets the agent repair them once.
 * Nothing runs before approval.
 */
const approvedPlugin = (agent: Agent, root: string, prompt: string, first: PluginDraft) =>
  Effect.gen(function* () {
    let draft = first;
    for (let round = 0; round < 2; round++) {
      yield* showPlugin(draft);
      const approve = yield* Prompt.run(
        Prompt.Confirm({
          message:
            round === 0
              ? "Run this generated plugin against these examples?"
              : "Run the repaired plugin against these examples?",
          initial: true,
        }),
      );
      if (!approve) return { _tag: "Declined" } as const;
      const check = yield* verifyPlugin(draft, root);
      if (check._tag === "Passed") return { _tag: "Approved", draft } as const;
      for (const problem of check.problems) yield* warn(problem);
      if (check._tag === "Unavailable") {
        return { _tag: "Unavailable", problems: check.problems } as const;
      }
      if (round === 1) {
        return { _tag: "Failed", problems: check.problems } as const;
      }
      draft = yield* askingFor(
        agent,
        "to fix the oxlint plugin",
        root,
        pluginFixPrompt(prompt, draft, check.problems),
        PluginDraft,
      );
    }
    return { _tag: "Failed", problems: ["The plugin did not pass its examples."] } as const;
  });

/** Reads the shared lint config, refusing to overwrite one that is not valid JSON. */
const readSharedConfig = (file: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    if (!(yield* fs.exists(file))) return { _tag: "Ok", config: {} } as const;
    const text = yield* fs.readFileString(file);
    const parsed = yield* Effect.try({
      try: () => JSON.parse(text) as unknown,
      catch: failed,
    }).pipe(Effect.option);
    return Option.isSome(parsed) && isRecord(parsed.value)
      ? ({ _tag: "Ok", config: parsed.value } as const)
      : ({ _tag: "Invalid" } as const);
  });

/**
 * The shared config with a native rule on, or why it cannot be merged or is
 * already on. Writes nothing.
 */
const nativeSettingsFor = (file: string, id: string, options: ReadonlyArray<unknown>) =>
  Effect.gen(function* () {
    const read = yield* readSharedConfig(file);
    if (read._tag === "Invalid") {
      yield* warn(file + " is not valid JSON; left it unchanged.");
      return undefined;
    }
    const plugins = pluginsProblem(read.config);
    if (plugins !== undefined) {
      yield* warn(file + ": " + plugins + "; left it unchanged.");
      return undefined;
    }
    const next = enabledNative(read.config, id, options);
    if (next === read.config) return { _tag: "Already" } as const;
    const before = isRecord(read.config.rules) ? read.config.rules[id] : undefined;
    const after = isRecord(next.rules) ? next.rules[id] : undefined;
    if (before !== undefined && !isDeepStrictEqual(before, after)) {
      yield* warn(
        "Replacing the existing setting " +
          JSON.stringify(before) +
          " with " +
          JSON.stringify(after) +
          ".",
      );
    }
    return { _tag: "Ready", config: next } as const;
  });

/** A native oxlint rule already checks this: print its settings, or enable it in the shared repo. */
const createBuiltin = (
  agent: Agent,
  idea: string,
  rule: OxlintRule,
  shape: Shape,
  root: string,
  shared: string | undefined,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const plugin = pluginOf(rule.id);
    yield* decided("oxlint " + oxlintCatalog.version + ": " + rule.id, rule.summary);
    yield* note(
      "Plugin: " +
        plugin +
        (BASE_PLUGINS.includes(plugin)
          ? " (on by default)."
          : " (off by default; the snippet enables it)."),
    );
    yield* note(
      "Type-aware: " +
        (rule.typeAware
          ? "yes; set options.typeAware: true (or pass --type-aware) and install oxlint-tsgolint."
          : "no."),
    );
    yield* note("Docs: " + rule.docsUrl);
    yield* note("Setting: " + JSON.stringify(nativeSetting(shape.linterOptions)));

    const outcome = yield* trialAndReview({
      agent,
      root,
      id: rule.id,
      draft: shape.linterOptions,
      toDraft: (options) => ({
        kind: "native",
        id: rule.id,
        options,
        config: enabledNative({}, rule.id, options),
      }),
      approve: (options) => Effect.succeed({ _tag: "Approved", draft: options } as const),
      revise: (options, evidence) =>
        Effect.gen(function* () {
          const revised = yield* askingFor(
            agent,
            "to revise the oxlint settings",
            root,
            nativeRevisionPrompt(idea, rule.id, options, evidence),
            NativeRevision,
          );
          return revised.options;
        }),
      show: (options) => note("Setting: " + JSON.stringify(nativeSetting(options))),
    });
    if (outcome._tag === "Cancelled") return yield* outro("Nothing written.");
    const options = outcome.draft;

    const sharedHere = yield* isSharedRepo(root);
    const scope = yield* chooseWhere(
      shared,
      shape.scope,
      sharedHere ? "Write this shared repo's lint/rules.json" : "Print the config snippet",
    );
    if (scope === "project" && sharedHere) {
      const write = yield* Prompt.run(
        Prompt.Confirm({
          message: "Enable " + rule.id + " in this repo's " + SHARED_LINT_RULES + "?",
          initial: true,
        }),
      );
      if (!write) return yield* outro("Nothing written.");
      yield* validateReadme(root);
      const file = path.join(root, SHARED_LINT_RULES);
      const settings = yield* nativeSettingsFor(file, rule.id, options);
      if (settings === undefined) return yield* outro("Nothing written.");
      if (settings._tag === "Already") {
        return yield* outro(rule.id + " is already enabled in this repo.");
      }
      yield* fs.makeDirectory(path.dirname(file), { recursive: true });
      yield* fs.writeFileString(file, JSON.stringify(settings.config, null, 2) + "\n");
      const refreshed = yield* refreshReadme(root);
      return yield* outro(
        "Updated " +
          SHARED_LINT_RULES +
          " in this repo.\n" +
          trialStatus(outcome) +
          "\n" +
          refreshed.message,
      );
    }
    if (scope === "project") {
      yield* line("");
      yield* line("Add this to the project's oxlint config:");
      yield* line(nativeSnippet(rule.id, options));
      return yield* outro(
        "oxlint " +
          oxlintCatalog.version +
          " provides this rule. Apply the snippet with a compatible oxlint version; no adhere rule was created.\n" +
          trialStatus(outcome),
      );
    }
    if (shared === undefined) return yield* outro("Nothing written.");
    const write = yield* Prompt.run(
      Prompt.Confirm({
        message: "Enable " + rule.id + " in " + shared + "/lint/rules.json and push?",
        initial: true,
      }),
    );
    if (!write) return yield* outro("Nothing written.");
    const repo = yield* spinning("Cloning " + shared, cloned({ repo: shared, rule: "" }));
    const file = path.join(repo, SHARED_LINT_RULES);
    const settings = yield* nativeSettingsFor(file, rule.id, options);
    if (settings === undefined) return yield* outro("Nothing written.");
    if (settings._tag === "Already") {
      return yield* outro(rule.id + " is already enabled in " + shared + ".");
    }
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, JSON.stringify(settings.config, null, 2) + "\n");
    const indexed = yield* refreshIndexIfShared(repo);
    const branch = "adhere/oxlint-" + rule.id.replaceAll("/", "-");
    yield* git(repo, ["switch", "--quiet", "--create", branch]);
    const staged = [path.relative(repo, file)];
    if (indexed) staged.push("README.md");
    yield* git(repo, ["add", "--", ...staged]);
    yield* git(repo, ["commit", "--quiet", "--message", "Enable oxlint rule " + rule.id]);
    yield* git(repo, ["push", "--quiet", "origin", branch]);
    yield* outro(
      [
        "Pushed " + branch + " to " + shared + ".",
        trialStatus(outcome),
        "Open the pull request: https://github.com/" + shared + "/compare/" + branch + "?expand=1",
      ].join("\n"),
    );
  });

/** A custom oxlint JS plugin: generated, approved, run against its examples, then written. */
const createPlugin = (
  agent: Agent,
  idea: string,
  shape: Shape,
  root: string,
  shared: string | undefined,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const id = shape.names.find((name) => RULE_ID.test(name)) ?? "oxlint/plugin";
    const sharedHere = yield* isSharedRepo(root);
    const scope = yield* chooseWhere(
      shared,
      shape.scope,
      sharedHere ? "Write this shared repo's lint/plugins/" : ".adhere/oxlint/",
    );

    // Examples come from the project the user is in, not from the shared clone.
    const reviewed = yield* reviewedInRepository(agent, root, idea, id);
    const prompt = pluginPrompt(idea, id, reviewed);
    const first = yield* askingFor(agent, "to write the oxlint plugin", root, prompt, PluginDraft);
    const outcome = yield* trialAndReview({
      agent,
      root,
      id: first.pluginName + "/" + first.ruleName,
      draft: first,
      toDraft: (draft) => ({
        kind: "plugin",
        pluginName: draft.pluginName,
        ruleName: draft.ruleName,
        plugin: draft.plugin,
        config: enabledPlugin({}, draft.pluginName, draft.ruleName),
      }),
      approve: (draft) =>
        approvedPlugin(agent, root, prompt, draft).pipe(
          Effect.map((approval) =>
            approval._tag === "Unavailable"
              ? ({
                  _tag: "Failed",
                  problems: approval.problems,
                  reason: "oxlint's RuleTester could not run here.",
                } as const)
              : approval,
          ),
        ),
      revise: (draft, evidence) =>
        askingFor(
          agent,
          "to revise the oxlint plugin",
          root,
          pluginRevisionPrompt(idea, draft.pluginName + "/" + draft.ruleName, draft, evidence),
          PluginDraft,
        ),
      show: showPlugin,
    });
    if (outcome._tag === "Cancelled") return yield* outro("Nothing written.");
    const draft = outcome.draft;
    const tester = ruleTesterOf(root);
    if (tester === undefined) {
      return yield* outro("Nothing written: this project has no oxlint to run the test with.");
    }
    const extension = scope === "org" || sharedHere ? ".js" : ".mjs";
    const test = checkInTestSource({
      tester: tester.specifier,
      pluginFile: draft.pluginName + extension,
      ruleName: draft.ruleName,
      valid: draft.valid,
      invalid: draft.invalid,
    });

    if (scope === "project" && sharedHere) {
      const files = sharedFiles(root, draft.pluginName);
      const write = yield* Prompt.run(
        Prompt.Confirm({
          message:
            "Write " +
            path.relative(root, files.plugin) +
            " and " +
            path.relative(root, files.test) +
            ", and enable it in " +
            SHARED_LINT_RULES +
            "?",
          initial: true,
        }),
      );
      if (!write) return yield* outro("Nothing written.");
      yield* validateReadme(root);
      const config = yield* readSharedConfig(files.config);
      if (config._tag === "Invalid") {
        yield* warn(files.config + " is not valid JSON; left it unchanged.");
        return yield* outro("Nothing written.");
      }
      yield* fs.makeDirectory(path.dirname(files.plugin), { recursive: true });
      yield* fs.writeFileString(files.plugin, draft.plugin + "\n");
      yield* fs.writeFileString(files.test, test);
      yield* fs.writeFileString(
        files.config,
        JSON.stringify(enabledPlugin(config.config, draft.pluginName, draft.ruleName), null, 2) +
          "\n",
      );
      const refreshed = yield* refreshReadme(root);
      return yield* outro(
        "Wrote " +
          path.relative(root, files.plugin) +
          " and its test.\n" +
          trialStatus(outcome) +
          "\n" +
          refreshed.message,
      );
    }
    if (scope === "project") {
      const files = projectFiles(root, draft.pluginName);
      const write = yield* Prompt.run(
        Prompt.Confirm({
          message:
            "Write " +
            path.relative(root, files.plugin) +
            " and " +
            path.relative(root, files.test) +
            "?",
          initial: true,
        }),
      );
      if (!write) return yield* outro("Nothing written.");
      yield* fs.makeDirectory(path.dirname(files.plugin), { recursive: true });
      yield* fs.writeFileString(files.plugin, draft.plugin + "\n");
      yield* fs.writeFileString(files.test, test);
      yield* line("");
      yield* note(
        "Add this to the project's oxlint config (oxlint.config.ts, or the lint block in vite.config.ts); adhere does not edit it:",
      );
      yield* line(pluginSnippet(draft.pluginName, draft.ruleName));
      return yield* outro(
        "Wrote " +
          path.relative(root, files.plugin) +
          " and its test.\n" +
          trialStatus(outcome) +
          "\nRun it with Node 22 or newer: node " +
          path.relative(root, files.test) +
          ".",
      );
    }
    if (shared === undefined) return yield* outro("Nothing written.");
    const write = yield* Prompt.run(
      Prompt.Confirm({ message: "Push the plugin to " + shared + "?", initial: true }),
    );
    if (!write) return yield* outro("Nothing written.");
    const repo = yield* spinning("Cloning " + shared, cloned({ repo: shared, rule: "" }));
    const files = sharedFiles(repo, draft.pluginName);
    const config = yield* readSharedConfig(files.config);
    if (config._tag === "Invalid") {
      yield* warn(files.config + " is not valid JSON; left it unchanged.");
      return yield* outro("Nothing written.");
    }
    yield* fs.makeDirectory(path.dirname(files.plugin), { recursive: true });
    yield* fs.writeFileString(files.plugin, draft.plugin + "\n");
    yield* fs.writeFileString(files.test, test);
    yield* fs.writeFileString(
      files.config,
      JSON.stringify(enabledPlugin(config.config, draft.pluginName, draft.ruleName), null, 2) +
        "\n",
    );
    const indexed = yield* refreshIndexIfShared(repo);
    const branch = "adhere/oxlint-" + draft.pluginName + "-" + draft.ruleName;
    const changed = [files.plugin, files.test, files.config].map((file) =>
      path.relative(repo, file),
    );
    if (indexed) changed.push("README.md");
    yield* git(repo, ["switch", "--quiet", "--create", branch]);
    yield* git(repo, ["add", "--", ...changed]);
    yield* git(repo, [
      "commit",
      "--quiet",
      "--message",
      "Add oxlint plugin " + draft.pluginName + "/" + draft.ruleName,
    ]);
    yield* git(repo, ["push", "--quiet", "origin", branch]);
    yield* line("");
    yield* note(shared + "/lint/rules.json now contains:");
    yield* line(sharedSnippet(draft.pluginName, draft.ruleName));
    yield* outro(
      [
        "Pushed " + branch + " to " + shared + ".",
        trialStatus(outcome),
        "Open the pull request: https://github.com/" + shared + "/compare/" + branch + "?expand=1",
      ].join("\n"),
    );
  });

/**
 * The whole oxlint route: a native rule is shown and enabled, or a custom JS
 * plugin is generated, approved, checked, and written. The wizard only chooses
 * that the rule goes here.
 */
export const createOxlintRule = (work: OxlintWork) =>
  Effect.gen(function* () {
    const native = work.shape.linter === null ? undefined : oxlintRule(work.shape.linter);
    return native !== undefined
      ? yield* createBuiltin(work.agent, work.idea, native, work.shape, work.root, work.shared)
      : yield* createPlugin(work.agent, work.idea, work.shape, work.root, work.shared);
  });
