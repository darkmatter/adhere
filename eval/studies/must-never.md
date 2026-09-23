# Must and never in the description

**Question.** The [vocabulary study](rule-vocabulary.md) found the must
sentence worse than 0.6.1's, but its arms carried descriptions that said
"should" beside examples labeled `must`. If the description says must and
never too, so the rule and its examples agree, does must and never win? The
idea: RFC 2119's words are how specifications state requirements, so Jev has
likely seen them used that way.

**Setup.** jev-1.13.0, 2026-09-23. The Effect preset reworded: each
description says what code must be and what it must never be, each rule gained
a `never` block (the vocabulary study's bad examples, two revised), and
fn-for-named-effects says an Effect held in a constant is not a function. Two
runs: the first compared the must sentence with 0.6's, the second 0.6's
sentence under the two sets of field names.

## Arms

**0.6's sentence**, as in the [vocabulary study](rule-vocabulary.md), with the
rule's `must` code sent as `reference` and its `never` code as `avoid`.

**0.6's sentence with must and never fields**, the same with the code under
the rule's own words:

```json
{
  "instructions": {
    "question": "Does `code` diverge from the pattern shown in `must`, for example by doing what `never` shows, as described by `rule`? Answer no if the pattern does not apply to this file.",
    "rule": "<description>",
    "must": "<code>",
    "never": "<code>"
  },
  "criteria": {
    "true": "`code` diverges from the pattern shown in `must`, for example by doing what `never` shows, in code that `rule` is about",
    "false": "`code` follows the pattern, or has no code that `rule` is about"
  }
}
```

**The must sentence**, the vocabulary study's "must, with never" arm: "Where
`rule` applies, code must be written the way `must` shows, and never written
the way `never` shows. Does `code` break this?"

## Results

| arm                                   | hard AUC | caught / wrong at 0.7 | at 0.8 | at 0.9 |
| ------------------------------------- | -------- | --------------------- | ------ | ------ |
| 0.6's sentence, first run             | 0.970    | 43 / 2                | 34 / 1 | 24 / 1 |
| the must sentence                     | 0.930    | 31 / 5                | 26 / 1 | 11 / 0 |
| 0.6's sentence, second run            | 0.967    | 43 / 2                | 34 / 1 | 24 / 1 |
| 0.6's sentence, must and never fields | 0.961    | 41 / 5                | 31 / 2 | 23 / 1 |

Against the preset before rewording, with the standing comparison:

| request    | preset             | hard AUC     | caught / wrong at 0.8 |
| ---------- | ------------------ | ------------ | --------------------- |
| 0.6.1's    | as 0.6.1 worded it | 0.911, 0.913 | 32 / 6, 32 / 5        |
| as shipped | reworded           | 0.951, 0.948 | 32 / 1, 31 / 1        |
| 0.4's      | as 0.6.1 worded it | 0.891        | 24 / 8                |
| 0.4's      | reworded           | 0.954, 0.962 | 30 / 1, 30 / 0        |

## What we learned

- **Rewording the descriptions, with a bad example per rule, was the largest
  gain of any study.** At 0.8, adhere caught as many and got 1 wrong where it
  had got 5 or 6. It lifted every request shape, 0.4's rules in the state
  most of all: on the reworded preset, 0.4's request ranks as well as the
  current one, and what keeps each rule in its own question is that the cache
  stays consistent and a request fits Jev's context.
- **The sentence still matters.** On the same preset, the must sentence caught
  8 fewer at 0.8 than 0.6's, for the same one wrong.
- **The field names cost a little.** Must and never fields ranked 0.006 below
  reference and avoid, where two runs of one arm differed by 0.003, and caught
  3 fewer at 0.8 with one more wrong.

## Decided

Rule files and configs write examples as `must` and `never`, or `should` and
`should not` for a guideline, and descriptions use the same words (5b19760).
Jev reads the code under those words, in 0.6's sentence: the field names'
small cost buys a request that says what authors write. Switching them back to
`reference` and `avoid` is a change to `fieldOf` in `src/services/Jev.ts`. The
preset was reworded as above (62b390a).
