# testing/test-random

A test that draws its inputs from `Math.random` breaks the rule; one that
seeds `Random` with `Random.withSeed` follows it.

```ts breaks
import { expect, it } from "vitest";
import { assignBucket } from "../src/experiments.ts";

it("assigns every user to bucket A or B", () => {
  for (let i = 0; i < 100; i++) {
    const userId = `user-${Math.floor(Math.random() * 1_000_000)}`;
    expect(["A", "B"]).toContain(assignBucket(userId));
  }
});
```

```ts follows
import { expect, it } from "@effect/vitest";
import { Effect, Random } from "effect";
import { shuffle } from "../src/deck.ts";

it.effect("shuffles the same way for the same seed", () =>
  Effect.gen(function* () {
    const deck = Array.from({ length: 52 }, (_, index) => index);
    const first = yield* shuffle(deck).pipe(Random.withSeed("deck-seed"));
    const second = yield* shuffle(deck).pipe(Random.withSeed("deck-seed"));
    expect(first).toEqual(second);
  }),
);
```
