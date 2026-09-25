---
description: A custom provider, credentials, or state-store Layer must defer resolving credentials and opening connections until an operation runs, never resolving credentials, connecting, or prompting while the Layer is built, because every CLI command builds it.
---

## Must

```ts
export const PostgresState = Layer.effect(State, Effect.cached(makePostgresState(props)));
```

## Never

```ts
export const PostgresState = Layer.effect(State, Effect.gen(function* () {
  const sql = postgres(process.env.DATABASE_URL!); // connects on every CLI command
  return makeState(sql);
}));
```
