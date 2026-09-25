# alchemy/runtime/disposables-in-request-scope

Connections, pools, sockets, and anything else with a finalizer must be acquired inside a handler or method, where the event's scope releases them, never at module scope or in a runtime's construction Effect, whose finalizers may never run.

15 findings, from 0.82 down to 0.73. Each showed this hint:

```ts
Effect.gen(function* () {
  const url = yield* Config.Redacted("DATABASE_URL");
  return {
    fetch: Effect.gen(function* () {
      const pool = yield* Effect.acquireRelease(
        Effect.sync(() => new Pool({ connectionString: Redacted.value(url), max: 1 })),
        (pool) => Effect.promise(() => pool.end()),
      );
      const { rows } = yield* Effect.promise(() => pool.query("select id from users"));
      return yield* HttpServerResponse.json(rows);
    }),
  };
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.82 packages/alchemy/test/Fly/fixtures/postgres-api.ts:40:5
  39 │   Effect.gen(function* () {
> 40 │     const conn = yield* Fly.ConnectPostgres(Db);
  41 │     const db = yield* Drizzle.Postgres(conn.connectionString);
  42 │     const direct = yield* Drizzle.Postgres(conn.directConnectionString);

0.81 packages/alchemy/test/AWS/DocDB/slow-handler.ts:86:5
> 86 │     const db = yield* DocDB.mongo(connect);

0.81 packages/frontend-frameworks/src/vinext/cache/redis-runtime.ts:39:1
> 39 │ const connections = new Map<string, Promise<Connection>>();

0.80 packages/alchemy/test/types/PrismaWorker.ts:31:5
  23 │ export const PrismaWorkerApiLive = PrismaWorkerApi.make(
  24 │   {
  25 │     main: import.meta.filename,
  26 │     compatibility: {
  27 │       flags: ["nodejs_compat"],
  28 │     },
  29 │   },
  30 │   Effect.gen(function* () {
> 31 │     const db = yield* Prisma.Connect(connection);
  32 │
  33 │     return PrismaWorkerApi.of({
  34 │       databaseUrl: () => db.databaseUrl,
  35 │       fetch: Effect.gen(function* () {
  36 │         const databaseUrl = yield* db.databaseUrl;
  37 │         return yield* HttpServerResponse.json({
  38 │           ok: true,
  39 │           hasDatabaseUrl: Redacted.isRedacted(databaseUrl),
  40 │         });
  41 │       }),
  42 │     });
  43 │   }).pipe(Effect.provide(Prisma.ConnectBinding)),
  44 │ );

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:35:5
  32 │     // `proxyChain` defers the connect to the first query, so the pool opens
  33 │     // inside a fetch event — where the per-event scope is provided — not
  34 │     // here at init.
> 35 │     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  36 │     const db = yield* Drizzle.Postgres(conn.connectionString, { relations });

0.78 packages/alchemy/test/types/PrismaLambda.ts:29:5
  23 │ export const PrismaLambdaApiLive = PrismaLambdaApi.make(
  24 │   {
  25 │     main: import.meta.filename,
  26 │     functionUrl: true,
  27 │   },
  28 │   Effect.gen(function* () {
> 29 │     const db = yield* Prisma.Connect(connection);
  30 │
  31 │     return PrismaLambdaApi.of({
  32 │       databaseUrl: () => db.databaseUrl,
  33 │       fetch: Effect.gen(function* () {
  34 │         const databaseUrl = yield* db.databaseUrl;
  35 │         return yield* HttpServerResponse.json({
  36 │           ok: true,
  37 │           hasDatabaseUrl: Redacted.isRedacted(databaseUrl),
  38 │         });
  39 │       }),
  40 │     });
  41 │   }).pipe(Effect.provide(Prisma.ConnectBinding)),
  42 │ );

0.76 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:20:1
> 20 │ export const PrismaDb = Effect.gen(function* () {
  21 │   const project = yield* Project("PrismaHyperdriveProject", {
  22 │     createDatabase: false,
  23 │   });
  24 │   const database = yield* Postgres("PrismaHyperdriveDb", {
  25 │     project,
  26 │   });
  27 │   const connection = yield* Connection("PrismaHyperdriveConnection", {
  28 │     database,
  29 │   });
  30 │   return { project, database, connection };
  31 │ });

0.76 packages/alchemy/test/Railway/fixtures/suite-env.ts:15:1
> 15 │ export const Partition = Environment("Partition", { project: Site });

0.75 packages/alchemy/test/AWS/RedshiftServerless/fixtures/query-handler.ts:25:5
  24 │   Effect.gen(function* () {
> 25 │     const namespace = yield* RedshiftServerless.Namespace("QueryNamespace", {
  26 │       namespaceName: "alchemy-test-rs-ns",
  27 │       dbName: "dev",
  28 │       adminUsername: "alchemyadmin",
  29 │       manageAdminPassword: true,
  30 │     });

0.75 packages/alchemy/test/Railway/fixtures/postgres-shared.ts:6:1
  4 │ export { Site };
  5 │
> 6 │ export const Db = Postgres("Db", { project: Site, environment: Partition });

0.74 packages/alchemy/test/AWS/RedshiftServerless/fixtures/connect-handler.ts:36:5
> 36 │     const connect = yield* RedshiftServerless.Connect(workgroup, {
  37 │       database: "dev",
  38 │     });

0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/db.ts:15:1
> 15 │ export const Db = Effect.gen(function* () {
  16 │   // Resolved inside the effect (not at module scope) so it only runs at
  17 │   // deploy time — `import.meta.url` is undefined in the bundled worker.
  18 │   const configPath = yield* Effect.sync(() =>
  19 │     path.join(
  20 │       import.meta.url ? fileURLToPath(import.meta.url) : ".",
  21 │       "..",
  22 │       "prisma.config.ts",
  23 │     ),
  24 │   );
  25 │
  26 │   const contract = yield* Prisma.Contract("PrismaOrmContract", {
  27 │     config: configPath,
  28 │   });
  29 │
  30 │   const project = yield* Neon.Project("PrismaOrmProject", {
  31 │     region: "aws-us-east-1",
  32 │   });
  33 │
  34 │   const branch = yield* Neon.Branch("PrismaOrmBranch", { project });
  35 │
  36 │   const migrate = yield* Prisma.Migrate("PrismaOrmMigrate", {
  37 │     url: branch.connectionUri,
  38 │     contract,
  39 │   });
  40 │
  41 │   return { contract, project, branch, migrate };
  42 │ });

0.74 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:24:5
  23 │   Effect.gen(function* () {
> 24 │     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  25 │     const db = yield* Drizzle.Postgres(conn.connectionString, { relations });

0.73 packages/alchemy/test/AWS/Redshift/fixtures/connect-handler.ts:35:5
  34 │   Effect.gen(function* () {
> 35 │     const cluster = yield* Redshift.Cluster("ConnectCluster", {
  36 │       clusterIdentifier: "alchemy-test-redshift-connect",
  37 │       manageMasterPassword: true,
  38 │       publiclyAccessible: false,
  39 │     });

0.73 packages/alchemy/test/Cloudflare/AI/fixtures/effect-bindings-worker.ts:27:5
  26 │   Effect.gen(function* () {
> 27 │     const bucket = yield* Cloudflare.R2.Bucket("AiSearchEffectBindingBucket", {
  28 │       forceDestroy: true,
  29 │     });
```
