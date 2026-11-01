# Decisions

Accepted decisions for adhere's shared-repo and linter integration. These
records explain the choices the README and skills document; they are not a
roadmap.

## Tags are repo-wide

A shared repo releases as a whole. One tag, such as `v1.0.0`, covers its rules,
its instruction files, and its `lint/` package. There are no per-rule or
per-package tags.

The alternatives, tagging each rule or publishing the lint package separately,
would let consumers combine versions the repo never tested together. A single
tag also gives `adhere install org/repo#v1.0.0` and a git-dependency pin the
same snapshot. The cost is coarse updates: any change to one rule needs a new
tag, and a consumer who pins the lint package to that tag takes the repo's
whole lint state, not only that rule's change.

## Copy rules and instructions; consume lint as a package

`adhere install` copies a shared repo's rule directories to
`.adhere/rules/<org>/<repo>/` and its Markdown instruction files to
`.adhere/instructions/<org>/<repo>/`. The shared `lint/` package is not copied;
consumers add the repo as a git dependency and import `@org/repo/lint`.

Rules are data: a copied rule becomes the repository's own, can be edited in
place, and a copied `RULE.ts` runs with the helpers beside it without a package
loader. Instructions are Markdown that `adhere postinstall` renders into
`AGENTS.md`, so a copy keeps the text visible and reviewable in the repository.
Lint settings are configuration: they must resolve plugin paths relative to the
shared package, and multiple projects need the same settings without keeping
duplicate copies. `lint/index.js` performs that resolution and is spread into
Vite+'s lint block or plain Oxlint's config.

The tradeoff is drift. Copied files stop tracking their source, and
`--force` replaces local edits when a consumer takes a newer tag. That is
intentional: local edits should be visible and reversible, not silently
overwritten by an import. Lint settings move with the git-dependency pin
instead.

## Selection by default, `--all` for automation

For a bare repository source, `adhere install` presents instruction files and
rules as a multiselect at a terminal. An exact rule id with nothing deeper under
it copies directly. A topic offers only its rules, never instruction files.
`--all` copies every match without a prompt.

A default of "copy everything" would make an organization's entire rule set
land in every repository, including rules a project does not want. Interactive
selection keeps that choice explicit and preselects what is already installed,
so a rerun shows the current state instead of adding duplicates. Automation has
no terminal, so it must opt into `--all`; without either, the command fails and
names the matches and an exact rule to use instead. Deselecting never deletes
existing files, and `--force` is the only way to replace local edits.

## Shared instructions render first

`adhere postinstall` reads Markdown under the instructions directory
recursively and renders it in this order:

1. files whose path from the instructions directory has at least three
   segments, which includes files copied under
   `.adhere/instructions/<org>/<repo>/`;
2. files directly in the instructions directory;
3. files one directory deep.

Each group sorts by path.

Organization-wide policy should lead a repository's local fragments, and copied
files live deep enough to be recognized by depth alone. Depth is the only test,
so a local file two directories deep is also grouped with copied files. The
rule is deterministic, so an unchanged set of files always produces the same
`AGENTS.md` block.

## The shared README index is managed, not generated wholesale

A shared repo's README lists what it offers, and that list is generated from
the checkout between `<!-- adhere:rules:start -->` and
`<!-- adhere:rules:end -->`: each rule under `.adhere/rules/` with the
description `adhere list` shows, each enabled setting in `lint/rules.json` with
its severity, and each custom plugin's enabled rules linked to its file. Rules
sort by id and entries render one per line, so the same checkout always writes
the same block. Descriptions come from `RULE.md` frontmatter through the same
discovery `adhere list` uses; a `RULE.ts` is named but never imported, and a
plugin's code is never loaded. A rule with an `off` setting is omitted.

Only the block is replaced. The README also carries setup, install, and release
prose written by hand, so regenerating the whole file would destroy it, and
appending a fresh list on every change would accumulate stale entries. Markers
make the managed region explicit and idempotent, and a missing, duplicated, or
out-of-order marker refuses the refresh before any write rather than guessing
at a repair. `adhere init --shared` writes the block into its scaffold and
refreshes it after the example rules land; re-running it over an existing
README updates only the block.

`adhere rules readme` is the local refresh, for edits, renames, and deletions
made by hand. Shared-repo create flows also refresh before committing: a rule
or plugin pushed for a pull request carries the index in the same commit, and a
local write refreshes it afterward. When the working directory is itself the
shared repo, "this project" means its `lint/` package: native settings are
written to `lint/rules.json` and plugins to `lint/plugins/` locally instead of
printing a consumer snippet. The shared repo is recognized by the metadata
`init --shared` writes, a `package.json` exporting `./lint`, not by the
presence of `.adhere/rules/`, which every project with rules has. A legacy
rules-only org repo without that export keeps its previous create flow and
gets no index or scaffold. Malformed markers fail the refresh before any push,
rather than suppressing the error and publishing a stale index.

## A versioned native catalog, and syntax-only custom plugins

`adhere rules create` may route a convention to one of two linter paths, and
only these:

- A native Oxlint rule must be an id in `src/oxlint/catalog.json`, a snapshot
  generated from the Oxlint version adhere's development toolchain installs.
  The agent answers `linter` as a plain rule-id string or null; adhere checks
  it against the catalog at decode time and rejects unknown ids. The agent
  supplies the rule's exact option values; it prints `"error"` when the
  defaults enforce the idea, and `["error", ...options]` when they do not,
  because a bare `"error"` would enforce nothing. It prints the project config
  or enables the same setting in a shared repo's `lint/rules.json`.
- A custom Oxlint JS plugin is for a convention visible in the syntax tree and
  scopes. It must be plain ESM, import nothing, and default-export its object.
  Its diagnostics are reported literally so the valid and invalid examples can
  assert exact messages. The user approves the plugin and its examples before
  anything runs. It is then tested with the project's
  own Oxlint RuleTester, through `oxlint/plugins-dev` or
  `vite-plus/lint/plugins-dev`; a failure gets one agent repair, reapproval,
  and another run, and nothing is written unless the tests pass. Project files
  live in `.adhere/oxlint/` as `.mjs`, since a `type: commonjs` package treats
  `.js` as CommonJS; shared files live in `lint/plugins/` as `.js`, since
  `lint/` is `type: module`. Tests run on Node 22 or newer: Oxlint's RuleTester
  refuses Bun and older Node, so there is no fallback, and without it nothing
  is written and no repair is attempted.

Native rules keep exact checks in the linter that can decide them, and the
catalog prevents the wizard from inventing rule ids. Generating a plugin only
for syntax-level checks keeps the boundary honest: types, other files' contents,
and other parsers remain adhere's job. Approval before execution is required
because the plugin is code. Using the project's installed Oxlint means adhere
does not bundle or choose a second linter version.

The catalog is a snapshot, not a resolver. It follows adhere's development
toolchain, so a consumer on an older Oxlint may lack a suggested rule, and a
newer Oxlint may have rules the catalog does not suggest. Plugin tests always
use the consumer's Oxlint. `bun run oxlint:catalog` regenerates the snapshot
and its documentation summaries; `bun run oxlint:catalog:check` verifies it
offline, and CI enforces the check.

## Trial before write, then review the evidence

A rule the wizard has only checked for wording or syntax is not evidence that
it judges real code the way its author meant. `adhere rules create` therefore
runs the draft on real files before writing or pushing anything, for all three
routes: an adhere rule, a native Oxlint setting, and a custom plugin. The
default is the first 100 applicable files, cached files included; the user may
choose the entire repo or type a positive whole number, or skip. The plan is
shown before it runs, with requests, tokens, and a price only when the provider
actually knows one; adhere never invents a cost or substitutes another judge
when the provider is unavailable.

After every actual run the authoring agent reads the saved report under
`.adhere/trial/` and the source it names. The user then accepts the findings,
reviews each as correct, a false positive, or unsure, or asks for a revision.
Hundreds of per-finding prompts are not forced: accepting the batch takes one
optional note, and drilling into individual findings is a choice. Every
finding and every example verdict accepts an optional note, and the revision
prompt carries those notes plus the report path and counts.

A revision is executable code or settings again, so it is re-approved before it
runs. The rerun judges the same pinned files as the first run, not a fresh
selection, so the new evidence is comparable; if a pinned file is no longer
eligible the trial fails rather than quietly choosing another. A skipped,
failed, or cancelled trial leaves the draft explicitly untested: the write
prompt says `(not trialled)`, the closing line says `Not trialled: …`, and
nothing claims validation from stale, partial, or skipped data.
