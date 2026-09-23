/**
 * TypeScript split into the token classes a reader scans for: comments,
 * strings, constants, keywords, and type names. A tokenizer, not a parser: a
 * token it cannot classify has no kind, and the tokens' text joins back into
 * the input exactly.
 */
export type Kind = "comment" | "string" | "constant" | "keyword" | "type";

export interface Token {
  readonly text: string;
  readonly kind?: Kind;
}

const words = (list: string): ReadonlySet<string> => new Set(list.split(" "));

const KEYWORDS = words(
  "abstract as async await break case catch class const continue declare default delete do " +
    "else enum export extends finally for from function get if implements import in infer " +
    "instanceof interface is keyof let namespace new of private protected public readonly " +
    "return satisfies set static super switch this throw try type typeof var void while yield",
);
const CONSTANTS = words("true false null undefined");
const PRIMITIVES = words("any bigint boolean never number object string symbol unknown");
/** Keywords that keep their color before a colon: `default:`, `a ? this : b`. */
const NOT_KEYS = words("default super this");

/** The groups that name their token's kind. */
const CLASSES = ["comment", "string", "constant"] as const;

/** One group per token class, tried in order at each position. A template literal is read apart. */
const TOKEN = new RegExp(
  [
    /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))/,
    /(?<string>"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)/,
    /(?<constant>0[box][\da-f_]+n?|\d[\d_]*(?:\.\d[\d_]*)?(?:e[+-]?\d+)?n?)/,
    /(?<word>[a-z_$][\w$]*)/,
    /(?<space>\s+)/,
    // Anything else, a run at a time; `/` alone, since it can start a comment.
    /(?<punctuation>[^\w\s$"'`/]+|\/)/,
  ]
    .map((group) => group.source)
    .join("|"),
  "iy",
);
/** A regex literal, tried only where an expression can start: `a / b` divides. */
const REGEX = /\/(?![*/])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[a-z]*/y;
/** What follows a property name: `type: "noul"`, `get?: X`. */
const KEY = /\s*\??:(?!:)/y;
/** `Schema`, `HttpClient`, `A`; not `URL` or `MAX_LINES`. */
const TYPE_NAME = /^[A-Z]$|^[A-Z][\w$]*[a-z]/;

const matchAt = (pattern: RegExp, code: string, at: number): RegExpExecArray | null => {
  pattern.lastIndex = at;
  return pattern.exec(code);
};

/** After a name, a literal, or a closing bracket, `/` divides. */
const regexMayStart = (previous: string | undefined): boolean =>
  previous === undefined ||
  (KEYWORDS.has(previous) && previous !== "this" && previous !== "super") ||
  /[^\w$)\]}"'`]$/.test(previous);

/**
 * A word after `.` or before `:` names a property, so `cache.get` and
 * `{ type: "noul" }` are not keywords.
 */
const kindOf = (word: string, previous: string | undefined, isKey: boolean): Kind | undefined => {
  if (TYPE_NAME.test(word)) return "type";
  if (CONSTANTS.has(word)) return "constant";
  if (previous?.endsWith(".") === true || (isKey && !NOT_KEYS.has(word))) return undefined;
  return KEYWORDS.has(word) ? "keyword" : PRIMITIVES.has(word) ? "type" : undefined;
};

/** Whether a token is what the next one reads as before it: not whitespace or a comment. */
const counts = (token: Token): boolean => token.kind !== "comment" && token.text.trim().length > 0;

/** The token at `at`, after `previous`, the last one that counts. */
const tokenAt = (code: string, at: number, previous: string | undefined): Token | undefined => {
  if (code[at] === "`") return { text: code.slice(at, templateEnd(code, at)), kind: "string" };
  const regex = regexMayStart(previous) ? matchAt(REGEX, code, at) : null;
  const match = regex ?? matchAt(TOKEN, code, at);
  // `punctuation` matches any character the other groups do not.
  if (match === null) return undefined;
  const text = match[0];
  const groups = match.groups ?? {};
  const kind: Kind | undefined =
    regex !== null
      ? "string"
      : groups.word !== undefined
        ? kindOf(groups.word, previous, matchAt(KEY, code, at + text.length) !== null)
        : CLASSES.find((name) => groups[name] !== undefined);
  return kind === undefined ? { text } : { text, kind };
};

/**
 * Where the template literal that opens at `at` closes: past its closing
 * backtick, or at the end of the code. The code in each `${…}` is read as
 * tokens, so a brace or a template in it, as in `${xs.map((x) => `${x}`)}`,
 * does not close the template early.
 */
const templateEnd = (code: string, at: number): number => {
  let index = at + 1;
  while (index < code.length && code[index] !== "`") {
    if (code[index] === "\\") index += 2;
    else if (code.startsWith("${", index)) index = substitutionEnd(code, index + 2);
    else index += 1;
  }
  return Math.min(index + 1, code.length);
};

/** Where the code of a `${…}` that starts at `at` ends: past the brace that closes it. */
const substitutionEnd = (code: string, at: number): number => {
  let depth = 0;
  let previous: string | undefined;
  let index = at;
  while (index < code.length) {
    const token = tokenAt(code, index, previous);
    if (token === undefined) break;
    // Braces are punctuation; one in a string or a nested template is text.
    if (token.kind === undefined) {
      for (let offset = 0; offset < token.text.length; offset += 1) {
        if (token.text[offset] === "{") depth += 1;
        else if (token.text[offset] === "}") {
          if (depth === 0) return index + offset + 1;
          depth -= 1;
        }
      }
    }
    if (counts(token)) previous = token.text;
    index += token.text.length;
  }
  return code.length;
};

/**
 * The code's tokens, in order. A token that crosses a newline, like a block
 * comment or a template literal, stays whole.
 */
export const scan = (code: string): ReadonlyArray<Token> => {
  const tokens: Array<Token> = [];
  let previous: string | undefined;
  let at = 0;
  while (at < code.length) {
    const token = tokenAt(code, at, previous);
    if (token === undefined) break;
    tokens.push(token);
    if (counts(token)) previous = token.text;
    at += token.text.length;
  }
  return tokens;
};

/**
 * The code's lines, each as tokens. A token that crosses a newline, like a
 * block comment or a template literal, is cut into one token per line.
 */
export const tokenize = (code: string): ReadonlyArray<ReadonlyArray<Token>> => {
  const lines: Array<Array<Token>> = [[]];
  for (const { text, kind } of scan(code)) {
    for (const [index, piece] of text.split("\n").entries()) {
      if (index > 0) lines.push([]);
      if (piece.length > 0) {
        lines.at(-1)?.push(kind === undefined ? { text: piece } : { text: piece, kind });
      }
    }
  }
  return lines;
};
