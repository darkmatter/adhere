---
description: A handler behind a public URL, such as a Function URL, workers.dev route, or a Durable Object chosen by a client-supplied name, must authenticate the caller and check its access before doing protected work, never treating CORS, an obscure URL, or a trusted origin as authorization.
---

```ts must
fetch: Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const user = yield* verifySession(request.headers.authorization);
  if (user === undefined) return HttpServerResponse.empty({ status: 401 });
  return yield* counters.fetch(user.tenantId, request);
}),
```

```ts never
fetch: Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const name = /^\/counters\/([^/]+)$/.exec(new URL(request.url).pathname)?.[1] ?? "default";
  return yield* counters.fetch(name, request); // anyone who knows a name can read it
}),
```
