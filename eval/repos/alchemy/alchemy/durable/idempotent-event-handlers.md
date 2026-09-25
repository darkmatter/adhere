# alchemy/durable/idempotent-event-handlers

A handler for events delivered at least once, such as Stripe webhooks, scheduled callbacks, or bucket and queue events, must be idempotent, upserting by a stable ID or deduplicating by event ID, never doing blind inserts, increments, or charges.

8 findings, from 0.93 down to 0.71. Each showed this hint:

```ts
yield* Stripe.consumeEvents([CustomerSubscriptionUpdated], (event) =>
  kv.put(`entitlement:${event.data.object.customer}`, JSON.stringify(entitlementOf(event))),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.93 packages/alchemy/test/Cloudflare/Website/vite-cron-fixture/worker.ts:15:5
   7 │ export default {
   8 │   fetch(request: Request, env: Env) {
   9 │     if (new URL(request.url).pathname === "/api/scheduled") {
  10 │       return Response.json({ scheduledCount });
  11 │     }
  12 │     return env.ASSETS.fetch(request);
  13 │   },
  14 │   scheduled() {
> 15 │     scheduledCount += 1;
  16 │   },
  17 │ };

0.89 packages/alchemy/test/Cloudflare/Queue/round-trip-worker.ts:24:11
  14 │ export class Counter extends Cloudflare.DurableObject<Counter>()(
  15 │   "Counter",
  16 │   Effect.gen(function* () {
  17 │     return Effect.gen(function* () {
  18 │       const state = yield* Cloudflare.DurableObjectState;
  19 │       let count = (yield* state.storage.get<number>("count")) ?? 0;
  20 │       const lastBodies =
  21 │         (yield* state.storage.get<string[]>("lastBodies")) ?? [];
  22 │       return {
  23 │         record: Effect.fn(function* (body: string) {
> 24 │           count += 1;
  25 │           lastBodies.push(body);
  26 │           yield* state.storage.put("count", count);
  27 │           yield* state.storage.put("lastBodies", lastBodies);
  28 │         }),
  29 │         snapshot: () =>
  30 │           Effect.succeed({
  31 │             count,
  32 │             lastBodies,
  33 │           }),
  34 │       };
  35 │     });
  36 │   }),
  37 │ ) {}

0.84 packages/alchemy/test/Cloudflare/Website/vite-queue-fixture/worker.ts:32:7
  17 │ export default {
  18 │   fetch: async (request: Request, env: Env) => {
  19 │     const url = new URL(request.url);
  20 │     if (url.pathname === "/api/send") {
  21 │       const text = url.searchParams.get("text") ?? "hello";
  22 │       await env.QUEUE.send(text, { contentType: "text" });
  23 │       return Response.json({ sent: text });
  24 │     }
  25 │     if (url.pathname === "/api/received") {
  26 │       return Response.json({ received });
  27 │     }
  28 │     return env.ASSETS.fetch(request);
  29 │   },
  30 │   queue: async (batch: { messages: MessageLike[] }) => {
  31 │     for (const message of batch.messages) {
> 32 │       received.push(String(message.body));
  33 │     }
  34 │   },
  35 │ };

0.79 packages/alchemy/test/Cloudflare/Queues/fixtures/queue-local-worker.ts:51:7
  48 │   queue: async (batch: { messages: MessageLike[] }) => {
  49 │     batches.push(batch.messages.length);
  50 │     for (const message of batch.messages) {
> 51 │       received.push(String(message.body));
  52 │     }
  53 │   },
  54 │ };

0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/cron/cron-worker.ts:19:11
  11 │ export class CronCounter extends Cloudflare.DurableObject<CronCounter>()(
  12 │   "CronCounter",
  13 │   Effect.gen(function* () {
  14 │     const state = yield* Cloudflare.DurableObjectState;
  15 │     return Effect.gen(function* () {
  16 │       let times = (yield* state.storage.get<number[]>("times")) ?? [];
  17 │       return {
  18 │         record: Effect.fn(function* (time: number) {
> 19 │           times = [...times, time];
  20 │           yield* state.storage.put("times", times);
  21 │         }),
  22 │         snapshot: () => Effect.succeed({ times }),
  23 │         reset: Effect.fn(function* () {
  24 │           times = [];
  25 │           yield* state.storage.put("times", times);
  26 │         }),
  27 │       };
  28 │     });
  29 │   }),
  30 │ ) {}

0.73 packages/alchemy/test/Cloudflare/Queue/fixtures/dedicated-consumer-worker.ts:17:11
   9 │ export class Inbox extends Cloudflare.DurableObject<Inbox>()(
  10 │   "DedicatedInbox",
  11 │   Effect.gen(function* () {
  12 │     return Effect.gen(function* () {
  13 │       const state = yield* Cloudflare.DurableObjectState;
  14 │       const bodies = (yield* state.storage.get<string[]>("bodies")) ?? [];
  15 │       return {
  16 │         record: Effect.fn(function* (body: string) {
> 17 │           bodies.push(body);
  18 │           yield* state.storage.put("bodies", bodies);
  19 │         }),
  20 │         snapshot: () => Effect.succeed({ bodies }),
  21 │       };
  22 │     });
  23 │   }),
  24 │ ) {}

0.71 packages/alchemy/test/AWS/Pipes/pipe-handler.ts:69:15
  63 │     yield* host.listen(
  64 │       Effect.gen(function* () {
  65 │         return (event: unknown) => {
  66 │           if (isPipeSqsBatch(event)) {
  67 │             return Effect.forEach(
  68 │               event,
> 69 │               (record) => sendMessage({ MessageBody: record.body }),
  70 │               { discard: true },
  71 │             ).pipe(Effect.orDie);
  72 │           }
  73 │         };
  74 │       }),
  75 │     );

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:165:13
  160 │         alarm: Effect.fn(function* () {
  161 │           const events = yield* Cloudflare.processScheduledEvents.pipe(
  162 │             Effect.provideService(Cloudflare.DurableObjectState, state),
  163 │           );
  164 │           for (const event of events) {
> 165 │             yield* record({
  166 │               version: "v2",
  167 │               channel: "legacy",
  168 │               id: event.id,
  169 │               payload: event.payload,
  170 │             });
  171 │           }
  172 │         }),
```
