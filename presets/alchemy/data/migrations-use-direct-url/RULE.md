---
description: A migration runner must connect with the database's direct URL, never Hyperdrive's runtime connection string or an Accelerate or pooled URL.
---

## Must

```ts
export default defineConfig({ dialect: "postgresql", dbCredentials: { url: process.env.DIRECT_DATABASE_URL! } });
```

## Never

```ts
export default defineConfig({ dialect: "postgresql", dbCredentials: { url: process.env.ACCELERATE_URL! } });
```
