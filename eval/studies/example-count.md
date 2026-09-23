# How many examples

**Question.** Each Effect preset rule shows one example of code that must be
written and one of code that must never be. Would three of each help? Three of
one kind alone? And how much does each kind do by itself?

**Setup.** jev-1.13.0, 2026-09-23, on the preset as reworded in
[must and never](must-never.md). `more-examples.md` adds two examples of each
kind per rule, each a different case of the rule in names of its own, so none
repeats a planted file. Every arm asks adhere's question with its wording
unchanged; one example is sent as a string, as adhere sends it, and three as a
list. An arm without `must` examples asks the question adhere asks of a rule
with only code to avoid ("Does `code` contain the pattern shown in `never`,
which `rule` rules out?").

```sh
bun eval/studies/example-count.ts results.json
```

## Results

| examples per rule         | hard AUC | caught / wrong at 0.7 | at 0.8 | at 0.9 | tokens, against 1 and 1 |
| ------------------------- | -------- | --------------------- | ------ | ------ | ----------------------- |
| 1 must, 1 never (shipped) | 0.950    | 38 / 7                | 32 / 1 | 22 / 1 | 1.00                    |
| 1 must                    | 0.931    | 41 / 9                | 32 / 2 | 20 / 1 | 0.80                    |
| 3 must                    | 0.913    | 42 / 12               | 35 / 5 | 22 / 1 | 1.11                    |
| 1 never                   | 0.904    | 29 / 0                | 23 / 0 | 12 / 0 | 0.64                    |
| 3 never                   | 0.910    | 33 / 6                | 24 / 2 | 15 / 1 | 0.90                    |
| 3 must, 3 never           | 0.948    | 41 / 4                | 33 / 2 | 23 / 1 | 1.58                    |

## What we learned

- **Both kinds matter more than how many.** One of each ranked best; either
  kind alone, even three of it, ranked 0.02 to 0.05 lower. The pair shows Jev
  where the line runs between the code the rule wants and the code it rules
  out.
- **More examples of code to write alone made things worse.** Three instead
  of one caught 3 more at 0.8 but got 5 wrong instead of 2: more examples
  widened what Jev took the pattern to be.
- **Code to avoid alone is cautious.** One never example got nothing wrong,
  but caught 23 at 0.8 where one of each caught 32: without an example of
  code to write, Jev flags only what resembles the bad example.
- **Three of each ties one of each** at 0.8 and 0.9 and does a little better
  at 0.7, for 1.58 times the tokens.
- **A file that contains the question confuses Jev.** adhere's own
  `src/services/Jev.ts` builds the question, so it contains its sentences. The
  arms that ask the never-only question flagged it for rules it has nothing to
  do with, such as the CLI rule at 0.92 and two testing rules, because the
  file states the question they were asking.

## Decided

Keep one example of each kind; add a `never` example where a rule has none.
adhere reads the first fence of each kind, and the rule format stays as it is.
