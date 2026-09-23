# errors/domain-errors-are-tagged

A domain failure must be a Schema.TaggedError with its own tag, never a bare Error or a plain object.

Since left out of the preset, for Effect's language service to check (4ae0126).

394 findings, from 0.94 down to 0.71. Each showed this hint:

```ts
class ValidationError extends Schema.TaggedError<ValidationError>()("ValidationError", {
  field: Schema.String,
  message: Schema.String,
}) {}

class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFoundError", {
  resource: Schema.String,
  id: Schema.String,
}) {}
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.94 packages/alchemy/src/Prisma/Internal/BundlePaths.ts:13
     new Error(`Invalid Compute bundle output path: ${input}`),
0.93 packages/alchemy/src/Prisma/Internal/DeploymentIdentity.ts:46
     new Error(
0.92 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:104
     new Error(
0.91 packages/alchemy/src/Prisma/Internal/AppIdentity.ts:16
     new Error(
0.91 packages/alchemy/test/AWS/S3/fixtures/server-event-source-task.ts:116
     new Error("Versioned S3 event omitted versionId"),
0.90 packages/alchemy/src/AWS/EventBridge/Rule.ts:662
     new Error(
0.90 packages/alchemy/src/AWS/MailManager/RuleSet.ts:281
     };
0.90 packages/alchemy/src/Neon/AuthTrustedDomain.ts:146
     new Error("Trusted origin was not visible after reconciliation"),
0.90 packages/alchemy/src/Prisma/Refs.ts:39
     return yield* Effect.fail(new Error(`Unable to resolve Prisma ${label}.`));
0.89 packages/alchemy/src/AWS/MailManager/AddonInstance.ts:238
     new Error(
0.89 packages/alchemy/src/Cloudflare/Gateway/Rule.ts:389
     new Error(
0.89 packages/alchemy/src/Cloudflare/Ruleset/Ruleset.ts:182
     if (zoneId === undefined) return undefined;
0.89 packages/alchemy/test/Cloudflare/Utils/Fixture.ts:54
     return yield* Effect.fail(
0.88 packages/alchemy/src/AWS/CloudWatch/InsightRule.ts:318
     return;
0.88 packages/alchemy/src/AWS/IAM/AccessKey.ts:143
     new Error(`AccessKey for user '${news.userName}' has no id`),
0.88 packages/alchemy/src/AWS/Organizations/OrganizationResourcePolicy.ts:142
     return yield* Effect.fail(
0.88 packages/alchemy/src/AWS/VpcLattice/AccessLogSubscription.ts:305
     list: () => Effect.succeed([] as AccessLogSubscription["Attributes"][]),
0.88 packages/alchemy/src/AWS/WAFv2/RuleGroup.ts:471
     );
0.88 packages/alchemy/src/Neon/AuthOAuthProvider.ts:220
     new Error("OAuth provider was not visible after reconciliation"),
0.87 packages/alchemy/src/AWS/AMP/RuleGroupsNamespace.ts:128
     new Error(
0.87 packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts:203
     new Error(`failed to read reconciled alarm mute rule '${name}'`),
0.87 packages/alchemy/src/AWS/DocDB/DBSubnetGroup.ts:162
     new Error(
0.87 packages/alchemy/src/AWS/IdentityCenter/Group.ts:151
     new Error(`group '${news.displayName}' not found after create`),
0.87 packages/alchemy/src/AWS/MailManager/AddonSubscription.ts:206
     new Error(
0.87 packages/alchemy/src/AWS/MailManager/Archive.ts:245
     new Error(
0.87 packages/alchemy/src/AWS/Neptune/DBSubnetGroup.ts:162
     new Error(
0.87 packages/alchemy/src/AWS/Organizations/Organization.ts:123
     new Error("failed to resolve organization after reconcile"),
0.87 packages/alchemy/src/AWS/VerifiedPermissions/Policy.ts:125
     new Error(
0.87 packages/alchemy/src/AWS/WAFv2/IPSet.ts:323
     new Error(`Failed to observe IPSet '${name}' after create`),
0.87 packages/alchemy/src/Cloudflare/Registrar/Domain.ts:221
     `domain in the Cloudflare dashboard first.`,
0.87 packages/alchemy/src/Neon/Website/Trace.ts:38
     new Error(`Website dependency trace exited ${code}`),
0.87 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:61
     new Error("Temperature property not found on the bound asset"),
0.87 packages/alchemy/test/Cloudflare/Workers/fixtures/http-server-worker.ts:38
     new Error(
0.86 packages/alchemy/src/AWS/EC2/Network.ts:381
     new Error("EC2.Network requires at least one availability zone"),
0.86 packages/alchemy/src/AWS/EKS/KubernetesAdapter.ts:467
     new Error(
0.86 packages/alchemy/src/AWS/EKS/internal/podIdentity.ts:201
     `PodIdentityAssociation '${namespace}/${serviceAccount}' could not be read after creation`,
0.86 packages/alchemy/src/AWS/IAM/InstanceProfile.ts:218
     new Error(
0.86 packages/alchemy/src/AWS/IdentityCenter/AccountAssignment.ts:373
     const waitForAssignmentCreation = (instanceArn: string, requestId: string) =>
0.86 packages/alchemy/src/AWS/IoTWireless/Destination.ts:181
     `IoT Wireless destination '${name}' returned without Arn`,
0.86 packages/alchemy/src/AWS/MailManager/Relay.ts:156
     new Error(
0.86 packages/alchemy/src/AWS/Route53/HostedZoneLookup.ts:56
     new Error(
0.86 packages/alchemy/src/AWS/Timestream/Table.ts:371
     yield* session.note(`Updated table ${tableName} configuration`);
0.86 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkServiceAssociation.ts:221
     new Error(
0.86 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkVpcAssociation.ts:181
     new Error("Failed to create service network VPC association"),
0.86 packages/alchemy/src/AWS/WAFv2/RegexPatternSet.ts:351
     new Error(
0.86 packages/alchemy/src/AWS/WAFv2/WebACL.ts:437
     return;
0.86 packages/alchemy/src/AWS/Website/SsrSite.ts:301
     new Error(
0.86 packages/alchemy/src/Prisma/Branch.ts:200
     ? Effect.fail(
0.86 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-lifecycle/worker.ts:495
     ? journal.applicationFailure(applicationError === "internal")
0.85 packages/alchemy/src/AWS/AuditManager/Assessment.ts:444
     return { ...attrs, tags: desiredTags };
0.85 packages/alchemy/src/AWS/AuditManager/Control.ts:301
     new Error(`CreateControl for '${name}' returned no control`),
0.85 packages/alchemy/src/AWS/B2BI/Transformer.ts:301
     );
0.85 packages/alchemy/src/AWS/Deadline/Farm.ts:258
     yield* session.note(`Updated farm ${displayName}`);
0.85 packages/alchemy/src/AWS/EC2/NetworkAclAssociation.ts:162
     return yield* Effect.fail(
0.85 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:313
     new Error(
0.85 packages/alchemy/src/AWS/EC2/Snapshot.ts:291
     return yield* Effect.fail(new Error(`Snapshot ${snapshotId} not found`));
0.85 packages/alchemy/src/AWS/EC2/Vpc.ts:623
     return yield* Effect.fail(new Error(`VPC ${vpcId} not found`));
0.85 packages/alchemy/src/AWS/IAM/SSHPublicKey.ts:136
     new Error(`uploadSSHPublicKey returned no key id`),
0.85 packages/alchemy/src/AWS/MailManager/IngressPoint.ts:302
     new Error(
0.85 packages/alchemy/src/AWS/Organizations/Account.ts:387
     new Error(
0.85 packages/alchemy/src/AWS/Organizations/PolicyAttachment.ts:201
     }
0.85 packages/alchemy/src/AWS/Organizations/TrustedServiceAccess.ts:146
     return yield* Effect.fail(
0.85 packages/alchemy/src/AWS/RAM/ResourceShare.ts:321
     }
0.85 packages/alchemy/src/AWS/SageMaker/Model.ts:262
     return yield* Effect.fail(
0.85 packages/alchemy/src/AWS/SocialMessaging/LinkedWhatsAppBusinessAccount.ts:301
     "LinkedWhatsAppBusinessAccount requires an accountId (link the WABA in the AWS console first)",
0.85 packages/alchemy/src/AWS/VpcLattice/Listener.ts:278
     new Error(`Failed to create listener ${name}`),
0.85 packages/alchemy/src/AWS/VpcLattice/Rule.ts:338
     return {
0.85 packages/alchemy/src/Cloudflare/Email/Domain.ts:234
     new Error(
0.85 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:61
     new Error(`Duplicate Neon Function route: ${path}`),
0.85 packages/alchemy/src/Prisma/Database.ts:541
     "Every Prisma database belongs to a Branch; the Management API rejects detaching (null). Omit both branchId and branchGi
0.85 packages/alchemy/src/Prisma/EnvironmentVariable.ts:263
     new Error(
0.85 packages/alchemy/test/AWS/Route53Resolver/helpers.ts:26
     new Error("default VPC has fewer than 2 default-for-AZ subnets"),
0.84 packages/alchemy/src/AWS/AppRunner/VpcConnector.ts:221
     const attrs = yield* toAttrs(connector);
0.84 packages/alchemy/src/AWS/ApplicationSignals/InstrumentationConfiguration.ts:323
     new Error(
0.84 packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts:186
     return yield* Effect.fail(
0.84 packages/alchemy/src/AWS/DirectoryService/ConditionalForwarder.ts:196
     new Error(
0.84 packages/alchemy/src/AWS/DirectoryService/Directory.ts:359
     : Unowned(attrs);
0.84 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:181
     ),
0.84 packages/alchemy/src/AWS/EKS/Addon.ts:402
     new Error(
0.84 packages/alchemy/src/AWS/EKS/Cluster.ts:1121
     new Error(
0.84 packages/alchemy/src/AWS/IAM/ServiceSpecificCredential.ts:224
     new Error(
0.84 packages/alchemy/src/AWS/IdentityCenter/Instance.ts:164
     new Error(
0.84 packages/alchemy/src/AWS/IdentityCenter/common.ts:58
     new Error(`Identity Center instance '${instanceArn}' was not found`),
0.84 packages/alchemy/src/AWS/Location/ApiKey.ts:321
     }),
0.84 packages/alchemy/src/AWS/Location/RouteCalculator.ts:171
     new Error(
0.84 packages/alchemy/src/AWS/MailManager/TrafficPolicy.ts:242
     new Error(
0.84 packages/alchemy/src/AWS/Organizations/DelegatedAdministrator.ts:222
     return yield* Effect.fail(
0.84 packages/alchemy/src/AWS/Organizations/OrganizationalUnit.ts:182
     new Error(
0.84 packages/alchemy/src/AWS/Organizations/Root.ts:182
     new Error(
0.84 packages/alchemy/src/AWS/QBusiness/Application.ts:502
     new Error(`failed to read reconciled application ${displayName}`),
0.84 packages/alchemy/src/AWS/QBusiness/DataSource.ts:261
     export class DataSourceProvisioningFailed extends Data.TaggedError(
0.84 packages/alchemy/src/AWS/RDS/DBParameterGroup.ts:351
     new Error(`Failed to create DB parameter group '${name}'`),
0.84 packages/alchemy/src/AWS/Redshift/ClusterParameterGroup.ts:213
     if (!observed?.ParameterGroupName) {
0.84 packages/alchemy/src/AWS/Timestream/ScheduledQuery.ts:383
     new Error(`failed to read reconciled scheduled query ${name}`),
0.84 packages/alchemy/src/Cloudflare/DNS/Record.ts:421
     new Error(
0.84 packages/alchemy/src/Prisma/Internal/DatabaseSecrets.ts:84
     new Error(
0.84 packages/alchemy/test/AWS/Lambda/fixtures/microvm/orchestrator.ts:119
     : Effect.fail(new Error(`microvm ${m.state}`)),
0.83 packages/alchemy/src/AWS/AppRunner/Service.ts:1461
     new Error(
0.83 packages/alchemy/src/AWS/CloudFront/OriginRequestPolicy.ts:265
     new Error("createOriginRequestPolicy returned no identifier"),
0.83 packages/alchemy/src/AWS/CloudFront/ResponseHeadersPolicy.ts:308
     new Error("createResponseHeadersPolicy returned no identifier"),
0.83 packages/alchemy/src/AWS/CloudWatch/Alarm.ts:252
     new Error(`failed to read reconciled alarm '${name}'`),
0.83 packages/alchemy/src/AWS/DSQL/Stream.ts:183
     new Error(`DSQL stream '${streamIdentifier}' not found`),
0.83 packages/alchemy/src/AWS/EC2/Volume.ts:523
     new Error(`Volume ${volumeId} entered error state`),
0.83 packages/alchemy/src/AWS/ECR/Repository.ts:261
     if (!repository?.repositoryArn || !repository.repositoryUri) {
0.83 packages/alchemy/src/AWS/EKS/PodIdentityAssociation.ts:242
     new Error(
0.83 packages/alchemy/src/AWS/FinSpace/KxDatabase.ts:168
     new Error("FinSpace KxDatabase requires props"),
0.83 packages/alchemy/src/AWS/IAM/ServerCertificate.ts:217
     new Error(`uploadServerCertificate returned no metadata`),
0.83 packages/alchemy/src/AWS/ImageBuilder/ImageRecipe.ts:201
     return {
0.83 packages/alchemy/src/AWS/IoTSiteWise/Asset.ts:381
     );
0.83 packages/alchemy/src/AWS/Kinesis/StreamConsumer.ts:204
     new Error(
0.83 packages/alchemy/src/AWS/LexV2/Intent.ts:315
     Effect.catchTag("PreconditionFailedException", () => Effect.void),
0.83 packages/alchemy/src/AWS/LexV2/SlotType.ts:262
     new Error(
0.83 packages/alchemy/src/AWS/Location/GeofenceCollection.ts:178
     return yield* Effect.fail(
0.83 packages/alchemy/src/AWS/MailManager/AddressList.ts:210
     new Error(
0.83 packages/alchemy/src/AWS/RDS/DBClusterParameterGroup.ts:221
     }
0.83 packages/alchemy/src/AWS/RDS/DBProxyTargetGroup.ts:286
     reconcile: Effect.fn(function* ({ news, output, session }) {
0.83 packages/alchemy/src/AWS/RDS/DBSubnetGroup.ts:202
     return yield* Effect.fail(
0.83 packages/alchemy/src/AWS/VpcLattice/ServiceNetwork.ts:361
     new Error(`Failed to create service network ${name}`),
0.83 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:1361
     `Container application for Durable Object namespace "${durableObjects.namespaceId}" already exists but could not be foun
0.83 packages/alchemy/src/Cloudflare/Devices/CustomProfile.ts:343
     const policyId = observed.policyId!;
0.83 packages/alchemy/src/Docker/BuildHash.ts:200
     if (ignoreFile === undefined) {
0.83 packages/alchemy/src/Kubernetes/Manifest.ts:281
     );
0.83 packages/alchemy/src/Prisma/Project.ts:202
     class GeneratedProjectNotVisible extends Error {}
0.82 packages/alchemy/src/AWS/AppRunner/ObservabilityConfiguration.ts:158
     new Error(
0.82 packages/alchemy/src/AWS/CloudFront/CachePolicy.ts:300
     new Error("updateCachePolicy returned no identifier"),
0.82 packages/alchemy/src/AWS/CloudFront/OriginAccessControl.ts:261
     }
0.82 packages/alchemy/src/AWS/CloudWatch/MetricStream.ts:290
     () => Effect.void,
0.82 packages/alchemy/src/AWS/DAX/ParameterGroup.ts:188
     new Error(`DAX parameter group '${name}' not found after create`),
0.82 packages/alchemy/src/AWS/Deadline/Queue.ts:421
     }),
0.82 packages/alchemy/src/AWS/EC2/InternetGateway.ts:561
     }),
0.82 packages/alchemy/src/AWS/ECRPublic/Repository.ts:306
     new Error(
0.82 packages/alchemy/src/AWS/EKS/FargateProfile.ts:225
     new Error(
0.82 packages/alchemy/src/AWS/IAM/Policy.ts:521
     Effect.catchTag("NoSuchEntityException", () =>
0.82 packages/alchemy/src/AWS/IAM/SAMLProvider.ts:226
     return yield* Effect.fail(
0.82 packages/alchemy/src/AWS/IoTFleetWise/Vehicle.ts:148
     new Error(
0.82 packages/alchemy/src/AWS/MediaConnect/Flow.ts:224
     new Error(`MediaConnect flow '${flowArn}' not found`),
0.82 packages/alchemy/src/AWS/MemoryDB/SubnetGroup.ts:100
     new Error(`Subnet group '${group.Name}' is missing its ARN`),
0.82 packages/alchemy/src/AWS/OpenSearch/Domain.ts:261
     never,
0.82 packages/alchemy/src/AWS/Organizations/TenantRoot.ts:361
     new Error(
0.82 packages/alchemy/src/AWS/QBusiness/Retriever.ts:342
     new Error(`failed to read created retriever ${displayName}`),
0.82 packages/alchemy/src/AWS/QBusiness/WebExperience.ts:303
     new Error("QBusiness WebExperience requires props"),
0.82 packages/alchemy/src/AWS/RAM/Permission.ts:368
     : { ...toAttrs(detail), tags: desiredTags };
0.82 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:261
     new Error(
0.82 packages/alchemy/src/AWS/SageMaker/Cluster.ts:781
     return attrs;
0.82 packages/alchemy/src/AWS/Scheduler/Schedule.ts:221
     if (!observed?.Arn) {
0.82 packages/alchemy/src/AWS/Transfer/User.ts:241
     );
0.82 packages/alchemy/src/Prisma/App.ts:201
     new Error(
0.82 packages/alchemy/src/Prisma/Internal/AppPromotion.ts:30
     new Error("timeoutSeconds must be a positive finite number."),
0.82 packages/alchemy/src/Prisma/SourceRepository.ts:432
     new Error(
0.81 packages/alchemy/src/AWS/ACM/AccountConfiguration.ts:146
     new Error(
0.81 packages/alchemy/src/AWS/AppRunner/AutoScalingConfiguration.ts:181
     }
0.81 packages/alchemy/src/AWS/AutoScaling/LifecycleHook.ts:323
     while: (error) => error._tag === "ResourceContentionFault",
0.81 packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts:267
     new Error(
0.81 packages/alchemy/src/AWS/DMS/Endpoint.ts:221
     new Error(
0.81 packages/alchemy/src/AWS/DMS/ReplicationSubnetGroup.ts:266
     new Error("DMS replication subnet group is missing its identifier"),
0.81 packages/alchemy/src/AWS/IAM/ServiceLinkedRole.ts:335
     if (!observed) {
0.81 packages/alchemy/src/AWS/IAM/VirtualMFADevice.ts:249
     new Error(`createVirtualMFADevice returned no serial number`),
0.81 packages/alchemy/src/AWS/IoTManagedIntegrations/CredentialLocker.ts:118
     new Error("credential locker response is missing Id, Arn, or Name"),
0.81 packages/alchemy/src/AWS/IoTWireless/WirelessGateway.ts:214
     return { action: "replace" } as const;
0.81 packages/alchemy/src/AWS/Kendra/SearchIndex.ts:501
     new Error(`failed to read reconciled index ${name}`),
0.81 packages/alchemy/src/AWS/Location/Tracker.ts:193
     new Error(`failed to read created tracker ${trackerName}`),
0.81 packages/alchemy/src/AWS/Neptune/DBParameterGroup.ts:323
     const arn = observed.DBParameterGroupArn;
0.81 packages/alchemy/src/AWS/QBusiness/SearchIndex.ts:343
     new Error(
0.81 packages/alchemy/src/AWS/QuickSight/Analysis.ts:281
     }),
0.81 packages/alchemy/src/AWS/SageMaker/ClusterSchedulerConfig.ts:361
     new Error(`failed to create cluster scheduler config ${name}`),
0.81 packages/alchemy/src/AWS/SageMaker/ComputeQuota.ts:380
     Tags: Object.entries(desiredTags).map(([Key, Value]) => ({
0.81 packages/alchemy/src/AWS/Scheduler/ScheduleGroup.ts:269
     Effect.catchTag("ResourceNotFoundException", () => Effect.void),
0.81 packages/alchemy/src/AWS/Shield/ProtectionGroup.ts:282
     return buildAttrs(group!, desiredTags);
0.81 packages/alchemy/src/AWS/Shield/Subscription.ts:132
     new Error(
0.81 packages/alchemy/src/AWS/Timestream/Database.ts:214
     if (state === undefined) {
0.81 packages/alchemy/src/AWS/Timestream/DbInstance.ts:382
     new Error("Timestream DbInstance requires props"),
0.81 packages/alchemy/src/AWS/VpcLattice/Service.ts:268
     return {
0.81 packages/alchemy/src/Cloudflare/Addressing/AddressMap.ts:224
     new Error("Cloudflare did not return an Address Map id"),
0.81 packages/alchemy/src/Cloudflare/Artifacts/Namespace.ts:14
     export class InvalidNamespaceError extends Error {
0.81 packages/alchemy/src/Cloudflare/Healthcheck/Healthcheck.ts:404
     new Error(
0.81 packages/alchemy/src/Cloudflare/MagicTransit/SiteWan.ts:205
     new Error(`Magic WAN site WAN ${name} not visible after create`),
0.81 packages/alchemy/src/GitHub/PullRequest.ts:381
     new Error("Pull request disappeared after reconciliation"),
0.81 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:236
     new Error(
0.81 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:101
     : Effect.fail(new Error(`microvm ${m.state}`)),
0.81 packages/alchemy/test/Runtime/fixtures/managed-http-shutdown.ts:34
     if (!dependencyOpen) throw new Error("dependency already closed");
0.80 packages/alchemy/src/AWS/Batch/JobDefinition.ts:783
     new Error(
0.80 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:169
     new Error("createInvalidation returned no invalidation"),
0.80 packages/alchemy/src/AWS/CloudFront/KeyGroup.ts:225
     new Error("createKeyGroup returned no identifier"),
0.80 packages/alchemy/src/AWS/Deadline/Budget.ts:421
     };
0.80 packages/alchemy/src/AWS/Deadline/Fleet.ts:601
     return final.attrs;
0.80 packages/alchemy/src/AWS/Deadline/StorageProfile.ts:197
     new Error("AWS.Deadline.StorageProfile requires props"),
0.80 packages/alchemy/src/AWS/DirectoryService/EventTopic.ts:149
     return yield* Effect.fail(
0.80 packages/alchemy/src/AWS/EC2/NetworkInterface.ts:441
     }
0.80 packages/alchemy/src/AWS/EC2/SecurityGroupRule.ts:470
     return yield* new InvalidSecurityGroupRuleGroup({
0.80 packages/alchemy/src/AWS/EC2/Subnet.ts:460
     );
0.80 packages/alchemy/src/AWS/EKS/AccessEntry.ts:201
     `AccessEntry '${principalArn}' could not be read after creation`,
0.80 packages/alchemy/src/AWS/FinSpace/Environment.ts:361
     new Error(`CreateEnvironment for '${name}' returned no id`),
0.80 packages/alchemy/src/AWS/FinSpace/KxEnvironment.ts:401
     new Error(`failed to read created kdb environment ${name}`),
0.80 packages/alchemy/src/AWS/ImageBuilder/DistributionConfiguration.ts:121
     new Error(
0.80 packages/alchemy/src/AWS/ImageBuilder/InfrastructureConfiguration.ts:101
     never,
0.80 packages/alchemy/src/AWS/LexV2/Bot.ts:232
     : Unowned(attrs);
0.80 packages/alchemy/src/AWS/MemoryDB/ParameterGroup.ts:274
     return yield* toAttrs(observed);
0.80 packages/alchemy/src/AWS/Polly/Lexicon.ts:200
     new Error(
0.80 packages/alchemy/src/AWS/Redshift/ClusterSubnetGroup.ts:192
     if (!group?.ClusterSubnetGroupName) return undefined;
0.80 packages/alchemy/src/AWS/Redshift/EventSubscription.ts:304
     new Error(`Failed to create event subscription '${name}'`),
0.80 packages/alchemy/src/AWS/Route53/HealthCheck.ts:330
     new Error(
0.80 packages/alchemy/src/AWS/Route53/Record.ts:702
     new Error("Route53 record was not found after upsert"),
0.80 packages/alchemy/src/AWS/SageMaker/Endpoint.ts:344
     yield* waitForEndpoint(output.endpointName, "Gone");
0.80 packages/alchemy/src/AWS/SecretsManager/Secret.ts:521
     };
0.80 packages/alchemy/src/AWS/VerifiedPermissions/PolicyStoreAlias.ts:180
     new Error(
0.80 packages/alchemy/src/Cloudflare/Access/CustomPage.ts:211
     new Error("CustomPage: created page missing uid"),
0.80 packages/alchemy/src/Cloudflare/Logpush/Job.ts:417
     new Error("Cloudflare did not return an id for the Logpush job"),
0.80 packages/alchemy/src/Cloudflare/Zone/lookup.ts:42
     new Error(`Cloudflare zone not found for ${lookup}`),
0.80 packages/alchemy/src/Prisma/Connection.ts:581
     `Prisma connection '${connection.id}' resolves to database '${connection.database.id}' with name '${connection.name}', n
0.80 packages/alchemy/test/Cloudflare/Utils/Http.ts:103
     new Error(
0.79 packages/alchemy/scripts/clean-aws.ts:341
     `Network interfaces still in use: ${blocked
0.79 packages/alchemy/src/AWS/ApplicationSignals/ServiceLevelObjective.ts:373
     new Error(`failed to reconcile SLO '${sloName}'`),
0.79 packages/alchemy/src/AWS/Batch/JobQueue.ts:261
     new Error(`JobQueue ${name} did not settle`),
0.79 packages/alchemy/src/AWS/DAX/SubnetGroup.ts:156
     new Error(`DAX subnet group '${name}' not found after create`),
0.79 packages/alchemy/src/AWS/Deadline/Monitor.ts:266
     return yield* Effect.fail(
0.79 packages/alchemy/src/AWS/IoTManagedIntegrations/Destination.ts:138
     new Error("destination response is missing required fields"),
0.79 packages/alchemy/src/AWS/IoTManagedIntegrations/NotificationConfiguration.ts:120
     new Error(
0.79 packages/alchemy/src/AWS/LexV2/BotVersion.ts:191
     new Error(
0.79 packages/alchemy/src/AWS/Location/PlaceIndex.ts:187
     return yield* Effect.fail(
0.79 packages/alchemy/src/AWS/MQ/Broker.ts:561
     new Error(
0.79 packages/alchemy/src/AWS/MQ/Configuration.ts:294
     new Error(
0.79 packages/alchemy/src/AWS/OSIS/PipelineEndpoint.ts:126
     new Error(
0.79 packages/alchemy/src/AWS/ObservabilityAdmin/TelemetryRule.ts:506
     new Error(`telemetry rule '${name}' not yet visible`),
0.79 packages/alchemy/src/AWS/Organizations/Policy.ts:317
     new Error(`policy '${state.policyId}' not found after reconcile`),
0.79 packages/alchemy/src/AWS/QuickSight/Dashboard.ts:283
     );
0.79 packages/alchemy/src/AWS/Route53/HostedZone.ts:324
     new Error(
0.79 packages/alchemy/src/AWS/SES/Tenant.ts:285
     new Error(`SES tenant ${name} was not found after create`),
0.79 packages/alchemy/src/AWS/SageMaker/EndpointConfig.ts:248
     if (attrs === undefined) {
0.79 packages/alchemy/src/AWS/SageMaker/FeatureGroup.ts:360
     }
0.79 packages/alchemy/src/AWS/Shield/Protection.ts:366
     delete: Effect.fn(function* ({ output }) {
0.79 packages/alchemy/src/Cloudflare/Access/Certificate.ts:221
     return toAttrs(created, acct, news.certificate);
0.79 packages/alchemy/src/Cloudflare/Access/Group.ts:281
     };
0.79 packages/alchemy/src/Cloudflare/Alerting/NotificationPolicy.ts:262
     return toPolicyAttributes(fresh ?? { id: created.id }, accountId);
0.79 packages/alchemy/src/Cloudflare/Zone/Zone.ts:281
     `Cloudflare reported zone ${news.name} already exists but it could not be found`,
0.79 packages/alchemy/src/Prisma/ComputeArchive.ts:222
     return yield* Effect.fail(
0.79 packages/alchemy/src/Prisma/Website/Artifact.ts:101
     return yield* fail(`Website server entry is not a file: ${entry}`);
0.79 packages/better-auth/src/AuroraDataApi.ts:270
     new Error(
0.78 packages/alchemy-test/src/Plan.ts:33
     throw new Error(
0.78 packages/alchemy/src/AWS/AuditManager/Framework.ts:244
     new Error(
0.78 packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts:283
     new Error(
0.78 packages/alchemy/src/AWS/CloudFront/Function.ts:142
     return yield* Effect.fail(
0.78 packages/alchemy/src/AWS/CodeBuild/Project.ts:521
     new Error(
0.78 packages/alchemy/src/AWS/DMS/ReplicationInstance.ts:208
     new Error(
0.78 packages/alchemy/src/AWS/EC2/NatGateway.ts:262
     : Effect.fail(new Error(`NAT Gateway ${natGatewayId} not found`)),
0.78 packages/alchemy/src/AWS/EC2/RouteTableAssociation.ts:426
     );
0.78 packages/alchemy/src/AWS/ECR/Image.ts:302
     new Error(
0.78 packages/alchemy/src/AWS/Grafana/Workspace.ts:81
     never,
0.78 packages/alchemy/src/AWS/IdentityCenter/PermissionSet.ts:222
     return yield* Effect.fail(
0.78 packages/alchemy/src/AWS/ImageBuilder/Component.ts:301
     new Error(
0.78 packages/alchemy/src/AWS/Kafka/ServerlessCluster.ts:201
     `MSK cluster is missing its name or ARN (state: ${cluster.State})`,
0.78 packages/alchemy/src/AWS/Kendra/DataSource.ts:461
     }
0.78 packages/alchemy/src/AWS/Neptune/DBClusterParameterGroup.ts:399
     );
0.78 packages/alchemy/src/AWS/NeptuneGraph/Graph.ts:380
     Effect.catchTag("ConflictException", () =>
0.78 packages/alchemy/src/AWS/QuickSight/DataSet.ts:231
     new Error(
0.78 packages/alchemy/src/AWS/Redshift/Cluster.ts:342
     new Error(
0.78 packages/alchemy/src/AWS/Transfer/Server.ts:255
     return yield* Effect.fail(
0.78 packages/alchemy/src/Cloudflare/R2/Bucket.ts:632
     new Error(
0.78 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:401
     },
0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/object.ts:121
     throw new Error("Missing RPC WebSocket attachment");
0.77 packages/alchemy/src/AWS/AppFlow/ConnectorProfile.ts:172
     new Error(
0.77 packages/alchemy/src/AWS/CloudFront/PublicKey.ts:241
     new Error(
0.77 packages/alchemy/src/AWS/DynamoDB/BatchWriteItemHttp.ts:32
     new Error(
0.77 packages/alchemy/src/AWS/DynamoDB/TransactGetItemsHttp.ts:32
     new Error(
0.77 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:671
     () => Effect.void,
0.77 packages/alchemy/src/AWS/EFS/Mount.ts:152
     return yield* Effect.die(
0.77 packages/alchemy/src/AWS/ELBv2/LoadBalancer.ts:404
     ) {
0.77 packages/alchemy/src/AWS/IAM/User.ts:356
     new Error(
0.77 packages/alchemy/src/AWS/IoTFleetWise/StateTemplate.ts:203
     ? Effect.fail(new Error(`StateTemplate '${name}' not found`))
0.77 packages/alchemy/src/AWS/IoTManagedIntegrations/ManagedThing.ts:181
     new Error(
0.77 packages/alchemy/src/AWS/IoTWireless/DeviceProfile.ts:151
     new Error(
0.77 packages/alchemy/src/AWS/IoTWireless/ServiceProfile.ts:154
     new Error(
0.77 packages/alchemy/src/AWS/Kinesis/Stream.ts:762
     new Error(`failed to read reconciled stream ${streamName}`),
0.77 packages/alchemy/src/AWS/Location/Map.ts:210
     new Error(`failed to read created map ${mapName}`),
0.77 packages/alchemy/src/AWS/QuickSight/DataSource.ts:267
     return toAttrs(observed);
0.77 packages/alchemy/src/AWS/RDS/DBProxyEndpoint.ts:352
     Effect.catchTag(
0.77 packages/alchemy/src/AWS/RedshiftServerless/Namespace.ts:221
     : Effect.fail(
0.77 packages/alchemy/src/Neon/BackendConnection.ts:61
     new Error(
0.77 packages/alchemy/src/Neon/Website/TraceRunner.ts:14
     return yield* Effect.fail(new Error("Missing dependency trace paths"));
0.77 packages/alchemy/src/Prisma/Deployment.ts:601
     new Error(
0.77 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/orchestrator.ts:54
     : Effect.fail(new Error(`microvm ${m.state}`)),
0.77 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:50
     new Error("Versioned bucket notification omitted versionId"),
0.77 packages/alchemy/test/Cloudflare/Workflows/fixtures/test-workflow.ts:42
     Effect.fail(new Error("rollback requested")),
0.77 packages/alchemy/test/Fly/fixtures/process-death.ts:261
     "Expected the original durable resource row; refusing to recreate evidence",
0.76 packages/alchemy/src/AWS/AutoScaling/AutoScalingGroup.ts:484
     new Error(
0.76 packages/alchemy/src/AWS/CloudFront/VpcOrigin.ts:344
     new Error("createVpcOrigin returned no identifier"),
0.76 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:233
     new Error("CloudHSM cluster is missing its ClusterId"),
0.76 packages/alchemy/src/AWS/DynamoDB/TransactWriteItemsHttp.ts:31
     new Error(
0.76 packages/alchemy/src/AWS/EC2/Instance.ts:820
     new Error(`RunInstances returned no instance ID for '${id}'`),
0.76 packages/alchemy/src/AWS/EKS/Nodegroup.ts:423
     return Effect.fail(
0.76 packages/alchemy/src/AWS/ELBv2/TargetGroup.ts:280
     let targetGroup = described?.TargetGroups?.[0];
0.76 packages/alchemy/src/AWS/EMR/Studio.ts:366
     new Error(`CreateStudio for '${name}' returned no StudioId`),
0.76 packages/alchemy/src/AWS/ElastiCache/CacheCluster.ts:106
     new Error(`Cache cluster '${name}' is not available`),
0.76 packages/alchemy/src/AWS/ElastiCache/SubnetGroup.ts:77
     new Error("ElastiCache subnet group is missing its name or ARN"),
0.76 packages/alchemy/src/AWS/FinSpace/KxCluster.ts:421
     new Error("FinSpace KxCluster requires props"),
0.76 packages/alchemy/src/AWS/Inspector2/Filter.ts:194
     new Error(`Inspector2 filter ${name} not visible after create`),
0.76 packages/alchemy/src/AWS/IoTSiteWise/AssetModel.ts:380
     });
0.76 packages/alchemy/src/AWS/RedshiftServerless/Workgroup.ts:341
     `Redshift workgroup '${name}' disappeared while reconciling`,
0.76 packages/alchemy/src/Alchemist/Session.ts:89
     return yield* Effect.fail(
0.76 packages/alchemy/src/Auth/Env.ts:12
     new AuthError({
0.76 packages/alchemy/src/Cloudflare/Access/Organization.ts:261
     new Error(
0.76 packages/alchemy/src/Cloudflare/Access/Policy.ts:434
     .pipe(Effect.catch((): Effect.Effect<void> => Effect.void));
0.76 packages/alchemy/src/Cloudflare/Alerting/Webhook.ts:265
     return toWebhookAttributes(fresh ?? observed, accountId);
0.76 packages/alchemy/src/Cloudflare/MagicTransit/SiteLan.ts:427
     });
0.76 packages/alchemy/src/Cloudflare/Workers/BrowserHttpClient.ts:154
     new Error(
0.76 packages/alchemy/src/Phase.ts:26
     return Effect.die(new Error(`Invalid ALCHEMY_PHASE: ${value}`));
0.76 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:14
     new Error("Subscription cleanup deadline exceeded"),
0.76 packages/alchemy/test/Local/fixtures/rpc-server-entry.ts:25
     boom: () => Effect.fail({ _tag: "Boom" as const, msg: "kaboom" }),
0.76 packages/cloudflare-runtime/src/internal/workers-shared/shared/configuration/parseStaticRouting.ts:14
     throw new Error(
0.76 packages/cloudflare-runtime/src/internal/workflows-shared/lib/retries.ts:7
     export class DelayFunctionError extends Error {
0.75 packages/alchemy/src/AWS/Assets.ts:93
     new Error(
0.75 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:336
     };
0.75 packages/alchemy/src/AWS/CodeBuild/ReportGroup.ts:261
     new Error(
0.75 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:240
     .pipe(Effect.catch(() => Effect.succeed(undefined)));
0.75 packages/alchemy/src/AWS/EC2/EgressOnlyInternetGateway.ts:249
     return { action: "replace" };
0.75 packages/alchemy/src/AWS/EC2/VpcEndpoint.ts:545
     }
0.75 packages/alchemy/src/AWS/EC2/hosted.ts:167
     new Error(
0.75 packages/alchemy/src/Axiom/ApiToken.ts:130
     new Error("Axiom did not return a token on create"),
0.75 packages/alchemy/src/Axiom/Dataset.ts:183
     new Error(
0.75 packages/alchemy/src/Cloudflare/Access/ServiceToken.ts:268
     new Error("ServiceToken: created token missing id"),
0.75 packages/alchemy/src/Cloudflare/Artifacts/ReadWriteNamespaceBinding.ts:58
     cause: new Error("not_found"),
0.75 packages/alchemy/src/Cloudflare/Containers/LocalContainerProvider.ts:102
     new Error(
0.75 packages/alchemy/src/Cloudflare/Gateway/List.ts:319
     Effect.gen(function* () {
0.75 packages/alchemy/src/Local/RpcServer.ts:280
     parentConnected: () => void;
0.75 packages/alchemy/src/Neon/InvokeFunctionHttp.ts:34
     new Error("Neon.InvokeFunction requires a Platform host"),
0.75 packages/alchemy/src/Neon/Website/FrameworkSite.ts:135
     new Error("Specify branch or project, never both."),
0.75 packages/alchemy/src/Neon/Website/PackageRunner.ts:17
     return yield* Effect.fail(new Error("Missing Website packaging paths"));
0.75 packages/alchemy/src/Prisma/Website/StaticSite.ts:93
     new Error("StaticSite spa and errorPage are mutually exclusive."),
0.75 packages/alchemy/src/Runtime/Bootstrap/ManagedHttpShutdown.ts:70
     new Error(
0.75 packages/alchemy/test/AWS/ElastiCache/ProvisionedFixture.ts:119
     Effect.fail(new Error(`replication group '${name}' still exists`)),
0.75 packages/alchemy/test/Cloudflare/Website/TypeScriptCompat.ts:30
     new Error(
0.75 packages/alchemy/test/Prisma/Website/Fixture.ts:33
     new Error(
0.75 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitBinding.worker.ts:84
     throw new Error(message);
0.74 packages/alchemy/src/AWS/DAX/Cluster.ts:282
     return yield* Effect.fail(
0.74 packages/alchemy/src/AWS/DynamoDB/BatchGetItemHttp.ts:31
     new Error(
0.74 packages/alchemy/src/AWS/EC2/RouteTable.ts:569
     });
0.74 packages/alchemy/src/AWS/ECS/TaskDefinition.ts:765
     new Error("registerTaskDefinition returned no task definition"),
0.74 packages/alchemy/src/AWS/IoTFleetWise/ModelManifest.ts:201
     ),
0.74 packages/alchemy/src/AWS/Keyspaces/Keyspace.ts:168
     ? Effect.fail(new Error(`Keyspace '${name}' not found`))
0.74 packages/alchemy/src/AWS/Lambda/EventSourceMapping.ts:719
     new Error(`EventSourceMapping(${id}) could not be reconciled`),
0.74 packages/alchemy/src/AWS/Personalize/EventTracker.ts:261
     `Personalize event tracker ${output.eventTrackerArn} was not deleted (status: ${remaining.status})`,
0.74 packages/alchemy/src/AWS/QApps/QApp.ts:344
     new Error(`failed to read created Q App ${title}`),
0.74 packages/alchemy/src/AWS/SES/MultiRegionEndpoint.ts:324
     return {
0.74 packages/alchemy/src/AWS/VpcLattice/TargetGroup.ts:440
     },
0.74 packages/alchemy/src/Auth/Credentials.ts:204
     return yield* new AuthError({
0.74 packages/alchemy/src/Cloudflare/StateStore/State.ts:177
     return yield* Effect.die(new Interaction.TerminalCancelled());
0.74 packages/alchemy/src/Docker/Swarm.ts:199
     new Error(
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:235
     return HttpServerResponse.text("Alarm worker version mismatch", {
0.74 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:123
     return yield* Effect.fail(new Error("Unexpected readiness status"));
0.74 packages/alchemy/test/Prisma/fakes.ts:37
     new AuthError({
0.74 packages/better-auth/src/Migrate.ts:65
     return yield* Effect.die(
0.73 packages/alchemy/src/AWS/AMP/Scraper.ts:265
     return { action: "replace" } as const;
0.73 packages/alchemy/src/AWS/ElastiCache/ServerlessCache.ts:369
     new Error(
0.73 packages/alchemy/src/AWS/InternetMonitor/Monitor.ts:193
     new Error(`Internet Monitor monitor '${name}' not found`),
0.73 packages/alchemy/src/AWS/IoTFleetWise/DecoderManifest.ts:81
     never,
0.73 packages/alchemy/src/AWS/IoTSiteWise/Gateway.ts:201
     new Error("IoT SiteWise Gateway requires props"),
0.73 packages/alchemy/src/AWS/MemoryDB/ACL.ts:110
     new Error(`ACL '${name}' not active (${acl.Status})`),
0.73 packages/alchemy/src/AWS/MemoryDB/User.ts:226
     new Error(`User '${name}' not found after create`),
0.73 packages/alchemy/src/AWS/Neptune/DBCluster.ts:402
     new Error(
0.73 packages/alchemy/src/AWS/Personalize/DatasetGroup.ts:233
     // Campaigns block their solution's deletion, so drain them per
0.73 packages/alchemy/src/Neon/Website/StaticSite.ts:80
     new Error("Specify branch or project, never both."),
0.73 packages/alchemy/test/Docker/Runtime.ts:38
     new Error(`docker swarm init failed: ${String(init.stderr).trim()}`),
0.73 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:28
     return yield* Effect.fail(new Error("Probe proxy must bind IPv4 loopback"));
0.73 packages/frontend-frameworks/src/core/BuildChildRunner.ts:29
     new Error(
0.73 packages/frontend-frameworks/src/core/Collector.ts:240
     }
0.72 packages/alchemy/src/AWS/AMP/Workspace.ts:330
     return { action: "replace" } as const;
0.72 packages/alchemy/src/AWS/CloudHSMV2/Hsm.ts:227
     return yield* Effect.fail(new Error("CreateHsm returned no HsmId"));
0.72 packages/alchemy/src/AWS/DSQL/Cluster.ts:120
     // minute; budget ~5 min (60 * 5s) so slow provisioning still converges
0.72 packages/alchemy/src/AWS/DocDB/DBInstance.ts:280
     )
0.72 packages/alchemy/src/AWS/DynamoDB/AttributeValue.ts:169
     throw new Error(`Unknown attribute value: ${JSON.stringify(value)}`);
0.72 packages/alchemy/src/AWS/EC2/EIP.ts:362
     // TODO(sam): not sure if the API will actually throw this
0.72 packages/alchemy/src/AWS/ImageBuilder/ImagePipeline.ts:201
     new Error(
0.72 packages/alchemy/src/AWS/ImageBuilder/internal.ts:87
     new Error(
0.72 packages/alchemy/src/AWS/IoTFleetWise/SignalCatalog.ts:219
     news.description !== observed.description;
0.72 packages/alchemy/src/AWS/RDS/DBProxy.ts:222
     : Effect.fail(new Error(`DB proxy '${name}' not ready`)),
0.72 packages/alchemy/src/Cloudflare/Hyperdrive/ConnectBinding.ts:67
     throw new Error(
0.72 packages/alchemy/src/Cloudflare/Workers/AlarmCallback.ts:201
     Effect.fail(
0.72 packages/alchemy/src/Cloudflare/Workers/RpcWebSocket.ts:201
     return yield* close(socket);
0.72 packages/alchemy/src/Local/RpcProviderProxy.ts:60
     new Error(
0.72 packages/alchemy/src/Neon/QueryAIGateway.ts:126
     new Error("QueryAIGatewayHttp requires a Function or Worker host"),
0.72 packages/frontend-frameworks/src/astro/aws.ts:121
     `@alchemy.run/frontend-frameworks/astro/aws: the Astro config declares the adapter "${config.adapter.name}", ` +
0.71 packages/alchemy/src/AWS/DocDB/ConnectHttp.ts:50
     throw new Error(
0.71 packages/alchemy/src/AWS/EC2/PrefixList.ts:208
     : Effect.fail(new PrefixListNotStable()),
0.71 packages/alchemy/src/AWS/EMR/Cluster.ts:722
     new Error(
0.71 packages/alchemy/src/AWS/GlobalAccelerator/Listener.ts:209
     new Error("CreateListener returned no listener"),
0.71 packages/alchemy/src/AWS/Inspector2/CisScanConfiguration.ts:194
     new Error(
0.71 packages/alchemy/src/AWS/IoTFleetWise/Fleet.ts:147
     ? Effect.fail(new Error(`Fleet '${fleetId}' not found`))
0.71 packages/alchemy/src/AWS/Keyspaces/Table.ts:361
     `Keyspaces table '${tableName}' missing columns: ${missing.join(", ")}`,
0.71 packages/alchemy/src/AWS/MWAA/Environment.ts:399
     new Error(`Environment '${env.Name}' is missing its ARN`),
0.71 packages/alchemy/src/AWS/OSIS/Pipeline.ts:290
     const props = news!;
0.71 packages/alchemy/src/AWS/Personalize/Dataset.ts:258
     new Error(
0.71 packages/alchemy/src/Kubernetes/internal/objects.ts:123
     throw new Error(
0.71 packages/alchemy/test/Fly/fixtures/signal-overlap.ts:101
     });
0.71 packages/alchemy/test/Neon/Website/Browser.ts:25
     return yield* Effect.fail(new Error(`Browser command failed: ${stderr}`));
0.71 packages/cloudflare-runtime/src/internal/workflows-shared/lib/errors.ts:3
     export class WorkflowTimeoutError extends Error {
```
