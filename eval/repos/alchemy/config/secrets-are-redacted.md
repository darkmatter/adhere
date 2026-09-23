# config/secrets-are-redacted

A token, password, or key must be read with Config.redacted, never with Config.string.

5 findings, from 0.93 down to 0.71. Each showed this hint:

```ts
const program = Effect.gen(function* () {
  const apiKey = yield* Config.redacted("API_KEY");

  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  };

  return headers;
});
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.93 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:78
     Config.String(name).pipe(
0.92 packages/alchemy/src/Cloudflare/Access.ts:77
     Config.String(name)
0.87 packages/alchemy/src/Cli/commands/cloudflare.ts:229
     (yield* read(Config.String("CLOUDFLARE_EMAIL").pipe(Config.option))) ??
0.83 packages/alchemy/src/Auth/AuthProvider.ts:166
     * Values must arrive pre-redacted (see `displayRedacted`) — the display
0.71 packages/alchemy/src/Auth/Env.ts:20
     Config.String(key).pipe(
```
