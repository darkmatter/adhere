---
description: Workflow task, sleep, and waitForEvent names are replay keys, so they must be stable across replays, never built from the clock, randomness, or other values that change between runs.
---

```ts must
yield* Cloudflare.Workflows.task("charge-card", chargeCard(input.orderId));
```

```ts never
yield* Cloudflare.Workflows.task(`charge-${Date.now()}`, chargeCard(input.orderId));
```
