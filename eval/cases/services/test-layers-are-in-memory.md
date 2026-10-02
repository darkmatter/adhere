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

A real release-file adapter is allowed to read real files when their bytes are the assertion target.

```ts follows
import { Effect, FileSystem, Path } from "effect";
import { BunServices } from "@effect/platform-bun";
import { expect, test } from "vitest";
import { RunnerReleaseFiles } from "./RunnerReleaseFiles.ts";
test("reads the archive bytes", () => Effect.runPromise(Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = yield* fs.makeTempDirectoryScoped();
  const release = "runner-2026.09.22";
  yield* fs.makeDirectory(path.join(root, release));
  const name = `${release}-linux-x64.tar.gz`;
  const archive = path.join(root, release, name);
  yield* fs.writeFileString(archive, "archive bytes");
  const readArchive = Effect.gen(function* () {
    const files = yield* RunnerReleaseFiles;
    const opened = yield* files.open(release, name);
    expect(opened.bytes).toBe("archive bytes".length);
  });
  yield* readArchive.pipe(Effect.provide(RunnerReleaseFiles.layer(root)));
}).pipe(Effect.provide(BunServices.layer), Effect.scoped)));
```

Calling a loopback server from a replacement service still violates the rule.

```ts breaks
import { Context, Effect, Layer } from "effect";
import { test, expect } from "vitest";
class Cache extends Context.Service<Cache, { readonly get: () => Effect.Effect<string> }>()("Cache") {}
const CacheTest = Layer.succeed(Cache, {
  get: () => Effect.promise(() => fetch("http://localhost:1234/cache").then(r => r.text())),
});
const calculate = Effect.gen(function* () { const cache = yield* Cache; return (yield* cache.get()).length; });
test("calculates with a replacement cache", async () => {
  expect(await Effect.runPromise(calculate.pipe(Effect.provide(CacheTest)))).toBe(5);
});
```
