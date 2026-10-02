---
description: A test of code that consumes configuration should supply it with Layer.succeed on the config service, and should not set environment variables or a ConfigProvider to do it.
tests: only
---

Code that reads its settings from the environment in a test reads them from
the environment in production too, so a test that sets them hides that the
code skips the config service.

A test whose subject is how configuration is read, such as its decoding,
defaults, precedence, or fallback to the environment, has to supply raw
inputs and is out of scope. So are values a test plants to check that they
never leak, and the bindings of a separately deployed Worker. A test or
fixture that sets the environment so the code under test reads its settings
from there is in scope, even in a file that also tests a loader.

## Should

```ts
Effect.runPromise(
  program.pipe(
    Effect.provide(
      Layer.succeed(ApiConfig, {
        apiKey: Redacted.make("test-key"),
        baseUrl: "https://test.example.com",
      }),
    ),
  ),
);
```

## Should not

```ts
beforeAll(() => {
  process.env.DATABASE_URL = "postgres://localhost/test";
});
```
