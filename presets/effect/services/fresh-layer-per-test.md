---
description: Each it.effect must provide its own layer. it.layer must be used only to share an expensive resource across a suite, never a cheap one.
---

## Must

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

## Never

```ts
it.layer(Counter.layer)("Counter", (it) => {
  it.effect("starts at zero", () => Effect.gen(function* () { /* ... */ }));
  it.effect("increments", () => Effect.gen(function* () { /* ... */ }));
});
```
