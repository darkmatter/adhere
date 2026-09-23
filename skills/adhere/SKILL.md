---
name: adhere
description: Gather a repository's non-deterministic coding conventions into adhere rules (Markdown files with a description and reference code judged by Jev), configure adhere, run it, and calibrate thresholds. Use when setting up adhere in a repo, when the user asks to turn conventions, AGENTS.md guidance, ADRs, or review feedback into lint rules a normal linter cannot express, or when tuning adhere findings.
---

# Gather adhere rules from a repo

adhere is a linter for rules a normal linter cannot check. Each rule is one
sentence plus a block of correct code; Jev judges every source file against it
and returns a probability. Your job is to find the conventions a repo already
has, write the ones that need judgment as rule files, and tune until the
report is trustworthy.

## 1. Survey where conventions live

Read, in this order, and note every "we always" or "never" statement:

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` convention sections.
- `docs/`, ADRs, design notes, `CONTEXT.md`.
- Lint and type configuration (`oxlint`, `eslint`, `biome`, `tsconfig`). These
  tell you what is already enforced deterministically, so you can exclude it.
- Recent review feedback: `gh pr list --state merged --limit 20`, then
  `gh pr view <n> --comments` on a few. Repeated review comments are unwritten
  rules.
- The code. Find the module others copy from: the canonical service, the
  canonical error type, the canonical test. Those files are your references.

## 2. Keep only what needs judgment

For each candidate ask: could a regex, an import check, or the type checker
flag every violation? If yes, it belongs in the existing linter, not adhere.
Drop it or file it as a lint request.

Keep rules about intent, shape, and placement:

- "Sequential effectful steps use `Effect.gen`, not nested `flatMap`."
- "A call over the network carries a timeout and a retry schedule."
- "Business logic depends on a config service, not on `Config.*` reads."
- "Domain errors are `Schema.TaggedError` classes, not thrown `Error`."

Skip rules a preset already covers. Run `adhere --help` and read
`presets/effect/` in the adhere repo before writing Effect rules; extend with
`presets: ["effect"]` and add only what is specific to this repo.

## 3. Write each rule as a file

Default location `.adhere/<topic>/<slug>.md`. If the repo already has `docs/`,
use `docs/adhere/<topic>/<slug>.md` and set `rules: "./docs/adhere"` in the
config. The path without `.md` is the rule id.

````md
---
description: One sentence stating the pattern positively. Name what is done, then what it replaces.
threshold: 0.8
---

Optional prose for readers on GitHub. adhere ignores it.

```ts
// Correct code lifted from this repo, trimmed to the pattern.
```
````

Rules for the rule:

- `description` is one sentence, positive, specific. Jev reads it with the
  reference; vague words ("properly", "correctly") give it nothing to judge.
- The reference is real code from the repo, not invented. Never include
  incorrect code; Jev compares files to the reference, so a "bad" example
  teaches the wrong thing.
- One pattern per file. Two patterns in one reference blur the probability.
- `threshold` is optional. Start without it; set it in step 5 if needed.

## 4. Configure

Pick one config location: `adhere.config.ts`, `.adhere/config.ts`, or
`.adhere.config.ts`. A config is optional when `.adhere/` exists or a preset is
passed on the command line. Use a type-only import so the file also loads
under the native binary:

```ts
import type { Config } from "@drkmttr/adhere";

export default {
  presets: ["effect"],
  threshold: 0.75,
} satisfies Config;
```

Add `.adhere/cache/` to `.gitignore`. `TYPESAFE_API_KEY` must be set for
uncached files; in this org it comes from SOPS via `just shell`.

## 5. Run and calibrate

```sh
adhere                     # or: adhere --preset effect
adhere --threshold 0.9     # re-reads the cache, sends nothing
```

Then, per rule, read the findings and decide:

- Many hits at 0.70 to 0.80, mostly not violations: the description is too
  broad. Narrow it (say what is out of scope) or raise that rule's
  `threshold`. Prefer narrowing; a threshold hides, a sentence explains.
- Hits on code that follows the pattern through a different API: the
  reference is too specific. Use the repo's most general correct example.
- Zero hits: plant a deliberate violation in a scratch file, run, confirm the
  rule fires, remove the file. A rule that cannot fire is not a rule.
- Hits at 0.9 and above: read them first. They are usually real.

Threshold changes never re-judge; only edited rules do (per rule) and edited
files do (per file). Iterate on wording freely, it costs one request per file
per changed rule.

## 6. Report

Give the user: the rule ids written and where, the config path, the finding
count at the chosen threshold and at 0.9, and the rules you dropped as
deterministic with where they belong instead.
