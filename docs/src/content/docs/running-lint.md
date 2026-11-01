---
title: "Running lint"
---

`adhere lint` judges the TypeScript files under the working directory against
your rules, and prints a [report](/adhere/reading-the-report/) of what it finds. It
asks before it sends anything.

## Before and during a run

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

## What gets read

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
(see [Rules as Markdown files](/adhere/rule-format/#rules-as-markdown-files)). A test is:

- a `.test` or `.spec` file, such as `a.test.ts` or `Button.spec.tsx`;
- a fixture or test helper named as one, such as `fixtures.ts`,
  `GitHubHttpFixtures.ts`, `ledger-copy.fixture.ts`, `linear-test-helpers.ts`,
  or `test-utils.ts`;
- any file under a `test/`, `tests/`, `__tests__/`, `testing/`, `fixtures/`,
  `fixture/`, `__fixtures__/`, or `__mocks__/` directory.

## Flags

| Flag                                                     | What it does                                                                                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--preset <names>`                                       | Add built-in rule sets, or their topics. The config becomes optional. See [Presets](/adhere/presets/).                                               |
| `--threshold <0 to 1>`                                   | Replace the config's threshold. Per-rule thresholds still apply.                                                                                     |
| `--sufficiency-threshold <0 to 1>`                       | Replace the config's `sufficiencyThreshold`: a finding warns when its `context` is below it.                                                         |
| `--type-aware`                                           | Add the compiler's `symbols` and `references`, including bundled rules that declare them. See [What Jev reads](/adhere/state-hooks/#what-jev-reads). |
| `--yes`, `-y`                                            | Send the requests without asking first.                                                                                                              |
| `--limit <files>`, `--rpm <requests>`, `--filter <glob>` | Bound how many files a run judges, how fast it sends, and which files it judges. See [Limiting a run](#limiting-a-run).                              |
| `--deny-warnings`                                        | Fail on warnings as well as errors.                                                                                                                  |
| `--log-level <level>`                                    | Log the run's work on stderr. See [Logging a run](#logging-a-run).                                                                                   |
| `--json`, `--md`                                         | Write one JSON or Markdown file per violated rule to `.adhere/reports/`.                                                                             |
| `--stdout`                                               | Print one combined report instead of files; use with `--json` or `--md`.                                                                             |

## JSON and Markdown reports

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

## Limiting a run

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

## Logging a run

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

## Exit codes

| Code | When                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Nothing is reported, or only warnings.                                                                                                         |
| 1    | An error is reported. With `--deny-warnings`, a warning too.                                                                                   |
| 1    | The run refuses, for example on an invalid config or rule file, a missing API key, or an unknown command or flag. A refusal prints its reason. |
