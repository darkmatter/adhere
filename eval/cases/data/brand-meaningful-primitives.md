# data/brand-meaningful-primitives

A record whose id, email, count, and URL are bare strings and numbers breaks
the rule. Branded fields follow it, next to a free-text message left a string.

```ts breaks
import { Schema } from "effect";

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  customerEmail: Schema.String,
  itemCount: Schema.Number,
  trackingUrl: Schema.String,
}) {}
```

```ts follows
import { Schema } from "effect";
import { Email, TrackingUrl } from "./primitives.ts";

export const OrderId = Schema.String.pipe(Schema.brand("OrderId"));
export type OrderId = typeof OrderId.Type;

export const ItemCount = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
  Schema.brand("ItemCount"),
);
export type ItemCount = typeof ItemCount.Type;

export class Order extends Schema.Class<Order>("Order")({
  id: OrderId,
  customerEmail: Email,
  itemCount: ItemCount,
  trackingUrl: TrackingUrl,
  giftMessage: Schema.String,
}) {}
```
