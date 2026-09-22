import type { AuditError, ScannedFile, SolutionsTopic } from "#models/Audit.ts";
import {
  type Candidate,
  JevJudge,
  JevUnavailable,
  type Verdict,
} from "#models/Judge.ts";
import {
  AuditCache,
  type CacheEntry,
  contentHash,
} from "#services/AuditCache.ts";
import { EffectSolutions } from "#services/EffectSolutions.ts";
import { SourceWalker } from "#services/SourceWalker.ts";
import { TopicPatterns } from "#services/TopicPatterns.ts";
import { detectorTopics, detectors } from "#services/detectors.ts";
import { Crypto, Effect } from "effect";

export interface AuditOptions {
  /** Only judge candidates for these topics; every topic when omitted. */
  readonly topics?: ReadonlyArray<string>;
  /** The probability above which a verdict is reported as a violation. */
  readonly threshold?: number;
}

/**
 * The audit's full result: what the CLI publishes, what was read, what the
 * detectors proposed, and what Jev judged each candidate to be.
 */
export interface AuditResult {
  readonly topics: ReadonlyArray<SolutionsTopic>;
  readonly filesScanned: number;
  readonly candidates: number;
  /** Files served entirely from the cache, with no new judgment. */
  readonly cachedFiles: number;
  readonly violations: ReadonlyArray<Verdict>;
}

/** Lines of context around the flagged line, so judgment sees the pattern in situ. */
const EXCERPT_RADIUS = 3;

/** The code window around a line: enough context for judgment, not the whole file. */
const excerptOf = (lines: ReadonlyArray<string>, at: number): string => {
  const from = Math.max(0, at - EXCERPT_RADIUS);
  const to = Math.min(lines.length, at + EXCERPT_RADIUS + 1);
  return lines
    .slice(from, to)
    .map((line, index) => {
      const number = from + index + 1;
      const mark = number === at + 1 ? ">" : " ";
      return `${mark} ${number} | ${line}`;
    })
    .join("\n");
};

/** One file's candidates from every detector that applies to it. */
const candidatesOf = (
  file: { path: string; lines: ReadonlyArray<string> },
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<Candidate> => {
  const candidates: Array<Candidate> = [];
  for (const each of detectors) {
    if (wanted !== undefined && !wanted.has(each.topic)) continue;
    for (const finding of each.scan(file)) {
      candidates.push({
        topic: each.topic,
        rule: finding.rule,
        file: file.path,
        line: finding.line,
        column: finding.column,
        message: finding.message,
        help: finding.help,
        snippet: finding.snippet,
        excerpt: excerptOf(file.lines, finding.line - 1),
      });
    }
  }
  return candidates;
};

/** Cache of one audit's topic patterns, so each topic is fetched once. */
class PatternCache {
  private readonly shown = new Map<string, string>();

  constructor(private readonly patterns: typeof TopicPatterns.Service) { }

  /** One topic's pattern, remembered after its first fetch. */
  readonly pattern = (topic: string) => {
    const cached = this.shown.get(topic);
    if (cached !== undefined) return Effect.succeed(cached);
    return this.patterns
      .pattern(topic)
      .pipe(
        Effect.tap((pattern) =>
          Effect.sync(() => this.shown.set(topic, pattern)),
        ),
      );
  };
}

/** Topics this run must have judged before a file can be skipped. */
const requestedTopics = (
  wanted: ReadonlySet<string> | undefined,
): ReadonlyArray<string> =>
  wanted === undefined ? [...detectorTopics()].sort() : [...wanted].sort();

/** One file's split between cached verdicts and candidates still to judge. */
interface FilePlan {
  readonly path: string;
  readonly hash: string;
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
  file: ScannedFile,
  hash: string,
  entry: CacheEntry | undefined,
  wanted: ReadonlySet<string> | undefined,
): FilePlan => {
  const requested = requestedTopics(wanted);
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
  return {
    path: file.path,
    hash,
    pending: missing.length === 0 ? [] : candidatesOf(file, missingTopics),
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

/** Judge every candidate against its topic's documented pattern. */
export const runAudit = (
  options: AuditOptions = {},
): Effect.Effect<
  AuditResult,
  AuditError | JevUnavailable,
  | AuditCache
  | Crypto.Crypto
  | EffectSolutions
  | SourceWalker
  | JevJudge
  | TopicPatterns
> =>
  Effect.gen(function* () {
    const solutions = yield* EffectSolutions;
    const walker = yield* SourceWalker;
    const judge = yield* JevJudge;
    const patterns = yield* TopicPatterns;
    const store = yield* AuditCache;
    const topics = yield* solutions.topics;
    const files = yield* walker.files;
    const threshold = options.threshold ?? 0.5;

    const wanted =
      options.topics !== undefined && options.topics.length > 0
        ? new Set(options.topics)
        : undefined;
    const planHashed = (file: ScannedFile) =>
      Effect.map(contentHash(file.lines), (hash) =>
        planFile(file, hash, store.get(file.path), wanted),
      );
    const plans = yield* Effect.forEach(files, planHashed);
    const patternsCache = new PatternCache(patterns);

    /** One candidate's verdict: its topic's pattern, then Jev's judgment. */
    const verdictOf = (candidate: Candidate) =>
      Effect.flatMap(patternsCache.pattern(candidate.topic), (pattern) =>
        judge.judge(candidate, pattern),
      );

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
        verdicts: [...plan.retained, ...(byFile.get(plan.path) ?? [])],
      });
    yield* Effect.forEach(plans, remember);
    yield* store.save;

    const considered = plans.flatMap((plan) => [
      ...plan.reported,
      ...(byFile.get(plan.path) ?? []),
    ]);
    return {
      topics,
      filesScanned: files.length,
      candidates: considered.length,
      cachedFiles: plans.filter((plan) => plan.cached).length,
      violations: considered.filter((verdict) => verdict.violates > threshold),
    };
  });

export { type RenderOptions, render } from "#workflows/format.ts";
