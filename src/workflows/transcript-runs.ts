import { sha256 } from "#services/AuditCache.ts";
import { Effect, FileSystem, Path } from "effect";
import { tmpdir } from "node:os";

/**
 * The project's folder under this user's adhere folder in the temp directory,
 * made for the user alone if it is missing. A transcript can hold whatever an
 * agent read or ran, secrets included, so what adhere keeps of it stays out of
 * the repo; docs/decisions.md, "The last transcript checks stay in the temp
 * directory", says why. adhere does not check who owns or can open a folder
 * that is already there.
 */
export const projectTemp = Effect.fn("transcript.projectTemp")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  // Users who share the temp directory each get an adhere folder. Windows has no user IDs, and
  // gives each user a temp directory of their own.
  const uid = process.getuid?.();
  const base = path.join(tmpdir(), uid === undefined ? "adhere" : `adhere-${uid}`);
  const project = path.join(base, `${path.basename(root)}-${(yield* sha256(root)).slice(0, 12)}`);
  yield* fs.makeDirectory(project, { recursive: true, mode: 0o700 });
  return project;
});

/** A run folder's name: its ISO time with `:` as `-`, and the process ID. */
const RUN_NAME = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z-\d+$/;

/**
 * Keeps a check's `files` in a folder of their own under the project's
 * `runs/`, then removes all but the newest `keep` of them. Returns the new
 * folder, which `keep` 0 leaves out, and which a newer check may already have
 * pruned.
 */
export const saveRun = Effect.fn("transcript.saveRun")(function* (
  project: string,
  keep: number,
  files: Readonly<Record<string, string>>,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const runs = path.join(project, "runs");
  // Named by the time, which sorts them oldest first, and the process, which checks at once differ by.
  const run = path.join(runs, `${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`);
  yield* fs.makeDirectory(keep > 0 ? run : runs, { recursive: true, mode: 0o700 });
  if (keep > 0) {
    for (const [name, text] of Object.entries(files)) {
      // A newer check may prune this run while it is written, as `keep` asks.
      yield* fs
        .writeFileString(path.join(run, name), text, { mode: 0o600 })
        .pipe(Effect.catchReason("PlatformError", "NotFound", () => Effect.void));
    }
  }
  // Only folders named as runs are pruned, so a `runs` that is not adhere's loses nothing else.
  const names = (yield* fs.readDirectory(runs)).filter((name) => RUN_NAME.test(name)).sort();
  // A check running at the same time may remove the same folder first.
  for (const name of names.slice(0, Math.max(0, names.length - keep))) {
    yield* fs.remove(path.join(runs, name), { recursive: true, force: true });
  }
  return keep > 0 ? run : undefined;
});
