# errors/wrap-external-errors

An error from an external library must be wrapped in a tagged error with a Schema.Defect field, never passed through raw.

20 findings, from 0.84 down to 0.71. Each showed this hint:

```ts
class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  endpoint: Schema.String,
  statusCode: Schema.Number,
  error: Schema.Defect(),
}) {}

const fetchUser = (id: string) =>
  HttpClient.get(`/api/users/${id}`).pipe(
    Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
    Effect.mapError(
      (error) =>
        new ApiError({
          endpoint: `/api/users/${id}`,
          statusCode: 500,
          error,
        }),
    ),
  );
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.84 packages/alchemy/src/GitHub/TeamAccess.ts:178
     catch: (e) => e as Error,
0.83 packages/alchemy/src/GitHub/Milestone.ts:341
     catch: (e) => e as Error,
0.82 packages/alchemy/src/GitHub/Collaborator.ts:159
     catch: (e) => e as Error,
0.82 packages/alchemy/src/GitHub/Environment.ts:381
     Effect.tryPromise({
0.81 packages/alchemy/src/GitHub/Ruleset.ts:485
     catch: (e) => e as Error,
0.80 packages/alchemy/src/GitHub/Issue.ts:244
     const created = yield* Effect.tryPromise(() =>
0.78 packages/alchemy/src/GitHub/BranchProtection.ts:422
     yield* Effect.tryPromise({
0.78 packages/alchemy/src/GitHub/Comment.ts:207
     throw error;
0.78 packages/alchemy/src/GitHub/Label.ts:301
     catch: (e) => e as Error,
0.78 packages/alchemy/src/GitHub/Release.ts:441
     catch: (e) => e as Error,
0.75 packages/alchemy/src/GitHub/Variable.ts:240
     throw error;
0.75 packages/alchemy/test/Railway/fixtures/postgres-fn.ts:34
     { ok: false, error: String(error) },
0.74 packages/alchemy/src/Cloudflare/Tunnel/Route.ts:203
     if (!news.adopt) return yield* Effect.fail(err);
0.74 packages/alchemy/src/GitHub/Secret.ts:289
     throw error;
0.72 packages/alchemy/src/GitHub/PullRequest.ts:396
     catch: (e) => e as Error,
0.71 packages/alchemy/src/AWS/Grafana/internal.ts:33
     .pipe(Effect.catch(() => Effect.succeed(undefined)));
0.71 packages/alchemy/src/GitHub/Repository.ts:564
     catch: (e) => e as Error,
0.71 packages/alchemy/src/GitHub/Webhook.ts:205
     catch: (e) => e as Error,
0.71 packages/alchemy/src/Prisma/Internal/DeploymentActions.ts:14
     : Effect.fail(error),
0.71 packages/alchemy/test/AWS/ELBv2/fixtures/acm.ts:57
     yield* acm.deleteCertificate({ CertificateArn: certificateArn }).pipe(
```
