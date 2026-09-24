---
description: Errors that crossed RPC or a workflow replay must be matched by their tag and data fields, never with instanceof, prototype methods, or object identity, which do not survive serialization, and RPC arguments must be serializable values, never functions or class instances.
---

```ts must
const value = yield* stub.get(key).pipe(
  Effect.catchTag("KeyMissing", (error) => Effect.succeed(`missing: ${error.key}`)),
);
```

```ts never
const value = yield* stub.get(key).pipe(
  Effect.catchAll((error) => (error instanceof KeyMissing ? Effect.succeed("missing") : Effect.fail(error))),
);
```
