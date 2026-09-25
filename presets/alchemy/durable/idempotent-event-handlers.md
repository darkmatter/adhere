---
description: A handler for events delivered at least once, such as Stripe webhooks, scheduled callbacks, or bucket and queue events, must be idempotent, upserting by a stable ID or deduplicating by event ID, never doing blind inserts, increments, or charges.
---

## Must

```ts
yield* Stripe.consumeEvents([CustomerSubscriptionUpdated], (event) =>
  kv.put(`entitlement:${event.data.object.customer}`, JSON.stringify(entitlementOf(event))),
);
```

## Never

```ts
yield* Stripe.consumeEvents([InvoicePaid], (event) =>
  sql`UPDATE accounts SET credits = credits + 100 WHERE customer = ${event.data.object.customer}`,
);
```
