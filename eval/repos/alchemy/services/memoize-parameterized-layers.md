# services/memoize-parameterized-layers

The result of a parameterized layer constructor must be stored in a module constant before it is used in more than one place, never constructed again for each use.

2 findings, from 0.80 down to 0.77. Each showed this hint:

```ts
const postgresLayer = Postgres.layer({ url: "postgres://localhost/mydb", poolSize: 10 });

const goodAppLayer = Layer.merge(
  UserRepo.layer.pipe(Layer.provide(postgresLayer)),
  OrderRepo.layer.pipe(Layer.provide(postgresLayer)),
);
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.80 packages/alchemy/test/types/Agent.ts:34
     Cloudflare.Containers.layer(Sandbox, {
0.77 packages/alchemy/test/Cloudflare/Workers/fixtures/sql-migrations/object.ts:84
     yield* Drizzle.DurableObject({ migrations: snapshot, relations });
```
