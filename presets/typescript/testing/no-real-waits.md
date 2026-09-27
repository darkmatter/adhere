---
description: A test of code that depends on time passing, such as a timeout, a retry delay, or an expiry, should advance a fake clock, such as with `vi.useFakeTimers()` and `vi.advanceTimersByTime`, and should not sleep for real time.
excludeIf: ["waiting for asynchronous work to settle, such as with Testing Library's waitFor or findBy"]
tests: only
---

## Should

```ts
vi.useFakeTimers();
const session = createSession({ ttl: 60_000 });
vi.advanceTimersByTime(60_001);
expect(session.isExpired()).toBe(true);
```

## Should not

```ts
const session = createSession({ ttl: 50 });
await new Promise((resolve) => setTimeout(resolve, 60));
expect(session.isExpired()).toBe(true);
```
