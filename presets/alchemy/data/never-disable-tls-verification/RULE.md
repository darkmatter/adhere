---
description: A database client or migration config must verify the server's TLS certificate, or connect inside the private network, never setting rejectUnauthorized: false or sslmode=no-verify to make a connection work.
---

## Must

```ts
const url = new URL(connection.connectionString);
url.searchParams.set("sslmode", "verify-full");
const db = yield* Drizzle.Postgres(url.toString());
```

## Never

```ts
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } },
});
```
