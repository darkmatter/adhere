---
description: A custom provider's diff must check isResolved(news) and return undefined before comparing props that may still be unresolved Outputs, never comparing them directly.
---

```ts must
diff: Effect.fn(function* ({ news, olds }) {
  if (!isResolved(news)) return undefined;
  if (news.region !== olds.region) return { action: "replace" } as const;
}),
```

```ts never
diff: Effect.fn(function* ({ news, olds }) {
  if (news.region !== olds.region) return { action: "replace" } as const;
}),
```
