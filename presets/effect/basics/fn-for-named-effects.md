---
description: A named function that returns an Effect should be defined with Effect.fn so the call site is traced.
---

```ts
const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user ${userId}`);
  const user = yield* getUser(userId);
  return yield* processData(user);
});
```
