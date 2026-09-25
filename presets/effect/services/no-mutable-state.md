---
description: A service must expose only readonly members, never mutable state.
---

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
