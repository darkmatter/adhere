# data/records-are-schema-classes

A domain record as an interface breaks the rule. A `Schema.Class` follows it,
next to an options interface that is not a domain record.

```ts breaks
import type { CustomerId, PlanId, SubscriptionId } from "./ids.ts";

export interface Subscription {
  readonly id: SubscriptionId;
  readonly customerId: CustomerId;
  readonly planId: PlanId;
  readonly renewsAt: Date;
  readonly cancelled: boolean;
}
```

```ts follows
import { Schema } from "effect";
import { CustomerId, PlanId, SubscriptionId } from "./ids.ts";

export class Subscription extends Schema.Class<Subscription>("Subscription")({
  id: SubscriptionId,
  customerId: CustomerId,
  planId: PlanId,
  renewsAt: Schema.Date,
  cancelled: Schema.Boolean,
}) {}

/** How the renewal job runs. */
export interface RenewalOptions {
  readonly dryRun: boolean;
  readonly verbose: boolean;
}
```
