# basics/gen-for-sequencing

Sequential effectful steps must be written with Effect.gen and yield*, never as nested flatMap or callback chains.

66 findings, from 0.92 down to 0.71. Each showed this hint:

```ts
const program = Effect.gen(function* () {
  const data = yield* fetchData;
  yield* Effect.logInfo(`Processing data: ${data}`);
  return yield* processData(data);
});
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.92 packages/alchemy/src/Cloudflare/KV/ReadNamespaceHttp.ts:40
     scope.pipe(
0.92 packages/alchemy/src/Cloudflare/R2/WriteBucketHttp.ts:60
     scope.pipe(
0.90 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:61
     Effect.flatMap((id) =>
0.90 packages/alchemy/src/Cloudflare/R2/ReadBucketHttp.ts:60
     Effect.flatMap(({ accountId, bucketName, cfR2Jurisdiction }) =>
0.90 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:27
     Effect.flatMap((response) =>
0.90 packages/frontend-frameworks/src/vinext/Modules.ts:12
     Effect.flatMap((directory) =>
0.89 packages/alchemy/src/Util/AtomicFile.ts:29
     return fs.writeFileString(tmp, contents).pipe(
0.88 packages/cloudflare-runtime/src/core/bindings/DurableObjectNamespace.ts:81
     Effect.flatMap((proxy) =>
0.87 packages/alchemy/src/Alchemist/Progress.ts:158
     return Effect.currentSpan.pipe(
0.87 packages/alchemy/src/Cloudflare/HttpClientUtils.ts:22
     Effect.flatMap((value) =>
0.87 packages/alchemy/src/Cloudflare/Queues/WriteQueueHttp.ts:66
     Effect.flatMap(({ accountId, queueId }) =>
0.87 packages/alchemy/src/Cloudflare/Workers/BrowserBinding.ts:40
     Effect.flatMap((binding) =>
0.87 packages/alchemy/src/Cloudflare/Workers/DurableObjectBridge.ts:88
     Effect.flatMap((instance) =>
0.87 packages/alchemy/src/Runtime/Bootstrap/Process.ts:91
     Effect.flatMap((self) => {
0.86 packages/alchemy/src/Local/RpcServerEnvironment.ts:99
     Effect.flatMap(
0.86 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:11
     Effect.flatMap((deployment) =>
0.86 packages/alchemy/src/Runtime/Bootstrap/Lambda.ts:75
     Effect.flatMap((context) =>
0.85 packages/alchemy/src/ACME/Pki.ts:142
     importPrivateKey(pem).pipe(
0.85 packages/alchemy/src/Prisma/Internal/BucketClient.ts:116
     Effect.flatMap(([layer, bucket]) =>
0.85 packages/alchemy/src/Railway/LoginSession.ts:87
     Effect.flatMap(() =>
0.84 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:381
     Effect.flatMap(ref, (name) =>
0.84 packages/alchemy/src/Cloudflare/KV/WriteNamespaceHttp.ts:44
     scope.pipe(
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:52
     Effect.flatMap((data) =>
0.84 packages/alchemy/test/Local/fixtures/process-effect.ts:71
     Effect.flatMap((handle) =>
0.84 packages/frontend-frameworks/src/sveltekit/neon.ts:22
     node.build!(context).pipe(Effect.flatMap(finish)),
0.83 packages/alchemy/src/Util/layer-scoped.ts:14
     Effect.flatMap(Effect.scope, (scope) => Layer.buildWithScope(layer, scope));
0.82 packages/alchemy/src/Binding.ts:150
     Effect.flatMap((client: any) => client()),
0.82 packages/alchemy/src/Cloudflare/Workers/WorkerBridge.ts:118
     // `ctx.waitUntil` below — never on workerd's ephemeral
0.82 packages/alchemy/src/Neon/FunctionBridge.ts:67
     Effect.flatMap((context) =>
0.82 packages/frontend-frameworks/src/vinext/cache/s3-runtime.ts:50
     Effect.flatMap((result) =>
0.81 packages/alchemy/src/Bundle/Bundle.ts:343
     }),
0.81 packages/alchemy/src/Http.ts:88
     Effect.flatMap((response) =>
0.81 packages/better-auth/src/ApiProxy.ts:50
     Effect.flatMap(makeAuth, (auth) =>
0.81 packages/cloudflare-runtime/src/core/Docker.ts:223
     Effect.flatMap((child) =>
0.80 packages/alchemy/src/AWS/StepFunctions/Asl/simulate.ts:214
     return evalExpr(node.options.arguments, env).pipe(
0.80 packages/alchemy/src/Cloudflare/Fetcher.ts:301
     ),
0.80 packages/alchemy/src/Stack.ts:405
     return yield* fn(stack).pipe(
0.79 packages/alchemy/src/Platform.ts:501
     Effect.flatMap(
0.79 packages/alchemy/test/Hetzner/fixtures/app/shared.ts:80
     Effect.flatMap(Edge, (lb) =>
0.78 packages/alchemy/src/Cloudflare/Workers/Source.ts:297
     }).pipe(
0.77 packages/alchemy/src/Cli/exec.ts:226
     Effect.flatMap((paths) =>
0.77 packages/alchemy/src/Cloudflare/Access.ts:51
     Effect.flatMap((process) => Stream.runCollect(process.stdout)),
0.77 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:63
     Effect.flatMap(rawEff, (raw) => Effect.promise(() => raw.exec(query))),
0.76 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:51
     Effect.flatMap(indexName, (name) => auth.authorize(fn(name))).pipe(
0.76 packages/alchemy/src/Git/GitHubCompat.ts:496
     Effect.flatMap((page) =>
0.76 packages/alchemy/src/Local/Sidecar.ts:21
     Effect.promise(() => import(group)).pipe(
0.76 packages/alchemy/src/Railway/ServiceRegion.ts:174
     Effect.flatMap((observed) =>
0.76 packages/alchemy/src/SQLite/BunSQLite.ts:51
     return Effect.flatMap(
0.76 packages/cloudflare-runtime/src/core/proxy/WorkerProxy.ts:221
     Effect.retry({ while: () => awaited !== current }),
0.76 packages/cloudflare-runtime/src/core/registry/Registry.ts:87
     Effect.flatMap((valid) =>
0.75 packages/alchemy/src/Prisma/WriteBucket.ts:114
     access.bucketName.pipe(
0.74 packages/alchemy/src/Infisical/AuthProvider.ts:281
     Effect.flatMap((method) =>
0.74 packages/alchemy/src/Prisma/ReadBucket.ts:120
     Effect.flatMap((Bucket) =>
0.74 packages/alchemy/test/Command/fixture/lifecycle-support.ts:40
     ChildProcess.make("ps", ["-o", "pgid=", "-p", String(pid)]).pipe(
0.74 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:46
     Effect.flatMap((response) =>
0.73 packages/alchemy/src/Docker/Container.ts:282
     Docker.pipe(
0.73 packages/cloudflare-runtime/src/core/test/helpers/port.ts:21
     Port.make({ cache: false }).pipe(Effect.flatMap((ports) => ports.find(port)));
0.72 packages/alchemy-test/src/PlainReporter.ts:241
     );
0.72 packages/alchemy/src/Stripe/StripeHttp.ts:60
     Effect.flatMap((apiKey) =>
0.72 packages/alchemy/src/Website/Server.ts:252
     Effect.flatMap((module_) =>
0.72 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:104
     Effect.flatMap((result) =>
0.71 packages/alchemy/src/Fly/Environment.ts:63
     Effect.flatMap((resolved) =>
0.71 packages/alchemy/src/Fly/Postgres.ts:461
     Effect.flatMap((res) => {
0.71 packages/alchemy/src/Hetzner/Image.ts:342
     Effect.flatMap((image) =>
0.71 packages/alchemy/src/Railway/ServiceDomain.ts:361
     Effect.flatMap((created) =>
0.71 packages/better-auth/src/Migrate.ts:128
     Effect.flatMap(support.connect, (acquire) =>
```
