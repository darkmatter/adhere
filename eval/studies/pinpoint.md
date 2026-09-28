# Lines within a section

**Question.** With a finding placed in a section of about 30 lines, can Jev
name the lines that break the rule, for a report to underline?

**Setup.** jev-1.13.0, 2026-09-28. For each of the 180 real findings in files
of more than one section, agents marked by hand the smallest statements or
blocks that break the rule, the clearest first, in
[`violations.json`](violations.json): a median of 4 lines (2 to 11 for the
middle half). Each arm is given the section that holds the clearest
violation, so it measures only finding the lines inside it.

- **section**: the whole section, as lint shows it.
- **tenths**: two ten-level Scores, in which tenth of the section's text the
  violation starts and ends, read as the most likely level and as the
  expected position.
- **choice**: two choices among the section's lines, keyed by line, the one
  the violation starts on and the one it ends on.
- **lines**: a noul per non-blank line, whether it is part of the code that
  breaks the rule; the lines from the first above 0.5 to the last.
- **halving**, for the start line only: a choice between the first and
  second half of the lines left, asked again of the chosen half, about five
  requests in turn; beside the choice of the start line in the same run.

```sh
bun eval/studies/pinpoint.ts results.json
bun eval/studies/pinpoint.ts results.json halving
bun eval/studies/pinpoint.ts results.json inline
```

A third run, `inline`, measures the lines end to end, in the one request
lint sends to locate a finding, its state the file's keyed sections: the
choice of a section, beside a choice of the start line and one of the end
line, each option the line's text, either for every section, among its
lines, keeping the pair of the section chosen, or once among the whole
file's, where its lines fit Jev's context beside the file. Jev chooses the
section too, so a wrong section counts against it.

## Results

| arm                   | holds a violation | lines shown, median | of them violating | of the violation shown |
| --------------------- | ----------------- | ------------------- | ----------------- | ---------------------- |
| section               | 100%              | 27                  | 30%               | 94%                    |
| tenths, most likely   | 64%               | 3                   | 41%               | 37%                    |
| tenths, expected      | 73%               | 5                   | 49%               | 43%                    |
| choice, start and end | 98%               | 1                   | 97%               | 62%                    |
| lines                 | 99%               | 6                   | 77%               | 82%                    |
| choice, start line    | 98%               | 1                   | 98%               | 37%                    |
| halving, start line   | 97%               | 1                   | 97%               | 37%                    |

The choice named one line as both start and end for 100 of 180 findings.

End to end, `inline`, on the 174 findings of rules the presets still have
and files Jev could take:

| arm                                                     | findings | holds a violation | lines shown, median | of them violating | of the violation shown |
| ------------------------------------------------------- | -------- | ----------------- | ------------------- | ----------------- | ---------------------- |
| section chosen                                          | 174      | 95%               | 27                  | 31%               | 84%                    |
| start and end, per section                              | 174      | 94%               | 1                   | 92%               | 51%                    |
| start and end, per section, where the section was right | 166      | 98%               | 1                   | 96%               | 53%                    |
| start and end, whole file                               | 138      | 93%               | 2                   | 87%               | 63%                    |

Every finding took one request. The per-section pair named one line in 113
of 174.

## What we learned

- **A position as a number does not work.** Tenths missed the violation a
  third of the time. TypeSafe's notes on Jev 1.13 say its score levels are
  weak as numbers.
- **A choice points; nouls per line span.** The start line is right 98% of
  the time. The lines Jev says yes to hold a violation 99% of the time and
  cover most of it in about 6 lines.
- **Halving adds requests and nothing else.** Five choices of two, one after
  another, did as well as one choice among all the lines.

- **Start and end fit in the locate request.** Asked for every section and
  kept for the one chosen, they did as well as on their own, with no request
  more; over the whole file, a long file's lines do not fit beside it.

## Decided

The locate request asks, for every section, the line the violation starts on
and the one it ends on, and the report underlines the chosen section's. The
lines arm, which spans more of the violation, would take one more request per
file with a finding.
