# effect/services/dependencies-through-layers

A service that depends on other services must be a Context.Service built by a Layer that yields those services as it is constructed, never a factory function or class that takes services, clients, or their implementations as arguments.

88 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound>;
  }
>()("@app/Users") {}

export const UsersLive = Layer.effect(
  Users,
  Effect.gen(function* () {
    const database = yield* Database;
    const logger = yield* Logger;
    return Users.of({
      find: (id) =>
        Effect.gen(function* () {
          yield* logger.log(`finding ${id}`);
          return yield* database.findUser(id);
        }),
    });
  }),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.91 packages/alchemy/src/Git/Store/ObjectStore.ts:239:4
  226 │   /**
  227 │    * Batched sibling of {@link ObjectStore.insertStaged} — the ingest hot
  228 │    * path (DESIGN.md §16.6).
  229 │    *
  230 │    * Staging objects one at a time costs two statements each (an existence
  231 │    * probe and an insert), so a 13.7k-object push ran ~27k statements and
  232 │    * ~13.7k transactions inside a single-threaded Durable Object. This
  233 │    * inserts a whole batch in **one** `transactionSync` with
  234 │    * `INSERT OR IGNORE` (no probe), then adopts any rows left staged by a
  235 │    * crashed push with one chunked `UPDATE`.
  236 │    *
  237 │    * Oversize objects (> 1 MiB compressed) still go through the per-object
  238 │    * path, since each needs its own R2 write first.
> 239 │    */

0.87 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:23:1
> 23 │ export const d1Routes = (db: QueryDatabaseClient, style: string) =>

0.86 packages/alchemy/test/Prisma/fixtures/read-routes.ts:11:1
> 11 │ export const readRoutes = (store: ReadBucketClient, url: URL) =>

0.85 packages/alchemy/src/Git/GitHubCompat.ts:148:3
  134 │ export interface GitHubCompatOptions {
  135 │   /**
  136 │    * The Worker's `rawRestPrelude`: resolves `owner/repo`, parses
  137 │    * credentials (anonymous allowed — public repos), and 404s/500s early.
  138 │    */
  139 │   readonly prelude: (
  140 │     owner: string,
  141 │     repo: string,
  142 │   ) => Effect.Effect<
  143 │     CompatPrelude,
  144 │     never,
  145 │     HttpServerRequest.HttpServerRequest | RuntimeContext
  146 │   >;
  147 │   /** Repo-DO stub by repoId (the Worker's `repos.getByName`). */
> 148 │   readonly stub: (repoId: string) => CompatRepoStub;
  149 │ }

0.85 packages/alchemy/src/Git/Store/Closure.ts:525:1
> 525 │ export const makeClosureSource = (options: ClosureOptions): ClosureSource => {
  526 │   const compute = computeClosure(options);
  527 │   return {
  528 │     commitClosure: (request) =>
  529 │       compute(request).pipe(
  530 │         Effect.catchTag("ManifestTooLarge", (error) =>
  531 │           Effect.fail(
  532 │             new StoreError({
  533 │               reason: `manifest exceeds ${error.cap} objects (v1 cap; got ${error.count})`,
  534 │             }),
  535 │           ),
  536 │         ),
  537 │       ),
  538 │   };
  539 │ };

0.85 packages/cloudflare-runtime/src/core/bindings/dispatch-namespace/dispatch-namespace.worker.ts:5:1
>  5 │ export default function makeBinding(env: Env): DispatchNamespace {
   6 │   return {
   7 │     get(
   8 │       name: string,
   9 │       args?: { [key: string]: unknown },
  10 │       options?: DynamicDispatchOptions,
  11 │     ): Fetcher {
  12 │       const metadata = JSON.stringify({ name, args, options });
  13 │       return {
  14 │         fetch(input: RequestInfo | URL, init?: RequestInit) {
  15 │           const request = new Request(input, init);
  16 │           const headers = new Headers(request.headers);
  17 │           headers.set("MF-Dispatch-Namespace-Options", metadata);
  18 │           return env.proxyClient.fetch(new Request(request, { headers }));
  19 │         },
  20 │         connect() {
  21 │           throw new Error("DispatchNamespace.get().connect() is not supported");
  22 │         },
  23 │       } as Fetcher;
  24 │     },
  25 │   } satisfies DispatchNamespace;
  26 │ }

0.85 packages/frontend-frameworks/src/vinext/cache/handler.ts:37:1
  35 │ const DEFAULT_TTL_SECONDS = 2592000;
  36 │
> 37 │ export const makeDataCacheHandler = (
  38 │   store: DataCacheStore,
  39 │   options?: DataCacheHandlerOptions,
  40 │ ) => {

0.84 packages/alchemy/src/SQL/Migrations/PgExecutor.ts:13:1
> 13 │ export const makePgMigrationExecutor = (client: Client): SqlExecutor => ({
  14 │   dialect: "postgres",

0.83 packages/alchemy/test/Cloudflare/Artifacts/fixtures/routes.ts:20:1
> 20 │ export const artifactsRoutes = (client: ReadWriteNamespaceClient, url: URL) =>

0.83 packages/alchemy/test/Prisma/fixtures/write-routes.ts:24:3
  23 │ export const writeRoutes = (
> 24 │   store: WriteBucketClient,
  25 │   request: HttpServerRequest.HttpServerRequest,
  26 │   url: URL,
  27 │ ) =>

0.82 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:55:1
> 55 │ export const makeHttpFlagshipClient = (
  56 │   auth: FlagshipAuth,
  57 │   appId: Effect.Effect<string>,
  58 │ ): ReadFlagsClient => {

0.82 packages/alchemy/src/Cloudflare/KV/NamespaceLocal.ts:32:1
> 32 │ export const makeLocalKVNamespaceBinding = <Client extends object>(options: {
  33 │   makeHttpClient: (auth: KVAuth, namespaceId: Effect.Effect<string>) => Client;

0.82 packages/alchemy/src/Neon/LanguageModel.ts:105:5
  102 │ > =>
  103 │   Effect.gen(function* () {
  104 │     const http = yield* HttpClient.HttpClient;
> 105 │     const baseUrl = yield* client.chatBaseUrl;
  106 │     const token = yield* client.token;

0.81 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:322:3
> 322 │   return {
  323 │     raw: dieRaw("instance"),

0.81 packages/alchemy/src/Hetzner/ReadDnsHttp.ts:18:1
  17 │ /** Build the read-only client over an injectable auth and zone id. */
> 18 │ export const dnsReadClient = (
  19 │   auth: DnsAuth,
  20 │   zoneId: Effect.Effect<number>,
  21 │ ): ReadDnsClient => {
  22 │   const authorize = auth.authorize;
  23 │   return {
  24 │     getRecordSet: Effect.fn("Hetzner.DNS.getRecordSet")(function* (name, type) {
  25 │       return yield* authorize(
  26 │         zoneRrsets.getZoneRrset({
  27 │           id_or_name: String(yield* zoneId),
  28 │           rr_name: name,
  29 │           rr_type: type,
  30 │         }),
  31 │       );
  32 │     }),
  33 │     listRecordSets: Effect.fn("Hetzner.DNS.listRecordSets")(
  34 │       function* (request) {
  35 │         return yield* authorize(
  36 │           zoneRrsets.listZoneRrsets({
  37 │             id_or_name: String(yield* zoneId),
  38 │             ...request,
  39 │           }),
  40 │         );
  41 │       },
  42 │     ),
  43 │   };
  44 │ };

0.80 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:41:1
> 41 │ export const makeHttpSearchIndexClient = (
  42 │   auth: SearchIndexAuth,
  43 │   indexName: Effect.Effect<string>,
  44 │ ): SearchIndexClient => {

0.80 packages/alchemy/src/Cloudflare/Workers/BrowserHttpClient.ts:60:1
> 60 │ export const makeHttpBrowserClient = (auth: BrowserAuth): BrowserClient => {

0.80 packages/alchemy/src/Hetzner/WriteDnsHttp.ts:19:1
  18 │ /** Build the write client over an injectable auth and zone id. */
> 19 │ export const dnsWriteClient = (
  20 │   auth: DnsAuth,
  21 │   zoneId: Effect.Effect<number>,
  22 │ ): WriteDnsClient => {

0.80 packages/alchemy/src/Stripe/StripeHttp.ts:74:1
> 74 │ export const makeStripeAuth = (options: {
  75 │   credentials: Effect.Effect<StripeCredentialsConfig> | undefined;
  76 │   http: HttpClient.HttpClient | undefined;
  77 │ }): StripeAuth => ({
  78 │   authorize: <A, E>(
  79 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  80 │   ): Effect.Effect<A, E, RuntimeContext> => {
  81 │     if (options.credentials === undefined || options.http === undefined) {
  82 │       return Effect.die(
  83 │         "Stripe HTTP binding missing Credentials or HttpClient at plan time",
  84 │       ) as Effect.Effect<A, E, RuntimeContext>;
  85 │     }
  86 │     return eff.pipe(
  87 │       Effect.provide(
  88 │         Layer.mergeAll(
  89 │           Layer.succeed(Credentials, options.credentials),
  90 │           Layer.succeed(HttpClient.HttpClient, options.http),
  91 │         ),
  92 │       ),
  93 │     ) as Effect.Effect<A, E, RuntimeContext>;
  94 │   },
  95 │ });

0.80 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/routes.ts:16:1
> 16 │ export const connectionRoutes = (hd: ConnectClient, url: URL) =>

0.79 packages/alchemy/src/AWS/ElastiCache/ConnectCacheClusterHttp.ts:18:7
  15 │   ConnectCacheCluster,
  16 │   Effect.gen(function* () {
  17 │     return Effect.fn(function* (
> 18 │       cluster: CacheCluster,
  19 │       options?: ConnectCacheClusterOptions,
  20 │     ) {
  21 │       const prefix = cacheClusterConnectEnvPrefix(cluster.LogicalId);

0.79 packages/alchemy/src/Cloudflare/DNS/ReadWriteDnsHttp.ts:20:1
  19 │ /** Build the combined read + write client over an injectable auth and zone id. */
> 20 │ export const dnsReadWriteClient = (
  21 │   auth: DnsAuth,
  22 │   zoneId: Effect.Effect<string>,
  23 │ ): ReadWriteDnsClient => ({
  24 │   ...dnsReadClient(auth, zoneId),
  25 │   ...dnsWriteClient(auth, zoneId),
  26 │ });

0.79 packages/alchemy/src/Hetzner/DnsHttp.ts:19:3
  18 │ export const makeHttpDnsBinding = <Client>(options: {
> 19 │   makeClient: (auth: DnsAuth, zoneId: Effect.Effect<number>) => Client;
  20 │ }) =>
  21 │   Effect.gen(function* () {
  22 │     const context = yield* Effect.context<
  23 │       Credentials | HttpClient.HttpClient
  24 │     >();
  25 │
  26 │     return Effect.fn(function* (zone: Zone) {
  27 │       const zoneId = yield* zone.zoneId;
  28 │       const auth: DnsAuth = {
  29 │         authorize: (eff) => eff.pipe(Effect.provideContext(context)),
  30 │       };
  31 │       return options.makeClient(auth, zoneId);
  32 │     });
  33 │   });

0.79 packages/alchemy/test/Cloudflare/R2/fixtures/read-routes.ts:11:1
> 11 │ export const readRoutes = (r2: ReadBucketClient, url: URL) =>
  12 │   Effect.gen(function* () {
  13 │     if (url.pathname === "/get") {
  14 │       const key = url.searchParams.get("key") ?? "";
  15 │       const object = yield* r2.get(key).pipe(Effect.orDie);
  16 │       const value = object ? yield* object.text().pipe(Effect.orDie) : null;
  17 │       return yield* HttpServerResponse.json({ value });
  18 │     }
  19 │     if (url.pathname === "/head") {
  20 │       const key = url.searchParams.get("key") ?? "";
  21 │       const object = yield* r2.head(key).pipe(Effect.orDie);
  22 │       return yield* HttpServerResponse.json({
  23 │         exists: object !== null,
  24 │         size: object?.size ?? null,
  25 │       });
  26 │     }
  27 │     if (url.pathname === "/list") {
  28 │       const prefix = url.searchParams.get("prefix") ?? undefined;
  29 │       const result = yield* r2
  30 │         .list(prefix ? { prefix } : undefined)
  31 │         .pipe(Effect.orDie);
  32 │       return yield* HttpServerResponse.json({
  33 │         keys: result.objects.map((o) => o.key),
  34 │       });
  35 │     }
  36 │     return undefined;
  37 │   });

0.79 packages/cloudflare-runtime/src/core/PluginContext.ts:51:1
> 51 │ export const make = (
  52 │   worker: RuntimeWorker,
  53 │   inheritedPlugins?: PluginMap,
  54 │ ): Effect.Effect<PluginContext["Service"], RuntimeError> =>

0.78 packages/alchemy/src/AWS/GuardDuty/GetFindings.ts:29:5
  25 │ export interface GetFindings extends Binding.Service<
  26 │   GetFindings,
  27 │   "AWS.GuardDuty.GetFindings",
  28 │   (
> 29 │     detector: Detector,
  30 │   ) => Effect.Effect<
  31 │     (
  32 │       request?: Omit<guardduty.GetFindingsRequest, "DetectorId">,
  33 │     ) => Effect.Effect<
  34 │       guardduty.GetFindingsResponse,
  35 │       guardduty.GetFindingsError
  36 │     >
  37 │   >
  38 │ > {}

0.78 packages/alchemy/test/Cloudflare/KV/fixtures/write-routes.ts:18:3
  17 │ export const writeRoutes = (
> 18 │   kv: WriteNamespaceClient,
  19 │   request: HttpServerRequest.HttpServerRequest,
  20 │   url: URL,
  21 │ ) =>
  22 │   Effect.gen(function* () {
  23 │     if (request.method === "PUT" && url.pathname === "/put") {
  24 │       const key = url.searchParams.get("key") ?? "";
  25 │       const body = yield* request.text;
  26 │       yield* kv.put(key, body).pipe(Effect.orDie);
  27 │       return yield* HttpServerResponse.json({ ok: true });
  28 │     }
  29 │     if (request.method === "PUT" && url.pathname === "/put-meta") {
  30 │       const key = url.searchParams.get("key") ?? "";
  31 │       const body = yield* request.text;
  32 │       // `expirationTtl` must be ≥ 60s; metadata round-trips via getWithMetadata.
  33 │       yield* kv
  34 │         .put(key, body, { metadata: { tag: "meta" }, expirationTtl: 3600 })
  35 │         .pipe(Effect.orDie);
  36 │       return yield* HttpServerResponse.json({ ok: true });
  37 │     }
  38 │     if (request.method === "DELETE" && url.pathname === "/del") {
  39 │       const key = url.searchParams.get("key") ?? "";
  40 │       yield* kv.delete(key).pipe(Effect.orDie);
  41 │       return yield* HttpServerResponse.json({ ok: true });
  42 │     }
  43 │     return undefined;
  44 │   });

0.78 packages/alchemy/test/SQL/fixtures/routes.ts:76:1
> 76 │ export const makeSqlRoutes = (options: SqlRoutesOptions): SqlRoutes => {
  77 │   const { sql, layerUsers, ddl, table } = options;

0.78 packages/cloudflare-runtime/src/core/bindings/workflows/wrapped-binding.worker.ts:152:1
> 152 │ export default function makeBinding(env: {
  153 │   binding: WorkflowBinding;
  154 │ }): Workflow {
  155 │   return new WorkflowImpl(env.binding);
  156 │ }

0.77 packages/alchemy/src/Git/Protocol/UploadPack.ts:365:5
  356 │ export const handleUploadPack = (
  357 │   body: Uint8Array,
  358 │   objects: ObjectSource,
  359 │   closure: ClosureSource,
  360 │ ): Effect.Effect<
  361 │   UploadPackResponse,
  362 │   PktLineError | ProtocolError | StoreError
  363 │ > =>
  364 │   parseUploadPackRequest(body).pipe(
> 365 │     Effect.flatMap((request) => uploadPack(request, objects, closure)),
  366 │   );

0.76 packages/alchemy/src/AWS/GuardDuty/CreateInvestigation.ts:31:5
  27 │ export interface CreateInvestigation extends Binding.Service<
  28 │   CreateInvestigation,
  29 │   "AWS.GuardDuty.CreateInvestigation",
  30 │   (
> 31 │     detector: Detector,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request?: Omit<guardduty.CreateInvestigationRequest, "DetectorId">,
  35 │     ) => Effect.Effect<
  36 │       guardduty.CreateInvestigationResponse,
  37 │       guardduty.CreateInvestigationError
  38 │     >
  39 │   >
  40 │ > {}

0.76 packages/alchemy/src/AWS/GuardDuty/GetRemainingFreeTrialDays.ts:31:5
  27 │ export interface GetRemainingFreeTrialDays extends Binding.Service<
  28 │   GetRemainingFreeTrialDays,
  29 │   "AWS.GuardDuty.GetRemainingFreeTrialDays",
  30 │   (
> 31 │     detector: Detector,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request: Omit<guardduty.GetRemainingFreeTrialDaysRequest, "DetectorId">,
  35 │     ) => Effect.Effect<
  36 │       guardduty.GetRemainingFreeTrialDaysResponse,
  37 │       guardduty.GetRemainingFreeTrialDaysError
  38 │     >
  39 │   >
  40 │ > {}

0.76 packages/alchemy/src/AWS/MedicalImaging/StartDICOMImportJob.ts:42:2
  39 │  * **Example:** Start a Bulk DICOM Import Job
  40 │  * ```typescript
  41 │  * // deploy time — bind the data store and the HealthImaging data-access role
> 42 │  * const startImport = yield* MedicalImaging.StartDICOMImportJob(datastore, dataAccessRole);

0.76 packages/alchemy/src/AWS/Personalize/PutEvents.ts:42:5
  38 │ export interface PutEvents extends Binding.Service<
  39 │   PutEvents,
  40 │   "AWS.Personalize.PutEvents",
  41 │   (
> 42 │     tracker: EventTracker,
  43 │   ) => Effect.Effect<
  44 │     (
  45 │       request: PutEventsRequest,
  46 │     ) => Effect.Effect<
  47 │       personalizeevents.PutEventsResponse,
  48 │       personalizeevents.PutEventsError
  49 │     >
  50 │   >
  51 │ > {}

0.76 packages/alchemy/src/Fly/SecretHttp.ts:93:1
   92 │ /** Build auth that uses ambient stack creds, or env creds inside a host. */
>  93 │ export const makeSecretAuth = (
   94 │   ambient: Context.Context<Credentials | HttpClient.HttpClient>,
   95 │ ): SecretAuth => ({
   96 │   authorize: <A, E>(
   97 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
   98 │   ): Effect.Effect<A, E, RuntimeContext> => {
   99 │     if (globalThis.__ALCHEMY_RUNTIME__) {
  100 │       return eff.pipe(
  101 │         Effect.provide(
  102 │           Layer.mergeAll(CredentialsFromEnv, FetchHttpClient.layer),
  103 │         ),
  104 │         Effect.timeout("8 seconds"),
  105 │       ) as Effect.Effect<A, E, RuntimeContext>;
  106 │     }
  107 │     return eff.pipe(Effect.provideContext(ambient)) as Effect.Effect<
  108 │       A,
  109 │       E,
  110 │       RuntimeContext
  111 │     >;
  112 │   },
  113 │ });

0.76 packages/alchemy/test/Cloudflare/KV/fixtures/read-routes.ts:18:1
> 18 │ export const readRoutes = (kv: ReadNamespaceClient, url: URL) =>

0.76 packages/alchemy/test/Neon/fixtures/language-model-handler.ts:20:1
  17 │ const Tools = Toolkit.make(Sum);
  18 │ const handlers = Tools.toLayer({ sum: ({ a, b }) => Effect.succeed(a + b) });
  19 │
> 20 │ export const languageModelHandler = (source = languageModelGateway) =>

0.75 packages/alchemy/src/AWS/AccessAnalyzer/GetAccessPreview.ts:31:5
  27 │ export interface GetAccessPreview extends Binding.Service<
  28 │   GetAccessPreview,
  29 │   "AWS.AccessAnalyzer.GetAccessPreview",
  30 │   (
> 31 │     analyzer: Analyzer,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request: GetAccessPreviewRequest,
  35 │     ) => Effect.Effect<aa.GetAccessPreviewResponse, aa.GetAccessPreviewError>
  36 │   >
  37 │ > {}

0.75 packages/alchemy/src/AWS/Cognito/UserPoolAuth.ts:232:3
  229 │ export interface UserPoolAuth extends Binding.Service<
  230 │   UserPoolAuth,
  231 │   "AWS.Cognito.UserPoolAuth",
> 232 │   <C extends UserPoolClient>(client: C) => Effect.Effect<UserPoolAuthClient>
  233 │ > {}

0.75 packages/alchemy/src/AWS/Personalize/PutActionInteractions.ts:45:5
  41 │ export interface PutActionInteractions extends Binding.Service<
  42 │   PutActionInteractions,
  43 │   "AWS.Personalize.PutActionInteractions",
  44 │   (
> 45 │     tracker: EventTracker,
  46 │   ) => Effect.Effect<
  47 │     (
  48 │       request: PutActionInteractionsRequest,
  49 │     ) => Effect.Effect<
  50 │       personalizeevents.PutActionInteractionsResponse,
  51 │       personalizeevents.PutActionInteractionsError
  52 │     >
  53 │   >
  54 │ > {}

0.75 packages/alchemy/src/Cloudflare/KV/NamespaceBinding.ts:16:1
> 16 │ export const makeKVNamespaceBinding = <Client>(options: {
  17 │   makeClient: (helpers: ReturnType<typeof makeKVNamespaceHelpers>) => Client;
  18 │ }) =>
  19 │   Effect.gen(function* () {
  20 │     const env = yield* WorkerEnvironment;
  21 │     const host = yield* Worker;
  22 │
  23 │     return Effect.fn(function* (namespace: Namespace) {
  24 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  25 │         yield* host.bind`${namespace}`({
  26 │           bindings: [
  27 │             {
  28 │               type: "kv_namespace",
  29 │               name: namespace.LogicalId,
  30 │               namespaceId: namespace.namespaceId,
  31 │             },
  32 │           ],
  33 │         });
  34 │       }
  35 │
  36 │       return options.makeClient(makeKVNamespaceHelpers(env, namespace));
  37 │     });
  38 │   });

0.75 packages/alchemy/src/Cloudflare/R2/BucketBinding.ts:18:3
  17 │ export const makeBucketBinding = <Client>(options: {
> 18 │   makeClient: (helpers: ReturnType<typeof makeHelpers>) => Client;
  19 │ }) =>
  20 │   Effect.gen(function* () {
  21 │     const env = yield* WorkerEnvironment;
  22 │     const host = yield* Worker;
  23 │
  24 │     return Effect.fn(function* (bucket: Bucket) {
  25 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  26 │         yield* host.bind`${bucket}`({
  27 │           bindings: [
  28 │             {
  29 │               type: "r2_bucket",
  30 │               name: bucket.LogicalId,
  31 │               bucketName: bucket.bucketName,
  32 │               jurisdiction: bucket.jurisdiction.pipe(
  33 │                 Output.map((jurisdiction) =>
  34 │                   jurisdiction === "default" ? undefined : jurisdiction,
  35 │                 ),
  36 │               ),
  37 │             },
  38 │           ],
  39 │         });
  40 │       }
  41 │
  42 │       return options.makeClient(makeHelpers(env, bucket));
  43 │     });
  44 │   });

0.75 packages/alchemy/src/Git/Jobs/Compact.ts:169:5
  167 │     let offset = 0;
  168 │     let budget = 0;
> 169 │     const push = (bytes: Uint8Array) => {
  170 │       chunks.push(bytes);
  171 │       offset += bytes.length;
  172 │     };

0.75 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/secret-routes.ts:17:1
> 17 │ export const secretRoutes = (client: ReadSecretClient, url: URL) =>
  18 │   Effect.gen(function* () {
  19 │     if (url.pathname === "/secret") {
  20 │       // The client is an Effect that resolves to the redacted value.
  21 │       const direct = yield* client.pipe(Effect.orDie);
  22 │       const viaGet = yield* client.get().pipe(Effect.orDie);
  23 │       const raw = yield* client.raw.pipe(Effect.orDie);
  24 │       const viaRaw = yield* Effect.promise(() => raw.get());
  25 │       return yield* HttpServerResponse.json({
  26 │         value: Redacted.value(direct),
  27 │         viaGet: Redacted.value(viaGet),
  28 │         viaRaw,
  29 │       });
  30 │     }
  31 │     return undefined;
  32 │   });

0.74 packages/alchemy/src/AWS/AccessAnalyzer/CreateAccessPreview.ts:36:5
  32 │ export interface CreateAccessPreview extends Binding.Service<
  33 │   CreateAccessPreview,
  34 │   "AWS.AccessAnalyzer.CreateAccessPreview",
  35 │   (
> 36 │     analyzer: Analyzer,
  37 │   ) => Effect.Effect<
  38 │     (
  39 │       request: CreateAccessPreviewRequest,
  40 │     ) => Effect.Effect<
  41 │       aa.CreateAccessPreviewResponse,
  42 │       aa.CreateAccessPreviewError
  43 │     >
  44 │   >
  45 │ > {}

0.74 packages/alchemy/src/AWS/Backup/StartCopyJob.ts:51:5
  47 │ export interface StartCopyJob extends Binding.Service<
  48 │   StartCopyJob,
  49 │   "AWS.Backup.StartCopyJob",
  50 │   <R extends Role>(
> 51 │     sourceVault: BackupVault,
  52 │     copyRole: R,
  53 │   ) => Effect.Effect<
  54 │     (
  55 │       request: StartCopyJobRequest,
  56 │     ) => Effect.Effect<backup.StartCopyJobOutput, backup.StartCopyJobError>
  57 │   >
  58 │ > {}

0.74 packages/alchemy/src/AWS/EFS/CreateAccessPoint.ts:48:5
  44 │ export interface CreateAccessPoint extends Binding.Service<
  45 │   CreateAccessPoint,
  46 │   "AWS.EFS.CreateAccessPoint",
  47 │   (
> 48 │     fileSystem: FileSystem,
  49 │   ) => Effect.Effect<
  50 │     (
  51 │       request: CreateAccessPointRequest,
  52 │     ) => Effect.Effect<efs.AccessPointDescription, efs.CreateAccessPointError>
  53 │   >
  54 │ > {}

0.74 packages/alchemy/src/AWS/GuardDuty/GetMembers.ts:31:5
  27 │ export interface GetMembers extends Binding.Service<
  28 │   GetMembers,
  29 │   "AWS.GuardDuty.GetMembers",
  30 │   (
> 31 │     detector: Detector,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request?: Omit<guardduty.GetMembersRequest, "DetectorId">,
  35 │     ) => Effect.Effect<guardduty.GetMembersResponse, guardduty.GetMembersError>
  36 │   >
  37 │ > {}

0.74 packages/alchemy/src/AWS/GuardDuty/UnarchiveFindings.ts:29:5
  25 │ export interface UnarchiveFindings extends Binding.Service<
  26 │   UnarchiveFindings,
  27 │   "AWS.GuardDuty.UnarchiveFindings",
  28 │   (
> 29 │     detector: Detector,
  30 │   ) => Effect.Effect<
  31 │     (
  32 │       request?: Omit<guardduty.UnarchiveFindingsRequest, "DetectorId">,
  33 │     ) => Effect.Effect<
  34 │       guardduty.UnarchiveFindingsResponse,
  35 │       guardduty.UnarchiveFindingsError
  36 │     >
  37 │   >
  38 │ > {}

0.74 packages/alchemy/src/AWS/Lambda/BrokerEventSource.ts:36:7
  33 │     const Mapping = yield* EventSourceMapping;
  34 │
  35 │     return Effect.fn(function* <Req = never>(
> 36 │       broker: Broker,
  37 │       props: BrokerEventSourceProps,

0.74 packages/alchemy/src/AWS/RDSData/ExecuteStatement.ts:81:5
  77 │ export interface ExecuteStatement extends Binding.Service<
  78 │   ExecuteStatement,
  79 │   "AWS.RDSData.ExecuteStatement",
  80 │   (
> 81 │     cluster: DBCluster,
  82 │     options: ExecuteStatementOptions,
  83 │   ) => Effect.Effect<
  84 │     (
  85 │       request: ExecuteStatementRequest,
  86 │     ) => Effect.Effect<
  87 │       rdsdata.ExecuteStatementResponse,
  88 │       rdsdata.ExecuteStatementError,
  89 │       RuntimeContext
  90 │     >
  91 │   >
  92 │ > {}

0.74 packages/alchemy/src/Cloudflare/DNS/WriteDnsHttp.ts:19:1
  18 │ /** Build the write client over an injectable auth and zone id. */
> 19 │ export const dnsWriteClient = (
  20 │   auth: DnsAuth,
  21 │   zoneId: Effect.Effect<string>,
  22 │ ): WriteDnsClient => {

0.74 packages/alchemy/src/Cloudflare/Tunnel/ReadWriteTunnelLocal.ts:38:3
  36 │ export const ReadWriteTunnelLocal = Layer.effect(
  37 │   ReadWriteTunnel,
> 38 │   makeLocalTunnelClient(readWriteClient),
  39 │ );

0.74 packages/alchemy/src/Cloudflare/Tunnel/TunnelLocalBinding.ts:20:3
  19 │ export const makeLocalTunnelClient = <Client>(
> 20 │   makeClient: (auth: TunnelAuth) => Client,
  21 │ ) =>
  22 │   Effect.gen(function* () {
  23 │     // Account + credentials are ambient during stack-eval (the stack's
  24 │     // providers layer). Capture the full context so cfd_tunnel HTTP ops can run
  25 │     // with the current credentials — no `host.bind`, no minted token.
  26 │     const { accountId } = yield* yield* CloudflareEnvironment;
  27 │     const context = yield* Effect.context<
  28 │       Credentials | HttpClient.HttpClient
  29 │     >();
  30 │
  31 │     return Effect.fn(function* () {
  32 │       const auth: TunnelAuth = {
  33 │         authorize: (eff) => eff.pipe(Effect.provideContext(context)),
  34 │         accountId: Effect.succeed(accountId),
  35 │       };
  36 │       return makeClient(auth);
  37 │     });
  38 │   });

0.74 packages/alchemy/src/SQL/Migrations/MySQLExecutor.ts:14:1
> 14 │ export const makeMySQLMigrationExecutor = (
  15 │   connection: Connection,

0.74 packages/alchemy/test/Prisma/ORM/fixtures/psl/generated/client.ts:7:1
   4 │ import type * as Redacted from "effect/Redacted";
   5 │ import { Postgres, type PostgresConfig } from "alchemy/Prisma/ORM/Postgres";
   6 │ import { contractJson } from "./runtime.ts";
>  7 │ export const makeDatabase = <E = never, R = never>(
   8 │   connectionString: Effect.Effect<Redacted.Redacted<string>, E, R>,
   9 │   options: Omit<PostgresConfig<Contract>, "contract" | "contractJson"> = {},
  10 │ ) => Postgres<Contract, E, R>(connectionString, { ...options, contractJson });

0.73 packages/alchemy/src/AWS/Athena/Query.ts:98:5
   94 │ export interface Query extends Binding.Service<
   95 │   Query,
   96 │   "AWS.Athena.Query",
   97 │   (
>  98 │     workGroup: WorkGroup,
   99 │     resultsBucket: Bucket,
  100 │   ) => Effect.Effect<
  101 │     (
  102 │       request: RunQueryRequest,
  103 │     ) => Effect.Effect<
  104 │       QueryResult,
  105 │       | athena.StartQueryExecutionError
  106 │       | athena.GetQueryExecutionError
  107 │       | athena.GetQueryResultsError
  108 │       | AthenaQueryFailed
  109 │     >
  110 │   >
  111 │ > {}

0.73 packages/alchemy/src/AWS/CloudTrail/ListQueries.ts:30:5
  26 │ export interface ListQueries extends Binding.Service<
  27 │   ListQueries,
  28 │   "AWS.CloudTrail.ListQueries",
  29 │   (
> 30 │     store: EventDataStore,
  31 │   ) => Effect.Effect<
  32 │     (
  33 │       request?: Omit<cloudtrail.ListQueriesRequest, "EventDataStore">,
  34 │     ) => Effect.Effect<
  35 │       cloudtrail.ListQueriesResponse,
  36 │       cloudtrail.ListQueriesError
  37 │     >
  38 │   >
  39 │ > {}

0.73 packages/alchemy/src/Cloudflare/D1/ApplyMigrations.ts:38:1
> 38 │ export const makeD1MigrationExecutor = <E>(
  39 │   raw: D1SqlExecutor<E>,

0.73 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:43:1
> 43 │ export const makeHttpQueryDatabaseClient = (
  44 │   auth: D1Auth,
  45 │   databaseId: Effect.Effect<string>,
  46 │ ): QueryDatabaseClient =>
  47 │   makeQueryDatabaseClientFrom(
  48 │     Effect.map(databaseId, (id) => makeHttpD1Database(auth, id)),
  49 │   );

0.73 packages/alchemy/src/Cloudflare/DNS/ReadDnsHttp.ts:19:1
  18 │ /** Build the read-only client over an injectable auth and zone id. */
> 19 │ export const dnsReadClient = (
  20 │   auth: DnsAuth,
  21 │   zoneId: Effect.Effect<string>,
  22 │ ): ReadDnsClient => {
  23 │   const authorize = auth.authorize;
  24 │   return {
  25 │     getDnsRecord: Effect.fn("Cloudflare.DNS.getDnsRecord")(
  26 │       function* (dnsRecordId) {
  27 │         return yield* authorize(
  28 │           dns.getRecord({ zoneId: yield* zoneId, dnsRecordId }),
  29 │         );
  30 │       },
  31 │     ),
  32 │     listDnsRecords: Effect.fn("Cloudflare.DNS.listDnsRecords")(
  33 │       function* (request) {
  34 │         return yield* authorize(
  35 │           dns.listRecords({ zoneId: yield* zoneId, ...request }),
  36 │         );
  37 │       },
  38 │     ),
  39 │   };
  40 │ };

0.73 packages/alchemy/src/Cloudflare/Queues/QueueBinding.ts:61:1
  60 │ /** Primitives shared by the Worker-binding producer clients. */
> 61 │ export const makeQueueHelpers = (env: Record<string, any>, queue: Queue) => {
  62 │   const raw = Effect.sync(
  63 │     () => (env as Record<string, runtime.Queue<unknown>>)[queue.LogicalId]!,
  64 │   );
  65 │
  66 │   const tryPromise = <T>(fn: () => Promise<T>): Effect.Effect<T, SendError> =>
  67 │     Effect.tryPromise({
  68 │       try: fn,
  69 │       catch: (error: any) =>
  70 │         new SendError({
  71 │           message: error?.message ?? "Unknown queue error",
  72 │           cause: error,
  73 │         }),
  74 │     });
  75 │
  76 │   const use = <T>(
  77 │     fn: (raw: runtime.Queue<unknown>) => Promise<T>,
  78 │   ): Effect.Effect<T, SendError> =>
  79 │     raw.pipe(Effect.flatMap((raw) => tryPromise(() => fn(raw))));
  80 │
  81 │   return { raw, use, tryPromise };
  82 │ };

0.73 packages/alchemy/src/Drizzle/D1.ts:54:3
  51 │   E = never,
  52 │   R = never,
  53 │ >(
> 54 │   database: D1DatabaseSource<E, R>,
  55 │   config?: SQLiteD1Drizzle.EffectDrizzleSQLiteD1Config<TRelations>,
  56 │ ) =>
  57 │   Effect.map(
  58 │     makeExecutionMemo(
  59 │       Effect.gen(function* () {
  60 │         const db = yield* Effect.isEffect(database) ? database : database.raw;
  61 │         const d1Ctx = yield* Layer.build(D1Client.layer({ db }));
  62 │         return yield* SQLiteD1Drizzle.makeWithDefaults(
  63 │           config ??
  64 │             ({} as SQLiteD1Drizzle.EffectDrizzleSQLiteD1Config<TRelations>),
  65 │         ).pipe(Effect.provideContext(d1Ctx));
  66 │       }),
  67 │     ),
  68 │     (db) =>
  69 │       proxyChain<
  70 │         EffectSQLiteD1Database<TRelations> & {
  71 │           $client: D1Client.D1Client;
  72 │         }
  73 │       >(
  74 │         db as Effect.Effect<
  75 │           EffectSQLiteD1Database<TRelations> & {
  76 │             $client: D1Client.D1Client;
  77 │           }
  78 │         >,
  79 │       ),
  80 │   );

0.73 packages/alchemy/src/Fly/SpriteHttp.ts:22:1
> 22 │ export const makeHttpSpriteBinding = <Client>(options: {
  23 │   makeClient: (auth: SpriteAuth, spriteName: Effect.Effect<string>) => Client;
  24 │ }) =>
  25 │   Effect.gen(function* () {
  26 │     const context = yield* Effect.context<
  27 │       Credentials | HttpClient.HttpClient
  28 │     >();
  29 │
  30 │     return Effect.fn(function* (sprite: Sprite) {
  31 │       yield* bindFlyApiToken().pipe(Effect.provideContext(context));
  32 │       const name = yield* sprite.name;
  33 │       return options.makeClient(makeSpriteAuth(context), name);
  34 │     });
  35 │   });

0.73 packages/alchemy/src/Hetzner/ReadWriteDnsHttp.ts:19:1
  18 │ /** Build the combined read + write client over an injectable auth and zone id. */
> 19 │ export const dnsReadWriteClient = (
  20 │   auth: DnsAuth,
  21 │   zoneId: Effect.Effect<number>,
  22 │ ): ReadWriteDnsClient => ({
  23 │   ...dnsReadClient(auth, zoneId),
  24 │   ...dnsWriteClient(auth, zoneId),
  25 │ });

0.73 packages/alchemy/test/Prisma/ORM/fixtures/variants/generated/client.ts:7:1
   4 │ import type * as Redacted from "effect/Redacted";
   5 │ import { Postgres, type PostgresConfig } from "alchemy/Prisma/ORM/Postgres";
   6 │ import { contractJson } from "./runtime.ts";
>  7 │ export const makeDatabase = <E = never, R = never>(
   8 │   connectionString: Effect.Effect<Redacted.Redacted<string>, E, R>,
   9 │   options: Omit<PostgresConfig<Contract>, "contract" | "contractJson"> = {},
  10 │ ) => Postgres<Contract, E, R>(connectionString, { ...options, contractJson });

0.73 packages/alchemy/test/SQL/Migrations/sqlite-executor.ts:11:1
> 11 │ export const makeSqliteExecutor = (db: Database): SqlExecutor => ({
  12 │   dialect: "sqlite",
  13 │   query: (sql, params) =>
  14 │     Effect.try({
  15 │       try: () =>
  16 │         db.query(sql).all(...((params ?? []) as never[])) as Array<
  17 │           Record<string, unknown>
  18 │         >,
  19 │       catch: (cause) => new MigrationError({ message: String(cause), cause }),
  20 │     }),
  21 │   batch: (statements) =>
  22 │     Effect.try({
  23 │       try: () => {
  24 │         db.run("BEGIN");
  25 │         try {
  26 │           for (const statement of statements) db.run(statement);
  27 │           db.run("COMMIT");
  28 │         } catch (error) {
  29 │           try {
  30 │             db.run("ROLLBACK");
  31 │           } catch {
  32 │             // already rolled back
  33 │           }
  34 │           throw error;
  35 │         }
  36 │       },
  37 │       catch: (cause) => new MigrationError({ message: String(cause), cause }),
  38 │     }),
  39 │ });

0.72 packages/alchemy/src/AWS/ACMPCA/GetCertificate.ts:46:5
  42 │ export interface GetCertificate extends Binding.Service<
  43 │   GetCertificate,
  44 │   "AWS.ACMPCA.GetCertificate",
  45 │   (
> 46 │     certificateAuthority: CertificateAuthority,
  47 │   ) => Effect.Effect<
  48 │     (
  49 │       request: GetCertificateRequest,
  50 │     ) => Effect.Effect<
  51 │       acmpca.GetCertificateResponse,
  52 │       acmpca.GetCertificateError
  53 │     >
  54 │   >
  55 │ > {}

0.72 packages/alchemy/src/AWS/AccessAnalyzer/GenerateFindingRecommendation.ts:32:5
  28 │ export interface GenerateFindingRecommendation extends Binding.Service<
  29 │   GenerateFindingRecommendation,
  30 │   "AWS.AccessAnalyzer.GenerateFindingRecommendation",
  31 │   (
> 32 │     analyzer: Analyzer,
  33 │   ) => Effect.Effect<
  34 │     (
  35 │       request: GenerateFindingRecommendationRequest,
  36 │     ) => Effect.Effect<
  37 │       aa.GenerateFindingRecommendationResponse,
  38 │       aa.GenerateFindingRecommendationError
  39 │     >
  40 │   >
  41 │ > {}

0.72 packages/alchemy/src/AWS/HealthLake/StartFHIRImportJob.ts:62:5
  58 │ export interface StartFHIRImportJob extends Binding.Service<
  59 │   StartFHIRImportJob,
  60 │   "AWS.HealthLake.StartFHIRImportJob",
  61 │   (
> 62 │     datastore: FHIRDatastore,
  63 │     dataAccessRole: Role,
  64 │   ) => Effect.Effect<
  65 │     (
  66 │       request: StartFHIRImportJobRequest,
  67 │     ) => Effect.Effect<
  68 │       healthlake.StartFHIRImportJobResponse,
  69 │       healthlake.StartFHIRImportJobError
  70 │     >
  71 │   >
  72 │ > {}

0.72 packages/alchemy/src/AWS/MedicalImaging/BindingHttp.ts:45:5
  42 │   Effect.gen(function* () {
  43 │     const op = yield* options.operation;
  44 │
> 45 │     return Effect.fn(function* (datastore: Datastore) {
  46 │       const DatastoreId = yield* datastore.datastoreId;
  47 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  48 │         const host = yield* Binding.Host;
  49 │         if (isBindingHost(host)) {
  50 │           yield* host.bind`Allow(${host}, ${options.tag}(${datastore}))`({
  51 │             policyStatements: [
  52 │               {
  53 │                 Effect: "Allow",
  54 │                 Action: [...options.actions],
  55 │                 Resource: [
  56 │                   Output.interpolate`${datastore.datastoreArn}`,
  57 │                   Output.interpolate`${datastore.datastoreArn}/imageset/*`,
  58 │                 ],
  59 │               },
  60 │             ],
  61 │           });
  62 │         }
  63 │       }
  64 │       return Effect.fn(`${options.tag}(${datastore.LogicalId})`)(function* (
  65 │         request?: Omit<I, "datastoreId">,
  66 │       ) {
  67 │         return yield* op({
  68 │           ...request,
  69 │           datastoreId: yield* DatastoreId,
  70 │         } as I);
  71 │       });
  72 │     });

0.72 packages/alchemy/src/AWS/MemoryDB/ConnectHttp.ts:21:5
  18 │ export const ConnectHttp = Layer.effect(
  19 │   Connect,
  20 │   Effect.gen(function* () {
> 21 │     return Effect.fn(function* (cluster: Cluster, options?: ConnectOptions) {
  22 │       const Host = yield* cluster.endpointAddress;
  23 │       const Port = yield* cluster.endpointPort;
  24 │       const Tls = yield* cluster.tlsEnabled;

0.72 packages/alchemy/src/Cloudflare/D1/QueryDatabaseBinding.ts:18:5
  15 │     const env = yield* WorkerEnvironment;
  16 │     const host = yield* Worker;
  17 │
> 18 │     return Effect.fn(function* (database: Database) {

0.72 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:135:1
> 135 │ export const acmeDnsSolver = (
  136 │   client: WriteDnsClient,
  137 │ ): DnsSolver<RuntimeContext> => {
  138 │   const published = new Map<string, string>();

0.72 packages/alchemy/src/Git/Jobs/Purge.ts:83:1
> 83 │ export const runPurgeJob = (
  84 │   options: PurgeJobOptions,

0.72 packages/alchemy/src/Git/Store/PackSource.ts:35:1
> 35 │ export const blobRandomAccess = (options: {
  36 │   readonly blobs: BlobStoreShape;
  37 │   readonly key: string;
  38 │   readonly size: number;

0.72 packages/alchemy/src/Prisma/Internal/BucketClient.ts:106:1
> 106 │ export const makeBucketAccess = (
  107 │   credentials: BucketCredentials,
  108 │ ): BucketAccess => {
  109 │   const context = signingContext(credentials);
  110 │   return {
  111 │     bucketName: credentials.bucketName,
  112 │     authorize: (effect) =>
  113 │       context.pipe(Effect.flatMap((layer) => Effect.provide(effect, layer))),
  114 │     presign: (request) =>
  115 │       Effect.all([context, credentials.bucketName]).pipe(
  116 │         Effect.flatMap(([layer, bucket]) =>
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

0.71 packages/alchemy/src/AWS/ACMPCA/IssueCertificate.ts:43:5
  39 │ export interface IssueCertificate extends Binding.Service<
  40 │   IssueCertificate,
  41 │   "AWS.ACMPCA.IssueCertificate",
  42 │   (
> 43 │     certificateAuthority: CertificateAuthority,
  44 │   ) => Effect.Effect<
  45 │     (
  46 │       request: IssueCertificateRequest,
  47 │     ) => Effect.Effect<
  48 │       acmpca.IssueCertificateResponse,
  49 │       acmpca.IssueCertificateError
  50 │     >
  51 │   >
  52 │ > {}

0.71 packages/alchemy/src/AWS/AccessAnalyzer/UpdateFindings.ts:31:5
  27 │ export interface UpdateFindings extends Binding.Service<
  28 │   UpdateFindings,
  29 │   "AWS.AccessAnalyzer.UpdateFindings",
  30 │   (
> 31 │     analyzer: Analyzer,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request: UpdateFindingsRequest,
  35 │     ) => Effect.Effect<aa.UpdateFindingsResponse, aa.UpdateFindingsError>
  36 │   >
  37 │ > {}

0.71 packages/alchemy/src/AWS/GuardDuty/CreateSampleFindings.ts:31:5
  27 │ export interface CreateSampleFindings extends Binding.Service<
  28 │   CreateSampleFindings,
  29 │   "AWS.GuardDuty.CreateSampleFindings",
  30 │   (
> 31 │     detector: Detector,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request?: Omit<guardduty.CreateSampleFindingsRequest, "DetectorId">,
  35 │     ) => Effect.Effect<
  36 │       guardduty.CreateSampleFindingsResponse,
  37 │       guardduty.CreateSampleFindingsError
  38 │     >
  39 │   >
  40 │ > {}

0.71 packages/alchemy/src/AWS/GuardDuty/GetInvestigation.ts:31:5
  27 │ export interface GetInvestigation extends Binding.Service<
  28 │   GetInvestigation,
  29 │   "AWS.GuardDuty.GetInvestigation",
  30 │   (
> 31 │     detector: Detector,
  32 │   ) => Effect.Effect<
  33 │     (
  34 │       request: Omit<guardduty.GetInvestigationRequest, "DetectorId">,
  35 │     ) => Effect.Effect<
  36 │       guardduty.GetInvestigationResponse,
  37 │       guardduty.GetInvestigationError
  38 │     >
  39 │   >
  40 │ > {}

0.71 packages/alchemy/src/AWS/GuardDuty/InviteMembers.ts:32:5
  28 │ export interface InviteMembers extends Binding.Service<
  29 │   InviteMembers,
  30 │   "AWS.GuardDuty.InviteMembers",
  31 │   (
> 32 │     detector: Detector,
  33 │   ) => Effect.Effect<
  34 │     (
  35 │       request?: Omit<guardduty.InviteMembersRequest, "DetectorId">,
  36 │     ) => Effect.Effect<
  37 │       guardduty.InviteMembersResponse,
  38 │       guardduty.InviteMembersError
  39 │     >
  40 │   >
  41 │ > {}

0.71 packages/alchemy/src/AWS/MedicalImaging/GetImageFrame.ts:43:5
  39 │ export interface GetImageFrame extends Binding.Service<
  40 │   GetImageFrame,
  41 │   "AWS.MedicalImaging.GetImageFrame",
  42 │   (
> 43 │     datastore: Datastore,
  44 │   ) => Effect.Effect<
  45 │     (
  46 │       request: GetImageFrameRequest,
  47 │     ) => Effect.Effect<
  48 │       medicalimaging.GetImageFrameResponse,
  49 │       medicalimaging.GetImageFrameError
  50 │     >
  51 │   >
  52 │ > {}

0.71 packages/alchemy/src/Cloudflare/KV/NamespaceHttp.ts:21:1
> 21 │ export const makeHttpKVNamespaceBinding = <Client>(options: {
  22 │   permissionGroups: PermissionGroup[];
  23 │   makeClient: (token: HttpToken, namespaceId: Effect.Effect<string>) => Client;
  24 │ }) =>

0.71 packages/alchemy/src/Local/RpcServerNode.ts:7:3
   4 │ import { SESSION_ENV_PARAM } from "./RpcServerEnvironment.ts";
   5 │
   6 │ export const RpcServerNode = RpcServer.layerServer(
>  7 │   Effect.fn(function* ({
   8 │     parentConnected,
   9 │     parentDisconnected,
  10 │     createRpcSession,

0.71 packages/alchemy/src/Neon/BucketEventSource.ts:13:1
> 13 │ export type BucketEventSourceService = <R = never>(
  14 │   bucket: Bucket,
  15 │   props: BucketEventSourceProps,
  16 │   handler: (event: BucketEvent) => Effect.Effect<void, unknown, R>,
  17 │ ) => Effect.Effect<void, never, Exclude<R, RuntimeContext | Scope>>;

0.71 packages/alchemy/src/Neon/Storage.ts:61:3
  58 │   config: StorageConfig,
  59 │   bucket: string,
  60 │ ) {
> 61 │   const http = yield* HttpClient.HttpClient;

0.71 packages/alchemy/test/Cloudflare/R2/fixtures/write-routes.ts:21:1
> 21 │ export const writeRoutes = (
  22 │   r2: WriteBucketClient,
  23 │   request: HttpServerRequest.HttpServerRequest,
  24 │   url: URL,
```
