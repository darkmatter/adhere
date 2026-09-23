---
description: Timeouts, retries, logging, and spans must be attached with .pipe, never written into the body of the effect.
---

```ts must
const program = fetchData.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)))),
  Effect.tap((data) => Effect.logInfo(`Fetched: ${data}`)),
  Effect.withSpan("fetchData"),
);
```

```ts never
const report = Effect.gen(function* () {
  const rows = yield* Effect.timeout(loadRows, "5 seconds");
  return yield* Effect.withSpan(summarize(rows), "summarize");
});
```
