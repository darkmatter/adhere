# Effect false positives on darkmatter/agents

Adhere 0.25.0 reported 28 Effect findings on a reviewed working tree of
`darkmatter/agents`. All 28 were outside the cited rule's scope. In 18 cases,
`dependencies-through-layers` flagged a function that looked like a service
factory. Following its callers showed an owning layer, a fixture, a runnable
program, or an adapter for an external API.

## What was measured

On 2026-11-17 the initial audit reported 57 Effect findings. Review of the
code and its callers classified 30 as actionable and 27 as false positives.
After repairs, none of the 30 actionable file/rule pairs remained. Of the
27 original false positives, 25 were still reported; rejudging changed files
added three other false positives. The 28 cases below are **that post-repair
set**, not 28 independent misses on a fresh sample.

The consumer used Effect 4.1.2 and the released Adhere CLI, with a threshold
of 0.8, `typeAware: false`, and its configured Effect, TypeScript, Alchemy,
React, and project rules. Its working tree included uncommitted repairs on
top of [2c541be498](https://github.com/darkmatter/agents/commit/2c541be498847c1dafc3df256c2d8bab0dab21c9).
Line ranges in the rule pages refer to the run **before the ignore comments**;
the named symbols identify the code if lines move.

## Reviewed cases

- [Dependencies through layers](effect/services/dependencies-through-layers.md): 18. Check who constructs the value and whether it is an application service.
- [Business logic depends on a config service](effect/config/business-logic-depends-on-config-service.md): 3. Distinguish deployment inputs and an injected service named `Config` from raw settings read by a handler.
- [Tests provide config values directly](effect/config/tests-provide-values-directly.md): 2. In both, reading the real binding names is the behavior under test.
- [Test clock for time](effect/testing/test-clock-for-time.md): 2. PostgreSQL owns the timeout or the committed state that the test observes.
- [Instrument with pipe](effect/basics/instrument-with-pipe.md): 1. A poll interval after _every_ result is not a failure retry.
- [Memoize parameterized layers](effect/services/memoize-parameterized-layers.md): 1. Both call sites reference an exported layer value; neither constructs a layer.
- [Wrap external errors](effect/errors/wrap-external-errors.md): 1. A tool converts an already typed service failure to its declared public message.

Each page gives the reported location, probability, context score, evidence,
and a contrasting case that _should_ still trigger the rule. These are
candidate regression cases, not a measurement of recall. The
[earlier domain-scope study](../../studies/domain-scope.md) tested several
of the same distinctions; this field report did not rerun its experiments.

## Suppression check

The consumer added one statement-level `adhere-ignore` per case, naming the
rule and the fact that makes it inapplicable. It added no file-wide ignores
and changed no preset or threshold.

```sh
bun run adhere lint --yes --preset effect --json --stdout
```

`--preset effect` adds to the consumer's configured rules; it does not select
only Effect. With the same 85 rules and cached judgments, the command went
from **28 visible Effect findings and 0 suppressed** to **0 visible and 28
suppressed**. All 176 non-Effect findings remained: the sorted `(file, rule)`
pairs matched exactly, not just their count. Those findings still give the CLI
exit status 1. Both runs checked 4,119 of 4,120 files and skipped the same
oversized Storybook file. No new model judgments were needed.

The after-run used a temporary snapshot of the annotated sources, the original
tracked root and nested rules, and a copy of the cache. A separate
`effect/when-to-use-effect` rule was being authored in the live checkout.
It initially prevented rule loading; once it parsed, the live plan contained
86 rules. That additional rule is not part of the 85-rule comparison.
The replay verifies the scope of the ignores, not an improvement in the
model's ability to classify these cases.
