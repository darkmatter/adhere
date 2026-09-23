---
description: Sequential effectful steps should be written with Effect.gen and yield*, not nested flatMap or callback chains.
---

```ts
const program = Effect.gen(function* () {
  const data = yield* fetchData;
  yield* Effect.logInfo(`Processing data: ${data}`);
  return yield* processData(data);
});
```
