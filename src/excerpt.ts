import { scan } from "#highlight.ts";

/** The lines a finding shows: the section of the file it is in. */
export interface Excerpt {
  /** The number of the first line, counting from 1. */
  readonly start: number;
  readonly lines: ReadonlyArray<string>;
}

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

/** The code as pieces, without whitespace and comments. */
const piecesOf = (code: string) => {
  const pieces: Array<Piece> = [];
  let line = 1;
  let spaced = true;
  for (const { text, kind } of scan(code)) {
    const end = line + text.split("\n").length - 1;
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
  return { pieces };
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

/** The most lines a section holds, unless one statement with no group to split is longer. */
const SECTION = 30;

/**
 * The file in sections, each ending where a statement does: its top-level
 * statements, such as its imports, constants, and functions, packed in
 * order into sections of at most `SECTION` lines, a decorator with what it
 * decorates. A statement longer than that splits into the statements of its
 * largest group, such as a class's methods or a component's body, the lines
 * around that group going with the first and last of them. Every line is in
 * one section: the comments and blank lines above a statement go with it,
 * and the last section runs to the end.
 */
export const sectionsOf = (lines: ReadonlyArray<string>): ReadonlyArray<Range> => {
  const { pieces } = piecesOf(lines.join("\n"));
  const closes = closesOf(pieces);
  const lineOf = (index: number) => pieces[index]?.line ?? 0;
  /** Statements as ranges of at most `SECTION` lines where they can be split. */
  const units = (statements: ReadonlyArray<Statement>): ReadonlyArray<Range> =>
    statements.flatMap((statement): ReadonlyArray<Range> => {
      if (statement.last - statement.first < SECTION) return [statement];
      const largest = statement.groups.reduce<readonly [number, number] | undefined>(
        (best, group) =>
          best === undefined ||
          lineOf(group[1]) - lineOf(group[0]) > lineOf(best[1]) - lineOf(best[0])
            ? group
            : best,
        undefined,
      );
      const inner =
        largest === undefined
          ? []
          : units(statementsIn(pieces, closes, largest[0] + 1, largest[1]));
      const [head, tail] = [inner[0], inner.at(-1)];
      if (head === undefined || tail === undefined || inner.length < 2) return [statement];
      return [
        { first: statement.first, last: head.last },
        ...inner.slice(1, -1),
        { first: tail.first, last: statement.last },
      ];
    });
  const sections: Array<Range> = [];
  /** A decorator, such as `@Command({…})`, waiting for the declaration it decorates. */
  let decorator: Range | undefined;
  for (const found of units(statementsIn(pieces, closes, 0, pieces.length))) {
    if ((lines[found.first - 1] ?? "").trimStart().startsWith("@")) {
      decorator = { first: decorator?.first ?? found.first, last: found.last };
      continue;
    }
    const unit = { first: decorator?.first ?? found.first, last: found.last };
    decorator = undefined;
    const previous = sections.at(-1);
    if (previous !== undefined && unit.last - previous.first < SECTION) {
      sections[sections.length - 1] = { first: previous.first, last: unit.last };
    } else {
      sections.push({ first: unit.first, last: unit.last });
    }
  }
  if (decorator !== undefined) sections.push(decorator);
  // A file of comments alone, with no statement, is one section.
  if (sections.length === 0) return lines.length === 0 ? [] : [{ first: 1, last: lines.length }];
  // Each section starts where the one before it ends, and the last one ends with the file.
  return sections.flatMap((section, index): ReadonlyArray<Range> => {
    const first = (sections[index - 1]?.last ?? 0) + 1;
    const last = index === sections.length - 1 ? lines.length : section.last;
    return last < first ? [] : [{ first, last }];
  });
};

const DECLARATION =
  /^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(function\*?|class|interface|type|enum|const|let|var|namespace)\s+([\w$]+|\[[^\]]*\]|\{[^}]*\})/;
const FIELD =
  /^(?:(?:public|private|protected|static|readonly|override|declare)\s+)*(#?[\w$]+)\s*[?!]?\s*[:=][^=]/;
const METHOD =
  /^(?:(?:public|private|protected|static|readonly|async|override|get|set)\s+)*(#?[\w$]+)\s*[<(]/;
const CALL =
  /^(describe|it|test|beforeAll|beforeEach|afterAll|afterEach|useEffect|useLayoutEffect)(?:\.\w+)?\(\s*(?:(['"`])(.*?)\2)?/;
/** Words a method's pattern matches that start a statement instead. */
const KEYWORDS = new Set(["if", "for", "while", "switch", "return", "await", "catch", "super"]);

/**
 * What a section declares, for a report to name it by, such as `class
 * Context` or `imports, const prompt`: the declarations, methods, fields,
 * and test blocks at its outermost indentation, or its first line when it
 * has none, such as a run of JSX.
 */
export const sectionName = (lines: ReadonlyArray<string>, section: Range): string => {
  const body = lines.slice(section.first - 1, section.last).filter((line) => line.trim() !== "");
  const indent = Math.min(...body.map((line) => line.length - line.trimStart().length));
  const names: Array<string> = [];
  let imports = false;
  for (const line of body) {
    if (line.length - line.trimStart().length !== indent) continue;
    const text = line.trim();
    if (text.startsWith("import ")) {
      imports = true;
      continue;
    }
    const declared = DECLARATION.exec(text);
    const called = CALL.exec(text);
    const field = FIELD.exec(text);
    const method = METHOD.exec(text);
    if (declared !== null) {
      names.push(`${declared[1]?.replace("*", "")} ${declared[2]?.replace(/\s+/g, " ")}`);
    } else if (called !== null) {
      names.push(called[3] === undefined ? `${called[1]}` : `${called[1]} "${called[3]}"`);
    } else if (field !== null) {
      names.push(`${field[1]}`);
    } else if (method !== null && !KEYWORDS.has(method[1] ?? "")) {
      names.push(`${method[1]}()`);
    }
  }
  const listed = [...(imports ? ["imports"] : []), ...names];
  if (listed.length === 0) return (body[0] ?? "").trim().slice(0, 80);
  return listed.length > 4 ? `${listed.slice(0, 4).join(", ")}, …` : listed.join(", ");
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
