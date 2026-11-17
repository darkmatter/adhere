---
description: Service code should reach its database through the bound private connection, and should not use the public connection URI or TCP proxy, which is meant for laptops and CI.
include: {"names": ["*.ts", "*.tsx", "*.mts", "*.cts"]}
---

## Should

```ts
const conn = yield* Railway.ConnectPostgres(Db);
const db = yield* Drizzle.Postgres(conn.connectionString);
```

## Should not

```ts
const db = yield* Drizzle.Postgres(Db.publicConnectionUri);
```
