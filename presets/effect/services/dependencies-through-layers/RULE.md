---
description: A service that depends on other services must be a Context.Service built by a Layer that yields those services as it is constructed, never a factory function or class that takes services, clients, or their implementations as arguments and returns the service's operations with them built in. A helper that performs one operation and returns an Effect of result data is not a service factory, even when its dependencies are grouped in an object, include configuration Effects or caches, or it calls other operation helpers. Returning an Effect that constructs reusable operations is still a service factory; calling that factory inside a Layer does not exempt it. The code that assembles a service from operation helpers is in scope.
---

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

// One operation returns data, not reusable service operations. Grouped
// dependencies and shared caches do not change that distinction.
export const installationToken = Effect.fn("App.installationToken")(function* (
  deps: {
    readonly config: Effect.Effect<{ readonly origin: string }>;
    readonly transport: {
      readonly token: (origin: string, id: number) => Effect.Effect<string>;
    };
    readonly tokens: Ref.Ref<ReadonlyMap<number, string>>;
  },
  id: number,
) {
  const { origin } = yield* deps.config;
  const cached = (yield* Ref.get(deps.tokens)).get(id);
  if (cached !== undefined) return { token: cached, origin };
  const token = yield* deps.transport.token(origin, id);
  yield* Ref.update(deps.tokens, (tokens) => new Map(tokens).set(id, token));
  return { token, origin };
});
```

## Never

```ts
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
