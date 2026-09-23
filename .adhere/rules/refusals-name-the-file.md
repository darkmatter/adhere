---
description: An error raised while reading a config, rule, or cache file names that file in its message, so the user can open it.
threshold: 0.8
---

Adhere's own rule. A refusal is the only thing the user sees, so it points
at the file it is about.

```ts
const front =
  yield *
  Schema.decodeUnknownEffect(FrontMatter)(fields).pipe(
    Effect.mapError((problem) =>
      ConfigUnavailable.make({ message: `${file}: ${problem.message}` }),
    ),
  );
```
