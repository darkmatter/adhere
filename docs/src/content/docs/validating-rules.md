---
title: "Validating rules"
---

`adhere validate` checks your rules three ways:

```sh
adhere validate                  # your rules
adhere validate --preset effect  # your rules beside a preset's
```

- **Wording.** It lists each rule whose wording differs from what the
  [rule writing tips](/adhere/writing-good-rules/#rule-writing-tips) recommend, with its file and what
  differs.
- **The linter check.** While `lint` judges a file against one of your rules,
  it also asks Jev whether a linter or type checker could decide the rule
  exactly. It stops after 10 files per rule, and `validate` reports a rule once
  it has all 10 answers. A rule flagged on 7 or more of them probably belongs in
  a regular linter. One flagged on 3 to 6 reads differently from file to file:
  make its description say more precisely what it applies to. Preset rules are
  left out.
- **Contradictions.** It asks Jev about each pair of rules that apply to the
  same files. When there is such a pair, it needs the API key, as `lint` does.

Wording and the linter check are advice and never fail `validate`. A
contradiction fails it with exit code 1, so `validate` can gate a pull request
that adds a rule. The workflow that
[`adhere init --shared`](/adhere/install-rules/#creating-a-shared-repo) writes does this.

Two rules contradict when no code can follow both, such as one that says errors
must be thrown and one that says they must be returned. Each rule reads fine on
its own, so a contradiction shows up only as code that breaks one rule or the
other, whatever you do. `validate` finds it before `lint` does:

```text
Found 1 contradiction among configured rules:

1. No code can follow both (0.91):
   - errors/throw-tagged-errors (/repo/.adhere/rules/errors/throw-tagged-errors/RULE.md)
     A function that fails must throw a tagged error, never return an error value.
   - errors/return-results (/repo/packages/api/.adhere/rules/errors/return-results/RULE.md)
     A function that fails must return a Result, never throw.

Resolve by editing one rule, narrowing a nested rule's scope, or using the same rule id when the nested rule is meant to shadow the root rule.
```

Two rules with the same id are never compared: a nested rule that shares an id
shadows the other on purpose.
