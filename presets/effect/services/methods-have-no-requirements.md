---
description: Service method signatures have no requirements. Dependencies are acquired inside the layer, not declared on the method.
---

```ts
class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<unknown[]>
    readonly execute: (sql: string) => Effect.Effect<void>
  }
>()("@app/Database") {}
```
