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

A boundary adapter that wraps a library's client takes no service, and a
function the service's own Layer calls with what it yielded is part of that
Layer.

```ts follows
import { Context, Effect, Layer, Redacted } from "effect";
import { WebClient } from "@slack/web-api";
import { SlackConfig } from "./config.ts";
import { SlackError } from "./errors.ts";

export class Slack extends Context.Service<
  Slack,
  { readonly post: (channel: string, text: string) => Effect.Effect<void, SlackError> }
>()("@app/Slack") {}

const fromClient = (client: WebClient): Slack["Service"] => ({
  post: (channel, text) =>
    Effect.tryPromise({
      try: () => client.chat.postMessage({ channel, text }),
      catch: (cause) => new SlackError({ cause }),
    }).pipe(Effect.asVoid),
});

export const SlackLive = Layer.effect(
  Slack,
  Effect.map(SlackConfig, (config) => fromClient(new WebClient(Redacted.value(config.token)))),
);
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

const makeBilling = (orders: Orders["Service"], mailer: Mailer["Service"]) =>
  Billing.of({
    invoice: (id) =>
      Effect.gen(function* () {
        const order = yield* orders.get(id);
        yield* mailer.send(order.email, `Invoice for ${order.total}`);
        return order.total;
      }),
  });

export const BillingLive = Layer.effect(
  Billing,
  Effect.gen(function* () {
    return makeBilling(yield* Orders, yield* Mailer);
  }),
);
```
