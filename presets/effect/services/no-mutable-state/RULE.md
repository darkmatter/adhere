---
description: A service interface exposed to its consumers must expose only readonly members and operations, never writable fields or mutable state such as a Map, Set, or array that consumers can mutate even through a readonly property. Internal implementation state captured behind the service operations is allowed. Test controls and observations kept separately from the service instance are not its interface. Judge the object actually exposed as the service, not every exported helper interface or fixture state in its implementation.
---

## Must

```ts
class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>()("@app/Logger") {}

// The registry is internal state, not the Counter service interface.
interface CounterRegistry { readonly counts: Map<string, number> }
const makeCounter = () => {
  const registry: CounterRegistry = { counts: new Map() };
  return {
    increment: (key: string) => Effect.sync(() => {
      registry.counts.set(key, (registry.counts.get(key) ?? 0) + 1);
    }),
  };
};
```

## Never

```ts
class Counter extends Context.Service<
  Counter,
  { count: number; readonly increment: () => Effect.Effect<void> }
>()("@app/Counter") {}
```
