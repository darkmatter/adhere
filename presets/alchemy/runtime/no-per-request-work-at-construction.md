---
description: A runtime's construction Effect runs at deploy time and again at cold start, so it must only build resources, bindings, layers, and handler groups, never do per-request work such as queries, writes, bound calls, or starting consumers.
---

## Must

```ts
Effect.gen(function* () {
  const table = yield* AWS.DynamoDB.Table("Jobs", { partitionKey: "id", attributes: { id: "S" } });
  const putItem = yield* AWS.DynamoDB.PutItem(table);
  return {
    fetch: Effect.gen(function* () {
      yield* putItem({ Item: { id: { S: crypto.randomUUID() } } });
      return HttpServerResponse.empty({ status: 202 });
    }),
  };
});
```

## Never

```ts
Effect.gen(function* () {
  const putItem = yield* AWS.DynamoDB.PutItem(table);
  yield* putItem({ Item: { id: { S: "seed" } } }); // runs at deploy and on every cold start
  return { fetch: handler };
});
```
