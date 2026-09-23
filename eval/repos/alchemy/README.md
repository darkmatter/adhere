# alchemy

`adhere lint`'s report on
[alchemy-run/alchemy](https://github.com/alchemy-run/alchemy/tree/8a284d039387f63690225b9c86c738696af52358)
at `8a284d0`, split into one file per rule. None of it is labeled or scored
yet: each finding is a pair of a rule and a file to judge, the way
`labels.json` judges pairs on adhere's own code.

## The run

- **Code:** alchemy at `8a284d0`, from 2026-09-23: 10,333 files read, 16 of
  them skipped.
- **Rules:** adhere 0.7.3's Effect preset, the one at `62b390a`, 26 rules, at
  the config's threshold of 0.7, and the two example rules an earlier
  `adhere init` wrote, which set their own threshold of 0.8.
- **Judgments:** all from the checkout's cache (0 judged, 10,317 cached), made
  on 2026-09-23 with the default model, jev-latest.
- **Findings:** 4,916 in 2,636 files, from 25 rules. `defects-for-bugs`,
  `fresh-layer-per-test`, and `name-domain-actions` found nothing.

Since 0.7.3, seven of these rules have left the preset for Effect's language
service to check (`4ae0126`), and two are worded differently (`6efc47f`); each
one's file says so.

## A rule's file

The rule's description and the hint its findings showed, once, then every
finding, highest probability first: the probability, the file and line Jev
pointed at, and that line as the report showed it, trimmed and cut at 120
characters. Paths are from alchemy's root; to open one at the commit, prefix
`https://github.com/alchemy-run/alchemy/blob/8a284d039387f63690225b9c86c738696af52358/`.

The report printed the description and hint with every finding, which made it
4 MB; nothing else was left out.

| Rule                                                                                                              | Findings | Highest | Lowest |
| ----------------------------------------------------------------------------------------------------------------- | -------: | ------: | -----: |
| [basics/external-calls-are-resilient](basics/external-calls-are-resilient.md) (reworded since)                    |    1,825 |    0.96 |   0.71 |
| [data/brand-meaningful-primitives](data/brand-meaningful-primitives.md)                                           |    1,102 |    0.95 |   0.71 |
| [basics/fn-for-named-effects](basics/fn-for-named-effects.md) (left the preset)                                   |      432 |    0.96 |   0.71 |
| [errors/domain-errors-are-tagged](errors/domain-errors-are-tagged.md) (left the preset)                           |      394 |    0.94 |   0.71 |
| [data/records-are-schema-classes](data/records-are-schema-classes.md)                                             |      330 |    0.93 |   0.71 |
| [services/test-layers-are-in-memory](services/test-layers-are-in-memory.md)                                       |      297 |    0.94 |   0.71 |
| [data/decode-json-with-schema](data/decode-json-with-schema.md) (left the preset)                                 |      145 |    0.95 |   0.71 |
| [platform/os-access-through-platform-services](platform/os-access-through-platform-services.md) (left the preset) |      102 |    0.96 |   0.71 |
| [services/provide-at-entry](services/provide-at-entry.md) (left the preset)                                       |       95 |    0.92 |   0.71 |
| [basics/gen-for-sequencing](basics/gen-for-sequencing.md)                                                         |       66 |    0.92 |   0.71 |
| [data/variants-are-tagged-unions](data/variants-are-tagged-unions.md)                                             |       33 |    0.91 |   0.71 |
| [basics/instrument-with-pipe](basics/instrument-with-pipe.md)                                                     |       22 |    0.90 |   0.71 |
| [errors/wrap-external-errors](errors/wrap-external-errors.md)                                                     |       20 |    0.84 |   0.71 |
| [services/methods-have-no-requirements](services/methods-have-no-requirements.md) (left the preset)               |       13 |    0.93 |   0.71 |
| [style/prefer-small-files](style/prefer-small-files.md) (init example)                                            |        7 |    0.84 |   0.81 |
| [cli/handlers-delegate](cli/handlers-delegate.md)                                                                 |        6 |    0.85 |   0.71 |
| [config/secrets-are-redacted](config/secrets-are-redacted.md)                                                     |        5 |    0.93 |   0.71 |
| [config/business-logic-depends-on-config-service](config/business-logic-depends-on-config-service.md)             |        4 |    0.79 |   0.73 |
| [config/tests-provide-values-directly](config/tests-provide-values-directly.md)                                   |        4 |    0.79 |   0.71 |
| [config/validate-with-schema](config/validate-with-schema.md)                                                     |        4 |    0.92 |   0.77 |
| [services/no-mutable-state](services/no-mutable-state.md)                                                         |        3 |    0.78 |   0.72 |
| [errors/catch-defects-at-boundaries-only](errors/catch-defects-at-boundaries-only.md)                             |        2 |    0.77 |   0.72 |
| [services/memoize-parameterized-layers](services/memoize-parameterized-layers.md)                                 |        2 |    0.80 |   0.77 |
| [testing/test-clock-for-time](testing/test-clock-for-time.md) (reworded since)                                    |        2 |    0.83 |   0.71 |
| [testing/test-random](testing/test-random.md) (left the preset)                                                   |        1 |    0.79 |   0.79 |

## Judging them

Label a finding as `labels.json` does: `real`, `false`, or `debatable`, with a
note saying why. The harness does not read these yet; scoring them needs
alchemy's files at `8a284d0`, which it would have to fetch.
