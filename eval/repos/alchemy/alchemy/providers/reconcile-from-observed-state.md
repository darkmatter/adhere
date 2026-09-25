# alchemy/providers/reconcile-from-observed-state

A custom provider's reconcile must read the resource's live state and converge it in one flow that serves create, update, and adoption, never branching into separate create and update bodies on output === undefined or trusting olds as proof the resource exists.

6 findings, from 0.80 down to 0.71. Each showed this hint:

```ts
reconcile: Effect.fn(function* ({ news, output }) {
  let live = yield* observe(output);
  if (live === undefined) live = yield* create(news);
  if (drifted(live, news)) live = yield* update(live.id, news);
  return toAttributes(live);
}),
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.80 packages/alchemy/test/test.resources.ts:898:1
> 898 │ export const deleteFirstResourceProvider = () =>

0.78 packages/alchemy/src/Axiom/ApiToken.ts:118:11
  112 │         reconcile: Effect.fn(function* ({ news, output }) {
  113 │           // Observe — Axiom does not expose an update endpoint for tokens,
  114 │           // so any actual change to the inputs is forced to a replacement
  115 │           // by `diff` above. That means by the time `reconcile` runs we
  116 │           // are either (a) creating fresh, or (b) re-reconciling identical
  117 │           // inputs against an existing token.
> 118 │           if (output !== undefined) {
  119 │             // Identical inputs — Axiom does not echo the bearer back, so
  120 │             // the cached `output` (with the persisted Redacted token) is
  121 │             // the authoritative current state.
  122 │             return output;
  123 │           }
  124 │
  125 │           // Ensure — mint a new token. Axiom returns the bearer exactly
  126 │           // once; capture it into Redacted state for downstream consumers.
  127 │           const result = yield* create(news);
  128 │           if (!result.token) {
  129 │             return yield* Effect.die(
  130 │               new Error("Axiom did not return a token on create"),
  131 │             );
  132 │           }
  133 │           return {
  134 │             ...result,
  135 │             token: Redacted.make(result.token),
  136 │           };
  137 │         }),

0.78 packages/alchemy/src/Cloudflare/Email/Rule.ts:170:7
> 170 │       if (output?.ruleId) {
  171 │         const result = yield* emailRouting
  172 │           .updateRule({
  173 │             zoneId,
  174 │             ruleIdentifier: output.ruleId,
  175 │             ...body,
  176 │           })
  177 │           .pipe(
  178 │             retryWorkerScriptNotFound,
  179 │             Effect.catch(() =>
  180 │               emailRouting
  181 │                 .createRule({ zoneId, ...body })
  182 │                 .pipe(retryWorkerScriptNotFound),
  183 │             ),
  184 │           );
  185 │         return normalize(result, zoneId);
  186 │       }

0.73 packages/alchemy/src/AWS/CloudFront/Invalidation.ts:206:11
  200 │         reconcile: Effect.fn(function* ({ news, output, session }) {
  201 │           // An invalidation is an immutable ledger entry, not a mutable
  202 │           // resource. If we already issued one for this logical id and
  203 │           // version, return its attributes unchanged. The `diff` above
  204 │           // forces a `replace` whenever `distributionId` or `version`
  205 │           // changes, so the engine creates a fresh invalidation that way.
> 206 │           if (output?.invalidationId) {
  207 │             yield* session.note(output.invalidationId);
  208 │             return output;
  209 │           }
  210 │
  211 │           // Ensure — issue the invalidation. CloudFront uses
  212 │           // `CallerReference` (= `version`) for idempotency: the same
  213 │           // version submitted twice returns the same invalidation.
  214 │           const invalidation = yield* createInvalidation(news);
  215 │           yield* Effect.logInfo(
  216 │             `CloudFront Invalidation reconcile: storing ${invalidation.Id} for distribution=${news.distributionId}`,
  217 │           );
  218 │           yield* session.note(invalidation.Id);
  219 │           return {
  220 │             invalidationId: invalidation.Id,
  221 │             distributionId: news.distributionId,
  222 │             version: news.version,
  223 │             status: invalidation.Status ?? "InProgress",
  224 │             paths: news.paths ?? defaultPaths,
  225 │             createTime: invalidation.CreateTime,
  226 │           };
  227 │         }),

0.71 packages/alchemy/src/Cloudflare/Stream/SigningKey.ts:150:7
  142 │     reconcile: Effect.fn(function* ({ output }) {
  143 │       const { accountId } = yield* yield* CloudflareEnvironment;
  144 │
  145 │       // Observe — existence-only resource: check the key is still listed.
  146 │       const exists = output?.keyId
  147 │         ? yield* findKey(output.accountId ?? accountId, output.keyId)
  148 │         : false;
  149 │
> 150 │       if (exists && output !== undefined) {
  151 │         // Nothing mutable to sync — keep the cached attributes (they
  152 │         // carry the create-only key material).
  153 │         return output;
  154 │       }
  155 │
  156 │       // Ensure — create a new key (`createKey` takes an empty body).
  157 │       const created = yield* stream.createKey({ accountId });
  158 │       return {
  159 │         keyId: created.id ?? "",
  160 │         accountId,
  161 │         created: created.created ?? undefined,
  162 │         pem: Redacted.make(created.pem ?? ""),
  163 │         jwk: Redacted.make(created.jwk ?? ""),
  164 │       } satisfies SigningKeyAttributes;
  165 │     }),

0.71 packages/alchemy/src/Random.ts:40:9
  35 │     reconcile: ({ news = {}, output }) =>
  36 │       Effect.sync(() => {
  37 │         // Observe — there is no remote state. The cached `output.text` is
  38 │         // the authoritative current value; once minted it is preserved
  39 │         // across reconciles to keep the secret stable.
> 40 │         if (output?.text) {
  41 │           return output;
  42 │         }
  43 │
  44 │         // Ensure — no observed value: mint a fresh random secret and
  45 │         // return it. The next reconcile will see this in `output` and
  46 │         // short-circuit above.
  47 │         const byteLength = news.bytes ?? 32;
  48 │         const bytes = new Uint8Array(byteLength);
  49 │         crypto.getRandomValues(bytes);
  50 │         return {
  51 │           text: Redacted.make(
  52 │             Array.from(bytes)
  53 │               .map((b) => b.toString(16).padStart(2, "0"))
  54 │               .join(""),
  55 │           ),
  56 │         };
  57 │       }),
```
