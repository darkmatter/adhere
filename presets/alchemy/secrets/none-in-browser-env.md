---
description: A value in an env key that a framework inlines into the browser bundle, such as VITE_, NEXT_PUBLIC_, PUBLIC_, or NUXT_PUBLIC_, must be public configuration, never a secret, credential, or connection string, even wrapped in Redacted.
---

## Must

```ts
const site = yield* Cloudflare.Website.Vite("Site", {
  env: { VITE_API_URL: api.url, STRIPE_SECRET_KEY: Config.Redacted("STRIPE_SECRET_KEY") },
});
```

## Never

```ts
const site = yield* Cloudflare.Website.Vite("Site", {
  env: { VITE_STRIPE_SECRET_KEY: Config.Redacted("STRIPE_SECRET_KEY"), VITE_DATABASE_URL: branch.connectionUri },
});
```
