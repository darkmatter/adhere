---
description: A Config default or fallback used by a runtime must be deterministic, because it is evaluated at deploy time and at runtime, never computed from the clock, randomness, or per-process values.
---

## Must

```ts
const port = yield* Config.Number("PORT").pipe(Config.withDefault(3000));
const region = yield* Config.String("REGION").pipe(Config.withDefault("us-east-1"));
```

## Never

```ts
const instanceId = yield* Config.String("INSTANCE_ID").pipe(Config.withDefault(crypto.randomUUID()));
const startedAt = yield* Config.String("STARTED_AT").pipe(Config.withDefault(new Date().toISOString()));
```
