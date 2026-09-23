---
description: A named function that returns an Effect must be defined with Effect.fn so the call site is traced, never as a plain arrow function or function declaration. An Effect held in a constant, such as `const program = Effect.gen(...)`, is not a function and is not in scope.
---

```ts must
const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user ${userId}`);
  const user = yield* getUser(userId);
  return yield* processData(user);
});
```

```ts never
const loadUser = (id: string) =>
  Effect.gen(function* () {
    const repo = yield* UserRepo;
    return yield* repo.find(id);
  });
```
