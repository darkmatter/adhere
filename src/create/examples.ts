/**
 * Code from the repository that shows a rule, read from the file itself and
 * put to the user, who says whether each excerpt breaks the rule.
 */
import { type Agent } from "#create/agents.ts";
import {
  type Candidate,
  Candidates,
  type Reviewed,
  askingFor,
  examplesPrompt,
} from "#create/ask.ts";
import { excerpt, line, note, said, warn } from "#create/look.ts";
import { Effect, FileSystem, Option, Path } from "effect";
import { Prompt } from "effect/cli";

/**
 * Shows the user each excerpt the agent found, read from the file itself with
 * three lines either side, and asks whether it breaks the rule. An excerpt
 * that does not match the repo is left out.
 */
export const review = (agent: Agent, root: string, candidates: ReadonlyArray<Candidate>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const reviewed: Array<Reviewed> = [];
    let missing = 0;
    for (const [index, candidate] of candidates.entries()) {
      const file = path.resolve(root, candidate.file);
      const where = path.relative(root, file);
      const text = where.startsWith("..")
        ? Option.none()
        : yield* fs.readFileString(file).pipe(Effect.option);
      const lines = Option.getOrElse(text, () => "").split("\n");
      const start = candidate.startLine;
      if (Option.isNone(text) || start < 1 || start > lines.length) {
        missing++;
        continue;
      }
      const end = Math.min(Math.max(candidate.endLine, start), start + 14, lines.length);
      const at = where + ":" + (start === end ? start : start + "-" + end);
      yield* line("");
      yield* line(at + " (" + (index + 1) + " of " + candidates.length + ")");
      yield* excerpt(lines, {
        from: Math.max(1, start - 3),
        to: Math.min(lines.length, end + 3),
        start,
        end,
      });
      yield* said(
        agent + ": " + (candidate.violation ? "breaks it" : "follows it") + ". " + candidate.reason,
      );
      const violation = yield* Prompt.run(
        Prompt.Confirm({ message: "Is this a violation?", initial: candidate.violation }),
      );
      reviewed.push({
        where: at,
        code: lines.slice(start - 1, end).join("\n"),
        violation,
        agreed: violation === candidate.violation,
      });
    }
    if (missing > 0) {
      yield* note(
        "Left out " + missing + " excerpt" + (missing === 1 ? "" : "s") + " not found in the repo.",
      );
    }
    return reviewed;
  });

/**
 * Asks the agent for excerpts in the project the user is in, then puts them to
 * the user. An agent that cannot search the repo leaves the examples to the
 * rule's draft.
 */
export const reviewedInRepository = (agent: Agent, root: string, idea: string, id: string) =>
  Effect.gen(function* () {
    const found = yield* askingFor(
      agent,
      "for code to judge",
      root,
      examplesPrompt(idea, id),
      Candidates,
    ).pipe(
      Effect.catch(({ message }) =>
        warn("No code from the repo: " + message).pipe(Effect.as({ candidates: [] })),
      ),
    );
    return yield* review(agent, root, found.candidates);
  });
