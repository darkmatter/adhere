---
description: Each database must have one migration owner: when a resource's migrations prop applies the directory, scripts and CI must never also run drizzle-kit migrate or prisma migrate against the same database.
---

## Must

```ts
const branch = yield* Neon.Branch("Main", { project, migrations: "./migrations" });
// package.json: "deploy": "alchemy deploy"
```

## Never

```ts
const branch = yield* Neon.Branch("Main", { project, migrations: "./migrations" });
// package.json: "deploy": "drizzle-kit migrate && alchemy deploy"
```
