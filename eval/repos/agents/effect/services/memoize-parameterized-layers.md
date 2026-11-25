# effect/services/memoize-parameterized-layers

The [preset rule](../../../../../presets/effect/services/memoize-parameterized-layers/RULE.md)
targets repeated construction of a parameterized layer, not repeated use of
an existing layer. The one reviewed pre-ignore finding in `darkmatter/agents`
was the latter.

- `apps/chat/src/runtime/browser-http.ts:11-18` (probability 0.82, context 0.84):
  `browserHttp.runPromise` and `browserHttp.runFork` both provide the same
  exported value, `FetchHttpClient.layer`. Neither entry point calls a layer
  constructor or supplies parameters. This is a claim about the layer value,
  not whether separate requests share a running HTTP client.

**Regression hint:** Keep two uses of the same exported layer unflagged.
Replace them with two calls to the same layer constructor with identical
options and expect a finding.
