---
description: Layers must be provided once at the program entry. A module that is not an entry point must never call Effect.provide.
---

```ts must
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

```ts never
export const getUser = (id: string) =>
  UserRepo.find(id).pipe(Effect.provide(UserRepo.layer));
```
