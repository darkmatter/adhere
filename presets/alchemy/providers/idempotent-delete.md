---
description: A custom provider's delete must treat a resource that is already gone as success, catching the not-found error, never failing when it runs again.
---

```ts must
delete: ({ output }) =>
  Effect.tryPromise(() => stripe.products.del(output.productId)).pipe(
    Effect.catchIf(isNotFound, () => Effect.void),
  ),
```

```ts never
delete: ({ output }) => Effect.promise(() => stripe.products.del(output.productId)),
```
