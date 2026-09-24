# services/memoize-parameterized-layers

The result of a parameterized layer constructor must be stored in a module constant before it is used in more than one place, never constructed again for each use.

2 findings, from 0.74 down to 0.71. Each showed this hint:

```ts
const postgresLayer = Postgres.layer({ url: "postgres://localhost/mydb", poolSize: 10 });

const goodAppLayer = Layer.merge(
  UserRepo.layer.pipe(Layer.provide(postgresLayer)),
  OrderRepo.layer.pipe(Layer.provide(postgresLayer)),
);
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.74 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:84:13
  78 │       return {
  79 │         inspect,
  80 │         addUser: (name: string) =>
  81 │           db.insert(users).values({ name }).pipe(Effect.asVoid),
  82 │         repeat: () =>
  83 │           Effect.gen(function* () {
> 84 │             yield* Drizzle.DurableObject({ migrations: snapshot, relations });
  85 │             yield* snapshot.apply();
  86 │             return yield* inspect();
  87 │           }).pipe(Effect.provideService(Cloudflare.DurableObjectState, state)),
  88 │         reset: () =>
  89 │           state.abort("sql migration reactivation", { retryAlarm: false }),
  90 │       };

0.71 packages/alchemy/test/types/Agent.ts:34:7
  18 │ const _gen = Effect.gen(function* () {
  19 │   // bind the Sandbox Container to the Agent DO
  20 │   const sandbox = yield* Sandbox;
  21 │
  22 │   return Effect.gen(function* () {
  23 │     const state = yield* Cloudflare.DurableObjectState;
  24 │
  25 │     // get the container instance
  26 │     sandbox.getTcpPort(1080);
  27 │     sandbox.getUser();
  28 │
  29 │     return {
  30 │       getProfile: () => state.storage.get<string>("Profile"),
  31 │     };
  32 │   }).pipe(
  33 │     Effect.provide(
> 34 │       Cloudflare.Containers.layer(Sandbox, {
  35 │         enableInternet: true,
  36 │       }),
  37 │     ),
  38 │   );
  39 │ });
```
