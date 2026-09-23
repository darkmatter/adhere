# basics/external-calls-are-resilient

A call over the network, such as an HTTP request, a database query, or a third-party API, must carry a timeout and a retry schedule. Calls through the platform FileSystem and Path services are local and are not in scope.

The preset words it differently now: A call over the network, such as an HTTP request, a database query, or a third-party API, must be made with a timeout and a retry schedule, never bare. Calls through the platform FileSystem and Path services are local and are not in scope.

1,825 findings, from 0.96 down to 0.71. Each showed this hint:

```ts
const retryPolicy = Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)));

const resilientCall = HttpClient.get("https://api.example.com/users").pipe(
  Effect.timeout("2 seconds"),
  Effect.retry(retryPolicy),
  Effect.timeout("10 seconds"),
);
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.96 packages/alchemy/src/Cloudflare/D1/CloneDatabase.ts:27
     .execute(HttpClientRequest.get(exportResult.signedUrl))
0.96 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:64
     const res = yield* client.execute(req).pipe(Effect.orDie);
0.96 packages/alchemy/src/Railway/Up.ts:88
     const response = yield* http.execute(request);
0.96 packages/alchemy/test/AWS/Local/fixtures/raw.ts:41
     return yield* client.execute(
0.95 packages/alchemy/src/AWS/AppSync/GraphQLHttp.ts:95
     fetch(signed.url, {
0.95 packages/alchemy/src/Git/Jobs/Import.ts:334
     const response = yield* client
0.95 packages/alchemy/src/GitHub/Collaborator.ts:152
     await octokit.rest.repos.addCollaborator({
0.95 packages/alchemy/src/GitHub/Label.ts:261
     octokit.rest.issues.createLabel({
0.95 packages/alchemy/src/GitHub/PullRequest.ts:362
     octokit.graphql(
0.95 packages/alchemy/src/GitHub/TeamAccess.ts:170
     await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
0.95 packages/alchemy/src/GitHub/Webhook.ts:261
     octokit.rest.repos.listWebhooks,
0.95 packages/alchemy/test/AWS/Lambda/init-io-probe.ts:28
     const response = yield* client.get(
0.95 packages/alchemy/test/Local/fixtures/rpc-spawner-commands.ts:30
     .post(spawner.url, {
0.95 packages/alchemy/test/Local/fixtures/rpc-spawner-parent.ts:26
     const res = yield* http
0.95 packages/alchemy/test/types/Agent.ts:117
     HttpClientRequest.post("/eval", {
0.95 packages/cloudflare-runtime/src/rolldown/test/fixtures/regression/mysql2.ts:10
     const result = db.execute("SELECT 1");
0.95 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:18
     const result = yield* client`SELECT 1`;
0.94 packages/alchemy/src/AWS/AMP/BindingHttp.ts:184
     fetch(signed.url, {
0.94 packages/alchemy/src/AWS/FraudDetector/internal.ts:20
     .listTagsForResource({ resourceARN: arn })
0.94 packages/alchemy/src/AWS/OSIS/BindingHttp.ts:236
     fetch(signed.url, {
0.94 packages/alchemy/src/AWS/OpenSearch/DataPlaneHttp.ts:182
     }),
0.94 packages/alchemy/src/AWS/Translate/internal.ts:20
     .listTagsForResource({ ResourceArn: arn })
0.94 packages/alchemy/src/Cloudflare/ApiShield/Configuration.ts:181
     const observed = yield* apiGateway.getConfiguration({ zoneId }).pipe(
0.94 packages/alchemy/src/Cloudflare/RealtimeKit/Webhook.ts:183
     const observed = yield* getWebhook(acct, appId, output.webhookId);
0.94 packages/alchemy/src/GitHub/BranchProtection.ts:424
     octokit.rest.repos.updateBranchProtection({
0.94 packages/alchemy/src/GitHub/Comment.ts:199
     const { data } = await octokit.rest.issues.getComment({
0.94 packages/alchemy/src/GitHub/Environment.ts:281
     const { data } = await octokit.rest.repos.createOrUpdateEnvironment({
0.94 packages/alchemy/src/GitHub/Issue.ts:281
     octokit.rest.issues.update({
0.94 packages/alchemy/src/GitHub/Milestone.ts:283
     octokit.rest.issues.createMilestone({
0.94 packages/alchemy/src/GitHub/Release.ts:321
     owner: news.owner,
0.94 packages/alchemy/src/GitHub/Repository.ts:663
     const { data } = await octokit.request("GET /repositories/{id}", {
0.94 packages/alchemy/src/GitHub/Ruleset.ts:482
     octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
0.94 packages/alchemy/src/GitHub/Variable.ts:181
     const observed = yield* getVariable(news);
0.94 packages/alchemy/src/Hetzner/Catalog.ts:34
     .getLocation({ id })
0.94 packages/alchemy/src/Local/RpcProviderProxy.ts:51
     const response = yield* client.post(spawnerUrl, {
0.94 packages/alchemy/src/Neon/LanguageModel.ts:149
     const response = yield* send(options, false);
0.94 packages/alchemy/src/Neon/QueryDataApi.ts:108
     return yield* http
0.94 packages/alchemy/test/AWS/Lambda/fixtures/otel-handler.ts:52
     fetch(`${endpoint}/v1/probe`, {
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:38
     const response = yield* conn.fetch(
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/external/object.ts:35
     HttpClientRequest.get("http://container/"),
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/isolated/object.ts:21
     HttpClientRequest.get("http://container/"),
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/object.ts:30
     const response = yield* fetch(
0.94 packages/alchemy/test/Cloudflare/Container/fixtures/reload/object.ts:18
     const response = yield* fetch(
0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/fetch-binding/fetch-caller.ts:31
     HttpClientRequest.get("https://target/").pipe(
0.94 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-traced-worker.ts:47
     fetch(`${endpoint}/v1/traces`, {
0.94 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:45
     const response = yield* client.execute(
0.94 packages/alchemy/test/Neon/fixtures/StorageNative.ts:43
     return client.fetch(url);
0.94 packages/alchemy/test/Prisma/Website/Fixture.ts:29
     const response = yield* HttpClient.get(url);
0.94 packages/alchemy/test/Railway/fixtures/async-postgres.ts:16
     const result = await client.query("select 1 as ok");
0.94 packages/pkg/src/Registry/Tags.ts:35
     yield* sql`SELECT * FROM tags WHERE package = ${pkg} AND tag = ${tag}`,
0.93 packages/alchemy/src/AWS/AMP/RemoteWriteHttp.ts:31
     yield* send({
0.93 packages/alchemy/src/AWS/AppFlow/internal.ts:23
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/Athena/PreparedStatement.ts:104
     .getPreparedStatement({
0.93 packages/alchemy/src/AWS/B2BI/internal.ts:33
     .listTagsForResource({ ResourceARN: arn })
0.93 packages/alchemy/src/AWS/BackupSearch/internal.ts:24
     .listTagsForResource({ ResourceArn: arn })
0.93 packages/alchemy/src/AWS/CodeConnections/internal.ts:34
     return yield* codeconnections.listTagsForResource({ ResourceArn: arn }).pipe(
0.93 packages/alchemy/src/AWS/DAX/internal.ts:28
     .listTags({ ResourceName: arn })
0.93 packages/alchemy/src/AWS/DataExchange/internal.ts:24
     .listTagsForResource({ ResourceArn: arn })
0.93 packages/alchemy/src/AWS/DirectoryService/EventTopic.ts:73
     const response = yield* ds
0.93 packages/alchemy/src/AWS/Grafana/internal.ts:32
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/IAM/LoginProfile.ts:98
     .getLoginProfile({ UserName: news.userName })
0.93 packages/alchemy/src/AWS/IoT/Thing.ts:91
     .describeThing({ thingName })
0.93 packages/alchemy/src/AWS/IoTSiteWise/internal.ts:11
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/Lambda/RuntimeExtension.ts:31
     const registration = await fetch(`${base}/register`, {
0.93 packages/alchemy/src/AWS/MediaConvert/internal.ts:24
     .listTagsForResource({ Arn: arn })
0.93 packages/alchemy/src/AWS/Neptune/DBSubnetGroup.ts:83
     const response = yield* neptune
0.93 packages/alchemy/src/AWS/NetworkFirewall/LoggingConfiguration.ts:86
     const response = yield* nfw.describeLoggingConfiguration({
0.93 packages/alchemy/src/AWS/Omics/internal.ts:14
     return yield* omics.listTagsForResource({ resourceArn }).pipe(
0.93 packages/alchemy/src/AWS/Personalize/internal.ts:32
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/RedshiftServerless/internal.ts:36
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/RolesAnywhere/internal.ts:31
     .listTagsForResource({ resourceArn: arn })
0.93 packages/alchemy/src/AWS/Shield/ProtectionGroup.ts:226
     let group = yield* observeGroup(groupId);
0.93 packages/alchemy/src/Axiom/Notifier.ts:92
     const notifiers = yield* listNotifiers({});
0.93 packages/alchemy/src/Cloudflare/AI/LanguageModel.ts:107
     const resp = yield* callRaw(body, "generateText");
0.93 packages/alchemy/src/Cloudflare/Access/CustomPage.ts:241
     yield* zeroTrust
0.93 packages/alchemy/src/Cloudflare/Argo/SmartRouting.ts:184
     const observed = yield* argo.getSmartRouting({ zoneId });
0.93 packages/alchemy/src/Cloudflare/Email/ImpersonationRegistryEntry.ts:193
     const created = yield* emailSecurity.createSettingImpersonationRegistry(
0.93 packages/alchemy/src/Cloudflare/Email/TrustedDomain.ts:161
     const observed = yield* getTrustedDomain(acct, output.trustedDomainId);
0.93 packages/alchemy/src/Cloudflare/Logs.ts:122
     queryTelemetry({
0.93 packages/alchemy/src/Cloudflare/LogsControl/RetentionFlag.ts:164
     .getControlRetention({ zoneId })
0.93 packages/alchemy/src/Cloudflare/MagicTransit/Site.ts:281
     magicTransit.listSites({ accountId }).pipe(
0.93 packages/alchemy/src/Cloudflare/MagicTransit/SiteLan.ts:343
     const siteIds = yield* magicTransit.listSites.pages({ accountId }).pipe(
0.93 packages/alchemy/src/Cloudflare/Organization/Organization.ts:209
     organizations.listOrganizations.pages({}).pipe(
0.93 packages/alchemy/src/Cloudflare/PageShield/Settings.ts:207
     const observed = yield* pageShield.getPageShield({ zoneId });
0.93 packages/alchemy/src/Cloudflare/RealtimeKit/App.ts:141
     const created = yield* realtimeKit.postApp({ accountId, name });
0.93 packages/alchemy/src/Cloudflare/Vectorize/VectorizeIndex.ts:281
     preset: news.preset as never,
0.93 packages/alchemy/src/Cloudflare/Zaraz/Config.ts:343
     const fromAttributes = (attrs: ConfigAttributes): ConfigResponse => ({
0.93 packages/alchemy/src/Cloudflare/Zone/CustomNameservers.ts:207
     const observed = yield* zones.getCustomNameserver({ zoneId });
0.93 packages/alchemy/src/Fly/Website/AssetDeployment.ts:163
     s3.listObjectsV2
0.93 packages/alchemy/src/Git/Hasher/Hasher.ts:346
     const next = yield* send(
0.93 packages/alchemy/src/Git/Hasher/Lambda.ts:47
     const response = yield* invoke({
0.93 packages/alchemy/src/GitHub/Secret.ts:281
     await octokit.rest.actions.deleteRepoSecret({
0.93 packages/alchemy/src/Neon/InvokeFunctionHttp.ts:68
     fetch(target, {
0.93 packages/alchemy/src/Neon/OrganizationMemberRole.ts:217
     const response = yield* Neon.getOrganizationMembers({
0.93 packages/alchemy/src/Prisma/Internal/DeploymentIdentity.ts:20
     const page = yield* getServiceDeployments(
0.93 packages/alchemy/src/SQL/Migrations/Introspect.ts:23
     .query(`PRAGMA table_info(${quoteIdentifier(table, "sqlite")});`)
0.93 packages/alchemy/src/SQL/Migrations/MySQLExecutor.ts:22
     .query(sql, params ? [...params] : undefined)
0.93 packages/alchemy/src/SQL/Migrations/PgExecutor.ts:19
     .query(sql, (params ?? []) as unknown[])
0.93 packages/alchemy/test/AWS/DynamoDB/handler.ts:62
     const putItem = yield* DynamoDB.PutItem(sourceTable);
0.93 packages/alchemy/test/AWS/ECS/reclaimTaskDefinitionFamily.ts:23
     .listTaskDefinitions({ familyPrefix: family, status })
0.93 packages/alchemy/test/AWS/PaymentCryptography/reapKeys.ts:26
     const keys = yield* paymentcryptography.listKeys.items({}).pipe(
0.93 packages/alchemy/test/Cloudflare/Container/fixtures/neonhost/object.ts:30
     const response = yield* fetch(
0.93 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:19
     const response = await fetch("/api/widgets");
0.93 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/platform-worker.ts:33
     userWorker.fetch(
0.93 packages/alchemy/test/Local/fixtures/rpc-spawner-devserver-parent.ts:43
     .pipe(Effect.flatMap((res) => res.text));
0.93 packages/alchemy/test/Planetscale/MySQL/fixtures/hyperdrive-worker.ts:42
     const widgets = yield* db.select().from(Widgets);
0.93 packages/alchemy/test/Railway/fixtures/postgres-fn.ts:30
     fetch: db.execute("select 1 as ok", "objects").pipe(
0.93 packages/cloudflare-runtime/src/core/registry/RegistryProxy.ts:240
     }),
0.93 packages/cloudflare-runtime/src/vite/websockets.ts:57
     const upstream = NodeHttp.request({
0.92 packages/alchemy/scripts/cleanup-neon-projects.ts:90
     Layer.succeed(Retry.Retry, { while: () => false }),
0.92 packages/alchemy/src/AWS/AppConfig/GetConfigurationHttp.ts:123
     const response = yield* getLatest({
0.92 packages/alchemy/src/AWS/AppFlow/ConnectorProfile.ts:100
     .describeConnectorProfiles({ connectorProfileNames: [name] })
0.92 packages/alchemy/src/AWS/AppFlow/Flow.ts:142
     .describeFlow({ flowName: name })
0.92 packages/alchemy/src/AWS/AppRunner/internal.ts:35
     .listTagsForResource({ ResourceArn: arn })
0.92 packages/alchemy/src/AWS/ApplicationSignals/GroupingConfiguration.ts:117
     const observe = appsignals.listGroupingAttributeDefinitions({}).pipe(
0.92 packages/alchemy/src/AWS/Athena/NamedQuery.ts:117
     athena.getNamedQuery({ NamedQueryId: namedQueryId }).pipe(
0.92 packages/alchemy/src/AWS/B2BI/Partnership.ts:68
     never,
0.92 packages/alchemy/src/AWS/BedrockDataAutomation/internal.ts:36
     .listTagsForResource({ resourceARN })
0.92 packages/alchemy/src/AWS/CloudFront/KeyValueStore.ts:83
     const store = yield* cloudfront.listKeyValueStores.pages({}).pipe(
0.92 packages/alchemy/src/AWS/CloudFront/ResponseHeadersPolicy.ts:142
     .getResponseHeadersPolicyConfig({ Id: id })
0.92 packages/alchemy/src/AWS/CloudHSMV2/internal.ts:25
     const response = yield* cloudhsm.describeClusters({
0.92 packages/alchemy/src/AWS/Cognito/Group.ts:98
     .getGroup({ UserPoolId: userPoolId, GroupName: groupName })
0.92 packages/alchemy/src/AWS/Cognito/IdentityProvider.ts:161
     .describeIdentityProvider({
0.92 packages/alchemy/src/AWS/Cognito/User.ts:235
     yield* cip.adminDeleteUserAttributes({
0.92 packages/alchemy/src/AWS/ControlTower/internal.ts:14
     controltower.listTagsForResource({ resourceArn }).pipe(
0.92 packages/alchemy/src/AWS/DocDB/DBSubnetGroup.ts:83
     const response = yield* docdb
0.92 packages/alchemy/src/AWS/ElastiCache/internal.ts:19
     .listTagsForResource({ ResourceName: arn })
0.92 packages/alchemy/src/AWS/FIS/TargetAccountConfiguration.ts:99
     .getTargetAccountConfiguration({ experimentTemplateId, accountId })
0.92 packages/alchemy/src/AWS/FinSpace/KxDatabase.ts:62
     never,
0.92 packages/alchemy/src/AWS/IAM/AccountAlias.ts:44
     const response = yield* iam.listAccountAliases({});
0.92 packages/alchemy/src/AWS/IAM/SSHPublicKey.ts:85
     .getSSHPublicKey({
0.92 packages/alchemy/src/AWS/IAM/ServerCertificate.ts:193
     const existing = yield* readCertificate(name);
0.92 packages/alchemy/src/AWS/IoT/internal.ts:19
     .listTagsForResource({ resourceArn })
0.92 packages/alchemy/src/AWS/IoTWireless/internal.ts:11
     iotw.listTagsForResource({ ResourceArn: arn }).pipe(
0.92 packages/alchemy/src/AWS/Location/TrackerConsumer.ts:76
     const consumerArns = yield* location.listTrackerConsumers
0.92 packages/alchemy/src/AWS/MediaConvert/Job.ts:113
     .getJob({ Id: id })
0.92 packages/alchemy/src/AWS/MediaConvert/JobTemplate.ts:144
     .getJobTemplate({ Name: name })
0.92 packages/alchemy/src/AWS/MediaConvert/Preset.ts:114
     .getPreset({ Name: name })
0.92 packages/alchemy/src/AWS/MemoryDB/internal.ts:27
     .listTags({ ResourceArn: arn })
0.92 packages/alchemy/src/AWS/Notifications/internal.ts:24
     notifications.listTagsForResource({ arn }).pipe(
0.92 packages/alchemy/src/AWS/QuickSight/Analysis.ts:214
     yield* quicksight.updateAnalysis({
0.92 packages/alchemy/src/AWS/QuickSight/Dashboard.ts:201
     .createDashboard({
0.92 packages/alchemy/src/AWS/QuickSight/DataSet.ts:146
     .describeDataSet({ AwsAccountId: accountId, DataSetId: dataSetId })
0.92 packages/alchemy/src/AWS/RDS/DBClusterEndpoint.ts:148
     const response = yield* rds
0.92 packages/alchemy/src/AWS/RDS/DBClusterParameterGroup.ts:121
     rds.describeDBClusterParameterGroups.pages({}).pipe(
0.92 packages/alchemy/src/AWS/RDS/DBProxyTargetGroup.ts:161
     .describeDBProxyTargets({
0.92 packages/alchemy/src/AWS/RDS/DBSubnetGroup.ts:281
     Effect.catchTag("DBSubnetGroupNotFoundFault", () => Effect.void),
0.92 packages/alchemy/src/AWS/Route53/VpcAssociationAuthorization.ts:43
     never,
0.92 packages/alchemy/src/AWS/SES/TenantResourceAssociation.ts:109
     const pages = yield* sesv2.listTenantResources
0.92 packages/alchemy/src/AWS/Schemas/internal.ts:11
     .listTagsForResource({ ResourceArn: resourceArn })
0.92 packages/alchemy/src/AWS/SecurityHub/FindingAggregator.ts:84
     securityhub.getFindingAggregator({ FindingAggregatorArn: arn }).pipe(
0.92 packages/alchemy/src/AWS/SecurityHub/Insight.ts:85
     securityhub.getInsights({ InsightArns: [arn] }).pipe(
0.92 packages/alchemy/src/AWS/ServiceQuotas/ServiceQuotaIncreaseRequest.ts:381
     );
0.92 packages/alchemy/src/AWS/Shield/Protection.ts:221
     yield* shield.enableApplicationLayerAutomaticResponse({
0.92 packages/alchemy/src/AWS/Timestream/Database.ts:121
     TSW.describeDatabase({ DatabaseName: databaseName }),
0.92 packages/alchemy/src/AWS/Timestream/Table.ts:401
     yield* withWriteEndpoint(
0.92 packages/alchemy/src/AWS/Transfer/User.ts:143
     .listTagsForResource({ Arn: arn })
0.92 packages/alchemy/src/AWS/VpcLattice/AuthPolicy.ts:99
     vpclattice.getAuthPolicy({ resourceIdentifier }).pipe(
0.92 packages/alchemy/src/AWS/VpcLattice/ResourcePolicy.ts:88
     vpclattice.getResourcePolicy({ resourceArn }).pipe(
0.92 packages/alchemy/src/Axiom/Annotation.ts:13
     never,
0.92 packages/alchemy/src/Axiom/Dashboard.ts:126
     const create = yield* Axiom.createDashboard;
0.92 packages/alchemy/src/Cloudflare/AI/Evaluation.ts:213
     ? yield* getEvaluation(
0.92 packages/alchemy/src/Cloudflare/AI/Model.ts:79
     .getModelSchema({ accountId, model: modelName })
0.92 packages/alchemy/src/Cloudflare/AI/SearchHttpClient.ts:301
     Effect.die(
0.92 packages/alchemy/src/Cloudflare/Access/InfrastructureTarget.ts:209
     observed = yield* zeroTrust.createAccessInfrastructureTarget({
0.92 packages/alchemy/src/Cloudflare/Access/McpPortal.ts:261
     .readAccessAiControlMcpPortal({ accountId, id })
0.92 packages/alchemy/src/Cloudflare/Access/Tag.ts:84
     return yield* zeroTrust.listAccessTags.pages({ accountId }).pipe(
0.92 packages/alchemy/src/Cloudflare/Addressing/ServiceBinding.ts:234
     .getPrefixServiceBinding({ accountId, prefixId, bindingId })
0.92 packages/alchemy/src/Cloudflare/Argo/TieredCaching.ts:122
     argo.getTieredCaching({ zoneId }).pipe(
0.92 packages/alchemy/src/Cloudflare/ClientCertificate/ClientCertificate.ts:381
     clientCertificates.listClientCertificates
0.92 packages/alchemy/src/Cloudflare/CloudforceOne/ScanConfig.ts:143
     return yield* cloudforceOne.listScanConfigs.pages({ accountId }).pipe(
0.92 packages/alchemy/src/Cloudflare/ContentScanning/ContentScanning.ts:182
     const observed = yield* contentScanning.getContentScanning({ zoneId });
0.92 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:40
     const data = yield* exportDb({
0.92 packages/alchemy/src/Cloudflare/D1/LocalD1Gateway.ts:100
     const response = await raw.fetch("http://d1/query", {
0.92 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:82
     d1.queryDatabase({
0.92 packages/alchemy/src/Cloudflare/DNS/ZoneTransferOutgoing.ts:261
     .getZoneTransferOutgoing({ zoneId })
0.92 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionRule.ts:264
     yield* ddos
0.92 packages/alchemy/src/Cloudflare/Dlp/Entry.ts:235
     zeroTrust.getDlpEntryCustom({ accountId, entryId }).pipe(
0.92 packages/alchemy/src/Cloudflare/Email/Routing.ts:101
     emailRouting.getEmailRouting({ zoneId }).pipe(
0.92 packages/alchemy/src/Cloudflare/GoogleTagGateway/GoogleTagGateway.ts:216
     const response = yield* googleTagGateway.getConfig({ zoneId });
0.92 packages/alchemy/src/Cloudflare/HostnameTlsSetting/HostnameTlsSetting.ts:182
     .listSettingsTls({ zoneId: zone.id, settingId })
0.92 packages/alchemy/src/Cloudflare/Iam/UserGroup.ts:276
     iam.getUserGroup({ accountId, userGroupId }).pipe(
0.92 packages/alchemy/src/Cloudflare/MagicCloudNetworking/OnRamp.ts:341
     observed = yield* mcn.createOnRamp({
0.92 packages/alchemy/src/Cloudflare/MtlsCertificate/MtlsCertificate.ts:263
     .getMtlsCertificate({
0.92 packages/alchemy/src/Cloudflare/RealtimeKit/Preset.ts:561
     : Effect.succeed(undefined),
0.92 packages/alchemy/src/Cloudflare/ResourceSharing/Share.ts:266
     const created = yield* resourceSharing.createResourceSharing({
0.92 packages/alchemy/src/Cloudflare/SchemaValidation/Settings.ts:141
     Effect.catchTag("Forbidden", () => Effect.succeed(undefined)),
0.92 packages/alchemy/src/Cloudflare/Stream/Webhook.ts:144
     const updated = yield* stream.putWebhook({
0.92 packages/alchemy/src/Cloudflare/Tunnel/WarpConnector.ts:194
     .createTunnelWarpConnector({ accountId, name })
0.92 packages/alchemy/src/Cloudflare/Vectorize/VectorizeMetadataIndex.ts:45
     never,
0.92 packages/alchemy/src/Cloudflare/VpcService/VpcService.ts:243
     return yield* connectivity.updateDirectoryService({
0.92 packages/alchemy/src/Cloudflare/VulnerabilityScanner/TargetEnvironment.ts:242
     .getTargetEnvironment({ accountId, targetEnvironmentId })
0.92 packages/alchemy/src/Cloudflare/Web3/ContentList.ts:301
     const entries = yield* web3.listHostnameIpfsUniversalPathContentListEntries(
0.92 packages/alchemy/src/Cloudflare/Web3/Hostname.ts:262
     const created = yield* web3.createHostname({
0.92 packages/alchemy/src/Cloudflare/Workers/Fetch.ts:100
     fetcher.fetch(
0.92 packages/alchemy/src/Cloudflare/Zone/Zone.ts:309
     const final = yield* zones.getZone({ zoneId });
0.92 packages/alchemy/src/Hetzner/SshKey.ts:127
     Hetzner.sshKeys.getSshKey({ id }).pipe(
0.92 packages/alchemy/src/Neon/AuthTrustedDomain.ts:55
     Neon.listBranchNeonAuthTrustedDomains(authRequest(scope)).pipe(
0.92 packages/alchemy/src/Neon/BranchScope.ts:57
     const page = yield* listProjectBranches({ project_id: projectId, cursor });
0.92 packages/alchemy/src/Neon/Migrations.ts:92
     try: () => client.query(sql),
0.92 packages/alchemy/src/Neon/Storage.ts:70
     provide(S3.getObject({ Bucket: bucket, Key: key })).pipe(
0.92 packages/alchemy/src/Planetscale/MySQL/MySQLPassword.ts:182
     .getPassword({
0.92 packages/alchemy/src/Planetscale/Postgres/PostgresDefaultRole.ts:182
     .pipe(Effect.catchTag("NotFound", () => Effect.succeed(undefined)));
0.92 packages/alchemy/src/Rpc.ts:531
     const value = yield* response.json.pipe(
0.92 packages/alchemy/src/Stripe/ApplePayDomain.ts:42
     never,
0.92 packages/alchemy/src/Stripe/CustomerTaxId.ts:153
     const response = yield* GetCustomerTaxIds({
0.92 packages/alchemy/src/Stripe/PaymentMethodDomain.ts:208
     const response = yield* GetPaymentMethodDomains({
0.92 packages/alchemy/src/Stripe/ProductFeature.ts:122
     const response = yield* GetProductFeatures({
0.92 packages/alchemy/src/Stripe/RadarValueList.ts:351
     current = yield* CreateRadarValueList({
0.92 packages/alchemy/src/Stripe/RadarValueListItem.ts:124
     const response = yield* GetRadarValueListItems({
0.92 packages/alchemy/src/Stripe/TerminalReader.ts:206
     GetTerminalReader({ reader }).pipe(
0.92 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:35
     HttpClientRequest.get("http://container/"),
0.92 packages/alchemy/test/Cloudflare/Container/fixtures/restart/object.ts:32
     HttpClientRequest.get("http://container/exit"),
0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/init-io/worker.ts:30
     const response = yield* client.get(
0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/worker.ts:38
     const widget = yield* db.orm.public.Widget.create({ name }).pipe(
0.92 packages/alchemy/test/Fly/fixtures/multi-container-http.ts:18
     const proxy = http.get("http://127.0.0.1:3001/hold", (upstream) => {
0.92 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:42
     const widgets = yield* db.select().from(Widgets);
0.92 packages/cloudflare-runtime/src/core/bindings/assets/assets-kv.worker.ts:25
     const response = await env.ASSETS_FILES.fetch(
0.92 packages/cloudflare-runtime/src/core/bindings/secrets-store/SecretsStoreSecret.worker.ts:34
     const response = await this.env[BINDING_SECRETS_STORE_STORE].fetch(
0.92 packages/cloudflare-runtime/src/core/globals/Globals.ts:60
     fetch(url, { method: "POST" }),
0.92 packages/cloudflare-runtime/src/core/platform-proxy/connect.ts:481
     method: "POST",
0.92 packages/frontend-frameworks/fixtures/sveltekit-spa/src/routes/widgets/+page.ts:16
     const response = await fetch("/api/widgets");
0.92 packages/frontend-frameworks/src/astro/runtime/entrypoints/image-passthrough-endpoint.ts:34
     response = await fetchWithRedirects({
0.92 packages/pkg/src/cli/publish.ts:82
     const result = yield* client.Registry.uploadTarball({
0.91 packages/alchemy/src/AWS/ACMPCA/CertificateAuthorityPolicy.ts:93
     acmpca.getPolicy({ ResourceArn: certificateAuthorityArn }).pipe(
0.91 packages/alchemy/src/AWS/AMP/GetSeriesHttp.ts:13
     send({
0.91 packages/alchemy/src/AWS/ApiGateway/UsagePlanKey.ts:103
     .getUsagePlanKey({ usagePlanId, keyId })
0.91 packages/alchemy/src/AWS/AppConfig/internal.ts:93
     .listTagsForResource({ ResourceArn: arn })
0.91 packages/alchemy/src/AWS/AppIntegrations/Application.ts:123
     .getApplication({ Arn: arnOrId })
0.91 packages/alchemy/src/AWS/AppRegistry/Application.ts:94
     .getApplication({ application: specifier })
0.91 packages/alchemy/src/AWS/AppRegistry/AttributeGroupAssociation.ts:36
     never,
0.91 packages/alchemy/src/AWS/ApplicationSignals/InstrumentationConfiguration.ts:223
     .getInstrumentationConfiguration({
0.91 packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts:258
     yield* autoscaling.putScalingPolicy({
0.91 packages/alchemy/src/AWS/B2BI/Profile.ts:70
     never,
0.91 packages/alchemy/src/AWS/CloudFront/CachePolicy.ts:313
     yield* cloudfront
0.91 packages/alchemy/src/AWS/CloudFront/OriginAccessControl.ts:302
     yield* cloudfront
0.91 packages/alchemy/src/AWS/CloudFront/OriginRequestPolicy.ts:104
     .getOriginRequestPolicyConfig({ Id: id })
0.91 packages/alchemy/src/AWS/CodeConnections/Host.ts:277
     yield* codeconnections.updateHost({
0.91 packages/alchemy/src/AWS/CodeConnections/SyncConfiguration.ts:221
     getByIdentity(syncType, news.resourceName).pipe(
0.91 packages/alchemy/src/AWS/Cognito/ResourceServer.ts:52
     never,
0.91 packages/alchemy/src/AWS/Config/AggregationAuthorization.ts:86
     return yield* config.describeAggregationAuthorizations.items({}).pipe(
0.91 packages/alchemy/src/AWS/DAX/ParameterGroup.ts:91
     .describeParameterGroups({ ParameterGroupNames: [name] })
0.91 packages/alchemy/src/AWS/DMS/Endpoint.ts:361
     yield* dms
0.91 packages/alchemy/src/AWS/DSQL/ClusterPolicy.ts:177
     const updated = yield* dsql.putClusterPolicy({
0.91 packages/alchemy/src/AWS/DirectoryService/internal.ts:28
     const tags = yield* ds.listTagsForResource
0.91 packages/alchemy/src/AWS/ECRPublic/Repository.ts:381
     yield* pin(
0.91 packages/alchemy/src/AWS/EKS/PodIdentityAssociation.ts:401
     const response = yield* eks.listPodIdentityAssociations({
0.91 packages/alchemy/src/AWS/EMR/SecurityConfiguration.ts:135
     .describeSecurityConfiguration({ Name: name })
0.91 packages/alchemy/src/AWS/ElastiCache/SubnetGroup.ts:66
     .describeCacheSubnetGroups({ CacheSubnetGroupName: name })
0.91 packages/alchemy/src/AWS/EventBridge/Permission.ts:92
     const page = yield* eventbridge.listEventBuses({
0.91 packages/alchemy/src/AWS/Forecast/internal.ts:30
     .listTagsForResource({ ResourceArn: arn })
0.91 packages/alchemy/src/AWS/FraudDetector/Detector.ts:122
     .getDetectors({ detectorId })
0.91 packages/alchemy/src/AWS/FraudDetector/EntityType.ts:77
     .getEntityTypes({ name })
0.91 packages/alchemy/src/AWS/FraudDetector/EventType.ts:102
     .getEventTypes({ name })
0.91 packages/alchemy/src/AWS/FraudDetector/Label.ts:74
     .getLabels({ name })
0.91 packages/alchemy/src/AWS/IAM/AccountPasswordPolicy.ts:57
     .getAccountPasswordPolicy({})
0.91 packages/alchemy/src/AWS/IAM/Group.ts:421
     .pipe(Effect.catchTag("NoSuchEntityException", () => Effect.void));
0.91 packages/alchemy/src/AWS/IAM/GroupMembership.ts:30
     never,
0.91 packages/alchemy/src/AWS/IAM/InstanceProfile.ts:121
     yield* iam
0.91 packages/alchemy/src/AWS/IAM/OpenIDConnectProvider.ts:261
     yield* iam.updateOpenIDConnectProviderThumbprint({
0.91 packages/alchemy/src/AWS/IAM/SigningCertificate.ts:120
     const listed = yield* iam.listSigningCertificates({
0.91 packages/alchemy/src/AWS/IAM/User.ts:421
     const user = yield* iam.getUser({ UserName: userName });
0.91 packages/alchemy/src/AWS/Inspector2/Filter.ts:126
     .listFilters({ arns: [arn] })
0.91 packages/alchemy/src/AWS/IoTManagedIntegrations/NotificationConfiguration.ts:97
     .getNotificationConfiguration({ EventType: eventType })
0.91 packages/alchemy/src/AWS/IoTSiteWise/Gateway.ts:139
     const summaries = yield* sitewise.listGateways.pages({}).pipe(
0.91 packages/alchemy/src/AWS/Location/ApiKey.ts:183
     .describeKey({ KeyName: keyName })
0.91 packages/alchemy/src/AWS/Location/GeofenceCollection.ts:97
     .describeGeofenceCollection({ CollectionName: collectionName })
0.91 packages/alchemy/src/AWS/Location/Map.ts:118
     .describeMap({ MapName: mapName })
0.91 packages/alchemy/src/AWS/Location/RouteCalculator.ts:91
     .describeRouteCalculator({ CalculatorName: calculatorName })
0.91 packages/alchemy/src/AWS/MQ/Configuration.ts:145
     .describeConfiguration({ ConfigurationId: configurationId })
0.91 packages/alchemy/src/AWS/MailManager/AddonSubscription.ts:82
     .getAddonSubscription({ AddonSubscriptionId: addonSubscriptionId })
0.91 packages/alchemy/src/AWS/MediaConvert/Queue.ts:127
     .getQueue({ Name: name })
0.91 packages/alchemy/src/AWS/MemoryDB/SubnetGroup.ts:195
     const response = yield* memorydb.updateSubnetGroup(update);
0.91 packages/alchemy/src/AWS/OSIS/ResourcePolicy.ts:103
     .getResourcePolicy({ ResourceArn: resourceArn })
0.91 packages/alchemy/src/AWS/OpenSearchServerless/GetCollectionHttp.ts:39
     const response = yield* op({ ids: [yield* CollectionId] });
0.91 packages/alchemy/src/AWS/Redshift/ClusterParameterGroup.ts:122
     const response = yield* redshift
0.91 packages/alchemy/src/AWS/Route53/HostedZoneLookup.ts:23
     const listed = yield* route53.listHostedZonesByName({
0.91 packages/alchemy/src/AWS/Route53Resolver/internal.ts:15
     r53r.listTagsForResource.items({ ResourceArn: arn }).pipe(
0.91 packages/alchemy/src/AWS/S3Control/AccessPointPolicy.ts:86
     .getAccessPointPolicy({ AccountId: accountId, Name: name })
0.91 packages/alchemy/src/AWS/SES/Contact.ts:344
     yield* sesv2
0.91 packages/alchemy/src/AWS/SES/EmailIdentity.ts:315
     observed = yield* sesv2.getEmailIdentity({ EmailIdentity: name });
0.91 packages/alchemy/src/AWS/SES/EmailIdentityPolicy.ts:213
     const policies = yield* getPolicies(emailIdentity);
0.91 packages/alchemy/src/AWS/SES/EmailTemplate.ts:120
     .getEmailTemplate({ TemplateName: name })
0.91 packages/alchemy/src/AWS/SNS/PlatformApplication.ts:234
     yield* sns.deletePlatformApplication({
0.91 packages/alchemy/src/AWS/SNS/Subscription.ts:223
     });
0.91 packages/alchemy/src/AWS/SNS/Topic.ts:232
     .getTopicAttributes({ TopicArn: topicArn })
0.91 packages/alchemy/src/AWS/SSMContacts/Rotation.ts:210
     let rotation = yield* getRotation(arn);
0.91 packages/alchemy/src/AWS/Scheduler/ScheduleGroup.ts:61
     never,
0.91 packages/alchemy/src/AWS/SecurityHub/ActionTarget.ts:101
     securityhub.describeActionTargets({ ActionTargetArns: [arn] }).pipe(
0.91 packages/alchemy/src/AWS/SimpleDB/SelectHttp.ts:21
     return yield* select({
0.91 packages/alchemy/src/AWS/SocialMessaging/LinkedWhatsAppBusinessAccount.ts:181
     const response = yield* socialmessaging.listTagsForResource({
0.91 packages/alchemy/src/AWS/VerifiedPermissions/PolicyStoreAlias.ts:95
     .getPolicyStoreAlias({ aliasName })
0.91 packages/alchemy/src/AWS/VerifiedPermissions/PolicyTemplate.ts:97
     .getPolicyTemplate({ policyStoreId, policyTemplateId })
0.91 packages/alchemy/src/AWS/VerifiedPermissions/Schema.ts:92
     .getSchema({ policyStoreId })
0.91 packages/alchemy/src/AWS/XRay/Group.ts:131
     xray.getGroup({ GroupName: groupName }).pipe(
0.91 packages/alchemy/src/Auth/OAuthFlow.ts:348
     yield* client.execute(request).pipe(
0.91 packages/alchemy/src/Axiom/View.ts:87
     const views = yield* listViews({});
0.91 packages/alchemy/src/Cloudflare/AI/Dataset.ts:282
     yield* aiGateway
0.91 packages/alchemy/src/Cloudflare/AI/SearchNamespace.ts:341
     .readNamespace({ accountId, name })
0.91 packages/alchemy/src/Cloudflare/Access/Certificate.ts:201
     .createAccessCertificateForAccount({
0.91 packages/alchemy/src/Cloudflare/Access/Policy.ts:441
     .getAccessPolicy({
0.91 packages/alchemy/src/Cloudflare/Access/ServiceToken.ts:232
     .getAccessServiceTokenForAccount({
0.91 packages/alchemy/src/Cloudflare/Account/Member.ts:389
     ? getMember(accountId, match.id)
0.91 packages/alchemy/src/Cloudflare/Acm/CustomTrustStore.ts:241
     const observed = yield* getTrustStore(output.zoneId, output.id);
0.91 packages/alchemy/src/Cloudflare/Acm/TotalTls.ts:207
     const observed = yield* acm.getTotalTl({ zoneId });
0.91 packages/alchemy/src/Cloudflare/ApiShield/Operation.ts:282
     apiGateway.getOperation({ zoneId, operationId }).pipe(
0.91 packages/alchemy/src/Cloudflare/ApiShield/UserSchema.ts:233
     yield* apiGateway
0.91 packages/alchemy/src/Cloudflare/ApiToken/AccountApiToken.ts:203
     .getToken({
0.91 packages/alchemy/src/Cloudflare/Cache/OriginCloudRegion.ts:262
     cache.getOriginCloudRegion({ zoneId, originIP: ip }).pipe(
0.91 packages/alchemy/src/Cloudflare/Cache/RegionalTieredCache.ts:206
     const observed = yield* cache.getRegionalTieredCache({ zoneId });
0.91 packages/alchemy/src/Cloudflare/Cache/Variants.ts:273
     const patched = yield* cache.patchVariant({ zoneId, value: desired });
0.91 packages/alchemy/src/Cloudflare/CertificateAuthorities/HostnameAssociation.ts:141
     .pipe(
0.91 packages/alchemy/src/Cloudflare/CustomNameserver/CustomNameserver.ts:161
     page.result.map((ns) => toAttributes(ns, accountId)),
0.91 packages/alchemy/src/Cloudflare/DNS/ZoneTransferPeer.ts:165
     const observed = yield* getPeer(acct, output.peerId);
0.91 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionFilter.ts:214
     .getAdvancedTcpProtectionSynProtectionFilterItem({ accountId, filterId })
0.91 packages/alchemy/src/Cloudflare/DdosProtection/SynProtectionRule.ts:206
     const observed = yield* getRule(acct, output.ruleId);
0.91 packages/alchemy/src/Cloudflare/DdosProtection/TcpFlowProtectionFilter.ts:147
     yield* ddos.createAdvancedTcpProtectionTcpFlowProtectionFilter({
0.91 packages/alchemy/src/Cloudflare/Devices/DexTest.ts:173
     const observed = yield* observeTest(acct, output.testId);
0.91 packages/alchemy/src/Cloudflare/Devices/ManagedNetwork.ts:228
     .getDeviceNetwork({ accountId, networkId })
0.91 packages/alchemy/src/Cloudflare/Diagnostics/EndpointHealthcheck.ts:146
     const observed = yield* getHealthcheck(acct, output.healthcheckId);
0.91 packages/alchemy/src/Cloudflare/Email/AllowPolicy.ts:164
     return yield* emailSecurity.listSettingAllowPolicies
0.91 packages/alchemy/src/Cloudflare/Email/BlockSender.ts:228
     emailSecurity.getSettingBlockSender({ accountId, patternId }).pipe(
0.91 packages/alchemy/src/Cloudflare/Flagship/Flag.ts:381
     const created = yield* flagship
0.91 packages/alchemy/src/Cloudflare/Fraud/DetectionSettings.ts:262
     observed = yield* fraud.putFraud({ zoneId, ...desired });
0.91 packages/alchemy/src/Cloudflare/Gateway/List.ts:241
     const fresh = yield* getList(accountId, created.id);
0.91 packages/alchemy/src/Cloudflare/Gateway/Logging.ts:195
     zeroTrust.getGatewayLogging({ accountId }).pipe(
0.91 packages/alchemy/src/Cloudflare/Gateway/ProxyEndpoint.ts:182
     observed = yield* zeroTrust.createGatewayProxyEndpoint({
0.91 packages/alchemy/src/Cloudflare/Images/SigningKey.ts:156
     return yield* images.listV1Keys({ accountId }).pipe(
0.91 packages/alchemy/src/Cloudflare/Intel/IndicatorFeed.ts:330
     const final = yield* getFeed(accountId, feedId);
0.91 packages/alchemy/src/Cloudflare/KV/Namespace.ts:199
     .getNamespace({
0.91 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/LeakedCredentialCheck.ts:160
     const observed = yield* lcc.getLeakedCredentialCheck({ zoneId });
0.91 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CatalogSync.ts:182
     const observed = yield* getSync(acct, output.syncId);
0.91 packages/alchemy/src/Cloudflare/MagicCloudNetworking/CloudIntegration.ts:234
     const created = yield* mcn.createCloudIntegration({
0.91 packages/alchemy/src/Cloudflare/MagicTransit/App.ts:136
     const created = yield* magicTransit.createApp({
0.91 packages/alchemy/src/Cloudflare/MagicTransit/SiteAcl.ts:210
     const created = yield* magicTransit.createSiteAcl({
0.91 packages/alchemy/src/Cloudflare/MagicTransit/SiteWan.ts:161
     const observed = yield* getWan(acct, siteId, output.wanId);
0.91 packages/alchemy/src/Cloudflare/MagicTransit/StaticRoute.ts:232
     yield* magicTransit
0.91 packages/alchemy/src/Cloudflare/OriginCaCertificate/OriginCaCertificate.ts:341
     const certs = yield* originCa.listOriginCaCertificates
0.91 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameAssociation.ts:248
     originTls.getHostname({ zoneId, hostname }).pipe(
0.91 packages/alchemy/src/Cloudflare/PageShield/Policy.ts:171
     const list = yield* pageShield.listPolicies({ zoneId });
0.91 packages/alchemy/src/Cloudflare/Pages/Project.ts:181
     never,
0.91 packages/alchemy/src/Cloudflare/RegionalHostname/RegionalHostname.ts:240
     .getRegionalHostname({ zoneId, hostname })
0.91 packages/alchemy/src/Cloudflare/ResourceSharing/ShareRecipient.ts:281
     resourceSharing.getRecipient({ accountId, shareId, recipientId }).pipe(
0.91 packages/alchemy/src/Cloudflare/ResourceSharing/ShareResource.ts:202
     const observed = yield* getEntry(acct, shareId, output.shareResourceId);
0.91 packages/alchemy/src/Cloudflare/RiskScoring/Integration.ts:146
     observed = yield* zeroTrust.createRiskScoringIntegration({
0.91 packages/alchemy/src/Cloudflare/SecurityTxt/SecurityTxt.ts:181
     .pipe(
0.91 packages/alchemy/src/Cloudflare/Speed/TestSchedule.ts:401
     zoneId,
0.91 packages/alchemy/src/Cloudflare/Stream/LiveInput.ts:203
     const response = yield* stream.listLiveInputs({ accountId });
0.91 packages/alchemy/src/Cloudflare/Stream/LiveInputOutput.ts:218
     const updated = yield* stream.updateLiveInputOutput({
0.91 packages/alchemy/src/Cloudflare/Stream/SigningKey.ts:96
     return yield* stream.getKey.pages({ accountId }).pipe(
0.91 packages/alchemy/src/Cloudflare/TokenValidation/Configuration.ts:281
     observed = yield* tokenValidation.createConfiguration({
0.91 packages/alchemy/src/Cloudflare/Tunnel/Configuration.ts:355
     yield* putConfig({
0.91 packages/alchemy/src/Cloudflare/Tunnel/HostnameRoute.ts:226
     zeroTrust.getNetworkHostnameRoute({ accountId, hostnameRouteId }).pipe(
0.91 packages/alchemy/src/Cloudflare/Tunnel/Route.ts:193
     .createNetworkRoute({
0.91 packages/alchemy/src/Cloudflare/Tunnel/Tunnel.ts:359
     .getTunnelCloudflared({
0.91 packages/alchemy/src/Cloudflare/VulnerabilityScanner/Credential.ts:258
     const created = yield* vulnScanner.createCredentialSetCredential({
0.91 packages/alchemy/src/Cloudflare/Workers/Route.ts:182
     .createRoute({ zoneId, pattern: news.pattern, script })
0.91 packages/alchemy/src/Cloudflare/Zone/Setting.ts:367
     yield* zones
0.91 packages/alchemy/src/Git/BlobStoreS3.ts:255
     GetObjectHttp,
0.91 packages/alchemy/src/Git/Jobs/Compact.ts:24
     * entry header — a read is then one ranged R2 GET returning exactly the
0.91 packages/alchemy/src/Hetzner/Firewall.ts:682
     .deleteFirewall({ id })
0.91 packages/alchemy/src/Hetzner/FloatingIp.ts:411
     const current = yield* getById(output.id);
0.91 packages/alchemy/src/Hetzner/PlacementGroup.ts:201
     Hetzner.placementGroups.getPlacementGroup({ id }).pipe(
0.91 packages/alchemy/src/Hetzner/PrimaryIp.ts:321
     .items({ label_selector: alchemyStackSelector, per_page: 50 })
0.91 packages/alchemy/src/Kubernetes/internal/client.ts:324
     requestJson({
0.91 packages/alchemy/src/Neon/AuthOAuthProvider.ts:77
     Neon.listBranchNeonAuthOauthProviders(authRequest(scope)).pipe(
0.91 packages/alchemy/src/Neon/DataApi.ts:101
     Neon.getProjectBranchDataAPI({
0.91 packages/alchemy/src/Neon/OrganizationSpendingLimit.ts:95
     Neon.getOrganizationSpendingLimit({ org_id: orgId }).pipe(
0.91 packages/alchemy/src/Neon/OrganizationVPCEndpoint.ts:148
     const observed = yield* observe(scope);
0.91 packages/alchemy/src/Neon/ProjectVPCEndpoint.ts:138
     const { project } = yield* Neon.getProject({ project_id: scope.projectId });
0.91 packages/alchemy/src/Planetscale/Postgres/PostgresDatabase.ts:220
     const branch = yield* planetscale
0.91 packages/alchemy/src/Planetscale/Postgres/PostgresRole.ts:244
     return yield* planetscale
0.91 packages/alchemy/src/Prisma/Bucket.ts:256
     yield* deleteBucket({
0.91 packages/alchemy/src/Prisma/CustomDomain.ts:281
     .getCustomDomain(customDomainId)
0.91 packages/alchemy/src/Prisma/EnvironmentVariable.ts:202
     );
0.91 packages/alchemy/src/Redis/Protocol.ts:341
     yield* writeSocket(socket, payload);
0.91 packages/alchemy/src/Stripe/AccountExternalAccount.ts:265
     GetAccountExternalAccount({ account, id }).pipe(
0.91 packages/alchemy/src/Stripe/AccountPerson.ts:303
     GetAccountPerson({ account, person }).pipe(
0.91 packages/alchemy/src/Stripe/AppsSecret.ts:381
     yield* CreateAppsSecretsDelete({
0.91 packages/alchemy/src/Stripe/Customer.ts:164
     const response = yield* GetCustomers({
0.91 packages/alchemy/src/Stripe/EntitlementsFeature.ts:189
     const response = yield* GetEntitlementsFeatures({
0.91 packages/alchemy/src/Stripe/PaymentLink.ts:722
     const updated = yield* UpdatePaymentLink({
0.91 packages/alchemy/src/Stripe/PaymentMethodConfiguration.ts:301
     never,
0.91 packages/alchemy/src/Stripe/Product.ts:81
     never,
0.91 packages/alchemy/src/Stripe/WebhookEndpoint.ts:230
     const response = yield* GetWebhookEndpoints({
0.91 packages/alchemy/test/AWS/Timestream/handler.ts:72
     const result = yield* query({
0.91 packages/alchemy/test/Cloudflare/AI/fixtures/AiBindingWorker.ts:57
     const response = yield* AiLanguageModel.generateText({ prompt }).pipe(
0.91 packages/alchemy/test/Cloudflare/Container/fixtures/prismahost/object.ts:37
     HttpClientRequest.get(`http://container${path}`),
0.91 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:79
     const rows = yield* sql`SELECT id, name, email FROM users`;
0.91 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:29
     const result = yield* db.exec(
0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:63
     .pipe(Effect.orDie);
0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:32
     yield* db.exec(
0.91 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:43
     yield* cache.ping().pipe(Effect.orDie);
0.91 packages/alchemy/test/Fly/fixtures/postgres-api.ts:52
     const result = yield* Effect.result(client.execute("select 1 as ok"));
0.91 packages/alchemy/test/Neon/fixtures/backend-effect.ts:44
     HttpClientRequest.get("https://example.com/"),
0.91 packages/better-auth/test/http.ts:28
     const response = await fetch(url, { ...init, signal });
0.91 packages/cloudflare-runtime/src/core/remote-bindings/workers/client.worker.ts:81
     const response = await fetch("http://stub", req);
0.91 packages/frontend-frameworks/src/astro/prerenderer.ts:213
     export const collectOutputModules = async (
0.90 packages/alchemy/src/AWS/AMP/GetLabelsHttp.ts:24
     send({
0.90 packages/alchemy/src/AWS/AMP/ResourcePolicy.ts:94
     .describeResourcePolicy({ workspaceId })
0.90 packages/alchemy/src/AWS/AMP/internal.ts:24
     .listTagsForResource({ resourceArn: arn })
0.90 packages/alchemy/src/AWS/Account/AlternateContact.ts:103
     .getAlternateContact({
0.90 packages/alchemy/src/AWS/ApiGateway/ApiKey.ts:177
     .getApiKey({ apiKey: output.id, includeValue: false })
0.90 packages/alchemy/src/AWS/ApiGateway/Authorizer.ts:160
     .getAuthorizer({
0.90 packages/alchemy/src/AWS/ApiGateway/BasePathMapping.ts:82
     .getBasePathMapping({
0.90 packages/alchemy/src/AWS/ApiGateway/VpcLink.ts:115
     .getVpcLink({ vpcLinkId: output.vpcLinkId })
0.90 packages/alchemy/src/AWS/AppConfig/Application.ts:94
     .getApplication({ ApplicationId: applicationId })
0.90 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalableTarget.ts:310
     yield* aas.registerScalableTarget({
0.90 packages/alchemy/src/AWS/ApplicationSignals/ServiceLevelObjective.ts:283
     appsignals.listTagsForResource({ ResourceArn: sloArn }).pipe(
0.90 packages/alchemy/src/AWS/Athena/DataCatalog.ts:121
     athena.getDataCatalog({ Name: name, WorkGroup: "primary" }).pipe(
0.90 packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts:101
     never,
0.90 packages/alchemy/src/AWS/B2BI/Capability.ts:112
     .getCapability({ capabilityId: head.value.capabilityId })
0.90 packages/alchemy/src/AWS/B2BI/Transformer.ts:241
     const updated = yield* b2bi.updateTransformer({
0.90 packages/alchemy/src/AWS/BackupSearch/SearchJob.ts:255
     .getSearchJob({ SearchJobIdentifier: searchJobIdentifier })
0.90 packages/alchemy/src/AWS/Bootstrap.ts:60
     const listResponse = yield* s3.listObjectsV2({
0.90 packages/alchemy/src/AWS/Chatbot/CustomAction.ts:188
     chatbot.listTagsForResource({ ResourceARN: arn }).pipe(
0.90 packages/alchemy/src/AWS/Chatbot/SlackChannelConfiguration.ts:341
     .deleteSlackChannelConfiguration({
0.90 packages/alchemy/src/AWS/CloudFront/KeyGroup.ts:142
     yield* cloudfront.listKeyGroups({ Marker: marker });
0.90 packages/alchemy/src/AWS/CodeArtifact/Domain.ts:100
     .describeDomain({ domain: name })
0.90 packages/alchemy/src/AWS/CodeArtifact/Repository.ts:153
     .describeRepository({ domain, domainOwner, repository: name })
0.90 packages/alchemy/src/AWS/CodeConnections/Connection.ts:98
     .getConnection({ ConnectionArn: arn })
0.90 packages/alchemy/src/AWS/CodeConnections/RepositoryLink.ts:103
     .getRepositoryLink({ RepositoryLinkId: id })
0.90 packages/alchemy/src/AWS/DataExchange/EventAction.ts:261
     eventAction = yield* dataexchange.updateEventAction({
0.90 packages/alchemy/src/AWS/DataExchange/Revision.ts:110
     .getRevision({ DataSetId: dataSetId, RevisionId: revisionId })
0.90 packages/alchemy/src/AWS/Detective/Graph.ts:66
     .listGraphs({})
0.90 packages/alchemy/src/AWS/DynamoDB/BatchExecuteStatementHttp.ts:47
     return yield* batchExecuteStatement(request);
0.90 packages/alchemy/src/AWS/DynamoDB/BatchWriteItemHttp.ts:67
     return yield* batchWriteItem({
0.90 packages/alchemy/src/AWS/DynamoDB/TransactGetItemsHttp.ts:72
     return yield* transactGetItems({
0.90 packages/alchemy/src/AWS/EC2/EIP.ts:313
     yield* ec2.deleteTags({
0.90 packages/alchemy/src/AWS/EC2/FlowLog.ts:381
     (yield* ec2
0.90 packages/alchemy/src/AWS/EC2/GetAmiHttp.ts:43
     const response = yield* describeImages({
0.90 packages/alchemy/src/AWS/EC2/KeyPair.ts:221
     const imported = yield* ec2
0.90 packages/alchemy/src/AWS/EC2/defaultVpcScope.ts:26
     .describeVpcs({ Filters: [{ Name: "isDefault", Values: ["true"] }] })
0.90 packages/alchemy/src/AWS/ELBv2/ListenerCertificate.ts:172
     yield* elbv2.addListenerCertificates({
0.90 packages/alchemy/src/AWS/Forecast/Dataset.ts:135
     .describeDataset({ DatasetArn: datasetArn })
0.90 packages/alchemy/src/AWS/Forecast/DatasetGroup.ts:107
     .describeDatasetGroup({ DatasetGroupArn: datasetGroupArn })
0.90 packages/alchemy/src/AWS/FraudDetector/List.ts:112
     .getListsMetadata({ name })
0.90 packages/alchemy/src/AWS/GuardDuty/IPSet.ts:321
     .pipe(Effect.catchTag("BadRequestException", () => Effect.void));
0.90 packages/alchemy/src/AWS/GuardDuty/ThreatIntelSet.ts:141
     .getThreatIntelSet({
0.90 packages/alchemy/src/AWS/IAM/AccessKey.ts:84
     const listed = yield* iam.listAccessKeys({
0.90 packages/alchemy/src/AWS/IAM/Policy.ts:261
     PolicyArn: policyArn,
0.90 packages/alchemy/src/AWS/IoT/TopicRule.ts:143
     .getTopicRule({ ruleName })
0.90 packages/alchemy/src/AWS/IoTManagedIntegrations/CredentialLocker.ts:87
     .getCredentialLocker({ Identifier: identifier })
0.90 packages/alchemy/src/AWS/IoTWireless/DeviceProfile.ts:112
     .getDeviceProfile({ Id: deviceProfileId })
0.90 packages/alchemy/src/AWS/IoTWireless/ServiceProfile.ts:115
     .getServiceProfile({ Id: serviceProfileId })
0.90 packages/alchemy/src/AWS/IoTWireless/WirelessGateway.ts:218
     reconcile: Effect.fn(function* ({ id, news, output, session }) {
0.90 packages/alchemy/src/AWS/Location/PlaceIndex.ts:105
     .describePlaceIndex({ IndexName: indexName })
0.90 packages/alchemy/src/AWS/Location/Tracker.ts:111
     .describeTracker({ TrackerName: trackerName })
0.90 packages/alchemy/src/AWS/Logs/LogStream.ts:71
     .describeLogStreams({
0.90 packages/alchemy/src/AWS/Macie2/Session.ts:88
     const getSession = macie2.getMacieSession({}).pipe(
0.90 packages/alchemy/src/AWS/MemoryDB/ParameterGroup.ts:221
     yield* memorydb.updateParameterGroup({
0.90 packages/alchemy/src/AWS/Notifications/ChannelAssociation.ts:40
     never,
0.90 packages/alchemy/src/AWS/Omics/RunGroup.ts:64
     never,
0.90 packages/alchemy/src/AWS/Personalize/Schema.ts:110
     .describeSchema({ schemaArn })
0.90 packages/alchemy/src/AWS/QuickSight/DataSource.ts:145
     const response = yield* quicksight
0.90 packages/alchemy/src/AWS/RUM/ResourcePolicy.ts:102
     .getResourcePolicy({ Name: appMonitorName })
0.90 packages/alchemy/src/AWS/ResourceGroups/Group.ts:341
     .getGroup({ Group: groupName })
0.90 packages/alchemy/src/AWS/RolesAnywhere/Crl.ts:71
     never,
0.90 packages/alchemy/src/AWS/Route53/HealthCheck.ts:347
     const updated = yield* route53
0.90 packages/alchemy/src/AWS/S3Tables/Table.ts:264
     yield* s3tables
0.90 packages/alchemy/src/AWS/S3Vectors/VectorBucket.ts:163
     s3vectors.getVectorBucketPolicy({ vectorBucketName }).pipe(
0.90 packages/alchemy/src/AWS/S3Vectors/VectorIndex.ts:125
     s3vectors.getIndex({ vectorBucketName, indexName }).pipe(
0.90 packages/alchemy/src/AWS/SES/ActiveReceiptRuleSet.ts:54
     const response = yield* ses.describeActiveReceiptRuleSet({});
0.90 packages/alchemy/src/AWS/SES/ConfigurationSet.ts:281
     const found = yield* getConfigurationSet(name);
0.90 packages/alchemy/src/AWS/SES/ConfigurationSetEventDestination.ts:321
     yield* sesv2
0.90 packages/alchemy/src/AWS/SES/ReceiptRuleSet.ts:86
     .describeReceiptRuleSet({ RuleSetName: name })
0.90 packages/alchemy/src/AWS/SSMContacts/ContactChannel.ts:66
     never,
0.90 packages/alchemy/src/AWS/SecurityHub/AutomationRule.ts:144
     .batchGetAutomationRules({ AutomationRulesArns: [arn] })
0.90 packages/alchemy/src/AWS/SecurityHub/Hub.ts:103
     const describeHub = securityhub.describeHub({}).pipe(
0.90 packages/alchemy/src/AWS/SecurityLake/AwsLogSource.ts:282
     const response = yield* securitylake.createAwsLogSource({
0.90 packages/alchemy/src/AWS/Shield/Subscription.ts:73
     const observeSubscription = shield.describeSubscription({}).pipe(
0.90 packages/alchemy/src/AWS/Synthetics/Group.ts:261
     .deleteGroup({ GroupIdentifier: output.groupName })
0.90 packages/alchemy/src/AWS/Timestream/ScheduledQuery.ts:261
     ? yield* readScheduledQuery(output.scheduledQueryArn)
0.90 packages/alchemy/src/AWS/Translate/Terminology.ts:147
     .getTerminology({ Name: name })
0.90 packages/alchemy/src/AWS/XRay/ResourcePolicy.ts:122
     xray.listResourcePolicies.items({}).pipe(
0.90 packages/alchemy/src/Axiom/Dataset.ts:81
     never,
0.90 packages/alchemy/src/Cloudflare/AI/CustomTopics.ts:128
     aiSecurity.getCustomTopic({ zoneId }).pipe(
0.90 packages/alchemy/src/Cloudflare/AI/Gateway.ts:581
     return yield* aiGateway.listAiGateways.pages({ accountId }).pipe(
0.90 packages/alchemy/src/Cloudflare/AI/SecuritySettings.ts:178
     const observed = yield* aiSecurity.getAiSecurity({ zoneId });
0.90 packages/alchemy/src/Cloudflare/Access.ts:34
     fetch(`https://${domain}`, { redirect: "manual", signal }),
0.90 packages/alchemy/src/Cloudflare/Account/Account.ts:101
     never,
0.90 packages/alchemy/src/Cloudflare/Addressing/AddressMap.ts:101
     never,
0.90 packages/alchemy/src/Cloudflare/Addressing/PrefixDelegation.ts:172
     const created = yield* addressing.createPrefixDelegation({
0.90 packages/alchemy/src/Cloudflare/Alerting/Silence.ts:220
     .createSilence({
0.90 packages/alchemy/src/Cloudflare/Cache/Reserve.ts:198
     const observed = yield* cache.getCacheReserve({ zoneId });
0.90 packages/alchemy/src/Cloudflare/Calls/App.ts:113
     return yield* calls.listSfus.pages({ accountId }).pipe(
0.90 packages/alchemy/src/Cloudflare/Calls/TurnKey.ts:163
     const created = yield* calls.createTurn({ accountId, name });
0.90 packages/alchemy/src/Cloudflare/ContentScanning/Expression.ts:222
     });
0.90 packages/alchemy/src/Cloudflare/CustomHostname/CustomHostname.ts:488
     customHostnames.listCustomHostnames
0.90 packages/alchemy/src/Cloudflare/D1/QueryDatabaseBinding.ts:40
     Effect.promise(() => raw.exec(query)),
0.90 packages/alchemy/src/Cloudflare/DNS/Dnssec.ts:261
     const observed = yield* dns.getDnssec({ zoneId }).pipe(
0.90 packages/alchemy/src/Cloudflare/DNS/View.ts:53
     never,
0.90 packages/alchemy/src/Cloudflare/DNS/ZoneTransferAcl.ts:54
     never,
0.90 packages/alchemy/src/Cloudflare/Devices/CustomProfile.ts:301
     const created = yield* zeroTrust.createDevicePolicyCustom({
0.90 packages/alchemy/src/Cloudflare/Devices/Settings.ts:201
     yield* zeroTrust.patchDeviceSetting({ accountId, ...changes });
0.90 packages/alchemy/src/Cloudflare/Email/SendingSubdomain.ts:215
     ? yield* getSubdomain(zoneId, output.subdomainId)
0.90 packages/alchemy/src/Cloudflare/Gateway/Location.ts:227
     const observed = yield* getLocation(acct, output.locationId);
0.90 packages/alchemy/src/Cloudflare/Images/Variant.ts:172
     const names = yield* images.listV1Variants({ accountId }).pipe(
0.90 packages/alchemy/src/Cloudflare/LoadBalancer/Pool.ts:306
     const created = yield* loadBalancers.createPool({
0.90 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Rule.ts:401
     .pipe(
0.90 packages/alchemy/src/Cloudflare/MagicTransit/GreTunnel.ts:401
     .getGreTunnel({ accountId, greTunnelId, xMagicNewHcTarget: true })
0.90 packages/alchemy/src/Cloudflare/ManagedTransforms/ManagedTransforms.ts:261
     yield* managedTransforms.listManagedTransforms({ zoneId }),
0.90 packages/alchemy/src/Cloudflare/NetworkInterconnects/Settings.ts:122
     const observed = yield* cni.getSetting({ accountId });
0.90 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Certificate.ts:321
     const list = yield* originTls.listOriginTlsClientAuths({ zoneId });
0.90 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Setting.ts:117
     originTls.getSetting({ zoneId }).pipe(
0.90 packages/alchemy/src/Cloudflare/PageRule/PageRule.ts:342
     .listPageRules({ zoneId })
0.90 packages/alchemy/src/Cloudflare/Pages/Domain.ts:101
     never,
0.90 packages/alchemy/src/Cloudflare/R2/BucketSippy.ts:293
     const synced = yield* r2.putBucketSippy({
0.90 packages/alchemy/src/Cloudflare/R2/ReadBucketHttp.ts:62
     r2.getObject({
0.90 packages/alchemy/src/Cloudflare/R2/WriteBucketHttp.ts:66
     r2.putObject({
0.90 packages/alchemy/src/Cloudflare/Rum/Site.ts:281
     .pipe(Effect.catchTag("SiteNotFound", () => Effect.void));
0.90 packages/alchemy/src/Cloudflare/SecretsStore/SecretsStore.ts:100
     const response = yield* secretsStore
0.90 packages/alchemy/src/Cloudflare/Spectrum/Application.ts:341
     const created = yield* spectrum.createApp({
0.90 packages/alchemy/src/Cloudflare/Tags/AccountResourceTags.ts:101
     never,
0.90 packages/alchemy/src/Cloudflare/TokenValidation/Rule.ts:302
     .deleteRule({ zoneId: output.zoneId, ruleId: output.ruleId })
0.90 packages/alchemy/src/Cloudflare/Tunnel/VirtualNetwork.ts:170
     .createNetworkVirtualNetwork({
0.90 packages/alchemy/src/Cloudflare/Turnstile/Widget.ts:337
     turnstile.getWidget({ accountId, sitekey }).pipe(
0.90 packages/alchemy/src/Cloudflare/UrlNormalization/UrlNormalization.ts:212
     const observed = yield* urlNormalization.getUrlNormalization({ zoneId });
0.90 packages/alchemy/src/Cloudflare/VulnerabilityScanner/CredentialSet.ts:39
     never,
0.90 packages/alchemy/src/Cloudflare/Workers/AccountSetting.ts:121
     const observed = yield* workers.getAccountSetting({ accountId: acct });
0.90 packages/alchemy/src/Cloudflare/Zone/Hold.ts:196
     const observed = yield* zones.getHold({ zoneId });
0.90 packages/alchemy/src/Fly/Certificate.ts:321
     .getAppCertificate({ app_name: appName, hostname })
0.90 packages/alchemy/src/Hetzner/Certificate.ts:278
     const byId = yield* getById(input.id);
0.90 packages/alchemy/src/Hetzner/FloatingIpAssignment.ts:148
     Hetzner.floatingIps.getFloatingIp({ id }).pipe(
0.90 packages/alchemy/src/Local/RpcSpawner.ts:363
     const response = yield* client.get(
0.90 packages/alchemy/src/Neon/AIGateway.ts:105
     getProjectBranchAiGateway({ project_id, branch_id }).pipe(
0.90 packages/alchemy/src/Neon/Auth.ts:221
     Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
0.90 packages/alchemy/src/Neon/Branch.ts:829
     const direct = yield* getConnectionURI({
0.90 packages/alchemy/src/Planetscale/MySQL/MySQLMigrations.ts:181
     try: () => connection.query(sql).then(() => undefined),
0.90 packages/alchemy/src/Planetscale/Postgres/PostgresMigrations.ts:185
     client.query(sql, values as Array<unknown>).then(() => undefined),
0.90 packages/alchemy/src/Prisma/App.ts:421
     Retry.none,
0.90 packages/alchemy/src/Prisma/Branch.ts:403
     Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
0.90 packages/alchemy/src/Prisma/Internal/DeploymentObserve.ts:5
     getDeployment({ deploymentId }).pipe(Effect.map((response) => response.data));
0.90 packages/alchemy/src/Server/SQSQueueEventSource.ts:34
     const result = yield* receiveMessage({
0.90 packages/alchemy/src/Stripe/Alert.ts:265
     const response = yield* GetBillingAlerts({
0.90 packages/alchemy/src/Stripe/BillingMeter.ts:266
     const response = yield* GetBillingMeters({
0.90 packages/alchemy/src/Stripe/Coupon.ts:321
     });
0.90 packages/alchemy/src/Stripe/FileLink.ts:201
     const byId = yield* getById(input.id);
0.90 packages/alchemy/src/Stripe/Plan.ts:373
     const plans = yield* listAllPlans();
0.90 packages/alchemy/src/Stripe/ShippingRate.ts:393
     const rates = yield* listAllShippingRates();
0.90 packages/alchemy/src/Stripe/TaxRate.ts:241
     GetTaxRate({ tax_rate: taxRate }).pipe(
0.90 packages/alchemy/src/Stripe/TaxRegistration.ts:548
     const registrations = yield* listByStatus("all");
0.90 packages/alchemy/src/Stripe/TerminalLocation.ts:511
     current = yield* CreateTerminalLocation({
0.90 packages/alchemy/test/AWS/KinesisVideo/handler.ts:82
     getDash({ PlaybackMode: "LIVE" }),
0.90 packages/alchemy/test/AWS/OpenSearchServerless/bindings-handler.ts:50
     const response = yield* getAccountSettings();
0.90 packages/alchemy/test/Cloudflare/AI/fixtures/LanguageModelWorker.ts:76
     ai.run(
0.90 packages/alchemy/test/Cloudflare/AI/fixtures/model-batch.ts:5
     const result = await env.AI.run(
0.90 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:66
     HttpClientRequest.get(`http://container${path}`),
0.90 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:26
     HttpClient.execute(request).pipe(
0.90 packages/alchemy/test/Neon/Website/Fixture.ts:100
     const body = yield* HttpClient.get(url).pipe(
0.90 packages/alchemy/test/Neon/fixtures/connect-handler.ts:25
     yield* pooled`SELECT current_database() AS database, value FROM alchemy_connect_marker`;
0.90 packages/alchemy/test/Neon/fixtures/function-events.ts:67
     yield* sql`SELECT id, kind, object_key FROM alchemy_function_events ORDER BY id`.pipe(
0.90 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:65
     yield* sql`CREATE TABLE IF NOT EXISTS ${sql(TABLE)} (id INT PRIMARY KEY, name TEXT NOT NULL)`;
0.90 packages/alchemy/test/Railway/fixtures/postgres-api.ts:37
     const rows = yield* db.execute("select 1 as ok", "objects");
0.90 packages/alchemy/test/SQL/fixtures/routes.ts:89
     yield* sql.unsafe(ddl);
0.90 packages/cloudflare-runtime/src/core/bindings/images/Images.worker.ts:266
     const response = await this.env[BINDING_IMAGES_LOOPBACK].fetch(
0.90 packages/cloudflare-runtime/src/core/remote-bindings/workers/outbound.worker.ts:126
     return await fetch(
0.90 packages/cloudflare-runtime/src/vite/preview-plugin.ts:100
     const request = NodeHttp.request(url, {
0.90 packages/frontend-frameworks/src/vinext/cache/redis-runtime.ts:37
     ): Promise<Reply> => Effect.runPromise(connection.send(command, args));
0.90 packages/frontend-frameworks/src/vinext/cache/s3-runtime.ts:46
     S3.getObject({
0.90 packages/pkg/src/Registry/GitHub.ts:201
     Apps.createInstallationAccessToken({
0.89 packages/alchemy/src/ACME/Account.ts:161
     acme.newAccount({ onlyReturnExisting: true }).pipe(
0.89 packages/alchemy/src/AWS/ACMPCA/Permission.ts:97
     return yield* acmpca.listPermissions
0.89 packages/alchemy/src/AWS/AMP/AlertManagerDefinition.ts:68
     .describeAlertManagerDefinition({ workspaceId })
0.89 packages/alchemy/src/AWS/AMP/QueryLoggingConfiguration.ts:82
     .describeQueryLoggingConfiguration({ workspaceId })
0.89 packages/alchemy/src/AWS/ApiGatewayV2/Api.ts:316
     const final = yield* agw2.getApi({ ApiId: apiId });
0.89 packages/alchemy/src/AWS/AppConfig/DeploymentStrategy.ts:122
     .getDeploymentStrategy({ DeploymentStrategyId: deploymentStrategyId })
0.89 packages/alchemy/src/AWS/AppConfig/ExtensionAssociation.ts:161
     extensionArn: association.ExtensionArn!,
0.89 packages/alchemy/src/AWS/AppConfig/HostedConfigurationVersion.ts:88
     .getHostedConfigurationVersion({
0.89 packages/alchemy/src/AWS/AppIntegrations/DataIntegration.ts:164
     .getDataIntegration({ Identifier: arnOrId })
0.89 packages/alchemy/src/AWS/AppIntegrations/EventIntegration.ts:122
     );
0.89 packages/alchemy/src/AWS/AppRunner/AutoScalingConfiguration.ts:142
     const page = yield* apprunner.listAutoScalingConfigurations({
0.89 packages/alchemy/src/AWS/AppRunner/ObservabilityConfiguration.ts:123
     const page = yield* apprunner.listObservabilityConfigurations({
0.89 packages/alchemy/src/AWS/ApplicationSignals/Discovery.ts:70
     yield* appsignals.startDiscovery({});
0.89 packages/alchemy/src/AWS/Athena/WorkGroup.ts:181
     const wg = yield* getOne(name);
0.89 packages/alchemy/src/AWS/AuditManager/Framework.ts:234
     const created = yield* auditmanager.createAssessmentFramework({
0.89 packages/alchemy/src/AWS/AutoScaling/DescribeAutoScalingGroupHttp.ts:39
     const result = yield* describe({
0.89 packages/alchemy/src/AWS/AutoScaling/LifecycleHook.ts:285
     yield* autoscaling.putLifecycleHook({
0.89 packages/alchemy/src/AWS/Backup/BackupVault.ts:234
     .getBackupVaultAccessPolicy({ BackupVaultName: name })
0.89 packages/alchemy/src/AWS/Chatbot/MicrosoftTeamsChannelConfiguration.ts:341
     yield* chatbot.tagResource({
0.89 packages/alchemy/src/AWS/CloudFront/PublicKey.ts:222
     const created = yield* cloudfront
0.89 packages/alchemy/src/AWS/CodeDeploy/Application.ts:105
     .getApplication({ applicationName: name })
0.89 packages/alchemy/src/AWS/Cognito/IdentityPool.ts:404
     .deleteIdentityPool({ IdentityPoolId: output.identityPoolId })
0.89 packages/alchemy/src/AWS/Cognito/UserPoolClient.ts:428
     observed = yield* cip
0.89 packages/alchemy/src/AWS/CostAndUsageReport/ReportDefinition.ts:421
     cur.deleteReportDefinition({ ReportName: output.reportName }),
0.89 packages/alchemy/src/AWS/DAX/SubnetGroup.ts:180
     const response = yield* dax.updateSubnetGroup(update);
0.89 packages/alchemy/src/AWS/DataExchange/DataSet.ts:129
     .getDataSet({ DataSetId: dataSetId })
0.89 packages/alchemy/src/AWS/DynamoDB/BatchGetItemHttp.ts:67
     return yield* batchGetItem({
0.89 packages/alchemy/src/AWS/DynamoDB/TransactWriteItemsHttp.ts:107
     return yield* transactWriteItems({
0.89 packages/alchemy/src/AWS/EC2/DescribeInstanceHttp.ts:37
     const result = yield* describe({
0.89 packages/alchemy/src/AWS/EC2/NetworkAclAssociation.ts:263
     .replaceNetworkAclAssociation({
0.89 packages/alchemy/src/AWS/EC2/RouteTableAssociation.ts:344
     Effect.tapError(Effect.log),
0.89 packages/alchemy/src/AWS/ECS/CapacityProvider.ts:164
     .pipe(
0.89 packages/alchemy/src/AWS/ELBv2/TargetGroup.ts:323
     // modifyTargetGroup when a health-check field actually changed.
0.89 packages/alchemy/src/AWS/EMRContainers/VirtualCluster.ts:281
     const created = yield* emrc.createVirtualCluster({
0.89 packages/alchemy/src/AWS/ElastiCache/CacheCluster.ts:215
     })
0.89 packages/alchemy/src/AWS/EventBridge/EventBus.ts:284
     yield* eventbridge.updateEventBus({
0.89 packages/alchemy/src/AWS/FraudDetector/Outcome.ts:74
     .getOutcomes({ name })
0.89 packages/alchemy/src/AWS/Glacier/Vault.ts:362
     .getVaultAccessPolicy({ accountId: ACCOUNT, vaultName })
0.89 packages/alchemy/src/AWS/Grafana/Workspace.ts:141
     const ws = yield* grafana.describeWorkspace({ workspaceId: id }).pipe(
0.89 packages/alchemy/src/AWS/IAM/ServiceSpecificCredential.ts:108
     iam.listServiceSpecificCredentials({ UserName: user.UserName }).pipe(
0.89 packages/alchemy/src/AWS/IdentityCenter/common.ts:37
     return yield* ssoAdmin.listInstances
0.89 packages/alchemy/src/AWS/IoT/Policy.ts:228
     iot
0.89 packages/alchemy/src/AWS/IoTManagedIntegrations/Destination.ts:114
     .getDestination({ Name: name })
0.89 packages/alchemy/src/AWS/LakeFormation/Resource.ts:88
     return yield* lf.describeResource({ ResourceArn: resourceArn }).pipe(
0.89 packages/alchemy/src/AWS/LicenseManager/LicenseConfiguration.ts:178
     .getLicenseConfiguration({ LicenseConfigurationArn: arn })
0.89 packages/alchemy/src/AWS/MailManager/AddonInstance.ts:103
     .getAddonInstance({ AddonInstanceId: addonInstanceId })
0.89 packages/alchemy/src/AWS/MediaPackageV2/Channel.ts:302
     yield* mediapackagev2.putChannelPolicy({
0.89 packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts:341
     mediatailor.getPlaybackConfiguration({ Name: name }).pipe(
0.89 packages/alchemy/src/AWS/Neptune/DBParameterGroup.ts:381
     DBParameterGroupName: output.dbParameterGroupName,
0.89 packages/alchemy/src/AWS/PaymentCryptography/Alias.ts:94
     .getAlias({ AliasName: aliasName })
0.89 packages/alchemy/src/AWS/PaymentCryptography/Key.ts:441
     : Effect.fail(error),
0.89 packages/alchemy/src/AWS/QApps/QApp.ts:206
     .getQApp({ instanceId, appId })
0.89 packages/alchemy/src/AWS/RUM/MetricsDestination.ts:293
     .putRumMetricsDestination({
0.89 packages/alchemy/src/AWS/Redshift/ClusterSubnetGroup.ts:142
     .describeClusterSubnetGroups({ ClusterSubnetGroupName: name })
0.89 packages/alchemy/src/AWS/ResourceExplorer/View.ts:61
     never,
0.89 packages/alchemy/src/AWS/SES/AccountSettings.ts:161
     const observe = sesv2.getAccount({}).pipe(
0.89 packages/alchemy/src/AWS/SES/CustomVerificationEmailTemplate.ts:161
     return yield* sesv2
0.89 packages/alchemy/src/AWS/SES/DedicatedIpPool.ts:261
     yield* sesv2
0.89 packages/alchemy/src/AWS/SSMIncidents/ResponsePlan.ts:232
     .createResponsePlan({
0.89 packages/alchemy/src/AWS/SageMaker/EndpointConfig.ts:142
     .listTags({ ResourceArn: arn })
0.89 packages/alchemy/src/AWS/ServiceCatalog/PrincipalPortfolioAssociation.ts:43
     never,
0.89 packages/alchemy/src/AWS/Transfer/Server.ts:222
     const response = yield* transfer
0.89 packages/alchemy/src/AWS/VerifiedPermissions/IdentitySource.ts:81
     identityTokenOnly?: never;
0.89 packages/alchemy/src/AWS/XRay/SamplingRule.ts:287
     live = yield* xray
0.89 packages/alchemy/src/Alchemist/routes/cloudflareToken.ts:172
     const result = yield* user.createToken({
0.89 packages/alchemy/src/Axiom/ApiToken.ts:95
     const tokens = yield* listTokens({});
0.89 packages/alchemy/src/Axiom/VirtualField.ts:59
     const create = yield* Axiom.createVirtualField;
0.89 packages/alchemy/src/Cloudflare/Access/Bookmark.ts:124
     const direct = yield* getBookmark(acct, output.bookmarkId);
0.89 packages/alchemy/src/Cloudflare/Access/Group.ts:182
     return yield* zeroTrust.listAccessGroupsForAccount
0.89 packages/alchemy/src/Cloudflare/Addressing/Prefix.ts:262
     .getPrefix({ accountId, prefixId })
0.89 packages/alchemy/src/Cloudflare/Alerting/NotificationPolicy.ts:250
     const created = yield* alerting.createPolicy({
0.89 packages/alchemy/src/Cloudflare/ApiToken/UserApiToken.ts:153
     ? yield* user.getToken({ tokenId: output.tokenId }).pipe(
0.89 packages/alchemy/src/Cloudflare/BotManagement/BotManagement.ts:321
     let observed = yield* botManagement.getBotManagement({ zoneId });
0.89 packages/alchemy/src/Cloudflare/Cache/SmartTieredCache.ts:178
     const observed = yield* cache.getSmartTieredCache({ zoneId });
0.89 packages/alchemy/src/Cloudflare/CloudConnector/Rules.ts:243
     yield* cloudConnector.putRule({
0.89 packages/alchemy/src/Cloudflare/Connectivity/DirectoryService.ts:349
     const created = yield* connectivity
0.89 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:330
     const response = yield* http.execute(request).pipe(
0.89 packages/alchemy/src/Cloudflare/CustomHostname/FallbackOrigin.ts:162
     const updated = yield* customHostnames.putFallbackOrigin({
0.89 packages/alchemy/src/Cloudflare/DdosProtection/AllowlistEntry.ts:240
     ddos.getAdvancedTcpProtectionAllowlistItem({ accountId, prefixId }).pipe(
0.89 packages/alchemy/src/Cloudflare/Devices/PostureIntegration.ts:224
     const observed = yield* observeIntegration(acct, output.integrationId);
0.89 packages/alchemy/src/Cloudflare/Devices/PostureRule.ts:206
     const observed = yield* observeRule(acct, output.postureRuleId);
0.89 packages/alchemy/src/Cloudflare/Flagship/App.ts:194
     const created = yield* flagship.createApp({ accountId, name });
0.89 packages/alchemy/src/Cloudflare/Gateway/Rule.ts:364
     const updated = yield* updateRule({
0.89 packages/alchemy/src/Cloudflare/Hyperdrive/Connection.ts:321
     .deleteConfig({
0.89 packages/alchemy/src/Cloudflare/Iam/ResourceGroup.ts:181
     const created = yield* iam.createResourceGroup({
0.89 packages/alchemy/src/Cloudflare/Iam/UserGroupMembership.ts:198
     .getUserGroupMember({ accountId, userGroupId, memberId })
0.89 packages/alchemy/src/Cloudflare/Intel/IndicatorFeedPermission.ts:133
     yield* intel.createIndicatorFeedPermission({
0.89 packages/alchemy/src/Cloudflare/LeakedCredentialCheck/Detection.ts:222
     observed = yield* lcc.createDetection({
0.89 packages/alchemy/src/Cloudflare/LoadBalancer/MonitorGroup.ts:181
     accountId,
0.89 packages/alchemy/src/Cloudflare/MagicTransit/IpsecTunnel.ts:221
     xMagicNewHcTarget: true,
0.89 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameCertificate.ts:221
     ? yield* observeById(zoneId, output.certificateId)
0.89 packages/alchemy/src/Cloudflare/Pipelines/Stream.ts:296
     ? yield* getStream(output.accountId ?? accountId, output.streamId)
0.89 packages/alchemy/src/Cloudflare/Registrar/Domain.ts:241
     yield* registrar.putDomain({ accountId, domainName, ...delta });
0.89 packages/alchemy/src/Cloudflare/Ruleset/AccountEntrypoint.ts:229
     const ruleset = yield* rulesets.putPhasForAccount({
0.89 packages/alchemy/src/Cloudflare/Ruleset/Ruleset.ts:184
     .getPhasForZone({
0.89 packages/alchemy/src/Cloudflare/Rum/Rule.ts:323
     yield* rum
0.89 packages/alchemy/src/Cloudflare/Snippets/Snippet.ts:248
     yield* snippets
0.89 packages/alchemy/src/Cloudflare/Ssl/UniversalSsl.ts:189
     const observed = yield* ssl.getUniversalSetting({ zoneId });
0.89 packages/alchemy/src/Cloudflare/Stream/Watermark.ts:293
     .getWatermark({ accountId, identifier: watermarkId })
0.89 packages/alchemy/src/Cloudflare/Tags/ZoneResourceTags.ts:241
     const observed = yield* resourceTagging
0.89 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexHttpClient.ts:64
     .getIndexInfo({ accountId, indexName: name })
0.89 packages/alchemy/src/Cloudflare/VpcService/VpcServiceLookup.ts:86
     const result = yield* connectivity.getDirectoryService({
0.89 packages/alchemy/src/Cloudflare/WaitingRoom/WaitingRoom.ts:384
     .deleteWaitingRoom({
0.89 packages/alchemy/src/Cloudflare/Workers/ObservabilityDestination.ts:297
     const patched = yield* workers
0.89 packages/alchemy/src/Cloudflare/WorkersForPlatforms/DispatchNamespace.ts:178
     return yield* wfp.listDispatchNamespaces.pages({ accountId }).pipe(
0.89 packages/alchemy/src/Fly/SecretKey.ts:249
     return machines.setSecretKey({
0.89 packages/alchemy/src/Git/Hasher/WorkerLoader.ts:108
     HttpClientRequest.post(`https://hasher${path}`).pipe(
0.89 packages/alchemy/src/Git/RegistryD1.ts:246
     .run(),
0.89 packages/alchemy/src/Neon/Credential.ts:87
     const { credentials } = yield* Neon.listCredentials(requestScope(scope));
0.89 packages/alchemy/src/Neon/CustomDomain.ts:39
     never,
0.89 packages/alchemy/src/Neon/FunctionTrigger.ts:181
     for (const project of yield* Neon.listProjects
0.89 packages/alchemy/src/Neon/OrganizationApiKey.ts:154
     Neon.Retry.none,
0.89 packages/alchemy/src/Neon/ProjectMemberRole.ts:203
     });
0.89 packages/alchemy/src/Planetscale/MySQL/MySQLDatabase.ts:394
     const updated = yield* planetscale.updateDatabaseSettings({
0.89 packages/alchemy/src/Prisma/BucketAccessKey.ts:294
     Retry.none,
0.89 packages/alchemy/src/Prisma/Connection.ts:485
     const connection = yield* getConnection({
0.89 packages/alchemy/src/Prisma/Internal/ArtifactUpload.ts:36
     const responseOption = yield* http.execute(request).pipe(
0.89 packages/alchemy/src/Prisma/SourceRepository.ts:541
     Retry.none,
0.89 packages/alchemy/src/Railway/AuditLog.ts:241
     const row = yield* railway.auditLog(
0.89 packages/alchemy/src/Railway/CloudAgent.ts:324
     return yield* railway.cloudAgentSleep(
0.89 packages/alchemy/src/SQL/Migrations/Convert.ts:89
     `SELECT hash, created_at, name, applied_at FROM ${qualify("__drizzle_migrations", dialect, drizzleSchema)} ORDER BY id;`
0.89 packages/alchemy/src/Stripe/Account.ts:470
     const response = yield* GetAccounts({
0.89 packages/alchemy/src/Stripe/BillingPortalConfiguration.ts:723
     const response = yield* GetBillingPortalConfigurations({
0.89 packages/alchemy/src/Stripe/IssuingCard.ts:447
     const response = yield* GetIssuingCards({
0.89 packages/alchemy/src/Stripe/IssuingPersonalizationDesign.ts:365
     const response = yield* GetIssuingPersonalizationDesigns({
0.89 packages/alchemy/src/Stripe/Price.ts:262
     GetPrice({ price }).pipe(
0.89 packages/alchemy/src/Stripe/PromotionCode.ts:219
     idOf(promo.promotion?.coupon) ?? "";
0.89 packages/alchemy/src/Stripe/RetrieveAccountExternalAccountHttp.ts:43
     return yield* auth(
0.89 packages/alchemy/src/Stripe/RetrieveProductFeatureHttp.ts:43
     GetProductFeature({
0.89 packages/alchemy/test/AWS/EFS/bindings-handler.ts:85
     const response = yield* describeFileSystem();
0.89 packages/alchemy/test/AWS/Glacier/bindings-handler.ts:73
     const response = yield* describeVault();
0.89 packages/alchemy/test/AWS/Lambda/bindings-handler.ts:50
     const response = yield* invokeFunction({});
0.89 packages/alchemy/test/AWS/S3/fixtures/server-event-source-task.ts:159
     return { run: Effect.never };
0.89 packages/alchemy/test/AWS/SimpleDB/handler.ts:43
     yield* putAttributes({
0.89 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:56
     const response = yield* fetch(
0.89 packages/alchemy/test/Cloudflare/D1/fixtures/async-worker.ts:21
     const result = await db.exec(
0.89 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:38
     .send({
0.89 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/local-worker.ts:42
     const rows = (yield* sql`
0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/object.ts:24
     const response = await fetch(
0.89 packages/alchemy/test/Railway/fixtures/mysql-api.ts:43
     const rows = yield* db.execute("select 1 as ok", "objects");
0.89 packages/alchemy/test/Railway/suiteProject.ts:46
     railway.projects
0.89 packages/alchemy/test/Stripe/fixtures/event-source-worker.ts:41
     const customer = yield* createCustomer({
0.89 packages/cloudflare-runtime/src/vite/assets/assets.worker.ts:53
     const response = await this.env.__VITE_FETCH_HTML__.fetch(url);
0.89 packages/pkg/src/Registry/Sweep.ts:38
     return github.getPullRequest(repo!, Number(number)).pipe(
0.88 packages/alchemy/src/AWS/AMP/GetMetricMetadataHttp.ts:16
     send({
0.88 packages/alchemy/src/AWS/AMP/LoggingConfiguration.ts:69
     .describeLoggingConfiguration({ workspaceId })
0.88 packages/alchemy/src/AWS/AMP/ScraperLoggingConfiguration.ts:84
     .describeScraperLoggingConfiguration({ scraperId })
0.88 packages/alchemy/src/AWS/AccessAnalyzer/Analyzer.ts:234
     .createAnalyzer({
0.88 packages/alchemy/src/AWS/AccessAnalyzer/ArchiveRule.ts:116
     return yield* aa.getArchiveRule({ analyzerName, ruleName }).pipe(
0.88 packages/alchemy/src/AWS/ApiGateway/DomainName.ts:162
     ag.getDomainNames.pages({}).pipe(
0.88 packages/alchemy/src/AWS/ApiGateway/UsagePlan.ts:321
     .getUsagePlan({ usagePlanId: output.id })
0.88 packages/alchemy/src/AWS/ApiGatewayV2/DomainName.ts:217
     const final = yield* agw2.getDomainName({ DomainName: name });
0.88 packages/alchemy/src/AWS/AppConfig/Environment.ts:134
     const envs = yield* appconfig.listEnvironments
0.88 packages/alchemy/src/AWS/AppRegistry/AttributeGroup.ts:107
     .getAttributeGroup({ attributeGroup: specifier })
0.88 packages/alchemy/src/AWS/AuditManager/Assessment.ts:222
     const pages = yield* auditmanager.listAssessments
0.88 packages/alchemy/src/AWS/AutoScaling/AutoScalingGroup.ts:161
     never,
0.88 packages/alchemy/src/AWS/BackupSearch/ExportJob.ts:67
     never,
0.88 packages/alchemy/src/AWS/BedrockDataAutomation/DataAutomationLibrary.ts:149
     const summaries = yield* bda.listDataAutomationLibraries
0.88 packages/alchemy/src/AWS/CloudFront/VpcOrigin.ts:181
     const response = yield* cloudfront.listTagsForResource({
0.88 packages/alchemy/src/AWS/Config/ConfigurationRecorder.ts:393
     yield* config
0.88 packages/alchemy/src/AWS/CostExplorer/CostCategory.ts:242
     ce.createCostCategoryDefinition({
0.88 packages/alchemy/src/AWS/DMS/ReplicationInstance.ts:416
     dms.describeReplicationInstances.pages({}).pipe(
0.88 packages/alchemy/src/AWS/DataSync/internal.ts:34
     const res = yield* datasync.listTagsForResource({ ResourceArn: resourceArn });
0.88 packages/alchemy/src/AWS/DevOpsGuru/NotificationChannel.ts:41
     never,
0.88 packages/alchemy/src/AWS/EC2/NatGateway.ts:262
     : Effect.fail(new Error(`NAT Gateway ${natGatewayId} not found`)),
0.88 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:282
     const result = yield* ec2.createNetworkAcl({
0.88 packages/alchemy/src/AWS/EC2/NetworkInterface.ts:231
     .describeNetworkInterfaces({
0.88 packages/alchemy/src/AWS/EC2/VpcEndpoint.ts:441
     const lookup = yield* ec2
0.88 packages/alchemy/src/AWS/ECR/GetAuthorizationTokenHttp.ts:35
     return yield* op({});
0.88 packages/alchemy/src/AWS/ECR/Image.ts:81
     yield* docker.image.build({
0.88 packages/alchemy/src/AWS/ECR/Repository.ts:201
     .describeRepositories({
0.88 packages/alchemy/src/AWS/ECS/Cluster.ts:201
     .pipe(Effect.map((res) => res.clusters ?? [])),
0.88 packages/alchemy/src/AWS/ECS/EcsDevWatch.ts:39
     const clusters = yield* ecs.listClusters({});
0.88 packages/alchemy/src/AWS/EKS/AccessEntry.ts:183
     .createAccessEntry({
0.88 packages/alchemy/src/AWS/ELBv2/Listener.ts:341
     const described = yield* elbv2
0.88 packages/alchemy/src/AWS/ELBv2/ListenerRule.ts:181
     .pipe(
0.88 packages/alchemy/src/AWS/EntityResolution/SchemaMapping.ts:115
     .getSchemaMapping({ schemaName })
0.88 packages/alchemy/src/AWS/EventBridge/ApiDestination.ts:144
     .describeApiDestination({ Name: name })
0.88 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:699
     .deleteExperimentTemplate({ id: output.id })
0.88 packages/alchemy/src/AWS/FraudDetector/DetectorVersion.ts:242
     const created = yield* frauddetector.createDetectorVersion({
0.88 packages/alchemy/src/AWS/FraudDetector/Variable.ts:104
     .getVariables({ name })
0.88 packages/alchemy/src/AWS/Glue/Connection.ts:199
     const connection = yield* observe(name, catalogId);
0.88 packages/alchemy/src/AWS/GuardDuty/Filter.ts:141
     .getFilter({ DetectorId: detectorId, FilterName: name })
0.88 packages/alchemy/src/AWS/IAM/SAMLProvider.ts:281
     const observedTagsResp = yield* iam.listSAMLProviderTags({
0.88 packages/alchemy/src/AWS/IAM/VirtualMFADevice.ts:61
     never,
0.88 packages/alchemy/src/AWS/IoT/ThingType.ts:46
     never,
0.88 packages/alchemy/src/AWS/IoTManagedIntegrations/ManagedThing.ts:161
     const summary = yield* mi.listManagedThings.items({}).pipe(
0.88 packages/alchemy/src/AWS/IoTWireless/Destination.ts:263
     destination = yield* getDestination(name);
0.88 packages/alchemy/src/AWS/Kinesis/StreamConsumer.ts:442
     .listTagsForResource({ ResourceARN: consumer.ConsumerARN })
0.88 packages/alchemy/src/AWS/LakeFormation/DataCellsFilter.ts:275
     yield* lf.updateDataCellsFilter({
0.88 packages/alchemy/src/AWS/LakeFormation/LFTag.ts:75
     .getLFTag({ TagKey: tagKey, CatalogId: catalogId })
0.88 packages/alchemy/src/AWS/MailManager/Relay.ts:123
     .getRelay({ RelayId: relayId })
0.88 packages/alchemy/src/AWS/MediaPackageV2/ChannelGroup.ts:115
     .getChannelGroup({ ChannelGroupName: channelGroupName })
0.88 packages/alchemy/src/AWS/MemoryDB/ACL.ts:90
     .describeACLs({ ACLName: name })
0.88 packages/alchemy/src/AWS/MemoryDB/User.ts:125
     return response?.Users?.[0];
0.88 packages/alchemy/src/AWS/Neptune/DBClusterParameterGroup.ts:361
     neptune.describeDBClusterParameterGroups.pages({}).pipe(
0.88 packages/alchemy/src/AWS/NotificationsContacts/EmailContact.ts:101
     return yield* contacts.listTagsForResource({ arn }).pipe(
0.88 packages/alchemy/src/AWS/Omics/ReferenceStore.ts:146
     .getReferenceStore({ id: output.referenceStoreId })
0.88 packages/alchemy/src/AWS/QBusiness/Retriever.ts:242
     .getRetriever({ applicationId, retrieverId })
0.88 packages/alchemy/src/AWS/QBusiness/SearchIndex.ts:419
     yield* qbusiness
0.88 packages/alchemy/src/AWS/QBusiness/WebExperience.ts:321
     const created = yield* qbusiness.createWebExperience({
0.88 packages/alchemy/src/AWS/RAM/Permission.ts:282
     .createPermission({
0.88 packages/alchemy/src/AWS/Route53/HostedZone.ts:321
     const existing = yield* findByName(news.name);
0.88 packages/alchemy/src/AWS/S3Control/StorageLensConfiguration.ts:321
     yield* s3control
0.88 packages/alchemy/src/AWS/S3Tables/TableBucket.ts:141
     return yield* s3tables.getTableBucket({ tableBucketARN: arn }).pipe(
0.88 packages/alchemy/src/AWS/SES/ReceiptFilter.ts:96
     .listReceiptFilters({})
0.88 packages/alchemy/src/AWS/SES/ReceiptRule.ts:242
     yield* ses
0.88 packages/alchemy/src/AWS/SSM/Parameter.ts:327
     const meta = yield* describeByName(name).pipe(
0.88 packages/alchemy/src/AWS/SSMContacts/Contact.ts:295
     .getContactPolicy({ ContactArn: contact.ContactArn })
0.88 packages/alchemy/src/AWS/SSMContacts/Plan.ts:123
     const contact = yield* contacts.getContact({
0.88 packages/alchemy/src/AWS/Schemas/Discoverer.ts:99
     .describeDiscoverer({ DiscovererId: discovererId })
0.88 packages/alchemy/src/AWS/SecretsManager/BatchGetSecretValueHttp.ts:70
     return yield* batchGetSecretValue({
0.88 packages/alchemy/src/AWS/SecurityLake/SubscriberNotification.ts:221
     .createSubscriberNotification({
0.88 packages/alchemy/src/AWS/Signer/SigningProfile.ts:204
     .getSigningProfile({ profileName })
0.88 packages/alchemy/src/AWS/SimpleDB/Domain.ts:146
     yield* sdb.createDomain({ DomainName: name });
0.88 packages/alchemy/src/AWS/StepFunctions/Activity.ts:128
     .describeActivity({ activityArn })
0.88 packages/alchemy/src/AWS/VerifiedPermissions/Policy.ts:160
     .getPolicy({ policyStoreId, policyId })
0.88 packages/alchemy/src/AWS/VerifiedPermissions/PolicyStore.ts:106
     .getPolicyStore({ policyStoreId, tags: true })
0.88 packages/alchemy/src/Axiom/Monitor.ts:106
     const monitors = yield* list({});
0.88 packages/alchemy/src/Cloudflare/AI/GatewayProvider.ts:381
     const created = yield* aiGateway
0.88 packages/alchemy/src/Cloudflare/Access/IdentityProvider.ts:641
     const observed = yield* getIdp(zoneId, acct, output.identityProviderId);
0.88 packages/alchemy/src/Cloudflare/Access/KeyConfiguration.ts:99
     const observed = yield* zeroTrust.getAccessKey({ accountId });
0.88 packages/alchemy/src/Cloudflare/Addressing/BgpPrefix.ts:281
     yield* addressing
0.88 packages/alchemy/src/Cloudflare/Alerting/Webhook.ts:281
     .deleteDestinationWebhook({
0.88 packages/alchemy/src/Cloudflare/CustomCertificate/CustomCertificate.ts:462
     customCertificates.getCustomCertificate({ zoneId, customCertificateId }).pipe(
0.88 packages/alchemy/src/Cloudflare/DNS/Record.ts:441
     yield* dns
0.88 packages/alchemy/src/Cloudflare/Dlp/Profile.ts:171
     const created = yield* zeroTrust.createDlpProfileCustom({
0.88 packages/alchemy/src/Cloudflare/EdgeSession.ts:71
     const json = yield* http.get(exchangeUrl).pipe(
0.88 packages/alchemy/src/Cloudflare/Email/Address.ts:88
     emailRouting.listAddresses.pages({ accountId }).pipe(
0.88 packages/alchemy/src/Cloudflare/Email/CatchAll.ts:282
     .putRuleCatchAll({
0.88 packages/alchemy/src/Cloudflare/Firewall/AccessRule.ts:249
     ? yield* getRule(zoneId, accountId, output.ruleId)
0.88 packages/alchemy/src/Cloudflare/Firewall/Lockdown.ts:201
     const observed = yield* getLockdown(zoneId, output.lockdownId);
0.88 packages/alchemy/src/Cloudflare/KV/ReadNamespaceHttp.ts:43
     kv.getNamespaceValue({ accountId, namespaceId, keyName: key }),
0.88 packages/alchemy/src/Cloudflare/KeylessCertificate/KeylessCertificate.ts:245
     keylessCertificates.listKeylessCertificates
0.88 packages/alchemy/src/Cloudflare/LoadBalancer/Monitor.ts:321
     Stream.runCollect,
0.88 packages/alchemy/src/Cloudflare/Logpush/Job.ts:544
     ? logpush.updateJobForZone({ zoneId: scope.zoneId, jobId, ...body })
0.88 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:162
     ? yield* getPipeline(output.accountId ?? accountId, output.pipelineId)
0.88 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:501
     pipelines.listSinks.items({ accountId }).pipe(
0.88 packages/alchemy/src/Cloudflare/Queues/Queue.ts:162
     observed = yield* findQueueByName(queueName);
0.88 packages/alchemy/src/Cloudflare/Queues/WriteQueueHttp.ts:68
     queues.bulkPushMessages({
0.88 packages/alchemy/src/Cloudflare/R2/SuperSlurperJob.ts:261
     Retry.none,
0.88 packages/alchemy/src/Cloudflare/Ruleset/CustomRuleset.ts:186
     .getRulesetForAccount({
0.88 packages/alchemy/src/Cloudflare/SchemaValidation/Schema.ts:209
     const observed = yield* getSchema(zoneId, output.schemaId);
0.88 packages/alchemy/src/Cloudflare/WaitingRoom/Settings.ts:186
     const observed = yield* waitingRooms.getSetting({ zoneId });
0.88 packages/alchemy/src/Cloudflare/Workers/BrowserHttpClient.ts:84
     run(browser.createContent(req(options))).pipe(
0.88 packages/alchemy/src/Fly/DecryptHttp.ts:39
     const res = yield* auth.authorize(
0.88 packages/alchemy/src/Fly/EncryptHttp.ts:37
     const res = yield* auth.authorize(
0.88 packages/alchemy/src/Fly/IpAssignment.ts:460
     ? yield* findByIp(appName, output.ip)
0.88 packages/alchemy/src/Git/Store/ObjectStore.ts:521
     return yield* body.bytes.pipe(
0.88 packages/alchemy/src/Hetzner/RecordSet.ts:161
     never,
0.88 packages/alchemy/src/Planetscale/AuthProvider.ts:81
     const orgs = response.data;
0.88 packages/alchemy/src/Planetscale/Branch.ts:461
     current = yield* planetscale.createBranch({
0.88 packages/alchemy/src/Prisma/Database.ts:891
     yield* deleteDatabase({
0.88 packages/alchemy/src/Prisma/Deployment.ts:701
     yield* uploadArtifact(
0.88 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:30
     createDeploymentStart({ deploymentId }).pipe(
0.88 packages/alchemy/src/Prisma/Project.ts:525
     Retry.none,
0.88 packages/alchemy/src/Railway/Bind.ts:83
     fetch(
0.88 packages/alchemy/src/Railway/CustomDomain.ts:282
     .domains(
0.88 packages/alchemy/src/Railway/ProjectEnvironment.ts:244
     .items({ projectId, first: 50 }, environmentSelection)
0.88 packages/alchemy/src/Railway/TcpProxy.ts:401
     const created = yield* railway
0.88 packages/alchemy/src/Stripe/IssuingCardholder.ts:903
     yield* UpdateIssuingCardholder({
0.88 packages/alchemy/src/Stripe/RetrieveCustomerTaxIdHttp.ts:42
     return yield* auth(
0.88 packages/alchemy/test/AWS/ApplicationAutoScaling/handler.ts:72
     yield* ApplicationAutoScaling.GetPredictiveScalingForecast(policy);
0.88 packages/alchemy/test/AWS/Comprehend/handler.ts:221
     const pii = yield* detectPiiEntities({
0.88 packages/alchemy/test/AWS/DocDB/handler.ts:82
     const tag = yield* describeDBClusters({
0.88 packages/alchemy/test/AWS/ELBv2/fixtures/acm.ts:36
     const imported = yield* acm.importCertificate({
0.88 packages/alchemy/test/AWS/IoTSiteWise/fixtures/handler.ts:181
     queryStatement: `SELECT asset_id, asset_name FROM asset WHERE asset_id = '${described.assetId}'`,
0.88 packages/alchemy/test/AWS/LakeFormation/handler.ts:101
     const result = yield* listLFTags().pipe(
0.88 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/orchestrator.ts:84
     `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
0.88 packages/alchemy/test/AWS/MediaConvert/handler.ts:55
     const result = yield* listJobs({ MaxResults: 5 });
0.88 packages/alchemy/test/AWS/SNS/platform-handler.ts:78
     const created = yield* createEndpoint({ Token: body.token });
0.88 packages/alchemy/test/AWS/SecretsManager/handler.ts:61
     const getBinarySecret = yield* SecretsManager.GetSecretValue(binarySecret);
0.88 packages/alchemy/test/AWS/SocialMessaging/bindings-handler.ts:142
     const typed = yield* getPhoneNumber({ id: BOGUS_PHONE_ID }).pipe(
0.88 packages/alchemy/test/AWS/Textract/handler.ts:163
     const result = yield* getDocumentTextDetection({ JobId: jobId });
0.88 packages/alchemy/test/Cloudflare/Vectorize/fixtures/async-worker.ts:29
     const mutation = await index.upsert(seedVectors(LABEL));
0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/workflow.ts:33
     const [row] = yield* db
0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-rpc-do/object.ts:30
     yield* db.exec(
0.88 packages/alchemy/test/Neon/fixtures/function-effect.ts:27
     yield* sql`INSERT INTO alchemy_function_lifecycle (id, phase) VALUES (${id}, ${phase}) ON CONFLICT DO NOTHING`;
0.88 packages/alchemy/test/Neon/fixtures/function-layer.ts:17
     const response = yield* invoke.fetch().pipe(Effect.orDie);
0.88 packages/cloudflare-runtime/src/core/bindings/dispatch-namespace/dispatch-namespace.worker.ts:18
     return env.proxyClient.fetch(new Request(request, { headers }));
0.88 packages/cloudflare-runtime/src/core/bindings/queue/Queue.ts:274
     fetch(endpoint, {
0.88 packages/cloudflare-runtime/src/core/bindings/stream/Stream.worker.ts:681
     const response = await fetch(url);
0.87 packages/alchemy/scripts/clean-aws.ts:301
     ec2.deleteNatGateway({ NatGatewayId: id } as any),
0.87 packages/alchemy/src/AWS/AMP/Workspace.ts:301
     const workspace = yield* amp.describeWorkspace({ workspaceId }).pipe(
0.87 packages/alchemy/src/AWS/Account/ContactInformation.ts:126
     account.getContactInformation({ AccountId: accountId }).pipe(
0.87 packages/alchemy/src/AWS/ApiGateway/GatewayResource.ts:222
     .getResource({
0.87 packages/alchemy/src/AWS/ApiGatewayV2/Stage.ts:101
     never,
0.87 packages/alchemy/src/AWS/AppConfig/Extension.ts:205
     const summaries = yield* appconfig.listExtensions
0.87 packages/alchemy/src/AWS/AppRegistry/ResourceAssociation.ts:123
     .getApplication({ application: specifier })
0.87 packages/alchemy/src/AWS/AuditManager/Control.ts:208
     const pages = yield* auditmanager.listControls
0.87 packages/alchemy/src/AWS/Backup/BackupSelection.ts:181
     SelectionId: output.selectionId,
0.87 packages/alchemy/src/AWS/Bedrock/LanguageModel.ts:289
     const response = yield* converseStream(request).pipe(
0.87 packages/alchemy/src/AWS/BedrockDataAutomation/Blueprint.ts:321
     Effect.catchTag("ResourceNotFoundException", () => Effect.void),
0.87 packages/alchemy/src/AWS/Budgets/Budget.ts:336
     .listTagsForResource({ ResourceARN: arn })
0.87 packages/alchemy/src/AWS/Chatbot/Association.ts:159
     yield* chatbot.associateToConfiguration({
0.87 packages/alchemy/src/AWS/CloudTrail/StartQueryHttp.ts:43
     return yield* startQuery({
0.87 packages/alchemy/src/AWS/CloudTrail/Trail.ts:381
     cloudtrail.getTrail({ Name: name }).pipe(
0.87 packages/alchemy/src/AWS/CodeDeploy/DeploymentConfig.ts:153
     .getDeploymentConfig({ deploymentConfigName: name })
0.87 packages/alchemy/src/AWS/Cognito/ManagedLoginBranding.ts:282
     observed = yield* cip
0.87 packages/alchemy/src/AWS/Cognito/UserPool.ts:683
     return yield* cip.describeUserPool({ UserPoolId: userPoolId }).pipe(
0.87 packages/alchemy/src/AWS/Config/RetentionConfiguration.ts:69
     const observeRetention = config.describeRetentionConfigurations({}).pipe(
0.87 packages/alchemy/src/AWS/CostExplorer/AnomalyMonitor.ts:62
     never,
0.87 packages/alchemy/src/AWS/DataBrew/Ruleset.ts:200
     const ruleset = yield* observe(name);
0.87 packages/alchemy/src/AWS/DataSync/Task.ts:130
     .describeTask({ TaskArn: taskArn })
0.87 packages/alchemy/src/AWS/DocDB/DBInstance.ts:422
     yield* docdb
0.87 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:241
     return toTagRecord(response?.tags);
0.87 packages/alchemy/src/AWS/DynamoDB/RestoreTableToPointInTimeHttp.ts:55
     return yield* restoreTableToPointInTime({
0.87 packages/alchemy/src/AWS/EC2/EgressOnlyInternetGateway.ts:278
     const result = yield* ec2.createEgressOnlyInternetGateway({
0.87 packages/alchemy/src/AWS/EC2/RouteTable.ts:541
     .describeRouteTables({ RouteTableIds: [routeTableId] })
0.87 packages/alchemy/src/AWS/EC2/Vpc.ts:461
     const dnsSupportResult = yield* ec2.describeVpcAttribute({
0.87 packages/alchemy/src/AWS/EC2/VpcPeeringConnection.ts:305
     const result = yield* ec2.createVpcPeeringConnection({
0.87 packages/alchemy/src/AWS/ELBv2/TargetGroupAttachment.ts:151
     .describeTargetHealth({ TargetGroupArn: output.targetGroupArn })
0.87 packages/alchemy/src/AWS/EMR/Studio.ts:424
     .deleteStudio({ StudioId: output.studioId })
0.87 packages/alchemy/src/AWS/EMRContainers/DescribeVirtualClusterHttp.ts:42
     return yield* op({ id: yield* VirtualClusterId });
0.87 packages/alchemy/src/AWS/EMRContainers/StartJobRunHttp.ts:42
     return yield* op({
0.87 packages/alchemy/src/AWS/EMRServerless/Application.ts:254
     ? yield* observeById(applicationId)
0.87 packages/alchemy/src/AWS/EventBridge/StartReplayHttp.ts:57
     return yield* startReplay({
0.87 packages/alchemy/src/AWS/FinSpace/Environment.ts:390
     yield* finspace.updateEnvironment({
0.87 packages/alchemy/src/AWS/Grafana/CreateWorkspaceServiceAccountTokenHttp.ts:45
     return yield* op({
0.87 packages/alchemy/src/AWS/GuardDuty/Detector.ts:58
     never,
0.87 packages/alchemy/src/AWS/Inspector2/CisScanConfiguration.ts:133
     .listCisScanConfigurations({ filterCriteria: filter })
0.87 packages/alchemy/src/AWS/IoTManagedIntegrations/internal.ts:44
     yield* mi.tagResource({
0.87 packages/alchemy/src/AWS/IoTWireless/WirelessDevice.ts:408
     const tags = yield* readIotWirelessTags(attrs.wirelessDeviceArn);
0.87 packages/alchemy/src/AWS/LexV2/internal.ts:197
     .listTagsForResource({ resourceARN: arn })
0.87 packages/alchemy/src/AWS/Logs/LogGroup.ts:441
     logs.describeLogGroups
0.87 packages/alchemy/src/AWS/Logs/ResourcePolicy.ts:88
     .describeResourcePolicies({ limit: 50 })
0.87 packages/alchemy/src/AWS/MailManager/TrafficPolicy.ts:61
     never,
0.87 packages/alchemy/src/AWS/MediaLive/internal.ts:100
     .listTagsForResource({ ResourceArn: arn })
0.87 packages/alchemy/src/AWS/MediaPackageV2/OriginEndpoint.ts:441
     ChannelName: channelName,
0.87 packages/alchemy/src/AWS/MediaPackageV2/internal.ts:31
     yield* mediapackagev2.tagResource({
0.87 packages/alchemy/src/AWS/Neptune/DBInstance.ts:101
     never,
0.87 packages/alchemy/src/AWS/Omics/SequenceStore.ts:77
     never,
0.87 packages/alchemy/src/AWS/Omics/Workflow.ts:201
     .getWorkflow({ id: output.workflowId })
0.87 packages/alchemy/src/AWS/Personalize/DatasetGroup.ts:142
     const pages = yield* personalize.listDatasetGroups
0.87 packages/alchemy/src/AWS/Personalize/EventTracker.ts:146
     const pages = yield* personalize.listEventTrackers
0.87 packages/alchemy/src/AWS/RAM/ResourceShare.ts:354
     .deleteResourceShare({
0.87 packages/alchemy/src/AWS/RDS/DBParameterGroup.ts:181
     return yield* rds.describeDBParameters
0.87 packages/alchemy/src/AWS/RDS/DBProxy.ts:201
     const response = yield* rds
0.87 packages/alchemy/src/AWS/RDS/DBProxyEndpoint.ts:281
     DBProxyEndpointName: dbProxyEndpointName,
0.87 packages/alchemy/src/AWS/RePostSpace/Space.ts:541
     .deleteSpace({ spaceId: output.spaceId })
0.87 packages/alchemy/src/AWS/Redshift/EventSubscription.ts:281
     yield* redshift
0.87 packages/alchemy/src/AWS/RedshiftServerless/Workgroup.ts:416
     redshiftserverless.listWorkgroups.pages({}).pipe(
0.87 packages/alchemy/src/AWS/S3Tables/Namespace.ts:100
     .getNamespace({ tableBucketARN: tableBucketArn, namespace })
0.87 packages/alchemy/src/AWS/SES/ContactList.ts:261
     sesv2.updateContactList({
0.87 packages/alchemy/src/AWS/SES/MultiRegionEndpoint.ts:341
     .deleteMultiRegionEndpoint({ EndpointName: output.endpointName })
0.87 packages/alchemy/src/AWS/Scheduler/Schedule.ts:322
     yield* scheduler
0.87 packages/alchemy/src/AWS/Schemas/Registry.ts:197
     live = yield* schemas.describeRegistry({
0.87 packages/alchemy/src/AWS/Schemas/Schema.ts:130
     .describeSchema({
0.87 packages/alchemy/src/AWS/Timestream/DbInstance.ts:241
     EffectStream.runCollect,
0.87 packages/alchemy/src/AWS/Timestream/ExecuteScheduledQueryHttp.ts:57
     executeScheduledQuery({
0.87 packages/alchemy/src/AWS/VerifiedPermissions/GetPoliciesHttp.ts:42
     return yield* batchGetPolicy({
0.87 packages/alchemy/src/Cloudflare/AI/SearchToken.ts:207
     .createToken({ accountId: acct, ...body })
0.87 packages/alchemy/src/Cloudflare/Access/IdentityProviderLookup.ts:52
     ? zeroTrust.getIdentityProviderForZone({ zoneId, identityProviderId })
0.87 packages/alchemy/src/Cloudflare/DNS/ZoneTransferIncoming.ts:232
     .getZoneTransferIncoming({ zoneId })
0.87 packages/alchemy/src/Cloudflare/Email/Domain.ts:277
     return yield* emailSecurity.listSettingDomains.pages({ accountId }).pipe(
0.87 packages/alchemy/src/Cloudflare/Email/Rule.ts:139
     .getRule({
0.87 packages/alchemy/src/Cloudflare/Gateway/Certificate.ts:278
     zeroTrust.getGatewayCertificate({ accountId, certificateId }).pipe(
0.87 packages/alchemy/src/Cloudflare/Pages/Deployment.ts:249
     observed = yield* pages.createProjectDeployment({
0.87 packages/alchemy/src/Cloudflare/Pipelines/LegacyPipeline.ts:402
     const response = yield* pipelines.listPipelines({
0.87 packages/alchemy/src/Cloudflare/R2/BucketEventNotification.ts:274
     const { accountId } = yield* yield* CloudflareEnvironment;
0.87 packages/alchemy/src/Cloudflare/Snippets/SnippetRules.ts:197
     yield* snippets.putRule({ zoneId, rules: desired });
0.87 packages/alchemy/src/Cloudflare/Ssl/CertificatePack.ts:321
     observed = yield* ssl.createCertificatePack({
0.87 packages/alchemy/src/Fly/Secret.ts:263
     machines
0.87 packages/alchemy/src/Fly/Volume.ts:42
     machines.getVolumeById({ app_name: appName, volume_id: volumeId }).pipe(
0.87 packages/alchemy/src/Hetzner/Zone.ts:202
     Hetzner.zones.getZone({ id_or_name: idOrName }).pipe(
0.87 packages/alchemy/src/Planetscale/MySQL/MySQLClusterSize.ts:49
     ps.listKeyspaces({ organization, database, branch }),
0.87 packages/alchemy/src/Railway/GraphQL.ts:38
     const project = yield* railway.project(
0.87 packages/alchemy/src/Redis/Client.ts:261
     hkeys: (key) => command(url, "HKEYS", [key]).pipe(Effect.map(asStringArray)),
0.87 packages/alchemy/src/Stripe/CreditGrant.ts:382
     GetBillingCreditGrant({ id }).pipe(
0.87 packages/alchemy/src/Stripe/RetrieveAccountPersonHttp.ts:42
     return yield* auth(
0.87 packages/alchemy/src/TelemetryRuntime.ts:205
     base.execute(
0.87 packages/alchemy/test/AWS/AppRunner/logGroups.ts:21
     .describeLogGroups({ logGroupNamePrefix: logGroupName, limit: 1 })
0.87 packages/alchemy/test/AWS/AutoScaling/TestNetwork.ts:20
     .describeImages({
0.87 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:87
     const result = yield* describeQuery({ QueryId: param("id") });
0.87 packages/alchemy/test/AWS/ControlTower/handler.ts:41
     const listLandingZones = yield* ControlTower.ListLandingZones();
0.87 packages/alchemy/test/AWS/Glue/handler.ts:111
     const getTables = yield* Glue.GetTables(database);
0.87 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:133
     `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
0.87 packages/alchemy/test/AWS/MQ/bindings-handler.ts:74
     const response = yield* describeBroker();
0.87 packages/alchemy/test/AWS/MediaConnect/fixtures/handler.ts:93
     const { Flow: current } = yield* describeFlow();
0.87 packages/alchemy/test/AWS/OpenSearch/data-plane-handler.ts:149
     const health = (yield* client.request("GET", "_cluster/health")) as {
0.87 packages/alchemy/test/AWS/QuickSight/bindings-handler.ts:97
     const response = yield* listIngestions({ MaxResults: 10 });
0.87 packages/alchemy/test/AWS/RDSData/handler.ts:101
     const result = yield* executeStatement({ sql: "SELECT 1" });
0.87 packages/alchemy/test/AWS/RedshiftServerless/fixtures/query-handler.ts:47
     const result = yield* sql.query("SELECT 1 AS n");
0.87 packages/alchemy/test/AWS/Smoke/fixtures/api-handler.ts:188
     const result = yield* sendMessage({ MessageBody: body.message });
0.87 packages/alchemy/test/Cloudflare/AI/fixtures/AiAsyncHandler.ts:13
     const result = await env.AI.run(MODEL, {
0.87 packages/alchemy/test/Cloudflare/Dns/fixtures/effect.ts:36
     const leftovers = yield* dns.listDnsRecords({
0.87 packages/alchemy/test/Cloudflare/Tunnel/fixtures/effect.ts:36
     .pipe(Effect.orDie);
0.87 packages/alchemy/test/Fly/fixtures/bucket-api.ts:64
     }).pipe(Effect.orDie);
0.87 packages/alchemy/test/Fly/fixtures/redis-api.ts:61
     yield* cache.set(REDIS_KEY, REDIS_VALUE).pipe(Effect.orDie);
0.87 packages/alchemy/test/Railway/fixtures/mongo-api.ts:41
     const ping = yield* Railway.pingMongo(Redacted.value(url));
0.87 packages/cloudflare-runtime/src/core/bindings/queue/QueueBroker.worker.ts:384
     });
0.87 packages/cloudflare-runtime/src/core/internal/shared.worker.ts:276
     const res = await fetcher.fetch(url, { headers: rangeHeaders(range) });
0.87 packages/cloudflare-runtime/src/core/remote-bindings/RemoteWorker.ts:80
     const json = yield* http.get(exchangeUrl).pipe(
0.87 packages/cloudflare-runtime/src/core/test/sandbox.ts:36
     const res = await fetch(new URL("/", proxyInstance.url));
0.86 packages/alchemy/src/AWS/AMP/GetDefaultScraperConfigurationHttp.ts:33
     const response = yield* getDefaultScraperConfiguration({});
0.86 packages/alchemy/src/AWS/Account/AccountName.ts:96
     yield* account.putAccountName({
0.86 packages/alchemy/src/AWS/ApiGateway/DeleteUsagePlanKeyHttp.ts:34
     return yield* deleteUsagePlanKey({
0.86 packages/alchemy/src/AWS/AppConfig/Deployment.ts:95
     .getDeployment({
0.86 packages/alchemy/src/AWS/AppRunner/VpcConnector.ts:143
     apprunner.listVpcConnectors.pages({}).pipe(
0.86 packages/alchemy/src/AWS/Assets.ts:119
     .headObject({ Bucket: yield* bucketName, Key: key })
0.86 packages/alchemy/src/AWS/BCMDataExports/Export.ts:410
     yield* bcm.tagResource({
0.86 packages/alchemy/src/AWS/Bedrock/KnowledgeBase.ts:182
     return yield* bedrock.listTagsForResource({ resourceArn }).pipe(
0.86 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:362
     const found = yield* budgets
0.86 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:146
     const response = yield* cloudfront.createInvalidation({
0.86 packages/alchemy/src/AWS/CloudHSMV2/Cluster.ts:378
     yield* cloudhsm.deleteCluster({ ClusterId: clusterId }).pipe(
0.86 packages/alchemy/src/AWS/CodeBuild/Project.ts:510
     codebuild.createProject({ name, ...spec }),
0.86 packages/alchemy/src/AWS/CodeBuild/ReportGroup.ts:301
     .pipe(Effect.map((res) => res.reportGroups ?? [])),
0.86 packages/alchemy/src/AWS/CodePipeline/Pipeline.ts:141
     never,
0.86 packages/alchemy/src/AWS/Credentials.ts:78
     const response = yield* sts
0.86 packages/alchemy/src/AWS/DMS/ReplicationSubnetGroup.ts:123
     const response = yield* dms
0.86 packages/alchemy/src/AWS/DSQL/Cluster.ts:109
     const response = yield* dsql
0.86 packages/alchemy/src/AWS/Deadline/internal.ts:261
     (limit) => deadline.deleteLimit({ farmId, limitId: limit.limitId }),
0.86 packages/alchemy/src/AWS/DynamoDB/RestoreTableFromBackupHttp.ts:55
     return yield* restoreTableFromBackup({
0.86 packages/alchemy/src/AWS/EC2/DhcpOptions.ts:322
     yield* ec2.associateDhcpOptions({
0.86 packages/alchemy/src/AWS/EC2/NetworkInterfaceAttachment.ts:281
     NetworkInterfaceIds: [networkInterfaceId],
0.86 packages/alchemy/src/AWS/EC2/PrefixList.ts:396
     (yield* ec2
0.86 packages/alchemy/src/AWS/EC2/Route.ts:421
     return yield* ec2.describeRouteTables.pages({}).pipe(
0.86 packages/alchemy/src/AWS/EC2/SecurityGroupRule.ts:423
     return yield* describeRule(output.securityGroupRuleId).pipe(
0.86 packages/alchemy/src/AWS/EC2/Snapshot.ts:181
     VolumeId: news.volumeId,
0.86 packages/alchemy/src/AWS/ECR/RegistryPolicy.ts:72
     .getRegistryPolicy({})
0.86 packages/alchemy/src/AWS/EKS/Addon.ts:142
     const response = yield* eks
0.86 packages/alchemy/src/AWS/ELBv2/LoadBalancer.ts:201
     LoadBalancerArns: [output.loadBalancerArn],
0.86 packages/alchemy/src/AWS/ELBv2/TrustStore.ts:121
     const described = yield* elbv2
0.86 packages/alchemy/src/AWS/EMR/Cluster.ts:526
     const created = yield* emr.runJobFlow({
0.86 packages/alchemy/src/AWS/EMRContainers/GetManagedEndpointSessionCredentialsHttp.ts:43
     return yield* op({
0.86 packages/alchemy/src/AWS/EventBridge/Rule.ts:311
     const described = yield* eventbridge
0.86 packages/alchemy/src/AWS/GreengrassV2/Deployment.ts:261
     yield* greengrassv2.cancelDeployment({ deploymentId }).pipe(
0.86 packages/alchemy/src/AWS/IVSRealtime/Stage.ts:259
     ? yield* getByArn(output.stageArn)
0.86 packages/alchemy/src/AWS/IVSRealtime/internal.ts:25
     .listTagsForResource({ resourceArn: arn })
0.86 packages/alchemy/src/AWS/ImageBuilder/InfrastructureConfiguration.ts:101
     never,
0.86 packages/alchemy/src/AWS/Keyspaces/Keyspace.ts:102
     .getKeyspace({ keyspaceName: name })
0.86 packages/alchemy/src/AWS/Keyspaces/RestoreTableHttp.ts:64
     return yield* restoreTable({
0.86 packages/alchemy/src/AWS/LakeFormation/LFTagExpression.ts:117
     .getLFTagExpression({ Name: name, CatalogId: catalogId })
0.86 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:362
     .describeRepositories({ repositoryNames: [repositoryName] })
0.86 packages/alchemy/src/AWS/Lambda/NetworkConnector.ts:461
     const connector = yield* lambdacore.getNetworkConnector({
0.86 packages/alchemy/src/AWS/LexV2/BotVersion.ts:83
     .describeBotVersion({ botId, botVersion })
0.86 packages/alchemy/src/AWS/MQ/internal.ts:31
     yield* mq.createTags({
0.86 packages/alchemy/src/AWS/MWAA/Environment.ts:221
     never,
0.86 packages/alchemy/src/AWS/MailManager/AddressList.ts:102
     .getAddressList({ AddressListId: addressListId })
0.86 packages/alchemy/src/AWS/MedicalImaging/Datastore.ts:221
     .listTagsForResource({ resourceArn: arn })
0.86 packages/alchemy/src/AWS/OAM/ListAttachedLinksHttp.ts:41
     return yield* listAttachedLinks({
0.86 packages/alchemy/src/AWS/ObservabilityAdmin/GetTelemetryRuleHttp.ts:41
     return yield* getTelemetryRule({
0.86 packages/alchemy/src/AWS/Omics/AnnotationStore.ts:282
     Effect.catchTag("ResourceNotFoundException", () => Effect.void),
0.86 packages/alchemy/src/AWS/OpenSearchServerless/AccessPolicy.ts:157
     .getAccessPolicy({ type: ACCESS_POLICY_TYPE, name })
0.86 packages/alchemy/src/AWS/OpenSearchServerless/SecurityConfig.ts:224
     return yield* aoss.getSecurityConfig({ id: configId }).pipe(
0.86 packages/alchemy/src/AWS/PinpointSMSVoiceV2/internal.ts:26
     .listTagsForResource({ ResourceArn: arn })
0.86 packages/alchemy/src/AWS/QBusiness/Application.ts:141
     never,
0.86 packages/alchemy/src/AWS/QBusiness/DataSource.ts:481
     yield* qbusiness.untagResource({
0.86 packages/alchemy/src/AWS/RUM/AppMonitor.ts:369
     live = yield* observeMonitor(name).pipe(
0.86 packages/alchemy/src/AWS/RUM/PutRumEventsHttp.ts:30
     return yield* op({
0.86 packages/alchemy/src/AWS/RolesAnywhere/Profile.ts:242
     rolesanywhere.getProfile({ profileId }).pipe(
0.86 packages/alchemy/src/AWS/RolesAnywhere/TrustAnchor.ts:264
     ? yield* getById(output.trustAnchorId)
0.86 packages/alchemy/src/AWS/SageMaker/ComputeQuota.ts:330
     const tags = yield* fetchQuotaTags(attrs.computeQuotaArn);
0.86 packages/alchemy/src/AWS/SecurityLake/Subscriber.ts:321
     subscriber = yield* securitylake
0.86 packages/alchemy/src/AWS/ServiceCatalog/PortfolioProductAssociation.ts:153
     yield* servicecatalog.associateProductWithPortfolio({
0.86 packages/alchemy/src/AWS/Signer/ProfilePermission.ts:264
     yield* signer.addProfilePermission({
0.86 packages/alchemy/src/AWS/VpcLattice/AccessLogSubscription.ts:123
     .getAccessLogSubscription({ accessLogSubscriptionIdentifier: id })
0.86 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkServiceAssociation.ts:101
     .getServiceNetworkServiceAssociation({
0.86 packages/alchemy/src/AWS/VpcLattice/ServiceNetworkVpcAssociation.ts:201
     yield* vpclattice.updateServiceNetworkVpcAssociation({
0.86 packages/alchemy/src/Auth/OidcToken.ts:90
     const response = yield* client.get(url, {
0.86 packages/alchemy/src/Cli/checkVersion.ts:123
     const response = yield* http.get(NPM_DIST_TAGS_URL);
0.86 packages/alchemy/src/Cloudflare/D1/ApplyMigrations.ts:43
     raw(
0.86 packages/alchemy/src/Cloudflare/DNS/Firewall.ts:438
     dnsFirewall.getDnsFirewall({ accountId, dnsFirewallId }).pipe(
0.86 packages/alchemy/src/Cloudflare/DNS/ZoneTransferTsig.ts:146
     const created = yield* dns.createZoneTransferTsig({
0.86 packages/alchemy/src/Cloudflare/Firewall/UaRule.ts:221
     ? yield* getUaRule(zoneId, output.uaRuleId)
0.86 packages/alchemy/src/Cloudflare/Gateway/Configuration.ts:240
     const observed = yield* zeroTrust.getGatewayConfiguration({ accountId });
0.86 packages/alchemy/src/Cloudflare/LoadBalancer/LoadBalancer.ts:306
     const created = yield* loadBalancers.createLoadBalancer({
0.86 packages/alchemy/src/Cloudflare/LogsControl/CmbConfig.ts:195
     logs.getControlCmbConfig({ accountId }).pipe(
0.86 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Config.ts:198
     const recreated = yield* mnm.createConfig(desired);
0.86 packages/alchemy/src/Cloudflare/Queues/Subscription.ts:643
     .deleteSubscription({
0.86 packages/alchemy/src/Cloudflare/R2/Bucket.ts:546
     return yield* r2.listObjects
0.86 packages/alchemy/src/Cloudflare/Tunnel/ReadTunnel.ts:128
     zeroTrust.getTunnelCloudflared({ accountId, tunnelId }),
0.86 packages/alchemy/src/Fly/Bucket.ts:565
     const agreed = yield* addons.agreedToProviderTos({
0.86 packages/alchemy/src/Fly/Redis.ts:649
     machines
0.86 packages/alchemy/src/Git/Jobs/Fork.ts:281
     yield* sql.run(
0.86 packages/alchemy/src/Hetzner/Image.ts:401
     .items({
0.86 packages/alchemy/src/Hetzner/Network.ts:141
     never,
0.86 packages/alchemy/src/Neon/FunctionProvider.ts:182
     for (const project of yield* Neon.listProjects
0.86 packages/alchemy/src/Neon/Project.ts:241
     const projects = yield* listAllProjects;
0.86 packages/alchemy/src/Prisma/Internal/DatabaseSecrets.ts:157
     Retry.none,
0.86 packages/alchemy/src/Railway/Group.ts:604
     const project = yield* railway.project(
0.86 packages/alchemy/src/Railway/Usage.ts:253
     const rows = yield* railway.usage(
0.86 packages/alchemy/src/Railway/Volume.ts:663
     railway.updateVolume(
0.86 packages/alchemy/src/Stripe/RetrieveAppsSecretHttp.ts:46
     GetAppsSecretsFind({
0.86 packages/alchemy/src/Stripe/RetrieveProductHttp.ts:50
     GetProduct({
0.86 packages/alchemy/src/Stripe/TerminalConfiguration.ts:781
     const byId = yield* getById(input.id);
0.86 packages/alchemy/test/AWS/ApplicationSignals/handler.ts:203
     const result = yield* listEntityEvents({
0.86 packages/alchemy/test/AWS/Bedrock/handler.ts:79
     const result = yield* countTokens({
0.86 packages/alchemy/test/AWS/CodeConnections/handler.ts:62
     const result = yield* getConnection();
0.86 packages/alchemy/test/AWS/IoT/iot-bindings-handler.ts:121
     const result = yield* listShadows();
0.86 packages/alchemy/test/AWS/MediaTailor/handler.ts:43
     const listAlerts = yield* MediaTailor.ListAlerts();
0.86 packages/alchemy/test/AWS/Polly/handler.ts:72
     const describeVoices = yield* AWS.Polly.DescribeVoices();
0.86 packages/alchemy/test/AWS/RDS/fixtures/handler.ts:89
     const tag = yield* describeDBClusters({
0.86 packages/alchemy/test/Cloudflare/Browser/fixtures/effect-worker.ts:34
     .content({ url: TARGET_URL })
0.86 packages/alchemy/test/Cloudflare/D1/fixtures/d1-local-worker.ts:22
     await env.DB.exec(
0.86 packages/alchemy/test/Cloudflare/Email/fixtures/worker.ts:24
     const result = yield* email
0.86 packages/alchemy/test/Cloudflare/Images/fixtures/effect-worker.ts:25
     const info = yield* images.info(request.stream).pipe(Effect.orDie);
0.86 packages/alchemy/test/Cloudflare/KV/fixtures/read-routes.ts:22
     const value = yield* kv.get(key).pipe(Effect.orDie);
0.86 packages/alchemy/test/Cloudflare/Utils/Worker.ts:30
     .getScriptSubdomain({ accountId, scriptName: workerName })
0.86 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/async-platform-handler.ts:24
     return userWorker.fetch(
0.86 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:30
     fetch(`https://${domain}`, { redirect: "manual", signal }),
0.86 packages/frontend-frameworks/src/vinext/cache/kv-http.ts:50
     return kv.putNamespaceValue({
0.86 packages/pkg/src/Registry/Handler.ts:127
     .getRun(ref.repo, ref.runId)
0.85 packages/alchemy/src/ACME/Client.ts:321
     const downloaded = yield* acme.downloadCertificate({
0.85 packages/alchemy/src/AWS/ACM/AccountConfiguration.ts:104
     acm.getAccountConfiguration({}).pipe(
0.85 packages/alchemy/src/AWS/AMP/RuleGroupsNamespace.ts:92
     .describeRuleGroupsNamespace({ workspaceId, name })
0.85 packages/alchemy/src/AWS/ApiGatewayV2/ApiMapping.ts:226
     const final = yield* agw2.getApiMapping({
0.85 packages/alchemy/src/AWS/ApiGatewayV2/Authorizer.ts:213
     .getAuthorizer({ ApiId: apiId, AuthorizerId: authorizerId })
0.85 packages/alchemy/src/AWS/ApiGatewayV2/Route.ts:222
     .getRoute({ ApiId: apiId, RouteId: routeId })
0.85 packages/alchemy/src/AWS/ApiGatewayV2/VpcLink.ts:210
     const final = yield* agw2.getVpcLink({
0.85 packages/alchemy/src/AWS/Backup/BackupPlan.ts:321
     yield* backup.tagResource({
0.85 packages/alchemy/src/AWS/BedrockAgentCore/BrowserCustom.ts:141
     .pipe(Stream.runCollect);
0.85 packages/alchemy/src/AWS/BedrockAgentCore/CodeInterpreter.ts:142
     .getCodeInterpreter({ codeInterpreterId })
0.85 packages/alchemy/src/AWS/BedrockAgentCore/internal.ts:59
     .listTagsForResource({ resourceArn })
0.85 packages/alchemy/src/AWS/BedrockDataAutomation/DataAutomationProject.ts:307
     const projectArn = yield* bda
0.85 packages/alchemy/src/AWS/CloudTrail/EventDataStore.ts:401
     EventDataStore: name,
0.85 packages/alchemy/src/AWS/CloudWatch/Alarm.ts:125
     const described = yield* cloudwatch.describeAlarms({
0.85 packages/alchemy/src/AWS/CodeDeploy/DeploymentGroup.ts:281
     .listTagsForResource({ ResourceArn: arn })
0.85 packages/alchemy/src/AWS/CostExplorer/AnomalySubscription.ts:301
     SubscriptionArn: output.subscriptionArn,
0.85 packages/alchemy/src/AWS/CostExplorer/common.ts:56
     ce.listTagsForResource({ ResourceArn: resourceArn }),
0.85 packages/alchemy/src/AWS/Deadline/Farm.ts:126
     .getFarm({ farmId })
0.85 packages/alchemy/src/AWS/DocDB/ConnectHttp.ts:96
     const value = yield* getSecretValue({ SecretId: secretArn });
0.85 packages/alchemy/src/AWS/DocDB/Mongo.ts:125
     }).connect();
0.85 packages/alchemy/src/AWS/EC2/NetworkAclEntry.ts:422
     yield* ec2
0.85 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:841
     .createSecurityGroup({
0.85 packages/alchemy/src/AWS/EC2/Volume.ts:401
     yield* ec2.deleteTags({
0.85 packages/alchemy/src/AWS/EMRContainers/JobTemplate.ts:282
     return yield* emrc.describeJobTemplate({ id }).pipe(
0.85 packages/alchemy/src/AWS/EntityResolution/IdMappingWorkflow.ts:202
     workflow = yield* entityresolution.getIdMappingWorkflow({
0.85 packages/alchemy/src/AWS/EntityResolution/internal.ts:27
     .listTagsForResource({ resourceArn: arn })
0.85 packages/alchemy/src/AWS/EventBridge/Archive.ts:162
     Effect.catchTag("ResourceNotFoundException", () =>
0.85 packages/alchemy/src/AWS/IAM/ServiceLinkedRole.ts:161
     .getRole({ RoleName: roleName })
0.85 packages/alchemy/src/AWS/IVS/StreamKey.ts:44
     never,
0.85 packages/alchemy/src/AWS/IVSChat/internal.ts:25
     .listTagsForResource({ resourceArn: arn })
0.85 packages/alchemy/src/AWS/IoTFleetWise/Fleet.ts:52
     never,
0.85 packages/alchemy/src/AWS/Kendra/DataSource.ts:163
     .listTagsForResource({ ResourceARN: arn })
0.85 packages/alchemy/src/AWS/Kinesis/Stream.ts:522
     .createStream({
0.85 packages/alchemy/src/AWS/Lambda/EventInvokeConfig.ts:63
     Lambda.getFunctionEventInvokeConfig({
0.85 packages/alchemy/src/AWS/Lambda/LayerVersion.ts:440
     const existing = yield* getVersion(layerName, output.version);
0.85 packages/alchemy/src/AWS/Lambda/MicrovmProvider.ts:701
     .getMicrovmImage({ imageIdentifier: imageArn })
0.85 packages/alchemy/src/AWS/LexV2/BotLocale.ts:58
     never,
0.85 packages/alchemy/src/AWS/LexV2/Intent.ts:121
     .describeIntent({ botId, botVersion: "DRAFT", localeId, intentId })
0.85 packages/alchemy/src/AWS/LexV2/SlotType.ts:149
     return yield* describeSlotType(botId, localeId, summary.slotTypeId);
0.85 packages/alchemy/src/AWS/MailManager/Archive.ts:61
     never,
0.85 packages/alchemy/src/AWS/MailManager/internal.ts:12
     mm.listTagsForResource({ ResourceArn: arn }).pipe(
0.85 packages/alchemy/src/AWS/MediaLive/InputSecurityGroup.ts:121
     .describeInputSecurityGroup({ InputSecurityGroupId: id })
0.85 packages/alchemy/src/AWS/Neptune/DBCluster.ts:361
     const response = yield* neptune
0.85 packages/alchemy/src/AWS/NeptuneGraph/Graph.ts:204
     .getGraph({ graphIdentifier: graphId })
0.85 packages/alchemy/src/AWS/NetworkFirewall/Firewall.ts:258
     const found = yield* describe(name);
0.85 packages/alchemy/src/AWS/OpenSearchServerless/CollectionGroup.ts:260
     reconcile: Effect.fn(function* ({ id, news, output, session }) {
0.85 packages/alchemy/src/AWS/OpenSearchServerless/LifecyclePolicy.ts:149
     const response = yield* aoss.batchGetLifecyclePolicy({
0.85 packages/alchemy/src/AWS/PaymentCryptography/TranslateKeyMaterialHttp.ts:52
     return yield* translateKeyMaterial(request);
0.85 packages/alchemy/src/AWS/Personalize/Dataset.ts:104
     .describeDataset({ datasetArn })
0.85 packages/alchemy/src/AWS/Redshift/ConnectHttp.ts:118
     ? yield* getClusterCredentials({
0.85 packages/alchemy/src/AWS/Redshift/internal.ts:59
     yield* redshift.createTags({
0.85 packages/alchemy/src/AWS/RedshiftServerless/Namespace.ts:182
     const response = yield* redshiftserverless
0.85 packages/alchemy/src/AWS/Route53/ZoneVpcAssociation.ts:113
     .getHostedZone({ Id: hostedZoneId })
0.85 packages/alchemy/src/AWS/S3Files/AccessPoint.ts:162
     .getAccessPoint({ accessPointId })
0.85 packages/alchemy/src/AWS/SES/Tenant.ts:221
     const found = yield* getTenant(name);
0.85 packages/alchemy/src/AWS/SQS/Queue.ts:753
     yield* sqs
0.85 packages/alchemy/src/AWS/SageMaker/Model.ts:203
     const tags = yield* fetchModelTags(attrs.modelArn);
0.85 packages/alchemy/src/AWS/SecurityLake/internal.ts:20
     securitylake.listTagsForResource({ resourceArn }).pipe(
0.85 packages/alchemy/src/AWS/SimpleDB/ListDomainsHttp.ts:37
     return yield* listDomains({ ...request });
0.85 packages/alchemy/src/AWS/StateStore/State.ts:342
     s3.deleteObject({ Bucket: bucket, Key: resourceKey(request) }),
0.85 packages/alchemy/src/AWS/Translate/ParallelData.ts:321
     translate.listParallelData.pages({}).pipe(
0.85 packages/alchemy/src/AWS/VpcLattice/Service.ts:281
     const summaries = yield* vpclattice.listServices.pages({}).pipe(
0.85 packages/alchemy/src/Cloudflare/D1/QueryDatabaseLocal.ts:66
     const ambient = yield* Effect.context<never>();
0.85 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:63
     flagship.getAppEvaluate({
0.85 packages/alchemy/src/Cloudflare/Healthcheck/Healthcheck.ts:375
     .createHealthcheck({ zoneId, ...desired })
0.85 packages/alchemy/src/Cloudflare/R2/DataCatalog.ts:256
     return yield* rdc.listR2DataCatalogs({ accountId }).pipe(
0.85 packages/alchemy/src/Cloudflare/Tunnel/WriteTunnel.ts:148
     zeroTrust.createTunnelCloudflared({ accountId, ...request }),
0.85 packages/alchemy/src/Cloudflare/Workers/Subdomain.ts:191
     workers.getSubdomain({ accountId }).pipe(
0.85 packages/alchemy/src/Fly/GetSecretHttp.ts:51
     machines.getSecret({
0.85 packages/alchemy/src/Fly/SignHttp.ts:37
     const res = yield* auth.authorize(
0.85 packages/alchemy/src/Fly/VolumeSnapshot.ts:322
     .createVolumeSnapshot({
0.85 packages/alchemy/src/Hetzner/Server.ts:722
     .listServers({ name, per_page: 50 })
0.85 packages/alchemy/src/Hetzner/Volume.ts:278
     const byId = yield* getById(outputId);
0.85 packages/alchemy/src/Infisical/SecretsProvider.ts:134
     Retry.none,
0.85 packages/alchemy/src/Neon/Bucket.ts:158
     const storage = yield* Neon.getProjectBranchStorage(apiScope(scope));
0.85 packages/alchemy/src/Neon/Website/Artifact.ts:141
     );
0.85 packages/alchemy/src/Prisma/ORM/Postgres.ts:322
     .connection();
0.85 packages/alchemy/src/Prisma/ReadBucket.ts:121
     access.authorize(S3.headObject({ Bucket, Key: key })),
0.85 packages/alchemy/src/Prisma/WriteBucket.ts:117
     S3.putObject({
0.85 packages/alchemy/src/Railway/Sandbox.ts:461
     railway.sandbox({ environmentId, id: sandboxId }, selection).pipe(
0.85 packages/alchemy/src/Railway/Variable.ts:396
     listVariableMap(projectId, environmentId, serviceId).pipe(
0.85 packages/alchemy/src/State/PostgresState.ts:573
     sql`delete from alchemy_resource_state where stack = ${request.stack} and stage = ${request.stage} and fqn = ${request.f
0.85 packages/alchemy/test/ACME/fixtures/shared.ts:35
     .generateEabCredentials({})
0.85 packages/alchemy/test/AWS/ApiGateway/fixtures/bindings-handler.ts:69
     const created = yield* createApiKey({
0.85 packages/alchemy/test/AWS/Bedrock/kb-handler.ts:183
     const result = yield* retrieve({
0.85 packages/alchemy/test/AWS/CloudHSMV2/handler.ts:71
     const result = yield* describeClusters({
0.85 packages/alchemy/test/AWS/DSQL/fixtures/direct-handler.ts:87
     yield* sqlClient`CREATE TABLE IF NOT EXISTS dsql_direct_widgets (id integer PRIMARY KEY, title text NOT NULL)`;
0.85 packages/alchemy/test/AWS/DSQL/fixtures/drizzle-handler.ts:54
     const rows = yield* db.execute(sql`SELECT 1 AS one`);
0.85 packages/alchemy/test/AWS/ELBv2/fixtures/bindings-handler.ts:41
     // A self-signed CA certificate generated once and checked in (never created
0.85 packages/alchemy/test/AWS/EMRServerless/handler.ts:275
     const { jobRun } = yield* getJobRun({ jobRunId: id }).pipe(
0.85 packages/alchemy/test/AWS/ElastiCache/bindings-handler.ts:78
     const result = yield* describeCaches();
0.85 packages/alchemy/test/AWS/Keyspaces/restore-handler.ts:48
     const result = yield* restore({
0.85 packages/alchemy/test/AWS/Keyspaces/streams-handler.ts:50
     const listed = yield* streams.listStreams();
0.85 packages/alchemy/test/AWS/Logs/handler.ts:62
     const result = yield* putLogEvents({
0.85 packages/alchemy/test/AWS/MWAA/bindings-handler.ts:235
     invokeRestApi({ Method: "GET", Path: "/dags" }),
0.85 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:97
     const detail = yield* getCollection();
0.85 packages/alchemy/test/AWS/Pricing/handler.ts:43
     const result = yield* getProducts({
0.85 packages/alchemy/test/AWS/Route53Resolver/helpers.ts:13
     const subnets = yield* EC2.describeSubnets({
0.85 packages/alchemy/test/AWS/S3/fixtures/event-source-handler.ts:57
     const recorded = yield* getObject({ Key: key }).pipe(
0.85 packages/alchemy/test/AWS/S3Control/fixtures/mrap-bindings-handler.ts:44
     yield* AWS.S3Control.GetMultiRegionAccessPointRoutes(mrap);
0.85 packages/alchemy/test/Cloudflare/Hyperdrive/fixtures/remote-worker.ts:41
     const rows = (yield* sql`
0.85 packages/alchemy/test/Cloudflare/Images/fixtures/async-worker.ts:11
     const info = await env.MEDIA.info(request.body!);
0.85 packages/alchemy/test/Cloudflare/VpcService/fixtures/vpc-local-worker.ts:21
     const res = await binding!.fetch(target, {
0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/dynamic-worker-loader/effect-worker.ts:37
     const res = await fetch("https://example.com/");
0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-event-flush-worker.ts:59
     HttpClientRequest.get("http://otel-event-flush-target/"),
0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-http/worker.ts:71
     const result = yield* client.PingDO(payload);
0.85 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations-upgrade/worker.ts:21
     .exec<{ value: string }>("SELECT value FROM items ORDER BY rowid")
0.85 packages/alchemy/test/Neon/fixtures/language-model-handler.ts:32
     const response = yield* LanguageModel.generateObject({
0.85 packages/alchemy/test/Stripe/fixtures/worker.ts:23
     const live = yield* retrieveProduct().pipe(Effect.orDie);
0.85 packages/cloudflare-runtime/src/core/bindings/browser/Browser.worker.ts:365
     .fetch(closeUrl, { method: "POST" })
0.85 packages/cloudflare-runtime/src/core/bindings/queue/QueueShimForward.worker.ts:42
     response = await fetch(target, {
0.85 packages/cloudflare-runtime/src/core/remote-bindings/workers/remote.worker.ts:139
     return await fetcher.fetch(
0.85 packages/frontend-frameworks/src/sveltekit/WorkerShim.ts:170
     const response = await env.${options.assetsBinding}.fetch(url);
0.84 packages/alchemy/src/AWS/AIOps/InvestigationGroup.ts:342
     .createInvestigationGroup({
0.84 packages/alchemy/src/AWS/AMP/DescribeWorkspaceHttp.ts:34
     return yield* describeWorkspace({
0.84 packages/alchemy/src/AWS/AMP/Scraper.ts:376
     amp.listScrapers.pages({}).pipe(
0.84 packages/alchemy/src/AWS/ApiGateway/GetUsagePlanKeysHttp.ts:34
     return yield* getUsagePlanKeys({
0.84 packages/alchemy/src/AWS/ApiGateway/Method.ts:541
     yield* ag.putIntegration(
0.84 packages/alchemy/src/AWS/AppConfig/ConfigurationProfile.ts:316
     yield* appconfig
0.84 packages/alchemy/src/AWS/Bedrock/Agent.ts:281
     return yield* bedrock.listTagsForResource({ resourceArn }).pipe(
0.84 packages/alchemy/src/AWS/Bedrock/AgentAlias.ts:269
     yield* bedrock.updateAgentAlias({
0.84 packages/alchemy/src/AWS/Bedrock/DataSource.ts:281
     bedrock.deleteDataSource({
0.84 packages/alchemy/src/AWS/CloudFront/KvRoutesUpdate.ts:255
     return yield* retryForKvsReadiness(
0.84 packages/alchemy/src/AWS/CloudWatch/Dashboard.ts:223
     const output = yield* cloudwatch
0.84 packages/alchemy/src/AWS/CloudWatch/common.ts:80
     .pipe(Effect.map((response) => toTagRecord(response.Tags)));
0.84 packages/alchemy/src/AWS/Cognito/IdentityPoolRoleAttachment.ts:113
     .getIdentityPoolRoles({ IdentityPoolId: identityPoolId })
0.84 packages/alchemy/src/AWS/DAX/Cluster.ts:221
     .pipe(
0.84 packages/alchemy/src/AWS/DataZone/EnvironmentBlueprintConfiguration.ts:224
     Effect.catchTag("ResourceNotFoundException", () =>
0.84 packages/alchemy/src/AWS/DataZone/Project.ts:133
     .listProjects({ domainIdentifier: domainId, name })
0.84 packages/alchemy/src/AWS/DevOpsGuru/EventSourcesConfig.ts:80
     const { EventSources } = yield* devopsguru.describeEventSourcesConfig(
0.84 packages/alchemy/src/AWS/DevOpsGuru/ResourceCollection.ts:141
     const tagPages = yield* observeType("AWS_TAGS");
0.84 packages/alchemy/src/AWS/DirectoryService/ConditionalForwarder.ts:42
     never,
0.84 packages/alchemy/src/AWS/DocDB/DBCluster.ts:439
     let observed = yield* readCluster(identifier);
0.84 packages/alchemy/src/AWS/EKS/internal/podIdentity.ts:135
     const listed = yield* eks.listPodIdentityAssociations({
0.84 packages/alchemy/src/AWS/EntityResolution/MatchingWorkflow.ts:261
     yield* syncEntityResolutionTags(workflowArn, desiredTags);
0.84 packages/alchemy/src/AWS/FinSpace/KxEnvironment.ts:282
     .getKxEnvironment({ environmentId })
0.84 packages/alchemy/src/AWS/GlobalAccelerator/Listener.ts:125
     ga.describeListener({ ListenerArn: listenerArn }),
0.84 packages/alchemy/src/AWS/GreengrassV2/ComponentVersion.ts:41
     never,
0.84 packages/alchemy/src/AWS/HealthLake/FHIRDatastore.ts:370
     const created = yield* healthlake.createFHIRDatastore({
0.84 packages/alchemy/src/AWS/IAM/Role.ts:748
     .getRole({ RoleName: output.roleName })
0.84 packages/alchemy/src/AWS/IVS/Channel.ts:212
     const summaries = yield* ivs.listChannels
0.84 packages/alchemy/src/AWS/IVS/PlaybackRestrictionPolicy.ts:182
     ? yield* getByArn(output.playbackRestrictionPolicyArn)
0.84 packages/alchemy/src/AWS/IVS/internal.ts:25
     .listTagsForResource({ resourceArn: arn })
0.84 packages/alchemy/src/AWS/ImageBuilder/ImageRecipe.ts:341
     .pages({ owner: "Self" })
0.84 packages/alchemy/src/AWS/InternetMonitor/Monitor.ts:361
     yield* im.updateMonitor(update);
0.84 packages/alchemy/src/AWS/IoTFleetWise/SignalCatalog.ts:263
     iotfleetwise.listSignalCatalogs.items({}).pipe(
0.84 packages/alchemy/src/AWS/IoTSiteWise/AssetModel.ts:261
     Effect.catchTag("ResourceNotFoundException", () =>
0.84 packages/alchemy/src/AWS/KMS/Alias.ts:212
     const described = yield* kms.describeKey({ KeyId: targetKeyId });
0.84 packages/alchemy/src/AWS/Kafka/ServerlessCluster.ts:193
     Effect.retry({ schedule: policy }),
0.84 packages/alchemy/src/AWS/Kendra/SearchIndex.ts:365
     ? yield* readIndexById(output.id, arnOf)
0.84 packages/alchemy/src/AWS/Keyspaces/Type.ts:119
     .getType({ keyspaceName, typeName })
0.84 packages/alchemy/src/AWS/Lambda/Alias.ts:232
     const alias = yield* Lambda.getAlias({
0.84 packages/alchemy/src/AWS/Lambda/FlociFunctionProvider.ts:183
     yield* Lambda.updateFunctionCode({
0.84 packages/alchemy/src/AWS/LexV2/Bot.ts:203
     const pages = yield* lexm.listBots
0.84 packages/alchemy/src/AWS/MWAAServerless/Workflow.ts:522
     .deleteWorkflow({ WorkflowArn: output.workflowArn })
0.84 packages/alchemy/src/AWS/Macie2/ClassificationJob.ts:170
     .describeClassificationJob({ jobId })
0.84 packages/alchemy/src/AWS/MemoryDB/Cluster.ts:366
     .createCluster({
0.84 packages/alchemy/src/AWS/NetworkFirewall/FirewallPolicy.ts:54
     never,
0.84 packages/alchemy/src/AWS/Notifications/NotificationHub.ts:139
     notifications.registerNotificationHub({
0.84 packages/alchemy/src/AWS/Omics/VariantStore.ts:78
     never,
0.84 packages/alchemy/src/AWS/PinpointSMSVoiceV2/ConfigurationSet.ts:54
     never,
0.84 packages/alchemy/src/AWS/PinpointSMSVoiceV2/OptOutList.ts:45
     never,
0.84 packages/alchemy/src/AWS/Polly/Lexicon.ts:241
     const res = yield* polly.listLexicons({
0.84 packages/alchemy/src/AWS/RedshiftServerless/ConnectHttp.ts:79
     const credentials = yield* getCredentials({
0.84 packages/alchemy/src/AWS/Route53Resolver/ResolverRule.ts:216
     return yield* r53r.listResolverRules
0.84 packages/alchemy/src/AWS/S3Control/AccessPoint.ts:261
     .getAccessPoint({ AccountId: accountId, Name: name })
0.84 packages/alchemy/src/AWS/SageMaker/ClusterSchedulerConfig.ts:341
     .createClusterSchedulerConfig({
0.84 packages/alchemy/src/AWS/SageMaker/FeatureGroup.ts:220
     const described = yield* describeFeatureGroupOrUndefined(name);
0.84 packages/alchemy/src/AWS/SecretsManager/Secret.ts:411
     yield* secretsmanager.tagResource({
0.84 packages/alchemy/src/AWS/SecurityLake/ExceptionSubscription.ts:81
     .getDataLakeExceptionSubscription({})
0.84 packages/alchemy/src/AWS/Textract/Adapter.ts:282
     yield* session.note(adapterId!);
0.84 packages/alchemy/src/AWS/Transcribe/CreateLanguageModelHttp.ts:55
     return yield* createLanguageModel({
0.84 packages/alchemy/src/AWS/VpcLattice/Rule.ts:197
     const listed = yield* vpclattice.listTagsForResource({
0.84 packages/alchemy/src/AWS/VpcLattice/ServiceNetwork.ts:401
     const listed = yield* vpclattice.listTagsForResource({
0.84 packages/alchemy/src/AWS/WAFv2/LoggingConfiguration.ts:142
     .getLoggingConfiguration({ ResourceArn: resourceArn })
0.84 packages/alchemy/src/Alchemist/routes/cloudflare.ts:112
     .getScriptSetting({ accountId, scriptName: workerName })
0.84 packages/alchemy/src/Cloudflare/AI/SearchInstance.ts:847
     .readNamespaceInstance({ accountId, name: namespace, id })
0.84 packages/alchemy/src/Cloudflare/Access/Organization.ts:363
     });
0.84 packages/alchemy/src/Cloudflare/D1/Database.ts:422
     .getDatabase({
0.84 packages/alchemy/src/Cloudflare/D1/QueryDatabase.ts:63
     never,
0.84 packages/alchemy/src/Cloudflare/DNS/ReadDnsHttp.ts:28
     dns.getRecord({ zoneId: yield* zoneId, dnsRecordId }),
0.84 packages/alchemy/src/Cloudflare/DNS/ZoneSettings.ts:381
     .pipe(Effect.catchTag("InvalidRoute", () => Effect.succeed(undefined)));
0.84 packages/alchemy/src/Cloudflare/OriginPostQuantumEncryption/OriginPostQuantumEncryption.ts:202
     const observed = yield* pqe.getOriginPostQuantumEncryption({ zoneId });
0.84 packages/alchemy/src/Cloudflare/Rules/List.ts:341
     const observed = yield* getListById(acct, output.listId);
0.84 packages/alchemy/src/Cloudflare/SecretsStore/Secret.ts:259
     .deleteStoreSecret({
0.84 packages/alchemy/src/Cloudflare/Workers/BrowserBinding.ts:41
     tryPromise(() => binding.quickAction(action as any, options as any)),
0.84 packages/alchemy/src/Fly/Catalog.ts:27
     const { regions } = yield* machines.getRegions({});
0.84 packages/alchemy/src/Fly/VerifyHttp.ts:35
     machines.verifySecretKey({
0.84 packages/alchemy/src/Hetzner/LoadBalancer.ts:1381
     const items = yield* Hetzner.loadBalancers.listLoadBalancers
0.84 packages/alchemy/src/Hetzner/VolumeAttachment.ts:361
     const current = yield* getById(output.volumeId);
0.84 packages/alchemy/src/Railway/Bucket.ts:561
     Effect.flatMap((items) => {
0.84 packages/alchemy/src/Railway/ServiceRegion.ts:233
     yield* railway.environmentPatchCommit({
0.84 packages/alchemy/src/Railway/Website/Cdn.ts:121
     .serviceInstance(
0.84 packages/alchemy/test/AWS/AICapabilities/handler.ts:56
     const result = yield* detectLabels({
0.84 packages/alchemy/test/AWS/CostExplorer/handler.ts:91
     yield* CostExplorer.GetRightsizingRecommendation();
0.84 packages/alchemy/test/AWS/DAX/handler.ts:50
     const tag = yield* describeClusters({
0.84 packages/alchemy/test/AWS/DefaultVpc.ts:22
     const vpcs = yield* EC2.describeVpcs({});
0.84 packages/alchemy/test/AWS/DocDB/slow-handler.ts:115
     client.db("admin").command({ ping: 1 }),
0.84 packages/alchemy/test/AWS/EMR/slow-handler.ts:111
     const { StepIds } = yield* addSteps({
0.84 packages/alchemy/test/AWS/Forecast/handler.ts:122
     const tag = yield* describeForecast({ ForecastArn: arn }).pipe(
0.84 packages/alchemy/test/AWS/Geo/handler.ts:46
     const result = yield* searchText({
0.84 packages/alchemy/test/AWS/IAM/handler.ts:234
     const { EvaluationResults } = yield* simulateCustomPolicy({
0.84 packages/alchemy/test/AWS/Kinesis/handler.ts:62
     yield* AWS.Kinesis.DescribeAccountSettings();
0.84 packages/alchemy/test/AWS/KinesisAnalyticsV2/code-bucket.ts:35
     const listed = yield* s3.listObjectsV2({ Bucket: bucketName });
0.84 packages/alchemy/test/AWS/Lambda/fixtures/microvm/orchestrator.ts:151
     `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
0.84 packages/alchemy/test/AWS/LicenseManager/seller-handler.ts:187
     const tokens = yield* listTokens({ TokenIds: [token.TokenId!] });
0.84 packages/alchemy/test/AWS/Personalize/handler.ts:241
     const tag = yield* getRecommendations({
0.84 packages/alchemy/test/AWS/RedshiftServerless/fixtures/snapshot-handler.ts:52
     const { snapshot } = yield* createSnapshot({
0.84 packages/alchemy/test/AWS/Route53/bindings-handler.ts:109
     const response = yield* listHostedZones({ MaxItems: 100 });
0.84 packages/alchemy/test/AWS/S3/fixtures/versioned-object-handler.ts:81
     const versions = yield* S3.ListObjectVersions(buckets.ListObjectVersions);
0.84 packages/alchemy/test/AWS/S3Tables/bindings-handler.ts:75
     const response = yield* listNamespaces();
0.84 packages/alchemy/test/AWS/SSMContacts/bindings-handler.ts:63
     const startEngagement = yield* AWS.SSMContacts.StartEngagement(oncall);
0.84 packages/alchemy/test/AWS/SecretsManager/fixtures/get-secret-only-handler.ts:37
     const result = yield* getSecretValue({
0.84 packages/alchemy/test/AWS/ServiceQuotas/handler.ts:53
     return yield* getServiceQuota({
0.84 packages/alchemy/test/AWS/Translate/handler.ts:158
     const result = yield* translateDocument({
0.84 packages/alchemy/test/AWS/WAFv2/handler.ts:99
     const response = yield* bound.getIPSet();
0.84 packages/alchemy/test/Cloudflare/R2/fixtures/read-routes.ts:15
     const object = yield* r2.get(key).pipe(Effect.orDie);
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-do/object.ts:221
     return yield* db.run(sql`SELECT * FROM missing_table`).pipe(
0.84 packages/alchemy/test/SQL/exercise.ts:57
     untilOk(HttpClient.get(url)).pipe(Effect.flatMap((res) => res.json));
0.84 packages/alchemy/test/SQL/fixtures/postgres-worker.ts:56
     yield* sql`INSERT INTO ${sql(TABLE)} ${sql.insert(row)}`;
0.84 packages/cloudflare-runtime/src/vite/dev-plugin.ts:282
     const request = NodeHttp.request(url, {
0.84 packages/frontend-frameworks/fixtures/tanstack-start/src/routes/api.db.ts:8
     const result = await fetchSql();
0.83 packages/alchemy/src/AWS/AMP/AnomalyDetector.ts:147
     .describeAnomalyDetector({ workspaceId, anomalyDetectorId })
0.83 packages/alchemy/src/AWS/Account/Region.ts:108
     .getRegionOptStatus({ RegionName: regionName, AccountId: accountId })
0.83 packages/alchemy/src/AWS/ApiGatewayV2/Integration.ts:251
     agw2.getApis({ NextToken }),
0.83 packages/alchemy/src/AWS/ApiGatewayV2/ManageConnectionsHttp.ts:79
     return yield* withEndpoint(postToConnection(request), endpoint);
0.83 packages/alchemy/src/AWS/AppSync/ApiKey.ts:116
     const pages = yield* appsync.listApiKeys.pages({ apiId }).pipe(
0.83 packages/alchemy/src/AWS/AppSync/DomainName.ts:82
     appsync.getDomainName({ domainName }).pipe(
0.83 packages/alchemy/src/AWS/BedrockAgentCore/Memory.ts:341
     yield* control.updateMemory({
0.83 packages/alchemy/src/AWS/BedrockAgentCore/Runtime.ts:182
     const pages = yield* control.listAgentRuntimes
0.83 packages/alchemy/src/AWS/CloudFront/Function.ts:167
     yield* cloudfront.listFunctions({ Marker: marker });
0.83 packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts:102
     .getAlarmMuteRule({
0.83 packages/alchemy/src/AWS/CloudWatch/MetricStream.ts:121
     .getMetricStream({
0.83 packages/alchemy/src/AWS/CodeArtifact/CopyPackageVersionsHttp.ts:55
     return yield* op({
0.83 packages/alchemy/src/AWS/CodeDeploy/BatchGetDeploymentsHttp.ts:40
     return yield* op(request);
0.83 packages/alchemy/src/AWS/Cognito/UserPoolDomain.ts:219
     let observed = yield* describeDomain(domain);
0.83 packages/alchemy/src/AWS/DataBrew/Recipe.ts:196
     const workingPages = yield* databrew.listRecipes
0.83 packages/alchemy/src/AWS/DataSync/LocationEfs.ts:122
     .describeLocationEfs({ LocationArn: locationArn })
0.83 packages/alchemy/src/AWS/DataSync/LocationS3.ts:113
     .describeLocationS3({ LocationArn: locationArn })
0.83 packages/alchemy/src/AWS/DirectoryService/Directory.ts:381
     ? yield* ds.createMicrosoftAD({
0.83 packages/alchemy/src/AWS/DynamoDB/ExecuteTransactionHttp.ts:45
     return yield* executeTransaction(request);
0.83 packages/alchemy/src/AWS/DynamoDB/ExportTableToPointInTimeHttp.ts:53
     return yield* exportTableToPointInTime({
0.83 packages/alchemy/src/AWS/EC2/DefaultSecurityGroup.ts:447
     ? ec2.authorizeSecurityGroupEgress(request)
0.83 packages/alchemy/src/AWS/EC2/InternetGateway.ts:487
     schedule: Schedule.max([Schedule.fixed(500), Schedule.recurs(10)]),
0.83 packages/alchemy/src/AWS/ElastiCache/ReplicationGroup.ts:581
     Stream.runCollect,
0.83 packages/alchemy/src/AWS/ElastiCache/ServerlessCache.ts:301
     const response = yield* elasticache
0.83 packages/alchemy/src/AWS/EventBridge/Connection.ts:244
     .describeConnection({ Name: connectionName })
0.83 packages/alchemy/src/AWS/FinSpace/KxCluster.ts:161
     export interface KxCluster extends Resource<
0.83 packages/alchemy/src/AWS/ImageBuilder/Component.ts:181
     .pipe(
0.83 packages/alchemy/src/AWS/ImageBuilder/DistributionConfiguration.ts:104
     const response = yield* imagebuilder
0.83 packages/alchemy/src/AWS/IoTFleetWise/StateTemplate.ts:285
     iotfleetwise.listStateTemplates.items({}).pipe(
0.83 packages/alchemy/src/AWS/IoTFleetWise/internal.ts:55
     .listTagsForResource({ ResourceARN: arn })
0.83 packages/alchemy/src/AWS/Keyspaces/TableStreamsHttp.ts:62
     return yield* listStreams({ ...request, keyspaceName, tableName });
0.83 packages/alchemy/src/AWS/Kinesis/ListTagsForResourceHttp.ts:38
     return yield* listTagsForResource({
0.83 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationCloudWatchLoggingOption.ts:111
     .describeApplication({ ApplicationName: applicationName })
0.83 packages/alchemy/src/AWS/Logs/MetricFilter.ts:142
     logs.describeMetricFilters.pages({}).pipe(
0.83 packages/alchemy/src/AWS/MailManager/RuleSet.ts:161
     mm.listRuleSets.pages({}).pipe(
0.83 packages/alchemy/src/AWS/OSIS/internal.ts:29
     .listTagsForResource({ Arn: arn })
0.83 packages/alchemy/src/AWS/OpenSearchServerless/SecurityPolicy.ts:261
     detail = yield* aoss
0.83 packages/alchemy/src/AWS/PinpointSMSVoiceV2/EventDestination.ts:222
     .describeConfigurationSets({ ConfigurationSetNames: [name] })
0.83 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:184
     const value = yield* getSecretValue({
0.83 packages/alchemy/src/AWS/Rbin/Rule.ts:264
     .getRule({ Identifier: identifier })
0.83 packages/alchemy/src/AWS/Route53Profiles/Profile.ts:197
     profiles.listProfiles.items({}).pipe(
0.83 packages/alchemy/src/AWS/Route53Resolver/ListResolverRuleAssociationsHttp.ts:52
     return yield* op({
0.83 packages/alchemy/src/AWS/SSM/GetParametersHttp.ts:65
     return yield* getParameters({
0.83 packages/alchemy/src/AWS/SageMaker/Endpoint.ts:61
     never,
0.83 packages/alchemy/src/AWS/SecurityLake/CustomLogSource.ts:301
     yield* securitylake
0.83 packages/alchemy/src/AWS/SecurityLake/DataLake.ts:261
     .pipe(Effect.map((response) => [...(response.dataLakes ?? [])]));
0.83 packages/alchemy/src/AWS/ServiceCatalog/Product.ts:181
     .describeProductAsAdmin(selector)
0.83 packages/alchemy/src/AWS/StepFunctions/StartSyncExecutionHttp.ts:28
     op(input).pipe(
0.83 packages/alchemy/src/AWS/Timestream/internal.ts:50
     const response = yield* describe;
0.83 packages/alchemy/src/AWS/VpcLattice/Listener.ts:143
     .getListener({ serviceIdentifier, listenerIdentifier })
0.83 packages/alchemy/src/AWS/VpcLattice/TargetGroup.ts:421
     const created = yield* vpclattice
0.83 packages/alchemy/src/Cloudflare/AI/GatewayDynamicRouting.ts:562
     aiGateway.getDynamicRouting({ accountId, gatewayId, id }).pipe(
0.83 packages/alchemy/src/Cloudflare/DNS/AccountSettings.ts:298
     const observed = yield* dns.getSettingAccount({ accountId });
0.83 packages/alchemy/src/Cloudflare/SchemaValidation/OperationSetting.ts:244
     schemaValidation.getSettingOperation({ zoneId, operationId }).pipe(
0.83 packages/alchemy/src/Fly/ExecHttp.ts:34
     sprites.execCommand({
0.83 packages/alchemy/src/Fly/WriteCertificatesHttp.ts:55
     .createAppAcmeCertificate({ app_name: yield* appName, hostname })
0.83 packages/alchemy/src/Git/Store/Closure.ts:132
     const rows = yield* sql.inChunks<CommitNodeRow>(
0.83 packages/alchemy/src/Railway/AuthProvider.ts:201
     .pipe(mapPromptCancellation, Effect.andThen(Effect.never)),
0.83 packages/alchemy/src/Railway/Environment.ts:55
     .me(
0.83 packages/alchemy/src/Railway/Postgres.ts:241
     never,
0.83 packages/alchemy/src/Railway/PrivateNetwork.ts:1041
     yield* railway.environmentPatchCommit({
0.83 packages/alchemy/src/Railway/SandboxCheckpoint.ts:225
     const items = yield* listCheckpoints(environmentId);
0.83 packages/alchemy/src/Railway/Template.ts:401
     railway.template({ id }, selection).pipe(
0.83 packages/alchemy/src/State/HttpStateStore.ts:162
     .deleteState({
0.83 packages/alchemy/src/Stripe/RetrieveTaxSettingsHttp.ts:42
     return yield* auth(GetTaxSettings(request ?? {}));
0.83 packages/alchemy/test/AWS/AMP/handler.ts:53
     yield* remoteWrite({
0.83 packages/alchemy/test/AWS/Account/handler.ts:62
     const result = yield* getAccountInformation().pipe(
0.83 packages/alchemy/test/AWS/AuditManager/handler.ts:81
     const result = yield* getAccountStatus();
0.83 packages/alchemy/test/AWS/AutoScaling/fixtures/lifecycle-handler.ts:92
     .pipe(Effect.orDie),
0.83 packages/alchemy/test/AWS/ECR/handler.ts:61
     const getAuthorizationToken = yield* ECR.GetAuthorizationToken();
0.83 packages/alchemy/test/AWS/GeoMaps/handler.ts:52
     const result = yield* getStaticMap({
0.83 packages/alchemy/test/AWS/GeoPlaces/handler.ts:44
     const result = yield* autocomplete({
0.83 packages/alchemy/test/AWS/GlobalAccelerator/handler.ts:62
     yield* GlobalAccelerator.DescribeAccelerator(accelerator);
0.83 packages/alchemy/test/AWS/Kafka/kafka-handler.ts:29
     const subnets = yield* EC2.describeSubnets({
0.83 packages/alchemy/test/AWS/MemoryDB/bindings-handler.ts:68
     const result = yield* describeClusters();
0.83 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/phone-handler.ts:58
     const { MessageId } = yield* sendText({
0.83 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:24
     const deleteObjects = yield* S3.DeleteObjects(bucket);
0.83 packages/alchemy/test/AWS/Timestream/sink-handler.ts:100
     QueryString: `SELECT COUNT(*) AS c FROM "${DatabaseName}"."${TableName}" WHERE host = '${host}'`,
0.83 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/container.ts:48
     bucket.get(key).pipe(
0.83 packages/alchemy/test/Cloudflare/Email/fixtures/local-worker.ts:28
     const result = yield* client
0.83 packages/alchemy/test/Cloudflare/R2/fixtures/write-routes.ts:30
     const object = yield* r2.put(key, body).pipe(Effect.orDie);
0.83 packages/alchemy/test/Cloudflare/Vectorize/fixtures/effect-worker.ts:40
     const mutation = yield* vec.upsert(seedVectors(LABEL));
0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v2.ts:113
     const exit = yield* Effect.exit(Cloudflare.listEvents);
0.83 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/browser.ts:23
     return yield* client.echo({ value });
0.83 packages/alchemy/test/Fly/Website/fixtures/deployment.ts:43
     HttpClient.get(url, {
0.83 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:241
     const client = yield* connect;
0.83 packages/alchemy/test/SQL/Migrations/sqlite-executor.ts:16
     db.query(sql).all(...((params ?? []) as never[])) as Array<
0.83 packages/better-auth/src/AuroraDataApi.ts:281
     const executeStatement = yield* AWS.RDSData.ExecuteStatement(
0.83 packages/frontend-frameworks/src/nuxt/dev/plugin.ts:110
     const platform = await module.connect({
0.83 packages/frontend-frameworks/src/tanstack-start/TanStackStart.ts:323
     const response = await fetch(url, { redirect: "manual" });
0.83 packages/frontend-frameworks/src/waku/adapter.ts:200
     const response = await fetch(
0.82 packages/alchemy/src/AWS/AMP/QueryMetricsHttp.ts:26
     send({
0.82 packages/alchemy/src/AWS/ApiGateway/Account.ts:135
     const final = yield* ag.getAccount({});
0.82 packages/alchemy/src/AWS/Batch/SubmitJobHttp.ts:40
     return yield* submitJob({
0.82 packages/alchemy/src/AWS/BedrockAgentCore/Gateway.ts:236
     const tags = yield* readAgentCoreTags(gateway.gatewayArn);
0.82 packages/alchemy/src/AWS/CloudControl/Resource.ts:262
     const created = yield* cloudcontrol.createResource({
0.82 packages/alchemy/src/AWS/CloudHSMV2/Hsm.ts:218
     const created = yield* cloudhsm.createHsm({
0.82 packages/alchemy/src/AWS/CloudWatch/DescribeAlarmsHttp.ts:43
     return yield* describeAlarms({
0.82 packages/alchemy/src/AWS/Config/ConfigRule.ts:461
     yield* config.tagResource({
0.82 packages/alchemy/src/AWS/Config/DeliveryChannel.ts:177
     config.describeDeliveryChannels({}).pipe(
0.82 packages/alchemy/src/AWS/DSQL/GetVpcEndpointServiceNameHttp.ts:41
     return yield* op({ identifier: yield* Identifier });
0.82 packages/alchemy/src/AWS/DSQL/Stream.ts:161
     .getStream({ clusterIdentifier, streamIdentifier })
0.82 packages/alchemy/src/AWS/DataZone/internal.ts:37
     yield* datazone.tagResource({
0.82 packages/alchemy/src/AWS/EC2/Subnet.ts:481
     yield* ec2.modifySubnetAttribute({
0.82 packages/alchemy/src/AWS/EntityResolution/IdNamespace.ts:143
     .getIdNamespace({ idNamespaceName })
0.82 packages/alchemy/src/AWS/IVS/PlaybackKeyPair.ts:164
     ? yield* getByArn(output.playbackKeyPairArn)
0.82 packages/alchemy/src/AWS/IVS/RecordingConfiguration.ts:233
     const summaries = yield* ivs.listRecordingConfigurations.pages({}).pipe(
0.82 packages/alchemy/src/AWS/IVSChat/Room.ts:273
     ? yield* getByIdentifier(output.roomArn)
0.82 packages/alchemy/src/AWS/ImageBuilder/ImagePipeline.ts:244
     const pipeline = yield* getPipeline(arn);
0.82 packages/alchemy/src/AWS/Inspector2/Enabler.ts:191
     .disable({ accountIds: [accountId], resourceTypes: enabled })
0.82 packages/alchemy/src/AWS/IoTFleetWise/Vehicle.ts:184
     const tags = yield* readFleetWiseTags(found.arn);
0.82 packages/alchemy/src/AWS/IoTSiteWise/Asset.ts:202
     const described = yield* sitewise
0.82 packages/alchemy/src/AWS/KMS/Key.ts:181
     const keys = yield* kms.listKeys.pages({}).pipe(
0.82 packages/alchemy/src/AWS/LakeFormation/LFTagAssociation.ts:241
     const response = yield* lf
0.82 packages/alchemy/src/AWS/Lambda/Version.ts:581
     FunctionName: output.functionName,
0.82 packages/alchemy/src/AWS/Macie2/CustomDataIdentifier.ts:85
     never,
0.82 packages/alchemy/src/AWS/Macie2/FindingsFilter.ts:246
     const final = yield* macie2.getFindingsFilter({ id: filterId });
0.82 packages/alchemy/src/AWS/MediaConnect/Flow.ts:321
     const flow = yield* readFlow(arn);
0.82 packages/alchemy/src/AWS/MediaLive/Input.ts:214
     return yield* medialive.describeInput({ InputId: inputId }).pipe(
0.82 packages/alchemy/src/AWS/NetworkFirewall/RuleGroup.ts:202
     .describeRuleGroup({ RuleGroupArn: output.ruleGroupArn })
0.82 packages/alchemy/src/AWS/Notifications/NotificationConfiguration.ts:162
     .getNotificationConfiguration({ arn })
0.82 packages/alchemy/src/AWS/ObservabilityAdmin/TelemetryRule.ts:532
     yield* obs.tagResource({
0.82 packages/alchemy/src/AWS/OpenSearch/Domain.ts:261
     never,
0.82 packages/alchemy/src/AWS/Organizations/RootPolicyType.ts:41
     never,
0.82 packages/alchemy/src/AWS/Organizations/common.ts:92
     organizations.listTagsForResource({ ResourceId: resourceId, NextToken }),
0.82 packages/alchemy/src/AWS/PinpointSMSVoiceV2/PhoneNumber.ts:206
     .describePhoneNumbers({ PhoneNumberIds: [phoneNumberId] })
0.82 packages/alchemy/src/AWS/RedshiftData/StatementsHttp.ts:133
     return yield* describeStatement({ Id: id });
0.82 packages/alchemy/src/AWS/SageMaker/Cluster.ts:801
     .deleteCluster({ ClusterName: output.clusterName })
0.82 packages/alchemy/src/AWS/SecretsManager/RotationSchedule.ts:180
     const described = yield* readRotation(secretId);
0.82 packages/alchemy/src/AWS/ServiceCatalog/Portfolio.ts:52
     never,
0.82 packages/alchemy/src/AWS/Timestream/RecordsSinkHttp.ts:66
     write({
0.82 packages/alchemy/src/Cloudflare/ApiShield/Label.ts:201
     observed = yield* apiGateway
0.82 packages/alchemy/src/Cloudflare/Auth/AuthProvider.ts:106
     const listMemberships = yield* cfMemberships.listMemberships;
0.82 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:77
     yield* dns.createRecord({
0.82 packages/alchemy/src/Cloudflare/Workers/SqlMigrationsApply.ts:28
     storage.sql.exec(inlineSqlParams(sql, params, "sqlite")).toArray(),
0.82 packages/alchemy/src/Git/Jobs/Purge.ts:119
     options.blobs.delete(keys.slice(at, at + 1000)),
0.82 packages/alchemy/src/Kubernetes/Manifest.ts:281
     );
0.82 packages/alchemy/src/Prisma/ORM/Migrate.ts:161
     const show = yield* runPrismaCli<MigrateShowResult>(
0.82 packages/alchemy/src/Railway/Catalog.ts:36
     const regions = yield* railway.regions(
0.82 packages/alchemy/src/Railway/Function.ts:703
     railway.service({ id: serviceId }, selection).pipe(
0.82 packages/alchemy/src/Railway/MySQL.ts:221
     never,
0.82 packages/alchemy/src/Railway/ServiceProvider.ts:261
     : deepEqual(undef(observed as never), desired)
0.82 packages/alchemy/test/ACME/fixtures/issue-worker-zerossl.ts:33
     const issued = yield* acme.issue({ identifiers: [name], solver });
0.82 packages/alchemy/test/AWS/AppConfig/fixtures/handler.ts:96
     const result = yield* getConfig();
0.82 packages/alchemy/test/AWS/AppRunner/fixtures/handler.ts:56
     const result = yield* listOperations({ MaxResults: 20 });
0.82 packages/alchemy/test/AWS/BedrockDataAutomation/handler.ts:167
     invokeDataAutomationAsync({
0.82 packages/alchemy/test/AWS/CloudMap/handler.ts:124
     const result = yield* discoverInstancesRevision();
0.82 packages/alchemy/test/AWS/CloudWatch/handler.ts:104
     const getMetricData = yield* CloudWatch.GetMetricData();
0.82 packages/alchemy/test/AWS/ComprehendMedical/handler.ts:159
     listEntitiesJobs({}),
0.82 packages/alchemy/test/AWS/DMS/handler.ts:107
     const result = yield* describeSchemas().pipe(
0.82 packages/alchemy/test/AWS/DMS/reap.ts:192
     ec2.deleteNetworkInterface({
0.82 packages/alchemy/test/AWS/DocDBElastic/slow-handler.ts:78
     const result = yield* createSnapshot({ snapshotName: name });
0.82 packages/alchemy/test/AWS/EC2/Gone.ts:26
     yield* ec2.describeVpcs({ VpcIds: [vpcId] }).pipe(
0.82 packages/alchemy/test/AWS/ECRPublic/handler.ts:113
     const result = yield* describeRegistries();
0.82 packages/alchemy/test/AWS/Neptune/fixtures/handler.ts:98
     const tag = yield* describeDBClusters({
0.82 packages/alchemy/test/AWS/NetworkFirewall/firewall-handler.ts:87
     const response = yield* bound.describeFirewall();
0.82 packages/alchemy/test/AWS/QApps/bindings-handler.ts:102
     startQAppSession({ appVersion: yield* appVersion }),
0.82 packages/alchemy/test/AWS/RedshiftData/fixtures/data-api-handler.ts:77
     const result = yield* sql.query("SELECT 1 AS n");
0.82 packages/alchemy/test/Cloudflare/Stream/fixtures/local-worker.ts:24
     const video = await upload(request.body as unknown as ReadableStream, {
0.82 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:21
     `SELECT id, hash, created_at, name, applied_at FROM "${table}" ORDER BY id`,
0.82 packages/alchemy/test/Fly/fixtures/bluegreen.ts:41
     machines.listMachines({ app_name: appName }).pipe(
0.82 packages/alchemy/test/Kubernetes/fixtures/deployment.ts:52
     yield* putItem({ Item: { pk: { S: id } } });
0.82 packages/alchemy/test/Prisma/ORM/Variants.types.ts:19
     > = bugs.all();
0.82 packages/alchemy/test/Railway/fixtures/bucket-api.ts:56
     yield* putObject({
0.82 packages/alchemy/test/SQL/fixtures/mysql-worker.ts:66
     yield* sql`INSERT INTO ${sql(TABLE)} ${sql.insert(row)}`;
0.82 packages/cloudflare-runtime/src/core/registry/RegistryProxy.worker.ts:261
     const response = await fetcher.fetch(
0.82 packages/cloudflare-runtime/src/internal/workflows-shared/binding.ts:84
     await waitForPersistedInstanceDelete(env, id);
0.82 packages/cloudflare-runtime/src/vite/module-runner/module-runner.worker.ts:248
     );
0.82 packages/frontend-frameworks/src/astro/runtime/utils/cf-helpers.ts:46
     const asset = await env.ASSETS.fetch(
0.81 packages/alchemy/src/AWS/ACM/Certificate.ts:261
     .listTagsForCertificate({ CertificateArn: certificateArn })
0.81 packages/alchemy/src/AWS/ACMPCA/CertificateAuthority.ts:657
     yield* acmpca.tagCertificateAuthority({
0.81 packages/alchemy/src/AWS/AppSync/ApiAssociation.ts:84
     appsync.getApiAssociation({ domainName }).pipe(
0.81 packages/alchemy/src/AWS/AutoScaling/InstanceRefreshHttp.ts:57
     return yield* start({
0.81 packages/alchemy/src/AWS/CloudWatch/AnomalyDetector.ts:225
     yield* retryConcurrent(cloudwatch.putAnomalyDetector(news));
0.81 packages/alchemy/src/AWS/DataBrew/internal.ts:24
     .listTagsForResource({ ResourceArn: resourceArn })
0.81 packages/alchemy/src/AWS/EKS/Cluster.ts:741
     .describeCluster({
0.81 packages/alchemy/src/AWS/EKS/Nodegroup.ts:342
     .describeNodegroup({ clusterName, nodegroupName })
0.81 packages/alchemy/src/AWS/FSx/FileSystem.ts:298
     .createFileSystem({
0.81 packages/alchemy/src/AWS/Glue/Database.ts:111
     .getDatabase({ Name: name, CatalogId: catalogId })
0.81 packages/alchemy/src/AWS/Glue/internal.ts:56
     .getTags({ ResourceArn: resourceArn })
0.81 packages/alchemy/src/AWS/ImageBuilder/internal.ts:112
     .listTagsForResource({ resourceArn: arn })
0.81 packages/alchemy/src/AWS/IoTFleetWise/ModelManifest.ts:123
     return yield* iotfleetwise.getModelManifest({ name }).pipe(
0.81 packages/alchemy/src/AWS/LakeFormation/DataLakeSettings.ts:461
     yield* lf
0.81 packages/alchemy/src/AWS/LakeFormation/OptIn.ts:161
     .deleteLakeFormationOptIn({
0.81 packages/alchemy/src/AWS/Lambda/Permission.ts:161
     const { Policy } = yield* Lambda.getPolicy({
0.81 packages/alchemy/src/AWS/MQ/Broker.ts:662
     .deleteBroker({ BrokerId: output.brokerId })
0.81 packages/alchemy/src/AWS/OAM/internal.ts:125
     return yield* oam.listTagsForResource({ ResourceArn: resourceArn }).pipe(
0.81 packages/alchemy/src/AWS/OpenSearch/internal.ts:28
     .listTags({ ARN: arn })
0.81 packages/alchemy/src/AWS/Organizations/Organization.ts:54
     never,
0.81 packages/alchemy/src/AWS/Polly/GetLexiconHttp.ts:36
     return yield* getLexicon({ Name: yield* Name });
0.81 packages/alchemy/src/AWS/RDS/DBCluster.ts:563
     const response = yield* rds
0.81 packages/alchemy/src/AWS/S3Control/ObjectLambdaAccessPoint.ts:269
     let live = yield* observeAccessPoint(accountId, name);
0.81 packages/alchemy/src/AWS/WAFv2/RegexPatternSet.ts:421
     .getRegexPatternSet({
0.81 packages/alchemy/src/Cloudflare/Access/Application.ts:661
     accountId,
0.81 packages/alchemy/src/Cloudflare/Stream/StreamBinding.ts:71
     upload: (url, params) => call((binding) => binding.upload(url, params)),
0.81 packages/alchemy/src/Fly/ListSecretsHttp.ts:34
     machines.listSecrets({
0.81 packages/alchemy/src/Fly/Postgres.ts:421
     getLiveCluster(clusterId).pipe(
0.81 packages/alchemy/src/Git/RegistryObject.ts:421
     yield* sql.run(
0.81 packages/alchemy/src/Railway/Redis.ts:402
     const getInstance = (environmentId: string, serviceId: string) =>
0.81 packages/alchemy/src/Railway/ServiceDomain.ts:183
     railway.deleteServiceDomain({ id: row.id }),
0.81 packages/alchemy/src/SQL/Migrations/AlchemyFormat.ts:97
     const rows = yield* executor.query(
0.81 packages/alchemy/test/AWS/Bedrock/language-model-handler.ts:83
     const response = yield* AiLanguageModel.generateText({ prompt });
0.81 packages/alchemy/test/AWS/CloudFront/kvs-handler.ts:63
     const res = yield* getKey({ Key: key });
0.81 packages/alchemy/test/AWS/CodeArtifact/handler.ts:143
     const res = yield* getEndpoint({ format: FORMAT });
0.81 packages/alchemy/test/AWS/DAX/slow-handler.ts:96
     const result = yield* rebootNode({ NodeId: nodeId });
0.81 packages/alchemy/test/AWS/EKS/fixtures/cluster-bindings-handler.ts:52
     const describeCluster = yield* EKS.DescribeCluster(cluster);
0.81 packages/alchemy/test/AWS/FraudDetector/fixtures/handler.ts:142
     const result = yield* getEventPrediction({
0.81 packages/alchemy/test/AWS/IdentityCenter/handler.ts:241
     const members = yield* listGroupMemberships({ GroupId });
0.81 packages/alchemy/test/AWS/LexV2/handler.ts:134
     recognizeText({
0.81 packages/alchemy/test/AWS/Omics/bindings-handler.ts:66
     const response = yield* listReadSets();
0.81 packages/alchemy/test/AWS/PinpointSMSVoiceV2/fixtures/optout-handler.ts:33
     const putOptedOut = yield* PinpointSMSVoiceV2.PutOptedOutNumber(optOuts);
0.81 packages/alchemy/test/AWS/RDSData/drizzle-iam-handler.ts:91
     const rows = (yield* db.execute(sql`select 1 as one`)) as unknown as {
0.81 packages/alchemy/test/AWS/RePostSpace/bindings-handler.ts:85
     const response = yield* listChannels();
0.81 packages/alchemy/test/AWS/ServiceCatalog/handler.ts:241
     const result = yield* searchProvisionedProducts().pipe(
0.81 packages/alchemy/test/AWS/XRay/handler.ts:301
     getInsightEvents({ InsightId: insightId }),
0.81 packages/alchemy/test/Fly/fixtures/bluegreen-secrets.ts:50
     yield* cache.ping().pipe(Effect.orDie);
0.81 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:42
     const response = await fetch("http://" + host + ":3000/health", {
0.81 packages/alchemy/test/Railway/waitUntilVolumeGone.ts:18
     .volumeInstance(
0.80 packages/alchemy/src/AWS/ApiGateway/Deployment.ts:223
     const restApiIds = yield* ag.getRestApis.pages({}).pipe(
0.80 packages/alchemy/src/AWS/ApplicationAutoScaling/ScheduledAction.ts:101
     never,
0.80 packages/alchemy/src/AWS/AutoScaling/LaunchTemplate.ts:281
     .describeLaunchTemplates({
0.80 packages/alchemy/src/AWS/CloudFront/RealtimeLogConfig.ts:246
     const response = yield* cloudfront.listRealtimeLogConfigs({
0.80 packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts:107
     const described = yield* cloudwatch.describeAlarms({
0.80 packages/alchemy/src/AWS/CodeArtifact/GetAuthorizationTokenHttp.ts:59
     return yield* op({
0.80 packages/alchemy/src/AWS/Cognito/UserPoolAdminHttp.ts:185
     return yield* listUsers({
0.80 packages/alchemy/src/AWS/ControlTower/EnabledBaseline.ts:202
     .getEnabledBaseline({ enabledBaselineIdentifier: enabledBaselineArn })
0.80 packages/alchemy/src/AWS/ControlTower/EnabledControl.ts:214
     controltower.listEnabledControls.pages({ targetIdentifier }).pipe(
0.80 packages/alchemy/src/AWS/DLM/LifecyclePolicy.ts:661
     return yield* dlm.getLifecyclePolicy({ PolicyId: policyId }).pipe(
0.80 packages/alchemy/src/AWS/DataBrew/Schedule.ts:171
     yield* databrew.updateSchedule({
0.80 packages/alchemy/src/AWS/DataZone/Domain.ts:262
     .createRole({
0.80 packages/alchemy/src/AWS/Deadline/Monitor.ts:302
     .deleteMonitor({ monitorId: output.monitorId })
0.80 packages/alchemy/src/AWS/Deadline/Queue.ts:228
     schedule: Schedule.max([Schedule.spaced("6 seconds"), Schedule.recurs(9)]),
0.80 packages/alchemy/src/AWS/DevOpsGuru/ServiceIntegration.ts:125
     yield* devopsguru.describeServiceIntegration({});
0.80 packages/alchemy/src/AWS/EC2/VolumeAttachment.ts:161
     const result = yield* ec2
0.80 packages/alchemy/src/AWS/FraudDetector/ListEventPredictionsHttp.ts:45
     return yield* op({ ...request, detectorId: { value: detectorId } });
0.80 packages/alchemy/src/AWS/GlobalAccelerator/EndpointGroup.ts:402
     ga.updateEndpointGroup({
0.80 packages/alchemy/src/AWS/IoTFleetWise/DecoderManifest.ts:81
     never,
0.80 packages/alchemy/src/AWS/Keyspaces/Table.ts:280
     const response = yield* keyspacesstreams
0.80 packages/alchemy/src/AWS/KinesisAnalyticsV2/ApplicationSnapshot.ts:130
     .describeApplicationSnapshot({
0.80 packages/alchemy/src/AWS/Logs/SubscriptionFilter.ts:168
     Stream.runHead,
0.80 packages/alchemy/src/AWS/Macie2/AllowList.ts:211
     const final = yield* macie2.getAllowList({ id: allowListId });
0.80 packages/alchemy/src/AWS/OAM/Sink.ts:228
     oam.createSink({ Name: sinkName, Tags: news?.tags }),
0.80 packages/alchemy/src/AWS/OSIS/Pipeline.ts:223
     return yield* osis.getPipeline({ PipelineName: name }).pipe(
0.80 packages/alchemy/src/AWS/OSIS/PipelineEndpoint.ts:242
     yield* osis.deletePipelineEndpoint({
0.80 packages/alchemy/src/AWS/OpenSearchServerless/Collection.ts:250
     .listTagsForResource({ resourceArn: detail.arn })
0.80 packages/alchemy/src/AWS/OpenSearchServerless/VpcEndpoint.ts:231
     yield* aoss.updateVpcEndpoint({
0.80 packages/alchemy/src/AWS/Redshift/Cluster.ts:322
     .describeClusters({ ClusterIdentifier: identifier })
0.80 packages/alchemy/src/AWS/Route53/QueryLoggingConfig.ts:44
     never,
0.80 packages/alchemy/src/AWS/Route53/Records.ts:206
     Effect.catchTag("NoSuchHostedZone", () =>
0.80 packages/alchemy/src/AWS/Route53Resolver/ResolverRuleAssociation.ts:245
     r53r.associateResolverRule({
0.80 packages/alchemy/src/Cloudflare/KV/WriteNamespaceHttp.ts:49
     kv.putNamespaceValue({
0.80 packages/alchemy/src/Doppler/SecretsProvider.ts:108
     Retry.none,
0.80 packages/alchemy/src/Fly/App.ts:223
     machines.listMachines({ app_name: appName }).pipe(
0.80 packages/alchemy/src/Git/BlobStore.ts:265
     ).pipe(Layer.provide(Cloudflare.R2.ReadWriteBucketBinding)) as never;
0.80 packages/alchemy/src/Neon/Object.ts:262
     const object = yield* client.get(key);
0.80 packages/alchemy/src/Prisma/ORM/Prepared.ts:123
     .query(current, params, { ...options, signal })
0.80 packages/alchemy/test/ACME/fixtures/issue-worker.ts:34
     const issued = yield* acme.issue({ identifiers: [name], solver });
0.80 packages/alchemy/test/AWS/Amplify/fixtures/handler.ts:105
     const result = yield* getJob({ branchName, jobId });
0.80 packages/alchemy/test/AWS/Athena/handler.ts:205
     const res = yield* getQueryResults({
0.80 packages/alchemy/test/AWS/Budgets/handler.ts:133
     const result = yield* describeBudget();
0.80 packages/alchemy/test/AWS/FSx/bindings-handler.ts:102
     const response = yield* describeBackups();
0.80 packages/alchemy/test/AWS/MediaLive/fixtures/channel-handler.ts:115
     const describeChannel = yield* MediaLive.DescribeChannel(channel);
0.80 packages/alchemy/test/AWS/MediaLive/fixtures/handler.ts:43
     const describeInput = yield* MediaLive.DescribeInput(input);
0.80 packages/alchemy/test/AWS/NeptuneGraph/handler.ts:101
     const response = yield* executeQuery({
0.80 packages/alchemy/test/AWS/OpenSearch/fixtures/handler.ts:212
     const tag = yield* listScheduledActions({
0.80 packages/alchemy/test/AWS/Organizations/handler.ts:45
     yield* Organizations.DescribeEffectivePolicy();
0.80 packages/alchemy/test/AWS/RDSData/reap.ts:93
     Effect.andThen(logs.deleteLogGroup({ logGroupName })),
0.80 packages/alchemy/test/AWS/Rekognition/handler.ts:212
     const collections = yield* listCollections({ MaxResults: 100 });
0.80 packages/alchemy/test/AWS/Route53Domains/handler.ts:81
     // and free; this suite NEVER registers a domain.
0.80 packages/alchemy/test/AWS/Route53Resolver/handler.ts:109
     const response = yield* bound.getResolverEndpoint();
0.80 packages/alchemy/test/AWS/S3Control/fixtures/bindings-handler.ts:81
     const getAccessPoint = yield* AWS.S3Control.GetAccessPoint(accessPoint);
0.80 packages/alchemy/test/AWS/SageMaker/handler.ts:85
     yield* putRecord({ Record: record(body.userId, body.clicks) });
0.80 packages/alchemy/test/AWS/VerifiedPermissions/handler.ts:55
     const result = yield* authz.isAuthorized({
0.80 packages/alchemy/test/Cloudflare/AI/fixtures/TestWorker.ts:20
     const url = yield* aiGateway.getUrl().pipe(Effect.orDie);
0.80 packages/alchemy/test/Cloudflare/Queue/fixtures/producer-routes.ts:39
     return yield* q.send({ text }).pipe(
0.80 packages/alchemy/test/Cloudflare/Website/vite-container-fixture/src/worker.ts:32
     return env.ECHO.getByName("vite-container-fixture").fetch(request);
0.80 packages/floci/src/index.ts:246
     const res = await fetch(`${endpoint}/_floci/health`, { signal });
0.80 packages/frontend-frameworks/src/react-router/ReactRouter.ts:452
     Effect.tryPromise({
0.79 packages/alchemy/src/AWS/ApiGateway/GetUsagePlanKeyHttp.ts:34
     return yield* getUsagePlanKey({
0.79 packages/alchemy/src/AWS/ApiGateway/common.ts:126
     const observe = Retry.none(ag.getRestApi({ restApiId }));
0.79 packages/alchemy/src/AWS/AppSync/GraphqlApi.ts:593
     ? yield* getApiSafe(output.apiId)
0.79 packages/alchemy/src/AWS/ApplicationAutoScaling/ScalingPolicy.ts:382
     .deleteScalingPolicy({
0.79 packages/alchemy/src/AWS/CloudFront/common.ts:63
     const response = yield* kvs.describeKeyValueStore({ KvsARN: store });
0.79 packages/alchemy/src/AWS/CloudMap/Service.ts:521
     yield* sd.deleteServiceAttributes({
0.79 packages/alchemy/src/AWS/ControlTower/LandingZone.ts:211
     controltower.getLandingZone({ landingZoneIdentifier }).pipe(
0.79 packages/alchemy/src/AWS/DataBrew/Dataset.ts:412
     yield* databrew.updateDataset({
0.79 packages/alchemy/src/AWS/ECS/TaskDefinition.ts:201
     never,
0.79 packages/alchemy/src/AWS/EventBridge/PutEventsHttp.ts:56
     return yield* putEvents({
0.79 packages/alchemy/src/AWS/FMS/AdminAccount.ts:85
     const getAdmin = pinFms(fms.getAdminAccount({})).pipe(
0.79 packages/alchemy/src/AWS/Glue/Table.ts:209
     .getTable({
0.79 packages/alchemy/src/AWS/LakeFormation/internal.ts:55
     const pages = yield* lf.listPermissions
0.79 packages/alchemy/src/AWS/OAM/Link.ts:216
     const pages = yield* oam.listLinks.pages({}).pipe(Stream.runCollect);
0.79 packages/alchemy/src/AWS/Organizations/Policy.ts:202
     organizations.listPolicies({ Filter: type, NextToken }),
0.79 packages/alchemy/src/AWS/Route53/Record.ts:163
     "AWS.Route53.Record",
0.79 packages/alchemy/src/Cloudflare/Devices/DefaultProfile.ts:201
     never,
0.79 packages/alchemy/src/Fly/PostgresMigrations.ts:130
     try: () => client.query(sql),
0.79 packages/alchemy/src/Fly/Sprite.ts:670
     .createSprite({
0.79 packages/alchemy/src/Prisma/Operations.ts:41
     withClient((client) => client.getWorkspace(id));
0.79 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:96
     const getCsr = yield* ACMPCA.GetCertificateAuthorityCsr(ca);
0.79 packages/alchemy/test/AWS/BCMDataExports/handler.ts:109
     const result = yield* getExport();
0.79 packages/alchemy/test/AWS/DataSync/handler.ts:133
     const detail = yield* describeTask();
0.79 packages/alchemy/test/AWS/ECS/handler.ts:75
     const response = yield* runTask({
0.79 packages/alchemy/test/AWS/EMRContainers/handler.ts:63
     yield* EMRContainers.DescribeJobTemplate(template);
0.79 packages/alchemy/test/AWS/EventBridge/handler.ts:81
     const describeCustomBus = yield* AWS.EventBridge.DescribeEventBus(bus);
0.79 packages/alchemy/test/AWS/IVS/fixtures/handler.ts:89
     const result = yield* getStream().pipe(
0.79 packages/alchemy/test/AWS/Inspector2/handler.ts:183
     listFindings({ maxResults: 10 }).pipe(
0.79 packages/alchemy/test/AWS/Kendra/handler.ts:235
     const result = yield* errorTagged(query({ QueryText: q }));
0.79 packages/alchemy/test/AWS/ObservabilityAdmin/handler.ts:68
     bound.listResourceTelemetry({
0.79 packages/alchemy/test/AWS/Pipes/bindings-handler.ts:80
     const describePipe = yield* AWS.Pipes.DescribePipe(pipe);
0.79 packages/alchemy/test/AWS/SSM/handler.ts:97
     const result = yield* getStringParameter();
0.79 packages/alchemy/test/AWS/Signer/handler.ts:161
     const platform = yield* getSigningPlatform({
0.79 packages/alchemy/test/Cloudflare/Browser/fixtures/async-worker.ts:16
     await page.goto(TARGET_URL, { waitUntil: "networkidle0" });
0.79 packages/alchemy/test/Railway/fixtures/redis-api.ts:33
     const body = yield* cache.ping();
0.79 packages/cloudflare-runtime/src/core/Docker.ts:701
     path: input.path,
0.79 packages/cloudflare-runtime/src/internal/workflows-shared/lib/timePriorityQueue.ts:241
     .exec(
0.79 packages/frontend-frameworks/src/nextjs/aws.ts:366
     * deploy ships the OpenNext bundles from disk, never in-memory). */
0.78 packages/alchemy/src/AWS/Amplify/Branch.ts:323
     const apps = yield* amplify.listApps.pages({}).pipe(
0.78 packages/alchemy/src/AWS/CloudFront/Distribution.ts:1081
     never,
0.78 packages/alchemy/src/AWS/CloudWatch/InsightRule.ts:322
     cloudwatch.deleteInsightRules({
0.78 packages/alchemy/src/AWS/CloudWatch/MetricSinkHttp.ts:56
     put({
0.78 packages/alchemy/src/AWS/Deadline/StorageProfile.ts:281
     .deleteStorageProfile({
0.78 packages/alchemy/src/AWS/EFS/AccessPoint.ts:361
     yield* efs.tagResource({ ResourceId: accessPointId, Tags: upsert });
0.78 packages/alchemy/src/AWS/EKS/FargateProfile.ts:444
     yield* waitForProfileDeleted(
0.78 packages/alchemy/src/AWS/Firehose/DeliveryStream.ts:902
     .createDeliveryStream({
0.78 packages/alchemy/src/AWS/Lambda/EventSourceMapping.ts:635
     .getEventSourceMapping({ UUID: output.uuid })
0.78 packages/alchemy/src/AWS/Lambda/MicrovmRpc.ts:73
     client.execute(request.pipe(HttpClientRequest.setHeaders(headers))),
0.78 packages/alchemy/src/AWS/Logs/Destination.ts:48
     never,
0.78 packages/alchemy/src/AWS/Organizations/DelegatedAdministrator.ts:209
     .registerDelegatedAdministrator({
0.78 packages/alchemy/src/AWS/Organizations/OrganizationResourcePolicy.ts:33
     never,
0.78 packages/alchemy/src/AWS/QuickSight/internal.ts:101
     .listTagsForResource({ ResourceArn: arn })
0.78 packages/alchemy/src/AWS/Route53Resolver/ResolverEndpoint.ts:243
     const byId = yield* getEndpoint(endpointId);
0.78 packages/alchemy/src/AWS/SSMIncidents/ReplicationSet.ts:121
     Effect.map((r) => r.replicationSet),
0.78 packages/alchemy/src/AWS/VerifiedPermissions/IsAuthorizedHttp.ts:54
     return yield* isAuthorized({ ...request, policyStoreId });
0.78 packages/alchemy/src/AWS/WAFv2/internal.ts:128
     wafv2.listTagsForResource({
0.78 packages/alchemy/src/AWS/Website/AssetDeployment.ts:441
     Bucket: bucketName,
0.78 packages/alchemy/src/Fly/CheckpointHttp.ts:34
     sprites.createCheckpoint({
0.78 packages/alchemy/src/Planetscale/Postgres/PostgresClusterSize.ts:253
     const change = yield* planetscale.updateBranchChangeRequest({
0.78 packages/alchemy/src/Railway/Project.ts:81
     never,
0.78 packages/alchemy/src/Railway/VolumeBackup.ts:661
     const result = yield* railway.restoreVolumeInstanceBackup(
0.78 packages/alchemy/src/SQLite/libSQL.ts:51
     try: () => executor.execute(sql),
0.78 packages/alchemy/test/AWS/ApiGateway/assertions.ts:41
     yield* ag.getRestApi({ restApiId }).pipe(
0.78 packages/alchemy/test/AWS/Config/handler.ts:164
     getResourceConfigHistory({
0.78 packages/alchemy/test/AWS/DevOpsGuru/handler.ts:84
     const health = yield* bound.describeAccountHealth();
0.78 packages/alchemy/test/AWS/DocDBElastic/handler.ts:77
     const tag = yield* getSnapshot({ snapshotArn: arn }).pipe(
0.78 packages/alchemy/test/AWS/Firehose/handler.ts:58
     const putRecord = yield* AWS.Firehose.PutRecord(deliveryStream);
0.78 packages/alchemy/test/AWS/LicenseManager/handler.ts:204
     const result = yield* checkoutLicense({
0.78 packages/alchemy/test/AWS/Notifications/handler.ts:97
     const result = yield* listNotificationEvents({
0.78 packages/alchemy/test/AWS/SecurityLake/bindings-handler.ts:66
     const response = yield* listExceptions();
0.78 packages/alchemy/test/Cloudflare/Website/fixtures/nuxt-app/server/api/kv.ts:24
     await kv.put(key, value);
0.78 packages/alchemy/test/Cloudflare/Website/tanstack-dev-bindings-fixture/src/routes/api.r2.ts:19
     const object = await env.BUCKET.get(key);
0.78 packages/alchemy/test/Cloudflare/Workers/fixtures/worker-worker-binding/binding-async-caller.ts:24
     const greeting = await env.TARGET.greet(name);
0.78 packages/better-auth/src/Migrate.ts:174
     try: () => migrations.runMigrations(),
0.78 packages/frontend-frameworks/src/nuxt/Nuxt.ts:549
     yield* Effect.tryPromise({
0.78 packages/pkg/src/Registry/KVCache.ts:42
     const hit = yield* kv.get(id, { cacheTtl: seconds(MIN_TTL) }).pipe(
0.77 packages/alchemy/src/AWS/AppSync/common.ts:103
     yield* appsync.tagResource({
0.77 packages/alchemy/src/AWS/ApplicationSignals/GetInstrumentationConfigurationStatusHttp.ts:55
     return yield* op({
0.77 packages/alchemy/src/AWS/DataExchange/StartJobHttp.ts:55
     return yield* op(request);
0.77 packages/alchemy/src/AWS/IVSChat/LoggingConfiguration.ts:227
     const summaries = yield* ivschat.listLoggingConfigurations
0.77 packages/alchemy/src/AWS/Location/StartJobHttp.ts:54
     return yield* startJob({
0.77 packages/alchemy/src/AWS/Logs/LogEventSinkHttp.ts:72
     const put = yield* putLogEvents(logGroup);
0.77 packages/alchemy/src/AWS/MailManager/IngressPoint.ts:174
     const found = yield* getById(output.ingressPointId);
0.77 packages/alchemy/src/AWS/Notifications/EventRule.ts:61
     never,
0.77 packages/alchemy/src/AWS/Organizations/OrganizationalUnit.ts:318
     readResourceTags(described.Id).pipe(
0.77 packages/alchemy/src/AWS/ResourceExplorer/ExplorerIndex.ts:91
     const observeIndex = re2.getIndex({}).pipe(
0.77 packages/alchemy/src/AWS/Route53Profiles/ProfileAssociation.ts:141
     .getProfileAssociation({
0.77 packages/alchemy/src/AWS/S3Files/FileSystem.ts:279
     .getFileSystemPolicy({ fileSystemId })
0.77 packages/alchemy/src/AWS/WAFv2/IPSet.ts:401
     wafv2
0.77 packages/alchemy/src/Fly/bluegreen.ts:64
     machines
0.77 packages/alchemy/src/Hetzner/Service.ts:267
     const live = yield* Hetzner.servers.getServer({ id: serverId }).pipe(
0.77 packages/alchemy/src/SQLite/BunSQLite.ts:39
     db.exec(sql);
0.77 packages/alchemy/test/AWS/Detective/handler.ts:81
     const listInvitations = yield* Detective.ListInvitations();
0.77 packages/alchemy/test/AWS/ElastiCache/ProvisionedFixture.ts:117
     ElastiCache.describeReplicationGroups({ ReplicationGroupId: name }).pipe(
0.77 packages/alchemy/test/AWS/FMS/handler.ts:41
     const listPolicies = yield* FMS.ListPolicies();
0.77 packages/alchemy/test/AWS/GreengrassV2/handler.ts:104
     const getCoreDevice = yield* GreengrassV2.GetCoreDevice();
0.77 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:116
     const { id } = yield* sendEvent({
0.77 packages/alchemy/test/AWS/NetworkFirewall/handler.ts:42
     yield* NetworkFirewall.DescribeFirewallPolicy(policy),
0.77 packages/alchemy/test/AWS/Redshift/fixtures/bindings-handler.ts:71
     const tag = yield* describeClusters({
0.77 packages/alchemy/test/AWS/RolesAnywhere/handler.ts:51
     const result = yield* listSubjects().pipe(
0.77 packages/alchemy/test/AWS/S3/fixtures/head-object-handler.ts:35
     return yield* headObject({
0.77 packages/alchemy/test/AWS/Scheduler/handler.ts:110
     return yield* listSchedules({ NamePrefix: namePrefix }).pipe(
0.77 packages/alchemy/test/AWS/Synthetics/handler.ts:82
     const result = yield* bound.getCanary().pipe(
0.77 packages/alchemy/test/AWS/Transfer/handler.ts:109
     const { Server } = yield* describeServer();
0.77 packages/alchemy/test/AWS/VpcLattice/handler.ts:50
     const { items } = yield* listTargets({});
0.77 packages/alchemy/test/Cloudflare/Website/fixtures/nextjs-app/app/api/kv/route.ts:7
     const value = key ? await env.FIXTURE_KV.get(key) : null;
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-do/worker.ts:31
     yield* object.sqliteClock();
0.77 packages/alchemy/test/Fly/fixtures/transport.ts:209
     request.setTimeout(90_000, () => request.destroy());
0.76 packages/alchemy-test/src/DevCli.ts:66
     last = await fetch(url, init);
0.76 packages/alchemy/src/AWS/CloudMap/internal.ts:280
     yield* sd.tagResource({ ResourceARN: resourceArn, Tags: upsert });
0.76 packages/alchemy/src/AWS/Cognito/IdentityPoolAdminHttp.ts:79
     describeIdentity: methods.plain("describeIdentity", describeIdentity),
0.76 packages/alchemy/src/AWS/Cognito/IdentityPoolAuthHttp.ts:50
     return yield* getId({
0.76 packages/alchemy/src/AWS/DataBrew/Job.ts:639
     databrew.deleteJob({ Name: output.jobName }),
0.76 packages/alchemy/src/AWS/DataZone/Environment.ts:421
     identifier: output.environmentId,
0.76 packages/alchemy/src/AWS/IdentityCenter/AccountAssignment.ts:341
     const assignments = yield* ssoAdmin.listAccountAssignments
0.76 packages/alchemy/src/AWS/IoTFleetWise/Campaign.ts:554
     iotfleetwise.listCampaigns.items({}).pipe(
0.76 packages/alchemy/src/AWS/LexV2/BotAlias.ts:170
     const pages = yield* lexm.listBotAliases.pages({ botId }).pipe(
0.76 packages/alchemy/src/AWS/ObservabilityAdmin/TelemetryConfig.ts:89
     .getTelemetryEvaluationStatus({})
0.76 packages/alchemy/src/AWS/OpenSearch/DomainReadWriteHttp.ts:20
     send({
0.76 packages/alchemy/src/AWS/Organizations/Account.ts:232
     organizations.moveAccount({
0.76 packages/alchemy/src/AWS/Timestream/BindingHttp.ts:147
     return yield* withQueryEndpoint(op(request));
0.76 packages/alchemy/src/Cloudflare/StateStore/State.ts:1072
     const response = yield* http.get(session.url, {
0.76 packages/alchemy/src/Cloudflare/Vectorize/SearchIndexBinding.ts:38
     withRuntime((raw) => raw.query(vector, options)),
0.76 packages/alchemy/src/Cloudflare/Workers/Rpc.ts:121
     return HttpClient.make((request) => stub.fetch(request));
0.76 packages/alchemy/src/Git/Jobs/Bundle.ts:139
     yield* options.blobs
0.76 packages/alchemy/src/Railway/Mongo.ts:611
     projectServices(projectId, serviceSelection).pipe(
0.76 packages/alchemy/src/Stripe/TaxSettings.ts:384
     observed = yield* CreateTaxSettings(body);
0.76 packages/alchemy/src/Test/Http.ts:60
     return yield* client.execute(request).pipe(
0.76 packages/alchemy/test/AWS/CloudFront/handler.ts:66
     yield* CloudFront.CreateInvalidation(distribution);
0.76 packages/alchemy/test/AWS/CodePipeline/handler.ts:142
     const startExecution = yield* CodePipeline.StartPipelineExecution(pipeline);
0.76 packages/alchemy/test/AWS/Cognito/trigger-handler.ts:93
     const signedUp = yield* auth.signUp({
0.76 packages/alchemy/test/AWS/CostAndUsageReport/handler.ts:67
     yield* CostAndUsageReport.DescribeReportDefinitions();
0.76 packages/alchemy/test/AWS/DynamoDB/stream-handler.ts:63
     Stream.run(sink),
0.76 packages/alchemy/test/AWS/EC2/fixtures/client-vpn.ts:49
     const imported = yield* acm.importCertificate({
0.76 packages/alchemy/test/AWS/ECS/reclaimTaskE2EOrphans.ts:194
     .deleteLoadBalancer({ LoadBalancerArn: lb.LoadBalancerArn })
0.76 packages/alchemy/test/AWS/HealthLake/handler.ts:221
     }).pipe(Effect.orDie),
0.76 packages/alchemy/test/AWS/IoT/iot-event-source-handler.ts:72
     yield* publish({
0.76 packages/alchemy/test/AWS/IoTFleetWise/bindings-handler.ts:121
     const getVehicleStatus = yield* IoTFleetWise.GetVehicleStatus(vehicle);
0.76 packages/alchemy/test/AWS/ResourceExplorer/handler.ts:44
     const result = yield* search({ QueryString: q, MaxResults: 25 });
0.76 packages/alchemy/test/AWS/SecurityHub/handler.ts:141
     const result = yield* batchImportFindings({
0.76 packages/alchemy/test/Prisma/ORM/Client.types.ts:15
     > = db.orm.public.User.select("id", "email").all();
0.76 packages/cloudflare-runtime/src/internal/workers-shared/workers/router-worker/src/worker.ts:261
     return this.env.USER_WORKER.fetch(request);
0.76 packages/frontend-frameworks/src/octane/Octane.ts:351
     const response = await fetch(url, { redirect: "manual" });
0.75 packages/alchemy/src/AWS/AMP/ListWorkspacesHttp.ts:34
     return yield* listWorkspaces(request ?? {});
0.75 packages/alchemy/src/AWS/ApiGateway/RestApi.ts:321
     export const RestApiProvider = () =>
0.75 packages/alchemy/src/AWS/ApiGatewayV2/common.ts:97
     yield* fetchPage(nextToken);
0.75 packages/alchemy/src/AWS/Backup/StartBackupJobHttp.ts:55
     return yield* startBackupJob({
0.75 packages/alchemy/src/AWS/Bedrock/RerankHttp.ts:59
     return yield* rerank(request);
0.75 packages/alchemy/src/AWS/CloudFront/KvEntries.ts:95
     const resp = yield* kvs.listKeys({
0.75 packages/alchemy/src/AWS/Deadline/Budget.ts:207
     .getBudget({ farmId, budgetId })
0.75 packages/alchemy/src/AWS/EC2/Instance.ts:803
     .runInstances(
0.75 packages/alchemy/src/AWS/GlobalAccelerator/Accelerator.ts:442
     ga.tagResource({ ResourceArn: acceleratorArn, Tags: upsert }),
0.75 packages/alchemy/src/AWS/Glue/Job.ts:192
     return yield* glue.getJob({ JobName: name }).pipe(
0.75 packages/alchemy/src/AWS/KinesisVideo/SignalingChannel.ts:114
     .describeSignalingChannel({ ChannelName: channelName })
0.75 packages/alchemy/src/AWS/LakeFormation/Permissions.ts:121
     const pages = yield* lf.listPermissions
0.75 packages/alchemy/src/AWS/MediaLive/Channel.ts:141
     never,
0.75 packages/alchemy/src/AWS/Route53/ListHostedZonesByVPCHttp.ts:10
     operation: route53.listHostedZonesByVPC,
0.75 packages/alchemy/src/AWS/Route53Profiles/ProfileResourceAssociation.ts:303
     ).pipe(Effect.map((r) => r.ProfileResourceAssociation!));
0.75 packages/alchemy/src/AWS/SimpleDB/PutAttributesHttp.ts:10
     method: sdb.putAttributes,
0.75 packages/alchemy/src/Cloudflare/Queues/Consumer.ts:601
     yield* queues
0.75 packages/alchemy/src/Prisma/ComputeLifecycle.ts:261
     yield* deleteDeployment({ deploymentId }).pipe(
0.75 packages/alchemy/test/AWS/AppRegistry/handler.ts:79
     const result = yield* getApplication();
0.75 packages/alchemy/test/AWS/CloudControl/handler.ts:198
     const result = yield* listResourceRequests({ MaxResults: 20 });
0.75 packages/alchemy/test/AWS/Cognito/handler.ts:221
     const signIn = yield* auth.initiateAuth({
0.75 packages/alchemy/test/AWS/EKS/handler.ts:58
     const { clusters } = yield* listClusters();
0.75 packages/alchemy/test/AWS/GuardDuty/handler.ts:150
     const { Findings } = yield* getFindings({ FindingIds: [id] });
0.75 packages/alchemy/test/AWS/IVSRealtime/fixtures/handler.ts:112
     const { participantToken } = yield* createParticipantToken({
0.75 packages/alchemy/test/AWS/RAM/handler.ts:127
     const result = yield* acceptInvitation({
0.75 packages/alchemy/test/AWS/S3/fixtures/versioned-multipart-handler.ts:62
     yield* S3.GetObject(buckets.UploadPartCopySource);
0.75 packages/alchemy/test/AWS/S3/fixtures/versioned-object-lock-handler.ts:106
     return yield* HttpServerResponse.json(yield* getRetention(input));
0.75 packages/alchemy/test/Cloudflare/Artifacts/fixtures/routes.ts:31
     return yield* client.create(name, { setDefaultBranch: "main" }).pipe(
0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/db.ts:38
     return yield* Cloudflare.Hyperdrive.Connection("DrizzleWorkflowEdge", {
0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:81
     client.TasksDO.getTask({ params }).pipe(Effect.orDie),
0.74 packages/alchemy/src/AWS/Amplify/GetArtifactUrlHttp.ts:40
     return yield* getArtifactUrl(request);
0.74 packages/alchemy/src/AWS/ApiGateway/FlushStageAuthorizersCacheHttp.ts:32
     return yield* flushStageAuthorizersCache({
0.74 packages/alchemy/src/AWS/ApiGatewayV2/ResetAuthorizersCacheHttp.ts:32
     return yield* resetAuthorizersCache({
0.74 packages/alchemy/src/AWS/Backup/StartRestoreJobHttp.ts:53
     return yield* startRestoreJob({
0.74 packages/alchemy/src/AWS/BedrockAgentCore/StartCodeInterpreterSessionHttp.ts:45
     return yield* startCodeInterpreterSession({
0.74 packages/alchemy/src/AWS/CloudFormation/Stack.ts:451
     yield* cloudformation.deleteStack({ StackName: output.stackId });
0.74 packages/alchemy/src/AWS/CloudMap/InstanceRegistration.ts:107
     .getInstance({ ServiceId: serviceId, InstanceId: instanceId })
0.74 packages/alchemy/src/AWS/Deadline/Fleet.ts:461
     .getFleet({ farmId, fleetId })
0.74 packages/alchemy/src/AWS/IdentityCenter/PermissionSet.ts:281
     .describePermissionSet({
0.74 packages/alchemy/src/AWS/Organizations/Root.ts:213
     (NextToken) => organizations.listRoots({ NextToken }),
0.74 packages/alchemy/src/AWS/SimpleDB/DeleteAttributesHttp.ts:10
     method: sdb.deleteAttributes,
0.74 packages/alchemy/src/Docker/Network.ts:58
     never,
0.74 packages/alchemy/src/Fly/WriteSecretHttp.ts:54
     machines.createSecret({
0.74 packages/alchemy/test/AWS/BedrockAgentCore/handler.ts:81
     const invokeBrowser = yield* AgentCore.InvokeBrowser(browser);
0.74 packages/alchemy/test/AWS/DataBrew/handler.ts:168
     const result = yield* errorTagged(listJobRuns());
0.74 packages/alchemy/test/AWS/Kinesis/stream-handler.ts:59
     Stream.run(sink),
0.74 packages/alchemy/test/AWS/MWAAServerless/handler.ts:158
     const { WorkflowRuns } = yield* listWorkflowRuns().pipe(Effect.orDie);
0.74 packages/alchemy/test/AWS/SQS/handler.ts:61
     const getQueueAttributes = yield* SQS.GetQueueAttributes(queue);
0.74 packages/alchemy/test/AWS/StepFunctions/handler.ts:211
     const result = yield* startSyncExecution({ input: body.input });
0.74 packages/alchemy/test/AWS/Transcribe/handler.ts:201
     return yield* respond(
0.73 packages/alchemy/src/AWS/Amplify/App.ts:217
     yield* amplify.tagResource({
0.73 packages/alchemy/src/AWS/ApiGateway/CreateUsagePlanKeyHttp.ts:34
     return yield* createUsagePlanKey({
0.73 packages/alchemy/src/AWS/ApiGateway/UpdateUsageHttp.ts:30
     return yield* updateUsage({
0.73 packages/alchemy/src/AWS/AppSync/DataSource.ts:203
     appsync.getDataSource({ apiId, name }).pipe(
0.73 packages/alchemy/src/AWS/AuthProvider.ts:212
     STS.getCallerIdentity({}).pipe(
0.73 packages/alchemy/src/AWS/IdentityCenter/Group.ts:51
     never,
0.73 packages/alchemy/src/AWS/Organizations/PolicyAttachment.ts:183
     .attachPolicy({
0.73 packages/alchemy/src/AWS/Organizations/TrustedServiceAccess.ts:29
     never,
0.73 packages/alchemy/src/AWS/WAFv2/RuleGroup.ts:261
     .getRuleGroup({
0.73 packages/alchemy/src/Cloudflare/Fetcher.ts:81
     Effect.runPromise,
0.73 packages/alchemy/src/Cloudflare/Workers/EmailEventSource.ts:81
     try: () => raw.forward(rcptTo, headers),
0.73 packages/alchemy/test/AWS/AIOps/fixtures/handler.ts:73
     const detail = yield* getInvestigationGroup();
0.73 packages/alchemy/test/AWS/B2BI/handler.ts:121
     const testMapping = yield* AWS.B2BI.TestMapping();
0.73 packages/alchemy/test/AWS/Batch/handler.ts:118
     const result = yield* submitJob({ jobName: body.jobName });
0.73 packages/alchemy/test/AWS/EMR/handler.ts:72
     const { Clusters } = yield* listClusters({
0.73 packages/alchemy/test/AWS/QBusiness/handler.ts:298
     const result = yield* errorTagged(listConversations());
0.73 packages/alchemy/test/AWS/RedshiftServerless/fixtures/connect-handler.ts:49
     const info = yield* connect;
0.73 packages/alchemy/test/Cloudflare/KV/fixtures/write-routes.ts:26
     yield* kv.put(key, body).pipe(Effect.orDie);
0.73 packages/alchemy/test/Cloudflare/R2/fixtures/write-binding.ts:28
     .put(key, request.stream, { contentLength, sha256 })
0.73 packages/better-auth/src/Postgres.ts:97
     runtime: open(urlEffect) as DatabaseService["runtime"],
0.73 packages/cloudflare-runtime/src/core/globals/entry.worker.ts:481
     });
0.73 packages/frontend-frameworks/src/waku/Waku.ts:981
     never,
0.72 packages/alchemy/src/AWS/ApiGateway/GatewayResponse.ts:75
     .getGatewayResponse({
0.72 packages/alchemy/src/AWS/Cognito/UserPoolAuthHttp.ts:23
     const signUp = yield* cip.signUp;
0.72 packages/alchemy/src/AWS/DataBrew/Project.ts:123
     .describeProject({ Name: name })
0.72 packages/alchemy/src/AWS/IAM/GetAccessKeyLastUsedHttp.ts:41
     return yield* op({ AccessKeyId: yield* AccessKeyId });
0.72 packages/alchemy/src/AWS/S3/PresignGetObjectHttp.ts:41
     return yield* Presign.presignS3Url({
0.72 packages/alchemy/src/AWS/StepFunctions/StateMachine.ts:686
     yield* iam.putRolePolicy({
0.72 packages/alchemy/src/AWS/WAFv2/UpdateIPSetHttp.ts:49
     return yield* update({
0.72 packages/alchemy/src/Fly/hosted.ts:569
     yield* docker.image
0.72 packages/alchemy/src/Fly/replicas.ts:586
     .pipe(Effect.timeout("30 seconds")),
0.72 packages/alchemy/src/Nuke.ts:301
     force: true,
0.72 packages/alchemy/test/AWS/DataExchange/handler.ts:111
     const detail = yield* getDataSet();
0.72 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:23
     ): Effect.Effect<A | { errorTag: string }, never, R> =>
0.72 packages/alchemy/test/AWS/ImageBuilder/handler.ts:221
     const { image } = yield* getImage({ imageBuildVersionArn: arn });
0.72 packages/alchemy/test/AWS/InternetMonitor/handler.ts:87
     .getHealthEvent({ EventId: BOGUS_EVENT_ID })
0.72 packages/alchemy/test/AWS/IoTManagedIntegrations/bindings-handler.ts:73
     const startDiscovery = yield* IoTManagedIntegrations.StartDeviceDiscovery();
0.72 packages/alchemy/test/AWS/Location/handler.ts:421
     const tile = yield* getTile({ Z: "0", X: "0", Y: "0" });
0.72 packages/alchemy/test/AWS/Logs/sink-handler.ts:64
     yield* Stream.fromIterable(events).pipe(Stream.run(sink));
0.72 packages/alchemy/test/AWS/ResourceGroups/handler.ts:140
     const out = yield* groupResources({ ResourceArns: [arn] });
0.72 packages/alchemy/test/AWS/SNS/handler.ts:81
     const publish = yield* AWS.SNS.Publish(topic);
0.72 packages/alchemy/test/AWS/SQS/sink-handler.ts:62
     Stream.run(sink),
0.72 packages/alchemy/test/Cloudflare/AI/fixtures/ChatBackend.ts:36
     const response = yield* chat.generateText({ prompt });
0.72 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/db.ts:15
     const database = yield* PostgresDatabase("PlanetscaleHostDb", {
0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/email-worker.ts:154
     .send({
0.72 packages/better-auth/src/MySQL.ts:41
     never,
0.72 packages/frontend-frameworks/src/solidstart/SolidStart.ts:469
     const response = await fetch(url, { redirect: "manual" });
0.71 packages/alchemy/src/AWS/ApiGateway/CreateApiKeyHttp.ts:26
     return yield* createApiKey(request ?? {});
0.71 packages/alchemy/src/AWS/AutoScaling/CompleteLifecycleActionHttp.ts:45
     return yield* complete({
0.71 packages/alchemy/src/AWS/IdentityCenter/Instance.ts:61
     never,
0.71 packages/alchemy/src/AWS/KMS/ReEncryptHttp.ts:58
     return yield* reEncrypt({
0.71 packages/alchemy/src/AWS/Lambda/DurableFunction.ts:502
     return yield* listDurableExecutionsByFunction({
0.71 packages/alchemy/src/Cloudflare/R2/WriteBucketBinding.ts:90
     return raw.put(key, rawStream as any, r2Options);
0.71 packages/alchemy/src/Prisma/Internal/AppPromotion.ts:125
     const observation = yield* getService({ serviceId: appId }).pipe(
0.71 packages/alchemy/test/AWS/AccessAnalyzer/handler.ts:274
     const startTag = yield* startPolicyGeneration({
0.71 packages/alchemy/test/AWS/BackupSearch/handler.ts:65
     const page = yield* listSearchJobResults({ MaxResults: 25 });
0.71 packages/alchemy/test/AWS/DataZone/handler.ts:141
     bound.search({ searchScope: "ASSET", owningProjectIdentifier }),
0.71 packages/alchemy/test/AWS/GeoRoutes/handler.ts:42
     const result = yield* calculateRoutes({
0.71 packages/alchemy/test/AWS/MedicalImaging/handler.ts:202
     getImageSetMetadata({ imageSetId }),
0.71 packages/alchemy/test/AWS/NotificationsContacts/handler.ts:54
     const result = yield* getContact();
0.71 packages/alchemy/test/AWS/OSIS/handler.ts:70
     validatePipeline({ PipelineConfigurationBody: body }).pipe(
0.71 packages/alchemy/test/AWS/SageMaker/endpoint-handler.ts:63
     const describeEndpoint = yield* SageMaker.DescribeEndpoint(endpoint);
0.71 packages/alchemy/test/AWS/Shield/handler.ts:96
     describeAttackStatistics().pipe(
0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/alarm-upgrade/v1.ts:15
     ctx.storage.sql.exec(`
0.71 packages/alchemy/test/Planetscale/MySQL/fixtures/Stack.ts:23
     const database = yield* Planetscale.MySQLDatabase("MySQLHyperdriveTestDb", {
0.71 packages/alchemy/test/Planetscale/Postgres/fixtures/Stack.ts:24
     const database = yield* Planetscale.PostgresDatabase("HyperdriveTestDb", {
0.71 packages/better-auth/src/Neon.ts:56
     Effect.sync(() => new Pool({ connectionString: url, max: 1 })),
0.71 packages/frontend-frameworks/fixtures/sveltekit/src/routes/platform/+page.server.ts:19
     await kv.put("fixture-key", "kv-round-trip");
```
