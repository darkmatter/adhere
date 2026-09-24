---
description: A sensitive CI value, such as a token, key, password, or connection string, must be stored with GitHub.Secret, never with GitHub.Variable, which is plain text and visible in logs.
---

```ts must
yield* GitHub.Secret("CloudflareToken", { owner, repository, name: "CLOUDFLARE_API_TOKEN", value: token.value });
yield* GitHub.Variable("AwsRegion", { owner, repository, name: "AWS_REGION", value: "us-east-1" });
```

```ts never
yield* GitHub.Variables({ owner, repository, variables: { CLOUDFLARE_API_TOKEN: token.value } });
```
