---
description: Migrations must be generated and reviewed ahead of time, committed with the schema, and applied from the committed files; a deploy, deploy hook, or Action must never generate migration SQL, and schema changes must never run from an HTTP route.
---

```ts must
// package.json: "db:generate": "drizzle-kit generate" (run locally, then commit ./drizzle)
const db = yield* Cloudflare.D1.Database("AppDb", { migrations: "./drizzle" });
```

```ts never
// package.json: "deploy": "drizzle-kit generate && alchemy deploy"
fetch: Effect.gen(function* () {
  if (url.pathname === "/setup") yield* sql`CREATE TABLE users (id text primary key)`;
}),
```
