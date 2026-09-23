# config/secrets-are-redacted

Secret keys read with `Config.string` break the rule. Reading them with
`Config.redacted` follows it, next to a plain setting read as a string.

```ts breaks
import { Config, Effect } from "effect";

export const StripeSettings = Effect.gen(function* () {
  const secretKey = yield* Config.string("STRIPE_SECRET_KEY");
  const webhookSecret = yield* Config.string("STRIPE_WEBHOOK_SECRET");
  return { secretKey, webhookSecret };
});
```

```ts follows
import { Config, Effect } from "effect";

export const StripeSettings = Effect.gen(function* () {
  const secretKey = yield* Config.redacted("STRIPE_SECRET_KEY");
  const webhookSecret = yield* Config.redacted("STRIPE_WEBHOOK_SECRET");
  const statementDescriptor = yield* Config.string("STRIPE_STATEMENT_DESCRIPTOR");
  return { secretKey, webhookSecret, statementDescriptor };
});
```
