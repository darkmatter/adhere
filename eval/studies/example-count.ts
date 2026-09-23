/**
 * How many examples a rule needs. Each arm asks adhere's question, with its
 * wording unchanged, and gives each rule some number of examples under each
 * word: the rule's own first, then more from `more-examples.md`. One of each
 * is what the Effect preset has; `example-count.md` has the results.
 *
 *   bun eval/studies/example-count.ts [results.json]
 */
import type { Rule } from "#config.ts";
import { judgeBody } from "#services/Jev.ts";
import { Record } from "effect";
import { type Ask, runStudy } from "../harness.ts";
import moreExamples from "./more-examples.md" with { type: "text" };

interface More {
  readonly must: ReadonlyArray<string>;
  readonly never: ReadonlyArray<string>;
}

/** A `## rule id` heading per rule, then fences tagged `ts must` and `ts never`. */
const moreOf = (text: string): Readonly<Record<string, More>> =>
  Object.fromEntries(
    text
      .split(/^## /m)
      .slice(1)
      .map((section) => {
        const newline = section.indexOf("\n");
        const fences = Array.from(
          section.slice(newline).matchAll(/^```ts (must|never)\n([\s\S]*?)\n```$/gm),
        );
        const coded = (word: string) =>
          fences.filter((fence) => fence[1] === word).map((fence) => fence[2] ?? "");
        return [section.slice(0, newline).trim(), { must: coded("must"), never: coded("never") }];
      }),
  );

const more = moreOf(moreExamples);

/** The rule with only the words an arm keeps, so the question reads as it would for such a rule. */
const keeping = (rule: Rule, must: number, never: number): Rule => ({
  description: rule.description,
  ...(must > 0 && rule.must !== undefined ? { must: rule.must } : {}),
  ...(never > 0 && rule.never !== undefined ? { never: rule.never } : {}),
});

/** One example stays a string, as adhere sends it; more become a list. */
const examples = (own: string | undefined, extra: ReadonlyArray<string> = [], count: number) => {
  const all = [...(own === undefined ? [] : [own]), ...extra].slice(0, count);
  return all.length === 1 ? all[0] : all;
};

/** adhere's question with `must` examples of the code to write and `never` of the code not to. */
const withExamples =
  (must: number, never: number): Ask =>
  (model, lines, rules) => {
    const body = judgeBody(
      model,
      lines,
      Record.map(rules, (rule) => keeping(rule, must, never)),
    );
    return {
      ...body,
      questions: Record.map(body.questions, (question, id) => {
        const rule = rules[id];
        return {
          ...question,
          instructions: {
            ...question.instructions,
            ...(must > 0 ? { must: examples(rule?.must, more[id]?.must, must) } : {}),
            ...(never > 0 ? { never: examples(rule?.never, more[id]?.never, never) } : {}),
          },
        };
      }),
    };
  };

runStudy([
  ["1 must, 1 never", withExamples(1, 1)],
  ["1 must", withExamples(1, 0)],
  ["3 must", withExamples(3, 0)],
  ["1 never", withExamples(0, 1)],
  ["3 never", withExamples(0, 3)],
  ["3 must, 3 never", withExamples(3, 3)],
]);
