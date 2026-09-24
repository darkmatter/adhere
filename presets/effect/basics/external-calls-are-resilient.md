---
description: A call over the network, such as an HTTP request, a database query, or a third-party API, should carry a timeout and a retry schedule, and should not go out bare. A call through a client that already applies both, such as an HttpClient built with a timeout and retryTransient or an SDK with its own retries, has them. Calls through the platform FileSystem and Path services are local and are not in scope.
---

```ts should
const retryPolicy = Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)));

const resilientCall = HttpClient.get("https://api.example.com/users").pipe(
  Effect.timeout("2 seconds"),
  Effect.retry(retryPolicy),
  Effect.timeout("10 seconds"),
);
```

```ts should not
const response = yield* HttpClient.get(`https://api.example.com/users/${id}`);
```
