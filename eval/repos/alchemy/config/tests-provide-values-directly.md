# config/tests-provide-values-directly

A test must supply config with Layer.succeed on the config service, never by setting environment variables or a ConfigProvider.

The preset words it differently now: A test should supply config with Layer.succeed on the config service, and should not set environment variables or a ConfigProvider to do it.

6 findings, from 0.79 down to 0.71. Each showed this hint:

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
0.79 packages/alchemy/test/AWS/Secret/fixtures/handler.ts:49:5
  47 │     // Secret from a `Config` — resolved against the active
  48 │     // `ConfigProvider` (process.env) at deploy time. The test populates
> 49 │     // `process.env[CONFIG_SECRET_ENV_KEY]` before deploying, so source
  50 │     // from that same key (not a hard-coded literal).
  51 │     const configSecret = yield* Config.Redacted(CONFIG_SECRET_ENV_KEY);

0.76 packages/alchemy/test/Git/fixtures/test-auth.ts:32:1
  29 │ export const TEST_SECRET_DEV = "test-secret-git-service-suite-dev";
  30 │ export const TEST_USER = { id: "e2e", name: "Suite" } as const;
  31 │ export const TEST_USER_DEV = { id: "dev", name: "Dev" } as const;
> 32 │ process.env.GIT_SERVICE_SECRET ??= TEST_SECRET;

0.76 packages/cloudflare-runtime/src/core/test/helpers/runtime.ts:32:3
  29 │ export const configProvider = (
  30 │   input: { fileSystemSupportsWatcher?: boolean } = {},
  31 │ ) =>
> 32 │   ConfigProvider.layer(
  33 │     Effect.gen(function* () {
  34 │       const fs = yield* FileSystem.FileSystem;
  35 │       return ConfigProvider.fromUnknown({
  36 │         CLOUDFLARE_RUNTIME_HOME: yield* fs.makeTempDirectoryScoped({
  37 │           prefix: "cloudflare-runtime-test",
  38 │         }),
  39 │         CLOUDFLARE_RUNTIME_FILE_SYSTEM_SUPPORTS_WATCHER:
  40 │           input.fileSystemSupportsWatcher,
  41 │       });
  42 │     }),
  43 │   );

0.75 packages/alchemy/test/AWS/SNS/platform-handler.ts:32:7
  28 │ export const PlatformFixtureLive = Layer.effect(
  29 │   PlatformFixture,
  30 │   Effect.gen(function* () {
  31 │     const application = yield* AWS.SNS.PlatformApplication("TestPushApp", {
> 32 │       platform: process.env.AWS_TEST_SNS_PLATFORM_NAME ?? "GCM",
  33 │       platformCredential: Redacted.make(
  34 │         process.env.AWS_TEST_SNS_PLATFORM_CREDENTIAL ?? "",
  35 │       ),
  36 │     });
  37 │     return { application };
  38 │   }),
  39 │ );

0.72 packages/alchemy/test/Cloudflare/Secret/fixtures/worker.ts:37:5
  36 │     // Secret from a `Config` — resolved against the active
> 37 │     // `ConfigProvider` (process.env) at deploy time.
  38 │     const configSecret = yield* Config.Redacted("CONFIG_SECRET");

0.71 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:16:1
  14 │ // Same env-gated vector-store prerequisites as KnowledgeBase.slow.test.ts —
  15 │ // this fixture only ever deploys from that (skipIf-gated) suite.
> 16 │ const roleArn = process.env.BEDROCK_KB_ROLE_ARN ?? "";
  17 │ const collectionArn = process.env.BEDROCK_KB_COLLECTION_ARN ?? "";
  18 │ const indexName = process.env.BEDROCK_KB_INDEX_NAME ?? "bedrock-index";
  19 │ const embeddingModelArn = process.env.BEDROCK_KB_EMBEDDING_MODEL_ARN ?? "";
```
