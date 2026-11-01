---
name: adhere
description: Reference for adhere, the linter for coding conventions a normal linter cannot check, judged by TypeSafe AI's Jev. Covers its commands, the Markdown rule format and how to word a rule, the config, presets, shared repos and lint packages, comments and suppressions, the cache, reading a report, and tuning a noisy rule. Use when writing or editing adhere rules, configuring adhere, reading its findings, or answering questions about it. To set adhere up in a repo, use adhere-setup; to fix findings, adhere-fix.
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
adhere init [--force]            # config, tsconfig, two example rules, and the dev dependency
adhere init --shared org/repo    # rules, instructions, lint package, CI, and an alchemy stack
adhere postinstall               # render .adhere/instructions/**/*.md into AGENTS.md
adhere login                     # save a TypeSafe AI API key; TYPESAFE_API_KEY takes precedence
adhere validate                  # rule wording, rules a linter could check, contradictions
adhere rules create [idea]       # native rule, approved plugin, or rule file; org PR
adhere rules readme              # refresh a shared repo README's managed index
adhere lint                      # judge the working directory; exit 1 on an error finding
adhere lint --limit 0            # compiler-free counts/cache plan; no budgeting
adhere lint --limit 100          # first 100 files needing requests; all pending rules per file
adhere lint --yes                # send without asking, as in CI
adhere lint --type-aware         # opt in to both compiler symbols and declaration references
adhere lint --preset effect      # add a built-in rule set; the config becomes optional
adhere lint --filter 'src/**'    # read only matching files; repeat, and ! to leave out
adhere lint --threshold 0.9      # report at another threshold from the cache; judges nothing again
adhere lint --deny-warnings      # fail on warnings too
adhere list org/repo             # the rules in a GitHub repo's .adhere/rules/, with descriptions
adhere install org/repo[/topic[/rule]][#ref] [--all]  # copy instructions and rules into .adhere/
adhere skill [docs|setup|fix]    # print a skill
```

`adhere <command> --help` lists every flag. Version, help, skills, `validate`,
and planning with `--limit 0` do not start the native compiler. Default `lint`
is compiler-free, and leaves out bundled preset rules that declare native
reads. With `typeAware: true` or `--type-aware`, it includes them and starts the
compiler only during execution, after confirmation, for pending judgments or
cached findings still needing location.

`--limit` now counts files, not rule checks; use the same flag without an extra
unit selector. Each request-bearing file consumes one slot for all its pending
rules and cached-location work. Cached-locate-only files count; fully cached and
already-located files report without consuming slots. After the cap, both judge
and locate work wait. Known cheap-budget skips refill from later paths; native
or HTTP-size skips after selection consume a slot without runtime refill.
A file can generate judge, locate, split-batch, and private hook requests, so
this is not an HTTP-request or cost cap. Confirm the estimated cost and its
native-context caveat before execution.

## Rule files

A repo's rules live in `.adhere/rules/`, a directory per rule holding a
`RULE.md`, or a `RULE.ts` (below). The directory's path is the rule id:
`.adhere/rules/data/brand-ports/RULE.md` is `data/brand-ports`. Other files in
a rule's directory are not rules, and only `RULE.md` or `RULE.ts` in a rule's
directory defines one: other Markdown in `.adhere/`, such as
`.adhere/instructions/`, is ignored. A `.adhere/rules/` in a subdirectory holds
rules for that subtree only, and the most specific rule with an id wins.
`cache/` and the config in `.adhere/` are not rules.

````md
---
description: A port must be a branded, range-checked integer, never a bare number.
---

Prose here is the rule's details: Jev reads it after the description. Say why
the rule holds, or where it does not apply.

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
- Prose outside the code is sent to Jev with the description, so keep it about
  the rule: why it holds, or where it does not apply. A note for the people who
  maintain the rule, rather than for judging code, belongs elsewhere.

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

- `reads: ["symbols", "references"]` declares the context the rule needs, a
  JSON array on one line. It enables nothing: the config's `reads` and
  `typeAware` still choose what this run sends. A project's own rule still
  runs and lint warns that it may be less accurate until a declared read is
  enabled; a bundled preset rule that declares either native read is left out
  unless `typeAware` is on.

A rule's directory can hold a `RULE.ts` instead, which default-exports
`defineRule({...})` from `@drkmttr/adhere`, with the fields a config's inline
rule takes:
`description`, `must`, `never`, and the rest. Its `appendState(state, file, Bun)`
runs right before each request for the rule, and what it returns is spread
over the request's state: `code`, the file's sections as Jev reads them,
plus the shared context enabled by the config's `reads` and `typeAware`. Use it to give Jev what the file cannot show, such
as a schema another file holds, and name the key it adds in the description.
Nothing it returns is checked, so it can break its own rule. The rule gets
requests of its own, repeating the shared context. Hook-owned external data
changes are not tracked by the cache; neither are built-in read-context contents
or reader selection. Judgments are redone when own code, model, rule, matcher,
or hook source changes, or the user clears the cache. Helpers it imports go
beside it in its directory.

A rule a regex, an import check, or the type checker could flag every time
belongs in that tool, not adhere. `adhere validate` reports rules that look
like that.

## Config

A config is optional when `.adhere/rules/` holds rules or `--preset` is given. It
sits at `.adhere/config.ts`, `adhere.config.ts`, or `.adhere.config.ts`; keep
one.

```ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  presets: ["typescript", "security"], // built-in rule sets, or topics such as "effect/basics"
  threshold: 0.8, // default 0.8
  sufficiencyThreshold: 0.6, // below it, a finding warns the file and shared context may not show enough
  reads: ["workspacePackages"], // default; [] omits workspace context
  typeAware: false, // default; true or --type-aware enables both symbols and references
  exclude: ["**/generated/**"], // files no rule judges
  includeComments: false, // true only for rules about comments
  overrides: {
    "effect/basics/instrument-with-pipe": "off",
    "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
  },
});
```

Top-level `reads` chooses workspace context for every audited file and all its
rules, including presets. It defaults to `["workspacePackages"]`, even without
a config file; `reads: []` omits that map. `typeAware` defaults to `false`.
Opting in with `typeAware: true` or `--type-aware` enables both `symbols` and
`references`, regardless of `reads`. Legacy native-reader entries in `reads`
alone do not enable the compiler; leaving them out does not disable it when
type awareness is on. Code alone requires `reads: []` and type awareness off.
Presets do not own or override this selection. A rule may declare what it
needs with `reads`, in Markdown front matter, `defineRule`, or an inline rule;
the declaration enables nothing. A bundled preset rule that declares `symbols`
or `references` is left out unless `typeAware` is on, so it is never judged
with less than it declares. A project's own rule still runs, and a declared
read the run does not enable is a warning that it may be less accurate until
enabled. The context maps are:

- `workspacePackages`: only packages matched by this file's literal imports,
  as `{ canonicalPackageName: directory }`. Subpaths match the owning package;
  the discovered workspace catalog is internal and never sent. The cheap lexer
  recognizes static/type imports, re-exports, dynamic import and require calls,
  including plain literal templates in calls. Computed modules/template
  substitutions are skipped and `require` binding is not resolved: this is
  cheap filtering, not semantic module resolution. No matches yields `{}`.
- `symbols`: `Record<string, string>`, mapping names to compiler-rendered type
  blocks plus compiler documentation and JSDoc tags. Distinct same-name binding
  and narrowing types stay distinct; docs/tags appear once per canonical symbol
  per file. This is not literal IDE hover text: there are no IDE labels or
  selected-call overload presentation. Unused local declarations may have type
  blocks too. Standard-library and Node/Bun built-ins and their methods are
  omitted; project and third-party symbols remain, including built-in-name
  shadows. Built-in type names can still appear inside meaningful signatures.
- `references`: a flat `Record<string, string>`, as
  `{ "Name:path/to/file.ts": "declarationSnippet" }`, for declarations of symbols
  used by the target code, not incoming call sites. Keys retain names as used,
  including import aliases, and repository-relative pathname casing; alias targets
  are resolved canonically. Each snippet is the smallest
  complete AST declaration scope, with no extra surrounding lines: full function
  bodies; whole arrow/object initializer variable statements, including
  `export const` and semicolons; whole methods/getters/setters, not their classes;
  and whole class/interface/type-alias declarations. Repeated/overlapping scopes
  merge; disjoint scopes join with `…`. This is syntactic selection, not recursive
  helper-call expansion: an imported function's called helpers are not added
  automatically. Indentation and comment/directive policy remain; associated
  JSDoc stays when `includeComments` is true; compiler docs/tags in `symbols`
  remain available regardless.
  Current-file, `.d.ts`, `.d.mts`, `.d.cts`, `node_modules`, and outside-root
  exclusions remain. There are no counts, incoming callers, structured locations,
  unresolved lists, full-file collection, or completeness metadata.

When type awareness is enabled, npm-installed lint uses both `symbols` and
`references` with adhere's pinned native TypeScript compiler through the npm/Bun
launcher. Enabled context maps include a self-describing `__comment` in Jev's
state; top-level guidance identifies only `code` as the audit target. No root `tsconfig.json`
or root file-list membership is required. During execution, native TypeScript
opens files with pending judgments or cached findings needing location and
discovers each file's configured project, including package
projects under solution roots. Unconfigured or excluded files fall back to
best-effort inferred context, not a refusal. These are complete outgoing AST
declaration scopes and compiler type/docs strings, not a complete
workspace-reference graph.

`SourceReads.prepare(paths)` registers metadata only: no file I/O, compiler/SDK
import, spawn, snapshot, or semantic query, regardless of how many paths are registered.
The first real read lazily starts one TypeScript `--lsp --stdio` process,
pinned with its SDK to exactly `7.1.0-dev.20261009.1`. This prerelease contains
the tuple-reference serialization fix from [microsoft/TypeScript#64080](https://github.com/microsoft/TypeScript/issues/64080);
the SDK and native executable must match that exact version. `NativeLsp` owns lifecycle only; it makes no `textDocument/hover` calls.
Types and documentation come directly from the compiler SDK through the public
API attached with `API.fromLSPConnection` to that process's API pipe. Symbol/type
queries are batched; independent SDK requests run in chunks of at most 8 within
the current document transaction.

Only one native transaction owns a permit at a time. It receives the as-written
text after normalized-code/ignore active-plan validation, opens the current
document with `didOpen` version 1, uses `textDocument/documentSymbol` as the
readiness barrier, and calls
the public, parameterless `API.getCurrentLanguageServerSnapshot()` per read. Success sends `didClose`, performs
guarded snapshot disposal, and clears the AST cache; native failure closes the
session under a watchdog. There is no audit-wide immutable snapshot and no
preload/freeze of registered files. Only current-read text is pinned; keep live
dependencies/configs stable during the audit.

SDK/write phases and LSP requests have 30-second deadlines and reject on compiler
exit. Waiting readers are interruptible; the active owner is uninterruptible
for resource safety. A stalled phase is bounded, with a further 2-second cleanup
watchdog escalating to `SIGKILL`; this is not a total audit-duration guarantee.
Native context is serial, but HTTP execution retains concurrency 8.

Even one pending file may require parsing its selected project; warm monorepo
program graphs can still consume substantial time/memory. Bounding active
documents/snapshots does not make total memory or model payload size constant,
and oversized contexts are still possible. Context is queried just
before judge/locate and reused locally. Planning never calls `SourceReads`.
Type-aware source checkouts use their development compiler dependency. Raw
GitHub binaries have no compiler resources, but run the default compiler-free
audit with workspace context without special configuration. Use `reads: []`
for code alone, with type awareness off; use the package launcher or a checkout
for type-aware execution. Plan-only `--limit 0` needs no compiler or API key.

Rules without `appendState` share requests and pay for shared input context
once per request, not once per rule. Context repeats on request splitting,
locating findings, and hook requests. Compiler documentation and complete declaration
scopes add token/privacy cost only when type awareness is enabled, including
source from files not judged.
Complete scopes may contain substantially more source/tokens than fixed-line
excerpts; function bodies are not peeked or capped to seven lines.
Compiler-provided docs and JSDoc tags can remain present with ordinary comments
stripped. Keep `typeAware` off to omit both native maps; `reads` controls only
workspace context. Use `reads: []` with type awareness off for code alone.
Plan token/cost estimates include code and cheap workspace metadata only, not
native context or hook-added data. Actual cost and request splits may therefore
be higher. Shared state plus any one question must fit 32k tokens, and state
plus all questions in a request must fit 64k, with 1k reserved for overhead.
Execution splits question batches and checks full budgets before HTTP. On
context overflow, it retries once without `references` when that map is present,
keeping target code and `symbols` intact; a further overflow skips the file.
Complete declaration scopes are not shortened to fit. Symbol strings have
configurable `maxSymbolLength` and `maxSymbolDocumentationLength` limits, both
256 by default. Only `appendState` forces a private rule request group.

`overrides` changes any rule by the id the report shows, a preset's with the
preset first, without copying it; an id no rule has refuses the run. `rules`
in the config, inline or as a directory of rule directories, replaces
`.adhere/rules/` entirely. Precedence, highest first: `--threshold`, the config, presets
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

## Linter-checkable rules

A convention a linter can decide exactly does not belong in a `RULE.md`.
`adhere rules create` asks the coding agent for one of three routes:

- **A native Oxlint rule.** The agent answers `linter` as a plain rule-id
  string, or null, and adhere checks it against its bundled Oxlint catalog at
  decode time; unknown ids are rejected. It also supplies the rule's exact
  option values, which the config puts after the severity: a rule whose
  defaults enforce the idea prints `"error"`, while an option-dependent rule
  prints `["error", ...options]`, because bare `"error"` would enforce
  nothing. Banning lodash with `no-restricted-imports` becomes
  `["error", { "paths": [{ "name": "lodash" }] }]`. A project rule prints the
  exact config; an organization rule enables it in the shared `lint/rules.json`
  and pushes a branch for a pull request with the README index refreshed. In a
  shared repo itself, "this project" writes `lint/rules.json` locally instead
  of printing the config. A rule from a plugin Oxlint leaves off
  by default also needs that plugin in `plugins`, whose list replaces Oxlint's
  default set. A type-aware rule needs
  `options.typeAware` and `oxlint-tsgolint`, which Vite+ includes.
- **A custom Oxlint JS plugin.** Only when the convention is visible in the
  syntax tree and scopes: a JS plugin cannot see TypeScript types, other
  files, or another parser's AST. The plugin must be plain ESM, default-export
  its object, and import nothing; the agent reports each diagnostic's message
  literally, so its valid and invalid fixtures can match exact diagnostics.
  adhere shows the plugin and fixtures, and runs nothing until the user
  approves. It then runs the fixtures with the project's own Oxlint RuleTester,
  through `oxlint/plugins-dev` or `vite-plus/lint/plugins-dev`, so the project
  needs its own Oxlint or Vite+ and Node 22 or newer on `PATH`; Oxlint's
  RuleTester refuses Bun and older Node, there is no Bun fallback, and without
  it nothing is written and no repair is attempted. adhere bundles no Oxlint.
  One failure goes back to the agent to repair; the user approves the repaired
  plugin, then it runs again. Nothing is written unless the tests pass.
- **An adhere rule**, for judgment, facts outside the file, or types.

A project plugin and its checked-in test go to
`.adhere/oxlint/<plugin>.mjs` and `.adhere/oxlint/<plugin>.test.mjs`; the
`.mjs` keeps ESM in a `type: commonjs` package. adhere prints the config to add
to `oxlint.config.ts` or Vite+'s lint block:

```json
{
  "jsPlugins": ["./.adhere/oxlint/no-foo.mjs"],
  "rules": { "no-foo/no-foo": "error" }
}
```

Run the test with Node 22 or newer: `node .adhere/oxlint/no-foo.test.mjs`.

A native project rule without options prints only its id:

```json
{ "rules": { "typescript/no-explicit-any": "error" } }
```

A shared repo keeps plugins in `lint/plugins/` as `.js`, with `.test.js` beside
them, because the shared package is `type: module`; it registers them in
`lint/rules.json`. The catalog follows adhere's toolchain, not the project's
installed Oxlint, so a suggestion may be missing on an older Oxlint or a newer
rule may be absent from the catalog; the plugin tests always use the project's
Oxlint. `adhere validate` reports rules left over that a linter could check.

## Shared repos

An organization keeps its instructions, rules, and lint settings in one repo,
scaffolded by `adhere init --shared org/repo`. Its `README.md` carries a
managed index between `<!-- adhere:rules:start -->` and
`<!-- adhere:rules:end -->`: every rule with its description and `RULE.md`
link, every enabled native setting in `lint/rules.json` with its severity, and
each custom plugin's enabled rules linked to `lint/plugins/<name>.js`. Refresh
it locally with `adhere rules readme` after renaming or deleting a rule; it
preserves prose outside the block, omits off settings, never runs a `RULE.ts`
or plugin, and refuses malformed markers without writing. `adhere rules create`
refreshes it for local writes and stages it with shared-repo branches.

Other repos copy the first two with `adhere install`:

```sh
adhere list org/repo                  # rules and descriptions; instructions are not listed
adhere install org/repo               # choose instruction files, then rules, at a terminal
adhere install org/repo --all         # everything, without a terminal (CI)
adhere install org/repo/data          # choose among the data topic's rules
adhere install org/repo/data/ports    # exactly that rule, without asking
adhere install org/repo#v1.0.0 --all  # everything at tag v1.0.0
```

A bare repo chooses from instruction files and rules. A topic chooses only the
rules under it, never instructions, even a topic named `instructions`. An exact
rule id with no rule deeper under it is copied directly. Already-installed
items are preselected. A rerun skips what exists; `--force` replaces existing
files and rule directories, and deselecting never deletes them.

Instruction files land in `.adhere/instructions/org/repo/<path>`. Rules keep
their whole directory in `.adhere/rules/org/repo/`, so `data/brand-ports`
becomes the rule `org/repo/data/brand-ports`, and a copied `RULE.ts` runs
whenever lint does. Copies are the repo's own from then on. `adhere postinstall`
renders the instruction files into `AGENTS.md`; files whose path has at least
three segments come first (copied files, and local files two directories deep),
then files directly in the instructions directory, then files one directory
deep, each group sorted by path.

The shared `lint/` package is not copied. Pin it as a git dependency at a
repo-wide tag (there are no per-rule or per-package tags; one tag covers rules,
instructions, and lint together), then spread it into Vite+ or plain Oxlint:

```ts
// vite.config.ts
import sharedLint from "@org/repo/lint";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: { ...sharedLint, jsPlugins: [...sharedLint.jsPlugins, "./.adhere/oxlint/local.mjs"] },
});
```

```ts
// oxlint.config.ts: oxlint -c oxlint.config.ts
import sharedLint from "@org/repo/lint";

export default { ...sharedLint };
```

`lint/index.js` reads `lint/rules.json` and resolves plugin paths relative to
the package. Paths a project adds stay relative to its own config; project
plugins live in `.adhere/oxlint/`.

The source is cloned with git, so a private repo needs git's credentials for
GitHub.

## Comments and suppressions

adhere blanks ordinary comments in judged code and declaration snippets, since
comments claiming code is safe hid real violations in the evals. Compiler
documentation and JSDoc tags in `symbols` are separate and can remain even with
`includeComments: false`. A comment containing `@adhere` is a note Jev does read:
use it for a checked fact the code relies on that the file cannot show, with
how you know.

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

Judgments are cached in `.adhere/cache/`, keyed by each file's normalized own code and
model/rule/matcher/hook-source fingerprints. Commit it: judging uses paid
requests, and a committed cache gives the team and CI the same findings without
paying again. Changed own code re-judges every rule for that file; an edited rule
re-judges that rule; a threshold change re-judges nothing.

Dependencies, related source, reader selection, shared read-context contents,
and hook-owned external data are deliberately not fingerprinted. If `A.ts` imports
`B.ts`, changing `B.ts` does not invalidate `A.ts`. Changing the config's
`reads` or `typeAware` re-judges every rule once; changing what those reads
find does not. This keeps planning cheap but accepts stale dependency/context
judgments.

`planAudit` reads/counts/hashes code, checks the cache, and makes code plus cheap
workspace estimates without compiler or `SourceReads` calls. It applies `--limit`
to request-bearing files in path order before budgeting all pending rules and
cached-location work for each selected file. Rule/cache check totals remain
overall metrics; deferred/waiting counts are files. Deferred files remain
unbudgeted until selected and can later be found too large. `--limit 0` skips
budgeting, native reads, and HTTP execution.
Source reload/hash work is bounded to 8 files; plans retain compact metadata and
estimates, not all file contents. Only sampled-linter files need a planning
reread. After confirmation, execution reloads request-bearing files and cached
finding excerpts, preparing native context only when type awareness is enabled,
for pending or cached-unlocated files just before judge/locate. Every reload validates normalized
code and ignore directives against the active plan; changes refuse with rerun
guidance, without adding persistent-cache keys. A fully cached and located run
starts no compiler and needs no API key or Jev requests.

For an explicit refresh, from the audited working directory:

```sh
rm -rf .adhere/cache
adhere lint --limit 0  # compiler-free counts/cache plan; budgeting is skipped
adhere lint           # confirm fresh execution; actual context costs may be higher
```

This removes judgments and linter tallies and can cause new paid requests. Do
not clear it automatically when dependencies or readers change. Clear explicitly
if the user wants to compare fresh compiler type/docs and declaration payloads rather than cached
answers from an older format. Mark it generated to keep it out of diffs:

```text
.adhere/cache/** linguist-generated -diff
```

The key comes from `TYPESAFE_API_KEY` or from `adhere login`. lint prints a
compiler-free plan with estimated requests/cost before sending and asks at a
terminal. Output and prompt warn that native context is omitted and may increase
actual tokens, cost, and request splits. Only confirmed execution prepares context
and enforces full budgets before HTTP.

## Reading a report

```text
  × data/brand-ports: A port must be a branded, range-checked integer, never a bare number.
    confidence 0.93 · context 0.88
   ╭─[src/server.ts:6:3]
 6 │   const port: number = Number(process.env.PORT ?? 3000);
   ·   ──────────────────────────────────────────────────────
  hint: const Port = Schema.Int.pipe(...)
```

The header is the rule id and the description, with two scores on the next
line; `×` is an error, `⚠` a warning. `confidence` is Jev's probability that
the file breaks the rule. On a terminal it is amber near its rule's
threshold, within a quarter of the room above it (0.80 to 0.84 at a threshold
of 0.80), and green above that: a rule whose findings are mostly amber turns
on where its threshold sits. `context` is its probability that the file and
shared context show enough to decide. Default context is `workspacePackages`;
`symbols` and `references` require `typeAware: true` or `--type-aware`.
It is colored the same way around the sufficiency threshold, 0.6
by default: amber from 0.50 to 0.69, red below. Below 0.6 the finding also
carries `warning: this file may not show enough to check this rule`. It turns
on something outside the file, and was usually false in the evals: check that
before acting on it. The underline is the line Jev names.

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
