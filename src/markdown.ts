import { ConfigUnavailable, type Rule } from "#config.ts";
import { Effect, Schema } from "effect";

/**
 * A rule as a Markdown file:
 *
 *     ---
 *     description: One sentence naming the pattern.
 *     threshold: 0.8
 *     ---
 *     Any prose, rendered on GitHub and ignored by adhere.
 *
 *     ```ts
 *     const reference = "the correct code"
 *     ```
 *
 *     ```ts avoid
 *     const avoided = "what a violation looks like"
 *     ```
 *
 * The reference is the first fenced code block; `avoid` in a fence's info
 * string marks the code to avoid instead. A rule has either or both. Without a
 * fence, the whole body is the reference. `threshold` is optional.
 */
const FrontMatter = Schema.Struct({
  description: Schema.String,
  threshold: Schema.optionalKey(Schema.FiniteFromString),
});

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n {0,3}\1[ \t]*$/gm;
const AVOID = "avoid";

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

interface Fence {
  readonly avoid: boolean;
  readonly code: string;
}

const fencesOf = (body: string): ReadonlyArray<Fence> =>
  Array.from(body.matchAll(FENCE), (match) => ({
    avoid: (match[2] ?? "")
      .trim()
      .split(/\s+/)
      .some((word) => word.toLowerCase() === AVOID),
    code: (match[3] ?? "").trim(),
  }));

/** An empty block counts as no block. */
const nonEmpty = (code: string | undefined): string | undefined =>
  code === undefined || code.length === 0 ? undefined : code;

/** The reference and the code to avoid, each left out when the body has none. */
const codeOf = (body: string): Pick<Rule, "reference" | "avoid"> => {
  const fences = fencesOf(body);
  const reference = nonEmpty(
    fences.length === 0 ? body.trim() : fences.find((fence) => !fence.avoid)?.code,
  );
  const avoid = nonEmpty(fences.find((fence) => fence.avoid)?.code);
  return {
    ...(reference === undefined ? {} : { reference }),
    ...(avoid === undefined ? {} : { avoid }),
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
    if (code.reference === undefined && code.avoid === undefined) {
      return yield* ConfigUnavailable.make({
        message: `${file}: the body needs reference code, a fence tagged avoid, or both`,
      });
    }
    return { ...front, ...code };
  });
