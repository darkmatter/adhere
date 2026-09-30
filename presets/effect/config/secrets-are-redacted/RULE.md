---
description: A token, password, or key must be read with Config.Redacted, never with Config.String.
---

## Must

```ts
const program = Effect.gen(function* () {
  const apiKey = yield* Config.Redacted("API_KEY");

  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  };

  return headers;
});
```

## Never

```ts
const token = yield* Config.String("GITHUB_TOKEN");
```
