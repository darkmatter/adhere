# alchemy/resources/stage-unique-physical-names

In a stack deployed to several stages, a resource whose physical name is global to an account or org should omit name, so alchemy derives one per stage, or derive it from the stage, and should not hardcode a single name every stage shares.

170 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
const traces = yield* Axiom.Dataset("Traces", Stack.useSync(({ stage }) => ({
  name: `${stage}-traces`,
  kind: "otel:traces:v1" as const,
})));
const branch = yield* Neon.Branch("Preview", { project });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.91 packages/alchemy/test/AWS/MediaPackageV2/fixtures/handler.ts:20:1
> 20 │ const HARVEST_BUCKET = "alchemy-test-mediapackagev2-harvest";

0.91 packages/alchemy/test/AWS/QuickSight/bindings-handler.ts:25:7
  23 │   Effect.gen(function* () {
  24 │     const source = yield* QuickSight.DataSource("BindingsSource", {
> 25 │       name: "Alchemy QuickSight Bindings Source",
  26 │       type: "ATHENA",
  27 │       dataSourceParameters: { AthenaParameters: { WorkGroup: "primary" } },
  28 │     });

0.90 packages/alchemy/test/AWS/RedshiftServerless/fixtures/connect-handler.ts:24:7
  22 │   Effect.gen(function* () {
  23 │     const namespace = yield* RedshiftServerless.Namespace("ConnectNamespace", {
> 24 │       namespaceName: "alchemy-test-rsconn-ns",
  25 │       dbName: "dev",
  26 │       adminUsername: "alchemyadmin",
  27 │       manageAdminPassword: true,
  28 │     });

0.90 packages/alchemy/test/AWS/RedshiftServerless/fixtures/query-handler.ts:26:7
  24 │   Effect.gen(function* () {
  25 │     const namespace = yield* RedshiftServerless.Namespace("QueryNamespace", {
> 26 │       namespaceName: "alchemy-test-rs-ns",
  27 │       dbName: "dev",
  28 │       adminUsername: "alchemyadmin",
  29 │       manageAdminPassword: true,
  30 │     });

0.89 packages/alchemy/test/AWS/CodeBuild/handler.ts:107:7
  106 │     const reportGroup = yield* CodeBuild.ReportGroup("BindingsReports", {
> 107 │       reportGroupName: FIXTURE_REPORT_GROUP_NAME,
  108 │       type: "TEST",
  109 │     });

0.89 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:14:1
  12 │ // Deterministic names, distinct from Collection.test.ts so the suites never
  13 │ // collide. ≤32 chars, lowercase.
> 14 │ export const COLLECTION_NAME = "alchemy-aossb";
  15 │ export const ENC_POLICY = "alchemy-aossb-enc";
  16 │ export const NET_POLICY = "alchemy-aossb-net";

0.89 packages/alchemy/test/AWS/RedshiftData/fixtures/data-api-handler.ts:37:7
  35 │   Effect.gen(function* () {
  36 │     const namespace = yield* RedshiftServerless.Namespace("DataApiNamespace", {
> 37 │       namespaceName: "alchemy-test-rsd-ns",
  38 │       dbName: "dev",
  39 │       adminUsername: "alchemyadmin",
  40 │       manageAdminPassword: true,
  41 │     });

0.89 packages/alchemy/test/AWS/S3Tables/bindings-handler.ts:24:7
  21 │     // Deterministic names so a crashed previous run is reconciled (observed
  22 │     // and reused) instead of orphaned by a fresh random instance suffix.
  23 │     const bucket = yield* S3Tables.TableBucket("BindingsTableBucket", {
> 24 │       name: "alchemy-s3tables-bindings",
  25 │     });

0.88 packages/alchemy/test/AWS/AppRunner/fixtures/handler.ts:33:7
  31 │   Effect.gen(function* () {
  32 │     const service = yield* AppRunner.Service("BindingsService", {
> 33 │       serviceName: "alchemy-test-apprunner-bind",
  34 │       imageRepository: {
  35 │         imageIdentifier:
  36 │           "public.ecr.aws/aws-containers/hello-app-runner:latest",
  37 │         imageRepositoryType: "ECR_PUBLIC",
  38 │         port: "8000",
  39 │       },
  40 │       instanceConfiguration: { cpu: "256", memory: "512" },
  41 │     });

0.88 packages/alchemy/test/AWS/Firehose/handler.ts:30:7
  22 │ export const BucketAndDeliveryStreamLive = Layer.effect(
  23 │   BucketAndDeliveryStream,
  24 │   Effect.gen(function* () {
  25 │     const bucket = yield* AWS.S3.Bucket("FirehoseFixtureBucket", {
  26 │       forceDestroy: true,
  27 │     });
  28 │
  29 │     const deliveryStream = yield* AWS.Firehose.DeliveryStream(
> 30 │       "FixtureDeliveryStream",
  31 │       {
  32 │         destination: {
  33 │           bucketArn: bucket.bucketArn,
  34 │           prefix: "records/",
  35 │           // Direct S3 supports zero buffering. Keep the binding fixture at
  36 │           // zero so end-to-end delivery can be proven inside the normal test
  37 │           // budget instead of imposing Firehose's one-minute flush delay.
  38 │           bufferingInterval: "0 seconds",
  39 │           bufferingSizeInMBs: 1,
  40 │         },
  41 │         tags: { fixture: "firehose-bindings" },
  42 │       },
  43 │     );
  44 │
  45 │     return { bucket, deliveryStream };
  46 │   }),
  47 │ );

0.88 packages/alchemy/test/AWS/Kinesis/handler.ts:59:5
  58 │   Effect.gen(function* () {
> 59 │     const { stream, consumer } = yield* StreamAndConsumer;
  60 │
  61 │     const describeAccountSettings =
  62 │       yield* AWS.Kinesis.DescribeAccountSettings();

0.88 packages/alchemy/test/AWS/WAFv2/handler.ts:262:13
  255 │         if (request.method === "GET" && pathname === "/managed") {
  256 │           const groups = yield* bound.listAvailableManagedRuleGroups({
  257 │             Scope: "REGIONAL",
  258 │             Limit: 20,
  259 │           });
  260 │           const described = yield* bound.describeManagedRuleGroup({
  261 │             VendorName: "AWS",
> 262 │             Name: "AWSManagedRulesCommonRuleSet",
  263 │             Scope: "REGIONAL",
  264 │           });
  265 │           const versions = yield* bound.listAvailableManagedRuleGroupVersions({
  266 │             VendorName: "AWS",
  267 │             Name: "AWSManagedRulesCommonRuleSet",
  268 │             Scope: "REGIONAL",
  269 │             Limit: 5,
  270 │           });
  271 │           return yield* HttpServerResponse.json({
  272 │             groups: (groups.ManagedRuleGroups ?? []).length,
  273 │             capacity: described.Capacity ?? 0,
  274 │             currentDefaultVersion: versions.CurrentDefaultVersion ?? null,
  275 │           });
  276 │         }

0.88 packages/alchemy/test/Cloudflare/AnalyticsEngine/fixtures/dataset.ts:4:3
  1 │ import * as Cloudflare from "@/Cloudflare/index.ts";
  2 │
  3 │ export const Dataset = Cloudflare.AnalyticsEngine.Dataset("Events", {
> 4 │   dataset: "alchemy_test_analytics_events",
  5 │ });

0.87 packages/alchemy/test/AWS/AppFlow/handler.ts:13:1
  11 │ // Deterministic names shared by the fixture and the test (the test seeds the
  12 │ // source prefix out-of-band and filters flow events by name).
> 13 │ export const FLOW_BUCKET = "alchemy-test-appflow-bindings";
  14 │ export const FLOW_NAME = "alchemy-test-appflow-bindings-flow";
  15 │ const BUCKET_ARN = `arn:aws:s3:::${FLOW_BUCKET}`;

0.87 packages/alchemy/test/AWS/Backup/handler.ts:308:13
  300 │         if (
  301 │           request.method === "POST" &&
  302 │           pathname === "/start-restore-not-found"
  303 │         ) {
  304 │           // A real restore needs a live recovery point; drive the binding
  305 │           // (role injection + IAM grant) through its typed error path — an
  306 │           // IAM gap would surface AccessDeniedException (500) instead.
  307 │           const tag = yield* startRestoreJob({
> 308 │             RecoveryPointArn: BOGUS_RECOVERY_POINT_ARN,
  309 │             Metadata: {},
  310 │           }).pipe(
  311 │             Effect.map(() => "Started"),
  312 │             Effect.catchTag(
  313 │               [
  314 │                 "ResourceNotFoundException",
  315 │                 "InvalidParameterValueException",
  316 │                 "MissingParameterValueException",
  317 │                 "InvalidRequestException",
  318 │               ],
  319 │               (e) => Effect.succeed(e._tag),
  320 │             ),
  321 │           );
  322 │           return yield* HttpServerResponse.json({ tag });
  323 │         }

0.87 packages/alchemy/test/AWS/Batch/fixtures/nightly-job.ts:21:5
  17 │ export default class NightlyJob extends AWS.Batch.JobDefinition<NightlyJob>()(
  18 │   "BatchE2ENightlyJob",
  19 │   {
  20 │     main: import.meta.filename,
> 21 │     jobDefinitionName: "alchemy-test-batch-platform-e2e",
  22 │     vcpus: 0.25,
  23 │     memory: 512,
  24 │     timeout: "10 minutes",
  25 │     // Docker Hub's `oven/bun` image; the public.ecr.aws default mirror
  26 │     // aggressively rate-limits anonymous pulls (429) during local builds.
  27 │     docker: { base: "oven/bun:1" },
  28 │   },
  29 │   Effect.gen(function* () {
  30 │     return {
  31 │       run: Effect.gen(function* () {
  32 │         // The awslogs driver captures stdout — print the marker for the
  33 │         // out-of-band log assertion.
  34 │         yield* Effect.sync(() => console.log(MARKER));
  35 │         yield* Effect.log("nightly job body complete");
  36 │       }),
  37 │     };
  38 │   }),
  39 │ ) {}

0.87 packages/alchemy/test/AWS/Comprehend/handler.ts:360:13
  357 │             topics: (
  358 │               (yield* listTopicsDetectionJobs({ MaxResults: 5 }))
  359 │                 .TopicsDetectionJobPropertiesList ?? []
> 360 │             ).length,
  361 │           };
  362 │           return yield* HttpServerResponse.json(counts);
  363 │         }

0.87 packages/alchemy/test/AWS/EntityResolution/handler.ts:360:9
> 360 │         // Deletes unknown unique ids from the match store — per-id errors

0.87 packages/alchemy/test/AWS/KinesisVideo/handler.ts:34:5
  33 │   Effect.gen(function* () {
> 34 │     const stream = yield* AWS.KinesisVideo.Stream("FixtureStream", {
  35 │       mediaType: "video/h264",
  36 │       dataRetention: "24 hours",
  37 │     });

0.87 packages/alchemy/test/AWS/MQ/bindings-handler.ts:25:5
  22 │     // A single-instance mq.t3.micro ActiveMQ broker is the cheapest topology
  23 │     // and the only engine whose user APIs (CreateUser/UpdateUser/...) are
  24 │     // supported. Omitting engineVersion lets AWS pick the current default.
> 25 │     const broker = yield* MQ.Broker("BindingsBroker", {
  26 │       engineType: "ACTIVEMQ",
  27 │       hostInstanceType: "mq.t3.micro",
  28 │       deploymentMode: "SINGLE_INSTANCE",
  29 │       publiclyAccessible: true,
  30 │       users: [
  31 │         {
  32 │           username: "alchemyadmin",
  33 │           password: Redacted.make("SuperSecretPassw0rd!"),
  34 │         },
  35 │       ],
  36 │     });

0.87 packages/alchemy/test/AWS/RedshiftServerless/fixtures/snapshot-handler.ts:28:7
  26 │   Effect.gen(function* () {
  27 │     const namespace = yield* RedshiftServerless.Namespace("SnapshotNamespace", {
> 28 │       namespaceName: "alchemy-test-rssnap-ns",
  29 │       dbName: "dev",
  30 │       adminUsername: "alchemyadmin",
  31 │       manageAdminPassword: true,
  32 │     });

0.87 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:34:9
  32 │     const buckets = {
  33 │       GetObjectRetention: yield* S3.Bucket(
> 34 │         "VersionedObjectLockGetRetentionBucket",
  35 │         props,
  36 │       ),
  37 │       PutObjectRetention: yield* S3.Bucket(
  38 │         "VersionedObjectLockPutRetentionBucket",
  39 │         props,
  40 │       ),
  41 │       GetObjectLegalHold: yield* S3.Bucket(
  42 │         "VersionedObjectLockGetHoldBucket",
  43 │         props,
  44 │       ),
  45 │       PutObjectLegalHold: yield* S3.Bucket(
  46 │         "VersionedObjectLockPutHoldBucket",
  47 │         props,
  48 │       ),
  49 │       RestoreObject: yield* S3.Bucket("VersionedObjectLockRestoreBucket", {
  50 │         versioning: "Enabled",
  51 │         forceDestroy: true,
  52 │       }),
  53 │     };

0.86 packages/alchemy/test/AWS/AutoScaling/fixtures/lifecycle-handler.ts:20:1
  17 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  18 │ import { getAutoScalingTestSubnetId } from "../TestNetwork.ts";
  19 │
> 20 │ export const lifecycleFleetAsgName = "alchemy-test-lifecycle-e2e-asg";
  21 │ export const lifecycleHookName = "alchemy-test-lifecycle-e2e-hook";

0.86 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:50:5
> 50 │     const cluster = yield* DocDBElastic.Cluster("SlowDocuments", {
  51 │       adminUserName: "alchemyadmin",
  52 │       adminUserPassword: Redacted.make("AlchemyTestPassw0rd"),
  53 │       shardCapacity: 2,
  54 │       shardCount: 1,
  55 │       subnetIds: network.subnetIds,
  56 │       vpcSecurityGroupIds: network.securityGroupIds,
  57 │       tags: { fixture: "docdb-elastic-bindings" },
  58 │     });

0.86 packages/alchemy/test/AWS/EventBridge/handler.ts:46:7
  33 │ export const BusAndQueuesLive = Layer.effect(
  34 │   BusAndQueues,
  35 │   Effect.gen(function* () {
  36 │     const bus = yield* AWS.EventBridge.EventBus("TestBus", {
  37 │       name: "alchemy-test-eb-bindings",
  38 │       // A crashed run can leak event-source rules whose state rows are
  39 │       // gone; without forceDestroy those orphans block deleteEventBus
  40 │       // with EventBusHasRules forever.
  41 │       forceDestroy: true,
  42 │     });
  43 │     const customQueue = yield* AWS.SQS.Queue("CustomBusSink");
  44 │     const defaultQueue = yield* AWS.SQS.Queue("DefaultBusSink");
  45 │     const toggleRule = yield* AWS.EventBridge.Rule("ToggleRule", {
> 46 │       name: "alchemy-test-eb-toggle",
  47 │       eventBusName: bus.eventBusName,
  48 │       eventPattern: { source: ["alchemy.test.toggle"] },
  49 │     });
  50 │     const archive = yield* AWS.EventBridge.Archive("TestArchive", {
  51 │       name: "alchemy-test-eb-archive",
  52 │       eventSourceArn: bus.eventBusArn,
  53 │       retention: "1 day",
  54 │     });
  55 │     return { bus, customQueue, defaultQueue, toggleRule, archive };
  56 │   }),
  57 │ );

0.86 packages/alchemy/test/AWS/EventBridge/sink-handler.ts:28:7
  25 │   BusSinkInfra,
  26 │   Effect.gen(function* () {
  27 │     const bus = yield* AWS.EventBridge.EventBus("BusSinkBus", {
> 28 │       name: "alchemy-test-eb-bus-sink",
  29 │     });

0.86 packages/alchemy/test/AWS/MWAAServerless/handler.ts:24:1
  21 │ export const BINDINGS_WORKFLOW_NAME = "alchemy-test-mwaas-bind";
  22 │ export const BINDINGS_ROLE_NAME = "alchemy-test-mwaas-bind-role";
  23 │ // S3 bucket names are globally unique — keep a stable random-ish suffix.
> 24 │ export const BINDINGS_BUCKET_NAME = "alchemy-test-mwaas-bind-defs-8k2f";
  25 │ export const DEFINITION_KEY = "workflows/bindings.yaml";

0.86 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/remote-worker.ts:17:3
  16 │ export const RemoteHyperdrive = Effect.gen(function* () {
> 17 │   const project = yield* Neon.Project("HyperdriveRemoteProject");
  18 │   return yield* Cloudflare.Hyperdrive.Connection("HyperdriveRemoteConnection", {
  19 │     origin: project.origin,
  20 │     caching: { disabled: true },
  21 │   }).pipe(Alchemy.remote());
  22 │ });

0.86 packages/alchemy/test/Cloudflare/Vectorize/fixtures/index-resource.ts:15:1
> 15 │ export const TestIndex = Cloudflare.Vectorize.Index("VectorizeWorkerIndex", {
  16 │   dimensions: DIMENSIONS,
  17 │   metric: "cosine",
  18 │ });

0.86 packages/alchemy/test/Planetscale/MySQL/fixtures/Stack.ts:24:5
  22 │ export const PlanetscaleDb = Effect.gen(function* () {
  23 │   const database = yield* Planetscale.MySQLDatabase("MySQLHyperdriveTestDb", {
> 24 │     name: "alchemy-mysql-hyperdrive",
  25 │     region: { slug: "us-east" },
  26 │     clusterSize: "PS_10",
  27 │   });
  28 │
  29 │   const branch = yield* Planetscale.MySQLBranch("MySQLHyperdriveTestBranch", {
  30 │     database,
  31 │     parentBranch: "main",
  32 │     isProduction: false,
  33 │     migrations: migrationsDir,
  34 │   });
  35 │
  36 │   const password = yield* Planetscale.MySQLPassword(
  37 │     "MySQLHyperdriveTestPassword",
  38 │     {
  39 │       database,
  40 │       branch,
  41 │       role: "admin",
  42 │     },
  43 │   );
  44 │
  45 │   return { database, branch, password };
  46 │ });

0.85 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:23:1
> 23 │ export const AUDIT_BUCKET_NAME = "alchemy-test-acmpca-audit-reports";

0.85 packages/alchemy/test/AWS/AutoScaling/fixtures/bindings-handler.ts:1:1
> 1 │ import * as AWS from "@/AWS";

0.85 packages/alchemy/test/AWS/CloudMap/handler.ts:46:9
  43 │     const namespace = yield* AWS.CloudMap.PrivateDnsNamespace(
  44 │       "FixtureNamespace",
  45 │       {
> 46 │         name: "alchemy-cloudmap-fixture.local",
  47 │         vpc,
  48 │       },
  49 │     );

0.85 packages/alchemy/test/AWS/CostAndUsageReport/handler.ts:15:1
  13 │ // Deterministic names — distinct from ReportDefinition.test.ts's fixtures so
  14 │ // the two suites never collide.
> 15 │ export const REPORT_NAME = "alchemy-test-cur-bindings-report";
  16 │ export const BUCKET_NAME = "alchemy-test-cur-bindings";

0.85 packages/alchemy/test/AWS/DataZone/handler.ts:18:1
> 18 │ export const BINDINGS_DOMAIN_NAME = "alchemy-datazone-bindings-test";

0.85 packages/alchemy/test/AWS/IoTFleetWise/bindings-handler.ts:285:11
  284 │         return yield* HttpServerResponse.json(
> 285 │           { error: "Not found", method: request.method, pathname },
  286 │           { status: 404 },
  287 │         );
  288 │       }).pipe(Effect.orDie),

0.85 packages/alchemy/test/AWS/Redshift/fixtures/connect-handler.ts:36:7
  34 │   Effect.gen(function* () {
  35 │     const cluster = yield* Redshift.Cluster("ConnectCluster", {
> 36 │       clusterIdentifier: "alchemy-test-redshift-connect",
  37 │       manageMasterPassword: true,
  38 │       publiclyAccessible: false,
  39 │     });

0.85 packages/alchemy/test/AWS/Route53Resolver/handler.ts:72:7
  69 │   Effect.gen(function* () {
  70 │     const net = yield* resolveNetwork;
  71 │     const endpoint = yield* Route53Resolver.ResolverEndpoint(
> 72 │       "BindingsEndpoint",
  73 │       {
  74 │         direction: "OUTBOUND",
  75 │         securityGroupIds: net.securityGroupIds,
  76 │         ipAddresses: net.subnetIds.map((subnetId) => ({ subnetId })),
  77 │       },
  78 │     );

0.85 packages/alchemy/test/AWS/SNS/platform-handler.ts:31:5
  28 │ export const PlatformFixtureLive = Layer.effect(
  29 │   PlatformFixture,
  30 │   Effect.gen(function* () {
> 31 │     const application = yield* AWS.SNS.PlatformApplication("TestPushApp", {
  32 │       platform: process.env.AWS_TEST_SNS_PLATFORM_NAME ?? "GCM",
  33 │       platformCredential: Redacted.make(
  34 │         process.env.AWS_TEST_SNS_PLATFORM_CREDENTIAL ?? "",
  35 │       ),
  36 │     });
  37 │     return { application };
  38 │   }),
  39 │ );

0.85 packages/alchemy/test/Axiom/fixtures/axiom-traced-worker.ts:13:1
> 13 │ export const TRACES_DATASET = "alchemy-test-otel-traces";
  14 │ export const LOGS_DATASET = "alchemy-test-otel-logs";

0.85 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/db.ts:16:5
  14 │ export const PlanetscaleHostRole = Effect.gen(function* () {
  15 │   const database = yield* PostgresDatabase("PlanetscaleHostDb", {
> 16 │     name: "alchemy-container-pg-host",
  17 │     region: { slug: "us-east" },
  18 │     clusterSize: "PS_10",
  19 │   });
  20 │   return yield* PostgresRole("PlanetscaleHostRole", {
  21 │     database,
  22 │     inheritedRoles: ["postgres"],
  23 │   });
  24 │ });

0.84 packages/alchemy/test/AWS/Budgets/handler.ts:12:1
  10 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  11 │
> 12 │ export const fixtureBudgetName = "alchemy-test-budgets-bindings";

0.84 packages/alchemy/test/AWS/DynamoDB/stream-handler.ts:22:5
  19 │ export const TableAndQueueLive = Layer.effect(
  20 │   TableAndQueue,
  21 │   Effect.gen(function* () {
> 22 │     const table = yield* AWS.DynamoDB.Table("StreamSourceTable", {
  23 │       partitionKey: "pk",
  24 │       sortKey: "sk",
  25 │       attributes: {
  26 │         pk: "S",
  27 │         sk: "S",
  28 │       },
  29 │     });
  30 │     const queue = yield* AWS.SQS.Queue("StreamSinkQueue");
  31 │     return {
  32 │       table,
  33 │       queue,
  34 │     };
  35 │   }),
  36 │ );

0.84 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:28:7
  26 │   Effect.gen(function* () {
  27 │     const room = yield* IVSChat.Room("BindingsRoom", {
> 28 │       roomName: "alchemy-test-ivschat-bindings",
  29 │       tags: { fixture: "ivschat-bindings" },
  30 │     });

0.84 packages/alchemy/test/AWS/Kinesis/stream-handler.ts:23:5
  20 │ export const StreamAndQueueLive = Layer.effect(
  21 │   StreamAndQueue,
  22 │   Effect.gen(function* () {
> 23 │     const stream = yield* AWS.Kinesis.Stream("EventSourceStream", {
  24 │       streamMode: "PROVISIONED",
  25 │       shardCount: 1,
  26 │     });
  27 │     const queue = yield* AWS.SQS.Queue("KinesisEventSinkQueue");
  28 │
  29 │     return {
  30 │       stream,
  31 │       queue,
  32 │     };
  33 │   }),
  34 │ );

0.84 packages/alchemy/test/AWS/NetworkFirewall/handler.ts:25:5
  22 │   Effect.gen(function* () {
  23 │     // A policy and a stateful rule group are cheap (seconds to provision)
  24 │     // and exercise the policy- and rule-group-scoped grants + ARN injection.
> 25 │     const ruleGroup = yield* NetworkFirewall.RuleGroup("BindingsRuleGroup", {
  26 │       type: "STATEFUL",
  27 │       capacity: 10,
  28 │       rules:
  29 │         'pass tcp any any -> any 443 (msg:"allow https"; sid:100001; rev:1;)',
  30 │       summaryConfiguration: { RuleOptions: ["SID", "MSG"] },
  31 │     });

0.84 packages/alchemy/test/AWS/SNS/handler.ts:42:7
  31 │   Effect.gen(function* () {
  32 │     const topic = yield* AWS.SNS.Topic("TestTopic", {
  33 │       attributes: {
  34 │         DisplayName: "sns-test-topic",
  35 │       },
  36 │     });
  37 │     const queue = yield* AWS.SQS.Queue("NotificationsQueue");
  38 │     const subscriptionAttrsQueue = yield* AWS.SQS.Queue(
  39 │       "SubscriptionAttrsQueue",
  40 │     );
  41 │     const queueSubscription = yield* AWS.SNS.Subscription(
> 42 │       "QueueFixtureSubscription",
  43 │       {
  44 │         topicArn: topic.topicArn,
  45 │         protocol: "sqs",
  46 │         endpoint: subscriptionAttrsQueue.queueArn,
  47 │         returnSubscriptionArn: true,
  48 │       },
  49 │     );
  50 │     return {
  51 │       topic,
  52 │       queue,
  53 │       // ConfirmSubscription only injects the parent TopicArn, so the existing
  54 │       // queue subscription exercises that binding without a second Lambda.
  55 │       subscription: queueSubscription,
  56 │       subscriptionAttrsQueue,
  57 │       queueSubscription,
  58 │     };
  59 │   }),

0.84 packages/better-auth/test/AWS/fixtures/aurora-handler.ts:19:3
  18 │ export const Db = Effect.gen(function* () {
> 19 │   const network = yield* AWS.EC2.Network("AuroraAuthNetwork", {
  20 │     cidrBlock: "10.42.0.0/16",
  21 │     availabilityZones: 2,
  22 │   });
  23 │   const securityGroup = yield* AWS.EC2.SecurityGroup(
  24 │     "AuroraAuthDbSecurityGroup",
  25 │     {
  26 │       vpcId: network.vpcId,
  27 │       description: "Better Auth Aurora Data API test cluster",
  28 │     },
  29 │   );
  30 │   return yield* AWS.RDS.Aurora("AuroraAuthDb", {
  31 │     subnetIds: network.privateSubnetIds,
  32 │     securityGroupIds: [securityGroup.groupId],
  33 │   });
  34 │ });

0.83 packages/alchemy/test/AWS/BCMDataExports/handler.ts:12:1
  10 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  11 │
> 12 │ const bucketName = "alchemy-test-bcm-bindings-dest";
  13 │ export const fixtureExportName = "alchemy-test-bcm-bindings-export";

0.83 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:151:5
  148 │   Effect.gen(function* () {
  149 │     const { targetGroup, loadBalancer, trustStore } = yield* BindingsFleet;
  150 │
> 151 │     const registerTargets = yield* RegisterTargets(targetGroup);
  152 │     const deregisterTargets = yield* DeregisterTargets(targetGroup);
  153 │     const describeTargetHealth = yield* DescribeTargetHealth(targetGroup);

0.83 packages/alchemy/test/AWS/Keyspaces/streams-handler.ts:23:7
  21 │   Effect.gen(function* () {
  22 │     const keyspace = yield* Keyspaces.Keyspace("StreamsKs", {
> 23 │       keyspaceName: "alchemy_streams_test_ks",
  24 │     });

0.83 packages/alchemy/test/AWS/Logs/handler.ts:35:7
  33 │     const logStream = yield* Logs.LogStream("BindingsLogStream", {
  34 │       logGroupName: logGroup.logGroupName,
> 35 │       logStreamName: "alchemy-test-bindings-stream",
  36 │     });
  37 │
  38 │     const putLogEvents = yield* Logs.PutLogEvents(logGroup);

0.83 packages/alchemy/test/AWS/MWAA/bindings-handler.ts:84:5
  81 │   Effect.gen(function* () {
  82 │     const { subnetIds, securityGroupIds } = yield* resolveNetwork;
  83 │
> 84 │     const bucket = yield* AWS.S3.Bucket("MWAABindingsDags", {
  85 │       versioning: "Enabled",
  86 │       forceDestroy: true,
  87 │     });

0.83 packages/alchemy/test/AWS/Pipes/bindings-handler.ts:59:5
> 59 │     const pipe = yield* AWS.Pipes.Pipe("BindingsPipe", {
  60 │       source: source.queueArn,
  61 │       target: target.queueArn,
  62 │       roleArn: role.roleArn,
  63 │       sourceParameters: {
  64 │         SqsQueueParameters: { BatchSize: 1 },
  65 │       },
  66 │     });

0.83 packages/alchemy/test/AWS/Polly/handler.ts:16:1
  13 │ // Deterministic bucket for async synthesis output. Polly writes the audio
  14 │ // with the CALLER's credentials, so the Lambda role is granted s3:PutObject
  15 │ // on it via the AWS.S3.PutObject binding below.
> 16 │ export const BUCKET = "alchemy-test-polly-bindings";
  17 │
  18 │ // Lexicon names must match [0-9A-Za-z]{1,20} — exactly 20 characters.
  19 │ export const LEXICON_NAME = "alchemyPollyBindings";

0.83 packages/alchemy/test/AWS/S3/fixtures/server-event-source-task.ts:13:1
  10 │ export const RECEIVED_PREFIX = "deliveries/received/";
  11 │ export const ACKNOWLEDGED_PREFIX = "deliveries/acknowledged/";
  12 │
> 13 │ export const ServerEventBucket = AWS.S3.Bucket("ServerEventBucket", {
  14 │   versioning: "Enabled",
  15 │   forceDestroy: true,
  16 │ });

0.83 packages/alchemy/test/AWS/S3Control/fixtures/mrap-bindings-handler.ts:27:7
  22 │ export const BoundMrapLive = Layer.effect(
  23 │   BoundMrap,
  24 │   Effect.gen(function* () {
  25 │     const bucket = yield* AWS.S3.Bucket("S3ControlMrapBucket", {});
  26 │     const mrap = yield* AWS.S3Control.MultiRegionAccessPoint(
> 27 │       "S3ControlMrapBindingsMrap",
  28 │       { regions: [{ bucket: bucket.bucketName }] },
  29 │     );
  30 │     return { mrap };
  31 │   }),
  32 │ );

0.83 packages/alchemy/test/AWS/Translate/handler.ts:113:7
  110 │     const getParallelData = yield* Translate.GetParallelData();
  111 │     const listParallelData = yield* Translate.ListParallelData();
  112 │     const startTextTranslationJob =
> 113 │       yield* Translate.StartTextTranslationJob(dataAccessRole);
  114 │     const describeTextTranslationJob =
  115 │       yield* Translate.DescribeTextTranslationJob();
  116 │     const stopTextTranslationJob = yield* Translate.StopTextTranslationJob();

0.83 packages/better-auth/test/AWS/fixtures/auth-handler.ts:14:1
  12 │ const main = path.resolve(import.meta.dirname, "auth-handler.ts");
  13 │
> 14 │ export const AuthDb = Neon.Project("BetterAuthLambdaPg");

0.83 packages/better-auth/test/Postgres/fixtures/neon-worker.ts:10:1
   7 │ import { BetterAuth } from "../../../src/index.ts";
   8 │ import { Neon as NeonDatabase } from "../../../src/Neon.ts";
   9 │
> 10 │ export const PgProject = Neon.Project("BetterAuthNeonWorkerPg");

0.82 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:325:9
  316 │     Effect.provide(
  317 │       Layer.mergeAll(
  318 │         Lambda.EventSource,
  319 │         AccessAnalyzer.ListFindingsV2Http,
  320 │         AccessAnalyzer.ListFindingsHttp,
  321 │         AccessAnalyzer.GetFindingV2Http,
  322 │         AccessAnalyzer.GetFindingHttp,
  323 │         AccessAnalyzer.GetFindingsStatisticsHttp,
  324 │         AccessAnalyzer.UpdateFindingsHttp,
> 325 │         AccessAnalyzer.ApplyArchiveRuleHttp,
  326 │         AccessAnalyzer.StartResourceScanHttp,
  327 │         AccessAnalyzer.GetAnalyzedResourceHttp,
  328 │         AccessAnalyzer.ListAnalyzedResourcesHttp,
  329 │         AccessAnalyzer.CreateAccessPreviewHttp,
  330 │         AccessAnalyzer.GetAccessPreviewHttp,
  331 │         AccessAnalyzer.ListAccessPreviewsHttp,
  332 │         AccessAnalyzer.ListAccessPreviewFindingsHttp,
  333 │         AccessAnalyzer.GenerateFindingRecommendationHttp,
  334 │         AccessAnalyzer.GetFindingRecommendationHttp,
  335 │         AccessAnalyzer.ValidatePolicyHttp,
  336 │         AccessAnalyzer.CheckAccessNotGrantedHttp,
  337 │         AccessAnalyzer.CheckNoNewAccessHttp,
  338 │         AccessAnalyzer.CheckNoPublicAccessHttp,
  339 │         AccessAnalyzer.StartPolicyGenerationHttp,
  340 │         AccessAnalyzer.GetGeneratedPolicyHttp,
  341 │         AccessAnalyzer.ListPolicyGenerationsHttp,
  342 │         AccessAnalyzer.CancelPolicyGenerationHttp,
  343 │       ),
  344 │     ),

0.82 packages/alchemy/test/AWS/DataBrew/handler.ts:40:3
  39 │ export const foundation = Effect.gen(function* () {
> 40 │   const bucket = yield* S3.Bucket("DataBrewBindingsBucket", {
  41 │     forceDestroy: true,
  42 │   });

0.82 packages/alchemy/test/AWS/EC2/fixtures/bindings-handler.ts:102:5
   92 │ export const BindingsFleetLive = Layer.effect(
   93 │   BindingsFleet,
   94 │   Effect.gen(function* () {
   95 │     const imageId = amazonLinux2023();
   96 │
   97 │     const vpc = yield* Vpc("BindingsVpc", { cidrBlock: "10.61.0.0/16" });
   98 │     const subnet = yield* Subnet("BindingsSubnet", {
   99 │       vpcId: vpc.vpcId,
  100 │       cidrBlock: "10.61.1.0/24",
  101 │     });
> 102 │     const group = yield* SecurityGroup("BindingsSecurityGroup", {
  103 │       vpcId: vpc.vpcId,
  104 │       description: "EC2 bindings test group",
  105 │     });
  106 │     const volume = yield* Volume("BindingsVolume", {
  107 │       availabilityZone: subnet.availabilityZone,
  108 │       size: 1,
  109 │     });
  110 │     const instance = yield* Instance("BindingsInstance", {
  111 │       imageId,
  112 │       instanceType: "t3.micro",
  113 │       subnetId: subnet.subnetId,
  114 │     });
  115 │     return { instance, group, volume };
  116 │   }),
  117 │ );

0.82 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:280:11
  279 │         return yield* HttpServerResponse.json(
> 280 │           {
  281 │             error: "Not found",
  282 │             method: request.method,
  283 │             pathname,
  284 │           },
  285 │           { status: 404 },
  286 │         );

0.82 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:12:1
> 12 │ export const EnvBucket = Cloudflare.R2.Bucket("RemoteContainerEnvBucket", {
  13 │   forceDestroy: true,
  14 │ });

0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/object.ts:7:3
  4 │ import * as Stream from "effect/Stream";
  5 │
  6 │ const KV = Cloudflare.KV.Namespace("DurableObjectWorkerEnvironmentKV", {
> 7 │   title: "durable-object-worker-environment-kv",
  8 │ });

0.82 packages/alchemy/test/Git/fixtures/s3-stack.ts:27:1
  24 │ export { TEST_SECRET };
  25 │
  26 │ /** Declared here so the stack tears it down with the packs still inside. */
> 27 │ export const GitObjects = AWS.S3.Bucket("GitS3Objects", { forceDestroy: true });

0.82 packages/alchemy/test/Planetscale/Postgres/fixtures/Stack.ts:25:5
  23 │ export const PlanetscaleDb = Effect.gen(function* () {
  24 │   const database = yield* Planetscale.PostgresDatabase("HyperdriveTestDb", {
> 25 │     name: "alchemy-postgres-hyperdrive",
  26 │     region: { slug: "us-east" },
  27 │     clusterSize: "PS_10",
  28 │   });
  29 │
  30 │   const branch = yield* Planetscale.PostgresBranch("HyperdriveTestBranch", {
  31 │     database,
  32 │     migrations: migrationsDir,
  33 │   });
  34 │
  35 │   const role = yield* Planetscale.PostgresRole("HyperdriveTestRole", {
  36 │     database,
  37 │     branch,
  38 │     inheritedRoles: ["postgres"],
  39 │   });
  40 │
  41 │   return { database, branch, role };
  42 │ });

0.81 packages/alchemy/test/AWS/Batch/fixtures/isolated-project-job.ts:26:5
  22 │ export default class IsolatedProjectJob extends AWS.Batch.JobDefinition<IsolatedProjectJob>()(
  23 │   "BatchIsolatedProjectJob",
  24 │   {
  25 │     main: project.main,
> 26 │     jobDefinitionName: "alchemy-test-batch-isolated-project",
  27 │     vcpus: 0.25,
  28 │     memory: 512,
  29 │     timeout: "10 minutes",
  30 │     // Docker Hub's `oven/bun` image; the public.ecr.aws default mirror
  31 │     // aggressively rate-limits anonymous pulls (429) during local builds.
  32 │     docker: { base: "oven/bun:1" },
  33 │   },
  34 │   Effect.gen(function* () {
  35 │     return {
  36 │       run: Effect.gen(function* () {
  37 │         // The awslogs driver captures stdout — print the marker for the
  38 │         // out-of-band log assertion.
  39 │         yield* Effect.sync(() => console.log(MARKER));
  40 │       }),
  41 │     };
  42 │   }),
  43 │ ) {}

0.81 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:42:5
  40 │   Effect.gen(function* () {
  41 │     const bucket = yield* S3.Bucket("kb-docs", { forceDestroy: true });
> 42 │     const kb = yield* Bedrock.KnowledgeBase("BindingsKb", {
  43 │       roleArn,
  44 │       knowledgeBaseConfiguration: {
  45 │         type: "VECTOR",
  46 │         vectorKnowledgeBaseConfiguration: {
  47 │           embeddingModelArn,
  48 │         },
  49 │       },
  50 │       storageConfiguration: {
  51 │         type: "OPENSEARCH_SERVERLESS",
  52 │         opensearchServerlessConfiguration: {
  53 │           collectionArn,
  54 │           vectorIndexName: indexName,
  55 │           fieldMapping: {
  56 │             vectorField: "bedrock-vector",
  57 │             textField: "bedrock-text",
  58 │             metadataField: "bedrock-metadata",
  59 │           },
  60 │         },
  61 │       },
  62 │     });

0.81 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:41:5
  40 │   Effect.gen(function* () {
> 41 │     const pool = yield* Cognito.UserPool("TriggerUserPool", {
  42 │       passwordPolicy: {
  43 │         minimumLength: 12,
  44 │         requireSymbols: false,
  45 │       },
  46 │       accountRecovery: [{ name: "admin_only", priority: 1 }],
  47 │       tags: { Purpose: "cognito-trigger-fixture" },
  48 │     });

0.81 packages/alchemy/test/AWS/DAX/slow-handler.ts:18:1
> 18 │ export const SLOW_SUBNET_GROUP_NAME = "alchemy-dax-bindings-subnets";

0.81 packages/alchemy/test/AWS/DynamoDB/sink-handler.ts:22:5
  19 │ export const SinkTableLive = Layer.effect(
  20 │   SinkTable,
  21 │   Effect.gen(function* () {
> 22 │     const table = yield* AWS.DynamoDB.Table("TableSinkTable", {
  23 │       partitionKey: "pk",
  24 │       sortKey: "sk",
  25 │       attributes: { pk: "S", sk: "S" },
  26 │     });
  27 │     return { table };
  28 │   }),
  29 │ );

0.81 packages/alchemy/test/AWS/IdentityCenter/handler.ts:43:9
  39 │     const permissionSet = yield* IdentityCenter.PermissionSet(
  40 │       "IdcBindingsPermissionSet",
  41 │       {
  42 │         instanceArn: instance.instanceArn,
> 43 │         name: "AlchemyIdcBindings",
  44 │         description: "Permission set used by the Bindings E2E fixture",
  45 │         sessionDuration: "1 hour",
  46 │       },
  47 │     );

0.81 packages/alchemy/test/AWS/MediaConnect/fixtures/handler.ts:30:5
  27 │     // STANDBY (which does not bill for transport) and nothing ever sends
  28 │     // media to it, so the observability ops see the typed
  29 │     // not-running/no-content behavior.
> 30 │     const flow = yield* MediaConnect.Flow("BindingFlow", {
  31 │       source: {
  32 │         Name: "primary",
  33 │         Protocol: "rtp",
  34 │         WhitelistCidr: "10.24.34.0/23",
  35 │         IngestPort: 5000,
  36 │       },
  37 │       tags: { fixture: "mediaconnect-bindings" },
  38 │     });

0.81 packages/alchemy/test/AWS/QApps/bindings-handler.ts:44:5
> 44 │     const app = yield* AWS.QApps.QApp("BindingsQApp", {
  45 │       instanceId,
  46 │       description: "alchemy QApps bindings fixture",
  47 │       appDefinition: {
  48 │         cards: [
  49 │           {
  50 │             textInput: {
  51 │               id: TEXT_CARD_ID,
  52 │               title: "Source Text",
  53 │               type: "text-input",
  54 │             },
  55 │           },
  56 │           {
  57 │             qQuery: {
  58 │               id: QUERY_CARD_ID,
  59 │               title: "Summary",
  60 │               type: "q-query",
  61 │               prompt: "Summarize the following text: @Source Text",
  62 │             },
  63 │           },
  64 │         ],
  65 │       },
  66 │       tags: { fixture: "qapps-bindings" },
  67 │     });

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:30:1
> 30 │ const Bucket = Cloudflare.R2.Bucket("Tasks", { forceDestroy: true });

0.80 packages/alchemy/src/Cloudflare/StateStore/Token.ts:35:5
  31 │ export const AuthToken = Effect.gen(function* () {
  32 │   const store = yield* Store;
  33 │   const random = yield* TokenValue;
  34 │   return yield* Secret.Secret(AuthTokenSecretName, {
> 35 │     name: AuthTokenSecretName,
  36 │     store,
  37 │     value: random.text,
  38 │   });
  39 │ });

0.80 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:43:7
  41 │   Effect.gen(function* () {
  42 │     const cluster = yield* EKS.Cluster("BindingsCluster", {
> 43 │       clusterName: "alchemy-test-eks-bindings",
  44 │       roleArn,
  45 │       resourcesVpcConfig: {
  46 │         subnetIds,
  47 │         endpointPublicAccess: true,
  48 │         endpointPrivateAccess: true,
  49 │       },
  50 │     });

0.80 packages/alchemy/test/AWS/IoTWireless/fixtures/handler.ts:85:7
  83 │     const destination = yield* IoTWireless.Destination("BindingsUplinks", {
  84 │       expressionType: "RuleName",
> 85 │       expression: "alchemy_iot_wireless_bindings_rule",
  86 │       roleArn: role.roleArn,
  87 │       tags: { fixture: "iot-wireless-bindings" },
  88 │     });

0.80 packages/alchemy/test/AWS/LakeFormation/handler.ts:17:1
> 17 │ export const FIXTURE_DATABASE = "alchemy_lf_bindings_fixture";
  18 │
  19 │ /** A tag key that never exists — drives the typed EntityNotFound paths. */
  20 │ const MISSING_TAG_KEY = "alchemy-lf-bindings-missing";

0.80 packages/alchemy/test/AWS/OpenSearch/data-plane-handler.ts:35:5
  34 │   Effect.gen(function* () {
> 35 │     const domain = yield* OpenSearch.Domain("DataPlaneDomain", {
  36 │       clusterConfig: { instanceType: "t3.small.search", instanceCount: 1 },
  37 │       ebsOptions: { volumeType: "gp3", volumeSize: 10 },
  38 │     });

0.80 packages/alchemy/test/AWS/S3/fixtures/presign-get-only-handler.ts:14:5
  11 │ export default PresignGetOnlyTestFunction.make(
  12 │   { main: import.meta.url, functionUrl: true },
  13 │   Effect.gen(function* () {
> 14 │     const bucket = yield* S3.Bucket("PresignGetOnlyBucket", {
  15 │       forceDestroy: true,
  16 │       versioning: "Enabled",
  17 │     });

0.80 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/storage.ts:3:1
  1 │ import * as Cloudflare from "@/Cloudflare";
  2 │
> 3 │ export const Storage = Cloudflare.R2.Bucket("Storage", { forceDestroy: true });

0.80 packages/better-auth/test/Cloudflare/fixtures/hyperdrive-worker.ts:10:1
   7 │ import { CloudflareHyperdrive } from "../../../src/CloudflareHyperdrive.ts";
   8 │ import { BetterAuth } from "../../../src/index.ts";
   9 │
> 10 │ export const HdProject = Neon.Project("BetterAuthHdPg");

0.79 packages/alchemy/test/AWS/ECR/handler.ts:38:3
  37 │ export class EcrTestFunction extends Lambda.Function<Lambda.Function>()(
> 38 │   "EcrTestFunction",
  39 │ ) {}

0.79 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:23:7
  21 │   Effect.gen(function* () {
  22 │     const keyspace = yield* Keyspaces.Keyspace("RestoreKs", {
> 23 │       keyspaceName: "alchemy_restore_test_ks",
  24 │     });

0.79 packages/alchemy/test/AWS/Lambda/fixtures/microvm/sandbox.ts:6:1
  3 │ import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
  4 │ import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
  5 │
> 6 │ export const SandboxBuildRole = AWS.IAM.Role("MicrovmSandboxBuildRole");

0.79 packages/alchemy/test/AWS/Logs/sink-handler.ts:14:1
  12 │ const main = path.resolve(import.meta.dirname, "sink-handler.ts");
  13 │
> 14 │ export const SINK_STREAM_NAME = "alchemy-test-log-event-sink-stream";

0.79 packages/alchemy/test/AWS/ResourceGroups/handler.ts:40:5
  37 │     // reservation pool group is one of the config types GroupResources /
  38 │     // UngroupResources accept, and creating it is free (the pool starts
  39 │     // empty and never acquires capacity).
> 40 │     const pool = yield* ResourceGroups.Group("BindingsPoolGroup", {
  41 │       description: "alchemy resource-groups bindings fixture pool",
  42 │       configuration: [
  43 │         {
  44 │           type: "AWS::ResourceGroups::Generic",
  45 │           parameters: [
  46 │             {
  47 │               name: "allowed-resource-types",
  48 │               values: ["AWS::EC2::CapacityReservation"],
  49 │             },
  50 │           ],
  51 │         },
  52 │         { type: "AWS::EC2::CapacityReservationPool" },
  53 │       ],
  54 │     });

0.79 packages/alchemy/test/AWS/SQS/sink-handler.ts:22:5
  19 │ export const TestQueueLive = Layer.effect(
  20 │   TestQueue,
  21 │   Effect.gen(function* () {
> 22 │     const queue = yield* AWS.SQS.Queue("QueueSinkQueue");
  23 │     return { queue };
  24 │   }),
  25 │ );

0.79 packages/alchemy/test/AWS/Smoke/fixtures/serverless-resources.ts:29:5
  26 │ export const ServerlessResourcesLive = Layer.effect(
  27 │   ServerlessResources,
  28 │   Effect.gen(function* () {
> 29 │     const pool = yield* AWS.Cognito.UserPool("SmokeUserPool", {
  30 │       passwordPolicy: {
  31 │         minimumLength: 12,
  32 │         requireSymbols: false,
  33 │       },
  34 │       accountRecovery: [{ name: "admin_only", priority: 1 }],
  35 │       tags: { Purpose: "serverless-smoke-fixture" },
  36 │     });

0.79 packages/alchemy/test/AWS/Timestream/sink-handler.ts:26:5
  25 │   Effect.gen(function* () {
> 26 │     const database = yield* Timestream.Database("SinkMetrics");

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/db.ts:24:3
  13 │ export const NeonDb = Effect.gen(function* () {
  14 │   // Resolved inside the effect (not at module scope) so it only runs at
  15 │   // deploy time — `import.meta.url` is undefined in the bundled worker.
  16 │   const migrationsDir = yield* Effect.sync(() =>
  17 │     path.join(
  18 │       import.meta.url ? fileURLToPath(import.meta.url) : ".",
  19 │       "..",
  20 │       "migrations",
  21 │     ),
  22 │   );
  23 │
> 24 │   const project = yield* Neon.Project("DrizzleWorkflowProject", {
  25 │     region: "aws-us-east-1",
  26 │   });
  27 │
  28 │   const branch = yield* Neon.Branch("DrizzleWorkflowBranch", {
  29 │     project,
  30 │     migrations: migrationsDir,
  31 │   });
  32 │
  33 │   return { project, branch };
  34 │ });

0.79 packages/alchemy/test/Fly/fixtures/bluegreen-runtime-secrets/writer.ts:13:3
  10 │ export const TRIGGER_SECRET = "RUNTIME_WRITER_TRIGGER";
  11 │ export const Token = Fly.Secret("Token", {
  12 │   app: Site,
> 13 │   name: "ACCEPTANCE_RUNTIME_SECRET",
  14 │   value: Redacted.make("fixture-token-two"),
  15 │ });

0.79 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:36:5
  35 │   Effect.gen(function* () {
> 36 │     const table = yield* AWS.DynamoDB.Table("EksHostTable", {
  37 │       partitionKey: "pk",
  38 │       attributes: { pk: "S" },
  39 │     });
  40 │     const putItem = yield* AWS.DynamoDB.PutItem(table);
  41 │     const TableName = yield* table.tableName;
  42 │
  43 │     return {
  44 │       fetch: Effect.gen(function* () {
  45 │         const request = yield* HttpServerRequest;
  46 │         const url = new URL(request.url, "http://eks-host");
  47 │         if (url.pathname === "/health") {
  48 │           return yield* HttpServerResponse.json({ ok: true });
  49 │         }
  50 │         if (url.pathname === "/put") {
  51 │           const id = url.searchParams.get("id") ?? "default";
  52 │           yield* putItem({ Item: { pk: { S: id } } });
  53 │           return yield* HttpServerResponse.json({
  54 │             written: id,
  55 │             table: yield* TableName,
  56 │           });
  57 │         }
  58 │         return HttpServerResponse.text("kubernetes deployment");
  59 │       }).pipe(Effect.orDie),
  60 │     };
  61 │   }).pipe(Effect.provide(AWS.DynamoDB.PutItemHttp)),

0.78 packages/alchemy/test/AWS/CodeDeploy/handler.ts:21:5
  18 │ const FIXTURE_REVISION = {
  19 │   revisionType: "S3",
  20 │   s3Location: {
> 21 │     bucket: "alchemy-test-codedeploy-bindings-nonexistent",
  22 │     key: "app.zip",
  23 │     bundleType: "zip",
  24 │   },
  25 │ } as const;

0.78 packages/alchemy/test/AWS/EC2/fixtures/ubuntu-instance.ts:13:1
> 13 │ export const ubuntuKeyPair = AWS.EC2.KeyPair("Ec2UbuntuKeyPair", {
  14 │   keyType: "ed25519",
  15 │ });

0.78 packages/alchemy/test/AWS/ECS/fixtures/inline-dockerfile-task.ts:37:5
  23 │   {
  24 │     main: import.meta.filename,
  25 │     dockerfile: Dockerfile.inline`
  26 │ FROM oven/bun:1
  27 │ RUN echo inline-env-artifact > /inline-artifact.txt
  28 │ `,
  29 │     cpu: 256,
  30 │     memory: 512,
  31 │     // Build/run on ARM64 so an image built on an Apple Silicon host matches
  32 │     // the Fargate runtime architecture (Graviton).
  33 │     runtimePlatform: {
  34 │       cpuArchitecture: "ARM64",
  35 │       operatingSystemFamily: "LINUX",
  36 │     },
> 37 │     taskName: "alchemy-test-ecs-inline-dockerfile",
  38 │   },

0.78 packages/alchemy/test/AWS/Rekognition/handler.ts:288:13
  287 │           const deleteFacesTag = yield* deleteFaces({
> 288 │             CollectionId: TEST_COLLECTION_ID,
  289 │             FaceIds: [BOGUS_FACE_ID],
  290 │           }).pipe(
  291 │             Effect.map(() => "Success"),
  292 │             Effect.catchTag("InvalidParameterException", (e) =>
  293 │               Effect.succeed(e._tag),
  294 │             ),
  295 │           );

0.78 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:41:7
  38 │   Effect.gen(function* () {
  39 │     const buckets = yield* Effect.all({
  40 │       GetObject: bucket("GetObjectBucket"),
> 41 │       PutObject: bucket("PutObjectBucket"),
  42 │       HeadObject: bucket("HeadObjectBucket"),
  43 │       GetObjectAttributes: bucket("GetObjectAttributesBucket"),
  44 │       CopyObject: bucket("CopyObjectBucket"),
  45 │       CopySource: bucket("CopySourceBucket"),
  46 │       UnboundSource: bucket("UnboundSourceBucket"),
  47 │       DeleteObject: bucket("DeleteObjectBucket"),
  48 │       DeleteObjects: bucket("DeleteObjectsBucket"),
  49 │       ListObjectsV2: bucket("ListObjectsV2Bucket"),
  50 │       ListObjectVersions: bucket("ListObjectVersionsBucket"),
  51 │       GetObjectTagging: bucket("GetObjectTaggingBucket"),
  52 │       PutObjectTagging: bucket("PutObjectTaggingBucket"),
  53 │       DeleteObjectTagging: bucket("DeleteObjectTaggingBucket"),
  54 │       PresignPutObject: bucket("PresignPutObjectBucket"),
  55 │     });

0.78 packages/alchemy/test/AWS/VpcLattice/handler.ts:25:5
  22 │   Effect.gen(function* () {
  23 │     // A LAMBDA-type target group the function manages its own registration
  24 │     // in at runtime — the self-registration data plane.
> 25 │     const targetGroup = yield* VpcLattice.TargetGroup("BindingTargetGroup", {
  26 │       type: "LAMBDA",
  27 │     });

0.78 packages/alchemy/test/Git/fixtures/lambda-stack.ts:26:1
  23 │ import { TEST_SECRET, TestApi, TestAuthLive } from "./stack.ts";
  24 │ export { TEST_SECRET };
  25 │
> 26 │ const GitObjects = Cloudflare.R2.Bucket("GitLambdaObjects", {
  27 │   forceDestroy: true,
  28 │ });

0.78 packages/alchemy/test/Neon/fixtures/function-events.ts:19:3
  17 │ export const project = Project("EventProject", { region: "aws-us-east-2" });
  18 │ export const bucket = Bucket(
> 19 │   "EventBucket",
  20 │   Effect.gen(function* () {
  21 │     return { project: yield* project, forceDestroy: true };
  22 │   }),
  23 │ );

0.77 packages/alchemy/src/Cloudflare/SecretsStore/SecretsStore.ts:105:11
  100 │       const response = yield* secretsStore
  101 │         .createStore({
  102 │           accountId: acct,
  103 │           // `default_secrets_store` is the name Cloudflare uses for an
  104 │           // account's default Secrets Store.
> 105 │           name: "default_secrets_store",
  106 │         })
  107 │         .pipe(
  108 │           Effect.catchTag("MaximumStoresExceeded", () =>
  109 │             Effect.succeed(undefined),
  110 │           ),
  111 │         );

0.77 packages/alchemy/test/AWS/AppIntegrations/fixtures/handler.ts:16:3
  13 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  14 │
  15 │ export class AppIntegrationsTestFunction extends Lambda.Function<Lambda.Function>()(
> 16 │   "AppIntegrationsTestFunction",
  17 │ ) {}

0.77 packages/alchemy/test/AWS/DLM/handler.ts:26:5
  23 │   Effect.gen(function* () {
  24 │     // The lifecycle policy the policy-scoped binding is bound to. DISABLED
  25 │     // and targeting a tag no volume carries, so it never creates snapshots.
> 26 │     const policy = yield* DLM.LifecyclePolicy("BindingPolicy", {
  27 │       description: "alchemy dlm bindings fixture policy",
  28 │       state: "DISABLED",
  29 │       policyDetails: {
  30 │         resourceTypes: ["VOLUME"],
  31 │         targetTags: { AlchemyDlmBindings: "true" },
  32 │         schedules: [
  33 │           {
  34 │             name: "Daily",
  35 │             createRule: { interval: 24, intervalUnit: "HOURS" },
  36 │             retainRule: { count: 1 },
  37 │           },
  38 │         ],
  39 │       },
  40 │     });

0.77 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:31:5
  30 │   Effect.gen(function* () {
> 31 │     const thing = yield* AWS.IoT.Thing("BindingsThing", {
  32 │       attributes: { purpose: "bindings-test" },
  33 │     });

0.77 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:19:3
  16 │ export const CONTACT_EMAIL = "sam+alchemy-test-contact-bindings@alchemy.run";
  17 │
  18 │ export class NotificationsContactsTestFunction extends Lambda.Function<Lambda.Function>()(
> 19 │   "NotificationsContactsTestFunction",
  20 │ ) {}

0.77 packages/alchemy/test/AWS/SageMaker/handler.ts:24:5
  23 │   Effect.gen(function* () {
> 24 │     const featureGroup = yield* SageMaker.FeatureGroup("BindingsFeatures", {
  25 │       recordIdentifierFeatureName: "user_id",
  26 │       eventTimeFeatureName: "event_time",
  27 │       featureDefinitions: [
  28 │         { FeatureName: "user_id", FeatureType: "String" },
  29 │         { FeatureName: "event_time", FeatureType: "String" },
  30 │         { FeatureName: "clicks", FeatureType: "Integral" },
  31 │       ],
  32 │       onlineStoreConfig: { EnableOnlineStore: true },
  33 │     });

0.76 packages/alchemy/test/AWS/CloudControl/handler.ts:250:13
  234 │         if (request.method === "POST" && pathname === "/runtime-create") {
  235 │           const body = (yield* request.json) as unknown as { value: string };
  236 │           yield* cleanupRuntimeParam;
  237 │           const created = yield* createResource({
  238 │             TypeName: SSM_PARAMETER,
  239 │             DesiredState: JSON.stringify({
  240 │               Name: RUNTIME_PARAM,
  241 │               Type: "String",
  242 │               Value: body.value,
  243 │             }),
  244 │           });
  245 │           const settled = yield* waitSettled(
  246 │             created.ProgressEvent!.RequestToken!,
  247 │           );
  248 │           const result = yield* getResource({
  249 │             TypeName: SSM_PARAMETER,
> 250 │             Identifier: RUNTIME_PARAM,
  251 │           });
  252 │           return yield* HttpServerResponse.json({
  253 │             status: settled.ProgressEvent?.OperationStatus ?? null,
  254 │             value: readValue(result.ResourceDescription) ?? null,
  255 │           });
  256 │         }

0.76 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:45:5
  44 │   Effect.gen(function* () {
> 45 │     const workspace = yield* Grafana.Workspace("BindingsWorkspace", {
  46 │       description: "grafana bindings fixture",
  47 │       accountAccessType: "CURRENT_ACCOUNT",
  48 │       authenticationProviders: ["SAML"],
  49 │       permissionType: "SERVICE_MANAGED",
  50 │       dataSources: ["CLOUDWATCH"],
  51 │       tags: { fixture: "grafana-bindings" },
  52 │     });

0.76 packages/alchemy/test/AWS/Kendra/handler.ts:381:15
  378 │           // the four ACL bindings.
  379 │           const created = yield* errorTagged(
  380 │             createAcl({
> 381 │               Name: "block-departed-users",
  382 │               AccessControlList: [
  383 │                 { Name: "departed-user", Type: "USER", Access: "DENY" },
  384 │               ],
  385 │             }),
  386 │           );

0.76 packages/alchemy/test/AWS/Lambda/fixtures/event-source-mapping-handler.ts:23:5
  17 │ export default EventSourceMappingFunction.make(
  18 │   {
  19 │     main: import.meta.url,
  20 │     functionUrl: false,
  21 │   },
  22 │   Effect.gen(function* () {
> 23 │     const queue = yield* SQS.Queue("EventSourceMappingQueue");
  24 │
  25 │     yield* SQS.consumeQueueMessages(queue, (stream) =>
  26 │       stream.pipe(Stream.runDrain),
  27 │     );
  28 │
  29 │     return {
  30 │       fetch: Effect.gen(function* () {
  31 │         return HttpServerResponse.text("ok");
  32 │       }).pipe(Effect.orDie),
  33 │     };
  34 │   }).pipe(Effect.provide(Layer.mergeAll(Lambda.QueueEventSource))),
  35 │ );

0.76 packages/alchemy/test/AWS/Logs/event-source-handler.ts:32:5
  29 │ export const SourceGroupAndResultQueueLive = Layer.effect(
  30 │   SourceGroupAndResultQueue,
  31 │   Effect.gen(function* () {
> 32 │     const source = yield* AWS.Logs.LogGroup("EventSourceLogGroup", {
  33 │       retention: "1 day",
  34 │     });
  35 │     const result = yield* AWS.SQS.Queue("LogEventsResultQueue");
  36 │     return { source, result };
  37 │   }),
  38 │ );

0.76 packages/alchemy/test/AWS/SimpleDB/handler.ts:21:5
  20 │   Effect.gen(function* () {
> 21 │     const domain = yield* SimpleDB.Domain("BindingsDomain", {});
  22 │
  23 │     const putAttributes = yield* SimpleDB.PutAttributes(domain);
  24 │     const getAttributes = yield* SimpleDB.GetAttributes(domain);

0.76 packages/alchemy/test/AWS/StepFunctions/handler.ts:54:5
  53 │     // STANDARD workflow for async start + describe polling
> 54 │     const standard = yield* StepFunctions.StateMachine("TestStandardMachine", {
  55 │       definition: {
  56 │         StartAt: "Done",
  57 │         States: {
  58 │           Done: { Type: "Pass", Result: { done: true }, End: true },
  59 │         },
  60 │       },
  61 │     });

0.76 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/local-worker.ts:16:3
  15 │ export const LocalHyperdrive = Effect.gen(function* () {
> 16 │   const project = yield* Neon.Project("HyperdriveLocalProject");
  17 │   return yield* Cloudflare.Hyperdrive.Connection("HyperdriveLocalConnection", {
  18 │     origin: project.origin,
  19 │     caching: { disabled: true },
  20 │     dev: project.origin,
  21 │   });
  22 │ });

0.76 packages/alchemy/test/Cloudflare/R2/fixtures/bucket.ts:10:1
> 10 │ export const TestBucket = Cloudflare.R2.Bucket("R2BindingTestBucket", {
  11 │   forceDestroy: true,
  12 │ });

0.76 packages/alchemy/test/Cloudflare/Workflows/fixtures/test-workflow.ts:4:1
  1 │ import * as Cloudflare from "@/Cloudflare";
  2 │ import * as Effect from "effect/Effect";
  3 │
> 4 │ export const RollbackResults = Cloudflare.R2.Bucket("WorkflowRollbackResults", {
  5 │   forceDestroy: true,
  6 │ });

0.76 packages/alchemy/test/Neon/fixtures/backend-http-worker.ts:32:9
  26 │   Effect.gen(function* () {
  27 │     const auth = yield* Neon.ConnectAuth(backendAuth);
  28 │     const data = yield* Neon.QueryDataApi(backendDataApi);
  29 │     const ai = yield* Neon.QueryAIGateway(backendGateway);
  30 │     const shared = yield* Neon.QueryAIGateway(
  31 │       Effect.gen(function* () {
> 32 │         return yield* Neon.AIGateway("SharedGateway", {
  33 │           branch: yield* backendBranch,
  34 │         });
  35 │       }),
  36 │     );
  37 │     return {
  38 │       fetch: Effect.gen(function* () {
  39 │         return yield* HttpServerResponse.json({
  40 │           authUrl: yield* auth.baseUrl,
  41 │           jwksUrl: yield* auth.jwksUrl,
  42 │           dataUrl: yield* data.baseUrl,
  43 │           aiUrl: yield* ai.baseUrl,
  44 │           hasToken: Redacted.value(yield* ai.token).length > 0,
  45 │           sharedToken:
  46 │             Redacted.value(yield* ai.token) ===
  47 │             Redacted.value(yield* shared.token),
  48 │         });
  49 │       }),
  50 │     };
  51 │   }).pipe(Effect.provide(bindings)),

0.75 packages/alchemy/test/AWS/Bedrock/handler.ts:42:5
  39 │   Effect.gen(function* () {
  40 │     // An agent + alias to exercise InvokeAgent end-to-end. The alias
  41 │     // snapshots the prepared DRAFT into version 1 on create.
> 42 │     const agent = yield* Bedrock.Agent("BindingsTestAgent", {
  43 │       foundationModel: MODEL,
  44 │       instruction:
  45 │         "You are a helpful assistant. Answer every question with one short sentence.",
  46 │       // Long-term memory so GetAgentMemory / DeleteAgentMemory are callable.
  47 │       memoryConfiguration: {
  48 │         enabledMemoryTypes: ["SESSION_SUMMARY"],
  49 │         storage: "30 days",
  50 │       },
  51 │     });

0.75 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:47:5
  44 │     // GATED FIXTURE: deploying this requires a CloudTrail-Lake-onboarded
  45 │     // account (Lake is closed to new customers — see the typed
  46 │     // CloudTrailLakeOnboardingClosed probe in EventDataStore.test.ts).
> 47 │     const store = yield* CloudTrail.EventDataStore("BindingsLake", {
  48 │       multiRegionEnabled: false,
  49 │       retentionPeriod: "7 days",
  50 │       terminationProtectionEnabled: false,
  51 │     });

0.75 packages/alchemy/test/AWS/CostExplorer/handler.ts:122:5
  119 │     const provideAnomalyFeedback = yield* CostExplorer.ProvideAnomalyFeedback();
  120 │
  121 │     // --- monitor-scoped bindings ---
> 122 │     const getAnomalies = yield* CostExplorer.GetAnomalies(monitor);

0.75 packages/alchemy/test/AWS/EMR/slow-handler.ts:36:5
  33 │   Effect.gen(function* () {
  34 │     // EMR service role (legacy managed policy — the v2 policy requires
  35 │     // tag-scoped resources).
> 36 │     const serviceRole = yield* IAM.Role("EmrBindingsServiceRole", {
  37 │       assumeRolePolicyDocument: {
  38 │         Version: "2012-10-17",
  39 │         Statement: [
  40 │           {
  41 │             Effect: "Allow",
  42 │             Principal: { Service: ["elasticmapreduce.amazonaws.com"] },
  43 │             Action: ["sts:AssumeRole"],
  44 │           },
  45 │         ],
  46 │       },
  47 │       managedPolicyArns: [
  48 │         "arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole",
  49 │       ],
  50 │     });

0.75 packages/alchemy/test/AWS/SQS/event-source-handler.ts:30:5
  27 │ export const SourceAndResultQueuesLive = Layer.effect(
  28 │   SourceAndResultQueues,
  29 │   Effect.gen(function* () {
> 30 │     const source = yield* AWS.SQS.Queue("EventSourceSourceQueue");
  31 │     const result = yield* AWS.SQS.Queue("EventSourceResultQueue");
  32 │     return { source, result };
  33 │   }),
  34 │ );

0.75 packages/alchemy/test/Cloudflare/Access/fixtures/access-worker.ts:9:1
>  9 │ export const App = Cloudflare.Access.Application("WorkerAccessApp", {
  10 │   type: "self_hosted",
  11 │   name: "Access for alchemy worker-enrollment test",
  12 │   policies: [
  13 │     {
  14 │       decision: "allow",
  15 │       include: [{ emailDomain: "example.com" }],
  16 │     },
  17 │   ],
  18 │ });

0.75 packages/alchemy/test/Cloudflare/Website/tanstack-dev-bindings-fixture/alchemy.run.ts:5:1
  2 │ import * as Cloudflare from "alchemy/Cloudflare";
  3 │ import * as Effect from "effect/Effect";
  4 │
> 5 │ export const Bucket = Cloudflare.R2.Bucket("DevBucket", { forceDestroy: true });

0.75 packages/pkg/src/Registry/Bindings.ts:114:1
  111 │ export const SWEEP_LOOKAHEAD = Duration.hours(2);
  112 │
  113 │ /** Content-addressed tarballs, keyed `<encoded name>/<sha256>.tgz`. */
> 114 │ export const Bucket = Cloudflare.R2.Bucket("Bucket", { forceDestroy: true });
  115 │
  116 │ export const tarballKey = (name: string, sha256: string) =>
  117 │   `${encodeURIComponent(name)}/${sha256}.tgz`;

0.74 packages/alchemy/test/AWS/ACM/handler.ts:62:5
  59 │     // PENDING_VALIDATION forever: describe/list/search succeed against it,
  60 │     // while issuance-gated operations (get/export/renew) fail with typed
  61 │     // errors — both directions prove the binding + IAM wiring.
> 62 │     const certificate = yield* ACM.Certificate("BindingsCertificate", {
  63 │       domainName: FIXTURE_DOMAIN,
  64 │       subjectAlternativeNames: [FIXTURE_DOMAIN],
  65 │     });

0.74 packages/alchemy/test/AWS/Cognito/handler.ts:63:5
> 63 │     const guestRole = yield* IAM.Role("BindingsGuestRole", {
  64 │       assumeRolePolicyDocument: {
  65 │         Version: "2012-10-17",
  66 │         Statement: [
  67 │           {
  68 │             Effect: "Allow",
  69 │             Principal: { Federated: "cognito-identity.amazonaws.com" },
  70 │             Action: ["sts:AssumeRoleWithWebIdentity"],
  71 │             Condition: {
  72 │               StringEquals: {
  73 │                 "cognito-identity.amazonaws.com:aud": identities.identityPoolId,
  74 │               },
  75 │               "ForAnyValue:StringLike": {
  76 │                 "cognito-identity.amazonaws.com:amr": "unauthenticated",
  77 │               },
  78 │             },
  79 │           },
  80 │         ],
  81 │       },
  82 │     });

0.74 packages/alchemy/test/AWS/Kafka/kafka-handler.ts:52:5
  48 │ export const FixtureClusterLive = Layer.effect(
  49 │   FixtureCluster,
  50 │   Effect.gen(function* () {
  51 │     const subnetIds = yield* resolveSubnets;
> 52 │     const cluster = yield* AWS.Kafka.ServerlessCluster("FixtureCluster", {
  53 │       subnetIds,
  54 │       tags: { fixture: "kafka-serverless" },
  55 │     });
  56 │     return { cluster };
  57 │   }),
  58 │ );

0.74 packages/alchemy/test/AWS/Synthetics/handler.ts:39:5
  37 │     // `rate(0 minute)` = run exactly once when started, so /start does not
  38 │     // leave a continuously-running canary behind.
> 39 │     const canary = yield* Synthetics.Canary("BindingsCanary", {
  40 │       script: HEARTBEAT_SCRIPT,
  41 │       artifactS3Location: Output.interpolate`s3://${bucket.bucketName}/bindings`,
  42 │       schedule: { expression: "rate(0 minute)" },
  43 │       runConfig: { timeout: "60 seconds" },
  44 │       successRetentionPeriod: "1 day",
  45 │       failureRetentionPeriod: "1 day",
  46 │     });

0.74 packages/alchemy/test/Cloudflare/Dns/fixtures/zone.ts:5:3
  2 │ import * as Cloudflare from "@/Cloudflare";
  3 │
  4 │ export const Zone = Cloudflare.Zone.Zone("alchemy-test-2.us", {
> 5 │   name: "alchemy-test-2.us",
  6 │ }).pipe(AdoptPolicy.adopt());

0.73 packages/alchemy/test/AWS/AppRunner/fixtures/service.ts:25:5
  22 │   "AppRunnerE2EService",
  23 │   {
  24 │     main: import.meta.filename,
> 25 │     serviceName: "alchemy-test-apprunner-e2e",
  26 │     port: 3000,
  27 │     instanceConfiguration: { cpu: "256", memory: "512" },
  28 │     healthCheckConfiguration: { protocol: "HTTP", path: "/health" },
  29 │     // Docker Hub's `oven/bun` image; the public.ecr.aws default mirror
  30 │     // aggressively rate-limits anonymous pulls (429) during local builds.
  31 │     docker: { base: "oven/bun:1" },
  32 │   },

0.73 packages/alchemy/test/AWS/DocDB/slow-handler.ts:44:3
  43 │ export class DocDBSlowTestFunction extends Lambda.Function<Lambda.Function>()(
> 44 │   "DocDBSlowTestFunction",
  45 │ ) {}

0.73 packages/alchemy/test/AWS/ECS/fixtures/nested-ecs-lambda.ts:26:3
  21 │ const NestedOneShotTask = ECS.Task("NestedReproOneShotTask", {
  22 │   image: "busybox:stable",
  23 │   command: ["sh", "-c", "echo alchemy-nested-repro-oneshot"],
  24 │   cpu: 256,
  25 │   memory: 512,
> 26 │   taskName: "alchemy-nested-repro-oneshot",
  27 │ });

0.73 packages/alchemy/test/Cloudflare/Access/fixtures/idp-lookup-worker.ts:17:7
  10 │ export default class IdpLookupWorker extends Cloudflare.Worker<IdpLookupWorker>()(
  11 │   "IdpLookupWorker",
  12 │   {
  13 │     main: import.meta.url,
  14 │   },
  15 │   Effect.gen(function* () {
  16 │     const findIdp = yield* Cloudflare.Access.GetIdentityProvider({
> 17 │       name: "alchemy-zt-idp-worker-lookup",
  18 │     });
  19 │
  20 │     return {
  21 │       fetch: Effect.gen(function* () {
  22 │         const idp = yield* findIdp().pipe(Effect.orDie);
  23 │         return yield* HttpServerResponse.json({
  24 │           identityProviderId: idp?.identityProviderId ?? null,
  25 │           type: idp?.type ?? null,
  26 │         });
  27 │       }),
  28 │     };
  29 │   }).pipe(Effect.provide(Cloudflare.Access.GetIdentityProviderHttp)),
  30 │ ) {}

0.73 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/stack.ts:21:9
  15 │ export const AsyncWorker = Cloudflare.Worker("HyperdriveAsyncWorker", {
  16 │   main: pathe.resolve(import.meta.dirname, "async-worker.ts"),
  17 │   env: {
  18 │     HD: Effect.gen(function* () {
  19 │       const project = yield* Neon.Project("HyperdriveBindingProject");
  20 │       return yield* Cloudflare.Hyperdrive.Connection(
> 21 │         "HyperdriveBindingConnection",
  22 │         { origin: project.origin },
  23 │       );
  24 │     }),
  25 │   },
  26 │ });

0.73 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:21:3
  20 │ export const PrismaDb = Effect.gen(function* () {
> 21 │   const project = yield* Project("PrismaHyperdriveProject", {
  22 │     createDatabase: false,
  23 │   });
  24 │   const database = yield* Postgres("PrismaHyperdriveDb", {
  25 │     project,
  26 │   });
  27 │   const connection = yield* Connection("PrismaHyperdriveConnection", {
  28 │     database,
  29 │   });
  30 │   return { project, database, connection };
  31 │ });

0.72 packages/alchemy/src/Git/Hasher/LambdaFunction.ts:31:3
  28 │ import { handleHashEvent, isHashEvent } from "./LambdaEvent.ts";
  29 │
  30 │ export default class HasherFunction extends Lambda.Function<HasherFunction>()(
> 31 │   "GitHasher",
  32 │   {
  33 │     main: import.meta.url,
  34 │     // CPU scales with memory on Lambda; 3 GB is the fastest single-thread
  35 │     // tier and a chunk needs well under that.
  36 │     memorySize: 3008,
  37 │     timeout: Duration.seconds(60),
  38 │   },
  39 │   Effect.gen(function* () {
  40 │     const fn = yield* Lambda.Function;
  41 │     yield* fn.listen((event: unknown) =>
  42 │       isHashEvent(event) ? handleHashEvent(event) : undefined,
  43 │     );
  44 │     return {};
  45 │   }),
  46 │ ) {}

0.72 packages/alchemy/test/AWS/Detective/handler.ts:273:7
  272 │     Effect.provide(
> 273 │       Layer.mergeAll(
  274 │         Detective.AcceptInvitationHttp,
  275 │         Detective.BatchGetGraphMemberDatasourcesHttp,
  276 │         Detective.BatchGetMembershipDatasourcesHttp,
  277 │         Detective.CreateMembersHttp,
  278 │         Detective.DeleteMembersHttp,
  279 │         Detective.DescribeOrganizationConfigurationHttp,
  280 │         Detective.DisableOrganizationAdminAccountHttp,
  281 │         Detective.DisassociateMembershipHttp,
  282 │         Detective.EnableOrganizationAdminAccountHttp,
  283 │         Detective.GetInvestigationHttp,
  284 │         Detective.GetMembersHttp,
  285 │         Detective.ListDatasourcePackagesHttp,
  286 │         Detective.ListIndicatorsHttp,
  287 │         Detective.ListInvestigationsHttp,
  288 │         Detective.ListInvitationsHttp,
  289 │         Detective.ListMembersHttp,
  290 │         Detective.ListOrganizationAdminAccountsHttp,
  291 │         Detective.RejectInvitationHttp,
  292 │         Detective.StartInvestigationHttp,
  293 │         Detective.StartMonitoringMemberHttp,
  294 │         Detective.UpdateDatasourcePackagesHttp,
  295 │         Detective.UpdateInvestigationStateHttp,
  296 │         Detective.UpdateOrganizationConfigurationHttp,
  297 │       ),
  298 │     ),

0.72 packages/alchemy/test/AWS/GlobalAccelerator/handler.ts:44:7
  41 │     // endpoint group starts empty; the Add/RemoveEndpoints bindings register
  42 │     // and deregister the Elastic IP below at runtime.
  43 │     const accelerator = yield* GlobalAccelerator.Accelerator(
> 44 │       "BindingAccelerator",
  45 │       {},
  46 │     );

0.72 packages/alchemy/test/AWS/GuardDuty/handler.ts:167:9
> 167 │         // Archive whatever findings currently exist (sample findings from

0.72 packages/alchemy/test/AWS/HealthLake/handler.ts:50:5
  49 │   Effect.gen(function* () {
> 50 │     const bucket = yield* S3.Bucket("HealthLakeBindingsBucket", {
  51 │       forceDestroy: true,
  52 │     });

0.72 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/sandbox.ts:17:3
  14 │ export const project = isolatedProject("lambda-microvm", import.meta.filename);
  15 │
  16 │ export const IsolatedSandboxBuildRole = AWS.IAM.Role(
> 17 │   "IsolatedProjectMicrovmBuildRole",
  18 │ );

0.72 packages/alchemy/test/AWS/LexV2/handler.ts:15:3
  12 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  13 │
  14 │ export class LexTestFunction extends Lambda.Function<Lambda.Function>()(
> 15 │   "LexTestFunction",
  16 │ ) {}

0.72 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:31:5
  25 │ export const FixtureGraphLive = Layer.effect(
  26 │   FixtureGraph,
  27 │   Effect.gen(function* () {
  28 │     // 16 m-NCUs is the smallest provisioned size; zero replicas and public
  29 │     // connectivity keep the fixture as cheap and simple as possible (data
  30 │     // plane is still IAM-authenticated).
> 31 │     const graph = yield* NeptuneGraph.Graph("FixtureGraph", {
  32 │       provisionedMemory: 16,
  33 │       publicConnectivity: true,
  34 │       replicaCount: 0,
  35 │       deletionProtection: false,
  36 │       tags: { fixture: "neptune-graph" },
  37 │     });
  38 │     return { graph };
  39 │   }),
  40 │ );

0.72 packages/alchemy/test/AWS/Pipes/pipe-handler.ts:29:5
  26 │ export const PipeQueuesLive = Layer.effect(
  27 │   PipeQueues,
  28 │   Effect.gen(function* () {
> 29 │     const source = yield* AWS.SQS.Queue("PipeSourceQueue");
  30 │     const sink = yield* AWS.SQS.Queue("PipeSinkQueue");
  31 │     return { source, sink };
  32 │   }),
  33 │ );

0.72 packages/alchemy/test/AWS/QBusiness/handler.ts:68:5
> 68 │     const web = yield* QBusiness.WebExperience("BindingsChat", {
  69 │       applicationId: app.applicationId,
  70 │       title: "Alchemy QBusiness Bindings",
  71 │     });

0.72 packages/alchemy/test/AWS/Route53/bindings-handler.ts:32:5
  29 │     // Public zone under the reserved-domain-safe `.alchemy` TLD — never
  30 │     // delegated, but Route 53's authoritative servers (and TestDNSAnswer)
  31 │     // answer for it regardless.
> 32 │     const zone = yield* Route53.HostedZone("BindingsZone", {
  33 │       name: "alchemy-route53-bindings.alchemy.",
  34 │       comment: "alchemy Route53 bindings fixture",
  35 │       forceDestroy: true,
  36 │     });

0.72 packages/alchemy/test/AWS/SSMContacts/bindings-handler.ts:30:5
  27 │ export const BoundContactsLive = Layer.effect(
  28 │   BoundContacts,
  29 │   Effect.gen(function* () {
> 30 │     const oncall = yield* AWS.SSMContacts.Contact("BindingsOncall", {
  31 │       type: "PERSONAL",
  32 │       displayName: "Bindings Fixture On-Call",
  33 │     });
  34 │     const email = yield* AWS.SSMContacts.ContactChannel("BindingsEmail", {
  35 │       contactId: oncall.contactArn,
  36 │       type: "EMAIL",
  37 │       deliveryAddress: { SimpleAddress: "oncall@example.com" },
  38 │       deferActivation: true,
  39 │     });
  40 │     const rotation = yield* AWS.SSMContacts.Rotation("BindingsRotation", {
  41 │       contactIds: [oncall.contactArn],
  42 │       timeZoneId: "America/Los_Angeles",
  43 │       startTime: "2030-01-01T00:00:00Z",
  44 │       recurrence: {
  45 │         NumberOfOnCalls: 1,
  46 │         RecurrenceMultiplier: 1,
  47 │         DailySettings: [{ HourOfDay: 9, MinuteOfHour: 0 }],
  48 │       },
  49 │     });
  50 │     return { oncall, email, rotation };
  51 │   }),
  52 │ );

0.72 packages/alchemy/test/AWS/Transfer/handler.ts:37:3
  36 │ export class TransferTestFunction extends Lambda.Function<Lambda.Function>()(
> 37 │   "TransferTestFunction",
  38 │ ) {}

0.72 packages/alchemy/test/Fly/fixtures/app/shared.ts:16:3
  14 │ export const Marker = Fly.Secret("Marker", {
  15 │   app: Site,
> 16 │   name: SECRET_NAME,
  17 │   value: Redacted.make(MARKER),
  18 │ });

0.72 packages/alchemy/test/Git/fixtures/stack.ts:42:1
  41 │ /** The suites' bucket — owned by the assembly, like any user's. */
> 42 │ const GitObjects = Cloudflare.R2.Bucket("GitObjects", {
  43 │   // Test stacks must tear down even with packs/bundles/head snapshots
  44 │   // still in the bucket (the e2e benches leave repos behind by design).
  45 │   forceDestroy: true,
  46 │ });

0.72 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:12:5
  10 │ export const Hyperdrive = Effect.gen(function* () {
  11 │   const database = yield* Planetscale.MySQLDatabase("SqlMySQLDb", {
> 12 │     name: "alchemy-sql-mysql",
  13 │     region: { slug: "us-east" },
  14 │     clusterSize: "PS_10",
  15 │   });
  16 │   // `admin` because the fixture creates its table over the wire (`/init`
  17 │   // runs raw DDL); the default branch is `main`.
  18 │   const password = yield* Planetscale.MySQLPassword("SqlMySQLPassword", {
  19 │     database,
  20 │     role: "admin",
  21 │   });
  22 │   return yield* Cloudflare.Hyperdrive.Connection("SqlMySQLEdge", {
  23 │     origin: password.origin,
  24 │     // The tests assert read-after-write; Hyperdrive's default SELECT caching
  25 │     // (~60s TTL) can serve a pre-insert empty result — and keep serving it
  26 │     // across retries — so caching is disabled for correctness assertions.
  27 │     caching: { disabled: true },
  28 │   });
  29 │ });

0.72 packages/alchemy/test/Stripe/fixtures/worker.ts:14:7
   7 │ export default class StripeBindingWorker extends Cloudflare.Worker<StripeBindingWorker>()(
   8 │   "StripeBindingWorker",
   9 │   {
  10 │     main: import.meta.url,
  11 │   },
  12 │   Effect.gen(function* () {
  13 │     const product = yield* Stripe.Product("BoundProduct", {
> 14 │       name: "Alchemy Bound Product",
  15 │       description: "Worker binding coverage",
  16 │     });
  17 │     const retrieveProduct = yield* Stripe.RetrieveProduct(product);
  18 │
  19 │     return {
  20 │       fetch: Effect.gen(function* () {
  21 │         const request = yield* HttpServerRequest;
  22 │         if (request.url.startsWith("/product")) {
  23 │           const live = yield* retrieveProduct().pipe(Effect.orDie);
  24 │           return yield* HttpServerResponse.json({
  25 │             id: live.id,
  26 │             name: live.name,
  27 │           });
  28 │         }
  29 │         return HttpServerResponse.text("ok");
  30 │       }),
  31 │     };
  32 │   }).pipe(Effect.provide(Stripe.RetrieveProductHttp)),
  33 │ ) {}

0.72 packages/frontend-frameworks/fixtures/octane/e2e.config.ts:38:11
  32 │   target: {
  33 │     cloudflare: {
  34 │       worker: {
  35 │         compatibilityDate: "2026-03-10",
  36 │         compatibilityFlags: ["nodejs_compat"],
  37 │         worker: {
> 38 │           name: "fixtures-octane",
  39 │         },
  40 │       },
  41 │       preview: {
  42 │         compatibilityDate: "2026-03-10",
  43 │         compatibilityFlags: ["nodejs_compat"],
  44 │         bindings: { FIXTURE_SECRET: SECRET },
  45 │         assets: {
  46 │           binding: "ASSETS",
  47 │           routerConfig: {
  48 │             has_user_worker: true,
  49 │             invoke_user_worker_ahead_of_assets: false,
  50 │           },
  51 │           assetConfig: {
  52 │             html_handling: "auto-trailing-slash",
  53 │             not_found_handling: "none",
  54 │           },
  55 │         },
  56 │       },
  57 │     },
  58 │   },

0.71 packages/alchemy/test/AWS/DynamoDB/handler.ts:49:5
> 49 │     const exportBucket = yield* S3.Bucket("ExportBucket", {
  50 │       forceDestroy: true,
  51 │     });

0.71 packages/alchemy/test/AWS/ECS/fixtures/tagged-oneshot-task.ts:36:5
  22 │ export default TaggedOneShotTask.make(
  23 │   {
  24 │     main: import.meta.filename,
  25 │     // Docker Hub's `oven/bun`; the public.ecr.aws default mirror rate-limits
  26 │     // anonymous pulls during local builds (see fixtures/task.ts).
  27 │     image: "oven/bun:1",
  28 │     cpu: 256,
  29 │     memory: 512,
  30 │     // Build/run on ARM64 so an image built on an Apple Silicon host matches
  31 │     // the Fargate runtime architecture (Graviton).
  32 │     runtimePlatform: {
  33 │       cpuArchitecture: "ARM64",
  34 │       operatingSystemFamily: "LINUX",
  35 │     },
> 36 │     taskName: "alchemy-test-ecs-tagged-oneshot",
  37 │   },
  38 │   Effect.gen(function* () {
  39 │     return {
  40 │       // One-shot entry: log the marker and exit 0.
  41 │       run: Effect.log("alchemy-tagged-oneshot-ran"),
  42 │     };
  43 │   }),
  44 │ );

0.71 packages/alchemy/test/AWS/ImageBuilder/handler.ts:74:7
  73 │     const infra = yield* ImageBuilder.InfrastructureConfiguration(
> 74 │       "BindingsInfra",
  75 │       {
  76 │         instanceProfileName: profile.instanceProfileName,
  77 │         instanceTypes: ["t3.micro"],
  78 │         terminateInstanceOnFailure: true,
  79 │       },
  80 │     );

0.71 packages/alchemy/test/AWS/InternetMonitor/handler.ts:31:5
  28 │   Effect.gen(function* () {
  29 │     // An empty monitor is cheap (no monitored resources, 1 city-network
  30 │     // cap) and still exercises the monitor-scoped grants + name injection.
> 31 │     const monitor = yield* InternetMonitor.Monitor("BindingsMonitor", {
  32 │       resources: [],
  33 │       maxCityNetworksToMonitor: 1,
  34 │     });

0.71 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:33:5
  30 │ export const ResultQueueLive = Layer.effect(
  31 │   ResultQueue,
  32 │   Effect.gen(function* () {
> 33 │     const result = yield* AWS.SQS.Queue("IoTEventSourceResultQueue");
  34 │     return { result };
  35 │   }),
  36 │ );

0.71 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:14:3
  11 │ const main = path.resolve(import.meta.dirname, "handler.ts");
  12 │
  13 │ export class IoTSiteWiseTestFunction extends Lambda.Function<Lambda.Function>()(
> 14 │   "IoTSiteWiseTestFunction",
  15 │ ) {}

0.71 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/orchestrator.ts:18:3
  17 │ export default class IsolatedOrchestrator extends AWS.Lambda.Function<IsolatedOrchestrator>()(
> 18 │   "IsolatedProjectMicrovmOrchestrator",

0.71 packages/alchemy/test/AWS/SQS/handler.ts:46:5
  43 │     // sending to the DLQ is not deterministic. Keep this separate from the
  44 │     // shared binding queue because maxReceiveCount=1 would interfere with the
  45 │     // receive/visibility tests below.
> 46 │     const moveSource = yield* SQS.Queue("BindingsMoveSource", {
  47 │       redrivePolicy: {
  48 │         deadLetterTargetArn: dlq.queueArn,
  49 │         maxReceiveCount: 1,
  50 │       },
  51 │     });

0.71 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:30:5
  27 │     const image = process.env.AWS_TEST_SAGEMAKER_IMAGE!;
  28 │     const modelData = process.env.AWS_TEST_SAGEMAKER_MODEL_DATA;
  29 │
> 30 │     const role = yield* Role("SageMakerBindingsEndpointRole", {
  31 │       assumeRolePolicyDocument: {
  32 │         Version: "2012-10-17",
  33 │         Statement: [
  34 │           {
  35 │             Effect: "Allow",
  36 │             Principal: { Service: "sagemaker.amazonaws.com" },
  37 │             Action: ["sts:AssumeRole"],
  38 │           },
  39 │         ],
  40 │       },
  41 │       managedPolicyArns: ["arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"],
  42 │     });

0.71 packages/alchemy/test/Cloudflare/AI/fixtures/Gateway.ts:3:1
  1 │ import * as Cloudflare from "@/Cloudflare/index.ts";
  2 │
> 3 │ export const Gateway = Cloudflare.AI.Gateway("Gateway", {
  4 │   cacheTtl: 60,
  5 │   collectLogs: true,
  6 │ });

0.71 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/connection.ts:16:5
  13 │ export const HyperdriveConnection = Effect.gen(function* () {
  14 │   const project = yield* Neon.Project("HyperdriveBindingProject");
  15 │   const connection = yield* Cloudflare.Hyperdrive.Connection(
> 16 │     "HyperdriveBindingConnection",
  17 │     {
  18 │       origin: project.origin,
  19 │     },
  20 │   );
  21 │   return { project, connection };
  22 │ });

0.71 packages/alchemy/test/Neon/fixtures/language-model-resources.ts:4:1
  1 │ import * as Neon from "@/Neon";
  2 │ import * as Effect from "effect/Effect";
  3 │
> 4 │ export const languageModelProject = Neon.Project("LanguageModelProject", {
  5 │   region: "aws-us-east-2",
  6 │ });
```
