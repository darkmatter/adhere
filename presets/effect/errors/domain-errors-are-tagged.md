---
description: A domain failure must be a Schema.TaggedError with its own tag, never a bare Error or a plain object.
---

```ts must
class ValidationError extends Schema.TaggedError<ValidationError>()("ValidationError", {
  field: Schema.String,
  message: Schema.String,
}) {}

class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFoundError", {
  resource: Schema.String,
  id: Schema.String,
}) {}
```

```ts never
return yield* Effect.fail(new Error("Card declined"));
```
