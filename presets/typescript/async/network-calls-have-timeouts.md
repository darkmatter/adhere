---
description: An HTTP request, such as a `fetch` or a call through an HTTP client, should carry a timeout or an AbortSignal that ends it, and should not wait without limit.
excludeIf: ["a call through a client configured with a default timeout", "a call whose signal the caller passes in", "a request from browser code to the app's own API"]
level: warning
---

## Should

```ts
const response = await fetch(`${BILLING_URL}/invoices/${id}`, {
  signal: AbortSignal.timeout(5_000),
});
```

## Should not

```ts
const response = await fetch(`${BILLING_URL}/invoices/${id}`);
```
