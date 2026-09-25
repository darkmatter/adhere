# effect/basics/gen-for-sequencing

Sequential effectful steps must be written with Effect.gen and yield*, never as nested flatMap or callback chains.

67 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
const program = Effect.gen(function* () {
  const data = yield* fetchData;
  yield* Effect.logInfo(`Processing data: ${data}`);
  return yield* processData(data);
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.91 packages/alchemy/src/Cloudflare/KV/ReadNamespaceHttp.ts:40:5
  37 │   const scope = makeKVHttpScope(auth, namespaceId);
  38 │
  39 │   const getOne = (key: string, type: string) =>
> 40 │     scope.pipe(
  41 │       Effect.flatMap(({ accountId, namespaceId }) =>
  42 │         authorize(
  43 │           kv.getNamespaceValue({ accountId, namespaceId, keyName: key }),
  44 │         ).pipe(
  45 │           Effect.flatMap((res) => materializeBody(res.body, type)),
  46 │           Effect.catchTag("KeyNotFound", () => Effect.succeed(null)),
  47 │         ),
  48 │       ),
  49 │       Effect.mapError(toKVNamespaceError),
  50 │     );

0.91 packages/alchemy/src/Cloudflare/R2/WriteBucketHttp.ts:60:7
  58 │       options?: PutOptions,
  59 │     ) =>
> 60 │       scope.pipe(

0.90 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:61:7
  58 │ ): ReadFlagsClient => {
  59 │   const evaluate = (flagKey: string, context?: EvaluationContext) =>
  60 │     appId.pipe(
> 61 │       Effect.flatMap((id) =>
  62 │         auth.authorize(
  63 │           flagship.getAppEvaluate({
  64 │             accountId: auth.accountId,
  65 │             appId: id,
  66 │             flagKey,
  67 │             targetingKey: targetingKeyOf(context),
  68 │           }),
  69 │         ),
  70 │       ),
  71 │     );

0.90 packages/alchemy/src/Cloudflare/R2/ReadBucketHttp.ts:60:9
  58 │     head: (key: string) =>
  59 │       scope.pipe(
> 60 │         Effect.flatMap(({ accountId, bucketName, cfR2Jurisdiction }) =>
  61 │           authorize(
  62 │             r2.getObject({
  63 │               accountId,
  64 │               bucketName,
  65 │               objectName: key,
  66 │               cfR2Jurisdiction,
  67 │             }),
  68 │           ),
  69 │         ),
  70 │         // The HTTP body is lazy, so reading headers does not download it.
  71 │         Effect.map((res) =>
  72 │           baseObject(key, httpMetadataOf(res), {
  73 │             size: res.contentLength,
  74 │             etag: res.etag,
  75 │             uploaded: res.lastModified ? new Date(res.lastModified) : undefined,
  76 │             storageClass: res.cfR2StorageClass,
  77 │           }),
  78 │         ),
  79 │         // Native R2 `head` resolves to `null` for a missing object rather
  80 │         // than failing — mirror that for the HTTP-backed client.
  81 │         Effect.catchTag("NoSuchKey", () => Effect.succeed(null)),
  82 │         Effect.mapError(toR2Error),
  83 │       ),

0.90 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:27:5
  22 │ export const requestWorker = (
  23 │   request: HttpClientRequest.HttpClientRequest,
  24 │   options: { retryDelay?: Duration.Input } = {},
  25 │ ) =>
  26 │   HttpClient.execute(request).pipe(
> 27 │     Effect.flatMap((response) =>
  28 │       response.status !== 404 && response.status !== 500
  29 │         ? Effect.succeed(response)
  30 │         : response.text.pipe(
  31 │             Effect.flatMap((body) =>
  32 │               isWorkerPlaceholder(response.status, body)
  33 │                 ? Effect.fail(new WorkerNotPropagated({ url: request.url }))
  34 │                 : Effect.succeed(response),
  35 │             ),
  36 │           ),
  37 │     ),
  38 │     Effect.retry({
  39 │       while: (error) => error._tag === "WorkerNotPropagated",
  40 │       schedule: Schedule.spaced(options.retryDelay ?? "1 second"),
  41 │       times: 8,
  42 │     }),
  43 │   );

0.90 packages/frontend-frameworks/src/vinext/Modules.ts:12:5
   9 │ /** Vinext exposes import-only entrypoints that require.resolve cannot resolve. */
  10 │ export const loadVinextModule = <T>(root: string, file: string) =>
  11 │   resolveProjectPackageDirectory(root, "vinext").pipe(
> 12 │     Effect.flatMap((directory) =>
  13 │       Effect.tryPromise({
  14 │         try: () =>
  15 │           import(
  16 │             /* @vite-ignore */ pathToFileURL(join(directory, "dist", file)).href
  17 │           ) as Promise<T>,
  18 │         catch: (cause) =>
  19 │           new ModuleLoadError({ root, specifier: `vinext/${file}`, cause }),
  20 │       }),
  21 │     ),
  22 │   );

0.89 packages/alchemy/src/Util/AtomicFile.ts:29:5
  24 │ ): Effect.Effect<void, PlatformError> =>
  25 │   Effect.suspend(() => {
  26 │     const tmp = `${filePath}.${process.pid}.${Math.random()
  27 │       .toString(36)
  28 │       .slice(2)}.tmp`;
> 29 │     return fs.writeFileString(tmp, contents).pipe(
  30 │       Effect.flatMap(() =>
  31 │         mode === undefined ? Effect.void : fs.chmod(tmp, mode),
  32 │       ),
  33 │       Effect.flatMap(() => fs.rename(tmp, filePath)),
  34 │       Effect.tapError(() => fs.remove(tmp).pipe(Effect.ignore)),
  35 │     );
  36 │   });

0.88 packages/alchemy/src/ACME/Pki.ts:142:3
  139 │ export const privateKeyToJwk = (
  140 │   pem: Redacted.Redacted<string> | string,
  141 │ ): Effect.Effect<Redacted.Redacted<string>, PkiError> =>
> 142 │   importPrivateKey(pem).pipe(
  143 │     Effect.flatMap(({ key }) =>
  144 │       tryPromise("Exporting the certificate key as a JWK failed.", async () =>
  145 │         Redacted.make(
  146 │           JSON.stringify(await crypto.subtle.exportKey("jwk", key)),
  147 │         ),
  148 │       ),
  149 │     ),
  150 │   );

0.88 packages/alchemy/src/Cloudflare/Queues/WriteQueueHttp.ts:66:7
  64 │   const push = (messages: ReadonlyArray<SendMessage>) =>
  65 │     scope.pipe(
> 66 │       Effect.flatMap(({ accountId, queueId }) =>
  67 │         auth.authorize(
  68 │           queues.bulkPushMessages({
  69 │             accountId,
  70 │             queueId,
  71 │             messages: messages.map(toMessage),
  72 │           }),
  73 │         ),
  74 │       ),
  75 │       Effect.mapError(toQueueSendError),
  76 │       Effect.asVoid,
  77 │     );

0.88 packages/cloudflare-runtime/src/core/bindings/DurableObjectNamespace.ts:81:7
  80 │     return context.get(RegistryProxy).pipe(
> 81 │       Effect.flatMap((proxy) =>
  82 │         proxy.api.subscribe({
  83 │           kind: "durable-object",
  84 │           scriptName,
  85 │           className,
  86 │           uniqueKey:
  87 │             uniqueKey ?? defaultDurableObjectUniqueKey(scriptName, className),
  88 │         }),
  89 │       ),
  90 │       Effect.map((durableObjectNamespace): WorkerdConfig.Worker_Binding => ({
  91 │         name: binding,
  92 │         durableObjectNamespace,
  93 │       })),
  94 │     );

0.87 packages/alchemy/src/Cloudflare/HttpClientUtils.ts:22:7
  21 │     token.value.pipe(
> 22 │       Effect.flatMap((value) =>
  23 │         eff.pipe(
  24 │           Effect.provide(
  25 │             fromApiToken({ apiToken: Redacted.value(value) }).pipe(
  26 │               Layer.provideMerge(FetchHttpClient.layer),
  27 │             ),
  28 │           ),
  29 │         ),
  30 │       ),
  31 │     );

0.87 packages/alchemy/src/Cloudflare/Workers/DurableObjectBridge.ts:88:17
   86 │               return constructor.pipe(
   87 │                 Effect.provide(doContext),
>  88 │                 Effect.flatMap((instance) =>
   89 │                   Effect.suspend(() => {
   90 │                     const seal = initializeAlarmCallbacks(this.#state);
   91 │                     const instanceContext = Layer.succeed(
   92 │                       RuntimeContext,
   93 │                       instanceRuntimeContext,
   94 │                     ).pipe(Layer.provideMerge(doContext));
   95 │                     return instance.pipe(
   96 │                       Effect.provide(instanceContext),
   97 │                       Effect.ensuring(Effect.sync(seal)),
   98 │                     );
   99 │                   }),
  100 │                 ),
  101 │                 Effect.map((instance) => ({
  102 │                   instance,
  103 │                   services: Context.add(
  104 │                     services,
  105 │                     RuntimeContext,
  106 │                     instanceRuntimeContext,
  107 │                   ),
  108 │                   context,
  109 │                   telemetry,
  110 │                 })),
  111 │                 Effect.runPromise,
  112 │               );

0.87 packages/alchemy/src/Local/RpcServerEnvironment.ts:99:7
   96 │ export const fromEnv = () =>
   97 │   Layer.unwrap(
   98 │     fromProcessEnv.pipe(
>  99 │       Effect.flatMap(
  100 │         (
  101 │           environment,
  102 │         ): Effect.Effect<ReturnType<typeof layer>, unknown, never> =>
  103 │           environment.stack === undefined ||
  104 │           environment.alchemyContext === undefined
  105 │             ? Effect.die(
  106 │                 new Error(
  107 │                   `${RPC_SERVER_ENVIRONMENT_KEY} carries no stack/alchemyContext — this child requires the legacy single-stack environment`,
  108 │                 ),
  109 │               )
  110 │             : Effect.succeed(
  111 │                 layer({
  112 │                   profile: environment.profile,
  113 │                   envFile: environment.envFile,
  114 │                   stack: environment.stack,
  115 │                   alchemyContext: environment.alchemyContext,
  116 │                 }),
  117 │               ),
  118 │       ),
  119 │     ),
  120 │   );

0.87 packages/alchemy/src/Runtime/Bootstrap/Lambda.ts:75:5
  71 │   const handlerEffect: Effect.Effect<unknown, unknown> = Layer.buildWithScope(
  72 │     entryLayer,
  73 │     instanceScope,
  74 │   ).pipe(
> 75 │     Effect.flatMap((context) =>
  76 │       entrypointTag.pipe(
  77 │         Effect.flatMap((func) => func.RuntimeContext.exports),
  78 │         Effect.flatMap((exports: any) => exports.handler),
  79 │         Effect.provideContext(context),
  80 │       ),
  81 │     ),
  82 │     Scope.provide(instanceScope),
  83 │   );

0.86 packages/alchemy/src/Alchemist/Progress.ts:158:5
  153 │ export const withSpanEvents =
  154 │   (report: ProgressReporter): ProgressReporter =>
  155 │   (event) => {
  156 │     const spanEvent = spanEventOf(event);
  157 │     if (spanEvent === undefined) return report(event);
> 158 │     return Effect.currentSpan.pipe(
  159 │       Effect.flatMap((span) =>
  160 │         Effect.flatMap(Clock.currentTimeNanos, (now) =>
  161 │           Effect.sync(() =>
  162 │             span.event(spanEvent.name, now, spanEvent.attributes),
  163 │           ),
  164 │         ),
  165 │       ),
  166 │       Effect.ignore,
  167 │       Effect.andThen(report(event)),
  168 │     );
  169 │   };

0.86 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:381:5
  380 │   list: (params) =>
> 381 │     Effect.flatMap(ref, (name) =>
  382 │       run(
  383 │         auth,
  384 │         Stream.runCollect(
  385 │           aisearch.listNamespaceInstances.pages({
  386 │             accountId: auth.accountId,
  387 │             name,
  388 │             perPage: params?.per_page,
  389 │             orderBy: params?.order_by,
  390 │             orderByDirection: params?.order_by_direction,
  391 │             search: params?.search,
  392 │           }),
  393 │         ),
  394 │       ),
  395 │     ).pipe(
  396 │       Effect.map((chunk) =>
  397 │         mapList(
  398 │           Array.from(chunk).flatMap(
  399 │             (page) =>
  400 │               (page.result ??
  401 │                 []) as unknown as aisearch.ReadNamespaceInstanceResponse[],
  402 │           ),
  403 │         ),
  404 │       ),
  405 │     ),

0.86 packages/alchemy/src/Prisma/Internal/BucketClient.ts:116:9
  106 │ export const makeBucketAccess = (
  107 │   credentials: BucketCredentials,
  108 │ ): BucketAccess => {
  109 │   const context = signingContext(credentials);
  110 │   return {
  111 │     bucketName: credentials.bucketName,
  112 │     authorize: (effect) =>
  113 │       context.pipe(Effect.flatMap((layer) => Effect.provide(effect, layer))),
  114 │     presign: (request) =>
  115 │       Effect.all([context, credentials.bucketName]).pipe(
> 116 │         Effect.flatMap(([layer, bucket]) =>
  117 │           Presign.presignS3Url({
  118 │             method: request.method,
  119 │             bucket,
  120 │             key: request.key,
  121 │             region: BUCKET_SIGNING_REGION,
  122 │             expiresIn: request.expiresIn,
  123 │             contentType:
  124 │               request.method === "PUT" ? request.contentType : undefined,
  125 │             responseContentType:
  126 │               request.method === "GET"
  127 │                 ? request.responseContentType
  128 │                 : undefined,
  129 │           }).pipe(Effect.provide(layer)),
  130 │         ),
  131 │         Effect.mapError(toBucketError),
  132 │       ),
  133 │   };
  134 │ };

0.86 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:10:3
   7 │ import { observeDeployment } from "./DeploymentObserve.ts";
   8 │
   9 │ const startConflictIsIdempotent = (deploymentId: string, error: Conflict) =>
> 10 │   observeDeployment(deploymentId).pipe(
  11 │     Effect.flatMap((deployment) =>
  12 │       deployment.status === "running" || deployment.status === "provisioning"
  13 │         ? Effect.succeed(undefined)
  14 │         : Effect.fail(error),
  15 │     ),
  16 │     Effect.catchTag("NotFound", () => Effect.fail(error)),
  17 │   );

0.85 packages/alchemy/src/Cloudflare/Workers/BrowserBinding.ts:40:7
  39 │     raw.pipe(
> 40 │       Effect.flatMap((binding) =>
  41 │         tryPromise(() => binding.quickAction(action as any, options as any)),
  42 │       ),
  43 │       Effect.flatMap((response) =>
  44 │         response.ok ? Effect.succeed(response) : failResponse(action, response),
  45 │       ),
  46 │     );

0.85 packages/alchemy/src/Railway/LoginSession.ts:87:5
   84 │ export const pollLoginSessionToken = (code: string) =>
   85 │   railway.verifyLoginSession({ code }).pipe(
   86 │     railway.catchTags(missingSession, () => Effect.succeed(false)),
>  87 │     Effect.flatMap(() =>
   88 │       railway
   89 │         .loginSessionConsume({ code })
   90 │         .pipe(railway.catchTags(missingSession, () => Effect.succeed(null))),
   91 │     ),
   92 │     Effect.map((token) =>
   93 │       token != null && token.length > 0 ? token : undefined,
   94 │     ),
   95 │     Effect.repeat({
   96 │       schedule: Schedule.spaced("1 second"),
   97 │       while: (token) => token == null,
   98 │       times: LOGIN_POLL_TIMES,
   99 │     }),
  100 │   );

0.84 packages/alchemy/src/Cloudflare/KV/WriteNamespaceHttp.ts:44:7
  39 │     put: ((
  40 │       key: string,
  41 │       value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
  42 │       options?: KVNamespacePutOptions,
  43 │     ) =>
> 44 │       scope.pipe(
  45 │         Effect.flatMap(({ accountId, namespaceId }) =>
  46 │           toKVBody(value).pipe(
  47 │             Effect.flatMap((body) =>
  48 │               authorize(
  49 │                 kv.putNamespaceValue({
  50 │                   accountId,
  51 │                   namespaceId,
  52 │                   keyName: key,
  53 │                   value: body,
  54 │                   expiration: options?.expiration,
  55 │                   expirationTtl: options?.expirationTtl,
  56 │                   metadata: options?.metadata,
  57 │                 }),
  58 │               ),
  59 │             ),
  60 │           ),
  61 │         ),
  62 │         Effect.mapError(toKVNamespaceError),
  63 │         Effect.asVoid,
  64 │       )) as any,

0.84 packages/alchemy/src/Runtime/Bootstrap/Process.ts:91:5
   90 │   entrypointTag.pipe(
>  91 │     Effect.flatMap((self) => {
   92 │       const program: Effect.Effect<any, any, any> =
   93 │         self.RuntimeContext.exports.pipe(
   94 │           Effect.flatMap((exports: any) => exports[exportKey]),
   95 │         );
   96 │       return options?.telemetry
   97 │         ? program.pipe(provideProcessTelemetry(self.RuntimeContext))
   98 │         : program;
   99 │     }),
  100 │   );

0.84 packages/alchemy/test/Local/fixtures/process-effect.ts:71:7
  65 │ export const pidListeningOn = (wsUrl: string) => {
  66 │   const port = new URL(wsUrl).port;
  67 │   if (process.platform === "win32") {
  68 │     return ChildProcess.make("netstat", ["-ano", "-p", "TCP"], {
  69 │       stdout: "pipe",
  70 │     }).pipe(
> 71 │       Effect.flatMap((handle) =>
  72 │         handle.stdout.pipe(Stream.decodeText, Stream.mkString),
  73 │       ),
  74 │       Effect.map((stdout) => {
  75 │         // Columns: Proto | Local Address | Foreign Address | State | PID
  76 │         const line = stdout
  77 │           .split("\n")
  78 │           .find((l) => l.includes("LISTENING") && l.includes(`:${port} `));
  79 │         return Number.parseInt(line?.trim().split(/\s+/).at(-1) ?? "", 10);
  80 │       }),
  81 │     );
  82 │   }
  83 │   return ChildProcess.make("lsof", [`-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
  84 │     stdout: "pipe",
  85 │   }).pipe(
  86 │     Effect.flatMap((handle) =>
  87 │       handle.stdout.pipe(Stream.decodeText, Stream.mkString),
  88 │     ),
  89 │     Effect.map((stdout) => Number.parseInt(stdout.trim().split("\n")[0]!, 10)),
  90 │   );
  91 │ };

0.83 packages/alchemy/src/Binding.ts:149:7
  146 │   // Output the planner resolves with the stack's services.
  147 │   (callable as any).execute = (...args: any[]) =>
  148 │     Output.fromEffect(
> 149 │       callable(...args).pipe(
  150 │         Effect.flatMap((client: any) => client()),
  151 │         Effect.orDie,
  152 │       ) as Effect.Effect<any, never, any>,
  153 │     );

0.83 packages/alchemy/src/Http.ts:88:7
  85 │   Effect.catchCause(
  86 │     handler.pipe(
  87 │       // @ts-expect-error
> 88 │       Effect.flatMap((response) =>
  89 │         HttpServerResponse.isHttpServerResponse(response)
  90 │           ? Effect.succeed(response)
  91 │           : response,
  92 │       ),
  93 │     ) as any as HttpEffect<Req>,

0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:52:13
  49 │         .handle("getTask", ({ params }) =>
  50 │           tasks.get(params.id).pipe(
  51 │             Effect.orDie,
> 52 │             Effect.flatMap((data) =>
  53 │               data
  54 │                 ? data.text().pipe(
  55 │                     Effect.map((data) => JSON.parse(data)),
  56 │                     Effect.orDie,
  57 │                   )
  58 │                 : Effect.succeed(undefined),
  59 │             ),
  60 │             Effect.flatMap((data) =>
  61 │               data
  62 │                 ? decodeTask(data).pipe(Effect.orDie)
  63 │                 : Effect.fail(new TaskNotFound({ id: params.id })),
  64 │             ),
  65 │             Effect.tapError((err) => Effect.logError("err", err)),
  66 │           ),

0.82 packages/alchemy/src/Cloudflare/Workers/WorkerBridge.ts:118:17
  105 │             Effect.provide(
  106 │               Layer.mergeAll(
  107 │                 Layer.succeed(
  108 │                   WorkerExecutionContext,
  109 │                   fromExecutionContext(ctx, env),
  110 │                 ),
  111 │                 Layer.succeed(Scope.Scope, scope),
  112 │                 Layer.succeed(RuntimeContext, built.runtimeContext),
  113 │                 // The configured telemetry exporters. Constructed as part
  114 │                 // of this per-event layer, but `buildEventTelemetry`
  115 │                 // attaches their batching fibers and flush finalizers to
  116 │                 // the request `scope` (not this build's transient scope),
  117 │                 // so buffered telemetry flushes when the scope closes into
> 118 │                 // `ctx.waitUntil` below — never on workerd's ephemeral
  119 │                 // isolate scope.
  120 │                 Layer.effectContext(
  121 │                   buildEventTelemetry(built.context, scope, built.telemetry()),
  122 │                 ),
  123 │               ).pipe(
  124 │                 Layer.provideMerge(Layer.succeedContext(services)),
  125 │                 Layer.provideMerge(Layer.succeedContext(built.context)),
  126 │               ),
  127 │             ),

0.82 packages/alchemy/src/Util/layer-scoped.ts:14:3
  11 │ export const buildLayerScoped = <ROut, E, RIn>(
  12 │   layer: Layer.Layer<ROut, E, RIn>,
  13 │ ): Effect.Effect<Context.Context<ROut>, E, RIn | Scope.Scope> =>
> 14 │   Effect.flatMap(Effect.scope, (scope) => Layer.buildWithScope(layer, scope));

0.82 packages/frontend-frameworks/src/sveltekit/neon.ts:22:7
  17 │ export const target = (config?: Parameters<typeof makeNodeTarget>[0]) => {
  18 │   const node = makeNodeTarget(config);
  19 │   return {
  20 │     ...makeNeonTarget(node),
  21 │     build: (context: Parameters<NonNullable<typeof node.build>>[0]) =>
> 22 │       node.build!(context).pipe(Effect.flatMap(finish)),
  23 │     finish: (...args: Parameters<NonNullable<typeof node.finish>>) =>
  24 │       node.finish!(...args).pipe(Effect.flatMap(finish)),
  25 │   };
  26 │ };

0.82 packages/frontend-frameworks/src/vinext/cache/s3-runtime.ts:50:11
  44 │     async getText(key) {
  45 │       return runAws(
  46 │         S3.getObject({
  47 │           Bucket: bucket,
  48 │           Key: objectKey(key),
  49 │         }).pipe(
> 50 │           Effect.flatMap((result) =>
  51 │             result.Body === undefined
  52 │               ? Effect.succeed(undefined)
  53 │               : Stream.mkString(Stream.decodeText(result.Body)),
  54 │           ),
  55 │           Effect.catchTag("NoSuchKey", () => Effect.succeed(undefined)),
  56 │         ),
  57 │       );
  58 │     },

0.81 packages/cloudflare-runtime/src/core/Docker.ts:223:9
  222 │         spawner.spawn,
> 223 │         Effect.flatMap((child) =>
  224 │           child.stdout.pipe(
  225 │             Stream.decodeText,
  226 │             Stream.splitLines,
  227 │             Stream.filter((line) => line.trim() !== ""),
  228 │             Stream.map(
  229 │               (line) =>
  230 │                 JSON.parse(line) as {
  231 │                   Current: boolean;
  232 │                   DockerEndpoint: string;
  233 │                 },
  234 │             ),
  235 │             Stream.runCollect,
  236 │             Effect.flatMap((items) => {
  237 │               const endpoint = items.find(
  238 │                 (item) => item.Current,
  239 │               )?.DockerEndpoint;
  240 │               return endpoint
  241 │                 ? Effect.succeed(endpoint)
  242 │                 : Effect.fail(
  243 │                     new ConfigError({
  244 │                       subtag: "DockerHostNotFound",
  245 │                       message: "Docker host not found",
  246 │                     }),
  247 │                   );
  248 │             }),
  249 │           ),
  250 │         ),

0.80 packages/alchemy/src/AWS/StepFunctions/Asl/simulate.ts:214:7
  202 │     case "integrate": {
  203 │       const key = node.waitForTaskToken
  204 │         ? `${node.options.resource}.waitForTaskToken`
  205 │         : node.options.resource;
  206 │       const handler = env.handlers[key];
  207 │       if (handler === undefined) {
  208 │         return Effect.fail(
  209 │           new SimulateError({
  210 │             message: `no simulate handler for integration "${key}"`,
  211 │           }),
  212 │         );
  213 │       }
> 214 │       return evalExpr(node.options.arguments, env).pipe(
  215 │         Effect.flatMap(handler),
  216 │       );
  217 │     }

0.80 packages/alchemy/src/Cloudflare/Workers/Source.ts:297:5
  287 │     return Effect.tryPromise({
  288 │       try: () => import(/* @vite-ignore */ specifier),
  289 │       catch: (cause) =>
  290 │         new SourceProviderError({
  291 │           provider: specifier,
  292 │           message:
  293 │             `Failed to import Worker source provider "${specifier}". ` +
  294 │             `Is the package installed in your project? Install it and re-run.`,
  295 │           cause,
  296 │         }),
> 297 │     }).pipe(
  298 │       Effect.flatMap((mod: { default?: Partial<WorkerSourceModule> }) => {
  299 │         if (typeof mod.default?.make !== "function") {
  300 │           return Effect.fail(
  301 │             new SourceProviderError({
  302 │               provider: specifier,
  303 │               message:
  304 │                 `Module "${specifier}" is not a Worker source provider: ` +
  305 │                 `its default export must satisfy WorkerSourceModule ({ make(options) }).`,
  306 │             }),
  307 │           );
  308 │         }
  309 │         const module = mod.default as WorkerSourceModule;
  310 │         sourceModules.set(specifier, module);
  311 │         return Effect.succeed(module);
  312 │       }),
  313 │     );

0.80 packages/alchemy/src/Neon/FunctionBridge.ts:67:5
  63 │   const build = Layer.buildWithScope(
  64 │     makeEntrypointLayer(tag, entrypoint).pipe(Layer.provideMerge(platform)),
  65 │     instanceScope,
  66 │   ).pipe(
> 67 │     Effect.flatMap((context) =>
  68 │       tag.pipe(
  69 │         Effect.flatMap((host) =>
  70 │           host.RuntimeContext.handler.pipe(
  71 │             Effect.map((handler) => ({
  72 │               ...handler,
  73 │               runtime: host.RuntimeContext,
  74 │               built: context,
  75 │             })),
  76 │           ),
  77 │         ),
  78 │         Effect.provideContext(context),
  79 │       ),
  80 │     ),
  81 │     Effect.cachedWithTTL((exit) => (Exit.isSuccess(exit) ? Infinity : 0)),
  82 │     Effect.runSync,
  83 │   );

0.80 packages/alchemy/src/Stack.ts:405:5
  402 │   const body = Effect.gen(function* () {
  403 │     const stack = yield* effect;
  404 │     const configProvider = yield* loadConfigProvider(Option.none());
> 405 │     return yield* fn(stack).pipe(
  406 │       provideFreshArtifactStore,
  407 │       Effect.provide(
  408 │         Layer.succeedContext(stack.services).pipe(
  409 │           Layer.provideMerge(Layer.succeed(ConfigProvider, configProvider)),
  410 │         ),
  411 │       ),
  412 │     );
  413 │   }).pipe(
  414 │     Effect.provide(
  415 │       Layer.effect(
  416 │         AuthProviders,
  417 │         Effect.serviceOption(AuthProviders).pipe(
  418 │           Effect.map(Option.getOrElse(() => ({}))),
  419 │         ),
  420 │       ).pipe(
  421 │         Layer.provideMerge(Layer.succeed(Stage, options.stage)),
  422 │         Layer.provideMerge(
  423 │           Layer.provideMerge(alchemy({ dev: options.dev }), platform),
  424 │         ),
  425 │       ),
  426 │     ),
  427 │   );

0.79 packages/alchemy/src/Bundle/Bundle.ts:341:11
  326 │     Stream.mapEffect((event) =>
  327 │       Effect.gen(function* () {
  328 │         if (event._tag !== "Success") {
  329 │           return event;
  330 │         }
  331 │         return yield* bundleOutputFromRolldownOutputBundle(event.output).pipe(
  332 │           Effect.map((output): BundleWatchEvent.Success => ({
  333 │             _tag: "Success",
  334 │             output,
  335 │           })),
  336 │           Effect.catch((error) =>
  337 │             Effect.succeed<BundleWatchEvent.Error>({
  338 │               _tag: "Error",
  339 │               error: bundleErrorFromUnknown(error),
  340 │             }),
> 341 │           ),
  342 │         );
  343 │       }),
  344 │     ),

0.79 packages/alchemy/src/Cloudflare/Fetcher.ts:301:5
  276 │ export const fromCloudflareSocket = (
  277 │   cfSocket: globalThis.Socket | cf.Socket,
  278 │ ): Socket.Socket =>
  279 │   // `fromTransformStream` snapshots fiber context, then waits to acquire
  280 │   // the streams until a consumer opens the reader. `runSync` is only that
  281 │   // snapshot — connection still happens on first `socket.reader`.
  282 │   Effect.runSync(
  283 │     Socket.fromTransformStream(
  284 │       Effect.tryPromise({
  285 │         try: () =>
  286 │           Promise.resolve(cfSocket.opened).then(
  287 │             () =>
  288 │               ({
  289 │                 readable: cfSocket.readable,
  290 │                 writable: cfSocket.writable,
  291 │               }) as Socket.InputTransformStream,
  292 │           ),
  293 │         catch: (cause) =>
  294 │           new Socket.SocketError({
  295 │             reason: new Socket.SocketOpenError({
  296 │               kind: "Unknown",
  297 │               cause,
  298 │             }),
  299 │           }),
  300 │       }),
> 301 │     ),
  302 │   );

0.79 packages/alchemy/test/Hetzner/fixtures/app/shared.ts:80:3
  78 │ export const AppRecord = Hetzner.RecordSet(
  79 │   "App",
> 80 │   Effect.flatMap(Edge, (lb) =>
  81 │     Effect.map(DnsZone, (zone) => ({
  82 │       zone,
  83 │       name: "app",
  84 │       type: "A" as const,
  85 │       records: [{ value: lb.ipv4.as<string>() }],
  86 │       ttl: 300,
  87 │     })),
  88 │   ),
  89 │ );

0.77 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:63:7
  56 │ export const makeQueryDatabaseClientFrom = (
  57 │   rawEff: Effect.Effect<runtime.D1Database>,
  58 │ ): QueryDatabaseClient => {
  59 │   return {
  60 │     raw: rawEff,
  61 │     prepare: (query: string) => new PreparedStatement(query, [], rawEff),
  62 │     exec: (query: string) =>
> 63 │       Effect.flatMap(rawEff, (raw) => Effect.promise(() => raw.exec(query))),
  64 │     batch: <T = unknown>(statements: PreparedStatement[]) =>
  65 │       Effect.flatMap(rawEff, (raw) =>
  66 │         Effect.promise(() =>
  67 │           raw.batch<T>(statements.map((s) => s._build(raw))),
  68 │         ),
  69 │       ),
  70 │   } satisfies QueryDatabaseClient;
  71 │ };

0.77 packages/alchemy/src/Railway/ServiceRegion.ts:174:5
  173 │   readServiceRegion(input).pipe(
> 174 │     Effect.flatMap((observed) =>
  175 │       observed === input.region
  176 │         ? Effect.succeed(input.region)
  177 │         : Effect.fail(
  178 │             new ServiceRegionPending({
  179 │               serviceId: input.serviceId,
  180 │               region: input.region,
  181 │             }),
  182 │           ),
  183 │     ),

0.76 packages/alchemy/src/Cli/exec.ts:226:5
  211 │ const runBunDevWatcher = (options: DevOptions) =>
  212 │   Effect.acquireRelease(
  213 │     Effect.sync(() =>
  214 │       // Match Node's project-wide graph: the stack entrypoint may live in a
  215 │       // subdirectory while importing sibling source trees.
  216 │       trackBunImports({ root: initialCwd }),
  217 │     ),
  218 │     (tracker) => Effect.promise(() => tracker.close()),
  219 │   ).pipe(
  220 │     Effect.flatMap((tracker) =>
  221 │       Effect.raceFirst(
  222 │         devKeepAlive(runDev(options)).pipe(Effect.scoped),
  223 │         nextChange(tracker),
  224 │       ),
  225 │     ),
> 226 │     Effect.flatMap((paths) =>
  227 │       paths === undefined
  228 │         ? Effect.void
  229 │         : logReload(paths).pipe(
  230 │             Effect.andThen(
  231 │               Effect.sync(() => {
  232 │                 process.exitCode = DEV_RELOAD_EXIT_CODE;
  233 │               }),
  234 │             ),
  235 │           ),
  236 │     ),
  237 │   );

0.76 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:51:5
  46 │   const local = <A, E>(
  47 │     fn: (
  48 │       name: string,
  49 │     ) => Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  50 │   ): Effect.Effect<A> =>
> 51 │     Effect.flatMap(indexName, (name) => auth.authorize(fn(name))).pipe(
  52 │       Effect.orDie,
  53 │     );

0.76 packages/alchemy/src/Local/Sidecar.ts:21:3
  18 │ import * as RpcServer from "./RpcServer.ts";
  19 │
  20 │ RpcServer.launch((group) =>
> 21 │   Effect.promise(() => import(group)).pipe(
  22 │     Effect.flatMap((module: { default?: unknown }) =>
  23 │       Layer.isLayer(module.default)
  24 │         ? Effect.succeed(module.default as RpcServer.ProviderLayer)
  25 │         : Effect.fail(
  26 │             new Error(
  27 │               `Provider group module ${group} must default-export its provider Layer`,
  28 │             ),
  29 │           ),
  30 │     ),
  31 │   ),
  32 │ );

0.76 packages/alchemy/src/Platform.ts:501:11
  498 │         // build the Layer once for the root Self
  499 │         const SelfLayer = Layer.effect(
  500 │           Self,
> 501 │           Effect.flatMap(

0.76 packages/alchemy/src/SQLite/BunSQLite.ts:51:5
  45 │   transaction: <A, E>(
  46 │     fn: (conn: SQLiteConnection) => Effect.Effect<A, E, never>,
  47 │   ) => {
  48 │     // For Bun's synchronous SQLite, we can use the same connection
  49 │     // since everything runs synchronously within the transaction
  50 │     const conn = fromDatabase(db);
> 51 │     return Effect.flatMap(
  52 │       Effect.try({
  53 │         try: () => db.transaction(() => Effect.runSync(fn(conn))),
  54 │         catch: (e) =>
  55 │           parseError(
  56 │             extractErrorCode(e),
  57 │             `Failed to create transaction: ${e}`,
  58 │             e,
  59 │           ),
  60 │       }),
  61 │       (txFn) =>
  62 │         Effect.try({
  63 │           try: () => txFn(),
  64 │           catch: (e) =>
  65 │             parseError(extractErrorCode(e), `Transaction failed:`, e),
  66 │         }),
  67 │     );
  68 │   },

0.76 packages/alchemy/test/AWS/MediaLive/fixtures/channel-handler.ts:195:13
> 195 │             Effect.flatMap(() => describeSchedule()),

0.75 packages/alchemy/src/Infisical/AuthProvider.ts:281:7
  278 │   configSchema: InfisicalAuthConfigSchema,
  279 │   configure: () =>
  280 │     chooseMethod.pipe(
> 281 │       Effect.flatMap((method) =>
  282 │         collectFieldValues(fieldsFor(method)).pipe(
  283 │           Effect.map((values) => toConfig(method, values)),
  284 │         ),
  285 │       ),
  286 │       Effect.flatMap(verify),
  287 │     ),

0.75 packages/alchemy/src/Prisma/ReadBucket.ts:120:7
  117 │ ): ReadBucketClient => ({
  118 │   head: (key: string) =>
  119 │     access.bucketName.pipe(
> 120 │       Effect.flatMap((Bucket) =>
  121 │         access.authorize(S3.headObject({ Bucket, Key: key })),
  122 │       ),
  123 │       Effect.map((response) => objectFrom(key, response)),
  124 │       // A missing key is absence, not a failure — mirror the native bucket
  125 │       // clients that resolve `null`.
  126 │       Effect.catchTag("NotFound", () => Effect.succeed(null)),
  127 │       Effect.mapError(toBucketError),
  128 │     ),

0.75 packages/cloudflare-runtime/src/core/test/helpers/port.ts:21:3
  20 │ export const find = (port: number) =>
> 21 │   Port.make({ cache: false }).pipe(Effect.flatMap((ports) => ports.find(port)));

0.74 packages/alchemy/src/Cloudflare/Access.ts:51:9
  48 │     const login = (domain: string) =>
  49 │       ChildProcess.make("cloudflared", ["access", "login", domain]).pipe(
  50 │         spawner.spawn,
> 51 │         Effect.flatMap((process) => Stream.runCollect(process.stdout)),
  52 │         Effect.mapError(
  53 │           (error) =>
  54 │             new AccessError({
  55 │               message:
  56 │                 `The domain "${domain}" uses Cloudflare Access, but \`cloudflared\` is not installed. ` +
  57 │                 `Please install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation.`,
  58 │               cause: error,
  59 │             }),
  60 │         ),
  61 │         Effect.flatMap((stdout) => {
  62 │           const matches = stdout
  63 │             .toString()
  64 │             .match(/fetched your token:\n\n(.*)/m);
  65 │           return matches && matches.length >= 2
  66 │             ? Effect.succeed({ Cookie: `CF_Authorization=${matches[1]}` })
  67 │             : Effect.fail(
  68 │                 new AccessError({
  69 │                   message: "Failed to authenticate with Cloudflare Access",
  70 │                 }),
  71 │               );
  72 │         }),
  73 │         Effect.scoped,
  74 │       );

0.74 packages/alchemy/src/Prisma/WriteBucket.ts:115:7
  112 │ ): WriteBucketClient => ({
  113 │   put: (key: string, value: BucketBody, options?: PutOptions) =>
  114 │     access.bucketName.pipe(
> 115 │       Effect.flatMap((Bucket) =>
  116 │         access.authorize(
  117 │           S3.putObject({
  118 │             Bucket,
  119 │             Key: key,
  120 │             Body: value,
  121 │             ContentType: options?.contentType,
  122 │             ContentLength: options?.contentLength,
  123 │             CacheControl: options?.cacheControl,
  124 │             ContentDisposition: options?.contentDisposition,
  125 │             ContentEncoding: options?.contentEncoding,
  126 │             Metadata: options?.metadata,
  127 │           }),
  128 │         ),
  129 │       ),
  130 │       Effect.map((response) =>
  131 │         objectFrom(key, {
  132 │           ETag: response.ETag,
  133 │           ContentLength: options?.contentLength,
  134 │           ContentType: options?.contentType,
  135 │           Metadata: options?.metadata,
  136 │         }),
  137 │       ),
  138 │       Effect.mapError(toBucketError),
  139 │     ),

0.74 packages/alchemy/src/Railway/PrivateNetwork.ts:101:9
   93 │ const waitForNetworkConfig = (
   94 │   environmentId: string,
   95 │   ready: (config: typeof NetworkConfig.Type) => boolean,
   96 │ ) =>
   97 │   readNetworkConfig(environmentId).pipe(
   98 │     Effect.flatMap((config) =>
   99 │       ready(config)
  100 │         ? Effect.void
> 101 │         : Effect.fail(
  102 │             new PrivateNetworkConfigPending({
  103 │               environmentId,
  104 │               message: "Waiting for Railway private-network configuration",
  105 │             }),
  106 │           ),
  107 │     ),
  108 │     Effect.retry({
  109 │       while: (error) => error._tag === "Railway.PrivateNetworkConfigPending",
  110 │       schedule: Schedule.spaced("1 second"),
  111 │       times: 8,
  112 │     }),
  113 │   );

0.74 packages/alchemy/test/Command/fixture/lifecycle-support.ts:40:3
  39 │ export const pgid = (pid: number) =>
> 40 │   ChildProcess.make("ps", ["-o", "pgid=", "-p", String(pid)]).pipe(
  41 │     Effect.flatMap((child) =>
  42 │       child.stdout.pipe(Stream.decodeText, Stream.mkString),
  43 │     ),
  44 │     Effect.map((text) => Number(text.trim())),
  45 │     Effect.scoped,
  46 │   );

0.74 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:46:5
  42 │ export const getText = (url: string) =>
  43 │   HttpClient.get(url, {
  44 │     headers: { connection: "close", "cache-control": "no-cache" },
  45 │   }).pipe(
> 46 │     Effect.flatMap((response) =>
  47 │       response.status === 200
  48 │         ? response.text
  49 │         : Effect.fail(new Error(`Website returned HTTP ${response.status}`)),
  50 │     ),
  51 │     Effect.timeout("10 seconds"),
  52 │   );

0.74 packages/better-auth/src/ApiProxy.ts:50:13
  47 │         let wrapper = wrappers.get(key);
  48 │         if (wrapper === undefined) {
  49 │           wrapper = (...args: unknown[]) =>
> 50 │             Effect.flatMap(makeAuth, (auth) =>
  51 │               Effect.tryPromise({
  52 │                 try: () =>
  53 │                   (
  54 │                     auth.api as Record<
  55 │                       string,
  56 │                       (...args: unknown[]) => Promise<unknown>
  57 │                     >
  58 │                   )[key]!(...args),
  59 │                 catch: (error) => error,
  60 │               }).pipe(
  61 │                 Effect.catch((error: unknown) =>
  62 │                   isAPIErrorLike(error)
  63 │                     ? Effect.fail(BetterAuthApiError.fromAPIError(error))
  64 │                     : Effect.die(error),
  65 │                 ),
  66 │               ),
  67 │             );
  68 │           wrappers.set(key, wrapper);
  69 │         }

0.73 packages/alchemy/src/Git/GitHubCompat.ts:496:13
  487 │     commits: () =>
  488 │       withRepo(({ repo, origin, repoUrl, url }) =>
  489 │         repo
  490 │           .readCommitLog({
  491 │             ref: url.searchParams.get("sha") ?? undefined,
  492 │             cursor: url.searchParams.get("cursor") ?? undefined,
  493 │             limit: perPage(url),
  494 │           })
  495 │           .pipe(
> 496 │             Effect.flatMap((page) =>
  497 │               ghJson(
  498 │                 page.items.map((commit) => ghCommit(commit, origin, repoUrl)),
  499 │                 {
  500 │                   headers: linkHeaders(
  501 │                     `${repoUrl}/commits`,
  502 │                     url.searchParams,
  503 │                     page.hasMore ? page.nextCursor : null,
  504 │                   ),
  505 │                 },
  506 │               ),
  507 │             ),
  508 │           ),
  509 │       ),

0.73 packages/cloudflare-runtime/src/core/registry/Registry.ts:87:9
   84 │     const readEntry = (entry: string) => {
   85 │       const entryPath = path.join(directory, entry);
   86 │       return isNonStale(entryPath).pipe(
>  87 │         Effect.flatMap((valid) =>
   88 │           valid
   89 │             ? fs
   90 │                 .readFileString(entryPath)
   91 │                 .pipe(
   92 │                   Effect.map(
   93 │                     (content) =>
   94 │                       [
   95 │                         decodeURIComponent(path.basename(entry, ".json")),
   96 │                         JSON.parse(content),
   97 │                       ] as const,
   98 │                   ),
   99 │                 )
  100 │             : fs.remove(entryPath).pipe(Effect.as(undefined)),
  101 │         ),
  102 │         Effect.orElseSucceed(() => undefined),
  103 │       );
  104 │     };

0.72 packages/alchemy-test/src/PlainReporter.ts:241:7
  233 │       return Effect.sync(() => finishCollect(state)).pipe(
  234 │         Effect.andThen(
  235 │           write(
  236 │             dim(
  237 │               `running ${event.tests.length} tests from ${event.files} files\n`,
  238 │             ),
  239 │           ),
  240 │         ),
> 241 │       );

0.72 packages/alchemy/src/Namespace.ts:27:5
  25 │ export function push(id: string, eff?: Effect.Effect<any, any, any>) {
  26 │   return eff
> 27 │     ? Effect.flatMap(CurrentNamespace, (parent) =>
  28 │         Effect.provideService(eff, Namespace, {
  29 │           Id: id,
  30 │           Parent: parent,
  31 │         }),
  32 │       )
  33 │     : (eff: Effect.Effect<any, any, any>) => push(id, eff);
  34 │ }

0.72 packages/alchemy/src/Stripe/PaymentLink.ts:426:5
  423 │ const getById = (payment_link: string) =>
  424 │   GetPaymentLink({ payment_link }).pipe(
  425 │     Effect.catchIf(isMissingPaymentLink, () => Effect.succeed(undefined)),
> 426 │     Effect.flatMap((link) =>
  427 │       link === undefined ? Effect.succeed(undefined) : hydrateLineItems(link),
  428 │     ),
  429 │   );

0.72 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:104:15
  101 │         switch (operation) {
  102 │           case "GetObject":
  103 │             return yield* get({ Key, VersionId }).pipe(
> 104 │               Effect.flatMap((result) =>
  105 │                 Effect.gen(function* () {
  106 │                   const body = yield* Stream.mkString(
  107 │                     Stream.decodeText(result.Body!),
  108 │                   );
  109 │                   return yield* HttpServerResponse.json({
  110 │                     body,
  111 │                     versionId: result.VersionId,
  112 │                   });
  113 │                 }),
  114 │               ),
  115 │               Effect.catchTag(
  116 │                 ["NoSuchKey", "NoSuchVersion", "MethodNotAllowed"],
  117 │                 (error) =>
  118 │                   HttpServerResponse.json(
  119 │                     { tag: error._tag },
  120 │                     { status: error._tag === "MethodNotAllowed" ? 405 : 404 },
  121 │                   ),
  122 │               ),
  123 │             );

0.72 packages/cloudflare-runtime/src/core/proxy/WorkerProxy.ts:221:7
> 221 │       Effect.retry({ while: () => awaited !== current }),

0.71 packages/alchemy/src/AWS/AIOps/InvestigationGroup.ts:356:17
  341 │             live = yield* aiops
  342 │               .createInvestigationGroup({
  343 │                 name,
  344 │                 roleArn: news.roleArn,
  345 │                 retentionInDays: toWireDays(news.retention),
  346 │                 encryptionConfiguration: news.encryptionConfiguration,
  347 │                 tagKeyBoundaries: news.tagKeyBoundaries,
  348 │                 chatbotNotificationChannel: news.chatbotNotificationChannel,
  349 │                 isCloudTrailEventHistoryEnabled:
  350 │                   news.isCloudTrailEventHistoryEnabled,
  351 │                 crossAccountConfigurations: news.crossAccountConfigurations,
  352 │                 tags: desiredTags,
  353 │               })
  354 │               .pipe(
  355 │                 retryWhileRolePropagates,
> 356 │                 Effect.flatMap((created) =>
  357 │                   created.arn === undefined
  358 │                     ? observe(name, undefined)
  359 │                     : observeByArn(created.arn),
  360 │                 ),
  361 │                 Effect.catchTag("ConflictException", (error) =>
  362 │                   observe(name, undefined).pipe(
  363 │                     Effect.flatMap((existing) =>
  364 │                       existing === undefined
  365 │                         ? Effect.fail(error)
  366 │                         : Effect.succeed(existing),
  367 │                     ),
  368 │                   ),
  369 │                 ),
  370 │               );

0.71 packages/alchemy/src/Cloudflare/Workers/ViteChildRunner.ts:99:11
>  99 │           Effect.flatMap((provider) =>
  100 │             provider.dev({
  101 │               id: source.id,
  102 │               fqn: source.fqn,
  103 │               workerName: config.worker.name,
  104 │               compatibility,
  105 │               entry: { kind: "external" },
  106 │               stack: config.stack,
  107 │               env: config.env,
  108 │               extraOptions: undefined,
  109 │               assets: source.assets,
  110 │               worker: {
  111 │                 bindings,
  112 │                 durableObjectNamespaces: config.worker.durableObjectNamespaces,
  113 │                 hyperdrives: config.worker.hyperdrives,
  114 │                 queueConsumers: Effect.succeed(config.worker.queueConsumers),
  115 │                 assets: config.worker.assets,
  116 │               },
  117 │               runtimeContext,
  118 │             }),
  119 │           ),

0.71 packages/alchemy/src/Cloudflare/Workers/WorkerRuntime.ts:133:7
  131 │   waitUntil: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  132 │     liveExecutionContext.pipe(
> 133 │       Effect.flatMap((live) => live.waitUntil(effect)),
  134 │     ) as Effect.Effect<void, never, R | RuntimeContext>,

0.71 packages/alchemy/src/Command/Command.ts:292:9
  288 │       ): Effect.Effect<{ bin: string; args: string[] }, CommandError> => {
  289 │         if (props.shell) {
  290 │           return Effect.succeed({ bin: props.command, args: [] });
  291 │         }
> 292 │         const [bin, ...args] = props.command
  293 │           .split(/(\s+)/)
  294 │           .filter((part) => !!part.trim());
  295 │         if (!bin) {
  296 │           return Effect.fail(
  297 │             makeCommandError(
  298 │               props,
  299 │               new BadArgument({
  300 │                 module: "Command",
  301 │                 method: "parseCommand",
  302 │                 description: "Command is empty",
  303 │               }),
  304 │             ),
  305 │           );
  306 │         }
  307 │         return Effect.succeed({ bin, args });
  308 │       };

0.71 packages/alchemy/src/Stripe/StripeHttp.ts:60:7
  59 │     token.value.pipe(
> 60 │       Effect.flatMap((apiKey) =>
  61 │         eff.pipe(
  62 │           Effect.provide(
  63 │             stripeRuntimeLayer(
  64 │               Effect.succeed({
  65 │                 apiKey,
  66 │                 apiBaseUrl: DEFAULT_API_BASE_URL,
  67 │               } satisfies StripeCredentialsConfig),
  68 │             ),
  69 │           ),
  70 │         ),
  71 │       ),
  72 │     ) as Effect.Effect<A, E, RuntimeContext>;
```
