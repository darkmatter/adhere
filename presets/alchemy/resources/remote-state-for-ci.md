---
description: A stack deployed from CI or by more than one machine must use a shared state store such as Cloudflare.state() or AWS.state(), never Alchemy.localState(), which lives on one machine's disk where CI runners cannot see it.
---

```ts must
export default Alchemy.Stack("App", { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const api = yield* Api;
    return { url: api.url };
  }),
);
```

```ts never
// deployed by .github/workflows/deploy.yml
export default Alchemy.Stack("App", { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const api = yield* Api;
    return { url: api.url };
  }),
);
```
