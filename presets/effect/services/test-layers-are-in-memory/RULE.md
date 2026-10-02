---
description: A test implementation of a service should be built with Layer.sync or Layer.succeed over in-memory state, and should not reach a real database, network, or file. A test-specific layer such as EmailTest that implements Email by calling SmtpClient is a violation, even with localhost or an integration-test label. Integration tests that invoke the existing production service implementation to assert its actual transport, persistence, file, cryptographic, or failure behavior are not test implementations of that service and are not in scope.
tests: only
---

## Should

```ts
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
```

## Should not

```ts
const EmailTest = Layer.effect(
  Email,
  Effect.gen(function* () {
    const smtp = yield* SmtpClient;
    return Email.of({ send: (message) => smtp.deliver(message) });
  }),
).pipe(Layer.provide(SmtpClient.layer({ host: "localhost", port: 1025 })));
```
