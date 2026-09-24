---
description: Service code should reach its database through the bound private connection, and should not use the public connection URI or TCP proxy, which is meant for laptops and CI.
---

```ts should
const conn = yield* Railway.ConnectPostgres(Db);
const db = yield* Drizzle.Postgres(conn.connectionString);
```

```ts should not
const db = yield* Drizzle.Postgres(Db.publicConnectionUri);
```
