---
description: Each it.effect provides its own layer. it.layer should be used only to share an expensive resource across a suite.
---

```ts
it.effect("starts at zero", () =>
  Effect.gen(function* () {
    const counter = yield* Counter;
    expect(yield* counter.get()).toBe(0);
  }).pipe(Effect.provide(Counter.layer)),
);

it.effect("increments without leaking", () =>
  Effect.gen(function* () {
    const counter = yield* Counter;
    yield* counter.increment();
    expect(yield* counter.get()).toBe(1);
  }).pipe(Effect.provide(Counter.layer)),
);
```
