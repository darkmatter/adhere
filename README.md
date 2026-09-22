# adhere

A linter for rules a normal linter cannot check. A rule is a piece of correct
reference code plus a one-sentence description. For each source file, adhere
asks [Jev](https://typesafe.ai) (TypeSafe AI's System One model) whether the
file diverges from each rule's reference, gets a calibrated probability per
rule, and reports the ones above a threshold with the line Jev points at. The
report uses the same frame as `vp lint`.

Deterministic rules (substring matches, type checks) belong in a normal linter.

## Config

A config file in the working directory of the repo being audited, at one of
these paths (keep one):

- `adhere.config.ts`
- `.adhere/config.ts`
- `.adhere.config.ts`

```ts
import type { Config } from "@darkmatter/adhere";

export default {
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
} satisfies Config;
```

The default export is decoded with Effect `Schema`. An invalid shape refuses
the run. The `import type` is erased at runtime, so the file also loads under
the native executable, where `@darkmatter/adhere` is not installed. With the
package installed, `defineConfig({...})` does the same thing.

### Rules as Markdown files

A repo's own rules live in `.adhere/`, one `*.md` file per rule. The path
without `.md` is the rule id, so `.adhere/data/brand-ports.md` is
`data/brand-ports`. When that directory exists, it is read without any config.
A repo that already has a `docs/` directory may prefer `docs/adhere/`, so the
rules sit with the rest of its documentation; point `rules` at it:

```ts
export default { presets: ["effect"], rules: "./docs/adhere" } satisfies Config;
```

A config is otherwise needed only to name presets or set thresholds.

A file is front matter, then a body. The first fenced code block in the body
is the reference; prose around it renders on GitHub and is ignored. Without a
fence, the whole body is the reference.

````md
---
description: A port is a branded, range-checked integer, not a bare number.
threshold: 0.8
---

Why: a bare `number` accepts 70000 and -1.

```ts
const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
```
````

`description` is required. `threshold` is optional. A file that fails
validation refuses the run with its path in the message. `loadRules(directory)`
from the package root does the same load for your own tooling.

### Presets

A preset has the shape of a config without `presets`: `rules`, and optionally
`model` and `threshold`. `effect` is the one preset: 26 Markdown rules in
[`presets/effect/`](./presets/effect/), lifted from the
[effect-solutions](https://github.com/kitlangton/effect-solutions) docs and the
[effect/platform](https://effect.website/docs/platform/introduction/) docs.
Name it in the config, or on the command line with `--preset effect`, in which
case `adhere.config.ts` is optional.

### Precedence

Highest first: `--threshold` on the command line, the config file, presets in
order (a later preset wins), then the defaults `jev-latest` and `0.7`. A rule
in `rules` replaces a preset rule with the same id. A rule's own `threshold`
beats all of the above for that rule.

## Run

From a checkout, with Bun:

```sh
bun install
bun link          # puts `adhere` on PATH
adhere --preset effect
```

`adhere` audits the working directory. When that directory contains `agents/`,
`apps/`, or `packages/`, only those trees are read. Exit code 1 when there is
at least one finding.

### Native executable

`bun run build` compiles `dist/adhere`, a single binary with Bun and the
`effect` preset inside it, through Bun's
[`--compile`](https://bun.sh/docs/bundler/executables) with
`--asset ./presets`. It runs without Bun or `node_modules` on the target
machine and still loads the repo's `config.ts` and Markdown rules from disk.
For another platform, add `--target`, for example `bun-darwin-arm64`.

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

Judgments are cached in `.adhere/cache/` (add it to `.gitignore`), one entry
per file. An entry stores the file's content hash and, per rule, the
probability, the located line, and a fingerprint of the rule's text and model.
A changed file re-judges every rule for that file. An edited rule re-judges
only that rule. A lowered threshold locates cached judgments that are newly
above it without judging again.

`TYPESAFE_API_KEY` is read only when a request is about to be sent. A run
where every file is cached needs no key and no network.
