# alchemy/data/commit-migrations-then-deploy

Migrations must be generated and reviewed ahead of time, committed with the schema, and applied from the committed files; a deploy, deploy hook, or Action must never generate migration SQL, and schema changes must never run from an HTTP route.

26 findings, from 0.96 down to 0.73. Each showed this hint:

```ts
// package.json: "db:generate": "drizzle-kit generate" (run locally, then commit ./drizzle)
const db = yield* Cloudflare.D1.Database("AppDb", { migrations: "./drizzle" });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.96 packages/alchemy/test/Neon/fixtures/function-effect.ts:39:5
  36 │ export const nativeDiagnosticFetch = (request: Request) =>
  37 │   Effect.gen(function* () {
  38 │     const sql = yield* diagnosticSql;
> 39 │     yield* sql`CREATE TABLE IF NOT EXISTS alchemy_function_lifecycle (id text, phase text, PRIMARY KEY (id, phase))`;
  40 │     const url = yield* Effect.sync(() => new URL(request.url));
  41 │     const id = url.searchParams.get("id") ?? "native";

0.95 packages/alchemy/test/Cloudflare/D1/fixtures/async-worker.ts:22:9
  20 │     if (request.method === "POST" && url.pathname === "/init") {
  21 │       const result = await db.exec(
> 22 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, style TEXT NOT NULL, name TEXT NOT NULL)",
  23 │       );
  24 │       return Response.json({ count: result.count, duration: result.duration });
  25 │     }

0.95 packages/alchemy/test/Cloudflare/D1/fixtures/d1-local-worker.ts:23:9
  20 │     const url = new URL(request.url);
  21 │     if (url.pathname === "/roundtrip") {
  22 │       await env.DB.exec(
> 23 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
  24 │       );
  25 │       await env.DB.prepare("DELETE FROM users").run();
  26 │       await env.DB.prepare("INSERT INTO users (name) VALUES (?)")
  27 │         .bind("alice")
  28 │         .run();
  29 │       await env.DB.prepare("INSERT INTO users (name) VALUES (?)")
  30 │         .bind("bob")
  31 │         .run();
  32 │       const all = await env.DB.prepare(
  33 │         "SELECT name FROM users ORDER BY name",
  34 │       ).all<{ name: string }>();
  35 │       const first = await env.DB.prepare(
  36 │         "SELECT COUNT(*) AS n FROM users",
  37 │       ).first<{ n: number }>();
  38 │       return Response.json({
  39 │         names: all.results.map((r) => r.name),
  40 │         count: first?.n ?? null,
  41 │       });
  42 │     }

0.94 packages/alchemy/src/Drizzle/Schema.ts:84:2
  81 │  * A Drizzle schema managed as an Alchemy resource.
  82 │  *
  83 │  * Wraps drizzle-kit's programmatic API (`generateDrizzleJson` /
> 84 │  * `generateMigration`) so migration SQL is regenerated as part of `alchemy

0.94 packages/alchemy/test/AWS/DSQL/fixtures/drizzle-handler.ts:62:13
  59 │         // autocommit statement. DELETE (not DROP) keeps reruns fast.
  60 │         if (request.method === "POST" && pathname === "/setup") {
  61 │           yield* db.execute(
> 62 │             sql`CREATE TABLE IF NOT EXISTS dsql_connect_widgets (id integer PRIMARY KEY, title text NOT NULL)`,
  63 │           );
  64 │           yield* db.execute(sql`DELETE FROM dsql_connect_widgets`);
  65 │           return yield* HttpServerResponse.json({ success: true });
  66 │         }

0.94 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:30:9
  28 │     if (request.method === "POST" && url.pathname === "/init") {
  29 │       const result = yield* db.exec(
> 30 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, style TEXT NOT NULL, name TEXT NOT NULL)",
  31 │       );
  32 │       return yield* HttpServerResponse.json({
  33 │         count: result.count,
  34 │         duration: result.duration,
  35 │       });
  36 │     }

0.94 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:65:11
  54 │   Effect.gen(function* () {
  55 │     const hd = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  56 │     const sql = yield* SQL.Postgres({ url: hd.connectionString });
  57 │
  58 │     return {
  59 │       fetch: Effect.gen(function* () {
  60 │         const request = yield* HttpServerRequest.HttpServerRequest;
  61 │         const url = new URL(request.url, "http://x");
  62 │
  63 │         if (request.method === "POST" && url.pathname === "/widgets") {
  64 │           const body = (yield* request.json) as { id: number; name: string };
> 65 │           yield* sql`CREATE TABLE IF NOT EXISTS ${sql(TABLE)} (id INT PRIMARY KEY, name TEXT NOT NULL)`;
  66 │           yield* sql`INSERT INTO ${sql(TABLE)} (id, name) VALUES (${body.id}, ${body.name}) ON CONFLICT (id) DO UPDATE SET name = ${body.name}`;
  67 │           return yield* HttpServerResponse.json({ ok: true });
  68 │         }
  69 │
  70 │         if (request.method === "GET" && url.pathname === "/widgets") {
  71 │           const widgets =
  72 │             yield* sql`SELECT id, name FROM ${sql(TABLE)} ORDER BY id`;
  73 │           return yield* HttpServerResponse.json({ widgets });
  74 │         }
  75 │
  76 │         return HttpServerResponse.text("Not Found", { status: 404 });
  77 │       }).pipe(
  78 │         Effect.catchCause((cause) =>
  79 │           HttpServerResponse.json({ error: String(cause) }, { status: 500 }),
  80 │         ),
  81 │       ),
  82 │     };
  83 │   }).pipe(Effect.provide(Cloudflare.Hyperdrive.ConnectBinding)),

0.94 packages/alchemy/test/SQL/fixtures/routes.ts:89:9
  87 │       // POST /init — `sql.unsafe` (raw DDL, no params).
  88 │       if (request.method === "POST" && path === "/init") {
> 89 │         yield* sql.unsafe(ddl);
  90 │         return yield* HttpServerResponse.json({ ok: true });
  91 │       }

0.92 packages/alchemy/test/Neon/fixtures/function-events.ts:60:9
  56 │     return {
  57 │       fetch: Effect.gen(function* () {
  58 │         const request = yield* HttpServerRequest;
  59 │         const path = new URL(request.url, "https://function.test").pathname;
> 60 │         yield* prepare.pipe(Effect.orDie);
  61 │         if (path === "/upload") {
  62 │           yield* files.put("incoming/test.txt", "uploaded").pipe(Effect.orDie);
  63 │           yield* files.put("outside.txt", "not-matched").pipe(Effect.orDie);
  64 │           return HttpServerResponse.empty({ status: 204 });
  65 │         }
  66 │         const events =
  67 │           yield* sql`SELECT id, kind, object_key FROM alchemy_function_events ORDER BY id`.pipe(
  68 │             Effect.orDie,
  69 │           );
  70 │         return yield* HttpServerResponse.json(events);
  71 │       }),
  72 │     };

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:144:15
  135 │             if (kind === "rollback") {
  136 │               yield* storage.sql.exec(
  137 │                 "DROP TABLE idx_alchemy_alarm_callbacks_run_at",
  138 │               );
  139 │               yield* storage.sql.exec(`
  140 │               CREATE TABLE alchemy_alarm_schema (
  141 │                 id INTEGER PRIMARY KEY CHECK (id = 1),
  142 │                 version INTEGER NOT NULL
  143 │               );
> 144 │               INSERT INTO alchemy_alarm_schema (id, version) VALUES (1, 0);
  145 │             `);
  146 │               retryBefore = yield* snapshot(false);
  147 │               recovered = yield* snapshot(true);
  148 │             }

0.90 packages/alchemy/src/Drizzle/Providers.ts:14:2
  11 │ /**
  12 │  * Build-time providers for managing Drizzle schemas as Alchemy resources.
  13 │  * Drizzle.Schema regenerates migration SQL via drizzle-kit's programmatic
> 14 │  * API on every deploy when the source schema changes.

0.90 packages/better-auth/src/Migrate.ts:174:9
  173 │       yield* Effect.tryPromise({
> 174 │         try: () => migrations.runMigrations(),
  175 │         catch: (cause) =>
  176 │           new BetterAuthMigrationError({
  177 │             message: "Failed to apply Better Auth schema migrations",
  178 │             cause,
  179 │           }),
  180 │       });

0.89 packages/alchemy/src/State/PostgresState.ts:250:15
  234 │     const migrate = (sql: SqlClient.SqlClient) =>
  235 │       sql
  236 │         .withTransaction(
  237 │           Effect.gen(function* () {
  238 │             yield* sql`select pg_advisory_xact_lock(hashtextextended(${`${prefix}:schema`}, 0))`;
  239 │             yield* sql`
  240 │               create table if not exists alchemy_resource_state (
  241 │                 stack text not null,
  242 │                 stage text not null,
  243 │                 fqn text not null,
  244 │                 value jsonb not null,
  245 │                 updated_at timestamptz not null default now(),
  246 │                 primary key (stack, stage, fqn)
  247 │               )
  248 │             `;
  249 │             yield* sql`
> 250 │               create table if not exists alchemy_stack_output (
  251 │                 stack text not null,
  252 │                 stage text not null,
  253 │                 value jsonb not null,
  254 │                 updated_at timestamptz not null default now(),
  255 │                 primary key (stack, stage)
  256 │               )
  257 │             `;
  258 │           }),
  259 │         )
  260 │         .pipe(stateError);

0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:33:9
  30 │       // D1's `exec()` splits on newlines and rejects multi-line statements
  31 │       // ("incomplete input: SQLITE_ERROR"). Keep the DDL on a single line.
  32 │       yield* db.exec(
> 33 │         "CREATE TABLE IF NOT EXISTS d1_counters (id TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)",
  34 │       );

0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/object.ts:31:9
  28 │       // D1's `exec()` splits on newlines and rejects multi-line statements;
  29 │       // keep the DDL on a single line.
  30 │       yield* db.exec(
> 31 │         "CREATE TABLE IF NOT EXISTS d1_counters (id TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)",
  32 │       );

0.88 packages/alchemy/test/AWS/DSQL/fixtures/direct-handler.ts:87:11
  78 │         if (request.method === "POST" && pathname === "/roundtrip") {
  79 │           const info = yield* conn;
  80 │           // Plain `PgClient` over the DSQL URL (`sslmode=require`): DSQL
  81 │           // routes on TLS SNI, which `@effect/sql-pg` ≥ rc.115 sends for
  82 │           // DNS hosts by default (Effect-TS/effect#8174).
  83 │           const ctx = yield* Layer.build(PgClient.layer({ url: info.url }));
  84 │           const sqlClient = Context.get(ctx, PgClient.PgClient);
  85 │           // DSQL runs DDL as its own autocommit statement (no DDL+DML
  86 │           // transactions) — each call below is a separate statement.
> 87 │           yield* sqlClient`CREATE TABLE IF NOT EXISTS dsql_direct_widgets (id integer PRIMARY KEY, title text NOT NULL)`;
  88 │           yield* sqlClient`DELETE FROM dsql_direct_widgets WHERE id = 1`;
  89 │           yield* sqlClient`INSERT INTO dsql_direct_widgets (id, title) VALUES (1, 'direct')`;
  90 │           const rows =
  91 │             yield* sqlClient`SELECT id, title FROM dsql_direct_widgets WHERE id = 1`;
  92 │           return yield* HttpServerResponse.json({ rows, host: info.host });
  93 │         }

0.86 packages/better-auth/src/BetterAuth.ts:41:4
  39 │   readonly id?: string;
  40 │   /**
> 41 │    * Deploy-time automatic schema migration. Runs as an internal alchemy

0.86 packages/frontend-frameworks/fixtures/nuxt/worker-entry.ts:21:7
  18 │ export class Counter extends DurableObject {
  19 │   #ensureTable() {
  20 │     this.ctx.storage.sql.exec(
> 21 │       "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)",
  22 │     );
  23 │   }
  24 │
  25 │   async get(): Promise<number> {
  26 │     this.#ensureTable();
  27 │     const rows = this.ctx.storage.sql
  28 │       .exec("SELECT value FROM counter WHERE id = 0")
  29 │       .toArray();
  30 │     return Number(rows[0]?.value ?? 0);
  31 │   }
  32 │
  33 │   async increment(): Promise<number> {
  34 │     this.#ensureTable();
  35 │     const rows = this.ctx.storage.sql
  36 │       .exec(
  37 │         "INSERT INTO counter (id, value) VALUES (0, 1) ON CONFLICT (id) DO UPDATE SET value = value + 1 RETURNING value",
  38 │       )
  39 │       .toArray();
  40 │     return Number(rows[0]!.value);
  41 │   }
  42 │ }

0.84 packages/alchemy/src/Prisma/ORM/Contract.ts:101:2
   98 │  * ```
   99 │  *
  100 │  * Plans that require a human decision (data backfills rendered as
> 101 │  * `placeholder(...)` closures in `migration.ts`) are never auto-answered:

0.83 packages/alchemy/test/AWS/RDSData/handler.ts:109:13
  107 │         if (request.method === "POST" && pathname === "/setup") {
  108 │           const result = yield* executeStatement({
> 109 │             sql: "CREATE TABLE IF NOT EXISTS todos (id INT PRIMARY KEY, title TEXT NOT NULL)",
  110 │           });
  111 │           return yield* HttpServerResponse.json({
  112 │             success: true,
  113 │             numberOfRecordsUpdated: result.numberOfRecordsUpdated ?? 0,
  114 │           });
  115 │         }

0.83 packages/alchemy/test/Cloudflare/Website/fixtures/nuxt-app/worker-entry.ts:25:7
  22 │ export class Counter extends DurableObject {
  23 │   #ensureTable() {
  24 │     this.ctx.storage.sql.exec(
> 25 │       "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)",
  26 │     );
  27 │   }
  28 │
  29 │   async get(): Promise<number> {
  30 │     this.#ensureTable();
  31 │     const rows = this.ctx.storage.sql
  32 │       .exec("SELECT value FROM counter WHERE id = 0")
  33 │       .toArray();
  34 │     return Number(rows[0]?.value ?? 0);
  35 │   }
  36 │
  37 │   async increment(): Promise<number> {
  38 │     this.#ensureTable();
  39 │     const rows = this.ctx.storage.sql
  40 │       .exec(
  41 │         "INSERT INTO counter (id, value) VALUES (0, 1) ON CONFLICT (id) DO UPDATE SET value = value + 1 RETURNING value",
  42 │       )
  43 │       .toArray();
  44 │     return Number(rows[0]!.value);
  45 │   }
  46 │ }

0.78 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:19:9
  16 │     return Effect.gen(function* () {
  17 │       // runtime
  18 │       yield* state.storage.sql.exec(
> 19 │         "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)",
  20 │       );
  21 │
  22 │       const conn = yield* container.getTcpPort(3000);

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:15:5
  12 │ export class UpgradeObject extends DurableObject<unknown> {
  13 │   constructor(ctx: DurableObjectState, env: unknown) {
  14 │     super(ctx, env);
> 15 │     ctx.storage.sql.exec(`
  16 │       CREATE TABLE IF NOT EXISTS alchemy_scheduled_events (
  17 │         id TEXT PRIMARY KEY,
  18 │         run_at INTEGER NOT NULL,
  19 │         repeat_ms INTEGER,
  20 │         payload TEXT NOT NULL
  21 │       );
  22 │       CREATE INDEX IF NOT EXISTS idx_alchemy_scheduled_events_run_at
  23 │         ON alchemy_scheduled_events (run_at);
  24 │     `);
  25 │     ctx.blockConcurrencyWhile(async () => {
  26 │       const constructors =
  27 │         (await ctx.storage.get<string[]>("constructors")) ?? [];
  28 │       await ctx.storage.put("constructors", [...constructors, "v1"]);
  29 │     });
  30 │   }

0.78 packages/frontend-frameworks/fixtures/waku-durable-objects/src/worker-entry.ts:22:7
  19 │ export class Counter extends DurableObject {
  20 │   #ensureTable() {
  21 │     this.ctx.storage.sql.exec(
> 22 │       "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)",
  23 │     );
  24 │   }
  25 │
  26 │   async get(): Promise<number> {
  27 │     this.#ensureTable();
  28 │     const rows = this.ctx.storage.sql
  29 │       .exec("SELECT value FROM counter WHERE id = 0")
  30 │       .toArray();
  31 │     return Number(rows[0]?.value ?? 0);
  32 │   }
  33 │
  34 │   async increment(): Promise<number> {
  35 │     this.#ensureTable();
  36 │     const rows = this.ctx.storage.sql
  37 │       .exec(
  38 │         "INSERT INTO counter (id, value) VALUES (0, 1) ON CONFLICT (id) DO UPDATE SET value = value + 1 RETURNING value",
  39 │       )
  40 │       .toArray();
  41 │     return Number(rows[0]!.value);
  42 │   }
  43 │ }

0.74 packages/alchemy/src/Cloudflare/Workers/DurableObjectAlarmStorage.ts:49:7
  47 │     storage.transactionSync(() => {
  48 │       // Version 0 is the original, unversioned scheduleEvent schema.
> 49 │       storage.sql.exec(`
  50 │         CREATE TABLE IF NOT EXISTS alchemy_scheduled_events (
  51 │           id TEXT PRIMARY KEY,
  52 │           run_at INTEGER NOT NULL,
  53 │           repeat_ms INTEGER,
  54 │           payload TEXT NOT NULL
  55 │         );
  56 │         CREATE INDEX IF NOT EXISTS idx_alchemy_scheduled_events_run_at
  57 │           ON alchemy_scheduled_events (run_at);
  58 │         CREATE TABLE alchemy_alarm_callbacks (
  59 │           callback TEXT NOT NULL,
  60 │           id TEXT NOT NULL,
  61 │           version TEXT NOT NULL,
  62 │           run_at INTEGER NOT NULL,
  63 │           payload TEXT NOT NULL,
  64 │           PRIMARY KEY (callback, id)
  65 │         );
  66 │         CREATE INDEX idx_alchemy_alarm_callbacks_run_at
  67 │           ON alchemy_alarm_callbacks (run_at, callback, id);
  68 │         CREATE TABLE IF NOT EXISTS alchemy_alarm_schema (
  69 │           id INTEGER PRIMARY KEY CHECK (id = 1),
  70 │           version INTEGER NOT NULL
  71 │         );
  72 │         INSERT INTO alchemy_alarm_schema (id, version) VALUES (1, 1)
  73 │           ON CONFLICT (id) DO UPDATE SET version = excluded.version;
  74 │       `);
  75 │     });

0.73 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:16:3
  10 │ export const Hyperdrive = Effect.gen(function* () {
  11 │   const database = yield* Planetscale.MySQLDatabase("SqlMySQLDb", {
  12 │     name: "alchemy-sql-mysql",
  13 │     region: { slug: "us-east" },
  14 │     clusterSize: "PS_10",
  15 │   });
> 16 │   // `admin` because the fixture creates its table over the wire (`/init`
  17 │   // runs raw DDL); the default branch is `main`.
  18 │   const password = yield* Planetscale.MySQLPassword("SqlMySQLPassword", {
  19 │     database,
  20 │     role: "admin",
  21 │   });
  22 │   return yield* Cloudflare.Hyperdrive.Connection("SqlMySQLEdge", {
  23 │     origin: password.origin,
  24 │     // The tests assert read-after-write; Hyperdrive's default SELECT caching
  25 │     // (~60s TTL) can serve a pre-insert empty result — and keep serving it
  26 │     // across retries — so caching is disabled for correctness assertions.
  27 │     caching: { disabled: true },
  28 │   });
  29 │ });
```
