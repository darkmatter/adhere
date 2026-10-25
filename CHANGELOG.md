# Changelog

## Unreleased

### Added

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
- An install script for the standalone executable: `curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh` puts this machine's executable from the latest release in `~/.local/bin`

### Changed

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
- The `reference` and `avoid` keys of a config rule, `avoid` as a fence tag or heading in a `RULE.md`, and the refusal of a rule-level `reads`. A config rule whose only example is under `reference` or `avoid` fails for lack of an example, a fence tagged `avoid` or under an `Avoid` heading is code to write, and a rule-level `reads` is ignored

### Fixed

- Avoid opening every eligible document before sending the first request; each native read owns and releases its document and snapshot.
- Replace per-symbol IDE hover calls with compiler API queries, bounded parallel formatting, and deduplicated types and documentation.
- Detect changed source or ignore directives before sending or caching results under a planned content key.
- Fix the native API panic when reading const-asserted empty tuple properties by pinning the SDK and compiler to `7.1.0-dev.20261009.1`, which includes [TypeScript #64080](https://github.com/microsoft/TypeScript/pull/64080).
- Stop refusing to run when `.adhere/` holds a Markdown file outside every rule's directory, such as an instructions file in `.adhere/instructions/`, the default for `adhere postinstall`. Like any file not named `RULE.md` or `RULE.ts`, it is ignored.
- Stop refusing to run when `.adhere/` holds a Markdown file outside every rule's directory, such as an instructions file in `.adhere/instructions/`, the default for `adhere postinstall`. Like any file not named `RULE.md` or `RULE.ts`, it is ignored
