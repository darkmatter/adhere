# Decisions

Accepted decisions for adhere's shared-repo and linter integration. These
records explain the choices the README and skills document; they are not a
roadmap.

## Tags are repo-wide

A shared repo releases as a whole. One tag, such as `v1.0.0`, covers its rules,
its instruction files, and its `oxlint/` package. There are no per-rule or
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
`.adhere/instructions/<org>/<repo>/`. The shared `oxlint/` package is not copied;
consumers add the repo as a git dependency and import `@org/repo/oxlint`.

Rules are data: a copied rule becomes the repository's own, can be edited in
place, and a copied `RULE.ts` runs with the helpers beside it without a package
loader. Instructions are Markdown that `adhere postinstall` renders into
`AGENTS.md`, so a copy keeps the text visible and reviewable in the repository.
Lint settings are configuration: they must resolve plugin paths relative to the
shared package, and multiple projects need the same settings without keeping
duplicate copies. `oxlint/index.js` performs that resolution and is spread into
Vite+'s lint block or plain Oxlint's config.

The tradeoff is drift. Copied files stop tracking their source, and
`--force` replaces local edits when a consumer takes a newer tag. That is
intentional: local edits should be visible and reversible, not silently
overwritten by an import. Lint settings move with the git-dependency pin
instead.

The package's name is one word everywhere: the directory `oxlint/`, the export
key `./oxlint`, and the import `@org/repo/oxlint`. Those supersede `lint/`,
`./lint`, and `@org/repo/lint`; only the names changed. It is still one package
per shared repo, still not copied by `adhere install`, still pinned by the
repo-wide tag, and still recognized by a `package.json` that exports that key.
A consumer importing the old path and a scaffold exporting only `./lint` are
legacy rather than supported: the old export no longer identifies a shared
repo.

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

## The shared README guide is managed, not generated wholesale

A shared repo's README describes what it offers in a guide generated from the
checkout between `<!-- adhere:rules:start -->` and
`<!-- adhere:rules:end -->`: a contents list that links every topic and rule,
every rule under `.adhere/rules/` grouped by topic, every enabled setting in
`oxlint/rules.json` with its severity, and every custom plugin's enabled rules,
linked to the plugin file when the plugin is local. A topic is a rule's first
id segment, a rule with a single segment falls under `Other`, topics sort by
name, and rules sort by id within a topic, so the same checkout always writes
the same block. A lint setting left `off` is omitted.

Each rule's entry is a `<details>` whose summary is the description `adhere
list` shows in bold followed by the rule id, and whose body is the `RULE.md`
after its front matter, embedded verbatim: all prose, fenced examples with
their language tags, and links survive. The guide parses the body with
[`mdast-util-from-markdown`](https://github.com/syntax-tree/mdast-util-from-markdown#use),
the standard CommonMark parser, and edits the original source at the positions
it reports instead of reserializing the tree: it inserts or adjusts an ATX
heading line and rewrites the target of a real link, image, or link definition,
so everything else — fences, indented code, inline code, HTML, entities, and
line breaks — stays byte-for-byte as the rule wrote it. One exception: if the
body ends inside an unclosed top-level code fence, the guide appends a closing
fence so later README text is not swallowed; the source `RULE.md` is unchanged.
An ATX heading is demoted three levels, capped at six, and gets an
`adhere-heading-<rule-key>-<heading-slug>` anchor before its line, where
`<rule-key>` is the rule anchor's own emitted suffix. A setext heading is left
as written: not demoted and not anchored. The prefixes stay disjoint, so
heading `b` of rule `style/a` is `adhere-heading-style-a-b` while rule
`style/a-b` is `adhere-rule-style-a-b`. Every emitted anchor shares one
uniqueness registry: a repeated heading numbers from `-2`, and a literal
heading that collides gains another `-2` (`Must 2` after a numbered `must-2`).
No id in the block repeats. A relative link, image, or link definition target
written in the rule's directory is rebased to `./.adhere/rules/<id>/...`.
A `#fragment` target that names one of the body's headings resolves by the
source name GitHub would give it — `#must`, then `#must-1`, `#must-2` — and is
rewritten to that heading's emitted anchor. Any other `#fragment` target is
rebased to the rule file instead of dangling, as
`./.adhere/rules/<id>/RULE.md#examples`.
A link in a demoted heading is rebased like any other prose link; heading text
is not special. Text that looks like a link inside fenced code, indented code,
or inline code spans stays as written, as do absolute URLs, `/`-absolute paths,
`<...>` targets, and raw HTML links. A target the source escapes or encodes
differently from its parsed URL is left as written. A source link follows the
body. The body is read as Markdown data, never executed. A `RULE.ts` therefore
shows no body: its entry names the rule as TypeScript, says the guide does not
read or run it, and links the file as source. A plugin's code is never loaded
either.

Each topic, rule, and section has an explicit `<a id="adhere-...">` anchor, and
each topic section and the block end link back to the contents. A rule's anchor
is both its contents link and its permalink. An anchor built from the rule's id
rather than GitHub's heading slug keeps that permalink when its statement
changes, and the prefix keeps an author's heading from claiming it; ids that
slug alike get numbered suffixes instead of colliding.

Embedding the body puts a rule's statement, examples, and explanation where a
reader expands them without leaving the page, and the expandable form keeps
long bodies out of the contents list. Reading a `RULE.ts` to show its examples
would run it, since a rule file may import and execute at load time, so only a
`RULE.md` contributes body text. A standard CommonMark parser keeps the guide
from carrying a second, approximate Markdown grammar: it recognizes reference
definitions, nested lists, and code spans, and reports source positions, so the
guide edits only the ranges it must and leaves the rest alone. The lint
settings and plugins stay plain bullets after the rules.

Only the block is replaced. The README also carries setup, install, and release
prose written by hand, so regenerating the whole file would destroy it, and
appending a fresh guide on every change would accumulate stale entries. Markers
make the managed region explicit and idempotent, and a missing, duplicated, or
out-of-order marker refuses the refresh before any write rather than guessing
at a repair. `adhere init --shared` writes the block into its scaffold and
refreshes it after the example rules land; re-running it over an existing
README updates only the block.

`adhere rules readme` is the refresh for edits, renames, and deletions made by
hand: in the shared checkout it writes the README locally, and elsewhere it
refreshes the guide through a review branch (below). Shared-repo create flows
also refresh before committing: a rule or plugin pushed for a pull request
carries the guide in the same commit, and a local write refreshes it afterward.
When the working directory is itself the shared repo, "this project" means its
`oxlint/` package: native settings are written to `oxlint/rules.json` and
plugins to `oxlint/plugins/` locally instead of printing a consumer snippet.
The shared repo is recognized by the metadata `init --shared` writes, a
`package.json` exporting `./oxlint`, not by the presence of `.adhere/rules/`,
which every project with rules has. A legacy rules-only org repo without that
export keeps its previous create flow and gets no guide or scaffold. Malformed
markers fail the refresh before any push, rather than suppressing the error and
publishing a stale guide.

## The README guide can be refreshed from a consumer repo

`adhere rules readme [org/repo]` picks the repo it writes from what it is told,
then from where it runs: an explicit `org/repo` wins, a working directory that
is itself a shared repo refreshes locally as before, and anything else infers
the target from the checkout's GitHub `origin` remote as `<owner>/standards`
(an `acme/app` checkout refreshes `acme/standards`, never `acme/app`).
For an inferred or explicit remote target it clones the default branch,
refreshes the block, and pushes a review branch rather than writing the
consumer checkout.

A repository that copies a shared repo's rules has no record of where they came
from, by design, so a contributor who edits a copied rule cannot name the
source without looking it up. Inferring it from `origin` uses information the
repository already carries. The alternatives each add state: a config key or
install-time metadata file recreates the tracking that copying deliberately
drops, and the per-user `settings.json` entry belongs to `rules create`, is
absent on CI, and describes a person rather than the repository. The explicit
argument covers the rest: no origin, a non-GitHub origin, or a shared repo
named something other than `standards`. A fork's `origin` owner is used on
purpose, since the fork's copies and guide should travel together until it is
merged upstream, and a URL a person did not choose is never guessed past
GitHub.

The write is deliberately reviewable rather than direct: only a changed
`README.md` is committed, on a fresh `adhere/readme-<timestamp>` branch, and
the command prints a compare link. No pull request is opened, the consumer
checkout and the default branch stay untouched, and an unchanged guide pushes
nothing. A remote target bypasses the `./oxlint` recognition that gates the
local write, because a rules-only repo has a README guide too; the local
no-argument mode keeps that gate, since writing files in a checkout is still
the shared-repo operation it was. When no target can be resolved, the command
fails and names the explicit form rather than assuming one.

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
  or enables the same setting in a shared repo's `oxlint/rules.json`.
- A custom Oxlint JS plugin is for a convention visible in the syntax tree and
  scopes. It must be plain ESM, import nothing, and default-export its object.
  Its diagnostics are reported literally so the valid and invalid examples can
  assert exact messages. The user approves the plugin and its examples before
  anything runs. It is then tested with the project's
  own Oxlint RuleTester, through `oxlint/plugins-dev` or
  `vite-plus/lint/plugins-dev`; a failure gets one agent repair, reapproval,
  and another run, and nothing is written unless the tests pass. Project files
  live in `.adhere/oxlint/` as `.mjs`, since a `type: commonjs` package treats
  `.js` as CommonJS; shared files live in `oxlint/plugins/` as `.js`, since
  `oxlint/` is `type: module`. Tests run on Node 22 or newer: Oxlint's RuleTester
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
