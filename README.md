# adhere

A linter for rules a normal linter cannot check. A rule is a one-sentence
description plus correct reference code, code to avoid, or both. For each
source file, adhere asks [Jev](https://typesafe.ai) (TypeSafe AI's System One
model) whether the file breaks each rule, gets a calibrated probability per
rule, and reports the ones above a threshold with the line Jev points at. The
report uses the same frame as `vp lint`.

Deterministic rules (substring matches, type checks) belong in a normal linter.

## Install

```sh
npm install --global @drkmttr/adhere   # or: bun add --global @drkmttr/adhere
```

To pin the version in a repo, for CI or scripts, add it as a dev dependency
and run `npx adhere`. To try it without installing, run
`npx @drkmttr/adhere` or `bunx @drkmttr/adhere`.

`adhere` is a prebuilt executable for macOS and Linux on arm64 and x64 and for
Windows on x64. It needs Node to start, and no Bun.

adhere sends each file it judges to Jev at `api.typesafe.ai`, authenticated
with a TypeSafe AI API key: the one `adhere login` saved, or
`TYPESAFE_API_KEY` when it is set.

## Quick start

```sh
adhere init                          # .adhere/config.ts and two example rules
echo ".adhere/cache/" >> .gitignore
adhere login                         # save your TypeSafe AI API key, once
adhere validate                      # check the rules, and ask Jev whether any contradict
adhere lint                          # audit the working directory
```

Without a config or rules, `adhere lint --preset effect` audits against the
built-in Effect rules. A finding looks like this:

```text
  × data/brand-ports (0.93): A port is a branded, range-checked integer, not a bare number.
   ╭─[src/server.ts:4:1]
 4 │ const port: number = Number(process.env.PORT ?? 3000);
   · ──────────────────────────────────────────────────────
   ╰────
  hint: const Port = Schema.Int.pipe(
          Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
          Schema.brand("Port"),
        );

Found 1 error.
42 files, 3 judged, 39 cached.
```

The header is the rule id, Jev's probability, and the rule's description. The
hint is the rule's reference; a rule with only code to avoid shows that code,
labeled `avoid:`, instead. On a terminal, the report is in color and the code
in it is highlighted. The exit code is 0 when nothing is reported and 1 when
something is. It is also 1 when the run refuses, for example on an invalid
config or rule file, a missing API key, or an unknown command or flag; a
refusal prints its reason.

## Usage

```sh
adhere lint                    # audit the working directory
adhere lint --preset effect    # add a built-in rule set; the config becomes optional
adhere lint --threshold 0.8    # replace the config's threshold; per-rule thresholds still apply
adhere validate                # load the config and rules, ask Jev whether any contradict
adhere init [--force]          # scaffold .adhere/config.ts and two example rules
adhere login                   # save a TypeSafe AI API key for later runs
adhere logout                  # delete the saved key
adhere skill                   # print the agent skill (below)
```

Bare `adhere` prints the help, which lists the commands, and
`adhere <command> --help` lists a command's flags. `adhere --completions <shell>`
prints a completion script.

### What gets read

`adhere lint` reads the `.ts` files under the working directory, except `.d.ts`,
`.test.ts`, and config files. When the working directory contains `agents/`,
`apps/`, or `packages/`, only those trees are read. Below the working
directory, anything under `node_modules/`, `dist/`, `coverage/`, `vendor/`,
`e2e/`, `references/`, `.adhere/`, `.agents/`, `.claude/`, `.direnv/`,
`.alchemy/`, or `.vite/` is skipped; the directories above it do not count.
`.tsx` files are not read, and `.gitignore` is not consulted.

### Init

`adhere init` writes `.adhere/config.ts` and two example rules. It is safe to
rerun: by default it reports existing files as skipped and does not clobber
them. `--force` overwrites them. A config already at another accepted path is
kept, and no second one is added, even with `--force`.

### Validate

`adhere validate` loads the config, rule files, and presets the way `lint`
does, so a file that fails to decode refuses here too, and it prints how many
rules it loaded. `--preset` adds a built-in rule set, as for `lint`. It then
asks Jev whether any two rules that apply to the same files contradict, so that
no code can follow both: one request names, per rule, the rule it conflicts
with, if any, and each named pair then gets a probability from a request of
its own, holding only those two rules, since other rules beside them dilute
the judgment. A pair above
the threshold is printed with both rule files, and the exit code is 1. Two
rules with the same id are not compared: a nested rule that shares an id
shadows the other on purpose. When no two rules share files nothing is sent;
otherwise `validate` needs the API key, as `lint` does.

### Login

`adhere login` prompts for a TypeSafe AI API key, masking what you type, and
saves it to `~/.config/adhere/credentials.json`, or under `$XDG_CONFIG_HOME`
when that is set, readable only by you. Piped input is read instead of a
prompt: `adhere login < key.txt`. `lint` and `validate` use the saved key, but
`TYPESAFE_API_KEY`, when set, takes precedence, so CI can pass a key without a
login. `adhere logout` deletes the saved key.

## Config

A config file is optional. Without one, adhere reads the rule files in
`.adhere/` and any `--preset`. A config names presets, sets the model and
thresholds, or gives rules inline. It sits in the working directory of the
repo being audited, at one of these paths (keep one):

- `.adhere/config.ts`, the default, next to the rules
- `adhere.config.ts`
- `.adhere.config.ts`

```ts
import type { Config } from "@drkmttr/adhere";

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
      avoid: "type UserId = string", // optional: what a violation looks like
      threshold: 0.8, // optional per-rule override
    },
  },
} satisfies Config;
```

The default export is decoded with Effect `Schema`. An invalid shape refuses
the run. The `import type` is erased at runtime. `defineConfig({...})` from
`@drkmttr/adhere` does the same thing as `satisfies Config`, and the executable
supplies it whether or not the repo has the package installed; the editor's
types come from the package as a dev dependency. A config can import other
files by relative path, but no packages besides `@drkmttr/adhere`: the
executable does not resolve `node_modules`.

`rules` in the config, inline as above or as a directory (below), replaces the
`.adhere/` rule files: none of them, root or nested, is read then.

### Rules as Markdown files

A repo's own rules live in `.adhere/`, one `*.md` file per rule, next to the
config and the cache (neither is read as a rule). The path without `.md` is the
rule id, so `.adhere/data/brand-ports.md` is `data/brand-ports`. When that
directory exists, it is read without any config.

A file is front matter, then a body. The first fenced code block in the body
is the reference; prose around it renders on GitHub and is ignored. Without a
fence, the whole body is the reference. A fence tagged `avoid` after its
language holds code to avoid instead: what a violation looks like.

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

Not this:

```ts avoid
const port: number = Number(process.env.PORT);
```
````

`description` is required, with a reference, code to avoid, or both.
`threshold` is optional. A file that fails validation refuses the run with its
path in the message. `loadRules(directory)` from the package root does the same
load for your own tooling.

With a reference, Jev is asked whether the file diverges from it, and code to
avoid, when there is some, is its example of diverging. With only code to
avoid, Jev is asked whether the file contains it. That suits a rule with no
single correct form to show, such as a hand-rolled retry loop or an error
caught and dropped. Neither goes in the other's place: code to avoid in the
reference reads to Jev as the pattern to follow.

Nested `.adhere/` directories are also discovered, except under
`node_modules/`, `dist/`, and the other skipped directories (above). A rule in
`packages/api/.adhere/data/brand-ports.md` has the same id,
`data/brand-ports`, but applies only to files under `packages/api/`. Root
`.adhere/` rules apply project-wide. If a nested rule has the same id as a root
rule, the nearest containing `.adhere/` shadows the less-specific rule for that
subtree; outside that subtree, the root rule still applies. There is no broader
priority system: presets are global, project rules override preset rules with
the same id, and nested project rules override less-specific project rules with
the same id for files in their subtree.

`.adhere/` is the default rather than `docs/adhere/` because it keeps
everything adhere owns in one directory: the config and the cache are tool
state, not documentation, and would stay in `.adhere/` anyway. A nested
`.adhere/` also scopes its rules to the directory that contains it (above). The
cost is visibility: a dot directory is hidden from `ls`, and from `rg` without
`--hidden`. A repo that would rather keep its rules with the rest of its
documentation can point `rules` at `docs/adhere/`:

```ts
export default { presets: ["effect"], rules: "./docs/adhere" } satisfies Config;
```

Rules read through `rules` apply project-wide.

### Presets

A preset has the shape of a config without `presets`: `rules`, and optionally
`model` and `threshold`. `effect` is the one preset: 26 Markdown rules in
[`presets/effect/`](./presets/effect/), lifted from the
[effect-solutions](https://github.com/kitlangton/effect-solutions) docs and the
[effect/platform](https://effect.website/docs/platform/introduction/) docs.
Name it in the config, or on the command line with `--preset effect`, in which
case the config file is optional.

### Precedence

Highest first: `--threshold` on the command line, the config file, presets in
order (a later preset wins), then the defaults `jev-latest` and `0.7`. A rule
in `rules` replaces a preset rule with the same id. A rule's own `threshold`
beats all of the above for that rule.

## How a file is judged

1. One Jev request per file. The state is the file's numbered lines and
   nothing else. Each rule is one `noul` (yes/no probability) question that
   carries the rule: whether the file breaks the rule's description, with
   criteria for each answer. Yes means part of the file breaks the rule, and
   the code to avoid is an example of it. No means the file follows the rule
   or has nothing the rule covers, and the reference is an example of it.
   Since no rule sits in the shared state, a rule's probability depends only
   on the file and that rule, not on which other rules share the request.
   Every question shares the state cost of the request.
2. A second request only when at least one rule's probability is above its
   threshold: one `choice` question per flagged rule over the file's non-blank
   lines, which yields the line to report. A file with more than 255 non-blank
   lines is located in two steps (a block of 20 lines, then a line inside it).
   Files longer than 5100 lines are skipped and counted in the summary.

## Cache

Judgments are cached in `.adhere/cache/` (add it to `.gitignore`), one entry
per file. An entry stores the file's content hash and, per rule, the
probability, the located line, and a fingerprint of the model and the
question asked for the rule, which carries the rule's text. A changed file
re-judges every rule for that file. An edited rule re-judges only that rule,
and an adhere that asks its questions differently re-judges every rule once.
A lowered threshold locates cached judgments that are newly above it without
judging again. Entries depend on content, not on the
machine, so restoring `.adhere/cache/` between CI runs skips unchanged files.

The API key is read only when a request is about to be sent. A run where
every file is cached needs no key and no network.

## Agent skill

[`skills/adhere/SKILL.md`](./skills/adhere/SKILL.md) teaches an agent to
gather a repo's conventions into rule files, configure adhere, and calibrate
thresholds. Install it with the [skills](https://github.com/vercel-labs/skills)
CLI: `skills add darkmatter/adhere`. The binary carries the same file:
`adhere skill` prints it, so `adhere skill > .agents/skills/adhere/SKILL.md`
works without a checkout.

## Development

From a checkout, with Bun:

```sh
bun install
bun link          # puts `adhere` on PATH
adhere lint --preset effect
```

In a checkout no platform package is installed, so `bin/adhere.js` runs
`src/main.ts` with Bun instead. `bun run typecheck` runs `tsc` and the linter,
and `bun run test` runs the tests.

### Native executable

`bun run build` compiles `dist/adhere`, a single binary with Bun and the
`effect` preset inside it, through Bun's
[`--compile`](https://bun.sh/docs/bundler/executables) with
`--asset ./presets`. It runs without Bun or `node_modules` on the target
machine and still loads the repo's `config.ts` and Markdown rules from disk.
`bun run build:npm` compiles it for every published platform instead, each
into its package under `dist/npm/`
([`scripts/npm-packages.ts`](./scripts/npm-packages.ts)).

Each platform's executable is its own npm package,
`@drkmttr/adhere-<platform>-<arch>`, limited by `os` and `cpu`, and an
optional dependency of `@drkmttr/adhere`, so an install fetches only its own
machine's. The package's `bin/adhere.js` finds it and runs it with Node.

### Release

Releases are cut by CI from pushed version tags. From a clean, up-to-date
`main`, push the release tag:

```sh
git tag v0.3.0
git push origin v0.3.0
```

The tag push starts `.github/workflows/release.yaml`, which checks out `main`,
derives `0.3.0` from `v0.3.0`, and runs `bun run release -- --ci 0.3.0`.
Release-it bumps `package.json`, commits `chore: release v0.3.0` back to
`main`, skips npm publish, and creates the GitHub Release for the existing tag.

Publishing stays in `.github/workflows/publish.yaml`: after release-it
finishes, `.github/workflows/release.yaml` calls the reusable publish workflow
directly, avoiding a chained GitHub Release event created by `GITHUB_TOKEN`.
The publish workflow verifies that `package.json` matches the release tag,
builds the platform packages, and publishes each of them before
`@drkmttr/adhere`, which it first lists them in as `optionalDependencies` at
the same version. Every publish is `npm publish --access public --provenance`.
No npm token is used, so a new package has to be published once by hand
before it can be given trusted publishers on npmjs.com. npm checks the
workflow that started the run, so every package has two: `release.yaml`, which
calls the publish workflow for tag releases, and `publish.yaml`, for manual
runs. The publish workflow can be run manually for an already-created release
tag if a publish needs to be retried; it skips every package whose version is
already on npm. The main package's `files` list keeps it to `bin/`, `src/`,
`presets/`, and `skills/`.
