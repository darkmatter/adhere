# Native context on Alchemy's known idempotency findings

## Question and setup

Does the current filtered, self-describing TypeScript context improve the
idempotent-delete rule on real code, compared with sending the target code alone?

- Repository: `/tmp/alchemy` at
  `8a284d039387f63690225b9c86c738696af52358`. All 51 labeled source files were
  verified byte-for-byte against that commit before and after execution.
- Gold: the existing `idempotent-delete.ts` verdicts, **9 real and 42 false**.
  These are historical flag-selected cases, not a random repository sample.
- Rule: the currently shipped `alchemy/providers/idempotent-delete`; its
  description matches the historical scoped wording. No rule changes or relabeling.
- Model: pinned `jev-1.13.0`, also returned by every successful request.
- Flag policy: probability **strictly greater than 0.8**, with shipped matchers.
- Code comments excluded; compiler documentation retained subject to the current
  `maxSymbolLength: 256` and `maxSymbolDocumentationLength: 256` settings.
- Arms: code-only; symbols; symbols plus flattened declaration references.
  Context arms use the current built-in filtering and descriptive `__comment`s.
- Production `planAudit`, `executeAudit`, `JevLive`, splitting, rate limiting,
  retries, and reference fallback; isolated in-memory caches. Mechanical-linter
  sampling disabled by shipped preset membership, not fabricated answers.
- Native context prepared once per file, in scoped compiler groups of at most
  eight, then replayed from hashed snapshots across arms. No Alchemy source or
  cache writes. Its dirty package/lock environment is recorded in the manifest.
- One run per arm; no paid repeats. A global **$1** pre-attempt budget was enforced.

Judge/matcher question bytes were checked identical across arms. Locate
sufficiency questions correctly name each arm's available context; those
production differences are recorded rather than rewritten.

## Results

All **51 files were answered in every arm**. There were no skipped, blocked,
missing, failed, or reference-fallback cases.

| Arm                  | Known positives caught | False positives / 42 | Precision |   AUC | Requests | Input tokens | Input cost | Request execution |
| -------------------- | ---------------------: | -------------------: | --------: | ----: | -------: | -----------: | ---------: | ----------------: |
| Code-only            |                    9/9 |                   30 |     23.1% | 0.444 |       90 |      726,561 |  $0.030516 |           12.12 s |
| Symbols              |                    9/9 |                   30 |     23.1% | 0.407 |       90 |    1,113,095 |  $0.046750 |           14.01 s |
| Symbols + references |                    8/9 |                   30 |     21.1% | 0.418 |       89 |    1,712,179 |  $0.071912 |           17.47 s |

Total: **269 actual requests**, **3,551,835 reported input tokens**, **$0.149177**
at $0.042 per million, below the approved $1 cap. Every paid attempt had reported
usage. Shared native preparation took **10.18 s**; the paid execution and reporting
phase took **44.65 s**. The execution times above exclude native preparation.

Request latency, median / p95: code-only **108 / 193 ms**; symbols **131 / 220 ms**;
symbols plus references **168 / 276 ms**.

## Threshold changes and useful cases

| File suffix                             | Gold  | Code-only | Symbols | Symbols + references | Effect at >0.8                                                |
| --------------------------------------- | ----- | --------: | ------: | -------------------: | ------------------------------------------------------------- |
| `AWS/EntityResolution/SchemaMapping.ts` | real  |      0.83 |    0.82 |                 0.80 | References arm loses one borderline positive                  |
| `AWS/MediaPackageV2/OriginEndpoint.ts`  | false |      0.69 |    0.82 |                 0.87 | Context introduces a false flag                               |
| `AWS/StepFunctions/StateMachine.ts`     | false |      0.84 |    0.80 |                 0.79 | Context removes a false flag                                  |
| `ACME/Certificate.ts`                   | false |      0.80 |    0.75 |                 0.58 | More confidently negative, but baseline was already unflagged |

The false-positive counts match, but the identity of one false flag changes.
For ACME, the cross-file client handles `AcmeAlreadyRevoked`; the probability
movement is consistent with useful helper visibility, but this run alone does
not establish which context datum caused it.

The positive lost by the references arm moved only 0.03 from baseline, within
historically observed Jev run-to-run variation. Without repeats, this is not
proof of a meaningful accuracy regression. The AUC and threshold metrics do
not demonstrate an accuracy gain either.

## Interpretation

**No accuracy benefit was demonstrated on this labeled rule.** Symbols increased
input by about 53%; symbols plus references used about 2.36 times baseline input.
Both context arms were slower in request execution, before adding preparation.

The dominant problem remains that code alone does not establish a remote API's
behavior when a resource is already absent. Existing AWS observations supply the
gold; compiler types and repo declarations are not replacements for those facts.
Some pinned comments conflict with the API-tested gold. Compiler documentation
can retain comments even though ordinary code/reference comments are removed.
The FlowLog label also retains the historical study's uncertainty about an
operation error versus returned `Unsuccessful` data; no new AWS calls were made.

This is not a population precision/recall estimate, a whole-repository coverage
benchmark, or an isolation of flattening/descriptions from all other context
changes. The 51-case sample fits without fallback under the current 256-character
metadata settings, so **this run does not exercise or validate overflow recovery**.
It also does not measure localization correctness against independent line gold.
Of 4,178 saved symbol strings, 1,544 reach the 256 UTF-16-unit boundary: these
results are about capped metadata, not unrestricted compiler context. There are
no repeated arms; run-to-run model variation and the fixed arm order are not
controlled by repetitions.

Do not justify enabling native context by default on the strength of this
result. It remains potentially useful for rules depending on project helpers,
types, and services, but that requires a separate controlled evaluation. No
configuration or shipped rule was changed based on these results.

## Reproduction and evidence

Runner: `alchemy-context.ts`.

Executed after a non-paid dry plan:

```sh
bun eval/studies/alchemy-context.ts --run eval/studies/alchemy-context-2026-10-11-dry-plan-02/manifest.json
```

That plan is intentionally one-shot after paid execution; do not reuse it or reset
its budget marker. For a new run, create a fresh plan and obtain spending approval.

Evidence under `alchemy-context-2026-10-11-dry-plan-02/`:

- `manifest.json` and `inputs.json`: source/gold/rule/environment/implementation
  digests and the preparation policy.
- `context-*.json`: hashed native context snapshots.
- `paid/attempt-*.json`: exact request bodies, responses, usage, timings, and outcomes;
  API credentials and request options are not serialized.
- `paid/results.json`: incremental attempts and per-file outcomes.
- `paid/summary.json`: full metrics and paired per-file probability changes.

Historical semantic-pilot evidence was not overwritten by this study.
