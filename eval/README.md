# adhere's eval

The eval measures how well adhere's request to Jev tells code that breaks a
rule from code that follows it, so that a change to the request, a preset, or
the rule format is judged by numbers rather than by feel. Each change to how
adhere asks Jev since 0.6 was decided here; `studies/` has the write-ups.

## What it runs

- **Rules:** the Effect preset, `presets/effect/`.
- **Planted files:** `cases/` has one Markdown file per preset rule. Each fence
  tagged `ts breaks` is a file written to break that rule, and each tagged
  `ts follows` is one written to follow it, including cases the rule itself
  exempts. 21 break a rule and 25 follow one.
- **Real code:** every `.ts` file of adhere's own `src/`.
- **Arms:** each arm is a way of building adhere's request. Every arm asks
  every rule of every file, one request per file, as a cold `adhere lint`
  would.

`harness.ts` runs the arms and prints the report. `judge.ts` is the standing
comparison: 0.4's request, which put every rule in the shared state, adhere's
questions without their criteria, and adhere's questions as it sends them. A
study in `studies/` is a script that hands the harness its own arms.

## Reading the report

Most pairs of a rule and a file are easy: the rule does not apply, and every
arm answers near 0. The report is about the rest.

- **Planted AUC** and **rules separated** use only each planted file's own
  rule: how often a violation outscores a compliant file, and for how many
  rules every violation outscores every compliant file. Every arm tried so far
  scores near 1 here, so these no longer tell arms apart.
- **Labeled pairs** are what does. `labels.json` holds pairs of a rule and a
  file, other than a planted file and its own rule, that some arm flagged above
  0.7, each judged by hand with a note saying why:
  - `real`: the file breaks the rule;
  - `false`: it does not, or the rule does not apply;
  - `debatable`: reasonable reviewers would disagree. These count toward
    neither side.
- **Caught** is planted violations plus pairs labeled real that score above a
  threshold. **Wrong** is planted compliant files plus pairs labeled false
  that do. adhere's default threshold is 0.8.
- **Hard AUC** is how often a caught-kind pair outscores a wrong-kind pair,
  over all of them: the ranking where it matters.

Comparing two arms at one threshold favors the one whose probabilities run
lower or higher to suit that threshold. Compare caught at an equal number
wrong, or hard AUC.

**Noise.** Jev is steady but not deterministic. Between two identical runs the
median probability moved 0.01, the 95th percentile 0.05, and 18 of 6,006
answers crossed 0.7. Hard AUC moved by about 0.005, and caught and wrong by 1
or 2. Smaller differences than that are noise.

**Labels on `src/`** were judged against adhere's source as it stood; when a
file changes, its labels may go stale. The report ends with every pair above
0.7 that has no label: judge it, add it to `labels.json`, and rescore.

## Running it

Needs a TypeSafe AI API key, as `adhere lint` does: the one `adhere login`
saved, or `TYPESAFE_API_KEY`.

```sh
bun eval/judge.ts results.json                   # the standing comparison
bun eval/studies/<name>.ts results.json          # a study
bun eval/judge.ts --rescore results.json         # report a saved run again, with the current labels
```

The path is optional; with it, every probability and each request's token
usage is written there. Each arm is 69 requests: a few cents. `--rescore` sends nothing, so labeling new
pairs and re-reporting is free.

To add a study, write `studies/<name>.ts` that calls `runStudy` from
`harness.ts` with its arms, and `studies/<name>.md` with the question, the
arms' exact wording, the results, and what was decided.

## Other repos

`repos/` shows what `adhere lint` reports when run on other codebases, one
directory per repo and one file per rule.

- [alchemy](repos/alchemy/README.md): 3,083 findings from 45 rules of adhere
  0.9.5's `effect` and `alchemy` presets, on alchemy-run/alchemy at `8a284d0`.

## Studies

All on jev-1.13.0. The Effect preset's are scored against `labels.json` as
committed; the one on alchemy against the verdicts it lists, checked against
AWS.

| Study                                                         | Question                                                                                                    | Finding                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Where the rule goes](studies/question-shape.md)              | Rules in the shared state, or each in its own question; with criteria or without                            | Each in its own question, with criteria that only mark the rule's scope. Probabilities ran higher, so the default threshold went from 0.7 to 0.8.                     |
| [Words for a rule's examples](studies/rule-vocabulary.md)     | `reference` and `avoid`, or `must` and `never`, or `should` and `should not`; with a bad example or without | A bad example helped every wording. The must/never sentence read examples too literally.                                                                              |
| [Must and never in the description](studies/must-never.md)    | With the preset's descriptions saying must and never too, which sentence should Jev read?                   | Rewording the descriptions, with a bad example per rule, was the largest gain of any study. 0.6's sentence still beats the must/never one.                            |
| [How many examples](studies/example-count.md)                 | One example of each kind, or three; or only one kind                                                        | One of each. Both kinds matter; more of one kind alone made it worse.                                                                                                 |
| [Tokens and context](studies/tokens.md)                       | How Jev counts tokens, and what it does past its context                                                    | 3.2 bytes a token for numbered TypeScript. A request past the context is a 400.                                                                                       |
| [Comments](studies/comments.md)                               | With the file's comments taken out, or kept                                                                 | On the Effect preset, no change: the same ranking, and more flags on other rules' questions.                                                                          |
| [Idempotent deletes on alchemy](studies/idempotent-delete.md) | alchemy's idempotent-delete rule scoped to a provider's delete handler, and without the file's comments     | Scoping dropped every finding outside providers. Without comments, Jev flagged all 9 real deletes, 8 hidden by wrong comments, at about the same share of flags real. |
