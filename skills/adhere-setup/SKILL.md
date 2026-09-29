---
name: adhere-setup
description: Set adhere up in a repository with the user. Scan the repo for conventions a normal linter cannot check and draft them as rules, add fitting presets and rules from a shared org repo, let the user preview and choose which to import, validate them, walk through the first lint, and add adhere to CI. Use when a repo has no adhere rules yet, or the user asks to set up, adopt, or onboard adhere.
---

# Set up adhere in a repo

You and the user go from no rules to adhere passing in CI. The user decides
what gets imported, what it may cost, and what reaches GitHub; you do the
reading, drafting, and running. The adhere skill, which `adhere skill`
prints, is the reference for the rule format, the config, and tuning: read it
before step 3.

At each point marked **Ask**, stop and wait for the answer. Use a structured
question tool if you have one; otherwise ask in plain text with numbered
choices.

## 1. Check the tools

```sh
adhere --version
```

Without it, install it: `npm install -D @drkmttr/adhere` in a repo with a
`package.json`, which `adhere init` also does, or run it as
`npx @drkmttr/adhere`. Validate and lint need a TypeSafe AI API key:
`TYPESAFE_API_KEY`, or one saved by `adhere login`, which the user runs; never
ask for the key in chat or print it.

## 2. Find candidates

Gather candidates from three sources. Keep a note, for each, of where it came
from and the evidence.

**The repo.** Read, noting every "we always" and "never":

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, convention sections of the
  README, `docs/`, ADRs.
- Lint and type configuration, to learn what is already enforced exactly.
- Review feedback, when `gh` works: `gh pr list --state merged --limit 20`,
  then `gh pr view <n> --comments` on a few. Repeated review comments are
  unwritten rules.
- The code: the module others copy, the canonical service, error type, and
  test.

Keep only conventions that need judgment: about intent, shape, or placement.
Drop any a regex, an import check, or the type checker could flag every time,
and note where it belongs instead. Drop any a preset below already covers.

**Presets.** Match the stack: `typescript` for TypeScript, `react` for React,
`security` for code that handles secrets, SQL, shell commands, or paths,
`effect` for Effect, `alchemy` for alchemy stacks. Read their rules under
`presets/` in the installed package or at
https://github.com/darkmatter/adhere/tree/main/presets, to describe them and
to avoid drafting duplicates.

**A shared repo.** **Ask** whether the organization keeps adhere rules in a
repo. If it does, `adhere list org/repo` prints its rules with their
descriptions.

## 3. Draft the repo's rules

Write each repo candidate as a rule file, worded as the adhere skill says: one
sentence with "must" and "never" (or "should" and "should not"), one `must`
block of real code from the repo, and one `never` block, ideally a violation
from the repo or its history.

Write the drafts outside the repo, in a scratch directory such as
`$(mktemp -d)/<topic>/<slug>.md`, so nothing lands in `.adhere/` before the
user picks it.

## 4. Preview and choose

Show one numbered list of every candidate, grouped by source:

```text
From this repo
  1. errors/tagged-errors      Domain errors must be Schema.TaggedError classes, never thrown Error.
                               Evidence: AGENTS.md "Errors"; src/billing/errors.ts
  2. services/config-service   Business logic must read config through ConfigService, never Config.* directly.
                               Evidence: review comments on #412, #398
Presets
  3. typescript                11 rules: runtime checks at boundaries, no swallowed errors, ...
  4. security                  4 rules: no secrets in output, parameterized SQL, ...
From acme/standards
  5. data/brand-ports          A port must be a branded, range-checked integer, never a bare number.
Dropped as a linter's job
  - "no default exports": eslint import/no-default-export
```

For a preset, offer the whole preset or its topics. Show a draft's full text
when the user asks for it.

**Ask** which to import: all, some by number, or none, and whether to change
the wording of any. Revise drafts the user wants changed and show them again.

## 5. Import the chosen rules

- Without a config, run `adhere init`. It also writes two example rules under
  `.adhere/style/`; delete them unless the user chose them.
- Copy each chosen draft to `.adhere/<topic>/<slug>.md`.
- Add chosen presets, or topics, to `presets` in `.adhere/config.ts`.
- Install chosen shared rules: `adhere install org/repo/<id>` for each, or
  `adhere install org/repo` for all of them. They land in `.adhere/org/repo/`.
- Add `exclude` globs for generated or vendored code the default skips miss.

## 6. Validate

```sh
adhere validate
```

It reports rules worded against the tips, rules a linter could check, and
contradictions between rules that apply to the same files. Fix the wording
yourself. For a linter-checkable rule or a contradiction, **Ask** the user
which to keep, and apply it. Run it again until it reports no contradictions.

## 7. The first lint

```sh
adhere lint --limit 0
```

This shows the plan and judges nothing: files, rules, requests, and the
estimated cost. Tell the user those numbers. On a large repo, offer to start
with a subtree, such as `--filter 'src/**'`, or a `--limit`. **Ask** before
sending, then run it:

```sh
adhere lint --yes
```

Walk the user through the report:

1. How to read a finding: the rule id, Jev's probability, the description,
   the underlined line, and the warning when the file may not show enough.
2. Findings grouped by rule, the highest probabilities first. Check a few from
   each rule against the code, and say which look real and which do not.
3. For each noisy rule, propose one change from the adhere skill's "Tuning a
   rule": narrow the wording, scope it, raise its threshold, make it a
   warning, or turn it off. **Ask**, apply what the user accepts, and run
   lint again. Only the edited rules are judged again.

CI fails on any error finding, so lint must exit 0 before step 8. **Ask** how
to get there: fix the real findings now with the adhere-fix skill
(`adhere skill fix`), make a rule a warning until its findings are fixed,
or suppress false findings with `adhere-ignore` comments that give the reason.

Commit `.adhere/` with the cache, so the team and CI reuse these judgments.
Offer to add `.adhere/cache/** linguist-generated -diff` to `.gitattributes`.

## 8. Add adhere to CI

**Ask** before writing a workflow and before touching the repo's secrets.

For GitHub Actions, add `.github/workflows/adhere.yaml`:

```yaml
name: adhere

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx --yes @drkmttr/adhere lint --yes
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
```

When `package.json` lists `@drkmttr/adhere`, install with the repo's package
manager and run its `adhere` instead of `npx`, so CI uses the pinned version.
Add `--deny-warnings` if the user wants warnings to fail the job too. Match the
branch to the repo's default branch. For another CI system, write the same
job: check out, run `adhere lint --yes` with the key from a secret.

The user adds the key as a secret: `gh secret set TYPESAFE_API_KEY`, which
prompts for it, or in the repo's settings. Pull requests from forks get no
secrets, so lint fails there on any file not in the cache.

Where lint gates merges, anyone who can commit can also commit a cache file
saying their code passes. To lint a pull request against the cache as merged,
fetch the base branch and restore its cache before linting:

```yaml
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - if: github.event_name == 'pull_request'
        run: rm -rf .adhere/cache && git checkout origin/${{ github.base_ref }} -- .adhere/cache
```

This needs the cache committed on the base branch first.

## 9. Report

Tell the user:

- the rules imported, by source, and where they are;
- the presets and shared repo named in the config or installed;
- the candidates dropped as a linter's job, with where each belongs;
- the last lint's findings, and what was fixed, made a warning, or suppressed;
- the CI workflow and whether the secret is set;
- what is left for them: pushing, setting the secret, fixing remaining findings.
