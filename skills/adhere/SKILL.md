---
name: adhere
description: Reference for adhere, the linter for coding conventions a normal linter cannot check, judged by TypeSafe AI's Jev. Covers its commands, the Markdown rule format and how to word a rule, the config, presets, shared rules, comments and suppressions, the cache, reading a report, and tuning a noisy rule. Use when writing or editing adhere rules, configuring adhere, reading its findings, or answering questions about it. To set adhere up in a repo, use adhere-setup; to fix findings, adhere-fix.
---

# adhere

adhere is a linter for rules a normal linter cannot check. Each rule is one
sentence in RFC 2119's words plus code that must be written and code that must
never be. Jev, TypeSafe AI's model, reads every source file against every rule
and answers with the probability that the file breaks it; adhere reports a
rule above its threshold, 0.8 by default, in the section of the file Jev
points to. A finding is a judgment, not a proof.

Two other skills build on this one: adhere-setup walks a repo through its
first rules, first lint, and CI, and adhere-fix verifies and fixes findings.
`adhere skill setup` and `adhere skill fix` print them.

## Commands

```sh
adhere init [--force]            # .adhere/config.ts, two example rules, and the dev dependency
adhere init --shared org/repo    # a repo of rules other repos install, with CI and an alchemy stack
adhere login                     # save a TypeSafe AI API key; TYPESAFE_API_KEY takes precedence
adhere validate                  # rule wording, rules a linter could check, contradictions
adhere lint                      # judge the working directory; exit 1 on an error finding
adhere lint --limit 0            # show the plan and its cost, judge nothing
adhere lint --yes                # send without asking, as in CI
adhere lint --preset effect      # add a built-in rule set; the config becomes optional
adhere lint --filter 'src/**'    # read only matching files; repeat, and ! to leave out
adhere lint --threshold 0.9      # report at another threshold from the cache; judges nothing again
adhere lint --deny-warnings      # fail on warnings too
adhere list org/repo             # the rules in a GitHub repo's .adhere/
adhere install org/repo[/topic[/rule]][#ref]   # copy them into .adhere/org/repo/
adhere skill [docs|setup|fix]    # print a skill
```

`adhere <command> --help` lists every flag.

## Rule files

A repo's rules live in `.adhere/`, one Markdown file per rule. The path
without `.md` is the rule id: `.adhere/data/brand-ports.md` is
`data/brand-ports`. A `.adhere/` in a subdirectory holds rules for that
subtree only, and the most specific rule with an id wins. `cache/` and the
config in `.adhere/` are not rules.

````md
---
description: A port must be a branded, range-checked integer, never a bare number.
---

Prose here renders on GitHub and is ignored.

## Must

```ts
const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
```

## Never

```ts
const port: number = Number(process.env.PORT);
```
````

How to word a rule, from adhere's evals:

- The description is one specific sentence in the same words as the headings:
  what code must be, then what it must never be. Vague words such as
  "properly" give Jev nothing to judge.
- Give one example of each kind: one `## Must` block and one `## Never` block.
  Three of each did no better, and several of one kind alone did worse. A rule
  with no single correct form can have only a `never` block.
- The `must` block is real, correct code from the repo, trimmed to the
  pattern; Jev compares files to it. Incorrect code goes under `## Never`,
  ideally a violation found in the repo or its history.
- A guideline rather than a requirement says "should" and "should not", in
  the description and as `## Should` and `## Should not`. A rule is one or the
  other.
- One pattern per rule. Two in one block blur the probability.
- A heading names its code only when it is the word alone: `## Never`, not
  `## Never do this`. A fence tagged `ts never` names its code itself.

Front matter besides `description`, all optional:

- `threshold: 0.9` sets the rule's own cutoff.
- `level: warning` reports its findings in amber without failing the run, for
  a nit or a rule that errs toward false findings.
- `tests: only` for a rule about tests, `tests: include` for one that holds in
  tests too. Otherwise rules skip `.test` and `.spec` files and files under
  `test/`, `tests/`, `__tests__/`, and `fixtures/`.
- `appliesTo: ["a declared union type or schema"]` and
  `excludeIf: ["a type that mirrors a third-party format"]`, JSON arrays on
  one line, scope a rule without widening its description: a finding stands
  only when Jev says the code that breaks the rule is as every `appliesTo`
  describes and as no `excludeIf` does.

A rule a regex, an import check, or the type checker could flag every time
belongs in that tool, not adhere. `adhere validate` reports rules that look
like that.

## Config

A config is optional when `.adhere/` holds rules or `--preset` is given. It
sits at `.adhere/config.ts`, `adhere.config.ts`, or `.adhere.config.ts`; keep
one.

```ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  presets: ["typescript", "security"], // built-in rule sets, or topics such as "effect/basics"
  threshold: 0.8, // default 0.8
  sufficiencyThreshold: 0.6, // below it, a finding warns the file may not show enough
  exclude: ["**/generated/**"], // files no rule judges
  includeComments: false, // true only for rules about comments
  overrides: {
    "effect/basics/instrument-with-pipe": "off",
    "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
  },
});
```

`overrides` changes any rule by the id the report shows, a preset's with the
preset first, without copying it; an id no rule has refuses the run. `rules`
in the config, inline or as a directory path, replaces the `.adhere/` rule
files entirely. Precedence, highest first: `--threshold`, the config, presets
in order, the default; a rule's own `threshold` beats those, and `overrides`
beats the rule.

Node packages cannot be imported from the config, except `@drkmttr/adhere`,
which the executable supplies.

## Presets

`typescript` (any TypeScript project), `react`, `security`, `effect`, and
`alchemy` (code deployed with alchemy.run). Each divides into topics, its
subdirectories, and a topic is a preset of its own. Their rules are in the
adhere package under `presets/`, and at
https://github.com/darkmatter/adhere/tree/main/presets. A preset leaves out
what that ecosystem's linters check exactly. Quiet a preset rule with
`overrides` rather than copying it.

## Shared rules

An organization keeps rules in one repo's `.adhere/`, scaffolded by
`adhere init --shared org/repo`, and other repos copy them in with
`adhere install org/repo`, or one topic or rule with
`adhere install org/repo/<topic>[/<rule>]`. Copies land in `.adhere/org/repo/`,
so `data/brand-ports` becomes the rule `org/repo/data/brand-ports`. They are
the repo's own rules from then on; a second install skips existing files
unless `--force`, which overwrites local edits. The source is cloned with git,
so a private repo needs git's credentials for GitHub.

## Comments and suppressions

Jev never sees comments: adhere blanks them before judging, since comments
claiming code is safe hid real violations in the evals. A comment containing
`@adhere` is a note Jev does read: use it for a checked fact the code relies
on that the file cannot show, with how you know.

```ts
// @adhere DeleteActivity succeeds on a missing activity; probed 2026-09-25.
```

A finding Jev got wrong is suppressed in the code, with the reason:

```ts
// adhere-ignore alchemy/providers/idempotent-delete -- DeleteActivity succeeds on a missing activity
```

On its own line it covers the next statement; at the end of a line, the
statement starting there. `adhere-ignore-file <rule> -- <reason>` covers a
file. Name several rules with commas.

## Cache and API key

Judgments are cached in `.adhere/cache/`, keyed by each file's content without
comments and by the rule's text. Commit it: every judgment is a paid request,
and a committed cache gives the team and CI the same findings without paying
again. A changed file re-judges every rule for it; an edited rule re-judges
only that rule; a threshold change re-judges nothing. A run where everything
is cached needs no key or network. Mark it generated to keep it out of diffs:

```text
.adhere/cache/** linguist-generated -diff
```

The key comes from `TYPESAFE_API_KEY` or from `adhere login`. lint prints a
plan with the request count and estimated cost before sending, and asks at a
terminal.

## Reading a report

```text
  × data/brand-ports (0.93): A port must be a branded, range-checked integer, never a bare number.
   ╭─[src/server.ts:6:3]
 6 │   const port: number = Number(process.env.PORT ?? 3000);
   ·   ──────────────────────────────────────────────────────
  hint: const Port = Schema.Int.pipe(...)
```

The header is the rule id, Jev's probability, and the description; `×` is an
error, `⚠` a warning. The underline is the line Jev names. A finding with
`warning: this file may not show enough to check this rule` turns on
something outside the file, and was usually false in the evals: check that
before acting on it.

## Tuning a rule

Per rule, read its findings and decide:

- Many hits at 0.80 to 0.90, mostly not violations: the description is too
  broad. Narrow it, or scope it with `appliesTo` or `excludeIf`, before
  raising its `threshold`: a threshold hides, a sentence explains.
- Hits on code that follows the pattern through another API: the `must`
  block is too specific. Use the repo's most general correct example.
- Right less than half the time and not fixable by wording: `level: warning`,
  or `off`.
- Zero hits: plant a violation in a scratch file, run lint on it with
  `--filter`, confirm the rule fires, and delete the file. A rule that cannot
  fire is not a rule.
- Hits at 0.9 and above are usually real. Read them first.

Editing a rule re-judges only that rule, one request per file, so iterate on
wording freely.
