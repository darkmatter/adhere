---
description: The result of a parameterized layer constructor is stored in a module constant before it is used in more than one place.
---

```ts
const postgresLayer = Postgres.layer({ url: "postgres://localhost/mydb", poolSize: 10 })

const goodAppLayer = Layer.merge(
  UserRepo.layer.pipe(Layer.provide(postgresLayer)),
  OrderRepo.layer.pipe(Layer.provide(postgresLayer))
)
```
