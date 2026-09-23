# testing/test-clock-for-time

A test that waits out a TTL with a real sleep breaks the rule. The same test
with `TestClock` follows it, and so does `it.live` timing a real round trip,
which needs the real clock.

```ts breaks
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { Sessions } from "../src/Sessions.ts";

it.live("expires a session after its ttl", () =>
  Effect.gen(function* () {
    const sessions = yield* Sessions;
    const id = yield* sessions.create({ ttl: "2 seconds" });
    yield* Effect.sleep("3 seconds");
    expect(yield* sessions.isActive(id)).toBe(false);
  }).pipe(Effect.provide(Sessions.layer)),
);
```

```ts follows
import { expect, it } from "@effect/vitest";
import { Effect, TestClock } from "effect";
import { Sessions } from "../src/Sessions.ts";

it.effect("expires a session after its ttl", () =>
  Effect.gen(function* () {
    const sessions = yield* Sessions;
    const id = yield* sessions.create({ ttl: "2 seconds" });
    yield* TestClock.adjust("3 seconds");
    expect(yield* sessions.isActive(id)).toBe(false);
  }).pipe(Effect.provide(Sessions.layer)),
);
```

```ts follows
import { expect, it } from "@effect/vitest";
import { Duration, Effect } from "effect";
import { HealthCheck } from "../src/HealthCheck.ts";

// Times a real round trip to the local server, so it needs the real clock.
it.live("answers a health check within 200ms on localhost", () =>
  Effect.gen(function* () {
    const health = yield* HealthCheck;
    const [elapsed] = yield* Effect.timed(health.ping("http://localhost:8080/health"));
    expect(Duration.toMillis(elapsed)).toBeLessThan(200);
  }).pipe(Effect.provide(HealthCheck.layer)),
);
```
