---
description: Defects must be caught only at a system boundary for logging or shutdown, never in business logic.
---

```ts must
// At app entry: if config fails, nothing can proceed
const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie);
  yield* Effect.log(`Starting on port ${config.port}`);
});
```

```ts never
const price = computePrice(cart).pipe(Effect.catchDefect(() => Effect.succeed(0)));
```
