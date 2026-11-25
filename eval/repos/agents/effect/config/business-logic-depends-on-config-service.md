# effect/config/business-logic-depends-on-config-service

The [preset rule](../../../../../presets/effect/config/business-logic-depends-on-config-service/RULE.md)
targets business logic that reads a raw configuration primitive. Of the
three reviewed pre-ignore findings in `darkmatter/agents`, two read inputs
during deployment or Worker construction; the third uses the config service.

- `apps/chat/src/deployment/chat-auth-webhook.ts:58-59` (probability 0.84, context 0.38):
  `withGitHubWebhook` reads the optional platform settings while assembling
  the auth Worker. Its `deliver` handler uses the client prepared there; it
  does not read configuration for each delivery.
- `apps/chat/src/deployment/preview-runtime.ts:161-173` (probability 0.88, context 0.49):
  `previewRuntime` reads the reviewer stage and runtime image for an Alchemy
  deployment manifest. The settings configure the preview being deployed;
  these reads do not execute in its request handlers.
- `apps/platform-runtime/src/runtime/coder-admission.ts:137` (probability 0.86, context 0.67):
  `admitCoder` yields `Config` from `@repo/config`. `coderRepositories`
  parses the allowlist already supplied by that service, not an environment
  variable or an `effect/Config` primitive.

**Regression hint:** Keep a primitive read in a deployment builder and a
handler that yields an application service named `Config` unflagged. Move
a raw read into the handler's business operation and expect a finding.
