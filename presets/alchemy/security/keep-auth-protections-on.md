---
description: Auth configuration must keep state, PKCE, origin and CSRF checks, ID-token verification, and email verification enabled, never disable them or merge accounts by email alone to work around an error or a cross-origin setup.
---

```ts must
const auth = yield* BetterAuth({
  trustedOrigins: [siteOrigin],
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  account: { accountLinking: { disableImplicitLinking: true } },
});
```

```ts never
const auth = yield* BetterAuth({
  trustedOrigins: ["*"],
  advanced: { disableCSRFCheck: true },
  account: { accountLinking: { trustedProviders: ["github", "google", "company"] } },
});
```
