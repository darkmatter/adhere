# Sections instead of numbered lines

**Question.** lint sent a file as numbered lines, and located a finding with
a choice among up to 255 of them, a longer file first choosing a 20-line
block in a request of its own. Would a few sections of whole statements do
as well: judging with less unrelated detail around each rule, and locating
among about ten options instead of hundreds?

**Setup.** jev-1.13.0, 2026-09-28, on the 384 labeled findings in
[`presets-labels.json`](presets-labels.json). A section is `sectionsOf`'s:
whole statements packed in order into runs of at most 30 lines, a longer
statement split into the statements of its largest group, a decorator with
what it decorates. A 300-line file is about 12 sections; the labeled files'
median is 6. Judging is scored by AUC, how often a real finding outscores a
false one (0.5 is chance); between identical runs it moved by about 0.015.
Locating is scored on the 180 real findings in files of more than one
section: whether the chosen section holds the violation, by lint's own line
where the two agreed and by hand where they did not.

```sh
bun eval/studies/sections.ts results.json numbered marked keyed array
```

## Results

Judging, run by run, each against the numbered file in the same run:

| layout                                                        | AUC   | numbered, same run |
| ------------------------------------------------------------- | ----- | ------------------ |
| sections as `s1`, `s2` keys, one request                      | 0.642 | 0.677              |
| one question per section, the highest score, one request      | 0.657 | 0.677              |
| each section alone in a request of its own, the highest score | 0.636 | 0.678              |
| the whole file, each section's first line marked `[3]`        | 0.668 | 0.662              |
| marked                                                        | 0.665 | 0.668              |
| keyed, `{ "1": "…", "2": "…" }`                               | 0.652 | 0.668              |
| array, `["…", "…"]`                                           | 0.666 | 0.668              |

Each section alone lost what spans sections: a `"use server"` directive at
the top of the file, a type and the copy of it further down, and it gave a
40-section file 40 chances at a high score. In the first two runs, the
numbered file led or tied at every file size, the largest files included.

Locating:

| how                                       | holds the violation |
| ----------------------------------------- | ------------------- |
| choice among lines (lint before sections) | 92% (166 of 180)    |
| marked, choice among section numbers      | 92% (166)           |
| keyed, options the section's first line   | 93% (167)           |
| keyed, options what the section declares  | 94% (169)           |
| keyed, options with no text (`null`)      | 93% (167)           |
| array, choice among indexes               | 69% (125)           |

The array's misses were off by one, mostly upward: its choice was one past
the right section 37 times and one before it 7.

## What we learned

- **Layout does not move the judgment.** However the file came, the judge
  question separated real from false at 0.64 to 0.68, the numbered file no
  better than the best sections within the noise. Where findings go wrong is in the questions and
  the rules ([presets](presets.md)), not in unrelated detail around them.
- **Sections locate as well as lines**, from about ten options instead of up
  to 255, in one request for any file, with 15% fewer tokens of state.
- **Keys beat indexes.** Jev counts an array from one about as often as from
  zero.
- **The options need no text.** A keyed section is named by its key in the
  state; describing it again adds nothing.

## Decided

Keyed, over the marked file that judged a little closer to the numbered one,
since keys need nothing written into the code and cannot collide with it.
The judge and locate requests carry the file as keyed sections, the locate
question chooses a key with `null` options, and a finding is its section.
