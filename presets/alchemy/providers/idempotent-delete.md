---
description: A custom provider's delete must treat a resource that is already gone as success, catching the not-found error, never failing when it runs again.
---

## Must

```ts
delete: ({ output }) =>
  Effect.tryPromise(() => stripe.products.del(output.productId)).pipe(
    Effect.catchIf(isNotFound, () => Effect.void),
  ),
```

## Never

```ts
delete: ({ output }) => Effect.promise(() => stripe.products.del(output.productId)),
```
