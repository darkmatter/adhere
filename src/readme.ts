/**
 * Writes the managed guide into a shared repo's README: only a marked block,
 * so the rest of the README stays the author's. The block itself, its rules
 * grouped by topic and its lint settings, is rendered by `#readme-guide.ts`.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { run } from "#create/agents.ts";
import { cloned, describeRulesAt } from "#install.ts";
import { lintEntries, renderReadmeIndex, type LintConfig } from "#readme-guide.ts";
import { SHARED_LINT_EXPORT, SHARED_LINT_RULES } from "#oxlint/shared.ts";
import { Effect, Option, Schema } from "effect";

export type { LintConfig, ReadmeRule } from "#readme-guide.ts";
export { renderReadmeIndex };

export const README_START = "<!-- adhere:rules:start -->";
export const README_END = "<!-- adhere:rules:end -->";

export class ReadmeUnavailable extends Schema.TaggedError<ReadmeUnavailable>()(
  "ReadmeUnavailable",
  { message: Schema.String },
) {}

const LintConfigShape = Schema.Struct({
  rules: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
  jsPlugins: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});

const Manifest = Schema.Struct({
  exports: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
});

/** What a README index wrote, and how much it listed. */
export interface ReadmeRefresh {
  readonly changed: boolean;
  readonly message: string;
}

const readOptional = (file: string): Effect.Effect<string | undefined, ReadmeUnavailable> =>
  Effect.tryPromise({
    try: async () => {
      try {
        return { text: await readFile(file, "utf8") };
      } catch (cause) {
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          cause.code === "ENOENT"
        ) {
          return {};
        }
        throw cause;
      }
    },
    catch: (cause) =>
      new ReadmeUnavailable({
        message: `Could not read ${file}: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  }).pipe(Effect.map(({ text }) => text));

/** The shared lint config, `{}` when absent; invalid JSON refuses the refresh. */
const lintConfigAt = (root: string): Effect.Effect<LintConfig, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const file = join(root, SHARED_LINT_RULES);
    const text = yield* readOptional(file);
    if (text === undefined) return {};
    const parsed = yield* Effect.try({
      try: () => JSON.parse(text) as unknown,
      catch: () =>
        new ReadmeUnavailable({
          message: `${file} is not valid JSON; left the README unchanged.`,
        }),
    });
    const decoded = Schema.decodeUnknownOption(LintConfigShape)(parsed);
    return Option.isSome(decoded)
      ? decoded.value
      : yield* ReadmeUnavailable.make({
          message: `${file} is not an object of rules and jsPlugins; left the README unchanged.`,
        });
  });

/**
 * Whether `root` is a shared rules repo, by the metadata `init --shared`
 * writes: a package.json whose exports name `./oxlint`. Its rules directory
 * alone is every project's, so this is what tells a shared repo from one that
 * merely has rules.
 */
export const isSharedRepo = (root: string): Effect.Effect<boolean> =>
  Effect.promise(async () => {
    try {
      const parsed: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
      const decoded = Schema.decodeUnknownOption(Manifest)(parsed);
      return Option.isSome(decoded) && decoded.value.exports?.[SHARED_LINT_EXPORT] !== undefined;
    } catch {
      return false;
    }
  });

/**
 * Replace only the marked block; append it when absent. A README that is
 * missing one marker, or repeats them, refuses before any write.
 */
export const applyReadmeIndex = (
  previous: string,
  block: string,
): Effect.Effect<string, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const start = previous.indexOf(README_START);
    const end = previous.indexOf(README_END);
    if (
      (start === -1) !== (end === -1) ||
      (start !== -1 &&
        (end < start ||
          previous.indexOf(README_START, start + README_START.length) !== -1 ||
          previous.indexOf(README_END, end + README_END.length) !== -1))
    ) {
      return yield* ReadmeUnavailable.make({
        message:
          "README.md has malformed or duplicate adhere rules markers. Fix them before running adhere rules readme.",
      });
    }
    const wrapped = `${README_START}\n${block}\n${README_END}`;
    return start === -1
      ? `${previous}${previous === "" ? "" : previous.endsWith("\n\n") ? "" : previous.endsWith("\n") ? "\n" : "\n\n"}${wrapped}\n`
      : `${previous.slice(0, start)}${wrapped}${previous.slice(end + README_END.length)}`;
  });

/**
 * Check that `root`'s README accepts an index refresh, without writing: a
 * local writer calls this before it writes a rule or plugin, so malformed
 * markers fail before a partial change lands.
 */
export const validateReadme = (root: string): Effect.Effect<void, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const previous = (yield* readOptional(join(root, "README.md"))) ?? "";
    yield* applyReadmeIndex(previous, "");
  });

/**
 * Refresh the README at `root` from its rules and lint config. `root` is
 * taken as shared because init knows it is; commands that start in a
 * directory check `isSharedRepo` first.
 */
export const refreshReadme = (root: string): Effect.Effect<ReadmeRefresh, ReadmeUnavailable> =>
  Effect.gen(function* () {
    const rules = yield* describeRulesAt(root).pipe(
      Effect.mapError(
        (cause) =>
          new ReadmeUnavailable({
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      ),
    );
    for (const rule of rules) {
      const text = `${rule.description}\n${rule.body ?? ""}`;
      if (text.includes(README_START) || text.includes(README_END)) {
        return yield* ReadmeUnavailable.make({
          message: `${rule.id} has an adhere rules marker in its description or body; left the README unchanged.`,
        });
      }
    }
    const config = yield* lintConfigAt(root);
    const entries = lintEntries(config);
    const block = renderReadmeIndex(rules, config);
    const target = join(root, "README.md");
    const previous = (yield* readOptional(target)) ?? "";
    const next = yield* applyReadmeIndex(previous, block);
    const changed = next !== previous;
    if (changed) {
      yield* Effect.tryPromise({
        try: () => writeFile(target, next, "utf8"),
        catch: (cause) =>
          new ReadmeUnavailable({
            message: `Could not write ${target}: ${cause instanceof Error ? cause.message : String(cause)}`,
          }),
      });
    }
    const settings = entries.native.length + entries.custom.length;
    return {
      changed,
      message: `${changed ? "Updated" : "Unchanged"} README.md: ${rules.length} ${rules.length === 1 ? "rule" : "rules"}, ${settings} enabled lint ${settings === 1 ? "setting" : "settings"}.`,
    };
  });

/**
 * Refresh `root`'s index only when it is a shared repo, as an org push
 * discovered it. A legacy rules-only repo is left exactly as it was: no README
 * is invented. Returns whether the root is shared, so the caller stages
 * README.md only then. Malformed markers propagate and stop the push.
 */
export const refreshIndexIfShared = (root: string): Effect.Effect<boolean, ReadmeUnavailable> =>
  Effect.gen(function* () {
    if (!(yield* isSharedRepo(root))) return false;
    yield* refreshReadme(root);
    return true;
  });

/** Refresh a shared repo's README, refusing a directory that is not one. */
export const refreshSharedReadme = (
  root: string,
): Effect.Effect<ReadmeRefresh, ReadmeUnavailable> =>
  Effect.gen(function* () {
    if (!(yield* isSharedRepo(root))) {
      return yield* ReadmeUnavailable.make({
        message: `${root} is not a shared rules repo: package.json must export ${SHARED_LINT_EXPORT}, as adhere init --shared writes it.`,
      });
    }
    return yield* refreshReadme(root);
  });

const GITHUB_URL = /^(?:[^@/\s]+@)?github\.com(?::\d+)?[:/]([^/\s]+)\/([^/\s]+)$/;

/**
 * The shared rules repo a GitHub origin implies, as `owner/standards`, from the
 * forms an origin takes: `https://github.com/owner/repo.git`,
 * `git@github.com:owner/repo.git`, and `ssh://git@github.com/owner/repo.git`.
 * An origin on another host, or one that names no owner and repo, implies
 * none. The origin's repo is read for its owner alone: an org's shared rules
 * live in that org's `standards`, never in the consumer repo the origin names.
 */
export const standardsRepoOf = (url: string): string | undefined => {
  const path = url
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/\/+$/, "");
  const [, owner, named] = GITHUB_URL.exec(path) ?? [];
  const repo = named?.replace(/\.git$/, "");
  if (owner === undefined || repo === undefined) return undefined;
  return /^[\w.-]+$/.test(owner) && /^[\w.-]+$/.test(repo) ? `${owner}/standards` : undefined;
};

/**
 * This checkout's `origin` URL, trimmed, or undefined when git names none: no
 * origin, or a directory git does not see as a repo. Read from the config, not
 * `git remote get-url`, which applies `url.<base>.insteadOf` rewrites and so
 * would not say which GitHub repo the origin names.
 */
export const originUrlAt = (root: string): Effect.Effect<string | undefined> =>
  Effect.promise(() =>
    run("git", ["config", "--get", "remote.origin.url"], root, "").then(
      (url) => url.trim(),
      () => undefined,
    ),
  );

const git = (cwd: string, args: ReadonlyArray<string>) =>
  Effect.tryPromise({
    try: () => run("git", args, cwd, ""),
    catch: (cause) =>
      new ReadmeUnavailable({ message: cause instanceof Error ? cause.message : String(cause) }),
  });

/** What a remote refresh did: its README result, the repo, and the branch it pushed. */
export interface RemoteReadmeRefresh extends ReadmeRefresh {
  readonly repo: string;
  /** The review branch pushed with the new index, or undefined when it was unchanged. */
  readonly branch?: string;
}

/**
 * Refresh the README of `repo` from a clone of its default branch, and push the
 * change on a review branch for a pull request. Only README.md is committed,
 * nothing is pushed when the index is already current, and the clone is
 * temporary, so the checkout this was asked from is untouched. No `./oxlint`
 * export is needed: a rules-only repo has a README index too.
 */
export const refreshRemoteReadme = (
  repo: string,
): Effect.Effect<RemoteReadmeRefresh, ReadmeUnavailable> =>
  Effect.scoped(
    Effect.gen(function* () {
      const clone = yield* cloned({ repo, rule: "" }).pipe(
        Effect.mapError(
          (cause) =>
            new ReadmeUnavailable({
              message: `${cause instanceof Error ? cause.message : String(cause)}. Check that ${repo} exists and git can read it, or name another repo: adhere rules readme org/repo.`,
            }),
        ),
      );
      const refreshed = yield* refreshReadme(clone);
      if (!refreshed.changed) return { ...refreshed, repo };
      const branch = `adhere/readme-${Date.now()}`;
      yield* git(clone, ["switch", "--quiet", "--create", branch]);
      yield* git(clone, ["add", "--", "README.md"]);
      yield* git(clone, ["commit", "--quiet", "--message", "Refresh the shared README index"]);
      yield* git(clone, ["push", "--quiet", "origin", branch]);
      return { ...refreshed, repo, branch };
    }),
  );
