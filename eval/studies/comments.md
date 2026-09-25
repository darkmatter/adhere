# Comments

**Question.** A comment can claim what the code does not. On alchemy, two
AutoScaling deletes say "a missing action returns success", AWS refuses a
missing one, and adhere's idempotent-delete rule flagged neither. Would Jev
judge better with every comment taken out of the file?

**Setup.** jev-1.13.0, 2026-09-25, on the Effect preset. Both arms ask
adhere's question as it sends it; the second takes every comment out of the
file first, with `withoutComments` in `src/comments.ts`, which removes each
comment's text and keeps its line breaks, so every line keeps its number and
a finding's line is the same in both arms.

```sh
bun eval/studies/comments.ts results.json
```

## Results

| arm              | hard AUC | caught / wrong at 0.7 | at 0.8 | at 0.9 | off-target above 0.8 | tokens |
| ---------------- | -------- | --------------------- | ------ | ------ | -------------------- | ------ |
| with comments    | 0.989    | 27 / 2                | 21 / 0 | 16 / 0 | 4 of 828             | 1.00   |
| without comments | 0.989    | 28 / 2                | 22 / 0 | 17 / 0 | 8 of 828             | 0.98   |

## What we learned

- **The ranking did not move.** Hard AUC is the same, and one more violation
  caught at each threshold is within the noise between two identical runs.
- **Without comments, Jev flagged more of what it was not asked about.**
  Pairs of a planted file and another rule's question above 0.8 doubled, from
  4 to 8, none of them labeled.
- **A comment can carry an exemption.** `testing/test-clock-for-time` exempts
  a test that needs real time, and the planted file that says so in a comment
  rose from 0.20 to 0.54 without it.
- **It saves little.** adhere's source is lightly commented; the requests
  carried 2% fewer tokens.
- **Where a comment answers the rule's question, it matters more.** On
  alchemy's idempotent-delete rule, eight of nine real violations carried a
  comment wrongly saying they were fine, and Jev believed it. Without comments
  it flagged all nine, at the same share of flags real; see
  [idempotent deletes on alchemy](idempotent-delete.md).
