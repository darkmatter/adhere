# effect/basics/instrument-with-pipe

The [preset rule](../../../../../presets/effect/basics/instrument-with-pipe/RULE.md)
covers timeouts, retries, logging, and spans. The one reviewed pre-ignore
finding in `darkmatter/agents` was a polling interval.

- `apps/chat/src/features/chat/hooks/usePolled.ts:68` (probability 0.85, context 0.68):
  `usePolled` sleeps between visible refreshes in `pollOnce`, after both
  success and failure. The sleep sets the refresh rate; it neither retries a
  failed request nor imposes a deadline.

**Regression hint:** Compare a poll that waits after every result with a
request that sleeps and retries only on failure. Only the latter implements
retry policy in the effect body.
