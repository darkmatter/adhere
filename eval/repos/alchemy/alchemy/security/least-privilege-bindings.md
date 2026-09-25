# alchemy/security/least-privilege-bindings

A runtime should bind the narrowest capability its calls need, a Read or Write binding when it only reads or only writes, and should not bind ReadWrite for one-sided use.

1 finding, at 0.89. It showed this hint:

```ts
const bucket = yield* Cloudflare.R2.ReadBucket(Uploads);
return { fetch: Effect.gen(function* () { return yield* bucket.get("report.json"); }) };
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.89 packages/alchemy/test/Cloudflare/Container/fixtures/effectful/container.ts:38:5
  35 │     // FIRST registration site (the container layer builds before the stack
  36 │     // body), so the DO's later undecorated native-binding site inherits the
  37 │     // pin and both paths converge on the same live bucket.
> 38 │     const bucket = yield* Cloudflare.R2.ReadWriteBucket(Storage).pipe(
  39 │       Alchemy.remote(),
  40 │     );
```
