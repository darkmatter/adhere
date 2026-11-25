import { ConfigUnavailable, type ReadState, type RuleId, typeOf } from "#config.ts";
import type { Range } from "#excerpt.ts";
import { globalRuleSet } from "#rules.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import type { Judgment } from "#services/AuditCache.ts";
import { CHOICE_LIMIT, fits, Jev, tokensOf } from "#services/Jev.ts";
import {
  type Blocked,
  excerptOf,
  type Finding,
  findingsOf,
  type PreparedRule,
} from "#workflows/audit.ts";
import { Effect, Path, Record } from "effect";

/**
 * Judging a transcript, such as a coding agent's turn, against the rules
 * whose `type` is `transcript`. A transcript has no walk, cache, comments to
 * strip, or suppressions, so it shares only Jev's requests and the findings
 * with the file audit. docs/decisions.md says why it is judged in windows.
 */

/** What a check found in the windows it judged, and the windows Jev could not judge. */
export interface TranscriptResult {
  readonly windows: number;
  readonly judged: number;
  /** Windows too long for Jev's context, even without the text before them. */
  readonly skipped: number;
  /** Windows the firewall in front of Jev's API refused, each by its lines. */
  readonly blocked: ReadonlyArray<Blocked>;
  readonly findings: ReadonlyArray<Finding>;
}

/** The name a transcript's findings give in place of a file's path. */
export const TRANSCRIPT = "transcript";

/** A transcript's lines: none for blank text, and no empty line after a final newline. */
export const linesOf = (text: string): ReadonlyArray<string> =>
  text.trim() === "" ? [] : (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");

/**
 * The lines from `from` on, in windows of at most `every` tokens by the
 * estimate that sizes Jev's requests, and at most `CHOICE_LIMIT` lines with
 * text: Jev places a finding by a choice among a section's lines, and a
 * transcript the code splitter cannot read is one section. A window always
 * holds one line, so a line longer than `every` is a window of its own. A
 * window with text after it ends at its last blank line past its middle,
 * when it has one, so a paragraph or a tool's output stays whole. Each
 * window but the last is full.
 */
export const windowsOf = (
  lines: ReadonlyArray<string>,
  every: number,
  from = 1,
): ReadonlyArray<Range> => {
  const windows: Array<Range> = [];
  let first = from;
  while (first <= lines.length) {
    let size = 0;
    let filled = 0;
    let last = first - 1;
    let blank: number | undefined;
    while (last < lines.length) {
      const line = lines[last] ?? "";
      const cost = tokensOf(line);
      const empty = line.trim() === "";
      if (last >= first && (size + cost > every || (!empty && filled === CHOICE_LIMIT))) break;
      size += cost;
      if (!empty) filled += 1;
      last += 1;
      if (empty && (size > every / 2 || filled > CHOICE_LIMIT / 2)) blank = last;
    }
    const end = last < lines.length && blank !== undefined ? blank : last;
    windows.push({ first, last: end });
    first = end + 1;
  }
  return windows;
};

/** The whole lines right before line `first`, at most `budget` tokens of them. */
const earlierOf = (lines: ReadonlyArray<string>, first: number, budget: number): string => {
  let start = first - 1;
  let size = 0;
  while (start > 0) {
    const cost = tokensOf(lines[start - 1]);
    if (size + cost > budget) break;
    size += cost;
    start -= 1;
  }
  return lines.slice(start, first - 1).join("\n");
};

const shifted = (range: Range, by: number): Range => ({
  first: range.first + by,
  last: range.last + by,
});

interface WindowResult {
  readonly status: "judged" | "skipped" | "blocked";
  readonly findings: ReadonlyArray<Finding>;
  readonly blocked?: Blocked;
}

const skipped: WindowResult = { status: "skipped", findings: [] };

/**
 * Judges the `windows` of a transcript's `lines` against the config's
 * transcript rules. Jev reads each window with up to half a window of the
 * text before it, and `prompt`, the user's request the transcript answers, as
 * context; when those do not fit beside it, without them. A finding's lines
 * count from the transcript's first line.
 */
export const judgeTranscript = Effect.fn("transcript.judge")(function* (
  lines: ReadonlyArray<string>,
  windows: ReadonlyArray<Range>,
  prompt?: string,
) {
  const config = yield* AdhereConfig;
  const jev = yield* Jev;
  const path = yield* Path.Path;
  const entries = config.scopedRules ?? globalRuleSet(config.rules, path.resolve());
  const prepared: Readonly<Record<RuleId, PreparedRule>> = Object.fromEntries(
    entries
      .filter(({ rule }) => typeOf(rule) === "transcript")
      .map(({ id, rule, preset }): [RuleId, PreparedRule] => [
        id,
        {
          rule,
          fingerprint: "",
          threshold: rule.threshold ?? config.threshold,
          ...(preset === undefined ? {} : { preset }),
        },
      ]),
  );
  if (Record.isEmptyReadonlyRecord(prepared)) {
    return yield* ConfigUnavailable.make({
      message: "No transcript rules to check: a rule is one when it says `type: transcript`.",
    });
  }
  const rules = Record.map(prepared, ({ rule }) => rule);

  const judgeWindow = (window: Range) =>
    Effect.gen(function* () {
      const text = lines.slice(window.first - 1, window.last);
      const earlier = earlierOf(lines, window.first, config.transcript.every / 2);
      const context: ReadState = {
        ...(prompt === undefined || prompt.trim() === "" ? {} : { userPrompt: prompt }),
        ...(earlier.trim() === "" ? {} : { earlierTranscript: earlier }),
      };
      const readState = fits(text, rules, context) ? context : {};
      if (!fits(text, rules, readState)) {
        yield* Effect.logDebug(`transcript lines ${window.first}–${window.last}: too long for Jev`);
        return skipped;
      }
      const file = { path: TRANSCRIPT, contents: text.join("\n") };
      const { probabilities } = yield* jev.judge(text, rules, [], file, readState);
      const flagged = Record.filter(prepared, (k, id) => (probabilities[id] ?? 0) > k.threshold);
      const places = Record.isEmptyReadonlyRecord(flagged)
        ? {}
        : yield* jev.locate(
            text,
            Record.map(flagged, ({ rule }) => rule),
            file,
            readState,
          );
      const by = window.first - 1;
      // With no section from Jev, a rule it judged broken points at the whole window.
      const located = Record.map(flagged, (_, id): Judgment => ({
        fingerprint: "",
        probability: probabilities[id] ?? 0,
        section: places[id] === undefined ? window : shifted(places[id].section, by),
        ...(places[id]?.lines === undefined ? {} : { lines: shifted(places[id].lines, by) }),
        ...(places[id] === undefined ? {} : { sufficiency: places[id].sufficiency }),
      }));
      // A transcript can be one section, so a finding shows the lines Jev named in it.
      const findings = findingsOf(TRANSCRIPT, prepared, located, lines).map((finding) =>
        finding.lines === undefined
          ? finding
          : { ...finding, excerpt: excerptOf(lines, finding.lines) },
      );
      return { status: "judged", findings } satisfies WindowResult;
    }).pipe(
      Effect.catchTag("JevOverflow", () => Effect.succeed(skipped)),
      Effect.catchTag("JevBlocked", ({ ray }) =>
        Effect.succeed({
          status: "blocked",
          findings: [],
          blocked: { file: `${TRANSCRIPT}:${window.first}–${window.last}`, ray },
        } satisfies WindowResult),
      ),
    );

  const results = yield* Effect.forEach(windows, judgeWindow, { concurrency: 8 });
  return {
    windows: windows.length,
    judged: results.filter(({ status }) => status === "judged").length,
    skipped: results.filter(({ status }) => status === "skipped").length,
    blocked: results.flatMap(({ blocked }) => (blocked === undefined ? [] : [blocked])),
    findings: results.flatMap(({ findings }) => findings),
  } satisfies TranscriptResult;
});
