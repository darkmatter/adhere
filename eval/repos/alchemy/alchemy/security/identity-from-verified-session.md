# alchemy/security/identity-from-verified-session

The acting user must come from the session or token verified in that request, never from an ID in the request body, query, or headers, and never from a user cached in a process-wide layer.

1 finding, at 0.75. It showed this hint:

```ts
const session = yield* auth.getSession();
if (session === null) return yield* Effect.fail(new Unauthorized());
const rows = yield* sql`SELECT * FROM uploads WHERE owner_id = ${session.user.id}`;
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.75 packages/alchemy/test/AWS/VerifiedPermissions/handler.ts:54:11
  52 │         // /authorize?user=alice -> ALLOW, any other user -> DENY
  53 │         if (request.method === "GET" && pathname === "/authorize") {
> 54 │           const user = url.searchParams.get("user") ?? "alice";
  55 │           const result = yield* authz.isAuthorized({
  56 │             principal: { entityType: "PhotoApp::User", entityId: user },
  57 │             action: {
  58 │               actionType: "PhotoApp::Action",
  59 │               actionId: "viewPhoto",
  60 │             },
  61 │             resource: {
  62 │               entityType: "PhotoApp::Photo",
  63 │               entityId: "vacation.jpg",
  64 │             },
  65 │           });
  66 │           return yield* HttpServerResponse.json({
  67 │             decision: result.decision,
  68 │           });
  69 │         }
```
