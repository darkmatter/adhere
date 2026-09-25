# alchemy/data/private-endpoint-at-runtime

Service code should reach its database through the bound private connection, and should not use the public connection URI or TCP proxy, which is meant for laptops and CI.

2 findings, from 0.76 down to 0.74. Each showed this hint:

```ts
const conn = yield* Railway.ConnectPostgres(Db);
const db = yield* Drizzle.Postgres(conn.connectionString);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.76 packages/cloudflare-runtime/src/rolldown/test/fixtures/regression/mysql2.ts:9:5
   7 │ export default {
   8 │   fetch(_request: Request, env: Env) {
>  9 │     const db = mysql2.createConnection(env.DATABASE_URL);
  10 │     const result = db.execute("SELECT 1");
  11 │     return Response.json(result);
  12 │   },
  13 │ };

0.74 packages/alchemy/test/Fly/fixtures/postgres-api.ts:42:5
  39 │   Effect.gen(function* () {
  40 │     const conn = yield* Fly.ConnectPostgres(Db);
  41 │     const db = yield* Drizzle.Postgres(conn.connectionString);
> 42 │     const direct = yield* Drizzle.Postgres(conn.directConnectionString);
```
