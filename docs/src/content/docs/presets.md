---
title: "Presets"
---

Built-in rule sets. Name one, or one of its topics, in the config's `presets`
or with `--preset`:

| Preset                                                                             | Rules | For                                                   | What it asks for                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`typescript`](https://github.com/darkmatter/adhere/blob/main/presets/typescript/) | 11    | any TypeScript project                                | Data from outside checked at runtime, invalid states unrepresentable, errors never swallowed, resources released on every path, arguments not mutated, and tests that assert outcomes and stand alone.                                                                                          |
| [`react`](https://github.com/darkmatter/adhere/blob/main/presets/react/)           | 10    | components and hooks                                  | Logic for an event in its handler rather than an effect, effects that clean up and ignore stale fetches, `useSyncExternalStore` for outside stores, state that neither copies props nor contradicts itself, and Server Functions and Server Components that guard what crosses to the client.   |
| [`security`](https://github.com/darkmatter/adhere/blob/main/presets/security/)     | 4     | any project                                           | Secrets kept out of logs, error messages, and responses; parameterized SQL; no untrusted input in shell commands, `eval`, or file paths; and secrets compared in constant time. From OWASP's cheat sheets.                                                                                      |
| [`effect`](https://github.com/darkmatter/adhere/blob/main/presets/effect/)         | 16    | code written with Effect                              | Steps sequenced with `Effect.gen`, instrumentation attached with `.pipe`, config read through a service and validated, secrets redacted, branded primitives and tagged unions, defects kept apart from typed errors, services built by layers, and tests with their own layers and `TestClock`. |
| [`alchemy`](https://github.com/darkmatter/adhere/blob/main/presets/alchemy/)       | 41    | code that deploys with [alchemy](https://alchemy.run) | Where Config and bindings are read, which resources keep their data, how secrets stay out of bundles and logs, authorization on public URLs, migrations, durable workflows, and custom providers.                                                                                               |

- Name presets in the config's `presets`, or on the command line with
  `--preset`, repeated or separated by commas, as in `--preset effect,alchemy`.
  Naming presets on the command line makes the config file optional, and
  presets named in both places apply together.
- A topic, one of a preset's subdirectories, is a preset of its own:
  `--preset effect/basics` applies only the rules under
  `presets/effect/basics/`, and `alchemy/secrets` applies only alchemy's
  secrets rules. `security` has no topics.
- To change a preset's rule without copying it, use [Overrides](/adhere/config/#overrides).
- [presets/README.md](https://github.com/darkmatter/adhere/blob/main/presets/README.md) lists every rule in each preset,
  with a one-line summary and a link to the full rule.

<details>
<summary>What every preset does</summary>

- It has no rules for what a linter checks exactly.
  [presets/README.md](https://github.com/darkmatter/adhere/blob/main/presets/README.md) names the lint rules to turn on
  instead.
- A preset rule says "must" only where its source makes a requirement, and
  "should" where the source gives advice.
- A topic's rules keep the ids they have in the whole preset, so a topic and its
  preset share cached judgments, and naming both applies each rule once.
- `effect` and `alchemy` have no rule that `typescript` or `security` already
  has, so a project on Effect or alchemy names `typescript` and `security` too.

</details>
