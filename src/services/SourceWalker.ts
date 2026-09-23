import { Context, Effect, FileSystem, Layer, Path } from "effect";
import type { ScannedFile } from "#models/Audit.ts";
import { WalkUnavailable } from "#models/Audit.ts";

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
/** Path fragments that mark generated, vendored, or dependency trees. */
const SKIPS = [
  "/node_modules/",
  "/.adhere/",
  "/dist/",
  "/.agents/",
  "/.claude/",
  "/.direnv/",
  "/.alchemy/",
  "/coverage/",
  "/.vite/",
  "/references/",
  "/vendor/",
  "/e2e/",
] as const;

const isInside = (file: string, root: string): boolean =>
  file === root || file.startsWith(`${root}/`);

const isScannable = (file: string, self: string): boolean =>
  file.endsWith(".ts") &&
  !file.endsWith(".d.ts") &&
  !file.endsWith(".test.ts") &&
  !file.endsWith("/adhere.config.ts") &&
  !file.endsWith("/.adhere.config.ts") &&
  SKIPS.every((skip) => !file.includes(skip)) &&
  // The audit's own detector patterns are data, not violations of themselves.
  !isInside(file, self);

const refused = (problem: { readonly message: string }): WalkUnavailable =>
  WalkUnavailable.make({ message: problem.message });

/** `readdir(recursive)` yields paths relative to the root it read: root them. */
const rooted = (root: string, paths: ReadonlyArray<string>) => paths.map((rel) => `${root}/${rel}`);

/** What the root actually contains: only paths the audit reads. */
const scannable = (root: string, paths: ReadonlyArray<string>, self: string) =>
  rooted(root, paths).filter((file) => isScannable(file, self));

/** One root's paths, filtered to what the audit reads. */
const listRoot = Effect.fn("SourceWalker.listRoot")(
  (fs: FileSystem.FileSystem, root: string, self: string) =>
    Effect.map(fs.readDirectory(root, { recursive: true }), (paths) =>
      scannable(root, paths, self),
    ),
);

/** One scannable path, read into lines. */
const readFile = Effect.fn("SourceWalker.readFile")((fs: FileSystem.FileSystem, path: string) =>
  Effect.map(fs.readFileString(path), (content): ScannedFile => ({
    path,
    lines: content.split("\n"),
  })),
);

/** Read a batch of paths; the inner loop hoisted out of `forEach`. */
const readEach = (fs: FileSystem.FileSystem, paths: ReadonlyArray<string>) =>
  Effect.forEach(paths, (path: string) => readFile(fs, path));

/** One root's files, in directory order: read every scannable path. */
const readRoot = Effect.fn("SourceWalker.readRoot")(
  (fs: FileSystem.FileSystem, root: string, self: string) =>
    Effect.flatMap(listRoot(fs, root, self), (paths) => readEach(fs, paths)),
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
 * The real walker: `FileSystem.readDirectory` recursively over the roots,
 * each file read and split into lines. Tests substitute their own tree.
 * The scan root is the current working directory, so the audit reads the
 * repository it is run in.
 */
export const SourceWalkerLive = Layer.effect(SourceWalker)(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    // No segments: Path resolves against the working directory.
    const root = path.resolve();
    const self = yield* path.fromFileUrl(new URL("../../", import.meta.url)).pipe(Effect.orDie);
    const walk = Effect.fn("SourceWalker.files")(function* () {
      const dirs = yield* scanDirs(fs, root).pipe(Effect.mapError(refused));
      const trees = yield* Effect.forEach(dirs, (dir) =>
        readRoot(fs, path.join(root, dir), self).pipe(Effect.mapError(refused)),
      );
      return trees.flat();
    });
    return SourceWalker.of({ files: walk() });
  }),
);
