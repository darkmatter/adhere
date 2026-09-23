# config/tests-provide-values-directly

A test must supply config with Layer.succeed on the config service, never by setting environment variables or a ConfigProvider.

4 findings, from 0.79 down to 0.71. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.79 packages/alchemy/test/AWS/Secret/fixtures/handler.ts:49
     // `process.env[CONFIG_SECRET_ENV_KEY]` before deploying, so source
0.76 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:316
     );
0.76 packages/alchemy/test/Git/fixtures/test-auth.ts:32
     process.env.GIT_SERVICE_SECRET ??= TEST_SECRET;
0.71 packages/cloudflare-runtime/src/core/test/helpers/runtime.ts:32
     ConfigProvider.layer(
```
