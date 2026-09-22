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
 * The reference is the first fenced code block. Without a fence, it is the
 * whole body. `threshold` is optional.
 */
const FrontMatter = Schema.Struct({
  description: Schema.String,
  threshold: Schema.optionalKey(Schema.FiniteFromString),
});

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n {0,3}\1[ \t]*$/m;

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

const referenceOf = (body: string): string => {
  const fence = FENCE.exec(body);
  return (fence?.[2] ?? body).trim();
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
    const front = yield* Schema.decodeUnknownEffect(FrontMatter)(
      parseFrontMatter(match[1]),
    ).pipe(
      Effect.mapError((problem) =>
        ConfigUnavailable.make({ message: `${file}: ${problem.message}` }),
      ),
    );
    const reference = referenceOf(match[2]);
    if (reference.length === 0) {
      return yield* ConfigUnavailable.make({
        message: `${file}: the body is the reference code and cannot be empty`,
      });
    }
    return { ...front, reference };
  });
