import {
  type AppendState,
  type JevState,
  type ReadState,
  type ResolvedConfig,
  type Rule,
  resolveConfig,
} from "#config.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { Credentials } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import {
  fits,
  Jev,
  judgeBody,
  judgeLoad,
  judgeRequests,
  locateBody,
  locateRequests,
  questionRoom,
  requestGroups,
  requestsOf,
  sufficiencyQuestion,
  tokensOf,
} from "#services/Jev.ts";
import { Effect, Layer, Record, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

const plain: Rule = { description: "Ports must be named.", must: "const port = PORT;" };
const lines = ["const port = 3000;"];
const codeState = { code: { "1": lines[0] } };
const file = { path: "/repo/src/server.ts", contents: lines.join("\n") };
const symbols = { port: "```typescript\nconst port: number\n```" };
const references = { PORT: { "src/config.ts": "export const PORT = 3000;\r\n" } };
const codeSufficiency = {
  type: "noul",
  instructions: {
    question:
      "Can you tell whether `code` breaks `rule` from `code` alone, without knowing what other files, libraries, services, or configuration do?",
    rule: plain.description,
    must: plain.must,
  },
  criteria: {
    true: "`code` shows everything needed to tell whether it breaks `rule`",
    false:
      "Whether `code` breaks `rule` depends on something `code` does not show, such as another file, a library, a service, or configuration",
  },
};

interface Sent {
  readonly state: JevState;
  readonly questions: Readonly<
    Record<string, { readonly type: string; readonly instructions: { readonly question: string } }>
  >;
}

const recordedJev = (
  workspacePackages: Readonly<Record<string, string>> = {},
  reads: ResolvedConfig["reads"] = [],
) => {
  const sent: Array<Sent> = [];
  // Jev's provider sends its requests with this fetch: each body as Jev would get it.
  const fetch = (async (_url: unknown, init?: RequestInit) => {
    const body: Sent = JSON.parse(String(init?.body));
    sent.push(body);
    const answers = Record.map(body.questions, ({ type }) =>
      type === "noul" ? { noul: 0.9 } : { choice: "1" },
    );
    return Response.json({ answers });
  }) as typeof globalThis.fetch;
  const layer = JevLive.pipe(
    Layer.provide([
      Layer.succeed(FetchHttpClient.Fetch, fetch),
      Layer.succeed(AdhereConfig, {
        model: "jev-latest",
        threshold: 0.8,
        sufficiencyThreshold: 0.6,
        reads,
        rules: {},
        workspacePackages,
      }),
      Layer.succeed(Credentials, {
        key: () => Effect.succeed(Redacted.make("tsk_fake")),
        file: Effect.succeed("/config/adhere/credentials.json"),
        save: () => Effect.void,
        remove: () => Effect.succeed(false),
      }),
    ]),
  );
  return { sent, layer };
};

describe("prepared shared Jev reads", () => {
  it("keeps code-only judge and locate bodies byte-identical and protects target code", () => {
    const judged = {
      model: "jev-latest",
      state: codeState,
      questions: {
        plain: {
          type: "noul",
          instructions: {
            question:
              "Does `code` diverge from the pattern shown in `must`, as described by `rule`? Answer no if the pattern does not apply to this file.",
            rule: plain.description,
            must: plain.must,
          },
          criteria: {
            true: "`code` diverges from the pattern shown in `must`, in code that `rule` is about",
            false: "`code` follows the pattern, or has no code that `rule` is about",
          },
        },
      },
    };
    const located = {
      model: "jev-latest",
      state: codeState,
      questions: {
        ...Object.fromEntries(
          ["start", "end"].map((edge) => [
            `${edge}:plain:1`,
            {
              type: "choice",
              instructions: {
                question: `Which line of \`code["1"]\` does the code that breaks \`rule\` ${edge} on?`,
                rule: plain.description,
                must: plain.must,
              },
              criteria: { "1": lines[0] },
            },
          ]),
        ),
        "sufficient:plain": codeSufficiency,
      },
    };
    for (const readState of [undefined, {}, { code: { "1": "replaced" } }]) {
      expect(JSON.stringify(judgeBody("jev-latest", lines, { plain }, [], readState))).toBe(
        JSON.stringify(judged),
      );
      expect(JSON.stringify(locateBody("jev-latest", lines, { plain }, readState))).toBe(
        JSON.stringify(located),
      );
    }
  });

  it("shares all prepared fields across rules and isolates only appendState groups", () => {
    const hooked = { ...plain, appendState: () => ({}) };
    const rules = { plain, hooked, alsoPlain: plain, alsoHooked: hooked };
    const readState: ReadState = {
      symbols,
      references,
      workspacePackages: { orders: "packages/orders" },
      project: { language: "typescript" },
      code: { "1": "replaced" },
    };
    const enriched = { ...readState, ...codeState };
    expect(judgeBody("", lines, rules, [], readState).state).toEqual(enriched);
    expect(locateBody("", lines, rules, readState).state).toEqual(enriched);
    const groups = requestGroups(rules);
    expect(groups.map((group) => Object.keys(group))).toEqual([
      ["plain", "alsoPlain"],
      ["hooked"],
      ["alsoHooked"],
    ]);
    for (const group of groups) {
      expect(judgeBody("", lines, group, [], readState).state).toEqual(enriched);
      const body = locateBody("", lines, group, readState);
      expect(body.state).toEqual(enriched);
      expect(body.state.symbols).toBe(symbols);
      expect(body.state.references).toBe(references);
      for (const id of Object.keys(group)) {
        expect(body.questions[`sufficient:${id}`]).toEqual(sufficiencyQuestion(plain, readState));
      }
    }
    expect(judgeRequests(lines, rules, [], readState)).toBe(3);
    expect(locateRequests(lines, rules, readState)).toBe(3);
  });

  it("names actual shared keys in sufficiency, including packages but excluding duplicate code", () => {
    expect(sufficiencyQuestion(plain)).toEqual(codeSufficiency);
    expect(sufficiencyQuestion(plain, { code: {} })).toEqual(codeSufficiency);
    expect(sufficiencyQuestion({ ...plain, appendState: () => ({ private: true }) })).toEqual(
      codeSufficiency,
    );
    for (const readState of [
      { workspacePackages: {} },
      { symbols },
      { references },
      { workspacePackages: {}, symbols, references, project: true, code: {} },
    ]) {
      const question = sufficiencyQuestion(plain, readState);
      expect(question.instructions.question).not.toContain("`code` alone");
      for (const key of Object.keys(readState).filter((key) => key !== "code")) {
        expect(question.instructions.question).toContain(`\`${key}\``);
        expect(question.criteria.true).toContain(`\`${key}\``);
        expect(question.criteria.false).toContain(`\`${key}\``);
      }
      expect(question.instructions.question.match(/`code`/g)).toHaveLength(2);
    }
  });

  it("budgets all shared context beside every rule's questions", () => {
    const source = "export const value = 1;\n".repeat(2200);
    const readState = { references: { value: { "src/related.ts": source } } };
    const large = { ...plain, must: "x".repeat(60_000) };
    const hooked = { ...plain, appendState: () => ({ private: "x".repeat(120_000) }) };
    expect(fits(lines, { large, hooked })).toBe(true);
    expect(fits(lines, { hooked }, readState)).toBe(true);
    expect(fits(lines, { large, hooked }, readState)).toBe(false);
    const room = questionRoom(lines, readState);
    expect(room).toBe(31_000 - tokensOf(locateBody("", lines, { plain }, readState).state));
    expect(room).toBeLessThan(questionRoom(lines));
    expect(questionRoom(lines, { ...readState, code: "x".repeat(120_000) })).toBe(room);
    const tooLarge = { ...readState, symbols: ["s".repeat(54_000)] };
    expect(tokensOf(judgeBody("", lines, { plain }, [], tooLarge).state)).toBeGreaterThan(31_000);
    expect(fits(lines, { plain, hooked }, tooLarge)).toBe(false);
    expect(fits(lines, {}, tooLarge)).toBe(false);
  });

  it("keeps the exact fit boundary across sections, escaped Unicode, matchers, and shared keys", () => {
    const escaped = '"\\\u0000界😊';
    const cases: ReadonlyArray<{
      readonly code: ReadonlyArray<string>;
      readonly rule: Rule;
      readonly readState: ReadState;
    }> = [
      { code: [], rule: plain, readState: {} },
      { code: ["", "  \t"], rule: { description: escaped, never: escaped }, readState: {} },
      {
        code: [`const value = "${escaped}";`],
        rule: { description: escaped, should: escaped, shouldNot: escaped, details: escaped },
        readState: { [`context${escaped}`]: escaped, code: "ignored" },
      },
      {
        code: Array.from({ length: 301 }, (_, index) =>
          index === 0 ? "a".repeat(119) + "😊;" : "a;",
        ),
        rule: { ...plain, never: escaped },
        readState: { workspacePackages: {}, symbols, references },
      },
      {
        code: lines,
        rule: { ...plain, appliesTo: [escaped.repeat(100)], excludeIf: [escaped] },
        readState: { references },
      },
    ];
    const encoder = new TextEncoder();
    for (const { code, rule, readState } of cases) {
      const questions = [
        ...Object.values(judgeBody("", code, { rule }, [], readState).questions),
        ...Object.values(locateBody("", code, { rule }, readState).questions),
      ];
      const longest = Math.max(
        ...questions.map((question) => encoder.encode(JSON.stringify(question)).length),
      );
      const padding = questionRoom(code, readState) * 3 - longest;
      for (const extra of [-2, -1, 0, 1, 2]) {
        const padded = { ...rule, description: rule.description + "x".repeat(padding + extra) };
        expect(fits(code, { rule: padded }, readState)).toBe(extra <= 0);
      }
    }
  });

  it("fits the surviving questions when a rule id is overwritten by a generated matcher key", () => {
    const collision = { ...plain, never: "const port = 3000;" };
    const rules = {
      "appliesTo:plain:0": collision,
      plain: { ...plain, appliesTo: ["Server ports."] },
    };
    const body = locateBody("", lines, rules);
    const questions = [
      ...Object.values(judgeBody("", lines, rules).questions),
      ...Object.values(body.questions),
    ];
    const encoder = new TextEncoder();
    const longest = Math.max(
      ...questions.map((question) => encoder.encode(JSON.stringify(question)).length),
    );
    const padding = questionRoom(lines) * 3 - longest;
    for (const extra of [0, 1]) {
      const padded = {
        ...collision,
        description: collision.description + "x".repeat(padding + extra),
      };
      expect(fits(lines, { ...rules, "appliesTo:plain:0": padded })).toBe(extra === 0);
    }
  });

  it("counts shared context on each split judge and locate request, matching HTTP payloads", async () => {
    const long = Array.from({ length: 31 }, (_, index) => `const value${index} = ${index};`);
    const native = {
      ...plain,
      must: "x".repeat(30_000),
      appliesTo: ["first", "second", "third", "fourth"],
    };
    const rules = { plain, native };
    const readState = {
      references: { files: { "src/related.ts": "export const value = 1;\n".repeat(1500) } },
    };
    const sampled = ["native"];
    expect(fits(long, rules, readState)).toBe(true);
    expect(judgeRequests(long, rules, sampled)).toBe(1);
    expect(judgeRequests(long, rules, sampled, readState)).toBe(2);
    expect(locateRequests(long, rules)).toBe(1);
    expect(locateRequests(long, rules, readState)).toBe(2);
    const judged = judgeBody("", long, rules, sampled, readState);
    const located = locateBody("", long, rules, readState);
    const requests = requestsOf(judged);
    const locations = requestsOf(located);
    const load = judgeLoad(long, rules, sampled, readState);
    expect(load).toEqual({
      requests: 2,
      tokens: requests.reduce((sum, request) => sum + tokensOf(request), 0),
    });
    expect(load.tokens).toBeGreaterThan(
      judgeLoad(long, rules, sampled).tokens + tokensOf(readState),
    );
    expect(requests.flatMap((request) => Object.keys(request.questions))).toEqual(
      Object.keys(judged.questions),
    );
    expect(locations.flatMap((request) => Object.keys(request.questions))).toEqual(
      Object.keys(located.questions),
    );
    const { sent, layer } = recordedJev();
    await Effect.runPromise(
      Effect.gen(function* () {
        const jev = yield* Jev;
        const longFile = { ...file, contents: long.join("\n") };
        yield* jev.judge(long, rules, sampled, longFile, readState);
        yield* jev.locate(long, rules, longFile, readState);
      }).pipe(Effect.provide(layer)),
    );
    expect(sent.map((body) => Object.keys(body.questions))).toEqual(
      [...requests, ...locations].map((request) => Object.keys(request.questions)),
    );
    expect(sent.map((body) => body.state)).toEqual(Array.from({ length: 4 }, () => judged.state));
  });

  it("sends shared context once for non-hook rules and inherits it in private hook groups", async () => {
    const seen: Array<JevState> = [];
    const privateSymbols = [{ name: "private", section: 1, usages: 0 }];
    const appendState: AppendState = (state, receivedFile) => {
      expect(receivedFile).toBe(file);
      seen.push(state);
      return { private: "first", symbols: privateSymbols };
    };
    const alsoAppend: AppendState = async (state) => {
      seen.push(state);
      return { private: "second" };
    };
    const rules = {
      plain,
      hooked: { ...plain, appendState },
      alsoPlain: plain,
      alsoHooked: { ...plain, appendState: alsoAppend },
    };
    const workspacePackages = { prepared: "packages/prepared" };
    const readState = { symbols, references, workspacePackages, code: {} };
    const { sent, layer } = recordedJev({ fallback: "packages/fallback" });
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const jev = yield* Jev;
        const judged = yield* jev.judge(lines, rules, ["plain", "hooked"], file, readState);
        const located = yield* jev.locate(lines, rules, file, readState);
        return { judged, located };
      }).pipe(Effect.provide(layer)),
    );
    expect(result.judged.probabilities).toEqual({
      plain: 0.9,
      hooked: 0.9,
      alsoPlain: 0.9,
      alsoHooked: 0.9,
    });
    expect(result.judged.linter).toEqual({ plain: 0.9, hooked: 0.9 });
    expect(Object.keys(result.located)).toEqual(Object.keys(rules));
    const enriched = { ...readState, ...codeState };
    expect(seen).toEqual([enriched, enriched, enriched, enriched]);
    for (const state of seen) {
      expect(state.symbols).toBe(symbols);
      expect(state.references).toBe(references);
      expect(state.workspacePackages).toBe(workspacePackages);
    }
    const expectedStates = [
      enriched,
      { ...enriched, private: "first", symbols: privateSymbols },
      { ...enriched, private: "second" },
    ];
    expect(sent.map((body) => body.state)).toEqual([...expectedStates, ...expectedStates]);
    expect(sent.map((body) => Object.keys(body.questions))).toEqual([
      ["plain", "alsoPlain", "linter:plain"],
      ["hooked", "linter:hooked"],
      ["alsoHooked"],
      [
        "start:plain:1",
        "end:plain:1",
        "sufficient:plain",
        "start:alsoPlain:1",
        "end:alsoPlain:1",
        "sufficient:alsoPlain",
      ],
      ["start:hooked:1", "end:hooked:1", "sufficient:hooked"],
      ["start:alsoHooked:1", "end:alsoHooked:1", "sufficient:alsoHooked"],
    ]);
    for (const body of sent.slice(3)) {
      for (const [id, question] of Object.entries(body.questions)) {
        if (id.startsWith("sufficient:")) {
          expect(question.instructions.question).toBe(
            sufficiencyQuestion(plain, readState).instructions.question,
          );
          expect(question.instructions.question).not.toContain("`private`");
        }
      }
    }
    expect(readState).not.toHaveProperty("private");
    expect(readState.symbols).toBe(symbols);
    expect(readState.code).toEqual({});
  });

  it("does not prepare context in HTTP even with resolved default reads and omitted or partial shared state", async () => {
    const config = resolveConfig({ presets: [], rules: { plain } });
    expect(config.reads).toEqual(["workspacePackages", "symbols", "references"]);
    const { sent, layer } = recordedJev({ unused: "packages/unused" }, config.reads);
    await Effect.runPromise(
      Effect.gen(function* () {
        const jev = yield* Jev;
        yield* jev.judge(lines, { plain }, [], file);
        yield* jev.locate(lines, { plain }, file);
        yield* jev.judge(lines, { plain }, [], file, { symbols });
        yield* jev.locate(lines, { plain }, file, { symbols });
      }).pipe(Effect.provide(layer)),
    );
    expect(sent.map((body) => body.state)).toEqual([
      codeState,
      codeState,
      { symbols, ...codeState },
      { symbols, ...codeState },
    ]);
  });
});
