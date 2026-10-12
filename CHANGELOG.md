# Changelog

## Unreleased

### Added

- Configurable decision-model providers, including Jev, OpenAI, Cloudflare Workers AI, and custom adapters. OpenAI credentials can be managed separately with `login --openai` and `logout --openai`.
- Provider-aware eval reporting for latency, unanswered questions, and shared repository scoring; rule-detail and provider-comparison studies with expanded labeled datasets.
- A semantic-read pilot with frozen cases, inputs, and results, plus digest-checked rescoring. Its historical results do not measure the current compiler-type/declaration-scope format.
- Installed-package native-read verification on Linux and macOS ARM/Intel, with macOS checks gating publishing.
- Shared TypeScript context for lint requests: compiler-rendered symbol types and documentation, outgoing declaration snippets, and workspace metadata limited to packages imported by the audited file.
- Native compiler support in npm-installed adhere, with the JavaScript SDK bundled in the executable and matching compiler resources installed through platform-specific dependencies.
- Configurable `maxSymbolLength` and `maxSymbolDocumentationLength` keys (default 256 each) cap each symbol's resolved content and its documentation; `0` omits documentation

### Changed

- Adopt Vite+ `1.1.0` and Vitest `5.0.3`, with project formatting hooks, shared editor settings, and pinned development runtimes.
- Configure `reads` at the top level instead of per rule. `workspacePackages`, `symbols`, and `references` are enabled by default; use `reads: []` for code-only requests.
- `--limit` counts files needing requests, including all pending rules for each selected file, rather than individual rule checks.
- Rules share file context and batch their questions, splitting requests when necessary. Rules with `appendState` retain separate request groups.
- Planning does not resolve native context. Source loading and execution are bounded, with native context prepared on demand for the current file.
- Flattened `references` read state to `symbol:pathname` keys with complete declaration excerpts, omitting compiler built-in declarations
- Audits that overflow the provider context retry once without `references` before skipping the file, keeping references available to `appendState` hooks
- Provider request state maps now carry a reserved `__comment` explaining the context, and first or overflowing request payloads are logged at debug level

### Fixed

- Avoid opening every eligible document before sending the first request; each native read owns and releases its document and snapshot.
- Replace per-symbol IDE hover calls with compiler API queries, bounded parallel formatting, and deduplicated types and documentation.
- Detect changed source or ignore directives before sending or caching results under a planned content key.
- Fix the native API panic when reading const-asserted empty tuple properties by pinning the SDK and compiler to `7.1.0-dev.20261009.1`, which includes [TypeScript #64080](https://github.com/microsoft/TypeScript/pull/64080).
