# effect/config/tests-provide-values-directly

A test should supply config with Layer.succeed on the config service, and should not set environment variables or a ConfigProvider to do it.

2 findings, from 0.80 down to 0.74. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.80 packages/alchemy/test/Git/fixtures/test-auth.ts:32:1
  29 │ export const TEST_SECRET_DEV = "test-secret-git-service-suite-dev";
  30 │ export const TEST_USER = { id: "e2e", name: "Suite" } as const;
  31 │ export const TEST_USER_DEV = { id: "dev", name: "Dev" } as const;
> 32 │ process.env.GIT_SERVICE_SECRET ??= TEST_SECRET;

0.74 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:316:1
> 316 │ );
```
