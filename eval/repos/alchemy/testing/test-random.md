# testing/test-random

A test that depends on randomness must control it with a fixed seed through Random.withSeed, never with Math.random or an unseeded Random.

Since left out of the preset, for Effect's language service to check (4ae0126).

1 finding, at 0.79. It showed this hint:

```ts
const program = Effect.gen(function* () {
  const value1 = yield* Random.next;
  const value2 = yield* Random.next;
  return [value1, value2];
});

await Effect.runPromise(
  Effect.all([program.pipe(Random.withSeed("my-seed")), program.pipe(Random.withSeed("my-seed"))]),
); // => [[0.018368576514773527, 0.4010840628128671], [0.018368576514773527, 0.4010840628128671]]
```

The probability, where Jev pointed, and that line:

```text
0.79 packages/alchemy/test/AWS/XRay/handler.ts:181
     Math.floor(Math.random() * 16).toString(16),
```
