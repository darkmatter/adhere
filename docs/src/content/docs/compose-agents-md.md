---
title: "Compose your AGENTS.md"
---

`adhere postinstall` renders every Markdown file under an instructions
directory, recursively, into a managed block in `AGENTS.md`. Set the directory
with the config's `instructions` key, relative to the config file. Without it,
adhere looks in `.adhere/instructions/`, then `.agents/instructions/`.

The order is deterministic. Files whose path from the instructions directory
has at least three segments come first, which is where files copied from
another repo land (under `.adhere/instructions/org/repo/`); a local file two
directories deep sorts there too. Then come files directly in the instructions
directory, then files one directory deep. Each group sorts by path. So a shared
repo's instructions lead a local `00-workflow.md`, and both lead local notes in
a single subdirectory.

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
