# alchemy/secrets/never-logged-returned-or-output

A secret, credential, connection string, token, signed URL, or private key must never be logged, returned in an HTTP response, or returned as a stack output; code must expose only names, presence, or non-secret metadata.

40 findings, from 0.95 down to 0.71. Each showed this hint:

```ts
if (url.pathname === "/secret") {
  return yield* HttpServerResponse.json({ name: "API_TOKEN", set: Redacted.value(token).length > 0 });
}
return { serial: certificate.serial, expires: certificate.notAfter }; // stack output
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.95 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/async-worker.ts:37:13
  17 │ export default class AsyncSecretWorker extends Cloudflare.Worker<AsyncSecretWorker>()(
  18 │   "AsyncSecretBindingWorker",
  19 │   {
  20 │     main: import.meta.url,
  21 │     workersDev: { enabled: true, previewsEnabled: false },
  22 │     env: {
  23 │       MY_SECRET: ApiKey,
  24 │     },
  25 │   },
  26 │   Effect.gen(function* () {
  27 │     return {
  28 │       fetch: Effect.gen(function* () {
  29 │         const request = yield* HttpServerRequest;
  30 │         const pathname = new URL(request.originalUrl, "http://x").pathname;
  31 │         if (pathname === "/secret") {
  32 │           const env = yield* Cloudflare.Workers.WorkerEnvironment;
  33 │           const secret = (env as Record<string, runtime.SecretsStoreSecret>)
  34 │             .MY_SECRET;
  35 │           const value = yield* Effect.promise(() => secret.get());
  36 │           return yield* HttpServerResponse.json({
> 37 │             value,
  38 │             viaGet: value,
  39 │             viaRaw: value,
  40 │           });
  41 │         }
  42 │         return HttpServerResponse.text("Not Found", { status: 404 });
  43 │       }),
  44 │     };
  45 │   }),
  46 │ ) {}

0.95 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/secrets-local-worker.ts:15:9
   9 │ export default {
  10 │   fetch: async (request: Request, env: Env) => {
  11 │     const url = new URL(request.url);
  12 │     if (url.pathname === "/secret") {
  13 │       try {
  14 │         const value = await env.SECRET.get();
> 15 │         return Response.json({ value });
  16 │       } catch (e) {
  17 │         return Response.json({ error: (e as Error).message }, { status: 404 });
  18 │       }
  19 │     }
  20 │     return new Response("Not Found", { status: 404 });
  21 │   },
  22 │ };

0.94 packages/alchemy/test/AWS/Secret/fixtures/handler.ts:82:15
  79 │           case "/secret/literal": {
  80 │             return yield* HttpServerResponse.json({
  81 │               isRedacted: Redacted.isRedacted(literalSecret),
> 82 │               value: Redacted.value(literalSecret),
  83 │             });
  84 │           }

0.94 packages/alchemy/test/AWS/SecretsManager/handler.ts:276:9
> 276 │         if (request.method === "GET" && pathname === "/rotation-value") {
  277 │           const result = yield* Effect.result(getRotationValue());
  278 │           if (Result.isFailure(result)) {
  279 │             return yield* HttpServerResponse.json(
  280 │               {
  281 │                 error: result.failure._tag,
  282 │                 message:
  283 │                   (result.failure as { Message?: string }).Message ??
  284 │                   (result.failure as { message?: string }).message,
  285 │               },
  286 │               { status: 409 },
  287 │             );
  288 │           }
  289 │           return yield* HttpServerResponse.json({
  290 │             versionId: result.success.VersionId,
  291 │             secretString: unwrapString(result.success.SecretString),
  292 │           });
  293 │         }

0.94 packages/frontend-frameworks/fixtures/nuxt/server/api/hello.ts:15:9
   4 │ export default defineEventHandler((event) => {
   5 │   const cloudflare = event.context.cloudflare as
   6 │     | {
   7 │         env?: Record<string, unknown>;
   8 │         context?: { waitUntil?: unknown };
   9 │       }
  10 │     | undefined;
  11 │   return {
  12 │     marker: "api-route-ok",
  13 │     secret:
  14 │       typeof cloudflare?.env?.FIXTURE_SECRET === "string"
> 15 │         ? cloudflare.env.FIXTURE_SECRET
  16 │         : null,
  17 │     hasWaitUntil: typeof cloudflare?.context?.waitUntil === "function",
  18 │   };
  19 │ });

0.92 packages/alchemy/test/Cloudflare/Secret/fixtures/worker.ts:68:15
  65 │           case "/secret/literal": {
  66 │             return yield* HttpServerResponse.json({
  67 │               isRedacted: Redacted.isRedacted(literalSecret),
> 68 │               value: Redacted.value(literalSecret),
  69 │             });
  70 │           }

0.91 packages/alchemy/test/AWS/SecretsManager/fixtures/get-secret-only-handler.ts:48:17
  36 │         if (request.method === "GET" && url.pathname === "/get-value") {
  37 │           const result = yield* getSecretValue({
  38 │             VersionId: url.searchParams.get("versionId") ?? undefined,
  39 │             VersionStage: url.searchParams.get("versionStage") ?? undefined,
  40 │           });
  41 │           return yield* HttpServerResponse.json({
  42 │             arn: result.ARN,
  43 │             name: result.Name,
  44 │             versionId: result.VersionId,
  45 │             secretString:
  46 │               typeof result.SecretString === "string" ||
  47 │               result.SecretString === undefined
> 48 │                 ? result.SecretString
  49 │                 : Redacted.value(result.SecretString),
  50 │           });
  51 │         }

0.91 packages/frontend-frameworks/fixtures/octane/octane.config.ts:26:15
  14 │ export default defineConfig({
  15 │   adapter: cloudflare(),
  16 │   router: {
  17 │     routes: [
  18 │       new ServerRoute({
  19 │         path: "/api/hello",
  20 │         methods: ["GET"],
  21 │         handler: (context) => {
  22 │           const platform = context.platform as Platform | undefined;
  23 │           return Response.json({
  24 │             marker: "api-route-ok",
  25 │             secret:
> 26 │               (platform?.env?.FIXTURE_SECRET as string | undefined) ?? null,
  27 │             hasWaitUntil: typeof platform?.ctx?.waitUntil === "function",
  28 │           });
  29 │         },
  30 │       }),
  31 │       new RenderRoute({ path: "/", entry: ["App", "/src/App.tsx"] }),
  32 │     ],
  33 │   },
  34 │ });

0.90 packages/alchemy/test/Cloudflare/SecretsStore/fixtures/secret-routes.ts:28:9
  17 │ export const secretRoutes = (client: ReadSecretClient, url: URL) =>
  18 │   Effect.gen(function* () {
  19 │     if (url.pathname === "/secret") {
  20 │       // The client is an Effect that resolves to the redacted value.
  21 │       const direct = yield* client.pipe(Effect.orDie);
  22 │       const viaGet = yield* client.get().pipe(Effect.orDie);
  23 │       const raw = yield* client.raw.pipe(Effect.orDie);
  24 │       const viaRaw = yield* Effect.promise(() => raw.get());
  25 │       return yield* HttpServerResponse.json({
  26 │         value: Redacted.value(direct),
  27 │         viaGet: Redacted.value(viaGet),
> 28 │         viaRaw,
  29 │       });
  30 │     }
  31 │     return undefined;
  32 │   });

0.89 packages/alchemy/test/AWS/IVSChat/fixtures/handler.ts:109:13
   89 │         if (request.method === "POST" && pathname === "/ws-info") {
   90 │           // The test drives the room's WebSocket messaging API directly to
   91 │           // exercise the message review handler; it needs the raw token
   92 │           // (scoped to this test room, 30-minute session) and the regional
   93 │           // edge endpoint.
   94 │           const result = yield* createChatToken({
   95 │             userId: TEST_USER_ID,
   96 │             capabilities: ["SEND_MESSAGE"],
   97 │             sessionDuration: "30 minutes",
   98 │           });
   99 │           const token = result.token;
  100 │           const raw =
  101 │             token === undefined
  102 │               ? undefined
  103 │               : Redacted.isRedacted(token)
  104 │                 ? Redacted.value(token)
  105 │                 : token;
  106 │           const region = yield* Effect.sync(() => process.env.AWS_REGION);
  107 │           const roomArn = yield* RoomArn;
  108 │           return yield* HttpServerResponse.json({
> 109 │             token: raw,
  110 │             endpoint: `wss://edge.ivschat.${region}.amazonaws.com`,
  111 │             roomArn,
  112 │           });
  113 │         }

0.88 packages/alchemy/test/Cloudflare/Workers/fixtures/env/async.ts:19:9
   7 │ export default {
   8 │   fetch: async (_request: Request, env: AsyncWorkerEnv) => {
   9 │     return new Response(
  10 │       JSON.stringify({
  11 │         STR: env.STR,
  12 │         NUM: env.NUM,
  13 │         BOOL: env.BOOL,
  14 │         NULL: env.NULL,
  15 │         OBJ: env.OBJ,
  16 │         ARR: env.ARR,
  17 │         OUTPUT_STR: env.OUTPUT_STR,
  18 │         RANDOM_IS_HEX: /^[0-9a-f]{64}$/.test(env.RANDOM),
> 19 │         SECRET_STR: env.SECRET_STR,
  20 │         // Redacted<Json> is JSON-stringified into secret_text on the way in,
  21 │         // so the async runtime sees a string here. Parse it back so the
  22 │         // test can compare the structured value.
  23 │         SECRET_JSON:
  24 │           typeof env.SECRET_JSON === "string"
  25 │             ? JSON.parse(env.SECRET_JSON)
  26 │             : env.SECRET_JSON,
  27 │         CONFIG_STR: env.CONFIG_STR,
  28 │         CONFIG_NUM: env.CONFIG_NUM,
  29 │         CONFIG_REDACTED: env.CONFIG_REDACTED,
  30 │         VERSION_METADATA: env.CF_VERSION_METADATA,
  31 │       }),
  32 │       { headers: { "content-type": "application/json" } },
  33 │     );
  34 │   },
  35 │ };

0.88 packages/frontend-frameworks/fixtures/sveltekit/src/routes/(marketing)/+layout.server.ts:10:5
   7 │ export const load: LayoutServerLoad = ({ platform }) => {
   8 │   return {
   9 │     section: "marketing",
> 10 │     layoutSecret: platform?.env?.FIXTURE_SECRET ?? "no-platform-env",
  11 │   };
  12 │ };

0.87 packages/alchemy/test/AWS/KMS/handler.ts:191:15
  174 │         if (
  175 │           request.method === "POST" &&
  176 │           pathname === "/generate-data-key-pair"
  177 │         ) {
  178 │           const result = yield* generateDataKeyPair({
  179 │             KeyPairSpec: "ECC_NIST_P256",
  180 │           });
  181 │           const privateKeyPlaintext = unwrapSensitive(
  182 │             result.PrivateKeyPlaintext,
  183 │           );
  184 │           return yield* HttpServerResponse.json({
  185 │             keyId: result.KeyId,
  186 │             keyPairSpec: result.KeyPairSpec,
  187 │             publicKeyBase64: result.PublicKey
  188 │               ? yield* toBase64(result.PublicKey)
  189 │               : undefined,
  190 │             privateKeyPlaintextBase64: privateKeyPlaintext
> 191 │               ? yield* toBase64(privateKeyPlaintext)
  192 │               : undefined,
  193 │             privateKeyCiphertextBase64: result.PrivateKeyCiphertextBlob
  194 │               ? yield* toBase64(result.PrivateKeyCiphertextBlob)
  195 │               : undefined,
  196 │           });
  197 │         }

0.87 packages/alchemy/test/AWS/S3/fixtures/presign-get-only-handler.ts:36:11
  22 │     return {
  23 │       fetch: Effect.gen(function* () {
  24 │         const request = yield* HttpServerRequest;
  25 │         const url = yield* Effect.sync(() => new URL(request.originalUrl));
  26 │         if (url.pathname === "/info") {
  27 │           return yield* HttpServerResponse.json({
  28 │             bucketName: yield* bucketName,
  29 │             bucketArn: yield* bucketArn,
  30 │           });
  31 │         }
  32 │         const key = url.searchParams.get("key");
  33 │         if (!key)
  34 │           return HttpServerResponse.text("Missing key", { status: 400 });
  35 │         return yield* HttpServerResponse.json({
> 36 │           url: yield* presignGet({
  37 │             key,
  38 │             versionId: url.searchParams.get("versionId") ?? undefined,
  39 │             contentType: url.searchParams.get("contentType") ?? undefined,
  40 │             expiresIn: url.searchParams.has("expiresIn")
  41 │               ? Number(url.searchParams.get("expiresIn"))
  42 │               : undefined,
  43 │           }),
  44 │         });
  45 │       }).pipe(Effect.orDie),
  46 │     };

0.87 packages/alchemy/test/Cloudflare/Workers/fixtures/env/effect.ts:99:13
   94 │         if (pathname === "/config") {
   95 │           return yield* HttpServerResponse.json({
   96 │             CONFIG_STR: configStr,
   97 │             CONFIG_NUM: configNum,
   98 │             CONFIG_REDACTED: env.CONFIG_REDACTED,
>  99 │             CONFIG_REDACTED_INIT: Redacted.value(configRedactedInit),
  100 │             CONFIG_REDACTED_INIT_IS_REDACTED:
  101 │               Redacted.isRedacted(configRedactedInit),
  102 │             CONFIG_ALL_OBJ: {
  103 │               str: configAllObj.str,
  104 │               num: configAllObj.num,
  105 │               redacted: Redacted.value(configAllObj.redacted),
  106 │               redactedIsRedacted: Redacted.isRedacted(configAllObj.redacted),
  107 │             },
  108 │             CONFIG_ALL_TUPLE: configAllTuple,
  109 │             CONFIG_NESTED_HOST: configNested,
  110 │           });
  111 │         }

0.86 packages/alchemy/test/AWS/S3/fixtures/presign-handler.ts:101:11
   94 │         if (request.method === "GET" && pathname === "/delete-objects") {
   95 │           const keys = (url.searchParams.get("keys") ?? "")
   96 │             .split(",")
   97 │             .filter((k) => k.length > 0);
   98 │           const result = yield* deleteObjects({
   99 │             Delete: { Objects: keys.map((Key) => ({ Key })) },
  100 │           });
> 101 │           return yield* HttpServerResponse.json({
  102 │             deleted: (result.Deleted ?? []).map((d) => d.Key),
  103 │             errors: (result.Errors ?? []).map((e) => e.Code),
  104 │           });
  105 │         }

0.85 packages/frontend-frameworks/fixtures/sveltekit/src/routes/api/hello/+server.ts:16:5
   7 │ export const GET: RequestHandler = ({ platform }) => {
   8 │   return json({
   9 │     // `uuid` has browser/node conditional exports — the workerd re-bundle must
  10 │     // pick an entry that works under workerd.
  11 │     uuid: uuidv4(),
  12 │     // direct node builtin usage — exercises nodejs_compat externalization
  13 │     nodeUuid: randomUUID(),
  14 │     // `cookie` v2 — plain conditional-exports dependency
  15 │     cookie: stringifySetCookie({ name: "fixture", value: "ok" }),
> 16 │     secret: platform?.env?.FIXTURE_SECRET ?? "no-platform-env",
  17 │   });
  18 │ };

0.85 packages/frontend-frameworks/fixtures/sveltekit/src/routes/form/+page.server.ts:14:7
   4 │ export const actions: Actions = {
   5 │   greet: async ({ request, platform }) => {
   6 │     const data = await request.formData();
   7 │     const name = data.get("name");
   8 │     if (typeof name !== "string" || name.length === 0) {
   9 │       return fail(400, { error: "name is required" });
  10 │     }
  11 │     return {
  12 │       greeting: `hello ${name}`,
  13 │       // prove the action sees the same platform as loads/endpoints
> 14 │       secret: platform?.env?.FIXTURE_SECRET ?? "no-platform-env",
  15 │     };
  16 │   },
  17 │ };

0.84 packages/alchemy/test/AWS/Cognito/handler.ts:268:11
> 268 │           const accessToken = plain(reAuth.AuthenticationResult?.AccessToken)!;

0.84 packages/cloudflare-runtime/src/core/bindings/hyperdrive/hyperdrive-binding.worker.ts:17:5
   6 │ export default function makeBinding(env: { ORIGIN: HyperdriveOrigin }) {
   7 │   let connectionString = `${env.ORIGIN.scheme}://${env.ORIGIN.user}:${env.ORIGIN.password}@${env.ORIGIN.host}:${env.ORIGIN.port}/${env.ORIGIN.database}`;
   8 │   if (env.ORIGIN.sslmode) {
   9 │     connectionString += `?${env.ORIGIN.scheme === "postgresql" || env.ORIGIN.scheme === "postgres" ? "sslmode" : "ssl-mode"}=${env.ORIGIN.sslmode}`;
  10 │   }
  11 │   return {
  12 │     connect: () =>
  13 │       sockets.connect({ hostname: env.ORIGIN.host, port: env.ORIGIN.port }),
  14 │     connectionString,
  15 │     database: env.ORIGIN.database,
  16 │     user: env.ORIGIN.user,
> 17 │     password: env.ORIGIN.password,
  18 │     host: env.ORIGIN.host,
  19 │     port: env.ORIGIN.port,
  20 │     // Production Hyperdrive exposes a synthetic IPv4 literal for drivers that
  21 │     // reject hostnames; locally the origin host is directly connectable, so
  22 │     // it doubles as the "ip" (drivers pass it back into connect(), which
  23 │     // accepts hostnames).
  24 │     ip: env.ORIGIN.host,
  25 │   } satisfies Hyperdrive;
  26 │ }

0.82 packages/alchemy/test/AWS/Grafana/workspace-handler.ts:183:13
  180 │           return yield* HttpServerResponse.json({
  181 │             serviceAccountId: account.id,
  182 │             grafanaRole: account.grafanaRole,
> 183 │             keyPrefix: key.slice(0, 5),
  184 │             keyLength: key.length,
  185 │             tokenCount: serviceAccountTokens.length,
  186 │           });

0.82 packages/frontend-frameworks/fixtures/sveltekit/src/routes/+page.server.ts:6:5
   4 │ export const load: PageServerLoad = ({ platform }) => {
   5 │   return {
>  6 │     secret: platform?.env?.FIXTURE_SECRET ?? "no-platform-env",
   7 │     hasCtx: typeof platform?.ctx?.waitUntil === "function",
   8 │     // exercise `devalue` (conditional-exports dep used by kit itself)
   9 │     devalued: uneval({ n: 1 }),
  10 │   };
  11 │ };

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/http-server-worker.ts:39:15
  20 │ export default class HttpServerWorker extends Cloudflare.Worker<HttpServerWorker>()(
  21 │   "HttpServerWorker",
  22 │   {
  23 │     main: import.meta.url,
  24 │   },
  25 │   Effect.gen(function* () {
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const request = yield* HttpServerRequest;
  29 │         if (request.url.startsWith("/missing")) {
  30 │           // A Respondable error escaping as a defect must keep its intended
  31 │           // response (404), not be flattened into a generic 500.
  32 │           return yield* Effect.die(
  33 │             new HttpServerError.RouteNotFound({ request }),
  34 │           );
  35 │         }
  36 │         if (request.url.startsWith("/boom")) {
  37 │           return yield* Effect.fail(
  38 │             new Error(
> 39 │               `Sensitive handler context: ${sensitiveContext.join(" ")}`,
  40 │             ),
  41 │           ).pipe(Effect.orDie);
  42 │         }
  43 │         return HttpServerResponse.text(readyMarker);
  44 │       }),
  45 │     };
  46 │   }),
  47 │ ) {}

0.81 packages/alchemy/test/Neon/fixtures/StorageFunction.ts:34:13
  31 │         const request = yield* HttpServerRequest;
  32 │         if (request.url === "/presign") {
  33 │           return yield* HttpServerResponse.json({
> 34 │             url: yield* files.presignPut("signed/spaces & unicode-λ.txt", {
  35 │               contentType: "text/plain",
  36 │               expiresIn: 60,
  37 │             }),
  38 │           });
  39 │         }

0.78 packages/alchemy/src/Fly/Credentials.ts:37:5
  29 │ export const bindFlyApiToken = (): Effect.Effect<void, never, Credentials> =>
  30 │   Effect.gen(function* () {
  31 │     const token = globalThis.__ALCHEMY_RUNTIME__
  32 │       ? ""
  33 │       : yield* Credentials.pipe(
  34 │           Effect.flatMap((resolve) => resolve),
  35 │           Effect.map((cfg) => Redacted.value(cfg.apiKey)),
  36 │         );
> 37 │     yield* Output.named(Output.asOutput(token), "FLY_API_TOKEN");
  38 │   });

0.78 packages/alchemy/src/Railway/ServiceProvider.ts:1041:23
  1025 │         list: Effect.fn(function* () {
  1026 │           const projects = yield* ownedProjects();
  1027 │           const rows = yield* Effect.forEach(projects, (project) =>
  1028 │             listProjectServices(project.projectId).pipe(
  1029 │               Effect.map((services) =>
  1030 │                 services
  1031 │                   .filter((service) => matchesAlchemyPhysicalName(service.name))
  1032 │                   .map((service) =>
  1033 │                     toAttrs({
  1034 │                       service,
  1035 │                       instance: undefined,
  1036 │                       domain: undefined,
  1037 │                       projectId: project.projectId,
  1038 │                       environmentId: project.environmentId,
  1039 │                       port: undefined,
  1040 │                       codeHash: "",
> 1041 │                       rpcToken: "",
  1042 │                       region: undefined,
  1043 │                     }),
  1044 │                   ),
  1045 │               ),
  1046 │             ),
  1047 │           );
  1048 │           return rows.flat();
  1049 │         }),

0.78 packages/alchemy/test/Neon/fixtures/function-native.ts:11:9
   8 │     if (path === "/env")
   9 │       return Response.json({
  10 │         value: process.env.FUNCTION_TEST_VALUE,
> 11 │         removed: process.env.FUNCTION_TEST_REMOVED,
  12 │         hasDatabase: !!process.env.DATABASE_URL,
  13 │         hasAccountKey: !!process.env.NEON_API_KEY,
  14 │       });

0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/random-env/worker.ts:30:11
  17 │ export default class RandomEnvWorker extends Cloudflare.Worker<RandomEnvWorker>()(
  18 │   "RandomEnvWorker",
  19 │   {
  20 │     main: import.meta.url,
  21 │   },
  22 │   Effect.gen(function* () {
  23 │     const secret = yield* Random("RandomEnvSecret");
  24 │     const accessor = yield* secret.text;
  25 │
  26 │     return {
  27 │       fetch: Effect.gen(function* () {
  28 │         const resolved = yield* accessor;
  29 │         const value = Redacted.isRedacted(resolved)
> 30 │           ? Redacted.value(resolved)
  31 │           : resolved;
  32 │         return yield* HttpServerResponse.json({
  33 │           resolvedType: typeof value,
  34 │           isHexSecret:
  35 │             typeof value === "string" && /^[0-9a-f]{64}$/.test(value),
  36 │         });
  37 │       }),
  38 │     };
  39 │   }),
  40 │ ) {}

0.76 packages/alchemy/src/Cli/commands/cloudflare.ts:41:5
  28 │ export const formatCreatedCloudflareToken = (
  29 │   result: CreatedToken,
  30 │   token: string,
  31 │ ) =>
  32 │   [
  33 │     "",
  34 │     `Created Cloudflare API token "${result.name}" (${result.id}).`,
  35 │     `Granted ${result.grantedPermissionGroups} permission group(s) across ${result.policies.length} policy(ies)${
  36 │       result.verificationStatus
  37 │         ? `; token status: ${result.verificationStatus}.`
  38 │         : "."
  39 │     }`,
  40 │     "",
> 41 │     token,
  42 │     "",
  43 │     "Store this value now — Cloudflare only shows it once. Use it as CLOUDFLARE_API_TOKEN.",
  44 │     ...result.diagnostics.map(
  45 │       (diagnostic) =>
  46 │         `${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`,
  47 │     ),
  48 │   ].join("\n");

0.76 packages/alchemy/test/AWS/Smoke/fixtures/api-handler.ts:22:1
> 22 │ const PASSWORD = "Alchemy-Smoke-Passw0rd!";

0.76 packages/alchemy/test/Prisma/fixtures/FakeManagementApi.ts:364:5
  357 │ export const wireCreatedDatabase = (options: WireDatabaseOptions = {}) => ({
  358 │   ...wireDatabase(options),
  359 │   apiKeys: [],
  360 │   connectionString: "postgres://direct",
  361 │   directConnection: {
  362 │     host: "db.prisma.test",
  363 │     user: "prisma",
> 364 │     pass: "secret",
  365 │   },
  366 │ });

0.75 packages/alchemy/src/Cloudflare/StateStore/State.ts:562:13
  542 │     const { url, authToken } = yield* deploy({
  543 │       // use the script name as the stage name (so the user can have multiple state stores)
  544 │       stage,
  545 │       force,
  546 │       stack: Alchemy.Stack(
  547 │         "CloudflareStateStore",
  548 │         {
  549 │           providers: Layer.mergeAll(Cloudflare.providers(), RandomProvider()),
  550 │           state: stateLayer,
  551 │         },
  552 │         Effect.gen(function* () {
  553 │           const token = yield* TokenValue;
  554 │           const api = yield* Api;
  555 │           yield* AuthToken; // make sure it's in the Secrets Store
  556 │
  557 │           // Surface the bearer token so tests and clients can authenticate
  558 │           // after deploy. The underlying value lives in the Cloudflare
  559 │           // Secrets Store; this output carries the same generated string.
  560 │           return {
  561 │             url: api.url.as<string>(),
> 562 │             authToken: token.text.pipe(Output.map(Redacted.value)),
  563 │           };
  564 │         }),
  565 │       ),
  566 │     }).pipe(

0.75 packages/alchemy/src/Railway/MySQL.ts:240:15
  227 │ ): Effect.Effect<MySQLProps, never, Providers> =>
  228 │   Effect.gen(function* () {
  229 │     const resolved = Effect.isEffect(props) ? yield* props : props;
  230 │     if (globalThis.__ALCHEMY_RUNTIME__) return resolved;
  231 │     const project = Effect.isEffect(resolved.project)
  232 │       ? yield* resolved.project as Effect.Effect<Project, never, Providers>
  233 │       : resolved.project;
  234 │     const environment =
  235 │       resolved.environment === undefined
  236 │         ? undefined
  237 │         : Effect.isEffect(resolved.environment)
  238 │           ? yield* resolved.environment as Effect.Effect<
  239 │               MySQLEnvironment,
> 240 │               never,
  241 │               Providers
  242 │             >
  243 │           : resolved.environment;
  244 │     return { ...resolved, project, environment };
  245 │   });

0.75 packages/alchemy/test/Prisma/fixtures/read-routes.ts:60:7
  50 │     if (url.pathname === "/presign-get") {
  51 │       const key = url.searchParams.get("key") ?? "";
  52 │       const expiresIn = url.searchParams.get("expiresIn");
  53 │       const contentType = url.searchParams.get("contentType");
  54 │       const presigned = yield* store
  55 │         .presignGet(key, {
  56 │           expiresIn: expiresIn ? Number(expiresIn) : undefined,
  57 │           contentType: contentType ?? undefined,
  58 │         })
  59 │         .pipe(Effect.orDie);
> 60 │       return yield* HttpServerResponse.json({ url: presigned });
  61 │     }
  62 │     return undefined;
  63 │   });

0.74 packages/alchemy/src/Railway/Mongo.ts:212:5
> 212 │     connectionUri: string;

0.73 packages/alchemy/test/AWS/SSM/handler.ts:110:13
  105 │         if (request.method === "GET" && pathname === "/get-secure") {
  106 │           const result = yield* getSecureParameter({ WithDecryption: true });
  107 │           return yield* HttpServerResponse.json({
  108 │             name: result.Parameter?.Name,
  109 │             type: result.Parameter?.Type,
> 110 │             value: plain(result.Parameter?.Value),
  111 │           });
  112 │         }

0.72 packages/alchemy/src/Cloudflare/Access/Certificate.ts:221:9
  199 │       if (!observed || !observed.id) {
  200 │         const created = yield* zeroTrust
  201 │           .createAccessCertificateForAccount({
  202 │             accountId: acct,
  203 │             name,
  204 │             certificate: news.certificate,
  205 │             associatedHostnames: desiredHostnames,
  206 │           })
  207 │           .pipe(
  208 │             Effect.catch((err) =>
  209 │               Effect.gen(function* () {
  210 │                 const existing = yield* findCertificateByName(acct, name);
  211 │                 if (existing && existing.id) return existing;
  212 │                 return yield* Effect.fail(err);
  213 │               }),
  214 │             ),
  215 │           );
  216 │         if (!created.id) {
  217 │           return yield* Effect.fail(
  218 │             new Error("Certificate: created certificate missing id"),
  219 │           );
  220 │         }
> 221 │         return toAttrs(created, acct, news.certificate);
  222 │       }

0.72 packages/alchemy/src/Railway/Function.ts:933:3
  922 │   serviceId: input.service.id,
  923 │   name: input.service.name,
  924 │   projectId: input.projectId,
  925 │   environmentId: input.environmentId,
  926 │   image: input.instance?.source?.image ?? input.image,
  927 │   runtime: FUNCTION_RUNTIME_NAME,
  928 │   cronSchedule: input.instance?.cronSchedule ?? undefined,
  929 │   sleepApplication: input.instance?.sleepApplication ?? undefined,
  930 │   region: input.region,
  931 │   port: input.port ?? input.domain?.targetPort,
  932 │   dnsName: `${input.service.name}.railway.internal`,
> 933 │   rpcToken: input.rpcToken,
  934 │   url: input.domain?.url,
  935 │   domain: input.domain?.domain,
  936 │   domainId: input.domain?.id,
  937 │   deploymentId: input.instance?.latestDeployment?.id,
  938 │   deploymentStatus: input.instance?.latestDeployment?.status,
  939 │   nextCronRunAt: input.instance?.nextCronRunAt ?? undefined,
  940 │   code: { hash: input.codeHash },
  941 │ });

0.71 packages/alchemy/src/Cloudflare/Stream/LiveInputOutput.ts:82:3
  78 │ export type LiveInputOutput = Resource<
  79 │   TypeId,
  80 │   LiveInputOutputProps,
  81 │   LiveInputOutputAttributes,
> 82 │   never,
  83 │   Providers
  84 │ >;

0.71 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:59:13
  47 │   Effect.gen(function* () {
  48 │     const container = yield* RemoteContainer;
  49 │
  50 │     return Effect.gen(function* () {
  51 │       const { fetch } = yield* container.getTcpPort(8080);
  52 │
  53 │       return {
  54 │         hello: () =>
  55 │           Effect.gen(function* () {
  56 │             const response = yield* fetch(
  57 │               HttpClientRequest.get("http://container/"),
  58 │             );
> 59 │             return yield* response.text;
  60 │           }),
  61 │         // The proxy pattern from #1334: forward the incoming request to the
  62 │         // container verbatim. In production the incoming web Request carries
  63 │         // an https:// URL, which workerd's container ports reject — the
  64 │         // runtime must downgrade the scheme on the container hop.
  65 │         fetch: Effect.gen(function* () {
  66 │           const request = yield* HttpServerRequest;
  67 │           return yield* fetch(request);
  68 │         }),
  69 │       };
  70 │     });
  71 │   }).pipe(
```
