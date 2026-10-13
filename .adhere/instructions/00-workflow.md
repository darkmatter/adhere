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
