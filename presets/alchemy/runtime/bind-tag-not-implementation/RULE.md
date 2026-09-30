---
description: When a runtime is split into a Tag class and a make Layer, other runtimes must import and bind only the Tag, and only the Stack provides the Layer; another Worker or Function must never import or provide that implementation Layer.
---

## Must

```ts
// src/Admin.ts
import { Api } from "./Api.ts";

export default Cloudflare.Worker("Admin", { main: import.meta.url },
  Effect.gen(function* () {
    const api = yield* Cloudflare.Workers.bindWorker(Api);
    return { fetch: Effect.gen(function* () { return yield* api.fetch(yield* HttpServerRequest.HttpServerRequest); }) };
  }),
);
```

## Never

```ts
// src/Admin.ts
import ApiLive, { Api } from "./Api.ts";

export default Cloudflare.Worker("Admin", { main: import.meta.url },
  Effect.gen(function* () {
    const api = yield* Cloudflare.Workers.bindWorker(Api);
    return { fetch: forwardTo(api) };
  }).pipe(Effect.provide(ApiLive)), // ships a second copy of Api's runtime
);
```
