---
title: "Getting Started"
---

Save your TypeSafe AI API key once (see [Login](/adhere/install/#login)), then try the built-in
presets on your code before you write a rule of your own:

```sh
npx adhere login
npx adhere lint --preset typescript,react
```

Presets cover TypeScript, React, security, Effect, and alchemy. See
[Presets](/adhere/presets/).

To set up rules of your own:

```sh
npx adhere init        # .adhere/config.ts, two example rules, and the dependency
npx adhere validate    # check your rules' wording, and ask Jev whether any contradict
npx adhere lint        # audit the working directory
git add .adhere        # commit the rules, and the judgments they cost
```

## Init

`adhere init` creates a config file and some example rules, and adds adhere
as a dev dependency.

It is safe to rerun: existing files are reported as skipped, and only `--force`
overwrites them.

## The day-to-day loop

After that, using adhere is a short loop:

1. **Write or edit a rule** in `.adhere/rules/`. A rule is one sentence saying
   what code must be, with code that shows it: see
   [Rule format](/adhere/rule-format/).
2. **Run `adhere lint`.** It says what it found and what judging takes, and
   asks before it sends anything: see [Running lint](/adhere/running-lint/).
3. **Read the findings.** Each finding names the rule, Jev's probability, and
   the lines it points at: see [Reading the report](/adhere/reading-the-report/).
4. **Fix the code, the rule, or neither.** A wrong finding is usually the
   rule's wording reaching too far: see
   [Writing good rules](/adhere/writing-good-rules/). Suppress a finding that is wrong
   for this code alone with a comment that says why: see
   [Comments and suppressions](/adhere/comments-and-suppressions/).
5. **Commit `.adhere/`, cache included.** Judgments are cached by file content
   and rule text, so the next run, and CI, only pay for what changed: see
   [Cache](/adhere/cache/).
