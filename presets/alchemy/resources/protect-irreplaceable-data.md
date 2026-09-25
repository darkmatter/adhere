---
description: A bucket or database holding user or business data should be retained with RemovalPolicy.retain(), at least in production, and forceDestroy should be set only on buckets whose contents are disposable; irreplaceable data should not depend on the default destroy policy.
---

## Should

```ts
const uploads = yield* Cloudflare.R2.Bucket("Uploads").pipe(RemovalPolicy.retain(stage === "prod"));
const cache = yield* Cloudflare.R2.Bucket("Cache", { forceDestroy: true });
```

## Should not

```ts
const userUploads = yield* Cloudflare.R2.Bucket("UserUploads", { forceDestroy: true });
```
