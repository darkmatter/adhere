---
title: "Compose your AGENTS.md"
---

`adhere postinstall` renders the Markdown files in an instructions directory,
in name order, into a managed block in `AGENTS.md`. Set the directory with the
config's `instructions` key, relative to the config file. Without it, adhere
looks in `.adhere/instructions/`, then `.agents/instructions/`.

To run it after installing dependencies, add it to your package scripts, or
append it to your existing `postinstall` script:

```json
{
  "scripts": {
    "postinstall": "adhere postinstall"
  }
}
```

The command creates `AGENTS.md` if needed, and appends the block if it is
absent. Otherwise it replaces only the content between these markers:

```markdown
<!-- adhere:instructions:start -->

Generated instructions

<!-- adhere:instructions:end -->
```

- Everything outside the block is kept.
- A missing instructions directory changes nothing. An empty one clears the
  generated content, but keeps the markers.
- Malformed or duplicate markers in `AGENTS.md`, or a marker inside an
  instruction file, fail the command before it writes anything.
