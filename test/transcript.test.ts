import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { tokensOf } from "../src/services/Jev.ts";
import { linesOf, windowsOf } from "../src/workflows/transcript.ts";

const execFileAsync = promisify(execFile);
const main = join(process.cwd(), "src/main.ts");
const { TYPESAFE_API_KEY: _key, ...keyless } = process.env;

/** `adhere <args>` in `root`, with `input` on stdin, `temp` as its temp directory, and no API key. */
const adhere = (root: string, temp: string, input: string, ...args: ReadonlyArray<string>) => {
  const running = execFileAsync("bun", [main, ...args], {
    cwd: root,
    env: { ...keyless, TMPDIR: temp, XDG_CONFIG_HOME: join(root, "config") },
  });
  running.child.stdin?.end(input);
  return running.then(
    (output) => ({ ...output, code: 0 }),
    (error: { readonly stdout: string; readonly stderr: string; readonly code: number }) => error,
  );
};

const transcript = (root: string, temp: string, input: string, ...flags: ReadonlyArray<string>) =>
  adhere(root, temp, input, "lint", "--type", "transcript", ...flags);

/** A hook event of one session, as Claude Code and Codex send it, answered with `--hook`. */
const hook = (root: string, temp: string, fields: Readonly<Record<string, unknown>>) =>
  transcript(
    root,
    temp,
    JSON.stringify({ session_id: "session", transcript_path: "/dev/null", cwd: root, ...fields }),
    "--hook",
  );

/** `count` lines of an agent's work. */
const work = (tag: string, count: number): ReadonlyArray<string> =>
  Array.from({ length: count }, (_, index) => `${tag} ${index}: ran the build and read its output`);

const ruleOf = (level: "error" | "warning") =>
  `---\ndescription: The agent never skips a failing test to make the suite pass.\ntype: transcript\nlevel: ${level}\n---\n\n## Never\n\n\`\`\`text\nThe test kept failing, so I marked it it.skip and the suite passes.\n\`\`\`\n`;

/**
 * A local provider that logs each request, flags any window that mentions
 * it.skip, and places the finding on the line that does.
 */
const configOf = (log: string, keep: number) => `import { appendFileSync } from "node:fs";

export default {
  reads: [],
  transcript: { every: 1000, keep: ${keep} },
  provider: {
    model: "transcript-test",
    ask: async (state, questions) => {
      const sections = Object.entries(state.code ?? {});
      const flagged = sections.find(([, text]) => String(text).includes("it.skip"));
      const locating = questions.some((question) => question.id.startsWith("sufficient:"));
      appendFileSync(${JSON.stringify(log)}, JSON.stringify({ code: state.code ?? null, locating, prompt: state.userPrompt ?? null }) + "\\n");
      return {
        answers: Object.fromEntries(
          questions.map((question) => {
            if (question.type !== "choice") {
              return [question.id, question.id.startsWith("sufficient:") ? 0.9 : flagged ? 0.95 : 0.05];
            }
            const options = Object.keys(question.options);
            const line = options.find((option) => String(question.options[option]).includes("it.skip"));
            return [question.id, (/^(start|end):/.test(question.id) ? line : flagged?.[0]) ?? options[0]];
          }),
        ),
      };
    },
  },
};
`;

const made: Array<string> = [];
afterEach(() =>
  Promise.all(made.splice(0).map((path) => rm(path, { recursive: true, force: true }))),
);

/** A repo with a code rule and a transcript rule, keeping `keep` checks in a temp directory of its own. */
const project = async (keep = 2) => {
  const root = await mkdtemp(join(tmpdir(), "adhere-transcript-"));
  const temp = await mkdtemp(join(tmpdir(), "adhere-transcript-temp-"));
  made.push(root, temp);
  const log = join(root, "requests.log");
  for (const rule of ["agent/no-skips", "data/ports"]) {
    await mkdir(join(root, ".adhere/rules", rule), { recursive: true });
  }
  await writeFile(join(root, ".adhere/rules/agent/no-skips/RULE.md"), ruleOf("error"));
  await writeFile(
    join(root, ".adhere/rules/data/ports/RULE.md"),
    "---\ndescription: A port must be a branded integer.\n---\n\nconst port = Port(3000);\n",
  );
  await writeFile(join(root, ".adhere/config.ts"), configOf(log, keep));
  return { root, temp, log };
};

/** Each request the provider got, as it logged it: the text it judged, whether it located, and the prompt. */
const requestsOf = async (log: string) =>
  existsSync(log)
    ? (await readFile(log, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
    : [];

/** The user's adhere folder in `temp`, and the run folders a project's checks kept there, oldest first. */
const runsOf = async (temp: string) => {
  const base = join(temp, (await readdir(temp)).find((name) => name.startsWith("adhere")) ?? "");
  const runs = join(base, (await readdir(base))[0] ?? "", "runs");
  return { base, runs: (await readdir(runs)).sort().map((name) => join(runs, name)) };
};

const modeOf = async (path: string) => (await stat(path)).mode & 0o777;

describe("lint --type transcript", () => {
  it("judges piped text against the transcript rules alone, by transcript line, with lint's exit codes", async () => {
    const { root, temp } = await project();
    const lines = [
      ...work("A", 40),
      "",
      ...work("B", 40),
      "",
      "The parser test kept failing, so I marked it it.skip.",
      "",
      ...work("C", 10),
    ];
    const dirty = `${lines.join("\n")}\n`;
    const skip = lines.findIndex((line) => line.includes("it.skip")) + 1;
    // The skip is past the first window, so its line counts from the transcript's start.
    expect(windowsOf(lines, 1_000)[0]?.last).toBeLessThan(skip);

    const json = await transcript(root, temp, dirty, "--json");
    expect(json.code).toBe(1);
    const report = JSON.parse(json.stdout);
    expect(report).toMatchObject({ judged: report.windows, skipped: 0, blocked: [] });
    expect(report.findings).toEqual([
      expect.objectContaining({
        rule: "agent/no-skips",
        file: "transcript",
        lines: { first: skip, last: skip },
        excerpt: { start: skip, lines: [lines[skip - 1]] },
      }),
    ]);
    const markdown = await transcript(root, temp, dirty);
    expect(markdown.code).toBe(1);
    expect(markdown.stdout).toContain(`## transcript:${skip}`);
    expect(markdown.stdout).not.toContain("data/ports");

    expect((await transcript(root, temp, `${work("A", 20).join("\n")}\n`)).code).toBe(0);
    const empty = await transcript(root, temp, "\n", "--json");
    expect(empty.code).toBe(0);
    expect(JSON.parse(empty.stdout)).toMatchObject({ windows: 0, findings: [] });

    await writeFile(join(root, ".adhere/rules/agent/no-skips/RULE.md"), ruleOf("warning"));
    expect((await transcript(root, temp, dirty)).code).toBe(0);
    expect((await transcript(root, temp, dirty, "--deny-warnings")).code).toBe(1);
  }, 30_000);

  it("keeps the newest transcript.keep checks where only the user can open them, and nothing in the repo", async () => {
    const { root, temp } = await project();
    for (const text of ["first\n", "second\n", "third\n"]) {
      expect((await transcript(root, temp, text)).code).toBe(0);
    }
    const { base, runs } = await runsOf(temp);
    expect(await Promise.all(runs.map((run) => readFile(join(run, "input.txt"), "utf8")))).toEqual([
      "second\n",
      "third\n",
    ]);
    expect(await modeOf(base)).toBe(0o700);
    for (const run of runs) {
      expect(await modeOf(run)).toBe(0o700);
      expect((await readdir(run)).sort()).toEqual(["input.txt", "report.json"]);
      for (const file of await readdir(run)) expect(await modeOf(join(run, file))).toBe(0o600);
    }
    expect(existsSync(join(root, ".adhere/reports"))).toBe(false);
    expect(existsSync(join(root, ".adhere/cache"))).toBe(false);
  }, 30_000);

  it("refuses flags a transcript has no use for, and --hook outside a transcript check or with --json", async () => {
    const { root, temp, log } = await project();
    const unused = await transcript(
      root,
      temp,
      "text\n",
      "--filter",
      "src/**",
      "--limit",
      "1",
      "--type-aware",
      "--md",
      "--stdout",
    );
    expect(unused.code).toBe(1);
    const refusal = unused.stderr.split("\n").find((line) => line.includes("cannot take")) ?? "";
    for (const flag of ["--filter", "--limit", "--type-aware", "--md", "--stdout"]) {
      expect(refusal).toContain(flag);
    }
    const codeHook = await adhere(root, temp, "{}", "lint", "--hook");
    expect(codeHook.code).toBe(1);
    expect(codeHook.stderr).toContain("--type transcript");
    const jsonHook = await transcript(root, temp, "{}", "--hook", "--json");
    expect(jsonHook.code).toBe(1);
    expect(jsonHook.stderr).toContain("--json");
    expect(existsSync(log)).toBe(false);
  }, 30_000);

  it("leaves transcript rules out of code lint and of validate's contradiction check", async () => {
    const { root, temp, log } = await project();
    await writeFile(join(root, "a.ts"), "export const port = 3000;\n");
    const planned = await adhere(root, temp, "", "lint", "--limit", "0");
    expect(planned.code).toBe(0);
    expect(planned.stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
    // Paired with the code rule, the transcript rule would be sent to be compared.
    expect((await adhere(root, temp, "", "validate")).code).toBe(0);
    expect(existsSync(log)).toBe(false);
  }, 30_000);

  it("answers an agent's hook: context after a tool call, a block at the stop, each window judged once", async () => {
    const { root, temp, log } = await project();
    const event = (fields: Readonly<Record<string, unknown>>) => hook(root, temp, fields);
    const tool = (command: string, output: string) =>
      event({
        hook_event_name: "PostToolUse",
        tool_name: "Bash",
        tool_input: { command },
        tool_response: output,
      });

    expect(
      await event({ hook_event_name: "UserPromptSubmit", prompt: "Fix the parser." }),
    ).toMatchObject({ code: 0, stdout: "" });
    expect(await tool("edit", "Marked the parser test it.skip.")).toMatchObject({
      code: 0,
      stdout: "",
    });
    const replies: Array<string> = [];
    for (const step of [1, 2, 3, 4, 5, 6]) {
      const answered = await tool(`build ${step}`, work(`build ${step}`, 20).join("\n"));
      expect(answered.code).toBe(0);
      if (answered.stdout !== "") replies.push(answered.stdout);
    }
    // Only the first window mentions the skip, and it is told once, while the agent works.
    expect(replies.map((reply) => JSON.parse(reply))).toEqual([
      {
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: expect.stringContaining("agent/no-skips"),
        },
      },
    ]);

    const stop = await event({
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "Done: the flaky parser test is it.skip now.",
    });
    expect(stop.code).toBe(0);
    expect(JSON.parse(stop.stdout)).toEqual({
      decision: "block",
      reason: expect.stringContaining("agent/no-skips"),
    });
    const newest = (await runsOf(temp)).runs.at(-1) ?? "";
    expect(await readFile(join(newest, "reply.json"), "utf8")).toBe(stop.stdout.trim());
    const turn = linesOf(await readFile(join(newest, "input.txt"), "utf8"));
    const requests = await requestsOf(log);
    const judged = requests.filter((request) => !request.locating);
    expect(judged).toHaveLength(windowsOf(turn, 1_000).length);
    expect(new Set(judged.map((request) => JSON.stringify(request.code))).size).toBe(judged.length);
    expect(requests.every((request) => request.prompt === "Fix the parser.")).toBe(true);

    // Going on because of that block, the agent may stop: nothing more is judged.
    const again = await event({
      hook_event_name: "Stop",
      stop_hook_active: true,
      last_assistant_message: "It is still it.skip.",
    });
    expect(again).toMatchObject({ code: 0, stdout: "" });
    expect(await requestsOf(log)).toHaveLength(requests.length);
  }, 60_000);

  it("keeps a subagent's turn apart from its parent's, by the agent_id both harnesses send", async () => {
    const { root, temp, log } = await project();
    const parent = (fields: Readonly<Record<string, unknown>>) => hook(root, temp, fields);
    const subagent = (fields: Readonly<Record<string, unknown>>) =>
      hook(root, temp, { agent_id: "helper", ...fields });
    const ran = (command: string, output: string) => ({
      hook_event_name: "PostToolUse",
      tool_name: "Bash",
      tool_input: { command },
      tool_response: output,
    });

    await parent({ hook_event_name: "UserPromptSubmit", prompt: "Fix the parser." });
    await parent(ran("build", work("parent", 5).join("\n")));
    await subagent(ran("edit", "Marked the parser test it.skip."));
    const stopped = await subagent({
      hook_event_name: "SubagentStop",
      stop_hook_active: false,
      last_assistant_message: "Skipped the flaky test.",
    });
    expect(JSON.parse(stopped.stdout)).toMatchObject({ decision: "block" });
    const stop = await parent({
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "The build passes.",
    });
    expect(stop).toMatchObject({ code: 0, stdout: "" });

    // The subagent's stop judged its own text alone, and left its parent's turn for the parent's stop.
    const judged = (await requestsOf(log))
      .filter((request) => !request.locating)
      .map(({ code }) => JSON.stringify(code));
    expect(judged).toHaveLength(2);
    expect(judged[0]).toContain("it.skip");
    expect(judged[0]).not.toContain("parent 0");
    expect(judged[1]).toContain("parent 0");
    expect(judged[1]).not.toContain("it.skip");
  }, 60_000);

  it("judges nothing at a stop whose turn holds no prompt or tool call", async () => {
    const { root, temp, log } = await project();
    const stopped = await hook(root, temp, {
      agent_id: "helper",
      hook_event_name: "SubagentStop",
      stop_hook_active: false,
      last_assistant_message: "mark the test it.skip anyway",
    });
    expect(stopped).toMatchObject({ code: 0, stdout: "" });
    expect(existsSync(log)).toBe(false);
  }, 30_000);

  it("judges each window of a turn once when the agent's tool calls end at the same time", async () => {
    // Enough runs kept for every check of the turn, so none prunes another's while it is written.
    const { root, temp, log } = await project(20);
    const calls = await Promise.all(
      Array.from({ length: 16 }, (_, step) =>
        hook(root, temp, {
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_input: { command: `build ${step}` },
          tool_response: work(`build ${step}`, 20).join("\n"),
        }),
      ),
    );
    for (const call of calls) expect(call).toMatchObject({ code: 0, stdout: "" });
    const stop = await hook(root, temp, {
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "The build passes.",
    });
    expect(stop).toMatchObject({ code: 0, stdout: "" });
    // The stop judges the last window, so its run, the newest, holds the whole turn.
    const newest = (await runsOf(temp)).runs.at(-1) ?? "";
    const turn = linesOf(await readFile(join(newest, "input.txt"), "utf8"));
    const judged = (await requestsOf(log)).map(({ code }) => JSON.stringify(code));
    expect(judged).toHaveLength(windowsOf(turn, 1_000).length);
    expect(new Set(judged).size).toBe(judged.length);
  }, 60_000);

  it("judges a call Claude Code reports as failed, with its error as the result, and answers in that event", async () => {
    const { root, temp, log } = await project();
    const replies: Array<unknown> = [];
    // Claude Code sends a command that exits non-zero as PostToolUseFailure, with `error` and no `tool_response`.
    const answer = async (command: string, error: string) => {
      const answered = await hook(root, temp, {
        hook_event_name: "PostToolUseFailure",
        tool_name: "Bash",
        tool_input: { command },
        error,
        is_interrupt: false,
      });
      expect(answered.code).toBe(0);
      if (answered.stdout !== "") replies.push(JSON.parse(answered.stdout));
    };

    await answer(
      "sed -i 's/it(/it.skip(/' test/lexer.test.ts && bun test",
      "Exit code 1\n✗ lexer > reads a name\n 1 fail",
    );
    for (const step of [1, 2, 3, 4, 5, 6]) {
      await answer(`build ${step}`, `Exit code 1\n${work(`build ${step}`, 20).join("\n")}`);
    }
    expect(replies).toEqual([
      {
        hookSpecificOutput: {
          hookEventName: "PostToolUseFailure",
          additionalContext: expect.stringContaining("agent/no-skips"),
        },
      },
    ]);
    const [first] = await requestsOf(log);
    expect(JSON.stringify(first?.code)).toContain("✗ lexer > reads a name");
  }, 60_000);
});

describe("transcript windows", () => {
  it("cover the lines in order within the budget, end at a blank line, and never move as text is added", () => {
    const paragraphs = Array.from({ length: 30 }, (_, index) =>
      work(`p${index}`, 1 + ((index * 7) % 9)).join("\n"),
    );
    const lines = linesOf(`${[...paragraphs, "x".repeat(4_000), "end"].join("\n\n")}\n`);
    const every = 1_000;
    const windows = windowsOf(lines, every);
    expect(windows[0]?.first).toBe(1);
    expect(windows.at(-1)?.last).toBe(lines.length);
    for (const [index, window] of windows.entries()) {
      const text = lines.slice(window.first - 1, window.last);
      if (index > 0) expect(window.first).toBe((windows[index - 1]?.last ?? 0) + 1);
      if (text.length > 1) {
        expect(text.reduce((size, line) => size + tokensOf(line), 0)).toBeLessThanOrEqual(every);
        if (index < windows.length - 1) expect(text.at(-1)).toBe("");
      }
      expect(windowsOf(lines, every, window.first)).toEqual(windows.slice(index));
    }
    // A check claims only windows with text after them, so their bounds must hold as a turn grows.
    for (let end = 1; end <= lines.length; end++) {
      const full = windowsOf(lines.slice(0, end), every).slice(0, -1);
      expect(windows.slice(0, full.length)).toEqual(full);
    }
  });

  it("hold at most 255 lines with text, the most Jev places a finding among, ending a paragraph when they can", () => {
    const short = (count: number, from = 0) =>
      Array.from({ length: count }, (_, index) => `ok ${from + index}`);
    expect(windowsOf(short(600), 16_000)).toEqual([
      { first: 1, last: 255 },
      { first: 256, last: 510 },
      { first: 511, last: 600 },
    ]);
    // Paragraphs of ten lines, a blank line after each but the last.
    const paragraphs = Array.from({ length: 60 }, (_, index) => short(10, index * 10).join("\n"));
    expect(windowsOf(linesOf(paragraphs.join("\n\n")), 16_000)).toEqual([
      { first: 1, last: 275 },
      { first: 276, last: 550 },
      { first: 551, last: 659 },
    ]);
  });
});
