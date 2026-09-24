---
description: The acting user must come from the session or token verified in that request, never from an ID in the request body, query, or headers, and never from a user cached in a process-wide layer.
---

```ts must
const session = yield* auth.getSession();
if (session === null) return yield* Effect.fail(new Unauthorized());
const rows = yield* sql`SELECT * FROM uploads WHERE owner_id = ${session.user.id}`;
```

```ts never
const { ownerId } = yield* HttpServerRequest.schemaBodyJson(Schema.Struct({ ownerId: Schema.String }));
const rows = yield* sql`SELECT * FROM uploads WHERE owner_id = ${ownerId}`;
```
