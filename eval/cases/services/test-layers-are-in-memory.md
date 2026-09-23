# services/test-layers-are-in-memory

A test layer backed by a SQLite file breaks the rule; one over an in-memory
`Map` follows it.

```ts breaks
import { SqliteClient } from "@effect/sql-sqlite-bun";
import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { UserRepo } from "../src/UserRepo.ts";

export const UserRepoTest = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL)`;
    return UserRepo.of({
      find: (id) => sql`SELECT * FROM users WHERE id = ${id}`.pipe(Effect.map((rows) => rows[0])),
      save: (user) => sql`INSERT INTO users VALUES (${user.id}, ${user.email})`.pipe(Effect.asVoid),
    });
  }),
).pipe(Layer.provide(SqliteClient.layer({ filename: "test.db" })));
```

```ts follows
import { Effect, Layer, Option } from "effect";
import type { User, UserId } from "../src/User.ts";
import { UserRepo } from "../src/UserRepo.ts";

export const UserRepoTest = Layer.sync(UserRepo, () => {
  const users = new Map<UserId, User>();
  return UserRepo.of({
    find: (id) => Effect.succeed(Option.fromNullishOr(users.get(id))),
    save: (user) => Effect.sync(() => void users.set(user.id, user)),
  });
});
```
