# data/records-are-schema-classes

Domain records must be defined with Schema.Class, never with a plain interface or type alias.

The preset words it differently now: Domain records should be defined with Schema.Class, and should not be plain interfaces or type aliases.

332 findings, from 0.92 down to 0.71. Each showed this hint:

```ts
export class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.Date,
}) {
  get displayName() {
    return `${this.name} (${this.email})`;
  }
}
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.92 packages/alchemy/src/Prisma/Types.ts:31:1
> 31 │ export interface ResourceRef {
  32 │   id: string;
  33 │   url: string;
  34 │   name: string;
  35 │ }

0.92 packages/alchemy/test/Fly/fixtures/transport.ts:182:21
  181 │                   } catch {
> 182 │                     // Response bytes are never altered to accommodate the observer.
  183 │                   }
  184 │                 }
  185 │                 record({ ...completed, stage: "completed" });

0.91 packages/alchemy/src/Report.ts:217:1
> 217 │ export interface NukeResourceDeleted {
  218 │   readonly _tag: "nuke.resource.deleted";
  219 │   readonly provider: string;
  220 │   /** Display name of the deleted resource. */
  221 │   readonly resource: string;
  222 │ }

0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/types.ts:1:1
> 1 │ export interface LegacyRow extends Record<string, string | number | null> {
  2 │   id: string;
  3 │   run_at: number;
  4 │   repeat_ms: number | null;
  5 │   payload: string;
  6 │ }

0.90 packages/alchemy/src/Git/Store/HeadSnapshot.ts:18:1
  15 │ import type { BundleInfo } from "../Jobs/Bundle.ts";
  16 │
  17 │ /** One advertised ref (peeled target present for annotated tags). */
> 18 │ export interface HeadRef {
  19 │   readonly name: string;
  20 │   readonly oid: string;
  21 │   readonly peeled?: string | undefined;
  22 │ }

0.89 packages/alchemy-test/src/Model.ts:15:1
  12 │ export type Mode = "run" | "skip" | "only" | "todo";
  13 │
  14 │ /** A single log line captured from a test's Effect Logger or Console. */
> 15 │ export interface LogEntry {
  16 │   readonly level: string;
  17 │   readonly message: string;
  18 │   readonly time: Date;
  19 │ }

0.89 packages/alchemy/src/Neon/PostgresOrigin.ts:15:1
> 15 │ export type PostgresOrigin = {
  16 │   scheme: "postgres" | "postgresql" | "mysql";
  17 │   host: string;
  18 │   port: number;
  19 │   database: string;
  20 │   user: string;
  21 │   password: Redacted.Redacted<string>;
  22 │ };

0.89 packages/alchemy/src/Planetscale/Postgres/PostgresOrigin.ts:8:1
>  8 │ export type PostgresOrigin = {
   9 │   scheme: "postgres" | "postgresql";
  10 │   host: string;
  11 │   port: number;
  12 │   database: string;
  13 │   user: string;
  14 │   password: Redacted.Redacted<string>;
  15 │ };

0.88 packages/alchemy/src/Alchemist/routes/drift.ts:8:1
   5 │ import { open, type Session, type StackTarget } from "../Session.ts";
   6 │ import * as Stack from "./stack.ts";
   7 │
>  8 │ export interface DriftedResource {
   9 │   readonly fqn: string;
  10 │   readonly logicalId: string;
  11 │   readonly resourceType: string;
  12 │   readonly status: "in-sync" | "drifted" | "missing";
  13 │   readonly actual?: unknown;
  14 │ }

0.88 packages/alchemy/src/Auth/Inspect.ts:18:1
> 18 │ export interface ProviderConnection {
  19 │   readonly name: string;
  20 │   /** How credentials were supplied (`oauth`, `api-token`, …). */
  21 │   readonly method: string;
  22 │   readonly status:
  23 │     | "connected"
  24 │     | "needs-reauth"
  25 │     | "needs-reconfigure"
  26 │     | "invalid"
  27 │     | "unavailable";
  28 │   readonly details: ReadonlyArray<ProviderDetailLine>;
  29 │   /** Present whenever `status` is anything but `connected`. */
  30 │   readonly diagnostic?: {
  31 │     readonly severity: "warning" | "error";
  32 │     readonly code: string;
  33 │     readonly message: string;
  34 │   };
  35 │ }

0.88 packages/alchemy/src/Cloudflare/AnalyticsEngine/Dataset.ts:42:1
> 42 │ export type Dataset = {
  43 │   kind: TypeId;
  44 │   name: string;
  45 │   dataset: string;
  46 │ };

0.88 packages/alchemy/src/Prisma/Internal/Observed.ts:15:1
> 15 │ export interface ObservedEndpoint {
  16 │   readonly host?: string;
  17 │   readonly connectionString?: string | Redacted.Redacted<string> | undefined;
  18 │ }

0.88 packages/alchemy/src/Railway/ServiceDomain.ts:133:2
  129 │ /**
  130 │  * Remove the owned generated domain. Environment config is the source of
  131 │  * truth (`serviceDomains[id]: null`); GraphQL delete is the fallback.
  132 │  * Matches the recorded id and, if that id is missing from the live list,
> 133 │  * the recorded hostname — never every generated domain.

0.87 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:19:1
  16 │ import * as CloudflareCredentials from "../../Cloudflare/Credentials.ts";
  17 │ import { AlchemistInvalidInput, type Diagnostic } from "../Errors.ts";
  18 │
> 19 │ export interface GlobalCredentials {
  20 │   readonly email: string;
  21 │   readonly apiKey: Redacted.Redacted<string>;
  22 │ }

0.87 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:23:1
  20 │ import type { FunctionImageConfig } from "./Function.ts";
  21 │
  22 │ /** A Lambda container image built from a local Docker context. */
> 23 │ export interface FunctionDockerImageSource extends FunctionImageConfig {
  24 │   uri?: never;
  25 │   /** Docker build context directory. */
  26 │   context: string;
  27 │   /** Dockerfile path, relative to {@link context} unless absolute. */
  28 │   dockerfile: string;
  29 │   /**
  30 │    * Docker build arguments (`--build-arg`).
  31 │    *
  32 │    * Build arguments are stored in deployment state and may be retained in
  33 │    * image layers. Do not use them for secrets.
  34 │    */
  35 │   buildArgs?: Record<string, string>;
  36 │ }

0.87 packages/alchemy/src/Git/Protocol/Store.ts:35:1
> 35 │ export interface ObjectMeta {
  36 │   readonly oid: Oid;
  37 │   readonly type: ObjectType;
  38 │   /** Uncompressed size in bytes. */
  39 │   readonly size: number;
  40 │   /** Stored (zlib-compressed) size in bytes. */
  41 │   readonly zsize: number;
  42 │   /** Storage tier the zdata lives in. */
  43 │   readonly location: ObjectLocation;
  44 │ }

0.87 packages/alchemy/src/Neon/AIGateway.ts:33:1
> 33 │ export interface AIGateway {
  34 │   /** Construct identity, used for deterministic binding names. */
  35 │   readonly FQN: string;
  36 │   /** Local construct identity. */
  37 │   readonly LogicalId: string;
  38 │   /** Declared scope and credential, retained for binding identity. */
  39 │   readonly Props: AIGatewayProps;
  40 │   /** Endpoint's owning project. */
  41 │   readonly projectId: Output.Output<string>;
  42 │   /** Endpoint's owning branch. */
  43 │   readonly branchId: Output.Output<string>;
  44 │   /** Gateway root, before the chat or Responses dialect path. */
  45 │   readonly baseUrl: Output.Output<string>;
  46 │   /** Optional explicit credential; never an account deployment API key. */
  47 │   readonly credential: Credential | undefined;
  48 │ }

0.87 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:9:1
   7 │ const READ_CHUNK_BYTES = 64 * 1024;
   8 │
>  9 │ export interface VerifiedFile {
  10 │   readonly _tag: "VerifiedFile" | "ArtifactFile";
  11 │   readonly path: string;
  12 │   readonly size: number;
  13 │   readonly mode: number;
  14 │   readonly identity: {
  15 │     readonly dev: string;
  16 │     readonly ino: string;
  17 │     readonly size: string;
  18 │     readonly mtimeNs: string;
  19 │     readonly ctimeNs: string;
  20 │   };
  21 │ }

0.87 packages/alchemy/src/SQL/SqlFile.ts:6:1
   3 │ import * as FileSystem from "effect/FileSystem";
   4 │ import * as Path from "effect/Path";
   5 │
>  6 │ export interface SqlFile {
   7 │   id: string;
   8 │   sql: string;
   9 │   hash: string;
  10 │ }

0.87 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:1:1
> 1 │ export interface Widget {
  2 │   readonly id: string;
  3 │   readonly name: string;
  4 │ }

0.87 packages/frontend-frameworks/fixtures/sveltekit-spa/src/lib/widgets.ts:6:1
> 6 │ export interface Widget {
  7 │   readonly id: string;
  8 │   readonly name: string;
  9 │ }

0.86 packages/alchemy/src/AWS/AccessAnalyzer/FindingsEventSource.ts:16:1
> 16 │ export interface FindingDetail {
  17 │   /** Version of the finding event schema. */
  18 │   version?: string;

0.86 packages/alchemy/src/AWS/StepFunctions/Asl/Node.ts:19:1
> 19 │ export interface InvokableFunction {
  20 │   readonly LogicalId: string;
  21 │   readonly functionArn: Output.Output<string, any> | string;
  22 │ }

0.85 packages/alchemy/src/AWS/FraudDetector/PredictionEventSource.ts:15:1
> 15 │ export interface PredictionEventDetail {
  16 │   /** Id of the evaluated event. */
  17 │   eventId?: string;
  18 │   /** Name of the event type the event belongs to. */
  19 │   eventTypeName?: string;
  20 │   /** Id of the detector that produced the prediction. */
  21 │   detectorId?: string;
  22 │   /** Version of the detector that produced the prediction. */
  23 │   detectorVersionId?: string;
  24 │   /** ISO-8601 timestamp of the evaluated event. */
  25 │   eventTimestamp?: string;
  26 │   /** Entities the event was recorded against. */
  27 │   entities?: ReadonlyArray<Record<string, unknown>>;
  28 │   /** Variable values the prediction was computed from. */
  29 │   eventVariables?: Record<string, unknown>;
  30 │   /** Matched-rule results, including the returned outcomes. */
  31 │   ruleResults?: ReadonlyArray<Record<string, unknown>>;
  32 │   /** Model scores, when the detector uses models. */
  33 │   modelScores?: ReadonlyArray<Record<string, unknown>>;
  34 │   /** Additional event fields (the schema grows over time). */
  35 │   [key: string]: unknown;
  36 │ }

0.85 packages/alchemy/src/Axiom/Chart.ts:36:1
> 36 │ export interface BaseChart {
  37 │   readonly id: string;
  38 │   readonly name: string;
  39 │   readonly type: ChartKind;
  40 │   readonly query: { readonly apl: string };
  41 │ }

0.85 packages/alchemy/src/Git/Protocol/ReceivePack.ts:69:1
> 69 │ export interface RefCommand {
  70 │   readonly oldOid: Oid;
  71 │   readonly newOid: Oid;
  72 │   readonly ref: string;
  73 │ }

0.85 packages/alchemy/src/Planetscale/MySQL/MySQLOrigin.ts:8:1
>  8 │ export type MySQLOrigin = {
   9 │   scheme: "mysql";
  10 │   host: string;
  11 │   port: number;
  12 │   database: string;
  13 │   user: string;
  14 │   password: Redacted.Redacted<string>;
  15 │ };

0.85 packages/alchemy/src/Prisma/PrismaLogs.ts:42:1
> 42 │ export type PrismaDeploymentLogRecord =
  43 │   | PrismaDeploymentLogLine
  44 │   | PrismaDeploymentTerminalLine;

0.85 packages/alchemy/src/SQL/Migrations/Convert.ts:15:1
> 15 │ export interface ConvertedRow {
  16 │   name: string;
  17 │   hash: string | undefined;
  18 │   createdAtMillis: number | undefined;
  19 │   appliedAt: string | undefined;
  20 │ }

0.84 packages/alchemy/src/Fly/Deployment.ts:39:1
> 39 │ export interface DeploymentPolicy {
  40 │   bluegreen: boolean;
  41 │   healthTimeoutMs: number;
  42 │   shutdown:
  43 │     | {
  44 │         signal: Exclude<FlyStopConfigSignal, "SIGKILL">;
  45 │         timeout: string;
  46 │         timeoutMs: number;
  47 │       }
  48 │     | undefined;
  49 │ }

0.84 packages/alchemy/src/SQL/Migrations/Format.ts:9:1
   6 │ /**
   7 │  * A single migration read from disk, normalized across directory layouts.
   8 │  */
>  9 │ export interface MigrationRecord {
  10 │   /**
  11 │    * The bookkeeping key used for applied-detection. Layout-dependent: the
  12 │    * directory name for drizzle-kit/Prisma-layout dirs
  13 │    * (`20260721033159_init`), the relative file path for flat dirs
  14 │    * (`0001_users.sql`).
  15 │    */
  16 │   name: string;
  17 │   /** sha256 hex of the raw file content. */
  18 │   hash: string;
  19 │   /**
  20 │    * Millis derived from a 14-digit `YYYYMMDDHHMMSS` prefix when present.
  21 │    */
  22 │   createdAtMillis: number | undefined;
  23 │   /** Raw file content. */
  24 │   sql: string;
  25 │   /** Individual statements (split on `--> statement-breakpoint`). */
  26 │   statements: string[];
  27 │ }

0.84 packages/alchemy/src/State/ResourceState.ts:30:1
> 30 │ interface BaseResourceState {

0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:483:15
  480 │               yield* onArchive.schedule("observed", {
  481 │                 at,
  482 │                 payload: { value: "observed" },
> 483 │               });
  484 │               values.push(yield* storage.getAlarm());
  485 │               yield* onArchive.cancel("observed");
  486 │               values.push(yield* txn.getAlarm());

0.83 packages/alchemy/src/Alchemist/routes/logs.ts:11:1
   8 │ import { AlchemistInvalidInput } from "../Errors.ts";
   9 │ import { open, type StackTarget } from "../Session.ts";
  10 │
> 11 │ export interface ResourceIdentity {
  12 │   readonly fqn: string;
  13 │   readonly logicalId: string;
  14 │   readonly resourceType: string;
  15 │ }

0.83 packages/alchemy/src/Alchemist/routes/profile.ts:22:1
  21 │ /** Which project/profile pair a provider-scoped route resolves against. */
> 22 │ export interface ProviderContext extends Target {
  23 │   readonly profile: string;
  24 │ }

0.83 packages/alchemy/src/AWS/AutoScaling/InstanceEventSource.ts:23:1
> 23 │ export interface InstanceEventDetail {

0.83 packages/alchemy/src/AWS/Connection/internal.ts:9:1
>  9 │ export interface SqlConnectionInfo {
  10 │   /** Endpoint hostname. */
  11 │   host: string;
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

0.83 packages/alchemy/src/AWS/EMRContainers/JobTemplate.ts:42:1
> 42 │ export interface JobTemplateJobDriver {
  43 │   /**
  44 │    * The Spark submit job driver.
  45 │    */
  46 │   sparkSubmitJobDriver?: JobTemplateSparkSubmitJobDriver;
  47 │   /**
  48 │    * The Spark SQL job driver.
  49 │    */
  50 │   sparkSqlJobDriver?: JobTemplateSparkSqlJobDriver;
  51 │ }

0.83 packages/alchemy/src/AWS/InternetMonitor/HealthEventSource.ts:15:1
> 15 │ export interface HealthEventDetail {
  16 │   /** The ARN of the health event. */
  17 │   eventArn?: string;
  18 │   /** The id of the health event. */
  19 │   eventId?: string;
  20 │   /** Human-readable summary of the health event. */
  21 │   summary?: string;
  22 │   /** When the health event started (ISO 8601). */
  23 │   startedAt?: string;
  24 │   /** When the health event ended, for resolved events (ISO 8601). */
  25 │   endedAt?: string;
  26 │   /**
  27 │    * The impact type: `AVAILABILITY`, `PERFORMANCE`, `LOCAL_AVAILABILITY`,
  28 │    * or `LOCAL_PERFORMANCE`.
  29 │    */
  30 │   impactType?: string;
  31 │   /** The health event status: `ACTIVE` or `RESOLVED`. */
  32 │   status?: string;
  33 │   /** Percentage of the application's total traffic that is impacted. */
  34 │   percentOfTotalTrafficImpacted?: number;
  35 │   /** The client city-networks impacted by the health event. */
  36 │   impactedLocations?: unknown[];
  37 │   /** Additional event fields (the schema grows over time). */
  38 │   [key: string]: unknown;
  39 │ }

0.83 packages/alchemy/src/AWS/Lambda/MicrovmRpc.ts:11:1
> 11 │ export interface MicrovmConnection {
  12 │   /**
  13 │    * The MicroVM endpoint hostname (no scheme), e.g.
  14 │    * `<id>.lambda-microvm.<region>.on.aws` — from `RunMicrovm`'s response.
  15 │    */
  16 │   endpoint: string;
  17 │   /**
  18 │    * The auth token from `CreateAuthToken` — a map of header name → value that
  19 │    * authorizes requests to the MicroVM endpoint (the AWS proxy validates them).
  20 │    * Values may be {@link Redacted.Redacted}.
  21 │    */
  22 │   authToken: Record<string, string | Redacted.Redacted<string> | undefined>;
  23 │ }

0.83 packages/alchemy/src/Docker/Registry.ts:3:1
   1 │ import type * as Redacted from "effect/Redacted";
   2 │
>  3 │ export interface ImageRegistry {
   4 │   /** Registry host, e.g. `ghcr.io`. */
   5 │   server: string;
   6 │   /** Registry username. */
   7 │   username: string;
   8 │   /** Registry password. Use `Redacted.make(...)` or `Config.Redacted(...)`. */
   9 │   password: Redacted.Redacted<string>;
  10 │ }

0.83 packages/alchemy/src/Git/Hasher/LambdaEvent.ts:28:1
  25 │ /** Raw bytes the encoded scan may carry before demotion (base64 adds a third). */
  26 │ export const RESPONSE_BUDGET_BYTES = 4 * 1024 * 1024;
  27 │
> 28 │ export interface HashEvent {
  29 │   readonly alchemyGitHash: 1;
  30 │   readonly base: number;
  31 │   readonly remaining: number;
  32 │   readonly max: number;
  33 │   readonly resync: boolean;
  34 │   readonly skip: number;
  35 │   /** The chunk, base64. */
  36 │   readonly payload: string;
  37 │ }

0.83 packages/alchemy/src/Git/Http/ReceivePack.ts:20:1
  18 │ export { ReceivePack as endpoint } from "../Api/Protocol.ts";
  19 │
> 20 │ export interface Push {
  21 │   readonly _tag: "Push";
  22 │   readonly input: PushInput;
  23 │   readonly updates: PushInput["updates"];
  24 │   readonly capabilities: ReadonlySet<string>;
  25 │ }

0.83 packages/alchemy/src/Git/Store/Sql.ts:241:1
  240 │ /** One Registry `repos` row. */
> 241 │ export interface RegistryRepoRow extends Record<string, SqlStorageValue> {
  242 │   readonly owner: string;
  243 │   readonly name: string;
  244 │   readonly repo_id: string;
  245 │   readonly description: string | null;
  246 │   readonly fork_of: string | null;
  247 │   readonly fork_count: number;
  248 │   readonly created_at: number;
  249 │   readonly deleted_at: number | null;
  250 │   /** Denormalised from the Repo DO — see the DDL comment. */
  251 │   readonly default_branch: string;
  252 │   readonly read_only: number;
  253 │   readonly is_public: number;
  254 │   readonly status: string;
  255 │ }

0.83 packages/alchemy/src/Hetzner/Firewall.ts:108:1
> 108 │ export interface Firewall extends Resource<
  109 │   "Hetzner.Firewall",
  110 │   FirewallProps,

0.83 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:35:1
  33 │ export type FunctionTriggerEnvelope = typeof FunctionTriggerEnvelope.Type;
  34 │
> 35 │ export interface CronEvent {
  36 │   /** Stable occurrence ID for application idempotency. */ invocationId: string;
  37 │   /** Project-wide trigger identifier. */ triggerId: string;
  38 │   /** Trigger name. */ name: string;
  39 │   /** UTC scheduled time. */ scheduledAt: string;
  40 │ }

0.83 packages/alchemy/src/Prisma/BucketTypes.ts:20:1
> 20 │ export interface BucketObject {
  21 │   /**
  22 │    * Object key within the bucket.
  23 │    */
  24 │   key: string;
  25 │   /**
  26 │    * Size of the stored object in bytes.
  27 │    */
  28 │   size: number;
  29 │   /**
  30 │    * Entity tag of the stored object, without the surrounding quotes.
  31 │    */
  32 │   etag: string;
  33 │   /**
  34 │    * When the object was last written, when the store reports it.
  35 │    */
  36 │   lastModified: Date | undefined;
  37 │   /**
  38 │    * `Content-Type` the object was stored with, when set.
  39 │    */
  40 │   contentType: string | undefined;
  41 │   /**
  42 │    * User-defined metadata stored alongside the object.
  43 │    */
  44 │   metadata: Record<string, string>;
  45 │ }

0.83 packages/alchemy/src/Prisma/PostgresOrigin.ts:15:1
> 15 │ export type PostgresOrigin = {
  16 │   scheme: "postgres" | "postgresql";
  17 │   host: string;
  18 │   port: number;
  19 │   database: string;
  20 │   user: string;
  21 │   password: Redacted.Redacted<string>;
  22 │ };

0.82 packages/alchemy/src/Auth/Demand.ts:82:3
  80 │ export interface CredentialDemand {
  81 │   readonly provider: string;
> 82 │   readonly resources: readonly DemandingResource[];
  83 │ }

0.82 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalingActivityEventSource.ts:17:1
> 17 │ export interface ScalingActivityEventDetail {

0.82 packages/alchemy/src/AWS/EC2/InstanceEventSource.ts:25:1
> 25 │ export interface InstanceStateChangeDetail {
  26 │   /**
  27 │    * ID of the instance that changed state.
  28 │    */
  29 │   "instance-id": string;
  30 │   /**
  31 │    * The state the instance transitioned into.
  32 │    */
  33 │   state: InstanceState;
  34 │ }

0.82 packages/alchemy/src/AWS/ECR/ImageActionEventSource.ts:13:1
> 13 │ export interface ImageActionDetail {
  14 │   /** Whether the action was a `PUSH` or a `DELETE`. */
  15 │   "action-type": "PUSH" | "DELETE";
  16 │   /** Outcome of the action (`SUCCESS` or `FAILURE`). */
  17 │   result: "SUCCESS" | "FAILURE";
  18 │   /** Name of the repository the image was pushed to / deleted from. */
  19 │   "repository-name": string;
  20 │   /** Manifest digest of the affected image, e.g. `sha256:…`. */
  21 │   "image-digest": string;
  22 │   /** Tag of the affected image, when the action targeted a tag. */
  23 │   "image-tag"?: string;
  24 │   /** Media type of the manifest, e.g. `application/vnd.docker.distribution.manifest.v2+json`. */
  25 │   "manifest-media-type"?: string;
  26 │   /** Artifact media type, for OCI artifacts. */
  27 │   "artifact-media-type"?: string;
  28 │   /** Additional event fields (the schema grows over time). */
  29 │   [key: string]: unknown;
  30 │ }

0.82 packages/alchemy/src/AWS/LexV2/CodeHookEventSource.ts:9:1
>  9 │ export interface CodeHookIntent {
  10 │   /** Name of the intent. */
  11 │   name: string;
  12 │   /** Slot values gathered so far (`slotName` → value or `null`). */
  13 │   slots?: Record<string, unknown>;
  14 │   /** `InProgress` | `ReadyForFulfillment` | `Fulfilled` | `Failed` | ... */
  15 │   state?: string;
  16 │   /** How the intent was matched (`Confirmed`/`Denied`/`None`). */
  17 │   confirmationState?: string;
  18 │ }

0.82 packages/alchemy/src/AWS/OpenSearch/DataPlaneTypes.ts:27:1
  24 │ export type RefreshOption = boolean | "wait_for";
  25 │
  26 │ /** One search hit: index, id, relevance score, and the stored document. */
> 27 │ export interface SearchHit<TDoc = unknown> {
  28 │   _index: string;
  29 │   _id: string;
  30 │   _score: number | null;
  31 │   _source: TDoc;
  32 │ }

0.82 packages/alchemy/src/Cloudflare/Workers/Assets.ts:33:1
> 33 │ export interface AssetsConfig {

0.82 packages/alchemy/src/Docker/BuildHash.ts:271:3
  244 │ export const selectDockerBuildContext = Effect.fn(function* (
  245 │   source: Pick<DockerBuildSource, "context" | "dockerfile">,
  246 │ ) {
  247 │   const path = yield* Path.Path;
  248 │   const { context, dockerfile } = yield* resolveDockerBuildPaths(source);
  249 │   const dockerignore = yield* resolveDockerIgnore({ context, dockerfile });
  250 │   const relativeDockerfile = normalizeRelativePath(
  251 │     path.relative(context, dockerfile),
  252 │   );
  253 │   const dockerfilePath =
  254 │     relativeDockerfile === ".." ||
  255 │     relativeDockerfile.startsWith("../") ||
  256 │     path.isAbsolute(relativeDockerfile)
  257 │       ? undefined
  258 │       : relativeDockerfile;
  259 │
  260 │   return {
  261 │     context,
  262 │     dockerfile,
  263 │     dockerfilePath,
  264 │     includes: (relativePath: string) => {
  265 │       const normalized = normalizeRelativePath(relativePath);
  266 │       if (normalized === dockerfilePath || normalized === dockerignore?.path) {
  267 │         return true;
  268 │       }
  269 │       return !isDockerIgnored(normalized, dockerignore?.rules ?? []);
  270 │     },
> 271 │   } satisfies DockerBuildContextSelection;
  272 │ });

0.82 packages/alchemy/src/Neon/BranchScope.ts:19:1
> 19 │ export interface ResolvedBranchScope {
  20 │   /** Neon project ID. */
  21 │   projectId: string;
  22 │   /** Neon branch ID. */
  23 │   branchId: string;
  24 │ }

0.82 packages/alchemy/src/State/Export.ts:9:1
>  9 │ export interface ExportedResource {
  10 │   /** Stack the record belongs to. */
  11 │   stack: string;
  12 │   /** Stage the record belongs to. */
  13 │   stage: string;
  14 │   /** Fully-qualified resource name (namespace path + logical ID). */
  15 │   fqn: string;
  16 │   /** The persisted record — the same value `state.get` returns. */
  17 │   state: PersistedState;
  18 │ }

0.81 packages/alchemy/src/AWS/B2BI/TransformationEventSource.ts:10:1
   9 │ /** S3 object attributes attached to B2BI EventBridge event details. */
> 10 │ export interface TransformationFileS3Attributes {
  11 │   /** The bucket containing the object. */
  12 │   bucket?: string;
  13 │   /** The object's key. */
  14 │   "object-key"?: string;
  15 │   /** The object's size in bytes. */
  16 │   "object-size-bytes"?: number;
  17 │ }

0.81 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:122:1
> 122 │ export interface BudgetAction extends Resource<
  123 │   "AWS.Budgets.BudgetAction",
  124 │   BudgetActionProps,
  125 │   {
  126 │     /**
  127 │      * The system-generated ID of the action.
  128 │      */
  129 │     actionId: string;
  130 │     /**
  131 │      * Name of the budget the action belongs to.
  132 │      */
  133 │     budgetName: string;
  134 │     /**
  135 │      * The AWS account ID that owns the action.
  136 │      */
  137 │     accountId: string;
  138 │     /**
  139 │      * ARN of the action, e.g.
  140 │      * `arn:aws:budgets::123456789012:budget/my-budget/action/abc123`.
  141 │      */
  142 │     actionArn: string;
  143 │   },
  144 │   never,
  145 │   Providers
  146 │ > {}

0.81 packages/alchemy/src/AWS/CloudTrail/ApiCallEventSource.ts:14:1
> 14 │ export interface ApiCallDetail {
  15 │   /** The service endpoint the call was made to, e.g. `s3.amazonaws.com`. */
  16 │   eventSource: string;
  17 │   /** The API operation name, e.g. `PutBucketTagging`. */
  18 │   eventName: string;
  19 │   /** The region the call was made in. */
  20 │   awsRegion?: string;
  21 │   /** Unique id of the CloudTrail event record. */
  22 │   eventID?: string;
  23 │   /** ISO timestamp of the call. */
  24 │   eventTime?: string;
  25 │   /** Version of the CloudTrail event schema. */
  26 │   eventVersion?: string;
  27 │   /** Identity that made the call (IAM user, role session, service, …). */
  28 │   userIdentity?: Record<string, unknown>;
  29 │   /** The request parameters of the call, as recorded by CloudTrail. */
  30 │   requestParameters?: Record<string, any>;
  31 │   /** The response elements of the call (mutating calls only). */
  32 │   responseElements?: Record<string, any> | null;
  33 │   /** Error code when the recorded call failed. */
  34 │   errorCode?: string;
  35 │   /** Error message when the recorded call failed. */
  36 │   errorMessage?: string;
  37 │   /** Additional event fields (the schema grows over time). */
  38 │   [key: string]: unknown;
  39 │ }

0.81 packages/alchemy/src/AWS/DMS/ReplicationEventSource.ts:14:1
> 14 │ export interface DmsReplicationEventDetail {
  15 │   /** The DMS event categories, e.g. `["failure"]`, `["state change"]`. */
  16 │   category?: string;
  17 │   /** The DMS event id, e.g. `DMS-EVENT-0079`. */
  18 │   eventId?: string;
  19 │   /** The event message, e.g. `Replication task has stopped.`. */
  20 │   eventMessage?: string;
  21 │   /** Human-readable event type, e.g. `REPLICATION_TASK_STOPPED`. */
  22 │   eventType?: string;
  23 │   /** The source identifier (instance or task identifier). */
  24 │   sourceId?: string;
  25 │   /** Additional event fields (the schema grows over time). */
  26 │   [key: string]: unknown;
  27 │ }

0.81 packages/alchemy/src/AWS/Lambda/EventInvokeConfig.ts:17:1
> 17 │ export interface EventInvokeConfig {
  18 │   /**
  19 │    * Maximum number of times Lambda retries an asynchronous invocation.
  20 │    * @default 2
  21 │    */
  22 │   maximumRetryAttempts?: number;
  23 │   /**
  24 │    * Maximum age that Lambda retains an asynchronous event (e.g. `"6 hours"`).
  25 │    * Rounded to whole seconds on the wire.
  26 │    * @default "6 hours"
  27 │    */
  28 │   maximumEventAge?: Duration.Input;
  29 │   /**
  30 │    * Destinations for successful or failed asynchronous invocation records.
  31 │    */
  32 │   destinationConfig?: Lambda.DestinationConfig;
  33 │ }

0.81 packages/alchemy/src/Git/Jobs/Bundle.ts:39:1
  36 │ import { sidebandFramedLength, sidebandRechunk } from "../Protocol/Sideband.ts";
  37 │
  38 │ /** A ref as it appears in a bundle's covered snapshot. */
> 39 │ export interface BundleRef {
  40 │   readonly name: string;
  41 │   readonly oid: string;
  42 │ }

0.81 packages/cloudflare-runtime/src/internal/workflows-shared/instance.ts:11:1
   9 │ import type { WorkflowEvent } from "cloudflare:workers";
  10 │
> 11 │ export type Instance = {
  12 │   id: string;
  13 │   created_on: string;
  14 │   modified_on: string;
  15 │   workflow_id: string;
  16 │   version_id: string;
  17 │   status: InstanceStatus;
  18 │   started_on: string | null;
  19 │   ended_on: string | null;
  20 │ };

0.80 packages/alchemy/src/Alchemist/routes/provider.ts:15:1
> 15 │ export interface CheckEnvironmentInput extends Target {
  16 │   /** Providers to check. Omitted means every registered provider. */
  17 │   readonly providers?: ReadonlyArray<string>;
  18 │ }

0.80 packages/alchemy/src/AWS/AMP/PrometheusTypes.ts:32:1
  29 │ export type PrometheusTime = Date | number | string;
  30 │
  31 │ /** One instant-vector sample: metric labels plus a `[unixSeconds, value]` pair. */
> 32 │ export interface PrometheusSample {
  33 │   metric: Record<string, string>;
  34 │   value: [number, string];
  35 │ }

0.80 packages/alchemy/src/AWS/AutoScaling/LifecycleHookEventSource.ts:20:1
> 20 │ export interface LifecycleActionDetail {

0.80 packages/alchemy/src/AWS/CostExplorer/AnomalyEventSource.ts:15:1
> 15 │ export interface AnomalyEventDetail {
  16 │   /** Id of the detected anomaly (usable with `ProvideAnomalyFeedback`). */
  17 │   anomalyId?: string;

0.80 packages/alchemy/src/AWS/DynamoDB/Expr.ts:11:1
   9 │ //
  10 │
> 11 │ export interface NameRef<Name extends string = string> {
  12 │   kind: "name-ref";
  13 │   name: Name;
  14 │ }

0.80 packages/alchemy/src/AWS/EC2/ClientVpnAuthorizationRule.ts:263:11
  237 │         diff: Effect.fn(function* ({ olds, news }) {
  238 │           if (!isResolved(news)) {
  239 │             return { action: "replace", deleteFirst: true };
  240 │           }
  241 │           const sameKey =
  242 │             news.clientVpnEndpointId === olds.clientVpnEndpointId &&
  243 │             canonicalCidr(news.targetNetworkCidr) ===
  244 │               canonicalCidr(olds.targetNetworkCidr) &&
  245 │             news.accessGroupId === olds.accessGroupId &&
  246 │             (news.authorizeAllGroups ?? false) ===
  247 │               (olds.authorizeAllGroups ?? false);
  248 │           if (
  249 │             !sameKey ||
  250 │             news.targetNetworkCidr !== olds.targetNetworkCidr ||
  251 │             news.authorizeAllGroups !== olds.authorizeAllGroups ||
  252 │             news.description !== olds.description
  253 │           ) {
  254 │             return { action: "replace", deleteFirst: sameKey };
  255 │           }
  256 │           const rule = yield* findRule(news);
  257 │           if (!rule) return { action: "update" };
  258 │           if (
  259 │             (rule.Description ?? "") !== (news.description ?? "") ||
  260 │             rule.Status?.Code === "failed"
  261 │           ) {
  262 │             return { action: "replace", deleteFirst: true };
> 263 │           }
  264 │           if (rule.Status?.Code !== "active") return { action: "update" };
  265 │         }),

0.80 packages/alchemy/src/AWS/EC2/Instance.ts:141:3
  139 │ export interface Instance extends Resource<
  140 │   "AWS.EC2.Instance",
> 141 │   InstanceProps,

0.80 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:121:1
  118 │ /**
  119 │  * Experiment log delivery configuration.
  120 │  */
> 121 │ export interface ExperimentTemplateLogConfiguration {
  122 │   /**
  123 │    * Deliver experiment logs to a CloudWatch Logs log group.
  124 │    */
  125 │   cloudWatchLogsConfiguration?: {
  126 │     /**
  127 │      * The ARN of the destination log group.
  128 │      */
  129 │     logGroupArn: string;
  130 │   };
  131 │   /**
  132 │    * Deliver experiment logs to an S3 bucket.
  133 │    */
  134 │   s3Configuration?: {
  135 │     /**
  136 │      * The name of the destination bucket.
  137 │      */
  138 │     bucketName: string;
  139 │     /**
  140 │      * The bucket prefix for delivered log objects.
  141 │      */
  142 │     prefix?: string;
  143 │   };
  144 │   /**
  145 │    * The schema version of delivered log records.
  146 │    * @default 2
  147 │    */
  148 │   logSchemaVersion?: number;
  149 │ }

0.80 packages/alchemy/src/AWS/Logs/LogGroupEventSource.ts:48:1
> 48 │ export interface LogEventRecord {
  49 │   /** Unique identifier of the log event. */
  50 │   id: string;
  51 │   /** Event timestamp (epoch milliseconds). */
  52 │   timestamp: number;
  53 │   /** The raw log line. */
  54 │   message: string;
  55 │   /** Name of the log group the event came from. */
  56 │   logGroup: string;
  57 │   /** Name of the log stream the event came from. */
  58 │   logStream: string;
  59 │   /** AWS account id that owns the source log group. */
  60 │   owner: string;
  61 │   /** Names of the subscription filters that matched the event. */
  62 │   subscriptionFilters: string[];
  63 │ }

0.80 packages/alchemy/src/AWS/MQ/Broker.ts:45:1
> 45 │ export interface BrokerConfigurationRef {
  46 │   /** The configuration id (`configurationId` attribute of a Configuration). */
  47 │   id: string;
  48 │   /** The revision number to apply. */
  49 │   revision?: number;
  50 │ }

0.80 packages/alchemy/src/AWS/OpenSearch/DomainEventSource.ts:14:1
> 14 │ export interface DomainEventDetail {
  15 │   /** The event that occurred, e.g. `"Service Software Update"`. */
  16 │   event?: string;
  17 │   /** Status of the event, e.g. `"Available"`, `"Completed"`, `"Failed"`. */
  18 │   status?: string;
  19 │   /** Severity of the event: `"Informational"`, `"Low"`, `"Medium"`, `"High"`. */
  20 │   severity?: string;
  21 │   /** Human-readable description of what happened. */
  22 │   description?: string;
  23 │   /** Additional event fields (the schema grows over time). */
  24 │   [key: string]: unknown;
  25 │ }

0.80 packages/alchemy/src/AWS/SES/EmailEventSource.ts:15:1
> 15 │ export interface EmailEventDetail {
  16 │   /** The event kind, e.g. `Send`, `Delivery`, `Bounce`, `Complaint`. */
  17 │   eventType?: string;
  18 │   /**
  19 │    * The original message: `messageId`, `source`, `destination`, and the
  20 │    * message `tags` (including `ses:configuration-set`).
  21 │    */
  22 │   mail?: {
  23 │     messageId?: string;
  24 │     source?: string;
  25 │     destination?: string[];
  26 │     tags?: Record<string, string[]>;
  27 │     [key: string]: unknown;
  28 │   };
  29 │   /** Bounce events: bounce type/subtype and the bounced recipients. */
  30 │   bounce?: Record<string, unknown>;
  31 │   /** Complaint events: the complained recipients and feedback type. */
  32 │   complaint?: Record<string, unknown>;
  33 │   /** Delivery events: recipients, SMTP response, processing time. */
  34 │   delivery?: Record<string, unknown>;
  35 │   /** Additional event fields (the schema grows over time). */
  36 │   [key: string]: unknown;
  37 │ }

0.80 packages/alchemy/src/Cloudflare/DNS/Record.ts:81:3
> 81 │   name: string;

0.80 packages/alchemy/src/Cloudflare/Logs.ts:13:1
  11 │ const DEFAULT_LOOKBACK_MS = 1 * 60 * 60 * 1000;
  12 │
> 13 │ export interface TelemetryFilter {
  14 │   key: string;
  15 │   operation:
  16 │     | "eq"
  17 │     | "neq"
  18 │     | "includes"
  19 │     | "not_includes"
  20 │     | "starts_with"
  21 │     | "gt"
  22 │     | "gte"
  23 │     | "lt"
  24 │     | "lte"
  25 │     | "in"
  26 │     | "not_in";
  27 │   type: "string" | "number" | "boolean";
  28 │   value?: string | number | boolean;
  29 │ }

0.80 packages/alchemy/src/Cloudflare/Organization/Organization.ts:119:1
   90 │ export interface Attributes {
   91 │   /**
   92 │    * Cloudflare-assigned identifier of the organization.
   93 │    */
   94 │   organizationId: string;
   95 │   /**
   96 │    * Display name of the organization.
   97 │    */
   98 │   name: string;
   99 │   /**
  100 │    * ISO8601 timestamp of when the organization was created.
  101 │    */
  102 │   createTime: string;
  103 │   /**
  104 │    * Who manages this organization, if it is managed by a parent entity.
  105 │    */
  106 │   managedBy: string | undefined;
  107 │   /**
  108 │    * Feature flags controlled by the organization's entitlements.
  109 │    */
  110 │   flags: Flags | undefined;
  111 │   /**
  112 │    * Parent organization, if this organization is part of a hierarchy.
  113 │    */
  114 │   parent: { id: string; name: string } | undefined;
  115 │   /**
  116 │    * Business profile of the organization, if one is set.
  117 │    */
  118 │   profile: Profile | undefined;
> 119 │ }

0.80 packages/alchemy/src/Fly/replicas.ts:82:1
> 82 │ export interface Replica {
  83 │   machineId: string;
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

0.80 packages/alchemy/src/Git/RegistryObject.ts:81:3
   79 │ /** One registry row, as returned over RPC (plain serializable data). */
   80 │ export interface RegistryEntry {
>  81 │   readonly owner: string;
   82 │   readonly name: string;
   83 │   readonly repoId: string;
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

0.80 packages/alchemy/src/Neon/FunctionTrigger.ts:41:1
> 41 │ export interface FunctionTriggerAttributes {
  42 │   /** Owning project. */ projectId: string;
  43 │   /** Owning branch. */ branchId: string;
  44 │   /** Project-wide trigger identifier. */ triggerId: string;
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

0.80 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:21:1
> 21 │ export interface OrganizationVPCEndpointAttributes {
  22 │   /** Organization containing the registration. */
  23 │   orgId: string;
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

0.80 packages/alchemy/src/State/ActionState.ts:13:1
  11 │ export type ActionStatus = ActionState["status"];
  12 │
> 13 │ interface BaseActionState {
  14 │   readonly kind: "action";
  15 │   /** Type of the Action (e.g. "NightlySync"). Mirrors `resourceType` for resources. */
  16 │   actionType: string;
  17 │   /** Namespace of the Action. */
  18 │   namespace: NamespaceNode | undefined;
  19 │   /** Fully qualified name (namespace + logical id). */
  20 │   fqn: string;
  21 │   /** Logical id of the Action (stable across runs). */
  22 │   logicalId: string;
  23 │   /** Current status. */
  24 │   status: ActionStatus;
  25 │   /** FQNs of nodes that depend on this Action's output. */
  26 │   downstream: string[];
  27 │   /** Hash of the resolved input, used to skip noop runs. */
  28 │   inputHash: string;
  29 │   /** Resolved input snapshot from the most recent attempt. */
  30 │   input: unknown;
  31 │ }

0.80 packages/alchemy/src/State/Tree.ts:41:3
  38 │ export interface StateDeleted {
  39 │   readonly _tag: "StateDeleted";
  40 │   readonly path: string;
> 41 │   readonly deleted: ReadonlyArray<string>;
  42 │ }

0.80 packages/alchemy/test/IsolatedProject.ts:38:1
> 38 │ export interface IsolatedProject {
  39 │   /** Unique project name; also the directory name under the shared root. */
  40 │   readonly name: string;
  41 │   /** Project directory (outside the repository). */
  42 │   readonly dir: string;
  43 │   /** The `main` to hand to the platform resource. */
  44 │   readonly main: string;
  45 │   /** Absolute path of the fixture module `main.ts` re-exports. */
  46 │   readonly fixture: string;
  47 │ }

0.79 packages/alchemy/src/Auth/OAuthFlow.ts:188:1
> 188 │ export const makeOAuthClient = (spec: OAuthClientSpec): OAuthClient => {
  189 │   const provideHttp = <A, E>(
  190 │     effect: Effect.Effect<A, E, HttpClient.HttpClient>,
  191 │   ) => effect.pipe(Effect.provide(FetchHttpClient.layer));

0.79 packages/alchemy/src/Auth/Profile.ts:104:1
> 104 │ export interface Profile {
  105 │   readonly id: string;
  106 │   readonly providers: Record<string, ProviderConfig>;
  107 │ }

0.79 packages/alchemy/src/AWS/CodePipeline/PipelineEventSource.ts:14:1
> 14 │ export interface PipelineEventDetail {
  15 │   /** Name of the pipeline the event belongs to. */
  16 │   pipeline?: string;
  17 │   /** Structure version of the pipeline. */
  18 │   version?: number;
  19 │   /** Id of the pipeline execution. */
  20 │   "execution-id"?: string;
  21 │   /**
  22 │    * The new state — `STARTED`, `SUCCEEDED`, `FAILED`, `CANCELED`,
  23 │    * `STOPPED`, `STOPPING`, `SUPERSEDED`, or `RESUMED`.
  24 │    */
  25 │   state?: string;
  26 │   /** Stage/action events: the stage the event belongs to. */
  27 │   stage?: string;
  28 │   /** Action events: the action the event belongs to. */
  29 │   action?: string;
  30 │   /** Pipeline events: what triggered the execution. */
  31 │   "execution-trigger"?: Record<string, unknown>;
  32 │   /** Additional event fields (the schema grows over time). */
  33 │   [key: string]: unknown;
  34 │ }

0.79 packages/alchemy/src/AWS/EC2/ClientVpnRoute.ts:307:11
  306 │           const active = yield* waitForRoute(news, false);
> 307 │           return toAttributes(news.clientVpnEndpointId, active!);
  308 │         }),

0.79 packages/alchemy/src/AWS/MedicalImaging/ImagingEventSource.ts:17:1
> 17 │ export interface MedicalImagingEventDetail {
  18 │   /** Id of the data store the event originates from. */
  19 │   datastoreId?: string;
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

0.79 packages/alchemy/src/AWS/QuickSight/AssetEventSource.ts:17:1
> 17 │ export interface QuickSightAssetEventDetail {
  18 │   /** The account the asset lives in. */
  19 │   awsAccountId?: string;
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

0.79 packages/alchemy/src/Cloudflare/Workers/DurableObjectTransactionContext.ts:5:1
   2 │ import * as Context from "effect/Context";
   3 │ import type * as Fiber from "effect/Fiber";
   4 │
>  5 │ export interface ActiveStorageTransaction {
   6 │   readonly transaction: cf.DurableObjectTransaction;
   7 │   owner: Fiber.Fiber<unknown, unknown> | undefined;
   8 │   active: boolean;
   9 │   rolledBack: boolean;
  10 │   alarmTablesEnsured: boolean;
  11 │   alarmDirty: boolean;
  12 │ }

0.79 packages/alchemy/src/Git/Jobs/Import.ts:42:1
  41 │ /** The import source, as accepted by `POST /api/v1/repos/import`. */
> 42 │ export interface ImportSource {
  43 │   /** Smart-HTTP base URL of the source repository (with or without `.git`). */
  44 │   readonly url: string;
  45 │   /** Restrict the import to a single ref (full or short name). */
  46 │   readonly ref?: string | undefined;
  47 │   /** Depth-limit the imported history (`deepen <n>`). */
  48 │   readonly depth?: number | undefined;
  49 │ }

0.79 packages/alchemy/src/Git/Protocol/PartialScan.ts:41:1
  39 │ import { ObjectTooLargeError, PackFormatError } from "./PackParser.ts";
  40 │
> 41 │ export interface ScannedEntry {
  42 │   readonly oid: Oid;
  43 │   readonly type: ObjectType;
  44 │   /** Absolute pack offset of the entry HEADER (what OFS_DELTAs point at). */
  45 │   readonly offset: number;
  46 │   /** Uncompressed size. */
  47 │   readonly size: number;
  48 │   /** Absolute pack offset of the entry's zdata (its header precedes it). */
  49 │   readonly dataOffset: number;
  50 │   /** Compressed span at `dataOffset` — verbatim for non-delta entries. */
  51 │   readonly span: number;
  52 │   /** Set for delta-resolved entries: a fresh deflate to store as the row. */
  53 │   readonly zdata?: Uint8Array | undefined;
  54 │   /** Inflated content for commits, trees and tags (the store parses them). */
  55 │   readonly content?: Uint8Array | undefined;
  56 │   /**
  57 │    * For a delta-resolved entry, its base reference — so a hasher that must
  58 │    * bound its response can demote the entry back to `unresolved`.
  59 │    */
  60 │   readonly baseOffset?: number | undefined;
  61 │   readonly baseOid?: Oid | undefined;
  62 │ }

0.79 packages/alchemy/src/Git/Protocol/UploadPack.ts:361:3
  356 │ export const handleUploadPack = (
  357 │   body: Uint8Array,
  358 │   objects: ObjectSource,
  359 │   closure: ClosureSource,
  360 │ ): Effect.Effect<
> 361 │   UploadPackResponse,
  362 │   PktLineError | ProtocolError | StoreError
  363 │ > =>
  364 │   parseUploadPackRequest(body).pipe(
  365 │     Effect.flatMap((request) => uploadPack(request, objects, closure)),
  366 │   );

0.79 packages/alchemy/src/Railway/Environment.ts:21:1
> 21 │ export type RailwayWorkspace = {
  22 │   readonly id: string;
  23 │   readonly name: string;
  24 │ };

0.79 packages/pkg/src/cli/pack.ts:21:3
  16 │ import {
  17 │   GroupName,
  18 │   MANIFEST_FILE,
  19 │   ManifestJson,
  20 │   type Manifest,
> 21 │   type ManifestPackage,
  22 │ } from "../Manifest.ts";
  23 │ import { manifestArtifactName, tarballUrl } from "../Protocol.ts";

0.78 packages/alchemy/src/AWS/AppRunner/ServiceEventSource.ts:14:1
> 14 │ export interface ServiceStatusChangeDetail {
  15 │   /** ID of the App Runner service whose status changed. */
  16 │   serviceId: string;
  17 │   /** Name of the App Runner service. */
  18 │   serviceName: string;
  19 │   /** The status the service transitioned into (e.g. `RUNNING`, `PAUSED`). */
  20 │   currentStatus: apprunner.ServiceStatus;
  21 │   /** The status the service transitioned out of. */
  22 │   previousStatus?: apprunner.ServiceStatus;
  23 │ }

0.78 packages/alchemy/src/AWS/Athena/QueryStateChangeEventSource.ts:23:1
> 23 │ export interface QueryStateChangeDetail {
  24 │   /** The state the query transitioned into. */
  25 │   currentState: QueryState;
  26 │   /** The state the query transitioned out of (absent on the first event). */
  27 │   previousState?: QueryState;
  28 │   /** Id of the query execution. */
  29 │   queryExecutionId: string;
  30 │   /** Statement type: `DDL`, `DML`, or `UTILITY`. */
  31 │   statementType?: string;
  32 │   /** Name of the workgroup the query ran in. */
  33 │   workgroupName?: string;
  34 │   /** Monotonic sequence number of this transition within the execution. */
  35 │   sequenceNumber?: string;
  36 │   /** Version of the event schema. */
  37 │   versionId?: string;
  38 │   /** Error details when `currentState` is `FAILED`. */
  39 │   athenaError?: {
  40 │     errorCategory?: number;
  41 │     errorType?: number;
  42 │     errorMessage?: string;
  43 │     retryable?: boolean;
  44 │   };
  45 │   /** Additional event fields (the schema grows over time). */
  46 │   [key: string]: unknown;
  47 │ }

0.78 packages/alchemy/src/AWS/Config/ConfigEventSource.ts:16:1
> 16 │ export interface ConfigEventDetail {
  17 │   /** Compliance events: the name of the rule that changed compliance. */
  18 │   configRuleName?: string;
  19 │   /** Compliance events: the ARN of the rule. */
  20 │   configRuleARN?: string;
  21 │   /** The type of resource the event is about, e.g. `AWS::S3::Bucket`. */
  22 │   resourceType?: string;
  23 │   /** The id of the resource the event is about. */
  24 │   resourceId?: string;
  25 │   /**
  26 │    * The Config notification type, e.g. `ComplianceChangeNotification` or
  27 │    * `ConfigurationItemChangeNotification`.
  28 │    */
  29 │   messageType?: string;
  30 │   /** Compliance events: the new evaluation result (`complianceType`, …). */
  31 │   newEvaluationResult?: Record<string, unknown>;
  32 │   /** Compliance events: the previous evaluation result. */
  33 │   oldEvaluationResult?: Record<string, unknown>;
  34 │   /** Configuration-item events: the recorded configuration item. */
  35 │   configurationItem?: Record<string, unknown>;
  36 │   /** Configuration-item events: the diff against the previous item. */
  37 │   configurationItemDiff?: Record<string, unknown>;
  38 │   /** Additional event fields (the schema grows over time). */
  39 │   [key: string]: unknown;
  40 │ }

0.78 packages/alchemy/src/AWS/EMRContainers/JobRunEventSource.ts:14:1
> 14 │ export interface JobRunEventDetail {
  15 │   /** The ID of the job run. */
  16 │   id?: string;
  17 │   /** The name of the job run. */
  18 │   name?: string;
  19 │   /** The ID of the virtual cluster the job run belongs to. */
  20 │   virtualClusterId?: string;
  21 │   /** The ARN of the job run. */
  22 │   arn?: string;
  23 │   /** The state the job run transitioned to (e.g. `COMPLETED`, `FAILED`). */
  24 │   state?: string;
  25 │   /** For failed runs: the failure reason (e.g. `USER_ERROR`). */
  26 │   failureReason?: string;
  27 │   /** Additional detail about the state transition. */
  28 │   stateDetails?: string;
  29 │   /** Additional event fields (the schema grows over time). */
  30 │   [key: string]: unknown;
  31 │ }

0.78 packages/alchemy/src/AWS/GuardDuty/FindingEventSource.ts:14:1
> 14 │ export interface FindingEventDetail {
  15 │   /** The finding id. */
  16 │   id?: string;
  17 │   /** The finding type, e.g. `Recon:EC2/PortProbeUnprotectedPort`. */
  18 │   type?: string;
  19 │   /** The finding severity (0.1–8+; 7+ is high). */
  20 │   severity?: number;
  21 │   /** The account the finding was generated in. */
  22 │   accountId?: string;
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

0.78 packages/alchemy/src/AWS/Macie2/FindingEventSource.ts:20:1
> 20 │ export interface FindingEventDetail {
  21 │   /** The finding id. */
  22 │   id?: string;
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

0.78 packages/alchemy/src/AWS/MediaConvert/JobEventSource.ts:16:1
> 16 │ export interface MediaConvertJobEventDetail {
  17 │   /** The job's id (`arn:…:jobs/{id}`). */
  18 │   jobId?: string;
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

0.78 packages/alchemy/src/Docker/Docker.ts:502:1
> 502 │ export interface CommandOutput {
  503 │   exitCode: ChildProcessSpawner.ExitCode;
  504 │   stdout: string;
  505 │   stderr: string;
  506 │ }

0.78 packages/alchemy/src/Docker/Dockerfile.ts:63:1
> 63 │ export interface InlineDockerfile {
  64 │   readonly content: Input<string>;
  65 │ }

0.78 packages/alchemy/src/Git/Protocol/ObjectCodec.ts:341:3
  329 │ export interface ParsedTag {
  330 │   /** The tagged object's oid. */
  331 │   readonly object: Oid;
  332 │   /** The tagged object's type name. */
  333 │   readonly targetType: ObjectTypeName;
  334 │   /** The tag name (without `refs/tags/`). */
  335 │   readonly tag: string;
  336 │   /** Tagger identity; optional (ancient tags may lack it). */
  337 │   readonly tagger: Identity | undefined;
  338 │   /** Tag message. */
  339 │   readonly message: string;
  340 │   /** All raw headers in order. */
> 341 │   readonly headers: ReadonlyArray<readonly [string, string]>;
  342 │ }
  343 │
  344 │ const IDENTITY_REGEX = /^(.*) <(.*)> (\d+) ([+-]\d{4})$/;

0.78 packages/alchemy/src/Neon/Object.ts:82:1
> 82 │ export interface Object<T = never> extends Resource<
  83 │   "Neon.Object",
  84 │   ObjectProps<T>,
  85 │   ObjectAttributes,
  86 │   never,
  87 │   Providers
  88 │ > {}

0.78 packages/alchemy/src/Stripe/IssuingCardholder.ts:101:1
> 101 │ export interface IssuingCardholderDob {
  102 │   /**
  103 │    * Day of birth, 1–31. Cardholders must be older than 13.
  104 │    */
  105 │   day: number;
  106 │   /**
  107 │    * Month of birth, 1–12.
  108 │    */
  109 │   month: number;
  110 │   /**
  111 │    * Four-digit year of birth.
  112 │    */
  113 │   year: number;
  114 │ }

0.78 packages/alchemy/src/Stripe/TerminalLocation.ts:144:1
> 144 │ export type TerminalLocation = Resource<
  145 │   "Stripe.TerminalLocation",
  146 │   TerminalLocationProps,
  147 │   {
  148 │     /** Stripe Terminal Location id (`tml_…`). */
  149 │     id: string;
  150 │     /** Display name of the location. */
  151 │     displayName: string;
  152 │     /** Full address of the location. */
  153 │     address: TerminalLocationAddress;
  154 │     /** Kana variation of the full address, if set. */
  155 │     addressKana: TerminalLocationJapanAddress | undefined;
  156 │     /** Kanji variation of the full address, if set. */
  157 │     addressKanji: TerminalLocationJapanAddress | undefined;
  158 │     /** Terminal Configuration id applied to readers at this location. */
  159 │     configurationOverrides: string | undefined;
  160 │     /** Kana variation of the display name, if set. */
  161 │     displayNameKana: string | undefined;
  162 │     /** Kanji variation of the display name, if set. */
  163 │     displayNameKanji: string | undefined;
  164 │     /** Phone number for the location, if set. */
  165 │     phone: string | undefined;
  166 │     /** User-defined metadata (Alchemy ownership keys stripped). */
  167 │     metadata: Record<string, string>;
  168 │     /** Whether the location exists in live mode. */
  169 │     livemode: boolean;
  170 │   },
  171 │   never,
  172 │   Providers
  173 │ >;

0.78 packages/alchemy/test/Cli/PlanTestNodes.ts:21:1
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

0.77 packages/alchemy/src/AWS/Backup/BackupPlan.ts:82:1
> 82 │ export interface BackupPlanProps {
  83 │   /**
  84 │    * Display name of the backup plan. If omitted, a unique name is generated
  85 │    * from the app, stage, and logical ID.
  86 │    */
  87 │   backupPlanName?: string;
  88 │   /**
  89 │    * One or more scheduled backup rules that make up the plan.
  90 │    */
  91 │   rules: BackupPlanRule[];
  92 │   /**
  93 │    * Tags to apply to the backup plan. Merged with internal Alchemy tags.
  94 │    */
  95 │   tags?: Record<string, string>;
  96 │ }

0.77 packages/alchemy/src/AWS/BedrockDataAutomation/JobEventSource.ts:14:1
> 14 │ export interface DataAutomationJobEventDetail {
  15 │   /** The job id (the trailing segment of the invocation ARN). */
  16 │   job_id?: string;
  17 │   /** The job status, e.g. `SUCCESS`, `CLIENT_ERROR`, `SERVICE_ERROR`. */
  18 │   job_status?: string;
  19 │   /** The detected modality, e.g. `Document`, `Image`, `Audio`, `Video`. */
  20 │   semantic_modality?: string;
  21 │   /** The S3 input object the job processed. */
  22 │   input_s3_object?: { s3_bucket?: string; name?: string };
  23 │   /** The S3 location the job wrote results to. */
  24 │   output_s3_location?: { s3_bucket?: string; name?: string };
  25 │   /** The error message for failed jobs (empty on success). */
  26 │   error_message?: string;
  27 │   /** Additional event fields (the schema grows over time). */
  28 │   [key: string]: unknown;
  29 │ }

0.77 packages/alchemy/src/AWS/Cognito/UserPoolDomain.ts:231:13
  223 │             yield* cip.createUserPoolDomain({
  224 │               Domain: domain,
  225 │               UserPoolId: news.userPoolId,
  226 │               ManagedLoginVersion: news.managedLoginVersion,
  227 │               CustomDomainConfig:
  228 │                 news.certificateArn === undefined
  229 │                   ? undefined
  230 │                   : { CertificateArn: news.certificateArn },
> 231 │             });
  232 │             observed = yield* waitUntilActive(domain);
  233 │           } else {

0.77 packages/alchemy/src/AWS/DataBrew/JobEventSource.ts:14:1
> 14 │ export interface JobEventDetail {
  15 │   /** Name of the job the run belongs to. */
  16 │   jobName?: string;
  17 │   /** The run's id (`db_…`). */
  18 │   jobRunId?: string;
  19 │   /**
  20 │    * The new run state — `RUNNING`, `SUCCEEDED`, `FAILED`, `STOPPED`, or
  21 │    * `TIMEOUT`.
  22 │    */
  23 │   state?: string;
  24 │   /** Event severity, e.g. `INFO`. */
  25 │   severity?: string;
  26 │   /** Human-readable state-change message. */
  27 │   message?: string;
  28 │   /** The account the job belongs to. */
  29 │   accountId?: string;
  30 │   /** Additional event fields (the schema grows over time). */
  31 │   [key: string]: unknown;
  32 │ }

0.77 packages/alchemy/src/AWS/Deadline/FarmEventSource.ts:16:1
> 16 │ export interface FarmEventDetail {
  17 │   /** The farm the event is about. */
  18 │   farmId?: string;
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

0.77 packages/alchemy/src/AWS/EMR/ClusterEventSource.ts:15:1
> 15 │ export interface ClusterEventDetail {
  16 │   /** The id of the cluster the event is about (`j-…`). */
  17 │   clusterId?: string;
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

0.77 packages/alchemy/src/AWS/MediaPackageV2/HarvestJobEventSource.ts:14:1
> 14 │ export interface MediaPackageV2HarvestJobEventDetail {
  15 │   /** The harvest job the notification is about. */
  16 │   harvestJob: {
  17 │     /** Name of the harvest job. */
  18 │     harvestJobName: string;
  19 │     /** ARN of the harvest job. */
  20 │     arn: string;
  21 │     /** Terminal status: `COMPLETED` or `FAILED`. */
  22 │     status: string;
  23 │     /** Channel group the harvested endpoint belongs to. */
  24 │     channelGroupName: string;
  25 │     /** Channel the harvested endpoint belongs to. */
  26 │     channelName: string;
  27 │     /** Origin endpoint the content was harvested from. */
  28 │     originEndpointName: string;
  29 │     /** Human-readable outcome (e.g. the failure reason). */
  30 │     message?: string;
  31 │     /** The harvested time window. */
  32 │     scheduleConfiguration?: { startTime?: string; endTime?: string };
  33 │     /** Where the VOD asset was written. */
  34 │     destination?: {
  35 │       s3Destination?: { bucketName?: string; destinationPath?: string };
  36 │     };
  37 │     /** Additional fields (the schema grows over time). */
  38 │     [key: string]: unknown;
  39 │   };
  40 │ }

0.77 packages/alchemy/src/AWS/Neptune/DBCluster.ts:261:1
> 261 │ export const DBCluster = Resource<DBCluster>("AWS.Neptune.DBCluster");

0.77 packages/alchemy/src/AWS/Omics/RunStatusEventSource.ts:15:1
> 15 │ export interface OmicsRunEventDetail {
  16 │   /** The run's id. */
  17 │   id?: string;
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

0.77 packages/alchemy/src/AWS/ResourceGroups/GroupEventSource.ts:16:1
> 16 │ export interface GroupEventDetail {
  17 │   /** Monotonic ordering hint for events about the same group. */
  18 │   "event-sequence"?: number;
  19 │   /** State-change events: the transition, e.g. `create`, `update`, `delete`. */
  20 │   "state-change"?: string;
  21 │   /** The group the event is about (`arn`, `name`, …). */
  22 │   group?: {
  23 │     arn?: string;
  24 │     name?: string;
  25 │     [key: string]: unknown;
  26 │   };
  27 │   /** Membership-change events: the resources that entered or left the group. */
  28 │   resources?: {
  29 │     arn?: string;
  30 │     "membership-change"?: string;
  31 │     [key: string]: unknown;
  32 │   }[];
  33 │   /** Additional event fields (the schema grows over time). */
  34 │   [key: string]: unknown;
  35 │ }

0.77 packages/alchemy/src/AWS/Signer/SigningProfile.ts:370:11
  369 │           yield* session.note(profileName);
> 370 │           return toAttributes(profileName, live);
  371 │         }),

0.77 packages/alchemy/src/Stripe/IssuingCard.ts:145:3
> 145 │   expMonth?: number;

0.77 packages/alchemy/src/Stripe/PromotionCode.ts:201:1
  197 │ export class PromotionCodeNotResolved extends Data.TaggedError(
  198 │   "Stripe.PromotionCodeNotResolved",
  199 │ )<{
  200 │   code: string;
> 201 │ }> {}
  202 │
  203 │ type PromotionCodeAttributes = PromotionCode["Attributes"];

0.77 packages/alchemy/src/Stripe/ShippingRate.ts:73:1
> 73 │ export interface ShippingRateCurrencyOption {
  74 │   /**
  75 │    * Amount (in the currency's minor units) to charge for this currency.
  76 │    */
  77 │   amount: number;
  78 │   /**
  79 │    * Whether this currency option is inclusive of taxes.
  80 │    */
  81 │   taxBehavior?: ShippingRateTaxBehavior;
  82 │ }

0.77 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:39:1
  37 │ export type SubscriptionEvent = typeof SubscriptionEvent.Type;
  38 │
> 39 │ interface SubscriptionEventTarget {
  40 │   source: "images" | "kv" | "r2" | "vectorize";
  41 │   type: string;
  42 │   accountId: string;
  43 │   subscriptionId: string;
  44 │   identity: string;
  45 │ }

0.77 packages/alchemy/test/Fly/fixtures/bluegreen-worker-shared.ts:65:1
> 65 │ export interface Job {
  66 │   id: string;
  67 │   job: string;
  68 │   kind: string;
  69 │   checkpoint: string;
  70 │ }

0.76 packages/alchemy/src/AWS/BCMDataExports/Export.ts:141:1
  126 │ export interface Export extends Resource<
  127 │   "AWS.BCMDataExports.Export",
  128 │   ExportProps,
  129 │   {
  130 │     /**
  131 │      * Name of the export.
  132 │      */
  133 │     exportName: string;
  134 │     /**
  135 │      * The ARN of the export.
  136 │      */
  137 │     exportArn: string;
  138 │   },
  139 │   never,
  140 │   Providers
> 141 │ > {}

0.76 packages/alchemy/src/AWS/Budgets/Budget.ts:31:1
  28 │ /**
  29 │  * A threshold that, when crossed, notifies the configured subscribers.
  30 │  */
> 31 │ export interface BudgetNotification {
  32 │   /**
  33 │    * Whether the notification is based on actual or forecasted spend/usage.
  34 │    */
  35 │   notificationType: "ACTUAL" | "FORECASTED" | (string & {});
  36 │   /**
  37 │    * How the actual/forecasted amount is compared to the threshold.
  38 │    */
  39 │   comparisonOperator: "GREATER_THAN" | "LESS_THAN" | "EQUAL_TO" | (string & {});
  40 │   /**
  41 │    * The threshold value. Interpreted as a percentage of the budget limit by
  42 │    * default, or an absolute amount when `thresholdType` is `ABSOLUTE_VALUE`.
  43 │    */
  44 │   threshold: number;
  45 │   /**
  46 │    * Whether `threshold` is a percentage of the budget or an absolute value.
  47 │    * @default "PERCENTAGE"
  48 │    */
  49 │   thresholdType?: "PERCENTAGE" | "ABSOLUTE_VALUE" | (string & {});
  50 │   /**
  51 │    * Subscribers notified when this threshold is crossed.
  52 │    */
  53 │   subscribers: BudgetSubscriber[];
  54 │ }

0.76 packages/alchemy/src/AWS/CodeArtifact/Domain.ts:13:1
  10 │ import { createInternalTags, diffTags, hasAlchemyTags } from "../../Tags.ts";
  11 │ import type { Providers } from "../Providers.ts";
  12 │
> 13 │ export interface DomainProps {
  14 │   /**
  15 │    * Name of the domain (2-50 chars, lowercase letters, digits and hyphens).
  16 │    * If omitted a deterministic physical name is generated. Changing the name
  17 │    * replaces the domain.
  18 │    */
  19 │   domainName?: string;
  20 │   /**
  21 │    * ARN of a KMS key used to encrypt assets in the domain. Defaults to an
  22 │    * AWS-managed key. Immutable — changing it replaces the domain.
  23 │    */
  24 │   encryptionKey?: string;
  25 │   /**
  26 │    * User-defined tags.
  27 │    */
  28 │   tags?: Record<string, string>;
  29 │ }

0.76 packages/alchemy/src/AWS/CodeBuild/BuildEventSource.ts:15:1
> 15 │ export interface BuildEventDetail {
  16 │   /** The build's id (`{project-name}:{uuid}`). */
  17 │   "build-id"?: string;
  18 │   /** Name of the project the build belongs to. */
  19 │   "project-name"?: string;
  20 │   /**
  21 │    * State-change events: the new status — `IN_PROGRESS`, `SUCCEEDED`,
  22 │    * `FAILED`, or `STOPPED`.
  23 │    */
  24 │   "build-status"?: string;
  25 │   /** Phase-change events: the phase that just completed, e.g. `BUILD`. */
  26 │   "completed-phase"?: string;
  27 │   /** Phase-change events: the completed phase's status. */
  28 │   "completed-phase-status"?: string;
  29 │   /** Deep details: source, environment, phases, logs, … */
  30 │   "additional-information"?: Record<string, unknown>;
  31 │   /** Additional event fields (the schema grows over time). */
  32 │   [key: string]: unknown;
  33 │ }

0.76 packages/alchemy/src/AWS/CodeDeploy/DeploymentEventSource.ts:14:1
> 14 │ export interface DeploymentEventDetail {
  15 │   /** The deployment's id (`d-…`). */
  16 │   deploymentId?: string;
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

0.76 packages/alchemy/src/AWS/KMS/KeyEventSource.ts:14:1
> 14 │ export interface KeyEventDetail {
  15 │   /** The id of the KMS key the event is about. */
  16 │   "key-id"?: string;
  17 │   /** Deletion events: when the key material was destroyed. */
  18 │   "deletion-time"?: string;
  19 │   /** Rotation events: when the key material was rotated. */
  20 │   "rotation-time"?: string;
  21 │   /** Imported key material expiration events: when the material expired. */
  22 │   "expiration-time"?: string;
  23 │   /** Additional event fields (the schema grows over time). */
  24 │   [key: string]: unknown;
  25 │ }

0.76 packages/alchemy/src/AWS/RDS/DBParameterGroup.ts:274:21
  264 │         list: () =>
  265 │           // Collection reads omit per-group tags and parameters; read hydrates them.
  266 │           rds.describeDBParameterGroups.pages({}).pipe(
  267 │             Stream.runCollect,
  268 │             Effect.map((chunk) =>
  269 │               Array.from(chunk).flatMap((page) =>
  270 │                 (page.DBParameterGroups ?? [])
  271 │                   .filter(
  272 │                     (
  273 │                       g,
> 274 │                     ): g is rds.DBParameterGroup & {
  275 │                       DBParameterGroupName: string;
  276 │                     } =>
  277 │                       g.DBParameterGroupName != null &&
  278 │                       // AWS-managed `default.*` groups cannot be deleted
  279 │                       // (InvalidDBParameterGroupStateFault) — don't enumerate.
  280 │                       !g.DBParameterGroupName.startsWith("default."),
  281 │                   )
  282 │                   .map((g) => ({
  283 │                     dbParameterGroupName: g.DBParameterGroupName,
  284 │                     dbParameterGroupArn: g.DBParameterGroupArn,
  285 │                     family: g.DBParameterGroupFamily ?? "",
  286 │                     description: g.Description,
  287 │                     // Like tags: a describe per group would be O(groups) calls.
  288 │                     parameters: {} as Record<string, string>,
  289 │                     tags: {} as Record<string, string>,
  290 │                   })),
  291 │               ),
  292 │             ),
  293 │           ),

0.76 packages/alchemy/src/AWS/SecurityLake/DataLake.ts:21:1
  18 │ /**
  19 │  * Encryption settings for a Security Lake Region.
  20 │  */
> 21 │ export interface DataLakeEncryptionConfiguration {
  22 │   /**
  23 │    * The KMS key ID used to encrypt objects at rest, or `S3_MANAGED_KEY` for
  24 │    * SSE-S3 (the default).
  25 │    * @default "S3_MANAGED_KEY"
  26 │    */
  27 │   kmsKeyId?: string;
  28 │ }

0.76 packages/alchemy/src/AWS/StepFunctions/ExecutionEventSource.ts:16:1
> 16 │ export interface ExecutionEventDetail {
  17 │   /** The execution's ARN (`arn:…:execution:{machine}:{name}`). */
  18 │   executionArn?: string;
  19 │   /** ARN of the state machine the execution belongs to. */
  20 │   stateMachineArn?: string;
  21 │   /** The execution name. */
  22 │   name?: string;
  23 │   /** The new status: `RUNNING`, `SUCCEEDED`, `FAILED`, `TIMED_OUT`, `ABORTED`. */
  24 │   status?: string;
  25 │   /** Epoch millis the execution started. */
  26 │   startDate?: number;
  27 │   /** Epoch millis the execution stopped (terminal statuses only). */
  28 │   stopDate?: number | null;
  29 │   /** The execution input (JSON string), when execution data is included. */
  30 │   input?: string | null;
  31 │   /** The execution output (JSON string) on `SUCCEEDED`, else `null`. */
  32 │   output?: string | null;
  33 │   /** The `Error` name on `FAILED`/`TIMED_OUT`, when present. */
  34 │   error?: string | null;
  35 │   /** The `Cause` string on `FAILED`/`TIMED_OUT`, when present. */
  36 │   cause?: string | null;
  37 │   /** Additional event fields (the schema grows over time). */
  38 │   [key: string]: unknown;
  39 │ }

0.76 packages/alchemy/src/Cloudflare/AI/ProviderKey.ts:9:1
  6 │ import { Secret } from "../SecretsStore/Secret.ts";
  7 │ import { GatewayProvider } from "./GatewayProvider.ts";
  8 │
> 9 │ export interface ProviderKeyProps {

0.76 packages/alchemy/src/Cloudflare/VpcService/VpcServiceLookup.ts:29:1
> 29 │ export interface VpcServiceLookup extends Attributes {
  30 │   readonly Type: "Cloudflare.VpcService.VpcService";
  31 │ }

0.76 packages/alchemy/src/Doppler/AuthProvider.ts:121:5
  112 │   const waitingPrompt = interaction.prompt
  113 │     .awaitExternal({
  114 │       message: "Log in to Doppler",
  115 │       waitingLabel: "Waiting for Doppler authorization (up to 5 minutes)…",
  116 │       url: authorization.auth_url,
  117 │       code: authorization.code,
  118 │       openFailed,
  119 │       allowManualInput: false,
  120 │     })
> 121 │     .pipe(mapPromptCancellation, Effect.andThen(Effect.never));

0.76 packages/alchemy/src/Git/Hasher/Protocol.ts:69:1
> 69 │ interface WireResult {
  70 │   readonly firstOffset: number;
  71 │   readonly entries: ReadonlyArray<WireEntry>;
  72 │   readonly unresolved: ScanResult["unresolved"];
  73 │   readonly consumedTo: number;
  74 │   readonly count: number;
  75 │ }

0.76 packages/alchemy/src/Neon/Bucket.ts:41:1
> 41 │ export interface BucketAttributes extends ResolvedBranchScope {
  42 │   /** Bucket identity within the branch. */
  43 │   bucketName: string;
  44 │   /** Current anonymous object read policy. */
  45 │   access: "private" | "public_read";
  46 │   /** Branch-specific path-style S3 endpoint. */
  47 │   endpoint: string;
  48 │   /** S3 signing region. */
  49 │   region: string;
  50 │   /** Observed bucket tags, including ownership markers. */
  51 │   tags: Record<string, string>;
  52 │   /** Observed CORS rules. */
  53 │   cors: CORSRule[];
  54 │   /** Management credential for declarative objects and cleanup. Never bound into runtime readers. @internal */
  55 │   credential: CredentialAttributes;
  56 │ }

0.76 packages/alchemy/src/Nuke.ts:22:1
  19 │ // any stack's lifecycle.
  20 │
  21 │ /** A provider call that failed. These are collected into results, never thrown. */
> 22 │ export interface ProviderFailure {
  23 │   readonly provider: string;
  24 │   readonly operation: "list" | "delete";
  25 │   readonly message: string;
  26 │ }

0.76 packages/alchemy/src/Planetscale/Branch.ts:161:1
> 161 │ export interface BranchMigrationRunners {
  162 │   runMigrations: (
  163 │     target: { organization: string; database: string; branch: string },
  164 │     input: NormalizedMigrationsInput,
  165 │     stamped: StampedMigrationsState,
  166 │   ) => Effect.Effect<MigrationRun, any, any>;
  167 │   runImports: (
  168 │     target: { organization: string; database: string; branch: string },
  169 │     importFiles: string[],
  170 │     rootDir: string,
  171 │     previousHashes: Record<string, string>,
  172 │   ) => Effect.Effect<Record<string, string>, any, any>;
  173 │ }

0.76 packages/alchemy/src/Stripe/BillingPortalConfiguration.ts:250:1
> 250 │ export interface BillingPortalConfigurationProps {

0.76 packages/alchemy/src/Telemetry/Attributes.ts:20:1
> 20 │ export interface TelemetryAttributes {
  21 │   readonly "alchemy.user.id": string;
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

0.76 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:31:1
> 31 │ export interface RegistryEntry {
  32 │   readonly scriptName: string;
  33 │   readonly debugPortAddress: string;
  34 │   readonly services: [RegistryEntry.Worker, ...Array<RegistryEntry.Service>];
  35 │ }

0.75 packages/alchemy-test/src/Reporter.ts:13:1
  11 │ export type TestStatus = "pass" | "fail" | "skip" | "todo";
  12 │
> 13 │ export interface TestMeta {
  14 │   readonly tags: ReadonlyArray<string>;
  15 │   readonly optInTags: ReadonlyArray<string>;
  16 │   /** Stable id: `<file> > <describe chain> > <name>`. */
  17 │   readonly id: string;
  18 │   readonly file: string;
  19 │   readonly titlePath: ReadonlyArray<string>;
  20 │   readonly name: string;
  21 │ }

0.75 packages/alchemy/src/AWS/Amplify/AppEventSource.ts:14:1
> 14 │ export interface DeploymentStatusChangeDetail {
  15 │   /**
  16 │    * ID of the Amplify app the job belongs to.
  17 │    */
  18 │   appId: string;
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

0.75 packages/alchemy/src/AWS/Cognito/User.ts:181:11
  175 │         diff: Effect.fn(function* ({ id, news, olds }) {
  176 │           if (!isResolved(news)) return undefined;
  177 │           const oldName = yield* createName(id, olds ?? {});
  178 │           const newName = yield* createName(id, news ?? {});
  179 │           if (oldName !== newName || olds?.userPoolId !== news?.userPoolId) {
  180 │             return { action: "replace" } as const;
> 181 │           }
  182 │         }),

0.75 packages/alchemy/src/AWS/Config/ConfigRule.ts:29:1
> 29 │ export interface ConfigRuleSourceDetail {
  30 │   /**
  31 │    * The source of the event that triggers evaluation.
  32 │    * @default "aws.config"
  33 │    */
  34 │   eventSource?: string;
  35 │   /**
  36 │    * The type of notification that triggers evaluation, e.g.
  37 │    * `ConfigurationItemChangeNotification` or `ScheduledNotification`.
  38 │    */
  39 │   messageType?: string;
  40 │   /**
  41 │    * The frequency at which the rule is evaluated when the message type is
  42 │    * `ScheduledNotification`.
  43 │    */
  44 │   maximumExecutionFrequency?: ConfigMaximumExecutionFrequency;
  45 │ }

0.75 packages/alchemy/src/AWS/ControlTower/LifecycleEventSource.ts:31:1
> 31 │ export interface ControlTowerLifecycleEventDetail {
  32 │   /** The lifecycle event name, e.g. `CreateManagedAccount`. */
  33 │   eventName?: ControlTowerLifecycleEventName | (string & {});
  34 │   /** Always `controltower.amazonaws.com` for lifecycle events. */
  35 │   eventSource?: string;
  36 │   /** The Control Tower home region that recorded the event. */
  37 │   awsRegion?: string;
  38 │   /** When the lifecycle action completed. */
  39 │   eventTime?: string;
  40 │   /**
  41 │    * The lifecycle outcome, keyed by `{eventName}Status` (e.g.
  42 │    * `createManagedAccountStatus.state` is `SUCCEEDED` or `FAILED`).
  43 │    */
  44 │   serviceEventDetails?: Record<string, unknown>;
  45 │   /** Additional CloudTrail record fields (the schema grows over time). */
  46 │   [key: string]: unknown;
  47 │ }

0.75 packages/alchemy/src/AWS/DataBrew/Dataset.ts:30:1
  29 │ /** Where DataBrew reads the dataset's data from. Exactly one definition. */
> 30 │ export interface DatasetInput {
  31 │   /** Read directly from Amazon S3. */
  32 │   s3InputDefinition?: S3Location;
  33 │   /** Read from an AWS Glue Data Catalog table. */
  34 │   dataCatalogInputDefinition?: {
  35 │     /** The Data Catalog ID (defaults to the caller's account). */
  36 │     catalogId?: string;
  37 │     /** The Glue database name. */
  38 │     databaseName: string;
  39 │     /** The Glue table name. */
  40 │     tableName: string;
  41 │     /** S3 temp directory for intermediate results. */
  42 │     tempDirectory?: S3Location;
  43 │   };
  44 │   /** Read from a JDBC database through a Glue connection. */
  45 │   databaseInputDefinition?: {
  46 │     /** The Glue connection name. */
  47 │     glueConnectionName: string;
  48 │     /** The database table to read. Mutually exclusive with `queryString`. */
  49 │     databaseTableName?: string;
  50 │     /** S3 temp directory for intermediate results. */
  51 │     tempDirectory?: S3Location;
  52 │     /** A custom SQL query to select the data. */
  53 │     queryString?: string;
  54 │   };
  55 │ }

0.75 packages/alchemy/src/AWS/DLM/LifecyclePolicyEventSource.ts:16:1
> 16 │ export interface LifecyclePolicyEventDetail {
  17 │   /**
  18 │    * State-change events: the state the policy transitioned to, e.g.
  19 │    * `ERROR` when the execution role was deleted out-of-band.
  20 │    */
  21 │   state?: string;
  22 │   /** State-change events: why the policy changed state. */
  23 │   cause?: string;
  24 │   /** The id or ARN of the lifecycle policy the event is about. */
  25 │   policy_id?: string;
  26 │   /** Additional event fields (the schema grows over time). */
  27 │   [key: string]: unknown;
  28 │ }

0.75 packages/alchemy/src/AWS/EMRServerless/JobRunEventSource.ts:15:1
> 15 │ export interface JobRunEventDetail {
  16 │   /** The id of the EMR Serverless application the event is about. */
  17 │   applicationId?: string;
  18 │   /** Job-run events: the id of the job run. */
  19 │   jobRunId?: string;
  20 │   /** The state transitioned to, e.g. `RUNNING`, `SUCCESS`, `FAILED`. */
  21 │   state?: string;
  22 │   /** Why the state changed (e.g. the failure reason). */
  23 │   stateDetails?: string;
  24 │   /** Additional event fields (the schema grows over time). */
  25 │   [key: string]: unknown;
  26 │ }

0.75 packages/alchemy/src/AWS/GlobalAccelerator/EndpointGroup.ts:247:3
  244 │ // manage. Fields the user never specified (healthCheckPort/path) fall back to
  245 │ // service-computed defaults and are only compared when explicitly desired.
  246 │ const hasDrift = (
> 247 │   live: ga.EndpointGroup,
  248 │   news: EndpointGroupProps,
  249 │ ): boolean => {

0.75 packages/alchemy/src/AWS/Lambda/Version.ts:63:3
  59 │ export interface Version extends Resource<
  60 │   "AWS.Lambda.Version",
  61 │   VersionProps,
  62 │   VersionAttributes,
> 63 │   never,
  64 │   Providers
  65 │ > {}

0.75 packages/alchemy/src/AWS/Location/TrackerEventSource.ts:16:1
> 16 │ export interface TrackerEventDetail {
  17 │   /**
  18 │    * Geofence events: `ENTER` or `EXIT`. Device position events: `UPDATE`.
  19 │    */
  20 │   EventType?: string;
  21 │   /** The device the event is about. */
  22 │   DeviceId?: string;
  23 │   /** Geofence events: the geofence that was entered or exited. */
  24 │   GeofenceId?: string;
  25 │   /** The position sample that triggered the event ([longitude, latitude]). */
  26 │   Position?: number[];
  27 │   /** When the device reported the position. */
  28 │   SampleTime?: string;
  29 │   /** Additional event fields (the schema grows over time). */
  30 │   [key: string]: unknown;
  31 │ }

0.75 packages/alchemy/src/AWS/MediaLive/ChannelEventSource.ts:15:1
> 15 │ export interface MediaLiveChannelEventDetail {
  16 │   /** The ARN of the channel (or multiplex) the event is about. */
  17 │   channel_arn?: string;
  18 │   /** State-change events: the channel's new state (e.g. `RUNNING`). */
  19 │   state?: string;
  20 │   /** Alert events: `SET` when the alert is raised, `CLEARED` when it clears. */
  21 │   alarm_state?: string;
  22 │   /** Alert events: a stable id for the alert instance. */
  23 │   alarm_id?: string;
  24 │   /** Alert events: the kind of problem (e.g. `Video Not Detected`). */
  25 │   alert_type?: string;
  26 │   /** Alert events: the pipeline the alert applies to (e.g. `0`). */
  27 │   pipeline?: string;
  28 │   /** A human-readable description of the event. */
  29 │   message?: string;
  30 │   /** State-change events: how many pipelines are currently running. */
  31 │   pipelines_running_count?: number;
  32 │   /** Additional event fields (the schema grows over time). */
  33 │   [key: string]: unknown;
  34 │ }

0.75 packages/alchemy/src/AWS/ObservabilityAdmin/TelemetryRule.ts:71:3
> 71 │   selectionCriteria?: string;

0.75 packages/alchemy/src/AWS/Shield/AttackEventSource.ts:21:1
> 21 │ export interface AttackEventDetail {
  22 │   /** The AWS Health event ARN. */
  23 │   eventArn?: string;
  24 │   /** The service the event belongs to (`SHIELD`, or `ROUTE53` for hosted-zone attacks). */
  25 │   service?: string;
  26 │   /** The event type code, e.g. `AWS_SHIELD_DDOS_ATTACK_DETECTED`. */
  27 │   eventTypeCode?: string;
  28 │   /** The event type category — Shield attack events are `issue`s. */
  29 │   eventTypeCategory?: string;
  30 │   /** When the attack event started (ISO timestamp). */
  31 │   startTime?: string;
  32 │   /** When the attack event ended, if it has (ISO timestamp). */
  33 │   endTime?: string;
  34 │   /** Human-readable descriptions of the event. */
  35 │   eventDescription?: { language?: string; latestDescription?: string }[];
  36 │   /** The attacked resources, when AWS Health can identify them. */
  37 │   affectedEntities?: { entityValue?: string }[];
  38 │   /** Additional AWS Health fields (the schema grows over time). */
  39 │   [key: string]: unknown;
  40 │ }

0.75 packages/alchemy/src/AWS/Signer/SigningJobEventSource.ts:14:1
> 14 │ export interface SigningJobEventDetail {
  15 │   /** The signing job's new status (`Started`, `Succeeded`, `Failed`). */
  16 │   status?: string;
  17 │   /** The id of the signing job. */
  18 │   job_id?: string;
  19 │   /** The ARN of the ACM certificate used, for certificate-based platforms. */
  20 │   certificate_arn?: string;
  21 │   /** The signing platform id. */
  22 │   platform?: string;
  23 │   /** Additional event fields (the schema grows over time). */
  24 │   [key: string]: unknown;
  25 │ }

0.75 packages/alchemy/src/AWS/SSM/ParameterEventSource.ts:15:1
> 15 │ export interface ParameterEventDetail {
  16 │   /** The parameter name, e.g. `/my-app/prod/db-url`. */
  17 │   name?: string;
  18 │   /** The parameter type (`String`, `StringList`, `SecureString`). */
  19 │   type?: string;
  20 │   /** What happened: `Create`, `Update`, `Delete`, or `LabelParameterVersion`. */
  21 │   operation?: string;
  22 │   /** The parameter description, when present. */
  23 │   description?: string;
  24 │   /** Policy events: the policy type that fired (`Expiration`, `ExpirationNotification`, `NoChangeNotification`). */
  25 │   "policy-type"?: string;
  26 │   /** Policy events: the policy content that fired. */
  27 │   "policy-content"?: string;
  28 │   /** Policy events: the action taken by the policy. */
  29 │   "action-reason"?: string;
  30 │   /** Additional event fields (the schema grows over time). */
  31 │   [key: string]: unknown;
  32 │ }

0.75 packages/alchemy/src/Hetzner/Network.ts:141:3
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

0.75 packages/alchemy/src/Neon/CustomDomain.ts:11:1
   8 │ import { Resource } from "../Resource.ts";
   9 │ import type { Providers } from "./Providers.ts";
  10 │
> 11 │ export interface CustomDomainProps {
  12 │   /** Target Function. Domain ownership remains independent of Function configuration. */ function: {
  13 │     projectId: string;
  14 │     branchId: string;
  15 │     slug: string;
  16 │     url: string;
  17 │   };
  18 │   /** Public DNS hostname. Register the returned target with a DNS-only CNAME. */ hostname: string;
  19 │ }

0.75 packages/alchemy/src/Neon/ProjectVPCEndpoint.ts:201:7
  182 │     read: Effect.fn(function* ({ olds, output }) {
  183 │       if (
  184 │         !output &&
  185 │         (!olds?.project?.projectId ||
  186 │           !olds.endpoint?.orgId ||
  187 │           !olds.endpoint.regionId ||
  188 │           !olds.endpoint.vpcEndpointId)
  189 │       )
  190 │         return;
  191 │       const scope = output ?? scopeOf(olds);
  192 │       const observed = yield* observe(scope);
  193 │       if (output) return { ...output, label: observed?.label ?? null };
  194 │       if (!observed) return;
  195 │       yield* validateCloudScope(scope);
  196 │       return Unowned({
  197 │         ...scope,
  198 │         label: observed.label,
  199 │         initialLabel: observed.label,
  200 │         managedLabel: observed.label,
> 201 │       });
  202 │     }),

0.75 packages/alchemy/src/Prisma/Internal/ArchivePlatform.ts:241:1
> 241 │ interface TarHeader {
  242 │   readonly name: string;
  243 │   readonly mode: number;
  244 │   readonly size: number;
  245 │   readonly type: "file" | "symlink" | "pax";
  246 │   readonly linkname?: string;
  247 │ }

0.75 packages/alchemy/src/Stripe/CreditGrant.ts:101:1
> 101 │ export interface CreditGrantProps {

0.75 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/experiment-analytics.ts:9:1
   6 │ const VERSION = 1;
   7 │
   8 │ // When adding new columns please update the schema
>  9 │ type Data = {
  10 │   // -- Indexes --
  11 │   accountId?: number;
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

0.75 packages/frontend-frameworks/fixtures/sveltekit-spa/src/routes/widgets/+page.ts:3:1
  1 │ import { describeWidgets, type Widget } from "$spa/widgets";
  2 │
> 3 │ export interface WidgetsPayload {
  4 │   readonly server: boolean;
  5 │   readonly message: string | null;
  6 │   readonly widgets: ReadonlyArray<Widget>;
  7 │ }

0.75 packages/frontend-frameworks/src/core/BuildOutput.ts:16:1
> 16 │ export interface OutputFile {
  17 │   name: string;
  18 │   content: string | Uint8Array;
  19 │   hash: string;
  20 │ }

0.74 packages/alchemy/src/AWS/ACM/ExpiryEventSource.ts:16:1
> 16 │ export interface ExpiryEventDetail {
  17 │   /** Days remaining until the certificate expires. */
  18 │   DaysToExpiry?: number;
  19 │   /** The certificate's common name, e.g. `example.com`. */
  20 │   CommonName?: string;
  21 │   /** Additional event fields (the schema grows over time). */
  22 │   [key: string]: unknown;
  23 │ }

0.74 packages/alchemy/src/AWS/ACMPCA/CertificateAuthorityEventSource.ts:16:1
> 16 │ export interface CertificateAuthorityEventDetail {
  17 │   /** Failure events: `"failure"`. Absent on success events. */
  18 │   result?: string;
  19 │   /** Additional event fields (the schema grows over time). */
  20 │   [key: string]: unknown;
  21 │ }

0.74 packages/alchemy/src/AWS/Backup/JobEventSource.ts:16:1
> 16 │ export interface BackupEventDetail {
  17 │   /** Backup-job events: the backup job id. */
  18 │   backupJobId?: string;
  19 │   /** Restore-job events: the restore job id. */
  20 │   restoreJobId?: string;
  21 │   /** Copy-job events: the copy job id. */
  22 │   copyJobId?: string;
  23 │   /** Job events: the new job state, e.g. `COMPLETED`, `FAILED`, `ABORTED`. */
  24 │   state?: string;
  25 │   /** Recovery-point events: the new status, e.g. `COMPLETED`, `EXPIRED`. */
  26 │   status?: string;
  27 │   /** Recovery-point events: the recovery point ARN. */
  28 │   recoveryPointArn?: string;
  29 │   /** Vault / recovery-point events: the backup vault name. */
  30 │   backupVaultName?: string;
  31 │   /** Vault events: the backup vault ARN. */
  32 │   backupVaultArn?: string;
  33 │   /** The ARN of the resource being backed up / restored. */
  34 │   resourceArn?: string;
  35 │   /** The type of the resource, e.g. `DynamoDB`, `EBS`. */
  36 │   resourceType?: string;
  37 │   /** The IAM role AWS Backup assumed for the job. */
  38 │   iamRoleArn?: string;
  39 │   /** Additional event fields (the schema grows over time). */
  40 │   [key: string]: unknown;
  41 │ }

0.74 packages/alchemy/src/AWS/Batch/JobEventSource.ts:15:1
> 15 │ export interface BatchJobEventDetail {
  16 │   /** The job's ARN (`arn:…:job/{jobId}`). */
  17 │   jobArn?: string;
  18 │   /** The job id. */
  19 │   jobId?: string;
  20 │   /** The job name given at submission. */
  21 │   jobName?: string;
  22 │   /** ARN of the job queue the job was submitted to. */
  23 │   jobQueue?: string;
  24 │   /** The new job status, e.g. `RUNNABLE`, `STARTING`, `SUCCEEDED`, `FAILED`. */
  25 │   status?: string;
  26 │   /** Human-readable reason for the status, when present. */
  27 │   statusReason?: string;
  28 │   /** Revision-qualified job definition ARN the job runs. */
  29 │   jobDefinition?: string;
  30 │   /** Container detail (image, exit code, log stream, …) on state changes. */
  31 │   container?: Record<string, unknown>;
  32 │   /** `Ref::` parameter substitutions supplied at submission. */
  33 │   parameters?: Record<string, string>;
  34 │   /** Additional event fields (the schema grows over time). */
  35 │   [key: string]: unknown;
  36 │ }

0.74 packages/alchemy/src/AWS/CloudTrail/EventDataStore.ts:37:1
  19 │ export interface EventDataStoreFieldSelector {
  20 │   /**
  21 │    * The event record field to select on (e.g. `eventCategory`,
  22 │    * `resources.type`).
  23 │    */
  24 │   field: string;
  25 │   /** Exact-match values. */
  26 │   equals?: string[];
  27 │   /** Prefix-match values. */
  28 │   startsWith?: string[];
  29 │   /** Suffix-match values. */
  30 │   endsWith?: string[];
  31 │   /** Exact-mismatch values. */
  32 │   notEquals?: string[];
  33 │   /** Prefix-mismatch values. */
  34 │   notStartsWith?: string[];
  35 │   /** Suffix-mismatch values. */
  36 │   notEndsWith?: string[];
> 37 │ }

0.74 packages/alchemy/src/AWS/CloudWatch/binding-common.ts:9:1
   6 │ import type { MetricStream } from "./MetricStream.ts";
   7 │ import { sortByLogicalId } from "./common.ts";
   8 │
>  9 │ export type AlarmResource = Alarm | CompositeAlarm;
  10 │
  11 │ export type InsightRuleResource = InsightRule;

0.74 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:62:1
> 62 │ export interface DashboardTextWidget {
  63 │   type: "text";
  64 │   x?: number;
  65 │   y?: number;
  66 │   width?: number;
  67 │   height?: number;
  68 │   properties: DashboardTextWidgetProperties;
  69 │ }

0.74 packages/alchemy/src/AWS/CodeBuild/Project.ts:23:1
  20 │ /**
  21 │  * Where CodeBuild fetches the source to build.
  22 │  */
> 23 │ export interface ProjectSourceConfig {

0.74 packages/alchemy/src/AWS/CodeConnections/Host.ts:39:1
> 39 │ export interface HostProps {
  40 │   /**
  41 │    * Name of the host (1-64 chars). If omitted a deterministic physical name
  42 │    * is generated. Changing the name replaces the host.
  43 │    */
  44 │   name?: string;
  45 │   /**
  46 │    * The self-managed source provider the host is installed on. Changing the
  47 │    * provider replaces the host.
  48 │    */
  49 │   providerType: "GitHubEnterpriseServer" | "GitLabSelfManaged";
  50 │   /**
  51 │    * Endpoint of the infrastructure the provider is installed on, e.g.
  52 │    * `https://ghe.example.com`.
  53 │    */
  54 │   providerEndpoint: string;
  55 │   /**
  56 │    * VPC configuration to provision for the host when the provider endpoint
  57 │    * is only reachable from inside a VPC.
  58 │    */
  59 │   vpcConfiguration?: HostVpcConfiguration;
  60 │   /**
  61 │    * User-defined tags.
  62 │    */
  63 │   tags?: Record<string, string>;
  64 │ }

0.74 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:300:15
> 300 │               ),
  301 │             ),
  302 │           ),

0.74 packages/alchemy/src/AWS/FraudDetector/DetectorVersion.ts:43:1
> 43 │ export interface DetectorVersionProps {

0.74 packages/alchemy/src/AWS/Glacier/Vault.ts:81:1
  68 │ export interface Vault extends Resource<
  69 │   "AWS.Glacier.Vault",
  70 │   VaultProps,
  71 │   {
  72 │     /** The name of the vault. */
  73 │     vaultName: string;
  74 │     /** The ARN of the vault. */
  75 │     vaultArn: string;
  76 │     /** ISO-8601 timestamp of when the vault was created. */
  77 │     creationDate: string;
  78 │   },
  79 │   never,
  80 │   Providers
> 81 │ > {}

0.74 packages/alchemy/src/AWS/Glue/CrawlerEventSource.ts:14:1
> 14 │ export interface CrawlerEventDetail {
  15 │   /** The name of the crawler. */
  16 │   crawlerName?: string;
  17 │   /** The state the crawl transitioned to. */
  18 │   state?: "Started" | "Succeeded" | "Failed" | (string & {});
  19 │   /** A human-readable message (e.g. tables created/updated counts). */
  20 │   message?: string;
  21 │   /** Additional event fields (the schema grows over time). */
  22 │   [key: string]: unknown;
  23 │ }

0.74 packages/alchemy/src/AWS/Glue/JobEventSource.ts:14:1
> 14 │ export interface JobEventDetail {
  15 │   /** The name of the Glue job the run belongs to. */
  16 │   jobName?: string;
  17 │   /** The severity of the notification (`INFO`, `WARN`, `ERROR`). */
  18 │   severity?: string;
  19 │   /** The state the job run transitioned to. */
  20 │   state?: "SUCCEEDED" | "FAILED" | "TIMEOUT" | "STOPPED" | (string & {});
  21 │   /** The id of the job run. */
  22 │   jobRunId?: string;
  23 │   /** A human-readable message (e.g. the failure reason). */
  24 │   message?: string;
  25 │   /** Additional event fields (the schema grows over time). */
  26 │   [key: string]: unknown;
  27 │ }

0.74 packages/alchemy/src/AWS/Inspector2/FindingEventSource.ts:14:1
> 14 │ export interface FindingEventDetail {
  15 │   /** The finding's ARN. */
  16 │   findingArn?: string;
  17 │   /** The account the finding was generated in. */
  18 │   awsAccountId?: string;
  19 │   /** The finding severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, ...). */
  20 │   severity?: string;
  21 │   /** The finding status (`ACTIVE`, `SUPPRESSED`, `CLOSED`). */
  22 │   status?: string;
  23 │   /** The finding type (`PACKAGE_VULNERABILITY`, `NETWORK_REACHABILITY`, `CODE_VULNERABILITY`). */
  24 │   type?: string;
  25 │   /** The finding title, e.g. `CVE-2021-44228 - log4j-core`. */
  26 │   title?: string;
  27 │   /** The finding description. */
  28 │   description?: string;
  29 │   /** The Inspector risk score. */
  30 │   inspectorScore?: number;
  31 │   /** The affected resources. */
  32 │   resources?: Array<Record<string, unknown>>;
  33 │   /** Package vulnerability details (CVE, affected packages, ...). */
  34 │   packageVulnerabilityDetails?: Record<string, unknown>;
  35 │   /** Additional finding fields (the schema grows over time). */
  36 │   [key: string]: unknown;
  37 │ }

0.74 packages/alchemy/src/AWS/IoT/Policy.ts:24:1
> 24 │ export interface IoTPolicyDocument {
  25 │   Version?: string;
  26 │   Statement: IoTPolicyStatement[];
  27 │ }

0.74 packages/alchemy/src/AWS/IoTWireless/DestinationEventSource.ts:11:1
> 11 │ export interface WirelessUplinkMessage {
  12 │   /** ID of the wireless device that sent the uplink. */
  13 │   WirelessDeviceId: string;
  14 │   /** The uplink payload, base64-encoded. */
  15 │   PayloadData: string;
  16 │   /** Radio metadata (DevEui, FPort, data rate, gateway RSSI/SNR, ...). */
  17 │   WirelessMetadata?: {
  18 │     /** LoRaWAN uplink metadata. */
  19 │     LoRaWAN?: {
  20 │       /** The DevEui of the sending device. */
  21 │       DevEui?: string;
  22 │       /** The FPort the payload was sent on. */
  23 │       FPort?: number;
  24 │       /** ISO-8601 server-side receive timestamp. */
  25 │       Timestamp?: string;
  26 │       [key: string]: unknown;
  27 │     };
  28 │     /** Amazon Sidewalk uplink metadata. */
  29 │     Sidewalk?: { [key: string]: unknown };
  30 │   };
  31 │   [key: string]: unknown;
  32 │ }

0.74 packages/alchemy/src/AWS/LakeFormation/LFTagExpression.ts:13:1
  10 │ /**
  11 │  * One LF-tag condition inside an expression.
  12 │  */
> 13 │ export interface LFTagPairSpec {
  14 │   /**
  15 │    * Key of the LF-tag.
  16 │    */
  17 │   tagKey: string;
  18 │   /**
  19 │    * Values of the LF-tag the condition matches.
  20 │    */
  21 │   tagValues: string[];
  22 │ }

0.74 packages/alchemy/src/AWS/MediaConnect/FlowEventSource.ts:15:1
> 15 │ export interface MediaConnectFlowEventDetail {
  16 │   /** Alert events: the MediaConnect error code (e.g. `NoSource`). */
  17 │   "error-code"?: string;
  18 │   /** Alert events: `true` when the alert is raised, `false` when cleared. */
  19 │   errored?: boolean;
  20 │   /** Alert events: a human-readable description of the issue. */
  21 │   message?: string;
  22 │   /** Status-change events: the flow's new status (e.g. `ACTIVE`). */
  23 │   status?: string;
  24 │   /** Health events: the name of the health metric that changed. */
  25 │   name?: string;
  26 │   /** Additional event fields (the schema grows over time). */
  27 │   [key: string]: unknown;
  28 │ }

0.74 packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts:293:1
> 293 │ type PlaybackConfigurationAttributes = {
  294 │   name: string;
  295 │   playbackConfigurationArn: string;
  296 │   playbackEndpointPrefix: string;
  297 │   sessionInitializationEndpointPrefix: string;
  298 │   hlsManifestEndpointPrefix: string | undefined;
  299 │   dashManifestEndpointPrefix: string | undefined;
  300 │ };

0.74 packages/alchemy/src/AWS/RAM/Permission.ts:21:1
> 21 │ export interface PermissionPolicyTemplate {
  22 │   /**
  23 │    * Actions granted to principals the resource share is shared with. Must be
  24 │    * a subset of the actions RAM supports for the permission's `resourceType`
  25 │    * (for example `appsync:SourceGraphQL` for `appsync:Apis`).
  26 │    */
  27 │   actions: string[];
  28 │
  29 │   /**
  30 │    * Optional IAM condition block constraining when the actions are granted.
  31 │    */
  32 │   condition?: Record<string, unknown>;
  33 │ }

0.74 packages/alchemy/src/AWS/RDS/RdsEventSource.ts:13:1
> 13 │ export interface RdsEventDetail {
  14 │   /** Categories the event belongs to (e.g. `failover`, `backup`). */
  15 │   EventCategories?: string[];
  16 │   /** The kind of resource the event is about (e.g. `CLUSTER`, `DB_INSTANCE`). */
  17 │   SourceType?: string;
  18 │   /** ARN of the instance/cluster/snapshot the event is about. */
  19 │   SourceArn?: string;
  20 │   /** When the event occurred (ISO 8601). */
  21 │   Date?: string;
  22 │   /** RDS event id, e.g. `RDS-EVENT-0170`. */
  23 │   EventID?: string;
  24 │   /** Identifier of the source resource. */
  25 │   SourceIdentifier?: string;
  26 │   /** Human-readable description of what happened. */
  27 │   Message?: string;
  28 │   /** Additional event fields (the schema grows over time). */
  29 │   [key: string]: unknown;
  30 │ }

0.74 packages/alchemy/src/AWS/S3/BucketNotifications.ts:11:1
   8 │ /**
   9 │  * A normalized S3 event notification record.
  10 │  */
> 11 │ export type BucketNotification = {
  12 │   /** The S3 event type, including the `s3:` prefix. */
  13 │   type: S3EventType;
  14 │   /** Name of the bucket the event originated from. */
  15 │   bucket: string;
  16 │   /** URL-decoded object key that the event applies to. */
  17 │   key: string;
  18 │   /** Size in bytes, when supplied; removal events may omit it. */
  19 │   size?: number;
  20 │   /** Object ETag, when supplied; removal events may omit it. */
  21 │   eTag?: string;
  22 │   /**
  23 │    * Object or delete-marker version ID. Pass as GetObject's VersionId to read
  24 │    * the exact data version; delete markers are not readable objects.
  25 │    */
  26 │   versionId?: string;
  27 │   /** Ordering token for events affecting the same key, when supplied. */
  28 │   sequencer?: string;
  29 │ };

0.74 packages/alchemy/src/AWS/SageMaker/EventSource.ts:15:1
> 15 │ export interface SageMakerEventDetail {
  16 │   /** Endpoint state changes: the endpoint's name. */
  17 │   EndpointName?: string;
  18 │   /** Endpoint state changes: the endpoint's status (e.g. `IN_SERVICE`, `FAILED`). */
  19 │   EndpointStatus?: string;
  20 │   /** Feature group state changes: the feature group's name. */
  21 │   FeatureGroupName?: string;
  22 │   /** Feature group state changes: the feature group's status. */
  23 │   FeatureGroupStatus?: string;
  24 │   /** Job state changes: the job's status (e.g. `Completed`, `Failed`). */
  25 │   TrainingJobStatus?: string;
  26 │   ProcessingJobStatus?: string;
  27 │   TransformJobStatus?: string;
  28 │   /** Failure detail accompanying `Failed` statuses. */
  29 │   FailureReason?: string;
  30 │   /** Additional event fields (the schema grows over time). */
  31 │   [key: string]: unknown;
  32 │ }

0.74 packages/alchemy/src/AWS/Synthetics/CanaryEventSource.ts:25:1
> 25 │ export interface CanaryEventDetail {
  26 │   /** The account the canary lives in. */
  27 │   "account-id"?: string;
  28 │   /** Service-assigned unique ID of the canary. */
  29 │   "canary-id"?: string;
  30 │   /** Name of the canary the event is about. */
  31 │   "canary-name"?: string;
  32 │   /** Status-change events: the canary's new state (e.g. `RUNNING`). */
  33 │   "current-state"?: string;
  34 │   /** Status-change events: the canary's previous state. */
  35 │   "previous-state"?: string;
  36 │   /** Test-run events: the run result (`PASSED`, `FAILED`). */
  37 │   "test-run-status"?: string;
  38 │   /** Test-run events: the id of the canary run. */
  39 │   "canary-run-id"?: string;
  40 │   /** S3 location of the run's artifacts. */
  41 │   "artifact-location"?: string;
  42 │   /** Human-readable reason for the state, when present. */
  43 │   "state-reason"?: string;
  44 │   /** Additional event fields (the schema grows over time). */
  45 │   [key: string]: unknown;
  46 │ }

0.74 packages/alchemy/src/AWS/Translate/TranslationJobEventSource.ts:14:1
> 14 │ export interface TranslationJobEventDetail {
  15 │   /** Id of the batch translation job. */
  16 │   jobId?: string;
  17 │   /** The job's new status, e.g. `COMPLETED`, `FAILED`, `STOPPED`. */
  18 │   jobStatus?: string;
  19 │   /** Additional event fields (the schema grows over time). */
  20 │   [key: string]: unknown;
  21 │ }

0.74 packages/alchemy/src/AWS/XRay/InsightEventSource.ts:14:1
> 14 │ export interface InsightEventDetail {
  15 │   /** The id of the insight the event is about. */
  16 │   InsightId?: string;
  17 │   /** Name of the X-Ray group the insight belongs to. */
  18 │   GroupName?: string;
  19 │   /** ARN of the X-Ray group the insight belongs to. */
  20 │   GroupARN?: string;
  21 │   /** The service at the root of the detected anomaly. */
  22 │   RootCauseServiceId?: {
  23 │     Name?: string;
  24 │     Type?: string;
  25 │     AccountId?: string;
  26 │     [key: string]: unknown;
  27 │   };
  28 │   /** The categories the insight applies to, e.g. `FAULT`. */
  29 │   Categories?: string[];
  30 │   /** Insight state: `ACTIVE` or `CLOSED`. */
  31 │   State?: string;
  32 │   /** Time the insight started. */
  33 │   StartTime?: string | number;
  34 │   /** Time the insight ended (`null` while the insight is active). */
  35 │   EndTime?: string | number | null;
  36 │   /** Human-readable insight summary. */
  37 │   Summary?: string;
  38 │   /** Additional event fields (the schema grows over time). */
  39 │   [key: string]: unknown;
  40 │ }

0.74 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:11:1
   8 │ import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
   9 │ import { md5 } from "../../Util/md5.ts";
  10 │
> 11 │ export interface ImportDatabaseOptions {
  12 │   accountId: string;
  13 │   databaseId: string;
  14 │   sqlData: string | Uint8Array;
  15 │   filename?: string;
  16 │ }

0.74 packages/alchemy/src/Cloudflare/Fraud/DetectionSettings.ts:82:1
> 82 │ export interface DetectionSettingsAttributes extends DetectionSettingsValues {
  83 │   /**
  84 │    * Zone that owns this fraud-detection configuration.
  85 │    */
  86 │   zoneId: string;
  87 │   /**
  88 │    * Snapshot of the writable settings observed **before** this resource
  89 │    * first wrote to the zone. `delete` restores these values for the
  90 │    * fields this resource managed.
  91 │    */
  92 │   initialSettings: DetectionSettingsValues;
  93 │ }

0.74 packages/alchemy/src/Drift.ts:75:1
> 75 │ export interface DriftResult {
  76 │   resources: Record<string, DriftResourceResult>;
  77 │ }

0.74 packages/alchemy/src/Git/Jobs/Fork.ts:66:1
> 66 │ export type SnapshotChunk =
  67 │   | {
  68 │       readonly table: "config";

0.74 packages/alchemy/src/Neon/Credential.ts:26:1
> 26 │ export interface CredentialAttributes extends ResolvedBranchScope {
  27 │   /** Opaque credential identifier, also the S3 access-key ID. */
  28 │   tokenId: string;
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

0.74 packages/alchemy/src/Neon/OrganizationApiKey.ts:11:1
   8 │ import { Resource } from "../Resource.ts";
   9 │ import type { Providers } from "./Providers.ts";
  10 │
> 11 │ export interface OrganizationApiKeyProps {
  12 │   /** Organization that owns the key. Changes replace the key. */
  13 │   orgId: string;
  14 │   /** Restrict access to this project. Omission grants organization-wide access. Changes replace the key. */
  15 │   projectId?: string;
  16 │   /** Immutable key label. Defaults to an instance-qualified physical name. Adding, changing, or removing an explicit label replaces the key. */
  17 │   name?: string;
  18 │ }

0.74 packages/alchemy/src/Neon/OrganizationSpendingLimit.ts:10:1
   7 │ import { Resource } from "../Resource.ts";
   8 │ import type { Providers } from "./Providers.ts";
   9 │
> 10 │ export interface OrganizationSpendingLimitProps {
  11 │   /** Existing Neon organization ID. Restore and remove this control before changing organizations. */
  12 │   orgId: string;
  13 │   /** Positive integer monthly alert threshold in cents; zero and null are not supported. */
  14 │   spendingLimitCents: number;
  15 │ }

0.74 packages/alchemy/src/Stripe/Account.ts:48:1
  45 │ /** Stripe-reported account type, including `none` for controller-created accounts. */
  46 │ export type AccountType = StripeAccountType;
  47 │
> 48 │ export interface AccountBusinessProfile {

0.74 packages/alchemy/test/AWS/StepFunctions/fixtures/order-program.ts:17:1
> 17 │ export interface OrderInput {
  18 │   value: number;
  19 │   items: number[];
  20 │ }

0.73 packages/alchemy/src/AWS/AccessAnalyzer/ArchiveRule.ts:12:1
> 12 │ export interface ArchiveRuleCriterion {
  13 │   /** The attribute value must equal one of these values. */
  14 │   eq?: string[];
  15 │   /** The attribute value must not equal any of these values. */
  16 │   neq?: string[];
  17 │   /** The attribute value must contain one of these substrings. */
  18 │   contains?: string[];
  19 │   /** The attribute must (or must not) be present. */
  20 │   exists?: boolean;
  21 │ }

0.73 packages/alchemy/src/AWS/Account/AlternateContact.ts:44:1
> 44 │ export interface AlternateContact extends Resource<
  45 │   "AWS.Account.AlternateContact",
  46 │   AlternateContactProps,
  47 │   {
  48 │     alternateContactType: AlternateContactType;
  49 │     name: string;
  50 │     title: string;
  51 │     emailAddress: string;
  52 │     phoneNumber: string;
  53 │   },
  54 │   never,
  55 │   Providers
  56 │ > {}

0.73 packages/alchemy/src/AWS/ApiGateway/Authorizer.ts:63:1
  62 │ /** @resource */
> 63 │ export interface Authorizer extends Resource<
  64 │   "AWS.ApiGateway.Authorizer",
  65 │   AuthorizerProps,
  66 │   {
  67 │     authorizerId: string;
  68 │     restApiId: string;
  69 │     name: string;
  70 │     type: ag.AuthorizerType;
  71 │   },
  72 │   never,
  73 │   Providers
  74 │ > {}

0.73 packages/alchemy/src/AWS/ApplicationSignals/GroupingConfiguration.ts:8:1
   5 │ import { Resource } from "../../Resource.ts";
   6 │ import type { Providers } from "../Providers.ts";
   7 │
>  8 │ export interface GroupingConfigurationProps {
   9 │   /**
  10 │    * The custom grouping attribute definitions for this account. Each
  11 │    * definition names a grouping dimension (`GroupingName`), the telemetry
  12 │    * attribute or AWS tag keys it is sourced from (`GroupingSourceKeys`,
  13 │    * e.g. `"Tag.team"` or an OTel resource attribute key), and an optional
  14 │    * `DefaultGroupingValue` used when none of the source keys are present.
  15 │    */
  16 │   groupingAttributeDefinitions: appsignals.GroupingAttributeDefinition[];
  17 │ }

0.73 packages/alchemy/src/AWS/AppSync/GraphqlApi.ts:201:3
  199 │ export interface GraphqlApi extends Resource<
  200 │   "AWS.AppSync.GraphqlApi",
> 201 │   GraphqlApiProps,
  202 │   {
  203 │     /** The unique API ID. */
  204 │     apiId: string;
  205 │     /** The API's ARN. */
  206 │     apiArn: string;
  207 │     /** The API name. */
  208 │     name: string;
  209 │     /** The GraphQL endpoint (`https://{id}.appsync-api.{region}.amazonaws.com/graphql`). */
  210 │     graphqlUrl: string;
  211 │     /** The real-time (WebSocket subscriptions) endpoint. */
  212 │     realtimeUrl: string | undefined;
  213 │     /** The primary authentication mode. */
  214 │     authenticationType: AuthenticationType;
  215 │   },
  216 │   never,
  217 │   Providers
  218 │ > {}

0.73 packages/alchemy/src/AWS/Backup/BackupSelection.ts:91:3
  74 │ export interface BackupSelection extends Resource<
  75 │   "AWS.Backup.BackupSelection",
  76 │   BackupSelectionProps,
  77 │   {
  78 │     /**
  79 │      * Service-assigned unique ID of the selection.
  80 │      */
  81 │     selectionId: string;
  82 │     /**
  83 │      * Name of the selection.
  84 │      */
  85 │     selectionName: string;
  86 │     /**
  87 │      * ID of the backup plan the selection is attached to.
  88 │      */
  89 │     backupPlanId: string;
  90 │   },
> 91 │   never,
  92 │   Providers
  93 │ > {}

0.73 packages/alchemy/src/AWS/CloudTrail/Trail.ts:201:1
  184 │ export interface Trail extends Resource<
  185 │   "AWS.CloudTrail.Trail",
  186 │   TrailProps,
  187 │   {
  188 │     /** Physical name of the trail. */
  189 │     trailName: string;
  190 │     /** ARN of the trail. */
  191 │     trailArn: string;
  192 │     /** The region in which the trail was created. */
  193 │     homeRegion: string;
  194 │     /** S3 bucket the trail delivers log files to. */
  195 │     s3BucketName: string;
  196 │     /** Whether the trail is currently logging. */
  197 │     isLogging: boolean;
  198 │   },
  199 │   never,
  200 │   Providers
> 201 │ > {}

0.73 packages/alchemy/src/AWS/DataSync/TaskEventSource.ts:17:1
> 17 │ export interface TaskEventDetail {
  18 │   /** The state the task or task execution transitioned to. */
  19 │   State?: string;
  20 │   /** Additional event fields (the schema grows over time). */
  21 │   [key: string]: unknown;
  22 │ }

0.73 packages/alchemy/src/AWS/EC2/defaultVpcScope.ts:15:1
> 15 │ export interface DefaultVpcScope {
  16 │   /** The default VPC's id, if the account has one. */
  17 │   readonly vpcId: string | undefined;
  18 │   /** The DhcpOptions set the default VPC references (the account default). */
  19 │   readonly dhcpOptionsId: string | undefined;
  20 │ }

0.73 packages/alchemy/src/AWS/EC2/Volume.ts:162:1
  160 │   never,
  161 │   Providers
> 162 │ > {}

0.73 packages/alchemy/src/AWS/GlobalAccelerator/Listener.ts:10:1
   7 │ import type { Providers } from "../Providers.ts";
   8 │ import { retryUntilListenerDeletable, withGaRegion } from "./common.ts";
   9 │
> 10 │ export interface PortRange {
  11 │   /**
  12 │    * First port in the range of ports, inclusive.
  13 │    */
  14 │   fromPort: number;
  15 │   /**
  16 │    * Last port in the range of ports, inclusive.
  17 │    */
  18 │   toPort: number;
  19 │ }

0.73 packages/alchemy/src/AWS/GreengrassV2/GreengrassEventSource.ts:17:1
> 17 │ export interface GreengrassEventDetail {
  18 │   /** The core device thing name the event is about. */
  19 │   coreDeviceThingName?: string;
  20 │   /** Deployment-status events: the id of the deployment. */
  21 │   deploymentId?: string;
  22 │   /**
  23 │    * Deployment-status events: the per-device execution status, e.g.
  24 │    * `SUCCEEDED`, `FAILED`, `REJECTED`, `TIMED_OUT`.
  25 │    */
  26 │   coreDeviceExecutionStatus?: string;
  27 │   /** Component-status events: the name of the installed component. */
  28 │   componentName?: string;
  29 │   /** Component-status events: the version of the installed component. */
  30 │   componentVersion?: string;
  31 │   /**
  32 │    * Component-status events: the component's lifecycle state, e.g.
  33 │    * `RUNNING`, `ERRORED`, `BROKEN`.
  34 │    */
  35 │   componentLifecycleState?: string;
  36 │   /** Additional event fields (the schema grows over time). */
  37 │   [key: string]: unknown;
  38 │ }

0.73 packages/alchemy/src/AWS/MWAAServerless/Workflow.ts:30:1
> 30 │ export interface WorkflowEncryptionConfiguration {
  31 │   /**
  32 │    * How workflow data is encrypted — `"AWS_MANAGED_KEY"` (the default) or
  33 │    * `"CUSTOMER_MANAGED_KEY"`.
  34 │    *
  35 │    * Encryption cannot be changed in place — changing it replaces the
  36 │    * workflow.
  37 │    * @default "AWS_MANAGED_KEY"
  38 │    */
  39 │   type: mwaa.EncryptionType;
  40 │   /**
  41 │    * ID or ARN of the customer managed KMS key to encrypt workflow data
  42 │    * with. Required when `type` is `"CUSTOMER_MANAGED_KEY"`.
  43 │    */
  44 │   kmsKeyId?: string;
  45 │ }

0.73 packages/alchemy/src/AWS/Neptune/NeptuneEventSource.ts:14:1
> 14 │ export interface NeptuneEventDetail {
  15 │   /** Categories the event belongs to (e.g. `failover`, `maintenance`). */
  16 │   EventCategories?: string[];
  17 │   /** The kind of resource the event is about (e.g. `CLUSTER`, `DB_INSTANCE`). */
  18 │   SourceType?: string;
  19 │   /** ARN of the cluster/instance/snapshot the event is about. */
  20 │   SourceArn?: string;
  21 │   /** When the event occurred (ISO 8601). */
  22 │   Date?: string;
  23 │   /** RDS-plane event id, e.g. `RDS-EVENT-0170`. */
  24 │   EventID?: string;
  25 │   /** Identifier of the source resource. */
  26 │   SourceIdentifier?: string;
  27 │   /** Human-readable description of what happened. */
  28 │   Message?: string;
  29 │   /** Additional event fields (the schema grows over time). */
  30 │   [key: string]: unknown;
  31 │ }

0.73 packages/alchemy/src/AWS/Organizations/OrganizationsEventSource.ts:39:1
> 39 │ export interface OrganizationsEventDetail {
  40 │   /** The event name, e.g. `CreateAccountResult` or `MoveAccount`. */
  41 │   eventName?: OrganizationsEventName | (string & {});
  42 │   /** Always `organizations.amazonaws.com`. */
  43 │   eventSource?: string;
  44 │   /** Always `us-east-1` — Organizations is a global service homed there. */
  45 │   awsRegion?: string;
  46 │   /** When the operation completed. */
  47 │   eventTime?: string;
  48 │   /** For API call events, the request parameters of the operation. */
  49 │   requestParameters?: Record<string, unknown> | null;
  50 │   /** For API call events, the response elements of the operation. */
  51 │   responseElements?: Record<string, unknown> | null;
  52 │   /**
  53 │    * For service events (e.g. `CreateAccountResult`), the asynchronous
  54 │    * outcome — `createAccountStatus.state` is `SUCCEEDED` or `FAILED`.
  55 │    */
  56 │   serviceEventDetails?: Record<string, unknown>;
  57 │   /** Additional CloudTrail record fields (the schema grows over time). */
  58 │   [key: string]: unknown;
  59 │ }

0.73 packages/alchemy/src/AWS/Route53/Record.ts:162:1
> 162 │ export interface Record extends Resource<
  163 │   "AWS.Route53.Record",
  164 │   RecordProps,

0.73 packages/alchemy/src/AWS/S3Control/AccessPoint.ts:21:1
> 21 │ export interface AccessPointPublicAccessBlock {
  22 │   /**
  23 │    * Block new public ACLs and uploading public objects.
  24 │    * @default true
  25 │    */
  26 │   blockPublicAcls?: boolean;
  27 │   /**
  28 │    * Ignore all public ACLs on the access point.
  29 │    * @default true
  30 │    */
  31 │   ignorePublicAcls?: boolean;
  32 │   /**
  33 │    * Block new access point policies that grant public access.
  34 │    * @default true
  35 │    */
  36 │   blockPublicPolicy?: boolean;
  37 │   /**
  38 │    * Restrict access granted by public policies to AWS principals.
  39 │    * @default true
  40 │    */
  41 │   restrictPublicBuckets?: boolean;
  42 │ }

0.73 packages/alchemy/src/AWS/S3Control/MultiRegionAccessPoint.ts:81:3
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

0.73 packages/alchemy/src/AWS/SES/AccountSettings.ts:13:1
  11 │ export type FeatureStatus = sesv2.FeatureStatus;
  12 │
> 13 │ export interface AccountVdmSettings {
  14 │   /**
  15 │    * Whether Virtual Deliverability Manager (VDM) is enabled for the account.
  16 │    */
  17 │   enabled: FeatureStatus;
  18 │   /**
  19 │    * Whether the VDM dashboard's per-message engagement tracking (opens and
  20 │    * clicks) is enabled.
  21 │    */
  22 │   dashboardEngagementMetrics?: FeatureStatus;
  23 │   /**
  24 │    * Whether VDM Guardian's optimized shared delivery is enabled.
  25 │    */
  26 │   guardianOptimizedSharedDelivery?: FeatureStatus;
  27 │ }

0.73 packages/alchemy/src/AWS/Transcribe/JobEventSource.ts:214:1
> 214 │ export interface MedicalScribeJobEventSourceProps extends EventRouteProps {
  215 │   /**
  216 │    * Logical id for the backing EventBridge rule.
  217 │    * @default "TranscribeMedicalScribeJobEvents"
  218 │    */
  219 │   id?: string;
  220 │   /**
  221 │    * Only deliver events with these `detail.MedicalScribeJobStatus` values.
  222 │    * @default all statuses
  223 │    */
  224 │   statuses?: readonly string[];
  225 │ }

0.73 packages/alchemy/src/Cloudflare/Pages/Domain.ts:101:3
   97 │ export type Domain = Resource<
   98 │   TypeId,
   99 │   DomainProps,
  100 │   DomainAttributes,
> 101 │   never,
  102 │   Providers
  103 │ >;

0.73 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:21:1
  20 │ /** Object selection shared by all source vendors. */
> 21 │ export interface SuperSlurperSourceSelection {
  22 │   /** Name of the source bucket. Immutable. */
  23 │   bucket: string;
  24 │   /** Object keys to migrate. Omit to migrate all matching objects. Immutable. */
  25 │   keys?: string[];
  26 │   /** Restrict migration to this object key prefix. Immutable. */
  27 │   pathPrefix?: string;
  28 │ }

0.73 packages/alchemy/src/Cloudflare/TokenValidation/Rule.ts:27:1
  24 │ /**
  25 │  * Selects the operations covered by a token validation rule.
  26 │  */
> 27 │ export interface RuleSelector {
  28 │   /**
  29 │    * Operations to include, by host.
  30 │    */
  31 │   include?: {
  32 │     /** Hostnames whose operations the rule covers. */
  33 │     host?: string[];
  34 │   }[];
  35 │   /**
  36 │    * Operations to exclude, by API Shield operation ID.
  37 │    */
  38 │   exclude?: {
  39 │     /** API Shield operation IDs the rule must not cover. */
  40 │     operationIds?: string[];
  41 │   }[];
  42 │ }

0.73 packages/alchemy/src/Git/Protocol/Delta.ts:44:1
> 44 │ export interface DeltaHeader {
  45 │   readonly baseSize: number;
  46 │   readonly resultSize: number;
  47 │   /** Offset of the first instruction byte. */
  48 │   readonly offset: number;
  49 │ }

0.73 packages/alchemy/src/Git/Protocol/PackParser.ts:61:1
> 61 │ export interface RandomAccess {

0.73 packages/alchemy/src/Kubernetes/Connection.ts:34:1
> 34 │ export interface AuthRegistry {

0.73 packages/alchemy/src/Kubernetes/internal/kubeconfig.ts:56:1
> 56 │ interface KubeConfigUser {
  57 │   token?: string;
  58 │   tokenFile?: string;
  59 │   "client-certificate"?: string;
  60 │   "client-certificate-data"?: string;
  61 │   "client-key"?: string;
  62 │   "client-key-data"?: string;
  63 │   exec?: {
  64 │     command?: string;
  65 │     args?: string[];
  66 │     env?: { name?: string; value?: string }[];
  67 │     apiVersion?: string;
  68 │   };
  69 │ }

0.73 packages/alchemy/src/Namespace.ts:5:1
  2 │ import * as Effect from "effect/Effect";
  3 │ import * as Option from "effect/Option";
  4 │
> 5 │ export interface NamespaceNode {
  6 │   Id: string;
  7 │   Parent?: NamespaceNode;
  8 │ }

0.73 packages/alchemy/src/Neon/Function.ts:55:1
> 55 │ export interface FunctionAttributes {
  56 │   /** Owning project. */ projectId: string;
  57 │   /** Owning branch. */ branchId: string;
  58 │   /** Stable function ID. */ functionId: string;
  59 │   /** Immutable invocation slug. */ slug: string;
  60 │   /** Observed display name. */ name: string;
  61 │   /** Public invocation URL. Authenticate callers in the handler. */ url: string;
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

0.73 packages/alchemy/src/Neon/Website/Trace.ts:7:1
   4 │ import * as Schema from "effect/Schema";
   5 │ import * as ChildProcess from "effect/unstable/process/ChildProcess";
   6 │
>  7 │ export interface TraceInput {
   8 │   readonly seeds: string[];
   9 │   readonly base: string;
  10 │   readonly root: string;
  11 │   readonly next: boolean;
  12 │ }

0.73 packages/alchemy/src/Stripe/Price.ts:46:3
  36 │ export interface PriceRecurring {
  37 │   /**
  38 │    * Billing frequency. Create-only — changing it replaces the price.
  39 │    */
  40 │   interval: PriceInterval;
  41 │   /**
  42 │    * Number of intervals between billings. Maximum of three years
  43 │    * (`3` years, `36` months, or `156` weeks).
  44 │    * @default 1
  45 │    */
> 46 │   intervalCount?: number;
  47 │   /**
  48 │    * How quantity per period is determined. `licensed` bills the
  49 │    * subscription quantity; `metered` aggregates usage records.
  50 │    * @default "licensed"
  51 │    */
  52 │   usageType?: PriceUsageType;
  53 │   /**
  54 │    * Meter that tracks usage for a metered price. Create-only.
  55 │    */
  56 │   meter?: string;
  57 │   /**
  58 │    * Default trial length (days) when subscribing with
  59 │    * `trial_from_plan=true`. Create-only.
  60 │    */
  61 │   trialPeriodDays?: number;
  62 │ }

0.73 packages/frontend-frameworks/src/nextjs/Runner.ts:23:1
> 23 │ export interface RunnerConfig {
  24 │   /** The Next.js application root. */
  25 │   readonly appDir: string;
  26 │   /** Explicit config relative to `appDir`; otherwise discover `open-next.config.ts`. */
  27 │   readonly configPath?: string | undefined;
  28 │   /** Resource-selected cache configuration when no native config file is present. */
  29 │   readonly cache?: "static-assets" | "kv" | undefined;
  30 │   /** `compatibility_date` of the in-memory wrangler-config stand-in. */
  31 │   readonly compatibilityDate: string;
  32 │   /** Skip the internal `next build` (reuse an existing `.next`). @default false */
  33 │   readonly skipNextBuild?: boolean | undefined;
  34 │   /** Minify the OpenNext bundling steps. @default false */
  35 │   readonly minify?: boolean | undefined;
  36 │   /** Enable OpenNext debug logging. @default false */
  37 │   readonly debug?: boolean | undefined;
  38 │   /**
  39 │    * The command the pipeline runs to build the Next.js app. Defaults (in the
  40 │    * runner) to `npx next build` — NOT the app's `build` script, which by
  41 │    * fixture convention is `e2e build` and would recurse into this runner.
  42 │    */
  43 │   readonly buildCommand?: string | undefined;
  44 │ }

0.72 packages/alchemy/src/AWS/ACMPCA/CertificateAuthority.ts:201:1
> 201 │ export interface CertificateAuthority extends Resource<
  202 │   "AWS.ACMPCA.CertificateAuthority",
  203 │   CertificateAuthorityProps,
  204 │   {
  205 │     /** The ARN of the certificate authority. */
  206 │     certificateAuthorityArn: string;
  207 │     /** The status of the CA (e.g. `PENDING_CERTIFICATE`, `ACTIVE`). */
  208 │     status: acmpca.CertificateAuthorityStatus;
  209 │   },
  210 │   never,
  211 │   Providers
  212 │ > {}

0.72 packages/alchemy/src/AWS/AMP/RuleGroupsNamespace.ts:17:1
> 17 │ export interface RuleGroupsNamespaceProps {
  18 │   /**
  19 │    * Id of the AMP workspace this rule groups namespace belongs to. Changing
  20 │    * the workspace replaces the namespace.
  21 │    */
  22 │   workspaceId: string;
  23 │   /**
  24 │    * Name of the rule groups namespace. Changing the name replaces the
  25 │    * namespace.
  26 │    */
  27 │   name: string;
  28 │   /**
  29 │    * The rules definition as a Prometheus-format YAML document (the same
  30 │    * shape as a `prometheus.yml` `groups:` file). Updated in place.
  31 │    */
  32 │   definition: string;
  33 │   /**
  34 │    * User-defined tags for the namespace.
  35 │    */
  36 │   tags?: Record<string, string>;
  37 │ }

0.72 packages/alchemy/src/AWS/ApiGateway/Method.ts:332:1
> 332 │ const readMethodSnapshot = (p: {
  333 │   restApiId: string;
  334 │   resourceId: string;
  335 │   httpMethod: string;

0.72 packages/alchemy/src/AWS/AppRunner/ObservabilityConfiguration.ts:48:1
> 48 │ export interface ObservabilityConfiguration extends Resource<
  49 │   "AWS.AppRunner.ObservabilityConfiguration",
  50 │   ObservabilityConfigurationProps,
  51 │   {
  52 │     /**
  53 │      * Name of the observability configuration.
  54 │      */
  55 │     observabilityConfigurationName: string;
  56 │     /**
  57 │      * ARN of this observability configuration revision.
  58 │      */
  59 │     observabilityConfigurationArn: string;
  60 │     /**
  61 │      * Revision number of the configuration (revisions are immutable).
  62 │      */
  63 │     observabilityConfigurationRevision: number;
  64 │     /**
  65 │      * The configured tracing vendor, if tracing is enabled.
  66 │      */
  67 │     traceVendor: string | undefined;
  68 │   },
  69 │   never,
  70 │   Providers
  71 │ > {}

0.72 packages/alchemy/src/AWS/AuditManager/Control.ts:102:1
> 102 │ export interface Control extends Resource<
  103 │   "AWS.AuditManager.Control",
  104 │   ControlProps,

0.72 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:161:1
> 161 │ export const Cluster = Resource<Cluster>("AWS.CloudHSMV2.Cluster");

0.72 packages/alchemy/src/AWS/Cognito/IdentityProvider.ts:55:1
> 55 │ export interface IdentityProvider extends Resource<
  56 │   "AWS.Cognito.IdentityProvider",
  57 │   IdentityProviderProps,
  58 │   {
  59 │     /** The name of the identity provider. */
  60 │     providerName: string;
  61 │     /** The ID of the user pool the IdP is attached to. */
  62 │     userPoolId: string;
  63 │     /** The kind of identity provider. */
  64 │     providerType: IdentityProviderType;
  65 │   },
  66 │   never,
  67 │   Providers
  68 │ > {}

0.72 packages/alchemy/src/AWS/CostExplorer/CostCategory.ts:206:9
> 206 │         read: Effect.fn(function* ({ id, olds, output }) {
  207 │           const live = output?.costCategoryArn
  208 │             ? yield* getByArn(output.costCategoryArn)
  209 │             : yield* findByName(yield* createName(id, olds ?? {}));
  210 │           if (live === undefined) return undefined;
  211 │           const attrs = yield* toAttrs(live);
  212 │           return (yield* hasAlchemyTags(id, attrs.tags))
  213 │             ? attrs
  214 │             : Unowned(attrs);
  215 │         }),

0.72 packages/alchemy/src/AWS/DAX/ParameterGroup.ts:10:1
   7 │ import { Resource } from "../../Resource.ts";
   8 │ import type { Providers } from "../Providers.ts";
   9 │
> 10 │ export interface ParameterGroupProps {
  11 │   /**
  12 │    * Name of the parameter group. If omitted, a deterministic physical name
  13 │    * is generated. Changing the name replaces the parameter group.
  14 │    */
  15 │   parameterGroupName?: string;
  16 │   /**
  17 │    * Human-readable description of the parameter group.
  18 │    */
  19 │   description?: string;
  20 │   /**
  21 │    * Parameter overrides, e.g. `{ "query-ttl-millis": "60000" }`. DAX exposes
  22 │    * two tunable parameters: `query-ttl-millis` and `record-ttl-millis`.
  23 │    * DAX has no reset-to-default API, so a key removed from this map keeps
  24 │    * its last applied value.
  25 │    */
  26 │   parameters?: Record<string, string>;
  27 │ }

0.72 packages/alchemy/src/AWS/DLM/LifecyclePolicy.ts:685:8
  680 │       /**
  681 │        * Ensure the auto-created execution role exists with `dlm.amazonaws.com`
  682 │        * trust and the AWS managed policy matching the policy type. Idempotent:
  683 │        * tolerates the role already existing; attaching an already-attached
  684 │        * managed policy is a no-op.
> 685 │        */

0.72 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:101:1
   99 │   never,
  100 │   Providers
> 101 │ > {}

0.72 packages/alchemy/src/AWS/EC2/RouteTable.ts:497:1
  494 │ /**
  495 │  * Describe a route table by ID
  496 │  */
> 497 │ const describeRouteTable = (
  498 │   routeTableId: string,
  499 │   _session?: ScopedPlanStatusSession,
  500 │ ) =>
  501 │   Effect.gen(function* () {
  502 │     const result = yield* ec2
  503 │       .describeRouteTables({ RouteTableIds: [routeTableId] })
  504 │       .pipe(
  505 │         Effect.catchTag("InvalidRouteTableID.NotFound", () =>
  506 │           Effect.succeed({ RouteTables: [] }),
  507 │         ),
  508 │       );
  509 │
  510 │     const routeTable = result.RouteTables?.[0];
  511 │     if (!routeTable) {
  512 │       // createRouteTable can return before the new ID is visible to
  513 │       // describeRouteTables. Keep the ID in this reconcile and retry the
  514 │       // observation instead of failing after create and losing the only
  515 │       // handle the engine has for cleanup.
  516 │       return yield* new RouteTableNotVisible({ routeTableId });
  517 │     }
  518 │     return routeTable;
  519 │   }).pipe(
  520 │     Effect.retry({
  521 │       while: (error) => error instanceof RouteTableNotVisible,
  522 │       schedule: Schedule.max([Schedule.fixed(500), Schedule.recurs(10)]),
  523 │     }),
  524 │   );

0.72 packages/alchemy/src/AWS/EC2/Vpc.ts:23:1
  21 │ export type VpcArn = `arn:aws:ec2:${RegionID}:${AccountID}:vpc/${VpcId}`;
  22 │
> 23 │ export interface VpcProps {

0.72 packages/alchemy/src/AWS/ELBv2/TrustStore.ts:81:1
> 81 │ export const TrustStore = Resource<TrustStore>("AWS.ELBv2.TrustStore");

0.72 packages/alchemy/src/AWS/EMRContainers/VirtualCluster.ts:42:1
> 42 │ export interface VirtualClusterProps {
  43 │   /**
  44 │    * Name of the virtual cluster (1-64 characters: letters, digits, `.` `_`
  45 │    * `/` `#` `-`). Changing the name replaces the virtual cluster.
  46 │    * @default a generated physical name
  47 │    */
  48 │   virtualClusterName?: string;
  49 │   /**
  50 │    * The EKS cluster and namespace this virtual cluster maps to. Virtual
  51 │    * clusters are immutable — any change replaces the virtual cluster.
  52 │    */
  53 │   containerProvider: VirtualClusterContainerProvider;
  54 │   /**
  55 │    * The ID of an EMR containers security configuration to attach. Changing
  56 │    * it replaces the virtual cluster.
  57 │    */
  58 │   securityConfigurationId?: string;
  59 │   /**
  60 │    * Tags to apply to the virtual cluster. Merged with the internal Alchemy
  61 │    * tags.
  62 │    */
  63 │   tags?: Record<string, string>;
  64 │ }

0.72 packages/alchemy/src/AWS/IAM/ServerCertificate.ts:22:3
  18 │ export interface ServerCertificateProps {
  19 │   /**
  20 │    * Name of the server certificate. If omitted, a deterministic name is generated.
  21 │    */
> 22 │   serverCertificateName?: string;
  23 │   /**
  24 │    * Optional IAM path prefix.
  25 │    * @default "/"
  26 │    */
  27 │   path?: string;
  28 │   /**
  29 │    * PEM-encoded leaf certificate body.
  30 │    */
  31 │   certificateBody: string;
  32 │   /**
  33 │    * PEM-encoded private key. AWS never returns this after upload.
  34 │    */
  35 │   privateKey: Redacted.Redacted<string> | string;
  36 │   /**
  37 │    * Optional PEM-encoded certificate chain.
  38 │    */
  39 │   certificateChain?: string;
  40 │   /**
  41 │    * User-defined tags.
  42 │    */
  43 │   tags?: Record<string, string>;
  44 │ }

0.72 packages/alchemy/src/AWS/LakeFormation/ResourceSpec.ts:7:1
>  7 │ export interface CatalogSpec {
   8 │   /**
   9 │    * The catalog id (AWS account id).
  10 │    * @default the caller's account
  11 │    */
  12 │   id?: string;
  13 │ }

0.72 packages/alchemy/src/AWS/LicenseManager/LicenseConfiguration.ts:21:1
  19 │ export type LicenseCountingType = "vCPU" | "Instance" | "Core" | "Socket";
  20 │
> 21 │ export interface LicenseConfigurationProps {

0.72 packages/alchemy/src/AWS/MWAAServerless/WorkflowRunEventSource.ts:15:1
> 15 │ export interface WorkflowRunEventDetail {
  16 │   /** ARN of the workflow the event is about. */
  17 │   workflowArn?: string;
  18 │   /** The run the event is about. */
  19 │   runId?: string;
  20 │   /** Task events: the task instance the event is about. */
  21 │   taskInstanceId?: string;
  22 │   /** The state transitioned to, e.g. `RUNNING`, `SUCCESS`, `FAILED`. */
  23 │   status?: string;
  24 │   /** Additional event fields (the schema grows over time). */
  25 │   [key: string]: unknown;
  26 │ }

0.72 packages/alchemy/src/AWS/Neptune/DBClusterParameterGroup.ts:41:1
> 41 │ export interface DBClusterParameterGroup extends Resource<
  42 │   "AWS.Neptune.DBClusterParameterGroup",
  43 │   DBClusterParameterGroupProps,
  44 │   {
  45 │     /** Name of the parameter group. */
  46 │     dbClusterParameterGroupName: string;
  47 │     /** ARN of the parameter group. */
  48 │     dbClusterParameterGroupArn: string | undefined;
  49 │     /** Parameter group family (e.g. `neptune1.4`). */
  50 │     family: string;
  51 │     /** Description of the parameter group. */
  52 │     description: string | undefined;
  53 │     /** Non-default parameter values applied to the group. */
  54 │     parameters: Record<string, string>;
  55 │     /** Tags on the parameter group (user + internal Alchemy tags). */
  56 │     tags: Record<string, string>;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ > {}

0.72 packages/alchemy/src/AWS/Neptune/DBParameterGroup.ts:41:1
> 41 │ export interface DBParameterGroup extends Resource<
  42 │   "AWS.Neptune.DBParameterGroup",
  43 │   DBParameterGroupProps,
  44 │   {
  45 │     /** Name of the parameter group. */
  46 │     dbParameterGroupName: string;
  47 │     /** ARN of the parameter group. */
  48 │     dbParameterGroupArn: string | undefined;
  49 │     /** Parameter group family (e.g. `neptune1.4`). */
  50 │     family: string;
  51 │     /** Description of the parameter group. */
  52 │     description: string | undefined;
  53 │     /** Non-default parameter values applied to the group. */
  54 │     parameters: Record<string, string>;
  55 │     /** Tags on the parameter group (user + internal Alchemy tags). */
  56 │     tags: Record<string, string>;
  57 │   },
  58 │   never,
  59 │   Providers
  60 │ > {}

0.72 packages/alchemy/src/AWS/QBusiness/DataSource.ts:21:1
  19 │ export type DataSourceStatus = qbusiness.DataSourceStatus;
  20 │
> 21 │ export interface DataSourceProps {

0.72 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:239:19
  224 │             yield* rds
  225 │               .createDBClusterEndpoint({
  226 │                 DBClusterIdentifier: news.dbClusterIdentifier,
  227 │                 DBClusterEndpointIdentifier: identifier,
  228 │                 EndpointType: news.endpointType,
  229 │                 StaticMembers: news.staticMembers,
  230 │                 ExcludedMembers: news.excludedMembers,
  231 │                 Tags: Object.entries(desiredTags).map(([Key, Value]) => ({
  232 │                   Key,
  233 │                   Value,
  234 │                 })),
  235 │               })
  236 │               .pipe(
  237 │                 Effect.catchTag(
  238 │                   "DBClusterEndpointAlreadyExistsFault",
> 239 │                   () => Effect.void,
  240 │                 ),
  241 │               );
  242 │             observed = yield* readEndpoint(identifier);

0.72 packages/alchemy/src/AWS/RDS/DBClusterParameterGroup.ts:236:11
  231 │           if (upsert.length > 0 && dbClusterParameterGroupArn) {
  232 │             yield* rds.addTagsToResource({
  233 │               ResourceName: dbClusterParameterGroupArn,
  234 │               Tags: upsert,
  235 │             });
> 236 │           }

0.72 packages/alchemy/src/AWS/Redshift/Cluster.ts:700:7
> 700 │       };
  701 │     }),
  702 │   );

0.72 packages/alchemy/src/AWS/RedshiftServerless/RedshiftServerlessEventSource.ts:13:1
> 13 │ export interface RedshiftServerlessEventDetail {
  14 │   /** Categories the event belongs to (e.g. `configuration`, `monitoring`). */
  15 │   eventCategories?: string[];
  16 │   /** Severity of the event (e.g. `INFO`, `ERROR`). */
  17 │   severity?: string;
  18 │   /** Human-readable description of what happened. */
  19 │   eventMessage?: string;
  20 │   /** Identifier of the namespace/workgroup/snapshot the event is about. */
  21 │   sourceId?: string;
  22 │   /** The kind of resource the event is about (e.g. `NAMESPACE`, `WORKGROUP`). */
  23 │   sourceType?: string;
  24 │   /** Additional event fields (the schema grows over time). */
  25 │   [key: string]: unknown;
  26 │ }

0.72 packages/alchemy/src/AWS/Shield/Subscription.ts:38:3
  21 │ export interface Subscription extends Resource<
  22 │   "AWS.Shield.Subscription",
  23 │   SubscriptionProps,
  24 │   {
  25 │     /** ARN of the subscription. */
  26 │     subscriptionArn: string | undefined;
  27 │     /** Start of the current subscription period (ISO timestamp). */
  28 │     startTime: string | undefined;
  29 │     /** End of the current subscription period (ISO timestamp). */
  30 │     endTime: string | undefined;
  31 │     /** Length of the commitment, in seconds (1 year). */
  32 │     timeCommitmentInSeconds: number | undefined;
  33 │     /** Whether the subscription auto-renews. */
  34 │     autoRenew: string | undefined;
  35 │     /** Whether proactive engagement by the Shield Response Team is enabled. */
  36 │     proactiveEngagementStatus: string | undefined;
  37 │   },
> 38 │   never,
  39 │   Providers
  40 │ > {}

0.72 packages/alchemy/src/Cloudflare/Images/Variant.ts:86:1
> 86 │ export type Variant = Resource<
  87 │   TypeId,
  88 │   VariantProps,
  89 │   VariantAttributes,
  90 │   never,
  91 │   Providers
  92 │ >;

0.72 packages/alchemy/src/Cloudflare/LoadBalancer/Pool.ts:81:1
> 81 │ export interface PoolProps {

0.72 packages/alchemy/src/Cloudflare/Pages/Project.ts:181:3
  177 │ export type Project = Resource<
  178 │   TypeId,
  179 │   ProjectProps,
  180 │   ProjectAttributes,
> 181 │   never,
  182 │   Providers
  183 │ >;

0.72 packages/alchemy/src/Cloudflare/Pipelines/LegacyPipeline.ts:23:1
> 23 │ export interface LegacyPipelineHttpSource {
  24 │   /** Accept events over HTTP at the pipeline endpoint. */
  25 │   type: "http";
  26 │   /**
  27 │    * Require Cloudflare API-token authentication on the ingest endpoint.
  28 │    * @default false
  29 │    */
  30 │   authentication?: boolean;
  31 │   /**
  32 │    * CORS configuration for browser-originated ingestion.
  33 │    */
  34 │   cors?: {
  35 │     /** Allowed origins, e.g. `["https://example.com"]` or `["*"]`. */
  36 │     origins?: string[];
  37 │   };
  38 │ }

0.72 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:163:1
> 163 │ export type SinkProps =
  164 │   | (SinkBaseProps & {
  165 │       /**
  166 │        * Sink type — `r2` writes raw files to an R2 bucket.
  167 │        */
  168 │       type: "r2";
  169 │       /**
  170 │        * R2 destination configuration.
  171 │        */
  172 │       config: SinkR2Config;
  173 │     })
  174 │   | (SinkBaseProps & {
  175 │       /**
  176 │        * Sink type — `r2_data_catalog` writes Iceberg tables via the R2
  177 │        * Data Catalog.
  178 │        */
  179 │       type: "r2_data_catalog";
  180 │       /**
  181 │        * R2 Data Catalog destination configuration.
  182 │        */
  183 │       config: SinkR2DataCatalogConfig;
  184 │     });

0.72 packages/alchemy/src/Cloudflare/Registrar/Domain.ts:21:1
> 21 │ export interface DomainSettings {
  22 │   /**
  23 │    * Whether the registration auto-renews before it expires.
  24 │    */
  25 │   autoRenew?: boolean;
  26 │   /**
  27 │    * Whether the registrar transfer lock is in place (blocks transfers to
  28 │    * another registrar).
  29 │    */
  30 │   locked?: boolean;
  31 │   /**
  32 │    * Whether WHOIS information is redacted.
  33 │    */
  34 │   privacy?: boolean;
  35 │ }

0.72 packages/alchemy/src/Cloudflare/Snippets/Snippet.ts:21:3
> 21 │   zoneId: string;

0.72 packages/alchemy/src/GitHub/Env.ts:8:1
   5 │ import * as Option from "effect/Option";
   6 │ import * as String from "effect/String";
   7 │
>  8 │ export interface GitHubEnv {
   9 │   /** The commit SHA that triggered the workflow run. */
  10 │   readonly sha: string;
  11 │   /** The repository owner from `GITHUB_REPOSITORY_OWNER`. */
  12 │   readonly owner: string;
  13 │   /** The repository name parsed from `GITHUB_REPOSITORY`. */
  14 │   readonly repository: string;
  15 │   /** The pull request number exported by the Alchemy GitHub Action. */
  16 │   readonly pr: number | undefined;
  17 │ }

0.72 packages/alchemy/src/GitHub/Environment.ts:81:3
  79 │ export interface Environment extends Resource<
  80 │   "GitHub.Environment",
> 81 │   EnvironmentProps,

0.72 packages/alchemy/src/Hetzner/Server.ts:204:5
  202 │     serverId: number;
  203 │     /** Server name (unique per project). */
> 204 │     name: string;
  205 │     /** Server status. */
  206 │     status: ServerStatus;

0.72 packages/alchemy/src/Infisical/AuthProvider.ts:181:3
  178 │ const resolve = (
  179 │   config: InfisicalAuthConfig,
  180 │ ): Effect.Effect<
> 181 │   InfisicalResolvedCredentials,
  182 │   AuthError,
  183 │   HttpClient.HttpClient
  184 │ > =>
  185 │   config.method === "universal-auth"
  186 │     ? mintAccessToken(config)
  187 │     : Effect.succeed({
  188 │         token: Redacted.make(config.token),
  189 │         apiBaseUrl: config.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  190 │       });

0.72 packages/alchemy/src/Neon/AuthTrustedDomain.ts:10:1
   7 │ import { authPlanScope, authRequest, InvalidManagedAuth } from "./Auth.ts";
   8 │ import type { Providers } from "./Providers.ts";
   9 │
> 10 │ export interface AuthTrustedDomainProps {
  11 │   /** Managed Auth integration to trust the origin on. */
  12 │   auth: { projectId: string; branchId: string };
  13 │   /** Exact trusted origin, including scheme and optional port. */
  14 │   domain: string;
  15 │ }

0.72 packages/alchemy/src/Neon/OrganizationMemberRole.ts:41:1
> 41 │ export interface OrganizationMemberRoleAttributes {
  42 │   /** Organization containing the membership. */
  43 │   orgId: string;
  44 │   /** Existing membership controlled by this resource. */
  45 │   memberId: string;
  46 │   /** Observed organization role. */
  47 │   role: OrganizationRole;
  48 │   /** Original role and ownership evidence required for safe restoration. */
  49 │   baseline: GovernanceRoleBaseline<OrganizationRole>;
  50 │ }

0.72 packages/alchemy/src/Planetscale/Database.ts:6:1
   3 │ /**
   4 │  * Region selector for a PlanetScale Database.
   5 │  */
>  6 │ export interface DatabaseRegion {
   7 │   /**
   8 │    * Region slug (e.g. `"us-east"`, `"eu-west"`, `"gcp-us-central1"`).
   9 │    * @see https://planetscale.com/docs/concepts/regions#available-regions
  10 │    */
  11 │   slug: "us-east" | "eu-west" | "gcp-us-central1" | (string & {});
  12 │ }

0.72 packages/alchemy/src/Railway/local-context.ts:21:3
  18 │ const TAR_BLOCK_BYTES = 512;
  19 │
  20 │ export interface RailwayLocalContextSource {
> 21 │   readonly context: string;
  22 │   readonly dockerfilePath?: string;
  23 │ }

0.72 packages/alchemy/src/Stripe/BillingMeter.ts:44:1
> 44 │ export interface BillingMeterCustomerMapping {
  45 │   /**
  46 │    * Key in the meter event payload used to map the event to a customer.
  47 │    */
  48 │   eventPayloadKey: string;
  49 │   /**
  50 │    * Mapping method. Must be `by_id`.
  51 │    * @default "by_id"
  52 │    */
  53 │   type?: BillingMeterCustomerMappingType;
  54 │ }

0.72 packages/alchemy/src/Stripe/PaymentLink.ts:62:1
> 62 │ export interface PaymentLinkLineItem {
  63 │   /**
  64 │    * Stripe Price id (`price_…`). Changing the set of prices replaces
  65 │    * the payment link — existing items can only change quantity.
  66 │    */
  67 │   price: string;
  68 │   /**
  69 │    * Quantity of this line item. Mutable for existing items.
  70 │    */
  71 │   quantity: number;
  72 │   /**
  73 │    * When set, the customer can adjust quantity during checkout.
  74 │    */
  75 │   adjustableQuantity?: PaymentLinkLineItemAdjustableQuantity;
  76 │ }

0.71 packages/alchemy/src/ACME/Errors.ts:4:1
   1 │ import * as Data from "effect/Data";
   2 │
   3 │ /** A problem the CA attached to an order or one of its identifiers. */
>  4 │ export interface IdentifierProblem {
   5 │   /** The identifier the problem concerns, when the CA said. */
   6 │   readonly identifier?: string | undefined;
   7 │   /** The `urn:ietf:params:acme:error:*` type. */
   8 │   readonly type?: string | undefined;
   9 │   /** Human-readable detail from the CA. */
  10 │   readonly detail?: string | undefined;
  11 │ }

0.71 packages/alchemy/src/Alchemist/routes/nuke.ts:18:1
> 18 │ export interface ScanInput extends Target {
  19 │   readonly mode: ProviderMode;
  20 │   /** Provider-id globs to include. Omitted means every provider. */
  21 │   readonly include?: ReadonlyArray<string>;
  22 │   /** Provider-id globs to exclude. Applied after `include`. */
  23 │   readonly exclude?: ReadonlyArray<string>;
  24 │   readonly concurrency?: number | "unbounded";
  25 │   readonly providerTimeoutSeconds?: number;
  26 │ }

0.71 packages/alchemy/src/AWS/AMP/Scraper.ts:104:1
> 104 │ export interface Scraper extends Resource<
  105 │   "AWS.AMP.Scraper",
  106 │   ScraperProps,
  107 │   {
  108 │     scraperId: string;
  109 │     scraperArn: string;
  110 │     roleArn: string;
  111 │     alias: string | undefined;
  112 │     status: string;
  113 │   },
  114 │   never,
  115 │   Providers
  116 │ > {}

0.71 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalingPolicy.ts:278:9
> 278 │         diff: Effect.fn(function* ({ id, news, olds }) {
  279 │           if (!isResolved(news)) return undefined;
  280 │           const oldName = yield* toName(id, olds ?? {});
  281 │           const newName = yield* toName(id, news);
  282 │           if (oldName !== newName) {
  283 │             return { action: "replace" } as const;
  284 │           }
  285 │           // The target triple pins the policy to a scalable target — any
  286 │           // change replaces the policy. Only compare sides that are known:
  287 │           // a half-created state row may have lost Output-valued props.
  288 │           for (const key of [
  289 │             "serviceNamespace",
  290 │             "resourceId",
  291 │             "scalableDimension",
  292 │           ] as const) {
  293 │             const oldValue = olds?.[key];
  294 │             if (
  295 │               oldValue !== undefined &&
  296 │               isResolved(oldValue) &&
  297 │               oldValue !== news[key]
  298 │             ) {
  299 │               return { action: "replace" } as const;
  300 │             }
  301 │           }
  302 │         }),

0.71 packages/alchemy/src/AWS/ApplicationSignals/ServiceLevelObjective.ts:342:11
  339 │           const sloName = output?.sloName ?? (yield* createSloName(id, news));
  340 │           const internalTags = yield* createInternalTags(id);
  341 │           const desiredTags = { ...news.tags, ...internalTags };
> 342 │           const desired = desiredState(news);

0.71 packages/alchemy/src/AWS/AppRegistry/AttributeGroup.ts:18:1
  15 │ import type { Providers } from "../Providers.ts";
  16 │ import { clientToken, stripAwsSystemTags } from "./internal.ts";
  17 │
> 18 │ export interface AttributeGroupProps {
  19 │   /**
  20 │    * Name of the attribute group. Must be unique in the account and region
  21 │    * and may only contain letters, numbers, dots, dashes, and underscores.
  22 │    * If omitted, a unique name is generated. Changing it replaces the
  23 │    * attribute group.
  24 │    */
  25 │   attributeGroupName?: string;
  26 │   /**
  27 │    * Description of the attribute group. Updatable in place.
  28 │    */
  29 │   description?: string;
  30 │   /**
  31 │    * Open-content metadata for the group as a JSON object (max 8 KB).
  32 │    * Updatable in place.
  33 │    */
  34 │   attributes: Record<string, unknown>;
  35 │   /**
  36 │    * Tags to apply to the attribute group. Merged with internal Alchemy tags.
  37 │    */
  38 │   tags?: Record<string, string>;
  39 │ }

0.71 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:102:1
> 102 │ export interface ComputeEnvironment extends Resource<
  103 │   "AWS.Batch.ComputeEnvironment",
  104 │   ComputeEnvironmentProps,
  105 │   {
  106 │     computeEnvironmentName: ComputeEnvironmentName;
  107 │     computeEnvironmentArn: ComputeEnvironmentArn;
  108 │     ecsClusterArn: string | undefined;
  109 │     managementType: "MANAGED" | "UNMANAGED";
  110 │     type: "FARGATE" | "FARGATE_SPOT";
  111 │     state: "ENABLED" | "DISABLED";
  112 │     status: string;
  113 │     maxvCpus: number;
  114 │     unmanagedvCpus: number;
  115 │     subnets: string[];
  116 │     securityGroupIds: string[];
  117 │     tags: Record<string, string>;
  118 │   },
  119 │   never,
  120 │   Providers
  121 │ > {}

0.71 packages/alchemy/src/AWS/Batch/JobQueue.ts:62:1
> 62 │ export interface JobQueue extends Resource<
  63 │   "AWS.Batch.JobQueue",
  64 │   JobQueueProps,
  65 │   {
  66 │     jobQueueName: JobQueueName;
  67 │     jobQueueArn: JobQueueArn;
  68 │     state: "ENABLED" | "DISABLED";
  69 │     status: string;
  70 │     priority: number;
  71 │     computeEnvironments: string[];
  72 │     tags: Record<string, string>;
  73 │   },
  74 │   never,
  75 │   Providers
  76 │ > {}

0.71 packages/alchemy/src/AWS/CloudFront/RealtimeLogConfig.ts:220:1
> 220 │ export const RealtimeLogConfigProvider = () =>
  221 │   Provider.effect(
  222 │     RealtimeLogConfig,

0.71 packages/alchemy/src/AWS/Config/ConfigurationRecorder.ts:201:5
  199 │ export const ConfigurationRecorderProvider = () =>
  200 │   Provider.effect(
> 201 │     ConfigurationRecorder,

0.71 packages/alchemy/src/AWS/DataBrew/Ruleset.ts:21:3
  19 │ /** A single data-quality rule (a check expression + optional threshold). */
  20 │ export interface RulesetRule {
> 21 │   /** The rule name (unique within the ruleset). */
  22 │   name: string;
  23 │   /** Skip the rule without deleting it. @default false */
  24 │   disabled?: boolean;

0.71 packages/alchemy/src/AWS/EC2/NetworkInterface.ts:142:1
  140 │   never,
  141 │   Providers
> 142 │ > {}

0.71 packages/alchemy/src/AWS/EC2/RouteTableAssociation.ts:42:1
> 42 │ export interface RouteTableAssociation extends Resource<
  43 │   "AWS.EC2.RouteTableAssociation",
  44 │   RouteTableAssociationProps,

0.71 packages/alchemy/src/AWS/EC2/Snapshot.ts:61:5
  58 │     /**
  59 │      * The ID of the volume the snapshot was created from.
  60 │      */
> 61 │     volumeId: VolumeId;

0.71 packages/alchemy/src/AWS/ECS/ClusterEventSource.ts:16:1
> 16 │ export interface ClusterEventDetail {
  17 │   /** ARN of the cluster the event's resource belongs to. */
  18 │   clusterArn?: string;
  19 │   /** Task events: the state the task transitioned to (e.g. `STOPPED`). */
  20 │   lastStatus?: string;
  21 │   /** Task events: desired state of the task. */
  22 │   desiredStatus?: string;
  23 │   /** Task events: why the task stopped. */
  24 │   stoppedReason?: string;
  25 │   /** Task events: ARN of the task. */
  26 │   taskArn?: string;
  27 │   /** Task events: what started the task (e.g. `ecs-svc/…` for services). */
  28 │   startedBy?: string;
  29 │   /** Deployment / service-action events: the event name (e.g. `SERVICE_DEPLOYMENT_COMPLETED`). */
  30 │   eventName?: string;
  31 │   /** Deployment / service-action events: human-readable reason. */
  32 │   reason?: string;
  33 │   /** Additional event fields (the schema grows over time). */
  34 │   [key: string]: unknown;
  35 │ }

0.71 packages/alchemy/src/AWS/ELBv2/ListenerCertificate.ts:12:1
   9 │ import type { Providers } from "../Providers.ts";
  10 │ import type { Listener, ListenerArn } from "./Listener.ts";
  11 │
> 12 │ export interface ListenerCertificateProps {
  13 │   /** The HTTPS/TLS listener to attach the certificate to. Changing it replaces the attachment. */
  14 │   listenerArn: Input<ListenerArn> | Listener;
  15 │   /** The ARN of the ACM (or IAM) certificate to add to the listener's SNI certificate list. Changing it replaces the attachment. */
  16 │   certificateArn: string;
  17 │ }

0.71 packages/alchemy/src/AWS/Firehose/DeliveryStream.ts:242:3
> 242 │   never,
  243 │   Providers
  244 │ > {}

0.71 packages/alchemy/src/AWS/GreengrassV2/Deployment.ts:35:1
> 35 │ export interface DeploymentComponent {
  36 │   /**
  37 │    * The version of the component to deploy, e.g. `1.0.0`.
  38 │    */
  39 │   componentVersion: string;
  40 │   /**
  41 │    * Configuration update the deployment applies to the component.
  42 │    */
  43 │   configurationUpdate?: DeploymentComponentConfigurationUpdate;
  44 │ }

0.71 packages/alchemy/src/AWS/IoTManagedIntegrations/ManagedThing.ts:81:1
>  81 │ export interface ManagedThing extends Resource<
   82 │   "AWS.IoTManagedIntegrations.ManagedThing",
   83 │   ManagedThingProps,
   84 │   {
   85 │     /** Service-generated identifier of the managed thing. */
   86 │     managedThingId: string;
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

0.71 packages/alchemy/src/AWS/IoTWireless/WirelessDevice.ts:101:1
> 101 │ export interface LoRaWANDeviceProps {
  102 │   /** The DevEUI radio identifier (public). Changing it replaces the device. */
  103 │   DevEui?: string;
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

0.71 packages/alchemy/src/AWS/IVS/StreamEventSource.ts:18:1
> 18 │ export interface IvsStreamEventDetail {
  19 │   /**
  20 │    * Stream state-change events: `Stream Start`, `Stream End`, or
  21 │    * `Session Created`. Limit-breach events: the name of the breached
  22 │    * limit.
  23 │    */
  24 │   event_name?: string;
  25 │   /** The name of the channel the event is about. */
  26 │   channel_name?: string;
  27 │   /** Stream state-change events: the id of the stream session. */
  28 │   stream_id?: string;
  29 │   /** Limit-breach events: the name of the breached limit. */
  30 │   limit_name?: string;
  31 │   /** Limit-breach events: the value of the breached limit. */
  32 │   limit_value?: number;
  33 │   /** Recording state-change events: the recording session id. */
  34 │   recording_session_id?: string;
  35 │   /**
  36 │    * Recording state-change events: `Recording Start`, `Recording End`,
  37 │    * or `Recording Start Failure`.
  38 │    */
  39 │   recording_status?: string;
  40 │   /** Additional event fields (the schema grows over time). */
  41 │   [key: string]: unknown;
  42 │ }

0.71 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:13:1
> 13 │ export interface MQMessage {
  14 │   /** Base64-encoded message body. */
  15 │   readonly data?: string;
  16 │   /** ActiveMQ message id. */
  17 │   readonly messageID?: string;
  18 │   /** ActiveMQ message type (e.g. `jms/text-message`). */
  19 │   readonly messageType?: string;
  20 │   /** ActiveMQ destination the message was published to. */
  21 │   readonly destination?: { readonly physicalName?: string };
  22 │   /** Whether the message was redelivered. */
  23 │   readonly redelivered?: boolean;
  24 │   /** RabbitMQ basic properties. */
  25 │   readonly basicProperties?: Record<string, unknown>;
  26 │   /** Any additional engine-specific fields. */
  27 │   readonly [key: string]: unknown;
  28 │ }

0.71 packages/alchemy/src/AWS/Organizations/DelegatedAdministrator.ts:188:27
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
  184 │                             servicePrincipal: service.ServicePrincipal,
  185 │                             delegationEnabledDate:
  186 │                               service.DelegationEnabledDate ??
  187 │                               admin.DelegationEnabledDate,
> 188 │                           }) satisfies DelegatedAdministrator["Attributes"],
  189 │                       ),
  190 │                   ),
  191 │                 ),

0.71 packages/alchemy/src/AWS/Organizations/TenantRoot.ts:42:1
> 42 │ export interface TenantOrganizationalUnitSpec extends Omit<
  43 │   OrganizationalUnitProps,
  44 │   "parentId" | "name"
  45 │ > {
  46 │   /** Stable key identifying the OU within the tenant (used in logical IDs and `targetKeys`). */
  47 │   key: string;
  48 │   /**
  49 │    * OU name.
  50 │    * @default the spec `key`
  51 │    */
  52 │   name?: string;
  53 │   /** Member accounts vended directly under this OU. */
  54 │   accounts?: TenantAccountSpec[];
  55 │   /** Nested child OUs. */
  56 │   children?: TenantOrganizationalUnitSpec[];
  57 │ }

0.71 packages/alchemy/src/AWS/ResourceGroups/Group.ts:324:11
  323 │           // ENSURE — create if missing; tolerate the already-exists race.
> 324 │           if (live === undefined) {
  325 │             live = yield* resourcegroups
  326 │               .createGroup({
  327 │                 Name: groupName,
  328 │                 Description: news.description,
  329 │                 ResourceQuery: news.resourceQuery
  330 │                   ? toResourceQuery(news.resourceQuery)
  331 │                   : undefined,
  332 │                 Configuration: news.configuration
  333 │                   ? toConfiguration(news.configuration)
  334 │                   : undefined,
  335 │                 Tags: { ...news.tags, ...internalTags },
  336 │               })
  337 │               .pipe(
  338 │                 Effect.map((r) => r.Group),
  339 │                 Effect.catchTag("GroupAlreadyExists", () =>
  340 │                   resourcegroups
  341 │                     .getGroup({ Group: groupName })
  342 │                     .pipe(Effect.map((r) => r.Group)),
  343 │                 ),
  344 │               );
  345 │           }

0.71 packages/alchemy/src/AWS/RolesAnywhere/Profile.ts:44:1
> 44 │ export interface ProfileAttributeMapping {
  45 │   /**
  46 │    * The certificate field to map: `x509Subject`, `x509Issuer` or `x509SAN`.
  47 │    */
  48 │   certificateField: string;
  49 │   /**
  50 │    * The rules extracting specifiers from the certificate field.
  51 │    */
  52 │   mappingRules: ProfileMappingRule[];
  53 │ }

0.71 packages/alchemy/src/AWS/S3Control/ObjectLambdaAccessPoint.ts:303:13
  302 │           if (
> 303 │             observedConfig.Configuration === undefined ||
  304 │             canon(observedConfig.Configuration) !== canon(desired)
  305 │           ) {
  306 │             yield* s3control.putAccessPointConfigurationForObjectLambda({
  307 │               AccountId: accountId,
  308 │               Name: name,
  309 │               Configuration: desired,
  310 │             });
  311 │           }

0.71 packages/alchemy/src/AWS/S3Files/AccessPoint.ts:41:1
> 41 │ export interface AccessPointCreationPermissions {
  42 │   /**
  43 │    * POSIX user id that owns the root directory.
  44 │    */
  45 │   ownerUid: number;
  46 │   /**
  47 │    * POSIX group id that owns the root directory.
  48 │    */
  49 │   ownerGid: number;
  50 │   /**
  51 │    * POSIX permission mode for the root directory (e.g. `"0755"`).
  52 │    */
  53 │   permissions: string;
  54 │ }

0.71 packages/alchemy/src/AWS/SES/ConfigurationSet.ts:49:1
> 49 │ export interface ConfigurationSetVdmSettings {
  50 │   /**
  51 │    * Whether SES collects engagement (open/click) metrics for the Virtual
  52 │    * Deliverability Manager dashboard for email sent through this configuration
  53 │    * set.
  54 │    */
  55 │   dashboardEngagementMetrics?: sesv2.FeatureStatus;
  56 │   /**
  57 │    * Whether SES applies Guardian optimized shared delivery to email sent
  58 │    * through this configuration set.
  59 │    */
  60 │   guardianOptimizedSharedDelivery?: sesv2.FeatureStatus;
  61 │ }

0.71 packages/alchemy/src/AWS/Transfer/FileTransferEventSource.ts:14:1
> 14 │ export interface FileTransferEventDetail {
  15 │   /** The user that performed the transfer. */
  16 │   username?: string;
  17 │   /** The ID of the server the transfer went through (e.g. `s-…`). */
  18 │   "server-id"?: string;
  19 │   /** Session identifier of the client connection. */
  20 │   "session-id"?: string;
  21 │   /** Additional event fields (the schema grows over time). */
  22 │   [key: string]: unknown;
  23 │ }

0.71 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:15:1
  12 │ // Shared observation scaffolding for the IdentityProvider resource provider
  13 │ // and the GetIdentityProvider data source. NOT exported from `index.ts`.
  14 │
> 15 │ export interface ObservedIdp {
  16 │   readonly id?: string | null;
  17 │   readonly name: string;
  18 │   readonly type: string;
  19 │   readonly scimConfig?: {
  20 │     readonly enabled?: boolean | null;
  21 │     readonly identityUpdateBehavior?: string | null;
  22 │     readonly scimBaseUrl?: string | null;
  23 │     readonly seatDeprovision?: boolean | null;
  24 │     readonly secret?: string | null;
  25 │     readonly userDeprovision?: boolean | null;
  26 │   } | null;
  27 │ }

0.71 packages/alchemy/src/Cloudflare/Auth/TokenPolicy.ts:12:1
> 12 │ export interface TokenPolicy {
  13 │   effect: "allow";
  14 │   permissionGroups: Array<{ id: string }>;
  15 │   resources: Record<string, string>;
  16 │ }

0.71 packages/alchemy/src/Cloudflare/Devices/PostureIntegration.ts:118:3
  114 │ export type DevicePostureIntegration = Resource<
  115 │   TypeId,
  116 │   DevicePostureIntegrationProps,
  117 │   DevicePostureIntegrationAttributes,
> 118 │   never,
  119 │   Providers
  120 │ >;

0.71 packages/alchemy/src/Cloudflare/Iam/ResourceGroup.ts:21:1
> 21 │ export interface ResourceGroupScopeInput {
  22 │   /**
  23 │    * The scope key, e.g. `com.cloudflare.api.account.{accountId}`.
  24 │    */
  25 │   key: string;
  26 │   /**
  27 │    * The objects within the scope this resource group spans, e.g.
  28 │    * `com.cloudflare.api.account.zone.{zoneId}` or `*`.
  29 │    */
  30 │   objects: { key: string }[];
  31 │ }

0.71 packages/alchemy/src/Cloudflare/Iam/UserGroup.ts:44:1
> 44 │ export interface UserGroupPolicy {
  45 │   /**
  46 │    * Server-assigned identifier of the policy. Not stable — Cloudflare
  47 │    * assigns fresh policy ids on every policy update.
  48 │    */
  49 │   id: string | undefined;
  50 │   /** Whether the policy allows or denies. */
  51 │   access: "allow" | "deny";
  52 │   /** IDs of the permission groups in the policy. */
  53 │   permissionGroups: string[];
  54 │   /** IDs of the resource groups in the policy. */
  55 │   resourceGroups: string[];
  56 │ }

0.71 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Config.ts:32:1
> 32 │ export interface ConfigProps {
  33 │   /**
  34 │    * The account name label stored on the MNM configuration. Freeform —
  35 │    * mutable in place.
  36 │    */
  37 │   name: string;
  38 │   /**
  39 │    * Fallback sampling rate of flow messages being sent in packets per
  40 │    * second. This should match the packet sampling rate configured on the
  41 │    * router. Minimum of 1. Mutable in place.
  42 │    */
  43 │   defaultSampling: number;
  44 │   /**
  45 │    * IPv4 CIDR addresses (`/32`) of the routers that send flow data to
  46 │    * Cloudflare. Registering router flow sources requires the Magic Network
  47 │    * Monitoring router-flow entitlement — accounts without it reject any
  48 │    * non-empty value with the typed `InvalidMnmConfig` error (Cloudflare
  49 │    * code 1003).
  50 │    * @default []
  51 │    */
  52 │   routerIps?: string[];
  53 │   /**
  54 │    * WARP devices registered as flow-data sources.
  55 │    * @default []
  56 │    */
  57 │   warpDevices?: WarpDevice[];
  58 │ }

0.71 packages/alchemy/src/Cloudflare/MagicTransit/Site.ts:27:1
> 27 │ export interface MagicSiteProps {

0.71 packages/alchemy/src/Cloudflare/PageShield/Policy.ts:63:1
> 63 │ export interface PolicyAttributes {
  64 │   /** Auto-assigned identifier of the policy. */
  65 │   policyId: string;
  66 │   /** Zone the policy belongs to. */
  67 │   zoneId: string;
  68 │   /** The action taken when the expression matches. */
  69 │   action: PolicyAction;
  70 │   /** Human readable description of the policy. */
  71 │   description: string;
  72 │   /** Whether the policy is enabled. */
  73 │   enabled: boolean;
  74 │   /** The expression that must match for the policy to be applied. */
  75 │   expression: string;
  76 │   /** The Content Security Policy applied by this policy. */
  77 │   value: string;
  78 │ }

0.71 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:41:1
> 41 │ export interface PipelineAttributes {
  42 │   /** Cloudflare-assigned pipeline identifier. */
  43 │   pipelineId: string;
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

0.71 packages/alchemy/src/Cloudflare/Workers/ScheduledEvents.ts:27:1
> 27 │ export interface ScheduledEvent {
  28 │   id: string;
  29 │   runAt: Date;
  30 │   repeatMs?: number;
  31 │   payload: unknown;
  32 │ }

0.71 packages/alchemy/src/Fly/MountVolume.ts:58:1
> 58 │ export interface MountVolumeOptions extends DiskSpec {}

0.71 packages/alchemy/src/Git/PushWire.ts:15:1
  12 │ import type { StagedObject } from "./Store/ObjectStore.ts";
  13 │ import type { ObjectType } from "./Protocol/ObjectCodec.ts";
  14 │
> 15 │ interface RowMeta {
  16 │   /** oid */
  17 │   readonly o: string;
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

0.71 packages/alchemy/src/Neon/Auth.ts:61:1
> 61 │ export interface AuthAttributes {
  62 │   /** Neon project identity. */
  63 │   projectId: string;
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

0.71 packages/alchemy/src/Prisma/PrismaDevDatabase.ts:22:1
> 22 │ interface PrismaDevDatabaseEntry {
  23 │   optionsKey: string;
  24 │   migrationKey: string | undefined;
  25 │   server: Server;
  26 │   attrs: PrismaDevDatabaseAttrs | undefined;
  27 │ }

0.71 packages/alchemy/src/ResourceSelection.ts:6:1
   3 │ import picomatch from "picomatch";
   4 │
   5 │ /** Selection applies after the whole stack declaration evaluates. */
>  6 │ export interface ResourceSelection {
   7 │   /** Exact FQNs, unique logical IDs, or FQN globs; dependencies are included. */
   8 │   readonly include?: ReadonlyArray<string>;
   9 │   /** Hard exclusions. A selected node depending on an excluded node fails planning. */
  10 │   readonly exclude?: ReadonlyArray<string>;
  11 │ }

0.71 packages/alchemy/src/SQL/Migrations/Introspect.ts:5:1
  2 │ import type { SqlExecutor } from "./Format.ts";
  3 │ import { quoteIdentifier, sqlLiteral } from "./Utils.ts";
  4 │
> 5 │ export interface TableColumn {
  6 │   name: string;
  7 │   type: string;
  8 │ }

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/email-worker.ts:29:1
> 29 │ interface ReceivedMessage {
  30 │   from: string;
  31 │   to: string;
  32 │   subject: string | null;
  33 │   bodySize: number;
  34 │   receivedAt: number;
  35 │ }

0.71 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:103:1
   97 │ export interface ReadinessEvent extends TransportEvent {
   98 │   metadata?: Record<string, string>;
   99 │   metadataOnly?: boolean;
  100 │   skipLaunch?: boolean;
  101 │   services?: ReturnType<typeof servicesOf>;
  102 │   serviceConfig?: string;
> 103 │ }
```
