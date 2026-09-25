# effect/testing/test-clock-for-time

A test that depends on time must use TestClock, never a real sleep or it.live, unless the test needs real time.

1 finding, at 0.82. It showed this hint:

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

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.82 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:78:11
  65 │     const fiber = yield* Stream.range(0, 1799, 1).pipe(
  66 │       Stream.takeWhile(() => active),
  67 │       Stream.runForEach(() =>
  68 │         getText(url).pipe(
  69 │           Effect.result,
  70 │           Effect.flatMap((result) =>
  71 │             Ref.update(samples, (values) => [
  72 │               ...values,
  73 │               Result.isSuccess(result)
  74 │                 ? { body: result.success }
  75 │                 : { failure: String(result.failure) },
  76 │             ]),
  77 │           ),
> 78 │           Effect.andThen(Effect.sleep("500 millis")),
  79 │         ),
  80 │       ),
  81 │       Effect.timeout("15 minutes"),
  82 │       Effect.forkScoped,
  83 │     );
```
