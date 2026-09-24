import { Effect, type FileSystem, type Path, type PlatformError } from "effect";

/** A directory entry, as the walk sorts it: a file to list, a directory to read, or neither. */
type Entry =
  | { readonly kind: "file"; readonly relative: string }
  | { readonly kind: "directory"; readonly relative: string }
  | { readonly kind: "skipped" };

const skipped: Entry = { kind: "skipped" };

/**
 * Every file under `root`, each as a path relative to it with `/` between
 * segments, sorted. `enter` says, of each directory below the root by its
 * relative path, whether to read into it, so a walk never lists what it would
 * throw away.
 *
 * A directory reached through a symbolic link is never entered: pnpm's
 * `node_modules` links packages into one another, and following the links
 * lists every path through the dependency graph. A recursive `readdir` does
 * follow them; on alchemy's checkout it passed 160 GB before the kernel
 * killed it. A symbolic link to a file is listed like the file, and a link
 * to nothing is left out.
 */
export const walkFiles = Effect.fn("walkFiles")(function* (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  root: string,
  enter: (relative: string) => boolean,
) {
  const entryOf = (relative: string): Effect.Effect<Entry, PlatformError.PlatformError> => {
    const full = path.join(root, relative);
    return fs.stat(full).pipe(
      Effect.flatMap((info): Effect.Effect<Entry> => {
        if (info.type !== "Directory") return Effect.succeed({ kind: "file", relative });
        if (!enter(relative)) return Effect.succeed(skipped);
        // Only a link can be read as one, so a failed read is a real directory.
        return fs.readLink(full).pipe(
          Effect.match({
            onFailure: (): Entry => ({ kind: "directory", relative }),
            onSuccess: (): Entry => skipped,
          }),
        );
      }),
      Effect.catchIf(
        (problem) => problem.reason._tag === "NotFound",
        () => Effect.succeed(skipped),
      ),
    );
  };

  const files: Array<string> = [];
  let level: ReadonlyArray<string> = [""];
  while (level.length > 0) {
    const entries = yield* Effect.forEach(
      level,
      (directory) =>
        Effect.flatMap(
          fs.readDirectory(directory === "" ? root : path.join(root, directory)),
          (names) =>
            Effect.forEach(
              names,
              (name) => entryOf(directory === "" ? name : `${directory}/${name}`),
              { concurrency: 16 },
            ),
        ),
      { concurrency: 8 },
    );
    const next: Array<string> = [];
    for (const entry of entries.flat()) {
      if (entry.kind === "file") files.push(entry.relative);
      else if (entry.kind === "directory") next.push(entry.relative);
    }
    level = next;
  }
  return files.sort();
});
