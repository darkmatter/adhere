---
description: A test that depends on randomness controls it with a fixed seed through Random.withSeed, not Math.random or an unseeded Random.
---

```ts
const program = Effect.gen(function*() {
  const value1 = yield* Random.next
  const value2 = yield* Random.next
  return [value1, value2]
})

await Effect.runPromise(Effect.all([
  program.pipe(Random.withSeed("my-seed")),
  program.pipe(Random.withSeed("my-seed"))
])) // => [[0.018368576514773527, 0.4010840628128671], [0.018368576514773527, 0.4010840628128671]]
```
