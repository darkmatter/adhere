import type { AuditResult, Finding } from "#workflows/audit.ts";

const displayPath = (file: string, root: string | undefined): string =>
  root !== undefined && file.startsWith(`${root}/`)
    ? file.slice(root.length + 1)
    : file;

const counted = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/** Foreground color. `38;5;N` is a palette index, `38;2;R;G;B` is truecolor. A trailing `;1` is bold. */
const paint = (code: string, text: string, enabled: boolean): string =>
  enabled ? `\u001b[${code}m${text}\u001b[0m` : text;

const red = (text: string, enabled: boolean) =>
  paint("38;2;219;91;81;1", text, enabled);
const blue = (text: string, enabled: boolean) =>
  paint("38;2;5;125;160;1", text, enabled);
const dim = (text: string, enabled: boolean) => paint("2", text, enabled);
const pink = (text: string, enabled: boolean) =>
  paint("38;2;255;0;175", text, enabled);
const helpTint = (text: string, enabled: boolean) =>
  paint("38;2;180;105;245", text, enabled);

export interface RenderOptions {
  /** Color the frame the way `vp lint` does on a terminal. */
  readonly color?: boolean;
  readonly root?: string;
}

const isBlank = (line: string): boolean => line.trim().length === 0;

const referenceLines = (reference: string): ReadonlyArray<string> => {
  const lines = reference.split("\n");
  const first = lines.findIndex((line) => !isBlank(line));
  if (first < 0) return [];
  let last = lines.length - 1;
  while (last > first && isBlank(lines[last] ?? "")) last--;
  return lines.slice(first, last + 1);
};

/**
 * One diagnostic, in the frame `vp lint` prints on a terminal: a red header,
 * the offending line, a pink underline, and the reference code as the hint.
 */
const frame = (finding: Finding, options: RenderOptions): ReadonlyArray<string> => {
  const color = options.color === true;
  const digits = String(finding.line);
  const gutter = " ".repeat(digits.length + 2);
  const [hint = "", ...rest] = referenceLines(finding.reference);
  const header = `${finding.rule} (${finding.probability.toFixed(2)})`;
  return [
    `  ${red("×", color)} ${red(header, color)}: ${red(finding.description, color)}`,
    `${gutter}╭─[${blue(displayPath(finding.file, options.root), color)}:${finding.line}:1]`,
    ` ${dim(digits, color)} │ ${finding.snippet}`,
    `${gutter}· ${pink("─".repeat(Math.max(1, finding.snippet.trim().length)), color)}`,
    `${gutter}╰────`,
    `${helpTint("  hint: ", color)}${hint}`,
    ...rest.map((line) => (isBlank(line) ? "" : `        ${line}`)),
  ];
};

/**
 * The report, in the default `vp lint` layout. Diagnostics are separated by
 * a blank line. Color is on when the caller is writing to a terminal.
 */
export const render = (
  result: AuditResult,
  options: RenderOptions = {},
): ReadonlyArray<string> => {
  const lines: Array<string> = [];
  for (const finding of result.findings) {
    if (lines.length > 0) lines.push("");
    lines.push(...frame(finding, options));
  }
  if (lines.length > 0) lines.push("");
  const summary = [
    counted(result.files, "file", "files"),
    `${result.judged} judged`,
    `${result.cached} cached`,
    ...(result.skipped > 0 ? [`${result.skipped} skipped`] : []),
  ];
  lines.push(
    `Found ${counted(result.findings.length, "error", "errors")}.`,
    `${summary.join(", ")}.`,
  );
  return lines;
};
