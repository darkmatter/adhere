---
description: A call over the network, such as an HTTP request, a database query, or a third-party API, carries a timeout and a retry schedule. Calls through the platform FileSystem and Path services are local and are not in scope.
---

```ts
const retryPolicy = Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)));

const resilientCall = HttpClient.get("https://api.example.com/users").pipe(
  Effect.timeout("2 seconds"),
  Effect.retry(retryPolicy),
  Effect.timeout("10 seconds"),
);
```
