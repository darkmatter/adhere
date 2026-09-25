# effect/services/test-layers-are-in-memory

A test implementation of a service should be built with Layer.sync or Layer.succeed over in-memory state, and should not reach a real database, network, or file. Integration tests that exercise the real service are not in scope.

258 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.91 packages/alchemy/test/AWS/DynamoDB/handler.ts:22:5
  21 │   Effect.gen(function* () {
> 22 │     const sourceTable = yield* DynamoDB.Table("TestTable", {
  23 │       partitionKey: "pk",
  24 │       sortKey: "sk",
  25 │       attributes: {
  26 │         pk: "S",
  27 │         sk: "S",
  28 │         category: "S",
  29 │         subcategory: "S",
  30 │         rank: "S",
  31 │       },
  32 │       globalSecondaryIndexes: [
  33 │         {
  34 │           // Multi-attribute keys: composite partition key (category +
  35 │           // subcategory) and composite sort key (rank + sk). Sparse — only
  36 │           // items written with all four attributes appear in the index.
  37 │           indexName: "MultiAttrIndex",
  38 │           partitionKey: ["category", "subcategory"],
  39 │           sortKey: ["rank", "sk"],
  40 │           projection: { ProjectionType: "ALL" },
  41 │         },
  42 │       ],
  43 │     });

0.90 packages/alchemy/test/AWS/DocDBElastic/handler.ts:153:9
  151 │     Effect.provide(
  152 │       Layer.mergeAll(
> 153 │         DocDBElastic.ListClusterSnapshotsHttp,
  154 │         DocDBElastic.GetClusterSnapshotHttp,
  155 │         DocDBElastic.DeleteClusterSnapshotHttp,
  156 │         DocDBElastic.CopyClusterSnapshotHttp,
  157 │         DocDBElastic.RestoreClusterFromSnapshotHttp,
  158 │         DocDBElastic.ListPendingMaintenanceActionsHttp,
  159 │         DocDBElastic.GetPendingMaintenanceActionHttp,
  160 │         DocDBElastic.ApplyPendingMaintenanceActionHttp,
  161 │       ),
  162 │     ),

0.90 packages/alchemy/test/AWS/Textract/handler.ts:47:5
  44 │     // Seeding route writes the input object; Textract's async Start* APIs
  45 │     // read the S3 input with the CALLER's credentials, so the function
  46 │     // itself also needs s3:GetObject on the bucket.
> 47 │     const putObject = yield* S3.PutObject(bucket);
  48 │     yield* S3.GetObject(bucket);

0.89 packages/alchemy/src/AWS/B2BI/TestConversionHttp.ts:6:1
   3 │ import { makeB2biAccountHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestConversion } from "./TestConversion.ts";
   5 │
>  6 │ export const TestConversionHttp = Layer.effect(
   7 │   TestConversion,
   8 │   makeB2biAccountHttpBinding({
   9 │     tag: "AWS.B2BI.TestConversion",
  10 │     operation: b2bi.testConversion,
  11 │     // `target.outputSampleFile` is read through the caller's session
  12 │     // (forward-access), so the S3 read grants ride along.
  13 │     actions: ["b2bi:TestConversion", "s3:GetObject", "s3:GetObjectAttributes"],
  14 │   }),
  15 │ );

0.89 packages/alchemy/test/AWS/AppConfig/fixtures/events-handler.ts:50:5
  47 │     // land on a DIFFERENT warm instance than the one serving the test's
  48 │     // polls, so instance memory cannot capture them. Persist each event to
  49 │     // S3 under a deterministic key and read it back by key.
> 50 │     const bucket = yield* S3.Bucket("EventsBucket", { forceDestroy: true });
  51 │     const putObject = yield* S3.PutObject(bucket);
  52 │     const getObject = yield* S3.GetObject(bucket);

0.89 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:190:9
  188 │     Effect.provide(
  189 │       Layer.mergeAll(
> 190 │         AppConfig.GetConfigurationHttp,
  191 │         AppConfig.CreateHostedConfigurationVersionHttp,
  192 │         AppConfig.StartDeploymentHttp,
  193 │         AppConfig.GetDeploymentHttp,
  194 │         AppConfig.StopDeploymentHttp,
  195 │         AppConfig.ValidateConfigurationHttp,
  196 │       ),
  197 │     ),

0.89 packages/alchemy/test/AWS/CloudFront/kvs-handler.ts:28:5
  27 │   Effect.gen(function* () {
> 28 │     const store = yield* CloudFront.KeyValueStore("BindingsKvStore", {
  29 │       // Deterministic marker so the test can find this store out-of-band
  30 │       // via listKeyValueStores.
  31 │       comment: "alchemy-cf-kvs-bindings-fixture",
  32 │     });

0.89 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:301:9
  296 │     Effect.provide(
  297 │       Layer.mergeAll(
  298 │         FraudDetector.GetEventPredictionHttp,
  299 │         FraudDetector.SendEventHttp,
  300 │         FraudDetector.GetEventHttp,
> 301 │         FraudDetector.UpdateEventLabelHttp,
  302 │         FraudDetector.DeleteEventHttp,
  303 │         FraudDetector.GetListElementsHttp,
  304 │         FraudDetector.UpdateListHttp,
  305 │         FraudDetector.ListEventPredictionsHttp,
  306 │         FraudDetector.GetEventPredictionMetadataHttp,
  307 │         FraudDetector.DeleteEventsByEventTypeHttp,
  308 │         FraudDetector.GetDeleteEventsByEventTypeStatusHttp,
  309 │       ),
  310 │     ),

0.89 packages/alchemy/test/AWS/GeoMaps/handler.ts:130:9
  128 │     Effect.provide(
  129 │       Layer.mergeAll(
> 130 │         GeoMaps.GetStaticMapHttp,
  131 │         GeoMaps.GetTileHttp,
  132 │         GeoMaps.GetStyleDescriptorHttp,
  133 │         GeoMaps.GetSpritesHttp,
  134 │         GeoMaps.GetGlyphsHttp,
  135 │       ),
  136 │     ),

0.89 packages/alchemy/test/AWS/LicenseManager/handler.ts:325:9
  303 │     Effect.provide(
  304 │       Layer.mergeAll(
  305 │         Lambda.EventSource,
  306 │         LicenseManager.GetLicenseConfigurationHttp,
  307 │         LicenseManager.ListAssociationsForLicenseConfigurationHttp,
  308 │         LicenseManager.ListUsageForLicenseConfigurationHttp,
  309 │         LicenseManager.ListFailuresForLicenseConfigurationOperationsHttp,
  310 │         LicenseManager.CheckoutLicenseHttp,
  311 │         LicenseManager.CheckInLicenseHttp,
  312 │         LicenseManager.CheckoutBorrowLicenseHttp,
  313 │         LicenseManager.ExtendLicenseConsumptionHttp,
  314 │         LicenseManager.GetAccessTokenHttp,
  315 │         LicenseManager.GetLicenseHttp,
  316 │         LicenseManager.GetLicenseUsageHttp,
  317 │         LicenseManager.ListLicensesHttp,
  318 │         LicenseManager.ListLicenseVersionsHttp,
  319 │         LicenseManager.ListReceivedLicensesHttp,
  320 │         LicenseManager.GetGrantHttp,
  321 │         LicenseManager.AcceptGrantHttp,
  322 │         LicenseManager.RejectGrantHttp,
  323 │         LicenseManager.ListReceivedGrantsHttp,
  324 │         LicenseManager.ListDistributedGrantsHttp,
> 325 │         LicenseManager.ListResourceInventoryHttp,
  326 │         LicenseManager.ListLicenseSpecificationsForResourceHttp,
  327 │         LicenseManager.UpdateLicenseSpecificationsForResourceHttp,
  328 │         LicenseManager.GetServiceSettingsHttp,
  329 │       ),
  330 │     ),

0.89 packages/alchemy/test/AWS/MediaConvert/handler.ts:185:9
  182 │     Effect.provide(
  183 │       Layer.mergeAll(
  184 │         Lambda.EventSource,
> 185 │         MediaConvert.CreateJobHttp,
  186 │         MediaConvert.GetJobHttp,
  187 │         MediaConvert.CancelJobHttp,
  188 │         MediaConvert.ListJobsHttp,
  189 │         MediaConvert.SearchJobsHttp,
  190 │         MediaConvert.ProbeHttp,
  191 │         MediaConvert.StartJobsQueryHttp,
  192 │         MediaConvert.GetJobsQueryResultsHttp,
  193 │       ),
  194 │     ),

0.89 packages/alchemy/test/AWS/Pricing/handler.ts:146:9
  144 │     Effect.provide(
  145 │       Layer.mergeAll(
> 146 │         Pricing.GetProductsHttp,
  147 │         Pricing.DescribeServicesHttp,
  148 │         Pricing.GetAttributeValuesHttp,
  149 │         Pricing.ListPriceListsHttp,
  150 │         Pricing.GetPriceListFileUrlHttp,
  151 │       ),
  152 │     ),

0.88 packages/alchemy/src/AWS/EventBridge/TestEventPatternHttp.ts:12:1
> 12 │ export const TestEventPatternHttp = Layer.effect(
  13 │   TestEventPattern,
  14 │   makeEventBridgeAccountHttpBinding({
  15 │     tag: "AWS.EventBridge.TestEventPattern",
  16 │     operation: eventbridge.testEventPattern,
  17 │     actions: ["events:TestEventPattern"],
  18 │   }),
  19 │ );

0.88 packages/alchemy/test/AWS/Glue/handler.ts:182:9
> 182 │         // Start a real (cheap pythonshell) run, read it back, then stop it —

0.88 packages/alchemy/test/AWS/Inspector2/handler.ts:342:5
> 342 │     Effect.provide(

0.88 packages/alchemy/test/AWS/Kendra/handler.ts:121:7
  120 │     const index = yield* Kendra.Index("BindingsIndex", {
> 121 │       edition: "DEVELOPER_EDITION",
  122 │       roleArn: indexRole.roleArn,
  123 │       tags: { fixture: "kendra-bindings" },
  124 │     });

0.88 packages/alchemy/test/AWS/Transcribe/handler.ts:502:11
  499 │       Layer.mergeAll(
  500 │         Lambda.EventSource,
  501 │         Layer.mergeAll(
> 502 │           Transcribe.StartTranscriptionJobHttp,
  503 │           Transcribe.GetTranscriptionJobHttp,
  504 │           Transcribe.ListTranscriptionJobsHttp,
  505 │           Transcribe.DeleteTranscriptionJobHttp,
  506 │           Transcribe.StartCallAnalyticsJobHttp,
  507 │           Transcribe.GetCallAnalyticsJobHttp,
  508 │           Transcribe.ListCallAnalyticsJobsHttp,
  509 │           Transcribe.DeleteCallAnalyticsJobHttp,
  510 │           Transcribe.StartMedicalTranscriptionJobHttp,
  511 │           Transcribe.GetMedicalTranscriptionJobHttp,
  512 │           Transcribe.ListMedicalTranscriptionJobsHttp,
  513 │           Transcribe.DeleteMedicalTranscriptionJobHttp,
  514 │           Transcribe.StartMedicalScribeJobHttp,
  515 │           Transcribe.GetMedicalScribeJobHttp,
  516 │           Transcribe.ListMedicalScribeJobsHttp,
  517 │           Transcribe.DeleteMedicalScribeJobHttp,
  518 │         ),

0.88 packages/alchemy/test/Cloudflare/AnalyticsEngine/fixtures/worker.ts:13:5
   7 │ export default class AnalyticsEngineTestWorker extends Cloudflare.Worker<AnalyticsEngineTestWorker>()(
   8 │   "AnalyticsEngineTestWorker",
   9 │   {
  10 │     main: import.meta.url,
  11 │   },
  12 │   Effect.gen(function* () {
> 13 │     const analytics = yield* Cloudflare.AnalyticsEngine.WriteDataset(Dataset);
  14 │
  15 │     return {
  16 │       fetch: Effect.gen(function* () {
  17 │         const request = yield* HttpServerRequest;
  18 │         const url = new URL(request.url, "http://x");
  19 │
  20 │         if (url.pathname === "/write") {
  21 │           yield* analytics
  22 │             .writeDataPoint({
  23 │               indexes: ["account-1"],
  24 │               blobs: ["signup"],
  25 │               doubles: [1],
  26 │             })
  27 │             .pipe(Effect.orDie);
  28 │           return yield* HttpServerResponse.json({ ok: true });
  29 │         }
  30 │
  31 │         return HttpServerResponse.text("ok");
  32 │       }),
  33 │     };
  34 │   }).pipe(Effect.provide(Cloudflare.AnalyticsEngine.WriteDatasetBinding)),
  35 │ ) {}

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:38:5
  37 │   Effect.gen(function* () {
> 38 │     const tasks = yield* Cloudflare.R2.ReadWriteBucket(Bucket);
  39 │     const tasksDO = yield* TasksObject;

0.88 packages/alchemy/test/Cloudflare/Workflows/fixtures/workflow-worker.ts:21:5
  18 │   Effect.gen(function* () {
  19 │     const workflow = yield* LocalTestWorkflow;
  20 │     const bucket = yield* RollbackResults;
> 21 │     const results = yield* Cloudflare.R2.ReadWriteBucket(bucket);

0.87 packages/alchemy/src/AWS/B2BI/TestParsingHttp.ts:6:1
   3 │ import { makeB2biAccountHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestParsing } from "./TestParsing.ts";
   5 │
>  6 │ export const TestParsingHttp = Layer.effect(
   7 │   TestParsing,
   8 │   makeB2biAccountHttpBinding({
   9 │     tag: "AWS.B2BI.TestParsing",
  10 │     operation: b2bi.testParsing,
  11 │     // B2BI reads `inputFile` through the caller's session (verified live:
  12 │     // "Access denied when getting object attributes from s3://…" without
  13 │     // the S3 grants), so the documented companion permissions are granted
  14 │     // alongside.
  15 │     actions: ["b2bi:TestParsing", "s3:GetObject", "s3:GetObjectAttributes"],
  16 │   }),
  17 │ );

0.87 packages/alchemy/src/AWS/IoTWireless/TestWirelessDeviceHttp.ts:9:1
>  9 │ export const TestWirelessDeviceHttp = Layer.effect(
  10 │   TestWirelessDevice,
  11 │   makeIotWirelessDeviceHttpBinding({
  12 │     capability: "TestWirelessDevice",
  13 │     iamActions: ["iotwireless:TestWirelessDevice"],
  14 │     operation: iotw.testWirelessDevice,
  15 │     prepare: (
  16 │       request: TestWirelessDeviceRequest | undefined,
  17 │       wirelessDeviceId,
  18 │     ) => ({
  19 │       ...request,
  20 │       Id: wirelessDeviceId,
  21 │     }),
  22 │   }),
  23 │ );

0.87 packages/alchemy/src/AWS/Macie2/TestCustomDataIdentifierHttp.ts:6:1
   3 │ import { makeMacie2HttpBinding } from "./BindingHttp.ts";
   4 │ import { TestCustomDataIdentifier } from "./TestCustomDataIdentifier.ts";
   5 │
>  6 │ export const TestCustomDataIdentifierHttp = Layer.effect(
   7 │   TestCustomDataIdentifier,
   8 │   makeMacie2HttpBinding({
   9 │     tag: "AWS.Macie2.TestCustomDataIdentifier",
  10 │     operation: macie2.testCustomDataIdentifier,
  11 │     actions: ["macie2:TestCustomDataIdentifier"],
  12 │   }),
  13 │ );

0.87 packages/alchemy/test/AWS/AuditManager/handler.ts:81:11
  78 │         if (request.method === "GET" && pathname === "/account-status") {
  79 │           // Succeeds even on unregistered accounts — a REAL success through
  80 │           // the binding's IAM grant.
> 81 │           const result = yield* getAccountStatus();
  82 │           return yield* HttpServerResponse.json({
  83 │             ok: true,
  84 │             status: result.status ?? null,
  85 │           });
  86 │         }

0.87 packages/alchemy/test/AWS/Forecast/handler.ts:308:9
  295 │     Effect.provide(
  296 │       Layer.mergeAll(
  297 │         Forecast.CreateDatasetImportJobHttp,
  298 │         Forecast.DescribeDatasetImportJobHttp,
  299 │         Forecast.CreateAutoPredictorHttp,
  300 │         Forecast.DescribeAutoPredictorHttp,
  301 │         Forecast.GetAccuracyMetricsHttp,
  302 │         Forecast.CreateForecastHttp,
  303 │         Forecast.DescribeForecastHttp,
  304 │         Forecast.StopResourceHttp,
  305 │         Forecast.ResumeResourceHttp,
  306 │         Forecast.QueryForecastHttp,
  307 │         Forecast.QueryWhatIfForecastHttp,
> 308 │         Forecast.CreateForecastExportJobHttp,
  309 │         Forecast.DescribeForecastExportJobHttp,
  310 │         Forecast.CreateWhatIfAnalysisHttp,
  311 │         Forecast.DescribeWhatIfAnalysisHttp,
  312 │         Forecast.CreateWhatIfForecastHttp,
  313 │         Forecast.DescribeWhatIfForecastHttp,
  314 │         Forecast.CreateWhatIfForecastExportHttp,
  315 │         Forecast.DescribeWhatIfForecastExportHttp,
  316 │         Forecast.DeleteResourceTreeHttp,
  317 │       ),
  318 │     ),

0.87 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:181:13
  178 │         if (request.method === "POST" && pathname === "/query") {
  179 │           const described = yield* describeAsset();
  180 │           const result = yield* executeQuery({
> 181 │             queryStatement: `SELECT asset_id, asset_name FROM asset WHERE asset_id = '${described.assetId}'`,
  182 │           });
  183 │           return yield* HttpServerResponse.json({
  184 │             ok: true,
  185 │             rowCount: result.rows?.length ?? 0,
  186 │           });
  187 │         }

0.87 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:67:3
> 67 │   }).pipe(Effect.provide(Keyspaces.RestoreTableHttp)),
  68 │ );

0.87 packages/alchemy/test/AWS/Keyspaces/streams-handler.ts:22:5
  21 │   Effect.gen(function* () {
> 22 │     const keyspace = yield* Keyspaces.Keyspace("StreamsKs", {
  23 │       keyspaceName: "alchemy_streams_test_ks",
  24 │     });

0.87 packages/alchemy/test/AWS/LakeFormation/handler.ts:42:5
  41 │     // --- account-level bindings ---
> 42 │     const getDataLakePrincipal = yield* LakeFormation.GetDataLakePrincipal();
  43 │     const getTemporaryGlueTableCredentials =
  44 │       yield* LakeFormation.GetTemporaryGlueTableCredentials();

0.87 packages/alchemy/test/AWS/Rbin/handler.ts:76:3
> 76 │   }).pipe(Effect.provide(Layer.mergeAll(Rbin.GetRuleHttp, Rbin.ListRulesHttp))),
  77 │ );

0.86 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:220:9
  218 │     Effect.provide(
  219 │       Layer.mergeAll(
> 220 │         CloudHSMV2.DescribeClustersHttp,
  221 │         CloudHSMV2.DescribeBackupsHttp,
  222 │         CloudHSMV2.DeleteBackupHttp,
  223 │         CloudHSMV2.RestoreBackupHttp,
  224 │         CloudHSMV2.ModifyBackupAttributesHttp,
  225 │         CloudHSMV2.CopyBackupToRegionHttp,
  226 │         CloudHSMV2.InitializeClusterHttp,
  227 │         CloudHSMV2.GetResourcePolicyHttp,
  228 │         CloudHSMV2.PutResourcePolicyHttp,
  229 │         CloudHSMV2.DeleteResourcePolicyHttp,
  230 │       ),
  231 │     ),

0.86 packages/alchemy/test/AWS/GeoRoutes/handler.ts:21:5
  18 │   {
  19 │     main,
  20 │     functionUrl: true,
> 21 │     // Geo calls fan out to upstream providers and can exceed Lambda's 3s default.
  22 │     timeout: Duration.seconds(30),
  23 │   },

0.86 packages/alchemy/test/AWS/GlobalAccelerator/handler.ts:43:5
  40 │     // The accelerator/listener/endpoint group the bindings are bound to. The
  41 │     // endpoint group starts empty; the Add/RemoveEndpoints bindings register
  42 │     // and deregister the Elastic IP below at runtime.
> 43 │     const accelerator = yield* GlobalAccelerator.Accelerator(
  44 │       "BindingAccelerator",
  45 │       {},
  46 │     );

0.86 packages/alchemy/test/AWS/KinesisVideo/handler.ts:301:9
  298 │     Effect.provide(
  299 │       Layer.mergeAll(
  300 │         AWS.KinesisVideo.GetHLSStreamingSessionURLHttp,
> 301 │         AWS.KinesisVideo.GetDASHStreamingSessionURLHttp,
  302 │         AWS.KinesisVideo.GetClipHttp,
  303 │         AWS.KinesisVideo.GetImagesHttp,
  304 │         AWS.KinesisVideo.ListFragmentsHttp,
  305 │         AWS.KinesisVideo.GetMediaForFragmentListHttp,
  306 │         AWS.KinesisVideo.GetIceServerConfigHttp,
  307 │         AWS.KinesisVideo.SendAlexaOfferToMasterHttp,
  308 │         AWS.KinesisVideo.GetMediaHttp,
  309 │         AWS.KinesisVideo.JoinStorageSessionHttp,
  310 │         AWS.KinesisVideo.JoinStorageSessionAsViewerHttp,
  311 │       ),
  312 │     ),

0.86 packages/alchemy/test/AWS/MailManager/handler.ts:147:9
  145 │     Effect.provide(
  146 │       Layer.mergeAll(
> 147 │         MailManager.RegisterMemberToAddressListHttp,
  148 │         MailManager.DeregisterMemberFromAddressListHttp,
  149 │         MailManager.GetMemberOfAddressListHttp,
  150 │         MailManager.ListMembersOfAddressListHttp,
  151 │         MailManager.ListAddressListImportJobsHttp,
  152 │         MailManager.StartArchiveSearchHttp,
  153 │         MailManager.GetArchiveSearchHttp,
  154 │         MailManager.GetArchiveSearchResultsHttp,
  155 │         MailManager.ListArchiveSearchesHttp,
  156 │         MailManager.ListArchiveExportsHttp,
  157 │       ),
  158 │     ),

0.86 packages/alchemy/test/AWS/MedicalImaging/handler.ts:101:7
   98 │     const searchImageSets = yield* MedicalImaging.SearchImageSets(datastore);
   99 │     const getImageSet = yield* MedicalImaging.GetImageSet(datastore);
  100 │     const getImageSetMetadata =
> 101 │       yield* MedicalImaging.GetImageSetMetadata(datastore);
  102 │     const getImageFrame = yield* MedicalImaging.GetImageFrame(datastore);
  103 │     const listImageSetVersions =
  104 │       yield* MedicalImaging.ListImageSetVersions(datastore);

0.86 packages/alchemy/test/AWS/OSIS/handler.ts:146:9
  144 │     Effect.provide(
  145 │       Layer.mergeAll(
> 146 │         OSIS.ValidatePipelineHttp,
  147 │         OSIS.ListPipelineBlueprintsHttp,
  148 │         OSIS.GetPipelineBlueprintHttp,
  149 │         OSIS.ListPipelineEndpointConnectionsHttp,
  150 │       ),
  151 │     ),

0.86 packages/alchemy/test/AWS/S3Vectors/vectors-handler.ts:23:5
  22 │   Effect.gen(function* () {
> 23 │     const bucket = yield* S3Vectors.VectorBucket("VBucket", {});

0.86 packages/alchemy/test/AWS/SimpleDB/handler.ts:151:9
  149 │     Effect.provide(
  150 │       Layer.mergeAll(
> 151 │         SimpleDB.BatchDeleteAttributesHttp,
  152 │         SimpleDB.BatchPutAttributesHttp,
  153 │         SimpleDB.DeleteAttributesHttp,
  154 │         SimpleDB.DomainMetadataHttp,
  155 │         SimpleDB.GetAttributesHttp,
  156 │         SimpleDB.ListDomainsHttp,
  157 │         SimpleDB.PutAttributesHttp,
  158 │         SimpleDB.SelectHttp,
  159 │       ),
  160 │     ),

0.86 packages/alchemy/test/AWS/Timestream/handler.ts:23:5
  22 │   Effect.gen(function* () {
> 23 │     const database = yield* Timestream.Database("Metrics");
  24 │     const table = yield* Timestream.Table("Cpu", {
  25 │       databaseName: database.databaseName,
  26 │     });

0.86 packages/alchemy/test/Local/fixtures/rpc-spawner-commands.ts:78:3
> 78 │   yield* fs.writeFileString(input.ready, "ready");
  79 │   yield* Effect.never;
  80 │ });

0.85 packages/alchemy/src/AWS/DMS/TestConnectionHttp.ts:6:1
   3 │ import { makeDmsConnectionScopedHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestConnection } from "./TestConnection.ts";
   5 │
>  6 │ export const TestConnectionHttp = Layer.effect(
   7 │   TestConnection,
   8 │   makeDmsConnectionScopedHttpBinding({
   9 │     tag: "AWS.DMS.TestConnection",
  10 │     actions: ["dms:TestConnection"],
  11 │     operation: dms.testConnection,
  12 │   }),
  13 │ );

0.85 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:264:9
  261 │     Effect.provide(
  262 │       Layer.mergeAll(
  263 │         Lambda.EventSource,
> 264 │         Amplify.CreateDeploymentHttp,
  265 │         Amplify.StartDeploymentHttp,
  266 │         Amplify.StartJobHttp,
  267 │         Amplify.StopJobHttp,
  268 │         Amplify.GetJobHttp,
  269 │         Amplify.ListJobsHttp,
  270 │         Amplify.DeleteJobHttp,
  271 │         Amplify.ListArtifactsHttp,
  272 │         Amplify.GetArtifactUrlHttp,
  273 │         Amplify.GenerateAccessLogsHttp,
  274 │       ),
  275 │     ),

0.85 packages/alchemy/test/AWS/ApplicationSignals/handler.ts:302:9
  300 │     Effect.provide(
  301 │       Layer.mergeAll(
> 302 │         ApplicationSignals.ListServicesHttp,
  303 │         ApplicationSignals.GetServiceHttp,
  304 │         ApplicationSignals.ListServiceDependenciesHttp,
  305 │         ApplicationSignals.ListServiceDependentsHttp,
  306 │         ApplicationSignals.ListServiceOperationsHttp,
  307 │         ApplicationSignals.ListServiceStatesHttp,
  308 │         ApplicationSignals.ListEntityEventsHttp,
  309 │         ApplicationSignals.ListAuditFindingsHttp,
  310 │         ApplicationSignals.ListServiceLevelObjectivesHttp,
  311 │         ApplicationSignals.GetServiceLevelObjectiveHttp,
  312 │         ApplicationSignals.BatchGetServiceLevelObjectiveBudgetReportHttp,
  313 │         ApplicationSignals.ListServiceLevelObjectiveExclusionWindowsHttp,
  314 │         ApplicationSignals.BatchUpdateExclusionWindowsHttp,
  315 │         ApplicationSignals.GetInstrumentationConfigurationStatusHttp,
  316 │       ),
  317 │     ),

0.85 packages/alchemy/test/AWS/BCMDataExports/handler.ts:34:5
  31 │   Effect.gen(function* () {
  32 │     // Destination bucket must let the Data Exports service principals write
  33 │     // to it and read its policy.
> 34 │     const bucket = yield* Bucket("BindingsExportDest", {
  35 │       bucketName,
  36 │       forceDestroy: true,
  37 │       policy: [
  38 │         {
  39 │           Sid: "EnableAWSDataExportsToWriteToS3AndCheckPolicy",
  40 │           Effect: "Allow",
  41 │           Principal: {
  42 │             Service: [
  43 │               "billingreports.amazonaws.com",
  44 │               "bcm-data-exports.amazonaws.com",
  45 │             ],
  46 │           },
  47 │           Action: ["s3:PutObject", "s3:GetBucketPolicy"],
  48 │           Resource: [
  49 │             `arn:aws:s3:::${bucketName}`,
  50 │             `arn:aws:s3:::${bucketName}/*`,
  51 │           ],
  52 │         },
  53 │       ],
  54 │     });

0.85 packages/alchemy/test/AWS/BedrockAgentCore/handler.ts:374:9
  350 │       Layer.mergeAll(
  351 │         AgentCore.CreateEventHttp,
  352 │         AgentCore.GetEventHttp,
  353 │         AgentCore.DeleteEventHttp,
  354 │         AgentCore.ListEventsHttp,
  355 │         AgentCore.ListSessionsHttp,
  356 │         AgentCore.ListActorsHttp,
  357 │         AgentCore.ListMemoryRecordsHttp,
  358 │         AgentCore.RetrieveMemoryRecordsHttp,
  359 │         AgentCore.GetMemoryRecordHttp,
  360 │         AgentCore.DeleteMemoryRecordHttp,
  361 │         AgentCore.BatchCreateMemoryRecordsHttp,
  362 │         AgentCore.BatchUpdateMemoryRecordsHttp,
  363 │         AgentCore.BatchDeleteMemoryRecordsHttp,
  364 │         AgentCore.StartMemoryExtractionJobHttp,
  365 │         AgentCore.ListMemoryExtractionJobsHttp,
  366 │         AgentCore.StartCodeInterpreterSessionHttp,
  367 │         AgentCore.InvokeCodeInterpreterHttp,
  368 │         AgentCore.GetCodeInterpreterSessionHttp,
  369 │         AgentCore.ListCodeInterpreterSessionsHttp,
  370 │         AgentCore.StopCodeInterpreterSessionHttp,
  371 │         AgentCore.StartBrowserSessionHttp,
  372 │         AgentCore.GetBrowserSessionHttp,
  373 │         AgentCore.ListBrowserSessionsHttp,
> 374 │         AgentCore.InvokeBrowserHttp,
  375 │         AgentCore.UpdateBrowserStreamHttp,
  376 │         AgentCore.SaveBrowserSessionProfileHttp,
  377 │         AgentCore.StopBrowserSessionHttp,
  378 │       ),

0.85 packages/alchemy/test/AWS/Chatbot/handler.ts:256:9
  254 │     Effect.provide(
  255 │       Layer.mergeAll(
> 256 │         Chatbot.GetAccountPreferencesHttp,
  257 │         Chatbot.UpdateAccountPreferencesHttp,
  258 │         Chatbot.DescribeSlackWorkspacesHttp,
  259 │         Chatbot.DescribeSlackUserIdentitiesHttp,
  260 │         Chatbot.DeleteSlackUserIdentityHttp,
  261 │         Chatbot.DeleteSlackWorkspaceAuthorizationHttp,
  262 │         Chatbot.ListMicrosoftTeamsConfiguredTeamsHttp,
  263 │         Chatbot.ListMicrosoftTeamsUserIdentitiesHttp,
  264 │         Chatbot.DeleteMicrosoftTeamsUserIdentityHttp,
  265 │         Chatbot.DeleteMicrosoftTeamsConfiguredTeamHttp,
  266 │       ),
  267 │     ),

0.85 packages/alchemy/test/AWS/Cognito/handler.ts:422:9
  420 │     Effect.provide(
  421 │       Layer.mergeAll(
> 422 │         Cognito.UserPoolAdminHttp,
  423 │         Cognito.UserPoolAuthHttp,
  424 │         Cognito.IdentityPoolAuthHttp,
  425 │         Cognito.IdentityPoolAdminHttp,
  426 │       ),
  427 │     ),

0.85 packages/alchemy/test/AWS/DAX/handler.ts:78:7
  77 │     Effect.provide(
> 78 │       Layer.mergeAll(DAX.DescribeClustersHttp, DAX.DescribeEventsHttp),
  79 │     ),
  80 │   ),
  81 │ );

0.85 packages/alchemy/test/AWS/EntityResolution/handler.ts:81:5
> 81 │     const database = yield* Glue.Database("ErBindingsDb", {});

0.85 packages/alchemy/test/AWS/GeoPlaces/handler.ts:155:9
  153 │     Effect.provide(
  154 │       Layer.mergeAll(
> 155 │         GeoPlaces.AutocompleteHttp,
  156 │         GeoPlaces.GeocodeHttp,
  157 │         GeoPlaces.GetPlaceHttp,
  158 │         GeoPlaces.ReverseGeocodeHttp,
  159 │         GeoPlaces.SearchNearbyHttp,
  160 │         GeoPlaces.SearchTextHttp,
  161 │         GeoPlaces.SuggestHttp,
  162 │       ),
  163 │     ),

0.85 packages/alchemy/test/AWS/IAM/handler.ts:301:9
  299 │     Effect.provide(
  300 │       Layer.mergeAll(
> 301 │         IAM.GetAccountSummaryHttp,
  302 │         IAM.GetAccountAuthorizationDetailsHttp,
  303 │         IAM.GenerateCredentialReportHttp,
  304 │         IAM.GetCredentialReportHttp,
  305 │         IAM.GenerateServiceLastAccessedDetailsHttp,
  306 │         IAM.GetServiceLastAccessedDetailsHttp,
  307 │         IAM.GetServiceLastAccessedDetailsWithEntitiesHttp,
  308 │         IAM.ListPoliciesGrantingServiceAccessHttp,
  309 │         IAM.SimulateCustomPolicyHttp,
  310 │         IAM.SimulatePrincipalPolicyHttp,
  311 │         IAM.GetContextKeysForCustomPolicyHttp,
  312 │         IAM.GetContextKeysForPrincipalPolicyHttp,
  313 │         IAM.GetAccessKeyLastUsedHttp,
  314 │       ),
  315 │     ),

0.85 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/optout-handler.ts:176:9
  174 │     Effect.provide(
  175 │       Layer.mergeAll(
> 176 │         PinpointSMSVoiceV2.PutOptedOutNumberHttp,
  177 │         PinpointSMSVoiceV2.DescribeOptedOutNumbersHttp,
  178 │         PinpointSMSVoiceV2.DeleteOptedOutNumberHttp,
  179 │         PinpointSMSVoiceV2.CarrierLookupHttp,
  180 │         PinpointSMSVoiceV2.PutMessageFeedbackHttp,
  181 │       ),
  182 │     ),

0.85 packages/alchemy/test/AWS/ServiceQuotas/handler.ts:206:9
  204 │     Effect.provide(
  205 │       Layer.mergeAll(
> 206 │         ServiceQuotas.GetServiceQuotaHttp,
  207 │         ServiceQuotas.GetAWSDefaultServiceQuotaHttp,
  208 │         ServiceQuotas.ListServicesHttp,
  209 │         ServiceQuotas.ListServiceQuotasHttp,
  210 │         ServiceQuotas.ListRequestedServiceQuotaChangeHistoryByQuotaHttp,
  211 │         ServiceQuotas.RequestServiceQuotaIncreaseHttp,
  212 │       ),
  213 │     ),

0.85 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-database.ts:25:3
  18 │ export const DrizzleDb = Effect.gen(function* () {
  19 │   const schema = yield* Drizzle.Schema("d1-drizzle-schema", {
  20 │     schema: "./test/Cloudflare/D1/fixtures/drizzle-schema.ts",
  21 │     out: "./test/Cloudflare/D1/fixtures/drizzle-migrations",
  22 │     dialect: "sqlite",
  23 │   });
  24 │
> 25 │   return yield* Cloudflare.D1.Database("D1DrizzleDatabase", {
  26 │     migrations: { dir: schema.out, table: "drizzle_migrations" },
  27 │   });
  28 │ });

0.85 packages/alchemy/test/Cloudflare/Website/fixtures/astro-app/src/pages/api/kv.ts:8:2
  6 │ /**
  7 │  * GET/PUT against the user-declared `SITE_KV` binding through the runtime
> 8 │  * env — a REAL KV namespace bound via `env: { SITE_KV: ... }` in the test

0.85 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:45:7
  43 │       const body = yield* request.text;
  44 │       yield* Ref.update(forwarded, (count) => count + 1);
> 45 │       const response = yield* client.execute(
  46 │         HttpClientRequest.post(`${config.apiBaseUrl}${route}`).pipe(
  47 │           HttpClientRequest.setHeader("authorization", authorization),
  48 │           HttpClientRequest.bodyText(body, "application/json"),
  49 │         ),
  50 │       );

0.85 packages/alchemy/test/Git/fixtures/s3-stack.ts:27:1
  24 │ export { TEST_SECRET };
  25 │
  26 │ /** Declared here so the stack tears it down with the packs still inside. */
> 27 │ export const GitObjects = AWS.S3.Bucket("GitS3Objects", { forceDestroy: true });

0.84 packages/alchemy/src/AWS/B2BI/TestMappingHttp.ts:6:1
   3 │ import { makeB2biAccountHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestMapping } from "./TestMapping.ts";
   5 │
>  6 │ export const TestMappingHttp = Layer.effect(
   7 │   TestMapping,
   8 │   makeB2biAccountHttpBinding({
   9 │     tag: "AWS.B2BI.TestMapping",
  10 │     operation: b2bi.testMapping,
  11 │     actions: ["b2bi:TestMapping"],
  12 │   }),
  13 │ );

0.84 packages/alchemy/test/AWS/AMP/handler.ts:154:9
  152 │     Effect.provide(
  153 │       Layer.mergeAll(
> 154 │         AMP.RemoteWriteHttp,
  155 │         AMP.QueryMetricsHttp,
  156 │         AMP.GetLabelsHttp,
  157 │         AMP.GetSeriesHttp,
  158 │         AMP.GetMetricMetadataHttp,
  159 │         AMP.DescribeWorkspaceHttp,
  160 │         AMP.ListWorkspacesHttp,
  161 │         AMP.GetDefaultScraperConfigurationHttp,
  162 │       ),
  163 │     ),

0.84 packages/alchemy/test/AWS/BedrockDataAutomation/handler.ts:161:11
  158 │           // Double-yield: the init-scope yield gives an accessor; yielding
  159 │           // it here resolves the physical bucket name at runtime.
  160 │           const physicalBucket = yield* bucketName;
> 161 │           const result = yield* putObject({
  162 │             Key: INPUT_KEY,
  163 │             Body: TINY_PDF,
  164 │             ContentType: "application/pdf",
  165 │           }).pipe(
  166 │             Effect.flatMap(() =>
  167 │               invokeDataAutomationAsync({
  168 │                 inputConfiguration: {
  169 │                   s3Uri: `s3://${physicalBucket}/${INPUT_KEY}`,
  170 │                 },
  171 │                 outputConfiguration: {
  172 │                   s3Uri: `s3://${physicalBucket}/results/`,
  173 │                 },
  174 │                 dataAutomationProfileArn: profileArn,
  175 │                 notificationConfiguration: {
  176 │                   eventBridgeConfiguration: { eventBridgeEnabled: true },
  177 │                 },
  178 │               }),
  179 │             ),
  180 │             Effect.map((r) => ({ invocationArn: r.invocationArn })),
  181 │             // Surface the typed failure to the test instead of a bare 500 —
  182 │             // the assertion prints the tag + message on mismatch.
  183 │             Effect.catch((e) =>
  184 │               Effect.succeed({
  185 │                 invocationArn: undefined,
  186 │                 error: e._tag,
  187 │                 message: String((e as { message?: unknown }).message ?? ""),
  188 │               }),
  189 │             ),
  190 │           );

0.84 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:47:5
  44 │     // GATED FIXTURE: deploying this requires a CloudTrail-Lake-onboarded
  45 │     // account (Lake is closed to new customers — see the typed
  46 │     // CloudTrailLakeOnboardingClosed probe in EventDataStore.test.ts).
> 47 │     const store = yield* CloudTrail.EventDataStore("BindingsLake", {
  48 │       multiRegionEnabled: false,
  49 │       retentionPeriod: "7 days",
  50 │       terminationProtectionEnabled: false,
  51 │     });

0.84 packages/alchemy/test/AWS/CloudWatch/handler.ts:465:9
  442 │     Effect.provide(
  443 │       Layer.mergeAll(
  444 │         CloudWatch.DescribeAlarmContributorsHttp,
  445 │         CloudWatch.DescribeAlarmHistoryHttp,
  446 │         CloudWatch.DescribeAlarmsHttp,
  447 │         CloudWatch.DescribeAlarmsForMetricHttp,
  448 │         CloudWatch.DescribeAnomalyDetectorsHttp,
  449 │         CloudWatch.DescribeInsightRulesHttp,
  450 │         CloudWatch.DisableAlarmActionsHttp,
  451 │         CloudWatch.DisableInsightRulesHttp,
  452 │         CloudWatch.EnableAlarmActionsHttp,
  453 │         CloudWatch.EnableInsightRulesHttp,
  454 │         CloudWatch.GetDashboardHttp,
  455 │         CloudWatch.GetInsightRuleReportHttp,
  456 │         CloudWatch.GetMetricDataHttp,
  457 │         CloudWatch.GetMetricStatisticsHttp,
  458 │         CloudWatch.GetMetricWidgetImageHttp,
  459 │         CloudWatch.ListAlarmMuteRulesHttp,
  460 │         CloudWatch.ListDashboardsHttp,
  461 │         CloudWatch.ListManagedInsightRulesHttp,
  462 │         CloudWatch.ListMetricStreamsHttp,
  463 │         CloudWatch.ListMetricsHttp,
  464 │         CloudWatch.ListTagsForResourceHttp,
> 465 │         CloudWatch.PutMetricDataHttp,
  466 │         CloudWatch.SetAlarmStateHttp,
  467 │       ),
  468 │     ),

0.84 packages/alchemy/test/AWS/ControlTower/handler.ts:303:9
  301 │     Effect.provide(
  302 │       Layer.mergeAll(
> 303 │         ControlTower.ListBaselinesHttp,
  304 │         ControlTower.GetBaselineHttp,
  305 │         ControlTower.ListEnabledBaselinesHttp,
  306 │         ControlTower.GetBaselineOperationHttp,
  307 │         ControlTower.ListEnabledControlsHttp,
  308 │         ControlTower.GetControlOperationHttp,
  309 │         ControlTower.ListControlOperationsHttp,
  310 │         ControlTower.ListLandingZonesHttp,
  311 │         ControlTower.GetLandingZoneHttp,
  312 │         ControlTower.GetLandingZoneOperationHttp,
  313 │         ControlTower.ListLandingZoneOperationsHttp,
  314 │       ),
  315 │     ),

0.84 packages/alchemy/test/AWS/DirectoryService/handler.ts:73:9
  71 │     Effect.provide(
  72 │       Layer.mergeAll(
> 73 │         DirectoryService.GetDirectoryLimitsHttp,
  74 │         DirectoryService.DescribeDirectoriesHttp,
  75 │       ),
  76 │     ),

0.84 packages/alchemy/test/AWS/Geo/handler.ts:168:9
  166 │     Effect.provide(
  167 │       Layer.mergeAll(
> 168 │         GeoPlaces.SearchTextHttp,
  169 │         GeoPlaces.GeocodeHttp,
  170 │         GeoPlaces.ReverseGeocodeHttp,
  171 │         GeoPlaces.AutocompleteHttp,
  172 │         GeoRoutes.CalculateRoutesHttp,
  173 │         GeoRoutes.CalculateIsolinesHttp,
  174 │         GeoMaps.GetTileHttp,
  175 │         GeoMaps.GetStaticMapHttp,
  176 │       ),
  177 │     ),

0.84 packages/alchemy/test/AWS/ImageBuilder/handler.ts:361:9
  356 │     Effect.provide(
  357 │       Layer.mergeAll(
  358 │         Lambda.EventSource,
  359 │         ImageBuilder.GetImagePipelineHttp,
  360 │         ImageBuilder.ListImagePipelineImagesHttp,
> 361 │         ImageBuilder.StartImagePipelineExecutionHttp,
  362 │         ImageBuilder.GetImageHttp,
  363 │         ImageBuilder.CancelImageCreationHttp,
  364 │         ImageBuilder.DeleteImageHttp,
  365 │         ImageBuilder.ListImagesHttp,
  366 │         ImageBuilder.ListWorkflowExecutionsHttp,
  367 │         ImageBuilder.ListImageBuildVersionsHttp,
  368 │         ImageBuilder.ListImagePackagesHttp,
  369 │         ImageBuilder.ListImageScanFindingsHttp,
  370 │         ImageBuilder.ListImageScanFindingAggregationsHttp,
  371 │         ImageBuilder.GetWorkflowExecutionHttp,
  372 │         ImageBuilder.GetWorkflowStepExecutionHttp,
  373 │         ImageBuilder.ListWorkflowStepExecutionsHttp,
  374 │         ImageBuilder.ListWaitingWorkflowStepsHttp,
  375 │         ImageBuilder.SendWorkflowStepActionHttp,
  376 │         ImageBuilder.RetryImageHttp,
  377 │       ),
  378 │     ),

0.84 packages/alchemy/test/AWS/Location/handler.ts:500:9
  497 │         Location.ListJobsHttp,
  498 │         Location.GetJobHttp,
  499 │         Location.CancelJobHttp,
> 500 │         Location.StartJobHttp,
  501 │       ),
  502 │     ),
  503 │   ),

0.84 packages/alchemy/test/AWS/QBusiness/handler.ts:45:5
  44 │   Effect.gen(function* () {
> 45 │     const app = yield* QBusiness.Application("BindingsApp", {
  46 │       identityType: "ANONYMOUS",
  47 │       description: "alchemy QBusiness bindings fixture",
  48 │     });

0.84 packages/alchemy/test/AWS/Route53Domains/handler.ts:136:11
  134 │         if (request.method === "GET" && pathname === "/detail") {
  135 │           // example.com is never registered in the test account — the call
> 136 │           // must reach the API (proving the IAM grant and us-east-1 pin)
  137 │           // and come back as a typed domain-level error, not AccessDenied.
  138 │           return yield* errorRoute(
  139 │             getDomainDetail({ DomainName: "example.com" }),
  140 │             (detail) => ({ domainName: detail.DomainName }),
  141 │           );
  142 │         }

0.84 packages/alchemy/test/AWS/S3/fixtures/head-object-handler.ts:14:5
  11 │ export default HeadObjectTestFunction.make(
  12 │   { main: import.meta.url, functionUrl: true },
  13 │   Effect.gen(function* () {
> 14 │     const bucket = yield* S3.Bucket("HeadObjectBucket", {
  15 │       forceDestroy: true,
  16 │       versioning: "Enabled",
  17 │     });

0.84 packages/alchemy/test/AWS/S3/fixtures/presign-get-only-handler.ts:14:5
  11 │ export default PresignGetOnlyTestFunction.make(
  12 │   { main: import.meta.url, functionUrl: true },
  13 │   Effect.gen(function* () {
> 14 │     const bucket = yield* S3.Bucket("PresignGetOnlyBucket", {
  15 │       forceDestroy: true,
  16 │       versioning: "Enabled",
  17 │     });

0.84 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:22:5
> 22 │     const presignGetObject = yield* S3.PresignGetObject(bucket);
  23 │     const presignPutObject = yield* S3.PresignPutObject(bucket);
  24 │     const deleteObjects = yield* S3.DeleteObjects(bucket);
  25 │     const getObjectTagging = yield* S3.GetObjectTagging(bucket);

0.83 packages/alchemy/src/AWS/Route53/TestDNSAnswerHttp.ts:6:1
   3 │ import { makeRoute53ZoneHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestDNSAnswer } from "./TestDNSAnswer.ts";
   5 │
>  6 │ export const TestDNSAnswerHttp = Layer.effect(
   7 │   TestDNSAnswer,
   8 │   makeRoute53ZoneHttpBinding({
   9 │     tag: "AWS.Route53.TestDNSAnswer",
  10 │     operation: route53.testDNSAnswer,
  11 │     actions: ["route53:TestDNSAnswer"],
  12 │     // route53:TestDNSAnswer does not support resource-level permissions.
  13 │     wildcardIam: true,
  14 │   }),
  15 │ );

0.83 packages/alchemy/test/AWS/AppIntegrations/fixtures/handler.ts:30:5
> 30 │     const bucket = yield* Bucket("BindingsContent", { forceDestroy: true });

0.83 packages/alchemy/test/AWS/DataSync/handler.ts:69:5
  66 │   Effect.gen(function* () {
  67 │     // The transfer under test: two S3 locations over empty buckets, so a
  68 │     // started execution moves no data and a cancel closes it out quickly.
> 69 │     const src = yield* S3.Bucket("BindingsSrc", { forceDestroy: true });
  70 │     const dst = yield* S3.Bucket("BindingsDst", { forceDestroy: true });

0.83 packages/alchemy/test/AWS/DevOpsGuru/handler.ts:163:9
  160 │     Effect.provide(
  161 │       Layer.mergeAll(
  162 │         Lambda.EventSource,
> 163 │         DevOpsGuru.DescribeAccountHealthHttp,
  164 │         DevOpsGuru.DescribeAccountOverviewHttp,
  165 │         DevOpsGuru.DescribeAnomalyHttp,
  166 │         DevOpsGuru.DescribeFeedbackHttp,
  167 │         DevOpsGuru.DescribeInsightHttp,
  168 │         DevOpsGuru.DescribeOrganizationHealthHttp,
  169 │         DevOpsGuru.DescribeOrganizationOverviewHttp,
  170 │         DevOpsGuru.DescribeOrganizationResourceCollectionHealthHttp,
  171 │         DevOpsGuru.DescribeResourceCollectionHealthHttp,
  172 │         DevOpsGuru.GetCostEstimationHttp,
  173 │         DevOpsGuru.StartCostEstimationHttp,
  174 │         DevOpsGuru.ListAnomaliesForInsightHttp,
  175 │         DevOpsGuru.ListAnomalousLogGroupsHttp,
  176 │         DevOpsGuru.ListEventsHttp,
  177 │         DevOpsGuru.ListInsightsHttp,
  178 │         DevOpsGuru.ListMonitoredResourcesHttp,
  179 │         DevOpsGuru.ListOrganizationInsightsHttp,
  180 │         DevOpsGuru.ListRecommendationsHttp,
  181 │         DevOpsGuru.PutFeedbackHttp,
  182 │         DevOpsGuru.SearchInsightsHttp,
  183 │         DevOpsGuru.SearchOrganizationInsightsHttp,
  184 │         DevOpsGuru.DeleteInsightHttp,
  185 │       ),
  186 │     ),

0.83 packages/alchemy/test/AWS/ECRPublic/handler.ts:246:9
  244 │     Effect.provide(
  245 │       Layer.mergeAll(
> 246 │         ECRPublic.DescribeImagesHttp,
  247 │         ECRPublic.DescribeImageTagsHttp,
  248 │         ECRPublic.GetRepositoryCatalogDataHttp,
  249 │         ECRPublic.BatchCheckLayerAvailabilityHttp,
  250 │         ECRPublic.BatchDeleteImageHttp,
  251 │         ECRPublic.InitiateLayerUploadHttp,
  252 │         ECRPublic.UploadLayerPartHttp,
  253 │         ECRPublic.CompleteLayerUploadHttp,
  254 │         ECRPublic.PutImageHttp,
  255 │         ECRPublic.GetAuthorizationTokenHttp,
  256 │         ECRPublic.DescribeRegistriesHttp,
  257 │         ECRPublic.GetRegistryCatalogDataHttp,
  258 │       ),
  259 │     ),

0.83 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:198:9
  196 │     Effect.provide(
  197 │       Layer.mergeAll(
> 198 │         Grafana.AssociateLicenseHttp,
  199 │         Grafana.CreateWorkspaceServiceAccountHttp,
  200 │         Grafana.CreateWorkspaceServiceAccountTokenHttp,
  201 │         Grafana.DeleteWorkspaceServiceAccountHttp,
  202 │         Grafana.DeleteWorkspaceServiceAccountTokenHttp,
  203 │         Grafana.DescribeWorkspaceAuthenticationHttp,
  204 │         Grafana.DescribeWorkspaceConfigurationHttp,
  205 │         Grafana.DisassociateLicenseHttp,
  206 │         Grafana.ListPermissionsHttp,
  207 │         Grafana.ListVersionsHttp,
  208 │         Grafana.ListWorkspaceServiceAccountsHttp,
  209 │         Grafana.ListWorkspaceServiceAccountTokensHttp,
  210 │         Grafana.UpdatePermissionsHttp,
  211 │         Grafana.UpdateWorkspaceAuthenticationHttp,
  212 │         Grafana.UpdateWorkspaceConfigurationHttp,
  213 │       ),
  214 │     ),

0.83 packages/alchemy/test/AWS/HealthLake/handler.ts:37:2
  36 │ /**
> 37 │  * Data-store-scoped binding fixture: deploys a real FHIR R4 data store

0.83 packages/alchemy/test/AWS/IoTManagedIntegrations/bindings-handler.ts:293:9
  277 │     Effect.provide(
  278 │       Layer.mergeAll(
  279 │         IoTManagedIntegrations.SendManagedThingCommandHttp,
  280 │         IoTManagedIntegrations.GetManagedThingStateHttp,
  281 │         IoTManagedIntegrations.GetManagedThingCapabilitiesHttp,
  282 │         IoTManagedIntegrations.GetManagedThingCertificateHttp,
  283 │         IoTManagedIntegrations.GetManagedThingConnectivityDataHttp,
  284 │         IoTManagedIntegrations.GetManagedThingMetaDataHttp,
  285 │         IoTManagedIntegrations.ListManagedThingSchemasHttp,
  286 │         IoTManagedIntegrations.StartDeviceDiscoveryHttp,
  287 │         IoTManagedIntegrations.GetDeviceDiscoveryHttp,
  288 │         IoTManagedIntegrations.ListDeviceDiscoveriesHttp,
  289 │         IoTManagedIntegrations.ListDiscoveredDevicesHttp,
  290 │         IoTManagedIntegrations.GetSchemaVersionHttp,
  291 │         IoTManagedIntegrations.ListSchemaVersionsHttp,
  292 │         IoTManagedIntegrations.GetCustomEndpointHttp,
> 293 │         IoTManagedIntegrations.SendConnectorEventHttp,
  294 │       ),
  295 │     ),
  296 │   ),

0.83 packages/alchemy/test/AWS/Logs/handler.ts:30:5
  29 │   Effect.gen(function* () {
> 30 │     const logGroup = yield* Logs.LogGroup("BindingsLogGroup", {
  31 │       retention: "1 day",
  32 │     });

0.83 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:25:5
  22 │ export default NotificationsContactsTestFunction.make(
  23 │   {
  24 │     main,
> 25 │     functionUrl: true,
  26 │     timeout: Duration.seconds(30),
  27 │   },

0.83 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/phone-handler.ts:32:5
  29 │   Effect.gen(function* () {
  30 │     // SIMULATOR numbers only exchange messages with simulator
  31 │     // destinations and carry the smallest leasing cost.
> 32 │     const number = yield* PinpointSMSVoiceV2.PhoneNumber("BindingsNumber", {
  33 │       isoCountryCode: "US",
  34 │       messageType: "TRANSACTIONAL",
  35 │       numberCapabilities: ["SMS"],
  36 │       numberType: "SIMULATOR",
  37 │       tags: { fixture: "smsvoice-bindings" },
  38 │     });

0.83 packages/alchemy/test/AWS/ResourceGroups/handler.ts:228:9
  225 │     Effect.provide(
  226 │       Layer.mergeAll(
  227 │         Lambda.EventSource,
> 228 │         ResourceGroups.ListGroupResourcesHttp,
  229 │         ResourceGroups.ListGroupingStatusesHttp,
  230 │         ResourceGroups.GroupResourcesHttp,
  231 │         ResourceGroups.UngroupResourcesHttp,
  232 │         ResourceGroups.StartTagSyncTaskHttp,
  233 │         ResourceGroups.SearchResourcesHttp,
  234 │         ResourceGroups.GetAccountSettingsHttp,
  235 │         ResourceGroups.ListTagSyncTasksHttp,
  236 │         ResourceGroups.GetTagSyncTaskHttp,
  237 │         ResourceGroups.CancelTagSyncTaskHttp,
  238 │       ),
  239 │     ),

0.83 packages/alchemy/test/AWS/SageMaker/handler.ts:24:5
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

0.83 packages/alchemy/test/AWS/Scheduler/handler.ts:35:5
  33 │   Effect.gen(function* () {
  34 │     // Queue that runtime-minted one-shot schedules deliver into.
> 35 │     const sinkQueue = yield* SQS.Queue("SchedulerSinkQueue");
  36 │     // Queue the consumeSchedule cron handler forwards its typed events into.
  37 │     const cronQueue = yield* SQS.Queue("SchedulerCronQueue");

0.83 packages/alchemy/test/AWS/Signer/handler.ts:81:5
  80 │     const putObject = yield* S3.PutObject(src);
> 81 │     yield* S3.GetObject(src); // grants s3:GetObject(Version) for the signing job
  82 │     yield* S3.PutObject(dst); // grants s3:PutObject on the destination

0.83 packages/alchemy/test/AWS/VerifiedPermissions/handler.ts:23:5
  22 │   Effect.gen(function* () {
> 23 │     const store = yield* AWS.VerifiedPermissions.PolicyStore("Store", {
  24 │       validationMode: "OFF",
  25 │     });

0.83 packages/alchemy/test/AWS/XRay/handler.ts:361:9
  356 │     Effect.provide(
  357 │       Layer.mergeAll(
  358 │         Lambda.EventSource,
  359 │         XRay.GetTraceSummariesHttp,
  360 │         XRay.BatchGetTracesHttp,
> 361 │         XRay.PutTraceSegmentsHttp,
  362 │         XRay.PutTelemetryRecordsHttp,
  363 │         XRay.GetSamplingRulesHttp,
  364 │         XRay.GetSamplingTargetsHttp,
  365 │         XRay.GetSamplingStatisticSummariesHttp,
  366 │         XRay.GetServiceGraphHttp,
  367 │         XRay.GetTraceGraphHttp,
  368 │         XRay.GetTimeSeriesServiceStatisticsHttp,
  369 │         XRay.GetInsightHttp,
  370 │         XRay.GetInsightEventsHttp,
  371 │         XRay.GetInsightImpactGraphHttp,
  372 │         XRay.GetInsightSummariesHttp,
  373 │         XRay.GetTraceSegmentDestinationHttp,
  374 │         XRay.StartTraceRetrievalHttp,
  375 │         XRay.ListRetrievedTracesHttp,
  376 │         XRay.GetRetrievedTracesGraphHttp,
  377 │         XRay.CancelTraceRetrievalHttp,
  378 │       ),
  379 │     ),

0.83 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/local-worker.ts:10:2
   8 │ /**
   9 │  * Hyperdrive Connection for the local-emulation test: the `dev` origin
> 10 │  * points at the same real Neon Postgres the live Hyperdrive tests use, so

0.82 packages/alchemy/test/AWS/CodeArtifact/handler.ts:440:9
  420 │     Effect.provide(
  421 │       Layer.mergeAll(
  422 │         Lambda.EventSource,
  423 │         CodeArtifact.GetAuthorizationTokenHttp,
  424 │         CodeArtifact.GetRepositoryEndpointHttp,
  425 │         CodeArtifact.ListPackagesHttp,
  426 │         CodeArtifact.DescribePackageHttp,
  427 │         CodeArtifact.DescribePackageVersionHttp,
  428 │         CodeArtifact.ListPackageVersionsHttp,
  429 │         CodeArtifact.ListPackageVersionAssetsHttp,
  430 │         CodeArtifact.ListPackageVersionDependenciesHttp,
  431 │         CodeArtifact.GetPackageVersionReadmeHttp,
  432 │         CodeArtifact.GetPackageVersionAssetHttp,
  433 │         CodeArtifact.PublishPackageVersionHttp,
  434 │         CodeArtifact.UpdatePackageVersionsStatusHttp,
  435 │         CodeArtifact.PutPackageOriginConfigurationHttp,
  436 │         CodeArtifact.CopyPackageVersionsHttp,
  437 │         CodeArtifact.DisposePackageVersionsHttp,
  438 │         CodeArtifact.DeletePackageVersionsHttp,
  439 │         CodeArtifact.DeletePackageHttp,
> 440 │         S3.PutObjectHttp,
  441 │         S3.GetObjectHttp,
  442 │       ),
  443 │     ),

0.82 packages/alchemy/test/AWS/DLM/handler.ts:26:5
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

0.82 packages/alchemy/test/AWS/Deadline/handler.ts:361:9
  353 │     Effect.provide(
  354 │       Layer.mergeAll(
  355 │         Lambda.EventSource,
  356 │         Deadline.CreateJobHttp,
  357 │         Deadline.GetJobHttp,
  358 │         Deadline.UpdateJobHttp,
  359 │         Deadline.ListJobsHttp,
  360 │         Deadline.ListJobParameterDefinitionsHttp,
> 361 │         Deadline.SearchJobsHttp,
  362 │         Deadline.SearchStepsHttp,
  363 │         Deadline.SearchTasksHttp,
  364 │         Deadline.GetSessionHttp,
  365 │         Deadline.ListSessionsHttp,
  366 │         Deadline.GetSessionActionHttp,
  367 │         Deadline.ListSessionActionsHttp,
  368 │         Deadline.GetStepHttp,
  369 │         Deadline.ListStepsHttp,
  370 │         Deadline.UpdateStepHttp,
  371 │         Deadline.GetTaskHttp,
  372 │         Deadline.ListTasksHttp,
  373 │         Deadline.UpdateTaskHttp,
  374 │         Deadline.StartSessionsStatisticsAggregationHttp,
  375 │         Deadline.GetSessionsStatisticsAggregationHttp,
  376 │       ),
  377 │     ),

0.82 packages/alchemy/test/AWS/Detective/handler.ts:292:9
  272 │     Effect.provide(
  273 │       Layer.mergeAll(
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
> 292 │         Detective.StartInvestigationHttp,
  293 │         Detective.StartMonitoringMemberHttp,
  294 │         Detective.UpdateDatasourcePackagesHttp,
  295 │         Detective.UpdateInvestigationStateHttp,
  296 │         Detective.UpdateOrganizationConfigurationHttp,
  297 │       ),
  298 │     ),

0.82 packages/alchemy/test/AWS/DocDB/handler.ts:188:9
  186 │     Effect.provide(
  187 │       Layer.mergeAll(
> 188 │         DocDB.DescribeDBClustersHttp,
  189 │         DocDB.DescribeDBInstancesHttp,
  190 │         DocDB.DescribeEventsHttp,
  191 │         DocDB.DescribeDBClusterSnapshotsHttp,
  192 │         DocDB.DeleteDBClusterSnapshotHttp,
  193 │         DocDB.CopyDBClusterSnapshotHttp,
  194 │         DocDB.DescribePendingMaintenanceActionsHttp,
  195 │         DocDB.ApplyPendingMaintenanceActionHttp,
  196 │       ),
  197 │     ),

0.82 packages/alchemy/test/AWS/LexV2/handler.ts:230:7
  229 │     Effect.provide([
> 230 │       LexV2.RecognizeTextHttp,
  231 │       LexV2.RecognizeUtteranceHttp,
  232 │       LexV2.GetSessionHttp,
  233 │       LexV2.PutSessionHttp,
  234 │       LexV2.DeleteSessionHttp,
  235 │       LexV2.LambdaCodeHookEventSource,
  236 │     ]),

0.82 packages/alchemy/test/AWS/MediaTailor/handler.ts:322:9
  312 │     Effect.provide(
  313 │       Layer.mergeAll(
  314 │         MediaTailor.CreatePrefetchScheduleHttp,
  315 │         MediaTailor.GetPrefetchScheduleHttp,
  316 │         MediaTailor.DeletePrefetchScheduleHttp,
  317 │         MediaTailor.ListPrefetchSchedulesHttp,
  318 │         MediaTailor.ListAlertsHttp,
  319 │         MediaTailor.GetChannelScheduleHttp,
  320 │         MediaTailor.StartChannelHttp,
  321 │         MediaTailor.StopChannelHttp,
> 322 │         MediaTailor.CreateProgramHttp,
  323 │         MediaTailor.DescribeProgramHttp,
  324 │         MediaTailor.UpdateProgramHttp,
  325 │         MediaTailor.DeleteProgramHttp,
  326 │       ),
  327 │     ),

0.82 packages/alchemy/test/AWS/PaymentCryptography/handler.ts:362:9
  350 │     Effect.provide(
  351 │       Layer.mergeAll(
  352 │         PaymentCryptography.EncryptDataHttp,
  353 │         PaymentCryptography.DecryptDataHttp,
  354 │         PaymentCryptography.GenerateMacHttp,
  355 │         PaymentCryptography.VerifyMacHttp,
  356 │         PaymentCryptography.ReEncryptDataHttp,
  357 │         PaymentCryptography.GenerateCardValidationDataHttp,
  358 │         PaymentCryptography.VerifyCardValidationDataHttp,
  359 │         PaymentCryptography.GeneratePinDataHttp,
  360 │         PaymentCryptography.VerifyPinDataHttp,
  361 │         PaymentCryptography.TranslatePinDataHttp,
> 362 │         PaymentCryptography.GetPublicKeyCertificateHttp,
  363 │       ),
  364 │     ),
  365 │   ),

0.82 packages/alchemy/test/AWS/Transfer/handler.ts:47:5
  46 │   Effect.gen(function* () {
> 47 │     const server = yield* Transfer.Server("BindingsServer", {
  48 │       protocols: ["SFTP"],
  49 │       domain: "S3",
  50 │       endpointType: "PUBLIC",
  51 │       identityProviderType: "SERVICE_MANAGED",
  52 │     });

0.82 packages/alchemy/test/AWS/Transfer/workflow-handler.ts:33:5
  30 │     // Event source: subscribe the host to Transfer Family file-transfer
  31 │     // events. The deploy proves the EventBridge rule + invoke permission
  32 │     // wiring; Transfer publishes to the default bus automatically.
> 33 │     yield* Transfer.consumeFileTransferEvents(
  34 │       { kinds: ["file-upload-completed", "file-upload-failed"] },
  35 │       (events) =>
  36 │         Stream.runForEach(events, (event) =>
  37 │           Effect.log(
  38 │             `transfer ${event["detail-type"]}: ${event.detail.username}`,
  39 │           ),
  40 │         ),
  41 │     );

0.82 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/db.ts:15:3
  14 │ export const PlanetscaleHostRole = Effect.gen(function* () {
> 15 │   const database = yield* PostgresDatabase("PlanetscaleHostDb", {
  16 │     name: "alchemy-container-pg-host",
  17 │     region: { slug: "us-east" },
  18 │     clusterSize: "PS_10",
  19 │   });
  20 │   return yield* PostgresRole("PlanetscaleHostRole", {
  21 │     database,
  22 │     inheritedRoles: ["postgres"],
  23 │   });
  24 │ });

0.82 packages/alchemy/test/Cloudflare/Email/fixtures/local-worker.ts:22:7
  21 │     const live = yield* Cloudflare.Email.Send(
> 22 │       Cloudflare.Email.SendEmail("LIVE_EMAIL").pipe(remote()),
  23 │     );

0.82 packages/alchemy/test/Cloudflare/R2/fixtures/bucket.ts:10:1
> 10 │ export const TestBucket = Cloudflare.R2.Bucket("R2BindingTestBucket", {
  11 │   forceDestroy: true,
  12 │ });

0.82 packages/alchemy/test/Neon/fixtures/connect-handler.ts:19:3
  16 │   const projectResource = yield* ConnectProject;
  17 │   const projectKeys = connectEnvKeys(projectResource);
  18 │   const project = yield* Connect(projectResource);
> 19 │   const pooled = yield* Postgres({ url: branch.connectionString });
  20 │   const direct = yield* Postgres({ url: branch.directConnectionString });
  21 │   const parent = yield* Postgres({ url: project.pooledConnectionString });

0.81 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:268:9
  265 │     Effect.provide(
  266 │       Layer.mergeAll(
  267 │         Lambda.EventSource,
> 268 │         ACMPCA.GetCertificateAuthorityCsrHttp,
  269 │         ACMPCA.GetCertificateAuthorityCertificateHttp,
  270 │         ACMPCA.IssueCertificateHttp,
  271 │         ACMPCA.GetCertificateHttp,
  272 │         ACMPCA.ImportCertificateAuthorityCertificateHttp,
  273 │         ACMPCA.RevokeCertificateHttp,
  274 │         ACMPCA.CreateCertificateAuthorityAuditReportHttp,
  275 │         ACMPCA.DescribeCertificateAuthorityAuditReportHttp,
  276 │       ),
  277 │     ),

0.81 packages/alchemy/test/AWS/AIOps/fixtures/handler.ts:120:9
  118 │     Effect.provide(
  119 │       Layer.mergeAll(
> 120 │         AIOps.GetInvestigationGroupHttp,
  121 │         AIOps.GetInvestigationGroupPolicyHttp,
  122 │         AIOps.ListTagsForResourceHttp,
  123 │         AIOps.ListInvestigationGroupsHttp,
  124 │       ),
  125 │     ),

0.81 packages/alchemy/test/AWS/ApplicationAutoScaling/handler.ts:38:5
  35 │   Effect.gen(function* () {
  36 │     // A provisioned DynamoDB table is the cheapest, fastest real scalable
  37 │     // resource (near-instant, free at 1 RCU/WCU).
> 38 │     const table = yield* Table("BindingsTable", {
  39 │       partitionKey: "id",
  40 │       attributes: { id: "S" },
  41 │       billingMode: "PROVISIONED",
  42 │       provisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  43 │     });

0.81 packages/alchemy/test/AWS/BackupSearch/handler.ts:97:9
   95 │     Effect.provide(
   96 │       Layer.mergeAll(
>  97 │         BackupSearch.ListSearchJobResultsHttp,
   98 │         BackupSearch.ListSearchJobBackupsHttp,
   99 │         BackupSearch.GetSearchJobHttp,
  100 │       ),
  101 │     ),

0.81 packages/alchemy/test/AWS/Budgets/handler.ts:229:9
  227 │     Effect.provide(
  228 │       Layer.mergeAll(
> 229 │         Budgets.DescribeBudgetHttp,
  230 │         Budgets.DescribeBudgetPerformanceHistoryHttp,
  231 │         Budgets.DescribeNotificationsForBudgetHttp,
  232 │         Budgets.DescribeSubscribersForNotificationHttp,
  233 │         Budgets.DescribeBudgetActionsForBudgetHttp,
  234 │         Budgets.ExecuteBudgetActionHttp,
  235 │         Budgets.DescribeBudgetActionHistoriesHttp,
  236 │       ),
  237 │     ),

0.81 packages/alchemy/test/AWS/CloudMap/handler.ts:245:9
  243 │     Effect.provide(
  244 │       Layer.mergeAll(
> 245 │         AWS.CloudMap.DiscoverInstancesHttp,
  246 │         AWS.CloudMap.DiscoverInstancesRevisionHttp,
  247 │         AWS.CloudMap.RegisterInstanceHttp,
  248 │         AWS.CloudMap.DeregisterInstanceHttp,
  249 │         AWS.CloudMap.GetInstanceHttp,
  250 │         AWS.CloudMap.ListInstancesHttp,
  251 │         AWS.CloudMap.GetServiceAttributesHttp,
  252 │         AWS.CloudMap.GetOperationHttp,
  253 │         AWS.CloudMap.UpdateInstanceCustomHealthStatusHttp,
  254 │         AWS.CloudMap.GetInstancesHealthStatusHttp,
  255 │       ),
  256 │     ),

0.81 packages/alchemy/test/AWS/IVS/fixtures/handler.ts:34:5
  33 │     // Event source: subscribe the host to IVS stream state-change events.
> 34 │     // The deploy proves the EventBridge rule + invoke permission wiring.

0.81 packages/alchemy/test/AWS/IoTWireless/fixtures/handler.ts:45:5
  42 │ export const ResultQueueLive = Layer.effect(
  43 │   ResultQueue,
  44 │   Effect.gen(function* () {
> 45 │     const result = yield* AWS.SQS.Queue("IoTWirelessUplinkResultQueue");
  46 │     return { result };
  47 │   }),
  48 │ );

0.81 packages/alchemy/test/AWS/Macie2/handler.ts:361:9
  358 │     Effect.provide(
  359 │       Layer.mergeAll(
  360 │         Macie2.CreateSampleFindingsHttp,
> 361 │         Macie2.DescribeOrganizationConfigurationHttp,
  362 │         Macie2.GetAdministratorAccountHttp,
  363 │         Macie2.GetAutomatedDiscoveryConfigurationHttp,
  364 │         Macie2.GetBucketStatisticsHttp,
  365 │         Macie2.GetClassificationExportConfigurationHttp,
  366 │         Macie2.GetFindingStatisticsHttp,
  367 │         Macie2.GetFindingsHttp,
  368 │         Macie2.GetInvitationsCountHttp,
  369 │         Macie2.GetRevealConfigurationHttp,
  370 │         Macie2.GetUsageTotalsHttp,
  371 │         Macie2.ListAllowListsHttp,
  372 │         Macie2.ListClassificationJobsHttp,
  373 │         Macie2.ListClassificationScopesHttp,
  374 │         Macie2.ListFindingsFiltersHttp,
  375 │         Macie2.ListFindingsHttp,
  376 │         Macie2.ListInvitationsHttp,
  377 │         Macie2.ListManagedDataIdentifiersHttp,
  378 │         Macie2.ListMembersHttp,
  379 │         Macie2.ListOrganizationAdminAccountsHttp,
  380 │         Macie2.SearchResourcesHttp,
  381 │         Macie2.TestCustomDataIdentifierHttp,
  382 │       ),
  383 │     ),

0.81 packages/alchemy/test/AWS/MediaLive/fixtures/channel-handler.ts:251:9
  249 │     Effect.provide(
  250 │       Layer.mergeAll(
> 251 │         MediaLive.DescribeChannelHttp,
  252 │         MediaLive.DescribeScheduleHttp,
  253 │         MediaLive.BatchUpdateScheduleHttp,
  254 │         MediaLive.DeleteScheduleHttp,
  255 │         MediaLive.ListAlertsHttp,
  256 │         MediaLive.DescribeThumbnailsHttp,
  257 │         MediaLive.StartChannelHttp,
  258 │         MediaLive.StopChannelHttp,
  259 │         MediaLive.RestartChannelPipelinesHttp,
  260 │       ),
  261 │     ),

0.81 packages/alchemy/test/AWS/MediaLive/fixtures/handler.ts:24:5
  21 │   Effect.gen(function* () {
  22 │     // The input the input-scoped binding is bound to. A URL_PULL input is
  23 │     // free, provisions in seconds, and needs no security group.
> 24 │     const input = yield* MediaLive.Input("BindingInput", {
  25 │       type: "URL_PULL",
  26 │       sources: [{ Url: "https://example.com/stream/index.m3u8" }],
  27 │       tags: { fixture: "medialive-bindings" },
  28 │     });

0.81 packages/alchemy/test/AWS/Notifications/handler.ts:247:9
  244 │     Effect.provide(
  245 │       Layer.mergeAll(
  246 │         Lambda.EventSource,
> 247 │         Notifications.GetNotificationEventHttp,
  248 │         Notifications.ListNotificationEventsHttp,
  249 │         Notifications.GetManagedNotificationEventHttp,
  250 │         Notifications.ListManagedNotificationEventsHttp,
  251 │         Notifications.GetManagedNotificationChildEventHttp,
  252 │         Notifications.ListManagedNotificationChildEventsHttp,
  253 │         Notifications.GetManagedNotificationConfigurationHttp,
  254 │         Notifications.ListManagedNotificationConfigurationsHttp,
  255 │         Notifications.ListManagedNotificationChannelAssociationsHttp,
  256 │         Notifications.ListChannelsHttp,
  257 │       ),
  258 │     ),

0.81 packages/alchemy/test/AWS/RAM/handler.ts:255:9
  252 │     Effect.provide(
  253 │       Layer.mergeAll(
  254 │         Lambda.EventSource,
> 255 │         RAM.AcceptResourceShareInvitationHttp,
  256 │         RAM.RejectResourceShareInvitationHttp,
  257 │         RAM.GetResourceShareInvitationsHttp,
  258 │         RAM.ListPendingInvitationResourcesHttp,
  259 │         RAM.GetResourceSharesHttp,
  260 │         RAM.GetResourceShareAssociationsHttp,
  261 │         RAM.ListResourcesHttp,
  262 │         RAM.ListPrincipalsHttp,
  263 │         RAM.GetResourcePoliciesHttp,
  264 │         RAM.GetPermissionHttp,
  265 │         RAM.ListPermissionsHttp,
  266 │       ),
  267 │     ),

0.81 packages/alchemy/test/AWS/Route53Profiles/handler.ts:80:9
  77 │     Effect.provide(
  78 │       Layer.mergeAll(
  79 │         Route53Profiles.ListProfileAssociationsHttp,
> 80 │         Route53Profiles.ListProfileResourceAssociationsHttp,
  81 │       ),
  82 │     ),
  83 │   ),

0.81 packages/alchemy/test/AWS/SecretsManager/fixtures/get-secret-only-handler.ts:68:3
> 68 │   }).pipe(Effect.provide(SecretsManager.GetSecretValueHttp)),
  69 │ );

0.81 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:401:7
  383 │     Effect.provide(
  384 │       Layer.mergeAll(
  385 │         Lambda.EventSource,
  386 │         ServiceCatalog.SearchProductsHttp,
  387 │         ServiceCatalog.DescribeProductHttp,
  388 │         ServiceCatalog.ListLaunchPathsHttp,
  389 │         ServiceCatalog.DescribeProvisioningParametersHttp,
  390 │         ServiceCatalog.ProvisionProductHttp,
  391 │         ServiceCatalog.UpdateProvisionedProductHttp,
  392 │         ServiceCatalog.TerminateProvisionedProductHttp,
  393 │         ServiceCatalog.DescribeProvisionedProductHttp,
  394 │         ServiceCatalog.SearchProvisionedProductsHttp,
  395 │         ServiceCatalog.DescribeRecordHttp,
  396 │         ServiceCatalog.ListRecordHistoryHttp,
  397 │         ServiceCatalog.GetProvisionedProductOutputsHttp,
  398 │         ServiceCatalog.ListStackInstancesForProvisionedProductHttp,
  399 │         ServiceCatalog.ExecuteProvisionedProductServiceActionHttp,
  400 │         ServiceCatalog.DescribeServiceActionExecutionParametersHttp,
> 401 │       ),
  402 │     ),
  403 │   ),
  404 │ );

0.81 packages/alchemy/test/Neon/fixtures/StorageHttpHandler.ts:46:1
> 46 │ }).pipe(Effect.provide(Layer.mergeAll(ReadWriteBucketHttp, ReadBucketHttp)));

0.81 packages/alchemy/test/Planetscale/MySQL/fixtures/Stack.ts:23:3
  22 │ export const PlanetscaleDb = Effect.gen(function* () {
> 23 │   const database = yield* Planetscale.MySQLDatabase("MySQLHyperdriveTestDb", {
  24 │     name: "alchemy-mysql-hyperdrive",
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

0.81 packages/cloudflare-runtime/src/core/test/sandbox.ts:21:5
  17 │   const upstreamUrl = yield* runtime.start({
  18 │     name: "test",
  19 │     compatibilityDate: "2026-01-01",
  20 │     compatibilityFlags: [],
> 21 │     bindings: [KvNamespace.remote("TEST", "ff74cfc28c744cdfb77664ff07050b13")],
  22 │     modules: [
  23 │       {
  24 │         name: "test.js",
  25 │         type: "ESModule",
  26 │         content: `export default { fetch: async (request, env) => {
  27 │           const list = await env.TEST.list();
  28 │             return Response.json(list);
  29 │           } }`,
  30 │       },
  31 │     ],
  32 │   });

0.80 packages/alchemy/test/AWS/B2BI/handler.ts:99:5
   77 │ export const B2biFixturesLive = Layer.effect(
   78 │   B2biFixtures,
   79 │   Effect.gen(function* () {
   80 │     const bucket = yield* AWS.S3.Bucket("B2biData", {
   81 │       bucketName: BUCKET,
   82 │       forceDestroy: true,
   83 │       policy: b2biBucketPolicy,
   84 │     });
   85 │     const transformer = yield* AWS.B2BI.Transformer("BindingsTransformer", {
   86 │       name: `alchemy-b2bi-bindings-transformer${stageSuffix}`,
   87 │       status: "active",
   88 │       inputConversion: {
   89 │         fromFormat: "X12",
   90 │         formatOptions: {
   91 │           x12: { transactionSet: "X12_850", version: "VERSION_4010" },
   92 │         },
   93 │       },
   94 │       mapping: {
   95 │         templateLanguage: "JSONATA",
   96 │         template: '{ "orderId": "test" }',
   97 │       },
   98 │     });
>  99 │     const eventsQueue = yield* AWS.SQS.Queue("B2biEventsSink", {
  100 │       queueName: EVENTS_QUEUE,
  101 │     });
  102 │     return { bucket, transformer, eventsQueue };
  103 │   }),
  104 │ );

0.80 packages/alchemy/test/AWS/Bedrock/handler.ts:79:11
  78 │         if (request.method === "GET" && pathname === "/count-tokens") {
> 79 │           const result = yield* countTokens({
  80 │             input: {
  81 │               converse: {
  82 │                 messages: [{ role: "user", content: [{ text: "Say hello." }] }],
  83 │               },
  84 │             },
  85 │           });
  86 │           return yield* HttpServerResponse.json({
  87 │             inputTokens: result.inputTokens,
  88 │           });
  89 │         }

0.80 packages/alchemy/test/AWS/CloudTrail/handler.ts:46:5
  44 │   Effect.gen(function* () {
  45 │     // Holds the event-source markers (under events/).
> 46 │     const bucket = yield* S3.Bucket("CloudTrailEvents", {
  47 │       forceDestroy: true,
  48 │     });
  49 │     const BucketName = yield* bucket.bucketName;

0.80 packages/alchemy/test/AWS/CodeDeploy/handler.ts:321:3
> 321 │   ),
  322 │ );

0.80 packages/alchemy/test/AWS/CodePipeline/handler.ts:523:9
  520 │     Effect.provide(
  521 │       Layer.mergeAll(
  522 │         Lambda.EventSource,
> 523 │         S3.PutObjectHttp,
  524 │         CodePipeline.StartPipelineExecutionHttp,
  525 │         CodePipeline.StopPipelineExecutionHttp,
  526 │         CodePipeline.GetPipelineStateHttp,
  527 │         CodePipeline.GetPipelineExecutionHttp,
  528 │         CodePipeline.ListPipelineExecutionsHttp,
  529 │         CodePipeline.ListActionExecutionsHttp,
  530 │         CodePipeline.ListRuleExecutionsHttp,
  531 │         CodePipeline.ListDeployActionExecutionTargetsHttp,
  532 │         CodePipeline.RetryStageExecutionHttp,
  533 │         CodePipeline.RollbackStageHttp,
  534 │         CodePipeline.EnableStageTransitionHttp,
  535 │         CodePipeline.DisableStageTransitionHttp,
  536 │         CodePipeline.OverrideStageConditionHttp,
  537 │         CodePipeline.PutApprovalResultHttp,
  538 │         CodePipeline.PutActionRevisionHttp,
  539 │         CodePipeline.GetJobDetailsHttp,
  540 │         CodePipeline.PutJobSuccessResultHttp,
  541 │         CodePipeline.PutJobFailureResultHttp,
  542 │         CodePipeline.PollForJobsHttp,
  543 │         CodePipeline.AcknowledgeJobHttp,
  544 │       ),
  545 │     ),

0.80 packages/alchemy/test/AWS/CostAndUsageReport/handler.ts:32:5
  29 │     // The delivery bucket policy AWS validates before accepting a report
  30 │     // definition (billingreports.amazonaws.com needs GetBucketAcl/
  31 │     // GetBucketPolicy on the bucket and PutObject under it).
> 32 │     const bucket = yield* Bucket("CurBindingsBucket", {
  33 │       bucketName: BUCKET_NAME,
  34 │       forceDestroy: true,
  35 │       policy: [
  36 │         {
  37 │           Effect: "Allow",
  38 │           Principal: { Service: "billingreports.amazonaws.com" },
  39 │           Action: ["s3:GetBucketAcl", "s3:GetBucketPolicy"],
  40 │           Resource: `arn:aws:s3:::${BUCKET_NAME}`,
  41 │         },
  42 │         {
  43 │           Effect: "Allow",
  44 │           Principal: { Service: "billingreports.amazonaws.com" },
  45 │           Action: ["s3:PutObject"],
  46 │           Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
  47 │         },
  48 │       ],
  49 │     });

0.80 packages/alchemy/test/AWS/DataExchange/handler.ts:40:5
> 40 │     const bucket = yield* S3.Bucket("BindingBucket", { forceDestroy: true });

0.80 packages/alchemy/test/AWS/FMS/handler.ts:321:9
  318 │         FMS.GetPolicyHttp,
  319 │         FMS.ListPoliciesHttp,
  320 │         FMS.PutPolicyHttp,
> 321 │         FMS.DeletePolicyHttp,
  322 │         FMS.GetAppsListHttp,
  323 │         FMS.ListAppsListsHttp,
  324 │         FMS.PutAppsListHttp,

0.80 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:31:5
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

0.80 packages/alchemy/test/AWS/OAM/handler.ts:59:3
> 59 │   }).pipe(Effect.provide(OAM.ListAttachedLinksHttp)),
  60 │ );

0.80 packages/alchemy/test/AWS/Organizations/handler.ts:702:9
  699 │     Effect.provide(
  700 │       Layer.mergeAll(
  701 │         Lambda.EventSource,
> 702 │         Organizations.DescribeOrganizationHttp,
  703 │         Organizations.ListRootsHttp,
  704 │         Organizations.ListAccountsHttp,
  705 │         Organizations.ListAccountsForParentHttp,
  706 │         Organizations.ListOrganizationalUnitsForParentHttp,
  707 │         Organizations.ListChildrenHttp,
  708 │         Organizations.ListParentsHttp,
  709 │         Organizations.ListPoliciesHttp,
  710 │         Organizations.ListPoliciesForTargetHttp,
  711 │         Organizations.ListTargetsForPolicyHttp,
  712 │         Organizations.DescribeEffectivePolicyHttp,
  713 │         Organizations.ListAccountsWithInvalidEffectivePolicyHttp,
  714 │         Organizations.ListEffectivePolicyValidationErrorsHttp,
  715 │         Organizations.ListDelegatedAdministratorsHttp,
  716 │         Organizations.ListDelegatedServicesForAccountHttp,
  717 │         Organizations.ListAWSServiceAccessForOrganizationHttp,
  718 │         Organizations.ListTagsForResourceHttp,
  719 │         Organizations.DescribeCreateAccountStatusHttp,
  720 │         Organizations.ListCreateAccountStatusHttp,
  721 │         Organizations.InviteAccountToOrganizationHttp,
  722 │         Organizations.AcceptHandshakeHttp,
  723 │         Organizations.DeclineHandshakeHttp,
  724 │         Organizations.CancelHandshakeHttp,
  725 │         Organizations.DescribeHandshakeHttp,
  726 │         Organizations.ListHandshakesForAccountHttp,
  727 │         Organizations.ListHandshakesForOrganizationHttp,
  728 │       ),

0.80 packages/alchemy/test/AWS/RDSData/handler.ts:42:5
  39 │     // Shared Aurora fixture infra (VPC, subnets, SGs, secret, cluster,
  40 │     // writer) — also yielded by the Drizzle IAM fixture; declarations
  41 │     // dedupe by logical ID.
> 42 │     const { secret, cluster } = yield* RDSDataInfra;
  43 │
  44 │     const options = { secret, database: "app" };

0.80 packages/alchemy/test/AWS/RedshiftServerless/fixtures/snapshot-handler.ts:27:5
  26 │   Effect.gen(function* () {
> 27 │     const namespace = yield* RedshiftServerless.Namespace("SnapshotNamespace", {
  28 │       namespaceName: "alchemy-test-rssnap-ns",
  29 │       dbName: "dev",
  30 │       adminUsername: "alchemyadmin",
  31 │       manageAdminPassword: true,
  32 │     });

0.80 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:83:9
  81 │     Effect.provide(
  82 │       Layer.mergeAll(
> 83 │         RolesAnywhere.GetSubjectHttp,
  84 │         RolesAnywhere.ListSubjectsHttp,
  85 │       ),
  86 │     ),

0.80 packages/alchemy/test/AWS/SSM/handler.ts:35:5
  34 │   Effect.gen(function* () {
> 35 │     const stringParameter = yield* SSM.Parameter("TestStringParameter", {
  36 │       value: "plain-config-value",
  37 │       tags: { Environment: "test" },
  38 │     });

0.80 packages/alchemy/test/AWS/Schemas/handler.ts:74:5
  72 │     // The discoverer the start/stop bindings are bound to — on a dedicated
  73 │     // bus that carries no traffic, so it never publishes junk schemas.
> 74 │     const bus = yield* EventBus("BindingsBus", {});

0.80 packages/alchemy/test/AWS/SecretsManager/handler.ts:325:9
  314 │     Effect.provide(
  315 │       Layer.mergeAll(
  316 │         SecretsManager.GetSecretValueHttp,
  317 │         SecretsManager.PutSecretValueHttp,
  318 │         SecretsManager.DescribeSecretHttp,
  319 │         SecretsManager.GetRandomPasswordHttp,
  320 │         SecretsManager.ListSecretsHttp,
  321 │         SecretsManager.ListSecretVersionIdsHttp,
  322 │         SecretsManager.BatchGetSecretValueHttp,
  323 │         SecretsManager.UpdateSecretVersionStageHttp,
  324 │         SecretsManager.RotateSecretHttp,
> 325 │         Lambda.SecretRotationEventSource,
  326 │       ),
  327 │     ),
  328 │   ),

0.80 packages/alchemy/test/Cloudflare/Artifacts/fixtures/async-worker.ts:17:7
  14 │     const repos = env.REPOS;
  15 │
  16 │     if (url.pathname === "/create") {
> 17 │       const repo = await repos.create(name, { setDefaultBranch: "main" });
  18 │       return Response.json({
  19 │         name: repo.name,
  20 │         remote: repo.remote,
  21 │         defaultBranch: repo.defaultBranch,
  22 │         hasToken: typeof repo.token === "string" && repo.token.length > 0,
  23 │       });
  24 │     }

0.80 packages/alchemy/test/Git/fixtures/lambda-stack.ts:35:3
  30 │ const GitLive = TestRoutes.pipe(
  31 │   Layer.provide(ApiHandlersLive),
  32 │   Layer.provide(ReposDurableObject),
  33 │   Layer.provide(RegistryDurableObject),
  34 │   Layer.provide(HasherLambda(HasherFunction)),
> 35 │   Layer.provide(AWS.Lambda.InvokeFunctionHttp),
  36 │   Layer.provide(BlobStoreR2(GitObjects)),
  37 │ );

0.80 packages/alchemy/test/Git/fixtures/loader-stack.ts:24:1
  21 │ import { TEST_SECRET, TestApi, TestAuthLive } from "./stack.ts";
  22 │ export { TEST_SECRET };
  23 │
> 24 │ const GitObjects = Cloudflare.R2.Bucket("GitLoaderObjects", {
  25 │   forceDestroy: true,
  26 │ });

0.80 packages/alchemy/test/Git/fixtures/stack.ts:42:1
  41 │ /** The suites' bucket — owned by the assembly, like any user's. */
> 42 │ const GitObjects = Cloudflare.R2.Bucket("GitObjects", {
  43 │   // Test stacks must tear down even with packs/bundles/head snapshots
  44 │   // still in the bucket (the e2e benches leave repos behind by design).
  45 │   forceDestroy: true,
  46 │ });

0.79 packages/alchemy/src/AWS/StepFunctions/TestStateHttp.ts:6:1
   3 │ import { makeSfnServiceHttpBinding } from "./BindingHttp.ts";
   4 │ import { TestState } from "./TestState.ts";
   5 │
>  6 │ export const TestStateHttp = Layer.effect(
   7 │   TestState,
   8 │   makeSfnServiceHttpBinding({
   9 │     tag: "AWS.StepFunctions.TestState",
  10 │     actions: ["states:TestState"],
  11 │     operation: sfn.testState,
  12 │   }),
  13 │ );

0.79 packages/alchemy/test/AWS/AppRegistry/handler.ts:216:9
  214 │     Effect.provide(
  215 │       Layer.mergeAll(
> 216 │         AppRegistry.GetApplicationHttp,
  217 │         AppRegistry.GetAssociatedResourceHttp,
  218 │         AppRegistry.ListAssociatedResourcesHttp,
  219 │         AppRegistry.ListAssociatedAttributeGroupsHttp,
  220 │         AppRegistry.ListAttributeGroupsForApplicationHttp,
  221 │         AppRegistry.GetAttributeGroupHttp,
  222 │         AppRegistry.SyncResourceHttp,
  223 │         AppRegistry.ListApplicationsHttp,
  224 │         AppRegistry.ListAttributeGroupsHttp,
  225 │       ),
  226 │     ),

0.79 packages/alchemy/test/AWS/ComprehendMedical/handler.ts:311:9
  287 │     Effect.provide(
  288 │       Layer.mergeAll(
  289 │         ComprehendMedical.DetectEntitiesV2Http,
  290 │         ComprehendMedical.DetectPHIHttp,
  291 │         ComprehendMedical.InferICD10CMHttp,
  292 │         ComprehendMedical.InferRxNormHttp,
  293 │         ComprehendMedical.InferSNOMEDCTHttp,
  294 │         ComprehendMedical.ListEntitiesDetectionV2JobsHttp,
  295 │         ComprehendMedical.ListICD10CMInferenceJobsHttp,
  296 │         ComprehendMedical.ListPHIDetectionJobsHttp,
  297 │         ComprehendMedical.ListRxNormInferenceJobsHttp,
  298 │         ComprehendMedical.ListSNOMEDCTInferenceJobsHttp,
  299 │         ComprehendMedical.DescribeEntitiesDetectionV2JobHttp,
  300 │         ComprehendMedical.DescribeICD10CMInferenceJobHttp,
  301 │         ComprehendMedical.DescribePHIDetectionJobHttp,
  302 │         ComprehendMedical.DescribeRxNormInferenceJobHttp,
  303 │         ComprehendMedical.DescribeSNOMEDCTInferenceJobHttp,
  304 │         ComprehendMedical.StopEntitiesDetectionV2JobHttp,
  305 │         ComprehendMedical.StopICD10CMInferenceJobHttp,
  306 │         ComprehendMedical.StopPHIDetectionJobHttp,
  307 │         ComprehendMedical.StopRxNormInferenceJobHttp,
  308 │         ComprehendMedical.StopSNOMEDCTInferenceJobHttp,
  309 │         ComprehendMedical.StartEntitiesDetectionV2JobHttp,
  310 │         ComprehendMedical.StartICD10CMInferenceJobHttp,
> 311 │         ComprehendMedical.StartPHIDetectionJobHttp,
  312 │         ComprehendMedical.StartRxNormInferenceJobHttp,
  313 │         ComprehendMedical.StartSNOMEDCTInferenceJobHttp,
  314 │       ),
  315 │     ),

0.79 packages/alchemy/test/AWS/Config/handler.ts:387:9
  374 │     Effect.provide(
  375 │       Layer.mergeAll(
  376 │         Lambda.EventSource,
  377 │         Config.BatchGetResourceConfigHttp,
  378 │         Config.DeleteResourceConfigHttp,
  379 │         Config.DescribeComplianceByConfigRuleHttp,
  380 │         Config.DescribeComplianceByResourceHttp,
  381 │         Config.DescribeConfigRuleEvaluationStatusHttp,
  382 │         Config.GetComplianceDetailsByConfigRuleHttp,
  383 │         Config.GetComplianceDetailsByResourceHttp,
  384 │         Config.GetComplianceSummaryByConfigRuleHttp,
  385 │         Config.GetComplianceSummaryByResourceTypeHttp,
  386 │         Config.GetDiscoveredResourceCountsHttp,
> 387 │         Config.GetResourceConfigHistoryHttp,
  388 │         Config.GetResourceEvaluationSummaryHttp,
  389 │         Config.ListDiscoveredResourcesHttp,
  390 │         Config.ListResourceEvaluationsHttp,
  391 │         Config.PutEvaluationsHttp,
  392 │         Config.PutExternalEvaluationHttp,
  393 │         Config.PutResourceConfigHttp,
  394 │         Config.SelectResourceConfigHttp,
  395 │         Config.StartConfigRulesEvaluationHttp,
  396 │         Config.StartResourceEvaluationHttp,
  397 │       ),
  398 │     ),

0.79 packages/alchemy/test/AWS/EventBridge/handler.ts:43:5
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
> 43 │     const customQueue = yield* AWS.SQS.Queue("CustomBusSink");
  44 │     const defaultQueue = yield* AWS.SQS.Queue("DefaultBusSink");
  45 │     const toggleRule = yield* AWS.EventBridge.Rule("ToggleRule", {
  46 │       name: "alchemy-test-eb-toggle",
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

0.79 packages/alchemy/test/AWS/Lambda/fixtures/otel-handler.ts:52:13
  47 │         if (url.pathname === "/probe") {
  48 │           const endpoint = yield* Config.String("COLLECTOR_URL").pipe(
  49 │             Effect.orDie,
  50 │           );
  51 │           const result = yield* Effect.tryPromise(() =>
> 52 │             fetch(`${endpoint}/v1/probe`, {
  53 │               method: "POST",
  54 │               body: JSON.stringify({ probe: true }),
  55 │             }).then(async (r) => ({
  56 │               status: r.status,
  57 │               body: (await r.text()).slice(0, 200),
  58 │             })),
  59 │           ).pipe(
  60 │             Effect.catchCause((cause) =>
  61 │               Effect.succeed({ status: -1, body: String(cause) }),
  62 │             ),
  63 │           );
  64 │           return yield* HttpServerResponse.json(result);
  65 │         }

0.79 packages/alchemy/test/AWS/MediaPackageV2/fixtures/handler.ts:58:5
  57 │     // Destination bucket for harvested clips, writable by MediaPackage.
> 58 │     yield* S3.Bucket("HarvestBucket", {
  59 │       bucketName: HARVEST_BUCKET,
  60 │       forceDestroy: true,
  61 │       policy: [
  62 │         {
  63 │           Sid: "AllowMediaPackageHarvest",
  64 │           Effect: "Allow",
  65 │           Principal: { Service: "mediapackagev2.amazonaws.com" },
  66 │           Action: ["s3:PutObject", "s3:GetBucketLocation"],
  67 │           Resource: [
  68 │             `arn:aws:s3:::${HARVEST_BUCKET}`,
  69 │             `arn:aws:s3:::${HARVEST_BUCKET}/*`,
  70 │           ],
  71 │         },
  72 │       ],
  73 │       tags: { fixture: "mediapackagev2-bindings" },
  74 │     });

0.79 packages/alchemy/test/AWS/VpcLattice/handler.ts:94:9
  92 │     Effect.provide(
  93 │       Layer.mergeAll(
> 94 │         VpcLattice.ListTargetsHttp,
  95 │         VpcLattice.RegisterTargetsHttp,
  96 │         VpcLattice.DeregisterTargetsHttp,
  97 │       ),
  98 │     ),

0.79 packages/alchemy/test/AWS/WAFv2/handler.ts:321:9
  318 │     Effect.provide(
  319 │       Layer.mergeAll(
  320 │         WAFv2.GetIPSetHttp,
> 321 │         WAFv2.UpdateIPSetHttp,
  322 │         WAFv2.GetSampledRequestsHttp,
  323 │         WAFv2.GetRateBasedStatementManagedKeysHttp,
  324 │         WAFv2.ListResourcesForWebACLHttp,
  325 │         WAFv2.GetTopPathStatisticsByTrafficHttp,
  326 │         WAFv2.GetPermissionPolicyHttp,
  327 │         WAFv2.PutPermissionPolicyHttp,
  328 │         WAFv2.DeletePermissionPolicyHttp,
  329 │         WAFv2.CheckCapacityHttp,
  330 │         WAFv2.CreateAPIKeyHttp,
  331 │         WAFv2.GetDecryptedAPIKeyHttp,
  332 │         WAFv2.ListAPIKeysHttp,
  333 │         WAFv2.DeleteAPIKeyHttp,
  334 │         WAFv2.DescribeManagedRuleGroupHttp,
  335 │         WAFv2.ListAvailableManagedRuleGroupsHttp,
  336 │         WAFv2.ListAvailableManagedRuleGroupVersionsHttp,
  337 │         WAFv2.DescribeAllManagedProductsHttp,
  338 │         WAFv2.DescribeManagedProductsByVendorHttp,
  339 │         WAFv2.GetWebACLForResourceHttp,
  340 │       ),
  341 │     ),

0.79 packages/alchemy/test/Cloudflare/D1/fixtures/database.ts:9:1
> 9 │ export const TestDatabase = Cloudflare.D1.Database("D1BindingDatabase");

0.79 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:19:1
  16 │ export const RemoteEmail = Cloudflare.Email.SendEmail("RemoteEmail", {
  17 │   allowedSenderAddresses: senderAddress ? [senderAddress] : undefined,
  18 │   destinationAddress,
> 19 │ }).pipe(remote());

0.79 packages/alchemy/test/Planetscale/Postgres/fixtures/Stack.ts:24:3
  23 │ export const PlanetscaleDb = Effect.gen(function* () {
> 24 │   const database = yield* Planetscale.PostgresDatabase("HyperdriveTestDb", {
  25 │     name: "alchemy-postgres-hyperdrive",
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

0.79 packages/alchemy/test/Railway/suiteProject.ts:125:1
> 125 │ }).pipe(Effect.provide(fromAuthProvider().pipe(Layer.provide(RailwayAuth))));

0.78 packages/alchemy/test/AWS/AuditManager/handler-assessment.ts:198:9
  196 │     Effect.provide(
  197 │       Layer.mergeAll(
> 198 │         AuditManager.GetEvidenceHttp,
  199 │         AuditManager.GetEvidenceByEvidenceFolderHttp,
  200 │         AuditManager.GetEvidenceFolderHttp,
  201 │         AuditManager.GetEvidenceFoldersByAssessmentHttp,
  202 │         AuditManager.GetEvidenceFoldersByAssessmentControlHttp,
  203 │         AuditManager.GetChangeLogsHttp,
  204 │         AuditManager.GetInsightsByAssessmentHttp,
  205 │         AuditManager.ListControlDomainInsightsByAssessmentHttp,
  206 │         AuditManager.ListAssessmentControlInsightsByControlDomainHttp,
  207 │         AuditManager.BatchImportEvidenceToAssessmentControlHttp,
  208 │         AuditManager.CreateAssessmentReportHttp,
  209 │         AuditManager.DeleteAssessmentReportHttp,
  210 │         AuditManager.GetAssessmentReportUrlHttp,
  211 │         AuditManager.AssociateAssessmentReportEvidenceFolderHttp,
  212 │         AuditManager.DisassociateAssessmentReportEvidenceFolderHttp,
  213 │         AuditManager.BatchAssociateAssessmentReportEvidenceHttp,
  214 │         AuditManager.BatchDisassociateAssessmentReportEvidenceHttp,
  215 │         AuditManager.BatchCreateDelegationByAssessmentHttp,
  216 │         AuditManager.BatchDeleteDelegationByAssessmentHttp,
  217 │         AuditManager.UpdateAssessmentControlHttp,
  218 │         AuditManager.UpdateAssessmentControlSetStatusHttp,
  219 │         AuditManager.UpdateAssessmentStatusHttp,
  220 │       ),
  221 │     ),

0.78 packages/alchemy/test/AWS/CloudControl/handler.ts:51:5
  48 │   Effect.gen(function* () {
  49 │     // A Cloud Control-managed resource deployed with the stack, read back by
  50 │     // the GetResource / ListResources routes.
> 51 │     yield* CloudControl.Resource("BindingsParam", {
  52 │       typeName: SSM_PARAMETER,
  53 │       desiredState: {
  54 │         Name: FIXTURE_PARAM,
  55 │         Type: "String",
  56 │         Value: "fixture",
  57 │       },
  58 │     });

0.78 packages/alchemy/test/AWS/CostExplorer/handler.ts:441:9
  438 │         Lambda.EventSource,
  439 │         CostExplorer.GetCostAndUsageHttp,
  440 │         CostExplorer.GetCostAndUsageComparisonsHttp,
> 441 │         CostExplorer.GetCostAndUsageWithResourcesHttp,
  442 │         CostExplorer.GetCostComparisonDriversHttp,
  443 │         CostExplorer.GetApproximateUsageRecordsHttp,
  444 │         CostExplorer.GetCostForecastHttp,

0.78 packages/alchemy/test/AWS/ECR/handler.ts:341:9
  338 │     Effect.provide(
  339 │       Layer.mergeAll(
  340 │         Lambda.EventSource,
> 341 │         ECR.GetAuthorizationTokenHttp,
  342 │         ECR.DescribeImagesHttp,
  343 │         ECR.ListImagesHttp,
  344 │         ECR.BatchGetImageHttp,
  345 │         ECR.GetDownloadUrlForLayerHttp,
  346 │         ECR.BatchCheckLayerAvailabilityHttp,
  347 │         ECR.InitiateLayerUploadHttp,
  348 │         ECR.UploadLayerPartHttp,
  349 │         ECR.CompleteLayerUploadHttp,
  350 │         ECR.PutImageHttp,
  351 │         ECR.BatchDeleteImageHttp,
  352 │         ECR.StartImageScanHttp,
  353 │         ECR.DescribeImageScanFindingsHttp,
  354 │         S3.PutObjectHttp,
  355 │         S3.GetObjectHttp,
  356 │       ),
  357 │     ),

0.78 packages/alchemy/test/AWS/KinesisAnalyticsV2/handler.ts:61:7
  60 │     const describeApplication =
> 61 │       yield* KinesisAnalyticsV2.DescribeApplication(app);
  62 │     const describeApplicationVersion =
  63 │       yield* KinesisAnalyticsV2.DescribeApplicationVersion(app);

0.78 packages/alchemy/test/AWS/Lambda/bindings-handler.ts:32:7
  29 │     const target = yield* Lambda.Function("BindingsTarget", {
  30 │       main: targetMain,
  31 │       handler: "handler",
> 32 │       isExternal: true,
  33 │       functionUrl: false,
  34 │     });

0.78 packages/alchemy/test/AWS/MWAAServerless/handler.ts:58:5
  55 │   Effect.gen(function* () {
  56 │     // The execution role the workflow's tasks assume — read access to the
  57 │     // definitions bucket so the single S3ListOperator task can succeed.
> 58 │     const role = yield* IAM.Role("WorkflowRole", {
  59 │       roleName: BINDINGS_ROLE_NAME,
  60 │       assumeRolePolicyDocument: {
  61 │         Version: "2012-10-17",
  62 │         Statement: [
  63 │           {
  64 │             Effect: "Allow",
  65 │             Principal: { Service: "airflow-serverless.amazonaws.com" },
  66 │             Action: ["sts:AssumeRole"],
  67 │           },
  68 │         ],
  69 │       },
  70 │       inlinePolicies: {
  71 │         definitions: {
  72 │           Version: "2012-10-17",
  73 │           Statement: [
  74 │             {
  75 │               Effect: "Allow",
  76 │               Action: ["s3:GetObject*", "s3:GetBucket*", "s3:List*"],
  77 │               Resource: [
  78 │                 `arn:aws:s3:::${BINDINGS_BUCKET_NAME}`,
  79 │                 `arn:aws:s3:::${BINDINGS_BUCKET_NAME}/*`,
  80 │               ],
  81 │             },
  82 │           ],
  83 │         },
  84 │       },
  85 │     });

0.78 packages/alchemy/test/AWS/MemoryDB/bindings-handler.ts:173:9
  171 │     Effect.provide(
  172 │       Layer.mergeAll(
> 173 │         MemoryDB.DescribeClustersHttp,
  174 │         MemoryDB.DescribeSnapshotsHttp,
  175 │         MemoryDB.DescribeEventsHttp,
  176 │         MemoryDB.DeleteSnapshotHttp,
  177 │         MemoryDB.CopySnapshotHttp,
  178 │         MemoryDB.DescribeServiceUpdatesHttp,
  179 │         MemoryDB.DescribeEngineVersionsHttp,
  180 │         MemoryDB.BatchUpdateClusterHttp,
  181 │       ),
  182 │     ),

0.78 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:30:5
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

0.78 packages/alchemy/test/AWS/Translate/handler.ts:118:5
  116 │     const stopTextTranslationJob = yield* Translate.StopTextTranslationJob();
  117 │     const listTextTranslationJobs = yield* Translate.ListTextTranslationJobs();
> 118 │     const putObject = yield* S3.PutObject(bucket);

0.78 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:79:9
  55 │ export class HostReachContainerObject extends Cloudflare.DurableObject<HostReachContainerObject>()(
  56 │   "HostReachContainerObject",
  57 │   Effect.gen(function* () {
  58 │     const container = yield* HostReachContainer;
  59 │
  60 │     return Effect.gen(function* () {
  61 │       const { fetch } = yield* container.getTcpPort(8080);
  62 │
  63 │       const get = (path: string) =>
  64 │         Effect.gen(function* () {
  65 │           const response = yield* fetch(
  66 │             HttpClientRequest.get(`http://container${path}`),
  67 │           );
  68 │           return yield* response.text;
  69 │         });
  70 │
  71 │       return {
  72 │         getEnv: () => get("/env"),
  73 │         getProbe: () => get("/probe"),
  74 │       };
  75 │     });
  76 │   }).pipe(
  77 │     Effect.provide(
  78 │       Cloudflare.Containers.layer(HostReachContainer, {
> 79 │         enableInternet: true,
  80 │       }),
  81 │     ),
  82 │   ),
  83 │ ) {}

0.78 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:22:7
  19 │   Effect.gen(function* () {
  20 │     const client = yield* HttpClient.HttpClient;
  21 │     const get = (path: string) =>
> 22 │       client.get(new URL(path, baseUrl)).pipe(
  23 │         Effect.flatMap((r) =>
  24 │           r.status !== 200
  25 │             ? Effect.fail(new Error(`not ready: ${r.status}`))
  26 │             : r.text,
  27 │         ),
  28 │         Effect.timeout("30 seconds"),
  29 │         Effect.retry({ schedule: readinessSchedule, times: 30 }),
  30 │       );

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:15:5
  12 │ export class UpgradeObject extends DurableObject<unknown> {
  13 │   constructor(ctx: DurableObjectState, env: unknown) {
  14 │     super(ctx, env);
> 15 │     ctx.storage.sql.exec(`
  16 │       CREATE TABLE IF NOT EXISTS alchemy_scheduled_events (
  17 │         id TEXT PRIMARY KEY,
  18 │         run_at INTEGER NOT NULL,
  19 │         repeat_ms INTEGER,
  20 │         payload TEXT NOT NULL
  21 │       );
  22 │       CREATE INDEX IF NOT EXISTS idx_alchemy_scheduled_events_run_at
  23 │         ON alchemy_scheduled_events (run_at);
  24 │     `);
  25 │     ctx.blockConcurrencyWhile(async () => {
  26 │       const constructors =
  27 │         (await ctx.storage.get<string[]>("constructors")) ?? [];
  28 │       await ctx.storage.put("constructors", [...constructors, "v1"]);
  29 │     });
  30 │   }

0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/email-worker.ts:154:13
  153 │           const result = yield* sender
> 154 │             .send({
  155 │               from: senderAddress,
  156 │               to: inboxAddress,
  157 │               subject,
  158 │               text: `sent at ${new Date().toISOString()}`,
  159 │             })
  160 │             .pipe(
  161 │               Effect.match({
  162 │                 onSuccess: () => ({ ok: true as const, subject }),
  163 │                 onFailure: (err) => ({
  164 │                   ok: false as const,
  165 │                   message: err.message,
  166 │                 }),
  167 │               }),
  168 │             );

0.77 packages/alchemy/test/AWS/AICapabilities/handler.ts:130:9
  128 │     Effect.provide(
  129 │       Layer.mergeAll(
> 130 │         Rekognition.DetectLabelsHttp,
  131 │         Textract.DetectDocumentTextHttp,
  132 │         Polly.SynthesizeSpeechHttp,
  133 │         Translate.TranslateTextHttp,
  134 │         Comprehend.DetectSentimentHttp,
  135 │       ),
  136 │     ),

0.77 packages/alchemy/test/AWS/Backup/handler.ts:341:9
  332 │     Effect.provide(
  333 │       Layer.mergeAll(
  334 │         Lambda.EventSource,
  335 │         Backup.ListRecoveryPointsByBackupVaultHttp,
  336 │         Backup.DescribeRecoveryPointHttp,
  337 │         Backup.DeleteRecoveryPointHttp,
  338 │         Backup.GetRecoveryPointRestoreMetadataHttp,
  339 │         Backup.StartBackupJobHttp,
  340 │         Backup.StartCopyJobHttp,
> 341 │         Backup.StartRestoreJobHttp,
  342 │         Backup.DescribeBackupJobHttp,
  343 │         Backup.ListBackupJobsHttp,
  344 │         Backup.StopBackupJobHttp,
  345 │         Backup.DescribeRestoreJobHttp,
  346 │         Backup.ListRestoreJobsHttp,
  347 │         Backup.GetRestoreJobMetadataHttp,
  348 │         Backup.PutRestoreValidationResultHttp,
  349 │         Backup.DescribeCopyJobHttp,
  350 │         Backup.ListCopyJobsHttp,
  351 │         Backup.ListProtectedResourcesHttp,
  352 │         Backup.DescribeProtectedResourceHttp,
  353 │         Backup.GetSupportedResourceTypesHttp,
  354 │         Backup.ListRecoveryPointsByResourceHttp,
  355 │       ),
  356 │     ),

0.77 packages/alchemy/test/AWS/DataBrew/handler.ts:40:3
  39 │ export const foundation = Effect.gen(function* () {
> 40 │   const bucket = yield* S3.Bucket("DataBrewBindingsBucket", {
  41 │     forceDestroy: true,
  42 │   });

0.77 packages/alchemy/test/AWS/EMR/handler.ts:116:9
  113 │     Effect.provide(
  114 │       Layer.mergeAll(
  115 │         Lambda.EventSource,
> 116 │         EMR.ListClustersHttp,
  117 │         EMR.ListReleaseLabelsHttp,
  118 │         EMR.DescribeReleaseLabelHttp,
  119 │         EMR.ListSupportedInstanceTypesHttp,
  120 │       ),
  121 │     ),

0.77 packages/alchemy/test/AWS/GuardDuty/handler.ts:321:9
  317 │     Effect.provide(
  318 │       Layer.mergeAll(
  319 │         GuardDuty.ArchiveFindingsHttp,
  320 │         GuardDuty.CreateSampleFindingsHttp,
> 321 │         GuardDuty.DescribeOrganizationConfigurationHttp,
  322 │         GuardDuty.GetAdministratorAccountHttp,
  323 │         GuardDuty.GetFindingsHttp,
  324 │         GuardDuty.GetFindingsStatisticsHttp,
  325 │         GuardDuty.GetInvitationsCountHttp,
  326 │         GuardDuty.GetMalwareScanSettingsHttp,
  327 │         GuardDuty.GetOrganizationStatisticsHttp,
  328 │         GuardDuty.GetRemainingFreeTrialDaysHttp,
  329 │         GuardDuty.GetUsageStatisticsHttp,
  330 │         GuardDuty.ListCoverageHttp,
  331 │         GuardDuty.ListFindingsHttp,
  332 │         GuardDuty.ListInvestigationsHttp,
  333 │         GuardDuty.ListInvitationsHttp,
  334 │         GuardDuty.ListMembersHttp,
  335 │         GuardDuty.ListOrganizationAdminAccountsHttp,
  336 │         GuardDuty.UnarchiveFindingsHttp,
  337 │         GuardDuty.UpdateFindingsFeedbackHttp,
  338 │       ),
  339 │     ),

0.77 packages/alchemy/test/AWS/OpenSearch/fixtures/handler.ts:365:9
  362 │     Effect.provide(
  363 │       Layer.mergeAll(
  364 │         Lambda.EventSource,
> 365 │         OpenSearch.DescribeDomainHttp,
  366 │         OpenSearch.DescribeDomainsHttp,
  367 │         OpenSearch.DescribeDomainConfigHttp,
  368 │         OpenSearch.DescribeDomainHealthHttp,
  369 │         OpenSearch.DescribeDomainNodesHttp,
  370 │         OpenSearch.DescribeDomainChangeProgressHttp,
  371 │         OpenSearch.ListDomainNamesHttp,
  372 │         OpenSearch.DescribeDomainAutoTunesHttp,
  373 │         OpenSearch.ListScheduledActionsHttp,
  374 │         OpenSearch.StartDomainMaintenanceHttp,
  375 │         OpenSearch.GetDomainMaintenanceStatusHttp,
  376 │         OpenSearch.ListDomainMaintenancesHttp,
  377 │         OpenSearch.StartServiceSoftwareUpdateHttp,
  378 │         OpenSearch.CancelServiceSoftwareUpdateHttp,
  379 │         OpenSearch.GetUpgradeStatusHttp,
  380 │         OpenSearch.GetUpgradeHistoryHttp,
  381 │         OpenSearch.GetCompatibleVersionsHttp,
  382 │         OpenSearch.ListVersionsHttp,
  383 │         OpenSearch.ListInstanceTypeDetailsHttp,
  384 │       ),
  385 │     ),

0.77 packages/alchemy/test/AWS/ResourceExplorer/handler.ts:85:9
  83 │     Effect.provide(
  84 │       Layer.mergeAll(
> 85 │         ResourceExplorer.SearchHttp,
  86 │         ResourceExplorer.ListResourcesHttp,
  87 │         ResourceExplorer.ListSupportedResourceTypesHttp,
  88 │       ),
  89 │     ),

0.77 packages/alchemy/test/AWS/SecurityHub/handler.ts:404:9
  384 │     Effect.provide(
  385 │       Layer.mergeAll(
  386 │         SecurityHub.BatchImportFindingsHttp,
  387 │         SecurityHub.BatchUpdateFindingsHttp,
  388 │         SecurityHub.DescribeActionTargetsHttp,
  389 │         SecurityHub.DescribeOrganizationConfigurationHttp,
  390 │         SecurityHub.DescribeProductsHttp,
  391 │         SecurityHub.DescribeStandardsHttp,
  392 │         SecurityHub.GetAdministratorAccountHttp,
  393 │         SecurityHub.GetEnabledStandardsHttp,
  394 │         SecurityHub.GetFindingHistoryHttp,
  395 │         SecurityHub.GetFindingsHttp,
  396 │         SecurityHub.GetInsightsHttp,
  397 │         SecurityHub.GetInvitationsCountHttp,
  398 │         SecurityHub.GetSecurityControlDefinitionHttp,
  399 │         SecurityHub.ListAutomationRulesHttp,
  400 │         SecurityHub.ListEnabledProductsForImportHttp,
  401 │         SecurityHub.ListFindingAggregatorsHttp,
  402 │         SecurityHub.ListInvitationsHttp,
  403 │         SecurityHub.ListMembersHttp,
> 404 │         SecurityHub.ListOrganizationAdminAccountsHttp,
  405 │         SecurityHub.ListSecurityControlDefinitionsHttp,
  406 │       ),
  407 │     ),

0.77 packages/alchemy/test/Cloudflare/KV/fixtures/namespace.ts:9:1
> 9 │ export const TestNamespace = Cloudflare.KV.Namespace("KVBindingTestNamespace");

0.77 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:130:7
  127 │     >((resume) => {
  128 │       const requests: OtlpCollector["requests"] = [];
  129 │       const completedRequests = { value: 0 };
> 130 │       const child = spawn(
  131 │         "node",

0.77 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:56:5
  54 │   Effect.gen(function* () {
  55 │     const hd = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
> 56 │     const sql = yield* SQL.Postgres({ url: hd.connectionString });
  57 │
  58 │     return {
  59 │       fetch: Effect.gen(function* () {
  60 │         const request = yield* HttpServerRequest.HttpServerRequest;
  61 │         const url = new URL(request.url, "http://x");
  62 │
  63 │         if (request.method === "POST" && url.pathname === "/widgets") {
  64 │           const body = (yield* request.json) as { id: number; name: string };
  65 │           yield* sql`CREATE TABLE IF NOT EXISTS ${sql(TABLE)} (id INT PRIMARY KEY, name TEXT NOT NULL)`;
  66 │           yield* sql`INSERT INTO ${sql(TABLE)} (id, name) VALUES (${body.id}, ${body.name}) ON CONFLICT (id) DO UPDATE SET name = ${body.name}`;
  67 │           return yield* HttpServerResponse.json({ ok: true });
  68 │         }
  69 │
  70 │         if (request.method === "GET" && url.pathname === "/widgets") {
  71 │           const widgets =
  72 │             yield* sql`SELECT id, name FROM ${sql(TABLE)} ORDER BY id`;
  73 │           return yield* HttpServerResponse.json({ widgets });
  74 │         }
  75 │
  76 │         return HttpServerResponse.text("Not Found", { status: 404 });
  77 │       }).pipe(
  78 │         Effect.catchCause((cause) =>
  79 │           HttpServerResponse.json({ error: String(cause) }, { status: 500 }),
  80 │         ),
  81 │       ),
  82 │     };
  83 │   }).pipe(Effect.provide(Cloudflare.Hyperdrive.ConnectBinding)),

0.76 packages/alchemy/src/AWS/Transfer/TestIdentityProviderHttp.ts:7:1
   4 │ import { makeTransferServerHttpBinding } from "./BindingHttp.ts";
   5 │ import { TestIdentityProvider } from "./TestIdentityProvider.ts";
   6 │
>  7 │ export const TestIdentityProviderHttp = Layer.effect(
   8 │   TestIdentityProvider,
   9 │   makeTransferServerHttpBinding({
  10 │     tag: "AWS.Transfer.TestIdentityProvider",
  11 │     operation: transfer.testIdentityProvider,
  12 │     actions: ["transfer:TestIdentityProvider"],
  13 │     // AWS authorizes this operation against the addressed user, despite the
  14 │     // binding being server-scoped so it can inject ServerId. UserName arrives
  15 │     // at runtime, so grant the operation on every user of the bound server.
  16 │     resource: (server) =>
  17 │       Output.map(server.arn, (arn) => `${arn.replace(":server/", ":user/")}/*`),
  18 │   }),
  19 │ );

0.76 packages/alchemy/test/AWS/ACM/handler.ts:62:5
  59 │     // PENDING_VALIDATION forever: describe/list/search succeed against it,
  60 │     // while issuance-gated operations (get/export/renew) fail with typed
  61 │     // errors — both directions prove the binding + IAM wiring.
> 62 │     const certificate = yield* ACM.Certificate("BindingsCertificate", {
  63 │       domainName: FIXTURE_DOMAIN,
  64 │       subjectAlternativeNames: [FIXTURE_DOMAIN],
  65 │     });

0.76 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:339:9
  316 │     Effect.provide(
  317 │       Layer.mergeAll(
  318 │         Lambda.EventSource,
  319 │         AccessAnalyzer.ListFindingsV2Http,
  320 │         AccessAnalyzer.ListFindingsHttp,
  321 │         AccessAnalyzer.GetFindingV2Http,
  322 │         AccessAnalyzer.GetFindingHttp,
  323 │         AccessAnalyzer.GetFindingsStatisticsHttp,
  324 │         AccessAnalyzer.UpdateFindingsHttp,
  325 │         AccessAnalyzer.ApplyArchiveRuleHttp,
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
> 339 │         AccessAnalyzer.StartPolicyGenerationHttp,
  340 │         AccessAnalyzer.GetGeneratedPolicyHttp,
  341 │         AccessAnalyzer.ListPolicyGenerationsHttp,
  342 │         AccessAnalyzer.CancelPolicyGenerationHttp,
  343 │       ),
  344 │     ),

0.76 packages/alchemy/test/AWS/Account/handler.ts:156:9
  154 │     Effect.provide(
  155 │       Layer.mergeAll(
> 156 │         Account.GetAccountInformationHttp,
  157 │         Account.GetContactInformationHttp,
  158 │         Account.GetAlternateContactHttp,
  159 │         Account.ListRegionsHttp,
  160 │         Account.GetRegionOptStatusHttp,
  161 │       ),
  162 │     ),

0.76 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:41:5
  40 │   Effect.gen(function* () {
> 41 │     const bucket = yield* S3.Bucket("kb-docs", { forceDestroy: true });

0.76 packages/alchemy/test/AWS/CloudFront/handler.ts:38:5
  37 │   Effect.gen(function* () {
> 38 │     const bucket = yield* S3.Bucket("InvalidationOriginBucket", {
  39 │       forceDestroy: true,
  40 │     });

0.76 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:92:9
  89 │     Effect.provide(
  90 │       Layer.provideMerge(
  91 │         AWS.CloudWatch.MetricSinkHttp,
> 92 │         AWS.CloudWatch.PutMetricDataHttp,
  93 │       ),
  94 │     ),
  95 │   ),

0.76 packages/alchemy/test/AWS/Grafana/handler.ts:57:3
> 57 │   }).pipe(Effect.provide(Grafana.ListVersionsHttp)),
  58 │ );

0.76 packages/alchemy/test/AWS/MediaConnect/fixtures/handler.ts:248:9
  245 │     Effect.provide(
  246 │       Layer.mergeAll(
  247 │         Lambda.EventSource,
> 248 │         MediaConnect.DescribeFlowHttp,
  249 │         MediaConnect.DescribeFlowSourceMetadataHttp,
  250 │         MediaConnect.DescribeFlowSourceThumbnailHttp,
  251 │         MediaConnect.StartFlowHttp,
  252 │         MediaConnect.StopFlowHttp,
  253 │         MediaConnect.GrantFlowEntitlementsHttp,
  254 │         MediaConnect.RevokeFlowEntitlementHttp,
  255 │         MediaConnect.ListFlowsHttp,
  256 │         MediaConnect.ListEntitlementsHttp,
  257 │       ),
  258 │     ),

0.76 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:159:9
  157 │     Effect.provide(
  158 │       Layer.mergeAll(
> 159 │         AOSS.GetCollectionHttp,
  160 │         AOSS.CreateIndexHttp,
  161 │         AOSS.GetIndexHttp,
  162 │         AOSS.UpdateIndexHttp,
  163 │         AOSS.DeleteIndexHttp,
  164 │       ),
  165 │     ),

0.76 packages/alchemy/test/AWS/Personalize/handler.ts:421:9
  407 │     Effect.provide(
  408 │       Layer.mergeAll(
  409 │         Personalize.PutEventsHttp,
  410 │         Personalize.PutActionInteractionsHttp,
  411 │         Personalize.PutItemsHttp,
  412 │         Personalize.PutUsersHttp,
  413 │         Personalize.PutActionsHttp,
  414 │         Personalize.GetRecommendationsHttp,
  415 │         Personalize.GetPersonalizedRankingHttp,
  416 │         Personalize.GetActionRecommendationsHttp,
  417 │         Personalize.CreateDatasetImportJobHttp,
  418 │         Personalize.DescribeDatasetImportJobHttp,
  419 │         Personalize.CreateSolutionVersionHttp,
  420 │         Personalize.DescribeSolutionVersionHttp,
> 421 │         Personalize.UpdateCampaignHttp,
  422 │         Personalize.DescribeCampaignHttp,
  423 │         Personalize.CreateSolutionHttp,
  424 │         Personalize.CreateCampaignHttp,
  425 │         Personalize.GetSolutionMetricsHttp,
  426 │         Personalize.CreateBatchInferenceJobHttp,
  427 │         Personalize.DescribeBatchInferenceJobHttp,
  428 │       ),
  429 │     ),

0.76 packages/alchemy/test/AWS/SSMIncidents/handler.ts:259:9
  257 │     Effect.provide(
  258 │       Layer.mergeAll(
> 259 │         SSMIncidents.StartIncidentHttp,
  260 │         SSMIncidents.ListIncidentRecordsHttp,
  261 │         SSMIncidents.GetIncidentRecordHttp,
  262 │         SSMIncidents.UpdateIncidentRecordHttp,
  263 │         SSMIncidents.DeleteIncidentRecordHttp,
  264 │         SSMIncidents.CreateTimelineEventHttp,
  265 │         SSMIncidents.GetTimelineEventHttp,
  266 │         SSMIncidents.UpdateTimelineEventHttp,
  267 │         SSMIncidents.DeleteTimelineEventHttp,
  268 │         SSMIncidents.ListTimelineEventsHttp,
  269 │         SSMIncidents.ListRelatedItemsHttp,
  270 │         SSMIncidents.UpdateRelatedItemsHttp,
  271 │         SSMIncidents.ListIncidentFindingsHttp,
  272 │         SSMIncidents.BatchGetIncidentFindingsHttp,
  273 │       ),
  274 │     ),

0.76 packages/alchemy/test/AWS/Shield/handler.ts:54:5
  51 │     // (AWS Health, source `aws.health`, service SHIELD). The deploy proves
  52 │     // the EventBridge rule + invoke permission wiring; events only fire on
  53 │     // subscribed accounts under active attack.
> 54 │     yield* Shield.consumeAttackEvents({}, (events) =>
  55 │       Stream.runForEach(events, (event) =>
  56 │         Effect.log(`shield attack event: ${event.detail.eventTypeCode}`),
  57 │       ),
  58 │     );

0.75 packages/alchemy/test/AWS/CodeBuild/handler.ts:441:9
  432 │       Layer.mergeAll(
  433 │         Lambda.EventSource,
  434 │         CodeBuild.StartBuildHttp,
  435 │         CodeBuild.BatchGetBuildsHttp,
  436 │         CodeBuild.StopBuildHttp,
  437 │         CodeBuild.RetryBuildHttp,
  438 │         CodeBuild.ListBuildsForProjectHttp,
  439 │         CodeBuild.BatchDeleteBuildsHttp,
  440 │         CodeBuild.InvalidateProjectCacheHttp,
> 441 │         CodeBuild.StartBuildBatchHttp,
  442 │         CodeBuild.StopBuildBatchHttp,
  443 │         CodeBuild.RetryBuildBatchHttp,
  444 │         CodeBuild.BatchGetBuildBatchesHttp,
  445 │         CodeBuild.ListBuildBatchesForProjectHttp,
  446 │         CodeBuild.DeleteBuildBatchHttp,
  447 │         CodeBuild.StartSandboxHttp,
  448 │         CodeBuild.StopSandboxHttp,
  449 │         CodeBuild.BatchGetSandboxesHttp,
  450 │         CodeBuild.ListSandboxesForProjectHttp,
  451 │         CodeBuild.StartCommandExecutionHttp,
  452 │         CodeBuild.BatchGetCommandExecutionsHttp,
  453 │         CodeBuild.ListCommandExecutionsForSandboxHttp,
  454 │         CodeBuild.ListReportsForReportGroupHttp,
  455 │         CodeBuild.BatchGetReportsHttp,
  456 │         CodeBuild.DescribeTestCasesHttp,
  457 │         CodeBuild.DescribeCodeCoveragesHttp,
  458 │         CodeBuild.GetReportGroupTrendHttp,
  459 │         CodeBuild.DeleteReportHttp,
  460 │       ),

0.75 packages/alchemy/test/AWS/DocDB/slow-handler.ts:48:2
  47 │ /**
> 48 │  * Data-plane fixture: deploys a real DocumentDB cluster + instance

0.75 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:50:5
> 50 │     const cluster = yield* DocDBElastic.Cluster("SlowDocuments", {
  51 │       adminUserName: "alchemyadmin",
  52 │       adminUserPassword: Redacted.make("AlchemyTestPassw0rd"),
  53 │       shardCapacity: 2,
  54 │       shardCount: 1,
  55 │       subnetIds: network.subnetIds,
  56 │       vpcSecurityGroupIds: network.securityGroupIds,
  57 │       tags: { fixture: "docdb-elastic-bindings" },
  58 │     });

0.75 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:105:5
> 105 │     const valkey = yield* AWS.ElastiCache.ReplicationGroup("Valkey", {
  106 │       description: "Alchemy provisioned Valkey data-plane test",
  107 │       engine: "valkey",
  108 │       nodeType: "cache.t4g.micro",
  109 │       subnetGroupName: net.subnetGroupName,
  110 │       securityGroupIds: [net.securityGroupId],
  111 │       replicasPerNodeGroup: 0,
  112 │       transitEncryptionEnabled: false,
  113 │     });

0.75 packages/alchemy/test/AWS/GreengrassV2/handler.ts:341:9
  338 │     Effect.provide(
  339 │       Layer.mergeAll(
  340 │         Lambda.EventSource,
> 341 │         GreengrassV2.GetComponentHttp,
  342 │         GreengrassV2.DescribeComponentHttp,
  343 │         GreengrassV2.GetComponentVersionArtifactHttp,
  344 │         GreengrassV2.GetDeploymentHttp,
  345 │         GreengrassV2.CancelDeploymentHttp,
  346 │         GreengrassV2.ListComponentsHttp,
  347 │         GreengrassV2.ListComponentVersionsHttp,
  348 │         GreengrassV2.ListDeploymentsHttp,
  349 │         GreengrassV2.ListCoreDevicesHttp,
  350 │         GreengrassV2.GetCoreDeviceHttp,
  351 │         GreengrassV2.DeleteCoreDeviceHttp,
  352 │         GreengrassV2.ListInstalledComponentsHttp,
  353 │         GreengrassV2.ListEffectiveDeploymentsHttp,
  354 │         GreengrassV2.ListClientDevicesAssociatedWithCoreDeviceHttp,
  355 │         GreengrassV2.BatchAssociateClientDeviceWithCoreDeviceHttp,
  356 │         GreengrassV2.BatchDisassociateClientDeviceFromCoreDeviceHttp,
  357 │         GreengrassV2.GetConnectivityInfoHttp,
  358 │         GreengrassV2.UpdateConnectivityInfoHttp,
  359 │         GreengrassV2.ResolveComponentCandidatesHttp,
  360 │       ),
  361 │     ),

0.75 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:341:3
> 341 │   ),
  342 │ );

0.75 packages/alchemy/test/AWS/IoTFleetWise/bindings-handler.ts:303:9
  291 │     Effect.provide(
  292 │       Layer.mergeAll(
  293 │         IoTFleetWise.GetVehicleStatusHttp,
  294 │         IoTFleetWise.ListFleetsForVehicleHttp,
  295 │         IoTFleetWise.ListVehiclesInFleetHttp,
  296 │         IoTFleetWise.AssociateVehicleFleetHttp,
  297 │         IoTFleetWise.DisassociateVehicleFleetHttp,
  298 │         IoTFleetWise.UpdateCampaignHttp,
  299 │         IoTFleetWise.ListSignalCatalogNodesHttp,
  300 │         IoTFleetWise.ListModelManifestNodesHttp,
  301 │         IoTFleetWise.ListDecoderManifestNetworkInterfacesHttp,
  302 │         IoTFleetWise.ListDecoderManifestSignalsHttp,
> 303 │         IoTFleetWise.BatchCreateVehicleHttp,
  304 │         IoTFleetWise.BatchUpdateVehicleHttp,
  305 │         IoTFleetWise.ListVehiclesHttp,
  306 │       ),
  307 │     ),

0.75 packages/alchemy/test/AWS/Polly/handler.ts:50:5
  47 │ export const PollyFixturesLive = Layer.effect(
  48 │   PollyFixtures,
  49 │   Effect.gen(function* () {
> 50 │     const bucket = yield* AWS.S3.Bucket("PollyTaskOutput", {
  51 │       bucketName: BUCKET,
  52 │       forceDestroy: true,
  53 │     });
  54 │     const lexicon = yield* AWS.Polly.Lexicon("BindingsLexicon", {
  55 │       lexiconName: LEXICON_NAME,
  56 │       content: PLS_CONTENT,
  57 │     });
  58 │     return { bucket, lexicon };
  59 │   }),
  60 │ );

0.75 packages/alchemy/test/AWS/QApps/bindings-handler.ts:44:5
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

0.75 packages/alchemy/test/AWS/Rekognition/handler.ts:56:5
  54 │   Effect.gen(function* () {
  55 │     // --- image analysis ---
> 56 │     const compareFaces = yield* Rekognition.CompareFaces();
  57 │     const detectFaces = yield* Rekognition.DetectFaces();
  58 │     const detectLabels = yield* Rekognition.DetectLabels();
  59 │     const detectModerationLabels = yield* Rekognition.DetectModerationLabels();

0.75 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:44:9
  23 │ export class LocalRemoteContainerObject extends Cloudflare.DurableObject<LocalRemoteContainerObject>()(
  24 │   "LocalRemoteContainerObject",
  25 │   Effect.gen(function* () {
  26 │     const container = yield* LocalRemoteContainer;
  27 │
  28 │     return Effect.gen(function* () {
  29 │       const { fetch } = yield* container.getTcpPort(8080);
  30 │
  31 │       return {
  32 │         hello: () =>
  33 │           Effect.gen(function* () {
  34 │             const response = yield* fetch(
  35 │               HttpClientRequest.get("http://container/"),
  36 │             );
  37 │             return yield* response.text;
  38 │           }),
  39 │       };
  40 │     });
  41 │   }).pipe(
  42 │     Effect.provide(
  43 │       Cloudflare.Containers.layer(LocalRemoteContainer, {
> 44 │         enableInternet: true,
  45 │       }),
  46 │     ),
  47 │   ),
  48 │ ) {}

0.75 packages/alchemy/test/Cloudflare/R2/fixtures/r2-local-worker.ts:30:7
  27 │     const url = new URL(request.url);
  28 │     if (url.pathname === "/seed") {
  29 │       // Writes without deleting, so the test can verify out-of-band (via
> 30 │       // the cloud API for an `Alchemy.remote()` bucket) that the object
  31 │       // actually landed in the bound bucket.
  32 │       await env.BUCKET.put("seed.txt", "seeded by worker", {
  33 │         httpMetadata: { contentType: "text/plain" },
  34 │       });
  35 │       const head = await env.BUCKET.head("seed.txt");
  36 │       return Response.json({ etag: head?.etag ?? null });
  37 │     }

0.74 packages/alchemy/src/AWS/SES/RenderEmailTemplateHttp.ts:6:1
   3 │ import { makeTemplateScopedHttpBinding } from "./BindingHttp.ts";
   4 │ import { RenderEmailTemplate } from "./RenderEmailTemplate.ts";
   5 │
>  6 │ export const RenderEmailTemplateHttp = Layer.effect(
   7 │   RenderEmailTemplate,
   8 │   makeTemplateScopedHttpBinding({
   9 │     tag: "AWS.SES.RenderEmailTemplate",
  10 │     operation: sesv2.testRenderEmailTemplate,
  11 │     actions: ["ses:TestRenderEmailTemplate"],
  12 │   }),
  13 │ );

0.74 packages/alchemy/test/AWS/ApiGateway/TestLease.ts:54:5
  51 │   let held = false;
  52 │
  53 │   const acquire = Effect.gen(function* () {
> 54 │     const fs = yield* FileSystem.FileSystem;

0.74 packages/alchemy/test/AWS/CodeConnections/handler.ts:106:9
  104 │     Effect.provide(
  105 │       Layer.mergeAll(
> 106 │         CodeConnections.GetConnectionHttp,
  107 │         CodeConnections.ListConnectionsHttp,
  108 │         CodeConnections.ListHostsHttp,
  109 │         CodeConnections.ListRepositoryLinksHttp,
  110 │       ),
  111 │     ),

0.74 packages/alchemy/test/AWS/DMS/handler.ts:62:5
  59 │     // Deploy-time: creates the EventBridge rule (default bus, source
  60 │     // aws.dms) targeting this Function. Runtime firing needs a replication
  61 │     // instance/task lifecycle; the test verifies the rule deploys.
> 62 │     yield* DMS.consumeReplicationEvents({ kinds: ["task-state"] }, (events) =>
  63 │       Stream.runForEach(events, (event) =>
  64 │         Effect.log(
  65 │           `dms replication event: ${event.detail.sourceId} -> ${event.detail.eventType}`,
  66 │         ),
  67 │       ),
  68 │     );

0.74 packages/alchemy/test/AWS/EMR/slow-handler.ts:18:2
  17 │ /**
> 18 │  * Cluster-scoped binding fixture: deploys a real single-node Spark cluster

0.74 packages/alchemy/test/AWS/EMRContainers/handler.ts:46:13
  40 │     const template = yield* EMRContainers.JobTemplate("BindingTemplate", {
  41 │       jobTemplateData: {
  42 │         executionRoleArn: jobRole.roleArn,
  43 │         releaseLabel: "emr-7.5.0-latest",
  44 │         jobDriver: {
  45 │           sparkSubmitJobDriver: {
> 46 │             entryPoint: "s3://alchemy-test-emrc/scripts/etl.py",
  47 │           },
  48 │         },
  49 │       },
  50 │     });

0.74 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:282:9
  280 │     Effect.provide(
  281 │       Layer.mergeAll(
> 282 │         AWS.IoT.GetThingShadowHttp,
  283 │         AWS.IoT.UpdateThingShadowHttp,
  284 │         AWS.IoT.DeleteThingShadowHttp,
  285 │         AWS.IoT.ListNamedShadowsForThingHttp,
  286 │         AWS.IoT.DescribeThingHttp,
  287 │         AWS.IoT.PublishHttp,
  288 │         AWS.IoT.GetRetainedMessageHttp,
  289 │         AWS.IoT.ListRetainedMessagesHttp,
  290 │         AWS.IoT.DescribeEndpointHttp,
  291 │         AWS.IoT.ListThingsHttp,
  292 │         AWS.IoT.GetConnectionHttp,
  293 │         AWS.IoT.ListSubscriptionsHttp,
  294 │         AWS.IoT.DeleteConnectionHttp,
  295 │         AWS.IoT.SendDirectMessageHttp,
  296 │       ),
  297 │     ),

0.74 packages/alchemy/test/AWS/MWAA/bindings-handler.ts:74:2
  73 │ /**
> 74 │  * Environment-scoped binding fixture: deploys a real MWAA environment

0.74 packages/alchemy/test/AWS/Neptune/fixtures/handler.ts:214:9
  211 │     Effect.provide(
  212 │       Layer.mergeAll(
  213 │         Lambda.EventSource,
> 214 │         Neptune.DescribeDBClustersHttp,
  215 │         Neptune.DescribeDBInstancesHttp,
  216 │         Neptune.DescribeDBClusterEndpointsHttp,
  217 │         Neptune.DescribeEventsHttp,
  218 │         Neptune.DescribeDBClusterSnapshotsHttp,
  219 │         Neptune.DeleteDBClusterSnapshotHttp,
  220 │         Neptune.CopyDBClusterSnapshotHttp,
  221 │         Neptune.DescribePendingMaintenanceActionsHttp,
  222 │         Neptune.ApplyPendingMaintenanceActionHttp,
  223 │       ),
  224 │     ),

0.74 packages/alchemy/test/AWS/OAM/TestLease.ts:56:7
  55 │     const tryWriteOwner = fs
> 56 │       .writeFileString(ownerFile, String(process.pid))
  57 │       .pipe(
  58 │         Effect.as(true),
  59 │         Effect.catchCause(() => Effect.succeed(false)),
  60 │       );

0.74 packages/alchemy/test/Cloudflare/Email/fixtures/sender.ts:9:2
  6 │ /**
  7 │  * `send_email` binding for the deployed test Worker. Restricted to the
  8 │  * sender/destination pair supplied via env so the e2e test exercises a
> 9 │  * real `.send()` round-trip against Cloudflare.

0.74 packages/alchemy/test/Cloudflare/Queue/fixtures/queue.ts:9:1
> 9 │ export const TestQueue = Cloudflare.Queues.Queue("QueueBindingTestQueue");

0.74 packages/alchemy/test/Cloudflare/Vectorize/fixtures/effect-worker.ts:28:5
  26 │   Effect.gen(function* () {
  27 │     const index = yield* TestIndex;
> 28 │     const vec = yield* Cloudflare.Vectorize.SearchIndex(index);

0.73 packages/alchemy/test/AWS/AppRunner/fixtures/handler.ts:32:5
  31 │   Effect.gen(function* () {
> 32 │     const service = yield* AppRunner.Service("BindingsService", {
  33 │       serviceName: "alchemy-test-apprunner-bind",
  34 │       imageRepository: {
  35 │         imageIdentifier:
  36 │           "public.ecr.aws/aws-containers/hello-app-runner:latest",
  37 │         imageRepositoryType: "ECR_PUBLIC",
  38 │         port: "8000",
  39 │       },
  40 │       instanceConfiguration: { cpu: "256", memory: "512" },
  41 │     });

0.73 packages/alchemy/test/AWS/Athena/handler.ts:41:5
  38 │   Effect.gen(function* () {
  39 │     // Single bucket holds the CSV source data (under data/), the Athena query
  40 │     // results (under results/), and the event-source markers (under events/).
> 41 │     const bucket = yield* S3.Bucket("AthenaBucket", { forceDestroy: true });

0.73 packages/alchemy/test/AWS/AutoScaling/TestNetwork.ts:20:3
  19 │ export const getTestAmiId: Effect.Effect<string, any, any> = ec2
> 20 │   .describeImages({
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

0.73 packages/alchemy/test/AWS/Batch/handler.ts:31:7
  28 │   Effect.gen(function* () {
  29 │     const unmanagedServiceRole = process.env.AWS_TEST_SLOW
  30 │       ? undefined
> 31 │       : yield* IAM.Role("BatchServiceRole", {
  32 │           assumeRolePolicyDocument: {
  33 │             Version: "2012-10-17",
  34 │             Statement: [
  35 │               {
  36 │                 Effect: "Allow",
  37 │                 Principal: { Service: "batch.amazonaws.com" },
  38 │                 Action: ["sts:AssumeRole"],
  39 │               },
  40 │             ],
  41 │           },
  42 │           managedPolicyArns: [
  43 │             "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole",
  44 │           ],
  45 │         });

0.73 packages/alchemy/test/AWS/CloudFormation/handler.ts:230:9
  228 │     Effect.provide(
  229 │       Layer.mergeAll(
> 230 │         CloudFormation.DescribeStacksHttp,
  231 │         CloudFormation.DescribeStackEventsHttp,
  232 │         CloudFormation.DescribeStackResourcesHttp,
  233 │         CloudFormation.ListStackResourcesHttp,
  234 │         CloudFormation.GetTemplateHttp,
  235 │         CloudFormation.DetectStackDriftHttp,
  236 │         CloudFormation.DescribeStackResourceDriftsHttp,
  237 │         CloudFormation.SignalResourceHttp,
  238 │         CloudFormation.ListExportsHttp,
  239 │         CloudFormation.ListImportsHttp,
  240 │         CloudFormation.DescribeStackDriftDetectionStatusHttp,
  241 │         CloudFormation.ValidateTemplateHttp,
  242 │       ),
  243 │     ),

0.73 packages/alchemy/test/AWS/DataZone/handler.ts:197:9
  194 │     Effect.provide(
  195 │       Layer.mergeAll(
  196 │         Lambda.EventSource,
> 197 │         DataZone.SearchHttp,
  198 │         DataZone.SearchListingsHttp,
  199 │         DataZone.SearchTypesHttp,
  200 │         DataZone.GetListingHttp,

0.73 packages/alchemy/test/AWS/ElastiCache/handler.ts:32:5
  24 │ export const FixtureCacheLive = Layer.effect(
  25 │   FixtureCache,
  26 │   Effect.gen(function* () {
  27 │     // Valkey is the cheapest engine; usage limits are pinned to the service
  28 │     // minimums (1 GB storage, 1000 ECPUs/s) purely for cost control. Subnets
  29 │     // and security group are left to the API defaults: the account's default
  30 │     // VPC and its DEFAULT security group — the same network the fixture
  31 │     // Lambda attaches to below.
> 32 │     const cache = yield* AWS.ElastiCache.ServerlessCache("FixtureCache", {
  33 │       engine: "valkey",
  34 │       description: "alchemy elasticache fixture",
  35 │       cacheUsageLimits: {
  36 │         dataStorage: { maximum: 1 },
  37 │         ecpuPerSecond: { maximum: 1000 },
  38 │       },
  39 │       tags: { fixture: "elasticache-serverless" },
  40 │     });
  41 │     return { cache };
  42 │   }),
  43 │ );

0.73 packages/alchemy/test/AWS/FIS/handler.ts:227:9
  224 │     Effect.provide(
  225 │       Layer.mergeAll(
  226 │         Lambda.EventSource,
> 227 │         FIS.StartExperimentHttp,
  228 │         FIS.GetExperimentTemplateHttp,
  229 │         FIS.GetExperimentHttp,
  230 │         FIS.StopExperimentHttp,
  231 │         FIS.ListExperimentsHttp,
  232 │         FIS.ListExperimentResolvedTargetsHttp,
  233 │         FIS.ListExperimentTemplatesHttp,
  234 │         FIS.GetActionHttp,
  235 │         FIS.ListActionsHttp,
  236 │         FIS.GetTargetResourceTypeHttp,
  237 │         FIS.ListTargetResourceTypesHttp,
  238 │         FIS.GetSafetyLeverHttp,
  239 │         FIS.UpdateSafetyLeverStateHttp,
  240 │         FIS.GetExperimentTargetAccountConfigurationHttp,
  241 │         FIS.ListExperimentTargetAccountConfigurationsHttp,
  242 │       ),
  243 │     ),

0.73 packages/alchemy/test/AWS/Kafka/kafka-handler.ts:52:5
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

0.73 packages/alchemy/test/AWS/ObservabilityAdmin/handler.ts:133:9
  131 │     Effect.provide(
  132 │       Layer.mergeAll(
> 133 │         ObservabilityAdmin.ListResourceTelemetryHttp,
  134 │         ObservabilityAdmin.GetTelemetryEvaluationStatusHttp,
  135 │         ObservabilityAdmin.GetTelemetryEnrichmentStatusHttp,
  136 │         ObservabilityAdmin.ListTelemetryRulesHttp,
  137 │         ObservabilityAdmin.GetTelemetryRuleHttp,
  138 │       ),
  139 │     ),

0.73 packages/alchemy/test/AWS/SES/handler.ts:441:5
  423 │     Effect.provide(
  424 │       Layer.mergeAll(
  425 │         Lambda.EventSource,
  426 │         SES.SendEmailHttp,
  427 │         SES.SendBulkEmailHttp,
  428 │         SES.RenderEmailTemplateHttp,
  429 │         SES.GetAccountHttp,
  430 │         SES.PutSuppressedDestinationHttp,
  431 │         SES.GetSuppressedDestinationHttp,
  432 │         SES.ListSuppressedDestinationsHttp,
  433 │         SES.DeleteSuppressedDestinationHttp,
  434 │         SES.SendBounceHttp,
  435 │         SES.SendCustomVerificationEmailHttp,
  436 │         SES.GetMessageInsightsHttp,
  437 │         SES.BatchGetMetricDataHttp,
  438 │         SES.GetDomainStatisticsReportHttp,
  439 │         SES.GetBlacklistReportsHttp,
  440 │       ),
> 441 │     ),
  442 │   ),
  443 │ );

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:35:5
  32 │     // `proxyChain` defers the connect to the first query, so the pool opens
  33 │     // inside a fetch event — where the per-event scope is provided — not
  34 │     // here at init.
> 35 │     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  36 │     const db = yield* Drizzle.Postgres(conn.connectionString, { relations });

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/db.ts:37:5
  15 │ export const Db = Effect.gen(function* () {
  16 │   // Resolved inside the effect (not at module scope) so it only runs at
  17 │   // deploy time — `import.meta.url` is undefined in the bundled worker.
  18 │   const configPath = yield* Effect.sync(() =>
  19 │     path.join(
  20 │       import.meta.url ? fileURLToPath(import.meta.url) : ".",
  21 │       "..",
  22 │       "prisma.config.ts",
  23 │     ),
  24 │   );
  25 │
  26 │   const contract = yield* Prisma.Contract("PrismaOrmContract", {
  27 │     config: configPath,
  28 │   });
  29 │
  30 │   const project = yield* Neon.Project("PrismaOrmProject", {
  31 │     region: "aws-us-east-1",
  32 │   });
  33 │
  34 │   const branch = yield* Neon.Branch("PrismaOrmBranch", { project });
  35 │
  36 │   const migrate = yield* Prisma.Migrate("PrismaOrmMigrate", {
> 37 │     url: branch.connectionUri,
  38 │     contract,
  39 │   });
  40 │
  41 │   return { contract, project, branch, migrate };
  42 │ });

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/worker.ts:27:5
  26 │   Effect.gen(function* () {
> 27 │     const conn = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  28 │     const db = yield* PrismaPostgres.Postgres(conn.connectionString, {
  29 │       contract,
  30 │     });

0.73 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:43:3
  42 │ export const getText = (url: string) =>
> 43 │   HttpClient.get(url, {
  44 │     headers: { connection: "close", "cache-control": "no-cache" },
  45 │   }).pipe(
  46 │     Effect.flatMap((response) =>
  47 │       response.status === 200
  48 │         ? response.text
  49 │         : Effect.fail(new Error(`Website returned HTTP ${response.status}`)),
  50 │     ),
  51 │     Effect.timeout("10 seconds"),
  52 │   );

0.73 packages/alchemy/test/SQL/exercise.ts:61:2
  59 │ /**
  60 │  * Drive the dialect-agnostic `SqlClient` surface (the shared routes in
> 61 │  * `fixtures/routes.ts`) against one deployed worker. Covers, in order:

0.72 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsLocal.ts:47:1
> 47 │ export const ReadFlagsLocal = Layer.effect(
  48 │   ReadFlags,
  49 │   Effect.gen(function* () {
  50 │     // Account + credentials are ambient during stack-eval (the stack's
  51 │     // providers layer). Capture the full context so the evaluate op can run
  52 │     // with the current credentials — no `host.bind`, no minted token.
  53 │     const { accountId } = yield* yield* CloudflareEnvironment;
  54 │     const context = yield* Effect.context<
  55 │       Credentials | HttpClient.HttpClient
  56 │     >();
  57 │     const auth: FlagshipAuth = {
  58 │       authorize: (eff) => eff.pipe(Effect.provideContext(context)),
  59 │       accountId,
  60 │     };
  61 │
  62 │     return Effect.fn(function* (app: App) {
  63 │       // Deferred accessor — resolves the appId against the tracker at apply
  64 │       // time (in an Action, that's the engine's resolve context).
  65 │       const appId = yield* app.appId;
  66 │       return makeHttpFlagshipClient(auth, appId);
  67 │     });
  68 │   }),
  69 │ );

0.72 packages/alchemy/test/AWS/Comprehend/handler.ts:607:11
  604 │           request.method === "POST" &&
  605 │           pathname === "/jobs/sentiment/lifecycle"
  606 │         ) {
> 607 │           yield* putObject({
  608 │             Key: "comprehend-input/reviews.txt",
  609 │             Body: "I love this product, it works wonderfully!\nThe delivery was late and the box arrived damaged.\n",
  610 │             ContentType: "text/plain",
  611 │           });

0.72 packages/alchemy/test/AWS/ECS/handler.ts:234:9
  232 │     Effect.provide(
  233 │       Layer.mergeAll(
> 234 │         ECS.RunTaskHttp,
  235 │         ECS.StopTaskHttp,
  236 │         ECS.DescribeTasksHttp,
  237 │         ECS.ListTasksHttp,
  238 │         ECS.DescribeServicesHttp,
  239 │         ECS.ListServicesHttp,
  240 │         ECS.ListContainerInstancesHttp,
  241 │         ECS.GetTaskProtectionHttp,
  242 │         ECS.UpdateTaskProtectionHttp,
  243 │       ),
  244 │     ),

0.72 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:42:5
  41 │   Effect.gen(function* () {
> 42 │     const cluster = yield* EKS.Cluster("BindingsCluster", {
  43 │       clusterName: "alchemy-test-eks-bindings",
  44 │       roleArn,
  45 │       resourcesVpcConfig: {
  46 │         subnetIds,
  47 │         endpointPublicAccess: true,
  48 │         endpointPrivateAccess: true,
  49 │       },
  50 │     });

0.72 packages/alchemy/test/AWS/ElastiCache/bindings-handler.ts:163:9
  160 │     Effect.provide(
  161 │       Layer.mergeAll(
  162 │         Lambda.EventSource,
> 163 │         ElastiCache.DescribeServerlessCachesHttp,
  164 │         ElastiCache.DescribeServerlessCacheSnapshotsHttp,
  165 │         ElastiCache.DeleteServerlessCacheSnapshotHttp,
  166 │         ElastiCache.CopyServerlessCacheSnapshotHttp,
  167 │         ElastiCache.ExportServerlessCacheSnapshotHttp,
  168 │         ElastiCache.DescribeEventsHttp,
  169 │       ),
  170 │     ),

0.72 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:152:9
  150 │     Effect.provide(
  151 │       Layer.mergeAll(
> 152 │         IVSChat.CreateChatTokenHttp,
  153 │         IVSChat.SendEventHttp,
  154 │         IVSChat.DeleteMessageHttp,
  155 │         IVSChat.DisconnectUserHttp,
  156 │         Lambda.RoomMessageReviewEventSource,
  157 │       ),
  158 │     ),

0.72 packages/alchemy/test/AWS/RDS/fixtures/handler.ts:254:9
  252 │     Effect.provide(
  253 │       Layer.mergeAll(
> 254 │         RDS.DescribeDBClustersHttp,
  255 │         RDS.DescribeDBInstancesHttp,
  256 │         RDS.DescribeDBClusterEndpointsHttp,
  257 │         RDS.DescribeEventsHttp,
  258 │         RDS.DescribeDBClusterSnapshotsHttp,
  259 │         RDS.DescribeDBSnapshotsHttp,
  260 │         RDS.DeleteDBClusterSnapshotHttp,
  261 │         RDS.CopyDBClusterSnapshotHttp,
  262 │         RDS.DeleteDBSnapshotHttp,
  263 │         RDS.CopyDBSnapshotHttp,
  264 │         RDS.DescribePendingMaintenanceActionsHttp,
  265 │         RDS.ApplyPendingMaintenanceActionHttp,
  266 │       ),
  267 │     ),

0.72 packages/alchemy/test/Cloudflare/Dns/fixtures/effect.ts:23:5
  22 │   Effect.gen(function* () {
> 23 │     const dns = yield* Cloudflare.DNS.ReadWriteDns(Zone);

0.72 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/remote-worker.ts:14:2
   9 │ /**
  10 │  * `Alchemy.remote()` opts the Connection OUT of local emulation: even under
  11 │  * `alchemy dev` the live provider creates a real Hyperdrive config on
  12 │  * Cloudflare. The locally-served Worker's binding still passes through to
  13 │  * the config's origin (no `dev` override here), so SQL round-trips against
> 14 │  * the real Neon database fronted by the real config.

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/browser-local-worker.ts:19:9
  16 │     const url = new URL(request.url);
  17 │     try {
  18 │       if (url.pathname === "/title") {
> 19 │         const browser = await puppeteer.launch(env.BROWSER as any);
  20 │         try {
  21 │           const page = await browser.newPage();
  22 │           await page.setContent(PAGE_HTML);
  23 │           const title = await page.title();
  24 │           const heading = await page.$eval("h1", (el) => el.textContent);
  25 │           return Response.json({ title, heading });
  26 │         } finally {
  27 │           await browser.close();
  28 │         }
  29 │       }

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:19:3
  16 │ type State = Cloudflare.DurableObjectState["Service"];
  17 │
  18 │ const history = (state: State, table: string) =>
> 19 │   state.storage.sql
  20 │     .exec<HistoryRow>(
  21 │       `SELECT id, hash, created_at, name, applied_at FROM "${table}" ORDER BY id`,
  22 │     )
  23 │     .pipe(Effect.flatMap((cursor) => cursor.toArray()));

0.72 packages/alchemy/test/Docker/Runtime.ts:6:3
   3 │ import * as NodeNet from "node:net";
   4 │
   5 │ const swarmLocalNodeState = (): string | undefined => {
>  6 │   const result = NodeChildProcess.spawnSync(
   7 │     "docker",
   8 │     ["info", "--format", "{{.Swarm.LocalNodeState}}"],
   9 │     { stdio: ["ignore", "pipe", "ignore"] },
  10 │   );
  11 │   return result.status === 0 ? String(result.stdout).trim() : undefined;
  12 │ };

0.72 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:141:9
  138 │       HttpClient.HttpClient,
  139 │       Effect.gen(function* () {
  140 │         const client = yield* HttpClient.HttpClient;
> 141 │         return HttpClient.transform(client, (response, request) =>

0.71 packages/alchemy/test/AWS/EC2/fixtures/network-function.ts:35:5
  34 │   Effect.gen(function* () {
> 35 │     const network = yield* EC2.Network("Network", {
  36 │       cidrBlock: "10.77.0.0/16",
  37 │       // numeric — exercises the ec2:DescribeAvailabilityZones discovery path
  38 │       availabilityZones: 2,
  39 │       // exercises the region lookup for the endpoint service name
  40 │       gatewayEndpoints: ["s3"],
  41 │     });
  42 │
  43 │     const VpcId = yield* network.vpcId;
  44 │     const SubnetId = yield* network.publicSubnetIds[0];
  45 │
  46 │     return {
  47 │       fetch: Effect.gen(function* () {
  48 │         const request = yield* HttpServerRequest;
  49 │         const url = new URL(request.originalUrl);
  50 │
  51 │         if (request.method === "GET" && url.pathname === "/network") {
  52 │           const vpcId = yield* VpcId;
  53 │           const subnetId = yield* SubnetId;
  54 │           return yield* HttpServerResponse.json({ vpcId, subnetId });
  55 │         }
  56 │
  57 │         return HttpServerResponse.text("ok");
  58 │       }).pipe(Effect.orDie),
  59 │     };
  60 │   }),

0.71 packages/alchemy/test/AWS/EKS/handler.ts:129:9
  127 │     Effect.provide(
  128 │       Layer.mergeAll(
> 129 │         EKS.ListClustersHttp,
  130 │         EKS.ListAccessPoliciesHttp,
  131 │         EKS.DescribeClusterVersionsHttp,
  132 │         EKS.DescribeAddonVersionsHttp,
  133 │         EKS.DescribeAddonConfigurationHttp,
  134 │       ),
  135 │     ),

0.71 packages/alchemy/test/AWS/EMRServerless/handler.ts:304:9
  292 │     Effect.provide(
  293 │       Layer.mergeAll(
  294 │         Lambda.EventSource,
  295 │         EMRServerless.StartJobRunHttp,
  296 │         EMRServerless.GetJobRunHttp,
  297 │         EMRServerless.CancelJobRunHttp,
  298 │         EMRServerless.ListJobRunsHttp,
  299 │         EMRServerless.ListJobRunAttemptsHttp,
  300 │         EMRServerless.GetDashboardForJobRunHttp,
  301 │         EMRServerless.GetResourceDashboardHttp,
  302 │         EMRServerless.StartApplicationHttp,
  303 │         EMRServerless.StopApplicationHttp,
> 304 │         EMRServerless.StartSessionHttp,
  305 │         EMRServerless.GetSessionHttp,
  306 │         EMRServerless.TerminateSessionHttp,
  307 │         EMRServerless.ListSessionsHttp,
  308 │         EMRServerless.GetSessionEndpointHttp,
  309 │       ),
  310 │     ),

0.71 packages/alchemy/test/AWS/QuickSight/bindings-handler.ts:249:9
  247 │     Effect.provide(
  248 │       Layer.mergeAll(
> 249 │         QuickSight.CreateIngestionHttp,
  250 │         QuickSight.DescribeIngestionHttp,
  251 │         QuickSight.CancelIngestionHttp,
  252 │         QuickSight.ListIngestionsHttp,
  253 │         QuickSight.StartDashboardSnapshotJobHttp,
  254 │         QuickSight.DescribeDashboardSnapshotJobHttp,
  255 │         QuickSight.DescribeDashboardSnapshotJobResultHttp,
  256 │         QuickSight.GenerateEmbedUrlForRegisteredUserHttp,
  257 │         QuickSight.GenerateEmbedUrlForAnonymousUserHttp,
  258 │       ),
  259 │     ),

0.71 packages/alchemy/test/AWS/StepFunctions/handler.ts:509:9
  490 │     Effect.provide(
  491 │       Layer.mergeAll(
  492 │         StepFunctions.StartExecutionHttp,
  493 │         StepFunctions.StartSyncExecutionHttp,
  494 │         StepFunctions.DescribeExecutionHttp,
  495 │         StepFunctions.StopExecutionHttp,
  496 │         StepFunctions.SendTaskSuccessHttp,
  497 │         StepFunctions.SendTaskFailureHttp,
  498 │         StepFunctions.SendTaskHeartbeatHttp,
  499 │         StepFunctions.ValidateStateMachineDefinitionHttp,
  500 │         StepFunctions.TestStateHttp,
  501 │         StepFunctions.GetActivityTaskHttp,
  502 │         StepFunctions.ListExecutionsHttp,
  503 │         StepFunctions.GetExecutionHistoryHttp,
  504 │         StepFunctions.RedriveExecutionHttp,
  505 │         StepFunctions.ListMapRunsHttp,
  506 │         StepFunctions.DescribeMapRunHttp,
  507 │         StepFunctions.UpdateMapRunHttp,
  508 │         Lambda.EventSource,
> 509 │         SQS.ReceiveMessageHttp,
  510 │         SQS.DeleteMessageHttp,
  511 │       ),
  512 │     ),

0.71 packages/alchemy/test/Cloudflare/KV/fixtures/kv-local-worker.ts:5:1
  2 │ // put / get / getWithMetadata / list / delete. The binding under test is
  3 │ // selected with `?binding=NAME` (default `KV`) so one worker can exercise
  4 │ // several namespaces — e.g. a locally-simulated one and an
> 5 │ // `Alchemy.remote()`-opted one side by side.

0.71 packages/alchemy/test/Cloudflare/Tunnel/fixtures/effect.ts:103:9
  101 │     Effect.provide(
  102 │       Layer.mergeAll(
> 103 │         Cloudflare.Tunnel.ReadTunnelBinding,
  104 │         Cloudflare.Tunnel.WriteTunnelBinding,
  105 │         Cloudflare.Tunnel.ReadWriteTunnelBinding,
  106 │       ),
  107 │     ),

0.71 packages/alchemy/test/Local/fixtures/rpc-spawner-parent.ts:27:5
  23 │ const program = Effect.gen(function* () {
  24 │   const sp = yield* RpcSpawner;
  25 │   const http = yield* HttpClient.HttpClient;
  26 │   const res = yield* http
> 27 │     .post(sp.url, {
  28 │       body: yield* HttpBody.json({
  29 │         serverEntryUrl: childEntry,
  30 │         alchemyContext: {
  31 │           dotAlchemy: "/tmp/.alchemy",
  32 │           updateStateStore: false,
  33 │           dev: true,
  34 │           adopt: false,
  35 │         },
  36 │         stack: { name: "test", stage: "dev" },
  37 │       }),
  38 │     })
  39 │     .pipe(Effect.flatMap((res) => res.text));
  40 │
  41 │   // The child's pid is whatever owns the listening port returned in res.
  42 │   // We surface it for the test harness via stdout.
  43 │   console.log(`PARENT_PID=${process.pid}\n`);
  44 │   console.log(`CHILD_URL=${res}\n`);
  45 │
  46 │   const stop = yield* Deferred.make<void>();
  47 │   yield* Deferred.await(stop);
  48 │ });
```
