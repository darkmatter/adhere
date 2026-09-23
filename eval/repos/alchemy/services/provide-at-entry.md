# services/provide-at-entry

Layers must be provided once at the program entry. A module that is not an entry point must never call Effect.provide.

Since left out of the preset, for Effect's language service to check (4ae0126).

95 findings, from 0.92 down to 0.71. Each showed this hint:

```ts
const appLayer = userServiceLayer.pipe(
  Layer.provideMerge(databaseLayer),
  Layer.provideMerge(loggerLayer),
  Layer.provideMerge(configLayer),
);

const program = Effect.gen(function* () {
  const users = yield* UserService;
  yield* users.getUser();
});

const main = program.pipe(Effect.provide(appLayer));
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.92 packages/alchemy/test/Fly/fixtures/bluegreen.ts:45
     Effect.provide(FetchHttpClient.layer),
0.90 packages/alchemy/src/Alchemist/routes/provider.ts:97
     Effect.provide(
0.90 packages/alchemy/src/Cli/commands/instrument.ts:26
     Effect.provide(routeCacheLayer),
0.89 packages/alchemy/src/Cloudflare/HttpClientUtils.ts:24
     Effect.provide(
0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/browser.ts:24
     }).pipe(Effect.provide(clientLayer));
0.89 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:129
     Effect.provide(FetchHttpClient.layer),
0.88 packages/frontend-frameworks/src/vinext/cache/redis-runtime.ts:46
     connect(url).pipe(Effect.provide(Layer.succeed(Scope.Scope, scope))),
0.88 packages/frontend-frameworks/src/vinext/cache/s3-runtime.ts:39
     ) => Effect.runPromise(effect.pipe(Effect.provide(awsLayer)));
0.87 packages/alchemy/src/Fly/SecretHttp.ts:101
     Effect.provide(
0.87 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:20
     }).pipe(Effect.provide(services), Effect.scoped, Effect.runPromise);
0.86 packages/alchemy/src/Git/Store/PackSource.ts:64
     Effect.provide(RuntimeContext.phantom),
0.86 packages/alchemy/test/Railway/suiteProject.ts:125
     }).pipe(Effect.provide(fromAuthProvider().pipe(Layer.provide(RailwayAuth))));
0.85 packages/alchemy/src/Alchemist/routes/logs.ts:71
     const rows = yield* Effect.provide(
0.85 packages/alchemy/src/Alchemist/routes/state.ts:42
     return yield* Effect.provide(
0.85 packages/alchemy/src/Git/Jobs/Bundle.ts:156
     Effect.provide(RuntimeContext.phantom),
0.85 packages/alchemy/src/Neon/Storage.ts:103
     provide(S3.deleteObject({ Bucket: bucket, Key: key })),
0.85 packages/alchemy/test/Neon/fixtures/StorageHttpHandler.ts:46
     }).pipe(Effect.provide(Layer.mergeAll(ReadWriteBucketHttp, ReadBucketHttp)));
0.85 packages/alchemy/test/Neon/fixtures/language-model-handler.ts:43
     }).pipe(Effect.provide(handlers));
0.84 packages/alchemy/src/Cloudflare/KV/LocalKVGateway.ts:69
     Effect.provide(localGatewayRuntime),
0.84 packages/alchemy/src/Fly/BucketBinding.ts:55
     Effect.provide(
0.84 packages/alchemy/src/Neon/Website/Artifact.ts:265
     Effect.provide(FetchHttpClient.layer),
0.84 packages/alchemy/test/Cloudflare/Container/fixtures/reload/object.ts:26
     Effect.provide(
0.83 packages/alchemy/src/Alchemist/routes/cloudflare.ts:96
     ).pipe(Effect.provide(layer));
0.83 packages/alchemy/src/Auth/OAuthFlow.ts:191
     ) => effect.pipe(Effect.provide(FetchHttpClient.layer));
0.83 packages/alchemy/src/Cloudflare/Workers/HttpServer.ts:47
     Effect.provide([
0.83 packages/alchemy/src/Fly/Website/AssetDeployment.ts:161
     withTigris(
0.83 packages/alchemy/src/Prisma/Internal/BucketClient.ts:113
     context.pipe(Effect.flatMap((layer) => Effect.provide(effect, layer))),
0.83 packages/alchemy/src/Railway/BucketBinding.ts:114
     Effect.provide(
0.83 packages/alchemy/test/Cloudflare/Workers/RpcWebSocketClient.types.ts:39
     }).pipe(Effect.provide(browserLayer));
0.82 packages/alchemy/src/ACME/Client.ts:421
     );
0.82 packages/alchemy/src/Alchemist/routes/aws.ts:72
     const result = yield* Effect.provide(bootstrapAws(), env.layer);
0.82 packages/alchemy/src/Cloudflare/R2/LocalR2Gateway.ts:67
     Effect.provide(localGatewayRuntime),
0.82 packages/alchemy/src/Stripe/StripeHttp.ts:62
     Effect.provide(
0.82 packages/alchemy/test/ACME/fixtures/shared.ts:37
     Effect.provide(
0.82 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:42
     Effect.provide(
0.82 packages/frontend-frameworks/src/nextjs/aws.ts:412
     const build: NextjsAwsService["build"] = Effect.fn(function* (
0.82 packages/frontend-frameworks/src/vocs/source.ts:27
     Effect.provide(
0.81 packages/alchemy/src/AWS/CloudFront/Distribution.ts:1081
     never,
0.81 packages/alchemy/src/Cloudflare/Auth/AuthProvider.ts:82
     Effect.provide(
0.81 packages/alchemy/src/Fly/SpriteHttp.ts:49
     Effect.provide(
0.81 packages/alchemy/src/Git/Jobs/Compact.ts:122
     Effect.provide(RuntimeContext.phantom),
0.81 packages/alchemy/src/Neon/StorageBinding.ts:182
     }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, http)));
0.81 packages/alchemy/test/Cloudflare/Container/fixtures/neonhost/object.ts:42
     Effect.provide(
0.81 packages/alchemy/test/Neon/fixtures/connect-handler.ts:54
     }).pipe(Effect.provide(ConnectHttp));
0.80 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:78
     Effect.provideService(
0.80 packages/alchemy/src/Alchemist/routes/drift.ts:87
     return yield* Effect.provide(
0.80 packages/alchemy/src/Prisma/PrismaLogs.ts:187
     Effect.provideService(Credentials, Effect.succeed(credentials)),
0.80 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/object.ts:42
     Effect.provide(
0.79 packages/alchemy/src/Auth/Resolve.ts:31
     Effect.provideService(
0.79 packages/alchemy/src/Planetscale/AuthProvider.ts:135
     */
0.79 packages/alchemy/test/Cloudflare/Container/fixtures/prismahost/object.ts:48
     Effect.provide(
0.79 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:72
     Effect.provide(
0.79 packages/frontend-frameworks/src/nextjs/node.ts:234
     yield* runNextBuild({ root, cli }).pipe(Effect.provide(spawnerLayer));
0.78 packages/alchemy/test/Cloudflare/Container/fixtures/restart/object.ts:39
     Effect.provide(
0.78 packages/alchemy/test/Fly/fixtures/process-death.ts:485
     }).pipe(Effect.provide(stack.state));
0.77 packages/alchemy/src/Infisical/AuthProvider.ts:161
     Effect.provide(anonymous({ apiBaseUrl: config.apiBaseUrl })),
0.77 packages/alchemy/test/Cloudflare/AI/fixtures/ChatBackend.ts:42
     }).pipe(Effect.provide(languageModel), Effect.orDie),
0.77 packages/alchemy/test/Fly/fixtures/state-persistence.ts:107
     Layer.provide(Layer.succeed(FileSystem.FileSystem, forwarded)),
0.76 packages/alchemy/src/AWS/CloudFront/BindingHttp.ts:94
     Effect.provideService(AwsRegion, Effect.succeed(KVS_REGION)),
0.76 packages/alchemy/src/Nuke.ts:346
     );
0.76 packages/alchemy/test/types/Agent.ts:33
     Effect.provide(
0.75 packages/alchemy/src/Cloudflare/AI/DurableObjectChatPersistence.ts:34
     Effect.provide(RuntimeContext.phantom),
0.75 packages/alchemy/src/Cloudflare/Access/GetIdentityProviderHttp.ts:110
     Effect.provide(FetchHttpClient.layer),
0.75 packages/alchemy/src/Cloudflare/Workers/Rpc.ts:127
     return yield* RpcClient.make(group).pipe(Effect.provide(protocol));
0.75 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:61
     }).pipe(Effect.provide(AWS.DynamoDB.PutItemHttp)),
0.75 packages/frontend-frameworks/src/core/BuildChild.ts:215
     }).pipe(Effect.provide(spawnerLayer));
0.74 packages/alchemy/src/Cli/commands/cloudflare.ts:329
     );
0.74 packages/alchemy/src/Cloudflare/Workers/DurableObjectBridge.ts:87
     Effect.provide(doContext),
0.74 packages/alchemy/src/Git/Jobs/Purge.ts:72
     Effect.provide(RuntimeContext.phantom),
0.74 packages/alchemy/test/Cloudflare/Container/fixtures/isolated/object.ts:28
     Effect.provide(
0.73 packages/alchemy-test/src/Runner.ts:145
     Effect.provide(
0.73 packages/alchemy/src/Git/Hasher/Hasher.ts:203
     }),
0.73 packages/alchemy/src/Railway/LoginSession.ts:68
     effect.pipe(Effect.provide(anonymousRailway(apiBaseUrl)));
0.73 packages/frontend-frameworks/src/astro/Astro.ts:301
     Effect.provideService(Path.Path, path),
0.73 packages/frontend-frameworks/src/react-router/ReactRouter.ts:357
     const build: Framework["Service"]["build"] = Effect.fn(
0.73 packages/frontend-frameworks/src/vocs/neon.ts:214
     }).pipe(Effect.provide(services)),
0.72 packages/alchemy/src/ACME/Certificate.ts:262
     Effect.provide(
0.72 packages/alchemy/src/Drizzle/Postgres.ts:73
     Effect.provideContext(pgCtx),
0.72 packages/alchemy/src/Namespace.ts:28
     Effect.provideService(eff, Namespace, {
0.72 packages/alchemy/src/Test/Core.ts:691
     Effect.provide(compiled.services),
0.72 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:77
     Effect.provide(
0.72 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:263
     inventory = yield* deploy({ ...options, gatewayOnly: true });
0.72 packages/alchemy/test/Fly/fixtures/protocol-branches.ts:65
     Effect.provide(
0.72 packages/alchemy/test/SQL/fixtures/postgres-worker.ts:42
     Effect.provide(SQL.PostgresLayer({ url: hd.connectionString })),
0.72 packages/frontend-frameworks/src/astro/source.ts:501
     Effect.gen(function* () {
0.72 packages/frontend-frameworks/src/vite/Vite.ts:251
     Effect.provideService(FileSystem.FileSystem, fs),
0.71 packages/alchemy/src/AWS/AuthProvider.ts:213
     Effect.provide(
0.71 packages/alchemy/src/Cli/commands/profile/commands.ts:187
     const configProvider = yield* loadConfigProvider(envFile);
0.71 packages/alchemy/src/Cloudflare/Workflows/WorkflowBridge.ts:113
     ).pipe(Layer.provideMerge(Layer.succeedContext(context))),
0.71 packages/alchemy/src/Fly/Credentials.ts:58
     return yield* Credentials.pipe(Effect.provide(CredentialsFromEnv));
0.71 packages/alchemy/src/Stack.ts:423
     Layer.provideMerge(alchemy({ dev: options.dev }), platform),
0.71 packages/alchemy/test/Cloudflare/Container/fixtures/external/object.ts:42
     Effect.provide(
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/object.ts:40
     }).pipe(Effect.provide(Cloudflare.KV.ReadWriteNamespaceBinding)),
0.71 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:52
     Effect.provide(SQL.MySQLLayer({ url: hd.connectionString })),
0.71 packages/frontend-frameworks/src/vocs/node.ts:184
     Effect.provide(
```
