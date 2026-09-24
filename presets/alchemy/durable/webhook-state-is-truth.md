---
description: Access to paid features must be gated on state recorded from Stripe webhooks in the app's own store, never granted because the user reached a success_url or return_url.
---

```ts must
const entitlement = yield* kv.get(`entitlement:${customerId}`);
if (entitlement === null) return HttpServerResponse.empty({ status: 402 });
```

```ts never
if (url.pathname === "/welcome") {
  yield* kv.put(`entitlement:${customerId}`, "active"); // reached the success URL, not paid
}
```
