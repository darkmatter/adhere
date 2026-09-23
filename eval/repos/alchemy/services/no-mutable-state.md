# services/no-mutable-state

A service must expose only readonly members, never mutable state.

3 findings, from 0.78 down to 0.72. Each showed this hint:

```ts
class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>()("@app/Logger") {}
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.78 packages/alchemy/test/Cloudflare/Website/vite-cron-fixture/worker.ts:15
     scheduledCount += 1;
0.76 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:42
     env,
0.72 packages/alchemy/test/Git/harness/store.ts:115
     const rows: Array<never> = [];
```
