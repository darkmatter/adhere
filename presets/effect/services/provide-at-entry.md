---
description: Layers should be provided once at the program entry. A module that is not an entry point does not call Effect.provide.
---

```ts
const appLayer = userServiceLayer.pipe(
  Layer.provideMerge(databaseLayer),
  Layer.provideMerge(loggerLayer),
  Layer.provideMerge(configLayer),
);

const program = Effect.gen(function* () {
  const users = yield* UserService;
  yield* users.getUser();
});

const main = program.pipe(Effect.provide(appLayer));
```
