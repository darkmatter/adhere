# The typescript, react, and security presets on four repos

**Question.** How often is a finding from the new presets a real violation,
which rules miss, and do the misses follow patterns a rule's wording can fix,
or are they a mixed bag?

**Setup.** jev-1.13.0, 2026-09-27 and 28. `adhere lint --preset
typescript,react,security --threshold 0.6` on four repos, checked out at:

| repo                                                                 | commit    | files read |
| -------------------------------------------------------------------- | --------- | ---------- |
| [dubinc/dub](https://github.com/dubinc/dub)                          | `d85e883` | 4,435      |
| [immich-app/immich](https://github.com/immich-app/immich), `server/` | `6b978d0` | 671        |
| [honojs/hono](https://github.com/honojs/hono)                        | `52f6c7e` | 384        |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)    | `84e3f5a` | 601        |

Findings were sampled per repo and rule, up to 6 above 0.8 and 3 below (7
and 4 on dub), and labeled by agents that read the rule and the code around
each finding: `real`, `false`, or `debatable`, with a cause for each miss
(`out-of-scope`, `misread`, `rule-too-broad`, `context`) and a note. The 384
labels are in [`presets-labels.json`](presets-labels.json). immich, hono, and
excalidraw were labeled against the rules as first committed (`rules:
"first"`); dub, held out, against the rules after a first round of tuning
(`rules: "tuned"`).

Here **precision** is, of the findings reported, the share labeled real;
debatable ones count on neither side. Real repos cannot show **recall**, the
share of real violations reported, since no one knows them all.

## Results

Precision by probability band, among the labeled findings in each:

| band    | immich, hono, excalidraw (first rules) | dub (tuned, held out) |
| ------- | -------------------------------------- | --------------------- |
| 0.6–0.7 | 41% (21 real, 30 false)                | 36% (16, 28)          |
| 0.7–0.8 | 47% (22, 25)                           | 42% (14, 19)          |
| 0.8–0.9 | 54% (34, 29)                           | 73% (53, 20)          |
| 0.9–1.0 | 67% (12, 6)                            | 81% (22, 5)           |

On the first three repos, the misses split into those that repeat within a
rule, which a rule's wording can target, and one-off misreads, such as a
handled error Jev missed or a line with nothing on it:

| band    | real | repeating misses | one-off misses | precision | without the repeating ones |
| ------- | ---- | ---------------- | -------------- | --------- | -------------------------- |
| 0.6–0.7 | 21   | 21               | 9              | 41%       | 70%                        |
| 0.7–0.8 | 22   | 19               | 6              | 47%       | 79%                        |
| 0.8+    | 46   | 31               | 4              | 57%       | 92%                        |

Per rule, above 0.8, with each rule's current text, all four repos:

| rule                                                  | real | false | debatable | precision |
| ----------------------------------------------------- | ---- | ----- | --------- | --------- |
| typescript/types/unrepresentable-invalid-states       | 5    | 0     | 0         | 100%      |
| react/effects/notify-parents-in-handlers              | 4    | 0     | 0         | 100%      |
| react/effects/clean-up-what-they-start                | 5    | 0     | 0         | 100%      |
| security/constant-time-secret-compare                 | 7    | 0     | 0         | 100%      |
| typescript/types/derive-dont-restate                  | 6    | 0     | 0         | 100%      |
| typescript/testing/assert-outcomes                    | 6    | 0     | 1         | 100%      |
| typescript/design/no-argument-mutation                | 4    | 0     | 0         | 100%      |
| typescript/errors/release-on-every-path               | 2    | 0     | 0         | 100%      |
| typescript/types/validate-external-data               | 12   | 2     | 0         | 86%       |
| react/effects/fetches-ignore-stale-responses          | 6    | 1     | 0         | 86%       |
| react/state/no-props-copied-into-state                | 5    | 1     | 1         | 83%       |
| typescript/errors/no-swallowed-errors                 | 12   | 3     | 6         | 80%       |
| react/effects/external-stores-use-sync-external-store | 3    | 1     | 0         | 75%       |
| react/server/server-functions-authorize-and-validate  | 3    | 1     | 2         | 75%       |
| typescript/testing/independent-tests                  | 3    | 1     | 0         | 75%       |
| typescript/types/assertions-only-when-proven          | 8    | 3     | 1         | 73%       |
| typescript/async/concurrent-independent-work          | 7    | 3     | 0         | 70%       |
| react/state/store-ids-not-copies                      | 5    | 3     | 0         | 62%       |
| react/server/no-private-data-to-client                | 2    | 2     | 0         | 50%       |
| security/parameterized-queries                        | 1    | 1     | 0         | 50%       |
| typescript/async/network-calls-have-timeouts          | 6    | 7     | 0         | 46%       |
| typescript/design/no-import-time-effects              | 1    | 4     | 0         | 20%       |
| typescript/testing/no-real-waits                      | 1    | 7     | 1         | 12%       |
| security/no-secrets-in-output                         | 0    | 2     | 0         | 0%        |
| all                                                   | 114  | 42    | 12        | 73%       |

The rules at 100% have 2 to 7 labels each: no misses seen, not proof of none.

### Tuning with matchers

After the first three repos, nine rules gained `excludeIf` matchers for the
patterns they missed, such as a migration's statements on one connection, a
request handled in the same process, or a secret handed once to its owner.
Re-run on the same three repos, above 0.8:

| rules              | real, before → after | false, before → after |
| ------------------ | -------------------- | --------------------- |
| the nine tuned     | 13 → 6               | 30 → 12               |
| the eighteen other | 33 → 33              | 5 → 5                 |

Of the tuned rules' labeled findings above 0.7, the matchers dropped 8 of 19
real ones and 22 of 47 false ones. They scored 0.51 to 0.69 on the real ones
and 0.51 to 0.76 on the false ones.

## What we learned

- **Above 0.8, the misses are mostly a rule's, not Jev's.** 31 of 35 repeat
  within a rule: a scope the rule's words reach past, or the same misreading
  again. Below 0.8 one-off misreads grow, to about one finding in six at
  0.6–0.7: there the report turns into a mixed bag.
- **The held-out repo agreed.** dub, labeled against the tuned rules and none
  of whose findings the tuning saw, came out at 75% above 0.8.
- **The weak rules fail on what a file does not show**: whether a client has
  a default timeout, whether a script is an entry point, whether a key is
  public, whether a test waits on a database's clock.
- **Matchers do not separate.** Jev scores a scope question near 0.5 for real
  and false findings alike, so an `excludeIf` thins a rule's findings about
  as much as a higher threshold, rather than removing the pattern it names.
  Narrowing the description does move the judgment itself.

## Decided

- The default threshold stays 0.8.
- `typescript/testing/no-real-waits` and `typescript/design/no-import-time-effects`
  are gone; `typescript/async/network-calls-have-timeouts` and
  `react/state/store-ids-not-copies` report warnings.
- The tuning's matchers came out again; two description narrowings stayed, in
  `security/parameterized-queries` and `react/effects/fetches-ignore-stale-responses`.
- What the file cannot show became a question of its own, reported as a
  warning rather than a filter: see [sufficiency](sufficiency.md).
