---
description: In a Workflow or Durable Function, every side effect, such as an HTTP call, binding call, or write, must run inside a task or step, and code outside steps must be deterministic, never doing I/O or reading the clock or randomness, because the body replays.
---

## Must

```ts
export default Cloudflare.Workflow("Notify", Effect.fn(function* (input: { roomId: string; message: string }) {
  const stored = yield* Cloudflare.Workflows.task("store", kv.put(`notify:${input.roomId}`, input.message));
  yield* Cloudflare.Workflows.sleep("cooldown", "30 seconds");
  return stored;
}));
```

## Never

```ts
export default Cloudflare.Workflow("Notify", Effect.fn(function* (input: { roomId: string; message: string }) {
  yield* kv.put(`notify:${input.roomId}:${Date.now()}`, input.message); // repeats on every replay
}));
```
