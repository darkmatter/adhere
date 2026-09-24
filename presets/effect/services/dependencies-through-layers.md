---
description: A service that depends on other services must be a Context.Service built by a Layer that yields those services as it is constructed, never a factory function or class that takes services, clients, or their implementations as arguments.
---

```ts must
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound>;
  }
>()("@app/Users") {}

export const UsersLive = Layer.effect(
  Users,
  Effect.gen(function* () {
    const database = yield* Database;
    const logger = yield* Logger;
    return Users.of({
      find: (id) =>
        Effect.gen(function* () {
          yield* logger.log(`finding ${id}`);
          return yield* database.findUser(id);
        }),
    });
  }),
);
```

```ts never
export const makeUsers = (database: Database["Service"], logger: Logger["Service"]) => ({
  find: (id: UserId) =>
    Effect.gen(function* () {
      yield* logger.log(`finding ${id}`);
      return yield* database.findUser(id);
    }),
});

export const program = Effect.gen(function* () {
  const users = makeUsers(yield* Database, yield* Logger);
  return yield* users.find(userId);
});
```
