/**
 * The standing comparison: how adhere asks Jev now, against the same
 * questions without their criteria, which TypeSafe says to try both ways, and
 * against 0.4, which put every rule in the shared state. `harness.ts` says
 * what it sends and prints; `README.md` says how to read it.
 *
 *   bun eval/judge.ts [results.json]
 */
import { isNote, withoutComments } from "#comments.ts";
import { examplesOf, type Rule } from "#config.ts";
import { judgeBody } from "#services/Jev.ts";
import { Record } from "effect";
import { type Ask, numbered, runStudy } from "./harness.ts";

/** A rule as 0.4 held it: the code to write as `reference`, and the code not to as `avoid`. */
const asHeld = (rule: Rule) => {
  const { good, bad } = examplesOf(rule);
  return {
    description: rule.description,
    ...(good === undefined ? {} : { reference: good.code }),
    ...(bad === undefined ? {} : { avoid: bad.code }),
  };
};

/** adhere 0.4: every rule in the state, each question reaching its own rule by path. */
const inState: Ask = (model, lines, rules) => {
  const held = Record.map(rules, asHeld);
  const field = (id: string, key: "avoid" | "description" | "reference") =>
    `state.rules["${id}"].${key}`;
  return {
    model,
    state: { code: numbered(lines), rules: held },
    questions: Record.map(held, (rule, id) => ({
      type: "noul",
      instructions:
        rule.reference === undefined
          ? `Does state.code contain the pattern shown in ${field(id, "avoid")}, which ${field(id, "description")} rules out? Answer no if nothing in this file resembles it.`
          : `Does state.code diverge from the pattern shown in ${field(id, "reference")}${
              rule.avoid === undefined
                ? ""
                : `, for example by doing what ${field(id, "avoid")} shows`
            }, as described by ${field(id, "description")}? Answer no if the pattern does not apply to this file.`,
    })),
  };
};

/** adhere's questions without their criteria, which TypeSafe says to try both with and without. */
const withoutCriteria: Ask = (model, lines, rules) => {
  const body = judgeBody(model, lines, rules);
  return {
    ...body,
    questions: Record.map(body.questions, ({ type, instructions }) => ({ type, instructions })),
  };
};

runStudy([
  ["0.4", inState],
  ["no criteria", withoutCriteria],
  // As adhere sends it: without the file's comments, but its @adhere notes.
  ["current", (model, lines, rules) => judgeBody(model, withoutComments(lines, isNote), rules)],
]);
