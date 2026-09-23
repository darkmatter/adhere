import { CACHE_DIRECTORY } from "#config.ts";
import { Context, Crypto, Effect, Layer, Option, Path, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

/**
 * Entries written before the report read its excerpt from the file also hold
 * the line's text, as `snippet`; decoding drops it, so they stay valid.
 */
export const Judgment = Schema.Struct({
  fingerprint: Schema.String,
  probability: Schema.Finite,
  line: Schema.optionalKey(Schema.Finite),
});
export interface Judgment extends Schema.Schema.Type<typeof Judgment> {}

export const CacheEntry = Schema.Struct({
  hash: Schema.String,
  judgments: Schema.Record(Schema.String, Judgment),
});
export interface CacheEntry extends Schema.Schema.Type<typeof CacheEntry> {}

/**
 * A rule's linter check so far: per file lint asked it on, Jev's probability
 * that a regular linter could have decided the file against the rule.
 */
export const Tally = Schema.Struct({
  files: Schema.Record(Schema.String, Schema.Finite),
});
export interface Tally extends Schema.Schema.Type<typeof Tally> {}

const hexOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const sha256 = Effect.fn("AuditCache.sha256")(function* (text: string) {
  const crypto = yield* Crypto.Crypto;
  const digest = yield* crypto.digest("SHA-256", new TextEncoder().encode(text)).pipe(Effect.orDie);
  return hexOf(digest);
});

export class AuditCache extends Context.Service<
  AuditCache,
  {
    readonly get: (path: string) => Effect.Effect<CacheEntry | undefined>;
    readonly put: (path: string, entry: CacheEntry) => Effect.Effect<void>;
    /** A rule's tally, under a key that changes with the rule's text. */
    readonly tally: (key: string) => Effect.Effect<Tally | undefined>;
    readonly putTally: (key: string, tally: Tally) => Effect.Effect<void>;
  }
>()("@drkmttr/adhere/services/AuditCache") {}

const openStore = Effect.fn("AuditCache.openStore")(function* (directory: string) {
  const context = yield* Layer.build(KeyValueStore.layerFileSystem(directory)).pipe(
    Effect.catchCause(() => Layer.build(KeyValueStore.layerMemory)),
  );
  return Context.get(context, KeyValueStore.KeyValueStore);
});

export const AuditCacheLive = Layer.effect(AuditCache)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const store = yield* openStore(path.join(path.resolve(), CACHE_DIRECTORY));
    const entries = KeyValueStore.toSchemaStore(store, CacheEntry);
    const tallies = KeyValueStore.toSchemaStore(store, Tally);
    const crypto = yield* Crypto.Crypto;
    // Hashed keys: a raw path would name the cache file like a source file.
    const keyOf = (filePath: string) =>
      sha256(filePath).pipe(Effect.provideService(Crypto.Crypto, crypto));
    return AuditCache.of({
      get: (filePath) =>
        Effect.flatMap(keyOf(filePath), (key) => entries.get(key)).pipe(
          Effect.map(Option.getOrUndefined),
          Effect.orElseSucceed(() => undefined),
        ),
      put: (filePath, entry) =>
        Effect.flatMap(keyOf(filePath), (key) => entries.set(key, entry)).pipe(Effect.ignore),
      // Under a prefix no path starts with, so a tally never lands on a file's entry.
      tally: (key) =>
        Effect.flatMap(keyOf(`\u0000tally\u0000${key}`), (stored) => tallies.get(stored)).pipe(
          Effect.map(Option.getOrUndefined),
          Effect.orElseSucceed(() => undefined),
        ),
      putTally: (key, tally) =>
        Effect.flatMap(keyOf(`\u0000tally\u0000${key}`), (stored) =>
          tallies.set(stored, tally),
        ).pipe(Effect.ignore),
    });
  }),
);
