---
description: An error from an external library must be wrapped in a tagged error with a Schema.Defect field, never passed through raw.
---

```ts must
class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  endpoint: Schema.String,
  statusCode: Schema.Number,
  error: Schema.Defect(),
}) {}

const fetchUser = (id: string) =>
  HttpClient.get(`/api/users/${id}`).pipe(
    Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
    Effect.mapError(
      (error) =>
        new ApiError({
          endpoint: `/api/users/${id}`,
          statusCode: 500,
          error,
        }),
    ),
  );
```

```ts never
const charge = (amount: number) =>
  Effect.tryPromise(() => stripe.charges.create({ amount, currency: "usd" }));
```
