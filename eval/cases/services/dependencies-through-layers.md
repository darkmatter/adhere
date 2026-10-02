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

A grouped dependency argument does not turn an operation's result data into a
service. Cached credentials remain data; no returned member performs later calls.

```ts follows
import { Effect, Ref } from "effect";

interface Dependencies {
  readonly config: Effect.Effect<{ readonly origin: string }>;
  readonly transport: {
    readonly token: (origin: string, installation: number) => Effect.Effect<string>;
  };
  readonly tokens: Ref.Ref<ReadonlyMap<number, string>>;
}

export const installationToken = Effect.fn("App.installationToken")(function* (
  deps: Dependencies,
  installation: number,
) {
  const settings = yield* deps.config;
  const cached = (yield* Ref.get(deps.tokens)).get(installation);
  if (cached !== undefined) return { token: cached, origin: settings.origin };
  const token = yield* deps.transport.token(settings.origin, installation);
  yield* Ref.update(deps.tokens, (tokens) => new Map(tokens).set(installation, token));
  return { token, origin: settings.origin };
});
```

An Effect that returns operations is a factory even when a Layer calls it.

```ts breaks
import { Context, Effect, Layer } from "effect";

class Database extends Context.Service<
  Database,
  { readonly read: (id: string) => Effect.Effect<string> }
>()("Database") {}

class Users extends Context.Service<
  Users,
  { readonly find: (id: string) => Effect.Effect<string> }
>()("Users") {}

const makeUsers = (deps: { readonly database: Database["Service"] }) =>
  Effect.succeed(Users.of({ find: (id) => deps.database.read(id) }));

export const UsersLive = Layer.effect(
  Users,
  Effect.gen(function* () {
    return yield* makeUsers({ database: yield* Database });
  }),
);
```
