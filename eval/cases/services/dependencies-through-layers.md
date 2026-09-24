# services/dependencies-through-layers

A service built by a factory function, or a class, that takes the services it
depends on as arguments breaks the rule. A `Context.Service` whose Layer yields
its dependencies follows it, and so does a plain helper that takes data rather
than services.

```ts breaks
import { Effect } from "effect";
import type { Mailer } from "./mailer.ts";
import type { Orders } from "./orders.ts";
import type { OrderId } from "./domain.ts";

export const createBilling = (orders: Orders["Service"], mailer: Mailer["Service"]) => ({
  invoice: (id: OrderId) =>
    Effect.gen(function* () {
      const order = yield* orders.get(id);
      yield* mailer.send(order.email, `Invoice for ${order.total}`);
      return order.total;
    }),
});
```

```ts breaks
import { Effect } from "effect";
import type { Mailer } from "./mailer.ts";
import type { Orders } from "./orders.ts";
import type { OrderId } from "./domain.ts";

export class BillingService {
  constructor(
    private readonly orders: Orders["Service"],
    private readonly mailer: Mailer["Service"],
  ) {}

  invoice(id: OrderId) {
    const { orders, mailer } = this;
    return Effect.gen(function* () {
      const order = yield* orders.get(id);
      yield* mailer.send(order.email, `Invoice for ${order.total}`);
      return order.total;
    });
  }
}
```

```ts follows
import { Context, Effect, Layer } from "effect";
import { Mailer } from "./mailer.ts";
import { Orders } from "./orders.ts";
import type { Money, OrderId, OrderNotFound } from "./domain.ts";

export class Billing extends Context.Service<
  Billing,
  { readonly invoice: (id: OrderId) => Effect.Effect<Money, OrderNotFound> }
>()("@app/Billing") {}

export const BillingLive = Layer.effect(
  Billing,
  Effect.gen(function* () {
    const orders = yield* Orders;
    const mailer = yield* Mailer;
    return Billing.of({
      invoice: (id) =>
        Effect.gen(function* () {
          const order = yield* orders.get(id);
          yield* mailer.send(order.email, `Invoice for ${order.total}`);
          return order.total;
        }),
    });
  }),
);
```

```ts follows
import type { LineItem, Money } from "./domain.ts";

export const totalOf = (items: ReadonlyArray<LineItem>, taxRate: number): Money =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + taxRate);
```
