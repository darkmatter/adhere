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
 *     ```ts must
 *     const written = "code that must be written this way"
 *     ```
 *
 *     ```ts never
 *     const avoided = "code that must never be written this way"
 *     ```
 *
 * A fence's info string names its code with RFC 2119's words: `must` and
 * `never` for a requirement, `should` and `should not` for a guideline. The
 * first fence under each word is that example, and a rule has either or both.
 * An untagged fence is the code to write, and without a fence the whole body
 * is. `avoid`, the word before 0.7, means `never`. `threshold` is optional.
 */
const FrontMatter = Schema.Struct({
  description: Schema.String,
  threshold: Schema.optionalKey(Schema.FiniteFromString),
});

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n {0,3}\1[ \t]*$/gm;

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
  /** The word the info string names the code with; none for an untagged fence. */
  readonly word: Word | undefined;
  readonly code: string;
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

const fencesOf = (body: string): ReadonlyArray<Fence> =>
  Array.from(body.matchAll(FENCE), (match) => ({
    word: wordOf(match[2] ?? ""),
    code: (match[3] ?? "").trim(),
  }));

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
        message: `${file}: the body needs code, in a fence tagged must, never, should, or should not, or untagged`,
      });
    }
    return { ...front, ...code };
  });
