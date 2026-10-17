# Presets

Every rule in adhere's built-in presets, with a one-line summary. Each id links
to the full rule, and is the id that reports, `overrides`, and `adhere-ignore`
comments use. [Presets](../README.md#presets) says how to name a preset or one
of its topics.

## typescript

- **Source.** The TypeScript Handbook and the Google TypeScript Style Guide.
- **Checked by a linter instead.** The preset has no rules for these, since
  typescript-eslint and ESLint check them exactly: unhandled promises
  (`no-floating-promises`), throwing non-errors (`only-throw-error`), `any`
  (`no-explicit-any`), exhaustive switches (`switch-exhaustiveness-check`), a
  lost `cause` (`preserve-caught-error`), and empty catch blocks (`no-empty`).

- [`typescript/async/concurrent-independent-work`](./typescript/async/concurrent-independent-work/RULE.md): Independent awaited calls run concurrently, not one after another.
- [`typescript/async/network-calls-have-timeouts`](./typescript/async/network-calls-have-timeouts/RULE.md): HTTP requests carry a timeout or an abort signal.
- [`typescript/design/no-argument-mutation`](./typescript/design/no-argument-mutation/RULE.md): Functions return changed copies instead of mutating arguments.
- [`typescript/errors/no-swallowed-errors`](./typescript/errors/no-swallowed-errors/RULE.md): Caught errors are handled, rethrown, or returned as failures.
- [`typescript/errors/release-on-every-path`](./typescript/errors/release-on-every-path/RULE.md): Acquired resources are released on every path, including errors.
- [`typescript/testing/assert-outcomes`](./typescript/testing/assert-outcomes/RULE.md): Tests assert results and effects, not only that code ran.
- [`typescript/testing/independent-tests`](./typescript/testing/independent-tests/RULE.md): Each test sets up its own state and relies on no other test.
- [`typescript/types/assertions-only-when-proven`](./typescript/types/assertions-only-when-proven/RULE.md): Type assertions claim only what surrounding code has proven.
- [`typescript/types/derive-dont-restate`](./typescript/types/derive-dont-restate/RULE.md): Types are derived from their source instead of restated by hand.
- [`typescript/types/unrepresentable-invalid-states`](./typescript/types/unrepresentable-invalid-states/RULE.md): Types make invalid field combinations unrepresentable.
- [`typescript/types/validate-external-data`](./typescript/types/validate-external-data/RULE.md): Data from outside is checked at runtime before use.

## react

- **Source.** react.dev, mostly
  [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
  and
  [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure).
- **Checked by a linter instead.** The preset has no rules for these, since
  the React Compiler's lint rules check them, in
  [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)'s
  recommended set and in Oxlint: pure render (`purity`), props and state
  never mutated (`immutability`), refs not read during render (`refs`), no
  `setState` in render or synchronously in an effect (`set-state-in-render`,
  `set-state-in-effect`), which covers state derived in an effect, and no
  component defined inside another (`static-components`).

- [`react/effects/clean-up-what-they-start`](./react/effects/clean-up-what-they-start/RULE.md): Effects return cleanup that undoes what they started.
- [`react/effects/event-logic-in-handlers`](./react/effects/event-logic-in-handlers/RULE.md): Code responding to a user action runs in its event handler.
- [`react/effects/external-stores-use-sync-external-store`](./react/effects/external-stores-use-sync-external-store/RULE.md): External stores are read with `useSyncExternalStore`.
- [`react/effects/fetches-ignore-stale-responses`](./react/effects/fetches-ignore-stale-responses/RULE.md): Effects that fetch ignore or abort stale responses.
- [`react/effects/notify-parents-in-handlers`](./react/effects/notify-parents-in-handlers/RULE.md): Parents are notified in the handler that makes the change.
- [`react/server/no-private-data-to-client`](./react/server/no-private-data-to-client/RULE.md): Client Components receive only the fields they show.
- [`react/server/server-functions-authorize-and-validate`](./react/server/server-functions-authorize-and-validate/RULE.md): Server Functions authorize callers and validate arguments.
- [`react/state/no-contradictory-state`](./react/state/no-contradictory-state/RULE.md): One status value replaces booleans that can contradict.
- [`react/state/no-props-copied-into-state`](./react/state/no-props-copied-into-state/RULE.md): Props are read during render, not copied into state.
- [`react/state/store-ids-not-copies`](./react/state/store-ids-not-copies/RULE.md): State holds a selected item's id, not a copy of the item.

## security

- **Source.** OWASP's cheat sheets.

- [`security/constant-time-secret-compare`](./security/constant-time-secret-compare/RULE.md): Received secrets are compared in constant time.
- [`security/no-secrets-in-output`](./security/no-secrets-in-output/RULE.md): Secrets stay out of logs, errors, and HTTP responses.
- [`security/no-untrusted-input-in-commands-or-paths`](./security/no-untrusted-input-in-commands-or-paths/RULE.md): Untrusted input stays out of command strings and unchecked paths.
- [`security/parameterized-queries`](./security/parameterized-queries/RULE.md): SQL values from outside are passed as bound parameters.

## effect

- **Source.** The
  [effect-solutions](https://github.com/kitlangton/effect-solutions) docs and
  the [effect/platform](https://effect.website/docs/platform/introduction/)
  docs.

- [`effect/basics/gen-for-sequencing`](./effect/basics/gen-for-sequencing/RULE.md): Sequential effectful steps use `Effect.gen` and `yield*`.
- [`effect/basics/instrument-with-pipe`](./effect/basics/instrument-with-pipe/RULE.md): Timeouts, retries, logging, and spans attach with `.pipe`.
- [`effect/config/business-logic-depends-on-config-service`](./effect/config/business-logic-depends-on-config-service/RULE.md): Business logic depends on a config service, not Config reads.
- [`effect/config/secrets-are-redacted`](./effect/config/secrets-are-redacted/RULE.md): Tokens, passwords, and keys are read with `Config.Redacted`.
- [`effect/config/tests-provide-values-directly`](./effect/config/tests-provide-values-directly/RULE.md): Tests supply config with `Layer.succeed` on the config service.
- [`effect/config/validate-with-schema`](./effect/config/validate-with-schema/RULE.md): Constrained config values are validated as they are read.
- [`effect/data/brand-meaningful-primitives`](./effect/data/brand-meaningful-primitives/RULE.md): Meaningful primitives in domain types are branded schemas.
- [`effect/data/variants-are-tagged-unions`](./effect/data/variants-are-tagged-unions/RULE.md): Domain variants are tagged schemas in a union.
- [`effect/errors/catch-defects-at-boundaries-only`](./effect/errors/catch-defects-at-boundaries-only/RULE.md): Defects are caught only at system boundaries.
- [`effect/errors/defects-for-bugs`](./effect/errors/defects-for-bugs/RULE.md): Bugs and invariant violations are defects, not typed errors.
- [`effect/errors/wrap-external-errors`](./effect/errors/wrap-external-errors/RULE.md): External errors are wrapped in tagged errors.
- [`effect/services/dependencies-through-layers`](./effect/services/dependencies-through-layers/RULE.md): Service dependencies are yielded inside the service's Layer.
- [`effect/services/fresh-layer-per-test`](./effect/services/fresh-layer-per-test/RULE.md): Each `it.effect` test provides its own layer.
- [`effect/services/memoize-parameterized-layers`](./effect/services/memoize-parameterized-layers/RULE.md): Parameterized layers are built once and stored in a constant.
- [`effect/services/no-mutable-state`](./effect/services/no-mutable-state/RULE.md): Service interfaces expose only readonly members.
- [`effect/testing/test-clock-for-time`](./effect/testing/test-clock-for-time/RULE.md): Tests that depend on time use `TestClock`.

## alchemy

- **Source.** alchemy's docs and blog.

- [`alchemy/apis/match-remote-errors-by-tag`](./alchemy/apis/match-remote-errors-by-tag/RULE.md): Remote errors are matched by tag and data, not `instanceof`.
- [`alchemy/apis/schemas-at-trust-boundaries`](./alchemy/apis/schemas-at-trust-boundaries/RULE.md): Outside input is schema-validated at trust boundaries.
- [`alchemy/data/commit-migrations-then-deploy`](./alchemy/data/commit-migrations-then-deploy/RULE.md): Migrations are committed ahead of time and applied as committed.
- [`alchemy/data/hyperdrive-direct-origin`](./alchemy/data/hyperdrive-direct-origin/RULE.md): Hyperdrive points at the database's direct endpoint.
- [`alchemy/data/migrations-use-direct-url`](./alchemy/data/migrations-use-direct-url/RULE.md): Migration runners connect with the database's direct URL.
- [`alchemy/data/never-disable-tls-verification`](./alchemy/data/never-disable-tls-verification/RULE.md): Database connections verify the server's TLS certificate.
- [`alchemy/data/private-endpoint-at-runtime`](./alchemy/data/private-endpoint-at-runtime/RULE.md): Service code reaches its database through the private binding.
- [`alchemy/data/single-migration-owner`](./alchemy/data/single-migration-owner/RULE.md): Each database has exactly one migration owner.
- [`alchemy/durable/idempotent-event-handlers`](./alchemy/durable/idempotent-event-handlers/RULE.md): Handlers for at-least-once events are idempotent.
- [`alchemy/durable/io-inside-steps`](./alchemy/durable/io-inside-steps/RULE.md): Workflow I/O runs inside steps; replayed code stays deterministic.
- [`alchemy/durable/no-self-triggering-bucket-writes`](./alchemy/durable/no-self-triggering-bucket-writes/RULE.md): Bucket handlers filter out events from their own writes.
- [`alchemy/durable/stable-step-names`](./alchemy/durable/stable-step-names/RULE.md): Workflow step names stay stable across replays.
- [`alchemy/durable/webhook-state-is-truth`](./alchemy/durable/webhook-state-is-truth/RULE.md): Paid access depends on webhook-recorded state, not success URLs.
- [`alchemy/providers/diff-guards-unresolved-props`](./alchemy/providers/diff-guards-unresolved-props/RULE.md): Provider diffs guard unresolved props with `isResolved`.
- [`alchemy/providers/idempotent-delete`](./alchemy/providers/idempotent-delete/RULE.md): Provider delete treats an already-gone resource as success.
- [`alchemy/providers/lazy-layer-construction`](./alchemy/providers/lazy-layer-construction/RULE.md): Provider layers defer credentials and connections until use.
- [`alchemy/providers/reconcile-from-observed-state`](./alchemy/providers/reconcile-from-observed-state/RULE.md): Provider reconcile converges from the resource's live state.
- [`alchemy/resources/anchor-paths-with-import-meta`](./alchemy/resources/anchor-paths-with-import-meta/RULE.md): Path props of resources declared outside the run directory use `import.meta`.
- [`alchemy/resources/idempotent-actions-and-seeds`](./alchemy/resources/idempotent-actions-and-seeds/RULE.md): Actions and seed files are safe to run again.
- [`alchemy/resources/previews-reference-shared-resources`](./alchemy/resources/previews-reference-shared-resources/RULE.md): Preview stages reference shared resources and add cheap pieces.
- [`alchemy/resources/protect-irreplaceable-data`](./alchemy/resources/protect-irreplaceable-data/RULE.md): Buckets and databases with irreplaceable data are retained.
- [`alchemy/resources/remote-state-for-ci`](./alchemy/resources/remote-state-for-ci/RULE.md): CI and multi-machine stacks use a shared state store.
- [`alchemy/resources/stable-logical-ids`](./alchemy/resources/stable-logical-ids/RULE.md): Resource logical ids stay the same across deploys.
- [`alchemy/resources/stage-unique-physical-names`](./alchemy/resources/stage-unique-physical-names/RULE.md): Global physical names are derived per stage.
- [`alchemy/runtime/bind-tag-not-implementation`](./alchemy/runtime/bind-tag-not-implementation/RULE.md): Other runtimes bind the Tag; only the Stack provides the Layer.
- [`alchemy/runtime/deterministic-config-defaults`](./alchemy/runtime/deterministic-config-defaults/RULE.md): Config defaults and fallbacks are deterministic.
- [`alchemy/runtime/disposables-in-request-scope`](./alchemy/runtime/disposables-in-request-scope/RULE.md): Disposables are acquired inside handlers, within request scope.
- [`alchemy/runtime/lambda-no-post-response-work`](./alchemy/runtime/lambda-no-post-response-work/RULE.md): Lambda handlers write durable work before responding.
- [`alchemy/runtime/no-per-request-work-at-construction`](./alchemy/runtime/no-per-request-work-at-construction/RULE.md): Construction builds resources and handlers, not per-request work.
- [`alchemy/runtime/resolve-config-and-bindings-at-construction`](./alchemy/runtime/resolve-config-and-bindings-at-construction/RULE.md): Config and bindings are resolved at construction, not in handlers.
- [`alchemy/secrets/let-alchemy-mint-infra-secrets`](./alchemy/secrets/let-alchemy-mint-infra-secrets/RULE.md): Infrastructure tokens are minted once by alchemy, not hardcoded.
- [`alchemy/secrets/none-in-browser-env`](./alchemy/secrets/none-in-browser-env/RULE.md): Browser-inlined env values hold only public configuration.
- [`alchemy/secrets/redacted-until-use`](./alchemy/secrets/redacted-until-use/RULE.md): Secrets stay `Redacted` until the call that needs the raw string.
- [`alchemy/secrets/unwrap-before-compare-or-send`](./alchemy/secrets/unwrap-before-compare-or-send/RULE.md): `Redacted` values are unwrapped before compare, send, or serialize.
- [`alchemy/security/authorize-public-endpoints`](./alchemy/security/authorize-public-endpoints/RULE.md): Public handlers authenticate and authorize every caller.
- [`alchemy/security/github-secret-not-variable`](./alchemy/security/github-secret-not-variable/RULE.md): Sensitive CI values use `GitHub.Secret`, not `GitHub.Variable`.
- [`alchemy/security/identity-from-verified-session`](./alchemy/security/identity-from-verified-session/RULE.md): The acting user comes from the verified session or token.
- [`alchemy/security/keep-auth-protections-on`](./alchemy/security/keep-auth-protections-on/RULE.md): Auth checks and protections stay enabled.
- [`alchemy/security/least-privilege-bindings`](./alchemy/security/least-privilege-bindings/RULE.md): Runtimes bind the narrowest capability their calls need.
- [`alchemy/security/least-privilege-ci-credentials`](./alchemy/security/least-privilege-ci-credentials/RULE.md): CI credentials are scoped to what the stack deploys.
- [`alchemy/security/lookup-failure-is-not-anonymous`](./alchemy/security/lookup-failure-is-not-anonymous/RULE.md): A failed session lookup is an error, not an anonymous user.
