# errors/wrap-external-errors

An error from an external library must be wrapped in a tagged error with a Schema.Defect field, never passed through raw.

17 findings, from 0.84 down to 0.71. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.84 packages/alchemy/src/GitHub/Collaborator.ts:159:9
  146 │     reconcile: Effect.fn(function* ({ news }) {
  147 │       const octokit = yield* octokitFor(news.baseUrl);
  148 │
  149 │       // Ensure & Sync — PUT is idempotent; creates or updates permission
  150 │       yield* Effect.tryPromise({
  151 │         try: async () => {
  152 │           await octokit.rest.repos.addCollaborator({
  153 │             owner: news.owner,
  154 │             repo: news.repository,
  155 │             username: news.username,
  156 │             permission: news.permission ?? "push",
  157 │           });
  158 │         },
> 159 │         catch: (e) => e as Error,
  160 │       });
  161 │
  162 │       return {
  163 │         username: news.username,
  164 │         permission: news.permission ?? "push",
  165 │       };
  166 │     }),

0.81 packages/alchemy/src/GitHub/TeamAccess.ts:178:9
  164 │     reconcile: Effect.fn(function* ({ news }) {
  165 │       const octokit = yield* octokitFor(news.baseUrl);
  166 │
  167 │       // Ensure & Sync — PUT is idempotent; adds team or updates permission
  168 │       yield* Effect.tryPromise({
  169 │         try: async () => {
  170 │           await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
  171 │             org: news.owner,
  172 │             team_slug: news.teamSlug,
  173 │             owner: news.owner,
  174 │             repo: news.repository,
  175 │             permission: news.permission ?? "push",
  176 │           });
  177 │         },
> 178 │         catch: (e) => e as Error,
  179 │       });
  180 │
  181 │       return {
  182 │         teamSlug: news.teamSlug,
  183 │         permission: news.permission ?? "push",
  184 │       };
  185 │     }),

0.80 packages/alchemy/src/GitHub/Milestone.ts:341:9
  336 │       const repos = yield* Effect.tryPromise({
  337 │         try: () =>
  338 │           octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
  339 │             per_page: 100,
  340 │           }),
> 341 │         catch: (e) => e as Error,
  342 │       });

0.80 packages/alchemy/src/GitHub/Release.ts:441:9
  424 │     delete: Effect.fn(function* ({ olds, output }) {
  425 │       const octokit = yield* octokitFor(olds.baseUrl);
  426 │
  427 │       yield* Effect.tryPromise({
  428 │         try: async () => {
  429 │           try {
  430 │             await octokit.rest.repos.deleteRelease({
  431 │               owner: olds.owner,
  432 │               repo: olds.repository,
  433 │               release_id: output.releaseId,
  434 │             });
  435 │           } catch (error: any) {
  436 │             if (error.status !== 404) {
  437 │               throw error;
  438 │             }
  439 │           }
  440 │         },
> 441 │         catch: (e) => e as Error,
  442 │       });
  443 │     }),
  444 │   });

0.79 packages/alchemy/src/GitHub/Environment.ts:381:11
  378 │       const perRepo = yield* Effect.forEach(
  379 │         repos,
  380 │         (repo) =>
> 381 │           Effect.tryPromise({

0.78 packages/alchemy/src/GitHub/Issue.ts:244:9
  243 │       if (data === undefined) {
> 244 │         const created = yield* Effect.tryPromise(() =>
  245 │           octokit.rest.issues.create({
  246 │             owner: news.owner,
  247 │             repo: news.repository,
  248 │             title: news.title,
  249 │             body,
  250 │             labels,
  251 │             assignees,
  252 │             milestone: milestone ?? undefined,
  253 │           }),
  254 │         );
  255 │         data = created.data;
  256 │       }

0.78 packages/alchemy/src/GitHub/Ruleset.ts:485:9
  480 │       const repos = yield* Effect.tryPromise({
  481 │         try: () =>
  482 │           octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
  483 │             per_page: 100,
  484 │           }),
> 485 │         catch: (e) => e as Error,
  486 │       });

0.77 packages/alchemy/src/GitHub/Comment.ts:207:17
  195 │       const observedId = output?.commentId
  196 │         ? yield* Effect.tryPromise({
  197 │             try: async () => {
  198 │               try {
  199 │                 const { data } = await octokit.rest.issues.getComment({
  200 │                   owner: news.owner,
  201 │                   repo: news.repository,
  202 │                   comment_id: output.commentId,
  203 │                 });
  204 │                 return data.id;
  205 │               } catch (error: any) {
  206 │                 if (error.status === 404) return undefined;
> 207 │                 throw error;
  208 │               }
  209 │             },
  210 │             catch: (e) => e as Error,
  211 │           })
  212 │         : undefined;

0.77 packages/alchemy/src/GitHub/Label.ts:301:9
  296 │       const repos = yield* Effect.tryPromise({
  297 │         try: () =>
  298 │           octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
  299 │             per_page: 100,
  300 │           }),
> 301 │         catch: (e) => e as Error,
  302 │       });

0.76 packages/alchemy/src/GitHub/Variable.ts:240:17
  217 │       const perRepo = yield* Effect.forEach(
  218 │         repos,
  219 │         (repo) =>
  220 │           Effect.tryPromise({
  221 │             try: async () => {
  222 │               try {
  223 │                 const variables = await octokit.paginate(
  224 │                   octokit.rest.actions.listRepoVariables,
  225 │                   {
  226 │                     owner: repo.owner.login,
  227 │                     repo: repo.name,
  228 │                     per_page: 100,
  229 │                   },
  230 │                 );
  231 │                 return variables.map((v) => ({ updatedAt: v.updated_at }));
  232 │               } catch (error: any) {
  233 │                 // Repos with Actions disabled, or where the token lacks the
  234 │                 // `repo`/`actions` scope, reject the variables endpoint with
  235 │                 // 403/404 — skip them per the per-item not-found rule rather
  236 │                 // than failing the whole enumeration.
  237 │                 if (error.status === 403 || error.status === 404) {
  238 │                   return [];
  239 │                 }
> 240 │                 throw error;
  241 │               }
  242 │             },
  243 │             catch: (e) => e as Error,
  244 │           }),
  245 │         { concurrency: 10 },
  246 │       );

0.75 packages/alchemy/src/GitHub/BranchProtection.ts:422:7
  419 │       const reviews = news.requiredPullRequestReviews;
  420 │       const restrictions = news.restrictions;
  421 │
> 422 │       yield* Effect.tryPromise({

0.74 packages/alchemy/src/GitHub/PullRequest.ts:396:9
  391 │       const repos = yield* Effect.tryPromise({
  392 │         try: () =>
  393 │           octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
  394 │             per_page: 100,
  395 │           }),
> 396 │         catch: (e) => e as Error,
  397 │       });

0.73 packages/alchemy/src/GitHub/Webhook.ts:205:13
  190 │       const observed = output?.webhookId
  191 │         ? yield* Effect.tryPromise({
  192 │             try: async () => {
  193 │               try {
  194 │                 const { data } = await octokit.rest.repos.getWebhook({
  195 │                   owner: news.owner,
  196 │                   repo: news.repository,
  197 │                   hook_id: output.webhookId,
  198 │                 });
  199 │                 return data;
  200 │               } catch (error: any) {
  201 │                 if (error.status === 404) return undefined;
  202 │                 throw error;
  203 │               }
  204 │             },
> 205 │             catch: (e) => e as Error,
  206 │           })
  207 │         : undefined;

0.72 packages/alchemy/src/Cloudflare/Tunnel/Route.ts:203:17
  192 │         const createdOrAdopted = yield* zeroTrust
  193 │           .createNetworkRoute({
  194 │             accountId: acct,
  195 │             network,
  196 │             tunnelId,
  197 │             comment: news.comment,
  198 │             virtualNetworkId,
  199 │           })
  200 │           .pipe(
  201 │             Effect.catch((err) =>
  202 │               Effect.gen(function* () {
> 203 │                 if (!news.adopt) return yield* Effect.fail(err);
  204 │                 const existing = yield* observe(
  205 │                   acct,
  206 │                   network,
  207 │                   virtualNetworkId,
  208 │                   undefined,
  209 │                 );
  210 │                 if (!existing) return yield* Effect.fail(err);
  211 │                 // Sentinel: undefined means "adoption path; use re-observed value".
  212 │                 return undefined;
  213 │               }),
  214 │             ),
  215 │           );

0.72 packages/alchemy/src/GitHub/Repository.ts:564:9
  538 │       const updated = yield* Effect.tryPromise({
  539 │         // Octokit's typed params lag the REST API: `visibility: "internal"`
  540 │         // and `has_discussions` are valid at runtime but missing from the
  541 │         // generated types, so assert to the accepted parameter shape.
  542 │         try: async () => {
  543 │           try {
  544 │             const { data } = await octokit.rest.repos.update(
  545 │               updateInput as Parameters<typeof octokit.rest.repos.update>[0],
  546 │             );
  547 │             return data;
  548 │           } catch (error: any) {
  549 │             // A 422 on a default-branch update usually means the branch does
  550 │             // not exist yet. Drop it and retry so the rest of the settings
  551 │             // still converge.
  552 │             if (error.status === 422 && updateInput.default_branch) {
  553 │               const { default_branch, ...withoutBranch } = updateInput;
  554 │               const { data } = await octokit.rest.repos.update(
  555 │                 withoutBranch as Parameters<
  556 │                   typeof octokit.rest.repos.update
  557 │                 >[0],
  558 │               );
  559 │               return data;
  560 │             }
  561 │             throw error;
  562 │           }
  563 │         },
> 564 │         catch: (e) => e as Error,
  565 │       });

0.71 packages/alchemy/src/Cloudflare/D1/ExportDatabase.ts:60:11
  38 │     ): Effect.Effect<ExportD1DatabaseResult, d1.ExportDatabaseError, never> =>
  39 │       Effect.gen(function* () {
  40 │         const data = yield* exportDb({
  41 │           accountId: options.accountId,
  42 │           databaseId: options.databaseId,
  43 │           outputFormat: "polling",
  44 │           currentBookmark,
  45 │           dumpOptions: options.dumpOptions,
  46 │         });
  47 │
  48 │         if (data.status === "complete" && data.result) {
  49 │           if (!data.result.filename || !data.result.signedUrl) {
  50 │             return yield* Effect.die(
  51 │               "D1 export completed but missing filename/signedUrl",
  52 │             );
  53 │           }
  54 │           return {
  55 │             filename: data.result.filename,
  56 │             signedUrl: data.result.signedUrl,
  57 │           };
  58 │         }
  59 │         if (data.status === "error") {
> 60 │           return yield* Effect.die(data.error ?? "Error during D1 export");
  61 │         }
  62 │         return yield* poll(data.atBookmark ?? undefined);
  63 │       });

0.71 packages/alchemy/test/Railway/fixtures/postgres-fn.ts:34:13
  18 │ export default class PostgresFn extends Function<PostgresFn>()(
  19 │   "PostgresFn",
  20 │   {
  21 │     project: Site,
  22 │     environment: Partition,
  23 │     main: import.meta.url,
  24 │     build: { install: ["pg", "drizzle-orm"] },
  25 │   },
  26 │   Effect.gen(function* () {
  27 │     const conn = yield* ConnectPostgres(Db);
  28 │     const db = yield* Drizzle.Postgres(conn.connectionString);
  29 │     return {
  30 │       fetch: db.execute("select 1 as ok", "objects").pipe(
  31 │         Effect.flatMap((rows) => HttpServerResponse.json({ rows })),
  32 │         Effect.catch((error) =>
  33 │           HttpServerResponse.json(
> 34 │             { ok: false, error: String(error) },
  35 │             { status: 500 },
  36 │           ),
  37 │         ),
  38 │       ),
  39 │     };
  40 │   }).pipe(Effect.provide(ConnectPostgresHttp)),
  41 │ ) {}
```
