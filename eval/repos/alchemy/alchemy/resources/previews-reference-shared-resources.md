# alchemy/resources/previews-reference-shared-resources

Preview stages should reference a long-lived database or cluster with ref and create only cheap per-stage pieces such as a branch, and should not provision a whole project or cluster for every preview.

11 findings, from 0.90 down to 0.71. Each showed this hint:

```ts
const project = stage.startsWith("pr-")
  ? yield* Neon.Project.ref("AppDb", { stage: "staging" })
  : yield* Neon.Project("AppDb", { region: "aws-us-east-1" });
const branch = yield* Neon.Branch("Branch", { project });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.90 packages/alchemy/test/Neon/fixtures/connect-database.ts:5:1
  2 │ import { Project } from "@/Neon/Project";
  3 │ import * as Effect from "effect/Effect";
  4 │
> 5 │ export const ConnectProject = Project("ConnectProject", {
  6 │   region: "aws-us-east-2",
  7 │ });

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/db.ts:24:3
  13 │ export const NeonDb = Effect.gen(function* () {
  14 │   // Resolved inside the effect (not at module scope) so it only runs at
  15 │   // deploy time — `import.meta.url` is undefined in the bundled worker.
  16 │   const migrationsDir = yield* Effect.sync(() =>
  17 │     path.join(
  18 │       import.meta.url ? fileURLToPath(import.meta.url) : ".",
  19 │       "..",
  20 │       "migrations",
  21 │     ),
  22 │   );
  23 │
> 24 │   const project = yield* Neon.Project("DrizzleWorkflowProject", {
  25 │     region: "aws-us-east-1",
  26 │   });
  27 │
  28 │   const branch = yield* Neon.Branch("DrizzleWorkflowBranch", {
  29 │     project,
  30 │     migrations: migrationsDir,
  31 │   });
  32 │
  33 │   return { project, branch };
  34 │ });

0.87 packages/alchemy/test/Neon/fixtures/StorageResources.ts:8:1
   5 │ import * as Effect from "effect/Effect";
   6 │ import * as Schema from "effect/Schema";
   7 │
>  8 │ export const StorageProject = Project("StorageBindingProject", {
   9 │   region: "aws-us-east-2",
  10 │ });

0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/db.ts:30:3
  15 │ export const Db = Effect.gen(function* () {
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
> 30 │   const project = yield* Neon.Project("PrismaOrmProject", {
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

0.79 packages/alchemy/test/Neon/fixtures/language-model-resources.ts:4:1
  1 │ import * as Neon from "@/Neon";
  2 │ import * as Effect from "effect/Effect";
  3 │
> 4 │ export const languageModelProject = Neon.Project("LanguageModelProject", {
  5 │   region: "aws-us-east-2",
  6 │ });

0.77 packages/alchemy/test/Cloudflare/Container/fixtures/prismahost/db.ts:12:3
  11 │ export const PrismaHostConnection = Effect.gen(function* () {
> 12 │   const project = yield* Project("PrismaHostProject", {
  13 │     createDatabase: false,
  14 │   });
  15 │   const database = yield* Postgres("PrismaHostDb", {
  16 │     project,
  17 │     name: "main",
  18 │     dev: {
  19 │       name: `alchemy-container-prisma-host-${yield* Stage}`,
  20 │       persistenceMode: "stateless",
  21 │     },
  22 │   });
  23 │   return yield* Connection("PrismaHostConnection", { database });
  24 │ });

0.76 packages/alchemy/test/Neon/fixtures/function-events.ts:17:1
  14 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
  15 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  16 │
> 17 │ export const project = Project("EventProject", { region: "aws-us-east-2" });

0.74 packages/alchemy/test/Neon/fixtures/function-form-resources.ts:2:1
  1 │ import { Project } from "@/Neon/Project";
> 2 │ export const project = Project("FormProject", { region: "aws-us-east-2" });

0.72 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/stack.ts:19:7
  15 │ export const AsyncWorker = Cloudflare.Worker("HyperdriveAsyncWorker", {
  16 │   main: pathe.resolve(import.meta.dirname, "async-worker.ts"),
  17 │   env: {
  18 │     HD: Effect.gen(function* () {
> 19 │       const project = yield* Neon.Project("HyperdriveBindingProject");
  20 │       return yield* Cloudflare.Hyperdrive.Connection(
  21 │         "HyperdriveBindingConnection",
  22 │         { origin: project.origin },
  23 │       );
  24 │     }),
  25 │   },
  26 │ });

0.71 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/remote-worker.ts:17:3
  16 │ export const RemoteHyperdrive = Effect.gen(function* () {
> 17 │   const project = yield* Neon.Project("HyperdriveRemoteProject");
  18 │   return yield* Cloudflare.Hyperdrive.Connection("HyperdriveRemoteConnection", {
  19 │     origin: project.origin,
  20 │     caching: { disabled: true },
  21 │   }).pipe(Alchemy.remote());
  22 │ });

0.71 packages/alchemy/test/Neon/fixtures/backend-resources.ts:4:1
  1 │ import * as Neon from "@/Neon";
  2 │ import * as Effect from "effect/Effect";
  3 │
> 4 │ export const backendProject = Neon.Project("BackendBindingProject", {
  5 │   region: "aws-us-east-2",
  6 │ });
```
