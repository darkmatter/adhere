---
description: A resource's logical ID, its first argument, must stay the same from one deploy to the next, never built from timestamps, random values, UUIDs, or commit SHAs, because a new logical ID replaces the resource and deletes the old one with its data.
---

## Must

```ts
const uploads = yield* Cloudflare.R2.Bucket("Uploads");
const jobs = yield* AWS.SQS.Queue("Jobs");
```

## Never

```ts
const uploads = yield* Cloudflare.R2.Bucket(`Uploads-${Date.now()}`);
const db = yield* Neon.Project(`Db-${process.env.GITHUB_SHA}`);
```
