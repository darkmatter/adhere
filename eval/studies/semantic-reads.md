# Native semantic reads: cross-file accuracy pilot

## Question

Does native TypeScript context help Jev judge rules whose decisive facts live
in a helper or caller, and does full related source introduce false findings
from code outside the file being judged?

Run on 2026-10-05, pinned to `jev-1.13.0`, using the shipped rules and the
production `SourceReads` provider. This is a controlled capability pilot,
**not a population accuracy estimate or a real-repository benchmark**.

## Design

Twelve complete TypeScript projects, in four families:

| Family     | Rule                                           | Decisive evidence                                                           |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| timeout    | `typescript/async/network-calls-have-timeouts` | An imported helper supplies an abort timeout, or empty request options.     |
| validation | `typescript/types/validate-external-data`      | An imported type guard checks each field, or returns true without checking. |
| logging    | `security/no-secrets-in-output`                | The sole caller passes a public request ID, or an Authorization credential. |
| comparison | `security/constant-time-secret-compare`        | The sole caller supplies public routing codes, or a received API key.       |

Each family has a compliant case, a violating case, and a compliant
contamination control with a separate violation elsewhere in the related file.
Only the helper/caller source changes: the target file, question bytes,
symbol metadata, and target reference counts remain identical within a family.

Gold was fixed before execution and independently reviewed: four positives and
eight negatives. Labels are about `subject.ts`, not the entire project. No
labels, notes, or variant names are sent as model state. The fixtures are in
[`semantic-reads-cases.ts`](semantic-reads-cases.ts).

Six arms: code only, code only again, symbols, references, both, and both again.
The repeated arms measure observed model variation; they are not additional
independent cases. Each case asks only its own rule, retaining the shipped
examples, criteria, and scope matchers. A flag requires **p > 0.8**, every
`appliesTo` answer > 0.5, and every `excludeIf` answer <= 0.5.

Preflight verified that every decisive neighbor file was retrieved completely
and unchanged, no context contained unresolved references, every request fit,
and question bytes were identical across arms. These fixtures test directly
reachable definitions and callers, not transitive graph expansion, library
source, location accuracy, or sufficiency calibration.

## Results

All 72 requests completed; all 12 cases have every required judgment/matcher
answer in every arm.

| Arm               | Correct       | True positives | False positives | False negatives | Raw AUC | Input tokens |
| ----------------- | ------------- | -------------- | --------------- | --------------- | ------- | ------------ |
| code only         | 7/12 (58.3%)  | 1              | 2               | 3               | 0.500   | 12,861       |
| code only, repeat | 7/12 (58.3%)  | 1              | 2               | 3               | 0.453   | 12,861       |
| symbols           | 7/12 (58.3%)  | 1              | 2               | 3               | 0.563   | 14,490       |
| references        | 10/12 (83.3%) | 2              | 0               | 2               | 0.969   | 17,133       |
| both              | 10/12 (83.3%) | 2              | 0               | 2               | 0.875   | 18,762       |
| both, repeat      | 10/12 (83.3%) | 2              | 0               | 2               | 0.875   | 18,762       |

AUC is pooled raw probability ranking across four different rules. **0.969 is
not 96.9% accuracy.** The class distribution is unbalanced: always reporting
nothing would get 8/12 correct. References improve balanced accuracy from 50%
to 75%, but recall is still only 2/4.

### What changed

- **Timeouts:** code-only flagged all three cases, including both compliant
  cases. References separated the bounded requests (0.05 and 0.09) from the
  unbounded request (0.95), removing two false positives.
- **Secret comparison:** the true violation rose from 0.23 to 0.89 with
  references and became a correct flag. Both public-value cases remained
  below threshold.
- **Secret logging:** references raised the credential leak from 0.08 to
  0.77, but it remained below the 0.8 threshold. Both reads scored it 0.55
  and 0.57, also misses.
- **Validation:** the always-true predicate was missed in every arm. It is
  genuinely a runtime-validation failure even though TypeScript trusts its
  type-predicate signature. References scored it 0.36; both scored it 0.17
  and 0.15. A model-predicted scope rejection is not a gold out-of-scope label.

Thus references made three correct decision changes: two false positives
removed and one additional true positive found. No correct baseline decision
regressed at the fixed operating threshold.

Symbols alone added no decision benefit. This pilot intentionally holds
symbol metadata constant across each paired family, so it cannot establish
whether symbol counts help other rule types. Compared with references alone,
both reads used 9.5% more tokens, had the same decisions, and worse raw ranking.
References were not repeated separately, so do not interpret that ranking
change as a general causal harm from symbols.

### Noise and contamination controls

Code-only repeats had mean absolute probability change 0.019; combined repeats
had 0.011. Neither repeat changed any flag. Reference-driven timeout and
comparison shifts were substantially larger than this observed variability.

None of the four contamination controls was flagged by a reference-enabled
arm. That is evidence of target-scope discipline **at this threshold**, not
absence of contamination. Control-minus-compliant probability increases
reached 0.14 for references and 0.11 for both. Full-file context can still move
scores toward violations elsewhere even without producing a flag here.

## Cost and artifacts

94,869 billed input tokens across all six arms cost approximately **$0.00398**
(0.40 cents), using the recorded price of $0.042 per million input tokens.
References used 33.2% more tokens than code-only per arm; both used 45.9% more.
These tiny related files do not model large-project overflow or context cost.

- Runner: [`semantic-reads.ts`](semantic-reads.ts)
- Raw responses/usage: [`semantic-reads-results.json`](semantic-reads-results.json)
- Frozen rules, labels, exact source/context and hashes:
  [`semantic-reads-results.json.inputs.json`](semantic-reads-results.json.inputs.json)
- Gold/case digest: `892dd0005d6f057e115d465ed6e6d8799fe93796400d4c560620ce3dfe2c695d`

```sh
# Local preflight: no model requests
bun eval/studies/semantic-reads.ts --plan

# Reprint saved results without paying again; digests guard against changed rules/gold
bun eval/studies/semantic-reads.ts --rescore eval/studies/semantic-reads-results.json

# A new paid run: choose a new result path, do not overwrite the first run
bun eval/studies/semantic-reads.ts eval/studies/semantic-reads-second-results.json
```

## Interpretation and next step

References help when missing helper/caller evidence determines the judgment.
The result supports further evaluation of opt-in references where such evidence
matters, not enabling all reads by default, changing thresholds after seeing
these cases, or claiming an organization-wide accuracy gain. No production
presets or thresholds were changed by this study.

`reads` is now selected at config level and shared by every rule for each
audited file. The runner passes each arm's selected context as a shared
`ReadState`, without attaching reads to the rule. Each case still asks only its
own rule: this pilot measured those single-rule contexts, not all-rule global
accuracy or full-audit batching/cost. The recorded payloads and results remain
unchanged.

Current product defaults in `resolveConfig` enable
`["workspacePackages", "symbols", "references"]` when `reads` is omitted.
Explicit `reads: []` opts out to code-only context; an explicit subset replaces
the default. This product choice is not evidence of a general accuracy
improvement established by the single-rule pilot above.

A broader decision needs freshly reviewed, held-out real-code cases, including
larger related files and genuinely informative symbol metadata. Validation and
secret logging also need diagnosis: having the decisive source available did
not make those violations cross the reporting threshold.
