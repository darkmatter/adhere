---
description: A Hyperdrive connection's origin should be the database's direct endpoint, and clients that connect without Hyperdrive should use the provider's pooled endpoint; Hyperdrive should not point at a provider pooler, which stacks two poolers.
---

## Should

```ts
const hyperdrive = yield* Cloudflare.Hyperdrive.Connection("AppHyperdrive", {
  origin: branch.origin,
  dev: branch.pooledOrigin,
});
```

## Should not

```ts
const hyperdrive = yield* Cloudflare.Hyperdrive.Connection("AppHyperdrive", { origin: role.pooledOrigin });
```
