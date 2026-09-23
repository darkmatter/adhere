# data/brand-meaningful-primitives

A primitive with semantic meaning, such as an id, email, URL, port, or count, must be a branded schema, never a bare string or number.

1,102 findings, from 0.95 down to 0.71. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.95 packages/alchemy/test/Prisma/ORM/fixtures/psl/generated/schemas.ts:12
     email: Schema.String,
0.94 packages/alchemy/src/AWS/Arn.ts:1
     export type Arn = string;
0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/api.ts:7
     id: Schema.String,
0.94 packages/alchemy/test/Fly/fixtures/shared.ts:6
     export const API_PORT = 3000;
0.93 packages/alchemy/src/AWS/Organizations/Account.ts:393
     if (!status.AccountId) {
0.93 packages/alchemy/src/Git/Protocol/ObjectCodec.ts:645
     export const treeEntryKind = (mode: string): TreeEntryKind =>
0.93 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:7
     invocation_id: Schema.String,
0.93 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:26
     accountId: Schema.String,
0.93 packages/alchemy/test/Hetzner/fixtures/shared.ts:6
     export const API_PORT = 3000;
0.93 packages/cloudflare-runtime/src/core/bindings/hyperdrive/HyperdriveOrigin.shared.ts:7
     port: number;
0.92 packages/alchemy/src/Cloudflare/Auth/AuthConfig.ts:13
     accountId: Schema.String,
0.92 packages/alchemy/src/Planetscale/OAuthClient.ts:30
     export const OAUTH_CLIENT_ID = "pscale_app_aa12e3938baebb788aac443f66e422da";
0.92 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:11
     export const HOST_PROBE_PORT = 42117;
0.92 packages/alchemy/test/Cloudflare/Website/foldkit-fixture/src/main.ts:8
     export const Model = S.Struct({ count: S.Number });
0.91 packages/alchemy/src/AWS/CloudFront/ManagedPolicies.ts:6
     "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" as const;
0.91 packages/alchemy/src/Planetscale/Postgres/PostgresOrigin.ts:11
     port: number;
0.91 packages/alchemy/src/Prisma/Types.ts:122
     port: number;
0.91 packages/alchemy/test/Cloudflare/AI/fixtures/ChatRpcs.ts:38
     payload: { id: Schema.String, prompt: Schema.String },
0.91 packages/alchemy/test/Cloudflare/Website/foldkit-worker-fixture/src/main.ts:8
     export const Model = S.Struct({ count: S.Number });
0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/types.ts:2
     id: string;
0.91 packages/alchemy/test/Fly/fixtures/process-death.ts:33
     pid: Schema.Number,
0.91 packages/alchemy/test/Fly/fixtures/redis-api.ts:7
     export const REDIS_PORT = 3000;
0.91 packages/alchemy/test/Railway/fixtures/redis-api.ts:10
     export const REDIS_PORT = 3000;
0.90 packages/alchemy/src/AWS/Environment.ts:28
     export type AccountID = string;
0.90 packages/alchemy/src/AWS/Organizations/Organization.ts:8
     export type OrganizationId = string;
0.90 packages/alchemy/src/Cloudflare/D1/CloneDatabase.ts:8
     accountId: string;
0.90 packages/alchemy/src/Cloudflare/StateStore/CredentialsFile.ts:34
     accountId: Schema.optional(Schema.String),
0.90 packages/alchemy/src/Namespace.ts:6
     Id: string;
0.90 packages/alchemy/src/Neon/PostgresOrigin.ts:18
     port: number;
0.90 packages/alchemy/src/Planetscale/MySQL/MySQLOrigin.ts:11
     port: number;
0.90 packages/alchemy/test/Cloudflare/Container/fixtures/reload/container.ts:17
     export const RELOAD_CONTAINER_PORT = 17362;
0.90 packages/alchemy/test/Fly/fixtures/app/shared.ts:7
     export const API_PORT = 3000;
0.90 packages/alchemy/test/Fly/fixtures/postgres-api.ts:8
     export const POSTGRES_PORT = 3000;
0.90 packages/alchemy/test/Hetzner/fixtures/app/shared.ts:7
     export const API_PORT = 3000;
0.90 packages/alchemy/test/Railway/fixtures/mongo-api.ts:8
     export const MONGO_HTTP_PORT = 3000;
0.90 packages/alchemy/test/Railway/fixtures/postgres-api.ts:11
     export const POSTGRES_PORT = 3000;
0.90 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitProps.shared.ts:5
     namespaceId: Schema.String,
0.90 packages/cloudflare-runtime/src/core/test/helpers/port.ts:5
     export const occupy = (port: number, host?: string) =>
0.89 packages/alchemy/src/Cloudflare/VpcService/VpcService.ts:248
     httpPort: news.httpPort,
0.89 packages/alchemy/src/Prisma/PostgresOrigin.ts:18
     port: number;
0.89 packages/alchemy/src/Prisma/Refs.ts:21
     export const isPrismaDevId = (value: unknown): value is string =>
0.89 packages/alchemy/src/Railway/ServiceDomain.ts:133
     * the recorded hostname — never every generated domain.
0.89 packages/alchemy/src/Redis/Protocol.ts:24
     readonly port: number;
0.89 packages/alchemy/src/Runtime/Bootstrap/Microvm.ts:23
     readonly port: number;
0.89 packages/alchemy/test/Docker/fixtures/service.ts:14
     export const SERVICE_EXTERNAL_PORT = 43117;
0.89 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/types.ts:17
     accountId?: number;
0.88 packages/alchemy/src/AWS/ELBv2/TargetGroup.ts:331
     HealthyThresholdCount: targetGroup.HealthyThresholdCount,
0.88 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:25
     readonly id: string;
0.88 packages/alchemy/src/Cloudflare/Hyperdrive/Connection.ts:121
     accountId: string;
0.88 packages/alchemy/src/Cloudflare/Zone/lookup.ts:14
     export type Reference = string | { zoneId: string; name?: string };
0.88 packages/alchemy/src/Neon/OrganizationSpendingLimit.ts:12
     orgId: string;
0.88 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:2
     readonly id: string;
0.88 packages/alchemy/test/Docker/fixtures/isolated-project-service.ts:19
     export const SERVICE_EXTERNAL_PORT = 43119;
0.88 packages/alchemy/test/Fly/fixtures/bindings-shared.ts:4
     export const API_PORT = 3000;
0.88 packages/alchemy/test/Fly/fixtures/certificates-api.ts:8
     export const CERT_API_PORT = 3000;
0.88 packages/alchemy/test/Fly/fixtures/state-persistence.ts:14
     fqn: Schema.String,
0.88 packages/alchemy/test/Railway/fixtures/bucket-api.ts:10
     export const BUCKET_PORT = 3000;
0.88 packages/alchemy/test/Railway/fixtures/mysql-api.ts:8
     export const MYSQL_API_PORT = 3000;
0.88 packages/alchemy/test/Railway/waitUntilVolumeGone.ts:16
     export const waitUntilVolumeGone = (volumeInstanceId: string) =>
0.88 packages/cloudflare-runtime/src/internal/workers-shared/shared/types.ts:19
     account_id: Schema.optional(Schema.Number),
0.88 packages/frontend-frameworks/fixtures/sveltekit-spa/src/lib/widgets.ts:7
     readonly id: string;
0.87 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:481
     repositoryName: parsed.repositoryName,
0.87 packages/alchemy/src/Cloudflare/Auth/OAuthClient.ts:9
     export const OAUTH_CLIENT_ID = "e7e25ec474419def6ba38d2d2638b122";
0.87 packages/alchemy/src/Cloudflare/Auth/TokenPolicy.ts:42
     userId: string,
0.87 packages/alchemy/src/Cloudflare/Email/Address.ts:20
     email: string;
0.87 packages/alchemy/src/Cloudflare/KeylessCertificate/KeylessCertificate.ts:121
     port: number;
0.87 packages/alchemy/src/Cloudflare/Tunnel/Configuration.ts:95
     tunnelId: string;
0.87 packages/alchemy/src/Fly/Volume.ts:41
     export const getVolumeById = (appName: string, volumeId: string) =>
0.87 packages/alchemy/src/Git/RegistryObject.ts:83
     readonly repoId: string;
0.87 packages/alchemy/src/Prisma/Internal/Observed.ts:29
     readonly id: string;
0.87 packages/alchemy/src/Railway/Environment.ts:22
     readonly id: string;
0.87 packages/alchemy/src/Railway/ServiceRegion.ts:19
     serviceId: string;
0.87 packages/alchemy/src/Railway/TcpProxy.ts:261
     applicationPort: number,
0.87 packages/alchemy/test/AWS/Website/fixtures/foldkit-app/src/main.ts:12
     export const Model = S.Struct({ count: S.Number });
0.87 packages/alchemy/test/Fly/fixtures/bucket-api.ts:7
     export const BUCKET_PORT = 3000;
0.87 packages/alchemy/test/Fly/fixtures/signal-overlap.ts:103
     export const assertSingleRunner = Effect.gen(function* () {
0.87 packages/alchemy/test/SQL/fixtures/routes.ts:32
     id: number;
0.86 packages/alchemy/src/AWS/Connection/DbAuthToken.ts:20
     port?: number;
0.86 packages/alchemy/src/AWS/Connection/internal.ts:11
     host: string;
0.86 packages/alchemy/src/AWS/ELBv2/Listener.ts:222
     return props.certificateArn ? [props.certificateArn] : [];
0.86 packages/alchemy/src/AWS/Organizations/TenantRoot.ts:61
     key: string;
0.86 packages/alchemy/src/AWS/SNS/Subscription.ts:42
     subscriptionArn: SubscriptionArn;
0.86 packages/alchemy/src/AWS/Timestream/DbInstance.ts:109
     id: string;
0.86 packages/alchemy/src/Cloudflare/Account/Member.ts:49
     email: string;
0.86 packages/alchemy/src/Cloudflare/ApiToken/Common.ts:61
     accountId?: string;
0.86 packages/alchemy/src/Cloudflare/CloudforceOne/ScanConfig.ts:38
     configId: string;
0.86 packages/alchemy/src/Cloudflare/CustomHostname/CustomHostname.ts:177
     httpUrl: string | undefined;
0.86 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:12
     accountId: string;
0.86 packages/alchemy/src/Cloudflare/DNS/Record.ts:541
     zoneId: string,
0.86 packages/alchemy/src/Cloudflare/Email/ImpersonationRegistryEntry.ts:43
     entryId: string;
0.86 packages/alchemy/src/Cloudflare/Gateway/List.ts:82
     accountId: string;
0.86 packages/alchemy/src/Cloudflare/MagicTransit/SiteAcl.ts:83
     accountId: string;
0.86 packages/alchemy/src/Cloudflare/Speed/TestSchedule.ts:84
     zoneId: string;
0.86 packages/alchemy/src/Cloudflare/Tunnel/HostnameRoute.ts:53
     never,
0.86 packages/alchemy/src/Cloudflare/Tunnel/Route.ts:58
     routeId: string;
0.86 packages/alchemy/src/Fly/Deployment.ts:30
     port: number;
0.86 packages/alchemy/src/Hetzner/LoadBalancer.ts:345
     loadBalancerTypeId: number;
0.86 packages/alchemy/src/Hetzner/Service.ts:48
     port?: number;
0.86 packages/alchemy/src/Railway/CloudAgent.ts:96
     port: number;
0.86 packages/alchemy/src/Railway/MySQL.ts:200
     /** Public proxy port. Pair with `tcpProxyDomain`. */
0.86 packages/alchemy/src/Railway/Postgres.ts:241
     never,
0.86 packages/alchemy/src/Railway/Redis.ts:402
     const getInstance = (environmentId: string, serviceId: string) =>
0.86 packages/alchemy/src/State/InMemoryState.ts:8
     type StackId = string;
0.86 packages/alchemy/test/AWS/S3/fixtures/versioned-multipart-handler.ts:15
     Key: Schema.String,
0.86 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/rpcs.ts:12
     payload: { count: Schema.Number },
0.86 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/group.ts:22
     payload: { key: Schema.String },
0.86 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:55
     port: 3000,
0.86 packages/alchemy/test/Fly/fixtures/protocol-branches.ts:32
     checks: { ready: { type: "http", port: 80, path: "/" } },
0.86 packages/alchemy/test/Stripe/fixtures/event-source-worker.ts:42
     email: "event-source@example.com",
0.86 packages/alchemy/test/types/BrandedTypes.ts:14
     type UserId = string & Brand.Brand<"UserId">;
0.85 packages/alchemy/src/AWS/AppConfig/internal.ts:11
     accountId: string,
0.85 packages/alchemy/src/AWS/AutoScaling/AutoScalingGroup.ts:21
     export type AutoScalingGroupName = string;
0.85 packages/alchemy/src/AWS/ElastiCache/ReplicationGroup.ts:76
     never,
0.85 packages/alchemy/src/AWS/EventBridge/ApiDestination.ts:16
     export type ApiDestinationName = string;
0.85 packages/alchemy/src/AWS/GlobalAccelerator/Listener.ts:14
     fromPort: number;
0.85 packages/alchemy/src/AWS/Organizations/Root.ts:15
     export type RootId = string;
0.85 packages/alchemy/src/AWS/Route53/HostedZoneLookup.ts:47
     hostedZoneId: string | undefined,
0.85 packages/alchemy/src/Auth/OAuthFlow.ts:201
     expires_in: number;
0.85 packages/alchemy/src/Cloudflare/Access/Bookmark.ts:48
     bookmarkId: string;
0.85 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionFilter.ts:37
     filterId: string;
0.85 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionFilter.ts:37
     filterId: string;
0.85 packages/alchemy/src/Cloudflare/Logs.ts:112
     accountId: string;
0.85 packages/alchemy/src/Cloudflare/MagicTransit/SiteWan.ts:63
     wanId: string;
0.85 packages/alchemy/src/Cloudflare/PageRule/PageRule.ts:45
     target: string;
0.85 packages/alchemy/src/Cloudflare/RiskScoring/Integration.ts:26
     tenantUrl: string;
0.85 packages/alchemy/src/Cloudflare/Spectrum/Application.ts:421
     const getApp = (zoneId: string, appId: string) =>
0.85 packages/alchemy/src/Cloudflare/Ssl/CertificatePack.ts:301
     const zoneId = news.zoneId as string;
0.85 packages/alchemy/src/Cloudflare/Zone/Zone.ts:361
     zoneId: z.id,
0.85 packages/alchemy/src/Fly/VolumeSnapshot.ts:42
     volumeId: string;
0.85 packages/alchemy/src/Hetzner/VolumeAttachment.ts:61
     volumeId: number;
0.85 packages/alchemy/src/InstanceId.ts:5
     export class InstanceId extends Context.Service<InstanceId, string>()(
0.85 packages/alchemy/src/Railway/Up.ts:21
     readonly deploymentId: string;
0.85 packages/alchemy/src/Railway/Usage.ts:421
     workspaceId: string;
0.85 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:116
     export const assertOnlyMachine = (appName: string, machineId: string) =>
0.85 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:20
     machineId: Schema.String,
0.85 packages/alchemy/test/Fly/fixtures/transport.ts:21
     machineId?: string;
0.85 packages/alchemy/test/Railway/fixtures/volume-api.ts:13
     export const VOLUME_PORT = 3000;
0.84 packages/alchemy/src/ACME/Account.ts:69
     never,
0.84 packages/alchemy/src/ACME/CertificateAuthority.ts:9
     readonly directoryUrl: string;
0.84 packages/alchemy/src/AWS/AuthProvider.ts:389
     const region = storedValueText(values.region) ?? "";
0.84 packages/alchemy/src/AWS/EC2/ClientVpnEndpoint.ts:178
     *   clientCidrBlock: "172.20.0.0/22",
0.84 packages/alchemy/src/AWS/EC2/NetworkInterfaceAttachment.ts:207
     Schedule.fixed(3000),
0.84 packages/alchemy/src/AWS/ECR/Repository.ts:81
     > {}
0.84 packages/alchemy/src/AWS/ElastiCache/ServerlessCache.ts:149
     never,
0.84 packages/alchemy/src/AWS/IdentityCenter/common.ts:106
     instanceArn: string;
0.84 packages/alchemy/src/AWS/KMS/Key.ts:414
     KeyId: output.keyId,
0.84 packages/alchemy/src/AWS/Organizations/OrganizationalUnit.ts:342
     return match?.Id ? yield* readOUById(match.Id) : undefined;
0.84 packages/alchemy/src/AWS/Organizations/Policy.ts:23
     export type PolicyId = string;
0.84 packages/alchemy/src/AWS/Route53/HealthCheck.ts:104
     never,
0.84 packages/alchemy/src/AWS/SNS/Topic.ts:320
     topicArn: topicArn as TopicArn,
0.84 packages/alchemy/src/AWS/VpcLattice/Listener.ts:63
     listenerId: string;
0.84 packages/alchemy/src/Cloudflare/AI/Gateway.ts:564
     const acct = output?.accountId ?? accountId;
0.84 packages/alchemy/src/Cloudflare/ClientCertificate/ClientCertificate.ts:61
     zoneId: string;
0.84 packages/alchemy/src/Cloudflare/Connectivity/DirectoryService.ts:41
     tunnelId: string;
0.84 packages/alchemy/src/Cloudflare/Email/SendingSubdomain.ts:41
     zoneId: string;
0.84 packages/alchemy/src/Cloudflare/LoadBalancer/Monitor.ts:123
     monitorId: string;
0.84 packages/alchemy/src/Cloudflare/LoadBalancer/Pool.ts:495
     accountId: string,
0.84 packages/alchemy/src/Cloudflare/MagicTransit/SiteLan.ts:381
     id?: string | null;
0.84 packages/alchemy/src/Cloudflare/MagicTransit/StaticRoute.ts:82
     never,
0.84 packages/alchemy/src/Cloudflare/OriginCaCertificate/OriginCaCertificate.ts:396
     certificateId: cert.id!,
0.84 packages/alchemy/src/Hetzner/Firewall.ts:42
     readonly serverId: number;
0.84 packages/alchemy/src/Hetzner/FloatingIpAssignment.ts:32
     readonly id: number;
0.84 packages/alchemy/src/Neon/BranchScope.ts:21
     projectId: string;
0.84 packages/alchemy/src/Neon/CustomDomain.ts:39
     never,
0.84 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:23
     orgId: string;
0.84 packages/alchemy/src/Planetscale/AuthProvider.ts:141
     organization: Schema.String,
0.84 packages/alchemy/src/Prisma/Internal/AppIdentity.ts:6
     id: string;
0.84 packages/alchemy/src/Prisma/PrismaDevDatabase.ts:301
     const options = optionsFrom(databaseId, config);
0.84 packages/alchemy/src/Railway/CustomDomain.ts:101
     customDomainId: string;
0.84 packages/alchemy/src/Railway/GraphQL.ts:30
     projectId: string,
0.84 packages/alchemy/src/Railway/Mongo.ts:401
     serviceId: string;
0.84 packages/alchemy/src/Railway/Website/FrameworkSite.ts:341
     id: string,
0.84 packages/alchemy/src/Railway/rpc-token.ts:11
     export const DEFAULT_RPC_PORT = 3000;
0.84 packages/alchemy/src/Runtime/Bootstrap/Prisma.ts:24
     readonly port: number;
0.84 packages/alchemy/test/AWS/FSx/bindings-handler.ts:14
     const MISSING_BACKUP_ID = "backup-00000000000000000";
0.84 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:8
     readonly url: string;
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/hibernating-websocket/worker.ts:142
     count: 42,
0.84 packages/alchemy/test/types/Agent.ts:127
     const id = "TODO";
0.84 packages/cloudflare-runtime/src/core/bindings/queue/QueueOptions.shared.ts:24
     readonly accountId: string;
0.84 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/experiment-analytics.ts:11
     accountId?: number;
0.84 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/types.ts:10
     accountId?: number;
0.84 packages/cloudflare-runtime/src/internal/workflows-shared/subscription.ts:141
     stepName: Schema.String,
0.83 packages/alchemy/src/AWS/Athena/WorkGroup.ts:280
     news.outputLocation !== undefined &&
0.83 packages/alchemy/src/AWS/Budgets/Budget.ts:123
     never,
0.83 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:41
     policyArn: string;
0.83 packages/alchemy/src/AWS/CloudFront/VpcOrigin.ts:32
     arn: string;
0.83 packages/alchemy/src/AWS/DMS/Endpoint.ts:241
     Port: props.port,
0.83 packages/alchemy/src/AWS/ELBv2/LoadBalancer.ts:105
     never,
0.83 packages/alchemy/src/AWS/GlobalAccelerator/EndpointGroup.ts:41
     listenerPort: number;
0.83 packages/alchemy/src/AWS/IAM/Policy.ts:240
     policyArn: string;
0.83 packages/alchemy/src/AWS/Kinesis/Stream.ts:656
     StreamName: streamName,
0.83 packages/alchemy/src/AWS/MailManager/Relay.ts:60
     never,
0.83 packages/alchemy/src/AWS/MemoryDB/Cluster.ts:340
     const name =
0.83 packages/alchemy/src/AWS/NeptuneGraph/Graph.ts:202
     const getGraph = Effect.fn(function* (graphId: string) {
0.83 packages/alchemy/src/AWS/NotificationsContacts/EmailContact.ts:31
     emailAddress: string;
0.83 packages/alchemy/src/AWS/OSIS/PipelineEndpoint.ts:45
     endpointId: string;
0.83 packages/alchemy/src/AWS/RedshiftServerless/Workgroup.ts:61
     port?: number;
0.83 packages/alchemy/src/AWS/SES/CustomVerificationEmailTemplate.ts:79
     *   fromEmailAddress: "verify@example.com",
0.83 packages/alchemy/src/AWS/SQS/Queue.ts:755
     QueueUrl: queueUrl,
0.83 packages/alchemy/src/AWS/VpcLattice/TargetGroup.ts:321
     targetGroupId: string,
0.83 packages/alchemy/src/Axiom/Chart.ts:37
     readonly id: string;
0.83 packages/alchemy/src/Axiom/Dashboard.ts:15
     uid: string;
0.83 packages/alchemy/src/Cloudflare/Access/Group.ts:86
     never,
0.83 packages/alchemy/src/Cloudflare/Access/KeyConfiguration.ts:25
     accountId: string;
0.83 packages/alchemy/src/Cloudflare/Access/ServiceToken.ts:251
     accountId: acct,
0.83 packages/alchemy/src/Cloudflare/Email/Domain.ts:87
     domainId: string;
0.83 packages/alchemy/src/Cloudflare/Healthcheck/Healthcheck.ts:201
     zoneId: string;
0.83 packages/alchemy/src/Cloudflare/Stream/LiveInputOutput.ts:82
     never,
0.83 packages/alchemy/src/Cloudflare/Workers/Route.ts:42
     routeId: string;
0.83 packages/alchemy/src/Fly/Machine.ts:359
     appName: string;
0.83 packages/alchemy/src/Fly/Sprite.ts:540
     port: number;
0.83 packages/alchemy/src/Fly/Website/FrameworkSite.ts:289
     sourcePath: clientDir as unknown as string,
0.83 packages/alchemy/src/Hetzner/Website/FrameworkSite.ts:221
     ? `http://${args.domain}:${String(args.port)}`
0.83 packages/alchemy/src/Hetzner/actions.ts:9
     actionId: number;
0.83 packages/alchemy/src/Neon/DataApi.ts:21
     branch: { projectId: string; branchId: string; databaseName?: string };
0.83 packages/alchemy/src/Neon/OrganizationMemberRole.ts:101
     scope: { orgId: string; memberId: string } | undefined,
0.83 packages/alchemy/src/Neon/Storage.ts:81
     cursor?: string;
0.83 packages/alchemy/src/Railway/AuditLog.ts:30
     readonly projectId: string;
0.83 packages/alchemy/src/Railway/PrivateNetwork.ts:162
     projectId: string;
0.83 packages/alchemy/src/Railway/Volume.ts:561
     volumeId: string,
0.83 packages/alchemy/test/AWS/ELBv2/fixtures/acm.ts:18
     domainName: string,
0.83 packages/alchemy/test/Cli/PlanTestNodes.ts:21
     const resource = (id: string, props: object): ResourceLike => ({
0.83 packages/alchemy/test/Cli/fixtures/register-dev-mode-probe.ts:1
     export const alchemyUrl = import.meta.resolve("alchemy");
0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket/rpcs.ts:25
     Rpc.make("reject", { success: Schema.Never, error: Rejected }),
0.83 packages/alchemy/test/Fly/fixtures/bluegreen-worker-shared.ts:66
     id: string;
0.83 packages/cloudflare-runtime/src/core/globals/EmailOptions.shared.ts:12
     export const PATH_EMAIL = "/cdn-cgi/handler/email";
0.83 packages/floci/src/index.ts:141
     readonly port?: number | undefined;
0.82 packages/alchemy/src/ACME/Errors.ts:19
     readonly orderUrl: string;
0.82 packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts:60
     policyArn: string;
0.82 packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts:101
     never,
0.82 packages/alchemy/src/AWS/B2BI/Partnership.ts:68
     never,
0.82 packages/alchemy/src/AWS/Cognito/UserPoolClient.ts:61
     accessTokenValidity?: number;
0.82 packages/alchemy/src/AWS/EKS/Cluster.ts:680
     `Role '${roleName}' already exists and is not managed by alchemy`,
0.82 packages/alchemy/src/AWS/ElastiCache/CacheCluster.ts:46
     cacheClusterId: string;
0.82 packages/alchemy/src/AWS/Logs/LogGroup.ts:361
     retentionInDays: desiredRetention,
0.82 packages/alchemy/src/AWS/VerifiedPermissions/IdentitySource.ts:81
     identityTokenOnly?: never;
0.82 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:49
     identityProviderId: string,
0.82 packages/alchemy/src/Cloudflare/Acm/CustomTrustStore.ts:185
     const zoneId = output?.zoneId ?? (olds?.zoneId as string | undefined);
0.82 packages/alchemy/src/Cloudflare/Addressing/PrefixDelegation.ts:20
     prefixId: string;
0.82 packages/alchemy/src/Cloudflare/Alerting/NotificationPolicy.ts:106
     never,
0.82 packages/alchemy/src/Cloudflare/Alerting/Silence.ts:44
     silenceId: string;
0.82 packages/alchemy/src/Cloudflare/D1/Database.ts:549
     databaseId,
0.82 packages/alchemy/src/Cloudflare/DNS/ZoneTransferIncoming.ts:21
     zoneId: string;
0.82 packages/alchemy/src/Cloudflare/Devices/DefaultProfile.ts:201
     never,
0.82 packages/alchemy/src/Cloudflare/Gateway/Rule.ts:441
     readonly name?: string;
0.82 packages/alchemy/src/Cloudflare/Intel/IndicatorFeedPermission.ts:19
     feedId: number;
0.82 packages/alchemy/src/Cloudflare/LoadBalancer/LoadBalancer.ts:183
     never,
0.82 packages/alchemy/src/Cloudflare/Logpush/Job.ts:101
     zoneId?: string;
0.82 packages/alchemy/src/Cloudflare/MagicCloudNetworking/OnRamp.ts:302
     const { accountId } = yield* yield* CloudflareEnvironment;
0.82 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Config.ts:21
     id: string;
0.82 packages/alchemy/src/Cloudflare/Pages/Deployment.ts:23
     readonly deploymentId: string;
0.82 packages/alchemy/src/Cloudflare/Pages/Domain.ts:101
     never,
0.82 packages/alchemy/src/Cloudflare/R2/DataCatalog.ts:69
     bucketName: string;
0.82 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:101
     accountId: string;
0.82 packages/alchemy/src/Cloudflare/Rules/List.ts:461
     const getListById = (accountId: string, listId: string) =>
0.82 packages/alchemy/src/Cloudflare/Workers/AlarmCallback.ts:44
     id: string;
0.82 packages/alchemy/src/Cloudflare/Zone/Setting.ts:186
     zoneId: string;
0.82 packages/alchemy/src/Git/PushWire.ts:17
     readonly o: string;
0.82 packages/alchemy/src/GitHub/Webhook.ts:102
     never,
0.82 packages/alchemy/src/Hetzner/Zone.ts:81
     zoneId: number;
0.82 packages/alchemy/src/Infisical/AuthProvider.ts:72
     readonly apiBaseUrl: string;
0.82 packages/alchemy/src/Neon/FunctionProvider.ts:23
     deploymentId: number;
0.82 packages/alchemy/src/Neon/Project.ts:142
     defaultBranchId: string;
0.82 packages/alchemy/src/Planetscale/MySQL/MySQLClusterSize.ts:35
     | (string & {});
0.82 packages/alchemy/src/Planetscale/Postgres/PostgresRole.ts:563
     port: 5432,
0.82 packages/alchemy/src/Prisma/Website/FrameworkSite.ts:19
     | string
0.82 packages/alchemy/src/Railway/Function.ts:521
     id: string,
0.82 packages/alchemy/src/Railway/Website/Cdn.ts:261
     serviceId,
0.82 packages/alchemy/src/Stripe/Customer.ts:142
     id: customer.id,
0.82 packages/alchemy/test/AWS/EC2/Gone.ts:25
     export const assertVpcGone = Effect.fn(function* (vpcId: string) {
0.82 packages/alchemy/test/Cloudflare/Container/fixtures/attachment/worker.ts:4
     defaultPort = 8080;
0.82 packages/alchemy/test/Cloudflare/Container/fixtures/publication/applications.ts:61
     export const recoveryApplications = (delay: number, includeSecond = false) =>
0.82 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:33
     DATABASE_URL: string;
0.82 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:80
     const id = Number(userMatch[1]);
0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:831
     yield* storage.put("cleanupWrite", "rolled-back");
0.82 packages/alchemy/test/Neon/fixtures/function-effect.ts:24
     const recordLifecycle = (id: string, phase: string) =>
0.82 packages/alchemy/test/Prisma/ORM/Generated.types.ts:20
     { id: number; email: string; name: string | null }
0.82 packages/cloudflare-runtime/src/core/RuntimeServices.ts:46
     accountId: string | Effect.Effect<string>;
0.82 packages/cloudflare-runtime/src/core/bindings/MtlsCertificate.ts:3
     export const remote = (binding: string, certificateId: string) =>
0.82 packages/cloudflare-runtime/src/core/internal/shared.worker.ts:319
     id: BlobId,
0.82 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/analytics.ts:51
     accountId?: number;
0.82 packages/cloudflare-runtime/src/internal/workflows-shared/instance.ts:12
     id: string;
0.82 packages/frontend-frameworks/src/vinext/cache/kv-http.ts:19
     readonly accountId: string;
0.81 packages/alchemy/src/ACME/Certificate.ts:82
     certificateUrl: string;
0.81 packages/alchemy/src/AWS/AppConfig/HostedConfigurationVersion.ts:12
     applicationId: string;
0.81 packages/alchemy/src/AWS/Cognito/User.ts:186
     const userPoolId = news.userPoolId;
0.81 packages/alchemy/src/AWS/CostExplorer/AnomalyEventSource.ts:51
     accountId?: string;
0.81 packages/alchemy/src/AWS/CostExplorer/AnomalySubscription.ts:21
     address: string;
0.81 packages/alchemy/src/AWS/EC2/Instance.ts:491
     const state = instance.State?.Name;
0.81 packages/alchemy/src/AWS/ECRPublic/Repository.ts:21
     export type RepositoryName = string;
0.81 packages/alchemy/src/AWS/ECS/Cluster.ts:317
     clusterName,
0.81 packages/alchemy/src/AWS/ELBv2/ListenerRule.ts:36
     readonly priority: number;
0.81 packages/alchemy/src/AWS/ELBv2/TrustStore.ts:41
     numberOfCaCertificates: number;
0.81 packages/alchemy/src/AWS/Kinesis/StreamConsumer.ts:21
     export type ConsumerName = string;
0.81 packages/alchemy/src/AWS/Redshift/Cluster.ts:41
     clusterIdentifier?: string;
0.81 packages/alchemy/src/AWS/SNS/PlatformApplication.ts:241
     id: string,
0.81 packages/alchemy/src/AWS/SecurityLake/ExceptionSubscription.ts:44
     never,
0.81 packages/alchemy/src/AWS/ServiceCatalog/internal.ts:9
     export const idempotencyToken = (instanceId: string): string =>
0.81 packages/alchemy/src/Axiom/Dataset.ts:81
     never,
0.81 packages/alchemy/src/Cloudflare/Access/Organization.ts:126
     accountId: string;
0.81 packages/alchemy/src/Cloudflare/Alerting/Webhook.ts:61
     webhookId: string;
0.81 packages/alchemy/src/Cloudflare/ApiShield/Operation.ts:64
     operationId: string;
0.81 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:7
     accountId: string;
0.81 packages/alchemy/src/Cloudflare/DNS/ZoneTransferPeer.ts:69
     port: number | undefined;
0.81 packages/alchemy/src/Cloudflare/Devices/DexTest.ts:81
     accountId: string;
0.81 packages/alchemy/src/Cloudflare/Devices/ManagedNetwork.ts:52
     networkId: string;
0.81 packages/alchemy/src/Cloudflare/Devices/PostureIntegration.ts:118
     never,
0.81 packages/alchemy/src/Cloudflare/Diagnostics/EndpointHealthcheck.ts:61
     never,
0.81 packages/alchemy/src/Cloudflare/Email/Routing.ts:55
     never,
0.81 packages/alchemy/src/Cloudflare/Iam/UserGroup.ts:82
     createdOn: string;
0.81 packages/alchemy/src/Cloudflare/Iam/UserGroupMembership.ts:41
     status: string | undefined;
0.81 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CloudIntegration.ts:91
     integrationId: string;
0.81 packages/alchemy/src/Cloudflare/OriginPostQuantumEncryption/OriginPostQuantumEncryption.ts:32
     zoneId: string;
0.81 packages/alchemy/src/Cloudflare/ResourceSharing/ShareRecipient.ts:52
     accountId: string;
0.81 packages/alchemy/src/Cloudflare/Stream/Watermark.ts:291
     const getWatermark = (accountId: string, watermarkId: string) =>
0.81 packages/alchemy/src/Cloudflare/Tunnel/Tunnel.ts:101
     Providers
0.81 packages/alchemy/src/Docker/ServiceImage.ts:32
     port?: number;
0.81 packages/alchemy/src/Fly/DeploymentState.ts:63
     const count = Number(countText);
0.81 packages/alchemy/src/Fly/Postgres.ts:121
     clusterId: string;
0.81 packages/alchemy/src/GitHub/AuthProvider.ts:74
     baseUrl?: string;
0.81 packages/alchemy/src/Hetzner/Server.ts:101
     serverType: string;
0.81 packages/alchemy/src/Kubernetes/ClusterAdapter.ts:222
     id: string;
0.81 packages/alchemy/src/Local/RpcSpawner.ts:201
     serverEntryUrl: string,
0.81 packages/alchemy/src/Neon/FunctionTrigger.ts:44
     /** Project-wide trigger identifier. */ triggerId: string;
0.81 packages/alchemy/src/Neon/OrganizationApiKey.ts:13
     orgId: string;
0.81 packages/alchemy/src/Prisma/Deployment.ts:120
     * const deployment = yield* Prisma.Deployment("web", {
0.81 packages/alchemy/src/Prisma/Internal/AppPromotion.ts:22
     appId: string,
0.81 packages/alchemy/src/Prisma/Internal/DeploymentIdentity.ts:10
     appId: string,
0.81 packages/alchemy/src/Railway/Bind.ts:35
     readonly LogicalId: string;
0.81 packages/alchemy/src/Railway/Bucket.ts:102
     bucketId: string;
0.81 packages/alchemy/src/Railway/Sandbox.ts:381
     sandboxId: string;
0.81 packages/alchemy/src/State/HttpStateStore.ts:141
     fqn: string;
0.81 packages/alchemy/src/Stripe/Account.ts:461
     const getById = (account: string) =>
0.81 packages/alchemy/src/Stripe/CreditGrant.ts:107
     customer?: string;
0.81 packages/alchemy/src/Stripe/IssuingPersonalizationDesign.ts:99
     * Id of the physical bundle (`ics_…`) this design ships with. Required.
0.81 packages/alchemy/src/Telemetry/Attributes.ts:21
     readonly "alchemy.user.id": string;
0.81 packages/alchemy/test/AWS/SageMaker/handler.ts:64
     const record = (userId: string, clicks: number) => [
0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:15
     incrementD1: (key: string) => Effect.Effect<number, never, RuntimeContext>;
0.81 packages/alchemy/test/Docker/Runtime.ts:44
     Effect.callback<number, Error>((resume) => {
0.81 packages/alchemy/test/Fly/fixtures/bluegreen-secrets.ts:18
     port: 3000,
0.81 packages/alchemy/test/Local/fixtures/process-effect.ts:31
     export const assertPidExited = (pid: number): Effect.Effect<void, Error> =>
0.81 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:33
     readonly debugPortAddress: string;
0.81 packages/pkg/src/Registry/Tags.ts:17
     sha256: Schema.String,
0.80 packages/alchemy/src/AWS/AMP/QueryLoggingConfiguration.ts:47
     never,
0.80 packages/alchemy/src/AWS/B2BI/Profile.ts:52
     profileId: string;
0.80 packages/alchemy/src/AWS/CloudHSMV2/internal.ts:24
     export const findClusterById = Effect.fn(function* (clusterId: string) {
0.80 packages/alchemy/src/AWS/CloudWatch/common.ts:10
     id: string,
0.80 packages/alchemy/src/AWS/DAX/Connect.ts:15
     host: string;
0.80 packages/alchemy/src/AWS/EC2/ClientVpnTargetNetworkAssociation.ts:46
     never,
0.80 packages/alchemy/src/AWS/EC2/Network.ts:141
     props.cidrBlock,
0.80 packages/alchemy/src/AWS/ELBv2/TargetGroupAttachment.ts:20
     targetId: string;
0.80 packages/alchemy/src/AWS/EventBridge/Connection.ts:22
     `arn:aws:events:${RegionID}:${AccountID}:connection/${ConnectionName}/${string}`;
0.80 packages/alchemy/src/AWS/IAM/OpenIDConnectProvider.ts:41
     url: string;
0.80 packages/alchemy/src/AWS/Neptune/DBCluster.ts:218
     never,
0.80 packages/alchemy/src/AWS/QBusiness/Application.ts:141
     never,
0.80 packages/alchemy/src/AWS/QBusiness/WebExperience.ts:114
     *   applicationId: app.applicationId,
0.80 packages/alchemy/src/AWS/RePostSpace/Space.ts:221
     status: string;
0.80 packages/alchemy/src/Axiom/AuthProvider.ts:28
     apiBaseUrl: string;
0.80 packages/alchemy/src/Cli/components/view/PlanTree.ts:23
     id: string;
0.80 packages/alchemy/src/Cloudflare/Access/Certificate.ts:301
     id?: string | null;
0.80 packages/alchemy/src/Cloudflare/Account/Account.ts:101
     never,
0.80 packages/alchemy/src/Cloudflare/Addressing/AddressMap.ts:101
     never,
0.80 packages/alchemy/src/Cloudflare/Addressing/Prefix.ts:281
     asn: prefix.asn ?? 0,
0.80 packages/alchemy/src/Cloudflare/Cache/RegionalTieredCache.ts:21
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:701
     id: string,
0.80 packages/alchemy/src/Cloudflare/DNS/ZoneTransferTsig.ts:45
     accountId: string;
0.80 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionRule.ts:322
     name: rule.name,
0.80 packages/alchemy/src/Cloudflare/Email/BlockSender.ts:41
     blockSenderId: string;
0.80 packages/alchemy/src/Cloudflare/Firewall/Lockdown.ts:81
     lockdownId: string;
0.80 packages/alchemy/src/Cloudflare/KV/Namespace.ts:129
     accountId: acct,
0.80 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/Detection.ts:21
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/LogsControl/RetentionFlag.ts:22
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/MagicTransit/GreTunnel.ts:81
     customerGreEndpoint: string;
0.80 packages/alchemy/src/Cloudflare/MagicTransit/Site.ts:62
     siteId: string;
0.80 packages/alchemy/src/Cloudflare/ManagedTransforms/ManagedTransforms.ts:85
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameAssociation.ts:35
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/SecretsStore/SecretsStore.ts:18
     accountId: string;
0.80 packages/alchemy/src/Cloudflare/Stream/LiveInput.ts:86
     liveInputId: string;
0.80 packages/alchemy/src/Cloudflare/UrlNormalization/UrlNormalization.ts:40
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/WaitingRoom/WaitingRoom.ts:202
     zoneId: string;
0.80 packages/alchemy/src/Cloudflare/Workers/ScheduledEvents.ts:28
     id: string;
0.80 packages/alchemy/src/Docker/Service.ts:282
     image: string;
0.80 packages/alchemy/src/Fly/MountVolume.ts:85
     ): value is Resource<string, any, any, ServiceBinding> =>
0.80 packages/alchemy/src/Fly/Redis.ts:86
     redisId: string;
0.80 packages/alchemy/src/Git/Jobs/Bundle.ts:68
     export const MAX_BUNDLE_BYTES = 512 * 1024 * 1024;
0.80 packages/alchemy/src/Git/Jobs/Import.ts:44
     readonly url: string;
0.80 packages/alchemy/src/GitHub/Label.ts:364
     url: string;
0.80 packages/alchemy/src/Hetzner/hosted.ts:41
     volumeId: number;
0.80 packages/alchemy/src/Neon/Auth.ts:63
     projectId: string;
0.80 packages/alchemy/src/Neon/Branch.ts:41
     export type BranchSource = Project | { projectId: string };
0.80 packages/alchemy/src/Planetscale/Database.ts:86
     id: string;
0.80 packages/alchemy/src/Planetscale/Postgres/PostgresMigrations.ts:123
     id: string;
0.80 packages/alchemy/src/Prisma/ComputeLifecycle.ts:61
     deploymentId: string;
0.80 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:9
     const startConflictIsIdempotent = (deploymentId: string, error: Conflict) =>
0.80 packages/alchemy/src/Railway/MountVolume.ts:31
     volumeId: string;
0.80 packages/alchemy/src/Railway/Service.ts:242
     serviceId: string;
0.80 packages/alchemy/src/Railway/VolumeBackup.ts:321
     volumeInstanceId: string;
0.80 packages/alchemy/src/State/ResourceState.ts:45
     instanceId: string;
0.80 packages/alchemy/src/Stripe/RadarValueList.ts:83
     id: string;
0.80 packages/alchemy/test/AWS/IAM/fixtures.ts:84
     export const testOidcUrl = "https://example.com/alchemy-oidc";
0.80 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/analytics.ts:22
     accountId?: number;
0.80 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/configuration.ts:17
     account_id: configuration?.account_id ?? -1,
0.80 packages/cloudflare-runtime/src/internal/workflows-shared/types.ts:50
     instanceId: string,
0.80 packages/pkg/src/Registry/Bindings.ts:55
     apiUrl: Schema.String,
0.79 packages/alchemy-test/src/Reporter.ts:17
     readonly id: string;
0.79 packages/alchemy/src/AWS/Account/Region.ts:14
     export type RegionOptStatus = string;
0.79 packages/alchemy/src/AWS/AutoScaling/LifecycleHook.ts:286
     LifecycleHookName: lifecycleHookName,
0.79 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:372
     RoleName: roleName,
0.79 packages/alchemy/src/AWS/Batch/JobQueue.ts:314
     const name = output.jobQueueName;
0.79 packages/alchemy/src/AWS/Bedrock/ModelArns.ts:33
     accountId: string,
0.79 packages/alchemy/src/AWS/CloudFront/CachePolicy.ts:83
     never,
0.79 packages/alchemy/src/AWS/Cognito/IdentityProvider.ts:157
     userPoolId: string,
0.79 packages/alchemy/src/AWS/Cognito/ManagedLoginBranding.ts:46
     userPoolId: string;
0.79 packages/alchemy/src/AWS/Deadline/Fleet.ts:118
     scriptBody: string | Redacted.Redacted<string>;
0.79 packages/alchemy/src/AWS/DevOpsGuru/NotificationChannel.ts:37
     id: string;
0.79 packages/alchemy/src/AWS/DocDB/DBCluster.ts:141
     port: number | undefined;
0.79 packages/alchemy/src/AWS/EC2/DhcpOptions.ts:222
     ownerId: opts.OwnerId!,
0.79 packages/alchemy/src/AWS/EC2/SecurityGroupRule.ts:121
     groupOwnerId: string;
0.79 packages/alchemy/src/AWS/EC2/Vpc.ts:29
     cidrBlock?: string;
0.79 packages/alchemy/src/AWS/EMR/Studio.ts:106
     studioId: string;
0.79 packages/alchemy/src/AWS/EventBridge/Archive.ts:181
     eventSourceArn: string;
0.79 packages/alchemy/src/AWS/Firehose/DeliveryStream.ts:181
     versionId: string;
0.79 packages/alchemy/src/AWS/Grafana/CreateWorkspaceServiceAccountToken.ts:15
     serviceAccountId: string;
0.79 packages/alchemy/src/AWS/GuardDuty/FindingEventSource.ts:22
     accountId?: string;
0.79 packages/alchemy/src/AWS/GuardDuty/ThreatIntelSet.ts:121
     accountId: string,
0.79 packages/alchemy/src/AWS/IAM/Role.ts:580
     RoleName: roleName,
0.79 packages/alchemy/src/AWS/IoTWireless/WirelessDevice.ts:103
     DevEui?: string;
0.79 packages/alchemy/src/AWS/LakeFormation/ResourceSpec.ts:12
     id?: string;
0.79 packages/alchemy/src/AWS/Lambda/MicrovmBundle.ts:28
     port: number,
0.79 packages/alchemy/src/AWS/Local/FlociServices.ts:27
     export const FLOCI_REGION = "us-east-1";
0.79 packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts:294
     name: string;
0.79 packages/alchemy/src/AWS/Organizations/DelegatedAdministrator.ts:183
     accountEmail: unredact(admin.Email),
0.79 packages/alchemy/src/AWS/SES/BindingHttp.ts:174
     ? identity.emailIdentity
0.79 packages/alchemy/src/AWS/SES/Contact.ts:94
     *   emailAddress: "reader@example.com",
0.79 packages/alchemy/src/AWS/SES/EmailIdentityPolicy.ts:21
     emailIdentity: string;
0.79 packages/alchemy/src/Cloudflare/AI/GatewayProvider.ts:89
     secretId: string;
0.79 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:349
     accountId: auth.accountId,
0.79 packages/alchemy/src/Cloudflare/Access/CustomPage.ts:42
     customPageId: string;
0.79 packages/alchemy/src/Cloudflare/Access/InfrastructureTarget.ts:62
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/Access/Policy.ts:501
     id?: string | null;
0.79 packages/alchemy/src/Cloudflare/Addressing/BgpPrefix.ts:21
     prefixId: string;
0.79 packages/alchemy/src/Cloudflare/Addressing/ServiceBinding.ts:20
     prefixId: string;
0.79 packages/alchemy/src/Cloudflare/Argo/SmartRouting.ts:20
     zoneId: string;
0.79 packages/alchemy/src/Cloudflare/CustomCertificate/CustomCertificate.ts:69
     zoneId: string;
0.79 packages/alchemy/src/Cloudflare/CustomHostname/FallbackOrigin.ts:17
     zoneId: string;
0.79 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:32
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:23
     readonly zoneId: string;
0.79 packages/alchemy/src/Cloudflare/Email/Rule.ts:58
     ruleId: string;
0.79 packages/alchemy/src/Cloudflare/Firewall/UaRule.ts:61
     uaRuleId: string;
0.79 packages/alchemy/src/Cloudflare/Iam/ResourceGroup.ts:62
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/Organization/Organization.ts:125
     never,
0.79 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameCertificate.ts:77
     never,
0.79 packages/alchemy/src/Cloudflare/Queues/Queue.ts:42
     queueId: string;
0.79 packages/alchemy/src/Cloudflare/R2/BucketSippy.ts:252
     const { accountId } = yield* yield* CloudflareEnvironment;
0.79 packages/alchemy/src/Cloudflare/RealtimeKit/App.ts:244
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/ResourceSharing/Share.ts:105
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/Ruleset/AccountEntrypoint.ts:53
     rulesetId: string;
0.79 packages/alchemy/src/Cloudflare/Ruleset/CustomRuleset.ts:68
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/SecretsStore/Secret.ts:64
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/Stream/SigningKey.ts:21
     keyId: string;
0.79 packages/alchemy/src/Cloudflare/Turnstile/Widget.ts:145
     never,
0.79 packages/alchemy/src/Cloudflare/Vectorize/VectorizeMetadataIndex.ts:37
     accountId: string;
0.79 packages/alchemy/src/Cloudflare/Web3/ContentList.ts:47
     zoneId: string;
0.79 packages/alchemy/src/Cloudflare/Web3/Hostname.ts:341
     hostnameId: hostname.id ?? "",
0.79 packages/alchemy/src/Cloudflare/Workers/RpcWebSocket.ts:22
     clientId: Schema.Number,
0.79 packages/alchemy/src/Cloudflare/Workers/ViteChild.shared.ts:17
     export const DEFAULT_DEV_PORT = 1337;
0.79 packages/alchemy/src/Cloudflare/WorkersForPlatforms/DispatchNamespace.ts:31
     namespaceId: string;
0.79 packages/alchemy/src/Fly/Website/Foldkit.ts:35
     export const Foldkit = (id: string, props: FoldkitProps = {}) =>
0.79 packages/alchemy/src/Fly/Website/StaticSite.ts:47
     path?: string;
0.79 packages/alchemy/src/Fly/hosted.ts:481
     previousHash?: string;
0.79 packages/alchemy/src/Git/Api/Schema.ts:142
     { oid: Schema.String, expected: Schema.String, actual: Schema.String },
0.79 packages/alchemy/src/Git/GitHubCompat.ts:163
     const intId = (value: string): number => {
0.79 packages/alchemy/src/Git/Jobs/Fork.ts:119
     const PAGE_SIZE = 400;
0.79 packages/alchemy/src/Hetzner/Catalog.ts:19
     const numericId = (ref: string | number): number | undefined =>
0.79 packages/alchemy/src/Hetzner/Network.ts:141
     never,
0.79 packages/alchemy/src/Hetzner/Volume.ts:125
     never,
0.79 packages/alchemy/src/Neon/AuthTrustedDomain.ts:14
     domain: string;
0.79 packages/alchemy/src/Neon/ProjectMemberRole.ts:24
     orgId: string;
0.79 packages/alchemy/src/Neon/ProjectVPCEndpoint.ts:211
     output.vpcEndpointId !== scope.vpcEndpointId)
0.79 packages/alchemy/src/Planetscale/MySQL/MySQLPassword.ts:81
     database: string;
0.79 packages/alchemy/src/Prisma/Internal/DeploymentObserve.ts:4
     export const observeDeployment = (deploymentId: string) =>
0.79 packages/alchemy/src/Prisma/PrismaEnvironment.ts:13
     baseUrl: string;
0.79 packages/alchemy/src/Railway/ProjectEnvironment.ts:321
     url: `https://railway.com/project/${projectId}?environmentId=${env.id}`,
0.79 packages/alchemy/src/Railway/Variable.ts:401
     projectId: string;
0.79 packages/alchemy/src/Railway/ref.ts:8
     export type VariableRef = string;
0.79 packages/alchemy/src/Stripe/Alert.ts:206
     const toTitle = (id: string, title: string | undefined, existing?: string) =>
0.79 packages/alchemy/src/Stripe/AppsSecret.ts:41
     user?: string;
0.79 packages/alchemy/src/Stripe/BillingPortalConfiguration.ts:356
     never,
0.79 packages/alchemy/src/Stripe/PaymentMethodDomain.ts:161
     id,
0.79 packages/alchemy/src/Stripe/WebhookEndpoint.ts:201
     id: endpoint.id,
0.79 packages/alchemy/src/Tags.ts:43
     export const createInternalTags = Effect.fn(function* (id: string) {
0.79 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:201
     Targets: [{ Id: testTargetIp, Port: 80, AvailabilityZone: "all" }],
0.79 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:21
     const MISSING_PARTICIPANT_ID = "abcDEF123456";
0.79 packages/alchemy/test/Fly/fixtures/bindings-sprite.ts:7
     { main: import.meta.url, port: 3000 },
0.79 packages/alchemy/test/Fly/fixtures/legacy-protocol-writer.ts:28
     machineId: string;
0.79 packages/alchemy/test/Neon/FunctionRollout.ts:67
     url: string,
0.79 packages/alchemy/test/Neon/fixtures/StorageNative.ts:4
     endpoint: string;
0.79 packages/cloudflare-runtime/src/core/proxy/WorkerProxy.ts:441
     port = port === undefined ? options.port : yield* ports.find(port + 1);
0.79 packages/pkg/src/Manifest.ts:43
     size: Schema.Number,
0.79 packages/pkg/src/Protocol.ts:91
     url: Schema.String,
0.78 packages/alchemy/src/ACME/Client.ts:100
     readonly serial: string;
0.78 packages/alchemy/src/AWS/Account/AlternateContact.ts:41
     accountId?: string;
0.78 packages/alchemy/src/AWS/Account/ContactInformation.ts:59
     never,
0.78 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:222
     const readDashboard = Effect.fn(function* (dashboardName: string) {
0.78 packages/alchemy/src/AWS/Deadline/Budget.ts:105
     farmId: string;
0.78 packages/alchemy/src/AWS/DirectoryService/internal.ts:27
     export const readDirectoryTags = Effect.fn(function* (directoryId: string) {
0.78 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:21
     clusterName?: string;
0.78 packages/alchemy/src/AWS/EventBridge/Rule.ts:381
     eventBusName: string;
0.78 packages/alchemy/src/AWS/FinSpace/Environment.ts:241
     readonly environmentId: string;
0.78 packages/alchemy/src/AWS/GuardDuty/IPSet.ts:92
     never,
0.78 packages/alchemy/src/AWS/IAM/SSHPublicKey.ts:32
     sshPublicKeyId: string;
0.78 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:55
     queues: string[];
0.78 packages/alchemy/src/AWS/MailManager/AddonInstance.ts:42
     never,
0.78 packages/alchemy/src/AWS/QBusiness/Retriever.ts:27
     applicationId: string;
0.78 packages/alchemy/src/AWS/Route53/QueryLoggingConfig.ts:15
     hostedZoneId: string;
0.78 packages/alchemy/src/AWS/Route53/Record.ts:169
     hostedZoneId: string;
0.78 packages/alchemy/src/AWS/SecurityLake/SubscriberNotification.ts:21
     targetRoleArn: string;
0.78 packages/alchemy/src/Axiom/View.ts:19
     id: string;
0.78 packages/alchemy/src/Cloudflare/AI/Evaluation.ts:47
     evaluationId: string;
0.78 packages/alchemy/src/Cloudflare/AI/GatewayDynamicRouting.ts:81
     id: string;
0.78 packages/alchemy/src/Cloudflare/AI/SearchInstance.ts:41
     export type RerankingModel = "@cf/baai/bge-reranker-base";
0.78 packages/alchemy/src/Cloudflare/AI/SearchToken.ts:63
     cfApiId: string;
0.78 packages/alchemy/src/Cloudflare/Access/Application.ts:662
     appId: observed.id,
0.78 packages/alchemy/src/Cloudflare/Access/IdentityProvider.ts:881
     identityProviderId: string,
0.78 packages/alchemy/src/Cloudflare/Acm/TotalTls.ts:47
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/Argo/TieredCaching.ts:20
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/Cache/Reserve.ts:21
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/Calls/App.ts:31
     appId: string;
0.78 packages/alchemy/src/Cloudflare/ContentScanning/ContentScanning.ts:24
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/CustomNameserver/CustomNameserver.ts:81
     zoneTag: string;
0.78 packages/alchemy/src/Cloudflare/DNS/View.ts:53
     never,
0.78 packages/alchemy/src/Cloudflare/DNS/ZoneTransferOutgoing.ts:21
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/DdosProtection/AllowlistEntry.ts:61
     never,
0.78 packages/alchemy/src/Cloudflare/Devices/CustomProfile.ts:143
     policyId: string;
0.78 packages/alchemy/src/Cloudflare/Devices/Settings.ts:161
     const acct = output?.accountId ?? accountId;
0.78 packages/alchemy/src/Cloudflare/Dlp/Profile.ts:21
     name: string;
0.78 packages/alchemy/src/Cloudflare/Email/AllowPolicy.ts:29
     pattern: string;
0.78 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/LeakedCredentialCheck.ts:21
     zoneId: string;
0.78 packages/alchemy/src/Cloudflare/LogsControl/CmbConfig.ts:40
     accountId: string;
0.78 packages/alchemy/src/Cloudflare/MtlsCertificate/MtlsCertificate.ts:281
     accountId,
0.78 packages/alchemy/src/Cloudflare/NetworkInterconnects/Settings.ts:26
     accountId: string;
0.78 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Certificate.ts:181
     const zoneId = news.zoneId as string;
0.78 packages/alchemy/src/Cloudflare/Queues/QueueHttp.ts:99
     accountId: string;
0.78 packages/alchemy/src/Cloudflare/RealtimeKit/Webhook.ts:116
     *   url: "https://example.com/webhook",
0.78 packages/alchemy/src/Cloudflare/ResourceSharing/ShareResource.ts:21
     shareId: string;
0.78 packages/alchemy/src/Cloudflare/Rum/Rule.ts:62
     host: string | undefined;
0.78 packages/alchemy/src/Cloudflare/Stream/Webhook.ts:28
     accountId: string;
0.78 packages/alchemy/src/Cloudflare/Tags/AccountResourceTags.ts:84
     accountId: string;
0.78 packages/alchemy/src/Cloudflare/Vectorize/VectorizeIndex.ts:281
     preset: news.preset as never,
0.78 packages/alchemy/src/Cloudflare/Workers/WorkerAccess.ts:78
     readonly account_id?: string;
0.78 packages/alchemy/src/Docker/Context.ts:35
     id: string;
0.78 packages/alchemy/src/Fly/Bucket.ts:103
     orgSlug: string | undefined;
0.78 packages/alchemy/src/Fly/IpAssignment.ts:321
     appName: string,
0.78 packages/alchemy/src/Fly/bluegreen.ts:99
     machineId: string,
0.78 packages/alchemy/src/Hetzner/SshKey.ts:46
     id: number;
0.78 packages/alchemy/src/Neon/Credential.ts:28
     tokenId: string;
0.78 packages/alchemy/src/Neon/Function.ts:61
     /** Public invocation URL. Authenticate callers in the handler. */ url: string;
0.78 packages/alchemy/src/Prisma/Internal/CleanupFailure.ts:9
     resourceId: string,
0.78 packages/alchemy/src/Railway/AuthProvider.ts:201
     .pipe(mapPromptCancellation, Effect.andThen(Effect.never)),
0.78 packages/alchemy/src/Railway/Group.ts:181
     environmentId: string;
0.78 packages/alchemy/src/Railway/Project.ts:81
     never,
0.78 packages/alchemy/src/Stripe/AccountPerson.ts:81
     account: string;
0.78 packages/alchemy/src/Stripe/Price.ts:244
     id: price.id,
0.78 packages/alchemy/test/AWS/CloudWatch/metric-sink-handler.ts:48
     runId: string;
0.78 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:23
     port: 3000,
0.78 packages/alchemy/test/Fly/fixtures/bluegreen.ts:13
     port: 80,
0.78 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:82
     port:
0.78 packages/alchemy/test/SQL/exercise.ts:80
     const alice: UserRow = { id: 1, name: "alice", email: "alice@example.com" };
0.78 packages/cloudflare-runtime/src/core/bindings/Flagship.ts:3
     export const remote = (binding: string, appId: string) =>
0.78 packages/cloudflare-runtime/src/core/bindings/VpcNetwork.ts:4
     readonly binding: string;
0.78 packages/cloudflare-runtime/src/core/bindings/d1/D1Options.shared.ts:19
     readonly databaseId: string;
0.78 packages/cloudflare-runtime/src/core/workerd/Config.ts:104
     name: string;
0.78 packages/cloudflare-runtime/src/internal/workflows-shared/lib/validators.ts:84
     timeout: Schema.optional(NonNegativeNumberOrString),
0.78 packages/pkg/src/Registry/Handler.ts:141
     let pr: number | null = null;
0.77 packages/alchemy/src/AWS/ApiGateway/UsagePlanKey.ts:31
     never,
0.77 packages/alchemy/src/AWS/AppConfig/Deployment.ts:14
     applicationId: string;
0.77 packages/alchemy/src/AWS/Batch/JobDefinition.ts:81
     jobDefinitionName?: string;
0.77 packages/alchemy/src/AWS/CloudFront/Distribution.ts:1081
     never,
0.77 packages/alchemy/src/AWS/CloudWatch/InsightRule.ts:21
     export type InsightRuleName = string;
0.77 packages/alchemy/src/AWS/Cognito/UserPoolDomain.ts:45
     userPoolId: string;
0.77 packages/alchemy/src/AWS/Deadline/Monitor.ts:141
     monitorId: string,
0.77 packages/alchemy/src/AWS/EC2/FlowLog.ts:41
     resourceId: string;
0.77 packages/alchemy/src/AWS/EC2/hosted.ts:41
     imageId: string;
0.77 packages/alchemy/src/AWS/ELBv2/ListenerCertificate.ts:16
     certificateArn: string;
0.77 packages/alchemy/src/AWS/EMR/Cluster.ts:187
     clusterId: string;
0.77 packages/alchemy/src/AWS/EMR/ClusterEventSource.ts:17
     clusterId?: string;
0.77 packages/alchemy/src/AWS/IdentityCenter/AccountAssignment.ts:52
     targetId: string;
0.77 packages/alchemy/src/AWS/Kendra/SearchIndex.ts:270
     readonly id: string;
0.77 packages/alchemy/src/AWS/MQ/Broker.ts:498
     SubnetIds: news.subnetIds,
0.77 packages/alchemy/src/AWS/MediaLive/InputSecurityGroup.ts:30
     Id: string;
0.77 packages/alchemy/src/AWS/Neptune/DBInstance.ts:101
     never,
0.77 packages/alchemy/src/AWS/Notifications/internal.ts:41
     id: string,
0.77 packages/alchemy/src/AWS/Organizations/PolicyAttachment.ts:281
     policyId,
0.77 packages/alchemy/src/AWS/Organizations/common.ts:27
     id: string,
0.77 packages/alchemy/src/AWS/S3Control/AccessPoint.ts:281
     name: string,
0.77 packages/alchemy/src/AWS/Scheduler/ScheduleEventSource.ts:181
     id: string | undefined,
0.77 packages/alchemy/src/AWS/Textract/Adapter.ts:51
     adapterId: string;
0.77 packages/alchemy/src/AWS/Timestream/internal.ts:20
     readonly url: string;
0.77 packages/alchemy/src/AWS/Transfer/User.ts:87
     never,
0.77 packages/alchemy/src/Axiom/Notifier.ts:12
     Axiom.CreateNotifierResponse & { id: string },
0.77 packages/alchemy/src/Cloudflare/Cache/SmartTieredCache.ts:20
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/Cache/Variants.ts:168
     observed: cache.GetVariantResponse["value"],
0.77 packages/alchemy/src/Cloudflare/CertificateAuthorities/HostnameAssociation.ts:21
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionRule.ts:102
     never,
0.77 packages/alchemy/src/Cloudflare/Dlp/Entry.ts:50
     entryId: string;
0.77 packages/alchemy/src/Cloudflare/Flagship/Flag.ts:432
     accountId: output.accountId,
0.77 packages/alchemy/src/Cloudflare/Fraud/DetectionSettings.ts:86
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/HostnameTlsSetting/HostnameTlsSetting.ts:92
     never,
0.77 packages/alchemy/src/Cloudflare/Images/Variant.ts:381
     accountId: string,
0.77 packages/alchemy/src/Cloudflare/LoadBalancer/MonitorGroup.ts:62
     accountId: string;
0.77 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CatalogSync.ts:261
     accountId: output.accountId,
0.77 packages/alchemy/src/Cloudflare/MagicTransit/App.ts:37
     appId: string;
0.77 packages/alchemy/src/Cloudflare/MagicTransit/IpsecTunnel.ts:83
     tunnelId: string;
0.77 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Setting.ts:20
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:209
     never,
0.77 packages/alchemy/src/Cloudflare/R2/Bucket.ts:1381
     * name (a `:` can never appear in a real R2 bucket name).
0.77 packages/alchemy/src/Cloudflare/Rum/Site.ts:161
     stables: ["siteTag", "siteToken", "accountId", "rulesetId", "created"],
0.77 packages/alchemy/src/Cloudflare/SchemaValidation/OperationSetting.ts:29
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/SecurityTxt/SecurityTxt.ts:21
     zoneId: string;
0.77 packages/alchemy/src/Cloudflare/Tags/ZoneResourceTags.ts:67
     resourceId: string;
0.77 packages/alchemy/src/Cloudflare/VulnerabilityScanner/Credential.ts:61
     accountId: string;
0.77 packages/alchemy/src/Cloudflare/VulnerabilityScanner/CredentialSet.ts:39
     never,
0.77 packages/alchemy/src/Cloudflare/Workers/RateLimit.ts:39
     namespaceId: number | string;
0.77 packages/alchemy/src/Cloudflare/Zaraz/Config.ts:281
     zoneId,
0.77 packages/alchemy/src/Docker/RemoteImage.ts:68
     never,
0.77 packages/alchemy/src/Docker/Swarm.ts:42
     id: string;
0.77 packages/alchemy/src/Fly/App.ts:81
     url: string;
0.77 packages/alchemy/src/Fly/Service.ts:218
     count: number;
0.77 packages/alchemy/src/Git/Engine.ts:281
     readonly expectedOid?: string | null;
0.77 packages/alchemy/src/Git/Hasher/WorkerLoaderModule.ts:40
     const base = Number(query.get("base"));
0.77 packages/alchemy/src/GitHub/BaseUrl.ts:52
     export const githubHostname = (baseUrl: string): string => {
0.77 packages/alchemy/src/Hetzner/Certificate.ts:187
     certificateId: number;
0.77 packages/alchemy/src/Hetzner/FloatingIp.ts:193
     id: string,
0.77 packages/alchemy/src/Hetzner/PlacementGroup.ts:61
     id: number;
0.77 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:31
     id: string,
0.77 packages/alchemy/src/Prisma/PrismaLogs.ts:161
     ? Number(query.cursor)
0.77 packages/alchemy/src/Railway/ServiceProvider.ts:261
     : deepEqual(undef(observed as never), desired)
0.77 packages/alchemy/src/Stripe/ApplePayDomain.ts:34
     id: string;
0.77 packages/alchemy/src/Stripe/BillingMeter.ts:107
     id: string;
0.77 packages/alchemy/src/Stripe/ConsumeEvents.ts:61
     path?: string,
0.77 packages/alchemy/src/Stripe/PaymentLink.ts:207
     never,
0.77 packages/alchemy/src/Stripe/Plan.ts:224
     id: plan.id,
0.77 packages/alchemy/src/Stripe/ShippingRate.ts:169
     never,
0.77 packages/alchemy/src/Stripe/TaxRegistration.ts:481
     country: string,
0.77 packages/alchemy/src/Util/Node.ts:15
     export const initialCwd: string = process.cwd();
0.77 packages/alchemy/test/AWS/AutoScaling/TestNetwork.ts:19
     export const getTestAmiId: Effect.Effect<string, any, any> = ec2
0.77 packages/alchemy/test/AWS/Local/fixtures/ecs-dev/main-task.ts:22
     port: 17357,
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-do-namespace-do-rpc/worker.ts:46
     const upto = Number(url.searchParams.get("upto") ?? "5");
0.77 packages/alchemy/test/Fly/fixtures/bluegreen-api.ts:22
     internalPort: 3000,
0.77 packages/alchemy/test/Fly/fixtures/bluegreen-runtime-secrets/writer.ts:25
     port: 3000,
0.77 packages/alchemy/test/Fly/fixtures/unhealthy-api.ts:22
     ports: [{ port: 80, handlers: ["http"] }],
0.77 packages/alchemy/test/Railway/fixtures/rpc-api.ts:23
     port: 3000,
0.77 packages/better-auth/test/http.ts:7
     readonly url: string;
0.77 packages/cloudflare-runtime/src/core/bindings/VpcService.ts:3
     export const remote = (binding: string, serviceId: string) =>
0.77 packages/cloudflare-runtime/src/core/bindings/images/ImagesOptions.shared.ts:39
     export const IMAGES_STORE_NAMESPACE = "images-data";
0.77 packages/cloudflare-runtime/src/core/bindings/queue/QueueBroker.worker.ts:121
     return this.env[BINDING_QUEUE_NAME];
0.77 packages/cloudflare-runtime/src/core/globals/Globals.ts:52
     port: number,
0.77 packages/cloudflare-runtime/src/internal/workers-shared/shared/configuration/validateURL.ts:20
     token: string,
0.77 packages/frontend-frameworks/fixtures/vite-hmr/src/client.ts:14
     let count = 0;
0.77 packages/frontend-frameworks/src/vinext/cli.ts:117
     session: shared.__VINEXT_PAGES_CLIENT_ASSETS_BUILD_SESSION,
0.77 packages/pkg/src/cli/pack.ts:521
     readonly registry: string;
0.76 packages/alchemy/src/AWS/AMP/AlertManagerDefinition.ts:16
     workspaceId: string;
0.76 packages/alchemy/src/AWS/AMP/LoggingConfiguration.ts:16
     workspaceId: string;
0.76 packages/alchemy/src/AWS/AMP/Scraper.ts:91
     destinationWorkspaceArn: string;
0.76 packages/alchemy/src/AWS/AMP/ScraperLoggingConfiguration.ts:28
     scraperId: string;
0.76 packages/alchemy/src/AWS/AMP/internal.ts:22
     export const readAmpTags = Effect.fn(function* (arn: string) {
0.76 packages/alchemy/src/AWS/ApiGateway/Authorizer.ts:67
     authorizerId: string;
0.76 packages/alchemy/src/AWS/ApiGatewayV2/Integration.ts:118
     never,
0.76 packages/alchemy/src/AWS/AuditManager/Assessment.ts:141
     frameworkId: string;
0.76 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:14
     distributionId: string;
0.76 packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts:12
     export type AlarmMuteRuleName = string;
0.76 packages/alchemy/src/AWS/CloudWatch/MetricStream.ts:31
     name?: MetricStreamName;
0.76 packages/alchemy/src/AWS/DirectoryService/ConditionalForwarder.ts:42
     never,
0.76 packages/alchemy/src/AWS/DocDB/Connect.ts:20
     host: string;
0.76 packages/alchemy/src/AWS/EC2/DefaultSecurityGroup.ts:284
     fromPort: rule.FromPort,
0.76 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:235
     networkAclId: props.networkAclId as NetworkAclId,
0.76 packages/alchemy/src/AWS/EC2/Volume.ts:241
     id: string,
0.76 packages/alchemy/src/AWS/EC2/defaultVpcScope.ts:17
     readonly vpcId: string | undefined;
0.76 packages/alchemy/src/AWS/FinSpace/KxEnvironment.ts:181
     kmsKeyId?: string;
0.76 packages/alchemy/src/AWS/IAM/AccessKey.ts:30
     accessKeyId: string;
0.76 packages/alchemy/src/AWS/IdentityCenter/PermissionSet.ts:21
     name: string;
0.76 packages/alchemy/src/AWS/LicenseManager/LicenseConfiguration.ts:208
     licenseConfigurationId: observed.LicenseConfigurationId!,
0.76 packages/alchemy/src/AWS/MediaConvert/JobEventSource.ts:18
     jobId?: string;
0.76 packages/alchemy/src/AWS/OSIS/Pipeline.ts:81
     pipelineConfigurationBody: string;
0.76 packages/alchemy/src/AWS/OpenSearch/DataPlaneTypes.ts:29
     _id: string;
0.76 packages/alchemy/src/AWS/QBusiness/DataSource.ts:83
     dataSourceId: string;
0.76 packages/alchemy/src/AWS/QuickSight/AssetEventSource.ts:19
     awsAccountId?: string;
0.76 packages/alchemy/src/AWS/RDS/Connect.ts:19
     port: number;
0.76 packages/alchemy/src/AWS/Redshift/internal.ts:38
     accountId: string,
0.76 packages/alchemy/src/AWS/SecurityLake/Subscriber.ts:86
     subscriberId: string;
0.76 packages/alchemy/src/AWS/SocialMessaging/LinkedWhatsAppBusinessAccount.ts:102
     never,
0.76 packages/alchemy/src/Alchemist/routes/logs.ts:12
     readonly fqn: string;
0.76 packages/alchemy/src/Auth/Profile.ts:161
     provider: Schema.String,
0.76 packages/alchemy/src/Cloudflare/AI/Dataset.ts:61
     gatewayId: string;
0.76 packages/alchemy/src/Cloudflare/AI/ProviderKey.ts:15
     gatewayId: string;
0.76 packages/alchemy/src/Cloudflare/AI/SecuritySettings.ts:20
     zoneId: string;
0.76 packages/alchemy/src/Cloudflare/ApiShield/Configuration.ts:201
     const zoneId = news.zoneId as string;
0.76 packages/alchemy/src/Cloudflare/BotManagement/BotManagement.ts:161
     never,
0.76 packages/alchemy/src/Cloudflare/Cache/OriginCloudRegion.ts:70
     never,
0.76 packages/alchemy/src/Cloudflare/Calls/TurnKey.ts:32
     keyId: string;
0.76 packages/alchemy/src/Cloudflare/Containers/ContainerPlatform.ts:186
     getTcpPort: (port: number) =>
0.76 packages/alchemy/src/Cloudflare/Containers/StartContainer.ts:121
     const REQUEST_RETRIES = 3;
0.76 packages/alchemy/src/Cloudflare/ContentScanning/Expression.ts:261
     zoneId: string,
0.76 packages/alchemy/src/Cloudflare/Firewall/AccessRule.ts:82
     ruleId: string;
0.76 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:30
     accountId: string;
0.76 packages/alchemy/src/Cloudflare/Gateway/Certificate.ts:148
     const { accountId } = yield* yield* CloudflareEnvironment;
0.76 packages/alchemy/src/Cloudflare/Gateway/Configuration.ts:422
     accountId: string,
0.76 packages/alchemy/src/Cloudflare/Gateway/Logging.ts:62
     accountId: string;
0.76 packages/alchemy/src/Cloudflare/Gateway/ProxyEndpoint.ts:281
     accountId: string,
0.76 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:43
     pipelineId: string;
0.76 packages/alchemy/src/Cloudflare/Queues/Consumer.ts:48
     batchSize?: number;
0.76 packages/alchemy/src/Cloudflare/RealtimeKit/Preset.ts:207
     presetId: string;
0.76 packages/alchemy/src/Cloudflare/SchemaValidation/Settings.ts:44
     zoneId: string;
0.76 packages/alchemy/src/Cloudflare/TokenValidation/Configuration.ts:102
     configId: string;
0.76 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:24
     accountId: string;
0.76 packages/alchemy/src/Cloudflare/VulnerabilityScanner/TargetEnvironment.ts:28
     zoneId: string;
0.76 packages/alchemy/src/Docker/Volume.ts:58
     never,
0.76 packages/alchemy/src/Fly/Website/AssetDeployment.ts:22
     const s3Concurrency = 16;
0.76 packages/alchemy/src/Fly/replicas.ts:83
     machineId: string;
0.76 packages/alchemy/src/Git/Hasher/Protocol.ts:67
     readonly r?: string; // baseOid (delta-resolved)
0.76 packages/alchemy/src/Kubernetes/Deployment.ts:225
     port: number;
0.76 packages/alchemy/src/Nuke.ts:30
     readonly providerId: string;
0.76 packages/alchemy/src/Railway/Template.ts:154
     never,
0.76 packages/alchemy/src/Rename.ts:14
     export type FormerId = string | { fqn: string };
0.76 packages/alchemy/src/SQL/SqlFile.ts:7
     id: string;
0.76 packages/alchemy/src/State/ActionState.ts:22
     logicalId: string;
0.76 packages/alchemy/src/Stripe/EntitlementsFeature.ts:151
     id: string,
0.76 packages/alchemy/src/Stripe/IssuingCard.ts:185
     id: string;
0.76 packages/alchemy/src/Stripe/Product.ts:221
     id: string,
0.76 packages/alchemy/src/Stripe/RadarValueListItem.ts:43
     id: string;
0.76 packages/alchemy/src/Stripe/TerminalConfiguration.ts:361
     id: string;
0.76 packages/alchemy/src/Stripe/TerminalReader.ts:94
     never,
0.76 packages/alchemy/src/Util/ResourceOutput.ts:12
     id: string,
0.76 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:14
     const NONEXISTENT_CLUSTER_ID = "cluster-aaaaaaaaaaa";
0.76 packages/alchemy/test/AWS/MediaTailor/handler.ts:306
     { error: "Not found", method: request.method, pathname },
0.76 packages/alchemy/test/AWS/Route53Resolver/helpers.ts:41
     return { vpcId: vpc.vpcId as string, subnetIds, securityGroupId };
0.76 packages/alchemy/test/Auth/fixtures/lock-holder.ts:12
     Effect.andThen(Effect.never),
0.76 packages/alchemy/test/Cloudflare/Container/fixtures/isolated/object.ts:19
     const { fetch } = yield* container.getTcpPort(3000);
0.76 packages/alchemy/test/Cloudflare/Utils/Http.ts:221
     url: string;
0.76 packages/alchemy/test/Cloudflare/Workers/fixtures/init-io/worker.ts:17
     { trace: string; nonce: string }
0.76 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-http/worker.ts:27
     const makeDOClient = (id: string = "default") =>
0.76 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:24
     port: 0,
0.76 packages/cloudflare-runtime/src/core/DockerLoopback.ts:108
     ports: readonly number[],
0.76 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitBinding.worker.ts:15
     count: number;
0.76 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/configuration.ts:26
     account_id: configuration?.account_id ?? -1,
0.76 packages/pkg/src/Registry/GitHub.ts:275
     getPullRequest: (repo: string, number: number) =>
0.75 packages/alchemy/src/AWS/ApiGatewayV2/common.ts:31
     accountId: string,
0.75 packages/alchemy/src/AWS/AppRunner/AutoScalingConfiguration.ts:81
     maxConcurrency: number | undefined;
0.75 packages/alchemy/src/AWS/Backup/BackupSelection.ts:81
     selectionId: string;
0.75 packages/alchemy/src/AWS/CloudControl/Resource.ts:101
     readonly typeName: string;
0.75 packages/alchemy/src/AWS/DMS/ReplicationInstance.ts:214
     replicationInstanceIdentifier: identifier,
0.75 packages/alchemy/src/AWS/DataZone/EnvironmentBlueprintConfiguration.ts:41
     environmentBlueprint: string;
0.75 packages/alchemy/src/AWS/DirectoryService/Directory.ts:115
     never,
0.75 packages/alchemy/src/AWS/EC2/PrefixList.ts:184
     id: string,
0.75 packages/alchemy/src/AWS/ECR/Image.ts:152
     never,
0.75 packages/alchemy/src/AWS/ECS/Task.ts:881
     taskRoleName: string;
0.75 packages/alchemy/src/AWS/ECS/TaskDefinition.ts:201
     never,
0.75 packages/alchemy/src/AWS/ELBv2/common.ts:63
     port?: string;
0.75 packages/alchemy/src/AWS/EventBridge/EventBus.ts:27
     export type EventBusName = string;
0.75 packages/alchemy/src/AWS/FraudDetector/DetectorVersion.ts:82
     detectorId: string;
0.75 packages/alchemy/src/AWS/Grafana/internal.ts:30
     export const readGrafanaTags = Effect.fn(function* (arn: string) {
0.75 packages/alchemy/src/AWS/IAM/ServiceSpecificCredential.ts:40
     userName: string;
0.75 packages/alchemy/src/AWS/KMS/Alias.ts:37
     never,
0.75 packages/alchemy/src/AWS/Lambda/MicrovmRuntimeContext.ts:20
     id: string,
0.75 packages/alchemy/src/AWS/Macie2/FindingEventSource.ts:22
     id?: string;
0.75 packages/alchemy/src/AWS/QBusiness/SearchIndex.ts:221
     readonly indexId: string;
0.75 packages/alchemy/src/AWS/Route53Profiles/ProfileResourceAssociation.ts:40
     profileResourceAssociationId: string;
0.75 packages/alchemy/src/AWS/Route53Resolver/ResolverRule.ts:58
     domainName: string;
0.75 packages/alchemy/src/AWS/Route53Resolver/ResolverRuleAssociation.ts:202
     resolverRuleAssociationId: association.Id,
0.75 packages/alchemy/src/AWS/SES/EmailIdentity.ts:81
     identityArn: string;
0.75 packages/alchemy/src/AWS/SES/TenantResourceAssociation.ts:32
     never,
0.75 packages/alchemy/src/AWS/SSMContacts/Plan.ts:13
     contactId: string;
0.75 packages/alchemy/src/AWS/ServiceCatalog/Product.ts:103
     productId: string;
0.75 packages/alchemy/src/AWS/ServiceQuotas/ServiceQuotaIncreaseRequest.ts:65
     desiredValue: number;
0.75 packages/alchemy/src/Cloudflare/Access/Tag.ts:32
     accountId: string;
0.75 packages/alchemy/src/Cloudflare/D1/LocalD1Gateway.ts:74
     databaseId: string,
0.75 packages/alchemy/src/Cloudflare/DNS/Firewall.ts:107
     dnsFirewallId: string;
0.75 packages/alchemy/src/Cloudflare/Email/TrustedDomain.ts:269
     trustedDomainId: entry.id ?? "",
0.75 packages/alchemy/src/Cloudflare/Flagship/App.ts:27
     appId: string;
0.75 packages/alchemy/src/Cloudflare/LocalRuntime.ts:119
     export const isLocalId = (id: string | undefined): id is string =>
0.75 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Rule.ts:101
     ruleId: string;
0.75 packages/alchemy/src/Cloudflare/Pages/Project.ts:181
     never,
0.75 packages/alchemy/src/Cloudflare/Pipelines/LegacyPipeline.ts:441
     accountId: string,
0.75 packages/alchemy/src/Cloudflare/Pipelines/Stream.ts:165
     version: number;
0.75 packages/alchemy/src/Cloudflare/Ruleset/Ruleset.ts:261
     zoneId,
0.75 packages/alchemy/src/Cloudflare/SchemaValidation/Schema.ts:341
     zoneId: string,
0.75 packages/alchemy/src/Cloudflare/WaitingRoom/Settings.ts:21
     zoneId: string;
0.75 packages/alchemy/src/Cloudflare/Workers/BrowserHttpClient.ts:34
     accountId: string;
0.75 packages/alchemy/src/Cloudflare/Workers/ObservabilityDestination.ts:81
     accountId: string;
0.75 packages/alchemy/src/Cloudflare/Workers/Subdomain.ts:28
     accountId: string;
0.75 packages/alchemy/src/Cloudflare/Zone/CustomNameservers.ts:21
     zoneId: string;
0.75 packages/alchemy/src/Cloudflare/Zone/Hold.ts:22
     zoneId: string;
0.75 packages/alchemy/src/Docker/Docker.ts:392
     NodeID: string;
0.75 packages/alchemy/src/Fly/leases.ts:22
     const TTL_SECONDS = 120;
0.75 packages/alchemy/src/GitHub/Environment.ts:101
     htmlUrl: string;
0.75 packages/alchemy/src/GitHub/Milestone.ts:401
     node_id: string;
0.75 packages/alchemy/src/GitHub/Release.ts:83
     releaseId: number;
0.75 packages/alchemy/src/Hetzner/Image.ts:221
     serverId: number;
0.75 packages/alchemy/src/Hetzner/PrimaryIp.ts:281
     outputId?: number;
0.75 packages/alchemy/src/Hetzner/Website/Foldkit.ts:37
     export const Foldkit = (id: string, props: FoldkitProps = {}) =>
0.75 packages/alchemy/src/Hetzner/Website/StaticSite.ts:224
     PORT: "0",
0.75 packages/alchemy/src/Planetscale/Postgres/PostgresDefaultRole.ts:343
     type DatabaseRef = string | { name: string; organization?: string };
0.75 packages/alchemy/src/Railway/LoginSession.ts:9
     export const RAILWAY_CLI_LOGIN_HOST = "https://railway.com";
0.75 packages/alchemy/src/Railway/hosted.ts:401
     const g=globalThis,port=Number(process.env.PORT??3000);
0.75 packages/alchemy/src/Stripe/Coupon.ts:124
     currency: string | undefined;
0.75 packages/alchemy/src/Stripe/IssuingCardholder.ts:266
     id: string;
0.75 packages/alchemy/src/Stripe/TaxRate.ts:107
     id: string;
0.75 packages/alchemy/test/AWS/AppRunner/fixtures/isolated-project-service.ts:29
     port: 3000,
0.75 packages/alchemy/test/AWS/AuditManager/handler.ts:279
     );
0.75 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-schema.ts:5
     id: integer("id").primaryKey({ autoIncrement: true }),
0.75 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:31
     port: 3000,
0.75 packages/alchemy/test/Prisma/fixtures/read-compute.ts:18
     port: 8080,
0.75 packages/cloudflare-runtime/src/core/bindings/workflows/wrapped-binding.worker.ts:95
     public id: string,
0.75 packages/cloudflare-runtime/src/core/remote-bindings/RemoteWorkerConfig.shared.ts:9
     readonly url: string;
0.75 packages/cloudflare-runtime/src/core/workerd/Workerd.ts:503
     configuredAddresses,
0.75 packages/cloudflare-runtime/src/internal/workflows-shared/lib/timePriorityQueue.ts:22
     id: number;
0.74 packages/alchemy/src/AWS/AMP/AnomalyDetector.ts:161
     workspaceId: string,
0.74 packages/alchemy/src/AWS/ApiGateway/GatewayResource.ts:41
     resourceId: string;
0.74 packages/alchemy/src/AWS/ApiGateway/Method.ts:321
     resourceId: string;
0.74 packages/alchemy/src/AWS/ApiGatewayV2/ApiMapping.ts:16
     apiId: string;
0.74 packages/alchemy/src/AWS/AppRegistry/ResourceAssociation.ts:63
     never,
0.74 packages/alchemy/src/AWS/CloudFront/KeyValueStore.ts:29
     keyValueStoreId: string;
0.74 packages/alchemy/src/AWS/CloudMap/internal.ts:107
     .deregisterInstance({ ServiceId: serviceId, InstanceId: instance.Id })
0.74 packages/alchemy/src/AWS/DAX/Cluster.ts:120
     discoveryEndpointPort: number | undefined;
0.74 packages/alchemy/src/AWS/DataZone/internal.ts:31
     resourceArn: string,
0.74 packages/alchemy/src/AWS/Deadline/FarmEventSource.ts:18
     farmId?: string;
0.74 packages/alchemy/src/AWS/DocDB/DBInstance.ts:21
     dbClusterIdentifier: string;
0.74 packages/alchemy/src/AWS/ECR/ImageSource.ts:142
     main?: string;
0.74 packages/alchemy/src/AWS/ElastiCache/Connect.ts:16
     port: number;
0.74 packages/alchemy/src/AWS/FIS/TargetAccountConfiguration.ts:20
     accountId: string;
0.74 packages/alchemy/src/AWS/Grafana/Workspace.ts:81
     never,
0.74 packages/alchemy/src/AWS/IAM/AccountAlias.ts:12
     accountAlias: string;
0.74 packages/alchemy/src/AWS/IAM/SigningCertificate.ts:40
     never,
0.74 packages/alchemy/src/AWS/IdentityCenter/Group.ts:51
     never,
0.74 packages/alchemy/src/AWS/IoT/internal.ts:39
     id: string,
0.74 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationCloudWatchLoggingOption.ts:40
     never,
0.74 packages/alchemy/src/AWS/MailManager/Archive.ts:61
     never,
0.74 packages/alchemy/src/AWS/MedicalImaging/ImagingEventSource.ts:19
     datastoreId?: string;
0.74 packages/alchemy/src/AWS/Notifications/ChannelAssociation.ts:16
     notificationConfigurationArn: string;
0.74 packages/alchemy/src/AWS/OpenSearchServerless/internal.ts:14
     readonly id: string;
0.74 packages/alchemy/src/AWS/QuickSight/BindingHttp.ts:23
     export const accountIdFromArn = (arn: string): string => arn.split(":")[4]!;
0.74 packages/alchemy/src/AWS/RDS/DBCluster.ts:781
     setIf("Port", news.port, observed.Port);
0.74 packages/alchemy/src/AWS/Route53/HostedZone.ts:60
     id: string;
0.74 packages/alchemy/src/AWS/Route53/VpcAssociationAuthorization.ts:13
     hostedZoneId: string;
0.74 packages/alchemy/src/AWS/SES/ConfigurationSetEventDestination.ts:61
     topicArn: string;
0.74 packages/alchemy/src/AWS/SageMaker/ClusterSchedulerConfig.ts:202
     const waitForConfig = (configId: string, target: "Ready" | "Gone") =>
0.74 packages/alchemy/src/AWS/VpcLattice/AccessLogSubscription.ts:242
     resourceId: string;
0.74 packages/alchemy/src/AWS/VpcLattice/AuthPolicy.ts:18
     resourceIdentifier: string;
0.74 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkServiceAssociation.ts:71
     never,
0.74 packages/alchemy/src/Cloudflare/ApiShield/UserSchema.ts:180
     const zoneId = news.zoneId as string;
0.74 packages/alchemy/src/Cloudflare/GoogleTagGateway/GoogleTagGateway.ts:88
     never,
0.74 packages/alchemy/src/Cloudflare/Hyperdrive/Connect.ts:72
     port: Effect.Effect<number, never, RuntimeContext>;
0.74 packages/alchemy/src/Cloudflare/Intel/IndicatorFeed.ts:361
     const getFeed = (accountId: string, feedId: number) =>
0.74 packages/alchemy/src/Cloudflare/KV/NamespaceHttp.ts:61
     accountId: string;
0.74 packages/alchemy/src/Cloudflare/PageShield/Policy.ts:281
     zoneId: string,
0.74 packages/alchemy/src/Cloudflare/R2/BucketHttp.ts:68
     accountId: string;
0.74 packages/alchemy/src/Cloudflare/Registrar/Domain.ts:362
     accountId: string,
0.74 packages/alchemy/src/Cloudflare/Ssl/UniversalSsl.ts:22
     zoneId: string;
0.74 packages/alchemy/src/Cloudflare/Workers/LocalWorkerProvider.ts:861
     bindings: worker.workerBindings as never,
0.74 packages/alchemy/src/Git/Jobs/Purge.ts:51
     readonly repoId: string;
0.74 packages/alchemy/src/Git/Store/HeadSnapshot.ts:26
     readonly repoId: string;
0.74 packages/alchemy/src/Hetzner/RecordSet.ts:161
     never,
0.74 packages/alchemy/src/Http.ts:137
     : Config.Number("PORT").pipe(Config.withDefault(3000));
0.74 packages/alchemy/src/Kubernetes/internal/workload.ts:221
     id: string;
0.74 packages/alchemy/src/Local/RpcProviderProxy.ts:30
     providersUrl: string,
0.74 packages/alchemy/src/Neon/Website/Foldkit.ts:30
     export const Foldkit = (id: string, props: FoldkitProps = {}) =>
0.74 packages/alchemy/src/Neon/Website/FrameworkSite.ts:53
     url: string | Output.Output<string | undefined> | undefined;
0.74 packages/alchemy/src/Prisma/ComputeBuild.ts:1812
     (process.platform === "win32" || (stat.mode & 0o111) !== 0)
0.74 packages/alchemy/src/Prisma/Database.ts:101
     databaseIdleTimeoutMillis?: number;
0.74 packages/alchemy/src/Prisma/Internal/ArtifactUpload.ts:15
     uploadUrl: string,
0.74 packages/alchemy/src/Prisma/Internal/LogsClient.ts:123
     deploymentId: string,
0.74 packages/alchemy/src/Prisma/Operations.ts:56
     export const getProject = (id: string) =>
0.74 packages/alchemy/src/Railway/SandboxCheckpoint.ts:135
     id: string,
0.74 packages/alchemy/src/Railway/Website/Foldkit.ts:41
     export const Foldkit = (id: string, props: FoldkitProps = {}) =>
0.74 packages/alchemy/src/Resource.ts:123
     LogicalId: LogicalId;
0.74 packages/alchemy/src/RuntimeContext.ts:12
     id: string;
0.74 packages/alchemy/src/State/State.ts:53
     readonly id: string;
0.74 packages/alchemy/src/Stripe/AccountExternalAccount.ts:221
     account,
0.74 packages/alchemy/src/Stripe/PaymentMethodConfiguration.ts:301
     never,
0.74 packages/alchemy/src/Stripe/TerminalLocation.ts:361
     id: location.id,
0.74 packages/alchemy/test/AWS/AppRunner/fixtures/service.ts:26
     port: 3000,
0.74 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:193
     const eventId = url.searchParams.get("id")!;
0.74 packages/alchemy/test/AWS/Lambda/init-io-probe.ts:15
     { trace: string; nonce: string }
0.74 packages/alchemy/test/AWS/Local/fixtures/raw.ts:14
     export const FLOCI_ENDPOINT = "http://localhost:4566";
0.74 packages/alchemy/test/AWS/QBusiness/handler.ts:501
     subscriptionId: "nonexistent",
0.74 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:15
     const NONEXISTENT_SUBJECT_ID = "00000000-0000-0000-0000-000000000000";
0.74 packages/alchemy/test/Cloudflare/Container/fixtures/inferred/worker.ts:11
     defaultPort = 8080;
0.74 packages/alchemy/test/Cloudflare/Website/vite-container-fixture/src/worker.ts:11
     defaultPort = 8080;
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/vite-url-fixture/src/worker.ts:8
     VITE_PUBLIC_URL: string;
0.74 packages/alchemy/test/Fly/fixtures/sprite.ts:15
     port: 3000,
0.74 packages/alchemy/test/Prisma/fixtures/readwrite-compute.ts:22
     port: 8080,
0.74 packages/alchemy/test/Prisma/fixtures/write-compute.ts:18
     port: 8080,
0.74 packages/cloudflare-runtime/src/core/bindings/secrets-store/SecretsStoreOptions.shared.ts:10
     readonly storeId: string;
0.74 packages/cloudflare-runtime/src/internal/workflows-shared/binding.ts:245
     instanceId: id,
0.74 packages/frontend-frameworks/src/core/DeployTarget.ts:181
     readonly platform: string;
0.74 packages/frontend-frameworks/src/core/Framework.ts:31
     readonly port?: number | undefined;
0.74 packages/frontend-frameworks/src/vocs/Vocs.ts:105
     const VIRTUAL_USER_CONFIG = "virtual:alchemy-vocs/user-config";
0.74 packages/pkg/src/cli/publish.ts:19
     readonly registry: string;
0.73 packages/alchemy/src/AWS/AMP/Workspace.ts:221
     workspaceId: string,
0.73 packages/alchemy/src/AWS/ApiGatewayV2/Authorizer.ts:181
     apiId: string,
0.73 packages/alchemy/src/AWS/ApiGatewayV2/Stage.ts:101
     never,
0.73 packages/alchemy/src/AWS/AppRegistry/AttributeGroupAssociation.ts:36
     never,
0.73 packages/alchemy/src/AWS/AppRunner/Service.ts:61
     imageIdentifier: string;
0.73 packages/alchemy/src/AWS/AppRunner/VpcConnector.ts:181
     vpcConnectorRevision: connector.VpcConnectorRevision,
0.73 packages/alchemy/src/AWS/AppSync/GraphqlApi.ts:501
     apiId: string,
0.73 packages/alchemy/src/AWS/Athena/QueryStateChangeEventSource.ts:29
     queryExecutionId: string;
0.73 packages/alchemy/src/AWS/AutoScaling/LaunchTemplate.ts:86
     port?: number;
0.73 packages/alchemy/src/AWS/CloudFront/KeyGroup.ts:36
     keyGroupId: string;
0.73 packages/alchemy/src/AWS/CloudFront/OriginRequestPolicy.ts:41
     originRequestPolicyId: string;
0.73 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:70
     clusterId: string;
0.73 packages/alchemy/src/AWS/Config/AggregationAuthorization.ts:22
     authorizedAccountId: string;
0.73 packages/alchemy/src/AWS/DSQL/Stream.ts:61
     streamId: string;
0.73 packages/alchemy/src/AWS/EC2/KeyPair.ts:63
     keyName: string;
0.73 packages/alchemy/src/AWS/EC2/Route.ts:141
     instanceId?: string;
0.73 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:161
     securityGroupRuleId: string;
0.73 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:283
     never,
0.73 packages/alchemy/src/AWS/HealthLake/FHIRDatastore.ts:301
     datastoreArn: properties.DatastoreArn,
0.73 packages/alchemy/src/AWS/IoTWireless/WirelessGateway.ts:78
     *     GatewayEui: "aa555a0000000001",
0.73 packages/alchemy/src/AWS/Kendra/DataSource.ts:61
     roleArn?: string;
0.73 packages/alchemy/src/AWS/LexV2/BotVersion.ts:17
     botId: string;
0.73 packages/alchemy/src/AWS/LexV2/internal.ts:9
     readonly resourceId: string;
0.73 packages/alchemy/src/AWS/MediaLive/Input.ts:111
     never,
0.73 packages/alchemy/src/AWS/Omics/RunStatusEventSource.ts:17
     id?: string;
0.73 packages/alchemy/src/AWS/Organizations/OrganizationResourcePolicy.ts:23
     resourcePolicyId: string;
0.73 packages/alchemy/src/AWS/S3Tables/TableBucket.ts:211
     ownerAccountId: bucket.ownerAccountId,
0.73 packages/alchemy/src/AWS/SecurityHub/ActionTarget.ts:39
     id: string;
0.73 packages/alchemy/src/AWS/Shield/Protection.ts:167
     protectionId: protection.Id!,
0.73 packages/alchemy/src/AWS/Shield/ProtectionGroup.ts:174
     const toGroupId = (id: string, props: { protectionGroupId?: string }) =>
0.73 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkVpcAssociation.ts:67
     never,
0.73 packages/alchemy/src/Cloudflare/AI/CustomTopics.ts:34
     zoneId: string;
0.73 packages/alchemy/src/Cloudflare/AI/LanguageModel.ts:144
     readonly id: string;
0.73 packages/alchemy/src/Cloudflare/ApiToken/UserApiToken.ts:24
     tokenId: string;
0.73 packages/alchemy/src/Cloudflare/DNS/ZoneTransferAcl.ts:41
     aclId: string;
0.73 packages/alchemy/src/Cloudflare/PageShield/Settings.ts:21
     zoneId: string;
0.73 packages/alchemy/src/Cloudflare/R2/BucketEventNotification.ts:103
     accountId: string;
0.73 packages/alchemy/src/Cloudflare/Tunnel/VirtualNetwork.ts:63
     never,
0.73 packages/alchemy/src/Docker/Container.ts:121
     id: string;
0.73 packages/alchemy/src/Fly/BucketBinding.ts:29
     bucketName: string;
0.73 packages/alchemy/src/Git/Protocol/PackParser.ts:222
     readonly count: number;
0.73 packages/alchemy/src/Git/Store/Keys.ts:28
     export const objectKey = (repoId: string, oid: string): string =>
0.73 packages/alchemy/src/Infisical/SecretsProvider.ts:30
     project: string;
0.73 packages/alchemy/src/Neon/Website/Nextjs.ts:42
     export const Nextjs = (id: string, props: NextjsProps = {}) =>
0.73 packages/alchemy/src/Planetscale/MySQL/MySQLMigrations.ts:123
     id: string;
0.73 packages/alchemy/src/Prisma/CustomDomain.ts:31
     type AppReference = string | App | Compute;
0.73 packages/alchemy/src/Stripe/CustomerTaxId.ts:70
     never,
0.73 packages/alchemy/src/Stripe/FileLink.ts:181
     id: string,
0.73 packages/alchemy/src/Stripe/PromotionCode.ts:137
     never,
0.73 packages/alchemy/src/Stripe/RetrieveProductHttp.ts:15
     type ProductInput = string | Product;
0.73 packages/alchemy/test/AWS/Chatbot/handler.ts:13
     const NONEXISTENT_SLACK_TEAM = "T0000000000";
0.73 packages/alchemy/test/AWS/EC2/fixtures/dev-instance.ts:56
     port: 3000,
0.73 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:54
     const id = url.searchParams.get("id")!;
0.73 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:16
     export const CONTACT_EMAIL = "sam+alchemy-test-contact-bindings@alchemy.run";
0.73 packages/alchemy/test/AWS/RePostSpace/bindings-handler.ts:13
     const BOGUS_ACCESSOR_ID = "00000000-0000-0000-0000-000000000000";
0.73 packages/alchemy/test/AWS/Redshift/fixtures/bindings-handler.ts:14
     const NONEXISTENT_CLUSTER_ID = "alchemy-nonexistent-redshift-probe";
0.73 packages/alchemy/test/Cloudflare/Browser/fixtures/async-worker.ts:4
     const TARGET_URL = "https://example.com";
0.73 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:48
     userId: number;
0.73 packages/alchemy/test/Railway/fixtures/redis-shared.ts:11
     export const REDIS_KEY = "alchemy-marker";
0.73 packages/cloudflare-runtime/src/core/bindings/VersionMetadata.ts:8
     id: crypto.randomUUID(),
0.73 packages/cloudflare-runtime/src/core/internal/Port.ts:101
     readonly find: (port: number) => Effect.Effect<number>;
0.73 packages/cloudflare-runtime/src/core/platform-proxy/connect.ts:581
     tlsCipher: "AEAD-AES128-GCM-SHA256",
0.73 packages/cloudflare-runtime/src/internal/workers-shared/shared/sentry.ts:14
     accountId?: number,
0.73 packages/cloudflare-runtime/src/internal/workers-shared/shared/tracing.ts:20
     traceId: "test-trace",
0.73 packages/frontend-frameworks/fixtures/sveltekit/src/routes/cookies/+page.server.ts:4
     const visits = Number(cookies.get("visits") ?? "0") + 1;
0.72 packages/alchemy/src/AWS/Amplify/AppEventSource.ts:18
     appId: string;
0.72 packages/alchemy/src/AWS/Amplify/Branch.ts:222
     appId: output.appId,
0.72 packages/alchemy/src/AWS/AppRegistry/internal.ts:5
     export const clientToken = (instanceId: string): string =>
0.72 packages/alchemy/src/AWS/Athena/NamedQuery.ts:43
     namedQueryId: string;
0.72 packages/alchemy/src/AWS/CloudFront/RealtimeLogConfig.ts:151
     streamArn: endpoint.KinesisStreamConfig.StreamARN,
0.72 packages/alchemy/src/AWS/CloudHSMV2/Hsm.ts:65
     never,
0.72 packages/alchemy/src/AWS/CloudWatch/Alarm.ts:19
     export type AlarmName = string;
0.72 packages/alchemy/src/AWS/CodeConnections/SyncConfiguration.ts:83
     never,
0.72 packages/alchemy/src/AWS/Cognito/ResourceServer.ts:52
     never,
0.72 packages/alchemy/src/AWS/Config/RetentionConfiguration.ts:25
     retentionConfigurationName: string;
0.72 packages/alchemy/src/AWS/DSQL/Cluster.ts:52
     never,
0.72 packages/alchemy/src/AWS/DSQL/ClusterPolicy.ts:15
     clusterId: string;
0.72 packages/alchemy/src/AWS/DSQL/ConnectHttp.ts:13
     const DSQL_PORT = 5432;
0.72 packages/alchemy/src/AWS/DataBrew/internal.ts:12
     accountId: string,
0.72 packages/alchemy/src/AWS/DataExchange/EventAction.ts:235
     const dataSetId = news.dataSetId as string;
0.72 packages/alchemy/src/AWS/EC2/ClientVpnAuthorizationRule.ts:42
     targetNetworkCidr: string;
0.72 packages/alchemy/src/AWS/EC2/ClientVpnRoute.ts:52
     never,
0.72 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:214
     networkAclAssociationId: a.NetworkAclAssociationId!,
0.72 packages/alchemy/src/AWS/EC2/RouteTable.ts:81
     subnetId?: string;
0.72 packages/alchemy/src/AWS/ECS/CapacityProvider.ts:67
     autoScalingGroupArn: string;
0.72 packages/alchemy/src/AWS/EKS/KubernetesAdapter.ts:81
     roleArn: string;
0.72 packages/alchemy/src/AWS/EMRServerless/internal.ts:13
     readonly applicationId: string;
0.72 packages/alchemy/src/AWS/GuardDuty/Detector.ts:50
     detectorId: string;
0.72 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationSnapshot.ts:247
     const applicationName = news.applicationName;
0.72 packages/alchemy/src/AWS/Lambda/EventSourceMapping.ts:168
     uuid: string;
0.72 packages/alchemy/src/AWS/Lambda/NetworkConnector.ts:74
     networkConnectorId: string;
0.72 packages/alchemy/src/AWS/LexV2/Bot.ts:81
     > {}
0.72 packages/alchemy/src/AWS/Omics/RunGroup.ts:54
     runGroupId: string;
0.72 packages/alchemy/src/AWS/Organizations/TrustedServiceAccess.ts:13
     servicePrincipal: string;
0.72 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:144
     const resolvedPort = options.port ?? port ?? 5432;
0.72 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:65
     endpointType: string | undefined;
0.72 packages/alchemy/src/AWS/RDS/DBProxy.ts:97
     vpcId: string | undefined;
0.72 packages/alchemy/src/AWS/RolesAnywhere/Crl.ts:71
     never,
0.72 packages/alchemy/src/AWS/Route53Profiles/ProfileAssociation.ts:35
     profileAssociationId: string;
0.72 packages/alchemy/src/AWS/SageMaker/ComputeQuota.ts:115
     never,
0.72 packages/alchemy/src/AWS/Schemas/Discoverer.ts:59
     never,
0.72 packages/alchemy/src/AWS/SecurityLake/DataLake.ts:81
     region: string;
0.72 packages/alchemy/src/AWS/ServiceCatalog/PortfolioProductAssociation.ts:15
     portfolioId: string;
0.72 packages/alchemy/src/AWS/Timestream/Database.ts:21
     `arn:aws:timestream:${RegionID}:${AccountID}:database/${string}`;
0.72 packages/alchemy/src/Cloudflare/AI/Model.ts:16
     accountId: string;
0.72 packages/alchemy/src/Cloudflare/Access/McpPortal.ts:74
     never,
0.72 packages/alchemy/src/Cloudflare/CloudConnector/Rules.ts:101
     Providers
0.72 packages/alchemy/src/Cloudflare/DNS/Dnssec.ts:141
     Providers
0.72 packages/alchemy/src/Cloudflare/Email/SendEmail.ts:14
     destinationAddress?: string;
0.72 packages/alchemy/src/Cloudflare/RegionalHostname/RegionalHostname.ts:21
     zoneId: string;
0.72 packages/alchemy/src/Cloudflare/Workers/Assets.ts:461
     accountId: string,
0.72 packages/alchemy/src/Docker/Image.ts:81
     never,
0.72 packages/alchemy/src/Docker/Network.ts:46
     id: string;
0.72 packages/alchemy/src/Fly/Environment.ts:23
     readonly orgSlug: string;
0.72 packages/alchemy/src/Git/Jobs/Compact.ts:301
     readonly pendingDelete: ReadonlyArray<string>;
0.72 packages/alchemy/src/Git/Store/ObjectStore.ts:241
     pushId: string,
0.72 packages/alchemy/src/Neon/AuthOAuthProvider.ts:47
     never,
0.72 packages/alchemy/src/Prisma/BucketAccessKey.ts:83
     endpoint: string;
0.72 packages/alchemy/src/Railway/BucketBinding.ts:34
     bucketName: string;
0.72 packages/alchemy/src/State/HttpStateApi.ts:186
     export const STATE_STORE_VERSION = 5 as const;
0.72 packages/alchemy/src/Stripe/ProductFeature.ts:42
     id: string;
0.72 packages/alchemy/test/AWS/MediaConvert/handler.ts:83
     const body = (yield* request.json) as unknown as { id: string };
0.72 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:15
     Key: Schema.String,
0.72 packages/alchemy/test/AWS/VpcLattice/handler.ts:58
     const body = (yield* request.json) as unknown as { id: string };
0.72 packages/alchemy/test/Cloudflare/AI/fixtures/ChatPersistenceWorker.ts:21
     const id = url.searchParams.get("id") ?? "default";
0.72 packages/alchemy/test/Cloudflare/Email/fixtures/local-email-worker.ts:40
     from: "sender@example.com",
0.72 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:441
     newId: string,
0.72 packages/alchemy/test/Fly/fixtures/isolated-project-sprite.ts:25
     port: 3000,
0.72 packages/alchemy/test/types/Sandbox.ts:31
     getUser: () => Effect.succeed({ id: "123", name: "John Doe" } as const),
0.72 packages/cloudflare-runtime/src/internal/workers-shared/shared/configuration/constants.ts:3
     export const REDIRECTS_VERSION = 1;
0.72 packages/frontend-frameworks/src/nuxt/dev/shared.ts:31
     readonly url: string;
0.71 packages/alchemy/src/AWS/ACM/AccountConfiguration.ts:36
     never,
0.71 packages/alchemy/src/AWS/ACM/Certificate.ts:790
     const normalizeHostedZoneId = (hostedZoneId: string) =>
0.71 packages/alchemy/src/AWS/AccessAnalyzer/FindingsEventSource.ts:20
     id: string;
0.71 packages/alchemy/src/AWS/ApiGateway/BasePathMapping.ts:39
     never,
0.71 packages/alchemy/src/AWS/AppIntegrations/EventIntegrationEventSource.ts:99
     id: string,
0.71 packages/alchemy/src/AWS/AppRunner/ServiceEventSource.ts:16
     serviceId: string;
0.71 packages/alchemy/src/AWS/Chatbot/MicrosoftTeamsChannelConfiguration.ts:111
     never,
0.71 packages/alchemy/src/AWS/CloudFront/OriginAccessControl.ts:268
     Id: observed.OriginAccessControl.Id,
0.71 packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts:19
     export type CompositeAlarmName = string;
0.71 packages/alchemy/src/AWS/ControlTower/EnabledControl.ts:121
     readonly targetIdentifier: string;
0.71 packages/alchemy/src/AWS/DataExchange/Revision.ts:18
     dataSetId: string;
0.71 packages/alchemy/src/AWS/Deadline/Farm.ts:141
     costScaleFactor: described.costScaleFactor,
0.71 packages/alchemy/src/AWS/EC2/Snapshot.ts:225
     const { accountId, region } = yield* AWSEnvironment.current;
0.71 packages/alchemy/src/AWS/FraudDetector/Detector.ts:45
     never,
0.71 packages/alchemy/src/AWS/IAM/GroupMembership.ts:30
     never,
0.71 packages/alchemy/src/AWS/IoTSiteWise/Asset.ts:101
     id: string,
0.71 packages/alchemy/src/AWS/IoTSiteWise/Gateway.ts:50
     gatewayId: string;
0.71 packages/alchemy/src/AWS/Location/TrackerConsumer.ts:14
     trackerName: string;
0.71 packages/alchemy/src/AWS/MWAA/Environment.ts:221
     never,
0.71 packages/alchemy/src/AWS/MailManager/AddressList.ts:47
     never,
0.71 packages/alchemy/src/AWS/MailManager/TrafficPolicy.ts:61
     never,
0.71 packages/alchemy/src/AWS/MediaConvert/Job.ts:55
     jobId: string;
0.71 packages/alchemy/src/AWS/MemoryDB/Connect.ts:20
     port: number;
0.71 packages/alchemy/src/AWS/NetworkFirewall/Firewall.ts:317
     FirewallPolicyArn: news.firewallPolicyArn,
0.71 packages/alchemy/src/AWS/OAM/internal.ts:60
     export const deleteSinkAndWait = Effect.fn(function* (sinkArn: string) {
0.71 packages/alchemy/src/AWS/Omics/internal.ts:13
     export const fetchOmicsTags = Effect.fn(function* (resourceArn: string) {
0.71 packages/alchemy/src/AWS/QApps/QApp.ts:231
     instanceId: string,
0.71 packages/alchemy/src/AWS/QuickSight/internal.ts:14
     readonly resourceId: string;
0.71 packages/alchemy/src/AWS/RolesAnywhere/TrustAnchor.ts:234
     id: string,
0.71 packages/alchemy/src/AWS/Route53/Records.ts:74
     hostedZoneId: string | undefined;
0.71 packages/alchemy/src/AWS/S3Control/MultiRegionAccessPoint.ts:81
     never,
0.71 packages/alchemy/src/AWS/SES/ActiveReceiptRuleSet.ts:13
     ruleSetName: string;
0.71 packages/alchemy/src/AWS/SSMContacts/ContactChannel.ts:19
     contactId: string;
0.71 packages/alchemy/src/AWS/Schemas/internal.ts:29
     id: string,
0.71 packages/alchemy/src/AWS/Translate/ParallelData.ts:93
     never,
0.71 packages/alchemy/src/AWS/VpcLattice/Rule.ts:114
     *   serviceIdentifier: service.serviceId,
0.71 packages/alchemy/src/Cli/commands/logs.ts:54
     readonly limit: number;
0.71 packages/alchemy/src/Cloudflare/Auth/AuthProvider.ts:102
     ReadonlyArray<{ id: string; name: string }>,
0.71 packages/alchemy/src/Cloudflare/DNS/AccountSettings.ts:321
     accountId,
0.71 packages/alchemy/src/Cloudflare/Devices/PostureRule.ts:84
     postureRuleId: string;
0.71 packages/alchemy/src/Cloudflare/Email/CatchAll.ts:348
     hostname: typeof zone === "string" ? zone : (zone.name ?? ""),
0.71 packages/alchemy/src/Cloudflare/Workers/AccountSetting.ts:38
     accountId: string;
0.71 packages/alchemy/src/Docker/Registry.ts:5
     server: string;
0.71 packages/alchemy/src/Fly/Certificate.ts:83
     appName: string;
0.71 packages/alchemy/src/Git/Hasher/LambdaEvent.ts:29
     readonly alchemyGitHash: 1;
0.71 packages/alchemy/src/Git/RegistryD1.ts:161
     repoId,
0.71 packages/alchemy/src/GitHub/Repository.ts:161
     repoId: number;
0.71 packages/alchemy/src/Prisma/Client.ts:321
     id: string,
0.71 packages/alchemy/src/Prisma/Connect.ts:188
     string,
0.71 packages/alchemy/src/Prisma/Website/Foldkit.ts:30
     export const Foldkit = (id: string, props: FoldkitProps = {}) =>
0.71 packages/alchemy/src/Redis/Client.ts:221
     key: string,
0.71 packages/alchemy/src/Report.ts:221
     readonly resource: string;
0.71 packages/alchemy/src/Website/Server.ts:462
     readonly port: number;
0.71 packages/alchemy/test/AWS/ControlTower/handler.ts:295
     { error: "Not found", method: request.method, pathname },
0.71 packages/alchemy/test/AWS/DSQL/fixtures/schema.ts:6
     id: integer("id").primaryKey(),
0.71 packages/alchemy/test/AWS/GreengrassV2/handler.ts:248
     const req = { coreDeviceThingName: MISSING_CORE };
0.71 packages/alchemy/test/AWS/Lambda/external-package-handler.ts:9
     id: uuid(),
0.71 packages/alchemy/test/AWS/Omics/bindings-handler.ts:12
     const BOGUS_ID = "0000000000";
0.71 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/phone-handler.ts:17
     export const SIMULATOR_DESTINATION = "+14254147755";
0.71 packages/alchemy/test/AWS/QApps/bindings-handler.ts:27
     const TEXT_CARD_ID = "11111111-1111-4111-8111-111111111111";
0.71 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:381
     };
0.71 packages/alchemy/test/Cloudflare/Container/fixtures/async/worker.ts:13
     defaultPort = 8080;
0.71 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:22
     const conn = yield* container.getTcpPort(3000);
0.71 packages/alchemy/test/Cloudflare/Container/fixtures/identity/applications.ts:4
     export const applications = (maxInstances = 2, name?: string) =>
0.71 packages/alchemy/test/Cloudflare/Website/vite-cron-fixture/worker.ts:5
     let scheduledCount = 0;
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:41
     const getTaskDO = (id: string = "default") =>
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/url-stack.ts:34
     effectUrl: effectWorker.url.as<string>(),
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-async/worker.ts:33
     async record(id: string, body: unknown) {
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/workflow-limits/limits-workflow.ts:5
     export const STEP_LIMIT = 250;
0.71 packages/alchemy/test/Prisma/fakes.ts:12
     ensureProfile: () => Effect.succeed({ id: "fake", providers: {} }),
0.71 packages/alchemy/test/Prisma/fixtures/FakeManagementApi.ts:292
     port: 5432,
0.71 packages/cloudflare-runtime/src/core/bindings/hyperdrive/hyperdrive-binding.worker.ts:19
     port: env.ORIGIN.port,
0.71 packages/frontend-frameworks/src/nextjs/DevServer.ts:63
     readonly port?: number | undefined;
```
