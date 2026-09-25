import { scan } from "#highlight.ts";

/**
 * The lines a finding shows: the statement its line is in, such as the
 * function around it, and a few lines on either side of the line.
 */
export interface Excerpt {
  /** The number of the first line, counting from 1. */
  readonly start: number;
  readonly lines: ReadonlyArray<string>;
}

/** How far an excerpt reaches on either side of the finding's line, in whole statements. */
const AROUND = 3;
/** The most lines a statement can have and still be shown whole. */
const WHOLE = 30;

/** Lines of the code, first to last, counting from 1. */
export interface Range {
  readonly first: number;
  readonly last: number;
}

const holds = (range: Range, line: number): boolean => range.first <= line && line <= range.last;

/**
 * A token that shapes the code: a bracket, a separator, an operator, or a
 * value, such as a name, a keyword, or a literal. Only a template literal
 * ends on a later line than the one it starts on.
 */
interface Piece {
  readonly text: string;
  readonly role: "open" | "close" | "separator" | "operator" | "value";
  readonly line: number;
  readonly end: number;
  /** Whether whitespace or a comment comes right before it. */
  readonly spaced: boolean;
}

const ROLES: Readonly<Record<string, Piece["role"]>> = {
  "(": "open",
  "[": "open",
  "{": "open",
  ")": "close",
  "]": "close",
  "}": "close",
  ";": "separator",
  ",": "separator",
};

/**
 * The code as pieces, without whitespace and comments, and the comments and
 * literals that span lines: a line that starts inside one does not read as
 * code on its own.
 */
const piecesOf = (code: string) => {
  const pieces: Array<Piece> = [];
  const spans: Array<Range> = [];
  let line = 1;
  let spaced = true;
  for (const { text, kind } of scan(code)) {
    const end = line + text.split("\n").length - 1;
    if (kind !== undefined && end > line) spans.push({ first: line, last: end });
    if (kind === "comment" || text.trim().length === 0) {
      spaced = true;
    } else if (kind !== undefined || /^[\w$]/.test(text)) {
      pieces.push({ text, role: "value", line, end, spaced });
      spaced = false;
    } else {
      // A run of punctuation, like `});` or `=>{`: each bracket and separator is a piece.
      for (const part of text.match(/[()[\]{};,]|[^()[\]{};,]+/g) ?? []) {
        pieces.push({ text: part, role: ROLES[part] ?? "operator", line, end, spaced });
        spaced = false;
      }
    }
    line = end;
  }
  return { pieces, spans };
};

/**
 * Where each group closes: the index of the piece that opens it, mapped to
 * the index of the one that closes it. Type arguments broken over lines, from
 * a `Type<` that ends a line to a `>` that starts one, are a group too, so
 * their commas do not end a statement; a `<` that no such `>` closes was a
 * comparison. A bracket left open runs to the end.
 */
const closesOf = (pieces: ReadonlyArray<Piece>): ReadonlyMap<number, number> => {
  const closes = new Map<number, number>();
  const opened: Array<number> = [];
  const isAngle = (index: number | undefined): index is number =>
    index !== undefined && pieces[index]?.text === "<";
  pieces.forEach((piece, index) => {
    const before = pieces[index - 1];
    const after = pieces[index + 1];
    const top = opened.at(-1);
    if (piece.role === "open") {
      opened.push(index);
    } else if (piece.text === "<") {
      const endsLine = after === undefined || after.line > piece.line;
      if (endsLine && !piece.spaced && before?.role === "value") opened.push(index);
    } else if (piece.text === ">" && isAngle(top) && (before?.end ?? 0) < piece.line) {
      opened.pop();
      closes.set(top, index);
    } else if (piece.role === "close" || piece.text === ";") {
      while (isAngle(opened.at(-1))) opened.pop();
      const opener = piece.role === "close" ? opened.pop() : undefined;
      if (opener !== undefined) closes.set(opener, index);
    }
  });
  for (const opener of opened) {
    if (!isAngle(opener)) closes.set(opener, pieces.length - 1);
  }
  return closes;
};

/** Operators that leave an expression open at the end of a line: `=`, `=>`, `&&`, `.`. */
const LEAVES_OPEN = /[-+*/%&|^<>=?:.]$/;
/** Operators that carry the expression above on at the start of a line: `.pipe(`, `? a`, `| B`. */
const CARRIES_ON = /^[-+*/%&|^>=?:.]/;
/** Words that need more after them at the end of a line. */
const OPEN_WORDS = new Set(["as", "await", "extends", "implements", "keyof", "new", "satisfies"]);
/** Words that go on with the statement above at the start of a line. */
const ON_WORDS = new Set(["as", "catch", "else", "extends", "finally", "implements", "satisfies"]);

const isStep = (text: string): boolean => text === "++" || text === "--";

const leavesOpen = (piece: Piece): boolean =>
  piece.role === "operator"
    ? LEAVES_OPEN.test(piece.text) && !isStep(piece.text)
    : piece.role === "value" && OPEN_WORDS.has(piece.text);

const carriesOn = (piece: Piece): boolean =>
  piece.role === "operator"
    ? CARRIES_ON.test(piece.text) && !isStep(piece.text)
    : piece.role === "value" && ON_WORDS.has(piece.text);

/** A statement's lines, and the groups directly inside it, as the pieces that open and close each. */
interface Statement extends Range {
  readonly groups: ReadonlyArray<readonly [number, number]>;
}

/**
 * The statements in the pieces from `from` up to `to`, each group inside one
 * taken whole. A statement ends at a `;` or `,`, or at a line break that
 * neither side carries across: about where JavaScript inserts a semicolon.
 */
const statementsIn = (
  pieces: ReadonlyArray<Piece>,
  closes: ReadonlyMap<number, number>,
  from: number,
  to: number,
): ReadonlyArray<Statement> => {
  const statements: Array<Statement> = [];
  let current:
    | { first: number; last: number; groups: Array<readonly [number, number]> }
    | undefined;
  let open = false;
  let index = from;
  while (index < to) {
    const piece = pieces[index];
    if (piece === undefined) break;
    if (current !== undefined && piece.line > current.last && !open && !carriesOn(piece)) {
      statements.push(current);
      current = undefined;
    }
    const close = Math.min(closes.get(index) ?? index, to - 1);
    const end = pieces[close]?.end ?? piece.end;
    current ??= { first: piece.line, last: end, groups: [] };
    current.last = end;
    if (close > index) current.groups.push([index, close]);
    // A group's closing bracket leaves nothing open.
    open = close === index && leavesOpen(piece);
    if (piece.role === "separator") {
      statements.push(current);
      current = undefined;
    }
    index = close + 1;
  }
  if (current !== undefined) statements.push(current);
  return statements;
};

/**
 * The statements `line` is in, outermost first: the one at the top level,
 * then the one around `line` inside the group of that statement it is in,
 * and so on inward. A line where two statements meet is in both, together.
 */
const statementsAround = (
  pieces: ReadonlyArray<Piece>,
  closes: ReadonlyMap<number, number>,
  line: number,
  from = 0,
  to = pieces.length,
): ReadonlyArray<Range> => {
  const around = statementsIn(pieces, closes, from, to).filter((statement) =>
    holds(statement, line),
  );
  const [outer, inner] = [around[0], around.at(-1)];
  if (outer === undefined || inner === undefined) return [];
  const group = around
    .flatMap((statement) => statement.groups)
    .find(
      ([open, close]) => (pieces[open]?.line ?? line) < line && line <= (pieces[close]?.line ?? 0),
    );
  return [
    { first: outer.first, last: inner.last },
    ...(group === undefined ? [] : statementsAround(pieces, closes, line, group[0] + 1, group[1])),
  ];
};

/**
 * The statement that starts on `line`, such as a property, a function, or a
 * call that opens there: the outermost statement around `line` whose first
 * line it is. None when no statement starts on `line`.
 */
export const statementFrom = (lines: ReadonlyArray<string>, line: number): Range | undefined => {
  const { pieces } = piecesOf(lines.join("\n"));
  return statementsAround(pieces, closesOf(pieces), line).find((range) => range.first === line);
};

/**
 * The excerpt for a finding on `line`: the outermost statement around it
 * with at most `WHOLE` lines, such as the function it is in, and up to
 * `AROUND` lines on either side of `line`. A comment or template literal
 * that spans lines counts as a statement inside the one it is in.
 *
 * Around `line`, the excerpt shows only whole statements, never the end of
 * the one above or the start of the one below, so it cannot start partway
 * through a comment, whose lines do not read as code on their own. What
 * `line` itself is in can show in part: a long function's first line, above
 * the statement of its body. It ends at code, since a comment at the end
 * would be about code the excerpt leaves out.
 */
export const excerptOf = (lines: ReadonlyArray<string>, line: number): Excerpt => {
  const { pieces, spans } = piecesOf(lines.join("\n"));
  const closes = closesOf(pieces);
  /** What a line is in, outermost first. */
  const around = (at: number): ReadonlyArray<Range> => [
    ...statementsAround(pieces, closes, at),
    ...spans.filter((span) => holds(span, at)),
  ];
  const scope = around(line).find((range) => range.last - range.first < WHOLE);
  const top = Math.max(1, Math.min(scope?.first ?? line, line - AROUND));
  const bottom = Math.min(lines.length, Math.max(scope?.last ?? line, line + AROUND));
  /** What a line is in that `line` is not, which an edge shows whole or not at all. */
  const beside = (at: number) => around(at).filter((range) => !holds(range, line));
  let first = Math.max(
    top,
    ...beside(top)
      .filter((range) => range.first < top)
      .map((range) => range.last + 1),
  );
  let last = Math.min(
    bottom,
    ...beside(bottom)
      .filter((range) => range.last > bottom)
      .map((range) => range.first - 1),
  );
  const isBlank = (at: number) => (lines[at - 1] ?? "").trim().length === 0;
  const hasCode = (at: number) => pieces.some((piece) => piece.line <= at && at <= piece.end);
  while (first < line && isBlank(first)) first += 1;
  while (last > line && !hasCode(last)) last -= 1;
  return { start: first, lines: lines.slice(first - 1, last) };
};
