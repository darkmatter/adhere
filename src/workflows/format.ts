import type { Verdict } from "#models/Judge.ts";
import type { AuditResult } from "#workflows/audit.ts";

/** Workspace-relative path, matching the paths `vp lint` prints. */
const displayPath = (file: string): string => {
  for (const root of ["agents/", "apps/", "packages/"]) {
    const at = file.lastIndexOf(`/${root}`);
    if (at >= 0) return file.slice(at + 1);
    if (file.startsWith(root)) return file;
  }
  return file;
};

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
}

/**
 * One diagnostic, in the frame `vp lint` prints on a terminal: a red header,
 * the offending line, a pink underline, and a tinted hint line.
 */
const frame = (verdict: Verdict, color: boolean): ReadonlyArray<string> => {
  const width = String(verdict.line).length;
  const gutter = " ".repeat(width + 2);
  const column = Math.max(1, Math.round(verdict.column));
  const rule = `jev(${verdict.topic}/${verdict.rule})`;
  const digits = String(verdict.line);
  const pad = " ".repeat(width - digits.length);
  return [
    `  ${red("×", color)} ${red(rule, color)}: ${red(verdict.message, color)}`,
    `${gutter}╭─[${blue(displayPath(verdict.file), color)}:${verdict.line}:${column}]`,
    ` ${pad}${dim(digits, color)} │ ${verdict.snippet}`,
    `${gutter}· ${pink(`${" ".repeat(column - 1)}─`, color)}`,
    `${gutter}╰────`,
    `${helpTint("  hint: ", color)}${verdict.help}`,
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
  const color = options.color === true;
  const lines: Array<string> = [];
  for (const verdict of result.violations) {
    if (lines.length > 0) lines.push("");
    lines.push(...frame(verdict, color));
  }
  if (lines.length > 0) lines.push("");
  lines.push(
    `Found ${counted(result.violations.length, "error", "errors")}.`,
    `${counted(result.filesScanned, "file", "files")}, ${counted(result.candidates, "candidate", "candidates")}, ${counted(result.cachedFiles, "cached file", "cached files")}.`,
  );
  return lines;
};
