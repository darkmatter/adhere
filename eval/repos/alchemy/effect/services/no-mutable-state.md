# effect/services/no-mutable-state

A service must expose only readonly members, never mutable state.

4 findings, from 0.79 down to 0.71. Each showed this hint:

```ts
class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>()("@app/Logger") {}
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.79 packages/alchemy/test/Cloudflare/Website/vite-cron-fixture/worker.ts:15:5
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

0.77 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:42:5
  39 │   return {
  40 │     Type: "Neon.Function",
  41 │     id,
> 42 │     env,
  43 │     get: <T>(key: string) =>
  44 │       Effect.sync(() => unpackEnvValue<T>(process.env[key])),

0.73 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:10:3
   5 │ export interface OtlpCollector {
   6 │   readonly server: Server;
   7 │   /** Base URL (`http://127.0.0.1:<port>`); append the OTLP signal path. */
   8 │   readonly url: string;
   9 │   /** Responses fully written to the client. */
> 10 │   readonly completedRequests: { value: number };
  11 │   /** Received batches, including exports whose client disconnected. */
  12 │   readonly requests: Array<{
  13 │     body: string;
  14 │     receivedAt: number;
  15 │     responseStartedAt?: number;
  16 │     closedAt?: number;
  17 │     completed: boolean;
  18 │     aborted: boolean;
  19 │   }>;
  20 │   /** Re-arm the response gate for subsequent matching batches. */
  21 │   readonly holdResponses: () => void;
  22 │   /** Acknowledge held batches and leave the gate open until re-armed. */
  23 │   readonly releaseResponses: () => void;
  24 │ }

0.71 packages/alchemy/test/test.resources.ts:986:3
  985 │ export const makeTestCloud = (): TestCloudService => ({
> 986 │   resources: new Map(),
  987 │   unowned: new Set(),
  988 │   calls: [],
  989 │ });
```
