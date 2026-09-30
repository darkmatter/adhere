import { DEFAULT_SUFFICIENCY_THRESHOLD, DEFAULT_THRESHOLD } from "#config.ts";
import { type Kind, tokenize } from "#highlight.ts";
import { shownId } from "#rules.ts";
import type { AuditPlan, AuditResult, FileDone, Finding } from "#workflows/audit.ts";

/**
 * The report as data: lines of spans, each span a part of the frame or a
 * token of code, named by its role. Layout measures text; only `serialize`
 * turns a role into color, so no width or blank line ever sees an escape code.
 */
type Role =
  | "error"
  | "warning"
  | "probability"
  | "low"
  | "below"
  | "description"
  | "path"
  | "lineNumber"
  | "underline"
  | "label"
  | "legend"
  | Kind;

interface Span {
  readonly text: string;
  readonly role?: Role;
}

type Line = ReadonlyArray<Span>;

/**
 * SGR parameters per role. The frame's are set colors, from the 256-color
 * palette (`38;5;N`) or truecolor (`38;2;R;G;B`), bold with a trailing `;1`,
 * and a dim line number. Of the header, only the `×` and the rule are red, or
 * a warning's `⚠` and rule amber, since a whole line of red is hard to read:
 * a score is an accent, or amber when it is low, and the description a cool
 * near-white, set here since a theme's own white can be gray. The legend's
 * words are bold in the terminal's own color, so they do not read as the
 * hint's label. The code's are the terminal's own colors (`3N`), so the
 * user's theme picks shades that read on its background; none is magenta,
 * which would run into the underline.
 */
const THEME: Readonly<Record<Role, string>> = {
  error: "38;2;164;20;71;1",
  warning: "38;2;214;154;0;1",
  probability: "38;5;156",
  low: "38;2;214;154;0",
  below: "38;2;164;20;71",
  description: "38;2;230;230;255",
  path: "38;2;5;125;160;1",
  lineNumber: "2",
  underline: "38;2;255;0;175",
  label: "38;2;242;205;205",
  legend: "1",
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

/** A score as a header shows it, in hundredths, so two compare as they read. */
const hundredths = (value: number): number => Math.round(value * 100);

/**
 * Where a confidence stops being far below a threshold and where it starts
 * being well above it, in hundredths. Between the two it is near the
 * threshold: within a quarter of the room above it, on either side, so the
 * band narrows as the threshold rises and leaves room above for scores to be
 * well clear of it. Scores that gather in the band, reported or not, turn on
 * where the threshold sits, a sign it may be too low or too high.
 */
const bandsOf = (threshold: number): { readonly near: number; readonly clear: number } => {
  const at = hundredths(threshold);
  const margin = (100 - at) / 4;
  return { near: Math.max(0, Math.ceil(at - margin)), clear: Math.ceil(at + margin) };
};

const score = (value: number, low: boolean): Span =>
  span(value.toFixed(2), low ? "low" : "probability");

/**
 * A confidence in one of three ranges set by the rule's threshold: amber
 * near it; red below that, which only a run that shows every judgment
 * prints; the accent above.
 */
const confidence = (finding: Finding): Span => {
  const { near, clear } = bandsOf(finding.threshold);
  const value = hundredths(finding.probability);
  return span(
    finding.probability.toFixed(2),
    value < near ? "below" : value < clear ? "low" : "probability",
  );
};

const lacksContext = (finding: Finding, sufficiencyThreshold: number): boolean =>
  finding.context !== undefined && finding.context < sufficiencyThreshold;

/**
 * The rule, then its scores, where they stay in one place whatever the
 * description's length; the description has the next line to itself.
 */
const header = (finding: Finding, sufficiencyThreshold: number): ReadonlyArray<Line> => [
  [
    span("  "),
    span(finding.level === "warning" ? "⚠" : "×", finding.level),
    span(" "),
    span(shownId({ id: finding.rule, preset: finding.preset }), finding.level),
    span("  confidence "),
    confidence(finding),
    ...(finding.context === undefined
      ? []
      : [span(" · context "), score(finding.context, lacksContext(finding, sufficiencyThreshold))]),
  ],
  [span("    "), span(finding.description, "description")],
];

/**
 * The path at the lines Jev points at, or the section's first line when it
 * named none, then the section with each line numbered in the gutter. One
 * line Jev points at is underlined under its code; several are marked by a
 * bar in a column of their own beside the code, as `vp lint` marks a span,
 * so each line of code keeps one line of the report.
 */
const excerpt = (finding: Finding, root: string | undefined): ReadonlyArray<Line> => {
  const { start, lines } = finding.excerpt;
  const width = String(start + lines.length - 1).length;
  const gutter = span(" ".repeat(width + 2));
  const indentOf = (line: string) => line.slice(0, line.length - line.trimStart().length);
  const pointed = finding.lines;
  const at = pointed?.first ?? start;
  const location = `:${at}:${indentOf(lines[at - start] ?? "").length + 1}]`;
  const spanning = pointed !== undefined && pointed.last > pointed.first;
  const inside = (line: number) =>
    pointed !== undefined && pointed.first <= line && line <= pointed.last;
  return [
    [gutter, span("╭─["), span(displayPath(finding.file, root), "path"), span(location)],
    ...highlighted(lines.join("\n")).flatMap((code, index): ReadonlyArray<Line> => {
      const number = String(start + index);
      const marker = spanning ? [inside(start + index) ? span("┃ ", "underline") : span("  ")] : [];
      const numbered = [
        span(" ".repeat(width - number.length + 1)),
        span(number, "lineNumber"),
        span(" │ "),
        ...marker,
        ...code,
      ];
      const text = lines[index] ?? "";
      // The line's own indentation, tabs and all, lines the underline up under its code.
      return !spanning && inside(start + index) && text.trim() !== ""
        ? [
            numbered,
            [
              gutter,
              span("· "),
              span(indentOf(text)),
              span("─".repeat(text.trim().length), "underline"),
            ],
          ]
        : [numbered];
    }),
    [gutter, span("╰────")],
  ];
};

/**
 * The warning on a finding whose file may not show enough to check its rule,
 * which its context score in the header says how far, and help: how to add
 * what the code relies on as a note Jev reads, in the form the README asks for.
 */
const insufficient = (finding: Finding, sufficiencyThreshold: number): ReadonlyArray<Line> =>
  !lacksContext(finding, sufficiencyThreshold)
    ? []
    : [
        [span("  warning: ", "warning"), span("this file may not show enough to check this rule")],
        ...hanging(span("     help: ", "label"), [
          [span("add what the code relies on outside this file as a note Jev reads:")],
          highlighted("// @adhere <the fact>, and how you know it")[0] ?? [],
        ]),
      ];

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
 * the rule in red and its scores, the description, the section of the file
 * Jev points at with the lines it names in pink, a warning when the file may
 * not show enough to decide, and the code to write as the hint.
 */
const frame = (
  finding: Finding,
  root: string | undefined,
  sufficiencyThreshold: number,
): ReadonlyArray<Line> => [
  ...header(finding, sufficiencyThreshold),
  ...excerpt(finding, root),
  ...insufficient(finding, sufficiencyThreshold),
  ...hint(finding),
];

/** Scores from one number of hundredths through another, as a header shows them: `0.75–0.84`. */
const range = (from: number, to: number): string =>
  `${(from / 100).toFixed(2)}–${(to / 100).toFixed(2)}`;

/**
 * What the scores in a header mean, once under the findings, and the ranges
 * a score falls in, lowest first, each in the color a score in it has:
 * confidence far below the threshold, near it, and well above it; then
 * context that is low, and that is enough. The ranges are the run's
 * threshold's; a rule with a threshold of its own has them around that. A
 * range with no score in it, as the one below a threshold of 0, is left out.
 */
const legend = (
  result: AuditResult,
  threshold: number,
  sufficiencyThreshold: number,
): ReadonlyArray<Line> => {
  const { near, clear } = bandsOf(threshold);
  const enough = hundredths(sufficiencyThreshold);
  const ranges = (
    [
      [0, near - 1, "below"],
      [near, clear - 1, "low"],
      [clear, 100, "probability"],
    ] as const
  ).filter(([from, to]) => from <= to);
  return result.findings.length === 0
    ? []
    : [
        [
          span("confidence", "legend"),
          span(": Jev's probability that the file breaks the rule: "),
          ...ranges.flatMap(([from, to, role], index) => [
            ...(index === 0 ? [] : [span(", ")]),
            span(range(from, to), role),
          ]),
        ],
        [
          span("context", "legend"),
          span(": its probability that the file shows enough to decide: "),
          span(range(0, enough - 1), "low"),
          span(", "),
          span(range(enough, 100), "probability"),
        ],
        [],
      ];
};

/** The findings counted by level: `1 error`, or `2 errors and 1 warning` once there are warnings. */
const found = (findings: ReadonlyArray<Finding>): string => {
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const errors = counted(findings.length - warnings, "error", "errors");
  return warnings === 0 ? errors : `${errors} and ${counted(warnings, "warning", "warnings")}`;
};

const summary = (result: AuditResult): ReadonlyArray<Line> => {
  const counts = [
    counted(result.files, "file", "files"),
    `${result.judged} judged`,
    `${result.cached} cached`,
    ...(result.skipped > 0 ? [`${result.skipped} skipped`] : []),
    ...(result.waiting > 0 ? [`${result.waiting} waiting`] : []),
    ...(result.blocked.length > 0 ? [`${result.blocked.length} blocked`] : []),
    ...(result.suppressed > 0 ? [`${result.suppressed} suppressed`] : []),
  ];
  return [[span(`Found ${found(result.findings)}.`)], [span(`${counts.join(", ")}.`)]];
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
  /** The run's threshold, for the legend: lint reports no finding at or below it. Defaults to 0.8. */
  readonly threshold?: number;
  /** Below this, a finding's context is low and it carries a warning. Defaults to 0.6. */
  readonly sufficiencyThreshold?: number;
}

/**
 * The report, in the default `vp lint` layout: each diagnostic followed by a
 * blank line, then the legend for their scores, then the counts. Color is on
 * when the caller is writing to a terminal.
 */
export const render = (result: AuditResult, options: RenderOptions = {}): ReadonlyArray<string> => {
  const sufficiencyThreshold = options.sufficiencyThreshold ?? DEFAULT_SUFFICIENCY_THRESHOLD;
  return [
    ...result.findings.flatMap((finding) => [
      ...frame(finding, options.root, sufficiencyThreshold),
      [],
    ]),
    ...legend(result, options.threshold ?? DEFAULT_THRESHOLD, sufficiencyThreshold),
    ...summary(result),
    ...blockedFiles(result, options.root),
  ].map((line) => serialize(line, options.color === true));
};

/**
 * What a run will do, before it asks: the files and rules found, the checks
 * between them and how many the cache answers, then what judging the rest
 * takes.
 */
/** What a run was asked to keep to, for the plan to say. */
export interface RunLimits {
  readonly filter?: ReadonlyArray<string>;
  readonly rpm?: number | undefined;
}

/** About how long `requests` take at `rpm`: seconds under a minute, minutes past it. */
const durationAt = (requests: number, rpm: number): string => {
  const seconds = Math.ceil((requests / rpm) * 60);
  return seconds < 60
    ? counted(seconds, "second", "seconds")
    : counted(Math.round(seconds / 60), "minute", "minutes");
};

/** A number to one decimal place, without a trailing .0: 3.2, 43. */
const tenths = (n: number): string => Number(n.toFixed(1)).toLocaleString("en-US");

/** A token count as the plan says it: 612, 41,000, 3.2 million, 43 million, 1.1 billion. */
const tokensSaid = (tokens: number): string =>
  tokens >= 1e9
    ? `${tenths(tokens / 1e9)} billion`
    : tokens >= 1e6
      ? `${tenths(tokens / 1e6)} million`
      : tokens >= 1e3
        ? (Math.round(tokens / 1e3) * 1e3).toLocaleString("en-US")
        : tokens.toLocaleString("en-US");

/** An estimated cost as the plan says it: under $0.01, about $0.14, about $1,234. */
const dollars = (amount: number): string =>
  amount < 0.01
    ? "under $0.01"
    : amount < 100
      ? `about $${amount.toFixed(2)}`
      : `about $${Math.round(amount).toLocaleString("en-US")}`;

/** What judging the plan costs at the model's price, when adhere knows it. */
const costOf = (plan: AuditPlan): number | undefined =>
  plan.price === undefined ? undefined : (plan.tokens / 1e6) * plan.price;

/** The plan's input tokens and their cost; locating findings comes on top, since it depends on the findings. */
const costLine = (plan: AuditPlan): string => {
  const cost = costOf(plan);
  const priced =
    cost === undefined || plan.price === undefined
      ? ""
      : `: ${dollars(cost)} at $${plan.price} per million`;
  return `Those carry about ${tokensSaid(plan.tokens)} input tokens${priced}, and more for locating findings.`;
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
    ...(plan.tokens > 0 ? [costLine(plan)] : []),
  ];
};

/** The question before a run sends anything. */
export const sendQuestion = (plan: AuditPlan): string => {
  const cost = costOf(plan);
  const priced = cost === undefined || plan.tokens === 0 ? "" : `, ${dollars(cost)}`;
  return `Send ${counted(plan.requests, "request", "requests")} to Jev${priced}?`;
};

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
