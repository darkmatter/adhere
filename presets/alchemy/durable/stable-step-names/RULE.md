---
description: Workflow task, sleep, and waitForEvent names are replay keys, so they must be stable across replays, never built from the clock, randomness, or other values that change between runs.
---

## Must

```ts
yield* Cloudflare.Workflows.task("charge-card", chargeCard(input.orderId));
```

## Never

```ts
yield* Cloudflare.Workflows.task(`charge-${Date.now()}`, chargeCard(input.orderId));
```
