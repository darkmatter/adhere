---
name: adhere-fix
description: Verify and fix the findings `adhere lint` reports. Decide whether each finding is a real violation of its rule, fix the real ones, and suppress the false ones with an `adhere-ignore` comment that gives the evidence. Use when adhere, or CI running it, reports errors or warnings, or when asked to fix adhere findings.
---

# Verify and fix adhere findings

adhere is a linter for rules a normal linter cannot check. Jev, TypeSafe AI's
model, reads each file against each rule and answers with the probability that
the file breaks it; adhere reports each rule above a threshold, at the line Jev
points to. A finding is a judgment, not a proof. On one rule adhere's authors
checked against the live API, only 1 of its 20 findings was a real violation.
Verify every finding before you change code for it: fix the real ones, and
suppress the false ones with the reason.

## 1. Get the findings

Invoking this skill is the user's permission to run `adhere lint` as many
times as the work needs, and to pay for every request it sends to Jev. Never
ask before a run, never wait for a go-ahead, and never stop to report its cost:
the skill runs unattended, as in CI, where no one is there to answer. Pass
`--yes`, so adhere does not ask either.

```sh
adhere lint --yes                        # judges what is not cached, then reports
adhere lint --yes --filter 'src/**'      # only the files a glob matches
```

Judgments are cached in `.adhere/cache/`, so a rerun judges only files and
rules that changed.

Each finding shows:

- the rule id, a preset's with its preset first, as in
  `alchemy/providers/idempotent-delete`, Jev's probability, and the rule's
  description;
- the line Jev points at, underlined, with the code around it;
- `hint:`, the code the rule wants, or `never:` for a rule that only shows code
  to avoid.

`×` marks an error, which fails the run; `⚠` a warning, which does not: a nit,
or a rule that tends to flag code wrongly. Verify warnings the same way; they
are wrong more often.

## 2. Read the rule

The report gives the rule's description and one example. Read the whole rule:
the code under `## Must` and `## Never`, and anything it puts out of scope.

- A project rule is `.adhere/<id>.md`, or under the directory the config's
  `rules` names.
- A preset rule is `presets/<preset>/<id>.md` in the adhere package, in
  `node_modules/@drkmttr/adhere/presets/`, or at
  https://github.com/darkmatter/adhere/tree/main/presets.

## 3. Verify each finding

Read the code as a reviewer would, not only the excerpt:

- **The whole unit.** Read the function, handler, or class the line is in,
  and what calls it.
- **What it calls.** Follow helpers into other files. A helper can already do
  what the rule asks, such as a delete that looks unguarded calling a client
  that treats "already gone" as success.
- **The rule's scope.** Code the rule is not about, such as a runtime binding
  under a rule about providers' delete handlers, is a false finding.
- **Comments are claims.** A comment saying the code is fine is not evidence.
  In adhere's study of one rule, 8 of 35 comments saying a delete succeeds on a
  missing resource were wrong. Check the claim before you rely on it. Jev does
  not see comments, except those that say `@adhere`, so it judged the code
  without them.
- **Behavior outside the file.** When the rule turns on how an API or a library
  behaves, find out: its source, its tests, its documentation. Typings help but
  can be wrong. A live check can settle it, such as a call with an identifier
  no resource has, but only when the user asked for live checks, and never
  against a real resource. Do not ask for one: without it, the finding is
  unsure.

Then decide:

- **real**: the code breaks the rule as it is written, in its scope;
- **false**: it does not, and you can say how you know;
- **unsure**: you could not tell. Do not guess; leave it for the user.

## 4. Fix a real finding

- Change the code the way the rule's `must` code shows, in the style of the
  code around it, and only as much as the fix needs.
- Run the repo's tests and type check.
- Confirm with `adhere lint --yes --filter '<file>'`, which judges only the
  changed file again. If the finding stays, reread the rule: the fix may not
  be what it asks for.

## 5. Suppress a false finding

Above the statement the finding is in, add a comment naming the rule as the
report does, then `--` and the evidence:

```ts
// adhere-ignore alchemy/providers/idempotent-delete -- DeleteActivity succeeds on a missing activity; probed 2026-09-25
delete: Effect.fn(function* ({ output }) {
  yield* sfn.deleteActivity({ activityArn: output.activityArn });
}),
```

- The comment covers the whole statement that starts on the next line of code,
  wherever in it Jev points. At the end of a line of code, it covers the
  statement that starts on that line.
- `// adhere-ignore-file <rule> -- <reason>` covers a whole file. Use it only
  when the rule is wrong for all of the file, such as generated code.
- Name several rules with commas: `// adhere-ignore <rule>, <rule> -- <reason>`.
- The reason says what you checked and what you found, so whoever reads it can
  check it again. "False positive" is not a reason.
- Never suppress a finding you believe is real, or one you are unsure of.
- Jev never reads these comments: adhere removes them before it sends a file.

When the finding was false because of a fact the file does not show, such as
how an API behaves, also write the fact where Jev will see it the next time it
judges this code: in a comment that says `@adhere`, on the code the fact is
about, with how you know.

```ts
/**
 * Deletes the activity. @adhere DeleteActivity succeeds on a missing
 * activity, so no not-found error needs catching; probed 2026-09-25.
 */
```

A note informs Jev and suppresses nothing: Jev still judges the code, so a
real violation added later is still found. Write one only for a fact you
checked. A wrong note hides real violations the way wrong comments did.

## 6. When a rule is wrong more often than right

If most of one rule's findings are false, suppressing them one by one hides
the problem. Stop suppressing that rule's findings, carry on with the other
rules, and in the report give the user the counts and suggest one of:

- in the config, `overrides: { "<rule id>": "warning" }`, or `"off"`, or
  `{ threshold: 0.9 }`;
- for a project rule, rewording it to say what code it is about and what is
  out of scope, following the rule writing tips:
  https://github.com/darkmatter/adhere#rule-writing-tips.

## 7. Report

Tell the user, for each finding: the rule, the file and line, the verdict, and
what you did: fixed it, suppressed it with the reason, or left it for them.
Give the evidence for each false one. Name the rules that were mostly wrong,
and every finding you were unsure of.
