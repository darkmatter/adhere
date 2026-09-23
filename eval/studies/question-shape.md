# Where the rule goes

**Question.** 0.4 put every rule into the request's shared state and pointed
each question at its rule by path. TypeSafe's notes on Jev 1.13 list both
unrelated state and indirection as ways Jev loses accuracy, and the layout
made a cached answer depend on which other rules shared the request. Does
each rule in its own question do better, and should that question carry Noul
criteria, which TypeSafe says to try both with and without?

**Setup.** jev-1.13.0, 2026-09-23. The Effect preset as of 0.6.0: descriptions
stated as facts, one reference block per rule, no code to avoid. The first
three arms ran twice.

## Arms

**0.4.** Every rule in `state.rules`, and each question a string:

```text
Does state.code diverge from the pattern shown in state.rules["id"].reference,
as described by state.rules["id"].description? Answer no if the pattern does
not apply to this file.
```

**In the question.** The same sentence, with the rule in the question and the
state only the numbered code:

```json
{
  "question": "Does `code` diverge from the pattern shown in `reference`, as described by `rule`? Answer no if the pattern does not apply to this file.",
  "rule": "<description>",
  "reference": "<code>"
}
```

**Criteria with examples** (f43ae6a). The reference is only an example of a
no:

```json
{
  "instructions": { "question": "Does `code` break `rule`?", "rule": "<description>" },
  "criteria": {
    "true": { "what": "Part of `code` breaks `rule`" },
    "false": {
      "what": "Every part of `code` that `rule` covers follows it, or `rule` covers no part of `code`",
      "examples": ["<reference>"]
    }
  }
}
```

**Criteria for scope** (fadc732). The second arm's question, with criteria
that only say where the rule applies:

```json
{
  "true": "`code` diverges from the pattern shown in `reference`, in code that `rule` is about",
  "false": "`code` follows the pattern, or has no code that `rule` is about"
}
```

## Results

| arm                    | hard AUC     | all-pairs AUC | caught / wrong at 0.7 | at 0.8           | at 0.9         |
| ---------------------- | ------------ | ------------- | --------------------- | ---------------- | -------------- |
| 0.4                    | 0.860, 0.857 | 0.944         | 27 / 8, 27 / 8        | 24 / 6, 24 / 6   | 10 / 0, 12 / 0 |
| in the question        | 0.853, 0.852 | 0.965         | 39 / 19, 38 / 15      | 27 / 6, 28 / 7   | 8 / 0, 7 / 0   |
| criteria with examples | 0.845, 0.850 | 0.982         | 39 / 28, 39 / 28      | 29 / 10, 30 / 11 | 16 / 0, 17 / 0 |
| criteria for scope     | 0.881        | 0.987         | 37 / 15               | 29 / 7           | 16 / 0         |

Two numbers are two runs; all-pairs AUC is from the first. It counts every
unlabeled pair as a negative, so it rewards pushing pairs the rule has nothing
to do with toward 0. The median such pair scored 0.30 under 0.4, 0.22 in the
question, and 0.12 to 0.13 with criteria.

## What we learned

- **Moving the rule into its question raised every probability.** At 0.7, the
  question arms caught 37 to 39 where 0.4 caught 27, and got 15 to 28 wrong
  where 0.4 got 8. Compared at an equal number wrong, the arm with criteria
  for scope caught the most.
- **"Does `code` break `rule`" was the worst question.** With the reference
  only as an example of a no, Jev judged the description, and read broad ones
  literally: it flagged the CLI rule on files with no command in them, and
  flagged a planted file that follows the layer rule at 0.88, for a layer used
  once. It pushed unrelated pairs down furthest, but those never reach a
  threshold anyway.
- **Criteria that only mark the rule's scope helped.** On 0.4's sentence, they
  ranked best on the hard pairs and on all of them.

## Decided

Each rule rides in its own question, asked in 0.4's words, with criteria that
mark its scope (fadc732). Scored on the preset as 0.6.1 reworded it, that
question at 0.8 caught 32 and got 5 wrong, where 0.4's at its default of 0.7
caught 29 and got 10 wrong, so the default threshold went to 0.8 (4a7b725).
