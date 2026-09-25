# effect/basics/external-calls-are-resilient

A call over the network, such as an HTTP request, a database query, or a third-party API, should carry a timeout and a retry schedule, and should not go out bare. A call through a client that already applies both, such as an HttpClient built with a timeout and retryTransient or an SDK with its own retries, has them. Calls through the platform FileSystem and Path services are local and are not in scope.

372 findings, from 0.95 down to 0.71. Each showed this hint:

```ts
const retryPolicy = Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)));

const resilientCall = HttpClient.get("https://api.example.com/users").pipe(
  Effect.timeout("2 seconds"),
  Effect.retry(retryPolicy),
  Effect.timeout("10 seconds"),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.95 packages/cloudflare-runtime/src/rolldown/test/fixtures/regression/mysql2.ts:10:5
   7 │ export default {
   8 │   fetch(_request: Request, env: Env) {
   9 │     const db = mysql2.createConnection(env.DATABASE_URL);
> 10 │     const result = db.execute("SELECT 1");
  11 │     return Response.json(result);
  12 │   },
  13 │ };

0.94 packages/alchemy/src/AWS/AMP/BindingHttp.ts:184:13
  182 │         const response = yield* Effect.tryPromise({
  183 │           try: () =>
> 184 │             fetch(signed.url, {
  185 │               method: signed.method,
  186 │               headers: signed.headers,
  187 │               body,
  188 │             }),
  189 │           catch: toError(0),
  190 │         });

0.94 packages/alchemy/src/AWS/AppSync/GraphQLHttp.ts:95:15
   93 │           const response = yield* Effect.tryPromise({
   94 │             try: () =>
>  95 │               fetch(signed.url, {
   96 │                 method: signed.method,
   97 │                 headers: signed.headers,
   98 │                 body,
   99 │               }),
  100 │             catch: toError(0),
  101 │           });

0.94 packages/alchemy/src/AWS/OSIS/BindingHttp.ts:236:11
  234 │       const response = yield* Effect.tryPromise({
  235 │         try: () =>
> 236 │           fetch(signed.url, {
  237 │             method: signed.method,
  238 │             headers: signed.headers,
  239 │             body,
  240 │           }),
  241 │         catch: (cause) =>
  242 │           new PipelineIngestError({
  243 │             pipelineName,
  244 │             path: request.path,
  245 │             status: 0,
  246 │             body: cause instanceof Error ? cause.message : String(cause),
  247 │           }),
  248 │       });

0.94 packages/alchemy/src/Cloudflare/D1/CloneDatabase.ts:27:7
  18 │ export const cloneDatabase = (options: CloneDatabaseOptions) =>
  19 │   Effect.gen(function* () {
  20 │     const exportResult = yield* exportDatabase({
  21 │       accountId: options.accountId,
  22 │       databaseId: options.sourceDatabaseId,
  23 │     });
  24 │
  25 │     const client = yield* HttpClient.HttpClient;
  26 │     const dumpRes = yield* client
> 27 │       .execute(HttpClientRequest.get(exportResult.signedUrl))
  28 │       .pipe(Effect.orDie);
  29 │     if (dumpRes.status < 200 || dumpRes.status >= 300) {
  30 │       return yield* Effect.die(
  31 │         `Failed to fetch D1 export dump (${dumpRes.status})`,
  32 │       );
  33 │     }
  34 │     const sqlData = yield* dumpRes.text.pipe(Effect.orDie);
  35 │
  36 │     return yield* importD1Database({
  37 │       accountId: options.accountId,
  38 │       databaseId: options.targetDatabaseId,
  39 │       sqlData,
  40 │       filename: exportResult.filename,
  41 │     });
  42 │   });

0.94 packages/alchemy/src/Git/Jobs/Import.ts:334:3
> 334 │   const response = yield* client
  335 │     .execute(request)
  336 │     .pipe(
  337 │       Effect.mapError(
  338 │         (error) =>
  339 │           new ImportClientError({ reason: `git-upload-pack failed: ${error}` }),
  340 │       ),
  341 │     );

0.94 packages/alchemy/test/AWS/Lambda/init-io-probe.ts:28:5
  18 │ const TraceConfigLive = Layer.effect(
  19 │   TraceConfig,
  20 │   Effect.gen(function* () {
  21 │     // Counted per sandbox so every response can assert the layer's I/O ran
  22 │     // exactly once no matter how many invocations the sandbox has served.
  23 │     yield* Effect.sync(() => {
  24 │       (globalThis as any).__initFetches =
  25 │         ((globalThis as any).__initFetches ?? 0) + 1;
  26 │     });
  27 │     const client = yield* HttpClient.HttpClient;
> 28 │     const response = yield* client.get(
  29 │       "https://www.cloudflare.com/cdn-cgi/trace",
  30 │     );
  31 │     const trace = yield* response.text;
  32 │     return { trace, nonce: crypto.randomUUID() };
  33 │   }).pipe(
  34 │     // A failed init fetch is a defect: the sandbox is useless without its
  35 │     // config, and init's typed error channel is reserved for ConfigError.
  36 │     Effect.orDie,
  37 │   ),
  38 │ );

0.94 packages/alchemy/test/AWS/Local/fixtures/raw.ts:41:3
  33 │ export const rawAwsJson = Effect.fn(function* (options: {
  34 │   service: string;
  35 │   region: string;
  36 │   target: string;
  37 │   contentType: string;
  38 │   body: Record<string, unknown>;
  39 │ }) {
  40 │   const client = yield* HttpClient.HttpClient;
> 41 │   return yield* client.execute(
  42 │     HttpClientRequest.post(`${FLOCI_ENDPOINT}/`).pipe(
  43 │       HttpClientRequest.setHeaders({
  44 │         "content-type": options.contentType,
  45 │         "x-amz-target": options.target,
  46 │         "x-amz-date": "20260101T000000Z",
  47 │         authorization: `AWS4-HMAC-SHA256 Credential=test/20260101/${options.region}/${options.service}/aws4_request, SignedHeaders=host;x-amz-date, Signature=dummy`,
  48 │       }),
  49 │       HttpClientRequest.setBody(
  50 │         HttpBody.text(JSON.stringify(options.body), options.contentType),
  51 │       ),
  52 │     ),
  53 │   );
  54 │ });

0.93 packages/alchemy/src/AWS/Lambda/RuntimeExtension.ts:31:5
  26 │ export const registerLambdaExtension = async (): Promise<void> => {
  27 │   const api = process.env.AWS_LAMBDA_RUNTIME_API;
  28 │   if (!api) return;
  29 │   const base = `http://${api}/2020-01-01/extension`;
  30 │   try {
> 31 │     const registration = await fetch(`${base}/register`, {
  32 │       method: "POST",
  33 │       headers: { "Lambda-Extension-Name": "alchemy-graceful-shutdown" },
  34 │       body: JSON.stringify({ events: [] }),
  35 │     });
  36 │     const extensionId = registration.headers.get("lambda-extension-identifier");
  37 │     if (extensionId) {
  38 │       void fetch(`${base}/event/next`, {
  39 │         headers: { "Lambda-Extension-Identifier": extensionId },
  40 │       }).catch(() => undefined);
  41 │     }
  42 │   } catch {
  43 │     // Not running on Lambda (or the Extensions API refused) — the function
  44 │     // still works, it just gets no shutdown window.
  45 │   }
  46 │ };

0.93 packages/alchemy/src/AWS/OpenSearch/DataPlaneHttp.ts:183:11
  176 │         const response = yield* Effect.tryPromise({
  177 │           try: () =>
  178 │             fetch(signed.url, {
  179 │               method: signed.method,
  180 │               headers: signed.headers,
  181 │               body,
  182 │             }),
> 183 │           catch: toError(0),
  184 │         });

0.93 packages/alchemy/src/SQL/Migrations/MySQLExecutor.ts:22:11
  18 │   query: (sql, params) =>
  19 │     Effect.tryPromise({
  20 │       try: () =>
  21 │         connection
> 22 │           .query(sql, params ? [...params] : undefined)
  23 │           .then(([rows]) => rows as Array<Record<string, unknown>>),
  24 │       catch: (cause) =>
  25 │         new MigrationError({
  26 │           message: `mysql query failed: ${String(cause)}`,
  27 │           cause,
  28 │         }),
  29 │     }),

0.93 packages/alchemy/test/AWS/Lambda/fixtures/otel-handler.ts:52:13
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

0.93 packages/alchemy/test/Cloudflare/Container/fixtures/external/object.ts:35:13
  24 │ export class ExternalContainerObject extends Cloudflare.DurableObject<ExternalContainerObject>()(
  25 │   "ExternalContainerObject",
  26 │   Effect.gen(function* () {
  27 │     const container = yield* ExternalContainer;
  28 │
  29 │     return Effect.gen(function* () {
  30 │       const { fetch } = yield* container.getTcpPort(8080);
  31 │
  32 │       return {
  33 │         hello: Effect.fn("hello")(function* () {
  34 │           const response = yield* fetch(
> 35 │             HttpClientRequest.get("http://container/"),
  36 │           );
  37 │           return yield* response.text;
  38 │         }),
  39 │       };
  40 │     });
  41 │   }).pipe(
  42 │     Effect.provide(
  43 │       Layer.mergeAll(
  44 │         Cloudflare.Containers.layer(ExternalContainer, {
  45 │           enableInternet: true,
  46 │         }),
  47 │       ),
  48 │     ),
  49 │   ),
  50 │ ) {}

0.93 packages/alchemy/test/Cloudflare/Container/fixtures/isolated/object.ts:21:15
   7 │ export class IsolatedObject extends Cloudflare.DurableObject<IsolatedObject>()(
   8 │   "IsolatedProjectObject",
   9 │   Effect.gen(function* () {
  10 │     const container = yield* IsolatedContainer;
  11 │
  12 │     return Effect.gen(function* () {
  13 │       return {
  14 │         // RPC into the container (forces start + proves it's up).
  15 │         ping: () => container.ping(),
  16 │         // HTTP over the container's TCP port.
  17 │         hello: () =>
  18 │           Effect.gen(function* () {
  19 │             const { fetch } = yield* container.getTcpPort(3000);
  20 │             const response = yield* fetch(
> 21 │               HttpClientRequest.get("http://container/"),
  22 │             );
  23 │             return yield* response.text;
  24 │           }).pipe(Effect.orDie),
  25 │       };
  26 │     });
  27 │   }).pipe(
  28 │     Effect.provide(
  29 │       Cloudflare.Containers.layer(IsolatedContainer, {
  30 │         enableInternet: true,
  31 │       }),
  32 │     ),
  33 │   ),
  34 │ ) {}

0.93 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-traced-worker.ts:47:13
  42 │         if (url.pathname === "/probe") {
  43 │           const endpoint = yield* Config.String("COLLECTOR_URL").pipe(
  44 │             Effect.orDie,
  45 │           );
  46 │           const result = yield* Effect.tryPromise(() =>
> 47 │             fetch(`${endpoint}/v1/traces`, {
  48 │               method: "POST",
  49 │               body: JSON.stringify({ probe: true }),
  50 │             }).then(async (r) => ({
  51 │               status: r.status,
  52 │               body: (await r.text()).slice(0, 200),
  53 │             })),
  54 │           ).pipe(
  55 │             Effect.catchCause((cause) =>
  56 │               Effect.succeed({ status: -1, body: String(cause) }),
  57 │             ),
  58 │           );
  59 │           return yield* HttpServerResponse.json(result);
  60 │         }

0.93 packages/alchemy/test/Railway/fixtures/async-postgres.ts:16:7
   9 │ export default {
  10 │   async fetch(_request: Request, env: PostgresFnEnv): Promise<Response> {
  11 │     const client = new Client({
  12 │       connectionString: env.DATABASE_URL,
  13 │     });
  14 │     await client.connect();
  15 │     try {
> 16 │       const result = await client.query("select 1 as ok");
  17 │       return Response.json({ rows: result.rows });
  18 │     } catch (error) {
  19 │       return Response.json(
  20 │         { ok: false, error: String(error) },
  21 │         { status: 500 },
  22 │       );
  23 │     } finally {
  24 │       await client.end();
  25 │     }
  26 │   },
  27 │ };

0.93 packages/alchemy/test/types/Agent.ts:117:15
  114 │         eval: (code: string) =>
  115 │           connection
  116 │             .fetch(
> 117 │               HttpClientRequest.post("/eval", {
  118 │                 body: HttpBody.text(code),
  119 │               }),
  120 │             )
  121 │             .pipe(
  122 │               Effect.flatMap((response) => response.text),
  123 │               Effect.orDie,
  124 │             ),

0.92 packages/alchemy/src/Cloudflare/D1/ImportDatabase.ts:64:9
  58 │     ): Effect.Effect<ImportPollingResponse, never, never> =>
  59 │       Effect.gen(function* () {
  60 │         const req = HttpClientRequest.post(url).pipe(
  61 │           HttpClientRequest.setHeaders(authHeaders),
  62 │           HttpClientRequest.bodyJsonUnsafe(body),
  63 │         );
> 64 │         const res = yield* client.execute(req).pipe(Effect.orDie);
  65 │         if (res.status < 200 || res.status >= 300) {
  66 │           const text = yield* res.text.pipe(Effect.orElseSucceed(() => ""));
  67 │           return yield* Effect.die(
  68 │             `D1 import request failed (${res.status}): ${text}`,
  69 │           );
  70 │         }
  71 │         const text = yield* res.text.pipe(Effect.orDie);
  72 │         const json = JSON.parse(text) as { result: ImportPollingResponse };
  73 │         return json.result;
  74 │       });

0.92 packages/alchemy/src/Git/Hasher/Hasher.ts:346:11
  344 │       resolveDeltas: (bases, jobs, opts) =>
  345 │         Effect.gen(function* () {
> 346 │           const next = yield* send(
  347 │             `https://self${HASH_ROUTE}?mode=deltas&max=${opts.maxObjectSize}`,
  348 │             encodeDeltaBatch(bases, jobs),
  349 │           );
  350 │           const first = yield* next();
  351 │           if (first === undefined) {
  352 │             return yield* new HashError({
  353 │               reason: "delta batch: empty response",
  354 │             });
  355 │           }
  356 │           return decodeDeltaResults(first);
  357 │         }),

0.92 packages/alchemy/src/SQL/Migrations/PgExecutor.ts:19:11
  15 │   query: (sql, params) =>
  16 │     Effect.tryPromise({
  17 │       try: () =>
  18 │         client
> 19 │           .query(sql, (params ?? []) as unknown[])
  20 │           .then((result) => result.rows as Array<Record<string, unknown>>),
  21 │       catch: (cause) =>
  22 │         new MigrationError({
  23 │           message: `postgres query failed: ${String(cause)}`,
  24 │           cause,
  25 │         }),
  26 │     }),

0.92 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/object.ts:38:13
  24 │       return {
  25 │         // Seed R2 through the DO's NATIVE binding so the container (which reads
  26 │         // over its HTTP token) sees a value written by a different binding.
  27 │         put: (key: string, value: string) =>
  28 │           bucket.put(key, value).pipe(Effect.asVoid),
  29 │         get: (key: string) => bucket.get(key),
  30 │         ping: () => container.ping(),
  31 │         // The env var a `Binding.Service` injected into the container.
  32 │         boundEnv: () => container.boundEnv(),
  33 │         // Read the object from inside the container over RPC.
  34 │         readObjectRpc: (key: string) => container.readObject(key),
  35 │         // Read the object from inside the container over its TCP port (fetch).
  36 │         readObjectFetch: (key: string) =>
  37 │           Effect.gen(function* () {
> 38 │             const response = yield* conn.fetch(
  39 │               HttpClientRequest.get(
  40 │                 `http://container/object?key=${encodeURIComponent(key)}`,
  41 │               ),
  42 │             );
  43 │             return (yield* response.json) as { value: string | null };
  44 │           }).pipe(Effect.orDie),
  45 │         hello: () =>
  46 │           Effect.gen(function* () {
  47 │             const response = yield* conn.fetch(
  48 │               HttpClientRequest.get("http://container/"),
  49 │             );
  50 │             return yield* response.text;
  51 │           }).pipe(Effect.orDie),
  52 │       };

0.92 packages/alchemy/test/Cloudflare/Container/fixtures/reload/object.ts:18:13
   7 │ export class ReloadContainerObject extends Cloudflare.DurableObject<ReloadContainerObject>()(
   8 │   "ReloadContainerObject",
   9 │   Effect.gen(function* () {
  10 │     const container = yield* ReloadContainer;
  11 │
  12 │     return Effect.gen(function* () {
  13 │       const { fetch } = yield* container.getTcpPort(RELOAD_CONTAINER_PORT);
  14 │
  15 │       return {
  16 │         read: (path: string) =>
  17 │           Effect.gen(function* () {
> 18 │             const response = yield* fetch(
  19 │               HttpClientRequest.get(`http://container${path}`),
  20 │             );
  21 │             return yield* response.text;
  22 │           }),
  23 │       };
  24 │     });
  25 │   }).pipe(
  26 │     Effect.provide(
  27 │       Cloudflare.Containers.layer(ReloadContainer, { enableInternet: false }),
  28 │     ),
  29 │   ),
  30 │ ) {}

0.92 packages/alchemy/test/Cloudflare/Workers/fixtures/init-io/worker.ts:30:5
  20 │ const TraceConfigLive = Layer.effect(
  21 │   TraceConfig,
  22 │   Effect.gen(function* () {
  23 │     // Counted per isolate so every response can assert the layer's I/O ran
  24 │     // exactly once no matter how many events the isolate has served.
  25 │     yield* Effect.sync(() => {
  26 │       (globalThis as any).__initFetches =
  27 │         ((globalThis as any).__initFetches ?? 0) + 1;
  28 │     });
  29 │     const client = yield* HttpClient.HttpClient;
> 30 │     const response = yield* client.get(
  31 │       "https://www.cloudflare.com/cdn-cgi/trace",
  32 │     );
  33 │     const trace = yield* response.text;
  34 │     return {
  35 │       trace,
  36 │       // Regenerated only when the layer rebuilds — every event served by
  37 │       // this isolate must observe the same value.
  38 │       nonce: crypto.randomUUID(),
  39 │     };
  40 │   }).pipe(
  41 │     // A failed init fetch is a defect: the isolate is useless without its
  42 │     // config, and init's typed error channel is reserved for ConfigError.
  43 │     Effect.orDie,
  44 │   ),
  45 │ );

0.92 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/platform-worker.ts:33:11
  16 │ export default class WfpPlatformWorker extends Cloudflare.Worker<WfpPlatformWorker>()(
  17 │   "WfpBindingPlatformWorker",
  18 │   { main: import.meta.filename, workersDev: true },
  19 │   Effect.gen(function* () {
  20 │     const dispatch = yield* Cloudflare.WorkersForPlatforms.Get(DispatchNs);
  21 │
  22 │     return {
  23 │       fetch: Effect.gen(function* () {
  24 │         const request = yield* HttpServerRequest;
  25 │         const url = new URL(request.url, "http://placeholder");
  26 │         const match = url.pathname.match(/^\/dispatch\/([^/]+)(\/.*)?$/);
  27 │         if (!match) {
  28 │           return HttpServerResponse.text("platform-worker ok");
  29 │         }
  30 │         const [, scriptName, rest] = match;
  31 │         const userWorker = yield* dispatch.get(scriptName).pipe(Effect.orDie);
  32 │         const response = yield* Effect.promise(() =>
> 33 │           userWorker.fetch(
  34 │             new Request(`https://user-worker${rest ?? "/"}`, {
  35 │               headers: { "x-custom": request.headers["x-custom"] ?? "" },
  36 │             }),
  37 │           ),
  38 │         );
  39 │         return HttpServerResponse.fromWeb(response);
  40 │       }),
  41 │     };
  42 │   }).pipe(Effect.provide(Cloudflare.WorkersForPlatforms.GetBinding)),
  43 │ ) {}

0.92 packages/alchemy/test/Fly/fixtures/multi-container-http.ts:18:5
  12 │ const server = http.createServer((request, response) => {
  13 │   response.setHeader("cache-control", "no-store");
  14 │   if (request.url === "/health") {
  15 │     const ready = process.env.BAD_HEALTH !== "true";
  16 │     response.writeHead(ready ? 200 : 503).end();
  17 │   } else if (request.url === "/sidecar/hold") {
> 18 │     const proxy = http.get("http://127.0.0.1:3001/hold", (upstream) => {
  19 │       response.writeHead(upstream.statusCode ?? 502);
  20 │       upstream.pipe(response);
  21 │     });
  22 │     proxy.on("error", () => response.destroy());
  23 │     response.on("close", () => proxy.destroy());
  24 │   } else if (request.url === "/hold") {
  25 │     response.writeHead(200, { "content-type": "text/plain" });
  26 │     response.write("waiting\n");
  27 │     held.add(response);
  28 │     response.on("close", () => held.delete(response));
  29 │     // A broken shutdown cannot leave a request alive indefinitely.
  30 │     const deadline = setTimeout(() => response.destroy(), 90_000);
  31 │     response.on("close", () => clearTimeout(deadline));
  32 │   } else if (request.url === "/") {
  33 │     response.end(version);
  34 │   } else {
  35 │     response.writeHead(404).end();
  36 │   }
  37 │ });

0.92 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:18:5
  14 │ export const fetchSql = () =>
  15 │   Effect.gen(function* () {
  16 │     const url = yield* Config.Redacted("TEST_POSTGRES_URL");
  17 │     const client = yield* PgClient.make({ url });
> 18 │     const result = yield* client`SELECT 1`;
  19 │     return result;
  20 │   }).pipe(Effect.provide(services), Effect.scoped, Effect.runPromise);

0.91 packages/alchemy/src/Neon/InvokeFunctionHttp.ts:68:17
  52 │         fetch: (path = "/", init?: RequestInit) =>
  53 │           Effect.gen(function* () {
  54 │             const base = yield* url;
  55 │             const target = yield* Effect.try({
  56 │               try: () => new URL(path, base),
  57 │               catch: () =>
  58 │                 new InvokeFunctionError({
  59 │                   message: "Invalid Function request path",
  60 │                 }),
  61 │             });
  62 │             if (target.origin !== new URL(base).origin)
  63 │               return yield* new InvokeFunctionError({
  64 │                 message: "Function invocation must remain on the bound origin",
  65 │               });
  66 │             return yield* Effect.tryPromise({
  67 │               try: (signal) =>
> 68 │                 fetch(target, {
  69 │                   ...init,
  70 │                   signal: init?.signal
  71 │                     ? AbortSignal.any([signal, init.signal])
  72 │                     : signal,
  73 │                 }),
  74 │               catch: () =>
  75 │                 new InvokeFunctionError({
  76 │                   message: "Neon Function HTTP request failed",
  77 │                 }),
  78 │             });
  79 │           }),

0.91 packages/alchemy/test/Cloudflare/Container/fixtures/neonhost/object.ts:30:11
  20 │ export class NeonHostContainerObject extends Cloudflare.DurableObject<NeonHostContainerObject>()(
  21 │   "NeonHostContainerObject",
  22 │   Effect.gen(function* () {
  23 │     const container = yield* NeonHostContainer;
  24 │
  25 │     return Effect.gen(function* () {
  26 │       const { fetch } = yield* container.getTcpPort(8080);
  27 │
  28 │       const get = (path: string) =>
  29 │         Effect.gen(function* () {
> 30 │           const response = yield* fetch(
  31 │             HttpClientRequest.get(`http://container${path}`),
  32 │           );
  33 │           return yield* response.text;
  34 │         });
  35 │
  36 │       return {
  37 │         getEnv: () => get("/env"),
  38 │         getProbe: () => get("/probe"),
  39 │       };
  40 │     });
  41 │   }).pipe(
  42 │     Effect.provide(
  43 │       Cloudflare.Containers.layer(NeonHostContainer, {
  44 │         enableInternet: true,
  45 │       }),
  46 │     ),
  47 │   ),
  48 │ ) {}

0.91 packages/alchemy/test/Cloudflare/Container/fixtures/pshost/object.ts:30:11
  20 │ export class PlanetscaleHostContainerObject extends Cloudflare.DurableObject<PlanetscaleHostContainerObject>()(
  21 │   "PlanetscaleHostContainerObject",
  22 │   Effect.gen(function* () {
  23 │     const container = yield* PlanetscaleHostContainer;
  24 │
  25 │     return Effect.gen(function* () {
  26 │       const { fetch } = yield* container.getTcpPort(8080);
  27 │
  28 │       const get = (path: string) =>
  29 │         Effect.gen(function* () {
> 30 │           const response = yield* fetch(
  31 │             HttpClientRequest.get(`http://container${path}`),
  32 │           );
  33 │           return yield* response.text;
  34 │         });
  35 │
  36 │       return {
  37 │         getEnv: () => get("/env"),
  38 │         getProbe: () => get("/probe"),
  39 │       };
  40 │     });
  41 │   }).pipe(
  42 │     Effect.provide(
  43 │       Cloudflare.Containers.layer(PlanetscaleHostContainer, {
  44 │         enableInternet: true,
  45 │       }),
  46 │     ),
  47 │   ),
  48 │ ) {}

0.91 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:19:3
  18 │ export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
> 19 │   const response = await fetch("/api/widgets");
  20 │   return (await response.json()) as WidgetsPayload;
  21 │ };

0.91 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:45:7
  43 │       const body = yield* request.text;
  44 │       yield* Ref.update(forwarded, (count) => count + 1);
> 45 │       const response = yield* client.execute(
  46 │         HttpClientRequest.post(`${config.apiBaseUrl}${route}`).pipe(
  47 │           HttpClientRequest.setHeader("authorization", authorization),
  48 │           HttpClientRequest.bodyText(body, "application/json"),
  49 │         ),
  50 │       );

0.91 packages/alchemy/test/Local/fixtures/rpc-spawner-parent.ts:26:3
  23 │ const program = Effect.gen(function* () {
  24 │   const sp = yield* RpcSpawner;
  25 │   const http = yield* HttpClient.HttpClient;
> 26 │   const res = yield* http
  27 │     .post(sp.url, {
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

0.91 packages/cloudflare-runtime/src/core/globals/Globals.ts:60:7
  54 │   const fire = Effect.gen(function* () {
  55 │     const time = yield* Effect.sync(() => Date.now());
  56 │     const url =
  57 │       `http://127.0.0.1:${port}${PATH_SCHEDULED}` +
  58 │       `?cron=${encodeURIComponent(expression)}&time=${time}`;
  59 │     const response = yield* Effect.tryPromise(() =>
> 60 │       fetch(url, { method: "POST" }),
  61 │     );
  62 │     const body = yield* Effect.tryPromise(() => response.text());
  63 │     if (response.ok) {
  64 │       yield* Effect.logInfo(
  65 │         `[cron:${workerName}] "${expression}" triggered scheduled(): ${body}`,
  66 │       );
  67 │     } else {
  68 │       yield* Effect.logWarning(
  69 │         `[cron:${workerName}] "${expression}" scheduled() handler failed: ${body}`,
  70 │       );
  71 │     }
  72 │   }).pipe(
  73 │     Effect.catchCause((cause) =>
  74 │       Effect.logWarning(
  75 │         `[cron:${workerName}] "${expression}" trigger failed`,
  76 │         Cause.squash(cause),
  77 │       ),
  78 │     ),
  79 │   );

0.91 packages/cloudflare-runtime/src/core/platform-proxy/connect.ts:481:9
  478 │   return {
  479 │     match: async (request, options) => {
  480 │       const response = await fetch(new URL(PATH_CACHE_MATCH, client.url), {
> 481 │         method: "POST",
  482 │         headers: baseHeaders(request, options),
  483 │       });
  484 │       if (response.status === 204) return undefined;
  485 │       if (!response.ok) return rethrow(response);
  486 │       const status = parseInt(
  487 │         response.headers.get(HEADER_CACHE_STATUS) ?? "200",
  488 │       );
  489 │       const headers = new Headers(
  490 │         JSON.parse(
  491 │           decodeURIComponent(
  492 │             response.headers.get(HEADER_CACHE_HEADERS) ?? "%5B%5D",
  493 │           ),
  494 │         ) as Array<[string, string]>,
  495 │       );
  496 │       headers.set("cf-cache-status", "HIT");
  497 │       return new Response(await response.arrayBuffer(), { status, headers });
  498 │     },

0.91 packages/cloudflare-runtime/src/vite/preview-plugin.ts:100:11
   97 │       server.middlewares.use(
   98 │         function distilledCloudflarePreviewMiddleware(req, res) {
   99 │           const url = new NodeURL(req.url ?? "/", address.toString());
> 100 │           const request = NodeHttp.request(url, {
  101 │             method: req.method,
  102 │             headers: proxyRequestHeaders(req, url, handle.proxySharedSecret),
  103 │           });
  104 │           req.pipe(request);
  105 │           request.on("response", (response) => {
  106 │             res.writeHead(response.statusCode ?? 500, response.headers);
  107 │             response.pipe(res);
  108 │           });
  109 │         },
  110 │       );

0.90 packages/alchemy/src/Cloudflare/D1/LocalD1Gateway.ts:100:13
   97 │       const query = (body: D1QueryBody) =>
   98 │         Effect.tryPromise({
   99 │           try: async () => {
> 100 │             const response = await raw.fetch("http://d1/query", {
  101 │               method: "POST",
  102 │               headers: { "content-type": "application/json" },
  103 │               // The DO accepts a single D1Query or an array (one
  104 │               // transaction) — a batch maps to the array form.
  105 │               body: JSON.stringify("batch" in body ? body.batch : body),
  106 │             });
  107 │             return (await response.json()) as unknown;
  108 │           },
  109 │           catch: (cause) =>
  110 │             new LocalD1QueryError({
  111 │               message: "Failed to reach the local D1 gateway",
  112 │               cause,
  113 │             }),
  114 │         }).pipe(

0.90 packages/alchemy/src/Git/Hasher/WorkerLoader.ts:108:21
  105 │                 const worker = yield* loader.get(slot, code);
  106 │                 const response = yield* worker
  107 │                   .fetch(
> 108 │                     HttpClientRequest.post(`https://hasher${path}`).pipe(
  109 │                       HttpClientRequest.bodyUint8Array(body),
  110 │                     ),
  111 │                   )
  112 │                   .pipe(
  113 │                     Effect.mapError(
  114 │                       (error) =>
  115 │                         new HashError({
  116 │                           reason: `dynamic hasher: ${String(error)}`,
  117 │                         }),
  118 │                     ),
  119 │                   );

0.90 packages/alchemy/src/Local/RpcProviderProxy.ts:51:7
  48 │   const getSession = Effect.fn(
  49 │     function* (sessionEnv: string) {
  50 │       const payload: RpcSpawnPayload = { serverEntryUrl: SIDECAR_ENTRY_URL };
> 51 │       const response = yield* client.post(spawnerUrl, {
  52 │         body: yield* HttpBody.json(payload),
  53 │       });

0.90 packages/alchemy/src/Neon/Migrations.ts:92:7
  89 │ export const runSql = (connectionUri: Redacted.Redacted<string>, sql: string) =>
  90 │   withPgClient(connectionUri, (client) =>
  91 │     Effect.tryPromise({
> 92 │       try: () => client.query(sql),
  93 │       catch: toPgError,
  94 │     }),
  95 │   ).pipe(Effect.asVoid);

0.90 packages/alchemy/src/Railway/Up.ts:88:3
> 88 │   const response = yield* http.execute(request);

0.90 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/object.ts:24:13
  12 │   Effect.gen(function* () {
  13 │     const kv = yield* Cloudflare.KV.ReadWriteNamespace(KV);
  14 │
  15 │     return Effect.gen(function* () {
  16 │       const state = yield* Cloudflare.DurableObjectState;
  17 │       return {
  18 │         identity: () => Effect.sync(() => state.id.toString()),
  19 │         put: (key: string, value: string) => kv.put(key, value),
  20 │         get: (key: string) => kv.get(key),
  21 │         // Egress colo is diagnostic, not a placement guarantee.
  22 │         colo: () =>
  23 │           Effect.promise(async () => {
> 24 │             const response = await fetch(
  25 │               "https://cloudflare.com/cdn-cgi/trace",
  26 │             );
  27 │             const trace = await response.text();
  28 │             return trace.match(/^colo=(.*)$/m)?.[1] ?? "unknown";
  29 │           }),
  30 │         // Mirrors the `tick` example from the tutorial:
  31 │         // https://alchemy.run/cloudflare/compute/durable-objects
  32 │         // An RPC method that returns a Stream of sequential numbers.
  33 │         tick: (n: number) =>
  34 │           Stream.iterate(0, (i) => i + 1).pipe(
  35 │             Stream.take(n),
  36 │             Stream.schedule(Schedule.spaced("100 millis")),
  37 │           ),
  38 │       };
  39 │     });
  40 │   }).pipe(Effect.provide(Cloudflare.KV.ReadWriteNamespaceBinding)),

0.90 packages/alchemy/test/Prisma/Website/Fixture.ts:29:5
  24 │ export const bodyContaining = Effect.fn(function* (
  25 │   url: string,
  26 │   expected: string,
  27 │ ) {
  28 │   return yield* Effect.gen(function* () {
> 29 │     const response = yield* HttpClient.get(url);
  30 │     const body = yield* response.text;
  31 │     if (response.status !== 200 || !body.includes(expected)) {
  32 │       return yield* Effect.fail(
  33 │         new Error(
  34 │           `${url} returned ${response.status} without ${expected}: ${body.slice(0, 500)}`,
  35 │         ),
  36 │       );
  37 │     }
  38 │     return body;
  39 │   }).pipe(Effect.retry({ schedule: Schedule.spaced("500 millis"), times: 8 }));
  40 │ });

0.89 packages/alchemy/src/Auth/OAuthFlow.ts:348:5
  335 │   const revoke = Effect.fn(function* (credentials: OAuthCredentials) {
  336 │     const endpoint = spec.endpoints.revoke;
  337 │     if (endpoint === undefined) return;
  338 │     const client = yield* HttpClient.HttpClient;
  339 │     const request = HttpClientRequest.post(endpoint).pipe(
  340 │       HttpClientRequest.setHeader("Accept", "application/json"),
  341 │       HttpClientRequest.bodyUrlParams({
  342 │         token: Redacted.value(credentials.refresh),
  343 │         token_type_hint: "refresh_token",
  344 │         client_id: spec.clientId,
  345 │         ...clientAuthParams(),
  346 │       }),
  347 │     );
> 348 │     yield* client.execute(request).pipe(
  349 │       Effect.mapError(
  350 │         (cause) =>
  351 │           new OAuthError({
  352 │             error: "network_error",
  353 │             errorDescription: `Revoke request failed: ${cause}`,
  354 │           }),
  355 │       ),
  356 │       Effect.asVoid,
  357 │     );
  358 │   });

0.89 packages/alchemy/src/Neon/QueryDataApi.ts:108:11
> 108 │           return yield* http
  109 │             .execute(
  110 │               request.pipe(
  111 │                 HttpClientRequest.setUrl(target.href),
  112 │                 HttpClientRequest.bearerToken(token),
  113 │               ),
  114 │             )
  115 │             .pipe(
  116 │               Effect.provideService(FetchHttpClient.RequestInit, {
  117 │                 redirect: "manual",
  118 │               }),
  119 │             );

0.89 packages/alchemy/src/Redis/Protocol.ts:214:13
  201 │     const start = options.tls
  202 │       ? import("node:tls").then((tls) =>
  203 │           attach(
  204 │             tls.connect({
  205 │               host: options.hostname,
  206 │               port: options.port,
  207 │               servername: options.hostname,
  208 │             }),
  209 │             "secureConnect",
  210 │           ),
  211 │         )
  212 │       : import("node:net").then((net) =>
  213 │           attach(
> 214 │             net.connect({ host: options.hostname, port: options.port }),
  215 │             "connect",
  216 │           ),
  217 │         );

0.89 packages/alchemy/test/Cloudflare/Container/fixtures/remote/local-object.ts:35:15
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
> 35 │               HttpClientRequest.get("http://container/"),
  36 │             );
  37 │             return yield* response.text;
  38 │           }),
  39 │       };
  40 │     });
  41 │   }).pipe(
  42 │     Effect.provide(
  43 │       Cloudflare.Containers.layer(LocalRemoteContainer, {
  44 │         enableInternet: true,
  45 │       }),
  46 │     ),
  47 │   ),
  48 │ ) {}

0.89 packages/alchemy/test/Local/fixtures/rpc-spawner-commands.ts:30:5
  27 │   const spawner = yield* RpcSpawner;
  28 │   const http = yield* HttpClient.HttpClient;
  29 │   const wsUrl = yield* http
> 30 │     .post(spawner.url, {
  31 │       body: yield* HttpBody.json({
  32 │         serverEntryUrl: new URL(
  33 │           "../../../src/Local/Sidecar.ts",
  34 │           import.meta.url,
  35 │         ).href,
  36 │       }),
  37 │     })
  38 │     .pipe(Effect.flatMap((response) => response.text));

0.89 packages/alchemy/test/Neon/fixtures/StorageNative.ts:43:5
  16 │ export default {
  17 │   async fetch(request: Request) {
  18 │     if (
  19 │       request.headers.get("authorization") !== `Bearer ${process.env.APP_TOKEN}`
  20 │     )
  21 │       return new Response("Unauthorized", { status: 401 });
  22 │     const client = new AwsClient({
  23 │       region: process.env.AWS_REGION!,
  24 │       service: "s3",
  25 │       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  26 │       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  27 │     });
  28 │     const url = `${process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "")}/${encodeURIComponent(process.env.BUCKET_NAME!)}/native.txt`;
  29 │     if (new URL(request.url).pathname === "/presign") {
  30 │       const target = new URL(url);
  31 │       target.searchParams.set("X-Amz-Expires", "60");
  32 │       const signed = await client.sign(target, {
  33 │         method: "PUT",
  34 │         aws: { signQuery: true },
  35 │       });
  36 │       return Response.json({ url: signed.url });
  37 │     }
  38 │     if (request.method === "PUT")
  39 │       return client.fetch(url, {
  40 │         method: "PUT",
  41 │         body: await request.arrayBuffer(),
  42 │       });
> 43 │     return client.fetch(url);
  44 │   },
  45 │ };

0.89 packages/cloudflare-runtime/src/core/bindings/secrets-store/SecretsStoreSecret.worker.ts:34:5
  28 │ export class SecretsStoreSecret extends WorkerEntrypoint<
  29 │   Env,
  30 │   SecretsStoreSecretServiceProps
  31 │ > {
  32 │   async get(): Promise<string> {
  33 │     const { storeId, secretName } = this.ctx.props;
> 34 │     const response = await this.env[BINDING_SECRETS_STORE_STORE].fetch(
  35 │       `http://placeholder/${encodeURIComponent(secretName)}?urlencoded=true`,
  36 │       { headers: { [HEADER_KV_NAMESPACE]: encodeURIComponent(storeId) } },
  37 │     );
  38 │     if (response.status === 404) {
  39 │       // Consume the body so the store's Durable Object call can settle
  40 │       // (see cloudflare/workerd#960).
  41 │       await response.body?.pipeTo(new WritableStream());
  42 │       // Match Miniflare's error message exactly.
  43 │       throw new Error(`Secret "${secretName}" not found`);
  44 │     }
  45 │     if (!response.ok) {
  46 │       throw new Error(
  47 │         `Secrets Store request failed: ${response.status} ${await response.text()}`,
  48 │       );
  49 │     }
  50 │     return await response.text();
  51 │   }
  52 │ }

0.89 packages/cloudflare-runtime/src/vite/websockets.ts:57:5
  56 │     const target = new URL(url.pathname + url.search, upstreamBase);
> 57 │     const upstream = NodeHttp.request({
  58 │       hostname: target.hostname,
  59 │       port: target.port,
  60 │       path: target.pathname + target.search,
  61 │       method: request.method,
  62 │       // Forward the client-facing host so the worker sees the URL the client
  63 │       // requested rather than the local workerd address.
  64 │       headers: proxyRequestHeaders(request, url, proxySharedSecret),
  65 │     });

0.89 packages/frontend-frameworks/fixtures/sveltekit-spa/src/routes/widgets/+page.ts:16:3
  15 │ export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
> 16 │   const response = await fetch("/api/widgets");
  17 │   const payload = (await response.json()) as WidgetsPayload;
  18 │   return {
  19 │     ...payload,
  20 │     description: describeWidgets(payload.widgets),
  21 │   };
  22 │ };

0.88 packages/alchemy/src/Neon/LanguageModel.ts:224:3
  217 │ const parseArguments = (value: string) =>
  218 │   Schema.decodeUnknownEffect(
  219 │     Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown)),
  220 │   )(value).pipe(
  221 │     Effect.mapError(() =>
  222 │       invalidOutput("Invalid function-call JSON arguments"),
  223 │     ),
> 224 │   );
  225 │
  226 │ const TokenCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

0.88 packages/alchemy/test/Cloudflare/Container/fixtures/hostreach/object.ts:66:13
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
> 66 │             HttpClientRequest.get(`http://container${path}`),
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
  79 │         enableInternet: true,
  80 │       }),
  81 │     ),
  82 │   ),
  83 │ ) {}

0.88 packages/better-auth/test/http.ts:28:7
  25 │ ): Effect.Effect<AuthHttpResponse, AuthHttpError> =>
  26 │   Effect.tryPromise({
  27 │     try: async (signal): Promise<AuthHttpResponse> => {
> 28 │       const response = await fetch(url, { ...init, signal });
  29 │       return {
  30 │         status: response.status,
  31 │         body: await response.text(),
  32 │         setCookies: response.headers.getSetCookie(),
  33 │       };
  34 │     },
  35 │     catch: (cause) =>
  36 │       new AuthHttpError({ url, status: 0, body: String(cause) }),
  37 │   });

0.87 packages/alchemy/src/Cloudflare/Logs.ts:122:11
  120 │       if (opts.options.since) {
  121 │         const response = yield* explainMissingObservabilityScope(
> 122 │           queryTelemetry({
  123 │             accountId: opts.accountId,
  124 │             queryId: "events",
  125 │             view: "events",
  126 │             timeframe: { from: opts.options.since.getTime(), to: now },
  127 │             limit,
  128 │             parameters: {
  129 │               filters: opts.filters,
  130 │               // orderBy: { value: "timestamp", order: "desc" },
  131 │             },
  132 │           }),
  133 │         );
  134 │         return parseEvents(response);
  135 │       }

0.87 packages/alchemy/src/Cloudflare/Workers/Fetch.ts:100:13
   95 │   const send = (body: BodyInit | undefined) =>
   96 │     Effect.mapError(
   97 │       Effect.map(
   98 │         Effect.tryPromise({
   99 │           try: () =>
> 100 │             fetcher.fetch(
  101 │               url.toString() as runtime.RequestInfo,
  102 │               {
  103 │                 method: request.method,
  104 │                 headers: request.headers as unknown as runtime.HeadersInit,
  105 │                 body,
  106 │                 duplex: request.body._tag === "Stream" ? "half" : undefined,
  107 │               } as runtime.RequestInit,
  108 │             ) as unknown as Promise<Response>,
  109 │           catch: (cause) => cause,
  110 │         }),
  111 │         (response) => HttpClientResponse.fromWeb(request, response),
  112 │       ),
  113 │       (cause) =>
  114 │         new HttpClientError.TransportError({
  115 │           request,
  116 │           cause,
  117 │           description: "Service binding fetch failed",
  118 │         }),
  119 │     );

0.87 packages/alchemy/src/Planetscale/Postgres/PostgresMigrations.ts:185:7
  182 │ const pgExec = (client: Client, sql: string, values?: ReadonlyArray<unknown>) =>
  183 │   Effect.tryPromise({
  184 │     try: () =>
> 185 │       client.query(sql, values as Array<unknown>).then(() => undefined),
  186 │     catch: toMigrationError,
  187 │   });

0.87 packages/alchemy/src/Railway/Bind.ts:83:17
  81 │             const response = yield* Effect.tryPromise({
  82 │               try: () =>
> 83 │                 fetch(
  84 │                   `${baseUrl}${RPC_PATH_PREFIX}${encodeURIComponent(prop)}`,
  85 │                   {
  86 │                     method: "POST",
  87 │                     headers: {
  88 │                       "content-type": "application/json",
  89 │                       [RPC_TOKEN_HEADER]: token,
  90 │                     },
  91 │                     body: JSON.stringify(args),
  92 │                     signal: AbortSignal.timeout(25_000),
  93 │                   },
  94 │                 ),
  95 │               catch: (cause) => new RpcCallError({ method: prop, cause }),
  96 │             });

0.87 packages/alchemy/test/Cloudflare/Container/fixtures/remote/object.ts:56:13
  47 │   Effect.gen(function* () {
  48 │     const container = yield* RemoteContainer;
  49 │
  50 │     return Effect.gen(function* () {
  51 │       const { fetch } = yield* container.getTcpPort(8080);
  52 │
  53 │       return {
  54 │         hello: () =>
  55 │           Effect.gen(function* () {
> 56 │             const response = yield* fetch(
  57 │               HttpClientRequest.get("http://container/"),
  58 │             );
  59 │             return yield* response.text;
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

0.87 packages/alchemy/test/Cloudflare/Container/fixtures/restart/object.ts:32:15
  16 │   Effect.gen(function* () {
  17 │     const container = yield* RestartContainer;
  18 │
  19 │     return Effect.gen(function* () {
  20 │       return {
  21 │         ping: () => container.ping(),
  22 │         running: () => container.running,
  23 │         // Hard stop from the DO side. Exercises the "container stopped, then
  24 │         // requested again" auto-restart path.
  25 │         stop: () => container.destroy(),
  26 │         // Crash from inside the container process. Exercises the
  27 │         // monitor-observed-exit auto-restart path.
  28 │         crash: () =>
  29 │           Effect.gen(function* () {
  30 │             const { fetch } = yield* container.getTcpPort(3000);
  31 │             const response = yield* fetch(
> 32 │               HttpClientRequest.get("http://container/exit"),
  33 │             );
  34 │             return yield* response.text;
  35 │           }).pipe(Effect.orDie),
  36 │       };
  37 │     });
  38 │   }).pipe(
  39 │     Effect.provide(
  40 │       Cloudflare.Containers.layer(RestartContainer, {
  41 │         enableInternet: true,
  42 │       }),
  43 │     ),
  44 │   ),

0.87 packages/frontend-frameworks/src/astro/prerenderer.ts:203:3
> 203 │   };
  204 │ }

0.86 packages/alchemy/src/Kubernetes/internal/client.ts:83:13
  80 │             hostname: url.hostname,
  81 │             port: url.port || 443,
  82 │             path: `${url.pathname}${url.search}`,
> 83 │             method,

0.86 packages/alchemy/src/Local/RpcSpawner.ts:363:9
  360 │     Effect.flatMap((spawnerUrl) => {
  361 │       const streamOnce = Effect.gen(function* () {
  362 │         const client = yield* HttpClient.HttpClient;
> 363 │         const response = yield* client.get(
  364 │           new URL(LOGS_PATH, spawnerUrl).toString(),
  365 │         );
  366 │         yield* response.stream.pipe(
  367 │           Stream.decodeText,
  368 │           Stream.splitLines,
  369 │           Stream.runForEach((raw) =>
  370 │             Effect.suspend(() => {
  371 │               const parsed = parseSidecarLogLine(raw);
  372 │               if (parsed === undefined) return Effect.void;
  373 │               tee?.(parsed);
  374 │               // Sidecar lines already carry the sidecar's own logger prefix
  375 │               // (timestamp/level/fiber) — print them verbatim; routing through
  376 │               // this process's logger would stamp a second prefix on top.
  377 │               return parsed.channel === "stderr"
  378 │                 ? Console.error(parsed.line)
  379 │                 : Console.log(parsed.line);
  380 │             }),
  381 │           ),
  382 │         );
  383 │       });

0.86 packages/alchemy/src/Planetscale/MySQL/MySQLMigrations.ts:181:5
  179 │ const mysqlQuery = (connection: Connection, sql: string) =>
  180 │   Effect.tryPromise({
> 181 │     try: () => connection.query(sql).then(() => undefined),
  182 │     catch: toMigrationError,
  183 │   });

0.86 packages/alchemy/src/Prisma/Internal/ArtifactUpload.ts:36:5
> 36 │     const responseOption = yield* http.execute(request).pipe(
  37 │       Effect.mapError(
  38 │         () =>
  39 │           new Error(
  40 │             "Prisma artifact upload transport failed before a response was received.",
  41 │           ),
  42 │       ),
  43 │       Effect.timeoutOption(ARTIFACT_UPLOAD_TIMEOUT),
  44 │     );

0.86 packages/alchemy/test/Local/fixtures/rpc-spawner-devserver-parent.ts:43:5
  39 │   const wsUrl = yield* http
  40 │     .post(sp.url, {
  41 │       body: yield* HttpBody.json({ serverEntryUrl: sidecarEntry }),
  42 │     })
> 43 │     .pipe(Effect.flatMap((res) => res.text));
  44 │
  45 │   // Sessions carry the stack environment (children are shared across stacks).
  46 │   const sessionUrl = new URL(wsUrl);

0.86 packages/cloudflare-runtime/src/core/remote-bindings/workers/outbound.worker.ts:126:5
  119 │   private async proxy(request: Request, session: Session): Promise<Response> {
  120 │     const origin = new URL(request.url);
  121 │     const target = new URL(origin.pathname + origin.search, session.config.url);
  122 │     const proxiedHeaders = new Headers(request.headers);
  123 │     for (const [key, value] of Object.entries(session.config.headers)) {
  124 │       proxiedHeaders.set(key, value);
  125 │     }
> 126 │     return await fetch(
  127 │       target,
  128 │       new Request(request, { headers: proxiedHeaders }),
  129 │     );
  130 │   }

0.86 packages/cloudflare-runtime/src/core/test/sandbox.ts:36:5
  33 │   yield* proxyInstance.set(upstreamUrl);
  34 │   console.log(proxyInstance.url.href);
  35 │   const res = yield* Effect.promise(async () => {
> 36 │     const res = await fetch(new URL("/", proxyInstance.url));
  37 │     return {
  38 │       status: res.status,
  39 │       body: await res.text(),
  40 │     };
  41 │   });

0.85 packages/alchemy/src/Cloudflare/Access.ts:34:9
  31 │     const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  32 │     const domainUsesAccess = yield* cachedFunction((domain: string) =>
  33 │       Effect.promise((signal) =>
> 34 │         fetch(`https://${domain}`, { redirect: "manual", signal }),
  35 │       ).pipe(
  36 │         Effect.map(
  37 │           (response) =>
  38 │             response.status === 302 &&
  39 │             (response.headers
  40 │               .get("location")
  41 │               ?.includes("cloudflareaccess.com") ??
  42 │               false),
  43 │         ),
  44 │         Effect.timeout(1000),
  45 │         Effect.catch(() => Effect.succeed(false)),
  46 │       ),
  47 │     );

0.85 packages/alchemy/src/GitHub/PullRequest.ts:362:11
  357 │       if (draftChanged) {
  358 │         const mutation = draft
  359 │           ? "convertPullRequestToDraft"
  360 │           : "markPullRequestReadyForReview";
  361 │         yield* request(() =>
> 362 │           octokit.graphql(
  363 │             `mutation($id: ID!) { ${mutation}(input: {pullRequestId: $id}) { pullRequest { id } } }`,
  364 │             { id: observed.node_id },
  365 │           ),
  366 │         );
  367 │       }

0.85 packages/alchemy/src/SQL/Migrations/Introspect.ts:23:9
  20 │   switch (executor.dialect) {
  21 │     case "sqlite":
  22 │       return executor
> 23 │         .query(`PRAGMA table_info(${quoteIdentifier(table, "sqlite")});`)
  24 │         .pipe(
  25 │           Effect.map((rows) =>
  26 │             rows.map((row) => ({
  27 │               name: String(row.name),
  28 │               type: String(row.type ?? "").toUpperCase(),
  29 │             })),
  30 │           ),
  31 │           // A missing table yields an empty PRAGMA result, not an error, but
  32 │           // some tunnels surface it as one — treat both as "absent".
  33 │           Effect.catch(() => Effect.succeed([])),
  34 │         );

0.85 packages/cloudflare-runtime/src/core/bindings/assets/assets-kv.worker.ts:25:5
  24 │     const { filePath, contentType } = entry;
> 25 │     const response = await env.ASSETS_FILES.fetch(
  26 │       new URL(
  27 │         // somewhere in blobservice I think this is being decoded again
  28 │         filePath
  29 │           .split("/")
  30 │           .map((x) => encodeURIComponent(x))
  31 │           .join("/"),
  32 │         "http://placeholder",
  33 │       ),
  34 │     );

0.85 packages/cloudflare-runtime/src/core/registry/RegistryProxy.ts:240:15
> 240 │               }),
  241 │           },
  242 │         };
  243 │       }),

0.84 packages/alchemy/src/Cli/checkVersion.ts:123:3
  121 │ const fetchDistTags = Effect.gen(function* () {
  122 │   const http = yield* HttpClient.HttpClient;
> 123 │   const response = yield* http.get(NPM_DIST_TAGS_URL);
  124 │   const distTags = (yield* response.json) as Record<string, string> | null;
  125 │   if (typeof distTags !== "object" || distTags === null) {
  126 │     return yield* Effect.fail(new Error("malformed dist-tags response"));
  127 │   }
  128 │   return distTags;
  129 │ });

0.84 packages/alchemy/test/Cloudflare/Container/fixtures/prismahost/object.ts:36:11
  26 │ export class PrismaHostContainerObject extends Cloudflare.DurableObject<PrismaHostContainerObject>()(
  27 │   "PrismaHostContainerObject",
  28 │   Effect.gen(function* () {
  29 │     const container = yield* PrismaHostContainer;
  30 │
  31 │     return Effect.gen(function* () {
  32 │       const { fetch } = yield* container.getTcpPort(8080);
  33 │
  34 │       const get = (path: string) =>
  35 │         Effect.gen(function* () {
> 36 │           const response = yield* fetch(
  37 │             HttpClientRequest.get(`http://container${path}`),
  38 │           );
  39 │           return yield* response.text;
  40 │         });
  41 │
  42 │       return {
  43 │         getEnv: () => get("/env"),
  44 │         getProbe: () => get("/probe"),
  45 │       };
  46 │     });
  47 │   }).pipe(
  48 │     Effect.provide(
  49 │       Cloudflare.Containers.layer(PrismaHostContainer, {
  50 │         enableInternet: true,
  51 │       }),
  52 │     ),
  53 │   ),
  54 │ ) {}

0.84 packages/alchemy/test/Cloudflare/D1/fixtures/async-worker.ts:21:7
  18 │     const db = env.DB;
  19 │
  20 │     if (request.method === "POST" && url.pathname === "/init") {
> 21 │       const result = await db.exec(
  22 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, style TEXT NOT NULL, name TEXT NOT NULL)",
  23 │       );
  24 │       return Response.json({ count: result.count, duration: result.duration });
  25 │     }

0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/fetch-binding/fetch-caller.ts:31:11
  22 │   Effect.gen(function* () {
  23 │     const fetchTarget = yield* Cloudflare.Workers.Fetch(FetchTargetWorker);
  24 │
  25 │     return {
  26 │       fetch: Effect.gen(function* () {
  27 │         const request = yield* HttpServerRequest;
  28 │         const name =
  29 │           new URL(request.url, "http://x").searchParams.get("name") ?? "world";
  30 │         const res = yield* fetchTarget(
> 31 │           HttpClientRequest.get("https://target/").pipe(
  32 │             HttpClientRequest.setUrlParam("name", name),
  33 │           ),
  34 │         );
  35 │         const body = yield* res.text;
  36 │         return HttpServerResponse.text(`caller saw: ${body}`, {
  37 │           status: res.status,
  38 │         });
  39 │       }).pipe(
  40 │         Effect.catchCause((cause) =>
  41 │           Effect.succeed(
  42 │             HttpServerResponse.text(`caller failed: ${String(cause)}`, {
  43 │               status: 500,
  44 │             }),
  45 │           ),
  46 │         ),
  47 │       ),
  48 │     };
  49 │   }).pipe(Effect.provide(Cloudflare.Workers.FetchBinding)),

0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/tagged-do/object.ts:32:7
  29 │     return Effect.gen(function* () {
  30 │       // D1's `exec()` splits on newlines and rejects multi-line statements
  31 │       // ("incomplete input: SQLITE_ERROR"). Keep the DDL on a single line.
> 32 │       yield* db.exec(
  33 │         "CREATE TABLE IF NOT EXISTS d1_counters (id TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)",
  34 │       );

0.84 packages/alchemy/test/Neon/Website/Fixture.ts:100:3
   99 │ export const bodyContaining = Effect.fn(function* (url: string, text: string) {
> 100 │   const body = yield* HttpClient.get(url).pipe(
  101 │     Effect.flatMap((response) => response.text),
  102 │     Effect.repeat({
  103 │       schedule: Schedule.spaced("1 second"),
  104 │       times: 8,
  105 │       until: (body) => body.includes(text),
  106 │     }),
  107 │   );
  108 │   expect(body).toContain(text);
  109 │   return body;
  110 │ });

0.84 packages/cloudflare-runtime/src/core/bindings/stream/Stream.worker.ts:681:5
  677 │   async createWatermarkFromUrl(
  678 │     url: string,
  679 │     params: StreamWatermarkCreateParams,
  680 │   ): Promise<WatermarkRow> {
> 681 │     const response = await fetch(url);
  682 │     if (!response.ok || response.body === null) {
  683 │       throw new InvalidURLError(
  684 │         `Failed to fetch watermark from URL: ${response.status} ${response.statusText}`,
  685 │       );
  686 │     }
  687 │
  688 │     return this.createWatermarkFromBody(
  689 │       await response.arrayBuffer(),
  690 │       url,
  691 │       params,
  692 │     );
  693 │   }

0.84 packages/cloudflare-runtime/src/vite/dev-plugin.ts:282:13
> 282 │             const request = NodeHttp.request(url, {
  283 │               method: req.method,
  284 │               headers: proxyRequestHeaders(req, url, proxySharedSecret),
  285 │             });

0.83 packages/alchemy/src/Cloudflare/Cache/RegionalTieredCache.ts:206:7
  199 │     reconcile: Effect.fn(function* ({ news, output }) {
  200 │       // Inputs have been resolved to concrete strings by Plan.
  201 │       const zoneId = news.zoneId as string;
  202 │
  203 │       // 1. Observe — the setting always exists (on entitled zones); read
  204 │       //    its live value. Plan-gated zones fail here with the typed
  205 │       //    `SettingUnavailableForPlan` error.
> 206 │       const observed = yield* cache.getRegionalTieredCache({ zoneId });
  207 │
  208 │       // 2. Capture — the pre-management value, restored on destroy.
  209 │       //    `output` (including an adoption read) already carries it;
  210 │       //    otherwise this is our first touch and the observed value is
  211 │       //    the zone's original.
  212 │       const initialValue =
  213 │         output !== undefined ? output.initialValue : observed.value;
  214 │
  215 │       // 3. Sync — patch only when the observed value differs.
  216 │       const desired = desiredValue(news);
  217 │       if (observed.value === desired) {
  218 │         return toAttributes(zoneId, observed, initialValue);
  219 │       }
  220 │       const patched = yield* cache.patchRegionalTieredCache({
  221 │         zoneId,
  222 │         value: desired,
  223 │       });
  224 │       return toAttributes(zoneId, patched, initialValue);
  225 │     }),

0.83 packages/alchemy/test/AWS/Lambda/fixtures/microvm/isolated/orchestrator.ts:84:17
  81 │             const headers = AWS.Lambda.microvmAuthHeaders(authToken);
  82 │             const echoRes = yield* client
  83 │               .get(
> 84 │                 `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
  85 │                 { headers },
  86 │               )
  87 │               .pipe(
  88 │                 Effect.retry({
  89 │                   schedule: Schedule.exponential("500 millis"),
  90 │                   times: 8,
  91 │                 }),
  92 │                 Effect.orDie,
  93 │               );

0.83 packages/alchemy/test/Railway/fixtures/postgres-fn.ts:30:7
  18 │ export default class PostgresFn extends Function<PostgresFn>()(
  19 │   "PostgresFn",
  20 │   {
  21 │     project: Site,
  22 │     environment: Partition,
  23 │     main: import.meta.url,
  24 │     build: { install: ["pg", "drizzle-orm"] },
  25 │   },
  26 │   Effect.gen(function* () {
  27 │     const conn = yield* ConnectPostgres(Db);
  28 │     const db = yield* Drizzle.Postgres(conn.connectionString);
  29 │     return {
> 30 │       fetch: db.execute("select 1 as ok", "objects").pipe(
  31 │         Effect.flatMap((rows) => HttpServerResponse.json({ rows })),
  32 │         Effect.catch((error) =>
  33 │           HttpServerResponse.json(
  34 │             { ok: false, error: String(error) },
  35 │             { status: 500 },
  36 │           ),
  37 │         ),
  38 │       ),
  39 │     };
  40 │   }).pipe(Effect.provide(ConnectPostgresHttp)),
  41 │ ) {}

0.83 packages/cloudflare-runtime/src/core/bindings/browser/Browser.worker.ts:365:11
  356 │   #closeBrowser(): Response {
  357 │     // Browser.close CDP doesn't reliably kill Chrome, so we kill via the
  358 │     // loopback instead. The DO returns immediately so it stays idle while
  359 │     // the module router waits for Chrome to fully exit.
  360 │     if (this.sessionInfo) {
  361 │       const closeUrl = new URL("http://localhost/browser/close");
  362 │       closeUrl.searchParams.set("sessionId", this.sessionInfo.sessionId);
  363 │       this.state.waitUntil(
  364 │         this.env[BINDING_BROWSER_LOOPBACK]
> 365 │           .fetch(closeUrl, { method: "POST" })
  366 │           .then(
  367 │             () => {},
  368 │             () => {},
  369 │           ),
  370 │       );
  371 │     }
  372 │     return Response.json({ status: "closed" });
  373 │   }

0.83 packages/cloudflare-runtime/src/core/bindings/images/Images.worker.ts:266:5
  262 │   async #detectContentType(data: ArrayBuffer): Promise<string> {
  263 │     const formData = new FormData();
  264 │     formData.append("image", new Blob([data]));
  265 │
> 266 │     const response = await this.env[BINDING_IMAGES_LOOPBACK].fetch(
  267 │       "http://placeholder/info",
  268 │       {
  269 │         method: "POST",
  270 │         body: formData,
  271 │       },
  272 │     );
  273 │     if (response.ok) {
  274 │       const info = (await response.json()) as { format?: string };
  275 │       if (info.format) {
  276 │         return info.format;
  277 │       }
  278 │     } else {
  279 │       // Consume the body so the loopback call settles (cloudflare/workerd#960).
  280 │       await response.body?.pipeTo(new WritableStream());
  281 │     }
  282 │     return "application/octet-stream";
  283 │   }

0.83 packages/cloudflare-runtime/src/core/bindings/queue/Queue.ts:274:19
  270 │               for (const message of messages) {
  271 │                 if (!message.leaseId) continue;
  272 │                 const { body, contentType } = decodePulledMessage(message);
  273 │                 const response = yield* Effect.tryPromise(() =>
> 274 │                   fetch(endpoint, {
  275 │                     method: "POST",
  276 │                     headers: { "X-Msg-Fmt": contentType },
  277 │                     body,
  278 │                   }),
  279 │                 );
  280 │                 if (response.ok) {
  281 │                   acks.push({ leaseId: message.leaseId });
  282 │                 }
  283 │                 // Non-ok: leave unacked — the visibility timeout redelivers.
  284 │               }

0.83 packages/cloudflare-runtime/src/core/remote-bindings/workers/client.worker.ts:81:5
  56 │ export function makeFetch(bindingName: string, extraHeaders?: Headers) {
  57 │   return async (
  58 │     input: RequestInfo | URL,
  59 │     init?: RequestInit,
  60 │   ): Promise<Response> => {
  61 │     const request = new Request(input, init);
  62 │
  63 │     const proxiedHeaders = new Headers(extraHeaders);
  64 │     for (const [name, value] of request.headers) {
  65 │       // The `Upgrade` header needs to be special-cased to prevent:
  66 │       //   TypeError: Worker tried to return a WebSocket in a response to a request which did not contain the header "Upgrade: websocket"
  67 │       // `MF-Dispatch-Namespace-Options` is consumed by the remote bindings
  68 │       // preview endpoint and must be forwarded verbatim.
  69 │       if (name === "upgrade" || name === "mf-dispatch-namespace-options") {
  70 │         proxiedHeaders.set(name, value);
  71 │       } else {
  72 │         proxiedHeaders.set(`MF-Header-${name}`, value);
  73 │       }
  74 │     }
  75 │     proxiedHeaders.set("MF-URL", request.url);
  76 │     proxiedHeaders.set("MF-Binding", bindingName);
  77 │     const req = new Request(request, {
  78 │       headers: proxiedHeaders,
  79 │     });
  80 │
> 81 │     const response = await fetch("http://stub", req);
  82 │     return response;
  83 │   };
  84 │ }

0.82 packages/alchemy/src/AWS/CostAndUsageReport/ReportDefinition.ts:421:13
  415 │         delete: Effect.fn(function* ({ output }) {
  416 │           // Idempotent: DeleteReportDefinition's error semantics for a missing
  417 │           // report are undocumented, so observe first and treat absent as done.
  418 │           const observed = yield* findReport(output.reportName);
  419 │           if (!observed) return;
  420 │           yield* pin(
> 421 │             cur.deleteReportDefinition({ ReportName: output.reportName }),
  422 │           );
  423 │         }),
  424 │       });

0.82 packages/alchemy/src/Cloudflare/D1/QueryDatabaseBinding.ts:40:13
  35 │       return {
  36 │         raw: rawEff,
  37 │         prepare: (query: string) => new PreparedStatement(query, [], rawEff),
  38 │         exec: (query: string) =>
  39 │           Effect.flatMap(rawEff, (raw) =>
> 40 │             Effect.promise(() => raw.exec(query)),
  41 │           ),
  42 │         batch: <T = unknown>(statements: PreparedStatement[]) =>
  43 │           Effect.flatMap(rawEff, (raw) =>
  44 │             Effect.promise(() =>
  45 │               raw.batch<T>(statements.map((s) => s._build(raw))),
  46 │             ),
  47 │           ),
  48 │       } satisfies QueryDatabaseClient;

0.82 packages/alchemy/src/Cloudflare/Ssl/UniversalSsl.ts:189:7
  184 │     reconcile: Effect.fn(function* ({ news, output }) {
  185 │       // Inputs have been resolved to concrete strings by Plan.
  186 │       const zoneId = news.zoneId as string;
  187 │
  188 │       // 1. Observe — the setting always exists; read its live value.
> 189 │       const observed = yield* ssl.getUniversalSetting({ zoneId });
  190 │       const enabled = observedEnabled(observed);
  191 │
  192 │       // 2. Capture — the pre-management value, restored on destroy.
  193 │       //    `output` (including an adoption read) already carries it;
  194 │       //    otherwise this is our first touch and the observed value is
  195 │       //    the zone's original.
  196 │       const initialEnabled =
  197 │         output !== undefined ? output.initialEnabled : enabled;
  198 │
  199 │       // 3. Sync — patch only when the observed value differs.
  200 │       if (enabled === news.enabled) {
  201 │         return { zoneId, enabled, initialEnabled };
  202 │       }
  203 │       const patched = yield* patchUniversal({
  204 │         zoneId,
  205 │         enabled: news.enabled,
  206 │       });
  207 │       return { zoneId, enabled: observedEnabled(patched), initialEnabled };
  208 │     }),

0.82 packages/alchemy/src/GitHub/Label.ts:261:13
  258 │       if (observed === undefined) {
  259 │         const { data } = yield* Effect.tryPromise({
  260 │           try: () =>
> 261 │             octokit.rest.issues.createLabel({
  262 │               owner: news.owner,
  263 │               repo: news.repository,
  264 │               name: news.name,
  265 │               color: news.color,
  266 │               description: news.description,
  267 │             }),
  268 │           catch: (e) => e as Error,
  269 │         });
  270 │
  271 │         return attrsOf(data);
  272 │       }

0.82 packages/alchemy/test/Cloudflare/Utils/WorkerRequest.ts:26:3
  22 │ export const requestWorker = (
  23 │   request: HttpClientRequest.HttpClientRequest,
  24 │   options: { retryDelay?: Duration.Input } = {},
  25 │ ) =>
> 26 │   HttpClient.execute(request).pipe(
  27 │     Effect.flatMap((response) =>
  28 │       response.status !== 404 && response.status !== 500
  29 │         ? Effect.succeed(response)
  30 │         : response.text.pipe(
  31 │             Effect.flatMap((body) =>
  32 │               isWorkerPlaceholder(response.status, body)
  33 │                 ? Effect.fail(new WorkerNotPropagated({ url: request.url }))
  34 │                 : Effect.succeed(response),
  35 │             ),
  36 │           ),
  37 │     ),
  38 │     Effect.retry({
  39 │       while: (error) => error._tag === "WorkerNotPropagated",
  40 │       schedule: Schedule.spaced(options.retryDelay ?? "1 second"),
  41 │       times: 8,
  42 │     }),
  43 │   );

0.82 packages/cloudflare-runtime/src/core/bindings/queue/QueueShimForward.worker.ts:42:7
  29 │ export default {
  30 │   async fetch(request, env) {
  31 │     const url = new URL(request.url);
  32 │     const target = new URL(url.pathname + url.search, env.SHIM_URL);
  33 │     const headers = new Headers(request.headers);
  34 │     headers.set("authorization", `Bearer ${env.SHIM_TOKEN}`);
  35 │     // The body may be replayed on retry — buffer it up front.
  36 │     const body = await request.arrayBuffer();
  37 │     let response: Response | undefined;
  38 │     for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  39 │       if (attempt > 0) {
  40 │         await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  41 │       }
> 42 │       response = await fetch(target, {
  43 │         method: request.method,
  44 │         headers,
  45 │         body,
  46 │       });
  47 │       if (!RETRYABLE.has(response.status)) {
  48 │         return response;
  49 │       }
  50 │     }
  51 │     return response!;
  52 │   },
  53 │ } satisfies ExportedHandler<Env>;

0.82 packages/frontend-frameworks/src/vinext/cache/redis-runtime.ts:37:1
  33 │ const send = (
  34 │   connection: Connection,
  35 │   command: string,
  36 │   args: readonly Arg[] = [],
> 37 │ ): Promise<Reply> => Effect.runPromise(connection.send(command, args));
  38 │
  39 │ const connections = new Map<string, Promise<Connection>>();

0.81 packages/alchemy/src/AWS/IAM/SAMLProvider.ts:281:7
  280 │       // Sync tags against the cloud's actual tags.
> 281 │       const observedTagsResp = yield* iam.listSAMLProviderTags({
  282 │         SAMLProviderArn: samlProviderArn,
  283 │       });
  284 │       const observedTags = toTagRecord(observedTagsResp.Tags);

0.81 packages/alchemy/src/Cloudflare/OriginCaCertificate/OriginCaCertificate.ts:341:5
  335 │ const findByHostnames = (hostnames: string[]) =>
  336 │   Effect.gen(function* () {
  337 │     const { accountId } = yield* yield* CloudflareEnvironment;
  338 │     const hostname = hostnames[0].replace(/^\*\./, "");
  339 │     const zoneId = yield* resolveZoneIdForHostname(accountId, hostname);
  340 │     if (!zoneId) return [];
> 341 │     const certs = yield* originCa.listOriginCaCertificates
  342 │       .items({ zoneId })
  343 │       .pipe(
  344 │         Stream.filter((cert) => sameHostnames([...cert.hostnames], hostnames)),
  345 │         Stream.runCollect,
  346 │       );
  347 │     return [...certs].sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
  348 │   });

0.81 packages/alchemy/src/Cloudflare/Rum/Rule.ts:323:7
  322 │     delete: Effect.fn(function* ({ output }) {
> 323 │       yield* rum
  324 │         .deleteRule({
  325 │           accountId: output.accountId,
  326 │           rulesetId: output.rulesetId,
  327 │           ruleId: output.id,
  328 │         })
  329 │         .pipe(
  330 │           // `RuleNotFound` (code 10003) — the rule is already gone;
  331 │           // `RulesetNotFound` (404) — the parent site/ruleset is gone,
  332 │           // taking the rule with it. Both make delete a success.
  333 │           Effect.catchTag(
  334 │             ["RuleNotFound", "RulesetNotFound"],
  335 │             () => Effect.void,
  336 │           ),
  337 │         );
  338 │     }),

0.81 packages/alchemy/src/Cloudflare/Zone/Hold.ts:196:7
  193 │       const desiredIncludeSubdomains = news.includeSubdomains ?? false;
  194 │
  195 │       // 1. Observe — is the zone currently held?
> 196 │       const observed = yield* zones.getHold({ zoneId });

0.81 packages/alchemy/src/Git/Hasher/Lambda.ts:47:11
  44 │         options: Parameters<HasherShape["hashPart"]>[1],
  45 │       ) =>
  46 │         Effect.gen(function* () {
> 47 │           const response = yield* invoke({
  48 │             Payload: JSON.stringify(encodeHashEvent(payload, options)),
  49 │           }).pipe(
  50 │             Effect.mapError(
  51 │               (error) =>
  52 │                 new HashError({
  53 │                   reason: `lambda invoke: ${error._tag}${"message" in error ? `: ${String(error.message)}` : ""}`,
  54 │                 }),
  55 │             ),
  56 │           );

0.81 packages/alchemy/src/GitHub/Release.ts:321:15
  317 │       if (observed === undefined) {
  318 │         observed = yield* Effect.tryPromise({
  319 │           try: () =>
  320 │             octokit.rest.repos.createRelease({
> 321 │               owner: news.owner,
  322 │               repo: news.repository,
  323 │               tag_name: news.tagName,
  324 │               name: news.name,
  325 │               body,
  326 │               draft: news.draft,
  327 │               prerelease: news.prerelease,
  328 │               target_commitish: news.targetCommitish,
  329 │               generate_release_notes: news.generateReleaseNotes,
  330 │             }),
  331 │           catch: (error) => error as Error & { status?: number },
  332 │         }).pipe(
  333 │           Effect.map(({ data }) => data),
  334 │           Effect.catchIf(
  335 │             (error) => error.status === 422,
  336 │             (error) =>
  337 │               findRelease(news).pipe(
  338 │                 Effect.flatMap((release) =>
  339 │                   release === undefined
  340 │                     ? Effect.fail(error)
  341 │                     : Effect.succeed(release),
  342 │                 ),
  343 │               ),
  344 │           ),
  345 │         );
  346 │       }

0.81 packages/alchemy/src/Hetzner/FloatingIp.ts:411:7
  410 │     delete: Effect.fn(function* ({ output }) {
> 411 │       const current = yield* getById(output.id);
  412 │       if (current === undefined) return;
  413 │       if (current.protection.delete) {
  414 │         yield* disableProtection(current.id);
  415 │       }
  416 │       if (current.server !== null) {
  417 │         const { action } = yield* Hetzner.floatingIpActions.unassignFloatingIp({
  418 │           id: current.id,
  419 │         });
  420 │         yield* waitForAction(action);
  421 │       }
  422 │       yield* Hetzner.floatingIps
  423 │         .deleteFloatingIp({ id: current.id })
  424 │         .pipe(Effect.catchTag("NotFound", () => Effect.void));
  425 │     }),

0.81 packages/alchemy/src/Neon/Branch.ts:829:5
  822 │ const fetchConnection = (
  823 │   projectId: string,
  824 │   branchId: string,
  825 │   databaseName: string,
  826 │   roleName: string,
  827 │ ) =>
  828 │   Effect.gen(function* () {
> 829 │     const direct = yield* getConnectionURI({
  830 │       project_id: projectId,
  831 │       branch_id: branchId,
  832 │       database_name: databaseName,
  833 │       role_name: roleName,
  834 │       pooled: false,
  835 │     });
  836 │     const pooled = yield* getConnectionURI({
  837 │       project_id: projectId,
  838 │       branch_id: branchId,
  839 │       database_name: databaseName,
  840 │       role_name: roleName,
  841 │       pooled: true,
  842 │     });
  843 │     return { uri: direct.uri, pooled: pooled.uri };
  844 │   });

0.81 packages/alchemy/src/Neon/FunctionProvider.ts:182:7
  179 │     stables: ["projectId", "branchId", "functionId", "slug", "url"],
  180 │     list: Effect.fn(function* () {
  181 │       const result: FunctionAttributes[] = [];
> 182 │       for (const project of yield* Neon.listProjects
  183 │         .items({})
  184 │         .pipe(Stream.runCollect)) {
  185 │         for (const branch of yield* Neon.listProjectBranches
  186 │           .items({ project_id: project.id })
  187 │           .pipe(Stream.runCollect)) {
  188 │           const scope = { projectId: project.id, branchId: branch.id };
  189 │           for (const fn of yield* Neon.listProjectBranchFunctions
  190 │             .items({ project_id: project.id, branch_id: branch.id })
  191 │             .pipe(Stream.runCollect))
  192 │             result.push(attributes(scope, fn));
  193 │         }
  194 │       }
  195 │       return result;
  196 │     }),

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-event-flush-worker.ts:59:11
  45 │   Effect.gen(function* () {
  46 │     const targetNamespace = yield* OtelEventFlushTarget;
  47 │
  48 │     return {
  49 │       fetch: Effect.gen(function* () {
  50 │         const request = yield* HttpServerRequest;
  51 │         if (request.url.startsWith("/rpc")) {
  52 │           const pong = yield* targetNamespace.getByName("target").ping();
  53 │           return HttpServerResponse.text(`worker-saw:${pong}`);
  54 │         }
  55 │         const targetClient = Cloudflare.toHttpClient(
  56 │           targetNamespace.getByName("target"),
  57 │         );
  58 │         const response = yield* targetClient.execute(
> 59 │           HttpClientRequest.get("http://otel-event-flush-target/"),
  60 │         );
  61 │         return HttpServerResponse.text(`worker-saw:${yield* response.text}`);
  62 │       }).pipe(Effect.withSpan("otel-event-flush.worker"), Effect.orDie),
  63 │     };
  64 │   }).pipe(

0.80 packages/alchemy/src/AWS/Bootstrap.ts:60:5
  57 │ const deleteAllObjects = Effect.fn(function* (bucketName: string) {
  58 │   let continuationToken: string | undefined;
  59 │   do {
> 60 │     const listResponse = yield* s3.listObjectsV2({
  61 │       Bucket: bucketName,
  62 │       ContinuationToken: continuationToken,
  63 │     });
  64 │
  65 │     if (listResponse.Contents && listResponse.Contents.length > 0) {
  66 │       yield* s3.deleteObjects({
  67 │         Bucket: bucketName,
  68 │         Delete: {
  69 │           Objects: listResponse.Contents.map((obj) => ({
  70 │             Key: obj.Key!,
  71 │           })),
  72 │           Quiet: true,
  73 │         },
  74 │       });
  75 │     }
  76 │
  77 │     continuationToken = listResponse.NextContinuationToken;
  78 │   } while (continuationToken);

0.80 packages/alchemy/src/AWS/CostExplorer/common.ts:56:5
  54 │ export const fetchCeTags = Effect.fn(function* (resourceArn: string) {
  55 │   const listed = yield* pinCe(
> 56 │     ce.listTagsForResource({ ResourceArn: resourceArn }),
  57 │   ).pipe(
  58 │     Effect.catchTag("ResourceNotFoundException", () =>
  59 │       Effect.succeed({ ResourceTags: [] }),
  60 │     ),
  61 │   );
  62 │   return toTagRecord(listed.ResourceTags);
  63 │ });

0.80 packages/alchemy/src/AWS/EC2/FlowLog.ts:381:13
  379 │           // Sync tags — observed cloud tags vs desired.
  380 │           const currentTags =
> 381 │             (yield* ec2
  382 │               .describeTags({
  383 │                 Filters: [
  384 │                   { Name: "resource-id", Values: [flowLogId] },
  385 │                   { Name: "resource-type", Values: ["vpc-flow-log"] },
  386 │                 ],
  387 │               })
  388 │               .pipe(
  389 │                 Effect.map(
  390 │                   (r) =>
  391 │                     Object.fromEntries(
  392 │                       r.Tags?.map((t) => [t.Key!, t.Value!]) ?? [],
  393 │                     ) as Record<string, string>,
  394 │                 ),
  395 │               )) ?? {};

0.80 packages/alchemy/src/Auth/OidcToken.ts:90:7
   77 │   {
   78 │     // A per-job request URL and bearer, present only with
   79 │     // `permissions: id-token: write` on the workflow or job.
   80 │     name: "github-actions",
   81 │     probe: Effect.fn("oidc.githubActions")(function* (audience) {
   82 │       if (!(yield* getEnv("GITHUB_ACTIONS"))) return undefined;
   83 │       const requestUrl = yield* getEnv("ACTIONS_ID_TOKEN_REQUEST_URL");
   84 │       const bearer = yield* getEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN");
   85 │       if (!requestUrl || !bearer) return undefined;
   86 │
   87 │       const url = new URL(requestUrl);
   88 │       if (audience !== undefined) url.searchParams.set("audience", audience);
   89 │       const client = yield* HttpClient.HttpClient;
>  90 │       const response = yield* client.get(url, {
   91 │         headers: {
   92 │           Authorization: `Bearer ${bearer}`,
   93 │           Accept: "application/json; api-version=2.0",
   94 │         },
   95 │       });
   96 │       if (response.status !== 200) return undefined;
   97 │       const body =
   98 │         yield* HttpClientResponse.schemaBodyJson(GitHubTokenResponse)(response);
   99 │       return body.value ? Redacted.make(body.value) : undefined;
  100 │     }),
  101 │   },

0.80 packages/alchemy/src/Cloudflare/Gateway/Location.ts:227:9
  221 │     read: Effect.fn(function* ({ id, output, olds }) {
  222 │       const { accountId } = yield* yield* CloudflareEnvironment;
  223 │       const acct = output?.accountId ?? accountId;
  224 │
  225 │       // Owned path — refresh by the cached location id.
  226 │       if (output?.locationId) {
> 227 │         const observed = yield* getLocation(acct, output.locationId);
  228 │         if (observed) return toAttributes(observed, acct);
  229 │       }
  230 │
  231 │       // Cold read — locate by deterministic name. Locations carry no
  232 │       // ownership markers, so report the match as Unowned to gate adoption.
  233 │       const name = yield* resolveName(id, olds?.name ?? output?.name);
  234 │       const match = yield* findByName(acct, name);
  235 │       if (match) return Unowned(toAttributes(match, acct));
  236 │       return undefined;
  237 │     }),

0.80 packages/alchemy/src/Cloudflare/MagicNetworkMonitoring/Rule.ts:401:5
  398 │ const findByName = (accountId: string, name: string) =>
  399 │   mnm
  400 │     .listRules({ accountId })
> 401 │     .pipe(
  402 │       Effect.map((response) =>
  403 │         (response.result ?? []).find(
  404 │           (rule): rule is NonNullable<typeof rule> => rule?.name === name,
  405 │         ),
  406 │       ),
  407 │     );

0.80 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/Certificate.ts:321:5
  318 │ // adopting a certificate that is on its way out.
  319 │ const findByContent = (zoneId: string, certificate: string) =>
  320 │   Effect.gen(function* () {
> 321 │     const list = yield* originTls.listOriginTlsClientAuths({ zoneId });
  322 │     // Cloudflare returns `result: null` (not `[]`) for a zone whose cert store
  323 │     // is empty — treat it as no matches.
  324 │     return (list.result ?? []).find(
  325 │       (c) =>
  326 │         isLive(c.status) &&
  327 │         normalizePem(c.certificate ?? "") === normalizePem(certificate),
  328 │     );
  329 │   });

0.80 packages/alchemy/src/Prisma/Internal/DeploymentIdentity.ts:20:5
  17 │   const deployments: GetServiceDeploymentsResponse["data"][number][] = [];
  18 │   let cursor: string | undefined;
  19 │   while (true) {
> 20 │     const page = yield* getServiceDeployments(
  21 │       cursor === undefined
  22 │         ? { serviceId: appId }
  23 │         : { serviceId: appId, cursor },
  24 │     );
  25 │     deployments.push(...page.data);
  26 │     const nextCursor = page.pagination.nextCursor;
  27 │     if (!page.pagination.hasMore) break;
  28 │     if (nextCursor === null) {
  29 │       return yield* Effect.fail(
  30 │         new PrismaPaginationError({
  31 │           message:
  32 │             "Invalid Prisma Management API pagination response from getServiceDeployments: hasMore was true without a non-empty nextCursor",
  33 │         }),
  34 │       );
  35 │     }
  36 │     cursor = nextCursor;
  37 │   }

0.80 packages/alchemy/test/AWS/AutoScaling/TestNetwork.ts:20:3
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

0.80 packages/alchemy/test/Cloudflare/WorkersForPlatforms/fixtures/async-platform-handler.ts:24:5
  12 │ export default {
  13 │   async fetch(
  14 │     request: Request,
  15 │     env: AsyncPlatformWorkerEnv,
  16 │   ): Promise<Response> {
  17 │     const url = new URL(request.url);
  18 │     const match = url.pathname.match(/^\/dispatch\/([^/]+)(\/.*)?$/);
  19 │     if (!match) {
  20 │       return new Response("async-platform-worker ok");
  21 │     }
  22 │     const [, scriptName, rest] = match;
  23 │     const userWorker = env.DISPATCH.get(scriptName);
> 24 │     return userWorker.fetch(
  25 │       new Request(`https://user-worker${rest ?? "/"}`, {
  26 │         headers: { "x-custom": request.headers.get("x-custom") ?? "" },
  27 │       }),
  28 │     );
  29 │   },
  30 │ };

0.80 packages/alchemy/test/Fly/fixtures/postgres-api.ts:52:9
  44 │     return {
  45 │       fetch: Effect.gen(function* () {
  46 │         const request = yield* HttpServerRequest;
  47 │         const path = new URL(request.url, "http://service").pathname;
  48 │         if (path === "/ping") {
  49 │           return yield* HttpServerResponse.json({ ok: true });
  50 │         }
  51 │         const client = path === "/direct" ? direct : db;
> 52 │         const result = yield* Effect.result(client.execute("select 1 as ok"));
  53 │         if (Result.isFailure(result)) {
  54 │           const error = result.failure;
  55 │           return yield* HttpServerResponse.json(
  56 │             {
  57 │               ok: false,
  58 │               error:
  59 │                 error instanceof Error
  60 │                   ? `${error.name}: ${error.message}`
  61 │                   : String(error),
  62 │             },
  63 │             { status: 500 },
  64 │           );
  65 │         }
  66 │         const rows = result.success;
  67 │         if (path === "/health" || path === "/direct" || path === "/") {
  68 │           return yield* HttpServerResponse.json({ rows });
  69 │         }
  70 │         return yield* HttpServerResponse.json({ rows }, { status: 404 });
  71 │       }),
  72 │     };

0.80 packages/cloudflare-runtime/src/core/bindings/queue/QueueBroker.worker.ts:384:5
  364 │   private async sendToDeadLetterQueue(
  365 │     deadLetterQueue: string,
  366 │     messages: Array<QueueMessage>,
  367 │   ): Promise<void> {
  368 │     const binding = this.env[BINDING_QUEUE_DLQ(deadLetterQueue)] as
  369 │       | Fetcher
  370 │       | undefined;
  371 │     if (binding === undefined) {
  372 │       console.warn(
  373 │         `Cannot move messages on queue "${this.queueName}" to dead letter queue "${deadLetterQueue}": no binding configured`,
  374 │       );
  375 │       return;
  376 │     }
  377 │     const request: QueueBatchRequest = { messages: messages.map(serialize) };
  378 │     const response = await binding.fetch("http://placeholder/batch", {
  379 │       method: "POST",
  380 │       headers: {
  381 │         "Content-Type": "application/json",
  382 │       },
  383 │       body: JSON.stringify(request),
> 384 │     });
  385 │     if (!response.ok) {
  386 │       console.warn(
  387 │         `Failed to move messages on queue "${this.queueName}" to dead letter queue "${deadLetterQueue}": HTTP ${response.status}`,
  388 │       );
  389 │     }
  390 │   }

0.80 packages/cloudflare-runtime/src/core/internal/shared.worker.ts:284:5
  257 │   for (let i = 0; i < ranges.length; i++) {
  258 │     const range = ranges[i];
  259 │     const writer = writable.getWriter();
  260 │     // If this isn't the first thing we've written, we'll need to prepend CRLF
  261 │     if (i > 0) await writer.write(ENCODER.encode("\r\n"));
  262 │     // Write boundary and headers
  263 │     await writer.write(ENCODER.encode(`--${boundary}\r\n`));
  264 │     if (contentType !== undefined) {
  265 │       await writer.write(ENCODER.encode(`Content-Type: ${contentType}\r\n`));
  266 │     }
  267 │     const start = range.start;
  268 │     const end = Math.min(range.end, contentLength - 1);
  269 │     await writer.write(
  270 │       ENCODER.encode(
  271 │         `Content-Range: bytes ${start}-${end}/${contentLength}\r\n\r\n`,
  272 │       ),
  273 │     );
  274 │     writer.releaseLock();
  275 │     // Fetch and write the range
  276 │     const res = await fetcher.fetch(url, { headers: rangeHeaders(range) });
  277 │     assert(
  278 │       res.ok && res.body !== null,
  279 │       `Failed to fetch ${url}[${range.start},${range.end}], received ${res.status} ${res.statusText}`,
  280 │     );
  281 │     // If we specified a range, but received full content, make sure the range
  282 │     // covered the full content
  283 │     if (res.status !== 206) assertFullRangeRequest(range, contentLength);
> 284 │     await res.body.pipeTo(writable, { preventClose: true });
  285 │   }
  286 │   // Finished writing all ranges, now write the trailer
  287 │   const writer = writable.getWriter();

0.80 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:30:11
  24 │     const usesAccessCache = yield* Cache.make({
  25 │       // Intentional: probe failures (timeout, DNS, network blip) are coerced
  26 │       // to "domain does not use Access" so we don't pop a login prompt for
  27 │       // every transient hiccup. This mirrors workers-sdk's behavior.
  28 │       lookup: (domain: string) =>
  29 │         Effect.promise((signal) =>
> 30 │           fetch(`https://${domain}`, { redirect: "manual", signal }),
  31 │         ).pipe(
  32 │           Effect.map(
  33 │             (response) =>
  34 │               response.status === 302 &&
  35 │               (response.headers
  36 │                 .get("location")
  37 │                 ?.includes("cloudflareaccess.com") ??
  38 │                 false),
  39 │           ),
  40 │           Effect.timeout(1000),
  41 │           Effect.orElseSucceed(() => false),
  42 │         ),
  43 │       capacity: Infinity,
  44 │     });

0.80 packages/floci/src/index.ts:246:7
  243 │ ): Effect.Effect<void, FlociError> =>
  244 │   Effect.tryPromise({
  245 │     try: async (signal) => {
> 246 │       const res = await fetch(`${endpoint}/_floci/health`, { signal });
  247 │       if (!res.ok) {
  248 │         throw new Error(`health returned ${res.status}`);
  249 │       }
  250 │     },
  251 │     catch: (cause) =>
  252 │       new FlociError({
  253 │         message: `floci health check failed: ${String(cause)}`,
  254 │         cause,
  255 │       }),
  256 │   });

0.79 packages/alchemy/src/AWS/AuditManager/Assessment.ts:222:3
  221 │ const findAssessmentByName = Effect.fn(function* (name: string) {
> 222 │   const pages = yield* auditmanager.listAssessments
  223 │     .pages({})
  224 │     .pipe(EffectStream.runCollect);
  225 │   const match = Array.from(pages)
  226 │     .flatMap((page) => page.assessmentMetadata ?? [])
  227 │     .find(
  228 │       (assessment) =>
  229 │         unredact(assessment.name) === name && assessment.status !== "INACTIVE",
  230 │     );
  231 │   if (!match?.id) return undefined;
  232 │   return yield* readAssessmentById(match.id);
  233 │ });

0.79 packages/alchemy/src/AWS/DAX/ParameterGroup.ts:106:11
  102 │       const readParameters = Effect.fn(function* (name: string) {
  103 │         const values: Record<string, string> = {};
  104 │         let nextToken: string | undefined;
  105 │         for (let page = 0; page < 20; page++) {
> 106 │           const response = yield* dax.describeParameters({
  107 │             ParameterGroupName: name,
  108 │             NextToken: nextToken,
  109 │           });
  110 │           for (const parameter of response.Parameters ?? []) {
  111 │             if (
  112 │               parameter.ParameterName !== undefined &&
  113 │               parameter.ParameterValue !== undefined
  114 │             ) {
  115 │               values[parameter.ParameterName] = parameter.ParameterValue;
  116 │             }
  117 │           }
  118 │           nextToken = response.NextToken;
  119 │           if (!nextToken) break;
  120 │         }
  121 │         return values;
  122 │       });

0.79 packages/alchemy/src/AWS/PinpointSMSVoiceV2/internal.ts:26:5
  24 │ export const readSmsVoiceTags = Effect.fn(function* (arn: string) {
  25 │   const response = yield* smsvoice
> 26 │     .listTagsForResource({ ResourceArn: arn })
  27 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  28 │   return toTagRecord(response?.Tags);
  29 │ });

0.79 packages/alchemy/src/Cloudflare/AI/LanguageModel.ts:90:11
   87 │     ): Effect.Effect<Response, AiError.AiError> =>
   88 │       Effect.tryPromise({
   89 │         try: () =>
>  90 │           ai.run(
   91 │             model as keyof AiModels,
   92 │             body as unknown as AiModels[keyof AiModels]["inputs"],
   93 │             {
   94 │               ...(gatewayId === undefined
   95 │                 ? {}
   96 │                 : { gateway: { id: gatewayId } }),
   97 │               returnRawResponse: true,
   98 │             },
   99 │           ),
  100 │         catch: (cause) => toAiError(cause, method),
  101 │       });

0.79 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:330:11
> 330 │           const response = yield* http.execute(request).pipe(
  331 │             Effect.mapError(
  332 │               () =>
  333 │                 new ContainerRegistryError({
  334 │                   reason: "ManifestRequestFailed",
  335 │                   message: "Failed to resolve the container registry digest",
  336 │                   imageRef,
  337 │                 }),
  338 │             ),
  339 │           );

0.79 packages/alchemy/src/Cloudflare/D1/QueryDatabaseHttpClient.ts:82:7
  73 │ const runQuery = (
  74 │   auth: D1Auth,
  75 │   databaseId: string,
  76 │   body:
  77 │     | { sql: string; params?: unknown[] }
  78 │     | { batch: { sql: string; params?: unknown[] }[] },
  79 │ ): Promise<d1.QueryDatabaseResponse> =>
  80 │   auth
  81 │     .authorize(
> 82 │       d1.queryDatabase({
  83 │         accountId: auth.accountId,
  84 │         databaseId,
  85 │         ...(body as any),
  86 │       }),
  87 │     )
  88 │     .pipe(Effect.runPromise);

0.79 packages/alchemy/src/Cloudflare/Snippets/Snippet.ts:248:7
  247 │     delete: Effect.fn(function* ({ output }) {
> 248 │       yield* snippets
  249 │         .deleteSnippet({
  250 │           zoneId: output.zoneId,
  251 │           snippetName: output.name,
  252 │         })
  253 │         // A snippet can only be deleted once no snippet rule references it.
  254 │         // The engine deletes referencing `SnippetRules` first (dependency
  255 │         // edge via `snippetName`), but the rule removal is eventually
  256 │         // consistent — Cloudflare may still report `snippet is still used`
  257 │         // for a short window. Bounded-retry that lag before giving up.
  258 │         .pipe(
  259 │           Effect.retry({
  260 │             while: (e) => e._tag === "SnippetInUse",
  261 │             schedule: Schedule.max([
  262 │               Schedule.exponential("1 second"),
  263 │               Schedule.recurs(8),
  264 │             ]),
  265 │           }),
  266 │           Effect.catchTag("SnippetNotFound", () => Effect.void),
  267 │         );
  268 │     }),

0.79 packages/alchemy/src/Cloudflare/Workers/SqlMigrationsApply.ts:28:11
  23 │   const executor: SqlExecutor = {
  24 │     dialect: "sqlite",
  25 │     query: (sql, params = []) =>
  26 │       Effect.try({
  27 │         try: () =>
> 28 │           storage.sql.exec(inlineSqlParams(sql, params, "sqlite")).toArray(),
  29 │         catch: (cause) =>
  30 │           new MigrationError({
  31 │             message: "Failed to query migration history",
  32 │             cause,
  33 │           }),
  34 │       }),
  35 │     batch: (statements) =>
  36 │       Effect.try({
  37 │         try: () =>
  38 │           storage.transactionSync(() => {
  39 │             for (const statement of statements) storage.sql.exec(statement);
  40 │           }),
  41 │         catch: (cause) =>
  42 │           new MigrationError({
  43 │             message: "Failed to apply SQL migration",
  44 │             cause,
  45 │           }),
  46 │       }),
  47 │   };

0.79 packages/alchemy/src/GitHub/Repository.ts:663:15
  659 │       if (output?.repoId !== undefined) {
  660 │         const current = yield* Effect.tryPromise({
  661 │           try: async () => {
  662 │             try {
> 663 │               const { data } = await octokit.request("GET /repositories/{id}", {
  664 │                 id: output.repoId,
  665 │               });
  666 │               return data;
  667 │             } catch (error: any) {
  668 │               if (error.status === 404) return undefined;
  669 │               throw error;
  670 │             }
  671 │           },
  672 │           catch: (e) => e as Error,
  673 │         });
  674 │         if (current !== undefined) {
  675 │           owner = current.owner.login;
  676 │           repo = current.name;
  677 │         }
  678 │       }

0.79 packages/alchemy/src/Hetzner/FloatingIpAssignment.ts:148:3
  147 │ const getById = (id: number) =>
> 148 │   Hetzner.floatingIps.getFloatingIp({ id }).pipe(
  149 │     Effect.map(({ floating_ip }) => floating_ip),
  150 │     Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  151 │   );

0.79 packages/alchemy/src/Neon/Website/Artifact.ts:141:5
  139 │     const metadataResponse = yield* client.get(
  140 │       `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`,
> 141 │     );
  142 │     const metadata = (yield* metadataResponse.json) as PackageManifest & {
  143 │       dist?: { integrity?: string; tarball?: string };
  144 │     };

0.79 packages/alchemy/src/Prisma/ORM/Migrate.ts:161:11
  158 │           // from the database's current marker. An empty path means the marker is
  159 │           // at the on-disk graph head; otherwise the first pending package's
  160 │           // `from` IS the marker ("empty" = database was never initialized).
> 161 │           const show = yield* runPrismaCli<MigrateShowResult>(
  162 │             [
  163 │               "db",
  164 │               "migrate",
  165 │               "--show",
  166 │               "--db",
  167 │               urlValue(olds.url),
  168 │               "--config",
  169 │               resolveConfig(olds),
  170 │             ],
  171 │             { cwd: configDir(olds) },
  172 │           ).pipe(
  173 │             // An unreachable database is not evidence the resource is gone —
  174 │             // keep the last observed state rather than failing refresh.
  175 │             Effect.catchTag("Prisma.CliError", () => Effect.succeed(undefined)),
  176 │           );

0.79 packages/alchemy/test/AWS/ApplicationAutoScaling/handler.ts:72:7
  69 │     const describeScalingActivities =
  70 │       yield* ApplicationAutoScaling.DescribeScalingActivities(target);
  71 │     const getPredictiveScalingForecast =
> 72 │       yield* ApplicationAutoScaling.GetPredictiveScalingForecast(policy);

0.79 packages/alchemy/test/Cloudflare/VpcService/fixtures/vpc-local-worker.ts:21:9
  11 │ export default {
  12 │   fetch: async (request: Request, env: Env) => {
  13 │     const url = new URL(request.url);
  14 │     const binding = env[url.searchParams.get("binding") ?? "VPC"];
  15 │     if (url.pathname === "/type") {
  16 │       return Response.json({ type: typeof binding?.fetch });
  17 │     }
  18 │     if (url.pathname === "/proxy") {
  19 │       const target = url.searchParams.get("url") ?? "http://vpc/";
  20 │       try {
> 21 │         const res = await binding!.fetch(target, {
  22 │           signal: AbortSignal.timeout(10_000),
  23 │         });
  24 │         return Response.json({ status: res.status, body: await res.text() });
  25 │       } catch (e) {
  26 │         return Response.json({ error: String(e) });
  27 │       }
  28 │     }
  29 │     return new Response("not found", { status: 404 });
  30 │   },
  31 │ };

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/worker.ts:63:13
  39 │       fetch: Effect.gen(function* () {
  40 │         const request = yield* HttpServerRequest;
  41 │
  42 │         if (request.url.startsWith("/workflow/start/")) {
  43 │           const id = Number(request.url.split("/workflow/start/")[1] ?? "1");
  44 │           const instance = yield* workflow.create({
  45 │             params: { id, name: `widget-${id}` },
  46 │           });
  47 │           return yield* HttpServerResponse.json({ instanceId: instance.id });
  48 │         }
  49 │
  50 │         if (request.url.startsWith("/workflow/status/")) {
  51 │           const instanceId = request.url.split("/workflow/status/")[1] ?? "";
  52 │           const instance = yield* workflow.get(instanceId);
  53 │           const status = yield* instance.status();
  54 │           return yield* HttpServerResponse.json(status);
  55 │         }
  56 │
  57 │         if (request.url.startsWith("/query/")) {
  58 │           const id = Number(request.url.split("/query/")[1] ?? "1");
  59 │           const rows = yield* db
  60 │             .select()
  61 │             .from(Widgets)
  62 │             .where(eq(Widgets.id, id))
> 63 │             .pipe(Effect.orDie);
  64 │           return yield* HttpServerResponse.json({ rowCount: rows.length });
  65 │         }
  66 │
  67 │         return HttpServerResponse.text("ok");
  68 │       }),

0.79 packages/alchemy/test/Cloudflare/Workers/fixtures/dynamic-worker-loader/effect-worker.ts:37:21
  29 │         if (request.url.startsWith("/outbound/")) {
  30 │           const worker = yield* loader.load({
  31 │             compatibilityDate: "2026-01-28",
  32 │             mainModule: "worker.js",
  33 │             modules: {
  34 │               "worker.js": `export default {
  35 │                 async fetch() {
  36 │                   try {
> 37 │                     const res = await fetch("https://example.com/");
  38 │                     return Response.json({ outbound: "allowed", status: res.status });
  39 │                   } catch (error) {
  40 │                     return Response.json({ outbound: "blocked", error: String(error) });
  41 │                   }
  42 │                 }
  43 │               }`,
  44 │             },
  45 │             ...(request.url.startsWith("/outbound/sandboxed")
  46 │               ? { globalOutbound: null }
  47 │               : {}),
  48 │           });
  49 │           return yield* worker.fetch(request).pipe(Effect.orDie);
  50 │         }

0.79 packages/frontend-frameworks/src/waku/adapter.ts:200:9
> 200 │         const response = await fetch(
  201 │           server.baseUrl + internalPathToBuildStaticFiles,
  202 │           {
  203 │             headers: { connection: "close" },
  204 │           },
  205 │         );

0.78 packages/alchemy/src/AWS/ApiGateway/DomainName.ts:162:11
  161 │         list: () =>
> 162 │           ag.getDomainNames.pages({}).pipe(
  163 │             Stream.runCollect,
  164 │             Effect.map((chunk) =>
  165 │               Array.from(chunk).flatMap((page) =>
  166 │                 (page.items ?? [])
  167 │                   .filter(
  168 │                     (d): d is ag.DomainName & { domainName: string } =>
  169 │                       d.domainName != null,
  170 │                   )
  171 │                   .map((d) => ({
  172 │                     domainName: d.domainName,
  173 │                     regionalDomainName: d.regionalDomainName,
  174 │                     regionalHostedZoneId: d.regionalHostedZoneId,
  175 │                     distributionDomainName: d.distributionDomainName,
  176 │                     distributionHostedZoneId: d.distributionHostedZoneId,
  177 │                     domainNameArn: d.domainNameArn,
  178 │                     tags: tagRecord(d.tags),
  179 │                   })),
  180 │               ),
  181 │             ),
  182 │           ),

0.78 packages/alchemy/src/AWS/DocDB/Mongo.ts:125:13
  112 │     Effect.gen(function* () {
  113 │       const info = yield* connection;
  114 │       const client = yield* Effect.acquireRelease(
  115 │         Effect.tryPromise({
  116 │           try: async () => {
  117 │             const { MongoClient } = await importMongodb();
  118 │             return new MongoClient(Redacted.value(info.url), {
  119 │               ...(options?.ca !== undefined
  120 │                 ? // A caller-supplied CA restores full identity verification
  121 │                   // (overriding the URL's tlsAllowInvalidCertificates).
  122 │                   { ca: options.ca, tlsAllowInvalidCertificates: false }
  123 │                 : {}),
  124 │               ...options?.clientOptions,
> 125 │             }).connect();
  126 │           },
  127 │           catch: (cause) => new MongoError({ cause }),
  128 │         }),
  129 │         (client) => Effect.promise(() => client.close().catch(() => {})),
  130 │       );
  131 │       const db = client.db(options?.database ?? info.database);
  132 │       const use = <T>(fn: (db: Db, client: MongoClient) => Promise<T>) =>
  133 │         Effect.tryPromise({
  134 │           try: () => fn(db, client),
  135 │           catch: (cause) => new MongoError({ cause }),
  136 │         });
  137 │       return { client, db, use } satisfies MongoClusterClient;
  138 │     }),

0.78 packages/alchemy/src/Cloudflare/Addressing/BgpPrefix.ts:281:9
  276 │     delete: Effect.fn(function* ({ output }) {
  277 │       // No delete API exists — BGP prefixes live as long as the parent
  278 │       // BYOIP prefix. Withdraw the advertisement (best effort) and drop
  279 │       // the state.
  280 │       if (output.onDemand.advertised) {
> 281 │         yield* addressing
  282 │           .patchPrefixBgpPrefix({
  283 │             accountId: output.accountId,
  284 │             prefixId: output.prefixId,
  285 │             bgpPrefixId: output.bgpPrefixId,
  286 │             onDemand: { advertised: false },
  287 │           })
  288 │           .pipe(
  289 │             Effect.catchTag(
  290 │               ["BgpPrefixNotFound", "PrefixNotFound"],
  291 │               () => Effect.void,
  292 │             ),
  293 │           );
  294 │       }
  295 │     }),

0.78 packages/alchemy/src/Cloudflare/ApiShield/Operation.ts:282:3
  281 │ const getOperation = (zoneId: string, operationId: string) =>
> 282 │   apiGateway.getOperation({ zoneId, operationId }).pipe(
  283 │     Effect.map((op): ObservedOperation | undefined => op),
  284 │     Effect.catchTag("OperationNotFound", () => Effect.succeed(undefined)),
  285 │   );

0.78 packages/alchemy/src/Cloudflare/OriginTlsClientAuth/HostnameCertificate.ts:221:9
  218 │       //    deletion) to the list+content match so we recover from
  219 │       //    out-of-band deletes and partial state persistence.
  220 │       let observed = output?.certificateId
> 221 │         ? yield* observeById(zoneId, output.certificateId)
  222 │         : yield* findByContent(zoneId, news.certificate);

0.78 packages/alchemy/src/Cloudflare/Tunnel/Tunnel.ts:359:11
  356 │       const { accountId } = yield* yield* CloudflareEnvironment;
  357 │       if (output?.tunnelId) {
  358 │         return yield* zeroTrust
> 359 │           .getTunnelCloudflared({
  360 │             accountId: output.accountId,
  361 │             tunnelId: output.tunnelId,
  362 │           })

0.78 packages/alchemy/src/Fly/Website/AssetDeployment.ts:163:5
  151 │ const listObserved = (
  152 │   scope: {
  153 │     bucketName: string;
  154 │     accessKeyId: string;
  155 │     secretAccessKey: string;
  156 │     endpoint: string;
  157 │     region: RegionName;
  158 │   },
  159 │   prefix: string,
  160 │ ) =>
  161 │   withTigris(
  162 │     scope,
> 163 │     s3.listObjectsV2
  164 │       .pages({
  165 │         Bucket: scope.bucketName,
  166 │         Prefix: prefix.length > 0 ? `${prefix}/` : undefined,
  167 │       })
  168 │       .pipe(
  169 │         Stream.flatMap((page) => Stream.fromIterable(page.Contents ?? [])),
  170 │         Stream.runFold(
  171 │           () => new Map<string, string | undefined>(),
  172 │           (observed, object) => {
  173 │             if (object.Key !== undefined) {
  174 │               observed.set(object.Key, object.ETag);
  175 │             }
  176 │             return observed;
  177 │           },
  178 │         ),
  179 │       ),
  180 │   );

0.78 packages/alchemy/src/Git/Jobs/Compact.ts:352:9
  349 │     const packs: Array<{ id: string; count: number; size: number }> = [];
  350 │     for (const row of rows) {
  351 │       const meta = yield* runR2(`merge head ${row.pack_id}`)(
> 352 │         options.blobs.head(packKeyOf(options.repoId, row.pack_id)),
  353 │       );
  354 │       // A pack R2 lost (or a crash orphaned) cannot be merged; skip it —
  355 │       // reads through it will surface the real error on their own path.
  356 │       if (meta !== null) {
  357 │         packs.push({ id: row.pack_id, count: row.n, size: meta.size });
  358 │       }
  359 │     }

0.78 packages/alchemy/src/GitHub/Variable.ts:223:17
  217 │       const perRepo = yield* Effect.forEach(
  218 │         repos,
  219 │         (repo) =>
  220 │           Effect.tryPromise({
  221 │             try: async () => {
  222 │               try {
> 223 │                 const variables = await octokit.paginate(
  224 │                   octokit.rest.actions.listRepoVariables,
  225 │                   {
  226 │                     owner: repo.owner.login,
  227 │                     repo: repo.name,
  228 │                     per_page: 100,
  229 │                   },
  230 │                 );
  231 │                 return variables.map((v) => ({ updatedAt: v.updated_at }));
  232 │               } catch (error: any) {
  233 │                 // Repos with Actions disabled, or where the token lacks the
  234 │                 // `repo`/`actions` scope, reject the variables endpoint with
  235 │                 // 403/404 — skip them per the per-item not-found rule rather
  236 │                 // than failing the whole enumeration.
  237 │                 if (error.status === 403 || error.status === 404) {
  238 │                   return [];
  239 │                 }
  240 │                 throw error;
  241 │               }
  242 │             },
  243 │             catch: (e) => e as Error,
  244 │           }),
  245 │         { concurrency: 10 },
  246 │       );

0.78 packages/alchemy/src/Hetzner/Certificate.ts:278:5
  272 │ const observe = Effect.fn(function* (input: {
  273 │   id?: number;
  274 │   name?: string;
  275 │   logicalId: string;
  276 │ }) {
  277 │   if (input.id !== undefined) {
> 278 │     const byId = yield* getById(input.id);
  279 │     if (byId !== undefined) return byId;
  280 │   }
  281 │   if (input.name !== undefined) {
  282 │     const byName = yield* findByName(input.name);
  283 │     if (byName !== undefined) return byName;
  284 │   }
  285 │   const internal = yield* createInternalLabels(input.logicalId);
  286 │   return yield* findByLabels(internal);
  287 │ });

0.78 packages/alchemy/src/Hetzner/PrimaryIp.ts:321:9
  318 │     nuke: { dependsOn: ["Hetzner.Server"] },
  319 │     list: Effect.fn(function* () {
  320 │       const items = yield* Hetzner.primaryIps.listPrimaryIps
> 321 │         .items({ label_selector: alchemyStackSelector, per_page: 50 })
  322 │         .pipe(
  323 │           Stream.runCollect,
  324 │           Effect.map((chunk) => Array.from(chunk)),
  325 │         );
  326 │       return items.map((ip) => toAttrs(ip));
  327 │     }),

0.78 packages/alchemy/src/Prisma/Branch.ts:322:13
  321 │           let branch = branchId
> 322 │             ? yield* getBranch({ branchId }).pipe(
  323 │                 Effect.map((response) => response.data),
  324 │                 Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  325 │               )
  326 │             : undefined;

0.78 packages/alchemy/src/Prisma/SourceRepository.ts:541:15
  531 │             repo = yield* createSourceRepository({
  532 │               projectId,
  533 │               provider: news.provider ?? "github",
  534 │               providerRepositoryId: news.providerRepositoryId,
  535 │               ...(news.installationId === undefined
  536 │                 ? {}
  537 │                 : { installationId: news.installationId }),
  538 │             }).pipe(
  539 │               // A replayed create would link the repository twice; the retry
  540 │               // policy cannot see the request, so opt out explicitly.
> 541 │               Retry.none,
  542 │               Effect.map((response) => response.data),
  543 │               Effect.catchTag("Conflict", () =>
  544 │                 Effect.fail(
  545 │                   new Error(
  546 │                     `Prisma source repository '${news.providerRepositoryId}' appeared after the adoption check. Refusing to take over the project link; rerun with adoption enabled if it is the intended repository.`,
  547 │                   ),
  548 │                 ),
  549 │               ),
  550 │             );

0.78 packages/alchemy/src/Rpc.ts:516:15
  515 │             const response = yield* options
> 516 │               .fetch(request)
  517 │               .pipe(
  518 │                 Effect.mapError(
  519 │                   (cause) => new RpcCallError({ method: prop, cause }),
  520 │                 ),
  521 │               );

0.78 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:241:9
> 241 │         const client = yield* connect;
  242 │         const identity = yield* identify;
  243 │         if (request.url === "/")
  244 │           return yield* HttpServerResponse.json(identity);

0.78 packages/alchemy/test/Planetscale/MySQL/fixtures/hyperdrive-worker.ts:42:11
  41 │         if (request.method === "GET" && url.pathname === "/widgets") {
> 42 │           const widgets = yield* db.select().from(Widgets);
  43 │           return yield* HttpServerResponse.json({ widgets });
  44 │         }

0.78 packages/alchemy/test/Railway/fixtures/postgres-api.ts:37:9
  26 │   Effect.gen(function* () {
  27 │     const conn = yield* Railway.ConnectPostgres(Db);
  28 │     const db = yield* Drizzle.Postgres(conn.connectionString);
  29 │
  30 │     return {
  31 │       fetch: Effect.gen(function* () {
  32 │         const request = yield* HttpServerRequest;
  33 │         const path = new URL(request.url, "http://service").pathname;
  34 │         if (path === "/ping") {
  35 │           return yield* HttpServerResponse.json({ ok: true });
  36 │         }
> 37 │         const rows = yield* db.execute("select 1 as ok", "objects");
  38 │         if (path === "/health" || path === "/") {
  39 │           return yield* HttpServerResponse.json({ rows });
  40 │         }
  41 │         return yield* HttpServerResponse.json({ rows }, { status: 404 });
  42 │       }).pipe(
  43 │         Effect.catch((error) =>
  44 │           HttpServerResponse.json(
  45 │             { ok: false, error: String(error) },
  46 │             { status: 500 },
  47 │           ),
  48 │         ),
  49 │       ),
  50 │     };
  51 │   }).pipe(Effect.provide(Railway.ConnectPostgresHttp)),

0.78 packages/cloudflare-runtime/src/internal/workflows-shared/binding.ts:84:3
  65 │ async function deletePersistedInstance(env: Env, id: string): Promise<void> {
  66 │   if (env.MINIFLARE_LOOPBACK === undefined) {
  67 │     return;
  68 │   }
  69 │
  70 │   const stub = env.ENGINE.get(env.ENGINE.idFromName(id));
  71 │   try {
  72 │     await stub.unsafeAbort();
  73 │   } catch {
  74 │     // Aborting the Durable Object rejects its RPC.
  75 │   }
  76 │
  77 │   const response = await env.MINIFLARE_LOOPBACK.fetch(
  78 │     `http://localhost/core/workflow-storage/${encodeURIComponent(env.WORKFLOW_NAME)}/${stub.id.toString()}?defer=1`,
  79 │     { method: "DELETE" },
  80 │   );
  81 │   if (!response.ok) {
  82 │     throw new Error(`Failed to delete persisted workflow instance '${id}'`);
  83 │   }
> 84 │   await waitForPersistedInstanceDelete(env, id);
  85 │ }

0.78 packages/cloudflare-runtime/src/vite/assets/assets.worker.ts:53:5
  51 │   override async unstable_getByETag(eTag: string) {
  52 │     const url = new URL(eTag, UNKNOWN_HOST);
> 53 │     const response = await this.env.__VITE_FETCH_HTML__.fetch(url);
  54 │     if (!response.body) {
  55 │       throw new Error(`Unexpected error. No HTML found for "${eTag}".`);
  56 │     }
  57 │     return {
  58 │       readableStream: response.body,
  59 │       contentType: "text/html",
  60 │       cacheStatus: "MISS",
  61 │     } as const;
  62 │   }

0.77 packages/alchemy/src/AWS/AppConfig/Extension.ts:205:9
  204 │       const findByName = Effect.fn(function* (name: string) {
> 205 │         const summaries = yield* appconfig.listExtensions
  206 │           .pages({ Name: name })
  207 │           .pipe(
  208 │             Stream.runCollect,
  209 │             Effect.map((chunk) =>
  210 │               Array.from(chunk).flatMap((page) => page.Items ?? []),
  211 │             ),
  212 │           );
  213 │         // listExtensions returns one summary per version — take the latest.
  214 │         const latest = summaries.reduce(
  215 │           (
  216 │             acc: appconfig.ExtensionSummary | undefined,
  217 │             summary: appconfig.ExtensionSummary,
  218 │           ) =>
  219 │             acc === undefined ||
  220 │             (summary.VersionNumber ?? 0) > (acc.VersionNumber ?? 0)
  221 │               ? summary
  222 │               : acc,
  223 │           undefined,
  224 │         );
  225 │         return latest?.Id === undefined
  226 │           ? undefined
  227 │           : yield* readExtension(latest.Id);
  228 │       });

0.77 packages/alchemy/src/AWS/CodeBuild/Project.ts:513:17
  508 │           if (observed === undefined) {
  509 │             const created = yield* retryIamPropagation(
  510 │               codebuild.createProject({ name, ...spec }),
  511 │             ).pipe(
  512 │               Effect.catchTag("ResourceAlreadyExistsException", () =>
> 513 │                 getProject(name).pipe(Effect.map((p) => ({ project: p }))),
  514 │               ),
  515 │             );
  516 │             observed = created.project;
  517 │           }

0.77 packages/alchemy/src/AWS/DataSync/internal.ts:34:3
  32 │ /** Read the observed tags currently attached to a DataSync resource. */
  33 │ export const readObservedTags = Effect.fn(function* (resourceArn: string) {
> 34 │   const res = yield* datasync.listTagsForResource({ ResourceArn: resourceArn });
  35 │   return dsTagsToRecord(res.Tags);
  36 │ });

0.77 packages/alchemy/src/AWS/Neptune/DBClusterParameterGroup.ts:361:11
  355 │         list: () =>
  356 │           // AWS account/region collection: the RDS-family control plane
  357 │           // serves parameter groups for every engine, so keep only families
  358 │           // beginning with `neptune`. Hydrating per-group parameters/tags
  359 │           // would fan out one call per item — mirror `DBSubnetGroup.list` and
  360 │           // emit empty maps instead.
> 361 │           neptune.describeDBClusterParameterGroups.pages({}).pipe(
  362 │             Stream.runCollect,
  363 │             Effect.map((chunk) =>
  364 │               Array.from(chunk).flatMap((page) =>
  365 │                 (page.DBClusterParameterGroups ?? []).flatMap((group) =>
  366 │                   group.DBClusterParameterGroupName &&
  367 │                   group.DBParameterGroupFamily?.startsWith("neptune")
  368 │                     ? [
  369 │                         {
  370 │                           dbClusterParameterGroupName:
  371 │                             group.DBClusterParameterGroupName,
  372 │                           dbClusterParameterGroupArn:
  373 │                             group.DBClusterParameterGroupArn,
  374 │                           family: group.DBParameterGroupFamily,
  375 │                           description: group.Description,
  376 │                           parameters: {} as Record<string, string>,
  377 │                           tags: {} as Record<string, string>,
  378 │                         },
  379 │                       ]
  380 │                     : [],
  381 │                 ),
  382 │               ),
  383 │             ),
  384 │           ),

0.77 packages/alchemy/src/AWS/Omics/Workflow.ts:201:13
  198 │         read: Effect.fn(function* ({ id, output }) {
  199 │           if (output?.workflowId === undefined) return undefined;
  200 │           const found = yield* omics
> 201 │             .getWorkflow({ id: output.workflowId })
  202 │             .pipe(
  203 │               Effect.catchTag("ResourceNotFoundException", () =>
  204 │                 Effect.succeed(undefined),
  205 │               ),
  206 │             );
  207 │           if (found === undefined || found.id === undefined) return undefined;
  208 │           const attrs = {
  209 │             workflowId: found.id,
  210 │             workflowArn: found.arn!,
  211 │             name: found.name ?? "",
  212 │             status: found.status ?? "",
  213 │           };
  214 │           const tags = yield* fetchOmicsTags(found.arn!);
  215 │           return (yield* hasAlchemyTags(id, tags)) ? attrs : Unowned(attrs);
  216 │         }),

0.77 packages/alchemy/src/AWS/S3Tables/Table.ts:234:11
  218 │       if (table === undefined) {
  219 │         yield* s3tables
  220 │           .createTable({
  221 │             tableBucketARN: tableBucketArn,
  222 │             namespace,
  223 │             name,
  224 │             format: news.format ?? "ICEBERG",
  225 │             metadata: buildMetadata(news),
  226 │           })
  227 │           .pipe(
  228 │             Effect.asVoid,
  229 │             Effect.catchTag("ConflictException", () => Effect.void),
  230 │           );
  231 │         // Eventual consistency: getTable can briefly 404 a table that
  232 │         // createTable just returned.
  233 │         table = yield* s3tables
> 234 │           .getTable({ tableBucketARN: tableBucketArn, namespace, name })
  235 │           .pipe(
  236 │             Effect.retry({
  237 │               while: (e) => e._tag === "NotFoundException",
  238 │               schedule: Schedule.max([
  239 │                 Schedule.exponential(500),
  240 │                 Schedule.recurs(8),
  241 │               ]),
  242 │             }),
  243 │           );
  244 │       }

0.77 packages/alchemy/src/Cloudflare/Pipelines/Sink.ts:501:3
  500 │ const findSinkByName = (accountId: string, name: string) =>
> 501 │   pipelines.listSinks.items({ accountId }).pipe(
  502 │     Stream.runCollect,
  503 │     Effect.map((chunk): ObservedSink | undefined =>
  504 │       Array.from(chunk).find((s) => s.name === name),
  505 │     ),
  506 │   );

0.77 packages/alchemy/src/Cloudflare/Queues/Queue.ts:441:11
  440 │         reconcile: Effect.fn(function* ({ id, news = {}, output }) {
> 441 │           const { accountId } = yield* yield* CloudflareEnvironment;
  442 │           const queue: Queue["Attributes"] = {
  443 │             // Never carry a real (non-`dev:`) id forward onto a local row —
  444 │             // the worker binding would treat it as an `Alchemy.remote()`
  445 │             // queue and fail on the missing producer shim.
  446 │             queueId:
  447 │               output?.queueId && !isLiveId(output.queueId)
  448 │                 ? output.queueId
  449 │                 : generateLocalId(),
  450 │             queueName: yield* createQueueName(id, news.name),
  451 │             accountId: output?.accountId ?? accountId,
  452 │           };
  453 │           MutableHashMap.set(localRuntimeState.queues, queue.queueId, queue);
  454 │           return queue;
  455 │         }),

0.77 packages/alchemy/src/Cloudflare/Rum/Site.ts:291:7
  288 │     // needed.
  289 │     list: Effect.fn(function* () {
  290 │       const { accountId } = yield* yield* CloudflareEnvironment;
> 291 │       return yield* rum.listSiteInfos.pages({ accountId }).pipe(
  292 │         Stream.runCollect,
  293 │         Effect.map((chunk) =>
  294 │           Array.from(chunk).flatMap((page) =>
  295 │             (page.result ?? []).map((site) => toAttributes(site, accountId)),
  296 │           ),
  297 │         ),
  298 │       );
  299 │     }),

0.77 packages/alchemy/src/Cloudflare/WaitingRoom/Settings.ts:186:7
  181 │     reconcile: Effect.fn(function* ({ news, output }) {
  182 │       // Inputs have been resolved to concrete strings by Plan.
  183 │       const zoneId = news.zoneId as string;
  184 │
  185 │       // 1. Observe — the settings singleton always exists.
> 186 │       const observed = yield* waitingRooms.getSetting({ zoneId });
  187 │
  188 │       // 2. Capture — the pre-management value, restored on destroy.
  189 │       const initial =
  190 │         output !== undefined
  191 │           ? output.initialSearchEngineCrawlerBypass
  192 │           : observed.searchEngineCrawlerBypass;
  193 │
  194 │       // 3. Sync — PUT only when the observed value differs.
  195 │       const desired = news.searchEngineCrawlerBypass ?? false;
  196 │       if (observed.searchEngineCrawlerBypass === desired) {
  197 │         return toAttributes(
  198 │           zoneId,
  199 │           observed.searchEngineCrawlerBypass,
  200 │           initial,
  201 │         );
  202 │       }
  203 │       const updated = yield* waitingRooms.putSetting({
  204 │         zoneId,
  205 │         searchEngineCrawlerBypass: desired,
  206 │       });
  207 │       return toAttributes(zoneId, updated.searchEngineCrawlerBypass, initial);
  208 │     }),

0.77 packages/alchemy/src/Cloudflare/Workers/ObservabilityDestination.ts:286:11
  284 │         observed = isObservedDestination(created)
  285 │           ? created
> 286 │           : yield* freshObserved(accountId, created.slug);
  287 │       }

0.77 packages/alchemy/src/GitHub/Collaborator.ts:152:11
  146 │     reconcile: Effect.fn(function* ({ news }) {
  147 │       const octokit = yield* octokitFor(news.baseUrl);
  148 │
  149 │       // Ensure & Sync — PUT is idempotent; creates or updates permission
  150 │       yield* Effect.tryPromise({
  151 │         try: async () => {
> 152 │           await octokit.rest.repos.addCollaborator({
  153 │             owner: news.owner,
  154 │             repo: news.repository,
  155 │             username: news.username,
  156 │             permission: news.permission ?? "push",
  157 │           });
  158 │         },
  159 │         catch: (e) => e as Error,
  160 │       });
  161 │
  162 │       return {
  163 │         username: news.username,
  164 │         permission: news.permission ?? "push",
  165 │       };
  166 │     }),

0.77 packages/alchemy/src/GitHub/Environment.ts:281:11
  278 │       // removed props converge back to their defaults.
  279 │       const environment = yield* Effect.tryPromise({
  280 │         try: async () => {
> 281 │           const { data } = await octokit.rest.repos.createOrUpdateEnvironment({
  282 │             owner: news.owner,
  283 │             repo: news.repository,
  284 │             environment_name: news.name,
  285 │             wait_timer: news.waitTimer ?? 0,
  286 │             prevent_self_review: news.preventSelfReview ?? false,
  287 │             reviewers:
  288 │               reviewers === null || reviewers.length === 0 ? null : reviewers,
  289 │             deployment_branch_policy:
  290 │               news.deploymentBranchPolicy === undefined
  291 │                 ? null
  292 │                 : "protectedBranches" in news.deploymentBranchPolicy
  293 │                   ? { protected_branches: true, custom_branch_policies: false }
  294 │                   : { protected_branches: false, custom_branch_policies: true },
  295 │           });
  296 │           return data;
  297 │         },
  298 │         catch: (e) => e as Error,
  299 │       });

0.77 packages/alchemy/src/GitHub/Milestone.ts:283:13
  280 │       if (observed === undefined) {
  281 │         const { data } = yield* Effect.tryPromise({
  282 │           try: () =>
> 283 │             octokit.rest.issues.createMilestone({
  284 │               owner: news.owner,
  285 │               repo: news.repository,
  286 │               title: news.title,
  287 │               state,
  288 │               description,
  289 │               due_on: dueOn ?? undefined,
  290 │             }),
  291 │           catch: (e) => e as Error,
  292 │         });
  293 │
  294 │         observed = data;
  295 │       }

0.77 packages/alchemy/src/GitHub/Ruleset.ts:482:11
  480 │       const repos = yield* Effect.tryPromise({
  481 │         try: () =>
> 482 │           octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
  483 │             per_page: 100,
  484 │           }),
  485 │         catch: (e) => e as Error,
  486 │       });

0.77 packages/alchemy/src/Hetzner/Network.ts:350:7
  347 │ const observe = (networkId: number | undefined, name: string, id: string) =>
  348 │   Effect.gen(function* () {
  349 │     if (networkId !== undefined) {
> 350 │       const byId = yield* getById(networkId);
  351 │       if (byId) return byId;
  352 │     }
  353 │     const byLabels = yield* findByLabels(yield* createInternalLabels(id));
  354 │     if (byLabels) return byLabels;
  355 │     return yield* findByName(name);
  356 │   });

0.77 packages/alchemy/src/Neon/Bucket.ts:279:9
  277 │       const delta = diffTags(attrs.tags, tags);
  278 │       if (delta.removed.length || delta.upsert.length)
> 279 │         yield* client.putTags(tags).pipe(
  280 │           Effect.catchTag("NoSuchBucket", () =>
  281 │             Effect.gen(function* () {
  282 │               // Inherited buckets are readable before their branch-local configuration exists.
  283 │               yield* Neon.createProjectBranchBucket({
  284 │                 ...apiScope(scope),
  285 │                 name,
  286 │                 access_level: news.access ?? "private",
  287 │               });
  288 │               yield* client.putTags(tags);
  289 │             }),
  290 │           ),
  291 │         );

0.77 packages/alchemy/src/Prisma/Deployment.ts:701:15
  700 │             if (created.uploadUrl && artifact !== undefined) {
> 701 │               yield* uploadArtifact(
  702 │                 created.uploadUrl,
  703 │                 artifact,
  704 │                 news.artifactContentType ?? "application/octet-stream",
  705 │               ).pipe(
  706 │                 Effect.catch((error) =>
  707 │                   cleanupCreatedDeploymentOnFailure(created.id, error),
  708 │                 ),
  709 │               );
  710 │             }

0.77 packages/alchemy/src/Prisma/EnvironmentVariable.ts:441:13
  438 │         delete: Effect.fn(function* ({ output, session }) {
  439 │           if (isPrismaDevId(output.environmentVariableId)) return;
  440 │           const variable = yield* getEnvironmentVariable({
> 441 │             envVarId: output.environmentVariableId,
  442 │           }).pipe(
  443 │             Effect.map((response) => response.data),
  444 │             Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  445 │           );
  446 │           if (!variable) return;
  447 │           yield* ensureVariableIdentity(variable, {
  448 │             projectId: output.projectId,
  449 │             branchId: output.branchId,
  450 │             class: output.class,
  451 │             key: output.key,
  452 │           });
  453 │           if (variable.isManagedBySystem) {
  454 │             // Prisma-owned environment variables are provider-managed system
  455 │             // state and are not deletable through this resource lifecycle.
  456 │             if (session !== undefined) {
  457 │               yield* session.note(
  458 │                 `Skipping direct delete for system-managed Prisma environment variable '${variable.key}'.`,
  459 │               );
  460 │             }
  461 │             return;
  462 │           }
  463 │           yield* deleteEnvironmentVariable({
  464 │             envVarId: variable.id,
  465 │           }).pipe(Effect.catchTag("NotFound", () => Effect.void));
  466 │         }),

0.76 packages/alchemy/src/AWS/AMP/RemoteWriteHttp.ts:31:9
  16 │     makeClient: (send) => (request: RemoteWriteRequest) =>
  17 │       Effect.gen(function* () {
  18 │         const body = yield* Effect.sync(() => {
  19 │           const now = Date.now();
  20 │           const timeseries: EncodableSeries[] = request.timeseries.map(
  21 │             (series) => ({
  22 │               labels: { ...series.labels, __name__: series.name },
  23 │               samples: series.samples.map((sample) => ({
  24 │                 value: sample.value,
  25 │                 timestamp: sample.timestamp ?? now,
  26 │               })),
  27 │             }),
  28 │           );
  29 │           return snappyCompress(encodeWriteRequest(timeseries));
  30 │         });
> 31 │         yield* send({
  32 │           method: "POST",
  33 │           path: "api/v1/remote_write",
  34 │           bytes: {
  35 │             data: body,
  36 │             contentType: "application/x-protobuf",
  37 │             headers: {
  38 │               "content-encoding": "snappy",
  39 │               "x-prometheus-remote-write-version": "0.1.0",
  40 │             },
  41 │           },
  42 │         });
  43 │       }),

0.76 packages/alchemy/src/AWS/CodePipeline/Pipeline.ts:307:11
  302 │       const syncTags = Effect.fn(function* (
  303 │         arn: string,
  304 │         desiredTags: Record<string, string>,
  305 │       ) {
  306 │         const observed = yield* codepipeline
> 307 │           .listTagsForResource({ resourceArn: arn })
  308 │           .pipe(Effect.catch(() => Effect.succeed(undefined)));
  309 │         const { removed, upsert } = diffTags(
  310 │           toTagRecord(observed?.tags),
  311 │           desiredTags,
  312 │         );
  313 │         if (upsert.length > 0) {
  314 │           yield* codepipeline.tagResource({
  315 │             resourceArn: arn,
  316 │             tags: upsert.map(({ Key, Value }) => ({ key: Key, value: Value })),
  317 │           });
  318 │         }
  319 │         if (removed.length > 0) {
  320 │           yield* codepipeline.untagResource({
  321 │             resourceArn: arn,
  322 │             tagKeys: removed,
  323 │           });
  324 │         }
  325 │       });

0.76 packages/alchemy/src/AWS/Credentials.ts:78:7
  75 │   Effect.gen(function* () {
  76 │     const resolve = Effect.gen(function* () {
  77 │       const roleArn = yield* options.roleArn;
> 78 │       const response = yield* sts
  79 │         .assumeRole({
  80 │           RoleArn: roleArn,
  81 │           RoleSessionName: options.roleSessionName ?? "alchemy",
  82 │         })
  83 │         .pipe(
  84 │           // A freshly-created IAM user/role/access-key is eventually
  85 │           // consistent: the first `AssumeRole` calls can fail with
  86 │           // `AccessDenied` until the trust policy + permissions propagate.
  87 │           // Retry those for up to ~30s.
  88 │           Effect.retry({
  89 │             while: (error) =>
  90 │               (error as { name?: string }).name === "AccessDeniedException" ||
  91 │               (error as { _tag?: string })._tag === "AccessDeniedException",
  92 │             schedule: Schedule.exponential("1 second"),
  93 │             times: 8,
  94 │           }),
  95 │         );

0.76 packages/alchemy/src/AWS/EC2/RouteTableAssociation.ts:341:15
  332 │         delete: Effect.fn(function* ({ output, session }) {
  333 │           yield* session.note(
  334 │             `Deleting route table association: ${output.associationId}`,
  335 │           );
  336 │
  337 │           // Disassociate the route table
  338 │           yield* ec2
  339 │             .disassociateRouteTable({
  340 │               AssociationId: output.associationId,
> 341 │               DryRun: false,
  342 │             })
  343 │             .pipe(
  344 │               Effect.tapError(Effect.log),
  345 │               Effect.catchTag(
  346 │                 "InvalidAssociationID.NotFound",
  347 │                 () => Effect.void,
  348 │               ),
  349 │             );
  350 │
  351 │           yield* session.note(
  352 │             `Route table association ${output.associationId} deleted successfully`,
  353 │           );
  354 │         }),

0.76 packages/alchemy/src/AWS/EventBridge/EventBus.ts:284:11
  281 │           // Sync mutable bus configuration — `updateEventBus` overwrites
  282 │           // `description`, KMS key, DLQ, and log config in one shot, so we
  283 │           // call it unconditionally (idempotent for matching values).
> 284 │           yield* eventbridge.updateEventBus({
  285 │             Name: eventBusName,
  286 │             Description: news.description,
  287 │             KmsKeyIdentifier: news.kmsKeyIdentifier as string | undefined,
  288 │             DeadLetterConfig: news.deadLetterConfig
  289 │               ? { Arn: news.deadLetterConfig.Arn as string | undefined }
  290 │               : undefined,
  291 │             LogConfig: news.logConfig,
  292 │           });

0.76 packages/alchemy/src/AWS/IAM/Role.ts:724:11
> 724 │           yield* iam
  725 │             .deleteRole({
  726 │               RoleName: output.roleName,
  727 │             })
  728 │             .pipe(
  729 │               Effect.retry({
  730 │                 while: (error) =>
  731 │                   error._tag === "ConcurrentModificationException" ||
  732 │                   error._tag === "DeleteConflictException" ||
  733 │                   error._tag === "LimitExceededException" ||
  734 │                   error._tag === "ServiceFailureException",
  735 │                 schedule: Schedule.max([
  736 │                   Schedule.exponential("250 millis"),
  737 │                   Schedule.recurs(8),
  738 │                 ]),
  739 │               }),
  740 │               Effect.catchTag("NoSuchEntityException", () => Effect.void),
  741 │             );

0.76 packages/alchemy/src/AWS/IVSRealtime/internal.ts:25:5
  23 │ export const readIvsRealtimeTags = Effect.fn(function* (arn: string) {
  24 │   const response = yield* ivsrealtime
> 25 │     .listTagsForResource({ resourceArn: arn })
  26 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  27 │   return toTagRecord(response?.tags);
  28 │ });

0.76 packages/alchemy/src/AWS/IdentityCenter/common.ts:37:3
  36 │ export const listInstances = Effect.fn(function* () {
> 37 │   return yield* ssoAdmin.listInstances
  38 │     .items({
  39 │       MaxResults: 100,
  40 │     })
  41 │     .pipe(
  42 │       Stream.runCollect,
  43 │       Effect.map(
  44 │         (instances) => Array.from(instances) as ssoAdmin.InstanceMetadata[],
  45 │       ),
  46 │     );
  47 │ });

0.76 packages/alchemy/src/AWS/MediaLive/InputSecurityGroup.ts:121:11
  118 │       /** Describe by id; typed not-found (or tombstone state) → undefined. */
  119 │       const getGroup = Effect.fn(function* (id: string) {
  120 │         const isg = yield* medialive
> 121 │           .describeInputSecurityGroup({ InputSecurityGroupId: id })
  122 │           .pipe(
  123 │             Effect.catchTag("NotFoundException", () =>
  124 │               Effect.succeed(undefined),
  125 │             ),
  126 │           );
  127 │         if (isg === undefined || isg.State === "DELETED") return undefined;
  128 │         if (!hasIdentity(isg)) return undefined;
  129 │         return isg;
  130 │       });

0.76 packages/alchemy/src/AWS/Route53/HealthCheck.ts:325:21
  319 │                 Effect.catchTag("HealthCheckAlreadyExists", () =>
  320 │                   // Same CallerReference already created it; the engine stores
  321 │                   // output, so on a true re-run output.id observes above. A bare
  322 │                   // race here means we must re-read — but the API gives us no id,
  323 │                   // so fall back to the stored output if present.
  324 │                   output?.id
> 325 │                     ? observe(output.id).pipe(
  326 │                         Effect.flatMap((existing) =>
  327 │                           existing
  328 │                             ? Effect.succeed(existing)
  329 │                             : Effect.die(
  330 │                                 new Error(
  331 │                                   "health check exists but could not be observed",
  332 │                                 ),
  333 │                               ),
  334 │                         ),
  335 │                       )
  336 │                     : Effect.die(
  337 │                         new Error(
  338 │                           "health check already exists for caller reference",
  339 │                         ),
  340 │                       ),
  341 │                 ),

0.76 packages/alchemy/src/AWS/S3Control/StorageLensConfiguration.ts:321:11
  319 │         delete: Effect.fn(function* ({ output }) {
  320 │           const { accountId } = yield* AWSEnvironment.current;
> 321 │           yield* s3control
  322 │             .deleteStorageLensConfiguration({
  323 │               AccountId: accountId,
  324 │               ConfigId: output.configId,
  325 │             })
  326 │             .pipe(
  327 │               // Idempotent delete — already gone is success.
  328 │               Effect.catchTag("NoSuchConfiguration", () => Effect.void),
  329 │             );
  330 │         }),

0.76 packages/alchemy/src/AWS/SES/MultiRegionEndpoint.ts:267:13
  264 │             //    Provisioning is asynchronous: creation returns CREATING and we
  265 │             //    deliberately do NOT wait for READY (that exceeds the polling
  266 │             //    budget; downstream consumers poll if they need readiness).
> 267 │             yield* sesv2
  268 │               .createMultiRegionEndpoint({
  269 │                 EndpointName: name,
  270 │                 Details: {
  271 │                   RoutesDetails: news.regions.map((region) => ({
  272 │                     Region: region,
  273 │                   })),
  274 │                 },
  275 │                 Tags: createTagsList(desiredTags),
  276 │               })
  277 │               .pipe(
  278 │                 Effect.catchTag("AlreadyExistsException", () =>
  279 │                   Effect.succeed({}),
  280 │                 ),
  281 │               );

0.76 packages/alchemy/src/AWS/SimpleDB/Domain.ts:146:13
  136 │         reconcile: Effect.fn(function* ({ id, news, output, session }) {
  137 │           const { accountId, region } = yield* AWSEnvironment.current;
  138 │           const name = output?.domainName ?? (yield* createName(id, news));
  139 │
  140 │           // 1. OBSERVE — cloud state is authoritative
  141 │           const metadata = yield* observeDomain(name);
  142 │
  143 │           // 2. ENSURE — CreateDomain is idempotent (creating an existing
  144 │           //    domain succeeds); wait until the domain is visible.
  145 │           if (metadata === undefined) {
> 146 │             yield* sdb.createDomain({ DomainName: name });
  147 │             yield* retryWhileNoSuchDomain(
  148 │               sdb.domainMetadata({ DomainName: name }),
  149 │             );
  150 │           }
  151 │
  152 │           // 3. SYNC — a domain has no mutable configuration and no tags.
  153 │
  154 │           yield* session.note(name);
  155 │           return {
  156 │             domainName: name,
  157 │             domainArn: domainArn(region, accountId, name),
  158 │           };
  159 │         }),

0.76 packages/alchemy/src/AWS/Textract/Adapter.ts:282:11
> 282 │           yield* session.note(adapterId!);
  283 │           const arn = yield* adapterArn(adapterId!);

0.76 packages/alchemy/src/Cloudflare/Alerting/Silence.ts:220:11
  217 │       //    the silence that won the race.
  218 │       if (!observed) {
  219 │         yield* alerting
> 220 │           .createSilence({
  221 │             accountId,
  222 │             body: [
  223 │               {
  224 │                 policyId,
  225 │                 startTime: news.startTime,
  226 │                 endTime: news.endTime,
  227 │               },
  228 │             ],
  229 │           })
  230 │           .pipe(
  231 │             Effect.catchTag("SilenceAlreadyExists", (error) =>
  232 │               findSilence(
  233 │                 accountId,
  234 │                 policyId,
  235 │                 news.startTime,
  236 │                 news.endTime,
  237 │               ).pipe(
  238 │                 Effect.flatMap((existing) =>
  239 │                   existing ? Effect.void : Effect.fail(error),
  240 │                 ),
  241 │               ),
  242 │             ),
  243 │           );

0.76 packages/alchemy/src/Cloudflare/D1/ApplyMigrations.ts:43:5
  40 │ ): SqlExecutor => ({
  41 │   dialect: "sqlite",
  42 │   query: (sql, params) =>
> 43 │     raw(
  44 │       params && params.length > 0
  45 │         ? inlineSqlParams(sql, params, "sqlite")
  46 │         : sql,
  47 │     ).pipe(
  48 │       Effect.map(
  49 │         (result) =>
  50 │           (result.result[0]?.results ?? []) as Array<Record<string, unknown>>,
  51 │       ),
  52 │       Effect.mapError(
  53 │         (cause) =>
  54 │           new MigrationError({
  55 │             message: `D1 query failed: ${String(cause)}`,
  56 │             cause,
  57 │           }),
  58 │       ),
  59 │     ),

0.76 packages/alchemy/src/Cloudflare/Diagnostics/EndpointHealthcheck.ts:146:9
  141 │     read: Effect.fn(function* ({ id, output, olds }) {
  142 │       const { accountId } = yield* yield* CloudflareEnvironment;
  143 │       const acct = output?.accountId ?? accountId;
  144 │
  145 │       if (output?.healthcheckId) {
> 146 │         const observed = yield* getHealthcheck(acct, output.healthcheckId);
  147 │         if (observed) return toAttributes(observed, acct);
  148 │         return undefined;
  149 │       }
  150 │       // Cold read — recover from lost state by matching the deterministic
  151 │       // physical name. Healthchecks carry no ownership markers, so report
  152 │       // the match as Unowned and let the adopt policy gate takeover.
  153 │       const name = yield* createHealthcheckName(id, olds?.name);
  154 │       const match = yield* findByName(acct, name);
  155 │       if (match) return Unowned(toAttributes(match, acct));
  156 │       return undefined;
  157 │     }),

0.76 packages/alchemy/src/Cloudflare/Pipelines/Stream.ts:296:9
  293 │       // 1. Observe — the cached streamId is a hint, not a guarantee; a
  294 │       //    missing stream falls through to a name lookup and then create.
  295 │       let observed = output?.streamId
> 296 │         ? yield* getStream(output.accountId ?? accountId, output.streamId)
  297 │         : undefined;

0.76 packages/alchemy/src/Fly/PostgresMigrations.ts:130:7
  127 │ export const runSql = (connectionUri: Redacted.Redacted<string>, sql: string) =>
  128 │   withPgClient(connectionUri, (client) =>
  129 │     Effect.tryPromise({
> 130 │       try: () => client.query(sql),
  131 │       catch: toMigrationError,
  132 │     }),
  133 │   ).pipe(Effect.asVoid);

0.76 packages/alchemy/src/Git/Store/ObjectStore.ts:585:7
  581 │     if (object.zdata.byteLength > R2_OFFLOAD_THRESHOLD) {
  582 │       // R2 write FIRST, then the metadata row — a crash between the two
  583 │       // leaves only a harmless content-addressed R2 orphan.
  584 │       const key = objectKey(repoId, object.oid);
> 585 │       yield* runBlob(blobs.put(key, object.zdata), `blob put ${key}`);
  586 │       yield* sql.run(
  587 │         `INSERT OR IGNORE INTO objects (oid, type, size, zsize, location, zdata, r2_key, staged_push)
  588 │            VALUES (?, ?, ?, ?, 'r2', NULL, ?, ?)`,
  589 │         object.oid,
  590 │         object.type,
  591 │         object.size,
  592 │         object.zdata.byteLength,
  593 │         key,
  594 │         pushId,
  595 │       );
  596 │     } else {
  597 │       yield* sql.run(
  598 │         `INSERT OR IGNORE INTO objects (oid, type, size, zsize, location, zdata, staged_push)
  599 │            VALUES (?, ?, ?, ?, 'row', ?, ?)`,
  600 │         object.oid,
  601 │         object.type,
  602 │         object.size,
  603 │         object.zdata.byteLength,
  604 │         toArrayBuffer(object.zdata),
  605 │         pushId,
  606 │       );
  607 │     }

0.76 packages/alchemy/src/GitHub/Comment.ts:199:17
  195 │       const observedId = output?.commentId
  196 │         ? yield* Effect.tryPromise({
  197 │             try: async () => {
  198 │               try {
> 199 │                 const { data } = await octokit.rest.issues.getComment({
  200 │                   owner: news.owner,
  201 │                   repo: news.repository,
  202 │                   comment_id: output.commentId,
  203 │                 });
  204 │                 return data.id;
  205 │               } catch (error: any) {
  206 │                 if (error.status === 404) return undefined;
  207 │                 throw error;
  208 │               }
  209 │             },
  210 │             catch: (e) => e as Error,
  211 │           })
  212 │         : undefined;

0.76 packages/alchemy/src/GitHub/Secret.ts:281:9
  268 │ const deleteSecret = Effect.fn(function* (props: SecretProps) {
  269 │   const octokit = yield* octokitFor(props.baseUrl);
  270 │   const environment = resolveEnvironmentName(props.environment);
  271 │   yield* Effect.tryPromise(async () => {
  272 │     try {
  273 │       if (environment !== undefined) {
  274 │         await octokit.rest.actions.deleteEnvironmentSecret({
  275 │           owner: props.owner,
  276 │           repo: props.repository,
  277 │           environment_name: environment,
  278 │           secret_name: props.name,
  279 │         });
  280 │       } else {
> 281 │         await octokit.rest.actions.deleteRepoSecret({
  282 │           owner: props.owner,
  283 │           repo: props.repository,
  284 │           secret_name: props.name,
  285 │         });
  286 │       }
  287 │     } catch (error: any) {
  288 │       if (error.status !== 404) {
  289 │         throw error;
  290 │       }
  291 │     }
  292 │   });
  293 │ });

0.76 packages/alchemy/src/Neon/Project.ts:681:5
  679 │     const defaultBranch = branches.find((b) => b.default);
  680 │     if (!defaultBranch) return undefined;
> 681 │     const databases = yield* listProjectBranchDatabases({
  682 │       project_id: project.id,
  683 │       branch_id: defaultBranch.id,
  684 │     });

0.76 packages/alchemy/src/Planetscale/Branch.ts:461:9
  445 │       if (!current) {
  446 │         const parent = yield* waitForBranchReady(
  447 │           organization,
  448 │           databaseName,
  449 │           parentBranchName,
  450 │           session,
  451 │         );
  452 │         const parentClusterSize = news.clusterSize
  453 │           ? parent.kind === "postgresql"
  454 │             ? toPostgresClusterSku({
  455 │                 size: news.clusterSize,
  456 │                 region: parent.region.slug,
  457 │               })
  458 │             : news.clusterSize
  459 │           : undefined;
  460 │         yield* session.note("Creating branch...");
> 461 │         current = yield* planetscale.createBranch({
  462 │           organization,
  463 │           database: databaseName,
  464 │           name: desiredBranchName,
  465 │           parent_branch: parentBranchName,
  466 │           backup_id: news.backupId,
  467 │           seed_data: news.seedData,
  468 │           region: news.region?.slug,
  469 │           cluster_size: parentClusterSize,
  470 │         });
  471 │       }

0.76 packages/alchemy/src/Prisma/BucketAccessKey.ts:294:13
  287 │           const created = yield* createBucketKey({
  288 │             bucketId,
  289 │             name: expectedName,
  290 │             role: news.role,
  291 │           }).pipe(
  292 │             // The secret is revealed exactly once, so a replayed create
  293 │             // would leak an unusable key; opt out of the retry policy.
> 294 │             Retry.none,
  295 │             Effect.map((response) => response.data),
  296 │           );

0.76 packages/alchemy/test/AWS/ELBv2/fixtures/acm.ts:36:3
  17 │ export const ensureImportedCert = Effect.fn(function* (
  18 │   domainName: string,
  19 │   certPem: string,
  20 │   keyPem: string,
  21 │ ) {
  22 │   const pages = yield* acm.listCertificates
  23 │     .pages({ CertificateStatuses: ["ISSUED"] })
  24 │     .pipe(
  25 │       Stream.runCollect,
  26 │       Effect.map((chunk) =>
  27 │         Array.from(chunk).flatMap((page) => page.CertificateSummaryList ?? []),
  28 │       ),
  29 │     );
  30 │   const existing = pages.find((c) => c.DomainName === domainName);
  31 │   if (existing?.CertificateArn) {
  32 │     return existing.CertificateArn;
  33 │   }
  34 │   const encode = (pem: string) =>
  35 │     Effect.sync(() => new TextEncoder().encode(pem));
> 36 │   const imported = yield* acm.importCertificate({
  37 │     Certificate: yield* encode(certPem),
  38 │     PrivateKey: yield* encode(keyPem),
  39 │   });
  40 │   if (!imported.CertificateArn) {
  41 │     return yield* Effect.fail(new CertificateImportFailed({ domainName }));
  42 │   }
  43 │   return imported.CertificateArn;
  44 │ });

0.76 packages/alchemy/test/AWS/XRay/handler.ts:301:15
  290 │         if (request.method === "GET" && pathname === "/insight") {
  291 │           // No insight can be provisioned on demand — prove each binding's
  292 │           // IAM grant by observing the API's typed validation error for a
  293 │           // syntactically-plausible but nonexistent insight id (an IAM
  294 │           // failure would surface as AccessDeniedException instead).
  295 │           const insightId =
  296 │             url.searchParams.get("id") ??
  297 │             "00000000-0000-0000-0000-000000000000";
  298 │           return yield* HttpServerResponse.json({
  299 │             getInsight: yield* outcome(getInsight({ InsightId: insightId })),
  300 │             getInsightEvents: yield* outcome(
> 301 │               getInsightEvents({ InsightId: insightId }),
  302 │             ),
  303 │             getInsightImpactGraph: yield* outcome(
  304 │               getInsightImpactGraph({
  305 │                 InsightId: insightId,
  306 │                 StartTime: new Date(now - 60 * 60 * 1000),
  307 │                 EndTime: new Date(now),
  308 │               }),
  309 │             ),
  310 │           });
  311 │         }

0.76 packages/alchemy/test/Cloudflare/AI/fixtures/model-batch.ts:5:7
   1 │ export default {
   2 │   async fetch(request: Request, env: { AI: Ai }) {
   3 │     if (request.method !== "POST") return new Response("ready");
   4 │     try {
>  5 │       const result = await env.AI.run(
   6 │         "@cf/baai/bge-m3",
   7 │         { requests: [{ text: ["Alchemy subscription batch event"] }] },
   8 │         { queueRequest: true },
   9 │       );
  10 │       return Response.json(result);
  11 │     } catch (error) {
  12 │       return Response.json({ error: String(error) }, { status: 500 });
  13 │     }
  14 │   },
  15 │ };

0.76 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-http/worker.ts:71:11
  68 │       PingDO: (payload) =>
  69 │         Effect.gen(function* () {
  70 │           const client = yield* makeDOClient();
> 71 │           const result = yield* client.PingDO(payload);
  72 │           return result;
  73 │         }).pipe(Effect.orDie),

0.76 packages/alchemy/test/Fly/fixtures/transport.ts:215:11
> 215 │           request.end(body);
  216 │         });
  217 │       });

0.76 packages/alchemy/test/Planetscale/Postgres/fixtures/hyperdrive-worker.ts:42:11
  41 │         if (request.method === "GET" && url.pathname === "/widgets") {
> 42 │           const widgets = yield* db.select().from(Widgets);
  43 │           return yield* HttpServerResponse.json({ widgets });
  44 │         }

0.76 packages/frontend-frameworks/fixtures/tanstack-start/src/routes/api.db.ts:8:9
   3 │ export const Route = createFileRoute("/api/db")({
   4 │   server: {
   5 │     handlers: {
   6 │       GET: async () => {
   7 │         const { fetchSql } = await import("../db");
>  8 │         const result = await fetchSql();
   9 │         return Response.json(result);
  10 │       },
  11 │     },
  12 │   },
  13 │ });

0.76 packages/pkg/src/Registry/Tags.ts:35:5
  32 │ export const get = Effect.fn("Tags.get")(function* (pkg: string, tag: string) {
  33 │   const sql = yield* SqlClient.SqlClient;
  34 │   const rows = yield* decodeTags(
> 35 │     yield* sql`SELECT * FROM tags WHERE package = ${pkg} AND tag = ${tag}`,
  36 │   );
  37 │   return rows[0];
  38 │ });

0.75 packages/alchemy/src/AWS/AMP/GetLabelsHttp.ts:24:9
  17 │ export const GetLabelsHttp = Layer.effect(
  18 │   GetLabels,
  19 │   makeAmpWorkspaceHttpBinding({
  20 │     name: "GetLabels",
  21 │     iamActions: ["aps:GetLabels"],
  22 │     makeClient: (send): GetLabelsClient => ({
  23 │       labelNames: (request: GetLabelsRequest = {}) =>
> 24 │         send({
  25 │           method: "GET",
  26 │           path: "api/v1/labels",
  27 │           query: rangeParams(request),
  28 │         }).pipe(Effect.map((data) => data as string[])),
  29 │       labelValues: (request: GetLabelValuesRequest) =>
  30 │         send({
  31 │           method: "GET",
  32 │           path: `api/v1/label/${encodeURIComponent(request.label)}/values`,
  33 │           query: rangeParams(request),
  34 │         }).pipe(Effect.map((data) => data as string[])),
  35 │     }),
  36 │   }),
  37 │ );

0.75 packages/alchemy/src/AWS/BCMDataExports/Export.ts:410:13
  407 │           const observedTags = yield* fetchObservedTags(exportArn);
  408 │           const { upsert, removed } = diffTags(observedTags, desiredTags);
  409 │           if (upsert.length > 0) {
> 410 │             yield* bcm.tagResource({
  411 │               ResourceArn: exportArn,
  412 │               ResourceTags: upsert,
  413 │             });
  414 │           }

0.75 packages/alchemy/src/AWS/CloudFront/Function.ts:167:17
  161 │         list: () =>
  162 │           Effect.gen(function* () {
  163 │             const items: Function["Attributes"][] = [];
  164 │             let marker: string | undefined = undefined;
  165 │             do {
  166 │               const listed: cloudfront.ListFunctionsResult =
> 167 │                 yield* cloudfront.listFunctions({ Marker: marker });
  168 │               for (const summary of listed.FunctionList?.Items ?? []) {
  169 │                 items.push(toAttrs(summary, undefined, summary.Name ?? ""));
  170 │               }
  171 │               marker = listed.FunctionList?.NextMarker;
  172 │             } while (marker);
  173 │             return items;
  174 │           }),

0.75 packages/alchemy/src/AWS/CloudTrail/Trail.ts:381:9
  380 │       const readTrail = (name: string) =>
> 381 │         cloudtrail.getTrail({ Name: name }).pipe(
  382 │           Effect.map((r) => r.Trail),
  383 │           Effect.catchTag("TrailNotFoundException", () =>
  384 │             Effect.succeed(undefined),
  385 │           ),
  386 │         );

0.75 packages/alchemy/src/AWS/DMS/ReplicationSubnetGroup.ts:123:9
  122 │       const findGroup = Effect.fn(function* (identifier: string) {
> 123 │         const response = yield* dms
  124 │           .describeReplicationSubnetGroups({
  125 │             Filters: [
  126 │               { Name: "replication-subnet-group-id", Values: [identifier] },
  127 │             ],
  128 │           })
  129 │           .pipe(
  130 │             Effect.catchTag("ResourceNotFoundFault", () =>
  131 │               Effect.succeed(undefined),
  132 │             ),
  133 │           );
  134 │         return response?.ReplicationSubnetGroups?.[0];
  135 │       });

0.75 packages/alchemy/src/AWS/DataExchange/EventAction.ts:261:13
  258 │           // 3. Sync — the export destination is mutable in place. Only call
  259 │           //    the API on an actual delta.
  260 │           if (!sameAction(eventAction.Action, desiredAction)) {
> 261 │             eventAction = yield* dataexchange.updateEventAction({
  262 │               EventActionId: eventAction.Id!,
  263 │               Action: desiredAction,
  264 │             });
  265 │           }

0.75 packages/alchemy/src/AWS/DataExchange/Revision.ts:110:11
  105 │       const getById = Effect.fn(function* (
  106 │         dataSetId: string,
  107 │         revisionId: string,
  108 │       ) {
  109 │         return yield* dataexchange
> 110 │           .getRevision({ DataSetId: dataSetId, RevisionId: revisionId })
  111 │           .pipe(
  112 │             Effect.catchTag("ResourceNotFoundException", () =>
  113 │               Effect.succeed(undefined),
  114 │             ),
  115 │           );
  116 │       });

0.75 packages/alchemy/src/AWS/Logs/ResourcePolicy.ts:88:9
  85 │       // The account quota is 10 policies per region, so a single describe
  86 │       // call (limit 50) is always exhaustive — no pagination needed.
  87 │       const describeAll = logs
> 88 │         .describeResourcePolicies({ limit: 50 })
  89 │         .pipe(Effect.map((response) => response.resourcePolicies ?? []));

0.75 packages/alchemy/src/AWS/MemoryDB/ParameterGroup.ts:221:13
  220 │           if (changed.length > 0) {
> 221 │             yield* memorydb.updateParameterGroup({
  222 │               ParameterGroupName: name,
  223 │               ParameterNameValues: changed.map(
  224 │                 ([ParameterName, ParameterValue]) => ({
  225 │                   ParameterName,
  226 │                   ParameterValue,
  227 │                 }),
  228 │               ),
  229 │             });
  230 │           }

0.75 packages/alchemy/src/AWS/ResourceExplorer/View.ts:203:13
  201 │         list: () =>
  202 │           Effect.gen(function* () {
> 203 │             const arns = yield* re2.listViews.pages({}).pipe(
  204 │               Stream.runCollect,
  205 │               Effect.map((chunk) =>
  206 │                 Array.from(chunk).flatMap((page) => page.Views ?? []),
  207 │               ),
  208 │             );
  209 │             // A view can vanish between enumeration and hydration — drop it.
  210 │             const items = yield* Effect.forEach(
  211 │               arns,
  212 │               (arn) =>
  213 │                 getViewSafe(arn).pipe(
  214 │                   Effect.map((found) =>
  215 │                     found?.View?.ViewArn
  216 │                       ? toAttrs(
  217 │                           found.View,
  218 │                           found.View.ViewName ?? arn.split("/")[1]!,
  219 │                         )
  220 │                       : undefined,
  221 │                   ),
  222 │                 ),
  223 │               { concurrency: 10 },
  224 │             );
  225 │             return items.filter(
  226 │               (item): item is View["Attributes"] => item !== undefined,
  227 │             );
  228 │           }),

0.75 packages/alchemy/src/Cloudflare/Acm/TotalTls.ts:207:7
  205 │       // 1. Observe — the setting always exists; read its live state.
  206 │       //    (Reads succeed even on zones without the ACM entitlement.)
> 207 │       const observed = yield* acm.getTotalTl({ zoneId });

0.75 packages/alchemy/src/Cloudflare/UrlNormalization/UrlNormalization.ts:212:7
  205 │     reconcile: Effect.fn(function* ({ news }) {
  206 │       // Inputs have been resolved to concrete strings by Plan.
  207 │       const zoneId = news.zoneId as string;
  208 │       const desiredScope = news.scope ?? DEFAULT_SCOPE;
  209 │       const desiredType = news.type ?? DEFAULT_TYPE;
  210 │
  211 │       // 1. Observe — the singleton always exists on a live zone.
> 212 │       const observed = yield* urlNormalization.getUrlNormalization({ zoneId });
  213 │
  214 │       // 2. Sync — PUT is a full replace of { scope, type }; skip the API
  215 │       //    entirely when the observed configuration already matches.
  216 │       if (observed.scope === desiredScope && observed.type === desiredType) {
  217 │         return toAttributes(zoneId, observed);
  218 │       }
  219 │       const updated = yield* urlNormalization.putUrlNormalization({
  220 │         zoneId,
  221 │         scope: desiredScope,
  222 │         type: desiredType,
  223 │       });
  224 │       return toAttributes(zoneId, updated);
  225 │     }),

0.75 packages/alchemy/src/Git/RegistryD1.ts:184:15
  174 │         resolve: Effect.fn(function* (owner: string, name: string) {
  175 │           yield* schema;
  176 │           // Soft-deleted rows ARE returned (with `deletedAt` set) so the
  177 │           // Worker can report `status: "deleting"` rather than a 404 that
  178 │           // would race a re-create against the purge.
  179 │           const row = yield* d1(
  180 │             "resolve",
  181 │             db
  182 │               .prepare(`SELECT * FROM repos WHERE owner = ? AND name = ?`)
  183 │               .bind(owner.toLowerCase(), name.toLowerCase())
> 184 │               .first<RegistryRepoRow>(),
  185 │           );
  186 │           return row === null ? undefined : toEntry(row);
  187 │         }),

0.75 packages/alchemy/src/GitHub/Issue.ts:281:11
  278 │       ) {
  279 │         const issueNumber = data.number;
  280 │         const updated = yield* Effect.tryPromise(() =>
> 281 │           octokit.rest.issues.update({
  282 │             owner: news.owner,
  283 │             repo: news.repository,
  284 │             issue_number: issueNumber,
  285 │             title: news.title,
  286 │             body,
  287 │             state,
  288 │             labels,
  289 │             assignees,
  290 │             milestone,
  291 │           }),
  292 │         );

0.75 packages/alchemy/src/Prisma/Internal/DeploymentObserve.ts:5:3
  2 │ import { getDeployment } from "@distilled.cloud/prisma/management";
  3 │
  4 │ export const observeDeployment = (deploymentId: string) =>
> 5 │   getDeployment({ deploymentId }).pipe(Effect.map((response) => response.data));

0.75 packages/alchemy/test/AWS/Glue/handler.ts:111:5
  108 │     const getCrawler = yield* Glue.GetCrawler(crawler);
  109 │
  110 │     // Catalog bindings.
> 111 │     const getTables = yield* Glue.GetTables(database);
  112 │     const getTable = yield* Glue.GetTable(table);
  113 │     const getPartitions = yield* Glue.GetPartitions(table);
  114 │     const getPartition = yield* Glue.GetPartition(table);

0.75 packages/alchemy/test/AWS/Lambda/fixtures/microvm/orchestrator.ts:151:17
  148 │             const headers = AWS.Lambda.microvmAuthHeaders(authToken);
  149 │             const echoRes = yield* client
  150 │               .get(
> 151 │                 `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
  152 │                 { headers },
  153 │               )
  154 │               .pipe(
  155 │                 Effect.retry({
  156 │                   schedule: Schedule.exponential("500 millis"),
  157 │                   times: 8,
  158 │                 }),
  159 │                 Effect.orDie,
  160 │               );

0.75 packages/alchemy/test/Cloudflare/Browser/fixtures/async-worker.ts:16:7
   6 │ export default {
   7 │   async fetch(request: Request, env: AsyncWorkerEnv): Promise<Response> {
   8 │     const url = new URL(request.url);
   9 │     if (url.pathname !== "/title") {
  10 │       return new Response("ok");
  11 │     }
  12 │
  13 │     const browser = await puppeteer.launch(env.BROWSER as any);
  14 │     try {
  15 │       const page = await browser.newPage();
> 16 │       await page.goto(TARGET_URL, { waitUntil: "networkidle0" });
  17 │       const title = await page.title();
  18 │       return Response.json({ mode: "async", title });
  19 │     } finally {
  20 │       await browser.close();
  21 │     }
  22 │   },
  23 │ };

0.75 packages/alchemy/test/Cloudflare/D1/fixtures/d1-local-worker.ts:22:7
  19 │   fetch: async (request: Request, env: Env) => {
  20 │     const url = new URL(request.url);
  21 │     if (url.pathname === "/roundtrip") {
> 22 │       await env.DB.exec(
  23 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
  24 │       );
  25 │       await env.DB.prepare("DELETE FROM users").run();
  26 │       await env.DB.prepare("INSERT INTO users (name) VALUES (?)")
  27 │         .bind("alice")
  28 │         .run();
  29 │       await env.DB.prepare("INSERT INTO users (name) VALUES (?)")
  30 │         .bind("bob")
  31 │         .run();
  32 │       const all = await env.DB.prepare(
  33 │         "SELECT name FROM users ORDER BY name",
  34 │       ).all<{ name: string }>();
  35 │       const first = await env.DB.prepare(
  36 │         "SELECT COUNT(*) AS n FROM users",
  37 │       ).first<{ n: number }>();
  38 │       return Response.json({
  39 │         names: all.results.map((r) => r.name),
  40 │         count: first?.n ?? null,
  41 │       });
  42 │     }

0.75 packages/alchemy/test/Cloudflare/D1/fixtures/routes.ts:29:7
  26 │     const url = new URL(request.url, "http://x");
  27 │
  28 │     if (request.method === "POST" && url.pathname === "/init") {
> 29 │       const result = yield* db.exec(
  30 │         "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, style TEXT NOT NULL, name TEXT NOT NULL)",
  31 │       );
  32 │       return yield* HttpServerResponse.json({
  33 │         count: result.count,
  34 │         duration: result.duration,
  35 │       });
  36 │     }

0.75 packages/frontend-frameworks/src/tanstack-start/TanStackStart.ts:323:9
  320 │     // lazily; we only need the listener to answer).
  321 │     yield* Effect.tryPromise({
  322 │       try: async () => {
> 323 │         const response = await fetch(url, { redirect: "manual" });
  324 │         await response.arrayBuffer().catch(() => {});
  325 │       },
  326 │       catch: (error) => fail("The dev server did not become reachable", error),
  327 │     }).pipe(
  328 │       Effect.retry({ schedule: Schedule.spaced("250 millis"), times: 40 }),
  329 │     );

0.74 packages/alchemy/src/AWS/AMP/Workspace.ts:301:9
  300 │       const waitActive = Effect.fn(function* (workspaceId: string) {
> 301 │         const workspace = yield* amp.describeWorkspace({ workspaceId }).pipe(
  302 │           Effect.map((r) => r.workspace),
  303 │           Effect.repeat({
  304 │             schedule: Schedule.max([
  305 │               Schedule.fixed("2 seconds"),
  306 │               Schedule.recurs(30),
  307 │             ]),
  308 │             until: (w) => w.status.statusCode === "ACTIVE",
  309 │           }),
  310 │         );
  311 │         if (workspace.status.statusCode !== "ACTIVE") {
  312 │           return yield* Effect.fail(
  313 │             new Error(
  314 │               `AMP workspace ${workspaceId} did not become ACTIVE (status: ${workspace.status.statusCode})`,
  315 │             ),
  316 │           );
  317 │         }
  318 │         return workspace;
  319 │       });

0.74 packages/alchemy/src/AWS/ApiGatewayV2/Api.ts:316:11
  315 │           // 4. RETURN — re-read so attributes reflect actual cloud state.
> 316 │           const final = yield* agw2.getApi({ ApiId: apiId });
  317 │           yield* session.note(`Reconciled API ${apiId}`);
  318 │           return snapshotFromApi(final);
  319 │         }),

0.74 packages/alchemy/src/AWS/Backup/BackupSelection.ts:181:15
  173 │         read: Effect.fn(function* ({ output }) {
  174 │           if (!output?.selectionId || !output?.backupPlanId) return undefined;
  175 │           // AWS Backup returns InvalidParameterValueException (not
  176 │           // ResourceNotFoundException) for a selection id that no longer
  177 │           // exists — treat both as "absent".
  178 │           const found = yield* backup
  179 │             .getBackupSelection({
  180 │               BackupPlanId: output.backupPlanId,
> 181 │               SelectionId: output.selectionId,
  182 │             })
  183 │             .pipe(
  184 │               Effect.catchTag(
  185 │                 ["ResourceNotFoundException", "InvalidParameterValueException"],
  186 │                 () => Effect.succeed(undefined),
  187 │               ),
  188 │             );
  189 │           if (!found?.SelectionId) return undefined;
  190 │           return {
  191 │             selectionId: found.SelectionId,
  192 │             selectionName:
  193 │               found.BackupSelection?.SelectionName ?? output.selectionName,
  194 │             backupPlanId: output.backupPlanId,
  195 │           };
  196 │         }),

0.74 packages/alchemy/src/AWS/CloudWatch/common.ts:80:5
  75 │ export const readResourceTags = (resourceArn: string) =>
  76 │   cloudwatch
  77 │     .listTagsForResource({
  78 │       ResourceARN: resourceArn,
  79 │     })
> 80 │     .pipe(Effect.map((response) => toTagRecord(response.Tags)));
  81 │
  82 │ export const createTagList = (tags: Record<string, string>) =>
  83 │   createTagsList(tags);

0.74 packages/alchemy/src/AWS/DAX/SubnetGroup.ts:180:13
  179 │           if (mutated) {
> 180 │             const response = yield* dax.updateSubnetGroup(update);
  181 │             observed = response.SubnetGroup ?? observed;
  182 │           }

0.74 packages/alchemy/src/AWS/DocDB/DBInstance.ts:422:11
  421 │         delete: Effect.fn(function* ({ output }) {
> 422 │           yield* docdb
  423 │             .deleteDBInstance({
  424 │               DBInstanceIdentifier: output.dbInstanceIdentifier,
  425 │             })
  426 │             .pipe(
  427 │               Effect.catchTag("DBInstanceNotFoundFault", () => Effect.void),
  428 │             );
  429 │           // Block until the instance is fully gone so a dependent cluster or
  430 │           // subnet group is not torn down while DocumentDB still references it.
  431 │           yield* Effect.repeat(
  432 │             docdb
  433 │               .describeDBInstances({
  434 │                 DBInstanceIdentifier: output.dbInstanceIdentifier,
  435 │               })
  436 │               .pipe(
  437 │                 Effect.as(true),
  438 │                 Effect.catchTag("DBInstanceNotFoundFault", () =>
  439 │                   Effect.succeed(false),
  440 │                 ),
  441 │               ),
  442 │             {
  443 │               schedule: Schedule.max([
  444 │                 Schedule.fixed("15 seconds"),
  445 │                 Schedule.recurs(40),
  446 │               ]),
  447 │               until: (exists) => exists === false,
  448 │             },
  449 │           ).pipe(Effect.catch(() => Effect.void));
  450 │         }),

0.74 packages/alchemy/src/AWS/EC2/NetworkAcl.ts:282:13
  279 │           // Ensure — create the NACL when missing.
  280 │           if (acl === undefined) {
  281 │             yield* session.note("Creating Network ACL...");
> 282 │             const result = yield* ec2.createNetworkAcl({
  283 │               VpcId: news.vpcId as string,
  284 │               TagSpecifications: [
  285 │                 {
  286 │                   ResourceType: "network-acl",
  287 │                   Tags: createTagsList(desiredTags),
  288 │                 },
  289 │               ],
  290 │               DryRun: false,
  291 │             });
  292 │             const newAclId = result.NetworkAcl!.NetworkAclId!;
  293 │             yield* session.note(`Network ACL created: ${newAclId}`);
  294 │             acl = yield* describeNetworkAcl(newAclId);
  295 │           }

0.74 packages/alchemy/src/AWS/FIS/ExperimentTemplate.ts:699:13
  697 │         delete: Effect.fn(function* ({ output }) {
  698 │           yield* fis
> 699 │             .deleteExperimentTemplate({ id: output.id })
  700 │             .pipe(
  701 │               Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  702 │             );
  703 │         }),

0.74 packages/alchemy/src/AWS/IAM/ServiceLinkedRole.ts:161:11
  159 │       const getRole = Effect.fn(function* (roleName: string) {
  160 │         const response = yield* iam
> 161 │           .getRole({ RoleName: roleName })
  162 │           .pipe(
  163 │             Effect.catchTag("NoSuchEntityException", () =>
  164 │               Effect.succeed(undefined),
  165 │             ),
  166 │           );
  167 │         return response?.Role;
  168 │       });

0.74 packages/alchemy/src/AWS/IVSChat/internal.ts:25:5
  23 │ export const readIvsChatTags = Effect.fn(function* (arn: string) {
  24 │   const response = yield* ivschat
> 25 │     .listTagsForResource({ resourceArn: arn })
  26 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  27 │   return toTagRecord(response?.tags);
  28 │ });

0.74 packages/alchemy/src/AWS/KMS/Alias.ts:212:3
  211 │ const resolveTargetKeyId = Effect.fn(function* (targetKeyId: string) {
> 212 │   const described = yield* kms.describeKey({ KeyId: targetKeyId });
  213 │   return described.KeyMetadata?.KeyId!;
  214 │ });

0.74 packages/alchemy/src/AWS/KMS/Key.ts:423:9
  422 │       const remaining = yield* Effect.repeat(
> 423 │         kms.describeKey({ KeyId: output.keyId }).pipe(
  424 │           Effect.map((response) => response.KeyMetadata?.KeyState),
  425 │           Effect.catchTag("NotFoundException", () => Effect.succeed(undefined)),
  426 │         ),
  427 │         {
  428 │           schedule: Schedule.fixed("250 millis"),
  429 │           until: (state) => state === undefined || state === "PendingDeletion",
  430 │           times: 20,
  431 │         },
  432 │       );

0.74 packages/alchemy/src/AWS/Kinesis/StreamConsumer.ts:442:13
  438 │       const hydrated = yield* Effect.forEach(
  439 │         consumers,
  440 │         ({ streamArn, consumer }) =>
  441 │           kinesis
> 442 │             .listTagsForResource({ ResourceARN: consumer.ConsumerARN })
  443 │             .pipe(
  444 │               Effect.map((tagsResponse): StreamConsumer["Attributes"] => ({
  445 │                 consumerName: consumer.ConsumerName,
  446 │                 consumerArn: consumer.ConsumerARN,
  447 │                 consumerStatus: consumer.ConsumerStatus as ConsumerStatus,
  448 │                 streamArn: streamArn as StreamArn,
  449 │                 consumerCreationTimestamp: consumer.ConsumerCreationTimestamp,
  450 │                 tags: toTagRecord(tagsResponse.Tags),
  451 │               })),
  452 │               // A consumer may be deregistered between list and tag fetch.
  453 │               Effect.catchTag("ResourceNotFoundException", () =>
  454 │                 Effect.succeed(undefined),
  455 │               ),
  456 │             ),
  457 │         { concurrency: 10 },
  458 │       );

0.74 packages/alchemy/src/AWS/MailManager/internal.ts:12:3
  11 │ export const readMailManagerTags = (arn: string) =>
> 12 │   mm.listTagsForResource({ ResourceArn: arn }).pipe(
  13 │     Effect.map((r) => tagRecord(r.Tags ?? [])),
  14 │     Effect.catch(() => Effect.succeed<Record<string, string>>({})),
  15 │   );

0.74 packages/alchemy/src/AWS/MediaConvert/Queue.ts:127:11
  124 │       /** Get a queue by name; typed not-found → undefined. */
  125 │       const getQueue = Effect.fn(function* (name: string) {
  126 │         const response = yield* mediaconvert
> 127 │           .getQueue({ Name: name })
  128 │           .pipe(
  129 │             Effect.catchTag("NotFoundException", () =>
  130 │               Effect.succeed(undefined),
  131 │             ),
  132 │           );
  133 │         return response?.Queue;
  134 │       });

0.74 packages/alchemy/src/AWS/MediaLive/internal.ts:100:5
   98 │ export const readMlTags = Effect.fn(function* (arn: string) {
   99 │   const response = yield* medialive
> 100 │     .listTagsForResource({ ResourceArn: arn })
  101 │     .pipe(Effect.catch(() => Effect.succeed(undefined)));
  102 │   return toTagRecord(response?.Tags);
  103 │ });

0.74 packages/alchemy/src/AWS/Notifications/internal.ts:24:5
  22 │ export const readNotificationsTags = Effect.fn(function* (arn: string) {
  23 │   return yield* pinNotificationsRegion(
> 24 │     notifications.listTagsForResource({ arn }).pipe(
  25 │       Effect.map((r) => (r.tags ?? {}) as Record<string, string>),
  26 │       Effect.catchTag(
  27 │         ["ResourceNotFoundException", "ValidationException"],
  28 │         () => Effect.succeed({} as Record<string, string>),
  29 │       ),
  30 │     ),
  31 │   );
  32 │ });

0.74 packages/alchemy/src/AWS/QBusiness/Retriever.ts:242:9
  238 │ const waitForRetrieverActive = (applicationId: string, retrieverId: string) =>
  239 │   retryWhileNotReady(
  240 │     Effect.gen(function* () {
  241 │       const described = yield* qbusiness
> 242 │         .getRetriever({ applicationId, retrieverId })
  243 │         .pipe(
  244 │           Effect.catchTag("ResourceNotFoundException", () =>
  245 │             Effect.succeed(undefined),
  246 │           ),
  247 │         );
  248 │       if (described?.status === "ACTIVE") return;
  249 │       if (described?.status === "FAILED") {
  250 │         return yield* Effect.fail(
  251 │           new RetrieverProvisioningFailed({ retrieverId }),
  252 │         );
  253 │       }
  254 │       return yield* Effect.fail(
  255 │         new RetrieverNotReady({ retrieverId, status: described?.status }),
  256 │       );
  257 │     }),
  258 │   );

0.74 packages/alchemy/src/AWS/SageMaker/Model.ts:203:11
  198 │         read: Effect.fn(function* ({ id, olds, output }) {
  199 │           const modelName =
  200 │             output?.modelName ?? (yield* createModelName(id, olds ?? {}));
  201 │           const attrs = yield* readModel(modelName);
  202 │           if (!attrs) return undefined;
> 203 │           const tags = yield* fetchModelTags(attrs.modelArn);
  204 │           return (yield* hasAlchemyTags(id, tags as Tags))
  205 │             ? attrs
  206 │             : Unowned(attrs);
  207 │         }),

0.74 packages/alchemy/src/AWS/Scheduler/Schedule.ts:322:11
  321 │         delete: Effect.fn(function* ({ output }) {
> 322 │           yield* scheduler
  323 │             .deleteSchedule({
  324 │               Name: output.scheduleName,
  325 │               GroupName:
  326 │                 output.groupName !== "default" ? output.groupName : undefined,
  327 │             })
  328 │             .pipe(
  329 │               Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  330 │             );
  331 │         }),

0.74 packages/alchemy/src/AWS/SecurityLake/internal.ts:20:3
  18 │ /** Observed cloud tags for a Security Lake resource ARN ({} on any failure). */
  19 │ export const readSecurityLakeTags = (resourceArn: string) =>
> 20 │   securitylake.listTagsForResource({ resourceArn }).pipe(
  21 │     Effect.map((response) => fromTagList(response.tags)),
  22 │     Effect.catch(() => Effect.succeed<Record<string, string>>({})),
  23 │   );

0.74 packages/alchemy/src/Cloudflare/Alerting/Webhook.ts:281:9
  272 │     delete: Effect.fn(function* ({ output }) {
  273 │       // Cloudflare answers `deleteDestinationWebhook` for a webhook that no
  274 │       // longer exists with a generic `InternalServerError` (code 15000)
  275 │       // rather than a not-found error. Since that envelope is
  276 │       // indistinguishable from a genuine server fault, catch the typed tag
  277 │       // and verify the webhook is actually gone: `WebhookNotFound` on the
  278 │       // follow-up read confirms idempotent success; anything still present
  279 │       // re-fails with the original error.
  280 │       yield* alerting
> 281 │         .deleteDestinationWebhook({
  282 │           accountId: output.accountId,
  283 │           webhookId: output.webhookId,
  284 │         })
  285 │         .pipe(
  286 │           Effect.catchTag("InternalServerError", (e) =>
  287 │             observeWebhook(output.accountId, output.webhookId).pipe(
  288 │               Effect.flatMap((observed) =>
  289 │                 observed === undefined ? Effect.void : Effect.fail(e),
  290 │               ),
  291 │             ),
  292 │           ),
  293 │         );
  294 │     }),

0.74 packages/alchemy/src/Cloudflare/Pipelines/Pipeline.ts:174:9
  171 │       // pipeline and fall through to recreate it under the same name.
  172 │       // Nothing references a pipeline downstream, so this is safe.
  173 │       if (observed && (observed.sql !== sql || observed.name !== name)) {
> 174 │         yield* deletePipeline(accountId, observed.id);
  175 │         // Wait until the delete is visible so the recreate below does not
  176 │         // race an `PipelineAlreadyExists` against the dying pipeline.
  177 │         yield* getPipeline(accountId, observed.id).pipe(
  178 │           Effect.repeat({
  179 │             schedule: Schedule.max([
  180 │               Schedule.exponential("250 millis"),
  181 │               Schedule.recurs(8),
  182 │             ]),
  183 │             until: (p) => p === undefined,
  184 │           }),
  185 │         );
  186 │         observed = undefined;
  187 │       }

0.74 packages/alchemy/src/Cloudflare/Tags/ZoneResourceTags.ts:241:7
  239 │       if (!zoneId || !resourceId || !resourceType) return undefined;
  240 │
> 241 │       const observed = yield* resourceTagging
  242 │         .getZoneTag({
  243 │           zoneId,
  244 │           resourceId,
  245 │           resourceType,
  246 │           accessApplicationId,
  247 │         })
  248 │         // A 404 means the target resource no longer exists; its tags are
  249 │         // gone with it.
  250 │         .pipe(
  251 │           Effect.catchTag("ZoneTagResourceNotFound", () =>
  252 │             Effect.succeed(undefined),
  253 │           ),
  254 │         );

0.74 packages/alchemy/src/GitHub/BranchProtection.ts:424:11
  422 │       yield* Effect.tryPromise({
  423 │         try: () =>
> 424 │           octokit.rest.repos.updateBranchProtection({
  425 │             owner: news.owner,
  426 │             repo: news.repository,
  427 │             branch: news.branch,

0.74 packages/alchemy/src/GitHub/TeamAccess.ts:170:11
  164 │     reconcile: Effect.fn(function* ({ news }) {
  165 │       const octokit = yield* octokitFor(news.baseUrl);
  166 │
  167 │       // Ensure & Sync — PUT is idempotent; adds team or updates permission
  168 │       yield* Effect.tryPromise({
  169 │         try: async () => {
> 170 │           await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
  171 │             org: news.owner,
  172 │             team_slug: news.teamSlug,
  173 │             owner: news.owner,
  174 │             repo: news.repository,
  175 │             permission: news.permission ?? "push",
  176 │           });
  177 │         },
  178 │         catch: (e) => e as Error,
  179 │       });
  180 │
  181 │       return {
  182 │         teamSlug: news.teamSlug,
  183 │         permission: news.permission ?? "push",
  184 │       };
  185 │     }),

0.74 packages/alchemy/src/GitHub/Webhook.ts:261:19
  254 │       const perRepo = yield* Effect.forEach(
  255 │         repos,
  256 │         (repo) =>
  257 │           Effect.tryPromise({
  258 │             try: async () => {
  259 │               try {
  260 │                 const hooks = await octokit.paginate(
> 261 │                   octokit.rest.repos.listWebhooks,
  262 │                   {
  263 │                     owner: repo.owner.login,
  264 │                     repo: repo.name,
  265 │                     per_page: 100,
  266 │                   },
  267 │                 );
  268 │                 return hooks.map(toAttrs);
  269 │               } catch (error: any) {
  270 │                 // Repos where the token lacks admin access reject the webhooks
  271 │                 // endpoint with 403/404 — skip them per the per-item not-found
  272 │                 // rule rather than failing the whole enumeration.
  273 │                 if (error.status === 403 || error.status === 404) {
  274 │                   return [];
  275 │                 }
  276 │                 throw error;
  277 │               }
  278 │             },
  279 │             catch: (e) => e as Error,
  280 │           }),
  281 │         { concurrency: 10 },
  282 │       );

0.74 packages/alchemy/src/Planetscale/MySQL/MySQLClusterSize.ts:119:5
  116 │   yield* waitForKeyspaceReady(organization, database, branch, keyspace.name);
  117 │
  118 │   if (keyspace.cluster_name !== expectedClusterSize) {
> 119 │     yield* ps.updateBranchClusterConfig({
  120 │       organization,
  121 │       database,
  122 │       branch,
  123 │       cluster_size: expectedClusterSize,
  124 │     });
  125 │     yield* waitForKeyspaceReady(organization, database, branch, keyspace.name);
  126 │     // Re-observe so the replica sync below diffs against the post-resize
  127 │     // keyspace state.
  128 │     keyspace =
  129 │       (yield* observeDefaultKeyspace(organization, database, branch)) ??
  130 │       keyspace;
  131 │   }

0.74 packages/alchemy/src/Prisma/Bucket.ts:207:13
  206 │           const observed = bucketId
> 207 │             ? yield* getBucket({ bucketId }).pipe(
  208 │                 Effect.map((response) => response.data),
  209 │                 Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  210 │               )
  211 │             : undefined;

0.74 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:30:3
  29 │ export const startDeploymentIdempotent = (deploymentId: string) =>
> 30 │   createDeploymentStart({ deploymentId }).pipe(
  31 │     Effect.map((response) => response.data),
  32 │     Effect.catchTag("Conflict", (error) =>
  33 │       startConflictIsIdempotent(deploymentId, error),
  34 │     ),
  35 │   );

0.74 packages/alchemy/src/SQLite/libSQL.ts:51:7
  49 │   exec: (sql: string) =>
  50 │     Effect.tryPromise({
> 51 │       try: () => executor.execute(sql),
  52 │       catch: (e) =>
  53 │         parseError(extractErrorCode(e), `Failed to execute SQL: ${e}`, e),
  54 │     }),

0.74 packages/alchemy/src/State/PostgresState.ts:620:15
  615 │       getOutput: (request) =>
  616 │         guarded(
  617 │           request,
  618 │           run(
  619 │             (sql) =>
> 620 │               sql`select value from alchemy_stack_output where stack = ${request.stack} and stage = ${request.stage}`,
  621 │           ).pipe(
  622 │             Effect.map((rows) => {
  623 │               const row = rows[0];
  624 │               return row === undefined
  625 │                 ? undefined
  626 │                 : reviveStateRecursive(row.value);
  627 │             }),
  628 │           ),
  629 │         ),

0.74 packages/alchemy/test/AWS/EMRServerless/handler.ts:275:11
  267 │         if (request.method === "GET" && pathname === "/jobrun-detail") {
  268 │           const id = url.searchParams.get("id");
  269 │           if (!id) {
  270 │             return yield* HttpServerResponse.json(
  271 │               { error: "id query parameter required" },
  272 │               { status: 400 },
  273 │             );
  274 │           }
> 275 │           const { jobRun } = yield* getJobRun({ jobRunId: id }).pipe(
  276 │             Effect.orDie,
  277 │           );
  278 │           return yield* HttpServerResponse.json({
  279 │             jobRunId: jobRun.jobRunId,
  280 │             state: jobRun.state,
  281 │             stateDetails: jobRun.stateDetails,
  282 │           });
  283 │         }

0.74 packages/alchemy/test/AWS/Lambda/fixtures/microvm/worker.ts:133:17
  130 │             const headers = AWS.Lambda.microvmAuthHeaders(authToken);
  131 │             const echoRes = yield* client
  132 │               .get(
> 133 │                 `https://${vm.endpoint}/echo?message=${encodeURIComponent(message)}`,
  134 │                 { headers },
  135 │               )
  136 │               .pipe(
  137 │                 Effect.retry({
  138 │                   schedule: Schedule.exponential("500 millis"),
  139 │                   times: 8,
  140 │                 }),
  141 │                 Effect.orDie,
  142 │               );

0.74 packages/alchemy/test/Neon/fixtures/connect-handler.ts:25:9
  22 │   return {
  23 │     fetch: Effect.gen(function* () {
  24 │       const rows =
> 25 │         yield* pooled`SELECT current_database() AS database, value FROM alchemy_connect_marker`;
  26 │       const directRows =
  27 │         yield* direct`SELECT current_database() AS database, value FROM alchemy_connect_marker`;
  28 │       const parentRows =
  29 │         yield* parent`SELECT current_database() AS database, value FROM alchemy_connect_marker`;
  30 │       const accountKey = yield* context.get<string>("NEON_API_KEY");
  31 │       return yield* HttpServerResponse.json({
  32 │         database: rows[0]?.database,
  33 │         directDatabase: directRows[0]?.database,
  34 │         parentDatabase: parentRows[0]?.database,
  35 │         branchMarker: rows[0]?.value,
  36 │         directMarker: directRows[0]?.value,
  37 │         parentMarker: parentRows[0]?.value,
  38 │         hasAccountKey: accountKey !== undefined,
  39 │         injected: yield* context.get<boolean>(keys.injected),
  40 │         parentInjected: yield* context.get<boolean>(projectKeys.injected),
  41 │       });
  42 │     }).pipe(
  43 │       Effect.catchCause((cause) =>
  44 │         HttpServerResponse.json({
  45 │           error: Cause.pretty(cause).replace(
  46 │             /postgres(?:ql)?:\/\/[^\s"']+/g,
  47 │             "<redacted-database-url>",
  48 │           ),
  49 │         }),
  50 │       ),
  51 │       Effect.orDie,
  52 │     ),

0.74 packages/alchemy/test/Prisma/fixtures/hyperdrive-worker.ts:65:11
  54 │   Effect.gen(function* () {
  55 │     const hd = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
  56 │     const sql = yield* SQL.Postgres({ url: hd.connectionString });
  57 │
  58 │     return {
  59 │       fetch: Effect.gen(function* () {
  60 │         const request = yield* HttpServerRequest.HttpServerRequest;
  61 │         const url = new URL(request.url, "http://x");
  62 │
  63 │         if (request.method === "POST" && url.pathname === "/widgets") {
  64 │           const body = (yield* request.json) as { id: number; name: string };
> 65 │           yield* sql`CREATE TABLE IF NOT EXISTS ${sql(TABLE)} (id INT PRIMARY KEY, name TEXT NOT NULL)`;
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

0.74 packages/alchemy/test/Railway/fixtures/mysql-api.ts:43:9
  32 │   Effect.gen(function* () {
  33 │     const conn = yield* Railway.ConnectMySQL(Db);
  34 │     const db = yield* Drizzle.MySQL(conn.connectionString);
  35 │
  36 │     return {
  37 │       fetch: Effect.gen(function* () {
  38 │         const request = yield* HttpServerRequest;
  39 │         const path = new URL(request.url, "http://service").pathname;
  40 │         if (path === "/ping") {
  41 │           return yield* HttpServerResponse.json({ ok: true });
  42 │         }
> 43 │         const rows = yield* db.execute("select 1 as ok", "objects");
  44 │         if (path === "/health" || path === "/") {
  45 │           return yield* HttpServerResponse.json({ rows });
  46 │         }
  47 │         return yield* HttpServerResponse.json({ rows }, { status: 404 });
  48 │       }).pipe(
  49 │         Effect.catch((error) =>
  50 │           HttpServerResponse.json(
  51 │             { ok: false, error: String(error) },
  52 │             { status: 500 },
  53 │           ),
  54 │         ),
  55 │       ),
  56 │     };
  57 │   }).pipe(Effect.provide(Railway.ConnectMySQLHttp)),

0.74 packages/cloudflare-runtime/src/vite/module-runner/module-runner.worker.ts:248:13
  238 │           invoke: async (data) => {
  239 │             const response = await env.__DISTILLED_INVOKE_MODULE__.fetch(
  240 │               new Request("http://localhost", {
  241 │                 method: "POST",
  242 │                 headers: {
  243 │                   "content-type": "application/json",
  244 │                   [ENVIRONMENT_NAME_HEADER]: environmentName,
  245 │                 },
  246 │                 body: JSON.stringify(data),
  247 │               }),
> 248 │             );
  249 │             const result = await response.json<
  250 │               { result: unknown } | { error: unknown }
  251 │             >();
  252 │
  253 │             return result;
  254 │           },

0.74 packages/frontend-frameworks/src/nextjs/aws.ts:362:3
  336 │   Effect.gen(function* () {
  337 │     for (let attempt = 0; attempt < 240; attempt++) {
  338 │       if (options.child.exited()) {
  339 │         return yield* Effect.fail(
  340 │           fail(
  341 │             `The next dev CLI exited before becoming ready:\n${options.child.output().slice(-4000)}`,
  342 │           )(undefined),
  343 │         );
  344 │       }
  345 │       const ready = yield* Effect.tryPromise({
  346 │         try: async () => {
  347 │           const response = await fetch(options.url, {
  348 │             signal: AbortSignal.timeout(2000),
  349 │           });
  350 │           return response.status < 600;
  351 │         },
  352 │         catch: () => "not-ready" as const,
  353 │       }).pipe(Effect.orElseSucceed(() => false));
  354 │       if (ready) return;
  355 │       yield* Effect.sleep(500);
  356 │     }
  357 │     return yield* Effect.fail(
  358 │       fail(`Timed out waiting for the next dev server at ${options.url}`)(
  359 │         undefined,
  360 │       ),
  361 │     );
> 362 │   });

0.74 packages/pkg/src/cli/publish.ts:82:7
  79 │   const upload = (pkg: Manifest["packages"][number]) =>
  80 │     Effect.gen(function* () {
  81 │       const bytes = yield* fs.readFile(path.join(dir, pkg.file));
> 82 │       const result = yield* client.Registry.uploadTarball({
  83 │         params: { name: pkg.name, sha256: pkg.sha256 },
  84 │         query: run,
  85 │         payload: bytes,
  86 │       }).pipe(Effect.mapError(failed(`upload ${pkg.name}`)));
  87 │       yield* Console.log(
  88 │         `${result.uploaded ? "Uploaded" : "Reused"} ${pkg.name} (${pkg.sha256.slice(0, 12)}, ${pkg.size} bytes)`,
  89 │       );
  90 │     });

0.73 packages/alchemy/src/AWS/AppConfig/Application.ts:94:11
   92 │       const readApplication = Effect.fn(function* (applicationId: string) {
   93 │         return yield* appconfig
>  94 │           .getApplication({ ApplicationId: applicationId })
   95 │           .pipe(
   96 │             Effect.catchTag("ResourceNotFoundException", () =>
   97 │               Effect.succeed(undefined),
   98 │             ),
   99 │           );
  100 │       });

0.73 packages/alchemy/src/AWS/Assets.ts:119:13
  116 │         return Effect.gen(function* () {
  117 │           // Check if asset already exists
  118 │           const exists = yield* s3
> 119 │             .headObject({ Bucket: yield* bucketName, Key: key })
  120 │             .pipe(
  121 │               Effect.map(() => true),
  122 │               Effect.catchTag("NotFound", () => Effect.succeed(false)),
  123 │             );
  124 │
  125 │           if (exists) {
  126 │             yield* Effect.logDebug(
  127 │               `Asset already exists: s3://${yield* bucketName}/${key}`,
  128 │             );
  129 │             return key;
  130 │           }
  131 │
  132 │           // Upload the asset
  133 │           yield* s3.putObject({
  134 │             Bucket: yield* bucketName,
  135 │             Key: key,
  136 │             Body: content,
  137 │             ContentType: "application/zip",
  138 │           });
  139 │
  140 │           yield* Effect.logDebug(
  141 │             `Uploaded asset: s3://${yield* bucketName}/${key}`,
  142 │           );
  143 │           return key;
  144 │         }).pipe(

0.73 packages/alchemy/src/AWS/CloudFront/VpcOrigin.ts:181:9
  180 │       const fetchTags = Effect.fn(function* (arn: string) {
> 181 │         const response = yield* cloudfront.listTagsForResource({
  182 │           Resource: arn,
  183 │         });
  184 │         return toTagsRecord(response.Tags.Items);
  185 │       });

0.73 packages/alchemy/src/AWS/CodeArtifact/Domain.ts:100:11
   98 │       const getDomain = Effect.fn(function* (name: string) {
   99 │         const response = yield* codeartifact
> 100 │           .describeDomain({ domain: name })
  101 │           .pipe(
  102 │             Effect.catchTag("ResourceNotFoundException", () =>
  103 │               Effect.succeed(undefined),
  104 │             ),
  105 │           );
  106 │         return response?.domain;
  107 │       });

0.73 packages/alchemy/src/AWS/CodeArtifact/Repository.ts:153:11
  147 │       const getRepository = Effect.fn(function* (
  148 │         domain: string,
  149 │         domainOwner: string | undefined,
  150 │         name: string,
  151 │       ) {
  152 │         const response = yield* codeartifact
> 153 │           .describeRepository({ domain, domainOwner, repository: name })
  154 │           .pipe(
  155 │             Effect.catchTag("ResourceNotFoundException", () =>
  156 │               Effect.succeed(undefined),
  157 │             ),
  158 │           );
  159 │         return response?.repository;
  160 │       });

0.73 packages/alchemy/src/AWS/Cognito/IdentityPoolRoleAttachment.ts:113:11
  110 │     Effect.gen(function* () {
  111 │       const getRoles = Effect.fn(function* (identityPoolId: string) {
  112 │         return yield* ci
> 113 │           .getIdentityPoolRoles({ IdentityPoolId: identityPoolId })
  114 │           .pipe(
  115 │             Effect.catchTag("ResourceNotFoundException", () =>
  116 │               Effect.succeed(undefined),
  117 │             ),
  118 │           );
  119 │       });

0.73 packages/alchemy/src/AWS/Config/ConfigurationRecorder.ts:381:15
  361 │           if (news.recording !== undefined) {
  362 │             const status = yield* config
  363 │               .describeConfigurationRecorderStatus({
  364 │                 ConfigurationRecorderNames: [name],
  365 │               })
  366 │               .pipe(
  367 │                 Effect.map(
  368 │                   (r) =>
  369 │                     (r.ConfigurationRecordersStatus ?? []).at(0)?.recording ??
  370 │                     false,
  371 │                 ),
  372 │                 Effect.catchTag("NoSuchConfigurationRecorderException", () =>
  373 │                   Effect.succeed(false),
  374 │                 ),
  375 │               );
  376 │             if (news.recording && !status) {
  377 │               yield* config.startConfigurationRecorder({
  378 │                 ConfigurationRecorderName: name,
  379 │               });
  380 │             } else if (!news.recording && status) {
> 381 │               yield* config.stopConfigurationRecorder({
  382 │                 ConfigurationRecorderName: name,
  383 │               });
  384 │             }
  385 │           }

0.73 packages/alchemy/src/AWS/DataZone/EnvironmentBlueprintConfiguration.ts:224:13
  214 │       const getConfigurationOrUndefined = Effect.fn(function* (
  215 │         domainId: string,
  216 │         blueprintId: string,
  217 │       ) {
  218 │         return yield* datazone
  219 │           .getEnvironmentBlueprintConfiguration({
  220 │             domainIdentifier: domainId,
  221 │             environmentBlueprintIdentifier: blueprintId,
  222 │           })
  223 │           .pipe(
> 224 │             Effect.catchTag("ResourceNotFoundException", () =>
  225 │               Effect.succeed(undefined),
  226 │             ),
  227 │             Effect.catchTag("AccessDeniedException", () =>
  228 │               Effect.succeed(undefined),
  229 │             ),
  230 │           );
  231 │       });

0.73 packages/alchemy/src/AWS/EC2/SecurityGroup.ts:841:15
  838 │           if (sg === undefined) {
  839 │             yield* session.note(`Creating Security Group: ${groupName}`);
  840 │             const result = yield* ec2
> 841 │               .createSecurityGroup({
  842 │                 GroupName: groupName,
  843 │                 Description: news.description ?? "Managed by Alchemy",
  844 │                 VpcId: news.vpcId as string,
  845 │                 TagSpecifications: [
  846 │                   {
  847 │                     ResourceType: "security-group",
  848 │                     Tags: createTagsList(desiredTags),
  849 │                   },
  850 │                 ],
  851 │                 DryRun: false,
  852 │               })
  853 │               .pipe(
  854 │                 // A just-created VPC can lag visibility to the SG service
  855 │                 // (EC2 eventual consistency), so the create races with
  856 │                 // `InvalidVpcID.NotFound`. Retry, bounded.
  857 │                 Effect.retry({
  858 │                   while: (e) => e._tag === "InvalidVpcID.NotFound",
  859 │                   schedule: Schedule.fixed("1 second"),
  860 │                   times: 8,
  861 │                 }),
  862 │               );
  863 │             const newGroupId = result.GroupId! as SecurityGroupId;
  864 │             yield* session.note(`Security Group created: ${newGroupId}`);
  865 │             sg = yield* describeSecurityGroup(newGroupId);
  866 │           }

0.73 packages/alchemy/src/AWS/EC2/Vpc.ts:461:11
  458 │           const desiredDnsSupport = news.enableDnsSupport ?? true;
  459 │           const desiredDnsHostnames = news.enableDnsHostnames ?? false;
  460 │
> 461 │           const dnsSupportResult = yield* ec2.describeVpcAttribute({
  462 │             VpcId: vpcId,
  463 │             Attribute: "enableDnsSupport",
  464 │           });

0.73 packages/alchemy/src/AWS/EC2/VpcEndpoint.ts:441:13
  438 │           // to create.
  439 │           let ep: ec2.VpcEndpoint | undefined;
  440 │           if (output?.vpcEndpointId) {
> 441 │             const lookup = yield* ec2
  442 │               .describeVpcEndpoints({
  443 │                 VpcEndpointIds: [output.vpcEndpointId],
  444 │               })
  445 │               .pipe(
  446 │                 Effect.catchTag("InvalidVpcEndpointId.NotFound", () =>
  447 │                   Effect.succeed({ VpcEndpoints: [] }),
  448 │                 ),
  449 │               );
  450 │             ep = lookup.VpcEndpoints?.[0];
  451 │             if (ep && (ep.State === "deleted" || ep.State === "deleting")) {
  452 │               ep = undefined;
  453 │             }
  454 │           }

0.73 packages/alchemy/src/AWS/ELBv2/TargetGroupAttachment.ts:151:9
  144 │     read: Effect.fn(function* ({ output }) {
  145 │       if (!output) {
  146 │         return undefined;
  147 │       }
  148 │       // describeTargetHealth without an explicit Targets filter lists only
  149 │       // registered targets, so presence in the response means registered.
  150 │       const health = yield* elbv2
> 151 │         .describeTargetHealth({ TargetGroupArn: output.targetGroupArn })
  152 │         .pipe(
  153 │           Effect.catchTag(["TargetGroupNotFoundException"], () =>
  154 │             Effect.succeed(undefined),
  155 │           ),
  156 │         );
  157 │       const registered = health?.TargetHealthDescriptions?.some(
  158 │         (d) =>
  159 │           d.Target?.Id === output.targetId &&
  160 │           (output.port === undefined || d.Target?.Port === output.port),
  161 │       );
  162 │       return registered ? output : undefined;
  163 │     }),

0.73 packages/alchemy/src/AWS/EntityResolution/SchemaMapping.ts:186:13
  179 │           if (
  180 │             !deepEqual(mapping.mappedInputFields, news.mappedInputFields) ||
  181 │             (mapping.description || undefined) !==
  182 │               (news.description ?? undefined)
  183 │           ) {
  184 │             // The update response omits createdAt/updatedAt/hasWorkflows;
  185 │             // name and ARN are stable, so keep the observed Get shape.
> 186 │             yield* entityresolution.updateSchemaMapping({
  187 │               schemaName: name,
  188 │               description: news.description,
  189 │               mappedInputFields: news.mappedInputFields,
  190 │             });
  191 │           }

0.73 packages/alchemy/src/AWS/Forecast/Dataset.ts:135:11
  133 │       const describe = Effect.fn(function* (datasetArn: string) {
  134 │         return yield* forecast
> 135 │           .describeDataset({ DatasetArn: datasetArn })
  136 │           .pipe(
  137 │             Effect.catchTag("ResourceNotFoundException", () =>
  138 │               Effect.succeed(undefined),
  139 │             ),
  140 │           );
  141 │       });

0.73 packages/alchemy/src/AWS/Forecast/DatasetGroup.ts:107:11
  105 │       const describe = Effect.fn(function* (datasetGroupArn: string) {
  106 │         return yield* forecast
> 107 │           .describeDatasetGroup({ DatasetGroupArn: datasetGroupArn })
  108 │           .pipe(
  109 │             Effect.catchTag("ResourceNotFoundException", () =>
  110 │               Effect.succeed(undefined),
  111 │             ),
  112 │           );
  113 │       });

0.73 packages/alchemy/src/AWS/Glacier/Vault.ts:362:13
  360 │           // 3b. SYNC access policy — observed vs desired.
  361 │           const observedPolicy = yield* glacier
> 362 │             .getVaultAccessPolicy({ accountId: ACCOUNT, vaultName })
  363 │             .pipe(
  364 │               Effect.map((r) => r.policy?.Policy),
  365 │               Effect.catchTag("ResourceNotFoundException", () =>
  366 │                 Effect.succeed(undefined),
  367 │               ),
  368 │             );

0.73 packages/alchemy/src/AWS/Logs/MetricFilter.ts:142:11
  139 │         // describeMetricFilters supports account-wide enumeration when no
  140 │         // logGroupName is given.
  141 │         list: () =>
> 142 │           logs.describeMetricFilters.pages({}).pipe(
  143 │             Stream.runCollect,
  144 │             Effect.map((chunk) =>
  145 │               Array.from(chunk)
  146 │                 .flatMap((page) => page.metricFilters ?? [])
  147 │                 .filter(
  148 │                   (
  149 │                     filter,
  150 │                   ): filter is logs.MetricFilter & {
  151 │                     filterName: string;
  152 │                     logGroupName: string;
  153 │                   } => filter.filterName != null && filter.logGroupName != null,
  154 │                 )
  155 │                 .map((filter) => toAttributes(filter.logGroupName, filter)),
  156 │             ),
  157 │           ),

0.73 packages/alchemy/src/AWS/Neptune/DBParameterGroup.ts:381:15
  378 │         delete: Effect.fn(function* ({ output }) {
  379 │           yield* neptune
  380 │             .deleteDBParameterGroup({
> 381 │               DBParameterGroupName: output.dbParameterGroupName,
  382 │             })
  383 │             .pipe(
  384 │               Effect.catchTag(
  385 │                 "DBParameterGroupNotFoundFault",
  386 │                 () => Effect.void,
  387 │               ),
  388 │             );
  389 │         }),

0.73 packages/alchemy/src/AWS/Omics/VariantStore.ts:238:13
  236 │         delete: Effect.fn(function* ({ output }) {
  237 │           yield* omics
> 238 │             .deleteVariantStore({ name: output.name, force: true })
  239 │             .pipe(
  240 │               Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  241 │             );
  242 │         }),

0.73 packages/alchemy/src/AWS/Route53/ZoneVpcAssociation.ts:113:11
  108 │       const observe = Effect.fn(function* (
  109 │         hostedZoneId: string,
  110 │         vpcId: string,
  111 │       ) {
  112 │         const detail = yield* route53
> 113 │           .getHostedZone({ Id: hostedZoneId })
  114 │           .pipe(
  115 │             Effect.catchTag("NoSuchHostedZone", () =>
  116 │               Effect.succeed(undefined),
  117 │             ),
  118 │           );
  119 │         return (detail?.VPCs ?? []).find((vpc) => vpc.VPCId === vpcId);
  120 │       });

0.73 packages/alchemy/src/Cloudflare/AI/GatewayProvider.ts:381:5
  378 │     // Ensure — create. The referenced Secrets Store secret deploys
  379 │     // asynchronously (status `pending` → `active`), so retry the typed
  380 │     // "secret was not found" error with bounded backoff.
> 381 │     const created = yield* aiGateway
  382 │       .createProviderConfig({
  383 │         accountId,
  384 │         gatewayId,
  385 │         alias,
  386 │         providerSlug,
  387 │         secretId,
  388 │         defaultConfig,
  389 │         ...(rateLimit !== undefined && { rateLimit }),
  390 │         ...(rateLimitPeriod !== undefined && { rateLimitPeriod }),
  391 │       })
  392 │       .pipe(
  393 │         Effect.retry({
  394 │           while: (e) => e._tag === "ProviderConfigSecretNotFound",
  395 │           schedule: Schedule.spaced("5 seconds"),
  396 │           times: 10,
  397 │         }),
  398 │       );

0.73 packages/alchemy/src/Cloudflare/AI/SearchToken.ts:207:11
  201 │       if (!observed) {
  202 │         // Ensure — create with the full desired body. A freshly minted
  203 │         // underlying API token propagates eventually-consistently, so a
  204 │         // transient `InvalidTokenCredentials` (code 7012) is retried
  205 │         // briefly before being treated as a real validation failure.
  206 │         const created = yield* aisearch
> 207 │           .createToken({ accountId: acct, ...body })
  208 │           .pipe(retryTokenPropagation);
  209 │         return toAttributes(created, acct);
  210 │       }

0.73 packages/alchemy/src/Cloudflare/EdgeSession.ts:71:3
  62 │ const createUploadToken = Effect.gen(function* () {
  63 │   const env = yield* yield* CloudflareEnvironment;
  64 │   const http = yield* HttpClient.HttpClient;
  65 │   const createSubdomainEdgePreviewSession =
  66 │     yield* workers.createSubdomainEdgePreviewSession;
  67 │   const { token, exchangeUrl } = yield* createSubdomainEdgePreviewSession({
  68 │     accountId: env.accountId,
  69 │   });
  70 │   if (!exchangeUrl) return token;
> 71 │   const json = yield* http.get(exchangeUrl).pipe(
  72 │     Effect.flatMap((r) => r.json),
  73 │     Effect.timeout(30_000),
  74 │     Effect.catch(() => Effect.succeed(null as unknown)),
  75 │   );
  76 │   if (
  77 │     typeof json === "object" &&
  78 │     json !== null &&
  79 │     "token" in json &&
  80 │     typeof (json as Record<string, unknown>).token === "string"
  81 │   ) {
  82 │     return (json as { token: string }).token;
  83 │   }
  84 │   return token;
  85 │ });

0.73 packages/alchemy/src/Cloudflare/Hyperdrive/Connection.ts:321:9
  319 │     delete: Effect.fn(function* ({ output }) {
  320 │       yield* hyperdrive
> 321 │         .deleteConfig({
  322 │           accountId: output.accountId,
  323 │           hyperdriveId: output.hyperdriveId,
  324 │         })
  325 │         .pipe(Effect.catchTag("HyperdriveConfigNotFound", () => Effect.void));
  326 │     }),

0.73 packages/alchemy/src/Cloudflare/Workers/BrowserBinding.ts:41:9
  38 │   ): Effect.Effect<BrowserResponse, BrowserError, RuntimeContext> =>
  39 │     raw.pipe(
  40 │       Effect.flatMap((binding) =>
> 41 │         tryPromise(() => binding.quickAction(action as any, options as any)),
  42 │       ),
  43 │       Effect.flatMap((response) =>
  44 │         response.ok ? Effect.succeed(response) : failResponse(action, response),
  45 │       ),
  46 │     );

0.73 packages/alchemy/src/Fly/Redis.ts:483:5
  481 │ const ensureTos = (orgSlug: string, organizationId: string) =>
  482 │   Effect.gen(function* () {
> 483 │     const agreed = yield* addons.agreedToProviderTos({
  484 │       slug: orgSlug,
  485 │       providerName: REDIS_PROVIDER,
  486 │     });
  487 │     if (agreed === true) return;
  488 │     // Tokens without org-admin cannot write the ToS row. Create still
  489 │     // succeeds when the org already agreed via flyctl.
  490 │     yield* Effect.result(
  491 │       addons.createExtensionTosAgreement({
  492 │         input: {
  493 │           addOnProviderName: REDIS_PROVIDER,
  494 │           organizationId,
  495 │         },
  496 │       }),
  497 │     );
  498 │   });

0.73 packages/alchemy/src/Neon/Storage.ts:70:7
  68 │   return {
  69 │     get: (key: string) =>
> 70 │       provide(S3.getObject({ Bucket: bucket, Key: key })).pipe(
  71 │         Effect.catchTag("NoSuchKey", () => Effect.succeed(undefined)),
  72 │       ),

0.73 packages/alchemy/src/Planetscale/AuthProvider.ts:81:5
  78 │     const interaction = Interaction.accessors;
  79 │     const list = yield* listOrganizations;
  80 │     const response = yield* list({});
> 81 │     const orgs = response.data;

0.73 packages/alchemy/src/Railway/CustomDomain.ts:567:9
  562 │     delete: Effect.fn(function* ({ output }) {
  563 │       const customDomainId = output.customDomainId;
  564 │       const projectId = output.projectId;
  565 │       if (customDomainId.length === 0) return;
  566 │       yield* railway
> 567 │         .deleteCustomDomain({ id: customDomainId })
  568 │         .pipe(railway.catchTags(["RailwayNotFound"], () => Effect.void));
  569 │       if (projectId.length > 0) {
  570 │         yield* waitUntilGone(customDomainId, projectId);
  571 │       }
  572 │     }),

0.73 packages/alchemy/test/AWS/RedshiftServerless/fixtures/query-handler.ts:47:11
  40 │     return {
  41 │       fetch: Effect.gen(function* () {
  42 │         const request = yield* HttpServerRequest;
  43 │         const url = new URL(request.originalUrl);
  44 │         const pathname = url.pathname;
  45 │
  46 │         if (request.method === "GET" && pathname === "/query") {
> 47 │           const result = yield* sql.query("SELECT 1 AS n");
  48 │           return yield* HttpServerResponse.json({
  49 │             columns: (result.ColumnMetadata ?? []).map((c) => c.name),
  50 │             records: result.Records,
  51 │             totalNumRows: result.TotalNumRows,
  52 │           });
  53 │         }
  54 │
  55 │         return yield* HttpServerResponse.json(
  56 │           { error: "Not found", method: request.method, pathname },
  57 │           { status: 404 },
  58 │         );
  59 │       }).pipe(Effect.orDie),
  60 │     };

0.73 packages/alchemy/test/Cloudflare/Email/fixtures/remote-email-worker.ts:38:13
  29 │     return {
  30 │       fetch: Effect.gen(function* () {
  31 │         const request = yield* HttpServerRequest;
  32 │         const url = new URL(request.url, "http://x");
  33 │
  34 │         if (url.pathname === "/send") {
  35 │           const from = url.searchParams.get("from")!;
  36 │           const to = url.searchParams.get("to")!;
  37 │           const result = yield* email
> 38 │             .send({
  39 │               from,
  40 │               to,
  41 │               subject: "alchemy dev remote send_email test",
  42 │               text: `sent at ${new Date().toISOString()}`,
  43 │             })
  44 │             .pipe(
  45 │               Effect.match({
  46 │                 onSuccess: () => ({ ok: true as const }),
  47 │                 onFailure: (err) => ({
  48 │                   ok: false as const,
  49 │                   message: err.message,
  50 │                 }),
  51 │               }),
  52 │             );
  53 │           return yield* HttpServerResponse.json(result);
  54 │         }
  55 │
  56 │         return HttpServerResponse.text("ok");
  57 │       }),
  58 │     };

0.73 packages/alchemy/test/Cloudflare/Utils/Worker.ts:132:3
  128 │ export const waitForWorkerToBeDeleted = Effect.fn(function* (
  129 │   workerName: string,
  130 │   accountId: string,
  131 │ ) {
> 132 │   yield* workers.getScript({ accountId, scriptName: workerName }).pipe(
  133 │     Effect.flatMap(() => Effect.fail(new WorkerStillExists())),
  134 │     Effect.retry({
  135 │       while: (e): e is WorkerStillExists => e instanceof WorkerStillExists,
  136 │       schedule: Schedule.max([Schedule.exponential(100), Schedule.recurs(20)]),
  137 │     }),
  138 │     // Deletion propagates in stages: getScript can briefly report the
  139 │     // worker as existing-but-empty ("has no versions") before the 10007
  140 │     // not-found lands. Both mean the worker is gone for our purposes.
  141 │     Effect.catchTag(
  142 │       ["WorkerNotFound", "WorkerHasNoVersions"],
  143 │       () => Effect.void,
  144 │     ),
  145 │   );
  146 │ });

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:81:15
  78 │         .handle("getTaskDO", ({ params }) =>
  79 │           getTaskDO().pipe(
  80 │             Effect.flatMap((client) =>
> 81 │               client.TasksDO.getTask({ params }).pipe(Effect.orDie),
  82 │             ),
  83 │           ),
  84 │         )

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/worker.ts:38:11
  36 │         if (request.url.startsWith("/widgets/create/")) {
  37 │           const name = request.url.split("/widgets/create/")[1] ?? "unnamed";
> 38 │           const widget = yield* db.orm.public.Widget.create({ name }).pipe(
  39 │             Effect.orDie,
  40 │           );
  41 │           return yield* HttpServerResponse.json({
  42 │             id: widget.id,
  43 │             name: widget.name,
  44 │           });
  45 │         }

0.73 packages/alchemy/test/Fly/fixtures/bluegreen.ts:41:3
  40 │ export const census = (appName: string) =>
> 41 │   machines.listMachines({ app_name: appName }).pipe(
  42 │     Effect.map((listed) =>
  43 │       listed.filter((machine) => machine.state !== "destroyed"),
  44 │     ),
  45 │     Effect.provide(FetchHttpClient.layer),
  46 │   );

0.73 packages/frontend-frameworks/src/vinext/cache/s3-runtime.ts:46:9
  43 │   return {
  44 │     async getText(key) {
  45 │       return runAws(
> 46 │         S3.getObject({
  47 │           Bucket: bucket,
  48 │           Key: objectKey(key),
  49 │         }).pipe(
  50 │           Effect.flatMap((result) =>
  51 │             result.Body === undefined
  52 │               ? Effect.succeed(undefined)
  53 │               : Stream.mkString(Stream.decodeText(result.Body)),
  54 │           ),
  55 │           Effect.catchTag("NoSuchKey", () => Effect.succeed(undefined)),
  56 │         ),
  57 │       );
  58 │     },

0.72 packages/alchemy/src/AWS/ACM/AccountConfiguration.ts:104:9
  101 │     AccountConfiguration,
  102 │     Effect.gen(function* () {
  103 │       const observe = withAcmRegion(
> 104 │         acm.getAccountConfiguration({}).pipe(
  105 │           Effect.map((response) => ({
  106 │             daysBeforeExpiry:
  107 │               response.ExpiryEvents?.DaysBeforeExpiry ??
  108 │               DEFAULT_DAYS_BEFORE_EXPIRY,
  109 │           })),
  110 │         ),
  111 │       );

0.72 packages/alchemy/src/AWS/ApiGatewayV2/DomainName.ts:217:11
  216 │           // 4. RETURN fresh state.
> 217 │           const final = yield* agw2.getDomainName({ DomainName: name });
  218 │           yield* session.note(`Reconciled domain name ${name}`);
  219 │           return snapshotFromDomain(final);
  220 │         }),

0.72 packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts:170:11
  162 │       const describeAction = ({
  163 │         autoScalingGroupName,
  164 │         scheduledActionName,
  165 │       }: {
  166 │         autoScalingGroupName: string | undefined;
  167 │         scheduledActionName: string;
  168 │       }) =>
  169 │         autoscaling
> 170 │           .describeScheduledActions({
  171 │             AutoScalingGroupName: autoScalingGroupName,
  172 │             ScheduledActionNames: [scheduledActionName],
  173 │           } as any)
  174 │           .pipe(
  175 │             Effect.map((result) => result.ScheduledUpdateGroupActions?.[0]),
  176 │             // A deleted/absent Auto Scaling Group surfaces as
  177 │             // `ValidationError: AutoScalingGroup ... not found` (typed
  178 │             // `AutoScalingGroupNotFound` via the auto-scaling patch); treat it
  179 │             // as "action gone" so refresh/read converge instead of failing.
  180 │             Effect.catchTag("AutoScalingGroupNotFound", () =>
  181 │               Effect.succeed(undefined),
  182 │             ),
  183 │           );

0.72 packages/alchemy/src/AWS/Budgets/BudgetAction.ts:326:11
  302 │       const syncTags = Effect.fn(function* (
  303 │         arn: string,
  304 │         desired: Record<string, string>,
  305 │       ) {
  306 │         const observed = yield* budgets
  307 │           .listTagsForResource({ ResourceARN: arn })
  308 │           .pipe(
  309 │             Effect.map((r) =>
  310 │               Object.fromEntries(
  311 │                 (r.ResourceTags ?? []).map((t) => [t.Key, t.Value]),
  312 │               ),
  313 │             ),
  314 │             Effect.catchTag("NotFoundException", () =>
  315 │               Effect.succeed({} as Record<string, string>),
  316 │             ),
  317 │           );
  318 │         const { removed, upsert } = diffTags(observed, desired);
  319 │         if (upsert.length > 0) {
  320 │           yield* budgets.tagResource({
  321 │             ResourceARN: arn,
  322 │             ResourceTags: upsert,
  323 │           });
  324 │         }
  325 │         if (removed.length > 0) {
> 326 │           yield* budgets.untagResource({
  327 │             ResourceARN: arn,
  328 │             ResourceTagKeys: removed,
  329 │           });
  330 │         }
  331 │       });

0.72 packages/alchemy/src/AWS/CodeConnections/Host.ts:277:13
  273 │           if (
  274 │             observed.ProviderEndpoint !== news.providerEndpoint ||
  275 │             !sameVpcConfiguration(observed.VpcConfiguration, desiredVpc)
  276 │           ) {
> 277 │             yield* codeconnections.updateHost({
  278 │               HostArn: observed.HostArn!,
  279 │               ProviderEndpoint: news.providerEndpoint,
  280 │               VpcConfiguration: desiredVpc,
  281 │             });
  282 │             observed = (yield* getByArn(observed.HostArn!)) ?? observed;
  283 │           }

0.72 packages/alchemy/src/AWS/DataExchange/DataSet.ts:129:11
  126 │       /** Get a data set by id; typed not-found → undefined. */
  127 │       const getById = Effect.fn(function* (dataSetId: string) {
  128 │         return yield* dataexchange
> 129 │           .getDataSet({ DataSetId: dataSetId })
  130 │           .pipe(
  131 │             Effect.catchTag("ResourceNotFoundException", () =>
  132 │               Effect.succeed(undefined),
  133 │             ),
  134 │           );
  135 │       });

0.72 packages/alchemy/src/AWS/DataZone/Project.ts:245:15
  242 │             // 2. ENSURE — create (retrying the user-profile propagation
  243 │             //    window right after domain creation).
  244 │             project = yield* retryWhileUserProfilePropagates(
> 245 │               datazone.createProject({
  246 │                 domainIdentifier: domainId,
  247 │                 name,
  248 │                 description: news.description,
  249 │                 glossaryTerms: news.glossaryTerms,
  250 │               }),
  251 │             );

0.72 packages/alchemy/src/AWS/EC2/EIP.ts:221:11
  215 │         read: Effect.fn(function* ({ output }) {
  216 │           const { region, accountId } = yield* AWSEnvironment.current;
  217 │
  218 │           if (!output) return undefined;
  219 │           const result = yield* ec2.describeAddresses({
  220 │             AllocationIds: [output.allocationId],
> 221 │           });
  222 │
  223 │           const address = result.Addresses?.[0];
  224 │           if (!address) {
  225 │             return yield* Effect.fail(
  226 │               new Error(`EIP ${output.allocationId} not found`),
  227 │             );
  228 │           }
  229 │
  230 │           return {
  231 │             allocationId: address.AllocationId as AllocationId,
  232 │             eipArn:
  233 │               `arn:aws:ec2:${region}:${accountId}:elastic-ip/${address.AllocationId}` as EIPArn,
  234 │             publicIp: address.PublicIp!,
  235 │             publicIpv4Pool: address.PublicIpv4Pool,
  236 │             domain: (address.Domain as "vpc" | "standard") ?? "vpc",
  237 │             networkBorderGroup: address.NetworkBorderGroup,
  238 │             customerOwnedIp: address.CustomerOwnedIp,
  239 │             customerOwnedIpv4Pool: address.CustomerOwnedIpv4Pool,
  240 │             carrierIp: address.CarrierIp,
  241 │           } satisfies EIP["Attributes"];
  242 │         }),

0.72 packages/alchemy/src/AWS/EMR/Studio.ts:424:13
  422 │         delete: Effect.fn(function* ({ output }) {
  423 │           yield* emr
> 424 │             .deleteStudio({ StudioId: output.studioId })
  425 │             .pipe(Effect.catchTag("StudioNotFound", () => Effect.void));
  426 │         }),

0.72 packages/alchemy/src/AWS/Personalize/Schema.ts:110:11
  107 │       /** Describe a schema by ARN; typed not-found → undefined. */
  108 │       const describe = Effect.fn(function* (schemaArn: string) {
  109 │         const response = yield* personalize
> 110 │           .describeSchema({ schemaArn })
  111 │           .pipe(
  112 │             Effect.catchTag("ResourceNotFoundException", () =>
  113 │               Effect.succeed(undefined),
  114 │             ),
  115 │           );
  116 │         return response?.schema;
  117 │       });

0.72 packages/alchemy/src/AWS/RedshiftServerless/Workgroup.ts:265:9
  261 │       const applyUpdate = Effect.fn(function* (
  262 │         name: string,
  263 │         patch: Omit<redshiftserverless.UpdateWorkgroupRequest, "workgroupName">,
  264 │       ) {
> 265 │         yield* redshiftserverless.updateWorkgroup({
  266 │           workgroupName: name,
  267 │           ...patch,
  268 │         });
  269 │         return yield* waitForAvailable(name);
  270 │       });

0.72 packages/alchemy/src/AWS/Route53/HostedZone.ts:138:9
  137 │       const findByName = Effect.fn(function* (name: string) {
> 138 │         const response = yield* route53.listHostedZonesByName({
  139 │           DNSName: normalizeName(name),
  140 │           MaxItems: 1,
  141 │         });
  142 │         return (response.HostedZones ?? []).find(
  143 │           (zone) => zone.Name === normalizeName(name),
  144 │         );
  145 │       });

0.72 packages/alchemy/src/AWS/Synthetics/Group.ts:261:13
  257 │         delete: Effect.fn(function* ({ output }) {
  258 │           // The group does not need to be emptied first — deleting a group
  259 │           // never deletes its canaries.
  260 │           yield* synthetics
> 261 │             .deleteGroup({ GroupIdentifier: output.groupName })
  262 │             .pipe(
  263 │               Effect.retry({
  264 │                 while: (e): boolean => e._tag === "ConflictException",
  265 │                 schedule: Schedule.max([
  266 │                   Schedule.fixed("2 seconds"),
  267 │                   Schedule.recurs(8),
  268 │                 ]),
  269 │               }),
  270 │               Effect.catchTag("ResourceNotFoundException", () => Effect.void),
  271 │             );
  272 │         }),

0.72 packages/alchemy/src/AWS/VpcLattice/AuthPolicy.ts:99:9
   96 │       // "no policy" — getAuthPolicy answers with an empty body for the
   97 │       // latter, so treat an absent `policy` as non-existence.
   98 │       const observe = (resourceIdentifier: string) =>
>  99 │         vpclattice.getAuthPolicy({ resourceIdentifier }).pipe(
  100 │           Effect.map((response) =>
  101 │             response.policy === undefined ? undefined : response,
  102 │           ),
  103 │           Effect.catchTag("ResourceNotFoundException", () =>
  104 │             Effect.succeed(undefined),
  105 │           ),
  106 │         );

0.72 packages/alchemy/src/Cloudflare/DNS/Dnssec.ts:261:7
  256 │     read: Effect.fn(function* ({ output, olds }) {
  257 │       const zoneId =
  258 │         output?.zoneId ??
  259 │         (typeof olds?.zoneId === "string" ? olds.zoneId : undefined);
  260 │       if (!zoneId) return undefined;
> 261 │       const observed = yield* dns.getDnssec({ zoneId }).pipe(
  262 │         // Zone deleted out-of-band — DNSSEC config is gone with it.
  263 │         Effect.catchTag("InvalidRoute", () => Effect.succeed(undefined)),
  264 │       );
  265 │       if (observed === undefined) return undefined;
  266 │       if (output !== undefined) {
  267 │         // Owned path — refresh, keeping the captured pre-management state.
  268 │         return toAttributes(zoneId, observed, {
  269 │           status: output.initialStatus,
  270 │           multiSigner: output.initialMultiSigner,
  271 │           presigned: output.initialPresigned,
  272 │           useNsec3: output.initialUseNsec3,
  273 │         });
  274 │       }
  275 │       // Cold read: DNSSEC disabled means "not created" for this resource.
  276 │       if (statusFamily(observed.status) === "disabled") return undefined;
  277 │       // DNSSEC is enabled but we have no state and no ownership markers
  278 │       // exist — gate takeover behind the adopt policy.
  279 │       return Unowned(toAttributes(zoneId, observed, captureInitial(observed)));
  280 │     }),

0.72 packages/alchemy/src/Cloudflare/Email/Address.ts:88:3
  85 │ // so the only reliable way to find an address by its email is to enumerate the
  86 │ // account collection (the same call `list()` exhausts).
  87 │ const findByEmail = (accountId: string, email: string) =>
> 88 │   emailRouting.listAddresses.pages({ accountId }).pipe(
  89 │     Stream.runCollect,
  90 │     Effect.map((chunk) =>
  91 │       Array.from(chunk)
  92 │         .flatMap((page) => page.result ?? [])
  93 │         .map((addr) => toAttrs(accountId, addr))
  94 │         .find((a) => a.email === email),
  95 │     ),
  96 │   );

0.72 packages/alchemy/src/Cloudflare/LoadBalancer/MonitorGroup.ts:181:11
  178 │       // 2. Ensure — missing: create with the full desired body.
  179 │       if (!observed) {
  180 │         const created = yield* loadBalancers.createMonitorGroup({
> 181 │           accountId,
  182 │           description,
  183 │           members,
  184 │         });
  185 │         return toAttributes(created, accountId);
  186 │       }

0.72 packages/alchemy/src/Hetzner/Image.ts:401:9
  399 │     list: Effect.fn(function* () {
  400 │       const items = yield* Hetzner.images.listImages
> 401 │         .items({
  402 │           type: ["snapshot", "backup"],
  403 │           label_selector: alchemyStackSelector,
  404 │           per_page: 50,
  405 │         })
  406 │         .pipe(
  407 │           Stream.runCollect,
  408 │           Effect.map((chunk) => Array.from(chunk)),
  409 │         );
  410 │       return items.map(toAttrs);
  411 │     }),

0.72 packages/alchemy/src/Hetzner/Zone.ts:202:3
  201 │ const getZoneBy = (idOrName: string) =>
> 202 │   Hetzner.zones.getZone({ id_or_name: idOrName }).pipe(
  203 │     Effect.map(({ zone }) => zone),
  204 │     Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  205 │   );

0.72 packages/alchemy/src/Planetscale/MySQL/MySQLPassword.ts:182:9
  169 │     read: Effect.fn(function* ({ output }) {
  170 │       // Adoption (no cached output) is impossible: the PlanetScale API
  171 │       // never re-issues plaintext, so even if we found a matching live
  172 │       // password by listing+name we couldn't deliver the `password`
  173 │       // attribute. Fall through to greenfield create in `reconcile`.
  174 │       if (!output) return undefined;
  175 │
  176 │       // Refresh — verify the cached password still exists and
  177 │       // re-emit the persisted output (with plaintext intact).
  178 │       // If it's gone, return undefined so the engine routes to
  179 │       // reconcile, which will surface the unrecoverable-rotation
  180 │       // condition explicitly.
  181 │       return yield* planetscale
> 182 │         .getPassword({
  183 │           organization: output.organization,
  184 │           database: output.database,
  185 │           branch: output.branch,
  186 │           id: output.id,
  187 │         })
  188 │         .pipe(
  189 │           Effect.map((password) =>
  190 │             buildAttributes(password, output.password, {
  191 │               organization: output.organization,
  192 │               database: output.database,
  193 │               branch: output.branch,
  194 │             }),
  195 │           ),
  196 │           Effect.catchTag("NotFound", () => Effect.succeed(undefined)),
  197 │         );
  198 │     }),

0.72 packages/alchemy/src/Prisma/Internal/AppPromotion.ts:125:3
> 125 │   const observation = yield* getService({ serviceId: appId }).pipe(
  126 │     Effect.map((response) => response.data),
  127 │     Effect.result,
  128 │   );

0.72 packages/alchemy/src/Prisma/Project.ts:525:15
  523 │               // A replayed create would make a second project; the retry
  524 │               // policy cannot see the request, so opt out explicitly.
> 525 │               Retry.none,

0.72 packages/alchemy/test/AWS/CloudTrail/lake-handler.ts:87:11
  86 │         if (request.method === "GET" && pathname === "/query/describe") {
> 87 │           const result = yield* describeQuery({ QueryId: param("id") });
  88 │           return yield* HttpServerResponse.json({
  89 │             status: result.QueryStatus,
  90 │           });
  91 │         }

0.72 packages/alchemy/test/AWS/DefaultVpc.ts:22:3
  21 │ export const getDefaultVpc = Effect.gen(function* () {
> 22 │   const vpcs = yield* EC2.describeVpcs({});
  23 │   const vpc = (vpcs.Vpcs ?? []).find((v) => v.IsDefault);
  24 │   if (!vpc?.VpcId || !vpc.CidrBlock) {
  25 │     // The default VPC can be deleted out of band (e.g. by the account nuke
  26 │     // script). Recreate it, then fail with the retryable marker so the retry
  27 │     // loop below re-describes until it becomes visible. Concurrent test files
  28 │     // racing on the same recreate surface DefaultVpcAlreadyExists — that just
  29 │     // means someone else won the race, so fall through to the retry.
  30 │     yield* EC2.createDefaultVpc({}).pipe(
  31 │       Effect.catchTag("DefaultVpcAlreadyExists", () => Effect.void),
  32 │     );
  33 │     return yield* Effect.fail(new DefaultVpcNotVisible());
  34 │   }
  35 │
  36 │   const [baseAddress, prefixString] = vpc.CidrBlock.split("/");
  37 │   if (prefixString !== "16") {
  38 │     return yield* Effect.fail(
  39 │       new UnsupportedDefaultVpcCidr({ cidrBlock: vpc.CidrBlock }),
  40 │     );
  41 │   }
  42 │
  43 │   const [a, b] = baseAddress.split(".");
  44 │   return {
  45 │     vpcId: VpcId(vpc.VpcId),
  46 │     cidrBlock: vpc.CidrBlock,
  47 │     subnetCidrBlock: (thirdOctet: number) => `${a}.${b}.${thirdOctet}.0/24`,
  48 │   };
  49 │ }).pipe(

0.72 packages/alchemy/test/AWS/Timestream/handler.ts:72:11
  71 │         if (request.method === "GET" && pathname === "/query") {
> 72 │           const result = yield* query({
  73 │             QueryString: `SELECT COUNT(*) AS c FROM "${DatabaseName}"."${TableName}"`,
  74 │           });
  75 │           return yield* HttpServerResponse.json({
  76 │             rows: result.Rows,
  77 │             columns: result.ColumnInfo,
  78 │           });
  79 │         }

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/workflow.ts:33:11
  30 │       const inserted = yield* Cloudflare.Workflows.task(
  31 │         "insert-widget",
  32 │         Effect.gen(function* () {
> 33 │           const [row] = yield* db
  34 │             .insert(Widgets)
  35 │             .values({ id: input.id, name: input.name })
  36 │             .onConflictDoUpdate({
  37 │               target: Widgets.id,
  38 │               set: { name: input.name },
  39 │             })
  40 │             .returning();
  41 │           return row;
  42 │         }).pipe(Effect.orDie),
  43 │       );

0.72 packages/alchemy/test/Cloudflare/Workers/fixtures/worker-worker-binding/binding-async-caller.ts:24:7
  12 │ export default {
  13 │   async fetch(
  14 │     request: Request,
  15 │     env: {
  16 │       TARGET: Service & {
  17 │         greet: (name: string) => Promise<string>;
  18 │       };
  19 │     },
  20 │   ): Promise<Response> {
  21 │     const name = new URL(request.url).searchParams.get("name") ?? "world";
  22 │     try {
  23 │       console.log("async caller calling target");
> 24 │       const greeting = await env.TARGET.greet(name);
  25 │       console.log("async caller got greeting", greeting);
  26 │       return new Response(String(greeting));
  27 │     } catch (err) {
  28 │       console.log("async caller failed", err);
  29 │       const message = err instanceof Error ? err.message : String(err);
  30 │       return new Response(`async caller failed: ${message}`, { status: 500 });
  31 │     }
  32 │   },
  33 │ };

0.72 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:43:13
  39 │       return {
  40 │         fetch: Effect.gen(function* () {
  41 │           const request = yield* HttpServerRequest;
  42 │           if (request.url === "/health") {
> 43 │             yield* cache.ping().pipe(Effect.orDie);
  44 │             return HttpServerResponse.text("ready");
  45 │           }
  46 │           const token = yield* Config.Redacted("LEDGER_TOKEN").pipe(
  47 │             Effect.orDie,
  48 │           );
  49 │           if (
  50 │             request.headers.authorization !== `Bearer ${Redacted.value(token)}`
  51 │           ) {
  52 │             return HttpServerResponse.empty({ status: 401 });
  53 │           }
  54 │           const body = (yield* request.json.pipe(Effect.orDie)) as {
  55 │             operation: keyof typeof scripts;
  56 │             args?: string[];
  57 │           };
  58 │           if (!Object.hasOwn(scripts, body.operation))
  59 │             return HttpServerResponse.empty({ status: 400 });
  60 │           const result = yield* cache
  61 │             .send("EVAL", [scripts[body.operation], 0, ...(body.args ?? [])])
  62 │             .pipe(Effect.orDie);
  63 │           return yield* HttpServerResponse.json({ result });
  64 │         }),
  65 │       };

0.72 packages/alchemy/test/Neon/FunctionRollout.ts:72:7
  69 │ ) =>
  70 │   functionRolloutSamples(
  71 │     Effect.gen(function* () {
> 72 │       const response = yield* HttpClient.get(url, {
  73 │         headers: { "cache-control": "no-cache" },
  74 │       });
  75 │       expect(response.status).toBe(200);
  76 │       const text = yield* response.text;
  77 │       const child = yield* ChildProcess.make("curl", [
  78 │         "--silent",
  79 │         "--show-error",
  80 │         "--fail",
  81 │         "--max-time",
  82 │         "10",
  83 │         "--http1.1",
  84 │         "--noproxy",
  85 │         "*",
  86 │         "-H",
  87 │         "Connection: close",
  88 │         "-H",
  89 │         "Cache-Control: no-cache",
  90 │         url,
  91 │       ]);
  92 │       const [exit, fresh] = yield* Effect.all(
  93 │         [child.exitCode, child.stdout.pipe(Stream.decodeText, Stream.mkString)],
  94 │         { concurrency: "unbounded" },
  95 │       );
  96 │       expect(Number(exit)).toBe(0);
  97 │       return [text, fresh] as const;
  98 │     }),

0.72 packages/alchemy/test/Railway/fixtures/mongo-api.ts:41:9
  30 │   Effect.gen(function* () {
  31 │     const conn = yield* Railway.ConnectMongo(Db);
  32 │
  33 │     return {
  34 │       fetch: Effect.gen(function* () {
  35 │         const request = yield* HttpServerRequest;
  36 │         const path = new URL(request.url, "http://service").pathname;
  37 │         if (path === "/ping") {
  38 │           return yield* HttpServerResponse.json({ ok: true });
  39 │         }
  40 │         const url = yield* conn.connectionString;
> 41 │         const ping = yield* Railway.pingMongo(Redacted.value(url));
  42 │         if (path === "/health" || path === "/") {
  43 │           return yield* HttpServerResponse.json(ping);
  44 │         }
  45 │         return yield* HttpServerResponse.json(ping, { status: 404 });
  46 │       }).pipe(
  47 │         Effect.catch((error) =>
  48 │           HttpServerResponse.json(
  49 │             { ok: false, error: String(error) },
  50 │             { status: 500 },
  51 │           ),
  52 │         ),
  53 │       ),
  54 │     };
  55 │   }).pipe(Effect.provide(Railway.ConnectMongoHttp)),

0.72 packages/cloudflare-runtime/src/core/registry/RegistryProxy.worker.ts:261:5
  249 │   async scheduled(controller: ScheduledController) {
  250 │     const fetcher = this.fetchTarget.resolve();
  251 │     if (!fetcher) {
  252 │       throw new Error(this.notFoundMessage());
  253 │     }
  254 │     const params = new URLSearchParams();
  255 │     if (controller.cron) {
  256 │       params.set("cron", controller.cron);
  257 │     }
  258 │     if (controller.scheduledTime) {
  259 │       params.set("time", String(controller.scheduledTime));
  260 │     }
> 261 │     const response = await fetcher.fetch(
  262 │       `http://localhost/cdn-cgi/handler/scheduled?${params}`,
  263 │     );
  264 │     if (!response.ok) {
  265 │       const body = await response.text();
  266 │       throw new Error(
  267 │         `Scheduled handler returned HTTP ${response.status}: ${body}`,
  268 │       );
  269 │     }
  270 │   }

0.72 packages/frontend-frameworks/src/solidstart/SolidStart.ts:469:11
  466 │       // lazily; we only need the listener to answer).
  467 │       yield* Effect.tryPromise({
  468 │         try: async () => {
> 469 │           const response = await fetch(url, { redirect: "manual" });
  470 │           await response.arrayBuffer().catch(() => {});
  471 │         },
  472 │         catch: (error) =>
  473 │           fail("The dev server did not become reachable", error),
  474 │       }).pipe(
  475 │         Effect.retry({ schedule: Schedule.spaced("250 millis"), times: 40 }),
  476 │       );

0.71 packages/alchemy/src/AWS/AIOps/InvestigationGroup.ts:342:15
  339 │           //    Region's single slot) and is propagated.
  340 │           if (live === undefined) {
  341 │             live = yield* aiops
> 342 │               .createInvestigationGroup({
  343 │                 name,
  344 │                 roleArn: news.roleArn,
  345 │                 retentionInDays: toWireDays(news.retention),
  346 │                 encryptionConfiguration: news.encryptionConfiguration,
  347 │                 tagKeyBoundaries: news.tagKeyBoundaries,
  348 │                 chatbotNotificationChannel: news.chatbotNotificationChannel,
  349 │                 isCloudTrailEventHistoryEnabled:
  350 │                   news.isCloudTrailEventHistoryEnabled,
  351 │                 crossAccountConfigurations: news.crossAccountConfigurations,
  352 │                 tags: desiredTags,
  353 │               })
  354 │               .pipe(
  355 │                 retryWhileRolePropagates,
  356 │                 Effect.flatMap((created) =>
  357 │                   created.arn === undefined
  358 │                     ? observe(name, undefined)
  359 │                     : observeByArn(created.arn),
  360 │                 ),
  361 │                 Effect.catchTag("ConflictException", (error) =>
  362 │                   observe(name, undefined).pipe(
  363 │                     Effect.flatMap((existing) =>
  364 │                       existing === undefined
  365 │                         ? Effect.fail(error)
  366 │                         : Effect.succeed(existing),
  367 │                     ),
  368 │                   ),
  369 │                 ),
  370 │               );

0.71 packages/alchemy/src/AWS/AMP/GetSeriesHttp.ts:13:7
   7 │ export const GetSeriesHttp = Layer.effect(
   8 │   GetSeries,
   9 │   makeAmpWorkspaceHttpBinding({
  10 │     name: "GetSeries",
  11 │     iamActions: ["aps:GetSeries"],
  12 │     makeClient: (send) => (request: GetSeriesRequest) =>
> 13 │       send({
  14 │         method: "GET",
  15 │         path: "api/v1/series",
  16 │         query: {
  17 │           "match[]": request.match,
  18 │           start:
  19 │             request.start !== undefined ? toPromTime(request.start) : undefined,
  20 │           end: request.end !== undefined ? toPromTime(request.end) : undefined,
  21 │         },
  22 │       }).pipe(Effect.map((data) => data as PrometheusSeries[])),
  23 │   }),
  24 │ );

0.71 packages/alchemy/src/AWS/ApiGateway/VpcLink.ts:115:13
  112 │         read: Effect.fn(function* ({ output }) {
  113 │           if (!output?.vpcLinkId) return undefined;
  114 │           const v = yield* ag
> 115 │             .getVpcLink({ vpcLinkId: output.vpcLinkId })
  116 │             .pipe(
  117 │               Effect.catchTag("NotFoundException", () =>
  118 │                 Effect.succeed(undefined),
  119 │               ),
  120 │             );
  121 │           if (!v?.id) return undefined;
  122 │           return snapshotFromVpcLink(v, tagRecord(v.tags));
  123 │         }),

0.71 packages/alchemy/src/AWS/ApiGatewayV2/VpcLink.ts:210:11
  207 │           // 4. RETURN fresh state. Provisioning is asynchronous (~1–2 min);
  208 │           //    the `status` attribute surfaces it rather than blocking the
  209 │           //    deploy on AVAILABLE.
> 210 │           const final = yield* agw2.getVpcLink({
  211 │             VpcLinkId: snapshot.vpcLinkId,
  212 │           });
  213 │           yield* session.note(`Reconciled VPC link ${snapshot.vpcLinkId}`);

0.71 packages/alchemy/src/AWS/AppRegistry/ResourceAssociation.ts:123:11
  120 │     Effect.gen(function* () {
  121 │       const observeApplication = Effect.fn(function* (specifier: string) {
  122 │         return yield* appregistry
> 123 │           .getApplication({ application: specifier })
  124 │           .pipe(
  125 │             Effect.catchTag("ResourceNotFoundException", () =>
  126 │               Effect.succeed(undefined),
  127 │             ),
  128 │           );
  129 │       });

0.71 packages/alchemy/src/AWS/AutoScaling/AutoScalingGroup.ts:322:11
  306 │       const syncTargetGroups = Effect.fn(function* ({
  307 │         autoScalingGroupName,
  308 │         oldTargetGroupArns,
  309 │         newTargetGroupArns,
  310 │       }: {
  311 │         autoScalingGroupName: string;
  312 │         oldTargetGroupArns: string[];
  313 │         newTargetGroupArns: string[];
  314 │       }) {
  315 │         const oldSet = new Set(oldTargetGroupArns);
  316 │         const newSet = new Set(newTargetGroupArns);
  317 │
  318 │         const detached = oldTargetGroupArns.filter((arn) => !newSet.has(arn));
  319 │         const attached = newTargetGroupArns.filter((arn) => !oldSet.has(arn));
  320 │
  321 │         if (detached.length > 0) {
> 322 │           yield* autoscaling.detachLoadBalancerTargetGroups({
  323 │             AutoScalingGroupName: autoScalingGroupName,
  324 │             TargetGroupARNs: detached,
  325 │           } as any);
  326 │         }
  327 │
  328 │         if (attached.length > 0) {
  329 │           yield* autoscaling.attachLoadBalancerTargetGroups({
  330 │             AutoScalingGroupName: autoScalingGroupName,
  331 │             TargetGroupARNs: attached,
  332 │           } as any);
  333 │         }
  334 │       });

0.71 packages/alchemy/src/AWS/Bedrock/KnowledgeBase.ts:182:9
  181 │       const fetchObservedTags = Effect.fn(function* (resourceArn: string) {
> 182 │         return yield* bedrock.listTagsForResource({ resourceArn }).pipe(
  183 │           Effect.map((r) => (r.tags ?? {}) as Record<string, string>),
  184 │           Effect.catchTag("ResourceNotFoundException", () =>
  185 │             Effect.succeed({} as Record<string, string>),
  186 │           ),
  187 │         );
  188 │       });

0.71 packages/alchemy/src/AWS/CloudFront/Distribution.ts:1202:13
  1201 │           yield* cloudfront
> 1202 │             .deleteDistribution({
  1203 │               Id: output.distributionId,
  1204 │               IfMatch: latest.etag,
  1205 │             })
  1206 │             .pipe(Effect.catchTag("NoSuchDistribution", () => Effect.void));

0.71 packages/alchemy/src/AWS/CloudFront/PublicKey.ts:223:15
  220 │           if (!observed) {
  221 │             const callerReference = name;
  222 │             const created = yield* cloudfront
> 223 │               .createPublicKey({
  224 │                 PublicKeyConfig: buildConfig(name, callerReference, news),
  225 │               })
  226 │               .pipe(
  227 │                 Effect.catchTag("PublicKeyAlreadyExists", () =>
  228 │                   getByName(name).pipe(
  229 │                     Effect.flatMap((existing) =>
  230 │                       existing
  231 │                         ? Effect.succeed({
  232 │                             PublicKey: {
  233 │                               Id: existing.id,
  234 │                               CreatedTime: new Date(),
  235 │                               PublicKeyConfig: existing.config,
  236 │                             },
  237 │                             ETag: existing.etag,
  238 │                             Location: undefined,
  239 │                           })
  240 │                         : Effect.fail(
  241 │                             new Error(
  242 │                               `Public key '${name}' already exists but could not be recovered`,
  243 │                             ),
  244 │                           ),
  245 │                     ),
  246 │                   ),
  247 │                 ),
  248 │               );

0.71 packages/alchemy/src/AWS/DataBrew/internal.ts:24:7
  21 │ export const fetchObservedTags = Effect.fn("AWS.DataBrew.fetchObservedTags")(
  22 │   function* (resourceArn: string) {
  23 │     const response = yield* databrew
> 24 │       .listTagsForResource({ ResourceArn: resourceArn })
  25 │       .pipe(Effect.catch(() => Effect.succeed({ Tags: undefined })));
  26 │     return cleanMap(response.Tags);
  27 │   },
  28 │ );

0.71 packages/alchemy/src/AWS/DocDBElastic/Cluster.ts:241:9
  237 │       const readTags = Effect.fn(function* (arn: string) {
  238 │         const response = yield* docdbelastic
  239 │           .listTagsForResource({ resourceArn: arn })
  240 │           .pipe(Effect.catch(() => Effect.succeed(undefined)));
> 241 │         return toTagRecord(response?.tags);
  242 │       });

0.71 packages/alchemy/src/AWS/EC2/EgressOnlyInternetGateway.ts:301:15
  298 │           // Sync tags — observed cloud tags vs desired.
  299 │           const currentTags =
  300 │             (yield* ec2
> 301 │               .describeTags({
  302 │                 Filters: [
  303 │                   { Name: "resource-id", Values: [eigwId] },
  304 │                   {
  305 │                     Name: "resource-type",
  306 │                     Values: ["egress-only-internet-gateway"],
  307 │                   },
  308 │                 ],
  309 │               })
  310 │               .pipe(
  311 │                 Effect.map(
  312 │                   (r) =>
  313 │                     Object.fromEntries(
  314 │                       r.Tags?.map((t) => [t.Key!, t.Value!]) ?? [],
  315 │                     ) as Record<string, string>,
  316 │                 ),
  317 │               )) ?? {};

0.71 packages/alchemy/src/AWS/EC2/Subnet.ts:481:13
  478 │           // and only call modifySubnetAttribute on real drift.
  479 │           const desiredMapPublicIp = news.mapPublicIpOnLaunch ?? false;
  480 │           if ((subnet.MapPublicIpOnLaunch ?? false) !== desiredMapPublicIp) {
> 481 │             yield* ec2.modifySubnetAttribute({
  482 │               SubnetId: subnetId,
  483 │               MapPublicIpOnLaunch: { Value: desiredMapPublicIp },
  484 │             });
  485 │             yield* session.note(
  486 │               `Updated map public IP on launch: ${desiredMapPublicIp}`,
  487 │             );
  488 │           }

0.71 packages/alchemy/src/AWS/ElastiCache/SubnetGroup.ts:66:11
  64 │       const readGroup = Effect.fn(function* (name: string) {
  65 │         const response = yield* elasticache
> 66 │           .describeCacheSubnetGroups({ CacheSubnetGroupName: name })
  67 │           .pipe(
  68 │             Effect.catchTag("CacheSubnetGroupNotFoundFault", () =>
  69 │               Effect.succeed(undefined),
  70 │             ),
  71 │           );
  72 │         return response?.CacheSubnetGroups?.[0];
  73 │       });

0.71 packages/alchemy/src/AWS/IoTWireless/internal.ts:11:3
  10 │ export const readIotWirelessTags = (arn: string) =>
> 11 │   iotw.listTagsForResource({ ResourceArn: arn }).pipe(
  12 │     Effect.map((r) => tagRecord(r.Tags ?? [])),
  13 │     Effect.catch(() => Effect.succeed<Record<string, string>>({})),
  14 │   );

0.71 packages/alchemy/src/AWS/Lambda/Permission.ts:161:9
  158 │         functionName: string,
  159 │         statementId: string,
  160 │       ) {
> 161 │         const { Policy } = yield* Lambda.getPolicy({
  162 │           FunctionName: functionName,
  163 │         }).pipe(
  164 │           // A function without a resource policy is reported as not found.
  165 │           Effect.catchTag("ResourceNotFoundException", () =>
  166 │             Effect.succeed({ Policy: undefined }),
  167 │           ),
  168 │         );

0.71 packages/alchemy/src/AWS/MemoryDB/SubnetGroup.ts:195:13
  194 │           if (mutated) {
> 195 │             const response = yield* memorydb.updateSubnetGroup(update);
  196 │             observed = response.SubnetGroup ?? observed;
  197 │           }

0.71 packages/alchemy/src/Cloudflare/DNS/AcmeDnsSolver.ts:77:9
  73 │     present: (record) =>
  74 │       Effect.gen(function* () {
  75 │         const existing = yield* matching(record);
  76 │         if (existing.length > 0) return;
> 77 │         yield* dns.createRecord({
  78 │           zoneId,
  79 │           type: "TXT",
  80 │           name: record.fqdn,
  81 │           content: record.value,
  82 │           ttl: CHALLENGE_TTL,
  83 │         });
  84 │       }).pipe(
  85 │         Effect.mapError(solverError(`Could not publish TXT ${record.fqdn}`)),
  86 │       ),

0.71 packages/alchemy/src/Cloudflare/Email/SendingSubdomain.ts:215:9
  212 │       //    guarantee: a missing subdomain falls through to the name scan
  213 │       //    and then to create.
  214 │       let observed = output?.subdomainId
> 215 │         ? yield* getSubdomain(zoneId, output.subdomainId)
  216 │         : undefined;

0.71 packages/alchemy/src/Cloudflare/Images/Variant.ts:381:3
  379 │ const toAttributes = (
  380 │   variant: ObservedVariant,
> 381 │   accountId: string,
  382 │ ): VariantAttributes => ({
  383 │   variantName: variant.id,
  384 │   accountId,
  385 │   // Distilled widens generated string enums to open unions (`string & {}`).
  386 │   fit: variant.options.fit as VariantFit,
  387 │   width: variant.options.width,
  388 │   height: variant.options.height,
  389 │   metadata: variant.options.metadata as VariantMetadata,
  390 │   neverRequireSignedURLs: variant.neverRequireSignedURLs ?? false,
  391 │ });

0.71 packages/alchemy/src/Cloudflare/Pages/Deployment.ts:249:9
  246 │       //    immutable, so there is no sync step beyond waiting for the
  247 │       //    pipeline to finish; an empty manifest means no assets to upload.
  248 │       if (!observed) {
> 249 │         observed = yield* pages.createProjectDeployment({
  250 │           accountId,
  251 │           projectName,
  252 │           branch: news.branch,
  253 │           manifest: "{}",
  254 │         });
  255 │       }

0.71 packages/alchemy/src/Cloudflare/R2/BucketEventNotification.ts:411:13
  408 │           const jurisdiction = (bucket.jurisdiction ??
  409 │             "default") as Bucket.Jurisdiction;
  410 │           return r2
> 411 │             .listBucketEventNotifications({
  412 │               accountId,
  413 │               bucketName,
  414 │               jurisdiction,

0.71 packages/alchemy/src/Cloudflare/R2/DataCatalog.ts:256:7
  251 │     list: Effect.fn(function* () {
  252 │       const { accountId } = yield* yield* CloudflareEnvironment;
  253 │       // R2 Data Catalog is an account-scoped collection: one warehouse per
  254 │       // bucket that has the catalog enabled. Only `active` warehouses map to
  255 │       // a live resource — `read` treats `inactive` (disabled) as gone.
> 256 │       return yield* rdc.listR2DataCatalogs({ accountId }).pipe(
  257 │         Effect.map(({ warehouses }) =>
  258 │           warehouses
  259 │             .filter((w) => w.status === "active")
  260 │             .map((w) => toAttributes(w, accountId)),
  261 │         ),
  262 │         // Accounts without R2 Data Catalog access reject the route entirely.
  263 │         Effect.catchTag("InvalidRoute", () => Effect.succeed([])),
  264 │       );
  265 │     }),

0.71 packages/alchemy/src/Cloudflare/Vectorize/VectorizeIndex.ts:192:7
  189 │       // Observe — read the live index by name. The name is the stable
  190 │       // identifier; fall back through a NotFound to the create path so
  191 │       // we recover from out-of-band deletes or partial state-persistence.
> 192 │       let observed = yield* vectorize
  193 │         .getIndex({
  194 │           accountId,
  195 │           indexName,
  196 │         })
  197 │         .pipe(
  198 │           Effect.catchTag(["NotFound", "Gone"], () =>
  199 │             Effect.succeed(undefined),
  200 │           ),
  201 │         );

0.71 packages/alchemy/src/Fly/Certificate.ts:321:5
  319 │ const getByHostname = (appName: string, hostname: string) =>
  320 │   machines
> 321 │     .getAppCertificate({ app_name: appName, hostname })
  322 │     .pipe(Effect.catchTag("NotFound", () => Effect.succeed(undefined)));

0.71 packages/alchemy/src/Fly/Secret.ts:363:9
  361 │       let createdThisRun = false;
  362 │       if (current === undefined) {
> 363 │         yield* machines
  364 │           .createSecret({
  365 │             app_name: appName,
  366 │             secret_name: name,
  367 │             value: desiredPlain,
  368 │           })
  369 │           .pipe(Effect.catchTag("Conflict", () => Effect.void));
  370 │         current = yield* getByName(appName, name);
  371 │         createdThisRun = true;
  372 │       }

0.71 packages/alchemy/src/Fly/SecretKey.ts:249:5
  242 │ const putKey = (input: {
  243 │   appName: string;
  244 │   secretName: string;
  245 │   type: string | undefined;
  246 │   value: ReadonlyArray<number> | undefined;
  247 │ }) => {
  248 │   if (input.value !== undefined) {
> 249 │     return machines.setSecretKey({
  250 │       app_name: input.appName,
  251 │       secret_name: input.secretName,
  252 │       type: input.type,
  253 │       value: [...input.value],
  254 │     });
  255 │   }
  256 │   return machines.generateSecretKey({
  257 │     app_name: input.appName,
  258 │     secret_name: input.secretName,
  259 │     type: input.type,
  260 │   });
  261 │ };

0.71 packages/alchemy/src/Hetzner/Server.ts:722:5
  720 │ const getByName = (name: string) =>
  721 │   Hetzner.servers
> 722 │     .listServers({ name, per_page: 50 })
  723 │     .pipe(
  724 │       Effect.map(({ servers }) => servers.find((item) => item.name === name)),
  725 │     );

0.71 packages/alchemy/src/Neon/BranchScope.ts:57:5
  54 │   let cursor: string | undefined;
  55 │   const seen = new Set<string>();
  56 │   do {
> 57 │     const page = yield* listProjectBranches({ project_id: projectId, cursor });
  58 │     const branch = page.branches.find((branch) => branch.default);
  59 │     if (branch) return { projectId, branchId: branch.id };
  60 │     cursor = page.pagination?.next;
  61 │     if (cursor && seen.has(cursor)) {
  62 │       return yield* new InvalidBranchScope({
  63 │         message: "Branch pagination repeated a cursor",
  64 │       });
  65 │     }
  66 │     if (cursor) seen.add(cursor);
  67 │   } while (cursor);

0.71 packages/alchemy/src/Prisma/Internal/DatabaseSecrets.ts:157:5
  154 │   const rotated = yield* createConnectionRotate({ id: connectionId }).pipe(
  155 │     // Rotation mints new credentials; a replay would revoke the ones we
  156 │     // just persisted, so opt out of the retry policy.
> 157 │     Retry.none,
  158 │     Effect.map((response) => response.data),
  159 │   );

0.71 packages/alchemy/test/AWS/OpenSearchServerless/index-bindings-handler.ts:97:11
   96 │         if (request.method === "GET" && pathname === "/collection") {
>  97 │           const detail = yield* getCollection();
   98 │           return yield* HttpServerResponse.json({
   99 │             id: detail?.id,
  100 │             status: detail?.status,
  101 │             endpoint: detail?.collectionEndpoint,
  102 │           });
  103 │         }

0.71 packages/alchemy/test/Cloudflare/D1/fixtures/drizzle-worker.ts:79:11
  77 │         // GET /sql/users — the raw @effect/sql-d1 client.
  78 │         if (request.method === "GET" && request.url === "/sql/users") {
> 79 │           const rows = yield* sql`SELECT id, name, email FROM users`;
  80 │           return yield* HttpServerResponse.json({ rows });
  81 │         }

0.71 packages/alchemy/test/Cloudflare/Workers/fixtures/rpc-websocket-client/browser.ts:23:5
  20 │ export const echo = (value: string) =>
  21 │   Effect.gen(function* () {
  22 │     const client = yield* BrowserClient;
> 23 │     return yield* client.echo({ value });
  24 │   }).pipe(Effect.provide(clientLayer));

0.71 packages/alchemy/test/Neon/fixtures/backend-effect.ts:44:15
  41 │         if (request.url === "/data-foreign-origin") {
  42 │           const rejected = yield* data
  43 │             .execute(
> 44 │               HttpClientRequest.get("https://example.com/"),
  45 │               Redacted.make("invalid-end-user-token"),
  46 │             )
  47 │             .pipe(
  48 │               Effect.as(false),
  49 │               Effect.catchTag("DataApiRequestError", () =>
  50 │                 Effect.succeed(true),
  51 │               ),
  52 │             );
  53 │           return yield* HttpServerResponse.json({ rejected });
  54 │         }

0.71 packages/frontend-frameworks/src/react-router/ReactRouter.ts:490:9
  487 │     // lazily; we only need the listener to answer).
  488 │     yield* Effect.tryPromise({
  489 │       try: async () => {
> 490 │         const response = await fetch(url, { redirect: "manual" });
  491 │         await response.arrayBuffer().catch(() => {});
  492 │       },
  493 │       catch: (error) => fail("The dev server did not become reachable", error),
  494 │     }).pipe(
  495 │       Effect.retry({ schedule: Schedule.spaced("250 millis"), times: 40 }),
  496 │     );
```
