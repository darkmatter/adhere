---
description: The interface a Context.Service exposes must hold only readonly members, never writable fields or mutable state, such as a Map, Set, or array, that its consumers could change, even through a readonly property.
---

State the service's implementation keeps behind its operations is not part of
its interface, and neither are a fixture's controls kept beside the service it
provides. A plain interface that no Context.Service declares, such as a
helper's registry or a connection's data, is out of scope. A Context.Service's
interface is in scope however its file declares it.

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
