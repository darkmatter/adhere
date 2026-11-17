# effect/config/tests-provide-values-directly

The [preset rule](../../../../../presets/effect/config/tests-provide-values-directly/RULE.md)
distinguishes testing a config consumer from testing how configuration is
read. Both reviewed pre-ignore findings in `darkmatter/agents` test the
connection between host bindings and a span observer.

- `apps/platform-runtime/test/spans-host-wiring.test.ts:54-56` (probability 0.83, context 0.47):
  The `postgresTest` case `installs the span observer from the env and serves its ingest route`
  sets host environment values before `createPlatformRuntime`. It checks that
  the installed observer posts to the configured endpoint with the configured
  bearer. Providing an observer directly would bypass what the test asserts.
- `packages/connect/edge/test/effect-runtime.test.ts:197-201` (probability 0.87, context 0.45):
  The case `installs span ingest from the Worker env when no override is given`
  sets `platformEnvironment`, then calls `makePlatformRuntime` without an
  instrumentation override. It checks where the resulting observer sends
  its batch; a prebuilt config or observer would not test the Worker bindings.

**Regression hint:** Keep the environment setup when a renamed binding should
break the assertion. Flag the same setup when it merely supplies an endpoint
to an unrelated operation whose config service could be provided directly.
