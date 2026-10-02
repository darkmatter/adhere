---
description: A service that depends on other services must be a Context.Service built by a Layer that yields those services as it is constructed, never a function or class that takes other services' implementations as arguments and returns a service's implementation for its callers to wire by hand.
---

A service wired by hand hides its dependencies from the types, so each caller
builds them again, and a test cannot replace one with a layer.

A function that the service's own Layer calls with the services it yielded is
part of that Layer and is out of scope, and so is a decorator that takes a
service and returns the same service. A boundary adapter that wraps a
library's client, such as an SDK or a Promise API, takes no service and is out
of scope. A function that builds a service from other services is in scope
when code other than that service's Layer calls it.

## Must

```ts
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

## Never

```ts
export const makeUsers = (
  database: Database["Service"],
  logger: Logger["Service"],
): Users["Service"] => ({
  find: (id) =>
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
