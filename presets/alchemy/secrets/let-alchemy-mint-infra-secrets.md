---
description: A token the infrastructure owns, such as a webhook secret or bearer token, should be minted once with alchemy's Random or left for alchemy to provision, and should not be a hardcoded literal or regenerated on every deploy with crypto.randomUUID().
---

```ts should
export const WebhookSecret = Random("WebhookSecret");
const auth = yield* BetterAuth({ basePath: "/api/auth", emailAndPassword: { enabled: true } });
```

```ts should not
const webhookSecret = crypto.randomUUID(); // a new secret on every deploy
const auth = yield* BetterAuth({ basePath: "/api/auth", secret: Redacted.make("dev-secret") });
```
