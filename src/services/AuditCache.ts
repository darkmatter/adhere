import { CACHE_DIRECTORY } from "#config.ts";
import { Context, Crypto, Effect, Layer, Option, Path, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

export const Judgment = Schema.Struct({
  fingerprint: Schema.String,
  probability: Schema.Finite,
  line: Schema.optionalKey(Schema.Finite),
  snippet: Schema.optionalKey(Schema.String),
});
export interface Judgment extends Schema.Schema.Type<typeof Judgment> {}

export const CacheEntry = Schema.Struct({
  hash: Schema.String,
  judgments: Schema.Record(Schema.String, Judgment),
});
export interface CacheEntry extends Schema.Schema.Type<typeof CacheEntry> {}

const hexOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const sha256 = Effect.fn("AuditCache.sha256")(function* (text: string) {
  const crypto = yield* Crypto.Crypto;
  const digest = yield* crypto
    .digest("SHA-256", new TextEncoder().encode(text))
    .pipe(Effect.orDie);
  return hexOf(digest);
});

export class AuditCache extends Context.Service<
  AuditCache,
  {
    readonly get: (path: string) => Effect.Effect<CacheEntry | undefined>;
    readonly put: (path: string, entry: CacheEntry) => Effect.Effect<void>;
  }
>()("@darkmatter/adhere/services/AuditCache") {}

const openStore = Effect.fn("AuditCache.openStore")(function* (
  directory: string,
) {
  const context = yield* Layer.build(
    KeyValueStore.layerFileSystem(directory),
  ).pipe(Effect.catchCause(() => Layer.build(KeyValueStore.layerMemory)));
  return Context.get(context, KeyValueStore.KeyValueStore);
});

export const AuditCacheLive = Layer.effect(AuditCache)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const store = yield* openStore(path.join(path.resolve(), CACHE_DIRECTORY));
    const entries = KeyValueStore.toSchemaStore(store, CacheEntry);
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
        Effect.flatMap(keyOf(filePath), (key) => entries.set(key, entry)).pipe(
          Effect.ignore,
        ),
    });
  }),
);
