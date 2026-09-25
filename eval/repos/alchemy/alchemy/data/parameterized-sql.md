# alchemy/data/parameterized-sql

SQL must pass values as parameters, through tagged-template interpolation, sql.in, sql.insert, or prepare().bind(), never by string concatenation or a template string handed to an unsafe or raw API.

5 findings, from 0.88 down to 0.72. Each showed this hint:

```ts
const user = yield* sql`SELECT * FROM users WHERE email = ${email}`;
const row = yield* Effect.promise(() => d1.prepare("SELECT * FROM users WHERE id = ?").bind(id).first());
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.88 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:181:13
  178 │         if (request.method === "POST" && pathname === "/query") {
  179 │           const described = yield* describeAsset();
  180 │           const result = yield* executeQuery({
> 181 │             queryStatement: `SELECT asset_id, asset_name FROM asset WHERE asset_id = '${described.assetId}'`,
  182 │           });
  183 │           return yield* HttpServerResponse.json({
  184 │             ok: true,
  185 │             rowCount: result.rows?.length ?? 0,
  186 │           });
  187 │         }

0.87 packages/alchemy/test/AWS/Timestream/sink-handler.ts:100:13
   97 │         if (request.method === "GET" && pathname === "/count") {
   98 │           const host = new URL(request.originalUrl).searchParams.get("host");
   99 │           const result = yield* query({
> 100 │             QueryString: `SELECT COUNT(*) AS c FROM "${DatabaseName}"."${TableName}" WHERE host = '${host}'`,
  101 │           });
  102 │           return yield* HttpServerResponse.json({ rows: result.Rows });
  103 │         }

0.77 packages/alchemy/src/SQL/Migrations/AlchemyFormat.ts:98:7
  95 │     const dialect = executor.dialect;
  96 │     const quoted = quoteIdentifier(table, dialect);
  97 │     const rows = yield* executor.query(
> 98 │       `SELECT ${nameExpr} AS name, applied_at FROM ${quoted} ORDER BY id;`,
  99 │     );

0.76 packages/alchemy/src/SQL/Migrations/Convert.ts:89:11
   87 │       if (classifyTable(columns) === "drizzle-shaped") {
   88 │         const rows = yield* executor.query(
>  89 │           `SELECT hash, created_at, name, applied_at FROM ${qualify("__drizzle_migrations", dialect, drizzleSchema)} ORDER BY id;`,
   90 │         );
   91 │         return {
   92 │           tool: "drizzle" as const,
   93 │           source: drizzleSchema
   94 │             ? `${drizzleSchema}.__drizzle_migrations`
   95 │             : "__drizzle_migrations",
   96 │           rows: rows
   97 │             .filter((row) => row.name !== null && row.name !== undefined)
   98 │             .map((row) => ({
   99 │               name: String(row.name),
  100 │               hash:
  101 │                 row.hash === null || row.hash === undefined
  102 │                   ? undefined
  103 │                   : String(row.hash),
  104 │               createdAtMillis:
  105 │                 row.created_at === null || row.created_at === undefined
  106 │                   ? undefined
  107 │                   : Number(row.created_at),
  108 │               appliedAt: toTimestampString(row.applied_at),
  109 │             })),
  110 │         };
  111 │       }

0.72 packages/cloudflare-runtime/src/core/bindings/d1/D1.worker.ts:360:5
> 360 │     const select = `SELECT ${columns.map((c) => escapeId(c.name)).join(", ")} FROM ${escapeId(table)};`;
  361 │     const rowsCursor = db.exec(select);
  362 │     const columnNames = columns.map((c) => escapeId(c.name)).join(",");
```
