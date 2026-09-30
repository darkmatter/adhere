---
description: Awaited calls that do not depend on each other's results should run concurrently, with `Promise.all` or `Promise.allSettled`, and should not be awaited one after another or one per loop iteration.
excludeIf: ["calls that must run in order, such as writes whose order matters", "calls spaced out on purpose, such as to respect a rate limit"]
level: warning
---

## Should

```ts
const [user, orders, preferences] = await Promise.all([
  getUser(userId),
  getOrders(userId),
  getPreferences(userId),
]);
```

## Should not

```ts
const user = await getUser(userId);
const orders = await getOrders(userId);
const preferences = await getPreferences(userId);
```
