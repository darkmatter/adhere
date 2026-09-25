# alchemy/apis/match-remote-errors-by-tag

Errors that crossed RPC or a workflow replay must be matched by their tag and data fields, never with instanceof, prototype methods, or object identity, which do not survive serialization, and RPC arguments must be serializable values, never functions or class instances.

1 finding, at 0.84. It showed this hint:

```ts
const value = yield* stub.get(key).pipe(
  Effect.catchTag("KeyMissing", (error) => Effect.succeed(`missing: ${error.key}`)),
);
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/do-abort/abort-worker.ts:88:17
  85 │             Effect.catchCause((cause) => {
  86 │               const error = Cause.squash(cause);
  87 │               const native =
> 88 │                 error instanceof Cloudflare.RpcCallError
  89 │                   ? error.cause
  90 │                   : undefined;
```
