# basics/instrument-with-pipe

Timeouts, retries, logging, and spans must be attached with .pipe, never written into the body of the effect.

22 findings, from 0.90 down to 0.71. Each showed this hint:

```ts
const program = fetchData.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)))),
  Effect.tap((data) => Effect.logInfo(`Fetched: ${data}`)),
  Effect.withSpan("fetchData"),
);
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.90 packages/alchemy/test/Neon/FunctionRollout.ts:23
     const value = yield* sample.pipe(Effect.timeout("25 seconds"));
0.80 packages/alchemy/src/Railway/Bind.ts:92
     signal: AbortSignal.timeout(25_000),
0.79 packages/alchemy/src/AWS/EC2/LingeringEnis.ts:168
     yield* Effect.sleep(delayMillis);
0.79 packages/alchemy/src/Command/Command.ts:281
     Effect.gen(function* () {
0.78 packages/alchemy/src/Neon/FunctionProvider.ts:122
     export const FunctionLogs = Effect.fn(function* (
0.77 packages/alchemy/src/AWS/Bootstrap.ts:23
     yield* Effect.logInfo(
0.76 packages/alchemy/test/Neon/Website/Browser.ts:231
     yield* Effect.logInfo(
0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:839
     Effect.timeout("5 seconds"),
0.74 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:101
     yield* Effect.logInfo(
0.74 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:55
     socket.setTimeout(10_000, () => fail(new Error("Memcached timed out")));
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:301
     yield* Effect.sleep("250 millis");
0.73 packages/alchemy-test/src/Runner.ts:561
     ? yield* runBodyWithTimeout(test.body!, timeoutMs)
0.73 packages/alchemy/src/Prisma/PrismaLogs.ts:181
     Effect.gen(function* () {
0.73 packages/alchemy/test/AWS/EMRContainers/handler.ts:58
     Effect.log(`job run ${event.detail.id} -> ${event.detail.state}`),
0.73 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:17
     return yield* effect.pipe(Effect.timeout(Math.min(5_000, remaining)));
0.72 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:704
     yield* Effect.sleep("3 seconds");
0.72 packages/alchemy/src/AWS/Notifications/NotificationHub.ts:30
     never,
0.72 packages/alchemy/test/AWS/DynamoDB/handler.ts:101
     `Request: ${request.method} ${pathname} (originalUrl: ${request.originalUrl}, url: ${request.url})`,
0.72 packages/alchemy/test/Command/fixture/lifecycle.ts:104
     yield* Effect.never;
0.71 packages/alchemy/src/AWS/DevOpsGuru/ServiceIntegration.ts:223
     yield* session.note(
0.71 packages/alchemy/src/Local/RpcServer.ts:260
     runMain,
0.71 packages/alchemy/test/Neon/fixtures/function-effect.ts:31
     console.info(JSON.stringify({ nativeLifecycle: { id, phase } }));
```
