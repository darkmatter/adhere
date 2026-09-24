# data/brand-meaningful-primitives

A primitive with semantic meaning, such as an id, email, URL, port, or count, must be a branded schema, never a bare string or number.

1,104 findings, from 0.96 down to 0.71. Each showed this hint:

```ts
export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const Email = Schema.String.pipe(Schema.brand("Email"));
export type Email = typeof Email.Type;

export const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
export type Port = typeof Port.Type;
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

````text
0.96 packages/alchemy/test/Prisma/ORM/fixtures/psl/generated/schemas.ts:12:7
   4 │ export const schemas = {
   5 │   public: {
   6 │     Post: Schema.Struct({
   7 │       authorId: Schema.Int,
   8 │       id: Schema.Int,
   9 │       title: Schema.String,
  10 │     }),
  11 │     User: Schema.Struct({
> 12 │       email: Schema.String,
  13 │       id: Schema.Int,
  14 │       name: Schema.NullOr(Schema.String),
  15 │     }),
  16 │   },
  17 │ } as const;

0.94 packages/alchemy/src/AWS/Arn.ts:1:1
> 1 │ export type Arn = string;

0.94 packages/alchemy/src/AWS/Organizations/Account.ts:393:5
  372 │   Effect.gen(function* () {
  373 │     const status = yield* retryOrganizations(
  374 │       organizations
  375 │         .describeCreateAccountStatus({
  376 │           CreateAccountRequestId: requestId,
  377 │         })
  378 │         .pipe(Effect.map((response) => response.CreateAccountStatus)),
  379 │     );
  380 │
  381 │     if (!status?.State || status.State === "IN_PROGRESS") {
  382 │       return yield* Effect.fail({ _tag: "CreateAccountInProgress" as const });
  383 │     }
  384 │
  385 │     if (status.State === "FAILED") {
  386 │       return yield* Effect.fail(
  387 │         new Error(
  388 │           `account creation failed: ${status.FailureReason ?? "unknown failure"}`,
  389 │         ),
  390 │       );
  391 │     }
  392 │
> 393 │     if (!status.AccountId) {
  394 │       return yield* Effect.fail(
  395 │         new Error("account creation succeeded without AccountId"),
  396 │       );
  397 │     }
  398 │
  399 │     return status;
  400 │   }).pipe(

0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/api.ts:7:3
   4 │ import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
   5 │
   6 │ export class Task extends Schema.Class<Task>("Task")({
>  7 │   id: Schema.String,
   8 │   title: Schema.String,
   9 │   completed: Schema.Boolean,
  10 │ }) {}

0.94 packages/alchemy/test/Hetzner/fixtures/shared.ts:6:1
  3 │ export const VOLUME_PATH = "/data";
  4 │ export const MARKER_FILE = `${VOLUME_PATH}/hello.txt`;
  5 │ export const MARKER = "hello-from-worker";
> 6 │ export const API_PORT = 3000;

0.93 packages/alchemy/src/Git/Protocol/ObjectCodec.ts:645:1
> 645 │ export const treeEntryKind = (mode: string): TreeEntryKind =>
  646 │   mode === TREE_MODE ? "tree" : mode === GITLINK_MODE ? "commit" : "blob";

0.93 packages/alchemy/test/Fly/fixtures/shared.ts:6:1
  3 │ export const VOLUME_PATH = "/data";
  4 │ export const MARKER_FILE = `${VOLUME_PATH}/hello.txt`;
  5 │ export const MARKER = "hello-from-fly-service";
> 6 │ export const API_PORT = 3000;

0.93 packages/cloudflare-runtime/src/core/bindings/hyperdrive/HyperdriveOrigin.shared.ts:7:3
   4 │ export interface HyperdriveOrigin {
   5 │   scheme: string;
   6 │   host: string;
>  7 │   port: number;
   8 │   user: string;
   9 │   password: string;
  10 │   database: string;
  11 │   sslmode?: string;
  12 │ }

0.92 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:7:3
   5 │ const ScheduleEnvelope = Schema.Struct({
   6 │   version: Schema.Literal(1),
>  7 │   invocation_id: Schema.String,
   8 │   trigger: Schema.Struct({
   9 │     type: Schema.Literal("schedule"),
  10 │     id: Schema.String,
  11 │     name: Schema.String,
  12 │   }),
  13 │   data: Schema.Struct({ scheduled_at: Schema.String }),
  14 │ });

0.92 packages/alchemy/src/Planetscale/Postgres/PostgresOrigin.ts:11:3
   8 │ export type PostgresOrigin = {
   9 │   scheme: "postgres" | "postgresql";
  10 │   host: string;
> 11 │   port: number;
  12 │   database: string;
  13 │   user: string;
  14 │   password: Redacted.Redacted<string>;
  15 │ };

0.92 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:26:7
  21 │ export const SubscriptionEvent = Schema.fromJsonString(
  22 │   Schema.Struct({
  23 │     type: Schema.String,
  24 │     source: Schema.Struct({ type: Schema.String }),
  25 │     metadata: Schema.Struct({
> 26 │       accountId: Schema.String,
  27 │       eventSubscriptionId: Schema.String,
  28 │       eventTimestamp: Schema.String,
  29 │     }),
  30 │     payload: Schema.Struct({
  31 │       id: Schema.optional(Schema.String),
  32 │       name: Schema.optional(Schema.String),
  33 │     }),
  34 │   }),
  35 │ );

0.91 packages/alchemy/src/AWS/Organizations/Organization.ts:8:1
  5 │ import type { Providers } from "../Providers.ts";
  6 │ import { retryOrganizations, unredact } from "./common.ts";
  7 │
> 8 │ export type OrganizationId = string;
  9 │ export type OrganizationArn = string;

0.91 packages/alchemy/src/Cloudflare/Auth/AuthConfig.ts:13:5
   8 │ export const CloudflareAuthConfigSchema = Schema.Union([
   9 │   Schema.Struct({
  10 │     method: Schema.Literal("stored"),
  11 │     credentialType: Schema.Literal("apiToken"),
  12 │     apiToken: Schema.String,
> 13 │     accountId: Schema.String,
  14 │   }),
  15 │   Schema.Struct({
  16 │     method: Schema.Literal("stored"),
  17 │     credentialType: Schema.Literal("apiKey"),
  18 │     apiKey: Schema.String,
  19 │     email: Schema.String,
  20 │     accountId: Schema.String,
  21 │   }),
  22 │   Schema.Struct({
  23 │     method: Schema.Literal("oauth"),
  24 │     scopes: Schema.mutable(Schema.Array(Schema.String)),
  25 │     accountId: Schema.String,
  26 │     clientId: Schema.optional(Schema.String),
  27 │     access: Schema.String,
  28 │     refresh: Schema.String,
  29 │     expires: Schema.Number,
  30 │   }),
  31 │   // Released v0 OAuth grants cannot be reused, but retaining the method lets
  32 │   // `profile refresh` restart OAuth at scope selection.
  33 │   Schema.Struct({
  34 │     method: Schema.Literal("oauth"),
  35 │   }),
  36 │ ]);

0.91 packages/alchemy/src/Cloudflare/D1/CloneDatabase.ts:8:3
   5 │ import { importD1Database } from "./ImportDatabase.ts";
   6 │
   7 │ export interface CloneDatabaseOptions {
>  8 │   accountId: string;
   9 │   sourceDatabaseId: string;
  10 │   targetDatabaseId: string;
  11 │ }

0.91 packages/alchemy/src/Cloudflare/StateStore/CredentialsFile.ts:34:3
  29 │ export const StoredStateStoreCredentials = Schema.Struct({
  30 │   url: Schema.String,
  31 │   /** Bearer token used to authenticate every request. */
  32 │   authToken: Schema.String,
  33 │   /** Cloudflare account ID the `url`/`authToken` were minted against. */
> 34 │   accountId: Schema.optional(Schema.String),
  35 │ });
  36 │ export type StoredStateStoreCredentials =
  37 │   typeof StoredStateStoreCredentials.Type;

0.91 packages/alchemy/src/Planetscale/MySQL/MySQLOrigin.ts:11:3
   8 │ export type MySQLOrigin = {
   9 │   scheme: "mysql";
  10 │   host: string;
> 11 │   port: number;
  12 │   database: string;
  13 │   user: string;
  14 │   password: Redacted.Redacted<string>;
  15 │ };

0.91 packages/alchemy/src/Planetscale/OAuthClient.ts:30:1
> 30 │ export const OAUTH_CLIENT_ID = "pscale_app_aa12e3938baebb788aac443f66e422da";
  31 │ export const OAUTH_CLIENT_SECRET = Redacted.make(
  32 │   "pscale_app_secret_yyZ3Q8oe99GP9_yA5wrA5er6RuN6Lz9dC66Bj1OJzpg",
  33 │ );

0.91 packages/alchemy/src/Prisma/Types.ts:122:3
  120 │ export interface EndpointDetail {
  121 │   host: string;
> 122 │   port: number;
  123 │ }

0.91 packages/alchemy/test/Cloudflare/AI/fixtures/ChatRpcs.ts:38:5
  35 │ // thread id, so every payload carries the id.
  36 │ export class ChatRpcs extends RpcGroup.make(
  37 │   Rpc.make("send", {
> 38 │     payload: { id: Schema.String, prompt: Schema.String },
  39 │     success: SendResult,
  40 │   }),
  41 │   Rpc.make("streamMessage", {
  42 │     payload: { id: Schema.String, prompt: Schema.String },
  43 │     success: RpcSchema.Stream(ChatStreamPart, Schema.Never),
  44 │   }),
  45 │ ) {}

0.91 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:11:1
> 11 │ export const HOST_PROBE_PORT = 42117;

0.91 packages/alchemy/test/Fly/fixtures/app/shared.ts:7:1
  4 │ export const VOLUME_PATH = "/data";
  5 │ export const MARKER_FILE = `${VOLUME_PATH}/hello.txt`;
  6 │ export const MARKER = "hello-from-fly-worker";
> 7 │ export const API_PORT = 3000;
  8 │ export const SECRET_NAME = "FLY_FIXTURE_MARKER";

0.91 packages/alchemy/test/Fly/fixtures/postgres-api.ts:8:1
  5 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
  6 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  7 │
> 8 │ export const POSTGRES_PORT = 3000;

0.91 packages/alchemy/test/Fly/fixtures/redis-api.ts:7:1
  4 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
  5 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  6 │
> 7 │ export const REDIS_PORT = 3000;
  8 │ export const REDIS_KEY = "alchemy-marker";
  9 │ export const REDIS_VALUE = "hello-from-redis";

0.91 packages/alchemy/test/Hetzner/fixtures/app/shared.ts:7:1
  4 │ export const VOLUME_PATH = "/var/lib/api";
  5 │ export const MARKER_FILE = `${VOLUME_PATH}/hello.txt`;
  6 │ export const MARKER = "hello-from-worker";
> 7 │ export const API_PORT = 3000;

0.91 packages/alchemy/test/Railway/fixtures/redis-api.ts:10:1
   8 │ export { Cache, REDIS_KEY, REDIS_VALUE, Site };
   9 │
> 10 │ export const REDIS_PORT = 3000;

0.91 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitProps.shared.ts:5:3
   3 │ export const RateLimitProps = Schema.Struct({
   4 │   binding: Schema.String,
>  5 │   namespaceId: Schema.String,
   6 │   simple: Schema.Struct({
   7 │     limit: Schema.Number.check(Schema.isGreaterThan(0)),
   8 │     period: Schema.Number.check(Schema.isGreaterThan(0)),
   9 │   }),
  10 │ });

0.91 packages/cloudflare-runtime/src/core/test/helpers/port.ts:5:1
   2 │ import * as NodeNet from "node:net";
   3 │ import * as Port from "../../internal/Port.ts";
   4 │
>  5 │ export const occupy = (port: number, host?: string) =>
   6 │   Effect.acquireRelease(
   7 │     Effect.callback<NodeNet.Server>((resume) => {
   8 │       const server = NodeNet.createServer();
   9 │       server.once("error", (err) => resume(Effect.die(err)));
  10 │       server.listen({ port, host, exclusive: true }, () =>
  11 │         resume(Effect.succeed(server)),
  12 │       );
  13 │     }),
  14 │     (server) =>
  15 │       Effect.callback<void>((resume) => {
  16 │         server.close(() => resume(Effect.void));
  17 │       }),
  18 │   ).pipe(Effect.map((server) => server.address() as NodeNet.AddressInfo));

0.90 packages/alchemy/src/AWS/CloudFront/ManagedPolicies.ts:6:3
  5 │ export const MANAGED_CACHING_DISABLED_POLICY_ID =
> 6 │   "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" as const;

0.90 packages/alchemy/src/AWS/Environment.ts:28:1
  25 │ export const AWS_SECRET_ACCESS_KEY = Config.Redacted("AWS_SECRET_ACCESS_KEY");
  26 │ export const AWS_SESSION_TOKEN = Config.Redacted("AWS_SESSION_TOKEN");
  27 │
> 28 │ export type AccountID = string;
  29 │ export type RegionID = string;

0.90 packages/alchemy/src/Neon/PostgresOrigin.ts:18:3
  15 │ export type PostgresOrigin = {
  16 │   scheme: "postgres" | "postgresql" | "mysql";
  17 │   host: string;
> 18 │   port: number;
  19 │   database: string;
  20 │   user: string;
  21 │   password: Redacted.Redacted<string>;
  22 │ };

0.90 packages/alchemy/test/Cloudflare/Container/fixtures/reload/container.ts:17:1
  16 │ /** Must match the port baked into the Dockerfile the test writes. */
> 17 │ export const RELOAD_CONTAINER_PORT = 17362;

0.90 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/types.ts:2:3
  1 │ export interface LegacyRow extends Record<string, string | number | null> {
> 2 │   id: string;
  3 │   run_at: number;
  4 │   repeat_ms: number | null;
  5 │   payload: string;
  6 │ }

0.90 packages/alchemy/test/Fly/fixtures/bindings-shared.ts:4:1
  1 │ import * as Fly from "@/Fly";
  2 │ import * as Redacted from "effect/Redacted";
  3 │
> 4 │ export const API_PORT = 3000;
  5 │ export const SECRET_NAME = "FLY_BINDINGS_MARKER";
  6 │ export const MARKER = "hello-from-fly-bindings";
  7 │ export const PLAINTEXT = "alchemy-kms-roundtrip";

0.90 packages/alchemy/test/Railway/fixtures/mongo-api.ts:8:1
   5 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
   6 │ import { Partition, Site } from "./suite-env.ts";
   7 │
>  8 │ export const MONGO_HTTP_PORT = 3000;
   9 │
  10 │ export { Site };

0.90 packages/alchemy/test/Railway/fixtures/postgres-api.ts:11:1
   9 │ export { Db, Site };
  10 │
> 11 │ export const POSTGRES_PORT = 3000;

0.90 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/types.ts:17:3
  16 │ export interface ReadyAnalyticsEvent {
> 17 │   accountId?: number;
  18 │   indexId?: string;
  19 │   version?: number;
  20 │   doubles?: Array<number | undefined>;
  21 │   blobs?: Array<string | undefined>;
  22 │ }

0.90 packages/frontend-frameworks/fixtures/sveltekit-spa/src/lib/widgets.ts:7:3
  6 │ export interface Widget {
> 7 │   readonly id: string;
  8 │   readonly name: string;
  9 │ }

0.89 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:25:3
  24 │ export interface Account {
> 25 │   readonly id: string;
  26 │   readonly name: string;
  27 │ }

0.89 packages/alchemy/src/Cloudflare/Auth/OAuthClient.ts:9:1
>  9 │ export const OAUTH_CLIENT_ID = "e7e25ec474419def6ba38d2d2638b122";
  10 │ export const OAUTH_REDIRECT_URI = "https://alchemy.run/auth/callback";
  11 │ export const OAUTH_LOCAL_CALLBACK_URI = "http://localhost:9976/auth/callback";

0.89 packages/alchemy/src/Cloudflare/VpcService/VpcService.ts:248:19
  226 │         const result = yield* connectivity
  227 │           .createDirectoryService({
  228 │             accountId: acct,
  229 │             name,
  230 │             type: news.serviceType ?? "http",
  231 │             httpPort: news.httpPort,
  232 │             httpsPort: news.httpsPort,
  233 │             host: news.host,
  234 │           })
  235 │           .pipe(
  236 │             Effect.catch((err: unknown) =>
  237 │               Effect.gen(function* () {
  238 │                 if (!news.adopt) return yield* Effect.fail(err as never);
  239 │                 const existing = yield* findServiceByName(name);
  240 │                 if (!existing || !existing.serviceId) {
  241 │                   return yield* Effect.fail(err as never);
  242 │                 }
  243 │                 return yield* connectivity.updateDirectoryService({
  244 │                   accountId: acct,
  245 │                   serviceId: existing.serviceId,
  246 │                   name,
  247 │                   type: news.serviceType ?? "http",
> 248 │                   httpPort: news.httpPort,
  249 │                   httpsPort: news.httpsPort,
  250 │                   host: news.host,
  251 │                 });
  252 │               }),
  253 │             ),
  254 │           );

0.89 packages/alchemy/src/Cloudflare/Zone/lookup.ts:14:1
> 14 │ export type Reference = string | { zoneId: string; name?: string };
  15 │
  16 │ export const isId = (zone: string): boolean => /^[a-f0-9]{32}$/i.test(zone);

0.89 packages/alchemy/src/Namespace.ts:6:3
  3 │ import * as Option from "effect/Option";
  4 │
  5 │ export interface NamespaceNode {
> 6 │   Id: string;
  7 │   Parent?: NamespaceNode;
  8 │ }

0.89 packages/alchemy/src/Prisma/PostgresOrigin.ts:18:3
  15 │ export type PostgresOrigin = {
  16 │   scheme: "postgres" | "postgresql";
  17 │   host: string;
> 18 │   port: number;
  19 │   database: string;
  20 │   user: string;
  21 │   password: Redacted.Redacted<string>;
  22 │ };

0.89 packages/alchemy/test/Docker/fixtures/isolated-project-service.ts:19:1
> 19 │ export const SERVICE_EXTERNAL_PORT = 43119;

0.89 packages/alchemy/test/Docker/fixtures/service.ts:14:1
> 14 │ export const SERVICE_EXTERNAL_PORT = 43117;

0.89 packages/alchemy/test/Fly/fixtures/process-death.ts:33:3
  30 │   version: Schema.Literal(1),
  31 │   signal: Schema.Literal("SIGKILL"),
  32 │   phase: Schema.Literals(phases),
> 33 │   pid: Schema.Number,
  34 │   cwd: Schema.String,
  35 │   stack: Schema.String,
  36 │   stage: Schema.String,

0.89 packages/alchemy/test/Fly/fixtures/state-persistence.ts:14:3
  11 │ /** Only nonsecret row identity and lifecycle fields leave the filesystem barrier. */
  12 │ export const ResourceRow = Schema.Struct({
  13 │   resourceType: Schema.String,
> 14 │   fqn: Schema.String,
  15 │   instanceId: Schema.String,
  16 │   status: Schema.String,
  17 │   attr: Schema.optional(
  18 │     Schema.Struct({
  19 │       appName: Schema.String,
  20 │       machineId: Schema.String,
  21 │       machineIds: Schema.Array(Schema.String),
  22 │       rolloutPending: Schema.optional(Schema.Boolean),
  23 │     }),
  24 │   ),
  25 │ });

0.89 packages/alchemy/test/Railway/fixtures/bucket-api.ts:10:1
   8 │ export { Site };
   9 │
> 10 │ export const BUCKET_PORT = 3000;
  11 │ export const OBJECT_KEY = "alchemy-marker.txt";
  12 │ export const OBJECT_BODY = "hello-from-railway";

0.88 packages/alchemy/src/Cloudflare/CloudforceOne/ScanConfig.ts:38:3
  34 │ export type ScanConfigAttributes = {
  35 │   /**
  36 │    * Server-assigned scan config identifier (UUID).
  37 │    */
> 38 │   configId: string;
  39 │   /**
  40 │    * The Cloudflare account the scan config belongs to.
  41 │    */
  42 │   accountId: string;
  43 │   /**
  44 │    * IP addresses or CIDR blocks being scanned.
  45 │    */
  46 │   ips: string[];
  47 │   /**
  48 │    * Number of days between each scan (`0` = one-off scan).
  49 │    */
  50 │   frequency: number;
  51 │   /**
  52 │    * Ports being scanned.
  53 │    */
  54 │   ports: string[];
  55 │ };

0.88 packages/alchemy/src/Cloudflare/Email/Address.ts:20:3
  11 │ export type AddressProps = {
  12 │   /**
  13 │    * The email address to register as a verified destination on the
  14 │    * account. Cloudflare sends a verification email to this address; the
  15 │    * recipient must click the link before the address can receive routed
  16 │    * mail or be used as a verified sender.
  17 │    *
  18 │    * Changing this property triggers a replacement.
  19 │    */
> 20 │   email: string;
  21 │ };

0.88 packages/alchemy/src/Cloudflare/Hyperdrive/Connection.ts:121:5
  115 │ export type Connection = Resource<
  116 │   "Cloudflare.Hyperdrive",
  117 │   Props,
  118 │   {
  119 │     hyperdriveId: string;
  120 │     name: string;
> 121 │     accountId: string;
  122 │     origin: Origin;
  123 │     mtls: Mtls;
  124 │     dev: DevOrigin | undefined;
  125 │   },
  126 │   never,
  127 │   Providers
  128 │ >;

0.88 packages/alchemy/src/Cloudflare/KeylessCertificate/KeylessCertificate.ts:121:3
  111 │ export interface Attributes {
  112 │   /** Cloudflare-assigned identifier of the Keyless SSL configuration. */
  113 │   keylessCertificateId: string;
  114 │   /** Zone the Keyless SSL configuration belongs to. */
  115 │   zoneId: string;
  116 │   /** Human readable name of the Keyless SSL configuration. */
  117 │   name: string;
  118 │   /** Hostname of the key server holding the private key. */
  119 │   host: string;
  120 │   /** Port Cloudflare uses to communicate with the key server. */
> 121 │   port: number;
  122 │   /** Whether the Keyless SSL configuration is on or off. */
  123 │   enabled: boolean;
  124 │   /** Current lifecycle status of the Keyless SSL configuration. */
  125 │   status: Status;
  126 │   /** Permissions the requesting token has on this Keyless SSL. */
  127 │   permissions: string[];
  128 │   /** ISO8601 timestamp the Keyless SSL configuration was created. */
  129 │   createdOn: string;
  130 │   /** ISO8601 timestamp the Keyless SSL configuration was last modified. */
  131 │   modifiedOn: string;
  132 │   /** Tunnel configuration, when the key server is reached through a Cloudflare Tunnel. */
  133 │   tunnel: { privateIp: string; vnetId: string } | undefined;
  134 │ }

0.88 packages/alchemy/src/Git/RegistryObject.ts:83:3
   80 │ export interface RegistryEntry {
   81 │   readonly owner: string;
   82 │   readonly name: string;
>  83 │   readonly repoId: string;
   84 │   readonly description: string | null;
   85 │   /** Parent repoId when this repo is a fork, else `null`. */
   86 │   readonly forkOf: string | null;
   87 │   /** Live forks referencing this repo's R2 prefix. */
   88 │   readonly forkCount: number;
   89 │   /** Epoch milliseconds. */
   90 │   readonly createdAt: number;
   91 │   /** Anyone can read/clone without a token (GitHub public-repo model). */
   92 │   readonly public: boolean;
   93 │   /** Soft-delete marker set while the purge alarm runs, else `null`. */
   94 │   readonly deletedAt: number | null;
   95 │   /**
   96 │    * Denormalised display fields, pushed by the Repo DO on change so
   97 │    * `repos.list` renders a page without waking one DO per row
   98 │    * (DESIGN.md §15 bottleneck 7). The DO stays the source of truth.
   99 │    */
  100 │   readonly defaultBranch: string;
  101 │   readonly readOnly: boolean;
  102 │   readonly status: string;
  103 │ }

0.88 packages/alchemy/src/Prisma/Refs.ts:24:1
  21 │ export const isPrismaDevId = (value: unknown): value is string =>
  22 │   typeof value === "string" && value.startsWith("dev:");
  23 │
> 24 │ export const concreteIdOf = (value: unknown): string | undefined =>
  25 │   typeof value === "string" && !isPrismaDevId(value) ? value : undefined;

0.88 packages/alchemy/src/Railway/TcpProxy.ts:261:3
  258 │ const findByPort = (
  259 │   environmentId: string,
  260 │   serviceId: string,
> 261 │   applicationPort: number,
  262 │ ) =>
  263 │   listProxies(environmentId, serviceId).pipe(
  264 │     Effect.map((items) =>
  265 │       items.find((proxy) => proxy.applicationPort === applicationPort),
  266 │     ),
  267 │   );

0.88 packages/alchemy/src/Redis/Protocol.ts:24:3
  22 │ export interface RedisUrl {
  23 │   readonly hostname: string;
> 24 │   readonly port: number;
  25 │   readonly tls: boolean;
  26 │   readonly username: string;
  27 │   readonly password: string;
  28 │   readonly db: number | undefined;
  29 │ }

0.88 packages/alchemy/test/AWS/Website/fixtures/foldkit-app/src/main.ts:12:1
  10 │ // MODEL
  11 │
> 12 │ export const Model = S.Struct({ count: S.Number });
  13 │ export type Model = typeof Model.Type;

0.88 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:2:3
  1 │ export interface Widget {
> 2 │   readonly id: string;
  3 │   readonly name: string;
  4 │ }

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/group.ts:22:5
  20 │ export class CounterRpcs extends RpcGroup.make(
  21 │   Rpc.make("incrementD1", {
> 22 │     payload: { key: Schema.String },
  23 │     success: Schema.Struct({ value: Schema.Number }),
  24 │   }),
  25 │   Rpc.make("getD1", {
  26 │     payload: { key: Schema.String },
  27 │     success: Schema.Struct({ value: Schema.Number }),
  28 │   }),
  29 │   Rpc.make("incrementDO", {
  30 │     payload: { key: Schema.String },
  31 │     success: Schema.Struct({ value: Schema.Number }),
  32 │   }),
  33 │   Rpc.make("getDO", {
  34 │     payload: { key: Schema.String },
  35 │     success: Schema.Struct({ value: Schema.Number }),
  36 │   }),
  37 │   Rpc.make("reset", {
  38 │     payload: { key: Schema.String },
  39 │     success: Schema.Void,
  40 │   }),
  41 │ ) {}

0.88 packages/alchemy/test/Fly/fixtures/bucket-api.ts:7:1
  4 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
  5 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  6 │
> 7 │ export const BUCKET_PORT = 3000;
  8 │ export const OBJECT_KEY = "alchemy-marker.txt";
  9 │ export const OBJECT_BODY = "hello-from-tigris";

0.88 packages/alchemy/test/Fly/fixtures/certificates-api.ts:8:1
   5 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
   6 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
   7 │
>  8 │ export const CERT_API_PORT = 3000;
   9 │
  10 │ export const CertSite = Fly.App("CertSite", { enableSubdomains: true });

0.88 packages/alchemy/test/Fly/fixtures/protocol-branches.ts:32:3
  30 │ const config: machines.FlyMachineConfig = {
  31 │   image: "registry.test/fixture:latest",
> 32 │   checks: { ready: { type: "http", port: 80, path: "/" } },
  33 │   stop_config: { signal: "SIGTERM", timeout: "1s" },
  34 │ };

0.88 packages/alchemy/test/Fly/fixtures/signal-overlap.ts:110:5
  109 │   expect(focused).toEqual([
> 110 │     signalOverlapFile,
  111 │     "-t",
  112 │     " > process signals and overlap > ",
  113 │     "--profile",
  114 │     "testing",
  115 │     "--retry",
  116 │     "0",
  117 │     "--concurrency",
  118 │     "1",
  119 │     "--sequential",
  120 │     "--timeout",
  121 │     "750000",
  122 │   ]);

0.88 packages/alchemy/test/SQL/fixtures/routes.ts:32:3
  31 │ export type UserRow = {
> 32 │   id: number;
  33 │   name: string;
  34 │   email: string;
  35 │ };

0.87 packages/alchemy/src/AWS/Connection/internal.ts:11:3
   9 │ export interface SqlConnectionInfo {
  10 │   /** Endpoint hostname. */
> 11 │   host: string;
  12 │   /** Endpoint port. */
  13 │   port: number;
  14 │   /** Database name, when one was requested. */
  15 │   database?: string;
  16 │   /** Login user, when the credential strategy resolves one. */
  17 │   username?: string;
  18 │   /**
  19 │    * Login password (or short-lived IAM auth token), when the credential
  20 │    * strategy resolves one.
  21 │    */
  22 │   password?: Redacted.Redacted<string>;
  23 │   /** Whether the connection requires TLS. */
  24 │   ssl: boolean;
  25 │   /**
  26 │    * RFC-3986 connection URL — feeds `Drizzle.Postgres` / Hyperdrive
  27 │    * origin directly.
  28 │    */
  29 │   url: Redacted.Redacted<string>;
  30 │ }

0.87 packages/alchemy/src/AWS/ELBv2/Listener.ts:231:9
  225 │ const desiredMutualAuth = (
  226 │   props: ListenerProps,
  227 │ ): elbv2.MutualAuthenticationAttributes | undefined =>
  228 │   props.mutualAuthentication
  229 │     ? {
  230 │         Mode: props.mutualAuthentication.mode,
> 231 │         TrustStoreArn: props.mutualAuthentication.trustStoreArn,
  232 │         IgnoreClientCertificateExpiry:
  233 │           props.mutualAuthentication.ignoreClientCertificateExpiry,
  234 │         AdvertiseTrustStoreCaNames:
  235 │           props.mutualAuthentication.advertiseTrustStoreCaNames,
  236 │       }
  237 │     : undefined;

0.87 packages/alchemy/src/AWS/ELBv2/TargetGroup.ts:331:13
  324 │           const observedHc = {
  325 │             HealthCheckPath: targetGroup.HealthCheckPath,
  326 │             HealthCheckPort: targetGroup.HealthCheckPort,
  327 │             HealthCheckProtocol: targetGroup.HealthCheckProtocol,
  328 │             HealthCheckEnabled: targetGroup.HealthCheckEnabled,
  329 │             HealthCheckIntervalSeconds: targetGroup.HealthCheckIntervalSeconds,
  330 │             HealthCheckTimeoutSeconds: targetGroup.HealthCheckTimeoutSeconds,
> 331 │             HealthyThresholdCount: targetGroup.HealthyThresholdCount,
  332 │             UnhealthyThresholdCount: targetGroup.UnhealthyThresholdCount,
  333 │             Matcher: targetGroup.Matcher,
  334 │           };

0.87 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:481:11
  478 │       const detail = yield* ecr
  479 │         .describeImages({
  480 │           registryId: parsed.registryId,
> 481 │           repositoryName: parsed.repositoryName,
  482 │           imageIds: [parsed.imageId],
  483 │         })
  484 │         .pipe(
  485 │           Effect.catchTag(
  486 │             ["ImageNotFoundException", "RepositoryNotFoundException"],
  487 │             () =>
  488 │               Effect.fail(
  489 │                 new Error(
  490 │                   `Function(${id}): ECR image '${source.uri}' does not exist or is not accessible`,
  491 │                 ),
  492 │               ),
  493 │           ),
  494 │           Effect.map((response) => response.imageDetails?.[0]),
  495 │         );

0.87 packages/alchemy/src/Cloudflare/Account/Member.ts:49:3
> 49 │   email: string;

0.87 packages/alchemy/src/Cloudflare/CustomHostname/CustomHostname.ts:177:3
  167 │ export interface ValidationRecord {
  168 │   /** CNAME validation record name. */
  169 │   cname: string | undefined;
  170 │   /** CNAME validation record target. */
  171 │   cnameTarget: string | undefined;
  172 │   /** Email addresses validation mail is sent to. */
  173 │   emails: string[] | undefined;
  174 │   /** HTTP validation token body. */
  175 │   httpBody: string | undefined;
  176 │   /** HTTP validation token URL. */
> 177 │   httpUrl: string | undefined;
  178 │   /** Validation record status. */
  179 │   status: string | undefined;
  180 │   /** TXT validation record name. */
  181 │   txtName: string | undefined;
  182 │   /** TXT validation record value. */
  183 │   txtValue: string | undefined;
  184 │ }

0.87 packages/alchemy/src/Cloudflare/MagicTransit/SiteAcl.ts:83:3
  77 │ export interface MagicSiteAclAttributes {
  78 │   /** Cloudflare-assigned identifier of the ACL. */
  79 │   aclId: string;
  80 │   /** The site the ACL belongs to. */
  81 │   siteId: string;
  82 │   /** The Cloudflare account the ACL belongs to. */
> 83 │   accountId: string;
  84 │   /** The name of the ACL. */
  85 │   name: string;
  86 │   /** The ACL description, if set. */
  87 │   description: string | undefined;
  88 │   /** Whether traffic is forwarded locally on the connector. */
  89 │   forwardLocally: boolean | undefined;
  90 │   /** Protocols the ACL matches, if narrowed. */
  91 │   protocols: MagicSiteAclProtocol[] | undefined;
  92 │   /** Whether the ACL is unidirectional. */
  93 │   unidirectional: boolean | undefined;
  94 │ }

0.87 packages/alchemy/src/Cloudflare/Tunnel/Route.ts:58:5
  55 │     /**
  56 │      * UUID of the route, assigned by Cloudflare.
  57 │      */
> 58 │     routeId: string;

0.87 packages/alchemy/src/Prisma/Internal/Observed.ts:29:3
  28 │ export interface ObservedDatabase {
> 29 │   readonly id: string;
  30 │   readonly name: string;
  31 │   readonly status: DatabaseStatus;
  32 │   readonly defaultConnectionId: string | null;
  33 │   readonly connections: ReadonlyArray<
  34 │     ObservedConnection & { readonly id: string }
  35 │   >;
  36 │   readonly region?: { readonly id: string; readonly name: string } | null;
  37 │ }

0.87 packages/alchemy/src/Railway/ServiceDomain.ts:121:3
  120 │ export const deleteServiceDomainById = Effect.fn(function* (input: {
> 121 │   projectId: string;
  122 │   environmentId: string;
  123 │   serviceId: string;
  124 │   domainId: string;
  125 │ }) {
  126 │   yield* deleteOwnedServiceDomain(input);
  127 │ });

0.87 packages/alchemy/src/Runtime/Bootstrap/Microvm.ts:23:3
  21 │ export interface MicrovmBootstrapOptions {
  22 │   /** Port to serve on when the VM does not inject `PORT`. */
> 23 │   readonly port: number;
  24 │   /** Stack identity baked in at deploy time. */
  25 │   readonly stack: { readonly name: string; readonly stage: string };
  26 │ }

0.87 packages/alchemy/src/State/InMemoryState.ts:8:1
   5 │ import type { ResourceState } from "./ResourceState.ts";
   6 │ import { State, type PersistedState } from "./State.ts";
   7 │
>  8 │ type StackId = string;
   9 │ type StageId = string;
  10 │ type Fqn = string;

0.87 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/rpcs.ts:12:5
   5 │ export class BrowserRpcs extends RpcGroup.make(
   6 │   Rpc.make("echo", {
   7 │     payload: { value: Schema.String },
   8 │     success: Schema.String,
   9 │     error: Schema.Literal("Rejected"),
  10 │   }),
  11 │   Rpc.make("numbers", {
> 12 │     payload: { count: Schema.Number },
  13 │     success: Schema.Number,
  14 │     stream: true,
  15 │   }),
  16 │ ) {}

0.87 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:42:1
> 42 │ export const getText = (url: string) =>
  43 │   HttpClient.get(url, {
  44 │     headers: { connection: "close", "cache-control": "no-cache" },
  45 │   }).pipe(
  46 │     Effect.flatMap((response) =>
  47 │       response.status === 200
  48 │         ? response.text
  49 │         : Effect.fail(new Error(`Website returned HTTP ${response.status}`)),
  50 │     ),
  51 │     Effect.timeout("10 seconds"),
  52 │   );

0.87 packages/alchemy/test/Railway/fixtures/mysql-api.ts:8:1
   5 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
   6 │ import { Partition, Site } from "./suite-env.ts";
   7 │
>  8 │ export const MYSQL_API_PORT = 3000;
   9 │
  10 │ export { Site };

0.87 packages/alchemy/test/Railway/waitUntilVolumeGone.ts:16:1
  15 │ /** Poll `volumeInstance({id})` until Railway reports the instance gone. */
> 16 │ export const waitUntilVolumeGone = (volumeInstanceId: string) =>
  17 │   railway
  18 │     .volumeInstance(
  19 │       { id: volumeInstanceId },
  20 │       { deletedAt: true, isPendingDeletion: true, state: true },
  21 │     )
  22 │     .pipe(
  23 │       Effect.map((instance) =>
  24 │         isGoneInstance(instance) ? ("gone" as const) : ("found" as const),
  25 │       ),
  26 │       railway.catchTags(["RailwayNotFound"], () =>
  27 │         Effect.succeed("gone" as const),
  28 │       ),
  29 │       Effect.repeat({
  30 │         schedule: Schedule.spaced("1 second"),
  31 │         until: (status) => status === "gone",
  32 │         times: 10,
  33 │       }),
  34 │     );

0.87 packages/alchemy/test/Stripe/fixtures/event-source-worker.ts:42:13
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
  29 │         if (request.url.startsWith("/last/")) {
  30 │           const id = request.url.slice("/last/".length).split("?")[0];
  31 │           const seen = yield* kv.get(id).pipe(Effect.orDie);
  32 │           return yield* HttpServerResponse.json({
  33 │             id: seen === "1" ? id : null,
  34 │           });
  35 │         }
  36 │         if (request.url.startsWith("/last")) {
  37 │           const id = yield* kv.get("lastCustomerId").pipe(Effect.orDie);
  38 │           return yield* HttpServerResponse.json({ id: id ?? null });
  39 │         }
  40 │         if (request.method === "POST" && request.url.startsWith("/customers")) {
  41 │           const customer = yield* createCustomer({
> 42 │             email: "event-source@example.com",
  43 │           }).pipe(Effect.orDie);
  44 │           return yield* HttpServerResponse.json(
  45 │             { id: customer.id },
  46 │             { status: 201 },
  47 │           );
  48 │         }
  49 │         return HttpServerResponse.text("ok");
  50 │       }),
  51 │     };

0.87 packages/cloudflare-runtime/src/internal/workers-shared/shared/types.ts:19:3
  18 │ const InternalConfigFields = {
> 19 │   account_id: Schema.optional(Schema.Number),
  20 │   script_id: Schema.optional(Schema.Number),
  21 │   debug: Schema.optional(Schema.Boolean),
  22 │ };

0.86 packages/alchemy/src/AWS/AuthProvider.ts:389:13
  386 │             const accessKeyId = storedSecret(values.accessKeyId);
  387 │             const secretAccessKey = storedSecret(values.secretAccessKey);
  388 │             const sessionToken = storedSecret(values.sessionToken);
> 389 │             const region = storedValueText(values.region) ?? "";

0.86 packages/alchemy/src/AWS/GlobalAccelerator/Listener.ts:14:3
  10 │ export interface PortRange {
  11 │   /**
  12 │    * First port in the range of ports, inclusive.
  13 │    */
> 14 │   fromPort: number;
  15 │   /**
  16 │    * Last port in the range of ports, inclusive.
  17 │    */
  18 │   toPort: number;
  19 │ }

0.86 packages/alchemy/src/Cloudflare/Tunnel/Configuration.ts:103:3
   93 │ export interface ConfigurationAttributes {
   94 │   /** The tunnel this configuration belongs to. */
   95 │   tunnelId: string;
   96 │   /** Account that owns the tunnel. */
   97 │   accountId: string;
   98 │   /**
   99 │    * Cloudflare-side config version. Bumped on every PUT, even when the
  100 │    * payload is unchanged — surface it so downstream consumers can wait
  101 │    * on a specific revision if needed.
  102 │    */
> 103 │   version: number | undefined;
  104 │ }

0.86 packages/alchemy/src/Cloudflare/Zone/Zone.ts:361:5
  358 │   // attribute is simply `undefined` (matching `Attributes`).
  359 │   const z = stripNullFields(result);
  360 │   return {
> 361 │     zoneId: z.id,
  362 │     name: z.name,
  363 │     accountId: z.account.id ?? fallbackAccountId,
  364 │     accountName: z.account.name,
  365 │     type: z.type ?? "full",
  366 │     status: z.status,
  367 │     paused: z.paused ?? false,
  368 │     nameServers: z.nameServers,
  369 │     originalNameServers: z.originalNameServers,
  370 │     vanityNameServers: z.vanityNameServers,
  371 │     activatedOn: z.activatedOn,
  372 │     createdOn: z.createdOn,
  373 │     developmentMode: z.developmentMode,
  374 │     modifiedOn: z.modifiedOn,
  375 │     originalDnshost: z.originalDnshost,
  376 │     originalRegistrar: z.originalRegistrar,
  377 │     cnameSuffix: z.cnameSuffix,
  378 │     verificationKey: z.verificationKey,
  379 │     meta: z.meta,
  380 │     owner: z.owner,
  381 │     tenant: z.tenant,
  382 │     tenantUnit: z.tenantUnit,
  383 │   } as Attributes;

0.86 packages/alchemy/src/Fly/Volume.ts:41:1
  38 │ const transientState = (state: string | undefined) =>
  39 │   state === "creating" || state === "pending" || state === "extending";
  40 │
> 41 │ export const getVolumeById = (appName: string, volumeId: string) =>
  42 │   machines.getVolumeById({ app_name: appName, volume_id: volumeId }).pipe(
  43 │     Effect.map((volume) => (destroying(volume.state) ? undefined : volume)),
  44 │     Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  45 │   );

0.86 packages/alchemy/src/Hetzner/Service.ts:48:3
> 48 │   port?: number;

0.86 packages/alchemy/src/Neon/OrganizationSpendingLimit.ts:12:3
  10 │ export interface OrganizationSpendingLimitProps {
  11 │   /** Existing Neon organization ID. Restore and remove this control before changing organizations. */
> 12 │   orgId: string;
  13 │   /** Positive integer monthly alert threshold in cents; zero and null are not supported. */
  14 │   spendingLimitCents: number;
  15 │ }

0.86 packages/alchemy/src/Prisma/Internal/AppIdentity.ts:6:5
   3 │ /** Refuse to patch an App observed under a different immutable identity. */
   4 │ export const ensureAppImmutableIdentity = (
   5 │   app: {
>  6 │     id: string;
   7 │     projectId: string;
   8 │     region: { id: string };
   9 │   },
  10 │   projectId: string,
  11 │   regionId: string,
  12 │ ) =>
  13 │   app.projectId === projectId && app.region.id === regionId
  14 │     ? Effect.void
  15 │     : Effect.fail(
  16 │         new Error(
  17 │           `Prisma App '${app.id}' has immutable identity project '${app.projectId}' / region '${app.region.id}', but this resource requires project '${projectId}' / region '${regionId}'. Refusing to patch or claim the mismatched App; replace it or import the correct App ID.`,
  18 │         ),
  19 │       );

0.86 packages/alchemy/src/Railway/GraphQL.ts:30:3
  28 │ /** Walk the nested service connection, retaining the caller's exact projection. */
  29 │ export const projectServices = <const S extends railway.Selection<"Service">>(
> 30 │   projectId: string,
  31 │   select: S,
  32 │ ) =>
  33 │   Effect.gen(function* () {
  34 │     const rows: railway.Result<"Service!", S>[] = [];
  35 │     const seen = new Set<string>();
  36 │     let after: string | undefined;
  37 │     do {
  38 │       const project = yield* railway.project(
  39 │         { id: projectId },
  40 │         {
  41 │           services: {
  42 │             where: { first: 50, after },
  43 │             select: {
  44 │               edges: { node: { select } },
  45 │               pageInfo: { hasNextPage: true, endCursor: true },
  46 │             },
  47 │           },
  48 │         },
  49 │       );
  50 │       rows.push(...project.services.edges.map((edge) => edge.node));
  51 │       after = yield* advance(
  52 │         "Project.services",
  53 │         project.services.pageInfo,
  54 │         seen,
  55 │       );
  56 │     } while (after !== undefined);
  57 │     return rows;
  58 │   });

0.86 packages/alchemy/src/Railway/Postgres.ts:241:15
  228 │ ): Effect.Effect<PostgresProps, never, Providers> =>
  229 │   Effect.gen(function* () {
  230 │     const resolved = Effect.isEffect(props) ? yield* props : props;
  231 │     if (globalThis.__ALCHEMY_RUNTIME__) return resolved;
  232 │     const project = Effect.isEffect(resolved.project)
  233 │       ? yield* resolved.project as Effect.Effect<Project, never, Providers>
  234 │       : resolved.project;
  235 │     const environment =
  236 │       resolved.environment === undefined
  237 │         ? undefined
  238 │         : Effect.isEffect(resolved.environment)
  239 │           ? yield* resolved.environment as Effect.Effect<
  240 │               PostgresEnvironment,
> 241 │               never,
  242 │               Providers
  243 │             >
  244 │           : resolved.environment;
  245 │     return { ...resolved, project, environment };
  246 │   });

0.86 packages/alchemy/test/AWS/S3/fixtures/versioned-multipart-handler.ts:15:3
  14 │ const uploadRequest = Schema.Struct({
> 15 │   Key: Schema.String,
  16 │   UploadId: Schema.String,
  17 │ });

0.86 packages/alchemy/test/Cloudflare/Website/foldkit-fixture/src/main.ts:8:1
  6 │ // MODEL
  7 │
> 8 │ export const Model = S.Struct({ count: S.Number });
  9 │ export type Model = typeof Model.Type;

0.86 packages/alchemy/test/Cloudflare/Website/foldkit-worker-fixture/src/main.ts:8:1
  6 │ // MODEL
  7 │
> 8 │ export const Model = S.Struct({ count: S.Number });
  9 │ export type Model = typeof Model.Type;

0.86 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:55:15
  35 │     {
  36 │       app: WorkerSite,
  37 │       main: import.meta.url,
  38 │       region: "iad",
  39 │       port: 3000,
  40 │       guest: { cpuKind: "shared", cpus: 1, memoryMb: 256 },
  41 │       env: {
  42 │         VERSION: options.version,
  43 │         MODE: options.mode ?? "drain",
  44 │         AFTER_SIGNAL_MS: String(options.afterSignalMs ?? 1000),
  45 │         WORKERS: String(options.workers ?? 1),
  46 │         RUN_ONLY: options.runOnly ? "1" : "0",
  47 │       },
  48 │       deploy: { strategy: "bluegreen", healthTimeout: "45 seconds" },
  49 │       shutdown: { signal: options.signal, timeout: options.timeout },
  50 │       services: options.runOnly ? [] : services,
  51 │       checks: options.runOnly
  52 │         ? {
  53 │             ready: {
  54 │               type: "http",
> 55 │               port: 3000,
  56 │               path: "/health",
  57 │               interval: "2s",
  58 │               timeout: "1s",
  59 │             },
  60 │           }
  61 │         : undefined,
  62 │     },

0.85 packages/alchemy/src/ACME/Errors.ts:19:3
  18 │ export class OrderInvalid extends Data.TaggedError("ACME.OrderInvalid")<{
> 19 │   readonly orderUrl: string;
  20 │   readonly problems: ReadonlyArray<IdentifierProblem>;
  21 │ }> {
  22 │   override get message() {
  23 │     const details = this.problems
  24 │       .map((p) => [p.identifier, p.type, p.detail].filter(Boolean).join(": "))
  25 │       .join("; ");
  26 │     return `ACME order ${this.orderUrl} is invalid${details ? `: ${details}` : ""}`;
  27 │   }
  28 │ }

0.85 packages/alchemy/src/Auth/OAuthFlow.ts:201:7
  197 │   const extractCredentials = (
  198 │     json: {
  199 │       access_token: string;
  200 │       refresh_token?: string;
> 201 │       expires_in: number;
  202 │       scope?: string;
  203 │     },
  204 │     previous?: OAuthCredentials,
  205 │   ): Effect.Effect<OAuthCredentials, OAuthError> => {

0.85 packages/alchemy/src/AWS/AppConfig/internal.ts:11:3
   9 │ export const applicationArn = (
  10 │   region: string,
> 11 │   accountId: string,
  12 │   applicationId: string,
  13 │ ): string =>
  14 │   `arn:aws:appconfig:${region}:${accountId}:application/${applicationId}`;

0.85 packages/alchemy/src/AWS/EventBridge/ApiDestination.ts:16:1
> 16 │ export type ApiDestinationName = string;
  17 │ export type ApiDestinationArn =
  18 │   `arn:aws:events:${RegionID}:${AccountID}:api-destination/${ApiDestinationName}/${string}`;

0.85 packages/alchemy/src/AWS/KMS/Key.ts:105:3
   87 │ export interface Key extends Resource<
   88 │   "AWS.KMS.Key",
   89 │   KeyProps,
   90 │   {
   91 │     keyId: KeyId;
   92 │     keyArn: KeyArn;
   93 │     description: string | undefined;
   94 │     keyUsage: kms.KeyUsageType;
   95 │     keySpec: kms.KeySpec;
   96 │     keyState: kms.KeyState | undefined;
   97 │     enabled: boolean;
   98 │     keyRotationEnabled: boolean | undefined;
   99 │     rotationPeriodInDays: number | undefined;
  100 │     multiRegion: boolean;
  101 │     policy: string | undefined;
  102 │     deletionWindowInDays: number;
  103 │     tags: Record<string, string>;
  104 │   },
> 105 │   never,
  106 │   Providers
  107 │ > {}

0.85 packages/alchemy/src/AWS/Organizations/Policy.ts:23:1
> 23 │ export type PolicyId = string;
  24 │ export type PolicyArn = string;

0.85 packages/alchemy/src/AWS/Organizations/Root.ts:15:1
> 15 │ export type RootId = string;
  16 │ export type RootArn = string;

0.85 packages/alchemy/src/AWS/Route53/HealthCheck.ts:104:3
   87 │ export interface HealthCheck extends Resource<
   88 │   "AWS.Route53.HealthCheck",
   89 │   HealthCheckProps,
   90 │   {
   91 │     /**
   92 │      * Health check ID.
   93 │      */
   94 │     id: string;
   95 │     /**
   96 │      * Alias of `id`.
   97 │      */
   98 │     healthCheckId: string;
   99 │     /**
  100 │      * Health check type.
  101 │      */
  102 │     type: route53.HealthCheckType;
  103 │   },
> 104 │   never,
  105 │   Providers
  106 │ > {}

0.85 packages/alchemy/src/AWS/Route53/HostedZoneLookup.ts:47:3
  46 │ export const resolveHostedZoneId = Effect.fn("resolveHostedZoneId")(function* (
> 47 │   hostedZoneId: string | undefined,
  48 │   domainName: string,
  49 │ ) {
  50 │   if (hostedZoneId !== undefined) {
  51 │     return hostedZoneId;
  52 │   }
  53 │   const inferred = yield* findPublicHostedZoneId(domainName);
  54 │   if (inferred === undefined) {
  55 │     return yield* Effect.fail(
  56 │       new Error(
  57 │         `No public Route 53 hosted zone in this account contains "${domainName}" — ` +
  58 │           `create the zone first or pass "hostedZoneId" explicitly.`,
  59 │       ),
  60 │     );
  61 │   }
  62 │   return inferred;
  63 │ });

0.85 packages/alchemy/src/Cloudflare/Auth/TokenPolicy.ts:42:3
  40 │ export const tokenPolicies = (
  41 │   accountIds: ReadonlyArray<string>,
> 42 │   userId: string,
  43 │   groups: ReadonlyArray<PermissionGroup>,
  44 │ ): TokenPolicy[] => {

0.85 packages/alchemy/src/Cloudflare/Connectivity/DirectoryService.ts:41:5
  36 │   export interface Network {
  37 │     /**
  38 │      * UUID of the `cfd_tunnel` that provides connectivity to the host.
  39 │      * Accepts a reference to a `Cloudflare.Tunnel.Tunnel` output.
  40 │      */
> 41 │     tunnelId: string;
  42 │   }

0.85 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionFilter.ts:37:3
  35 │ export interface SynProtectionFilterAttributes {
  36 │   /** Cloudflare-assigned identifier of the filter. */
> 37 │   filterId: string;
  38 │   /** The Cloudflare account the filter belongs to. */
  39 │   accountId: string;
  40 │   /** The filter expression. */
  41 │   expression: string;
  42 │   /** The mode the filter applies to. */
  43 │   mode: SynProtectionFilterMode;
  44 │   /** ISO8601 creation timestamp. */
  45 │   createdOn: string;
  46 │   /** ISO8601 last-modified timestamp. */
  47 │   modifiedOn: string;
  48 │ }

0.85 packages/alchemy/src/Cloudflare/Email/ImpersonationRegistryEntry.ts:43:3
  41 │ export interface ImpersonationRegistryEntryAttributes {
  42 │   /** Cloudflare-assigned impersonation registry entry identifier. */
> 43 │   entryId: string;
  44 │   /** The account the entry belongs to. */
  45 │   accountId: string;
  46 │   /** The protected display name. */
  47 │   name: string;
  48 │   /** The legitimate email address (or regex). */
  49 │   email: string;
  50 │   /** Whether the email is a regular expression. */
  51 │   isEmailRegex: boolean;
  52 │   /** Free-form notes about the entry, if set. */
  53 │   comments: string | undefined;
  54 │   /**
  55 │    * Where the entry came from. Manually created entries are
  56 │    * `A1S_INTERNAL`; directory-synced entries carry the integration's
  57 │    * provenance.
  58 │    */
  59 │   provenance: string | undefined;
  60 │   /** ISO8601 creation timestamp. */
  61 │   createdAt: string;
  62 │   /** ISO8601 last-modified timestamp, if the entry has been modified. */
  63 │   modifiedAt: string | undefined;
  64 │ }

0.85 packages/alchemy/src/Cloudflare/Gateway/List.ts:82:3
  78 │ export interface ListAttributes {
  79 │   /** UUID of the list, assigned by Cloudflare. */
  80 │   listId: string;
  81 │   /** Cloudflare account that owns the list. */
> 82 │   accountId: string;
  83 │   /** Display name of the list. */
  84 │   name: string;
  85 │   /** The kind of values the list holds. */
  86 │   type: ListType;
  87 │   /** Description of the list. */
  88 │   description: string;
  89 │   /** Current entries in the list. */
  90 │   items: ListItem[];
  91 │   /** Number of entries in the list. */
  92 │   count: number;
  93 │   /** ISO8601 creation timestamp. */
  94 │   createdAt: string | undefined;
  95 │   /** ISO8601 last-update timestamp. */
  96 │   updatedAt: string | undefined;
  97 │ }

0.85 packages/alchemy/src/Cloudflare/MagicTransit/SiteLan.ts:381:3
  380 │ interface ObservedLan {
> 381 │   id?: string | null;
  382 │   name?: string | null;
  383 │   physport?: number | null;
  384 │   vlanTag?: number | null;
  385 │   haLink?: boolean | null;
  386 │   isBreakout?: boolean | null;
  387 │   isPrioritized?: boolean | null;
  388 │   nat?: { staticPrefix?: string | null } | null;
  389 │   routedSubnets?:
  390 │     | {
  391 │         nextHop: string;
  392 │         prefix: string;
  393 │         nat?: { staticPrefix?: string | null } | null;
  394 │       }[]
  395 │     | null;
  396 │   staticAddressing?: { address: string } | null;
  397 │   bondId?: number | null;
  398 │ }

0.85 packages/alchemy/src/Cloudflare/PageRule/PageRule.ts:45:3
> 45 │   target: string;

0.85 packages/alchemy/src/Cloudflare/ResourceSharing/ShareRecipient.ts:52:3
  49 │   /**
  50 │    * The Cloudflare account that owns (sends) the share.
  51 │    */
> 52 │   accountId: string;

0.85 packages/alchemy/src/Cloudflare/Speed/TestSchedule.ts:84:3
  82 │ export interface TestScheduleAttributes {
  83 │   /** Zone the schedule belongs to. */
> 84 │   zoneId: string;
  85 │   /** The tested page URL as normalized by Cloudflare (e.g. `example.com/`). */
  86 │   url: string;
  87 │   /** Region the test runs from. */
  88 │   region: TestRegion;
  89 │   /** How often the test runs. */
  90 │   frequency: TestFrequency;
  91 │ }

0.85 packages/alchemy/src/Cloudflare/Ssl/CertificatePack.ts:301:7
  299 │     reconcile: Effect.fn(function* ({ news, output }) {
  300 │       // Inputs have been resolved to concrete strings by Plan.
> 301 │       const zoneId = news.zoneId as string;

0.85 packages/alchemy/src/Cloudflare/Workers/Route.ts:42:3
  40 │ export interface WorkerRouteAttributes {
  41 │   /** Cloudflare-assigned route identifier. */
> 42 │   routeId: string;
  43 │   /** Zone that owns this route. */
  44 │   zoneId: string;
  45 │   /** Pattern the route matches. */
  46 │   pattern: string;
  47 │   /** Worker script the route runs, or `undefined` for an opt-out route. */
  48 │   script: string | undefined;
  49 │ }

0.85 packages/alchemy/src/Hetzner/VolumeAttachment.ts:61:5
  56 │ export type VolumeAttachment = Resource<
  57 │   "Hetzner.VolumeAttachment",
  58 │   VolumeAttachmentProps,
  59 │   {
  60 │     /** Numeric Hetzner Volume ID. */
> 61 │     volumeId: number;
  62 │     /** Numeric Hetzner Server ID the Volume is attached to. */
  63 │     serverId: number;
  64 │     /**
  65 │      * Last-applied automount flag. Hetzner does not expose the live
  66 │      * automount state, so this is the desired value from the last
  67 │      * successful reconcile.
  68 │      */
  69 │     automount: boolean;
  70 │     /** Device path on the file system (e.g. `/dev/disk/by-id/scsi-…`). */
  71 │     linuxDevice: string;
  72 │   },
  73 │   never,
  74 │   Providers
  75 │ >;

0.85 packages/alchemy/src/Neon/BranchScope.ts:21:3
  19 │ export interface ResolvedBranchScope {
  20 │   /** Neon project ID. */
> 21 │   projectId: string;
  22 │   /** Neon branch ID. */
  23 │   branchId: string;
  24 │ }

0.85 packages/alchemy/src/Planetscale/AuthProvider.ts:141:5
  136 │ export const PlanetscaleAuthConfigSchema = Schema.Union([
  137 │   Schema.Struct({
  138 │     method: Schema.Literal("stored"),
  139 │     tokenId: Schema.String,
  140 │     token: Schema.String,
> 141 │     organization: Schema.String,
  142 │   }),
  143 │   Schema.Struct({
  144 │     method: Schema.Literal("oauth"),
  145 │     organization: Schema.String,
  146 │     clientId: Schema.optional(Schema.String),
  147 │     access: Schema.String,
  148 │     refresh: Schema.String,
  149 │     expires: Schema.Number,
  150 │     scopes: Schema.mutable(Schema.Array(Schema.String)),
  151 │   }),
  152 │ ]);

0.85 packages/alchemy/src/Prisma/Website/FrameworkSite.ts:125:3
> 125 │   const port = props.compute?.port ?? 3000;

0.85 packages/alchemy/src/Railway/CloudAgent.ts:96:7
   77 │   {
   78 │     /** Railway cloud agent id. */
   79 │     cloudAgentId: string;
   80 │     /** Physical agent name. */
   81 │     name: string;
   82 │     /** Environment the agent lives in. */
   83 │     environmentId: string;
   84 │     /** Parent Railway project id. */
   85 │     projectId: string;
   86 │     /** Observed lifecycle status (`STARTING`, `RUNNING`, `SLEEPING`, …). */
   87 │     status: CloudAgentStatus;
   88 │     /**
   89 │      * Public hostname serving port 8080. Stable across sleep and wake;
   90 │      * `undefined` while the machine is asleep.
   91 │      */
   92 │     domain: string | undefined;
   93 │     /** Every public domain on the machine, one per port. */
   94 │     domains: ReadonlyArray<{
   95 │       domain: string;
>  96 │       port: number;
   97 │       prefix: string;
   98 │     }>;
   99 │     /** Console / exec target id. `undefined` while unavailable. */
  100 │     consoleTargetId: string | undefined;
  101 │     /** RFC3339 creation timestamp. */
  102 │     createdAt: string;
  103 │   },

0.85 packages/alchemy/src/Railway/CustomDomain.ts:101:5
   98 │   CustomDomainProps,
   99 │   {
  100 │     /** Railway custom domain id. */
> 101 │     customDomainId: string;
  102 │     /** User hostname. */
  103 │     domain: string;
  104 │     /** Parent Railway service id. */
  105 │     serviceId: string;
  106 │     /** Parent Railway project id. */
  107 │     projectId: string;
  108 │     /** Environment the hostname is attached in. */
  109 │     environmentId: string;
  110 │     /** Observed target port, if set. */
  111 │     targetPort: number | undefined;
  112 │     /** Whether DNS ownership has been verified. */
  113 │     verified: boolean | undefined;
  114 │     /** ACME certificate issuance status, if the API returned one. */
  115 │     certificateStatus: string | undefined;
  116 │     /** Human-readable ACME error, if issuance failed. */
  117 │     certificateErrorMessage: string | undefined;
  118 │     /** DNS host Railway expects for the verification TXT record. */
  119 │     verificationDnsHost: string | undefined;
  120 │     /** DNS token Railway expects for the verification TXT record. */
  121 │     verificationToken: string | undefined;
  122 │     /** Observed sync status (`ACTIVE`, `CREATING`, …). */
  123 │     syncStatus: string | undefined;
  124 │     /** `https://{domain}`. */
  125 │     url: string;
  126 │   },

0.85 packages/alchemy/src/Railway/Environment.ts:22:3
  21 │ export type RailwayWorkspace = {
> 22 │   readonly id: string;
  23 │   readonly name: string;
  24 │ };

0.85 packages/alchemy/src/Railway/MySQL.ts:181:5
  178 │   MySQLProps,
  179 │   {
  180 │     /** Railway service id for the MySQL container. */
> 181 │     serviceId: string;
  182 │     /** Physical service name. Private hostname is `{name}.railway.internal`. */
  183 │     name: string;

0.85 packages/alchemy/src/Railway/Redis.ts:402:1
> 402 │ const getInstance = (environmentId: string, serviceId: string) =>
  403 │   railway.serviceInstance({ environmentId, serviceId }, instanceSelection).pipe(
  404 │     Effect.map((instance) => (isGoneInstance(instance) ? undefined : instance)),
  405 │     railway.catchTags(["RailwayNotFound"], () => Effect.succeed(undefined)),
  406 │   );

0.85 packages/alchemy/src/Railway/rpc-token.ts:11:1
   9 │ export const PRIVATE_HOST_SUFFIX = ".railway.internal";
  10 │
> 11 │ export const DEFAULT_RPC_PORT = 3000;
  12 │
  13 │ /** Same prefix as `alchemy/Rpc` so Function canvas code does not import Rpc.ts. */
  14 │ export const RPC_PATH_PREFIX = "/__rpc__/";

0.85 packages/alchemy/src/Railway/ServiceRegion.ts:19:3
  16 │ export class ServiceRegionNotApplied extends Data.TaggedError(
  17 │   "Railway.ServiceRegionNotApplied",
  18 │ )<{
> 19 │   serviceId: string;
  20 │   environmentId: string;
  21 │   region: string;
  22 │   observed: string | undefined;
  23 │ }> {
  24 │   override get message() {
  25 │     const where = this.observed ?? "no region";
  26 │     return `Railway service ${this.serviceId} is in ${where} after requesting ${this.region}`;
  27 │   }
  28 │ }

0.85 packages/alchemy/src/Railway/Usage.ts:421:3
  418 │ export class UsageLimitWorkspaceNotFound extends Data.TaggedError(
  419 │   "Railway.UsageLimitWorkspaceNotFound",
  420 │ )<{
> 421 │   workspaceId: string;
  422 │ }> {}
  423 │
  424 │ type CloudLimit = WorkspaceResponseCustomerUsageLimit;

0.85 packages/alchemy/test/AWS/FSx/bindings-handler.ts:14:1
  11 │ // Syntactically valid but nonexistent ids: each probe must round-trip to FSx
  12 │ // and come back as the typed *NotFound — an IAM gap would surface
  13 │ // AccessDeniedException (a 500 via Effect.orDie) instead.
> 14 │ const MISSING_BACKUP_ID = "backup-00000000000000000";
  15 │ const MISSING_SNAPSHOT_ID = "fsvolsnap-00000000000000000";
  16 │ const MISSING_VOLUME_ID = "fsvol-00000000000000000";
  17 │ const MISSING_TASK_ID = "task-00000000000000000";

0.85 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:20:3
  17 │ import { randomBytes } from "node:crypto";
  18 │
  19 │ const Receipt = Schema.Struct({
> 20 │   machineId: Schema.String,
  21 │   ready: Schema.Boolean,
  22 │ });

0.85 packages/alchemy/test/Fly/fixtures/transport.ts:21:3
   9 │ export interface TransportEvent {
  10 │   sequence: number;
  11 │   stage:
  12 │     | "request"
  13 │     | "completed"
  14 │     | "forwarded"
  15 │     | "dropped"
  16 │     | "cut"
  17 │     | "held"
  18 │     | "upstream-error";
  19 │   method: string;
  20 │   path: string;
> 21 │   machineId?: string;
  22 │   name?: string;
  23 │   phase?: string;
  24 │   status?: number;
  25 │   image?: string;
  26 │   digest?: string;
  27 │   instanceId?: string;
  28 │   state?: string;
  29 │   cordoned?: boolean;
  30 │   minSecretsVersion?: number;
  31 │   secretsVersion?: number;
  32 │   checks?: { name?: string; status?: string }[];
  33 │ }

0.85 packages/alchemy/test/Prisma/ORM/Generated.types.ts:20:5
  17 │ export type AuthoredRow = Assert<
  18 │   Equal<
  19 │     typeof authored.public.User.Type,
> 20 │     { id: number; email: string; name: string | null }
  21 │   >
  22 │ >;

0.85 packages/alchemy/test/Railway/fixtures/volume-api.ts:13:1
  10 │ export const VOLUME_PATH = "/data";
  11 │ export const MARKER_FILE = "hello.txt";
  12 │ export const MARKER = "hello-from-railway-volume";
> 13 │ export const VOLUME_PORT = 3000;

0.85 packages/alchemy/test/types/BrandedTypes.ts:14:1
  11 │ // is an object-typed intersection member) and exploded into an ObjectExpr
  12 │ // mapped over every String method.
  13 │
> 14 │ type UserId = string & Brand.Brand<"UserId">;
  15 │
  16 │ const OrderId = S.String.pipe(S.brand("OrderId"));
  17 │ type OrderId = typeof OrderId.Type;

0.84 packages/alchemy/src/ACME/Account.ts:69:3
  50 │ export interface Account extends Resource<
  51 │   "ACME.Account",
  52 │   AccountProps,
  53 │   {
  54 │     /** The CA's directory URL. */
  55 │     directoryUrl: string;
  56 │     /** PEM root trusted for the CA's HTTPS endpoint (private CAs only). */
  57 │     trustedRoot: string | undefined;
  58 │     /** The account URL the CA assigned — the `kid` on every later request. */
  59 │     accountUrl: string;
  60 │     /** Observed account status (`valid`, `deactivated`, `revoked`). */
  61 │     status: string;
  62 │     /** Observed contact URLs. */
  63 │     contact: string[];
  64 │     /** Account key algorithm. */
  65 │     keyAlgorithm: KeyAlgorithm;
  66 │     /** The account's private JWK (JSON). Sensitive; persisted in stack state. */
  67 │     privateKey: Redacted.Redacted<string>;
  68 │   },
> 69 │   never,
  70 │   Providers
  71 │ > {}

0.84 packages/alchemy/src/AWS/AutoScaling/AutoScalingGroup.ts:21:1
> 21 │ export type AutoScalingGroupName = string;

0.84 packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts:101:3
> 101 │   never,
  102 │   Providers
  103 │ > {}

0.84 packages/alchemy/src/AWS/DMS/Endpoint.ts:241:9
  237 │       const buildSettings = (props: EndpointProps) => ({
  238 │         Username: props.username,
  239 │         Password: props.password,
  240 │         ServerName: props.serverName,
> 241 │         Port: props.port,
  242 │         DatabaseName: props.databaseName,
  243 │         ExtraConnectionAttributes: props.extraConnectionAttributes,
  244 │         CertificateArn: props.certificateArn,
  245 │         SslMode: props.sslMode,
  246 │         ServiceAccessRoleArn: props.serviceAccessRoleArn,
  247 │         ExternalTableDefinition: props.externalTableDefinition,
  248 │         S3Settings: props.s3Settings,
  249 │         DynamoDbSettings: props.dynamoDbSettings,
  250 │         KinesisSettings: props.kinesisSettings,
  251 │         KafkaSettings: props.kafkaSettings,
  252 │         ElasticsearchSettings: props.elasticsearchSettings,
  253 │         NeptuneSettings: props.neptuneSettings,
  254 │         RedshiftSettings: props.redshiftSettings,
  255 │         PostgreSQLSettings: props.postgreSQLSettings,
  256 │         MySQLSettings: props.mySQLSettings,
  257 │         OracleSettings: props.oracleSettings,
  258 │         MicrosoftSQLServerSettings: props.microsoftSQLServerSettings,
  259 │         MongoDbSettings: props.mongoDbSettings,
  260 │         DocDbSettings: props.docDbSettings,
  261 │         RedisSettings: props.redisSettings,
  262 │       });

0.84 packages/alchemy/src/AWS/ECR/Repository.ts:81:1
  56 │ export interface Repository extends Resource<
  57 │   "AWS.ECR.Repository",
  58 │   RepositoryProps,
  59 │   {
  60 │     /** The name of the repository. */
  61 │     repositoryName: RepositoryName;
  62 │     /** The ARN of the repository. */
  63 │     repositoryArn: RepositoryArn;
  64 │     /** The URI used to push/pull images, e.g. `<account>.dkr.ecr.<region>.amazonaws.com/<name>`. */
  65 │     repositoryUri: RepositoryUri;
  66 │     /** The AWS account ID of the registry. */
  67 │     registryId: string;
  68 │     /** Whether image tags are `MUTABLE` or `IMMUTABLE`. */
  69 │     imageTagMutability: ecr.ImageTagMutability;
  70 │     /** Whether repository images are scanned when they are pushed. */
  71 │     scanOnPush: boolean;
  72 │     /** The JSON lifecycle policy applied to the repository, if any. */
  73 │     lifecyclePolicyText?: string;
  74 │     /** The JSON repository permissions policy, if any. */
  75 │     policy?: string;
  76 │     /** The tags attached to the repository. */
  77 │     tags: Record<string, string>;
  78 │   },
  79 │   never,
  80 │   Providers
> 81 │ > {}

0.84 packages/alchemy/src/AWS/ElastiCache/CacheCluster.ts:56:3
  42 │ export interface CacheCluster extends Resource<
  43 │   "AWS.ElastiCache.CacheCluster",
  44 │   CacheClusterProps,
  45 │   {
  46 │     cacheClusterId: string;
  47 │     cacheClusterArn: string;
  48 │     status: string;
  49 │     engine: string;
  50 │     engineVersion: string | undefined;
  51 │     nodeType: string | undefined;
  52 │     endpoints: CacheNodeEndpoint[];
  53 │     transitEncryptionEnabled: boolean;
  54 │     tags: Record<string, string>;
  55 │   },
> 56 │   never,
  57 │   Providers
  58 │ > {}

0.84 packages/alchemy/src/AWS/GlobalAccelerator/EndpointGroup.ts:41:3
  37 │ export interface PortOverride {
  38 │   /**
  39 │    * The listener port to override.
  40 │    */
> 41 │   listenerPort: number;
  42 │   /**
  43 │    * The endpoint port that traffic on the overridden listener port is
  44 │    * routed to.
  45 │    */
  46 │   endpointPort: number;
  47 │ }

0.84 packages/alchemy/src/AWS/IdentityCenter/common.ts:106:3
  103 │ export const toInstanceAttributes = (
  104 │   instance: ssoAdmin.InstanceMetadata,
  105 │ ): {
> 106 │   instanceArn: string;
  107 │   identityStoreId: string;
  108 │   ownerAccountId: string | undefined;
  109 │   name: string | undefined;
  110 │   status: string | undefined;
  111 │   statusReason: string | undefined;
  112 │   createdDate: Date | undefined;
  113 │ } => ({
  114 │   instanceArn: instance.InstanceArn ?? "",
  115 │   identityStoreId: instance.IdentityStoreId ?? "",
  116 │   ownerAccountId: instance.OwnerAccountId,
  117 │   name: instance.Name,
  118 │   status: instance.Status,
  119 │   statusReason: instance.StatusReason,
  120 │   createdDate: instance.CreatedDate,
  121 │ });

0.84 packages/alchemy/src/AWS/Kinesis/Stream.ts:656:15
  654 │           if (metricsToDisable.length > 0) {
  655 │             yield* kinesis.disableEnhancedMonitoring({
> 656 │               StreamName: streamName,
  657 │               ShardLevelMetrics: metricsToDisable,
  658 │             });
  659 │             yield* waitForStreamActive(streamName);
  660 │             yield* session.note(
  661 │               `Disabled metrics: ${metricsToDisable.join(", ")}`,
  662 │             );
  663 │           }

0.84 packages/alchemy/src/AWS/Organizations/OrganizationalUnit.ts:342:3
  332 │ const readOUByParentAndName = Effect.fn(function* ({
  333 │   parentId,
  334 │   name,
  335 │ }: {
  336 │   parentId: string;
  337 │   name: string;
  338 │ }) {
  339 │   const match = (yield* listOUsForParent(parentId)).find(
  340 │     (ou) => ou.Name === name,
  341 │   );
> 342 │   return match?.Id ? yield* readOUById(match.Id) : undefined;
  343 │ });

0.84 packages/alchemy/src/AWS/SNS/Subscription.ts:42:5
  37 │ export interface Subscription extends Resource<
  38 │   "AWS.SNS.Subscription",
  39 │   SubscriptionProps,
  40 │   {
  41 │     /** ARN of the subscription. */
> 42 │     subscriptionArn: SubscriptionArn;
  43 │     /** ARN of the topic the subscription is attached to. */
  44 │     topicArn: string;
  45 │     /** Delivery protocol of the subscription (e.g. `lambda`, `sqs`, `https`). */
  46 │     protocol: string;
  47 │     /** Endpoint receiving deliveries, such as a Lambda function or queue ARN. */
  48 │     endpoint: string | undefined;
  49 │     /** AWS account ID that owns the subscription. */
  50 │     owner: string | undefined;
  51 │     /** Whether the subscription is still awaiting endpoint confirmation. */
  52 │     pendingConfirmation: boolean;
  53 │     /** Raw SNS subscription attributes keyed by AWS attribute name. */
  54 │     attributes: Record<string, string>;
  55 │   },
  56 │   never,
  57 │   Providers
  58 │ > {}

0.84 packages/alchemy/src/AWS/Timestream/DbInstance.ts:151:3
> 151 │   never,
  152 │   Providers
  153 │ > {}

0.84 packages/alchemy/src/Axiom/Chart.ts:37:3
  36 │ export interface BaseChart {
> 37 │   readonly id: string;
  38 │   readonly name: string;
  39 │   readonly type: ChartKind;
  40 │   readonly query: { readonly apl: string };
  41 │ }

0.84 packages/alchemy/src/Cloudflare/Access/Organization.ts:126:5
  123 │   OrganizationProps,
  124 │   {
  125 │     /** Cloudflare account that owns the Zero Trust organization. */
> 126 │     accountId: string;
  127 │     /** The Zero Trust team domain, e.g. `acme.cloudflareaccess.com`. */
  128 │     authDomain: string;
  129 │     /** Display name of the organization. */
  130 │     name: string;
  131 │     /** Default Access application session duration. */
  132 │     sessionDuration: string | undefined;
  133 │     /** WARP-as-IdP toggle observed on Cloudflare. */
  134 │     allowAuthenticateViaWarp: boolean | undefined;
  135 │     /** Dashboard read-only lock observed on Cloudflare. */
  136 │     isUiReadOnly: boolean | undefined;
  137 │     /** Skip-IdP-picker toggle observed on Cloudflare. */
  138 │     autoRedirectToIdentity: boolean | undefined;
  139 │     /** Free-form note explaining the `isUiReadOnly` setting. */
  140 │     uiReadOnlyToggleReason: string | undefined;
  141 │     /** User-seat inactivity expiration observed on Cloudflare. */
  142 │     userSeatExpirationInactiveTime: string | undefined;
  143 │     /** WARP authentication session duration observed on Cloudflare. */
  144 │     warpAuthSessionDuration: string | undefined;
  145 │     /** Login-page branding observed on Cloudflare. */
  146 │     loginDesign: Organization.LoginDesign | undefined;
  147 │     /** Custom-pages pointers observed on Cloudflare. */
  148 │     customPages: Organization.CustomPages | undefined;
  149 │   },

0.84 packages/alchemy/src/Cloudflare/Alerting/NotificationPolicy.ts:106:3
  102 │ export type NotificationPolicy = Resource<
  103 │   TypeId,
  104 │   NotificationPolicyProps,
  105 │   NotificationPolicyAttributes,
> 106 │   never,
  107 │   Providers
  108 │ >;

0.84 packages/alchemy/src/Cloudflare/ApiToken/Common.ts:61:3
  51 │ export type Props = {
  52 │   /**
  53 │    * Token name. Defaults to a generated physical name based on the
  54 │    * resource's logical id, app name, and stage.
  55 │    */
  56 │   name?: string;
  57 │   /**
  58 │    * The Cloudflare account ID that owns this token. Defaults to the
  59 │    * account ID resolved from the ambient {@link CloudflareEnvironment}.
  60 │    */
> 61 │   accountId?: string;
  62 │   /**
  63 │    * Access policies attached to the token. Cloudflare requires at least one
  64 │    * policy on a token; if you omit `policies` here, the policies must instead
  65 │    * be contributed by bindings (see {@link ApiTokenBinding}).
  66 │    */
  67 │   policies?: Policy[];
  68 │   /** ISO 8601 expiration timestamp. */
  69 │   expiresOn?: string;
  70 │   /** ISO 8601 "not before" timestamp. */
  71 │   notBefore?: string;
  72 │   /** Optional usage conditions (e.g. IP allowlist). */
  73 │   condition?: Condition;
  74 │ };

0.84 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:12:3
   9 │ import { md5 } from "../../Util/md5.ts";
  10 │
  11 │ export interface ImportDatabaseOptions {
> 12 │   accountId: string;
  13 │   databaseId: string;
  14 │   sqlData: string | Uint8Array;
  15 │   filename?: string;
  16 │ }

0.84 packages/alchemy/src/Cloudflare/DNS/Record.ts:541:3
  538 │ //   - no exact match          -> `undefined` (a new sibling record is created)
  539 │ //   - several exact matches   -> fail with an actionable error
  540 │ const findByNameType = (
> 541 │   zoneId: string,
  542 │   name: string,
  543 │   type: RecordType,
  544 │   match: RecordMatch,

0.84 packages/alchemy/src/Cloudflare/Email/Domain.ts:201:7
  200 │     read: Effect.fn(function* ({ output, olds }) {
> 201 │       const { accountId } = yield* yield* CloudflareEnvironment;
  202 │       const acct = output?.accountId ?? accountId;
  203 │
  204 │       // Owned path: refresh by the persisted domain id.
  205 │       if (output?.domainId) {
  206 │         const observed = yield* getDomain(acct, output.domainId);
  207 │         if (observed) return toAttributes(observed, acct);
  208 │       }
  209 │
  210 │       // Cold lookup: the domain pre-exists (onboarded in the dashboard) and
  211 │       // carries no ownership markers — report it `Unowned` so taking it
  212 │       // under management is gated behind the adopt policy.
  213 │       const domain = output?.domain ?? olds?.domain;
  214 │       if (domain !== undefined) {
  215 │         const observed = yield* findByName(acct, domain);
  216 │         if (observed) return Unowned(toAttributes(observed, acct));
  217 │       }
  218 │       return undefined;
  219 │     }),

0.84 packages/alchemy/src/Cloudflare/Healthcheck/Healthcheck.ts:201:3
  197 │ export interface Attributes {
  198 │   /** Cloudflare-assigned health check identifier. */
  199 │   healthcheckId: string;
  200 │   /** Zone that owns this health check. */
> 201 │   zoneId: string;
  202 │   /** Health check name. */
  203 │   name: string;
  204 │   /** The hostname or IP address being monitored. */
  205 │   address: string;
  206 │   /** Probe protocol (`HTTP`, `HTTPS` or `TCP`). */
  207 │   type: Type;
  208 │   /** Current origin status according to the health check. */
  209 │   status: Status;
  210 │   /** The current failure reason if status is unhealthy. */
  211 │   failureReason: string | undefined;
  212 │   /** Whether probing is suspended. */
  213 │   suspended: boolean;
  214 │   /** Probe interval in seconds. */
  215 │   interval: number;
  216 │   /** Number of immediate retries on timeout. */
  217 │   retries: number;
  218 │   /** Probe timeout in seconds. */
  219 │   timeout: number;
  220 │   /** ISO8601 creation timestamp. */
  221 │   createdOn: string | undefined;
  222 │   /** ISO8601 last-modified timestamp. */
  223 │   modifiedOn: string | undefined;
  224 │ }

0.84 packages/alchemy/src/Cloudflare/Logs.ts:112:5
  111 │   const queryLogs = (opts: {
> 112 │     accountId: string;
  113 │     filters: TelemetryFilter[];
  114 │     options: LogsInput;
  115 │   }) =>

0.84 packages/alchemy/src/Cloudflare/OriginCaCertificate/OriginCaCertificate.ts:396:3
  388 │ const toAttributes = (
  389 │   cert: CertificateShape,
  390 │   fallback?: {
  391 │     csr?: string;
  392 │     requestType?: RequestType;
  393 │     requestedValidity?: number;
  394 │   },
  395 │ ): Attributes => ({
> 396 │   certificateId: cert.id!,
  397 │   certificate: cert.certificate ?? "",
  398 │   csr: cert.csr ?? fallback?.csr ?? "",
  399 │   hostnames: [...cert.hostnames],
  400 │   requestType: (cert.requestType ??
  401 │     fallback?.requestType ??
  402 │     "origin-rsa") as RequestType,
  403 │   requestedValidity:
  404 │     cert.requestedValidity ?? fallback?.requestedValidity ?? DEFAULT_VALIDITY,
  405 │   expiresOn: cert.expiresOn ?? undefined,
  406 │ });

0.84 packages/alchemy/src/Cloudflare/R2/DataCatalog.ts:69:3
  62 │ export type DataCatalogProps = {
  63 │   /**
  64 │    * Name of the R2 bucket to enable the Iceberg data catalog on. The bucket
  65 │    * must already exist — pass `bucket.bucketName` from a `Cloudflare.R2.Bucket`
  66 │    * resource to order catalog-after-bucket. Changing the bucket replaces the
  67 │    * catalog (the old bucket's catalog is disabled; table data is untouched).
  68 │    */
> 69 │   bucketName: string;
  70 │   /**
  71 │    * Compaction maintenance configuration. Only the fields you specify are
  72 │    * enforced; omitted fields keep Cloudflare's defaults.
  73 │    */
  74 │   compaction?: Compaction;
  75 │   /**
  76 │    * Snapshot expiration maintenance configuration. Only the fields you
  77 │    * specify are enforced; omitted fields keep Cloudflare's defaults.
  78 │    */
  79 │   snapshotExpiration?: SnapshotExpiration;
  80 │   /**
  81 │    * Cloudflare API token (with R2 read/write access) the catalog uses to
  82 │    * run maintenance jobs against the bucket. Write-only: Cloudflare exposes
  83 │    * only `credentialStatus: "present" | "absent"`, never the token itself.
  84 │    * Maintenance jobs stay pending until a credential is provided.
  85 │    */
  86 │   token?: Redacted.Redacted<string>;
  87 │ };

0.84 packages/alchemy/src/Fly/Deployment.ts:30:3
  27 │ /** Named readiness check for a worker without public proxy ports. */
  28 │ export interface MachineCheck extends MachineServiceCheck {
  29 │   /** Port inside the Machine to check. */
> 30 │   port: number;
  31 │ }

0.84 packages/alchemy/src/Fly/Website/FrameworkSite.ts:316:3
> 316 │   const service = yield* Service("Service", {
  317 │     app,
  318 │     deploy: props.deploy,
  319 │     shutdown: props.shutdown,
  320 │     checks: props.checks,
  321 │     services: props.services,
  322 │     main: main as unknown as string,
  323 │     port: DEFAULT_PORT,
  324 │     // Node + nitro SSR needs more than the Machine default 256MB.
  325 │     guest: { memoryMb: 512 },
  326 │     isExternal: true,
  327 │     env: props.env,
  328 │     extraFiles: extraFiles as unknown as Array<{
  329 │       source: string;
  330 │       dest: string;
  331 │     }>,
  332 │     statics: statics as unknown as
  333 │       | Array<{
  334 │           guestPath: string;
  335 │           urlPrefix: string;
  336 │           tigrisBucket?: string;
  337 │           indexDocument?: string;
  338 │         }>
  339 │       | undefined,
  340 │     build:
  341 │       config.install !== undefined && config.install.length > 0
  342 │         ? { install: config.install }
  343 │         : undefined,
  344 │   });

0.84 packages/alchemy/src/Hetzner/actions.ts:9:3
   6 │ import * as Schedule from "effect/Schedule";
   7 │
   8 │ export class ActionPending extends Data.TaggedError("ActionPending")<{
>  9 │   actionId: number;
  10 │   status: string;
  11 │ }> {}

0.84 packages/alchemy/src/Hetzner/FloatingIpAssignment.ts:32:3
  31 │ export type FloatingIpAssignmentIp = {
> 32 │   readonly id: number;
  33 │ };

0.84 packages/alchemy/src/Hetzner/LoadBalancer.ts:221:7
> 221 │       ip: string;
  222 │     };

0.84 packages/alchemy/src/Neon/Auth.ts:63:3
  61 │ export interface AuthAttributes {
  62 │   /** Neon project identity. */
> 63 │   projectId: string;
  64 │   /** Branch identity; destruction never follows a parent branch. */
  65 │   branchId: string;
  66 │   /** Database holding authentication state. */
  67 │   database: string;
  68 │   /** Public managed Better Auth service URL. */
  69 │   baseUrl: string;
  70 │   /** Public JWKS endpoint for signature verification. */
  71 │   jwksUrl: string;
  72 │   /** Application name observed from Neon. */
  73 │   name: string | undefined;
  74 │ }

0.84 packages/alchemy/src/Neon/Branch.ts:41:1
  38 │ import { DeletionPending, type Project, waitForOperations } from "./Project.ts";
  39 │ import type { Providers } from "./Providers.ts";
  40 │
> 41 │ export type BranchSource = Project | { projectId: string };

0.84 packages/alchemy/src/Neon/CustomDomain.ts:13:5
  11 │ export interface CustomDomainProps {
  12 │   /** Target Function. Domain ownership remains independent of Function configuration. */ function: {
> 13 │     projectId: string;
  14 │     branchId: string;
  15 │     slug: string;
  16 │     url: string;
  17 │   };
  18 │   /** Public DNS hostname. Register the returned target with a DNS-only CNAME. */ hostname: string;
  19 │ }

0.84 packages/alchemy/src/Neon/Project.ts:142:5
  139 │     /** Immutable Postgres major version. */
  140 │     pgVersion: NeonPgVersion;
  141 │     /** Current default branch identifier. */
> 142 │     defaultBranchId: string;
  143 │     /** Current default branch name. */
  144 │     defaultBranchName: string;

0.84 packages/alchemy/src/Prisma/PrismaDevDatabase.ts:301:3
> 301 │   const options = optionsFrom(databaseId, config);
  302 │   const optionsKey = yield* stableJson(options);
  303 │   const cached = servers.get(databaseId);
  304 │   let entry = cached;

0.84 packages/alchemy/src/Railway/Volume.ts:561:3
  558 │ const waitForInstance = (
  559 │   environmentId: string,
  560 │   projectId: string,
> 561 │   volumeId: string,
  562 │ ) =>
  563 │   findInEnvironment(
  564 │     environmentId,

0.84 packages/alchemy/test/Cli/fixtures/register-dev-mode-probe.ts:1:1
> 1 │ export const alchemyUrl = import.meta.resolve("alchemy");
  2 │ export const subpathUrl = import.meta.resolve("alchemy/Cloudflare");

0.84 packages/alchemy/test/Cli/PlanTestNodes.ts:21:1
> 21 │ const resource = (id: string, props: object): ResourceLike => ({
  22 │   Namespace: undefined,
  23 │   FQN: id,
  24 │   Type: "Test.Resource",
  25 │   LogicalId: id,
  26 │   Props: props,
  27 │   RemovalPolicy: "destroy",
  28 │   Adopt: undefined,
  29 │   Mode: undefined,
  30 │   RequiresImplementation: undefined,
  31 │   FormerFqns: undefined,
  32 │   Attributes: {},
  33 │   Binding: undefined,
  34 │   Providers: undefined,
  35 │ });

0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/hibernating-websocket/worker.ts:142:17
  138 │           case "malformed": {
  139 │             yield* Effect.sync(() =>
  140 │               socket.serializeAttachment({
  141 │                 version: 1,
> 142 │                 count: 42,
  143 │                 joined: timestamp,
  144 │               }),
  145 │             );
  146 │             return yield* socket.getAttachment(Attachment);
  147 │           }

0.84 packages/cloudflare-runtime/src/core/internal/shared.worker.ts:319:5
  318 │   get(
> 319 │     id: BlobId,
  320 │     range?: InclusiveRange,
  321 │   ): Promise<ReadableStream<Uint8Array> | null>;

0.84 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:33:3
  31 │ export interface RegistryEntry {
  32 │   readonly scriptName: string;
> 33 │   readonly debugPortAddress: string;
  34 │   readonly services: [RegistryEntry.Worker, ...Array<RegistryEntry.Service>];
  35 │ }

0.84 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/experiment-analytics.ts:11:3
   8 │ // When adding new columns please update the schema
   9 │ type Data = {
  10 │   // -- Indexes --
> 11 │   accountId?: number;
  12 │   experimentName?: string;
  13 │
  14 │   // -- Doubles --
  15 │   // double1 - The time it takes to read the manifest in milliseconds
  16 │   manifestReadTime?: number;
  17 │
  18 │   // -- Blobs --
  19 │   // blob1 current or perfTest version of binary search
  20 │   binarySearchVersion?: "current" | "perfTest" | "current-fallback";
  21 │ };

0.84 packages/cloudflare-runtime/src/internal/workflows-shared/subscription.ts:141:5
  138 │   Schema.Struct({
  139 │     ...WorkflowSubscriptionEventCommonSchema.fields,
  140 │     type: Schema.Literal("wait_started"),
> 141 │     stepName: Schema.String,
  142 │     eventType: Schema.String,
  143 │   }),

0.83 packages/alchemy/src/ACME/CertificateAuthority.ts:9:3
   7 │ export interface CertificateAuthority {
   8 │   /** The CA's ACME directory URL. */
>  9 │   readonly directoryUrl: string;
  10 │   /**
  11 │    * PEM root certificate to trust for the CA's HTTPS endpoint. Only for
  12 │    * private CAs whose API certificate is not publicly trusted; public CAs
  13 │    * leave it unset.
  14 │    */
  15 │   readonly trustedRoot?: string | undefined;
  16 │ }

0.83 packages/alchemy/src/AWS/Athena/WorkGroup.ts:280:15
  279 │             if (
> 280 │               news.outputLocation !== undefined &&
  281 │               cfg?.ResultConfiguration?.OutputLocation !== news.outputLocation
  282 │             ) {
  283 │               updates.ResultConfigurationUpdates = {
  284 │                 ...updates.ResultConfigurationUpdates,
  285 │                 OutputLocation: news.outputLocation,
  286 │               };
  287 │               dirty = true;
  288 │             }

0.83 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:41:5
  39 │   iamActionDefinition?: {
  40 │     /** ARN of the managed policy to attach. */
> 41 │     policyArn: string;
  42 │     /** IAM role names to attach the policy to. */
  43 │     roles?: string[];
  44 │     /** IAM group names to attach the policy to. */
  45 │     groups?: string[];
  46 │     /** IAM user names to attach the policy to. */
  47 │     users?: string[];
  48 │   };

0.83 packages/alchemy/src/AWS/CloudFront/VpcOrigin.ts:116:2
  113 │  * ```typescript
  114 │  * const vpcOrigin = yield* VpcOrigin("AppOrigin", {
  115 │  *   arn: loadBalancer.arn,
> 116 │  *   httpPort: 80,

0.83 packages/alchemy/src/AWS/Connection/DbAuthToken.ts:15:3
   8 │ export interface GenerateDbAuthTokenOptions {
   9 │   /**
  10 │    * SigV4 signing service name: `rds-db` for RDS/Aurora IAM database
  11 │    * authentication, `dsql` for Aurora DSQL.
  12 │    */
  13 │   service: "rds-db" | "dsql";
  14 │   /** Database endpoint hostname the token authorizes a connection to. */
> 15 │   hostname: string;
  16 │   /**
  17 │    * Database endpoint port. Signed into the token for `rds-db` (the RDS
  18 │    * signer scopes tokens to `host:port`); DSQL tokens are host-only.
  19 │    */
  20 │   port?: number;
  21 │   /** Database user (`rds-db` only — signed as the `DBUser` parameter). */
  22 │   username?: string;
  23 │   /**
  24 │    * DSQL connect action (`dsql` only).
  25 │    * @default "DbConnect"
  26 │    */
  27 │   action?: "DbConnect" | "DbConnectAdmin";
  28 │   /**
  29 │    * How long the token remains valid.
  30 │    * @default 15 minutes
  31 │    */
  32 │   expiresIn?: Duration.Input;
  33 │   /** SigV4 signing region. Defaults to the ambient `Region` service. */
  34 │   region?: string;
  35 │ }

0.83 packages/alchemy/src/AWS/EC2/ClientVpnEndpoint.ts:89:5
  85 │   clientConnectOptions?: {
  86 │     /** Whether to invoke the connection handler. */
  87 │     enabled: boolean;
  88 │     /** ARN of the Lambda connection handler. Required when enabled. */
> 89 │     lambdaFunctionArn?: string;
  90 │   };

0.83 packages/alchemy/src/AWS/ElastiCache/ReplicationGroup.ts:76:3
  56 │ export interface ReplicationGroup extends Resource<
  57 │   "AWS.ElastiCache.ReplicationGroup",
  58 │   ReplicationGroupProps,
  59 │   {
  60 │     replicationGroupId: string;
  61 │     replicationGroupArn: string;
  62 │     status: string;
  63 │     engine: string;
  64 │     engineVersion: string | undefined;
  65 │     nodeType: string | undefined;
  66 │     configurationEndpointAddress: string | undefined;
  67 │     configurationEndpointPort: number | undefined;
  68 │     primaryEndpointAddress: string | undefined;
  69 │     primaryEndpointPort: number | undefined;
  70 │     readerEndpointAddress: string | undefined;
  71 │     readerEndpointPort: number | undefined;
  72 │     transitEncryptionEnabled: boolean;
  73 │     nodeGroupIds: string[];
  74 │     tags: Record<string, string>;
  75 │   },
> 76 │   never,
  77 │   Providers
  78 │ > {}

0.83 packages/alchemy/src/AWS/ElastiCache/ServerlessCache.ts:149:3
> 149 │   never,
  150 │   Providers
  151 │ > {}

0.83 packages/alchemy/src/AWS/ELBv2/LoadBalancer.ts:105:3
   80 │ export interface LoadBalancer extends Resource<
   81 │   "AWS.ELBv2.LoadBalancer",
   82 │   LoadBalancerProps,
   83 │   {
   84 │     /** The ARN of the load balancer. */
   85 │     loadBalancerArn: LoadBalancerArn;
   86 │     /** The name of the load balancer. */
   87 │     loadBalancerName: LoadBalancerName;
   88 │     /** The public DNS name of the load balancer. */
   89 │     dnsName: string;
   90 │     /** The Route 53 hosted zone ID for alias records targeting the load balancer. */
   91 │     canonicalHostedZoneId: string;
   92 │     /** The ID of the VPC the load balancer resides in. */
   93 │     vpcId: string;
   94 │     /** Whether the load balancer is `internet-facing` or `internal`. */
   95 │     scheme: string;
   96 │     /** The load balancer type (`application`, `network`, or `gateway`). */
   97 │     type: string;
   98 │     /** The IDs of the security groups attached to the load balancer. */
   99 │     securityGroups: string[];
  100 │     /** The IDs of the subnets the load balancer spans. */
  101 │     subnets: string[];
  102 │     /** The tags applied to the load balancer. */
  103 │     tags: Record<string, string>;
  104 │   },
> 105 │   never,
  106 │   Providers
  107 │ > {}

0.83 packages/alchemy/src/AWS/IAM/Policy.ts:240:9
  236 │       const readPolicyDocument = Effect.fn(function* ({
  237 │         policyArn,
  238 │         versionId,
  239 │       }: {
> 240 │         policyArn: string;
  241 │         versionId: string | undefined;
  242 │       }) {
  243 │         if (!versionId) {
  244 │           return undefined;
  245 │         }
  246 │         const response = yield* iam
  247 │           .getPolicyVersion({
  248 │             PolicyArn: policyArn,
  249 │             VersionId: versionId,
  250 │           })
  251 │           .pipe(
  252 │             Effect.catchTag("NoSuchEntityException", () =>
  253 │               Effect.succeed(undefined),
  254 │             ),
  255 │           );
  256 │         return parsePolicyDocument(response?.PolicyVersion?.Document);
  257 │       });

0.83 packages/alchemy/src/AWS/Kinesis/StreamConsumer.ts:21:1
  18 │ import type { Providers } from "../Providers.ts";
  19 │ import type { StreamArn } from "./Stream.ts";
  20 │
> 21 │ export type ConsumerName = string;
  22 │
  23 │ export type ConsumerArn = string;

0.83 packages/alchemy/src/AWS/NotificationsContacts/EmailContact.ts:31:3
  14 │ export interface EmailContactProps {
  15 │   /**
  16 │    * Display name of the contact (1–64 characters). If omitted, a unique
  17 │    * name is generated from the app, stage and logical ID. Contacts have no
  18 │    * update API, so changing the name replaces the contact.
  19 │    */
  20 │   name?: string;
  21 │
  22 │   /**
  23 │    * The email address that receives notifications. Unique per account —
  24 │    * AWS rejects a second contact with the same address. Changing the
  25 │    * address replaces the contact.
  26 │    *
  27 │    * A new contact is created in the unverified `inactive` state; AWS sends
  28 │    * notifications to it only after the address owner confirms the
  29 │    * activation email (`SendActivationCode` / the console).
  30 │    */
> 31 │   emailAddress: string;
  32 │
  33 │   /**
  34 │    * User tags to attach to the contact. Merged with internal Alchemy tags.
  35 │    */
  36 │   tags?: Record<string, string>;
  37 │ }

0.83 packages/alchemy/src/AWS/SecurityLake/ExceptionSubscription.ts:44:3
  33 │ export interface ExceptionSubscription extends Resource<
  34 │   "AWS.SecurityLake.ExceptionSubscription",
  35 │   ExceptionSubscriptionProps,
  36 │   {
  37 │     /** The protocol used to notify the subscription endpoint. */
  38 │     subscriptionProtocol: string;
  39 │     /** The endpoint that receives exception notifications. */
  40 │     notificationEndpoint: string;
  41 │     /** Retention of unresolved exceptions, in whole days. */
  42 │     exceptionTimeToLive: number | undefined;
  43 │   },
> 44 │   never,
  45 │   Providers
  46 │ > {}

0.83 packages/alchemy/src/AWS/SNS/Topic.ts:292:7
  290 │       // Sync data protection policy — observed ↔ desired. SNS rejects
  291 │       // getDataProtectionPolicy on FIFO topics, so we skip it there.
> 292 │       let observedPolicy: string | undefined;

0.83 packages/alchemy/src/Axiom/Dashboard.ts:15:5
  10 │ export type Dashboard = Resource<
  11 │   "Axiom.Dashboard",
  12 │   DashboardProps,
  13 │   {
  14 │     /** Stable Axiom dashboard `uid` (used as the path identifier). */
> 15 │     uid: string;
  16 │     id: string;
  17 │     createdAt: string;
  18 │     createdBy: string;
  19 │     updatedAt: string;
  20 │     updatedBy: string;
  21 │     /** The full dashboard document as returned by Axiom. */
  22 │     dashboard: Axiom.DashboardWriteResponse["dashboard"]["dashboard"];
  23 │   },
  24 │   never,
  25 │   Providers
  26 │ >;

0.83 packages/alchemy/src/Cloudflare/ClientCertificate/ClientCertificate.ts:61:3
  58 │   /** Cloudflare-assigned identifier of the client certificate. */
  59 │   clientCertificateId: string;
  60 │   /** Zone the certificate was issued under. */
> 61 │   zoneId: string;
  62 │   /** The signed client certificate in PEM format. */
  63 │   certificate: string;

0.83 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionFilter.ts:37:3
  35 │ export interface TcpFlowProtectionFilterAttributes {
  36 │   /** Cloudflare-assigned identifier of the filter. */
> 37 │   filterId: string;
  38 │   /** The Cloudflare account the filter belongs to. */
  39 │   accountId: string;
  40 │   /** The filter expression. */
  41 │   expression: string;
  42 │   /** The mode the filter applies to. */
  43 │   mode: TcpFlowProtectionFilterMode;
  44 │   /** ISO8601 creation timestamp. */
  45 │   createdOn: string;
  46 │   /** ISO8601 last-modified timestamp. */
  47 │   modifiedOn: string;
  48 │ }

0.83 packages/alchemy/src/Cloudflare/DNS/ZoneTransferPeer.ts:61:3
  59 │ export interface ZoneTransferPeerAttributes {
  60 │   /** Identifier of the peer. */
> 61 │   peerId: string;
  62 │   /** The Cloudflare account the peer belongs to. */
  63 │   accountId: string;
  64 │   /** Human-readable name of the peer. */
  65 │   name: string;
  66 │   /** Nameserver IP, if configured. */
  67 │   ip: string | undefined;
  68 │   /** Nameserver DNS port, if configured. */
  69 │   port: number | undefined;
  70 │   /** TSIG used to authenticate transfers, if configured. */
  71 │   tsigId: string | undefined;
  72 │   /** Whether IXFR transfers are enabled. */
  73 │   ixfrEnable: boolean | undefined;
  74 │ }

0.83 packages/alchemy/src/Cloudflare/Email/SendingSubdomain.ts:41:3
  37 │ export interface SendingSubdomainAttributes {
  38 │   /** Cloudflare-assigned identifier of the sending subdomain. */
  39 │   subdomainId: string;
  40 │   /** Zone the sending subdomain is registered on. */
> 41 │   zoneId: string;
  42 │   /** The subdomain domain name. */
  43 │   name: string;
  44 │   /**
  45 │    * Whether Email Sending is enabled on this subdomain. Flips to `true`
  46 │    * once the auto-provisioned DNS records (DKIM/SPF/return-path) validate
  47 │    * — usually immediate for zones on Cloudflare DNS.
  48 │    */
  49 │   enabled: boolean;
  50 │   /** The DKIM selector used for email signing. */
  51 │   dkimSelector: string | undefined;
  52 │   /** The return-path domain used for bounce handling. */
  53 │   returnPathDomain: string | undefined;
  54 │   /** ISO8601 creation timestamp. */
  55 │   created: string | undefined;
  56 │   /** ISO8601 last-modified timestamp. */
  57 │   modified: string | undefined;
  58 │ }

0.83 packages/alchemy/src/Cloudflare/Iam/UserGroupMembership.ts:41:3
  31 │ export interface UserGroupMembershipAttributes {
  32 │   /** ID of the user group the member belongs to. */
  33 │   userGroupId: string;
  34 │   /** Account member ID of the member. */
  35 │   memberId: string;
  36 │   /** The Cloudflare account the user group belongs to. */
  37 │   accountId: string;
  38 │   /** The contact email address of the member, if known. */
  39 │   email: string | undefined;
  40 │   /** The member's status in the account (`accepted` or `pending`). */
> 41 │   status: string | undefined;
  42 │ }

0.83 packages/alchemy/src/Cloudflare/MagicTransit/SiteWan.ts:63:3
  61 │ export interface MagicSiteWanAttributes {
  62 │   /** Cloudflare-assigned identifier of the WAN. */
> 63 │   wanId: string;
  64 │   /** The site the WAN belongs to. */
  65 │   siteId: string;
  66 │   /** The Cloudflare account the WAN belongs to. */
  67 │   accountId: string;
  68 │   /** The name of the WAN. */
  69 │   name: string;
  70 │   /** The physical port number. */
  71 │   physport: number | undefined;
  72 │   /** Priority of the WAN for traffic load balancing. */
  73 │   priority: number | undefined;
  74 │   /** The VLAN ID (zero for untagged). */
  75 │   vlanTag: number | undefined;
  76 │   /** Magic WAN health-check rate for tunnels created on this link. */
  77 │   healthCheckRate: string | undefined;
  78 │ }

0.83 packages/alchemy/src/Cloudflare/Pages/Domain.ts:101:3
   97 │ export type Domain = Resource<
   98 │   TypeId,
   99 │   DomainProps,
  100 │   DomainAttributes,
> 101 │   never,
  102 │   Providers
  103 │ >;

0.83 packages/alchemy/src/Cloudflare/RiskScoring/Integration.ts:26:3
  15 │ export interface IntegrationProps {
  16 │   /**
  17 │    * The third-party SOAR/SSF consumer of risk-score changes. Only
  18 │    * `Okta` is supported by the API today.
  19 │    * @default "Okta"
  20 │    */
  21 │   integrationType?: "Okta";
  22 │   /**
  23 │    * The base URL of the tenant that receives risk-score changes, e.g.
  24 │    * `https://tenant.okta.com`. Mutable — updated in place via PUT.
  25 │    */
> 26 │   tenantUrl: string;
  27 │   /**
  28 │    * A reference id supplied by the client. Cloudflare recommends setting
  29 │    * it to the Access-Okta identity provider ID (a UUIDv4) so the
  30 │    * integration can be recalled by that secondary asset.
  31 │    */
  32 │   referenceId?: string;
  33 │   /**
  34 │    * Whether the integration exports risk-score changes to the
  35 │    * third-party. Only togglable after create (the create API always
  36 │    * provisions an active integration).
  37 │    * @default true
  38 │    */
  39 │   active?: boolean;
  40 │ }

0.83 packages/alchemy/src/Cloudflare/Ruleset/CustomRuleset.ts:68:3
  61 │ export type CustomRulesetAttributes = {
  62 │   /** The unique ID of the ruleset (Cloudflare `id`). */
  63 │   rulesetId: string;
  64 │   /**
  65 │    * Account the ruleset belongs to. Alchemy-flattened identifier — not part
  66 │    * of Cloudflare's ruleset response.
  67 │    */
> 68 │   accountId: string;
  69 │   /** The kind of the ruleset. */
  70 │   kind: string;
  71 │   /** The human-readable name of the ruleset. */
  72 │   name: string;
  73 │   /** The phase of the ruleset. */
  74 │   phase: Phase;
  75 │   /** An informative description of the ruleset. */
  76 │   description: string | undefined;
  77 │   /** The list of rules in the ruleset. */
  78 │   rules: OutputRule[];
  79 │   /** The timestamp of when the ruleset was last modified. */
  80 │   lastUpdated: string;
  81 │   /** The version of the ruleset. */
  82 │   version: string;
  83 │ };

0.83 packages/alchemy/src/Cloudflare/Spectrum/Application.ts:421:1
> 421 │ const getApp = (zoneId: string, appId: string) =>
  422 │   spectrum.getApp({ zoneId, appId }).pipe(
  423 │     Effect.map((app): ObservedApp | undefined => app),
  424 │     Effect.catchTag("SpectrumAppNotFound", () => Effect.succeed(undefined)),
  425 │   );

0.83 packages/alchemy/src/Cloudflare/Stream/LiveInputOutput.ts:82:3
  78 │ export type LiveInputOutput = Resource<
  79 │   TypeId,
  80 │   LiveInputOutputProps,
  81 │   LiveInputOutputAttributes,
> 82 │   never,
  83 │   Providers
  84 │ >;

0.83 packages/alchemy/src/Cloudflare/Tunnel/HostnameRoute.ts:53:3
  49 │ export type HostnameRoute = Resource<
  50 │   TypeId,
  51 │   HostnameRouteProps,
  52 │   HostnameRouteAttributes,
> 53 │   never,
  54 │   Providers
  55 │ >;

0.83 packages/alchemy/src/Cloudflare/WaitingRoom/WaitingRoom.ts:202:3
  199 │   /** Cloudflare-assigned identifier of the waiting room. */
  200 │   waitingRoomId: string;
  201 │   /** Zone the waiting room belongs to. */
> 202 │   zoneId: string;
  203 │   /** The waiting room's unique name. */
  204 │   name: string;

0.83 packages/alchemy/src/Cloudflare/Workers/AlarmCallback.ts:301:17
  291 │       const claimed = yield* storage.transaction(
  292 │         Effect.gen(function* () {
  293 │           const now = yield* Clock.currentTimeMillis;
  294 │           const claimed = yield* Effect.sync(
  295 │             () =>
  296 │               raw.sql.exec(
  297 │                 `UPDATE alchemy_alarm_callbacks SET run_at = ?
  298 │            WHERE callback = ? AND id = ? AND version = ?`,
  299 │                 now + (callback?.retryDelay ?? 30_000),
  300 │                 job.callback,
> 301 │                 job.id,
  302 │                 job.version,
  303 │               ).rowsWritten > 0,
  304 │           );
  305 │           yield* reconcileDurableObjectAlarm(raw);
  306 │           return claimed;
  307 │         }),
  308 │       );

0.83 packages/alchemy/src/Fly/Machine.ts:359:5
  356 │     /** Whether recovery must finish an interrupted deployment. */
  357 │     rolloutPending?: boolean;
  358 │     /** Parent Fly App name. */
> 359 │     appName: string;
  360 │     /** Fly Machine id of replica 0. */
  361 │     machineId: string;

0.83 packages/alchemy/src/Hetzner/Firewall.ts:42:3
  41 │ type Server = {
> 42 │   readonly serverId: number;
  43 │ };
  44 │
  45 │ export type FirewallDirection = "in" | "out";

0.83 packages/alchemy/src/InstanceId.ts:5:1
  2 │ import * as Effect from "effect/Effect";
  3 │
  4 │ /** A 16-byte (128-bit) random hex-encoded string representing an physical instance of a logical resource */
> 5 │ export class InstanceId extends Context.Service<InstanceId, string>()(
  6 │   "instance-id",
  7 │ ) {}

0.83 packages/alchemy/src/Neon/Storage.ts:81:9
  77 │     list: (
  78 │       options: {
  79 │         prefix?: string;
  80 │         delimiter?: string;
> 81 │         cursor?: string;
  82 │         limit?: number;
  83 │       } = {},
  84 │     ) =>
  85 │       provide(
  86 │         S3.listObjectsV2({
  87 │           Bucket: bucket,
  88 │           Prefix: options.prefix,
  89 │           Delimiter: options.delimiter,
  90 │           ContinuationToken: options.cursor,
  91 │           MaxKeys: options.limit,
  92 │         }),
  93 │       ),

0.83 packages/alchemy/src/Planetscale/MySQL/MySQLClusterSize.ts:35:3
  15 │ export type MySQLClusterSize =
  16 │   | "PS_DEV"
  17 │   | "PS_5"
  18 │   | "PS_10"
  19 │   | "PS_20"
  20 │   | "PS_40"
  21 │   | "PS_80"
  22 │   | "PS_160"
  23 │   | "PS_320"
  24 │   | "PS_400"
  25 │   | "PS_640"
  26 │   | "PS_700"
  27 │   | "PS_900"
  28 │   | "PS_1280"
  29 │   | "PS_1400"
  30 │   | "PS_1800"
  31 │   | "PS_2100"
  32 │   | "PS_2560"
  33 │   | "PS_2700"
  34 │   | "PS_2800"
> 35 │   | (string & {});

0.83 packages/alchemy/src/Prisma/ComputeLifecycle.ts:61:3
  57 │ export interface DestroyDeploymentResult {
  58 │   /**
  59 │    * Prisma deployment ID that was targeted.
  60 │    */
> 61 │   deploymentId: string;
  62 │   /**
  63 │    * Status observed before cleanup started, or undefined if the deployment was gone.
  64 │    */
  65 │   previousStatus: string | undefined;
  66 │   /**
  67 │    * True when Alchemy requested a stop before deletion.
  68 │    */
  69 │   stopped: boolean;
  70 │   /**
  71 │    * True when the delete call completed or the deployment vanished during cleanup.
  72 │    */
  73 │   deleted: boolean;
  74 │ }

0.83 packages/alchemy/src/Railway/Project.ts:81:3
  66 │ export type Project = Resource<
  67 │   "Railway.Project",
  68 │   ProjectProps,
  69 │   {
  70 │     /** Railway project id. */
  71 │     projectId: string;
  72 │     /** Physical project name (unique per workspace). */
  73 │     name: string;
  74 │     /** Workspace the project lives in. */
  75 │     workspaceId: string;
  76 │     /** Primary / base environment id created with the project. */
  77 │     environmentId: string;
  78 │     /** Dashboard URL (`https://railway.com/project/{projectId}`). */
  79 │     url: string;
  80 │   },
> 81 │   never,
  82 │   Providers
  83 │ >;

0.83 packages/alchemy/src/Railway/Website/Cdn.ts:261:9
  260 │       return {
> 261 │         serviceId,
  262 │         environmentId,
  263 │         edgeConfigId: enabled.id,
  264 │         enabled: enabled.enabled,
  265 │       };

0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/rpcs.ts:25:3
  22 │ export class SocketRpcs extends RpcGroup.make(
  23 │   Rpc.make("greet", { payload: { name: Schema.String }, success: Greeting }),
  24 │   Rpc.make("increment", { success: Schema.Number }),
> 25 │   Rpc.make("reject", { success: Schema.Never, error: Rejected }),
  26 │   Rpc.make("numbers", {
  27 │     payload: { count: Schema.Number },
  28 │     success: Schema.Number,
  29 │     stream: true,
  30 │   }),
  31 │   Rpc.make("watch", {
  32 │     payload: { key: Schema.String },
  33 │     success: Schema.Number,
  34 │     stream: true,
  35 │   }),
  36 │   Rpc.make("cleanup", {
  37 │     payload: { key: Schema.String, waitForDisconnect: Schema.Boolean },
  38 │     success: Schema.Number,
  39 │   }),
  40 │   Rpc.make("releaseCleanup", {
  41 │     payload: { key: Schema.String },
  42 │     success: Schema.Boolean,
  43 │   }),
  44 │   Rpc.make("invalidateSocketSerialization", { success: Schema.Number }),
  45 │   Rpc.make("abort", { success: Schema.Void }),
  46 │   Rpc.make("stats", { success: SocketStats }),
  47 │ ) {}

0.83 packages/alchemy/test/Docker/Runtime.ts:44:3
  43 │ export const findAvailablePort = () =>
> 44 │   Effect.callback<number, Error>((resume) => {
  45 │     const server = NodeNet.createServer();
  46 │     server.unref();
  47 │     server.on("error", (error) => resume(Effect.fail(error)));
  48 │     server.listen(0, "127.0.0.1", () => {
  49 │       const address = server.address();
  50 │       const port =
  51 │         typeof address === "object" && address ? address.port : undefined;
  52 │       server.close((error) => {
  53 │         if (error) {
  54 │           resume(Effect.fail(error));
  55 │         } else if (port) {
  56 │           resume(Effect.succeed(port));
  57 │         } else {
  58 │           resume(Effect.fail(new Error("Failed to allocate a free host port")));
  59 │         }
  60 │       });
  61 │     });
  62 │   });

0.83 packages/alchemy/test/Fly/fixtures/bluegreen-worker-shared.ts:66:3
  65 │ export interface Job {
> 66 │   id: string;
  67 │   job: string;
  68 │   kind: string;
  69 │   checkpoint: string;
  70 │ }

0.83 packages/cloudflare-runtime/src/core/bindings/queue/QueueOptions.shared.ts:22:5
  10 │ export interface QueueConsumer {
  11 │   /** Logical name of the queue this worker consumes. */
  12 │   readonly queueName: string;
  13 │   /**
  14 │    * When set, this consumer's queue is a REAL Cloudflare queue: the runtime
  15 │    * attaches a pull loop that drains it via the HTTP pull API (the queue
  16 │    * must have an `http_pull` consumer attached) and feeds the batches into
  17 │    * the local broker, which delivers them to this worker's `queue()`
  18 │    * handler with the usual local batching/retry semantics.
  19 │    */
  20 │   readonly pull?: {
  21 │     /** Id of the real Cloudflare queue to pull from. */
> 22 │     readonly queueId: string;
  23 │     /** Cloudflare account the queue lives in. */
  24 │     readonly accountId: string;
  25 │   };
  26 │   /** Maximum number of messages per batch (0-100, default 5). */
  27 │   readonly maxBatchSize?: number;
  28 │   /** Maximum seconds to wait before flushing a partial batch (0-60, default 1). */
  29 │   readonly maxBatchTimeout?: number;
  30 │   /** Maximum number of retries before dropping/dead-lettering (0-100, default 2). */
  31 │   readonly maxRetries?: number;
  32 │   /** Name of the queue failed messages are moved to after `maxRetries`. */
  33 │   readonly deadLetterQueue?: string;
  34 │   /** Default delay (seconds, 0-86400) applied to retried messages. */
  35 │   readonly retryDelay?: number;
  36 │ }

0.83 packages/cloudflare-runtime/src/core/RuntimeServices.ts:46:3
  45 │ export interface ApiConfig {
> 46 │   accountId: string | Effect.Effect<string>;
  47 │ }

0.83 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/types.ts:10:3
   9 │ export interface ReadyAnalyticsEvent {
> 10 │   accountId?: number;
  11 │   indexId?: string;
  12 │   version?: number;
  13 │   doubles?: Array<number | undefined>;
  14 │   blobs?: Array<string | undefined>;
  15 │ }

0.83 packages/floci/src/index.ts:141:3
> 141 │   readonly port?: number | undefined;

0.83 packages/pkg/src/Registry/Tags.ts:17:3
  14 │ export const TagRow = Schema.Struct({
  15 │   package: Schema.String,
  16 │   tag: Schema.String,
> 17 │   sha256: Schema.String,
  18 │   expires_at: Schema.Number,
  19 │   /** Pull requests whose runs produced this tag, as `owner/repo#N`. */
  20 │   linked_prs: LinkedPrs,
  21 │ });

0.82 packages/alchemy/src/AWS/AMP/Scraper.ts:91:3
> 91 │   destinationWorkspaceArn: string;

0.82 packages/alchemy/src/AWS/B2BI/Profile.ts:52:5
  45 │ export interface Profile extends Resource<
  46 │   "AWS.B2BI.Profile",
  47 │   ProfileProps,
  48 │   {
  49 │     /**
  50 │      * Service-assigned unique ID of the profile.
  51 │      */
> 52 │     profileId: string;
  53 │     /**
  54 │      * ARN of the profile.
  55 │      */
  56 │     profileArn: string;
  57 │     /**
  58 │      * Name of the profile.
  59 │      */
  60 │     name: string;
  61 │     /**
  62 │      * Business name associated with the profile.
  63 │      */
  64 │     businessName: string;
  65 │     /**
  66 │      * CloudWatch log group created for the profile when logging is enabled.
  67 │      */
  68 │     logGroupName: string | undefined;
  69 │   },
  70 │   never,
  71 │   Providers
  72 │ > {}

0.82 packages/alchemy/src/AWS/Bedrock/ModelArns.ts:33:3
  31 │ export const bedrockModelArns = (
  32 │   region: string,
> 33 │   accountId: string,
  34 │   modelId: string,
  35 │ ): string[] => {
  36 │   if (modelId.startsWith("arn:")) {
  37 │     return [modelId];
  38 │   }
  39 │   const geoPrefix = modelId.split(".", 1)[0];
  40 │   if (geoPrefix && INFERENCE_PROFILE_GEO_PREFIXES.has(geoPrefix)) {
  41 │     return [
  42 │       `arn:aws:bedrock:${region}:${accountId}:inference-profile/${modelId}`,
  43 │       `arn:aws:bedrock:*::foundation-model/${modelId.slice(geoPrefix.length + 1)}`,
  44 │     ];
  45 │   }
  46 │   return [`arn:aws:bedrock:${region}::foundation-model/${modelId}`];
  47 │ };

0.82 packages/alchemy/src/AWS/CloudWatch/common.ts:10:3
   7 │ export type CloudWatchTags = Record<string, string>;
   8 │
   9 │ export const createName = (
> 10 │   id: string,
  11 │   providedName: string | undefined,
  12 │   maxLength: number,
  13 │ ) =>
  14 │   providedName
  15 │     ? Effect.succeed(providedName)
  16 │     : createPhysicalName({
  17 │         id,
  18 │         maxLength,
  19 │       });

0.82 packages/alchemy/src/AWS/EC2/NetworkInterfaceAttachment.ts:224:3
  223 │ class EniAttachmentPending extends Data.TaggedError("EniAttachmentPending")<{
> 224 │   networkInterfaceId: string;
  225 │   status: string;
  226 │ }> {}

0.82 packages/alchemy/src/AWS/EKS/Cluster.ts:680:23
  656 │         const role = yield* iam
  657 │           .createRole({
  658 │             RoleName: roleName,
  659 │             AssumeRolePolicyDocument: JSON.stringify({
  660 │               Version: "2012-10-17",
  661 │               Statement: [
  662 │                 {
  663 │                   Effect: "Allow",
  664 │                   Principal: { Service: service },
  665 │                   Action: actions,
  666 │                 },
  667 │               ],
  668 │             }),
  669 │             Tags: Object.entries({ ...tags, ...userTags }).map(
  670 │               ([Key, Value]) => ({ Key, Value }),
  671 │             ),
  672 │           })
  673 │           .pipe(
  674 │             Effect.catchTag("EntityAlreadyExistsException", () =>
  675 │               iam.getRole({ RoleName: roleName }).pipe(
  676 │                 Effect.filterOrFail(
  677 │                   (existing) => hasTags(tags, existing.Role?.Tags),
  678 │                   () =>
  679 │                     new Error(
> 680 │                       `Role '${roleName}' already exists and is not managed by alchemy`,
  681 │                     ),
  682 │                 ),
  683 │               ),
  684 │             ),
  685 │           );

0.82 packages/alchemy/src/AWS/Firehose/DeliveryStream.ts:181:5
  178 │     /**
  179 │      * Current version ID of the delivery stream configuration.
  180 │      */
> 181 │     versionId: string;

0.82 packages/alchemy/src/AWS/GuardDuty/FindingEventSource.ts:22:3
  14 │ export interface FindingEventDetail {
  15 │   /** The finding id. */
  16 │   id?: string;
  17 │   /** The finding type, e.g. `Recon:EC2/PortProbeUnprotectedPort`. */
  18 │   type?: string;
  19 │   /** The finding severity (0.1–8+; 7+ is high). */
  20 │   severity?: number;
  21 │   /** The account the finding was generated in. */
> 22 │   accountId?: string;
  23 │   /** The region the finding was generated in. */
  24 │   region?: string;
  25 │   /** The finding's ARN. */
  26 │   arn?: string;
  27 │   /** The finding title. */
  28 │   title?: string;
  29 │   /** The finding description. */
  30 │   description?: string;
  31 │   /** The affected resource document. */
  32 │   resource?: Record<string, unknown>;
  33 │   /** The detection service document (counts, first/last seen, …). */
  34 │   service?: Record<string, unknown>;
  35 │   /** Additional finding fields (the schema grows over time). */
  36 │   [key: string]: unknown;
  37 │ }

0.82 packages/alchemy/src/AWS/IAM/OpenIDConnectProvider.ts:41:5
  34 │ export interface OpenIDConnectProvider extends Resource<
  35 │   "AWS.IAM.OpenIDConnectProvider",
  36 │   OpenIDConnectProviderProps,
  37 │   {
  38 │     /** The ARN of the OIDC provider. */
  39 │     openIDConnectProviderArn: string;
  40 │     /** The URL of the identity provider. */
> 41 │     url: string;
  42 │     /** The client IDs (audiences) registered with the provider. */
  43 │     clientIDList: string[];
  44 │     /**
  45 │      * Reflects the desired state — `undefined` when the user opted out of
  46 │      * managing thumbprints (AWS auto-manages them for well-known IdPs).
  47 │      */
  48 │     thumbprintList: string[] | undefined;
  49 │     /** The tags applied to the provider. */
  50 │     tags: Record<string, string>;
  51 │   },
  52 │   never,
  53 │   Providers
  54 │ > {}

0.82 packages/alchemy/src/AWS/Logs/LogGroup.ts:361:17
  346 │           if (desiredRetention !== observedRetention) {
  347 │             if (desiredRetention === undefined) {
  348 │               yield* logs
  349 │                 .deleteRetentionPolicy({
  350 │                   logGroupName,
  351 │                 })
  352 │                 .pipe(
  353 │                   Effect.catchTag(
  354 │                     "ResourceNotFoundException",
  355 │                     () => Effect.void,
  356 │                   ),
  357 │                 );
  358 │             } else {
  359 │               yield* logs.putRetentionPolicy({
  360 │                 logGroupName,
> 361 │                 retentionInDays: desiredRetention,
  362 │               });
  363 │             }
  364 │           }

0.82 packages/alchemy/src/AWS/Organizations/TenantRoot.ts:61:3
  59 │ export interface TenantPolicySpec {
  60 │   /** Stable key identifying the policy within the tenant. */
> 61 │   key: string;
  62 │   /** Policy name. If omitted, Alchemy generates one. */
  63 │   name?: string;
  64 │   /** Policy description. */
  65 │   description?: string;
  66 │   /**
  67 │    * Organizations policy type.
  68 │    * @default "SERVICE_CONTROL_POLICY"
  69 │    */
  70 │   type?: organizations.PolicyType;
  71 │   /**
  72 │    * Policy content — a typed {@link ServiceControlPolicyDocument} for
  73 │    * SCP/RCP policies, or a raw JSON `string` for other policy types
  74 │    * (tag, backup, ...) and as the escape hatch.
  75 │    */
  76 │   document: ServiceControlPolicyDocument | string;
  77 │   /** Keys of the roots/OUs/accounts to attach the policy to (`"root"` or a spec key). */
  78 │   targetKeys: TenantTargetKey[];
  79 │   /** Tags applied to the policy, merged with tenant-wide tags. */
  80 │   tags?: Record<string, string>;
  81 │ }

0.82 packages/alchemy/src/AWS/RedshiftServerless/Workgroup.ts:21:3
> 21 │   workgroupName?: string;

0.82 packages/alchemy/src/AWS/RePostSpace/Space.ts:221:3
  218 │ /** Internal marker error driving the bounded readiness retry loop. */
  219 │ class RePostSpaceNotReady extends Data.TaggedError("RePostSpaceNotReady")<{
  220 │   spaceId: string;
> 221 │   status: string;
  222 │ }> {}

0.82 packages/alchemy/src/AWS/ServiceCatalog/internal.ts:9:1
>  9 │ export const idempotencyToken = (instanceId: string): string =>
  10 │   instanceId.replaceAll(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "alchemy";

0.82 packages/alchemy/src/AWS/SES/CustomVerificationEmailTemplate.ts:79:2
  76 │  * import * as SES from "alchemy/AWS/SES";
  77 │  *
  78 │  * const template = yield* SES.CustomVerificationEmailTemplate("Verify", {
> 79 │  *   fromEmailAddress: "verify@example.com",

0.82 packages/alchemy/src/AWS/VpcLattice/Listener.ts:141:7
> 141 │       const observe = (serviceIdentifier: string, listenerIdentifier: string) =>
  142 │         vpclattice
  143 │           .getListener({ serviceIdentifier, listenerIdentifier })
  144 │           .pipe(
  145 │             Effect.catchTag("ResourceNotFoundException", () =>
  146 │               Effect.succeed(undefined),
  147 │             ),
  148 │           );

0.82 packages/alchemy/src/Cloudflare/AI/Gateway.ts:141:3
  138 │   /**
  139 │    * Restrict the rule to a set of providers.
  140 │    */
> 141 │   provider?: { mode: "filter"; values: string[] };

0.82 packages/alchemy/src/Cloudflare/Alerting/Silence.ts:44:3
  42 │ export interface SilenceAttributes {
  43 │   /** Cloudflare-assigned silence id. */
> 44 │   silenceId: string;
  45 │   /** Account that owns this silence. */
  46 │   accountId: string;
  47 │   /** The notification policy this silence applies to. */
  48 │   policyId: string;
  49 │   /** When the silence window starts (ISO8601). */
  50 │   startTime: string;
  51 │   /** When the silence window ends (ISO8601). */
  52 │   endTime: string;
  53 │   /** ISO8601 creation timestamp. */
  54 │   createdAt: string | undefined;
  55 │   /** ISO8601 last-modified timestamp. */
  56 │   updatedAt: string | undefined;
  57 │ }

0.82 packages/alchemy/src/Cloudflare/Alerting/Webhook.ts:61:3
  59 │ export interface NotificationWebhookAttributes {
  60 │   /** Cloudflare-assigned webhook destination UUID. */
> 61 │   webhookId: string;
  62 │   /** Account that owns this webhook destination. */
  63 │   accountId: string;
  64 │   /** Name of the webhook destination. */
  65 │   name: string;
  66 │   /** The POST endpoint called when dispatching a notification. */
  67 │   url: string;
  68 │   /** Endpoint type inferred by Cloudflare from the URL (e.g. `generic`, `slack`). */
  69 │   type: NotificationWebhookType | undefined;
  70 │   /** ISO8601 creation timestamp. */
  71 │   createdAt: string | undefined;
  72 │ }

0.82 packages/alchemy/src/Cloudflare/Cache/Reserve.ts:21:3
  15 │ export interface ReserveProps {
  16 │   /**
  17 │    * Zone whose Cache Reserve setting is managed. Stable — changing the
  18 │    * zone triggers a replacement (the old zone's setting is restored to
  19 │    * the value it had before Alchemy managed it).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Whether Cache Reserve is enabled on the zone (`value: "on"`) or
  24 │    * disabled (`value: "off"`). Mutable — patched in place.
  25 │    * @default true
  26 │    */
  27 │   enabled?: boolean;
  28 │   /**
  29 │    * When true, destroying the resource also clears any data already
  30 │    * stored in Cache Reserve (after restoring the setting), waiting for
  31 │    * the asynchronous clear operation to complete. Disabling Cache
  32 │    * Reserve does NOT purge stored data by itself — storage continues to
  33 │    * bill until it expires or is cleared.
  34 │    * @default false
  35 │    */
  36 │   clearOnDelete?: boolean;
  37 │ }

0.82 packages/alchemy/src/Cloudflare/Dlp/Profile.ts:27:5
  19 │ export interface ProfileEntry {
  20 │   /** Name of the entry. Unique within the profile. */
  21 │   name: string;
  22 │   /** Whether the entry participates in scans. */
  23 │   enabled: boolean;
  24 │   /** The detection pattern. */
  25 │   pattern: {
  26 │     /** The regular expression to match. */
> 27 │     regex: string;
  28 │     /** Optional checksum validation applied to matches. */
  29 │     validation?: "luhn";
  30 │   };
  31 │   /** Optional description of the entry. */
  32 │   description?: string;
  33 │ }

0.82 packages/alchemy/src/Cloudflare/KV/Namespace.ts:208:15
  197 │       if (output?.namespaceId) {
  198 │         return yield* kv
  199 │           .getNamespace({
  200 │             accountId: output.accountId,
  201 │             namespaceId: output.namespaceId,
  202 │           })
  203 │           .pipe(
  204 │             Effect.map((namespace) => ({
  205 │               title: namespace.title,
  206 │               namespaceId: namespace.id,
  207 │               supportsUrlEncoding: namespace.supportsUrlEncoding ?? undefined,
> 208 │               accountId: output.accountId,
  209 │             })),
  210 │             Effect.catchTag("NamespaceNotFound", () =>
  211 │               Effect.succeed(undefined),
  212 │             ),
  213 │           );
  214 │       }

0.82 packages/alchemy/src/Cloudflare/LoadBalancer/Monitor.ts:123:3
  121 │ export interface MonitorAttributes {
  122 │   /** Cloudflare-assigned monitor identifier. */
> 123 │   monitorId: string;
  124 │   /** The Cloudflare account the monitor belongs to. */
  125 │   accountId: string;
  126 │   /** Monitor description (carries the physical name when generated). */
  127 │   description: string;
  128 │   /** Probe protocol. */
  129 │   type: MonitorType;
  130 │   /** ISO8601 creation timestamp. */
  131 │   createdOn: string | undefined;
  132 │   /** ISO8601 last-modified timestamp. */
  133 │   modifiedOn: string | undefined;
  134 │ }

0.82 packages/alchemy/src/Cloudflare/LoadBalancer/Pool.ts:495:3
  493 │ const toAttributes = (
  494 │   pool: ObservedPool,
> 495 │   accountId: string,
  496 │ ): PoolAttributes => ({
  497 │   poolId: pool.id ?? "",
  498 │   accountId,
  499 │   name: pool.name ?? "",
  500 │   enabled: pool.enabled ?? true,
  501 │   monitor: pool.monitor ?? undefined,
  502 │   createdOn: pool.createdOn ?? undefined,
  503 │   modifiedOn: pool.modifiedOn ?? undefined,
  504 │ });

0.82 packages/alchemy/src/Cloudflare/Logpush/Job.ts:182:3
  180 │ export interface JobAttributes {
  181 │   /** Cloudflare-assigned numeric job id. */
> 182 │   jobId: number;
  183 │   /** Account that owns the job. */
  184 │   accountId: string;
  185 │   /** Zone the job is scoped to, or `undefined` for account-scoped jobs. */
  186 │   zoneId: string | undefined;
  187 │   /** Job name. */
  188 │   name: string;
  189 │   /** Dataset the job pushes. */
  190 │   dataset: Dataset;
  191 │   /**
  192 │    * Destination URI. Note Cloudflare redacts embedded secrets (e.g. the
  193 │    * R2 `secret-access-key`) when echoing this back.
  194 │    */
  195 │   destinationConf: string;
  196 │   /** Whether the job is enabled. */
  197 │   enabled: boolean;
  198 │   /** Job kind (`""` for Logpush, `"edge"` for Edge Log Delivery). */
  199 │   kind: string;
  200 │   /** Last failure message, if the job is currently failing. */
  201 │   errorMessage: string | undefined;
  202 │   /** End of the last successfully-pushed log range. */
  203 │   lastComplete: string | undefined;
  204 │   /** Time of the last push failure. */
  205 │   lastError: string | undefined;
  206 │ }

0.82 packages/alchemy/src/Cloudflare/MagicTransit/StaticRoute.ts:82:3
  78 │ export type MagicStaticRoute = Resource<
  79 │   TypeId,
  80 │   MagicStaticRouteProps,
  81 │   MagicStaticRouteAttributes,
> 82 │   never,
  83 │   Providers
  84 │ >;

0.82 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:101:3
   99 │ export interface SuperSlurperJobAttributes {
  100 │   /** Cloudflare account that owns the migration. */
> 101 │   accountId: string;
  102 │   /** Server-assigned migration ID. Stable until replacement. */
  103 │   jobId: string;
  104 │   /** Last observed job status; not a completion guarantee. */
  105 │   status: r2.GetSuperSlurperJobResponse["status"];
  106 │   /** Creation timestamp reported by Cloudflare. */
  107 │   createdAt: string | undefined;
  108 │   /** Completion timestamp, if the job has finished. */
  109 │   finishedAt: string | undefined;
  110 │ }

0.82 packages/alchemy/src/Cloudflare/Rules/List.ts:461:1
> 461 │ const getListById = (accountId: string, listId: string) =>
  462 │   rules
  463 │     .getList({ accountId, listId })
  464 │     .pipe(Effect.catchTag("ListNotFound", () => Effect.succeed(undefined)));

0.82 packages/alchemy/src/Cloudflare/Stream/Watermark.ts:291:1
> 291 │ const getWatermark = (accountId: string, watermarkId: string) =>
  292 │   stream
  293 │     .getWatermark({ accountId, identifier: watermarkId })
  294 │     .pipe(
  295 │       Effect.catchTag("WatermarkNotFound", () => Effect.succeed(undefined)),
  296 │     );

0.82 packages/alchemy/src/Cloudflare/Tunnel/Tunnel.ts:101:3
   87 │ export type Tunnel = Resource<
   88 │   "Cloudflare.Tunnel.Tunnel",
   89 │   TunnelProps,
   90 │   {
   91 │     tunnelId: string;
   92 │     tunnelName: string;
   93 │     accountTag: string | undefined;
   94 │     accountId: string;
   95 │     createdAt: string | undefined;
   96 │     deletedAt: string | undefined;
   97 │     configSrc: "cloudflare" | "local";
   98 │     token: Redacted.Redacted<string>;
   99 │   },
  100 │   never,
> 101 │   Providers
  102 │ >;

0.82 packages/alchemy/src/Fly/MountVolume.ts:81:1
  72 │ export interface MountedDisk {
  73 │   /** Mount path inside the Machine. */
  74 │   path: string;
  75 │   /** Fly Volume id. */
  76 │   volumeId: string;
  77 │   /** Size in GB. */
  78 │   sizeGb: number;
  79 │   /** Fly volume-group name. */
  80 │   name: string;
> 81 │ }

0.82 packages/alchemy/src/Fly/Postgres.ts:121:5
  118 │   PostgresProps,
  119 │   {
  120 │     /** Fly Managed Postgres cluster id. */
> 121 │     clusterId: string;
  122 │     /** Cluster name (unique in the org). */
  123 │     name: string;

0.82 packages/alchemy/src/Fly/Sprite.ts:540:3
  536 │ const deployProgram = Effect.fn(function* (input: {
  537 │   name: string;
  538 │   files: ReadonlyArray<{ path: string; content: Uint8Array }>;
  539 │   env: Record<string, string>;
> 540 │   port: number;
  541 │   session?: { note: (message: string) => Effect.Effect<void> };
  542 │ }) {
  543 │   const note = input.session?.note ?? ((_message: string) => Effect.void);
  544 │   yield* note(`Writing ${input.name} program onto the Sprite...`);
  545 │   for (const file of input.files) {
  546 │     const rel = file.path.replace(/^\/+/, "");
  547 │     yield* writeRemoteFile({
  548 │       name: input.name,
  549 │       path: `${APP_DIR}/${rel}`,
  550 │       body: file.content,
  551 │     });
  552 │   }
  553 │   yield* writeRemoteFile({
  554 │     name: input.name,
  555 │     path: `${APP_DIR}/env`,
  556 │     body: new TextEncoder().encode(renderEnvFile(input.env)),
  557 │   });
  558 │   yield* note(`Installing bun on ${input.name}...`);
  559 │   yield* ensureBun(input.name);
  560 │   yield* note(`Starting ${input.name} service...`);
  561 │   yield* putAlchemyService({ name: input.name, port: input.port });
  562 │ });

0.82 packages/alchemy/src/Fly/VolumeSnapshot.ts:42:5
  35 │ export type VolumeSnapshot = Resource<
  36 │   "Fly.VolumeSnapshot",
  37 │   VolumeSnapshotProps,
  38 │   {
  39 │     /** Parent Fly App name. */
  40 │     appName: string;
  41 │     /** Fly Volume id this snapshot belongs to. */
> 42 │     volumeId: string;
  43 │     /** Fly snapshot id (`vs_…`). Identity of the resource. */
  44 │     snapshotId: string;
  45 │     /** Observed snapshot status, if the API returned one. */
  46 │     status: string | undefined;
  47 │     /** Content digest of the snapshot. */
  48 │     digest: string | undefined;
  49 │     /** Snapshot size in bytes, if the API returned one. */
  50 │     size: number | undefined;
  51 │     /** Source volume size in GB at snapshot time. */
  52 │     volumeSize: number | undefined;
  53 │     /** Retention in days. */
  54 │     retentionDays: number | undefined;
  55 │     /** RFC3339 creation timestamp. */
  56 │     createdAt: string | undefined;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ >;

0.82 packages/alchemy/src/Hetzner/Catalog.ts:19:1
> 19 │ const numericId = (ref: string | number): number | undefined =>
  20 │   typeof ref === "number" ? ref : /^\d+$/.test(ref) ? Number(ref) : undefined;

0.82 packages/alchemy/src/Hetzner/Website/FrameworkSite.ts:221:5
  215 │ export const websiteUrl = (args: {
  216 │   readonly domain?: string | undefined;
  217 │   readonly service: Service;
  218 │   readonly port: number;
  219 │ }) =>
  220 │   args.domain !== undefined
> 221 │     ? `http://${args.domain}:${String(args.port)}`
  222 │     : args.service.url;

0.82 packages/alchemy/src/Local/RpcSpawner.ts:201:5
  200 │   const register = Effect.fn(function* (
> 201 │     serverEntryUrl: string,
  202 │     attempt = 0,
  203 │   ): Effect.fn.Return<string, PlatformError> {
  204 │     const child = yield* Cache.get(cache, serverEntryUrl);
  205 │     if (yield* child.isRunning) {
  206 │       return child.url;
  207 │     }
  208 │     if (attempt > 3) {
  209 │       return yield* Effect.die(
  210 │         new Error(
  211 │           `Failed to spawn RPC server for "${serverEntryUrl}" after ${attempt} attempts.`,
  212 │         ),
  213 │       );
  214 │     }
  215 │     yield* child.kill;
  216 │     yield* Cache.invalidate(cache, serverEntryUrl);
  217 │     return yield* register(serverEntryUrl, attempt + 1);
  218 │   });

0.82 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:23:3
  21 │ export interface OrganizationVPCEndpointAttributes {
  22 │   /** Organization containing the registration. */
> 23 │   orgId: string;
  24 │   /** Neon AWS region containing the registration. */
  25 │   regionId: string;
  26 │   /** Referenced AWS VPC endpoint; never created, modified, or deleted by this resource. */
  27 │   vpcEndpointId: string;
  28 │   /** Observed label, or null when the registration is absent. */
  29 │   label: string | null;
  30 │   /** Original adopted label; null denotes a registration created by Alchemy. */
  31 │   initialLabel: string | null;
  32 │   /** Last managed label, retained across refreshes for drift-safe cleanup. */
  33 │   managedLabel: string;
  34 │   /** Observed Neon registration state (for example new or accepted); null when absent. */
  35 │   state: string | null;
  36 │ }

0.82 packages/alchemy/src/Neon/ProjectVPCEndpoint.ts:211:11
  206 │       if (
  207 │         output &&
  208 │         (output.projectId !== scope.projectId ||
  209 │           output.orgId !== scope.orgId ||
  210 │           output.regionId !== scope.regionId ||
> 211 │           output.vpcEndpointId !== scope.vpcEndpointId)
  212 │       )

0.82 packages/alchemy/src/Planetscale/MySQL/MySQLPassword.ts:81:3
  63 │ export interface MySQLPasswordAttributes {
  64 │   /** Unique identifier for the password (stable). */
  65 │   id: string;
  66 │   /** Password name. If omitted, a unique name is generated from `${app}-${stage}-${id}`. */
  67 │   name: string;
  68 │   /** ISO 8601 timestamp at which the password expires. `null` if no TTL. */
  69 │   expiresAt: string | null;
  70 │   /** Hostname for the database connection. */
  71 │   host: string;
  72 │   /** Username for database authentication. */
  73 │   username: string;
  74 │   /** Password for database authentication (Redacted). */
  75 │   password: Redacted.Redacted<string>;
  76 │   /** Parsed connection components ready to feed into Cloudflare Hyperdrive. */
  77 │   origin: MySQLOrigin;
  78 │   /** Resolved organization slug. */
  79 │   organization: string;
  80 │   /** Resolved database name. */
> 81 │   database: string;
  82 │   /** Resolved branch name. */
  83 │   branch: string;
  84 │   /** The role granted. */
  85 │   role: "reader" | "writer" | "admin" | "readwriter" | (string & {});
  86 │   /** Whether this password is for a read replica. */
  87 │   replica: boolean | undefined;
  88 │   /** TTL in seconds (if set). */
  89 │   ttl: number | undefined;
  90 │   /** IP CIDR ranges allowed to use this password. */
  91 │   cidrs: readonly string[] | undefined;
  92 │ }

0.82 packages/alchemy/src/Planetscale/Postgres/PostgresRole.ts:563:7
  560 │     origin: {
  561 │       scheme: "postgres",
  562 │       host: role.access_host_url,
> 563 │       port: 5432,
  564 │       database: role.database_name,
  565 │       user: role.username,
  566 │       password,
  567 │     },

0.82 packages/alchemy/src/Prisma/PrismaEnvironment.ts:13:3
  12 │ export interface PrismaEnvironmentShape extends PrismaResolvedCredentials {
> 13 │   baseUrl: string;
  14 │ }

0.82 packages/alchemy/src/Railway/Mongo.ts:401:3
  398 │ class MongoDeployPending extends Data.TaggedError(
  399 │   "Railway.MongoDeployPending",
  400 │ )<{
> 401 │   serviceId: string;
  402 │   status: string;
  403 │ }> {}

0.82 packages/alchemy/src/Railway/ProjectEnvironment.ts:321:19
  301 │       const rows = yield* Effect.forEach(projects, (project) =>
  302 │         railway.environments
  303 │           .items(
  304 │             { projectId: project.projectId, first: 50 },
  305 │             environmentSelection,
  306 │           )
  307 │           .pipe(
  308 │             Stream.filter(
  309 │               (env) =>
  310 │                 env.deletedAt == null && matchesAlchemyPhysicalName(env.name),
  311 │             ),
  312 │             Stream.runCollect,
  313 │             Effect.map((chunk) =>
  314 │               Array.from(chunk).map((env) => {
  315 │                 const projectId = env.projectId || project.projectId;
  316 │                 return {
  317 │                   environmentId: env.id,
  318 │                   name: env.name,
  319 │                   projectId,
  320 │                   isEphemeral: env.isEphemeral,
> 321 │                   url: `https://railway.com/project/${projectId}?environmentId=${env.id}`,
  322 │                 };
  323 │               }),
  324 │             ),
  325 │             railway.catchTags(["RailwayNotFound"], () =>
  326 │               Effect.succeed([] as Environment["Attributes"][]),
  327 │             ),
  328 │           ),
  329 │       );

0.82 packages/alchemy/src/Railway/Sandbox.ts:381:3
  380 │ class SandboxPending extends Data.TaggedError("Railway.SandboxPending")<{
> 381 │   sandboxId: string;
  382 │   status: string;
  383 │ }> {}

0.82 packages/alchemy/src/Railway/Up.ts:21:3
  20 │ export type UpResponse = {
> 21 │   readonly deploymentId: string;
  22 │   readonly url: string;
  23 │   readonly logsUrl: string;
  24 │   readonly deploymentDomain: string;
  25 │ };

0.82 packages/alchemy/src/Railway/Website/FrameworkSite.ts:341:3
  340 │ export const makeFrameworkSite = (
> 341 │   id: string,
  342 │   props: FrameworkSiteProps,
  343 │   config: FrameworkSiteConfig,
  344 │ ) => runFrameworkSite(id, props, config).pipe(Effect.orDie);

0.82 packages/alchemy/src/Runtime/Bootstrap/Prisma.ts:24:3
  22 │ export interface PrismaBootstrapOptions {
  23 │   /** Port to serve on when the platform does not inject `PORT`. */
> 24 │   readonly port: number;
  25 │   /** Stack identity baked in at deploy time. */
  26 │   readonly stack: { readonly name: string; readonly stage: string };
  27 │ }

0.82 packages/alchemy/src/Stripe/Customer.ts:142:3
  141 │ const toAttrs = (customer: StripeCustomer) => ({
> 142 │   id: customer.id,
  143 │   email: customer.email ?? undefined,
  144 │   name: customer.name ?? undefined,
  145 │   description: customer.description ?? undefined,
  146 │   phone: customer.phone ?? undefined,
  147 │   metadata: userMetadata(customer.metadata),
  148 │   created: customer.created,
  149 │   livemode: customer.livemode,
  150 │ });

0.82 packages/alchemy/src/Stripe/WebhookEndpoint.ts:201:3
  197 │ const toAttrs = (
  198 │   endpoint: StripeWebhookEndpoint,
  199 │   previousSecret?: Redacted.Redacted<string>,
  200 │ ) => ({
> 201 │   id: endpoint.id,
  202 │   url: endpoint.url,
  203 │   enabledEvents: endpoint.enabled_events,
  204 │   description: endpoint.description ?? undefined,
  205 │   apiVersion: endpoint.api_version ?? undefined,
  206 │   application: endpoint.application ?? undefined,
  207 │   connect: endpoint.application != null,
  208 │   status: (endpoint.status === "disabled"
  209 │     ? "disabled"
  210 │     : "enabled") as WebhookEndpointStatus,
  211 │   secret: redactSecret(endpoint.secret) ?? previousSecret,
  212 │   metadata: userMetadata(endpoint.metadata),
  213 │   created: endpoint.created,
  214 │   livemode: endpoint.livemode,
  215 │ });

0.82 packages/alchemy/test/AWS/ELBv2/fixtures/acm.ts:18:3
  17 │ export const ensureImportedCert = Effect.fn(function* (
> 18 │   domainName: string,
  19 │   certPem: string,
  20 │   keyPem: string,
  21 │ ) {
  22 │   const pages = yield* acm.listCertificates
  23 │     .pages({ CertificateStatuses: ["ISSUED"] })
  24 │     .pipe(
  25 │       Stream.runCollect,
  26 │       Effect.map((chunk) =>
  27 │         Array.from(chunk).flatMap((page) => page.CertificateSummaryList ?? []),
  28 │       ),
  29 │     );
  30 │   const existing = pages.find((c) => c.DomainName === domainName);
  31 │   if (existing?.CertificateArn) {
  32 │     return existing.CertificateArn;
  33 │   }
  34 │   const encode = (pem: string) =>
  35 │     Effect.sync(() => new TextEncoder().encode(pem));
  36 │   const imported = yield* acm.importCertificate({
  37 │     Certificate: yield* encode(certPem),
  38 │     PrivateKey: yield* encode(keyPem),
  39 │   });
  40 │   if (!imported.CertificateArn) {
  41 │     return yield* Effect.fail(new CertificateImportFailed({ domainName }));
  42 │   }
  43 │   return imported.CertificateArn;
  44 │ });

0.82 packages/alchemy/test/AWS/Local/fixtures/ecs-dev/main-task.ts:22:5
  16 │ export default class EcsDevMainTask extends AWS.ECS.Task<EcsDevMainTask>()(
  17 │   "EcsDevMainTask",
  18 │   {
  19 │     main: import.meta.filename,
  20 │     cpu: 256,
  21 │     memory: 512,
> 22 │     port: 17357,
  23 │     networkMode: "bridge",
  24 │     requiresCompatibilities: ["EC2"],
  25 │     // Docker Hub's `oven/bun` image (also the default); the public.ecr.aws
  26 │     // mirrors rate-limit anonymous pulls during local builds.
  27 │     image: "oven/bun:1",
  28 │     // Build for the host architecture — the emulator runs the container on
  29 │     // this machine, so a cross-arch image would need qemu emulation.
  30 │     runtimePlatform:
  31 │       process.arch === "arm64"
  32 │         ? { cpuArchitecture: "ARM64", operatingSystemFamily: "LINUX" }
  33 │         : { cpuArchitecture: "X86_64", operatingSystemFamily: "LINUX" },
  34 │   },
  35 │   Effect.gen(function* () {
  36 │     return {
  37 │       fetch: Effect.gen(function* () {
  38 │         return HttpServerResponse.text("ecs-dev-main-marker");
  39 │       }),
  40 │     };
  41 │   }),
  42 │ ) {}

0.82 packages/alchemy/test/Fly/fixtures/bindings-sprite.ts:7:3
  5 │ export default class BindingsSprite extends Fly.Sprite<BindingsSprite>()(
  6 │   "BindingsSprite",
> 7 │   { main: import.meta.url, port: 3000 },
  8 │   Effect.succeed({ fetch: Effect.succeed(HttpServerResponse.text("ok")) }),
  9 │ ) {}

0.82 packages/alchemy/test/types/Agent.ts:26:5
  18 │ const _gen = Effect.gen(function* () {
  19 │   // bind the Sandbox Container to the Agent DO
  20 │   const sandbox = yield* Sandbox;
  21 │
  22 │   return Effect.gen(function* () {
  23 │     const state = yield* Cloudflare.DurableObjectState;
  24 │
  25 │     // get the container instance
> 26 │     sandbox.getTcpPort(1080);
  27 │     sandbox.getUser();
  28 │
  29 │     return {
  30 │       getProfile: () => state.storage.get<string>("Profile"),
  31 │     };
  32 │   }).pipe(
  33 │     Effect.provide(
  34 │       Cloudflare.Containers.layer(Sandbox, {
  35 │         enableInternet: true,
  36 │       }),
  37 │     ),
  38 │   );
  39 │ });

0.82 packages/cloudflare-runtime/src/internal/workflows-shared/instance.ts:12:3
   9 │ import type { WorkflowEvent } from "cloudflare:workers";
  10 │
  11 │ export type Instance = {
> 12 │   id: string;
  13 │   created_on: string;
  14 │   modified_on: string;
  15 │   workflow_id: string;
  16 │   version_id: string;
  17 │   status: InstanceStatus;
  18 │   started_on: string | null;
  19 │   ended_on: string | null;
  20 │ };

0.81 packages/alchemy/src/ACME/Certificate.ts:82:5
  64 │   {
  65 │     /** Leaf certificate PEM. */
  66 │     certificate: string;
  67 │     /** Full chain PEM, leaf first. */
  68 │     chain: string;
  69 │     /** PKCS#8 private key PEM. Sensitive; persisted in stack state. */
  70 │     privateKey: Redacted.Redacted<string>;
  71 │     /** Serial number, hex. */
  72 │     serial: string;
  73 │     /** ISO 8601 validity start. */
  74 │     notBefore: string;
  75 │     /** ISO 8601 expiry. Renewal is scheduled against it. */
  76 │     notAfter: string;
  77 │     /** Issuer distinguished name. */
  78 │     issuer: string;
  79 │     /** The DNS names covered. */
  80 │     identifiers: string[];
  81 │     /** The CA's certificate URL. */
> 82 │     certificateUrl: string;
  83 │     /** The CA's order URL. */
  84 │     orderUrl: string;
  85 │     /** Key algorithm of `privateKey`. */
  86 │     keyAlgorithm: KeyAlgorithm;
  87 │     /** The account that issued the certificate. */
  88 │     accountUrl: string;
  89 │     /** The CA the certificate was issued by (for revocation on delete). */
  90 │     directoryUrl: string;
  91 │     /** PEM root trusted for the CA's endpoint (private CAs only). */
  92 │     trustedRoot: string | undefined;
  93 │   },

0.81 packages/alchemy/src/AWS/Budgets/Budget.ts:123:3
  106 │ export interface Budget extends Resource<
  107 │   "AWS.Budgets.Budget",
  108 │   BudgetProps,
  109 │   {
  110 │     /**
  111 │      * Name of the budget.
  112 │      */
  113 │     budgetName: string;
  114 │     /**
  115 │      * The AWS account ID that owns the budget.
  116 │      */
  117 │     accountId: string;
  118 │     /**
  119 │      * ARN of the budget, e.g. `arn:aws:budgets::123456789012:budget/my-budget`.
  120 │      */
  121 │     budgetArn: string;
  122 │   },
> 123 │   never,
  124 │   Providers
  125 │ > {}

0.81 packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts:12:1
   9 │ import type { RegionID } from "../Region.ts";
  10 │ import { createManagedTags, createName, retryConcurrent } from "./common.ts";
  11 │
> 12 │ export type AlarmMuteRuleName = string;
  13 │ export type AlarmMuteRuleArn =
  14 │   `arn:aws:cloudwatch:${RegionID}:${AccountID}:alarm-mute-rule:${string}`;

0.81 packages/alchemy/src/AWS/Cognito/User.ts:186:11
  184 │         reconcile: Effect.fn(function* ({ id, news, olds, output, session }) {
  185 │           const username = output?.username ?? (yield* createName(id, news));
> 186 │           const userPoolId = news.userPoolId;
  187 │           const desiredAttributes = news.attributes ?? {};

0.81 packages/alchemy/src/AWS/CostExplorer/AnomalyEventSource.ts:51:3
  48 │   /** The monitored dimension's value (e.g. the service name). */
  49 │   dimensionValue?: string;
  50 │   /** 12-digit id of the account the anomaly was detected in. */
> 51 │   accountId?: string;
  52 │   /** Name of the account the anomaly was detected in. */
  53 │   accountName?: string;

0.81 packages/alchemy/src/AWS/Deadline/Fleet.ts:421:3
  420 │ const waitForFleetActive = (
> 421 │   farmId: string,
  422 │   fleetId: string,
  423 │   arnOf: (path: string) => string,
  424 │ ) =>

0.81 packages/alchemy/src/AWS/Deadline/Monitor.ts:141:3
  140 │ const readMonitorById = Effect.fn(function* (
> 141 │   monitorId: string,
  142 │   arnOf: (path: string) => string,
  143 │ ) {
  144 │   const described = yield* deadline
  145 │     .getMonitor({ monitorId })
  146 │     .pipe(
  147 │       Effect.catchTag("ResourceNotFoundException", () =>
  148 │         Effect.succeed(undefined),
  149 │       ),
  150 │     );
  151 │   if (!described) return undefined;
  152 │   const monitorArn = arnOf(`monitor/${described.monitorId}`);
  153 │   const state: MonitorState = {
  154 │     described,
  155 │     attrs: {
  156 │       monitorId: described.monitorId,
  157 │       monitorArn,
  158 │       displayName: described.displayName,
  159 │       subdomain: described.subdomain,
  160 │       url: described.url,
  161 │       roleArn: described.roleArn,
  162 │       identityCenterInstanceArn: described.identityCenterInstanceArn,
  163 │       identityCenterApplicationArn: described.identityCenterApplicationArn,
  164 │       tags: yield* fetchDeadlineTags(monitorArn),
  165 │     },
  166 │   };
  167 │   return state;
  168 │ });

0.81 packages/alchemy/src/AWS/DirectoryService/internal.ts:27:1
> 27 │ export const readDirectoryTags = Effect.fn(function* (directoryId: string) {
  28 │   const tags = yield* ds.listTagsForResource
  29 │     .items({ ResourceId: directoryId })
  30 │     .pipe(
  31 │       Stream.runCollect,
  32 │       Effect.catch(() => Effect.succeed([] as ds.Tag[])),
  33 │     );
  34 │   return toTagRecord(Array.from(tags));
  35 │ });

0.81 packages/alchemy/src/AWS/EC2/Network.ts:141:9
  140 │       const subnetCidrs = deriveSubnetCidrs(
> 141 │         props.cidrBlock,
  142 │         availabilityZones.length,
  143 │       );
  144 │       const tags = props.tags;

0.81 packages/alchemy/src/AWS/ECRPublic/Repository.ts:21:1
  18 │ const pin = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  19 │   effect.pipe(Effect.provideService(Region, Effect.succeed(US_EAST_1)));
  20 │
> 21 │ export type RepositoryName = string;
  22 │ export type RepositoryArn =
  23 │   `arn:aws:ecr-public::${AccountID}:repository/${RepositoryName}`;

0.81 packages/alchemy/src/AWS/ECS/Cluster.ts:317:13
  314 │           yield* session.note(clusterArn);
  315 │           return {
  316 │             clusterArn,
> 317 │             clusterName,
  318 │             status: cluster?.status ?? "ACTIVE",
  319 │             settings: news.settings ?? [],
  320 │             configuration: news.configuration,
  321 │             capacityProviders: news.capacityProviders ?? [],
  322 │             defaultCapacityProviderStrategy:
  323 │               news.defaultCapacityProviderStrategy ?? [],
  324 │             serviceConnectDefaults: news.serviceConnectDefaults,
  325 │             tags: desiredTags,
  326 │           };

0.81 packages/alchemy/src/AWS/Lambda/MicrovmBundle.ts:28:3
  25 │ export const buildMicrovmDockerfile = (
  26 │   userDockerfile: string | undefined,
  27 │   runtime: "bun" | "node",
> 28 │   port: number,
  29 │ ): string => {
  30 │   const base = userDockerfile?.trim() ?? `FROM ${MICROVM_BASE_DOCKER_IMAGE}`;
  31 │   const installRuntime =
  32 │     runtime === "bun"
  33 │       ? // `bun.sh/install` unpacks a zip, so the minimal MicroVM base needs
  34 │         // `unzip` (and `tar`) present before the installer runs.
  35 │         "RUN dnf install -y unzip tar && curl -fsSL https://bun.sh/install | bash && ln -s /root/.bun/bin/bun /usr/local/bin/bun && dnf clean all"
  36 │       : "RUN dnf install -y nodejs && dnf clean all";
  37 │   const runtimeBin = runtime === "bun" ? "bun" : "node";
  38 │   return [
  39 │     base,
  40 │     "",
  41 │     installRuntime,
  42 │     "WORKDIR /app",
  43 │     // The entry (`index.mjs`) and every rolldown chunk are emitted with a
  44 │     // `.mjs` extension, which Node always treats as ESM — so the entry's named
  45 │     // imports of a chunk resolve without needing a `package.json` `"type"`
  46 │     // marker (which would risk clobbering a user-provided base image's file).
  47 │     "COPY *.mjs /app/",
  48 │     `EXPOSE ${port}`,
  49 │     `ENV PORT=${port}`,
  50 │     `ENTRYPOINT ["${runtimeBin}", "/app/index.mjs"]`,
  51 │     "",
  52 │   ].join("\n");
  53 │ };

0.81 packages/alchemy/src/AWS/MailManager/Relay.ts:60:3
  49 │ export interface Relay extends Resource<
  50 │   "AWS.MailManager.Relay",
  51 │   RelayProps,
  52 │   {
  53 │     /** Server-assigned ID of the relay. */
  54 │     relayId: string;
  55 │     /** ARN of the relay. */
  56 │     relayArn: string;
  57 │     /** Name of the relay. */
  58 │     relayName: string;
  59 │   },
> 60 │   never,
  61 │   Providers
  62 │ > {}

0.81 packages/alchemy/src/AWS/MemoryDB/Cluster.ts:340:11
  339 │         read: Effect.fn(function* ({ id, olds, output }) {
> 340 │           const name =
  341 │             output?.clusterName ?? (yield* toName(id, olds ?? { aclName: "" }));
  342 │           const cluster = yield* readCluster(name);
  343 │           if (!cluster?.ARN) return undefined;
  344 │           const attrs = yield* toAttrs(cluster);
  345 │           return (yield* hasAlchemyTags(id, attrs.tags))
  346 │             ? attrs
  347 │             : Unowned(attrs);
  348 │         }),

0.81 packages/alchemy/src/AWS/NeptuneGraph/Graph.ts:202:7
> 202 │       const getGraph = Effect.fn(function* (graphId: string) {
  203 │         return yield* neptunegraph
  204 │           .getGraph({ graphIdentifier: graphId })
  205 │           .pipe(
  206 │             Effect.catchTag("ResourceNotFoundException", () =>
  207 │               Effect.succeed(undefined),
  208 │             ),
  209 │           );
  210 │       });

0.81 packages/alchemy/src/AWS/OSIS/PipelineEndpoint.ts:45:5
  38 │ export interface PipelineEndpoint extends Resource<
  39 │   "AWS.OSIS.PipelineEndpoint",
  40 │   PipelineEndpointProps,
  41 │   {
  42 │     /**
  43 │      * Id of the pipeline endpoint (`pe-…`), assigned by OSIS on create.
  44 │      */
> 45 │     endpointId: string;
  46 │     /**
  47 │      * ARN of the pipeline the endpoint ingests into.
  48 │      */
  49 │     pipelineArn: string;
  50 │     /**
  51 │      * Endpoint status (e.g. `ACTIVE`, `CREATING`, `REVOKED`).
  52 │      */
  53 │     status: string;
  54 │     /**
  55 │      * Id of the VPC the endpoint lives in.
  56 │      */
  57 │     vpcId: string | undefined;
  58 │     /**
  59 │      * The VPC-private ingest URL for the endpoint.
  60 │      */
  61 │     ingestEndpointUrl: string | undefined;
  62 │   },
  63 │   never,
  64 │   Providers
  65 │ > {}

0.81 packages/alchemy/src/AWS/VerifiedPermissions/IdentitySource.ts:81:9
  72 │   tokenSelection:
  73 │     | {
  74 │         /** Consume OIDC access tokens. */
  75 │         accessTokenOnly: {
  76 │           /** The claim to derive the principal entity ID from. @default "sub" */
  77 │           principalIdClaim?: string;
  78 │           /** The `aud` values to accept tokens for. */
  79 │           audiences?: string[];
  80 │         };
> 81 │         identityTokenOnly?: never;
  82 │       }
  83 │     | {
  84 │         accessTokenOnly?: never;
  85 │         /** Consume OIDC identity (ID) tokens. */
  86 │         identityTokenOnly: {
  87 │           /** The claim to derive the principal entity ID from. @default "sub" */
  88 │           principalIdClaim?: string;
  89 │           /** The client IDs (`aud`) to accept tokens for. */
  90 │           clientIds?: string[];
  91 │         };
  92 │       };

0.81 packages/alchemy/src/AWS/VpcLattice/TargetGroup.ts:321:9
  320 │       const syncTargets = Effect.fn(function* (
> 321 │         targetGroupId: string,
  322 │         desired: TargetGroupTarget[],
  323 │       ) {

0.81 packages/alchemy/src/Axiom/Dataset.ts:81:3
> 81 │   never,
  82 │   Providers
  83 │ >;

0.81 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:49:3
  46 │ export const getIdp = (
  47 │   zoneId: string | undefined,
  48 │   accountId: string,
> 49 │   identityProviderId: string,
  50 │ ) =>
  51 │   (zoneId !== undefined
  52 │     ? zeroTrust.getIdentityProviderForZone({ zoneId, identityProviderId })
  53 │     : zeroTrust.getIdentityProviderForAccount({ accountId, identityProviderId })
  54 │   ).pipe(
  55 │     Effect.map((idp): ObservedIdp | undefined => idp as ObservedIdp),
  56 │     Effect.catchTag("AccessIdentityProviderNotFound", () =>
  57 │       Effect.succeed(undefined),
  58 │     ),
  59 │   );

0.81 packages/alchemy/src/Cloudflare/Access/Policy.ts:501:3
  498 │ // of fields we care about, but typed wider than `ObservedPolicy`. Narrow at
  499 │ // the API boundary so the rest of the reconciler stays in our shape.
  500 │ type RawPolicy = {
> 501 │   id?: string | null;
  502 │   name?: string | null;
  503 │   decision?: PolicyDecision | null | string;
  504 │   createdAt?: string | null;
  505 │   updatedAt?: string | null;
  506 │ };

0.81 packages/alchemy/src/Cloudflare/Access/ServiceToken.ts:251:13
  248 │       if (!observed || !observed.id) {
  249 │         const created = yield* zeroTrust
  250 │           .createAccessServiceTokenForAccount({
> 251 │             accountId: acct,
  252 │             name,
  253 │             duration: news.duration,
  254 │             clientSecretVersion: news.clientSecretVersion,
  255 │             previousClientSecretExpiresAt: news.previousClientSecretExpiresAt,
  256 │           })
  257 │           .pipe(
  258 │             Effect.catch((err) =>
  259 │               Effect.gen(function* () {
  260 │                 const existing = yield* findTokenByName(acct, name);
  261 │                 if (existing && existing.id) return existing;
  262 │                 return yield* Effect.fail(err);
  263 │               }),
  264 │             ),
  265 │           );

0.81 packages/alchemy/src/Cloudflare/Account/Account.ts:101:3
   97 │ export type Account = Resource<
   98 │   TypeId,
   99 │   AccountProps,
  100 │   AccountAttributes,
> 101 │   never,
  102 │   Providers
  103 │ >;

0.81 packages/alchemy/src/Cloudflare/AI/GatewayProvider.ts:89:3
  86 │   /**
  87 │    * The Secrets Store secret holding the gateway provider API key.
  88 │    */
> 89 │   secretId: string;

0.81 packages/alchemy/src/Cloudflare/Devices/ManagedNetwork.ts:52:3
  50 │ export type DeviceManagedNetworkAttributes = {
  51 │   /** API UUID of the managed network. */
> 52 │   networkId: string;
  53 │   /** Account that owns the managed network. */
  54 │   accountId: string;
  55 │   /** Observed network name. */
  56 │   name: string;
  57 │   /** The type of managed network — always `tls`. */
  58 │   type: "tls";
  59 │   /** Observed TLS detection configuration. */
  60 │   config: DeviceManagedNetworkConfig;
  61 │ };

0.81 packages/alchemy/src/Cloudflare/DNS/ZoneTransferIncoming.ts:21:3
  15 │ export interface ZoneTransferIncomingProps {
  16 │   /**
  17 │    * Secondary zone whose incoming transfer configuration is managed.
  18 │    * Stable — the configuration is a per-zone singleton, so changing the
  19 │    * zone triggers a replacement.
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Zone name (e.g. `example.com.`).
  24 │    *
  25 │    * Mutable — updated in place (PUT).
  26 │    */
  27 │   name: string;
  28 │   /**
  29 │    * Peers (by id) Cloudflare transfers the zone in from. Reference
  30 │    * {@link ZoneTransferPeer} resources via their `peerId` attribute.
  31 │    *
  32 │    * Mutable — updated in place (PUT).
  33 │    */
  34 │   peers: string[];
  35 │   /**
  36 │    * How often (seconds) the secondary zone auto-refreshes regardless of
  37 │    * DNS NOTIFY.
  38 │    *
  39 │    * Mutable — updated in place (PUT).
  40 │    */
  41 │   autoRefreshSeconds: number;
  42 │ }

0.81 packages/alchemy/src/Cloudflare/DNS/ZoneTransferOutgoing.ts:21:3
> 21 │   zoneId: string;

0.81 packages/alchemy/src/Cloudflare/DNS/ZoneTransferTsig.ts:45:3
  41 │ export interface ZoneTransferTsigAttributes {
  42 │   /** Identifier of the TSIG. */
  43 │   tsigId: string;
  44 │   /** The Cloudflare account the TSIG belongs to. */
> 45 │   accountId: string;
  46 │   /** TSIG key name. */
  47 │   name: string;
  48 │   /** TSIG algorithm. */
  49 │   algo: string;
  50 │ }

0.81 packages/alchemy/src/Cloudflare/Email/BlockSender.ts:43:3
  39 │ export interface BlockSenderAttributes {
  40 │   /** Cloudflare-assigned blocked sender pattern identifier. */
  41 │   blockSenderId: string;
  42 │   /** The account the entry belongs to. */
> 43 │   accountId: string;
  44 │   /** The blocked pattern. */
  45 │   pattern: string;
  46 │   /** Type of pattern matching. */
  47 │   patternType: PatternType;
  48 │   /** Whether the pattern is a regular expression. */
  49 │   isRegex: boolean;
  50 │   /** Free-form notes about the entry, if set. */
  51 │   comments: string | undefined;
  52 │   /** ISO8601 creation timestamp. */
  53 │   createdAt: string;
  54 │   /** ISO8601 last-modified timestamp, if the entry has been modified. */
  55 │   modifiedAt: string | undefined;
  56 │ }

0.81 packages/alchemy/src/Cloudflare/Email/Rule.ts:58:5
  54 │ export type Rule = Resource<
  55 │   "Cloudflare.Email.Rule",
  56 │   RuleProps,
  57 │   {
> 58 │     ruleId: string;
  59 │     zoneId: string;
  60 │     name: string;
  61 │     enabled: boolean;
  62 │     priority: number;
  63 │     matchers: Matcher[];
  64 │     actions: Action[];
  65 │   },
  66 │   never,
  67 │   Providers
  68 │ >;

0.81 packages/alchemy/src/Cloudflare/Iam/UserGroup.ts:82:3
  72 │ export interface UserGroupAttributes {
  73 │   /** Cloudflare-assigned identifier of the user group. */
  74 │   userGroupId: string;
  75 │   /** The Cloudflare account the user group belongs to. */
  76 │   accountId: string;
  77 │   /** Name of the user group. */
  78 │   name: string;
  79 │   /** Policies attached to the user group (with server-assigned ids). */
  80 │   policies: UserGroupPolicy[];
  81 │   /** ISO8601 creation timestamp. */
> 82 │   createdOn: string;
  83 │   /** ISO8601 last-modified timestamp. */
  84 │   modifiedOn: string;
  85 │ }

0.81 packages/alchemy/src/Cloudflare/Intel/IndicatorFeedPermission.ts:19:3
  14 │ export interface IndicatorFeedPermissionProps {
  15 │   /**
  16 │    * The ID of the indicator feed to grant access to — e.g. `feed.feedId`.
  17 │    * Immutable — changing it triggers a replacement.
  18 │    */
> 19 │   feedId: number;
  20 │   /**
  21 │    * The Cloudflare account tag of the consumer account being granted
  22 │    * access to the feed. Immutable — changing it triggers a replacement.
  23 │    */
  24 │   accountTag: string;
  25 │ }

0.81 packages/alchemy/src/Cloudflare/LoadBalancer/LoadBalancer.ts:183:3
  179 │ export type LoadBalancer = Resource<
  180 │   TypeId,
  181 │   Props,
  182 │   Attributes,
> 183 │   never,
  184 │   Providers
  185 │ >;

0.81 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CloudIntegration.ts:91:3
   89 │ export interface CloudIntegrationAttributes {
   90 │   /** Cloudflare-assigned identifier of the integration. */
>  91 │   integrationId: string;
   92 │   /** The Cloudflare account the integration belongs to. */
   93 │   accountId: string;
   94 │   /** The cloud provider this integration connects to. */
   95 │   cloudType: CloudIntegrationCloudType;
   96 │   /** Human readable name of the integration. */
   97 │   friendlyName: string;
   98 │   /** Free-form description, if set. */
   99 │   description: string | undefined;
  100 │   /** Lifecycle state (`PENDING_SETUP` until credentials are wired). */
  101 │   lifecycleState: CloudIntegrationLifecycleState;
  102 │   /** State of the most recent discovery run. */
  103 │   state: CloudIntegrationState;
  104 │   /** AWS IAM role ARN used for discovery, if wired. */
  105 │   awsArn: string | undefined;
  106 │   /** Azure subscription being discovered, if wired. */
  107 │   azureSubscriptionId: string | undefined;
  108 │   /** Azure tenant of the subscription, if wired. */
  109 │   azureTenantId: string | undefined;
  110 │   /** GCP project being discovered, if wired. */
  111 │   gcpProjectId: string | undefined;
  112 │   /** GCP service account email used for discovery, if wired. */
  113 │   gcpServiceAccountEmail: string | undefined;
  114 │   /** ISO8601 timestamp of the last change to the integration. */
  115 │   lastUpdated: string;
  116 │ }

0.81 packages/alchemy/src/Cloudflare/MagicCloudNetworking/OnRamp.ts:302:7
  301 │     read: Effect.fn(function* ({ id, output, olds }) {
> 302 │       const { accountId } = yield* yield* CloudflareEnvironment;
  303 │       const acct = output?.accountId ?? accountId;
  304 │       const destroyOnDelete =
  305 │         output?.destroyOnDelete ?? olds?.destroyOnDelete ?? false;
  306 │
  307 │       // Owned path: refresh by our persisted on-ramp id.
  308 │       if (output?.onRampId) {
  309 │         const observed = yield* getOnRamp(acct, output.onRampId);
  310 │         if (observed) return toAttributes(observed, acct, destroyOnDelete);
  311 │         return undefined;
  312 │       }
  313 │
  314 │       // Cold read — recover from lost state by matching the deterministic
  315 │       // physical name. On-ramps carry no ownership markers, so report a
  316 │       // match as Unowned and let the engine gate adoption.
  317 │       const name = yield* onRampName(id, olds?.name);
  318 │       const match = yield* findByName(acct, name);
  319 │       return match
  320 │         ? Unowned(toAttributes(match, acct, destroyOnDelete))
  321 │         : undefined;
  322 │     }),

0.81 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Config.ts:21:3
  17 │ export interface WarpDevice {
  18 │   /**
  19 │    * Unique identifier of the WARP device.
  20 │    */
> 21 │   id: string;
  22 │   /**
  23 │    * Display name of the WARP device.
  24 │    */
  25 │   name: string;
  26 │   /**
  27 │    * IPv4 address the WARP device sends flow data from.
  28 │    */
  29 │   routerIp: string;
  30 │ }

0.81 packages/alchemy/src/Cloudflare/Organization/Organization.ts:125:3
  121 │ export type Organization = Resource<
  122 │   TypeId,
  123 │   Props,
  124 │   Attributes,
> 125 │   never,
  126 │   Providers
  127 │ >;

0.81 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameAssociation.ts:35:3
  30 │ export type HostnameAssociationProps = {
  31 │   /**
  32 │    * Zone the hostname belongs to. Cannot be changed — updating this property
  33 │    * triggers a replacement.
  34 │    */
> 35 │   zoneId: string;
  36 │   /**
  37 │    * The hostname on the origin for which the client certificate will be
  38 │    * presented. Must be a hostname of the zone. This is the association's
  39 │    * identity — updating it triggers a replacement (the old hostname's
  40 │    * association is voided).
  41 │    */
  42 │   hostname: string;
  43 │   /**
  44 │    * Identifier of the hostname client certificate
  45 │    * ({@link HostnameCertificate}) presented to the origin
  46 │    * for this hostname. Required by Cloudflare for every hostname AOP
  47 │    * configuration. Mutable — updated in place.
  48 │    */
  49 │   certId: string;
  50 │   /**
  51 │    * Whether hostname-level Authenticated Origin Pulls is enabled for this
  52 │    * hostname. Mutable — updated in place. On destroy the association is
  53 │    * voided (Cloudflare's `enabled: null`), restoring the hostname to
  54 │    * zone-level behavior.
  55 │    */
  56 │   enabled: boolean;
  57 │ };

0.81 packages/alchemy/src/Cloudflare/Pages/Deployment.ts:201:7
  200 │     list: Effect.fn(function* () {
> 201 │       const { accountId } = yield* yield* CloudflareEnvironment;

0.81 packages/alchemy/src/Cloudflare/Vectorize/VectorizeIndex.ts:281:9
  272 │ const buildConfig = (
  273 │   news: IndexProps,
  274 │ ): vectorize.CreateIndexRequest["config"] =>
  275 │   news.preset !== undefined
  276 │     ? // `Preset` is intentionally open (`| (string & {})`) so
  277 │       // new Cloudflare presets aren't blocked by stale types. The
  278 │       // distilled type is the strict-at-release-time union; cast
  279 │       // through for the API call.
  280 │       ({
> 281 │         preset: news.preset as never,
  282 │       } as vectorize.CreateIndexRequest["config"])
  283 │     : {
  284 │         dimensions: news.dimensions!,
  285 │         metric: news.metric ?? DEFAULT_METRIC,
  286 │       };

0.81 packages/alchemy/src/Cloudflare/Vectorize/VectorizeMetadataIndex.ts:37:3
  33 │ export type MetadataIndexAttributes = {
  34 │   propertyName: string;
  35 │   indexType: MetadataIndexType;
  36 │   indexName: string;
> 37 │   accountId: string;
  38 │   mutationId: string | undefined;
  39 │ };

0.81 packages/alchemy/src/Docker/ServiceImage.ts:32:3
  28 │ export interface BundledServiceSource {
  29 │   main: string;
  30 │   image?: string;
  31 │   handler?: string;
> 32 │   port?: number;
  33 │   /**
  34 │    * Bundler configuration for `main`. Unused code is tree-shaken.
  35 │    * `effect`, alchemy, and `@distilled.cloud` are marked pure so unused
  36 │    * parts prune more aggressively. List extra packages with
  37 │    * `pure.packages`, or disable with `pure: false`.
  38 │    */
  39 │   build?: Bundle.BundleConfig;
  40 │ }

0.81 packages/alchemy/src/Neon/DataApi.ts:21:7
  18 │ export type DataApiProps = (
  19 │   | {
  20 │       /** Branch resource or explicit identity, optionally carrying its selected database. */
> 21 │       branch: { projectId: string; branchId: string; databaseName?: string };
  22 │       project?: never;
  23 │     }
  24 │   | {
  25 │       /** Project resource or explicit identity; selects the observed default branch. */
  26 │       project: { projectId: string; databaseName?: string };
  27 │       branch?: never;
  28 │     }
  29 │ ) & {
  30 │   /** Database served by PostgREST. Infers the referenced resource's selected database, or the branch's only database; required when ambiguous. */
  31 │   database?: string;
  32 │   /** Authentication mechanism. Changes replace the Data API. */
  33 │   authProvider?: "neon_auth" | "external";
  34 │   /** HTTPS JWKS endpoint required for external authentication. */
  35 │   jwksUrl?: string;
  36 │   /** Display name for an external authentication provider. */
  37 │   providerName?: string;
  38 │   /** Expected JWT audience. Neon still accepts tokens without an audience. */
  39 │   jwtAudience?: string;
  40 │   /** Opt in to public-schema table grants. Defaults to false. */
  41 │   addDefaultGrants?: boolean;
  42 │   /** Skip creating the auth schema and RLS helpers. */
  43 │   skipAuthSchema?: boolean;
  44 │   /** Explicitly owned PostgREST settings. Removing previously managed fields requires an explicit reset value. */
  45 │   settings?: Neon.DataAPISettings;
  46 │ };

0.81 packages/alchemy/src/Neon/FunctionProvider.ts:23:3
  19 │ export class FunctionDeploymentFailed extends Data.TaggedError(
  20 │   "FunctionDeploymentFailed",
  21 │ )<{
  22 │   slug: string;
> 23 │   deploymentId: number;
  24 │   status: string;
  25 │   message?: string;
  26 │ }> {}

0.81 packages/alchemy/src/Prisma/Internal/DeploymentIdentity.ts:10:3
   8 │ /** Prove that a deployment belongs to an App before mutating or deleting it. */
   9 │ export const ensureDeploymentMembership = Effect.fn(function* (
> 10 │   appId: string,
  11 │   deployment: { id: string; foundryVersionId: string },
  12 │   knownLatestDeploymentId?: string | null,
  13 │ ) {

0.81 packages/alchemy/src/Railway/Bucket.ts:102:5
   99 │   BucketProps,
  100 │   {
  101 │     /** Railway bucket id. */
> 102 │     bucketId: string;
  103 │     /** Display name (unique per project). */
  104 │     name: string;

0.81 packages/alchemy/src/Railway/Group.ts:181:5
  172 │ export type Group = Resource<
  173 │   "Railway.Group",
  174 │   GroupProps,
  175 │   {
  176 │     /** Railway group id (EnvironmentConfig key / Group.id). */
  177 │     groupId: string;
  178 │     /** Parent Railway project id. */
  179 │     projectId: string;
  180 │     /** Environment whose canvas this group is on. */
> 181 │     environmentId: string;
  182 │     /** Canvas group name. */
  183 │     name: string;
  184 │     /** Canvas color, if set. */
  185 │     color: string | undefined;
  186 │     /** Canvas icon, if set. */
  187 │     icon: string | undefined;
  188 │     /** Whether the group is collapsed on the canvas. */
  189 │     collapsed: boolean;
  190 │     /** Member service ids (`Service.groupId` / Postgres / Redis / …). */
  191 │     serviceIds: string[];
  192 │     /** Member volume ids. */
  193 │     volumeIds: string[];
  194 │     /** Member bucket ids (`Bucket.groupId`). */
  195 │     bucketIds: string[];
  196 │   },
  197 │   never,
  198 │   Providers
  199 │ >;

0.81 packages/alchemy/src/Railway/PrivateNetwork.ts:162:5
  147 │ export type PrivateNetwork = Resource<
  148 │   "Railway.PrivateNetwork",
  149 │   PrivateNetworkProps,
  150 │   {
  151 │     /** Railway public network id (string identity used by endpoint APIs). */
  152 │     publicId: string;
  153 │     /** Private-networking setting to restore when this resource is removed. */
  154 │     previousPrivateNetworkDisabled?: boolean;
  155 │     /** Numeric WireGuard network id, as a decimal string. */
  156 │     networkId: string;
  157 │     /** Physical network name (unique per environment). */
  158 │     name: string;
  159 │     /** Network DNS label reported by Railway. */
  160 │     dnsName: string;
  161 │     /** Parent Railway project id. */
> 162 │     projectId: string;
  163 │     /** Environment the network lives in. */
  164 │     environmentId: string;
  165 │     /** Observed tags. */
  166 │     tags: string[];
  167 │     /** RFC3339 creation timestamp, if Railway reported one. */
  168 │     createdAt: string | undefined;
  169 │   },
  170 │   never,
  171 │   Providers
  172 │ >;

0.81 packages/alchemy/src/Railway/Service.ts:242:5
  239 │   ServiceProps,
  240 │   {
  241 │     /** Railway service id. */
> 242 │     serviceId: string;
  243 │     /** Physical service name (unique per project). */
  244 │     name: string;

0.81 packages/alchemy/src/Railway/VolumeBackup.ts:321:3
  318 │ class VolumeBackupPending extends Data.TaggedError(
  319 │   "Railway.VolumeBackupPending",
  320 │ )<{
> 321 │   volumeInstanceId: string;
  322 │   state: string;
  323 │ }> {}

0.81 packages/alchemy/src/State/HttpStateStore.ts:141:9
  138 │       set: <V extends PersistedState>(request: {
  139 │         stack: string;
  140 │         stage: string;
> 141 │         fqn: string;
  142 │         value: V;
  143 │       }) =>
  144 │         state
  145 │           .setState({
  146 │             params: {
  147 │               stack: request.stack,
  148 │               stage: request.stage,
  149 │               fqn: encodeURIComponent(request.fqn),
  150 │             },
  151 │             payload: encodeState(request.value),
  152 │           })
  153 │           .pipe(
  154 │             // Server echoes the stored value, but the client already
  155 │             // has the canonical object (including any Redacted<T>
  156 │             // instances); returning the input avoids a lossy round-trip.
  157 │             Effect.map(() => request.value),
  158 │             mapStateStoreError,
  159 │           ),

0.81 packages/alchemy/src/Stripe/AppsSecret.ts:41:3
  30 │ export interface AppsSecretScope {
  31 │   /**
  32 │    * The secret scope type. `account` secrets are shared by all Dashboard
  33 │    * users and the app backend. `user` secrets are visible to the app
  34 │    * backend and one Dashboard user.
  35 │    */
  36 │   type: AppsSecretScopeType;
  37 │   /**
  38 │    * The user ID. Required when `type` is `user`, and must not be set when
  39 │    * `type` is `account`.
  40 │    */
> 41 │   user?: string;
  42 │ }

0.81 packages/alchemy/src/Stripe/CreditGrant.ts:107:3
> 107 │   customer?: string;

0.81 packages/alchemy/src/Stripe/RadarValueList.ts:83:5
   78 │ export type RadarValueList = Resource<
   79 │   "Stripe.RadarValueList",
   80 │   RadarValueListProps,
   81 │   {
   82 │     /** Stripe Radar value list id (`rsl_…`). */
>  83 │     id: string;
   84 │     /** Alias used to reference this list in Radar rules. */
   85 │     alias: string;
   86 │     /** Human-readable name shown in the Stripe Dashboard. */
   87 │     name: string;
   88 │     /** Type of items stored in this list. */
   89 │     itemType: RadarValueListItemType;
   90 │     /** Name or email of the user who created this list. */
   91 │     createdBy: string;
   92 │     /** User-defined metadata (Alchemy ownership keys stripped). */
   93 │     metadata: Record<string, string>;
   94 │     /** Unix timestamp when the list was created. */
   95 │     created: number;
   96 │     /** Whether the list exists in live mode. */
   97 │     livemode: boolean;
   98 │   },
   99 │   never,
  100 │   Providers
  101 │ >;

0.81 packages/alchemy/src/Telemetry/Attributes.ts:21:3
  20 │ export interface TelemetryAttributes {
> 21 │   readonly "alchemy.user.id": string;
  22 │   readonly "alchemy.session.id": string;
  23 │   readonly "alchemy.version": string;
  24 │   readonly "alchemy.git.root_commit": string;
  25 │   readonly "alchemy.git.origin_hash": string;
  26 │   readonly "alchemy.git.branch_hash": string;
  27 │   readonly "alchemy.runtime.name": string;
  28 │   readonly "alchemy.runtime.version": string;
  29 │   readonly "alchemy.ci.provider": string;
  30 │   readonly "alchemy.ci": boolean;
  31 │   readonly "host.arch": string;
  32 │   readonly "os.type": string;
  33 │   readonly "os.version": string;
  34 │   readonly "host.cpus": number;
  35 │   readonly "host.memory_mb": number;
  36 │ }

0.81 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:201:13
  199 │         if (request.method === "POST" && pathname === "/deregister") {
  200 │           const result = yield* deregisterTargets({
> 201 │             Targets: [{ Id: testTargetIp, Port: 80, AvailabilityZone: "all" }],
  202 │           }).pipe(Effect.result);
  203 │           return yield* HttpServerResponse.json({
  204 │             ok: result._tag === "Success",
  205 │             tag: result._tag === "Failure" ? result.failure._tag : "Success",
  206 │           });
  207 │         }

0.81 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:21:1
> 21 │ const MISSING_PARTICIPANT_ID = "abcDEF123456";
  22 │ /** A well-formed stage session id that does not exist. */
  23 │ const MISSING_SESSION_ID = "st-0000AbCd0000";

0.81 packages/alchemy/test/Cloudflare/Container/fixtures/attachment/worker.ts:4:3
  1 │ import { Container, getContainer } from "@cloudflare/containers";
  2 │
  3 │ export class AttachmentContainerObject extends Container {
> 4 │   defaultPort = 8080;
  5 │ }

0.81 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:33:7
  32 │     const env = JSON.parse(yield* get("/env")) as {
> 33 │       DATABASE_URL: string;
  34 │       databaseUrlCount?: number;
  35 │     };
  36 │     const databaseUrl = new URL(env.DATABASE_URL);

0.81 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:80:7
  78 │     const userMatch = url.pathname.match(/^\/users\/(\d+)$/);
  79 │     if (request.method === "GET" && userMatch) {
> 80 │       const id = Number(userMatch[1]);
  81 │       const row = yield* db
  82 │         .prepare("SELECT id, name FROM users WHERE id = ? AND style = ?")
  83 │         .bind(id, style)
  84 │         .first<{ id: number; name: string }>();
  85 │       return yield* HttpServerResponse.json({ row });
  86 │     }

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:831:25
  813 │               const fiber = yield* storage
  814 │                 .transaction(
  815 │                   Effect.gen(function* () {
  816 │                     yield* transactionalWrites;
  817 │                     yield* storage.getAlarm();
  818 │                     yield* Deferred.succeed(entered, undefined);
  819 │                     yield* Effect.never.pipe(
  820 │                       Effect.timeout("5 seconds"),
  821 │                       Effect.orDie,
  822 │                     );
  823 │                   }).pipe(
  824 │                     Effect.ensuring(
  825 │                       Effect.gen(function* () {
  826 │                         yield* Deferred.succeed(cleanupStarted, undefined);
  827 │                         yield* Deferred.await(releaseCleanup).pipe(
  828 │                           Effect.timeout("2 seconds"),
  829 │                           Effect.orDie,
  830 │                         );
> 831 │                         yield* storage.put("cleanupWrite", "rolled-back");
  832 │                         yield* Ref.set(cleaned, true);
  833 │                       }),
  834 │                     ),
  835 │                   ),
  836 │                 )
  837 │                 .pipe(Effect.forkScoped);

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:15:5
  12 │ export class Counter extends Cloudflare.DurableObject<
  13 │   Counter,
  14 │   {
> 15 │     incrementD1: (key: string) => Effect.Effect<number, never, RuntimeContext>;
  16 │     getD1: (key: string) => Effect.Effect<number, never, RuntimeContext>;
  17 │     incrementDO: () => Effect.Effect<number, never, RuntimeContext>;
  18 │     getDO: () => Effect.Effect<number, never, RuntimeContext>;
  19 │     reset: (key: string) => Effect.Effect<void, never, RuntimeContext>;
  20 │   }
  21 │ >()("Counter") {}

0.81 packages/alchemy/test/Fly/fixtures/bluegreen-secrets.ts:18:5
  14 │   {
  15 │     app: Site,
  16 │     main: import.meta.url,
  17 │     count: 2,
> 18 │     port: 3000,
  19 │     deploy: { strategy: "bluegreen", healthTimeout: "60 seconds" },
  20 │     shutdown: { timeout: "10 seconds" },
  21 │     services: [
  22 │       {
  23 │         protocol: "tcp",
  24 │         internalPort: 3000,
  25 │         autostop: "off",
  26 │         ports: [{ port: 80, handlers: ["http"] }],
  27 │         checks: [
  28 │           {
  29 │             type: "http",
  30 │             port: 3000,
  31 │             path: "/ready",
  32 │             interval: "2s",
  33 │             timeout: "1s",
  34 │           },
  35 │         ],
  36 │       },
  37 │     ],
  38 │   },

0.81 packages/alchemy/test/Fly/fixtures/bluegreen.ts:13:5
  10 │ export const checks = {
  11 │   ready: {
  12 │     type: "http" as const,
> 13 │     port: 80,
  14 │     path: "/",
  15 │     interval: "2s",
  16 │     timeout: "1s",
  17 │   },
  18 │ };

0.81 packages/cloudflare-runtime/src/core/bindings/images/ImagesOptions.shared.ts:39:1
> 39 │ export const IMAGES_STORE_NAMESPACE = "images-data";

0.81 packages/pkg/src/Registry/Bindings.ts:55:5
  44 │ export const Settings = Schema.Struct({
  45 │   policy: Policy,
  46 │   /**
  47 │    * Hostname to package scope. Requests on an aliased host resolve an
  48 │    * unscoped name under that scope, so `pkg.distilled.cloud/core/<sha>`
  49 │    * serves `@distilled.cloud/core`.
  50 │    */
  51 │   aliases: Schema.Record(Schema.String, Schema.String),
  52 │   /** Cron expression for the expiry sweep. */
  53 │   cron: Schema.String,
  54 │   github: Schema.Struct({
> 55 │     apiUrl: Schema.String,
  56 │   }),
  57 │ });
  58 │ export type Settings = typeof Settings.Type;

0.80 packages/alchemy/src/AWS/AutoScaling/LifecycleHook.ts:286:13
  283 │           // API. It overwrites the whole hook configuration, so we issue it
  284 │           // unconditionally (idempotent on matching params).
  285 │           yield* autoscaling.putLifecycleHook({
> 286 │             LifecycleHookName: lifecycleHookName,
  287 │             AutoScalingGroupName: autoScalingGroupName,
  288 │             LifecycleTransition: normalizeTransition(news.lifecycleTransition),
  289 │             HeartbeatTimeout: toSeconds(news.heartbeatTimeout),
  290 │             DefaultResult: news.defaultResult,
  291 │             NotificationTargetARN: news.notificationTargetARN,
  292 │             RoleARN: news.roleARN,
  293 │             NotificationMetadata: news.notificationMetadata,
  294 │           } as any);

0.80 packages/alchemy/src/AWS/B2BI/Partnership.ts:68:3
  47 │ export interface Partnership extends Resource<
  48 │   "AWS.B2BI.Partnership",
  49 │   PartnershipProps,
  50 │   {
  51 │     /**
  52 │      * Service-assigned unique ID of the partnership.
  53 │      */
  54 │     partnershipId: string;
  55 │     /**
  56 │      * ARN of the partnership.
  57 │      */
  58 │     partnershipArn: string;
  59 │     /**
  60 │      * ID of the profile the partnership belongs to.
  61 │      */
  62 │     profileId: string;
  63 │     /**
  64 │      * Service-assigned ID of the trading partner.
  65 │      */
  66 │     tradingPartnerId: string | undefined;
  67 │   },
> 68 │   never,
  69 │   Providers
  70 │ > {}

0.80 packages/alchemy/src/AWS/CloudFront/Distribution.ts:1081:19
  1076 │               Effect.catchTag(
  1077 │                 "InvalidArgument",
  1078 │                 (
  1079 │                   error,
  1080 │                 ): Effect.Effect<
> 1081 │                   never,
  1082 │                   | cloudfront.InvalidArgument
  1083 │                   | DistributionFunctionAssociationPending
  1084 │                 > =>
  1085 │                   isFunctionAssociationPending(error)
  1086 │                     ? Effect.logInfo(
  1087 │                         "CloudFront Distribution reconcile: function association not yet ready, retrying",
  1088 │                       ).pipe(
  1089 │                         Effect.andThen(
  1090 │                           Effect.fail(
  1091 │                             new DistributionFunctionAssociationPending({
  1092 │                               message:
  1093 │                                 error.message ??
  1094 │                                 "CloudFront function association pending",
  1095 │                             }),
  1096 │                           ),
  1097 │                         ),
  1098 │                       )
  1099 │                     : Effect.fail(error),
  1100 │               ),

0.80 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:222:7
> 222 │       const readDashboard = Effect.fn(function* (dashboardName: string) {
  223 │         const output = yield* cloudwatch
  224 │           .getDashboard({
  225 │             DashboardName: dashboardName,
  226 │           })
  227 │           .pipe(
  228 │             Effect.catchTag("DashboardNotFoundError", () =>
  229 │               Effect.succeed(undefined),
  230 │             ),
  231 │           );
  232 │
  233 │         if (!output?.DashboardName) {
  234 │           return undefined;
  235 │         }
  236 │
  237 │         return {
  238 │           dashboardName: output.DashboardName,
  239 │           dashboardArn: yield* dashboardArn(output.DashboardName),
  240 │           dashboardBody: parseDashboardBody(output.DashboardBody),
  241 │           tags: {},
  242 │         };
  243 │       });

0.80 packages/alchemy/src/AWS/Cognito/UserPoolClient.ts:61:3
> 61 │   accessTokenValidity?: number;

0.80 packages/alchemy/src/AWS/ElastiCache/Connect.ts:16:3
  12 │ export interface CacheConnectionInfo {
  13 │   /** Primary endpoint hostname. */
  14 │   host: string;
  15 │   /** Primary endpoint port (6379 for valkey/redis, 11211 for memcached). */
> 16 │   port: number;
  17 │   /** Reader endpoint hostname, when the engine exposes one. */
  18 │   readerHost: string | undefined;
  19 │   /** Reader endpoint port, when the engine exposes one. */
  20 │   readerPort: number | undefined;
  21 │   /**
  22 │    * Serverless caches only accept TLS connections — always `true`.
  23 │    */
  24 │   tls: boolean;
  25 │ }

0.80 packages/alchemy/src/AWS/ELBv2/TrustStore.ts:41:5
  30 │ export interface TrustStore extends Resource<
  31 │   "AWS.ELBv2.TrustStore",
  32 │   TrustStoreProps,
  33 │   {
  34 │     /** The ARN of the trust store. */
  35 │     trustStoreArn: TrustStoreArn;
  36 │     /** The name of the trust store. */
  37 │     name: string;
  38 │     /** The status of the trust store (`ACTIVE` or `CREATING`). */
  39 │     status: string;
  40 │     /** The number of CA certificates in the trust store's bundle. */
> 41 │     numberOfCaCertificates: number;
  42 │     /** The tags applied to the trust store. */
  43 │     tags: Record<string, string>;
  44 │   },
  45 │   never,
  46 │   Providers
  47 │ > {}

0.80 packages/alchemy/src/AWS/Grafana/CreateWorkspaceServiceAccountToken.ts:15:3
  11 │ export interface CreateWorkspaceServiceAccountTokenRequest {
  12 │   /** A name for the token, unique within the service account. */
  13 │   name: string;
  14 │   /** The id of the service account to mint the token for. */
> 15 │   serviceAccountId: string;
  16 │   /**
  17 │    * How long the token is valid — converted to whole seconds on the wire
  18 │    * (`secondsToLive`). Maximum 30 days.
  19 │    */
  20 │   timeToLive: Duration.Input;
  21 │ }

0.80 packages/alchemy/src/AWS/IAM/AccessKey.ts:30:5
  23 │ export interface AccessKey extends Resource<
  24 │   "AWS.IAM.AccessKey",
  25 │   AccessKeyProps,
  26 │   {
  27 │     /** The IAM user the access key belongs to. */
  28 │     userName: string;
  29 │     /** The access key ID. */
> 30 │     accessKeyId: string;
  31 │     /** Whether the key is `Active` or `Inactive`. */
  32 │     status: iam.StatusType;
  33 │     /** When the access key was created. */
  34 │     createDate: Date | undefined;
  35 │     /** The secret access key. AWS only returns it at creation; later reads preserve the originally stored redacted value. */
  36 │     secretAccessKey: Redacted.Redacted<string> | undefined;
  37 │     /** When the access key was last used, if ever. */
  38 │     lastUsedDate: Date | undefined;
  39 │     /** The AWS service the key last authenticated to. */
  40 │     lastUsedServiceName: string | undefined;
  41 │     /** The region of the key's last use. */
  42 │     lastUsedRegion: string | undefined;
  43 │   },
  44 │   never,
  45 │   Providers
  46 │ > {}

0.80 packages/alchemy/src/AWS/IoTWireless/WirelessDevice.ts:103:3
  101 │ export interface LoRaWANDeviceProps {
  102 │   /** The DevEUI radio identifier (public). Changing it replaces the device. */
> 103 │   DevEui?: string;
  104 │   /** ID of the device profile the device uses. Updates in place. */
  105 │   DeviceProfileId?: string;
  106 │   /** ID of the service profile the device uses. Updates in place. */
  107 │   ServiceProfileId?: string;
  108 │   /** OTAA v1.1 activation keys. Changing them replaces the device. */
  109 │   OtaaV1_1?: OtaaV1_1Props;
  110 │   /** OTAA v1.0.x activation keys. Changing them replaces the device. */
  111 │   OtaaV1_0_x?: OtaaV1_0_xProps;
  112 │   /** ABP v1.1 activation configuration. Changing it replaces the device. */
  113 │   AbpV1_1?: AbpV1_1Props;
  114 │   /** ABP v1.0.x activation configuration. Changing it replaces the device. */
  115 │   AbpV1_0_x?: AbpV1_0_xProps;
  116 │   /** FPort configuration. Updates in place. */
  117 │   FPorts?: iotw.FPorts;
  118 │ }

0.80 packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts:294:3
  293 │ type PlaybackConfigurationAttributes = {
> 294 │   name: string;
  295 │   playbackConfigurationArn: string;
  296 │   playbackEndpointPrefix: string;
  297 │   sessionInitializationEndpointPrefix: string;
  298 │   hlsManifestEndpointPrefix: string | undefined;
  299 │   dashManifestEndpointPrefix: string | undefined;
  300 │ };

0.80 packages/alchemy/src/AWS/QuickSight/AssetEventSource.ts:19:3
  17 │ export interface QuickSightAssetEventDetail {
  18 │   /** The account the asset lives in. */
> 19 │   awsAccountId?: string;
  20 │   /** Id of the affected asset (e.g. the dashboard or dataset id). */
  21 │   resourceId?: string;
  22 │   /** ARN of the affected asset. */
  23 │   arn?: string;
  24 │   /** Display name of the affected asset. */
  25 │   name?: string;
  26 │   /** Version number for versioned assets (dashboards, templates, themes). */
  27 │   versionNumber?: number;
  28 │   /** Additional event fields (the schema grows over time). */
  29 │   [key: string]: unknown;
  30 │ }

0.80 packages/alchemy/src/AWS/RDS/Connect.ts:19:3
  17 │ export interface ConnectionInfo {
  18 │   host: string;
> 19 │   port: number;
  20 │   database?: string;
  21 │   username?: string;
  22 │   password?: string;
  23 │   ssl: boolean;
  24 │   /**
  25 │    * RFC-3986 connection URL — feeds `Drizzle.Postgres` / a Hyperdrive
  26 │    * origin directly. `Redacted` because it embeds the password.
  27 │    */
  28 │   url: Redacted.Redacted<string>;
  29 │   /**
  30 │    * IAM auth mode only: re-mints a fresh short-lived (15 minute) IAM
  31 │    * database authentication token.
  32 │    *
  33 │    * Per-execution pools (Lambda invoke, Worker event) never need it — the
  34 │    * `Connect` runtime effect re-runs on each execution and mints a fresh
  35 │    * token as `password`/`url`. Long-lived serverful pools (ECS Task /
  36 │    * ServerHost) should wire this into the driver's lazy-password hook
  37 │    * (`postgres.js` `pass: () => ...`, `pg` `password: () => ...`) so every
  38 │    * new physical connection authenticates with a fresh token instead of a
  39 │    * token minted at pool construction.
  40 │    */
  41 │   refreshPassword?: Effect.Effect<
  42 │     Redacted.Redacted<string>,
  43 │     Presign.PresignError
  44 │   >;
  45 │ }

0.80 packages/alchemy/src/AWS/Route53/QueryLoggingConfig.ts:15:3
  10 │ export interface QueryLoggingConfigProps {
  11 │   /**
  12 │    * ID of the public hosted zone to log DNS queries for. Changing this forces
  13 │    * replacement.
  14 │    */
> 15 │   hostedZoneId: string;
  16 │   /**
  17 │    * ARN of the CloudWatch Logs log group Route 53 publishes query logs to.
  18 │    * The log group **must live in `us-east-1`** (Route 53 is a global service
  19 │    * and only delivers query logs to that region), and a CloudWatch Logs
  20 │    * resource policy in `us-east-1` must grant `route53.amazonaws.com`
  21 │    * permission to `logs:CreateLogStream` and `logs:PutLogEvents` on it (see
  22 │    * `AWS.Logs.ResourcePolicy`). Changing this forces replacement.
  23 │    */
  24 │   cloudWatchLogsLogGroupArn: string;
  25 │ }

0.80 packages/alchemy/src/AWS/SES/BindingHttp.ts:174:9
  173 │       const label = isEmailIdentityRef(identity)
> 174 │         ? identity.emailIdentity
  175 │         : identity.LogicalId;

0.80 packages/alchemy/src/AWS/SES/Contact.ts:94:2
  91 │  * // unsubscribeAll overrides every per-topic preference.
  92 │  * const contact = yield* SES.Contact("Subscriber", {
  93 │  *   contactListName: list.contactListName,
> 94 │  *   emailAddress: "reader@example.com",

0.80 packages/alchemy/src/AWS/SES/EmailIdentityPolicy.ts:21:3
  15 │ export interface EmailIdentityPolicyProps {
  16 │   /**
  17 │    * The email address or domain identity the sending-authorization policy is
  18 │    * attached to. Typically the `emailIdentity` output of a
  19 │    * `SES.EmailIdentity`. Changing it replaces the policy.
  20 │    */
> 21 │   emailIdentity: string;
  22 │   /**
  23 │    * Name of the policy. May contain letters, numbers, dashes and underscores,
  24 │    * up to 64 characters. If omitted, a deterministic physical name is
  25 │    * generated from the app, stage, and logical ID. Changing it replaces the
  26 │    * policy.
  27 │    */
  28 │   policyName?: string;
  29 │   /**
  30 │    * The IAM policy document that grants sending authorization. Equivalent
  31 │    * document representations are ignored when detecting drift.
  32 │    */
  33 │   policy: PolicyDocument;
  34 │ }

0.80 packages/alchemy/src/AWS/SQS/Queue.ts:755:17
  752 │           if (upsert.length > 0) {
  753 │             yield* sqs
  754 │               .tagQueue({
> 755 │                 QueueUrl: queueUrl,
  756 │                 Tags: Object.fromEntries(upsert.map((t) => [t.Key, t.Value])),
  757 │               })
  758 │               .pipe(
  759 │                 Effect.retry({
  760 │                   while: (e) => e._tag === "QueueDoesNotExist",
  761 │                   schedule: Schedule.spaced("2 seconds"),
  762 │                   times: 10,
  763 │                 }),
  764 │               );
  765 │           }

0.80 packages/alchemy/src/Axiom/AuthProvider.ts:28:7
  24 │ export type AxiomResolvedCredentials =
  25 │   | {
  26 │       type: "apiToken";
  27 │       apiToken: Redacted.Redacted<string>;
> 28 │       apiBaseUrl: string;
  29 │       orgId?: string;
  30 │       source: { type: AxiomAuthConfig["method"] | "env"; details?: string };
  31 │     }
  32 │   | {
  33 │       type: "pat";
  34 │       apiToken: Redacted.Redacted<string>;
  35 │       apiBaseUrl: string;
  36 │       orgId: string;
  37 │       source: { type: AxiomAuthConfig["method"] | "env"; details?: string };
  38 │     };

0.80 packages/alchemy/src/Cli/components/view/PlanTree.ts:23:7
  20 │   | {
  21 │       key: string;
  22 │       type: "namespace";
> 23 │       id: string;
  24 │       depth: number;
  25 │       action: FlattenedItem["action"];
  26 │     }

0.80 packages/alchemy/src/Cloudflare/Access/Bookmark.ts:48:5
  43 │ export type Bookmark = Resource<
  44 │   "Cloudflare.Access.Bookmark",
  45 │   BookmarkProps,
  46 │   {
  47 │     /** UUID of the bookmark application. */
> 48 │     bookmarkId: string;
  49 │     /** Cloudflare account that owns the bookmark. */
  50 │     accountId: string;
  51 │     /** Display name reported by Cloudflare. */
  52 │     name: string;
  53 │     /** The domain the bookmark links to. */
  54 │     domain: string;
  55 │     /** The logo URL shown in the App Launcher. */
  56 │     logoUrl: string | undefined;
  57 │     /** Whether the bookmark is displayed in the App Launcher. */
  58 │     appLauncherVisible: boolean;
  59 │   },
  60 │   never,
  61 │   Providers
  62 │ >;

0.80 packages/alchemy/src/Cloudflare/Access/Group.ts:86:3
  73 │ export type Group = Resource<
  74 │   "Cloudflare.Access.Group",
  75 │   GroupProps,
  76 │   {
  77 │     /** UUID of the group assigned by Cloudflare. */
  78 │     groupId: string;
  79 │     /** Cloudflare account that owns the group. */
  80 │     accountId: string;
  81 │     /** Display name reported by Cloudflare. */
  82 │     name: string;
  83 │     /** Whether Cloudflare reports this group as the organization default. */
  84 │     isDefault: boolean | undefined;
  85 │   },
> 86 │   never,
  87 │   Providers
  88 │ >;

0.80 packages/alchemy/src/Cloudflare/Access/InfrastructureTarget.ts:62:3
  58 │ export interface InfrastructureTargetAttributes {
  59 │   /** UUID of the infrastructure target, assigned by Cloudflare. */
  60 │   targetId: string;
  61 │   /** Cloudflare account that owns the target. */
> 62 │   accountId: string;
  63 │   /** Hostname identifying the target. */
  64 │   hostname: string;
  65 │   /** Resolved IPv4/IPv6 addresses of the target. */
  66 │   ip: {
  67 │     ipv4?: { ipAddr?: string; virtualNetworkId?: string };
  68 │     ipv6?: { ipAddr?: string; virtualNetworkId?: string };
  69 │   };
  70 │   /** RFC 3339 timestamp of when the target was created. */
  71 │   createdAt: string;
  72 │   /** RFC 3339 timestamp of when the target was last modified. */
  73 │   modifiedAt: string;
  74 │ }

0.80 packages/alchemy/src/Cloudflare/Access/KeyConfiguration.ts:25:3
  23 │ export type KeyConfigurationAttributes = {
  24 │   /** Cloudflare account the key configuration belongs to. */
> 25 │   accountId: string;
  26 │   /** The number of days between key rotations. */
  27 │   keyRotationIntervalDays: number | undefined;
  28 │   /** The number of days until the next key rotation. */
  29 │   daysUntilNextRotation: number | undefined;
  30 │   /** The timestamp of the previous key rotation, if one has happened. */
  31 │   lastKeyRotationAt: string | undefined;
  32 │   /**
  33 │    * The rotation interval the account had before Alchemy first managed it.
  34 │    * Restored on destroy, so deleting the resource puts the account back
  35 │    * the way it was found. `undefined` when Cloudflare reported no interval
  36 │    * at adoption time — destroy then leaves the current interval in place.
  37 │    */
  38 │   initialKeyRotationIntervalDays: number | undefined;
  39 │ };

0.80 packages/alchemy/src/Cloudflare/Addressing/BgpPrefix.ts:21:3
  16 │ export interface BgpPrefixProps {
  17 │   /**
  18 │    * Identifier of the parent BYOIP prefix the BGP prefix belongs to.
  19 │    * Changing it forces a replacement.
  20 │    */
> 21 │   prefixId: string;
  22 │   /**
  23 │    * IP Prefix in Classless Inter-Domain Routing format. Must be contained
  24 │    * in the parent prefix. Changing it forces a replacement.
  25 │    */
  26 │   cidr: string;
  27 │   /**
  28 │    * Whether the BGP prefix is advertised to the internet (maps to
  29 │    * `on_demand.advertised`). Mutable — patched in place; BGP propagation
  30 │    * is eventually consistent (minutes).
  31 │    * @default false
  32 │    */
  33 │   advertised?: boolean;
  34 │   /**
  35 │    * Number of times to prepend the Cloudflare ASN to the BGP AS-Path
  36 │    * attribute. Mutable.
  37 │    */
  38 │   asnPrependCount?: number;
  39 │   /**
  40 │    * If `true`, Cloudflare advertises the prefix only while a matching BGP
  41 │    * prefix exists in the Magic routing table, automatically withdrawing it
  42 │    * otherwise. Mutable.
  43 │    */
  44 │   autoAdvertiseWithdraw?: boolean;
  45 │ }

0.80 packages/alchemy/src/Cloudflare/Addressing/Prefix.ts:281:3
  274 │ const toAttributes = (
  275 │   prefix: addressing.GetPrefixResponse,
  276 │   accountId: string,
  277 │ ): PrefixAttributes => ({
  278 │   prefixId: prefix.id ?? "",
  279 │   accountId,
  280 │   cidr: prefix.cidr ?? "",
> 281 │   asn: prefix.asn ?? 0,
  282 │   approved: prefix.approved ?? undefined,
  283 │   ownershipValidationState: prefix.ownershipValidationState ?? undefined,
  284 │   ownershipValidationToken: prefix.ownershipValidationToken ?? undefined,
  285 │   irrValidationState: prefix.irrValidationState ?? undefined,
  286 │   rpkiValidationState: prefix.rpkiValidationState ?? undefined,
  287 │   loaDocumentId: prefix.loaDocumentId ?? undefined,
  288 │   description: prefix.description ?? undefined,
  289 │   createdAt: prefix.createdAt ?? undefined,
  290 │   modifiedAt: prefix.modifiedAt ?? undefined,
  291 │ });

0.80 packages/alchemy/src/Cloudflare/ApiShield/Operation.ts:64:3
  62 │ export interface OperationAttributes {
  63 │   /** Cloudflare-assigned UUID of the operation. */
> 64 │   operationId: string;
  65 │   /** Zone the operation is registered on. */
  66 │   zoneId: string;
  67 │   /** The HTTP method used to access the endpoint. */
  68 │   method: OperationMethod;
  69 │   /** RFC3986-compliant host the endpoint lives on. */
  70 │   host: string;
  71 │   /**
  72 │    * The endpoint path as stored by Cloudflare — variable names are
  73 │    * normalized left-to-right to `{var1}`, `{var2}`, …
  74 │    */
  75 │   endpoint: string;
  76 │   /** ISO8601 timestamp of the last update. */
  77 │   lastUpdated: string;
  78 │ }

0.80 packages/alchemy/src/Cloudflare/Calls/TurnKey.ts:32:3
  26 │ export type TurnKeyAttributes = {
  27 │   /**
  28 │    * Cloudflare-generated unique identifier for the TURN key. Used in the
  29 │    * credential-minting API path
  30 │    * (`https://rtc.live.cloudflare.com/v1/turn/keys/{keyId}/credentials/generate`).
  31 │    */
> 32 │   keyId: string;
  33 │   /**
  34 │    * The Cloudflare account the TURN key belongs to.
  35 │    */
  36 │   accountId: string;
  37 │   /**
  38 │    * TURN key secret (bearer token) used to mint short-lived TURN
  39 │    * credentials. Returned only at creation time and never re-readable —
  40 │    * Alchemy persists it in state and carries it forward across updates.
  41 │    */
  42 │   key: Redacted.Redacted<string>;
  43 │   /**
  44 │    * A short description of the TURN key.
  45 │    */
  46 │   name: string;
  47 │   /**
  48 │    * When the TURN key was created.
  49 │    */
  50 │   created: string;
  51 │   /**
  52 │    * When the TURN key was last modified.
  53 │    */
  54 │   modified: string;
  55 │ };

0.80 packages/alchemy/src/Cloudflare/D1/Database.ts:553:9
  548 │       return {
  549 │         databaseId,
  550 │         databaseName,
  551 │         jurisdiction: (output?.jurisdiction ?? jurisdiction) as Jurisdiction,
  552 │         readReplication: news.readReplication,
> 553 │         accountId: acct,
  554 │         // On first creation prior state is meaningless; otherwise removing
  555 │         // `migrations` keeps the stamp and hashes for a later re-add.
  556 │         ...migrationsAttrs({
  557 │           input: migrationsInput,
  558 │           run: migrations,
  559 │           output: isFirstCreation ? undefined : output,
  560 │         }),
  561 │         importHashes,
  562 │       };

0.80 packages/alchemy/src/Cloudflare/Devices/DexTest.ts:81:3
  77 │ export type DeviceDexTestAttributes = {
  78 │   /** API UUID of the DEX test. */
  79 │   testId: string;
  80 │   /** Account that owns the test. */
> 81 │   accountId: string;
  82 │   /** Observed test name. */
  83 │   name: string;
  84 │   /** Observed probe configuration. */
  85 │   data: DeviceDexTestData;
  86 │   /** Observed run interval. */
  87 │   interval: string;
  88 │   /** Whether the test is active. */
  89 │   enabled: boolean;
  90 │   /** Observed description, if any. */
  91 │   description: string | undefined;
  92 │ };

0.80 packages/alchemy/src/Cloudflare/DNS/Firewall.ts:107:3
  104 │   /**
  105 │    * DNS Firewall cluster identifier (UUID).
  106 │    */
> 107 │   dnsFirewallId: string;

0.80 packages/alchemy/src/Cloudflare/Firewall/Lockdown.ts:81:3
  79 │ export interface LockdownAttributes {
  80 │   /** Cloudflare-assigned identifier of the Zone Lockdown rule. */
> 81 │   lockdownId: string;
  82 │   /** Zone the rule belongs to. */
  83 │   zoneId: string;
  84 │   /** The locked-down URL patterns. */
  85 │   urls: string[];
  86 │   /** The allowed IP addresses and CIDR ranges. */
  87 │   configurations: LockdownConfiguration[];
  88 │   /** The rule's informative summary, if set. */
  89 │   description: string | undefined;
  90 │   /** Whether the rule is currently paused. */
  91 │   paused: boolean;
  92 │   /** The rule's processing priority, if set. */
  93 │   priority: number | undefined;
  94 │   /** ISO8601 creation timestamp. */
  95 │   createdOn: string;
  96 │   /** ISO8601 last-modified timestamp. */
  97 │   modifiedOn: string;
  98 │ }

0.80 packages/alchemy/src/Cloudflare/Firewall/UaRule.ts:61:3
  59 │ export interface UaRuleAttributes {
  60 │   /** Cloudflare-assigned identifier of the User Agent Blocking rule. */
> 61 │   uaRuleId: string;
  62 │   /** Zone the rule belongs to. */
  63 │   zoneId: string;
  64 │   /** The exact User-Agent string the rule matches. */
  65 │   userAgent: string;
  66 │   /** The action applied to matched requests. */
  67 │   mode: UaRuleMode;
  68 │   /** The rule's informative summary, if set. */
  69 │   description: string | undefined;
  70 │   /** Whether the rule is currently paused. */
  71 │   paused: boolean;
  72 │ }

0.80 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/Detection.ts:21:3
  16 │ export interface LeakedCredentialDetectionProps {
  17 │   /**
  18 │    * Zone the custom detection belongs to. Stable — moving a detection
  19 │    * between zones triggers a replacement.
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Ruleset expression locating the username in the request, e.g.
  24 │    * `lookup_json_string(http.request.body.raw, "user")`. Mutable —
  25 │    * updated in place via PUT. At least one of `username`/`password`
  26 │    * should be set.
  27 │    */
  28 │   username?: string;
  29 │   /**
  30 │    * Ruleset expression locating the password in the request, e.g.
  31 │    * `lookup_json_string(http.request.body.raw, "secret")`. This is an
  32 │    * expression over the request (not a secret value). Mutable — updated
  33 │    * in place via PUT.
  34 │    */
  35 │   password?: string;
  36 │ }

0.80 packages/alchemy/src/Cloudflare/LogsControl/RetentionFlag.ts:22:3
  15 │ export type LogsRetentionFlagProps = {
  16 │   /**
  17 │    * Zone whose Logpull retention flag is managed. The flag is a zone-level
  18 │    * singleton, so the zone is the resource's identity — changing it
  19 │    * triggers a replacement (the old zone's flag is restored to the value
  20 │    * it had before Alchemy managed it).
  21 │    */
> 22 │   zoneId: string;
  23 │   /**
  24 │    * Whether Logpull log retention is enabled for the zone. Mutable —
  25 │    * re-posted in place.
  26 │    */
  27 │   flag: boolean;
  28 │ };

0.80 packages/alchemy/src/Cloudflare/MagicTransit/GreTunnel.ts:81:3
  78 │   /**
  79 │    * The IP address assigned to the customer side of the GRE tunnel.
  80 │    */
> 81 │   customerGreEndpoint: string;

0.80 packages/alchemy/src/Cloudflare/MagicTransit/IpsecTunnel.ts:83:3
  81 │ export interface IpsecTunnelAttributes {
  82 │   /** Cloudflare-assigned identifier of the IPsec tunnel. */
> 83 │   tunnelId: string;
  84 │   /** The Cloudflare account the tunnel belongs to. */
  85 │   accountId: string;

0.80 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Certificate.ts:181:7
  179 │     reconcile: Effect.fn(function* ({ news, output }) {
  180 │       // Inputs have been resolved to concrete strings by Plan.
> 181 │       const zoneId = news.zoneId as string;

0.80 packages/alchemy/src/Cloudflare/RealtimeKit/Webhook.ts:116:2
  113 │  *
  114 │  * const webhook = yield* Cloudflare.RealtimeKit.Webhook("Lifecycle", {
  115 │  *   appId: app.appId,
> 116 │  *   url: "https://example.com/webhook",

0.80 packages/alchemy/src/Cloudflare/ResourceSharing/Share.ts:105:3
  102 │   /**
  103 │    * The Cloudflare account that owns (sends) the share.
  104 │    */
> 105 │   accountId: string;

0.80 packages/alchemy/src/Cloudflare/ResourceSharing/ShareResource.ts:21:3
  16 │ export type ShareResourceProps = {
  17 │   /**
  18 │    * The share this resource belongs to. Changing the share triggers a
  19 │    * replacement.
  20 │    */
> 21 │   shareId: string;
  22 │   /**
  23 │    * Type of the shared resource (e.g. `gateway-policy`). Changing the type
  24 │    * triggers a replacement.
  25 │    */
  26 │   resourceType: ShareableResourceType;
  27 │   /**
  28 │    * Identifier of the resource being shared (e.g. the gateway policy id).
  29 │    * Changing it triggers a replacement.
  30 │    */
  31 │   resourceId: string;
  32 │   /**
  33 │    * Account that owns the resource being shared. Changing it triggers a
  34 │    * replacement.
  35 │    * @default the current account
  36 │    */
  37 │   resourceAccountId?: string;
  38 │   /**
  39 │    * Resource metadata forwarded to the share API. The only mutable field.
  40 │    * @default {}
  41 │    */
  42 │   meta?: unknown;
  43 │ };

0.80 packages/alchemy/src/Cloudflare/Stream/LiveInput.ts:86:3
  83 │   /**
  84 │    * The unique identifier for the live input (Cloudflare `uid`).
  85 │    */
> 86 │   liveInputId: string;

0.80 packages/alchemy/src/Cloudflare/Stream/SigningKey.ts:21:3
  17 │ export type SigningKeyAttributes = {
  18 │   /**
  19 │    * The unique identifier of the signing key.
  20 │    */
> 21 │   keyId: string;
  22 │   /**
  23 │    * The Cloudflare account the signing key belongs to.
  24 │    */
  25 │   accountId: string;
  26 │   /**
  27 │    * The date and time the signing key was created.
  28 │    */
  29 │   created: string | undefined;
  30 │   /**
  31 │    * The signing key in PEM format. Only returned by Cloudflare at
  32 │    * creation time — preserved in state thereafter.
  33 │    */
  34 │   pem: Redacted.Redacted<string>;
  35 │   /**
  36 │    * The signing key in JWK format. Only returned by Cloudflare at
  37 │    * creation time — preserved in state thereafter.
  38 │    */
  39 │   jwk: Redacted.Redacted<string>;
  40 │ };

0.80 packages/alchemy/src/Cloudflare/Stream/Webhook.ts:28:3
  24 │ export type WebhookAttributes = {
  25 │   /**
  26 │    * The Cloudflare account the webhook belongs to.
  27 │    */
> 28 │   accountId: string;
  29 │   /**
  30 │    * The URL where webhook notifications are sent.
  31 │    */
  32 │   notificationUrl: string;
  33 │   /**
  34 │    * The date and time the webhook was last modified.
  35 │    */
  36 │   modified: string | undefined;
  37 │   /**
  38 │    * The HMAC secret used to verify webhook request signatures
  39 │    * (`Webhook-Signature` header).
  40 │    */
  41 │   secret: Redacted.Redacted<string>;
  42 │ };

0.80 packages/alchemy/src/Cloudflare/Turnstile/Widget.ts:145:3
  141 │ export type Widget = Resource<
  142 │   TypeId,
  143 │   WidgetProps,
  144 │   WidgetAttributes,
> 145 │   never,
  146 │   Providers
  147 │ >;

0.80 packages/alchemy/src/Cloudflare/UrlNormalization/UrlNormalization.ts:40:3
  34 │ export interface Props {
  35 │   /**
  36 │    * Zone whose URL normalization is managed. Stable — changing the zone
  37 │    * triggers a replacement (the old zone's URL normalization is reset to
  38 │    * Cloudflare defaults as the old instance deletes).
  39 │    */
> 40 │   zoneId: string;
  41 │   /**
  42 │    * The scope of the URL normalization: `"incoming"` normalizes URLs used
  43 │    * for rule matching only, `"both"` also normalizes URLs sent to the
  44 │    * origin, `"none"` disables normalization.
  45 │    *
  46 │    * Mutable — updated in place.
  47 │    *
  48 │    * @default "incoming"
  49 │    */
  50 │   scope?: UrlNormalizationScope;
  51 │   /**
  52 │    * The type of URL normalization performed by Cloudflare:
  53 │    * `"cloudflare"` is RFC 3986 plus extra normalizations (e.g. `//`
  54 │    * collapsing), `"rfc3986"` is strict RFC 3986 only.
  55 │    *
  56 │    * Mutable — updated in place.
  57 │    *
  58 │    * @default "cloudflare"
  59 │    */
  60 │   type?: Type;
  61 │ }

0.80 packages/alchemy/src/Cloudflare/VulnerabilityScanner/CredentialSet.ts:39:3
  35 │ export type VulnScannerCredentialSet = Resource<
  36 │   TypeId,
  37 │   VulnScannerCredentialSetProps,
  38 │   VulnScannerCredentialSetAttributes,
> 39 │   never,
  40 │   Providers
  41 │ >;

0.80 packages/alchemy/src/Cloudflare/Workers/ScheduledEvents.ts:28:3
  27 │ export interface ScheduledEvent {
> 28 │   id: string;
  29 │   runAt: Date;
  30 │   repeatMs?: number;
  31 │   payload: unknown;
  32 │ }

0.80 packages/alchemy/src/Fly/Redis.ts:86:5
   83 │   RedisProps,
   84 │   {
   85 │     /** Fly GraphQL add-on id. */
>  86 │     redisId: string;
   87 │     /** Physical Upstash Redis name. */
   88 │     name: string;
   89 │     /** Primary region code. */
   90 │     primaryRegion: string;
   91 │     /** Observed read-replica regions. */
   92 │     readRegions: string[];
   93 │     /** Observed status (`ready`, `provisioning`, …). */
   94 │     status: string | undefined;
   95 │     /** Selected plan id, if the API returned one. */
   96 │     planId: string | undefined;
   97 │     /** Observed plan name (`Pay-as-you-go`, `Fixed 250MB`, …). */
   98 │     planName: string | undefined;
   99 │     /** Private 6PN address, if the API returned one. */
  100 │     privateIp: string | undefined;
  101 │     /** Organization slug. */
  102 │     orgSlug: string | undefined;
  103 │     /** Whether eviction is enabled. */
  104 │     eviction: boolean | undefined;
  105 │     /**
  106 │      * Redacted Upstash connection URL. Bindings transport it to the
  107 │      * runtime automatically. Service attachments also set `REDIS_URL`.
  108 │      */
  109 │     url: Redacted.Redacted<string> | undefined;
  110 │   },

0.80 packages/alchemy/src/Fly/replicas.ts:83:3
  82 │ export interface Replica {
> 83 │   machineId: string;
  84 │   name: string;
  85 │   baseName?: string;
  86 │   region: string;
  87 │   state: string;
  88 │   instanceId: string | undefined;
  89 │   privateIp: string | undefined;
  90 │   imageRef: MachineImageRef | undefined;
  91 │   guest: MachineGuest | undefined;
  92 │   mounts: MountedDisk[];
  93 │ }

0.80 packages/alchemy/src/Git/Hasher/WorkerLoaderModule.ts:40:5
> 40 │     const base = Number(query.get("base"));
  41 │     const remaining = Number(query.get("remaining"));
  42 │     const maxObjectSize = Number(query.get("max"));
  43 │     const skip = Number(query.get("skip") ?? "0");

0.80 packages/alchemy/src/Git/Jobs/Bundle.ts:105:3
  103 │ /** Dependencies of {@link runBundleJob}. */
  104 │ export interface BundleJobOptions {
> 105 │   readonly repoId: string;
  106 │   readonly refs: ReadonlyArray<BundleRef>;
  107 │   /** The full-clone manifest (closure of every ref). */
  108 │   readonly entries: ReadonlyArray<ManifestEntry>;
  109 │   /** Emits the pack for `entries` — `RepoObject`'s `packStream`. */
  110 │   readonly packStream: (
  111 │     entries: ReadonlyArray<ManifestEntry>,
  112 │   ) => Stream.Stream<Uint8Array, StoreError>;
  113 │   readonly blobs: BlobStoreShape;
  114 │   readonly maxBytes?: number | undefined;
  115 │ }

0.80 packages/alchemy/src/Git/PushWire.ts:17:3
  15 │ interface RowMeta {
  16 │   /** oid */
> 17 │   readonly o: string;
  18 │   /** type */
  19 │   readonly t: ObjectType;
  20 │   /** size (inflated) */
  21 │   readonly s: number;
  22 │   /** zdata length in the blob section */
  23 │   readonly n: number;
  24 │   /** zsize (promoted rows: the span in the pack) */
  25 │   readonly z?: number | undefined;
  26 │   /** pack coordinates (promoted rows) */
  27 │   readonly p?: { readonly i: string; readonly f: number } | undefined;
  28 │ }

0.80 packages/alchemy/src/GitHub/AuthProvider.ts:61:5
  49 │ export const GitHubAuthConfigSchema = Schema.Union([
  50 │   Schema.Struct({
  51 │     method: Schema.Literal("stored"),
  52 │     token: Schema.String,
  53 │     baseUrl: Schema.optionalKey(Schema.String),
  54 │   }),
  55 │   Schema.Struct({
  56 │     method: Schema.Literal("gh-cli"),
  57 │     // v0 delegated to `gh auth token` and therefore had no inline token.
  58 │     // Keep that migration state readable; the first credential resolution
  59 │     // captures the token inline through updateConfig.
  60 │     token: Schema.optionalKey(Schema.String),
> 61 │     baseUrl: Schema.optionalKey(Schema.String),
  62 │   }),
  63 │ ]);
  64 │ export type GitHubAuthConfig = typeof GitHubAuthConfigSchema.Type;

0.80 packages/alchemy/src/Hetzner/Volume.ts:125:3
   98 │ export type Volume = Resource<
   99 │   "Hetzner.Volume",
  100 │   VolumeProps,
  101 │   {
  102 │     /** Numeric Hetzner Volume ID. */
  103 │     id: number;
  104 │     /** Volume name (unique per project). */
  105 │     name: string;
  106 │     /** Size in GB. */
  107 │     size: number;
  108 │     /** Filesystem if formatted on creation. */
  109 │     format: VolumeFormat | undefined;
  110 │     /** Location name (`nbg1`, `fsn1`, …). */
  111 │     location: string;
  112 │     /** Numeric location ID. */
  113 │     locationId: number;
  114 │     /** Device path on the file system (e.g. `/dev/disk/by-id/scsi-…`). */
  115 │     linuxDevice: string;
  116 │     /** Volume status. */
  117 │     status: VolumeStatus;
  118 │     /** Attached Server ID, or `null` if unattached. */
  119 │     serverId: number | null;
  120 │     /** RFC3339 creation timestamp. */
  121 │     created: string;
  122 │     /** User-defined labels (Alchemy ownership labels stripped). */
  123 │     labels: Record<string, string>;
  124 │   },
> 125 │   never,
  126 │   Providers
  127 │ >;

0.80 packages/alchemy/src/Neon/Function.ts:61:3
  55 │ export interface FunctionAttributes {
  56 │   /** Owning project. */ projectId: string;
  57 │   /** Owning branch. */ branchId: string;
  58 │   /** Stable function ID. */ functionId: string;
  59 │   /** Immutable invocation slug. */ slug: string;
  60 │   /** Observed display name. */ name: string;
> 61 │   /** Public invocation URL. Authenticate callers in the handler. */ url: string;
  62 │   /** Latest deployment identifier. */ currentDeploymentId: number | undefined;
  63 │   /** Deployment currently serving traffic. */ activeDeploymentId:
  64 │     | number
  65 │     | undefined;
  66 │   /** Latest deployment build status. */ status: string | undefined;
  67 │   /** Digest of the last successfully applied artifact, not a remote code attestation. */ codeHash:
  68 │     | string
  69 │     | undefined;
  70 │   /** Last applied environment digest, not proof of remote write-only value equality. */ environmentHash?: string;
  71 │   /** Previously managed environment names. Values cannot be read back. */ environment: string[];
  72 │ }

0.80 packages/alchemy/src/Planetscale/Postgres/PostgresMigrations.ts:123:5
  120 │ const withTemporaryPostgresRole = <A, E, R>(
  121 │   target: PostgresMigrationTarget,
  122 │   use: (role: {
> 123 │     id: string;
  124 │     connectionUrl: Redacted.Redacted<string>;
  125 │   }) => Effect.Effect<A, E, R>,
  126 │ ) =>

0.80 packages/alchemy/src/Railway/AuditLog.ts:30:3
  29 │ export type AuditLogProject = {
> 30 │   readonly projectId: string;
  31 │ };

0.80 packages/alchemy/src/Railway/Bind.ts:35:3
  33 │ type RpcTarget = {
  34 │   readonly Type: string;
> 35 │   readonly LogicalId: string;
  36 │   readonly dnsName?: unknown;
  37 │   readonly port?: unknown;
  38 │   readonly rpcToken?: unknown;
  39 │ };

0.80 packages/alchemy/src/Stripe/Account.ts:461:1
  459 │ const isMissingAccount = isMissingStripeResource;
  460 │
> 461 │ const getById = (account: string) =>
  462 │   GetAccountByAccount({ account }).pipe(
  463 │     Effect.catchIf(isMissingAccount, () => Effect.succeed(undefined)),
  464 │   );

0.80 packages/alchemy/src/Stripe/BillingPortalConfiguration.ts:356:3
> 356 │   never,
  357 │   Providers
  358 │ >;

0.80 packages/alchemy/src/Stripe/RadarValueListItem.ts:43:5
  38 │ export type RadarValueListItem = Resource<
  39 │   "Stripe.RadarValueListItem",
  40 │   RadarValueListItemProps,
  41 │   {
  42 │     /** Stripe value list item id (`rsli_…`). */
> 43 │     id: string;
  44 │     /** Id of the parent value list (`rsl_…`). */
  45 │     valueList: string;
  46 │     /** Value stored on the list. */
  47 │     value: string;
  48 │     /** Unix timestamp when the item was created. */
  49 │     created: number;
  50 │     /** Name or email of the user who added the item. */
  51 │     createdBy: string;
  52 │     /** Whether the item exists in live mode. */
  53 │     livemode: boolean;
  54 │   },
  55 │   never,
  56 │   Providers
  57 │ >;

0.80 packages/alchemy/src/Util/Node.ts:15:1
> 15 │ export const initialCwd: string = process.cwd();

0.80 packages/alchemy/test/AWS/EC2/Gone.ts:25:1
> 25 │ export const assertVpcGone = Effect.fn(function* (vpcId: string) {
  26 │   yield* ec2.describeVpcs({ VpcIds: [vpcId] }).pipe(
  27 │     Effect.flatMap(() => Effect.fail(new ResourceStillExists({ id: vpcId }))),
  28 │     Effect.retry(goneRetry),
  29 │     Effect.catchTag("InvalidVpcID.NotFound", () => Effect.void),
  30 │   );
  31 │ });

0.80 packages/alchemy/test/AWS/IAM/fixtures.ts:84:1
> 84 │ export const testOidcUrl = "https://example.com/alchemy-oidc";

0.80 packages/alchemy/test/AWS/SageMaker/handler.ts:64:5
> 64 │     const record = (userId: string, clicks: number) => [
  65 │       { FeatureName: "user_id", ValueAsString: userId },
  66 │       { FeatureName: "event_time", ValueAsString: new Date().toISOString() },
  67 │       { FeatureName: "clicks", ValueAsString: String(clicks) },
  68 │     ];

0.80 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:8:3
   5 │ export interface OtlpCollector {
   6 │   readonly server: Server;
   7 │   /** Base URL (`http://127.0.0.1:<port>`); append the OTLP signal path. */
>  8 │   readonly url: string;
   9 │   /** Responses fully written to the client. */
  10 │   readonly completedRequests: { value: number };
  11 │   /** Received batches, including exports whose client disconnected. */
  12 │   readonly requests: Array<{
  13 │     body: string;
  14 │     receivedAt: number;
  15 │     responseStartedAt?: number;
  16 │     closedAt?: number;
  17 │     completed: boolean;
  18 │     aborted: boolean;
  19 │   }>;
  20 │   /** Re-arm the response gate for subsequent matching batches. */
  21 │   readonly holdResponses: () => void;
  22 │   /** Acknowledge held batches and leave the gate open until re-armed. */
  23 │   readonly releaseResponses: () => void;
  24 │ }

0.80 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:83:23
  76 │           ...(Array.isArray(service.checks)
  77 │             ? {
  78 │                 checks: service.checks.map((value) => {
  79 │                   const check = record(value);
  80 │                   return {
  81 │                     type: string(check.type),
  82 │                     port:
> 83 │                       typeof check.port === "number" ? check.port : undefined,
  84 │                     interval: string(check.interval),
  85 │                     timeout: string(check.timeout),
  86 │                     gracePeriod: string(check.grace_period),
  87 │                     method: string(check.method),
  88 │                     protocol: string(check.protocol),
  89 │                   };
  90 │                 }),
  91 │               }
  92 │             : {}),

0.80 packages/cloudflare-runtime/src/core/bindings/MtlsCertificate.ts:3:1
   1 │ import { makeRemoteBinding } from "../remote-bindings/RemoteBindings.ts";
   2 │
>  3 │ export const remote = (binding: string, certificateId: string) =>
   4 │   makeRemoteBinding(
   5 │     {
   6 │       name: binding,
   7 │       type: "mtls_certificate",
   8 │       certificateId,
   9 │     },
  10 │     (service) => ({
  11 │       name: binding,
  12 │       service,
  13 │     }),
  14 │   );

0.80 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/analytics.ts:22:3
  19 │ // When adding new columns please update the schema
  20 │ type Data = {
  21 │   // -- Indexes --
> 22 │   accountId?: number;
  23 │   scriptId?: number;

0.80 packages/cloudflare-runtime/src/internal/workflows-shared/lib/validators.ts:84:3
  76 │ const STEP_CONFIG_SCHEMA = Schema.Struct({
  77 │   retries: Schema.optional(
  78 │     Schema.Struct({
  79 │       delay: Schema.Unknown,
  80 │       limit: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
  81 │       backoff: Schema.optional(Schema.Literals(["constant", "linear", "exponential"])),
  82 │     }),
  83 │   ),
> 84 │   timeout: Schema.optional(NonNegativeNumberOrString),
  85 │   sensitive: Schema.optional(Schema.Literal(SENSITIVE_STEP_OUTPUT)),
  86 │ });

0.80 packages/cloudflare-runtime/src/internal/workflows-shared/types.ts:50:5
  48 │ export type WorkflowBinding = {
  49 │   unsafeGetInstanceModifier(
> 50 │     instanceId: string,
  51 │   ): Promise<WorkflowInstanceModifier>;
  52 │   unsafeWaitForStepResult(
  53 │     instanceId: string,
  54 │     name: string,
  55 │     index?: number,
  56 │   ): Promise<unknown>;
  57 │   unsafeWaitForStatus(instanceId: string, status: string): Promise<void>;
  58 │   unsafeGetOutputOrError(
  59 │     instanceId: string,
  60 │     isOutput: boolean,
  61 │   ): Promise<unknown>;
  62 │   unsafeAbort(instanceId: string, reason?: string): Promise<void>;
  63 │   unsafeStartIntrospection(): Promise<string>;
  64 │   unsafeSetIntrospectionOperations(
  65 │     sessionId: string,
  66 │     operations: Array<WorkflowIntrospectionOperation>,
  67 │   ): Promise<void>;
  68 │   unsafeStopIntrospection(sessionId: string): Promise<void>;
  69 │   unsafeGetIntrospectionInstances(sessionId: string): Promise<Array<string>>;
  70 │ };

0.80 packages/frontend-frameworks/src/vinext/cache/kv-http.ts:19:3
  16 │ const MIN_KV_TTL_SECONDS = 60;
  17 │
  18 │ export type KvHttpNamespace = {
> 19 │   readonly accountId: string;
  20 │   readonly namespaceId: string;
  21 │ };

0.80 packages/pkg/src/Protocol.ts:91:3
  87 │ export const PublishedPackage = Schema.Struct({
  88 │   name: Schema.String,
  89 │   group: Schema.String,
  90 │   /** Install URL pinned to the commit. */
> 91 │   url: Schema.String,
  92 │   tags: Schema.Array(Schema.String),
  93 │ });
  94 │ export type PublishedPackage = typeof PublishedPackage.Type;

0.79 packages/alchemy-test/src/Reporter.ts:17:3
  13 │ export interface TestMeta {
  14 │   readonly tags: ReadonlyArray<string>;
  15 │   readonly optInTags: ReadonlyArray<string>;
  16 │   /** Stable id: `<file> > <describe chain> > <name>`. */
> 17 │   readonly id: string;
  18 │   readonly file: string;
  19 │   readonly titlePath: ReadonlyArray<string>;
  20 │   readonly name: string;
  21 │ }

0.79 packages/alchemy/src/ACME/Client.ts:100:3
   92 │ export interface IssuedCertificate {
   93 │   /** Leaf certificate PEM. */
   94 │   readonly certificate: string;
   95 │   /** Full chain PEM, leaf first. */
   96 │   readonly chain: string;
   97 │   /** PKCS#8 private key PEM. */
   98 │   readonly privateKey: Redacted.Redacted<string>;
   99 │   readonly identifiers: ReadonlyArray<string>;
> 100 │   readonly serial: string;
  101 │   /** ISO 8601. */
  102 │   readonly notBefore: string;
  103 │   /** ISO 8601. */
  104 │   readonly notAfter: string;
  105 │   readonly issuer: string;
  106 │   /** The CA's certificate URL (for re-download and revocation bookkeeping). */
  107 │   readonly certificateUrl: string;
  108 │   readonly orderUrl: string;
  109 │ }

0.79 packages/alchemy/src/AWS/Account/Region.ts:39:3
  22 │ export interface RegionProps {
  23 │   /**
  24 │    * Name of the Region to manage, e.g. `ap-east-1`. Changing the Region
  25 │    * replaces the resource.
  26 │    */
  27 │   regionName: string;
  28 │   /**
  29 │    * Whether the Region should be opted in (enabled) for the account. Regions
  30 │    * that are `ENABLED_BY_DEFAULT` cannot be disabled — attempting to disable
  31 │    * one fails with a `ValidationException`.
  32 │    */
  33 │   enabled: boolean;
  34 │   /**
  35 │    * Account ID to operate on. Only usable from an Organizations management or
  36 │    * delegated-admin account with trusted access enabled; omit to target the
  37 │    * calling account.
  38 │    */
> 39 │   accountId?: string;
  40 │ }

0.79 packages/alchemy/src/AWS/AutoScaling/LaunchTemplate.ts:43:3
  40 │   /**
  41 │    * AMI ID to launch.
  42 │    */
> 43 │   imageId: string;

0.79 packages/alchemy/src/AWS/Batch/JobQueue.ts:314:11
  313 │         delete: Effect.fn(function* ({ output }) {
> 314 │           const name = output.jobQueueName;
  315 │           const existing = yield* describeOne(name);
  316 │           if (!existing || existing.status === "DELETED") return;

0.79 packages/alchemy/src/AWS/CostExplorer/AnomalySubscription.ts:21:3
  16 │ export interface AnomalySubscriber {
  17 │   /**
  18 │    * The destination — an email address (for `EMAIL`) or an SNS topic ARN
  19 │    * (for `SNS`).
  20 │    */
> 21 │   address: string;
  22 │   /**
  23 │    * How the subscriber is notified. `IMMEDIATE` frequency requires `SNS`
  24 │    * subscribers; `DAILY`/`WEEKLY` require `EMAIL`.
  25 │    */
  26 │   type: "EMAIL" | "SNS" | (string & {});
  27 │ }

0.79 packages/alchemy/src/AWS/DocDB/DBCluster.ts:141:5
  138 │     /** The load-balanced reader endpoint hostname. */
  139 │     readerEndpoint: string | undefined;
  140 │     /** The port the cluster accepts connections on. */
> 141 │     port: number | undefined;
  142 │     /** The database engine (`docdb`). */
  143 │     engine: string;

0.79 packages/alchemy/src/AWS/EC2/ClientVpnTargetNetworkAssociation.ts:46:3
  29 │ export interface ClientVpnTargetNetworkAssociation extends Resource<
  30 │   "AWS.EC2.ClientVpnTargetNetworkAssociation",
  31 │   ClientVpnTargetNetworkAssociationProps,
  32 │   {
  33 │     /** The AWS-generated association identifier. */
  34 │     associationId: ClientVpnTargetNetworkAssociationId;
  35 │     /** The associated Client VPN endpoint. */
  36 │     clientVpnEndpointId: ClientVpnEndpointId;
  37 │     /** The associated subnet; reference this output from ClientVpnRoute for ordering. */
  38 │     subnetId: SubnetId;
  39 │     /** The VPC containing the target subnet. */
  40 │     vpcId: VpcId;
  41 │     /** The observed association state. */
  42 │     status: ec2.AssociationStatusCode;
  43 │     /** Additional information about the association state. */
  44 │     statusMessage: string | undefined;
  45 │   },
> 46 │   never,
  47 │   Providers
  48 │ > {}

0.79 packages/alchemy/src/AWS/EC2/Instance.ts:491:15
  490 │             Stream.filter((instance) => {
> 491 │               const state = instance.State?.Name;
  492 │               return (
  493 │                 state === "pending" ||
  494 │                 state === "running" ||
  495 │                 state === "stopping" ||
  496 │                 state === "stopped"
  497 │               );
  498 │             }),

0.79 packages/alchemy/src/AWS/EC2/SecurityGroupRule.ts:121:5
  118 │     /**
  119 │      * The ID of the AWS account that owns the security group.
  120 │      */
> 121 │     groupOwnerId: string;

0.79 packages/alchemy/src/AWS/EC2/Vpc.ts:29:3
> 29 │   cidrBlock?: string;

0.79 packages/alchemy/src/AWS/ELBv2/ListenerRule.ts:36:3
  32 │ export class ListenerRulePriorityInUse extends Data.TaggedError(
  33 │   "ListenerRulePriorityInUse",
  34 │ )<{
  35 │   readonly listenerArn: string;
> 36 │   readonly priority: number;
  37 │   readonly message: string;
  38 │ }> {}

0.79 packages/alchemy/src/AWS/ELBv2/TargetGroupAttachment.ts:20:3
  12 │ export interface TargetGroupAttachmentProps {
  13 │   /** The target group to register the target with. Changing it replaces the attachment. */
  14 │   targetGroupArn: Input<TargetGroupArn> | TargetGroup;
  15 │   /**
  16 │    * The target ID: an instance ID (`instance` target type), an IP address
  17 │    * (`ip`), a Lambda function ARN (`lambda`), or an ALB ARN (`alb`). Changing
  18 │    * it replaces the attachment.
  19 │    */
> 20 │   targetId: string;
  21 │   /**
  22 │    * The port on which the target receives traffic. Defaults to the target
  23 │    * group port. Not applicable to `lambda` targets. Changing it replaces the
  24 │    * attachment.
  25 │    */
  26 │   port?: number;
  27 │   /**
  28 │    * The Availability Zone of the target. Set to `all` to register an IP
  29 │    * target outside the target group's VPC (e.g. an on-prem address). Changing
  30 │    * it replaces the attachment.
  31 │    */
  32 │   availabilityZone?: string;
  33 │ }

0.79 packages/alchemy/src/AWS/EventBridge/Archive.ts:181:15
  175 │         list: () =>
  176 │           Effect.gen(function* () {
  177 │             const { accountId, region } = yield* AWSEnvironment.current;
  178 │             const attrs: {
  179 │               archiveName: ArchiveName;
  180 │               archiveArn: ArchiveArn;
> 181 │               eventSourceArn: string;
  182 │             }[] = [];
  183 │             let nextToken: string | undefined;
  184 │             do {
  185 │               const page = yield* eventbridge.listArchives({
  186 │                 NextToken: nextToken,
  187 │               });
  188 │               for (const archive of page.Archives ?? []) {
  189 │                 if (!archive.ArchiveName) {
  190 │                   continue;
  191 │                 }
  192 │                 attrs.push({
  193 │                   archiveName: archive.ArchiveName,
  194 │                   archiveArn:
  195 │                     `arn:aws:events:${region}:${accountId}:archive/${archive.ArchiveName}` as ArchiveArn,
  196 │                   eventSourceArn: archive.EventSourceArn ?? "",
  197 │                 });
  198 │               }
  199 │               nextToken = page.NextToken;
  200 │             } while (nextToken);
  201 │             return attrs;
  202 │           }),

0.79 packages/alchemy/src/AWS/EventBridge/Connection.ts:26:3
  24 │ export interface ConnectionApiKeyAuthParameters {
  25 │   /** Header name the API key is sent under (e.g. `x-api-key`). */
> 26 │   apiKeyName: string;
  27 │   /** The API key value. Wrap with `Redacted.make(...)` — stored by EventBridge in Secrets Manager. */
  28 │   apiKeyValue: Redacted.Redacted<string>;
  29 │ }

0.79 packages/alchemy/src/AWS/IAM/Role.ts:580:17
  574 │           if (
  575 │             JSON.stringify(observedAssumePolicy ?? null) !==
  576 │             JSON.stringify(assumeRolePolicyDocument)
  577 │           ) {
  578 │             yield* iam
  579 │               .updateAssumeRolePolicy({
> 580 │                 RoleName: roleName,
  581 │                 PolicyDocument: stringifyPolicyDocument(
  582 │                   assumeRolePolicyDocument,
  583 │                 ),
  584 │               })
  585 │               .pipe(Effect.retry(invalidPrincipalRetry));
  586 │           }

0.79 packages/alchemy/src/AWS/IdentityCenter/AccountAssignment.ts:56:3
  39 │ export interface AccountAssignment extends Resource<
  40 │   "AWS.IdentityCenter.AccountAssignment",
  41 │   AccountAssignmentProps,
  42 │   {
  43 │     /** The Identity Center instance the assignment lives in. */
  44 │     instanceArn: string;
  45 │     /** The permission set provisioned to the target. */
  46 │     permissionSetArn: string;
  47 │     /** The user or group ID that was assigned. */
  48 │     principalId: string;
  49 │     /** Whether the principal is a `USER` or `GROUP`. */
  50 │     principalType: "USER" | "GROUP";
  51 │     /** The AWS account ID the assignment targets. */
  52 │     targetId: string;
  53 │     /** The target type (`AWS_ACCOUNT`). */
  54 │     targetType: "AWS_ACCOUNT";
  55 │   },
> 56 │   never,
  57 │   Providers
  58 │ > {}

0.79 packages/alchemy/src/AWS/Kendra/SearchIndex.ts:270:3
  267 │ export class IndexProvisioningFailed extends Data.TaggedError(
  268 │   "IndexProvisioningFailed",
  269 │ )<{
> 270 │   readonly id: string;
  271 │   readonly message: string | undefined;
  272 │ }> {}

0.79 packages/alchemy/src/AWS/Organizations/DelegatedAdministrator.ts:184:29
  168 │                   Effect.map((services) =>
  169 │                     services
  170 │                       .filter(
  171 │                         (
  172 │                           service,
  173 │                         ): service is organizations.DelegatedService & {
  174 │                           ServicePrincipal: string;
  175 │                         } => service.ServicePrincipal != null,
  176 │                       )
  177 │                       .map(
  178 │                         (service) =>
  179 │                           ({
  180 │                             accountId: admin.Id,
  181 │                             accountArn: admin.Arn,
  182 │                             accountName: unredact(admin.Name),
  183 │                             accountEmail: unredact(admin.Email),
> 184 │                             servicePrincipal: service.ServicePrincipal,
  185 │                             delegationEnabledDate:
  186 │                               service.DelegationEnabledDate ??
  187 │                               admin.DelegationEnabledDate,
  188 │                           }) satisfies DelegatedAdministrator["Attributes"],
  189 │                       ),
  190 │                   ),

0.79 packages/alchemy/src/AWS/QBusiness/Application.ts:141:3
> 141 │   never,
  142 │   Providers
  143 │ > {}

0.79 packages/alchemy/src/AWS/QBusiness/Retriever.ts:27:3
> 27 │   applicationId: string;

0.79 packages/alchemy/src/AWS/QBusiness/WebExperience.ts:114:2
  104 │ /**
  105 │  * An Amazon Q Business web experience — the hosted chat UI end users open
  106 │  * to converse with an application.
  107 │  *
  108 │  * ### Creating Web Experiences
  109 │  * **Example:** Basic Web Experience
  110 │  * ```typescript
  111 │  * import * as AWS from "alchemy/AWS";
  112 │  *
  113 │  * const web = yield* AWS.QBusiness.WebExperience("Chat", {
> 114 │  *   applicationId: app.applicationId,

0.79 packages/alchemy/src/AWS/RDS/DBCluster.ts:229:5
  226 │     /**
  227 │      * Identifier of the cluster.
  228 │      */
> 229 │     dbClusterIdentifier: string;

0.79 packages/alchemy/src/AWS/S3Control/AccessPoint.ts:284:9
  280 │       const toAttrs = (
  281 │         name: string,
  282 │         live: s3control.GetAccessPointResult,
  283 │         region: RegionID,
> 284 │         accountId: AccountID,
  285 │       ) => ({
  286 │         accessPointName: name,
  287 │         accessPointArn:
  288 │           live.AccessPointArn ?? accessPointArn(region, accountId, name),
  289 │         alias: live.Alias,
  290 │         bucket: live.Bucket ?? "",
  291 │         networkOrigin: live.NetworkOrigin ?? "Internet",
  292 │         region,
  293 │         accountId,
  294 │       });

0.79 packages/alchemy/src/AWS/SNS/PlatformApplication.ts:241:3
  240 │ const toApplicationName = Effect.fn(function* (
> 241 │   id: string,
  242 │   props: Pick<PlatformApplicationProps, "name">,
  243 │ ) {
  244 │   if (props.name) {
  245 │     return props.name;
  246 │   }
  247 │   return yield* createPhysicalName({ id, maxLength: 256 });
  248 │ });

0.79 packages/alchemy/src/Cloudflare/Access/CustomPage.ts:42:5
  37 │ export type CustomPage = Resource<
  38 │   "Cloudflare.Access.CustomPage",
  39 │   CustomPageProps,
  40 │   {
  41 │     /** UUID of the custom page assigned by Cloudflare. */
> 42 │     customPageId: string;
  43 │     /** Cloudflare account that owns the custom page. */
  44 │     accountId: string;
  45 │     /** Display name reported by Cloudflare. */
  46 │     name: string;
  47 │     /** The Access event type the page is shown for. */
  48 │     type: CustomPageType;
  49 │   },
  50 │   never,
  51 │   Providers
  52 │ >;

0.79 packages/alchemy/src/Cloudflare/Addressing/AddressMap.ts:101:3
   97 │ export type AddressMap = Resource<
   98 │   TypeId,
   99 │   AddressMapProps,
  100 │   AddressMapAttributes,
> 101 │   never,
  102 │   Providers
  103 │ >;

0.79 packages/alchemy/src/Cloudflare/Addressing/ServiceBinding.ts:20:3
  15 │ export interface ServiceBindingProps {
  16 │   /**
  17 │    * Identifier of the parent BYOIP prefix. Changing it forces a
  18 │    * replacement.
  19 │    */
> 20 │   prefixId: string;
  21 │   /**
  22 │    * IP Prefix in Classless Inter-Domain Routing format to bind. Must be
  23 │    * contained in the parent prefix. Changing it forces a replacement.
  24 │    */
  25 │   cidr: string;
  26 │   /**
  27 │    * Identifier of the Cloudflare service (CDN, Spectrum, Magic Transit) to
  28 │    * bind the CIDR to. Service IDs are discoverable via the
  29 │    * `addressing.listServices` catalog. Changing it forces a replacement.
  30 │    */
  31 │   serviceId: string;
  32 │ }

0.79 packages/alchemy/src/Cloudflare/AI/GatewayDynamicRouting.ts:81:3
   77 │ export type RouteRateElement = {
   78 │   /**
   79 │    * Unique element identifier within the route graph.
   80 │    */
>  81 │   id: string;
   82 │   type: "rate";
   83 │   properties: {
   84 │     /**
   85 │      * Key the limit is bucketed by.
   86 │      */
   87 │     key: string;
   88 │     /**
   89 │      * Maximum count/cost allowed inside the window.
   90 │      */
   91 │     limit: number;
   92 │     /**
   93 │      * Whether the limit counts requests or cost.
   94 │      */
   95 │     limitType: "count" | "cost";
   96 │     /**
   97 │      * Window size in seconds.
   98 │      */
   99 │     window: number;
  100 │   };
  101 │   /**
  102 │    * Edges taken when under (success) or over (fallback) the limit.
  103 │    */
  104 │   outputs: { success: RouteEdge; fallback: RouteEdge };
  105 │ };

0.79 packages/alchemy/src/Cloudflare/AI/SearchToken.ts:63:3
  60 │   /**
  61 │    * Id of the underlying Cloudflare API token.
  62 │    */
> 63 │   cfApiId: string;

0.79 packages/alchemy/src/Cloudflare/Argo/SmartRouting.ts:20:3
  14 │ export type SmartRoutingProps = {
  15 │   /**
  16 │    * Zone the Argo Smart Routing setting belongs to. Stable — changing the
  17 │    * zone triggers a replacement (the old zone's setting is restored to
  18 │    * the value it had before Alchemy managed it).
  19 │    */
> 20 │   zoneId: string;
  21 │   /**
  22 │    * Whether Argo Smart Routing is enabled on the zone. Mutable — patched
  23 │    * in place.
  24 │    *
  25 │    * @default true
  26 │    */
  27 │   enabled?: boolean;
  28 │ };

0.79 packages/alchemy/src/Cloudflare/BotManagement/BotManagement.ts:161:3
  157 │ export type BotManagement = Resource<
  158 │   TypeId,
  159 │   Props,
  160 │   Attributes,
> 161 │   never,
  162 │   Providers
  163 │ >;

0.79 packages/alchemy/src/Cloudflare/Cache/RegionalTieredCache.ts:21:3
  15 │ export interface RegionalTieredCacheProps {
  16 │   /**
  17 │    * Zone whose Regional Tiered Cache setting is managed. Stable —
  18 │    * changing the zone triggers a replacement (the old zone's setting is
  19 │    * restored to the value it had before Alchemy managed it).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Whether Regional Tiered Cache is enabled on the zone (`value: "on"`)
  24 │    * or disabled (`value: "off"`). Mutable — patched in place.
  25 │    * @default true
  26 │    */
  27 │   enabled?: boolean;
  28 │ }

0.79 packages/alchemy/src/Cloudflare/Containers/StartContainer.ts:121:3
  118 │   const RATE_LIMIT_RETRIES = 5;
  119 │   // Light retry for the real request only — covers the transient
  120 │   // "Network connection lost" window when a container instance is recycled.
> 121 │   const REQUEST_RETRIES = 3;

0.79 packages/alchemy/src/Cloudflare/Devices/DefaultProfile.ts:161:5
  158 │   DeviceDefaultProfileProps,
  159 │   {
  160 │     /** Account that owns the default profile. */
> 161 │     accountId: string;
  162 │     /** Observed split-tunnel mode. */
  163 │     mode: "include" | "exclude";

0.79 packages/alchemy/src/Cloudflare/Devices/PostureIntegration.ts:118:3
  114 │ export type DevicePostureIntegration = Resource<
  115 │   TypeId,
  116 │   DevicePostureIntegrationProps,
  117 │   DevicePostureIntegrationAttributes,
> 118 │   never,
  119 │   Providers
  120 │ >;

0.79 packages/alchemy/src/Cloudflare/DNS/View.ts:53:3
  49 │ export type View = Resource<
  50 │   DnsViewTypeId,
  51 │   ViewProps,
  52 │   ViewAttributes,
> 53 │   never,
  54 │   Providers
  55 │ >;

0.79 packages/alchemy/src/Cloudflare/Email/AllowPolicy.ts:226:11
  223 │       // 2. Ensure — create when missing.
  224 │       if (!observed) {
  225 │         const created = yield* emailSecurity.createSettingAllowPolicy({
> 226 │           accountId,
  227 │           ...desired,
  228 │         });
  229 │         return toAttributes(created, accountId);
  230 │       }

0.79 packages/alchemy/src/Cloudflare/Email/Routing.ts:55:3
  45 │ export type Routing = Resource<
  46 │   "Cloudflare.Email.Routing",
  47 │   RoutingProps,
  48 │   {
  49 │     routingId: string;
  50 │     zoneId: string;
  51 │     name: string;
  52 │     enabled: boolean;
  53 │     status: RoutingStatus | undefined;
  54 │   },
> 55 │   never,
  56 │   Providers
  57 │ >;

0.79 packages/alchemy/src/Cloudflare/Flagship/App.ts:27:3
  22 │ export type AppAttributes = {
  23 │   /**
  24 │    * Server-generated app identifier. Stable across updates; used as the
  25 │    * `appId` for flags, the Worker binding, and all evaluation calls.
  26 │    */
> 27 │   appId: string;
  28 │   /**
  29 │    * The Cloudflare account the app belongs to.
  30 │    */
  31 │   accountId: string;
  32 │   /**
  33 │    * Human readable app name.
  34 │    */
  35 │   name: string;
  36 │   /**
  37 │    * When the app was created.
  38 │    */
  39 │   createdAt: string;
  40 │   /**
  41 │    * When the app was last modified.
  42 │    */
  43 │   updatedAt: string;
  44 │   /**
  45 │    * Email of the actor who last modified the app, or `edge-gateway` for
  46 │    * gateway-authenticated changes.
  47 │    */
  48 │   updatedBy: string;
  49 │ };

0.79 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:30:3
  26 │ export interface FlagshipAuth {
  27 │   authorize: <A, E>(
  28 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  29 │   ) => Effect.Effect<A, E>;
> 30 │   accountId: string;
  31 │ }

0.79 packages/alchemy/src/Cloudflare/Gateway/Rule.ts:161:1
  155 │ export type Rule = Resource<
  156 │   "Cloudflare.Gateway.Rule",
  157 │   RuleProps,
  158 │   RuleAttributes,
  159 │   never,
  160 │   Providers
> 161 │ >;

0.79 packages/alchemy/src/Cloudflare/Images/Variant.ts:381:3
  379 │ const toAttributes = (
  380 │   variant: ObservedVariant,
> 381 │   accountId: string,
  382 │ ): VariantAttributes => ({
  383 │   variantName: variant.id,
  384 │   accountId,
  385 │   // Distilled widens generated string enums to open unions (`string & {}`).
  386 │   fit: variant.options.fit as VariantFit,
  387 │   width: variant.options.width,
  388 │   height: variant.options.height,
  389 │   metadata: variant.options.metadata as VariantMetadata,
  390 │   neverRequireSignedURLs: variant.neverRequireSignedURLs ?? false,
  391 │ });

0.79 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CatalogSync.ts:261:11
  258 │     delete: Effect.fn(function* ({ output }) {
  259 │       yield* mcn
  260 │         .deleteCatalogSync({
> 261 │           accountId: output.accountId,
  262 │           syncId: output.syncId,
  263 │           deleteDestination: output.deleteDestination,
  264 │         })
  265 │         .pipe(Effect.catchTag("CatalogSyncNotFound", () => Effect.void));
  266 │     }),

0.79 packages/alchemy/src/Cloudflare/ManagedTransforms/ManagedTransforms.ts:85:3
   83 │ export interface Attributes {
   84 │   /** Zone that owns these managed transforms. */
>  85 │   zoneId: string;
   86 │   /** Observed state of every managed request transform on the zone. */
   87 │   requestHeaders: ManagedTransformState[];
   88 │   /** Observed state of every managed response transform on the zone. */
   89 │   responseHeaders: ManagedTransformState[];
   90 │   /**
   91 │    * Snapshot of every request transform's enabled state observed **before**
   92 │    * this resource first wrote to the zone. `delete` restores the ids this
   93 │    * resource managed to these values.
   94 │    */
   95 │   initialRequestHeaders: Record<string, boolean>;
   96 │   /**
   97 │    * Snapshot of every response transform's enabled state observed
   98 │    * **before** this resource first wrote to the zone. `delete` restores the
   99 │    * ids this resource managed to these values.
  100 │    */
  101 │   initialResponseHeaders: Record<string, boolean>;
  102 │ }

0.79 packages/alchemy/src/Cloudflare/OriginPostQuantumEncryption/OriginPostQuantumEncryption.ts:32:3
  26 │ export type Props = {
  27 │   /**
  28 │    * Zone the Origin Post-Quantum Encryption setting belongs to. Stable —
  29 │    * changing the zone triggers a replacement (the old zone's setting is
  30 │    * restored to the value it had before Alchemy managed it).
  31 │    */
> 32 │   zoneId: string;
  33 │   /**
  34 │    * Desired value of the setting. Mutable — updated in place.
  35 │    *
  36 │    * @default "supported"
  37 │    */
  38 │   value?: Value;
  39 │ };

0.79 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameCertificate.ts:77:3
  73 │ export type HostnameCertificate = Resource<
  74 │   TypeId,
  75 │   HostnameCertificateProps,
  76 │   HostnameCertificateAttributes,
> 77 │   never,
  78 │   Providers
  79 │ >;

0.79 packages/alchemy/src/Cloudflare/R2/Bucket.ts:1381:2
  1375 │ /**
  1376 │  * Local (dev) provider — the bucket is purely virtual: a `dev:`-prefixed
  1377 │  * bucket name keyed into the local workerd R2 simulator (data under
  1378 │  * `.alchemy/local/r2`). `toRuntimeBinding` lowers an `r2_bucket` binding
  1379 │  * whose bucket name is `dev:`-prefixed onto the local R2 service. R2 has no
  1380 │  * opaque id — the name IS the identity — so the `dev:` marker rides on the
> 1381 │  * name (a `:` can never appear in a real R2 bucket name).

0.79 packages/alchemy/src/Cloudflare/RealtimeKit/App.ts:244:3
  240 │ type ObservedApp = {
  241 │   id?: string | null;
  242 │   createdAt?: string | null;
  243 │   name?: string | null;
> 244 │   accountId: string;
  245 │ };

0.79 packages/alchemy/src/Cloudflare/Tags/ZoneResourceTags.ts:67:3
> 67 │   resourceId: string;

0.79 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:24:3
  20 │ export interface SearchIndexAuth {
  21 │   authorize: <A, E>(
  22 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  23 │   ) => Effect.Effect<A, E>;
> 24 │   accountId: string;
  25 │ }

0.79 packages/alchemy/src/Cloudflare/VulnerabilityScanner/TargetEnvironment.ts:40:3
  36 │ export interface VulnScannerTargetEnvironmentAttributes {
  37 │   /** Server-assigned target environment identifier (UUID). */
  38 │   targetEnvironmentId: string;
  39 │   /** The Cloudflare account the target environment belongs to. */
> 40 │   accountId: string;
  41 │   /** Human-readable name. */
  42 │   name: string;
  43 │   /** The zone being scanned (`target.zone_tag`). */
  44 │   zoneId: string;
  45 │   /** Description, if set. */
  46 │   description: string | undefined;
  47 │ }

0.79 packages/alchemy/src/Cloudflare/Web3/ContentList.ts:47:3
  41 │ export interface HostnameContentListProps {
  42 │   /**
  43 │    * The zone the hostname belongs to.
  44 │    *
  45 │    * Stable — moving to another zone triggers a replacement.
  46 │    */
> 47 │   zoneId: string;
  48 │   /**
  49 │    * The Web3 hostname the content list belongs to. Must be an
  50 │    * `ipfs_universal_path` hostname — other targets reject content-list
  51 │    * operations.
  52 │    *
  53 │    * Stable — pointing at another hostname triggers a replacement.
  54 │    */
  55 │   hostnameId: string;
  56 │   /**
  57 │    * Behavior of the content list. Cloudflare currently only supports
  58 │    * `block`.
  59 │    * @default "block"
  60 │    */
  61 │   action?: "block";
  62 │   /**
  63 │    * The full desired set of content list entries. The list is replaced
  64 │    * declaratively on every change (bulk PUT) — entries not present here
  65 │    * are removed.
  66 │    * @default []
  67 │    */
  68 │   entries?: ContentListEntry[];
  69 │ }

0.79 packages/alchemy/src/Fly/Website/StaticSite.ts:201:9
  198 │     const internal = staticConfigFromAssets(props.assets);
  199 │     const notFoundHandling =
  200 │       internal.errorPage !== undefined
> 201 │         ? ("404-page" as const)
  202 │         : internal.spa === true
  203 │           ? ("spa" as const)
  204 │           : ("none" as const);

0.79 packages/alchemy/src/GitHub/Label.ts:364:3
  358 │ const attrsOf = (data: {
  359 │   id: number;
  360 │   node_id: string;
  361 │   name: string;
  362 │   color: string;
  363 │   description: string | null;
> 364 │   url: string;
  365 │   default: boolean;
  366 │ }) => ({
  367 │   labelId: data.id,
  368 │   nodeId: data.node_id,
  369 │   name: data.name,
  370 │   color: data.color,
  371 │   description: data.description,
  372 │   url: data.url,
  373 │   default: data.default,
  374 │ });

0.79 packages/alchemy/src/Hetzner/hosted.ts:41:3
  38 │ class VolumeAttachTimeout extends Data.TaggedError(
  39 │   "Hetzner.VolumeAttachTimeout",
  40 │ )<{
> 41 │   volumeId: number;
  42 │   serverId: number;
  43 │ }> {}

0.79 packages/alchemy/src/Hetzner/PlacementGroup.ts:61:5
  57 │   {
  58 │     /**
  59 │      * Numeric Hetzner Placement Group ID.
  60 │      */
> 61 │     id: number;
  62 │     /**
  63 │      * Name of the Placement Group. Unique per project.
  64 │      */
  65 │     name: string;
  66 │     /**
  67 │      * Placement strategy. Currently always `spread`.
  68 │      */
  69 │     type: PlacementGroupType;
  70 │     /**
  71 │      * User-defined labels (Alchemy ownership labels stripped).
  72 │      */
  73 │     labels: Record<string, string>;
  74 │     /**
  75 │      * RFC3339 timestamp of when the Placement Group was created.
  76 │      */
  77 │     created: string;
  78 │     /**
  79 │      * IDs of Servers currently assigned to this group. Server
  80 │      * attachment is configured on the Server resource.
  81 │      */
  82 │     servers: number[];
  83 │   },

0.79 packages/alchemy/src/Hetzner/PrimaryIp.ts:254:3
  253 │ const createPrimaryIpName = (
> 254 │   id: string,
  255 │   name: string | undefined,
  256 │   existing?: string,
  257 │ ) =>
  258 │   Effect.gen(function* () {
  259 │     return (
  260 │       name ?? existing ?? (yield* createPhysicalName({ id, maxLength: 63 }))
  261 │     );
  262 │   });

0.79 packages/alchemy/src/Hetzner/Server.ts:101:3
> 101 │   serverType: string;

0.79 packages/alchemy/src/Infisical/AuthProvider.ts:72:3
  70 │ export interface InfisicalResolvedCredentials {
  71 │   readonly token: Redacted.Redacted<string>;
> 72 │   readonly apiBaseUrl: string;
  73 │ }

0.79 packages/alchemy/src/Neon/AuthTrustedDomain.ts:30:3
  26 │ export interface AuthTrustedDomain extends Resource<
  27 │   "Neon.AuthTrustedDomain",
  28 │   AuthTrustedDomainProps,
  29 │   AuthTrustedDomainAttributes,
> 30 │   never,
  31 │   Providers
  32 │ > {}

0.79 packages/alchemy/src/Neon/OrganizationMemberRole.ts:101:3
   99 │ /** Validate scope without performing cloud I/O. @internal */
  100 │ export const validateGovernanceScope = (
> 101 │   scope: { orgId: string; memberId: string } | undefined,
  102 │ ) =>
  103 │   typeof scope?.orgId === "string" &&
  104 │   scope.orgId.trim().length > 0 &&
  105 │   typeof scope.memberId === "string" &&
  106 │   scope.memberId.trim().length > 0
  107 │     ? Effect.void
  108 │     : Effect.fail(
  109 │         new GovernanceRoleSafetyError({
  110 │           message:
  111 │             "An explicit organization ID and existing membership ID are required",
  112 │         }),
  113 │       );

0.79 packages/alchemy/src/Prisma/Deployment.ts:120:4
  117 │    *
  118 │    * @example
  119 │    * ```typescript
> 120 │    * const deployment = yield* Prisma.Deployment("web", {

0.79 packages/alchemy/src/State/ResourceState.ts:45:3
  42 │   /** Logical ID of the Resource (stable across creates, updates, deletes and replaces) */
  43 │   logicalId: string;
  44 │   /** A unique randomly generated token used to seed ID generation (only changes when replaced) */
> 45 │   instanceId: string;
  46 │   /** The version of the provider that was used to create/update the resource. */
  47 │   providerVersion: number;

0.79 packages/alchemy/src/Stripe/AccountPerson.ts:81:3
> 81 │   account: string;

0.79 packages/alchemy/src/Stripe/Alert.ts:206:1
  204 │ type AlertAttributes = Alert["Attributes"];
  205 │
> 206 │ const toTitle = (id: string, title: string | undefined, existing?: string) =>
  207 │   Effect.gen(function* () {
  208 │     return (
  209 │       title ??
  210 │       existing ??
  211 │       (yield* createPhysicalName({ id, maxLength: TITLE_MAX_LENGTH }))
  212 │     );
  213 │   });

0.79 packages/alchemy/src/Stripe/FileLink.ts:181:3
  178 │ const listUnexpired = () => paginateFileLinks({ expired: false });
  179 │
  180 │ const findByAlchemyId = Effect.fn(function* (
> 181 │   id: string,
  182 │   links: ReadonlyArray<StripeFileLink>,
  183 │ ) {
  184 │   const matches: StripeFileLink[] = [];
  185 │   for (const link of links) {
  186 │     if (link.expired) continue;
  187 │     if (yield* hasAlchemyMetadata(id, tagRecord(link.metadata))) {
  188 │       matches.push(link);
  189 │     }
  190 │   }
  191 │   matches.sort((a, b) => b.created - a.created);
  192 │   return matches[0];
  193 │ });

0.79 packages/alchemy/src/Stripe/IssuingCardholder.ts:266:5
  263 │   IssuingCardholderProps,
  264 │   {
  265 │     /** Stripe issuing cardholder id (`ich_…`). */
> 266 │     id: string;
  267 │     /** The cardholder's name, printed on cards. */
  268 │     name: string;

0.79 packages/alchemy/src/Stripe/TaxRegistration.ts:481:3
  480 │ const identityKey = (
> 481 │   country: string,
  482 │   options: TaxRegistrationCountryOptions,
  483 │ ): string => {
  484 │   const parts: string[] = [];
  485 │   for (const [code, option] of Object.entries(options)) {
  486 │     if (option == null || typeof option !== "object") continue;
  487 │     const record = option as unknown as Record<string, unknown>;
  488 │     const type = typeof record.type === "string" ? record.type : "";
  489 │     const state = typeof record.state === "string" ? record.state : "";
  490 │     const provinceStandard = record.provinceStandard as
  491 │       | { province?: string }
  492 │       | undefined;
  493 │     const province = provinceStandard?.province ?? "";
  494 │     parts.push(`${code}:${type}:${state}:${province}`);
  495 │   }
  496 │   parts.sort();
  497 │   return `${country.toUpperCase()}|${parts.join(",")}`;
  498 │ };

0.79 packages/alchemy/src/Stripe/TerminalConfiguration.ts:361:5
  356 │ export type TerminalConfiguration = Resource<
  357 │   "Stripe.TerminalConfiguration",
  358 │   TerminalConfigurationProps,
  359 │   {
  360 │     /** Stripe Terminal configuration id (`tmc_…`). */
> 361 │     id: string;
  362 │     /** Display name of the configuration, if set. */
  363 │     name: string | undefined;
  364 │     /** Whether this is the account's default configuration. */
  365 │     isAccountDefault: boolean;
  366 │     /** Offline transaction collection, if configured. */
  367 │     offline: TerminalOffline | undefined;
  368 │     /** On-reader tipping by currency, if configured. */
  369 │     tipping: TerminalTipping | undefined;
  370 │     /** Daily reboot window, if configured. */
  371 │     rebootWindow: TerminalRebootWindow | undefined;
  372 │     /** Cellular connectivity, if configured. */
  373 │     cellular: TerminalCellular | undefined;
  374 │     /** Observed Wi-Fi (passwords omitted). */
  375 │     wifi: TerminalWifiState | undefined;
  376 │     /** Whether the configuration exists in live mode. */
  377 │     livemode: boolean;
  378 │   } & DeviceAttributes,
  379 │   never,
  380 │   Providers
  381 │ >;

0.79 packages/alchemy/test/AWS/Route53Resolver/helpers.ts:41:3
> 41 │   return { vpcId: vpc.vpcId as string, subnetIds, securityGroupId };
  42 │ }).pipe(Effect.orDie);

0.79 packages/alchemy/test/Cloudflare/Container/fixtures/publication/applications.ts:6:3
   3 │ import * as Output from "@/Output.ts";
   4 │
   5 │ export const publicationApplications = (contexts: {
>  6 │   shared: string;
   7 │   other: string;
   8 │   changed: string;
   9 │ }) =>
  10 │   Effect.gen(function* () {
  11 │     const first = yield* Cloudflare.Container("PublicationFirst", {
  12 │       context: contexts.shared,
  13 │       env: { SLOT: "first" },
  14 │       maxInstances: 2,
  15 │     }).Application;
  16 │     const second = yield* Cloudflare.Container("PublicationSecond", {
  17 │       context: contexts.shared,
  18 │       env: { SLOT: "second" },
  19 │       maxInstances: 3,
  20 │     }).Application;
  21 │     const other = yield* Cloudflare.Container("PublicationOtherContext", {
  22 │       context: contexts.other,
  23 │       maxInstances: 2,
  24 │     }).Application;
  25 │     const changed = yield* Cloudflare.Container("PublicationChangedContent", {
  26 │       context: contexts.changed,
  27 │       maxInstances: 2,
  28 │     }).Application;
  29 │     return { first, second, other, changed };
  30 │   });

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-do-namespace-do-rpc/worker.ts:46:11
  45 │         if (request.method === "GET" && action === "stream") {
> 46 │           const upto = Number(url.searchParams.get("upto") ?? "5");
  47 │           const body = Stream.unwrap(
  48 │             Effect.map(counters.getByName(id), (client) =>
  49 │               client.CountUpTo({ upto }).pipe(
  50 │                 Stream.map((n) => new TextEncoder().encode(`${n}\n`)),
  51 │                 Stream.orDie,
  52 │               ),
  53 │             ),
  54 │           );
  55 │           return HttpServerResponse.stream(body, {
  56 │             headers: { "content-type": "text/plain" },
  57 │           });
  58 │         }

0.79 packages/alchemy/test/Fly/fixtures/bluegreen-api.ts:22:11
  13 │     {
  14 │       app: Site,
  15 │       main: import.meta.url,
  16 │       env: { VERSION: version },
  17 │       deploy: { strategy: "bluegreen", healthTimeout: "30 seconds" },
  18 │       shutdown: { timeout: "30 seconds" },
  19 │       services: [
  20 │         {
  21 │           protocol: "tcp",
> 22 │           internalPort: 3000,
  23 │           autostop: "off",
  24 │           ports: [{ port: 80, handlers: ["http"] }],
  25 │           checks: [
  26 │             {
  27 │               type: "http",
  28 │               port: 3000,
  29 │               path: "/health",
  30 │               interval: "2s",
  31 │               timeout: "1s",
  32 │             },
  33 │           ],
  34 │         },
  35 │       ],
  36 │     },

0.79 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:23:7
  19 │     {
  20 │       app: LedgerSite,
  21 │       main: import.meta.url,
  22 │       region: "iad",
> 23 │       port: 3000,
  24 │       guest: { cpuKind: "shared", cpus: 1, memoryMb: 256 },
  25 │       env: { SECRET_READY: secretDigest ?? "" },
  26 │       services,
  27 │     },

0.79 packages/alchemy/test/Fly/fixtures/sprite.ts:15:5
  12 │   {
  13 │     main: import.meta.url,
  14 │     urlAuth: "public",
> 15 │     port: 3000,
  16 │   },

0.79 packages/cloudflare-runtime/src/core/bindings/Flagship.ts:3:1
   1 │ import { makeRemoteBinding } from "../remote-bindings/RemoteBindings.ts";
   2 │
>  3 │ export const remote = (binding: string, appId: string) =>
   4 │   makeRemoteBinding(
   5 │     {
   6 │       name: binding,
   7 │       type: "flagship",
   8 │       appId,
   9 │     },
  10 │     (service) => ({
  11 │       name: binding,
  12 │       service,
  13 │     }),
  14 │   );

0.79 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/configuration.ts:17:5
  10 │ export const applyRouterConfigDefaults = (
  11 │   configuration?: RouterConfig,
  12 │ ): Required<RouterConfig> => {
  13 │   return {
  14 │     invoke_user_worker_ahead_of_assets:
  15 │       configuration?.invoke_user_worker_ahead_of_assets ?? false,
  16 │     has_user_worker: configuration?.has_user_worker ?? false,
> 17 │     account_id: configuration?.account_id ?? -1,
  18 │     script_id: configuration?.script_id ?? -1,
  19 │     debug: configuration?.debug ?? false,
  20 │     static_routing: configuration?.static_routing ?? {
  21 │       user_worker: [],
  22 │     },
  23 │   };
  24 │ };

0.79 packages/pkg/src/Manifest.ts:43:3
  31 │ export const ManifestPackage = Schema.Struct({
  32 │   name: PackageName,
  33 │   /** Version from the package manifest at pack time. */
  34 │   version: Schema.String,
  35 │   /** Package directory relative to the workspace root, POSIX separators. */
  36 │   dir: Schema.String,
  37 │   group: GroupName,
  38 │   /** Tarball file name inside the artifact directory. */
  39 │   file: Schema.String,
  40 │   /** Lowercase hex SHA-256 of the tarball bytes. */
  41 │   sha256: Schema.String,
  42 │   /** Tarball size in bytes. */
> 43 │   size: Schema.Number,
  44 │ });
  45 │ export type ManifestPackage = typeof ManifestPackage.Type;

0.78 packages/alchemy/src/AWS/Account/AlternateContact.ts:41:3
  21 │ export interface AlternateContactProps {
  22 │   /**
  23 │    * Which alternate contact slot to set: `BILLING`, `OPERATIONS`, or
  24 │    * `SECURITY`. Each account holds at most one contact per type; changing the
  25 │    * type replaces the resource.
  26 │    */
  27 │   alternateContactType: AlternateContactType;
  28 │   /** Name of the alternate contact. */
  29 │   name: string;
  30 │   /** Title of the alternate contact. */
  31 │   title: string;
  32 │   /** Email address of the alternate contact. */
  33 │   emailAddress: string;
  34 │   /** Phone number of the alternate contact. */
  35 │   phoneNumber: string;
  36 │   /**
  37 │    * Account ID to operate on. Only usable from an Organizations management or
  38 │    * delegated-admin account with trusted access enabled; omit to target the
  39 │    * calling account.
  40 │    */
> 41 │   accountId?: string;
  42 │ }

0.78 packages/alchemy/src/AWS/Account/ContactInformation.ts:59:3
  42 │ export interface ContactInformation extends Resource<
  43 │   "AWS.Account.ContactInformation",
  44 │   ContactInformationProps,
  45 │   {
  46 │     fullName: string;
  47 │     addressLine1: string;
  48 │     addressLine2?: string;
  49 │     addressLine3?: string;
  50 │     city: string;
  51 │     stateOrRegion?: string;
  52 │     districtOrCounty?: string;
  53 │     postalCode: string;
  54 │     countryCode: string;
  55 │     phoneNumber: string;
  56 │     companyName?: string;
  57 │     websiteUrl?: string;
  58 │   },
> 59 │   never,
  60 │   Providers
  61 │ > {}

0.78 packages/alchemy/src/AWS/ApiGateway/UsagePlanKey.ts:31:3
  22 │ export interface UsagePlanKey extends Resource<
  23 │   "AWS.ApiGateway.UsagePlanKey",
  24 │   UsagePlanKeyProps,
  25 │   {
  26 │     usagePlanId: string;
  27 │     keyId: string;
  28 │     keyType: string;
  29 │     name: string | undefined;
  30 │   },
> 31 │   never,
  32 │   Providers
  33 │ > {}

0.78 packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts:60:5
  56 │   {
  57 │     /**
  58 │      * ARN of the scaling policy.
  59 │      */
> 60 │     policyArn: string;
  61 │     /**
  62 │      * Name of the scaling policy.
  63 │      */
  64 │     policyName: ScalingPolicyName;
  65 │     /**
  66 │      * Name of the Auto Scaling Group the policy is attached to.
  67 │      */
  68 │     autoScalingGroupName: string;
  69 │     /**
  70 │      * Policy type (e.g. `TargetTrackingScaling`).
  71 │      */
  72 │     policyType: string;
  73 │     /**
  74 │      * Target value the tracked metric is held at.
  75 │      */
  76 │     targetValue: number;
  77 │     /**
  78 │      * Predefined metric being tracked.
  79 │      */
  80 │     predefinedMetricType: string;
  81 │     /**
  82 │      * CloudWatch alarms created by EC2 Auto Scaling to drive the policy.
  83 │      */
  84 │     alarms: string[];
  85 │   },

0.78 packages/alchemy/src/AWS/Cognito/IdentityProvider.ts:157:9
  156 │       const describeProvider = Effect.fn(function* (
> 157 │         userPoolId: string,
  158 │         providerName: string,
  159 │       ) {
  160 │         return yield* cip
  161 │           .describeIdentityProvider({
  162 │             UserPoolId: userPoolId,
  163 │             ProviderName: providerName,
  164 │           })
  165 │           .pipe(
  166 │             Effect.map((r) => r.IdentityProvider),
  167 │             Effect.catchTag("ResourceNotFoundException", () =>
  168 │               Effect.succeed(undefined),
  169 │             ),
  170 │           );
  171 │       });

0.78 packages/alchemy/src/AWS/Cognito/UserPoolDomain.ts:45:5
  38 │ export interface UserPoolDomain extends Resource<
  39 │   "AWS.Cognito.UserPoolDomain",
  40 │   UserPoolDomainProps,
  41 │   {
  42 │     /** The domain prefix or full custom domain name. */
  43 │     domain: string;
  44 │     /** The ID of the user pool the domain serves. */
> 45 │     userPoolId: string;
  46 │     /**
  47 │      * The CloudFront distribution domain fronting the hosted endpoint —
  48 │      * for custom domains, point a DNS alias record here.
  49 │      */
  50 │     cloudFrontDomain: string | undefined;
  51 │   },
  52 │   never,
  53 │   Providers
  54 │ > {}

0.78 packages/alchemy/src/AWS/Deadline/FarmEventSource.ts:18:3
  16 │ export interface FarmEventDetail {
  17 │   /** The farm the event is about. */
> 18 │   farmId?: string;
  19 │   /** Job/step/task and budget events: the queue the resource belongs to. */
  20 │   queueId?: string;
  21 │   /** Job/step/task events: the job the event is about. */
  22 │   jobId?: string;
  23 │   /** Step/task events: the step the event is about. */
  24 │   stepId?: string;
  25 │   /** Task events: the task the event is about. */
  26 │   taskId?: string;
  27 │   /** Fleet and worker events: the fleet the event is about. */
  28 │   fleetId?: string;
  29 │   /** Worker events: the worker the event is about. */
  30 │   workerId?: string;
  31 │   /** Budget Threshold Reached: the budget that crossed a threshold. */
  32 │   budgetId?: string;
  33 │   /** Status-change events: the status before the transition. */
  34 │   previousStatus?: string;
  35 │   /** Status-change events: the status after the transition. */
  36 │   status?: string;
  37 │   /** Additional event fields (the schema grows over time). */
  38 │   [key: string]: unknown;
  39 │ }

0.78 packages/alchemy/src/AWS/DirectoryService/ConditionalForwarder.ts:42:3
  29 │ export interface ConditionalForwarder extends Resource<
  30 │   "AWS.DirectoryService.ConditionalForwarder",
  31 │   ConditionalForwarderProps,
  32 │   {
  33 │     /** The ID of the directory the forwarder is attached to. */
  34 │     directoryId: string;
  35 │     /** The fully qualified domain name the forwarder resolves. */
  36 │     remoteDomainName: string;
  37 │     /** The IP addresses of the remote DNS servers. */
  38 │     dnsIpAddrs: string[];
  39 │     /** The replication scope of the forwarder, e.g. `Domain`. */
  40 │     replicationScope: string | undefined;
  41 │   },
> 42 │   never,
  43 │   Providers
  44 │ > {}

0.78 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:21:3
> 21 │   clusterName?: string;

0.78 packages/alchemy/src/AWS/EC2/DhcpOptions.ts:219:13
  216 │       const toAttrs = (opts: ec2.DhcpOptions, vpcId?: VpcId) =>
  217 │         AWSEnvironment.current.pipe(
  218 │           Effect.map((env) => ({
> 219 │             dhcpOptionsId: opts.DhcpOptionsId as DhcpOptionsId,
  220 │             dhcpOptionsArn:
  221 │               `arn:aws:ec2:${env.region}:${env.accountId}:dhcp-options/${opts.DhcpOptionsId}` as DhcpOptionsArn,
  222 │             ownerId: opts.OwnerId!,
  223 │             vpcId,
  224 │           })),
  225 │         );

0.78 packages/alchemy/src/AWS/EC2/hosted.ts:41:3
  39 │ export interface Ec2HostedProps extends PlatformProps {
  40 │   /** AMI ID to launch the instance from. */
> 41 │   imageId: string;
  42 │   /** EC2 instance type, e.g. `t3.micro`. */
  43 │   instanceType: string;

0.78 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:235:9
  234 │       ) => ({
> 235 │         networkAclId: props.networkAclId as NetworkAclId,
  236 │         ruleNumber: entry.RuleNumber!,
  237 │         egress: entry.Egress!,
  238 │         protocol: entry.Protocol!,
  239 │         ruleAction: entry.RuleAction!,
  240 │         cidrBlock: entry.CidrBlock,
  241 │         ipv6CidrBlock: entry.Ipv6CidrBlock,
  242 │         icmpTypeCode: entry.IcmpTypeCode
  243 │           ? {
  244 │               code: entry.IcmpTypeCode.Code,
  245 │               type: entry.IcmpTypeCode.Type,
  246 │             }
  247 │           : undefined,
  248 │         portRange: entry.PortRange
  249 │           ? {
  250 │               from: entry.PortRange.From,
  251 │               to: entry.PortRange.To,
  252 │             }
  253 │           : undefined,
  254 │       });

0.78 packages/alchemy/src/AWS/EC2/Volume.ts:241:9
  238 │       // logical-id-only tags are insufficient during replacement because the
  239 │       // old and new volume instances can coexist.
  240 │       const findVolumeByInstanceTags = Effect.fn(function* (
> 241 │         id: string,
  242 │         instanceId: string,
  243 │       ) {
  244 │         const filters = yield* createAlchemyTagFilters(id);
  245 │         const pages = yield* ec2.describeVolumes
  246 │           .pages({
  247 │             Filters: [
  248 │               ...filters,
  249 │               { Name: "tag:alchemy::instance", Values: [instanceId] },
  250 │             ],
  251 │           })
  252 │           .pipe(Stream.runCollect);
  253 │         return Array.from(pages)
  254 │           .flatMap((page) => page.Volumes ?? [])
  255 │           .find(
  256 │             (volume) =>
  257 │               volume.State !== "deleting" && volume.State !== "deleted",
  258 │           );
  259 │       });

0.78 packages/alchemy/src/AWS/ECS/TaskDefinition.ts:201:3
> 201 │   never,
  202 │   Providers
  203 │ > {}

0.78 packages/alchemy/src/AWS/FinSpace/Environment.ts:241:3
  238 │ export class EnvironmentProvisioningFailed extends Data.TaggedError(
  239 │   "EnvironmentProvisioningFailed",
  240 │ )<{
> 241 │   readonly environmentId: string;
  242 │   readonly status: string | undefined;
  243 │ }> {}

0.78 packages/alchemy/src/AWS/FinSpace/KxEnvironment.ts:181:3
  176 │ interface KxEnvironmentView {
  177 │   environmentId?: string;
  178 │   environmentArn?: string;
  179 │   name?: string;
  180 │   status?: KxEnvironmentStatus;
> 181 │   kmsKeyId?: string;
  182 │   description?: string;
  183 │   transitGatewayConfiguration?: TransitGatewayConfiguration;
  184 │   customDNSConfiguration?: CustomDNSServer[];
  185 │ }

0.78 packages/alchemy/src/AWS/GuardDuty/IPSet.ts:92:3
  73 │ export interface IPSet extends Resource<
  74 │   "AWS.GuardDuty.IPSet",
  75 │   IPSetProps,
  76 │   {
  77 │     /** ID of the detector the IP set belongs to. */
  78 │     detectorId: string;
  79 │     /** The auto-generated IP set ID. */
  80 │     ipSetId: string;
  81 │     /** ARN of the IP set. */
  82 │     ipSetArn: string;
  83 │     /** Display name of the IP set. */
  84 │     name: string;
  85 │     /** File format of the hosted list. */
  86 │     format: string;
  87 │     /** S3 URI of the hosted list. */
  88 │     location: string;
  89 │     /** Current status (`ACTIVE`, `INACTIVE`, `ACTIVATING`, `ERROR`, …). */
  90 │     status: string;
  91 │   },
> 92 │   never,
  93 │   Providers
  94 │ > {}

0.78 packages/alchemy/src/AWS/MedicalImaging/ImagingEventSource.ts:19:3
  17 │ export interface MedicalImagingEventDetail {
  18 │   /** Id of the data store the event originates from. */
> 19 │   datastoreId?: string;
  20 │   /** Data store lifecycle status on `Data Store …` events. */
  21 │   datastoreStatus?: string;
  22 │   /** Import job id on `Import Job …` events. */
  23 │   jobId?: string;
  24 │   /** Import job status (`SUBMITTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`). */
  25 │   jobStatus?: string;
  26 │   /** Image set id on `Image Set …` events. */
  27 │   imageSetId?: string;
  28 │   /** Image set state (`ACTIVE`, `LOCKED`, `DELETED`). */
  29 │   imageSetState?: string;
  30 │   /** Image set workflow status (`CREATED`, `COPIED`, `UPDATED`, …). */
  31 │   imageSetWorkflowStatus?: string;
  32 │   /** Additional event fields (the schema grows over time). */
  33 │   [key: string]: unknown;
  34 │ }

0.78 packages/alchemy/src/AWS/Organizations/common.ts:27:3
  24 │ export type OrganizationsTags = Record<string, string>;
  25 │
  26 │ export const createName = (
> 27 │   id: string,
  28 │   providedName: string | undefined,
  29 │   maxLength: number,
  30 │ ) =>
  31 │   providedName
  32 │     ? Effect.succeed(providedName)
  33 │     : createPhysicalName({
  34 │         id,
  35 │         maxLength,
  36 │       });

0.78 packages/alchemy/src/AWS/Redshift/Cluster.ts:41:3
> 41 │   clusterIdentifier?: string;

0.78 packages/alchemy/src/AWS/Redshift/internal.ts:38:3
  36 │ export const redshiftArn = (
  37 │   region: string,
> 38 │   accountId: string,
  39 │   resourceType:
  40 │     | "cluster"
  41 │     | "subnetgroup"
  42 │     | "parametergroup"
  43 │     | "eventsubscription",
  44 │   name: string,
  45 │ ): string => `arn:aws:redshift:${region}:${accountId}:${resourceType}:${name}`;

0.78 packages/alchemy/src/AWS/Scheduler/ScheduleEventSource.ts:181:3
  180 │ const toScheduleDescriptor = (
> 181 │   id: string | undefined,
  182 │   state: ScheduleBuilderState,
  183 │ ): ScheduleDescriptor => ({
  184 │   id: id ?? state.name,
  185 │   expression: state.expression,
  186 │   props: {
  187 │     group: state.group,
  188 │     description: state.description,
  189 │     state: state.state,
  190 │     timezone: state.timezone,
  191 │     startDate: state.startDate,
  192 │     endDate: state.endDate,
  193 │     kmsKeyArn: state.kmsKeyArn,
  194 │     flexibleTimeWindow: state.flexibleTimeWindow,
  195 │     actionAfterCompletion: state.actionAfterCompletion,
  196 │   },
  197 │ });

0.78 packages/alchemy/src/AWS/Textract/Adapter.ts:51:5
  46 │   {
  47 │     /**
  48 │      * Server-assigned identifier of the adapter (its identity). Pass it in
  49 │      * `AdaptersConfig` to `AnalyzeDocument` / `StartDocumentAnalysis`.
  50 │      */
> 51 │     adapterId: string;
  52 │     /**
  53 │      * ARN of the adapter. Textract uses a nonstandard resource path:
  54 │      * `arn:aws:textract:{region}:{account}:/adapters/{adapterId}`.
  55 │      */
  56 │     adapterArn: string;
  57 │     /**
  58 │      * Name of the adapter.
  59 │      */
  60 │     adapterName: string;
  61 │     /**
  62 │      * Feature types the adapter enhances (currently only `QUERIES`).
  63 │      */
  64 │     featureTypes: string[];
  65 │     /**
  66 │      * Whether the adapter auto-updates as the base model improves.
  67 │      */
  68 │     autoUpdate: string | undefined;
  69 │     /**
  70 │      * Creation time of the adapter as an ISO-8601 string.
  71 │      */
  72 │     creationTime: string | undefined;
  73 │   },

0.78 packages/alchemy/src/Axiom/View.ts:19:5
  10 │ export type View = Resource<
  11 │   "Axiom.View",
  12 │   ViewProps,
  13 │   Axiom.View & {
  14 │     /**
  15 │      * Path identifier used by `updateView` / `getView` / `deleteView`.
  16 │      * Currently derived from `name` because Axiom's view list/get responses
  17 │      * don't expose a separate id field.
  18 │      */
> 19 │     id: string;
  20 │   },
  21 │   never,
  22 │   Providers
  23 │ >;

0.78 packages/alchemy/src/Cloudflare/Access/IdentityProvider.ts:881:3
  878 │ const deleteIdp = (
  879 │   zoneId: string | undefined,
  880 │   accountId: string,
> 881 │   identityProviderId: string,
  882 │ ) =>
  883 │   zoneId !== undefined
  884 │     ? zeroTrust.deleteIdentityProviderForZone({ zoneId, identityProviderId })
  885 │     : zeroTrust.deleteIdentityProviderForAccount({
  886 │         accountId,
  887 │         identityProviderId,
  888 │       });

0.78 packages/alchemy/src/Cloudflare/AI/Evaluation.ts:47:3
> 47 │   evaluationId: string;

0.78 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:318:7
  315 │   const withRef = <A, E>(
  316 │     fn: (r: {
  317 │       name: string;
> 318 │       id: string;
  319 │     }) => Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  320 │   ) => Effect.flatMap(ref, (r) => run(auth, fn(r)));

0.78 packages/alchemy/src/Cloudflare/AI/SecuritySettings.ts:20:3
  14 │ export type SecuritySettingsProps = {
  15 │   /**
  16 │    * Zone the AI Security settings belong to. Stable — changing the zone
  17 │    * triggers a replacement (the old zone's setting is restored to the
  18 │    * value it had before Alchemy managed it).
  19 │    */
> 20 │   zoneId: string;
  21 │   /**
  22 │    * Whether AI Security for Apps (Firewall for AI) is enabled on the
  23 │    * zone. Mutable — toggled in place via PUT.
  24 │    *
  25 │    * @default false
  26 │    */
  27 │   enabled?: boolean;
  28 │ };

0.78 packages/alchemy/src/Cloudflare/Cache/SmartTieredCache.ts:20:3
  14 │ export interface SmartTieredCacheProps {
  15 │   /**
  16 │    * Zone whose Smart Tiered Cache setting is managed. Stable — changing
  17 │    * the zone triggers a replacement (the old zone's setting is restored
  18 │    * to the value it had before Alchemy managed it).
  19 │    */
> 20 │   zoneId: string;
  21 │   /**
  22 │    * Whether Smart Tiered Cache is enabled on the zone (`value: "on"`)
  23 │    * or disabled (`value: "off"`). Mutable — patched in place.
  24 │    * @default true
  25 │    */
  26 │   enabled?: boolean;
  27 │ }

0.78 packages/alchemy/src/Cloudflare/Cache/Variants.ts:168:3
  167 │ const normalizeValue = (
> 168 │   observed: cache.GetVariantResponse["value"],
  169 │ ): VariantsValue => {
  170 │   const value: VariantsValue = {};
  171 │   for (const key of EXTENSION_KEYS) {
  172 │     const types = observed[key];
  173 │     if (types !== null && types !== undefined && types.length > 0) {
  174 │       value[key] = [...types];
  175 │     }
  176 │   }
  177 │   return value;
  178 │ };

0.78 packages/alchemy/src/Cloudflare/Calls/App.ts:31:3
  26 │ export type AppAttributes = {
  27 │   /**
  28 │    * Cloudflare-generated unique identifier for the app. Used in client SDK
  29 │    * session URLs (`https://rtc.live.cloudflare.com/v1/apps/{appId}/...`).
  30 │    */
> 31 │   appId: string;
  32 │   /**
  33 │    * The Cloudflare account the app belongs to.
  34 │    */
  35 │   accountId: string;
  36 │   /**
  37 │    * App secret (bearer token) used to authenticate against the Realtime SFU
  38 │    * HTTPS API. Returned only at creation time and never re-readable — Alchemy
  39 │    * persists it in state and carries it forward across updates.
  40 │    */
  41 │   secret: Redacted.Redacted<string>;
  42 │   /**
  43 │    * A short description of the app.
  44 │    */
  45 │   name: string;
  46 │   /**
  47 │    * When the app was created.
  48 │    */
  49 │   created: string;
  50 │   /**
  51 │    * When the app was last modified.
  52 │    */
  53 │   modified: string;
  54 │ };

0.78 packages/alchemy/src/Cloudflare/Containers/ContainerPlatform.ts:86:17
  65 │       const serve = <Req = never>(
  66 │         handler: HttpEffect<Req>,
  67 │         options?: { shape?: Record<string, unknown> },
  68 │       ) =>
  69 │         Effect.sync(() => {
  70 │           // Containers have no native RPC transport (unlike a Cloudflare
  71 │           // Worker's JSRPC), so expose the impl's non-`fetch` shape methods
  72 │           // over the plain-`fetch` RPC protocol: requests to `/__rpc__/*` are
  73 │           // dispatched to the matching shape method, everything else falls
  74 │           // through to the user's `fetch` handler. The DO side talks to this
  75 │           // via `makeFetchRpcStub` over the container's TCP port.
  76 │           const finalHandler = options?.shape
  77 │             ? serveRpc(options.shape, handler)
  78 │             : handler;
  79 │           runners.push(
  80 │             Effect.gen(function* () {
  81 │               const httpServer = yield* Effect.serviceOption(HttpServer).pipe(
  82 │                 Effect.map(Option.getOrUndefined),
  83 │               );
  84 │               if (httpServer) {
  85 │                 yield* httpServer.serve(finalHandler);
> 86 │                 return yield* Effect.never;
  87 │               } else {
  88 │                 // this should only happen at plantime, validate?
  89 │               }
  90 │             }).pipe(Effect.orDie),
  91 │           );
  92 │         });

0.78 packages/alchemy/src/Cloudflare/CustomNameserver/CustomNameserver.ts:81:3
  55 │ export interface Attributes {
  56 │   /**
  57 │    * The FQDN of the nameserver. Also the identifier used to delete it.
  58 │    */
  59 │   nsName: string;
  60 │   /**
  61 │    * The Cloudflare account the nameserver belongs to.
  62 │    */
  63 │   accountId: string;
  64 │   /**
  65 │    * The number of the nameserver set this nameserver belongs to.
  66 │    */
  67 │   nsSet: number | undefined;
  68 │   /**
  69 │    * Verification status of the nameserver (deprecated by Cloudflare but
  70 │    * still returned).
  71 │    */
  72 │   status: Status;
  73 │   /**
  74 │    * A/AAAA glue records to register at the domain registrar so the
  75 │    * nameserver resolves.
  76 │    */
  77 │   dnsRecords: Record[];
  78 │   /**
  79 │    * The zone (on this account) that `nsName` belongs to.
  80 │    */
> 81 │   zoneTag: string;
  82 │ }

0.78 packages/alchemy/src/Cloudflare/DdosProtection/AllowlistEntry.ts:61:3
  57 │ export type DdosAllowlistEntry = Resource<
  58 │   TypeId,
  59 │   DdosAllowlistEntryProps,
  60 │   DdosAllowlistEntryAttributes,
> 61 │   never,
  62 │   Providers
  63 │ >;

0.78 packages/alchemy/src/Cloudflare/Devices/Settings.ts:161:7
  159 │     read: Effect.fn(function* ({ output }) {
  160 │       const { accountId } = yield* yield* CloudflareEnvironment;
> 161 │       const acct = output?.accountId ?? accountId;
  162 │       const observed = yield* observeSettings(acct);
  163 │       // The singleton always exists with account defaults — there is
  164 │       // nothing to "own", so a cold read adopts freely. The observed
  165 │       // snapshot at adoption time becomes the restore target.
  166 │       const initialSettings = output?.initialSettings ?? observed;
  167 │       return toAttributes(acct, observed, initialSettings);
  168 │     }),

0.78 packages/alchemy/src/Cloudflare/Flagship/Flag.ts:432:11
  429 │     delete: Effect.fn(function* ({ output }) {
  430 │       yield* flagship
  431 │         .deleteAppFlag({
> 432 │           accountId: output.accountId,
  433 │           appId: output.appId,
  434 │           flagKey: output.key,
  435 │         })
  436 │         // A missing flag or a missing parent app both mean it's already
  437 │         // gone.
  438 │         .pipe(
  439 │           Effect.catchTag(
  440 │             ["FlagshipFlagNotFound", "FlagshipAppNotFound"],
  441 │             () => Effect.void,
  442 │           ),
  443 │         );
  444 │     }),

0.78 packages/alchemy/src/Cloudflare/HostnameTlsSetting/HostnameTlsSetting.ts:92:3
  88 │ export type HostnameTlsSetting = Resource<
  89 │   TypeId,
  90 │   Props,
  91 │   Attributes,
> 92 │   never,
  93 │   Providers
  94 │ >;

0.78 packages/alchemy/src/Cloudflare/Iam/ResourceGroup.ts:62:3
  58 │ export interface ResourceGroupAttributes {
  59 │   /** Cloudflare-assigned identifier of the resource group. */
  60 │   resourceGroupId: string;
  61 │   /** The Cloudflare account the resource group belongs to. */
> 62 │   accountId: string;
  63 │   /** Name of the resource group. */
  64 │   name: string;
  65 │   /** The scope of the resource group as observed on Cloudflare. */
  66 │   scope: ResourceGroupScope;
  67 │ }

0.78 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Rule.ts:101:3
   99 │ export interface RuleAttributes {
  100 │   /** Cloudflare-assigned identifier of the rule. */
> 101 │   ruleId: string;
  102 │   /** The Cloudflare account the rule belongs to. */
  103 │   accountId: string;
  104 │   /** The rule's unique name. */
  105 │   name: string;
  106 │   /** MNM rule type. */
  107 │   type: RuleType;
  108 │   /** IPv4 CIDR prefixes the rule monitors. */
  109 │   prefixes: string[];
  110 │   /** Whether prefixes are auto-advertised via Magic Transit on trigger. */
  111 │   automaticAdvertisement: boolean;
  112 │   /** Bits per second threshold, if set. */
  113 │   bandwidthThreshold: number | undefined;
  114 │   /** Packets per second threshold, if set. */
  115 │   packetThreshold: number | undefined;
  116 │   /**
  117 │    * Alert duration as reported by Cloudflare (normalized, e.g. `1m0s`).
  118 │    */
  119 │   duration: string | undefined;
  120 │   /** Zscore sensitivity, if set. */
  121 │   zscoreSensitivity: "low" | "medium" | "high" | (string & {}) | undefined;
  122 │   /** Zscore target, if set. */
  123 │   zscoreTarget: "bits" | "packets" | (string & {}) | undefined;
  124 │   /** Prefix match type, if set. */
  125 │   prefixMatch: "exact" | "subnet" | "supernet" | (string & {}) | undefined;
  126 │ }

0.78 packages/alchemy/src/Cloudflare/MagicTransit/Site.ts:62:3
  60 │ export interface MagicSiteAttributes {
  61 │   /** Cloudflare-assigned identifier of the site. */
> 62 │   siteId: string;
  63 │   /** The Cloudflare account the site belongs to. */
  64 │   accountId: string;
  65 │   /** The name of the site. */
  66 │   name: string;
  67 │   /** The site description, if set. */
  68 │   description: string | undefined;
  69 │   /** The associated connector id, if set. */
  70 │   connectorId: string | undefined;
  71 │   /** The associated secondary connector id, if set. */
  72 │   secondaryConnectorId: string | undefined;
  73 │   /** Whether the site runs in high availability mode. */
  74 │   haMode: boolean | undefined;
  75 │   /** Location of the site, if set. */
  76 │   location: MagicSiteLocation | undefined;
  77 │ }

0.78 packages/alchemy/src/Cloudflare/MtlsCertificate/MtlsCertificate.ts:281:13
  278 │       if (!observed) {
  279 │         observed = yield* mtls
  280 │           .createMtlsCertificate({
> 281 │             accountId,
  282 │             ca: news.ca,
  283 │             certificates: news.certificates,
  284 │             name,
  285 │             privateKey: unwrap(news.privateKey),
  286 │           })
  287 │           .pipe(
  288 │             Effect.catchTag("CertificateAlreadyExists", (originalError) =>
  289 │               Effect.gen(function* () {
  290 │                 const match = yield* findByContent(
  291 │                   accountId,
  292 │                   news.certificates,
  293 │                 );
  294 │                 if (!match) return yield* Effect.fail(originalError);
  295 │                 return match;
  296 │               }),
  297 │             ),
  298 │           );
  299 │       }

0.78 packages/alchemy/src/Cloudflare/Registrar/Domain.ts:362:3
  360 │ const toAttributes = (
  361 │   domainName: string,
> 362 │   accountId: string,
  363 │   observed: ObservedDomain,
  364 │   initialSettings: DomainSettings,
  365 │   desired?: DomainSettings,
  366 │ ): DomainAttributes => ({
  367 │   domainName,
  368 │   accountId,
  369 │   // Registrar setting updates can apply asynchronously — overlay the
  370 │   // settings we just PUT over the (possibly lagging) observed values.
  371 │   autoRenew: desired?.autoRenew ?? observed.autoRenew ?? undefined,
  372 │   locked: desired?.locked ?? observed.locked ?? undefined,
  373 │   privacy: desired?.privacy ?? observed.privacy ?? undefined,
  374 │   available: observed.available ?? undefined,
  375 │   canRegister: observed.canRegister ?? undefined,
  376 │   currentRegistrar: observed.currentRegistrar ?? undefined,
  377 │   expiresAt: observed.expiresAt ?? undefined,
  378 │   createdAt: observed.createdAt ?? undefined,
  379 │   updatedAt: observed.updatedAt ?? undefined,
  380 │   registryStatuses: observed.registryStatuses ?? undefined,
  381 │   supportedTld: observed.supportedTld ?? undefined,
  382 │   initialSettings,
  383 │ });

0.78 packages/alchemy/src/Cloudflare/Ruleset/AccountEntrypoint.ts:53:3
  51 │ export type AccountEntrypointAttributes = {
  52 │   /** The unique ID of the entrypoint ruleset (Cloudflare `id`). */
> 53 │   rulesetId: string;
  54 │   /**
  55 │    * Account the phase entrypoint belongs to. Alchemy-flattened identifier —
  56 │    * not part of Cloudflare's phase-entrypoint response.
  57 │    */
  58 │   accountId: string;
  59 │   /** The kind of the ruleset (`root` for account entrypoints). */
  60 │   kind: string;
  61 │   /** The human-readable name of the ruleset. */
  62 │   name: string;
  63 │   /** The phase of the ruleset. */
  64 │   phase: Phase;
  65 │   /** An informative description of the ruleset. */
  66 │   description: string | undefined;
  67 │   /** The list of rules in the entrypoint. */
  68 │   rules: OutputRule[];
  69 │   /** The timestamp of when the ruleset was last modified. */
  70 │   lastUpdated: string;
  71 │   /** The version of the ruleset. */
  72 │   version: string;
  73 │ };

0.78 packages/alchemy/src/Cloudflare/SecretsStore/Secret.ts:64:5
  57 │ export type Secret = Resource<
  58 │   "Cloudflare.SecretsStore.Secret",
  59 │   StoreSecretProps,
  60 │   {
  61 │     secretId: string;
  62 │     secretName: string;
  63 │     storeId: string;
> 64 │     accountId: string;
  65 │     status: SecretStatus;
  66 │     scopes: string[];
  67 │     comment: string | undefined;
  68 │   },
  69 │   never,
  70 │   Providers
  71 │ >;

0.78 packages/alchemy/src/Cloudflare/SecretsStore/SecretsStore.ts:18:5
  12 │ export type Store = Resource<
  13 │   "Cloudflare.SecretsStore",
  14 │   {},
  15 │   {
  16 │     storeId: string;
  17 │     storeName: string;
> 18 │     accountId: string;
  19 │   },
  20 │   never,
  21 │   Providers
  22 │ >;

0.78 packages/alchemy/src/Cloudflare/Workers/RateLimit.ts:39:3
  34 │ export type RateLimitProps = {
  35 │   /**
  36 │    * Positive integer or string that uniquely identifies this rate limit
  37 │    * configuration.
  38 │    */
> 39 │   namespaceId: number | string;
  40 │   /** Simple rate limiting configuration. */
  41 │   simple: {
  42 │     /** The number of requests allowed within the period. */
  43 │     limit: number;
  44 │     /** The period, in seconds, over which requests are counted. */
  45 │     period: RateLimitPeriod;
  46 │   };
  47 │ };

0.78 packages/alchemy/src/Cloudflare/Workers/RpcWebSocket.ts:22:3
  19 │ const restartReason = "Durable Object RPC activation reset";
  20 │ const Metadata = Schema.Struct({
  21 │   version: Schema.Literal(1),
> 22 │   clientId: Schema.Number,
  23 │   pending: Schema.Boolean,
  24 │   serialization: Schema.String,
  25 │ });

0.78 packages/alchemy/src/Cloudflare/Workers/ViteChild.shared.ts:17:1
> 17 │ export const DEFAULT_DEV_PORT = 1337;

0.78 packages/alchemy/src/Cloudflare/Workers/WorkerAccess.ts:78:3
  75 │   /** The user's unique identifier. */
  76 │   readonly user_uuid?: string;
  77 │   /** The Cloudflare account id the Access organization belongs to. */
> 78 │   readonly account_id?: string;
  79 │   /** Login timestamp (Unix epoch seconds). */
  80 │   readonly iat?: number;

0.78 packages/alchemy/src/Cloudflare/WorkersForPlatforms/DispatchNamespace.ts:31:3
  28 │   /**
  29 │    * API Resource UUID tag assigned by Cloudflare.
  30 │    */
> 31 │   namespaceId: string;

0.78 packages/alchemy/src/Cloudflare/Zone/Setting.ts:186:3
  184 │ export type SettingAttributes = {
  185 │   /** Zone the setting belongs to. */
> 186 │   zoneId: string;
  187 │   /** The managed setting's identifier. */
  188 │   settingId: string;
  189 │   /** Resolved current value of the setting. */
  190 │   value: unknown;
  191 │   /**
  192 │    * Whether the setting can be modified on the zone's current plan
  193 │    * (`false` means the setting is plan-gated).
  194 │    */
  195 │   editable: boolean | undefined;
  196 │   /** When the setting was last modified, if Cloudflare reports it. */
  197 │   modifiedOn: string | undefined;
  198 │   /**
  199 │    * The value the setting had before Alchemy first patched it. Restored
  200 │    * on destroy, so deleting the resource puts the zone back the way it
  201 │    * was found.
  202 │    */
  203 │   initialValue: unknown;
  204 │ };

0.78 packages/alchemy/src/Docker/Service.ts:282:5
  274 │   {
  275 │     /** Swarm service id. */
  276 │     id: string;
  277 │     /** Swarm service name. */
  278 │     name: string;
  279 │     /** Docker context the service is deployed to. */
  280 │     context?: string;
  281 │     /** Image reference the service runs. */
> 282 │     image: string;
  283 │     /** Desired number of replicas. */
  284 │     replicas: number;
  285 │     /** Network ids the service's tasks attach to. */
  286 │     networks: string[];
  287 │     /** Published port mappings reported by Swarm. */
  288 │     ports: Service.PortMapping[];
  289 │     /** Service labels reported by Swarm. */
  290 │     labels: Record<string, string>;
  291 │     /** Service discovery endpoint mode. */
  292 │     endpointMode: "vip" | "dnsrr";
  293 │     /** Creation timestamp in milliseconds since epoch. */
  294 │     createdAt: number;
  295 │     /** Last update timestamp in milliseconds since epoch. */
  296 │     updatedAt: number;
  297 │     /** Content hash of the bundled program's image (`main` form only). */
  298 │     code?: {
  299 │       /** Content hash of the bundled program's image. */
  300 │       hash: string;
  301 │     };
  302 │   },

0.78 packages/alchemy/src/Fly/DeploymentState.ts:63:3
  60 │   const countText = recorded?.[keys.count] ?? "";
  61 │   const sequenceText = recorded?.[keys.sequence] ?? "";
  62 │   const replicaText = recorded?.[keys.replica] ?? "";
> 63 │   const count = Number(countText);
  64 │   const index = Number(replicaText);
  65 │   const roles = (recorded?.[keys.roles] ?? "").split(",");

0.78 packages/alchemy/src/Fly/hosted.ts:481:5
  477 │   const resolveImage = Effect.fn(function* (input: {
  478 │     id: string;
  479 │     appName: string;
  480 │     props: HostedProgramProps;
> 481 │     previousHash?: string;
  482 │     session?: { note: (message: string) => Effect.Effect<void> };
  483 │   }) {
  484 │     const note = input.session?.note ?? ((_message: string) => Effect.void);

0.78 packages/alchemy/src/Fly/Service.ts:218:5
  215 │     /** Parsed image reference from Fly. */
  216 │     imageRef: MachineImageRef | undefined;
  217 │     /** Number of Machines in the replica set. */
> 218 │     count: number;
  219 │     /** Disks mounted on replica 0. */
  220 │     mounts: MountedDisk[];

0.78 packages/alchemy/src/Git/Api/Schema.ts:142:3
  139 │ /** 422 — the object exists but has a different type than the endpoint expects. */
  140 │ export class WrongObjectType extends Schema.TaggedError<WrongObjectType>()(
  141 │   "WrongObjectType",
> 142 │   { oid: Schema.String, expected: Schema.String, actual: Schema.String },
  143 │   { httpApiStatus: 422 },
  144 │ ) {}

0.78 packages/alchemy/src/Git/Engine.ts:281:7
  276 │   const prepareRefUpdate = (
  277 │     repo: RepoMetaData,
  278 │     input: {
  279 │       readonly ref: string;
  280 │       readonly newOid: string;
> 281 │       readonly expectedOid?: string | null;
  282 │     },
  283 │   ) =>
  284 │     Effect.gen(function* () {
  285 │       const stub = repos.getByName(repo.repoId);
  286 │       const current = yield* stub.getRef(input.ref).pipe(
  287 │         Effect.map((ref) => ref.oid),
  288 │         Effect.catchTag("RefNotFound", () => Effect.succeed("0".repeat(40))),
  289 │       );
  290 │       if (
  291 │         input.expectedOid !== undefined &&
  292 │         input.expectedOid !== (current === "0".repeat(40) ? null : current)
  293 │       )
  294 │         return yield* new RefConflict({
  295 │           ref: input.ref,
  296 │           currentOid: current as import("./Api.ts").Oid,
  297 │         });
  298 │       const update = { ref: input.ref, oldOid: current, newOid: input.newOid };
  299 │       const commit = stub.updateRef({
  300 │         name: input.ref,
  301 │         newOid: input.newOid,
  302 │         expectedOid: current === "0".repeat(40) ? null : current,
  303 │       });
  304 │       return yield* scopedMutation([update], commit);
  305 │     });

0.78 packages/alchemy/src/Git/Jobs/Import.ts:44:3
  41 │ /** The import source, as accepted by `POST /api/v1/repos/import`. */
  42 │ export interface ImportSource {
  43 │   /** Smart-HTTP base URL of the source repository (with or without `.git`). */
> 44 │   readonly url: string;
  45 │   /** Restrict the import to a single ref (full or short name). */
  46 │   readonly ref?: string | undefined;
  47 │   /** Depth-limit the imported history (`deepen <n>`). */
  48 │   readonly depth?: number | undefined;
  49 │ }

0.78 packages/alchemy/src/GitHub/BaseUrl.ts:52:1
> 52 │ export const githubHostname = (baseUrl: string): string => {
  53 │   const host = new URL(baseUrl).hostname;
  54 │   return host.startsWith("api.") && host.endsWith(".ghe.com")
  55 │     ? host.slice("api.".length)
  56 │     : host;
  57 │ };

0.78 packages/alchemy/src/Hetzner/Network.ts:141:3
  114 │ export type Network = Resource<
  115 │   "Hetzner.Network",
  116 │   NetworkProps,
  117 │   {
  118 │     /** Numeric Hetzner Network id. */
  119 │     networkId: number;
  120 │     /** Observed Network name. */
  121 │     name: string;
  122 │     /** Observed IPv4 range (CIDR). */
  123 │     ipRange: string;
  124 │     /** Observed subnets, including the assigned gateway. */
  125 │     subnets: NetworkSubnetAttr[];
  126 │     /** Observed static routes. */
  127 │     routes: NetworkRoute[];
  128 │     /** Server ids currently attached to this Network. */
  129 │     servers: number[];
  130 │     /** Load Balancer ids currently attached to this Network. */
  131 │     loadBalancers: number[];
  132 │     /** Whether delete protection is enabled. */
  133 │     deleteProtection: boolean;
  134 │     /** Whether routes are exposed to a connected vSwitch. */
  135 │     exposeRoutesToVswitch: boolean;
  136 │     /** User-facing labels (Alchemy ownership labels stripped). */
  137 │     labels: Record<string, string>;
  138 │     /** RFC3339 creation timestamp. */
  139 │     created: string;
  140 │   },
> 141 │   never,
  142 │   Providers
  143 │ >;

0.78 packages/alchemy/src/Hetzner/Website/Foldkit.ts:37:1
> 37 │ export const Foldkit = (id: string, props: FoldkitProps = {}) =>
  38 │   Vite(id, {
  39 │     ...props,
  40 │     assets: {
  41 │       notFoundHandling: "single-page-application",
  42 │       ...props.assets,
  43 │     },
  44 │   });

0.78 packages/alchemy/src/Hetzner/Zone.ts:81:3
   79 │ export interface ZoneAttributes {
   80 │   /** Numeric Cloud API id of the zone. Stable across updates. */
>  81 │   zoneId: number;
   82 │   /** Apex domain name. */
   83 │   name: string;
   84 │   /** Zone mode (`primary` or `secondary`). */
   85 │   mode: ZoneMode;
   86 │   /** Default TTL in seconds. */
   87 │   ttl: number;
   88 │   /** User-defined labels (Alchemy ownership labels stripped). */
   89 │   labels: Record<string, string>;
   90 │   /** Whether delete protection is enabled. */
   91 │   deleteProtection: boolean;
   92 │   /** Live zone status. */
   93 │   status: ZoneStatus;
   94 │   /** Number of resource records in the zone. */
   95 │   recordCount: number;
   96 │   /** Domain registrar as reported by Hetzner. */
   97 │   registrar: ZoneRegistrar;
   98 │   /** RFC3339 creation timestamp. */
   99 │   created: string;
  100 │   /** Authoritative Hetzner nameservers assigned to this zone. */
  101 │   assignedNameservers: string[];
  102 │   /** Nameservers currently delegated by the parent DNS zone. */
  103 │   delegatedNameservers: string[];
  104 │   /** Delegation check status, when Hetzner has reported one. */
  105 │   delegationStatus: ZoneDelegationStatus | undefined;
  106 │ }

0.78 packages/alchemy/src/Neon/Credential.ts:28:3
  26 │ export interface CredentialAttributes extends ResolvedBranchScope {
  27 │   /** Opaque credential identifier, also the S3 access-key ID. */
> 28 │   tokenId: string;
  29 │   /** Stable customer label. */
  30 │   name: string;
  31 │   /** Granted scopes, including any platform-added capabilities. */
  32 │   scopes: string[];
  33 │   /** Branch service bearer token, never the deployment account key. */
  34 │   apiToken: Redacted.Redacted<string>;
  35 │   /** S3 signing secret. */
  36 │   s3SecretAccessKey: Redacted.Redacted<string>;
  37 │   /** Issuance time. */
  38 │   createdAt: string;
  39 │ }

0.78 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:31:3
  30 │ export const makeFunctionRuntimeContext = (
> 31 │   id: string,
  32 │ ): FunctionRuntimeContext => {
  33 │   const env: Record<string, Output.Output> = {};
  34 │   const routes = new Map<string, HttpEffect<FunctionRequest>>();

0.78 packages/alchemy/src/Neon/ProjectMemberRole.ts:24:3
  22 │ export interface ProjectMemberRoleProps {
  23 │   /** Organization owning both the existing membership and project. */
> 24 │   orgId: string;
  25 │   /** Existing organization membership ID, never a user ID or email. */
  26 │   memberId: string;
  27 │   /** Already-deployed organization project. Supply its resolved ID on first deployment. */
  28 │   project: { projectId: string };
  29 │   /** Direct project grant to manage; does not replace organization defaults. */
  30 │   role: ProjectGovernanceRole;
  31 │ }

0.78 packages/alchemy/src/Nuke.ts:46:3
  44 │ export interface ListOptions extends DiscoverOptions {
  45 │   /** The built provider context — what a stack's `providers` layer produced. */
> 46 │   readonly context: Context.Context<never>;
  47 │   readonly concurrency?: number | "unbounded";
  48 │   readonly timeoutSeconds?: number;
  49 │   /** Called once with the selected provider count before enumeration starts. */
  50 │   readonly onScan?: (total: number) => Effect.Effect<void>;
  51 │   /** Called when a provider starts resolving/listing, to identify slow scans. */
  52 │   readonly onProviderStarted?: (provider: string) => Effect.Effect<void>;
  53 │   /**
  54 │    * Called as each provider's listing settles (0 resources when it failed),
  55 │    * for progress reporting — scans across many providers are the slowest
  56 │    * part of a nuke and would otherwise be silent until the summary.
  57 │    */
  58 │   readonly onProvider?: (
  59 │     provider: string,
  60 │     resources: number,
  61 │     error?: string,
  62 │   ) => Effect.Effect<void>;
  63 │ }

0.78 packages/alchemy/src/Planetscale/Postgres/PostgresDefaultRole.ts:62:3
  59 │   /** TTL in seconds (if set). */
  60 │   ttl: number | null;
  61 │   /** The database name. */
> 62 │   databaseName: string;
  63 │   /** Direct connection URL for the database (Redacted). */
  64 │   connectionUrl: Redacted.Redacted<string>;

0.78 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:9:1
   7 │ import { observeDeployment } from "./DeploymentObserve.ts";
   8 │
>  9 │ const startConflictIsIdempotent = (deploymentId: string, error: Conflict) =>
  10 │   observeDeployment(deploymentId).pipe(
  11 │     Effect.flatMap((deployment) =>
  12 │       deployment.status === "running" || deployment.status === "provisioning"
  13 │         ? Effect.succeed(undefined)
  14 │         : Effect.fail(error),
  15 │     ),
  16 │     Effect.catchTag("NotFound", () => Effect.fail(error)),
  17 │   );

0.78 packages/alchemy/src/Prisma/Internal/DeploymentObserve.ts:4:1
  1 │ import * as Effect from "effect/Effect";
  2 │ import { getDeployment } from "@distilled.cloud/prisma/management";
  3 │
> 4 │ export const observeDeployment = (deploymentId: string) =>
  5 │   getDeployment({ deploymentId }).pipe(Effect.map((response) => response.data));

0.78 packages/alchemy/src/Railway/Variable.ts:401:3
  400 │ const upsertVariable = (input: {
> 401 │   projectId: string;
  402 │   environmentId: string;
  403 │   name: string;
  404 │   value: string;
  405 │   serviceId?: string;
  406 │ }) =>
  407 │   railway.upsertVariable({
  408 │     input: {
  409 │       projectId: input.projectId,
  410 │       environmentId: input.environmentId,
  411 │       name: input.name,
  412 │       value: input.value,
  413 │       skipDeploys: true,
  414 │       ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
  415 │     },
  416 │   });

0.78 packages/alchemy/src/Stripe/IssuingPersonalizationDesign.ts:99:4
   97 │ export interface IssuingPersonalizationDesignProps {
   98 │   /**
>  99 │    * Id of the physical bundle (`ics_…`) this design ships with. Required.
  100 │    * Mutable — changing it updates the design in place.
  101 │    */
  102 │   physicalBundle: string;

0.78 packages/alchemy/src/Stripe/ShippingRate.ts:161:5
  141 │   {
  142 │     /** Stripe shipping rate id (`shr_…`). */
  143 │     id: string;
  144 │     /** Customer-facing name shown on Checkout sessions. */
  145 │     displayName: string;
  146 │     /** Calculation type (`fixed_amount`). */
  147 │     type: ShippingRateType;
  148 │     /** Amount in the currency's minor units. */
  149 │     amount: number;
  150 │     /** Three-letter ISO currency code. */
  151 │     currency: string;
  152 │     /** Per-currency amounts, if set. */
  153 │     currencyOptions: Record<string, ShippingRateCurrencyOption> | undefined;
  154 │     /** Whether the shipping rate can be used for new purchases. */
  155 │     active: boolean;
  156 │     /** Estimated delivery range, if set. */
  157 │     deliveryEstimate: ShippingRateDeliveryEstimate | undefined;
  158 │     /** Whether the rate is considered inclusive of taxes. */
  159 │     taxBehavior: ShippingRateTaxBehavior | undefined;
  160 │     /** Tax code id, if set. */
> 161 │     taxCode: string | undefined;
  162 │     /** User-defined metadata (Alchemy ownership keys stripped). */
  163 │     metadata: Record<string, string>;
  164 │     /** Unix timestamp when the shipping rate was created. */
  165 │     created: number;
  166 │     /** Whether the shipping rate exists in live mode. */
  167 │     livemode: boolean;
  168 │   },

0.78 packages/alchemy/src/Stripe/TerminalReader.ts:94:3
> 94 │   never,
  95 │   Providers
  96 │ >;

0.78 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:48:13
  46 │         if (request.method === "POST" && pathname === "/sink") {
  47 │           const body = (yield* request.json) as {
> 48 │             runId: string;
  49 │             count: number;
  50 │           };
  51 │
  52 │           // Raw MetricDatum entries — the caller owns the shape; the sink
  53 │           // only packs/batches. >1000 datums forces a 1000 + remainder split.
  54 │           yield* Stream.fromIterable(
  55 │             Array.from(
  56 │               { length: body.count },
  57 │               () =>
  58 │                 ({
  59 │                   MetricName: SINK_METRIC_NAME,
  60 │                   Dimensions: [{ Name: "Run", Value: body.runId }],
  61 │                   Value: 1,
  62 │                   Unit: "Count",
  63 │                 }) satisfies AWS.CloudWatch.MetricSinkDatum,
  64 │             ),
  65 │           ).pipe(Stream.run(sink));
  66 │
  67 │           return yield* HttpServerResponse.json({
  68 │             ok: true,
  69 │             count: body.count,
  70 │           });
  71 │         }

0.78 packages/alchemy/test/AWS/Omics/bindings-handler.ts:12:1
   9 │ const main = path.resolve(import.meta.dirname, "bindings-handler.ts");
  10 │
  11 │ // A syntactically-plausible but nonexistent read-set / run id.
> 12 │ const BOGUS_ID = "0000000000";

0.78 packages/alchemy/test/Fly/fixtures/legacy-protocol-writer.ts:28:3
  25 │ class LegacyWriterLeaseInvalid extends Data.TaggedError(
  26 │   "LegacyWriterLeaseInvalid",
  27 │ )<{
> 28 │   machineId: string;
  29 │ }> {}

0.78 packages/alchemy/test/Local/fixtures/process-effect.ts:31:1
> 31 │ export const assertPidExited = (pid: number): Effect.Effect<void, Error> =>
  32 │   isAlive(pid).pipe(
  33 │     Effect.orElseSucceed(() => false),
  34 │     Effect.repeat({
  35 │       schedule: Schedule.spaced(Duration.millis(50)),
  36 │       until: (alive) => !alive,
  37 │     }),
  38 │     Effect.timeout("5 seconds"),
  39 │     Effect.catchTag("TimeoutError", () =>
  40 │       Effect.fail(new Error("child did not exit in time")),
  41 │     ),
  42 │   );

0.78 packages/alchemy/test/Prisma/fixtures/read-compute.ts:18:7
  10 │ export default Compute(
  11 │   "PrismaReadBucketCompute",
  12 │   Effect.gen(function* () {
  13 │     const project = yield* TestProject;
  14 │     return {
  15 │       project,
  16 │       appName: "alchemy-bucket-binding-read",
  17 │       main: import.meta.filename,
> 18 │       port: 8080,
  19 │       timeoutSeconds: 240,
  20 │       destroyOldDeployment: true,
  21 │     };
  22 │   }),
  23 │   Effect.gen(function* () {
  24 │     const bucket = yield* TestBucket;
  25 │     const store = yield* ReadBucket(bucket);
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
  29 │         const url = new URL(request.url, "http://x");
  30 │         const handled = yield* readRoutes(store, url);
  31 │         return handled ?? HttpServerResponse.text("Not Found", { status: 404 });
  32 │       }),
  33 │     };
  34 │   }).pipe(Effect.provide(ReadBucketBinding)),
  35 │ );

0.78 packages/alchemy/test/Railway/fixtures/rpc-api.ts:23:5
  18 │ export const ApiLive = Api.make(
  19 │   {
  20 │     project: Site,
  21 │     environment: Partition,
  22 │     main: import.meta.url,
> 23 │     port: 3000,
  24 │   },
  25 │   Effect.gen(function* () {
  26 │     const query = yield* bindFunction(Query);
  27 │     return {
  28 │       ping: () => Effect.succeed("pong"),
  29 │       fetch: Effect.gen(function* () {
  30 │         const request = yield* HttpServerRequest;
  31 │         if (request.url.includes("/hello")) {
  32 │           return HttpServerResponse.text(yield* query.greet("sam"));
  33 │         }
  34 │         return HttpServerResponse.text("api");
  35 │       }),
  36 │     };
  37 │   }),
  38 │ );

0.78 packages/better-auth/test/http.ts:7:3
   5 │ /** Typed failure for the fixture-driving HTTP helpers. */
   6 │ export class AuthHttpError extends Data.TaggedError("AuthHttpError")<{
>  7 │   readonly url: string;
   8 │   readonly status: number;
   9 │   readonly body: string;
  10 │ }> {
  11 │   override get message(): string {
  12 │     return `${this.url} -> ${this.status}: ${this.body.slice(0, 300)}`;
  13 │   }
  14 │ }

0.78 packages/cloudflare-runtime/src/core/bindings/VpcNetwork.ts:4:3
  1 │ import { makeRemoteBinding } from "../remote-bindings/RemoteBindings.ts";
  2 │
  3 │ export interface RemoteVpcNetworkProps {
> 4 │   readonly binding: string;
  5 │   readonly tunnelId?: string;
  6 │   readonly networkId?: string;
  7 │ }

0.78 packages/cloudflare-runtime/src/core/globals/EmailOptions.shared.ts:12:1
> 12 │ export const PATH_EMAIL = "/cdn-cgi/handler/email";

0.78 packages/cloudflare-runtime/src/core/proxy/WorkerProxy.ts:441:9
  435 │     const serveWithRetry = Effect.fnUntraced(function* (
  436 │       options: ResolvedOptions,
  437 │     ) {
  438 │       const parent = yield* Effect.scope;
  439 │       let port: number | undefined;
  440 │       return yield* Effect.gen(function* () {
> 441 │         port = port === undefined ? options.port : yield* ports.find(port + 1);
  442 │         const child = yield* Scope.fork(parent);
  443 │         return yield* serve({ ...options, port }).pipe(
  444 │           Scope.provide(child),
  445 │           Effect.tapError(() => Scope.close(child, Exit.void)),
  446 │         );
  447 │       }).pipe(
  448 │         Effect.retry({
  449 │           while: (error) =>
  450 │             error._tag === "ConfigError" &&
  451 │             error.subtag === "AddressInUse" &&
  452 │             !options.strictPort &&
  453 │             port !== undefined &&
  454 │             port <= Port.MAX_PORT,
  455 │           times: MAX_SERVE_ATTEMPTS - 1,
  456 │         }),
  457 │       );
  458 │     });

0.78 packages/cloudflare-runtime/src/internal/workers-shared/shared/configuration/validateURL.ts:20:3
  17 │ const PATH_REGEX = /^\//;
  18 │
  19 │ export const validateUrl = (
> 20 │   token: string,
  21 │   onlyRelative = false,
  22 │   disallowPorts = false,
  23 │   includeSearch = false,

0.78 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/analytics.ts:51:3
  48 │ // When adding new columns please update the schema
  49 │ type Data = {
  50 │   // -- Indexes --
> 51 │   accountId?: number;
  52 │   scriptId?: number;

0.78 packages/pkg/src/Registry/GitHub.ts:275:5
> 275 │     getPullRequest: (repo: string, number: number) =>
  276 │       asInstallation(repo, Pulls.get({ ...split(repo), pull_number: number })),

0.78 packages/pkg/src/Registry/Handler.ts:141:3
  140 │   const headRepo = data.head_repository?.full_name ?? data.repository.full_name;
> 141 │   let pr: number | null = null;

0.77 packages/alchemy/src/AWS/Amplify/AppEventSource.ts:18:3
  14 │ export interface DeploymentStatusChangeDetail {
  15 │   /**
  16 │    * ID of the Amplify app the job belongs to.
  17 │    */
> 18 │   appId: string;
  19 │   /**
  20 │    * Name of the branch the job ran on.
  21 │    */
  22 │   branchName: string;
  23 │   /**
  24 │    * ID of the build job whose status changed.
  25 │    */
  26 │   jobId: string;
  27 │   /**
  28 │    * New status of the job (`STARTED`, `SUCCEED`, or `FAILED`).
  29 │    */
  30 │   jobStatus: amplify.JobStatus;
  31 │ }

0.77 packages/alchemy/src/AWS/AppConfig/Deployment.ts:14:3
  10 │ export interface DeploymentProps {
  11 │   /**
  12 │    * ID of the application.
  13 │    */
> 14 │   applicationId: string;
  15 │   /**
  16 │    * ID of the environment to deploy to.
  17 │    */
  18 │   environmentId: string;
  19 │   /**
  20 │    * ID of the deployment strategy that governs the rollout.
  21 │    */
  22 │   deploymentStrategyId: string;
  23 │   /**
  24 │    * ID of the configuration profile being deployed.
  25 │    */
  26 │   configurationProfileId: string;
  27 │   /**
  28 │    * The configuration version to deploy. For a hosted configuration profile
  29 │    * this is the hosted version number (as a string); for other sources it is
  30 │    * the version identifier defined by that source.
  31 │    */
  32 │   configurationVersion: string;
  33 │   /**
  34 │    * Description of the deployment.
  35 │    */
  36 │   description?: string;
  37 │ }

0.77 packages/alchemy/src/AWS/AppConfig/HostedConfigurationVersion.ts:12:3
   9 │   /**
  10 │    * ID of the application. Changing it replaces the version.
  11 │    */
> 12 │   applicationId: string;

0.77 packages/alchemy/src/AWS/CloudFront/CachePolicy.ts:83:3
> 83 │   never,
  84 │   Providers
  85 │ > {}

0.77 packages/alchemy/src/AWS/CloudHSMV2/internal.ts:24:1
> 24 │ export const findClusterById = Effect.fn(function* (clusterId: string) {
  25 │   const response = yield* cloudhsm.describeClusters({
  26 │     Filters: { clusterIds: [clusterId] },
  27 │   });
  28 │   return response.Clusters?.[0];
  29 │ });

0.77 packages/alchemy/src/AWS/EC2/defaultVpcScope.ts:17:3
  15 │ export interface DefaultVpcScope {
  16 │   /** The default VPC's id, if the account has one. */
> 17 │   readonly vpcId: string | undefined;
  18 │   /** The DhcpOptions set the default VPC references (the account default). */
  19 │   readonly dhcpOptionsId: string | undefined;
  20 │ }

0.77 packages/alchemy/src/AWS/EC2/FlowLog.ts:41:3
> 41 │   resourceId: string;

0.77 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:161:7
  160 │     ingressRules?: Array<{
> 161 │       securityGroupRuleId: string;
  162 │       ipProtocol: string;
  163 │       fromPort?: number;
  164 │       toPort?: number;
  165 │       cidrIpv4?: string;
  166 │       cidrIpv6?: string;
  167 │       referencedGroupId?: string;
  168 │       prefixListId?: string;
  169 │       description?: string;
  170 │       isEgress: false;
  171 │     }>;

0.77 packages/alchemy/src/AWS/ELBv2/common.ts:63:3
  55 │ export interface RedirectAction {
  56 │   /** Discriminator identifying this as a redirect action. */
  57 │   type: "redirect";
  58 │   /** The redirect status code. */
  59 │   statusCode: "HTTP_301" | "HTTP_302";
  60 │   /** The protocol (`HTTP`, `HTTPS`, or `#{protocol}`). */
  61 │   protocol?: string;
  62 │   /** The port. */
> 63 │   port?: string;
  64 │   /** The hostname. */
  65 │   host?: string;
  66 │   /** The absolute path, starting with `/`. */
  67 │   path?: string;
  68 │   /** The query parameters, not including the leading `?`. */
  69 │   query?: string;
  70 │ }

0.77 packages/alchemy/src/AWS/EMR/ClusterEventSource.ts:17:3
  15 │ export interface ClusterEventDetail {
  16 │   /** The id of the cluster the event is about (`j-…`). */
> 17 │   clusterId?: string;
  18 │   /** The new state, e.g. `RUNNING`, `WAITING`, `TERMINATED`, `COMPLETED`. */
  19 │   state?: string;
  20 │   /** Event severity: `CRITICAL`, `ERROR`, or `INFO`. */
  21 │   severity?: string;
  22 │   /** Human-readable description of the state change. */
  23 │   message?: string;
  24 │   /** Cluster events: the cluster's name. Step events: the step's name. */
  25 │   name?: string;
  26 │   /** Cluster events: why the cluster changed state. */
  27 │   stateChangeReason?: string;
  28 │   /** Step events: the step's id (`s-…`). */
  29 │   stepId?: string;
  30 │   /** Step events: the step's configured action on failure. */
  31 │   actionOnFailure?: string;
  32 │   /** Instance-group events: the group's id (`ig-…`). */
  33 │   instanceGroupId?: string;
  34 │   /** Instance-fleet events: the fleet's id (`if-…`). */
  35 │   instanceFleetId?: string;
  36 │   /** Additional event fields (the schema grows over time). */
  37 │   [key: string]: unknown;
  38 │ }

0.77 packages/alchemy/src/AWS/Grafana/Workspace.ts:81:3
  66 │ export interface Workspace extends Resource<
  67 │   "AWS.Grafana.Workspace",
  68 │   WorkspaceProps,
  69 │   {
  70 │     /** The unique ID of the workspace. */
  71 │     workspaceId: string;
  72 │     /** The ARN of the workspace. */
  73 │     workspaceArn: string;
  74 │     /** The URL of the workspace's Grafana console. */
  75 │     endpoint: string;
  76 │     /** The Grafana version the workspace runs. */
  77 │     grafanaVersion: string;
  78 │     /** The current status of the workspace (`ACTIVE`, `CREATING`, ...). */
  79 │     status: string;
  80 │   },
> 81 │   never,
  82 │   Providers
  83 │ > {}

0.77 packages/alchemy/src/AWS/IdentityCenter/Group.ts:51:3
  34 │ export interface Group extends Resource<
  35 │   "AWS.IdentityCenter.Group",
  36 │   GroupProps,
  37 │   {
  38 │     /** The identity store containing the group. */
  39 │     identityStoreId: string;
  40 │     /** The unique ID of the group. */
  41 │     groupId: string;
  42 │     /** The display name of the group. */
  43 │     displayName: string | undefined;
  44 │     /** The description of the group. */
  45 │     description: string | undefined;
  46 │     /** When the group was created. */
  47 │     createdAt: Date | undefined;
  48 │     /** When the group was last updated. */
  49 │     updatedAt: Date | undefined;
  50 │   },
> 51 │   never,
  52 │   Providers
  53 │ > {}

0.77 packages/alchemy/src/AWS/MediaLive/InputSecurityGroup.ts:30:3
  28 │ /** An input security group whose server-assigned identity is present. */
  29 │ type IdentifiedGroup = medialive.InputSecurityGroup & {
> 30 │   Id: string;
  31 │   Arn: string;
  32 │ };

0.77 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:55:3
  50 │ export interface BrokerEventSourceProps {
  51 │   /**
  52 │    * Destination queue name(s) on the broker to consume. ActiveMQ supports a
  53 │    * single queue; RabbitMQ supports multiple.
  54 │    */
> 55 │   queues: string[];
  56 │   /**
  57 │    * ARN of a Secrets Manager secret holding the broker credentials as
  58 │    * `{ "username": "...", "password": "..." }`. Lambda uses these
  59 │    * (`BASIC_AUTH`) to connect to the broker.
  60 │    */
  61 │   credentialsSecretArn: string;
  62 │   /**
  63 │    * The maximum number of messages in each batch that Lambda pulls from the
  64 │    * broker.
  65 │    * @default 100
  66 │    */
  67 │   batchSize?: number;
  68 │   /**
  69 │    * The maximum time Lambda spends gathering records before invoking the
  70 │    * function (e.g. `"5 seconds"`). Rounded to whole seconds on the wire.
  71 │    */
  72 │   maximumBatchingWindow?: Duration.Input;
  73 │   /**
  74 │    * Whether the event source mapping is active.
  75 │    * @default true
  76 │    */
  77 │   enabled?: boolean;
  78 │ }

0.77 packages/alchemy/src/AWS/Neptune/DBCluster.ts:261:1
> 261 │ export const DBCluster = Resource<DBCluster>("AWS.Neptune.DBCluster");

0.77 packages/alchemy/src/AWS/OpenSearch/DataPlaneTypes.ts:29:3
  26 │ /** One search hit: index, id, relevance score, and the stored document. */
  27 │ export interface SearchHit<TDoc = unknown> {
  28 │   _index: string;
> 29 │   _id: string;
  30 │   _score: number | null;
  31 │   _source: TDoc;
  32 │ }

0.77 packages/alchemy/src/AWS/OSIS/Pipeline.ts:81:3
> 81 │   pipelineConfigurationBody: string;

0.77 packages/alchemy/src/AWS/QBusiness/DataSource.ts:113:3
> 113 │   never,
  114 │   Providers
  115 │ > {}

0.77 packages/alchemy/src/AWS/QBusiness/SearchIndex.ts:221:3
  218 │ export class IndexProvisioningFailed extends Data.TaggedError(
  219 │   "QBusinessIndexProvisioningFailed",
  220 │ )<{
> 221 │   readonly indexId: string;
  222 │   readonly message: string | undefined;
  223 │ }> {}

0.77 packages/alchemy/src/AWS/QuickSight/BindingHttp.ts:23:1
  22 │ /** Extract the AWS account id from a QuickSight resource ARN. */
> 23 │ export const accountIdFromArn = (arn: string): string => arn.split(":")[4]!;

0.77 packages/alchemy/src/AWS/Route53/Record.ts:169:5
  166 │     /**
  167 │      * Hosted zone that owns the record.
  168 │      */
> 169 │     hostedZoneId: string;

0.77 packages/alchemy/src/AWS/SES/ActiveReceiptRuleSet.ts:13:3
   7 │ export interface ActiveReceiptRuleSetProps {
   8 │   /**
   9 │    * Name of the receipt rule set to make active for the account in the current
  10 │    * region. Typically the `ruleSetName` output of a `SES.ReceiptRuleSet`.
  11 │    * Re-pointing to a different rule set updates the active pointer in place.
  12 │    */
> 13 │   ruleSetName: string;
  14 │ }

0.77 packages/alchemy/src/AWS/SocialMessaging/LinkedWhatsAppBusinessAccount.ts:102:3
> 102 │   never,
  103 │   Providers
  104 │ > {}

0.77 packages/alchemy/src/Axiom/Notifier.ts:12:3
   9 │ export type Notifier = Resource<
  10 │   "Axiom.Notifier",
  11 │   NotifierProps,
> 12 │   Axiom.CreateNotifierResponse & { id: string },
  13 │   never,
  14 │   Providers
  15 │ >;

0.77 packages/alchemy/src/Cloudflare/Access/Application.ts:662:13
  659 │         const updated = yield* zeroTrust
  660 │           .updateAccessApplicationForAccount({
  661 │             accountId,
> 662 │             appId: observed.id,
  663 │             domain: body.domain ?? observed.domain,
  664 │             type: news.type,
  665 │             name: resolvedName,

0.77 packages/alchemy/src/Cloudflare/Access/McpPortal.ts:74:3
  70 │ export type McpPortal = Resource<
  71 │   TypeId,
  72 │   McpPortalProps,
  73 │   McpPortalAttributes,
> 74 │   never,
  75 │   Providers
  76 │ >;

0.77 packages/alchemy/src/Cloudflare/Acm/CustomTrustStore.ts:38:3
  31 │ export interface CustomTrustStoreProps {
  32 │   /**
  33 │    * Zone the trust store certificate belongs to.
  34 │    *
  35 │    * Immutable — moving the certificate to another zone triggers a
  36 │    * replacement.
  37 │    */
> 38 │   zoneId: string;
  39 │   /**
  40 │    * The root CA certificate in PEM format. Only root CA certificates are
  41 │    * accepted; intermediate and leaf certificates are rejected by
  42 │    * Cloudflare.
  43 │    *
  44 │    * Immutable — the API has no update operation, so changing the
  45 │    * certificate triggers a replacement.
  46 │    */
  47 │   certificate: string;
  48 │ }

0.77 packages/alchemy/src/Cloudflare/Addressing/PrefixDelegation.ts:20:3
  15 │ export interface PrefixDelegationProps {
  16 │   /**
  17 │    * Identifier of the parent BYOIP prefix being delegated from. Changing it
  18 │    * forces a replacement.
  19 │    */
> 20 │   prefixId: string;
  21 │   /**
  22 │    * IP Prefix in Classless Inter-Domain Routing format to delegate. Must be
  23 │    * contained in the parent prefix. Changing it forces a replacement.
  24 │    */
  25 │   cidr: string;
  26 │   /**
  27 │    * Identifier of the Cloudflare account the prefix is delegated to.
  28 │    * Changing it forces a replacement.
  29 │    */
  30 │   delegatedAccountId: string;
  31 │ }

0.77 packages/alchemy/src/Cloudflare/AI/Dataset.ts:61:3
  56 │ export type DatasetProps = {
  57 │   /**
  58 │    * The AI Gateway the dataset belongs to. Changing the gateway triggers a
  59 │    * replacement.
  60 │    */
> 61 │   gatewayId: string;
  62 │   /**
  63 │    * Human readable dataset name. If omitted, a unique name is generated from
  64 │    * the app, stage, and logical ID.
  65 │    * @default ${app}-${stage}-${id}
  66 │    */
  67 │   name?: string;
  68 │   /**
  69 │    * Whether the dataset is enabled (actively collecting matching logs).
  70 │    * @default true
  71 │    */
  72 │   enable?: boolean;
  73 │   /**
  74 │    * Saved log filters defining which gateway logs the dataset captures.
  75 │    * An empty array captures all logs.
  76 │    */
  77 │   filters: DatasetFilter[];
  78 │ };

0.77 packages/alchemy/src/Cloudflare/AI/SearchInstance.ts:41:1
  38 │ /**
  39 │  * Reranking model applied to retrieved results.
  40 │  */
> 41 │ export type RerankingModel = "@cf/baai/bge-reranker-base";

0.77 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:701:9
  698 │       // registry reference. Keep publication state within this provider instance.
  699 │       const publications = new Map<string, ReturnType<typeof publishImage>>();
  700 │       const buildAndPushImage = Effect.fn("buildAndPushImage")(function* (
> 701 │         id: string,
  702 │         props: AnyContainerApplicationProps,
  703 │         build: ImageBuild,
  704 │         imageRef: string,

0.77 packages/alchemy/src/Cloudflare/ContentScanning/ContentScanning.ts:24:3
  18 │ export interface Props {
  19 │   /**
  20 │    * Zone to manage WAF Content Scanning on. Stable — changing the zone
  21 │    * triggers a replacement (the old zone's status is restored to the
  22 │    * value it had before Alchemy managed it).
  23 │    */
> 24 │   zoneId: string;
  25 │   /**
  26 │    * Whether Content Scanning is enabled on the zone. Mutable — toggled
  27 │    * in place via the settings endpoint.
  28 │    *
  29 │    * Enabling requires the WAF Content Scanning Enterprise add-on;
  30 │    * without it Cloudflare rejects the call with the typed
  31 │    * `ContentScanningNotEntitled` error.
  32 │    *
  33 │    * @default true
  34 │    */
  35 │   enabled?: boolean;
  36 │ }

0.77 packages/alchemy/src/Cloudflare/CustomCertificate/CustomCertificate.ts:69:3
> 69 │   zoneId: string;

0.77 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:32:3
  28 │ export interface D1Auth {
  29 │   authorize: <A, E>(
  30 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  31 │   ) => Effect.Effect<A, E>;
> 32 │   accountId: string;
  33 │ }

0.77 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionRule.ts:102:3
   98 │ export type SynProtectionRule = Resource<
   99 │   TypeId,
  100 │   SynProtectionRuleProps,
  101 │   SynProtectionRuleAttributes,
> 102 │   never,
  103 │   Providers
  104 │ >;

0.77 packages/alchemy/src/Cloudflare/Devices/CustomProfile.ts:143:3
  141 │ export type DeviceCustomProfileAttributes = {
  142 │   /** API UUID of the profile. */
> 143 │   policyId: string;
  144 │   /** Account that owns the profile. */
  145 │   accountId: string;

0.77 packages/alchemy/src/Cloudflare/Email/TrustedDomain.ts:269:3
  261 │ const toAttributes = (
  262 │   entry:
  263 │     | ObservedTrustedDomain
  264 │     | emailSecurity.CreateSettingTrustedDomainResponse
  265 │     | emailSecurity.PatchSettingTrustedDomainResponse
  266 │     | emailSecurity.ListSettingTrustedDomainsResponse["result"][number],
  267 │   accountId: string,
  268 │ ): TrustedDomainAttributes => ({
> 269 │   trustedDomainId: entry.id ?? "",
  270 │   accountId,
  271 │   pattern: entry.pattern ?? "",
  272 │   isRecent: entry.isRecent ?? false,
  273 │   isSimilarity: entry.isSimilarity ?? false,
  274 │   isRegex: entry.isRegex ?? false,
  275 │   comments: entry.comments ?? undefined,
  276 │   createdAt: entry.createdAt ?? "",
  277 │   modifiedAt: entry.modifiedAt ?? undefined,
  278 │ });

0.77 packages/alchemy/src/Cloudflare/Fraud/DetectionSettings.ts:86:3
  82 │ export interface DetectionSettingsAttributes extends DetectionSettingsValues {
  83 │   /**
  84 │    * Zone that owns this fraud-detection configuration.
  85 │    */
> 86 │   zoneId: string;
  87 │   /**
  88 │    * Snapshot of the writable settings observed **before** this resource
  89 │    * first wrote to the zone. `delete` restores these values for the
  90 │    * fields this resource managed.
  91 │    */
  92 │   initialSettings: DetectionSettingsValues;
  93 │ }

0.77 packages/alchemy/src/Cloudflare/LoadBalancer/MonitorGroup.ts:62:3
  58 │ export interface MonitorGroupAttributes {
  59 │   /** Cloudflare-assigned monitor group identifier. */
  60 │   monitorGroupId: string;
  61 │   /** The Cloudflare account the monitor group belongs to. */
> 62 │   accountId: string;
  63 │   /** Monitor group description (carries the physical name when generated). */
  64 │   description: string;
  65 │   /** ISO8601 creation timestamp. */
  66 │   createdOn: string | undefined;
  67 │   /** ISO8601 last-modified timestamp. */
  68 │   modifiedOn: string | undefined;
  69 │ }

0.77 packages/alchemy/src/Cloudflare/LogsControl/CmbConfig.ts:40:3
  38 │ export type CmbConfigAttributes = {
  39 │   /** The Cloudflare account the CMB config belongs to. */
> 40 │   accountId: string;
  41 │   /** Name of the region log data is restricted to. */
  42 │   regions: string | undefined;
  43 │   /** Whether log data may be accessed from outside the configured region. */
  44 │   allowOutOfRegionAccess: boolean | undefined;
  45 │ };

0.77 packages/alchemy/src/Cloudflare/MagicTransit/App.ts:37:3
  35 │ export interface MagicAppAttributes {
  36 │   /** Magic account app ID. */
> 37 │   appId: string;
  38 │   /** The Cloudflare account the app belongs to. */
  39 │   accountId: string;
  40 │   /** Display name for the app. */
  41 │   name: string;
  42 │   /** Category of the app. */
  43 │   type: string;
  44 │   /** FQDNs associated with traffic decisions, if set. */
  45 │   hostnames: string[] | undefined;
  46 │   /** IPv4 CIDRs associated with traffic decisions, if set. */
  47 │   ipSubnets: string[] | undefined;
  48 │ }

0.77 packages/alchemy/src/Cloudflare/NetworkInterconnects/Settings.ts:26:3
  24 │ export interface NetworkInterconnectSettingsAttributes {
  25 │   /** Account the CNI settings belong to. */
> 26 │   accountId: string;
  27 │   /** The currently configured default ASN. */
  28 │   defaultAsn: number;
  29 │   /**
  30 │    * The default ASN observed before Alchemy first managed this
  31 │    * singleton. Restored on destroy, so deleting the resource puts the
  32 │    * account back the way it was found.
  33 │    */
  34 │   initialDefaultAsn: number;
  35 │ }

0.77 packages/alchemy/src/Cloudflare/Pipelines/Stream.ts:165:3
  147 │ export interface StreamAttributes {
  148 │   /** Cloudflare-assigned stream identifier. */
  149 │   streamId: string;
  150 │   /** Account that owns the stream. */
  151 │   accountId: string;
  152 │   /** Stream name (unique per account). */
  153 │   name: string;
  154 │   /** HTTP ingest endpoint URL, when HTTP ingestion is enabled. */
  155 │   endpoint: string | undefined;
  156 │   /** Whether the HTTP ingest endpoint is enabled. */
  157 │   httpEnabled: boolean;
  158 │   /** Whether the HTTP ingest endpoint requires authentication. */
  159 │   httpAuthentication: boolean;
  160 │   /** Allowed CORS origins of the HTTP ingest endpoint. */
  161 │   corsOrigins: string[] | undefined;
  162 │   /** Whether Workers can send events via a `pipelines` binding. */
  163 │   workerBindingEnabled: boolean;
  164 │   /** Current version of the stream. */
> 165 │   version: number;
  166 │   /** When the stream was created. */
  167 │   createdAt: string;
  168 │   /** When the stream was last modified. */
  169 │   modifiedAt: string;
  170 │ }

0.77 packages/alchemy/src/Cloudflare/R2/BucketSippy.ts:252:7
  251 │     read: Effect.fn(function* ({ output, olds }) {
> 252 │       const { accountId } = yield* yield* CloudflareEnvironment;
  253 │       const acct = output?.accountId ?? accountId;
  254 │       // The bucket is the configuration's identity; cold reads derive it
  255 │       // from the last-persisted props.
  256 │       const bucketName =
  257 │         output?.bucketName ??
  258 │         (typeof olds?.bucketName === "string" ? olds.bucketName : undefined);
  259 │       if (bucketName === undefined) return undefined;
  260 │       const jurisdiction =
  261 │         output?.jurisdiction ?? olds?.jurisdiction ?? "default";
  262 │
  263 │       const observed = yield* r2
  264 │         .getBucketSippy({ accountId: acct, bucketName, jurisdiction })
  265 │         .pipe(
  266 │           Effect.map((config): r2.GetBucketSippyResponse | undefined => config),
  267 │           // The bucket itself is gone — so is its Sippy configuration.
  268 │           Effect.catchTag("NoSuchBucket", () => Effect.succeed(undefined)),
  269 │         );
  270 │       // A bucket with Sippy never configured (or disabled) reads back as
  271 │       // `{ enabled: false }` — that is "absent" for this resource.
  272 │       if (!observed || observed.enabled !== true) return undefined;
  273 │
  274 │       const attrs = toAttributes(observed, acct, bucketName, jurisdiction);
  275 │       // Sippy configs carry no ownership markers. With no prior output we
  276 │       // cannot prove we enabled it — brand it `Unowned` so takeover is
  277 │       // gated behind the adopt policy.
  278 │       return output ? attrs : Unowned(attrs);
  279 │     }),

0.77 packages/alchemy/src/Cloudflare/RealtimeKit/Preset.ts:207:3
  203 │ export type PresetAttributes = {
  204 │   /**
  205 │    * Server-generated preset identifier. Stable across updates.
  206 │    */
> 207 │   presetId: string;
  208 │   /**
  209 │    * The Cloudflare account the preset belongs to.
  210 │    */
  211 │   accountId: string;
  212 │   /**
  213 │    * The RealtimeKit app the preset belongs to.
  214 │    */
  215 │   appId: string;
  216 │   /**
  217 │    * Human readable preset name.
  218 │    */
  219 │   name: string;
  220 │   /**
  221 │    * Media configuration as stored by Cloudflare.
  222 │    */
  223 │   config: PresetConfig;
  224 │   /**
  225 │    * UI design tokens as stored by Cloudflare.
  226 │    */
  227 │   ui: PresetUi;
  228 │   /**
  229 │    * Participant permissions as stored by Cloudflare.
  230 │    */
  231 │   permissions: PresetPermissions | undefined;
  232 │ };

0.77 packages/alchemy/src/Cloudflare/TokenValidation/Configuration.ts:102:3
  100 │ export interface TokenConfigurationAttributes {
  101 │   /** Cloudflare-assigned UUID of the token configuration. */
> 102 │   configId: string;
  103 │   /** Zone the configuration belongs to. */
  104 │   zoneId: string;
  105 │   /** Human-readable name of the configuration. */
  106 │   title: string;
  107 │   /** Description of the configuration. */
  108 │   description: string;
  109 │   /** Where the token is looked for on incoming requests. */
  110 │   tokenSources: string[];
  111 │   /** The token format. */
  112 │   tokenType: "JWT" | (string & {});
  113 │   /** The JWKS key set currently active on the configuration. */
  114 │   keys: JwkKey[];
  115 │   /** ISO8601 creation timestamp. */
  116 │   createdAt: string;
  117 │   /** ISO8601 last-modified timestamp. */
  118 │   lastUpdated: string;
  119 │ }

0.77 packages/alchemy/src/Cloudflare/Web3/Hostname.ts:341:3
  335 │ const toAttributes = (
  336 │   hostname: ObservedHostname,
  337 │   zoneId: string,
  338 │ ): HostnameAttributes => ({
  339 │   // Cloudflare always echoes id/name/target/status for a persisted
  340 │   // hostname — distilled just types every response field as optional.
> 341 │   hostnameId: hostname.id ?? "",
  342 │   zoneId,
  343 │   name: hostname.name ?? "",
  344 │   target: (hostname.target ?? "ipfs") as HostnameTarget,
  345 │   dnslink: hostname.dnslink ?? undefined,
  346 │   description: hostname.description ?? undefined,
  347 │   status: (hostname.status ?? "pending") as HostnameStatus,
  348 │   createdOn: hostname.createdOn ?? undefined,
  349 │   modifiedOn: hostname.modifiedOn ?? undefined,
  350 │ });

0.77 packages/alchemy/src/Cloudflare/Workers/BrowserHttpClient.ts:34:3
  30 │ export interface BrowserAuth {
  31 │   authorize: <A, E>(
  32 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  33 │   ) => Effect.Effect<A, E>;
> 34 │   accountId: string;
  35 │ }

0.77 packages/alchemy/src/Cloudflare/Workers/ViteChildRunner.ts:84:5
  83 │     const source = config.source;
> 84 │     const viteHost = "127.0.0.1";

0.77 packages/alchemy/src/Cloudflare/Zaraz/Config.ts:281:15
  264 │     reconcile: Effect.fn(function* ({ news, output }) {
  265 │       const zoneId = output?.zoneId ?? (yield* resolve(news.zone));
  266 │       const observed = yield* observe(zoneId);
  267 │       const observedConfig = fromAttributes(observed);
  268 │       const desired = desiredConfig(observedConfig, news);
  269 │       const desiredWorkflow = news.workflow ?? observed.workflow;
  270 │
  271 │       const updatedConfig = deepEqual(
  272 │         comparableConfig(observedConfig),
  273 │         comparableConfig(desired),
  274 │       )
  275 │         ? observedConfig
  276 │         : yield* zaraz.putConfig(toPutConfig(zoneId, desired));
  277 │       const updatedWorkflow =
  278 │         desiredWorkflow === observed.workflow
  279 │           ? observed.workflow
  280 │           : yield* zaraz.putZaraz({
> 281 │               zoneId,
  282 │               workflow: desiredWorkflow,
  283 │             });
  284 │
  285 │       return toAttributes(zoneId, updatedConfig, updatedWorkflow);
  286 │     }),

0.77 packages/alchemy/src/Docker/RemoteImage.ts:68:3
  51 │ export interface RemoteImage extends Resource<
  52 │   "Docker.RemoteImage",
  53 │   RemoteImageProps,
  54 │   {
  55 │     /** Final image reference. Includes the registry host when pushed there. */
  56 │     imageRef: string;
  57 │     /** Local image id after pull. */
  58 │     imageId: string;
  59 │     /** Pull timestamp in milliseconds since epoch. */
  60 │     createdAt: number;
  61 │     /** Final image repository/name. */
  62 │     name: string;
  63 │     /** Final image tag. */
  64 │     tag: string;
  65 │     /** Registry digest after push when available. */
  66 │     repoDigest?: string;
  67 │   },
> 68 │   never,
  69 │   Providers
  70 │ > {}

0.77 packages/alchemy/src/Docker/Swarm.ts:42:5
  37 │ export interface Swarm extends Resource<
  38 │   "Docker.Swarm",
  39 │   SwarmProps,
  40 │   {
  41 │     /** Swarm cluster id. */
> 42 │     id: string;
  43 │     /** This node's id in the swarm (a manager). */
  44 │     nodeId: string;
  45 │     /** Docker context the swarm was initialized on. */
  46 │     context?: string;
  47 │     /** Number of manager nodes. */
  48 │     managers: number;
  49 │     /** Number of nodes in the swarm. */
  50 │     nodes: number;
  51 │   },
  52 │   never,
  53 │   Providers
  54 │ > {}

0.77 packages/alchemy/src/Docker/Volume.ts:58:3
  39 │ export interface Volume extends Resource<
  40 │   "Docker.Volume",
  41 │   VolumeProps,
  42 │   {
  43 │     /** Docker volume name. */
  44 │     id: string;
  45 │     /** Docker volume name. */
  46 │     name: string;
  47 │     /** Volume driver. */
  48 │     driver: string;
  49 │     /** Driver-specific options reported by Docker. */
  50 │     driverOpts: Record<string, string>;
  51 │     /** Labels reported by Docker. */
  52 │     labels: Record<string, string>;
  53 │     /** Host mountpoint path. */
  54 │     mountpoint?: string;
  55 │     /** Creation timestamp in milliseconds since epoch. */
  56 │     createdAt: number;
  57 │   },
> 58 │   never,
  59 │   Providers
  60 │ > {}

0.77 packages/alchemy/src/Fly/bluegreen.ts:99:3
   97 │ export const setRouting = (
   98 │   appName: string,
>  99 │   machineId: string,
  100 │   cordoned: boolean,
  101 │   existingLeases?: MachineLeases,
  102 │ ) =>

0.77 packages/alchemy/src/Fly/Bucket.ts:103:5
  100 │     /** Observed provisioning status (`ready`, …). */
  101 │     status: string | undefined;
  102 │     /** Organization slug. */
> 103 │     orgSlug: string | undefined;
  104 │     /** Whether the bucket is public. */
  105 │     public: boolean;

0.77 packages/alchemy/src/Fly/IpAssignment.ts:328:5
  320 │ const toAttrs = (
  321 │   appName: string,
  322 │   assignment: FlyIPAssignment,
  323 │   fallbackType?: IpAssignmentType,
  324 │ ): IpAssignment["Attributes"] => {
  325 │   const type = inferType(assignment, fallbackType);
  326 │   return {
  327 │     appName,
> 328 │     ip: assignment.ip ?? "",
  329 │     type,
  330 │     region: assignment.region,
  331 │     serviceName: assignment.service_name,
  332 │     shared: type === "shared_v4" || assignment.shared === true,
  333 │     network: networkOf(assignment),
  334 │     createdAt: assignment.created_at,
  335 │   };
  336 │ };

0.77 packages/alchemy/src/Git/GitHubCompat.ts:169:3
  163 │ const intId = (value: string): number => {
  164 │   let hash = 0xcbf29ce484222325n;
  165 │   for (let index = 0; index < value.length; index++) {
  166 │     hash ^= BigInt(value.charCodeAt(index));
  167 │     hash = (hash * 0x100000001b3n) & 0xffffffffffffn;
  168 │   }
> 169 │   return Number(hash);
  170 │ };
  171 │
  172 │ const shortRef = (ref: string): string => ref.replace(/^refs\/heads\//, "");

0.77 packages/alchemy/src/Git/Hasher/Protocol.ts:67:3
  57 │ interface WireEntry {
  58 │   readonly o: string; // oid
  59 │   readonly t: number; // type
  60 │   readonly h: number; // header offset
  61 │   readonly s: number; // size
  62 │   readonly d: number; // dataOffset
  63 │   readonly n: number; // span
  64 │   readonly z?: [number, number]; // zdata [offset, length] in the blob area
  65 │   readonly c?: [number, number]; // content [offset, length]
  66 │   readonly b?: number; // baseOffset (delta-resolved)
> 67 │   readonly r?: string; // baseOid (delta-resolved)
  68 │ }

0.77 packages/alchemy/src/GitHub/Webhook.ts:102:3
> 102 │   never,
  103 │   GitHub.Providers
  104 │ > {}

0.77 packages/alchemy/src/Hetzner/SshKey.ts:46:5
  41 │ export type SshKey = Resource<
  42 │   "Hetzner.SshKey",
  43 │   SshKeyProps,
  44 │   {
  45 │     /** Numeric Hetzner SSH key id. */
> 46 │     id: number;
  47 │     /** Name of the SSH key (unique per project). */
  48 │     name: string;
  49 │     /** MD5 fingerprint of the public key (`aa:bb:…`). */
  50 │     fingerprint: string;
  51 │     /** Public key as stored by Hetzner. */
  52 │     publicKey: string;
  53 │     /** User-defined labels (Alchemy ownership labels stripped). */
  54 │     labels: Record<string, string>;
  55 │     /** RFC3339 creation timestamp. */
  56 │     created: string;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ >;

0.77 packages/alchemy/src/Http.ts:137:5
  134 │ export const resolvePort = (options: { port?: number } | undefined) =>
  135 │   options?.port !== undefined
  136 │     ? Effect.succeed(options.port)
> 137 │     : Config.Number("PORT").pipe(Config.withDefault(3000));

0.77 packages/alchemy/src/Prisma/Internal/AppPromotion.ts:22:3
  19 │ const DEFAULT_POLL_INTERVAL_MS = 1_000;
  20 │
  21 │ export const waitForAppDeploymentTarget = Effect.fn(function* (
> 22 │   appId: string,
  23 │   deploymentId: string,
  24 │   options: AppDeploymentTargetObservationOptions = {},
  25 │ ) {

0.77 packages/alchemy/src/Railway/Function.ts:521:5
  510 │ export const Function: Platform<
  511 │   Function,
  512 │   FunctionServices,
  513 │   FunctionShape,
  514 │   FunctionRuntimeContext
  515 │ > & {
  516 │   /**
  517 │    * Async (no-impl) constructor — captures the `env` literal so
  518 │    * {@link InferEnv} types the handler's second argument.
  519 │    */
  520 │   <const Env extends Record<string, any>, PropsReq = never>(
> 521 │     id: string,
  522 │     props:
  523 │       | InputProps<FunctionProps<Env>>
  524 │       | Effect.Effect<InputProps<FunctionProps<Env>>, never, PropsReq>,
  525 │   ): Effect.Effect<Function<Env>, never, Providers | PropsReq>;
  526 │ } = Platform("Railway.Function", {
  527 │   createRuntimeContext: createRailwayFunctionRuntimeContext("Railway.Function"),
  528 │   transformProps: (id, props) => resolveFunctionProps(id, props),
  529 │ });

0.77 packages/alchemy/src/Stripe/ConsumeEvents.ts:61:3
  58 │ export const bindWebhookSecret = (
  59 │   host: Worker,
  60 │   secret: WebhookEndpoint["secret"],
> 61 │   path?: string,
  62 │ ): Effect.Effect<void> =>
  63 │   host.bind(`stripe-webhook:${webhookPath(path)}`, {
  64 │     env: {
  65 │       [webhookSecretEnvName(path)]: secret,
  66 │     },
  67 │   });

0.77 packages/alchemy/src/Stripe/EntitlementsFeature.ts:151:3
  150 │ const toLookupKey = (
> 151 │   id: string,
  152 │   lookupKey: string | undefined,
  153 │   existing?: string,
  154 │ ) =>
  155 │   Effect.gen(function* () {
  156 │     return (
  157 │       lookupKey ??
  158 │       existing ??
  159 │       (yield* createPhysicalName({
  160 │         id,
  161 │         maxLength: LOOKUP_KEY_MAX_LENGTH,
  162 │         lowercase: true,
  163 │       }))
  164 │     );
  165 │   });

0.77 packages/alchemy/src/Stripe/PaymentLink.ts:201:5
  198 │     /** Whether Checkout collects a phone number. */
  199 │     phoneNumberCollection: boolean;
  200 │     /** Three-letter ISO currency code. */
> 201 │     currency: string;
  202 │     /** User-defined metadata (Alchemy ownership keys stripped). */
  203 │     metadata: Record<string, string>;

0.77 packages/alchemy/src/Stripe/PaymentMethodDomain.ts:161:9
  151 │ const toDomainName = (
  152 │   id: string,
  153 │   domainName: string | undefined,
  154 │   existing?: string,
  155 │ ) =>
  156 │   Effect.gen(function* () {
  157 │     return (
  158 │       domainName ??
  159 │       existing ??
  160 │       `${yield* createPhysicalName({
> 161 │         id,
  162 │         maxLength: DOMAIN_LABEL_MAX_LENGTH,
  163 │         lowercase: true,
  164 │       })}${DOMAIN_SUFFIX}`
  165 │     );
  166 │   });

0.77 packages/alchemy/src/Util/ResourceOutput.ts:12:3
  10 │ /** Sigil-themed resource attribution shared by every append-only log path. */
  11 │ export const formatResourceTag = (
> 12 │   id: string,
  13 │   colors = colorsEnabled(),
  14 │ ): string =>
  15 │   colors ? `${ansiFg(theme.color.info)}[${id}]${ANSI_RESET}` : `[${id}]`;

0.77 packages/alchemy/test/Auth/fixtures/lock-holder.ts:12:7
   8 │ await Effect.runPromise(
   9 │   withLock(
  10 │     key,
  11 │     Effect.sync(() => process.stdout.write("ready\n")).pipe(
> 12 │       Effect.andThen(Effect.never),
  13 │     ),
  14 │   ).pipe(Effect.provide(NodeServices.layer)),
  15 │ );

0.77 packages/alchemy/test/AWS/AuditManager/handler.ts:265:9
  263 │     Effect.provide(
  264 │       Layer.mergeAll(
> 265 │         AuditManager.GetAccountStatusHttp,
  266 │         AuditManager.GetServicesInScopeHttp,
  267 │         AuditManager.GetInsightsHttp,
  268 │         AuditManager.ListControlDomainInsightsHttp,
  269 │         AuditManager.ListControlInsightsByControlDomainHttp,
  270 │         AuditManager.GetDelegationsHttp,
  271 │         AuditManager.GetEvidenceFileUploadUrlHttp,
  272 │         AuditManager.ListAssessmentReportsHttp,
  273 │         AuditManager.ValidateAssessmentReportIntegrityHttp,
  274 │         AuditManager.ListKeywordsForDataSourceHttp,
  275 │         AuditManager.ListNotificationsHttp,
  276 │       ),
  277 │     ),

0.77 packages/alchemy/test/AWS/AutoScaling/TestNetwork.ts:19:1
> 19 │ export const getTestAmiId: Effect.Effect<string, any, any> = ec2
  20 │   .describeImages({
  21 │     Owners: ["amazon"],
  22 │     Filters: [
  23 │       { Name: "name", Values: ["al2023-ami-2023.*"] },
  24 │       { Name: "architecture", Values: ["x86_64"] },
  25 │       { Name: "state", Values: ["available"] },
  26 │       { Name: "root-device-type", Values: ["ebs"] },
  27 │       { Name: "virtualization-type", Values: ["hvm"] },
  28 │     ],
  29 │   })
  30 │   .pipe(
  31 │     Effect.map(
  32 │       (response) =>
  33 │         (response.Images ?? [])
  34 │           .slice()
  35 │           .sort((a, b) =>
  36 │             String(b.CreationDate ?? "").localeCompare(
  37 │               String(a.CreationDate ?? ""),
  38 │             ),
  39 │           )[0]?.ImageId ?? "ami-00000000000000000",
  40 │     ),
  41 │   );

0.77 packages/alchemy/test/Cloudflare/Utils/Http.ts:221:3
  218 │ export class HttpResponseMismatch extends Data.TaggedError(
  219 │   "HttpResponseMismatch",
  220 │ )<{
> 221 │   url: string;
  222 │   expected: string;
  223 │   actual: string;
  224 │ }> {}

0.77 packages/alchemy/test/Cloudflare/Website/vite-container-fixture/src/worker.ts:11:3
  10 │ export class EchoObject extends Container {
> 11 │   defaultPort = 8080;
  12 │ }

0.77 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:31:7
  26 │   Effect.gen(function* () {
  27 │     const cluster = yield* AWS.EKS.Cluster.ref("EksHostCluster");
  28 │     return {
  29 │       main: import.meta.url,
  30 │       cluster,
> 31 │       port: 3000,
  32 │       serviceType: "LoadBalancer" as const,
  33 │     };
  34 │   }),

0.77 packages/alchemy/test/Neon/fixtures/function-effect.ts:24:1
> 24 │ const recordLifecycle = (id: string, phase: string) =>
  25 │   Effect.gen(function* () {
  26 │     const sql = yield* diagnosticSql;
  27 │     yield* sql`INSERT INTO alchemy_function_lifecycle (id, phase) VALUES (${id}, ${phase}) ON CONFLICT DO NOTHING`;
  28 │   }).pipe(Effect.scoped);

0.77 packages/cloudflare-runtime/src/core/bindings/queue/QueueBroker.worker.ts:121:5
  118 │   private backlogBytes = 0;
  119 │
  120 │   private get queueName(): string {
> 121 │     return this.env[BINDING_QUEUE_NAME];
  122 │   }

0.76 packages/alchemy/src/Alchemist/routes/logs.ts:12:3
   9 │ import { open, type StackTarget } from "../Session.ts";
  10 │
  11 │ export interface ResourceIdentity {
> 12 │   readonly fqn: string;
  13 │   readonly logicalId: string;
  14 │   readonly resourceType: string;
  15 │ }

0.76 packages/alchemy/src/Auth/Profile.ts:161:5
  158 │ export class MissingProviderConfig extends Schema.TaggedError<MissingProviderConfig>()(
  159 │   "MissingProviderConfig",
  160 │   {
> 161 │     provider: Schema.String,
  162 │     profileName: Schema.String,
  163 │     message: Schema.String,
  164 │   },
  165 │ ) {}

0.76 packages/alchemy/src/AWS/AMP/internal.ts:22:1
> 22 │ export const readAmpTags = Effect.fn(function* (arn: string) {
  23 │   const response = yield* amp
  24 │     .listTagsForResource({ resourceArn: arn })
  25 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  26 │   return toTagRecord(response?.tags);
  27 │ });

0.76 packages/alchemy/src/AWS/ApiGateway/Authorizer.ts:67:5
  63 │ export interface Authorizer extends Resource<
  64 │   "AWS.ApiGateway.Authorizer",
  65 │   AuthorizerProps,
  66 │   {
> 67 │     authorizerId: string;
  68 │     restApiId: string;
  69 │     name: string;
  70 │     type: ag.AuthorizerType;
  71 │   },
  72 │   never,
  73 │   Providers
  74 │ > {}

0.76 packages/alchemy/src/AWS/ApiGateway/GatewayResource.ts:41:5
  37 │ export interface ApiGatewayResource extends ResourceType<
  38 │   "AWS.ApiGateway.Resource",
  39 │   ApiGatewayResourceProps,
  40 │   {
> 41 │     resourceId: string;
  42 │     restApiId: string;
  43 │     parentId: string;
  44 │     pathPart: string;
  45 │   },
  46 │   never,
  47 │   Providers
  48 │ > {}

0.76 packages/alchemy/src/AWS/ApiGatewayV2/ApiMapping.ts:16:3
  11 │ export interface ApiMappingProps {
  12 │   /**
  13 │    * ID of the API being mapped. Usually derived from `api.apiId` by the
  14 │    * {@link ApiMapping} wrapper.
  15 │    */
> 16 │   apiId: string;
  17 │   /**
  18 │    * The custom domain name to map the API onto. Changing this triggers a
  19 │    * replacement.
  20 │    */
  21 │   domainName: string;
  22 │   /**
  23 │    * The stage to serve at the mapping, e.g. `$default`.
  24 │    */
  25 │   stage: string;
  26 │   /**
  27 │    * The base path under the domain, e.g. `v1` serves the API at
  28 │    * `https://{domainName}/v1`. Omit to serve at the domain root.
  29 │    */
  30 │   apiMappingKey?: string;
  31 │ }

0.76 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:372:11
  371 │         yield* iam.attachRolePolicy({
> 372 │           RoleName: roleName,
  373 │           PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole",
  374 │         });

0.76 packages/alchemy/src/AWS/CloudControl/Resource.ts:101:3
  100 │ class ResourceRequestFailed extends Data.TaggedError("ResourceRequestFailed")<{
> 101 │   readonly typeName: string;
  102 │   readonly operation: string;
  103 │   readonly errorCode: string | undefined;
  104 │   readonly statusMessage: string | undefined;
  105 │ }> {}

0.76 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:14:3
  10 │ export interface InvalidationProps {
  11 │   /**
  12 │    * Distribution to invalidate.
  13 │    */
> 14 │   distributionId: string;
  15 │   /**
  16 │    * Version string used as the invalidation caller reference. Change this value
  17 │    * to trigger a new invalidation.
  18 │    */
  19 │   version: string;
  20 │   /**
  21 │    * Paths to invalidate.
  22 │    * @default ["/*"]
  23 │    */
  24 │   paths?: string[];
  25 │   /**
  26 │    * Wait for the invalidation to complete.
  27 │    * @default false
  28 │    */
  29 │   wait?: boolean;
  30 │ }

0.76 packages/alchemy/src/AWS/CloudFront/OriginRequestPolicy.ts:41:5
  37 │   {
  38 │     /**
  39 │      * CloudFront-assigned origin request policy identifier.
  40 │      */
> 41 │     originRequestPolicyId: string;
  42 │     /**
  43 │      * Name of the origin request policy.
  44 │      */
  45 │     name: string;
  46 │     /**
  47 │      * Most recent entity tag for update/delete operations.
  48 │      */
  49 │     etag: string | undefined;
  50 │     /**
  51 │      * Current comment on the policy.
  52 │      */
  53 │     comment: string | undefined;
  54 │     /**
  55 │      * Current headers configuration.
  56 │      */
  57 │     headersConfig: cloudfront.OriginRequestPolicyHeadersConfig;
  58 │     /**
  59 │      * Current cookies configuration.
  60 │      */
  61 │     cookiesConfig: cloudfront.OriginRequestPolicyCookiesConfig;
  62 │     /**
  63 │      * Current query strings configuration.
  64 │      */
  65 │     queryStringsConfig: cloudfront.OriginRequestPolicyQueryStringsConfig;
  66 │   },

0.76 packages/alchemy/src/AWS/CloudFront/RealtimeLogConfig.ts:161:3
  158 │ const toAttrs = (
  159 │   config: cloudfront.RealtimeLogConfig,
  160 │ ): RealtimeLogConfig["Attributes"] => ({
> 161 │   arn: config.ARN,
  162 │   name: config.Name,
  163 │   samplingRate: config.SamplingRate,
  164 │   fields: [...config.Fields],
  165 │   endpoints: fromEndPoints([...config.EndPoints]),
  166 │ });

0.76 packages/alchemy/src/AWS/Cognito/ManagedLoginBranding.ts:46:3
> 46 │   userPoolId: string;

0.76 packages/alchemy/src/AWS/DataZone/EnvironmentBlueprintConfiguration.ts:41:3
> 41 │   environmentBlueprint: string;

0.76 packages/alchemy/src/AWS/DAX/Cluster.ts:120:5
  117 │     /** Hostname of the cluster discovery endpoint. */
  118 │     discoveryEndpointAddress: string | undefined;
  119 │     /** Port of the cluster discovery endpoint. */
> 120 │     discoveryEndpointPort: number | undefined;
  121 │     /** Full `dax://` (or `daxs://` for TLS) discovery endpoint URL clients connect to. */
  122 │     discoveryEndpointUrl: string | undefined;

0.76 packages/alchemy/src/AWS/DAX/Connect.ts:15:3
  13 │ export interface ClusterConnectionInfo {
  14 │   /** Discovery endpoint hostname. */
> 15 │   host: string;
  16 │   /** Discovery endpoint port (8111 unencrypted, 9111 for TLS). */
  17 │   port: number;
  18 │   /**
  19 │    * Full `dax://` (or `daxs://` for TLS) discovery endpoint URL — the value
  20 │    * DAX SDK clients accept directly.
  21 │    */
  22 │   url: string;
  23 │   /** Whether the cluster endpoint requires encryption in transit (TLS). */
  24 │   tls: boolean;
  25 │ }

0.76 packages/alchemy/src/AWS/Deadline/Budget.ts:421:7
> 421 │       };
  422 │     }),
  423 │   );

0.76 packages/alchemy/src/AWS/DevOpsGuru/NotificationChannel.ts:37:5
  32 │ export interface NotificationChannel extends Resource<
  33 │   "AWS.DevOpsGuru.NotificationChannel",
  34 │   NotificationChannelProps,
  35 │   {
  36 │     /** ID of the notification channel. */
> 37 │     id: string;
  38 │     /** ARN of the SNS topic the channel notifies. */
  39 │     topicArn: string;
  40 │   },
  41 │   never,
  42 │   Providers
  43 │ > {}

0.76 packages/alchemy/src/AWS/DocDB/Connect.ts:20:3
  18 │ export interface MongoConnectionInfo {
  19 │   /** Writer (cluster) endpoint hostname. */
> 20 │   host: string;
  21 │   /** Listener port (27017 by default). */
  22 │   port: number;
  23 │   /** Database name, when one was requested. */
  24 │   database?: string;
  25 │   /** Login user resolved from the secret. */
  26 │   username?: string;
  27 │   /** Login password resolved from the secret. */
  28 │   password?: Redacted.Redacted<string>;
  29 │   /** Whether the connection uses TLS (DocumentDB clusters default to on). */
  30 │   tls: boolean;
  31 │   /**
  32 │    * `mongodb://` connection URL carrying the DocumentDB-recommended options
  33 │    * (`replicaSet=rs0`, `readPreference=secondaryPreferred`,
  34 │    * `retryWrites=false`). `Redacted` because it embeds the password.
  35 │    *
  36 │    * DocumentDB certificates chain to the private Amazon RDS CA that Node's
  37 │    * trust store doesn't carry, so the URL sets
  38 │    * `tlsAllowInvalidCertificates=true` (TLS encryption on, identity
  39 │    * verification off — libpq `require` semantics, matching
  40 │    * `AWS.RDS.Connect`). Pass the RDS CA bundle to {@link mongo}'s `ca`
  41 │    * option to restore full verification.
  42 │    */
  43 │   url: Redacted.Redacted<string>;
  44 │ }

0.76 packages/alchemy/src/AWS/EC2/DefaultSecurityGroup.ts:98:5
   83 │ export interface DefaultSecurityGroup extends Resource<
   84 │   "AWS.EC2.DefaultSecurityGroup",
   85 │   DefaultSecurityGroupProps,
   86 │   {
   87 │     /** The ID of the AWS-created default security group. */
   88 │     groupId: SecurityGroupId;
   89 │     /** The ARN of the default security group. */
   90 │     groupArn: SecurityGroupArn;
   91 │     /** The AWS-assigned group name, always `default`. */
   92 │     groupName: string;
   93 │     /** The AWS-assigned description of the group. */
   94 │     description: string;
   95 │     /** The VPC that owns this default security group. */
   96 │     vpcId: VpcId;
   97 │     /** The AWS account that owns the group. */
>  98 │     ownerId: string;
   99 │     /** The complete inbound rule set observed after reconciliation. */
  100 │     ingressRules: DefaultSecurityGroupRuleAttributes<false>[];
  101 │     /** The complete outbound rule set observed after reconciliation. */
  102 │     egressRules: DefaultSecurityGroupRuleAttributes<true>[];
  103 │   },
  104 │   never,
  105 │   Providers
  106 │ > {}

0.76 packages/alchemy/src/AWS/EventBridge/EventBus.ts:27:1
> 27 │ export type EventBusName = string;
  28 │ export type EventBusArn =
  29 │   `arn:aws:events:${RegionID}:${AccountID}:event-bus/${EventBusName}`;

0.76 packages/alchemy/src/AWS/EventBridge/Rule.ts:265:5
  256 │ export interface Rule extends Resource<
  257 │   "AWS.EventBridge.Rule",
  258 │   RuleProps,
  259 │   {
  260 │     /** The name of the rule. */
  261 │     ruleName: RuleName;
  262 │     /** The ARN of the rule. */
  263 │     ruleArn: RuleArn;
  264 │     /** The event bus associated with the rule. */
> 265 │     eventBusName: string;
  266 │   },
  267 │   never,
  268 │   Providers
  269 │ > {}

0.76 packages/alchemy/src/AWS/GuardDuty/ThreatIntelSet.ts:121:3
  119 │ const threatIntelSetArn = (
  120 │   region: string,
> 121 │   accountId: string,
  122 │   detectorId: string,
  123 │   threatIntelSetId: string,
  124 │ ) =>
  125 │   `arn:aws:guardduty:${region}:${accountId}:detector/${detectorId}/threatintelset/${threatIntelSetId}`;

0.76 packages/alchemy/src/AWS/Lambda/NetworkConnector.ts:74:5
  71 │     /**
  72 │      * The unique ID of the network connector.
  73 │      */
> 74 │     networkConnectorId: string;

0.76 packages/alchemy/src/AWS/MailManager/AddonInstance.ts:42:3
  29 │ export interface AddonInstance extends Resource<
  30 │   "AWS.MailManager.AddonInstance",
  31 │   AddonInstanceProps,
  32 │   {
  33 │     /** Server-assigned ID of the Add On instance. */
  34 │     addonInstanceId: string;
  35 │     /** ARN of the Add On instance. */
  36 │     addonInstanceArn: string;
  37 │     /** ID of the subscription the instance was created from. */
  38 │     addonSubscriptionId: string;
  39 │     /** Name of the Add On product. */
  40 │     addonName: string | undefined;
  41 │   },
> 42 │   never,
  43 │   Providers
  44 │ > {}

0.76 packages/alchemy/src/AWS/Omics/RunGroup.ts:54:5
  47 │ export interface RunGroup extends Resource<
  48 │   "AWS.Omics.RunGroup",
  49 │   RunGroupProps,
  50 │   {
  51 │     /**
  52 │      * ID of the run group.
  53 │      */
> 54 │     runGroupId: string;
  55 │     /**
  56 │      * ARN of the run group.
  57 │      */
  58 │     runGroupArn: string;
  59 │     /**
  60 │      * Name of the run group.
  61 │      */
  62 │     name: string;
  63 │   },
  64 │   never,
  65 │   Providers
  66 │ > {}

0.76 packages/alchemy/src/AWS/OpenSearchServerless/internal.ts:14:3
  10 │ export class OpenSearchServerlessProvisioningFailed extends Data.TaggedError(
  11 │   "OpenSearchServerlessProvisioningFailed",
  12 │ )<{
  13 │   readonly resource: string;
> 14 │   readonly id: string;
  15 │   readonly status: string | undefined;
  16 │   readonly failureCode: string | undefined;
  17 │   readonly failureMessage: string | undefined;
  18 │ }> {}

0.76 packages/alchemy/src/AWS/S3Control/MultiRegionAccessPoint.ts:81:3
  54 │ export interface MultiRegionAccessPoint extends Resource<
  55 │   "AWS.S3Control.MultiRegionAccessPoint",
  56 │   MultiRegionAccessPointProps,
  57 │   {
  58 │     /**
  59 │      * Name of the Multi-Region Access Point.
  60 │      */
  61 │     multiRegionAccessPointName: string;
  62 │     /**
  63 │      * ARN of the Multi-Region Access Point (regionless, alias-addressed).
  64 │      */
  65 │     multiRegionAccessPointArn: string;
  66 │     /**
  67 │      * The S3-assigned alias of the Multi-Region Access Point. Requests are
  68 │      * addressed to `${alias}.accesspoint.s3-global.amazonaws.com`.
  69 │      */
  70 │     alias: string | undefined;
  71 │     /**
  72 │      * Provisioning status of the Multi-Region Access Point at the time of
  73 │      * the last deploy (`READY` once fully provisioned).
  74 │      */
  75 │     status: s3control.MultiRegionAccessPointStatus | undefined;
  76 │     /**
  77 │      * AWS account ID that owns the Multi-Region Access Point.
  78 │      */
  79 │     accountId: AccountID;
  80 │   },
> 81 │   never,
  82 │   Providers
  83 │ > {}

0.76 packages/alchemy/src/AWS/ServiceCatalog/PortfolioProductAssociation.ts:15:3
  10 │ export interface PortfolioProductAssociationProps {
  11 │   /**
  12 │    * ID of the portfolio the product is added to. Changing it replaces the
  13 │    * association.
  14 │    */
> 15 │   portfolioId: string;
  16 │   /**
  17 │    * ID of the product to add to the portfolio. Changing it replaces the
  18 │    * association.
  19 │    */
  20 │   productId: string;
  21 │ }

0.76 packages/alchemy/src/AWS/Timestream/internal.ts:20:3
  17 │ type Kind = "write" | "query";
  18 │
  19 │ interface CachedEndpoint {
> 20 │   readonly url: string;
  21 │   readonly expiresAt: number;
  22 │ }

0.76 packages/alchemy/src/Cloudflare/Argo/TieredCaching.ts:20:3
  14 │ export type TieredCachingProps = {
  15 │   /**
  16 │    * Zone the Tiered Caching setting belongs to. Stable — changing the
  17 │    * zone triggers a replacement (the old zone's setting is restored to
  18 │    * the value it had before Alchemy managed it).
  19 │    */
> 20 │   zoneId: string;
  21 │   /**
  22 │    * Whether Tiered Caching is enabled on the zone. Mutable — patched in
  23 │    * place.
  24 │    *
  25 │    * @default true
  26 │    */
  27 │   enabled?: boolean;
  28 │ };

0.76 packages/alchemy/src/Cloudflare/CustomHostname/FallbackOrigin.ts:17:3
  12 │ export interface FallbackOriginProps {
  13 │   /**
  14 │    * Zone the fallback origin belongs to. Stable — a zone has exactly one
  15 │    * fallback origin, so changing the zone triggers replacement.
  16 │    */
> 17 │   zoneId: string;
  18 │   /**
  19 │    * Your origin hostname that requests to custom hostnames are sent to.
  20 │    * Must be a DNS record (A, AAAA or CNAME) within the zone — create the
  21 │    * `Cloudflare.DNS.Record` first and pass its name.
  22 │    *
  23 │    * Mutable — the API is a PUT-style upsert.
  24 │    */
  25 │   origin: string;
  26 │ }

0.76 packages/alchemy/src/Cloudflare/Diagnostics/EndpointHealthcheck.ts:61:3
  57 │ export type EndpointHealthcheck = Resource<
  58 │   TypeId,
  59 │   EndpointHealthcheckProps,
  60 │   EndpointHealthcheckAttributes,
> 61 │   never,
  62 │   Providers
  63 │ >;

0.76 packages/alchemy/src/Cloudflare/DNS/Dnssec.ts:141:3
  136 │ export type Dnssec = Resource<
  137 │   TypeId,
  138 │   DnssecProps,
  139 │   DnssecAttributes,
  140 │   never,
> 141 │   Providers
  142 │ >;

0.76 packages/alchemy/src/Cloudflare/Firewall/AccessRule.ts:381:3
  379 │ const findByConfiguration = (
  380 │   zoneId: string | undefined,
> 381 │   accountId: string,
  382 │   configuration: AccessRuleConfiguration,
  383 │ ) =>
  384 │   (zoneId !== undefined
  385 │     ? firewall.listAccessRulesForZone.items({ zoneId })
  386 │     : firewall.listAccessRulesForAccount.items({ accountId })
  387 │   ).pipe(
  388 │     Stream.runCollect,
  389 │     Effect.map((chunk) =>
  390 │       Array.from(chunk).find(
  391 │         (rule): rule is ObservedRule =>
  392 │           rule.configuration.target === configuration.target &&
  393 │           rule.configuration.value === configuration.value,
  394 │       ),
  395 │     ),
  396 │   );

0.76 packages/alchemy/src/Cloudflare/Gateway/Configuration.ts:422:3
  421 │ const toAttributes = (
> 422 │   accountId: string,
  423 │   observed: zeroTrust.GetGatewayConfigurationResponse,
  424 │   initialSettings: ConfigurationSnapshot,
  425 │ ): ConfigurationAttributes => ({
  426 │   accountId,
  427 │   settings: observed.settings ?? {},
  428 │   initialSettings,
  429 │   createdAt: observed.createdAt ?? undefined,
  430 │   updatedAt: observed.updatedAt ?? undefined,
  431 │ });

0.76 packages/alchemy/src/Cloudflare/Gateway/ProxyEndpoint.ts:283:3
  279 │ const toAttributes = (
  280 │   endpoint: ObservedEndpoint,
  281 │   accountId: string,
  282 │ ): ProxyEndpointAttributes => ({
> 283 │   proxyEndpointId: endpoint.id ?? "",
  284 │   accountId,
  285 │   name: endpoint.name,
  286 │   kind: (endpoint.kind ?? "ip") as ProxyEndpointKind,
  287 │   ips: observedIpsOf(endpoint),
  288 │   subdomain: endpoint.subdomain ?? undefined,
  289 │   createdAt: endpoint.createdAt ?? undefined,
  290 │   updatedAt: endpoint.updatedAt ?? undefined,
  291 │ });

0.76 packages/alchemy/src/Cloudflare/GoogleTagGateway/GoogleTagGateway.ts:88:3
  84 │ export type GoogleTagGateway = Resource<
  85 │   TypeId,
  86 │   Props,
  87 │   Attributes,
> 88 │   never,
  89 │   Providers
  90 │ >;

0.76 packages/alchemy/src/Cloudflare/Intel/IndicatorFeed.ts:361:1
> 361 │ const getFeed = (accountId: string, feedId: number) =>
  362 │   intel.getIndicatorFeed({ accountId, feedId }).pipe(
  363 │     Effect.map((f): ObservedFeed | undefined => f),
  364 │     Effect.catchTag("IndicatorFeedNotFound", () => Effect.succeed(undefined)),
  365 │   );

0.76 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/LeakedCredentialCheck.ts:21:3
  15 │ export interface Props {
  16 │   /**
  17 │    * Zone whose Leaked Credential Checks setting is managed. Stable —
  18 │    * changing the zone triggers a replacement (the old zone's setting is
  19 │    * restored to the value it had before Alchemy managed it).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Whether Leaked Credential Checks are enabled on the zone. Mutable —
  24 │    * set in place via the API's POST upsert.
  25 │    * @default true
  26 │    */
  27 │   enabled?: boolean;
  28 │ }

0.76 packages/alchemy/src/Cloudflare/Pipelines/LegacyPipeline.ts:341:3
  340 │ interface ObservedLegacyPipeline {
> 341 │   id: string;
  342 │   name: string;
  343 │   endpoint: string;
  344 │   version: number;
  345 │   destination: {
  346 │     batch: { maxBytes: number; maxDurationS: number; maxRows: number };
  347 │     compression: { type: string };
  348 │     path: {
  349 │       bucket: string;
  350 │       filename?: string | null;
  351 │       filepath?: string | null;
  352 │       prefix?: string | null;
  353 │     };
  354 │   };
  355 │   source: readonly {
  356 │     type: string;
  357 │     authentication?: boolean | null;
  358 │     cors?: { origins?: readonly string[] | null } | null;
  359 │   }[];
  360 │ }

0.76 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:43:3
  41 │ export interface PipelineAttributes {
  42 │   /** Cloudflare-assigned pipeline identifier. */
> 43 │   pipelineId: string;
  44 │   /** Account that owns the pipeline. */
  45 │   accountId: string;
  46 │   /** Pipeline name (unique per account). */
  47 │   name: string;
  48 │   /** SQL statement of the processing flow. */
  49 │   sql: string;
  50 │   /** Current status of the pipeline. */
  51 │   status: string;
  52 │   /** When the pipeline was created. */
  53 │   createdAt: string;
  54 │   /** When the pipeline was last modified. */
  55 │   modifiedAt: string;
  56 │ }

0.76 packages/alchemy/src/Cloudflare/Queues/Queue.ts:42:5
  38 │ export type Queue = Resource<
  39 │   "Cloudflare.Queues.Queue",
  40 │   QueueProps,
  41 │   {
> 42 │     queueId: string;
  43 │     queueName: string;
  44 │     accountId: string;
  45 │   },
  46 │   never,
  47 │   Providers
  48 │ >;

0.76 packages/alchemy/src/Cloudflare/Queues/QueueHttp.ts:99:3
   98 │ export interface HttpScope {
>  99 │   accountId: string;
  100 │   queueId: string;
  101 │ }

0.76 packages/alchemy/src/Cloudflare/R2/BucketEventNotification.ts:103:3
   95 │ export interface BucketEventNotificationAttributes {
   96 │   /** Name of the bucket that produces the events. */
   97 │   bucketName: string;
   98 │   /** ID of the queue that receives the event messages. */
   99 │   queueId: string;
  100 │   /** Name of the queue that receives the event messages, if reported. */
  101 │   queueName: string | undefined;
  102 │   /** Account the configuration lives in. */
> 103 │   accountId: string;
  104 │   /** Jurisdiction of the bucket. */
  105 │   jurisdiction: Bucket.Jurisdiction;
  106 │   /** The active notification rules, including server-assigned rule IDs. */
  107 │   rules: BucketEventNotification.Rule[];
  108 │ }

0.76 packages/alchemy/src/Cloudflare/Ruleset/Ruleset.ts:261:3
  256 │ export const toRulesetAttributes = (
  257 │   zoneId: string,
  258 │   ruleset: rulesets.GetPhasResponse | rulesets.PutPhasResponse,
  259 │ ): Ruleset["Attributes"] => ({
  260 │   rulesetId: ruleset.id,
> 261 │   zoneId,
  262 │   kind: ruleset.kind,
  263 │   name: ruleset.name,
  264 │   phase: ruleset.phase,
  265 │   description: ruleset.description ?? undefined,
  266 │   rules: (ruleset.rules ?? []).map(
  267 │     ({ lastUpdated: _lastUpdated, version: _version, ...rule }) => rule,
  268 │   ),
  269 │   lastUpdated: ruleset.lastUpdated,
  270 │   version: ruleset.version,
  271 │ });

0.76 packages/alchemy/src/Cloudflare/Rum/Rule.ts:62:3
  59 │   /**
  60 │    * The hostname the rule applies to.
  61 │    */
> 62 │   host: string | undefined;

0.76 packages/alchemy/src/Cloudflare/SchemaValidation/Schema.ts:341:3
  340 │ const toAttributes = (
> 341 │   zoneId: string,
  342 │   schema:
  343 │     | schemaValidation.GetSchemaResponse
  344 │     | schemaValidation.CreateSchemaResponse
  345 │     | schemaValidation.PatchSchemaResponse
  346 │     | schemaValidation.ListSchemasResponse["result"][number],
  347 │ ): SchemaAttributes => ({
  348 │   schemaId: schema.schemaId,
  349 │   zoneId,
  350 │   name: schema.name,
  351 │   kind: schema.kind,
  352 │   source: schema.source,
  353 │   validationEnabled: schema.validationEnabled ?? false,
  354 │   createdAt: schema.createdAt,
  355 │ });

0.76 packages/alchemy/src/Cloudflare/SecurityTxt/SecurityTxt.ts:21:3
> 21 │   zoneId: string;

0.76 packages/alchemy/src/Cloudflare/Tags/AccountResourceTags.ts:101:3
   97 │ export type AccountResourceTags = Resource<
   98 │   TypeId,
   99 │   AccountResourceTagsProps,
  100 │   AccountResourceTagsAttributes,
> 101 │   never,
  102 │   Providers
  103 │ >;

0.76 packages/alchemy/src/Cloudflare/VulnerabilityScanner/Credential.ts:61:3
  55 │ export interface VulnScannerCredentialAttributes {
  56 │   /** Server-assigned credential identifier (UUID). */
  57 │   credentialId: string;
  58 │   /** The parent credential set identifier. */
  59 │   credentialSetId: string;
  60 │   /** The Cloudflare account the credential belongs to. */
> 61 │   accountId: string;
  62 │   /** Human-readable name. */
  63 │   name: string;
  64 │   /** Where the credential is attached in outgoing requests. */
  65 │   location: VulnScannerCredentialLocation;
  66 │   /** Name of the header or cookie the credential is attached as. */
  67 │   locationName: string;
  68 │ }

0.76 packages/alchemy/src/Cloudflare/Workers/LocalWorkerProvider.ts:861:23
  859 │                       compatibilityDate: worker.compatibility.date,
  860 │                       compatibilityFlags: worker.compatibility.flags,
> 861 │                       bindings: worker.workerBindings as never,
  862 │                       hyperdrives: worker.hyperdrives,
  863 │                       durableObjectNamespaces: worker.durableObjectNamespaces,
  864 │                       workflows: worker.workflows,

0.76 packages/alchemy/src/Fly/Certificate.ts:401:3
  397 │ const replaceCustom = (
  398 │   appName: string,
  399 │   hostname: string,
  400 │   fullchain: string,
> 401 │   privateKey: string,
  402 │ ) =>
  403 │   Effect.gen(function* () {
  404 │     yield* machines
  405 │       .deleteAppCustomCertificate({
  406 │         app_name: appName,
  407 │         hostname,
  408 │       })
  409 │       .pipe(Effect.catchTag("NotFound", () => Effect.void));
  410 │     yield* machines.createAppCustomCertificate({
  411 │       app_name: appName,
  412 │       hostname,
  413 │       fullchain,
  414 │       private_key: privateKey,
  415 │     });
  416 │   });

0.76 packages/alchemy/src/Git/Jobs/Fork.ts:119:1
  116 │ const FORKED_CONFIG_KEYS = ["default_branch", "description"] as const;
  117 │
  118 │ /** Rows per page for small-row tables. */
> 119 │ const PAGE_SIZE = 400;
  120 │ /** Rows per page for `objects` (each `zdata` BLOB may be up to 1 MiB). */
  121 │ const OBJECTS_PAGE_SIZE = 8;

0.76 packages/alchemy/src/Hetzner/Certificate.ts:187:3
  184 │ export class CertificateIssuancePending extends Data.TaggedError(
  185 │   "Hetzner.CertificateIssuancePending",
  186 │ )<{
> 187 │   certificateId: number;
  188 │   issuance: string;
  189 │ }> {}

0.76 packages/alchemy/src/Hetzner/FloatingIp.ts:70:5
  67 │     /**
  68 │      * Numeric Hetzner ID of the Floating IP.
  69 │      */
> 70 │     id: number;

0.76 packages/alchemy/src/Kubernetes/ClusterAdapter.ts:222:3
  220 │ export interface ImageRegistryResolveOptions {
  221 │   /** Logical resource id — keys generated repository names. */
> 222 │   id: string;
  223 │   /** The image-source props bag. */
  224 │   source: WorkloadImageSource;
  225 │   /** Target image platform (`linux/amd64` / `linux/arm64`). */
  226 │   platform: string;
  227 │   /** Port the generated Dockerfile exposes (`main` sources only). */
  228 │   port?: number;
  229 │   /** True when `main` bundles as-is (no Effect bootstrap entry). */
  230 │   isExternal?: boolean;
  231 │   /** The generated-entry bootstrap wrapped around `main`. */
  232 │   bootstrap: (importPath: string) => string;
  233 │   /** Tags for registry-owned cloud resources. */
  234 │   tags: Record<string, string>;
  235 │   /**
  236 │    * Previously persisted registry state, if any — untyped hints because
  237 │    * legacy pre-rename rows carry the old flat attribute shape; adapters
  238 │    * narrow structurally.
  239 │    */
  240 │   state: Record<string, unknown> | undefined;
  241 │   /** Plan-status session for build/push progress notes. */
  242 │   session: { note: (message: string) => Effect.Effect<void> };
  243 │ }

0.76 packages/alchemy/src/Kubernetes/Deployment.ts:225:5
  222 │     /** The name of the service account the pods run as. */
  223 │     serviceAccountName: string;
  224 │     /** The container port the server listens on. */
> 225 │     port: number;
  226 │     /** The URI of the container image the deployment runs. */
  227 │     imageUri: string;

0.76 packages/alchemy/src/Neon/FunctionTrigger.ts:44:3
  41 │ export interface FunctionTriggerAttributes {
  42 │   /** Owning project. */ projectId: string;
  43 │   /** Owning branch. */ branchId: string;
> 44 │   /** Project-wide trigger identifier. */ triggerId: string;
  45 │   /** Target Function slug. */ slug: string;
  46 │   /** Trigger name. */ name: string;
  47 │   /** Event type; changing it replaces the trigger. */ type:
  48 │     | "schedule"
  49 │     | "storage_object_created";
  50 │   /** Configured delivery route. */ path: string;
  51 │   /** Whether future delivery is enabled. */ enabled: boolean;
  52 │   /** Monotonic configuration version, not the event schema version. */ version: number;
  53 │   /** True when the configuration comes from an ancestor. */ inherited: boolean;
  54 │   /** Next cron time; absent for object events or disabled schedules. */ nextRunAt:
  55 │     | string
  56 │     | null
  57 │     | undefined;
  58 │ }

0.76 packages/alchemy/src/Neon/OrganizationApiKey.ts:13:3
  11 │ export interface OrganizationApiKeyProps {
  12 │   /** Organization that owns the key. Changes replace the key. */
> 13 │   orgId: string;
  14 │   /** Restrict access to this project. Omission grants organization-wide access. Changes replace the key. */
  15 │   projectId?: string;
  16 │   /** Immutable key label. Defaults to an instance-qualified physical name. Adding, changing, or removing an explicit label replaces the key. */
  17 │   name?: string;
  18 │ }

0.76 packages/alchemy/src/Neon/Website/Foldkit.ts:30:1
> 30 │ export const Foldkit = (id: string, props: FoldkitProps = {}) =>
  31 │   Vite(id, {
  32 │     ...props,
  33 │     assets: { notFoundHandling: "single-page-application", ...props.assets },
  34 │   });

0.76 packages/alchemy/src/Planetscale/Database.ts:86:3
  84 │ export interface BaseDatabaseAttributes {
  85 │   /** The unique identifier of the database. */
> 86 │   id: string;
  87 │   /** The name of the database. */
  88 │   name: string;

0.76 packages/alchemy/src/Prisma/Website/Foldkit.ts:30:1
> 30 │ export const Foldkit = (id: string, props: FoldkitProps = {}) =>
  31 │   Vite(id, {
  32 │     ...props,
  33 │     assets: { notFoundHandling: "single-page-application", ...props.assets },
  34 │   });

0.76 packages/alchemy/src/Railway/AuthProvider.ts:201:13
  188 │       const token = yield* withAnonymous(pollLoginSessionToken(code)).pipe(
  189 │         Effect.raceFirst(
  190 │           interaction.prompt
  191 │             .awaitExternal({
  192 │               message: "Railway authorization",
  193 │               waitingLabel:
  194 │                 "waiting for browser authorization (up to 5 minutes)…",
  195 │               url,
  196 │               code,
  197 │               openFailed,
  198 │               onOpen: () => runOpenUrl(Interaction.openUrl(url)),
  199 │               allowManualInput: false,
  200 │             })
> 201 │             .pipe(mapPromptCancellation, Effect.andThen(Effect.never)),
  202 │         ),
  203 │         Effect.onInterrupt(() => cancel),
  204 │         Effect.tapError(() => cancel),
  205 │         Effect.mapError((e) =>
  206 │           e instanceof AuthError
  207 │             ? e
  208 │             : new AuthError({
  209 │                 message: "Railway login session poll failed",
  210 │                 cause: e,
  211 │               }),
  212 │         ),
  213 │       );

0.76 packages/alchemy/src/Railway/hosted.ts:401:1
  400 │     return `${pins}
> 401 │ const g=globalThis,port=Number(process.env.PORT??3000);
  402 │ g.__aFF??=async()=>new Response("");
  403 │ Bun.serve({hostname:"0.0.0.0",port,fetch:r=>g.__aFF(r)});
  404 │ try{
  405 │ const u=new URL("./i.mjs",import.meta.url);
  406 │ await Bun.write(u,${JSON.stringify(inner)});
  407 │ await import(u.href);
  408 │ }catch(e){
  409 │ g.__aFF=async()=>new Response(String(e),{status:500});
  410 │ }
  411 │ `;

0.76 packages/alchemy/src/Railway/LoginSession.ts:9:1
  6 │ import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
  7 │
  8 │ /** Dashboard host used by `railway login --browserless` pairing URLs. */
> 9 │ export const RAILWAY_CLI_LOGIN_HOST = "https://railway.com";

0.76 packages/alchemy/src/Railway/ref.ts:8:1
> 8 │ export type VariableRef = string;

0.76 packages/alchemy/src/Railway/ServiceProvider.ts:261:7
  251 │ const assignIfChanged = <K extends keyof ServiceInstanceUpdateInput>(
  252 │   input: ServiceInstanceUpdateInput,
  253 │   key: K,
  254 │   desired: ServiceInstanceUpdateInput[K] | undefined,
  255 │   observed: unknown,
  256 │ ): boolean => {
  257 │   if (desired === undefined) return false;
  258 │   if (
  259 │     desired === null
  260 │       ? observed == null
> 261 │       : deepEqual(undef(observed as never), desired)
  262 │   ) {
  263 │     return false;
  264 │   }
  265 │   input[key] = desired;
  266 │   return true;
  267 │ };

0.76 packages/alchemy/src/Railway/Template.ts:154:3
> 154 │   never,
  155 │   Providers
  156 │ >;

0.76 packages/alchemy/src/Resource.ts:123:3
  120 │   /**
  121 │    * Logical ID of the Resource (e.g. MyFunction)
  122 │    */
> 123 │   LogicalId: LogicalId;

0.76 packages/alchemy/src/State/ActionState.ts:22:3
  13 │ interface BaseActionState {
  14 │   readonly kind: "action";
  15 │   /** Type of the Action (e.g. "NightlySync"). Mirrors `resourceType` for resources. */
  16 │   actionType: string;
  17 │   /** Namespace of the Action. */
  18 │   namespace: NamespaceNode | undefined;
  19 │   /** Fully qualified name (namespace + logical id). */
  20 │   fqn: string;
  21 │   /** Logical id of the Action (stable across runs). */
> 22 │   logicalId: string;
  23 │   /** Current status. */
  24 │   status: ActionStatus;
  25 │   /** FQNs of nodes that depend on this Action's output. */
  26 │   downstream: string[];
  27 │   /** Hash of the resolved input, used to skip noop runs. */
  28 │   inputHash: string;
  29 │   /** Resolved input snapshot from the most recent attempt. */
  30 │   input: unknown;
  31 │ }

0.76 packages/alchemy/src/Stripe/ApplePayDomain.ts:42:3
  29 │ export type ApplePayDomain = Resource<
  30 │   "Stripe.ApplePayDomain",
  31 │   ApplePayDomainProps,
  32 │   {
  33 │     /** Stripe Apple Pay domain id (`apwc_…`). */
  34 │     id: string;
  35 │     /** Fully-qualified hostname registered with Apple Pay. */
  36 │     domainName: string;
  37 │     /** Unix timestamp when the domain was registered. */
  38 │     created: number;
  39 │     /** Whether the domain exists in live mode. */
  40 │     livemode: boolean;
  41 │   },
> 42 │   never,
  43 │   Providers
  44 │ >;

0.76 packages/alchemy/src/Stripe/BillingMeter.ts:107:5
  102 │ export type BillingMeter = Resource<
  103 │   "Stripe.BillingMeter",
  104 │   BillingMeterProps,
  105 │   {
  106 │     /** Stripe billing meter id (`mtr_…`). */
> 107 │     id: string;
  108 │     /** The meter's name. Not visible to the customer. */
  109 │     displayName: string;
  110 │     /** Name of the meter event used to record usage. */
  111 │     eventName: string;
  112 │     /** How events are aggregated over a billing period. */
  113 │     defaultAggregation: BillingMeterDefaultAggregation;
  114 │     /** How a meter event is mapped to a customer. */
  115 │     customerMapping: BillingMeterCustomerMapping;
  116 │     /** Pre-aggregation window for meter events, if any. */
  117 │     eventTimeWindow: BillingMeterEventTimeWindow | undefined;
  118 │     /** How to calculate a meter event's value. */
  119 │     valueSettings: BillingMeterValueSettings;
  120 │     /** Whether the meter accepts events and can attach to a price. */
  121 │     status: BillingMeterStatus;
  122 │     /** Unix timestamp when the meter was created. */
  123 │     created: number;
  124 │     /** Unix timestamp when the meter was last updated. */
  125 │     updated: number;
  126 │     /** Whether the meter exists in live mode. */
  127 │     livemode: boolean;
  128 │   },
  129 │   never,
  130 │   Providers
  131 │ >;

0.76 packages/alchemy/src/Stripe/Plan.ts:44:3
> 44 │   product: string;

0.76 packages/alchemy/src/Stripe/Product.ts:221:3
  220 │ const desiredMetadata = Effect.fn(function* (
> 221 │   id: string,
  222 │   metadata: Record<string, string> | undefined,
  223 │ ) {
  224 │   return {
  225 │     ...toMetadata(metadata),
  226 │     ...(yield* createInternalMetadata(id)),
  227 │   };
  228 │ });

0.76 packages/alchemy/src/Stripe/TerminalLocation.ts:361:3
  358 │ const toAttrs = (
  359 │   location: StripeTerminalLocation,
  360 │ ): TerminalLocationAttributes => ({
> 361 │   id: location.id,
  362 │   displayName: location.display_name,
  363 │   address: fromObservedAddress(location.address),
  364 │   addressKana: fromObservedJapanAddress(location.address_kana),
  365 │   addressKanji: fromObservedJapanAddress(location.address_kanji),
  366 │   configurationOverrides: optionalString(location.configuration_overrides),
  367 │   displayNameKana: optionalString(location.display_name_kana),
  368 │   displayNameKanji: optionalString(location.display_name_kanji),
  369 │   phone: optionalString(location.phone),
  370 │   metadata: userMetadata(location.metadata),
  371 │   livemode: location.livemode,
  372 │ });

0.76 packages/alchemy/test/AWS/QApps/bindings-handler.ts:27:1
> 27 │ const TEXT_CARD_ID = "11111111-1111-4111-8111-111111111111";
  28 │ const QUERY_CARD_ID = "22222222-2222-4222-8222-222222222222";

0.76 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:24:5
  21 │   const raw = yield* Effect.sync(() => createServer());
  22 │   const server = yield* NodeHttpServer.make(() => raw, {
  23 │     host: "127.0.0.1",
> 24 │     port: 0,
  25 │     gracefulShutdownTimeout: "1 second",
  26 │   });

0.76 packages/alchemy/test/Neon/FunctionRollout.ts:67:3
  65 │ /** Compare the shared HTTP client with a fresh, proxy-bypassing connection. */
  66 │ export const functionTextSamples = (
> 67 │   url: string,
  68 │   isCurrent: (body: string) => boolean,
  69 │ ) =>
  70 │   functionRolloutSamples(

0.76 packages/alchemy/test/Prisma/fixtures/write-compute.ts:18:7
  10 │ export default Compute(
  11 │   "PrismaWriteBucketCompute",
  12 │   Effect.gen(function* () {
  13 │     const project = yield* TestProject;
  14 │     return {
  15 │       project,
  16 │       appName: "alchemy-bucket-binding-write",
  17 │       main: import.meta.filename,
> 18 │       port: 8080,
  19 │       timeoutSeconds: 240,
  20 │       destroyOldDeployment: true,
  21 │     };
  22 │   }),
  23 │   Effect.gen(function* () {
  24 │     const bucket = yield* TestBucket;
  25 │     const store = yield* WriteBucket(bucket);
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
  29 │         const url = new URL(request.url, "http://x");
  30 │         const handled = yield* writeRoutes(store, request, url);
  31 │         return handled ?? HttpServerResponse.text("Not Found", { status: 404 });
  32 │       }),
  33 │     };
  34 │   }).pipe(Effect.provide(WriteBucketBinding)),
  35 │ );

0.76 packages/alchemy/test/SQL/exercise.ts:80:3
  77 │   yield* postJson(`${base}/reset`, {});
  78 │
  79 │   // sql.insert(row) nested in the outer template, read back via sql.and.
> 80 │   const alice: UserRow = { id: 1, name: "alice", email: "alice@example.com" };
  81 │   const created = (yield* postJson(`${base}/users`, alice)) as {
  82 │     rows: UserRow[];
  83 │   };

0.76 packages/cloudflare-runtime/src/core/bindings/VpcService.ts:3:1
   1 │ import { makeRemoteBinding } from "../remote-bindings/RemoteBindings.ts";
   2 │
>  3 │ export const remote = (binding: string, serviceId: string) =>
   4 │   makeRemoteBinding(
   5 │     {
   6 │       name: binding,
   7 │       type: "vpc_service",
   8 │       serviceId,
   9 │     },
  10 │     (service) => ({
  11 │       name: binding,
  12 │       service,
  13 │     }),
  14 │   );

0.76 packages/cloudflare-runtime/src/core/DockerLoopback.ts:108:3
  106 │ export const mergeSidecarLoopbackHostConfig = <T extends HostConfig>(
  107 │   original: T | undefined,
> 108 │   ports: readonly number[],
  109 │ ): T & { ExtraHosts: string[]; Binds?: string[] } => {
  110 │   const extraHost = sidecarLoopbackExtraHost();
  111 │   const extraHosts = [...(original?.ExtraHosts ?? [])];
  112 │   if (!extraHosts.includes(extraHost)) extraHosts.push(extraHost);
  113 │   const binds = [...(original?.Binds ?? [])];
  114 │   for (const bind of sidecarLoopbackBinds(ports)) {
  115 │     if (!binds.includes(bind)) binds.push(bind);
  116 │   }
  117 │   return {
  118 │     ...(original as T),
  119 │     ExtraHosts: extraHosts,
  120 │     ...(binds.length > 0 ? { Binds: binds } : {}),
  121 │   };
  122 │ };

0.76 packages/cloudflare-runtime/src/core/remote-bindings/RemoteWorkerConfig.shared.ts:9:3
   8 │ export interface RemoteWorkerResult {
>  9 │   readonly url: string;
  10 │   readonly headers: Record<string, string>;
  11 │ }

0.76 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/configuration.ts:26:5
   6 │ export const normalizeConfiguration = (
   7 │   configuration?: AssetConfig,
   8 │ ): Required<AssetConfig> => {
   9 │   const compatibilityOptions = resolveCompatibilityOptions(configuration);
  10 │
  11 │   return {
  12 │     compatibility_date: compatibilityOptions.compatibilityDate,
  13 │     compatibility_flags: compatibilityOptions.compatibilityFlags,
  14 │     html_handling: configuration?.html_handling ?? "auto-trailing-slash",
  15 │     not_found_handling: configuration?.not_found_handling ?? "none",
  16 │     redirects: configuration?.redirects ?? {
  17 │       version: 1,
  18 │       staticRules: {},
  19 │       rules: {},
  20 │     },
  21 │     headers: configuration?.headers ?? {
  22 │       version: 2,
  23 │       rules: {},
  24 │     },
  25 │     has_static_routing: configuration?.has_static_routing ?? false,
> 26 │     account_id: configuration?.account_id ?? -1,
  27 │     script_id: configuration?.script_id ?? -1,
  28 │     debug: configuration?.debug ?? false,
  29 │   };
  30 │ };

0.76 packages/cloudflare-runtime/src/internal/workflows-shared/lib/timePriorityQueue.ts:22:3
  21 │ type PriorityQueueDBEntry = {
> 22 │   id: number;
  23 │   created_on: string;
  24 │   target_timestamp: number;
  25 │   action: SQLiteBoolean;
  26 │   entryType: number;
  27 │   hash: string;
  28 │ };

0.76 packages/frontend-frameworks/fixtures/sveltekit/src/routes/cookies/+page.server.ts:4:3
  1 │ import type { PageServerLoad } from "./$types";
  2 │
  3 │ export const load: PageServerLoad = ({ cookies }) => {
> 4 │   const visits = Number(cookies.get("visits") ?? "0") + 1;
  5 │   cookies.set("visits", String(visits), { path: "/", httpOnly: false });
  6 │   return { visits };
  7 │ };

0.75 packages/alchemy/src/AWS/AMP/LoggingConfiguration.ts:16:3
  10 │ export interface LoggingConfigurationProps {
  11 │   /**
  12 │    * Id of the AMP workspace whose rules/alerting logs are shipped. A
  13 │    * workspace has at most one logging configuration. Changing the workspace
  14 │    * replaces the configuration.
  15 │    */
> 16 │   workspaceId: string;
  17 │   /**
  18 │    * ARN of the CloudWatch Logs log group that receives the workspace's rule
  19 │    * evaluation and alerting (vended) logs. AMP expects the ARN with a
  20 │    * trailing `:*` — one is appended automatically when missing.
  21 │    */
  22 │   logGroupArn: string;
  23 │ }

0.75 packages/alchemy/src/AWS/ApiGatewayV2/Integration.ts:118:3
   91 │ export interface IntegrationType extends Resource<
   92 │   "AWS.ApiGatewayV2.Integration",
   93 │   IntegrationProps,
   94 │   {
   95 │     /** The API this integration belongs to. */
   96 │     apiId: string;
   97 │     /** The integration identifier. */
   98 │     integrationId: string;
   99 │     integrationType: agw2.IntegrationType;
  100 │     integrationUri: string | undefined;
  101 │     integrationMethod: string | undefined;
  102 │     payloadFormatVersion: string | undefined;
  103 │     connectionType: agw2.ConnectionType | undefined;
  104 │     connectionId: string | undefined;
  105 │     credentialsArn: string | undefined;
  106 │     description: string | undefined;
  107 │     integrationSubtype: string | undefined;
  108 │     passthroughBehavior: agw2.PassthroughBehavior | undefined;
  109 │     requestParameters: { [key: string]: string | undefined } | undefined;
  110 │     requestTemplates: { [key: string]: string | undefined } | undefined;
  111 │     responseParameters:
  112 │       | { [key: string]: { [key: string]: string | undefined } | undefined }
  113 │       | undefined;
  114 │     templateSelectionExpression: string | undefined;
  115 │     timeoutInMillis: number | undefined;
  116 │     contentHandlingStrategy: agw2.ContentHandlingStrategy | undefined;
  117 │   },
> 118 │   never,
  119 │   Providers
  120 │ > {}

0.75 packages/alchemy/src/AWS/AppRegistry/internal.ts:5:1
> 5 │ export const clientToken = (instanceId: string): string =>
  6 │   instanceId.replaceAll(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "alchemy";

0.75 packages/alchemy/src/AWS/Batch/JobDefinition.ts:1060:21
  1053 │           yield* iam.listAttachedRolePolicies
  1054 │             .items({ RoleName: roleName })
  1055 │             .pipe(
  1056 │               Stream.mapEffect((policy) =>
  1057 │                 iam
  1058 │                   .detachRolePolicy({
  1059 │                     RoleName: roleName,
> 1060 │                     PolicyArn: policy.PolicyArn!,
  1061 │                   })
  1062 │                   .pipe(
  1063 │                     Effect.catchTag("NoSuchEntityException", () => Effect.void),
  1064 │                   ),
  1065 │               ),
  1066 │               Stream.runDrain,
  1067 │               Effect.catchTag("NoSuchEntityException", () => Effect.void),
  1068 │             );

0.75 packages/alchemy/src/AWS/CloudWatch/InsightRule.ts:21:1
> 21 │ export type InsightRuleName = string;
  22 │ export type InsightRuleArn =
  23 │   `arn:aws:cloudwatch:${RegionID}:${AccountID}:insight-rule/${string}`;

0.75 packages/alchemy/src/AWS/CloudWatch/MetricStream.ts:31:3
  24 │ export interface MetricStreamProps extends Omit<
  25 │   cloudwatch.PutMetricStreamInput,
  26 │   "Name" | "Tags"
  27 │ > {
  28 │   /**
  29 │    * Name of the metric stream. If omitted, a unique name is generated.
  30 │    */
> 31 │   name?: MetricStreamName;
  32 │   /**
  33 │    * Whether the stream should be running after deployment.
  34 │    * @default true
  35 │    */
  36 │   enabled?: boolean;
  37 │   /**
  38 │    * Optional tags to apply to the metric stream.
  39 │    */
  40 │   tags?: Record<string, string>;
  41 │ }

0.75 packages/alchemy/src/AWS/CodeConnections/SyncConfiguration.ts:83:3
  60 │ export interface SyncConfiguration extends Resource<
  61 │   "AWS.CodeConnections.SyncConfiguration",
  62 │   SyncConfigurationProps,
  63 │   {
  64 │     /** Name of the synced Amazon Web Services resource (e.g. stack name). */
  65 │     resourceName: string;
  66 │     /** The sync type. */
  67 │     syncType: string;
  68 │     /** Monitored branch. */
  69 │     branch: string;
  70 │     /** Path to the deployment file in the repository. */
  71 │     configFile: string;
  72 │     /** ID of the monitored repository link. */
  73 │     repositoryLinkId: string;
  74 │     /** Name of the linked repository. */
  75 │     repositoryName: string;
  76 │     /** Owner ID of the linked repository. */
  77 │     ownerId: string;
  78 │     /** The source provider (`GitHub`, `GitLab`, ...). */
  79 │     providerType: string;
  80 │     /** ARN of the IAM role Git sync assumes. */
  81 │     roleArn: string;
  82 │   },
> 83 │   never,
  84 │   Providers
  85 │ > {}

0.75 packages/alchemy/src/AWS/DirectoryService/Directory.ts:115:3
> 115 │   never,
  116 │   Providers
  117 │ > {}

0.75 packages/alchemy/src/AWS/DocDB/DBInstance.ts:21:3
> 21 │   dbClusterIdentifier: string;

0.75 packages/alchemy/src/AWS/EC2/PrefixList.ts:184:9
  181 │     PrefixList,
  182 │     Effect.gen(function* () {
  183 │       const createTags = Effect.fn(function* (
> 184 │         id: string,
  185 │         tags?: Record<string, string>,
  186 │       ) {
  187 │         return {
  188 │           Name: id,
  189 │           ...(yield* createInternalTags(id)),
  190 │           ...tags,
  191 │         };
  192 │       });

0.75 packages/alchemy/src/AWS/EC2/Route.ts:141:5
  138 │     /**
  139 │      * The ID of the NAT instance the route targets.
  140 │      */
> 141 │     instanceId?: string;

0.75 packages/alchemy/src/AWS/EMRServerless/JobRunEventSource.ts:17:3
  15 │ export interface JobRunEventDetail {
  16 │   /** The id of the EMR Serverless application the event is about. */
> 17 │   applicationId?: string;
  18 │   /** Job-run events: the id of the job run. */
  19 │   jobRunId?: string;
  20 │   /** The state transitioned to, e.g. `RUNNING`, `SUCCESS`, `FAILED`. */
  21 │   state?: string;
  22 │   /** Why the state changed (e.g. the failure reason). */
  23 │   stateDetails?: string;
  24 │   /** Additional event fields (the schema grows over time). */
  25 │   [key: string]: unknown;
  26 │ }

0.75 packages/alchemy/src/AWS/FIS/TargetAccountConfiguration.ts:20:3
   9 │ export interface TargetAccountConfigurationProps {
  10 │   /**
  11 │    * The ID of the experiment template the target account belongs to. The
  12 │    * template must use `accountTargeting: "multi-account"`. Changing it
  13 │    * replaces the configuration.
  14 │    */
  15 │   experimentTemplateId: string;
  16 │   /**
  17 │    * The AWS account ID of the target account. Changing it replaces the
  18 │    * configuration.
  19 │    */
> 20 │   accountId: string;
  21 │   /**
  22 │    * The ARN of an IAM role in the target account that grants FIS permission
  23 │    * to perform the experiment's actions there. The role must trust
  24 │    * `fis.amazonaws.com`.
  25 │    */
  26 │   roleArn: string;
  27 │   /**
  28 │    * A description of the target account. Once set, it cannot be fully
  29 │    * removed via the API — only changed.
  30 │    */
  31 │   description?: string;
  32 │ }

0.75 packages/alchemy/src/AWS/IAM/SSHPublicKey.ts:32:5
  25 │ export interface SSHPublicKey extends Resource<
  26 │   "AWS.IAM.SSHPublicKey",
  27 │   SSHPublicKeyProps,
  28 │   {
  29 │     /** The IAM user the SSH public key belongs to. */
  30 │     userName: string;
  31 │     /** The unique ID of the SSH public key. */
> 32 │     sshPublicKeyId: string;
  33 │     /** The MD5 fingerprint of the SSH public key. */
  34 │     fingerprint: string;
  35 │     /** The SSH public key material. */
  36 │     sshPublicKeyBody: string;
  37 │     /** Whether the key is `Active` or `Inactive`. */
  38 │     status: iam.StatusType;
  39 │     /** When the key was uploaded. */
  40 │     uploadDate: Date | undefined;
  41 │   },
  42 │   never,
  43 │   Providers
  44 │ > {}

0.75 packages/alchemy/src/AWS/Lambda/MicrovmRuntimeContext.ts:20:3
  19 │ export const makeMicrovmRuntimeContext = (
> 20 │   id: string,
  21 │ ): Server.ProcessContext => {
  22 │   const runners: Effect.Effect<void, never, any>[] = [];
  23 │   const env: Record<string, any> = {};

0.75 packages/alchemy/src/AWS/Notifications/ChannelAssociation.ts:16:3
  11 │ export interface ChannelAssociationProps {
  12 │   /**
  13 │    * The ARN of the {@link NotificationConfiguration} to deliver from.
  14 │    * Changing the configuration replaces the association.
  15 │    */
> 16 │   notificationConfigurationArn: string;
  17 │
  18 │   /**
  19 │    * The ARN of the delivery channel to associate. Supported channels are
  20 │    * email contacts (`AWS.NotificationsContacts.EmailContact`), Amazon Q
  21 │    * Developer in chat applications (AWS Chatbot) channels, and AWS Console
  22 │    * Mobile Application devices. Changing the channel replaces the
  23 │    * association.
  24 │    *
  25 │    * An email contact can be associated while still `inactive` (unverified);
  26 │    * AWS begins delivering to it once the address owner activates it.
  27 │    */
  28 │   channelArn: string;
  29 │ }

0.75 packages/alchemy/src/AWS/Organizations/PolicyAttachment.ts:281:3
  280 │ const readAttachment = Effect.fn(function* ({
> 281 │   policyId,
  282 │   targetId,
  283 │ }: PolicyAttachmentProps) {
  284 │   const targets = yield* retryOrganizations(
  285 │     collectPages(
  286 │       (NextToken) =>
  287 │         organizations.listTargetsForPolicy({ PolicyId: policyId, NextToken }),
  288 │       (page) => page.Targets,
  289 │     ),
  290 │   );
  291 │
  292 │   const target = targets.find((candidate) => candidate.TargetId === targetId);
  293 │   return target
  294 │     ? ({
  295 │         policyId,
  296 │         targetId,
  297 │         targetArn: target.Arn,
  298 │         targetName: target.Name,
  299 │         targetType: target.Type,
  300 │       } satisfies PolicyAttachment["Attributes"])
  301 │     : undefined;
  302 │ });

0.75 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:73:5
  70 │     /**
  71 │      * Instances explicitly attached to the endpoint.
  72 │      */
> 73 │     staticMembers: string[];

0.75 packages/alchemy/src/AWS/Route53/HostedZone.ts:60:5
  53 │ export interface HostedZone extends Resource<
  54 │   "AWS.Route53.HostedZone",
  55 │   HostedZoneProps,
  56 │   {
  57 │     /**
  58 │      * Hosted zone ID (without the `/hostedzone/` prefix).
  59 │      */
> 60 │     id: string;
  61 │     /**
  62 │      * Fully qualified zone name (with trailing dot).
  63 │      */
  64 │     name: string;
  65 │     /**
  66 │      * Authoritative name servers for the zone.
  67 │      */
  68 │     nameServers: string[];
  69 │     /**
  70 │      * Current zone comment.
  71 │      */
  72 │     comment: string | undefined;
  73 │   },
  74 │   never,
  75 │   Providers
  76 │ > {}

0.75 packages/alchemy/src/AWS/Route53/VpcAssociationAuthorization.ts:13:3
   8 │ export interface VpcAssociationAuthorizationProps {
   9 │   /**
  10 │    * ID of the private hosted zone to authorize the association with. Must be
  11 │    * a zone owned by the current account. Changing this forces replacement.
  12 │    */
> 13 │   hostedZoneId: string;
  14 │   /**
  15 │    * ID of the VPC that is authorized to be associated with the hosted zone
  16 │    * (typically a VPC owned by a different AWS account). Changing this forces
  17 │    * replacement.
  18 │    */
  19 │   vpcId: string;
  20 │   /**
  21 │    * Region the VPC lives in. Changing this forces replacement.
  22 │    */
  23 │   vpcRegion: string;
  24 │ }

0.75 packages/alchemy/src/AWS/Route53Resolver/ResolverRule.ts:58:3
> 58 │   domainName: string;

0.75 packages/alchemy/src/AWS/S3Tables/TableBucket.ts:211:9
  208 │       return {
  209 │         tableBucketArn: bucket.arn as TableBucketArn,
  210 │         name: bucket.name,
> 211 │         ownerAccountId: bucket.ownerAccountId,
  212 │         createdAt: bucket.createdAt,
  213 │         tableBucketId: bucket.tableBucketId,
  214 │         type: bucket.type,
  215 │       };

0.75 packages/alchemy/src/AWS/SageMaker/ClusterSchedulerConfig.ts:202:1
> 202 │ const waitForConfig = (configId: string, target: "Ready" | "Gone") =>
  203 │   retryWhileNotReady(

0.75 packages/alchemy/src/AWS/SecurityLake/Subscriber.ts:86:5
   81 │ export interface Subscriber extends Resource<
   82 │   "AWS.SecurityLake.Subscriber",
   83 │   SubscriberProps,
   84 │   {
   85 │     /** Unique ID of the subscriber (UUID). */
>  86 │     subscriberId: string;
   87 │     /** ARN of the subscriber. */
   88 │     subscriberArn: string;
   89 │     /** Name of the subscriber. */
   90 │     subscriberName: string;
   91 │     /** Current status (`ACTIVE`, `PENDING`, `READY`, `DEACTIVATED`). */
   92 │     subscriberStatus: string | undefined;
   93 │     /** ARN of the IAM role created for the subscriber to assume. */
   94 │     roleArn: string | undefined;
   95 │     /** ARN of the S3 bucket the subscriber reads from. */
   96 │     s3BucketArn: string | undefined;
   97 │     /** The subscriber's notification endpoint, if one is configured. */
   98 │     subscriberEndpoint: string | undefined;
   99 │     /** ARN of the RAM resource share (Lake Formation access only). */
  100 │     resourceShareArn: string | undefined;
  101 │     /** Name of the RAM resource share (Lake Formation access only). */
  102 │     resourceShareName: string | undefined;
  103 │   },
  104 │   never,
  105 │   Providers
  106 │ > {}

0.75 packages/alchemy/src/AWS/SecurityLake/SubscriberNotification.ts:21:3
  14 │ export interface SubscriberHttpsNotificationConfiguration {
  15 │   /** The HTTPS endpoint Security Lake POSTs/PUTs object notifications to. */
  16 │   endpoint: string;
  17 │   /**
  18 │    * ARN of the EventBridge API-destination role Security Lake assumes to
  19 │    * invoke the endpoint.
  20 │    */
> 21 │   targetRoleArn: string;
  22 │   /**
  23 │    * Name of the API-key header sent with each notification.
  24 │    */
  25 │   authorizationApiKeyName?: string;
  26 │   /**
  27 │    * Value of the API-key header sent with each notification. Held as a
  28 │    * `Redacted` secret; it is never persisted or logged in plaintext.
  29 │    */
  30 │   authorizationApiKeyValue?: Redacted.Redacted<string>;
  31 │   /**
  32 │    * The HTTP method used to deliver notifications.
  33 │    * @default "POST"
  34 │    */
  35 │   httpMethod?: "POST" | "PUT";
  36 │ }

0.75 packages/alchemy/src/AWS/SES/EmailIdentity.ts:81:5
  76 │ export interface EmailIdentity extends Resource<
  77 │   "AWS.SES.EmailIdentity",
  78 │   EmailIdentityProps,
  79 │   {
  80 │     emailIdentity: string;
> 81 │     identityArn: string;
  82 │     identityType: sesv2.IdentityType;
  83 │     verifiedForSendingStatus: boolean;
  84 │     verificationStatus: sesv2.VerificationStatus | undefined;
  85 │     /**
  86 │      * The Easy DKIM CNAME tokens for a domain identity. Publish each token as
  87 │      * `{token}._domainkey.{domain} CNAME {token}.dkim.amazonses.com` to
  88 │      * complete verification. Empty for email-address identities.
  89 │      */
  90 │     dkimTokens: string[];
  91 │     dkimStatus: sesv2.DkimStatus | undefined;
  92 │   },
  93 │   never,
  94 │   Providers
  95 │ > {}

0.75 packages/alchemy/src/AWS/SSMContacts/Plan.ts:13:3
   8 │ export interface PlanProps {
   9 │   /**
  10 │    * The ARN of the contact or escalation plan whose engagement plan this
  11 │    * resource manages. Changing it replaces the plan.
  12 │    */
> 13 │   contactId: string;
  14 │
  15 │   /**
  16 │    * The stages that Incident Manager runs through when engaging the contact:
  17 │    * each stage has a duration and a set of channel/contact targets.
  18 │    */
  19 │   stages?: contacts.Stage[];
  20 │
  21 │   /**
  22 │    * ARNs of the on-call rotations associated with the plan (only valid for
  23 │    * `ONCALL_SCHEDULE` contacts).
  24 │    */
  25 │   rotationIds?: string[];
  26 │ }

0.75 packages/alchemy/src/AWS/Transfer/User.ts:87:3
> 87 │   never,
  88 │   Providers
  89 │ > {}

0.75 packages/alchemy/src/AWS/VpcLattice/AccessLogSubscription.ts:242:17
  238 │           let subscription:
  239 │             | {
  240 │                 id: string;
  241 │                 arn: string;
> 242 │                 resourceId: string;
  243 │                 resourceArn: string;
  244 │                 destinationArn: string;
  245 │               }
  246 │             | undefined = output?.accessLogSubscriptionId
  247 │             ? yield* observe(output.accessLogSubscriptionId)
  248 │             : yield* findByDestinationType(
  249 │                 news.resourceIdentifier,
  250 │                 news.destinationArn,
  251 │               );

0.75 packages/alchemy/src/Cloudflare/Acm/TotalTls.ts:47:3
  45 │ export interface TotalTlsAttributes {
  46 │   /** Zone the setting belongs to — this is the singleton's identity. */
> 47 │   zoneId: string;
  48 │   /** Whether Total TLS is currently enabled on the zone. */
  49 │   enabled: boolean;
  50 │   /**
  51 │    * The Certificate Authority issuing Total TLS certificates, if
  52 │    * Cloudflare reports one.
  53 │    */
  54 │   certificateAuthority: string | undefined;
  55 │   /**
  56 │    * The validity period in days for certificates ordered via Total TLS
  57 │    * (currently always 90), if Cloudflare reports it.
  58 │    */
  59 │   validityPeriod: number | undefined;
  60 │   /**
  61 │    * Whether Total TLS was enabled before Alchemy first touched the zone.
  62 │    * Restored on destroy, so deleting the resource puts the zone back the
  63 │    * way it was found.
  64 │    */
  65 │   initialEnabled: boolean;
  66 │   /**
  67 │    * The Certificate Authority configured before Alchemy first touched the
  68 │    * zone, restored on destroy alongside `initialEnabled`.
  69 │    */
  70 │   initialCertificateAuthority: string | undefined;
  71 │ }

0.75 packages/alchemy/src/Cloudflare/ApiShield/Configuration.ts:201:7
  199 │     reconcile: Effect.fn(function* ({ news, output }) {
  200 │       // Inputs have been resolved to concrete strings by Plan.
> 201 │       const zoneId = news.zoneId as string;
  202 │
  203 │       // 1. Observe — the configuration always exists; read its live value.
  204 │       const observed = yield* apiGateway.getConfiguration({ zoneId });

0.75 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:7:3
   4 │ import type * as HttpClient from "effect/unstable/http/HttpClient";
   5 │
   6 │ export interface ExportD1DatabaseOptions {
>  7 │   accountId: string;
   8 │   databaseId: string;
   9 │   dumpOptions?: {
  10 │     tables?: string[];
  11 │     noSchema?: boolean;
  12 │     noData?: boolean;
  13 │   };
  14 │ }

0.75 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionRule.ts:66:3
  64 │ export interface TcpFlowProtectionRuleAttributes {
  65 │   /** Cloudflare-assigned identifier of the TCP Flow Protection rule. */
> 66 │   ruleId: string;
  67 │   /** The Cloudflare account the rule belongs to. */
  68 │   accountId: string;
  69 │   /** The scope of the rule. */
  70 │   scope: TcpFlowProtectionRuleScope;
  71 │   /** The name of the rule, relative to its scope. */
  72 │   name: string;
  73 │   /** Operating mode of the rule. */
  74 │   mode: TcpFlowProtectionRuleMode;
  75 │   /** The burst sensitivity. */
  76 │   burstSensitivity: TcpFlowProtectionRuleSensitivity;
  77 │   /** The rate sensitivity. */
  78 │   rateSensitivity: TcpFlowProtectionRuleSensitivity;
  79 │   /** ISO8601 creation timestamp. */
  80 │   createdOn: string;
  81 │   /** ISO8601 last-modified timestamp. */
  82 │   modifiedOn: string;
  83 │ }

0.75 packages/alchemy/src/Cloudflare/Dlp/Entry.ts:50:3
  48 │ export type EntryAttributes = {
  49 │   /** API UUID of the entry. */
> 50 │   entryId: string;
  51 │   /** Account that owns the entry. */
  52 │   accountId: string;
  53 │   /** Observed entry name. */
  54 │   name: string;
  55 │   /** Whether the entry participates in scans. */
  56 │   enabled: boolean;
  57 │   /** Observed detection pattern. */
  58 │   pattern: { regex: string; validation: "luhn" | (string & {}) | undefined };
  59 │   /** The profile the entry is attached to, if any. */
  60 │   profileId: string | undefined;
  61 │ };

0.75 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:23:3
  20 │ /** Solver descriptor: publish `_acme-challenge` TXT records in a Cloudflare zone. */
  21 │ export interface CloudflareDnsSolver extends DnsSolverDescriptor {
  22 │   readonly type: "Cloudflare.DNS";
> 23 │   readonly zoneId: string;
  24 │ }

0.75 packages/alchemy/src/Cloudflare/DNS/ZoneTransferAcl.ts:41:3
  39 │ export interface ZoneTransferAclAttributes {
  40 │   /** Identifier of the ACL. */
> 41 │   aclId: string;
  42 │   /** The Cloudflare account the ACL belongs to. */
  43 │   accountId: string;
  44 │   /** Human-readable name of the ACL. */
  45 │   name: string;
  46 │   /** Allowed IP range, as normalized by Cloudflare. */
  47 │   ipRange: string;
  48 │ }

0.75 packages/alchemy/src/Cloudflare/KV/NamespaceHttp.ts:61:3
  60 │ export interface HttpScope {
> 61 │   accountId: string;
  62 │   namespaceId: string;
  63 │ }

0.75 packages/alchemy/src/Cloudflare/PageShield/Policy.ts:281:3
  280 │ const toAttributes = (
> 281 │   zoneId: string,
  282 │   policy: ObservedPolicy,
  283 │ ): PolicyAttributes => ({
  284 │   policyId: policy.id,
  285 │   zoneId,
  286 │   // Distilled widens generated string enums to open unions (`string & {}`).
  287 │   action: policy.action as PolicyAction,
  288 │   description: policy.description,
  289 │   enabled: policy.enabled,
  290 │   expression: policy.expression,
  291 │   value: policy.value,
  292 │ });

0.75 packages/alchemy/src/Cloudflare/Queues/Consumer.ts:48:3
  43 │ export interface ConsumerSettings {
  44 │   /**
  45 │    * The maximum number of messages per batch.
  46 │    * @default 10
  47 │    */
> 48 │   batchSize?: number;
  49 │   /**
  50 │    * The maximum number of concurrent consumer invocations.
  51 │    */
  52 │   maxConcurrency?: number;
  53 │   /**
  54 │    * The maximum number of retries for a message.
  55 │    * @default 3
  56 │    */
  57 │   maxRetries?: number;
  58 │   /**
  59 │    * The maximum time to wait for a batch to fill, in milliseconds.
  60 │    * @default 5000
  61 │    */
  62 │   maxWaitTimeMs?: number;
  63 │   /**
  64 │    * The number of seconds to wait before retrying a message.
  65 │    */
  66 │   retryDelay?: number;
  67 │ }

0.75 packages/alchemy/src/Cloudflare/Rum/Site.ts:161:5
  159 │ export const SiteProvider = () =>
  160 │   Provider.succeed(Site, {
> 161 │     stables: ["siteTag", "siteToken", "accountId", "rulesetId", "created"],

0.75 packages/alchemy/src/Cloudflare/Ssl/UniversalSsl.ts:22:3
  16 │ export type UniversalSslProps = {
  17 │   /**
  18 │    * Zone whose Universal SSL setting is managed. Stable — changing the
  19 │    * zone triggers a replacement (the old zone's setting is restored to
  20 │    * the value it had before Alchemy managed it).
  21 │    */
> 22 │   zoneId: string;
  23 │   /**
  24 │    * Whether Universal SSL certificates are issued for the zone.
  25 │    *
  26 │    * Disabling removes any currently active Universal SSL certificates
  27 │    * for the zone from the edge and prevents future Universal SSL
  28 │    * certificates from being ordered — visitors will see TLS errors
  29 │    * unless the zone has advanced/custom certificates covering its
  30 │    * hostnames.
  31 │    *
  32 │    * Mutable — patched in place.
  33 │    */
  34 │   enabled: boolean;
  35 │ };

0.75 packages/alchemy/src/Cloudflare/TokenValidation/Rule.ts:101:3
   99 │ export interface RuleAttributes {
  100 │   /** Cloudflare-assigned UUID of the rule. */
> 101 │   ruleId: string;
  102 │   /** Zone the rule belongs to. */
  103 │   zoneId: string;
  104 │   /** Human-readable name of the rule. */
  105 │   title: string;
  106 │   /** Description of the rule. */
  107 │   description: string;
  108 │   /** Whether the rule is enabled. */
  109 │   enabled: boolean;
  110 │   /** Action applied to matching requests that fail the expression. */
  111 │   action: RuleAction;
  112 │   /** The rule's expression. */
  113 │   expression: string;
  114 │   /** Which operations the rule covers. */
  115 │   selector: {
  116 │     include?: { host?: string[] }[];
  117 │     exclude?: { operationIds?: string[] }[];
  118 │   };
  119 │   /** ISO8601 creation timestamp, when reported by the API. */
  120 │   createdAt: string | undefined;
  121 │   /** ISO8601 last-modified timestamp, when reported by the API. */
  122 │   lastUpdated: string | undefined;
  123 │ }

0.75 packages/alchemy/src/Cloudflare/Zone/CustomNameservers.ts:21:3
  15 │ export type CustomNameserversProps = {
  16 │   /**
  17 │    * Zone whose account-level custom nameserver usage is managed. Stable —
  18 │    * changing the zone triggers a replacement (the old zone's configuration
  19 │    * is restored to the value it had before Alchemy managed it).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Whether the zone uses account-level custom nameservers (ACNS) instead
  24 │    * of the Cloudflare-assigned nameservers.
  25 │    *
  26 │    * Enabling requires an account-level custom nameserver set to already be
  27 │    * configured (Business/Enterprise) — otherwise Cloudflare rejects the
  28 │    * update with the typed `CustomNameserverSetNotFound` error.
  29 │    *
  30 │    * Mutable — applied in place.
  31 │    */
  32 │   enabled: boolean;
  33 │   /**
  34 │    * The number of the account custom nameserver set to assign to the zone.
  35 │    * Only meaningful when `enabled` is `true`.
  36 │    *
  37 │    * Mutable — applied in place.
  38 │    *
  39 │    * @default 1 (Cloudflare's default nameserver set)
  40 │    */
  41 │   nsSet?: number;
  42 │ };

0.75 packages/alchemy/src/Cloudflare/Zone/Hold.ts:22:3
  16 │ export type HoldProps = {
  17 │   /**
  18 │    * Zone to place the hold on. Stable — changing the zone triggers a
  19 │    * replacement (the hold is removed from the old zone and placed on the
  20 │    * new one).
  21 │    */
> 22 │   zoneId: string;
  23 │   /**
  24 │    * Extend the hold to block any subdomain of the zone, as well as
  25 │    * SSL4SaaS Custom Hostnames. For example, a hold on `example.com` with
  26 │    * `includeSubdomains: true` also blocks `staging.example.com` from
  27 │    * being added to another account.
  28 │    *
  29 │    * Mutable — patched in place.
  30 │    * @default false
  31 │    */
  32 │   includeSubdomains?: boolean;
  33 │ };

0.75 packages/alchemy/src/Fly/Website/AssetDeployment.ts:108:5
  106 │ const withTigris = <A, E>(
  107 │   scope: {
> 108 │     accessKeyId: string;
  109 │     secretAccessKey: string;
  110 │     endpoint: string;
  111 │     region: RegionName;
  112 │   },
  113 │   operation: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  114 │ ) =>
  115 │   operation.pipe(
  116 │     Effect.provide(
  117 │       Layer.mergeAll(
  118 │         fromCredentials(
  119 │           {
  120 │             accessKeyId: scope.accessKeyId,
  121 │             secretAccessKey: scope.secretAccessKey,
  122 │           },
  123 │           scope.region,
  124 │         ),
  125 │         AwsEndpoint.of(scope.endpoint),
  126 │         FetchHttpClient.layer,
  127 │       ),
  128 │     ),
  129 │   );

0.75 packages/alchemy/src/Git/Jobs/Purge.ts:51:3
  48 │ /** Dependencies of {@link runPurgeJob}. */
  49 │ export interface PurgeJobOptions {
  50 │   /** The repo's ULID (R2 key prefix). */
> 51 │   readonly repoId: string;
  52 │   /** The swappable bulk-byte store. */
  53 │   readonly blobs: BlobStoreShape;
  54 │   /** Reads the current fork count from the Registry. */
  55 │   readonly forkCount: Effect.Effect<number, StoreError>;
  56 │   /** Drops the DO's entire SQLite/KV state (`storage.deleteAll`). */
  57 │   readonly deleteAllStorage: Effect.Effect<void, StoreError>;
  58 │   /** Removes the Registry row (FIRST step — frees the name; idempotent). */
  59 │   readonly removeRegistryRow: Effect.Effect<void, StoreError>;
  60 │ }

0.75 packages/alchemy/src/Git/Store/Keys.ts:28:1
> 28 │ export const objectKey = (repoId: string, oid: string): string =>
  29 │   `${repoId}/objects/${oid}`;

0.75 packages/alchemy/src/Hetzner/Image.ts:221:3
  220 │ class ImageNotResolved extends Data.TaggedError("Hetzner.ImageNotResolved")<{
> 221 │   serverId: number;
  222 │   description: string;
  223 │ }> {}

0.75 packages/alchemy/src/Prisma/Database.ts:342:1
> 342 │ const findDatabaseByName = (projectId: string, name: string) =>
  343 │   listProjectDatabases(projectId).pipe(
  344 │     Effect.flatMap((databases) => {
  345 │       const matches = databases.filter((database) => database.name === name);
  346 │       return matches.length > 1
  347 │         ? Effect.fail(
  348 │             new Error(
  349 │               `Prisma project '${projectId}' has multiple databases named '${name}'; refusing to select one arbitrarily.`,
  350 │             ),
  351 │           )
  352 │         : Effect.succeed(matches[0]);
  353 │     }),
  354 │   );

0.75 packages/alchemy/src/Prisma/Internal/CleanupFailure.ts:9:3
   7 │ export const aggregateCleanupFailure = (
   8 │   resource: "App" | "deployment",
>  9 │   resourceId: string,
  10 │   route: string,
  11 │   originalError: unknown,
  12 │   cleanupError: unknown,
  13 │ ) =>
  14 │   new AggregateError(
  15 │     [originalError, cleanupError],
  16 │     `Failed to clean up Prisma ${resource} '${resourceId}' after reconcile failed. The resource may be orphaned. Manual cleanup: DELETE ${route}.`,
  17 │   );

0.75 packages/alchemy/src/Prisma/PrismaLogs.ts:179:11
  178 │         const connect = (
> 179 │           cursor: string | undefined,

0.75 packages/alchemy/src/Rename.ts:14:1
> 14 │ export type FormerId = string | { fqn: string };

0.75 packages/alchemy/src/Stripe/Price.ts:261:1
  259 │ const isMissingPrice = isMissingStripeResource;
  260 │
> 261 │ const getById = (price: string) =>
  262 │   GetPrice({ price }).pipe(
  263 │     Effect.catchIf(isMissingPrice, () => Effect.succeed(undefined)),
  264 │   );

0.75 packages/alchemy/src/Stripe/TaxRate.ts:107:5
  104 │   TaxRateProps,
  105 │   {
  106 │     /** Stripe tax rate id (`txr_…`). */
> 107 │     id: string;
  108 │     /** Display name shown to customers. */
  109 │     displayName: string;
  110 │     /** Tax rate percent out of 100. */
  111 │     percentage: number;
  112 │     /** Whether this tax is inclusive of the listed price. */
  113 │     inclusive: boolean;
  114 │     /** Whether the tax rate can be applied to new objects. */
  115 │     active: boolean;
  116 │     /** Internal description, if set. */
  117 │     description: string | undefined;
  118 │     /** Two-letter ISO country code, if set. */
  119 │     country: string | undefined;
  120 │     /** Jurisdiction label, if set. */
  121 │     jurisdiction: string | undefined;
  122 │     /** ISO 3166-2 subdivision code, if set. */
  123 │     state: string | undefined;
  124 │     /** High-level tax type, if set. */
  125 │     taxType: TaxRateTaxType | undefined;
  126 │     /** User-defined metadata (Alchemy ownership keys stripped). */
  127 │     metadata: Record<string, string>;
  128 │     /** Unix timestamp when the tax rate was created. */
  129 │     created: number;
  130 │     /** Whether the tax rate exists in live mode. */
  131 │     livemode: boolean;
  132 │   },

0.75 packages/alchemy/src/Tags.ts:43:1
> 43 │ export const createInternalTags = Effect.fn(function* (id: string) {
  44 │   const stack = yield* Stack;
  45 │   const stage = yield* Stage;
  46 │   return {
  47 │     "alchemy::stack": stack.name,
  48 │     "alchemy::stage": stage,
  49 │     "alchemy::id": id,
  50 │   };
  51 │ });

0.75 packages/alchemy/test/AWS/Chatbot/handler.ts:13:1
  11 │ // Well-formed-but-nonexistent identifiers — drive the typed error paths of
  12 │ // the identity offboarding bindings without touching any real workspace.
> 13 │ const NONEXISTENT_SLACK_TEAM = "T0000000000";
  14 │ const NONEXISTENT_SLACK_USER = "U0000000000";
  15 │ const NONEXISTENT_TEAMS_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

0.75 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:14:1
  11 │ // Well-formed-but-nonexistent identifiers — every route drives its binding
  12 │ // against these so the fixture exercises IAM grants + typed error decoding
  13 │ // at zero cost (no cluster, no HSM, no backup is ever created).
> 14 │ const NONEXISTENT_CLUSTER_ID = "cluster-aaaaaaaaaaa";
  15 │ const NONEXISTENT_BACKUP_ID = "backup-aaaaaaaaaaa";

0.75 packages/alchemy/test/AWS/EC2/fixtures/dev-instance.ts:56:7
  49 │     return {
  50 │       main: import.meta.filename,
  51 │       imageId: AWS.EC2.amazonLinux2023(),
  52 │       instanceType: "t3.micro",
  53 │       subnetId: network.publicSubnetIds[0],
  54 │       securityGroupIds: [securityGroup.groupId],
  55 │       associatePublicIpAddress: true,
> 56 │       port: 3000,
  57 │     };
  58 │   }),

0.75 packages/alchemy/test/AWS/Organizations/handler.ts:316:11
  315 │         if (request.method === "GET" && pathname === "/targets-for-policy") {
> 316 │           // Discover a policy id from the SCP list (p-FullAWSAccess exists in
  317 │           // every organization with SCPs available), then read its targets —
  318 │           // proves ListTargetsForPolicy's grant end-to-end.
  319 │           const result = yield* Effect.gen(function* () {
  320 │             const r = yield* listPolicies({
  321 │               Filter: "SERVICE_CONTROL_POLICY",
  322 │             });
  323 │             const policyId = r.Policies?.[0]?.Id;
  324 │             if (policyId === undefined) {
  325 │               return { ok: false as const, tag: "NoPolicy" };
  326 │             }
  327 │             const t = yield* listTargetsForPolicy({ PolicyId: policyId });
  328 │             return { ok: true as const, count: t.Targets?.length ?? 0 };
  329 │           }).pipe(
  330 │             Effect.catchTag(
  331 │               [
  332 │                 "AccessDeniedException",
  333 │                 "AWSOrganizationsNotInUseException",
  334 │                 "PolicyNotFoundException",
  335 │               ],
  336 │               (e) => Effect.succeed({ ok: false as const, tag: e._tag }),
  337 │             ),
  338 │           );
  339 │           return yield* HttpServerResponse.json(result);
  340 │         }

0.75 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:15:1
  12 │ // A well-formed-but-nonexistent subject id — drives the typed error path for
  13 │ // GetSubject (proving the IAM grant + typed union; an IAM gap would surface
  14 │ // AccessDeniedException instead).
> 15 │ const NONEXISTENT_SUBJECT_ID = "00000000-0000-0000-0000-000000000000";

0.75 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:22:7
> 22 │       const conn = yield* container.getTcpPort(3000);

0.75 packages/alchemy/test/Cloudflare/Container/fixtures/inferred/worker.ts:11:3
  10 │ export class Probe extends Container {
> 11 │   defaultPort = 8080;
  12 │ }

0.75 packages/alchemy/test/Cloudflare/Container/fixtures/isolated/object.ts:19:13
   7 │ export class IsolatedObject extends Cloudflare.DurableObject<IsolatedObject>()(
   8 │   "IsolatedProjectObject",
   9 │   Effect.gen(function* () {
  10 │     const container = yield* IsolatedContainer;
  11 │
  12 │     return Effect.gen(function* () {
  13 │       return {
  14 │         // RPC into the container (forces start + proves it's up).
  15 │         ping: () => container.ping(),
  16 │         // HTTP over the container's TCP port.
  17 │         hello: () =>
  18 │           Effect.gen(function* () {
> 19 │             const { fetch } = yield* container.getTcpPort(3000);
  20 │             const response = yield* fetch(
  21 │               HttpClientRequest.get("http://container/"),
  22 │             );
  23 │             return yield* response.text;
  24 │           }).pipe(Effect.orDie),
  25 │       };
  26 │     });
  27 │   }).pipe(
  28 │     Effect.provide(
  29 │       Cloudflare.Containers.layer(IsolatedContainer, {
  30 │         enableInternet: true,
  31 │       }),
  32 │     ),
  33 │   ),
  34 │ ) {}

0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/browser.ts:17:3
  14 │ export const clientLayer = RpcWebSocketClient.layer(
  15 │   BrowserClient,
  16 │   BrowserRpcs,
> 17 │   "wss://example.com/rpc",
  18 │ ).pipe(Layer.provide(Socket.layerWebSocketConstructorGlobal));

0.75 packages/alchemy/test/Fly/fixtures/bluegreen-runtime-secrets/writer.ts:25:7
  21 │     {
  22 │       app: Site,
  23 │       main: import.meta.url,
  24 │       region: "iad",
> 25 │       port: 3000,
  26 │       guest: { cpuKind: "shared", cpus: 1, memoryMb: 256 },
  27 │       env: { TRIGGER_READY: triggerDigest ?? "" },
  28 │       services: [
  29 │         {
  30 │           protocol: "tcp",
  31 │           internalPort: 3000,
  32 │           autostop: "off",
  33 │           ports: [{ port: 443, handlers: ["tls", "http"] }],
  34 │           checks: [
  35 │             {
  36 │               type: "http",
  37 │               port: 3000,
  38 │               path: "/health",
  39 │               interval: "2s",
  40 │               timeout: "1s",
  41 │             },
  42 │           ],
  43 │         },
  44 │       ],
  45 │     },

0.75 packages/alchemy/test/Fly/fixtures/unhealthy-api.ts:22:9
  10 │   {
  11 │     app: UnhealthySite,
  12 │     main: import.meta.url,
  13 │     region: "iad",
  14 │     port: API_PORT,
  15 │     count: 2,
  16 │     services: [
  17 │       {
  18 │         protocol: "tcp",
  19 │         internalPort: API_PORT,
  20 │         autostart: true,
  21 │         autostop: "off",
> 22 │         ports: [{ port: 80, handlers: ["http"] }],
  23 │         checks: [
  24 │           {
  25 │             type: "http",
  26 │             port: API_PORT,
  27 │             path: "/health",
  28 │             interval: "5s",
  29 │             timeout: "2s",
  30 │             gracePeriod: "1s",
  31 │           },
  32 │         ],
  33 │       },
  34 │     ],
  35 │   },

0.75 packages/alchemy/test/Prisma/fixtures/readwrite-compute.ts:22:7
  16 │   Effect.gen(function* () {
  17 │     const project = yield* TestProject;
  18 │     return {
  19 │       project,
  20 │       appName: "alchemy-bucket-binding-readwrite",
  21 │       main: import.meta.filename,
> 22 │       port: 8080,
  23 │       timeoutSeconds: 240,
  24 │       destroyOldDeployment: true,
  25 │     };
  26 │   }),

0.75 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitBinding.worker.ts:50:5
> 50 │     validate(typeof key === "string", `invalid key: ${key}`);
  51 │     validate(typeof limit === "number", `limit must be a number: ${limit}`);
  52 │     validate(typeof period === "number", `period must be a number: ${period}`);

0.75 packages/cloudflare-runtime/src/core/bindings/workflows/wrapped-binding.worker.ts:95:5
  93 │ class InstanceImpl implements WorkflowInstance {
  94 │   constructor(
> 95 │     public id: string,
  96 │     private binding: WorkflowBinding,
  97 │   ) {}

0.75 packages/cloudflare-runtime/src/core/workerd/Config.ts:104:3
  103 │ export type Worker_Module = {
> 104 │   name: string;
  105 │ } & (
  106 │   | { esModule?: string }
  107 │   | { commonJsModule?: string }
  108 │   | { text?: string }
  109 │   | { data?: Uint8Array }
  110 │   | { wasm?: Uint8Array }
  111 │   | { json?: string }
  112 │   | { pythonModule?: string }
  113 │ );

0.74 packages/alchemy/src/AWS/AppRunner/VpcConnector.ts:181:11
  166 │       const toAttrs = Effect.fn(function* (connector: apprunner.VpcConnector) {
  167 │         if (
  168 │           !connector.VpcConnectorName ||
  169 │           !connector.VpcConnectorArn ||
  170 │           connector.VpcConnectorRevision === undefined
  171 │         ) {
  172 │           return yield* Effect.fail(
  173 │             new Error(
  174 │               "App Runner VPC connector is missing its name, ARN, or revision",
  175 │             ),
  176 │           );
  177 │         }
  178 │         return {
  179 │           vpcConnectorName: connector.VpcConnectorName,
  180 │           vpcConnectorArn: connector.VpcConnectorArn,
> 181 │           vpcConnectorRevision: connector.VpcConnectorRevision,
  182 │           subnets: [...(connector.Subnets ?? [])],
  183 │           securityGroups: [...(connector.SecurityGroups ?? [])],
  184 │           status: connector.Status ?? "ACTIVE",
  185 │         };
  186 │       });

0.74 packages/alchemy/src/AWS/AppSync/GraphqlApi.ts:501:9
  500 │       const syncCache = Effect.fn(function* (
> 501 │         apiId: string,
  502 │         desired: ApiCacheConfig | undefined,
  503 │       ) {

0.74 packages/alchemy/src/AWS/AuditManager/Assessment.ts:147:3
> 147 │   never,
  148 │   Providers
  149 │ > {}

0.74 packages/alchemy/src/AWS/CloudMap/internal.ts:258:3
  257 │ export const fetchObservedTags = Effect.fn("AWS.CloudMap.fetchObservedTags")(
> 258 │   function* (resourceArn: string) {
  259 │     const tags = yield* sd
  260 │       .listTagsForResource({ ResourceARN: resourceArn })
  261 │       .pipe(
  262 │         Effect.map((response) => response.Tags ?? []),
  263 │         Effect.catch(() => Effect.succeed([] as sd.Tag[])),
  264 │       );
  265 │     return Object.fromEntries(tags.map((tag) => [tag.Key, tag.Value]));
  266 │   },
  267 │ );

0.74 packages/alchemy/src/AWS/Deadline/Farm.ts:141:7
  121 │ const readFarmById = Effect.fn(function* (
  122 │   farmId: string,
  123 │   arnOf: (path: string) => string,
  124 │ ) {
  125 │   const described = yield* deadline
  126 │     .getFarm({ farmId })
  127 │     .pipe(
  128 │       Effect.catchTag("ResourceNotFoundException", () =>
  129 │         Effect.succeed(undefined),
  130 │       ),
  131 │     );
  132 │   if (!described) return undefined;
  133 │   const farmArn = arnOf(`farm/${described.farmId}`);
  134 │   const state: FarmState = {
  135 │     described,
  136 │     attrs: {
  137 │       farmId: described.farmId,
  138 │       farmArn,
  139 │       displayName: described.displayName,
  140 │       kmsKeyArn: described.kmsKeyArn,
> 141 │       costScaleFactor: described.costScaleFactor,
  142 │       tags: yield* fetchDeadlineTags(farmArn),
  143 │     },
  144 │   };
  145 │   return state;
  146 │ });

0.74 packages/alchemy/src/AWS/ECS/CapacityProvider.ts:340:19
  334 │             return all
  335 │               .filter(
  336 │                 (
  337 │                   p,
  338 │                 ): p is ecs.CapacityProvider & {
  339 │                   name: string;
> 340 │                   capacityProviderArn: string;
  341 │                 } =>
  342 │                   p.name != null &&
  343 │                   p.capacityProviderArn != null &&
  344 │                   // FARGATE / FARGATE_SPOT are AWS-managed reserved providers
  345 │                   // that this resource does not create or own.
  346 │                   p.name !== "FARGATE" &&
  347 │                   p.name !== "FARGATE_SPOT",
  348 │               )
  349 │               .map((p) => ({
  350 │                 capacityProviderArn:
  351 │                   p.capacityProviderArn as CapacityProviderArn,
  352 │                 name: p.name,
  353 │                 status: (p.status ?? "ACTIVE") as ecs.CapacityProviderStatus,
  354 │                 updateStatus: p.updateStatus,
  355 │                 autoScalingGroupArn:
  356 │                   p.autoScalingGroupProvider?.autoScalingGroupArn ?? "",
  357 │                 managedScaling: p.autoScalingGroupProvider?.managedScaling,
  358 │                 managedTerminationProtection:
  359 │                   p.autoScalingGroupProvider?.managedTerminationProtection,
  360 │                 managedDraining: p.autoScalingGroupProvider?.managedDraining,
  361 │                 tags: fromEcsTags(p.tags),
  362 │               }));

0.74 packages/alchemy/src/AWS/ELBv2/ListenerCertificate.ts:16:3
  12 │ export interface ListenerCertificateProps {
  13 │   /** The HTTPS/TLS listener to attach the certificate to. Changing it replaces the attachment. */
  14 │   listenerArn: Input<ListenerArn> | Listener;
  15 │   /** The ARN of the ACM (or IAM) certificate to add to the listener's SNI certificate list. Changing it replaces the attachment. */
> 16 │   certificateArn: string;
  17 │ }

0.74 packages/alchemy/src/AWS/IdentityCenter/PermissionSet.ts:21:3
  12 │ export interface PermissionSetProps {
  13 │   /**
  14 │    * Explicit IAM Identity Center instance ARN.
  15 │    * If omitted, Alchemy adopts the only visible instance.
  16 │    */
  17 │   instanceArn?: string;
  18 │   /**
  19 │    * Permission set name.
  20 │    */
> 21 │   name: string;
  22 │   /**
  23 │    * Optional human-readable description.
  24 │    */
  25 │   description?: string;
  26 │   /**
  27 │    * Optional session duration, e.g. `"8 hours"` or `Duration.hours(8)`.
  28 │    * Sent to Identity Center as an ISO-8601 string such as `PT8H` (a bare
  29 │    * number is milliseconds).
  30 │    */
  31 │   sessionDuration?: Duration.Input;
  32 │   /**
  33 │    * Optional relay state passed to supported applications.
  34 │    */
  35 │   relayState?: string;
  36 │ }

0.74 packages/alchemy/src/AWS/KMS/Alias.ts:37:3
  29 │ export interface Alias extends Resource<
  30 │   "AWS.KMS.Alias",
  31 │   AliasProps,
  32 │   {
  33 │     aliasName: AliasName;
  34 │     aliasArn: AliasArn;
  35 │     targetKeyId: KeyId;
  36 │   },
> 37 │   never,
  38 │   Providers
  39 │ > {}

0.74 packages/alchemy/src/AWS/Local/FlociServices.ts:27:1
  24 │ export const FLOCI_ACCOUNT_ID = LOCAL_ACCOUNT_ID;
  25 │
  26 │ /** Region every floci-emulated resource lives in. */
> 27 │ export const FLOCI_REGION = "us-east-1";

0.74 packages/alchemy/src/AWS/Macie2/FindingEventSource.ts:22:3
  20 │ export interface FindingEventDetail {
  21 │   /** The finding id. */
> 22 │   id?: string;
  23 │   /** The finding type, e.g. `SensitiveData:S3Object/Personal`. */
  24 │   type?: string;
  25 │   /** Whether the finding is a sensitive-data or policy finding. */
  26 │   category?: FindingCategory;
  27 │   /** The finding severity (score 1-3 plus a qualitative description). */
  28 │   severity?: { score?: number; description?: FindingSeverityDescription };
  29 │   /** The account the finding was generated in. */
  30 │   accountId?: string;
  31 │   /** The region the finding was generated in. */
  32 │   region?: string;
  33 │   /** The finding title. */
  34 │   title?: string;
  35 │   /** The finding description. */
  36 │   description?: string;
  37 │   /** The affected resources document (S3 bucket + object details). */
  38 │   resourcesAffected?: Record<string, unknown>;
  39 │   /** For classification findings, the sensitive-data detection details. */
  40 │   classificationDetails?: Record<string, unknown>;
  41 │   /** Additional finding fields (the schema grows over time). */
  42 │   [key: string]: unknown;
  43 │ }

0.74 packages/alchemy/src/AWS/MailManager/AddressList.ts:41:5
  36 │ export interface AddressList extends Resource<
  37 │   "AWS.MailManager.AddressList",
  38 │   AddressListProps,
  39 │   {
  40 │     /** Server-assigned ID of the address list. */
> 41 │     addressListId: string;
  42 │     /** ARN of the address list. */
  43 │     addressListArn: string;
  44 │     /** Name of the address list. */
  45 │     addressListName: string;
  46 │   },
  47 │   never,
  48 │   Providers
  49 │ > {}

0.74 packages/alchemy/src/AWS/MailManager/internal.ts:11:1
> 11 │ export const readMailManagerTags = (arn: string) =>
  12 │   mm.listTagsForResource({ ResourceArn: arn }).pipe(
  13 │     Effect.map((r) => tagRecord(r.Tags ?? [])),
  14 │     Effect.catch(() => Effect.succeed<Record<string, string>>({})),
  15 │   );

0.74 packages/alchemy/src/AWS/MediaConvert/Job.ts:55:5
  51 │ export interface Job extends Resource<
  52 │   "AWS.MediaConvert.Job",
  53 │   JobProps,
  54 │   {
> 55 │     jobId: string;
  56 │     jobArn: string;
  57 │     status: string | undefined;
  58 │     queue: string | undefined;
  59 │   },
  60 │   never,
  61 │   Providers
  62 │ > {}

0.74 packages/alchemy/src/AWS/MediaConvert/JobEventSource.ts:18:3
  16 │ export interface MediaConvertJobEventDetail {
  17 │   /** The job's id (`arn:…:jobs/{id}`). */
> 18 │   jobId?: string;
  19 │   /** The event kind within the state change stream: `SUBMITTED`, `PROGRESSING`, `INPUT_INFORMATION`, `STATUS_UPDATE`, `NEW_WARNING`, `QUEUE_HOP`, `COMPLETE`, `ERROR`, or `CANCELED`. */
  20 │   status?: string;
  21 │   /** Timestamp (epoch millis) the event was emitted. */
  22 │   timestamp?: number;
  23 │   /** The account the job ran in. */
  24 │   accountId?: string;
  25 │   /** ARN of the queue the job ran in. */
  26 │   queue?: string;
  27 │   /** The `userMetadata` key/value pairs supplied at job submission. */
  28 │   userMetadata?: Record<string, string>;
  29 │   /** Per-output-group details (output file paths, durations) on `COMPLETE`. */
  30 │   outputGroupDetails?: unknown[];
  31 │   /** Integer error code on `ERROR` events. */
  32 │   errorCode?: number;
  33 │   /** Human-readable error message on `ERROR` events. */
  34 │   errorMessage?: string;
  35 │   /** Additional event fields (the schema grows over time). */
  36 │   [key: string]: unknown;
  37 │ }

0.74 packages/alchemy/src/AWS/MQ/Broker.ts:204:3
  187 │ export interface Broker extends Resource<
  188 │   "AWS.MQ.Broker",
  189 │   BrokerProps,
  190 │   {
  191 │     /** Server-assigned unique id of the broker (e.g. `b-1234...`). */
  192 │     brokerId: string;
  193 │     /** ARN of the broker. */
  194 │     brokerArn: string;
  195 │     /** Name of the broker. */
  196 │     brokerName: string;
  197 │     /** Current lifecycle state (e.g. `CREATION_IN_PROGRESS`, `RUNNING`). */
  198 │     brokerState: string;
  199 │     /** Wire-level connection endpoints (protocol URIs) for the broker. */
  200 │     endpoints: string[] | undefined;
  201 │     /** ActiveMQ Web Console URL (undefined for RabbitMQ). */
  202 │     consoleUrl: string | undefined;
  203 │   },
> 204 │   never,
  205 │   Providers
  206 │ > {}

0.74 packages/alchemy/src/AWS/MWAA/Environment.ts:221:3
> 221 │   never,
  222 │   Providers
  223 │ > {}

0.74 packages/alchemy/src/AWS/S3Files/AccessPoint.ts:341:13
  338 │           // 3. SYNC TAGS — diff against observed cloud tags so adoption and
  339 │           //    drift converge (create-time tags only apply on first create).
  340 │           yield* syncTags(
> 341 │             accessPointId,
  342 │             toTagRecord(settled.tags),
  343 │             desiredTags,
  344 │           );

0.74 packages/alchemy/src/AWS/SageMaker/ComputeQuota.ts:115:3
> 115 │   never,
  116 │   Providers
  117 │ > {}

0.74 packages/alchemy/src/AWS/SES/TenantResourceAssociation.ts:15:3
   9 │ export interface TenantResourceAssociationProps {
  10 │   /**
  11 │    * Name of the tenant to associate the resource with. Typically the
  12 │    * `tenantName` output of a `SES.Tenant`. Changing it replaces the
  13 │    * association.
  14 │    */
> 15 │   tenantName: string;
  16 │   /**
  17 │    * ARN of the resource to associate — an email identity, configuration set,
  18 │    * or email template. Changing it replaces the association.
  19 │    */
  20 │   resourceArn: string;
  21 │ }

0.74 packages/alchemy/src/AWS/Timestream/Database.ts:21:3
  18 │ import { withWriteEndpoint } from "./internal.ts";
  19 │
  20 │ export type DatabaseArn =
> 21 │   `arn:aws:timestream:${RegionID}:${AccountID}:database/${string}`;

0.74 packages/alchemy/src/Cloudflare/Access/Certificate.ts:301:3
  300 │ type ObservedCertificate = {
> 301 │   id?: string | null;
  302 │   name?: string | null;
  303 │   fingerprint?: string | null;
  304 │   associatedHostnames?: string[] | null;
  305 │   expiresOn?: string | null;
  306 │ };

0.74 packages/alchemy/src/Cloudflare/AI/ProviderKey.ts:15:3
> 15 │   gatewayId: string;

0.74 packages/alchemy/src/Cloudflare/Gateway/Logging.ts:62:3
  60 │ export type LoggingAttributes = LoggingSnapshot & {
  61 │   /** Account that owns the Gateway logging singleton. */
> 62 │   accountId: string;
  63 │   /**
  64 │    * The logging settings the account had before Alchemy first wrote
  65 │    * them. Restored (via PUT) on destroy, so deleting the resource puts
  66 │    * the account back the way it was found.
  67 │    */
  68 │   initialSettings: LoggingSnapshot;
  69 │ };

0.74 packages/alchemy/src/Cloudflare/LocalRuntime.ts:119:1
  116 │ export const localRuntimeServices = () =>
  117 │   (_localRuntimeServices ??= makeLocalRuntimeServices());
  118 │
> 119 │ export const isLocalId = (id: string | undefined): id is string =>
  120 │   typeof id === "string" && id.startsWith(LOCAL_ID_PREFIX);
  121 │ export const isLiveId = (id: string | undefined): id is string =>
  122 │   typeof id === "string" && !id.startsWith(LOCAL_ID_PREFIX);

0.74 packages/alchemy/src/Cloudflare/Pages/Project.ts:181:3
  177 │ export type Project = Resource<
  178 │   TypeId,
  179 │   ProjectProps,
  180 │   ProjectAttributes,
> 181 │   never,
  182 │   Providers
  183 │ >;

0.74 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:202:3
  186 │ export interface SinkAttributes {
  187 │   /** Cloudflare-assigned sink identifier. */
  188 │   sinkId: string;
  189 │   /** Account that owns the sink. */
  190 │   accountId: string;
  191 │   /** Sink name (unique per account). */
  192 │   name: string;
  193 │   /** Sink type. */
  194 │   type: "r2" | "r2_data_catalog";
  195 │   /** Destination R2 bucket name. */
  196 │   bucket: string;
  197 │   /** Key prefix output objects are written under (r2 sinks). */
  198 │   path: string | undefined;
  199 │   /** When the sink was created. */
  200 │   createdAt: string;
  201 │   /** When the sink was last modified. */
> 202 │   modifiedAt: string;
  203 │ }

0.74 packages/alchemy/src/Cloudflare/RegionalHostname/RegionalHostname.ts:21:3
  16 │ export interface Props {
  17 │   /**
  18 │    * The zone the regional hostname belongs to. Changing it forces a
  19 │    * replacement.
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * DNS hostname to be regionalized. Must be a subdomain of the zone;
  24 │    * wildcards are supported for one level (e.g. `*.example.com`). The
  25 │    * hostname is the API path identifier — changing it forces a replacement.
  26 │    */
  27 │   hostname: string;
  28 │   /**
  29 │    * Identifying key for the region (e.g. `"eu"`, `"us"` — discoverable via
  30 │    * `addressing.listRegionalHostnameRegions`). Mutable — patched in place.
  31 │    */
  32 │   regionKey: string;
  33 │   /**
  34 │    * Which routing method to use for the regional hostname. Create-only —
  35 │    * the PATCH endpoint only accepts `regionKey`, so changing it forces a
  36 │    * replacement.
  37 │    */
  38 │   routing?: string;
  39 │ }

0.74 packages/alchemy/src/Cloudflare/SchemaValidation/OperationSetting.ts:29:3
  23 │ export interface OperationSettingProps {
  24 │   /**
  25 │    * Zone the operation belongs to.
  26 │    *
  27 │    * Immutable — changing the zone triggers a replacement.
  28 │    */
> 29 │   zoneId: string;
  30 │   /**
  31 │    * UUID of the API Shield operation the override applies to (cross-resource
  32 │    * reference to `Cloudflare.ApiShield.Operation`).
  33 │    *
  34 │    * Immutable — the operation is the override's identity, so changing it
  35 │    * triggers a replacement.
  36 │    */
  37 │   operationId: string;
  38 │   /**
  39 │    * The mitigation action applied to this operation, superseding the zone
  40 │    * default just for this operation: `log` records non-conforming requests,
  41 │    * `block` denies them, `none` disables validation for the operation.
  42 │    * Mutable in place (the PUT is a true upsert). `log` may be plan-gated
  43 │    * (API Shield entitlement).
  44 │    */
  45 │   mitigationAction: OperationMitigationAction;
  46 │ }

0.74 packages/alchemy/src/Cloudflare/SchemaValidation/Settings.ts:44:3
  42 │ export interface SettingsAttributes {
  43 │   /** Zone the settings belong to. */
> 44 │   zoneId: string;
  45 │   /** The default mitigation action for non-conforming requests. */
  46 │   validationDefaultMitigationAction: MitigationAction;
  47 │   /** The zone-wide override (`"none"` = validation disabled), if set. */
  48 │   validationOverrideMitigationAction: "none" | (string & {}) | null;
  49 │   /**
  50 │    * The default action the zone had before Alchemy first managed these
  51 │    * settings. Restored on destroy.
  52 │    */
  53 │   initialDefaultMitigationAction: MitigationAction;
  54 │   /**
  55 │    * The override the zone had before Alchemy first managed these settings.
  56 │    * Restored on destroy.
  57 │    */
  58 │   initialOverrideMitigationAction: "none" | (string & {}) | null;
  59 │ }

0.74 packages/alchemy/src/Docker/Context.ts:35:5
  30 │ export interface Context extends Resource<
  31 │   "Docker.Context",
  32 │   ContextProps,
  33 │   {
  34 │     /** Docker context name (contexts are identified by name). */
> 35 │     id: string;
  36 │     /** Docker context name. */
  37 │     name: string;
  38 │     /** Human-readable description. */
  39 │     description: string;
  40 │     /** Docker endpoint the context targets. */
  41 │     docker?: string;
  42 │   },
  43 │   never,
  44 │   Providers
  45 │ > {}

0.74 packages/alchemy/src/Docker/Image.ts:81:3
  64 │ export interface Image extends Resource<
  65 │   "Docker.Image",
  66 │   ImageProps,
  67 │   {
  68 │     /** Image repository/name without tag. */
  69 │     name: string;
  70 │     /** Final image reference. Includes registry host when pushed there. */
  71 │     imageRef: string;
  72 │     /** Local image id after build/tag. */
  73 │     imageId: string;
  74 │     /** Registry digest after push when available. */
  75 │     repoDigest?: string;
  76 │     /** Tag used for the local image. */
  77 │     tag: string;
  78 │     /** Build timestamp in milliseconds since epoch. */
  79 │     builtAt: number;
  80 │   },
> 81 │   never,
  82 │   Providers
  83 │ > {}

0.74 packages/alchemy/src/Fly/App.ts:81:5
  60 │ export type App = Resource<
  61 │   "Fly.App",
  62 │   AppProps,
  63 │   {
  64 │     /** Fly App id. */
  65 │     appId: string;
  66 │     /** Physical Fly App name. */
  67 │     appName: string;
  68 │     /** Fly internal numeric id, if the API returned one. */
  69 │     internalNumericId: number | undefined;
  70 │     /** Isolated network name, if set. */
  71 │     network: string | undefined;
  72 │     /** Observed status (e.g. `deployed`, `pending`). */
  73 │     status: string | undefined;
  74 │     /** Organization slug. */
  75 │     orgSlug: string | undefined;
  76 │     /** Observed machine count. */
  77 │     machineCount: number | undefined;
  78 │     /** Observed volume count. */
  79 │     volumeCount: number | undefined;
  80 │     /** Public `https://{appName}.fly.dev` URL. */
> 81 │     url: string;
  82 │   },
  83 │   never,
  84 │   Providers
  85 │ >;

0.74 packages/alchemy/src/Fly/leases.ts:63:3
  59 │ export class MachineMutationUncertain extends Data.TaggedError(
  60 │   "Fly.MachineMutationUncertain",
  61 │ )<{
  62 │   appName: string;
> 63 │   machineId: string;
  64 │ }> {}

0.74 packages/alchemy/src/Fly/Website/Foldkit.ts:35:1
> 35 │ export const Foldkit = (id: string, props: FoldkitProps = {}) =>
  36 │   Vite(id, {
  37 │     ...props,
  38 │     assets: {
  39 │       notFoundHandling: "single-page-application",
  40 │       ...props.assets,
  41 │     },
  42 │   });

0.74 packages/alchemy/src/Git/Protocol/PackParser.ts:222:3
  220 │ export interface IngestSummary {
  221 │   /** Number of entries in the pack (the header count). */
> 222 │   readonly count: number;
  223 │   /** The oids of every resolved entry, in emission order. */
  224 │   readonly oids: ReadonlyArray<Oid>;
  225 │ }

0.74 packages/alchemy/src/Prisma/ComputeBuild.ts:1812:7
  1806 │   for (const candidate of candidates) {
  1807 │     const stat = yield* fs
  1808 │       .stat(candidate)
  1809 │       .pipe(Effect.catch(() => Effect.succeed(undefined)));
  1810 │     if (
  1811 │       stat?.type === "File" &&
> 1812 │       (process.platform === "win32" || (stat.mode & 0o111) !== 0)
  1813 │     ) {
  1814 │       const argText = args.map(shellQuote).join(" ");
  1815 │       // Package-manager shims resolve dependencies relative to their own path.
  1816 │       // Resolve symlinked node_modules directories before invoking the shim.
  1817 │       const executablePath = yield* fs.realPath(candidate);
  1818 │       return `${shellQuote(executablePath)}${argText.length > 0 ? ` ${argText}` : ""}`;
  1819 │     }
  1820 │   }

0.74 packages/alchemy/src/Prisma/Connect.ts:188:3
  187 │ type ConnectEnvBindingHost = Resource<
> 188 │   string,
  189 │   object | undefined,
  190 │   object,
  191 │   { env?: Record<string, ConnectEnvValue> }
  192 │ >;

0.74 packages/alchemy/src/Prisma/Internal/LogsClient.ts:123:3
  122 │ export const getDeploymentLogsRequest = (
> 123 │   deploymentId: string,
  124 │   query?: DeploymentLogsQuery,
  125 │ ): Effect.Effect<
  126 │   DeploymentLogsRequest,
  127 │   PrismaApiError | ConfigError,
  128 │   Credentials
  129 │ > =>
  130 │   Effect.gen(function* () {
  131 │     const credentials = yield* Credentials;
  132 │     const { apiToken, apiBaseUrl } = yield* credentials;
  133 │     const url = yield* buildWebSocketUrl(
  134 │       apiBaseUrl,
  135 │       `/v1/deployments/${pathSegment(deploymentId)}/logs`,
  136 │       logsQuery(query),
  137 │     );
  138 │     return {
  139 │       url,
  140 │       headers: {
  141 │         Authorization: Redacted.make(`Bearer ${Redacted.value(apiToken)}`),
  142 │       },
  143 │     };
  144 │   });

0.74 packages/alchemy/src/Railway/MountVolume.ts:31:3
  29 │ export interface MountSpec {
  30 │   /** Railway volume id (not the instance id). */
> 31 │   volumeId: string;
  32 │   /** Absolute path inside the container. */
  33 │   path: string;
  34 │ }

0.74 packages/alchemy/src/Railway/SandboxCheckpoint.ts:135:3
  134 │ const findRecordedCheckpoint = Effect.fn(function* (
> 135 │   id: string,
  136 │   props: SandboxCheckpointProps | undefined,
  137 │   output: SandboxCheckpoint["Attributes"],
  138 │   items: readonly CloudCheckpoint[],
  139 │ ) {
  140 │   const byId = items.find((item) => item.id === output.sandboxCheckpointId);
  141 │   if (byId !== undefined) return byId;
  142 │   if (
  143 │     props?.sandbox?.environmentId !== output.environmentId ||
  144 │     props?.sandbox?.sandboxId !== output.sandboxId
  145 │   ) {
  146 │     return undefined;
  147 │   }
  148 │   // Updating rows retain attempted props alongside the pre-rename attributes.
  149 │   const attemptedName = props?.name ?? (yield* createRailwayName(id));
  150 │   return items.find((item) => item.key === attemptedName);
  151 │ });

0.74 packages/alchemy/src/RuntimeContext.ts:12:3
  10 │ export interface BaseRuntimeContext {
  11 │   Type: string;
> 12 │   id: string;
  13 │   env: Record<string, any>;

0.74 packages/alchemy/src/Stripe/Coupon.ts:255:3
  254 │ const toAttrs = (coupon: StripeCoupon): CouponAttributes => ({
> 255 │   id: coupon.id,
  256 │   name: coupon.name ?? undefined,
  257 │   percentOff: coupon.percent_off ?? undefined,
  258 │   amountOff: coupon.amount_off ?? undefined,
  259 │   currency: coupon.currency ?? undefined,
  260 │   currencyOptions: fromWireCurrencyOptions(coupon.currency_options),
  261 │   duration: coupon.duration,
  262 │   durationInMonths: coupon.duration_in_months ?? undefined,
  263 │   maxRedemptions: coupon.max_redemptions ?? undefined,
  264 │   redeemBy: coupon.redeem_by ?? undefined,
  265 │   appliesTo: fromObservedAppliesTo(coupon.applies_to),
  266 │   valid: coupon.valid,
  267 │   timesRedeemed: coupon.times_redeemed,
  268 │   created: coupon.created,
  269 │   livemode: coupon.livemode,
  270 │   metadata: userMetadata(coupon.metadata),
  271 │ });

0.74 packages/alchemy/test/AWS/DSQL/fixtures/schema.ts:6:3
  3 │ // DSQL restrictions: no SERIAL/sequences and no foreign keys — a plain
  4 │ // integer primary key + text column stays well inside the supported surface.
  5 │ export const Widgets = pgTable("dsql_connect_widgets", {
> 6 │   id: integer("id").primaryKey(),
  7 │   title: text("title").notNull(),
  8 │ });
  9 │ export type Widget = typeof Widgets.$inferSelect;

0.74 packages/alchemy/test/AWS/Lambda/fixtures/durable-handler.ts:34:5
  25 │ export default DurableFlow.make(
  26 │   {
  27 │     main,
  28 │     executionTimeout: Duration.hours(1),
  29 │     retentionPeriod: "1 day",
  30 │     // Per-invocation budget (each resume is its own invocation).
  31 │     timeout: Duration.seconds(60),
  32 │   },
  33 │   Effect.gen(function* () {
> 34 │     return Effect.fn(function* (input: { orderId: string }) {
  35 │       const reserved = yield* Lambda.Durable.step(
  36 │         "reserve",
  37 │         Effect.succeed({ orderId: input.orderId, reserved: true }),
  38 │       );
  39 │       yield* Lambda.Durable.sleep("cooldown", "5 seconds");
  40 │       const total = yield* Lambda.Durable.step(
  41 │         "price",
  42 │         // Non-deterministic work belongs inside a step: the checkpointed
  43 │         // result replays identically on the resume invocation.
  44 │         Effect.sync(() => 40 + 2),
  45 │       );
  46 │       return { orderId: reserved.orderId, reserved: reserved.reserved, total };
  47 │     });
  48 │   }),
  49 │ );

0.74 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:54:11
  53 │         if (request.method === "GET" && pathname === "/get") {
> 54 │           const id = url.searchParams.get("id")!;
  55 │           const vm = yield* getMicrovm({ microvmIdentifier: id });
  56 │           return yield* HttpServerResponse.json({ state: vm.state });
  57 │         }

0.74 packages/alchemy/test/AWS/MediaTailor/handler.ts:63:11
  62 │         if (request.method === "POST" && pathname === "/prefetch/create") {
> 63 │           const body = (yield* request.json) as unknown as { name: string };
  64 │           const now = yield* Effect.sync(() => Date.now());
  65 │           const result = yield* createPrefetchSchedule({
  66 │             Name: body.name,
  67 │             Retrieval: { EndTime: new Date(now + 60 * 60 * 1000) },
  68 │             Consumption: { EndTime: new Date(now + 2 * 60 * 60 * 1000) },
  69 │           }).pipe(
  70 │             Effect.map((r) => ({
  71 │               arn: r.Arn,
  72 │               error: undefined,
  73 │               detail: undefined,
  74 │             })),
  75 │             Effect.catch((e) =>
  76 │               Effect.succeed({
  77 │                 arn: undefined,
  78 │                 error: e._tag,
  79 │                 detail: String(e),
  80 │               }),
  81 │             ),
  82 │           );
  83 │           return yield* HttpServerResponse.json(result);
  84 │         }

0.74 packages/alchemy/test/AWS/Timestream/sink-handler.ts:68:13
  65 │         if (request.method === "POST" && pathname === "/sink") {
  66 │           const body = (yield* request.json) as unknown as {
  67 │             host: string;
> 68 │             count: number;
  69 │           };
  70 │           const base = Date.now() - body.count * 1_000;
  71 │           yield* Stream.fromIterable(
  72 │             Array.from({ length: body.count }, (_, i) =>
  73 │               record(body.host, i, base + i * 1_000),
  74 │             ),
  75 │           ).pipe(Stream.run(sink));
  76 │           return yield* HttpServerResponse.json({
  77 │             ok: true,
  78 │             count: body.count,
  79 │           });
  80 │         }

0.74 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:9:3
   6 │ import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
   7 │
   8 │ class WorkerNotPropagated extends Data.TaggedError("WorkerNotPropagated")<{
>  9 │   readonly url: string;
  10 │ }> {}

0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/init-io/worker.ts:17:3
  15 │ class TraceConfig extends Context.Service<
  16 │   TraceConfig,
> 17 │   { trace: string; nonce: string }
  18 │ >()("InitIO.TraceConfig") {}

0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-do-namespace-do-rpc/group.ts:14:5
  11 │ export class CounterRpcs extends RpcGroup.make(
  12 │   Rpc.make("Increment", {
  13 │     payload: {},
> 14 │     success: Schema.Struct({ count: Schema.Number }),
  15 │   }),
  16 │   Rpc.make("Get", {
  17 │     payload: {},
  18 │     success: Schema.Struct({ count: Schema.Number }),
  19 │   }),
  20 │   Rpc.make("CountUpTo", {
  21 │     payload: { upto: Schema.Number },
  22 │     success: RpcSchema.Stream(Schema.Number, Schema.Never),
  23 │   }),
  24 │   Rpc.make("Reset", {
  25 │     payload: {},
  26 │     success: Schema.Void,
  27 │   }),
  28 │ ) {}

0.74 packages/alchemy/test/Neon/fixtures/StorageNative.ts:4:3
   1 │ import { AwsClient } from "aws4fetch";
   2 │
   3 │ export const signStorageRead = (config: {
>  4 │   endpoint: string;
   5 │   region: string;
   6 │   accessKeyId: string;
   7 │   secretAccessKey: string;
   8 │ }) =>
   9 │   new AwsClient({
  10 │     accessKeyId: config.accessKeyId,
  11 │     secretAccessKey: config.secretAccessKey,
  12 │     region: config.region,
  13 │     service: "s3",
  14 │   }).sign(config.endpoint);

0.74 packages/alchemy/test/Railway/fixtures/redis-shared.ts:11:1
> 11 │ export const REDIS_KEY = "alchemy-marker";
  12 │ export const REDIS_VALUE = "hello-from-redis";

0.74 packages/cloudflare-runtime/src/core/internal/Port.ts:101:3
   97 │ export interface Ports {
   98 │   /**
   99 │    * Finds an available port starting from the given one.
  100 │    */
> 101 │   readonly find: (port: number) => Effect.Effect<number>;
  102 │   /**
  103 │    * Checks if a port is available and reserves it if it is; returns an error otherwise.
  104 │    */
  105 │   readonly check: (port: number) => Effect.Effect<number, ConfigError>;
  106 │   /**
  107 │    * Waits for a specific port to become available (uncached probes on a
  108 │    * short interval), reserving it on success. Fails with `AddressInUse`
  109 │    * when the grace window elapses — or immediately when the port is
  110 │    * reserved by this process group, since the holder won't release it.
  111 │    *
  112 │    * This is the allocator for user-configured ports: a dev-session restart
  113 │    * races the previous session's teardown, and without a grace window the
  114 │    * configured port silently drifts — cascading every configured port in
  115 │    * the stack up by one in nondeterministic order.
  116 │    */
  117 │   readonly waitFor: (port: number) => Effect.Effect<number, ConfigError>;
  118 │   /**
  119 │    * Marks a port as occupied for the lifetime of the cache, preventing it from being assigned to another worker.
  120 │    * Note that this is best-effort; the caller should include retry logic to handle race conditions.
  121 │    */
  122 │   readonly reserve: (port: number) => Effect.Effect<void>;
  123 │ }

0.74 packages/cloudflare-runtime/src/core/workerd/Workerd.ts:503:19
  491 │         error: () =>
  492 │           Effect.callback((resume) => {
  493 │             let stderr = "";
  494 │             const onData = (data: Buffer) => {
  495 │               stderr += data.toString();
  496 │             };
  497 │             const onError = () => {
  498 │               resume(
  499 │                 classifyWorkerdError(
  500 │                   stderr || "Node child process stderr is empty.",
  501 │                   child.exitCode,
  502 │                   child.signalCode,
> 503 │                   configuredAddresses,
  504 │                 ),
  505 │               );
  506 │             };
  507 │             child.stderr.on("data", onData);
  508 │             child.stderr.on("end", onError);
  509 │             child.stderr.on("error", onError);
  510 │             return Effect.sync(() => {
  511 │               child.stderr?.off("data", onData);
  512 │               child.stderr?.off("end", onError);
  513 │               child.stderr?.off("error", onError);
  514 │             });
  515 │           }),

0.74 packages/frontend-frameworks/src/vinext/cli.ts:117:11
   97 │       Effect.sync(() => {
   98 │         const shared = {
   99 │           __VINEXT_SHARED_BUILD_ID: config.nextConfig.buildId,
  100 │           __VINEXT_SHARED_RSC_COMPATIBILITY_ID: config.rscCompatibilityId,
  101 │           __VINEXT_SHARED_RSC_BUILD_IDENTITY: randomBytes(16).toString("hex"),
  102 │           __VINEXT_SHARED_REVALIDATE_SECRET: randomBytes(32).toString("hex"),
  103 │           __VINEXT_SHARED_PRERENDER_SECRET: randomBytes(32).toString("hex"),
  104 │           ...(hybrid
  105 │             ? {
  106 │                 __VINEXT_PAGES_CLIENT_ASSETS_BUILD_SESSION:
  107 │                   randomBytes(16).toString("hex"),
  108 │               }
  109 │             : {}),
  110 │         };
  111 │         const previous = Object.fromEntries(
  112 │           Object.keys(shared).map((key) => [key, process.env[key]]),
  113 │         );
  114 │         Object.assign(process.env, shared);
  115 │         return {
  116 │           previous,
> 117 │           session: shared.__VINEXT_PAGES_CLIENT_ASSETS_BUILD_SESSION,
  118 │         };
  119 │       }),

0.73 packages/alchemy/src/AWS/AMP/AlertManagerDefinition.ts:16:3
  10 │ export interface AlertManagerDefinitionProps {
  11 │   /**
  12 │    * Id of the AMP workspace this alert manager definition belongs to. A
  13 │    * workspace has at most one alert manager definition. Changing the
  14 │    * workspace replaces the definition.
  15 │    */
> 16 │   workspaceId: string;
  17 │   /**
  18 │    * The Alertmanager configuration as a YAML document (the `alertmanager.yml`
  19 │    * shape, with `alertmanager_config` and optional `template_files` keys).
  20 │    * Updated in place.
  21 │    */
  22 │   definition: string;
  23 │ }

0.73 packages/alchemy/src/AWS/AMP/AnomalyDetector.ts:161:9
  160 │       const findByAlias = Effect.fn(function* (
> 161 │         workspaceId: string,
  162 │         alias: string,
  163 │       ) {
  164 │         const summary = yield* amp.listAnomalyDetectors
  165 │           .items({ workspaceId, alias })
  166 │           .pipe(
  167 │             Stream.filter((s) => s.alias === alias),
  168 │             Stream.runHead,
  169 │             Effect.map(Option.getOrUndefined),
  170 │             Effect.catchTag("ResourceNotFoundException", () =>
  171 │               Effect.succeed(undefined),
  172 │             ),
  173 │           );
  174 │         return summary === undefined
  175 │           ? undefined
  176 │           : yield* describe(workspaceId, summary.anomalyDetectorId);
  177 │       });

0.73 packages/alchemy/src/AWS/AMP/QueryLoggingConfiguration.ts:47:3
  39 │ export interface QueryLoggingConfiguration extends Resource<
  40 │   "AWS.AMP.QueryLoggingConfiguration",
  41 │   QueryLoggingConfigurationProps,
  42 │   {
  43 │     workspaceId: string;
  44 │     destinations: { logGroupArn: string; qspThreshold: number }[];
  45 │     status: string;
  46 │   },
> 47 │   never,
  48 │   Providers
  49 │ > {}

0.73 packages/alchemy/src/AWS/AMP/Workspace.ts:221:9
  220 │       const syncWorkspaceConfiguration = Effect.fn(function* (
> 221 │         workspaceId: string,
  222 │         news: WorkspaceProps,
  223 │       ) {

0.73 packages/alchemy/src/AWS/ApiGateway/Method.ts:321:3
  319 │ const deleteMethodSafe = (p: {
  320 │   restApiId: string;
> 321 │   resourceId: string;
  322 │   httpMethod: string;
  323 │ }) =>
  324 │   ag
  325 │     .deleteMethod({
  326 │       restApiId: p.restApiId,
  327 │       resourceId: p.resourceId,
  328 │       httpMethod: p.httpMethod,
  329 │     })
  330 │     .pipe(Effect.catchTag("NotFoundException", () => Effect.void));

0.73 packages/alchemy/src/AWS/ApiGatewayV2/Authorizer.ts:181:3
  180 │ const snapshotFromAuthorizer = (
> 181 │   apiId: string,
  182 │   auth: agw2.GetAuthorizerResponse,
  183 │ ): AuthorizerType["Attributes"] => ({
  184 │   apiId,
  185 │   authorizerId: auth.AuthorizerId!,
  186 │   name: auth.Name ?? "",
  187 │   authorizerType: auth.AuthorizerType ?? "JWT",
  188 │   identitySource: auth.IdentitySource,
  189 │   jwtConfiguration: auth.JwtConfiguration,
  190 │   authorizerUri: auth.AuthorizerUri,
  191 │   authorizerPayloadFormatVersion: auth.AuthorizerPayloadFormatVersion,
  192 │   enableSimpleResponses: auth.EnableSimpleResponses,
  193 │   authorizerResultTtlInSeconds: auth.AuthorizerResultTtlInSeconds,
  194 │   authorizerCredentialsArn: auth.AuthorizerCredentialsArn,
  195 │   identityValidationExpression: auth.IdentityValidationExpression,
  196 │ });

0.73 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalableTarget.ts:161:9
  158 │     Effect.gen(function* () {
  159 │       const describe = (props: {
  160 │         serviceNamespace: aas.ServiceNamespace;
> 161 │         resourceId: string;
  162 │         scalableDimension: aas.ScalableDimension;
  163 │       }) =>
  164 │         aas
  165 │           .describeScalableTargets({
  166 │             ServiceNamespace: props.serviceNamespace,
  167 │             ResourceIds: [props.resourceId],
  168 │             ScalableDimension: props.scalableDimension,
  169 │           })
  170 │           .pipe(
  171 │             Effect.map((res) =>
  172 │               res.ScalableTargets?.find(
  173 │                 (t) =>
  174 │                   t.ResourceId === props.resourceId &&
  175 │                   t.ScalableDimension === props.scalableDimension,
  176 │               ),
  177 │             ),
  178 │           );

0.73 packages/alchemy/src/AWS/AppRegistry/AttributeGroupAssociation.ts:36:3
  23 │ export interface AttributeGroupAssociation extends Resource<
  24 │   "AWS.AppRegistry.AttributeGroupAssociation",
  25 │   AttributeGroupAssociationProps,
  26 │   {
  27 │     /** The ID of the associated application. */
  28 │     applicationId: string;
  29 │     /** The ARN of the associated application. */
  30 │     applicationArn: string;
  31 │     /** The ID of the associated attribute group. */
  32 │     attributeGroupId: string;
  33 │     /** The ARN of the associated attribute group. */
  34 │     attributeGroupArn: string;
  35 │   },
> 36 │   never,
  37 │   Providers
  38 │ > {}

0.73 packages/alchemy/src/AWS/AppRegistry/ResourceAssociation.ts:63:3
  48 │ export interface ResourceAssociation extends Resource<
  49 │   "AWS.AppRegistry.ResourceAssociation",
  50 │   ResourceAssociationProps,
  51 │   {
  52 │     /** The ID of the associated application. */
  53 │     applicationId: string;
  54 │     /** The ARN of the associated application. */
  55 │     applicationArn: string;
  56 │     /** The type of the associated resource. */
  57 │     resourceType: string;
  58 │     /** The canonical name of the associated resource. */
  59 │     resourceName: string;
  60 │     /** The ARN of the associated resource. */
  61 │     resourceArn: string;
  62 │   },
> 63 │   never,
  64 │   Providers
  65 │ > {}

0.73 packages/alchemy/src/AWS/Backup/BackupSelection.ts:81:5
  74 │ export interface BackupSelection extends Resource<
  75 │   "AWS.Backup.BackupSelection",
  76 │   BackupSelectionProps,
  77 │   {
  78 │     /**
  79 │      * Service-assigned unique ID of the selection.
  80 │      */
> 81 │     selectionId: string;
  82 │     /**
  83 │      * Name of the selection.
  84 │      */
  85 │     selectionName: string;
  86 │     /**
  87 │      * ID of the backup plan the selection is attached to.
  88 │      */
  89 │     backupPlanId: string;
  90 │   },
  91 │   never,
  92 │   Providers
  93 │ > {}

0.73 packages/alchemy/src/AWS/BackupSearch/ExportJob.ts:29:3
  24 │ export interface ExportJobProps {
  25 │   /**
  26 │    * Identifier of the search job whose results are exported. Immutable —
  27 │    * changing it replaces the export job.
  28 │    */
> 29 │   searchJobIdentifier: string;
  30 │   /**
  31 │    * Where the results are exported to. Immutable — changing it replaces the
  32 │    * export job.
  33 │    */
  34 │   exportSpecification: ExportSpecification;
  35 │   /**
  36 │    * ARN of the IAM role BackupSearch assumes to write the export to the
  37 │    * destination bucket. Immutable — changing it replaces the export job.
  38 │    */
  39 │   roleArn?: string;
  40 │   /**
  41 │    * User-defined tags for the export job.
  42 │    */
  43 │   tags?: Record<string, string>;
  44 │ }

0.73 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:70:5
  67 │     /**
  68 │      * The unique identifier of the cluster.
  69 │      */
> 70 │     clusterId: string;

0.73 packages/alchemy/src/AWS/DSQL/Cluster.ts:52:3
  33 │ export interface Cluster extends Resource<
  34 │   "AWS.DSQL.Cluster",
  35 │   ClusterProps,
  36 │   {
  37 │     /** The unique cluster identifier assigned by DSQL. */
  38 │     clusterId: string;
  39 │     /** The ARN of the cluster. */
  40 │     clusterArn: string;
  41 │     /** The current status of the cluster, e.g. `ACTIVE`. */
  42 │     status: string;
  43 │     /**
  44 │      * The public cluster endpoint hostname, e.g.
  45 │      * `<clusterId>.dsql.<region>.on.aws`. Connect with a Postgres wire client
  46 │      * using an IAM-generated auth token as the password.
  47 │      */
  48 │     endpoint: string;
  49 │     /** Whether deletion protection is enabled on the cluster. */
  50 │     deletionProtectionEnabled: boolean;
  51 │   },
> 52 │   never,
  53 │   Providers
  54 │ > {}

0.73 packages/alchemy/src/AWS/DSQL/Stream.ts:75:3
  54 │ export interface Stream extends Resource<
  55 │   "AWS.DSQL.Stream",
  56 │   StreamProps,
  57 │   {
  58 │     /** Identifier of the source cluster. */
  59 │     clusterId: string;
  60 │     /** The unique stream identifier assigned by DSQL. */
  61 │     streamId: string;
  62 │     /** The ARN of the stream. */
  63 │     streamArn: string;
  64 │     /** The current status of the stream, e.g. `ACTIVE`. */
  65 │     status: string;
  66 │     /** Record ordering guarantee. */
  67 │     ordering: string;
  68 │     /** Record serialization format. */
  69 │     format: string;
  70 │     /** ARN of the target Kinesis data stream. */
  71 │     kinesisStreamArn: string;
  72 │     /** ARN of the IAM role DSQL assumes to write to Kinesis. */
  73 │     roleArn: string;
  74 │   },
> 75 │   never,
  76 │   Providers
  77 │ > {}

0.73 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:214:13
  213 │           associations: acl.Associations?.map((a) => ({
> 214 │             networkAclAssociationId: a.NetworkAclAssociationId!,
  215 │             networkAclId: a.NetworkAclId!,
  216 │             subnetId: a.SubnetId!,
  217 │           })),

0.73 packages/alchemy/src/AWS/EC2/RouteTable.ts:81:7
  65 │     associations?: Array<{
  66 │       /**
  67 │        * Whether this is the main route table for the VPC.
  68 │        */
  69 │       main: boolean;
  70 │       /**
  71 │        * The ID of the association.
  72 │        */
  73 │       routeTableAssociationId?: string;
  74 │       /**
  75 │        * The ID of the route table.
  76 │        */
  77 │       routeTableId?: string;
  78 │       /**
  79 │        * The ID of the subnet (if the association is with a subnet).
  80 │        */
> 81 │       subnetId?: string;
  82 │       /**
  83 │        * The ID of the gateway (if the association is with a gateway).
  84 │        */
  85 │       gatewayId?: string;
  86 │       /**
  87 │        * The state of the association.
  88 │        */
  89 │       associationState?: {
  90 │         state: EC2.RouteTableAssociationStateCode;
  91 │         statusMessage?: string;
  92 │       };
  93 │     }>;

0.73 packages/alchemy/src/AWS/ECR/ImageSource.ts:142:3
  140 │ /** Loose bag shape used to sniff which source variant a props object is. */
  141 │ export interface ImageSourceLike {
> 142 │   main?: string;
  143 │   handler?: string;
  144 │   build?: BundledImageSource["build"];
  145 │   context?: string;
  146 │   dockerfile?: string | InlineDockerfile;
  147 │   image?: string;
  148 │ }

0.73 packages/alchemy/src/AWS/ECS/Task.ts:881:3
  871 │ export const deleteTaskDefinitionInfrastructure = Effect.fn(function* (output: {
  872 │   taskDefinitionArn: string;
  873 │   /**
  874 │    * The family owned by this resource. When present, EVERY remaining ACTIVE
  875 │    * revision is swept — state rows written before reconcile-time revision
  876 │    * reaping can have superseded revisions beyond the recorded one.
  877 │    */
  878 │   taskFamily?: string;
  879 │   repositoryName: string;
  880 │   logGroupName: string;
> 881 │   taskRoleName: string;
  882 │   executionRoleName: string;
  883 │ }) {

0.73 packages/alchemy/src/AWS/IAM/ServiceSpecificCredential.ts:40:5
  35 │ export interface ServiceSpecificCredential extends Resource<
  36 │   "AWS.IAM.ServiceSpecificCredential",
  37 │   ServiceSpecificCredentialProps,
  38 │   {
  39 │     /** The IAM user the credential belongs to. */
> 40 │     userName: string;
  41 │     /** The AWS service the credential is scoped to (e.g. `codecommit.amazonaws.com`). */
  42 │     serviceName: string;
  43 │     /** The unique ID of the credential. */
  44 │     serviceSpecificCredentialId: string;
  45 │     /** Whether the credential is `Active` or `Inactive`. */
  46 │     status: iam.StatusType;
  47 │     /** When the credential was created. */
  48 │     createDate: Date | undefined;
  49 │     /** When the credential expires, if an age was configured. */
  50 │     expirationDate: Date | undefined;
  51 │     /** The generated service-specific user name. */
  52 │     serviceUserName: string | undefined;
  53 │     /** The generated credential alias, if the service issues one. */
  54 │     serviceCredentialAlias: string | undefined;
  55 │     /** The generated password. AWS only returns it at creation; later reads preserve the originally stored redacted value. */
  56 │     servicePassword: Redacted.Redacted<string> | undefined;
  57 │     /** The generated secret. AWS only returns it at creation; later reads preserve the originally stored redacted value. */
  58 │     serviceCredentialSecret: Redacted.Redacted<string> | undefined;
  59 │   },
  60 │   never,
  61 │   Providers
  62 │ > {}

0.73 packages/alchemy/src/AWS/IAM/SigningCertificate.ts:32:5
  25 │ export interface SigningCertificate extends Resource<
  26 │   "AWS.IAM.SigningCertificate",
  27 │   SigningCertificateProps,
  28 │   {
  29 │     /** The IAM user the signing certificate belongs to. */
  30 │     userName: string;
  31 │     /** The unique ID of the signing certificate. */
> 32 │     certificateId: string;
  33 │     /** The PEM-encoded certificate body. */
  34 │     certificateBody: string;
  35 │     /** Whether the certificate is `Active` or `Inactive`. */
  36 │     status: iam.StatusType;
  37 │     /** When the certificate was uploaded. */
  38 │     uploadDate: Date | undefined;
  39 │   },
  40 │   never,
  41 │   Providers
  42 │ > {}

0.73 packages/alchemy/src/AWS/Kendra/DataSource.ts:61:3
> 61 │   roleArn?: string;

0.73 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationCloudWatchLoggingOption.ts:40:3
  23 │ export interface ApplicationCloudWatchLoggingOption extends Resource<
  24 │   "AWS.KinesisAnalyticsV2.ApplicationCloudWatchLoggingOption",
  25 │   ApplicationCloudWatchLoggingOptionProps,
  26 │   {
  27 │     /**
  28 │      * Name of the application the option is attached to.
  29 │      */
  30 │     applicationName: string;
  31 │     /**
  32 │      * ARN of the CloudWatch Logs log stream receiving application messages.
  33 │      */
  34 │     logStreamArn: string;
  35 │     /**
  36 │      * Service-assigned ID of the logging option within the application.
  37 │      */
  38 │     cloudWatchLoggingOptionId: string | undefined;
  39 │   },
> 40 │   never,
  41 │   Providers
  42 │ > {}

0.73 packages/alchemy/src/AWS/LakeFormation/ResourceSpec.ts:12:3
   7 │ export interface CatalogSpec {
   8 │   /**
   9 │    * The catalog id (AWS account id).
  10 │    * @default the caller's account
  11 │    */
> 12 │   id?: string;
  13 │ }

0.73 packages/alchemy/src/AWS/Lambda/MicrovmRpc.ts:16:3
  11 │ export interface MicrovmConnection {
  12 │   /**
  13 │    * The MicroVM endpoint hostname (no scheme), e.g.
  14 │    * `<id>.lambda-microvm.<region>.on.aws` — from `RunMicrovm`'s response.
  15 │    */
> 16 │   endpoint: string;
  17 │   /**
  18 │    * The auth token from `CreateAuthToken` — a map of header name → value that
  19 │    * authorizes requests to the MicroVM endpoint (the AWS proxy validates them).
  20 │    * Values may be {@link Redacted.Redacted}.
  21 │    */
  22 │   authToken: Record<string, string | Redacted.Redacted<string> | undefined>;
  23 │ }

0.73 packages/alchemy/src/AWS/Logs/LogGroupEventSource.ts:36:5
  22 │ export interface LogsSubscriptionPayload {
  23 │   /** `DATA_MESSAGE` carries log events; `CONTROL_MESSAGE` is a delivery check. */
  24 │   messageType: "DATA_MESSAGE" | "CONTROL_MESSAGE";
  25 │   /** AWS account id that owns the source log group. */
  26 │   owner: string;
  27 │   /** Name of the log group the events came from. */
  28 │   logGroup: string;
  29 │   /** Name of the log stream the events came from. */
  30 │   logStream: string;
  31 │   /** Names of the subscription filters that matched the events. */
  32 │   subscriptionFilters: string[];
  33 │   /** The batch of matched log events. */
  34 │   logEvents: {
  35 │     /** Unique identifier of the log event. */
> 36 │     id: string;
  37 │     /** Event timestamp (epoch milliseconds). */
  38 │     timestamp: number;
  39 │     /** The raw log line. */
  40 │     message: string;
  41 │   }[];
  42 │ }

0.73 packages/alchemy/src/AWS/MailManager/Archive.ts:61:3
  48 │ export interface Archive extends Resource<
  49 │   "AWS.MailManager.Archive",
  50 │   ArchiveProps,
  51 │   {
  52 │     /** Server-assigned ID of the archive. */
  53 │     archiveId: string;
  54 │     /** ARN of the archive. */
  55 │     archiveArn: string;
  56 │     /** Name of the archive. */
  57 │     archiveName: string;
  58 │     /** Current state (ACTIVE or PENDING_DELETION). */
  59 │     archiveState: string | undefined;
  60 │   },
> 61 │   never,
  62 │   Providers
  63 │ > {}

0.73 packages/alchemy/src/AWS/MailManager/IngressPoint.ts:41:3
> 41 │   ruleSetId: string;

0.73 packages/alchemy/src/AWS/MediaLive/Input.ts:48:3
> 48 │   name?: string;

0.73 packages/alchemy/src/AWS/Neptune/DBInstance.ts:101:3
> 101 │   never,
  102 │   Providers
  103 │ > {}

0.73 packages/alchemy/src/AWS/OAM/Link.ts:82:5
  75 │ export interface Link extends Resource<
  76 │   "AWS.OAM.Link",
  77 │   LinkProps,
  78 │   {
  79 │     /** The ARN of the link. */
  80 │     linkArn: string;
  81 │     /** The random ID string that AWS generated as part of the link ARN. */
> 82 │     linkId: string;
  83 │     /** The label that this link displays in the monitoring account. */
  84 │     label: string;
  85 │     /** The ARN of the sink this link is attached to. */
  86 │     sinkArn: string;
  87 │   },
  88 │   never,
  89 │   Providers
  90 │ > {}

0.73 packages/alchemy/src/AWS/Omics/internal.ts:13:1
> 13 │ export const fetchOmicsTags = Effect.fn(function* (resourceArn: string) {
  14 │   return yield* omics.listTagsForResource({ resourceArn }).pipe(
  15 │     Effect.map((r) => tagRecord(r.tags)),
  16 │     Effect.catchTag("ResourceNotFoundException", () =>
  17 │       Effect.succeed({} as Record<string, string>),
  18 │     ),
  19 │   );
  20 │ });

0.73 packages/alchemy/src/AWS/Route53/ZoneVpcAssociation.ts:14:3
   9 │ export interface ZoneVpcAssociationProps {
  10 │   /**
  11 │    * ID of the private hosted zone to associate the VPC with. Changing this
  12 │    * forces replacement.
  13 │    */
> 14 │   hostedZoneId: string;
  15 │   /**
  16 │    * ID of the VPC to associate. The VPC must have DNS support and DNS
  17 │    * hostnames enabled. Changing this forces replacement.
  18 │    */
  19 │   vpcId: string;
  20 │   /**
  21 │    * Region the VPC lives in. Changing this forces replacement.
  22 │    */
  23 │   vpcRegion: string;
  24 │   /**
  25 │    * Optional comment recorded on the association request.
  26 │    */
  27 │   comment?: string;
  28 │ }

0.73 packages/alchemy/src/AWS/Route53Profiles/ProfileResourceAssociation.ts:40:5
  35 │ export interface ProfileResourceAssociation extends Resource<
  36 │   "AWS.Route53Profiles.ProfileResourceAssociation",
  37 │   ProfileResourceAssociationProps,
  38 │   {
  39 │     /** ID of the association (e.g. `rpr-...`). */
> 40 │     profileResourceAssociationId: string;
  41 │     /** ID of the Profile. */
  42 │     profileId: string;
  43 │     /** ARN of the attached DNS resource. */
  44 │     resourceArn: string;
  45 │     /** Type of the attached resource (e.g. `FIREWALL_RULE_GROUP`). */
  46 │     resourceType: string;
  47 │     /** Name recorded on the association. */
  48 │     name: string;
  49 │     /** Resource-specific configuration JSON, if any. */
  50 │     resourceProperties: string | undefined;
  51 │     /**
  52 │      * Status of the association at the end of the deploy. Associations
  53 │      * settle asynchronously (typically within a minute or two), so this is
  54 │      * usually still `UPDATING`.
  55 │      */
  56 │     status: profiles.ProfileStatus;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ > {}

0.73 packages/alchemy/src/AWS/Schemas/internal.ts:29:3
  27 │ export const syncSchemasTags = Effect.fn(function* (
  28 │   resourceArn: string,
> 29 │   id: string,
  30 │   userTags: Record<string, string> | undefined,
  31 │ ) {
  32 │   const internalTags = yield* createInternalTags(id);
  33 │   const desired = { ...userTags, ...internalTags };
  34 │   const observed = yield* readSchemasTags(resourceArn);
  35 │   const { upsert, removed } = diffTags(observed, desired);
  36 │   if (upsert.length > 0) {
  37 │     yield* schemas.tagResource({
  38 │       ResourceArn: resourceArn,
  39 │       Tags: Object.fromEntries(upsert.map((t) => [t.Key, t.Value])),
  40 │     });
  41 │   }
  42 │   if (removed.length > 0) {
  43 │     yield* schemas.untagResource({
  44 │       ResourceArn: resourceArn,
  45 │       TagKeys: removed,
  46 │     });
  47 │   }
  48 │ });

0.73 packages/alchemy/src/AWS/ServiceQuotas/ServiceQuotaIncreaseRequest.ts:65:5
  62 │     /** Quota identifier. */
  63 │     quotaCode: string;
  64 │     /** The requested (desired) quota value. */
> 65 │     desiredValue: number;

0.73 packages/alchemy/src/AWS/SSMContacts/ContactChannel.ts:66:3
  51 │ export interface ContactChannel extends Resource<
  52 │   "AWS.SSMContacts.ContactChannel",
  53 │   ContactChannelProps,
  54 │   {
  55 │     /** ARN of the contact channel. */
  56 │     contactChannelArn: string;
  57 │     /** ARN of the owning contact. */
  58 │     contactArn: string;
  59 │     /** Name of the channel. */
  60 │     name: string;
  61 │     /** The channel type. */
  62 │     type: string;
  63 │     /** `ACTIVATED` or `NOT_ACTIVATED`. */
  64 │     activationStatus: string | undefined;
  65 │   },
> 66 │   never,
  67 │   Providers
  68 │ > {}

0.73 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkVpcAssociation.ts:67:3
> 67 │   never,
  68 │   Providers
  69 │ > {}

0.73 packages/alchemy/src/Cloudflare/Access/Tag.ts:32:5
  25 │ export type Tag = Resource<
  26 │   "Cloudflare.Access.Tag",
  27 │   TagProps,
  28 │   {
  29 │     /** The name of the tag — also its identity on the Cloudflare API. */
  30 │     name: string;
  31 │     /** Cloudflare account that owns the tag. */
> 32 │     accountId: string;
  33 │   },
  34 │   never,
  35 │   Providers
  36 │ >;

0.73 packages/alchemy/src/Cloudflare/ApiShield/UserSchema.ts:180:7
  178 │     reconcile: Effect.fn(function* ({ id, news, output }) {
  179 │       // Inputs have been resolved to concrete strings by Plan.
> 180 │       const zoneId = news.zoneId as string;
  181 │       const name = output?.name ?? (yield* createSchemaName(id, news.name));
  182 │       const desiredEnabled = news.validationEnabled ?? false;

0.73 packages/alchemy/src/Cloudflare/ApiToken/AccountApiToken.ts:141:3
  133 │ const buildAttributes = (
  134 │   tokenData: {
  135 │     id?: string | null;
  136 │     name?: string | null;
  137 │     // Distilled widened generated string enums to open unions (`string & {}`).
  138 │     status?: string | null;
  139 │   },
  140 │   value: Redacted.Redacted<string>,
> 141 │   accountId: string,
  142 │ ): AccountApiTokenAttributes => ({
  143 │   tokenId: tokenData.id ?? "",
  144 │   name: tokenData.name ?? "",
  145 │   status: (tokenData.status ?? "active") as "active" | "disabled" | "expired",
  146 │   value,
  147 │   accountId,
  148 │ });

0.73 packages/alchemy/src/Cloudflare/Cache/OriginCloudRegion.ts:61:3
  53 │ export interface OriginCloudRegionAttributes {
  54 │   /** Zone the mapping belongs to. */
  55 │   zoneId: string;
  56 │   /** Canonicalized origin IP the mapping applies to. */
  57 │   originIp: string;
  58 │   /** Cloud vendor hosting the origin. */
  59 │   vendor: string;
  60 │   /** Cloud vendor region identifier. */
> 61 │   region: string;
  62 │   /** When the mapping was last modified, if Cloudflare reports it. */
  63 │   modifiedOn: string | undefined;
  64 │ }

0.73 packages/alchemy/src/Cloudflare/CertificateAuthorities/HostnameAssociation.ts:21:3
  15 │ export type HostnameAssociationProps = {
  16 │   /**
  17 │    * Zone whose hostnames should enforce mTLS. Stable — the zone is part of
  18 │    * the association's identity, so changing it triggers a replacement (the
  19 │    * old zone's association is cleared).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * UUID of an uploaded CA certificate from the account-level mTLS
  24 │    * Certificate Management store (`Cloudflare.MtlsCertificate.MtlsCertificate` with
  25 │    * `ca: true`). When omitted, the hostnames are associated with the zone's
  26 │    * active Cloudflare Managed CA instead.
  27 │    *
  28 │    * Stable — the certificate keys the association, so changing it triggers
  29 │    * a replacement (the old certificate's hostname list is cleared).
  30 │    *
  31 │    * @default the active Cloudflare Managed CA
  32 │    */
  33 │   mtlsCertificateId?: string;
  34 │   /**
  35 │    * Fully-qualified hostnames in the zone that enforce mTLS for the keyed
  36 │    * certificate authority. Mutable — the desired list replaces the current
  37 │    * one in full on update.
  38 │    */
  39 │   hostnames: Array<string>;
  40 │ };

0.73 packages/alchemy/src/Cloudflare/CloudConnector/Rules.ts:101:3
   96 │ export type Rules = Resource<
   97 │   TypeId,
   98 │   RulesProps,
   99 │   RulesAttributes,
  100 │   never,
> 101 │   Providers
  102 │ >;

0.73 packages/alchemy/src/Cloudflare/DNS/AccountSettings.ts:321:9
  320 │       return {
> 321 │         accountId,
  322 │         ...snapshot,
  323 │         initialSettings,
  324 │         managedKeys,
  325 │       } satisfies AccountDnsSettingsAttributes;

0.73 packages/alchemy/src/Cloudflare/DNS/ZoneSettings.ts:90:5
  88 │   internalDns?: {
  89 │     /** Zone to resolve from when this internal zone has no match. */
> 90 │     referenceZoneId?: string;
  91 │   };

0.73 packages/alchemy/src/Cloudflare/Gateway/Certificate.ts:148:7
  147 │     diff: Effect.fn(function* ({ olds = {}, news, output }) {
> 148 │       const { accountId } = yield* yield* CloudflareEnvironment;
  149 │       if (!isResolved(news)) return undefined;
  150 │       if ((output?.accountId ?? accountId) !== accountId) {
  151 │         return { action: "replace" } as const;
  152 │       }
  153 │       // The validity period is only settable at creation time.
  154 │       const o = olds as CertificateProps;
  155 │       if (
  156 │         output !== undefined &&
  157 │         (o.validityPeriodDays ?? 1825) !== (news.validityPeriodDays ?? 1825)
  158 │       ) {
  159 │         return { action: "replace" } as const;
  160 │       }
  161 │       return undefined;
  162 │     }),

0.73 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Setting.ts:20:3
  14 │ export type SettingProps = {
  15 │   /**
  16 │    * Zone the setting belongs to. Stable — changing the zone triggers a
  17 │    * replacement (the old zone's setting is restored to the value it had
  18 │    * before Alchemy managed it).
  19 │    */
> 20 │   zoneId: string;
  21 │   /**
  22 │    * Whether zone-level Authenticated Origin Pulls is enabled. When enabled,
  23 │    * Cloudflare presents the zone's uploaded client certificate
  24 │    * ({@link Certificate}) to your origin on every pull.
  25 │    *
  26 │    * Mutable — updated in place.
  27 │    * @default false (Cloudflare's default)
  28 │    */
  29 │   enabled: boolean;
  30 │ };

0.73 packages/alchemy/src/Cloudflare/Tunnel/WarpConnector.ts:41:3
  30 │ export interface WarpConnectorAttributes {
  31 │   /** UUID of the WARP Connector tunnel, assigned by Cloudflare. */
  32 │   tunnelId: string;
  33 │   /** Cloudflare account that owns the tunnel. */
  34 │   accountId: string;
  35 │   /** User-friendly name of the tunnel. */
  36 │   name: string;
  37 │   /**
  38 │    * Status of the tunnel: `inactive` (never run), `degraded`, `healthy`,
  39 │    * or `down`.
  40 │    */
> 41 │   status: string | undefined;
  42 │   /** RFC 3339 timestamp of when the tunnel was created. */
  43 │   createdAt: string | undefined;
  44 │   /**
  45 │    * Connector token used to run the WARP Connector on a host
  46 │    * (`warp-cli connector new <token>`). Sensitive — stored redacted.
  47 │    */
  48 │   token: Redacted.Redacted<string>;
  49 │ }

0.73 packages/alchemy/src/Cloudflare/Workers/AccountSetting.ts:38:3
  36 │ export type AccountSettingAttributes = {
  37 │   /** The Cloudflare account these settings belong to. */
> 38 │   accountId: string;
  39 │   /** Resolved default usage model for the account. */
  40 │   defaultUsageModel: string | undefined;
  41 │   /** Resolved Green Compute flag for the account. */
  42 │   greenCompute: boolean | undefined;
  43 │   /**
  44 │    * The `defaultUsageModel` the account had before Alchemy first managed
  45 │    * this singleton. Restored on destroy.
  46 │    */
  47 │   initialDefaultUsageModel: string | undefined;
  48 │   /**
  49 │    * The `greenCompute` flag the account had before Alchemy first managed
  50 │    * this singleton. Restored on destroy.
  51 │    */
  52 │   initialGreenCompute: boolean | undefined;
  53 │ };

0.73 packages/alchemy/src/Cloudflare/Workers/ObservabilityDestination.ts:81:3
  78 │   /**
  79 │    * The Cloudflare account the destination belongs to.
  80 │    */
> 81 │   accountId: string;

0.73 packages/alchemy/src/GitHub/Environment.ts:101:5
   98 │     /**
   99 │      * URL to view the environment in a browser.
  100 │      */
> 101 │     htmlUrl: string;

0.73 packages/alchemy/src/GitHub/Milestone.ts:401:3
  399 │ const attrsOf = (data: {
  400 │   number: number;
> 401 │   node_id: string;
  402 │   title: string;
  403 │   state: "open" | "closed";
  404 │   description: string | null;
  405 │   due_on: string | null;
  406 │   html_url: string;
  407 │   created_at: string;
  408 │   updated_at: string;
  409 │   closed_at: string | null;
  410 │   open_issues: number;
  411 │   closed_issues: number;
  412 │ }) => ({
  413 │   milestoneNumber: data.number,
  414 │   nodeId: data.node_id,
  415 │   title: data.title,
  416 │   state: data.state,
  417 │   description: data.description,
  418 │   dueOn: data.due_on,
  419 │   htmlUrl: data.html_url,
  420 │   createdAt: data.created_at,
  421 │   updatedAt: data.updated_at,
  422 │   closedAt: data.closed_at,
  423 │   openIssues: data.open_issues,
  424 │   closedIssues: data.closed_issues,
  425 │ });

0.73 packages/alchemy/src/GitHub/Ruleset.ts:208:3
> 208 │   never,
  209 │   GitHub.Providers
  210 │ > {}

0.73 packages/alchemy/src/Hetzner/MountVolume.ts:46:5
  43 │ export interface ServiceBinding {
  44 │   env?: Record<string, any>;
  45 │   volumes?: Array<{
> 46 │     volumeId: number;
  47 │     path: string;
  48 │   }>;
  49 │ }

0.73 packages/alchemy/src/Hetzner/RecordSet.ts:161:3
  157 │ export type RecordSet = Resource<
  158 │   "Hetzner.RecordSet",
  159 │   RecordSetProps,
  160 │   RecordSetAttributes,
> 161 │   never,
  162 │   Providers
  163 │ >;

0.73 packages/alchemy/src/Neon/LocalFunctionProvider.ts:117:17
  110 │           const child = yield* spawner.spawn(
  111 │             ChildProcess.make(
  112 │               command,
  113 │               [
  114 │                 "dev",
  115 │                 "--source",
  116 │                 path.join(root, "index.mjs"),
> 117 │                 ...(news.dev?.port ? ["--port", String(news.dev.port)] : []),
  118 │               ],
  119 │               {
  120 │                 cwd: root,
  121 │                 env: {
  122 │                   ...base,
  123 │                   ...env,
  124 │                   ALCHEMY_STACK_NAME: stack.name,
  125 │                   ALCHEMY_STAGE: stage,
  126 │                   ALCHEMY_PHASE: "runtime",
  127 │                 },
  128 │                 extendEnv: false,
  129 │                 stdin: "ignore",
  130 │                 stdout: "pipe",
  131 │                 stderr: "pipe",
  132 │               },
  133 │             ),
  134 │           );

0.73 packages/alchemy/src/Neon/Website/FrameworkSite.ts:53:3
  50 │ /** Outputs of a Neon framework or static website. */
  51 │ export interface Website {
  52 │   /** Native dev URL locally, otherwise the Function or configured custom-domain URL. */
> 53 │   url: string | Output.Output<string | undefined> | undefined;
  54 │   /** Function serving the artifact; absent during native development. */
  55 │   function: Function | undefined;
  56 │   /** Explicit or owned project reference; explicit references are preserved locally. */
  57 │   project: WebsiteScope["project"];
  58 │   /** Explicit branch reference, preserved locally without transferring ownership. */
  59 │   branch: WebsiteScope["branch"];
  60 │   /** Custom-domain registration and DNS target; absent during native development. */
  61 │   domain: CustomDomain | undefined;
  62 │ }

0.73 packages/alchemy/src/Planetscale/MySQL/MySQLMigrations.ts:123:5
  120 │ const withTemporaryMySQLPassword = <A, E, R>(
  121 │   target: MySQLMigrationTarget,
  122 │   use: (password: {
> 123 │     id: string;
  124 │     host: string;
  125 │     username: string;
  126 │     password: Redacted.Redacted<string>;
  127 │   }) => Effect.Effect<A, E, R>,

0.73 packages/alchemy/src/Prisma/App.ts:101:3
> 101 │   never,
  102 │   Providers
  103 │ > {}

0.73 packages/alchemy/src/Prisma/Internal/ArtifactUpload.ts:15:3
  12 │ const UPLOAD_ERROR_BODY_BYTES = 64 * 1024;
  13 │
  14 │ export const executeArtifactUpload = (
> 15 │   uploadUrl: string,
  16 │   artifact: Uint8Array | ArtifactFile,
  17 │   contentType: string,
  18 │ ) =>

0.73 packages/alchemy/src/Prisma/Operations.ts:245:3
  244 │ export const listWorkspaceIntegrations = (
> 245 │   workspaceId: string,
  246 │   query?: { cursor?: string | null; limit?: number },
  247 │ ) =>
  248 │   withClient((client) => client.listWorkspaceIntegrations(workspaceId, query));

0.73 packages/alchemy/src/Stripe/AccountExternalAccount.ts:221:7
  217 │   if (!isBankAccount(ea)) {
  218 │     const card: StripeCard = ea;
  219 │     return {
  220 │       id: card.id,
> 221 │       account,
  222 │       object: "card",
  223 │       last4: card.last4,
  224 │       country: card.country ?? "",
  225 │       currency: card.currency ?? undefined,
  226 │       bankName: undefined,
  227 │       routingNumber: undefined,
  228 │       accountHolderName: undefined,
  229 │       accountHolderType: undefined,
  230 │       accountType: undefined,
  231 │       defaultForCurrency: card.default_for_currency ?? false,
  232 │       status: card.status ?? undefined,
  233 │       brand: card.brand,
  234 │       funding: card.funding,
  235 │       name: card.name ?? undefined,
  236 │       fingerprint: card.fingerprint ?? undefined,
  237 │       metadata,
  238 │     };
  239 │   }

0.73 packages/alchemy/src/Stripe/CustomerTaxId.ts:70:3
  49 │ export type CustomerTaxId = Resource<
  50 │   "Stripe.CustomerTaxId",
  51 │   CustomerTaxIdProps,
  52 │   {
  53 │     /** Stripe tax ID object id (`txi_…`). */
  54 │     id: string;
  55 │     /** Id of the customer this tax ID is attached to (`cus_…`). */
  56 │     customer: string;
  57 │     /** Type of the tax ID (e.g. `eu_vat`). */
  58 │     type: TaxIdType;
  59 │     /** Value of the tax ID. */
  60 │     value: string;
  61 │     /** Two-letter ISO country code inferred from the tax ID, if known. */
  62 │     country: string | undefined;
  63 │     /** Verification status, if Stripe has attempted verification. */
  64 │     verificationStatus: TaxIdVerificationStatus | undefined;
  65 │     /** Unix timestamp when the tax ID was created. */
  66 │     created: number;
  67 │     /** Whether the tax ID exists in live mode. */
  68 │     livemode: boolean;
  69 │   },
> 70 │   never,
  71 │   Providers
  72 │ >;

0.73 packages/alchemy/src/Stripe/IssuingCard.ts:185:5
  182 │   IssuingCardProps,
  183 │   {
  184 │     /** Stripe Issuing card id (`ic_…`). */
> 185 │     id: string;
  186 │     /** Id of the cardholder this card belongs to (`ich_…`). */
  187 │     cardholder: string;

0.73 packages/alchemy/test/AWS/AppRunner/fixtures/isolated-project-service.ts:29:5
  24 │ export default class IsolatedProjectService extends AWS.AppRunner.Service<IsolatedProjectService>()(
  25 │   "AppRunnerIsolatedProjectService",
  26 │   {
  27 │     main: project.main,
  28 │     serviceName: "alchemy-test-apprunner-isolated-project",
> 29 │     port: 3000,
  30 │     instanceConfiguration: { cpu: "256", memory: "512" },
  31 │     healthCheckConfiguration: { protocol: "HTTP", path: "/health" },
  32 │     // Docker Hub's `oven/bun` image; the public.ecr.aws default mirror
  33 │     // aggressively rate-limits anonymous pulls (429) during local builds.
  34 │     docker: { base: "oven/bun:1" },
  35 │   },
  36 │   Effect.gen(function* () {
  37 │     return {
  38 │       fetch: Effect.gen(function* () {
  39 │         const request = yield* HttpServerRequest;
  40 │         const url = new URL(request.url, "http://service");
  41 │         if (url.pathname === "/health") {
  42 │           return yield* HttpServerResponse.json({ ok: true });
  43 │         }
  44 │         return HttpServerResponse.text("hello from isolated project");
  45 │       }),
  46 │     };
  47 │   }),
  48 │ ) {}

0.73 packages/alchemy/test/AWS/InternetMonitor/handler.ts:16:1
  13 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  14 │
  15 │ // A syntactically-plausible but nonexistent event id.
> 16 │ const BOGUS_EVENT_ID = "alchemy-nonexistent-internetmonitor-event-id";

0.73 packages/alchemy/test/AWS/Lambda/fixtures/microvm/orchestrator.ts:58:11
  57 │         if (request.method === "GET" && pathname === "/get") {
> 58 │           const id = url.searchParams.get("id")!;
  59 │           const vm = yield* getMicrovm({ microvmIdentifier: id });
  60 │           return yield* HttpServerResponse.json({ state: vm.state });
  61 │         }

0.73 packages/alchemy/test/AWS/Lambda/init-io-probe.ts:15:3
  13 │ class TraceConfig extends Context.Service<
  14 │   TraceConfig,
> 15 │   { trace: string; nonce: string }
  16 │ >()("InitIO.TraceConfig") {}

0.73 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:16:1
  14 │ /** Deterministic identity for the fixture's contact. */
  15 │ export const CONTACT_NAME = "alchemy-test-contact-bindings";
> 16 │ export const CONTACT_EMAIL = "sam+alchemy-test-contact-bindings@alchemy.run";

0.73 packages/alchemy/test/AWS/RePostSpace/bindings-handler.ts:13:1
  10 │ const main = path.resolve(import.meta.dirname, "bindings-handler.ts");
  11 │
  12 │ // A syntactically-valid but nonexistent IAM Identity Center accessor id.
> 13 │ const BOGUS_ACCESSOR_ID = "00000000-0000-0000-0000-000000000000";

0.73 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:381:5
> 381 │     };
  382 │   }).pipe(

0.73 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:48:13
  46 │         if (request.method === "POST" && request.url === "/posts") {
  47 │           const body = (yield* request.json) as {
> 48 │             userId: number;
  49 │             title: string;
  50 │           };
  51 │           const [post] = yield* db
  52 │             .insert(Posts)
  53 │             .values({ userId: body.userId, title: body.title })
  54 │             .returning();
  55 │           return yield* HttpServerResponse.json({ post });
  56 │         }

0.73 packages/cloudflare-runtime/src/core/bindings/d1/D1Options.shared.ts:19:3
  18 │ export interface D1ServiceProps {
> 19 │   readonly databaseId: string;
  20 │ }
  21 │
  22 │ export const SERVICE_D1 = "d1";

0.73 packages/cloudflare-runtime/src/core/globals/Globals.ts:52:3
  49 │   workerName: string,
  50 │   expression: string,
  51 │   cron: Cron.Cron,
> 52 │   port: number,
  53 │ ) => {

0.73 packages/cloudflare-runtime/src/internal/workers-shared/shared/sentry.ts:14:3
  11 │   clientSecret: string,
  12 │   coloMetadata?: ColoMetadata,
  13 │   versionMetadata?: WorkerVersionMetadata,
> 14 │   accountId?: number,
  15 │   scriptId?: number,
  16 │ ): Toucan | undefined {

0.73 packages/cloudflare-runtime/src/internal/workflows-shared/engine.ts:441:3
  439 │   isRunning: boolean = false;
  440 │   accountId: number | undefined;
> 441 │   instanceId: string | undefined;
  442 │   workflowName: string | undefined;
  443 │   timeoutHandler: GracePeriodSemaphore;
  444 │   priorityQueue: TimePriorityQueue | undefined;

0.73 packages/frontend-frameworks/src/core/DeployTarget.ts:181:3
  179 │ export interface DeployTarget<Config = unknown> {
  180 │   /** Stable platform identifier (e.g. "cloudflare", "aws"). */
> 181 │   readonly platform: string;
  182 │   /** Opaque target configuration. Never inspected by framework-core. */
  183 │   readonly config: Config;
  184 │   /** The user's own server entry wrapping the framework's emitted entry, when configured. */
  185 │   readonly entry?: DeployTargetEntry | undefined;
  186 │   readonly bundle?: DeployTargetBundleOptions | undefined;
  187 │   readonly build?:
  188 │     | ((
  189 │         context: DeployTargetBuildContext,
  190 │       ) => Effect.Effect<BuildOutput, DeployTargetError, DeployTargetServices>)
  191 │     | undefined;
  192 │   readonly finish?:
  193 │     | ((
  194 │         output: BuildOutput,
  195 │         context: DeployTargetFinishContext,
  196 │       ) => Effect.Effect<BuildOutput, DeployTargetError, DeployTargetServices>)
  197 │     | undefined;
  198 │   readonly serve?:
  199 │     | ((
  200 │         context: DeployTargetServeContext,
  201 │       ) => Effect.Effect<
  202 │         DeployTargetServer,
  203 │         DeployTargetError,
  204 │         Scope.Scope | DeployTargetServices
  205 │       >)
  206 │     | undefined;
  207 │ }

0.73 packages/frontend-frameworks/src/nextjs/DevServer.ts:63:3
  57 │ export interface DevServerOptions {
  58 │   /** The Next.js project root (the directory containing `next.config.*`). */
  59 │   readonly root: string;
  60 │   /** @default "localhost" */
  61 │   readonly hostname?: string | undefined;
  62 │   /** Port to listen on. Defaults to an ephemeral port. */
> 63 │   readonly port?: number | undefined;
  64 │   /**
  65 │    * Bindings to expose through `getCloudflareContext().env` — the same hook
  66 │    * shapes `Runtime.start` accepts (`Text.local`, `KvNamespace.local`, …).
  67 │    */
  68 │   readonly bindings?: BindingHooks | undefined;
  69 │   /** Compatibility date for the binding-proxy worker. */
  70 │   readonly compatibilityDate?: string | undefined;
  71 │   /** Compatibility flags for the binding-proxy worker. */
  72 │   readonly compatibilityFlags?: ReadonlyArray<string> | undefined;
  73 │   /** Name of the binding-proxy workerd service. @default "nextjs-dev-platform-proxy" */
  74 │   readonly proxyName?: string | undefined;
  75 │   readonly logging?: WorkerdLogging | undefined;
  76 │ }

0.73 packages/frontend-frameworks/src/vocs/Vocs.ts:74:3
  72 │ /** The shape waku's `unstable_startPreviewServer` expects the global to produce. */
  73 │ interface WakuPreviewServer {
> 74 │   readonly baseUrl: string;
  75 │   readonly middlewares: {
  76 │     readonly use: (
  77 │       fn: (req: unknown, res: unknown, next: (err?: unknown) => void) => void,
  78 │     ) => void;
  79 │   };
  80 │   readonly close: () => Promise<void>;
  81 │ }

0.72 packages/alchemy/src/AI/Agent.ts:16:3
  15 │ export interface Agent<
> 16 │   Name extends string = string,
  17 │   Refs extends any[] = any[],
  18 │   Service = AgentService,
  19 │   Req = never,
  20 │ > {
  21 │   [Symbol.iterator](): Effect.EffectIterator<
  22 │     Effect.Effect<Service, never, Req>
  23 │   >;
  24 │   "~alchemy/Kind": "Agent";
  25 │   name: Name;
  26 │   refs: Refs;
  27 │   req: Services<Refs>;
  28 │   new (): AgentService;
  29 │ }

0.72 packages/alchemy/src/AWS/ACM/AccountConfiguration.ts:81:1
  78 │ /** The AWS account default for `DaysBeforeExpiry`. */
  79 │ const DEFAULT_DAYS_BEFORE_EXPIRY = 45;
  80 │
> 81 │ const ACM_REGION = "us-east-1" as const;

0.72 packages/alchemy/src/AWS/AMP/ScraperLoggingConfiguration.ts:28:3
  22 │ export interface ScraperLoggingConfigurationProps {
  23 │   /**
  24 │    * Id of the AMP scraper whose component logs are shipped. A scraper has
  25 │    * at most one logging configuration. Changing the scraper replaces the
  26 │    * configuration.
  27 │    */
> 28 │   scraperId: string;
  29 │   /**
  30 │    * ARN of the CloudWatch Logs log group that receives the scraper's
  31 │    * component logs. AMP expects the ARN with a trailing `:*` — one is
  32 │    * appended automatically when missing.
  33 │    */
  34 │   logGroupArn: string;
  35 │   /**
  36 │    * Per-component logging configuration. If omitted, the service default
  37 │    * component set is logged.
  38 │    */
  39 │   components?: ScraperComponentConfig[];
  40 │ }

0.72 packages/alchemy/src/AWS/ApiGatewayV2/common.ts:31:3
  29 │ export const executeApiArn = (
  30 │   region: string,
> 31 │   accountId: string,
  32 │   apiId: string,
  33 │   suffix = "/*",
  34 │ ) => `arn:aws:execute-api:${region}:${accountId}:${apiId}${suffix}`;

0.72 packages/alchemy/src/AWS/AppConfig/ExtensionAssociation.ts:161:11
  152 │       const toAttrs = Effect.fn(function* (
  153 │         association: appconfig.ExtensionAssociation,
  154 │       ) {
  155 │         const { accountId, region } = yield* AWSEnvironment.current;
  156 │         return {
  157 │           extensionAssociationId: association.Id!,
  158 │           extensionAssociationArn:
  159 │             association.Arn ??
  160 │             extensionAssociationArn(region, accountId, association.Id!),
> 161 │           extensionArn: association.ExtensionArn!,
  162 │           resourceArn: association.ResourceArn!,
  163 │         };
  164 │       });

0.72 packages/alchemy/src/AWS/AppRunner/Service.ts:61:3
> 61 │   imageIdentifier: string;

0.72 packages/alchemy/src/AWS/Athena/NamedQuery.ts:43:5
  39 │   {
  40 │     /**
  41 │      * Unique ID of the named query.
  42 │      */
> 43 │     namedQueryId: string;
  44 │     /**
  45 │      * Name of the saved query.
  46 │      */
  47 │     name: string;
  48 │     /**
  49 │      * The saved SQL statement.
  50 │      */
  51 │     queryString: string;
  52 │     /**
  53 │      * Database the query runs against.
  54 │      */
  55 │     database: string;
  56 │     /**
  57 │      * Description of the query.
  58 │      */
  59 │     description: string | undefined;
  60 │     /**
  61 │      * Workgroup the query is saved in.
  62 │      */
  63 │     workGroup: string;
  64 │   },

0.72 packages/alchemy/src/AWS/Bedrock/Converse.ts:19:3
  10 │ export interface ConverseRequest extends Omit<
  11 │   bedrock.ConverseRequest,
  12 │   "modelId"
  13 │ > {
  14 │   /**
  15 │    * The model to run inference on for this call. Must be one of the model
  16 │    * ids the binding was created with (IAM is scoped to exactly those).
  17 │    * @default the first bound model id
  18 │    */
> 19 │   modelId?: string;
  20 │ }

0.72 packages/alchemy/src/AWS/Chatbot/Association.ts:30:3
  22 │ export interface AssociationProps {
  23 │   /**
  24 │    * ARN of the Slack or Microsoft Teams channel configuration to associate
  25 │    * the resource with (e.g.
  26 │    * `arn:aws:chatbot::123456789012:chat-configuration/slack-channel/alerts`).
  27 │    *
  28 │    * Changing the configuration replaces the association.
  29 │    */
> 30 │   chatConfiguration: string;
  31 │   /**
  32 │    * ARN of the resource to associate with the channel configuration — a
  33 │    * Chatbot custom action ARN (e.g.
  34 │    * `arn:aws:chatbot::123456789012:custom-action/describe-alarm`).
  35 │    *
  36 │    * Changing the resource replaces the association.
  37 │    */
  38 │   resource: string;
  39 │ }

0.72 packages/alchemy/src/AWS/CloudFront/KeyGroup.ts:36:5
  28 │ export interface KeyGroup extends Resource<
  29 │   "AWS.CloudFront.KeyGroup",
  30 │   KeyGroupProps,
  31 │   {
  32 │     /**
  33 │      * CloudFront-assigned key group identifier. Used by Distributions in
  34 │      * `TrustedKeyGroups` to authorize signed URLs/cookies.
  35 │      */
> 36 │     keyGroupId: string;
  37 │     /**
  38 │      * Name of the key group.
  39 │      */
  40 │     name: string;
  41 │     /**
  42 │      * Public key IDs that belong to the group.
  43 │      */
  44 │     items: string[];
  45 │     /**
  46 │      * Most recent entity tag for update/delete operations.
  47 │      */
  48 │     etag: string | undefined;
  49 │     /**
  50 │      * Current comment on the group.
  51 │      */
  52 │     comment: string | undefined;
  53 │   },
  54 │   never,
  55 │   Providers
  56 │ > {}

0.72 packages/alchemy/src/AWS/CloudFront/KeyValueStore.ts:29:5
  25 │   {
  26 │     /**
  27 │      * KeyValueStore ID.
  28 │      */
> 29 │     keyValueStoreId: string;
  30 │     /**
  31 │      * Store ARN.
  32 │      */
  33 │     keyValueStoreArn: string;
  34 │     /**
  35 │      * Store name.
  36 │      */
  37 │     keyValueStoreName: string;
  38 │     /**
  39 │      * Current comment.
  40 │      */
  41 │     comment: string;
  42 │     /**
  43 │      * Current status.
  44 │      */
  45 │     status: string;
  46 │     /**
  47 │      * Last modified time.
  48 │      */
  49 │     lastModifiedTime: Date | undefined;
  50 │     /**
  51 │      * Latest entity tag for update/delete operations.
  52 │      */
  53 │     etag: string | undefined;
  54 │   },

0.72 packages/alchemy/src/AWS/Config/AggregationAuthorization.ts:22:3
  16 │ export interface AggregationAuthorizationProps {
  17 │   /**
  18 │    * The 12-digit account ID of the aggregator account that is authorized to
  19 │    * collect AWS Config data from this account. Changing it replaces the
  20 │    * authorization.
  21 │    */
> 22 │   authorizedAccountId: string;
  23 │   /**
  24 │    * The region of the aggregator account that is authorized to collect AWS
  25 │    * Config data from this account. Changing it replaces the authorization.
  26 │    */
  27 │   authorizedAwsRegion: string;
  28 │   /**
  29 │    * Tags to apply to the authorization. Merged with internal Alchemy tags.
  30 │    */
  31 │   tags?: Record<string, string>;
  32 │ }

0.72 packages/alchemy/src/AWS/ControlTower/internal.ts:34:3
  32 │ export const syncControlTowerTags = Effect.fn(function* (
  33 │   resourceArn: string,
> 34 │   id: string,
  35 │   userTags: Record<string, string> | undefined,
  36 │ ) {
  37 │   const internalTags = yield* createInternalTags(id);
  38 │   const observed = yield* observeControlTowerTags(resourceArn);
  39 │   const desired: Record<string, string> = { ...userTags, ...internalTags };
  40 │   const { upsert, removed } = diffTags(observed, desired);
  41 │   if (upsert.length > 0) {
  42 │     yield* controltower.tagResource({
  43 │       resourceArn,
  44 │       tags: Object.fromEntries(upsert.map((t) => [t.Key, t.Value])),
  45 │     });
  46 │   }
  47 │   if (removed.length > 0) {
  48 │     yield* controltower.untagResource({ resourceArn, tagKeys: removed });
  49 │   }
  50 │ });

0.72 packages/alchemy/src/AWS/DataExchange/EventAction.ts:235:11
  234 │         reconcile: Effect.fn(function* ({ id, news, output, session }) {
> 235 │           const dataSetId = news.dataSetId as string;
  236 │           const desiredAction = toWireAction(news);
  237 │           const internalTags = yield* createInternalTags(id);
  238 │           const desiredTags = { ...news.tags, ...internalTags };

0.72 packages/alchemy/src/AWS/DSQL/ConnectHttp.ts:13:1
  10 │ import type { Cluster } from "./Cluster.ts";
  11 │ import { Connect, connectEnvPrefix, type ConnectOptions } from "./Connect.ts";
  12 │
> 13 │ const DSQL_PORT = 5432;

0.72 packages/alchemy/src/AWS/EKS/KubernetesAdapter.ts:81:7
  77 │   interface IdentityStateRegistry {
  78 │     /** EKS Pod Identity: generated IAM role + association. */
  79 │     "aws-pod-identity": {
  80 │       /** The ARN of the IAM role pods assume via Pod Identity. */
> 81 │       roleArn: string;
  82 │       /** The name of the IAM role pods assume via Pod Identity. */
  83 │       roleName: string;
  84 │       /** The ARN of the Pod Identity association binding the role. */
  85 │       associationArn: string;
  86 │       /** The ID of the Pod Identity association binding the role. */
  87 │       associationId: string;
  88 │     };
  89 │   }

0.72 packages/alchemy/src/AWS/EMR/Cluster.ts:187:5
  182 │ export interface Cluster extends Resource<
  183 │   "AWS.EMR.Cluster",
  184 │   ClusterProps,
  185 │   {
  186 │     /** The ID of the cluster (e.g. `j-2AXXXXXXGAPLF`). */
> 187 │     clusterId: string;
  188 │     /** The ARN of the cluster. */
  189 │     clusterArn: string;
  190 │     /** The name of the cluster. */
  191 │     clusterName: string;
  192 │     /** The cluster state (e.g. `STARTING`, `RUNNING`, `WAITING`). */
  193 │     state: string;
  194 │     /** The public DNS name of the primary node, when reachable. */
  195 │     masterPublicDnsName: string | undefined;
  196 │     /** The tags applied to the cluster. */
  197 │     tags: Record<string, string>;
  198 │   },
  199 │   never,
  200 │   Providers
  201 │ > {}

0.72 packages/alchemy/src/AWS/EMR/Studio.ts:106:5
  101 │ export interface Studio extends Resource<
  102 │   "AWS.EMR.Studio",
  103 │   StudioProps,
  104 │   {
  105 │     /** The ID of the Studio (e.g. `es-0123456789ABCDEFGHIJKLMNOP`). */
> 106 │     studioId: string;
  107 │     /** The ARN of the Studio. */
  108 │     studioArn: string;
  109 │     /** The name of the Studio. */
  110 │     studioName: string;
  111 │     /** The unique access URL of the Studio. */
  112 │     url: string | undefined;
  113 │     /** The tags applied to the Studio. */
  114 │     tags: Record<string, string>;
  115 │   },
  116 │   never,
  117 │   Providers
  118 │ > {}

0.72 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:283:3
  266 │ export interface ExperimentTemplate extends Resource<
  267 │   "AWS.FIS.ExperimentTemplate",
  268 │   ExperimentTemplateProps,
  269 │   {
  270 │     /**
  271 │      * The generated ID of the experiment template, e.g. `EXT1a2b3c4d`.
  272 │      */
  273 │     id: string;
  274 │     /**
  275 │      * The ARN of the experiment template.
  276 │      */
  277 │     arn: string;
  278 │     /**
  279 │      * The ARN of the IAM role the experiment runs as.
  280 │      */
  281 │     roleArn: string;
  282 │   },
> 283 │   never,
  284 │   Providers
  285 │ > {}

0.72 packages/alchemy/src/AWS/Grafana/internal.ts:30:1
  29 │ /** Read the observed tags of a Grafana resource by ARN (best-effort). */
> 30 │ export const readGrafanaTags = Effect.fn(function* (arn: string) {
  31 │   const response = yield* grafana
  32 │     .listTagsForResource({ resourceArn: arn })
  33 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  34 │   return toTagRecord(response?.tags);
  35 │ });

0.72 packages/alchemy/src/AWS/Inspector2/CisScanConfiguration.ts:76:3
  63 │ export interface CisScanConfiguration extends Resource<
  64 │   "AWS.Inspector2.CisScanConfiguration",
  65 │   CisScanConfigurationProps,
  66 │   {
  67 │     /** ARN of the CIS scan configuration (its identity). */
  68 │     scanConfigurationArn: string;
  69 │     /** Name of the CIS scan configuration. */
  70 │     scanName: string;
  71 │     /** CIS Benchmark level the scan checks against. */
  72 │     securityLevel: CisSecurityLevel;
  73 │     /** Account that owns the scan configuration. */
  74 │     ownerId: string | undefined;
  75 │   },
> 76 │   never,
  77 │   Providers
  78 │ > {}

0.72 packages/alchemy/src/AWS/IoT/internal.ts:39:3
  37 │ export const syncIotTags = Effect.fn(function* (
  38 │   resourceArn: string,
> 39 │   id: string,
  40 │   userTags: Record<string, string> | undefined,
  41 │ ) {
  42 │   const internalTags = yield* createInternalTags(id);
  43 │   const desired = { ...userTags, ...internalTags };
  44 │   const observed = yield* readIotTags(resourceArn);
  45 │   const { upsert, removed } = diffTags(observed, desired);
  46 │   if (upsert.length > 0) {
  47 │     yield* iot.tagResource({
  48 │       resourceArn,
  49 │       tags: upsert.map((t) => ({ Key: t.Key, Value: t.Value })),
  50 │     });
  51 │   }
  52 │   if (removed.length > 0) {
  53 │     yield* iot.untagResource({ resourceArn, tagKeys: removed });
  54 │   }
  55 │ });

0.72 packages/alchemy/src/AWS/IoTManagedIntegrations/ManagedThing.ts:86:5
   81 │ export interface ManagedThing extends Resource<
   82 │   "AWS.IoTManagedIntegrations.ManagedThing",
   83 │   ManagedThingProps,
   84 │   {
   85 │     /** Service-generated identifier of the managed thing. */
>  86 │     managedThingId: string;
   87 │     /** ARN of the managed thing. */
   88 │     managedThingArn: string;
   89 │     /** Display name of the managed thing. */
   90 │     managedThingName: string;
   91 │     /** Role of the device (CONTROLLER or DEVICE). */
   92 │     role: mi.Role;
   93 │     /** Provisioning status of the managed thing. */
   94 │     provisioningStatus: mi.ProvisioningStatus | undefined;
   95 │     /** Tags applied to the managed thing (user + internal). */
   96 │     tags: Record<string, string>;
   97 │   },
   98 │   never,
   99 │   Providers
  100 │ > {}

0.72 packages/alchemy/src/AWS/LexV2/Bot.ts:81:1
  62 │ export interface Bot extends Resource<
  63 │   "AWS.LexV2.Bot",
  64 │   BotProps,
  65 │   {
  66 │     /** Unique identifier assigned to the bot. */
  67 │     botId: string;
  68 │     /** Name of the bot. */
  69 │     botName: string;
  70 │     /** ARN of the bot. */
  71 │     botArn: string;
  72 │     /** Current status of the bot (e.g. `Available`). */
  73 │     botStatus: string;
  74 │     /** ARN of the IAM role the bot assumes. */
  75 │     roleArn: string;
  76 │     /** Tags currently associated with the bot. */
  77 │     tags: Record<string, string>;
  78 │   },
  79 │   never,
  80 │   Providers
> 81 │ > {}

0.72 packages/alchemy/src/AWS/MailManager/TrafficPolicy.ts:61:3
  50 │ export interface TrafficPolicy extends Resource<
  51 │   "AWS.MailManager.TrafficPolicy",
  52 │   TrafficPolicyProps,
  53 │   {
  54 │     /** Server-assigned ID of the traffic policy. */
  55 │     trafficPolicyId: string;
  56 │     /** ARN of the traffic policy. */
  57 │     trafficPolicyArn: string;
  58 │     /** Name of the traffic policy. */
  59 │     trafficPolicyName: string;
  60 │   },
> 61 │   never,
  62 │   Providers
  63 │ > {}

0.72 packages/alchemy/src/AWS/MediaConnect/Flow.ts:110:2
  107 │  *     Name: "primary",
  108 │  *     Protocol: "rtp",
  109 │  *     WhitelistCidr: "10.24.34.0/23",
> 110 │  *     IngestPort: 5000,

0.72 packages/alchemy/src/AWS/Notifications/internal.ts:41:3
  39 │ export const syncNotificationsTags = Effect.fn(function* (
  40 │   arn: string,
> 41 │   id: string,
  42 │   userTags: Record<string, string> | undefined,
  43 │ ) {
  44 │   const internalTags = yield* createInternalTags(id);
  45 │   const desired = { ...userTags, ...internalTags };
  46 │   const observed = yield* readNotificationsTags(arn);
  47 │   const { upsert, removed } = diffTags(observed, desired);
  48 │   if (upsert.length > 0) {
  49 │     yield* pinNotificationsRegion(
  50 │       notifications.tagResource({
  51 │         arn,
  52 │         tags: Object.fromEntries(upsert.map((t) => [t.Key, t.Value])),
  53 │       }),
  54 │     );
  55 │   }
  56 │   if (removed.length > 0) {
  57 │     yield* pinNotificationsRegion(
  58 │       notifications.untagResource({ arn, tagKeys: removed }),
  59 │     );
  60 │   }
  61 │ });

0.72 packages/alchemy/src/AWS/Omics/RunStatusEventSource.ts:17:3
  15 │ export interface OmicsRunEventDetail {
  16 │   /** The run's id. */
> 17 │   id?: string;
  18 │   /** ARN of the run. */
  19 │   arn?: string;
  20 │   /** The run status: `PENDING`, `STARTING`, `RUNNING`, `STOPPING`, `COMPLETED`, `DELETED`, `CANCELLED`, or `FAILED`. */
  21 │   status?: string;
  22 │   /** The id of the workflow the run executes. */
  23 │   workflowId?: string;
  24 │   /** The id of the run group the run belongs to, if any. */
  25 │   runGroupId?: string;
  26 │   /** A human-readable status message (populated on `FAILED`). */
  27 │   statusMessage?: string;
  28 │   /** Additional event fields (the schema grows over time). */
  29 │   [key: string]: unknown;
  30 │ }

0.72 packages/alchemy/src/AWS/OpenSearchServerless/SecurityConfig.ts:205:9
  202 │       const toName = (configId: string) => configId.split("/").at(-1)!;
  203 │
  204 │       const toAttributes = (detail: aoss.SecurityConfigDetail) => ({
> 205 │         configId: detail.id!,
  206 │         configName: toName(detail.id!),
  207 │         type: detail.type!,
  208 │         configVersion: detail.configVersion!,
  209 │         description: detail.description,
  210 │       });

0.72 packages/alchemy/src/AWS/Route53Profiles/ProfileAssociation.ts:35:5
  30 │ export interface ProfileAssociation extends Resource<
  31 │   "AWS.Route53Profiles.ProfileAssociation",
  32 │   ProfileAssociationProps,
  33 │   {
  34 │     /** ID of the association (e.g. `rpassoc-...`). */
> 35 │     profileAssociationId: string;
  36 │     /** ID of the associated Profile. */
  37 │     profileId: string;
  38 │     /** ID of the associated VPC. */
  39 │     resourceId: string;
  40 │     /** Name recorded on the association. */
  41 │     name: string;
  42 │     /**
  43 │      * Status of the association at the end of the deploy. Associations
  44 │      * complete asynchronously (typically within a couple of minutes), so
  45 │      * this is usually `CREATING`; the Profile's DNS settings take effect in
  46 │      * the VPC once the association reaches `COMPLETE`.
  47 │      */
  48 │     status: profiles.ProfileStatus;
  49 │   },
  50 │   never,
  51 │   Providers
  52 │ > {}

0.72 packages/alchemy/src/AWS/SecurityHub/ActionTarget.ts:39:5
  32 │ export interface ActionTarget extends Resource<
  33 │   "AWS.SecurityHub.ActionTarget",
  34 │   ActionTargetProps,
  35 │   {
  36 │     /** ARN of the action target (`…:action/custom/{id}`). */
  37 │     actionTargetArn: string;
  38 │     /** ID of the custom action (final ARN segment). */
> 39 │     id: string;
  40 │     /** Display name of the custom action. */
  41 │     name: string;
  42 │     /** Description of the custom action. */
  43 │     description: string;
  44 │   },
  45 │   never,
  46 │   Providers
  47 │ > {}

0.72 packages/alchemy/src/AWS/ServiceCatalog/Product.ts:103:5
   98 │ export interface Product extends Resource<
   99 │   "AWS.ServiceCatalog.Product",
  100 │   ProductProps,
  101 │   {
  102 │     /** The auto-generated product ID (e.g. `prod-abc123`). */
> 103 │     productId: string;
  104 │     /** The ARN of the product. */
  105 │     productArn: string;
  106 │     /** The name of the product. */
  107 │     productName: string;
  108 │     /** The ID of the provisioning artifact created with the product. */
  109 │     provisioningArtifactId: string;
  110 │   },
  111 │   never,
  112 │   Providers
  113 │ > {}

0.72 packages/alchemy/src/AWS/Shield/Protection.ts:167:3
  163 │ const buildAttrs = (
  164 │   protection: shield.Protection,
  165 │   tags: Record<string, string>,
  166 │ ) => ({
> 167 │   protectionId: protection.Id!,
  168 │   protectionArn: protection.ProtectionArn!,
  169 │   name: protection.Name!,
  170 │   resourceArn: protection.ResourceArn!,
  171 │   healthCheckIds: [...(protection.HealthCheckIds ?? [])],
  172 │   applicationLayerAutomaticResponse: observedAlarAction(protection),
  173 │   tags,
  174 │ });

0.72 packages/alchemy/src/AWS/Transfer/Server.ts:230:7
  228 │       // Servers transition through STARTING before ONLINE; updateServer and
  229 │       // deleteServer require a settled state. Budget ~7 minutes (10s x 42).
> 230 │       const waitUntilSettled = Effect.fn(function* (serverId: string) {
  231 │         const settlePolicy = Schedule.max([
  232 │           Schedule.fixed("10 seconds"),
  233 │           Schedule.recurs(42),
  234 │         ]);
  235 │         return yield* describe(serverId).pipe(
  236 │           Effect.flatMap((server) => {
  237 │             if (
  238 │               server !== undefined &&
  239 │               (server.State === "STARTING" || server.State === "STOPPING")
  240 │             ) {
  241 │               return Effect.fail(
  242 │                 new Error(
  243 │                   `Transfer server '${serverId}' still settling (state: ${server.State})`,
  244 │                 ),
  245 │               );
  246 │             }
  247 │             return Effect.succeed(server);
  248 │           }),
  249 │           Effect.retry({ schedule: settlePolicy }),
  250 │         );
  251 │       });

0.72 packages/alchemy/src/AWS/VpcLattice/AuthPolicy.ts:18:3
  13 │ export interface AuthPolicyProps {
  14 │   /**
  15 │    * The ID or ARN of the service network or service the auth policy applies
  16 │    * to. Immutable — changing it replaces the resource.
  17 │    */
> 18 │   resourceIdentifier: string;
  19 │   /**
  20 │    * The IAM auth policy controlling access to the service network or service,
  21 │    * either as a structured {@link PolicyDocument} or a raw JSON string
  22 │    * (escape hatch).
  23 │    */
  24 │   policy: PolicyDocument | string;
  25 │ }

0.72 packages/alchemy/src/AWS/VpcLattice/ServiceNetwork.ts:221:9
  220 │       const deleteServiceAssociations = Effect.fn(function* (
> 221 │         serviceNetworkId: string,
  222 │         ownerTags: Record<string, string>,
  223 │         force: boolean,
  224 │       ) {

0.72 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkServiceAssociation.ts:71:3
> 71 │   never,
  72 │   Providers
  73 │ > {}

0.72 packages/alchemy/src/Cloudflare/AI/Model.ts:16:3
  14 │ export interface ModelAttributes {
  15 │   /** Account used to validate and subscribe to the model. */
> 16 │   accountId: string;
  17 │   /** Cloudflare-managed model name. */
  18 │   modelName: string;
  19 │ }

0.72 packages/alchemy/src/Cloudflare/CloudflareEnvironment.ts:16:1
  14 │ export { CloudflareEnvironment } from "./CloudflareEnvironmentService.ts";
  15 │
> 16 │ const CLOUDFLARE_ACCOUNT_ID = Config.String("CLOUDFLARE_ACCOUNT_ID");

0.72 packages/alchemy/src/Cloudflare/ContentScanning/Expression.ts:261:3
  260 │ const findExpression = (
> 261 │   zoneId: string,
  262 │   predicate: (e: ObservedExpression) => boolean,
  263 │ ) =>
  264 │   contentScanning.listPayloads
  265 │     .items({ zoneId })
  266 │     .pipe(
  267 │       Stream.filter(predicate),
  268 │       Stream.runHead,
  269 │       Effect.map(Option.getOrUndefined),
  270 │     );

0.72 packages/alchemy/src/Cloudflare/WaitingRoom/Settings.ts:21:3
  15 │ export type SettingsProps = {
  16 │   /**
  17 │    * Zone whose waiting room settings are managed. Stable — changing the
  18 │    * zone triggers a replacement (the old zone's settings are restored to
  19 │    * the value they had before Alchemy managed them).
  20 │    */
> 21 │   zoneId: string;
  22 │   /**
  23 │    * Whether to allow verified search engine crawlers to bypass all waiting
  24 │    * rooms on this zone. Enabling the bypass requires the Waiting Room
  25 │    * Advanced subscription. Mutable.
  26 │    * @default false
  27 │    */
  28 │   searchEngineCrawlerBypass?: boolean;
  29 │ };

0.72 packages/alchemy/src/Cloudflare/Workers/Subdomain.ts:28:3
  26 │ export type SubdomainAttributes = {
  27 │   /** The Cloudflare account the subdomain belongs to. */
> 28 │   accountId: string;
  29 │   /** The account's current `workers.dev` subdomain name. */
  30 │   subdomain: string;
  31 │   /**
  32 │    * The subdomain name the account had before Alchemy first managed this
  33 │    * singleton, or `undefined` if the account had no subdomain registered.
  34 │    * Restored on destroy (or the subdomain is removed entirely when there
  35 │    * was none).
  36 │    */
  37 │   initialSubdomain: string | undefined;
  38 │ };

0.72 packages/alchemy/src/Docker/Network.ts:46:5
  41 │ export interface Network extends Resource<
  42 │   "Docker.Network",
  43 │   NetworkProps,
  44 │   {
  45 │     /** Docker network ID. */
> 46 │     id: string;
  47 │     /** Docker network name. */
  48 │     name: string;
  49 │     /** Network driver. */
  50 │     driver: string;
  51 │     /** Whether IPv6 is enabled. */
  52 │     enableIPv6: boolean;
  53 │     /** Labels reported by Docker. */
  54 │     labels: Record<string, string>;
  55 │     /** Creation timestamp in milliseconds since epoch. */
  56 │     createdAt: number;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ > {}

0.72 packages/alchemy/src/Fly/Environment.ts:23:3
  22 │ export type FlyEnvironmentShape = Config & {
> 23 │   readonly orgSlug: string;
  24 │ };

0.72 packages/alchemy/src/Git/Protocol/TreeDiff.ts:403:7
  402 │     const build = (
> 403 │       baseOid: Oid | undefined,
  404 │       children: Map<string, ChangeNode>,

0.72 packages/alchemy/src/Git/RegistryD1.ts:161:13
  158 │           return {
  159 │             owner,
  160 │             name,
> 161 │             repoId,
  162 │             defaultBranch: "main",
  163 │             readOnly: false,
  164 │             public: input.public === true,
  165 │             status: "ready",
  166 │             description: input.description ?? null,
  167 │             forkOf: input.forkOf ?? null,
  168 │             forkCount: 0,
  169 │             createdAt,
  170 │             deletedAt: null,
  171 │           } satisfies RegistryEntry;

0.72 packages/alchemy/src/GitHub/Comment.ts:59:5
  52 │ export interface Comment extends Resource<
  53 │   "GitHub.Comment",
  54 │   CommentProps,
  55 │   {
  56 │     /**
  57 │      * The numeric ID of the comment in GitHub.
  58 │      */
> 59 │     commentId: number;
  60 │
  61 │     /**
  62 │      * URL to view the comment in a browser.
  63 │      */
  64 │     htmlUrl: string;
  65 │
  66 │     /**
  67 │      * ISO-8601 timestamp of the last update.
  68 │      */
  69 │     updatedAt: string;
  70 │   },
  71 │   never,
  72 │   GitHub.Providers
  73 │ > {}

0.72 packages/alchemy/src/GitHub/WikiPage.ts:21:3
  18 │   /**
  19 │    * Repository owner (user or organization).
  20 │    */
> 21 │   owner: string;

0.72 packages/alchemy/src/Hetzner/ReadDnsHttp.ts:20:3
  17 │ /** Build the read-only client over an injectable auth and zone id. */
  18 │ export const dnsReadClient = (
  19 │   auth: DnsAuth,
> 20 │   zoneId: Effect.Effect<number>,
  21 │ ): ReadDnsClient => {
  22 │   const authorize = auth.authorize;
  23 │   return {
  24 │     getRecordSet: Effect.fn("Hetzner.DNS.getRecordSet")(function* (name, type) {
  25 │       return yield* authorize(
  26 │         zoneRrsets.getZoneRrset({
  27 │           id_or_name: String(yield* zoneId),
  28 │           rr_name: name,
  29 │           rr_type: type,
  30 │         }),
  31 │       );
  32 │     }),
  33 │     listRecordSets: Effect.fn("Hetzner.DNS.listRecordSets")(
  34 │       function* (request) {
  35 │         return yield* authorize(
  36 │           zoneRrsets.listZoneRrsets({
  37 │             id_or_name: String(yield* zoneId),
  38 │             ...request,
  39 │           }),
  40 │         );
  41 │       },
  42 │     ),
  43 │   };
  44 │ };

0.72 packages/alchemy/src/Hetzner/Website/StaticSite.ts:224:11
  216 │     if (isLocal) {
  217 │       const bun = yield* Effect.sync(() => process.execPath);
  218 │       const dev = yield* Command.Dev("Dev", {
  219 │         command: `${bun} ${servePath}`,
  220 │         cwd: path.dirname(servePath),
  221 │         env: {
  222 │           ...unwrapEnv(props.env),
  223 │           ALCHEMY_BUILD_HASH: build.hash.output as unknown as string,
> 224 │           PORT: "0",
  225 │           HOST: "127.0.0.1",
  226 │         },
  227 │       }).pipe(Namespace.push(id));
  228 │       return {
  229 │         url: dev.url,
  230 │         server: undefined,
  231 │         service: undefined,
  232 │       } satisfies Website;
  233 │     }

0.72 packages/alchemy/src/Neon/InvokeFunctionHttp.ts:51:9
  50 │       return {
> 51 │         url,

0.72 packages/alchemy/src/Prisma/Bucket.ts:66:5
  50 │ export interface Bucket extends Resource<
  51 │   "Prisma.Bucket",
  52 │   BucketProps,
  53 │   {
  54 │     /**
  55 │      * Prisma bucket ID.
  56 │      */
  57 │     bucketId: string;
  58 │     /**
  59 │      * Bucket display name. Not the provider-side S3 bucket name; S3 clients
  60 │      * must use the `bucketName` attribute of `Prisma.BucketAccessKey`.
  61 │      */
  62 │     name: string;
  63 │     /**
  64 │      * Project ID that owns the bucket.
  65 │      */
> 66 │     projectId: string;
  67 │     /**
  68 │      * ISO timestamp when the bucket was created.
  69 │      */
  70 │     createdAt: string;
  71 │   },
  72 │   never,
  73 │   Providers
  74 │ > {}

0.72 packages/alchemy/src/Prisma/BucketAccessKey.ts:83:5
  60 │   {
  61 │     /**
  62 │      * Prisma bucket key ID.
  63 │      */
  64 │     bucketAccessKeyId: string;
  65 │     /**
  66 │      * Bucket ID the key belongs to, persisted so deletion can address both
  67 │      * path parameters.
  68 │      */
  69 │     bucketId: string;
  70 │     /**
  71 │      * S3 access key ID.
  72 │      */
  73 │     accessKeyId: string;
  74 │     /**
  75 │      * S3 secret access key, redacted in state. Prisma returns it exactly
  76 │      * once at creation and never again, so the persisted state is the
  77 │      * authoritative copy.
  78 │      */
  79 │     secretAccessKey: Redacted.Redacted<string>;
  80 │     /**
  81 │      * S3-compatible endpoint URL for the bucket's region.
  82 │      */
> 83 │     endpoint: string;
  84 │     /**
  85 │      * Provider-side S3 bucket name (e.g. `user-<id>`). S3 clients must use
  86 │      * this as the bucket name, not the display name chosen on the bucket.
  87 │      */
  88 │     bucketName: string;
  89 │   },

0.72 packages/alchemy/src/Prisma/Client.ts:321:5
  320 │   deleteDeployment(
> 321 │     id: string,
  322 │   ): Effect.Effect<void, PrismaApiError | PrismaApiDecodeError>;

0.72 packages/alchemy/src/Railway/BucketBinding.ts:34:3
  33 │ export interface RailwayS3Scope {
> 34 │   bucketName: string;
  35 │   accessKeyId: string;
  36 │   secretAccessKey: string;
  37 │   endpoint: string;
  38 │   region: RegionName;
  39 │ }

0.72 packages/alchemy/src/Stripe/ProductFeature.ts:42:5
  37 │ export type ProductFeature = Resource<
  38 │   "Stripe.ProductFeature",
  39 │   ProductFeatureProps,
  40 │   {
  41 │     /** Stripe product-feature id (`prodft_…`). */
> 42 │     id: string;
  43 │     /** Id of the product this feature is attached to (`prod_…`). */
  44 │     product: string;
  45 │     /** Id of the attached entitlements feature (`feat_…`). */
  46 │     entitlementFeature: string;
  47 │     /** Whether the attachment exists in live mode. */
  48 │     livemode: boolean;
  49 │   },
  50 │   never,
  51 │   Providers
  52 │ >;

0.72 packages/alchemy/test/AWS/AppRunner/fixtures/service.ts:26:5
  23 │   {
  24 │     main: import.meta.filename,
  25 │     serviceName: "alchemy-test-apprunner-e2e",
> 26 │     port: 3000,
  27 │     instanceConfiguration: { cpu: "256", memory: "512" },
  28 │     healthCheckConfiguration: { protocol: "HTTP", path: "/health" },
  29 │     // Docker Hub's `oven/bun` image; the public.ecr.aws default mirror
  30 │     // aggressively rate-limits anonymous pulls (429) during local builds.
  31 │     docker: { base: "oven/bun:1" },
  32 │   },

0.72 packages/alchemy/test/AWS/ControlTower/handler.ts:295:11
  294 │         return yield* HttpServerResponse.json(
> 295 │           { error: "Not found", method: request.method, pathname },
  296 │           { status: 404 },
  297 │         );
  298 │       }).pipe(Effect.orDie),

0.72 packages/alchemy/test/Cloudflare/Website/vite-cron-fixture/worker.ts:5:1
> 5 │ let scheduledCount = 0;

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:41:5
  38 │     const tasks = yield* Cloudflare.R2.ReadWriteBucket(Bucket);
  39 │     const tasksDO = yield* TasksObject;
  40 │
> 41 │     const getTaskDO = (id: string = "default") =>
  42 │       HttpApiClient.makeWith(TaskDOApi, {
  43 │         baseUrl: `http://localhost`,
  44 │         httpClient: Cloudflare.toHttpClient(tasksDO.getByName(id)),
  45 │       });

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/vite-url-fixture/src/worker.ts:8:3
  5 │ // - `env`: the plain_text binding injected at deploy time.
  6 │ type Env = {
  7 │   ASSETS: { fetch: (req: Request) => Promise<Response> };
> 8 │   VITE_PUBLIC_URL: string;
  9 │ };

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-async/worker.ts:33:3
  32 │ export class WorkflowEvents extends DurableObject {
> 33 │   async record(id: string, body: unknown) {
  34 │     await this.ctx.storage.put(id, body);
  35 │   }
  36 │
  37 │   async events() {
  38 │     // Diagnostic probes remain visible in raw storage snapshots.
  39 │     return Array.from((await this.ctx.storage.list()).values()).filter(
  40 │       (body) =>
  41 │         !(
  42 │           typeof body === "object" &&
  43 │           body !== null &&
  44 │           "type" in body &&
  45 │           body.type === "diagnostic.queue.probe"
  46 │         ),
  47 │     );
  48 │   }
  49 │
  50 │   async diagnostics() {
  51 │     return {
  52 │       readAt: Date.now(),
  53 │       objectId: this.ctx.id.toString(),
  54 │       entries: Array.from(await this.ctx.storage.list()),
  55 │     };
  56 │   }
  57 │ }

0.72 packages/alchemy/test/Prisma/fixtures/write-routes.ts:30:7
  27 │ ) =>
  28 │   Effect.gen(function* () {
  29 │     if (request.method === "PUT" && url.pathname === "/put") {
> 30 │       const key = url.searchParams.get("key") ?? "";
  31 │       const metaKey = url.searchParams.get("metaKey");
  32 │       const body = yield* request.text;
  33 │       const object = yield* store
  34 │         .put(key, body, {
  35 │           contentType: url.searchParams.get("contentType") ?? undefined,
  36 │           metadata: metaKey
  37 │             ? { [metaKey]: url.searchParams.get("metaValue") ?? "" }
  38 │             : undefined,
  39 │         })
  40 │         .pipe(Effect.orDie);
  41 │       return yield* HttpServerResponse.json({ ok: true, key: object.key });
  42 │     }

0.72 packages/cloudflare-runtime/src/core/globals/EntryOptions.shared.ts:15:1
> 15 │ export const BINDING_USER_WORKER_DIRECT = "USER_WORKER_DIRECT";

0.72 packages/frontend-frameworks/fixtures/static-website/src/counter.ts:2:3
  1 │ export function setupCounter(element: HTMLButtonElement) {
> 2 │   let counter = 0;
  3 │   const setCounter = (count: number) => {
  4 │     counter = count;
  5 │     element.innerHTML = `Count is ${counter}`;
  6 │   };
  7 │   element.addEventListener("click", () => setCounter(counter + 1));
  8 │   setCounter(0);
  9 │ }

0.72 packages/frontend-frameworks/fixtures/vite-hmr/src/client.ts:14:1
  11 │ // leaves this module (and `count`) alive, while a full page reload resets
  12 │ // the counter to 0 — the client HMR spec asserts the count survives.
  13 │ const button = document.querySelector<HTMLButtonElement>("#counter")!;
> 14 │ let count = 0;

0.72 packages/frontend-frameworks/src/nextjs/aws.ts:61:3
  53 │ export interface NextjsAwsOptions {
  54 │   /** Project root. Defaults to the process working directory. */
  55 │   readonly root?: string | undefined;
  56 │   /**
  57 │    * The deploy target module specifier the caller resolved this module as.
  58 │    * This module IS the AWS target — the option is accepted (the
  59 │    * `AWS.Website.Server` resource always passes it) and ignored.
  60 │    */
> 61 │   readonly target?: string | undefined;
  62 │   /**
  63 │    * Path of the OpenNext config, relative to the project root. When the file
  64 │    * does not exist, a minimal default with the `aws-lambda-streaming` wrapper
  65 │    * is generated ({@link DEFAULT_OPEN_NEXT_CONFIG}).
  66 │    * @default "open-next.config.ts"
  67 │    */
  68 │   readonly configPath?: string | undefined;
  69 │   /**
  70 │    * Extra CLI arguments appended to `open-next build` (e.g.
  71 │    * `["--dangerously-use-unsupported-next-version"]`).
  72 │    */
  73 │   readonly buildArgs?: ReadonlyArray<string> | undefined;
  74 │ }

0.72 packages/pkg/src/cli/pack.ts:521:3
  518 │ export interface PackOptions {
  519 │   readonly cwd: string;
  520 │   readonly groups: ReadonlyArray<Group>;
> 521 │   readonly registry: string;
  522 │   readonly out: string;
  523 │   readonly since?: string;
  524 │   readonly all?: boolean;
  525 │   readonly rebuildAllPaths?: ReadonlyArray<string>;
  526 │ }

0.71 packages/alchemy/src/AWS/AMP/ResourcePolicy.ts:15:3
   9 │ export interface ResourcePolicyProps {
  10 │   /**
  11 │    * Id of the AMP workspace the policy is attached to. A workspace has at
  12 │    * most one resource-based policy. Changing the workspace replaces the
  13 │    * policy.
  14 │    */
> 15 │   workspaceId: string;
  16 │   /**
  17 │    * The IAM resource-based policy document (JSON) that grants other
  18 │    * principals or accounts access to the workspace (e.g. `aps:RemoteWrite`,
  19 │    * `aps:QueryMetrics`). Updated in place.
  20 │    */
  21 │   policyDocument: string;
  22 │ }

0.71 packages/alchemy/src/AWS/ApiGateway/BasePathMapping.ts:39:3
  29 │ export interface BasePathMapping extends Resource<
  30 │   "AWS.ApiGateway.BasePathMapping",
  31 │   BasePathMappingProps,
  32 │   {
  33 │     domainName: string;
  34 │     domainNameId: string | undefined;
  35 │     basePath: string;
  36 │     restApiId: string;
  37 │     stage: string | undefined;
  38 │   },
> 39 │   never,
  40 │   Providers
  41 │ > {}

0.71 packages/alchemy/src/AWS/ApiGateway/VpcLink.ts:37:5
  33 │ export interface VpcLink extends Resource<
  34 │   "AWS.ApiGateway.VpcLink",
  35 │   VpcLinkProps,
  36 │   {
> 37 │     vpcLinkId: string;
  38 │     name: string | undefined;
  39 │     description: string | undefined;
  40 │     targetArns: string[] | undefined;
  41 │     status: ag.VpcLinkStatus | undefined;
  42 │     statusMessage: string | undefined;
  43 │     tags: Record<string, string>;
  44 │   },
  45 │   never,
  46 │   Providers
  47 │ > {}

0.71 packages/alchemy/src/AWS/ApiGatewayV2/Route.ts:89:3
  66 │ export interface RouteType extends Resource<
  67 │   "AWS.ApiGatewayV2.Route",
  68 │   RouteProps,
  69 │   {
  70 │     /** The API this route belongs to. */
  71 │     apiId: string;
  72 │     /** The route identifier. */
  73 │     routeId: string;
  74 │     /** The route key. */
  75 │     routeKey: string;
  76 │     target: string | undefined;
  77 │     authorizationType: agw2.AuthorizationType | undefined;
  78 │     authorizerId: string | undefined;
  79 │     authorizationScopes: string[] | undefined;
  80 │     apiKeyRequired: boolean | undefined;
  81 │     operationName: string | undefined;
  82 │     modelSelectionExpression: string | undefined;
  83 │     requestModels: { [key: string]: string | undefined } | undefined;
  84 │     requestParameters:
  85 │       | { [key: string]: agw2.ParameterConstraints | undefined }
  86 │       | undefined;
  87 │     routeResponseSelectionExpression: string | undefined;
  88 │   },
> 89 │   never,
  90 │   Providers
  91 │ > {}

0.71 packages/alchemy/src/AWS/AppConfig/ConfigurationProfile.ts:141:9
  139 │       const readProfile = Effect.fn(function* (
  140 │         applicationId: string,
> 141 │         configurationProfileId: string,
  142 │       ) {
  143 │         return yield* appconfig
  144 │           .getConfigurationProfile({
  145 │             ApplicationId: applicationId,
  146 │             ConfigurationProfileId: configurationProfileId,
  147 │           })
  148 │           .pipe(
  149 │             Effect.catchTag("ResourceNotFoundException", () =>
  150 │               Effect.succeed(undefined),
  151 │             ),
  152 │           );
  153 │       });

0.71 packages/alchemy/src/AWS/Chatbot/MicrosoftTeamsChannelConfiguration.ts:101:5
   85 │   {
   86 │     /**
   87 │      * Name of the channel configuration.
   88 │      */
   89 │     configurationName: string;
   90 │     /**
   91 │      * The ARN of the channel configuration.
   92 │      */
   93 │     chatConfigurationArn: string;
   94 │     /**
   95 │      * The Microsoft Teams team ID.
   96 │      */
   97 │     teamId: string;
   98 │     /**
   99 │      * The Microsoft Entra (Azure AD) tenant ID.
  100 │      */
> 101 │     tenantId: string;
  102 │     /**
  103 │      * The Microsoft Teams channel ID.
  104 │      */
  105 │     teamsChannelId: string;
  106 │     /**
  107 │      * Current state of the configuration (e.g. `ENABLED`).
  108 │      */
  109 │     state: string | undefined;
  110 │   },

0.71 packages/alchemy/src/AWS/CloudFront/ResponseHeadersPolicy.ts:50:5
  47 │     /**
  48 │      * CloudFront-assigned response headers policy identifier.
  49 │      */
> 50 │     responseHeadersPolicyId: string;

0.71 packages/alchemy/src/AWS/CloudWatch/Alarm.ts:19:1
> 19 │ export type AlarmName = string;
  20 │ export type AlarmArn =
  21 │   `arn:aws:cloudwatch:${RegionID}:${AccountID}:alarm:${string}`;
  22 │ export type AlarmStateValue = cloudwatch.StateValue;

0.71 packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts:19:1
> 19 │ export type CompositeAlarmName = string;

0.71 packages/alchemy/src/AWS/CodeDeploy/DeploymentEventSource.ts:16:3
  14 │ export interface DeploymentEventDetail {
  15 │   /** The deployment's id (`d-…`). */
> 16 │   deploymentId?: string;
  17 │   /** Name of the CodeDeploy application. */
  18 │   application?: string;
  19 │   /** Name of the deployment group. */
  20 │   deploymentGroup?: string;
  21 │   /**
  22 │    * The new state — `START`, `READY`, `SUCCESS`, `FAILURE`, or `STOP`.
  23 │    */
  24 │   state?: string;
  25 │   /** Region the deployment runs in. */
  26 │   region?: string;
  27 │   /** Instance state-change events: the affected instance's id. */
  28 │   instanceId?: string;
  29 │   /** Instance state-change events: the deployment's instance group id. */
  30 │   instanceGroupId?: string;
  31 │   /** Additional event fields (the schema grows over time). */
  32 │   [key: string]: unknown;
  33 │ }

0.71 packages/alchemy/src/AWS/Cognito/Group.ts:14:3
   9 │ export interface GroupProps {
  10 │   /**
  11 │    * The ID of the user pool the group belongs to. Changing this triggers a
  12 │    * replacement.
  13 │    */
> 14 │   userPoolId: string;
  15 │   /**
  16 │    * Name of the group. If omitted, a deterministic physical name is
  17 │    * generated from the app, stage, and logical ID. Changing this triggers a
  18 │    * replacement.
  19 │    */
  20 │   groupName?: string;
  21 │   /**
  22 │    * Description of the group (up to 2048 characters).
  23 │    */
  24 │   description?: string;
  25 │   /**
  26 │    * ARN of an IAM role associated with the group. Users in the group can
  27 │    * assume this role via an identity pool (`cognito:roles` /
  28 │    * `cognito:preferred_role` claims).
  29 │    */
  30 │   roleArn?: string;
  31 │   /**
  32 │    * Non-negative precedence; lower values take priority when a user belongs
  33 │    * to multiple groups with role ARNs.
  34 │    */
  35 │   precedence?: number;
  36 │ }

0.71 packages/alchemy/src/AWS/Cognito/IdentityPool.ts:85:3
  74 │ export interface IdentityPool extends Resource<
  75 │   "AWS.Cognito.IdentityPool",
  76 │   IdentityPoolProps,
  77 │   {
  78 │     /** The generated identity pool ID, e.g. `us-west-2:xxxx-...`. */
  79 │     identityPoolId: string;
  80 │     /** The ARN of the identity pool. */
  81 │     identityPoolArn: string;
  82 │     /** The name of the identity pool. */
  83 │     identityPoolName: string;
  84 │   },
> 85 │   never,
  86 │   Providers
  87 │ > {}

0.71 packages/alchemy/src/AWS/Config/RetentionConfiguration.ts:25:5
  20 │ export interface RetentionConfiguration extends Resource<
  21 │   "AWS.Config.RetentionConfiguration",
  22 │   RetentionConfigurationProps,
  23 │   {
  24 │     /** Name of the retention configuration. AWS always names it `default`. */
> 25 │     retentionConfigurationName: string;
  26 │     /** The retention period in whole days. */
  27 │     retentionPeriodInDays: number;
  28 │   },
  29 │   never,
  30 │   Providers
  31 │ > {}

0.71 packages/alchemy/src/AWS/ControlTower/EnabledControl.ts:121:3
  117 │ export class EnabledControlArnUnavailable extends Data.TaggedError(
  118 │   "EnabledControlArnUnavailable",
  119 │ )<{
  120 │   readonly controlIdentifier: string;
> 121 │   readonly targetIdentifier: string;
  122 │ }> {}

0.71 packages/alchemy/src/AWS/DataZone/internal.ts:31:3
  30 │ export const syncDataZoneTags = Effect.fn(function* (
> 31 │   resourceArn: string,
  32 │   observedTags: Record<string, string>,
  33 │   desiredTags: Record<string, string>,
  34 │ ) {
  35 │   const { upsert, removed } = diffTags(observedTags, desiredTags);
  36 │   if (upsert.length > 0) {
  37 │     yield* datazone.tagResource({
  38 │       resourceArn,
  39 │       tags: Object.fromEntries(upsert.map(({ Key, Value }) => [Key, Value])),
  40 │     });
  41 │   }
  42 │   if (removed.length > 0) {
  43 │     yield* datazone.untagResource({ resourceArn, tagKeys: removed });
  44 │   }
  45 │ });

0.71 packages/alchemy/src/AWS/DSQL/ClusterPolicy.ts:15:3
   9 │ export interface ClusterPolicyProps {
  10 │   /**
  11 │    * Identifier of the DSQL cluster the policy is attached to. A cluster has
  12 │    * at most one resource-based policy. Changing the cluster replaces the
  13 │    * policy.
  14 │    */
> 15 │   clusterId: string;
  16 │   /**
  17 │    * The resource-based policy document (JSON) that defines access
  18 │    * permissions and conditions for the cluster — e.g. denying
  19 │    * `dsql:DbConnect` from outside a VPC, or restricting connections to an
  20 │    * AWS Organization. Updated in place.
  21 │    */
  22 │   policy: string;
  23 │   /**
  24 │    * Skip the lockout safety check that prevents attaching a policy which
  25 │    * would lock the calling principal out of `dsql:PutClusterPolicy` /
  26 │    * `dsql:DeleteClusterPolicy` on the cluster.
  27 │    * @default false
  28 │    */
  29 │   bypassPolicyLockoutSafetyCheck?: boolean;
  30 │ }

0.71 packages/alchemy/src/AWS/EC2/KeyPair.ts:63:5
  56 │ export interface KeyPair extends Resource<
  57 │   "AWS.EC2.KeyPair",
  58 │   KeyPairProps,
  59 │   {
  60 │     /** The ID of the key pair (e.g. `key-0123456789abcdef0`). */
  61 │     keyPairId: KeyPairId;
  62 │     /** The name of the key pair. */
> 63 │     keyName: string;
  64 │     /** SHA-1/MD5 fingerprint of the key pair. */
  65 │     keyFingerprint: string;
  66 │     /** The algorithm of the key pair. */
  67 │     keyType: KeyPairType;
  68 │     /**
  69 │      * The unencrypted PEM/PPK private key material. Only present when Alchemy
  70 │      * generated the key pair (not when {@link KeyPairProps.publicKeyMaterial}
  71 │      * was imported). AWS returns this exactly once, at create time; it is then
  72 │      * persisted as a secret in alchemy state.
  73 │      */
  74 │     privateKey?: Redacted.Redacted<string>;
  75 │   },
  76 │   never,
  77 │   Providers
  78 │ > {}

0.71 packages/alchemy/src/AWS/EC2/Snapshot.ts:225:13
  222 │         // snapshots — scope to "self").
  223 │         list: () =>
  224 │           Effect.gen(function* () {
> 225 │             const { accountId, region } = yield* AWSEnvironment.current;
  226 │             const chunk = yield* ec2.describeSnapshots
  227 │               .pages({ OwnerIds: ["self"] })
  228 │               .pipe(Stream.runCollect);
  229 │             return Array.from(chunk).flatMap((page) =>
  230 │               (page.Snapshots ?? []).map((s) =>
  231 │                 toSnapshotAttributes(s, region, accountId),
  232 │               ),
  233 │             );
  234 │           }),

0.71 packages/alchemy/src/AWS/ECR/Image.ts:152:3
  135 │ export interface Image extends Resource<
  136 │   "AWS.ECR.Image",
  137 │   ImageProps,
  138 │   {
  139 │     /** Full image reference, `<repositoryUri>:<imageTag>`. */
  140 │     imageUri: string;
  141 │     /** Registry manifest digest, e.g. `sha256:...`. */
  142 │     digest: string;
  143 │     /** URI of the repository the image was pushed to. */
  144 │     repositoryUri: string;
  145 │     /** Name of the repository the image was pushed to. */
  146 │     repositoryName: string;
  147 │     /** Content-hash tag the image was pushed under. */
  148 │     imageTag: string;
  149 │     /** Whether this Image auto-created (and owns) the backing repository. */
  150 │     ownsRepository: boolean;
  151 │   },
> 152 │   never,
  153 │   Providers
  154 │ > {}

0.71 packages/alchemy/src/AWS/EMRServerless/internal.ts:13:3
  10 │ export class EmrServerlessStateTimeout extends Data.TaggedError(
  11 │   "EmrServerlessStateTimeout",
  12 │ )<{
> 13 │   readonly applicationId: string;
  14 │   readonly expected: readonly string[];
  15 │   readonly actual: string | undefined;
  16 │   readonly stateDetails: string | undefined;
  17 │ }> {}

0.71 packages/alchemy/src/AWS/EventBridge/ToEcsTask.ts:24:5
  15 │ export interface EcsRouteTargetProps extends Pick<
  16 │   RuleTarget,
  17 │   | "Input"
  18 │   | "InputPath"
  19 │   | "InputTransformer"
  20 │   | "RetryPolicy"
  21 │   | "DeadLetterConfig"
  22 │ > {
  23 │   task: {
> 24 │     taskDefinitionArn: string;
  25 │     taskRoleArn: string;
  26 │     executionRoleArn: string;
  27 │   };
  28 │   subnets: string[];
  29 │   securityGroups?: string[];
  30 │   assignPublicIp?: boolean;
  31 │   taskCount?: number;
  32 │ }

0.71 packages/alchemy/src/AWS/FraudDetector/Detector.ts:18:3
  13 │ export interface DetectorProps {
  14 │   /**
  15 │    * The detector identifier. If omitted, a unique lowercase id is generated
  16 │    * from the app, stage, and logical ID. Changing it replaces the detector.
  17 │    */
> 18 │   detectorId?: string;
  19 │   /**
  20 │    * Human-readable description. This is an in-place update.
  21 │    */
  22 │   description?: string;
  23 │   /**
  24 │    * Name of the event type this detector evaluates. Immutable — changing it
  25 │    * replaces the detector.
  26 │    */
  27 │   eventTypeName: string;
  28 │   /**
  29 │    * User-defined tags for the detector.
  30 │    */
  31 │   tags?: Record<string, string>;
  32 │ }

0.71 packages/alchemy/src/AWS/GuardDuty/Detector.ts:50:5
  45 │ export interface Detector extends Resource<
  46 │   "AWS.GuardDuty.Detector",
  47 │   DetectorProps,
  48 │   {
  49 │     /** The auto-generated detector ID (unique per account/region). */
> 50 │     detectorId: string;
  51 │     /** ARN of the detector — the IAM resource for detector-scoped actions. */
  52 │     detectorArn: string;
  53 │     /** Current status of the detector (`ENABLED` / `DISABLED`). */
  54 │     status: string | undefined;
  55 │     /** The effective finding-publishing frequency. */
  56 │     findingPublishingFrequency: string | undefined;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ > {}

0.71 packages/alchemy/src/AWS/HealthLake/FHIRDatastore.ts:301:11
  296 │       const toAttrs = Effect.fn(function* (
  297 │         properties: healthlake.DatastoreProperties,
  298 │       ) {
  299 │         return {
  300 │           datastoreId: properties.DatastoreId,
> 301 │           datastoreArn: properties.DatastoreArn,
  302 │           datastoreName: properties.DatastoreName ?? "",
  303 │           datastoreStatus: properties.DatastoreStatus,
  304 │           datastoreEndpoint: properties.DatastoreEndpoint,
  305 │           datastoreTypeVersion: properties.DatastoreTypeVersion,
  306 │           tags: yield* readDatastoreTags(properties.DatastoreArn),
  307 │         };
  308 │       });

0.71 packages/alchemy/src/AWS/IoTWireless/internal.ts:21:3
  20 │ export const syncIotWirelessTags = Effect.fn(function* (
> 21 │   arn: string,
  22 │   desired: Record<string, string>,
  23 │ ) {
  24 │   const current = yield* readIotWirelessTags(arn);
  25 │   const { upsert, removed } = diffTags(current, desired);
  26 │   if (upsert.length > 0) {
  27 │     yield* iotw.tagResource({ ResourceArn: arn, Tags: upsert });
  28 │   }
  29 │   if (removed.length > 0) {
  30 │     yield* iotw.untagResource({ ResourceArn: arn, TagKeys: removed });
  31 │   }
  32 │ });

0.71 packages/alchemy/src/AWS/IVSRealtime/Stage.ts:142:9
  136 │ const toWireRecordingConfig = (
  137 │   config: StageAutoParticipantRecordingConfiguration | undefined,
  138 │ ): ivsrealtime.AutoParticipantRecordingConfiguration | undefined =>
  139 │   config === undefined
  140 │     ? undefined
  141 │     : {
> 142 │         storageConfigurationArn: config.storageConfigurationArn,
  143 │         mediaTypes: config.mediaTypes,
  144 │         recordingReconnectWindowSeconds: toWireSeconds(
  145 │           config.recordingReconnectWindow,
  146 │         ),
  147 │         recordParticipantReplicas: config.recordParticipantReplicas,
  148 │       };

0.71 packages/alchemy/src/AWS/LicenseManager/LicenseConfiguration.ts:208:9
  202 │       const toAttributes = (observed: {
  203 │         LicenseConfigurationId?: string;
  204 │         LicenseConfigurationArn?: string;
  205 │         Name?: string;
  206 │         LicenseCountingType?: string;
  207 │       }) => ({
> 208 │         licenseConfigurationId: observed.LicenseConfigurationId!,
  209 │         licenseConfigurationArn: observed.LicenseConfigurationArn!,
  210 │         name: observed.Name!,
  211 │         licenseCountingType: observed.LicenseCountingType!,
  212 │       });

0.71 packages/alchemy/src/AWS/Location/TrackerConsumer.ts:14:3
   9 │ export interface TrackerConsumerProps {
  10 │   /**
  11 │    * Name of the tracker whose device position updates are consumed.
  12 │    * Changing it replaces the association.
  13 │    */
> 14 │   trackerName: string;
  15 │   /**
  16 │    * ARN of the geofence collection that consumes the tracker's position
  17 │    * updates (evaluating them against its geofences). Changing it replaces
  18 │    * the association.
  19 │    */
  20 │   consumerArn: string;
  21 │ }

0.71 packages/alchemy/src/AWS/Macie2/Session.ts:46:5
  41 │ export interface Session extends Resource<
  42 │   "AWS.Macie2.Session",
  43 │   SessionProps,
  44 │   {
  45 │     /** The account the Macie session belongs to. */
> 46 │     accountId: string;
  47 │     /** Current Macie status (`ENABLED` / `PAUSED`). */
  48 │     status: string | undefined;
  49 │     /** The effective finding-publishing frequency. */
  50 │     findingPublishingFrequency: string | undefined;
  51 │     /** ARN of the Macie service-linked role. */
  52 │     serviceRole: string | undefined;
  53 │     /** ISO timestamp of when the Macie session was created. */
  54 │     createdAt: string | undefined;
  55 │   },
  56 │   never,
  57 │   Providers
  58 │ > {}

0.71 packages/alchemy/src/AWS/MQ/Configuration.ts:71:3
  54 │ export interface Configuration extends Resource<
  55 │   "AWS.MQ.Configuration",
  56 │   ConfigurationProps,
  57 │   {
  58 │     /** Server-assigned unique id of the configuration (e.g. `c-1234...`). */
  59 │     configurationId: string;
  60 │     /** ARN of the configuration. */
  61 │     configurationArn: string;
  62 │     /** Name of the configuration. */
  63 │     configurationName: string;
  64 │     /** Latest published revision number. */
  65 │     configurationRevision: number;
  66 │     /** Broker engine the configuration targets (`ACTIVEMQ` or `RABBITMQ`). */
  67 │     engineType: string;
  68 │     /** Engine version the configuration targets. */
  69 │     engineVersion: string | undefined;
  70 │   },
> 71 │   never,
  72 │   Providers
  73 │ > {}

0.71 packages/alchemy/src/AWS/OAM/internal.ts:60:1
  57 │ /**
  58 │  * Delete a sink only after attached links have drained, then observe absence.
  59 │  */
> 60 │ export const deleteSinkAndWait = Effect.fn(function* (sinkArn: string) {

0.71 packages/alchemy/src/AWS/PinpointSMSVoiceV2/EventDestination.ts:21:3
  12 │ export interface CloudWatchLogsDestinationProps {
  13 │   /**
  14 │    * ARN of an IAM role that End User Messaging SMS assumes to write to
  15 │    * the log group. The role must trust `sms-voice.amazonaws.com`.
  16 │    */
  17 │   iamRoleArn: string;
  18 │   /**
  19 │    * ARN of the CloudWatch Logs log group that receives the events.
  20 │    */
> 21 │   logGroupArn: string;
  22 │ }

0.71 packages/alchemy/src/AWS/PinpointSMSVoiceV2/PhoneNumber.ts:67:5
  64 │     /**
  65 │      * ID of the phone number.
  66 │      */
> 67 │     phoneNumberId: string;

0.71 packages/alchemy/src/AWS/Pricing/internal.ts:11:1
   8 │ // NOTE: the distilled Region service value is `Effect<RegionName>`, not a raw
   9 │ // string — providing a bare string makes the client `yield*` a string and
  10 │ // crash. Wrap in Effect.succeed (same as CloudFront KVS / ACM / WAFv2).
> 11 │ export const PRICING_REGION = "us-east-1" as const;
  12 │
  13 │ export const withPricingRegion = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  14 │   effect.pipe(Effect.provideService(AwsRegion, Effect.succeed(PRICING_REGION)));

0.71 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:144:9
> 144 │         const resolvedPort = options.port ?? port ?? 5432;
  145 │         const scheme = engine?.toLowerCase().includes("mysql")
  146 │           ? "mysql"
  147 │           : "postgresql";

0.71 packages/alchemy/src/AWS/RolesAnywhere/Crl.ts:71:3
  46 │ export interface Crl extends Resource<
  47 │   "AWS.RolesAnywhere.Crl",
  48 │   CrlProps,
  49 │   {
  50 │     /**
  51 │      * Unique ID of the CRL.
  52 │      */
  53 │     crlId: string;
  54 │     /**
  55 │      * ARN of the CRL.
  56 │      */
  57 │     crlArn: string;
  58 │     /**
  59 │      * Name of the CRL.
  60 │      */
  61 │     crlName: string;
  62 │     /**
  63 │      * ARN of the trust anchor the CRL applies to.
  64 │      */
  65 │     trustAnchorArn: string;
  66 │     /**
  67 │      * Whether the CRL is enabled (revocation checks are enforced).
  68 │      */
  69 │     enabled: boolean;
  70 │   },
> 71 │   never,
  72 │   Providers
  73 │ > {}

0.71 packages/alchemy/src/AWS/Route53/Records.ts:74:5
  68 │   {
  69 │     /**
  70 │      * Hosted zone that owns the records. `undefined` only while the set
  71 │      * is empty with no explicit zone — resolved (explicit or inferred) on
  72 │      * the first reconcile that has a name.
  73 │      */
> 74 │     hostedZoneId: string | undefined;
  75 │     /**
  76 │      * Record type shared by every record in the set.
  77 │      */
  78 │     type: route53.RRType;
  79 │     /**
  80 │      * Fully qualified names of every record currently managed by this set
  81 │      * (declared `names` plus bound names, as of the last reconcile).
  82 │      */
  83 │     names: string[];
  84 │     /**
  85 │      * Current TTL for non-alias records.
  86 │      */
  87 │     ttl: number | undefined;
  88 │     /**
  89 │      * Current non-alias record values.
  90 │      */
  91 │     records: string[] | undefined;
  92 │     /**
  93 │      * Current alias target, when the set manages alias records.
  94 │      */
  95 │     aliasTarget: ResolvedRecordAliasTarget | undefined;
  96 │   },

0.71 packages/alchemy/src/AWS/Route53Resolver/ResolverRuleAssociation.ts:202:27
  185 │         list: () =>
  186 │           r53r.listResolverRuleAssociations.pages({}).pipe(
  187 │             Stream.runCollect,
  188 │             Effect.map((chunk) =>
  189 │               Array.from(chunk)
  190 │                 .flatMap((page) => page.ResolverRuleAssociations ?? [])
  191 │                 .flatMap((association) =>
  192 │                   association.Id !== undefined &&
  193 │                   association.ResolverRuleId !== undefined &&
  194 │                   association.VPCId !== undefined &&
  195 │                   // AWS creates an Internet Resolver association for each
  196 │                   // VPC. It cannot be disassociated directly and disappears
  197 │                   // automatically with the VPC.
  198 │                   !association.Id.startsWith("rslvr-autodefined") &&
  199 │                   !association.ResolverRuleId.startsWith("rslvr-autodefined")
  200 │                     ? [
  201 │                         {
> 202 │                           resolverRuleAssociationId: association.Id,
  203 │                           resolverRuleId: association.ResolverRuleId,
  204 │                           vpcId: association.VPCId,
  205 │                         },
  206 │                       ]
  207 │                     : [],
  208 │                 ),
  209 │             ),
  210 │           ),

0.71 packages/alchemy/src/AWS/RUM/AppMonitor.ts:261:9
  258 │     AppMonitor,
  259 │     Effect.gen(function* () {
  260 │       const createName = Effect.fn(function* (
> 261 │         id: string,
  262 │         props: Pick<AppMonitorProps, "appMonitorName">,
  263 │       ) {
  264 │         return (
  265 │           props.appMonitorName ??
  266 │           (yield* createPhysicalName({ id, maxLength: 64 }))
  267 │         );
  268 │       });

0.71 packages/alchemy/src/AWS/RUM/ResourcePolicy.ts:15:3
   9 │ export interface ResourcePolicyProps {
  10 │   /**
  11 │    * Name of the CloudWatch RUM app monitor the policy is attached to. An app
  12 │    * monitor has at most one resource-based policy. Changing the app monitor
  13 │    * replaces the policy.
  14 │    */
> 15 │   appMonitorName: string;
  16 │   /**
  17 │    * The IAM resource-based policy document (JSON) that controls who may send
  18 │    * events to the app monitor. RUM only accepts `rum:PutRumEvents` as the
  19 │    * statement action. Updated in place. Maximum size is 4 KB.
  20 │    */
  21 │   policyDocument: string;
  22 │ }

0.71 packages/alchemy/src/AWS/S3Control/ObjectLambdaAccessPoint.ts:226:17
  212 │         list: () =>
  213 │           Effect.gen(function* () {
  214 │             const { accountId, region } = yield* AWSEnvironment.current;
  215 │             const pages = yield* s3control.listAccessPointsForObjectLambda
  216 │               .pages({ AccountId: accountId })
  217 │               .pipe(Stream.runCollect);
  218 │             return Array.from(pages).flatMap((page) =>
  219 │               (page.ObjectLambdaAccessPointList ?? []).map((olap) => ({
  220 │                 objectLambdaAccessPointName: olap.Name,
  221 │                 objectLambdaAccessPointArn:
  222 │                   olap.ObjectLambdaAccessPointArn ??
  223 │                   objectLambdaArn(region, accountId, olap.Name),
  224 │                 alias: olap.Alias?.Value,
  225 │                 region,
> 226 │                 accountId,
  227 │               })),
  228 │             );
  229 │           }),

0.71 packages/alchemy/src/AWS/SecurityLake/CustomLogSource.ts:91:3
  72 │ export interface CustomLogSource extends Resource<
  73 │   "AWS.SecurityLake.CustomLogSource",
  74 │   CustomLogSourceProps,
  75 │   {
  76 │     /** Name of the custom log source. */
  77 │     sourceName: string;
  78 │     /** The resolved source schema version. */
  79 │     sourceVersion: string | undefined;
  80 │     /** ARN of the Glue crawler created for the source. */
  81 │     crawlerArn: string | undefined;
  82 │     /** ARN of the Glue database created for the source. */
  83 │     databaseArn: string | undefined;
  84 │     /** ARN of the Glue table created for the source. */
  85 │     tableArn: string | undefined;
  86 │     /** ARN of the IAM role the provider assumes to write data. */
  87 │     providerRoleArn: string | undefined;
  88 │     /** S3 location the provider writes OCSF data to. */
  89 │     providerLocation: string | undefined;
  90 │   },
> 91 │   never,
  92 │   Providers
  93 │ > {}

0.71 packages/alchemy/src/AWS/Shield/ProtectionGroup.ts:174:7
  171 │   Provider.effect(
  172 │     ProtectionGroup,
  173 │     Effect.gen(function* () {
> 174 │       const toGroupId = (id: string, props: { protectionGroupId?: string }) =>
  175 │         props.protectionGroupId
  176 │           ? Effect.succeed(props.protectionGroupId)
  177 │           : createPhysicalName({ id, maxLength: 36 });

0.71 packages/alchemy/src/AWS/Signer/ProfilePermission.ts:230:15
  227 │           yield* Effect.gen(function* () {
  228 │             // OBSERVE — the profile's policy is authoritative.
  229 │             const { permissions, revisionId } = yield* listAllPermissions(
> 230 │               news.profileName,
  231 │             );

0.71 packages/alchemy/src/AWS/Translate/TranslationJobEventSource.ts:16:3
  14 │ export interface TranslationJobEventDetail {
  15 │   /** Id of the batch translation job. */
> 16 │   jobId?: string;
  17 │   /** The job's new status, e.g. `COMPLETED`, `FAILED`, `STOPPED`. */
  18 │   jobStatus?: string;
  19 │   /** Additional event fields (the schema grows over time). */
  20 │   [key: string]: unknown;
  21 │ }

0.71 packages/alchemy/src/AWS/VpcLattice/Rule.ts:102:1
  100 │   never,
  101 │   Providers
> 102 │ > {}

0.71 packages/alchemy/src/Cloudflare/Auth/AuthProvider.ts:102:3
  101 │ const listVisibleAccounts: Effect.Effect<
> 102 │   ReadonlyArray<{ id: string; name: string }>,
  103 │   unknown,
  104 │   CfCredentialsModule.Credentials | HttpClient.HttpClient
  105 │ > = Effect.gen(function* () {
  106 │   const listMemberships = yield* cfMemberships.listMemberships;
  107 │   const membershipAccounts = yield* listMemberships({}).pipe(
  108 │     Effect.map((response) =>
  109 │       response.result.flatMap((membership) =>
  110 │         membership.account != null &&
  111 │         (membership.status == null || membership.status === "accepted")
  112 │           ? [membership.account]
  113 │           : [],
  114 │       ),
  115 │     ),
  116 │     Effect.catch((error) =>
  117 │       Effect.logDebug("Cloudflare: listing memberships failed", error).pipe(
  118 │         Effect.as([] as Array<{ id: string; name: string }>),
  119 │       ),
  120 │     ),
  121 │   );
  122 │   if (membershipAccounts.length > 0) return membershipAccounts;
  123 │   const listAccounts = yield* cfAccounts.listAccounts;
  124 │   const response = yield* listAccounts({});
  125 │   yield* Effect.logDebug(
  126 │     `Cloudflare: memberships listed 0 accounts; /accounts listed ${response.result.length}`,
  127 │   );
  128 │   return response.result;
  129 │ });

0.71 packages/alchemy/src/Cloudflare/Containers/Container.ts:145:3
  137 │ export type Container<Id extends string = string> = Named<Id> & {
  138 │   get running(): Effect.Effect<boolean, never, RuntimeContext>;
  139 │   start(
  140 │     options?: ContainerStartupOptions,
  141 │   ): Effect.Effect<void, never, RuntimeContext>;
  142 │   monitor(): Effect.Effect<void, ContainerError, RuntimeContext>;
  143 │   destroy(error?: any): Effect.Effect<void, never, RuntimeContext>;
  144 │   signal(signo: number): Effect.Effect<void, never, RuntimeContext>;
> 145 │   getTcpPort(port: number): Effect.Effect<Fetcher, never, RuntimeContext>;
  146 │   setInactivityTimeout(
  147 │     durationMs: number | bigint,
  148 │   ): Effect.Effect<void, never, RuntimeContext>;
  149 │   interceptOutboundHttp(
  150 │     addr: string,
  151 │     binding: Fetcher,
  152 │   ): Effect.Effect<void, never, RuntimeContext>;
  153 │   interceptAllOutboundHttp(
  154 │     binding: Fetcher,
  155 │   ): Effect.Effect<void, never, RuntimeContext>;
  156 │ };

0.71 packages/alchemy/src/Cloudflare/Devices/PostureRule.ts:84:3
   82 │ export type DevicePostureRuleAttributes = {
   83 │   /** API UUID of the posture rule. */
>  84 │   postureRuleId: string;
   85 │   /** Account that owns the rule. */
   86 │   accountId: string;
   87 │   /** Observed rule name. */
   88 │   name: string;
   89 │   /** Observed rule type. */
   90 │   type: string;
   91 │   /** Observed description. */
   92 │   description: string | undefined;
   93 │   /** Observed polling schedule. */
   94 │   schedule: string | undefined;
   95 │   /** Observed result expiration. */
   96 │   expiration: string | undefined;
   97 │   /** Observed platform conditions. */
   98 │   match: { platform: string | undefined }[] | undefined;
   99 │   /** Observed per-type check definition. */
  100 │   input: unknown;
  101 │ };

0.71 packages/alchemy/src/Cloudflare/Email/SendEmail.ts:14:3
   7 │ export type SendEmailProps = {
   8 │   /**
   9 │    * Restrict the Worker to send to a single verified destination address.
  10 │    *
  11 │    * Mutually exclusive with `allowedDestinationAddresses`. The destination
  12 │    * must be a verified address on the account (see {@link Address}).
  13 │    */
> 14 │   destinationAddress?: string;
  15 │   /**
  16 │    * Restrict the Worker to send to one of these verified destination addresses.
  17 │    *
  18 │    * Mutually exclusive with `destinationAddress`.
  19 │    */
  20 │   allowedDestinationAddresses?: string[];
  21 │   /**
  22 │    * Restrict the Worker to send from one of these sender addresses.
  23 │    *
  24 │    * The sender domain must have Email Routing configured (see
  25 │    * {@link Routing}) and the addresses must be verified.
  26 │    */
  27 │   allowedSenderAddresses?: string[];
  28 │ };

0.71 packages/alchemy/src/Cloudflare/Hyperdrive/ConnectBinding.ts:24:15
  18 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  19 │         yield* host.bind`${connection}`({
  20 │           bindings: [
  21 │             {
  22 │               type: "hyperdrive",
  23 │               name: connection.LogicalId,
> 24 │               id: connection.hyperdriveId as unknown as string,
  25 │             },
  26 │           ],
  27 │           hyperdrives: getHyperdriveDevOrigin(connection),
  28 │         });
  29 │       }

0.71 packages/alchemy/src/Cloudflare/Images/SigningKey.ts:37:3
  33 │ export interface SigningKeyAttributes {
  34 │   /** The signing key's name (its API path identifier). */
  35 │   keyName: string;
  36 │   /** Account the key belongs to. */
> 37 │   accountId: string;
  38 │   /** The HMAC key material used to sign image delivery URLs. */
  39 │   value: Redacted.Redacted<string>;
  40 │ }

0.71 packages/alchemy/src/Cloudflare/PageShield/Settings.ts:21:3
> 21 │   zoneId: string;

0.71 packages/alchemy/src/Cloudflare/Tunnel/VirtualNetwork.ts:63:3
  59 │ export type VirtualNetwork = Resource<
  60 │   TypeId,
  61 │   VirtualNetworkProps,
  62 │   VirtualNetworkAttributes,
> 63 │   never,
  64 │   Providers
  65 │ >;

0.71 packages/alchemy/src/Cloudflare/Workers/WorkerRuntime.ts:11:1
> 11 │ export const WorkerTypeId = "Cloudflare.Worker";
  12 │ export type WorkerTypeId = typeof WorkerTypeId;

0.71 packages/alchemy/src/Docker/Docker.ts:392:5
  389 │   export type EngineRef = ContextRef | { nodeId: string; context?: string };
  390 │
  391 │   export interface SwarmInfo {
> 392 │     NodeID: string;
  393 │     LocalNodeState:
  394 │       | "inactive"
  395 │       | "pending"
  396 │       | "active"
  397 │       | "error"
  398 │       | "locked"
  399 │       | (string & {});
  400 │     ControlAvailable: boolean;
  401 │     Cluster?: { ID: string; CreatedAt?: string } | null;
  402 │     RemoteManagers?: Array<{ NodeID: string; Addr: string }> | null;
  403 │     Managers?: number;
  404 │     Nodes?: number;
  405 │   }

0.71 packages/alchemy/src/Docker/Registry.ts:5:3
   3 │ export interface ImageRegistry {
   4 │   /** Registry host, e.g. `ghcr.io`. */
>  5 │   server: string;
   6 │   /** Registry username. */
   7 │   username: string;
   8 │   /** Registry password. Use `Redacted.make(...)` or `Config.Redacted(...)`. */
   9 │   password: Redacted.Redacted<string>;
  10 │ }

0.71 packages/alchemy/src/Fly/BucketBinding.ts:29:3
  28 │ export interface TigrisS3Scope {
> 29 │   bucketName: string;
  30 │   accessKeyId: string;
  31 │   secretAccessKey: string;
  32 │   endpoint: string;
  33 │   region: RegionName;
  34 │ }

0.71 packages/alchemy/src/Git/Store/HeadSnapshot.ts:26:3
  24 │ export interface HeadSnapshot {
  25 │   readonly v: 1;
> 26 │   readonly repoId: string;
  27 │   readonly owner: string;
  28 │   readonly name: string;
  29 │   /** Anonymous read access (the GitHub public-repo model). */
  30 │   readonly public: boolean;
  31 │   readonly readOnly: boolean;
  32 │   readonly defaultBranch: string;
  33 │   readonly refs: ReadonlyArray<HeadRef>;
  34 │   /** The current clone bundle, when one covers these refs. */
  35 │   readonly bundle?: BundleInfo | undefined;
  36 │ }

0.71 packages/alchemy/src/Git/Store/ObjectStore.ts:241:5
  240 │   readonly insertStagedBatch: (
> 241 │     pushId: string,
  242 │     objects: ReadonlyArray<StagedObject>,
  243 │   ) => Effect.Effect<void, StoreError>;

0.71 packages/alchemy/src/GitHub/Repository.ts:161:5
  158 │     /**
  159 │      * Numeric GitHub repository ID.
  160 │      */
> 161 │     repoId: number;

0.71 packages/alchemy/src/Hetzner/ReadWriteDnsHttp.ts:21:3
  18 │ /** Build the combined read + write client over an injectable auth and zone id. */
  19 │ export const dnsReadWriteClient = (
  20 │   auth: DnsAuth,
> 21 │   zoneId: Effect.Effect<number>,
  22 │ ): ReadWriteDnsClient => ({
  23 │   ...dnsReadClient(auth, zoneId),
  24 │   ...dnsWriteClient(auth, zoneId),
  25 │ });

0.71 packages/alchemy/src/Local/RpcProviderProxy.ts:30:7
  21 │ export class RpcProviderProxy extends Context.Service<
  22 │   RpcProviderProxy,
  23 │   {
  24 │     /**
  25 │      * The provider for `providerName`, served by the dev sidecar. `providersUrl`
  26 │      * is the URL of the module whose default export is the provider group's
  27 │      * layer (see `Local/Sidecar.ts`); the sidecar imports it on first use.
  28 │      */
  29 │     readonly get: <R extends ResourceLike>(
> 30 │       providersUrl: string,
  31 │       providerName: R["Type"],
  32 │     ) => Effect.Effect<ProviderService<R>, never, AlchemyContext | Stack>;
  33 │   }
  34 │ >()("alchemy/Local/RpcProviderProxy") {}

0.71 packages/alchemy/src/Neon/Website/Waku.ts:46:1
> 46 │ export const Waku = (id: string, props: WakuProps = {}) =>
  47 │   makeFrameworkSite(id, props, {
  48 │     framework: "@alchemy.run/frontend-frameworks/waku",
  49 │     target: "@alchemy.run/frontend-frameworks/waku/neon",
  50 │     options: { waku: props.waku },
  51 │     htmlHandling: "drop-trailing-slash",
  52 │   }).pipe(Namespace.push(id));

0.71 packages/alchemy/src/Planetscale/MySQL/MySQLDatabase.ts:131:2
  128 │  * **Example:** Basic MySQL database
  129 │  * ```typescript
  130 │  * const db = yield* Planetscale.MySQLDatabase("MyDb", {
> 131 │  *   clusterSize: "PS_10",

0.71 packages/alchemy/src/Prisma/Branch.ts:41:3
  37 │ export interface BranchProps {
  38 │   /**
  39 │    * Project ID or `project.projectId` output that owns this branch.
  40 │    */
> 41 │   project: string | Project;
  42 │   /**
  43 │    * Git-style branch name. If omitted, Alchemy generates a stable physical
  44 │    * name.
  45 │    */
  46 │   gitName?: string;
  47 │   /**
  48 │    * Promote this branch to be the project's default branch. Setting this to
  49 │    * `false` does not demote a current default because the Management API only
  50 │    * supports promotion; promoting another branch atomically demotes it.
  51 │    * Promotion changes `isDefault`, not the branch's immutable `preview` role.
  52 │    *
  53 │    * @default false
  54 │    */
  55 │   isDefault?: boolean;
  56 │ }

0.71 packages/alchemy/src/Prisma/EnvironmentVariable.ts:161:3
  159 │ const validateEnvironmentVariableWrite = (
  160 │   key: string,
> 161 │   value: Redacted.Redacted<string>,
  162 │ ) =>
  163 │   Effect.gen(function* () {
  164 │     yield* validateEnvironmentVariableKey(key);
  165 │     const raw = Redacted.value(value);
  166 │     if (raw.length === 0) {
  167 │       return yield* Effect.fail(
  168 │         new Error(
  169 │           `Prisma environment variable '${key}' value must be non-empty.`,
  170 │         ),
  171 │       );
  172 │     }
  173 │     const byteLength = yield* Effect.sync(
  174 │       () => new TextEncoder().encode(raw).byteLength,
  175 │     );
  176 │     if (byteLength > ENV_VALUE_MAX_BYTES) {
  177 │       return yield* Effect.fail(
  178 │         new Error(
  179 │           `Prisma environment variable '${key}' value exceeds ${ENV_VALUE_MAX_BYTES} bytes.`,
  180 │         ),
  181 │       );
  182 │     }
  183 │   });

0.71 packages/alchemy/src/Report.ts:221:3
  217 │ export interface NukeResourceDeleted {
  218 │   readonly _tag: "nuke.resource.deleted";
  219 │   readonly provider: string;
  220 │   /** Display name of the deleted resource. */
> 221 │   readonly resource: string;
  222 │ }

0.71 packages/alchemy/src/State/State.ts:53:3
> 53 │   readonly id: string;

0.71 packages/alchemy/src/Stripe/PromotionCode.ts:137:3
> 137 │   never,
  138 │   Providers
  139 │ > {}

0.71 packages/alchemy/src/Stripe/RetrieveProductHttp.ts:15:1
> 15 │ type ProductInput = string | Product;

0.71 packages/alchemy/test/AWS/EMRServerless/handler.ts:164:11
  162 │         // Typed not-found probes on nonexistent sub-resources.
  163 │         if (request.method === "GET" && pathname === "/jobrun") {
> 164 │           return yield* probe(getJobRun({ jobRunId: FAKE_JOB_RUN_ID }));
  165 │         }

0.71 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:193:11
  192 │         if (request.method === "GET" && pathname === "/event") {
> 193 │           const eventId = url.searchParams.get("id")!;
  194 │           // A deleted / not-yet-consistent event surfaces as a typed
  195 │           // ResourceNotFoundException — report it as absent, not a 500.
  196 │           const { event } = yield* getEvent({ eventId }).pipe(
  197 │             Effect.catchTag("ResourceNotFoundException", () =>
  198 │               Effect.succeed({ event: undefined }),
  199 │             ),
  200 │           );
  201 │           return yield* HttpServerResponse.json({
  202 │             found: event !== undefined,
  203 │             currentLabel: event?.currentLabel,
  204 │           });
  205 │         }

0.71 packages/alchemy/test/AWS/Glacier/bindings-handler.ts:13:3
  11 │ // A syntactically-valid-looking but nonexistent 138-char job/upload id.
  12 │ const BOGUS_ID =
> 13 │   "alchemy-nonexistent-glacier-id-000000000000000000000000000000000000";

0.71 packages/alchemy/test/AWS/MediaConvert/handler.ts:83:11
  82 │         if (request.method === "POST" && pathname === "/cancel") {
> 83 │           const body = (yield* request.json) as unknown as { id: string };
  84 │           const result = yield* cancelJob({ Id: body.id }).pipe(
  85 │             Effect.map(() => ({ cancelled: true, error: undefined })),
  86 │             Effect.catch((e) =>
  87 │               Effect.succeed({ cancelled: false, error: e._tag }),
  88 │             ),
  89 │           );
  90 │           return yield* HttpServerResponse.json(result);
  91 │         }

0.71 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:15:3
  14 │ const versionRequest = Schema.Struct({
> 15 │   Key: Schema.String,
  16 │   VersionId: Schema.optional(Schema.String),
  17 │ });

0.71 packages/alchemy/test/AWS/VpcLattice/handler.ts:58:11
  56 │         // Register a target (for a LAMBDA group: a function ARN).
  57 │         if (request.method === "POST" && pathname === "/register") {
> 58 │           const body = (yield* request.json) as unknown as { id: string };
  59 │           const { successful = [], unsuccessful = [] } = yield* registerTargets(
  60 │             { targets: [{ id: body.id }] },
  61 │           );
  62 │           return yield* HttpServerResponse.json({
  63 │             successful: successful.map((t) => t.id),
  64 │             unsuccessful: unsuccessful.map((t) => ({
  65 │               failureCode: t.failureCode,
  66 │               id: t.id,
  67 │             })),
  68 │           });
  69 │         }

0.71 packages/alchemy/test/Cloudflare/Email/fixtures/local-email-worker.ts:8:3
   5 │ import { EmailMessage } from "cloudflare:email";
   6 │
   7 │ interface SendEmailLike {
>  8 │   send(message: unknown): Promise<{ messageId: string }>;
   9 │ }
  10 │
  11 │ type Env = { EMAIL: SendEmailLike };

0.71 packages/alchemy/test/Cloudflare/Website/vite-do-fixture/src/worker.ts:22:5
  20 │ export class Counter extends DurableObject {
  21 │   async get() {
> 22 │     return (await this.ctx.storage.get<number>(COUNT_KEY)) ?? 0;
  23 │   }
  24 │
  25 │   async increment() {
  26 │     const next = (await this.get()) + 1;
  27 │     await this.ctx.storage.put(COUNT_KEY, next);
  28 │     return next;
  29 │   }
  30 │
  31 │   async reset() {
  32 │     await this.ctx.storage.delete(COUNT_KEY);
  33 │   }
  34 │ }

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/schema.ts:5:3
  2 │ import { integer, pgTable, text } from "drizzle-orm/pg-core";
  3 │
  4 │ export const Widgets = pgTable("alchemy_postgres_widgets", {
> 5 │   id: integer("id").primaryKey(),
  6 │   name: text("name").notNull(),
  7 │ });
  8 │ export type Widget = typeof Widgets.$inferSelect;

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-http/worker.ts:27:5
  24 │     // DO's fetch handler (which serves `InnerRpcs` via
  25 │     // `RpcServer.toHttpEffect`). Mirrors the `Cloudflare.toHttpClient`
  26 │     // pattern used by the HttpApi fixture's `getTaskDO` factory.
> 27 │     const makeDOClient = (id: string = "default") =>
  28 │       RpcClient.make(DoRpcs).pipe(
  29 │         Effect.provide(
  30 │           RpcClient.layerProtocolHttp({ url: "http://localhost" }).pipe(
  31 │             Layer.provide(
  32 │               Layer.succeed(
  33 │                 HttpClient.HttpClient,
  34 │                 Cloudflare.toHttpClient(rpcDO.getByName(id)),
  35 │               ),
  36 │             ),
  37 │             Layer.provide(RpcSerialization.layerNdjson),
  38 │           ),
  39 │         ),
  40 │       );

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-pause/worker.ts:26:11
  15 │     return {
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │
  19 │         if (request.url.startsWith("/workflow/start/")) {
  20 │           const value = request.url.split("/workflow/start/")[1] ?? "world";
  21 │           const instance = yield* workflow.create({ params: { value } });
  22 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  23 │         }
  24 │
  25 │         if (request.url.startsWith("/workflow/pause/")) {
> 26 │           const instanceId = request.url.split("/workflow/pause/")[1] ?? "";
  27 │           const instance = yield* workflow.get(instanceId);
  28 │           yield* instance.pause();
  29 │           return yield* HttpServerResponse.json({ ok: true });
  30 │         }
  31 │
  32 │         if (request.url.startsWith("/workflow/status/")) {
  33 │           const instanceId = request.url.split("/workflow/status/")[1] ?? "";
  34 │           const instance = yield* workflow.get(instanceId);
  35 │           const status = yield* instance.status();
  36 │           return yield* HttpServerResponse.json(status);
  37 │         }
  38 │
  39 │         return HttpServerResponse.text("ok");
  40 │       }),
  41 │     };

0.71 packages/alchemy/test/Command/fixture/lifecycle-support.ts:8:1
   5 │ import * as Stream from "effect/Stream";
   6 │ import * as ChildProcess from "effect/unstable/process/ChildProcess";
   7 │
>  8 │ export const pidAlive = (pid: number) =>
   9 │   Effect.sync(() => {
  10 │     try {
  11 │       process.kill(pid, 0);
  12 │       return true;
  13 │     } catch (error) {
  14 │       if (
  15 │         typeof error === "object" &&
  16 │         error !== null &&
  17 │         "code" in error &&
  18 │         error.code === "ESRCH"
  19 │       )
  20 │         return false;
  21 │       throw error;
  22 │     }
  23 │   });

0.71 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:441:3
  438 │ export const assertReplacement = (
  439 │   appName: string,
  440 │   oldId: string,
> 441 │   newId: string,
  442 │ ) =>
  443 │   Effect.gen(function* () {
  444 │     expect(newId).not.toBe(oldId);
  445 │     const live = (yield* machines.listMachines({ app_name: appName })).filter(
  446 │       (machine) => machine.state !== "destroyed",
  447 │     );
  448 │     expect(live.map((machine) => machine.id)).toEqual([newId]);
  449 │     expect(
  450 │       yield* machines.getMachine({ app_name: appName, machine_id: oldId }).pipe(
  451 │         Effect.map((machine) => machine.state === "destroyed"),
  452 │         Effect.catchTag("NotFound", () => Effect.succeed(true)),
  453 │       ),
  454 │     ).toBe(true);
  455 │   });

0.71 packages/alchemy/test/Planetscale/Postgres/fixtures/schema.ts:5:3
  2 │ import { integer, pgTable, text } from "drizzle-orm/pg-core";
  3 │
  4 │ export const Widgets = pgTable("alchemy_postgres_widgets", {
> 5 │   id: integer("id").primaryKey(),
  6 │   name: text("name").notNull(),
  7 │ });
  8 │ export type Widget = typeof Widgets.$inferSelect;

0.71 packages/cloudflare-runtime/src/core/bindings/secrets-store/SecretsStoreOptions.shared.ts:10:3
   2 │ export interface SecretsStoreSecretProps {
   3 │   /** Binding name exposed on `env`. */
   4 │   readonly binding: string;
   5 │   /**
   6 │    * Identifier of the Secrets Store containing the secret. Stores with the
   7 │    * same identifier share data; the identifier also determines where data
   8 │    * is persisted on disk.
   9 │    */
> 10 │   readonly storeId: string;
  11 │   /** Name of the secret within the store. */
  12 │   readonly secretName: string;
  13 │ }

0.71 packages/cloudflare-runtime/src/core/platform-proxy/connect.ts:593:7
  583 │     tlsClientAuth: {
  584 │       certPresented: "0",
  585 │       certVerified: "NONE",
  586 │       certRevoked: "0",
  587 │       certIssuerDN: "",
  588 │       certSubjectDN: "",
  589 │       certIssuerDNRFC2253: "",
  590 │       certSubjectDNRFC2253: "",
  591 │       certIssuerDNLegacy: "",
  592 │       certSubjectDNLegacy: "",
> 593 │       certSerial: "",
  594 │       certIssuerSerial: "",
  595 │       certSKI: "",
  596 │       certIssuerSKI: "",
  597 │       certFingerprintSHA1: "",
  598 │       certFingerprintSHA256: "",
  599 │       certNotBefore: "",
  600 │       certNotAfter: "",
  601 │     },

0.71 packages/frontend-frameworks/src/core/DevChild.ts:62:5
  50 │ export interface DevChildPayload {
  51 │   /**
  52 │    * Framework-integration module specifier (e.g.
  53 │    * `"@alchemy.run/frontend-frameworks/waku"`). Imported by the runner —
  54 │    * a bare self-reference resolves within this package.
  55 │    */
  56 │   readonly module: string;
  57 │   /** JSON-serializable options handed to the module's `make(...)`. */
  58 │   readonly makeOptions: Record<string, unknown>;
  59 │   /** Options handed to the built service's `dev(...)`. */
  60 │   readonly devOptions: {
  61 │     readonly root: string;
> 62 │     readonly port?: number | undefined;
  63 │     readonly host?: string | undefined;
  64 │   };
  65 │ }
````
