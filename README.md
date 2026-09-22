# adhere

A linter for rules a normal linter cannot check. A rule is a piece of correct
reference code plus a one-sentence description. For each source file, adhere
asks [Jev](https://typesafe.ai) (TypeSafe AI's System One model) whether the
file diverges from each rule's reference, gets a calibrated probability per
rule, and reports the ones above a threshold with the line Jev points at. The
report uses the same frame as `vp lint`.

Deterministic rules (substring matches, type checks) belong in a normal linter.

## Config

`adhere.config.ts` in the working directory of the repo being audited:

```ts
import { defineConfig } from "@darkmatter/adhere";

export default defineConfig({
  model: "jev-latest", // optional, default "jev-latest"
  threshold: 0.7, // optional, default 0.7
  presets: ["effect"], // optional, built-in rule sets
  rules: {
    "data/brand-meaningful-primitives": {
      description:
        "A primitive with semantic meaning, such as an id, email, URL, port, or count, is a branded schema.",
      reference: `
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
`,
      threshold: 0.8, // optional per-rule override
    },
  },
});
```

The default export is decoded with Effect `Schema`. An invalid shape refuses
the run. A rule in `rules` replaces a preset rule with the same id.

### Presets

`effect` is the one preset: 26 rules lifted from the
[effect-solutions](https://effect.solutions) docs and the
[effect/platform](https://effect.website/docs/platform/introduction/) docs,
in `src/presets/effect.ts`. Name it in the config, or on the command line
with `--preset effect`, in which case `adhere.config.ts` is optional.

## Run

Requires Bun.

```sh
bun install
bun link          # puts `adhere` on PATH
adhere --preset effect
```

`adhere` audits the working directory. When that directory contains `agents/`,
`apps/`, or `packages/`, only those trees are read. Exit code 1 when there is
at least one finding.

## How a file is judged

1. One Jev request per file, with the file's numbered lines and every rule as
   the state, and one `noul` (yes/no probability) question per rule. Every
   question shares the state cost of the request.
2. A second request only when at least one rule's probability is above its
   threshold: one `choice` question per flagged rule over the file's non-blank
   lines, which yields the line to report. A file with more than 255 non-blank
   lines is located in two steps (a block of 20 lines, then a line inside it).
   Files longer than 5100 lines are skipped and counted in the summary.

## Cache

Judgments are cached in `.adhere-cache/` in the working directory, one entry
per file. An entry stores the file's content hash and, per rule, the
probability, the located line, and a fingerprint of the rule's text and model.
A changed file re-judges every rule for that file. An edited rule re-judges
only that rule. A lowered threshold locates cached judgments that are newly
above it without judging again.

`TYPESAFE_API_KEY` is read only when a request is about to be sent. A run
where every file is cached needs no key and no network.
