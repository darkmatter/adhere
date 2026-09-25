# effect/data/variants-are-tagged-unions

Structured variants, alternatives that carry fields, must be Schema.TaggedClass members of a Schema.Union, never hand-written object types joined by a tag field. Simple alternatives without fields may be Schema.Literals.

81 findings, from 0.92 down to 0.71. Each showed this hint:

```ts
export class Success extends Schema.TaggedClass<Success>("Success")("Success", {
  value: Schema.Number,
}) {}

export class Failure extends Schema.TaggedClass<Failure>("Failure")("Failure", {
  error: Schema.String,
}) {}

export const Result = Schema.Union([Success, Failure]);
export type Result = typeof Result.Type;

const renderResult = (result: Result) =>
  Match.value(result).pipe(
    Match.tag("Success", ({ value }) => `Got: ${value}`),
    Match.tag("Failure", ({ error }) => `Error: ${error}`),
    Match.exhaustive,
  );
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.92 packages/alchemy/src/AWS/DynamoDB/Expr.ts:11:1
   9 │ //
  10 │
> 11 │ export interface NameRef<Name extends string = string> {
  12 │   kind: "name-ref";
  13 │   name: Name;
  14 │ }

0.91 packages/alchemy/src/AWS/StepFunctions/Asl/Jsonata.ts:37:1
> 37 │ export type ExprNode =
  38 │   | { readonly _: "root"; readonly root: ExprRoot }
  39 │   | { readonly _: "prop"; readonly parent: ExprNode; readonly name: string }
  40 │   | { readonly _: "literal"; readonly value: unknown }
  41 │   | {
  42 │       readonly _: "binop";
  43 │       readonly op: ExprOperator;
  44 │       readonly left: ExprNode;
  45 │       readonly right: ExprNode;
  46 │     }
  47 │   | { readonly _: "not"; readonly inner: ExprNode }
  48 │   /** Raw JSONata escape hatch — compiles verbatim, unsupported by simulate. */
  49 │   | { readonly _: "raw"; readonly jsonata: string };

0.91 packages/alchemy/src/AWS/StepFunctions/Asl/Node.ts:167:1
> 167 │ export type AslNode =
  168 │   | GenNode
  169 │   | InvokeNode
  170 │   | IntegrateNode
  171 │   | AllNode
  172 │   | ForEachNode
  173 │   | SleepNode
  174 │   | WhenNode
  175 │   | MatchNode
  176 │   | SucceedNode
  177 │   | FailNode
  178 │   | RetryNode
  179 │   | CatchNode;

0.90 packages/alchemy/src/Local/RpcSerialization.ts:42:3
  41 │ type RpcSerializedCause<Error> =
> 42 │   | { _tag: "Fail"; error: Error }
  43 │   | { _tag: "Die"; defect: unknown }
  44 │   | { _tag: "Interrupt"; fiberId: number | undefined };

0.90 packages/alchemy/src/Redis/Resp.ts:189:1
  186 │ const ok = (
  187 │   frame: Exclude<ParseResult, { _tag: "Incomplete" | "Protocol" }>,
  188 │   offset: number,
> 189 │ ): Outcome => ({ ok: true, frame, offset });

0.90 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:1:1
> 1 │ export type Subscriber =
  2 │   | Subscriber.Worker
  3 │   | Subscriber.DurableObject
  4 │   | Subscriber.QueueConsumer
  5 │   | Subscriber.Workflow;

0.89 packages/alchemy/src/Fly/DeploymentState.ts:11:3
   9 │ type DeploymentState =
  10 │   | { protocol: "legacy" | "1" | "2" }
> 11 │   | { protocol: "invalid"; reason: string };

0.89 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:9:1
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

0.89 packages/cloudflare-runtime/src/core/platform-proxy/PlatformProxyProtocol.shared.ts:63:3
  60 │   | { readonly $: "bigint"; readonly value: string }
  61 │   | { readonly $: "string"; readonly value: string }
  62 │   | { readonly $: "date"; readonly value: number }
> 63 │   | { readonly $: "bytes"; readonly kind: BytesKind; readonly base64: string }
  64 │   | { readonly $: "array"; readonly value: Array<EncodedValue> }
  65 │   | { readonly $: "object"; readonly value: Record<string, EncodedValue> }
  66 │   | {

0.88 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:1056:9
  1055 │         const updated = toAttributes(application);
> 1056 │         if (!deepEqual(existing.configuration, configuration)) {
  1057 │           yield* Effect.logInfo(
  1058 │             `Cloudflare Container update: creating rollout for ${updated.applicationName}`,
  1059 │           );
  1060 │           yield* maybeCreateRollout({
  1061 │             applicationId: updated.applicationId,
  1062 │             configuration,
  1063 │             rollout: news.rollout,
  1064 │           });
  1065 │         }

0.88 packages/alchemy/src/Cloudflare/Email/Rule.ts:13:1
  10 │ import { listAllZones } from "../Zone/lookup.ts";
  11 │ import { retryWorkerScriptNotFound } from "./retry.ts";
  12 │
> 13 │ export type Matcher =
  14 │   | { type: "all" }
  15 │   | { type: "literal"; field: "to"; value: string };

0.88 packages/alchemy/src/Git/Jobs/Purge.ts:33:1
  30 │ export const MAX_PAGES_PER_RUN = 10;
  31 │
  32 │ /** Outcome of one purge run. */
> 33 │ export type PurgeOutcome =
  34 │   | {
  35 │       /** Everything is gone (R2 prefix, SQLite, Registry row). */
  36 │       readonly _tag: "done";
  37 │     }
  38 │   | {
  39 │       /**
  40 │        * More R2 keys remain (or the prefix is fork-pinned); the caller
  41 │        * must re-arm the alarm and run again.
  42 │        */
  43 │       readonly _tag: "continue";
  44 │       /** True when the prefix was retained because `fork_count > 0`. */
  45 │       readonly forkPinned: boolean;
  46 │     };

0.88 packages/alchemy/src/Git/Protocol/Pkt.ts:81:1
  74 │ const encodeLength = (n: number): Uint8Array => {
  75 │   const out = new Uint8Array(4);
  76 │   out[0] = HEX_CHARS.charCodeAt((n >> 12) & 0xf);
  77 │   out[1] = HEX_CHARS.charCodeAt((n >> 8) & 0xf);
  78 │   out[2] = HEX_CHARS.charCodeAt((n >> 4) & 0xf);
  79 │   out[3] = HEX_CHARS.charCodeAt(n & 0xf);
  80 │   return out;
> 81 │ };

0.88 packages/alchemy/src/Report.ts:121:3
  120 │ export interface ResourceDiffStarted {
> 121 │   readonly _tag: "plan.resource.started";
  122 │   readonly fqn: string;
  123 │   readonly logicalId: string;
  124 │   readonly resourceType: string;
  125 │   readonly total: number;
  126 │ }

0.87 packages/alchemy-test/src/Reporter.ts:59:1
> 59 │ export type TestEvent =
  60 │   | {
  61 │       readonly _tag: "PlanPreview";

0.87 packages/alchemy/src/Cli/components/view/usePlanViewport.ts:12:1
  10 │ import { isTerminalStatus } from "./statusStyle.ts";
  11 │
> 12 │ export type VirtualPlanLine =
  13 │   | { readonly kind: "row"; readonly row: PlanRow }
  14 │   | {
  15 │       readonly kind: "yaml";
  16 │       readonly key: string;
  17 │       readonly line: string;
  18 │       readonly paddingLeft: number;
  19 │     }
  20 │   | {
  21 │       readonly kind: "note";
  22 │       readonly key: string;
  23 │       readonly paddingLeft: number;
  24 │     };

0.87 packages/alchemy/src/Prisma/Internal/Observed.ts:169:3
  164 │ export const narrowDatabaseSource = (
  165 │   source: ObservedSource | undefined | null,
  166 │ ):
  167 │   | { readonly type: "empty" }
  168 │   | { readonly type: "unknown" }
> 169 │   | { readonly type: "database"; readonly databaseId: string }
  170 │   | {
  171 │       readonly type: "backup";
  172 │       readonly databaseId: string;
  173 │       readonly backupId: string;
  174 │     } => {
  175 │   if (source == null) return { type: "empty" };
  176 │   if (source.type === "empty") return { type: "empty" };
  177 │   if (source.type === "database" && source.databaseId !== undefined) {
  178 │     return { type: "database", databaseId: source.databaseId };
  179 │   }
  180 │   if (
  181 │     source.type === "backup" &&
  182 │     source.databaseId !== undefined &&
  183 │     source.backupId !== undefined
  184 │   ) {
  185 │     return {
  186 │       type: "backup",
  187 │       databaseId: source.databaseId,
  188 │       backupId: source.backupId,
  189 │     };
  190 │   }
  191 │   return { type: "unknown" };
  192 │ };

0.87 packages/cloudflare-runtime/src/internal/workflows-shared/subscription.ts:81:3
> 81 │   Schema.Struct({
  82 │     ...WorkflowSubscriptionEventCommonSchema.fields,
  83 │     type: Schema.Literal("workflow_errored"),
  84 │     error: Schema.Struct({ name: Schema.String, message: Schema.String }),
  85 │   }),

0.87 packages/cloudflare-runtime/src/internal/workflows-shared/types.ts:31:3
  30 │ export type WorkflowIntrospectionOperation =
> 31 │   | { type: "disableSleeps"; steps?: Array<WorkflowStepSelector> }
  32 │   | { type: "disableRetryDelays"; steps?: Array<WorkflowStepSelector> }
  33 │   | {
  34 │       type: "mockStepResult";
  35 │       step: WorkflowStepSelector;
  36 │       stepResult: unknown;
  37 │     }
  38 │   | {
  39 │       type: "mockStepError";
  40 │       step: WorkflowStepSelector;
  41 │       error: { name: string; message: string };
  42 │       times?: number;
  43 │     }
  44 │   | { type: "forceStepTimeout"; step: WorkflowStepSelector; times?: number }
  45 │   | { type: "mockEvent"; event: { type: string; payload: unknown } }
  46 │   | { type: "forceEventTimeout"; step: WorkflowStepSelector };

0.86 packages/alchemy/src/AWS/ELBv2/common.ts:133:3
  131 │ export interface AuthenticateCognitoAction {
  132 │   /** Discriminator identifying this as an authenticate-Cognito action. */
> 133 │   type: "authenticateCognito";
  134 │   /** The ARN of the Cognito user pool. */
  135 │   userPoolArn: string;
  136 │   /** The ID of the Cognito user pool client. */
  137 │   userPoolClientId: string;
  138 │   /** The domain prefix or fully-qualified domain of the Cognito user pool. */
  139 │   userPoolDomain: string;
  140 │   /**
  141 │    * The set of user claims requested from Cognito.
  142 │    * @default "openid"
  143 │    */
  144 │   scope?: string;
  145 │   /**
  146 │    * The name of the cookie used to maintain session information.
  147 │    * @default "AWSELBAuthSessionCookie"
  148 │    */
  149 │   sessionCookieName?: string;
  150 │   /** The maximum duration of the authentication session — e.g. `"7 days"`. Sent to AWS as whole seconds. */
  151 │   sessionTimeout?: Duration.Input;
  152 │   /**
  153 │    * Behavior when the user is not authenticated (`deny`, `allow`, or `authenticate`).
  154 │    * @default "authenticate"
  155 │    */
  156 │   onUnauthenticatedRequest?: "deny" | "allow" | "authenticate";
  157 │ }

0.86 packages/alchemy/src/AWS/Website/SsrSite.ts:61:7
  58 │       originProtocolPolicy?: "http-only" | "https-only" | "match-viewer";
  59 │     }
  60 │   | {
> 61 │       type: "url";

0.86 packages/alchemy/src/Alchemist/routes/state.ts:14:1
  11 │ import { open, StackEntrypointError, type Target } from "../Session.ts";
  12 │
  13 │ /** Which store a state request addresses. */
> 14 │ export type StateSource =
  15 │   /** `.alchemy/` on this machine, ignoring whatever the project configures. */
  16 │   | { readonly backend: "local" }
  17 │   /** A provider's default state store, without loading a project entrypoint. */
  18 │   | ({ readonly backend: "aws" | "cloudflare" } & Pick<
  19 │       Target,
  20 │       "profile" | "envFile"
  21 │     >)
  22 │   /** Whatever the project's entrypoint configures. */
  23 │   | ({ readonly backend: "configured" } & Target);

0.86 packages/alchemy/src/State/ActionState.ts:9:1
>  9 │ export type ActionState = RunningActionState | RanActionState;
  10 │
  11 │ export type ActionStatus = ActionState["status"];

0.86 packages/alchemy/src/State/ResourceState.ts:6:1
   3 │ import type { RemovalPolicy } from "../RemovalPolicy.ts";
   4 │ import type { ResourceBinding } from "../Resource.ts";
   5 │
>  6 │ export type ResourceState =
   7 │   | CreatingResourceState
   8 │   | CreatedResourceState
   9 │   | UpdatingReourceState
  10 │   | UpdatedResourceState
  11 │   | DeletingResourceState
  12 │   | ReplacingResourceState
  13 │   | ReplacedResourceState;

0.85 packages/alchemy/src/AWS/ApiGateway/RestApi.ts:81:7
  72 │ export type RestApiBinding =
  73 │   | {
  74 │       kind: "method";
  75 │       methodId: Input<string>;
  76 │       restApiId: Input<string>;
  77 │       resourceId: Input<string>;
  78 │       httpMethod: Input<string>;
  79 │     }
  80 │   | {
> 81 │       kind: "resource";
  82 │       resourceId: Input<string>;
  83 │       parentId: Input<string>;
  84 │       pathPart: Input<string>;
  85 │     }
  86 │   | {
  87 │       kind: "authorizer";
  88 │       authorizerId: Input<string>;
  89 │     };

0.85 packages/alchemy/src/Git/Protocol/PackWriter.ts:28:1
> 28 │ export type PackEvent =
  29 │   | { readonly _tag: "data"; readonly bytes: Uint8Array }
  30 │   | {
  31 │       readonly _tag: "progress";
  32 │       readonly written: number;
  33 │       readonly total: number;
  34 │     };

0.85 packages/alchemy/test/Cli/PlanTestNodes.ts:66:3
  60 │ export const updateNode = (
  61 │   olds: object,
  62 │   news: object,
  63 │   id = "Worker",
  64 │ ): Update => ({
  65 │   ...baseNode(id, news),
> 66 │   action: "update",
  67 │   props: news,
  68 │   state: state(id, olds),
  69 │ });

0.84 packages/alchemy/src/AWS/Assets.ts:21:1
  18 │ /**
  19 │  * Error type for Assets service operations.
  20 │  */
> 21 │ export type AssetsError =
  22 │   | {
  23 │       readonly _tag: "AssetsUploadError";
  24 │       readonly message: string;
  25 │       readonly cause?: unknown;
  26 │     }
  27 │   | {
  28 │       readonly _tag: "AssetsCheckError";
  29 │       readonly message: string;
  30 │       readonly cause?: unknown;
  31 │     };

0.84 packages/alchemy/src/Axiom/AuthProvider.ts:24:1
> 24 │ export type AxiomResolvedCredentials =
  25 │   | {
  26 │       type: "apiToken";
  27 │       apiToken: Redacted.Redacted<string>;
  28 │       apiBaseUrl: string;
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

0.84 packages/alchemy/src/Axiom/Chart.ts:101:1
> 101 │ export type SmartFilter = SmartFilterSearch | SmartFilterSelect;

0.84 packages/alchemy/src/Bundle/Bundle.ts:141:5
  135 │ export declare namespace BundleWatchEvent {
  136 │   interface Start {
  137 │     readonly _tag: "Start";
  138 │   }
  139 │   interface Success {
  140 │     readonly _tag: "Success";
> 141 │     readonly output: BundleOutput;
  142 │   }
  143 │   interface Error {
  144 │     readonly _tag: "Error";
  145 │     readonly error: BundleError;
  146 │   }
  147 │ }

0.84 packages/alchemy/src/Kubernetes/Connection.ts:83:3
  82 │ export type ConnectionAuth = {
> 83 │   [K in keyof AuthRegistry]: { readonly kind: K } & AuthRegistry[K];
  84 │ }[keyof AuthRegistry];

0.84 packages/alchemy/src/Prisma/PrismaLogs.ts:47:3
  46 │ export type ParsedDeploymentLogRecord =
> 47 │   | { _tag: "log"; line: LogLine; raw: PrismaDeploymentLogLine }
  48 │   | { _tag: "terminal"; raw: PrismaDeploymentTerminalLine };
  49 │
  50 │ const WEBSOCKET_HANDSHAKE_TIMEOUT = "10 seconds" as const;

0.84 packages/cloudflare-runtime/src/core/bindings/r2-bucket/R2BucketOptions.shared.ts:53:1
  50 │ // `test/plugins/r2/validator.spec.ts`.
  51 │ // -----------------------------------------------------------------------------
  52 │
> 53 │ export type R2Etag =
  54 │   | { readonly type: "strong"; readonly value: string }
  55 │   | { readonly type: "weak"; readonly value: string }
  56 │   | { readonly type: "wildcard" };

0.83 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:89:1
> 89 │ export type DashboardWidget =
  90 │   | DashboardMetricWidget
  91 │   | DashboardTextWidget
  92 │   | DashboardAlarmStatusWidget
  93 │   | DashboardLogWidget;

0.83 packages/alchemy/src/Cli/PropertyDiff.ts:16:1
> 16 │ export interface DeclaredPropertyYaml {
  17 │   readonly kind: "create" | "change" | "drift";
  18 │   readonly lines: ReadonlyArray<string>;
  19 │ }

0.83 packages/cloudflare-runtime/src/internal/workflows-shared/lib/delay.ts:22:1
  20 │ type Waiter = (ms: number, opts?: { signal?: AbortSignal }) => Promise<void>;
  21 │
> 22 │ type AbortRaceResult<T> = { aborted: true } | { aborted: false; value: T };

0.82 packages/alchemy/src/Cloudflare/AI/GatewayDynamicRouting.ts:165:3
  159 │ export type RouteElement =
  160 │   | RouteStartElement
  161 │   | RouteConditionalElement
  162 │   | RoutePercentageElement
  163 │   | RouteRateElement
  164 │   | RouteModelElement
> 165 │   | RouteEndElement;

0.82 packages/alchemy/src/Git/Jobs/Fork.ts:81:3
  80 │     }
> 81 │   | {
  82 │       readonly table: "objects";
  83 │       readonly rows: ReadonlyArray<SnapshotObjectRow>;
  84 │     }

0.82 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:156:15
  146 │           case "/restore": {
  147 │             const input =
  148 │               yield* Schema.decodeUnknownEffect(versionRequest)(body);
  149 │             const result = yield* restore({
  150 │               ...input,
  151 │               RestoreRequest: {
  152 │                 Days: 1,
  153 │                 GlacierJobParameters: { Tier: "Standard" },
  154 │               },
  155 │             }).pipe(
> 156 │               Effect.as({ tag: "accepted", versionId: input.VersionId }),
  157 │               Effect.catchTag("InvalidObjectState", () =>
  158 │                 Effect.succeed({ tag: "InvalidObjectState" }),
  159 │               ),
  160 │             );
  161 │             return yield* HttpServerResponse.json(result);
  162 │           }

0.82 packages/cloudflare-runtime/src/core/internal/response.shared.ts:28:3
  26 │ export const decodeResponse = async <T>(response: Response) => {
  27 │   const text = await response.text().catch(() => "");
> 28 │   let json: { ok: true; result: T } | ErrorEnvelope;
  29 │   try {
  30 │     json = JSON.parse(text);
  31 │   } catch {
  32 │     throw new SystemError({
  33 │       subtag: "InvalidResponse",
  34 │       message: `Invalid response from server (${response.status} ${response.statusText})`,
  35 │       detail: { status: response.status, body: text },
  36 │     });
  37 │   }
  38 │   if (json.ok) {
  39 │     return json.result;
  40 │   }
  41 │   const decoded = decodeErrorResponse(json);
  42 │   if (Result.isSuccess(decoded)) {
  43 │     throw decoded.success.error;
  44 │   }
  45 │   throw new SystemError({
  46 │     subtag: "InvalidResponse",
  47 │     message: `Invalid response from server (${response.status} ${response.statusText})`,
  48 │     detail: { status: response.status, body: text },
  49 │   });
  50 │ };

0.81 packages/alchemy/src/AWS/CloudWatch/binding-common.ts:29:3
  28 │ export const getTaggableResourceArn = (resource: TaggableResource) => {
> 29 │   switch (resource.Type) {
  30 │     case "AWS.CloudWatch.Alarm":
  31 │     case "AWS.CloudWatch.CompositeAlarm":
  32 │       return resource.alarmArn;
  33 │     case "AWS.CloudWatch.Dashboard":
  34 │       return resource.dashboardArn;
  35 │     case "AWS.CloudWatch.MetricStream":
  36 │       return resource.metricStreamArn;
  37 │     case "AWS.CloudWatch.InsightRule":
  38 │       return resource.ruleArn;
  39 │     case "AWS.CloudWatch.AlarmMuteRule":
  40 │       return resource.alarmMuteRuleArn;
  41 │   }
  42 │ };

0.81 packages/alchemy/src/Cli/components/view/PlanTree.ts:41:3
  38 │       fromProviderMode?: ProviderMode;
  39 │       propertyYaml?: DeclaredPropertyYaml;
  40 │     }
> 41 │   | {
  42 │       key: string;
  43 │       type: "binding";
  44 │       id: string;

0.81 packages/alchemy/src/Diff.ts:201:1
> 201 │ export type DeepEqualOptions = {
  202 │   /**
  203 │    * When true, treat `null` and `undefined` as equivalent at any depth.
  204 │    * Useful when comparing cloud-API responses (which often return `null`
  205 │    * for unconfigured optional fields) against desired-state shapes built
  206 │    * from `props?.x` (which leave the same fields `undefined`).
  207 │    *
  208 │    * @default false
  209 │    */
  210 │   stripNullish?: boolean;
  211 │ };

0.81 packages/alchemy/src/Git/Http/ReceivePack.ts:20:1
  18 │ export { ReceivePack as endpoint } from "../Api/Protocol.ts";
  19 │
> 20 │ export interface Push {
  21 │   readonly _tag: "Push";
  22 │   readonly input: PushInput;
  23 │   readonly updates: PushInput["updates"];
  24 │   readonly capabilities: ReadonlySet<string>;
  25 │ }

0.81 packages/alchemy/src/Neon/BranchScope.ts:7:1
   4 │ import type { Input } from "../Input.ts";
   5 │
   6 │ /** Select an explicit branch or the project's current default branch, never both. */
>  7 │ export type BranchScope =
   8 │   | {
   9 │       /** Branch resource or explicit branch identity. */
  10 │       branch: { projectId: string; branchId: string };
  11 │       project?: never;
  12 │     }
  13 │   | {
  14 │       /** Project whose default branch is selected at reconciliation time. */
  15 │       project: { projectId: string };
  16 │       branch?: never;
  17 │     };

0.80 packages/alchemy/src/AWS/AMP/PrometheusTypes.ts:48:3
  47 │ export type PrometheusInstantResult =
> 48 │   | { resultType: "vector"; result: PrometheusSample[] }
  49 │   | { resultType: "matrix"; result: PrometheusRangeSample[] }
  50 │   | { resultType: "scalar"; result: [number, string] }
  51 │   | { resultType: "string"; result: [number, string] };

0.80 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:5:1
   2 │ import * as Effect from "effect/Effect";
   3 │ import * as Schema from "effect/Schema";
   4 │
>  5 │ const ScheduleEnvelope = Schema.Struct({
   6 │   version: Schema.Literal(1),
   7 │   invocation_id: Schema.String,
   8 │   trigger: Schema.Struct({
   9 │     type: Schema.Literal("schedule"),
  10 │     id: Schema.String,
  11 │     name: Schema.String,
  12 │   }),
  13 │   data: Schema.Struct({ scheduled_at: Schema.String }),
  14 │ });

0.80 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:721:19
  699 │           const describeOperation = <A, E>(
  700 │             operation: ExplicitRollbackResult["operations"][number]["operation"],
  701 │             exit: Exit.Exit<A, E>,
  702 │           ): ExplicitRollbackResult["operations"][number] => {
  703 │             const error = Exit.isFailure(exit)
  704 │               ? Cause.squash(exit.cause)
  705 │               : undefined;
  706 │             const cause =
  707 │               error instanceof Alchemy.CallbackError ? error.cause : error;
  708 │             return {
  709 │               operation,
  710 │               acknowledged: Exit.isSuccess(exit),
  711 │               failure:
  712 │                 cause instanceof Cloudflare.DurableObjectStorageError
  713 │                   ? {
  714 │                       tag: cause._tag,
  715 │                       wrappedBy:
  716 │                         error instanceof Alchemy.CallbackError
  717 │                           ? error._tag
  718 │                           : null,
  719 │                       message: cause.message,
  720 │                     }
> 721 │                   : null,
  722 │             };
  723 │           };

0.79 packages/alchemy/src/Cloudflare/Workers/Sources/Rolldown.ts:46:3
  39 │ export interface WorkerBundleOptions {
  40 │   id: string;
  41 │   main: string;
  42 │   compatibility: {
  43 │     date: string;
  44 │     flags: string[];
  45 │   };
> 46 │   entry:
  47 │     | {
  48 │         kind: "external";
  49 │       }
  50 │     | {
  51 │         kind: "effect";
  52 │         exports: Record<string, WorkerExport>;
  53 │       };
  54 │   stack: { name: string; stage: string };
  55 │   extraOptions: WorkerBuildOptions | undefined;
  56 │ }

0.79 packages/alchemy/src/Local/RpcServerBun.ts:14:9
  12 │     const server = yield* Effect.sync(() =>
  13 │       Bun.serve<
> 14 │         | { type: "session"; session: ServerRpcSession<any> }
  15 │         | { type: "pending"; sessionEnv: string | undefined }
  16 │         | { type: "parent" }
  17 │       >({

0.79 packages/alchemy/src/Planetscale/AuthProvider.ts:161:3
  160 │ export type PlanetscaleResolvedCredentials =
> 161 │   | {
  162 │       type: "apiToken";
  163 │       tokenId: Redacted.Redacted<string>;
  164 │       token: Redacted.Redacted<string>;
  165 │       organization: string;
  166 │       source: {
  167 │         type: PlanetscaleAuthConfig["method"] | "env";
  168 │         details?: string;
  169 │       };
  170 │     }
  171 │   | {
  172 │       type: "oauth";
  173 │       accessToken: Redacted.Redacted<string>;
  174 │       expires: number;
  175 │       organization: string;
  176 │       source: {
  177 │         type: PlanetscaleAuthConfig["method"] | "env";
  178 │         details?: string;
  179 │       };
  180 │     };

0.78 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:61:3
  59 │ export type FunctionImageSource =
  60 │   | FunctionDockerImageSource
> 61 │   | FunctionEcrImageSource;

0.78 packages/alchemy/src/Cloudflare/Pipelines/LegacyPipeline.ts:23:1
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

0.78 packages/alchemy/src/Git/GitHubCompat.ts:63:1
  60 │ // ─────────────────────────────────────────────────────────────────────────────
  61 │
  62 │ /** Outcome of the Worker's shared owner/repo + credential prelude. */
> 63 │ export type CompatPrelude =
  64 │   | {
  65 │       readonly kind: "halt";
  66 │       readonly response: HttpServerResponse.HttpServerResponse;
  67 │     }
  68 │   | {
  69 │       readonly kind: "ok";
  70 │       readonly entry: RegistryEntry;
  71 │     };

0.77 packages/alchemy/src/Cloudflare/Queues/Subscription.ts:41:1
> 41 │ export type SubscriptionSource =
  42 │   | {
  43 │       /** Cloudflare Images events. */
  44 │       type: "images";

0.77 packages/alchemy/src/Git/Protocol/ReceivePack.ts:175:5
  173 │   for (;;) {
  174 │     const result = readPktLineAt(body, pos);
> 175 │     if (result._tag === "incomplete") {
  176 │       return yield* new PktLineError({
  177 │         reason: `truncated receive-pack request at offset ${pos}`,
  178 │       });
  179 │     }

0.77 packages/alchemy/src/Neon/FunctionTrigger.ts:63:3
  59 │ export interface FunctionTrigger extends Resource<
  60 │   "Neon.FunctionTrigger",
  61 │   FunctionTriggerProps,
  62 │   FunctionTriggerAttributes,
> 63 │   never,
  64 │   Providers
  65 │ > {}

0.77 packages/alchemy/src/Rpc.ts:62:1
> 62 │ export type RpcStreamErrorMarker = {
  63 │   _tag: typeof StreamErrorTag;
  64 │   error: unknown;
  65 │ };

0.76 packages/alchemy/src/Cloudflare/Auth/AuthConfig.ts:39:1
  37 │ export type CloudflareAuthConfig = typeof CloudflareAuthConfigSchema.Type;
  38 │
> 39 │ export type CloudflareResolvedCredentials =
  40 │   | {
  41 │       type: "apiToken";
  42 │       apiToken: Redacted.Redacted<string>;
  43 │       accountId: string;
  44 │       source: {
  45 │         type: CloudflareAuthConfig["method"] | "env";
  46 │         details?: string;
  47 │       };
  48 │     }
  49 │   | {
  50 │       type: "apiKey";
  51 │       apiKey: Redacted.Redacted<string>;
  52 │       email: Redacted.Redacted<string>;
  53 │       accountId: string;
  54 │       source: {
  55 │         type: CloudflareAuthConfig["method"] | "env";
  56 │         details?: string;
  57 │       };
  58 │     }
  59 │   | {
  60 │       type: "oauth";
  61 │       accessToken: Redacted.Redacted<string>;
  62 │       expires: number;
  63 │       accountId: string;
  64 │       source: {
  65 │         type: CloudflareAuthConfig["method"] | "env";
  66 │         details?: string;
  67 │       };
  68 │     };

0.76 packages/alchemy/src/Prisma/Internal/ArchivePlatform.ts:245:3
  241 │ interface TarHeader {
  242 │   readonly name: string;
  243 │   readonly mode: number;
  244 │   readonly size: number;
> 245 │   readonly type: "file" | "symlink" | "pax";
  246 │   readonly linkname?: string;
  247 │ }

0.76 packages/alchemy/src/Prisma/Types.ts:360:1
  359 │ /** One JSON line returned by the build-log NDJSON stream. */
> 360 │ export type BuildLogRecord = BuildLogLine | BuildLogTerminal;

0.75 packages/alchemy/src/Cloudflare/Access/Application.ts:61:1
> 61 │ export type ApplicationDestination =
  62 │   | { type: "public"; uri: string }
  63 │   | {
  64 │       type: "private";
  65 │       hostname?: string;
  66 │       cidr?: string;
  67 │       l4Protocol?: "tcp" | "udp";
  68 │       portRange?: string;
  69 │       vnetId?: string;
  70 │     }
  71 │   | { type: "via_mcp_server_portal"; mcpServerId: string }
  72 │   | { type: "worker"; workerId: string }
  73 │   | { type: "preview_worker"; workerId: string }
  74 │   | { type: "all_workers" }
  75 │   | { type: "all_preview_workers" };

0.74 packages/alchemy/src/Cloudflare/Workers/WorkerBinding.ts:72:1
> 72 │ export interface SelfUrlWorkerBinding {
  73 │   type: "self_url";
  74 │   name: string;
  75 │ }

0.74 packages/alchemy/src/GitHub/AuthProvider.ts:101:11
   86 │ ): Effect.Effect<GitHubResolvedCredentials, AuthError> =>
   87 │   Effect.gen(function* () {
   88 │     const candidates =
   89 │       baseUrl !== undefined
   90 │         ? [
   91 │             "GH_ENTERPRISE_TOKEN",
   92 │             "GITHUB_ENTERPRISE_TOKEN",
   93 │             "GITHUB_ACCESS_TOKEN",
   94 │             "GITHUB_TOKEN",
   95 │           ]
   96 │         : ["GITHUB_ACCESS_TOKEN", "GITHUB_TOKEN"];
   97 │     for (const key of candidates) {
   98 │       const token = yield* getEnvRedacted(key);
   99 │       if (token) {
  100 │         return {
> 101 │           type: "token" as const,
  102 │           token,
  103 │           baseUrl,
  104 │           source: { type: "env" as const, details: key },
  105 │         };
  106 │       }
  107 │     }
  108 │     return yield* new AuthError({
  109 │       message: `GitHub env credentials not found. Set ${candidates.join(", ")}.`,
  110 │     });
  111 │   });

0.74 packages/cloudflare-runtime/src/core/registry/RegistryProxy.ts:44:1
> 44 │ type PublishedService =
  45 │   | Subscriber.DurableObject
  46 │   | (Subscriber.QueueConsumer & { service: string })
  47 │   | (Omit<Subscriber.Workflow, "scriptName"> & { service: string });

0.73 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:48:1
> 48 │ export type MQEvent = ActiveMQEvent | RabbitMQEvent;

0.73 packages/alchemy/src/Neon/AIGateway.ts:8:1
   5 │ import { InvalidBranchScope, resolveBranchScope } from "./BranchScope.ts";
   6 │ import type { Credential } from "./Credential.ts";
   7 │
>  8 │ export type AIGatewayProps = (
   9 │   | {
  10 │       /** Branch resource or explicit identity; output references are accepted. */
  11 │       branch:
  12 │         | import("./Branch.ts").Branch
  13 │         | {
  14 │             projectId: string | Output.Output<string>;
  15 │             branchId: string | Output.Output<string>;
  16 │           };
  17 │       project?: never;
  18 │     }
  19 │   | {
  20 │       /** Project resource or identity whose default branch supplies the gateway. */
  21 │       project:
  22 │         | import("./Project.ts").Project
  23 │         | {
  24 │             projectId: string | Output.Output<string>;
  25 │           };
  26 │       branch?: never;
  27 │     }
  28 │ ) & {
  29 │   /** Optional managed branch credential with ai_gateway:invoke permission. */
  30 │   credential?: Credential;
  31 │ };

0.73 packages/alchemy/src/Nuke.ts:119:1
  115 │ const failure = (
  116 │   provider: string,
  117 │   operation: ProviderFailure["operation"],
  118 │   cause: unknown,
> 119 │ ): ProviderFailure => ({
  120 │   provider,
  121 │   operation,
  122 │   message: typeof cause === "string" ? cause : Formatter.format(cause),
  123 │ });

0.73 packages/alchemy/test/AWS/LakeFormation/handler.ts:121:15
  118 │         if (request.method === "GET" && pathname === "/permissions") {
  119 │           const result = yield* listPermissions().pipe(
  120 │             Effect.map((r) => ({
> 121 │               tag: "Ok",
  122 │               count: (r.PrincipalResourcePermissions ?? []).length,
  123 │             })),
  124 │           );
  125 │           return yield* HttpServerResponse.json(result);
  126 │         }

0.72 packages/alchemy/src/Auth/OidcToken.ts:29:1
> 29 │ export interface OidcToken {
  30 │   readonly platform: OidcPlatform;
  31 │   readonly token: Redacted.Redacted<string>;
  32 │ }

0.72 packages/alchemy/src/Neon/AuthProvider.ts:14:1
  12 │ export type NeonAuthConfig = StoredAuthConfig;
  13 │
> 14 │ export type NeonResolvedCredentials = {
  15 │   type: "apiKey";
  16 │   apiKey: Redacted.Redacted<string>;
  17 │   source: { type: NeonAuthConfig["method"] | "env"; details?: string };
  18 │ };

0.72 packages/alchemy/test/AWS/QApps/bindings-handler.ts:21:1
  19 │ const errorTagged = <A, E extends { _tag: string }, R>(
  20 │   effect: Effect.Effect<A, E, R>,
> 21 │ ): Effect.Effect<A | { errorTag: string }, never, R> =>
  22 │   effect.pipe(
  23 │     Effect.map((a): A | { errorTag: string } => a),
  24 │     Effect.catch((e) => Effect.succeed({ errorTag: e._tag })),
  25 │   );

0.72 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:168:15
  152 │         if (pathname === "/params") {
  153 │           const result = yield* describeProvisioningParameters({
  154 │             ProductId: q("productId"),
  155 │             ProvisioningArtifactId: q("artifactId"),
  156 │             PathId: q("pathId"),
  157 │           }).pipe(
  158 │             Effect.map((r) => ({
  159 │               tag: "Ok" as string,
  160 │               count: (r.ProvisioningArtifactParameters ?? []).length,
  161 │             })),
  162 │             Effect.catchTag(
  163 │               [
  164 │                 "ResourceNotFoundException",
  165 │                 "InvalidParametersException",
  166 │                 "AccessDeniedException",
  167 │               ],
> 168 │               (e) => Effect.succeed({ tag: e._tag as string, count: 0 }),
  169 │             ),
  170 │           );
  171 │           return yield* HttpServerResponse.json(result);
  172 │         }

0.72 packages/cloudflare-runtime/src/core/internal/internal-modules.ts:29:3
  26 │ export const moduleToWorkerd = (
  27 │   module: Module,
  28 │ ): WorkerdConfig.Worker_Module => {
> 29 │   switch (module.type) {
  30 │     case "ESModule":
  31 │       return { name: module.name, esModule: module.content };
  32 │     case "CommonJsModule":
  33 │       return { name: module.name, commonJsModule: module.content };
  34 │     case "Text":
  35 │       return { name: module.name, text: module.content };
  36 │     case "Data":
  37 │       return { name: module.name, data: module.content };
  38 │     case "Wasm":
  39 │       return { name: module.name, wasm: module.content };
  40 │     case "Json":
  41 │       return { name: module.name, json: module.content };
  42 │     case "PythonModule":
  43 │       return { name: module.name, pythonModule: module.content };
  44 │   }
  45 │ };

0.71 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:85:3
  83 │ export interface SuperSlurperJobProps {
  84 │   /** Source bucket and credentials. Any change replaces the job. */
> 85 │   source: SuperSlurperSource;
  86 │   /** Destination R2 bucket and credentials. Any change replaces the job. */
  87 │   target: SuperSlurperTarget;
  88 │   /** Overwrite existing destination objects. Immutable. @default false */
  89 │   overwrite?: boolean;
  90 │   /**
  91 │    * Pause an active job, or resume it when false. Terminal jobs are never
  92 │    * restarted. A new job starts running before the pause request is applied,
  93 │    * so this is not a guarantee that no objects are transferred.
  94 │    * @default false
  95 │    */
  96 │   paused?: boolean;
  97 │ }

0.71 packages/alchemy/src/Cloudflare/Workers/Sources/shared.ts:88:11
  72 │   ownsAssets: false,
  73 │   build: (ctx) =>
  74 │     spec.build(ctx).pipe(
  75 │       Effect.map((bundle) => ({
  76 │         bundle,
  77 │         assets: undefined,
  78 │         hash: { bundle: bundle.hash },
  79 │       })),
  80 │     ),
  81 │   hash: (ctx) =>
  82 │     spec.build(ctx).pipe(Effect.map((bundle) => ({ bundle: bundle.hash }))),
  83 │   dev: (ctx) =>
  84 │     spec
  85 │       .watch(ctx)
  86 │       .pipe(
  87 │         Effect.map(
> 88 │           (bundles) => ({ mode: "bundle", bundles }) as SourceDevHandle,
  89 │         ),
  90 │       ),
  91 │ });

0.71 packages/alchemy/src/Infisical/AuthProvider.ts:201:9
  193 │ const toConfig = (
  194 │   method: InfisicalAuthConfig["method"],
  195 │   values: StoredValues,
  196 │ ): InfisicalAuthConfig => {
  197 │   const apiBaseUrl = storedValueText(values.apiBaseUrl);
  198 │   return method === "access-token"
  199 │     ? { method, token: storedValueText(values.token)!, apiBaseUrl }
  200 │     : {
> 201 │         method,
  202 │         clientId: storedValueText(values.clientId)!,
  203 │         clientSecret: storedValueText(values.clientSecret)!,
  204 │         apiBaseUrl,
  205 │       };
  206 │ };

0.71 packages/alchemy/src/Neon/BackendConnection.ts:19:1
> 19 │ type TextBinding = {
  20 │   type: "plain_text" | "secret_text";
  21 │   name: string;
  22 │   text: string;
  23 │ };

0.71 packages/alchemy/src/Redis/Protocol.ts:242:3
> 242 │   if (frame._tag === "Protocol") {
  243 │     return Effect.fail(commandError(command, frame.error));
  244 │   }
  245 │   if (frame._tag === "Error") {
  246 │     return Effect.fail(commandError(command, frame.error));
  247 │   }
  248 │   if (frame._tag === "Push") {
  249 │     return Effect.succeed(frame.value);
  250 │   }
  251 │   return Effect.succeed(frame.value);
  252 │ };

0.71 packages/alchemy/test/AWS/CodePipeline/handler.ts:42:1
  40 │ const errorTagged = <A, E extends { _tag: string; message?: string }, R>(
  41 │   effect: Effect.Effect<A, E, R>,
> 42 │ ): Effect.Effect<A | { errorTag: string; errorMessage?: string }, never, R> =>
  43 │   effect.pipe(
  44 │     Effect.map((a): A | { errorTag: string; errorMessage?: string } => a),
  45 │     Effect.catch((e) =>
  46 │       Effect.succeed({ errorTag: e._tag, errorMessage: e.message }),
  47 │     ),
  48 │   );
```
