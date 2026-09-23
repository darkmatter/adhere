# errors/catch-defects-at-boundaries-only

Defects must be caught only at a system boundary for logging or shutdown, never in business logic.

2 findings, from 0.77 down to 0.72. Each showed this hint:

```ts
// At app entry: if config fails, nothing can proceed
const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie);
  yield* Effect.log(`Starting on port ${config.port}`);
});
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:405
     new WorkflowControlUnavailable({ operation, cause: defect.cause }),
0.72 packages/alchemy/src/AWS/ControlTower/internal.ts:24
     Effect.catch(() => Effect.succeed({} as Record<string, string>)),
```
