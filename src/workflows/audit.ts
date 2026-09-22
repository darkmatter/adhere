import type { Rule, RuleId } from "#config.ts";
import type { ScannedFile, WalkUnavailable } from "#models/Audit.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { AuditCache, type Judgment, sha256 } from "#services/AuditCache.ts";
import { Jev, type JevUnavailable, MAX_LINES, snippetOf } from "#services/Jev.ts";
import { SourceWalker } from "#services/SourceWalker.ts";
import { type Crypto, Effect, Record } from "effect";

export interface Finding {
  readonly rule: RuleId;
  readonly description: string;
  readonly reference: string;
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

export const runAudit: Effect.Effect<
  AuditResult,
  WalkUnavailable | JevUnavailable,
  AdhereConfig | AuditCache | Crypto.Crypto | Jev | SourceWalker
> = Effect.gen(function* () {
  const config = yield* AdhereConfig;
  const jev = yield* Jev;
  const cache = yield* AuditCache;
  const files = yield* (yield* SourceWalker).files;

  const prepared: Record<RuleId, PreparedRule> = yield* Effect.forEach(
    Object.entries(config.rules),
    ([id, rule]) =>
      Effect.map(
        sha256(config.model + rule.description + rule.reference),
        (fingerprint) =>
          [
            id,
            { rule, fingerprint, threshold: rule.threshold ?? config.threshold },
          ] as const,
      ),
  ).pipe(Effect.map(Record.fromEntries));

  const rulesOf = (some: Readonly<Record<RuleId, PreparedRule>>) =>
    Record.map(some, (k) => k.rule);

  const auditFile = Effect.fn("audit.file")(function* (file: ScannedFile) {
    if (file.lines.length > MAX_LINES) return fileResult("skipped", []);
    const hash = yield* sha256(file.lines.join("\n"));
    const entry = yield* cache.get(file.path);
    const remembered = entry?.hash === hash ? entry.judgments : {};
    const kept = Record.filter(
      remembered,
      (judgment, id) => judgment.fingerprint === prepared[id]?.fingerprint,
    );
    const pending = Record.filter(prepared, (_, id) => kept[id] === undefined);

    const probabilities = isEmpty(pending)
      ? {}
      : yield* jev.judge(file.lines, rulesOf(pending));
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
      : yield* jev.locate(file.lines, rulesOf(flagged));
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
                file: file.path,
                line: judgment.line,
                snippet: judgment.snippet ?? "",
                probability: judgment.probability,
              },
            ]
          : [];
      })
      .sort((a, b) => a.line - b.line);
    return fileResult(cached ? "cached" : "judged", findings);
  });

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const results = yield* Effect.forEach(sorted, auditFile, { concurrency: 8 });
  const count = (status: FileResult["status"]) =>
    results.filter((result) => result.status === status).length;
  return {
    files: sorted.length,
    judged: count("judged"),
    cached: count("cached"),
    skipped: count("skipped"),
    findings: results.flatMap((result) => result.findings),
  };
});

export { type RenderOptions, render } from "#workflows/format.ts";
