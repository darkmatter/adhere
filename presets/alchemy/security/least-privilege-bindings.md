---
description: A runtime should bind the narrowest capability its calls need, a Read or Write binding when it only reads or only writes, and should not bind ReadWrite for one-sided use.
---

```ts should
const bucket = yield* Cloudflare.R2.ReadBucket(Uploads);
return { fetch: Effect.gen(function* () { return yield* bucket.get("report.json"); }) };
```

```ts should not
const bucket = yield* Cloudflare.R2.ReadWriteBucket(Uploads); // only get is ever called
return { fetch: Effect.gen(function* () { return yield* bucket.get("report.json"); }) };
```
