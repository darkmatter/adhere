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
