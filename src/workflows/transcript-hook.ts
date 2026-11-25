import { AdhereConfig } from "#services/AdhereConfig.ts";
import { sha256 } from "#services/AuditCache.ts";
import { failing } from "#workflows/audit.ts";
import { renderJson, renderMarkdown, renderOptionsOf } from "#workflows/format.ts";
import {
  judgeTranscript,
  linesOf,
  type TranscriptResult,
  windowsOf,
} from "#workflows/transcript.ts";
import { projectTemp, saveRun } from "#workflows/transcript-runs.ts";
import { Console, Effect, FileSystem, Path, Schema } from "effect";

/**
 * `adhere lint --type transcript --hook`, as a Claude Code or Codex hook. It
 * reads the event the agent's harness sends on stdin, keeps the agent's turn
 * in the temp directory, judges each window of it as it fills and the rest
 * when the agent stops, and answers in the harness's protocol: findings as
 * context after a tool call, and as a reason to go on at a stop.
 * docs/decisions.md, "Agent hooks answer in the harness's protocol", says why.
 */

/** The fields of a hook event adhere reads, which Claude Code and Codex both send. */
const HookEvent = Schema.Struct({
  hook_event_name: Schema.String,
  session_id: Schema.String,
  /** Set in a subagent's events, whose turn is its own. */
  agent_id: Schema.optionalKey(Schema.String),
  prompt: Schema.optionalKey(Schema.String),
  tool_name: Schema.optionalKey(Schema.String),
  tool_input: Schema.optionalKey(Schema.Unknown),
  tool_response: Schema.optionalKey(Schema.Unknown),
  /** Claude Code's in place of `tool_response`, for a call that failed, such as a command that exits non-zero. */
  error: Schema.optionalKey(Schema.Unknown),
  last_assistant_message: Schema.optionalKey(Schema.NullOr(Schema.String)),
  /** Whether the agent is going on because a Stop hook told it to. */
  stop_hook_active: Schema.optionalKey(Schema.Boolean),
});

export class HookUnreadable extends Schema.TaggedError<HookUnreadable>()("HookUnreadable", {
  message: Schema.String,
}) {}

/**
 * The most of a reason the agent reads whole: Codex shows the model about
 * 2,500 tokens of a hook's answer, and Claude Code cuts it at 10,000 characters.
 */
const REASON_LIMIT = 7_500;

/** `text` cut in the middle to about `tokens` tokens, by the 3 bytes a token the estimate counts. */
const cut = (text: string, tokens: number): string => {
  const bytes = new TextEncoder().encode(text);
  const half = Math.floor((tokens * 3) / 2);
  if (bytes.length <= half * 2) return text;
  // A character the cut splits in two decodes as U+FFFD.
  const decoder = new TextDecoder();
  return `${decoder.decode(bytes.subarray(0, half))}\n[… ${bytes.length - half * 2} bytes cut …]\n${decoder.decode(bytes.subarray(-half))}`;
};

const asText = (value: unknown): string =>
  value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value, null, 2);

const reasonOf = (
  found: TranscriptResult,
  report: string,
  stopping: boolean,
  run: string | undefined,
): string => {
  const lead = stopping
    ? "adhere checked the end of your turn against this project's transcript rules and found the problems below. Fix them, or say why they do not apply, before you finish."
    : "adhere checked your work so far against this project's transcript rules and found the problems below. Take them into account as you go on.";
  const text = `${lead}\n\n${report}`;
  if (text.length <= REASON_LIMIT) return text;
  const whole = run === undefined ? "" : ` The whole report is in ${run}/report.json.`;
  return `${text.slice(0, REASON_LIMIT)}\n\n[The report is cut here: ${found.findings.length} findings in all.${whole}]`;
};

/** What the user sees of the windows adhere could not check, beside the agent's work. */
const uncheckedOf = (result: TranscriptResult): string | undefined => {
  const parts = [
    ...(result.skipped > 0 ? [`${result.skipped} too long for Jev`] : []),
    ...(result.blocked.length > 0
      ? [
          `${result.blocked.length} refused by the firewall in front of Jev's API (Ray ID ${result.blocked.map(({ ray }) => ray).join(", ")})`,
        ]
      : []),
  ];
  return parts.length === 0
    ? undefined
    : `adhere could not check part of this turn: ${parts.join("; ")}.`;
};

/**
 * Answers one hook event. A prompt starts a turn; a tool call adds to it and
 * judges the windows it filled; a stop judges the rest and ends the turn. A
 * stop the agent makes after being told to go on judges nothing, so a rule
 * Jev keeps flagging cannot hold an agent forever. Prints one JSON object,
 * or nothing when there is nothing to say, and leaves the exit code to adhere's own failures.
 */
export const answerHook = Effect.fn("transcript.hook")(function* (
  input: string,
  denyWarnings: boolean,
) {
  const event = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(HookEvent))(input).pipe(
    Effect.mapError((problem) =>
      HookUnreadable.make({
        message: `--hook reads the event Claude Code or Codex sends a hook on stdin, and this is not one: ${problem.message}`,
      }),
    ),
  );
  const config = yield* AdhereConfig;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve();
  const project = yield* projectTemp(root);
  const key = yield* sha256(`${event.session_id}\u0000${event.agent_id ?? ""}`);
  const session = path.join(project, "sessions", key.slice(0, 16));
  const turn = path.join(session, "turn.txt");
  const promptFile = path.join(session, "prompt.txt");
  const claims = path.join(session, "claims");
  const every = config.transcript.every;
  yield* fs.makeDirectory(claims, { recursive: true, mode: 0o700 });
  const append = (text: string) => fs.writeFileString(turn, text, { flag: "a", mode: 0o600 });
  const endTurn = Effect.all(
    [fs.remove(turn, { force: true }), fs.remove(claims, { recursive: true, force: true })],
    { discard: true },
  );
  const readIfThere = (file: string) =>
    Effect.flatMap(fs.exists(file), (there) =>
      there ? fs.readFileString(file) : Effect.succeed(""),
    );
  // A window belongs to the check that makes its claim first; the claim stays, so no check repeats it.
  const claim = (start: number) =>
    fs
      .writeFileString(path.join(claims, String(start).padStart(9, "0")), "", {
        flag: "wx",
        mode: 0o600,
      })
      .pipe(
        Effect.as(true),
        Effect.catchReason("PlatformError", "AlreadyExists", () => Effect.succeed(false)),
      );

  /** Judges the turn's unclaimed windows: the full ones, and the last too when `stopping`. */
  const check = (stopping: boolean) =>
    Effect.gen(function* () {
      const text = yield* readIfThere(turn);
      const lines = linesOf(text);
      const starts = (yield* fs.readDirectory(claims)).map(Number).filter(Number.isInteger);
      // Text is only added to a turn, so a full window's end stays where it was first found.
      const from =
        starts.length === 0
          ? 1
          : (windowsOf(lines, every, Math.max(...starts))[0]?.last ?? lines.length) + 1;
      const pending = windowsOf(lines, every, from);
      const mine = yield* Effect.filter(stopping ? pending : pending.slice(0, -1), (window) =>
        claim(window.first),
      );
      if (mine.length === 0) return;
      const prompt = yield* readIfThere(promptFile);
      const result = yield* judgeTranscript(lines, mine, prompt);
      const options = renderOptionsOf(config, root);
      const run = yield* saveRun(project, config.transcript.keep, {
        "input.txt": text,
        ...(prompt === "" ? {} : { "prompt.txt": prompt }),
        "report.json": renderJson(result, options),
      });
      const failed = failing(result.findings, denyWarnings);
      const found = { ...result, findings: failed };
      const reason =
        failed.length === 0
          ? undefined
          : reasonOf(found, renderMarkdown(found, options), stopping, run);
      const unchecked = uncheckedOf(result);
      const reply = {
        ...(reason === undefined
          ? {}
          : stopping
            ? { decision: "block", reason }
            : {
                hookSpecificOutput: {
                  hookEventName: event.hook_event_name,
                  additionalContext: reason,
                },
              }),
        ...(unchecked === undefined ? {} : { systemMessage: unchecked }),
      };
      if (Object.keys(reply).length === 0) return;
      const json = JSON.stringify(reply);
      yield* Console.log(json);
      if (run !== undefined) {
        // A newer check may already have pruned this run, as `transcript.keep` asks.
        yield* fs
          .writeFileString(path.join(run, "reply.json"), json, { mode: 0o600 })
          .pipe(Effect.catchReason("PlatformError", "NotFound", () => Effect.void));
      }
    });

  switch (event.hook_event_name) {
    case "UserPromptSubmit": {
      // Claude Code adds what this event prints to the agent's context, so it prints nothing.
      yield* endTurn;
      yield* fs.writeFileString(promptFile, cut(event.prompt ?? "", every / 4), { mode: 0o600 });
      return;
    }
    // Claude Code sends a call that failed, such as a test run that exits non-zero, as its own
    // event, with an error in place of a result; Codex sends it as PostToolUse.
    case "PostToolUse":
    case "PostToolUseFailure": {
      yield* append(
        `TOOL CALL ${event.tool_name ?? "unknown"}: ${cut(asText(event.tool_input), every / 4)}\nRESULT: ${cut(asText(event.tool_response ?? event.error), every / 4)}\n\n`,
      );
      return yield* check(false);
    }
    case "Stop":
    case "SubagentStop": {
      // A turn with no prompt and no tool call holds nothing the agent did, only a last
      // message, as from a helper agent a harness runs for itself, so its stop is not judged.
      const acted = (yield* readIfThere(turn)).trim() !== "" || (yield* fs.exists(promptFile));
      if (event.stop_hook_active !== true && acted) {
        const said = event.last_assistant_message ?? "";
        if (said.trim() !== "") yield* append(`ASSISTANT: ${cut(said, every / 4)}\n\n`);
        yield* check(true);
      }
      return yield* endTurn;
    }
    default:
      return;
  }
});
