# effect/basics/instrument-with-pipe

Timeouts, retries, logging, and spans must be attached with .pipe, never written into the body of the effect.

13 findings, from 0.90 down to 0.71. Each showed this hint:

```ts
const program = fetchData.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)))),
  Effect.tap((data) => Effect.logInfo(`Fetched: ${data}`)),
  Effect.withSpan("fetchData"),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.90 packages/alchemy/test/Neon/FunctionRollout.ts:23:7
  20 │     let firstCurrentMs: number | undefined;
  21 │     let lastStaleMs: number | undefined;
  22 │     const poll = Effect.gen(function* () {
> 23 │       const value = yield* sample.pipe(Effect.timeout("25 seconds"));
  24 │       const elapsedMs = (yield* Clock.currentTimeMillis) - started;
  25 │       const current = isCurrent(value);
  26 │       samples.push(value);
  27 │       consecutive = current ? consecutive + 1 : 0;
  28 │       if (current) firstCurrentMs ??= elapsedMs;
  29 │       else lastStaleMs = elapsedMs;
  30 │       yield* Effect.logInfo(
  31 │         JSON.stringify({
  32 │           neonRolloutSample: {
  33 │             round: samples.length,
  34 │             elapsedMs,
  35 │             current,
  36 │             consecutive,
  37 │           },
  38 │         }),
  39 │       );
  40 │       return consecutive >= 8;
  41 │     });

0.81 packages/alchemy/src/Neon/FunctionProvider.ts:122:1
> 122 │ export const FunctionLogs = Effect.fn(function* (
  123 │   output: FunctionAttributes,
  124 │   options: Provider.LogsInput,
  125 │ ) {

0.78 packages/alchemy/src/AWS/Bootstrap.ts:23:5
  18 │ export const bootstrap = Effect.fn(function* () {
  19 │   const existingBucket = yield* lookupAssetsBucket;
  20 │
  21 │   if (Option.isSome(existingBucket)) {
  22 │     yield* ensureAssetsBucketTags(existingBucket.value);
> 23 │     yield* Effect.logInfo(
  24 │       `Assets bucket already exists: ${existingBucket.value}`,
  25 │     );
  26 │     return { bucketName: existingBucket.value, created: false };
  27 │   }
  28 │
  29 │   const bucketName = yield* createAssetsBucket;
  30 │   return { bucketName, created: true };
  31 │ });

0.78 packages/alchemy/src/AWS/EC2/LingeringEnis.ts:168:7
  165 │       // Fast exponential start capped at 30-second steps (the historical
  166 │       // subnet schedule).
  167 │       const delayMillis = Math.min(1000 * 1.5 ** (attempt - 1), 30_000);
> 168 │       yield* Effect.sleep(delayMillis);
  169 │       elapsedMillis += delayMillis;
  170 │     }
  171 │   });

0.78 packages/alchemy/src/Railway/Bind.ts:92:21
  81 │             const response = yield* Effect.tryPromise({
  82 │               try: () =>
  83 │                 fetch(
  84 │                   `${baseUrl}${RPC_PATH_PREFIX}${encodeURIComponent(prop)}`,
  85 │                   {
  86 │                     method: "POST",
  87 │                     headers: {
  88 │                       "content-type": "application/json",
  89 │                       [RPC_TOKEN_HEADER]: token,
  90 │                     },
  91 │                     body: JSON.stringify(args),
> 92 │                     signal: AbortSignal.timeout(25_000),
  93 │                   },
  94 │                 ),
  95 │               catch: (cause) => new RpcCallError({ method: prop, cause }),
  96 │             });

0.76 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:401:9
  400 │       const deleteRelatedJobQueues = (computeEnvironment: string) =>
> 401 │         Effect.gen(function* () {
  402 │           const pages = yield* batch.describeJobQueues
  403 │             .pages({})
  404 │             .pipe(Stream.runCollect);

0.75 packages/alchemy/src/Command/Command.ts:281:5
  278 │ export const CommandExecutorLive = () =>
  279 │   Layer.effect(
  280 │     CommandExecutor,
> 281 │     Effect.gen(function* () {
  282 │       const path = yield* Path.Path;
  283 │       const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

0.75 packages/alchemy/test/Neon/Website/Browser.ts:231:7
> 231 │       yield* Effect.logInfo(
  232 │         `Website browser ${slug} ${width}x${height}: passed`,
  233 │       );
  234 │     }

0.74 packages/alchemy/test/AWS/EMRContainers/handler.ts:58:11
  54 │     yield* EMRContainers.consumeJobRunEvents(
  55 │       { states: ["FAILED", "COMPLETED"] },
  56 │       (events) =>
  57 │         Stream.runForEach(events, (event) =>
> 58 │           Effect.log(`job run ${event.detail.id} -> ${event.detail.state}`),
  59 │         ),
  60 │     );

0.73 packages/alchemy/src/Prisma/ComputeLifecycle.ts:381:11
  367 │       const deleted = yield* deleteProject({ id: projectId }).pipe(
  368 │         Effect.as(true),
  369 │         Effect.catchTag("NotFound", () => Effect.succeed(true)),
  370 │         Effect.catchTag("Conflict", (error) =>
  371 │           Effect.gen(function* () {
  372 │             if (attempt + 1 >= DELETE_CONFLICT_RETRY_ATTEMPTS) {
  373 │               return yield* Effect.fail(error);
  374 │             }
  375 │             yield* cleanupApps();
  376 │             yield* deleteRetryDelay(attempt);
  377 │             return false;
  378 │           }),
  379 │         ),
  380 │         Effect.catchTag("BadRequest", (error) =>
> 381 │           Effect.gen(function* () {
  382 │             if (attempt + 1 >= DELETE_CONFLICT_RETRY_ATTEMPTS) {
  383 │               return yield* Effect.fail(error);
  384 │             }
  385 │             yield* cleanupApps();
  386 │             yield* deleteRetryDelay(attempt);
  387 │             return false;
  388 │           }),
  389 │         ),
  390 │       );

0.72 packages/alchemy/src/Prisma/PrismaLogs.ts:181:11
  178 │         const connect = (
  179 │           cursor: string | undefined,
  180 │         ): Effect.Effect<void, PrismaLogStreamError> =>
> 181 │           Effect.gen(function* () {
  182 │             if (stopped) return;

0.72 packages/alchemy/test/AWS/DLM/handler.ts:46:9
  43 │     // The deploy proves the EventBridge rule + invoke permission wiring.
  44 │     yield* DLM.consumePolicyEvents({ kinds: ["state-change"] }, (events) =>
  45 │       Stream.runForEach(events, (event) =>
> 46 │         Effect.log(
  47 │           `dlm state change: ${event.detail.policy_id} -> ${event.detail.state}`,
  48 │         ),
  49 │       ),
  50 │     );

0.71 packages/alchemy/test/AWS/SageMaker/handler.ts:42:11
  38 │     yield* SageMaker.consumeSageMakerEvents(
  39 │       { kinds: ["feature-group"] },
  40 │       (events) =>
  41 │         Stream.runForEach(events, (event) =>
> 42 │           Effect.log(
  43 │             `feature group ${event.detail.FeatureGroupName} -> ${event.detail.FeatureGroupStatus}`,
  44 │           ),
  45 │         ),
  46 │     );
```
