---
description: The result of a parameterized layer constructor must be stored in a module constant before it is used in more than one place, never constructed again for each use.
---

## Must

```ts
const postgresLayer = Postgres.layer({ url: "postgres://localhost/mydb", poolSize: 10 });

const goodAppLayer = Layer.merge(
  UserRepo.layer.pipe(Layer.provide(postgresLayer)),
  OrderRepo.layer.pipe(Layer.provide(postgresLayer)),
);
```

## Never

```ts
const Live = Layer.merge(
  Sessions.layer.pipe(Layer.provide(Redis.layer({ host: "localhost" }))),
  RateLimits.layer.pipe(Layer.provide(Redis.layer({ host: "localhost" }))),
);
```
