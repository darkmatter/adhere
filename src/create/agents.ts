/**
 * The coding agents installed beside adhere, asked one question at a time
 * without a session: `claude -p`, `codex exec`, and `omp -p`. The prompt goes
 * on stdin, the agent may read the repo it runs in but not change it, and
 * what comes back is the text of its last message. Given a JSON schema, the
 * agent is held to it where its CLI can, and the text is that JSON.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Option, Schema } from "effect";

export const AGENTS = ["claude", "codex", "omp"] as const;
export type Agent = (typeof AGENTS)[number];

/** The agents on PATH, in the order adhere prefers them. */
export const installedAgents = (): ReadonlyArray<Agent> =>
  AGENTS.filter((agent) => Bun.which(agent) !== null);

/** `claude -p --output-format json` prints its events, the last its result. */
const ClaudeResult = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      type: Schema.String,
      is_error: Schema.optionalKey(Schema.Boolean),
      result: Schema.optionalKey(Schema.String),
      structured_output: Schema.optionalKey(Schema.Unknown),
    }),
  ),
);

/** The line of `omp --mode json` that ends an assistant's message; every other line is skipped. */
const OmpAnswer = Schema.fromJsonString(
  Schema.Struct({
    type: Schema.Literal("message_end"),
    message: Schema.Struct({
      role: Schema.Literal("assistant"),
      content: Schema.Array(
        Schema.Struct({ type: Schema.String, text: Schema.optionalKey(Schema.String) }),
      ),
    }),
  }),
);

/** Runs `command` in `cwd` with `input` on stdin, and returns its stdout once it exits 0. */
export const run = async (
  command: string,
  args: ReadonlyArray<string>,
  cwd: string,
  input: string,
) => {
  const child = Bun.spawn([command, ...args], {
    cwd,
    stdin: new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) throw new Error(`${command} exited ${code}: ${stderr.trim().slice(-500)}`);
  return stdout;
};

/** The text of `agent`'s answer to `prompt`, asked in `cwd`; with `schema`, its JSON. */
export const askAgent = async (
  agent: Agent,
  prompt: string,
  cwd: string,
  schema?: object,
): Promise<string> => {
  switch (agent) {
    case "claude": {
      const events = Schema.decodeUnknownSync(ClaudeResult)(
        await run(
          "claude",
          [
            "-p",
            "--output-format=json",
            "--tools=Read,Grep,Glob",
            "--no-session-persistence",
            ...(schema === undefined ? [] : [`--json-schema=${JSON.stringify(schema)}`]),
          ],
          cwd,
          prompt,
        ),
      );
      const result = events.findLast((event) => event.type === "result");
      if (result === undefined || result.is_error === true) {
        throw new Error(`claude did not answer: ${result?.result ?? "no result"}`);
      }
      return schema === undefined
        ? (result.result ?? "")
        : JSON.stringify(result.structured_output);
    }
    case "codex": {
      const dir = await mkdtemp(join(tmpdir(), "adhere-codex-"));
      try {
        const out = join(dir, "answer");
        const schemaFile = join(dir, "schema.json");
        if (schema !== undefined) await writeFile(schemaFile, JSON.stringify(schema));
        await run(
          "codex",
          [
            "exec",
            "--sandbox=read-only",
            "--ephemeral",
            "--skip-git-repo-check",
            "--color=never",
            `--output-last-message=${out}`,
            ...(schema === undefined ? [] : [`--output-schema=${schemaFile}`]),
            "-",
          ],
          cwd,
          prompt,
        );
        return await readFile(out, "utf8");
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
    case "omp": {
      // omp holds no answer to a schema, so the schema goes in the prompt and
      // the JSON is cut out of whatever surrounds it.
      const asked =
        schema === undefined
          ? prompt
          : `${prompt}\n\nReply with only JSON matching this schema:\n${JSON.stringify(schema)}`;
      const lines = (
        await run(
          "omp",
          ["-p", "--mode=json", "--tools=read,grep,glob", "--no-session", "--no-title"],
          cwd,
          asked,
        )
      ).split("\n");
      const answer = lines
        .flatMap((line) => Option.toArray(Schema.decodeUnknownOption(OmpAnswer)(line)))
        .at(-1);
      if (answer === undefined) throw new Error("omp did not answer");
      const text = answer.message.content
        .flatMap((part) => (part.type === "text" && part.text !== undefined ? [part.text] : []))
        .join("");
      return schema === undefined ? text : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    }
  }
};
