---
description: SQL must pass values as parameters, through tagged-template interpolation, sql.in, sql.insert, or prepare().bind(), never by string concatenation or a template string handed to an unsafe or raw API.
---

```ts must
const user = yield* sql`SELECT * FROM users WHERE email = ${email}`;
const row = yield* Effect.promise(() => d1.prepare("SELECT * FROM users WHERE id = ?").bind(id).first());
```

```ts never
const user = yield* sql.unsafe(`SELECT * FROM users WHERE email = '${email}'`);
const row = yield* Effect.promise(() => d1.prepare("SELECT * FROM users WHERE id = " + id).first());
```
