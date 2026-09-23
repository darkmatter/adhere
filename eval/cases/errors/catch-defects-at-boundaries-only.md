# errors/catch-defects-at-boundaries-only

Business logic that swallows a defect breaks the rule; an entry point that
logs a defect before exiting follows it.

```ts breaks
import { Effect } from "effect";
import type { Cart, DiscountCode } from "./domain.ts";
import { Discounts } from "./Discounts.ts";

export const applyDiscount = Effect.fn("applyDiscount")(function* (cart: Cart, code: DiscountCode) {
  const discounts = yield* Discounts;
  return yield* discounts.apply(cart, code).pipe(Effect.catchDefect(() => Effect.succeed(cart)));
});
```

```ts follows
import { BunRuntime } from "@effect/platform-bun";
import { Cause, Effect } from "effect";
import { AppLayer } from "./AppLayer.ts";
import { server } from "./server.ts";

const main = server.pipe(
  Effect.catchDefect((defect) =>
    Effect.logFatal("server stopped on a defect", Cause.pretty(Cause.die(defect))).pipe(
      Effect.andThen(Effect.die(defect)),
    ),
  ),
  Effect.provide(AppLayer),
);

BunRuntime.runMain(main);
```
