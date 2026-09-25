---
description: The delete handler of a resource provider, the `delete:` lifecycle method given the resource's `output`, must treat a resource that is already gone as success, catching the not-found error, never failing when it runs again. Code outside a provider's delete handler, such as a runtime binding, a Worker route, or a storage client, is not in scope.
level: warning
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
