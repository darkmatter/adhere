---
title: "Agent skills"
---

Three skills teach an agent to work with adhere:

- **[`adhere`](https://github.com/darkmatter/adhere/blob/main/skills/adhere/SKILL.md)**, printed by `adhere skill`, is the
  reference: the commands, how to write and word a rule, the config, presets,
  shared repos and lint packages, Oxlint rules and plugins, comments and
  suppressions, the cache, reading a report, and tuning a rule.
- **[`adhere-setup`](https://github.com/darkmatter/adhere/blob/main/skills/adhere-setup/SKILL.md)**, printed by
  `adhere skill setup`, sets adhere up in a repo with you. See
  [Generate rules from your repo](/adhere/generate-rules/).
- **[`adhere-fix`](https://github.com/darkmatter/adhere/blob/main/skills/adhere-fix/SKILL.md)**, printed by
  `adhere skill fix`, verifies and fixes the findings `lint` reports: it
  checks each against its rule and the code, fixes the real ones, reports the
  false ones with the evidence, and says when a rule is wrong more often than
  right.

Install them with the [skills](https://github.com/vercel-labs/skills) CLI:
`skills add darkmatter/adhere`. The binary carries all three, so
`adhere skill fix > .agents/skills/adhere-fix/SKILL.md` works without a
checkout.

## In CI

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
