import { scan } from "#highlight.ts";

/** `@adhere` anywhere in a comment makes it a note for Jev. */
const NOTE = /@adhere\b/;

/**
 * Whether a comment is a note for Jev: one that says `@adhere` anywhere in
 * it, which stays when comments are taken out.
 */
export const isNote = (comment: string): boolean => NOTE.test(comment);

/**
 * A file's lines with its comments taken out, but for those `keep` keeps:
 * each comment's text removed and its line breaks kept, so every line keeps
 * its number, and a line with only the spaces before a comment left empty. A
 * string, template literal, or regular expression that holds `//` or `/*`
 * stays whole, as the highlighter reads it.
 */
export const withoutComments = (
  lines: ReadonlyArray<string>,
  keep: (comment: string) => boolean = () => false,
): ReadonlyArray<string> => {
  const code = lines.join("\n");
  // No comment can start without one of these, so a file without them is sent as it is.
  if (!code.includes("//") && !code.includes("/*")) return lines;
  const tokens = scan(code);
  // What the highlighter could not read, if anything, stays as it was.
  const read = tokens.reduce((length, token) => length + token.text.length, 0);
  const kept =
    tokens
      .map(({ text, kind }) =>
        kind === "comment" && !keep(text) ? text.replace(/[^\n]/g, "") : text,
      )
      .join("") + code.slice(read);
  return kept.split("\n").map((line, index) => (line === lines[index] ? line : line.trimEnd()));
};
