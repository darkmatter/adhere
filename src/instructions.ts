import { findConfigFile, loadConfigFile } from "#services/AdhereConfig.ts";
import { Effect, FileSystem, Path, Schema } from "effect";

const START = "<!-- adhere:instructions:start -->";
const END = "<!-- adhere:instructions:end -->";

class InstructionsUnavailable extends Schema.TaggedError<InstructionsUnavailable>()(
  "InstructionsUnavailable",
  { message: Schema.String },
) {}

/** Update only adhere's marked block; leave all other AGENTS.md content untouched. */
export const renderInstructions = Effect.fn("renderInstructions")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const configFile = yield* findConfigFile(root);
  const config =
    configFile === undefined ? undefined : yield* loadConfigFile(path.join(root, configFile));
  const candidates =
    config?.instructions === undefined
      ? [path.join(root, ".adhere/instructions"), path.join(root, ".agents/instructions")]
      : [path.resolve(root, path.dirname(configFile ?? ""), config.instructions)];
  let directory: string | undefined;
  for (const candidate of candidates) {
    if (yield* fs.exists(candidate)) {
      directory = candidate;
      break;
    }
  }
  if (directory === undefined) {
    return `Skipped AGENTS.md: no instructions directory (${candidates.map((candidate) => path.relative(root, candidate)).join(", ")}).`;
  }

  const names = (yield* fs.readDirectory(directory)).filter((name) => name.endsWith(".md")).sort();
  const contents: string[] = [];
  for (const name of names) {
    const file = path.join(directory, name);
    if ((yield* fs.stat(file)).type === "File") {
      const text = (yield* fs.readFileString(file)).trim();
      if (text.includes(START) || text.includes(END)) {
        return yield* InstructionsUnavailable.make({
          message: `${file} contains reserved adhere instruction markers.`,
        });
      }
      if (text !== "") contents.push(text);
    }
  }
  const target = path.join(root, "AGENTS.md");
  const previous = yield* fs
    .readFileString(target)
    .pipe(
      Effect.catchTag("PlatformError", (error) =>
        error.reason._tag === "NotFound" ? Effect.succeed("") : Effect.fail(error),
      ),
    );
  const start = previous.indexOf(START);
  const end = previous.indexOf(END);
  if (
    (start === -1) !== (end === -1) ||
    (start !== -1 &&
      (end < start ||
        previous.indexOf(START, start + START.length) !== -1 ||
        previous.indexOf(END, end + END.length) !== -1))
  ) {
    return yield* InstructionsUnavailable.make({
      message: `${target} has malformed or duplicate adhere instruction markers. Fix them before running postinstall.`,
    });
  }
  const block = [START, ...contents, END].join("\n\n");
  const next =
    start === -1
      ? `${previous}${previous === "" ? "" : previous.endsWith("\n\n") ? "" : previous.endsWith("\n") ? "\n" : "\n\n"}${block}\n`
      : `${previous.slice(0, start)}${block}${previous.slice(end + END.length)}`;
  if (next !== previous) yield* fs.writeFileString(target, next);
  return `${next === previous ? "Unchanged" : "Updated"} AGENTS.md: ${contents.length} instruction ${contents.length === 1 ? "file" : "files"} from ${path.relative(root, directory) || "."}.`;
});
