# Details

**Question.** Since df7b172, the prose around a `RULE.md`'s code reaches Jev
as the rule's details, right after its description. Do details help Jev tell
a real finding from a false one? And which details: why the rule holds, where
it does not apply, or the words of its matchers, which Jev otherwise answers
in questions of their own?

**Setup.** jev-1.13.0, 2026-10-01. The 25 rules of the typescript, react, and
security presets, over the 313 files that hold their labeled findings, read
from the four repos at the commits the [preset study](presets.md) names. Each
arm sends one request per file with every rule that judges it, as a cold
`adhere lint` would: the file's sections without comments, a judge question
per rule, and one per matcher. A finding is reported as lint reports it: above
0.8, with a yes to every `appliesTo` and to no `excludeIf`.

The details are in [`more-details.md`](more-details.md): for each rule, a
paragraph on why it holds, and one on where it does not apply beyond what its
description, examples, and matchers say. An agent wrote them as a rule's
author would, from each rule's file and adhere's skill alone, without the
labels or the repos. The matchers are as the presets were first written,
before any labeling.

**Labels.** The 342 labels of [`presets-labels.json`](presets-labels.json)
whose rules the presets still have, and 40 more: every finding an arm
reported at 0.8 in these files that had no label, labeled by agents that did
not know which arm reported it (`rules: "current"`, its `p` the shipped
rules' score in the first run). In all, 218 real, 134 false, and 30
debatable, which count on neither side. Every finding any arm reports at 0.8
has a label.

```sh
bun eval/studies/details.ts results.json
```

## Arms

- **shipped**: the rules as the presets have them, asked twice to show the
  noise.
- **why**: each rule with its why paragraph as details.
- **scope**: with its paragraph on where it does not apply.
- **why and scope**: both, why first.
- **matchers as details**: the rule without its matchers, each a sentence of
  its details: "It applies only to …" for an `appliesTo`, "It does not apply
  to …" for an `excludeIf`.
- **all as details**: why, then scope, then the matchers' sentences, without
  the matchers.

`typescript/async/network-calls-have-timeouts`'s `rule`, in the last arm:

```text
An HTTP request, such as a `fetch` or a call through an HTTP client, should carry a timeout or an AbortSignal that ends it, and should not wait without limit.

Without a deadline, a request to a server that accepts the connection and then stalls waits as long as the runtime allows, often minutes and sometimes forever. In a server, each stalled call holds a request, a socket, and memory, and enough of them exhaust the process before anything reports an error.

A connection meant to stay open, such as a server-sent event stream, a long poll, or a WebSocket, is expected to wait and is not a request left waiting without limit.

It does not apply to a call through a client configured with a default timeout. It does not apply to a call whose signal the caller passes in. It does not apply to a request from browser code to the app's own API.
```

## Results

The second run, with every arm. AUC is how often a real finding outscores a
false one, a finding the matchers drop scoring 0, as lint drops it.
**Precision** is the share of reported findings that are real.

| arm                 | AUC   | real / false at 0.7 | at 0.8         | at 0.9       | cost  |
| ------------------- | ----- | ------------------- | -------------- | ------------ | ----- |
| shipped             | 0.705 | 171 / 71 (71%)      | 107 / 28 (79%) | 30 / 2 (94%) | $0.20 |
| shipped, again      | 0.698 | 176 / 71 (71%)      | 112 / 34 (77%) | 34 / 3 (92%) | $0.20 |
| why                 | 0.726 | 188 / 80 (70%)      | 140 / 42 (77%) | 48 / 6 (89%) | $0.24 |
| scope               | 0.745 | 147 / 52 (74%)      | 101 / 23 (81%) | 29 / 4 (88%) | $0.24 |
| why and scope       | 0.772 | 173 / 55 (76%)      | 128 / 27 (83%) | 43 / 5 (90%) | $0.28 |
| matchers as details | 0.776 | 157 / 41 (79%)      | 108 / 16 (87%) | 23 / 3 (88%) | $0.12 |
| all as details      | 0.822 | 167 / 37 (82%)      | 112 / 10 (92%) | 37 / 2 (95%) | $0.16 |

Each arm's change in AUC from shipped, with a 95% interval from resampling
the labeled findings, and the change in the first run, which had every arm
but the last:

| arm                 | second run | interval       | first run |
| ------------------- | ---------- | -------------- | --------- |
| shipped, again      | −0.006     | −0.03 to +0.02 | −0.008    |
| why                 | +0.022     | −0.01 to +0.05 | +0.032    |
| scope               | +0.040     | 0.00 to +0.08  | +0.046    |
| why and scope       | +0.068     | +0.02 to +0.11 | +0.063    |
| matchers as details | +0.072     | +0.03 to +0.12 | +0.069    |
| all as details      | +0.118     | +0.07 to +0.17 |           |

At an equal number false, the 28 shipped reports at 0.8, all as details
reports 144 real findings to shipped's 107, above 0.74; matchers as details
138, above 0.75; why and scope 128, above 0.80.

Mean score by label, and for false findings by the cause their label gives:

| findings              | n   | shipped | why  | scope | why and scope | matchers as details | all as details |
| --------------------- | --- | ------- | ---- | ----- | ------------- | ------------------- | -------------- |
| real                  | 218 | 0.79    | 0.82 | 0.77  | 0.80          | 0.77                | 0.78           |
| false, out of scope   | 43  | 0.72    | 0.73 | 0.66  | 0.67          | 0.52                | 0.53           |
| false, rule too broad | 26  | 0.78    | 0.79 | 0.61  | 0.64          | 0.72                | 0.60           |
| false, misread        | 59  | 0.69    | 0.70 | 0.57  | 0.59          | 0.64                | 0.58           |

By repo, AUC:

| arm                 | immich, hono, excalidraw | dub   |
| ------------------- | ------------------------ | ----- |
| shipped             | 0.607                    | 0.765 |
| why and scope       | 0.649                    | 0.844 |
| matchers as details | 0.748                    | 0.789 |
| all as details      | 0.745                    | 0.868 |

**The matchers as questions.** Of the labeled findings above 0.8, shipped's
matchers dropped 3 of 138. Every labeled finding had passed them once, when
lint first reported it, so the labels cannot show all they catch; across all
6,527 pairs of a rule and a file, they dropped 20 of the 164 judgments above
0.8, 17 by `network-calls-have-timeouts`' "a request from browser code to the
app's own API". All as details scored 16 of those 20 below 0.3 by itself.

## What we learned

- **Details help, most of all together.** Why, scope, and the matchers'
  words as one rule's details ranked findings 0.12 better than the rules as
  shipped, more than any change before it on these labels. At 0.8, precision
  went from 79% to 92% with as many real findings, 112 to 107, though not the
  same ones: 17 went and 22 came, and of the 28 false, 22 went and 4 came.
- **Why raises scores; scope lowers them.** Why alone flagged more of
  everything, 33 more real findings at 0.8 and 14 more false, and ranked
  within noise of shipped. Scope alone lowered false findings by 0.11 and
  real ones by 0.03. Together they ranked better than either.
- **A matcher's words do more in the rule than as a question of their own.**
  As questions, the matchers dropped little; as sentences of the rule, the
  same words ranked findings 0.07 better, in requests 40% cheaper without the
  matcher questions.
- **Each kind fixes a different miss.** The scope paragraphs lowered findings
  labeled rule-too-broad and misread the most, the matchers' sentences those
  out of scope. On immich, hono, and excalidraw the matchers' words did most
  of the work, on dub why and scope.
- **An exemption in prose reads broader than the same words as a matcher.**
  As details, "It does not apply to a request from browser code to the app's
  own API" also excused browser code's requests to other hosts: uploads to
  storage URLs, and fonts, images, and libraries fetched from elsewhere, 6 of
  the 7 real findings `network-calls-have-timeouts` lost. Why and scope alone
  lost none, and as a matcher, Jev told those requests apart. An exemption in
  prose should say what it does not cover.
- **Noise.** Two runs of an arm differed by 0.006 to 0.008 in AUC, with 25
  labeled findings crossing 0.8 one way or the other, and every arm's change
  from shipped repeated within 0.01 across the runs.

These are one author's details for three presets, on findings lint once
reported and those the arms reported here. What details do to recall beyond
them, and on the Effect and alchemy presets, is untested.
