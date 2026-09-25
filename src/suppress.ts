import { type Range, statementFrom } from "#excerpt.ts";
import { scan } from "#highlight.ts";

/**
 * What a file's `adhere-ignore` comments suppress. `// adhere-ignore <rules>
 * -- <reason>` on a line of its own suppresses the rules it names in the
 * statement that starts on the next line of code, wherever in it Jev points;
 * at the end of a line of code, in the statement that starts on that line, or
 * the line alone. `// adhere-ignore-file <rules> -- <reason>` suppresses them
 * in the whole file, which they then do not judge. Rules are named as a report
 * names them, separated by commas.
 */
export interface Suppressions {
  /** Rules suppressed in the whole file. */
  readonly file: ReadonlySet<string>;
  /** Rules suppressed over the lines of one statement. */
  readonly statements: ReadonlyArray<Range & { readonly rules: ReadonlySet<string> }>;
}

export const NO_SUPPRESSIONS: Suppressions = { file: new Set(), statements: [] };

/** A directive's comment: whether it covers the file, then what follows, up to a block comment's end. */
const DIRECTIVE = /^(?:\/\/|\/\*)\s*adhere-ignore(-file)?\s+(.*?)\s*(?:\*\/)?$/s;

/** An `adhere-ignore` comment: where it is, and the rules it names. */
interface Directive {
  readonly line: number;
  /** At the end of a line of code, rather than on a line of its own. */
  readonly trailing: boolean;
  /** `adhere-ignore-file`, for the whole file. */
  readonly file: boolean;
  readonly rules: ReadonlySet<string>;
}

/** The rules a directive names, before any ` -- ` and its reason. None if it is not a directive. */
const directiveOf = (comment: string): Pick<Directive, "file" | "rules"> | undefined => {
  const match = DIRECTIVE.exec(comment);
  const named = (match?.[2] ?? "").split(/(?:^|\s)--(?:\s|$)/)[0] ?? "";
  const rules = named.split(/[\s,]+/).filter((rule) => rule.length > 0);
  return match === null || rules.length === 0
    ? undefined
    : { file: match[1] !== undefined, rules: new Set(rules) };
};

/** Whether a line holds nothing a statement could start with: blank, or a comment. */
const isQuiet = (line: string): boolean => {
  const text = line.trim();
  return (
    text.length === 0 || text.startsWith("//") || text.startsWith("/*") || text.startsWith("*")
  );
};

/** The statement that starts on the first line of code after `line`, or that line alone. */
const statementAfter = (lines: ReadonlyArray<string>, line: number): Range | undefined => {
  for (let next = line + 1; next <= lines.length; next++) {
    if (isQuiet(lines[next - 1] ?? "")) continue;
    return statementFrom(lines, next) ?? { first: next, last: next };
  }
  return undefined;
};

/**
 * A file's lines with its `adhere-ignore` comments blanked, each line keeping
 * its number, so Jev never reads them, and what they suppress.
 */
export const suppressionsOf = (
  lines: ReadonlyArray<string>,
): { readonly lines: ReadonlyArray<string>; readonly suppressions: Suppressions } => {
  const code = lines.join("\n");
  if (!code.includes("adhere-ignore")) return { lines, suppressions: NO_SUPPRESSIONS };
  const tokens = scan(code);
  const found: Array<Directive> = [];
  const kept: Array<string> = [];
  let line = 1;
  // Whether code comes before the current token on its line.
  let afterCode = false;
  for (const token of tokens) {
    const directive = token.kind === "comment" ? directiveOf(token.text) : undefined;
    if (directive !== undefined) found.push({ line, trailing: afterCode, ...directive });
    kept.push(directive === undefined ? token.text : token.text.replace(/[^\n]/g, ""));
    const breaks = token.text.split("\n").length - 1;
    const tail = token.text.slice(token.text.lastIndexOf("\n") + 1);
    if (breaks > 0) afterCode = false;
    if (token.kind !== "comment" && tail.trim().length > 0) afterCode = true;
    line += breaks;
  }
  // What the highlighter could not read, if anything, stays as it was.
  const read = tokens.reduce((length, token) => length + token.text.length, 0);
  const cleaned = (kept.join("") + code.slice(read))
    .split("\n")
    .map((text, index) => (text === lines[index] ? text : text.trimEnd()));
  const statements = found.flatMap(({ line: at, trailing, file, rules }) => {
    if (file) return [];
    const range = trailing
      ? (statementFrom(cleaned, at) ?? { first: at, last: at })
      : statementAfter(cleaned, at);
    return range === undefined ? [] : [{ ...range, rules }];
  });
  return {
    lines: cleaned,
    suppressions: {
      file: new Set(found.filter(({ file }) => file).flatMap(({ rules }) => [...rules])),
      statements,
    },
  };
};

/** Whether a file's comments suppress `rule`, named as a report names it, at `line`. */
export const suppresses = (suppressions: Suppressions, rule: string, line: number): boolean =>
  suppressions.file.has(rule) ||
  suppressions.statements.some(
    (statement) => statement.rules.has(rule) && statement.first <= line && line <= statement.last,
  );
