# services/no-mutable-state

A service must expose only readonly members, never mutable state.

3 findings, from 0.79 down to 0.71. Each showed this hint:

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

0.74 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:42:5
  39 │   return {
  40 │     Type: "Neon.Function",
  41 │     id,
> 42 │     env,
  43 │     get: <T>(key: string) =>
  44 │       Effect.sync(() => unpackEnvValue<T>(process.env[key])),

0.71 packages/alchemy/test/Cloudflare/Website/vite-queue-fixture/worker.ts:15:1
> 15 │ const received: string[] = [];
```
