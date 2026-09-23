---
description: A token, password, or key must be read with Config.redacted, never with Config.string.
---

```ts must
const program = Effect.gen(function* () {
  const apiKey = yield* Config.redacted("API_KEY");

  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  };

  return headers;
});
```

```ts never
const token = yield* Config.string("GITHUB_TOKEN");
```
