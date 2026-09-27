---
description: A function must return a changed copy of an object or array it received as an argument, never mutate the argument, such as by sorting it in place, pushing to it, deleting a key, or assigning to a property, where its caller does not expect the change.
excludeIf: ["a function whose name says it changes its argument, such as sortInPlace", "an accumulator the function builds, such as a reduce callback's"]
---

## Must

```ts
const byNewest = (posts: ReadonlyArray<Post>) =>
  posts.toSorted((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
```

## Never

```ts
const byNewest = (posts: Post[]) => {
  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return posts;
};
```
