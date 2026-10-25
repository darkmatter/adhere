<div align="center">
<h1>adhere</h1>
  <sup>A linter for non-deterministic rules. Powered by TypeSafe AI.</sup><br>
  <sup><a href="https://dm.sh/adhere/">Documentation</a></sup>
</div>

A linter for rules a normal linter cannot check, such as "business logic should
live in services" or "modules should expose lots of functionality behind a
small API". You can write a rule as a Markdown file, with code that shows it:

````md
---
description: A third-party API going offline should not also take our app down.
---

Our APIs should not depend on a third-party API on a critical path. The
user-facing side should be unaffected if it goes offline, and ingestion should
happen in a separate, asynchronous process.

## Should

```ts
import db from "./lib/db";
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode reads only our own database.
export async function findRestaurants(zipCode: string) {
  return db.restaurants.find({ where: { zipCode } });
}

// A scheduled job copies new restaurants in, off the request path.
export async function syncRestaurants(since: Date) {
  const restaurants = await googleMaps.findAll({ updatedSince: since });
  await Promise.all(restaurants.map((restaurant) => db.restaurants.upsert(restaurant)));
}
```

## Should not

```ts
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode
export async function findRestaurants(zipCode: string) {
  // When Google Maps is down, slow, or over quota, so is this endpoint.
  return googleMaps.findAll({ where: { zipCode } });
}
```
````

adhere asks [Jev](https://typesafe.ai), TypeSafe AI's System One model, whether
each file breaks each rule. Jev answers with a calibrated probability. adhere
reports each rule whose probability is above a threshold, and shows the part of
the file Jev points at. The report looks like Oxlint's, the linter `vp lint`
runs:

![adhere lint demo](https://github.com/darkmatter/adhere/raw/main/eval/demo.gif)

Rules a normal linter can check exactly, such as a banned import or a type
error, belong in that linter. [`adhere validate`](#validating-rules) lists the
rules Jev thinks a linter could check, and finds rules that contradict each
other.

## Contents

- [Install](#install)
- [Getting Started](#getting-started)
- **Rules**
  - [Rule format](#rule-format)
  - [Writing good rules](#writing-good-rules)
  - [Generate rules from your repo](#generate-rules-from-your-repo)
  - [Install rules from other repos](#install-rules-from-other-repos)
  - [Presets](#presets)
- **Usage**
  - [Reading the report](#reading-the-report)
  - [Config](#config)
  - [Running lint](#running-lint)
  - [Commands](#commands)
- **Validate & improve rules**
  - [Validating rules](#validating-rules)
  - [Live evals](#live-evals)
- **Advanced features**
  - [State Hooks and Type-Awareness](#state-hooks-and-type-awareness)
  - [Providers](#providers)
  - [Comments and suppressions](#comments-and-suppressions)
- [Agent skills](#agent-skills)
- **Reference**
  - [Cache](#cache)
  - [How a file is judged](#how-a-file-is-judged)
- [Compose your AGENTS.md](#compose-your-agentsmd)
- [Contributing](#contributing)
- [License](#license)

## Install

Install the standalone executable. It needs no Node or Bun, and runs in any
directory, inside a repo or not:

```sh
curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh
```

It installs to `~/.local/bin`. If your shell can't find `adhere` afterwards, add
that directory to your `PATH`.

To pin adhere's version in a repo, so the team and CI run the same one, add it
as a dev dependency and run it from the package:

```sh
bun add -d @drkmttr/adhere
bun run adhere lint
```

With npm or pnpm, add it the same way and run `npm exec adhere` or
`pnpm exec adhere`. The package is `@drkmttr/adhere`: `adhere` on npm is an
unrelated package.

- The package includes the TypeScript compiler that
  [type awareness](#what-jev-reads) needs. The standalone executable does not,
  so it runs every audit except type-aware ones.
- The [install script](scripts/install.sh) puts this machine's executable from
  the [latest release](https://github.com/darkmatter/adhere/releases/latest) in
  `~/.local/bin`. Run it again to update. The executable is built for macOS and
  Linux, on arm64 and x64, and for Windows x64: download
  `adhere-Windows-x86_64.exe` from the release.
- adhere sends each file it judges to Jev at `api.typesafe.ai`, with what it
  [reads](#what-jev-reads) beside it, authenticated with a TypeSafe AI API
  key.

### Login

```sh
adhere login             # prompts for the key, masking what you type
adhere login < key.txt   # reads it from stdin instead
adhere logout            # deletes the saved key
adhere login --openai    # saves an OpenAI API key, for the openai provider
adhere logout --openai   # deletes it, and only it
```

- The key is saved to `~/.config/adhere/credentials.json`, or under
  `$XDG_CONFIG_HOME` when that is set, readable only by you. An OpenAI key is
  saved beside the TypeSafe AI one, for a config whose provider is
  `openai()`; see [Providers](#providers).
- `TYPESAFE_API_KEY`, when set, takes precedence over the saved key, so CI can
  pass a key without a login. `OPENAI_API_KEY` does the same for the saved
  OpenAI key.
- The key is read only when a request is about to be sent. A run that the
  cache answers in full needs no key and no network.

## Getting Started

Install the executable (see [Install](#install)) and save your TypeSafe AI API
key once (see [Login](#login)), then try the built-in presets on your code
before you write a rule of your own. The executable runs in any directory:

```sh
adhere login
adhere lint --preset typescript,react
```

Without installing anything, `npx @drkmttr/adhere` or `bunx @drkmttr/adhere`
runs the same commands. Presets cover TypeScript, React, security, Effect, and
alchemy. See [Presets](#presets).

To set up rules of your own in a repo:

```sh
adhere init                # .adhere/config.ts, two example rules, and the dev dependency
bun run adhere validate    # check your rules' wording, and ask Jev whether any contradict
bun run adhere lint        # audit the working directory
git add .adhere            # commit the rules, and the judgments they cost
```

### Init

`adhere init` creates a config file and some example rules and, in a repo with
a `package.json`, adds adhere as a dev dependency.

It is safe to rerun: existing files are reported as skipped, and only `--force`
overwrites them.

### The day-to-day loop

After that, using adhere is a short loop:

1. **Write or edit a rule** in `.adhere/rules/`. A rule is one sentence saying
   what code must be, with code that shows it: see
   [Rule format](#rule-format).
2. **Run `adhere lint`.** It says what it found and what judging takes, and
   asks before it sends anything: see [Running lint](#running-lint).
3. **Read the findings.** Each finding names the rule, Jev's probability, and
   the lines it points at: see [Reading the report](#reading-the-report).
4. **Fix the code, the rule, or neither.** A wrong finding is usually the
   rule's wording reaching too far: see
   [Writing good rules](#writing-good-rules). Suppress a finding that is wrong
   for this code alone with a comment that says why: see
   [Comments and suppressions](#comments-and-suppressions).
5. **Commit `.adhere/`, cache included.** Judgments are cached by file content
   and rule text, so the next run, and CI, only pay for what changed: see
   [Cache](#cache).

## Rule format

A repo's own rules live in `.adhere/rules/`, organized just like skills:

```text
.adhere/
  config.ts           optional
  cache/              commit it
  rules/
    data/             a topic: a directory that holds no rule
      brand-ports/
        RULE.md       the rule data/brand-ports
      columns/
        RULE.ts       a rule written in TypeScript
        schema.ts     a helper it imports, not read as a rule
```

- The directory's path is the rule id: `.adhere/rules/data/brand-ports/RULE.md`
  is `data/brand-ports`.
- A rule can be markdown `RULE.md`, or typescript [`RULE.ts`](#rules-as-typescript-files). A
  directory with both refuses the run.
- Files not named `RULE` are ignored.

### Rules as Markdown files

A `RULE.md` is front matter, then a body that holds the rule's code:

````md
---
description: A port must be a branded, range-checked integer, never a bare number.
threshold: 0.8
---

Why: a bare `number` accepts 70000 and -1.

## Must

```ts
const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
```

## Never

```ts
const port: number = Number(process.env.PORT);
```
````

| Front matter             | Meaning                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`            | Required. One sentence that says what code must be and what it must never be.                                                                  |
| `threshold`              | The rule's own cutoff, in place of the config's.                                                                                               |
| `level`                  | `warning` reports the rule's findings as warnings, which do not fail the run. Use it for a nit, or for a rule that tends to flag code wrongly. |
| `tests`                  | Rules skip tests by default. `only` is for a rule about tests, which judges nothing else. `include` is for one that holds in tests as well.    |
| `appliesTo`, `excludeIf` | Where the rule applies. See [Scoping a rule](#scoping-a-rule).                                                                                 |

| Heading in the body          | The code under it                                           |
| ---------------------------- | ----------------------------------------------------------- |
| `## Must`                    | must be written                                             |
| `## Never`                   | must never be written, which is what a violation looks like |
| `## Should`, `## Should not` | the same, for a guideline                                   |

- A rule needs code under at least one heading.
- A rule is a requirement ("must", "never") or a guideline ("should", "should
  not"), and cannot mix the two.
- A rule with only a `never` block suits a rule with no single correct form to
  show, such as a hand-rolled retry loop or an error caught and dropped.
- Put neither kind of code in the other's place: code that must never be
  written, under `must`, reads to Jev as the pattern to follow.
- Prose around the code is the rule's details: Jev reads it after the
  description, so use it to say why the rule holds or where it does not apply.
  The report shows the description alone.

<details>
<summary>More on headings, fences, and loading</summary>

- A heading names the code in its section, which runs to the next heading at its
  level or higher, so a deeper heading such as `### A bare number` stays inside
  it.
- Only a heading that is the word alone names code, in any case and with or
  without a colon: `## Never:` does, `## Never do this` does not.
- A fence can instead name its code after its language, as in `ts never`, which
  GitHub does not show. A fence's own word wins over its heading's word.
- A rule inline in a config takes the same keys, with its code under `must`,
  `never`, `should`, and `shouldNot`, and its prose under `details`.
- `loadRules(directory)` from the package root does the same load for your own
  tooling.

</details>

### Scoping a rule

`appliesTo` and `excludeIf` say where a rule applies, apart from what it asks
for. Each is a list of descriptions of code: a JSON array on one line in front
matter, or an array in a config or a TypeScript rule.

<!-- prettier-ignore -->
```md
---
description: Structured variants must be Schema.TaggedClass members of a Schema.Union, never hand-written object types joined by a tag field.
appliesTo: ["a declared union type or schema"]
excludeIf: ["a type that mirrors a third-party format whose tag key that format fixes, such as a Slack Block Kit block"]
---
```

| Key         | Jev is asked, of the code that breaks the rule | A finding stands when     |
| ----------- | ---------------------------------------------- | ------------------------- |
| `appliesTo` | whether any of it is as described              | Jev says yes to every one |
| `excludeIf` | whether all of it is as described              | Jev says yes to none      |

The questions are about the code that breaks the rule, not the whole file, so a
file with a real violation beside code an `excludeIf` describes keeps its
finding.

A yes is a probability above 0.5. At `--log-level debug`, lint logs each
finding its matchers dropped, with their scores.

> **Narrowing the description often works better.** In the preset study, Jev
> scored an `excludeIf` near 0.5 for real and false findings alike. See
> [Writing good rules](#writing-good-rules).

### Rules as TypeScript files

A rule's directory can hold a `RULE.ts` instead of a `RULE.md`. It
default-exports `defineRule({...})`, which takes the same fields as a config's
inline rule. TypeScript adds what a `RULE.md` cannot have: a
[state hook](#state-hooks), which adds to what Jev reads for the rule, and
[rule options](#rule-options), which each project that uses the rule sets.

- adhere imports a `RULE.ts`, as it imports a config, so its code runs on
  every lint.
- It can import other files by relative path, such as a helper beside it in
  its directory. The executable resolves no packages besides
  `@drkmttr/adhere`.
- A `RULE.ts` that default-exports no rule refuses the run.

### Where rules live

- Rules in the root `.adhere/rules/` apply project-wide.
- A nested `.adhere/` scopes its rules to the directory that contains it. A rule
  in `packages/api/.adhere/rules/data/brand-ports/RULE.md` has the same id,
  `data/brand-ports`, but applies only to files under `packages/api/`.
- If a nested rule has the same id as a root rule, the nearest containing
  `.adhere/` shadows the less-specific rule for that subtree. Outside that
  subtree, the root rule still applies.
- Nested `.adhere/` directories are not discovered under `node_modules/`,
  `dist/`, and the other [skipped directories](#what-gets-read).

To keep your rules with the rest of your documentation, point `rules` at a
directory such as `docs/adhere/`:

```ts
export default defineConfig({ presets: ["effect"], rules: "./docs/adhere" });
```

That directory holds a directory per rule, as `.adhere/rules/` does, and its
rules apply project-wide.

## Writing good rules

The [eval](eval/README.md#studies) measured how Jev reads a rule, on the
presets and on other repos, to catch the most violations with the fewest false
positives. It has every study. These are its lessons for writing a rule.

### Rule writing tips

- **Say "must" and "never"**, in the description and in the headings over the
  code, or "should" and "should not" for a guideline. Rewording the presets'
  descriptions this way, with a bad example per rule, was the largest gain of
  any study: at 0.8 it caught as many violations as before, with 1 wrong
  finding where there had been 5 or 6 ([study](eval/studies/must-never.md)).
- **Give one example of each kind**: one `must` block and one `never` block. A
  bad example helped every wording, and at 0.9 caught 24 violations with none
  wrong, where there had been 17
  ([study](eval/studies/rule-vocabulary.md)). Either kind alone did worse, and
  three of each did no better, for 1.58 times the tokens
  ([study](eval/studies/example-count.md)).

`adhere validate` lists each rule worded otherwise.

### What else the studies found

- **"Should" is for people, not a weaker check.** Rules written with "should"
  and with "must" scored nearly the same
  ([study](eval/studies/rule-vocabulary.md)).
- **A wrong finding is usually the rule's fault.** Above 0.8, 31 of 35 wrong
  findings repeated within a rule: a scope its words reach past, or the same
  misreading again. Fixing the wording fixes them together. Below 0.8, one-off
  misreads grow, to about one finding in six at 0.6 to 0.7
  ([study](eval/studies/presets.md)).
- **Narrow a rule in its description.** Jev scores an `excludeIf` near 0.5 for
  real and false findings alike, so it thins a rule's findings about as much as
  a higher threshold ([study](eval/studies/presets.md)). Narrowing the
  description moves the judgment itself: scoping alchemy's idempotent-delete
  rule to providers' delete handlers dropped its findings elsewhere from
  0.67–0.88 to 0.08–0.21, with nothing real lost
  ([study](eval/studies/idempotent-delete.md)).
- **Beware rules that turn on what the file does not show.** The weakest preset
  rules hinged on facts outside the file: whether a client has a default
  timeout, whether a script is an entry point, whether a key is public
  ([study](eval/studies/presets.md)). Warning below a context of 0.7 marked one
  finding in five, and those were real about half the time, where the rest were
  real three times in four ([study](eval/studies/sufficiency.md)). Make such a
  rule a warning, or give Jev the fact with
  [`typeAware` or workspace `reads`](#what-jev-reads), an
  [`appendState`](#state-hooks) hook, or an `@adhere` note.
- **Jev believes comments.** Eight of nine real violations of the
  idempotent-delete rule carried a comment wrongly saying they were fine, and
  scored 0.31 to 0.62, while without comments all nine scored 0.81 or more
  ([study](eval/studies/idempotent-delete.md)). That is why adhere takes
  comments out. A fact Jev needs, such as an exemption, goes in an `@adhere`
  note, which stays ([study](eval/studies/comments.md)).

## Generate rules from your repo

Let an agent write your first rules with you. The
[`adhere-setup`](./skills/adhere-setup/SKILL.md) skill walks the agent through
setting adhere up in your repo:

1. It reads where your conventions live: `AGENTS.md`, `CONTRIBUTING.md`, docs
   and ADRs, your lint config, recent review comments, and the code others copy
   from.
2. It drafts the conventions a normal linter cannot check as rules, each with
   real code from your repo, and sets aside the ones a linter could check.
3. It adds the presets that fit your stack, and rules from your organization's
   [shared repo](#install-rules-from-other-repos), if you have one.
4. It shows every candidate in one list, with its evidence, and imports the ones
   you choose.
5. It validates them, walks you through the first lint and what it costs, and
   adds adhere to CI.

It stops to ask you at each of those decisions, and never asks for your API key.

```sh
skills add darkmatter/adhere   # install adhere's skills for your agent
```

Then ask your agent to set adhere up.

## Install rules from other repos

An organization's rules can live in one repo's `.adhere/rules/`, and other repos
copy them in with `adhere install`:

```sh
adhere list darkmatter/standards                        # each rule there, with its description
adhere install darkmatter/standards                     # every rule
adhere install darkmatter/standards/data                # the data topic
adhere install darkmatter/standards/data/brand-ports    # one rule
adhere install darkmatter/standards#v3                  # every rule, as tagged v3
```

- Copies land in this repo's `.adhere/rules/org/repo/`, so `data/brand-ports`
  from darkmatter/standards lands in
  `.adhere/rules/darkmatter/standards/data/brand-ports/` as the rule
  `darkmatter/standards/data/brand-ports`, and two repos' rules never collide.
- The copies are the repo's own rules from then on: commit them, edit them, or
  start new rules from them. Nothing tracks where they came from.
- A later install skips a rule already there, just as init does. `--force`
  replaces its directory, edits and all.
- A rule's whole directory is copied. The source's config, its inline rules, and
  its cache are not.

> **Read what you install.** A `RULE.ts` is copied with the helpers beside it,
> and runs whenever lint does, in CI too. `adhere list` names a `RULE.ts`
> without its description, since reading the description would run the file.

The source is cloned with `git` from `https://github.com/org/repo.git`, so a
private repo needs git's credentials for GitHub, which `gh auth setup-git` sets
up. To clone over SSH instead, let git rewrite the URL:
`git config --global url.git@github.com:.insteadOf https://github.com/`.

### Creating a shared repo

`adhere init --shared org/repo` scaffolds a repo whose rules other repos copy in
with `adhere install`, instead of one that lints itself. It writes the two
example rules and no config, since install copies only rule files, and with
them:

- **`README.md`** says what the repo is for, how to install its rules, and how
  to add one.
- **`.github/workflows/adhere.yaml`** runs `adhere validate` on every push to
  main and every pull request, with the `TYPESAFE_API_KEY` secret. A pull
  request from a fork gets no secrets, so validate refuses there.
- **`alchemy.run.ts`** is an [alchemy](https://alchemy.run) stack that creates
  the GitHub repo, or adopts it, and sets that secret from `TYPESAFE_API_KEY`
  when deployed with `npx alchemy deploy`.
- **`package.json`** pins alchemy and effect, which init installs, to versions
  that work together.
- **`.gitignore`** keeps the installed packages and alchemy's state out of git.

The repo is public unless you answer yes when init asks, at a terminal, whether
to make it private. Other repos then need git's credentials for it to list and
install its rules. Without a terminal it is public: change `visibility` in the
stack to make it private.

## Presets

Built-in rule sets. Name one, or one of its topics, in the config's `presets`
or with `--preset`:

| Preset                                | Rules | For                                                   | What it asks for                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`typescript`](./presets/typescript/) | 11    | any TypeScript project                                | Data from outside checked at runtime, invalid states unrepresentable, errors never swallowed, resources released on every path, arguments not mutated, and tests that assert outcomes and stand alone.                                                                                          |
| [`react`](./presets/react/)           | 10    | components and hooks                                  | Logic for an event in its handler rather than an effect, effects that clean up and ignore stale fetches, `useSyncExternalStore` for outside stores, state that neither copies props nor contradicts itself, and Server Functions and Server Components that guard what crosses to the client.   |
| [`security`](./presets/security/)     | 4     | any project                                           | Secrets kept out of logs, error messages, and responses; parameterized SQL; no untrusted input in shell commands, `eval`, or file paths; and secrets compared in constant time. From OWASP's cheat sheets.                                                                                      |
| [`effect`](./presets/effect/)         | 16    | code written with Effect                              | Steps sequenced with `Effect.gen`, instrumentation attached with `.pipe`, config read through a service and validated, secrets redacted, branded primitives and tagged unions, defects kept apart from typed errors, services built by layers, and tests with their own layers and `TestClock`. |
| [`alchemy`](./presets/alchemy/)       | 41    | code that deploys with [alchemy](https://alchemy.run) | Where Config and bindings are read, which resources keep their data, how secrets stay out of bundles and logs, authorization on public URLs, migrations, durable workflows, and custom providers.                                                                                               |

- Name presets in the config's `presets`, or on the command line with
  `--preset`, repeated or separated by commas, as in `--preset effect,alchemy`.
  Naming presets on the command line makes the config file optional, and
  presets named in both places apply together.
- A topic, one of a preset's subdirectories, is a preset of its own:
  `--preset effect/basics` applies only the rules under
  `presets/effect/basics/`, and `alchemy/secrets` applies only alchemy's
  secrets rules. `security` has no topics.
- To change a preset's rule without copying it, use [Overrides](#overrides).
- [presets/README.md](./presets/README.md) lists every rule in each preset,
  with a one-line summary and a link to the full rule.

<details>
<summary>What every preset does</summary>

- It has no rules for what a linter checks exactly.
  [presets/README.md](./presets/README.md) names the lint rules to turn on
  instead.
- A preset rule says "must" only where its source makes a requirement, and
  "should" where the source gives advice.
- A topic's rules keep the ids they have in the whole preset, so a topic and its
  preset share cached judgments, and naming both applies each rule once.
- `effect` and `alchemy` have no rule that `typescript` or `security` already
  has, so a project on Effect or alchemy names `typescript` and `security` too.

</details>

## Reading the report

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

**Low context.** Jev sees the file and what adhere [reads](#what-jev-reads)
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
  one in five of all findings ([study](eval/studies/sufficiency.md)). Check what
  the code relies on outside the file before acting on such a finding.
- Give Jev a fact it lacks with an `@adhere` note (see [Comments](#comments)).
- Change the threshold with `sufficiencyThreshold` in the config, or with
  `--sufficiency-threshold` for one run.

## Config

A config file is optional. Without one, adhere reads the rules in
`.adhere/rules/` and any `--preset`. A config names presets, sets the model,
the thresholds, and what Jev reads, or gives rules inline. Put it in the
working directory of the repo being audited, at one of these paths (keep one):

- `.adhere/config.ts`, the default, next to the rules
- `adhere.config.ts`
- `.adhere.config.ts`

```ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  threshold: 0.8,
  presets: ["effect"],
  exclude: ["**/generated/**"],
  overrides: { "effect/basics/instrument-with-pipe": "off" },
  rules: {
    "data/brand-meaningful-primitives": {
      description:
        "A primitive with semantic meaning, such as an id, email, URL, port, or count, must be a branded schema.",
      must: `
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
`,
      never: "type UserId = string",
      threshold: 0.8,
    },
  },
});
```

Every key, grouped by what it changes:

**What adhere loads**

- `presets` — default: none. Built-in rule sets, or their topics. See
  [Presets](#presets).
- `rules` — default: `.adhere/rules/`. Rules inline, as above, or a directory
  (see [Where rules live](#where-rules-live)). Either form replaces
  `.adhere/rules/`: none of its rules, root or nested, is read then.
- `overrides` — default: none. Settings for a rule by its id. See
  [Overrides](#overrides).
- `exclude` — default: none. Globs, relative to the working directory, for
  files no rule judges.
- `instructions` — default: `.adhere/instructions/`, then
  `.agents/instructions/`. Instructions directory relative to the config file,
  used by `adhere postinstall`.

**Thresholds**

- `threshold` — default: `0.8`. Report a rule when Jev's probability is above
  this.
- `sufficiencyThreshold` — default: `0.6`. Below it, a finding warns that Jev
  may not see enough to decide.

**What Jev reads**

- `reads` — default: `["workspacePackages"]`. The workspace context Jev
  reads. See [What Jev reads](#what-jev-reads).
- `typeAware` — default: `false`. Add the compiler's `symbols` and
  `references`, as `--type-aware` does.
- `includeComments` — default: `false`. Send every comment to Jev. See
  [Comments](#comments).
- `maxSymbolDocumentationLength` — default: `256`. Maximum characters of each
  symbol's combined documentation and JSDoc tags, before `maxSymbolLength`
  applies. A non-negative integer; `0` omits them.
- `maxSymbolLength` — default: `256`. Maximum characters of each complete
  `symbols[name]` string, including type signatures and documentation. A
  non-negative integer; `0` leaves names with empty content.

**Model**

- `model` — default: `"jev-latest"`. The model id sent to TypeSafe AI.
- `provider` — default: TypeSafe AI's Jev. Where the questions go instead, with
  its own model. See [Providers](#providers).

An invalid shape refuses the run. A config can import other files by relative
path, but no packages besides `@drkmttr/adhere`: the executable does not
resolve `node_modules`.

<details>
<summary>More on types in the editor</summary>

- `defineConfig` types the config for the editor and returns it as it is.
  `satisfies Config`, with `import type { Config }`, does the same.
- The executable supplies `@drkmttr/adhere` to the config whether or not the
  repo has the package installed. The editor's types come from the package,
  which `adhere init` adds as a dev dependency.
- A tsconfig's globs skip dot directories, so the editor opens
  `.adhere/config.ts` outside any project, where it cannot resolve the package's
  types: they are reached only by `bundler`, `node16`, or `nodenext` resolution.
  `adhere init` writes `.adhere/tsconfig.json`, a project for the config and any
  [rules written in TypeScript](#rules-as-typescript-files), with `bundler`
  resolution. For a config written by hand, add that file, or include
  `.adhere/config.ts` in a tsconfig that resolves the same way.

</details>

### Overrides

Use `overrides` to change a rule without copying its text into `rules`. Name
the rule by the id the report shows. A preset rule's id starts with the
preset's name, as in `alchemy/providers/idempotent-delete`:

```ts
export default defineConfig({
  presets: ["effect", "alchemy"],
  overrides: {
    "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
    "effect/basics/instrument-with-pipe": "off",
  },
});
```

| Value                           | Effect                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `"off"`                         | drops the rule                                                                         |
| `"warning"`, `"error"`          | sets its level                                                                         |
| `{ level, threshold, options }` | sets any of them; `options` only for a rule that takes them ([options](#rule-options)) |

An id that no preset or project rule has refuses the run, so a typo does not go
unnoticed. A rule of a preset that the run does not name is accepted.

### Precedence

For the model and the threshold, highest first:

1. `--threshold` on the command line
2. the config file
3. presets, in order (a later preset wins)
4. the defaults, `jev-latest` and `0.8`

For one rule:

- A rule's own `threshold` beats all of the above for that rule.
- An entry in `overrides` beats the rule's own `threshold` and `level`.
- A rule in `rules` replaces a preset rule with the same id.

`--sufficiency-threshold` beats the config's `sufficiencyThreshold`, which beats
the default, `0.6`.

## Running lint

`adhere lint` judges the TypeScript files under the working directory against
your rules, and prints a [report](#reading-the-report) of what it finds. It
asks before it sends anything.

### Before and during a run

Before it judges anything, `lint` says on stderr what it found and what judging
takes, and asks:

```text
200 files and 14 rules: 2800 checks, 1400 cached.
Judging 100 files takes an estimated 100 requests to Jev, plus 1 or more for each file with a finding.
Those carry about 1.9 million input tokens: about $0.08 at $0.042 per million, and more for locating findings.
Estimates cover only code and workspace-package context; symbol/reference input, possible extra request splits, and size-skips are determined at send time.
? Estimates cover only code and workspace-package context; symbol/reference input, possible extra request splits, and size-skips are determined at send time. Send an estimated 100 requests to Jev, about $0.08? › (Y/n)
```

- It asks only when stdin and stdout are terminals, and only when there is
  something to send. `--yes` sends without asking.
- The cost is adhere's estimate of the input tokens times the model's price.
  Jev charges only for input tokens: $0.042 a million for `jev-latest`, per
  [TypeSafe AI's models page](https://docs.typesafe.ai/models) in
  September 2026. When type awareness is enabled, the estimate leaves out
  `symbols` and `references`, which adhere reads as it sends each file, so a
  run can cost more than it says.
- A run that stops loses nothing: files finished before it stopped are cached,
  so running again continues from there.

<details>
<summary>More on unknown prices and blocked files</summary>

- For a model adhere has no price for, the plan gives the tokens alone.
- The firewall in front of Jev's API can refuse a request whose code reads to
  it as an attack, with a 403 and an HTML page rather than Jev's JSON. It
  refuses the same request every run, so that file is skipped, the run goes on,
  and the report lists each such file with Cloudflare's Ray ID, which
  TypeSafe AI can look the block up by.
- When only the question that finds the line is refused, the file's judgments
  are kept, and a rerun sends that question alone.

</details>

### What gets read

- `adhere lint` reads the TypeScript files under the working directory: `.ts`,
  `.tsx`, `.mts`, and `.cts`. It does not read declaration files such as
  `.d.ts`, adhere's own config files, or JavaScript.
- When the working directory contains `agents/`, `apps/`, or `packages/`, only
  those trees are read.
- Below the working directory, anything under `node_modules/`, `dist/`,
  `coverage/`, `vendor/`, `e2e/`, `references/`, `.adhere/`, `.agents/`,
  `.claude/`, `.direnv/`, `.alchemy/`, or `.vite/` is skipped. The directories
  above the working directory do not count.
- `.gitignore` is not consulted.
- A config's `exclude` lists globs, relative to the working directory, of files
  no rule judges, such as generated code. It leaves them out of every run, as
  `--filter '!<glob>'` leaves them out of one:

  ```ts
  export default defineConfig({ exclude: ["**/generated/**"] });
  ```

**Tests** are judged only by rules about tests, whose front matter says `tests`
(see [Rules as Markdown files](#rules-as-markdown-files)). A test is:

- a `.test` or `.spec` file, such as `a.test.ts` or `Button.spec.tsx`;
- a fixture or test helper named as one, such as `fixtures.ts`,
  `GitHubHttpFixtures.ts`, `ledger-copy.fixture.ts`, `linear-test-helpers.ts`,
  or `test-utils.ts`;
- any file under a `test/`, `tests/`, `__tests__/`, `testing/`, `fixtures/`,
  `fixture/`, `__fixtures__/`, or `__mocks__/` directory.

### Flags

| Flag                                                     | What it does                                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--preset <names>`                                       | Add built-in rule sets, or their topics. The config becomes optional. See [Presets](#presets).                          |
| `--threshold <0 to 1>`                                   | Replace the config's threshold. Per-rule thresholds still apply.                                                        |
| `--sufficiency-threshold <0 to 1>`                       | Replace the config's `sufficiencyThreshold`: a finding warns when its `context` is below it.                            |
| `--type-aware`                                           | Add the compiler's `symbols` and `references`. See [What Jev reads](#what-jev-reads).                                   |
| `--yes`, `-y`                                            | Send the requests without asking first.                                                                                 |
| `--limit <files>`, `--rpm <requests>`, `--filter <glob>` | Bound how many files a run judges, how fast it sends, and which files it judges. See [Limiting a run](#limiting-a-run). |
| `--deny-warnings`                                        | Fail on warnings as well as errors.                                                                                     |
| `--log-level <level>`                                    | Log the run's work on stderr. See [Logging a run](#logging-a-run).                                                      |
| `--json`, `--md`                                         | Write one JSON or Markdown file per violated rule to `.adhere/reports/`.                                                |
| `--stdout`                                               | Print one combined report instead of files; use with `--json` or `--md`.                                                |

### JSON and Markdown reports

```sh
adhere lint --json
adhere lint --md
adhere lint --json --md
adhere lint --json --stdout > report.json
adhere lint --md --stdout > report.md
```

`--json` and `--md` write one file per violated rule under `.adhere/reports/`
by default. Both errors and warnings are included. Filenames URL-encode the
rule id: `data/ports` becomes `data%2Fports.json` or `data%2Fports.md`.
Use both flags together to write both formats. File output leaves stdout
empty and prints the destination on stderr.

Add `--stdout` to print all findings together as one JSON object or one
Markdown document, without writing or replacing report files. Choose one
format when using `--stdout`; mixing JSON and Markdown would make the JSON
unparseable. Without a format flag, lint keeps its usual terminal report.
Progress, prompts, and logs stay on stderr.

JSON reports include `findings`, file counts (`files`, `judged`, `cached`,
`skipped`, `waiting`), `blocked` files, the `suppressed` finding count, and
`threshold` and `sufficiencyThreshold`. A rule file contains only that rule's
findings, while the file counts describe the whole run. Each finding includes
its rule id, severity (`level`), description, file, line ranges, excerpt,
examples, confidence (`probability`), threshold, and context score when
available. Markdown includes locations, scores, code excerpts, examples,
and a summary. Paths are relative to the working directory; preset rule ids
include the preset name.

The generated `.adhere/reports/` directory is replaced on each completed
file-output run, including filtered or limited runs. A run with no findings
leaves it empty. Keep hand-written files elsewhere, and add `.adhere/reports/`
to `.gitignore` if reports should stay local.

All output modes preserve the usual exit codes; reports are produced even
when findings fail the run. `--limit 0` only prints the plan on stderr,
produces no report, and leaves existing report files untouched.

### Limiting a run

Three flags bound what a run does:

- **`--limit <files>`** sends requests for at most that many files, taken in
  path order. The rest wait. Since judgments are cached, the next run with the
  same limit picks up where this one stopped. `--limit 0` shows the plan and
  sends nothing. It counts files, not requests: one file can take several.
- **`--rpm <requests>`** sends at most that many requests to Jev a minute,
  evenly spaced, retries included. The plan says about how long they take.
- **`--filter <glob>`** judges only the files whose path from the working
  directory matches, such as `src/**` or `**/*.service.ts`. Wrap a glob in
  single quotes so the shell does not expand it. Repeat the flag for more
  globs, and start one with `!` to leave out what it matches.

```sh
adhere lint --filter 'packages/api/**' --filter '!**/generated/**' --limit 100 --rpm 30
```

### Logging a run

`--log-level` logs the run's work on stderr:

- **`debug`** logs the config it loaded, how many paths it listed, and how many
  of them it reads. It logs each request to Jev, with the file it is for, about
  how many tokens it carries, and how long it took. A failed attempt is logged
  even when a retry hides it, with the HTTP status, Cloudflare's Ray ID, and
  the start of what the API said.
- **`trace`** also logs each file as it is read, planned, and answered from the
  cache.

stdout still carries only the report, so the log can go to a file of its own:

```sh
adhere lint --log-level debug 2> adhere.log
```

### Exit codes

| Code | When                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Nothing is reported, or only warnings.                                                                                                         |
| 1    | An error is reported. With `--deny-warnings`, a warning too.                                                                                   |
| 1    | The run refuses, for example on an invalid config or rule file, a missing API key, or an unknown command or flag. A refusal prints its reason. |

## Commands

| Command                           | What it does                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adhere lint`                     | Audit the working directory. See [Running lint](#running-lint).                                                                                                                                                    |
| `adhere validate`                 | Check the rules' wording, list rules a linter could check, and ask Jev whether any contradict. See [Validating rules](#validating-rules).                                                                          |
| `adhere postinstall`              | Render instruction files into a managed block in `AGENTS.md`. See [Compose your AGENTS.md](#compose-your-agentsmd).                                                                                                |
| `adhere rules create [idea]`      | Write a rule with a local coding agent's help (`claude`, `codex`, or `omp`): judge excerpts it finds, get a `RULE.md` or `RULE.ts`; org rules are pushed to the shared repo for a PR. `--setup` re-picks defaults. |
| `adhere init [--force]`           | Scaffold `.adhere/config.ts` and two example rules. See [Init](#init).                                                                                                                                             |
| `adhere init --shared org/repo`   | Scaffold a repo of rules other repos install. See [Creating a shared repo](#creating-a-shared-repo).                                                                                                               |
| `adhere list org/repo`            | List the rules in another repo's `.adhere/rules/`. See [Install rules from other repos](#install-rules-from-other-repos).                                                                                          |
| `adhere install org/repo`         | Copy those rules into this repo's `.adhere/rules/org/repo/`.                                                                                                                                                       |
| `adhere login`, `adhere logout`   | Save or delete a TypeSafe AI API key, or with `--openai`, an OpenAI one. See [Login](#login).                                                                                                                      |
| `adhere skill [docs\|setup\|fix]` | Print an agent skill. See [Agent skills](#agent-skills).                                                                                                                                                           |

Bare `adhere` prints the help. `adhere <command> --help` lists a command's
flags, and `adhere --completions <shell>` prints a completion script.

## Validating rules

`adhere validate` checks your rules three ways:

```sh
adhere validate                  # your rules
adhere validate --preset effect  # your rules beside a preset's
```

- **Wording.** It lists each rule whose wording differs from what the
  [rule writing tips](#rule-writing-tips) recommend, with its file and what
  differs.
- **The linter check.** While `lint` judges a file against one of your rules,
  it also asks Jev whether a linter or type checker could decide the rule
  exactly. It stops after 10 files per rule, and `validate` reports a rule once
  it has all 10 answers. A rule flagged on 7 or more of them probably belongs in
  a regular linter. One flagged on 3 to 6 reads differently from file to file:
  make its description say more precisely what it applies to. Preset rules are
  left out.
- **Contradictions.** It asks Jev about each pair of rules that apply to the
  same files. When there is such a pair, it needs the API key, as `lint` does.

Wording and the linter check are advice and never fail `validate`. A
contradiction fails it with exit code 1, so `validate` can gate a pull request
that adds a rule. The workflow that
[`adhere init --shared`](#creating-a-shared-repo) writes does this.

Two rules contradict when no code can follow both, such as one that says errors
must be thrown and one that says they must be returned. Each rule reads fine on
its own, so a contradiction shows up only as code that breaks one rule or the
other, whatever you do. `validate` finds it before `lint` does:

```text
Found 1 contradiction among configured rules:

1. No code can follow both (0.91):
   - errors/throw-tagged-errors (/repo/.adhere/rules/errors/throw-tagged-errors/RULE.md)
     A function that fails must throw a tagged error, never return an error value.
   - errors/return-results (/repo/packages/api/.adhere/rules/errors/return-results/RULE.md)
     A function that fails must return a Result, never throw.

Resolve by editing one rule, narrowing a nested rule's scope, or using the same rule id when the nested rule is meant to shadow the root rule.
```

Two rules with the same id are never compared: a nested rule that shares an id
shadows the other on purpose.

## Live evals

Try a change to a rule on your own code before you rely on it: run the current
rule and the changed one side by side, and compare what each flags.

1. Copy the rule's directory under a new id:

   ```sh
   cp -r .adhere/rules/data/brand-ports .adhere/rules/data/brand-ports-next
   ```

2. Give the copy `level: warning` in its front matter. Its findings show in
   amber and never fail the run, so the experiment can sit in the repo, and in
   CI, while you watch it.
3. Change the copy: its description, its examples, its `appliesTo` or
   `excludeIf`. To try giving Jev more to read, make the copy a `RULE.ts` with
   an [`appendState`](#state-hooks) hook.
4. Run `adhere lint`, or `adhere lint --filter '<glob>'` to try it on part of
   the repo first, and compare the two rules' findings on the same files.

Judge the two by recall, the share of real violations each catches, and
precision, the share of its flags that are real. Check the findings by hand, or
with the [`adhere-fix`](./skills/adhere-fix/SKILL.md) skill, which verifies each
one against its rule and the code. Then keep the better version under the
original id, and delete the other.

- **The copy costs nothing until you change it.** Judgments are cached by the
  rule's text, not by its id, its level, or its threshold, so a copy that reads
  the same as the original answers from the original's cache. Each change after
  that judges the copy, and only the copy, once per file.
- **Keeping the winner is free.** Moving the winning text to the original id
  reuses its cached judgments.
- **Counting each rule's findings** takes a pipe:
  `adhere lint --yes | grep -c 'data/brand-ports-next:'`.

## State Hooks and Type-Awareness

Jev judges a file from its state: the file's `code`, and maps of context beside
it. The config chooses the maps every rule reads (see
[What Jev reads](#what-jev-reads)). A rule written in TypeScript can add state
of its own with a hook (see [State hooks](#state-hooks)), and take settings
from each project that uses it (see [Rule options](#rule-options)).

### What Jev reads

The state sent for one file, `packages/orders/src/total.ts`, with every map
on and each map's `__comment` cut short:

````json
{
  "code": {
    "1": "import { formatCents } from \"money\";\nimport { sum } from \"./sum\";\n\nexport const total = (prices: number[]): string => formatCents(sum(prices));\n"
  },
  "workspacePackages": {
    "__comment": "Workspace packages imported by `code`; …",
    "money": "packages/money"
  },
  "dependents": {
    "__comment": "What depends on the file `code` holds. …",
    "packages": { "web": "packages/web" },
    "files": ["packages/orders/src/index.ts"]
  },
  "symbols": {
    "__comment": "Compiler-rendered types and documentation for symbols used in `code`; …",
    "formatCents": "```typescript\n(cents: number) => string\n```\n\nFormats cents as dollars, as in `$12.50`.",
    "prices": "```typescript\nnumber[]\n```",
    "sum": "```typescript\n(values: number[]) => number\n```",
    "total": "```typescript\n(prices: number[]) => string\n```"
  },
  "references": {
    "__comment": "Declarations of symbols used in `code`. …",
    "formatCents:packages/money/src/index.ts": "export const formatCents = (cents: number): string => `$${(cents / 100).toFixed(2)}`;",
    "sum:packages/orders/src/sum.ts": "export const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);"
  },
  "__comment": "Only `code` is the audit target; it is split into numbered sections. All other state entries provide context, not additional code to audit."
}
````

- **`code`** is always sent: the file's [sections](#how-a-file-is-judged),
  numbered from 1, without [comments](#comments) unless `includeComments` is
  on.
- **`workspacePackages`**, on by default: the repo's own packages the file
  imports, each with its directory. A package the file imports that is not
  listed is an installed one.
- **`dependents`**, off by default: the workspace packages whose
  `package.json` depends on the file's package, and up to 50 files that import
  the file by a relative path, with `omittedFiles` counting the rest. Imports
  by package name or `tsconfig` path alias do not count, nor do files that
  `--filter` or `exclude` leaves out. To find them, lint reads every file once
  more before it plans.
- **`symbols`**, with type awareness: the compiler's type of each name the
  code uses, with its documentation and JSDoc tags, leaving out
  standard-library and runtime built-ins. `maxSymbolLength` and
  `maxSymbolDocumentationLength` cap each one (see [Config](#config)).
- **`references`**, with type awareness: the whole declaration of each symbol
  the code uses from another file of the repo, keyed by the name the code uses
  and the declaring file's path. A function comes with its body, a method
  without the rest of its class.
- **`__comment`**, in each map and a rule's [`options`](#rule-options), tells
  Jev what the map holds. The top-level one says only `code` is judged. adhere
  adds them before a [state hook](#state-hooks) runs, and again to any map the
  hook returns without one.

`reads` in the config chooses the workspace maps, and `typeAware` adds the
compiler's:

```ts
// .adhere/config.ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  reads: ["workspacePackages", "dependents"], // default: ["workspacePackages"]
  typeAware: true, // or --type-aware; off by default
});
```

- `reads: []`, with type awareness off, sends the code alone. Neither
  workspace map needs the compiler.
- `typeAware` adds `symbols` and `references` whatever `reads` says. The
  compiler uses each file's `tsconfig.json`, and works without one.
- An unknown name in `reads` refuses the run. Only the config has `reads`.
- A rule's description can name a map in backticks, as Jev's questions name
  `code`. To give Jev something no map covers, such as another file, add it
  with a [state hook](#state-hooks).
- `adhere lint --log-level debug` logs a run's first request in full.

**Cost and privacy.** Type awareness sends Jev more than the file it judges:
whole declarations from other files, and the compiler's documentation and JSDoc
tags in `symbols`, even with `includeComments` off. It also starts the native
compiler during the run. The plan's estimate leaves those tokens out.

<details>
<summary>Where the packages come from</summary>

- The packages are read on every run from the working directory's
  `package.json`, whose `workspaces` npm, Bun, and Yarn read, and from
  `pnpm-workspace.yaml`'s `packages`.
- In a pattern, `*` is any directory and `**` any depth of them, and one that
  starts with `!` leaves out what it matches. Each matched directory's
  `package.json` gives the name, and its directory is given from the working
  directory.
- Nothing need be installed, so a run in CI reads the same packages as one on a
  laptop.
- A working directory that is not a workspace's root has none.
- Only an import whose path is a plain string counts, and one of a subpath, such
  as `orders-core/client`, counts as its package's.

</details>

### State hooks

A rule can add to what Jev reads for it with `appendState`, a hook in its
[`RULE.ts`](#rules-as-typescript-files) or in a config's inline rule:

```ts
// .adhere/rules/data/columns/RULE.ts
import { defineRule } from "@drkmttr/adhere";

export default defineRule({
  description:
    "A query must name only columns its table has in `schema`, and never a column it lacks.",
  must: 'db.select("id", "email").from("users")',
  never: 'db.select("mail").from("users")',
  appendState: async (state, file, Bun) => ({
    schema: await Bun.file("db/schema.sql").text(),
  }),
});
```

- The hook runs right before each request about the rule goes out. It gets the
  request's state, the file the request is about, and Bun's API. What it
  returns is spread over the state.
- The description can name a key the hook adds, in backticks, as the questions
  name `code`.
- A rule with a hook goes to Jev in requests of its own, so only that rule reads
  what its hook adds. Each of those requests sends the file and its context
  again.
- What the hook reads outside the file is not part of the cache. When
  `db/schema.sql` changes, a file already judged is not judged again until it
  or the rule changes.

<details>
<summary>More on the hook</summary>

- `state` is what Jev reads beside each question: `code`, the file's sections
  as Jev reads them, under their numbers from 1, as in
  `{ code: { "1": "import …", "2": "export const …" } }`, beside the maps
  [What Jev reads](#what-jev-reads) lists.
- `file` is the file's absolute `path`, and its `contents` as written, comments
  and all.
- Nothing the hook returns is checked, so it can change `code` too, or replace
  it. A hook can break its own rule's answers, and adhere does not stop it.
- It can be async. A hook that throws refuses the run, naming the rule.
- The plan counts the rule's requests, but not the tokens a hook adds, which are
  not known until it runs. A request over Jev's context skips the file, as a
  file too long does.
- `Bun` is typed when `@types/bun` is installed and `.adhere/tsconfig.json`
  lists it, as `"types": ["bun"]`. Otherwise it is `unknown`.

</details>

### Rule options

A `RULE.ts` can take settings from each project that uses it, such as which
paths run on the edge. It declares them as `options`, with an Effect Schema, and
a config sets them under the rule's id in [`overrides`](#overrides):

```ts
// .adhere/rules/edge/no-node/RULE.ts
import { defineRule, Schema } from "@drkmttr/adhere";

export default defineRule({
  description: "A file under a path in `options.edgePaths` must never import a `node:` module.",
  never: 'import { readFileSync } from "node:fs";',
  options: Schema.Struct({ edgePaths: Schema.Array(Schema.String) }),
});
```

```ts
// .adhere/config.ts
export default defineConfig({
  overrides: { "edge/no-node": { options: { edgePaths: ["src/edge", "workers"] } } },
});
```

- Jev reads the decoded settings as `options`, so the description can name them
  in backticks. A rule's `appendState` gets them too, in its `state`.
- A key the schema does not make optional must be set. An unset or invalid
  option refuses the run, naming the rule. Options set for a rule that takes
  none also refuse it.
- A rule with options goes to Jev in requests of its own, as one with a hook
  does. Each of those requests sends the file and its context again.
- Changing a rule's options judges that rule again, and no other.
- The plan counts the tokens options add. A file whose options leave no room
  for a question is skipped before any request.
- `Schema` is Effect's, re-exported by adhere. A `RULE.ts` needs no `effect` of
  its own, and decodes with the same copy adhere does.
- A `RULE.md` cannot take options.

## Providers

adhere asks TypeSafe AI's Jev by default. A provider asks another decision model
instead, and adhere exports one for each model
[the providers study](eval/studies/providers.md) measured:

```ts
import { defineConfig, openai } from "@drkmttr/adhere";

// Asks with OPENAI_API_KEY, or the key `adhere login --openai` saved.
export default defineConfig({ provider: openai() });
```

| Provider     | Asks                                                            | Options                          |
| ------------ | --------------------------------------------------------------- | -------------------------------- |
| `jev`        | TypeSafe AI's Jev, `jev-latest` by default                      | `apiKey`, `model`                |
| `openai`     | OpenAI's `gpt-6-luna`, on its Decisions API                     | `apiKey`, `model`                |
| `cloudflare` | Cloudflare's `clef`, by default, or `clef-flash`, on Workers AI | `accountId`, `apiToken`, `model` |

- Without an `apiKey`, `jev` and `openai` ask with the key from
  [Login](#login).
- Each provider also takes `fetch`, the function that sends its requests.
- Clef cuts a request too long for it short rather than refuse it, so
  `cloudflare` skips a file whose request reaches clef's limit: 64,000 tokens,
  or 24,000 for clef-flash.

<details>
<summary>Writing a provider</summary>

A provider is a model's name, and an `ask` that answers adhere's questions
about a state:

```ts
import { defineConfig, type Provider, RequestFailed } from "@drkmttr/adhere";

const mine: Provider = {
  model: "my-decision-model",
  ask: async (state, questions, { signal }) => {
    const response = await fetch("https://decisions.example.com/v1/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, questions }),
      signal,
    });
    if (!response.ok) {
      throw new RequestFailed(`My model answered HTTP ${response.status}`, response.status);
    }
    return { answers: await response.json() };
  },
};

export default defineConfig({ provider: mine });
```

- `state` is the file's code by section under `code`, beside what adhere read
  for it.
- Each question has an `id`, the `question` as adhere phrases it, and the
  `fields` it names in backticks, such as `rule`, `must`, and `never`. A
  `noul` asks whether something holds. A `choice` asks for the key of one of
  its `options`. Its `options` can hold just one entry.
- `ask` returns `{ answers }`: by id, a `noul`'s probability from 0 to 1, or a
  `choice`'s key. An id left out goes unanswered: its rule is not reported, and
  is asked again on the next run.
- A rejection stops the run, but for three errors adhere exports:
  `ContextOverflow` gets one retry without `references` when that map is
  present; if the request still overflows, the file is skipped.
  `RequestBlocked` reports it blocked, and `RequestFailed` is tried again, up
  to three times, when its `status` is 0, for no answer, or a 408, 429, or 5xx.
- adhere paces calls with `--rpm`, aborts `signal` after 30 seconds, and splits
  requests to fit Jev's 64,000 tokens. A model that takes less splits further
  in its `ask`.
- `model` replaces the config's `model`. The cache keeps answers by it, so a
  new model is asked again.
- A provider that sets `savedKey` to `"typesafe"` or `"openai"` gets that key
  as `apiKey`.
- The executable resolves no packages besides `@drkmttr/adhere`, so an `ask`
  uses `fetch` rather than an SDK.

</details>

## Comments and suppressions

### Comments

Jev reads a file's code, not its comments. adhere takes every comment out before
it hashes or sends a file, or a declaration from
[`references`](#what-jev-reads), blanking each one so every line keeps its
number. The report's excerpts still show comments. Compiler-provided
documentation and JSDoc tags still reach Jev in the type and documentation
strings that [`symbols`](#what-jev-reads) sends when type awareness is on.
These strings are not editor hovers.

Jev takes what comments claim at their word, which hid real violations in the
studies: see [Writing good rules](#writing-good-rules).

A comment that says `@adhere` anywhere in it is a note for Jev, and stays. Write
one for a fact the code relies on that the file cannot show, once you have
checked it, with how you know:

```ts
/**
 * Deletes the activity. @adhere DeleteActivity succeeds on a missing
 * activity, so no not-found error needs catching; probed 2026-09-25.
 */
```

- A note informs Jev. It suppresses nothing, and Jev still judges the code
  around it.
- `includeComments: true` in the config sends every comment, for a project whose
  rules are about comments, such as doc comments on exports.

### Suppressing a finding

Suppress a finding Jev got wrong with a comment in the code that says why:

```ts
// adhere-ignore alchemy/providers/idempotent-delete -- DeleteActivity succeeds on a missing activity; probed 2026-09-25
delete: Effect.fn(function* ({ output }) {
  yield* sfn.deleteActivity({ activityArn: output.activityArn });
}),
```

| Comment                                       | What it covers                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adhere-ignore`, on a line of its own         | The statement that starts on the next line of code: above, the whole handler, wherever in it Jev points, since the lines it points at can move between runs. |
| `adhere-ignore`, at the end of a line of code | The statement that starts on that line.                                                                                                                      |
| `adhere-ignore-file`, anywhere in a file      | The whole file. The rules it names are not judged there at all.                                                                                              |

- A comment names rules as a report does, separated by commas.
- What follows `--` is the reason, for whoever reads the code next.
- A finding without lines is covered when its section overlaps the statement.
- Jev never reads these comments, even with `includeComments: true`.
- The summary counts the findings they suppress.

## Agent skills

Three skills teach an agent to work with adhere:

- **[`adhere`](./skills/adhere/SKILL.md)**, printed by `adhere skill`, is the
  reference: the commands, how to write and word a rule, the config, presets,
  shared rules, comments and suppressions, the cache, reading a report, and
  tuning a rule.
- **[`adhere-setup`](./skills/adhere-setup/SKILL.md)**, printed by
  `adhere skill setup`, sets adhere up in a repo with you. See
  [Generate rules from your repo](#generate-rules-from-your-repo).
- **[`adhere-fix`](./skills/adhere-fix/SKILL.md)**, printed by
  `adhere skill fix`, verifies and fixes the findings `lint` reports: it
  checks each against its rule and the code, fixes the real ones, reports the
  false ones with the evidence, and says when a rule is wrong more often than
  right.

Install them with the [skills](https://github.com/vercel-labs/skills) CLI:
`skills add darkmatter/adhere`. The binary carries all three, so
`adhere skill fix > .agents/skills/adhere-fix/SKILL.md` works without a
checkout.

### In CI

Pipe the fix skill into an agent that runs without asking. The skill tells it
that invoking the skill permits every `adhere lint` run and its cost, and
`adhere skill fix` prints the skill of the adhere that runs, so its flags
match:

```sh
adhere skill fix | codex exec --yolo
adhere skill fix | claude -p --dangerously-skip-permissions
```

Both turn off the agent's own permission checks, which suits a runner thrown
away after the job. To keep Codex in its sandbox, let the sandbox reach
`api.typesafe.ai`:

```sh
adhere skill fix | codex exec --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true -c approval_policy=never
```

- Set `TYPESAFE_API_KEY` from a secret.
- The agent adds no `adhere-ignore` comments or `@adhere` notes unless
  `ADHERE_ALLOW_SUPPRESSIONS=1` is set in its environment, as in
  `adhere skill fix | ADHERE_ALLOW_SUPPRESSIONS=1 codex exec --yolo`. It then
  suppresses a finding it shows is false, or that three fixes did not clear,
  with the evidence in the comment. Without it, the agent leaves those
  findings, and its report ends by naming them and the variable.
- End the job with `adhere lint --yes`. The agent exits 0 whatever it left, so
  this step passes or fails the job. It judges only the files the agent
  changed, and reads the rest from the cache.

> **Do not run it on pull requests from forks.** The agent reads their code
> with your secrets in reach and the network open, so code written to steer it
> can send them out.

## Cache

Judgments are cached in `.adhere/cache/`. **Commit it.** Every judgment is a
paid request, and Jev's answers vary a little from run to run, so a committed
cache gives everyone and CI the same findings without paying for them again,
and a pull request changes the judgments of only the files it changes.

| What changed                                                                                                                    | What is judged again                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A file's code                                                                                                                   | Every rule, for that file.                                                       |
| A file's comments alone                                                                                                         | Nothing.                                                                         |
| A file is moved or copied                                                                                                       | Nothing. Identical files share their judgments.                                  |
| A rule's text, a matcher, the source of its `appendState`, or its options                                                       | That rule, for every file.                                                       |
| The config's `reads`, `typeAware`, `maxSymbolLength`, or `maxSymbolDocumentationLength`, and `includeComments` with `typeAware` | Every rule, once.                                                                |
| What the reads find: a file it imports, the workspace's packages, the file's `dependents`                                       | Nothing, so a judgment can go stale. Delete the cache to judge every file again. |
| The threshold is lowered                                                                                                        | Nothing. Cached judgments newly above it are located.                            |
| adhere asks its questions differently, after an upgrade                                                                         | Every rule, once.                                                                |

To keep the cache out of diffs, mark it as generated in `.gitattributes`:

```text
.adhere/cache/** linguist-generated -diff
```

> **Where lint gates a merge.** Anyone who can commit can also write a cache
> file saying that code passes. Lint a pull request against the cache as merged,
> not as the pull request has it. Only the files it changes are judged again:
>
> ```sh
> rm -rf .adhere/cache && git checkout origin/main -- .adhere/cache
> adhere lint --yes
> ```

<details>
<summary>How the cache is stored and pruned</summary>

- `files/` holds Jev's answers by the content they are about. Each cache file
  is named for the hash of a source file's content as Jev reads it, without
  its comments.
- Each answer sits under a fingerprint of the model and the rule: its text,
  its matchers, and its `appendState`'s source.
- `tallies/` keeps the linter check's answers, one tally per rule, under a key
  that changes with the rule's text and the model.
- A cache file is written once and never changed: it is also named for the hash
  of its own text. Two branches that judge the same code add files rather than
  edit them, so git merges the cache without a conflict.
- After a run that reads every file, adhere prunes the cache: it deletes answers
  about content no file has, and folds what is left into one file per content. A
  run narrowed by `--filter` does not prune.
- Pruning keeps answers to rules the run left out, so a run with other presets
  or rules, or with one topic, loses nothing another run still asks. It keeps
  answers to a rule's old texts too, until the content they are about is gone.
- It also keeps answers about a file the run read but judged against no rule,
  such as a test when no rule judges tests. A file the config excludes is not
  read, so answers about it go.

</details>

## How a file is judged

1. **Split.** adhere splits the file into sections of whole statements, in runs
   of at most 30 lines.
2. **Judge.** One request per file asks Jev, for each rule, how likely the file
   is to break it.
3. **Locate.** A second request, only for rules above their threshold, asks
   which section and lines break the rule, and whether Jev sees enough to
   decide.

A file too long for Jev's context is skipped and counted in the summary.

<details>
<summary>The steps in detail</summary>

**Split.** adhere splits each file into sections of whole statements, such as
its imports, constants, and functions, packed in order into runs of at most 30
lines. A class or function longer than that splits into its methods or the
statements of its body. Jev reads the file as these sections.

**Judge: one request per file.**

- The state is `code`, the file's sections under their numbers from 1, as
  `{ code: { "1": "…", "2": "…" } }`, without their comments (see
  [Comments](#comments)), beside what the config [`reads`](#what-jev-reads).
- Each rule is one `noul` (yes/no probability) question that carries the rule's
  description and details, and its code under its words, `must` and `never`, or
  a guideline's `should` and `should_not`. It asks whether the file diverges
  from the pattern `must` shows, with `never` as an example of diverging. For
  a rule with only code that must never be written, it asks whether the file
  contains that code.
- Criteria for each answer draw the line at the rule's scope, so a file with no
  code the rule is about is a no.
- No rule sits in the state, so a rule's probability depends only on the state
  and that rule, not on which other rules share the request. Every question
  shares the state cost of the request.
- On up to 10 files per project rule, the rule's question has a second one
  beside it, the linter check (see [Validating rules](#validating-rules)),
  with the same fields.
- A rule with `appendState` has requests of its own, here and below, whose
  state adds to this one.

**Locate: a second request, only when at least one rule's probability is above
its threshold.** Per flagged rule:

- When the file has more than one section, adhere asks one `choice` question
  among the sections' numbers, which yields the section to report. The options
  carry no text of their own, since each is a key of the state. On the eval,
  options that described each section, by its first line or by what it
  declares, located violations no better than options without text.
- For each section, adhere asks two `choice` questions among its lines, each
  option the line's text: the line the violation starts on and the one it ends
  on. The report underlines the lines chosen in the reported section. On the
  eval, lines asked for in this request were named as accurately as lines asked
  for in a request of their own, and they held a violation for 94% of real
  findings, most often as one line ([study](eval/studies/pinpoint.md)).
- adhere asks one `noul` carrying the rule: whether you can tell if `code`
  breaks it from the state alone, without knowing what other files, libraries,
  services, or configuration do beyond what it shows. It yields the `context`
  score and its warning.

**Limits.** Jev reads at most 32k tokens of state and one question together, and
64k tokens in a request. adhere estimates tokens from the JSON it sends, at
about three bytes a token, and leaves 1k of room for what Jev wraps around it.

- When a file's questions would not fit in one request, they are split across
  several.
- If a file's state and longest question would not fit together, or a provider
  reports a context overflow, adhere retries once without `references` when that
  map is present. Target code, `symbols`, and other context remain intact; no
  declaration excerpt is shortened to fit. Removing references may still leave
  the request too large, in which case the file is skipped and counted in the
  summary. A file with more than 255 code sections is also skipped, and the rest
  of the run goes on.
- A file is also skipped when Jev itself counts it as over its context. Text
  denser than the estimate, such as CJK, can cause that.

</details>

## Compose your AGENTS.md

`adhere postinstall` renders the Markdown files in an instructions directory,
in name order, into a managed block in `AGENTS.md`. Set the directory with the
config's `instructions` key, relative to the config file. Without it, adhere
looks in `.adhere/instructions/`, then `.agents/instructions/`.

To run it after installing dependencies, add it to your package scripts, or
append it to your existing `postinstall` script:

```json
{
  "scripts": {
    "postinstall": "adhere postinstall"
  }
}
```

The command creates `AGENTS.md` if needed, and appends the block if it is
absent. Otherwise it replaces only the content between these markers:

```markdown
<!-- adhere:instructions:start -->

Generated instructions

<!-- adhere:instructions:end -->
```

- Everything outside the block is kept.
- A missing instructions directory changes nothing. An empty one clears the
  generated content, but keeps the markers.
- Malformed or duplicate markers in `AGENTS.md`, or a marker inside an
  instruction file, fail the command before it writes anything.

## Contributing

To build, test, or release adhere from a checkout, see
[CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE). The executables attached to each GitHub release
come with `LICENSE` and `THIRD_PARTY_NOTICES.txt`, which go with any copy you
redistribute.
