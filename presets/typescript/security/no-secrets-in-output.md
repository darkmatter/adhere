---
description: A secret, such as a password, an API key, a token, a private key, a session id, or a connection string with credentials, must never be written to a log, put in an error message, or returned in an HTTP response; code must refer to a secret only by its name, its presence, or a non-secret id.
appliesTo: ["code that writes a log, builds an error message, or builds an HTTP response"]
excludeIf: ["a masked secret that shows at most a few of its characters"]
---

## Must

```ts
logger.info("calling billing", { keyId: apiKey.id });
throw new Error(`Could not connect to the database at ${dbHost}`);
```

## Never

```ts
logger.info(`calling billing with key ${apiKey.secret}`);
throw new Error(`Could not connect to ${process.env.DATABASE_URL}`);
```
