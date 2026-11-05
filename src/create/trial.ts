/**
 * A draft rule trialled before it is written: the real lint runtime judges
 * exactly one draft rule over the repository, or the project's own oxlint
 * runs it, and a report the writing agent can read records what happened.
 * Nothing is installed, no rule is written, and no cache is pruned.
 *
 * The draft's config carries the project's runtime settings (model,
 * thresholds, reads, type awareness, comments, excludes) and exactly the
 * draft rule; its preset and project rules never judge anything here.
 */
import {
  AdhereConfig as AdhereConfigSchema,
  decodeConfig,
  presetsOf,
  type ResolvedConfig,
  resolveConfig,
  type Rule,
} from "#config.ts";
import {
  type AdhereTrialDraft,
  oxlintIdOf,
  oxlintProblems,
  runOxlintDraft,
  TrialUnavailable,
  type TrialDraft,
  type TrialFinding,
  type TrialOptions,
  type TrialPreview,
  type TrialRun,
  type TrialScope,
} from "#create/oxlint-trial.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { importRule, judgesFile } from "#rules.ts";
import {
  AdhereConfig,
  findConfigFile,
  loadConfigFile,
  loadPreset,
} from "#services/AdhereConfig.ts";
import { AuditCache, AuditCacheAt, sha256 } from "#services/AuditCache.ts";
import { Credentials, CredentialsLive } from "#services/Credentials.ts";
import { Jev } from "#services/Jev.ts";
import { JevLive } from "#services/Jev.http.ts";
import { SourceReads, SourceReadsLive } from "#services/SourceReads.ts";
import { SourceWalker, SourceWalkerLive, type SourceFile } from "#services/SourceWalker.ts";
import { workspaceDependentsOf, workspacePackagesOf } from "#workspaces.ts";
import {
  type AuditPlan,
  type AuditResult,
  executeAudit,
  type Finding,
  planAudit,
} from "#workflows/audit.ts";
import { renderJson } from "#workflows/format.ts";
import { Context, Effect, FileSystem, Layer, Option, Path, Record } from "effect";
import { relative, sep } from "node:path";

export {
  type AdhereTrialDraft,
  type NativeTrialDraft,
  type OxlintTrialDraft,
  type PluginTrialDraft,
  TrialUnavailable,
  type TrialDraft,
  type TrialFinding,
  type TrialOptions,
  type TrialPreview,
  type TrialRange,
  type TrialRun,
  type TrialScope,
  type TrialUnavailableReason,
} from "#create/oxlint-trial.ts";

/** A lower-level trial seam for tests: the real services unless a layer is supplied. */
export interface TrialServices {
  readonly cache?: Layer.Layer<AuditCache>;
  readonly jev?: Layer.Layer<Jev>;
  readonly sourceReads?: Layer.Layer<SourceReads>;
}

export interface TrialRunOptions extends TrialOptions {
  readonly services?: TrialServices;
  /** The checkout to trial, when it is not the working directory. */
  readonly root?: string;
}

const REPORT_DIRECTORY = ".adhere/trial";
const DEFAULT_TRIAL_LIMIT = 100;

const trialError = (
  reason: Parameters<typeof TrialUnavailable.make>[0]["reason"],
  message: string,
) => TrialUnavailable.make({ reason, message });

/** A path from the working directory, `/`-separated, as a report names it. */
const display = (root: string, file: string): string => relative(root, file).split(sep).join("/");

const normalized = (file: string): string => file.replaceAll("\\", "/").replace(/^\.\//, "");

/** The report's path for a draft, relative to the working directory. */
export const trialReportPath = (id: string): string =>
  `${REPORT_DIRECTORY}/${encodeURIComponent(id)}.json`;

type ProjectConfig = typeof AdhereConfigSchema.Type;

const projectConfig = (root: string) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const file = yield* findConfigFile(root);
    return file === undefined
      ? yield* decodeConfig({})
      : yield* loadConfigFile(path.join(root, file));
  });

/** The draft rule: a RULE.md parsed, or a RULE.ts imported from a scoped temporary directory. */
const draftRule = (draft: AdhereTrialDraft) =>
  Effect.gen(function* () {
    if (draft.format === "markdown") {
      return yield* parseRuleMarkdown(draft.source, `${draft.id}/RULE.md`).pipe(
        Effect.mapError((problem) => trialError("draft", problem.message)),
      );
    }
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const directory = yield* fs.makeTempDirectoryScoped({ prefix: "adhere-trial-rule-" });
    const file = path.join(directory, "RULE.ts");
    yield* fs.writeFileString(file, draft.source);
    return yield* importRule(file).pipe(
      Effect.mapError((problem) =>
        trialError("draft", problem.message.replaceAll(file, `${draft.id}/RULE.ts`)),
      ),
    );
  });

/**
 * The project's runtime settings, with exactly the draft rule in scope.
 * Presets still supply a model or threshold, as they do for lint; their rules
 * and the project's own never enter the trial.
 */
const draftConfig = (root: string, raw: ProjectConfig, id: string, rule: Rule) =>
  Effect.gen(function* () {
    const registry = Record.fromEntries(
      yield* Effect.forEach(presetsOf(raw, {}), (name) => loadPreset(name, root)),
    );
    const resolved = resolveConfig({ ...raw, rules: {} }, {}, registry);
    const workspacePackages =
      resolved.reads.includes("workspacePackages") || resolved.reads.includes("dependents")
        ? yield* workspacePackagesOf(root)
        : undefined;
    const workspaceDependents =
      resolved.reads.includes("dependents") && workspacePackages !== undefined
        ? yield* workspaceDependentsOf(root, workspacePackages)
        : undefined;
    return {
      ...resolved,
      // Presets still set the runtime settings; their rules never judge here.
      rules: {},
      scopedRules: [{ id, rule, scope: root }],
      ...(workspacePackages === undefined ? {} : { workspacePackages }),
      ...(workspaceDependents === undefined ? {} : { workspaceDependents }),
    } satisfies ResolvedConfig;
  });

/** The project's excludes, for a walk that judges nothing: enough to pick oxlint's files. */
const neutralConfig = (raw: ProjectConfig): ResolvedConfig =>
  resolveConfig({ ...raw, rules: {} }, {});

/** Every TypeScript file the project's own walk would read, from the checkout's root. */
const eligibleFiles = (root: string, config: ResolvedConfig) =>
  Effect.gen(function* () {
    const walker = yield* SourceWalker.pipe(
      Effect.provide(SourceWalkerLive([], ["."], root)),
      Effect.provideService(AdhereConfig, config),
    );
    return { walker, files: yield* walker.files };
  });

interface Selection {
  readonly files: ReadonlyArray<SourceFile>;
  /** Sorted repo-relative paths, exactly as run and as the report names them. */
  readonly paths: ReadonlyArray<string>;
  /** Applicable files before the cap. */
  readonly eligible: number;
}

/** The cap is on files, cached ones included; a pinned rerun keeps its exact set. */
const selectionOf = (
  root: string,
  eligible: ReadonlyArray<SourceFile>,
  applies: (file: SourceFile) => boolean,
  scope: TrialScope,
  pinned: ReadonlyArray<string> | undefined,
): Effect.Effect<Selection, TrialUnavailable> =>
  Effect.gen(function* () {
    const sorted = [...eligible].filter(applies).sort((a, b) => a.path.localeCompare(b.path));
    const paths = sorted.map((file) => display(root, file.path));
    if (pinned !== undefined) {
      const wanted = [...new Set(pinned.map(normalized))];
      const known = new Map(sorted.map((file, index) => [paths[index]!, file]));
      const missing = wanted.filter((file) => !known.has(file));
      if (missing.length > 0) {
        return yield* trialError(
          "selection",
          `The pinned trial files are no longer eligible: ${missing.join(", ")}. Run the trial again without pinned files.`,
        );
      }
      return {
        files: wanted.map((file) => known.get(file)!),
        paths: wanted,
        eligible: sorted.length,
      };
    }
    const limit = scope.kind === "files" ? scope.limit : undefined;
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) {
      return yield* trialError(
        "selection",
        `The file cap must be a whole number, zero or more; got ${limit}.`,
      );
    }
    const chosen = limit === undefined ? sorted : sorted.slice(0, limit);
    return {
      files: chosen,
      paths: chosen.map((file) => display(root, file.path)),
      eligible: sorted.length,
    };
  });

/** Planning over exactly the selected files, with the draft config and the live cache, never pruning. */
const planTrial = (
  selection: Selection,
  walker: SourceWalker["Service"],
  context: Context.Context<AdhereConfig | AuditCache>,
  root: string,
) =>
  Effect.gen(function* () {
    const selected = Layer.succeed(SourceWalker, {
      files: Effect.succeed(selection.files),
      read: walker.read,
    });
    return yield* planAudit({ root }).pipe(
      Effect.provide(selected),
      Effect.provideContext(context),
    );
  });

const requestsOf = (plan: AuditPlan): number => plan.requests + (plan.cachedLocateRequests ?? 0);

const previewOf = (plan: AuditPlan, eligible: number, selected: number): TrialPreview => ({
  eligible,
  selected,
  requests: requestsOf(plan),
  tokens: plan.tokens,
  ...(plan.price === undefined ? {} : { price: plan.price }),
  cached: plan.cached,
  deferred: plan.deferred,
  skipped: plan.skipped,
  model: plan.model,
  ...(plan.provider === undefined ? {} : { provider: plan.provider }),
});

/** No request is sent when nothing is pending; a cached run needs no key either. */
const preflightProvider = (
  config: ResolvedConfig,
  plan: AuditPlan,
  services: TrialServices | undefined,
): Effect.Effect<void, TrialUnavailable, never> =>
  Effect.gen(function* () {
    if (requestsOf(plan) === 0) return;
    const provider = config.provider;
    // A provider without a saved key authenticates itself; nothing to check here.
    if (provider !== undefined && provider.savedKey === undefined) return;
    // A supplied Jev (tests, or another provider) already decides how it asks.
    if (services?.jev !== undefined) return;
    const credentials = yield* Effect.serviceOption(Credentials);
    if (Option.isNone(credentials)) return;
    yield* credentials.value
      .key(provider?.savedKey ?? "typesafe")
      .pipe(Effect.mapError((problem) => trialError("provider", problem.message)));
  });

/** A finding as the trial reports it: this rule's, with its section and excerpt. */
const trialFinding = (root: string, finding: Finding): TrialFinding => ({
  rule: finding.preset === undefined ? finding.rule : `${finding.preset}/${finding.rule}`,
  file: display(root, finding.file),
  section: finding.section,
  ...(finding.lines === undefined ? {} : { lines: finding.lines }),
  excerpt: finding.excerpt.lines.join("\n"),
  probability: finding.probability,
  threshold: finding.threshold,
  ...(finding.context === undefined ? {} : { context: finding.context }),
});

const revisionOf = (parts: unknown) => sha256(JSON.stringify(parts));

const reportPathFor = (id: string) => trialReportPath(id);

/** Writes the report under `.adhere/trial/`, never `.adhere/reports/`. */
const writeReport = (root: string, id: string, artifact: unknown) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const directory = path.join(root, REPORT_DIRECTORY);
    yield* fs.makeDirectory(directory, { recursive: true });
    const text = `${JSON.stringify(artifact, null, 2)}\n`;
    yield* fs.writeFileString(path.join(root, trialReportPath(id)), text);
    yield* fs.writeFileString(path.join(directory, "report.json"), text);
  }).pipe(
    Effect.mapError((problem) =>
      trialError(
        "other",
        `Could not write the trial report: ${problem instanceof Error ? problem.message : String(problem)}`,
      ),
    ),
  );

/**
 * What a trial would do, without sending anything, writing a report, or
 * touching the cache. An adhere draft is really planned, so requests, tokens,
 * cached checks, and the exact selected files are the run's.
 */
export const previewTrial = (draft: TrialDraft, scope: TrialScope, options: TrialRunOptions = {}) =>
  Effect.scoped(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const root = path.resolve(options.root ?? ".");
      if (draft.kind !== "adhere") {
        const problem = oxlintProblems(draft, root)[0];
        if (problem !== undefined) {
          return yield* trialError(problem.reason, problem.message);
        }
        const raw = yield* projectConfig(root);
        const config = neutralConfig(raw);
        const { files } = yield* eligibleFiles(root, config);
        const selected = yield* selectionOf(root, files, () => true, scope, options.files);
        return {
          eligible: selected.eligible,
          selected: selected.paths.length,
          requests: 0,
          tokens: 0,
          cached: 0,
          deferred: 0,
          skipped: 0,
        } satisfies TrialPreview;
      }
      const raw = yield* projectConfig(root);
      const rule = yield* draftRule(draft);
      const config = yield* draftConfig(root, raw, draft.id, rule);
      const { walker, files } = yield* eligibleFiles(root, config);
      const selected = yield* selectionOf(
        root,
        files,
        (file) => judgesFile(rule, file.test === true),
        scope,
        options.files,
      );
      const cache = options.services?.cache ?? AuditCacheAt(root);
      const context = yield* Layer.build(
        Layer.mergeAll(Layer.succeed(AdhereConfig, config), cache),
      );
      const plan = yield* planTrial(selected, walker, context, root);
      return previewOf(plan, selected.eligible, selected.paths.length);
    }),
  ).pipe(
    Effect.catchTag("ConfigUnavailable", (problem) =>
      Effect.fail(trialError("other", problem.message)),
    ),
    Effect.catchTag("WalkUnavailable", (problem) =>
      Effect.fail(
        trialError(
          /Native TypeScript|typescript|compiler/i.test(problem.message) ? "compiler" : "other",
          problem.message,
        ),
      ),
    ),
    Effect.catch((problem) =>
      problem instanceof TrialUnavailable
        ? Effect.fail(problem)
        : Effect.fail(
            trialError(
              "other",
              `The trial could not plan: ${problem instanceof Error ? problem.message : String(problem)}`,
            ),
          ),
    ),
  );

/**
 * Runs the draft over exactly the selected files: adhere's plan and execution
 * for a rule, the project's own oxlint for a native or plugin rule. Reports
 * what happened, never that the rule is valid; the report is in
 * `.adhere/trial/` for the writing agent to read.
 */
export const runTrial = (draft: TrialDraft, scope: TrialScope, options: TrialRunOptions = {}) =>
  Effect.scoped(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const root = path.resolve(options.root ?? ".");
      const write = options.writeReport !== false;
      if (draft.kind !== "adhere") {
        const raw = yield* projectConfig(root);
        const config = neutralConfig(raw);
        const { files } = yield* eligibleFiles(root, config);
        const selected = yield* selectionOf(root, files, () => true, scope, options.files);
        const run = yield* runOxlintDraft(root, draft, selected.paths);
        const id = oxlintIdOf(draft);
        const revision = yield* revisionOf({
          kind: draft.kind,
          draft,
          scope,
          selectedFiles: selected.paths,
        });
        const reportPath = reportPathFor(id);
        const notes = [
          ...run.notes,
          ...(selected.paths.length === 0
            ? ["No applicable files were selected for this scope."]
            : []),
        ];
        if (write) {
          yield* writeReport(root, id, {
            kind: "oxlint",
            mode: draft.kind,
            revision,
            draft,
            scope,
            eligible: selected.eligible,
            selectedFiles: selected.paths,
            lint: {
              binary: run.binary,
              judged: run.judged,
              diagnostics: run.diagnostics,
            },
            findings: run.findings,
            notes,
          });
        }
        return {
          draft,
          scope,
          revision,
          selectedFiles: selected.paths,
          files: selected.paths.length,
          judged: run.judged,
          cached: 0,
          skipped: 0,
          waiting: 0,
          findings: run.findings,
          reportPath,
          notes,
        } satisfies TrialRun;
      }

      const raw = yield* projectConfig(root);
      const rule = yield* draftRule(draft);
      const config = yield* draftConfig(root, raw, draft.id, rule);
      const { walker, files } = yield* eligibleFiles(root, config);
      const selected = yield* selectionOf(
        root,
        files,
        (file) => judgesFile(rule, file.test === true),
        scope,
        options.files,
      );
      const cache = options.services?.cache ?? AuditCacheAt(root);
      const jev =
        options.services?.jev ??
        JevLive.pipe(
          Layer.provideMerge(CredentialsLive),
          Layer.provide(Layer.succeed(AdhereConfig, config)),
        );
      const sourceReads = options.services?.sourceReads ?? SourceReadsLive(root);
      const context = yield* Layer.build(
        Layer.mergeAll(Layer.succeed(AdhereConfig, config), cache, jev, sourceReads),
      );
      const plan = yield* planTrial(selected, walker, context, root);
      yield* preflightProvider(config, plan, options.services).pipe(Effect.provideContext(context));
      const result: AuditResult = yield* executeAudit(plan).pipe(
        Effect.provide(
          Layer.succeed(SourceWalker, {
            files: Effect.succeed(selected.files),
            read: walker.read,
          }),
        ),
        Effect.provideContext(context),
      );
      const revision = yield* revisionOf({
        kind: "adhere",
        id: draft.id,
        format: draft.format,
        source: draft.source,
        scope,
        selectedFiles: selected.paths,
        runtime: {
          model: config.model,
          provider: config.provider?.model,
          threshold: config.threshold,
          sufficiencyThreshold: config.sufficiencyThreshold,
          reads: config.reads,
          typeAware: config.typeAware,
          includeComments: config.includeComments === true,
        },
      });
      const reportPath = reportPathFor(draft.id);
      // The rule declares what would help; the config still decides what runs,
      // so lint warns and this trial judged the files without that context.
      const missingReads = (rule.reads ?? []).filter((read) => !config.reads.includes(read));
      const notes = [
        ...(missingReads.length > 0
          ? [
              `The rule declares reads ${missingReads.join(", ")}, which this run does not enable; it judged the files without that context and may be less accurate until the config enables it.`,
            ]
          : []),
        ...(result.cached > 0
          ? [
              `${result.cached} selected files were answered from cache for this exact rule text; editing the draft re-judges only what the edit changes.`,
            ]
          : []),
        ...(result.waiting > 0
          ? [`${result.waiting} selected files were left for a later run.`]
          : []),
        ...(result.skipped > 0
          ? [
              `${result.skipped} selected files were too long to judge with this rule and its context.`,
            ]
          : []),
        ...(config.typeAware
          ? [
              "Type-aware reads were requested; symbols and references came from the installed TypeScript compiler.",
            ]
          : []),
        ...(requestsOf(plan) === 0
          ? ["No requests were needed for this selection."]
          : [`The plan estimated ${requestsOf(plan)} requests.`]),
      ];
      if (write) {
        yield* writeReport(root, draft.id, {
          kind: "adhere",
          revision,
          draft,
          scope,
          eligible: selected.eligible,
          selectedFiles: selected.paths,
          plan: {
            model: plan.model,
            ...(plan.provider === undefined ? {} : { provider: plan.provider }),
            threshold: plan.threshold,
            sufficiencyThreshold: plan.sufficiencyThreshold,
            requests: requestsOf(plan),
            tokens: plan.tokens,
            ...(plan.price === undefined ? {} : { price: plan.price }),
            rules: plan.rules,
            checks: plan.checks,
            cached: plan.cached,
            skipped: plan.skipped,
            deferred: plan.deferred,
          },
          result: JSON.parse(
            renderJson(result, {
              root,
              threshold: plan.threshold,
              sufficiencyThreshold: plan.sufficiencyThreshold,
              ...(plan.provider === undefined ? {} : { provider: plan.provider }),
            }),
          ),
          notes,
        });
      }
      return {
        draft,
        scope,
        revision,
        selectedFiles: selected.paths,
        files: result.files,
        judged: result.judged,
        cached: result.cached,
        skipped: result.skipped,
        waiting: result.waiting,
        findings: result.findings.map((finding) => trialFinding(root, finding)),
        reportPath,
        ...(plan.provider === undefined ? {} : { provider: plan.provider }),
        notes,
      } satisfies TrialRun;
    }),
  ).pipe(
    Effect.catchTag("ConfigUnavailable", (problem) =>
      Effect.fail(trialError("other", problem.message)),
    ),
    Effect.catchTag("WalkUnavailable", (problem) =>
      Effect.fail(
        trialError(
          /Native TypeScript|typescript|compiler/i.test(problem.message) ? "compiler" : "other",
          problem.message,
        ),
      ),
    ),
    Effect.catchTag("JevUnavailable", (problem) =>
      Effect.fail(trialError("provider", problem.message)),
    ),
    Effect.catch((problem) =>
      problem instanceof TrialUnavailable
        ? Effect.fail(problem)
        : Effect.fail(
            trialError(
              "other",
              `The trial could not finish: ${problem instanceof Error ? problem.message : String(problem)}`,
            ),
          ),
    ),
  );

export { DEFAULT_TRIAL_LIMIT };
