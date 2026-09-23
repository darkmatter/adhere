---
description: A token, password, or key should be read with Config.redacted.
---

```ts
const program = Effect.gen(function* () {
  const apiKey = yield* Config.redacted("API_KEY");

  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  };

  return headers;
});
```
