# errors/defects-for-bugs

A typed error for a corrupted invariant breaks the rule. A defect for the
invariant follows it, next to a typed error for a failure the caller handles.

```ts breaks
import { Effect, Schema } from "effect";
import type { Order } from "./Order.ts";
import { Warehouse } from "./Warehouse.ts";

export class ReservationCorrupted extends Schema.TaggedError<ReservationCorrupted>()(
  "ReservationCorrupted",
  { sku: Schema.String, reserved: Schema.Number, onHand: Schema.Number },
) {}

export const allocate = Effect.fn("allocate")(function* (order: Order) {
  const warehouse = yield* Warehouse;
  const stock = yield* warehouse.stockFor(order.sku);
  if (stock.reserved > stock.onHand) {
    return yield* new ReservationCorrupted({
      sku: order.sku,
      reserved: stock.reserved,
      onHand: stock.onHand,
    });
  }
  return yield* warehouse.reserve(order);
});
```

```ts follows
import { Effect, Schema } from "effect";
import type { Order } from "./Order.ts";
import { Warehouse } from "./Warehouse.ts";

export class OutOfStock extends Schema.TaggedError<OutOfStock>()("OutOfStock", {
  sku: Schema.String,
  requested: Schema.Number,
}) {}

export const allocate = Effect.fn("allocate")(function* (order: Order) {
  const warehouse = yield* Warehouse;
  const stock = yield* warehouse.stockFor(order.sku);
  if (stock.reserved > stock.onHand) {
    return yield* Effect.die(
      `reserved ${stock.reserved} exceeds on hand ${stock.onHand} for ${order.sku}`,
    );
  }
  if (stock.onHand - stock.reserved < order.quantity) {
    return yield* new OutOfStock({ sku: order.sku, requested: order.quantity });
  }
  return yield* warehouse.reserve(order);
});
```
