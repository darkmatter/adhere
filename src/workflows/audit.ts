import { type Examples, examplesOf, type Rule, type RuleId } from "#config.ts";
import { type Excerpt, excerptOf } from "#excerpt.ts";
import type { ScannedFile, WalkUnavailable } from "#models/Audit.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { AuditCache, answersOf, type Judgment, sha256, type Tally } from "#services/AuditCache.ts";
import {
  fits,
  Jev,
  JevUnavailable,
  type Judged,
  judgeQuestion,
  judgeLoad,
  judgeRequests,
  linterQuestion,
  locateRequests,
  questionRoom,
  tokensOf,
} from "#services/Jev.ts";
import { SourceWalker } from "#services/SourceWalker.ts";
import { clearingStatus, counted, countOf, Status } from "#services/Status.ts";
import { SAMPLE, tallyKeyOf } from "#mechanical.ts";
import { priceOf } from "#pricing.ts";
import { applicableRules } from "#rules.ts";
import { type Crypto, Duration, Effect, Record, Result, Semaphore } from "effect";

export interface Finding {
  readonly rule: RuleId;
  readonly description: string;
  readonly examples: Examples;
  readonly file: string;
  readonly line: number;
  /** The code around `line` the report shows. */
  readonly excerpt: Excerpt;
  readonly probability: number;
}

export interface AuditResult {
  readonly files: number;
  readonly judged: number;
  readonly cached: number;
  readonly skipped: number;
  /** Files whose checks `--limit` left for a later run, none judged in this one. */
  readonly waiting: number;
  /** Files the firewall in front of Jev's API refused, with the ID to report each by. */
  readonly blocked: ReadonlyArray<Blocked>;
  readonly findings: ReadonlyArray<Finding>;
}

/** A file whose request the firewall refused, and Cloudflare's Ray ID for the refusal. */
export interface Blocked {
  readonly file: string;
  readonly ray: string;
}

interface FileResult {
  readonly status: "judged" | "cached" | "skipped" | "waiting" | "blocked";
  readonly findings: ReadonlyArray<Finding>;
  readonly blocked?: Blocked;
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
  /** Pending checks `--limit` leaves for a later run. */
  readonly deferred: number;
  /** Pending rules whose linter check question rides along on this file, each with its tally's key. */
  readonly sampled: Readonly<Record<RuleId, string>>;
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
  /** Checks `--limit` leaves for a later run. */
  readonly deferred: number;
  /** Requests to Jev that judging the other checks takes. Locating findings adds 1 or more per file. */
  readonly requests: number;
  /** About how many input tokens those requests carry, which Jev charges for. */
  readonly tokens: number;
  /** The model's price per million input tokens, in dollars, when adhere knows it. */
  readonly price?: number;
}

/** A file finished, for a progress counter: the requests it took and the findings it has. */
export interface FileDone {
  readonly requests: number;
  readonly findings: number;
}

const rulesOf = (some: Readonly<Record<RuleId, PreparedRule>>) => Record.map(some, (k) => k.rule);

const sizeOf = (some: Readonly<Record<string, unknown>>): number => Object.keys(some).length;

/** A refusal that names the file it stopped at. Files finished before it are already cached. */
const inFile =
  (file: ScannedFile) =>
  <A, E, R>(self: Effect.Effect<A, E, R>) =>
    Effect.mapError(self, (problem) =>
      problem instanceof JevUnavailable
        ? JevUnavailable.make({
            message: `${file.path}: ${problem.message}. Files judged before it are cached, so a rerun continues from there.`,
          })
        : problem,
    );

/**
 * The plan with at most `limit` checks left to judge, taken in path order.
 * Past the limit a file's other checks wait for a later run; judgments are
 * cached, so a rerun picks up where this one stopped.
 */
const withinLimit = (planned: ReadonlyArray<FilePlan>, limit: number): ReadonlyArray<FilePlan> => {
  let left = limit;
  return planned.map((plan) => {
    const ids = Object.keys(plan.pending);
    const taken = new Set(ids.slice(0, left));
    left -= taken.size;
    return taken.size === ids.length
      ? plan
      : {
          ...plan,
          pending: Record.filter(plan.pending, (_, id) => taken.has(id)),
          deferred: ids.length - taken.size,
        };
  });
};

export interface PlanOptions {
  /** Judge at most this many checks; the rest wait for a later run. */
  readonly limit?: number;
}

export const planAudit = (
  options: PlanOptions = {},
): Effect.Effect<
  AuditPlan,
  WalkUnavailable,
  AdhereConfig | AuditCache | Crypto.Crypto | SourceWalker
> =>
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const cache = yield* AuditCache;
    const files = yield* (yield* SourceWalker).files;

    const configuredRules = (file: string) =>
      config.scopedRules === undefined ? config.rules : applicableRules(file, config.scopedRules);

    const planFile = Effect.fn("audit.plan")(function* (file: ScannedFile) {
      const rules = configuredRules(file.path);
      // Hashed even when skipped, so a prune keeps what other runs know of its content.
      const hash = yield* sha256(file.lines.join("\n"));
      // Too long for Jev's context: skipped and counted, rather than refused mid-run.
      if (!fits(file.lines, rules)) {
        yield* Effect.logTrace(`plan ${file.path}: too long for Jev's context, skipped`);
        return {
          file,
          skipped: true,
          hash,
          prepared: {},
          kept: {},
          pending: {},
          deferred: 0,
          sampled: {},
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
      const answers = yield* cache.get(hash, file.path);
      const kept: Record<RuleId, Judgment> = Record.filterMap(prepared, ({ fingerprint }) => {
        const answer = answers[fingerprint];
        return answer === undefined ? Result.failVoid : Result.succeed({ fingerprint, ...answer });
      });
      const pending = Record.filter(prepared, (_, id) => kept[id] === undefined);
      yield* Effect.logTrace(
        `plan ${file.path}: ${sizeOf(prepared)} rules, ${sizeOf(kept)} cached, ${sizeOf(pending)} to judge`,
      );
      return {
        file,
        skipped: false,
        hash,
        prepared,
        kept,
        pending,
        deferred: 0,
        sampled: {},
      } satisfies FilePlan;
    });

    // Preset rules are not the project's to change, so the linter check leaves them out.
    const presetRules = new Set(
      (config.scopedRules ?? []).flatMap((entry) =>
        entry.preset === undefined ? [] : [entry.rule],
      ),
    );

    /**
     * The linter check's samples: for each project rule its tally still needs
     * answers for, files this run judges it on, spread evenly over them in path
     * order, skipping files the tally has and files its question would not fit.
     */
    const withSamples = Effect.fn("audit.samples")(function* (plans: ReadonlyArray<FilePlan>) {
      const needs = new Map<Rule, { readonly key: string; readonly tallied: Tally["files"] }>();
      for (const plan of plans) {
        for (const { rule } of Object.values(plan.pending)) {
          if (presetRules.has(rule) || needs.has(rule)) continue;
          const key = yield* tallyKeyOf(config.model, rule);
          needs.set(rule, { key, tallied: (yield* cache.tally(key))?.files ?? {} });
        }
      }
      for (const [rule, { tallied }] of needs) {
        if (Object.keys(tallied).length >= SAMPLE) needs.delete(rule);
      }
      if (needs.size === 0) return plans;

      const candidates = new Map<Rule, Array<{ readonly plan: FilePlan; readonly id: RuleId }>>();
      const tokens = new Map<Rule, number>();
      for (const plan of plans) {
        let room: number | undefined;
        for (const [id, { rule }] of Object.entries(plan.pending)) {
          const need = needs.get(rule);
          if (need === undefined || need.tallied[plan.file.path] !== undefined) continue;
          room ??= questionRoom(plan.file.lines);
          const size = tokens.get(rule) ?? tokensOf(linterQuestion(rule));
          tokens.set(rule, size);
          if (size > room) continue;
          const found = candidates.get(rule);
          if (found === undefined) candidates.set(rule, [{ plan, id }]);
          else found.push({ plan, id });
        }
      }

      const sampled = new Map<FilePlan, Record<RuleId, string>>();
      for (const [rule, found] of candidates) {
        const need = needs.get(rule);
        if (need === undefined) continue;
        const count = Math.min(found.length, SAMPLE - Object.keys(need.tallied).length);
        for (let index = 0; index < count; index++) {
          const pick = found[Math.floor((index * found.length) / count)];
          if (pick !== undefined) {
            sampled.set(pick.plan, { ...sampled.get(pick.plan), [pick.id]: need.key });
          }
        }
      }
      return plans.map((plan) => {
        const some = sampled.get(plan);
        return some === undefined ? plan : { ...plan, sampled: some };
      });
    });

    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
    const status = yield* Status;
    let done = 0;
    const everything: ReadonlyArray<FilePlan> = yield* clearingStatus(
      Effect.forEach(
        sorted,
        (file) =>
          planFile(file).pipe(
            Effect.tap(() => {
              done += 1;
              return status.show(
                `Planning: ${counted(done)} of ${countOf(sorted.length, "file", "files")}`,
              );
            }),
          ),
        { concurrency: 8 },
      ),
    );
    const limited =
      options.limit === undefined ? everything : withinLimit(everything, options.limit);
    const planned = yield* withSamples(limited);
    const judged = planned.filter((plan) => !plan.skipped);
    const loads = judged.map((plan) =>
      isEmpty(plan.pending)
        ? { requests: 0, tokens: 0 }
        : judgeLoad(plan.file.lines, rulesOf(plan.pending), Object.keys(plan.sampled)),
    );
    const price = priceOf(config.model);
    const total = (count: (plan: FilePlan) => number) =>
      judged.reduce((sum, plan) => sum + count(plan), 0);
    return {
      files: planned,
      rules: new Set(judged.flatMap((plan) => Object.keys(plan.prepared))).size,
      checks: total((plan) => sizeOf(plan.prepared)),
      cached: total((plan) => sizeOf(plan.kept)),
      skipped: planned.length - judged.length,
      deferred: total((plan) => plan.deferred),
      requests: loads.reduce((sum, load) => sum + load.requests, 0),
      tokens: loads.reduce((sum, load) => sum + load.tokens, 0),
      ...(price === undefined ? {} : { price }),
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
    // Files finish together; each tally is read, extended, and written back by one file at a time.
    const tallying = yield* Semaphore.make(1);

    /** Adds one file's linter check answers to their rules' tallies. */
    const record = (
      file: string,
      sampled: Readonly<Record<RuleId, string>>,
      linter: Readonly<Record<RuleId, number>>,
    ) =>
      tallying.withPermits(1)(
        Effect.forEach(
          Object.entries(linter),
          ([id, probability]) => {
            const key = sampled[id];
            return key === undefined
              ? Effect.void
              : Effect.flatMap(cache.tally(key), (tally) =>
                  cache.putTally(key, { files: { ...tally?.files, [file]: probability } }),
                );
          },
          { discard: true },
        ),
      );

    /** Judges and locates one file the plan left pending, with the requests that took. */
    const judgeFile = Effect.fn("audit.judgeFile")(function* ({
      file,
      hash,
      prepared,
      kept,
      pending,
      deferred,
      sampled,
    }: FilePlan) {
      const { probabilities, linter }: Judged = isEmpty(pending)
        ? { probabilities: {}, linter: {} }
        : yield* jev.judge(file.lines, rulesOf(pending), Object.keys(sampled)).pipe(inFile(file));
      if (!isEmpty(linter)) yield* record(file.path, sampled, linter);
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
      // A blocked line question still leaves the judgments worth caching: a rerun
      // asks only for the lines again, not for every rule.
      const {
        lines,
        blocked,
      }: { readonly lines: Readonly<Record<RuleId, number>>; readonly blocked?: Blocked } = isEmpty(
        flagged,
      )
        ? { lines: {}, blocked: undefined }
        : yield* jev.locate(file.lines, rulesOf(flagged)).pipe(
            Effect.map((lines) => ({ lines, blocked: undefined })),
            Effect.catchTag("JevBlocked", ({ ray }) =>
              Effect.succeed({ lines: {}, blocked: { file: file.path, ray } }),
            ),
            inFile(file),
          );
      const located = Record.map(judged, (judgment, id) => {
        const line = lines[id];
        return line === undefined ? judgment : { ...judgment, line };
      });

      const cached = isEmpty(pending) && isEmpty(flagged);
      if (!cached) yield* cache.put(hash, answersOf(located));

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
                  examples: examplesOf(k.rule),
                  file: file.path,
                  line: judgment.line,
                  excerpt: excerptOf(file.lines, judgment.line),
                  probability: judgment.probability,
                },
              ]
            : [];
        })
        .sort((a, b) => a.line - b.line);
      return {
        result:
          blocked === undefined
            ? fileResult(cached ? (deferred > 0 ? "waiting" : "cached") : "judged", findings)
            : { status: "blocked", findings, blocked },
        requests:
          (isEmpty(pending)
            ? 0
            : judgeRequests(file.lines, rulesOf(pending), Object.keys(sampled))) +
          (isEmpty(flagged) ? 0 : locateRequests(file.lines, rulesOf(flagged))),
      };
    });

    const auditFile = Effect.fn("audit.file")(function* (plan: FilePlan) {
      const judging = plan.skipped
        ? Effect.succeed({ result: fileResult("skipped", []), requests: 0 })
        : judgeFile(plan).pipe(
            // Jev counted more than `fits` estimated. Its count decides: skipped the same way.
            Effect.catchTag("JevOverflow", () =>
              Effect.succeed({
                result: fileResult("skipped", []),
                requests: judgeRequests(
                  plan.file.lines,
                  rulesOf(plan.pending),
                  Object.keys(plan.sampled),
                ),
              }),
            ),
            // The firewall refuses this file's code every time; the rest of the run goes on.
            Effect.catchTag("JevBlocked", ({ ray }) =>
              Effect.succeed({
                result: {
                  status: "blocked",
                  findings: [],
                  blocked: { file: plan.file.path, ray },
                } satisfies FileResult,
                requests: judgeRequests(
                  plan.file.lines,
                  rulesOf(plan.pending),
                  Object.keys(plan.sampled),
                ),
              }),
            ),
          );
      // Everything logged while judging a file, requests included, names the file.
      // A file that sent nothing, whether cached or too long, is a trace line: a
      // large repo's cache would otherwise bury the requests.
      const [, { result, requests }] = yield* Effect.timed(judging).pipe(
        Effect.tap(([elapsed, { result, requests }]) =>
          (requests > 0 ? Effect.logDebug : Effect.logTrace)(
            `${result.status}: ${requests} ${requests === 1 ? "request" : "requests"}, ${result.findings.length} ${result.findings.length === 1 ? "finding" : "findings"}, ${Math.round(Duration.toMillis(elapsed))} ms`,
          ),
        ),
        Effect.annotateLogs("file", plan.file.path),
      );
      yield* progress({ requests, findings: result.findings.length });
      return result;
    });

    const results = yield* Effect.forEach(plan.files, auditFile, { concurrency: 8 });
    const count = (status: FileResult["status"]) =>
      results.filter((result) => result.status === status).length;
    return {
      files: plan.files.length,
      judged: count("judged"),
      cached: count("cached"),
      skipped: count("skipped"),
      waiting: count("waiting"),
      blocked: results.flatMap((result) => (result.blocked === undefined ? [] : [result.blocked])),
      findings: results.flatMap((result) => result.findings),
    };
  });

/**
 * Deletes from the cache the answers about content no file has anymore.
 * Answers to rules the run left out stay, since a run with other presets or
 * rules asks them. Only after a run that read every file; a run narrowed by
 * `--filter` cannot tell what content the files it left out have.
 */
export const pruneCache = Effect.fn("audit.prune")(function* (plan: AuditPlan) {
  const config = yield* AdhereConfig;
  const cache = yield* AuditCache;
  const prepared = plan.files.flatMap((file) => Object.values(file.prepared));
  const tallies = yield* Effect.forEach(new Set(prepared.map(({ rule }) => rule)), (rule) =>
    tallyKeyOf(config.model, rule),
  );
  const deleted = yield* cache.prune({
    // A file too long to judge counts: a run with shorter questions judges it.
    hashes: new Set(plan.files.map((file) => file.hash)),
    tallies: new Set(tallies),
  });
  yield* Effect.logDebug(`cache pruned: ${deleted} ${deleted === 1 ? "file" : "files"} deleted`);
});

/** Plans the run and executes it, without asking and without a counter. */
export const runAudit: Effect.Effect<
  AuditResult,
  WalkUnavailable | JevUnavailable,
  AdhereConfig | AuditCache | Crypto.Crypto | Jev | SourceWalker
> = Effect.flatMap(planAudit(), (plan) => executeAudit(plan));

export { type RenderOptions, render } from "#workflows/format.ts";
