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

Use the package manager the repo already uses, for every command in this
skill; never bring in another. Tell it by the lockfile beside `package.json`,
as `adhere init` does: `bun.lock` or `bun.lockb` for bun, `pnpm-lock.yaml` for
pnpm, `yarn.lock` for yarn, `package-lock.json` for npm. Without a lockfile,
the `packageManager` field in `package.json` names it; with neither, **Ask**.

| Manager | Add adhere                       | Run adhere         |
| ------- | -------------------------------- | ------------------ |
| bun     | `bun add -D @drkmttr/adhere`     | `bunx adhere`      |
| pnpm    | `pnpm add -D @drkmttr/adhere`    | `pnpm exec adhere` |
| yarn    | `yarn add -D @drkmttr/adhere`    | `yarn adhere`      |
| npm     | `npm install -D @drkmttr/adhere` | `npx adhere`       |

In a repo with a `package.json`, add adhere as a dev dependency with its
manager, so the repo pins the version the team and CI run. From then on,
wherever this skill says `adhere`, run it the manager's way, as in
`pnpm exec adhere lint`.

With pnpm, at a workspace root, add `--ignore-workspace-root-check`.

Default lint enables `workspacePackages`, `symbols`, and `references`, and
starts native TypeScript only during execution, after confirmation, when
pending judgments or cached findings needing location require context. It discovers each
file's configured project, including package projects under solution roots,
and falls back to inferred context for unconfigured or excluded files. No root
`tsconfig.json` or literal root file-list membership is required; do not block
setup on either. `.adhere/tsconfig.json` only types the config and rules.
Planning, `--limit 0`, version, help, skills, and validate do not start the
compiler.

In a repo without a `package.json`, inspect any `adhere` on PATH with
`adhere --version`, then **Ask** whether to use the npm/Bun package launcher
for the full default or a raw executable with deliberately reduced context.
The raw release (`adhere-Windows-x86_64.exe` on Windows) needs no Node or
package manager, but its lint requires explicit config `reads: []` or
`reads: ["workspacePackages"]`. Do not silently disable readers to make it
work. Only fetch it after the user chooses that alternative:

```sh
curl -fsSL --create-dirs -o ~/.local/bin/adhere \
  https://github.com/darkmatter/adhere/releases/latest/download/adhere-$(uname -s)-$(uname -m)
chmod +x ~/.local/bin/adhere
```

Validate and lint's paid requests need a TypeSafe AI API key: `TYPESAFE_API_KEY`,
or one saved by `adhere login`, which the user runs; never ask for the key in
chat or print it. Compiler-free planning with `--limit 0` needs no key.

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
`$(mktemp -d)/<topic>/<slug>/RULE.md`, so nothing lands in `.adhere/` before the
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
  `.adhere/rules/style/`; delete them unless the user chose them.
- Copy each chosen draft to `.adhere/rules/<topic>/<slug>/RULE.md`.
- Add chosen presets, or topics, to `presets` in `.adhere/config.ts`. Presets
  use the audit-wide readers; they do not own or override `reads`.
- Leave `reads` omitted for the full default. Do not add `reads: []` to the
  normal setup recommendation or as a workaround for missing compiler
  resources. Only set an explicit replacement array if the user chooses to
  disable or limit readers.
- Install chosen shared rules: `adhere install org/repo/<id>` for each, or
  `adhere install org/repo` for all of them. They land in `.adhere/rules/org/repo/`.
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

This shows a compiler-free plan and judges nothing: overall files/rules/cache
check metrics, and files deferred for a later run. Planning reads/counts/hashes
own code and checks cached answers; `--limit 0` skips budgeting, native reads,
and HTTP execution. A positive limit counts files needing requests, not rule
checks. Only selected files' pending rules and cached-location work are budgeted;
deferred/waiting counts are files, which can later be found too large. Planning never calls
`SourceReads` or resolves native symbols/references. Explain the output/prompt
caveat: estimates omit native context and hook-added data, so actual tokens,
cost, and request splits may be higher. Source reload/hash work is bounded to
8 files; plans retain compact metadata, not all source text. Files are reloaded
for execution; if normalized code or ignore
directives changed since planning, rerun rather than using the old plan.

Tell the user that compiler type/docs strings and outgoing declaration snippets add
source/documentation sharing and token cost by default, including complete
scopes from files outside the audit filter. Whole declaration bodies can use more
tokens than fixed-line excerpts; budget overflow skips the file instead of
capping bodies to seven lines or silently truncating them. Compiler-provided
documentation and JSDoc tags can remain even when ordinary code comments are
stripped; omitting `symbols` disables type/docs context and omitting
`references` disables snippets. The global workspace catalog is not sent: only
this file's matched literal imports appear under canonical package keys.
Offer an explicit reader subset or code-only opt-out if they want less context;
never apply one silently. Neither reader selection nor dependency/shared-context
changes invalidate cached judgments. If they want fresh answers under changed
context, **Ask** before clearing `.adhere/cache/`; do not clear it automatically.

On a large repo, offer a subtree such as `--filter 'src/**'`, or a file cap
such as `--limit 100`: the first 100 files needing requests in path order, with
all pending rules per selected file. Judging plus cached-unlocated work in one
file uses one slot; a cached-locate-only file also counts. Fully cached and
already-located files report without using slots. After the cap, both judge and
locate work wait. Known cheap-budget skips refill from later files, but native
or HTTP-size skips after selection consume a slot without runtime refill.

Explain that a file cap is not an HTTP-request or token/cost cap: each file can
produce judge, locate, split-batch, and private hook requests. **Ask** before
sending, then run the command below with only the user's chosen filter/file cap:

```sh
adhere lint --yes
```

`SourceReads.prepare(paths)` registers eligible-path metadata only, with no
file I/O, compiler/SDK import, spawn, snapshot, or semantic query, even for a large list.
Only after confirmation do pending judgments or cached findings still needing
location trigger actual per-file native reads just before judge/locate. Native
transactions are serial through one permit; HTTP execution remains concurrent
at 8. Returned context is reused locally and full budgets are enforced before
HTTP, with oversized files skipped and no silent truncation. Shared state plus
one question must fit 32k tokens and state plus all questions must fit 64k per
request, with 1k reserved for overhead. The SDK may still parse a full selected
project, and additional monorepo programs may increase startup time and memory.

`symbols` remains `Record<string, string>`: compiler-rendered distinct type
blocks for same-name binding/narrowing contexts, with compiler documentation
and JSDoc tags once per canonical symbol per file. It does not promise literal
IDE labels or selected-call overload presentation. Symbol/type queries are
batched, and independent SDK requests are chunked to at most 8 within the single
active native document/snapshot; HTTP work remains concurrent at 8. `references` maps used names to canonical outgoing declarations
by pathname, selecting the smallest complete AST scope without extra surrounding
lines. Functions include full bodies; arrow/object initializer variables include
whole variable statements with `export const` and semicolons. Methods, getters,
and setters include their whole member, not the entire class; classes,
interfaces, and type aliases include the whole declaration. Repeated/overlapping
scopes merge and disjoint scopes join with `…`. This is syntactic scope selection,
not recursive helper-call expansion: helpers called by an imported function are
not automatically expanded. Scopes preserve indentation and the comment/directive
policy, including associated JSDoc when `includeComments` is true; compiler
docs/tags in `symbols` remain available regardless. Current-file, declaration-file, `node_modules`, and
outside-root exclusions are unchanged. There are no incoming callers, counts, structured locations,
unresolved lists, full-file collection, or completeness markers.

The first actual read lazily starts one native TypeScript LSP process with its
public SDK API pipe; both are pinned to exactly `7.1.0-dev.20261009.1` and must
match. This prerelease contains the tuple-reference serialization fix from
[microsoft/TypeScript#64080](https://github.com/microsoft/TypeScript/issues/64080). `NativeLsp` owns lifecycle only and makes
no `textDocument/hover` calls. Each read uses the passed as-written text after
normalized-code/ignore active-plan validation, opens only that document at
version 1, uses `textDocument/documentSymbol` as its readiness barrier, and calls
the public, parameterless `API.getCurrentLanguageServerSnapshot()`.
Success closes the document, disposes that snapshot under a guarded phase, and
clears AST caches; native failure closes the session under the watchdog.

Keep dependencies/configs stable: only current-read text is pinned, not every
registered file or an immutable global audit snapshot. Warm compiler project
graphs can still be large and slow to load; neither total memory nor payload
size is constant, and contexts may still exceed model budgets.

SDK/write phases and LSP requests have 30-second deadlines and reject on compiler
exit. Queued readers can be interrupted; the active owner is uninterruptible
for resource safety. A stalled phase is bounded and cleanup adds a 2-second
`SIGKILL` watchdog. These are phase/cleanup bounds, not a whole-audit timeout.

If the user explicitly chose a cache refresh, run from the audited working
directory, using the repo's package launcher as above:

```sh
rm -rf .adhere/cache
adhere lint --limit 0
```

Show the fresh counts/cache plan; `--limit 0` skips budgeting. For selected
execution work, explain that its estimate omits native context and may understate
cost/splits, then **Ask** before paid execution. Deleting the cache removes judgments and linter tallies; it can cause
new paid requests. Use this explicitly if the user wants to compare fresh
compiler type/docs and declaration payloads with older cached answers. A change in `B.ts` does not
otherwise invalidate cached judgments for an unchanged importing `A.ts`.

Walk the user through the report:

1. How to read a finding: the rule id, the description, its confidence and
   context scores, the underlined line, and the warning when the file may not
   show enough.
2. Findings grouped by rule, the highest probabilities first. Check a few from
   each rule against the code, and say which look real and which do not.
3. For each noisy rule, propose one change from the adhere skill's "Tuning a
   rule": narrow the wording, scope it, raise its threshold, make it a
   warning, or turn it off. **Ask**, apply what the user accepts, and run
   lint again. With unchanged own code and model, only the edited rules are
   judged again; dependency/context changes alone are not tracked.

CI fails on any error finding, so lint must exit 0 before step 8. **Ask** how
to get there: fix the real findings now with the adhere-fix skill
(`adhere skill fix`), make a rule a warning until its findings are fixed,
or suppress false findings with `adhere-ignore` comments that give the reason.

Commit `.adhere/` with the cache, so the team and CI reuse these judgments.
Offer to add `.adhere/cache/** linguist-generated -diff` to `.gitattributes`.

## 8. Add adhere to CI

**Ask** before writing a workflow and before touching the repo's secrets.

If the repo's CI already installs its dependencies, add adhere as a job or a
step there, with the same setup, so it runs the pinned adhere the way the
rest of CI runs its tools. Otherwise, for GitHub Actions, add
`.github/workflows/adhere.yaml`:

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
      # Set up the repo's package manager and install, from the table below.
      - run: pnpm exec adhere lint --yes # the manager's way of running adhere
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
```

| Manager | Setup steps                                                                         | Install                                                      |
| ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| bun     | `uses: oven-sh/setup-bun@v2`                                                        | `bun install --frozen-lockfile`                              |
| pnpm    | `uses: pnpm/action-setup@v4`, then `uses: actions/setup-node@v4` with `cache: pnpm` | `pnpm install --frozen-lockfile`                             |
| yarn    | `uses: actions/setup-node@v4` with `cache: yarn`, then `run: corepack enable`       | `yarn install --immutable`, or `--frozen-lockfile` on Yarn 1 |
| npm     | `uses: actions/setup-node@v4` with `cache: npm`                                     | `npm ci`                                                     |

Pin the versions the repo already uses: bun's `bun-version`, Node's
`node-version` from `.nvmrc` or `engines`, and pnpm's from `packageManager`,
which `pnpm/action-setup` reads. Keep optional dependencies enabled so adhere's
platform package and its compiler dependency are installed. Existing project
configs and dependencies supply configured context when available; files with
no configured project or excluded from one use inferred context. Do not require
or generate a root `tsconfig.json` merely to make default lint run. In a repo
without a `package.json`, use the package launcher for the full default.
Only skip setup/install and fetch the raw executable if the user explicitly
chose and committed `reads: []` or `reads: ["workspacePackages"]` locally.
That is a reduced-context alternative, not an equivalent default installation.
Fetch the executable at the version the user ran:

```yaml
- run: |
    curl -fsSL -o "$RUNNER_TEMP/adhere" https://github.com/darkmatter/adhere/releases/download/v0.14.0/adhere-$(uname -s)-$(uname -m)
    chmod +x "$RUNNER_TEMP/adhere"
    "$RUNNER_TEMP/adhere" lint --yes
  env:
    TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
```

Add `--deny-warnings` if the user wants warnings to fail the job too. Match
the branch to the repo's default branch. For another CI system, write the
same job: check out, install, run adhere's `lint --yes` with the key from a
secret.

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
