---
description: Defects are caught only at a system boundary for logging or shutdown, never in business logic.
---

```ts
// At app entry: if config fails, nothing can proceed
const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie);
  yield* Effect.log(`Starting on port ${config.port}`);
});
```
