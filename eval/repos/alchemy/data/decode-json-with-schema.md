# data/decode-json-with-schema

JSON crossing a boundary must be decoded with Schema.fromJsonString, never with JSON.parse followed by a cast.

Since left out of the preset, for Effect's language service to check (4ae0126).

145 findings, from 0.95 down to 0.71. Each showed this hint:

```ts
const MoveFromJson = Schema.fromJsonString(Move);

const program = Effect.gen(function* () {
  const jsonString = '{"from":{"row":"A","column":"1"},"to":{"row":"B","column":"2"}}';
  const move = yield* Schema.decodeUnknownEffect(MoveFromJson)(jsonString);
  const json = yield* Schema.encodeEffect(MoveFromJson)(move);
  return json;
});
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.95 packages/alchemy/src/Prisma/ORM/Generate.ts:111
     try: () => JSON.parse(text) as Contract<SqlStorage>,
0.95 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:32
     const env = JSON.parse(yield* get("/env")) as {
0.95 packages/alchemy/test/Local/fixtures/rpc-spawner-commands.ts:21
     JSON.parse(process.env.COMMAND_FIXTURES!) as {
0.95 packages/frontend-frameworks/src/core/DevChildRunner.ts:45
     const payload = JSON.parse(process.argv[2] ?? "{}") as DevChildPayload;
0.94 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:72
     const json = JSON.parse(text) as { result: ImportPollingResponse };
0.94 packages/alchemy/src/Git/Hasher/Lambda.ts:78
     try: () => JSON.parse(text) as HashResponse,
0.94 packages/alchemy/src/Local/RpcServerEnvironment.ts:52
     JSON.parse(raw) as SessionEnvironment;
0.94 packages/alchemy/src/Neon/Website/PackageRunner.ts:20
     () => JSON.parse(source) as WebsiteArtifactProps,
0.94 packages/alchemy/src/Neon/Website/TraceRunner.ts:16
     const input = yield* Effect.try(() => JSON.parse(source) as TraceInput);
0.94 packages/alchemy/src/Prisma/PrismaLogs.ts:160
     Number(query.cursor) >= 0
0.94 packages/alchemy/src/TelemetryRuntime.ts:330
     );
0.94 packages/alchemy/test/Neon/Website/Browser.ts:53
     JSON.parse(opened) as {
0.94 packages/frontend-frameworks/src/core/BuildChildRunner.ts:21
     const payload = JSON.parse(process.argv[2] ?? "{}") as BuildChildPayload;
0.93 packages/alchemy/src/AWS/CloudFront/KvRoutesUpdate.ts:113
     routes: JSON.parse(chunks.join("")) as string[],
0.93 packages/alchemy/src/Git/Hasher/Protocol.ts:46
     const bounds = JSON.parse(
0.93 packages/alchemy/test/AWS/GeoMaps/handler.ts:86
     (JSON.parse(text) as { version?: number }).version ?? null;
0.93 packages/alchemy/test/AWS/Pricing/handler.ts:59
     ? (JSON.parse(priceList[0]) as {
0.93 packages/alchemy/test/AWS/StepFunctions/handler.ts:429
     input: JSON.stringify({ items: [1, 2] }),
0.93 packages/alchemy/test/Command/fixture/lifecycle-support.ts:63
     (text) => JSON.parse(text) as { wrapper: number; leaf: number },
0.93 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:244
     return yield* HttpServerResponse.json(identity);
0.92 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:204
     return JSON.parse(body) as DashboardBody;
0.92 packages/alchemy/src/AWS/IAM/common.ts:52
     return JSON.parse(decoded) as PolicyDocument;
0.92 packages/alchemy/src/AWS/Organizations/OrganizationResourcePolicy.ts:90
     document: JSON.parse(policy?.Content ?? "{}") as PolicyDocument,
0.92 packages/alchemy/src/Cloudflare/Workers/ScheduledEvents.ts:45
     payload: JSON.parse(row.payload) as unknown,
0.92 packages/alchemy/src/Prisma/Client.ts:1361
     const json = JSON.parse(body) as {
0.92 packages/alchemy/src/Server/S3BucketEventSource.ts:86
     (JSON.parse(record.body) as { Records?: S3.S3Record[] })
0.92 packages/alchemy/test/AWS/ApiGatewayV2/bindings-handler.ts:76
     JSON.parse(document) as {
0.92 packages/alchemy/test/AWS/Bedrock/handler.ts:265
     JSON.parse(raw) as {
0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:55
     Effect.map((data) => JSON.parse(data)),
0.91 packages/alchemy/src/AWS/Lambda/LogGroupEventSource.ts:37
     JSON.parse(
0.91 packages/alchemy/src/AWS/Lambda/Permission.ts:172
     const policy = JSON.parse(Policy) as {
0.91 packages/alchemy/src/AWS/Organizations/Policy.ts:389
     document: JSON.parse(
0.91 packages/alchemy/src/Cloudflare/Logs.ts:175
     const data: TailEventMessage = JSON.parse(decoder.decode(raw));
0.91 packages/alchemy/src/Docker/Docker.ts:546
     Effect.map((stdout) => stdout.trim()),
0.91 packages/alchemy/src/Prisma/Internal/BucketClient.ts:226
     try: () => JSON.parse(decoded) as T,
0.91 packages/alchemy/test/Cloudflare/Utils/Fixture.ts:34
     const manifest = JSON.parse(yield* fs.readFileString(manifestPath)) as {
0.91 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:179
     const message = JSON.parse(pending.slice(0, newline)) as
0.91 packages/alchemy/test/Cloudflare/Website/TypeScriptCompat.ts:55
     const pkg = JSON.parse(yield* fs.readFileString(pkgPath)) as {
0.91 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:324
     const value = JSON.parse(String(result)) as Snapshot;
0.91 packages/better-auth/test/http.ts:59
     Effect.map((response) => JSON.parse(response.body) as T),
0.91 packages/frontend-frameworks/src/vinext/Prerender.ts:212
     const manifest = JSON.parse(yield* fs.readFileString(manifestPath)) as {
0.90 packages/alchemy/src/AWS/AMP/BindingHttp.ts:213
     JSON.parse(text) as {
0.90 packages/alchemy/src/AWS/AppSync/GraphQLHttp.ts:112
     try: () => JSON.parse(text) as GraphQLResult,
0.90 packages/alchemy/src/AWS/CloudControl/Resource.ts:121
     const parsed = JSON.parse(raw);
0.90 packages/alchemy/src/AWS/SecretsManager/Secret.ts:236
     const template = JSON.parse(secretStringTemplate) as Record<
0.90 packages/alchemy/src/Cloudflare/StateStore/Store.ts:78
     return JSON.parse(new TextDecoder().decode(pt)) as ResourceState;
0.90 packages/alchemy/src/Cloudflare/Workers/AlarmCallback.ts:321
     try: () => JSON.parse(job.payload),
0.90 packages/alchemy/src/Git/PushWire.ts:71
     const meta = JSON.parse(
0.90 packages/alchemy/src/Neon/StorageObjectBinding.ts:74
     try: () => JSON.parse(new TextDecoder().decode(body)),
0.90 packages/alchemy/src/Neon/Website/Artifact.ts:561
     () => JSON.parse(text) as PackageManifest,
0.90 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:144
     Effect.flatMap((text) => Effect.try(() => JSON.parse(text))),
0.90 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:189
     ? yield* result.json.pipe(
0.90 packages/alchemy/test/Fly/fixtures/legacy-protocol-writer.ts:115
     const body = JSON.parse(
0.90 packages/alchemy/test/Fly/fixtures/transport.ts:102
     if (typeof value.min_secrets_version === "number")
0.90 packages/frontend-frameworks/src/nextjs/aws.ts:366
     * deploy ships the OpenNext bundles from disk, never in-memory). */
0.90 packages/frontend-frameworks/src/octane/CloudflareBuild.ts:359
     },
0.89 packages/alchemy-test/src/Plan.ts:24
     JSON.parse(json),
0.89 packages/alchemy/src/AWS/DocDB/ConnectHttp.ts:102
     const secret = JSON.parse(secretString) as {
0.89 packages/alchemy/src/AWS/RDS/DBCluster.ts:463
     : {};
0.89 packages/alchemy/src/Cloudflare/Workers/GitHubRepositoryEventSource.ts:137
     payload = JSON.parse(body);
0.89 packages/alchemy/src/Git/Store/HeadSnapshot.ts:44
     const parsed = JSON.parse(raw) as HeadSnapshot;
0.89 packages/alchemy/src/Kubernetes/internal/kubeconfig.ts:282
     (JSON.parse(result.stdout) as { status?: ExecCredentialStatus }).status,
0.89 packages/alchemy/src/Prisma/ORM/internal.ts:101
     ),
0.89 packages/alchemy/src/Railway/rpc-server.ts:108
     args = JSON.parse(text) as unknown[];
0.89 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:107
     HttpServerResponse.json({ event: JSON.parse(text) }),
0.89 packages/alchemy/test/AWS/CloudControl/handler.ts:34
     return (JSON.parse(raw) as { Value?: string }).Value;
0.89 packages/alchemy/test/Local/fixtures/rpc-spawner-devserver-parent.ts:85
     return (JSON.parse(content) as { pid: number }).pid;
0.89 packages/cloudflare-runtime/src/core/internal/response.shared.ts:30
     json = JSON.parse(text);
0.89 packages/cloudflare-runtime/src/core/registry/Registry.ts:96
     JSON.parse(content),
0.89 packages/frontend-frameworks/src/core/BuildOutput.ts:111
     const parsed = JSON.parse(content) as BuildOutput & {
0.88 packages/alchemy/src/AWS/EventBridge/Permission.ts:111
     JSON.parse(res.Policy!) as {
0.88 packages/alchemy/src/AWS/OpenSearch/DataPlaneHttp.ts:301
     }).pipe(Effect.map(({ body }) => body as WriteDocumentResponse)),
0.88 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:192
     const secret = JSON.parse(secretString) as {
0.88 packages/alchemy/src/AWS/StateStore/State.ts:279
     try: () => JSON.parse(text, reviveState) as T,
0.88 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:25
     const ids = JSON.parse(raw) as string[];
0.87 packages/alchemy/src/AWS/DirectoryService/DirectoryEventSource.ts:31
     const parsed: unknown = JSON.parse(notification.Message);
0.87 packages/alchemy/src/Cloudflare/Workers/ViteChildRunner.ts:37
     ? JSON.parse(bytes.toString("utf8"))
0.87 packages/alchemy/src/Git/Hasher/Hasher.ts:294
     return makeFrameReader(response.body);
0.87 packages/alchemy/src/Prisma/Website/Artifact.ts:209
     () => JSON.parse(text) as { files?: unknown },
0.87 packages/alchemy/src/Rpc.ts:212
     export const decodeRpcValue = (value: unknown) => {
0.87 packages/alchemy/test/Fly/fixtures/protocol-branches.ts:111
     ? JSON.parse(new TextDecoder().decode(request.body.body))
0.87 packages/cloudflare-runtime/src/core/Docker.ts:420
     run([
0.86 packages/alchemy/src/AWS/SES/Contact.ts:187
     // list must outlive every contact nuke tears down.
0.86 packages/alchemy/src/Bundle/InstalledPackages.ts:575
     try: () =>
0.86 packages/alchemy/src/Cli/exec.ts:244
     * park it (a parked `Effect.never` is interrupted straight away too).
0.86 packages/cloudflare-runtime/src/core/workerd/Workerd.ts:330
     .map((line) => JSON.parse(line) as ControlMessage);
0.85 packages/alchemy/src/AWS/AuthProvider.ts:241
     : Effect.die(new Error("No account ID found")),
0.85 packages/alchemy/src/AWS/RAM/Permission.ts:164
     const parsed = JSON.parse(policy) as {
0.85 packages/alchemy/src/Prisma/ComputeBuild.ts:1400
     ),
0.85 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:110
     return yield* HttpServerResponse.json(JSON.parse(payload));
0.85 packages/cloudflare-runtime/src/vite/dev-server.ts:347
     }
0.84 packages/alchemy/src/State/LocalState.ts:125
     : JSON.parse(contents, reviveState);
0.83 packages/alchemy/src/AWS/Bedrock/LanguageModel.ts:342
     return {};
0.83 packages/alchemy/src/AWS/GreengrassV2/ComponentVersion.ts:259
     }),
0.83 packages/alchemy/src/Cloudflare/KV/ReadNamespaceHttp.ts:189
     return typeof value === "string" ? JSON.parse(value) : value;
0.83 packages/alchemy/src/Drizzle/Schema.ts:310
     snapshot: JSON.parse(text) as DrizzleSnapshot,
0.83 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:161
     const body = (yield* request.json) as {
0.82 packages/alchemy/src/AWS/LakeFormation/DataLakeSettings.ts:194
     JSON.parse(JSON.stringify(s)) as lf.DataLakeSettings;
0.82 packages/alchemy/src/Cli/checkVersion.ts:104
     () => JSON.parse(raw) as VersionCheckCache | null | undefined,
0.82 packages/alchemy/src/Cloudflare/Workflows/WorkflowBridge.ts:367
     ) as E[];
0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/env/effect.ts:84
     ? JSON.parse(env.SECRET_JSON)
0.82 packages/frontend-frameworks/src/nextjs/Nextjs.ts:356
     try: () => listEdgeFunctions(JSON.parse(manifestRaw)),
0.81 packages/alchemy/src/AWS/IAM/Policy.ts:121
     };
0.81 packages/alchemy/src/Railway/Template.ts:506
     return JSON.parse(config) as unknown;
0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:96
     payload: JSON.parse(event.payload),
0.80 packages/alchemy/src/AWS/SQS/Queue.ts:369
     ? JSON.parse(props.policy)
0.80 packages/alchemy/src/Cloudflare/AI/LanguageModel.ts:623
     const v = JSON.parse(data);
0.80 packages/alchemy/src/Prisma/Connect.ts:362
     if (parsed.kind === "value" && typeof parsed.value === "string") {
0.80 packages/alchemy/test/AWS/AppRegistry/handler.ts:90
     attributes: JSON.parse(result.attributes ?? "{}"),
0.80 packages/frontend-frameworks/src/core/Loader.ts:32
     const { type } = JSON.parse(readFileSync(manifest, "utf8")) as {
0.80 packages/frontend-frameworks/src/octane/source.ts:401
     };
0.79 packages/alchemy/src/AWS/EC2/VpcEndpoint.ts:928
     return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
0.79 packages/cloudflare-runtime/src/core/remote-bindings/workers/remote.worker.ts:100
     const { name, args, options } = JSON.parse(dispatchNamespaceOptions);
0.79 packages/pkg/src/cli/pack.ts:373
     const rewritten = JSON.parse(manifestText);
0.77 packages/alchemy/src/Runtime.ts:50
     const parsed: unknown = JSON.parse(raw);
0.76 packages/alchemy/src/AWS/Bedrock/InvokeModel.ts:61
     * const json = JSON.parse(
0.76 packages/alchemy/src/AWS/Lambda/DurableBridge.ts:128
     return JSON.parse(raw);
0.75 packages/alchemy/src/AWS/NeptuneGraph/ExecuteQuery.ts:34
     * const { results } = JSON.parse(body);
0.75 packages/alchemy/src/Docker/Service.ts:1042
     const parsed = JSON.parse(json) as T[];
0.75 packages/alchemy/src/SQL/MySQL.ts:38
     poolConfig[key] = JSON.parse(value);
0.75 packages/frontend-frameworks/src/nuxt/source.ts:374
     return (JSON.parse(content) as { version: string }).version;
0.74 packages/alchemy/src/AWS/AMP/ResourcePolicy.ts:81
     return JSON.stringify(sort(JSON.parse(document)));
0.74 packages/alchemy/src/Kubernetes/internal/client.ts:141
     resolve(responseBody);
0.74 packages/alchemy/test/AWS/SecretsManager/handler.ts:245
     return yield* HttpServerResponse.json({
0.74 packages/alchemy/test/SQL/fixtures/postgres-worker.ts:52
     const rows = (yield* request.json) as UserRow[];
0.74 packages/alchemy/test/test.resources.ts:1267
     };
0.74 packages/frontend-frameworks/src/sveltekit/source.ts:581
     Effect.gen(function* () {
0.74 packages/frontend-frameworks/src/vinext/cache/handler.ts:94
     parsed = JSON.parse(raw);
0.73 packages/alchemy/src/AWS/Glacier/Vault.ts:202
     return false;
0.73 packages/alchemy/src/AWS/OSIS/ResourcePolicy.ts:85
     return JSON.stringify(sort(JSON.parse(document)));
0.73 packages/alchemy/src/AWS/RUM/ResourcePolicy.ts:89
     return JSON.stringify(sort(JSON.parse(document)));
0.73 packages/alchemy/src/AWS/SSMContacts/Contact.ts:304
     !same(parsePolicy(observedPolicy), parsePolicy(desiredPolicy))
0.73 packages/alchemy/src/Fly/Bucket.ts:322
     if (typeof value === "string") {
0.73 packages/alchemy/test/AWS/MediaTailor/handler.ts:63
     const body = (yield* request.json) as unknown as { name: string };
0.73 packages/cloudflare-runtime/src/core/platform-proxy/PlatformProxy.worker.ts:370
     ? (JSON.parse(
0.72 packages/alchemy/src/AWS/AppSync/Resolver.ts:221
     JSON.parse(
0.72 packages/alchemy/src/AWS/Config/ConfigRule.ts:375
     Effect.succeed({} as Record<string, string>),
0.72 packages/alchemy/src/RuntimeContext.ts:154
     const parsed: unknown = JSON.parse(raw);
0.72 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:62
     const rows = (yield* request.json) as UserRow[];
0.72 packages/alchemy/test/SQL/fixtures/routes.ts:103
     const row = (yield* request.json) as UserRow;
0.72 packages/cloudflare-runtime/src/core/bindings/stream/Stream.worker.ts:234
     meta: JSON.parse(row.meta) as Record<string, string>,
0.71 packages/alchemy/src/AWS/XRay/ResourcePolicy.ts:98
     return JSON.stringify(sort(JSON.parse(document)));
0.71 packages/alchemy/src/Railway/hosted.ts:247
     const parsed: unknown = JSON.parse(value);
0.71 packages/alchemy/test/AWS/ApiGateway/fixtures/rest-api-event-source-handler.ts:57
     echoed: event.body === null ? null : JSON.parse(event.body),
0.71 packages/alchemy/test/AWS/PaymentCryptography/handler.ts:192
     // inside the service — the plaintext never leaves Payment
```
