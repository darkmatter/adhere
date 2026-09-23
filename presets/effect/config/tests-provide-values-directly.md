---
description: A test must supply config with Layer.succeed on the config service, never by setting environment variables or a ConfigProvider.
---

```ts must
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

```ts never
beforeAll(() => {
  process.env.DATABASE_URL = "postgres://localhost/test";
});
```
