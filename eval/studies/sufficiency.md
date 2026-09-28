# Whether the file shows enough to decide

**Question.** The [preset study](presets.md) found the weakest rules missing
on what a file does not show. Asked beside the judge question, does "Does
`code` contain sufficient information to make `judgment`?" tell a real
finding from a false one, and is it better used as a filter or as a warning?

**Setup.** jev-1.13.0, 2026-09-28, on the 384 labeled findings in
[`presets-labels.json`](presets-labels.json), one request per file, its state
the numbered file as lint sent it then. Each finding's rule gets three
questions: adhere's judge question, and the sufficiency question in two
wordings, `judgment` holding the judge question:

- **bare**: `` Does `code` contain sufficient information to make `judgment`? ``
- **criteria**: the same, with criteria:
  - true: `` Everything `judgment` turns on is in `code` ``
  - false: `` `judgment` turns on something `code` does not show, such as what another file, a library, a service, or the program's configuration does ``

```sh
bun eval/studies/sufficiency.ts results.json
```

A second run added a third wording that states the condition itself, with
the rule's fields and no `judgment`:

- **direct**: `` Can you tell whether `code` breaks `rule` from `code` alone, without knowing what other files, libraries, services, or configuration do? ``, with criteria:
  - true: `` `code` shows everything needed to tell whether it breaks `rule` ``
  - false: ``Whether `code` breaks `rule` depends on something `code` does not show, such as another file, a library, a service, or configuration``

## Results

How often a real finding outscores a false one, over the 356 not labeled
debatable (AUC; 0.5 is chance):

| score                       | AUC   |
| --------------------------- | ----- |
| judge                       | 0.680 |
| bare                        | 0.654 |
| criteria                    | 0.690 |
| judge × criteria            | 0.707 |
| lower of judge and criteria | 0.710 |

As a filter, at the same number kept, it does no better than a higher judge
threshold: the top 92 by judge alone hold 70 real and 22 false; by the lower
of the two, 73 and 19.

As a warning on the 166 findings above 0.8, warning below each cutoff. A
warning is right when its finding is false: **precision** is the share of
warned findings that are false, and **recall** the share of the 49 false
findings warned.

| warn below | warned | precision | recall   | real among the rest |
| ---------- | ------ | --------- | -------- | ------------------- |
| 0.5        | 7      | 43%       | 6% (3)   | 71%                 |
| 0.6        | 14     | 57%       | 16% (8)  | 73%                 |
| 0.7        | 31     | 48%       | 31% (15) | 75%                 |
| 0.75       | 51     | 47%       | 49% (24) | 78%                 |
| 0.8        | 74     | 41%       | 61% (30) | 79%                 |
| 0.85       | 102    | 37%       | 78% (38) | 83%                 |
| 0.9        | 136    | 32%       | 90% (44) | 83%                 |

By the labels' causes, the criteria wording's mean: real 0.77, false
findings that turn on another file (`context`) 0.47, misreads 0.67, out of
scope 0.71. It helps most where the misses are about what the file lacks:
on `typescript/async/network-calls-have-timeouts`, real 0.76 and false 0.59.

### The direct wording

The second run, over the file as keyed sections as lint sends it now, on the
316 labeled findings of rules the presets still have:

| score    | AUC   |
| -------- | ----- |
| judge    | 0.702 |
| bare     | 0.683 |
| criteria | 0.679 |
| direct   | 0.706 |

As a warning on the 130 findings above 0.8, 29 of them false, so that a
warning at random would be right 22% of the time:

| warn below | criteria: warned | precision | recall   | direct: warned | precision | recall   |
| ---------- | ---------------- | --------- | -------- | -------------- | --------- | -------- |
| 0.5        | 6                | 50%       | 10% (3)  | 8              | 50%       | 14% (4)  |
| 0.6        | 10               | 60%       | 21% (6)  | 13             | 62%       | 28% (8)  |
| 0.7        | 21               | 48%       | 34% (10) | 34             | 35%       | 41% (12) |
| 0.75       | 39               | 31%       | 41% (12) | 51             | 33%       | 59% (17) |
| 0.8        | 60               | 30%       | 62% (18) | 66             | 30%       | 69% (20) |

The direct wording's scores run lower: at 0.6 it warns about as often as
the criteria wording at 0.7, and more of its warnings are right. With 29
false findings, two or three either way is noise.

## What we learned

- **It carries its own signal.** It correlates with the judge question at
  only 0.45, and the pair ranks a little better than either.
- **As a filter it buys nothing** a higher threshold does not.
- **As a warning it marks the coin flips.** Below 0.7, one finding in five is
  warned, and those are real about half the time, where the rest are real
  three times in four. Down to 0.5, each warning is about as likely right,
  but it catches far fewer false findings.
- **The criteria help.** Without them it ranked worse than the judge question.
- **Asking the condition directly reads better and does no worse.** A
  question about whether `code` holds enough to answer another question,
  kept in a field, is the indirection Jev's notes warn about; stating what
  would make the file not enough ranked findings a little better, with
  scores that run lower.

## Decided

The locate request asks it beside each flagged rule, and a finding below
`sufficiencyThreshold` gets a warning. It changes neither the finding's level
nor the exit code. First the criteria wording, below 0.7; after the second
run, the direct wording, below 0.6.
