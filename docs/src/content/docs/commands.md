---
title: "Commands"
---

| Command                           | What it does                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adhere lint`                     | Audit the working directory. See [Running lint](/adhere/running-lint/).                                                                           |
| `adhere validate`                 | Check the rules' wording, list rules a linter could check, and ask Jev whether any contradict. See [Validating rules](/adhere/validating-rules/). |
| `adhere postinstall`              | Render instruction files into a managed block in `AGENTS.md`. See [Compose your AGENTS.md](/adhere/compose-agents-md/).                           |
| `adhere init [--force]`           | Scaffold `.adhere/config.ts` and two example rules. See [Init](/adhere/getting-started/#init).                                                    |
| `adhere init --shared org/repo`   | Scaffold a repo of rules other repos install. See [Creating a shared repo](/adhere/install-rules/#creating-a-shared-repo).                        |
| `adhere list org/repo`            | List the rules in another repo's `.adhere/rules/`. See [Install rules from other repos](/adhere/install-rules/).                                  |
| `adhere install org/repo`         | Copy those rules into this repo's `.adhere/rules/org/repo/`.                                                                                      |
| `adhere login`, `adhere logout`   | Save or delete a TypeSafe AI API key, or with `--openai`, an OpenAI one. See [Login](/adhere/install/#login).                                     |
| `adhere skill [docs\|setup\|fix]` | Print an agent skill. See [Agent skills](/adhere/agent-skills/).                                                                                  |

Bare `adhere` prints the help. `adhere <command> --help` lists a command's
flags, and `adhere --completions <shell>` prints a completion script.
