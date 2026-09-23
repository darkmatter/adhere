# basics/instrument-with-pipe

A timeout, retry, and span wrapped around calls inside the body break the
rule; the same instrumentation attached with `.pipe` follows it.

```ts breaks
import { Effect, Schedule } from "effect";
import { Catalog } from "./Catalog.ts";

export const syncCatalog = Effect.gen(function* () {
  const items = yield* Effect.retry(
    Effect.timeout(Catalog.fetchAll, "5 seconds"),
    Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3))),
  );
  return yield* Effect.withSpan(Catalog.store(items), "storeCatalog");
});
```

```ts follows
import { Effect, Schedule } from "effect";
import { Catalog } from "./Catalog.ts";

export const syncCatalog = Effect.gen(function* () {
  const items = yield* Catalog.fetchAll;
  return yield* Catalog.store(items);
}).pipe(
  Effect.timeout("30 seconds"),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)))),
  Effect.tap((stored) => Effect.logInfo(`Stored ${stored} catalog items`)),
  Effect.withSpan("syncCatalog"),
);
```
