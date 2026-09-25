# alchemy/security/lookup-failure-is-not-anonymous

Only a null session may be treated as anonymous; a failed session lookup must stay in the error channel or map to a server error, never be collapsed into signed out.

6 findings, from 0.90 down to 0.86. Each showed this hint:

```ts
const session = yield* auth.getSession().pipe(
  Effect.mapError(() => new AuthenticationUnavailable()),
);
if (session === null) return yield* Effect.fail(new Unauthorized());
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.90 packages/better-auth/test/fixtures/probe-worker.ts:32:11
  13 │ export default class ProbeWorker extends Cloudflare.Worker<ProbeWorker>()(
  14 │   "ProbeWorker",
  15 │   {
  16 │     main: import.meta.url,
  17 │   },
  18 │   Effect.gen(function* () {
  19 │     const auth = yield* BetterAuth({
  20 │       basePath: "/auth",
  21 │       emailAndPassword: { enabled: true },
  22 │     });
  23 │
  24 │     return {
  25 │       fetch: Effect.gen(function* () {
  26 │         const request = yield* HttpServerRequest;
  27 │         if (request.url.startsWith("/auth")) {
  28 │           return yield* auth.fetch;
  29 │         }
  30 │         const session = yield* auth
  31 │           .getSession()
> 32 │           .pipe(Effect.catch((error) => Effect.succeed(null)));
  33 │         return yield* HttpServerResponse.json({
  34 │           signedIn: session !== null,
  35 │         });
  36 │       }),
  37 │     };
  38 │   }).pipe(Effect.provide(Memory())),
  39 │ ) {}

0.87 packages/better-auth/test/Cloudflare/fixtures/auth-worker.ts:35:15
  19 │   Effect.gen(function* () {
  20 │     const auth = yield* BetterAuth({
  21 │       basePath: "/auth",
  22 │       emailAndPassword: { enabled: true },
  23 │     });
  24 │
  25 │     return {
  26 │       fetch: Effect.gen(function* () {
  27 │         const request = yield* HttpServerRequest;
  28 │         if (request.url.startsWith("/auth")) {
  29 │           return yield* auth.fetch;
  30 │         }
  31 │         if (request.url.startsWith("/me")) {
  32 │           const session = yield* auth
  33 │             .getSession()
  34 │             .pipe(
> 35 │               Effect.catchTag("BetterAuthApiError", () => Effect.succeed(null)),
  36 │             );
  37 │           return yield* HttpServerResponse.json({
  38 │             email: session?.user.email ?? null,
  39 │           });
  40 │         }
  41 │         return HttpServerResponse.text("ok");
  42 │       }),
  43 │     };
  44 │   }).pipe(Effect.provide(CloudflareD1(Db))),

0.87 packages/better-auth/test/Cloudflare/fixtures/hyperdrive-worker.ts:58:15
  42 │   Effect.gen(function* () {
  43 │     const auth = yield* BetterAuth({
  44 │       basePath: "/auth",
  45 │       emailAndPassword: { enabled: true },
  46 │     });
  47 │
  48 │     return {
  49 │       fetch: Effect.gen(function* () {
  50 │         const request = yield* HttpServerRequest;
  51 │         if (request.url.startsWith("/auth")) {
  52 │           return yield* auth.fetch;
  53 │         }
  54 │         if (request.url.startsWith("/me")) {
  55 │           const session = yield* auth
  56 │             .getSession()
  57 │             .pipe(
> 58 │               Effect.catchTag("BetterAuthApiError", () => Effect.succeed(null)),
  59 │             );
  60 │           return yield* HttpServerResponse.json({
  61 │             email: session?.user.email ?? null,
  62 │           });
  63 │         }
  64 │         return HttpServerResponse.text("ok");
  65 │       }),
  66 │     };
  67 │   }).pipe(Effect.provide(AuthDatabase)),

0.86 packages/better-auth/test/AWS/fixtures/aurora-handler.ts:68:15
  51 │   Effect.gen(function* () {
  52 │     const auth = yield* BetterAuth({
  53 │       basePath: "/auth",
  54 │       emailAndPassword: { enabled: true },
  55 │     });
  56 │
  57 │     return {
  58 │       fetch: Effect.gen(function* () {
  59 │         const request = yield* HttpServerRequest;
  60 │         const pathname = new URL(request.url, "http://lambda").pathname;
  61 │         if (pathname.startsWith("/auth")) {
  62 │           return yield* auth.fetch;
  63 │         }
  64 │         if (pathname.startsWith("/me")) {
  65 │           const session = yield* auth
  66 │             .getSession()
  67 │             .pipe(
> 68 │               Effect.catchTag("BetterAuthApiError", () => Effect.succeed(null)),
  69 │             );
  70 │           return yield* HttpServerResponse.json({
  71 │             email: session?.user.email ?? null,
  72 │           });
  73 │         }
  74 │         return HttpServerResponse.text("ok");
  75 │       }),
  76 │     };
  77 │   }).pipe(Effect.provide(AuthDatabase)),

0.86 packages/better-auth/test/AWS/fixtures/auth-handler.ts:56:15
  38 │   Effect.gen(function* () {
  39 │     const auth = yield* BetterAuth({
  40 │       basePath: "/auth",
  41 │       emailAndPassword: { enabled: true },
  42 │     });
  43 │
  44 │     return {
  45 │       fetch: Effect.gen(function* () {
  46 │         const request = yield* HttpServerRequest;
  47 │         // On Lambda the request url is absolute — route on the pathname.
  48 │         const pathname = new URL(request.url, "http://lambda").pathname;
  49 │         if (pathname.startsWith("/auth")) {
  50 │           return yield* auth.fetch;
  51 │         }
  52 │         if (pathname.startsWith("/me")) {
  53 │           const session = yield* auth
  54 │             .getSession()
  55 │             .pipe(
> 56 │               Effect.catchTag("BetterAuthApiError", () => Effect.succeed(null)),
  57 │             );
  58 │           return yield* HttpServerResponse.json({
  59 │             email: session?.user.email ?? null,
  60 │           });
  61 │         }
  62 │         return HttpServerResponse.text("ok");
  63 │       }),
  64 │     };
  65 │   }).pipe(Effect.provide(AuthDatabase)),

0.86 packages/better-auth/test/Postgres/fixtures/neon-worker.ts:44:15
  28 │   Effect.gen(function* () {
  29 │     const auth = yield* BetterAuth({
  30 │       basePath: "/auth",
  31 │       emailAndPassword: { enabled: true },
  32 │     });
  33 │
  34 │     return {
  35 │       fetch: Effect.gen(function* () {
  36 │         const request = yield* HttpServerRequest;
  37 │         if (request.url.startsWith("/auth")) {
  38 │           return yield* auth.fetch;
  39 │         }
  40 │         if (request.url.startsWith("/me")) {
  41 │           const session = yield* auth
  42 │             .getSession()
  43 │             .pipe(
> 44 │               Effect.catchTag("BetterAuthApiError", () => Effect.succeed(null)),
  45 │             );
  46 │           return yield* HttpServerResponse.json({
  47 │             email: session?.user.email ?? null,
  48 │           });
  49 │         }
  50 │         return HttpServerResponse.text("ok");
  51 │       }),
  52 │     };
  53 │   }).pipe(Effect.provide(AuthDatabase)),
```
