---
description: A test supplies config with Layer.succeed on the config service, not by setting environment variables or a ConfigProvider.
---

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
