---
description: Service method signatures must have no requirements. Dependencies must be acquired inside the layer, never declared on the method.
---

```ts must
class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<unknown[]>;
    readonly execute: (sql: string) => Effect.Effect<void>;
  }
>()("@app/Database") {}
```

```ts never
class Orders extends Context.Service<
  Orders,
  { readonly save: (order: Order) => Effect.Effect<void, SaveError, Database> }
>()("@app/Orders") {}
```
