---
description: A service's operations must have no requirements, typed Effect<A, E, never>, with their dependencies acquired when the service's Layer is built, never left in an operation's requirements type, as in Effect<A, E, Database>.
---

## Must

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound, never>;
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

## Never

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound, Database | Logger>;
  }
>()("@app/Users") {}

export const UsersLive = Layer.succeed(Users, {
  find: (id) =>
    Effect.gen(function* () {
      const database = yield* Database;
      const logger = yield* Logger;
      yield* logger.log(`finding ${id}`);
      return yield* database.findUser(id);
    }),
});
```
