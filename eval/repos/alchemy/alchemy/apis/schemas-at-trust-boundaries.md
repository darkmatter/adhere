# alchemy/apis/schemas-at-trust-boundaries

Input from outside the stack, such as browsers, partners, or public URLs, should be validated with a schema through Effect RPC or HttpApi, while calls between the stack's own runtimes should use schemaless RPC through bindings, and unvalidated payloads should not cross a trust boundary.

93 findings, from 0.95 down to 0.71. Each showed this hint:

```ts
const Tasks = HttpApiGroup.make("tasks").add(
  HttpApiEndpoint.post("create", "/tasks", { payload: Schema.Struct({ title: Schema.String }) }),
);
const greeter = yield* Cloudflare.Workers.bindWorker(Greeter); // internal call
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.95 packages/alchemy/test/AWS/DynamoDB/handler.ts:222:13
  220 │         if (request.method === "POST" && pathname === "/batch-get") {
  221 │           const body =
> 222 │             (yield* request.json) as unknown as DynamoDB.BatchGetItemRequest;
  223 │           const result = yield* batchGetItem(body);
  224 │           return yield* HttpServerResponse.json({
  225 │             responses: result.Responses ?? {},
  226 │             unprocessedKeys: result.UnprocessedKeys ?? {},
  227 │           });
  228 │         }

0.94 packages/alchemy/test/AWS/SimpleDB/handler.ts:39:11
  36 │         const pathname = url.pathname;
  37 │
  38 │         if (request.method === "POST" && pathname === "/put") {
> 39 │           const body = (yield* request.json) as unknown as {
  40 │             item: string;
  41 │             attributes: { name: string; value: string; replace?: boolean }[];
  42 │           };
  43 │           yield* putAttributes({
  44 │             ItemName: body.item,
  45 │             Attributes: body.attributes.map((a) => ({
  46 │               Name: a.name,
  47 │               Value: a.value,
  48 │               Replace: a.replace ?? true,
  49 │             })),
  50 │           });
  51 │           return yield* HttpServerResponse.json({ success: true });
  52 │         }

0.93 packages/alchemy/test/AWS/CloudFront/kvs-handler.ts:81:11
  80 │         if (request.method === "POST" && pathname === "/put") {
> 81 │           const body = (yield* request.json) as unknown as {
  82 │             key: string;
  83 │             value: string;
  84 │           };
  85 │           const meta = yield* describeStore({});
  86 │           const res = yield* putKey({
  87 │             Key: body.key,
  88 │             Value: body.value,
  89 │             IfMatch: meta.ETag,
  90 │           });
  91 │           return yield* HttpServerResponse.json({
  92 │             etag: res.ETag,
  93 │             itemCount: res.ItemCount,
  94 │           });
  95 │         }

0.93 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:185:15
  166 │         if (request.method === "POST" && pathname === "/event") {
  167 │           const body = (yield* request.json) as {
  168 │             eventId: string;
  169 │             email: string;
  170 │             ip?: string;
  171 │             entityId?: string;
  172 │           };
  173 │           const emailVarName = yield* emailVar;
  174 │           const ipVarName = yield* ipVar;
  175 │           yield* sendEvent({
  176 │             eventId: body.eventId,
  177 │             eventTimestamp: new Date().toISOString(),
  178 │             entities: [
  179 │               {
  180 │                 entityType: yield* entityTypeName,
  181 │                 entityId: body.entityId ?? "cust-1",
  182 │               },
  183 │             ],
  184 │             eventVariables: {
> 185 │               [emailVarName]: body.email,
  186 │               [ipVarName]: body.ip ?? "1.2.3.4",
  187 │             },
  188 │           });
  189 │           return yield* HttpServerResponse.json({ ok: true });
  190 │         }

0.93 packages/alchemy/test/AWS/Kinesis/handler.ts:181:11
  180 │         if (request.method === "POST" && pathname === "/put-record") {
> 181 │           const body = (yield* request.json) as {
  182 │             partitionKey: string;
  183 │             data: string;
  184 │           };
  185 │           return yield* HttpServerResponse.json(
  186 │             yield* putRecord({
  187 │               PartitionKey: body.partitionKey,
  188 │               Data: new TextEncoder().encode(body.data),
  189 │             }),
  190 │           );
  191 │         }

0.93 packages/alchemy/test/AWS/MediaConvert/handler.ts:83:11
  82 │         if (request.method === "POST" && pathname === "/cancel") {
> 83 │           const body = (yield* request.json) as unknown as { id: string };
  84 │           const result = yield* cancelJob({ Id: body.id }).pipe(
  85 │             Effect.map(() => ({ cancelled: true, error: undefined })),
  86 │             Effect.catch((e) =>
  87 │               Effect.succeed({ cancelled: false, error: e._tag }),
  88 │             ),
  89 │           );
  90 │           return yield* HttpServerResponse.json(result);
  91 │         }

0.93 packages/alchemy/test/AWS/MediaTailor/handler.ts:63:11
  62 │         if (request.method === "POST" && pathname === "/prefetch/create") {
> 63 │           const body = (yield* request.json) as unknown as { name: string };
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

0.93 packages/alchemy/test/AWS/SageMaker/handler.ts:81:11
  80 │         if (request.method === "POST" && pathname === "/put-record") {
> 81 │           const body = (yield* request.json) as unknown as {
  82 │             userId: string;
  83 │             clicks: number;
  84 │           };
  85 │           yield* putRecord({ Record: record(body.userId, body.clicks) });
  86 │           return yield* HttpServerResponse.json({ success: true });
  87 │         }

0.93 packages/alchemy/test/AWS/Timestream/handler.ts:40:11
  37 │         const pathname = new URL(request.originalUrl).pathname;
  38 │
  39 │         if (request.method === "POST" && pathname === "/write") {
> 40 │           const body = (yield* request.json) as unknown as {
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

0.93 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:35:11
  32 │         const segments = request.url.split("/").filter(Boolean);
  33 │
  34 │         if (request.method === "POST" && request.url === "/users") {
> 35 │           const body = (yield* request.json) as {
  36 │             name: string;
  37 │             email: string;
  38 │           };
  39 │           const [user] = yield* db
  40 │             .insert(Users)
  41 │             .values({ name: body.name, email: body.email })
  42 │             .returning();
  43 │           return yield* HttpServerResponse.json({ user });
  44 │         }

0.93 packages/alchemy/test/Planetscale/MySQL/fixtures/hyperdrive-worker.ts:47:11
  46 │         if (request.method === "POST" && url.pathname === "/widgets") {
> 47 │           const body = (yield* request.json) as { id: number; name: string };
  48 │           yield* db
  49 │             .insert(Widgets)
  50 │             .values({ id: body.id, name: body.name })
  51 │             .onDuplicateKeyUpdate({ set: { name: body.name } });
  52 │           const [inserted] = yield* db
  53 │             .select()
  54 │             .from(Widgets)
  55 │             .where(eq(Widgets.id, body.id));
  56 │           return yield* HttpServerResponse.json({ widget: inserted });
  57 │         }

0.93 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:47:11
  46 │         if (request.method === "POST" && url.pathname === "/widgets") {
> 47 │           const body = (yield* request.json) as { id: number; name: string };
  48 │           const [inserted] = yield* db
  49 │             .insert(Widgets)
  50 │             .values({ id: body.id, name: body.name })
  51 │             .onConflictDoUpdate({
  52 │               target: Widgets.id,
  53 │               set: { name: body.name },
  54 │             })
  55 │             .returning();
  56 │           return yield* HttpServerResponse.json({ widget: inserted });
  57 │         }

0.92 packages/alchemy/test/AWS/AMP/handler.ts:47:11
  46 │         if (request.method === "POST" && pathname === "/remote-write") {
> 47 │           const body = (yield* request.json) as unknown as {
  48 │             name: string;
  49 │             labels?: Record<string, string>;
  50 │             value: number;
  51 │             timestamp?: number;
  52 │           };
  53 │           yield* remoteWrite({
  54 │             timeseries: [
  55 │               {
  56 │                 name: body.name,
  57 │                 labels: body.labels,
  58 │                 samples: [{ value: body.value, timestamp: body.timestamp }],
  59 │               },
  60 │             ],
  61 │           });
  62 │           return yield* HttpServerResponse.json({ success: true });
  63 │         }

0.92 packages/alchemy/test/AWS/ApiGateway/fixtures/bindings-handler.ts:68:11
  65 │         const pathname = url.pathname;
  66 │
  67 │         if (request.method === "POST" && pathname === "/keys") {
> 68 │           const body = (yield* request.json) as unknown as { name: string };
  69 │           const created = yield* createApiKey({
  70 │             name: body.name,
  71 │             enabled: true,
  72 │           });
  73 │           yield* createUsagePlanKey({ keyId: created.id! });
  74 │           return yield* HttpServerResponse.json({
  75 │             id: created.id,
  76 │             // Responses decode the key material to Redacted<string> — prove
  77 │             // it round-tripped redacted without ever logging the plaintext.
  78 │             valueRedacted: Redacted.isRedacted(created.value),
  79 │           });
  80 │         }

0.92 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:104:11
  103 │         if (request.method === "POST" && pathname === "/version") {
> 104 │           const body = (yield* request.json) as unknown as {
  105 │             content: string;
  106 │           };
  107 │           const created = yield* createVersion({
  108 │             Content: body.content,
  109 │             ContentType: "application/json",
  110 │           });
  111 │           return yield* HttpServerResponse.json({
  112 │             versionNumber: created.VersionNumber,
  113 │           });
  114 │         }

0.92 packages/alchemy/test/AWS/DSQL/fixtures/drizzle-handler.ts:69:11
  68 │         if (request.method === "POST" && pathname === "/insert") {
> 69 │           const body = (yield* request.json) as unknown as {
  70 │             id: number;
  71 │             title: string;
  72 │           };
  73 │           yield* db.insert(Widgets).values({ id: body.id, title: body.title });
  74 │           return yield* HttpServerResponse.json({ success: true });
  75 │         }

0.92 packages/alchemy/test/AWS/DynamoDB/sink-handler.ts:61:11
  60 │         if (request.method === "POST" && pathname === "/sink") {
> 61 │           const body = (yield* request.json) as {
  62 │             pk: string;
  63 │             puts?: string[];
  64 │             deletes?: string[];
  65 │           };

0.92 packages/alchemy/test/AWS/PaymentCryptography/handler.ts:186:13
  183 │           // BDK at a fixed Key Serial Number.
  184 │           const KSN = "FFFF9876543210E00001";
  185 │           const encrypted = yield* encryptDukpt({
> 186 │             PlainText: body.plainTextHex,
  187 │             EncryptionAttributes: {
  188 │               Dukpt: { KeySerialNumber: KSN, Mode: "CBC" },
  189 │             },
  190 │           });

0.92 packages/alchemy/test/AWS/SNS/handler.ts:167:11
  166 │         if (request.method === "POST" && pathname === "/publish-batch") {
> 167 │           const body = (yield* request.json) as { messages: string[] };
  168 │           const response = yield* publishBatch({
  169 │             PublishBatchRequestEntries: body.messages.map((message, index) => ({
  170 │               Id: `${index}`,
  171 │               Message: message,
  172 │             })),
  173 │           });
  174 │           return yield* HttpServerResponse.json(response);
  175 │         }

0.92 packages/alchemy/test/AWS/Smoke/fixtures/api-handler.ts:140:11
  137 │         // JWT-protected (enforced by the API Gateway JWT authorizer; the
  138 │         // request only reaches this code with a validated Cognito token).
  139 │         if (request.method === "POST" && pathname === "/todo") {
> 140 │           const body = (yield* request.json) as unknown as {
  141 │             id: string;
  142 │             text: string;
  143 │           };
  144 │           yield* putItem({
  145 │             Item: {
  146 │               pk: { S: "todo" },
  147 │               sk: { S: body.id },
  148 │               text: { S: body.text },
  149 │             },
  150 │           });
  151 │           return yield* HttpServerResponse.json({ ok: true, id: body.id });
  152 │         }

0.92 packages/alchemy/test/Fly/fixtures/certificates-api.ts:60:13
  54 │         switch (url.pathname) {
  55 │           case "/health":
  56 │             return yield* HttpServerResponse.json({ ok: true, version: 2 });
  57 │           case "/request":
  58 │             return yield* respond(() => certs.request(hostname));
  59 │           case "/upload": {
> 60 │             const body = (yield* request.json) as {
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

0.91 packages/alchemy/test/AWS/BedrockAgentCore/handler.ts:246:9
  244 │         // Failures surface as a 500 with the typed tag/message in the body
  245 │         // so the suite's transient-retry logging shows the real cause.
> 246 │         if (request.method === "POST" && pathname === "/records/roundtrip") {
  247 │           return yield* recordsRoundtrip.pipe(
  248 │             Effect.catch((error) =>
  249 │               HttpServerResponse.json(
  250 │                 {
  251 │                   error: error._tag,
  252 │                   message: String(
  253 │                     (error as { message?: unknown }).message ?? error,
  254 │                   ),
  255 │                 },
  256 │                 { status: 500 },
  257 │               ),
  258 │             ),
  259 │           );
  260 │         }

0.91 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:47:11
  46 │         if (request.method === "POST" && pathname === "/sink") {
> 47 │           const body = (yield* request.json) as {
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

0.91 packages/alchemy/test/AWS/Logs/sink-handler.ts:55:11
  54 │         if (request.method === "POST" && pathname === "/sink") {
> 55 │           const body = (yield* request.json) as { messages: string[] };
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

0.91 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:115:11
  114 │         if (request.method === "POST" && pathname === "/put") {
> 115 │           const body = (yield* request.json) as { key: string; value: string };
  116 │           const result = yield* putObject({
  117 │             Key: `${INCOMING_PREFIX}${body.key}`,
  118 │             Body: body.value,
  119 │             ContentType: "text/plain",
  120 │           });
  121 │           return yield* HttpServerResponse.json({
  122 │             ok: true,
  123 │             versionId: result.VersionId,
  124 │           });
  125 │         }

0.91 packages/alchemy/test/AWS/SQS/sink-handler.ts:58:11
  57 │         if (request.method === "POST" && pathname === "/sink") {
> 58 │           const body = (yield* request.json) as { messages: string[] };
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

0.91 packages/alchemy/test/AWS/Timestream/sink-handler.ts:66:11
  63 │         // Stream `count` records through the sink. count > 100 proves the
  64 │         // sink splits the stream into <=100-record WriteRecords calls.
  65 │         if (request.method === "POST" && pathname === "/sink") {
> 66 │           const body = (yield* request.json) as unknown as {
  67 │             host: string;
  68 │             count: number;
  69 │           };
  70 │           const base = Date.now() - body.count * 1_000;
  71 │           yield* Stream.fromIterable(
  72 │             Array.from({ length: body.count }, (_, i) =>
  73 │               record(body.host, i, base + i * 1_000),
  74 │             ),
  75 │           ).pipe(Stream.run(sink));
  76 │           return yield* HttpServerResponse.json({
  77 │             ok: true,
  78 │             count: body.count,
  79 │           });
  80 │         }

0.91 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:54:7
  53 │     if (request.method === "POST" && url.pathname === "/users") {
> 54 │       const body = (yield* request.json) as { id: number; name: string };
  55 │       const result = yield* db
  56 │         .prepare(
  57 │           "INSERT OR REPLACE INTO users (id, style, name) VALUES (?, ?, ?)",
  58 │         )
  59 │         .bind(body.id, style, body.name)
  60 │         .run();
  61 │       return yield* HttpServerResponse.json({
  62 │         success: result.success,
  63 │         meta: { changes: result.meta.changes },
  64 │       });
  65 │     }

0.91 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:64:11
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
> 64 │           const body = (yield* request.json) as { id: number; name: string };
  65 │           yield* sql`CREATE TABLE IF NOT EXISTS ${sql(TABLE)} (id INT PRIMARY KEY, name TEXT NOT NULL)`;
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

0.90 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:121:11
  120 │         if (request.method === "POST" && pathname === "/jobs/start") {
> 121 │           const body = (yield* request.json) as {
  122 │             branchName: string;
  123 │             jobType: string;
  124 │           };
  125 │           // A manual-deploy branch has no connected repo, so RELEASE jobs are
  126 │           // rejected by the service — surface the typed tag instead of dying
  127 │           // so the test can assert the binding + IAM wiring end-to-end.
  128 │           const result = yield* startJob({
  129 │             branchName: body.branchName,
  130 │             jobType: body.jobType as "RELEASE",
  131 │           }).pipe(
  132 │             Effect.map((r) => ({
  133 │               started: true as const,
  134 │               jobId: r.jobSummary.jobId,
  135 │             })),
  136 │             Effect.catchTag(["BadRequestException", "NotFoundException"], (e) =>
  137 │               Effect.succeed({ started: false as const, errorTag: e._tag }),
  138 │             ),
  139 │           );
  140 │           return yield* HttpServerResponse.json(result);
  141 │         }

0.90 packages/alchemy/test/AWS/Firehose/handler.ts:74:11
  73 │         if (request.method === "POST" && pathname === "/put-record") {
> 74 │           const body = (yield* request.json) as { data: string };
  75 │           return yield* HttpServerResponse.json(
  76 │             yield* putRecord({
  77 │               Record: { Data: new TextEncoder().encode(`${body.data}\n`) },
  78 │             }),
  79 │           );
  80 │         }

0.90 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:161:11
  160 │         if (request.method === "POST" && pathname === "/retained") {
> 161 │           const body = (yield* request.json) as {
  162 │             topic: string;
  163 │             payload?: string;
  164 │           };
  165 │           // An empty retained payload clears the retained message.
  166 │           yield* publish({
  167 │             topic: body.topic,
  168 │             retain: true,
  169 │             qos: 1,
  170 │             payload: body.payload,
  171 │           });
  172 │           return yield* HttpServerResponse.json({ ok: true });
  173 │         }

0.90 packages/alchemy/test/AWS/KMS/handler.ts:114:11
  113 │         if (request.method === "POST" && pathname === "/decrypt") {
> 114 │           const body = (yield* request.json) as {
  115 │             ciphertextBase64: string;
  116 │             context?: Record<string, string>;
  117 │           };

0.90 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:97:11
   96 │         if (request.method === "POST" && pathname === "/query") {
>  97 │           const body = (yield* request.json) as unknown as {
   98 │             query: string;
   99 │             parameters?: Record<string, unknown>;
  100 │           };
  101 │           const response = yield* executeQuery({
  102 │             queryString: body.query,
  103 │             language: "OPEN_CYPHER",
  104 │             parameters: body.parameters,
  105 │           });
  106 │           const payload = yield* response.payload.pipe(
  107 │             Stream.decodeText,
  108 │             Stream.mkString,
  109 │           );
  110 │           return yield* HttpServerResponse.json(JSON.parse(payload));
  111 │         }

0.90 packages/alchemy/test/AWS/ResourceGroups/handler.ts:139:11
  136 │         // per-resource outcome (a Lambda ARN is not poolable, so it lands
  137 │         // in Failed with a typed error code — proving the full wire loop).
  138 │         if (request.method === "POST" && pathname === "/group") {
> 139 │           const { arn } = (yield* request.json) as { arn: string };
  140 │           const out = yield* groupResources({ ResourceArns: [arn] });
  141 │           return yield* HttpServerResponse.json({
  142 │             succeeded: out.Succeeded ?? [],
  143 │             failedCodes: (out.Failed ?? []).map((f) => f.ErrorCode),
  144 │             pending: (out.Pending ?? []).map((p) => p.ResourceArn),
  145 │           });
  146 │         }

0.90 packages/alchemy/test/AWS/SecretsManager/handler.ts:256:9
> 256 │         if (request.method === "POST" && pathname === "/rotate") {
  257 │           // Error-transparent: surface the typed failure to the test as a
  258 │           // 409 body instead of an opaque 500 from `orDie`.
  259 │           const result = yield* Effect.result(rotateRotationSecret());
  260 │           if (Result.isFailure(result)) {
  261 │             return yield* HttpServerResponse.json(
  262 │               {
  263 │                 error: result.failure._tag,
  264 │                 message:
  265 │                   (result.failure as { Message?: string }).Message ??
  266 │                   (result.failure as { message?: string }).message,
  267 │               },
  268 │               { status: 409 },
  269 │             );
  270 │           }
  271 │           return yield* HttpServerResponse.json({
  272 │             versionId: result.success.VersionId,
  273 │           });
  274 │         }

0.90 packages/alchemy/test/AWS/VpcLattice/handler.ts:58:11
  56 │         // Register a target (for a LAMBDA group: a function ARN).
  57 │         if (request.method === "POST" && pathname === "/register") {
> 58 │           const body = (yield* request.json) as unknown as { id: string };
  59 │           const { successful = [], unsuccessful = [] } = yield* registerTargets(
  60 │             { targets: [{ id: body.id }] },
  61 │           );
  62 │           return yield* HttpServerResponse.json({
  63 │             successful: successful.map((t) => t.id),
  64 │             unsuccessful: unsuccessful.map((t) => ({
  65 │               failureCode: t.failureCode,
  66 │               id: t.id,
  67 │             })),
  68 │           });
  69 │         }

0.90 packages/alchemy/test/Fly/fixtures/bindings-api.ts:129:11
  128 │         if (path === "/secret" && request.method === "POST") {
> 129 │           const body = (yield* request.json) as {
  130 │             name?: string;
  131 │             value?: string;
  132 │           };
  133 │           const name = body.name ?? "BINDING_CREATED";
  134 │           return yield* write
  135 │             .create(name, Redacted.make(body.value ?? "created"))
  136 │             .pipe(
  137 │               Effect.flatMap(() => HttpServerResponse.json({ ok: true, name })),
  138 │               Effect.catch((error) => fail(error)),
  139 │             );
  140 │         }

0.90 packages/alchemy/test/SQL/fixtures/routes.ts:103:9
  100 │       // (the original proxyChain regression), read back with `sql.and` over
  101 │       // nested `sql\`...\`` fragments.
  102 │       if (request.method === "POST" && path === "/users") {
> 103 │         const row = (yield* request.json) as UserRow;
  104 │         yield* sql`INSERT INTO ${sql(table)} ${sql.insert(row)}`;
  105 │         const rows = yield* sql`
  106 │           SELECT id, name, email FROM ${sql(table)}
  107 │           WHERE ${sql.and([sql`name = ${row.name}`, sql`email = ${row.email}`])}
  108 │         `;
  109 │         return yield* HttpServerResponse.json({ rows });
  110 │       }

0.89 packages/alchemy/test/AWS/Batch/handler.ts:115:11
  112 │         const pathname = url.pathname;
  113 │
  114 │         if (request.method === "POST" && pathname === "/submit") {
> 115 │           const body = (yield* request.json) as unknown as {
  116 │             jobName: string;
  117 │           };
  118 │           const result = yield* submitJob({ jobName: body.jobName });
  119 │           return yield* HttpServerResponse.json({
  120 │             jobId: result.jobId,
  121 │             jobName: result.jobName,
  122 │             jobArn: result.jobArn,
  123 │           });
  124 │         }

0.89 packages/alchemy/test/AWS/CloudFront/handler.ts:81:11
  80 │         if (request.method === "POST" && pathname === "/invalidate") {
> 81 │           const body = (yield* request.json) as unknown as {
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

0.89 packages/alchemy/test/AWS/ECS/handler.ts:69:11
  66 │         const pathname = url.pathname;
  67 │
  68 │         if (request.method === "POST" && pathname === "/run") {
> 69 │           const body = (yield* request.json) as unknown as {
  70 │             command?: string[];
  71 │             startedBy?: string;
  72 │           };

0.89 packages/alchemy/test/AWS/EventBridge/sink-handler.ts:89:11
  88 │         if (request.method === "POST" && pathname === "/sink") {
> 89 │           const body = (yield* request.json) as {
  90 │             markers: string[];
  91 │             includeMalformed?: boolean;
  92 │           };

0.89 packages/alchemy/test/AWS/StepFunctions/handler.ts:461:11
  460 │         if (request.method === "POST" && pathname === "/update-map-run") {
> 461 │           const body = (yield* request.json) as unknown as {
  462 │             mapRunArn: string;
  463 │             maxConcurrency?: number;
  464 │           };
  465 │           // UpdateMapRun targets in-progress Map Runs; a completed one
  466 │           // answers with the typed ValidationException — either way the
  467 │           // IAM grant and typed union are exercised.
  468 │           const result = yield* updateMapRun({
  469 │             mapRunArn: body.mapRunArn,
  470 │             maxConcurrency: body.maxConcurrency ?? 2,
  471 │           }).pipe(
  472 │             Effect.map(() => ({ updated: true as const })),
  473 │             Effect.catchTag("ValidationException", () =>
  474 │               Effect.succeed({
  475 │                 updated: false as const,
  476 │                 error: "ValidationException",
  477 │               }),
  478 │             ),
  479 │           );
  480 │           return yield* HttpServerResponse.json(result);
  481 │         }

0.89 packages/alchemy/test/AWS/Transcribe/handler.ts:162:9
> 162 │         switch (route) {

0.89 packages/alchemy/test/Cloudflare/Email/fixtures/worker.ts:21:11
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │         const url = new URL(request.url, "http://x");
  19 │
  20 │         if (url.pathname === "/send") {
> 21 │           const from = url.searchParams.get("from")!;
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

0.89 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:54:11
  39 │       return {
  40 │         fetch: Effect.gen(function* () {
  41 │           const request = yield* HttpServerRequest;
  42 │           if (request.url === "/health") {
  43 │             yield* cache.ping().pipe(Effect.orDie);
  44 │             return HttpServerResponse.text("ready");
  45 │           }
  46 │           const token = yield* Config.Redacted("LEDGER_TOKEN").pipe(
  47 │             Effect.orDie,
  48 │           );
  49 │           if (
  50 │             request.headers.authorization !== `Bearer ${Redacted.value(token)}`
  51 │           ) {
  52 │             return HttpServerResponse.empty({ status: 401 });
  53 │           }
> 54 │           const body = (yield* request.json.pipe(Effect.orDie)) as {
  55 │             operation: keyof typeof scripts;
  56 │             args?: string[];
  57 │           };
  58 │           if (!Object.hasOwn(scripts, body.operation))
  59 │             return HttpServerResponse.empty({ status: 400 });
  60 │           const result = yield* cache
  61 │             .send("EVAL", [scripts[body.operation], 0, ...(body.args ?? [])])
  62 │             .pipe(Effect.orDie);
  63 │           return yield* HttpServerResponse.json({ result });
  64 │         }),
  65 │       };

0.88 packages/alchemy/test/AWS/CloudMap/handler.ts:166:11
  165 │         if (request.method === "POST" && pathname === "/register") {
> 166 │           const body = (yield* request.json) as unknown as {
  167 │             instanceId: string;
  168 │             attributes: Record<string, string>;
  169 │           };
  170 │           const result = yield* registerInstance({
  171 │             InstanceId: body.instanceId,
  172 │             Attributes: body.attributes,
  173 │           });
  174 │           return yield* HttpServerResponse.json({
  175 │             operationId: result.OperationId,
  176 │           });
  177 │         }

0.88 packages/alchemy/test/AWS/CodeDeploy/handler.ts:201:17
  193 │           case "POST /hook/status": {
  194 │             const body = (yield* request.json) as unknown as {
  195 │               deploymentId: string;
  196 │               executionId: string;
  197 │             };
  198 │             const result = yield* errorTagged(
  199 │               putHookStatus({
  200 │                 deploymentId: body.deploymentId,
> 201 │                 lifecycleEventHookExecutionId: body.executionId,
  202 │                 status: "Succeeded",
  203 │               }),
  204 │             );
  205 │             return yield* HttpServerResponse.json(
  206 │               "errorTag" in result ? result : { ok: true },
  207 │             );
  208 │           }

0.88 packages/alchemy/test/AWS/CodePipeline/handler.ts:461:13
  460 │           case "POST /job/failure": {
> 461 │             const body = (yield* request.json) as unknown as {
  462 │               jobId: string;
  463 │             };
  464 │             const result = yield* errorTagged(
  465 │               putJobFailure({
  466 │                 jobId: body.jobId,
  467 │                 failureDetails: {
  468 │                   type: "JobFailed",
  469 │                   message: "failed by bindings test",
  470 │                 },
  471 │               }),
  472 │             );
  473 │             return yield* HttpServerResponse.json(
  474 │               "errorTag" in result ? result : { ok: true },
  475 │             );
  476 │           }

0.88 packages/alchemy/test/AWS/Lambda/HttpServer.fixture.ts:26:5
  25 │   if (request.method === "POST" && pathname === "/jobs") {
> 26 │     const payload = (yield* request.json) as { content: string };
  27 │     const response = yield* HttpServerResponse.json(
  28 │       {
  29 │         method: request.method,
  30 │         url: request.url,
  31 │         payload,
  32 │       },
  33 │       {
  34 │         status: 201,
  35 │         headers: {
  36 │           "x-handler": "lambda-http",
  37 │         },
  38 │       },
  39 │     );
  40 │
  41 │     return HttpServerResponse.setCookieUnsafe(
  42 │       response,
  43 │       "job-session",
  44 │       "created",
  45 │       {
  46 │         httpOnly: true,
  47 │         path: "/",
  48 │       },
  49 │     );
  50 │   }

0.88 packages/alchemy/test/AWS/RDSData/handler.ts:133:11
  132 │         if (request.method === "POST" && pathname === "/insert") {
> 133 │           const body = (yield* request.json) as unknown as {
  134 │             id: number;
  135 │             title: string;
  136 │           };
  137 │           const result = yield* executeStatement({
  138 │             sql: "INSERT INTO todos (id, title) VALUES (:id, :title) ON CONFLICT (id) DO UPDATE SET title = :title",
  139 │             parameters: [
  140 │               { name: "id", value: { longValue: body.id } },
  141 │               { name: "title", value: { stringValue: body.title } },
  142 │             ],
  143 │           });
  144 │           return yield* HttpServerResponse.json({
  145 │             success: true,
  146 │             numberOfRecordsUpdated: result.numberOfRecordsUpdated ?? 0,
  147 │           });
  148 │         }

0.88 packages/alchemy/test/SQL/fixtures/postgres-worker.ts:52:7
  49 │     // POST /tx/commit — statements inside `withTransaction` share one
  50 │     // transaction and commit together.
  51 │     if (request.method === "POST" && request.url === "/tx/commit") {
> 52 │       const rows = (yield* request.json) as UserRow[];
  53 │       yield* sql.withTransaction(
  54 │         Effect.gen(function* () {
  55 │           for (const row of rows) {
  56 │             yield* sql`INSERT INTO ${sql(TABLE)} ${sql.insert(row)}`;
  57 │           }
  58 │         }),
  59 │       );
  60 │       const inserted = yield* sql`
  61 │         SELECT id, name, email FROM ${sql(TABLE)}
  62 │         WHERE ${sql.in(
  63 │           "id",
  64 │           rows.map((r) => r.id),
  65 │         )}
  66 │         ORDER BY id
  67 │       `;
  68 │       return yield* HttpServerResponse.json({ rows: inserted });
  69 │     }

0.87 packages/alchemy/test/AWS/CloudControl/handler.ts:310:11
  309 │         return yield* HttpServerResponse.json(
> 310 │           { error: "Not found", method: request.method, pathname },
  311 │           { status: 404 },
  312 │         );
  313 │       }).pipe(Effect.orDie),

0.87 packages/alchemy/test/AWS/EventBridge/handler.ts:152:11
  151 │         if (request.method === "POST" && pathname === "/publish-default") {
> 152 │           const body = (yield* request.json) as unknown as { marker: string };
  153 │           const result = yield* putEventsDefault({
  154 │             Entries: [
  155 │               {
  156 │                 Source: "alchemy.test.default",
  157 │                 DetailType: "TestEvent",
  158 │                 Detail: JSON.stringify({ marker: body.marker }),
  159 │               },
  160 │             ],
  161 │           });
  162 │           return yield* HttpServerResponse.json({
  163 │             failedEntryCount: result.FailedEntryCount ?? 0,
  164 │             entries: result.Entries ?? [],
  165 │           });
  166 │         }

0.87 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:71:11
  58 │     return {
  59 │       fetch: Effect.gen(function* () {
  60 │         const request = yield* HttpServerRequest;
  61 │         const pathname = new URL(request.originalUrl).pathname;
  62 │
  63 │         if (request.method === "GET" && pathname === "/ready") {
  64 │           return yield* HttpServerResponse.json({
  65 │             ok: true,
  66 │             resultQueueUrl: yield* resultQueueUrl,
  67 │           });
  68 │         }
  69 │
  70 │         if (request.method === "POST" && pathname === "/publish") {
> 71 │           const body = (yield* request.json) as { marker: string };
  72 │           yield* publish({
  73 │             topic: TOPIC,
  74 │             payload: JSON.stringify({ marker: body.marker }),
  75 │           });
  76 │           return yield* HttpServerResponse.json({ ok: true });
  77 │         }
  78 │
  79 │         return yield* HttpServerResponse.json(
  80 │           { error: "Not found", method: request.method, pathname },
  81 │           { status: 404 },
  82 │         );
  83 │       }).pipe(Effect.orDie),
  84 │     };

0.87 packages/alchemy/test/AWS/LexV2/handler.ts:129:11
  126 │         const sessionId = url.searchParams.get("sessionId") ?? "missing";
  127 │
  128 │         if (request.method === "POST" && url.pathname === "/recognize") {
> 129 │           const body = (yield* request.json) as unknown as {
  130 │             text: string;
  131 │             sessionId: string;
  132 │           };
  133 │           return yield* respond(
  134 │             recognizeText({
  135 │               localeId: "en_US",
  136 │               sessionId: body.sessionId,
  137 │               text: body.text,
  138 │             }),
  139 │             (reply) => ({
  140 │               intent: reply.sessionState?.intent?.name ?? null,
  141 │               state: reply.sessionState?.intent?.state ?? null,
  142 │               messages: (reply.messages ?? []).map((message) =>
  143 │                 contentOf(message.content),
  144 │               ),
  145 │               interpretations: (reply.interpretations ?? []).map(
  146 │                 (interpretation) => interpretation.intent?.name,
  147 │               ),
  148 │             }),
  149 │           );
  150 │         }

0.87 packages/alchemy/test/AWS/SNS/platform-handler.ts:74:11
  71 │         const url = new URL(request.originalUrl);
  72 │
  73 │         if (request.method === "POST" && url.pathname === "/endpoint-cycle") {
> 74 │           const body = (yield* request.json) as { token: string };

0.87 packages/alchemy/test/AWS/WAFv2/handler.ts:109:11
  106 │         // Dynamic block list: full-replacement update, LockToken handled
  107 │         // inside the binding.
  108 │         if (request.method === "POST" && pathname === "/ip-set") {
> 109 │           const body = (yield* request.json) as { addresses: string[] };
  110 │           yield* bound.updateIPSet({ addresses: body.addresses });
  111 │           const after = yield* bound.getIPSet();
  112 │           return yield* HttpServerResponse.json({
  113 │             addresses: [...(after.IPSet?.Addresses ?? [])].sort(),
  114 │           });
  115 │         }

0.87 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:62:7
  59 │     // POST /tx/commit — statements inside `withTransaction` share one
  60 │     // transaction and commit together.
  61 │     if (request.method === "POST" && request.url === "/tx/commit") {
> 62 │       const rows = (yield* request.json) as UserRow[];
  63 │       yield* sql.withTransaction(
  64 │         Effect.gen(function* () {
  65 │           for (const row of rows) {
  66 │             yield* sql`INSERT INTO ${sql(TABLE)} ${sql.insert(row)}`;
  67 │           }
  68 │         }),
  69 │       );
  70 │       const inserted = yield* sql`
  71 │         SELECT id, name, email FROM ${sql(TABLE)}
  72 │         WHERE ${sql.in(
  73 │           "id",
  74 │           rows.map((r) => r.id),
  75 │         )}
  76 │         ORDER BY id
  77 │       `;
  78 │       return yield* HttpServerResponse.json({ rows: inserted });
  79 │     }

0.86 packages/alchemy/test/AWS/SQS/handler.ts:104:11
  103 │         if (request.method === "POST" && pathname === "/send-batch") {
> 104 │           const body = (yield* request.json) as unknown as {
  105 │             entries: { id: string; messageBody: string }[];
  106 │           };
  107 │           const result = yield* sendMessageBatch({
  108 │             Entries: body.entries.map((entry) => ({
  109 │               Id: entry.id,
  110 │               MessageBody: entry.messageBody,
  111 │             })),
  112 │           });
  113 │           return yield* HttpServerResponse.json({
  114 │             successful: (result.Successful ?? []).map((s) => ({
  115 │               id: s.Id,
  116 │               messageId: s.MessageId,
  117 │             })),
  118 │             failed: (result.Failed ?? []).map((f) => ({
  119 │               id: f.Id,
  120 │               code: f.Code,
  121 │             })),
  122 │           });
  123 │         }

0.85 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:141:7
  140 │     return {
> 141 │       fetch: Effect.gen(function* () {
  142 │         const request = yield* HttpServerRequest;
  143 │         const url = new URL(request.originalUrl);
  144 │         const pathname = url.pathname;

0.85 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:85:11
  82 │         const pathname = url.pathname;
  83 │
  84 │         if (request.method === "POST" && pathname === "/deploy") {
> 85 │           const body = (yield* request.json) as unknown as {
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

0.85 packages/alchemy/test/AWS/CodeBuild/handler.ts:166:9
  163 │         const url = new URL(request.originalUrl);
  164 │         const pathname = url.pathname;
  165 │         const route = `${request.method} ${pathname}`;
> 166 │         const param = (name: string) => url.searchParams.get(name)!;

0.85 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:35:11
  29 │     return {
  30 │       fetch: Effect.gen(function* () {
  31 │         const request = yield* HttpServerRequest;
  32 │         const url = new URL(request.url, "http://x");
  33 │
  34 │         if (url.pathname === "/send") {
> 35 │           const from = url.searchParams.get("from")!;
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

0.84 packages/alchemy/test/AWS/ACM/handler.ts:184:11
  183 │         if (request.method === "POST" && pathname === "/import") {
> 184 │           const body = (yield* request.json) as unknown as {
  185 │             reimportArn?: string;
  186 │           };
  187 │           const payload = yield* Effect.sync(() => {
  188 │             const encoder = new TextEncoder();
  189 │             return {
  190 │               Certificate: encoder.encode(IMPORT_CERTIFICATE_PEM),
  191 │               PrivateKey: Redacted.make(encoder.encode(IMPORT_PRIVATE_KEY_PEM)),
  192 │             };
  193 │           });
  194 │           const result = yield* importCertificate({
  195 │             CertificateArn: body.reimportArn,
  196 │             ...payload,
  197 │           });
  198 │           return yield* HttpServerResponse.json({
  199 │             arn: result.CertificateArn,
  200 │           });
  201 │         }

0.84 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:271:11
  268 │           // ValidationException paths instead: an IAM gap would surface
  269 │           // AccessDeniedException, so a ValidationException proves the grant
  270 │           // and the typed error union end-to-end.
> 271 │           const body = (yield* request.json) as unknown as {
  272 │             principalArn: string;
  273 │           };

0.84 packages/alchemy/test/AWS/AppFlow/handler.ts:186:11
  185 │         if (request.method === "POST" && pathname === "/cancel") {
> 186 │           const body = (yield* request.json) as {
  187 │             executionIds?: string[];
  188 │           };
  189 │           const response = yield* cancelFlowExecutions({
  190 │             executionIds: body.executionIds,
  191 │           }).pipe(
  192 │             Effect.match({
  193 │               onFailure: (error) => ({
  194 │                 ok: false as const,
  195 │                 error: error._tag,
  196 │               }),
  197 │               onSuccess: (value) => ({
  198 │                 ok: true as const,
  199 │                 invalidExecutions: value.invalidExecutions ?? [],
  200 │               }),
  201 │             }),
  202 │           );
  203 │           return yield* HttpServerResponse.json(response);
  204 │         }

0.84 packages/alchemy/test/Prisma/fixtures/write-routes.ts:32:7
  29 │     if (request.method === "PUT" && url.pathname === "/put") {
  30 │       const key = url.searchParams.get("key") ?? "";
  31 │       const metaKey = url.searchParams.get("metaKey");
> 32 │       const body = yield* request.text;
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

0.83 packages/alchemy/test/AWS/DataBrew/handler.ts:184:13
  183 │           case "POST /run/stop": {
> 184 │             const body = (yield* request.json) as unknown as { id: string };
  185 │             const result = yield* errorTagged(stopJobRun({ RunId: body.id }));
  186 │             return yield* HttpServerResponse.json(
  187 │               "errorTag" in result ? result : { runId: result.RunId },
  188 │             );
  189 │           }

0.82 packages/alchemy/src/Git/GitHubCompat.ts:661:13
  660 │           const body = raw as {
> 661 │             commit_message?: string;
  662 │             sha?: string;
  663 │             merge_method?: string;
  664 │           };

0.82 packages/alchemy/test/Cloudflare/Email/fixtures/local-worker.ts:30:11
  25 │     const send = Effect.fn(function* (client: Cloudflare.Email.SendClient) {
  26 │       const request = yield* HttpServerRequest;
  27 │       const url = new URL(request.url, "http://x");
  28 │       const result = yield* client
  29 │         .send({
> 30 │           from: url.searchParams.get("from")!,
  31 │           to: url.searchParams.get("to")!,
  32 │           subject: url.searchParams.get("subject") ?? "alchemy local test",
  33 │           text: "sent from the alchemy dev-mode send_email test",
  34 │         })
  35 │         .pipe(
  36 │           Effect.match({
  37 │             onSuccess: () => ({ ok: true as const }),
  38 │             onFailure: (err) => ({
  39 │               ok: false as const,
  40 │               message: err.message,
  41 │             }),
  42 │           }),
  43 │         );
  44 │       return yield* HttpServerResponse.json(result);
  45 │     });

0.80 packages/frontend-frameworks/fixtures/waku/src/pages/_api/echo.ts:11:3
  10 │ export const POST = async (request: Request): Promise<Response> => {
> 11 │   const body = (await request.json()) as Record<string, unknown>;
  12 │   return Response.json({ echoed: body, message: await readMessage() });
  13 │ };

0.79 packages/alchemy/test/AWS/CloudFormation/handler.ts:187:11
  186 │         if (request.method === "POST" && pathname === "/validate") {
> 187 │           const body = (yield* request.json) as unknown as {
  188 │             template?: string;
  189 │           };
  190 │           return yield* HttpServerResponse.json(
  191 │             yield* tagOr(
  192 │               validateTemplate({
  193 │                 TemplateBody: body.template ?? template,
  194 │               }),
  195 │               (result) => ({
  196 │                 parameters: (result.Parameters ?? []).map(
  197 │                   (p) => p.ParameterKey,
  198 │                 ),
  199 │                 capabilities: result.Capabilities ?? [],
  200 │               }),
  201 │             ),
  202 │           );
  203 │         }

0.79 packages/alchemy/test/Cloudflare/Website/fixtures/nextjs-app/app/api/kv/route.ts:12:3
  11 │ export async function PUT(request: Request) {
> 12 │   const { key, value } = (await request.json()) as {
  13 │     key: string;
  14 │     value: string;
  15 │   };
  16 │   const { env } = getCloudflareContext();
  17 │   await env.FIXTURE_KV.put(key, value);
  18 │   return Response.json({ ok: true });
  19 │ }

0.79 packages/alchemy/test/Cloudflare/Website/fixtures/waku-app/src/pages/_api/api/kv.ts:33:3
  28 │ export const PUT = async (request: Request): Promise<Response> => {
  29 │   const namespace = await kv();
  30 │   if (!namespace) {
  31 │     return Response.json({ error: "SITE_KV is not bound" }, { status: 500 });
  32 │   }
> 33 │   const { key, value } = (await request.json()) as {
  34 │     key: string;
  35 │     value: string;
  36 │   };
  37 │   await namespace.put(key, value);
  38 │   return Response.json({ ok: true, key });
  39 │ };

0.78 packages/alchemy/test/AWS/AppSync/fixtures/bindings-handler.ts:91:11
   88 │         const pathname = new URL(request.originalUrl).pathname;
   89 │
   90 │         if (request.method === "POST" && pathname === "/graphql") {
>  91 │           const body = (yield* request.json) as unknown as {
   92 │             query: string;
   93 │             variables?: Record<string, unknown>;
   94 │           };
   95 │           const result = yield* graphql.execute({
   96 │             query: body.query,
   97 │             variables: body.variables,
   98 │           });
   99 │           return yield* HttpServerResponse.json(result);
  100 │         }

0.78 packages/alchemy/test/Cloudflare/D1/fixtures/async-worker.ts:43:7
  42 │     if (request.method === "POST" && url.pathname === "/users") {
> 43 │       const body = (await request.json()) as { id: number; name: string };
  44 │       const result = await db
  45 │         .prepare(
  46 │           "INSERT OR REPLACE INTO users (id, style, name) VALUES (?, ?, ?)",
  47 │         )
  48 │         .bind(body.id, STYLE, body.name)
  49 │         .run();
  50 │       return Response.json({
  51 │         success: result.success,
  52 │         meta: { changes: result.meta.changes },
  53 │       });
  54 │     }

0.78 packages/alchemy/test/Cloudflare/Queue/fixtures/dedicated-producer-worker.ts:19:13
   8 │ export default class ProducerWorker extends Cloudflare.Worker<ProducerWorker>()(
   9 │   "dedicated-producer-worker",
  10 │   { main: import.meta.url },
  11 │   Effect.gen(function* () {
  12 │     const queue = yield* Cloudflare.Queues.WriteQueue(yield* DedicatedQueue);
  13 │     return {
  14 │       fetch: Effect.gen(function* () {
  15 │         const request = yield* HttpServerRequest;
  16 │         const url = new URL(request.url, "http://x");
  17 │         if (url.pathname === "/send") {
  18 │           yield* queue
> 19 │             .send({ text: url.searchParams.get("text") ?? "hello" })
  20 │             .pipe(Effect.orDie);
  21 │           return yield* HttpServerResponse.json(
  22 │             { sent: true },
  23 │             { status: 202 },
  24 │           );
  25 │         }
  26 │         return HttpServerResponse.text("Not Found", { status: 404 });
  27 │       }),
  28 │     };
  29 │   }).pipe(Effect.provide(Cloudflare.Queues.WriteQueueBinding)),
  30 │ ) {}

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow/workflow-worker.ts:20:11
  17 │         const request = yield* HttpServerRequest;
  18 │
  19 │         if (request.url.startsWith("/workflow/start/")) {
> 20 │           const value = request.url.split("/workflow/start/")[1] ?? "world";
  21 │           const instance = yield* workflow.create({ params: { value } });
  22 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  23 │         }

0.76 packages/alchemy/test/Cloudflare/Queue/round-trip-worker.ts:121:11
  119 │         if (request.method === "POST" && url.pathname === "/send") {
  120 │           const name = url.searchParams.get("name") ?? "default";
> 121 │           const text = yield* request.text;
  122 │           yield* queue.send({ name, text }).pipe(Effect.orDie);
  123 │           return yield* HttpServerResponse.json(
  124 │             { sent: { name, text } },
  125 │             { status: 202 },
  126 │           );
  127 │         }

0.75 packages/alchemy/test/ACME/fixtures/issue-worker.ts:32:9
  29 │         if (url.pathname !== "/issue") {
  30 │           return yield* HttpServerResponse.json({ ok: true, version: 2 });
  31 │         }
> 32 │         const name = url.searchParams.get("name") ?? "";

0.75 packages/alchemy/test/Cloudflare/Website/fixtures/waku-app/src/pages/_api/echo.ts:11:3
  10 │ export const POST = async (request: Request): Promise<Response> => {
> 11 │   const body = (await request.json()) as Record<string, unknown>;
  12 │   return Response.json({ echoed: body, message: await readMessage() });
  13 │ };

0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-collector-worker.ts:27:9
  20 │ export default {
  21 │   async fetch(request: Request, env: any): Promise<Response> {
  22 │     const url = new URL(request.url);
  23 │     const sink = env.SINK.get(env.SINK.idFromName("collector"));
  24 │     if (request.method === "POST" && url.pathname.startsWith("/v1/")) {
  25 │       await sink.add({
  26 │         signal: url.pathname.slice("/v1/".length),
> 27 │         payload: await request.json(),
  28 │       });
  29 │       return Response.json({ partialSuccess: {} });
  30 │     }
  31 │     if (url.pathname === "/collected") {
  32 │       return Response.json({
  33 │         marker: "otel-collector-ok",
  34 │         items: await sink.list(),
  35 │       });
  36 │     }
  37 │     return new Response("otel-collector-ok");
  38 │   },
  39 │ };

0.74 packages/alchemy/test/AWS/Lambda/fixtures/otel-collector-worker.ts:30:9
  20 │ export default {
  21 │   async fetch(request: Request, env: any): Promise<Response> {
  22 │     const url = new URL(request.url);
  23 │     const sink = env.SINK.get(env.SINK.idFromName("collector"));
  24 │     if (request.method === "POST" && url.pathname.startsWith("/v1/")) {
  25 │       // Record every push, even an unparseable one, so the test can tell
  26 │       // "export never sent" apart from "export sent but malformed".
  27 │       const raw = await request.text();
  28 │       let payload: unknown;
  29 │       try {
> 30 │         payload = JSON.parse(raw);
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

0.74 packages/cloudflare-runtime/src/core/remote-bindings/RemoteBindings.ts:66:9
  62 │     const serviceDesignator = yield* loopback.api.route(
  63 │       "remote-bindings",
  64 │       Effect.gen(function* () {
  65 │         const request = yield* HttpServerRequest.HttpServerRequest;
> 66 │         const json = (yield* request.json) as unknown as RemoteWorkerConfig;
  67 │         const hash = Hash.structure(json);
  68 │         const prefetched = prefetches.get(hash);
  69 │         if (prefetched) {
  70 │           prefetches.delete(hash);
  71 │         }
  72 │         const deploy = prefetched
  73 │           ? Fiber.join(prefetched)
  74 │           : remoteWorker.deploy(json);
  75 │         return yield* deploy.pipe(
  76 │           Effect.flatMap((result) =>
  77 │             HttpServerResponse.json({ ok: true, result }),
  78 │           ),
  79 │           Effect.tapCause((cause) => Effect.logError(Cause.pretty(cause))),
  80 │           Effect.catch((error) =>
  81 │             HttpServerResponse.json({ ok: false, error }, { status: 500 }),
  82 │           ),
  83 │         );
  84 │       }),
  85 │     );

0.73 packages/alchemy/test/AWS/ApiGatewayV2/http-handler.ts:50:11
  49 │         if (request.method === "POST" && pathname === "/items") {
> 50 │           const body = (yield* request.json) as unknown;
  51 │           return yield* HttpServerResponse.json(
  52 │             { received: body },
  53 │             { status: 201 },
  54 │           );
  55 │         }

0.73 packages/alchemy/test/AWS/Website/fixtures/waku-app/src/pages/_api/echo.ts:11:3
  10 │ export const POST = async (request: Request): Promise<Response> => {
> 11 │   const body = (await request.json()) as Record<string, unknown>;
  12 │   return Response.json({ marker: "WAKU_AWS_API_MARKER", echoed: body });
  13 │ };

0.72 packages/alchemy/src/Cloudflare/Workers/GitHubRepositoryEventSource.ts:146:5
  143 │     // statically prove `name`/`payload` line up with a specific member of
  144 │     // the discriminated union — GitHub's headers are the source of truth, so
  145 │     // cast across the boundary.
> 146 │     const delivery = { id, name, payload } as unknown as WebhookEvent;
  147 │
  148 │     yield* process(delivery).pipe(Effect.orDie);

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-pause/worker.ts:20:11
  15 │     return {
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │
  19 │         if (request.url.startsWith("/workflow/start/")) {
> 20 │           const value = request.url.split("/workflow/start/")[1] ?? "world";
  21 │           const instance = yield* workflow.create({ params: { value } });
  22 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  23 │         }
  24 │
  25 │         if (request.url.startsWith("/workflow/pause/")) {
  26 │           const instanceId = request.url.split("/workflow/pause/")[1] ?? "";
  27 │           const instance = yield* workflow.get(instanceId);
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

0.72 packages/frontend-frameworks/fixtures/astro-ssr/src/pages/api/hello.ts:15:3
  13 │ /** JSON echo for non-GET methods, proving on-demand API routing under SSR. */
  14 │ export async function POST({ request }: { request: Request }) {
> 15 │   const body = (await request.json()) as Record<string, unknown>;
  16 │   return Response.json({ echoed: body, method: "POST" });
  17 │ }

0.71 packages/alchemy/src/Git/Hasher/WorkerLoaderModule.ts:47:5
  44 │     if (![base, remaining, maxObjectSize, skip].every(Number.isFinite)) {
  45 │       return new Response("bad coordinates", { status: 400 });
  46 │     }
> 47 │     const body = new Uint8Array(await request.arrayBuffer());

0.71 packages/alchemy/test/Cloudflare/KV/fixtures/write-routes.ts:25:7
  17 │ export const writeRoutes = (
  18 │   kv: WriteNamespaceClient,
  19 │   request: HttpServerRequest.HttpServerRequest,
  20 │   url: URL,
  21 │ ) =>
  22 │   Effect.gen(function* () {
  23 │     if (request.method === "PUT" && url.pathname === "/put") {
  24 │       const key = url.searchParams.get("key") ?? "";
> 25 │       const body = yield* request.text;
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
```
