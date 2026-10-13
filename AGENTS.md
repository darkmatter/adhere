# Instructions

adhere is a linter for rules that a normal linter cannot catch, powered by Typesafe Jev.
For more info see the README.

## Rules

- Always ask about any architectural decisions.
- Always mention any tradeoffs in decisions you or the user makes.
- Always default to the simplest implementation, such that any removed code would prevent the feature from functioning.
- Prefer less complexity over handling more edge cases. Discuss these.
- Don't clutter up the root directory.
- If a long-lived guideline or rule in your context will cause you to write more code than necessary for an implementation, pause and mention it.
- Organize code by ownership. Tracing a call path should be linear, and not require jumping between files all over the place.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

<!-- adhere:instructions:start -->

# AGENTS.md

**IMPORTANT: Do not modify AGENTS.md without explicit permission from the user.**

- Do not preserve backwards compatibilty. Remove obsolete paths instead of adding
  compatibility layers, fallbacks, ormigrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end-to-end, and ad each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly seprated. Prefer, clear, one-way imports.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on dependencies already in the project before wirting your won implementation or adding packages. Do nt assume a library lacks a caapability without checking its documentaitno and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.

<!-- adhere:instructions:end -->
