---
description: An error raised while reading a config, rule, or cache file must name that file in its message, so the user can open it, and never give only the problem.
threshold: 0.8
---

Adhere's own rule. A refusal is the only thing the user sees, so it points
at the file it is about.

## Must

```ts
const front = yield* Schema.decodeUnknownEffect(FrontMatter)(fields).pipe(
  Effect.mapError((problem) =>
    ConfigUnavailable.make({ message: `${file}: ${problem.message}` }),
  ),
);
```

## Never

```ts
const front = yield* Schema.decodeUnknownEffect(FrontMatter)(fields).pipe(
  Effect.mapError((problem) => ConfigUnavailable.make({ message: problem.message })),
);
```
