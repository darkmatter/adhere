# alchemy/resources/protect-irreplaceable-data

A bucket or database holding user or business data should be retained with RemovalPolicy.retain(), at least in production, and forceDestroy should be set only on buckets whose contents are disposable; irreplaceable data should not depend on the default destroy policy.

13 findings, from 0.88 down to 0.71. Each showed this hint:

```ts
const uploads = yield* Cloudflare.R2.Bucket("Uploads").pipe(RemovalPolicy.retain(stage === "prod"));
const cache = yield* Cloudflare.R2.Bucket("Cache", { forceDestroy: true });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.88 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:323:1
> 323 │ );

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:30:1
> 30 │ const Bucket = Cloudflare.R2.Bucket("Tasks", { forceDestroy: true });

0.87 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:29:7
  27 │   Effect.gen(function* () {
  28 │     const bucket = yield* S3.Bucket("EventSourceBucket", {
> 29 │       forceDestroy: true,
  30 │       versioning: "Enabled",
  31 │     });

0.84 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:30:7
  27 │     const props = {
  28 │       versioning: "Enabled",
  29 │       objectLockEnabled: true,
> 30 │       forceDestroy: true,
  31 │     } as const;

0.82 packages/alchemy/test/AWS/S3/fixtures/server-event-source-task.ts:15:3
  13 │ export const ServerEventBucket = AWS.S3.Bucket("ServerEventBucket", {
  14 │   versioning: "Enabled",
> 15 │   forceDestroy: true,
  16 │ });

0.82 packages/pkg/src/Registry/Bindings.ts:114:1
  111 │ export const SWEEP_LOOKAHEAD = Duration.hours(2);
  112 │
  113 │ /** Content-addressed tarballs, keyed `<encoded name>/<sha256>.tgz`. */
> 114 │ export const Bucket = Cloudflare.R2.Bucket("Bucket", { forceDestroy: true });
  115 │
  116 │ export const tarballKey = (name: string, sha256: string) =>
  117 │   `${encodeURIComponent(name)}/${sha256}.tgz`;

0.81 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/storage.ts:3:1
  1 │ import * as Cloudflare from "@/Cloudflare";
  2 │
> 3 │ export const Storage = Cloudflare.R2.Bucket("Storage", { forceDestroy: true });

0.80 packages/alchemy/test/AWS/S3/fixtures/versioned-multipart-handler.ts:27:5
  26 │   Effect.gen(function* () {
> 27 │     const props = { versioning: "Enabled", forceDestroy: true } as const;

0.76 packages/alchemy/test/Neon/fixtures/function-events.ts:21:5
  18 │ export const bucket = Bucket(
  19 │   "EventBucket",
  20 │   Effect.gen(function* () {
> 21 │     return { project: yield* project, forceDestroy: true };
  22 │   }),
  23 │ );

0.75 packages/alchemy/test/Git/fixtures/lambda-stack.ts:27:3
  24 │ export { TEST_SECRET };
  25 │
  26 │ const GitObjects = Cloudflare.R2.Bucket("GitLambdaObjects", {
> 27 │   forceDestroy: true,
  28 │ });

0.72 packages/alchemy/test/Git/fixtures/s3-stack.ts:27:1
  24 │ export { TEST_SECRET };
  25 │
  26 │ /** Declared here so the stack tears it down with the packs still inside. */
> 27 │ export const GitObjects = AWS.S3.Bucket("GitS3Objects", { forceDestroy: true });

0.71 packages/alchemy/test/AWS/S3/fixtures/head-object-handler.ts:15:7
  12 │   { main: import.meta.url, functionUrl: true },
  13 │   Effect.gen(function* () {
  14 │     const bucket = yield* S3.Bucket("HeadObjectBucket", {
> 15 │       forceDestroy: true,
  16 │       versioning: "Enabled",
  17 │     });
  18 │     const headObject = yield* S3.HeadObject(bucket);

0.71 packages/alchemy/test/Git/fixtures/loader-stack.ts:25:3
  22 │ export { TEST_SECRET };
  23 │
  24 │ const GitObjects = Cloudflare.R2.Bucket("GitLoaderObjects", {
> 25 │   forceDestroy: true,
  26 │ });
```
