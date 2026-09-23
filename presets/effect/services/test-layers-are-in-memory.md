---
description: A test implementation of a service must be built with Layer.sync or Layer.succeed over in-memory state, never over a real database, network, or file.
---

```ts must
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
```

```ts never
const EmailTest = Layer.effect(
  Email,
  Effect.gen(function* () {
    const smtp = yield* SmtpClient;
    return Email.of({ send: (message) => smtp.deliver(message) });
  }),
).pipe(Layer.provide(SmtpClient.layer({ host: "localhost", port: 1025 })));
```
