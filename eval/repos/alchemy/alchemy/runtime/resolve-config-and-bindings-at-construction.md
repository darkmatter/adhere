# alchemy/runtime/resolve-config-and-bindings-at-construction

In a Worker, Function, or Service, Config values and binding factories must be yielded in the outer construction Effect and captured for the handlers, never yielded for the first time inside fetch or another request handler, which does not run at deploy time, so nothing gets bound.

8 findings, from 0.94 down to 0.75. Each showed this hint:

```ts
export default Cloudflare.Worker("Api", { main: import.meta.url },
  Effect.gen(function* () {
    const apiKey = yield* Config.Redacted("API_KEY");
    const bucket = yield* Cloudflare.R2.ReadBucket(Uploads);
    return {
      fetch: Effect.gen(function* () {
        const object = yield* bucket.get("report.json");
        return HttpServerResponse.text(Redacted.value(apiKey).slice(0, 4));
      }),
    };
  }),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.94 packages/alchemy/test/Fly/fixtures/bluegreen-worker-ledger.ts:46:11
  39 │       return {
  40 │         fetch: Effect.gen(function* () {
  41 │           const request = yield* HttpServerRequest;
  42 │           if (request.url === "/health") {
  43 │             yield* cache.ping().pipe(Effect.orDie);
  44 │             return HttpServerResponse.text("ready");
  45 │           }
> 46 │           const token = yield* Config.Redacted("LEDGER_TOKEN").pipe(
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

0.89 packages/alchemy/test/Fly/fixtures/bluegreen-runtime-secrets/writer.ts:63:13
  62 │           return yield* Effect.gen(function* () {
> 63 │             const trigger = yield* Config.Redacted(TRIGGER_SECRET);

0.89 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:16:5
  14 │ export const fetchSql = () =>
  15 │   Effect.gen(function* () {
> 16 │     const url = yield* Config.Redacted("TEST_POSTGRES_URL");
  17 │     const client = yield* PgClient.make({ url });
  18 │     const result = yield* client`SELECT 1`;
  19 │     return result;
  20 │   }).pipe(Effect.provide(services), Effect.scoped, Effect.runPromise);

0.87 packages/alchemy/test/Fly/fixtures/bluegreen-api.ts:49:11
  47 │       return {
  48 │         fetch: Effect.gen(function* () {
> 49 │           const version = yield* Config.String("VERSION").pipe(Effect.orDie);
  50 │           const request = yield* HttpServerRequest;
  51 │           if (request.url.startsWith("/health"))
  52 │             return HttpServerResponse.text("ok");
  53 │           if (request.url.startsWith("/active"))
  54 │             return HttpServerResponse.text(String(yield* Ref.get(active)));
  55 │           if (request.url.startsWith("/slow")) {
  56 │             yield* Ref.update(active, (count) => count + 1);
  57 │             yield* Effect.sleep("60 seconds").pipe(
  58 │               Effect.ensuring(Ref.update(active, (count) => count - 1)),
  59 │             );
  60 │             return HttpServerResponse.text(
  61 │               `${version}:${shutdown.received ? "drained" : "not-signaled"}`,
  62 │             );
  63 │           }
  64 │           return HttpServerResponse.text(version);
  65 │         }),
  66 │       };

0.83 packages/alchemy/test/Neon/fixtures/function-effect.ts:118:5
  117 │   Effect.gen(function* () {
> 118 │     const message = yield* Config.String("FUNCTION_MESSAGE").pipe(
  119 │       Config.withDefault("effect"),
  120 │     );

0.81 packages/alchemy/test/Cloudflare/Workers/fixtures/env/effect.ts:134:15
  127 │             return {
  128 │               CONFIG_STR: yield* Config.String("CONFIG_STR"),
  129 │               CONFIG_NUM: yield* Config.Number("CONFIG_NUM"),
  130 │               // Combinators re-apply at runtime against the bound source.
  131 │               CONFIG_NUM_WITH_DEFAULT: yield* Config.Number("CONFIG_NUM").pipe(
  132 │                 Config.withDefault(999),
  133 │               ),
> 134 │               // Never read during Init, so never bound — the default applies.
  135 │               CONFIG_UNSET_WITH_DEFAULT: yield* Config.Number(
  136 │                 "CONFIG_UNSET",
  137 │               ).pipe(Config.withDefault(3000)),
  138 │               CONFIG_ALL_OBJ: {
  139 │                 str: allObj.str,
  140 │                 num: allObj.num,
  141 │                 redacted: Redacted.value(allObj.redacted),
  142 │                 redactedIsRedacted: Redacted.isRedacted(allObj.redacted),
  143 │               },
  144 │               CONFIG_ALL_TUPLE: yield* Config.all([
  145 │                 Config.String("CONFIG_STR"),
  146 │                 Config.Number("CONFIG_NUM"),
  147 │               ]),
  148 │               CONFIG_NESTED_HOST: yield* Config.String("HOST").pipe(
  149 │                 Config.nested("CONFIG_NESTED"),
  150 │               ),
  151 │             };

0.80 packages/frontend-frameworks/fixtures/waku-durable-objects/src/pages/_api/counter.ts:8:3
   5 │ // custom worker entry (src/worker-entry.ts).
   6 │
   7 │ export const GET = async (): Promise<Response> => {
>  8 │   const namespace = await counterNamespace();
   9 │   if (!namespace)
  10 │     return Response.json({ error: "COUNTER binding missing" }, { status: 500 });
  11 │   return Response.json({ count: await namespace.getByName("fixture").get() });
  12 │ };

0.75 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-traced-worker.ts:43:11
  40 │         // polls this route until it reports 200 before asserting on
  41 │         // exported telemetry.
  42 │         if (url.pathname === "/probe") {
> 43 │           const endpoint = yield* Config.String("COLLECTOR_URL").pipe(
  44 │             Effect.orDie,
  45 │           );
  46 │           const result = yield* Effect.tryPromise(() =>
  47 │             fetch(`${endpoint}/v1/traces`, {
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
```
