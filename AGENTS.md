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
