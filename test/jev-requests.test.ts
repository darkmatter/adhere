import { describe, expect, it } from "vite-plus/test";
import {
  contradictBody,
  fits,
  judgeBody,
  judgeLoad,
  linterQuestion,
  locateBody,
  locateRequests,
  matcherQuestion,
  requestGroups,
  requestsOf,
  sufficiencyQuestion,
  tokensOf,
} from "../src/services/Jev.ts";
import { a, b, rules, code1 } from "./audit.fixtures.ts";

describe("request bodies", () => {
  const code = ["const x = 1;", "", "  const y = 2;"];
  const sectioned = { "1": "const x = 1;\n\n  const y = 2;" };
  const diverges =
    "Does `code` diverge from the pattern shown in `must`, as described by `rule`? Answer no if the pattern does not apply to this file.";
  const scoped = {
    true: "`code` diverges from the pattern shown in `must`, in code that `rule` is about",
    false: "`code` follows the pattern, or has no code that `rule` is about",
  };

  it("judge: the code's sections are the whole state, and each rule rides in its own noul", () => {
    expect(judgeBody("jev-latest", code, rules)).toEqual({
      model: "jev-latest",
      state: { code: sectioned },
      questions: {
        a: {
          type: "noul",
          instructions: { question: diverges, rule: a.description, must: a.must },
          criteria: scoped,
        },
        b: {
          type: "noul",
          instructions: { question: diverges, rule: b.description, must: b.must },
          criteria: scoped,
        },
      },
    });
  });

  it("carries a rule's details after its description, in every question and comparison", () => {
    const detailed = { ...a, details: "Why: a bare number accepts 70000 and -1." };
    const text = `${a.description}\n\nWhy: a bare number accepts 70000 and -1.`;
    const judged = judgeBody("jev-latest", code, { a: detailed, b }).questions;
    expect(judged.a?.instructions).toMatchObject({ rule: text, must: a.must });
    // A rule without details sends its description alone, as before.
    expect(judged.b?.instructions).toMatchObject({ rule: b.description });
    expect(linterQuestion(detailed).instructions).toMatchObject({ rule: text });
    expect(matcherQuestion(detailed, "appliesTo", "a port").instructions).toMatchObject({
      rule: text,
    });
    expect(sufficiencyQuestion(detailed).instructions).toMatchObject({ rule: text });
    expect(locateBody("jev-latest", code, { a: detailed }).questions).toMatchObject({
      "start:a:1": { instructions: { rule: text } },
      "end:a:1": { instructions: { rule: text } },
      "sufficient:a": { instructions: { rule: text } },
    });
    const compared = [
      { id: "a", rule: detailed },
      { id: "b", rule: b },
    ];
    expect(contradictBody("jev-latest", compared, [0, 1]).state.rules["0"]).toMatchObject({
      description: text,
    });
  });

  it("judge: each matcher rides in its own noul beside its rule, about the code that breaks it", () => {
    const scoped = { ...a, appliesTo: ["a port"], excludeIf: ["a port a third party fixes"] };
    const { questions } = judgeBody("jev-latest", code, { a: scoped });

    expect(Object.keys(questions)).toEqual(["a", "appliesTo:a:0", "excludeIf:a:0"]);
    expect(questions["appliesTo:a:0"]).toMatchObject({
      type: "noul",
      instructions: {
        question: expect.stringContaining("Is any of the code in `code` that breaks `rule`"),
        rule: a.description,
        must: a.must,
        matcher: "a port",
      },
    });
    expect(questions["excludeIf:a:0"]).toMatchObject({
      instructions: {
        question: expect.stringContaining("Is all of the code in `code` that breaks `rule`"),
        matcher: "a port a third party fixes",
      },
    });
  });

  it("locate: one choice per rule among the sections' numbers, carrying the rule", () => {
    const long = Array.from({ length: 70 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const body = locateBody("jev-latest", long, { a });
    expect(Object.keys(body.state.code)).toEqual(["1", "2", "3"]);
    expect(body.state.code["2"]?.split("\n")[0]).toBe("const v31 = 31;");
    expect(Object.keys(body.questions)).toEqual([
      "a",
      "start:a:1",
      "end:a:1",
      "start:a:2",
      "end:a:2",
      "start:a:3",
      "end:a:3",
      "sufficient:a",
    ]);
    // Where in a section it starts or ends: a choice among its lines, each its text.
    expect(body.questions["start:a:2"]).toMatchObject({
      type: "choice",
      instructions: {
        question: 'Which line of `code["2"]` does the code that breaks `rule` start on?',
        rule: a.description,
        must: a.must,
      },
    });
    expect(Object.entries(body.questions["start:a:2"]?.criteria ?? {})[0]).toEqual([
      "31",
      "const v31 = 31;",
    ]);
    expect(body.questions.a).toEqual({
      type: "choice",
      instructions: {
        question: "Which entry of `code` most clearly diverges from `must`?",
        rule: a.description,
        must: a.must,
      },
      criteria: { "1": null, "2": null, "3": null },
    });
    expect(body.questions["sufficient:a"]).toMatchObject({
      type: "noul",
      instructions: {
        question: expect.stringContaining("from `code` alone"),
        rule: a.description,
        must: a.must,
      },
    });
    // A file of one section has no section to choose.
    expect(Object.keys(locateBody("jev-latest", code, { a }).questions)).toEqual([
      "start:a:1",
      "end:a:1",
      "sufficient:a",
    ]);
  });

  it("carries the code under the rule's words: must and never, or should and should not", () => {
    const both = { ...a, never: "const port: number = 3000" };
    const neverOnly = {
      description: "Domain code must never throw.",
      never: 'throw new Error("x")',
    };
    const guideline = {
      description: "A file should be small.",
      should: "export const one = 1;",
      shouldNot: "export const a = 1, b = 2;",
    };
    const questions = judgeBody("jev-latest", code, { both, neverOnly, guideline }).questions;
    expect(questions.both).toEqual({
      type: "noul",
      instructions: {
        question:
          "Does `code` diverge from the pattern shown in `must`, for example by doing what `never` shows, as described by `rule`? Answer no if the pattern does not apply to this file.",
        rule: both.description,
        must: both.must,
        never: both.never,
      },
      criteria: {
        true: "`code` diverges from the pattern shown in `must`, for example by doing what `never` shows, in code that `rule` is about",
        false: scoped.false,
      },
    });
    expect(questions.neverOnly).toEqual({
      type: "noul",
      instructions: {
        question:
          "Does `code` contain the pattern shown in `never`, which `rule` rules out? Answer no if nothing in this file resembles it.",
        rule: neverOnly.description,
        never: neverOnly.never,
      },
      criteria: {
        true: "`code` contains the pattern shown in `never`, in code that `rule` is about",
        false: "`code` has nothing like `never`, or has no code that `rule` is about",
      },
    });
    expect(questions.guideline?.instructions).toEqual({
      question:
        "Does `code` diverge from the pattern shown in `should`, for example by doing what `should_not` shows, as described by `rule`? Answer no if the pattern does not apply to this file.",
      rule: guideline.description,
      should: guideline.should,
      should_not: guideline.shouldNot,
    });

    const long = Array.from({ length: 40 }, (_, index) => `const v${index} = ${index};`);
    const located = locateBody("jev-latest", long, { both, neverOnly }).questions;
    expect(located.both?.instructions.question).toBe(
      "Which entry of `code` most clearly diverges from `must` or resembles `never`?",
    );
    expect(located.neverOnly?.instructions.question).toBe(
      "Which entry of `code` most clearly shows the pattern in `never`?",
    );
  });
});

describe("jev's context", () => {
  /** A rule whose question comes to about `tokens` by `tokensOf`'s count. */
  const sized = (tokens: number) => ({ description: "Sized.", must: "x".repeat(tokens * 3) });
  const linesOf = (count: number, line: string) => Array.from({ length: count }, () => line);
  const line = "export const value = compute(input);";

  it("splits questions into requests that fit beside the state, in order", () => {
    const body = judgeBody("jev-latest", code1, {
      a: sized(20_000),
      b: sized(20_000),
      c: sized(20_000),
      d: sized(20_000),
    });
    const requests = requestsOf(body);
    expect(requests.map((request) => Object.keys(request.questions))).toEqual([
      ["a", "b", "c"],
      ["d"],
    ]);
    for (const request of requests) {
      expect(request.state).toEqual(body.state);
      const questions = Object.values(request.questions).map(tokensOf);
      expect(tokensOf(request.state) + questions.reduce((sum, n) => sum + n, 0)).toBeLessThan(
        64_000,
      );
    }
  });

  it("gives each rule with appendState requests of its own, to judge and to locate", () => {
    const hooked = { ...b, appendState: () => ({}) };
    expect(requestGroups({ a, hooked, b })).toEqual([{ a, b }, { hooked }]);
    expect(requestGroups({ hooked })).toEqual([{ hooked }]);
    const readState = { workspacePackages: { "orders-core": "packages/orders" } };
    expect(requestGroups(rules)).toEqual([rules]);
    expect(judgeLoad(code1, rules, [], readState).requests).toBe(1);
    expect(locateRequests(code1, rules, readState)).toBe(1);
    expect(judgeLoad(code1, { a, b, hooked }, [], readState).requests).toBe(2);
    expect(locateRequests(code1, { a, hooked }, readState)).toBe(2);
  });

  it("keeps a body that fits as one request", () => {
    const body = judgeBody("jev-latest", code1, rules);
    expect(requestsOf(body)).toEqual([body]);
  });

  it("fits a file whose code and longest question come within 32k tokens, in at most 255 sections", () => {
    expect(fits(linesOf(1000, line), rules)).toBe(true);
    expect(fits(linesOf(4000, line), rules)).toBe(false);
    expect(fits(linesOf(7650, "a;"), rules)).toBe(true);
    expect(fits(linesOf(7680, "a;"), rules)).toBe(false);
    expect(fits(code1, { a: sized(20_000) })).toBe(true);
    expect(fits(code1, { a: sized(33_000) })).toBe(false);
  });
});

/** A decoded config whose rules are already in memory, as the loader hands them on. */
