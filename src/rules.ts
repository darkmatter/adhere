import { ConfigUnavailable, type Rule, type RuleId, type RuleSource } from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { Effect, FileSystem, Path, Record } from "effect";

const refused = (directory: string) => (problem: { readonly message: string }) =>
  ConfigUnavailable.make({
    message: `Could not read rules from ${directory}: ${problem.message}`,
  });

/**
 * Every `*.md` file under `directory`, validated and keyed by its path
 * relative to the directory without the extension: `basics/gen.md` is the
 * rule `basics/gen`.
 */
export const loadRules = Effect.fn("loadRules")(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* fs
    .readDirectory(directory, { recursive: true })
    .pipe(Effect.mapError(refused(directory)));
  const files = entries.filter((entry) => entry.endsWith(".md")).sort();
  const rules = yield* Effect.forEach(files, (relative) =>
    Effect.gen(function* () {
      const file = path.join(directory, relative);
      const text = yield* fs
        .readFileString(file)
        .pipe(Effect.mapError(refused(directory)));
      const id: RuleId = relative.slice(0, -".md".length).split(path.sep).join("/");
      return [id, yield* parseRuleMarkdown(text, file)] as const;
    }),
  );
  return Record.fromEntries(rules) as Readonly<Record<RuleId, Rule>>;
});

/** Rules as given, or loaded from the directory a source names. */
export const materializeRules = Effect.fn("materializeRules")(function* (
  source: RuleSource,
  base: string,
) {
  const path = yield* Path.Path;
  if (source instanceof URL) {
    return yield* loadRules(yield* path.fromFileUrl(source).pipe(Effect.orDie));
  }
  if (typeof source === "string") {
    return yield* loadRules(path.resolve(base, source));
  }
  return source;
});
