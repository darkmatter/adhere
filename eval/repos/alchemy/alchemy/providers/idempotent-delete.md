# alchemy/providers/idempotent-delete

A custom provider's delete must treat a resource that is already gone as success, catching the not-found error, never failing when it runs again.

20 findings, from 0.89 down to 0.71. Each showed this hint:

```ts
delete: ({ output }) =>
  Effect.tryPromise(() => stripe.products.del(output.productId)).pipe(
    Effect.catchIf(isNotFound, () => Effect.void),
  ),
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.89 packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts:293:11
  292 │         delete: Effect.fn(function* ({ output }) {
> 293 │           yield* autoscaling.deletePolicy({
  294 │             AutoScalingGroupName: output.autoScalingGroupName,
  295 │             PolicyName: output.policyName,
  296 │           } as any);
  297 │         }),

0.88 packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts:214:13
  212 │         delete: Effect.fn(function* ({ output }) {
  213 │           yield* retryConcurrent(
> 214 │             cloudwatch.deleteAlarmMuteRule({
  215 │               AlarmMuteRuleName: output.alarmMuteRuleName,
  216 │             }),
  217 │           );
  218 │         }),

0.87 packages/alchemy/test/Cloudflare/Artifacts/fixtures/async-worker.ts:44:7
  43 │     if (url.pathname === "/delete") {
> 44 │       const deleted = await repos.delete(name);
  45 │       return Response.json({ deleted });
  46 │     }

0.85 packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts:196:9
> 196 │         delete: Effect.fn(function* ({ output }) {
  197 │           yield* retryConcurrent(
  198 │             cloudwatch.deleteAlarms({
  199 │               AlarmNames: [output.alarmName],
  200 │             }),
  201 │           );
  202 │         }),

0.85 packages/alchemy/src/Cloudflare/SecretsStore/LocalSecretsStoreGateway.ts:76:7
  73 │ export const deleteLocalSecret = (storeId: string, secretName: string) =>
  74 │   withLocalSecretsStore(storeId, (store) =>
  75 │     Effect.tryPromise({
> 76 │       try: () => store.delete(secretName),
  77 │       catch: (cause) =>
  78 │         new LocalSecretsStoreError({
  79 │           message: `Failed to delete secret "${secretName}" from the local Secrets Store`,
  80 │           cause,
  81 │         }),
  82 │     }),
  83 │   );

0.83 packages/alchemy/src/AWS/CloudWatch/Alarm.ts:261:9
> 261 │         delete: Effect.fn(function* ({ output }) {
  262 │           yield* retryConcurrent(
  263 │             cloudwatch.deleteAlarms({
  264 │               AlarmNames: [output.alarmName],
  265 │             }),
  266 │           );
  267 │         }),

0.82 packages/alchemy/src/AWS/ApiGateway/DeleteUsagePlanKeyHttp.ts:34:9
  17 │ export const DeleteUsagePlanKeyHttp = Layer.effect(
  18 │   DeleteUsagePlanKey,
  19 │   Effect.gen(function* () {
  20 │     const deleteUsagePlanKey = yield* ag.deleteUsagePlanKey;
  21 │     return Effect.fn(function* <P extends UsagePlan>(usagePlan: P) {
  22 │       const UsagePlanId = yield* usagePlan.id;
  23 │       yield* registerApiGatewayBinding({
  24 │         cap: "AWS.ApiGateway.DeleteUsagePlanKey",
  25 │         target: usagePlan,
  26 │         verb: "DELETE",
  27 │         paths: (region) => [
  28 │           Output.interpolate`arn:aws:apigateway:${region}::/usageplans/${usagePlan.id}/keys/*`,
  29 │         ],
  30 │       });
  31 │       return Effect.fn(
  32 │         `AWS.ApiGateway.DeleteUsagePlanKey(${usagePlan.LogicalId})`,
  33 │       )(function* (request: DeleteUsagePlanKeyRequest) {
> 34 │         return yield* deleteUsagePlanKey({
  35 │           ...request,
  36 │           usagePlanId: yield* UsagePlanId,
  37 │         });
  38 │       });
  39 │     });
  40 │   }),
  41 │ );

0.82 packages/alchemy/src/Neon/Storage.ts:103:7
  102 │     delete: (key: string) =>
> 103 │       provide(S3.deleteObject({ Bucket: bucket, Key: key })),

0.80 packages/alchemy/src/Fly/WriteSecretHttp.ts:69:5
  51 │   return {
  52 │     create: Effect.fn("Fly.Secret.create")(function* (name, value) {
  53 │       return yield* authorize(
  54 │         machines.createSecret({
  55 │           app_name: yield* appName,
  56 │           secret_name: name,
  57 │           value: unwrapSecretValue(value),
  58 │         }),
  59 │       );
  60 │     }),
  61 │     update: Effect.fn("Fly.Secret.update")(function* (name, value) {
  62 │       return yield* authorize(
  63 │         machines.updateSecrets({
  64 │           app_name: yield* appName,
  65 │           values: { [name]: unwrapSecretValue(value) },
  66 │         }),
  67 │       );
  68 │     }),
> 69 │     delete: Effect.fn("Fly.Secret.delete")(function* (name) {
  70 │       return yield* authorize(
  71 │         machines.deleteSecret({
  72 │           app_name: yield* appName,
  73 │           secret_name: name,
  74 │         }),
  75 │       );
  76 │     }),
  77 │   };

0.78 packages/alchemy/src/Cloudflare/KV/WriteNamespaceHttp.ts:69:13
  65 │     delete: ((key: string) =>
  66 │       scope.pipe(
  67 │         Effect.flatMap(({ accountId, namespaceId }) =>
  68 │           authorize(
> 69 │             kv.deleteNamespaceValue({ accountId, namespaceId, keyName: key }),
  70 │           ),
  71 │         ),
  72 │         Effect.mapError(toKVNamespaceError),
  73 │         Effect.asVoid,
  74 │       )) as any,

0.78 packages/alchemy/src/Server/SQSQueueEventSource.ts:69:13
  68 │             // TODO(sam): only delete messages that were successfully processed
> 69 │             yield* deleteMessageBatch({
  70 │               Entries: messages.map((msg, i) => ({
  71 │                 Id: msg.MessageId ?? String(i),
  72 │                 ReceiptHandle: msg.ReceiptHandle!,
  73 │               })),
  74 │             });

0.76 packages/alchemy/test/AWS/SNS/platform-handler.ts:97:11
  96 │           const listed = yield* listEndpoints();
> 97 │           yield* deleteEndpoint({ EndpointArn: created.EndpointArn });

0.75 packages/alchemy/src/ACME/Certificate.ts:261:7
  252 │     delete: Effect.fn(function* ({ olds, output }) {
  253 │       if (olds.revokeOnDelete !== true) return;
  254 │       const account = accountOf(olds.account);
  255 │       // Signed with the certificate's own key, so revocation works even
  256 │       // after the account was replaced or deactivated.
  257 │       yield* revokeCertificate({
  258 │         certificate: output.certificate,
  259 │         privateKey: output.privateKey,
  260 │         reason: "cessationOfOperation",
> 261 │       }).pipe(
  262 │         Effect.provide(
  263 │           accountLayer({
  264 │             ca: {
  265 │               directoryUrl: output.directoryUrl,
  266 │               trustedRoot: output.trustedRoot,
  267 │             },
  268 │             accountKey: account.privateKey,
  269 │             accountUrl: account.accountUrl,
  270 │           }),
  271 │         ),
  272 │       );
  273 │     }),

0.75 packages/alchemy/src/Cloudflare/Stream/StreamBinding.ts:44:5
  40 │   const video = (id: string): StreamVideoClient => ({
  41 │     id,
  42 │     details: () => call((binding) => binding.video(id).details()),
  43 │     update: (params) => call((binding) => binding.video(id).update(params)),
> 44 │     delete: () => call((binding) => binding.video(id).delete()),
  45 │     generateToken: () => call((binding) => binding.video(id).generateToken()),
  46 │     downloads: {
  47 │       generate: (downloadType) =>
  48 │         call((binding) => binding.video(id).downloads.generate(downloadType)),
  49 │       get: () => call((binding) => binding.video(id).downloads.get()),
  50 │       delete: (downloadType) =>
  51 │         call((binding) => binding.video(id).downloads.delete(downloadType)),
  52 │     },
  53 │     captions: {
  54 │       upload: (language, input) =>
  55 │         call((binding) =>
  56 │           binding
  57 │             .video(id)
  58 │             .captions.upload(language, input as unknown as cf.ReadableStream),
  59 │         ),
  60 │       generate: (language) =>
  61 │         call((binding) => binding.video(id).captions.generate(language)),
  62 │       list: (language) =>
  63 │         call((binding) => binding.video(id).captions.list(language)),
  64 │       delete: (language) =>
  65 │         call((binding) => binding.video(id).captions.delete(language)),
  66 │     },
  67 │   });

0.75 packages/alchemy/test/Cloudflare/KV/fixtures/write-routes.ts:40:7
  17 │ export const writeRoutes = (
  18 │   kv: WriteNamespaceClient,
  19 │   request: HttpServerRequest.HttpServerRequest,
  20 │   url: URL,
  21 │ ) =>
  22 │   Effect.gen(function* () {
  23 │     if (request.method === "PUT" && url.pathname === "/put") {
  24 │       const key = url.searchParams.get("key") ?? "";
  25 │       const body = yield* request.text;
  26 │       yield* kv.put(key, body).pipe(Effect.orDie);
  27 │       return yield* HttpServerResponse.json({ ok: true });
  28 │     }
  29 │     if (request.method === "PUT" && url.pathname === "/put-meta") {
  30 │       const key = url.searchParams.get("key") ?? "";
  31 │       const body = yield* request.text;
  32 │       // `expirationTtl` must be ≥ 60s; metadata round-trips via getWithMetadata.
  33 │       yield* kv
  34 │         .put(key, body, { metadata: { tag: "meta" }, expirationTtl: 3600 })
  35 │         .pipe(Effect.orDie);
  36 │       return yield* HttpServerResponse.json({ ok: true });
  37 │     }
  38 │     if (request.method === "DELETE" && url.pathname === "/del") {
  39 │       const key = url.searchParams.get("key") ?? "";
> 40 │       yield* kv.delete(key).pipe(Effect.orDie);
  41 │       return yield* HttpServerResponse.json({ ok: true });
  42 │     }
  43 │     return undefined;
  44 │   });

0.74 packages/alchemy/src/Cloudflare/R2/WriteBucketBinding.ts:103:5
> 103 │     delete: (keys: string | string[]) => use((raw) => raw.delete(keys)),

0.73 packages/alchemy/src/AWS/IoTFleetWise/Fleet.ts:171:9
> 171 │         delete: Effect.fn(function* ({ output }) {
  172 │           // Idempotent: deleting a missing fleet succeeds (vehicles are
  173 │           // detached automatically before deletion).
  174 │           yield* iotfleetwise
  175 │             .deleteFleet({ fleetId: output.fleetId })
  176 │             .pipe(inFleetWiseRegion);
  177 │         }),

0.72 packages/alchemy/src/AWS/StepFunctions/Activity.ts:239:11
  236 │         delete: Effect.fn(function* ({ output }) {
  237 │           // deleteActivity is idempotent — deleting a non-existent activity
  238 │           // succeeds.
> 239 │           yield* sfn.deleteActivity({ activityArn: output.activityArn });
  240 │         }),
  241 │       });
  242 │     }),

0.72 packages/cloudflare-runtime/src/core/bindings/cache/Cache.worker.ts:454:9
  446 │     const cached = await this.storage.get(cacheKey, ({ size, headers }) => {
  447 │       resHeaders = new Headers(headers as HeadersInit);
  448 │       const contentType = resHeaders.get("Content-Type");
  449 │
  450 │       // Need size from metadata to parse `Range` header
  451 │       const rangeHeader = req.headers.get("Range");
  452 │       if (rangeHeader !== null) {
  453 │         resRanges = parseRanges(rangeHeader, size);
> 454 │         if (resRanges === undefined) throw new RangeNotSatisfiable(size);
  455 │       }
  456 │
  457 │       return {
  458 │         ranges: resRanges,
  459 │         contentLength: size,
  460 │         contentType: contentType ?? undefined,
  461 │       };
  462 │     });

0.71 packages/alchemy/src/Cloudflare/Tunnel/WriteTunnel.ts:159:5
> 159 │     delete: Effect.fn("Cloudflare.Tunnel.delete")(function* (tunnelId) {
  160 │       const accountId = yield* auth.accountId;
  161 │       return yield* authorize(
  162 │         zeroTrust.deleteTunnelCloudflared({ accountId, tunnelId }),
  163 │       );
  164 │     }),
```
