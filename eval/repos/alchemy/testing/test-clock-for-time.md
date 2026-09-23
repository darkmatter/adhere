# testing/test-clock-for-time

A test that depends on time must use TestClock. Real sleeps and it.live must be used only when real time is required.

The preset words it differently now: A test that depends on time must use TestClock, never a real sleep or it.live, unless the test needs real time.

2 findings, from 0.83 down to 0.71. Each showed this hint:

```ts
it.effect("time-based test", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.delay(Effect.succeed("done"), "10 seconds").pipe(Effect.forkChild);
    yield* TestClock.adjust("10 seconds");
    const result = yield* Fiber.join(fiber);
    expect(result).toBe("done");
  }),
);
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.83 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:78
     Effect.andThen(Effect.sleep("500 millis")),
0.71 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:141
     schedule: Schedule.spaced("1 second"),
```
