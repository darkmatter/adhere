# Domain scope

**Question.** On darkmatter/agents, adhere 0.14.0's Effect preset reported
about four false findings for each real one. Most came from rules written for
the types and services modules exchange, firing on code at the edges: shapes
that mirror a provider's payload, a view's props, adapters that wrap an SDK,
and tests of real services. Does scoping those rules to domain code, and
removing two, drop the false findings and keep the real ones?

**Setup.** jev-1.13.0, 2026-10-02. darkmatter/agents at `d1fbcc7243`, read
from `~/.agents/repos/darkmatter/agents`. Each arm asks every rule of the
Effect preset that judges a file, one request per file as a cold `adhere lint`
would, over the 184 files that hold a labeled finding. A finding is reported as
lint reports it: above the rule's own threshold, or 0.8.

```sh
bun eval/studies/domain-scope.ts results.json
```

**Labels.** [`domain-scope-labels.json`](domain-scope-labels.json): the 181
findings adhere 0.13.1 reported on the 394 files its cache held, each labeled
by an agent that opened the file and its callers; 15 more findings the repo's
own agent verified false while fixing them, in DARK-191 to DARK-196; and two
findings the arms reported here that had no label. In all, 26 real, 123 false,
and 49 debatable, which count on neither side.

## Arms

- **0.14.0**: the preset as `v0.14.0` shipped it, asked twice to show the
  noise.
- **domain scope**: the preset as it is now, asked twice. Against 0.14.0:
  - `data/brand-meaningful-primitives`, `data/variants-are-tagged-unions`:
    judge domain types, the ones services exchange, return, or store. A shape
    that mirrors a payload until it is mapped, a view's props or state, and a
    union used inside one module are out of scope. Each says what stays in
    scope: a reference the code's own modules pass around, in a file that also
    mirrors a payload, and a union a service returns, in a file that declares
    nothing else. The brand rule no longer names a count.
  - `services/dependencies-through-layers`: a function that takes other
    services' implementations and returns a service's, for its callers to wire
    by hand. Its own Layer calling it, a decorator, and an adapter wrapping a
    library's client are out of scope.
  - `config/tests-provide-values-directly`: a test of code that consumes
    configuration. A test of how configuration is read, planted leak values,
    and a deployed Worker's bindings are out of scope.
  - `services/no-mutable-state`: the interface a Context.Service exposes,
    including a mutable Map behind a readonly property. State behind its
    operations, a fixture's controls beside it, and a plain interface no
    Context.Service declares are not that interface.
  - `services/test-layers-are-in-memory` and
    `services/operations-have-no-requirements` are gone.

## Results

| arm                 | AUC   | real / false at 0.7 | at 0.8         | at 0.9       | as lint reports |
| ------------------- | ----- | ------------------- | -------------- | ------------ | --------------- |
| 0.14.0              | 0.621 | 26 / 121 (18%)      | 24 / 104 (19%) | 9 / 22 (29%) | 24 / 104 (19%)  |
| 0.14.0, again       | 0.616 | 26 / 120 (18%)      | 23 / 111 (17%) | 7 / 21 (25%) | 23 / 111 (17%)  |
| domain scope        | 0.885 | 25 / 39 (39%)       | 19 / 19 (50%)  | 6 / 1 (86%)  | 19 / 19 (50%)   |
| domain scope, again | 0.881 | 25 / 41 (38%)       | 19 / 19 (50%)  | 6 / 1 (86%)  | 19 / 19 (50%)   |

Two earlier runs of 0.14.0 ranked its findings at an AUC of 0.65 and 0.68,
with 24 to 26 real and 107 to 108 false.

Per rule, real / false / debatable as lint reports them, in the first run of
each:

| rule                                       | 0.14.0       | domain scope |
| ------------------------------------------ | ------------ | ------------ |
| `data/brand-meaningful-primitives`         | 15 / 51 / 21 | 13 / 14 / 10 |
| `services/dependencies-through-layers`     | 1 / 29 / 7   | 1 / 2 / 1    |
| `data/variants-are-tagged-unions`          | 3 / 6 / 14   | 3 / 2 / 1    |
| `config/tests-provide-values-directly`     | 3 / 7 / 0    | 0 / 0 / 0    |
| `services/test-layers-are-in-memory`       | 0 / 5 / 0    | gone         |
| `services/operations-have-no-requirements` | 0 / 2 / 0    | gone         |
| `services/no-mutable-state`                | 0 / 2 / 0    | 0 / 0 / 0    |
| the other three labeled rules              | 2 / 2 / 2    | 2 / 1 / 2    |

Real findings either domain-scope run lost: all three of the config rule's, at
0.71 to 0.73; two brand findings, a sandbox job's id and Slack's thread
reference, at 0.74 to 0.79; and a JSON value union of Linear's, at 0.58 to
0.63. False findings either kept are mostly Linear's and Braintrust's wire
schemas and chat's view models under the data rules, two helpers under the
dependency rule, and one finding each under the gen and instrument rules.

On the standing eval, `judge.ts`, the rules separated every planted file, and
no compliant file scored above 0.8. Of the planted violations, a test that
gives the service's layer a ConfigProvider fell from 0.84 to 0.70.

## While writing them

The arms' rules were chosen against these labels, with each candidate asked of
its own rule's labeled files and planted files alone:

- **Scope lowered the config rule's scores, not its ranking.** With its scope
  paragraph, the rule's AUC on its 12 labeled files and 5 planted ones was
  0.939, but its three real findings scored 0.71 to 0.77, below 0.8. Every
  wording that lifted them above 0.8 lifted false ones with them, to an AUC of
  0.67 to 0.89. A threshold of 0.7 for the rule caught them, with one false
  finding, but they sat within noise of it. The rule keeps 0.8: fewer false
  findings, at the cost of these real ones.
- **A note did not move a plain interface out of a service rule.** The
  mutable-state rule flagged a pool's private registry and a socket's state,
  both plain interfaces that no Context.Service declares. On agents' main,
  `@adhere` notes saying who reads them left both at 0.83, still reported;
  saying the rule judges a Context.Service's interface dropped both, and its
  planted violations still scored 0.85 and 0.94.
- **An exemption for payloads excused the domain types beside them.** The
  brand rule's first scope excused shapes that mirror a payload, and with them
  the thread references in files of payload types, at 0.46 to 0.66. A sentence
  saying such a reference is still a domain type raised the rule's AUC on its
  labels from 0.805 to 0.900, with 13 real and 14 false at 0.8 where there had
  been 12 and 17. Its examples, a thread, an issue, a delivery, come from these
  labels; a repo they were not written from would test them.

## What we learned

- **Scoping the data and service rules to domain code removed more than four
  false findings in five.** As lint reports, false findings fell from 104–111
  to 19, and real ones from 23–24 to 19. Precision went from 17–19% to 50%,
  and the ranking from an AUC of 0.62 to 0.88.
- **The rules a team calls noisy were too broad, not misread.** Of 0.14.0's
  false findings, most were code the rule's words reached but its purpose did
  not: payload mirrors, view props, SDK adapters, tests of real services.
  Their scores ran as high as the real findings', so no threshold could drop
  them; saying what the rule is about did.
- **An exemption needs the sentence that bounds it.** The payload exemption
  excused domain references until a sentence named them, as the details study
  found for a matcher's words in prose.
- **Two rules went.** `test-layers-are-in-memory` had no real finding among
  those labeled on the eval or on agents: every one was a test of a real
  service, which a test of the real persistence path should be.
  `operations-have-no-requirements` is what `@effect/tsgo`'s
  `leakingRequirements` checks exactly.

These are one repo's findings, labeled by agents, with the wording tuned on
them. What scoping does to rules not tried here, and to a repo the wording was
not written from, is untested.
