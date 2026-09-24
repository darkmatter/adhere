# basics/instrument-with-pipe

Timeouts, retries, logging, and spans must be attached with .pipe, never written into the body of the effect.

18 findings, from 0.90 down to 0.71. Each showed this hint:

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

0.82 packages/alchemy/src/AWS/EC2/LingeringEnis.ts:168:7
  165 │       // Fast exponential start capped at 30-second steps (the historical
  166 │       // subnet schedule).
  167 │       const delayMillis = Math.min(1000 * 1.5 ** (attempt - 1), 30_000);
> 168 │       yield* Effect.sleep(delayMillis);
  169 │       elapsedMillis += delayMillis;
  170 │     }
  171 │   });

0.80 packages/alchemy/src/Neon/FunctionProvider.ts:169:1
  168 │   return yield* new FunctionLogQueryError({ reason: "pagination-limit" });
> 169 │ }, Effect.timeout("45 seconds"));

0.80 packages/alchemy/test/Neon/Website/Browser.ts:231:7
> 231 │       yield* Effect.logInfo(
  232 │         `Website browser ${slug} ${width}x${height}: passed`,
  233 │       );
  234 │     }

0.77 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:704:15
  700 │             if (disabled.status !== "DELETING") {
  701 │               yield* requestDelete;
  702 │               // Describe can briefly return the pre-delete record before the
  703 │               // DELETING transition becomes visible.
> 704 │               yield* Effect.sleep("3 seconds");
  705 │             }

0.77 packages/alchemy/test/AWS/AMP/handler.ts:72:13
  65 │         if (request.method === "GET" && pathname === "/query") {
  66 │           const query = url.searchParams.get("query");
  67 │           if (!query) {
  68 │             return HttpServerResponse.text("Missing query", { status: 400 });
  69 │           }
  70 │           const result = yield* metrics.query({
  71 │             query,
> 72 │             timeout: "30 seconds",
  73 │           });
  74 │           return yield* HttpServerResponse.json({ result });
  75 │         }

0.76 packages/alchemy/src/AWS/Bootstrap.ts:23:5
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

0.76 packages/alchemy/src/Command/Command.ts:281:5
  278 │ export const CommandExecutorLive = () =>
  279 │   Layer.effect(
  280 │     CommandExecutor,
> 281 │     Effect.gen(function* () {
  282 │       const path = yield* Path.Path;
  283 │       const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

0.76 packages/alchemy/src/Prisma/ComputeLifecycle.ts:381:11
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

0.76 packages/alchemy/test/AWS/EMRContainers/handler.ts:58:11
  54 │     yield* EMRContainers.consumeJobRunEvents(
  55 │       { states: ["FAILED", "COMPLETED"] },
  56 │       (events) =>
  57 │         Stream.runForEach(events, (event) =>
> 58 │           Effect.log(`job run ${event.detail.id} -> ${event.detail.state}`),
  59 │         ),
  60 │     );

0.75 packages/alchemy/src/Railway/Bind.ts:92:21
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

0.74 packages/alchemy/src/Prisma/PrismaLogs.ts:181:11
  178 │         const connect = (
  179 │           cursor: string | undefined,
  180 │         ): Effect.Effect<void, PrismaLogStreamError> =>
> 181 │           Effect.gen(function* () {
  182 │             if (stopped) return;

0.74 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:17:7
   5 │ export const makeSubscriptionCleanup = () => {
   6 │   let deadline: number | undefined;
   7 │   return <A, E, R>(effect: Effect.Effect<A, E, R>) =>
   8 │     Effect.gen(function* () {
   9 │       const now = yield* Clock.currentTimeMillis;
  10 │       deadline ??= now + 20_000;
  11 │       const remaining = deadline - now;
  12 │       if (remaining <= 0) {
  13 │         return yield* Effect.die(
  14 │           new Error("Subscription cleanup deadline exceeded"),
  15 │         );
  16 │       }
> 17 │       return yield* effect.pipe(Effect.timeout(Math.min(5_000, remaining)));
  18 │     }).pipe(Effect.orDie, Effect.interruptible);
  19 │ };

0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:839:17
  838 │               yield* Deferred.await(entered).pipe(
> 839 │                 Effect.timeout("5 seconds"),
  840 │                 Effect.orDie,
  841 │               );

0.73 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:55:9
  44 │   Effect.tryPromise({
  45 │     try: () =>
  46 │       new Promise<string>((resolve, reject) => {
  47 │         const socket = net.createConnection(endpoint.port, endpoint.address);
  48 │         let response = "";
  49 │         const key = "alchemy:provisioned:memcached";
  50 │         const payload = `set ${key} 0 30 ${Buffer.byteLength(value)}\r\n${value}\r\nget ${key}\r\n`;
  51 │         const fail = (error: Error) => {
  52 │           socket.destroy();
  53 │           reject(error);
  54 │         };
> 55 │         socket.setTimeout(10_000, () => fail(new Error("Memcached timed out")));
  56 │         socket.once("error", fail);
  57 │         socket.on("data", (chunk) => {
  58 │           response += chunk.toString();
  59 │           if (!response.endsWith("END\r\n")) return;
  60 │           socket.end();
  61 │           const match = response.match(/VALUE [^\r]+\r\n([^\r]+)\r\nEND\r\n$/);
  62 │           if (match?.[1] === undefined) {
  63 │             reject(new Error(`Unexpected Memcached response: ${response}`));
  64 │             return;
  65 │           }
  66 │           resolve(match[1]);
  67 │         });
  68 │         socket.once("connect", () => socket.write(payload));
  69 │       }),
  70 │     catch: (cause) => new Error(`Memcached roundtrip failed: ${String(cause)}`),
  71 │   });

0.72 packages/alchemy/src/AWS/Notifications/NotificationHub.ts:30:3
  21 │ export interface NotificationHub extends Resource<
  22 │   "AWS.Notifications.NotificationHub",
  23 │   NotificationHubProps,
  24 │   {
  25 │     /** The region registered as a notification hub. */
  26 │     notificationHubRegion: string;
  27 │     /** Hub status: `ACTIVE`, `REGISTERING`, `DEREGISTERING` or `INACTIVE`. */
  28 │     status: string;
  29 │   },
> 30 │   never,
  31 │   Providers
  32 │ > {}

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:301:11
  298 │         const fiber = yield* Effect.forkChild(task);
  299 │         yield* Deferred.await(started);
  300 │         if (input.scenario === "interrupt-retry")
> 301 │           yield* Effect.sleep("250 millis");
  302 │         yield* Fiber.interrupt(fiber).pipe(Effect.timeout("2 seconds"));
  303 │         yield* journal.record("joined");
  304 │         yield* Effect.sleep("2500 millis");

0.71 packages/alchemy/test/AWS/DLM/handler.ts:46:9
  43 │     // The deploy proves the EventBridge rule + invoke permission wiring.
  44 │     yield* DLM.consumePolicyEvents({ kinds: ["state-change"] }, (events) =>
  45 │       Stream.runForEach(events, (event) =>
> 46 │         Effect.log(
  47 │           `dlm state change: ${event.detail.policy_id} -> ${event.detail.state}`,
  48 │         ),
  49 │       ),
  50 │     );
```
