# effect/testing/test-clock-for-time

The [preset rule](../../../../../presets/effect/testing/test-clock-for-time/RULE.md)
calls for `TestClock` when the behavior being tested runs on Effect time.
Both reviewed pre-ignore findings in `darkmatter/agents` wait for PostgreSQL,
but for different reasons.

- `apps/platform-runtime/test/runner-storage-transport.test.ts:416` (probability 0.83, context 0.57):
  The `postgresTest` case `a transaction left idle past the timeout ends its session and its socket`
  leaves a transaction idle until PostgreSQL's own timeout expires. It checks
  that the socket closes and the write rolls back; advancing `TestClock`
  would not expire the database session.
- `packages/compute/adhere/test/AdhereChecks.test.ts:289` (probability 0.90, context 0.76):
  In `keeps a busy coordinator's attempt open and schedules a later one instead of publishing`,
  `AdhereChecks.consume` runs while the test polls a job row. The sleep spaces
  reads until the first attempt and its new visibility time are persisted;
  the assertion does not wait out the retry delay.

**Regression hint:** Contrast an Effect-managed retry whose delay the test
can advance with a database timeout or a poll for a committed row. Advancing
`TestClock` does not advance the database clock or commit a transaction.
