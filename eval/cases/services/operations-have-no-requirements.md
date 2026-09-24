# services/operations-have-no-requirements

A service whose operations carry dependencies in their requirements type
breaks the rule. The same service with those dependencies acquired when its
Layer is built follows it.

```ts breaks
import { Context, Effect, Layer } from "effect";
import { Database } from "./database.ts";
import type { User, UserId, UserNotFound } from "./domain.ts";

export class Users extends Context.Service<
  Users,
  { readonly find: (id: UserId) => Effect.Effect<User, UserNotFound, Database> }
>()("@app/Users") {}

export const UsersLive = Layer.succeed(Users, {
  find: (id) =>
    Effect.gen(function* () {
      const database = yield* Database;
      return yield* database.findUser(id);
    }),
});
```

```ts follows
import { Context, Effect, Layer } from "effect";
import { Database } from "./database.ts";
import type { User, UserId, UserNotFound } from "./domain.ts";

export class Users extends Context.Service<
  Users,
  { readonly find: (id: UserId) => Effect.Effect<User, UserNotFound> }
>()("@app/Users") {}

export const UsersLive = Layer.effect(
  Users,
  Effect.gen(function* () {
    const database = yield* Database;
    return Users.of({ find: (id) => database.findUser(id) });
  }),
);
```
