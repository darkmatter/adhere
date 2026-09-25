import { ConfigUnavailable, type Example, type Rule } from "#config.ts";
import { Effect, Schema } from "effect";

/**
 * A rule as a Markdown file:
 *
 *     ---
 *     description: One sentence saying what code must be, or never be.
 *     threshold: 0.8
 *     ---
 *     Any prose, rendered on GitHub and ignored by adhere.
 *
 *     ## Must
 *
 *     ```ts
 *     const written = "code that must be written this way"
 *     ```
 *
 *     ## Never
 *
 *     ```ts
 *     const avoided = "code that must never be written this way"
 *     ```
 *
 * A heading names the code in its section with RFC 2119's words: `must` and
 * `never` for a requirement, `should` and `should not` for a guideline. So
 * does a fence's info string, as in `ts never`, which GitHub does not show; a
 * fence's own word wins over its heading's. The first fence under each word is
 * that example, and a rule has either or both. An untagged fence outside those
 * sections is the code to write, and without a fence the whole body is.
 * `avoid`, the word before 0.7, means `never`. `threshold` is optional, and
 * so is `tests`: `only` for a rule about test files, which rules otherwise
 * skip, and `include` for a rule that judges them too.
 */
const FrontMatter = Schema.Struct({
  description: Schema.String,
  threshold: Schema.optionalKey(Schema.FiniteFromString),
  tests: Schema.optionalKey(Schema.Literals(["only", "include"])),
});

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n {0,3}\1[ \t]*$/gm;
/** An ATX heading: its level as `#`s, then its text, without a closing run of `#`s. */
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/gm;

const unquote = (value: string): string => {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return quoted ? trimmed.slice(1, -1) : trimmed;
};

/** `key: value` lines. Enough for the two keys a rule has; not a YAML parser. */
const parseFrontMatter = (block: string): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (line.trim().length === 0 || line.trimStart().startsWith("#")) continue;
    if (colon > 0) fields[line.slice(0, colon).trim()] = unquote(line.slice(colon + 1));
  }
  return fields;
};

type Word = Example["word"];

interface Fence {
  /** The word its info string, or else its heading, names the code with; none for untagged code. */
  readonly word: Word | undefined;
  readonly code: string;
}

interface Heading {
  readonly level: number;
  /** The word the heading names its section's code with; none for any other heading. */
  readonly word: Word | undefined;
}

/** `must not`, like `never` and the older `avoid`, names code never to write. */
const wordOf = (info: string): Word | undefined => {
  const words = info.trim().toLowerCase().split(/\s+/);
  const not = words.includes("not");
  if (words.includes("never") || words.includes("avoid")) return "never";
  if (words.includes("should")) return not ? "should not" : "should";
  if (words.includes("must")) return not ? "never" : "must";
  return undefined;
};

const HEADING_WORDS: ReadonlySet<string> = new Set([
  "must",
  "must not",
  "never",
  "avoid",
  "should",
  "should not",
]);

/**
 * A heading names a word only when it is the word alone, in any case and with
 * or without a colon: `## Never` does, `## Why never` does not.
 */
const headingWordOf = (text: string): Word | undefined => {
  const phrase = text.trim().replace(/:$/, "").trim().toLowerCase().split(/\s+/).join(" ");
  return HEADING_WORDS.has(phrase) ? wordOf(phrase) : undefined;
};

/**
 * The headings open after `text`, outermost first, given those open before
 * it. A heading closes the sections at its level and deeper, so a deeper
 * heading stays inside the section above it.
 */
const openAfter = (open: ReadonlyArray<Heading>, text: string): ReadonlyArray<Heading> =>
  Array.from(text.matchAll(HEADING)).reduce<ReadonlyArray<Heading>>((headings, match) => {
    const level = (match[1] ?? "#").length;
    return [
      ...headings.filter((heading) => heading.level < level),
      { level, word: headingWordOf(match[2] ?? "") },
    ];
  }, open);

/**
 * Each fence, under the word its info string names or, without one, the word
 * of the innermost heading over it that names one.
 */
const fencesOf = (body: string): ReadonlyArray<Fence> => {
  const fences: Array<Fence> = [];
  let open: ReadonlyArray<Heading> = [];
  let read = 0;
  for (const match of body.matchAll(FENCE)) {
    // Only headings between fences count: a `#` line inside one is code.
    open = openAfter(open, body.slice(read, match.index));
    read = match.index + match[0].length;
    const section = open.findLast((heading) => heading.word !== undefined)?.word;
    fences.push({ word: wordOf(match[2] ?? "") ?? section, code: (match[3] ?? "").trim() });
  }
  return fences;
};

/** An empty block counts as no block. */
const nonEmpty = (code: string | undefined): string | undefined =>
  code === undefined || code.length === 0 ? undefined : code;

type Code = Pick<Rule, "must" | "never" | "should" | "shouldNot">;

/**
 * Each example the body has, under its word. An untagged fence is the code
 * to write: `should` in a guideline, which a `should` or `should not` fence
 * makes the rule, and `must` otherwise.
 */
const codeOf = (body: string): Code => {
  const fences = fencesOf(body);
  if (fences.length === 0) {
    const must = nonEmpty(body.trim());
    return must === undefined ? {} : { must };
  }
  const first = (word: Word | undefined) =>
    nonEmpty(fences.find((fence) => fence.word === word)?.code);
  const guideline = fences.some((fence) => fence.word === "should" || fence.word === "should not");
  const untagged = first(undefined);
  const must = first("must") ?? (guideline ? undefined : untagged);
  const never = first("never");
  const should = first("should") ?? (guideline ? untagged : undefined);
  const shouldNot = first("should not");
  return {
    ...(must === undefined ? {} : { must }),
    ...(never === undefined ? {} : { never }),
    ...(should === undefined ? {} : { should }),
    ...(shouldNot === undefined ? {} : { shouldNot }),
  };
};

export const parseRuleMarkdown = (
  text: string,
  file: string,
): Effect.Effect<Rule, ConfigUnavailable> =>
  Effect.gen(function* () {
    const match = FRONT_MATTER.exec(text);
    if (match === null || match[1] === undefined || match[2] === undefined) {
      return yield* ConfigUnavailable.make({
        message: `${file}: a rule starts with front matter between --- lines`,
      });
    }
    const front = yield* Schema.decodeUnknownEffect(FrontMatter)(parseFrontMatter(match[1])).pipe(
      Effect.mapError((problem) =>
        ConfigUnavailable.make({ message: `${file}: ${problem.message}` }),
      ),
    );
    const code = codeOf(match[2]);
    const requirement = code.must !== undefined || code.never !== undefined;
    const guideline = code.should !== undefined || code.shouldNot !== undefined;
    if (requirement && guideline) {
      return yield* ConfigUnavailable.make({
        message: `${file}: a rule is a requirement (must, never) or a guideline (should, should not), not both`,
      });
    }
    if (!requirement && !guideline) {
      return yield* ConfigUnavailable.make({
        message: `${file}: the body needs code, in a fence under a Must, Never, Should, or Should not heading, or untagged`,
      });
    }
    return { ...front, ...code };
  });
