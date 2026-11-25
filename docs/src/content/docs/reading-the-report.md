---
title: "Reading the report"
---

A finding looks like this:

```text
  × data/brand-ports: A port must be a branded, range-checked integer, never a bare number.
    confidence 0.93 · context 0.88
   ╭─[src/server.ts:6:3]
 1 │ import { Effect } from "effect";
 2 │ import { listen } from "./listen.ts";
 3 │
 4 │ export const serve = Effect.gen(function* () {
 5 │   const host = process.env.HOST ?? "localhost";
 6 │   const port: number = Number(process.env.PORT ?? 3000);
   ·   ──────────────────────────────────────────────────────
 7 │   yield* listen({ host, port });
 8 │   yield* Effect.log(`Listening on ${host}:${port}`);
 9 │ });
   ╰────
  hint: const Port = Schema.Int.pipe(
          Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
          Schema.brand("Port"),
        );

  confidence  0–0.74 < 0.8 < 0.85–1  Jev's probability that the file breaks the rule
  context     0–0.49 < 0.6 < 0.70–1  its probability that the file shows enough to decide

Found 1 error.
42 files, 3 judged, 39 cached.
```

| Part               | What it tells you                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `×` or `⚠`         | `×` marks an error. `⚠`, in amber, marks a warning from a rule whose `level` is `warning`. Only errors fail the run.                       |
| `data/brand-ports` | The rule's id, then its description. A preset rule's id starts with the preset's name, as in `effect/basics/gen-for-sequencing`.           |
| `confidence`       | Jev's probability that the file breaks the rule.                                                                                           |
| `context`          | Jev's probability that it sees enough to decide that.                                                                                      |
| The excerpt        | The section of the file Jev points at. When Jev names one line, it is underlined. When it names several, a bar beside the code marks them. |
| `hint:`            | The rule's code that must be written. A rule with only code that must never be written shows that code instead, labeled `never:`.          |
| The legend         | Under the last finding: each score's threshold, between its red range and its green range.                                                 |

**Score colors.** On a terminal, each score is colored by where it sits around
its threshold. The legend shows each color's range:

- **Green** is well above the threshold.
- **Amber** is near it, on either side. When many scores are amber, the
  threshold may be too low or too high for the rule.
- **Red** is well below it. `lint` never reports a `confidence` this low, so
  only the legend shows that range. A red `context` marks the finding to doubt
  first.

**Low context.** Jev sees the file and what adhere [reads](/adhere/state-hooks/#what-jev-reads)
beside it, not your whole repo, so adhere also asks Jev whether that shows
enough to decide the rule at all: the `context` score. When `context` is below
the sufficiency threshold, 0.6 by default, Jev needs more than it sees, and the
finding carries a warning:

```text
  warning: this file may not show enough to check this rule
     help: add what the code relies on outside this file as a note Jev reads:
           // @adhere <the fact>, and how you know it
```

- On the eval, most findings with this warning were false, compared with about
  one in five of all findings ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/sufficiency.md)). Check what
  the code relies on outside the file before acting on such a finding.
- Give Jev a fact it lacks with an `@adhere` note (see [Comments](/adhere/comments-and-suppressions/#comments)).
- Change the threshold with `sufficiencyThreshold` in the config, or with
  `--sufficiency-threshold` for one run.
