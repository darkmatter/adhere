---
description: A config value with constraints must be validated as it is read, with Config.schema or Config.mapOrFail, never checked by hand after reading.
---

## Must

```ts
const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
);
const Environment = Schema.Literals(["development", "staging", "production"]);

const program = Effect.gen(function* () {
  const port = yield* Config.schema(Port, "PORT");
  const env = yield* Config.schema(Environment, "ENV");
  const timeoutMs = yield* Config.int("TIMEOUT_MS").pipe(
    Config.mapOrFail((ms) =>
      ms > 0 && ms <= 60_000
        ? Effect.succeed(ms)
        : Effect.fail(
            new Config.ConfigError(
              new ConfigProvider.SourceError({ message: "TIMEOUT_MS must be 1 to 60000" }),
            ),
          ),
    ),
  );

  return { port, env, timeoutMs };
});
```

## Never

```ts
const timeoutMs = yield* Config.number("TIMEOUT_MS");
if (timeoutMs <= 0 || timeoutMs > 60_000) {
  return yield* Effect.die("TIMEOUT_MS out of range");
}
```
