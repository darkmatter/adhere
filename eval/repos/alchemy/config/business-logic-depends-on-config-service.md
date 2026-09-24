# config/business-logic-depends-on-config-service

Business logic must depend on a config service. Config primitives must be read only inside that service's layer, never in business logic.

5 findings, from 0.79 down to 0.72. Each showed this hint:

```ts
class ApiConfig extends Context.Service<
  ApiConfig,
  {
    readonly apiKey: Redacted.Redacted;
    readonly baseUrl: string;
  }
>()("@app/ApiConfig") {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function* () {
      const apiKey = yield* Config.redacted("API_KEY");
      const baseUrl = yield* Config.string("API_BASE_URL");
      return { apiKey, baseUrl };
    }),
  );
}
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.79 packages/alchemy/scripts/cleanup-neon-projects.ts:26:1
  23 │ import * as Stream from "effect/Stream";
  24 │ import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
  25 │
> 26 │ const DRY_RUN = process.env.DRY_RUN === "1";
  27 │ const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 4));

0.79 packages/alchemy/src/Alchemist/routes/nuke.ts:55:3
  52 │   input: ScanInput,
  53 │ ) {
  54 │   const report = withSpanEvents(yield* Progress);
> 55 │   const debug = yield* Config.String("DEBUG").pipe(
  56 │     Config.withDefault(""),
  57 │     Effect.map((value) => value.length > 0),
  58 │   );

0.73 packages/alchemy/src/Auth/Demand.ts:283:5
  282 │     if (registry === undefined || profile === undefined) return;
> 283 │     const ci = yield* Config.Boolean("CI").pipe(Config.withDefault(false));

0.72 packages/alchemy/src/AWS/EC2/ClientVpnWait.ts:26:5
  21 │ export const retryClientVpn = <A, E, R>(
  22 │   effect: Effect.Effect<A, E, R>,
  23 │   whilePending: (error: E) => boolean,
  24 │ ) =>
  25 │   Effect.gen(function* () {
> 26 │     const duration = yield* timeout;
  27 │     return yield* effect.pipe(
  28 │       Effect.retry({
  29 │         while: whilePending,
  30 │         schedule: Schedule.spaced("5 seconds").pipe(
  31 │           Schedule.upTo({ duration }),
  32 │         ),
  33 │       }),
  34 │     );
  35 │   });

0.72 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:16:5
  14 │ export const fetchSql = () =>
  15 │   Effect.gen(function* () {
> 16 │     const url = yield* Config.Redacted("TEST_POSTGRES_URL");
  17 │     const client = yield* PgClient.make({ url });
  18 │     const result = yield* client`SELECT 1`;
  19 │     return result;
  20 │   }).pipe(Effect.provide(services), Effect.scoped, Effect.runPromise);
```
