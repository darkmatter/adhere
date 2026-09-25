import { matchesGlob } from "node:path";
import { Context, Effect, FileSystem, Layer, Path } from "effect";
import { ADHERE_DIRECTORY, SKIPPED_DIRECTORIES } from "#config.ts";
import type { ScannedFile } from "#models/Audit.ts";
import { WalkUnavailable } from "#models/Audit.ts";
import { walkFiles } from "#walk.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { clearingStatus, counted, countOf, Status } from "#services/Status.ts";

/** Walks the repository's TypeScript source, skipping what is not ours to read. */
export class SourceWalker extends Context.Service<
  SourceWalker,
  {
    /**
     * Every TypeScript file under the audit's roots, in directory order. A
     * file that cannot be read refuses the walk: a silent gap would report
     * a clean audit that was never complete.
     */
    readonly files: Effect.Effect<ReadonlyArray<ScannedFile>, WalkUnavailable>;
  }
>()("@drkmttr/adhere/services/SourceWalker") {}

/**
 * When the working directory is a darkmatter-style workspace, read these
 * trees. Otherwise read the working directory itself.
 */
const WORKSPACE_DIRS = ["agents", "apps", "packages"] as const;
/**
 * A path, relative to the root being read, through a skipped directory or
 * through `.adhere/`, whose files are rules and cache rather than source.
 * Relative, so the directories above the working directory never count.
 */
export const isInSkippedTree = (relative: string): boolean =>
  relative
    .split(/[\\/]/)
    .some((segment) => segment === ADHERE_DIRECTORY || SKIPPED_DIRECTORIES.has(segment));

/**
 * Whether a path, relative to the working directory, passes a run's filter.
 * A pattern is a glob; one starting with `!` leaves out what it matches. A
 * path passes when no `!` pattern matches it and either another pattern does
 * or there are none.
 */
export const passesFilter = (relative: string, patterns: ReadonlyArray<string>): boolean => {
  const path = relative.replaceAll("\\", "/");
  const matches = (pattern: string) => matchesGlob(path, pattern);
  const include = patterns.filter((pattern) => !pattern.startsWith("!"));
  const exclude = patterns
    .filter((pattern) => pattern.startsWith("!"))
    .map((pattern) => pattern.slice(1));
  return (include.length === 0 || include.some(matches)) && !exclude.some(matches);
};

const isInside = (file: string, root: string): boolean =>
  file === root || file.startsWith(`${root}/`);

const isScannable = (file: string, self: string): boolean =>
  file.endsWith(".ts") &&
  !file.endsWith(".d.ts") &&
  !file.endsWith(".test.ts") &&
  !file.endsWith("/adhere.config.ts") &&
  !file.endsWith("/.adhere.config.ts") &&
  // The audit's own detector patterns are data, not violations of themselves.
  !isInside(file, self);

const refused = (problem: { readonly message: string }): WalkUnavailable =>
  WalkUnavailable.make({ message: problem.message });

/** The walk yields paths relative to the root it read: root them. */
const rooted = (root: string, paths: ReadonlyArray<string>) => paths.map((rel) => `${root}/${rel}`);

/** Whether the walk reads into a directory: never a skipped tree, `.adhere/`, or `.git`. */
const entersForSource = (relative: string): boolean => {
  const name = relative.split("/").at(-1) ?? "";
  return !(SKIPPED_DIRECTORIES.has(name) || name === ADHERE_DIRECTORY || name === ".git");
};

/** A test on a path relative to the root being read: whether the run wants it. */
type Keep = (relative: string) => boolean;

/** What the root actually contains: only paths the audit reads. */
const scannable = (root: string, paths: ReadonlyArray<string>, self: string, keep: Keep) =>
  rooted(
    root,
    paths.filter((relative) => !isInSkippedTree(relative) && keep(relative)),
  ).filter((file) => isScannable(file, self));

/** One root's files, filtered to what the audit reads. `label` names the root on the status line. */
const listRoot = Effect.fn("SourceWalker.listRoot")(function* (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  root: string,
  label: string,
  self: string,
  keep: Keep,
) {
  const status = yield* Status;
  const paths = yield* walkFiles(fs, path, root, entersForSource, (directories, found) =>
    status.show(
      `Listing ${label}: ${countOf(directories, "directory", "directories")}, ${countOf(found, "file", "files")}`,
    ),
  );
  const files = scannable(root, paths, self, keep);
  yield* Effect.logDebug(
    `listed ${root}: ${paths.length} files, ${files.length} source files to read`,
  );
  return files;
});

/** One scannable path, read into lines. */
const readFile = Effect.fn("SourceWalker.readFile")((fs: FileSystem.FileSystem, path: string) =>
  Effect.map(fs.readFileString(path), (content): ScannedFile => ({
    path,
    lines: content.split("\n"),
  })).pipe(Effect.tap((file) => Effect.logTrace(`read ${path}: ${file.lines.length} lines`))),
);

/** Reads a root's paths, several at a time, keeping their order, and counts them on the status line. */
const readEach = Effect.fn("SourceWalker.readEach")(function* (
  fs: FileSystem.FileSystem,
  label: string,
  paths: ReadonlyArray<string>,
) {
  const status = yield* Status;
  let read = 0;
  return yield* Effect.forEach(
    paths,
    (path: string) =>
      readFile(fs, path).pipe(
        Effect.tap(() => {
          read += 1;
          return status.show(
            `Reading ${label}: ${counted(read)} of ${countOf(paths.length, "file", "files")}`,
          );
        }),
      ),
    { concurrency: 16 },
  );
});

/** One root's files, in path order: read every scannable path. */
const readRoot = Effect.fn("SourceWalker.readRoot")(
  (
    fs: FileSystem.FileSystem,
    path: Path.Path,
    root: string,
    label: string,
    self: string,
    keep: Keep,
  ) =>
    Effect.flatMap(listRoot(fs, path, root, label, self, keep), (paths) =>
      readEach(fs, label, paths),
    ),
);

/**
 * Workspace trees that exist under the working directory. An ordinary repo,
 * with none of them, is read from its root.
 */
const scanDirs = Effect.fn("SourceWalker.scanDirs")(function* (
  fs: FileSystem.FileSystem,
  root: string,
) {
  const found = yield* Effect.forEach(WORKSPACE_DIRS, (dir) =>
    Effect.map(fs.exists(`${root}/${dir}`), (exists) => (exists ? dir : undefined)),
  );
  const present = found.filter((dir): dir is (typeof WORKSPACE_DIRS)[number] => dir !== undefined);
  return present.length > 0 ? present : ["."];
});

/**
 * The real walker: the roots walked a directory at a time, skipped trees
 * left unread, each file read and split into lines. The run's filter and the
 * config's `exclude` leave out what they match. Tests substitute their own
 * tree.
 * The scan root is the current working directory, so the audit reads the
 * repository it is run in.
 */
export const SourceWalkerLive = (filter: ReadonlyArray<string> = []) =>
  Layer.effect(SourceWalker)(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const config = yield* AdhereConfig;
      // No segments: Path resolves against the working directory.
      const root = path.resolve();
      const self = yield* path.fromFileUrl(new URL("../../", import.meta.url)).pipe(Effect.orDie);
      const patterns = [...filter, ...(config.exclude ?? []).map((glob) => `!${glob}`)];
      const walk = Effect.fn("SourceWalker.files")(function* () {
        const dirs = yield* scanDirs(fs, root).pipe(Effect.mapError(refused));
        const trees = yield* clearingStatus(
          Effect.forEach(dirs, (dir) =>
            readRoot(
              fs,
              path,
              path.join(root, dir),
              dir === "." ? "the working directory" : `${dir}/`,
              self,
              (relative) =>
                // Patterns are relative to the working directory, not the tree read.
                passesFilter(dir === "." ? relative : `${dir}/${relative}`, patterns),
            ).pipe(Effect.mapError(refused)),
          ),
        );
        return trees.flat();
      });
      return SourceWalker.of({ files: walk() });
    }),
  );
