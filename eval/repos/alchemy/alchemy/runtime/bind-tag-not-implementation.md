# alchemy/runtime/bind-tag-not-implementation

When a runtime is split into a Tag class and a make Layer, other runtimes must import and bind only the Tag, and only the Stack provides the Layer; another Worker or Function must never import or provide that implementation Layer.

13 findings, from 0.80 down to 0.71. Each showed this hint:

```ts
// src/Admin.ts
import { Api } from "./Api.ts";

export default Cloudflare.Worker("Admin", { main: import.meta.url },
  Effect.gen(function* () {
    const api = yield* Cloudflare.Workers.bindWorker(Api);
    return { fetch: Effect.gen(function* () { return yield* api.fetch(yield* HttpServerRequest.HttpServerRequest); }) };
  }),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.80 packages/alchemy/test/AWS/Grafana/handler.ts:57:3
> 57 │   }).pipe(Effect.provide(Grafana.ListVersionsHttp)),
  58 │ );

0.78 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:103:9
  101 │     Effect.provide(
  102 │       Layer.mergeAll(
> 103 │         SageMaker.DescribeEndpointHttp,
  104 │         SageMaker.UpdateEndpointWeightsAndCapacitiesHttp,
  105 │       ),
  106 │     ),

0.75 packages/alchemy/test/AWS/SimpleDB/handler.ts:151:9
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

0.74 packages/alchemy/test/AWS/KinesisAnalyticsV2/handler.ts:326:7
  310 │     Effect.provide(
  311 │       Layer.mergeAll(
  312 │         KinesisAnalyticsV2.DescribeApplicationHttp,
  313 │         KinesisAnalyticsV2.DescribeApplicationVersionHttp,
  314 │         KinesisAnalyticsV2.ListApplicationVersionsHttp,
  315 │         KinesisAnalyticsV2.DescribeApplicationOperationHttp,
  316 │         KinesisAnalyticsV2.ListApplicationOperationsHttp,
  317 │         KinesisAnalyticsV2.StartApplicationHttp,
  318 │         KinesisAnalyticsV2.StopApplicationHttp,
  319 │         KinesisAnalyticsV2.RollbackApplicationHttp,
  320 │         KinesisAnalyticsV2.CreateApplicationSnapshotHttp,
  321 │         KinesisAnalyticsV2.DescribeApplicationSnapshotHttp,
  322 │         KinesisAnalyticsV2.ListApplicationSnapshotsHttp,
  323 │         KinesisAnalyticsV2.DeleteApplicationSnapshotHttp,
  324 │         KinesisAnalyticsV2.CreateApplicationPresignedUrlHttp,
  325 │         KinesisAnalyticsV2.ListApplicationsHttp,
> 326 │       ),
  327 │     ),
  328 │   ),
  329 │ );

0.73 packages/alchemy/test/AWS/DocDBElastic/handler.ts:151:5
> 151 │     Effect.provide(
  152 │       Layer.mergeAll(
  153 │         DocDBElastic.ListClusterSnapshotsHttp,
  154 │         DocDBElastic.GetClusterSnapshotHttp,
  155 │         DocDBElastic.DeleteClusterSnapshotHttp,
  156 │         DocDBElastic.CopyClusterSnapshotHttp,
  157 │         DocDBElastic.RestoreClusterFromSnapshotHttp,
  158 │         DocDBElastic.ListPendingMaintenanceActionsHttp,
  159 │         DocDBElastic.GetPendingMaintenanceActionHttp,
  160 │         DocDBElastic.ApplyPendingMaintenanceActionHttp,
  161 │       ),
  162 │     ),

0.73 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:240:13
  237 │           const identityProviderConfigTag =
  238 │             yield* describeIdentityProviderConfig({
  239 │               identityProviderConfig: { type: "oidc", name: BOGUS },
> 240 │             }).pipe(
  241 │               Effect.map(() => "Found"),
  242 │               Effect.catchTag(
  243 │                 ["ResourceNotFoundException", "InvalidParameterException"],
  244 │                 (e) => Effect.succeed(e._tag),
  245 │               ),
  246 │             );

0.73 packages/alchemy/test/AWS/SocialMessaging/bindings-handler.ts:281:9
  267 │     Effect.provide(
  268 │       Layer.mergeAll(
  269 │         SocialMessaging.SendWhatsAppMessageHttp,
  270 │         SocialMessaging.PostWhatsAppMessageMediaHttp,
  271 │         SocialMessaging.GetWhatsAppMessageMediaHttp,
  272 │         SocialMessaging.DeleteWhatsAppMessageMediaHttp,
  273 │         SocialMessaging.GetLinkedWhatsAppBusinessAccountPhoneNumberHttp,
  274 │         SocialMessaging.CreateWhatsAppMessageTemplateHttp,
  275 │         SocialMessaging.CreateWhatsAppMessageTemplateFromLibraryHttp,
  276 │         SocialMessaging.CreateWhatsAppMessageTemplateMediaHttp,
  277 │         SocialMessaging.GetWhatsAppMessageTemplateHttp,
  278 │         SocialMessaging.ListWhatsAppMessageTemplatesHttp,
  279 │         SocialMessaging.ListWhatsAppTemplateLibraryHttp,
  280 │         SocialMessaging.UpdateWhatsAppMessageTemplateHttp,
> 281 │         SocialMessaging.DeleteWhatsAppMessageTemplateHttp,
  282 │         SocialMessaging.CreateWhatsAppFlowHttp,
  283 │         SocialMessaging.GetWhatsAppFlowHttp,
  284 │         SocialMessaging.GetWhatsAppFlowPreviewHttp,
  285 │         SocialMessaging.ListWhatsAppFlowsHttp,
  286 │         SocialMessaging.ListWhatsAppFlowAssetsHttp,
  287 │         SocialMessaging.UpdateWhatsAppFlowHttp,
  288 │         SocialMessaging.UpdateWhatsAppFlowAssetsHttp,
  289 │         SocialMessaging.PublishWhatsAppFlowHttp,
  290 │         SocialMessaging.DeprecateWhatsAppFlowHttp,
  291 │         SocialMessaging.DeleteWhatsAppFlowHttp,
  292 │       ),
  293 │     ),

0.72 packages/alchemy/test/AWS/Backup/handler.ts:341:9
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

0.72 packages/alchemy/test/AWS/Rbin/handler.ts:76:3
> 76 │   }).pipe(Effect.provide(Layer.mergeAll(Rbin.GetRuleHttp, Rbin.ListRulesHttp))),
  77 │ );

0.71 packages/alchemy/test/AWS/ApplicationSignals/handler.ts:302:9
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

0.71 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:67:3
> 67 │   }).pipe(Effect.provide(Keyspaces.RestoreTableHttp)),
  68 │ );

0.71 packages/alchemy/test/Cloudflare/R2/fixtures/write-binding.ts:48:3
> 48 │   }).pipe(Effect.provide(Cloudflare.R2.WriteBucketBinding)),
  49 │ ) {}
```
