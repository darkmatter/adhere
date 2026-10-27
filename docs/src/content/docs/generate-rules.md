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
   real code from your repo, and sets aside the ones a linter could check.
3. It adds the presets that fit your stack, and rules from your organization's
   [shared repo](/adhere/install-rules/), if you have one.
4. It shows every candidate in one list, with its evidence, and imports the ones
   you choose.
5. It validates them, walks you through the first lint and what it costs, and
   adds adhere to CI.

It stops to ask you at each of those decisions, and never asks for your API key.

```sh
skills add darkmatter/adhere   # install adhere's skills for your agent
```

Then ask your agent to set adhere up.

## Write one rule with `adhere rules create`

`adhere rules create` writes one rule with an installed coding agent: `claude`,
`codex`, or `omp`. Pass the idea, or leave it out to be asked for it:

```sh
adhere rules create "business logic should live in services"
```

1. The first run, or `--setup`, settles which agent to use: the one `--agent`
   names, the only one installed, or the one you choose. It asks which GitHub
   repo, as `org/repo`, holds your organization's
   [shared rules](/adhere/install-rules/), which can be left empty, and saves
   both to `~/.config/adhere/settings.json`, or under `$XDG_CONFIG_HOME` when
   that is set. After that, `--agent` asks another agent for one run.
2. The agent names a linter that already checks the idea, if one does, and says
   whether the rule belongs to this project or the shared repo. It suggests three
   names, a `RULE.md` or, when Jev needs state the file cannot show, a
   [`RULE.ts`](/adhere/rule-format/#rules-as-typescript-files), and the config
   context the rule needs: `typeAware` or `reads`.
3. It finds code in the repo for you to judge. Each excerpt shows three lines
   either side, with the agent's call and its reason, and you say whether it
   breaks the rule. The agent picks the draft's examples from the code you
   judged, or writes its own when it finds none.
4. adhere checks the draft and sends problems back to the agent once before it
   shows it to you: a `RULE.md` as `adhere validate` checks wording, a `RULE.ts`
   for whether it parses and has a default export. A `RULE.ts` is imported, its
   code run and its wording checked, only after you approve it, and adhere asks
   whether to write it anyway when that finds problems.
5. A project rule is written to `.adhere/rules/`, with a warning when the config
   lacks the context it needs. An organization rule is committed to a fresh clone
   of the shared repo on the branch `adhere/<rule-id>`, pushed, and linked for a
   pull request.
