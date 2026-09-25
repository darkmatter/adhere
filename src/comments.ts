import { scan } from "#highlight.ts";

/**
 * A file's lines with its comments taken out: each comment's text removed
 * and its line breaks kept, so every line keeps its number, and a line with
 * only the spaces before a comment left empty. A string, template literal, or
 * regular expression that holds `//` or `/*` stays whole, as the highlighter
 * reads it.
 */
export const withoutComments = (lines: ReadonlyArray<string>): ReadonlyArray<string> => {
  const code = lines.join("\n");
  const tokens = scan(code);
  // What the highlighter could not read, if anything, stays as it was.
  const read = tokens.reduce((length, token) => length + token.text.length, 0);
  const kept =
    tokens
      .map(({ text, kind }) => (kind === "comment" ? text.replace(/[^\n]/g, "") : text))
      .join("") + code.slice(read);
  return kept.split("\n").map((line, index) => (line === lines[index] ? line : line.trimEnd()));
};
