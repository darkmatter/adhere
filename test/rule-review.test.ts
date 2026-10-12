import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Effect, FileSystem, Layer, Path, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { findContradictions, formatContradictions } from "../src/contradictions.ts";
import { presets } from "../src/presets.ts";
import { loadRules, type RuleEntry } from "../src/rules.ts";
import {
  conflictBody,
  contradictBody,
  Jev,
  namedPairs,
  type Pair,
  pairProbability,
} from "../src/services/Jev.ts";
import { formatStrays, straysAmong, strayingOf, TIPS_URL } from "../src/wording.ts";

describe("contradictions", () => {
  const entry = (id: string, scope: string, description: string): RuleEntry => ({
    id,
    scope,
    file: `${scope}/.adhere/rules/${id}/RULE.md`,
    rule: { description, must: `${id}()` },
  });
  const entries = [
    entry("style/use-services", "/repo", "Use service classes for IO."),
    entry("style/plain-functions", "/repo/packages/api", "IO is plain functions, not classes."),
    entry("style/unrelated", "/repo/packages/web", "Avoid mutable globals."),
    entry("style/use-services", "/repo/packages/api", "API services are classes too."),
  ];

  const comparingJev = (
    named: ReadonlyArray<Pair>,
    probabilities: Readonly<Record<string, number>>,
  ) => {
    const calls = {
      conflicts: [] as Array<ReadonlyArray<ReadonlyArray<number>>>,
      contradicts: [] as Array<ReadonlyArray<Pair>>,
    };
    const layer = Layer.succeed(Jev, {
      judge: () => Effect.die("comparing rules judges no file"),
      locate: () => Effect.die("comparing rules judges no file"),
      conflicts: (_rules, partners) =>
        Effect.sync(() => {
          calls.conflicts.push(partners);
          return named;
        }),
      contradicts: (_rules, pairs) =>
        Effect.sync(() => {
          calls.contradicts.push(pairs);
          return pairs.map(([first, second]) => probabilities[`${first}-${second}`] ?? 0);
        }),
    });
    return { calls, layer };
  };

  it("offers no pair of a rule on tests only and a rule that skips tests, which share no file", async () => {
    const jev = comparingJev([], {});
    const onTests: RuleEntry = {
      ...entry("testing/clock", "/repo", "A test must use the test clock."),
      rule: { description: "A test must use the test clock.", must: "clock()", tests: "only" },
    };
    const contradictions = await Effect.runPromise(
      findContradictions(
        [entry("style/use-services", "/repo", "Use service classes for IO."), onTests],
        0.7,
      ).pipe(Effect.provide(jev.layer)),
    );
    expect(contradictions).toEqual([]);
    expect(jev.calls.conflicts).toEqual([]);
  });

  it("offers each rule the rules sharing its files, then reports the pairs Jev confirms", async () => {
    const jev = comparingJev(
      [
        [0, 1],
        [1, 0],
        [3, 1],
      ],
      { "0-1": 0.9, "1-3": 0.4 },
    );
    const contradictions = await Effect.runPromise(
      findContradictions(entries, 0.7).pipe(Effect.provide(jev.layer)),
    );

    // A shared id is shadowing, and packages/api and packages/web share no files.
    expect(jev.calls.conflicts).toEqual([[[1, 2], [0, 3], [0], [1]]]);
    expect(jev.calls.contradicts).toEqual([
      [
        [0, 1],
        [1, 3],
      ],
    ]);
    expect(contradictions).toEqual([{ first: entries[0], second: entries[1], probability: 0.9 }]);
    const report = formatContradictions(contradictions);
    expect(report).toContain("1. No code can follow both (0.90):");
    expect(report).toContain("/repo/.adhere/rules/style/use-services/RULE.md");
    expect(report).toContain("/repo/packages/api/.adhere/rules/style/plain-functions/RULE.md");
    // A preset's rule names its preset, where the project's own names its file.
    const fromPreset: RuleEntry = {
      id: "services/provide-at-entry",
      scope: "/repo",
      preset: "effect",
      rule: { description: "Layers must be provided once, at the entry.", must: "run()" },
    };
    const mixed = formatContradictions([
      { first: entries[0]!, second: fromPreset, probability: 0.8 },
    ]);
    expect(mixed).toContain("   - effect/services/provide-at-entry\n");
    expect(mixed).toContain(
      "   - style/use-services (/repo/.adhere/rules/style/use-services/RULE.md)\n",
    );
  });

  it("asks nothing when no two rules share files", async () => {
    const jev = comparingJev([], {});
    const contradictions = await Effect.runPromise(
      findContradictions(entries.slice(1, 3), 0.7).pipe(Effect.provide(jev.layer)),
    );
    expect(jev.calls).toEqual({ conflicts: [], contradicts: [] });
    expect(contradictions).toEqual([]);
  });

  it("conflicts: per rule a choice among the rules sharing its files; then a noul per pair", () => {
    const compared = [
      { id: "x", rule: { description: "X.", must: "x()" } },
      { id: "y", rule: { description: "Y.", never: "y()" } },
      { id: "z", rule: { description: "Z.", must: "z()" } },
    ];
    const state = {
      rules: {
        "0": { id: "x", description: "X.", must: "x()" },
        "1": { id: "y", description: "Y.", never: "y()" },
      },
    };
    const choice = (rule: string, criteria: Record<string, string>) => ({
      type: "choice",
      instructions: `Each choice other than none is the rule in state.rules under its key. Which of them demands the opposite of what state.rules["${rule}"] demands of the same code, so that following one breaks the other? Choose none if code can follow each of them alongside it.`,
      criteria: { none: "None of them", ...criteria },
    });

    expect(conflictBody("jev-latest", compared, [[1], [0], []])).toEqual({
      model: "jev-latest",
      state,
      questions: { "0:0": choice("0", { "1": "Y." }), "1:0": choice("1", { "0": "X." }) },
    });
    expect(contradictBody("jev-latest", compared, [0, 1])).toEqual({
      model: "jev-latest",
      state,
      questions: {
        "0-1": {
          type: "noul",
          instructions:
            'Do state.rules["0"] and state.rules["1"] demand opposite things of the same code, so that following one breaks the other? Answer no if code can follow both, or if they are about different things.',
        },
      },
    });
  });

  it("reads a pair from each chosen partner that was offered, and a pair's probability", () => {
    const partners = [[1, 2], [0], [0]];
    expect(namedPairs({ "0:0": "2", "1:0": "none", "2:0": "7" }, partners)).toEqual([[0, 2]]);
    expect(pairProbability({ "0-2": 0.8 }, [0, 2])).toBe(0.8);
    expect(pairProbability({ "0-2": 0.8 }, [0, 1])).toBe(0);
  });

  it("conflicts: a rule with more partners than a choice holds gets one question per chunk", () => {
    const compared = Array.from({ length: 300 }, (_, index) => ({
      id: `r${index}`,
      rule: { description: `R${index}.`, must: "r()" },
    }));
    const partners = compared.map((_, index) =>
      index === 0 ? Array.from({ length: 299 }, (__, other) => other + 1) : [],
    );
    const { questions } = conflictBody("jev-latest", compared, partners);
    expect(Object.keys(questions)).toEqual(["0:0", "0:1"]);
    expect(Object.keys(questions["0:0"]?.criteria ?? {})).toHaveLength(255);
    expect(Object.keys(questions["0:1"]?.criteria ?? {})).toHaveLength(46);
  });
});

describe("wording", () => {
  it("a rule worded as the tips recommend strays by nothing, whole words in any case", () => {
    expect(
      strayingOf({
        description: "A port must be branded, never a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([]);
    expect(
      strayingOf({ description: "Ports MUST be branded. Never bare.", must: "a()", never: "b()" }),
    ).toEqual([]);
    expect(
      strayingOf({
        description: "A file should be small, and should not do two jobs.",
        should: "a()",
        shouldNot: "b()",
      }),
    ).toEqual([]);
  });

  it("a description that does not say a word its code is under strays by each such word", () => {
    expect(
      strayingOf({
        description: "A port is branded, not a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([
      { _tag: "Unsaid", word: "must" },
      { _tag: "Unsaid", word: "never" },
    ]);
    // Part of a word is not the word.
    expect(strayingOf({ description: "Mustard, nevermore.", must: "a()", never: "b()" })).toEqual([
      { _tag: "Unsaid", word: "must" },
      { _tag: "Unsaid", word: "never" },
    ]);
    expect(
      strayingOf({ description: "A file should be small.", should: "a()", shouldNot: "b()" }),
    ).toEqual([{ _tag: "Unsaid", word: "should not" }]);
  });

  it("code to write without code that breaks the rule strays; code that breaks it alone does not", () => {
    expect(strayingOf({ description: "Ports must be branded.", must: "a()" })).toEqual([
      { _tag: "Unshown", word: "never" },
    ]);
    expect(strayingOf({ description: "A file should be small.", should: "a()" })).toEqual([
      { _tag: "Unshown", word: "should not" },
    ]);
    expect(strayingOf({ description: "Code must never retry by hand.", never: "b()" })).toEqual([]);
  });

  it("a description in the other kind of rule's words strays by each", () => {
    expect(
      strayingOf({
        description: "A port must be branded and should never be a bare number.",
        must: "a()",
        never: "b()",
      }),
    ).toEqual([{ _tag: "Mixed", word: "should" }]);
    expect(
      strayingOf({
        description: "A file should be small and should not do two jobs; it must never grow.",
        should: "a()",
        shouldNot: "b()",
      }),
    ).toEqual([
      { _tag: "Mixed", word: "must" },
      { _tag: "Mixed", word: "never" },
    ]);
  });

  it("lists each rule that strays, with its file and how, then the tips", () => {
    const entries: ReadonlyArray<RuleEntry> = [
      {
        id: "data/ports",
        scope: "/repo",
        file: "/repo/.adhere/rules/data/ports/RULE.md",
        rule: { description: "A port is branded.", must: "a()" },
      },
      {
        id: "data/ids",
        scope: "/repo",
        rule: {
          description: "An id must be branded, never a bare string.",
          must: "a()",
          never: "b()",
        },
      },
      {
        id: "style/small",
        scope: "/repo",
        rule: { description: "A file must be small.", should: "a()", shouldNot: "b()" },
      },
    ];
    expect(formatStrays(straysAmong(entries), "/repo")).toEqual([
      "2 rules are not worded as the rule writing tips recommend:",
      "  data/ports (.adhere/rules/data/ports/RULE.md)",
      '    The description does not say "must", though the rule has a must example.',
      "    The rule has no never example. Rules with one example of each kind judge best.",
      "  style/small",
      '    The description does not say "should", though the rule has a should example.',
      '    The description does not say "should not", though the rule has a should not example.',
      '    The description says "must", a requirement\'s word, but the rule is a guideline.',
      `Rule writing tips: ${TIPS_URL}`,
    ]);
    expect(formatStrays(straysAmong(entries.slice(1, 2)), "/repo")).toEqual([
      "Every rule is worded as the rule writing tips recommend.",
    ]);
  });

  it("every rule of every preset is worded as the tips recommend", async () => {
    const fs = FileSystem.layerNoop({
      readDirectory: (directory) => Effect.promise(() => readdir(directory, { recursive: true })),
      readFileString: (file) => Effect.promise(() => readFile(file, "utf8")),
    });
    for (const preset of Object.values(presets)) {
      const rules = await Effect.runPromise(
        loadRules(fileURLToPath(preset.rules)).pipe(Effect.provide(Layer.merge(fs, Path.layer))),
      );
      expect(Object.keys(rules).length).toBeGreaterThan(0);
      expect(
        Record.filter(Record.map(rules, strayingOf), (straying) => straying.length > 0),
      ).toEqual({});
    }
  });
});
