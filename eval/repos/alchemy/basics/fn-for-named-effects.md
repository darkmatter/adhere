# basics/fn-for-named-effects

A named function that returns an Effect must be defined with Effect.fn so the call site is traced. An Effect held in a constant, such as `const program = Effect.gen(...)`, is not a function and is not in scope.

Since left out of the preset, for Effect's language service to check (4ae0126).

432 findings, from 0.96 down to 0.71. Each showed this hint:

```ts
const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user ${userId}`);
  const user = yield* getUser(userId);
  return yield* processData(user);
});
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.96 packages/alchemy/src/Prisma/Internal/BundlePaths.ts:4
     export const normalizeBundleFilePath = (input: string) =>
0.94 packages/alchemy/src/Cloudflare/D1/CloneDatabase.ts:18
     export const cloneDatabase = (options: CloneDatabaseOptions) =>
0.94 packages/alchemy/test/AWS/ECS/reclaimTaskDefinitionFamily.ts:17
     export const reclaimTaskDefinitionFamily = (family: string) =>
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/publication/applications.ts:5
     export const publicationApplications = (contexts: {
0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/browser.ts:20
     export const echo = (value: string) =>
0.93 packages/alchemy/src/Cloudflare/Auth/AuthConfig.ts:85
     Effect.gen(function* () {
0.93 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:42
     export const getText = (url: string) =>
0.93 packages/alchemy/test/Fly/fixtures/legacy-protocol-writer.ts:32
     export const writeLegacyProtocol = (
0.92 packages/alchemy/src/AWS/EventBridge/ToEcsTask.ts:56
     export const toEcsTask = (
0.92 packages/alchemy/src/Cloudflare/AI/ProviderKey.ts:137
     export const ProviderKey = (id: string, props: InputProps<ProviderKeyProps>) =>
0.92 packages/alchemy/src/Cloudflare/Zone/lookup.ts:32
     Effect.gen(function* () {
0.92 packages/alchemy/src/Hetzner/Catalog.ts:29
     export const findLocation = (ref: string | number) =>
0.92 packages/alchemy/src/Prisma/Internal/ArtifactUpload.ts:14
     export const executeArtifactUpload = (
0.92 packages/alchemy/src/SQL/Migrations/Convert.ts:70
     export const findForeignHistory = (options: {
0.92 packages/alchemy/test/AWS/PaymentCryptography/reapKeys.ts:24
     export const reapLeakedKeys = (stackNames?: ReadonlyArray<string>) =>
0.92 packages/alchemy/test/Cloudflare/Container/fixtures/identity/applications.ts:4
     export const applications = (maxInstances = 2, name?: string) =>
0.92 packages/alchemy/test/Prisma/fixtures/read-routes.ts:11
     export const readRoutes = (store: ReadBucketClient, url: URL) =>
0.91 packages/alchemy/src/AWS/Website/Vinext.ts:70
     export const Vinext = (id: string, propsIn: InputProps<VinextProps> = {}) =>
0.91 packages/alchemy/src/Cloudflare/AI/Search.ts:357
     });
0.91 packages/alchemy/src/Cloudflare/Workers/Cache.ts:81
     export const cache = (
0.91 packages/alchemy/src/Fly/Catalog.ts:34
     export const findRegion = (code: string) =>
0.91 packages/alchemy/src/Fly/Website/StaticSite.ts:109
     }
0.91 packages/alchemy/src/Fly/Website/Vinext.ts:65
     export const Vinext = (id: string, propsIn: VinextProps = {}) =>
0.91 packages/alchemy/src/Git/Protocol/PartialScan.ts:145
     const remember = (
0.91 packages/alchemy/src/Hetzner/Website/StaticSite.ts:180
     const build = yield* Command.Build("Build", {
0.91 packages/alchemy/src/Neon/Website/StaticSite.ts:72
     export const StaticSite = (id: string, props: StaticSiteProps) =>
0.91 packages/alchemy/src/Railway/Website/StaticSite.ts:153
     export const StaticSite = (id: string, props: StaticSiteProps) =>
0.91 packages/alchemy/src/SQL/Migrations/Records.ts:41
     export const readDrizzleDirRecords = (dir: string) =>
0.91 packages/alchemy/src/SQL/MySQLDriver.ts:40
     Effect.gen(function* () {
0.91 packages/alchemy/src/SQL/PostgresDriver.ts:38
     Effect.gen(function* () {
0.91 packages/alchemy/src/SQL/SqlFile.ts:16
     export const listSqlFiles = (directory: string) =>
0.91 packages/alchemy/test/Cloudflare/KV/fixtures/read-routes.ts:18
     export const readRoutes = (kv: ReadNamespaceClient, url: URL) =>
0.91 packages/alchemy/test/Cloudflare/R2/fixtures/read-routes.ts:11
     export const readRoutes = (r2: ReadBucketClient, url: URL) =>
0.91 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/secret-routes.ts:17
     export const secretRoutes = (client: ReadSecretClient, url: URL) =>
0.90 packages/alchemy/src/ACME/Dns.ts:42
     export const propagationDelay = (
0.90 packages/alchemy/src/AWS/EC2/ClientVpnWait.ts:25
     Effect.gen(function* () {
0.90 packages/alchemy/src/AWS/EC2/Network.ts:448
     throw new Error(
0.90 packages/alchemy/src/AWS/EventBridge/ToLambda.ts:47
     export const toLambda = (
0.90 packages/alchemy/src/AWS/EventBridge/ToQueue.ts:39
     export const toQueue = (
0.90 packages/alchemy/src/AWS/Lambda/Durable.ts:160
     export const sleep = (
0.90 packages/alchemy/src/AWS/Lambda/MicrovmRpc.ts:63
     export const connectMicrovm = <S>(
0.90 packages/alchemy/src/Fly/Credentials.ts:29
     export const bindFlyApiToken = (): Effect.Effect<void, never, Credentials> =>
0.90 packages/alchemy/src/Git/Engine.ts:82
     const get = (path: { readonly owner: string; readonly repo: string }) =>
0.90 packages/alchemy/src/Git/Jobs/Bundle.ts:125
     Effect.gen(function* () {
0.90 packages/alchemy/src/Git/Jobs/Purge.ts:83
     export const runPurgeJob = (
0.90 packages/alchemy/src/Neon/waitUntil.ts:11
     export const waitUntil = <A, E, R>(
0.90 packages/alchemy/src/Prisma/Internal/DeploymentObserve.ts:4
     export const observeDeployment = (deploymentId: string) =>
0.90 packages/alchemy/src/Prisma/Website/StaticSite.ts:72
     export const StaticSite = (id: string, props: StaticSiteProps) =>
0.90 packages/alchemy/src/Railway/GraphQL.ts:13
     const advance = (
0.90 packages/alchemy/src/SQL/Migrations/Detect.ts:21
     export const detectLayout = (dir: string) =>
0.90 packages/alchemy/src/State/HttpStateStore.ts:103
     listStacks: () =>
0.90 packages/alchemy/src/Test/Http.ts:54
     export const executeWhenReady = (
0.90 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/routes.ts:16
     export const connectionRoutes = (hd: ConnectClient, url: URL) =>
0.90 packages/alchemy/test/Fly/fixtures/process-death.ts:77
     export const evidencePaths = (stack: ScratchStack) =>
0.90 packages/alchemy/test/Neon/FunctionRollout.ts:12
     export const functionRolloutSamples = <A, E, R>(
0.90 packages/alchemy/test/Railway/waitUntilVolumeGone.ts:16
     export const waitUntilVolumeGone = (volumeInstanceId: string) =>
0.89 packages/alchemy/src/AWS/EKS/internal/PodIdentityServiceAccount.ts:71
     export const PodIdentityServiceAccount = (
0.89 packages/alchemy/src/AWS/RDS/Aurora.ts:363
     Effect.gen(function* () {
0.89 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:44
     export const importD1Database = (options: ImportDatabaseOptions) =>
0.89 packages/alchemy/src/Git/Hasher/LambdaEvent.ts:119
     Effect.gen(function* () {
0.89 packages/alchemy/src/Git/Http/ReceivePack.ts:37
     export const decode = (request: HttpServerRequest.HttpServerRequest) =>
0.89 packages/alchemy/src/Hetzner/FloatingIpAssignment.ts:147
     const getById = (id: number) =>
0.89 packages/alchemy/src/Neon/upgrade.ts:13
     export const upgrade = (options?: {
0.89 packages/alchemy/src/Railway/Website/Vinext.ts:72
     export const Vinext = (id: string, propsIn: VinextProps = {}) =>
0.89 packages/alchemy/test/Cloudflare/Container/fixtures/sqlreach/expect.ts:19
     Effect.gen(function* () {
0.89 packages/alchemy/test/Fly/fixtures/bluegreen.ts:20
     export const deployWorker = (
0.89 packages/alchemy/test/Git/fixtures/protected-stack.ts:33
     const protectMain = (
0.89 packages/frontend-frameworks/src/nextjs/Bundle.ts:85
     export const bundleWorker = (
0.89 packages/frontend-frameworks/src/vinext/cli.ts:121
     Effect.gen(function* () {
0.88 packages/alchemy/src/Auth/Profile.ts:542
     const readProviderFile = (profile: string, file: string) =>
0.88 packages/alchemy/src/Planetscale/MySQL/MySQLMigrations.ts:82
     const runMySQLSql = (target: MySQLMigrationTarget, sql: string) =>
0.88 packages/alchemy/src/Planetscale/Postgres/PostgresMigrations.ts:64
     Effect.gen(function* () {
0.88 packages/alchemy/src/Railway/Catalog.ts:47
     export const findRegion = (ref: string) =>
0.88 packages/alchemy/src/Util/AtomicFile.ts:19
     export const writeFileAtomic = (
0.88 packages/alchemy/test/Cloudflare/KV/fixtures/write-routes.ts:22
     Effect.gen(function* () {
0.88 packages/alchemy/test/Cloudflare/R2/fixtures/write-routes.ts:26
     Effect.gen(function* () {
0.88 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:22
     export const requestWorker = (
0.88 packages/alchemy/test/Fly/fixtures/actors.ts:8
     export const engineActor = (
0.88 packages/alchemy/test/Prisma/fixtures/write-routes.ts:28
     Effect.gen(function* () {
0.87 packages/alchemy/src/ACME/Client.ts:161
     const solveAuthorization = <R>(
0.87 packages/alchemy/src/AWS/ApiGatewayV2/HttpApi.ts:90
     export const HttpApi = (id: string, props: HttpApiProps) =>
0.87 packages/alchemy/src/AWS/S3/normalizeBucketNotification.ts:5
     export const normalizeBucketNotification = (record: S3Record) =>
0.87 packages/alchemy/src/AWS/SecurityLake/internal.ts:19
     export const readSecurityLakeTags = (resourceArn: string) =>
0.87 packages/alchemy/src/Auth/StoredAuthProvider.ts:184
     export const makeStoredAuthProvider = <Resolved>(
0.87 packages/alchemy/src/Cloudflare/Auth/AuthProvider.ts:162
     const promptAccountId = () =>
0.87 packages/alchemy/src/Cloudflare/Containers/ContainerPublication.ts:5
     export const retryContainerPublication = <A, R>(
0.87 packages/alchemy/src/Fly/PostgresMigrations.ts:141
     Effect.gen(function* () {
0.87 packages/alchemy/src/Git/Jobs/Compact.ts:261
     Effect.gen(function* () {
0.87 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:9
     const startConflictIsIdempotent = (deploymentId: string, error: Conflict) =>
0.87 packages/alchemy/src/Stripe/PromotionCode.ts:321
     Effect.gen(function* () {
0.87 packages/alchemy/test/AWS/EC2/fixtures/client-vpn.ts:34
     export const importClientVpnCertificate = (stackName: string) =>
0.87 packages/alchemy/test/Fly/fixtures/http-readiness-control.ts:182
     export const repairReadiness = (appName: string, machineId: string) =>
0.87 packages/alchemy/test/Fly/fixtures/signal-overlap.ts:302
     export const observeExpiry = (witness: Witness) =>
0.87 packages/alchemy/test/Neon/fixtures/function-effect.ts:24
     const recordLifecycle = (id: string, phase: string) =>
0.87 packages/better-auth/src/Migrate.ts:132
     const runMigrationWith = (
0.87 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:14
     export const fetchSql = () =>
0.87 packages/frontend-frameworks/src/core/DevChild.ts:280
     return { url };
0.87 packages/frontend-frameworks/src/nextjs/Runner.ts:93
     export const runOpenNextBuild = (
0.87 packages/frontend-frameworks/src/vite/aws.ts:39
     export const buildInChild = (config: ViteAwsBuildChildConfig) =>
0.86 packages/alchemy/src/AWS/ApiGateway/GatewayResource.ts:101
     Effect.gen(function* () {
0.86 packages/alchemy/src/AWS/AuthProvider.ts:201
     const getAccountId = ({
0.86 packages/alchemy/src/AWS/Batch/internal.ts:11
     export const pollBatch = <A, E, R>(
0.86 packages/alchemy/src/Auth/CredentialsCache.ts:31
     export const cacheUntilExpiry = <A, E>(
0.86 packages/alchemy/src/Fly/App.ts:222
     const hasAlchemyMachines = (appName: string) =>
0.86 packages/alchemy/src/Git/Store/IncomingBody.ts:37
     export const feedBody = (
0.86 packages/alchemy/src/Prisma/Connection.ts:425
     const attrsFrom = (
0.86 packages/alchemy/src/Prisma/EnvironmentVariable.ts:219
     const findVariable = (
0.86 packages/alchemy/src/Prisma/Internal/AppIdentity.ts:4
     export const ensureAppImmutableIdentity = (
0.86 packages/alchemy/src/Prisma/ORM/internal.ts:182
     Effect.gen(function* () {
0.86 packages/alchemy/src/Prisma/Refs.ts:32
     const resolveId = (label: string, value: unknown) =>
0.86 packages/alchemy/src/SQL/Migrations/Registry.ts:111
     Effect.gen(function* () {
0.86 packages/alchemy/src/Util/sha256.ts:22
     export const hashInput = (input: unknown): Effect.Effect<string> =>
0.86 packages/alchemy/test/Cloudflare/Container/fixtures/buildx.ts:59
     export const supportsRegistryExport = Effect.gen(function* () {
0.86 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:261
     Effect.gen(function* () {
0.86 packages/alchemy/test/Fly/fixtures/state-persistence.ts:30
     export const delayedResourceWrite = (target: {
0.86 packages/cloudflare-runtime/src/core/bindings/SecretKey.ts:79
     const keyMaterial = (
0.86 packages/cloudflare-runtime/src/core/test/helpers/port.ts:5
     export const occupy = (port: number, host?: string) =>
0.85 packages/alchemy/src/AWS/ControlTower/EnabledBaseline.ts:200
     const readEnabledBaseline = (enabledBaselineArn: string) =>
0.85 packages/alchemy/src/AWS/SSMIncidents/ReplicationSet.ts:176
     const readTags = (arn: string) =>
0.85 packages/alchemy/src/Cloudflare/Access.ts:48
     const login = (domain: string) =>
0.85 packages/alchemy/src/Cloudflare/Workers/ViteChild.ts:48
     export const startViteChild = (
0.85 packages/alchemy/src/Hetzner/Network.ts:481
     Effect.gen(function* () {
0.85 packages/alchemy/src/Neon/LanguageModel.ts:701
     Effect.gen(function* () {
0.85 packages/alchemy/src/Prisma/Database.ts:321
     Effect.gen(function* () {
0.85 packages/alchemy/src/Redis/Protocol.ts:254
     const expectStatus = (
0.85 packages/alchemy/src/Util/md5.ts:9
     export const md5 = (data: string | Uint8Array): Effect.Effect<string> =>
0.85 packages/alchemy/test/AWS/AppRunner/logGroups.ts:18
     export const observeLogGroups = (logGroupNames: readonly string[]) =>
0.85 packages/alchemy/test/Cloudflare/Artifacts/fixtures/routes.ts:20
     export const artifactsRoutes = (client: ReadWriteNamespaceClient, url: URL) =>
0.85 packages/better-auth/src/Postgres.ts:88
     const open = (url: Effect.Effect<Redacted.Redacted<string>>) =>
0.84 packages/alchemy/src/AWS/AppSync/ApiAssociation.ts:67
     export const ApiAssociation = (id: string, props: ApiAssociationInputProps) =>
0.84 packages/alchemy/src/AWS/Lambda/MicrovmProvider.ts:166
     const getImage = (identifier: string) =>
0.84 packages/alchemy/src/AWS/Scheduler/ScheduleEventSource.ts:232
     Effect.gen(function* () {
0.84 packages/alchemy/src/AWS/ServiceCatalog/internal.ts:42
     Effect.gen(function* () {
0.84 packages/alchemy/src/AWS/Timestream/internal.ts:44
     Effect.gen(function* () {
0.84 packages/alchemy/src/Auth/Env.ts:7
     export const getEnv = (key: string) =>
0.84 packages/alchemy/src/Bundle/TempRoot.ts:36
     export const createTempBundleDir = (
0.84 packages/alchemy/src/Drizzle/MySQL.ts:59
     Effect.gen(function* () {
0.84 packages/alchemy/src/GitHub/AuthProvider.ts:382
     const login = (_profileName: string, config: GitHubAuthConfig) =>
0.84 packages/alchemy/src/Hetzner/PlacementGroup.ts:164
     const findByAlchemyLabels = (id: string) =>
0.84 packages/alchemy/src/Hetzner/PrimaryIp.ts:264
     const getById = (id: number) =>
0.84 packages/alchemy/src/Infisical/AuthProvider.ts:279
     configure: () =>
0.84 packages/alchemy/src/Railway/MySQL.ts:225
     const resolveMySQLProps = (
0.84 packages/alchemy/src/SQL/ConnectionSource.ts:49
     export const resolveConnectionSource = (
0.84 packages/better-auth/src/MySQL.ts:31
     export const makeMySQLService = (
0.84 packages/frontend-frameworks/src/vinext/cache/seed.ts:87
     Effect.gen(function* () {
0.83 packages/alchemy/src/AWS/AppIntegrations/EventIntegrationEventSource.ts:105
     Effect.gen(function* () {
0.83 packages/alchemy/src/AWS/AppRunner/ServiceEventSource.ts:108
     Effect.gen(function* () {
0.83 packages/alchemy/src/AWS/ControlTower/LandingZone.ts:154
     const retryWhileLandingZoneOperationPending = <
0.83 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationSnapshot.ts:101
     Effect.gen(function* () {
0.83 packages/alchemy/src/AWS/Website/SsrSite.ts:161
     const serverOriginOf = (server: SsrSiteServerOrigin): Input<string> =>
0.83 packages/alchemy/src/Cloudflare/HttpClientUtils.ts:16
     export const authorizeWith =
0.83 packages/alchemy/src/Cloudflare/StateStore/State.ts:182
     const ensureAccess = (credentials: HttpStateStoreCredentials) =>
0.83 packages/alchemy/src/Git/Protocol/Delta.ts:78
     export const applyDelta = (
0.83 packages/alchemy/src/GitHub/Octokit.ts:21
     export const octokitFor = (
0.83 packages/alchemy/src/Interaction.ts:231
     export const openUrl = (url: string) =>
0.83 packages/alchemy/src/Planetscale/AuthProvider.ts:461
     Effect.gen(function* () {
0.83 packages/alchemy/src/Prisma/App.ts:101
     never,
0.83 packages/alchemy/src/Prisma/Deployment.ts:224
     const listAppDeployments = (appId: string) =>
0.83 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:225
     Effect.gen(function* () {
0.83 packages/alchemy/src/Prisma/SourceRepository.ts:181
     const repos: GetSourceRepositoriesResponse["data"][number][] = [];
0.83 packages/alchemy/src/Railway/Bucket.ts:387
     const toAttrs = (
0.83 packages/alchemy/src/Railway/Postgres.ts:246
     });
0.83 packages/alchemy/src/Railway/VolumeBackup.ts:363
     const goneState = (state: VolumeState | null | undefined) =>
0.83 packages/alchemy/src/Secrets/Log.ts:17
     Effect.gen(function* () {
0.83 packages/alchemy/src/Util/Memoize.ts:27
     Effect.gen(function* () {
0.83 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:23
     export const d1Routes = (db: QueryDatabaseClient, style: string) =>
0.83 packages/alchemy/test/Neon/fixtures/language-model-handler.ts:20
     export const languageModelHandler = (source = languageModelGateway) =>
0.83 packages/frontend-frameworks/src/octane/CloudflareBuild.ts:82
     const visit = (option: PluginOption): Effect.Effect<void, FrameworkError> =>
0.83 packages/frontend-frameworks/src/solidstart/aws.ts:109
     export const buildInChild = (config: SolidStartAwsBuildChildConfig) =>
0.82 packages/alchemy/src/ACME/DnsSolver.ts:82
     Effect.gen(function* () {
0.82 packages/alchemy/src/AWS/ApiGatewayV2/Authorizer.ts:211
     const getAuthorizerSafe = (apiId: string, authorizerId: string) =>
0.82 packages/alchemy/src/AWS/ControlTower/EnabledControl.ts:170
     const waitForControlOperation = (operationIdentifier: string) =>
0.82 packages/alchemy/src/Auth/Credentials.ts:60
     const read = <A, E>(
0.82 packages/alchemy/src/Cli/commands/state.ts:81
     (store: State.StateService) =>
0.82 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:46
     export const getIdp = (
0.82 packages/alchemy/src/Cloudflare/Email/retry.ts:20
     export const retryWorkerScriptNotFound = <A, E extends { _tag: string }, R>(
0.82 packages/alchemy/src/Cloudflare/SecretsStore/LocalSecretsStoreGateway.ts:44
     Effect.gen(function* () {
0.82 packages/alchemy/src/Cloudflare/Workers/WorkerName.ts:4
     export const createWorkerName = (id: string, name: string | undefined) =>
0.82 packages/alchemy/src/Drizzle/Postgres.ts:51
     export const Postgres = <
0.82 packages/alchemy/src/Hetzner/Firewall.ts:224
     const createFirewallName = (id: string, name: string | undefined) =>
0.82 packages/alchemy/src/Railway/ServiceProvider.ts:269
     const instanceSettingsDelta = (input: {
0.82 packages/alchemy/src/Railway/Variable.ts:112
     never,
0.82 packages/alchemy/src/SQL/Postgres.ts:52
     export const Postgres = <E = never, R = never>(config: PostgresConfig<E, R>) =>
0.82 packages/alchemy/src/Website/packExtraFiles.ts:13
     const exists = (target: string) =>
0.82 packages/alchemy/test/AWS/KinesisAnalyticsV2/code-bucket.ts:31
     export const deleteCodeBucketIdempotent = (bucketName: string) =>
0.82 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:36
     readObjectFetch: (key: string) =>
0.82 packages/alchemy/test/IsolatedProject.ts:77
     export const materializeIsolatedProject = (project: IsolatedProject) =>
0.82 packages/better-auth/test/http.ts:22
     const request = (
0.82 packages/cloudflare-runtime/src/core/bindings/VersionMetadata.ts:4
     export const local = (binding: string): BindingHook =>
0.82 packages/cloudflare-runtime/src/core/internal/get-address.ts:25
     export const getAddress = (
0.82 packages/floci/src/index.ts:301
     ): Effect.Effect<Set<number> | undefined> =>
0.82 packages/frontend-frameworks/src/core/BuildOutput.ts:154
     Effect.gen(function* () {
0.82 packages/frontend-frameworks/src/octane/aws.ts:208
     export const buildInChild = (config: OctaneAwsBuildChildConfig) =>
0.82 packages/frontend-frameworks/src/vite/node.ts:74
     export const buildInChild = (config: ViteNodeBuildChildConfig) =>
0.81 packages/alchemy/src/AWS/ApiGateway/Deployment.ts:222
     Effect.gen(function* () {
0.81 packages/alchemy/src/AWS/Website/StaticSite.ts:100
     */
0.81 packages/alchemy/src/Cloudflare/Workers/DurableObjectAlarmStorage.ts:16
     export const ensureAlarmTables = (storage: cf.DurableObjectStorage) =>
0.81 packages/alchemy/src/Prisma/PrismaLogs.ts:181
     Effect.gen(function* () {
0.81 packages/alchemy/src/Railway/Mongo.ts:422
     const projectIdOf = (value: unknown): string | undefined => {
0.81 packages/alchemy/src/Railway/ProjectEnvironment.ts:242
     const findByName = (projectId: string, name: string) =>
0.81 packages/alchemy/src/Railway/ServiceDomain.ts:241
     const createViaEnvironmentPatch = (input: {
0.81 packages/alchemy/src/SQL/Migrations/AlchemyFormat.ts:93
     Effect.gen(function* () {
0.81 packages/alchemy/src/SQL/Migrations/Introspect.ts:15
     export const tableColumns = (
0.81 packages/alchemy/src/SQL/MySQL.ts:31
     const parseMySQLUrl = (url: Redacted.Redacted<string>) =>
0.81 packages/alchemy/src/Stripe/RadarValueList.ts:168
     const toName = (id: string, name: string | undefined, existing?: string) =>
0.81 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/container.ts:47
     const read = (key: string) =>
0.81 packages/alchemy/test/Cloudflare/Queue/SubscriptionSources.ts:7
     return <A, E, R>(effect: Effect.Effect<A, E, R>) =>
0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:18
     const history = (state: State, table: string) =>
0.81 packages/alchemy/test/Fly/fixtures/exec-lease.ts:5
     export const sanitizeExecFailure = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
0.81 packages/cloudflare-runtime/src/core/bindings/Json.ts:4
     export const local = (binding: string, json: any): BindingHook =>
0.81 packages/cloudflare-runtime/src/core/test/helpers/runtime.ts:153
     const realDelay = (millis: number) =>
0.81 packages/frontend-frameworks/src/astro/source.ts:501
     Effect.gen(function* () {
0.80 packages/alchemy/src/AWS/ApiGatewayV2/Route.ts:242
     Effect.gen(function* () {
0.80 packages/alchemy/src/AWS/ApplicationAutoScaling/internal.ts:42
     export const retryWhileTargetPropagates = <A, E extends { _tag: string }, R>(
0.80 packages/alchemy/src/AWS/AutoScaling/LifecycleHookEventSource.ts:174
     export const consumeLifecycleActions = <StreamReq = never, Req = never>(
0.80 packages/alchemy/src/AWS/Macie2/common.ts:17
     export const retryThroughEnablement = <A, E extends { _tag: string }, R>(
0.80 packages/alchemy/src/Artifacts.ts:139
     Effect.gen(function* () {
0.80 packages/alchemy/src/Cli/commands/flags.ts:207
     export const parseSince = (value: string) =>
0.80 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:26
     export const exportDatabase = (
0.80 packages/alchemy/src/Cloudflare/Workers/DurableObjectState.ts:98
     waitUntil: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
0.80 packages/alchemy/src/Destroy.ts:11
     export const destroy = ({
0.80 packages/alchemy/src/Fly/Sprite.ts:482
     const runExec = (input: { name: string; cmd: string[]; env?: string[] }) =>
0.80 packages/alchemy/src/Git/PushInput.ts:19
     export const fromStream = <E, R>(
0.80 packages/alchemy/src/Git/Store/ObjectStore.ts:541
     const getMetaBatch = (
0.80 packages/alchemy/src/GitHub/BaseUrl.ts:69
     > = Effect.gen(function* () {
0.80 packages/alchemy/src/Hetzner/VolumeAttachment.ts:241
     const attach = (volumeId: number, serverId: number, automount: boolean) =>
0.80 packages/alchemy/src/Neon/Branch.ts:661
     const findBranchByName = (projectId: string, name: string) =>
0.80 packages/alchemy/src/Railway/Group.ts:602
     const getProject = (projectId: string) =>
0.80 packages/alchemy/src/Railway/Template.ts:761
     Effect.gen(function* () {
0.80 packages/alchemy/src/Runtime/Bootstrap/ManagedHttpShutdown.ts:59
     export const withManagedHttpShutdown = (
0.80 packages/alchemy/src/State/PostgresState.ts:202
     Effect.gen(function* () {
0.80 packages/alchemy/src/Stripe/RestrictedApiKey.ts:146
     const resolveName = (id: string, name: string | undefined) =>
0.80 packages/alchemy/test/SQL/fixtures/routes.ts:52
     export const makeLayerUsers = (
0.80 packages/cloudflare-runtime/src/core/bindings/Text.ts:4
     export const local = (binding: string, text: string): BindingHook =>
0.80 packages/frontend-frameworks/src/nuxt/aws.ts:111
     export const buildInChild = (config: NuxtAwsBuildChildConfig) =>
0.80 packages/frontend-frameworks/src/vocs/source.ts:22
     export const buildInChild = (config: WakuBuildChildConfig) =>
0.79 packages/alchemy/src/AWS/ApiGateway/Method.ts:501
     // `output.*` fields are never trusted as proxies for cloud state;
0.79 packages/alchemy/src/AWS/B2BI/TransformationEventSource.ts:175
     export const consumeTransformationEvents = <StreamReq = never, Req = never>(
0.79 packages/alchemy/src/Cli/commands/render.ts:11
     export const renderPlanning =
0.79 packages/alchemy/src/Cloudflare/Workers/DurableObjectStorage.ts:71
     const evaluate = (transaction: ActiveStorageTransaction) =>
0.79 packages/alchemy/src/Cloudflare/Workers/Sources/Vite.ts:262
     async function loadVite(projectRoot: string = initialCwd): Promise<ViteModule> {
0.79 packages/alchemy/src/Deploy.ts:47
     const deployStack = <A>({
0.79 packages/alchemy/src/Doppler/AuthProvider.ts:121
     .pipe(mapPromptCancellation, Effect.andThen(Effect.never));
0.79 packages/alchemy/src/Drizzle/D1.ts:49
     export const D1 = <
0.79 packages/alchemy/src/Fly/IpAssignment.ts:101
     });
0.79 packages/alchemy/src/Fly/SecretKey.ts:242
     const putKey = (input: {
0.79 packages/alchemy/src/Git/Protocol/Zlib.ts:301
     ): Effect.Effect<Uint8Array, ZlibError> =>
0.79 packages/alchemy/src/GitHub/Variables.ts:54
     export const Variables = ({
0.79 packages/alchemy/src/Hetzner/FloatingIp.ts:203
     const getById = (id: number) =>
0.79 packages/alchemy/src/Hetzner/actions.ts:69
     export const waitForAction = (
0.79 packages/alchemy/src/Prisma/Branch.ts:301
     : yield* Effect.gen(function* () {
0.79 packages/alchemy/src/Prisma/BucketAccessKey.ts:180
     }
0.79 packages/alchemy/src/Prisma/Project.ts:188
     const findProjectByName = (name: string) =>
0.79 packages/alchemy/src/Railway/Volume.ts:141
     const resolveVolumeProps = (
0.79 packages/alchemy/test/AWS/IAM/SigningCertificateTestLease.ts:11
     export const withSigningCertificateFixture = <A, E, R>(
0.79 packages/alchemy/test/Cloudflare/Container/fixtures/neonhost/object.ts:28
     const get = (path: string) =>
0.79 packages/alchemy/test/Local/fixtures/process-effect.ts:15
     export const waitForExit = (
0.79 packages/better-auth/src/Neon.ts:49
     const openPool = (
0.79 packages/frontend-frameworks/src/core/BuildChild.ts:108
     export const runBuildChild = (
0.79 packages/frontend-frameworks/src/vocs/neon.ts:61
     export const buildInChild = (config: { root: string }) =>
0.79 packages/frontend-frameworks/src/vocs/node.ts:124
     export const buildInChild = (config: VocsNodeBuildChildConfig) =>
0.78 packages/alchemy/src/AWS/ApiGatewayV2/ApiMapping.ts:100
     export const ApiMapping = (id: string, props: ApiMappingInputProps) =>
0.78 packages/alchemy/src/AWS/KinesisAnalyticsV2/Application.ts:624
     const waitForApplicationRunning = (applicationName: string) =>
0.78 packages/alchemy/src/AWS/Lambda/HttpServer.ts:307
     Effect.gen(function* () {
0.78 packages/alchemy/src/AWS/S3Files/internal.ts:28
     export const retryWhileConflict = <A, E extends { readonly _tag: string }, R>(
0.78 packages/alchemy/src/AWS/internal/BatchedSink.ts:90
     const attempt = (
0.78 packages/alchemy/src/Cloudflare/AI/Model.ts:77
     const observeModel = (accountId: string, modelName: string) =>
0.78 packages/alchemy/src/Cloudflare/Dlp/Entry.ts:245
     Effect.gen(function* () {
0.78 packages/alchemy/src/Cloudflare/VpcService/VpcService.ts:241
     return yield* Effect.fail(err as never);
0.78 packages/alchemy/src/Git/Operations.ts:227
     const resolveCached = (owner: string, repo: string) =>
0.78 packages/alchemy/src/Git/Server.ts:82
     const parseBearer = (
0.78 packages/alchemy/src/Hetzner/Server.ts:582
     const sshString = (data: Buffer | string) => {
0.78 packages/alchemy/src/Output.ts:101
     : [Extract<A, any[]>] extends [never]
0.78 packages/alchemy/src/TelemetryRuntime.ts:438
     export const provideProcessTelemetry =
0.78 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:32
     hello: () =>
0.78 packages/cloudflare-runtime/src/core/internal/internal-modules.ts:13
     export const formatExtensionModule = (self: {
0.78 packages/frontend-frameworks/src/core/Collector.ts:144
     Effect.gen(function* () {
0.77 packages/alchemy/src/AWS/Amplify/AppEventSource.ts:107
     Effect.gen(function* () {
0.77 packages/alchemy/src/AWS/ApiGateway/Stage.ts:191
     export const Stage = StageImpl;
0.77 packages/alchemy/src/AWS/DirectoryService/DirectoryEventSource.ts:79
     Effect.gen(function* () {
0.77 packages/alchemy/src/AWS/StepFunctions/StateMachine.ts:205
     });
0.77 packages/alchemy/src/Cloudflare/AI/LanguageModel.ts:502
     const nativeTextOf = (raw: unknown): string | undefined => {
0.77 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:281
     export const isSink = (value: unknown): value is Sink =>
0.77 packages/alchemy/src/Cloudflare/Workers/WorkerRuntime.ts:82
     waitUntil: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
0.77 packages/alchemy/src/Drizzle/Schema.ts:421
     const regenerate = (props: SchemaProps) =>
0.77 packages/alchemy/src/Fly/Secret.ts:262
     const listSecrets = (appName: string) =>
0.77 packages/alchemy/src/Neon/Migrations.ts:89
     export const runSql = (connectionUri: Redacted.Redacted<string>, sql: string) =>
0.77 packages/alchemy/src/Prisma/Internal/LogsClient.ts:122
     export const getDeploymentLogsRequest = (
0.77 packages/alchemy/src/SQL/D1.ts:53
     export const D1 = <E = never, R = never>(
0.77 packages/alchemy/src/Stripe/PaymentMethodDomain.ts:178
     const toAttrs = (
0.77 packages/alchemy/src/Telemetry/Metrics.ts:75
     export const recordResourceOp =
0.77 packages/alchemy/src/Util/layer-scoped.ts:11
     export const buildLayerScoped = <ROut, E, RIn>(
0.77 packages/alchemy/test/AWS/ElastiCache/Provisioned.DataPlane.handler.ts:16
     const valkeyRoundtrip = (
0.77 packages/alchemy/test/AWS/Lambda/fixtures/microvm/sandbox.ts:38
     fetch: Effect.gen(function* () {
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/worker-worker-binding/binding-target-worker.ts:16
     greet: (name: string) => Effect.succeed(`hello ${name}`),
0.77 packages/alchemy/test/Railway/fixtures/rpc-greeter.ts:23
     greet: (name: string) => Effect.succeed(`hello ${name}`),
0.77 packages/better-auth/src/SQLite.ts:10
     const open = (path: string): Effect.Effect<BunDatabase, never, Scope.Scope> =>
0.77 packages/frontend-frameworks/src/core/DevPort.ts:51
     export const resolveViteDevPort = (
0.76 packages/alchemy/src/AWS/ApiGatewayV2/Integration.ts:188
     const snapshotFromIntegration = (
0.76 packages/alchemy/src/AWS/EC2/RouteTable.ts:501
     Effect.gen(function* () {
0.76 packages/alchemy/src/AWS/VpcLattice/internal.ts:15
     export const retryOnConflict = <A, E extends { readonly _tag: string }, R>(
0.76 packages/alchemy/src/Auth/Demand.ts:361
     export const demandRemoteCredentials = (
0.76 packages/alchemy/src/Cli/exec.ts:257
     export const devKeepAlive = <A, E, R>(
0.76 packages/alchemy/src/Cloudflare/Access/Application.ts:792
     const findWarpApp = (accountId: string) =>
0.76 packages/alchemy/src/Cloudflare/EdgeSession.ts:62
     const createUploadToken = Effect.gen(function* () {
0.76 packages/alchemy/src/Cloudflare/Tunnel/Tunnel.ts:447
     });
0.76 packages/alchemy/src/Cloudflare/Workers/ConfigProvider.ts:15
     export const WorkerConfigProvider = () =>
0.76 packages/alchemy/src/Command/Command.ts:286
     const parseCommand = (
0.76 packages/alchemy/src/Fly/Bucket.ts:293
     const resolveBucketName = (
0.76 packages/alchemy/src/Hetzner/Volume.ts:247
     const getById = (id: number) =>
0.76 packages/alchemy/src/Railway/Redis.ts:441
     const waitForDeployment = (environmentId: string, serviceId: string) =>
0.76 packages/alchemy/src/Railway/transient.ts:28
     export const waitOutCreateRateLimit = <A, E, R>(
0.76 packages/alchemy/src/Test/Core.ts:625
     const sanitizeStackName = (name: string) =>
0.76 packages/alchemy/test/AWS/Route53Resolver/helpers.ts:48
     export const assertEndpointDeleting = (endpointId: string) =>
0.76 packages/alchemy/test/Cloudflare/Queue/fixtures/producer-routes.ts:34
     Effect.gen(function* () {
0.76 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:36
     const readD1 = (key: string) =>
0.76 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:101
     const event = (
0.76 packages/alchemy/test/Runtime/fixtures/managed-http-shutdown.ts:105
     const worker = (name: string, mode: string) =>
0.76 packages/frontend-frameworks/src/vinext/Modules.ts:10
     export const loadVinextModule = <T>(root: string, file: string) =>
0.76 packages/pkg/src/Registry/GitHub.ts:191
     Effect.gen(function* () {
0.75 packages/alchemy/src/AWS/ApiGatewayV2/Stage.ts:101
     never,
0.75 packages/alchemy/src/AWS/IoTFleetWise/internal.ts:37
     Effect.gen(function* () {
0.75 packages/alchemy/src/AWS/SQS/QueueEventSource.ts:54
     export function consumeQueueMessages<Q extends Queue, Req = never>(
0.75 packages/alchemy/src/Bundle/Bundle.ts:261
     export const watch = (
0.75 packages/alchemy/src/Bundle/InstalledPackages.ts:441
     const printBunBinaryLockfile = (
0.75 packages/alchemy/src/Cloudflare/MagicTransit/SiteWan.ts:309
     const getWan = (accountId: string, siteId: string, wanId: string) =>
0.75 packages/alchemy/src/Fly/Certificate.ts:397
     const replaceCustom = (
0.75 packages/alchemy/src/Fly/bluegreen.ts:102
     ) =>
0.75 packages/alchemy/src/Git/Store/Closure.ts:123
     const loadCommitNodes = (
0.75 packages/alchemy/src/Hetzner/LoadBalancer.ts:1171
     const syncProtection = (current: CloudLoadBalancer, desired: boolean) =>
0.75 packages/alchemy/src/Neon/Project.ts:724
     Effect.gen(function* () {
0.75 packages/alchemy/src/Prisma/Bucket.ts:130
     const listBuckets = () =>
0.75 packages/alchemy/src/Prisma/ORM/Postgres.ts:381
     transaction,
0.75 packages/alchemy/src/Prisma/Website/Waku.ts:46
     export const Waku = (id: string, props: WakuProps = {}) =>
0.75 packages/alchemy/src/Provider.ts:553
     Effect.gen(function* () {
0.75 packages/alchemy/src/Railway/Bind.ts:119
     const bindRpc = <Shape, Req = never>(
0.75 packages/alchemy/src/Railway/ConnectMySQLHttp.ts:95
     const fromEnv = (preferDirect: boolean) =>
0.75 packages/alchemy/src/Railway/rpc-server.ts:56
     export const serveRailwayRpc = <Req = never>(
0.75 packages/alchemy/test/AWS/ElastiCache/ProvisionedFixture.ts:32
     const deployNetwork = Effect.gen(function* () {
0.75 packages/alchemy/test/Cloudflare/Container/fixtures/neonhost/db.ts:10
     export const NeonHostProject = Effect.gen(function* () {
0.75 packages/alchemy/test/Cloudflare/Container/fixtures/reload/object.ts:16
     read: (path: string) =>
0.75 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:54
     hello: () =>
0.75 packages/frontend-frameworks/src/nextjs/node.ts:221
     Effect.gen(function* () {
0.75 packages/frontend-frameworks/src/nuxt/dev/host.ts:150
     Effect.gen(function* () {
0.75 packages/frontend-frameworks/src/octane/node.ts:174
     Effect.gen(function* () {
0.74 packages/alchemy/src/ACME/Pki.ts:141
     ): Effect.Effect<Redacted.Redacted<string>, PkiError> =>
0.74 packages/alchemy/src/AWS/EC2/InternetGateway.ts:465
     const findInternetGateway = (internetGatewayId: string) =>
0.74 packages/alchemy/src/AWS/KinesisVideo/internal.ts:245
     Effect.gen(function* () {
0.74 packages/alchemy/src/AWS/MQ/BrokerEventSource.ts:137
     export function consumeBrokerMessages<B extends Broker, Req = never>(
0.74 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:74
     Effect.gen(function* () {
0.74 packages/alchemy/src/Cloudflare/MagicTransit/SiteLan.ts:441
     const toAttributes = (
0.74 packages/alchemy/src/Cloudflare/RealtimeKit/App.ts:209
     const rest = yield* Effect.forEach(
0.74 packages/alchemy/src/Cloudflare/Workers/AIBinding.ts:44
     const tryPromise = <T>(
0.74 packages/alchemy/src/Git/GitHubCompat.ts:182
     const ghJson = (
0.74 packages/alchemy/src/Hetzner/SshKey.ts:101
     Effect.gen(function* () {
0.74 packages/alchemy/src/Http.ts:121
     const logUnreportedCause = (cause: Cause.Cause<unknown>) => {
0.74 packages/alchemy/src/InstanceId.ts:12
     export const generateInstanceId = () =>
0.74 packages/alchemy/src/Railway/Project.ts:281
     const findByName = (workspaceId: string, name: string) =>
0.74 packages/alchemy/test/AWS/Shield/handler.ts:23
     const errorTagged = <A, E extends { _tag: string }, R>(
0.74 packages/alchemy/test/Cloudflare/AI/fixtures/ChatBackend.ts:33
     send: (threadId: string, prompt: string) =>
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/wait-until/wait-until-worker.ts:19
     const append = (entry: string) =>
0.74 packages/alchemy/test/Fly/fixtures/idle-cadence-readiness.ts:142
     Effect.gen(function* () {
0.74 packages/frontend-frameworks/src/nuxt/node.ts:102
     export const buildInChild = (config: NuxtNodeBuildChildConfig) =>
0.74 packages/frontend-frameworks/src/octane/source.ts:216
     const sha256Stable = (input: unknown): Effect.Effect<string> =>
0.73 packages/alchemy/src/AWS/AppSync/ApiKey.ts:94
     export const ApiKey = (id: string, props: ApiKeyInputProps = {}) =>
0.73 packages/alchemy/src/AWS/AppSync/DataSource.ts:202
     const getDataSourceSafe = (apiId: string, name: string) =>
0.73 packages/alchemy/src/AWS/Batch/ComputeEnvironment.ts:401
     Effect.gen(function* () {
0.73 packages/alchemy/src/AWS/EC2/ClientVpnAuthorizationRule.ts:204
     Effect.gen(function* () {
0.73 packages/alchemy/src/AWS/EC2/VolumeAttachment.ts:341
     const waitForVolumeDetached = (
0.73 packages/alchemy/src/AWS/IAM/AccountAlias.ts:43
     const readAccountAlias = Effect.gen(function* () {
0.73 packages/alchemy/src/AWS/Kendra/SearchIndex.ts:302
     const waitForIndexStatus = (id: string, target: "ACTIVE" | "DELETED") =>
0.73 packages/alchemy/src/AWS/Rbin/Rule.ts:202
     const validateLock = (props: RuleProps) =>
0.73 packages/alchemy/src/AWS/Shield/ProtectionGroup.ts:301
     Effect.gen(function* () {
0.73 packages/alchemy/src/Cloudflare/DNS/ZoneTransferTsig.ts:228
     Effect.gen(function* () {
0.73 packages/alchemy/src/Cloudflare/Diagnostics/EndpointHealthcheck.ts:61
     never,
0.73 packages/alchemy/src/Cloudflare/Logs.ts:111
     const queryLogs = (opts: {
0.73 packages/alchemy/src/Cloudflare/MagicCloudNetworking/OnRamp.ts:524
     const sameIds = (observed: readonly string[], desired: readonly string[]) =>
0.73 packages/alchemy/src/Cloudflare/Ruleset/Ruleset.ts:149
     const name = yield* createRulesetName(id, news.name ?? output?.name);
0.73 packages/alchemy/src/Cloudflare/VpcService/VpcServiceLookup.ts:69
     export const lookup = (props: VpcServiceLookupProps) =>
0.73 packages/alchemy/src/Cloudflare/Workers/Sources/shared.ts:112
     Effect.gen(function* () {
0.73 packages/alchemy/src/Fly/Website/AssetDeployment.ts:106
     const withTigris = <A, E>(
0.73 packages/alchemy/src/Hetzner/Image.ts:262
     const toAttrs = (image: CloudImage): Image["Attributes"] => ({
0.73 packages/alchemy/src/Namespace.ts:25
     export function push(id: string, eff?: Effect.Effect<any, any, any>) {
0.73 packages/alchemy/src/Neon/FunctionRuntimeContext.ts:51
     Effect.gen(function* () {
0.73 packages/alchemy/src/Stripe/PaymentLink.ts:423
     const getById = (payment_link: string) =>
0.73 packages/alchemy/src/Telemetry/Attributes.ts:60
     const getOrCreateUserId: Effect.Effect<string> = Effect.gen(function* () {
0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/do-abort/abort-worker.ts:28
     ping: (fail = false) =>
0.73 packages/frontend-frameworks/src/vinext/source.ts:753
     collector.plugin as never,
0.72 packages/alchemy/src/AWS/AppSync/Resolver.ts:164
     export const Resolver = (id: string, props: ResolverInputProps) =>
0.72 packages/alchemy/src/AWS/DocDB/ClusterEventSource.ts:121
     export function consumeClusterChanges<TDoc = unknown, Req = never>(
0.72 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:741
     Effect.gen(function* () {
0.72 packages/alchemy/src/AWS/Firehose/DeliveryStream.ts:646
     const createRoleName = (id: string) =>
0.72 packages/alchemy/src/AWS/SageMaker/Cluster.ts:601
     Effect.gen(function* () {
0.72 packages/alchemy/src/AWS/SageMaker/Endpoint.ts:102
     const createEndpointName = (
0.72 packages/alchemy/src/Auth/AuthProvider.ts:162
     });
0.72 packages/alchemy/src/Cloudflare/Connectivity/DirectoryService.ts:424
     const getService = (accountId: string, serviceId: string) =>
0.72 packages/alchemy/src/Cloudflare/Gateway/ProxyEndpoint.ts:281
     accountId: string,
0.72 packages/alchemy/src/Cloudflare/Logpush/Job.ts:481
     const findByName = (scope: Scope, name: string, dataset: Dataset | undefined) =>
0.72 packages/alchemy/src/Cloudflare/SchemaValidation/Schema.ts:335
     const createSchemaName = (id: string, name: string | undefined) =>
0.72 packages/alchemy/src/Cloudflare/Workers/HttpServer.ts:30
     return Effect.gen(function* () {
0.72 packages/alchemy/src/Prisma/CustomDomain.ts:170
     const findDomain = (
0.72 packages/alchemy/src/Railway/AuthProvider.ts:201
     .pipe(mapPromptCancellation, Effect.andThen(Effect.never)),
0.72 packages/alchemy/src/Railway/Function.ts:633
     const hashSource = (source: string) =>
0.72 packages/alchemy/src/State/LocalState.ts:33
     export const makeLocalState = () =>
0.72 packages/alchemy/src/Stripe/AppsSecret.ts:210
     const findByName = (name: string, scope: AppsSecretScope) =>
0.72 packages/alchemy/src/Stripe/IssuingPersonalizationDesign.ts:283
     const idOf = (
0.72 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/sandbox.ts:55
     hello: (message: string) => Effect.succeed(`hello, ${message}!`),
0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/handoff-worker.ts:23
     ping: () => Effect.Effect<string, never, RuntimeContext>;
0.72 packages/alchemy/test/Railway/fixtures/rpc-query.ts:23
     fetch: Effect.gen(function* () {
0.72 packages/cloudflare-runtime/src/core/bindings/UnsafeEval.ts:5
     export const local = (binding: string): BindingHook =>
0.72 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:45
     const login = (domain: string) =>
0.72 packages/frontend-frameworks/src/astro/aws.ts:262
     });
0.72 packages/pkg/src/cli/pack.ts:364
     Effect.gen(function* () {
0.71 packages/alchemy/src/AWS/EC2/Subnet.ts:581
     list: () =>
0.71 packages/alchemy/src/AWS/EC2/Vpc.ts:361
     Effect.gen(function* () {
0.71 packages/alchemy/src/AWS/NetworkFirewall/internal.ts:27
     export const retryWhileNfwInUse = <A, E extends { readonly _tag: string }, R>(
0.71 packages/alchemy/src/Callback.ts:123
     export const makeCallback = <Payload, E, R>(
0.71 packages/alchemy/src/Cli/commands/errors.ts:77
     export const handleCancellation = <A, E, R>(self: Effect.Effect<A, E, R>) =>
0.71 packages/alchemy/src/Cloudflare/Containers/ContainerBundle.ts:178
     ): Effect.Effect<string | undefined> => {
0.71 packages/alchemy/src/Cloudflare/D1/LocalD1Gateway.ts:59
     const rawD1Binding = (databaseId: string): BindingHook =>
0.71 packages/alchemy/src/Cloudflare/DNS/Firewall.ts:491
     const sameIps = (observed: readonly string[], desired: readonly string[]) =>
0.71 packages/alchemy/src/Cloudflare/LoadBalancer/Pool.ts:366
     const findByName = (accountId: string, name: string) =>
0.71 packages/alchemy/src/Fly/leases.ts:86
     const check = Effect.gen(function* () {
0.71 packages/alchemy/src/Nuke.ts:289
     const attempt = (resource: Target) =>
0.71 packages/alchemy/src/Prisma/Website/Octane.ts:41
     export const Octane = (id: string, props: OctaneProps = {}) =>
0.71 packages/alchemy/src/Website/Server.ts:241
     Effect.tryPromise({
0.71 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/object.ts:28
     const get = (path: string) =>
0.71 packages/alchemy/test/Fly/fixtures/protocol-branches.ts:55
     export const reconcile = Effect.gen(function* () {
0.71 packages/alchemy/test/types/Sandbox.ts:32
     fetch: Effect.gen(function* () {
0.71 packages/cloudflare-runtime/src/core/Docker.ts:462
     const list = (ancestor: string) =>
0.71 packages/cloudflare-runtime/src/core/globals/Globals.ts:48
     const cronLoop = (
0.71 packages/frontend-frameworks/src/sveltekit/aws.ts:303
     build: (context) =>
```
