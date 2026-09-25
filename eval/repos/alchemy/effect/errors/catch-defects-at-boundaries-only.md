# effect/errors/catch-defects-at-boundaries-only

Defects must be caught only at a system boundary for logging or shutdown, never in business logic.

1 finding, at 0.77. It showed this hint:

```ts
// At app entry: if config fails, nothing can proceed
const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie);
  yield* Effect.log(`Starting on port ${config.port}`);
});
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:404:9
  395 │ const retryWorkflowControl = <A, R>(
  396 │   operation: string,
  397 │   effect: Effect.Effect<A, never, R>,
  398 │ ) =>
  399 │   effect.pipe(
  400 │     Effect.catchDefect((defect) =>
  401 │       Cause.isUnknownError(defect) &&
  402 │       defect.cause instanceof Error &&
  403 │       defect.cause.message === "internal error"
> 404 │         ? Effect.fail(
  405 │             new WorkflowControlUnavailable({ operation, cause: defect.cause }),
  406 │           )
  407 │         : Effect.die(defect),
  408 │     ),
  409 │     Effect.tapError(() =>
  410 │       Effect.logWarning(`Native Workflow ${operation} unavailable; retrying`),
  411 │     ),
  412 │     Effect.retry({ schedule: Schedule.exponential("250 millis"), times: 4 }),
  413 │     Effect.orDie,
  414 │   );
```
