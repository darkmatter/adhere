---
title: "Generate rules from your repo"
---

Let an agent write your first rules with you. The
[`adhere-setup`](https://github.com/darkmatter/adhere/blob/main/skills/adhere-setup/SKILL.md) skill walks the agent through
setting adhere up in your repo:

1. It reads where your conventions live: `AGENTS.md`, `CONTRIBUTING.md`, docs
   and ADRs, your lint config, recent review comments, and the code others copy
   from.
2. It drafts the conventions a normal linter cannot check as rules, each with
   real code from your repo. A convention a linter can decide is routed to a
   native Oxlint rule or a small syntax-only Oxlint JS plugin instead.
3. It adds the presets that fit your stack, plus instructions and rules from
   your organization's [shared repo](/adhere/install-rules/), if you have one.
   It asks before adding that repo's `lint/` package.
4. It shows every candidate in one list, with its evidence, and imports the ones
   you choose.
5. It validates them, walks you through the first lint and what it costs, and
   adds adhere to CI.

It stops to ask you at each of those decisions, and never asks for your API key.

To add one rule directly, run `adhere rules create [idea]`. It asks a coding
agent for one of three routes: a native Oxlint rule, a small syntax-only Oxlint
JS plugin, or a `RULE.md`/`RULE.ts`. A native rule must be one of adhere's
Oxlint catalog ids; an unknown id is rejected. The printed config carries the
rule's exact option values: a rule whose defaults suffice gets `"error"`, while
an option-dependent rule gets `["error", ...options]`, because bare `"error"`
would enforce nothing. Banning lodash through `no-restricted-imports`, for
example, prints `["error", { "paths": [{ "name": "lodash" }] }]`. The wizard
prints the exact config, or enables the same setting in a shared repo's
`lint/rules.json` for a pull request. A plugin is shown with its valid and
invalid examples and runs nothing until you approve it; its tests use the
project's own Oxlint or Vite+ and Node 22 or newer. Oxlint's RuleTester
refuses Bun and older Node, so without one nothing is written and no repair is
attempted. One failed test gets one agent repair, you approve the repaired
plugin, and it runs again. Nothing is written unless the tests pass. A project
plugin and its test land in `.adhere/oxlint/` as `.mjs` files; add the printed
`jsPlugins` entry to your lint config. A shared plugin goes in `lint/plugins/`
as `.js` and is registered in `lint/rules.json`. A shared repo's README index
is refreshed in the same commit as the rule or plugin; when you run the wizard
inside the shared repo itself, choosing this project writes its
`lint/rules.json` or `lint/plugins/` locally.

```sh
skills add darkmatter/adhere   # install adhere's skills for your agent
```

Then ask your agent to set adhere up.
