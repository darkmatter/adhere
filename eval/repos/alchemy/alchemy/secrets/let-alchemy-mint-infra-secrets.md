# alchemy/secrets/let-alchemy-mint-infra-secrets

A token the infrastructure owns, such as a webhook secret or bearer token, should be minted once with alchemy's Random or left for alchemy to provision, and should not be a hardcoded literal or regenerated on every deploy with crypto.randomUUID().

10 findings, from 0.85 down to 0.71. Each showed this hint:

```ts
export const WebhookSecret = Random("WebhookSecret");
const auth = yield* BetterAuth({ basePath: "/api/auth", emailAndPassword: { enabled: true } });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.85 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:50:9
  47 │   Effect.gen(function* () {
  48 │     const token = yield* Effect.sync(() =>
  49 │       Redacted.make(
> 50 │         Array.from(randomBytes(32), (byte) =>
  51 │           byte.toString(16).padStart(2, "0"),
  52 │         ).join(""),
  53 │       ),
  54 │     );

0.84 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:261:7
  258 │     type Deployment = Effect.Success<ReturnType<typeof deploy>>;
  259 │     let inventory: Deployment | undefined;
  260 │     const trackedDeploy = (options: Parameters<typeof deploy>[0]) =>
> 261 │       Effect.gen(function* () {

0.83 packages/better-auth/test/fixtures/drizzle-auth.config.ts:6:3
  3 │ import { drizzle } from "drizzle-orm/bun-sqlite";
  4 │
  5 │ export const auth = betterAuth({
> 6 │   secret: "test-secret-test-secret-test-secret",
  7 │   emailAndPassword: { enabled: true },
  8 │   database: drizzleAdapter(drizzle(":memory:"), { provider: "sqlite" }),
  9 │ });

0.80 packages/alchemy/test/Fly/fixtures/bluegreen-runtime-secrets/writer.ts:14:3
  11 │ export const Token = Fly.Secret("Token", {
  12 │   app: Site,
  13 │   name: "ACCEPTANCE_RUNTIME_SECRET",
> 14 │   value: Redacted.make("fixture-token-two"),
  15 │ });
  16 │
  17 │ export class Writer extends Fly.Service<Writer>()("Writer") {}

0.80 packages/cloudflare-runtime/src/core/globals/LoopbackServer.ts:47:5
  44 │   LoopbackServer,
  45 │   Effect.gen(function* () {
  46 │     const routes = MutableHashMap.empty<string, RawHandler>();
> 47 │     const secret = crypto.randomUUID();

0.77 packages/frontend-frameworks/fixtures/octane/e2e.config.ts:4:1
  1 │ import * as Options from "@alchemy.run/cloudflare-test-tools/e2e/Options";
  2 │ import * as Octane from "@alchemy.run/frontend-frameworks/octane";
  3 │
> 4 │ const SECRET = "s3cret-from-binding";

0.76 packages/alchemy/test/AWS/MQ/bindings-handler.ts:33:11
  25 │     const broker = yield* MQ.Broker("BindingsBroker", {
  26 │       engineType: "ACTIVEMQ",
  27 │       hostInstanceType: "mq.t3.micro",
  28 │       deploymentMode: "SINGLE_INSTANCE",
  29 │       publiclyAccessible: true,
  30 │       users: [
  31 │         {
  32 │           username: "alchemyadmin",
> 33 │           password: Redacted.make("SuperSecretPassw0rd!"),
  34 │         },
  35 │       ],
  36 │     });

0.75 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:22:1
> 22 │ const PASSWORD = "Alchemy-Trigger-Passw0rd!";

0.73 packages/alchemy/test/Git/fixtures/test-auth.ts:27:3
  26 │ export const TEST_SECRET: string =
> 27 │   process.env.GIT_SERVICE_SECRET ?? "test-secret-git-service-suite";
  28 │ /** A second credential, resolved to a second user (for the hook tests). */
  29 │ export const TEST_SECRET_DEV = "test-secret-git-service-suite-dev";
  30 │ export const TEST_USER = { id: "e2e", name: "Suite" } as const;

0.71 packages/cloudflare-runtime/src/core/globals/ProxyHeaders.shared.ts:2:1
  1 │ export const HEADER_ORIGINAL_URL = "Alchemy-Runtime-Original-URL";
> 2 │ export const HEADER_PROXY_SHARED_SECRET = "Alchemy-Runtime-Proxy-Shared-Secret";
  3 │ export const BINDING_PROXY_SHARED_SECRET = "PROXY_SHARED_SECRET";
```
