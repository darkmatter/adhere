---
description: A Redacted value must be unwrapped with Redacted.value before it is compared, sent, or serialized, never put into a template literal, string concatenation, String(), or JSON, where it becomes the literal text <redacted> and silently fails every check.
---

```ts must
const expected = yield* Config.Redacted("AUTH_TOKEN");
if (request.headers.authorization !== `Bearer ${Redacted.value(expected)}`) {
  return HttpServerResponse.empty({ status: 401 });
}
```

```ts never
const expected = yield* Config.Redacted("AUTH_TOKEN");
if (request.headers.authorization !== `Bearer ${expected}`) { // compares against "Bearer <redacted>"
  return HttpServerResponse.empty({ status: 401 });
}
```
