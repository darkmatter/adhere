import type { AuditError, ScannedFile, SolutionsTopic } from "#models/Audit.ts";
import {
  type Candidate,
  JevJudge,
  JevUnavailable,
  type Verdict,
} from "#models/Judge.ts";
import type { ConfiguredRule } from "#rules.ts";
import { judgedRules, lineFindings } from "#rules.ts";
import {
  AuditCache,
  type CacheEntry,
  contentHash,
} from "#services/AuditCache.ts";
import { Rules } from "#services/Rules.ts";
import { SourceWalker } from "#services/SourceWalker.ts";
import { Crypto, Effect } from "effect";

export interface AuditOptions {
  /** Only judge candidates for these topics; every topic when omitted. */
  readonly topics?: ReadonlyArray<string>;
  /** The probability above which a verdict is reported as a violation. */
  readonly threshold?: number;
}

/**
 * The audit's full result: what the CLI publishes, what was read, what the
 * line tests found, and what Jev decided for rules that have no line test.
 */
export interface AuditResult {
  readonly topics: ReadonlyArray<SolutionsTopic>;
  readonly filesScanned: number;
  readonly candidates: number;
  /** Files served entirely from the cache, with no new judgment. */
  readonly cachedFiles: number;
  readonly violations: ReadonlyArray<Verdict>;
}

/** How many lines one Jev call sees. Choice criteria cannot exceed 255 lines. */
const WINDOW = 200;

/** Numbered file text, with no line pre-selected. Jev decides if any line is a flag. */
const numbered = (
  lines: ReadonlyArray<string>,
  start: number,
): string =>
  lines.map((line, index) => `${start + index + 1} | ${line}`).join("\n");

/** Findings a line test decided. Jev is not asked. */
const localVerdicts = (
  rules: ReadonlyArray<ConfiguredRule>,
  file: ScannedFile,
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<Verdict> =>
  lineFindings(rules, file, wanted).map((finding) => ({
    topic: finding.topic,
    rule: finding.rule,
    file: file.path,
    line: finding.line,
    column: finding.column,
    message: finding.message,
    help: finding.help,
    snippet: finding.snippet,
    violates: 1,
    reason: "matched the rule",
    decidedBy: "rule",
  }));

/** One file's windows for rules that have no line test. */
const judgedCandidates = (
  rules: ReadonlyArray<ConfiguredRule>,
  file: ScannedFile,
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<Candidate> => {
  const candidates: Array<Candidate> = [];
  const lines = file.lines.length === 0 ? [""] : file.lines;
  for (const rule of judgedRules(rules, wanted)) {
    for (let start = 0; start < lines.length; start += WINDOW) {
      const slice = lines.slice(start, start + WINDOW);
      const first = slice[0] ?? "";
      candidates.push({
        topic: rule.topic,
        rule: rule.rule,
        file: file.path,
        line: start + 1,
        column: 1,
        message: rule.message,
        help: rule.help,
        snippet: first.trim().slice(0, 120),
        excerpt: numbered(slice, start),
        pattern: rule.pattern,
      });
    }
  }
  return candidates;
};

/** Topics this run must have judged before a file can be skipped. */
const requestedTopics = (
  rules: ReadonlyArray<ConfiguredRule>,
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<string> =>
  wanted === undefined
    ? [...new Set(rules.map((rule) => rule.topic))].sort()
    : [...wanted].sort();

/** One file's split between cached verdicts and candidates still to judge. */
interface FilePlan {
  readonly path: string;
  readonly hash: string;
  /** Findings a line test decided on this run. */
  readonly local: ReadonlyArray<Verdict>;
  /** Files still to send to Jev, for rules that have no line test. */
  readonly pending: ReadonlyArray<Candidate>;
  /** Verdicts from the cache that stay stored, including other topics. */
  readonly retained: ReadonlyArray<Verdict>;
  /** Cached verdicts that belong to this run's topic filter. */
  readonly reported: ReadonlyArray<Verdict>;
  readonly topics: ReadonlyArray<string>;
  readonly cached: boolean;
}

/** Plan one file: reuse the entry when the hash and topics already match. */
const planFile = (
  rules: ReadonlyArray<ConfiguredRule>,
  file: ScannedFile,
  hash: string,
  entry: CacheEntry | undefined,
  wanted: ReadonlySet<string> | undefined,
): FilePlan => {
  const requested = requestedTopics(rules, wanted);
  const fresh = entry === undefined || entry.hash !== hash;
  const have = fresh ? [] : entry.topics;
  const covered = new Set(have);
  const missing = requested.filter((topic) => !covered.has(topic));
  const missingTopics = new Set(missing);
  const retained = fresh
    ? []
    : entry.verdicts.filter((verdict) => !missingTopics.has(verdict.topic));
  const reported = retained.filter(
    (verdict) => wanted === undefined || wanted.has(verdict.topic),
  );
  const coveredTopics = missing.length === 0 ? undefined : missingTopics;
  return {
    path: file.path,
    hash,
    local: missing.length === 0 ? [] : localVerdicts(rules, file, coveredTopics),
    pending:
      missing.length === 0 ? [] : judgedCandidates(rules, file, coveredTopics),
    retained,
    reported,
    topics: [...new Set([...have, ...requested])].sort(),
    cached: !fresh && missing.length === 0,
  };
};

/** Newly judged verdicts, grouped by the file they came from. */
const groupByFile = (
  verdicts: ReadonlyArray<Verdict>,
): ReadonlyMap<string, ReadonlyArray<Verdict>> => {
  const grouped = new Map<string, Array<Verdict>>();
  for (const verdict of verdicts) {
    const list = grouped.get(verdict.file) ?? [];
    list.push(verdict);
    grouped.set(verdict.file, list);
  }
  return grouped;
};

/** Judge every candidate against the pattern written on its rule. */
export const runAudit = (
  options: AuditOptions = {},
): Effect.Effect<
  AuditResult,
  AuditError | JevUnavailable,
  AuditCache | Crypto.Crypto | Rules | SourceWalker | JevJudge
> =>
  Effect.gen(function* () {
    const catalog = yield* Rules;
    const walker = yield* SourceWalker;
    const judge = yield* JevJudge;
    const store = yield* AuditCache;
    const rules = catalog.rules;
    const files = yield* walker.files;
    const threshold = options.threshold ?? 0.5;
    const topics: ReadonlyArray<SolutionsTopic> = [
      ...new Set(rules.map((rule) => rule.topic)),
    ]
      .sort()
      .map((slug) => ({ slug, title: slug }));

    const wanted =
      options.topics !== undefined && options.topics.length > 0
        ? new Set(options.topics)
        : undefined;
    const planHashed = (file: ScannedFile) =>
      Effect.flatMap(contentHash(file.lines), (hash) =>
        Effect.map(store.get(file.path), (entry) =>
          planFile(rules, file, hash, entry, wanted),
        ),
      );
    const plans = yield* Effect.forEach(files, planHashed);

    /** One candidate's verdict: the rule's pattern, then Jev's judgment. */
    const verdictOf = (candidate: Candidate) =>
      judge.judge(candidate, candidate.pattern);

    const judged = yield* Effect.forEach(
      plans.flatMap((plan) => plan.pending),
      verdictOf,
      { concurrency: 8 },
    );
    const byFile = groupByFile(judged);
    const remember = (plan: FilePlan) =>
      store.put(plan.path, {
        hash: plan.hash,
        topics: plan.topics,
        verdicts: [
          ...plan.retained,
          ...plan.local,
          ...(byFile.get(plan.path) ?? []),
        ],
      });
    yield* Effect.forEach(plans, remember);

    const considered = plans.flatMap((plan) => [
      ...plan.reported,
      ...plan.local,
      ...(byFile.get(plan.path) ?? []),
    ]);
    return {
      topics,
      filesScanned: files.length,
      candidates: considered.length,
      cachedFiles: plans.filter((plan) => plan.cached).length,
      violations: considered.filter(
        (verdict) =>
          verdict.decidedBy === "rule" || verdict.violates > threshold,
      ),
    };
  });

export { type RenderOptions, render } from "#workflows/format.ts";
