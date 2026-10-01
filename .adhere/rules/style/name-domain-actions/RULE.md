---
description: A function must be named after the domain action it performs, never after a generic verb like handle.
threshold: 0.8
---

Why: a name like `handle` or `process` says nothing about what the function
does, so every caller has to open it to find out.

## Must

```ts
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
```

## Never

```ts
export const handle = (id: string) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(id);
  });
```
