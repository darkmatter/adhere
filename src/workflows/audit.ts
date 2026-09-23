import type { Rule, RuleId } from "#config.ts";
import type { ScannedFile, WalkUnavailable } from "#models/Audit.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { AuditCache, type Judgment, sha256 } from "#services/AuditCache.ts";
import {
  fits,
  Jev,
  JevUnavailable,
  judgeQuestion,
  judgeRequests,
  locateRequests,
  snippetOf,
} from "#services/Jev.ts";
import { SourceWalker } from "#services/SourceWalker.ts";
import { applicableRules } from "#rules.ts";
import { type Crypto, Effect, Record } from "effect";

export interface Finding {
  readonly rule: RuleId;
  readonly description: string;
  readonly reference?: string;
  readonly avoid?: string;
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
  readonly probability: number;
}

export interface AuditResult {
  readonly files: number;
  readonly judged: number;
  readonly cached: number;
  readonly skipped: number;
  readonly findings: ReadonlyArray<Finding>;
}

interface FileResult {
  readonly status: "judged" | "cached" | "skipped";
  readonly findings: ReadonlyArray<Finding>;
}

interface PreparedRule {
  readonly rule: Rule;
  readonly fingerprint: string;
  readonly threshold: number;
}

const fileResult = (
  status: FileResult["status"],
  findings: ReadonlyArray<Finding>,
): FileResult => ({ status, findings });

const isEmpty = Record.isEmptyReadonlyRecord;

/**
 * What a judgment depends on besides the file: the model, and the question
 * asked for the rule, which carries the rule. An edited rule re-judges
 * itself, and a question asked differently re-judges every rule.
 */
const fingerprintOf = (model: string, rule: Rule) =>
  sha256(`${model}\u0000${JSON.stringify(judgeQuestion(rule))}`);

/** One file before anything is sent: its rules, and which of them the cache answers. */
export interface FilePlan {
  readonly file: ScannedFile;
  /** Too long for Jev: counted, not judged. */
  readonly skipped: boolean;
  readonly hash: string;
  readonly prepared: Readonly<Record<RuleId, PreparedRule>>;
  /** Cached judgments still valid for the file's content and the rule's text. */
  readonly kept: Readonly<Record<RuleId, Judgment>>;
  readonly pending: Readonly<Record<RuleId, PreparedRule>>;
}

/** A run worked out from the files, the rules, and the cache, before any request. */
export interface AuditPlan {
  readonly files: ReadonlyArray<FilePlan>;
  /** Rules that apply to at least one file that is judged. */
  readonly rules: number;
  /** Every pair of a judged file and a rule that applies to it. */
  readonly checks: number;
  /** Checks a cached judgment answers. */
  readonly cached: number;
  /** Files too long to judge. */
  readonly skipped: number;
  /** Requests to Jev that judging the other checks takes. Locating findings adds 1 or more per file. */
  readonly requests: number;
}

/** A file finished, for a progress counter: the requests it took and the findings it has. */
export interface FileDone {
  readonly requests: number;
  readonly findings: number;
}

const rulesOf = (some: Readonly<Record<RuleId, PreparedRule>>) => Record.map(some, (k) => k.rule);

const sizeOf = (some: Readonly<Record<string, unknown>>): number => Object.keys(some).length;

/** A refusal that names the file it stopped at. Files finished before it are already cached. */
const inFile = (file: ScannedFile) =>
  Effect.mapError((problem: JevUnavailable) =>
    JevUnavailable.make({
      message: `${file.path}: ${problem.message}. Files judged before it are cached, so a rerun continues from there.`,
    }),
  );

export const planAudit: Effect.Effect<
  AuditPlan,
  WalkUnavailable,
  AdhereConfig | AuditCache | Crypto.Crypto | SourceWalker
> = Effect.gen(function* () {
  const config = yield* AdhereConfig;
  const cache = yield* AuditCache;
  const files = yield* (yield* SourceWalker).files;

  const configuredRules = (file: string) =>
    config.scopedRules === undefined ? config.rules : applicableRules(file, config.scopedRules);

  const planFile = Effect.fn("audit.plan")(function* (file: ScannedFile) {
    const rules = configuredRules(file.path);
    // Too long for Jev's context: skipped and counted, rather than refused mid-run.
    if (!fits(file.lines, rules)) {
      return {
        file,
        skipped: true,
        hash: "",
        prepared: {},
        kept: {},
        pending: {},
      } satisfies FilePlan;
    }
    const prepared: Record<RuleId, PreparedRule> = yield* Effect.forEach(
      Object.entries(rules),
      ([id, rule]) =>
        Effect.map(
          fingerprintOf(config.model, rule),
          (fingerprint) =>
            [id, { rule, fingerprint, threshold: rule.threshold ?? config.threshold }] as const,
        ),
    ).pipe(Effect.map(Record.fromEntries));
    const hash = yield* sha256(file.lines.join("\n"));
    const entry = yield* cache.get(file.path);
    const remembered = entry?.hash === hash ? entry.judgments : {};
    const kept = Record.filter(
      remembered,
      (judgment, id) => judgment.fingerprint === prepared[id]?.fingerprint,
    );
    const pending = Record.filter(prepared, (_, id) => kept[id] === undefined);
    return { file, skipped: false, hash, prepared, kept, pending } satisfies FilePlan;
  });

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const planned: ReadonlyArray<FilePlan> = yield* Effect.forEach(sorted, planFile, {
    concurrency: 8,
  });
  const judged = planned.filter((plan) => !plan.skipped);
  const total = (count: (plan: FilePlan) => number) =>
    judged.reduce((sum, plan) => sum + count(plan), 0);
  return {
    files: planned,
    rules: new Set(judged.flatMap((plan) => Object.keys(plan.prepared))).size,
    checks: total((plan) => sizeOf(plan.prepared)),
    cached: total((plan) => sizeOf(plan.kept)),
    skipped: planned.length - judged.length,
    requests: total((plan) =>
      isEmpty(plan.pending) ? 0 : judgeRequests(plan.file.lines, rulesOf(plan.pending)),
    ),
  };
});

/**
 * Judges what the plan left pending and locates the findings, a file at a
 * time, telling `progress` as each file finishes.
 */
export const executeAudit = (
  plan: AuditPlan,
  progress: (done: FileDone) => Effect.Effect<void> = () => Effect.void,
): Effect.Effect<AuditResult, JevUnavailable, AuditCache | Jev> =>
  Effect.gen(function* () {
    const jev = yield* Jev;
    const cache = yield* AuditCache;

    const auditFile = Effect.fn("audit.file")(function* ({
      file,
      skipped,
      hash,
      prepared,
      kept,
      pending,
    }: FilePlan) {
      if (skipped) {
        yield* progress({ requests: 0, findings: 0 });
        return fileResult("skipped", []);
      }
      const probabilities = isEmpty(pending)
        ? {}
        : yield* jev.judge(file.lines, rulesOf(pending)).pipe(inFile(file));
      const judged: Record<RuleId, Judgment> = { ...kept };
      for (const [id, probability] of Object.entries(probabilities)) {
        const k = pending[id];
        if (k !== undefined) judged[id] = { fingerprint: k.fingerprint, probability };
      }

      const flagged = Record.filter(prepared, (k, id) => {
        const judgment = judged[id];
        return (
          judgment !== undefined &&
          judgment.probability > k.threshold &&
          judgment.line === undefined
        );
      });
      const lines = isEmpty(flagged)
        ? {}
        : yield* jev.locate(file.lines, rulesOf(flagged)).pipe(inFile(file));
      const located = Record.map(judged, (judgment, id) => {
        const line = lines[id];
        return line === undefined
          ? judgment
          : { ...judgment, line, snippet: snippetOf(file.lines[line - 1] ?? "") };
      });

      const cached = isEmpty(pending) && isEmpty(flagged);
      if (!cached) yield* cache.put(file.path, { hash, judgments: located });

      const findings = Object.entries(located)
        .flatMap(([id, judgment]): ReadonlyArray<Finding> => {
          const k = prepared[id];
          return k !== undefined &&
            judgment.line !== undefined &&
            judgment.probability > k.threshold
            ? [
                {
                  rule: id,
                  description: k.rule.description,
                  reference: k.rule.reference,
                  avoid: k.rule.avoid,
                  file: file.path,
                  line: judgment.line,
                  snippet: judgment.snippet ?? "",
                  probability: judgment.probability,
                },
              ]
            : [];
        })
        .sort((a, b) => a.line - b.line);
      yield* progress({
        requests:
          (isEmpty(pending) ? 0 : judgeRequests(file.lines, rulesOf(pending))) +
          (isEmpty(flagged) ? 0 : locateRequests(file.lines, rulesOf(flagged))),
        findings: findings.length,
      });
      return fileResult(cached ? "cached" : "judged", findings);
    });

    const results = yield* Effect.forEach(plan.files, auditFile, { concurrency: 8 });
    const count = (status: FileResult["status"]) =>
      results.filter((result) => result.status === status).length;
    return {
      files: plan.files.length,
      judged: count("judged"),
      cached: count("cached"),
      skipped: count("skipped"),
      findings: results.flatMap((result) => result.findings),
    };
  });

/** Plans the run and executes it, without asking and without a counter. */
export const runAudit: Effect.Effect<
  AuditResult,
  WalkUnavailable | JevUnavailable,
  AdhereConfig | AuditCache | Crypto.Crypto | Jev | SourceWalker
> = Effect.flatMap(planAudit, (plan) => executeAudit(plan));

export { type RenderOptions, render } from "#workflows/format.ts";
