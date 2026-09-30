---
description: A function should do its own work, or call the module that owns that work, and should not only pass its arguments on to another function.
level: warning
---

From AGENTS.md: code is organized by ownership, so tracing a call path is
linear. A wrapper that only forwards its arguments adds a place to jump through
and nothing to read there. A function that adapts what it passes on, by adding,
dropping, or transforming arguments or results, does work of its own.

## Should

```ts
export const shownId = (entry: RuleEntry): string =>
  entry.preset === undefined ? entry.id : `${entry.preset}/${entry.id}`;
```

## Should not

```ts
export const idOf = (entry: RuleEntry): string => shownId(entry);
```
