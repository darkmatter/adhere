# services/methods-have-no-requirements

Service method signatures must have no requirements. Dependencies must be acquired inside the layer, never declared on the method.

Since left out of the preset, for Effect's language service to check (4ae0126).

13 findings, from 0.93 down to 0.71. Each showed this hint:

```ts
class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<unknown[]>;
    readonly execute: (sql: string) => Effect.Effect<void>;
  }
>()("@app/Database") {}
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.93 packages/alchemy/src/AWS/Assets.ts:61
     ) => Effect.Effect<string, AssetsError, AssetsRequirements>;
0.83 packages/alchemy/src/Kubernetes/ClusterAdapter.ts:301
     ) => Effect.Effect<void, any, AdapterLifecycleServices>;
0.80 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/env-binding.ts:29
     bucket: Bucket,
0.77 packages/alchemy/src/AWS/Lambda/ScheduleEventSource.ts:54
     process: (event: ScheduleEvent) => Effect.Effect<void, never, Req>,
0.77 packages/alchemy/src/Cloudflare/Workers/CronEventSource.ts:207
     ): Effect.Effect<void, never, CronEventSource | Exclude<Req, RuntimeContext>> =>
0.77 packages/alchemy/src/Provider.ts:221
     list(): Effect.Effect<Res["Attributes"][], any, ListReq>;
0.77 packages/alchemy/test/Cloudflare/Workers/CronEventSource.types.ts:8
     { run: Effect.Effect<void, never, RuntimeContext> }
0.75 packages/alchemy/src/Binding.ts:106
     ? Output.ToOutput<A, Self | Effect.Services<ReturnType<Shape>> | R2 | Req>
0.75 packages/cloudflare-runtime/src/core/PluginContext.ts:26
     ) => Effect.Effect<void, RuntimeError, Scope.Scope>;
0.73 packages/alchemy/src/AWS/Lambda/DocDBClusterEventSource.ts:32
     ) => Effect.Effect<void, never, Req>,
0.72 packages/alchemy/src/AWS/Lambda/GetMicrovmImageBuild.ts:24
     image: MicrovmImage,
0.71 packages/alchemy/src/AWS/Lambda/GetMicrovmImage.ts:29
     image: MicrovmImage,
0.71 packages/alchemy/src/AWS/PaymentCryptography/TranslateKeyMaterial.ts:48
     ...keys: readonly [Key, ...Key[]]
```
