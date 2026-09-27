---
description: Code that checks a secret it received, such as a token, an API key, or an HMAC signature, must compare it in constant time, as `crypto.timingSafeEqual` or a library's verify function does, never with `===`, `!==`, or a string method.
---

## Must

```ts
const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest();
const received = Buffer.from(request.headers.get("x-signature") ?? "", "hex");
if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
  return new Response("Invalid signature", { status: 401 });
}
```

## Never

```ts
const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
if (request.headers.get("x-signature") !== expected) {
  return new Response("Invalid signature", { status: 401 });
}
```
