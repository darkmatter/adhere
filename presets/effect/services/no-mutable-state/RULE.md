---
description: The interface a service exposes must hold only readonly members, never writable fields or mutable state, such as a Map, Set, or array, that its consumers could change, even through a readonly property.
---

State the service's implementation keeps behind its operations is not part of
its interface, and neither are a fixture's controls kept beside the service it
provides.

## Must

```ts
class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>()("@app/Logger") {}
```

## Never

```ts
class Counter extends Context.Service<
  Counter,
  { count: number; readonly increment: () => Effect.Effect<void> }
>()("@app/Counter") {}
```
