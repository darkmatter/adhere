---
description: A test that depends on time must use TestClock. Real sleeps and it.live must be used only when real time is required.
---

```ts must
it.effect("time-based test", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.delay(Effect.succeed("done"), "10 seconds").pipe(Effect.forkChild);
    yield* TestClock.adjust("10 seconds");
    const result = yield* Fiber.join(fiber);
    expect(result).toBe("done");
  }),
);
```

```ts never
it.live("retries after a delay", () =>
  Effect.gen(function* () {
    yield* Effect.sleep("2 seconds");
    expect(yield* attempts).toBe(2);
  }),
);
```
