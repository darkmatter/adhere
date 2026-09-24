---
description: Input from outside the stack, such as browsers, partners, or public URLs, should be validated with a schema through Effect RPC or HttpApi, while calls between the stack's own runtimes should use schemaless RPC through bindings, and unvalidated payloads should not cross a trust boundary.
---

```ts should
const Tasks = HttpApiGroup.make("tasks").add(
  HttpApiEndpoint.post("create", "/tasks", { payload: Schema.Struct({ title: Schema.String }) }),
);
const greeter = yield* Cloudflare.Workers.bindWorker(Greeter); // internal call
```

```ts should not
fetch: Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const body = (yield* request.json) as { title: string; ownerId: string }; // public URL, no validation
  return yield* store.create(body);
}),
```
