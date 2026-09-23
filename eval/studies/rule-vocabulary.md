# Words for a rule's examples

**Question.** 0.6 called a rule's examples `reference` and `avoid`, and asked
whether a file "diverges from the pattern shown in `reference`", which
"follows" it otherwise. Would RFC 2119's words, which specifications use for
requirements, do better: examples labeled `must` and `never`, and a sentence
saying code must be written one way and never the other? Or, for a
guideline, `should` and `should not`? And does a bad example help at all?

**Setup.** jev-1.13.0, 2026-09-23. The Effect preset as 0.6.1 worded it:
descriptions saying "should", one reference per rule, and no code to avoid. For
the arms with a bad example, the study wrote one per rule, in names of its own
so none repeats a planted file; those became the preset's `never` blocks
later, two of them revised.

## Arms

**Current**, 0.6.1's question:

```json
{
  "instructions": {
    "question": "Does `code` diverge from the pattern shown in `reference`, as described by `rule`? Answer no if the pattern does not apply to this file.",
    "rule": "<description>",
    "reference": "<code>"
  },
  "criteria": {
    "true": "`code` diverges from the pattern shown in `reference`, in code that `rule` is about",
    "false": "`code` follows the pattern, or has no code that `rule` is about"
  }
}
```

With a bad example, `avoid` joins the fields, and the question and the yes
criterion add ", for example by doing what `avoid` shows".

**Must**, with the modal verb in the sentence and in the field names:

```json
{
  "instructions": {
    "question": "Where `rule` applies, code must be written the way `must` shows, and never written the way `never` shows. Does `code` break this? Answer no if `rule` does not apply to this file.",
    "rule": "<description>",
    "must": "<code>",
    "never": "<code>"
  },
  "criteria": {
    "true": "Code in `code` that `rule` applies to is not written the way `must` shows, or is written the way `never` shows",
    "false": "Code in `code` that `rule` applies to is written the way `must` shows and not the way `never` shows, or `rule` applies to none of `code`"
  }
}
```

Without a bad example, the `never` field and its clauses are left out.

**Should** is the same with `should` and `should_not`: "code should be written
the way `should` shows, and should not be written the way `should_not` shows."

## Results

| arm                         | hard AUC | caught / wrong at 0.7 | at 0.8 | at 0.9 |
| --------------------------- | -------- | --------------------- | ------ | ------ |
| current                     | 0.911    | 43 / 15               | 32 / 6 | 17 / 0 |
| current, with a bad example | 0.937    | 38 / 7                | 32 / 6 | 24 / 0 |
| must                        | 0.849    | 31 / 16               | 25 / 4 | 7 / 0  |
| must, with never            | 0.915    | 35 / 9                | 29 / 3 | 14 / 0 |
| should                      | 0.874    | 30 / 8                | 23 / 4 | 9 / 0  |
| should, with should not     | 0.920    | 33 / 7                | 30 / 4 | 12 / 0 |

## What we learned

- **A bad example helped every wording**, by 0.026 to 0.066 hard AUC. With the
  current wording it halved the wrong answers at 0.7, and at 0.9 caught 24
  with none wrong, where it had caught 17.
- **The must sentence read examples too literally.** "Written the way `must`
  shows" asks whether the code matches the example, where "diverges from the
  pattern" asks whether it follows what the example stands for. Without a bad
  example it was the worst arm, and it flagged a FileSystem read at 0.83,
  though the rule puts FileSystem out of its scope.
- **Should and must came out nearly the same.** A guideline written with
  should is a signal to the people reading the rule, not a weaker check.
- The must arms look cleaner at 0.8 only because their probabilities run
  lower; at an equal number wrong they caught fewer.

## Decided

Nothing shipped from this study alone. It led to the next one: the preset's
descriptions still said "should" while the must arms said "must", and the
bad examples were worth keeping. See [must and never](must-never.md).
