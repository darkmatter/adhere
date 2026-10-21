---
title: "Live evals"
---

Try a change to a rule on your own code before you rely on it: run the current
rule and the changed one side by side, and compare what each flags.

1. Copy the rule's directory under a new id:

   ```sh
   cp -r .adhere/rules/data/brand-ports .adhere/rules/data/brand-ports-next
   ```

2. Give the copy `level: warning` in its front matter. Its findings show in
   amber and never fail the run, so the experiment can sit in the repo, and in
   CI, while you watch it.
3. Change the copy: its description, its examples, its `appliesTo` or
   `excludeIf`. To try giving Jev more to read, make the copy a `RULE.ts` with
   an [`appendState`](/adhere/state-hooks/#state-hooks) hook.
4. Run `adhere lint`, or `adhere lint --filter '<glob>'` to try it on part of
   the repo first, and compare the two rules' findings on the same files.

Judge the two by recall, the share of real violations each catches, and
precision, the share of its flags that are real. Check the findings by hand, or
with the [`adhere-fix`](https://github.com/darkmatter/adhere/blob/main/skills/adhere-fix/SKILL.md) skill, which verifies each
one against its rule and the code. Then keep the better version under the
original id, and delete the other.

- **The copy costs nothing until you change it.** Judgments are cached by the
  rule's text, not by its id, its level, or its threshold, so a copy that reads
  the same as the original answers from the original's cache. Each change after
  that judges the copy, and only the copy, once per file.
- **Keeping the winner is free.** Moving the winning text to the original id
  reuses its cached judgments.
- **Counting each rule's findings** takes a pipe:
  `adhere lint --yes | grep -c 'data/brand-ports-next:'`.
