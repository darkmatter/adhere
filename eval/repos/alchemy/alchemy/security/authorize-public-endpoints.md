# alchemy/security/authorize-public-endpoints

A handler behind a public URL, such as a Function URL, workers.dev route, or a Durable Object chosen by a client-supplied name, must authenticate the caller and check its access before doing protected work, never treating CORS, an obscure URL, or a trusted origin as authorization.

332 findings, from 0.96 down to 0.71. Each showed this hint:

```ts
fetch: Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const user = yield* verifySession(request.headers.authorization);
  if (user === undefined) return HttpServerResponse.empty({ status: 401 });
  return yield* counters.fetch(user.tenantId, request);
}),
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.96 packages/alchemy/test/AWS/DynamoDB/handler.ts:21:3
> 21 │   Effect.gen(function* () {

0.95 packages/alchemy/test/AWS/AMP/handler.ts:37:7
  36 │     return {
> 37 │       fetch: Effect.gen(function* () {
  38 │         const request = yield* HttpServerRequest;
  39 │         const url = new URL(request.originalUrl);
  40 │         const pathname = url.pathname;

0.95 packages/alchemy/test/AWS/MediaTailor/handler.ts:62:9
> 62 │         if (request.method === "POST" && pathname === "/prefetch/create") {
  63 │           const body = (yield* request.json) as unknown as { name: string };
  64 │           const now = yield* Effect.sync(() => Date.now());
  65 │           const result = yield* createPrefetchSchedule({
  66 │             Name: body.name,
  67 │             Retrieval: { EndTime: new Date(now + 60 * 60 * 1000) },
  68 │             Consumption: { EndTime: new Date(now + 2 * 60 * 60 * 1000) },
  69 │           }).pipe(
  70 │             Effect.map((r) => ({
  71 │               arn: r.Arn,
  72 │               error: undefined,
  73 │               detail: undefined,
  74 │             })),
  75 │             Effect.catch((e) =>
  76 │               Effect.succeed({
  77 │                 arn: undefined,
  78 │                 error: e._tag,
  79 │                 detail: String(e),
  80 │               }),
  81 │             ),
  82 │           );
  83 │           return yield* HttpServerResponse.json(result);
  84 │         }

0.95 packages/alchemy/test/AWS/SageMaker/handler.ts:85:11
  80 │         if (request.method === "POST" && pathname === "/put-record") {
  81 │           const body = (yield* request.json) as unknown as {
  82 │             userId: string;
  83 │             clicks: number;
  84 │           };
> 85 │           yield* putRecord({ Record: record(body.userId, body.clicks) });
  86 │           return yield* HttpServerResponse.json({ success: true });
  87 │         }

0.95 packages/alchemy/test/AWS/SimpleDB/handler.ts:18:5
  15 │ export default SimpleDBTestFunction.make(
  16 │   {
  17 │     main,
> 18 │     functionUrl: true,
  19 │   },

0.95 packages/alchemy/test/AWS/Timestream/handler.ts:39:9
  36 │         const request = yield* HttpServerRequest;
  37 │         const pathname = new URL(request.originalUrl).pathname;
  38 │
> 39 │         if (request.method === "POST" && pathname === "/write") {
  40 │           const body = (yield* request.json) as unknown as {
  41 │             host: string;
  42 │             value: string;
  43 │           };
  44 │           const result = yield* writeRecords({
  45 │             Records: [
  46 │               {
  47 │                 Dimensions: [{ Name: "host", Value: body.host }],
  48 │                 MeasureName: "cpu",
  49 │                 MeasureValue: body.value,
  50 │                 MeasureValueType: "DOUBLE",
  51 │                 Time: `${Date.now()}`,
  52 │                 TimeUnit: "MILLISECONDS",
  53 │               },
  54 │             ],
  55 │           });
  56 │           return yield* HttpServerResponse.json({
  57 │             recordsIngested: result.RecordsIngested,
  58 │           });
  59 │         }

0.95 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-do/worker.ts:22:11
  19 │         const request = yield* HttpServerRequest;
  20 │         const url = new URL(request.url, "http://x");
  21 │         const object = objects.getByName(
> 22 │           url.searchParams.get("do") ?? "default",
  23 │         );

0.94 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:95:9
   92 │         const request = yield* HttpServerRequest;
   93 │         const pathname = new URL(request.originalUrl).pathname;
   94 │
>  95 │         if (request.method === "GET" && pathname === "/config") {
   96 │           const result = yield* getConfig();
   97 │           return yield* HttpServerResponse.json({
   98 │             content: result.content,
   99 │             contentType: result.contentType,
  100 │           });
  101 │         }

0.94 packages/alchemy/test/AWS/Bedrock/handler.ts:68:7
  67 │     return {
> 68 │       fetch: Effect.gen(function* () {
  69 │         const request = yield* HttpServerRequest;
  70 │         const url = new URL(request.originalUrl);
  71 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:95:7
  92 │     const ragStream = yield* Bedrock.RetrieveAndGenerateStream(kb, MODEL);
  93 │
  94 │     return {
> 95 │       fetch: Effect.gen(function* () {
  96 │         const request = yield* HttpServerRequest;
  97 │         const url = new URL(request.originalUrl);
  98 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/ECS/handler.ts:63:7
  60 │     const ContainerName = yield* task.containerName;
  61 │
  62 │     return {
> 63 │       fetch: Effect.gen(function* () {
  64 │         const request = yield* HttpServerRequest;
  65 │         const url = new URL(request.originalUrl);
  66 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:131:9
> 131 │         if (request.method === "POST" && pathname === "/predict") {

0.94 packages/alchemy/test/AWS/IoTFleetWise/bindings-handler.ts:164:9
  161 │         const url = new URL(request.originalUrl);
  162 │         const pathname = url.pathname;
  163 │
> 164 │         if (request.method === "GET" && pathname === "/bindings") {
  165 │           return yield* HttpServerResponse.json({
  166 │             bound: Object.keys(bound),
  167 │           });
  168 │         }

0.94 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:68:7
  67 │     return {
> 68 │       fetch: Effect.gen(function* () {
  69 │         const request = yield* HttpServerRequest;
  70 │         const pathname = new URL(request.originalUrl).pathname;

0.94 packages/alchemy/test/AWS/Kinesis/handler.ts:163:11
  162 │         if (request.method === "GET" && pathname === "/shards") {
> 163 │           return yield* HttpServerResponse.json(yield* listShards());
  164 │         }

0.94 packages/alchemy/test/AWS/Location/handler.ts:232:11
  231 │         if (pathname === "/geofence/list") {
> 232 │           // Also serves as the test setup's IAM canary — always responds 200
  233 │           // and surfaces the typed failure tag so setup can wait for geo:*
  234 │           // authorization (or diagnose schema gaps) without blind 500s.
  235 │           const page = yield* Effect.result(listGeofences());
  236 │           return yield* HttpServerResponse.json(
  237 │             Result.isSuccess(page)
  238 │               ? { ok: true, count: (page.success.Entries ?? []).length }
  239 │               : {
  240 │                   ok: false,
  241 │                   tag: page.failure._tag,
  242 │                   message: String(page.failure),
  243 │                 },
  244 │           );
  245 │         }

0.94 packages/alchemy/test/AWS/MQ/bindings-handler.ts:29:7
  25 │     const broker = yield* MQ.Broker("BindingsBroker", {
  26 │       engineType: "ACTIVEMQ",
  27 │       hostInstanceType: "mq.t3.micro",
  28 │       deploymentMode: "SINGLE_INSTANCE",
> 29 │       publiclyAccessible: true,
  30 │       users: [
  31 │         {
  32 │           username: "alchemyadmin",
  33 │           password: Redacted.make("SuperSecretPassw0rd!"),
  34 │         },
  35 │       ],
  36 │     });

0.94 packages/alchemy/test/AWS/MediaConvert/handler.ts:49:7
  48 │     return {
> 49 │       fetch: Effect.gen(function* () {
  50 │         const request = yield* HttpServerRequest;
  51 │         const url = new URL(request.originalUrl);
  52 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/RedshiftData/fixtures/data-api-handler.ts:30:5
  27 │ export default RedshiftDataApiFunction.make(
  28 │   {
  29 │     main,
> 30 │     functionUrl: true,
  31 │     // Data API statements are submitted then polled; a cold workgroup can
  32 │     // take ~30s to serve its first statement — allow generous headroom.
  33 │     timeout: Duration.seconds(240),
  34 │   },

0.94 packages/alchemy/test/AWS/RedshiftServerless/fixtures/snapshot-handler.ts:45:7
  44 │     return {
> 45 │       fetch: Effect.gen(function* () {
  46 │         const request = yield* HttpServerRequest;
  47 │         const url = new URL(request.originalUrl);
  48 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/S3Vectors/vectors-handler.ts:36:7
  33 │     const vectors = yield* S3Vectors.Vectors(index);
  34 │
  35 │     return {
> 36 │       fetch: Effect.gen(function* () {
  37 │         const request = yield* HttpServerRequest;
  38 │         const url = new URL(request.originalUrl);
  39 │         const pathname = url.pathname;

0.94 packages/alchemy/test/AWS/SNS/handler.ts:239:11
  231 │         if (
  232 │           request.method === "POST" &&
  233 │           pathname === "/data-protection-policy"
  234 │         ) {
  235 │           const body = (yield* request.json) as { policy: string };
  236 │           const response = yield* putDataProtectionPolicy({
  237 │             DataProtectionPolicy: body.policy,
  238 │           }).pipe(Effect.catch((error) => Effect.succeed(formatError(error))));
> 239 │           return yield* HttpServerResponse.json(response);
  240 │         }

0.94 packages/alchemy/test/AWS/SecretsManager/fixtures/get-secret-only-handler.ts:36:9
> 36 │         if (request.method === "GET" && url.pathname === "/get-value") {
  37 │           const result = yield* getSecretValue({
  38 │             VersionId: url.searchParams.get("versionId") ?? undefined,
  39 │             VersionStage: url.searchParams.get("versionStage") ?? undefined,
  40 │           });
  41 │           return yield* HttpServerResponse.json({
  42 │             arn: result.ARN,
  43 │             name: result.Name,
  44 │             versionId: result.VersionId,
  45 │             secretString:
  46 │               typeof result.SecretString === "string" ||
  47 │               result.SecretString === undefined
  48 │                 ? result.SecretString
  49 │                 : Redacted.value(result.SecretString),
  50 │           });
  51 │         }

0.94 packages/alchemy/test/AWS/Synthetics/handler.ts:69:7
  68 │     return {
> 69 │       fetch: Effect.gen(function* () {
  70 │         const request = yield* HttpServerRequest;
  71 │         const url = new URL(request.originalUrl);
  72 │         const pathname = url.pathname;

0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-do-namespace-do-rpc/worker.ts:36:11
  33 │         const [, id, action] = match;
  34 │
  35 │         if (request.method === "POST" && action === "increment") {
> 36 │           const client = yield* counters.getByName(id);
  37 │           const result = yield* client.Increment({}).pipe(Effect.orDie);
  38 │           return yield* HttpServerResponse.json(result);
  39 │         }

0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/workerB.ts:20:9
  17 │     return {
  18 │       fetch: Effect.gen(function* () {
  19 │         const request = yield* HttpServerRequest;
> 20 │         const key = request.headers["x-counter-key"] ?? "default";
  21 │         const stub = counter.getByName(key);
  22 │         const url = new URL(request.url, "http://x");

0.93 packages/alchemy/test/AWS/ApiGateway/fixtures/bindings-handler.ts:34:7
  31 │     yield* ApiGateway.Method("AgBindingsMock", {
  32 │       restApi: api,
  33 │       httpMethod: "GET",
> 34 │       authorizationType: "NONE",
  35 │       integration: { type: "MOCK" },
  36 │     });

0.93 packages/alchemy/test/AWS/Athena/handler.ts:164:9
  163 │         // Flagship: run a Glue-backed query end-to-end and read the result.
> 164 │         if (request.method === "GET" && pathname === "/count") {
  165 │           const result = yield* runQuery({
  166 │             QueryString: `SELECT COUNT(*) AS c FROM ${DATABASE}.${TABLE}`,
  167 │           });
  168 │           return yield* HttpServerResponse.json({
  169 │             state: result.state,
  170 │             columns: result.columns,
  171 │             rows: result.rows,
  172 │           });
  173 │         }

0.93 packages/alchemy/test/AWS/BedrockDataAutomation/handler.ts:153:9
> 153 │         if (request.method === "POST" && pathname === "/invoke-async") {

0.93 packages/alchemy/test/AWS/CloudFront/handler.ts:80:9
> 80 │         if (request.method === "POST" && pathname === "/invalidate") {
  81 │           const body = (yield* request.json) as unknown as {
  82 │             callerReference: string;
  83 │             paths: string[];
  84 │           };
  85 │           const response = yield* createInvalidation({
  86 │             InvalidationBatch: {
  87 │               CallerReference: body.callerReference,
  88 │               Paths: {
  89 │                 Quantity: body.paths.length,
  90 │                 Items: body.paths,
  91 │               },
  92 │             },
  93 │           }).pipe(Effect.retry(authorizationPolicy));
  94 │           return yield* HttpServerResponse.json({
  95 │             invalidationId: response.Invalidation?.Id,
  96 │             status: response.Invalidation?.Status,
  97 │           });
  98 │         }

0.93 packages/alchemy/test/AWS/CodeConnections/handler.ts:47:7
  46 │     return {
> 47 │       fetch: Effect.gen(function* () {
  48 │         const request = yield* HttpServerRequest;
  49 │         const url = new URL(request.originalUrl);
  50 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/DAX/slow-handler.ts:71:7
  70 │     return {
> 71 │       fetch: Effect.gen(function* () {
  72 │         const request = yield* HttpServerRequest;
  73 │         const url = new URL(request.originalUrl);
  74 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/Deadline/handler.ts:145:11
  144 │         if (request.method === "GET" && pathname === "/job") {
> 145 │           const job = yield* getJob({ jobId: param("jobId") });
  146 │           return yield* HttpServerResponse.json({
  147 │             jobId: job.jobId,
  148 │             name: job.name,
  149 │             lifecycleStatus: job.lifecycleStatus,
  150 │             priority: job.priority,
  151 │           });
  152 │         }

0.93 packages/alchemy/test/AWS/DevOpsGuru/handler.ts:70:7
  69 │     return {
> 70 │       fetch: Effect.gen(function* () {
  71 │         const request = yield* HttpServerRequest;
  72 │         const url = new URL(request.originalUrl);
  73 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/FIS/handler.ts:103:7
  102 │     return {
> 103 │       fetch: Effect.gen(function* () {
  104 │         const request = yield* HttpServerRequest;
  105 │         const url = new URL(request.originalUrl);
  106 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/Forecast/handler.ts:85:9
  82 │         const request = yield* HttpServerRequest;
  83 │         const url = new URL(request.originalUrl);
  84 │         const pathname = url.pathname;
> 85 │         const arn = url.searchParams.get("arn") ?? "";

0.93 packages/alchemy/test/AWS/IdentityCenter/handler.ts:161:9
> 161 │         if (request.method === "GET" && pathname === "/groups") {
  162 │           const { Groups } = yield* listGroups({ MaxResults: 50 });
  163 │           return yield* HttpServerResponse.json({
  164 │             displayNames: (Groups ?? []).map((g) => unwrap(g.DisplayName)),
  165 │           });
  166 │         }

0.93 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:106:9
> 106 │         if (request.method === "GET" && pathname === "/shadow") {
  107 │           const result = yield* getShadow({ shadowName }).pipe(
  108 │             Effect.map((r) => ({ found: true as const, payload: r.payload })),
  109 │             Effect.catchTag("ResourceNotFoundException", () =>
  110 │               Effect.succeed({ found: false as const, payload: undefined }),
  111 │             ),
  112 │           );
  113 │           const payload = yield* decodeShadowPayload(result.payload);
  114 │           return yield* HttpServerResponse.json({
  115 │             found: result.found,
  116 │             payload,
  117 │           });
  118 │         }

0.93 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:47:9
  38 │     return {
  39 │       fetch: Effect.gen(function* () {
  40 │         const request = yield* HttpServerRequest;
  41 │         const pathname = new URL(request.originalUrl).pathname;
  42 │
  43 │         // Restore the source table's continuous backup (current time) into a
  44 │         // new table of the same keyspace. RestoreTable is asynchronous — the
  45 │         // response carries the new table's ARN while it is RESTORING; the
  46 │         // test deletes it out-of-band.
> 47 │         if (request.method === "POST" && pathname === "/restore") {
  48 │           const result = yield* restore({
  49 │             targetTableName: "orders_restored",
  50 │           }).pipe(
  51 │             Effect.map((response) => ({
  52 │               restoredTableARN: response.restoredTableARN,
  53 │             })),
  54 │             Effect.catch((error) =>
  55 │               Effect.succeed({ error: error._tag } as const),
  56 │             ),
  57 │           );
  58 │           return yield* HttpServerResponse.json(result);
  59 │         }
  60 │
  61 │         return yield* HttpServerResponse.json(
  62 │           { error: "Not found", method: request.method, pathname },
  63 │           { status: 404 },
  64 │         );
  65 │       }).pipe(Effect.orDie),
  66 │     };

0.93 packages/alchemy/test/AWS/Logs/handler.ts:53:7
  50 │     const LogStreamName = yield* logStream.logStreamName;
  51 │
  52 │     return {
> 53 │       fetch: Effect.gen(function* () {
  54 │         const request = yield* HttpServerRequest;
  55 │         const url = new URL(request.originalUrl);
  56 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/ObservabilityAdmin/handler.ts:50:7
  49 │     return {
> 50 │       fetch: Effect.gen(function* () {
  51 │         const request = yield* HttpServerRequest;
  52 │         const url = new URL(request.originalUrl);
  53 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/PaymentCryptography/handler.ts:146:7
  145 │     return {
> 146 │       fetch: Effect.gen(function* () {
  147 │         const request = yield* HttpServerRequest;
  148 │         const pathname = new URL(request.originalUrl).pathname;

0.93 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/optout-handler.ts:51:9
> 51 │         if (request.method === "POST" && pathname === "/opt-out") {
  52 │           const result = yield* putOptedOut({
  53 │             OptedOutNumber: TEST_DESTINATION,
  54 │           });
  55 │           return yield* HttpServerResponse.json({
  56 │             optedOutNumber: result.OptedOutNumber,
  57 │             endUserOptedOut: result.EndUserOptedOut,
  58 │           });
  59 │         }

0.93 packages/alchemy/test/AWS/QuickSight/bindings-handler.ts:97:11
   94 │         if (request.method === "GET" && pathname === "/ingestions") {
   95 │           // DataSetId + AwsAccountId injection scope the call to the bound
   96 │           // dataset.
>  97 │           const response = yield* listIngestions({ MaxResults: 10 });
   98 │           return yield* HttpServerResponse.json({
   99 │             count: (response.Ingestions ?? []).length,
  100 │           });
  101 │         }

0.93 packages/alchemy/test/AWS/ResourceExplorer/handler.ts:37:7
  36 │     return {
> 37 │       fetch: Effect.gen(function* () {
  38 │         const request = yield* HttpServerRequest;
  39 │         const url = new URL(request.originalUrl);
  40 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:67:11
  66 │         if (request.method === "GET" && pathname === "/bucket-name") {
> 67 │           return yield* HttpServerResponse.json({ bucketName });
  68 │         }

0.93 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:103:13
  100 │         const VersionId = url.searchParams.get("versionId") ?? undefined;
  101 │         switch (operation) {
  102 │           case "GetObject":
> 103 │             return yield* get({ Key, VersionId }).pipe(
  104 │               Effect.flatMap((result) =>
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

0.93 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:22:5
  19 │ export default S3VersionedObjectLockFunction.make(
  20 │   {
  21 │     main: import.meta.url,
> 22 │     functionUrl: true,
  23 │     timeout: Duration.seconds(30),
  24 │     memorySize: 512,
  25 │   },

0.93 packages/alchemy/test/AWS/SSM/handler.ts:96:9
   93 │         const url = new URL(request.originalUrl);
   94 │         const pathname = url.pathname;
   95 │
>  96 │         if (request.method === "GET" && pathname === "/get-string") {
   97 │           const result = yield* getStringParameter();
   98 │           return yield* HttpServerResponse.json({
   99 │             name: result.Parameter?.Name,
  100 │             type: result.Parameter?.Type,
  101 │             value: plain(result.Parameter?.Value),
  102 │           });
  103 │         }

0.93 packages/alchemy/test/AWS/SSMIncidents/handler.ts:106:7
  105 │     return {
> 106 │       fetch: Effect.gen(function* () {
  107 │         const request = yield* HttpServerRequest;
  108 │         const url = new URL(request.originalUrl);
  109 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/Schemas/handler.ts:117:7
  116 │     return {
> 117 │       fetch: Effect.gen(function* () {
  118 │         const request = yield* HttpServerRequest;
  119 │         const url = new URL(request.originalUrl);
  120 │         const pathname = url.pathname;

0.93 packages/alchemy/test/AWS/SecretsManager/handler.ts:41:5
  38 │ export default SecretsManagerTestFunction.make(
  39 │   {
  40 │     main,
> 41 │     functionUrl: true,
  42 │   },

0.93 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:84:11
  81 │         const q = (name: string) => url.searchParams.get(name) ?? undefined;
  82 │
  83 │         if (pathname === "/bindings") {
> 84 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  85 │         }

0.93 packages/alchemy/test/AWS/ServiceQuotas/handler.ts:177:11
  168 │         if (request.method === "POST" && pathname === "/request-increase") {
  169 │           const serviceCode = url.searchParams.get("service");
  170 │           const quotaCode = url.searchParams.get("quota");
  171 │           if (serviceCode === null || quotaCode === null) {
  172 │             return yield* HttpServerResponse.json(
  173 │               { error: "service and quota query params are required" },
  174 │               { status: 400 },
  175 │             );
  176 │           }
> 177 │           return yield* requestServiceQuotaIncrease({
  178 │             ServiceCode: serviceCode,
  179 │             QuotaCode: quotaCode,
  180 │             DesiredValue: 1,
  181 │           }).pipe(
  182 │             Effect.flatMap((result) =>
  183 │               HttpServerResponse.json({
  184 │                 requestId: result.RequestedQuota?.Id,
  185 │                 status: result.RequestedQuota?.Status,
  186 │               }),
  187 │             ),
  188 │             Effect.catchTag("NoSuchResourceException", () =>
  189 │               HttpServerResponse.json(
  190 │                 { tag: "NoSuchResourceException" },
  191 │                 { status: 404 },
  192 │               ),
  193 │             ),
  194 │           );
  195 │         }

0.93 packages/alchemy/test/AWS/Transcribe/handler.ts:164:11
  162 │         switch (route) {
  163 │           // --- lists (count proves grant + wire-up) ---
> 164 │           case "GET /jobs":
  165 │             return yield* respond(
  166 │               result(listJobs({ MaxResults: 5 }), (r) => ({
  167 │                 count: r.TranscriptionJobSummaries?.length ?? 0,
  168 │               })),
  169 │             );

0.93 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/worker.ts:26:11
  25 │         if (action === "rpc") {
> 26 │           return yield* objects.fetch(name, request);
  27 │         }

0.93 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/workerA.ts:24:9
  21 │     return {
  22 │       fetch: Effect.gen(function* () {
  23 │         const request = yield* HttpServerRequest;
> 24 │         const key = request.headers["x-counter-key"] ?? "default";
  25 │         const stub = counter.getByName(key);
  26 │         const url = new URL(request.url, "http://x");

0.93 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/workerC.ts:30:9
  24 │   Effect.gen(function* () {
  25 │     const counter = yield* Counter.from(WorkerC);
  26 │
  27 │     return {
  28 │       fetch: Effect.gen(function* () {
  29 │         const request = yield* HttpServerRequest;
> 30 │         const key = request.headers["x-counter-key"] ?? "default";
  31 │         const stub = yield* counter.getByName(key);
  32 │         const url = new URL(request.url, "http://x");
  33 │
  34 │         if (request.method === "POST" && url.pathname === "/reset") {
  35 │           yield* stub.reset({ key }).pipe(Effect.orDie);
  36 │           return yield* HttpServerResponse.json({ ok: true });
  37 │         }
  38 │
  39 │         if (request.method === "POST" && url.pathname === "/do/increment") {
  40 │           const { value } = yield* stub.incrementDO({ key }).pipe(Effect.orDie);
  41 │           return yield* HttpServerResponse.json({ value });
  42 │         }
  43 │
  44 │         if (request.method === "GET" && url.pathname === "/do") {
  45 │           const { value } = yield* stub.getDO({ key }).pipe(Effect.orDie);
  46 │           return yield* HttpServerResponse.json({ value });
  47 │         }
  48 │
  49 │         return HttpServerResponse.text("Not Found", { status: 404 });
  50 │       }).pipe(Effect.scoped),
  51 │     };
  52 │   }).pipe(

0.92 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:146:9
  143 │         const url = new URL(request.originalUrl);
  144 │         const pathname = url.pathname;
  145 │
> 146 │         if (request.method === "GET" && pathname === "/csr") {
  147 │           const { Csr } = yield* getCsr();
  148 │           return yield* HttpServerResponse.json({
  149 │             csr: Csr,
  150 │             caArn: yield* CaArn,
  151 │           });
  152 │         }

0.92 packages/alchemy/test/AWS/BedrockAgentCore/handler.ts:224:13
  222 │         if (request.method === "GET" && pathname === "/records") {
  223 │           const result = yield* listMemoryRecords({
> 224 │             namespace: `facts/${url.searchParams.get("actorId")}`,
  225 │           });
  226 │           return yield* HttpServerResponse.json({
  227 │             count: result.memoryRecordSummaries.length,
  228 │           });
  229 │         }

0.92 packages/alchemy/test/AWS/CloudFront/kvs-handler.ts:42:7
  39 │     const updateKeys = yield* CloudFront.UpdateKeys(store);
  40 │
  41 │     return {
> 42 │       fetch: Effect.gen(function* () {
  43 │         const request = yield* HttpServerRequest;
  44 │         const url = new URL(request.originalUrl);
  45 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:57:7
  56 │     return {
> 57 │       fetch: Effect.gen(function* () {
  58 │         const request = yield* HttpServerRequest;
  59 │         const url = new URL(request.originalUrl);
  60 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Cognito/handler.ts:106:9
  104 │         // Full password auth flow: create → set permanent password →
  105 │         // USER_PASSWORD_AUTH → getUser with the access token → delete.
> 106 │         if (request.method === "POST" && pathname === "/auth-flow") {

0.92 packages/alchemy/test/AWS/CostExplorer/handler.ts:402:11
  401 │         if (
> 402 │           request.method === "GET" &&
  403 │           pathname === "/anomaly-feedback-invalid"
  404 │         ) {
  405 │           // Exercises the account-level grant + the typed error path — the
  406 │           // nonexistent anomaly id must surface the typed ValidationException
  407 │           // ("Feedback is submitted for an invalid anomaly", verified by
  408 │           // probe). An IAM gap would surface AccessDeniedException and 500
  409 │           // this route instead.
  410 │           const result = yield* provideAnomalyFeedback({
  411 │             AnomalyId: NONEXISTENT_ANOMALY_ID,
  412 │             Feedback: "PLANNED_ACTIVITY",
  413 │           }).pipe(
  414 │             Effect.map(() => "Provided"),
  415 │             Effect.catchTag("ValidationException", (e) =>
  416 │               Effect.succeed(e._tag),
  417 │             ),
  418 │           );
  419 │           return yield* HttpServerResponse.json({ tag: result });
  420 │         }

0.92 packages/alchemy/test/AWS/DataExchange/handler.ts:98:7
   95 │     const BucketName = yield* bucket.bucketName;
   96 │
   97 │     return {
>  98 │       fetch: Effect.gen(function* () {
   99 │         const request = yield* HttpServerRequest;
  100 │         const url = new URL(request.originalUrl);
  101 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Detective/handler.ts:239:11
  220 │         if (
  221 │           request.method === "GET" &&
  222 │           pathname === "/membership-datasources"
  223 │         ) {
  224 │           const graphArn = url.searchParams.get("graphArn");
  225 │           if (!graphArn) {
  226 │             return yield* HttpServerResponse.json(
  227 │               { error: "missing graphArn" },
  228 │               { status: 400 },
  229 │             );
  230 │           }
  231 │           const result = yield* errorTagged(
  232 │             batchGetMembershipDatasources({ GraphArns: [graphArn] }).pipe(
  233 │               Effect.map((r) => ({
  234 │                 membershipDatasources: (r.MembershipDatasources ?? []).length,
  235 │                 unprocessedGraphs: (r.UnprocessedGraphs ?? []).length,
  236 │               })),
  237 │             ),
  238 │           );
> 239 │           return yield* HttpServerResponse.json(result);
  240 │         }

0.92 packages/alchemy/test/AWS/DocDB/handler.ts:67:7
  66 │     return {
> 67 │       fetch: Effect.gen(function* () {
  68 │         const request = yield* HttpServerRequest;
  69 │         const url = new URL(request.originalUrl);
  70 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/ECR/handler.ts:229:11
  228 │         if (request.method === "GET" && pathname === "/layer") {
> 229 │           const res = yield* getDownloadUrl({ layerDigest: param("digest") });
  230 │           return yield* HttpServerResponse.json({
  231 │             hasUrl: (res.downloadUrl ?? "").startsWith("https://"),
  232 │             layerDigest: res.layerDigest,
  233 │           });
  234 │         }

0.92 packages/alchemy/test/AWS/EMR/slow-handler.ts:110:9
  108 │         // Submit a trivial shell step — proves AddJobFlowSteps and the
  109 │         // JobFlowId injection.
> 110 │         if (request.method === "GET" && pathname === "/steps/add") {
  111 │           const { StepIds } = yield* addSteps({
  112 │             Steps: [
  113 │               {
  114 │                 Name: "alchemy-echo",
  115 │                 ActionOnFailure: "CONTINUE",
  116 │                 HadoopJarStep: {
  117 │                   Jar: "command-runner.jar",
  118 │                   Args: ["bash", "-c", "echo alchemy"],
  119 │                 },
  120 │               },
  121 │             ],
  122 │           });
  123 │           return yield* HttpServerResponse.json({ stepId: StepIds?.[0] });
  124 │         }

0.92 packages/alchemy/test/AWS/EMRContainers/handler.ts:94:7
  93 │     return {
> 94 │       fetch: Effect.gen(function* () {
  95 │         const request = yield* HttpServerRequest;
  96 │         const url = new URL(request.originalUrl);
  97 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Glacier/bindings-handler.ts:73:11
  71 │         if (request.method === "GET" && pathname === "/vault") {
  72 │           // vaultName injection scopes the call to the bound vault.
> 73 │           const response = yield* describeVault();
  74 │           return yield* HttpServerResponse.json({
  75 │             vaultName: response.VaultName,
  76 │             numberOfArchives: response.NumberOfArchives ?? 0,
  77 │           });
  78 │         }

0.92 packages/alchemy/test/AWS/GlobalAccelerator/handler.ts:76:7
  75 │     return {
> 76 │       fetch: Effect.gen(function* () {
  77 │         const request = yield* HttpServerRequest;
  78 │         const url = new URL(request.originalUrl);
  79 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Glue/handler.ts:340:7
> 340 │       }).pipe(Effect.orDie),
  341 │     };
  342 │   }).pipe(

0.92 packages/alchemy/test/AWS/GuardDuty/handler.ts:127:9
  125 │         // Generates sample findings on our own detector — the documented
  126 │         // way to exercise a findings pipeline without staging a threat.
> 127 │         if (request.method === "POST" && pathname === "/sample") {
  128 │           yield* createSampleFindings({
  129 │             FindingTypes: ["Recon:EC2/PortProbeUnprotectedPort"],
  130 │           });
  131 │           return yield* HttpServerResponse.json({ ok: true });
  132 │         }

0.92 packages/alchemy/test/AWS/ImageBuilder/handler.ts:296:11
  294 │         // Read one workflow execution by id.
  295 │         if (request.method === "GET" && pathname === "/workflow-execution") {
> 296 │           const execution = yield* getWorkflowExecution({
  297 │             workflowExecutionId: id,
  298 │           });
  299 │           return yield* HttpServerResponse.json({
  300 │             id: execution.workflowExecutionId,
  301 │             type: execution.type,
  302 │             status: execution.status,
  303 │           });
  304 │         }

0.92 packages/alchemy/test/AWS/LicenseManager/handler.ts:121:11
  119 │         if (request.method === "GET" && pathname === "/configuration") {
  120 │           const config = yield* getConfiguration();
> 121 │           return yield* HttpServerResponse.json({
  122 │             name: config.Name ?? null,
  123 │             countingType: config.LicenseCountingType ?? null,
  124 │             licenseCount: config.LicenseCount ?? null,
  125 │           });
  126 │         }

0.92 packages/alchemy/test/AWS/LicenseManager/seller-handler.ts:96:9
  94 │         // Full seller data plane: issue -> version -> token mint/exchange ->
  95 │         // checkout/extend/checkin -> grant create/delete -> delete.
> 96 │         if (request.method === "POST" && pathname === "/lifecycle") {
  97 │           const beneficiary = url.searchParams.get("account");

0.92 packages/alchemy/test/AWS/Logs/sink-handler.ts:54:9
> 54 │         if (request.method === "POST" && pathname === "/sink") {
  55 │           const body = (yield* request.json) as { messages: string[] };
  56 │           const start = yield* Clock.currentTimeMillis;
  57 │           // PutLogEvents requires chronological order within a batch —
  58 │           // ordering stays with the caller, so stamp increasing timestamps.
  59 │           const events = body.messages.map((message, index) => ({
  60 │             timestamp: start + index,
  61 │             message,
  62 │           }));
  63 │
  64 │           yield* Stream.fromIterable(events).pipe(Stream.run(sink));
  65 │
  66 │           return yield* HttpServerResponse.json({
  67 │             ok: true,
  68 │             count: body.messages.length,
  69 │           });
  70 │         }

0.92 packages/alchemy/test/AWS/MediaConnect/fixtures/handler.ts:85:9
  82 │         const url = new URL(request.originalUrl);
  83 │         const pathname = url.pathname;
  84 │
> 85 │         if (request.method === "GET" && pathname === "/bindings") {
  86 │           return yield* HttpServerResponse.json({
  87 │             bound: Object.keys(bound),
  88 │           });
  89 │         }

0.92 packages/alchemy/test/AWS/MediaPackageV2/fixtures/handler.ts:104:7
  103 │     return {
> 104 │       fetch: Effect.gen(function* () {
  105 │         const request = yield* HttpServerRequest;
  106 │         const url = new URL(request.originalUrl);
  107 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/OpenSearchServerless/bindings-handler.ts:49:9
> 49 │         if (request.method === "GET" && pathname === "/account-settings") {
  50 │           const response = yield* getAccountSettings();
  51 │           return yield* HttpServerResponse.json({
  52 │             capacityLimits:
  53 │               response.accountSettingsDetail?.capacityLimits ?? null,
  54 │           });
  55 │         }

0.92 packages/alchemy/test/AWS/Personalize/handler.ts:161:11
  160 │         if (pathname === "/bindings") {
> 161 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  162 │         }

0.92 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/phone-handler.ts:57:9
> 57 │         if (request.method === "POST" && pathname === "/send-text") {
  58 │           const { MessageId } = yield* sendText({
  59 │             DestinationPhoneNumber: SIMULATOR_DESTINATION,
  60 │             MessageBody: "hello from alchemy",
  61 │             MessageType: "TRANSACTIONAL",
  62 │           });
  63 │           return yield* HttpServerResponse.json({ messageId: MessageId });
  64 │         }

0.92 packages/alchemy/test/AWS/RUM/handler.ts:53:9
  50 │         // RUM web client makes) — the monitor id and AppMonitorDetails are
  51 │         // injected by the binding. A typed failure reports its tag so a
  52 │         // grant gap is diagnosable from the JSON.
> 53 │         if (request.method === "POST" && pathname === "/events") {
  54 │           const ids = yield* Effect.sync(() => ({
  55 │             batch: crypto.randomUUID(),
  56 │             event: crypto.randomUUID(),
  57 │             session: crypto.randomUUID(),
  58 │             user: crypto.randomUUID(),
  59 │           }));
  60 │           const result = yield* Effect.result(
  61 │             bound.putRumEvents({
  62 │               BatchId: ids.batch,
  63 │               UserDetails: { userId: ids.user, sessionId: ids.session },
  64 │               RumEvents: [
  65 │                 {
  66 │                   id: ids.event,
  67 │                   timestamp: new Date(),
  68 │                   type: "com.amazon.rum.session_start_event",
  69 │                   details: "{}",
  70 │                 },
  71 │               ],
  72 │             }),
  73 │           );
  74 │           return yield* HttpServerResponse.json(
  75 │             Result.isSuccess(result)
  76 │               ? { tag: "ok" }
  77 │               : { tag: result.failure._tag, error: String(result.failure) },
  78 │           );
  79 │         }

0.92 packages/alchemy/test/AWS/Redshift/fixtures/connect-handler.ts:57:11
  50 │     return {
  51 │       fetch: Effect.gen(function* () {
  52 │         const request = yield* HttpServerRequest;
  53 │         const url = new URL(request.originalUrl);
  54 │         const pathname = url.pathname;
  55 │
  56 │         if (request.method === "GET" && pathname === "/info") {
> 57 │           const info = yield* connectIam;
  58 │           return yield* HttpServerResponse.json(summarize(info));
  59 │         }
  60 │         if (request.method === "GET" && pathname === "/info-dbuser") {
  61 │           const info = yield* connectDbUser;
  62 │           return yield* HttpServerResponse.json(summarize(info));
  63 │         }
  64 │
  65 │         return yield* HttpServerResponse.json(
  66 │           { error: "Not found", method: request.method, pathname },
  67 │           { status: 404 },
  68 │         );
  69 │       }).pipe(Effect.orDie),
  70 │     };

0.92 packages/alchemy/test/AWS/S3/fixtures/presign-get-only-handler.ts:36:11
  22 │     return {
  23 │       fetch: Effect.gen(function* () {
  24 │         const request = yield* HttpServerRequest;
  25 │         const url = yield* Effect.sync(() => new URL(request.originalUrl));
  26 │         if (url.pathname === "/info") {
  27 │           return yield* HttpServerResponse.json({
  28 │             bucketName: yield* bucketName,
  29 │             bucketArn: yield* bucketArn,
  30 │           });
  31 │         }
  32 │         const key = url.searchParams.get("key");
  33 │         if (!key)
  34 │           return HttpServerResponse.text("Missing key", { status: 400 });
  35 │         return yield* HttpServerResponse.json({
> 36 │           url: yield* presignGet({
  37 │             key,
  38 │             versionId: url.searchParams.get("versionId") ?? undefined,
  39 │             contentType: url.searchParams.get("contentType") ?? undefined,
  40 │             expiresIn: url.searchParams.has("expiresIn")
  41 │               ? Number(url.searchParams.get("expiresIn"))
  42 │               : undefined,
  43 │           }),
  44 │         });
  45 │       }).pipe(Effect.orDie),
  46 │     };

0.92 packages/alchemy/test/AWS/S3/fixtures/versioned-multipart-handler.ts:84:7
  83 │     return {
> 84 │       fetch: Effect.gen(function* () {
  85 │         const request = yield* HttpServerRequest;
  86 │         const url = yield* Effect.sync(() => new URL(request.originalUrl));

0.92 packages/alchemy/test/AWS/SSMContacts/bindings-handler.ts:120:7
  117 │     const oncallArn = yield* oncall.contactArn;
  118 │
  119 │     return {
> 120 │       fetch: Effect.gen(function* () {
  121 │         const request = yield* HttpServerRequest;
  122 │         const url = new URL(request.originalUrl);
  123 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Scheduler/handler.ts:93:7
  90 │     const cronQueueUrl = yield* cronQueue.queueUrl;
  91 │
  92 │     return {
> 93 │       fetch: Effect.gen(function* () {
  94 │         const request = yield* HttpServerRequest;
  95 │         const url = new URL(request.originalUrl);
  96 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/SecurityHub/handler.ts:122:9
  119 │         const url = new URL(request.originalUrl);
  120 │         const pathname = url.pathname;
  121 │
> 122 │         if (request.method === "GET" && pathname === "/bindings") {
  123 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  124 │         }

0.92 packages/alchemy/test/AWS/SecurityLake/bindings-handler.ts:66:11
  63 │         if (request.method === "GET" && pathname === "/exceptions") {
  64 │           // An IAM gap would surface AccessDeniedException (a 500); a
  65 │           // successful (possibly empty) list proves the grant end-to-end.
> 66 │           const response = yield* listExceptions();
  67 │           return yield* HttpServerResponse.json({
  68 │             count: (response.exceptions ?? []).length,
  69 │           });
  70 │         }

0.92 packages/alchemy/test/AWS/StepFunctions/handler.ts:201:9
  199 │     return {
  200 │       fetch: Effect.gen(function* () {
> 201 │         const request = yield* HttpServerRequest;
  202 │         const url = new URL(request.originalUrl);
  203 │         const pathname = url.pathname;

0.92 packages/alchemy/test/AWS/Timestream/sink-handler.ts:100:13
   97 │         if (request.method === "GET" && pathname === "/count") {
   98 │           const host = new URL(request.originalUrl).searchParams.get("host");
   99 │           const result = yield* query({
> 100 │             QueryString: `SELECT COUNT(*) AS c FROM "${DatabaseName}"."${TableName}" WHERE host = '${host}'`,
  101 │           });
  102 │           return yield* HttpServerResponse.json({ rows: result.Rows });
  103 │         }

0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations-upgrade/worker.ts:47:9
  38 │ export default class UpgradeWorker extends Cloudflare.Worker<UpgradeWorker>()(
  39 │   "SqlMigrationUpgradeWorker",
  40 │   { main: import.meta.url },
  41 │   Effect.gen(function* () {
  42 │     const objects = yield* UpgradeObject;
  43 │     return {
  44 │       fetch: Effect.gen(function* () {
  45 │         const request = yield* HttpServerRequest;
  46 │         const object = objects.getByName("persistent");
> 47 │         if (request.method === "POST") yield* object.insert();
  48 │         return yield* HttpServerResponse.json(yield* object.inspect());
  49 │       }),
  50 │     };
  51 │   }),
  52 │ ) {}

0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/workerB.ts:24:9
  21 │     return {
  22 │       fetch: Effect.gen(function* () {
  23 │         const request = yield* HttpServerRequest;
> 24 │         const key = request.headers["x-counter-key"] ?? "default";
  25 │         const stub = yield* counter.getByName(key);
  26 │         const url = new URL(request.url, "http://x");

0.91 packages/alchemy/test/AWS/AICapabilities/handler.ts:45:7
  42 │     const detectSentiment = yield* Comprehend.DetectSentiment();
  43 │
  44 │     return {
> 45 │       fetch: Effect.gen(function* () {
  46 │         const request = yield* HttpServerRequest;
  47 │         const url = new URL(request.originalUrl);
  48 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/AIOps/fixtures/handler.ts:73:11
  71 │         // Group-scoped read: the group ARN is injected from the binding.
  72 │         if (request.method === "GET" && pathname === "/group") {
> 73 │           const detail = yield* getInvestigationGroup();
  74 │           return yield* HttpServerResponse.json({
  75 │             name: detail.name,
  76 │             arn: detail.arn,
  77 │             retentionInDays: detail.retentionInDays,
  78 │           });
  79 │         }

0.91 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:105:11
  102 │         if (request.method === "GET" && pathname === "/job") {
  103 │           const branchName = url.searchParams.get("branchName")!;
  104 │           const jobId = url.searchParams.get("jobId")!;
> 105 │           const result = yield* getJob({ branchName, jobId });
  106 │           return yield* HttpServerResponse.json({
  107 │             status: result.job.summary.status,
  108 │             stepCount: result.job.steps.length,
  109 │           });
  110 │         }

0.91 packages/alchemy/test/AWS/AppIntegrations/fixtures/handler.ts:22:5
  19 │ export default AppIntegrationsTestFunction.make(
  20 │   {
  21 │     main,
> 22 │     functionUrl: true,
  23 │   },

0.91 packages/alchemy/test/AWS/AppRunner/fixtures/handler.ts:51:7
  50 │     return {
> 51 │       fetch: Effect.gen(function* () {
  52 │         const request = yield* HttpServerRequest;
  53 │         const pathname = new URL(request.originalUrl).pathname;

0.91 packages/alchemy/test/AWS/AuditManager/handler-assessment.ts:154:7
  153 │     return {
> 154 │       fetch: Effect.gen(function* () {
  155 │         const request = yield* HttpServerRequest;
  156 │         const url = new URL(request.originalUrl);
  157 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/BCMDataExports/handler.ts:97:7
   96 │     return {
>  97 │       fetch: Effect.gen(function* () {
   98 │         const request = yield* HttpServerRequest;
   99 │         const url = new URL(request.originalUrl);
  100 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/Batch/handler.ts:109:7
  108 │     return {
> 109 │       fetch: Effect.gen(function* () {
  110 │         const request = yield* HttpServerRequest;
  111 │         const url = new URL(request.originalUrl);
  112 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/Budgets/handler.ts:126:9
  123 │         const url = new URL(request.originalUrl);
  124 │         const pathname = url.pathname;
  125 │
> 126 │         if (request.method === "GET" && pathname === "/bindings") {
  127 │           return yield* HttpServerResponse.json({
  128 │             bound: Object.keys(bound),
  129 │           });
  130 │         }

0.91 packages/alchemy/test/AWS/CloudMap/handler.ts:91:7
  88 │     const ServiceName = yield* service.serviceName;
  89 │
  90 │     return {
> 91 │       fetch: Effect.gen(function* () {
  92 │         const request = yield* HttpServerRequest;
  93 │         const url = new URL(request.originalUrl);
  94 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:61:7
  58 │     const generateQuery = yield* CloudTrail.GenerateQuery(store);
  59 │
  60 │     return {
> 61 │       fetch: Effect.gen(function* () {
  62 │         const request = yield* HttpServerRequest;
  63 │         const url = new URL(request.originalUrl);
  64 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/CodeBuild/handler.ts:162:9
  160 │     return {
  161 │       fetch: Effect.gen(function* () {
> 162 │         const request = yield* HttpServerRequest;
  163 │         const url = new URL(request.originalUrl);
  164 │         const pathname = url.pathname;
  165 │         const route = `${request.method} ${pathname}`;

0.91 packages/alchemy/test/AWS/DSQL/fixtures/direct-handler.ts:78:9
  75 │         // socket, CREATE TABLE / INSERT / SELECT. The pool is built on the
  76 │         // per-event scope (`Layer.build` + ambient request Scope), so it is
  77 │         // closed when the invocation settles.
> 78 │         if (request.method === "POST" && pathname === "/roundtrip") {
  79 │           const info = yield* conn;
  80 │           // Plain `PgClient` over the DSQL URL (`sslmode=require`): DSQL
  81 │           // routes on TLS SNI, which `@effect/sql-pg` ≥ rc.115 sends for
  82 │           // DNS hosts by default (Effect-TS/effect#8174).
  83 │           const ctx = yield* Layer.build(PgClient.layer({ url: info.url }));
  84 │           const sqlClient = Context.get(ctx, PgClient.PgClient);
  85 │           // DSQL runs DDL as its own autocommit statement (no DDL+DML
  86 │           // transactions) — each call below is a separate statement.
  87 │           yield* sqlClient`CREATE TABLE IF NOT EXISTS dsql_direct_widgets (id integer PRIMARY KEY, title text NOT NULL)`;
  88 │           yield* sqlClient`DELETE FROM dsql_direct_widgets WHERE id = 1`;
  89 │           yield* sqlClient`INSERT INTO dsql_direct_widgets (id, title) VALUES (1, 'direct')`;
  90 │           const rows =
  91 │             yield* sqlClient`SELECT id, title FROM dsql_direct_widgets WHERE id = 1`;
  92 │           return yield* HttpServerResponse.json({ rows, host: info.host });
  93 │         }

0.91 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:78:11
  70 │         if (request.method === "GET" && pathname === "/snapshot") {
  71 │           const name = url.searchParams.get("name");
  72 │           if (!name) {
  73 │             return yield* HttpServerResponse.json(
  74 │               { error: "name query parameter is required" },
  75 │               { status: 400 },
  76 │             );
  77 │           }
> 78 │           const result = yield* createSnapshot({ snapshotName: name });
  79 │           return yield* HttpServerResponse.json({
  80 │             snapshotArn: result.snapshot.snapshotArn,
  81 │             status: result.snapshot.status,
  82 │           });
  83 │         }

0.91 packages/alchemy/test/AWS/DynamoDB/sink-handler.ts:60:9
> 60 │         if (request.method === "POST" && pathname === "/sink") {

0.91 packages/alchemy/test/AWS/EFS/bindings-handler.ts:71:7
  70 │     return {
> 71 │       fetch: Effect.gen(function* () {
  72 │         const request = yield* HttpServerRequest;
  73 │         const url = new URL(request.originalUrl);
  74 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/EKS/handler.ts:46:7
  45 │     return {
> 46 │       fetch: Effect.gen(function* () {
  47 │         const request = yield* HttpServerRequest;
  48 │         const url = new URL(request.originalUrl);
  49 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/FSx/bindings-handler.ts:90:7
  89 │     return {
> 90 │       fetch: Effect.gen(function* () {
  91 │         const request = yield* HttpServerRequest;
  92 │         const url = new URL(request.originalUrl);
  93 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/GreengrassV2/handler.ts:214:11
  212 │         // Account-level list, must include the fixture's component.
  213 │         if (request.method === "GET" && pathname === "/components") {
> 214 │           const { components } = yield* listComponents({ scope: "PRIVATE" });
  215 │           return yield* HttpServerResponse.json({
  216 │             names: (components ?? []).flatMap((c) =>
  217 │               c.componentName === undefined ? [] : [c.componentName],
  218 │             ),
  219 │           });
  220 │         }

0.91 packages/alchemy/test/AWS/IVS/fixtures/handler.ts:75:7
  74 │     return {
> 75 │       fetch: Effect.gen(function* () {
  76 │         const request = yield* HttpServerRequest;
  77 │         const url = new URL(request.originalUrl);
  78 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:56:7
  53 │     const RoomArn = yield* room.roomArn;
  54 │
  55 │     return {
> 56 │       fetch: Effect.gen(function* () {
  57 │         const request = yield* HttpServerRequest;
  58 │         const pathname = new URL(request.originalUrl).pathname;

0.91 packages/alchemy/test/AWS/Inspector2/handler.ts:181:9
  179 │         // Findings — works whether or not Inspector scanning is enabled
  180 │         // (an un-enabled account just has none).
> 181 │         if (request.method === "GET" && pathname === "/findings") {
  182 │           const result = yield* errorTagged(
  183 │             listFindings({ maxResults: 10 }).pipe(
  184 │               Effect.map((r) => ({ count: (r.findings ?? []).length })),
  185 │             ),
  186 │           );
  187 │           return yield* HttpServerResponse.json(result);
  188 │         }

0.91 packages/alchemy/test/AWS/IoTWireless/fixtures/handler.ts:201:9
> 201 │         if (request.method === "POST" && pathname === "/device-stats") {
  202 │           const stats = yield* getDeviceStats();
  203 │           return yield* HttpServerResponse.json({
  204 │             wirelessDeviceId: stats.WirelessDeviceId ?? null,
  205 │             lastUplinkReceivedAt: stats.LastUplinkReceivedAt ?? null,
  206 │           });
  207 │         }

0.91 packages/alchemy/test/AWS/Macie2/handler.ts:128:9
  125 │         const url = new URL(request.originalUrl);
  126 │         const pathname = url.pathname;
  127 │
> 128 │         if (request.method === "GET" && pathname === "/bindings") {
  129 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  130 │         }

0.91 packages/alchemy/test/AWS/MailManager/handler.ts:63:7
  62 │     return {
> 63 │       fetch: Effect.gen(function* () {
  64 │         const request = yield* HttpServerRequest;
  65 │         const url = new URL(request.originalUrl);
  66 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/MediaLive/fixtures/handler.ts:59:9
  56 │         const url = new URL(request.originalUrl);
  57 │         const pathname = url.pathname;
  58 │
> 59 │         if (request.method === "GET" && pathname === "/bindings") {
  60 │           return yield* HttpServerResponse.json({
  61 │             bound: Object.keys(bound),
  62 │           });
  63 │         }

0.91 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:53:9
> 53 │         if (request.method === "GET" && pathname === "/contact") {
  54 │           const result = yield* getContact();
  55 │           // name/address are sensitive — assert on shape/status only.
  56 │           return yield* HttpServerResponse.json({
  57 │             arn: result.emailContact.arn,
  58 │             status: result.emailContact.status,
  59 │           });
  60 │         }

0.91 packages/alchemy/test/AWS/RAM/handler.ts:80:7
  79 │     return {
> 80 │       fetch: Effect.gen(function* () {
  81 │         const request = yield* HttpServerRequest;
  82 │         const url = new URL(request.originalUrl);
  83 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/RDSData/handler.ts:67:7
  64 │     const ClusterArn = yield* cluster.dbClusterArn;
  65 │
  66 │     return {
> 67 │       fetch: Effect.gen(function* () {
  68 │         const request = yield* HttpServerRequest;
  69 │         const url = new URL(request.originalUrl);
  70 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/RePostSpace/bindings-handler.ts:73:7
  72 │     return {
> 73 │       fetch: Effect.gen(function* () {
  74 │         const request = yield* HttpServerRequest;
  75 │         const url = new URL(request.originalUrl);
  76 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/RedshiftServerless/fixtures/connect-handler.ts:49:11
  40 │     return {
  41 │       fetch: Effect.gen(function* () {
  42 │         const request = yield* HttpServerRequest;
  43 │         const url = new URL(request.originalUrl);
  44 │         const pathname = url.pathname;
  45 │
  46 │         if (request.method === "GET" && pathname === "/info") {
  47 │           // Mints fresh temporary credentials via
  48 │           // redshift-serverless:GetCredentials on every request.
> 49 │           const info = yield* connect;
  50 │           return yield* HttpServerResponse.json({
  51 │             host: info.host,
  52 │             port: info.port,
  53 │             database: info.database,
  54 │             username: info.username,
  55 │             hasPassword: info.password !== undefined,
  56 │             ssl: info.ssl,
  57 │             urlScheme: Redacted.value(info.url).split("://")[0],
  58 │             expiresInFuture:
  59 │               info.expiration !== undefined &&
  60 │               info.expiration.getTime() > Date.now(),
  61 │           });
  62 │         }
  63 │
  64 │         return yield* HttpServerResponse.json(
  65 │           { error: "Not found", method: request.method, pathname },
  66 │           { status: 404 },
  67 │         );
  68 │       }).pipe(Effect.orDie),
  69 │     };

0.91 packages/alchemy/test/AWS/RedshiftServerless/fixtures/query-handler.ts:46:9
  40 │     return {
  41 │       fetch: Effect.gen(function* () {
  42 │         const request = yield* HttpServerRequest;
  43 │         const url = new URL(request.originalUrl);
  44 │         const pathname = url.pathname;
  45 │
> 46 │         if (request.method === "GET" && pathname === "/query") {
  47 │           const result = yield* sql.query("SELECT 1 AS n");
  48 │           return yield* HttpServerResponse.json({
  49 │             columns: (result.ColumnMetadata ?? []).map((c) => c.name),
  50 │             records: result.Records,
  51 │             totalNumRows: result.TotalNumRows,
  52 │           });
  53 │         }
  54 │
  55 │         return yield* HttpServerResponse.json(
  56 │           { error: "Not found", method: request.method, pathname },
  57 │           { status: 404 },
  58 │         );
  59 │       }).pipe(Effect.orDie),
  60 │     };

0.91 packages/alchemy/test/AWS/ResourceGroups/handler.ts:116:7
  115 │     return {
> 116 │       fetch: Effect.gen(function* () {
  117 │         const request = yield* HttpServerRequest;
  118 │         const url = new URL(request.originalUrl);
  119 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/Route53Resolver/handler.ts:96:7
  95 │     return {
> 96 │       fetch: Effect.gen(function* () {
  97 │         const request = yield* HttpServerRequest;
  98 │         const url = new URL(request.originalUrl);
  99 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/S3/fixtures/head-object-handler.ts:35:9
  22 │     return {
  23 │       fetch: Effect.gen(function* () {
  24 │         const request = yield* HttpServerRequest;
  25 │         const url = yield* Effect.sync(() => new URL(request.originalUrl));
  26 │         if (url.pathname === "/info") {
  27 │           return yield* HttpServerResponse.json({
  28 │             bucketName: yield* bucketName,
  29 │             bucketArn: yield* bucketArn,
  30 │           });
  31 │         }
  32 │         const key = url.searchParams.get("key");
  33 │         if (!key)
  34 │           return HttpServerResponse.text("Missing key", { status: 400 });
> 35 │         return yield* headObject({
  36 │           Key: key,
  37 │           VersionId: url.searchParams.get("versionId") ?? undefined,
  38 │         }).pipe(
  39 │           Effect.flatMap((result) =>
  40 │             HttpServerResponse.json({
  41 │               contentLength: result.ContentLength,
  42 │               contentType: result.ContentType,
  43 │               versionId: result.VersionId,
  44 │             }),
  45 │           ),
  46 │           Effect.catchTag("NotFound", () =>
  47 │             HttpServerResponse.json({ tag: "NotFound" }, { status: 404 }),
  48 │           ),
  49 │         );
  50 │       }).pipe(Effect.orDie),
  51 │     };

0.91 packages/alchemy/test/AWS/S3Control/fixtures/mrap-bindings-handler.ts:49:7
  48 │     return {
> 49 │       fetch: Effect.gen(function* () {
  50 │         const request = yield* HttpServerRequest;
  51 │         const url = new URL(request.originalUrl);
  52 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/S3Tables/bindings-handler.ts:62:7
  61 │     return {
> 62 │       fetch: Effect.gen(function* () {
  63 │         const request = yield* HttpServerRequest;
  64 │         const url = new URL(request.originalUrl);
  65 │         const pathname = url.pathname;

0.91 packages/alchemy/test/AWS/Signer/handler.ts:107:5
> 107 │     const startSigningJob = yield* Signer.StartSigningJob(profile);
  108 │     const signPayload = yield* Signer.SignPayload(notationProfile);
  109 │     const revokeSigningProfile =
  110 │       yield* Signer.RevokeSigningProfile(notationProfile);

0.91 packages/alchemy/test/AWS/Textract/handler.ts:113:9
> 113 │         if (request.method === "POST" && pathname === "/seed") {
  114 │           yield* putObject({
  115 │             Key: INPUT_KEY,
  116 │             Body: pngBytes,
  117 │             ContentType: "image/png",
  118 │           });
  119 │           return yield* HttpServerResponse.json({ seeded: true });
  120 │         }

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:164:5
  148 │ export default {
  149 │   async fetch(
  150 │     request: Request,
  151 │     env: { UpgradeObject: DurableObjectNamespace<UpgradeObject> },
  152 │   ) {
  153 │     if (
  154 │       request.headers.get("x-alarm-worker-version") !== null &&
  155 │       request.headers.get("x-alarm-worker-version") !== "v1"
  156 │     ) {
  157 │       return new Response("Alarm worker version mismatch", {
  158 │         status: 409,
  159 │         headers: { "x-alarm-worker-version": "v1" },
  160 │       });
  161 │     }
  162 │     const url = new URL(request.url);
  163 │     const name = url.searchParams.get("name") ?? "persisted-object";
> 164 │     const object = env.UpgradeObject.getByName(name);
  165 │     const path = url.pathname;
  166 │     if (path === "/seed" && request.method === "POST") {
  167 │       return Response.json(await object.seed(name === "persisted-object"));
  168 │     }
  169 │     if (path === "/snapshot") {
  170 │       return Response.json(await object.snapshot());
  171 │     }
  172 │     return new Response("Not Found", { status: 404 });
  173 │   },
  174 │ };

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:243:11
  240 │         const url = new URL(request.url, "http://localhost");
  241 │         const action = url.pathname.slice(1);
  242 │         const object = objects.getByName(
> 243 │           url.searchParams.get("name") ?? "persisted-object",
  244 │         );

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:530:9
> 530 │         return HttpServerResponse.text("Not Found", { status: 404 });
  531 │       }).pipe(

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-pause/worker.ts:27:11
  15 │     return {
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │
  19 │         if (request.url.startsWith("/workflow/start/")) {
  20 │           const value = request.url.split("/workflow/start/")[1] ?? "world";
  21 │           const instance = yield* workflow.create({ params: { value } });
  22 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  23 │         }
  24 │
  25 │         if (request.url.startsWith("/workflow/pause/")) {
  26 │           const instanceId = request.url.split("/workflow/pause/")[1] ?? "";
> 27 │           const instance = yield* workflow.get(instanceId);
  28 │           yield* instance.pause();
  29 │           return yield* HttpServerResponse.json({ ok: true });
  30 │         }
  31 │
  32 │         if (request.url.startsWith("/workflow/status/")) {
  33 │           const instanceId = request.url.split("/workflow/status/")[1] ?? "";
  34 │           const instance = yield* workflow.get(instanceId);
  35 │           const status = yield* instance.status();
  36 │           return yield* HttpServerResponse.json(status);
  37 │         }
  38 │
  39 │         return HttpServerResponse.text("ok");
  40 │       }),
  41 │     };

0.91 packages/alchemy/test/Neon/fixtures/function-events.ts:70:9
  56 │     return {
  57 │       fetch: Effect.gen(function* () {
  58 │         const request = yield* HttpServerRequest;
  59 │         const path = new URL(request.url, "https://function.test").pathname;
  60 │         yield* prepare.pipe(Effect.orDie);
  61 │         if (path === "/upload") {
  62 │           yield* files.put("incoming/test.txt", "uploaded").pipe(Effect.orDie);
  63 │           yield* files.put("outside.txt", "not-matched").pipe(Effect.orDie);
  64 │           return HttpServerResponse.empty({ status: 204 });
  65 │         }
  66 │         const events =
  67 │           yield* sql`SELECT id, kind, object_key FROM alchemy_function_events ORDER BY id`.pipe(
  68 │             Effect.orDie,
  69 │           );
> 70 │         return yield* HttpServerResponse.json(events);
  71 │       }),
  72 │     };
  73 │   }).pipe(

0.90 packages/alchemy/test/AWS/AppRegistry/handler.ts:67:7
  66 │     return {
> 67 │       fetch: Effect.gen(function* () {
  68 │         const request = yield* HttpServerRequest;
  69 │         const url = new URL(request.originalUrl);
  70 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/ApplicationAutoScaling/handler.ts:98:9
   95 │         const url = new URL(request.originalUrl);
   96 │         const pathname = url.pathname;
   97 │
>  98 │         if (request.method === "GET" && pathname === "/bindings") {
   99 │           return yield* HttpServerResponse.json({
  100 │             bound: Object.keys(bound),
  101 │           });
  102 │         }

0.90 packages/alchemy/test/AWS/Backup/handler.ts:142:11
  141 │         if (request.method === "GET" && pathname === "/list-recovery-points") {
> 142 │           const result = yield* listRecoveryPointsByBackupVault({
  143 │             MaxResults: 25,
  144 │           });
  145 │           return yield* HttpServerResponse.json({
  146 │             count: (result.RecoveryPoints ?? []).length,
  147 │           });
  148 │         }

0.90 packages/alchemy/test/AWS/CloudControl/handler.ts:163:9
> 163 │         if (request.method === "GET" && pathname === "/fixture") {
  164 │           const result = yield* getResource({
  165 │             TypeName: SSM_PARAMETER,
  166 │             Identifier: FIXTURE_PARAM,
  167 │           });
  168 │           return yield* HttpServerResponse.json({
  169 │             identifier: result.ResourceDescription?.Identifier ?? null,
  170 │             value: readValue(result.ResourceDescription) ?? null,
  171 │           });
  172 │         }

0.90 packages/alchemy/test/AWS/CodeArtifact/handler.ts:152:9
  149 │         // Delete the test package from both repositories so a retried test
  150 │         // body starts from a clean slate — republishing an already-Published
  151 │         // generic version raises the (deterministic) ConflictException.
> 152 │         if (request.method === "POST" && pathname === "/reset") {
  153 │           yield* deletePackage({
  154 │             format: FORMAT,
  155 │             namespace: NAMESPACE,
  156 │             package: PKG,
  157 │           }).pipe(
  158 │             Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  159 │           );
  160 │           yield* deleteMirrorPackage({
  161 │             format: FORMAT,
  162 │             namespace: NAMESPACE,
  163 │             package: PKG,
  164 │           }).pipe(
  165 │             Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  166 │           );
  167 │           return yield* HttpServerResponse.json({ reset: true });
  168 │         }

0.90 packages/alchemy/test/AWS/CodeDeploy/handler.ts:50:5
  47 │ export default CodeDeployTestFunction.make(
  48 │   {
  49 │     main,
> 50 │     functionUrl: true,
  51 │     // Deployment ops fan out SDK calls — AWS's 3s default intermittently
  52 │     // times out under cold starts.
  53 │     timeout: Duration.seconds(30),
  54 │   },

0.90 packages/alchemy/test/AWS/CodePipeline/handler.ts:203:11
  202 │           // ---- execution plane ----
> 203 │           case "POST /execution/start": {
  204 │             const result = yield* errorTagged(startExecution());
  205 │             return yield* HttpServerResponse.json(
  206 │               "errorTag" in result
  207 │                 ? result
  208 │                 : { executionId: result.pipelineExecutionId },
  209 │             );
  210 │           }

0.90 packages/alchemy/test/AWS/Comprehend/handler.ts:209:9
  208 │         // One route drives every single-document real-time binding.
> 209 │         if (request.method === "GET" && pathname === "/detect-all") {
  210 │           const language = yield* detectDominantLanguage({
  211 │             Text: "Bob ordered two sandwiches yesterday.",
  212 │           });

0.90 packages/alchemy/test/AWS/Config/handler.ts:122:11
  120 │           // ── Discovering resources / querying ──────────────────────────
  121 │
> 122 │           case "GET /select-resource-config": {
  123 │             const result = yield* selectResourceConfig({
  124 │               Expression:
  125 │                 "SELECT resourceId WHERE resourceType = 'AWS::S3::Bucket'",
  126 │             });
  127 │             return yield* HttpServerResponse.json({
  128 │               results: result.Results ?? [],
  129 │             });
  130 │           }

0.90 packages/alchemy/test/AWS/CostAndUsageReport/handler.ts:84:9
  81 │         const url = new URL(request.originalUrl);
  82 │         const pathname = url.pathname;
  83 │
> 84 │         if (request.method === "GET" && pathname === "/bindings") {
  85 │           return yield* HttpServerResponse.json({
  86 │             bound: Object.keys(bound),
  87 │           });
  88 │         }

0.90 packages/alchemy/test/AWS/DSQL/fixtures/drizzle-handler.ts:46:7
  45 │     return {
> 46 │       fetch: Effect.gen(function* () {
  47 │         const request = yield* HttpServerRequest;
  48 │         const url = new URL(request.originalUrl);
  49 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/ECRPublic/handler.ts:101:7
  100 │     return {
> 101 │       fetch: Effect.gen(function* () {
  102 │         const request = yield* HttpServerRequest;
  103 │         const url = new URL(request.originalUrl);
  104 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/EMR/handler.ts:31:5
  28 │ export default EmrTestFunction.make(
  29 │   {
  30 │     main,
> 31 │     functionUrl: true,
  32 │     timeout: Duration.seconds(30),
  33 │   },

0.90 packages/alchemy/test/AWS/FMS/handler.ts:165:11
  161 │         if (
  162 │           request.method === "GET" &&
  163 │           pathname === "/admin-accounts-for-organization"
  164 │         ) {
> 165 │           const result = yield* listAdminAccountsForOrganization().pipe(
  166 │             Effect.map((r) => ({
  167 │               tag: "Ok",
  168 │               count: (r.AdminAccounts ?? []).length,
  169 │             })),
  170 │             Effect.catchTag(
  171 │               ["InvalidOperationException", "ResourceNotFoundException"],
  172 │               (e) => Effect.succeed({ tag: e._tag, count: 0 }),
  173 │             ),
  174 │           );
  175 │           return yield* HttpServerResponse.json(result);
  176 │         }

0.90 packages/alchemy/test/AWS/Firehose/handler.ts:64:7
  61 │     const listDeliveryStreams = yield* AWS.Firehose.ListDeliveryStreams();
  62 │
  63 │     return {
> 64 │       fetch: Effect.gen(function* () {
  65 │         const request = yield* HttpServerRequest;
  66 │         const url = new URL(request.originalUrl);
  67 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/HealthLake/handler.ts:123:7
  120 │     const KeyArn = yield* key.keyArn;
  121 │
  122 │     return {
> 123 │       fetch: Effect.gen(function* () {
  124 │         const request = yield* HttpServerRequest;
  125 │         const url = new URL(request.originalUrl);
  126 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:111:9
> 111 │         if (request.method === "POST" && pathname === "/token") {
  112 │           const { participantToken } = yield* createParticipantToken({
  113 │             userId: TEST_USER_ID,
  114 │             capabilities: ["PUBLISH", "SUBSCRIBE"],
  115 │             // Exercises the Duration.Input -> wire minutes conversion.
  116 │             duration: "30 minutes",
  117 │             attributes: { displayName: "Alchemy" },
  118 │           });
  119 │           // The token is sensitive — assert on its shape, never echo it.
  120 │           const token = participantToken?.token;
  121 │           const tokenLength =
  122 │             token === undefined
  123 │               ? 0
  124 │               : Redacted.isRedacted(token)
  125 │                 ? Redacted.value(token).length
  126 │                 : token.length;
  127 │           return yield* HttpServerResponse.json({
  128 │             tokenLength,
  129 │             tokenIsRedacted: token !== undefined && Redacted.isRedacted(token),
  130 │             participantId: participantToken?.participantId,
  131 │             duration: participantToken?.duration,
  132 │             expirationTime: participantToken?.expirationTime,
  133 │           });
  134 │         }

0.90 packages/alchemy/test/AWS/Lambda/fixtures/microvm/orchestrator.ts:181:9
> 181 │         return HttpServerResponse.text("ok");
  182 │       }).pipe(Effect.orDie),
  183 │     };
  184 │   }).pipe(

0.90 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:38:9
  35 │         const url = new URL(request.url, "http://microvm");
  36 │         const pathname = url.pathname;
  37 │
> 38 │         if (request.method === "POST" && pathname === "/run") {
  39 │           const vm = yield* runMicrovm({
  40 │             idlePolicy: {
  41 │               maxIdleDurationSeconds: 900,
  42 │               suspendedDurationSeconds: 300,
  43 │               autoResumeEnabled: true,
  44 │             },
  45 │           });
  46 │           return yield* HttpServerResponse.json({
  47 │             microvmId: vm.microvmId,
  48 │             endpoint: vm.endpoint,
  49 │             state: vm.state,
  50 │           });
  51 │         }

0.90 packages/alchemy/test/AWS/Neptune/fixtures/handler.ts:83:7
  82 │     return {
> 83 │       fetch: Effect.gen(function* () {
  84 │         const request = yield* HttpServerRequest;
  85 │         const url = new URL(request.originalUrl);
  86 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/OSIS/handler.ts:86:7
  85 │     return {
> 86 │       fetch: Effect.gen(function* () {
  87 │         const request = yield* HttpServerRequest;
  88 │         const url = new URL(request.originalUrl);
  89 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/Omics/bindings-handler.ts:66:11
  64 │         if (request.method === "GET" && pathname === "/readsets") {
  65 │           // sequenceStoreId injection scopes the list to the bound store.
> 66 │           const response = yield* listReadSets();
  67 │           return yield* HttpServerResponse.json({
  68 │             count: (response.readSets ?? []).length,
  69 │           });
  70 │         }

0.90 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:57:11
  46 │     const net = yield* AOSS.SecurityPolicy("Net", {
  47 │       policyName: NET_POLICY,
  48 │       type: "network",
  49 │       policy: [
  50 │         {
  51 │           Rules: [
  52 │             {
  53 │               ResourceType: "collection",
  54 │               Resource: [`collection/${COLLECTION_NAME}`],
  55 │             },
  56 │           ],
> 57 │           AllowFromPublic: true,
  58 │         },
  59 │       ],
  60 │     });

0.90 packages/alchemy/test/AWS/Organizations/handler.ts:201:11
  183 │         if (request.method === "GET" && pathname === "/accounts-for-parent") {
  184 │           const result = yield* Effect.gen(function* () {
  185 │             const parent = yield* rootId;
  186 │             if (parent === undefined) {
  187 │               return { ok: false as const, tag: "NoRoot" };
  188 │             }
  189 │             const r = yield* listAccountsForParent({ ParentId: parent });
  190 │             return { ok: true as const, count: r.Accounts?.length ?? 0 };
  191 │           }).pipe(
  192 │             Effect.catchTag(
  193 │               [
  194 │                 "AccessDeniedException",
  195 │                 "AWSOrganizationsNotInUseException",
  196 │                 "ParentNotFoundException",
  197 │               ],
  198 │               (e) => Effect.succeed({ ok: false as const, tag: e._tag }),
  199 │             ),
  200 │           );
> 201 │           return yield* HttpServerResponse.json(result);
  202 │         }

0.90 packages/alchemy/test/AWS/Pricing/handler.ts:32:7
  29 │     const getPriceListFileUrl = yield* Pricing.GetPriceListFileUrl();
  30 │
  31 │     return {
> 32 │       fetch: Effect.gen(function* () {
  33 │         const request = yield* HttpServerRequest;
  34 │         const url = new URL(request.originalUrl);
  35 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/RDS/fixtures/handler.ts:75:7
  74 │     return {
> 75 │       fetch: Effect.gen(function* () {
  76 │         const request = yield* HttpServerRequest;
  77 │         const url = new URL(request.originalUrl);
  78 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/Route53/bindings-handler.ts:92:9
  89 │         const url = new URL(request.originalUrl);
  90 │         const pathname = url.pathname;
  91 │
> 92 │         if (request.method === "GET" && pathname === "/bindings") {
  93 │           return yield* HttpServerResponse.json({
  94 │             bound: Object.keys(bound),
  95 │           });
  96 │         }

0.90 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:96:7
  95 │     return {
> 96 │       fetch: Effect.gen(function* () {
  97 │         const request = yield* HttpServerRequest;
  98 │         const url = yield* Effect.sync(() => new URL(request.originalUrl));
  99 │         const pathname = url.pathname;

0.90 packages/alchemy/test/AWS/S3Control/fixtures/bindings-handler.ts:121:9
> 121 │         if (request.method === "GET" && pathname === "/access-point") {
  122 │           const live = yield* getAccessPoint();
  123 │           return yield* HttpServerResponse.json({
  124 │             name: live.Name,
  125 │             bucket: live.Bucket,
  126 │             networkOrigin: live.NetworkOrigin,
  127 │           });
  128 │         }

0.90 packages/alchemy/test/AWS/SES/handler.ts:241:11
  240 │         if (request.method === "GET" && pathname === "/account") {
> 241 │           return yield* respond(getAccount(), (account) => ({
  242 │             sendingEnabled: account.SendingEnabled,
  243 │             productionAccess: account.ProductionAccessEnabled,
  244 │             max24HourSend: account.SendQuota?.Max24HourSend,
  245 │           }));
  246 │         }

0.90 packages/alchemy/test/AWS/Transfer/workflow-handler.ts:60:11
  57 │         // Report a step state against a nonexistent workflow: proves the
  58 │         // grant + call round-trips and the rejection is a typed tag.
  59 │         if (request.method === "POST" && pathname === "/workflow-step") {
> 60 │           const sent = yield* sendWorkflowStepState({
  61 │             WorkflowId: "w-1234567890abcdef0",
  62 │             ExecutionId: "00000000-0000-0000-0000-000000000000",
  63 │             Token: "MA==",
  64 │             Status: "SUCCESS",
  65 │           }).pipe(Effect.result);
  66 │           return yield* HttpServerResponse.json(
  67 │             sent._tag === "Success"
  68 │               ? { ok: true }
  69 │               : { ok: false, tag: sent.failure._tag },
  70 │           );
  71 │         }

0.90 packages/alchemy/test/Cloudflare/Email/fixtures/worker.ts:20:9
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │         const url = new URL(request.url, "http://x");
  19 │
> 20 │         if (url.pathname === "/send") {
  21 │           const from = url.searchParams.get("from")!;
  22 │           const to = url.searchParams.get("to")!;
  23 │           const subject = url.searchParams.get("subject") ?? "alchemy test";
  24 │           const result = yield* email
  25 │             .send({
  26 │               from,
  27 │               to,
  28 │               subject,
  29 │               text: `sent at ${new Date().toISOString()}`,
  30 │             })
  31 │             .pipe(
  32 │               Effect.match({
  33 │                 onSuccess: () => ({ ok: true as const }),
  34 │                 onFailure: (err) => ({
  35 │                   ok: false as const,
  36 │                   message: err.message,
  37 │                 }),
  38 │               }),
  39 │             );
  40 │           return yield* HttpServerResponse.json(result);
  41 │         }
  42 │
  43 │         return HttpServerResponse.text("ok");
  44 │       }),

0.89 packages/alchemy/test/AWS/Account/handler.ts:50:7
  49 │     return {
> 50 │       fetch: Effect.gen(function* () {
  51 │         const request = yield* HttpServerRequest;
  52 │         const url = new URL(request.originalUrl);
  53 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:84:9
  81 │         const url = new URL(request.originalUrl);
  82 │         const pathname = url.pathname;
  83 │
> 84 │         if (request.method === "POST" && pathname === "/deploy") {
  85 │           const body = (yield* request.json) as unknown as {
  86 │             version: string;
  87 │           };
  88 │           const started = yield* startDeployment({
  89 │             ConfigurationVersion: body.version,
  90 │           });
  91 │           return yield* HttpServerResponse.json({
  92 │             deploymentNumber: started.DeploymentNumber,
  93 │             state: started.State,
  94 │           });
  95 │         }

0.89 packages/alchemy/test/AWS/B2BI/handler.ts:182:9
  180 │     return {
  181 │       fetch: Effect.gen(function* () {
> 182 │         const request = yield* HttpServerRequest;
  183 │         const url = new URL(request.originalUrl);
  184 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/BackupSearch/handler.ts:58:9
  55 │         const url = new URL(request.originalUrl);
  56 │         const pathname = url.pathname;
  57 │
> 58 │         if (request.method === "GET" && pathname === "/bindings") {
  59 │           return yield* HttpServerResponse.json({
  60 │             bound: Object.keys(bound),
  61 │           });
  62 │         }

0.89 packages/alchemy/test/AWS/CloudFormation/handler.ts:85:7
  82 │     const validateTemplate = yield* CloudFormation.ValidateTemplate();
  83 │
  84 │     return {
> 85 │       fetch: Effect.gen(function* () {
  86 │         const request = yield* HttpServerRequest;
  87 │         const url = new URL(request.originalUrl);
  88 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:79:7
  76 │     const ClientId = yield* client.clientId;
  77 │
  78 │     return {
> 79 │       fetch: Effect.gen(function* () {
  80 │         const request = yield* HttpServerRequest;
  81 │         const url = new URL(request.originalUrl);
  82 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/DataBrew/handler.ts:150:7
  149 │     return {
> 150 │       fetch: Effect.gen(function* () {
  151 │         const request = yield* HttpServerRequest;
  152 │         const url = new URL(request.originalUrl);
  153 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/DataSync/handler.ts:119:7
  118 │     return {
> 119 │       fetch: Effect.gen(function* () {
  120 │         const request = yield* HttpServerRequest;
  121 │         const url = new URL(request.originalUrl);
  122 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/DocDB/slow-handler.ts:89:7
  86 │     const db = yield* DocDB.mongo(connect);
  87 │
  88 │     return {
> 89 │       fetch: Effect.gen(function* () {
  90 │         const request = yield* HttpServerRequest;
  91 │         const url = new URL(request.originalUrl);
  92 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/DocDBElastic/handler.ts:26:5
  23 │ export default DocDBElasticTestFunction.make(
  24 │   {
  25 │     main,
> 26 │     functionUrl: true,
  27 │   },

0.89 packages/alchemy/test/AWS/Geo/handler.ts:36:7
  33 │     const getStaticMap = yield* GeoMaps.GetStaticMap();
  34 │
  35 │     return {
> 36 │       fetch: Effect.gen(function* () {
  37 │         const request = yield* HttpServerRequest;
  38 │         const pathname = new URL(request.originalUrl).pathname;

0.89 packages/alchemy/test/AWS/Kafka/kafka-handler.ts:86:7
  83 │     const ClusterArn = cluster.clusterArn;
  84 │
  85 │     return {
> 86 │       fetch: Effect.gen(function* () {
  87 │         const request = yield* HttpServerRequest;
  88 │         const url = new URL(request.originalUrl ?? request.url, "http://x");

0.89 packages/alchemy/test/AWS/Kendra/handler.ts:41:5
  38 │ export default KendraTestFunction.make(
  39 │   {
  40 │     main,
> 41 │     functionUrl: true,
  42 │     timeout: Duration.seconds(30),
  43 │   },

0.89 packages/alchemy/test/AWS/MWAA/bindings-handler.ts:192:11
  189 │         const pathname = url.pathname;
  190 │
  191 │         if (pathname === "/bindings") {
> 192 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  193 │         }

0.89 packages/alchemy/test/AWS/MWAAServerless/handler.ts:52:5
  49 │ export default MwaaServerlessTestFunction.make(
  50 │   {
  51 │     main,
> 52 │     functionUrl: true,
  53 │     timeout: Duration.seconds(30),
  54 │   },

0.89 packages/alchemy/test/AWS/MemoryDB/bindings-handler.ts:31:5
  28 │ export default MemoryDBBindingsTestFunction.make(
  29 │   {
  30 │     main,
> 31 │     functionUrl: true,
  32 │   },

0.89 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:70:7
  67 │     const GraphEndpoint = yield* graph.endpoint;
  68 │
  69 │     return {
> 70 │       fetch: Effect.gen(function* () {
  71 │         const request = yield* HttpServerRequest;
  72 │         const url = new URL(request.originalUrl);
  73 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/NetworkFirewall/firewall-handler.ts:74:7
  73 │     return {
> 74 │       fetch: Effect.gen(function* () {
  75 │         const request = yield* HttpServerRequest;
  76 │         const url = new URL(request.originalUrl);
  77 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/NetworkFirewall/handler.ts:51:7
  50 │     return {
> 51 │       fetch: Effect.gen(function* () {
  52 │         const request = yield* HttpServerRequest;
  53 │         const url = new URL(request.originalUrl);
  54 │         const pathname = url.pathname;

0.89 packages/alchemy/test/AWS/Rekognition/handler.ts:146:9
  143 │         // One route drives every synchronous image-analysis binding against
  144 │         // the embedded test image (real inferences; the image has no faces,
  145 │         // so CompareFaces surfaces its typed InvalidParameterException).
> 146 │         if (request.method === "GET" && pathname === "/analyze-image") {

0.89 packages/alchemy/test/AWS/SQS/sink-handler.ts:57:9
> 57 │         if (request.method === "POST" && pathname === "/sink") {
  58 │           const body = (yield* request.json) as { messages: string[] };
  59 │
  60 │           yield* Stream.fromIterable(body.messages).pipe(
  61 │             Stream.map((message) => ({ MessageBody: message })),
  62 │             Stream.run(sink),
  63 │           );
  64 │
  65 │           return yield* HttpServerResponse.json({
  66 │             ok: true,
  67 │             count: body.messages.length,
  68 │           });
  69 │         }

0.89 packages/alchemy/test/AWS/WAFv2/handler.ts:294:9
  292 │         // Look up the web ACL of a (nonexistent) ALB — the typed
  293 │         // WAFNonexistentItemException proves grant + wiring.
> 294 │         if (request.method === "GET" && pathname === "/waf-for-resource") {
  295 │           const ipSetArn = (yield* bound.getIPSet()).IPSet?.ARN ?? "";
  296 │           const [, , , region, account] = ipSetArn.split(":");
  297 │           const response = yield* bound
  298 │             .getWebACLForResource({
  299 │               ResourceArn: `arn:aws:elasticloadbalancing:${region}:${account}:loadbalancer/app/wafv2-bindings-missing/0123456789abcdef`,
  300 │             })
  301 │             .pipe(
  302 │               Effect.catchTag("WAFNonexistentItemException", () =>
  303 │                 Effect.succeed({ WebACL: undefined }),
  304 │               ),
  305 │             );
  306 │           return yield* HttpServerResponse.json({
  307 │             found: response.WebACL !== undefined,
  308 │           });
  309 │         }

0.89 packages/alchemy/test/AWS/XRay/handler.ts:91:9
  88 │         const pathname = url.pathname;
  89 │         const now = yield* Effect.sync(() => Date.now());
  90 │
> 91 │         if (request.method === "GET" && pathname === "/ping") {
  92 │           const functionName = yield* Effect.sync(
  93 │             () => process.env.AWS_LAMBDA_FUNCTION_NAME,
  94 │           );
  95 │           return yield* HttpServerResponse.json({ ok: true, functionName });
  96 │         }

0.89 packages/alchemy/test/Cloudflare/Website/fixtures/astro-app/src/pages/api/kv.ts:27:3
  24 │ export async function PUT({ url }: APIContext) {
  25 │   const key = url.searchParams.get("key") ?? "";
  26 │   const value = url.searchParams.get("value") ?? "";
> 27 │   await kv()?.put(key, value);
  28 │   return Response.json({ ok: true, key, value });
  29 │ }

0.89 packages/alchemy/test/Cloudflare/Website/tanstack-dev-bindings-fixture/src/routes/api.r2.ts:19:9
  10 │       GET: async ({ request }) => {
  11 │         const key = readKey(request);
  12 │         if (!key) {
  13 │           return Response.json(
  14 │             { error: "missing key", marker: env.DEV_MARKER, value: null },
  15 │             { status: 400 },
  16 │           );
  17 │         }
  18 │
> 19 │         const object = await env.BUCKET.get(key);
  20 │         return Response.json({
  21 │           marker: env.DEV_MARKER,
  22 │           value: object ? await object.text() : null,
  23 │         });
  24 │       },

0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/worker.ts:29:9
  26 │         if (!id || !operation) {
  27 │           return HttpServerResponse.text("Not Found", { status: 404 });
  28 │         }
> 29 │         const object = objects.getByName(id);
  30 │         if (request.method === "GET" && operation === "snapshot") {
  31 │           return yield* HttpServerResponse.json(yield* object.snapshot());
  32 │         }

0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/hibernating-websocket/worker.ts:261:11
  251 │ export default class AttachmentWorker extends Worker<AttachmentWorker>()(
  252 │   "AttachmentWorker",
  253 │   { main: import.meta.url },
  254 │   Effect.gen(function* () {
  255 │     const objects = yield* AttachmentObject;
  256 │     return {
  257 │       fetch: Effect.gen(function* () {
  258 │         const request = yield* HttpServerRequest;
  259 │         if (request.url.startsWith("/socket/")) {
  260 │           const name = request.url.split("/").pop()!;
> 261 │           return yield* objects.getByName(name).fetch(request);
  262 │         }
  263 │         return HttpServerResponse.text("ready");
  264 │       }),
  265 │     };
  266 │   }),
  267 │ ) {}

0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/worker.ts:23:9
  20 │       fetch: Effect.gen(function* () {
  21 │         const request = yield* HttpServerRequest;
  22 │         const url = new URL(request.url, "http://fixture");
> 23 │         const name = url.searchParams.get("name") ?? "default";
  24 │         const route = `${request.method} ${url.pathname}`;

0.88 packages/alchemy/test/AWS/AppSync/fixtures/bindings-handler.ts:90:9
   87 │         const request = yield* HttpServerRequest;
   88 │         const pathname = new URL(request.originalUrl).pathname;
   89 │
>  90 │         if (request.method === "POST" && pathname === "/graphql") {
   91 │           const body = (yield* request.json) as unknown as {
   92 │             query: string;
   93 │             variables?: Record<string, unknown>;
   94 │           };
   95 │           const result = yield* graphql.execute({
   96 │             query: body.query,
   97 │             variables: body.variables,
   98 │           });
   99 │           return yield* HttpServerResponse.json(result);
  100 │         }

0.88 packages/alchemy/test/AWS/ApplicationSignals/handler.ts:141:9
  138 │         const url = new URL(request.originalUrl);
  139 │         const pathname = url.pathname;
  140 │
> 141 │         if (request.method === "GET" && pathname === "/bindings") {
  142 │           return yield* HttpServerResponse.json({
  143 │             bound: Object.keys(bound),
  144 │           });
  145 │         }

0.88 packages/alchemy/test/AWS/ControlTower/handler.ts:68:9
  65 │         const url = new URL(request.originalUrl);
  66 │         const pathname = url.pathname;
  67 │
> 68 │         if (request.method === "GET" && pathname === "/bindings") {
  69 │           return yield* HttpServerResponse.json({
  70 │             bound: Object.keys(bound),
  71 │           });
  72 │         }

0.88 packages/alchemy/test/AWS/DAX/handler.ts:35:7
  34 │     return {
> 35 │       fetch: Effect.gen(function* () {
  36 │         const request = yield* HttpServerRequest;
  37 │         const url = new URL(request.originalUrl);
  38 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/DataZone/handler.ts:124:7
  123 │     return {
> 124 │       fetch: Effect.gen(function* () {
  125 │         const request = yield* HttpServerRequest;
  126 │         const url = new URL(request.originalUrl);
  127 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/EntityResolution/handler.ts:269:9
  267 │         // Drives GetMatchingJob + GetIdMappingJob through their typed
  268 │         // ResourceNotFoundException path (an IAM gap would be a 500).
> 269 │         if (request.method === "GET" && pathname === "/jobs/not-found") {
  270 │           const matching = yield* getMatchingJob({ jobId: BOGUS_JOB_ID }).pipe(
  271 │             Effect.map(() => "Found"),
  272 │             Effect.catchTag("ResourceNotFoundException", (e) =>
  273 │               Effect.succeed(e._tag),
  274 │             ),
  275 │           );
  276 │           const idMapping = yield* getIdMappingJob({
  277 │             jobId: BOGUS_JOB_ID,
  278 │           }).pipe(
  279 │             Effect.map(() => "Found"),
  280 │             Effect.catchTag("ResourceNotFoundException", (e) =>
  281 │               Effect.succeed(e._tag),
  282 │             ),
  283 │           );
  284 │           return yield* HttpServerResponse.json({ matching, idMapping });
  285 │         }

0.88 packages/alchemy/test/AWS/EventBridge/handler.ts:200:11
  199 │         if (request.method === "GET" && pathname === "/event-buses") {
> 200 │           // ListEventBuses is account-level; the default bus always exists.
  201 │           const result = yield* listEventBuses();
  202 │           return yield* HttpServerResponse.json({
  203 │             names: (result.EventBuses ?? []).flatMap((b) =>
  204 │               b.Name ? [b.Name] : [],
  205 │             ),
  206 │           });
  207 │         }

0.88 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:97:7
   96 │     return {
>  97 │       fetch: Effect.gen(function* () {
   98 │         const request = yield* HttpServerRequest;
   99 │         const url = new URL(request.originalUrl);
  100 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/LakeFormation/handler.ts:87:9
  84 │         const url = new URL(request.originalUrl);
  85 │         const pathname = url.pathname;
  86 │
> 87 │         if (request.method === "GET" && pathname === "/bindings") {
  88 │           return yield* HttpServerResponse.json({
  89 │             bound: Object.keys(bound),
  90 │           });
  91 │         }

0.88 packages/alchemy/test/AWS/MediaLive/fixtures/channel-handler.ts:141:7
  140 │     return {
> 141 │       fetch: Effect.gen(function* () {
  142 │         const request = yield* HttpServerRequest;
  143 │         const url = new URL(request.originalUrl);
  144 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/MedicalImaging/handler.ts:147:9
  145 │         // StartDICOMImportJob — proves datastoreId + dataAccessRoleArn
  146 │         // injection and the iam:PassRole grant.
> 147 │         if (request.method === "GET" && pathname === "/import") {
  148 │           const clientToken = yield* Effect.sync(() => crypto.randomUUID());
  149 │           const result = yield* errorTagged(
  150 │             startImport({
  151 │               clientToken,
  152 │               inputS3Uri: `s3://${bucketName}/${IMPORT_PREFIX}`,
  153 │               outputS3Uri: `s3://${bucketName}/dicom-output/`,
  154 │             }),
  155 │           );
  156 │           return yield* HttpServerResponse.json(
  157 │             "errorTag" in result
  158 │               ? result
  159 │               : { jobId: result.jobId, status: result.jobStatus },
  160 │           );
  161 │         }

0.88 packages/alchemy/test/AWS/Notifications/handler.ts:85:7
  84 │     return {
> 85 │       fetch: Effect.gen(function* () {
  86 │         const request = yield* HttpServerRequest;
  87 │         const url = new URL(request.originalUrl);
  88 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/OAM/handler.ts:45:9
  32 │     return {
  33 │       fetch: Effect.gen(function* () {
  34 │         const request = yield* HttpServerRequest;
  35 │         const url = new URL(request.originalUrl);
  36 │         const pathname = url.pathname;
  37 │
  38 │         if (request.method === "GET" && pathname === "/bindings") {
  39 │           return yield* HttpServerResponse.json({
  40 │             bound: Object.keys(bound),
  41 │           });
  42 │         }
  43 │
  44 │         // Sink-scoped list: the SinkIdentifier is injected from the binding.
> 45 │         if (request.method === "GET" && pathname === "/attached-links") {
  46 │           const { Items } = yield* listAttachedLinks();
  47 │           return yield* HttpServerResponse.json({
  48 │             count: Items.length,
  49 │             linkArns: Items.map((item) => item.LinkArn),
  50 │           });
  51 │         }
  52 │
  53 │         return yield* HttpServerResponse.json(
  54 │           { error: "Not found", method: request.method, pathname },
  55 │           { status: 404 },
  56 │         );
  57 │       }).pipe(Effect.orDie),
  58 │     };

0.88 packages/alchemy/test/AWS/OpenSearch/data-plane-handler.ts:47:7
  44 │     const bound = { reader, writer, client };
  45 │
  46 │     return {
> 47 │       fetch: Effect.gen(function* () {
  48 │         const request = yield* HttpServerRequest;
  49 │         const url = new URL(request.originalUrl);
  50 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/QApps/bindings-handler.ts:89:7
  88 │     return {
> 89 │       fetch: Effect.gen(function* () {
  90 │         const request = yield* HttpServerRequest;
  91 │         const url = new URL(request.originalUrl ?? request.url, "http://x");
  92 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/QBusiness/handler.ts:169:11
  166 │         const pathname = url.pathname;
  167 │
  168 │         if (pathname === "/bindings") {
> 169 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  170 │         }

0.88 packages/alchemy/test/AWS/Rbin/handler.ts:43:9
  40 │         const url = new URL(request.originalUrl);
  41 │         const pathname = url.pathname;
  42 │
> 43 │         if (request.method === "GET" && pathname === "/bindings") {
  44 │           return yield* HttpServerResponse.json({
  45 │             bound: Object.keys(bound),
  46 │           });
  47 │         }

0.88 packages/alchemy/test/AWS/Transfer/handler.ts:96:7
  95 │     return {
> 96 │       fetch: Effect.gen(function* () {
  97 │         const request = yield* HttpServerRequest;
  98 │         const url = new URL(request.originalUrl);
  99 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/Translate/handler.ts:121:7
  118 │     const putObject = yield* S3.PutObject(bucket);
  119 │
  120 │     return {
> 121 │       fetch: Effect.gen(function* () {
  122 │         const request = yield* HttpServerRequest;
  123 │         const url = new URL(request.originalUrl);
  124 │         const pathname = url.pathname;

0.88 packages/alchemy/test/AWS/VpcLattice/handler.ts:36:7
  33 │     const bound = { deregisterTargets, listTargets, registerTargets };
  34 │
  35 │     return {
> 36 │       fetch: Effect.gen(function* () {
  37 │         const request = yield* HttpServerRequest;
  38 │         const url = new URL(request.originalUrl);
  39 │         const pathname = url.pathname;

0.88 packages/alchemy/test/Cloudflare/AI/fixtures/ChatPersistenceWorker.ts:25:11
   7 │ export default class ChatPersistenceTestWorker extends Cloudflare.Worker<ChatPersistenceTestWorker>()(
   8 │   "ChatPersistenceTestWorker",
   9 │   {
  10 │     main: import.meta.url,
  11 │   },
  12 │   Effect.gen(function* () {
  13 │     // Yielding the inline DO hosts it on this Worker and hands back the
  14 │     // namespace handle.
  15 │     const chats = yield* ChatBackend;
  16 │
  17 │     return {
  18 │       fetch: Effect.gen(function* () {
  19 │         const request = yield* HttpServerRequest;
  20 │         const url = new URL(request.url, "http://worker");
  21 │         const id = url.searchParams.get("id") ?? "default";
  22 │         const prompt = url.searchParams.get("prompt") ?? "Say pong.";
  23 │
  24 │         if (url.pathname === "/chat") {
> 25 │           const result = yield* chats.getByName(id).send(id, prompt);
  26 │           return yield* HttpServerResponse.json(result);
  27 │         }
  28 │
  29 │         return HttpServerResponse.text("ok");
  30 │       }),
  31 │     };
  32 │   }),
  33 │ ) {}

0.88 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:34:9
  29 │     return {
  30 │       fetch: Effect.gen(function* () {
  31 │         const request = yield* HttpServerRequest;
  32 │         const url = new URL(request.url, "http://x");
  33 │
> 34 │         if (url.pathname === "/send") {
  35 │           const from = url.searchParams.get("from")!;
  36 │           const to = url.searchParams.get("to")!;
  37 │           const result = yield* email
  38 │             .send({
  39 │               from,
  40 │               to,
  41 │               subject: "alchemy dev remote send_email test",
  42 │               text: `sent at ${new Date().toISOString()}`,
  43 │             })
  44 │             .pipe(
  45 │               Effect.match({
  46 │                 onSuccess: () => ({ ok: true as const }),
  47 │                 onFailure: (err) => ({
  48 │                   ok: false as const,
  49 │                   message: err.message,
  50 │                 }),
  51 │               }),
  52 │             );
  53 │           return yield* HttpServerResponse.json(result);
  54 │         }
  55 │
  56 │         return HttpServerResponse.text("ok");
  57 │       }),
  58 │     };

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/worker.ts:44:11
  42 │         // Observe native option access while performing real Durable Object RPCs.
  43 │         if (request.method === "GET" && url.pathname === "/colo") {
> 44 │           const name = url.searchParams.get("name") ?? "default";
  45 │           // Match the query param against the hints Cloudflare accepts rather
  46 │           // than casting it — an unrecognised one is dropped, so a typo in a
  47 │           // test reads as "no hint" instead of reaching the runtime.
  48 │           const hint = LOCATION_HINTS.find(
  49 │             (candidate) => candidate === url.searchParams.get("hint"),
  50 │           );
  51 │           let locationHintRead = false;
  52 │           const object = objects.getByName(
  53 │             name,
  54 │             hint
  55 │               ? {
  56 │                   get locationHint() {
  57 │                     locationHintRead = true;
  58 │                     return hint;
  59 │                   },
  60 │                 }
  61 │               : undefined,
  62 │           );
  63 │           const id = yield* object.identity().pipe(Effect.orDie);
  64 │           const colo = yield* object.colo().pipe(Effect.orDie);
  65 │           return yield* HttpServerResponse.json({ id, colo, locationHintRead });
  66 │         }

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/workerC.ts:29:9
  23 │   Effect.gen(function* () {
  24 │     const counter = yield* Counter.from(WorkerC);
  25 │
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
> 29 │         const key = request.headers["x-counter-key"] ?? "default";
  30 │         const stub = counter.getByName(key);
  31 │         const url = new URL(request.url, "http://x");
  32 │
  33 │         if (request.method === "POST" && url.pathname === "/reset") {
  34 │           yield* stub.reset(key);
  35 │           return yield* HttpServerResponse.json({ ok: true });
  36 │         }
  37 │
  38 │         if (request.method === "POST" && url.pathname === "/do/increment") {
  39 │           const value = yield* stub.incrementDO();
  40 │           return yield* HttpServerResponse.json({ value });
  41 │         }
  42 │
  43 │         if (request.method === "GET" && url.pathname === "/do") {
  44 │           const value = yield* stub.getDO();
  45 │           return yield* HttpServerResponse.json({ value });
  46 │         }
  47 │
  48 │         return HttpServerResponse.text("Not Found", { status: 404 });
  49 │       }),
  50 │     };
  51 │   }).pipe(

0.87 packages/alchemy/test/AWS/ACM/handler.ts:90:7
  89 │     return {
> 90 │       fetch: Effect.gen(function* () {
  91 │         const request = yield* HttpServerRequest;
  92 │         const url = new URL(request.originalUrl);
  93 │         const pathname = url.pathname;

0.87 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:161:9
  158 │         const url = new URL(request.originalUrl);
  159 │         const pathname = url.pathname;
  160 │
> 161 │         if (request.method === "GET" && pathname === "/bindings") {
  162 │           return yield* HttpServerResponse.json({
  163 │             bound: Object.keys(bound),
  164 │           });
  165 │         }

0.87 packages/alchemy/test/AWS/CloudWatch/handler.ts:343:11
  342 │         if (
> 343 │           request.method === "GET" &&
  344 │           pathname === "/get-insight-rule-report"
  345 │         ) {
  346 │           const now = yield* Effect.sync(() => Date.now());
  347 │           const result = yield* getInsightRuleReport({
  348 │             StartTime: new Date(now - 3_600_000),
  349 │             EndTime: new Date(now),
  350 │             Period: 300,
  351 │           });
  352 │           return yield* HttpServerResponse.json({
  353 │             ok: true,
  354 │             aggregationStatistic: result.AggregationStatistic,
  355 │             contributors: result.Contributors ?? [],
  356 │           });
  357 │         }

0.87 packages/alchemy/test/AWS/DLM/handler.ts:63:9
  60 │         const url = new URL(request.originalUrl);
  61 │         const pathname = url.pathname;
  62 │
> 63 │         if (request.method === "GET" && pathname === "/bindings") {
  64 │           return yield* HttpServerResponse.json({
  65 │             bound: Object.keys(bound),
  66 │           });
  67 │         }

0.87 packages/alchemy/test/AWS/DMS/handler.ts:101:9
> 101 │         if (request.method === "GET" && pathname === "/schemas") {
  102 │           // The fixture endpoint has never had a schema refresh (that needs
  103 │           // a replication instance), so DMS answers with a typed fault —
  104 │           // which still proves ARN injection + the IAM grant end-to-end (a
  105 │           // grant gap would surface AccessDeniedException and 500 the
  106 │           // route).
  107 │           const result = yield* describeSchemas().pipe(
  108 │             Effect.map((response) => ({
  109 │               schemas: response.Schemas ?? [],
  110 │               fault: null as string | null,
  111 │             })),
  112 │             Effect.catchTag(
  113 │               ["ResourceNotFoundFault", "InvalidResourceStateFault"],
  114 │               (error) =>
  115 │                 Effect.succeed({ schemas: [], fault: error._tag as string }),
  116 │             ),
  117 │           );
  118 │           return yield* HttpServerResponse.json(result);
  119 │         }

0.87 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:76:5
  73 │ const ProvisionedCacheDataPlaneLive = ProvisionedCacheDataPlaneFunction.make(
  74 │   Effect.succeed({
  75 │     main: import.meta.url,
> 76 │     functionUrl: true,
  77 │     timeout: Duration.seconds(30),
  78 │     memorySize: 256,
  79 │   }),

0.87 packages/alchemy/test/AWS/InternetMonitor/handler.ts:60:7
  59 │     return {
> 60 │       fetch: Effect.gen(function* () {
  61 │         const request = yield* HttpServerRequest;
  62 │         const url = new URL(request.originalUrl);
  63 │         const pathname = url.pathname;

0.87 packages/alchemy/test/AWS/Keyspaces/streams-handler.ts:49:9
  46 │         // Traverse the table's CDC stream end-to-end: list streams →
  47 │         // describe the latest → obtain a TRIM_HORIZON iterator on the first
  48 │         // shard → read records (an idle table legitimately returns none).
> 49 │         if (request.method === "GET" && pathname === "/traverse") {
  50 │           const listed = yield* streams.listStreams();

0.87 packages/alchemy/test/AWS/Lambda/bindings-handler.ts:20:5
  17 │ export default LambdaBindingsTestFunction.make(
  18 │   {
  19 │     main,
> 20 │     functionUrl: true,
  21 │     // Resolve distilled from `src/*.ts` (the `bun` export condition — same
  22 │     // as vitest) so distilled source changes are test-visible in the
  23 │     // deployed bundle without a `lib/` rebuild.
  24 │     build: {
  25 │       resolve: { conditionNames: ["bun", "import", "module", "default"] },
  26 │     },
  27 │   },

0.87 packages/alchemy/test/AWS/SQS/handler.ts:91:9
>  91 │         if (request.method === "POST" && pathname === "/send") {
   92 │           const body = (yield* request.json) as unknown as {
   93 │             messageBody: string;
   94 │           };
   95 │           const result = yield* sendMessage({
   96 │             MessageBody: body.messageBody,
   97 │           });
   98 │           return yield* HttpServerResponse.json({
   99 │             messageId: result.MessageId,
  100 │           });
  101 │         }

0.87 packages/alchemy/test/Cloudflare/Container/fixtures/restart/worker.ts:27:9
  24 │       fetch: Effect.gen(function* () {
  25 │         const request = yield* HttpServerRequest;
  26 │         const url = new URL(request.url, "http://x");
> 27 │         const name = url.searchParams.get("name") ?? "default";
  28 │         const object = objects.getByName(name);
  29 │
  30 │         if (url.pathname === "/ping") {
  31 │           const pong = yield* object.ping();
  32 │           return HttpServerResponse.text(pong);
  33 │         }
  34 │         if (url.pathname === "/running") {
  35 │           const running = yield* object.running();
  36 │           return yield* HttpServerResponse.json({ running });
  37 │         }
  38 │         if (url.pathname === "/stop") {
  39 │           yield* object.stop();
  40 │           return HttpServerResponse.text("stopped");
  41 │         }
  42 │         if (url.pathname === "/crash") {
  43 │           const result = yield* object.crash();
  44 │           return HttpServerResponse.text(result);
  45 │         }
  46 │
  47 │         return HttpServerResponse.text("ok");
  48 │       }).pipe(

0.87 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-async/worker.ts:77:7
  74 │     const url = new URL(request.url);
  75 │
  76 │     if (url.pathname === "/events") {
> 77 │       return Response.json(await env.EVENTS.getByName("events").events(), {
  78 │         headers: { "x-events-read-at": String(Date.now()) },
  79 │       });
  80 │     }

0.87 packages/alchemy/test/types/Api.ts:78:11
   72 │       fetch: Effect.gen(function* () {
   73 │         // (Business logic is implemented here and can reference bound infrastructure above)
   74 │         const request = yield* HttpServerRequest;
   75 │         if (request.url.startsWith("/connect/")) {
   76 │           // connect to a Durable Object web socket
   77 │           const agentId = request.url.split("/").pop()!;
>  78 │           const agent = agents.getByName(agentId);
   79 │           const response = yield* agent.fetch(request);
   80 │           return response;
   81 │         } // else if (request.url.startsWith("/profile/")) {
   82 │         //   // call RPC methods on a Durable Object
   83 │         //   const key = request.url.split("/").pop()!;
   84 │         //   const agent = yield* agents.getByName(key);
   85 │         //   if (request.method == "GET") {
   86 │         //     const item = yield* agent.getProfile();
   87 │         //     if (item) {
   88 │         //       return HttpServerResponse.text(item);
   89 │         //     }
   90 │         //   } else if (request.method == "PUT") {
   91 │         //     yield* agent.putProfile(yield* request.text);
   92 │         //     return HttpServerResponse.text("OK", { status: 200 });
   93 │         //   } else {
   94 │         //     return HttpServerResponse.text("Method not allowed", {
   95 │         //       status: 405,
   96 │         //     });
   97 │         //   }
   98 │         // }
   99 │         return HttpServerResponse.text("Hello World", { status: 200 });
  100 │       }),

0.86 packages/alchemy/test/ACME/fixtures/issue-worker.ts:34:11
  32 │         const name = url.searchParams.get("name") ?? "";
  33 │         return yield* Effect.gen(function* () {
> 34 │           const issued = yield* acme.issue({ identifiers: [name], solver });
  35 │           const parsed = yield* ACME.parseCertificate(issued.certificate);
  36 │           yield* acme.revoke({
  37 │             certificate: issued.certificate,
  38 │             privateKey: issued.privateKey,
  39 │           });
  40 │           return yield* HttpServerResponse.json({
  41 │             issuer: issued.issuer,
  42 │             notAfter: issued.notAfter,
  43 │             serial: issued.serial,
  44 │             dnsNames: parsed.dnsNames,
  45 │             hasKey: Redacted.value(issued.privateKey).includes(
  46 │               "BEGIN PRIVATE KEY",
  47 │             ),
  48 │             chainLength: ACME.splitPemChain(issued.chain).length,
  49 │           });
  50 │         }).pipe(
  51 │           // Failures and defects alike come back as JSON so the test can
  52 │           // show what went wrong inside the Worker.
  53 │           Effect.catchCause((cause) =>
  54 │             HttpServerResponse.json(
  55 │               { error: Cause.pretty(cause) },
  56 │               { status: 500 },
  57 │             ),
  58 │           ),
  59 │         );

0.86 packages/alchemy/test/AWS/AppFlow/handler.ts:161:11
  160 │         if (request.method === "POST" && pathname === "/start") {
> 161 │           const result = yield* startFlow();
  162 │           return yield* HttpServerResponse.json({
  163 │             executionId: result.executionId,
  164 │             flowStatus: result.flowStatus,
  165 │             flowArn: result.flowArn,
  166 │           });
  167 │         }

0.86 packages/alchemy/test/AWS/AuditManager/handler.ts:81:11
  78 │         if (request.method === "GET" && pathname === "/account-status") {
  79 │           // Succeeds even on unregistered accounts — a REAL success through
  80 │           // the binding's IAM grant.
> 81 │           const result = yield* getAccountStatus();
  82 │           return yield* HttpServerResponse.json({
  83 │             ok: true,
  84 │             status: result.status ?? null,
  85 │           });
  86 │         }

0.86 packages/alchemy/test/AWS/CloudTrail/handler.ts:85:7
  84 │     return {
> 85 │       fetch: Effect.gen(function* () {
  86 │         const request = yield* HttpServerRequest;
  87 │         const url = new URL(request.originalUrl);
  88 │         const pathname = url.pathname;

0.86 packages/alchemy/test/AWS/EC2/fixtures/bindings-handler.ts:166:11
  165 │         if (request.method === "GET" && pathname === "/describe") {
> 166 │           const result = yield* describeInstance().pipe(authorizationResult);
  167 │           return yield* HttpServerResponse.json({
  168 │             ok: result._tag === "Success",
  169 │             tag: result._tag === "Failure" ? result.failure._tag : "Success",
  170 │             state:
  171 │               result._tag === "Success"
  172 │                 ? result.success?.State?.Name
  173 │                 : undefined,
  174 │           });
  175 │         }

0.86 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:41:3
> 41 │   Effect.gen(function* () {

0.86 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:184:9
> 184 │         if (request.method === "GET" && pathname === "/target-health") {
  185 │           const result = yield* describeTargetHealth({}).pipe(Effect.result);
  186 │           return yield* HttpServerResponse.json({
  187 │             ok: result._tag === "Success",
  188 │             tag: result._tag === "Failure" ? result.failure._tag : "Success",
  189 │             targets:
  190 │               result._tag === "Success"
  191 │                 ? (result.success.TargetHealthDescriptions ?? []).map((d) => ({
  192 │                     id: d.Target?.Id,
  193 │                     state: d.TargetHealth?.State,
  194 │                   }))
  195 │                 : undefined,
  196 │           });
  197 │         }

0.86 packages/alchemy/test/AWS/IAM/handler.ts:123:9
  120 │         const url = new URL(request.originalUrl);
  121 │         const pathname = url.pathname;
  122 │
> 123 │         if (request.method === "GET" && pathname === "/bindings") {
  124 │           return yield* HttpServerResponse.json({
  125 │             bound: Object.keys(bound),
  126 │           });
  127 │         }

0.86 packages/alchemy/test/AWS/Pipes/bindings-handler.ts:90:7
  87 │     const pipeName = yield* pipe.pipeName;
  88 │
  89 │     return {
> 90 │       fetch: Effect.gen(function* () {
  91 │         const request = yield* HttpServerRequest;
  92 │         const url = new URL(request.originalUrl);
  93 │         const pathname = url.pathname;

0.86 packages/alchemy/test/AWS/Redshift/fixtures/bindings-handler.ts:39:5
  36 │ export default RedshiftBindingsTestFunction.make(
  37 │   {
  38 │     main,
> 39 │     functionUrl: true,
  40 │   },

0.86 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:41:9
  38 │         const url = new URL(request.originalUrl);
  39 │         const pathname = url.pathname;
  40 │
> 41 │         if (request.method === "GET" && pathname === "/bindings") {
  42 │           return yield* HttpServerResponse.json({
  43 │             bound: Object.keys(bound),
  44 │           });
  45 │         }

0.86 packages/alchemy/test/AWS/SNS/platform-handler.ts:69:7
  66 │     const publishToEndpoint = yield* AWS.SNS.PublishToEndpoint(application);
  67 │
  68 │     return {
> 69 │       fetch: Effect.gen(function* () {
  70 │         const request = yield* HttpServerRequest;
  71 │         const url = new URL(request.originalUrl);

0.85 packages/alchemy/test/AWS/ApiGatewayV2/bindings-handler.ts:65:9
  62 │         const url = new URL(request.originalUrl);
  63 │         const pathname = url.pathname;
  64 │
> 65 │         if (request.method === "GET" && pathname === "/export") {
  66 │           const exported = yield* exportApi({ OutputType: "JSON" }).pipe(
  67 │             Effect.orDie,
  68 │           );
  69 │           const document = exported.body
  70 │             ? yield* Stream.mkString(Stream.decodeText(exported.body)).pipe(
  71 │                 Effect.orDie,
  72 │               )
  73 │             : "";
  74 │           const spec = yield* Effect.try(
  75 │             () =>
  76 │               JSON.parse(document) as {
  77 │                 openapi?: string;
  78 │                 paths?: Record<string, unknown>;
  79 │               },
  80 │           ).pipe(Effect.orDie);
  81 │           return yield* HttpServerResponse.json({
  82 │             openapi: spec.openapi,
  83 │             paths: Object.keys(spec.paths ?? {}),
  84 │           });
  85 │         }

0.85 packages/alchemy/test/AWS/Chatbot/handler.ts:76:7
  75 │     return {
> 76 │       fetch: Effect.gen(function* () {
  77 │         const request = yield* HttpServerRequest;
  78 │         const url = new URL(request.originalUrl);
  79 │         const pathname = url.pathname;

0.85 packages/alchemy/test/AWS/ComprehendMedical/handler.ts:84:9
> 84 │         if (request.method === "GET" && pathname === "/entities") {
  85 │           const result = yield* detectEntities({
  86 │             Text: "Patient takes 50 mg atenolol daily for hypertension.",
  87 │           });
  88 │           return yield* HttpServerResponse.json({
  89 │             entities: (result.Entities ?? []).map((entity) => ({
  90 │               text: entity.Text,
  91 │               category: entity.Category,
  92 │               type: entity.Type,
  93 │             })),
  94 │             modelVersion: result.ModelVersion,
  95 │           });
  96 │         }

0.85 packages/alchemy/test/AWS/ElastiCache/bindings-handler.ts:31:5
  28 │ export default ElastiCacheBindingsTestFunction.make(
  29 │   {
  30 │     main,
> 31 │     functionUrl: true,
  32 │   },

0.85 packages/alchemy/test/AWS/GeoRoutes/handler.ts:41:9
> 41 │         if (request.method === "GET" && pathname === "/calculate-routes") {
  42 │           const result = yield* calculateRoutes({
  43 │             // [longitude, latitude] — two points in Seattle.
  44 │             Origin: [-122.339, 47.61],
  45 │             Destination: [-122.201, 47.61],
  46 │             TravelMode: "Car",
  47 │           });
  48 │           const routes = result.Routes ?? [];
  49 │           return yield* HttpServerResponse.json({
  50 │             count: routes.length,
  51 │             distance: routes[0]?.Summary?.Distance,
  52 │             duration: routes[0]?.Summary?.Duration,
  53 │           });
  54 │         }

0.85 packages/alchemy/test/AWS/KinesisVideo/handler.ts:61:11
  58 │         const pathname = new URL(request.originalUrl).pathname;
  59 │
  60 │         if (request.method === "GET" && pathname === "/info") {
> 61 │           return yield* HttpServerResponse.json({ ok: true });
  62 │         }

0.85 packages/alchemy/test/AWS/Polly/handler.ts:99:7
   98 │     return {
>  99 │       fetch: Effect.gen(function* () {
  100 │         const request = yield* HttpServerRequest;
  101 │         const url = new URL(request.originalUrl);
  102 │         const pathname = url.pathname;

0.85 packages/alchemy/test/AWS/Route53Profiles/handler.ts:42:9
  39 │         const url = new URL(request.originalUrl);
  40 │         const pathname = url.pathname;
  41 │
> 42 │         if (request.method === "GET" && pathname === "/bindings") {
  43 │           return yield* HttpServerResponse.json({
  44 │             bound: Object.keys(bound),
  45 │           });
  46 │         }

0.85 packages/alchemy/test/AWS/SocialMessaging/bindings-handler.ts:141:9
  138 │         // Typed-error probes: a bogus identifier round-trips the typed tag,
  139 │         // proving the grant reached the API (an IAM gap would surface
  140 │         // AccessDeniedException instead).
> 141 │         if (request.method === "GET" && pathname === "/phone/typed-not-found") {
  142 │           const typed = yield* getPhoneNumber({ id: BOGUS_PHONE_ID }).pipe(
  143 │             Effect.map(() => false),
  144 │             Effect.catchTag(
  145 │               ["ResourceNotFoundException", "InvalidParametersException"],
  146 │               () => Effect.succeed(true),
  147 │             ),
  148 │           );
  149 │           return yield* HttpServerResponse.json({ typed });
  150 │         }

0.85 packages/alchemy/test/Cloudflare/Artifacts/fixtures/async-worker.ts:17:7
  14 │     const repos = env.REPOS;
  15 │
  16 │     if (url.pathname === "/create") {
> 17 │       const repo = await repos.create(name, { setDefaultBranch: "main" });
  18 │       return Response.json({
  19 │         name: repo.name,
  20 │         remote: repo.remote,
  21 │         defaultBranch: repo.defaultBranch,
  22 │         hasToken: typeof repo.token === "string" && repo.token.length > 0,
  23 │       });
  24 │     }

0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow/workflow-worker.ts:36:11
  33 │         if (request.url.startsWith("/workflow/send/")) {
  34 │           const [, rest = ""] = request.url.split("/workflow/send/");
  35 │           const [instanceId = "", message = "received"] = rest.split("/");
> 36 │           const instance = yield* workflow.get(instanceId);
  37 │           yield* instance.sendEvent({
  38 │             type: "test-event",
  39 │             payload: { message },
  40 │           });
  41 │           return yield* HttpServerResponse.json({ ok: true });
  42 │         }

0.85 packages/alchemy/test/Neon/fixtures/StorageFunction.ts:73:9
> 73 │         return yield* HttpServerResponse.json(yield* settings.get());
  74 │       }).pipe(

0.84 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:46:9
> 46 │         if (request.method === "POST" && pathname === "/sink") {
  47 │           const body = (yield* request.json) as {
  48 │             runId: string;
  49 │             count: number;
  50 │           };
  51 │
  52 │           // Raw MetricDatum entries — the caller owns the shape; the sink
  53 │           // only packs/batches. >1000 datums forces a 1000 + remainder split.
  54 │           yield* Stream.fromIterable(
  55 │             Array.from(
  56 │               { length: body.count },
  57 │               () =>
  58 │                 ({
  59 │                   MetricName: SINK_METRIC_NAME,
  60 │                   Dimensions: [{ Name: "Run", Value: body.runId }],
  61 │                   Value: 1,
  62 │                   Unit: "Count",
  63 │                 }) satisfies AWS.CloudWatch.MetricSinkDatum,
  64 │             ),
  65 │           ).pipe(Stream.run(sink));
  66 │
  67 │           return yield* HttpServerResponse.json({
  68 │             ok: true,
  69 │             count: body.count,
  70 │           });
  71 │         }

0.84 packages/alchemy/test/AWS/KMS/handler.ts:101:11
   96 │         if (request.method === "POST" && pathname === "/encrypt") {
   97 │           const body = (yield* request.json) as {
   98 │             plaintextBase64: string;
   99 │             context?: Record<string, string>;
  100 │           };
> 101 │           const result = yield* encrypt({
  102 │             Plaintext: yield* fromBase64(body.plaintextBase64),
  103 │             EncryptionContext: body.context,
  104 │           });
  105 │           return yield* HttpServerResponse.json({
  106 │             keyId: result.KeyId,
  107 │             ciphertextBase64: result.CiphertextBlob
  108 │               ? yield* toBase64(result.CiphertextBlob)
  109 │               : undefined,
  110 │           });
  111 │         }

0.84 packages/alchemy/test/AWS/OpenSearch/fixtures/handler.ts:101:9
   98 │         const url = new URL(request.originalUrl);
   99 │         const pathname = url.pathname;
  100 │
> 101 │         if (request.method === "GET" && pathname === "/bindings") {
  102 │           return yield* HttpServerResponse.json({
  103 │             bound: Object.keys(bound),
  104 │           });
  105 │         }

0.84 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/platform-worker.ts:31:9
  16 │ export default class WfpPlatformWorker extends Cloudflare.Worker<WfpPlatformWorker>()(
  17 │   "WfpBindingPlatformWorker",
  18 │   { main: import.meta.filename, workersDev: true },
  19 │   Effect.gen(function* () {
  20 │     const dispatch = yield* Cloudflare.WorkersForPlatforms.Get(DispatchNs);
  21 │
  22 │     return {
  23 │       fetch: Effect.gen(function* () {
  24 │         const request = yield* HttpServerRequest;
  25 │         const url = new URL(request.url, "http://placeholder");
  26 │         const match = url.pathname.match(/^\/dispatch\/([^/]+)(\/.*)?$/);
  27 │         if (!match) {
  28 │           return HttpServerResponse.text("platform-worker ok");
  29 │         }
  30 │         const [, scriptName, rest] = match;
> 31 │         const userWorker = yield* dispatch.get(scriptName).pipe(Effect.orDie);
  32 │         const response = yield* Effect.promise(() =>
  33 │           userWorker.fetch(
  34 │             new Request(`https://user-worker${rest ?? "/"}`, {
  35 │               headers: { "x-custom": request.headers["x-custom"] ?? "" },
  36 │             }),
  37 │           ),
  38 │         );
  39 │         return HttpServerResponse.fromWeb(response);
  40 │       }),
  41 │     };
  42 │   }).pipe(Effect.provide(Cloudflare.WorkersForPlatforms.GetBinding)),
  43 │ ) {}

0.84 packages/alchemy/test/Fly/fixtures/certificates-api.ts:58:13
  54 │         switch (url.pathname) {
  55 │           case "/health":
  56 │             return yield* HttpServerResponse.json({ ok: true, version: 2 });
  57 │           case "/request":
> 58 │             return yield* respond(() => certs.request(hostname));
  59 │           case "/upload": {
  60 │             const body = (yield* request.json) as {
  61 │               hostname: string;
  62 │               fullchain: string;
  63 │               privateKey: string;
  64 │             };
  65 │             return yield* respond(() =>
  66 │               certs.upload({
  67 │                 hostname: body.hostname,
  68 │                 fullchain: body.fullchain,
  69 │                 privateKey: Redacted.make(body.privateKey),
  70 │               }),
  71 │             );
  72 │           }
  73 │           case "/check":
  74 │             return yield* respond(() => certs.check(hostname));
  75 │           case "/get":
  76 │             return yield* respond(() => certs.get(hostname));
  77 │           case "/remove":
  78 │             return yield* respond(() => certs.remove(hostname));
  79 │           default:
  80 │             return HttpServerResponse.text("not found", { status: 404 });
  81 │         }

0.84 packages/alchemy/test/Stripe/fixtures/event-source-worker.ts:31:11
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
  29 │         if (request.url.startsWith("/last/")) {
  30 │           const id = request.url.slice("/last/".length).split("?")[0];
> 31 │           const seen = yield* kv.get(id).pipe(Effect.orDie);
  32 │           return yield* HttpServerResponse.json({
  33 │             id: seen === "1" ? id : null,
  34 │           });
  35 │         }
  36 │         if (request.url.startsWith("/last")) {
  37 │           const id = yield* kv.get("lastCustomerId").pipe(Effect.orDie);
  38 │           return yield* HttpServerResponse.json({ id: id ?? null });
  39 │         }
  40 │         if (request.method === "POST" && request.url.startsWith("/customers")) {
  41 │           const customer = yield* createCustomer({
  42 │             email: "event-source@example.com",
  43 │           }).pipe(Effect.orDie);
  44 │           return yield* HttpServerResponse.json(
  45 │             { id: customer.id },
  46 │             { status: 201 },
  47 │           );
  48 │         }
  49 │         return HttpServerResponse.text("ok");
  50 │       }),
  51 │     };

0.83 packages/alchemy/test/AWS/DirectoryService/handler.ts:33:7
  30 │     const bound = { getDirectoryLimits, describeDirectories };
  31 │
  32 │     return {
> 33 │       fetch: Effect.gen(function* () {
  34 │         const request = yield* HttpServerRequest;
  35 │         const url = new URL(request.originalUrl);
  36 │         const pathname = url.pathname;

0.83 packages/alchemy/test/AWS/ElastiCache/handler.ts:151:7
  150 │     return {
> 151 │       fetch: Effect.gen(function* () {
  152 │         const request = yield* HttpServerRequest;
  153 │         const url = new URL(request.originalUrl);
  154 │         const pathname = url.pathname;

0.83 packages/alchemy/test/AWS/GeoMaps/handler.ts:40:7
  39 │     return {
> 40 │       fetch: Effect.gen(function* () {
  41 │         const request = yield* HttpServerRequest;
  42 │         const url = new URL(request.originalUrl);
  43 │         const pathname = url.pathname;

0.83 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/orchestrator.ts:38:9
  35 │         const request = yield* HttpServerRequest;
  36 │         const url = new URL(request.originalUrl);
  37 │
> 38 │         if (request.method === "POST" && url.pathname === "/rpc") {
  39 │           const message = url.searchParams.get("message") ?? "world";

0.83 packages/alchemy/test/AWS/RDSData/drizzle-iam-handler.ts:40:5
  37 │ export default RDSDrizzleIamFunction.make(
  38 │   {
  39 │     main,
> 40 │     functionUrl: true,
  41 │     // First query per execution builds the pool + TLS handshake while the
  42 │     // serverless cluster may be scaling from idle.
  43 │     timeout: Duration.seconds(60),
  44 │   },

0.83 packages/alchemy/test/AWS/Route53Domains/handler.ts:68:7
  67 │     return {
> 68 │       fetch: Effect.gen(function* () {
  69 │         const request = yield* HttpServerRequest;
  70 │         const url = new URL(request.originalUrl);
  71 │         const pathname = url.pathname;

0.83 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:70:7
  67 │     const bound = { describeEndpoint, updateWeights };
  68 │
  69 │     return {
> 70 │       fetch: Effect.gen(function* () {
  71 │         const request = yield* HttpServerRequest;
  72 │         const url = new URL(request.originalUrl);
  73 │         const pathname = url.pathname;
  74 │
  75 │         if (request.method === "GET" && pathname === "/bindings") {
  76 │           return yield* HttpServerResponse.json({ bound: Object.keys(bound) });
  77 │         }
  78 │
  79 │         if (request.method === "GET" && pathname === "/describe-endpoint") {
  80 │           const described = yield* describeEndpoint();
  81 │           return yield* HttpServerResponse.json({
  82 │             endpointName: described.EndpointName,
  83 │             status: described.EndpointStatus,
  84 │             variants: (described.ProductionVariants ?? []).map(
  85 │               (v) => v.VariantName,
  86 │             ),
  87 │           });
  88 │         }
  89 │
  90 │         if (request.method === "GET" && pathname === "/health") {
  91 │           return yield* HttpServerResponse.json({ ok: true });
  92 │         }
  93 │
  94 │         return yield* HttpServerResponse.json(
  95 │           { error: "Not found", pathname },
  96 │           { status: 404 },
  97 │         );
  98 │       }).pipe(Effect.orDie),

0.83 packages/alchemy/test/AWS/Shield/handler.ts:78:7
  77 │     return {
> 78 │       fetch: Effect.gen(function* () {
  79 │         const request = yield* HttpServerRequest;
  80 │         const url = new URL(request.originalUrl);
  81 │         const pathname = url.pathname;

0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/object.ts:65:9
  56 │       const handlers = CounterRpcs.toLayer({
  57 │         incrementD1: ({ key }) =>
  58 │           Effect.gen(function* () {
  59 │             const next = (yield* readD1(key)) + 1;
  60 │             yield* writeD1(key, next);
  61 │             return { value: next };
  62 │           }),
  63 │         getD1: ({ key }) => Effect.map(readD1(key), (value) => ({ value })),
  64 │         // `key` is ignored — the DO instance is already partitioned by
> 65 │         // `getByName(key)` at the namespace boundary.
  66 │         incrementDO: () =>
  67 │           Effect.gen(function* () {
  68 │             const next = (yield* readDO()) + 1;
  69 │             yield* writeDO(next);
  70 │             return { value: next };
  71 │           }),
  72 │         getDO: () => Effect.map(readDO(), (value) => ({ value })),
  73 │         reset: ({ key }) =>
  74 │           Effect.gen(function* () {
  75 │             console.log("reset DO", key);
  76 │             yield* writeD1(key, 0);
  77 │             yield* writeDO(0);
  78 │           }),
  79 │       });

0.83 packages/alchemy/test/Fly/fixtures/app/api.ts:28:9
  20 │   Effect.gen(function* () {
  21 │     const secret = yield* Marker;
  22 │     const get = yield* Fly.GetSecret(secret);
  23 │
  24 │     return {
  25 │       fetch: Effect.gen(function* () {
  26 │         const request = yield* HttpServerRequest;
  27 │         const url = new URL(request.url, "http://service");
> 28 │         if (url.pathname === "/secret") {
  29 │           const got = yield* get().pipe(Effect.orDie);
  30 │           return yield* HttpServerResponse.json({
  31 │             ok: true,
  32 │             name: got.name,
  33 │           });
  34 │         }
  35 │         return yield* HttpServerResponse.json({
  36 │           ok: true,
  37 │           name: SECRET_NAME,
  38 │         });
  39 │       }),
  40 │     };
  41 │   }).pipe(Effect.provide(Fly.GetSecretHttp)),

0.82 packages/alchemy/test/AWS/EMRServerless/handler.ts:151:11
  149 │         // Real reads: application id injected from the binding.
  150 │         if (request.method === "GET" && pathname === "/jobruns") {
> 151 │           const { jobRuns } = yield* listJobRuns().pipe(Effect.orDie);
  152 │           return yield* HttpServerResponse.json({
  153 │             ids: jobRuns.map((run) => run.id),
  154 │           });
  155 │         }

0.82 packages/alchemy/test/AWS/KinesisAnalyticsV2/handler.ts:204:11
> 204 │           case "GET /snapshot": {
  205 │             const result = yield* errorTagged(
  206 │               describeApplicationSnapshot({ SnapshotName: "does-not-exist" }),
  207 │             );
  208 │             return yield* HttpServerResponse.json(
  209 │               "errorTag" in result ? result : { ok: true },
  210 │             );
  211 │           }

0.82 packages/alchemy/test/AWS/LexV2/handler.ts:123:7
  122 │     return {
> 123 │       fetch: Effect.gen(function* () {
  124 │         const request = yield* HttpServerRequest;
  125 │         const url = new URL(request.originalUrl);
  126 │         const sessionId = url.searchParams.get("sessionId") ?? "missing";

0.82 packages/alchemy/test/Cloudflare/AI/fixtures/ChatBackend.ts:35:13
  23 │     return Effect.gen(function* () {
  24 │       // Per-instance: a chat persistence service backed by this DO's
  25 │       // storage. `Chat.makePersisted` needs `BackingPersistence`, which
  26 │       // `DurableObjectChatPersistence` provides from `DurableObjectState`
  27 │       // (in scope here).
  28 │       const persistence = yield* Chat.makePersisted({
  29 │         storeId: "alchemy.chat",
  30 │       }).pipe(Effect.provide(Cloudflare.AI.DurableObjectChatPersistence));
  31 │
  32 │       return {
  33 │         send: (threadId: string, prompt: string) =>
  34 │           Effect.gen(function* () {
> 35 │             const chat = yield* persistence.getOrCreate(threadId);
  36 │             const response = yield* chat.generateText({ prompt });
  37 │             const history = yield* Ref.get(chat.history);
  38 │             return {
  39 │               text: response.text,
  40 │               turns: history.content.length,
  41 │             };
  42 │           }).pipe(Effect.provide(languageModel), Effect.orDie),
  43 │       };
  44 │     });

0.82 packages/alchemy/test/Cloudflare/Container/fixtures/reload/worker.ts:20:11
   8 │ export default class ReloadContainerWorker extends Cloudflare.Worker<ReloadContainerWorker>()(
   9 │   "ReloadContainerWorker",
  10 │   { main: import.meta.url },
  11 │   Effect.gen(function* () {
  12 │     const objects = yield* ReloadContainerObject;
  13 │
  14 │     return {
  15 │       fetch: Effect.gen(function* () {
  16 │         const request = yield* HttpServerRequest;
  17 │         const url = new URL(request.url, "http://x");
  18 │         const text = yield* objects
  19 │           .getByName("default")
> 20 │           .read(url.pathname)
  21 │           .pipe(
  22 │             Effect.catchCause((cause) =>
  23 │               Effect.succeed(`CONTAINER_UNREACHABLE: ${cause}`),
  24 │             ),
  25 │           );
  26 │         return HttpServerResponse.text(text);
  27 │       }),
  28 │     };
  29 │   }),
  30 │ ) {}

0.82 packages/alchemy/test/Cloudflare/Website/fixtures/nextjs-app/app/api/kv/route.ts:17:3
  11 │ export async function PUT(request: Request) {
  12 │   const { key, value } = (await request.json()) as {
  13 │     key: string;
  14 │     value: string;
  15 │   };
  16 │   const { env } = getCloudflareContext();
> 17 │   await env.FIXTURE_KV.put(key, value);
  18 │   return Response.json({ ok: true });
  19 │ }

0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-collector-worker.ts:31:5
  20 │ export default {
  21 │   async fetch(request: Request, env: any): Promise<Response> {
  22 │     const url = new URL(request.url);
  23 │     const sink = env.SINK.get(env.SINK.idFromName("collector"));
  24 │     if (request.method === "POST" && url.pathname.startsWith("/v1/")) {
  25 │       await sink.add({
  26 │         signal: url.pathname.slice("/v1/".length),
  27 │         payload: await request.json(),
  28 │       });
  29 │       return Response.json({ partialSuccess: {} });
  30 │     }
> 31 │     if (url.pathname === "/collected") {
  32 │       return Response.json({
  33 │         marker: "otel-collector-ok",
  34 │         items: await sink.list(),
  35 │       });
  36 │     }
  37 │     return new Response("otel-collector-ok");
  38 │   },
  39 │ };

0.81 packages/alchemy/test/AWS/EC2/fixtures/dev-instance-fn.ts:30:5
  27 │ export default Ec2DevProbeFunction.make(
  28 │   {
  29 │     main: import.meta.url,
> 30 │     functionUrl: true,
  31 │     timeout: Duration.seconds(30),
  32 │     memorySize: 512,
  33 │   },

0.81 packages/alchemy/test/AWS/ECS/fixtures/otel-collector-worker.ts:24:5
  20 │ export default {
  21 │   async fetch(request: Request, env: any): Promise<Response> {
  22 │     const url = new URL(request.url);
  23 │     const sink = env.SINK.get(env.SINK.idFromName("collector"));
> 24 │     if (request.method === "POST" && url.pathname.startsWith("/v1/")) {
  25 │       // Record every push, even an unparseable one, so the test can tell
  26 │       // "export never sent" apart from "export sent but malformed".
  27 │       const raw = await request.text();
  28 │       let payload: unknown;
  29 │       try {
  30 │         payload = JSON.parse(raw);
  31 │       } catch {
  32 │         payload = { parseError: true, raw: raw.slice(0, 1000) };
  33 │       }
  34 │       await sink.add({
  35 │         signal: url.pathname.slice("/v1/".length),
  36 │         payload,
  37 │       });
  38 │       return Response.json({ partialSuccess: {} });
  39 │     }
  40 │     if (url.pathname === "/collected") {
  41 │       return Response.json({
  42 │         marker: "otel-collector-ok",
  43 │         items: await sink.list(),
  44 │       });
  45 │     }
  46 │     return new Response("otel-collector-ok");
  47 │   },
  48 │ };

0.81 packages/alchemy/test/AWS/Grafana/handler.ts:33:7
  30 │     const bound = { listVersions };
  31 │
  32 │     return {
> 33 │       fetch: Effect.gen(function* () {
  34 │         const request = yield* HttpServerRequest;
  35 │         const url = new URL(request.originalUrl);
  36 │         const pathname = url.pathname;
  37 │
  38 │         if (request.method === "GET" && pathname === "/bindings") {
  39 │           return yield* HttpServerResponse.json({
  40 │             bound: Object.keys(bound),
  41 │           });
  42 │         }
  43 │
  44 │         if (request.method === "GET" && pathname === "/versions") {
  45 │           const { grafanaVersions } = yield* listVersions();
  46 │           return yield* HttpServerResponse.json({
  47 │             versions: grafanaVersions ?? [],
  48 │           });
  49 │         }
  50 │
  51 │         return yield* HttpServerResponse.json(
  52 │           { error: "Not found", method: request.method, pathname },
  53 │           { status: 404 },
  54 │         );
  55 │       }).pipe(Effect.orDie),
  56 │     };

0.81 packages/alchemy/test/AWS/IoTManagedIntegrations/bindings-handler.ts:208:11
  207 │         if (pathname === "/capabilities") {
> 208 │           const result = yield* errorTagged(getCapabilities());
  209 │           return yield* HttpServerResponse.json(
  210 │             "errorTag" in result
  211 │               ? result
  212 │               : { managedThingId: result.ManagedThingId },
  213 │           );
  214 │         }

0.81 packages/alchemy/test/AWS/Secret/fixtures/handler.ts:37:5
  34 │ export const SecretsTestFunctionLive = SecretsTestFunction.make(
  35 │   {
  36 │     main,
> 37 │     functionUrl: true,
  38 │   },

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:57:9
  39 │       fetch: Effect.gen(function* () {
  40 │         const request = yield* HttpServerRequest;
  41 │
  42 │         if (request.url.startsWith("/workflow/start/")) {
  43 │           const id = Number(request.url.split("/workflow/start/")[1] ?? "1");
  44 │           const instance = yield* workflow.create({
  45 │             params: { id, name: `widget-${id}` },
  46 │           });
  47 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  48 │         }
  49 │
  50 │         if (request.url.startsWith("/workflow/status/")) {
  51 │           const instanceId = request.url.split("/workflow/status/")[1] ?? "";
  52 │           const instance = yield* workflow.get(instanceId);
  53 │           const status = yield* instance.status();
  54 │           return yield* HttpServerResponse.json(status);
  55 │         }
  56 │
> 57 │         if (request.url.startsWith("/query/")) {
  58 │           const id = Number(request.url.split("/query/")[1] ?? "1");
  59 │           const rows = yield* db
  60 │             .select()
  61 │             .from(Widgets)
  62 │             .where(eq(Widgets.id, id))
  63 │             .pipe(Effect.orDie);
  64 │           return yield* HttpServerResponse.json({ rowCount: rows.length });
  65 │         }
  66 │
  67 │         return HttpServerResponse.text("ok");
  68 │       }),

0.81 packages/alchemy/test/Cloudflare/Workflows/fixtures/workflow-worker.ts:98:11
   94 │         if (request.url.startsWith("/workflow/delete/")) {
   95 │           const instance = yield* workflow.get(
   96 │             request.url.split("/workflow/delete/")[1]!,
   97 │           );
>  98 │           yield* instance.delete();
   99 │           // A second deletion should report the now-missing instance as an error.
  100 │           return yield* HttpServerResponse.json(
  101 │             yield* workflow.deleteBatch([instance.id]),
  102 │           );
  103 │         }

0.80 packages/alchemy/test/AWS/AutoScaling/fixtures/bindings-handler.ts:151:9
> 151 │         if (request.method === "POST" && pathname === "/set-desired") {
  152 │           const result = yield* setDesiredCapacity({
  153 │             DesiredCapacity: 0,
  154 │           }).pipe(Effect.result);
  155 │           return yield* HttpServerResponse.json({
  156 │             ok: result._tag === "Success",
  157 │             tag: result._tag === "Failure" ? result.failure._tag : "Success",
  158 │           });
  159 │         }

0.80 packages/alchemy/test/Cloudflare/Browser/fixtures/effect-worker.ts:26:7
  23 │     const browser = yield* Cloudflare.Browser("BROWSER");
  24 │
  25 │     return {
> 26 │       fetch: Effect.gen(function* () {
  27 │         const request = yield* HttpServerRequest;
  28 │         const path = request.url.split("?")[0];

0.80 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:67:11
  47 │   Effect.gen(function* () {
  48 │     const container = yield* RemoteContainer;
  49 │
  50 │     return Effect.gen(function* () {
  51 │       const { fetch } = yield* container.getTcpPort(8080);
  52 │
  53 │       return {
  54 │         hello: () =>
  55 │           Effect.gen(function* () {
  56 │             const response = yield* fetch(
  57 │               HttpClientRequest.get("http://container/"),
  58 │             );
  59 │             return yield* response.text;
  60 │           }),
  61 │         // The proxy pattern from #1334: forward the incoming request to the
  62 │         // container verbatim. In production the incoming web Request carries
  63 │         // an https:// URL, which workerd's container ports reject — the
  64 │         // runtime must downgrade the scheme on the container hop.
  65 │         fetch: Effect.gen(function* () {
  66 │           const request = yield* HttpServerRequest;
> 67 │           return yield* fetch(request);
  68 │         }),
  69 │       };
  70 │     });
  71 │   }).pipe(

0.80 packages/alchemy/test/Cloudflare/Email/fixtures/local-worker.ts:48:7
  47 │     return {
> 48 │       fetch: Effect.gen(function* () {
  49 │         const request = yield* HttpServerRequest;
  50 │         const url = new URL(request.url, "http://x");
  51 │         if (url.pathname === "/send-stub") {
  52 │           return yield* send(stub);
  53 │         }
  54 │         if (url.pathname === "/send-live") {
  55 │           return yield* send(live);
  56 │         }
  57 │         return HttpServerResponse.text("ok");
  58 │       }),
  59 │     };

0.79 packages/alchemy/test/AWS/AutoScaling/fixtures/lifecycle-handler.ts:97:7
  96 │     return {
> 97 │       fetch: Effect.gen(function* () {
  98 │         const request = yield* HttpServerRequest;
  99 │         const pathname = new URL(request.originalUrl).pathname;

0.79 packages/alchemy/test/AWS/EventBridge/sink-handler.ts:77:7
  74 │     const queueUrl = yield* queue.queueUrl;
  75 │
  76 │     return {
> 77 │       fetch: Effect.gen(function* () {
  78 │         const request = yield* HttpServerRequest;
  79 │         const pathname = new URL(request.originalUrl).pathname;

0.79 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:41:5
  38 │ export default IoTEventSourceFunction.make(
  39 │   {
  40 │     main,
> 41 │     functionUrl: true,
  42 │   },

0.79 packages/alchemy/test/Cloudflare/AnalyticsEngine/fixtures/worker.ts:20:9
   7 │ export default class AnalyticsEngineTestWorker extends Cloudflare.Worker<AnalyticsEngineTestWorker>()(
   8 │   "AnalyticsEngineTestWorker",
   9 │   {
  10 │     main: import.meta.url,
  11 │   },
  12 │   Effect.gen(function* () {
  13 │     const analytics = yield* Cloudflare.AnalyticsEngine.WriteDataset(Dataset);
  14 │
  15 │     return {
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │         const url = new URL(request.url, "http://x");
  19 │
> 20 │         if (url.pathname === "/write") {
  21 │           yield* analytics
  22 │             .writeDataPoint({
  23 │               indexes: ["account-1"],
  24 │               blobs: ["signup"],
  25 │               doubles: [1],
  26 │             })
  27 │             .pipe(Effect.orDie);
  28 │           return yield* HttpServerResponse.json({ ok: true });
  29 │         }
  30 │
  31 │         return HttpServerResponse.text("ok");
  32 │       }),
  33 │     };
  34 │   }).pipe(Effect.provide(Cloudflare.AnalyticsEngine.WriteDatasetBinding)),
  35 │ ) {}

0.79 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/async-worker.ts:35:11
  17 │ export default class AsyncSecretWorker extends Cloudflare.Worker<AsyncSecretWorker>()(
  18 │   "AsyncSecretBindingWorker",
  19 │   {
  20 │     main: import.meta.url,
  21 │     workersDev: { enabled: true, previewsEnabled: false },
  22 │     env: {
  23 │       MY_SECRET: ApiKey,
  24 │     },
  25 │   },
  26 │   Effect.gen(function* () {
  27 │     return {
  28 │       fetch: Effect.gen(function* () {
  29 │         const request = yield* HttpServerRequest;
  30 │         const pathname = new URL(request.originalUrl, "http://x").pathname;
  31 │         if (pathname === "/secret") {
  32 │           const env = yield* Cloudflare.Workers.WorkerEnvironment;
  33 │           const secret = (env as Record<string, runtime.SecretsStoreSecret>)
  34 │             .MY_SECRET;
> 35 │           const value = yield* Effect.promise(() => secret.get());
  36 │           return yield* HttpServerResponse.json({
  37 │             value,
  38 │             viaGet: value,
  39 │             viaRaw: value,
  40 │           });
  41 │         }
  42 │         return HttpServerResponse.text("Not Found", { status: 404 });
  43 │       }),
  44 │     };
  45 │   }),
  46 │ ) {}

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:25:3
  24 │ const corsLayer = HttpRouter.cors({
> 25 │   allowedOrigins: ["*"],
  26 │   allowedMethods: ["GET", "POST", "OPTIONS"],
  27 │   allowedHeaders: ["Content-Type"],
  28 │ });

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-async/consumer.ts:16:7
   3 │ export default {
   4 │   async fetch(
   5 │     request: Request,
   6 │     env: { MY_WORKFLOW: Workflow<{ value: string }> },
   7 │   ) {
   8 │     const url = new URL(request.url);
   9 │     if (url.pathname.startsWith("/workflow/start/")) {
  10 │       const value = url.pathname.split("/workflow/start/")[1] ?? "world";
  11 │       const instance = await env.MY_WORKFLOW.create({ params: { value } });
  12 │       return Response.json({ instanceId: instance.id });
  13 │     }
  14 │     if (url.pathname.startsWith("/workflow/status/")) {
  15 │       const id = url.pathname.split("/workflow/status/")[1] ?? "";
> 16 │       const instance = await env.MY_WORKFLOW.get(id);
  17 │       return Response.json(await instance.status());
  18 │     }
  19 │     return new Response("ok");
  20 │   },
  21 │ };

0.79 packages/alchemy/test/Neon/fixtures/backend-effect.ts:35:11
  32 │       fetch: Effect.gen(function* () {
  33 │         const request = yield* HttpServerRequest.HttpServerRequest;
  34 │         if (request.url === "/data-invalid-token") {
> 35 │           const response = yield* data.execute(
  36 │             HttpClientRequest.get(""),
  37 │             Redacted.make("invalid-end-user-token"),
  38 │           );
  39 │           return HttpServerResponse.text(String(response.status));
  40 │         }

0.79 packages/cloudflare-runtime/src/core/bindings/secrets-store/SecretsStore.worker.ts:44:5
  31 │ export default {
  32 │   async fetch(request, env, ctx) {
  33 │     const props = (ctx as { props?: SecretsStoreStoreServiceProps }).props;
  34 │     const encodedHeader = request.headers.get(HEADER_KV_NAMESPACE);
  35 │     const storeId =
  36 │       props?.storeId ??
  37 │       (encodedHeader !== null ? decodeURIComponent(encodedHeader) : undefined);
  38 │     if (storeId === undefined) {
  39 │       return new Response("Missing Secrets Store id", { status: 400 });
  40 │     }
  41 │     const stub = env[BINDING_KV_OBJECT].getByName(storeId);
  42 │     const headers = new Headers(request.headers);
  43 │     headers.set(HEADER_KV_NAMESPACE, encodeURIComponent(storeId));
> 44 │     return stub.fetch(new Request(request, { headers }));
  45 │   },
  46 │ } satisfies ExportedHandler<Env>;

0.78 packages/alchemy/test/AWS/Lambda/fixtures/otel-collector-worker.ts:24:5
  20 │ export default {
  21 │   async fetch(request: Request, env: any): Promise<Response> {
  22 │     const url = new URL(request.url);
  23 │     const sink = env.SINK.get(env.SINK.idFromName("collector"));
> 24 │     if (request.method === "POST" && url.pathname.startsWith("/v1/")) {
  25 │       // Record every push, even an unparseable one, so the test can tell
  26 │       // "export never sent" apart from "export sent but malformed".
  27 │       const raw = await request.text();
  28 │       let payload: unknown;
  29 │       try {
  30 │         payload = JSON.parse(raw);
  31 │       } catch {
  32 │         payload = { parseError: true, raw: raw.slice(0, 1000) };
  33 │       }
  34 │       await sink.add({
  35 │         signal: url.pathname.slice("/v1/".length),
  36 │         payload,
  37 │       });
  38 │       return Response.json({ partialSuccess: {} });
  39 │     }
  40 │     if (url.pathname === "/collected") {
  41 │       return Response.json({
  42 │         marker: "otel-collector-ok",
  43 │         items: await sink.list(),
  44 │       });
  45 │     }
  46 │     return new Response("otel-collector-ok");
  47 │   },
  48 │ };

0.78 packages/alchemy/test/Cloudflare/Queue/round-trip-worker.ts:141:11
  139 │         if (request.method === "GET" && url.pathname === "/count") {
  140 │           const name = url.searchParams.get("name") ?? "default";
> 141 │           const snapshot = yield* counters.getByName(name).snapshot();
  142 │           return yield* HttpServerResponse.json(snapshot);
  143 │         }

0.78 packages/alchemy/test/Cloudflare/Tunnel/fixtures/effect.ts:45:7
  44 │     return {
> 45 │       fetch: Effect.gen(function* () {
  46 │         const request = yield* HttpServerRequest;
  47 │         const url = new URL(request.originalUrl);
  48 │         const name = url.searchParams.get("name") ?? "alchemy-tunnel";

0.78 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/async-platform-handler.ts:23:5
  12 │ export default {
  13 │   async fetch(
  14 │     request: Request,
  15 │     env: AsyncPlatformWorkerEnv,
  16 │   ): Promise<Response> {
  17 │     const url = new URL(request.url);
  18 │     const match = url.pathname.match(/^\/dispatch\/([^/]+)(\/.*)?$/);
  19 │     if (!match) {
  20 │       return new Response("async-platform-worker ok");
  21 │     }
  22 │     const [, scriptName, rest] = match;
> 23 │     const userWorker = env.DISPATCH.get(scriptName);
  24 │     return userWorker.fetch(
  25 │       new Request(`https://user-worker${rest ?? "/"}`, {
  26 │         headers: { "x-custom": request.headers.get("x-custom") ?? "" },
  27 │       }),
  28 │     );
  29 │   },
  30 │ };

0.77 packages/alchemy/test/ACME/fixtures/issue-worker-zerossl.ts:33:11
  31 │         const name = url.searchParams.get("name") ?? "";
  32 │         return yield* Effect.gen(function* () {
> 33 │           const issued = yield* acme.issue({ identifiers: [name], solver });
  34 │           const parsed = yield* ACME.parseCertificate(issued.certificate);
  35 │           yield* acme.revoke({
  36 │             certificate: issued.certificate,
  37 │             privateKey: issued.privateKey,
  38 │           });
  39 │           return yield* HttpServerResponse.json({
  40 │             issuer: issued.issuer,
  41 │             notAfter: issued.notAfter,
  42 │             serial: issued.serial,
  43 │             dnsNames: parsed.dnsNames,
  44 │             hasKey: Redacted.value(issued.privateKey).includes(
  45 │               "BEGIN PRIVATE KEY",
  46 │             ),
  47 │             chainLength: ACME.splitPemChain(issued.chain).length,
  48 │           });
  49 │         }).pipe(
  50 │           // Failures and defects alike come back as JSON so the test can
  51 │           // show what went wrong inside the Worker.
  52 │           Effect.catchCause((cause) =>
  53 │             HttpServerResponse.json(
  54 │               { error: Cause.pretty(cause) },
  55 │               { status: 500 },
  56 │             ),
  57 │           ),
  58 │         );

0.77 packages/alchemy/test/Cloudflare/Stream/fixtures/local-worker.ts:41:9
  40 │       if (url.pathname === "/delete") {
> 41 │         await env.STREAM.video(url.searchParams.get("id")!).delete();
  42 │         return Response.json({ deleted: true });
  43 │       }
  44 │       return new Response("not found", { status: 404 });

0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-http/object.ts:55:9
  54 │       return {
> 55 │         fetch: RpcServer.toHttpEffect(DoRpcs).pipe(
  56 │           Effect.provide(
  57 │             Layer.mergeAll(handlersLayer, RpcSerialization.layerNdjson),
  58 │           ),
  59 │         ),
  60 │       };

0.76 packages/alchemy/test/Cloudflare/Website/fixtures/waku-app/src/pages/_api/api/kv.ts:37:3
  28 │ export const PUT = async (request: Request): Promise<Response> => {
  29 │   const namespace = await kv();
  30 │   if (!namespace) {
  31 │     return Response.json({ error: "SITE_KV is not bound" }, { status: 500 });
  32 │   }
  33 │   const { key, value } = (await request.json()) as {
  34 │     key: string;
  35 │     value: string;
  36 │   };
> 37 │   await namespace.put(key, value);
  38 │   return Response.json({ ok: true, key });
  39 │ };

0.76 packages/frontend-frameworks/fixtures/nuxt/server/api/counter.ts:25:3
  14 │ export default defineEventHandler(async (event) => {
  15 │   const env = (
  16 │     event.context.cloudflare as { env?: Record<string, unknown> } | undefined
  17 │   )?.env;
  18 │   const namespace = env?.COUNTER as CounterNamespace | undefined;
  19 │   if (namespace === undefined) {
  20 │     throw createError({
  21 │       statusCode: 500,
  22 │       statusMessage: "COUNTER binding missing",
  23 │     });
  24 │   }
> 25 │   const stub = namespace.get(namespace.idFromName("fixture"));
  26 │   const count =
  27 │     event.method === "POST" ? await stub.increment() : await stub.get();
  28 │   return { count };
  29 │ });

0.76 packages/frontend-frameworks/fixtures/waku-durable-objects/src/pages/_api/counter.ts:11:3
   7 │ export const GET = async (): Promise<Response> => {
   8 │   const namespace = await counterNamespace();
   9 │   if (!namespace)
  10 │     return Response.json({ error: "COUNTER binding missing" }, { status: 500 });
> 11 │   return Response.json({ count: await namespace.getByName("fixture").get() });
  12 │ };

0.75 packages/alchemy/test/Cloudflare/AI/fixtures/ChatPersistenceRpcWorker.ts:27:9
  14 │ export default class ChatPersistenceRpcWorker extends Cloudflare.RpcWorker<ChatPersistenceRpcWorker>()(
  15 │   "ChatPersistenceRpcWorker",
  16 │   {
  17 │     main: import.meta.url,
  18 │     schema: ChatRpcs,
  19 │   },
  20 │   Effect.gen(function* () {
  21 │     // Yielding the inline DO hosts it on this Worker and hands back the
  22 │     // typed namespace.
  23 │     const chats = yield* ChatBackendRpc;
  24 │
  25 │     const handlers = ChatRpcs.toLayer({
  26 │       send: ({ id, prompt }) =>
> 27 │         Effect.flatMap(chats.getByName(id), (client) =>
  28 │           client.send({ prompt }),
  29 │         ).pipe(Effect.orDie),
  30 │       streamMessage: ({ id, prompt }) =>
  31 │         chats.getByName(id).pipe(
  32 │           Effect.map((client) => client.streamMessage({ prompt })),
  33 │           Stream.unwrap,
  34 │           Stream.orDie,
  35 │         ),
  36 │     });
  37 │
  38 │     return RpcServer.toHttpEffect(ChatRpcs).pipe(
  39 │       Effect.provide(Layer.mergeAll(handlers, RpcSerialization.layerNdjson)),
  40 │     );
  41 │   }),
  42 │ ) {}

0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/object.ts:66:9
  65 │       return {
> 66 │         fetch: HttpApiBuilder.layer(TaskDOApi).pipe(
  67 │           Layer.provide(tasksGroup),
  68 │           Layer.provide([Etag.layer, HttpPlatformStub, Path.layer]),
  69 │           HttpRouter.toHttpEffect,
  70 │         ),
  71 │       };

0.74 packages/alchemy/src/Neon/upgrade.ts:26:7
  13 │ export const upgrade = (options?: {
  14 │   protocol?: string;
  15 │ }): Effect.Effect<
  16 │   {
  17 │     socket: WebSocket;
  18 │     response: HttpServerResponse.HttpServerResponse;
  19 │   },
  20 │   never,
  21 │   RuntimeContext | FunctionRequest
  22 │ > =>
  23 │   Effect.gen(function* () {
  24 │     const request = yield* FunctionRequest;
  25 │     const { socket, response } = yield* Effect.sync(() =>
> 26 │       upgradeWebSocket(request, options),
  27 │     );
  28 │     yield* Effect.sync(() => FunctionUpgradeSockets.set(response, socket));
  29 │     return { socket, response: HttpServerResponse.raw(response) };
  30 │   });

0.74 packages/alchemy/test/Cloudflare/Artifacts/fixtures/routes.ts:31:7
  30 │     if (url.pathname === "/create") {
> 31 │       return yield* client.create(name, { setDefaultBranch: "main" }).pipe(
  32 │         Effect.flatMap((repo) =>
  33 │           HttpServerResponse.json({
  34 │             name: repo.name,
  35 │             remote: repo.remote,
  36 │             defaultBranch: repo.defaultBranch,
  37 │             hasToken: typeof repo.token === "string" && repo.token.length > 0,
  38 │           }),
  39 │         ),
  40 │         Effect.catchTag("ArtifactsError", failWith),
  41 │       );
  42 │     }

0.74 packages/alchemy/test/Cloudflare/R2/fixtures/r2-local-worker.ts:57:7
  56 │     if (url.pathname === "/get") {
> 57 │       const obj = await env.BUCKET.get(url.searchParams.get("key") ?? "");
  58 │       return Response.json({ text: obj === null ? null : await obj.text() });
  59 │     }
  60 │     return new Response("not found", { status: 404 });

0.74 packages/alchemy/test/Cloudflare/Website/fixtures/nuxt-app/server/api/kv.ts:27:3
   9 │ export default defineEventHandler(async (event) => {
  10 │   const env = (
  11 │     event.context.cloudflare as { env?: Record<string, unknown> } | undefined
  12 │   )?.env;
  13 │   const kv = env?.SITE_KV as KvBinding | undefined;
  14 │   if (kv === undefined) {
  15 │     throw createError({
  16 │       statusCode: 500,
  17 │       statusMessage: "SITE_KV binding missing",
  18 │     });
  19 │   }
  20 │   const query = getQuery(event);
  21 │   const key = typeof query.key === "string" ? query.key : "test-key";
  22 │   if (event.method === "PUT") {
  23 │     const value = typeof query.value === "string" ? query.value : "";
  24 │     await kv.put(key, value);
  25 │     return { put: true, key };
  26 │   }
> 27 │   return { key, value: await kv.get(key) };
  28 │ });

0.74 packages/alchemy/test/Prisma/fixtures/write-routes.ts:29:5
  26 │   url: URL,
  27 │ ) =>
  28 │   Effect.gen(function* () {
> 29 │     if (request.method === "PUT" && url.pathname === "/put") {
  30 │       const key = url.searchParams.get("key") ?? "";
  31 │       const metaKey = url.searchParams.get("metaKey");
  32 │       const body = yield* request.text;
  33 │       const object = yield* store
  34 │         .put(key, body, {
  35 │           contentType: url.searchParams.get("contentType") ?? undefined,
  36 │           metadata: metaKey
  37 │             ? { [metaKey]: url.searchParams.get("metaValue") ?? "" }
  38 │             : undefined,
  39 │         })
  40 │         .pipe(Effect.orDie);
  41 │       return yield* HttpServerResponse.json({ ok: true, key: object.key });
  42 │     }

0.73 packages/alchemy/test/AWS/Bedrock/language-model-handler.ts:69:7
  68 │     return {
> 69 │       fetch: Effect.gen(function* () {
  70 │         const request = yield* HttpServerRequest;
  71 │         const url = new URL(request.originalUrl);
  72 │         const pathname = url.pathname;

0.73 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:79:5
  78 │     const userMatch = url.pathname.match(/^\/users\/(\d+)$/);
> 79 │     if (request.method === "GET" && userMatch) {
  80 │       const id = Number(userMatch[1]);
  81 │       const row = yield* db
  82 │         .prepare("SELECT id, name FROM users WHERE id = ? AND style = ?")
  83 │         .bind(id, style)
  84 │         .first<{ id: number; name: string }>();
  85 │       return yield* HttpServerResponse.json({ row });
  86 │     }

0.73 packages/alchemy/test/Cloudflare/Email/fixtures/local-email-worker.ts:14:3
  11 │ type Env = { EMAIL: SendEmailLike };
  12 │
  13 │ export default {
> 14 │   fetch: async (request: Request, env: Env) => {
  15 │     const url = new URL(request.url);

0.73 packages/alchemy/test/Cloudflare/Pipelines/fixtures/async-worker.ts:7:7
   3 │ export default {
   4 │   async fetch(request: Request, env: AsyncWorkerEnv): Promise<Response> {
   5 │     const url = new URL(request.url);
   6 │     if (url.pathname === "/send") {
>  7 │       await env.EVENTS.send([
   8 │         {
   9 │           source: "pipelines-binding-test",
  10 │           nonce: url.searchParams.get("nonce") ?? "none",
  11 │         },
  12 │       ]);
  13 │       return Response.json({
  14 │         mode: "async",
  15 │         sent: true,
  16 │         kind: typeof env.EVENTS.send,
  17 │       });
  18 │     }
  19 │     return Response.json({
  20 │       mode: "async",
  21 │       sent: false,
  22 │       kind: typeof env.EVENTS.send,
  23 │     });
  24 │   },
  25 │ };

0.73 packages/alchemy/test/Cloudflare/Workflows/fixtures/async-workflow-worker.ts:42:7
  29 │ export default {
  30 │   async fetch(request: Request, env: Env) {
  31 │     const path = new URL(request.url).pathname;
  32 │     if (path === "/workflow/name") {
  33 │       return new Response(env.WORKFLOW_NAME);
  34 │     }
  35 │     if (path.startsWith("/workflow/start/")) {
  36 │       const instance = await env.EXISTING_WORKFLOW.create({
  37 │         params: { value: "world" },
  38 │       });
  39 │       return Response.json({ instanceId: instance.id });
  40 │     }
  41 │     if (path.startsWith("/workflow/status/")) {
> 42 │       const instance = await env.EXISTING_WORKFLOW.get(path.split("/").pop()!);
  43 │       return Response.json(await instance.status());
  44 │     }
  45 │     return new Response("ok");
  46 │   },
  47 │ };

0.71 packages/alchemy/test/AWS/EC2/fixtures/network-function.ts:51:9
  34 │   Effect.gen(function* () {
  35 │     const network = yield* EC2.Network("Network", {
  36 │       cidrBlock: "10.77.0.0/16",
  37 │       // numeric — exercises the ec2:DescribeAvailabilityZones discovery path
  38 │       availabilityZones: 2,
  39 │       // exercises the region lookup for the endpoint service name
  40 │       gatewayEndpoints: ["s3"],
  41 │     });
  42 │
  43 │     const VpcId = yield* network.vpcId;
  44 │     const SubnetId = yield* network.publicSubnetIds[0];
  45 │
  46 │     return {
  47 │       fetch: Effect.gen(function* () {
  48 │         const request = yield* HttpServerRequest;
  49 │         const url = new URL(request.originalUrl);
  50 │
> 51 │         if (request.method === "GET" && url.pathname === "/network") {
  52 │           const vpcId = yield* VpcId;
  53 │           const subnetId = yield* SubnetId;
  54 │           return yield* HttpServerResponse.json({ vpcId, subnetId });
  55 │         }
  56 │
  57 │         return HttpServerResponse.text("ok");
  58 │       }).pipe(Effect.orDie),
  59 │     };
  60 │   }),

0.71 packages/alchemy/test/AWS/GeoPlaces/handler.ts:19:5
  16 │ export default GeoPlacesTestFunction.make(
  17 │   {
  18 │     main,
> 19 │     functionUrl: true,
  20 │     // geo-places calls fan out to upstream providers and can exceed Lambda's
  21 │     // 3s default.
  22 │     timeout: Duration.seconds(30),
  23 │   },

0.71 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:34:9
  31 │         const request = yield* HttpServerRequest.HttpServerRequest;
  32 │         const segments = request.url.split("/").filter(Boolean);
  33 │
> 34 │         if (request.method === "POST" && request.url === "/users") {
  35 │           const body = (yield* request.json) as {
  36 │             name: string;
  37 │             email: string;
  38 │           };
  39 │           const [user] = yield* db
  40 │             .insert(Users)
  41 │             .values({ name: body.name, email: body.email })
  42 │             .returning();
  43 │           return yield* HttpServerResponse.json({ user });
  44 │         }

0.71 packages/alchemy/test/Cloudflare/Dns/fixtures/effect.ts:30:9
  27 │         const request = yield* HttpServerRequest;
  28 │         const url = new URL(request.originalUrl);
  29 │
> 30 │         if (url.pathname === "/dns") {
  31 │           const name = url.searchParams.get("name")!;

0.71 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:42:11
  41 │         if (request.method === "GET" && url.pathname === "/widgets") {
> 42 │           const widgets = yield* db.select().from(Widgets);
  43 │           return yield* HttpServerResponse.json({ widgets });
  44 │         }

0.71 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:120:7
  111 │ export default class SqlMySQLWorker extends Cloudflare.Worker<SqlMySQLWorker>()(
  112 │   "SqlMySQLWorker",
  113 │   {
  114 │     main: import.meta.url,
  115 │   },
  116 │   Effect.gen(function* () {
  117 │     const routes = yield* MySQLRoutes;
  118 │
  119 │     return {
> 120 │       fetch: Effect.gen(function* () {
  121 │         const request = yield* HttpServerRequest.HttpServerRequest;
  122 │         const response = yield* routes.handle(request);
  123 │         if (response !== undefined) {
  124 │           return response;
  125 │         }
  126 │         return yield* HttpServerResponse.json(
  127 │           { error: "not found" },
  128 │           { status: 404 },
  129 │         );
  130 │       }).pipe(
  131 │         Effect.catchCause((cause) =>
  132 │           HttpServerResponse.json({ error: String(cause) }, { status: 500 }),
  133 │         ),
  134 │       ),
  135 │     };
  136 │   }).pipe(Effect.provide(Cloudflare.Hyperdrive.ConnectBinding)),
  137 │ ) {}

0.71 packages/alchemy/test/types/PrismaLambda.ts:33:7
  23 │ export const PrismaLambdaApiLive = PrismaLambdaApi.make(
  24 │   {
  25 │     main: import.meta.filename,
  26 │     functionUrl: true,
  27 │   },
  28 │   Effect.gen(function* () {
  29 │     const db = yield* Prisma.Connect(connection);
  30 │
  31 │     return PrismaLambdaApi.of({
  32 │       databaseUrl: () => db.databaseUrl,
> 33 │       fetch: Effect.gen(function* () {
  34 │         const databaseUrl = yield* db.databaseUrl;
  35 │         return yield* HttpServerResponse.json({
  36 │           ok: true,
  37 │           hasDatabaseUrl: Redacted.isRedacted(databaseUrl),
  38 │         });
  39 │       }),
  40 │     });
  41 │   }).pipe(Effect.provide(Prisma.ConnectBinding)),
  42 │ );
```
