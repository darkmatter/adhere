---
title: "Install instructions and rules from other repos"
---

An organization can keep instructions and rules in one repo's `.adhere/`, and
other repos copy them in with `adhere install`. The same repo can carry a
`oxlint/` package for shared Oxlint settings, imported rather than copied.

```sh
adhere list darkmatter/standards                        # rules and descriptions
adhere install darkmatter/standards                     # choose instruction files and rules
adhere install darkmatter/standards --all               # everything, without a prompt
adhere install darkmatter/standards/data                # choose among the data topic's rules
adhere install darkmatter/standards/data/brand-ports    # just that rule
adhere install darkmatter/standards#v3 --all            # everything, as tagged v3
```

`adhere list` lists rules and their descriptions, not instruction files.

At a terminal, a bare repo shows a multiselect of what it can copy: its
instruction files first, then its rules. Something already installed is
preselected, so a rerun shows what is already there; it is skipped, and
`--force` replaces it. Deselecting it leaves it as it is.

`--all` copies every match without asking and needs no terminal. Without a
terminal and without `--all`, the command fails, and names the matches and an
exact rule to use instead.

- A topic copies the rules under it, and never instruction files, even for a
  topic named `instructions`. An exact rule id, with no rule deeper under it,
  copies that rule alone, without asking.
- Instruction files land in `.adhere/instructions/org/repo/<path>`, so a
  source's `security/hardening.md` becomes
  `.adhere/instructions/darkmatter/standards/security/hardening.md`.
- Rules land in `.adhere/rules/org/repo/`, so `data/brand-ports` from
  darkmatter/standards lands in
  `.adhere/rules/darkmatter/standards/data/brand-ports/` as the rule
  `darkmatter/standards/data/brand-ports`. Two sources' files never collide.
- The copies are the repo's own from then on: commit them, edit them, or start
  new rules from them. Nothing tracks where they came from, and a later install
  skips what is already there. `--force` replaces those files and rule
  directories, local edits and all; deselecting something never deletes it.
- A rule's whole directory is copied. The source's config, its inline rules,
  its cache, and its `oxlint/` package are not.

> **Read what you install.** A `RULE.ts` is copied with the helpers beside it,
> and runs whenever lint does, in CI too. `adhere list` names a `RULE.ts`
> without its description, since reading the description would run the file.

The source is cloned with `git` from `https://github.com/org/repo.git` at the
branch or tag after `#`, so a private repo needs git's credentials for GitHub,
which `gh auth setup-git` sets up. To clone over SSH instead, let git rewrite
the URL:
`git config --global url.git@github.com:.insteadOf https://github.com/`.

## Shared lint settings

A shared repo's `oxlint/` directory is a plain ESM package, not something
`adhere install` copies. Consume it as a git dependency pinned to a
[repo-wide tag](#creating-a-shared-repo):

```sh
bun add -D "github:acme/standards#v1.0.0"
```

Spread it into Vite+'s lint config, or plain Oxlint's:

```ts
// vite.config.ts
import sharedLint from "@acme/standards/oxlint";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ...sharedLint,
    jsPlugins: [...sharedLint.jsPlugins, "./.adhere/oxlint/local.mjs"],
    rules: { ...sharedLint.rules, "local/my-rule": "error" },
  },
});
```

```ts
// oxlint.config.ts, with plain Oxlint: oxlint -c oxlint.config.ts
import sharedLint from "@acme/standards/oxlint";

export default { ...sharedLint };
```

`oxlint/index.js` reads `oxlint/rules.json` and resolves its plugin paths, so
the export works from any directory. Paths you add stay relative to your own
config. Shared plugins stay in `oxlint/plugins/` as `.js`, with tests beside
them, because `oxlint/` is `type: module`; project plugins use `.mjs` in
`.adhere/oxlint/`, so a `type: commonjs` package still loads them as ESM.

## Creating a shared repo

`adhere init --shared org/repo` scaffolds a repo whose instructions and rules
other repos copy in with `adhere install`, and whose lint settings they import,
instead of one that lints itself. It writes no config, since install copies
files and lint is consumed as a package, and with the examples:

- **`README.md`** says what the repo is for, how to install its instructions and
  rules, how to import its lint package, how to add a rule, and how to tag a
  release. It also carries a managed guide, between
  `<!-- adhere:rules:start -->` and `<!-- adhere:rules:end -->`: a contents
  list linking the rules, lint settings, and custom plugin sections. Under a
  level-two Rules heading, each rule id opens an expandable entry containing
  its description, its `RULE.md` examples and explanation, and a source link.
  Rules remain ordered by topic without visible topic headings.
- **`.adhere/instructions/00-workflow.md`** and two rules under
  `.adhere/rules/style/` are examples to replace. adhere renders the
  instruction file into a consumer's `AGENTS.md` through
  [postinstall](/adhere/compose-agents-md/).
- **`.github/workflows/adhere.yaml`** runs `adhere validate` on every push to
  main and every pull request, with the `TYPESAFE_API_KEY` secret. A pull
  request from a fork gets no secrets, so validate refuses there.
- **`alchemy.run.ts`** is an [alchemy](https://alchemy.run) stack that creates
  the GitHub repo, or adopts it, and sets that secret from `TYPESAFE_API_KEY`
  when deployed with `npx alchemy deploy`.
- **`package.json`** names the package `@org/repo`, exports only `./oxlint`,
  and pins alchemy and effect, which init installs, to versions that work
  together.
- **`oxlint/index.js`**, **`oxlint/index.d.ts`**, and **`oxlint/rules.json`**
  are the plain ESM Oxlint config consumers spread into Vite+ or plain Oxlint.
  `rules.json` starts empty; native rules and custom plugins are added there.
- **`.gitignore`** keeps the installed packages and alchemy's state out of git.

`adhere rules readme` refreshes that guide from the checkout: a section-only
contents list, each rule under `.adhere/rules/` ordered by its first path
segment and id, each enabled setting in `oxlint/rules.json` with its severity,
and each custom plugin's enabled rules, linked to its file when local.
Each rule id is an expandable heading; its description and the rest of its
`RULE.md` (examples and explanation) appear inside, followed by a source link.
Rules and topics keep stable `#adhere-...` permalinks, and the block ends with
a link back to the contents. The shorter contents list means scrolling to
find individual rules rather than following a contents link. It reads a `RULE.ts` by name only and never runs
it, so that rule links to its source but shows no examples; plugin code is
never loaded. It touches nothing outside the markers. `adhere rules create`
refreshes the guide after writing locally in the shared repo, and a rule or
plugin pushed to a shared repo for a pull request carries the refreshed block
in the same commit. Rename or delete a rule by hand, then run the command to
remove the stale entry. Missing, duplicated, or out-of-order markers refuse the
refresh and leave the README unchanged. The command also runs
[from a consumer repo](#refreshing-the-guide-from-a-consumer-repo), where it
pushes a review branch instead of writing the checkout.

The repo is public unless you answer yes when init asks, at a terminal, whether
to make it private. Other repos then need git's credentials for it to list and
install its files. Without a terminal it is public: change `visibility` in the
stack to make it private.

Tag the repository as a whole after changing its rules, instructions, or lint
settings: one tag covers all three, and there are no per-rule or per-package
tags. Consumers pin that tag for copied files and for the lint package.

```sh
git tag v1.0.0
git push origin v1.0.0
```

## Refreshing the guide from a consumer repo

Copied rules carry no link back to where they came from, so a contributor who
renames or deletes one in their own repo can still refresh the shared guide:

```sh
adhere rules readme                          # infer from this repo's GitHub origin
adhere rules readme darkmatter/standards     # name it explicitly
```

The command chooses its target in this order:

1. An explicit `org/repo` is used, from any directory.
2. With no argument, a working directory that is itself a shared repo has its
   `README.md` written in place: the checkout refresh described above.
3. Otherwise the checkout's GitHub `origin` remote is read, whether it is
   `https://`, `ssh://`, or scp-style (`git@host:owner/repo`), and its owner
   names the repo: `acme/app` infers `acme/standards`. The origin's own
   repository name is never used.

A fork's `origin` names the fork's owner, not the upstream one, so a fork's
guide travels with its copies until it is merged. A remote other than GitHub
is not interpreted; name the repo explicitly instead. The same applies when
there is no `origin`, or when the organization's repo does not follow the
`<owner>/standards` convention: the command stops and names
`adhere rules readme org/repo` as the fix.

For an explicit or inferred remote target, adhere clones the default branch
into a temporary directory, refreshes the managed block, and commits only a
changed `README.md` on a new `adhere/readme-<timestamp>` branch. It pushes that
branch and prints a compare link to open the pull request:

```text
Updated README.md: 12 rules, 4 enabled lint settings.
Pushed adhere/readme-1767225600000 to darkmatter/standards.
Open the pull request: https://github.com/darkmatter/standards/compare/adhere/readme-1767225600000?expand=1
```

adhere opens no pull request itself, and nothing outside the temporary clone
changes: your checkout and the shared repo's default branch are untouched. When
the refreshed block matches the README already there, it prints
`No change, so nothing was pushed.` and neither commits nor pushes.

The remote target does not need the `./oxlint` export that identifies a shared
repo locally, so a rules-only repo is refreshed too. The same reading rules
apply: a README without the markers gets the block appended, and malformed
markers stop the push before anything is written.
