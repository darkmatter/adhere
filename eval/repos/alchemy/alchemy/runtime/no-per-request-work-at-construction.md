# alchemy/runtime/no-per-request-work-at-construction

A runtime's construction Effect runs at deploy time and again at cold start, so it must only build resources, bindings, layers, and handler groups, never do per-request work such as queries, writes, bound calls, or starting consumers.

66 findings, from 0.93 down to 0.71. Each showed this hint:

```ts
Effect.gen(function* () {
  const table = yield* AWS.DynamoDB.Table("Jobs", { partitionKey: "id", attributes: { id: "S" } });
  const putItem = yield* AWS.DynamoDB.PutItem(table);
  return {
    fetch: Effect.gen(function* () {
      yield* putItem({ Item: { id: { S: crypto.randomUUID() } } });
      return HttpServerResponse.empty({ status: 202 });
    }),
  };
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.93 packages/alchemy/test/Stripe/fixtures/event-source-worker.ts:17:5
  14 │     const kv = yield* Cloudflare.KV.ReadWriteNamespace(log);
  15 │     const createCustomer = yield* Stripe.CreateCustomer();
  16 │
> 17 │     yield* Stripe.consumeEvents(
  18 │       "Events",
  19 │       { events: [Stripe.CustomerCreated] },
  20 │       Effect.fn(function* (event) {
  21 │         yield* kv.put(event.object.id, "1").pipe(Effect.orDie);
  22 │         yield* kv.put("lastCustomerId", event.object.id).pipe(Effect.orDie);
  23 │       }),
  24 │     ).pipe(Effect.orDie);

0.88 packages/alchemy/test/AWS/Kinesis/stream-handler.ts:44:5
  41 │     const { stream, queue } = yield* StreamAndQueue;
  42 │     const sink = yield* AWS.SQS.QueueSink(queue);
  43 │
> 44 │     yield* AWS.Kinesis.consumeStreamRecords(
  45 │       stream,
  46 │       {
  47 │         startingPosition: "LATEST",
  48 │         batchSize: 10,
  49 │       },
  50 │       (records) =>
  51 │         records.pipe(
  52 │           Stream.map((record) => ({
  53 │             MessageBody: JSON.stringify({
  54 │               partitionKey: record.kinesis.partitionKey,
  55 │               data: Buffer.from(record.kinesis.data, "base64").toString("utf8"),
  56 │               eventID: record.eventID,
  57 │             }),
  58 │           })),
  59 │           Stream.run(sink),
  60 │           Effect.orDie,
  61 │         ),
  62 │     );

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:27:7
  25 │     return Effect.gen(function* () {
  26 │       const constructors = (yield* storage.get<string[]>("constructors")) ?? [];
> 27 │       yield* storage.put("constructors", [...constructors, "v2"]);

0.87 packages/alchemy/test/AWS/MediaConvert/handler.ts:38:5
  35 │     // Deploy-time: creates the EventBridge rule (default bus, source
  36 │     // aws.mediaconvert) targeting this Function. The test verifies the rule
  37 │     // deploys; runtime firing would require a billable transcode.
> 38 │     yield* MediaConvert.consumeJobEvents(
  39 │       { statuses: ["COMPLETE", "ERROR"] },
  40 │       (events) =>
  41 │         Stream.runForEach(events, (event) =>
  42 │           Effect.log(
  43 │             `mediaconvert job event: ${event.detail.jobId} -> ${event.detail.status}`,
  44 │           ),
  45 │         ),
  46 │     );

0.87 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:18:7
  16 │     return Effect.gen(function* () {
  17 │       // runtime
> 18 │       yield* state.storage.sql.exec(
  19 │         "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)",
  20 │       );

0.87 packages/cloudflare-runtime/src/rolldown/test/fixtures/regression/mysql2.ts:10:5
   7 │ export default {
   8 │   fetch(_request: Request, env: Env) {
   9 │     const db = mysql2.createConnection(env.DATABASE_URL);
> 10 │     const result = db.execute("SELECT 1");
  11 │     return Response.json(result);
  12 │   },
  13 │ };

0.86 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations-upgrade/worker.ts:16:7
   7 │ class UpgradeObject extends Cloudflare.DurableObject<UpgradeObject>()(
   8 │   "SqlMigrationUpgradeObject",
   9 │   Effect.gen(function* () {
  10 │     const dir = yield* Config.String("SQL_MIGRATIONS_DIRECTORY").pipe(
  11 │       Effect.orDie,
  12 │     );
  13 │     const migrations = yield* Cloudflare.SqlMigrations(dir);
  14 │     return Effect.gen(function* () {
  15 │       const state = yield* Cloudflare.DurableObjectState;
> 16 │       yield* migrations.apply().pipe(Effect.orDie);
  17 │       return {
  18 │         inspect: () =>
  19 │           Effect.gen(function* () {
  20 │             const rows = yield* state.storage.sql
  21 │               .exec<{ value: string }>("SELECT value FROM items ORDER BY rowid")
  22 │               .pipe(Effect.flatMap((cursor) => cursor.toArray()));
  23 │             return {
  24 │               id: state.id.toString(),
  25 │               count: migrations.records.length,
  26 │               rows,
  27 │             };
  28 │           }),
  29 │         insert: () =>
  30 │           state.storage.sql
  31 │             .exec("INSERT INTO items VALUES ('user-data')")
  32 │             .pipe(Effect.asVoid),
  33 │       };
  34 │     });
  35 │   }),
  36 │ ) {}

0.85 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:63:5
> 63 │     yield* AppConfig.consumeDeploymentEvents(
  64 │       env,
  65 │       { events: ["ON_DEPLOYMENT_START", "ON_DEPLOYMENT_COMPLETE"] },
  66 │       (events) =>
  67 │         events.pipe(
  68 │           Stream.runForEach((event) =>
  69 │             putObject({
  70 │               Key: `events/${event.DeploymentNumber}-${event.Type}.json`,
  71 │               Body: JSON.stringify(event),
  72 │               ContentType: "application/json",
  73 │             }).pipe(Effect.orDie),
  74 │           ),
  75 │         ),
  76 │     );

0.85 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:58:5
  57 │     // Deploy the version to the environment so the data plane can serve it.
> 58 │     yield* AppConfig.Deployment("Deploy", {
  59 │       applicationId: app.applicationId,
  60 │       environmentId: env.environmentId,
  61 │       deploymentStrategyId: strategy.deploymentStrategyId,
  62 │       configurationProfileId: profile.configurationProfileId,
  63 │       configurationVersion: Output.interpolate`${version.versionNumber}`,
  64 │     });

0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/object.ts:17:7
  14 │   Effect.gen(function* () {
  15 │     const state = yield* Cloudflare.DurableObjectState;
  16 │     return Effect.gen(function* () {
> 17 │       const boots = ((yield* state.storage.get<number>("boots")) ?? 0) + 1;
  18 │       yield* state.storage.put("boots", boots);
  19 │       const opened: string[] = [];
  20 │       const closed: string[] = [];

0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:104:7
  102 │     return Effect.gen(function* () {
  103 │       const state = yield* Cloudflare.DurableObjectState;
> 104 │       yield* snapshot.apply().pipe(Effect.orDie);
  105 │       const inspect = () =>
  106 │         Effect.gen(function* () {
  107 │           const rows = yield* state.storage.sql
  108 │             .exec<{ value: string }>(
  109 │               "SELECT value FROM flat_values ORDER BY id",
  110 │             )
  111 │             .pipe(Effect.flatMap((cursor) => cursor.toArray()));
  112 │           return {
  113 │             tag: snapshot._tag,
  114 │             table: snapshot.table,
  115 │             names: snapshot.records.map((record) => record.name),
  116 │             history: yield* history(state, snapshot.table),
  117 │             tables: yield* tables(state),
  118 │             values: rows.map((row) => row.value),
  119 │           };
  120 │         });
  121 │       return {
  122 │         inspect,
  123 │         repeat: () =>
  124 │           snapshot
  125 │             .apply()
  126 │             .pipe(
  127 │               Effect.andThen(inspect),
  128 │               Effect.provideService(Cloudflare.DurableObjectState, state),
  129 │             ),
  130 │       };
  131 │     });

0.85 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:121:13
  117 │       if (globalThis.__ALCHEMY_RUNTIME__) {
  118 │         yield* Effect.addFinalizer(() =>
  119 │           Effect.gen(function* () {
  120 │             const client = yield* connect;
> 121 │             yield* event(client, "shared-closed");
  122 │             sharedOpen = false;
  123 │           }).pipe(Effect.scoped),
  124 │         );
  125 │       }

0.84 packages/alchemy/src/Server/SQSQueueEventSource.ts:30:9
  27 │       const deleteMessageBatch = yield* DeleteMessageBatch(queue);
  28 │
  29 │       yield* run(
> 30 │         Effect.forever(

0.84 packages/alchemy/test/AWS/Logs/event-source-handler.ts:50:5
  46 │   Effect.gen(function* () {
  47 │     const { source, result } = yield* SourceGroupAndResultQueue;
  48 │     const sink = yield* AWS.SQS.QueueSink(result);
  49 │
> 50 │     yield* AWS.Logs.consumeLogEvents(source, { filterPattern: "" }, (events) =>
  51 │       events.pipe(
  52 │         Stream.map((event) => ({ MessageBody: event.message })),
  53 │         Stream.run(sink),
  54 │         Effect.orDie,
  55 │       ),
  56 │     );
  57 │
  58 │     const sourceLogGroupName = yield* source.logGroupName;
  59 │     const resultQueueUrl = yield* result.queueUrl;
  60 │
  61 │     return {
  62 │       fetch: Effect.gen(function* () {
  63 │         return yield* HttpServerResponse.json({
  64 │           ok: true,
  65 │           sourceLogGroupName: yield* sourceLogGroupName,
  66 │           resultQueueUrl: yield* resultQueueUrl,
  67 │         });
  68 │       }).pipe(Effect.orDie),
  69 │     };
  70 │   }).pipe(

0.84 packages/alchemy/test/AWS/SNS/handler.ts:181:13
  177 │         if (request.method === "POST" && pathname === "/sink") {
  178 │           const body = (yield* request.json) as { messages: string[] };
  179 │           yield* Stream.fromIterable(body.messages).pipe(
  180 │             Stream.map((message) => ({ Message: message })),
> 181 │             Stream.run(sink),
  182 │           );
  183 │           return yield* HttpServerResponse.json({ ok: true });
  184 │         }

0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:28:7
  13 │   constructor(ctx: DurableObjectState, env: unknown) {
  14 │     super(ctx, env);
  15 │     ctx.storage.sql.exec(`
  16 │       CREATE TABLE IF NOT EXISTS alchemy_scheduled_events (
  17 │         id TEXT PRIMARY KEY,
  18 │         run_at INTEGER NOT NULL,
  19 │         repeat_ms INTEGER,
  20 │         payload TEXT NOT NULL
  21 │       );
  22 │       CREATE INDEX IF NOT EXISTS idx_alchemy_scheduled_events_run_at
  23 │         ON alchemy_scheduled_events (run_at);
  24 │     `);
  25 │     ctx.blockConcurrencyWhile(async () => {
  26 │       const constructors =
  27 │         (await ctx.storage.get<string[]>("constructors")) ?? [];
> 28 │       await ctx.storage.put("constructors", [...constructors, "v1"]);
  29 │     });
  30 │   }

0.84 packages/alchemy/test/Railway/fixtures/rpc-caller.ts:24:9
  13 │ export default class Caller extends Function<Caller>()(
  14 │   "Caller",
  15 │   {
  16 │     project: Site,
  17 │     environment: Partition,
  18 │     main: import.meta.url,
  19 │   },
  20 │   Effect.gen(function* () {
  21 │     const greeter = yield* bindFunction(Greeter);
  22 │     return {
  23 │       fetch: greeter
> 24 │         .greet("sam")
  25 │         .pipe(Effect.map((greeting) => HttpServerResponse.text(greeting))),
  26 │     };
  27 │   }),
  28 │ ) {}

0.83 packages/alchemy/test/AWS/Backup/handler.ts:101:9
   98 │     yield* Backup.consumeBackupEvents(
   99 │       { kinds: ["backup-job", "restore-job"] },
  100 │       (events) =>
> 101 │         Stream.runForEach(events, (event) =>
  102 │           Effect.log(`backup event: ${event.detail.state}`),
  103 │         ),
  104 │     );

0.83 packages/alchemy/test/AWS/EventBridge/handler.ts:102:11
   90 │     yield* AWS.EventBridge.consumeBusEvents(
   91 │       bus,
   92 │       { source: ["alchemy.test.custom"] },
   93 │       (events: Stream.Stream<AWS.EventBridge.EventRecord>) =>
   94 │         events.pipe(
   95 │           Stream.map((event) => ({
   96 │             MessageBody: JSON.stringify({
   97 │               source: event.source,
   98 │               detailType: event["detail-type"],
   99 │               detail: event.detail,
  100 │             }),
  101 │           })),
> 102 │           Stream.run(customSink),
  103 │           Effect.orDie,
  104 │         ),
  105 │     );

0.83 packages/alchemy/test/AWS/Shield/handler.ts:54:5
  51 │     // (AWS Health, source `aws.health`, service SHIELD). The deploy proves
  52 │     // the EventBridge rule + invoke permission wiring; events only fire on
  53 │     // subscribed accounts under active attack.
> 54 │     yield* Shield.consumeAttackEvents({}, (events) =>
  55 │       Stream.runForEach(events, (event) =>
  56 │         Effect.log(`shield attack event: ${event.detail.eventTypeCode}`),
  57 │       ),
  58 │     );

0.82 packages/alchemy/test/AWS/CodePipeline/handler.ts:181:5
  173 │     yield* CodePipeline.consumePipelineEvents(
  174 │       { kinds: ["execution"], pipelineNames: [FIXTURE_PIPELINE_NAME] },
  175 │       (events) =>
  176 │         Stream.runForEach(events, (event) =>
  177 │           Effect.log(
  178 │             `codepipeline event: ${event.detail.pipeline} -> ${event.detail.state}`,
  179 │           ),
  180 │         ),
> 181 │     );

0.81 packages/alchemy/test/AWS/CloudTrail/handler.ts:65:5
  62 │     // records; write a marker object per PutBucketTagging call so
  63 │     // /events/check can observe the delivery out-of-band (the event may
  64 │     // arrive on another instance).
> 65 │     yield* CloudTrail.consumeApiCallEvents(
  66 │       {
  67 │         eventSources: ["s3.amazonaws.com"],
  68 │         eventNames: ["PutBucketTagging"],
  69 │       },
  70 │       (events) =>
  71 │         Stream.runForEach(events, (event) =>
  72 │           putObject({
  73 │             Key: `events/${event.detail.requestParameters?.bucketName}`,
  74 │             Body: JSON.stringify({
  75 │               eventName: event.detail.eventName,
  76 │               eventSource: event.detail.eventSource,
  77 │               eventID: event.detail.eventID,
  78 │             }),
  79 │             ContentType: "application/json",
  80 │           }).pipe(Effect.orDie, Effect.asVoid),
  81 │         ),
  82 │     );

0.80 packages/alchemy/test/AWS/MWAAServerless/handler.ts:102:5
  100 │     // Event source: subscribe the host to workflow-run state changes. The
  101 │     // deploy proves the EventBridge rule + invoke permission.
> 102 │     yield* MWAAServerless.consumeWorkflowRunEvents(
  103 │       { runStates: ["Succeeded", "Failed", "Stopped"] },
  104 │       (events) =>
  105 │         Stream.runForEach(events, (event) =>
  106 │           Effect.log(
  107 │             `mwaa-serverless run ${event.detail.runId} -> ${event["detail-type"]}`,
  108 │           ),
  109 │         ),
  110 │     );

0.80 packages/alchemy/test/AWS/Pipes/pipe-handler.ts:63:5
  62 │     // Runtime: forward every pipe-delivered record body into the sink queue.
> 63 │     yield* host.listen(
  64 │       Effect.gen(function* () {
  65 │         return (event: unknown) => {
  66 │           if (isPipeSqsBatch(event)) {
  67 │             return Effect.forEach(
  68 │               event,
  69 │               (record) => sendMessage({ MessageBody: record.body }),
  70 │               { discard: true },
  71 │             ).pipe(Effect.orDie);
  72 │           }
  73 │         };
  74 │       }),
  75 │     );

0.80 packages/alchemy/test/AWS/SQS/event-source-handler.ts:45:5
  41 │   Effect.gen(function* () {
  42 │     const { source, result } = yield* SourceAndResultQueues;
  43 │     const sink = yield* AWS.SQS.QueueSink(result);
  44 │
> 45 │     yield* AWS.SQS.consumeQueueMessages(source, { batchSize: 10 }, (records) =>
  46 │       records.pipe(
  47 │         Stream.map((record) => ({ MessageBody: record.body })),
  48 │         Stream.run(sink),
  49 │         Effect.orDie,
  50 │       ),
  51 │     );
  52 │
  53 │     const sourceQueueUrl = yield* source.queueUrl;
  54 │     const sourceQueueArn = yield* source.queueArn;
  55 │     const resultQueueUrl = yield* result.queueUrl;
  56 │
  57 │     return {
  58 │       fetch: Effect.gen(function* () {
  59 │         return yield* HttpServerResponse.json({
  60 │           ok: true,
  61 │           sourceQueueUrl: yield* sourceQueueUrl,
  62 │           sourceQueueArn: yield* sourceQueueArn,
  63 │           resultQueueUrl: yield* resultQueueUrl,
  64 │         });
  65 │       }).pipe(Effect.orDie),
  66 │     };
  67 │   }).pipe(

0.80 packages/alchemy/test/Neon/fixtures/function-events.ts:62:11
  56 │     return {
  57 │       fetch: Effect.gen(function* () {
  58 │         const request = yield* HttpServerRequest;
  59 │         const path = new URL(request.url, "https://function.test").pathname;
  60 │         yield* prepare.pipe(Effect.orDie);
  61 │         if (path === "/upload") {
> 62 │           yield* files.put("incoming/test.txt", "uploaded").pipe(Effect.orDie);
  63 │           yield* files.put("outside.txt", "not-matched").pipe(Effect.orDie);
  64 │           return HttpServerResponse.empty({ status: 204 });
  65 │         }
  66 │         const events =
  67 │           yield* sql`SELECT id, kind, object_key FROM alchemy_function_events ORDER BY id`.pipe(
  68 │             Effect.orDie,
  69 │           );
  70 │         return yield* HttpServerResponse.json(events);
  71 │       }),
  72 │     };

0.80 packages/alchemy/test/Railway/fixtures/postgres-fn.ts:30:7
  18 │ export default class PostgresFn extends Function<PostgresFn>()(
  19 │   "PostgresFn",
  20 │   {
  21 │     project: Site,
  22 │     environment: Partition,
  23 │     main: import.meta.url,
  24 │     build: { install: ["pg", "drizzle-orm"] },
  25 │   },
  26 │   Effect.gen(function* () {
  27 │     const conn = yield* ConnectPostgres(Db);
  28 │     const db = yield* Drizzle.Postgres(conn.connectionString);
  29 │     return {
> 30 │       fetch: db.execute("select 1 as ok", "objects").pipe(
  31 │         Effect.flatMap((rows) => HttpServerResponse.json({ rows })),
  32 │         Effect.catch((error) =>
  33 │           HttpServerResponse.json(
  34 │             { ok: false, error: String(error) },
  35 │             { status: 500 },
  36 │           ),
  37 │         ),
  38 │       ),
  39 │     };
  40 │   }).pipe(Effect.provide(ConnectPostgresHttp)),
  41 │ ) {}

0.79 packages/alchemy/test/AWS/Smoke/fixtures/worker-handler.ts:29:5
  20 │ export const SmokeWorkerFunctionLive = SmokeWorkerFunction.make(
  21 │   {
  22 │     main: import.meta.url,
  23 │     timeout: Duration.seconds(30),
  24 │   },
  25 │   Effect.gen(function* () {
  26 │     const { jobsQueue, resultsQueue } = yield* ServerlessResources;
  27 │     const sink = yield* AWS.SQS.QueueSink(resultsQueue);
  28 │
> 29 │     yield* AWS.SQS.consumeQueueMessages(
  30 │       jobsQueue,
  31 │       { batchSize: 10 },
  32 │       (records) =>
  33 │         records.pipe(
  34 │           Stream.map((record) => ({ MessageBody: `processed:${record.body}` })),
  35 │           Stream.run(sink),
  36 │           Effect.orDie,
  37 │         ),
  38 │     );
  39 │   }).pipe(
  40 │     Effect.provide(
  41 │       Layer.provideMerge(
  42 │         Layer.mergeAll(AWS.Lambda.QueueEventSource, AWS.SQS.QueueSinkHttp),
  43 │         Layer.mergeAll(AWS.SQS.SendMessageBatchHttp, ServerlessResourcesLive),
  44 │       ),
  45 │     ),
  46 │   ),
  47 │ ).pipe(Layer.provideMerge(ServerlessResourcesLive));

0.79 packages/alchemy/test/AWS/Transfer/workflow-handler.ts:33:5
  30 │     // Event source: subscribe the host to Transfer Family file-transfer
  31 │     // events. The deploy proves the EventBridge rule + invoke permission
  32 │     // wiring; Transfer publishes to the default bus automatically.
> 33 │     yield* Transfer.consumeFileTransferEvents(
  34 │       { kinds: ["file-upload-completed", "file-upload-failed"] },
  35 │       (events) =>
  36 │         Stream.runForEach(events, (event) =>
  37 │           Effect.log(
  38 │             `transfer ${event["detail-type"]}: ${event.detail.username}`,
  39 │           ),
  40 │         ),
  41 │     );

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/object.ts:30:7
  27 │     return Effect.gen(function* () {
  28 │       // D1's `exec()` splits on newlines and rejects multi-line statements;
  29 │       // keep the DDL on a single line.
> 30 │       yield* db.exec(
  31 │         "CREATE TABLE IF NOT EXISTS d1_counters (id TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)",
  32 │       );

0.78 packages/alchemy/test/AWS/OpenSearch/fixtures/handler.ts:42:9
  39 │     yield* OpenSearch.consumeDomainEvents(
  40 │       { kinds: ["cluster-status", "software-update"] },
  41 │       (events) =>
> 42 │         Stream.runForEach(events, (event) =>
  43 │           Effect.log(
  44 │             `opensearch event: ${event["detail-type"]} -> ${event.resources.join(", ")}`,
  45 │           ),
  46 │         ),
  47 │     );

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/do-abort/abort-worker.ts:24:7
  18 │     return Effect.gen(function* () {
  19 │       yield* Effect.logInfo(
  20 │         "abort fixture: constructor started",
  21 │         state.id.toString(),
  22 │       );
  23 │       const boots = ((yield* state.storage.get<number>("boots")) ?? 0) + 1;
> 24 │       yield* state.storage.put("boots", boots);
  25 │       yield* Effect.logInfo("abort fixture: constructor completed", { boots });
  26 │       let failedPings = 0;
  27 │       return {
  28 │         ping: (fail = false) =>
  29 │           Effect.gen(function* () {
  30 │             yield* Effect.logInfo("abort fixture: ping", { boots, fail });
  31 │             if (fail) {
  32 │               failedPings++;
  33 │               return yield* Effect.die(
  34 │                 new Error(
  35 │                   "internal error; reference = application-ping-failure",
  36 │                 ),
  37 │               );
  38 │             }
  39 │             return { boots, failedPings, ok: true as const };
  40 │           }),
  41 │         crash: () =>
  42 │           Effect.gen(function* () {
  43 │             yield* state.abort("test abort", { retryAlarm: false });
  44 │           }),
  45 │       };
  46 │     });

0.77 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:52:5
  49 │     // (best-effort — a different instance may serve /events) and exposed on
  50 │     // the /events route.
  51 │     const deploymentEvents: Amplify.DeploymentStatusChangeDetail[] = [];
> 52 │     yield* Amplify.consumeDeploymentStatusChanges(
  53 │       { id: "BindingsTestApp" },
  54 │       (events) =>
  55 │         Stream.runForEach(events, (event) =>
  56 │           Effect.sync(() => {
  57 │             deploymentEvents.push(event.detail);
  58 │           }),
  59 │         ),
  60 │     );

0.77 packages/alchemy/test/AWS/Location/handler.ts:124:5
  121 │     const cancelJob = yield* Location.CancelJob();
  122 │     // Bound for its deploy-time wiring (geo:StartJob + iam:PassRole); starting
  123 │     // a real batch job needs S3 input/output data.
> 124 │     yield* Location.StartJob(jobsRole);

0.77 packages/alchemy/test/AWS/SageMaker/handler.ts:38:5
  35 │     // Event source: subscribe the host to SageMaker feature-group state
  36 │     // changes. The deploy proves the EventBridge rule + invoke permission
  37 │     // wiring.
> 38 │     yield* SageMaker.consumeSageMakerEvents(
  39 │       { kinds: ["feature-group"] },
  40 │       (events) =>
  41 │         Stream.runForEach(events, (event) =>
  42 │           Effect.log(
  43 │             `feature group ${event.detail.FeatureGroupName} -> ${event.detail.FeatureGroupStatus}`,
  44 │           ),
  45 │         ),
  46 │     );

0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:741:17
  740 │               const sql = yield* Effect.exit(
> 741 │                 storage.sql.exec(
  742 │                   "INSERT INTO application_values (value) VALUES (?)",
  743 │                   "after-rollback",
  744 │                 ),
  745 │               );

0.77 packages/alchemy/test/Fly/fixtures/app/worker.ts:28:9
  11 │ export default class Worker extends Fly.Service<Worker>()(
  12 │   "Worker",
  13 │   {
  14 │     app: Site,
  15 │     main: import.meta.url,
  16 │     region: "iad",
  17 │     guest: { cpuKind: "shared", cpus: 1, memoryMb: 256 },
  18 │     services: [],
  19 │   },
  20 │   Effect.gen(function* () {
  21 │     const mount = yield* Fly.MountVolume({ path: VOLUME_PATH, sizeGb: 1 });
  22 │     const host = yield* ServerHost;
  23 │     const fs = yield* FileSystem.FileSystem;
  24 │
  25 │     yield* host.run(
  26 │       Effect.gen(function* () {
  27 │         yield* fs.makeDirectory(mount.path, { recursive: true });
> 28 │         yield* fs.writeFileString(MARKER_FILE, MARKER);
  29 │         return yield* Effect.never;
  30 │       }).pipe(Effect.orDie),
  31 │     );
  32 │   }).pipe(Effect.provide(Fly.MountVolumeLive)),
  33 │ ) {}

0.76 packages/alchemy/test/AWS/DataZone/handler.ts:55:5
  53 │     // Event source: subscribe the host to DataZone workflow events. The
  54 │     // deploy proves the EventBridge rule + invoke permission wiring.
> 55 │     yield* DataZone.consumeDataZoneEvents(
  56 │       { detailTypes: ["Subscription Request Created"] },
  57 │       (events) =>
  58 │         Stream.runForEach(events, (event) =>
  59 │           Effect.log(`datazone event: ${event.detail.metadata?.id}`),
  60 │         ),
  61 │     );

0.76 packages/alchemy/test/AWS/DevOpsGuru/handler.ts:26:5
  23 │   Effect.gen(function* () {
  24 │     // Event source: subscribe the host to insight lifecycle events. The
  25 │     // deploy proves the EventBridge rule + invoke permission wiring.
> 26 │     yield* DevOpsGuru.consumeInsightEvents(
  27 │       { kinds: ["new-insight", "severity-upgraded"] },
  28 │       (events) =>
  29 │         Stream.runForEach(events, (event) =>
  30 │           Effect.log(
  31 │             `devops-guru insight: ${event.detail.insightId} (${event.detail.insightSeverity})`,
  32 │           ),
  33 │         ),
  34 │     );

0.76 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:18:5
  14 │ export const fetchSql = () =>
  15 │   Effect.gen(function* () {
  16 │     const url = yield* Config.Redacted("TEST_POSTGRES_URL");
  17 │     const client = yield* PgClient.make({ url });
> 18 │     const result = yield* client`SELECT 1`;
  19 │     return result;
  20 │   }).pipe(Effect.provide(services), Effect.scoped, Effect.runPromise);

0.75 packages/alchemy/test/AWS/Athena/handler.ts:142:11
  134 │     yield* Athena.consumeQueryStateChanges(
  135 │       { states: ["SUCCEEDED", "FAILED", "CANCELLED"] },
  136 │       (events) =>
  137 │         Stream.runForEach(events, (event) =>
  138 │           putObject({
  139 │             Key: `events/${event.detail.queryExecutionId}`,
  140 │             Body: JSON.stringify(event.detail),
  141 │             ContentType: "application/json",
> 142 │           }).pipe(Effect.orDie, Effect.asVoid),
  143 │         ),
  144 │     );

0.75 packages/alchemy/test/AWS/EMR/handler.ts:37:5
  34 │   Effect.gen(function* () {
  35 │     // Event source: subscribe the host to EMR cluster + step state changes.
  36 │     // The deploy proves the EventBridge rule + invoke permission wiring.
> 37 │     yield* EMR.consumeClusterEvents({ kinds: ["cluster", "step"] }, (events) =>
  38 │       Stream.runForEach(events, (event) =>
  39 │         Effect.log(
  40 │           `emr event: ${event.detail.clusterId} -> ${event.detail.state}`,
  41 │         ),
  42 │       ),
  43 │     );

0.75 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:48:5
  45 │     // Event source: subscribe the host to IVS Real-Time stage updates and
  46 │     // composition state changes. The deploy proves the EventBridge rule +
  47 │     // invoke permission wiring.
> 48 │     yield* IVSRealtime.consumeStageEvents(
  49 │       { kinds: ["stage-update", "composition-state-change"] },
  50 │       (events) =>
  51 │         Stream.runForEach(events, (event) =>
  52 │           Effect.log(
  53 │             `ivs stage event: ${event.detail.event_name} (${event.detail.participant_id})`,
  54 │           ),
  55 │         ),
  56 │     );

0.75 packages/alchemy/test/AWS/Signer/handler.ts:74:5
  72 │     // Event source: subscribe the host to signing-job status changes. The
  73 │     // deploy proves the EventBridge rule + invoke permission wiring.
> 74 │     yield* Signer.consumeSigningJobEvents({}, (events) =>
  75 │       Stream.runForEach(events, (event) =>
  76 │         Effect.log(`signer job ${event.detail.job_id}: ${event.detail.status}`),
  77 │       ),
  78 │     );

0.74 packages/alchemy/src/AWS/EC2/DescribeInstanceHttp.ts:22:11
  17 │     return Effect.fn(function* (instance: Instance) {
  18 │       const instanceId = yield* instance.instanceId;
  19 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  20 │         const host = yield* Binding.Host;
  21 │         if (isBindingHost(host) || isInstance(host)) {
> 22 │           yield* host.bind`Allow(${host}, AWS.EC2.DescribeInstance(${instance}))`(
  23 │             {
  24 │               policyStatements: [
  25 │                 {
  26 │                   Effect: "Allow",
  27 │                   Action: ["ec2:DescribeInstances"],
  28 │                   Resource: ["*"],
  29 │                 },
  30 │               ],
  31 │             },
  32 │           );
  33 │         }
  34 │       }
  35 │       return Effect.fn(`AWS.EC2.DescribeInstance(${instance.LogicalId})`)(
  36 │         function* () {
  37 │           const result = yield* describe({
  38 │             InstanceIds: [yield* instanceId],
  39 │           });
  40 │           return result.Reservations?.[0]?.Instances?.[0];
  41 │         },
  42 │       );
  43 │     });

0.74 packages/alchemy/src/AWS/EC2/GetAmiHttp.ts:22:11
  19 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  20 │         const host = yield* Binding.Host;
  21 │         if (isBindingHost(host) || isInstance(host)) {
> 22 │           yield* host.bind`Allow(${host}, AWS.EC2.GetAmi)`({
  23 │             policyStatements: [
  24 │               {
  25 │                 Effect: "Allow",
  26 │                 Action: ["ec2:DescribeImages"],
  27 │                 Resource: ["*"],
  28 │               },
  29 │             ],
  30 │           });
  31 │         }
  32 │       }

0.74 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:122:5
  119 │     // Deploy-time: creates the EventBridge rule (default bus) targeting this
  120 │     // Function. Runtime firing needs a real finding, so the test only
  121 │     // verifies the subscription deploys cleanly.
> 122 │     yield* AccessAnalyzer.consumeFindings({ kind: "all" }, (events) =>
  123 │       Stream.runForEach(events, (event) =>
  124 │         Effect.log(`access-analyzer finding event: ${event.detail.id}`),
  125 │       ),
  126 │     );

0.74 packages/alchemy/test/AWS/ImageBuilder/handler.ts:41:5
  39 │   Effect.gen(function* () {
  40 │     // The pipeline the pipeline-scoped bindings are bound to. ENABLED but
> 41 │     // with no schedule, so it only builds when the Start binding fires.

0.74 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:48:5
  45 │     const sink = yield* AWS.SQS.QueueSink(result);
  46 │     const publish = yield* AWS.IoT.Publish(TOPIC);
  47 │
> 48 │     yield* AWS.IoT.consumeTopicMessages(TOPIC, (messages) =>
  49 │       messages.pipe(
  50 │         Stream.map((message) => ({ MessageBody: JSON.stringify(message) })),
  51 │         Stream.run(sink),
  52 │         Effect.orDie,
  53 │       ),
  54 │     );

0.74 packages/alchemy/test/AWS/Textract/handler.ts:48:5
  45 │     // read the S3 input with the CALLER's credentials, so the function
  46 │     // itself also needs s3:GetObject on the bucket.
  47 │     const putObject = yield* S3.PutObject(bucket);
> 48 │     yield* S3.GetObject(bucket);
  49 │
  50 │     // --- synchronous analysis ---
  51 │     const analyzeDocument = yield* Textract.AnalyzeDocument();

0.73 packages/alchemy/test/AWS/Organizations/handler.ts:81:11
  77 │     yield* Organizations.consumeOrganizationsEvents(
  78 │       { events: ["CreateAccountResult", "MoveAccount"] },
  79 │       (events) =>
  80 │         Stream.runForEach(events, (event) =>
> 81 │           Effect.log(`organizations event: ${event.detail.eventName}`),
  82 │         ),
  83 │     );

0.73 packages/alchemy/test/AWS/Transcribe/handler.ts:123:9
  120 │     yield* Transcribe.consumeTranscriptionJobEvents(
  121 │       { statuses: ["COMPLETED", "FAILED"] },
  122 │       (events) =>
> 123 │         Stream.runForEach(events, (event) =>
  124 │           Effect.log(
  125 │             `transcribe job event: ${event.detail.TranscriptionJobName} -> ${event.detail.TranscriptionJobStatus}`,
  126 │           ),
  127 │         ),
  128 │     );

0.73 packages/alchemy/test/Hetzner/fixtures/worker.ts:26:9
  11 │ export default class Worker extends Hetzner.Service<Worker>()(
  12 │   "Worker",
  13 │   {
  14 │     server: Box,
  15 │     main: import.meta.url,
  16 │   },
  17 │   Effect.gen(function* () {
  18 │     const volume = yield* Data;
  19 │     const mount = yield* Hetzner.MountVolume(volume, { path: VOLUME_PATH });
  20 │     const host = yield* ServerHost;
  21 │
  22 │     yield* host.run(
  23 │       Effect.gen(function* () {
  24 │         const fs = yield* FileSystem.FileSystem;
  25 │         yield* fs.makeDirectory(mount.path, { recursive: true });
> 26 │         yield* fs.writeFileString(MARKER_FILE, MARKER);
  27 │         return yield* Effect.never;
  28 │       }).pipe(Effect.orDie),
  29 │     );
  30 │   }).pipe(Effect.provide(Hetzner.MountVolumeLive)),
  31 │ ) {}

0.72 packages/alchemy/src/AWS/AMP/GetDefaultScraperConfigurationHttp.ts:19:11
   9 │ export const GetDefaultScraperConfigurationHttp = Layer.effect(
  10 │   GetDefaultScraperConfiguration,
  11 │   Effect.gen(function* () {
  12 │     const getDefaultScraperConfiguration =
  13 │       yield* amp.getDefaultScraperConfiguration;
  14 │
  15 │     return Effect.fn(function* () {
  16 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  17 │         const host = yield* Binding.Host;
  18 │         if (isBindingHost(host)) {
> 19 │           yield* host.bind`Allow(${host}, AWS.AMP.GetDefaultScraperConfiguration())`(
  20 │             {
  21 │               policyStatements: [
  22 │                 {
  23 │                   Effect: "Allow",
  24 │                   Action: ["aps:GetDefaultScraperConfiguration"],
  25 │                   Resource: ["*"],
  26 │                 },
  27 │               ],
  28 │             },
  29 │           );
  30 │         }
  31 │       }
  32 │       return Effect.fn("AWS.AMP.GetDefaultScraperConfiguration")(function* () {
  33 │         const response = yield* getDefaultScraperConfiguration({});
  34 │         return yield* decodeDefinition(response.configuration);
  35 │       });
  36 │     });
  37 │   }),
  38 │ );

0.72 packages/alchemy/src/AWS/FraudDetector/ListEventPredictionsHttp.ts:26:11
  20 │     return Effect.fn(function* (detector: Detector) {
  21 │       // Output yields a DEFERRED effect — resolve again per invocation below.
  22 │       const DetectorId = yield* detector.detectorId;
  23 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  24 │         const host = yield* Binding.Host;
  25 │         if (isBindingHost(host)) {
> 26 │           yield* host.bind`Allow(${host}, AWS.FraudDetector.ListEventPredictions(${detector}))`(
  27 │             {
  28 │               policyStatements: [
  29 │                 {
  30 │                   Effect: "Allow",
  31 │                   Action: ["frauddetector:ListEventPredictions"],
  32 │                   Resource: ["*"],
  33 │                 },
  34 │               ],
  35 │             },
  36 │           );
  37 │         }
  38 │       }
  39 │       return Effect.fn(
  40 │         `AWS.FraudDetector.ListEventPredictions(${detector.LogicalId})`,
  41 │       )(function* (
  42 │         request: Omit<frauddetector.ListEventPredictionsRequest, "detectorId">,
  43 │       ) {
  44 │         const detectorId = yield* DetectorId;
  45 │         return yield* op({ ...request, detectorId: { value: detectorId } });
  46 │       });
  47 │     });

0.72 packages/alchemy/test/AWS/CodeArtifact/handler.ts:54:5
> 54 │     // Marker store for the event source (events may arrive on another
  55 │     // Lambda instance, so they must be observable out-of-band).
  56 │     const bucket = yield* S3.Bucket("EventBucket", { forceDestroy: true });
  57 │     const putObject = yield* S3.PutObject(bucket);

0.72 packages/alchemy/test/AWS/CostExplorer/handler.ts:228:11
  225 │         if (request.method === "GET" && pathname === "/tag-keys") {
  226 │           const Start = yield* monthStart(-1);
  227 │           const End = yield* monthStart(0);
> 228 │           const result = yield* getTags({ TimePeriod: { Start, End } }).pipe(
  229 │             Effect.map((r) => ({ tag: "Ok", count: (r.Tags ?? []).length })),
  230 │             Effect.catchTag("DataUnavailableException", (e) =>
  231 │               Effect.succeed({ tag: e._tag, count: 0 }),
  232 │             ),
  233 │           );
  234 │           return yield* HttpServerResponse.json(result);
  235 │         }

0.72 packages/alchemy/test/AWS/DataBrew/handler.ts:141:5
  138 │     // Deploy-time: creates the EventBridge rule (default bus, source
  139 │     // aws.databrew) targeting this Function. Runtime firing rides on the
  140 │     // real job runs the suite starts; the test verifies the rule deploys.
> 141 │     yield* DataBrew.consumeJobEvents({}, (events) =>
  142 │       Stream.runForEach(events, (event) =>
  143 │         Effect.log(
  144 │           `databrew event: ${event.detail.jobRunId} of ${event.detail.jobName} -> ${event.detail.state}`,
  145 │         ),
  146 │       ),
  147 │     );

0.72 packages/alchemy/test/AWS/ElastiCache/bindings-handler.ts:37:5
  34 │     // Event source: subscribe the host to ElastiCache cache/snapshot
  35 │     // lifecycle events. The deploy proves the EventBridge rule + invoke
  36 │     // permission wiring.
> 37 │     yield* ElastiCache.consumeCacheEvents(
  38 │       { kinds: ["cache-limit-approaching", "snapshot-creation-failed"] },
  39 │       (events) =>
  40 │         Stream.runForEach(events, (event) =>
  41 │           Effect.log(
  42 │             `elasticache event: ${event["detail-type"]} -> ${event.resources.join(", ")}`,
  43 │           ),
  44 │         ),
  45 │     );

0.72 packages/alchemy/test/AWS/FIS/handler.ts:53:5
  51 │     // Event source: subscribe the host to experiment state changes. The
  52 │     // deploy proves the EventBridge rule + invoke permission wiring.
> 53 │     yield* FIS.consumeExperimentEvents({}, (events) =>
  54 │       Stream.runForEach(events, (event) =>
  55 │         Effect.log(
  56 │           `fis experiment ${event.detail["experiment-id"]} -> ` +
  57 │             `${event.detail["new-state"]?.status}`,
  58 │         ),
  59 │       ),
  60 │     );

0.72 packages/alchemy/test/AWS/MediaLive/fixtures/handler.ts:33:5
  30 │     // Event source: subscribe the host to MediaLive state-change/alert
  31 │     // events. The deploy proves the EventBridge rule + invoke permission
  32 │     // wiring.
> 33 │     yield* MediaLive.consumeChannelEvents(
  34 │       { kinds: ["state-change", "alert"] },
  35 │       (events) =>
  36 │         Stream.runForEach(events, (event) =>
  37 │           Effect.log(
  38 │             `medialive event: ${event["detail-type"]} ${event.detail.state ?? event.detail.message ?? ""}`,
  39 │           ),
  40 │         ),
  41 │     );

0.72 packages/alchemy/test/AWS/XRay/handler.ts:41:9
  38 │     // proves the EventBridge rule + invoke permission wiring.
  39 │     yield* XRay.consumeInsightEvents({ states: ["ACTIVE"] }, (events) =>
  40 │       Stream.runForEach(events, (event) =>
> 41 │         Effect.log(
  42 │           `xray insight: ${event.detail.InsightId} (${event.detail.State})`,
  43 │         ),
  44 │       ),
  45 │     );

0.72 packages/alchemy/test/Cloudflare/Queue/round-trip-worker.ts:84:5
  81 │     // and-forward path into Cloudflare's Consumer settings.
  82 │     // Values are kept small so the round-trip latency stays well
  83 │     // under the test's 240s timeout.
> 84 │     yield* Cloudflare.Queues.consumeQueueMessages<QueueMessageBody>(
  85 │       queueResource,
  86 │       {
  87 │         batchSize: 10,
  88 │         maxRetries: 3,
  89 │         maxWaitTime: Duration.millis(500),
  90 │         retryDelay: "1 second",
  91 │       },
  92 │       (stream) =>
  93 │         Stream.runForEach(stream, (msg) =>
  94 │           counters.getByName(msg.body.name).record(msg.body.text),
  95 │         ),
  96 │     );

0.71 packages/alchemy/test/AWS/DynamoDB/stream-handler.ts:46:5
  42 │   Effect.gen(function* () {
  43 │     const { table, queue } = yield* TableAndQueue;
  44 │     const sink = yield* AWS.SQS.QueueSink(queue);
  45 │
> 46 │     yield* AWS.DynamoDB.consumeTableChanges(
  47 │       table,
  48 │       {
  49 │         streamViewType: "NEW_AND_OLD_IMAGES",
  50 │         startingPosition: "TRIM_HORIZON",
  51 │         batchSize: 10,
  52 │       },
  53 │       (stream) =>
  54 │         stream.pipe(
  55 │           Stream.map((record) => ({
  56 │             MessageBody: JSON.stringify({
  57 │               eventName: record.eventName,
  58 │               keys: record.dynamodb.Keys,
  59 │               newImage: record.dynamodb.NewImage,
  60 │               oldImage: record.dynamodb.OldImage,
  61 │             }),
  62 │           })),
  63 │           Stream.run(sink),
  64 │           Effect.orDie,
  65 │         ),
  66 │     );
  67 │   }).pipe(

0.71 packages/alchemy/test/Cloudflare/Queue/fixtures/dedicated-consumer-worker.ts:44:5
  41 │     const queue = yield* DedicatedQueue;
  42 │     const env = yield* Cloudflare.WorkerEnvironment;
  43 │
> 44 │     yield* Cloudflare.Queues.consumeQueueMessages<{ text: string }>(
  45 │       queue,
  46 │       (stream) =>
  47 │         Stream.runForEach(stream, (msg) =>
  48 │           inbox.getByName("default").record(msg.body.text),
  49 │         ),
  50 │     );

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/email-catchall-worker.ts:25:5
  16 │ export default class EmailCatchAllWorker extends Cloudflare.Worker<EmailCatchAllWorker>()(
  17 │   "EmailCatchAllWorker",
  18 │   {
  19 │     main: import.meta.filename,
  20 │     workersDev: { enabled: true, previewsEnabled: false },
  21 │   },
  22 │   Effect.gen(function* () {
  23 │     const zone = yield* ZoneConfig;
  24 │
> 25 │     yield* Cloudflare.email({ zone }).subscribe((message) =>
  26 │       Effect.log(`received mail for ${message.to}`),
  27 │     );
  28 │
  29 │     return {
  30 │       fetch: Effect.succeed(HttpServerResponse.text("ok")),
  31 │     };
  32 │   }).pipe(Effect.provide(Cloudflare.EmailEventSourceLive)),
  33 │ ) {}
```
