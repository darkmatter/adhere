# services/test-layers-are-in-memory

A test implementation of a service must be built with Layer.sync or Layer.succeed over in-memory state, never over a real database, network, or file.

297 findings, from 0.94 down to 0.71. Each showed this hint:

```ts
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.94 packages/alchemy/test/AWS/CloudFront/kvs-handler.ts:28
     const store = yield* CloudFront.KeyValueStore("BindingsKvStore", {
0.94 packages/alchemy/test/AWS/DocDB/slow-handler.ts:48
     * Data-plane fixture: deploys a real DocumentDB cluster + instance
0.94 packages/alchemy/test/AWS/Kendra/handler.ts:481
     );
0.93 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:50
     const bucket = yield* S3.Bucket("EventsBucket", { forceDestroy: true });
0.93 packages/alchemy/test/AWS/DataExchange/handler.ts:40
     const bucket = yield* S3.Bucket("BindingBucket", { forceDestroy: true });
0.93 packages/alchemy/test/AWS/DynamoDB/handler.ts:22
     const sourceTable = yield* DynamoDB.Table("TestTable", {
0.93 packages/alchemy/test/AWS/HealthLake/handler.ts:99
     const datastore = yield* HealthLake.FHIRDatastore("BindingsStore", {
0.93 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:67
     }).pipe(Effect.provide(Keyspaces.RestoreTableHttp)),
0.93 packages/alchemy/test/AWS/Logs/handler.ts:236
     Logs.PutLogEventsHttp,
0.93 packages/alchemy/test/AWS/MedicalImaging/handler.ts:101
     yield* MedicalImaging.GetImageSetMetadata(datastore);
0.93 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/optout-handler.ts:176
     PinpointSMSVoiceV2.PutOptedOutNumberHttp,
0.93 packages/alchemy/test/AWS/RDSData/handler.ts:42
     const { secret, cluster } = yield* RDSDataInfra;
0.93 packages/alchemy/test/AWS/Textract/handler.ts:47
     const putObject = yield* S3.PutObject(bucket);
0.92 packages/alchemy/test/AWS/Athena/handler.ts:41
     const bucket = yield* S3.Bucket("AthenaBucket", { forceDestroy: true });
0.92 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:41
     const bucket = yield* S3.Bucket("kb-docs", { forceDestroy: true });
0.92 packages/alchemy/test/AWS/DAX/slow-handler.ts:25
     * Cluster-scoped binding fixture: deploys a real single-node DAX cluster
0.92 packages/alchemy/test/AWS/DocDBElastic/handler.ts:153
     DocDBElastic.ListClusterSnapshotsHttp,
0.92 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:50
     const cluster = yield* DocDBElastic.Cluster("SlowDocuments", {
0.92 packages/alchemy/test/AWS/Glue/handler.ts:182
     // Start a real (cheap pythonshell) run, read it back, then stop it —
0.92 packages/alchemy/test/AWS/LakeFormation/handler.ts:42
     const getDataLakePrincipal = yield* LakeFormation.GetDataLakePrincipal();
0.92 packages/alchemy/test/AWS/MWAA/bindings-handler.ts:158
     const environment = yield* AWS.MWAA.Environment("BindingsAirflow", {
0.92 packages/alchemy/test/AWS/Personalize/handler.ts:421
     Personalize.UpdateCampaignHttp,
0.92 packages/alchemy/test/AWS/Transfer/handler.ts:47
     const server = yield* Transfer.Server("BindingsServer", {
0.92 packages/alchemy/test/Planetscale/MySQL/fixtures/Stack.ts:23
     const database = yield* Planetscale.MySQLDatabase("MySQLHyperdriveTestDb", {
0.91 packages/alchemy/src/AWS/B2BI/TestConversionHttp.ts:6
     export const TestConversionHttp = Layer.effect(
0.91 packages/alchemy/src/AWS/B2BI/TestParsingHttp.ts:6
     export const TestParsingHttp = Layer.effect(
0.91 packages/alchemy/test/AWS/B2BI/handler.ts:112
     Effect.gen(function* () {
0.91 packages/alchemy/test/AWS/CloudFront/handler.ts:38
     const bucket = yield* S3.Bucket("InvalidationOriginBucket", {
0.91 packages/alchemy/test/AWS/EMR/slow-handler.ts:18
     * Cluster-scoped binding fixture: deploys a real single-node Spark cluster
0.91 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:208
     IoTSiteWise.DescribeAssetHttp,
0.91 packages/alchemy/test/AWS/Keyspaces/streams-handler.ts:22
     const keyspace = yield* Keyspaces.Keyspace("StreamsKs", {
0.91 packages/alchemy/test/AWS/KinesisVideo/handler.ts:301
     AWS.KinesisVideo.GetDASHStreamingSessionURLHttp,
0.91 packages/alchemy/test/AWS/MediaTailor/handler.ts:37
     yield* MediaTailor.CreatePrefetchSchedule(config);
0.91 packages/alchemy/test/AWS/MemoryDB/bindings-handler.ts:173
     MemoryDB.DescribeClustersHttp,
0.91 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:99
     NotificationsContacts.GetEmailContactHttp,
0.91 packages/alchemy/test/AWS/S3Vectors/vectors-handler.ts:23
     const bucket = yield* S3Vectors.VectorBucket("VBucket", {});
0.91 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:103
     SageMaker.DescribeEndpointHttp,
0.91 packages/alchemy/test/AWS/SageMaker/handler.ts:160
     SageMaker.PutRecordHttp,
0.91 packages/alchemy/test/AWS/Signer/handler.ts:53
     const profile = yield* Signer.SigningProfile("BindingsProfile", {
0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:38
     const tasks = yield* Cloudflare.R2.ReadWriteBucket(Bucket);
0.91 packages/alchemy/test/Planetscale/Postgres/fixtures/Stack.ts:24
     const database = yield* Planetscale.PostgresDatabase("HyperdriveTestDb", {
0.90 packages/alchemy/test/AWS/CloudControl/handler.ts:321
     CloudControl.UpdateResourceHttp,
0.90 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:47
     const store = yield* CloudTrail.EventDataStore("BindingsLake", {
0.90 packages/alchemy/test/AWS/CodePipeline/handler.ts:523
     S3.PutObjectHttp,
0.90 packages/alchemy/test/AWS/DocDB/handler.ts:188
     DocDB.DescribeDBClustersHttp,
0.90 packages/alchemy/test/AWS/ECR/handler.ts:341
     ECR.GetAuthorizationTokenHttp,
0.90 packages/alchemy/test/AWS/Forecast/handler.ts:301
     Forecast.GetAccuracyMetricsHttp,
0.90 packages/alchemy/test/AWS/MailManager/handler.ts:147
     MailManager.RegisterMemberToAddressListHttp,
0.90 packages/alchemy/test/AWS/Route53Domains/handler.ts:215
     Route53Domains.CheckDomainAvailabilityHttp,
0.90 packages/alchemy/test/AWS/Route53Profiles/handler.ts:79
     Route53Profiles.ListProfileAssociationsHttp,
0.90 packages/alchemy/test/AWS/S3/fixtures/head-object-handler.ts:14
     const bucket = yield* S3.Bucket("HeadObjectBucket", {
0.90 packages/alchemy/test/AWS/SQS/handler.ts:53
     const sendMessage = yield* SQS.SendMessage(queue);
0.90 packages/alchemy/test/Cloudflare/AnalyticsEngine/fixtures/worker.ts:13
     const analytics = yield* Cloudflare.AnalyticsEngine.WriteDataset(Dataset);
0.90 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/local-worker.ts:35
     const sql = yield* SQL.Postgres({ url: hd.connectionString });
0.90 packages/alchemy/test/Cloudflare/Workflows/fixtures/workflow-worker.ts:21
     const results = yield* Cloudflare.R2.ReadWriteBucket(bucket);
0.89 packages/alchemy/src/AWS/EventBridge/TestEventPatternHttp.ts:12
     export const TestEventPatternHttp = Layer.effect(
0.89 packages/alchemy/test/AWS/CodeArtifact/handler.ts:440
     S3.PutObjectHttp,
0.89 packages/alchemy/test/AWS/Cognito/handler.ts:422
     Cognito.UserPoolAdminHttp,
0.89 packages/alchemy/test/AWS/DataSync/handler.ts:69
     const src = yield* S3.Bucket("BindingsSrc", { forceDestroy: true });
0.89 packages/alchemy/test/AWS/ElastiCache/handler.ts:32
     const cache = yield* AWS.ElastiCache.ServerlessCache("FixtureCache", {
0.89 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:198
     Grafana.AssociateLicenseHttp,
0.89 packages/alchemy/test/AWS/IAM/handler.ts:301
     IAM.GetAccountSummaryHttp,
0.89 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:31
     const graph = yield* NeptuneGraph.Graph("FixtureGraph", {
0.89 packages/alchemy/test/AWS/QBusiness/handler.ts:578
     QBusiness.BatchPutDocumentHttp,
0.89 packages/alchemy/test/AWS/RedshiftServerless/fixtures/snapshot-handler.ts:124
     RedshiftServerless.CreateSnapshotHttp,
0.89 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:22
     const presignGetObject = yield* S3.PresignGetObject(bucket);
0.89 packages/alchemy/test/Cloudflare/Workflows/fixtures/test-workflow.ts:30
     const results = yield* Cloudflare.R2.ReadWriteBucket(bucket);
0.89 packages/alchemy/test/Git/fixtures/s3-stack.ts:27
     export const GitObjects = AWS.S3.Bucket("GitS3Objects", { forceDestroy: true });
0.88 packages/alchemy/src/AWS/IoTWireless/TestWirelessDeviceHttp.ts:9
     export const TestWirelessDeviceHttp = Layer.effect(
0.88 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:87
     yield* ACMPCA.consumeCertificateAuthorityEvents(
0.88 packages/alchemy/test/AWS/AIOps/fixtures/handler.ts:120
     AIOps.GetInvestigationGroupHttp,
0.88 packages/alchemy/test/AWS/ApplicationAutoScaling/handler.ts:38
     const table = yield* Table("BindingsTable", {
0.88 packages/alchemy/test/AWS/BackupSearch/handler.ts:97
     BackupSearch.ListSearchJobResultsHttp,
0.88 packages/alchemy/test/AWS/Chatbot/handler.ts:256
     Chatbot.GetAccountPreferencesHttp,
0.88 packages/alchemy/test/AWS/CloudTrail/handler.ts:46
     const bucket = yield* S3.Bucket("CloudTrailEvents", {
0.88 packages/alchemy/test/AWS/CostAndUsageReport/handler.ts:119
     CostAndUsageReport.DescribeReportDefinitionsHttp,
0.88 packages/alchemy/test/AWS/DAX/handler.ts:78
     Layer.mergeAll(DAX.DescribeClustersHttp, DAX.DescribeEventsHttp),
0.88 packages/alchemy/test/AWS/EntityResolution/handler.ts:81
     const database = yield* Glue.Database("ErBindingsDb", {});
0.88 packages/alchemy/test/AWS/GeoPlaces/handler.ts:155
     GeoPlaces.AutocompleteHttp,
0.88 packages/alchemy/test/AWS/GlobalAccelerator/handler.ts:43
     const accelerator = yield* GlobalAccelerator.Accelerator(
0.88 packages/alchemy/test/AWS/IoTWireless/fixtures/handler.ts:45
     const result = yield* AWS.SQS.Queue("IoTWirelessUplinkResultQueue");
0.88 packages/alchemy/test/AWS/Pricing/handler.ts:146
     Pricing.GetProductsHttp,
0.88 packages/alchemy/test/AWS/QApps/bindings-handler.ts:158
     AWS.QApps.StartQAppSessionHttp,
0.88 packages/alchemy/test/AWS/Rekognition/handler.ts:56
     const compareFaces = yield* Rekognition.CompareFaces();
0.88 packages/alchemy/test/AWS/S3/fixtures/presign-get-only-handler.ts:14
     const bucket = yield* S3.Bucket("PresignGetOnlyBucket", {
0.88 packages/alchemy/test/AWS/SSM/handler.ts:194
     SSM.GetParameterHttp,
0.88 packages/alchemy/test/AWS/SSMIncidents/handler.ts:259
     SSMIncidents.StartIncidentHttp,
0.88 packages/alchemy/test/AWS/SecretsManager/handler.ts:325
     Lambda.SecretRotationEventSource,
0.88 packages/alchemy/test/AWS/SimpleDB/handler.ts:21
     const domain = yield* SimpleDB.Domain("BindingsDomain", {});
0.88 packages/alchemy/test/AWS/Translate/handler.ts:118
     const putObject = yield* S3.PutObject(bucket);
0.88 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:20
     const client = yield* HttpClient.HttpClient;
0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/db.ts:37
     url: branch.connectionUri,
0.88 packages/alchemy/test/Git/fixtures/stack.ts:42
     const GitObjects = Cloudflare.R2.Bucket("GitObjects", {
0.88 packages/alchemy/test/SQL/exercise.ts:61
     * `fixtures/routes.ts`) against one deployed worker. Covers, in order:
0.87 packages/alchemy/src/AWS/DMS/TestConnectionHttp.ts:6
     export const TestConnectionHttp = Layer.effect(
0.87 packages/alchemy/src/AWS/Route53/TestDNSAnswerHttp.ts:6
     export const TestDNSAnswerHttp = Layer.effect(
0.87 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:190
     AppConfig.GetConfigurationHttp,
0.87 packages/alchemy/test/AWS/AppRunner/fixtures/handler.ts:32
     const service = yield* AppRunner.Service("BindingsService", {
0.87 packages/alchemy/test/AWS/BCMDataExports/handler.ts:34
     const bucket = yield* Bucket("BindingsExportDest", {
0.87 packages/alchemy/test/AWS/BedrockDataAutomation/handler.ts:421
     BDA.CreateBlueprintVersionHttp,
0.87 packages/alchemy/test/AWS/CloudWatch/handler.ts:465
     CloudWatch.PutMetricDataHttp,
0.87 packages/alchemy/test/AWS/Comprehend/handler.ts:607
     yield* putObject({
0.87 packages/alchemy/test/AWS/DirectoryService/handler.ts:73
     DirectoryService.GetDirectoryLimitsHttp,
0.87 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:42
     const cluster = yield* EKS.Cluster("BindingsCluster", {
0.87 packages/alchemy/test/AWS/Geo/handler.ts:168
     GeoPlaces.SearchTextHttp,
0.87 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:1
     import * as IVSRealtime from "@/AWS/IVSRealtime";
0.87 packages/alchemy/test/AWS/IoTManagedIntegrations/bindings-handler.ts:293
     IoTManagedIntegrations.SendConnectorEventHttp,
0.87 packages/alchemy/test/AWS/Location/handler.ts:500
     Location.StartJobHttp,
0.87 packages/alchemy/test/AWS/MediaConnect/fixtures/handler.ts:248
     MediaConnect.DescribeFlowHttp,
0.87 packages/alchemy/test/AWS/MediaConvert/handler.ts:185
     MediaConvert.CreateJobHttp,
0.87 packages/alchemy/test/AWS/MediaPackageV2/fixtures/handler.ts:58
     yield* S3.Bucket("HarvestBucket", {
0.87 packages/alchemy/test/AWS/RedshiftData/fixtures/data-api-handler.ts:36
     const namespace = yield* RedshiftServerless.Namespace("DataApiNamespace", {
0.87 packages/alchemy/test/AWS/SecurityHub/handler.ts:401
     SecurityHub.ListFindingAggregatorsHttp,
0.87 packages/alchemy/test/AWS/Transcribe/handler.ts:502
     Transcribe.StartTranscriptionJobHttp,
0.87 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:19
     }).pipe(remote());
0.87 packages/alchemy/test/Git/fixtures/lambda-stack.ts:35
     Layer.provide(AWS.Lambda.InvokeFunctionHttp),
0.86 packages/alchemy/test/AWS/AICapabilities/handler.ts:130
     Rekognition.DetectLabelsHttp,
0.86 packages/alchemy/test/AWS/AuditManager/handler-assessment.ts:198
     AuditManager.GetEvidenceHttp,
0.86 packages/alchemy/test/AWS/CloudMap/handler.ts:245
     AWS.CloudMap.DiscoverInstancesHttp,
0.86 packages/alchemy/test/AWS/DataBrew/handler.ts:40
     const bucket = yield* S3.Bucket("DataBrewBindingsBucket", {
0.86 packages/alchemy/test/AWS/Deadline/handler.ts:43
     const farm = yield* Deadline.Farm("BindingsFarm", {
0.86 packages/alchemy/test/AWS/GeoMaps/handler.ts:130
     GeoMaps.GetStaticMapHttp,
0.86 packages/alchemy/test/AWS/GeoRoutes/handler.ts:157
     GeoRoutes.CalculateRoutesHttp,
0.86 packages/alchemy/test/AWS/IdentityCenter/handler.ts:341
     IdentityCenter.DeleteUserHttp,
0.86 packages/alchemy/test/AWS/LexV2/handler.ts:230
     LexV2.RecognizeTextHttp,
0.86 packages/alchemy/test/AWS/OpenSearch/fixtures/handler.ts:365
     OpenSearch.DescribeDomainHttp,
0.86 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/phone-handler.ts:155
     PinpointSMSVoiceV2.SendTextMessageHttp,
0.86 packages/alchemy/test/AWS/Polly/handler.ts:47
     export const PollyFixturesLive = Layer.effect(
0.86 packages/alchemy/test/AWS/RDS/fixtures/handler.ts:254
     RDS.DescribeDBClustersHttp,
0.86 packages/alchemy/test/AWS/Scheduler/handler.ts:35
     const sinkQueue = yield* SQS.Queue("SchedulerSinkQueue");
0.86 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:401
     ),
0.86 packages/alchemy/test/AWS/Timestream/handler.ts:23
     const database = yield* Timestream.Database("Metrics");
0.86 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-database.ts:25
     return yield* Cloudflare.D1.Database("D1DrizzleDatabase", {
0.86 packages/alchemy/test/Git/fixtures/loader-stack.ts:24
     const GitObjects = Cloudflare.R2.Bucket("GitLoaderObjects", {
0.86 packages/alchemy/test/Local/fixtures/rpc-spawner-commands.ts:79
     yield* Effect.never;
0.85 packages/alchemy/src/AWS/B2BI/TestMappingHttp.ts:6
     export const TestMappingHttp = Layer.effect(
0.85 packages/alchemy/src/AWS/Macie2/TestCustomDataIdentifierHttp.ts:6
     export const TestCustomDataIdentifierHttp = Layer.effect(
0.85 packages/alchemy/test/AWS/ApiGateway/TestLease.ts:54
     const fs = yield* FileSystem.FileSystem;
0.85 packages/alchemy/test/AWS/Batch/handler.ts:186
     Batch.SubmitJobHttp,
0.85 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:220
     CloudHSMV2.DescribeClustersHttp,
0.85 packages/alchemy/test/AWS/ElastiCache/ProvisionedFixture.ts:37
     const network = yield* AWS.EC2.Network("Network", {
0.85 packages/alchemy/test/AWS/ElastiCache/bindings-handler.ts:163
     ElastiCache.DescribeServerlessCachesHttp,
0.85 packages/alchemy/test/AWS/GuardDuty/handler.ts:321
     GuardDuty.DescribeOrganizationConfigurationHttp,
0.85 packages/alchemy/test/AWS/IVS/fixtures/handler.ts:230
     IVS.GetStreamHttp,
0.85 packages/alchemy/test/AWS/Inspector2/handler.ts:344
     Inspector2.AssociateMemberHttp,
0.85 packages/alchemy/test/AWS/KinesisAnalyticsV2/handler.ts:61
     yield* KinesisAnalyticsV2.DescribeApplication(app);
0.85 packages/alchemy/test/AWS/Lambda/bindings-handler.ts:125
     Lambda.InvokeFunctionHttp,
0.85 packages/alchemy/test/AWS/MWAAServerless/handler.ts:58
     const role = yield* IAM.Role("WorkflowRole", {
0.85 packages/alchemy/test/AWS/MediaLive/fixtures/channel-handler.ts:251
     MediaLive.DescribeChannelHttp,
0.85 packages/alchemy/test/AWS/MediaLive/fixtures/handler.ts:99
     MediaLive.DescribeInputHttp,
0.85 packages/alchemy/test/AWS/Notifications/handler.ts:247
     Notifications.GetNotificationEventHttp,
0.85 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/db.ts:15
     const database = yield* PostgresDatabase("PlanetscaleHostDb", {
0.85 packages/alchemy/test/Cloudflare/R2/fixtures/bucket.ts:10
     export const TestBucket = Cloudflare.R2.Bucket("R2BindingTestBucket", {
0.85 packages/alchemy/test/Cloudflare/Website/fixtures/astro-app/src/pages/api/kv.ts:8
     * env — a REAL KV namespace bound via `env: { SITE_KV: ... }` in the test
0.85 packages/alchemy/test/Railway/suiteProject.ts:125
     }).pipe(Effect.provide(fromAuthProvider().pipe(Layer.provide(RailwayAuth))));
0.84 packages/alchemy/test/AWS/AppIntegrations/fixtures/handler.ts:30
     const bucket = yield* Bucket("BindingsContent", { forceDestroy: true });
0.84 packages/alchemy/test/AWS/Budgets/handler.ts:229
     Budgets.DescribeBudgetHttp,
0.84 packages/alchemy/test/AWS/CloudFormation/handler.ts:230
     CloudFormation.DescribeStacksHttp,
0.84 packages/alchemy/test/AWS/CodeDeploy/handler.ts:1
     import * as CodeDeploy from "@/AWS/CodeDeploy";
0.84 packages/alchemy/test/AWS/DataZone/handler.ts:197
     DataZone.SearchHttp,
0.84 packages/alchemy/test/AWS/EKS/handler.ts:129
     EKS.ListClustersHttp,
0.84 packages/alchemy/test/AWS/EventBridge/handler.ts:43
     const customQueue = yield* AWS.SQS.Queue("CustomBusSink");
0.84 packages/alchemy/test/AWS/Kafka/kafka-handler.ts:48
     export const FixtureClusterLive = Layer.effect(
0.84 packages/alchemy/test/AWS/Neptune/fixtures/handler.ts:214
     Neptune.DescribeDBClustersHttp,
0.84 packages/alchemy/test/AWS/Redshift/fixtures/bindings-handler.ts:141
     Redshift.DescribeClustersHttp,
0.84 packages/alchemy/test/AWS/SNS/platform-handler.ts:28
     export const PlatformFixtureLive = Layer.effect(
0.84 packages/alchemy/test/AWS/ServiceQuotas/handler.ts:206
     ServiceQuotas.GetServiceQuotaHttp,
0.84 packages/alchemy/test/AWS/VerifiedPermissions/handler.ts:23
     const store = yield* AWS.VerifiedPermissions.PolicyStore("Store", {
0.84 packages/alchemy/test/Cloudflare/Dns/fixtures/effect.ts:23
     const dns = yield* Cloudflare.DNS.ReadWriteDns(Zone);
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:35
     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
0.84 packages/alchemy/test/Neon/fixtures/connect-handler.ts:19
     const pooled = yield* Postgres({ url: branch.connectionString });
0.83 packages/alchemy/test/AWS/AMP/handler.ts:154
     AMP.RemoteWriteHttp,
0.83 packages/alchemy/test/AWS/AuditManager/handler.ts:81
     const result = yield* getAccountStatus();
0.83 packages/alchemy/test/AWS/ComprehendMedical/handler.ts:311
     ComprehendMedical.StartPHIDetectionJobHttp,
0.83 packages/alchemy/test/AWS/Detective/handler.ts:294
     Detective.UpdateDatasourcePackagesHttp,
0.83 packages/alchemy/test/AWS/EC2/fixtures/client-vpn.ts:49
     const imported = yield* acm.importCertificate({
0.83 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:301
     FraudDetector.UpdateEventLabelHttp,
0.83 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:152
     IVSChat.CreateChatTokenHttp,
0.83 packages/alchemy/test/AWS/LicenseManager/handler.ts:325
     LicenseManager.ListResourceInventoryHttp,
0.83 packages/alchemy/test/AWS/OSIS/handler.ts:146
     OSIS.ValidatePipelineHttp,
0.83 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:159
     AOSS.GetCollectionHttp,
0.83 packages/alchemy/test/AWS/RAM/handler.ts:255
     RAM.AcceptResourceShareInvitationHttp,
0.83 packages/alchemy/test/AWS/Rbin/handler.ts:76
     }).pipe(Effect.provide(Layer.mergeAll(Rbin.GetRuleHttp, Rbin.ListRulesHttp))),
0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/worker.ts:27
     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
0.82 packages/alchemy/src/AWS/SES/RenderEmailTemplateHttp.ts:6
     export const RenderEmailTemplateHttp = Layer.effect(
0.82 packages/alchemy/src/AWS/StepFunctions/TestStateHttp.ts:6
     export const TestStateHttp = Layer.effect(
0.82 packages/alchemy/test/AWS/ACM/handler.ts:217
     ACM.DescribeCertificateHttp,
0.82 packages/alchemy/test/AWS/AppRegistry/handler.ts:216
     AppRegistry.GetApplicationHttp,
0.82 packages/alchemy/test/AWS/ApplicationSignals/handler.ts:302
     ApplicationSignals.ListServicesHttp,
0.82 packages/alchemy/test/AWS/CodeBuild/handler.ts:441
     CodeBuild.StartBuildBatchHttp,
0.82 packages/alchemy/test/AWS/ControlTower/handler.ts:303
     ControlTower.ListBaselinesHttp,
0.82 packages/alchemy/test/AWS/DMS/handler.ts:62
     yield* DMS.consumeReplicationEvents({ kinds: ["task-state"] }, (events) =>
0.82 packages/alchemy/test/AWS/EMRContainers/handler.ts:46
     entryPoint: "s3://alchemy-test-emrc/scripts/etl.py",
0.82 packages/alchemy/test/AWS/EMRServerless/handler.ts:301
     EMRServerless.GetResourceDashboardHttp,
0.82 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:105
     const valkey = yield* AWS.ElastiCache.ReplicationGroup("Valkey", {
0.82 packages/alchemy/test/AWS/Macie2/handler.ts:361
     Macie2.DescribeOrganizationConfigurationHttp,
0.82 packages/alchemy/test/AWS/SES/handler.ts:443
     );
0.82 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:130
     const child = spawn(
0.82 packages/alchemy/test/Local/fixtures/rpc-spawner-devserver-parent.ts:84
     const content = yield* fs.readFileString(pidFile);
0.82 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:56
     const sql = yield* SQL.Postgres({ url: hd.connectionString });
0.81 packages/alchemy/test/AWS/Bedrock/handler.ts:62
     const invokeModel = yield* Bedrock.InvokeModel(MODEL);
0.81 packages/alchemy/test/AWS/BedrockAgentCore/handler.ts:361
     AgentCore.BatchCreateMemoryRecordsHttp,
0.81 packages/alchemy/test/AWS/CodeConnections/handler.ts:106
     CodeConnections.GetConnectionHttp,
0.81 packages/alchemy/test/AWS/EC2/fixtures/bindings-handler.ts:92
     export const BindingsFleetLive = Layer.effect(
0.81 packages/alchemy/test/AWS/ECRPublic/handler.ts:246
     ECRPublic.DescribeImagesHttp,
0.81 packages/alchemy/test/AWS/EMR/handler.ts:116
     EMR.ListClustersHttp,
0.81 packages/alchemy/test/AWS/IoTFleetWise/bindings-handler.ts:303
     IoTFleetWise.BatchCreateVehicleHttp,
0.81 packages/alchemy/test/AWS/MQ/bindings-handler.ts:25
     const broker = yield* MQ.Broker("BindingsBroker", {
0.81 packages/alchemy/test/AWS/OpenSearch/data-plane-handler.ts:23
     * (`DomainRead` / `DomainWrite` / `DomainReadWrite`) against a real domain.
0.81 packages/alchemy/test/AWS/Organizations/handler.ts:702
     Organizations.DescribeOrganizationHttp,
0.81 packages/alchemy/test/AWS/SNS/handler.ts:41
     const queueSubscription = yield* AWS.SNS.Subscription(
0.81 packages/alchemy/test/AWS/Schemas/handler.ts:74
     const bus = yield* EventBus("BindingsBus", {});
0.81 packages/alchemy/test/Cloudflare/Email/fixtures/local-worker.ts:22
     Cloudflare.Email.SendEmail("LIVE_EMAIL").pipe(remote()),
0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/email-worker.ts:176
     Effect.provide(Cloudflare.EmailEventSourceLive),
0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/object.ts:97
     ? Effect.never
0.81 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:129
     Effect.provide(FetchHttpClient.layer),
0.81 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:79
     }).pipe(Effect.provide(Layer.mergeAll(Cloudflare.Hyperdrive.ConnectBinding))),
0.80 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:92
     AWS.CloudWatch.PutMetricDataHttp,
0.80 packages/alchemy/test/AWS/DLM/handler.ts:99
     DLM.GetLifecyclePolicyHttp,
0.80 packages/alchemy/test/AWS/FMS/handler.ts:321
     FMS.DeletePolicyHttp,
0.80 packages/alchemy/test/AWS/NetworkFirewall/firewall-handler.ts:31
     const vpc = yield* Vpc("BindingsVpc", {
0.80 packages/alchemy/test/AWS/OAM/TestLease.ts:49
     const fs = yield* FileSystem.FileSystem;
0.80 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:83
     RolesAnywhere.GetSubjectHttp,
0.80 packages/alchemy/test/AWS/SecretsManager/fixtures/get-secret-only-handler.ts:68
     }).pipe(Effect.provide(SecretsManager.GetSecretValueHttp)),
0.80 packages/alchemy/test/AWS/SocialMessaging/bindings-handler.ts:289
     SocialMessaging.PublishWhatsAppFlowHttp,
0.80 packages/alchemy/test/AWS/Transfer/workflow-handler.ts:81
     Layer.mergeAll(Lambda.EventSource, Transfer.SendWorkflowStepStateHttp),
0.80 packages/alchemy/test/Cloudflare/Email/fixtures/sender.ts:9
     * real `.send()` round-trip against Cloudflare.
0.80 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/remote-worker.ts:14
     * the real Neon database fronted by the real config.
0.80 packages/alchemy/test/Cloudflare/Queue/round-trip-worker.ts:14
     export class Counter extends Cloudflare.DurableObject<Counter>()(
0.80 packages/alchemy/test/Neon/fixtures/StorageHttpHandler.ts:46
     }).pipe(Effect.provide(Layer.mergeAll(ReadWriteBucketHttp, ReadBucketHttp)));
0.80 packages/cloudflare-runtime/src/core/test/helpers/runtime.ts:65
     Layer.provide(Internet.InternetLive),
0.80 packages/cloudflare-runtime/src/core/test/sandbox.ts:21
     bindings: [KvNamespace.remote("TEST", "ff74cfc28c744cdfb77664ff07050b13")],
0.79 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:339
     AccessAnalyzer.StartPolicyGenerationHttp,
0.79 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:264
     Amplify.CreateDeploymentHttp,
0.79 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:41
     const pool = yield* Cognito.UserPool("TriggerUserPool", {
0.79 packages/alchemy/test/AWS/ImageBuilder/handler.ts:361
     ImageBuilder.StartImagePipelineExecutionHttp,
0.79 packages/alchemy/test/AWS/Route53/bindings-handler.ts:251
     Route53.ChangeResourceRecordSetsHttp,
0.79 packages/alchemy/test/Cloudflare/Vectorize/fixtures/effect-worker.ts:28
     const vec = yield* Cloudflare.Vectorize.SearchIndex(index);
0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/tail/streaming-tail-consumer.ts:69
     await env.EVENTS.put(`evt:${id}:${Date.now()}`, JSON.stringify(events));
0.79 packages/cloudflare-runtime/src/core/globals/LoopbackServer.ts:43
     export const LoopbackServerLive = Layer.effect(
0.78 packages/alchemy/test/AWS/Account/handler.ts:156
     Account.GetAccountInformationHttp,
0.78 packages/alchemy/test/AWS/Config/handler.ts:387
     Config.GetResourceConfigHistoryHttp,
0.78 packages/alchemy/test/AWS/OAM/handler.ts:59
     }).pipe(Effect.provide(OAM.ListAttachedLinksHttp)),
0.78 packages/alchemy/test/AWS/ResourceExplorer/handler.ts:85
     ResourceExplorer.SearchHttp,
0.78 packages/alchemy/test/Cloudflare/Stream/fixtures/local-worker.ts:4
     // (piped through `Alchemy.remote()`) against the real Stream service via the
0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/cron/cron-worker.ts:70
     }).pipe(Effect.provide(Cloudflare.Workers.CronEventSourceLive)),
0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/db.ts:38
     return yield* Cloudflare.Hyperdrive.Connection("DrizzleWorkflowEdge", {
0.77 packages/alchemy/test/AWS/Backup/handler.ts:341
     Backup.StartRestoreJobHttp,
0.77 packages/alchemy/test/AWS/FIS/handler.ts:227
     FIS.StartExperimentHttp,
0.77 packages/alchemy/test/AWS/GreengrassV2/handler.ts:341
     GreengrassV2.GetComponentHttp,
0.77 packages/alchemy/test/AWS/LicenseManager/seller-handler.ts:321
     LicenseManager.CreateGrantVersionHttp,
0.77 packages/alchemy/test/AWS/Smoke/fixtures/api-handler.ts:53
     const admin = yield* AWS.Cognito.UserPoolAdmin(pool);
0.77 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:44
     enableInternet: true,
0.77 packages/alchemy/test/Cloudflare/R2/fixtures/r2-local-worker.ts:1
     // Async (non-Effect) Worker that exercises the native R2 binding against
0.77 packages/alchemy/test/Cloudflare/Utils/Worker.ts:1
     import * as workers from "@distilled.cloud/cloudflare/workers";
0.77 packages/alchemy/test/Prisma/fixtures/read-compute.ts:34
     }).pipe(Effect.provide(ReadBucketBinding)),
0.76 packages/alchemy/test/AWS/FSx/bindings-handler.ts:241
     FSx.DescribeBackupsHttp,
0.76 packages/alchemy/test/AWS/VpcLattice/handler.ts:94
     VpcLattice.ListTargetsHttp,
0.76 packages/alchemy/test/AWS/XRay/handler.ts:361
     XRay.PutTraceSegmentsHttp,
0.76 packages/alchemy/test/Fly/fixtures/process-death.ts:62
     // SDK transport failures can retain headers; never persist or print those objects.
0.75 packages/alchemy/src/AWS/Transfer/TestIdentityProviderHttp.ts:7
     export const TestIdentityProviderHttp = Layer.effect(
0.75 packages/alchemy/test/AWS/KinesisAnalyticsV2/code-bucket.ts:28
     * (`Effect.orDie`), so the error channel is `never` and this is a valid
0.75 packages/alchemy/test/AWS/Lambda/fixtures/otel-collector-worker.ts:10
     const items = (await this.ctx.storage.get<unknown[]>("items")) ?? [];
0.75 packages/alchemy/test/AWS/ResourceGroups/handler.ts:228
     ResourceGroups.ListGroupResourcesHttp,
0.75 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:79
     enableInternet: true,
0.75 packages/frontend-frameworks/fixtures/nuxt/server/api/kv.ts:3
     // the host's workerd instance), the live suite over miniflare's KV.
0.74 packages/alchemy/src/AWS/Local/FlociServices.ts:62
     Layer.effectDiscard(Floci.ensureFloci({ port: Floci.DEFAULT_FLOCI_PORT })),
0.74 packages/alchemy/test/AWS/ECS/handler.ts:234
     ECS.RunTaskHttp,
0.74 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:118
     const targetGroup = yield* TargetGroup("ElbBindingsTg", {
0.74 packages/alchemy/test/AWS/Glacier/bindings-handler.ts:249
     Glacier.DescribeVaultHttp,
0.74 packages/alchemy/test/AWS/KMS/handler.ts:84
     const getKeyRotationStatus = yield* kms.getKeyRotationStatus;
0.74 packages/alchemy/test/AWS/RePostSpace/bindings-handler.ts:222
     RePostSpace.SendInvitesHttp,
0.74 packages/alchemy/test/Cloudflare/Container/fixtures/restart/object.ts:41
     enableInternet: true,
0.74 packages/alchemy/test/Cloudflare/KV/fixtures/namespace.ts:9
     export const TestNamespace = Cloudflare.KV.Namespace("KVBindingTestNamespace");
0.74 packages/alchemy/test/Cloudflare/Queue/fixtures/dedicated-consumer-worker.ts:70
     }).pipe(Effect.provide(Cloudflare.Queues.EventSourceLive)),
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-collector-worker.ts:10
     const items = (await this.ctx.storage.get<unknown[]>("items")) ?? [];
0.74 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:36
     const table = yield* AWS.DynamoDB.Table("EksHostTable", {
0.74 packages/alchemy/test/State/destroy-consistency-repro.ts:44
     const bucket = yield* Bucket(`bucket`, { name: `repro-${fileIdx}` });
0.73 packages/alchemy/test/AWS/PaymentCryptography/handler.ts:362
     PaymentCryptography.GetPublicKeyCertificateHttp,
0.73 packages/alchemy/test/AWS/RDSData/drizzle-iam-handler.ts:31
     *   the pool dials the cluster endpoint over a real socket per execution.
0.73 packages/alchemy/test/AWS/WAFv2/handler.ts:321
     WAFv2.UpdateIPSetHttp,
0.73 packages/alchemy/test/Cloudflare/Tunnel/fixtures/effect.ts:103
     Cloudflare.Tunnel.ReadTunnelBinding,
0.73 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:45
     const response = yield* client.execute(
0.73 packages/alchemy/test/Neon/FunctionRollout.ts:72
     const response = yield* HttpClient.get(url, {
0.73 packages/alchemy/test/SQL/fixtures/routes.ts:54
     ): Effect.Effect<LayerUsers, never, Sql.SqlClient> =>
0.73 packages/better-auth/test/AWS/fixtures/aurora-handler.ts:38
     const AuthDatabase = AuroraDataApi(Db, { database: "postgres" });
0.72 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:33
     const result = yield* AWS.SQS.Queue("IoTEventSourceResultQueue");
0.72 packages/alchemy/test/AWS/StepFunctions/handler.ts:509
     SQS.ReceiveMessageHttp,
0.72 packages/alchemy/test/Cloudflare/Artifacts/fixtures/async-worker.ts:17
     const repo = await repos.create(name, { setDefaultBranch: "main" });
0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:15
     ctx.storage.sql.exec(`
0.72 packages/alchemy/test/Prisma/fixtures/bucket.ts:25
     return yield* Bucket("PrismaBucketBindingTestBucket", { project });
0.72 packages/alchemy/test/Prisma/fixtures/write-compute.ts:34
     }).pipe(Effect.provide(WriteBucketBinding)),
0.71 packages/alchemy/test/AWS/Shield/handler.ts:182
     Shield.GetSubscriptionStateHttp,
0.71 packages/alchemy/test/Cloudflare/D1/fixtures/database.ts:9
     export const TestDatabase = Cloudflare.D1.Database("D1BindingDatabase");
0.71 packages/alchemy/test/Cloudflare/Queue/fixtures/queue.ts:9
     export const TestQueue = Cloudflare.Queues.Queue("QueueBindingTestQueue");
0.71 packages/alchemy/test/Planetscale/MySQL/fixtures/hyperdrive-worker.ts:24
     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
0.71 packages/alchemy/test/Prisma/fixtures/readwrite-compute.ts:29
     const store = yield* ReadWriteBucket(bucket);
```
