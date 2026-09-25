# alchemy/resources/idempotent-actions-and-seeds

An Action body and a SQL file listed in importFiles must be safe to run again, using IF NOT EXISTS, ON CONFLICT, or upserts, never one-shot inserts or calls that duplicate data or fail when an interrupted deploy retries them.

1 finding, at 0.79. It showed this hint:

```ts
export const Migrate = Alchemy.Action("Migrate", Effect.fn(function* () {
  const db = yield* D1Client;
  yield* db.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT)");
  yield* db.exec("INSERT INTO users (id, name) VALUES ('admin', 'Admin') ON CONFLICT (id) DO NOTHING");
}));
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations-upgrade/worker.ts:31:13
   7 │ class UpgradeObject extends Cloudflare.DurableObject<UpgradeObject>()(
   8 │   "SqlMigrationUpgradeObject",
   9 │   Effect.gen(function* () {
  10 │     const dir = yield* Config.String("SQL_MIGRATIONS_DIRECTORY").pipe(
  11 │       Effect.orDie,
  12 │     );
  13 │     const migrations = yield* Cloudflare.SqlMigrations(dir);
  14 │     return Effect.gen(function* () {
  15 │       const state = yield* Cloudflare.DurableObjectState;
  16 │       yield* migrations.apply().pipe(Effect.orDie);
  17 │       return {
  18 │         inspect: () =>
  19 │           Effect.gen(function* () {
  20 │             const rows = yield* state.storage.sql
  21 │               .exec<{ value: string }>("SELECT value FROM items ORDER BY rowid")
  22 │               .pipe(Effect.flatMap((cursor) => cursor.toArray()));
  23 │             return {
  24 │               id: state.id.toString(),
  25 │               count: migrations.records.length,
  26 │               rows,
  27 │             };
  28 │           }),
  29 │         insert: () =>
  30 │           state.storage.sql
> 31 │             .exec("INSERT INTO items VALUES ('user-data')")
  32 │             .pipe(Effect.asVoid),
  33 │       };
  34 │     });
  35 │   }),
  36 │ ) {}
```
