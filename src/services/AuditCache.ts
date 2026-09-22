import {
  Context,
  Crypto,
  Effect,
  FileSystem,
  Layer,
  Path,
  Schema,
} from "effect";
import { cwd } from "node:process";
import { Verdict } from "#models/Judge.ts";
import { detectors } from "#services/detectors.ts";

/** One file's remembered judgment: content hash, topics covered, verdicts. */
export const CacheEntry = Schema.Struct({
  hash: Schema.String,
  topics: Schema.Array(Schema.String),
  verdicts: Schema.Array(Verdict),
});
export interface CacheEntry extends Schema.Schema.Type<typeof CacheEntry> {}

/** The single cache file: a ruleset fingerprint plus one entry per path. */
const CacheDocument = Schema.Struct({
  ruleset: Schema.String,
  files: Schema.Record(Schema.String, CacheEntry),
});

const decodeDocument = Schema.decodeUnknownEffect(
  Schema.fromJsonString(CacheDocument),
);
const encodeDocument = Schema.encodeEffect(
  Schema.fromJsonString(CacheDocument),
);

const emptyDocument: typeof CacheDocument.Type = {
  ruleset: "",
  files: {},
};

const hexOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** SHA-256 of one file's text. The cache key, together with the path. */
export const contentHash = Effect.fn("AuditCache.contentHash")(function* (
  lines: ReadonlyArray<string>,
) {
  const crypto = yield* Crypto.Crypto;
  const digest = yield* crypto
    .digest("SHA-256", new TextEncoder().encode(lines.join("\n")))
    .pipe(Effect.orDie);
  return hexOf(digest);
});

/**
 * Persistent judgment cache. One JSON file records, per path, the content
 * hash and the verdicts already returned for that text.
 */
export class AuditCache extends Context.Service<
  AuditCache,
  {
    /** The stored entry for one path, when this ruleset has one. */
    readonly get: (path: string) => CacheEntry | undefined;
    /** Remember one file's entry. Written to disk by `save`. */
    readonly put: (path: string, entry: CacheEntry) => Effect.Effect<void>;
    /** Write the whole cache back to its single JSON file. */
    readonly save: Effect.Effect<void>;
  }
>()("@darkmatter/effect-audit/services/AuditCache") {}

/**
 * The real cache: `.effect-audit-cache.json` in the working directory. A
 * missing or unreadable file starts empty; a ruleset mismatch drops stored
 * entries.
 */
export const AuditCacheLive = Layer.effect(AuditCache)(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const file = path.join(path.resolve(cwd()), ".effect-audit-cache.json");
    const ruleset = yield* contentHash(
      detectors.flatMap((each) => each.descriptions),
    );
    const loaded = yield* fs.readFileString(file).pipe(
      Effect.flatMap(decodeDocument),
      Effect.orElseSucceed(() => emptyDocument),
    );
    const stored = loaded.ruleset === ruleset ? loaded.files : {};
    const files = new Map(Object.entries(stored));
    const get = (entryPath: string) => files.get(entryPath);
    const put = (entryPath: string, entry: CacheEntry) =>
      Effect.sync(() => {
        files.set(entryPath, entry);
      });
    const save = Effect.gen(function* () {
      const body = yield* encodeDocument({
        ruleset,
        files: Object.fromEntries(files),
      }).pipe(Effect.orDie);
      yield* fs.writeFileString(file, `${body}\n`).pipe(Effect.ignore);
    });
    return AuditCache.of({ get, put, save });
  }),
);
