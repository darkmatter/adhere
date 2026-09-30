---
description: In a Lambda handler, anything that must not be lost must be written durably, to a queue or a table, inside the handler before it responds, never left to a dangling promise, a forked fiber, or a finalizer, because Lambda freezes the instance after the response.
---

## Must

```ts
fetch: Effect.gen(function* () {
  const event = yield* HttpServerRequest.schemaBodyJson(AuditEvent);
  yield* sendMessage({ MessageBody: JSON.stringify(event) });
  return HttpServerResponse.empty({ status: 202 });
}),
```

## Never

```ts
fetch: Effect.gen(function* () {
  const event = yield* HttpServerRequest.schemaBodyJson(AuditEvent);
  void fetch(AUDIT_URL, { method: "POST", body: JSON.stringify(event) }); // may never run
  return HttpServerResponse.empty({ status: 202 });
}),
```
