---
title: "Writing good rules"
---

The [eval](https://github.com/darkmatter/adhere/blob/main/eval/README.md#studies) measured how Jev reads a rule, on the
presets and on other repos, to catch the most violations with the fewest false
positives. It has every study. These are its lessons for writing a rule.

## Rule writing tips

- **Say "must" and "never"**, in the description and in the headings over the
  code, or "should" and "should not" for a guideline. Rewording the presets'
  descriptions this way, with a bad example per rule, was the largest gain of
  any study: at 0.8 it caught as many violations as before, with 1 wrong
  finding where there had been 5 or 6 ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/must-never.md)).
- **Give one example of each kind**: one `must` block and one `never` block. A
  bad example helped every wording, and at 0.9 caught 24 violations with none
  wrong, where there had been 17
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/rule-vocabulary.md)). Either kind alone did worse, and
  three of each did no better, for 1.58 times the tokens
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/example-count.md)).

`adhere validate` lists each rule worded otherwise.

## What else the studies found

- **"Should" is for people, not a weaker check.** Rules written with "should"
  and with "must" scored nearly the same
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/rule-vocabulary.md)).
- **A wrong finding is usually the rule's fault.** Above 0.8, 31 of 35 wrong
  findings repeated within a rule: a scope its words reach past, or the same
  misreading again. Fixing the wording fixes them together. Below 0.8, one-off
  misreads grow, to about one finding in six at 0.6 to 0.7
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/presets.md)).
- **Narrow a rule in its description.** Jev scores an `excludeIf` near 0.5 for
  real and false findings alike, so it thins a rule's findings about as much as
  a higher threshold ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/presets.md)). Narrowing the
  description moves the judgment itself: scoping alchemy's idempotent-delete
  rule to providers' delete handlers dropped its findings elsewhere from
  0.67–0.88 to 0.08–0.21, with nothing real lost
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/idempotent-delete.md)).
- **Beware rules that turn on what the file does not show.** The weakest preset
  rules hinged on facts outside the file: whether a client has a default
  timeout, whether a script is an entry point, whether a key is public
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/presets.md)). Warning below a context of 0.7 marked one
  finding in five, and those were real about half the time, where the rest were
  real three times in four ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/sufficiency.md)). Make such a
  rule a warning, or give Jev the fact with
  [`typeAware` or workspace `reads`](/adhere/state-hooks/#what-jev-reads), an
  [`appendState`](/adhere/state-hooks/#state-hooks) hook, or an `@adhere` note.
- **Jev believes comments.** Eight of nine real violations of the
  idempotent-delete rule carried a comment wrongly saying they were fine, and
  scored 0.31 to 0.62, while without comments all nine scored 0.81 or more
  ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/idempotent-delete.md)). That is why adhere takes
  comments out. A fact Jev needs, such as an exemption, goes in an `@adhere`
  note, which stays ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/comments.md)).
