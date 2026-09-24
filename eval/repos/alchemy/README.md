# alchemy

`adhere lint`'s report on
[alchemy-run/alchemy](https://github.com/alchemy-run/alchemy/tree/8a284d039387f63690225b9c86c738696af52358)
at `8a284d0`, split into one file per rule. None of it is labeled or scored
yet: each finding is a pair of a rule and a file to judge, the way
`labels.json` judges pairs on adhere's own code.

## The run

- **Code:** alchemy at `8a284d0`, from 2026-09-23: 10,333 files read, 15 of
  them skipped.
- **Rules:** adhere 0.8.0's Effect preset, 19 rules, at the config's threshold
  of 0.7, and the two example rules an earlier `adhere init` wrote, which set
  their own threshold of 0.8.
- **Judgments:** all from the checkout's cache (0 judged, 10,318 cached), made
  with the default model, jev-latest.
- **Findings:** 3,622 in 2,330 files, from 18 rules. `defects-for-bugs`,
  `fresh-layer-per-test`, and `name-domain-actions` found nothing.

Since the run, `cli/handlers-delegate` has left the preset, and six rules are
worded differently: four are guidelines that say "should", and two ask less.
Each one's file says so.

## A rule's file

The rule's description and the hint its findings showed, once, then every
finding, highest probability first: the probability, the file, line, and
column Jev pointed at, and the code around it as the report showed it, with
that line marked `>`. Paths are from alchemy's root; to open one at the
commit, prefix
`https://github.com/alchemy-run/alchemy/blob/8a284d039387f63690225b9c86c738696af52358/`.

The report printed the description and hint with every finding; nothing else
was left out, except spaces at the ends of lines.

| Rule                                                                                                  | Findings | Highest | Lowest |
| ----------------------------------------------------------------------------------------------------- | -------: | ------: | -----: |
| [basics/external-calls-are-resilient](basics/external-calls-are-resilient.md) (reworded since)        |    1,702 |    0.96 |   0.71 |
| [data/brand-meaningful-primitives](data/brand-meaningful-primitives.md)                               |    1,104 |    0.96 |   0.71 |
| [data/records-are-schema-classes](data/records-are-schema-classes.md) (reworded since)                |      332 |    0.92 |   0.71 |
| [services/test-layers-are-in-memory](services/test-layers-are-in-memory.md) (reworded since)          |      301 |    0.94 |   0.71 |
| [basics/gen-for-sequencing](basics/gen-for-sequencing.md)                                             |       72 |    0.92 |   0.71 |
| [data/variants-are-tagged-unions](data/variants-are-tagged-unions.md) (reworded since)                |       33 |    0.89 |   0.71 |
| [basics/instrument-with-pipe](basics/instrument-with-pipe.md)                                         |       18 |    0.90 |   0.71 |
| [errors/wrap-external-errors](errors/wrap-external-errors.md)                                         |       17 |    0.84 |   0.71 |
| [config/validate-with-schema](config/validate-with-schema.md) (reworded since)                        |        7 |    0.92 |   0.72 |
| [style/prefer-small-files](style/prefer-small-files.md) (init example)                                |        7 |    0.84 |   0.81 |
| [cli/handlers-delegate](cli/handlers-delegate.md) (left the preset)                                   |        6 |    0.85 |   0.71 |
| [config/tests-provide-values-directly](config/tests-provide-values-directly.md) (reworded since)      |        6 |    0.79 |   0.71 |
| [config/business-logic-depends-on-config-service](config/business-logic-depends-on-config-service.md) |        5 |    0.79 |   0.72 |
| [config/secrets-are-redacted](config/secrets-are-redacted.md)                                         |        5 |    0.93 |   0.75 |
| [services/no-mutable-state](services/no-mutable-state.md)                                             |        3 |    0.79 |   0.71 |
| [services/memoize-parameterized-layers](services/memoize-parameterized-layers.md)                     |        2 |    0.74 |   0.71 |
| [errors/catch-defects-at-boundaries-only](errors/catch-defects-at-boundaries-only.md)                 |        1 |    0.77 |   0.77 |
| [testing/test-clock-for-time](testing/test-clock-for-time.md)                                         |        1 |    0.78 |   0.78 |

## Judging them

Label a finding as `labels.json` does: `real`, `false`, or `debatable`, with a
note saying why. The harness does not read these yet; scoring them needs
alchemy's files at `8a284d0`, which it would have to fetch.
