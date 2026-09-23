# services/fresh-layer-per-test

A cheap in-memory service shared across a suite with `it.layer` breaks the
rule. A layer provided per test follows it, and so does `it.layer` for a
Postgres container, the expensive resource the rule allows sharing.

```ts breaks
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { Cart } from "../src/Cart.ts";

it.layer(Cart.layer)("Cart", (it) => {
  it.effect("starts empty", () =>
    Effect.gen(function* () {
      const cart = yield* Cart;
      expect(yield* cart.items).toEqual([]);
    }),
  );

  it.effect("adds an item", () =>
    Effect.gen(function* () {
      const cart = yield* Cart;
      yield* cart.add("sku-1");
      expect(yield* cart.items).toEqual(["sku-1"]);
    }),
  );
});
```

```ts follows
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { Cart } from "../src/Cart.ts";

it.effect("starts empty", () =>
  Effect.gen(function* () {
    const cart = yield* Cart;
    expect(yield* cart.items).toEqual([]);
  }).pipe(Effect.provide(Cart.layer)),
);

it.effect("adds an item", () =>
  Effect.gen(function* () {
    const cart = yield* Cart;
    yield* cart.add("sku-1");
    expect(yield* cart.items).toEqual(["sku-1"]);
  }).pipe(Effect.provide(Cart.layer)),
);
```

```ts follows
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { UserRepo } from "../src/UserRepo.ts";
import { PostgresContainer } from "./containers.ts";

// One Postgres container for the suite: starting one takes seconds.
it.layer(PostgresContainer.layer, { timeout: "2 minutes" })("UserRepo on Postgres", (it) => {
  it.effect("saves and finds a user", () =>
    Effect.gen(function* () {
      const users = yield* UserRepo;
      yield* users.save({ id: "u-1", email: "ada@example.com" });
      expect((yield* users.find("u-1")).email).toBe("ada@example.com");
    }).pipe(Effect.provide(UserRepo.layer)),
  );
});
```
