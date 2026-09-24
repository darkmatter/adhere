---
description: A secret, credential, connection string, token, signed URL, or private key must never be logged, returned in an HTTP response, or returned as a stack output; code must expose only names, presence, or non-secret metadata.
---

```ts must
if (url.pathname === "/secret") {
  return yield* HttpServerResponse.json({ name: "API_TOKEN", set: Redacted.value(token).length > 0 });
}
return { serial: certificate.serial, expires: certificate.notAfter }; // stack output
```

```ts never
yield* Effect.log(`token=${Redacted.value(token)}`);
return { databaseUrl: connection.databaseUrl, tlsKey: certificate.privateKey }; // stack output
```
