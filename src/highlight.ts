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

/** One group per token class, tried in order at each position. */
const TOKEN = new RegExp(
  [
    /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))/,
    /(?<string>"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\[\s\S])*`?)/,
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

/**
 * The code's lines, each as tokens. A token that crosses a newline, like a
 * block comment or a template literal, is cut into one token per line.
 */
export const tokenize = (code: string): ReadonlyArray<ReadonlyArray<Token>> => {
  const lines: Array<Array<Token>> = [[]];
  // The last token that was not whitespace or a comment.
  let previous: string | undefined;
  let at = 0;
  while (at < code.length) {
    const regex = regexMayStart(previous) ? matchAt(REGEX, code, at) : null;
    const match = regex ?? matchAt(TOKEN, code, at);
    // `punctuation` matches any character the other groups do not.
    if (match === null) break;
    const text = match[0];
    const groups = match.groups ?? {};
    const kind: Kind | undefined =
      regex !== null
        ? "string"
        : groups.word !== undefined
          ? kindOf(groups.word, previous, matchAt(KEY, code, at + text.length) !== null)
          : CLASSES.find((name) => groups[name] !== undefined);
    for (const [index, piece] of text.split("\n").entries()) {
      if (index > 0) lines.push([]);
      if (piece.length > 0) {
        lines.at(-1)?.push(kind === undefined ? { text: piece } : { text: piece, kind });
      }
    }
    if (groups.comment === undefined && groups.space === undefined) previous = text;
    at += text.length;
  }
  return lines;
};
