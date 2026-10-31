# Changelog

## Unreleased

### Added

- `adhere rules create [idea]`: a wizard that writes one rule with an installed coding agent (`claude`, `codex`, or `omp`). The first run, or `--setup`, saves the agent and the organization's shared rules repo, as `org/repo`, to `~/.config/adhere/settings.json`; `--agent` overrides the agent for one run. The agent suggests a linter that already checks it, whether the rule belongs to the project or the shared repo, three names, a `RULE.md` or, when Jev needs state the file cannot show, a `RULE.ts` with `appendState`, and whether the rule needs `typeAware` or `reads`. It then finds code in the repo for the user to judge: each excerpt is shown with three lines around it and the agent's reason, and the user's answers decide which examples the draft uses. adhere checks the draft as `validate` does, sending problems back to the agent once before showing it; a `RULE.ts` is imported, and its code run, only after the user approves it. A project rule is written to `.adhere/rules/`, with a warning when `.adhere/config.ts` lacks the context it needs; an organization rule is committed to a fresh clone of the shared repo on the branch `adhere/<rule-id>`, with the settings installing repos need in the commit message, pushed, and linked for a pull request. When the convention is a native oxlint rule, chosen from adhere's catalog, the wizard prints the exact config with the rule's own option values (including a plugin oxlint leaves off and `options.typeAware`) or enables it in the shared repo's `lint/rules.json`; when it is mechanical, the agent writes an oxlint JS plugin that the user approves, with valid and invalid examples, before adhere runs it through the project's own `RuleTester`, after which the plugin and its test are written as `.mjs` files under `.adhere/oxlint/` or as `.js` files under `lint/plugins/`; the test runs on Node 22 or newer, since Oxlint's RuleTester refuses Bun and older Node. A failed run is sent back to the agent once for repair; the user approves the repaired plugin, and it runs again. Nothing is written unless the examples pass.
- `adhere rules readme` refreshes the managed index in a shared rules repo's README from the checkout: every rule under `.adhere/rules/` with the description `adhere list` shows, every enabled native setting in `lint/rules.json` with its severity, and each custom plugin's enabled rules linked to its file. It replaces only the block between `<!-- adhere:rules:start -->` and `<!-- adhere:rules:end -->`, is idempotent, removes entries for deleted or renamed rules on the next run, and refuses malformed markers without writing. A `RULE.ts` is named but never run; a rule with an off setting is omitted.
- `adhere init --shared` writes the managed README index into its scaffold, including the example rules, and refreshes it without overwriting handwritten prose. `adhere rules create` refreshes the index for local writes in a shared repo and stages it with shared-repo rule and plugin branches, so the index travels in the same pull request. In a shared repo, choosing "this project" writes `lint/rules.json` or `lint/plugins/` locally instead of printing a snippet or writing `.adhere/oxlint/`.
- `adhere install` copies a source's `.adhere/instructions/` Markdown into `.adhere/instructions/<org>/<repo>/` as well as its rules, so a shared repo can carry instructions for `adhere postinstall`.
- `adhere init --shared org/repo` scaffolds `.adhere/instructions/00-workflow.md` and a plain ESM `lint/` package (`index.js`, `index.d.ts`, `rules.json`) exported as `@org/repo/lint`, for shared Oxlint settings a consumer spreads into Vite+ or plain Oxlint.
- A bundled Oxlint native-rule catalog (`src/oxlint/catalog.json`), generated from the installed Oxlint by `bun run oxlint:catalog` and verified offline by `bun run oxlint:catalog:check`, which CI runs.
- Docs Reference pages for every command and flag and every config key, generated at build time from the CLI and the config schema's `description` annotations.
- Configurable decision-model providers, including Jev, OpenAI, Cloudflare Workers AI, and custom adapters. OpenAI credentials can be managed separately with `login --openai` and `logout --openai`.
- Provider-aware eval reporting for latency, unanswered questions, and shared repository scoring; rule-detail and provider-comparison studies with expanded labeled datasets.
- A semantic-read pilot with frozen cases, inputs, and results, plus digest-checked rescoring. Its historical results do not measure the current compiler-type/declaration-scope format.
- Installed-package native-read verification on Linux and macOS ARM/Intel, with macOS checks gating publishing.
- Shared TypeScript context for lint requests: compiler-rendered symbol types and documentation, outgoing declaration snippets, and workspace metadata limited to packages imported by the audited file.
- Native compiler support in npm-installed adhere, with the JavaScript SDK bundled in the executable and matching compiler resources installed through platform-specific dependencies.
- Configurable `maxSymbolLength` and `maxSymbolDocumentationLength` keys (default 256 each) cap each symbol's resolved content and its documentation; `0` omits documentation
- `postinstall` command that renders instruction files from the instructions directory into an `AGENTS.md` block, idempotently inserting or replacing between `<!-- adhere:instructions:start -->` and `<!-- adhere:instructions:end -->` markers; run it to sync `AGENTS.md` after changing instructions
- Configurable `instructions` config key selecting an instructions directory relative to the config file; unset it searches `.adhere/instructions`, then `.agents/instructions`
- Reserved markers inside an instruction file abort `postinstall` before any write
- `dependents` read, enabled with `reads: ["workspacePackages", "dependents"]`: per file, the workspace packages whose `package.json` depends on its package (`dependents.packages`) and up to 50 files that import it by a relative path (`dependents.files`, with `omittedFiles` counting the rest). Like other shared context, a change in dependents does not invalidate cached judgments.
- Rule options: a `RULE.ts` declares settings as an Effect Schema in `options`, and a config sets them as `overrides[id].options`. Unset required or invalid options refuse the run. Jev, and the rule's `appendState`, read the decoded settings as state `options`, in requests of the rule's own; preflight counts them, and changing them re-judges only that rule. adhere re-exports `Schema` for rule files.
- An install script for the standalone executable: `curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh` puts this machine's executable from the latest release in `~/.local/bin`.

### Changed

- `adhere install org/repo` now offers its instruction files and rules as a multiselect at a terminal, preselecting what is already installed; `--all` copies every match without a prompt; an exact rule id with nothing deeper under it copies directly; a topic copies only its rules and never instructions; `--force` replaces existing files and directories, and deselecting never deletes. Without a terminal and without `--all`, it fails and names the matches and an exact rule to use.
- `adhere postinstall` renders instruction files whose path has at least three segments first (copied shared files, and local files two directories deep), then files directly in the instructions directory, then files one directory deep, each group sorted by path.
- A shared repo's tags are repo-wide: one tag covers its rules, instructions, and `lint/` package, and there are no per-rule or per-package tags.
- Adopt Vite+ `1.1.0` and Vitest `5.0.3`, with project formatting hooks, shared editor settings, and pinned development runtimes.
- Configure `reads` at the top level instead of per rule. `workspacePackages`, `symbols`, and `references` are enabled by default; use `reads: []` for code-only requests.
- `--limit` counts files needing requests, including all pending rules for each selected file, rather than individual rule checks.
- Rules share file context and batch their questions, splitting requests when necessary. Rules with `appendState` retain separate request groups.
- Planning does not resolve native context. Source loading and execution are bounded, with native context prepared on demand for the current file.
- Flattened `references` read state to `symbol:pathname` keys with complete declaration excerpts, omitting compiler built-in declarations
- Cached judgments are kept per read setting: changing `reads`, `typeAware`, `maxSymbolLength`, or `maxSymbolDocumentationLength`, or `includeComments` with `typeAware` (it shapes the `references` excerpts), re-judges every rule once. What the reads find still does not invalidate a judgment. A cache written with reads enabled is judged again once after upgrading.
- Audits that overflow the provider context retry once without `references` before skipping the file, keeping references available to `appendState` hooks
- Provider request state maps now carry a reserved `__comment` explaining the context, and first or overflowing request payloads are logged at debug level

### Removed

- The `reference` and `avoid` keys of a config rule, `avoid` as a fence tag or heading in a `RULE.md`, and the refusal of a rule-level `reads`. A config rule whose only example is under `reference` or `avoid` fails for lack of an example, a fence tagged `avoid` or under an `Avoid` heading is code to write, and a rule-level `reads` is ignored.

### Fixed

- Avoid opening every eligible document before sending the first request; each native read owns and releases its document and snapshot.
- Replace per-symbol IDE hover calls with compiler API queries, bounded parallel formatting, and deduplicated types and documentation.
- Detect changed source or ignore directives before sending or caching results under a planned content key.
- Fix the native API panic when reading const-asserted empty tuple properties by pinning the SDK and compiler to `7.1.0-dev.20261009.1`, which includes [TypeScript #64080](https://github.com/microsoft/TypeScript/pull/64080).
- Stop refusing to run when `.adhere/` holds a Markdown file outside every rule's directory, such as an instructions file in `.adhere/instructions/`, the default for `adhere postinstall`. Like any file not named `RULE.md` or `RULE.ts`, it is ignored.
