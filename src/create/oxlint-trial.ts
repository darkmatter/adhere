/**
 * The trial's oxlint side: the installed linter the project already has, run
 * against the selected files with a temporary config that enables exactly the
 * draft rule. Nothing is installed, and no project config or plugin is
 * written: the config and a custom plugin live for the run, then are gone.
 *
 * `src/create/oxlint.ts` builds that config for the wizard; this module only
 * runs it, so the wizard's checks and this execution stay separate.
 */
import { Effect, FileSystem, Path, Schema } from "effect";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

/** Where a trial looks: at most this many files, or all of them. */
export type TrialScope =
  | { readonly kind: "files"; readonly limit: number }
  | { readonly kind: "all" };

/** A draft rule as the wizard has it, before anything is written. */
export interface AdhereTrialDraft {
  readonly kind: "adhere";
  readonly id: string;
  readonly format: "markdown" | "typescript";
  readonly source: string;
}

/** A native oxlint rule, with the config the wizard built for it. */
export interface NativeTrialDraft {
  readonly kind: "native";
  readonly id: string;
  readonly options?: ReadonlyArray<unknown>;
  /** `enabledNative({}, id, options)`, or the project config it came from. */
  readonly config: unknown;
}

/** A custom oxlint JS plugin, with the config the wizard built for it. */
export interface PluginTrialDraft {
  readonly kind: "plugin";
  readonly pluginName: string;
  readonly ruleName: string;
  /** The plugin module's source, as it would be written to `.mjs`. */
  readonly plugin: string;
  /** `enabledPlugin({}, pluginName, ruleName)`, or the project config it came from. */
  readonly config: unknown;
}

export type OxlintTrialDraft = NativeTrialDraft | PluginTrialDraft;
export type TrialDraft = AdhereTrialDraft | OxlintTrialDraft;

/** What a trial shares with a rerun: exact files, and whether to keep the report. */
export interface TrialOptions {
  /**
   * Repo-relative paths from an earlier `TrialRun.selectedFiles`, used
   * verbatim. A path that is no longer eligible fails the trial rather than
   * quietly choosing something else.
   */
  readonly files?: ReadonlyArray<string>;
  /** Default true. False runs the trial without writing `.adhere/trial/`. */
  readonly writeReport?: boolean;
}

/** Why a trial could not run, as the wizard explains it before the user skips. */
export type TrialUnavailableReason =
  | "provider"
  | "oxlint"
  | "runtime"
  | "compiler"
  | "selection"
  | "draft"
  | "other";

/** A trial that could not run, or could not finish: never a made-up result. */
export class TrialUnavailable extends Schema.TaggedError<TrialUnavailable>()("TrialUnavailable", {
  reason: Schema.Literals([
    "provider",
    "oxlint",
    "runtime",
    "compiler",
    "selection",
    "draft",
    "other",
  ]),
  message: Schema.String,
}) {}

/** Lines of a file, first to last, counting from 1. */
export interface TrialRange {
  readonly first: number;
  readonly last: number;
}

/** One finding the trial reports: adhere's, or one oxlint diagnostic. */
export interface TrialFinding {
  readonly rule: string;
  /** Repo-relative. */
  readonly file: string;
  readonly section?: TrialRange;
  readonly lines?: TrialRange;
  readonly excerpt?: string;
  /** The linter's own message, for an oxlint finding. */
  readonly message?: string;
  readonly probability?: number;
  readonly threshold?: number;
  readonly context?: number;
}

export interface TrialPreview {
  /** Applicable files the root-wide walk found, before the cap. */
  readonly eligible: number;
  /** Files this scope will report on: the cap applied, cached files included. */
  readonly selected: number;
  readonly requests: number;
  readonly tokens: number;
  readonly price?: number;
  readonly cached: number;
  readonly deferred: number;
  readonly skipped: number;
  readonly model?: string;
  readonly provider?: string;
}

export interface TrialRun {
  readonly draft: TrialDraft;
  readonly scope: TrialScope;
  /** Identity of the draft, scope, exact files, and inherited runtime settings. */
  readonly revision: string;
  /** Exact repo-relative paths, sorted, as they were run; pass to `options.files` to rerun. */
  readonly selectedFiles: ReadonlyArray<string>;
  readonly files: number;
  /** Files this run actually judged (adhere) or linted (oxlint). */
  readonly judged: number;
  readonly cached: number;
  readonly skipped: number;
  readonly waiting: number;
  readonly findings: ReadonlyArray<TrialFinding>;
  /** Repo-relative. Written only when `writeReport` is true. */
  readonly reportPath: string;
  readonly provider?: string;
  /** Factual limits of this run, never a claim that the rule is validated. */
  readonly notes: ReadonlyArray<string>;
}

/** What running the project's oxlint produced. */
export interface OxlintRun {
  readonly findings: ReadonlyArray<TrialFinding>;
  readonly judged: number;
  readonly diagnostics: ReadonlyArray<unknown>;
  readonly binary: string;
  readonly notes: ReadonlyArray<string>;
}

/** What oxlint's `--format=json` writes, as much of it as a trial reads. */
const Span = Schema.Struct({
  line: Schema.optionalKey(Schema.Finite),
  column: Schema.optionalKey(Schema.Finite),
});
const Label = Schema.Struct({ span: Schema.optionalKey(Span) });
const Diagnostic = Schema.Struct({
  message: Schema.String,
  code: Schema.optionalKey(Schema.String),
  severity: Schema.optionalKey(Schema.String),
  filename: Schema.String,
  labels: Schema.optionalKey(Schema.Array(Label)),
});
interface Diagnostic {
  readonly message: string;
  readonly code?: string;
  readonly severity?: string;
  readonly filename: string;
  readonly line?: number;
  readonly column?: number;
}
const Output = Schema.Struct({
  diagnostics: Schema.Array(Schema.Unknown),
  number_of_files: Schema.optionalKey(Schema.Finite),
});
const decodeOutput = Schema.decodeUnknownOption(Schema.fromJsonString(Output));
const decodeDiagnostic = Schema.decodeUnknownOption(Diagnostic);

/** A package the consumer installed, found from its root up. */
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

/** The project's own oxlint, never one adhere bundles. */
export const oxlintBinary = (root: string): string | undefined => {
  let directory = root;
  for (;;) {
    for (const candidate of [
      join(directory, "node_modules", ".bin", "oxlint"),
      join(directory, "node_modules", "oxlint", "bin", "oxlint"),
    ]) {
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
};

/** The rule id a trial runs, as a report names it. */
export const oxlintIdOf = (draft: OxlintTrialDraft): string =>
  draft.kind === "native" ? draft.id : `${draft.pluginName}/${draft.ruleName}`;

/** Whether the draft's config asks oxlint for type-aware checks. */
export const oxlintTypeAware = (draft: OxlintTrialDraft): boolean => {
  const config = draft.config;
  if (typeof config !== "object" || config === null || !("options" in config)) return false;
  const { options } = config;
  if (typeof options !== "object" || options === null || !("typeAware" in options)) return false;
  return options.typeAware === true;
};

/**
 * What keeps the draft from running here: no consumer oxlint, a type-aware
 * rule without the compiler oxlint needs, or an empty plugin.
 */
export const oxlintProblems = (
  draft: OxlintTrialDraft,
  root: string,
): ReadonlyArray<{ readonly reason: TrialUnavailableReason; readonly message: string }> => [
  ...(oxlintBinary(root) === undefined
    ? [
        {
          reason: "oxlint" as const,
          message:
            "This project has no oxlint to run the draft with: install it (bun add --dev oxlint, or use the Vite+ version) and run this again. adhere does not bundle oxlint.",
        },
      ]
    : []),
  ...(oxlintTypeAware(draft) && installedIn(root, "oxlint-tsgolint") === undefined
    ? [
        {
          reason: "compiler" as const,
          message:
            "This draft's rule needs TypeScript types, but the project has no oxlint-tsgolint: add it (bun add --dev oxlint-tsgolint) to run type-aware rules. The trial did not run.",
        },
      ]
    : []),
  ...(draft.kind === "plugin" && draft.plugin.trim() === ""
    ? [{ reason: "draft" as const, message: "The plugin draft is empty." }]
    : []),
];

/** A record from the wizard's config, or an empty one when it is not an object. */
const configRecord = (config: unknown): Record<string, unknown> =>
  typeof config === "object" && config !== null && !Array.isArray(config)
    ? (config as Record<string, unknown>)
    : {};

/** Every oxlint category, off: the trial turns on the draft rule and nothing else. */
const NO_CATEGORIES = {
  correctness: "off",
  suspicious: "off",
  pedantic: "off",
  perf: "off",
  style: "off",
  restriction: "off",
  nursery: "off",
} as const;

/** A config with exactly the draft rule on: no categories, no other rules, no inherited JS plugins. */
const isolatedConfig = (draft: OxlintTrialDraft): unknown => {
  const {
    rules,
    categories: _categories,
    extends: _extends,
    jsPlugins: _plugins,
  } = configRecord(draft.config);
  const base = configRecord(draft.config);
  const settings = configRecord(rules);
  const id = oxlintIdOf(draft);
  return draft.kind === "native"
    ? { ...base, categories: NO_CATEGORIES, rules: { [id]: settings[id] ?? "error" } }
    : {
        ...base,
        categories: NO_CATEGORIES,
        jsPlugins: [{ name: draft.pluginName, specifier: "./plugin.mjs" }],
        rules: { [id]: settings[id] ?? "error" },
      };
};

/** A diagnostic's code as a rule id: `eslint(no-console)` is `no-console`, `acme(no-foo)` is `acme/no-foo`. */
const ruleIdOf = (code: string): string => {
  const matched = /^([^(]+)\((.+)\)$/.exec(code);
  if (matched === null) return code;
  const [, plugin, rule] = matched;
  return plugin === "eslint" ? rule! : `${plugin}/${rule}`;
};

/** A decoded diagnostic with its first label's line, or undefined when it is not one. */
const parsedDiagnostic = (value: unknown): Diagnostic | undefined => {
  const decoded = decodeDiagnostic(value);
  if (decoded._tag === "None" || decoded.value.filename === "") return undefined;
  const span = decoded.value.labels?.[0]?.span;
  return {
    message: decoded.value.message,
    ...(decoded.value.code === undefined ? {} : { code: decoded.value.code }),
    ...(decoded.value.severity === undefined ? {} : { severity: decoded.value.severity }),
    filename: decoded.value.filename,
    ...(span?.line === undefined ? {} : { line: span.line }),
    ...(span?.column === undefined ? {} : { column: span.column }),
  };
};

interface Parsed {
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly files: number;
}

/** Oxlint's JSON on stdout, whatever it wrote around it; undefined when it wrote none. */
const parse = (stdout: string): Parsed | undefined => {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  const decoded = decodeOutput(stdout.slice(start, end + 1));
  if (decoded._tag === "None") return undefined;
  return {
    diagnostics: decoded.value.diagnostics.flatMap((diagnostic) => {
      const parsed = parsedDiagnostic(diagnostic);
      return parsed === undefined ? [] : [parsed];
    }),
    files: decoded.value.number_of_files ?? 0,
  };
};

/** One oxlint invocation over at most this many files, to stay under the argument limit. */
const CHUNK = 100;

const tail = (text: string) => text.trim().slice(-4000);

const failed = (message: string, reason: TrialUnavailableReason = "oxlint") =>
  TrialUnavailable.make({ reason, message });

/**
 * Runs the project's oxlint over exactly `selectedFiles`, with a config that
 * enables only the draft rule and, for a plugin, a temporary module. The
 * temporary directory is scoped to this effect.
 */
export const runOxlintDraft = (
  root: string,
  draft: OxlintTrialDraft,
  selectedFiles: ReadonlyArray<string>,
): Effect.Effect<OxlintRun, TrialUnavailable, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const problems = oxlintProblems(draft, root);
    const first = problems[0];
    if (first !== undefined) return yield* failed(first.message, first.reason);
    const binary = oxlintBinary(root)!;
    if (selectedFiles.length === 0) {
      return {
        findings: [],
        judged: 0,
        diagnostics: [],
        binary,
        notes: ["No applicable files to lint."],
      };
    }
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const directory = yield* fs.makeTempDirectoryScoped({ prefix: "adhere-trial-oxlint-" });
    const config = path.join(directory, "oxlint.json");
    yield* fs.writeFileString(config, `${JSON.stringify(isolatedConfig(draft), null, 2)}\n`);
    if (draft.kind === "plugin") {
      yield* fs.writeFileString(path.join(directory, "plugin.mjs"), `${draft.plugin}\n`);
    }

    const diagnostics: Array<Diagnostic> = [];
    let judged = 0;
    for (let at = 0; at < selectedFiles.length; at += CHUNK) {
      const files = selectedFiles.slice(at, at + CHUNK);
      const result = yield* Effect.sync(() =>
        spawnSync(binary, ["-c", config, "--format=json", ...files], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        }),
      );
      const stdout = result.stdout ?? "";
      const parsed = parse(stdout);
      if (parsed === undefined) {
        const detail = tail(`${result.stderr ?? ""}\n${stdout}`) || "no output";
        return yield* failed(`oxlint did not report diagnostics as JSON: ${detail}`);
      }
      diagnostics.push(...parsed.diagnostics);
      judged += parsed.files;
      // Diagnostics are the linter's answer, and exit 1; anything else answers nothing.
      if (parsed.diagnostics.length === 0 && result.status !== 0) {
        return yield* failed(
          `oxlint exited ${result.status ?? "without a status"}: ${tail(result.stderr ?? "") || "no output"}`,
        );
      }
    }

    const files = [...new Set(diagnostics.map((diagnostic) => diagnostic.filename))];
    const contents = new Map(
      yield* Effect.forEach(
        files,
        (file) =>
          Effect.map(
            fs.readFileString(path.resolve(root, file)).pipe(Effect.orElseSucceed(() => "")),
            (text) => [file, text.split("\n")] as const,
          ),
        { concurrency: 8 },
      ),
    );
    const expected = oxlintIdOf(draft);
    const notes: string[] = [];
    if (judged < selectedFiles.length) {
      notes.push(
        `oxlint read ${judged} of ${selectedFiles.length} selected files; oxlint still applies its built-in extension checks and .gitignore to explicitly named files, but this trial's temporary config does not copy the project's ignorePatterns.`,
      );
    }
    const mapped = diagnostics
      .map((diagnostic): TrialFinding => {
        const file = diagnostic.filename.replaceAll("\\", "/").replace(/^\.\//, "");
        const lines = contents.get(diagnostic.filename) ?? contents.get(file);
        const line = diagnostic.line;
        const section = line === undefined ? undefined : { first: line, last: line };
        return {
          rule: ruleIdOf(diagnostic.code ?? "oxlint"),
          file,
          ...(section === undefined ? {} : { section, lines: section }),
          ...(lines === undefined || line === undefined ? {} : { excerpt: lines[line - 1] ?? "" }),
          message: diagnostic.message,
        };
      })
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file) ||
          (a.lines?.first ?? 0) - (b.lines?.first ?? 0) ||
          a.message!.localeCompare(b.message!),
      );
    const unexpected = mapped.filter((finding) => finding.rule !== expected).length;
    if (unexpected > 0) {
      notes.push(
        `${unexpected} diagnostics named another rule than ${expected}; the temporary config enables only the draft, so they are shown for what they are.`,
      );
    }
    return {
      findings: mapped,
      judged,
      diagnostics,
      binary,
      notes,
    } satisfies OxlintRun;
  }).pipe(
    Effect.scoped,
    Effect.mapError((problem) =>
      problem instanceof TrialUnavailable
        ? problem
        : failed(
            `The oxlint trial could not run in a temporary directory: ${problem instanceof Error ? problem.message : String(problem)}`,
          ),
    ),
  );
