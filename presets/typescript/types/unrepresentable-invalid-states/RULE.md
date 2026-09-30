---
description: A type whose fields are valid only in some combinations must be a union with one member per state, each carrying only the fields that state has, never one object type of optional fields and flags whose valid combinations only the code that reads them knows. A union of Schema.TaggedClass members is such a union.
appliesTo: ["a declared type, interface, or schema"]
---

## Must

```ts
type Request<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; error: Error };
```

## Never

```ts
interface Request<T> {
  loading: boolean;
  data?: T;
  error?: Error;
}
```
