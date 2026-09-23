import { type Kind, tokenize } from "#highlight.ts";
import type { AuditPlan, AuditResult, FileDone, Finding } from "#workflows/audit.ts";

/**
 * The report as data: lines of spans, each span a part of the frame or a
 * token of code, named by its role. Layout measures text; only `serialize`
 * turns a role into color, so no width or blank line ever sees an escape code.
 */
type Role =
  | "error"
  | "probability"
  | "description"
  | "path"
  | "lineNumber"
  | "underline"
  | "label"
  | Kind;

interface Span {
  readonly text: string;
  readonly role?: Role;
}

type Line = ReadonlyArray<Span>;

/**
 * SGR parameters per role. The frame's are set colors, from the 256-color
 * palette (`38;5;N`) or truecolor (`38;2;R;G;B`), bold with a trailing `;1`,
 * and a dim line number. Of the header, only the `×` and the rule are red,
 * since a whole line of red is hard to read: the probability is an accent, and
 * the description a soft white. The code's are the terminal's own colors
 * (`3N`), so the user's theme picks shades that read on its background; none
 * is magenta, which would run into the label.
 */
const THEME: Readonly<Record<Role, string>> = {
  error: "38;5;197;1",
  probability: "38;2;250;179;135",
  description: "38;2;242;205;205",
  path: "38;2;5;125;160;1",
  lineNumber: "2",
  underline: "38;2;255;0;175",
  label: "38;5;212",
  comment: "2",
  string: "32",
  constant: "33",
  keyword: "34",
  type: "36",
};

const span = (text: string, role?: Role): Span => (role === undefined ? { text } : { text, role });

const isBlank = (line: Line): boolean => line.every((part) => part.text.trim().length === 0);

/** A line as text, colored by role on a terminal. Whitespace has no color to show. */
const serialize = (line: Line, color: boolean): string =>
  line
    .map(({ text, role }) =>
      color && role !== undefined && text.trim().length > 0
        ? `\u001b[${THEME[role]}m${text}\u001b[0m`
        : text,
    )
    .join("");

/** The label, then the first line; the other lines indented to line up under it. */
const hanging = (label: Span, lines: ReadonlyArray<Line>): ReadonlyArray<Line> => {
  const [first = [], ...rest] = lines;
  const indent = span(" ".repeat(label.text.length));
  return [[label, ...first], ...rest.map((line) => (isBlank(line) ? [] : [indent, ...line]))];
};

/** Code as lines of spans, each token in the role of its kind. */
const highlighted = (code: string): ReadonlyArray<Line> =>
  tokenize(code).map((tokens) => tokens.map(({ text, kind }) => span(text, kind)));

/** Code as highlighted lines, without the blank lines at either end. */
const codeLines = (code: string): ReadonlyArray<Line> => {
  const lines = highlighted(code);
  const first = lines.findIndex((line) => !isBlank(line));
  const last = lines.findLastIndex((line) => !isBlank(line));
  return first < 0 ? [] : lines.slice(first, last + 1);
};

const displayPath = (file: string, root: string | undefined): string =>
  root !== undefined && file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;

const counted = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

const header = (finding: Finding): Line => [
  span("  "),
  span("×", "error"),
  span(" "),
  span(finding.rule, "error"),
  span(" ("),
  span(finding.probability.toFixed(2), "probability"),
  span("): "),
  span(finding.description, "description"),
];

/** The path, the offending line numbered in the gutter, and an underline as long as the line. */
const excerpt = (finding: Finding, root: string | undefined): ReadonlyArray<Line> => {
  const number = String(finding.line);
  const gutter = span(" ".repeat(number.length + 2));
  // A snippet is one line: `snippetOf` trims it out of the file.
  const [code = []] = highlighted(finding.snippet);
  const underline = "─".repeat(Math.max(1, finding.snippet.trim().length));
  return [
    [gutter, span("╭─["), span(displayPath(finding.file, root), "path"), span(`:${number}:1]`)],
    [span(" "), span(number, "lineNumber"), span(" │ "), ...code],
    [gutter, span("· "), span(underline, "underline")],
    [gutter, span("╰────")],
  ];
};

/**
 * The code to write as the hint. A rule with only code not to write shows
 * that instead, labeled with its word: `never`, or `should not`.
 */
const hint = (finding: Finding): ReadonlyArray<Line> => {
  const { good, bad } = finding.examples;
  const [label, code] =
    good === undefined ? [bad?.word ?? "hint", bad?.code ?? ""] : ["hint", good.code];
  return hanging(span(`  ${label}: `, "label"), codeLines(code));
};

/**
 * One diagnostic, in the frame `vp lint` prints on a terminal: a header with
 * the rule in red, the offending line, a pink underline, and the code to write
 * as the hint.
 */
const frame = (finding: Finding, root: string | undefined): ReadonlyArray<Line> => [
  header(finding),
  ...excerpt(finding, root),
  ...hint(finding),
];

const summary = (result: AuditResult): ReadonlyArray<Line> => {
  const counts = [
    counted(result.files, "file", "files"),
    `${result.judged} judged`,
    `${result.cached} cached`,
    ...(result.skipped > 0 ? [`${result.skipped} skipped`] : []),
    ...(result.waiting > 0 ? [`${result.waiting} waiting`] : []),
    ...(result.blocked.length > 0 ? [`${result.blocked.length} blocked`] : []),
  ];
  return [
    [span(`Found ${counted(result.findings.length, "error", "errors")}.`)],
    [span(`${counts.join(", ")}.`)],
  ];
};

/**
 * The files the firewall in front of Jev's API refused, each with the Ray ID
 * TypeSafe AI can look the block up by, so a gap in the audit says where it is.
 */
const blockedFiles = (result: AuditResult, root: string | undefined): ReadonlyArray<Line> =>
  result.blocked.length === 0
    ? []
    : [
        [],
        [
          span(
            `The firewall in front of Jev's API blocked ${counted(result.blocked.length, "file", "files")}, so ${result.blocked.length === 1 ? "it is" : "they are"} not judged in full. TypeSafe AI can look each block up by its Ray ID:`,
          ),
        ],
        ...result.blocked.map(({ file, ray }) => [
          span("  "),
          span(displayPath(file, root), "path"),
          span(` (Ray ID ${ray})`),
        ]),
      ];

export interface RenderOptions {
  /** Color the frame the way `vp lint` does on a terminal, and highlight the code. */
  readonly color?: boolean;
  readonly root?: string;
}

/**
 * The report, in the default `vp lint` layout: each diagnostic followed by a
 * blank line, then the counts. Color is on when the caller is writing to a
 * terminal.
 */
export const render = (result: AuditResult, options: RenderOptions = {}): ReadonlyArray<string> =>
  [
    ...result.findings.flatMap((finding) => [...frame(finding, options.root), []]),
    ...summary(result),
    ...blockedFiles(result, options.root),
  ].map((line) => serialize(line, options.color === true));

/**
 * What a run will do, before it asks: the files and rules found, the checks
 * between them and how many the cache answers, then what judging the rest
 * takes.
 */
/** What a run was asked to keep to, for the plan to say. */
export interface RunLimits {
  readonly filter?: ReadonlyArray<string>;
  readonly rpm?: number;
}

/** About how long `requests` take at `rpm`: seconds under a minute, minutes past it. */
const durationAt = (requests: number, rpm: number): string => {
  const seconds = Math.ceil((requests / rpm) * 60);
  return seconds < 60
    ? counted(seconds, "second", "seconds")
    : counted(Math.round(seconds / 60), "minute", "minutes");
};

export const describePlan = (plan: AuditPlan, limits: RunLimits = {}): ReadonlyArray<string> => {
  const cached = plan.cached > 0 ? `, ${plan.cached} cached` : "";
  const skipped =
    plan.skipped > 0 ? `, ${counted(plan.skipped, "file", "files")} too long to judge` : "";
  const matching = (limits.filter?.length ?? 0) > 0 ? " matching the filter" : "";
  const found = `${counted(plan.files.length, "file", "files")}${matching} and ${counted(plan.rules, "rule", "rules")}: ${counted(plan.checks, "check", "checks")}${cached}${skipped}.`;
  const pending = plan.checks - plan.cached;
  const waiting =
    plan.deferred > 0
      ? ` The other ${plan.deferred} ${plan.deferred === 1 ? "waits" : "wait"} for a later run.`
      : "";
  if (plan.requests === 0) {
    const none =
      plan.deferred > 0
        ? plan.deferred === 1
          ? "The limit leaves the 1 unjudged check for a later run."
          : `The limit leaves all ${plan.deferred} unjudged checks for a later run.`
        : plan.checks === 0
          ? "Nothing to judge."
          : "The cache answers every check.";
    return [found, none];
  }
  const judging = pending - plan.deferred;
  const rest =
    plan.deferred > 0
      ? `${judging} of ${plan.cached > 0 ? `the other ${pending}` : "them"}`
      : plan.cached > 0
        ? `the other ${pending}`
        : "them";
  const pace =
    limits.rpm === undefined
      ? ""
      : ` At ${limits.rpm} a minute, they take about ${durationAt(plan.requests, limits.rpm)}.`;
  return [
    found,
    `Judging ${rest} takes ${counted(plan.requests, "request", "requests")} to Jev, plus 1 or more for each file with a finding.${pace}${waiting}`,
  ];
};

/** The question before a run sends anything. */
export const sendQuestion = (plan: AuditPlan): string =>
  `Send ${counted(plan.requests, "request", "requests")} to Jev?`;

/** A run's progress so far: every file it finished, with the requests and findings they added up to. */
export interface Progress {
  readonly files: number;
  readonly requests: number;
  readonly findings: number;
}

export const progressAfter = (progress: Progress, done: FileDone): Progress => ({
  files: progress.files + 1,
  requests: progress.requests + done.requests,
  findings: progress.findings + done.findings,
});

/** The counter a run redraws as files finish. */
export const progressLine = (progress: Progress, plan: AuditPlan): string =>
  `${progress.files}/${plan.files.length} files, ${counted(progress.requests, "request", "requests")} sent, ${counted(progress.findings, "finding", "findings")}`;
