---
description: Sequential effectful steps must be written with Effect.gen and yield*, never as nested flatMap or callback chains.
---

```ts must
const program = Effect.gen(function* () {
  const data = yield* fetchData;
  yield* Effect.logInfo(`Processing data: ${data}`);
  return yield* processData(data);
});
```

```ts never
const page = fetchUser(id).pipe(
  Effect.flatMap((user) =>
    fetchOrders(user.id).pipe(Effect.flatMap((orders) => render(user, orders))),
  ),
);
```
