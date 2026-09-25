---
description: Only a null session may be treated as anonymous; a failed session lookup must stay in the error channel or map to a server error, never be collapsed into signed out.
---

## Must

```ts
const session = yield* auth.getSession().pipe(
  Effect.mapError(() => new AuthenticationUnavailable()),
);
if (session === null) return yield* Effect.fail(new Unauthorized());
```

## Never

```ts
const session = yield* auth.getSession().pipe(Effect.orElseSucceed(() => null));
if (session === null) return yield* Effect.fail(new Unauthorized());
```
