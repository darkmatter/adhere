---
description: Credentials a stack mints for CI should be scoped to what the app deploys, using a GitHub OIDC role pinned to the repository on AWS and a trimmed permission list on Cloudflare, and should not grant AdministratorAccess or unused write scopes.
---

## Should

```ts
const role = yield* AWS.IAM.Role("GitHubDeploy", {
  assumeRolePolicyDocument: { Version: "2012-10-17", Statement: [{
    Effect: "Allow", Principal: { Federated: oidc.openIDConnectProviderArn },
    Action: ["sts:AssumeRoleWithWebIdentity"],
    Condition: { StringLike: { "token.actions.githubusercontent.com:sub": "repo:acme/app:*" } },
  }] },
  policies: [deployPolicy],
});
```

## Should not

```ts
const role = yield* AWS.IAM.Role("GitHubDeploy", {
  assumeRolePolicyDocument: { Version: "2012-10-17", Statement: [{
    Effect: "Allow", Principal: { Federated: oidc.openIDConnectProviderArn },
    Action: ["sts:AssumeRoleWithWebIdentity"],
  }] },
  managedPolicyArns: ["arn:aws:iam::aws:policy/AdministratorAccess"],
});
```
