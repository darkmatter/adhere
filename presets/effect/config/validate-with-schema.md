---
description: A config value with constraints should be read with Config.schema, not mapped and checked by hand.
---

```ts
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
