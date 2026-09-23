# data/records-are-schema-classes

Domain records must be defined with Schema.Class, never with a plain interface or type alias.

330 findings, from 0.93 down to 0.71. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.93 packages/alchemy/test/Fly/fixtures/transport.ts:182
     // Response bytes are never altered to accommodate the observer.
0.92 packages/alchemy/src/Prisma/Types.ts:31
     export interface ResourceRef {
0.90 packages/alchemy/src/Planetscale/Postgres/PostgresOrigin.ts:8
     export type PostgresOrigin = {
0.90 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/types.ts:1
     export interface LegacyRow extends Record<string, string | number | null> {
0.89 packages/alchemy-test/src/Model.ts:15
     export interface LogEntry {
0.89 packages/alchemy/src/Axiom/Chart.ts:36
     export interface BaseChart {
0.89 packages/alchemy/src/Cloudflare/AnalyticsEngine/Dataset.ts:42
     export type Dataset = {
0.89 packages/alchemy/src/Git/Store/HeadSnapshot.ts:18
     export interface HeadRef {
0.89 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:9
     export interface VerifiedFile {
0.88 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:19
     export interface GlobalCredentials {
0.88 packages/alchemy/src/Alchemist/routes/drift.ts:8
     export interface DriftedResource {
0.88 packages/alchemy/src/Auth/Inspect.ts:18
     export interface ProviderConnection {
0.88 packages/alchemy/src/Neon/PostgresOrigin.ts:15
     export type PostgresOrigin = {
0.88 packages/alchemy/src/Prisma/Internal/Observed.ts:15
     export interface ObservedEndpoint {
0.88 packages/alchemy/src/Prisma/PrismaLogs.ts:42
     export type PrismaDeploymentLogRecord =
0.88 packages/alchemy/src/Report.ts:217
     export interface NukeResourceDeleted {
0.88 packages/alchemy/src/SQL/SqlFile.ts:6
     export interface SqlFile {
0.87 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:23
     export interface FunctionDockerImageSource extends FunctionImageConfig {
0.87 packages/alchemy/src/Neon/AIGateway.ts:33
     export interface AIGateway {
0.87 packages/alchemy/src/Planetscale/MySQL/MySQLOrigin.ts:8
     export type MySQLOrigin = {
0.86 packages/alchemy/src/AWS/StepFunctions/Asl/Node.ts:19
     export interface InvokableFunction {
0.86 packages/alchemy/src/Alchemist/routes/logs.ts:11
     export interface ResourceIdentity {
0.86 packages/alchemy/src/Git/Protocol/ReceivePack.ts:69
     export interface RefCommand {
0.86 packages/alchemy/src/Railway/ServiceDomain.ts:133
     * the recorded hostname — never every generated domain.
0.86 packages/alchemy/src/SQL/Migrations/Format.ts:9
     export interface MigrationRecord {
0.86 packages/alchemy/src/State/ResourceState.ts:30
     interface BaseResourceState {
0.86 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-callback/object.ts:483
     });
0.86 packages/frontend-frameworks/fixtures/sveltekit-spa/src/lib/widgets.ts:6
     export interface Widget {
0.85 packages/alchemy/src/AWS/EC2/Instance.ts:141
     InstanceProps,
0.85 packages/alchemy/src/AWS/OpenSearch/DomainEventSource.ts:14
     export interface DomainEventDetail {
0.85 packages/alchemy/src/Git/Protocol/Store.ts:35
     export interface ObjectMeta {
0.84 packages/alchemy/src/AWS/CloudTrail/ApiCallEventSource.ts:14
     export interface ApiCallDetail {
0.84 packages/alchemy/src/AWS/EC2/InstanceEventSource.ts:25
     export interface InstanceStateChangeDetail {
0.84 packages/alchemy/src/Fly/Deployment.ts:39
     export interface DeploymentPolicy {
0.84 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:35
     export interface CronEvent {
0.83 packages/alchemy/src/AWS/AppRunner/ServiceEventSource.ts:14
     export interface ServiceStatusChangeDetail {
0.83 packages/alchemy/src/AWS/Connection/internal.ts:9
     export interface SqlConnectionInfo {
0.83 packages/alchemy/src/AWS/ECR/ImageActionEventSource.ts:13
     export interface ImageActionDetail {
0.83 packages/alchemy/src/AWS/InternetMonitor/HealthEventSource.ts:15
     export interface HealthEventDetail {
0.83 packages/alchemy/src/AWS/ResourceGroups/GroupEventSource.ts:16
     export interface GroupEventDetail {
0.83 packages/alchemy/src/Git/Http/ReceivePack.ts:20
     export interface Push {
0.83 packages/alchemy/src/State/ActionState.ts:13
     interface BaseActionState {
0.83 packages/alchemy/src/State/Export.ts:9
     export interface ExportedResource {
0.83 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:1
     export interface Widget {
0.82 packages/alchemy/src/AWS/AMP/PrometheusTypes.ts:32
     export interface PrometheusSample {
0.82 packages/alchemy/src/AWS/AccessAnalyzer/FindingsEventSource.ts:16
     export interface FindingDetail {
0.82 packages/alchemy/src/AWS/AutoScaling/InstanceEventSource.ts:23
     export interface InstanceEventDetail {
0.82 packages/alchemy/src/AWS/FraudDetector/PredictionEventSource.ts:15
     export interface PredictionEventDetail {
0.82 packages/alchemy/src/AWS/LexV2/CodeHookEventSource.ts:9
     export interface CodeHookIntent {
0.82 packages/alchemy/src/AWS/OpenSearch/DataPlaneTypes.ts:27
     export interface SearchHit<TDoc = unknown> {
0.82 packages/alchemy/src/Alchemist/routes/profile.ts:22
     export interface ProviderContext extends Target {
0.82 packages/alchemy/src/Git/Hasher/LambdaEvent.ts:28
     export interface HashEvent {
0.82 packages/alchemy/src/SQL/Migrations/Convert.ts:15
     export interface ConvertedRow {
0.81 packages/alchemy/src/AWS/Logs/LogGroupEventSource.ts:48
     export interface LogEventRecord {
0.81 packages/alchemy/src/AWS/Macie2/FindingEventSource.ts:20
     export interface FindingEventDetail {
0.81 packages/alchemy/src/AWS/MediaConvert/JobEventSource.ts:16
     export interface MediaConvertJobEventDetail {
0.81 packages/alchemy/src/Cloudflare/Workers/Assets.ts:33
     export interface AssetsConfig {
0.81 packages/alchemy/src/Docker/BuildHash.ts:271
     } satisfies DockerBuildContextSelection;
0.81 packages/alchemy/src/Git/Jobs/Bundle.ts:39
     export interface BundleRef {
0.81 packages/alchemy/src/Git/Jobs/Import.ts:42
     export interface ImportSource {
0.81 packages/alchemy/src/Git/Protocol/ObjectCodec.ts:341
     readonly headers: ReadonlyArray<readonly [string, string]>;
0.81 packages/alchemy/src/Neon/BranchScope.ts:19
     export interface ResolvedBranchScope {
0.81 packages/alchemy/src/Neon/FunctionTrigger.ts:41
     export interface FunctionTriggerAttributes {
0.81 packages/alchemy/src/Prisma/BucketTypes.ts:20
     export interface BucketObject {
0.81 packages/alchemy/src/Prisma/PostgresOrigin.ts:15
     export type PostgresOrigin = {
0.80 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalingActivityEventSource.ts:17
     export interface ScalingActivityEventDetail {
0.80 packages/alchemy/src/AWS/CodeDeploy/DeploymentEventSource.ts:14
     export interface DeploymentEventDetail {
0.80 packages/alchemy/src/AWS/CostExplorer/AnomalyEventSource.ts:15
     export interface AnomalyEventDetail {
0.80 packages/alchemy/src/AWS/EC2/ClientVpnRoute.ts:307
     return toAttributes(news.clientVpnEndpointId, active!);
0.80 packages/alchemy/src/AWS/EMRContainers/JobTemplate.ts:42
     export interface JobTemplateJobDriver {
0.80 packages/alchemy/src/AWS/Lambda/EventInvokeConfig.ts:17
     export interface EventInvokeConfig {
0.80 packages/alchemy/src/AWS/MedicalImaging/ImagingEventSource.ts:17
     export interface MedicalImagingEventDetail {
0.80 packages/alchemy/src/AWS/SecurityLake/DataLake.ts:21
     export interface DataLakeEncryptionConfiguration {
0.80 packages/alchemy/src/AWS/StepFunctions/ExecutionEventSource.ts:16
     export interface ExecutionEventDetail {
0.80 packages/alchemy/src/Cloudflare/Workers/DurableObjectTransactionContext.ts:5
     export interface ActiveStorageTransaction {
0.80 packages/alchemy/src/Fly/replicas.ts:82
     export interface Replica {
0.80 packages/alchemy/src/Git/Protocol/PartialScan.ts:41
     export interface ScannedEntry {
0.80 packages/alchemy/src/Git/PushWire.ts:15
     interface RowMeta {
0.80 packages/alchemy/src/Hetzner/Firewall.ts:48
     export interface FirewallRule {
0.80 packages/alchemy/src/Stripe/IssuingCardholder.ts:101
     export interface IssuingCardholderDob {
0.80 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:39
     interface SubscriptionEventTarget {
0.80 packages/cloudflare-runtime/src/internal/workflows-shared/instance.ts:11
     export type Instance = {
0.79 packages/alchemy/src/AWS/Config/ConfigRule.ts:29
     export interface ConfigRuleSourceDetail {
0.79 packages/alchemy/src/AWS/EC2/ClientVpnAuthorizationRule.ts:263
     }
0.79 packages/alchemy/src/AWS/EMR/ClusterEventSource.ts:15
     export interface ClusterEventDetail {
0.79 packages/alchemy/src/AWS/EMRContainers/JobRunEventSource.ts:14
     export interface JobRunEventDetail {
0.79 packages/alchemy/src/AWS/GreengrassV2/GreengrassEventSource.ts:17
     export interface GreengrassEventDetail {
0.79 packages/alchemy/src/AWS/LakeFormation/ResourceSpec.ts:7
     export interface CatalogSpec {
0.79 packages/alchemy/src/AWS/Lambda/MicrovmRpc.ts:11
     export interface MicrovmConnection {
0.79 packages/alchemy/src/AWS/QuickSight/AssetEventSource.ts:17
     export interface QuickSightAssetEventDetail {
0.79 packages/alchemy/src/AWS/Synthetics/CanaryEventSource.ts:25
     export interface CanaryEventDetail {
0.79 packages/alchemy/src/Auth/Demand.ts:82
     readonly resources: readonly DemandingResource[];
0.79 packages/alchemy/src/Auth/OAuthFlow.ts:188
     export const makeOAuthClient = (spec: OAuthClientSpec): OAuthClient => {
0.79 packages/alchemy/src/Auth/Profile.ts:104
     export interface Profile {
0.79 packages/alchemy/src/Docker/Dockerfile.ts:63
     export interface InlineDockerfile {
0.79 packages/alchemy/src/Git/Protocol/UploadPack.ts:361
     UploadPackResponse,
0.79 packages/alchemy/src/Neon/CustomDomain.ts:11
     export interface CustomDomainProps {
0.79 packages/alchemy/src/Stripe/PromotionCode.ts:203
     type PromotionCodeAttributes = PromotionCode["Attributes"];
0.79 packages/alchemy/test/IsolatedProject.ts:38
     export interface IsolatedProject {
0.78 packages/alchemy-test/src/Reporter.ts:13
     export interface TestMeta {
0.78 packages/alchemy/src/AWS/BedrockDataAutomation/JobEventSource.ts:14
     export interface DataAutomationJobEventDetail {
0.78 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:122
     export interface BudgetAction extends Resource<
0.78 packages/alchemy/src/AWS/CodePipeline/Pipeline.ts:141
     never,
0.78 packages/alchemy/src/AWS/DMS/ReplicationEventSource.ts:14
     export interface DmsReplicationEventDetail {
0.78 packages/alchemy/src/AWS/DynamoDB/Expr.ts:11
     export interface NameRef<Name extends string = string> {
0.78 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:121
     export interface ExperimentTemplateLogConfiguration {
0.78 packages/alchemy/src/AWS/MediaPackageV2/HarvestJobEventSource.ts:14
     export interface MediaPackageV2HarvestJobEventDetail {
0.78 packages/alchemy/src/AWS/RDS/RdsEventSource.ts:13
     export interface RdsEventDetail {
0.78 packages/alchemy/src/AWS/SES/EmailEventSource.ts:15
     export interface EmailEventDetail {
0.78 packages/alchemy/src/AWS/SSM/ParameterEventSource.ts:15
     export interface ParameterEventDetail {
0.78 packages/alchemy/src/Alchemist/routes/provider.ts:15
     export interface CheckEnvironmentInput extends Target {
0.78 packages/alchemy/src/Cloudflare/Logs.ts:31
     interface TailEventMessage {
0.78 packages/alchemy/src/Cloudflare/Organization/Organization.ts:119
     }
0.78 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:21
     export interface SuperSlurperSourceSelection {
0.78 packages/alchemy/src/Docker/Registry.ts:3
     export interface ImageRegistry {
0.78 packages/alchemy/src/Neon/OrganizationMemberRole.ts:41
     export interface OrganizationMemberRoleAttributes {
0.78 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:21
     export interface OrganizationVPCEndpointAttributes {
0.78 packages/alchemy/src/Neon/ProjectVPCEndpoint.ts:223
     });
0.78 packages/alchemy/src/Stripe/BillingPortalConfiguration.ts:105
     export interface BillingPortalCancellationReason {
0.77 packages/alchemy/src/AWS/AutoScaling/LifecycleHookEventSource.ts:20
     export interface LifecycleActionDetail {
0.77 packages/alchemy/src/AWS/B2BI/TransformationEventSource.ts:10
     export interface TransformationFileS3Attributes {
0.77 packages/alchemy/src/AWS/Backup/BackupPlan.ts:82
     export interface BackupPlanProps {
0.77 packages/alchemy/src/AWS/CodePipeline/PipelineEventSource.ts:14
     export interface PipelineEventDetail {
0.77 packages/alchemy/src/AWS/Config/ConfigEventSource.ts:16
     export interface ConfigEventDetail {
0.77 packages/alchemy/src/AWS/DLM/LifecyclePolicyEventSource.ts:16
     export interface LifecyclePolicyEventDetail {
0.77 packages/alchemy/src/AWS/Deadline/FarmEventSource.ts:16
     export interface FarmEventDetail {
0.77 packages/alchemy/src/AWS/FraudDetector/DetectorVersion.ts:331
     list: () => Effect.succeed([]),
0.77 packages/alchemy/src/AWS/ObservabilityAdmin/TelemetryRule.ts:71
     selectionCriteria?: string;
0.77 packages/alchemy/src/AWS/Omics/RunStatusEventSource.ts:15
     export interface OmicsRunEventDetail {
0.77 packages/alchemy/src/AWS/Shield/AttackEventSource.ts:21
     export interface AttackEventDetail {
0.77 packages/alchemy/src/AWS/Signer/SigningJobEventSource.ts:14
     export interface SigningJobEventDetail {
0.77 packages/alchemy/src/Cloudflare/AI/ProviderKey.ts:9
     export interface ProviderKeyProps {
0.77 packages/alchemy/src/Cloudflare/Fraud/DetectionSettings.ts:82
     export interface DetectionSettingsAttributes extends DetectionSettingsValues {
0.77 packages/alchemy/src/Git/RegistryObject.ts:81
     readonly owner: string;
0.77 packages/alchemy/src/Git/Store/Sql.ts:241
     export interface RegistryRepoRow extends Record<string, SqlStorageValue> {
0.77 packages/alchemy/src/Hetzner/Network.ts:141
     never,
0.77 packages/alchemy/src/Stripe/CreditGrant.ts:101
     export interface CreditGrantProps {
0.77 packages/alchemy/src/Stripe/ShippingRate.ts:49
     export interface ShippingRateDeliveryEstimateBound {
0.77 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:8
     export interface Worker {
0.77 packages/frontend-frameworks/fixtures/sveltekit-spa/src/routes/widgets/+page.ts:3
     export interface WidgetsPayload {
0.76 packages/alchemy/src/AWS/AMP/RuleGroupsNamespace.ts:17
     export interface RuleGroupsNamespaceProps {
0.76 packages/alchemy/src/AWS/BCMDataExports/Export.ts:141
     > {}
0.76 packages/alchemy/src/AWS/Backup/JobEventSource.ts:16
     export interface BackupEventDetail {
0.76 packages/alchemy/src/AWS/Batch/JobEventSource.ts:15
     export interface BatchJobEventDetail {
0.76 packages/alchemy/src/AWS/CodeBuild/BuildEventSource.ts:15
     export interface BuildEventDetail {
0.76 packages/alchemy/src/AWS/CostExplorer/CostCategory.ts:201
     };
0.76 packages/alchemy/src/AWS/DataBrew/JobEventSource.ts:14
     export interface JobEventDetail {
0.76 packages/alchemy/src/AWS/EC2/defaultVpcScope.ts:15
     export interface DefaultVpcScope {
0.76 packages/alchemy/src/AWS/FIS/ExperimentEventSource.ts:14
     export interface ExperimentEventDetail {
0.76 packages/alchemy/src/AWS/GuardDuty/FindingEventSource.ts:14
     export interface FindingEventDetail {
0.76 packages/alchemy/src/AWS/Inspector2/FindingEventSource.ts:14
     export interface FindingEventDetail {
0.76 packages/alchemy/src/AWS/IoTWireless/DestinationEventSource.ts:11
     export interface WirelessUplinkMessage {
0.76 packages/alchemy/src/AWS/KMS/KeyEventSource.ts:14
     export interface KeyEventDetail {
0.76 packages/alchemy/src/AWS/MQ/Broker.ts:45
     export interface BrokerConfigurationRef {
0.76 packages/alchemy/src/AWS/MWAAServerless/WorkflowRunEventSource.ts:15
     export interface WorkflowRunEventDetail {
0.76 packages/alchemy/src/AWS/MediaConnect/FlowEventSource.ts:15
     export interface MediaConnectFlowEventDetail {
0.76 packages/alchemy/src/AWS/Neptune/DBCluster.ts:261
     export const DBCluster = Resource<DBCluster>("AWS.Neptune.DBCluster");
0.76 packages/alchemy/src/AWS/Signer/SigningProfile.ts:373
     delete: Effect.fn(function* ({ output }) {
0.76 packages/alchemy/src/Neon/AuthTrustedDomain.ts:10
     export interface AuthTrustedDomainProps {
0.76 packages/alchemy/src/Neon/Object.ts:82
     export interface Object<T = never> extends Resource<
0.76 packages/alchemy/src/Nuke.ts:22
     export interface ProviderFailure {
0.76 packages/alchemy/src/State/Tree.ts:57
     filter: { readonly stack?: string; readonly stage?: string } = {},
0.76 packages/alchemy/test/Cli/PlanTestNodes.ts:21
     const resource = (id: string, props: object): ResourceLike => ({
0.76 packages/alchemy/test/Fly/fixtures/bluegreen-worker-shared.ts:65
     export interface Job {
0.76 packages/cloudflare-runtime/src/internal/workers-shared/workers/asset-worker/src/experiment-analytics.ts:9
     type Data = {
0.76 packages/pkg/src/cli/pack.ts:21
     type ManifestPackage,
0.75 packages/alchemy/src/ACME/Errors.ts:4
     export interface IdentifierProblem {
0.75 packages/alchemy/src/AWS/ACM/ExpiryEventSource.ts:16
     export interface ExpiryEventDetail {
0.75 packages/alchemy/src/AWS/AccessAnalyzer/ArchiveRule.ts:12
     export interface ArchiveRuleCriterion {
0.75 packages/alchemy/src/AWS/Athena/QueryStateChangeEventSource.ts:23
     export interface QueryStateChangeDetail {
0.75 packages/alchemy/src/AWS/Cognito/UserPoolDomain.ts:231
     });
0.75 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:93
     export interface Cluster extends Resource<
0.75 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:290
     }
0.75 packages/alchemy/src/AWS/GlobalAccelerator/EndpointGroup.ts:247
     live: ga.EndpointGroup,
0.75 packages/alchemy/src/AWS/MediaLive/ChannelEventSource.ts:15
     export interface MediaLiveChannelEventDetail {
0.75 packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts:23
     export interface PlaybackConfigurationCdn {
0.75 packages/alchemy/src/AWS/Organizations/OrganizationsEventSource.ts:39
     export interface OrganizationsEventDetail {
0.75 packages/alchemy/src/AWS/Organizations/TenantRoot.ts:42
     export interface TenantOrganizationalUnitSpec extends Omit<
0.75 packages/alchemy/src/AWS/S3/BucketNotifications.ts:11
     export type BucketNotification = {
0.75 packages/alchemy/src/AWS/SageMaker/EventSource.ts:15
     export interface SageMakerEventDetail {
0.75 packages/alchemy/src/AWS/XRay/InsightEventSource.ts:14
     export interface InsightEventDetail {
0.75 packages/alchemy/src/Alchemist/routes/nuke.ts:18
     export interface ScanInput extends Target {
0.75 packages/alchemy/src/Cloudflare/Auth/TokenPolicy.ts:12
     export interface TokenPolicy {
0.75 packages/alchemy/src/Docker/Docker.ts:502
     export interface CommandOutput {
0.75 packages/alchemy/src/Kubernetes/Connection.ts:34
     export interface AuthRegistry {
0.75 packages/alchemy/src/Neon/OrganizationApiKey.ts:11
     export interface OrganizationApiKeyProps {
0.75 packages/alchemy/src/Neon/OrganizationSpendingLimit.ts:10
     export interface OrganizationSpendingLimitProps {
0.75 packages/alchemy/src/Planetscale/Branch.ts:161
     export interface BranchMigrationRunners {
0.75 packages/alchemy/src/Railway/Environment.ts:21
     export type RailwayWorkspace = {
0.75 packages/alchemy/src/Stripe/BillingMeter.ts:44
     export interface BillingMeterCustomerMapping {
0.75 packages/alchemy/src/Stripe/IssuingCard.ts:145
     expMonth?: number;
0.75 packages/alchemy/src/Stripe/Price.ts:46
     intervalCount?: number;
0.75 packages/alchemy/src/Stripe/TaxRate.ts:102
     export type TaxRate = Resource<
0.75 packages/alchemy/src/Stripe/TerminalConfiguration.ts:51
     export interface TerminalTipping {
0.75 packages/alchemy/test/SQL/fixtures/routes.ts:31
     export type UserRow = {
0.74 packages/alchemy/src/AWS/CloudTrail/Trail.ts:201
     > {}
0.74 packages/alchemy/src/AWS/CloudWatch/binding-common.ts:9
     export type AlarmResource = Alarm | CompositeAlarm;
0.74 packages/alchemy/src/AWS/CodeBuild/Project.ts:23
     export interface ProjectSourceConfig {
0.74 packages/alchemy/src/AWS/Connection/DbAuthToken.ts:8
     export interface GenerateDbAuthTokenOptions {
0.74 packages/alchemy/src/AWS/DevOpsGuru/InsightEventSource.ts:15
     export interface InsightEventDetail {
0.74 packages/alchemy/src/AWS/ElastiCache/CacheEventSource.ts:14
     export interface CacheEventDetail {
0.74 packages/alchemy/src/AWS/IVSChat/RoomMessageReviewEventSource.ts:10
     export interface RoomMessageEvent {
0.74 packages/alchemy/src/AWS/MWAAServerless/Workflow.ts:30
     export interface WorkflowEncryptionConfiguration {
0.74 packages/alchemy/src/AWS/Neptune/NeptuneEventSource.ts:14
     export interface NeptuneEventDetail {
0.74 packages/alchemy/src/AWS/Redshift/Cluster.ts:700
     };
0.74 packages/alchemy/src/AWS/RedshiftServerless/RedshiftServerlessEventSource.ts:13
     export interface RedshiftServerlessEventDetail {
0.74 packages/alchemy/src/AWS/SecurityHub/FindingEventSource.ts:14
     export interface FindingEventDetail {
0.74 packages/alchemy/src/AWS/SocialMessaging/LinkedWhatsAppBusinessAccount.ts:102
     never,
0.74 packages/alchemy/src/AWS/Transcribe/JobEventSource.ts:214
     export interface MedicalScribeJobEventSourceProps extends EventRouteProps {
0.74 packages/alchemy/src/AWS/Transfer/FileTransferEventSource.ts:14
     export interface FileTransferEventDetail {
0.74 packages/alchemy/src/Cloudflare/DNS/Record.ts:81
     name: string;
0.74 packages/alchemy/src/Cloudflare/Images/Variant.ts:86
     export type Variant = Resource<
0.74 packages/alchemy/src/Cloudflare/Snippets/SnippetRules.ts:15
     export interface SnippetRule {
0.74 packages/alchemy/src/Cloudflare/VpcService/VpcServiceLookup.ts:29
     export interface VpcServiceLookup extends Attributes {
0.74 packages/alchemy/src/Neon/Website/Trace.ts:7
     export interface TraceInput {
0.74 packages/alchemy/src/Planetscale/Database.ts:6
     export interface DatabaseRegion {
0.74 packages/alchemy/src/Stripe/TerminalLocation.ts:144
     export type TerminalLocation = Resource<
0.74 packages/alchemy/test/AWS/StepFunctions/fixtures/order-program.ts:17
     export interface OrderInput {
0.74 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/types.ts:5
     export interface ReadyAnalytics {
0.74 packages/frontend-frameworks/src/core/BuildOutput.ts:16
     export interface OutputFile {
0.73 packages/alchemy/src/AWS/AppRegistry/AttributeGroup.ts:18
     export interface AttributeGroupProps {
0.73 packages/alchemy/src/AWS/AuditManager/Assessment.ts:23
     export interface AssessmentReportsDestinationProps {
0.73 packages/alchemy/src/AWS/Budgets/Budget.ts:31
     export interface BudgetNotification {
0.73 packages/alchemy/src/AWS/CloudTrail/EventDataStore.ts:37
     }
0.73 packages/alchemy/src/AWS/CodeArtifact/Domain.ts:13
     export interface DomainProps {
0.73 packages/alchemy/src/AWS/CodeConnections/Host.ts:39
     export interface HostProps {
0.73 packages/alchemy/src/AWS/Cognito/User.ts:181
     }
0.73 packages/alchemy/src/AWS/Cognito/UserPool.ts:388
     export interface UserPool extends Resource<
0.73 packages/alchemy/src/AWS/Cognito/UserPoolClient.ts:82
     writeAttributes?: string[];
0.73 packages/alchemy/src/AWS/EC2/EgressOnlyInternetGateway.ts:141
     }> {}
0.73 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:101
     > {}
0.73 packages/alchemy/src/AWS/EC2/RouteTableAssociation.ts:42
     export interface RouteTableAssociation extends Resource<
0.73 packages/alchemy/src/AWS/EC2/VpcEndpoint.ts:102
     export interface VpcEndpoint extends Resource<
0.73 packages/alchemy/src/AWS/IAM/Policy.ts:126
     export interface PolicyProps {
0.73 packages/alchemy/src/AWS/IoT/Policy.ts:24
     export interface IoTPolicyDocument {
0.73 packages/alchemy/src/AWS/Lambda/Version.ts:63
     never,
0.73 packages/alchemy/src/AWS/MailManager/AddonInstance.ts:16
     export interface AddonInstanceProps {
0.73 packages/alchemy/src/AWS/Neptune/DBClusterParameterGroup.ts:41
     export interface DBClusterParameterGroup extends Resource<
0.73 packages/alchemy/src/AWS/Neptune/DBInstance.ts:101
     never,
0.73 packages/alchemy/src/AWS/RAM/Permission.ts:21
     export interface PermissionPolicyTemplate {
0.73 packages/alchemy/src/AWS/RolesAnywhere/TrustAnchor.ts:231
     TrustAnchor,
0.73 packages/alchemy/src/AWS/SES/CustomVerificationEmailTemplate.ts:61
     never,
0.73 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:41
     export interface PipelineAttributes {
0.73 packages/alchemy/src/Cloudflare/TokenValidation/Rule.ts:115
     selector: {
0.73 packages/alchemy/src/Doppler/AuthProvider.ts:262
     DopplerResolvedCredentials
0.73 packages/alchemy/src/Drift.ts:75
     export interface DriftResult {
0.73 packages/alchemy/src/Fly/DeploymentState.ts:9
     type DeploymentState =
0.73 packages/alchemy/src/Git/Hasher/Protocol.ts:69
     interface WireResult {
0.73 packages/alchemy/src/Git/Protocol/PackParser.ts:61
     export interface RandomAccess {
0.73 packages/alchemy/src/Git/Protocol/TreeDiff.ts:66
     export interface TreeDiffObjects {
0.73 packages/alchemy/src/Infisical/AuthProvider.ts:181
     InfisicalResolvedCredentials,
0.73 packages/alchemy/src/Neon/Bucket.ts:41
     export interface BucketAttributes extends ResolvedBranchScope {
0.73 packages/alchemy/src/Neon/Storage.ts:251
     for (;;) {
0.73 packages/alchemy/src/Stripe/PaymentLink.ts:62
     export interface PaymentLinkLineItem {
0.73 packages/alchemy/test/AWS/ElastiCache/ProvisionedFixture.ts:12
     export interface ProvisionedNetwork {
0.72 packages/alchemy/src/AWS/ACMPCA/CertificateAuthority.ts:201
     export interface CertificateAuthority extends Resource<
0.72 packages/alchemy/src/AWS/AMP/Workspace.ts:61
     export interface Workspace extends Resource<
0.72 packages/alchemy/src/AWS/Amplify/AppEventSource.ts:14
     export interface DeploymentStatusChangeDetail {
0.72 packages/alchemy/src/AWS/AppSync/GraphqlApi.ts:201
     GraphqlApiProps,
0.72 packages/alchemy/src/AWS/ControlTower/EnabledControl.ts:42
     export interface EnabledControl extends Resource<
0.72 packages/alchemy/src/AWS/DLM/LifecyclePolicy.ts:690
     }: {
0.72 packages/alchemy/src/AWS/DataBrew/Job.ts:59
     formatOptions?: {
0.72 packages/alchemy/src/AWS/DataSync/TaskEventSource.ts:17
     export interface TaskEventDetail {
0.72 packages/alchemy/src/AWS/DataZone/DataZoneEventSource.ts:15
     export interface DataZoneEventDetail {
0.72 packages/alchemy/src/AWS/Deadline/Fleet.ts:222
     export interface Fleet extends Resource<
0.72 packages/alchemy/src/AWS/DocDB/ClusterEventSource.ts:18
     export interface DocumentDBRecord<TDoc = unknown> {
0.72 packages/alchemy/src/AWS/EC2/NatGateway.ts:82
     export interface NatGateway extends Resource<
0.72 packages/alchemy/src/AWS/EMR/Cluster.ts:21
     export interface ClusterInstancesConfig {
0.72 packages/alchemy/src/AWS/LicenseManager/LicenseConfiguration.ts:21
     export interface LicenseConfigurationProps {
0.72 packages/alchemy/src/AWS/Location/TrackerEventSource.ts:16
     export interface TrackerEventDetail {
0.72 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:13
     export interface MQMessage {
0.72 packages/alchemy/src/AWS/Neptune/DBParameterGroup.ts:41
     export interface DBParameterGroup extends Resource<
0.72 packages/alchemy/src/AWS/RDS/DBClusterParameterGroup.ts:236
     }
0.72 packages/alchemy/src/AWS/RDS/DBParameterGroup.ts:274
     ): g is rds.DBParameterGroup & {
0.72 packages/alchemy/src/AWS/RUM/MetricsDestination.ts:22
     name: string;
0.72 packages/alchemy/src/AWS/RePostSpace/Space.ts:162
     > {}
0.72 packages/alchemy/src/AWS/RolesAnywhere/Profile.ts:44
     export interface ProfileAttributeMapping {
0.72 packages/alchemy/src/AWS/Route53/Record.ts:162
     export interface Record extends Resource<
0.72 packages/alchemy/src/AWS/SecretsManager/Secret.ts:102
     never,
0.72 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:15
     export interface ObservedIdp {
0.72 packages/alchemy/src/Cloudflare/Devices/PostureIntegration.ts:118
     never,
0.72 packages/alchemy/src/Cloudflare/Firewall/UaRule.ts:74
     export type UaRule = Resource<
0.72 packages/alchemy/src/Cloudflare/LoadBalancer/MonitorGroup.ts:43
     export interface MonitorGroupProps {
0.72 packages/alchemy/src/Cloudflare/Pages/Project.ts:181
     never,
0.72 packages/alchemy/src/Git/Protocol/Delta.ts:44
     export interface DeltaHeader {
0.72 packages/alchemy/src/GitHub/Env.ts:8
     export interface GitHubEnv {
0.72 packages/alchemy/src/Namespace.ts:5
     export interface NamespaceNode {
0.72 packages/alchemy/src/Neon/AuthOAuthProvider.ts:17
     export interface AuthOAuthProviderProps {
0.72 packages/alchemy/src/Neon/Credential.ts:26
     export interface CredentialAttributes extends ResolvedBranchScope {
0.72 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:17
     export interface FunctionRuntimeContext extends BaseRuntimeContext {
0.72 packages/alchemy/src/Stripe/Account.ts:48
     export interface AccountBusinessProfile {
0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/email-worker.ts:29
     interface ReceivedMessage {
0.72 packages/alchemy/test/Git/fixtures/test-auth.ts:34
     export interface TestUser {
0.72 packages/cloudflare-runtime/src/internal/workflows-shared/engine.ts:1588
     },
0.71 packages/alchemy/src/AWS/AMP/Scraper.ts:104
     export interface Scraper extends Resource<
0.71 packages/alchemy/src/AWS/Account/Region.ts:42
     export interface Region extends Resource<
0.71 packages/alchemy/src/AWS/ApiGateway/Method.ts:332
     const readMethodSnapshot = (p: {
0.71 packages/alchemy/src/AWS/ApiGatewayV2/Integration.ts:268
     Effect.succeed([] as IntegrationType["Attributes"][]),
0.71 packages/alchemy/src/AWS/AuthProvider.ts:221
     region,
0.71 packages/alchemy/src/AWS/CloudFormation/StackEventSource.ts:15
     export interface StackEventDetail {
0.71 packages/alchemy/src/AWS/CloudFront/RealtimeLogConfig.ts:220
     export const RealtimeLogConfigProvider = () =>
0.71 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:161
     export const Cluster = Resource<Cluster>("AWS.CloudHSMV2.Cluster");
0.71 packages/alchemy/src/AWS/DataZone/Domain.ts:28
     export interface DomainProps {
0.71 packages/alchemy/src/AWS/EC2/ClientVpnTargetNetworkAssociation.ts:29
     export interface ClientVpnTargetNetworkAssociation extends Resource<
0.71 packages/alchemy/src/AWS/EC2/RouteTable.ts:497
     const describeRouteTable = (
0.71 packages/alchemy/src/AWS/EC2/Vpc.ts:23
     export interface VpcProps {
0.71 packages/alchemy/src/AWS/ECS/ClusterEventSource.ts:16
     export interface ClusterEventDetail {
0.71 packages/alchemy/src/AWS/EKS/internal/ClusterObject.ts:17
     export interface ClusterObjectProps {
0.71 packages/alchemy/src/AWS/EMRServerless/JobRunEventSource.ts:15
     export interface JobRunEventDetail {
0.71 packages/alchemy/src/AWS/GreengrassV2/ComponentVersion.ts:41
     never,
0.71 packages/alchemy/src/AWS/KinesisAnalyticsV2/Application.ts:42
     export interface ApplicationCodeProps {
0.71 packages/alchemy/src/AWS/LakeFormation/LFTagExpression.ts:13
     export interface LFTagPairSpec {
0.71 packages/alchemy/src/AWS/Lambda/EventSourceMapping.ts:161
     export interface EventSourceMapping extends Resource<
0.71 packages/alchemy/src/AWS/MediaConnect/Flow.ts:22
     export interface FlowProps {
0.71 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:239
     () => Effect.void,
0.71 packages/alchemy/src/AWS/S3Control/AccessPointPolicy.ts:14
     export interface AccessPointPolicyProps {
0.71 packages/alchemy/src/AWS/S3Files/AccessPoint.ts:41
     export interface AccessPointCreationPermissions {
0.71 packages/alchemy/src/AWS/SES/Contact.ts:338
     return { contactListName, emailAddress };
0.71 packages/alchemy/src/AWS/Translate/TranslationJobEventSource.ts:14
     export interface TranslationJobEventDetail {
0.71 packages/alchemy/src/Cli/components/view/PlanTree.ts:102
     export interface PlanTreeOptions {
0.71 packages/alchemy/src/Cloudflare/Iam/UserGroup.ts:44
     export interface UserGroupPolicy {
0.71 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Config.ts:32
     export interface ConfigProps {
0.71 packages/alchemy/src/Cloudflare/PageShield/Policy.ts:63
     export interface PolicyAttributes {
0.71 packages/alchemy/src/Cloudflare/Snippets/Snippet.ts:63
     export type Snippet = Resource<
0.71 packages/alchemy/src/Cloudflare/VulnerabilityScanner/Credential.ts:23
     export interface VulnScannerCredentialProps {
0.71 packages/alchemy/src/Fly/Bucket.ts:54
     export interface BucketProps {
0.71 packages/alchemy/src/Neon/Function.ts:29
     export interface FunctionCommonProps extends PlatformProps {
0.71 packages/alchemy/src/Railway/AuditLog.ts:83
     export interface AuditLogEntry {
0.71 packages/alchemy/test/Fly/fixtures/legacy-protocol-writer.ts:90
     export interface StopRequest {
0.71 packages/cloudflare-runtime/src/core/bindings/rate-limit/RateLimitProps.shared.ts:11
     export type RateLimitProps = typeof RateLimitProps.Type;
```
