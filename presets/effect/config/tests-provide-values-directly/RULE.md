---
description: A test should supply config with Layer.succeed on the config service, and should not set environment variables or a ConfigProvider merely to supply configuration to the code under test. Environment or ConfigProvider setup is a violation unless the assertions specifically test configuration decoding, validation, precedence, missing values, environment fallback, or secret-leak prevention; those tests exercise the original inputs. A binding passed to a separate deployed Worker is not environment setup in the test process. Comparing rendered configuration strings is not setting environment variables.
tests: only
---

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
