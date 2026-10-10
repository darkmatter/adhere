# Decision models beside Jev

**Question.** Three decision models came out in the week before this study:
Cloudflare's clef and clef-flash on Workers AI on 2026-10-01, and OpenAI's
gpt-6-luna on its Decisions API, in public beta, on 2026-10-06. Each answers
typed questions with probabilities, as Jev does. Asked adhere's questions,
how do they judge and locate findings beside Jev?

**Setup.** 2026-10-07: jev-1.13.0, gpt-6-luna, clef, and clef-flash. Every
model gets adhere's questions as adhere asks them, through the provider a
config imports from `@drkmttr/adhere`, each in
[`src/providers/`](../../src/providers/):

- **jev** ([`jev.ts`](../../src/providers/jev.ts)): the request as adhere has
  always sent it, which a test holds byte for byte.
- **gpt-6-luna** ([`openai.ts`](../../src/providers/openai.ts)): each `noul`
  as a `predicate` and each `choice` as a `choice`. A decision question's
  instructions are one string, so they hold the question beside the fields it
  names, and what yes and no mean, in JSON. A question OpenAI refuses goes
  unanswered.
- **clef and clef-flash** ([`cloudflare.ts`](../../src/providers/cloudflare.ts)):
  the request as Jev's, since Clef takes Jev's format, in chunks of 64
  questions, the most it takes, each under its place in its chunk, since its
  ids take no `/` or `:`.
- Neither OpenAI nor Cloudflare takes a `choice` with one option, which
  adhere asks where a section holds one line of code. Both providers answer
  it with that option and do not send it.

Two suites:

- **adhere's eval** ([`providers.ts`](providers.ts)): the Effect preset on the
  planted files and adhere's `src/`, scored against `labels.json`, as the rest
  of the eval is.
- **Four repos** ([`providers-repos.ts`](providers-repos.ts)): the typescript,
  react, and security presets on dub, immich, hono, and excalidraw at the
  commits [`presets.md`](presets.md) names. Judging is scored against
  `presets-labels.json`, and against `providers-labels.json` for the findings
  only the other models reported. Locating covers the 176 real findings whose
  lines `violations.json` marks, through adhere's own Jev service with each
  model as its config's provider, and is scored as [`pinpoint.md`](pinpoint.md)
  scores it.

```sh
himitsu exec common/openai-api-key cloudflare-account-id cloudflare-api-token typesafe-api-key -- \
  bun eval/studies/providers.ts results.json
himitsu exec common/openai-api-key cloudflare-account-id cloudflare-api-token typesafe-api-key -- \
  bun eval/studies/providers-repos.ts results.json
```

Times are each request's, sent 8 at a time from one machine; costs are each
model's list price per input token, and none charges for output.

## Results

### adhere's eval

43 planted files, and adhere's `src/` as it stood, 36 files.

| model      | hard AUC | caught / wrong at 0.8 | at 0.9 | planted AUC | unanswered | median / p95 ms | cost   |
| ---------- | -------- | --------------------- | ------ | ----------- | ---------- | --------------- | ------ |
| jev        | 0.954    | 22 / 2                | 15 / 0 | 1.000       | 0          | 124 / 161       | $0.024 |
| gpt-6-luna | 0.833    | 22 / 13               | 21 / 8 | 0.975       | 73         | 149 / 1,029     | $0.073 |
| clef       | 0.858    | 20 / 9                | 16 / 2 | 1.000       | 0          | 1,388 / 2,139   | $0.145 |
| clef-flash | 0.724    | 4 / 3                 | 0 / 0  | 0.807       | 0          | 584 / 1,171     | $0.054 |

68 pairs only clef-flash scored above 0.7 have no label, so its wrong column
is a floor.

### Four repos: judging

605 labeled findings (275 real, 330 false) and 48 debatable, over 313 files.
Real / false counts the labeled findings lint would report, with the share
real.

| model      | AUC   | real / false at 0.7 | at 0.8         | at 0.9         | median / p95 ms | cost  |
| ---------- | ----- | ------------------- | -------------- | -------------- | --------------- | ----- |
| jev        | 0.785 | 176 / 71 (71%)      | 108 / 30 (78%) | 34 / 3 (92%)   | 161 / 234       | $0.20 |
| gpt-6-luna | 0.790 | 190 / 84 (69%)      | 177 / 73 (71%) | 142 / 53 (73%) | 210 / 278       | $0.62 |
| clef       | 0.713 | 90 / 22 (80%)       | 58 / 8 (88%)   | 24 / 2 (92%)   | 2,928 / 4,193   | $1.17 |
| clef-flash | 0.299 | 16 / 149 (10%)      | 8 / 139 (5%)   | 0 / 13         | 1,087 / 1,746   | $0.44 |

Every finding any model reports at 0.8 is labeled. Between 0.7 and 0.8 a few
are not: 5 of Jev's, 13 of gpt-6-luna's, 2 of clef's, and 147 of
clef-flash's.

### Four repos: locating

| model      | located    | section holds the violation | lines hold the violation | lines underlined, median |
| ---------- | ---------- | --------------------------- | ------------------------ | ------------------------ |
| jev        | 174 of 176 | 94%                         | 93%                      | 1                        |
| gpt-6-luna | 173 of 176 | 71%                         | 70%                      | 3                        |
| clef       | 176 of 176 | 89%                         | 86%                      | 1                        |
| clef-flash | 176 of 176 | 69%                         | 66%                      | 2                        |

Jev's two misses are files too long for its locate request, which lint skips.

### How gpt-6-luna is asked

A decision question takes its instructions as one string, so its provider has
to choose how the parts adhere gives it read. The same parts in prose, the
question, then each field under its name, then what yes and no mean, beside
the JSON its provider sends:

| gpt-6-luna's instructions  | adhere's eval: hard AUC | four repos: AUC | real / false at 0.8 | lines hold the violation |
| -------------------------- | ----------------------- | --------------- | ------------------- | ------------------------ |
| JSON, as its provider asks | 0.833                   | 0.790           | 177 / 73 (71%)      | 70%                      |
| prose                      | 0.877                   | 0.771           | 181 / 94 (66%)      | 60%                      |

The four repos read the same files both times; adhere's eval read its `src/`
as it stood, 36 files with JSON and 43 with prose.

## What we learned

- **Jev does the most for adhere.** It ranks best on adhere's eval, ties on
  the four repos, locates best, and is the fastest and cheapest on adhere's
  requests.
- **gpt-6-luna ranks as well as Jev on real code, but louder.** Its
  probabilities run high: at 0.8 it reports about what Jev reports at 0.7,
  177 real to 73 false against Jev's 176 to 71. 82% of its answers on the
  four repos are 0 or 1, where none of the others' are, so a higher threshold
  barely thins them: at 0.9 it still reports 142 real to 53 false. It refused
  73 of 1,422 questions on adhere's eval, 72 of them about 7 of the 36 files
  of `src/`, and none of 13,584 on the four repos. Its `choice` answers, which
  locate a finding, put the lines on the violation 70% of the time to Jev's
  93%.
- **How a question reads moves gpt-6-luna.** The same parts in prose changed
  5,937 of its 13,584 answers on the four repos. Prose did better on adhere's
  own eval and worse on the four repos, at judging and locating both. Its
  provider asks in JSON, since the four repos are the larger test and real
  code.
- **clef is the most precise and the slowest.** 88% of what it reports at 0.8
  is real, the most of the four, but it reports about half as many real
  findings as Jev. It locates nearly as well as Jev. On adhere's requests of
  10,000 to 20,000 tokens its median was 2.9 seconds, 18 times Jev's, where
  Cloudflare publishes a 209 ms median over its own benchmarks. It takes
  Jev's requests as they are but for the exceptions Setup lists, which its
  provider handles.
- **clef-flash does not do this job.** 5% of what it reports at 0.8 on the
  four repos is real; most of the rest is `no-secrets-in-output` on
  components that output nothing. On adhere's eval it catches 4 of 20
  planted violations at 0.8.
- **Only Jev varies.** gpt-6-luna, clef, and clef-flash gave the same
  answers to all 13,584 questions in two runs, and clef again through its
  provider after it moved into adhere. Jev changed 7,827 of them, by at most
  0.17, and its AUC by 0.003.
- **Labels from one model favor it.** The four repos' labels began as Jev's
  findings. Before the other models' were labeled, Jev had none unlabeled
  and they had 214, and Jev's AUC was 0.70 to gpt-6-luna's 0.75. With every
  finding at 0.8 labeled, it is 0.785 to 0.790. A comparison has to label
  what every model reports.
- **Tokens differ.** For the same requests gpt-6-luna counted 30% more input
  tokens than Jev, and clef 2% more.

## Not yet decided

- The 319 labels added for this study, 271 in `providers-labels.json` and 48
  at the end of `labels.json`, were drafted by agents that read each rule and
  the code, as `presets-labels.json`'s were, and are not yet reviewed.
- Every model got adhere's questions as they are worded for Jev. Only
  gpt-6-luna's provider renders them differently, and only as JSON or prose.
