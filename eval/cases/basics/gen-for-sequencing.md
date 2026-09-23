# basics/gen-for-sequencing

Sequential steps as nested `flatMap` break the rule. The same steps in
`Effect.gen` follow it, and so does a single `map`, which sequences nothing.

```ts breaks
import { Effect } from "effect";
import { Carts, Orders, Payments, Pricing } from "./services.ts";

export const checkout = Carts.current.pipe(
  Effect.flatMap((cart) =>
    Pricing.total(cart).pipe(
      Effect.flatMap((total) =>
        Payments.charge(cart.customerId, total).pipe(
          Effect.flatMap((receipt) => Orders.create(cart, receipt)),
        ),
      ),
    ),
  ),
);
```

```ts follows
import { Effect } from "effect";
import { Carts, Orders, Payments, Pricing } from "./services.ts";

export const checkout = Effect.gen(function* () {
  const cart = yield* Carts.current;
  const total = yield* Pricing.total(cart);
  const receipt = yield* Payments.charge(cart.customerId, total);
  return yield* Orders.create(cart, receipt);
});
```

```ts follows
import { Effect } from "effect";
import { Carts } from "./services.ts";

export const cartSize = Carts.current.pipe(Effect.map((cart) => cart.items.length));
```
