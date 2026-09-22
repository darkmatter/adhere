---
description: A test that depends on time uses TestClock. Real sleeps and it.live are used only when real time is required.
---

```ts
it.effect("time-based test", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.delay(Effect.succeed("done"), "10 seconds").pipe(
      Effect.forkChild
    )
    yield* TestClock.adjust("10 seconds")
    const result = yield* Fiber.join(fiber)
    expect(result).toBe("done")
  })
)
```
