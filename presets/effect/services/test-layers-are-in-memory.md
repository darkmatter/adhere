---
description: A test implementation of a service is built with Layer.sync or Layer.succeed over in-memory state.
---

```ts
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
```
