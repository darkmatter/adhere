---
description: A typed error must be for a failure the caller can handle. A bug or invariant violation must be a defect, never a typed error.
---

## Must

```ts
const recovered: Effect.Effect<string, ValidationError> = program.pipe(
  Effect.catchTag("HttpError", (error) =>
    Effect.gen(function* () {
      yield* Effect.logWarning(`HTTP ${error.statusCode}: ${error.message}`);
      return "Recovered from HttpError";
    }),
  ),
);

const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie);
  yield* Effect.log(`Starting on port ${config.port}`);
});
```

## Never

```ts
class CacheCorrupted extends Schema.TaggedError<CacheCorrupted>()("CacheCorrupted", {
  key: Schema.String,
}) {}

const entry = yield* cache.get(key);
if (entry !== undefined && entry.key !== key) {
  return yield* new CacheCorrupted({ key });
}
```
