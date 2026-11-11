---
title: "Checking agent transcripts"
---

A transcript rule judges what a coding agent did, not the code it left: a
failing test it skipped to make the suite pass, or tests it said pass without
running them. `adhere lint --type transcript` judges text on stdin against
these rules. As a Claude Code or Codex hook, it checks the agent's turn while
the agent works, and tells the agent what it found.

## Writing a transcript rule

A transcript rule is a rule whose front matter says `type: transcript`. Its
examples are what an agent writes or runs, in `text` fences:

````md
---
description: The agent never skips or deletes a failing test to make the suite pass.
type: transcript
---

## Never

```text
TOOL CALL Edit: {
  "file_path": "test/parser.test.ts",
  "old_string": "it(\"parses",
  "new_string": "it.skip(\"parses"
}
ASSISTANT: The parser test kept failing, so I skipped it. The suite passes now.
```

## Must

```text
ASSISTANT: The parser test still fails: the tokenizer drops the last line. I left the test as it is.
```
````

- `adhere lint` without `--type transcript` leaves transcript rules out.
  `adhere validate` checks their wording as it does any rule's, and compares
  only code rules for contradictions.
- A transcript rule cannot have `tests`, `reads`, `include`, `exclude`,
  `appliesTo`, `excludeIf`, or `appendState`, which are about files. A rule
  that has one fails to load.
- `level`, `threshold`, and the headings work as
  [Rule format](/adhere/rule-format/) says.
- A transcript is in no directory, so a nested `.adhere/` does not scope its
  transcript rules: each applies to every transcript. Give each one an id of
  its own, since of two transcript rules with the same id, only one is checked.

## Checking a transcript

```sh
adhere lint --type transcript < transcript.txt
adhere lint --type transcript --json < transcript.txt > report.json
```

- The report goes to stdout, as Markdown, or as JSON with `--json`. A finding
  names its lines in the transcript, as `transcript:42`.
- It exits as `adhere lint` does: 1 when an error is reported, or a warning
  with `--deny-warnings`, and 0 otherwise.
- It sends without asking, since stdin holds the transcript.
- `--filter`, `--limit`, `--type-aware`, `--md`, and `--stdout` are about
  files, so it refuses them.

Any text works. The hook below writes each tool call as
`TOOL CALL <tool>: <input>` and `RESULT: <output>`, and the agent's last
message as `ASSISTANT: <message>`, so examples written that way look like
what Jev reads.

## How a transcript is judged

A transcript is judged in windows of `transcript.every` tokens, 8,000 by
default, at about three bytes a token. A window also holds at most 255 lines
with text, the most Jev can choose among when it places a finding. A window
ends at a blank line past its middle when it has one, so a tool's output is
rarely split.

Each window is judged once, beside up to half a window of the text before it,
so a closing "the tests pass" is judged with the run that showed it. A window
costs one request, and one more when Jev finds something, to place it. A
window too long for Jev even without the text before it is skipped, and the
report counts it.

## As an agent hook

With `--hook`, adhere reads one hook event as JSON on stdin and prints the
answer Claude Code and Codex read:

| Event                               | What adhere does                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `UserPromptSubmit`                  | Starts a new turn, keeping the prompt as context. The prompt is never judged. Prints nothing.                                                                                                          |
| `PostToolUse`, `PostToolUseFailure` | Adds the tool call and its result to the turn, or, for a call that failed, its error. Each time that fills a window, judges it, and tells the agent what it found as context beside the tool's result. |
| `Stop`, `SubagentStop`              | Adds the agent's last message, and judges the rest of the turn. When it finds something, it blocks the stop, with the findings as the reason, so the agent goes on to fix them.                        |

- Only findings that would fail `adhere lint` reach the agent: errors, and
  warnings too with `--deny-warnings`.
- When the agent stops again after a block, adhere lets it stop without
  judging again.
- A stop with no prompt and no tool call before it is not judged: its turn
  holds nothing the agent did, only a last message. This passes over helper
  agents a harness runs for itself, and also a subagent that only answers in
  text.
- It exits 0 whatever it finds. When adhere itself fails, as on a missing API
  key, it exits 1, which does not block the agent: the turn goes on unchecked.
- A window Jev could not judge is reported to you, not the agent.
- The prompt and each tool call's input and output are cut to a quarter of a
  window, keeping their start and end.
- Text the agent writes between tool calls never reaches a hook, so it is not
  judged.
- adhere takes the working directory as the project, for its `.adhere/` and
  for where it keeps the turn, so the hooks below run it from the project
  root.

Each check makes the agent wait for Jev. A smaller `transcript.every` tells
the agent sooner, and costs more requests and more waiting.

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && adhere lint --type transcript --hook"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && adhere lint --type transcript --hook"
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && adhere lint --type transcript --hook"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && adhere lint --type transcript --hook"
          }
        ]
      }
    ]
  }
}
```

Claude Code sends a tool call that fails, such as a test run that exits
non-zero, as `PostToolUseFailure` rather than `PostToolUse`; without that
entry, adhere never sees a failing run. Add a `SubagentStop` entry like `Stop`
to check subagents' turns as well.

### Codex

Add the same `hooks` object to `.codex/hooks.json`, with
`cd "$(git rev-parse --show-toplevel)"` in place of
`cd "$CLAUDE_PROJECT_DIR"`. Codex sends a command that fails as `PostToolUse`,
with its output, and skips the `PostToolUseFailure` entry. Codex runs a
project's hooks only once you trust the project and review the hooks in
`/hooks`.

## Privacy and history

A transcript holds whatever the agent read or ran, secrets included, and
adhere sends it to Jev, or the configured provider, as it sends code. adhere
never adds the hook to a project; add it only where that is acceptable.

Each check keeps the text it judged and its report, and for a hook the prompt
and its answer, in `<temp>/adhere-<uid>/<project>-<hash>/runs/`, where
`<temp>` is the system temp directory. It keeps the newest
`transcript.keep`, 20 by default; 0 keeps none. A hook also keeps each
session's last prompt under `sessions/` there, and its turn so far until the
agent stops or you send the next prompt; adhere does not prune `sessions/`.
adhere makes these folders so only you can open them, but does not check who
owns or can open one that is already there. On Windows the folder is
`<temp>/adhere/`. A transcript check writes nothing in the repository.

## Settings

```ts
export default defineConfig({
  transcript: { every: 4_000, keep: 5 },
});
```

| Key                | Default | What it does                                                       |
| ------------------ | ------- | ------------------------------------------------------------------ |
| `transcript.every` | 8,000   | Tokens of transcript per check, 1,000 to 16,000.                   |
| `transcript.keep`  | 20      | How many checks the temp directory keeps of their text and report. |
