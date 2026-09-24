---
description: Connections, pools, sockets, and anything else with a finalizer must be acquired inside a handler or method, where the event's scope releases them, never at module scope or in a runtime's construction Effect, whose finalizers may never run.
---

```ts must
Effect.gen(function* () {
  const url = yield* Config.Redacted("DATABASE_URL");
  return {
    fetch: Effect.gen(function* () {
      const pool = yield* Effect.acquireRelease(
        Effect.sync(() => new Pool({ connectionString: Redacted.value(url), max: 1 })),
        (pool) => Effect.promise(() => pool.end()),
      );
      const { rows } = yield* Effect.promise(() => pool.query("select id from users"));
      return yield* HttpServerResponse.json(rows);
    }),
  };
});
```

```ts never
Effect.gen(function* () {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // one pool for the isolate
  yield* Effect.addFinalizer(() => Effect.promise(() => pool.end())); // workerd never runs this
  return { fetch: handlerUsing(pool) };
});
```
