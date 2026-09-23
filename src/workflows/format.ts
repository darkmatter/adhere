import type { AuditResult, Finding } from "#workflows/audit.ts";

/**
 * The report as data: lines of spans, each span a part of the frame named by
 * its role. Layout measures text; only `serialize` turns a role into color, so
 * no width or blank line ever sees an escape code.
 */
type Role = "error" | "path" | "lineNumber" | "underline" | "label";

interface Span {
  readonly text: string;
  readonly role?: Role;
}

type Line = ReadonlyArray<Span>;

/**
 * SGR parameters per role, matching `vp lint`: truecolor (`38;2;R;G;B`), bold
 * with a trailing `;1`, and a dim line number.
 */
const THEME: Readonly<Record<Role, string>> = {
  error: "38;2;219;91;81;1",
  path: "38;2;5;125;160;1",
  lineNumber: "2",
  underline: "38;2;255;0;175",
  label: "38;2;180;105;245",
};

const span = (text: string, role?: Role): Span => (role === undefined ? { text } : { text, role });

const isBlank = (line: Line): boolean => line.every((part) => part.text.trim().length === 0);

/** A line as text, colored by role on a terminal. */
const serialize = (line: Line, color: boolean): string =>
  line
    .map(({ text, role }) =>
      color && role !== undefined ? `\u001b[${THEME[role]}m${text}\u001b[0m` : text,
    )
    .join("");

/** The label, then the first line; the other lines indented to line up under it. */
const hanging = (label: Span, lines: ReadonlyArray<Line>): ReadonlyArray<Line> => {
  const [first = [], ...rest] = lines;
  const indent = span(" ".repeat(label.text.length));
  return [[label, ...first], ...rest.map((line) => (isBlank(line) ? [] : [indent, ...line]))];
};

/** Code as lines, without the blank lines at either end. */
const codeLines = (code: string): ReadonlyArray<Line> => {
  const lines = code.split("\n").map((line) => [span(line)]);
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
  span(`${finding.rule} (${finding.probability.toFixed(2)})`, "error"),
  span(": "),
  span(finding.description, "error"),
];

/** The path, the offending line numbered in the gutter, and an underline as long as the line. */
const excerpt = (finding: Finding, root: string | undefined): ReadonlyArray<Line> => {
  const number = String(finding.line);
  const gutter = span(" ".repeat(number.length + 2));
  const underline = "─".repeat(Math.max(1, finding.snippet.trim().length));
  return [
    [gutter, span("╭─["), span(displayPath(finding.file, root), "path"), span(`:${number}:1]`)],
    [span(" "), span(number, "lineNumber"), span(" │ "), span(finding.snippet)],
    [gutter, span("· "), span(underline, "underline")],
    [gutter, span("╰────")],
  ];
};

/** The reference as the hint. A rule without one shows its code to avoid instead, labeled so. */
const hint = (finding: Finding): ReadonlyArray<Line> => {
  const [label, code] =
    finding.reference === undefined ? ["avoid", finding.avoid ?? ""] : ["hint", finding.reference];
  return hanging(span(`  ${label}: `, "label"), codeLines(code));
};

/**
 * One diagnostic, in the frame `vp lint` prints on a terminal: a red header,
 * the offending line, a pink underline, and the reference code as the hint.
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
  ];
  return [
    [span(`Found ${counted(result.findings.length, "error", "errors")}.`)],
    [span(`${counts.join(", ")}.`)],
  ];
};

export interface RenderOptions {
  /** Color the frame the way `vp lint` does on a terminal. */
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
  ].map((line) => serialize(line, options.color === true));
