# alchemy/secrets/redacted-until-use

A secret should be read with Config.Redacted, passed to resources and env as Redacted, and unwrapped with Redacted.value only at the call that needs the raw string; it should not be read with Config.String or process.env, or unwrapped early into plain variables.

17 findings, from 0.92 down to 0.71. Each showed this hint:

```ts
const apiKey = yield* Config.Redacted("OPENAI_API_KEY");
return {
  fetch: Effect.gen(function* () {
    const request = HttpClientRequest.post(url).pipe(HttpClientRequest.bearerToken(Redacted.value(apiKey)));
    return yield* client.execute(request);
  }),
};
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.92 packages/alchemy/src/Cloudflare/Access.ts:77:7
  76 │     const getEnv = (name: string) =>
> 77 │       Config.String(name)
  78 │
  79 │         .pipe(Effect.catchTag("ConfigError", () => Effect.succeed(undefined)));

0.90 packages/alchemy/test/Neon/fixtures/StorageNative.ts:26:7
  16 │ export default {
  17 │   async fetch(request: Request) {
  18 │     if (
  19 │       request.headers.get("authorization") !== `Bearer ${process.env.APP_TOKEN}`
  20 │     )
  21 │       return new Response("Unauthorized", { status: 401 });
  22 │     const client = new AwsClient({
  23 │       region: process.env.AWS_REGION!,
  24 │       service: "s3",
  25 │       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
> 26 │       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  27 │     });
  28 │     const url = `${process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "")}/${encodeURIComponent(process.env.BUCKET_NAME!)}/native.txt`;
  29 │     if (new URL(request.url).pathname === "/presign") {
  30 │       const target = new URL(url);
  31 │       target.searchParams.set("X-Amz-Expires", "60");
  32 │       const signed = await client.sign(target, {
  33 │         method: "PUT",
  34 │         aws: { signQuery: true },
  35 │       });
  36 │       return Response.json({ url: signed.url });
  37 │     }
  38 │     if (request.method === "PUT")
  39 │       return client.fetch(url, {
  40 │         method: "PUT",
  41 │         body: await request.arrayBuffer(),
  42 │       });
  43 │     return client.fetch(url);
  44 │   },
  45 │ };

0.88 packages/alchemy/test/Git/fixtures/test-auth.ts:27:3
  26 │ export const TEST_SECRET: string =
> 27 │   process.env.GIT_SERVICE_SECRET ?? "test-secret-git-service-suite";
  28 │ /** A second credential, resolved to a second user (for the hook tests). */
  29 │ export const TEST_SECRET_DEV = "test-secret-git-service-suite-dev";
  30 │ export const TEST_USER = { id: "e2e", name: "Suite" } as const;

0.87 packages/alchemy/src/Railway/rpc-server.ts:80:5
  79 │     const forwarded = header(headers, "x-forwarded-host");
> 80 │     const expected = yield* Effect.sync(() => process.env[RPC_TOKEN_ENV] ?? "");
  81 │     const provided = header(headers, RPC_TOKEN_HEADER);

0.87 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:89:9
  88 │         const clientId = yield* getEnv("CLOUDFLARE_ACCESS_CLIENT_ID");
> 89 │         const clientSecret = yield* getEnv("CLOUDFLARE_ACCESS_CLIENT_SECRET");

0.85 packages/alchemy/src/Cli/commands/cloudflare.ts:229:9
  228 │       const email =
> 229 │         (yield* read(Config.String("CLOUDFLARE_EMAIL").pipe(Config.option))) ??
  230 │         (yield* prompt.prompt.text({
  231 │           message: "Cloudflare account email",
  232 │           validate: (value) =>
  233 │             value.trim().length === 0 ? "Required" : undefined,
  234 │         }));

0.85 packages/alchemy/src/Railway/BucketBinding.ts:103:5
   88 │ const scopeFromEnv = Effect.gen(function* () {
   89 │   const bucketName = yield* Config.String("BUCKET_NAME").pipe(
   90 │     Config.orElse(() => Config.String("AWS_S3_BUCKET_NAME")),
   91 │   );
   92 │   const accessKeyId = yield* Config.String("AWS_ACCESS_KEY_ID");
   93 │   const secretAccessKey = yield* Config.Redacted("AWS_SECRET_ACCESS_KEY");
   94 │   const endpoint = yield* Config.String("AWS_ENDPOINT_URL_S3").pipe(
   95 │     Config.orElse(() => Config.String("AWS_ENDPOINT_URL")),
   96 │   );
   97 │   const region = yield* Config.String("AWS_REGION").pipe(
   98 │     Config.withDefault("auto"),
   99 │   );
  100 │   return {
  101 │     bucketName,
  102 │     accessKeyId,
> 103 │     secretAccessKey: Redacted.value(secretAccessKey),
  104 │     endpoint,
  105 │     region: region as RegionName,
  106 │   } satisfies RailwayS3Scope;
  107 │ });

0.81 packages/alchemy/src/Railway/Bind.ts:28:3
  27 │ const fromProcessEnv = (key: string): string => {
> 28 │   const unpacked = unpackEnvValue<unknown>(process.env[key]);
  29 │   if (typeof unpacked === "string") return unpacked;
  30 │   return "";
  31 │ };

0.81 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:22:1
> 22 │ const PASSWORD = "Alchemy-Trigger-Passw0rd!";

0.79 packages/alchemy/test/AWS/Smoke/fixtures/api-handler.ts:22:1
> 22 │ const PASSWORD = "Alchemy-Smoke-Passw0rd!";

0.79 packages/alchemy/test/Neon/fixtures/backend-native.ts:8:7
   1 │ export default {
   2 │   fetch() {
   3 │     return Response.json({
   4 │       authUrl: process.env.NEON_AUTH_BASE_URL,
   5 │       jwksUrl: process.env.NEON_AUTH_JWKS_URL,
   6 │       dataUrl: process.env.NEON_DATA_API_URL,
   7 │       aiUrl: process.env.NEON_AI_GATEWAY_BASE_URL,
>  8 │       hasToken: Boolean(process.env.NEON_AI_GATEWAY_TOKEN),
   9 │       hasDeploymentKey: Boolean(process.env.NEON_API_KEY),
  10 │     });
  11 │   },
  12 │ };

0.78 packages/alchemy/src/Railway/ConnectMongoHttp.ts:35:3
  34 │ const fromProcessEnv = (key: string): string => {
> 35 │   const unpacked = unpackEnvValue<unknown>(process.env[key]);
  36 │   if (typeof unpacked === "string") return unpacked;
  37 │   if (Redacted.isRedacted(unpacked)) {
  38 │     const inner = Redacted.value(unpacked);
  39 │     return typeof inner === "string" ? inner : "";
  40 │   }
  41 │   return "";
  42 │ };

0.78 packages/alchemy/src/Railway/ConnectPostgresHttp.ts:33:3
  32 │ const fromProcessEnv = (key: string): string => {
> 33 │   const unpacked = unpackEnvValue<unknown>(process.env[key]);
  34 │   if (typeof unpacked === "string") return unpacked;
  35 │   if (Redacted.isRedacted(unpacked)) {
  36 │     const inner = Redacted.value(unpacked);
  37 │     return typeof inner === "string" ? inner : "";
  38 │   }
  39 │   return "";
  40 │ };

0.76 packages/alchemy/src/Railway/ConnectMySQLHttp.ts:35:3
  34 │ const fromProcessEnv = (key: string): string => {
> 35 │   const unpacked = unpackEnvValue<unknown>(process.env[key]);
  36 │   if (typeof unpacked === "string") return unpacked;
  37 │   if (Redacted.isRedacted(unpacked)) {
  38 │     const inner = Redacted.value(unpacked);
  39 │     return typeof inner === "string" ? inner : "";
  40 │   }
  41 │   return "";
  42 │ };

0.72 packages/alchemy/test/AWS/Cognito/handler.ts:43:7
  37 │     const pool = yield* Cognito.UserPool("BindingsUserPool", {
  38 │       passwordPolicy: {
  39 │         minimumLength: 12,
  40 │         requireSymbols: false,
  41 │       },
  42 │       accountRecovery: [{ name: "admin_only", priority: 1 }],
> 43 │       tags: { Purpose: "cognito-bindings-fixture" },
  44 │     });

0.71 packages/alchemy/scripts/cleanup-neon-projects.ts:29:1
  26 │ const DRY_RUN = process.env.DRY_RUN === "1";
  27 │ const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 4));
  28 │
> 29 │ if (!process.env.NEON_API_KEY) {
  30 │   console.error("NEON_API_KEY is not set");
  31 │   process.exit(1);
  32 │ }

0.71 packages/alchemy/test/AWS/SNS/platform-handler.ts:34:9
  28 │ export const PlatformFixtureLive = Layer.effect(
  29 │   PlatformFixture,
  30 │   Effect.gen(function* () {
  31 │     const application = yield* AWS.SNS.PlatformApplication("TestPushApp", {
  32 │       platform: process.env.AWS_TEST_SNS_PLATFORM_NAME ?? "GCM",
  33 │       platformCredential: Redacted.make(
> 34 │         process.env.AWS_TEST_SNS_PLATFORM_CREDENTIAL ?? "",
  35 │       ),
  36 │     });
  37 │     return { application };
  38 │   }),
  39 │ );
```
