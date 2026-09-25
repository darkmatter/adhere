# effect/config/secrets-are-redacted

A token, password, or key must be read with Config.redacted, never with Config.string.

4 findings, from 0.93 down to 0.84. Each showed this hint:

```ts
const program = Effect.gen(function* () {
  const apiKey = yield* Config.redacted("API_KEY");

  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  };

  return headers;
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.93 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:78:7
  77 │     const getEnv = (name: string) =>
> 78 │       Config.String(name).pipe(
  79 │         Effect.catchTag("ConfigError", () => Effect.succeed(undefined)),
  80 │       );

0.91 packages/alchemy/src/Cloudflare/Access.ts:77:7
  76 │     const getEnv = (name: string) =>
> 77 │       Config.String(name)
  78 │
  79 │         .pipe(Effect.catchTag("ConfigError", () => Effect.succeed(undefined)));

0.85 packages/alchemy/src/Cli/commands/cloudflare.ts:229:9
  228 │       const email =
> 229 │         (yield* read(Config.String("CLOUDFLARE_EMAIL").pipe(Config.option))) ??
  230 │         (yield* prompt.prompt.text({
  231 │           message: "Cloudflare account email",
  232 │           validate: (value) =>
  233 │             value.trim().length === 0 ? "Required" : undefined,
  234 │         }));

0.84 packages/alchemy/src/Auth/AuthProvider.ts:166:2
  164 │ /**
  165 │  * One rendered line of a provider's credential details: `key: value`.
> 166 │  * Values must arrive pre-redacted (see `displayRedacted`) — the display
```
