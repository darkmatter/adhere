---
description: A custom provider's reconcile must read the resource's live state and converge it in one flow that serves create, update, and adoption, never branching into separate create and update bodies on output === undefined or trusting olds as proof the resource exists.
---

```ts must
reconcile: Effect.fn(function* ({ news, output }) {
  let live = yield* observe(output);
  if (live === undefined) live = yield* create(news);
  if (drifted(live, news)) live = yield* update(live.id, news);
  return toAttributes(live);
}),
```

```ts never
reconcile: Effect.fn(function* ({ news, olds, output }) {
  if (output === undefined) return yield* create(news);
  yield* updateTags(output.id, olds.tags, news.tags);
  return output;
}),
```
