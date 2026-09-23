---
description: An error from an external library is wrapped in a tagged error with a Schema.Defect field, not passed through raw.
---

```ts
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
