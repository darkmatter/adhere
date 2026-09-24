---
description: A secret should be read with Config.Redacted, passed to resources and env as Redacted, and unwrapped with Redacted.value only at the call that needs the raw string; it should not be read with Config.String or process.env, or unwrapped early into plain variables.
---

```ts should
const apiKey = yield* Config.Redacted("OPENAI_API_KEY");
return {
  fetch: Effect.gen(function* () {
    const request = HttpClientRequest.post(url).pipe(HttpClientRequest.bearerToken(Redacted.value(apiKey)));
    return yield* client.execute(request);
  }),
};
```

```ts should not
const apiKey = Redacted.value(yield* Config.Redacted("OPENAI_API_KEY"));
const webhook = process.env.SLACK_WEBHOOK_URL!;
return { fetch: handler(apiKey, webhook) };
```
