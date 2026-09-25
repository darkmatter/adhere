# alchemy

`adhere lint`'s report on
[alchemy-run/alchemy](https://github.com/alchemy-run/alchemy/tree/8a284d039387f63690225b9c86c738696af52358)
at `8a284d0`, split into one file per rule. None of it is labeled or scored
yet: each finding is a pair of a rule and a file to judge, the way
`labels.json` judges pairs on adhere's own code.

## The run

- **Code:** alchemy at `8a284d0`, from 2026-09-23: 10,333 files read, 15 of
  them too long to judge.
- **Rules:** adhere 0.9.5's two presets, `effect` with 19 rules and `alchemy`
  with 43, at a threshold of 0.7 given with `--threshold`. The checkout has no
  config or rules of its own.
- **Judgments:** every one made on 2026-09-25 with the default model,
  jev-latest, from an empty cache. The plan put judging at about 260 million
  input tokens, about $10.93, before locating findings. The first run stopped
  after 706 files at Jev's rate limit, and a second, at `--rpm 400`, judged the
  other 9,612.
- **Findings:** 3,083 in 2,047 files, from 45 rules. Seventeen found nothing:
  `effect/errors/defects-for-bugs`, `effect/services/fresh-layer-per-test`, and
  fifteen of alchemy's, `alchemy/data/hyperdrive-direct-origin`,
  `alchemy/data/single-migration-owner`, `alchemy/durable/io-inside-steps`,
  `alchemy/durable/no-self-triggering-bucket-writes`,
  `alchemy/durable/stable-step-names`, `alchemy/durable/webhook-state-is-truth`,
  `alchemy/providers/lazy-layer-construction`,
  `alchemy/resources/remote-state-for-ci`,
  `alchemy/resources/stable-logical-ids`,
  `alchemy/runtime/deterministic-config-defaults`,
  `alchemy/secrets/none-in-browser-env`,
  `alchemy/secrets/unwrap-before-compare-or-send`,
  `alchemy/security/github-secret-not-variable`,
  `alchemy/security/keep-auth-protections-on`,
  `alchemy/security/least-privilege-ci-credentials`.

## A rule's file

Each preset's rules sit under its name, `effect/` or `alchemy/`, as the report
names them. A rule's file holds its description and the hint its findings
showed, once, then every finding, highest probability first: the probability,
the file, line, and column Jev pointed at, and the code around it as the report
showed it, with that line marked `>`. Paths are from alchemy's root; to open
one at the commit, prefix
`https://github.com/alchemy-run/alchemy/blob/8a284d039387f63690225b9c86c738696af52358/`.

The report printed the description and hint with every finding; nothing else
was left out, except spaces at the ends of lines.

| Rule                                                                                                                          | Findings | Highest | Lowest |
| ----------------------------------------------------------------------------------------------------------------------------- | -------: | ------: | -----: |
| [effect/data/brand-meaningful-primitives](effect/data/brand-meaningful-primitives.md)                                         |    1,098 |    0.96 |   0.71 |
| [effect/basics/external-calls-are-resilient](effect/basics/external-calls-are-resilient.md)                                   |      372 |    0.95 |   0.71 |
| [alchemy/security/authorize-public-endpoints](alchemy/security/authorize-public-endpoints.md)                                 |      332 |    0.96 |   0.71 |
| [effect/services/test-layers-are-in-memory](effect/services/test-layers-are-in-memory.md)                                     |      258 |    0.91 |   0.71 |
| [effect/services/operations-have-no-requirements](effect/services/operations-have-no-requirements.md)                         |      184 |    0.91 |   0.71 |
| [alchemy/resources/stage-unique-physical-names](alchemy/resources/stage-unique-physical-names.md)                             |      170 |    0.91 |   0.71 |
| [alchemy/apis/schemas-at-trust-boundaries](alchemy/apis/schemas-at-trust-boundaries.md)                                       |       93 |    0.95 |   0.71 |
| [effect/services/dependencies-through-layers](effect/services/dependencies-through-layers.md)                                 |       88 |    0.91 |   0.71 |
| [effect/data/variants-are-tagged-unions](effect/data/variants-are-tagged-unions.md)                                           |       81 |    0.92 |   0.71 |
| [effect/basics/gen-for-sequencing](effect/basics/gen-for-sequencing.md)                                                       |       67 |    0.91 |   0.71 |
| [alchemy/runtime/no-per-request-work-at-construction](alchemy/runtime/no-per-request-work-at-construction.md)                 |       66 |    0.93 |   0.71 |
| [alchemy/secrets/never-logged-returned-or-output](alchemy/secrets/never-logged-returned-or-output.md)                         |       40 |    0.95 |   0.71 |
| [alchemy/data/commit-migrations-then-deploy](alchemy/data/commit-migrations-then-deploy.md)                                   |       26 |    0.96 |   0.73 |
| [alchemy/providers/idempotent-delete](alchemy/providers/idempotent-delete.md)                                                 |       20 |    0.89 |   0.71 |
| [alchemy/secrets/redacted-until-use](alchemy/secrets/redacted-until-use.md)                                                   |       17 |    0.92 |   0.71 |
| [effect/errors/wrap-external-errors](effect/errors/wrap-external-errors.md)                                                   |       17 |    0.84 |   0.71 |
| [alchemy/runtime/disposables-in-request-scope](alchemy/runtime/disposables-in-request-scope.md)                               |       15 |    0.82 |   0.73 |
| [alchemy/resources/protect-irreplaceable-data](alchemy/resources/protect-irreplaceable-data.md)                               |       13 |    0.88 |   0.71 |
| [alchemy/runtime/bind-tag-not-implementation](alchemy/runtime/bind-tag-not-implementation.md)                                 |       13 |    0.80 |   0.71 |
| [effect/basics/instrument-with-pipe](effect/basics/instrument-with-pipe.md)                                                   |       13 |    0.90 |   0.71 |
| [alchemy/resources/previews-reference-shared-resources](alchemy/resources/previews-reference-shared-resources.md)             |       11 |    0.90 |   0.71 |
| [alchemy/secrets/let-alchemy-mint-infra-secrets](alchemy/secrets/let-alchemy-mint-infra-secrets.md)                           |       10 |    0.85 |   0.71 |
| [alchemy/durable/idempotent-event-handlers](alchemy/durable/idempotent-event-handlers.md)                                     |        8 |    0.93 |   0.71 |
| [alchemy/providers/diff-guards-unresolved-props](alchemy/providers/diff-guards-unresolved-props.md)                           |        8 |    0.83 |   0.72 |
| [alchemy/runtime/resolve-config-and-bindings-at-construction](alchemy/runtime/resolve-config-and-bindings-at-construction.md) |        8 |    0.94 |   0.75 |
| [alchemy/providers/reconcile-from-observed-state](alchemy/providers/reconcile-from-observed-state.md)                         |        6 |    0.80 |   0.71 |
| [alchemy/security/lookup-failure-is-not-anonymous](alchemy/security/lookup-failure-is-not-anonymous.md)                       |        6 |    0.90 |   0.86 |
| [effect/config/business-logic-depends-on-config-service](effect/config/business-logic-depends-on-config-service.md)           |        6 |    0.80 |   0.71 |
| [alchemy/data/never-disable-tls-verification](alchemy/data/never-disable-tls-verification.md)                                 |        5 |    0.96 |   0.72 |
| [alchemy/data/parameterized-sql](alchemy/data/parameterized-sql.md)                                                           |        5 |    0.88 |   0.72 |
| [effect/config/secrets-are-redacted](effect/config/secrets-are-redacted.md)                                                   |        4 |    0.93 |   0.84 |
| [effect/services/no-mutable-state](effect/services/no-mutable-state.md)                                                       |        4 |    0.79 |   0.71 |
| [alchemy/resources/anchor-paths-with-import-meta](alchemy/resources/anchor-paths-with-import-meta.md)                         |        3 |    0.79 |   0.76 |
| [alchemy/data/private-endpoint-at-runtime](alchemy/data/private-endpoint-at-runtime.md)                                       |        2 |    0.76 |   0.74 |
| [effect/config/tests-provide-values-directly](effect/config/tests-provide-values-directly.md)                                 |        2 |    0.80 |   0.74 |
| [effect/config/validate-with-schema](effect/config/validate-with-schema.md)                                                   |        2 |    0.80 |   0.73 |
| [effect/services/memoize-parameterized-layers](effect/services/memoize-parameterized-layers.md)                               |        2 |    0.78 |   0.77 |
| [alchemy/apis/match-remote-errors-by-tag](alchemy/apis/match-remote-errors-by-tag.md)                                         |        1 |    0.84 |   0.84 |
| [alchemy/data/migrations-use-direct-url](alchemy/data/migrations-use-direct-url.md)                                           |        1 |    0.85 |   0.85 |
| [alchemy/resources/idempotent-actions-and-seeds](alchemy/resources/idempotent-actions-and-seeds.md)                           |        1 |    0.79 |   0.79 |
| [alchemy/runtime/lambda-no-post-response-work](alchemy/runtime/lambda-no-post-response-work.md)                               |        1 |    0.76 |   0.76 |
| [alchemy/security/identity-from-verified-session](alchemy/security/identity-from-verified-session.md)                         |        1 |    0.75 |   0.75 |
| [alchemy/security/least-privilege-bindings](alchemy/security/least-privilege-bindings.md)                                     |        1 |    0.89 |   0.89 |
| [effect/errors/catch-defects-at-boundaries-only](effect/errors/catch-defects-at-boundaries-only.md)                           |        1 |    0.77 |   0.77 |
| [effect/testing/test-clock-for-time](effect/testing/test-clock-for-time.md)                                                   |        1 |    0.82 |   0.82 |

## Judging them

Label a finding as `labels.json` does: `real`, `false`, or `debatable`, with a
note saying why. The harness does not read these yet; scoring them needs
alchemy's files at `8a284d0`, which it would have to fetch.
