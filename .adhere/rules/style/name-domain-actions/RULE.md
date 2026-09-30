---
description: A function must be named after the domain action it performs, never after a generic verb like handle.
threshold: 0.8
---

## Must

```ts
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
```

## Never

The code under Never shows what a violation looks like. It is optional, and a
rule can have it without the code under Must.

```ts
export const handle = (id: string) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(id);
  });
```
