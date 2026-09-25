# effect/services/operations-have-no-requirements

A service's operations must have no requirements, typed Effect<A, E, never>, with their dependencies acquired when the service's Layer is built, never left in an operation's requirements type, as in Effect<A, E, Database>.

184 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound, never>;
  }
>()("@app/Users") {}

export const UsersLive = Layer.effect(
  Users,
  Effect.gen(function* () {
    const database = yield* Database;
    const logger = yield* Logger;
    return Users.of({
      find: (id) =>
        Effect.gen(function* () {
          yield* logger.log(`finding ${id}`);
          return yield* database.findUser(id);
        }),
    });
  }),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.91 packages/alchemy/src/AWS/Assets.ts:48:5
  44 │   {
  45 │     /**
  46 │      * The name of the assets bucket.
  47 │      */
> 48 │     readonly bucketName: Effect.Effect<string, never, AssetsRequirements>;
  49 │
  50 │     /**
  51 │      * Upload an asset to the assets bucket.
  52 │      * Uses content-addressed storage: `lambda/{hash}.zip`
  53 │      *
  54 │      * @param hash - The content hash of the asset
  55 │      * @param content - The asset content (zip file)
  56 │      * @returns The S3 key where the asset was uploaded
  57 │      */
  58 │     readonly uploadAsset: (
  59 │       hash: string,
  60 │       content: Uint8Array,
  61 │     ) => Effect.Effect<string, AssetsError, AssetsRequirements>;
  62 │
  63 │     /**
  64 │      * Check if an asset already exists in the assets bucket.
  65 │      *
  66 │      * @param hash - The content hash to check
  67 │      * @returns true if the asset exists
  68 │      */
  69 │     readonly hasAsset: (
  70 │       hash: string,
  71 │     ) => Effect.Effect<boolean, AssetsError, AssetsRequirements>;
  72 │   }

0.88 packages/alchemy/src/Hetzner/Ssh.ts:44:3
  41 │ export interface SshClient {
  42 │   exec: (
  43 │     command: string,
> 44 │   ) => Effect.Effect<SshExecResult, SshError, SshServices>;
  45 │   scp: (
  46 │     local: string | Uint8Array<ArrayBufferLike>,
  47 │     remote: string,
  48 │   ) => Effect.Effect<void, SshError, SshServices>;
  49 │ }

0.87 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:31:3
  28 │ ): Effect.Effect<
  29 │   ExportD1DatabaseResult,
  30 │   d1.ExportDatabaseError,
> 31 │   Credentials | HttpClient.HttpClient
  32 │ > =>

0.86 packages/alchemy/src/AWS/Lambda/ScheduleEventSource.ts:54:7
  52 │     return Effect.fn(function* <Req = never>(
  53 │       descriptor: ScheduleDescriptor,
> 54 │       process: (event: ScheduleEvent) => Effect.Effect<void, never, Req>,
  55 │     ) {
  56 │       // Stable route id — computed identically at deploy time (names the
  57 │       // backing Schedule + role) and at runtime (matches incoming events).
  58 │       const routeId = yield* Effect.sync(() =>
  59 │         createScheduleRouteId(descriptor, host),
  60 │       );
  61 │
  62 │       // Deploy-time: create the backing Schedule + execution role targeting
  63 │       // this function. Skipped once running inside the deployed Function (the
  64 │       // global guard), where the only work is registering the runtime handler
  65 │       // below.
  66 │       if (!globalThis.__ALCHEMY_RUNTIME__) {
  67 │         yield* createScheduleRoute(routeId, descriptor, host).pipe(
  68 │           Effect.asVoid,
  69 │         );
  70 │       }
  71 │
  72 │       yield* host.listen(
  73 │         Effect.sync(() => (event: any) => {
  74 │           if (isScheduleEvent(event) && event.scheduleId === routeId) {
  75 │             return process(event).pipe(Effect.orDie);
  76 │           }
  77 │         }),
  78 │       );
  79 │     }) as ScheduleEventSourceService;

0.85 packages/alchemy/src/Local/RpcProviderProxy.ts:32:5
  21 │ export class RpcProviderProxy extends Context.Service<
  22 │   RpcProviderProxy,
  23 │   {
  24 │     /**
  25 │      * The provider for `providerName`, served by the dev sidecar. `providersUrl`
  26 │      * is the URL of the module whose default export is the provider group's
  27 │      * layer (see `Local/Sidecar.ts`); the sidecar imports it on first use.
  28 │      */
  29 │     readonly get: <R extends ResourceLike>(
  30 │       providersUrl: string,
  31 │       providerName: R["Type"],
> 32 │     ) => Effect.Effect<ProviderService<R>, never, AlchemyContext | Stack>;
  33 │   }
  34 │ >()("alchemy/Local/RpcProviderProxy") {}

0.85 packages/alchemy/src/Stripe/CreateTerminalReader.ts:37:7
  28 │ export interface CreateTerminalReader extends Binding.Service<
  29 │   CreateTerminalReader,
  30 │   "Stripe.CreateTerminalReader",
  31 │   () => Effect.Effect<
  32 │     (
  33 │       request: CreateTerminalReaderRequest,
  34 │     ) => Effect.Effect<
  35 │       StripeTerminalReader,
  36 │       CreateTerminalReaderError,
> 37 │       RuntimeContext
  38 │     >
  39 │   >
  40 │ > {}

0.85 packages/alchemy/src/Stripe/UpdateTerminalReader.ts:40:7
  29 │ export interface UpdateTerminalReader extends Binding.Service<
  30 │   UpdateTerminalReader,
  31 │   "Stripe.UpdateTerminalReader",
  32 │   (
  33 │     reader: TerminalReader,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: UpdateTerminalReaderRequest,
  37 │     ) => Effect.Effect<
  38 │       UpdateTerminalReaderResponse,
  39 │       UpdateTerminalReaderError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.84 packages/alchemy/src/Stripe/CreateBillingPortalSession.ts:45:7
  36 │ export interface CreateBillingPortalSession extends Binding.Service<
  37 │   CreateBillingPortalSession,
  38 │   "Stripe.CreateBillingPortalSession",
  39 │   () => Effect.Effect<
  40 │     (
  41 │       request: CreateBillingPortalSessionRequest,
  42 │     ) => Effect.Effect<
  43 │       BillingPortalSession,
  44 │       CreateBillingPortalSessionError,
> 45 │       RuntimeContext
  46 │     >
  47 │   >
  48 │ > {}

0.84 packages/alchemy/src/Stripe/UpdateIssuingCardholder.ts:40:7
  29 │ export interface UpdateIssuingCardholder extends Binding.Service<
  30 │   UpdateIssuingCardholder,
  31 │   "Stripe.UpdateIssuingCardholder",
  32 │   (
  33 │     cardholder: IssuingCardholder,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: UpdateIssuingCardholderRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeIssuingCardholder,
  39 │       UpdateIssuingCardholderError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.84 packages/alchemy/src/Stripe/UpdateTaxSettings.ts:42:7
  31 │ export interface UpdateTaxSettings extends Binding.Service<
  32 │   UpdateTaxSettings,
  33 │   "Stripe.UpdateTaxSettings",
  34 │   (
  35 │     settings: TaxSettings,
  36 │   ) => Effect.Effect<
  37 │     (
  38 │       request?: UpdateTaxSettingsRequest,
  39 │     ) => Effect.Effect<
  40 │       StripeTaxSettings,
  41 │       CreateTaxSettingsError,
> 42 │       RuntimeContext
  43 │     >
  44 │   >
  45 │ > {}

0.83 packages/alchemy/src/AWS/Lambda/TopicRuleEventSource.ts:45:7
  42 │       props: TopicRuleEventSourceProps,
  43 │       process: (
  44 │         stream: Stream.Stream<IoTMessage>,
> 45 │       ) => Effect.Effect<void, never, Req>,
  46 │     ) {

0.83 packages/alchemy/src/Cloudflare/WorkersForPlatforms/Get.ts:74:3
  72 │ export interface DispatchNamespaceClient {
  73 │   /** Effect resolving to the raw dispatch-namespace runtime binding. */
> 74 │   raw: Effect.Effect<DispatchNamespace, never, RuntimeContext>;
  75 │   /**
  76 │    * Look up a user Worker in the dispatch namespace by script name and obtain
  77 │    * a `Fetcher` to send it requests.
  78 │    *
  79 │    * @param name Name of the user Worker script.
  80 │    * @param args Arguments passed to the user Worker script.
  81 │    * @param options Options for the dynamic-dispatch invocation.
  82 │    */
  83 │   get(
  84 │     name: string,
  85 │     args?: { [key: string]: any },
  86 │     options?: DynamicDispatchOptions,
  87 │   ): Effect.Effect<Fetcher, DispatchNamespaceError, RuntimeContext>;
  88 │ }

0.83 packages/alchemy/src/Kubernetes/ClusterAdapter.ts:301:5
  291 │   readonly registry?: {
  292 │     readonly resolve: (
  293 │       options: ImageRegistryResolveOptions,
  294 │     ) => Effect.Effect<ImageRegistryResult, any, AdapterLifecycleServices>;
  295 │     /** Plan-time content hash used by `diff` to surface source drift. */
  296 │     readonly hash: (
  297 │       options: ImageRegistryHashOptions,
  298 │     ) => Effect.Effect<string | undefined, any, AdapterLifecycleServices>;
  299 │     readonly delete: (
  300 │       options: ImageRegistryDeleteOptions,
> 301 │     ) => Effect.Effect<void, any, AdapterLifecycleServices>;
  302 │   };

0.83 packages/alchemy/src/Stripe/RetrievePrice.ts:34:5
  26 │ export interface RetrievePrice extends Binding.Service<
  27 │   RetrievePrice,
  28 │   "Stripe.RetrievePrice",
  29 │   (
  30 │     price: Price,
  31 │   ) => Effect.Effect<
  32 │     (
  33 │       request?: RetrievePriceRequest,
> 34 │     ) => Effect.Effect<StripePrice, GetPriceError, RuntimeContext>
  35 │   >
  36 │ > {}

0.83 packages/alchemy/src/Stripe/UpdateCreditGrant.ts:41:7
  30 │ export interface UpdateCreditGrant extends Binding.Service<
  31 │   UpdateCreditGrant,
  32 │   "Stripe.UpdateCreditGrant",
  33 │   (
  34 │     grant: CreditGrant,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request?: UpdateCreditGrantRequest,
  38 │     ) => Effect.Effect<
  39 │       StripeCreditGrant,
  40 │       UpdateBillingCreditGrantError,
> 41 │       RuntimeContext
  42 │     >
  43 │   >
  44 │ > {}

0.83 packages/alchemy/src/Stripe/UpdateFileLink.ts:38:5
  30 │ export interface UpdateFileLink extends Binding.Service<
  31 │   UpdateFileLink,
  32 │   "Stripe.UpdateFileLink",
  33 │   (
  34 │     fileLink: FileLink,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request?: UpdateFileLinkRequest,
> 38 │     ) => Effect.Effect<StripeFileLink, UpdateFileLinkError, RuntimeContext>
  39 │   >
  40 │ > {}

0.83 packages/alchemy/src/Stripe/UpdateIssuingCard.ts:40:7
  29 │ export interface UpdateIssuingCard extends Binding.Service<
  30 │   UpdateIssuingCard,
  31 │   "Stripe.UpdateIssuingCard",
  32 │   (
  33 │     card: IssuingCard,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: UpdateIssuingCardRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeIssuingCard,
  39 │       UpdateIssuingCardError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.83 packages/alchemy/test/Cloudflare/Workers/CronEventSource.types.ts:8:3
   6 │ class ScheduledTask extends Context.Service<
   7 │   ScheduledTask,
>  8 │   { run: Effect.Effect<void, never, RuntimeContext> }
   9 │ >()("test/ScheduledTask") {}
  10 │
  11 │ const ScheduleExpression = "* * * * *";

0.83 packages/frontend-frameworks/src/core/Framework.ts:73:5
  65 │ export class Framework extends Context.Service<
  66 │   Framework,
  67 │   {
  68 │     readonly build: (
  69 │       options?: FrameworkBuildOptions,
  70 │     ) => Effect.Effect<BuildOutput, FrameworkError>;
  71 │     readonly dev: (
  72 │       options?: FrameworkDevOptions,
> 73 │     ) => Effect.Effect<FrameworkDevServer, FrameworkError, Scope.Scope>;
  74 │   }
  75 │ >()("@alchemy.run/frontend-frameworks/core/Framework") {}

0.82 packages/alchemy/src/Cloudflare/AnalyticsEngine/WriteDataset.ts:52:3
  51 │ export interface DatasetClient {
> 52 │   raw: Effect.Effect<RuntimeAnalyticsEngineDataset, never, RuntimeContext>;
  53 │   writeDataPoint(
  54 │     dataPoint: DataPoint,
  55 │   ): Effect.Effect<void, DatasetError, RuntimeContext>;
  56 │ }

0.82 packages/alchemy/src/Cloudflare/DNS/ReadDnsHttp.ts:21:3
  18 │ /** Build the read-only client over an injectable auth and zone id. */
  19 │ export const dnsReadClient = (
  20 │   auth: DnsAuth,
> 21 │   zoneId: Effect.Effect<string>,
  22 │ ): ReadDnsClient => {
  23 │   const authorize = auth.authorize;
  24 │   return {
  25 │     getDnsRecord: Effect.fn("Cloudflare.DNS.getDnsRecord")(
  26 │       function* (dnsRecordId) {
  27 │         return yield* authorize(
  28 │           dns.getRecord({ zoneId: yield* zoneId, dnsRecordId }),
  29 │         );
  30 │       },
  31 │     ),
  32 │     listDnsRecords: Effect.fn("Cloudflare.DNS.listDnsRecords")(
  33 │       function* (request) {
  34 │         return yield* authorize(
  35 │           dns.listRecords({ zoneId: yield* zoneId, ...request }),
  36 │         );
  37 │       },
  38 │     ),
  39 │   };
  40 │ };

0.82 packages/alchemy/src/Cloudflare/Tunnel/ReadTunnel.ts:93:5
  88 │   get(
  89 │     tunnelId: string,
  90 │   ): Effect.Effect<
  91 │     GetTunnelCloudflaredResponse,
  92 │     GetTunnelCloudflaredError,
> 93 │     RuntimeContext
  94 │   >;

0.82 packages/alchemy/src/Fly/WriteSecret.ts:78:3
  73 │ export interface WriteSecretClient {
  74 │   /** Create or upsert a secret by name. */
  75 │   create(
  76 │     name: string,
  77 │     value: Redacted.Redacted<string> | string,
> 78 │   ): Effect.Effect<SetAppSecretResponse, CreateSecretError, RuntimeContext>;
  79 │   /** Update secrets by name (batch of one). */
  80 │   update(
  81 │     name: string,
  82 │     value: Redacted.Redacted<string> | string,
  83 │   ): Effect.Effect<AppSecretsUpdateResp, UpdateSecretsError, RuntimeContext>;
  84 │   /** Delete a secret by name. */
  85 │   delete(
  86 │     name: string,
  87 │   ): Effect.Effect<DeleteAppSecretResponse, DeleteSecretError, RuntimeContext>;
  88 │ }

0.82 packages/alchemy/src/Hetzner/WriteDns.ts:136:5
  131 │   createRecordSet(
  132 │     request: CreateRecordSetRequestInput,
  133 │   ): Effect.Effect<
  134 │     CreateZoneRrsetResponse,
  135 │     CreateZoneRrsetError,
> 136 │     RuntimeContext
  137 │   >;

0.82 packages/alchemy/src/Railway/ConnectMongo.ts:80:5
  72 │ export interface ConnectMongoClient {
  73 │   /**
  74 │    * Private (`{name}.railway.internal`) connection string. Pass this to
  75 │    * the MongoDB driver from a {@link Service}.
  76 │    */
  77 │   connectionString: Effect.Effect<
  78 │     Redacted.Redacted<string>,
  79 │     MongoUrlMissing,
> 80 │     RuntimeContext
  81 │   >;
  82 │   /**
  83 │    * Same private URI. Kept so callers matching the Postgres
  84 │    * `ConnectPostgres` shape keep working.
  85 │    */
  86 │   directConnectionString: Effect.Effect<
  87 │     Redacted.Redacted<string>,
  88 │     MongoUrlMissing,
  89 │     RuntimeContext
  90 │   >;
  91 │ }

0.82 packages/alchemy/src/Stripe/CreateCreditGrant.ts:39:7
  30 │ export interface CreateCreditGrant extends Binding.Service<
  31 │   CreateCreditGrant,
  32 │   "Stripe.CreateCreditGrant",
  33 │   () => Effect.Effect<
  34 │     (
  35 │       request: CreateBillingCreditGrantRequest,
  36 │     ) => Effect.Effect<
  37 │       StripeCreditGrant,
  38 │       CreateBillingCreditGrantError,
> 39 │       RuntimeContext
  40 │     >
  41 │   >
  42 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveAccountExternalAccount.ts:40:7
  29 │ export interface RetrieveAccountExternalAccount extends Binding.Service<
  30 │   RetrieveAccountExternalAccount,
  31 │   "Stripe.RetrieveAccountExternalAccount",
  32 │   (
  33 │     externalAccount: AccountExternalAccount,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveAccountExternalAccountRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeExternalAccount,
  39 │       GetAccountExternalAccountError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveAlert.ts:37:5
  29 │ export interface RetrieveAlert extends Binding.Service<
  30 │   RetrieveAlert,
  31 │   "Stripe.RetrieveAlert",
  32 │   (
  33 │     alert: Alert,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveAlertRequest,
> 37 │     ) => Effect.Effect<StripeBillingAlert, GetBillingAlertError, RuntimeContext>
  38 │   >
  39 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveBillingPortalConfiguration.ts:40:7
  29 │ export interface RetrieveBillingPortalConfiguration extends Binding.Service<
  30 │   RetrieveBillingPortalConfiguration,
  31 │   "Stripe.RetrieveBillingPortalConfiguration",
  32 │   (
  33 │     configuration: BillingPortalConfiguration,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveBillingPortalConfigurationRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeBillingPortalConfiguration,
  39 │       GetBillingPortalConfigurationError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveCreditGrant.ts:40:7
  29 │ export interface RetrieveCreditGrant extends Binding.Service<
  30 │   RetrieveCreditGrant,
  31 │   "Stripe.RetrieveCreditGrant",
  32 │   (
  33 │     grant: CreditGrant,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveCreditGrantRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeCreditGrant,
  39 │       GetBillingCreditGrantError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrievePaymentMethodDomain.ts:40:7
  29 │ export interface RetrievePaymentMethodDomain extends Binding.Service<
  30 │   RetrievePaymentMethodDomain,
  31 │   "Stripe.RetrievePaymentMethodDomain",
  32 │   (
  33 │     domain: PaymentMethodDomain,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrievePaymentMethodDomainRequest,
  37 │     ) => Effect.Effect<
  38 │       StripePaymentMethodDomain,
  39 │       GetPaymentMethodDomainError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveProduct.ts:41:5
  33 │ export interface RetrieveProduct extends Binding.Service<
  34 │   RetrieveProduct,
  35 │   "Stripe.RetrieveProduct",
  36 │   (
  37 │     product: string | Product,
  38 │   ) => Effect.Effect<
  39 │     (
  40 │       request?: RetrieveProductRequest,
> 41 │     ) => Effect.Effect<StripeProduct, GetProductError, RuntimeContext>
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveTerminalConfiguration.ts:40:7
  29 │ export interface RetrieveTerminalConfiguration extends Binding.Service<
  30 │   RetrieveTerminalConfiguration,
  31 │   "Stripe.RetrieveTerminalConfiguration",
  32 │   (
  33 │     configuration: TerminalConfiguration,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveTerminalConfigurationRequest,
  37 │     ) => Effect.Effect<
  38 │       GetTerminalConfigurationResponse,
  39 │       GetTerminalConfigurationError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/src/Stripe/RetrieveWebhookEndpoint.ts:40:7
  29 │ export interface RetrieveWebhookEndpoint extends Binding.Service<
  30 │   RetrieveWebhookEndpoint,
  31 │   "Stripe.RetrieveWebhookEndpoint",
  32 │   (
  33 │     webhookEndpoint: WebhookEndpoint,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveWebhookEndpointRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeWebhookEndpoint,
  39 │       GetWebhookEndpointError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.82 packages/alchemy/test/Cloudflare/Workers/HibernatingWebSocket.types.ts:38:5
  35 │   const decodeServices: Effect.Effect<
  36 │     number,
  37 │     WebSocketAttachmentError,
> 38 │     DecodeAttachment
  39 │   > = socket.getAttachment(WithServices);

0.81 packages/alchemy/src/ACME/IssueCertificate.ts:88:3
  84 │ export interface IssueCertificateClient {
  85 │   /** Order, solve DNS-01, finalize and download a certificate. */
  86 │   issue<R = never>(
  87 │     request: IssueRequest<R>,
> 88 │   ): Effect.Effect<IssuedCertificate, IssueError, RuntimeContext | R>;
  89 │   /** Revoke a certificate (`AcmeAlreadyRevoked` counts as success). */
  90 │   revoke(
  91 │     request: RevokeRequest,
  92 │   ): Effect.Effect<void, RevokeError, RuntimeContext>;
  93 │ }

0.81 packages/alchemy/src/Cloudflare/Tunnel/WriteTunnel.ts:111:5
  106 │   create(
  107 │     request: CreateTunnelRequest,
  108 │   ): Effect.Effect<
  109 │     CreateTunnelCloudflaredResponse,
  110 │     CreateTunnelCloudflaredError,
> 111 │     RuntimeContext
  112 │   >;

0.81 packages/alchemy/src/Cloudflare/Workers/CronEventSource.ts:207:1
  202 │ export const cron = <Req = never>(
  203 │   expression: string,
  204 │   process: (
  205 │     controller: cf.ScheduledController,
  206 │   ) => Effect.Effect<void, unknown, Req>,
> 207 │ ): Effect.Effect<void, never, CronEventSource | Exclude<Req, RuntimeContext>> =>
  208 │   CronEventSource.use((source) => source(expression, process));

0.81 packages/alchemy/src/Cloudflare/Workers/WorkerRuntime.ts:35:3
  29 │ export interface WorkerExecutionContextCache {
  30 │   /**
  31 │    * Purge cached responses by `Cache-Tag`, path prefix, or everything.
  32 │    */
  33 │   purge(
  34 │     options: cf.CachePurgeOptions,
> 35 │   ): Effect.Effect<cf.CachePurgeResult, CachePurgeError, RuntimeContext>;
  36 │ }

0.81 packages/alchemy/src/Fly/ConnectPostgres.ts:64:5
  56 │ export interface ConnectPostgresClient {
  57 │   /**
  58 │    * Pooled PgBouncer connection string. Pass this to
  59 │    * {@link Drizzle.Postgres} or `SQL.Postgres`.
  60 │    */
  61 │   connectionString: Effect.Effect<
  62 │     Redacted.Redacted<string>,
  63 │     PostgresUrlMissing,
> 64 │     RuntimeContext
  65 │   >;
  66 │   /**
  67 │    * Direct (non-PgBouncer) connection string. Use this for session-scoped
  68 │    * features (advisory locks, `LISTEN/NOTIFY`) when you are not going
  69 │    * through the pooled URL.
  70 │    */
  71 │   directConnectionString: Effect.Effect<
  72 │     Redacted.Redacted<string>,
  73 │     PostgresUrlMissing,
  74 │     RuntimeContext
  75 │   >;
  76 │ }

0.81 packages/alchemy/src/Neon/InvokeFunction.ts:13:3
   6 │ export interface InvokeFunctionClient {
   7 │   /** Public base URL; access control remains the application's responsibility. */
   8 │   url: Effect.Effect<string, never, RuntimeContext>;
   9 │   /** Stream an HTTP response. Supply caller authorization explicitly; no account API key is attached. */
  10 │   fetch(
  11 │     path?: string,
  12 │     init?: RequestInit,
> 13 │   ): Effect.Effect<Response, InvokeFunctionError, RuntimeContext>;
  14 │ }
  15 │
  16 │ import * as Data from "effect/Data";

0.81 packages/alchemy/src/Stripe/RetrieveCoupon.ts:37:5
  29 │ export interface RetrieveCoupon extends Binding.Service<
  30 │   RetrieveCoupon,
  31 │   "Stripe.RetrieveCoupon",
  32 │   (
  33 │     coupon: Coupon,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveCouponRequest,
> 37 │     ) => Effect.Effect<StripeCoupon, GetCouponError, RuntimeContext>
  38 │   >
  39 │ > {}

0.81 packages/alchemy/src/Stripe/RetrieveIssuingPersonalizationDesign.ts:40:7
  29 │ export interface RetrieveIssuingPersonalizationDesign extends Binding.Service<
  30 │   RetrieveIssuingPersonalizationDesign,
  31 │   "Stripe.RetrieveIssuingPersonalizationDesign",
  32 │   (
  33 │     design: IssuingPersonalizationDesign,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveIssuingPersonalizationDesignRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeIssuingPersonalizationDesign,
  39 │       GetIssuingPersonalizationDesignError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.81 packages/alchemy/src/Stripe/RetrievePromotionCode.ts:40:7
  29 │ export interface RetrievePromotionCode extends Binding.Service<
  30 │   RetrievePromotionCode,
  31 │   "Stripe.RetrievePromotionCode",
  32 │   (
  33 │     promotionCode: PromotionCode,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrievePromotionCodeRequest,
  37 │     ) => Effect.Effect<
  38 │       StripePromotionCode,
  39 │       GetPromotionCodeError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.80 packages/alchemy/src/Cloudflare/Email/Send.ts:69:3
  63 │ export interface SendClient {
  64 │   /**
  65 │    * The raw runtime `SendEmail` binding. Use this when you need direct
  66 │    * access to the Cloudflare object (e.g. to send a pre-built
  67 │    * `EmailMessage` from `cloudflare:email`).
  68 │    */
> 69 │   raw: Effect.Effect<runtime.SendEmail, never, RuntimeContext>;
  70 │   /**
  71 │    * Send an email using the builder form. Equivalent to calling
  72 │    * `env.<name>.send({ from, to, subject, text, html, ... })`.
  73 │    */
  74 │   send(
  75 │     message: SendEmailMessage,
  76 │   ): Effect.Effect<runtime.EmailSendResult, SendEmailError, RuntimeContext>;
  77 │   /**
  78 │    * Send a raw `EmailMessage` (constructed via `cloudflare:email`).
  79 │    */
  80 │   sendRaw(
  81 │     message: runtime.EmailMessage,
  82 │   ): Effect.Effect<runtime.EmailSendResult, SendEmailError, RuntimeContext>;
  83 │ }

0.80 packages/alchemy/src/Cloudflare/KV/ReadNamespace.ts:31:3
  30 │ export interface ReadNamespaceClient<Key extends string = string> {
> 31 │   raw: Effect.Effect<runtime.KVNamespace, never, RuntimeContext>;

0.80 packages/alchemy/src/Fly/WriteCertificates.ts:76:5
  71 │   request(
  72 │     hostname: string,
  73 │   ): Effect.Effect<
  74 │     CertificateDetail | undefined,
  75 │     CreateAppAcmeCertificateError,
> 76 │     RuntimeContext
  77 │   >;

0.80 packages/alchemy/src/Railway/HeadObject.ts:42:7
  31 │ export interface HeadObject extends Binding.Service<
  32 │   HeadObject,
  33 │   "Railway.HeadObject",
  34 │   (
  35 │     bucket: Bucket,
  36 │   ) => Effect.Effect<
  37 │     (
  38 │       request?: HeadObjectRequest,
  39 │     ) => Effect.Effect<
  40 │       S3.HeadObjectOutput,
  41 │       S3.HeadObjectError | Config.ConfigError | RailwayS3CredentialsMissing,
> 42 │       RuntimeContext
  43 │     >
  44 │   >
  45 │ > {}

0.80 packages/alchemy/src/Stripe/CreateAppsSecret.ts:34:5
  28 │ export interface CreateAppsSecret extends Binding.Service<
  29 │   CreateAppsSecret,
  30 │   "Stripe.CreateAppsSecret",
  31 │   () => Effect.Effect<
  32 │     (
  33 │       request: CreateAppsSecretRequest,
> 34 │     ) => Effect.Effect<StripeAppsSecret, CreateAppsSecretError, RuntimeContext>
  35 │   >
  36 │ > {}

0.80 packages/alchemy/src/Stripe/CreateCheckoutSession.ts:47:7
  38 │ export interface CreateCheckoutSession extends Binding.Service<
  39 │   CreateCheckoutSession,
  40 │   "Stripe.CreateCheckoutSession",
  41 │   () => Effect.Effect<
  42 │     (
  43 │       request: CreateCheckoutSessionRequest,
  44 │     ) => Effect.Effect<
  45 │       CheckoutSession,
  46 │       CreateCheckoutSessionError,
> 47 │       RuntimeContext
  48 │     >
  49 │   >
  50 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveAppsSecret.ts:41:7
  30 │ export interface RetrieveAppsSecret extends Binding.Service<
  31 │   RetrieveAppsSecret,
  32 │   "Stripe.RetrieveAppsSecret",
  33 │   (
  34 │     secret: AppsSecret,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request?: RetrieveAppsSecretRequest,
  38 │     ) => Effect.Effect<
  39 │       StripeAppsSecret,
  40 │       GetAppsSecretsFindError,
> 41 │       RuntimeContext
  42 │     >
  43 │   >
  44 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveEntitlementsFeature.ts:40:7
  29 │ export interface RetrieveEntitlementsFeature extends Binding.Service<
  30 │   RetrieveEntitlementsFeature,
  31 │   "Stripe.RetrieveEntitlementsFeature",
  32 │   (
  33 │     feature: EntitlementsFeature,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveEntitlementsFeatureRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeEntitlementsFeature,
  39 │       GetEntitlementsFeatureError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveFileLink.ts:37:5
  29 │ export interface RetrieveFileLink extends Binding.Service<
  30 │   RetrieveFileLink,
  31 │   "Stripe.RetrieveFileLink",
  32 │   (
  33 │     fileLink: FileLink,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveFileLinkRequest,
> 37 │     ) => Effect.Effect<StripeFileLink, GetFileLinkError, RuntimeContext>
  38 │   >
  39 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveIssuingCardholder.ts:40:7
  29 │ export interface RetrieveIssuingCardholder extends Binding.Service<
  30 │   RetrieveIssuingCardholder,
  31 │   "Stripe.RetrieveIssuingCardholder",
  32 │   (
  33 │     cardholder: IssuingCardholder,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveIssuingCardholderRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeIssuingCardholder,
  39 │       GetIssuingCardholderError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.80 packages/alchemy/src/Stripe/RetrievePaymentMethodConfiguration.ts:40:7
  29 │ export interface RetrievePaymentMethodConfiguration extends Binding.Service<
  30 │   RetrievePaymentMethodConfiguration,
  31 │   "Stripe.RetrievePaymentMethodConfiguration",
  32 │   (
  33 │     configuration: PaymentMethodConfiguration,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrievePaymentMethodConfigurationRequest,
  37 │     ) => Effect.Effect<
  38 │       StripePaymentMethodConfiguration,
  39 │       GetPaymentMethodConfigurationError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.80 packages/alchemy/src/Stripe/RetrievePlan.ts:34:5
  26 │ export interface RetrievePlan extends Binding.Service<
  27 │   RetrievePlan,
  28 │   "Stripe.RetrievePlan",
  29 │   (
  30 │     plan: Plan,
  31 │   ) => Effect.Effect<
  32 │     (
  33 │       request?: RetrievePlanRequest,
> 34 │     ) => Effect.Effect<StripePlan, GetPlanError, RuntimeContext>
  35 │   >
  36 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveRadarValueListItem.ts:40:7
  29 │ export interface RetrieveRadarValueListItem extends Binding.Service<
  30 │   RetrieveRadarValueListItem,
  31 │   "Stripe.RetrieveRadarValueListItem",
  32 │   (
  33 │     item: RadarValueListItem,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveRadarValueListItemRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeRadarValueListItem,
  39 │       GetRadarValueListItemError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.80 packages/alchemy/src/Stripe/RetrieveTaxRegistration.ts:40:7
  29 │ export interface RetrieveTaxRegistration extends Binding.Service<
  30 │   RetrieveTaxRegistration,
  31 │   "Stripe.RetrieveTaxRegistration",
  32 │   (
  33 │     taxRegistration: TaxRegistration,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveTaxRegistrationRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeTaxRegistration,
  39 │       GetTaxRegistrationError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.79 packages/alchemy/src/AWS/Lambda/QueueEventSource.ts:34:7
  31 │       props: QueueEventSourceProps,
  32 │       process: (
  33 │         stream: Stream.Stream<SQSRecord, never, StreamReq>,
> 34 │       ) => Effect.Effect<void, never, Req | StreamReq>,
  35 │     ) {

0.79 packages/alchemy/src/Cloudflare/DNS/ReadDns.ts:75:3
  71 │ export interface ReadDnsClient {
  72 │   /** Fetch a single DNS record by id. */
  73 │   getDnsRecord(
  74 │     dnsRecordId: string,
> 75 │   ): Effect.Effect<GetRecordResponse, GetRecordError, RuntimeContext>;
  76 │   /** List the DNS records in the bound zone. */
  77 │   listDnsRecords(
  78 │     request?: ListRecordsRequestInput,
  79 │   ): Effect.Effect<ListRecordsResponse, ListRecordsError, RuntimeContext>;
  80 │ }

0.79 packages/alchemy/src/Cloudflare/EdgeSession.ts:131:3
  126 │ export const createEdgeSession = (
  127 │   options: EdgeSessionOptions,
  128 │ ): Effect.Effect<
  129 │   EdgeSessionHandle,
  130 │   EdgeSessionError,
> 131 │   CloudflareEnvironment | HttpClient.HttpClient | Credentials | Access
  132 │ > =>
  133 │   Effect.gen(function* () {
  134 │     const [{ previewToken }, { url, headers }] = yield* Effect.all(
  135 │       [
  136 │         createUploadToken.pipe(Effect.flatMap((t) => uploadScript(options, t))),
  137 │         workerHost(options.scriptName).pipe(
  138 │           Effect.flatMap(
  139 │             Effect.fn(function* (host) {
  140 │               const headers = yield* Access.use((access) =>
  141 │                 access.getAccessHeaders(host),
  142 │               );
  143 │               return { url: `https://${host}`, headers };
  144 │             }),
  145 │           ),
  146 │         ),
  147 │       ],
  148 │       { concurrency: "unbounded" },
  149 │     );
  150 │     return {
  151 │       url,
  152 │       headers: { ...headers, "cf-workers-preview-token": previewToken },
  153 │     } satisfies EdgeSessionHandle;
  154 │   }).pipe((e) => wrap(e, "Failed to create edge preview session"));

0.79 packages/alchemy/src/Cloudflare/Workers/VersionMetadata.ts:28:3
  25 │ export type VersionMetadataAccessor = Effect.Effect<
  26 │   WorkerVersionMetadata,
  27 │   never,
> 28 │   RuntimeContext
  29 │ >;

0.79 packages/alchemy/src/Hetzner/ReadDns.ts:70:3
  65 │ export interface ReadDnsClient {
  66 │   /** Fetch a single RRSet by name and type. */
  67 │   getRecordSet(
  68 │     name: string,
  69 │     type: string,
> 70 │   ): Effect.Effect<GetZoneRrsetResponse, GetZoneRrsetError, RuntimeContext>;
  71 │   /** List RRSets in the bound zone. */
  72 │   listRecordSets(
  73 │     request?: ListRecordSetsRequestInput,
  74 │   ): Effect.Effect<ListZoneRrsetsResponse, ListZoneRrsetsError, RuntimeContext>;
  75 │ }

0.79 packages/alchemy/src/Neon/QueryDataApi.ts:34:5
  24 │ export interface QueryDataApiClient {
  25 │   /** Bound public PostgREST endpoint. */
  26 │   baseUrl: Effect.Effect<string, never, RuntimeContext>;
  27 │   /** Execute a relative PostgREST request with this caller's token, never an admin key. */
  28 │   execute: (
  29 │     request: HttpClientRequest.HttpClientRequest,
  30 │     token: Redacted.Redacted<string>,
  31 │   ) => Effect.Effect<
  32 │     HttpClientResponse.HttpClientResponse,
  33 │     HttpClientError.HttpClientError | DataApiRequestError,
> 34 │     RuntimeContext | Scope.Scope
  35 │   >;
  36 │ }

0.79 packages/alchemy/src/Neon/WriteObject.ts:50:3
  39 │ export interface WriteObject extends Binding.Service<
  40 │   WriteObject,
  41 │   "Neon.WriteObject",
  42 │   <T>(
  43 │     object: Object<T>,
  44 │     options?: StorageBindingOptions,
  45 │   ) => Effect.Effect<WriteObjectClient<T>>
  46 │ > {
  47 │   <T>(
  48 │     object: Object<T>,
  49 │     options?: StorageBindingOptions,
> 50 │   ): Effect.Effect<WriteObjectClient<T>, never, WriteObject>;
  51 │ }
  52 │ export const WriteObject = Binding.Service<WriteObject>("Neon.WriteObject");

0.79 packages/alchemy/src/Stripe/CreateIssuingCard.ts:37:7
  28 │ export interface CreateIssuingCard extends Binding.Service<
  29 │   CreateIssuingCard,
  30 │   "Stripe.CreateIssuingCard",
  31 │   () => Effect.Effect<
  32 │     (
  33 │       request: CreateIssuingCardRequest,
  34 │     ) => Effect.Effect<
  35 │       StripeIssuingCard,
  36 │       CreateIssuingCardError,
> 37 │       RuntimeContext
  38 │     >
  39 │   >
  40 │ > {}

0.79 packages/alchemy/src/Stripe/RetrieveAccountPerson.ts:37:5
  29 │ export interface RetrieveAccountPerson extends Binding.Service<
  30 │   RetrieveAccountPerson,
  31 │   "Stripe.RetrieveAccountPerson",
  32 │   (
  33 │     person: AccountPerson,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveAccountPersonRequest,
> 37 │     ) => Effect.Effect<StripePerson, GetAccountPersonError, RuntimeContext>
  38 │   >
  39 │ > {}

0.79 packages/alchemy/src/Stripe/RetrieveTerminalLocation.ts:40:7
  29 │ export interface RetrieveTerminalLocation extends Binding.Service<
  30 │   RetrieveTerminalLocation,
  31 │   "Stripe.RetrieveTerminalLocation",
  32 │   (
  33 │     location: TerminalLocation,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveTerminalLocationRequest,
  37 │     ) => Effect.Effect<
  38 │       GetTerminalLocationResponse,
  39 │       GetTerminalLocationError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.79 packages/alchemy/test/types/PrismaWorker.ts:14:5
  10 │ type ApiShape = {
  11 │   databaseUrl(): Effect.Effect<
  12 │     Redacted.Redacted<string>,
  13 │     never,
> 14 │     RuntimeContext
  15 │   >;
  16 │ };

0.78 packages/alchemy/src/AWS/Backup/StartRestoreJobHttp.ts:18:5
  15 │   Effect.gen(function* () {
  16 │     const startRestoreJob = yield* backup.startRestoreJob;
  17 │
> 18 │     return Effect.fn(function* <R extends Role>(restoreRole: R) {
  19 │       const RoleArn = yield* restoreRole.roleArn;

0.78 packages/alchemy/src/AWS/Lambda/TopicEventSource.ts:34:7
  31 │       props: TopicEventSourceProps,
  32 │       process: (
  33 │         stream: Stream.Stream<TopicNotification, never, StreamReq>,
> 34 │       ) => Effect.Effect<void, never, Req>,
  35 │     ) {
  36 │       const TopicArn = yield* topic.topicArn;

0.78 packages/alchemy/src/AWS/Lambda/WebSocketEventSource.ts:76:7
  73 │       props: WebSocketRouteProps,
  74 │       handler: (
  75 │         event: WebSocketEvent,
> 76 │       ) => Effect.Effect<WebSocketResult, never, Req>,
  77 │     ) {

0.78 packages/alchemy/src/AWS/RedshiftServerless/Connect.ts:106:7
   96 │ export interface Connect extends Binding.Service<
   97 │   Connect,
   98 │   "AWS.RedshiftServerless.Connect",
   99 │   (
  100 │     workgroup: Workgroup,
  101 │     options?: ConnectOptions,
  102 │   ) => Effect.Effect<
  103 │     Effect.Effect<
  104 │       WorkgroupConnectionInfo,
  105 │       serverless.GetCredentialsError,
> 106 │       RuntimeContext
  107 │     >
  108 │   >
  109 │ > {}

0.78 packages/alchemy/src/Cloudflare/KV/WriteNamespace.ts:34:3
  29 │ export interface WriteNamespaceClient<Key extends string = string> {
  30 │   put(
  31 │     key: Key,
  32 │     value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
  33 │     options?: KVNamespacePutOptions,
> 34 │   ): Effect.Effect<void, NamespaceError, RuntimeContext>;
  35 │   delete(key: Key): Effect.Effect<void, NamespaceError, RuntimeContext>;
  36 │ }

0.78 packages/alchemy/src/Cloudflare/Pipelines/WriteStream.ts:51:3
  50 │ export interface WriteStreamClient {
> 51 │   raw: Effect.Effect<Pipeline, never, RuntimeContext>;
  52 │   send(
  53 │     records: ReadonlyArray<PipelineRecord>,
  54 │   ): Effect.Effect<void, StreamSendError, RuntimeContext>;
  55 │ }

0.78 packages/alchemy/src/Cloudflare/Queues/WriteQueue.ts:60:3
  59 │ export interface WriteQueueClient {
> 60 │   raw: Effect.Effect<runtime.Queue<unknown>, never, RuntimeContext>;
  61 │   send(
  62 │     body: unknown,
  63 │     options?: SendOptions,
  64 │   ): Effect.Effect<void, SendError, RuntimeContext>;
  65 │   sendBatch(
  66 │     messages: ReadonlyArray<SendMessage>,
  67 │   ): Effect.Effect<void, SendError, RuntimeContext>;
  68 │ }

0.78 packages/alchemy/src/Cloudflare/Workers/DurableObjectState.ts:34:5
  32 │     waitUntil<A, E, R>(
  33 │       effect: Effect.Effect<A, E, R>,
> 34 │     ): Effect.Effect<void, never, R | RuntimeContext>;

0.78 packages/alchemy/src/GitHub/Octokit.ts:7:1
   4 │ import { normalizeGitHubBaseUrl } from "./BaseUrl.ts";
   5 │ import { GitHubCredentials } from "./Credentials.ts";
   6 │
>  7 │ export const Octokit: Effect.Effect<_Octokit, never, GitHubCredentials> =
   8 │   Effect.gen(function* () {
   9 │     const creds = yield* yield* GitHubCredentials;
  10 │     return creds.octokit();
  11 │   });

0.78 packages/alchemy/src/Railway/DeleteObject.ts:42:7
  31 │ export interface DeleteObject extends Binding.Service<
  32 │   DeleteObject,
  33 │   "Railway.DeleteObject",
  34 │   (
  35 │     bucket: Bucket,
  36 │   ) => Effect.Effect<
  37 │     (
  38 │       request?: DeleteObjectRequest,
  39 │     ) => Effect.Effect<
  40 │       S3.DeleteObjectOutput,
  41 │       S3.DeleteObjectError | Config.ConfigError | RailwayS3CredentialsMissing,
> 42 │       RuntimeContext
  43 │     >
  44 │   >
  45 │ > {}

0.78 packages/alchemy/src/Railway/PutObject.ts:45:7
  34 │ export interface PutObject extends Binding.Service<
  35 │   PutObject,
  36 │   "Railway.PutObject",
  37 │   (
  38 │     bucket: Bucket,
  39 │   ) => Effect.Effect<
  40 │     (
  41 │       request?: PutObjectRequest,
  42 │     ) => Effect.Effect<
  43 │       S3.PutObjectOutput,
  44 │       S3.PutObjectError | Config.ConfigError | RailwayS3CredentialsMissing,
> 45 │       RuntimeContext
  46 │     >
  47 │   >
  48 │ > {}

0.78 packages/alchemy/src/Stripe/CreateAccount.ts:34:5
  28 │ export interface CreateAccount extends Binding.Service<
  29 │   CreateAccount,
  30 │   "Stripe.CreateAccount",
  31 │   () => Effect.Effect<
  32 │     (
  33 │       request: CreateAccountRequest,
> 34 │     ) => Effect.Effect<StripeAccount, CreateAccountError, RuntimeContext>
  35 │   >
  36 │ > {}

0.78 packages/alchemy/src/Stripe/RetrieveRadarValueList.ts:40:7
  29 │ export interface RetrieveRadarValueList extends Binding.Service<
  30 │   RetrieveRadarValueList,
  31 │   "Stripe.RetrieveRadarValueList",
  32 │   (
  33 │     valueList: RadarValueList,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveRadarValueListRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeRadarValueList,
  39 │       GetRadarValueListError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.78 packages/alchemy/src/Stripe/RetrieveTerminalReader.ts:40:7
  29 │ export interface RetrieveTerminalReader extends Binding.Service<
  30 │   RetrieveTerminalReader,
  31 │   "Stripe.RetrieveTerminalReader",
  32 │   (
  33 │     reader: TerminalReader,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveTerminalReaderRequest,
  37 │     ) => Effect.Effect<
  38 │       GetTerminalReaderResponse,
  39 │       GetTerminalReaderError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.78 packages/alchemy/src/Stripe/UpdateAccount.ts:37:5
  29 │ export interface UpdateAccount extends Binding.Service<
  30 │   UpdateAccount,
  31 │   "Stripe.UpdateAccount",
  32 │   (
  33 │     account: Account,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: UpdateAccountRequest,
> 37 │     ) => Effect.Effect<StripeAccount, UpdateAccountError, RuntimeContext>
  38 │   >
  39 │ > {}

0.78 packages/cloudflare-runtime/src/core/bindings/images/Images.ts:65:7
  52 │ export class Images extends Plugin.Service<
  53 │   Images,
  54 │   {
  55 │     /**
  56 │      * Record that a local `images` binding is in use (so the images services
  57 │      * are only emitted when at least one binding exists), register the
  58 │      * node-side loopback route that runs Sharp transforms, and resolve the
  59 │      * service designator the wrapped `cloudflare-internal:images-api` binding
  60 │      * should target.
  61 │      */
  62 │     readonly register: () => Effect.Effect<
  63 │       WorkerdConfig.ServiceDesignator,
  64 │       ConfigError,
> 65 │       PluginContext | Loopback.Loopback
  66 │     >;
  67 │   }
  68 │ >()("cloudflare-runtime/plugin/Images") {}

0.77 packages/alchemy/src/AWS/Lambda/KafkaEventSource.ts:42:7
  39 │       props: KafkaEventSourceProps,
  40 │       process: (
  41 │         stream: Stream.Stream<MSKRecord, never, StreamReq>,
> 42 │       ) => Effect.Effect<void, never, Req>,
  43 │     ) {
  44 │       const ClusterArn = yield* cluster.clusterArn;

0.77 packages/alchemy/src/AWS/Lambda/StreamEventSource.ts:30:5
  27 │     const host = yield* Lambda.Function;
  28 │     const Mapping = yield* EventSourceMapping;
  29 │
> 30 │     return Effect.fn(function* <StreamReq = never, Req = never>(
  31 │       stream: KinesisStream,
  32 │       props: StreamEventSourceProps,

0.77 packages/alchemy/src/AWS/Redshift/Connect.ts:142:5
  135 │ export interface Connect extends Binding.Service<
  136 │   Connect,
  137 │   "AWS.Redshift.Connect",
  138 │   (
  139 │     cluster: Cluster,
  140 │     options?: ConnectOptions,
  141 │   ) => Effect.Effect<
> 142 │     Effect.Effect<ClusterConnectionInfo, ConnectError, RuntimeContext>
  143 │   >
  144 │ > {}
  145 │ export const Connect = Binding.Service<Connect>("AWS.Redshift.Connect");

0.77 packages/alchemy/src/Fly/ListObjectsV2.ts:41:7
  30 │ export interface ListObjectsV2 extends Binding.Service<
  31 │   ListObjectsV2,
  32 │   "Fly.ListObjectsV2",
  33 │   (
  34 │     bucket: Bucket,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request?: ListObjectsV2Request,
  38 │     ) => Effect.Effect<
  39 │       S3.ListObjectsV2Output,
  40 │       S3.ListObjectsV2Error | TigrisCredentialsMissing,
> 41 │       RuntimeContext
  42 │     >
  43 │   >
  44 │ > {}

0.77 packages/alchemy/src/Fly/ListSecrets.ts:60:5
  54 │ export interface ListSecrets extends Binding.Service<
  55 │   ListSecrets,
  56 │   "Fly.ListSecrets",
  57 │   (
  58 │     app: App,
  59 │   ) => Effect.Effect<
> 60 │     () => Effect.Effect<AppSecrets, ListSecretsError, RuntimeContext>
  61 │   >
  62 │ > {}

0.77 packages/alchemy/src/Git/BlobStore.ts:100:3
   97 │   readonly get: (
   98 │     key: string,
   99 │     range?: { readonly offset: number; readonly length: number },
> 100 │   ) => Effect.Effect<BlobBody | null, BlobStoreError, RuntimeContext>;

0.77 packages/alchemy/src/Stripe/RetrieveCustomerTaxId.ts:37:5
  29 │ export interface RetrieveCustomerTaxId extends Binding.Service<
  30 │   RetrieveCustomerTaxId,
  31 │   "Stripe.RetrieveCustomerTaxId",
  32 │   (
  33 │     taxId: CustomerTaxId,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveCustomerTaxIdRequest,
> 37 │     ) => Effect.Effect<StripeTaxId, GetCustomerTaxIdsByIdError, RuntimeContext>
  38 │   >
  39 │ > {}

0.77 packages/alchemy/src/Stripe/RetrieveIssuingCard.ts:37:5
  29 │ export interface RetrieveIssuingCard extends Binding.Service<
  30 │   RetrieveIssuingCard,
  31 │   "Stripe.RetrieveIssuingCard",
  32 │   (
  33 │     card: IssuingCard,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveIssuingCardRequest,
> 37 │     ) => Effect.Effect<StripeIssuingCard, GetIssuingCardError, RuntimeContext>
  38 │   >
  39 │ > {}

0.77 packages/alchemy/src/Stripe/RetrievePaymentLink.ts:37:5
  29 │ export interface RetrievePaymentLink extends Binding.Service<
  30 │   RetrievePaymentLink,
  31 │   "Stripe.RetrievePaymentLink",
  32 │   (
  33 │     paymentLink: PaymentLink,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrievePaymentLinkRequest,
> 37 │     ) => Effect.Effect<StripePaymentLink, GetPaymentLinkError, RuntimeContext>
  38 │   >
  39 │ > {}

0.77 packages/alchemy/src/Stripe/RetrieveShippingRate.ts:37:5
  29 │ export interface RetrieveShippingRate extends Binding.Service<
  30 │   RetrieveShippingRate,
  31 │   "Stripe.RetrieveShippingRate",
  32 │   (
  33 │     shippingRate: ShippingRate,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveShippingRateRequest,
> 37 │     ) => Effect.Effect<StripeShippingRate, GetShippingRateError, RuntimeContext>
  38 │   >
  39 │ > {}

0.77 packages/cloudflare-runtime/src/core/PluginContext.ts:26:5
  12 │ export class PluginContext extends Context.Service<
  13 │   PluginContext,
  14 │   {
  15 │     readonly worker: RuntimeWorker;
  16 │     readonly plugins: ReadonlyMap<
  17 │       string,
  18 │       | Plugin.Plugin<any>
  19 │       | Effect.Effect<Plugin.Plugin<any>, never, PluginContext>
  20 │     >;
  21 │     readonly get: <Self, Identifier extends Plugin.PluginIdentifier, Api>(
  22 │       service: Plugin.PluginService<Self, Identifier, Api>,
  23 │     ) => Effect.Effect<Plugin.Plugin<Api>, ConfigError>;
  24 │     readonly start: (
  25 │       ports: Workerd.WorkerdPorts,
> 26 │     ) => Effect.Effect<void, RuntimeError, Scope.Scope>;
  27 │     readonly config: Effect.Effect<
  28 │       {
  29 │         entry: string | undefined;
  30 │         sockets: Array<WorkerdConfig.Socket>;
  31 │         services: Array<WorkerdConfig.Service>;
  32 │         extensions: Array<WorkerdConfig.Extension>;
  33 │         userWorker: Partial<WorkerdConfig.Worker>;
  34 │       },
  35 │       RuntimeError
  36 │     >;
  37 │   }
  38 │ >()("cloudflare-runtime/PluginContext") {}

0.77 packages/cloudflare-runtime/src/core/Runtime.ts:41:7
  36 │ type BindingRequirements<B extends BindingHooks> =
  37 │   B extends Array<never>
  38 │     ? never
  39 │     : B extends Array<BindingHook<infer R>>
  40 │       ? R
> 41 │       : never;

0.76 packages/alchemy/src/AWS/Lambda/BrokerEventSource.ts:40:7
  37 │       props: BrokerEventSourceProps,
  38 │       process: (
  39 │         stream: Stream.Stream<MQMessage>,
> 40 │       ) => Effect.Effect<void, never, Req>,
  41 │     ) {

0.76 packages/alchemy/src/AWS/Lambda/TableEventSource.ts:37:7
  34 │       props: StreamsProps,
  35 │       process: (
  36 │         stream: Stream.Stream<StreamRecord<Data>, never, StreamReq>,
> 37 │       ) => Effect.Effect<void, never, Req>,
  38 │     ) {
  39 │       const TableArn = yield* table.tableArn;

0.76 packages/alchemy/src/Cloudflare/DNS/WriteDns.ts:120:3
  116 │ export interface WriteDnsClient {
  117 │   /** Create a DNS record. */
  118 │   createDnsRecord(
  119 │     request: CreateRecordRequestInput,
> 120 │   ): Effect.Effect<CreateRecordResponse, CreateRecordError, RuntimeContext>;
  121 │   /** Overwrite (PUT) a DNS record. */
  122 │   updateDnsRecord(
  123 │     dnsRecordId: string,
  124 │     request: UpdateRecordRequestInput,
  125 │   ): Effect.Effect<UpdateRecordResponse, UpdateRecordError, RuntimeContext>;
  126 │   /** Partially update (PATCH) a DNS record. */
  127 │   patchDnsRecord(
  128 │     dnsRecordId: string,
  129 │     request: PatchRecordRequestInput,
  130 │   ): Effect.Effect<PatchRecordResponse, PatchRecordError, RuntimeContext>;
  131 │   /** Delete a DNS record by id. */
  132 │   deleteDnsRecord(
  133 │     dnsRecordId: string,
  134 │   ): Effect.Effect<DeleteRecordResponse, DeleteRecordError, RuntimeContext>;
  135 │   /** Apply a batch of create / update / patch / delete operations atomically. */
  136 │   batchDnsRecords(
  137 │     request: BatchRecordRequestInput,
  138 │   ): Effect.Effect<BatchRecordResponse, BatchRecordError, RuntimeContext>;
  139 │ }

0.76 packages/alchemy/src/Cloudflare/R2/WriteBucket.ts:45:3
  31 │   put<Err = never>(
  32 │     key: string,
  33 │     value:
  34 │       | ReadableStream
  35 │       | ArrayBuffer
  36 │       | ArrayBufferView
  37 │       | string
  38 │       | null
  39 │       | Blob
  40 │       | Stream.Stream<Uint8Array, Err>,
  41 │     options?: PutOptions & {
  42 │       onlyIf: Conditional | Headers;
  43 │       contentLength?: number;
  44 │     },
> 45 │   ): Effect.Effect<R2Object | null, R2Error | Err, RuntimeContext>;

0.76 packages/alchemy/src/Prisma/WriteBucket.ts:41:3
  33 │ export interface WriteBucketClient {
  34 │   /**
  35 │    * Store an object, replacing any object already under the key.
  36 │    */
  37 │   put(
  38 │     key: string,
  39 │     value: BucketBody,
  40 │     options?: PutOptions,
> 41 │   ): Effect.Effect<BucketObject, BucketError, RuntimeContext>;
  42 │   /**
  43 │    * Delete one key or a list of keys. Deleting a key that does not exist
  44 │    * succeeds.
  45 │    */
  46 │   delete(
  47 │     keys: string | string[],
  48 │   ): Effect.Effect<void, BucketError, RuntimeContext>;
  49 │   /**
  50 │    * Mint a presigned upload URL, so a browser can write the object without
  51 │    * credentials. Pure client-side SigV4 — no request is made to the store.
  52 │    *
  53 │    * When `contentType` is set the uploader must send exactly that
  54 │    * `Content-Type`, because it is signed into the URL.
  55 │    */
  56 │   presignPut(
  57 │     key: string,
  58 │     options?: PresignPutOptions,
  59 │   ): Effect.Effect<string, BucketError, RuntimeContext>;
  60 │ }

0.76 packages/alchemy/src/Railway/BucketBinding.ts:111:3
  109 │ const authorizeS3 = <A, E>(
  110 │   scope: RailwayS3Scope,
> 111 │   operation: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,

0.76 packages/alchemy/src/Stripe/RetrieveAccount.ts:37:5
  29 │ export interface RetrieveAccount extends Binding.Service<
  30 │   RetrieveAccount,
  31 │   "Stripe.RetrieveAccount",
  32 │   (
  33 │     account: Account,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveAccountRequest,
> 37 │     ) => Effect.Effect<StripeAccount, GetAccountByAccountError, RuntimeContext>
  38 │   >
  39 │ > {}

0.76 packages/alchemy/src/Stripe/RetrieveCustomer.ts:37:5
  29 │ export interface RetrieveCustomer extends Binding.Service<
  30 │   RetrieveCustomer,
  31 │   "Stripe.RetrieveCustomer",
  32 │   (
  33 │     customer: Customer,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveCustomerRequest,
> 37 │     ) => Effect.Effect<GetCustomerResponse, GetCustomerError, RuntimeContext>
  38 │   >
  39 │ > {}

0.76 packages/alchemy/src/Stripe/RetrieveProductFeature.ts:40:7
  29 │ export interface RetrieveProductFeature extends Binding.Service<
  30 │   RetrieveProductFeature,
  31 │   "Stripe.RetrieveProductFeature",
  32 │   (
  33 │     productFeature: ProductFeature,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveProductFeatureRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeProductFeature,
  39 │       GetProductFeatureError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.76 packages/alchemy/src/Stripe/RetrieveTaxRate.ts:37:5
  29 │ export interface RetrieveTaxRate extends Binding.Service<
  30 │   RetrieveTaxRate,
  31 │   "Stripe.RetrieveTaxRate",
  32 │   (
  33 │     taxRate: TaxRate,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveTaxRateRequest,
> 37 │     ) => Effect.Effect<StripeTaxRate, GetTaxRateError, RuntimeContext>
  38 │   >
  39 │ > {}

0.76 packages/cloudflare-runtime/src/core/bindings/browser/Browser.ts:62:7
  48 │ export class Browser extends Plugin.Service<
  49 │   Browser,
  50 │   {
  51 │     /**
  52 │      * Record that a local `browser` binding is in use (so the browser service
  53 │      * is only emitted when at least one binding exists), register the
  54 │      * node-side loopback route that launches/inspects/kills Chrome, and
  55 │      * resolve the service designator the binding should target.
  56 │      */
  57 │     readonly register: (props: {
  58 │       readonly headful?: boolean;
  59 │     }) => Effect.Effect<
  60 │       WorkerdConfig.ServiceDesignator,
  61 │       ConfigError,
> 62 │       PluginContext | Loopback.Loopback
  63 │     >;
  64 │   }
  65 │ >()("cloudflare-runtime/plugin/Browser") {}

0.76 packages/cloudflare-runtime/src/core/bindings/stream/Stream.ts:86:5
  83 │     const fs = yield* FileSystem.FileSystem;
  84 │     const path = yield* Path.Path;
  85 │     const storage = yield* Storage.Storage;
> 86 │     const enableControlEndpoints = yield* Plugin.UnsafeEnableControlEndpoints;

0.75 packages/alchemy/src/AI/Agent.ts:35:3
  31 │ export interface AgentService {
  32 │   send(request: {
  33 │     input: any;
  34 │     session?: string;
> 35 │   }): Effect.Effect<void, never, RuntimeContext>;
  36 │ }

0.75 packages/alchemy/src/AWS/Backup/StartBackupJobHttp.ts:19:5
  16 │   Effect.gen(function* () {
  17 │     const startBackupJob = yield* backup.startBackupJob;
  18 │
> 19 │     return Effect.fn(function* <R extends Role>(
  20 │       vault: BackupVault,
  21 │       backupRole: R,
  22 │     ) {

0.75 packages/alchemy/src/AWS/DSQL/Connect.ts:89:5
  82 │ export interface Connect extends Binding.Service<
  83 │   Connect,
  84 │   "AWS.DSQL.Connect",
  85 │   (
  86 │     cluster: Cluster,
  87 │     options?: ConnectOptions,
  88 │   ) => Effect.Effect<
> 89 │     Effect.Effect<SqlConnectionInfo, PresignError, RuntimeContext>
  90 │   >
  91 │ > {}
  92 │ export const Connect = Binding.Service<Connect>("AWS.DSQL.Connect");

0.75 packages/alchemy/src/AWS/Lambda/EventBridgeEventSource.ts:129:7
  127 │       process: (
  128 │         events: Stream.Stream<EventRecord<Detail>, never, StreamReq>,
> 129 │       ) => Effect.Effect<void, never, Req>,
  130 │     ) {

0.75 packages/alchemy/src/Cli/CliKit/CliKit.ts:127:7
  119 │     readonly live: {
  120 │       /**
  121 │        * Add a mutable row to the live region. The handle is idempotent, and
  122 │        * the enclosing Scope closes it as a backstop so interruption can never
  123 │        * leave an orphaned row keeping the renderer mounted.
  124 │        */
  125 │       readonly progress: (
  126 │         options: ProgressOptions,
> 127 │       ) => Effect.Effect<ProgressHandle, never, Scope.Scope>;
  128 │       /**
  129 │        * Mount a live layout while the scope is open. The view is immutable —
  130 │        * dynamic content flows through a caller-owned store (`LiveStore` +
  131 │        * `useLiveStore`) that the view's component subscribes to.
  132 │        */
  133 │       readonly open: (
  134 │         view: View,
  135 │         options?: LiveViewOptions,
  136 │       ) => Effect.Effect<LiveViewHandle, never, Scope.Scope>;
  137 │     };

0.75 packages/alchemy/src/Cloudflare/AI/QuerySearchNamespace.ts:61:3
  55 │ export interface QuerySearchNamespaceClient {
  56 │   /**
  57 │    * Effect resolving to the raw underlying Cloudflare `SearchNamespace`
  58 │    * binding. Use this for operations not surfaced below (`create`, `delete`,
  59 │    * multi-instance `chatCompletions`).
  60 │    */
> 61 │   raw: Effect.Effect<runtime.AiSearchNamespace, never, RuntimeContext>;
  62 │   /**
  63 │    * Select an instance within the bound namespace by name.
  64 │    */
  65 │   get(instanceName: string): QuerySearchClient;
  66 │   /**
  67 │    * List the instances within the bound namespace.
  68 │    */
  69 │   list(
  70 │     params?: runtime.AiSearchListInstancesParams,
  71 │   ): Effect.Effect<runtime.AiSearchListResponse, SearchError, RuntimeContext>;
  72 │   /**
  73 │    * Search across multiple instances in the bound namespace (requires
  74 │    * `ai_search_options.instance_ids`).
  75 │    */
  76 │   search(
  77 │     params: runtime.AiSearchMultiSearchRequest,
  78 │   ): Effect.Effect<
  79 │     runtime.AiSearchMultiSearchResponse,
  80 │     SearchError,
  81 │     RuntimeContext
  82 │   >;
  83 │ }

0.75 packages/alchemy/src/Neon/upgrade.ts:21:3
  13 │ export const upgrade = (options?: {
  14 │   protocol?: string;
  15 │ }): Effect.Effect<
  16 │   {
  17 │     socket: WebSocket;
  18 │     response: HttpServerResponse.HttpServerResponse;
  19 │   },
  20 │   never,
> 21 │   RuntimeContext | FunctionRequest
  22 │ > =>
  23 │   Effect.gen(function* () {
  24 │     const request = yield* FunctionRequest;
  25 │     const { socket, response } = yield* Effect.sync(() =>
  26 │       upgradeWebSocket(request, options),
  27 │     );
  28 │     yield* Effect.sync(() => FunctionUpgradeSockets.set(response, socket));
  29 │     return { socket, response: HttpServerResponse.raw(response) };
  30 │   });

0.75 packages/alchemy/src/Prisma/Internal/LogsClient.ts:128:3
  122 │ export const getDeploymentLogsRequest = (
  123 │   deploymentId: string,
  124 │   query?: DeploymentLogsQuery,
  125 │ ): Effect.Effect<
  126 │   DeploymentLogsRequest,
  127 │   PrismaApiError | ConfigError,
> 128 │   Credentials
  129 │ > =>
  130 │   Effect.gen(function* () {
  131 │     const credentials = yield* Credentials;
  132 │     const { apiToken, apiBaseUrl } = yield* credentials;
  133 │     const url = yield* buildWebSocketUrl(
  134 │       apiBaseUrl,
  135 │       `/v1/deployments/${pathSegment(deploymentId)}/logs`,
  136 │       logsQuery(query),
  137 │     );
  138 │     return {
  139 │       url,
  140 │       headers: {
  141 │         Authorization: Redacted.make(`Bearer ${Redacted.value(apiToken)}`),
  142 │       },
  143 │     };
  144 │   });

0.75 packages/alchemy/src/Stripe/CreateAccountLink.ts:38:5
  32 │ export interface CreateAccountLink extends Binding.Service<
  33 │   CreateAccountLink,
  34 │   "Stripe.CreateAccountLink",
  35 │   () => Effect.Effect<
  36 │     (
  37 │       request: CreateAccountLinkRequest,
> 38 │     ) => Effect.Effect<AccountLink, CreateAccountLinkError, RuntimeContext>
  39 │   >
  40 │ > {}

0.75 packages/alchemy/src/Stripe/CreateFileLink.ts:32:5
  26 │ export interface CreateFileLink extends Binding.Service<
  27 │   CreateFileLink,
  28 │   "Stripe.CreateFileLink",
  29 │   () => Effect.Effect<
  30 │     (
  31 │       request: CreateFileLinkRequest,
> 32 │     ) => Effect.Effect<StripeFileLink, CreateFileLinkError, RuntimeContext>
  33 │   >
  34 │ > {}

0.75 packages/alchemy/src/Stripe/RetrieveApplePayDomain.ts:40:7
  29 │ export interface RetrieveApplePayDomain extends Binding.Service<
  30 │   RetrieveApplePayDomain,
  31 │   "Stripe.RetrieveApplePayDomain",
  32 │   (
  33 │     applePayDomain: ApplePayDomain,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveApplePayDomainRequest,
  37 │     ) => Effect.Effect<
  38 │       StripeApplePayDomain,
  39 │       GetApplePayDomainError,
> 40 │       RuntimeContext
  41 │     >
  42 │   >
  43 │ > {}

0.75 packages/alchemy/src/Stripe/RetrieveTaxSettings.ts:36:5
  28 │ export interface RetrieveTaxSettings extends Binding.Service<
  29 │   RetrieveTaxSettings,
  30 │   "Stripe.RetrieveTaxSettings",
  31 │   (
  32 │     settings: TaxSettings,
  33 │   ) => Effect.Effect<
  34 │     (
  35 │       request?: RetrieveTaxSettingsRequest,
> 36 │     ) => Effect.Effect<StripeTaxSettings, GetTaxSettingsError, RuntimeContext>
  37 │   >
  38 │ > {}

0.75 packages/alchemy/src/Stripe/UpdateCustomer.ts:37:5
  29 │ export interface UpdateCustomer extends Binding.Service<
  30 │   UpdateCustomer,
  31 │   "Stripe.UpdateCustomer",
  32 │   (
  33 │     customer: Customer,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: UpdateCustomerRequest,
> 37 │     ) => Effect.Effect<StripeCustomer, UpdateCustomerError, RuntimeContext>
  38 │   >
  39 │ > {}

0.74 packages/alchemy/src/AWS/BedrockAgentCore/ListEvents.ts:41:3
  38 │ export interface ListEvents extends Binding.Service<
  39 │   ListEvents,
  40 │   "AWS.BedrockAgentCore.ListEvents",
> 41 │   <R extends Memory>(
  42 │     memory: R,
  43 │   ) => Effect.Effect<
  44 │     (
  45 │       request: ListEventsRequest,
  46 │     ) => Effect.Effect<agentcore.ListEventsOutput, agentcore.ListEventsError>
  47 │   >
  48 │ > {}

0.74 packages/alchemy/src/AWS/Lambda/BucketEventSource.ts:55:7
  52 │       props: NotificationsProps<Events>,
  53 │       process: (
  54 │         stream: Stream.Stream<BucketNotification, never, StreamReq>,
> 55 │       ) => Effect.Effect<void, never, Req>,
  56 │     ) {
  57 │       // this adds it to the Lambda Function's environment variables
  58 │       const BucketName = yield* bucket.bucketName;

0.74 packages/alchemy/src/AWS/Lambda/DocDBClusterEventSource.ts:32:7
  29 │       props: ClusterEventSourceProps,
  30 │       process: (
  31 │         stream: Stream.Stream<DocumentDBRecord<TDoc>>,
> 32 │       ) => Effect.Effect<void, never, Req>,
  33 │     ) {
  34 │       const ClusterArn = yield* cluster.dbClusterArn;

0.74 packages/alchemy/src/Cloudflare/DNS/WriteDnsHttp.ts:21:3
  18 │ /** Build the write client over an injectable auth and zone id. */
  19 │ export const dnsWriteClient = (
  20 │   auth: DnsAuth,
> 21 │   zoneId: Effect.Effect<string>,
  22 │ ): WriteDnsClient => {
  23 │   const authorize = auth.authorize;

0.74 packages/alchemy/src/Cloudflare/Workers/Fetch.ts:31:7
  20 │ export interface Fetch extends Binding.Service<
  21 │   Fetch,
  22 │   "Cloudflare.Workers.Fetch",
  23 │   (
  24 │     worker: Worker,
  25 │   ) => Effect.Effect<
  26 │     (
  27 │       request: HttpClientRequest.HttpClientRequest,
  28 │     ) => Effect.Effect<
  29 │       HttpClientResponse.HttpClientResponse,
  30 │       HttpClientError.RequestError,
> 31 │       RuntimeContext
  32 │     >
  33 │   >
  34 │ > {}

0.74 packages/alchemy/src/Fly/DeleteObject.ts:41:7
  30 │ export interface DeleteObject extends Binding.Service<
  31 │   DeleteObject,
  32 │   "Fly.DeleteObject",
  33 │   (
  34 │     bucket: Bucket,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request: DeleteObjectRequest,
  38 │     ) => Effect.Effect<
  39 │       S3.DeleteObjectOutput,
  40 │       S3.DeleteObjectError | TigrisCredentialsMissing,
> 41 │       RuntimeContext
  42 │     >
  43 │   >
  44 │ > {}

0.74 packages/alchemy/src/Fly/Encrypt.ts:58:5
  50 │ export interface Encrypt extends Binding.Service<
  51 │   Encrypt,
  52 │   "Fly.Encrypt",
  53 │   (
  54 │     key: SecretKey,
  55 │   ) => Effect.Effect<
  56 │     (
  57 │       request: EncryptRequest,
> 58 │     ) => Effect.Effect<EncryptResult, EncryptSecretKeyError, RuntimeContext>
  59 │   >
  60 │ > {}

0.74 packages/alchemy/src/Fly/GetObject.ts:43:7
  32 │ export interface GetObject extends Binding.Service<
  33 │   GetObject,
  34 │   "Fly.GetObject",
  35 │   (
  36 │     bucket: Bucket,
  37 │   ) => Effect.Effect<
  38 │     (
  39 │       request: GetObjectRequest,
  40 │     ) => Effect.Effect<
  41 │       S3.GetObjectOutput,
  42 │       S3.GetObjectError | TigrisCredentialsMissing,
> 43 │       RuntimeContext
  44 │     >
  45 │   >
  46 │ > {}

0.74 packages/alchemy/src/Fly/HeadObject.ts:41:7
  30 │ export interface HeadObject extends Binding.Service<
  31 │   HeadObject,
  32 │   "Fly.HeadObject",
  33 │   (
  34 │     bucket: Bucket,
  35 │   ) => Effect.Effect<
  36 │     (
  37 │       request: HeadObjectRequest,
  38 │     ) => Effect.Effect<
  39 │       S3.HeadObjectOutput,
  40 │       S3.HeadObjectError | TigrisCredentialsMissing,
> 41 │       RuntimeContext
  42 │     >
  43 │   >
  44 │ > {}

0.74 packages/alchemy/src/Fly/PutObject.ts:44:7
  33 │ export interface PutObject extends Binding.Service<
  34 │   PutObject,
  35 │   "Fly.PutObject",
  36 │   (
  37 │     bucket: Bucket,
  38 │   ) => Effect.Effect<
  39 │     (
  40 │       request: PutObjectRequest,
  41 │     ) => Effect.Effect<
  42 │       S3.PutObjectOutput,
  43 │       S3.PutObjectError | TigrisCredentialsMissing,
> 44 │       RuntimeContext
  45 │     >
  46 │   >
  47 │ > {}

0.74 packages/alchemy/src/Fly/SpriteHttp.ts:39:5
  37 │ export interface SpriteAuth {
  38 │   authorize: <A, E>(
> 39 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  40 │   ) => Effect.Effect<A, E, RuntimeContext>;
  41 │ }

0.74 packages/alchemy/src/Hetzner/WriteDnsHttp.ts:21:3
  18 │ /** Build the write client over an injectable auth and zone id. */
  19 │ export const dnsWriteClient = (
  20 │   auth: DnsAuth,
> 21 │   zoneId: Effect.Effect<number>,
  22 │ ): WriteDnsClient => {
  23 │   const authorize = auth.authorize;

0.74 packages/alchemy/src/Server/S3BucketEventSource.ts:30:7
  27 │       props: NotificationsProps<Events>,
  28 │       process: (
  29 │         stream: Stream.Stream<BucketNotification, never, StreamReq>,
> 30 │       ) => Effect.Effect<void, never, Req>,
  31 │     ) {
  32 │       const queue = yield* Queue(`${bucket.LogicalId}-BucketEvents`);

0.74 packages/alchemy/src/Stripe/CreateCustomer.ts:33:5
  27 │ export interface CreateCustomer extends Binding.Service<
  28 │   CreateCustomer,
  29 │   "Stripe.CreateCustomer",
  30 │   () => Effect.Effect<
  31 │     (
  32 │       request: CreateCustomerRequest,
> 33 │     ) => Effect.Effect<StripeCustomer, CreateCustomerError, RuntimeContext>
  34 │   >
  35 │ > {}

0.74 packages/alchemy/src/Stripe/RetrieveBillingMeter.ts:37:5
  29 │ export interface RetrieveBillingMeter extends Binding.Service<
  30 │   RetrieveBillingMeter,
  31 │   "Stripe.RetrieveBillingMeter",
  32 │   (
  33 │     meter: BillingMeter,
  34 │   ) => Effect.Effect<
  35 │     (
  36 │       request?: RetrieveBillingMeterRequest,
> 37 │     ) => Effect.Effect<StripeBillingMeter, GetBillingMeterError, RuntimeContext>
  38 │   >
  39 │ > {}

0.73 packages/alchemy/src/AWS/CloudFront/KvRoutesUpdate.ts:221:7
  212 │       const upsertEntry = (
  213 │         store: string,
  214 │         fullKey: string,
  215 │         entryToAdd: string,
  216 │         entryToRemove: string | undefined,
  217 │       ): Effect.Effect<
  218 │         void,
  219 │         kvs.UpdateKeysError,
  220 │         HttpClient | Region | Credentials
> 221 │       > =>
  222 │         Effect.gen(function* () {
  223 │           const etag = yield* getKvsEtag(store);
  224 │           const { routes, chunkNum } = yield* getRoutes(store, fullKey);
  225 │           const filtered =
  226 │             entryToRemove !== undefined
  227 │               ? routes.filter((r) => r !== entryToRemove)
  228 │               : routes.slice();
  229 │           if (!filtered.includes(entryToAdd)) {
  230 │             filtered.push(entryToAdd);
  231 │           }
  232 │           yield* setRoutes(store, etag, fullKey, filtered, chunkNum);
  233 │         }).pipe(
  234 │           Effect.retry({
  235 │             while: (error) =>
  236 │               error._tag === "ValidationException" &&
  237 │               isKvsPreconditionFailed(error),
  238 │             schedule: cappedKvsRetrySchedule,
  239 │           }),
  240 │         );

0.73 packages/alchemy/src/AWS/DocDB/Connect.ts:156:7
  146 │ export interface Connect extends Binding.Service<
  147 │   Connect,
  148 │   "AWS.DocDB.Connect",
  149 │   (
  150 │     cluster: DBCluster,
  151 │     options?: ConnectOptions,
  152 │   ) => Effect.Effect<
  153 │     Effect.Effect<
  154 │       MongoConnectionInfo,
  155 │       secretsmanager.GetSecretValueError,
> 156 │       RuntimeContext
  157 │     >
  158 │   >
  159 │ > {}

0.73 packages/alchemy/src/AWS/ECRPublic/DescribeImages.ts:35:3
  32 │ export interface DescribeImages extends Binding.Service<
  33 │   DescribeImages,
  34 │   "AWS.ECRPublic.DescribeImages",
> 35 │   <R extends PublicRepository>(
  36 │     repository: R,
  37 │   ) => Effect.Effect<
  38 │     (
  39 │       request?: DescribeImagesRequest,
  40 │     ) => Effect.Effect<
  41 │       ecrpublic.DescribeImagesResponse,
  42 │       ecrpublic.DescribeImagesError
  43 │     >
  44 │   >
  45 │ > {}

0.73 packages/alchemy/src/AWS/PaymentCryptography/GenerateMacEmvPinChangeHttp.ts:25:5
  22 │     const generateMacEmvPinChange =
  23 │       yield* paymentcryptographydata.generateMacEmvPinChange;
  24 │
> 25 │     return Effect.fn(function* <P extends Key, I extends Key, C extends Key>(
  26 │       newPinPek: P,
  27 │       secureMessagingIntegrityKey: I,
  28 │       secureMessagingConfidentialityKey: C,

0.73 packages/alchemy/src/AWS/SimpleDB/ListDomains.ts:37:7
  28 │ export interface ListDomains extends Binding.Service<
  29 │   ListDomains,
  30 │   "AWS.SimpleDB.ListDomains",
  31 │   () => Effect.Effect<
  32 │     (
  33 │       request?: sdb.ListDomainsRequest,
  34 │     ) => Effect.Effect<
  35 │       sdb.ListDomainsResponse,
  36 │       sdb.ListDomainsError,
> 37 │       RuntimeContext
  38 │     >
  39 │   >
  40 │ > {}

0.73 packages/alchemy/src/Cloudflare/Workers/EmailEventSource.ts:242:5
  240 │ export const email = (props: EmailSubscribeProps = {}) => ({
  241 │   subscribe: <E = never, Req = never>(
> 242 │     process: (message: ForwardableEmailMessage) => Effect.Effect<void, E, Req>,
  243 │   ) => EmailEventSource.use((source) => source(props, process)),
  244 │ });

0.73 packages/alchemy/src/Fly/Exec.ts:51:5
  43 │ export interface Exec extends Binding.Service<
  44 │   Exec,
  45 │   "Fly.Exec",
  46 │   (
  47 │     sprite: Sprite,
  48 │   ) => Effect.Effect<
  49 │     (
  50 │       request: ExecRequest,
> 51 │     ) => Effect.Effect<ExecResult, ExecCommandError, RuntimeContext>
  52 │   >
  53 │ > {}

0.73 packages/alchemy/src/Fly/Sign.ts:44:5
  36 │ export interface Sign extends Binding.Service<
  37 │   Sign,
  38 │   "Fly.Sign",
  39 │   (
  40 │     key: SecretKey,
  41 │   ) => Effect.Effect<
  42 │     (
  43 │       request: SignRequest,
> 44 │     ) => Effect.Effect<SignResult, SignSecretKeyError, RuntimeContext>
  45 │   >
  46 │ > {}

0.73 packages/alchemy/src/Fly/Verify.ts:45:5
  37 │ export interface Verify extends Binding.Service<
  38 │   Verify,
  39 │   "Fly.Verify",
  40 │   (
  41 │     key: SecretKey,
  42 │   ) => Effect.Effect<
  43 │     (
  44 │       request: VerifyRequest,
> 45 │     ) => Effect.Effect<VerifyResult, VerifySecretKeyError, RuntimeContext>
  46 │   >
  47 │ > {}

0.73 packages/alchemy/src/Http.ts:73:7
  58 │ export class HttpServer extends Context.Service<
  59 │   HttpServer,
  60 │   {
  61 │     serve: <Req = never>(
  62 │       handler: Effect.Effect<
  63 │         HttpServerResponse.HttpServerResponse,
  64 │         HttpServerError | HttpBodyError,
  65 │         Req
  66 │       >,
  67 │       options?: {
  68 │         port?: number;
  69 │       },
  70 │     ) => Effect.Effect<
  71 │       void,
  72 │       never,
> 73 │       Exclude<Req, HttpServerRequest> | Scope.Scope
  74 │     >;
  75 │   }
  76 │ >()("HttpServer") {}

0.73 packages/alchemy/src/Railway/GetObject.ts:44:7
  33 │ export interface GetObject extends Binding.Service<
  34 │   GetObject,
  35 │   "Railway.GetObject",
  36 │   (
  37 │     bucket: Bucket,
  38 │   ) => Effect.Effect<
  39 │     (
  40 │       request?: GetObjectRequest,
  41 │     ) => Effect.Effect<
  42 │       S3.GetObjectOutput,
  43 │       S3.GetObjectError | Config.ConfigError | RailwayS3CredentialsMissing,
> 44 │       RuntimeContext
  45 │     >
  46 │   >
  47 │ > {}

0.73 packages/alchemy/src/Railway/ListObjectsV2.ts:42:7
  31 │ export interface ListObjectsV2 extends Binding.Service<
  32 │   ListObjectsV2,
  33 │   "Railway.ListObjectsV2",
  34 │   (
  35 │     bucket: Bucket,
  36 │   ) => Effect.Effect<
  37 │     (
  38 │       request?: ListObjectsV2Request,
  39 │     ) => Effect.Effect<
  40 │       S3.ListObjectsV2Output,
  41 │       S3.ListObjectsV2Error | Config.ConfigError | RailwayS3CredentialsMissing,
> 42 │       RuntimeContext
  43 │     >
  44 │   >
  45 │ > {}

0.73 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/container.ts:16:5
  11 │ export class MyContainer extends Cloudflare.Container<
  12 │   MyContainer,
  13 │   {
  14 │     ping: () => Effect.Effect<string>;
  15 │     /** The value a `Binding.Service` injected into the container's env. */
> 16 │     boundEnv: () => Effect.Effect<string | undefined, never, RuntimeContext>;
  17 │     /** Read an object's text body from R2 (or `null` when absent). */
  18 │     readObject: (
  19 │       key: string,
  20 │     ) => Effect.Effect<string | null, never, RuntimeContext>;
  21 │   }
  22 │ >()("EffectfulContainer") {}

0.73 packages/alchemy/test/types/PrismaLambda.ts:14:5
  10 │ type ApiShape = {
  11 │   databaseUrl(): Effect.Effect<
  12 │     Redacted.Redacted<string>,
  13 │     never,
> 14 │     RuntimeContext
  15 │   >;
  16 │ };

0.72 packages/alchemy/src/AWS/AuthProvider.ts:353:7
  348 │     const configureCredentials = (
  349 │       profileName: string,
  350 │     ): Effect.Effect<
  351 │       AwsAuthConfig,
  352 │       AuthError,
> 353 │       | ChildProcessSpawner
  354 │       | HttpClient.HttpClient
  355 │       | FileSystem.FileSystem
  356 │       | Path.Path
  357 │       | Interaction.Interaction
  358 │     > =>
  359 │       configureInteractive(profileName).pipe(
  360 │         Effect.mapError((e) =>
  361 │           e instanceof AuthError
  362 │             ? e
  363 │             : new AuthError({
  364 │                 message: "failed to configure credentials",
  365 │                 cause: e,
  366 │               }),
  367 │         ),
  368 │       );

0.72 packages/alchemy/src/AWS/BedrockAgentCore/CreateEvent.ts:62:3
  59 │ export interface CreateEvent extends Binding.Service<
  60 │   CreateEvent,
  61 │   "AWS.BedrockAgentCore.CreateEvent",
> 62 │   <R extends Memory>(
  63 │     memory: R,
  64 │   ) => Effect.Effect<
  65 │     (
  66 │       request: CreateEventRequest,
  67 │     ) => Effect.Effect<agentcore.CreateEventOutput, agentcore.CreateEventError>
  68 │   >
  69 │ > {}

0.72 packages/alchemy/src/AWS/BedrockAgentCore/ListBrowserSessions.ts:38:3
  35 │ export interface ListBrowserSessions extends Binding.Service<
  36 │   ListBrowserSessions,
  37 │   "AWS.BedrockAgentCore.ListBrowserSessions",
> 38 │   <R extends BrowserCustom>(
  39 │     browser: R,
  40 │   ) => Effect.Effect<
  41 │     (
  42 │       request: ListBrowserSessionsRequest,
  43 │     ) => Effect.Effect<
  44 │       agentcore.ListBrowserSessionsResponse,
  45 │       agentcore.ListBrowserSessionsError
  46 │     >
  47 │   >
  48 │ > {}

0.72 packages/alchemy/src/AWS/BedrockAgentCore/UpdateBrowserStream.ts:43:3
  40 │ export interface UpdateBrowserStream extends Binding.Service<
  41 │   UpdateBrowserStream,
  42 │   "AWS.BedrockAgentCore.UpdateBrowserStream",
> 43 │   <R extends BrowserCustom>(
  44 │     browser: R,
  45 │   ) => Effect.Effect<
  46 │     (
  47 │       request: UpdateBrowserStreamRequest,
  48 │     ) => Effect.Effect<
  49 │       agentcore.UpdateBrowserStreamResponse,
  50 │       agentcore.UpdateBrowserStreamError
  51 │     >
  52 │   >
  53 │ > {}

0.72 packages/alchemy/src/AWS/PaymentCryptography/DecryptData.ts:35:3
  32 │ export interface DecryptData extends Binding.Service<
  33 │   DecryptData,
  34 │   "AWS.PaymentCryptography.DecryptData",
> 35 │   <K extends Key>(
  36 │     key: K,
  37 │   ) => Effect.Effect<
  38 │     (
  39 │       request: DecryptDataRequest,
  40 │     ) => Effect.Effect<
  41 │       paymentcryptographydata.DecryptDataOutput,
  42 │       paymentcryptographydata.DecryptDataError
  43 │     >
  44 │   >
  45 │ > {}

0.72 packages/alchemy/src/AWS/RDSData/BeginTransaction.ts:65:7
  55 │ export interface BeginTransaction extends Binding.Service<
  56 │   BeginTransaction,
  57 │   "AWS.RDSData.BeginTransaction",
  58 │   (
  59 │     cluster: DBCluster,
  60 │     options: BeginTransactionOptions,
  61 │   ) => Effect.Effect<
  62 │     () => Effect.Effect<
  63 │       rdsdata.BeginTransactionResponse,
  64 │       rdsdata.BeginTransactionError,
> 65 │       RuntimeContext
  66 │     >
  67 │   >
  68 │ > {}

0.72 packages/alchemy/src/Cloudflare/Access/Context.ts:34:3
  31 │ export const Context: Effect.Effect<
  32 │   WorkerExecutionContextAccess | undefined,
  33 │   never,
> 34 │   RuntimeContext | WorkerExecutionContext
  35 │ > = WorkerExecutionContext.pipe(Effect.flatMap((ctx) => ctx.access));

0.72 packages/alchemy/src/Cloudflare/DNS/ReadWriteDnsHttp.ts:22:3
  19 │ /** Build the combined read + write client over an injectable auth and zone id. */
  20 │ export const dnsReadWriteClient = (
  21 │   auth: DnsAuth,
> 22 │   zoneId: Effect.Effect<string>,
  23 │ ): ReadWriteDnsClient => ({
  24 │   ...dnsReadClient(auth, zoneId),
  25 │   ...dnsWriteClient(auth, zoneId),
  26 │ });

0.72 packages/alchemy/src/Cloudflare/Flagship/ReadFlagsHttpClient.ts:28:5
  26 │ export interface FlagshipAuth {
  27 │   authorize: <A, E>(
> 28 │     eff: Effect.Effect<A, E, Credentials | HttpClient.HttpClient>,
  29 │   ) => Effect.Effect<A, E>;
  30 │   accountId: string;
  31 │ }

0.72 packages/alchemy/src/Cloudflare/Workers/SqlMigrations.ts:31:5
  21 │ export interface SqlMigrations extends SqlMigrationSnapshot {
  22 │   /**
  23 │    * Apply pending files to the current Durable Object's SQLite database.
  24 │    * Call in the inner instance Effect before returning public methods.
  25 │    * Each file and its history row commit atomically; applied files are skipped.
  26 │    * Requires runtime context, which is also available in request handlers.
  27 │    */
  28 │   readonly apply: () => Effect.Effect<
  29 │     void,
  30 │     MigrationError | MigrationHistoryConflictError,
> 31 │     DurableObjectState | RuntimeContext
  32 │   >;
  33 │ }

0.72 packages/alchemy/src/Cloudflare/Workers/SqlMigrationsApply.ts:19:3
  16 │ ) => Effect.Effect<
  17 │   void,
  18 │   MigrationError | MigrationHistoryConflictError,
> 19 │   DurableObjectState | RuntimeContext

0.72 packages/alchemy/src/Git/RegistryObject.ts:201:3
  199 │   readonly removeRow: (
  200 │     repoId: string,
> 201 │   ) => Effect.Effect<void, StoreError, RuntimeContext>;

0.72 packages/alchemy/src/Neon/Connect.ts:23:5
  18 │ export interface ConnectClient {
  19 │   /** Pooled URL for ordinary application queries. */
  20 │   connectionString: Effect.Effect<
  21 │     Redacted.Redacted<string>,
  22 │     never,
> 23 │     RuntimeContext
  24 │   >;
  25 │   /** Pooled URL, including Neon's pooler hostname. */
  26 │   pooledConnectionString: Effect.Effect<
  27 │     Redacted.Redacted<string>,
  28 │     never,
  29 │     RuntimeContext
  30 │   >;
  31 │   /** Direct URL for migrations, notifications, and session-oriented clients. */
  32 │   directConnectionString: Effect.Effect<
  33 │     Redacted.Redacted<string>,
  34 │     never,
  35 │     RuntimeContext
  36 │   >;
  37 │ }

0.72 packages/alchemy/src/Prisma/Internal/BucketClient.ts:59:7
  53 │ export interface BucketAccess {
  54 │   bucketName: Effect.Effect<string, never, RuntimeContext>;
  55 │   authorize: <A, E>(
  56 │     effect: Effect.Effect<
  57 │       A,
  58 │       E,
> 59 │       Credentials.Credentials | Region.Region | HttpClient
  60 │     >,
  61 │   ) => Effect.Effect<A, E, RuntimeContext>;
  62 │   presign: (
  63 │     request: PresignRequest,
  64 │   ) => Effect.Effect<string, BucketError, RuntimeContext>;
  65 │ }

0.72 packages/alchemy/src/Railway/ConnectMySQL.ts:81:5
  73 │ export interface ConnectMySQLClient {
  74 │   /**
  75 │    * Private (`{name}.railway.internal`) connection string. Pass this to
  76 │    * {@link Drizzle.MySQL} or `SQL.MySQL` from a {@link Service}.
  77 │    */
  78 │   connectionString: Effect.Effect<
  79 │     Redacted.Redacted<string>,
  80 │     MySQLUrlMissing,
> 81 │     RuntimeContext
  82 │   >;
  83 │   /**
  84 │    * Same private URI — Railway MySQL has no proxy-pooler split. Kept so
  85 │    * callers matching the `ConnectPostgres` shape keep working.
  86 │    */
  87 │   directConnectionString: Effect.Effect<
  88 │     Redacted.Redacted<string>,
  89 │     MySQLUrlMissing,
  90 │     RuntimeContext
  91 │   >;
  92 │ }

0.72 packages/alchemy/src/Website/packExtraFiles.ts:32:3
  29 │ ): Effect.Effect<
  30 │   ExtraFile[] | undefined,
  31 │   never,
> 32 │   FileSystem.FileSystem | Path.Path
  33 │ > =>

0.72 packages/frontend-frameworks/src/nextjs/node.ts:463:3
  460 │ ) => Effect.Effect<
  461 │   NextjsNodeService,
  462 │   never,
> 463 │   FileSystem.FileSystem | Path.Path

0.72 packages/frontend-frameworks/src/vinext/node.ts:200:3
  197 │ ) => Effect.Effect<
  198 │   VinextNodeService,
  199 │   never,
> 200 │   FileSystem.FileSystem | Path.Path

0.71 packages/alchemy/src/AWS/Backup/StartCopyJob.ts:50:3
  47 │ export interface StartCopyJob extends Binding.Service<
  48 │   StartCopyJob,
  49 │   "AWS.Backup.StartCopyJob",
> 50 │   <R extends Role>(
  51 │     sourceVault: BackupVault,
  52 │     copyRole: R,
  53 │   ) => Effect.Effect<
  54 │     (
  55 │       request: StartCopyJobRequest,
  56 │     ) => Effect.Effect<backup.StartCopyJobOutput, backup.StartCopyJobError>
  57 │   >
  58 │ > {}

0.71 packages/alchemy/src/AWS/BedrockAgentCore/SaveBrowserSessionProfile.ts:41:3
  38 │ export interface SaveBrowserSessionProfile extends Binding.Service<
  39 │   SaveBrowserSessionProfile,
  40 │   "AWS.BedrockAgentCore.SaveBrowserSessionProfile",
> 41 │   <R extends BrowserCustom>(
  42 │     browser: R,
  43 │   ) => Effect.Effect<
  44 │     (
  45 │       request: SaveBrowserSessionProfileRequest,
  46 │     ) => Effect.Effect<
  47 │       agentcore.SaveBrowserSessionProfileResponse,
  48 │       agentcore.SaveBrowserSessionProfileError
  49 │     >
  50 │   >
  51 │ > {}

0.71 packages/alchemy/src/AWS/BedrockAgentCore/StartCodeInterpreterSessionHttp.ts:21:5
  18 │     const startCodeInterpreterSession =
  19 │       yield* agentcore.startCodeInterpreterSession;
  20 │
> 21 │     return Effect.fn(function* <R extends CodeInterpreter>(codeInterpreter: R) {
  22 │       const Identifier = yield* codeInterpreter.codeInterpreterId;

0.71 packages/alchemy/src/AWS/PaymentCryptography/EncryptData.ts:35:3
  32 │ export interface EncryptData extends Binding.Service<
  33 │   EncryptData,
  34 │   "AWS.PaymentCryptography.EncryptData",
> 35 │   <K extends Key>(
  36 │     key: K,
  37 │   ) => Effect.Effect<
  38 │     (
  39 │       request: EncryptDataRequest,
  40 │     ) => Effect.Effect<
  41 │       paymentcryptographydata.EncryptDataOutput,
  42 │       paymentcryptographydata.EncryptDataError
  43 │     >
  44 │   >
  45 │ > {}

0.71 packages/alchemy/src/AWS/RDSData/ExecuteStatement.ts:89:7
  77 │ export interface ExecuteStatement extends Binding.Service<
  78 │   ExecuteStatement,
  79 │   "AWS.RDSData.ExecuteStatement",
  80 │   (
  81 │     cluster: DBCluster,
  82 │     options: ExecuteStatementOptions,
  83 │   ) => Effect.Effect<
  84 │     (
  85 │       request: ExecuteStatementRequest,
  86 │     ) => Effect.Effect<
  87 │       rdsdata.ExecuteStatementResponse,
  88 │       rdsdata.ExecuteStatementError,
> 89 │       RuntimeContext
  90 │     >
  91 │   >
  92 │ > {}

0.71 packages/alchemy/src/AWS/S3Control/UpdateJobStatus.ts:38:7
  30 │ export interface UpdateJobStatus extends Binding.Service<
  31 │   UpdateJobStatus,
  32 │   "AWS.S3Control.UpdateJobStatus",
  33 │   () => Effect.Effect<
  34 │     (
  35 │       request: Omit<s3control.UpdateJobStatusRequest, "AccountId">,
  36 │     ) => Effect.Effect<
  37 │       s3control.UpdateJobStatusResult,
> 38 │       s3control.UpdateJobStatusError | sts.GetCallerIdentityError
  39 │     >
  40 │   >
  41 │ > {}

0.71 packages/alchemy/src/Cloudflare/HttpClientUtils.ts:19:5
  16 │ export const authorizeWith =
  17 │   (token: { value: Effect.Effect<Redacted.Redacted<string>> }) =>
  18 │   <A, E>(
> 19 │     eff: Effect.Effect<A, E, Credentials | HttpClient>,

0.71 packages/alchemy/src/Cloudflare/R2/ReadBucket.ts:31:3
  30 │ export interface ReadBucketClient {
> 31 │   raw: Effect.Effect<runtime.R2Bucket, never, RuntimeContext>;
  32 │   head(key: string): Effect.Effect<R2Object | null, R2Error, RuntimeContext>;
  33 │   get(
  34 │     key: string,
  35 │     options: GetOptions & {
  36 │       onlyIf: runtime.R2Conditional | Headers;
  37 │     },
  38 │   ): Effect.Effect<ObjectBody | R2Object | null, R2Error, RuntimeContext>;
  39 │   get(
  40 │     key: string,
  41 │     options?: GetOptions,
  42 │   ): Effect.Effect<ObjectBody | null, R2Error, RuntimeContext>;
  43 │   list(options?: ListOptions): Effect.Effect<Objects, R2Error, RuntimeContext>;
  44 │ }

0.71 packages/alchemy/src/Fly/GetSecret.ts:51:5
  45 │ export interface GetSecret extends Binding.Service<
  46 │   GetSecret,
  47 │   "Fly.GetSecret",
  48 │   (
  49 │     secret: Secret,
  50 │   ) => Effect.Effect<
> 51 │     () => Effect.Effect<AppSecret, GetSecretError, RuntimeContext>
  52 │   >
  53 │ > {}

0.71 packages/alchemy/src/Hetzner/ReadDnsHttp.ts:20:3
  17 │ /** Build the read-only client over an injectable auth and zone id. */
  18 │ export const dnsReadClient = (
  19 │   auth: DnsAuth,
> 20 │   zoneId: Effect.Effect<number>,
  21 │ ): ReadDnsClient => {
  22 │   const authorize = auth.authorize;
  23 │   return {
  24 │     getRecordSet: Effect.fn("Hetzner.DNS.getRecordSet")(function* (name, type) {
  25 │       return yield* authorize(
  26 │         zoneRrsets.getZoneRrset({
  27 │           id_or_name: String(yield* zoneId),
  28 │           rr_name: name,
  29 │           rr_type: type,
  30 │         }),
  31 │       );
  32 │     }),
  33 │     listRecordSets: Effect.fn("Hetzner.DNS.listRecordSets")(
  34 │       function* (request) {
  35 │         return yield* authorize(
  36 │           zoneRrsets.listZoneRrsets({
  37 │             id_or_name: String(yield* zoneId),
  38 │             ...request,
  39 │           }),
  40 │         );
  41 │       },
  42 │     ),
  43 │   };
  44 │ };

0.71 packages/alchemy/src/RuntimeContext.ts:30:3
  27 │   serve?<Req = never>(
  28 │     handler: HttpEffect<Req>,
  29 │     options?: { shape?: Record<string, unknown> },
> 30 │   ): Effect.Effect<void, never, Req>;
  31 │   shape?: () => Record<string, unknown>;
  32 │   /** additional services to provide to the plan  */
  33 │   planServices?: Layer.Layer<any>;

0.71 packages/alchemy/src/Server/SQSQueueEventSource.ts:22:7
  19 │       props: SQS.MessagesProps,
  20 │       process: (
  21 │         stream: Stream.Stream<SQS.SQSRecord, never, StreamReq>,
> 22 │       ) => Effect.Effect<void, never, Req | StreamReq>,
  23 │     ) {
  24 │       const QueueArn = yield* queue.queueArn;

0.71 packages/alchemy/test/types/Api.ts:118:7
  112 │ export class Api3 extends Cloudflare.Worker<
  113 │   Api3,
  114 │   {
  115 │     getUser: () => Effect.Effect<
  116 │       { id: string; name: string },
  117 │       never,
> 118 │       RuntimeContext
  119 │     >;
  120 │   }
  121 │ >()("Api3") {}

0.71 packages/frontend-frameworks/src/nextjs/DevServer.ts:316:3
  315 │   // 1. Open the platform proxy hosting the worker's bindings.
> 316 │   const proxy = yield* PlatformProxy.open({
  317 │     name: options.proxyName ?? "nextjs-dev-platform-proxy",
  318 │     ...(options.compatibilityDate !== undefined
  319 │       ? { compatibilityDate: options.compatibilityDate }
  320 │       : {}),
  321 │     ...(options.compatibilityFlags !== undefined
  322 │       ? { compatibilityFlags: [...options.compatibilityFlags] }
  323 │       : {}),
  324 │     bindings: options.bindings ?? [],
  325 │     ...(options.logging !== undefined ? { logging: options.logging } : {}),
  326 │   }).pipe(
  327 │     Effect.mapError(fail("Failed to start the binding proxy for next dev")),
  328 │   );

0.71 packages/frontend-frameworks/src/nextjs/aws.ts:393:1
  391 │ export const make: (
  392 │   options?: NextjsAwsOptions,
> 393 │ ) => Effect.Effect<NextjsAwsService, never, FileSystem.FileSystem | Path.Path> =
```
