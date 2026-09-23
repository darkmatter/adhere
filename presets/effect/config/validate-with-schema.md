---
description: A config value with constraints must be read with Config.schema, never mapped and checked by hand.
---

```ts must
const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
);
const Environment = Schema.Literals(["development", "staging", "production"]);

const program = Effect.gen(function* () {
  const port = yield* Config.schema(Port, "PORT");
  const env = yield* Config.schema(Environment, "ENV");

  return { port, env };
});
```

```ts never
const timeoutMs = yield* Config.number("TIMEOUT_MS");
if (timeoutMs <= 0 || timeoutMs > 60_000) {
  return yield* Effect.die("TIMEOUT_MS out of range");
}
```
