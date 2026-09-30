---
description: Sequential effectful steps must be written with Effect.gen and yield*, never as nested flatMap or callback chains. A single flatMap or andThen in a flat pipe is out of scope; the rule is about a step whose callback holds further steps.
---

## Must

```ts
const program = Effect.gen(function* () {
  const data = yield* fetchData;
  yield* Effect.logInfo(`Processing data: ${data}`);
  return yield* processData(data);
});
```

## Never

```ts
const page = fetchUser(id).pipe(
  Effect.flatMap((user) =>
    fetchOrders(user.id).pipe(Effect.flatMap((orders) => render(user, orders))),
  ),
);
```
