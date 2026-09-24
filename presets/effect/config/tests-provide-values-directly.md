---
description: A test should supply config with Layer.succeed on the config service, and should not set environment variables or a ConfigProvider to do it.
---

```ts should
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

```ts should not
beforeAll(() => {
  process.env.DATABASE_URL = "postgres://localhost/test";
});
```
