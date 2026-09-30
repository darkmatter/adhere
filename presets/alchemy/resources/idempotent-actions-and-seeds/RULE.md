---
description: An Action body and a SQL file listed in importFiles must be safe to run again, using IF NOT EXISTS, ON CONFLICT, or upserts, never one-shot inserts or calls that duplicate data or fail when an interrupted deploy retries them.
---

## Must

```ts
export const Migrate = Alchemy.Action("Migrate", Effect.fn(function* () {
  const db = yield* D1Client;
  yield* db.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT)");
  yield* db.exec("INSERT INTO users (id, name) VALUES ('admin', 'Admin') ON CONFLICT (id) DO NOTHING");
}));
```

## Never

```ts
export const Seed = Alchemy.Action("Seed", Effect.fn(function* () {
  const db = yield* D1Client;
  yield* db.exec("CREATE TABLE users (id TEXT, name TEXT)");
  yield* db.exec("INSERT INTO users VALUES ('admin', 'Admin')"); // a second admin on every retry
}));
```
