# services/memoize-parameterized-layers

Calling the same parameterized layer constructor twice breaks the rule.
Storing it in a constant follows it, next to a constructor called inline once.

```ts breaks
import { Layer } from "effect";
import { OrderRepo } from "./OrderRepo.ts";
import { Postgres } from "./Postgres.ts";
import { UserRepo } from "./UserRepo.ts";

export const RepoLayer = Layer.mergeAll(
  UserRepo.layer.pipe(
    Layer.provide(Postgres.layer({ url: "postgres://localhost/shop", poolSize: 10 })),
  ),
  OrderRepo.layer.pipe(
    Layer.provide(Postgres.layer({ url: "postgres://localhost/shop", poolSize: 10 })),
  ),
);
```

```ts follows
import { Layer } from "effect";
import { AuditLog } from "./AuditLog.ts";
import { OrderRepo } from "./OrderRepo.ts";
import { Postgres } from "./Postgres.ts";
import { Redis } from "./Redis.ts";
import { UserRepo } from "./UserRepo.ts";

const PostgresLive = Postgres.layer({ url: "postgres://localhost/shop", poolSize: 10 });

export const RepoLayer = Layer.mergeAll(
  UserRepo.layer.pipe(Layer.provide(PostgresLive)),
  OrderRepo.layer.pipe(Layer.provide(PostgresLive)),
  AuditLog.layer.pipe(Layer.provide(Redis.layer({ url: "redis://localhost:6379" }))),
);
```
