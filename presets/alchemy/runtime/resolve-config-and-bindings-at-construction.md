---
description: In a Worker, Function, or Service, Config values and binding factories must be yielded in the outer construction Effect and captured for the handlers, never yielded for the first time inside fetch or another request handler, which does not run at deploy time, so nothing gets bound.
---

```ts must
export default Cloudflare.Worker("Api", { main: import.meta.url },
  Effect.gen(function* () {
    const apiKey = yield* Config.Redacted("API_KEY");
    const bucket = yield* Cloudflare.R2.ReadBucket(Uploads);
    return {
      fetch: Effect.gen(function* () {
        const object = yield* bucket.get("report.json");
        return HttpServerResponse.text(Redacted.value(apiKey).slice(0, 4));
      }),
    };
  }),
);
```

```ts never
export default Cloudflare.Worker("Api", { main: import.meta.url },
  Effect.gen(function* () {
    return {
      fetch: Effect.gen(function* () {
        const apiKey = yield* Config.Redacted("API_KEY"); // never bound: API_KEY is missing at runtime
        return HttpServerResponse.text("ok");
      }),
    };
  }),
);
```
