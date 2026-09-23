# config/business-logic-depends-on-config-service

Business logic must depend on a config service. Config primitives must be read only inside that service's layer, never in business logic.

4 findings, from 0.79 down to 0.73. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.79 packages/alchemy/scripts/cleanup-neon-projects.ts:26
     const DRY_RUN = process.env.DRY_RUN === "1";
0.78 packages/alchemy/src/Alchemist/routes/nuke.ts:55
     const debug = yield* Config.String("DEBUG").pipe(
0.74 packages/frontend-frameworks/fixtures/tanstack-start/src/db.ts:16
     const url = yield* Config.Redacted("TEST_POSTGRES_URL");
0.73 packages/alchemy/src/Auth/Demand.ts:283
     const ci = yield* Config.Boolean("CI").pipe(Config.withDefault(false));
```
