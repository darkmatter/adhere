import { Verdict } from "#models/Judge.ts";
import { describeRule } from "#rules.ts";
import { Rules } from "#services/Rules.ts";
import { Context, Crypto, Effect, Layer, Option, Path, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

/** One file's remembered judgment: content hash, topics covered, verdicts. */
export const CacheEntry = Schema.Struct({
  hash: Schema.String,
  topics: Schema.Array(Schema.String),
  verdicts: Schema.Array(Verdict),
});
export interface CacheEntry extends Schema.Schema.Type<typeof CacheEntry> { }

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

/** Key under which the ruleset fingerprint is stored, apart from file entries. */
const RULESET_KEY = "ruleset";
/** Prefix for file entries, so a path cannot collide with the ruleset key. */
const ENTRY_PREFIX = "entry/";
/** Directory of one file per key, in the working directory. */
const CACHE_DIRECTORY = ".adhere-cache";

/**
 * Persistent judgment cache. A filesystem `KeyValueStore` records, per path,
 * the content hash and the verdicts already returned for that text.
 */
export class AuditCache extends Context.Service<
  AuditCache,
  {
    /** The stored entry for one path, when this ruleset has one. */
    readonly get: (path: string) => Effect.Effect<CacheEntry | undefined>;
    /** Remember one file's entry. A failed write does not fail the audit. */
    readonly put: (
      path: string,
      entry: CacheEntry,
    ) => Effect.Effect<void>;
  }
>()("@darkmatter/adhere/services/AuditCache") { }

/** The store inside a built key-value layer. */
const storeOf = (
  context: Context.Context<KeyValueStore.KeyValueStore>,
): KeyValueStore.KeyValueStore =>
  Context.get(context, KeyValueStore.KeyValueStore);

/**
 * The filesystem store, or an empty memory store when the directory cannot
 * be opened. A cache problem must not fail the audit.
 */
const openStore = Effect.fn("AuditCache.openStore")(function* (
  directory: string,
) {
  return yield* Layer.build(KeyValueStore.layerFileSystem(directory)).pipe(
    Effect.catchCause(() => Layer.build(KeyValueStore.layerMemory)),
  );
});

/** Drop stored entries when the ruleset fingerprint has changed. */
const alignRuleset = Effect.fn("AuditCache.alignRuleset")(function* (
  store: KeyValueStore.KeyValueStore,
  ruleset: string,
) {
  const stored = yield* store
    .get(RULESET_KEY)
    .pipe(Effect.orElseSucceed(() => undefined));
  if (stored === ruleset) return store;
  yield* store.clear;
  yield* store.set(RULESET_KEY, ruleset);
  return store;
});

/** A fresh memory store stamped with the current ruleset. */
const memoryStore = Effect.fn("AuditCache.memoryStore")(function* (
  ruleset: string,
) {
  const store = storeOf(yield* Layer.build(KeyValueStore.layerMemory));
  yield* store.set(RULESET_KEY, ruleset);
  return store;
});

/**
 * The real cache: `.adhere-cache/` in the working directory. A missing
 * directory starts empty; a ruleset mismatch drops stored entries.
 */
export const AuditCacheLive = Layer.effect(AuditCache)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const catalog = yield* Rules;
    // No segments: Path resolves against the working directory.
    const directory = path.join(path.resolve(), CACHE_DIRECTORY);
    const ruleset = yield* contentHash([
      ...catalog.rules.map(describeRule),
      // Line tests decide their own findings. Jev is only asked a rule that has no line test.
      "rules-from-adhere-config",
    ]);
    const opened = storeOf(yield* openStore(directory));
    const store = yield* alignRuleset(opened, ruleset).pipe(
      Effect.catchCause(() => memoryStore(ruleset)),
    );
    const entries = KeyValueStore.toSchemaStore(
      KeyValueStore.prefix(store, ENTRY_PREFIX),
      CacheEntry,
    );
    const get = (filePath: string) =>
      entries.get(filePath).pipe(
        Effect.map(Option.getOrUndefined),
        Effect.orElseSucceed(() => undefined),
      );
    const put = (filePath: string, entry: CacheEntry) =>
      entries.set(filePath, entry).pipe(Effect.ignore);
    return AuditCache.of({ get, put });
  }),
);
