<div align="center">
<h1>adhere</h1>
  <sup>A linter for non-deterministic rules. Powered by Typesafe</sup>
</div>

A linter for rules a normal linter cannot check. Describe rules using RFC 2119
language, like "business logic MUST live in services", or "A 3rd-party API going
down SHOULD NOT also take us down". A rule also includes a good example, a bad
example, or both, which [our studies](eval/studies/example-count.md) highly
recommend.

For each source file, adhere asks [Jev](https://typesafe.ai) (TypeSafe AI's
System One model) whether the file breaks each rule, gets a calibrated
probability per rule, and reports the ones above a threshold with the section of
the file Jev points at. The report uses the same frame as `vp lint`.

Here's a demo of what the output looks like:

<details>
  <summary>
    <h3>Demo 🎬</h3>
  </summary>
  <img alt="demo" align="center"  src="https://github.com/darkmatter/adhere/raw/main/eval/demo.gif" />
</details>


Presets for TypeScript, React, security, Effect, and alchemy are included, and
run without setup:

```sh
TYPESAFE_API_KEY=xxx npx @drkmttr/adhere lint --preset typescript
```

Rules a normal linter can check exactly, such as a banned import or a type
error, belong in that linter. While it lints, adhere asks Jev whether a normal
linter could check each of your rules. [`adhere validate`](#validate) lists the
ones it thinks belong in a regular linter, and detects contradictions between
your rules.

## Contents

- [Install](#install)
  - [Login](#login)
- [Quick start](#quick-start)
  - [Init](#init)
- [Commands](#commands)
- [Reading the report](#reading-the-report)
- [Writing rules](#writing-rules)
  - [Rules as Markdown files](#rules-as-markdown-files)
  - [Rule writing tips](#rule-writing-tips)
  - [Scoping a rule](#scoping-a-rule)
  - [What a rule reads](#what-a-rule-reads)
  - [Rules as TypeScript files](#rules-as-typescript-files)
  - [Where rules live](#where-rules-live)
  - [Validate](#validate)
- [Config](#config)
  - [Presets](#presets)
  - [Overrides](#overrides)
  - [Precedence](#precedence)
- [Running lint](#running-lint)
  - [Flags](#flags)
  - [What gets read](#what-gets-read)
  - [Before and during a run](#before-and-during-a-run)
  - [Limiting a run](#limiting-a-run)
  - [Logging a run](#logging-a-run)
  - [Exit codes](#exit-codes)
- [Comments and suppressions](#comments-and-suppressions)
  - [Comments](#comments)
  - [Suppressing a finding](#suppressing-a-finding)
- [Cache](#cache)
- [Sharing rules](#sharing-rules)
  - [Creating a shared repo](#creating-a-shared-repo)
- [Agent skills](#agent-skills)
  - [In CI](#in-ci)
- [How a file is judged](#how-a-file-is-judged)
- [Upgrading](#upgrading)
- [Development](#development)
  - [Native executable](#native-executable)
  - [Release](#release)
- [License](#license)

## Install

```sh
bun add --global @drkmttr/adhere   # or: npm install --global @drkmttr/adhere
```

- `adhere` is a prebuilt executable for macOS and Linux (arm64 and x64) and for
  Windows (x64).
- To pin the version in a repo, for CI or scripts, add it as a dev dependency
  and run `npx adhere`.
- adhere sends each file it judges to Jev at `api.typesafe.ai`, authenticated
  with a TypeSafe AI API key.

### Login

```sh
adhere login             # prompts for the key, masking what you type
adhere login < key.txt   # reads it from stdin instead
adhere logout            # deletes the saved key
```

- The key is saved to `~/.config/adhere/credentials.json`, or under
  `$XDG_CONFIG_HOME` when that is set, readable only by you.
- `TYPESAFE_API_KEY`, when set, takes precedence over the saved key, so CI can
  pass a key without a login.
- The key is read only when a request is about to be sent. A run where every
  file is cached needs no key and no network.

## Quick start

```sh
adhere init        # .adhere/config.ts, two example rules, and the dependency
adhere login       # save your TypeSafe AI API key, once
adhere validate    # check your rules' wording, and ask Jev whether any contradict
adhere lint        # audit the working directory
git add .adhere    # commit the rules, and the judgments they cost
```

Without a config or rules, `adhere lint --preset effect` audits against the
built-in Effect rules.

### Init

`adhere init` writes `.adhere/config.ts`, two example rules, and the
`.adhere/tsconfig.json` that gives the editor its types. When there is a
`package.json`, it also adds `@drkmttr/adhere` as a dev dependency, with the
repo's own package manager.

It is safe to rerun: existing files are reported as skipped, and only `--force`
overwrites them.

<details>
<summary>More on what init does</summary>

- A config already at another accepted path (see [Config](#config)) is kept, and
  no second one is added, even with `--force`.
- The dev dependency gives the config's `defineConfig` its types in the editor.
  Init runs `<manager> add -D @drkmttr/adhere` with the package manager whose
  lockfile (`bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`,
  `package-lock.json`) sits beside the `package.json`, or npm when there is
  none.
- With pnpm it adds `--ignore-workspace-root-check`, so the install also works
  at a workspace root.
- It skips the install when `package.json` already lists adhere.

</details>

`adhere init --shared org/repo` scaffolds a repo of rules for other repos to
install instead. See [Creating a shared repo](#creating-a-shared-repo).

## Commands

| Command                           | What it does                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `adhere lint`                     | Audit the working directory. See [Running lint](#running-lint).                                      |
| `adhere validate`                 | Check the rules' wording, and ask Jev whether any contradict. See [Validate](#validate).             |
| `adhere init [--force]`           | Scaffold `.adhere/config.ts` and two example rules. See [Init](#init).                               |
| `adhere init --shared org/repo`   | Scaffold a repo of rules other repos install. See [Creating a shared repo](#creating-a-shared-repo). |
| `adhere list org/repo`            | List the rules in another repo's `.adhere/rules/`. See [Sharing rules](#sharing-rules).              |
| `adhere install org/repo`         | Copy them into this repo's `.adhere/rules/org/repo/`.                                                |
| `adhere login`, `adhere logout`   | Save or delete a TypeSafe AI API key. See [Login](#login).                                           |
| `adhere skill [docs\|setup\|fix]` | Print an agent skill. See [Agent skills](#agent-skills).                                             |

Bare `adhere` prints the help. `adhere <command> --help` lists a command's
flags, and `adhere --completions <shell>` prints a completion script.

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

| Part               | What it tells you                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `×` or `⚠`         | An error, or a warning, in amber, from a rule whose `level` is `warning`. Only errors fail the run.                                                 |
| `data/brand-ports` | The rule's id, then its description. A preset's rule has the preset's name first, as in `effect/basics/gen-for-sequencing`.                         |
| `confidence`       | Jev's probability that the file breaks the rule.                                                                                                    |
| `context`          | Jev's probability that the file shows enough to decide that.                                                                                        |
| The excerpt        | The section of the file Jev points at. The line it names is underlined, or the lines, when it names several, are marked with a bar beside the code. |
| `hint:`            | The rule's code that must be written. A rule with only code that must never be written shows that code instead, labeled `never:`.                   |
| The legend         | Under the last finding: each score's threshold, between its range in red and its range in green.                                                    |

**Score colors.** On a terminal, each score is colored by where it sits around
its threshold:

| Color | Meaning                  | `confidence`, at a threshold of 0.80 | `context`, at a threshold of 0.60 |
| ----- | ------------------------ | ------------------------------------ | --------------------------------- |
| green | well above the threshold | 0.85 and up                          | 0.70 and up                       |
| amber | near the threshold       | 0.75 to 0.84                         | 0.50 to 0.69                      |
| red   | far below it             | under 0.75                           | under 0.50                        |

- A rule whose findings are mostly amber turns on where its threshold sits,
  which may be too low.
- A red `context` marks the finding to doubt first.
- Lint reports a finding only above its rule's threshold, so a red `confidence`
  shows only in the legend.

**Low context.** Jev is also asked whether the file shows enough to decide the
rule at all, or whether it turns on something the file does not show, such as
what another file, a library, or a service does. When `context` is below 0.6,
the finding gets a warning under its code, and help on adding what is missing:

```text
  warning: this file may not show enough to check this rule
     help: add what the code relies on outside this file as a note Jev reads:
           // @adhere <the fact>, and how you know it
```

- On the eval, most findings with this warning were false, where about one in
  five of all findings was ([study](eval/studies/sufficiency.md)). Check what
  the code relies on outside the file before acting on it.
- What you find can go in an `@adhere` note, which Jev reads (see
  [Comments](#comments)).
- `sufficiencyThreshold` in the config, or `--sufficiency-threshold`, sets the
  cutoff. The warning changes neither the finding's level nor the exit code.

<details>
<summary>More on the scores and the excerpt</summary>

- Near the threshold is within a quarter of the room above it, on either side:
  0.05 at a threshold of 0.80.
- The legend's `confidence` ranges are around the run's threshold. A rule with a
  threshold of its own has its ranges around that. The threshold and each `<` in
  the legend are amber, for the scores between the two ranges.
- A report that mixes presets with a repo's own rules says where each rule came
  from, since a preset's rule has the preset's name first.
- When Jev names no lines, the section is shown alone, at its first line.
  [How a file is judged](#how-a-file-is-judged) says how a file is split into
  sections.
- On a terminal, the report is in color and the code in it is highlighted.

</details>

## Writing rules

A repo's own rules live in `.adhere/rules/`, a directory per rule. When that
directory exists, it is read without any config.

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
- A rule is a `RULE.md`, or a [`RULE.ts`](#rules-as-typescript-files). A
  directory with both refuses the run.
- Nothing else in a rule's directory, such as notes or a helper its `RULE.ts`
  imports, is read as a rule.

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
| `description`            | Required. One sentence saying what code must be, and never be.                                                                                 |
| `threshold`              | The rule's own cutoff, in place of the config's.                                                                                               |
| `level`                  | `warning` reports the rule's findings as warnings, which do not fail the run. Use it for a nit, or for a rule that tends to flag code wrongly. |
| `tests`                  | Rules skip tests by default. `only` is for a rule about tests, which judges nothing else. `include` is for one that holds in tests as well.    |
| `appliesTo`, `excludeIf` | Where the rule applies. See [Scoping a rule](#scoping-a-rule).                                                                                 |
| `reads`                  | What Jev reads beside the code. See [What a rule reads](#what-a-rule-reads).                                                                   |

| Heading in the body          | The code under it                                           |
| ---------------------------- | ----------------------------------------------------------- |
| `## Must`                    | must be written                                             |
| `## Never`                   | must never be written, which is what a violation looks like |
| `## Should`, `## Should not` | the same, for a guideline                                   |

- A rule needs code under at least one heading.
- A rule is a requirement ("must", "never") or a guideline ("should", "should
  not"), and cannot mix the two. Write the description in the same words, so the
  rule and its code agree.
- A rule with only a `never` block suits a rule with no single correct form to
  show, such as a hand-rolled retry loop or an error caught and dropped.
- Neither goes in the other's place: code that must never be written, under
  `must`, reads to Jev as the pattern to follow.

<details>
<summary>More on headings, fences, and loading</summary>

- A heading names the code in its section, which runs to the next heading at its
  level or higher, so a deeper heading such as `### A bare number` stays inside
  it.
- Only a heading that is the word alone names code, in any case and with or
  without a colon: `## Never:` does, `## Never do this` does not.
- A fence can instead name its code after its language, as in `ts never`, which
  GitHub does not show. A fence's own word wins over its heading's.
- An untagged fence outside those sections is code that must be written, and
  without a fence the whole body is.
- Prose around the code renders on GitHub and is ignored.
- Jev reads the code under the same words, `must` and `never`, or a guideline's
  `should` and `should_not`. It is asked whether the file diverges from the
  pattern `must` shows, with `never` as an example of diverging.
- A rule inline in a config takes the same keys, with its code under `must`,
  `never`, `should`, and `shouldNot`.
- A file that fails validation refuses the run, with its path in the message.
- `loadRules(directory)` from the package root does the same load for your own
  tooling.

</details>

### Rule writing tips

We've evaluated different ways of giving Jev a rule, to catch the most
violations with the fewest false positives. In general:

- Say "must" for what code must do and "never" for what it must not, in the
  description and in the headings over the code.
- Give one example of each: one `must` block and one `never` block. Three of
  each did no better, and several of one kind alone did worse.
- For a guideline rather than a requirement, say "should" and "should not" the
  same way.

On the Effect preset, rules written this way cut the findings Jev got wrong at
the default threshold from 6 to 1, and caught as many violations. For more about
the evaluations, see [the eval](eval/README.md). `adhere validate` lists each
rule worded otherwise.

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

<details>
<summary>More on how the scope is asked</summary>

- Each description goes to Jev as a question of its own, in the same request as
  the rule. A yes is a probability above 0.5.
- The scores are cached with the rule's judgment, and editing a matcher judges
  the rule again, as editing its description does.
- At `--log-level debug`, lint logs each finding its matchers dropped, with
  their scores.
- Keeping the scope out of the description keeps the description to what the
  rule asks for, which the report shows, and gives each part a score of its own.

</details>

### What a rule reads

Jev judges a file by its code alone. A rule that turns on something the file
does not show can name it in `reads`, and adhere gives it to Jev beside the
code, for that rule only. It is a JSON array on one line in front matter, or an
array in a config or a TypeScript rule.

````md
---
description: A function from one of this repository's own packages, which `workspacePackages` names, must be called through the package's namespace, never imported by its own name.
reads: ["workspacePackages"]
---

## Must

```ts
import * as Orders from "orders-core";
```

## Never

```ts
import { parse } from "orders-core";
```
````

There is one name so far:

| Name                | What Jev reads                                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspacePackages` | The workspace's packages, each one's name with its directory, as in `{ "orders-core": "packages/orders" }`. A package that is not in it is an installed one. It is for a rule about whose package an import is of: the repository's own, or one installed from a registry. |

- Each name is the key Jev reads it under, so the description can name it in
  backticks, as the questions name `code`.
- A name adhere does not have refuses the run, so a misspelled one does not go
  unnoticed.
- When what a rule reads changes, such as a package added, renamed, or moved,
  that rule is judged again for every file, and no other rule is.
- What adhere has no name for, such as a file of the repository's, a rule in
  TypeScript adds with [`appendState`](#rules-as-typescript-files).

<details>
<summary>More on requests and where the packages come from</summary>

- A rule that reads anything goes to Jev in requests of its own, as a rule with
  `appendState` does, so no other rule reads what it does.
- The packages are read on every run, when a rule reads them, from the working
  directory's `package.json`, whose `workspaces` npm, Bun, and Yarn read, and
  from `pnpm-workspace.yaml`'s `packages`.
- In a pattern, `*` is any directory and `**` any depth of them, and one that
  starts with `!` leaves out what it matches. Each matched directory's
  `package.json` gives the name, and its directory is given from the working
  directory.
- Nothing need be installed, so a run in CI reads the same packages as one on a
  laptop.
- A working directory that is not a workspace's root has none.

</details>

### Rules as TypeScript files

A rule's directory can hold it as a `RULE.ts` instead, which default-exports
`defineRule({...})`, taking the fields a config's inline rule does. What
TypeScript adds is `appendState`, a hook on what Jev reads for the rule:

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
  request's state, the file the request is about, and Bun's API, and what it
  returns is spread over the state.
- The description can name a key the hook adds, in backticks, as the questions
  name `code`.
- A `RULE.ts` is imported, as a config is, so its code runs on every lint.
- A rule with a hook goes to Jev in requests of its own, so only that rule reads
  what its hook adds. Each of those requests sends the file again.
- Editing the hook judges the rule again. A change to what the hook reads
  outside the file does not: when `db/schema.sql` changes, a file already judged
  is not judged again until it or the rule changes.

<details>
<summary>More on the hook</summary>

- The state is what Jev reads beside each question: `code`, the file's sections
  as Jev reads them, under their numbers from 1, as in
  `{ code: { "1": "import …", "2": "export const …" } }`.
- `file` is the file's absolute `path`, and its `contents` as written, comments
  and all.
- Nothing the hook returns is checked, so it can change `code` too, or replace
  it: a hook can break its own rule's answers, and adhere does not stop it.
- It can be async, and one that throws refuses the run, naming the rule. A
  `RULE.ts` that default-exports no rule refuses the run too.
- The rule has requests of its own both to judge a file and to locate a finding,
  so no other rule's answer depends on the hook. The plan counts them, but not
  the tokens a hook adds, which are not known until it runs. A request over
  Jev's context skips the file, as a file too long does.
- The cache keys a judgment by the file's content and the rule, and the hook is
  part of the rule by its source.
- A `RULE.ts` can import other files by relative path, such as a helper beside
  it in its directory, but the executable resolves no packages besides
  `@drkmttr/adhere`.
- `Bun` is typed when `@types/bun` is installed and `.adhere/tsconfig.json`
  lists it, as `"types": ["bun"]`, and is `unknown` otherwise.
- A config's inline rules can have `appendState` too.

</details>

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

There is no broader priority system: presets are global, project rules override
preset rules with the same id, and nested project rules override less-specific
project rules with the same id for files in their subtree.

A repo that would rather keep its rules with the rest of its documentation can
point `rules` at a directory such as `docs/adhere/`:

```ts
export default defineConfig({ presets: ["effect"], rules: "./docs/adhere" });
```

That directory holds its rules as `.adhere/rules/` does, a directory per rule,
and they apply project-wide. `.adhere/rules/` is the default because it keeps
everything adhere owns in `.adhere/`, where the config and the cache stay
anyway. The cost is visibility: a dot directory is hidden from `ls`, and from
`rg` without `--hidden`.

### Validate

`adhere validate` loads the config, rules, and presets the way `lint` does,
prints how many rules it loaded, and runs three checks. Only a contradiction
fails it, with exit code 1. The other two are advice.

| Check            | Asks Jev | What it prints                                                                                                |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| Wording          | no       | Each rule worded otherwise than the [rule writing tips](#rule-writing-tips) recommend, with its file and how. |
| The linter check | no       | Each rule a regular linter should probably check, from answers `lint` collected.                              |
| Contradictions   | yes      | Each pair of rules that apply to the same files and contradict, so that no code can follow both.              |

**Wording** flags a rule when:

- its description does not say a word its code is under, such as "never" beside
  a `never` block;
- it has code to write but no example of code that breaks it;
- its description says the other kind of rule's words: "should" in a
  requirement, or "must" or "never" in a guideline.

**The linter check.** While `lint` judges a file against one of the project's
own rules, it asks Jev a second question beside it: could a linter or type
checker have decided exactly whether this file follows the rule? It asks on 10
files per rule, and `validate` reports the tally:

| The rule was flagged on      | It is printed as                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 7 or more of its 10 files    | one a regular linter should probably check                                                                      |
| 3 to 6                       | a rule that reads differently from file to file, whose description should say more precisely what it applies to |
| fewer than 10 answers so far | waiting                                                                                                         |

<details>
<summary>More on the three checks</summary>

- A file that fails to decode refuses `validate`, as it refuses `lint`.
  `--preset` adds a built-in rule set, as for `lint`.
- A rule with only code that must never be written needs no `must` example.
- The linter check's 10 files are spread over the files `lint` judges, and its
  answers stay in the cache until the rule's text changes. `lint` collects them
  as it judges files, so a repo whose files are all cached collects them as its
  files change. Preset rules are left out: they are not the project's to change.
- For contradictions, one request names, per rule, the rule it conflicts with,
  if any. Each named pair then gets a probability from a request of its own,
  holding only those two rules, since other rules beside them dilute the
  judgment. A pair above the threshold is printed with both rule files.
- Two rules with the same id are not compared: a nested rule that shares an id
  shadows the other on purpose.
- When no two rules share files, nothing is sent. Otherwise `validate` needs the
  API key, as `lint` does.

</details>

## Config

A config file is optional. Without one, adhere reads the rules in
`.adhere/rules/` and any `--preset`. A config names presets, sets the model and
thresholds, or gives rules inline. It sits in the working directory of the repo
being audited, at one of these paths (keep one):

- `.adhere/config.ts`, the default, next to the rules
- `adhere.config.ts`
- `.adhere.config.ts`

```ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  model: "jev-latest", // optional, default "jev-latest"
  threshold: 0.8, // optional, default 0.8
  sufficiencyThreshold: 0.6, // optional, default 0.6: below it, a finding warns to check outside the file
  presets: ["effect"], // optional, built-in rule sets
  exclude: ["**/generated/**"], // optional, files no rule judges
  overrides: { "effect/basics/instrument-with-pipe": "off" }, // optional, see Overrides
  rules: {
    "data/brand-meaningful-primitives": {
      description:
        "A primitive with semantic meaning, such as an id, email, URL, port, or count, must be a branded schema.",
      must: `
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
`,
      never: "type UserId = string", // optional: what a violation looks like
      threshold: 0.8, // optional per-rule override
    },
  },
});
```

| Key                    | Default          | Meaning                                                                                                                                                                |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`                | `"jev-latest"`   | The model id sent to TypeSafe.                                                                                                                                         |
| `threshold`            | `0.8`            | Report a rule when Jev's probability is above this.                                                                                                                    |
| `sufficiencyThreshold` | `0.6`            | Below it, a finding warns that the file may not show enough.                                                                                                           |
| `presets`              | none             | Built-in rule sets, or their topics. See [Presets](#presets).                                                                                                          |
| `rules`                | `.adhere/rules/` | Rules inline, as above, or a directory (see [Where rules live](#where-rules-live)). Either replaces `.adhere/rules/`: none of its rules, root or nested, is read then. |
| `exclude`              | none             | Globs, relative to the working directory, of files no rule judges.                                                                                                     |
| `overrides`            | none             | Settings for a rule by its id. See [Overrides](#overrides).                                                                                                            |
| `includeComments`      | `false`          | Send every comment to Jev. See [Comments](#comments).                                                                                                                  |

- An invalid shape refuses the run.
- A config can import other files by relative path, but no packages besides
  `@drkmttr/adhere`: the executable does not resolve `node_modules`.

<details>
<summary>More on types in the editor</summary>

- The default export is decoded with Effect `Schema`.
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

### Presets

| Preset                                | Rules | For                                                   | What it asks for                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`typescript`](./presets/typescript/) | 11    | any TypeScript project                                | Data from outside checked at runtime, invalid states unrepresentable, errors never swallowed, resources released on every path, arguments not mutated, and tests that assert outcomes and stand alone.                                                                                          |
| [`react`](./presets/react/)           | 10    | components and hooks                                  | Logic for an event in its handler rather than an effect, effects that clean up and ignore stale fetches, `useSyncExternalStore` for outside stores, state that neither copies props nor contradicts itself, and Server Functions and Server Components that guard what crosses to the client.   |
| [`security`](./presets/security/)     | 4     | any project                                           | Secrets kept out of logs, error messages, and responses; parameterized SQL; no untrusted input in shell commands, `eval`, or file paths; and secrets compared in constant time.                                                                                                                 |
| [`effect`](./presets/effect/)         | 18    | code written with Effect                              | Steps sequenced with `Effect.gen`, instrumentation attached with `.pipe`, config read through a service and validated, secrets redacted, branded primitives and tagged unions, defects kept apart from typed errors, services built by layers, and tests with their own layers and `TestClock`. |
| [`alchemy`](./presets/alchemy/)       | 41    | code that deploys with [alchemy](https://alchemy.run) | Where Config and bindings are read, which resources keep their data, how secrets stay out of bundles and logs, authorization on public URLs, migrations, durable workflows, and custom providers.                                                                                               |

- Name presets in the config's `presets`, or on the command line with
  `--preset`, repeated or separated by commas, as in `--preset effect,alchemy`,
  in which case the config file is optional. Presets named in both places apply
  together.
- A topic, one of a preset's subdirectories, is a preset of its own:
  `--preset effect/basics` applies only the rules under
  `presets/effect/basics/`, and `alchemy/secrets` only alchemy's secrets rules.
  `security` has no topics.
- Reports name a preset's rule with the preset first, as in `alchemy/secrets/…`.
  To change one, use [Overrides](#overrides).

<details>
<summary>What every preset does</summary>

- It leaves out conventions a linter checks exactly. The notes on each preset
  say which linter checks them.
- A preset rule says "must" only where its source makes a requirement, and
  "should" where the source gives advice.
- Its rules skip tests, but for six that are about tests and say `tests: only`:
  four in `effect` and two in `typescript`.
- A topic's rules keep the ids they have in the whole preset, so a topic and its
  preset share cached judgments, and naming both applies each rule once.
- A preset has the shape of a config without `presets`: `rules`, and optionally
  `model` and `threshold`.
- Where effect or alchemy had a rule that `typescript` or `security` has, that
  one is kept and the other is gone. typescript's
  `async/network-calls-have-timeouts` replaced effect's
  `basics/external-calls-are-resilient`, and `security/parameterized-queries`
  and `security/no-secrets-in-output` replaced alchemy's
  `data/parameterized-sql` and `secrets/never-logged-returned-or-output`. A
  project on Effect or alchemy names `typescript` and `security` too, for those
  rules.

</details>

<details>
<summary>Notes on <code>typescript</code></summary>

- **Source.** The TypeScript Handbook and the Google TypeScript Style Guide.
- **Left to a linter.** What typescript-eslint and ESLint check exactly:
  unhandled promises (`no-floating-promises`), throwing non-errors
  (`only-throw-error`), `any` (`no-explicit-any`), exhaustive switches
  (`switch-exhaustiveness-check`), a lost `cause` (`preserve-caught-error`), and
  empty catch blocks (`no-empty`).
- **Warnings.** Four of its rules report warnings. Three are advice that code
  often has reason to set aside: assertions that claim only what the code
  established, types derived rather than restated, and independent awaits run
  concurrently. The fourth, that HTTP requests carry a timeout, was right on
  fewer than half its findings above 0.8 on the eval: many of the rest were
  calls through a client with a default timeout that the file does not show.
- **Tests.** `testing/assert-outcomes` and `testing/independent-tests` say
  `tests: only`: they judge tests and nothing else.
- **Gone.** Two rules the eval found mostly wrong: that tests use fake time
  rather than real waits, and that importing a module does no work.

</details>

<details>
<summary>Notes on <code>react</code></summary>

- **Source.** react.dev, mostly
  [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
  and
  [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure).
- **Left to a linter.** What the React Compiler's lint rules check, in
  [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)'s
  recommended set and in Oxlint: pure render (`purity`), props and state never
  mutated (`immutability`), refs not read during render (`refs`), no `setState`
  in render or synchronously in an effect (`set-state-in-render`,
  `set-state-in-effect`), which covers state derived in an effect, and no
  component defined inside another (`static-components`).
- **Files.** Its rules judge `.ts` files as well as `.tsx`, and apply only to
  components, hooks, effects, and Server Functions, so other files cost their
  checks and find nothing.
- **Warnings.** `server/no-private-data-to-client` reports warnings: a file does
  not show whether the component it passes a record to is a Client Component. So
  does `state/store-ids-not-copies`, which also flags state that copies a string
  or an option from a fixed list, where a copy cannot go stale.

</details>

<details>
<summary>Notes on <code>security</code></summary>

- **Source.** OWASP's cheat sheets.
- **Topics.** It has none.

</details>

<details>
<summary>Notes on <code>effect</code></summary>

- **Source.** The
  [effect-solutions](https://github.com/kitlangton/effect-solutions) docs and
  the [effect/platform](https://effect.website/docs/platform/introduction/)
  docs.
- **Tests.** Four rules say `tests: only`, so they judge tests and nothing else:
  `testing/test-clock-for-time`, `services/fresh-layer-per-test`,
  `services/test-layers-are-in-memory`, and
  `config/tests-provide-values-directly`.
- **Guidelines.** Two rules say "should": test layers are in memory, outside
  integration tests, and tests provide config through a layer.
- **What the rules allow.** Config validation accepts `Config.mapEffect` as well
  as `Config.schema`, and the variants rule does not rule out a `switch`.
- **Gone.** The rule that a command handler only parses input: the docs show
  that pattern but do not ask for it.
- **Left to a linter.** Effect's language service,
  [`@effect/tsgo`](https://github.com/Effect-TS/tsgo) on TypeScript 7, checks
  seven conventions exactly, which the preset checked through 0.7. Most are off
  by default. `npx @effect/tsgo setup` installs it, and these lines in its
  plugin options in `tsconfig.json` turn them on:

  ```jsonc
  "diagnosticSeverity": {
    "strictEffectProvide": "warning", // layers are provided once, at the entry point
    "leakingRequirements": "warning", // service methods have no requirements
    "effectFnOpportunity": "warning", // a named function returning an Effect uses Effect.fn
    "preferSchemaOverJson": "warning", // JSON is decoded with Schema, not JSON.parse
    "nodeBuiltinImport": "warning", // platform services, not node: builtins
    "globalFetch": "warning",
    "globalFetchInEffect": "warning",
    "processEnv": "warning",
    "processEnvInEffect": "warning",
    "globalRandom": "warning", // the Random service, not Math.random
    "globalRandomInEffect": "warning",
    "globalErrorInEffectFailure": "warning", // tagged errors, not Error
    "extendsNativeError": "warning"
  }
  ```

  `npx @effect/tsgo diagnostics --project tsconfig.json` runs them in CI. Bun
  globals, which the old platform rule also ruled out, need a lint rule of their
  own, such as `no-restricted-globals`.

- **What the linter misses.** `leakingRequirements` sees a requirement in an
  operation's type, but not a service built by a factory function that takes its
  dependencies as arguments, whose types have no requirements to find. The
  preset's `services/dependencies-through-layers` asks for that, and
  `services/operations-have-no-requirements` for the style it goes with.

</details>

<details>
<summary>Notes on <code>alchemy</code></summary>

- **Source.** alchemy's docs and blog.
- **Warnings.** `providers/idempotent-delete` reports warnings. Whether a delete
  fails on a resource that is already gone is a fact about the API, which the
  file does not show, so the rule also flags deletes of APIs that succeed
  anyway. See [the study](eval/studies/idempotent-delete.md).

</details>

### Overrides

A config's `overrides` changes a rule by the id a report names it with, a
preset's with the preset first, without copying its text into `rules`:

```ts
export default defineConfig({
  presets: ["effect", "alchemy"],
  overrides: {
    "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
    "effect/basics/instrument-with-pipe": "off",
  },
});
```

| Value                  | Effect               |
| ---------------------- | -------------------- |
| `"off"`                | drops the rule       |
| `"warning"`, `"error"` | sets its level       |
| `{ level, threshold }` | sets either, or both |

An id that no preset or project rule has refuses the run, so a typo does not go
unnoticed. A rule of a preset the run does not name is accepted.

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

```sh
adhere lint                    # audit the working directory
adhere lint --preset effect    # add a built-in rule set; the config becomes optional
adhere lint --threshold 0.9    # replace the config's threshold
adhere lint --yes              # send the requests without asking first
```

### Flags

| Flag                               | What it does                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--preset <names>`                 | Add built-in rule sets, or their topics. The config becomes optional. See [Presets](#presets). |
| `--threshold <0 to 1>`             | Replace the config's threshold. Per-rule thresholds still apply.                               |
| `--sufficiency-threshold <0 to 1>` | Replace the config's `sufficiencyThreshold`: a finding warns when its `context` is below it.   |
| `--yes`, `-y`                      | Send the requests without asking first.                                                        |
| `--limit <checks>`                 | Judge at most that many checks. See [Limiting a run](#limiting-a-run).                         |
| `--rpm <requests>`                 | Send at most that many requests a minute.                                                      |
| `--filter <glob>`                  | Read only the files a glob matches.                                                            |
| `--deny-warnings`                  | Fail on warnings as well as errors.                                                            |
| `--log-level <level>`              | Log the run's work on stderr. See [Logging a run](#logging-a-run).                             |

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
(see [Rules as Markdown files](#rules-as-markdown-files)). On alchemy, 38% of
the findings from rules not about tests were in test helpers and fixtures. A
test is:

- a `.test` or `.spec` file, such as `a.test.ts` or `Button.spec.tsx`;
- a fixture or test helper named as one, such as `fixtures.ts`,
  `GitHubHttpFixtures.ts`, `ledger-copy.fixture.ts`, `linear-test-helpers.ts`,
  or `test-utils.ts`;
- any file under a `test/`, `tests/`, `__tests__/`, `testing/`, `fixtures/`,
  `fixture/`, `__fixtures__/`, or `__mocks__/` directory.

### Before and during a run

Before it judges anything, `lint` says on stderr what it found and what judging
takes, and asks:

```text
200 files and 14 rules: 2800 checks, 1400 cached.
Judging the other 1400 takes 200 requests to Jev, plus 1 or more for each file with a finding.
Those carry about 1.9 million input tokens: about $0.08 at $0.042 per million, and more for locating findings.
? Send 200 requests to Jev, about $0.08? › (Y/n)
```

- It asks only with a terminal on stdin and stdout, and never when the cache
  answers every check. `--yes` sends without asking.
- The cost is adhere's estimate of the input tokens times the model's price. Jev
  charges only for input tokens: $0.042 a million for `jev-latest`, per
  [TypeSafe AI's models page](https://docs.typesafe.ai/models) in
  September 2026.
- A run that stops loses nothing: files finished before it stopped are cached,
  so running again continues from there.

<details>
<summary>More on the status line, unknown prices, and blocked files</summary>

- For a model adhere has no price for, the plan gives the tokens alone.
- Until it knows what judging takes, a status line on stderr says what `lint` is
  doing: looking for `.adhere/` rules, listing and reading the files, then
  planning, each with a count, such as `Planning: 5,120 of 10,333 files`. The
  line is drawn only on a terminal, and not at `--log-level debug` or below,
  whose log lines would land in it.
- The firewall in front of Jev's API can refuse a request whose code reads to it
  as an attack, with a 403 and an HTML page rather than Jev's JSON. It refuses
  the same request every run, so that file is skipped, the run goes on, and the
  report lists each such file with Cloudflare's Ray ID, which TypeSafe AI can
  look the block up by.
- When only the question that finds the line is refused, the file's judgments
  are kept, and a rerun sends that question alone.

</details>

### Limiting a run

Three flags bound what a run does:

| Flag               | Effect                                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--limit <checks>` | Judges at most that many checks, taken in path order. The rest wait, and since judgments are cached, the next run with the same limit picks up where this one stopped. `--limit 0` shows the plan and judges nothing.                                         |
| `--rpm <requests>` | Sends at most that many requests to Jev a minute, evenly spaced, retries included. The plan says about how long they take.                                                                                                                                    |
| `--filter <glob>`  | Reads only the files whose path from the working directory matches, such as `src/**` or `**/*.service.ts`. Wrap a glob in single quotes so the shell does not expand it. Repeat the flag for more, and start a pattern with `!` to leave out what it matches. |

```sh
adhere lint --filter 'packages/api/**' --filter '!**/generated/**' --limit 200 --rpm 30
```

### Logging a run

| Level               | What it logs, on stderr                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--log-level debug` | The config it loaded, how many paths it listed and how many of them it reads, and each request to Jev, with the file it is for, about how many tokens it carries, the HTTP status, how long it took, and Cloudflare's Ray ID. A failed attempt is logged even when a retry hides it. |
| `--log-level trace` | Also each file as it is read, planned, and answered from the cache, and the first 4000 characters of any error Jev's API answers with.                                                                                                                                               |

The counter stays off at these levels, since its redraws would garble the lines.
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

## Comments and suppressions

### Comments

Jev reads a file's code, not its comments. adhere takes every comment out before
it hashes or sends a file, blanking it so every line keeps its number. The
report's excerpts still show them.

> **Why.** A comment changes nothing the code does, so it should not change the
> report, yet Jev takes what comments claim at their word. In
> [a study of one alchemy rule](eval/studies/comments.md), comments saying a
> delete succeeds on a missing resource hid 8 of its 9 real violations, and
> taking comments out found all nine.

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

A finding Jev got wrong is suppressed in the code, with a comment saying why:

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

- A comment names rules as a report does, a preset's with its preset first,
  separated by commas.
- What follows `--` is the reason, for whoever reads the code next.
- A finding without lines is covered when its section overlaps the statement.
- Jev never reads these comments, even with `includeComments: true`.
- The summary counts the findings they suppress.

## Cache

Judgments are cached in `.adhere/cache/`. **Commit it.** Every judgment is a
paid request, and Jev's answers vary a little from run to run, so a committed
cache gives everyone and CI the same findings without paying for them again, and
a pull request changes the judgments of only the files it changes.

| What changed                                                 | What is judged again                                  |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| A file's code                                                | Every rule, for that file.                            |
| A file's comments alone                                      | Nothing.                                              |
| A file is moved or copied                                    | Nothing. Identical files share their judgments.       |
| A rule's text, a matcher, or the source of its `appendState` | That rule, for every file.                            |
| What a rule `reads`, such as the workspace's packages        | That rule, for every file.                            |
| The threshold is lowered                                     | Nothing. Cached judgments newly above it are located. |
| adhere asks its questions differently, after an upgrade      | Every rule, once.                                     |

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

- `files/` holds Jev's answers by the content they are about. Each cache file is
  named for the hash of a source file's content as Jev reads it, without its
  comments. That is why a moved or copied file keeps its judgments, identical
  files share them, and a change to comments alone re-judges nothing.
- Each answer sits under a fingerprint of the model and the question asked for
  the rule, which carries the rule's text, and of the source of the rule's
  `appendState`, if it has one.
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

## Sharing rules

An organization's rules can live in one repo's `.adhere/rules/`, and other repos
copy them in:

```sh
adhere list darkmatter/standards                        # each rule there, with its description
adhere install darkmatter/standards                     # every rule
adhere install darkmatter/standards/data                # the data topic
adhere install darkmatter/standards/data/brand-ports    # one rule
adhere install darkmatter/standards#v3                  # every rule, as tagged v3
```

- Copies land in this repo's `.adhere/rules/org/repo/`. So `data/brand-ports`
  from darkmatter/standards is
  `.adhere/rules/darkmatter/standards/data/brand-ports/`, the rule
  `darkmatter/standards/data/brand-ports`, and two repos' rules never collide.
- The copies are the repo's own rules from then on: commit them, edit them, or
  start new rules from them. Nothing tracks where they came from.
- A later install skips a rule already there, as init does. `--force` replaces
  its directory, edits and all.
- A rule's whole directory is copied. The source's config, its inline rules, and
  its cache are not.

> **Read what you install.** A `RULE.ts` is copied with the helpers beside it,
> and runs whenever lint does, in CI too. `adhere list` names a `RULE.ts`
> without its description, since reading it would run it.

<details>
<summary>More on refs, inline rules, and private repos</summary>

- A topic or a rule after the repo copies only that part, and `#` picks a branch
  or tag.
- A config with inline `rules` replaces `.adhere/rules/`, so it replaces copied
  rules too.
- The source is cloned with `git` from `https://github.com/org/repo.git`, so a
  private repo needs git's credentials for GitHub, as `gh auth setup-git` sets
  up. To clone over SSH instead, let git rewrite the URL:
  `git config --global url.git@github.com:.insteadOf https://github.com/`.

</details>

### Creating a shared repo

`adhere init --shared org/repo` scaffolds a repo whose rules other repos copy in
with `adhere install`, instead of one that lints itself. It writes the two
example rules and no config, since install copies only rule files, and with
them:

| File                            | What it is for                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                     | Says what the repo is for, how to install its rules, and how to add one.                                                                                                        |
| `.github/workflows/adhere.yaml` | Runs `adhere validate` on every push to main and every pull request, with the `TYPESAFE_API_KEY` secret. A pull request from a fork gets no secrets, so validate refuses there. |
| `alchemy.run.ts`                | An [alchemy](https://alchemy.run) stack that creates the GitHub repo, or adopts it, and sets that secret from `TYPESAFE_API_KEY` when deployed with `npx alchemy deploy`.       |
| `package.json`, `.gitignore`    | alchemy and effect, pinned to versions that work together, which init installs, and a `.gitignore` for them and alchemy's state.                                                |

The repo is public unless you answer yes when init asks, at a terminal, whether
to make it private. Other repos then need git's credentials for it to list and
install its rules. Without a terminal it is public: change `visibility` in the
stack to make it private.

## Agent skills

Three skills teach an agent to work with adhere:

| Skill                                            | Print it with        | What it does                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`adhere`](./skills/adhere/SKILL.md)             | `adhere skill`       | The reference: the commands, how to write and word a rule, the config, presets, shared rules, comments and suppressions, the cache, reading a report, and tuning a rule.                                                                                                           |
| [`adhere-setup`](./skills/adhere-setup/SKILL.md) | `adhere skill setup` | Sets adhere up in a repo with the user. It drafts rules from the repo's conventions, offers fitting presets and a shared org repo's rules, shows them all in one list to choose from, imports and validates the chosen ones, walks through the first lint, and adds a CI workflow. |
| [`adhere-fix`](./skills/adhere-fix/SKILL.md)     | `adhere skill fix`   | Verifies and fixes the findings `lint` reports: it checks each against its rule and the code, fixes the real ones, reports the false ones with the evidence, and says when a rule is wrong more often than right.                                                                  |

Install them with the [skills](https://github.com/vercel-labs/skills) CLI:
`skills add darkmatter/adhere`. The binary carries all three, so
`adhere skill fix > .agents/skills/adhere-fix/SKILL.md` works without a
checkout.

### In CI

Pipe the fix skill into an agent that runs without asking. The skill tells it
that invoking the skill permits every `adhere lint` run and its cost, and
`adhere skill fix` prints the skill of the adhere that runs, so its flags match:

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
  with the evidence in the comment. Without it, the agent leaves those findings,
  and its report ends by naming them and the variable.
- End the job with `adhere lint --yes`. The agent exits 0 whatever it left, so
  this step passes or fails the job. It judges only the files the agent changed,
  and reads the rest from the cache.

> **Do not run it on pull requests from forks.** The agent reads their code with
> your secrets in reach and the network open, so code written to steer it can
> send them out.

## How a file is judged

1. **Split.** adhere splits the file into sections of whole statements, in runs
   of at most 30 lines.
2. **Judge.** One request per file asks Jev, for each rule, how likely the file
   is to break it.
3. **Locate.** A second request, only for rules above their threshold, asks
   which section and lines break the rule, and whether the file shows enough to
   decide.

A file too long for Jev's context is skipped and counted in the summary.

<details>
<summary>The steps in detail</summary>

**Split.** adhere splits each file into sections of whole statements, such as
its imports, constants, and functions, packed in order into runs of at most 30
lines. A class or function longer than that splits into its methods or the
statements of its body. Jev reads the file as these sections.

**Judge: one request per file.**

- The state is the file's sections under their numbers from 1, as
  `{ "1": "…", "2": "…" }`, without their comments (see [Comments](#comments)),
  and nothing else.
- Each rule is one `noul` (yes/no probability) question that carries the rule's
  description and its code under its words, `must` and `never`, or a guideline's
  `should` and `should_not`. It asks whether the file diverges from the pattern
  `must` shows, with `never` as an example of diverging, or, for a rule with
  only code that must never be written, whether the file contains that code.
- Criteria for each answer draw the line at the rule's scope, so a file with no
  code the rule is about is a no.
- No rule sits in the shared state, so a rule's probability depends only on the
  file and that rule, not on which other rules share the request. Every question
  shares the state cost of the request.
- On up to 10 files per project rule, the rule's question has a second one
  beside it, the linter check (see [Validate](#validate)), with the same fields.
- A rule with `appendState` or `reads` has requests of its own, here and below,
  whose state adds to this one.

**Locate: a second request, only when at least one rule's probability is above
its threshold.** Per flagged rule:

- When the file has more than one section, one `choice` question among the
  sections' numbers, which yields the section to report. The options carry no
  text of their own, since each is a key of the state: describing each section
  by its first line, or by what it declares, located no better on the eval.
- For each section, two `choice` questions among its lines, each option the
  line's text: the line the violation starts on and the one it ends on. The
  chosen section's are underlined. On the eval, lines asked for in this request
  were named as well as lines asked for on their own, and they held a violation
  for 94% of real findings, most often as one line
  ([study](eval/studies/pinpoint.md)).
- One `noul` carrying the rule: whether you can tell if `code` breaks it from
  `code` alone, without knowing what other files, libraries, services, or
  configuration do. It yields the `context` score and its warning.

**Limits.** Jev reads at most 32k tokens of state and one question together, and
64k tokens in a request. adhere estimates tokens from the JSON it sends, at
about three bytes a token.

- When a file's questions would not fit in one request, they are split across
  several.
- A file whose code and longest question would not fit together, or that has
  more than 255 sections, is skipped and counted in the summary, and the rest of
  the run goes on.
- So is a file Jev itself counts as over its context, which text denser than the
  estimate, such as CJK, can cause.

</details>

## Upgrading

Names and layouts from older versions:

| Version     | What it had                                                                                      | What happens now                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| before 0.7  | A rule's examples were `reference` and `avoid` in a config, and a fence could be tagged `avoid`. | They still read as `must` and `never`.                                                                                                                                                                  |
| through 0.7 | The `effect` preset checked seven conventions a linter checks exactly.                           | They are left to `@effect/tsgo`. The notes on `effect` under [Presets](#presets) say how to turn them on.                                                                                               |
| before 0.13 | A rule was any `*.md` file in `.adhere/`, as `.adhere/data/brand-ports.md`.                      | A `*.md` file outside every rule's directory, but a `README.md`, refuses the run. The refusal says where each such file goes to keep its id, so `adhere-ignore` comments and `overrides` still name it. |
| before 0.13 | `.adhere/tsconfig.json` included only `config.ts`.                                               | Make its `include` `["**/*.ts"]` to give rules written in TypeScript their types.                                                                                                                       |
| 0.13.1      | The workspace's packages had a key of their own, `includeWorkspacePackages: true`.               | adhere no longer reads it, and a rule that still has it gets no packages. Write `reads: ["workspacePackages"]` in its place.                                                                            |

## Development

From a checkout, with Bun:

```sh
bun install
bun link          # puts `adhere` on PATH
adhere lint --preset effect
```

- In a checkout no platform package is installed, so `bin/adhere.js` runs
  `src/main.ts` with Bun instead.
- `bun run typecheck` runs `tsc` and the linter.
- `bun run test` runs the tests.

### Native executable

| Command             | What it builds                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run build`     | `dist/adhere`, a single binary with Bun and the presets inside it, through Bun's [`--compile`](https://bun.sh/docs/bundler/executables) with `--asset ./presets`. It runs without Bun or `node_modules` on the target machine and still loads the repo's `config.ts` and Markdown rules from disk. |
| `bun run build:npm` | The same for every published platform, each into its package under `dist/npm/` ([`scripts/npm-packages.ts`](./scripts/npm-packages.ts)).                                                                                                                                                           |

Each platform's executable is its own npm package,
`@drkmttr/adhere-<platform>-<arch>`, limited by `os` and `cpu`, and an optional
dependency of `@drkmttr/adhere`, so an install fetches only its own machine's.
The package's `bin/adhere.js` finds it and runs it with Node.

`adhere --version` tells the builds apart:

| Build           | What it prints                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A release       | Its version, as `adhere v0.10.0`.                                                                                                                                        |
| `bun run build` | `git describe --tags --dirty` where it was built, as `adhere v0.10.0-16-g9a41328`: 16 commits after v0.10.0, at `9a41328`, ending in `-dirty` when the tree had changes. |
| From source     | The checkout's version, marked `(source)`.                                                                                                                               |

### Release

Releases are cut by CI from pushed version tags. From a clean, up-to-date
`main`, push the release tag:

```sh
git tag v0.3.0
git push origin v0.3.0
```

1. The tag push starts `.github/workflows/release.yaml`, which checks out
   `main`, derives `0.3.0` from `v0.3.0`, and runs
   `bun run release -- --ci 0.3.0`.
2. Release-it bumps `package.json`, commits `chore: release v0.3.0` back to
   `main`, skips npm publish, and creates the GitHub Release for the existing
   tag.
3. `release.yaml` then calls the reusable publish workflow,
   `.github/workflows/publish.yaml`, directly, avoiding a chained GitHub Release
   event created by `GITHUB_TOKEN`.
4. The publish workflow verifies that `package.json` matches the release tag,
   builds the platform packages, and publishes each of them before
   `@drkmttr/adhere`, which it first lists them in as `optionalDependencies` at
   the same version.

<details>
<summary>More on publishing</summary>

- Every publish is `npm publish --access public --provenance`.
- No npm token is used, so a new package has to be published once by hand before
  it can be given trusted publishers on npmjs.com.
- npm checks the workflow that started the run, so every package has two trusted
  publishers: `release.yaml`, which calls the publish workflow for tag releases,
  and `publish.yaml`, for manual runs.
- The publish workflow can be run manually for an already-created release tag if
  a publish needs to be retried. It skips every package whose version is already
  on npm.
- The main package's `files` list keeps it to `bin/`, `src/`, `presets/`, and
  `skills/`.

</details>

## License

MIT. See [LICENSE](LICENSE).
