import {
  planOf,
  a,
  b,
  rules,
  code1,
  testCrypto,
  memoryCache,
  fixtureWalker,
} from "./audit.fixtures.ts";

import { Effect, Layer, Record, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { type SystemOneRequest } from "../src/providers/systemOne.ts";
import { describe, expect, it } from "vite-plus/test";
import {
  type AppendState,
  DEFAULT_READS,
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
  type ReadState,
  type ResolvedConfig,
} from "../src/config.ts";
import { sectionsOf } from "../src/excerpt.ts";
import { AdhereConfig } from "../src/services/AdhereConfig.ts";
import { Credentials, CredentialsUnavailable } from "../src/services/Credentials.ts";
import { JevLive } from "../src/services/Jev.http.ts";
import { SourceReads } from "../src/services/SourceReads.ts";
import { describeState, Jev, type Rules } from "../src/services/Jev.ts";
import { executeAudit } from "../src/workflows/audit.ts";

describe("jev over http", () => {
  /** The file a rule's appendState gets, beside the lines Jev reads. */
  const judgedFile = { path: "/repo/src/server.ts", contents: "const port = 3000;" };

  /** A fetch for Jev's provider, answering each request with `respond`, given its body and headers. */
  const fetchFrom = (
    respond: (body: SystemOneRequest, headers: Headers) => Response,
  ): typeof globalThis.fetch =>
    (async (_url: unknown, init?: RequestInit) =>
      respond(
        JSON.parse(String(init?.body)),
        new Headers(init?.headers),
      )) as typeof globalThis.fetch;

  it("sends at most --rpm requests a minute, evenly spaced", async () => {
    const sent: Array<number> = [];
    const fetch = fetchFrom(() => {
      sent.push(Date.now());
      return Response.json({ answers: { a: { noul: 0.25 } } });
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(FetchHttpClient.Fetch, fetch),
        // 1200 a minute is one every 50 milliseconds.
        Layer.succeed(AdhereConfig, {
          typeAware: false,
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
          maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          reads: [],
          rules: {},
          rpm: 1200,
        }),
        Layer.succeed(Credentials, {
          key: () => Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: () => Effect.succeed(false),
        }),
      ]),
    );
    const four = Effect.gen(function* () {
      const jev = yield* Jev;
      for (let request = 0; request < 4; request++) {
        yield* jev.judge(["const port = 3000;"], { a }, [], judgedFile);
      }
    });
    await Effect.runPromise(Effect.provide(four, layer));
    const first = sent[0] ?? 0;
    expect(sent).toHaveLength(4);
    expect((sent.at(-1) ?? first) - first).toBeGreaterThanOrEqual(140);
  });

  /**
   * Judges one file through the live client, which answers 0.25 to every
   * question it is sent, or sends `reply` instead, recording each request's
   * authorization header and question ids.
   */
  const judge = (
    key: Effect.Effect<Redacted.Redacted<string>, CredentialsUnavailable>,
    judgedRules: Rules = { a },
    reply?: () => Response,
  ) => {
    const authorizations: Array<string | undefined> = [];
    const asked: Array<ReadonlyArray<string>> = [];
    const fetch = fetchFrom((body, headers) => {
      authorizations.push(headers.get("authorization") ?? undefined);
      const ids = Object.keys(body.questions);
      asked.push(ids);
      const answers = Object.fromEntries(ids.map((id) => [id, { noul: 0.25 }]));
      return reply?.() ?? Response.json({ answers });
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(FetchHttpClient.Fetch, fetch),
        Layer.succeed(AdhereConfig, {
          typeAware: false,
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
          maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          reads: [],
          rules: {},
        }),
        Layer.succeed(Credentials, {
          key: () => key,
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: () => Effect.succeed(false),
        }),
      ]),
    );
    const judged = Effect.gen(function* () {
      return yield* (yield* Jev).judge(["const port = 3000;"], judgedRules, [], judgedFile);
    });
    const result = Effect.runPromise(Effect.result(Effect.provide(judged, layer)));
    return { authorizations, asked, judged: result };
  };

  it("locates each rule in the section Jev chooses, with its sufficiency, and chooses nothing in a file of one section", async () => {
    const sent: Array<ReadonlyArray<string>> = [];
    const fetch = fetchFrom((body) => {
      const ids = Object.keys(body.questions);
      sent.push(ids);
      // b's choice names no section, which leaves it unlocated.
      const answers = Object.fromEntries(
        ids.map((id) => [
          id,
          id.startsWith("sufficient:")
            ? { noul: 0.4 }
            : // a starts on 35 and ends on 33 of section 2, lines 31 to 60; the edges are ordered.
              { choice: { a: "2", b: "9", "start:a:2": "35", "end:a:2": "33" }[id] ?? "1" },
        ]),
      );
      return Response.json({ answers });
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(FetchHttpClient.Fetch, fetch),
        Layer.succeed(AdhereConfig, {
          typeAware: false,
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
          maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          reads: [],
          rules: {},
        }),
        Layer.succeed(Credentials, {
          key: () => Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: () => Effect.succeed(false),
        }),
      ]),
    );
    const long = Array.from({ length: 70 }, (_, index) => `const v${index + 1} = ${index + 1};`);
    const located = Effect.gen(function* () {
      const jev = yield* Jev;
      return [
        yield* jev.locate(long, { a, b }, judgedFile),
        yield* jev.locate(["const x = 1;"], { a }, judgedFile),
      ];
    });
    const [three, one] = await Effect.runPromise(Effect.provide(located, layer));
    expect(three).toEqual({
      a: { section: sectionsOf(long)[1], sufficiency: 0.4, lines: { first: 33, last: 35 } },
    });
    expect(one).toEqual({
      a: { section: { first: 1, last: 1 }, sufficiency: 0.4, lines: { first: 1, last: 1 } },
    });
    expect(sent[0]).toContain("start:b:3");
    expect(sent[1]).toEqual(["start:a:1", "end:a:1", "sufficient:a"]);
  });

  /** Jev over a client that records each request's state and question ids, and says yes to each. */
  const recordedJev = (
    config: Partial<Pick<ResolvedConfig, "reads" | "workspacePackages">> = {},
  ) => {
    const sent: Array<{ readonly state: unknown; readonly ids: ReadonlyArray<string> }> = [];
    const fetch = fetchFrom((body) => {
      sent.push({ state: body.state, ids: Object.keys(body.questions) });
      const answers = Record.map(body.questions, ({ type }) =>
        type === "noul" ? { noul: 0.9 } : { choice: "1" },
      );
      return Response.json({ answers });
    });
    const layer = JevLive.pipe(
      Layer.provide([
        Layer.succeed(FetchHttpClient.Fetch, fetch),
        Layer.succeed(AdhereConfig, {
          typeAware: false,
          model: "jev-latest",
          threshold: 0.7,
          sufficiencyThreshold: 0.7,
          maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
          maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
          rules: {},
          ...config,
          reads: config.reads ?? [],
        }),
        Layer.succeed(Credentials, {
          key: () => Effect.succeed(Redacted.make("tsk_saved")),
          file: Effect.succeed("/config/adhere/credentials.json"),
          save: () => Effect.void,
          remove: () => Effect.succeed(false),
        }),
      ]),
    );
    return { sent, layer };
  };

  it("runs a rule's appendState right before its isolated requests, over the shared prepared state", async () => {
    const workspacePackages = { "orders-core": "packages/orders" };
    const readState = { workspacePackages };
    // It adds a key and replaces the code, and nothing stops it.
    const appendState: AppendState = (state, file) => ({
      code: { "1": "const replaced = true;" },
      seen: {
        sections: Object.keys(state.code),
        path: file.path,
        contents: file.contents,
        workspacePackages: state.workspacePackages,
      },
    });
    const hooked = { ...b, appendState };
    const { sent, layer } = recordedJev({ reads: ["workspacePackages"] });
    const asked = Effect.gen(function* () {
      const jev = yield* Jev;
      const judged = yield* jev.judge(code1, { a, b, hooked }, [], judgedFile, readState);
      yield* jev.locate(code1, { hooked }, judgedFile, readState);
      return judged;
    });

    const judged = await Effect.runPromise(Effect.provide(asked, layer));

    expect(judged.probabilities).toEqual({ a: 0.9, b: 0.9, hooked: 0.9 });
    const appended = describeState({
      workspacePackages,
      code: { "1": "const replaced = true;" },
      seen: {
        sections: ["1"],
        path: "/repo/src/server.ts",
        contents: "const port = 3000;",
        workspacePackages: describeState({ code: {}, workspacePackages }).workspacePackages,
      },
    });
    expect(sent).toEqual([
      {
        state: describeState({ workspacePackages, code: { "1": "const port = 3000;" } }),
        ids: ["a", "b"],
      },
      { state: appended, ids: ["hooked"] },
      { state: appended, ids: ["start:hooked:1", "end:hooked:1", "sufficient:hooked"] },
    ]);
  });

  it("inherits execution-time native context in isolated hooks without retaining it on the plan", async () => {
    const workspacePackages = { "orders-core": "packages/orders" };
    const catalog = { ...workspacePackages, unused: "packages/unused" };
    const lines = [...code1, 'import type { Order } from "orders-core/types";'];
    const symbols = { port: "const port: number" };
    const references = { "port:caller.ts": "use(port);\n" };
    const seen: ReadState[] = [];
    const hooked = {
      ...b,
      appendState: (state: ReadState) => {
        seen.push(state);
        return { private: true };
      },
    };
    const sourceReads = Layer.succeed(SourceReads, {
      prepare: () => Effect.void,
      read: () => Effect.succeed({ symbols, references }),
    });
    const cache = memoryCache();
    const planned = await planOf({
      rules: { a, b, hooked },
      typeAware: true,
      reads: DEFAULT_READS,
      files: [{ path: judgedFile.path, lines }],
      cache,
      sourceReads,
      workspacePackages: catalog,
    });
    expect(seen).toEqual([]);
    expect(planned.files[0]?.readState).toEqual({ workspacePackages });
    const { sent, layer } = recordedJev({ reads: DEFAULT_READS, workspacePackages: catalog });
    await Effect.runPromise(
      executeAudit(planned).pipe(
        Effect.provide(
          Layer.mergeAll(
            layer,
            cache,
            sourceReads,
            fixtureWalker([{ path: judgedFile.path, lines }]),
            testCrypto,
          ),
        ),
      ),
    );
    const state = describeState({
      code: { "1": lines.join("\n") },
      workspacePackages,
      symbols,
      references,
    });
    expect(seen).toEqual([state, state]);
    expect(sent.map(({ state }) => state)).toEqual([
      state,
      { ...state, private: true },
      state,
      { ...state, private: true },
    ]);
    expect(sent[0]?.ids).toEqual(["a", "b", "linter:a", "linter:b"]);
    expect(sent[1]?.ids).toEqual(["hooked", "linter:hooked"]);
    expect(sent[2]?.ids).not.toContain("sufficient:hooked");
    expect(sent[3]?.ids).toEqual(["start:hooked:1", "end:hooked:1", "sufficient:hooked"]);
    expect(planned.files[0]?.readState).toEqual({ workspacePackages });
    expect(JSON.stringify(planned)).not.toContain("caller.ts");
  });

  it("sends config-prepared workspace packages to every rule in one request and keeps them when locating", async () => {
    const workspacePackages = { "orders-core": "packages/orders" };
    const readState = { workspacePackages };
    const { sent, layer } = recordedJev({ reads: ["workspacePackages"], workspacePackages });
    const asked = Effect.gen(function* () {
      const jev = yield* Jev;
      yield* jev.judge(code1, rules, [], judgedFile, readState);
      yield* jev.locate(code1, { b }, judgedFile, readState);
    });

    await Effect.runPromise(Effect.provide(asked, layer));

    const state = describeState({ code: { "1": "const port = 3000;" }, workspacePackages });
    expect(sent).toEqual([
      { state, ids: ["a", "b"] },
      { state, ids: ["start:b:1", "end:b:1", "sufficient:b"] },
    ]);
  });

  it("does not prepare workspace context in HTTP when shared state is omitted", async () => {
    for (const reads of [[], ["workspacePackages"], DEFAULT_READS] as const) {
      const { sent, layer } = recordedJev({
        reads,
        workspacePackages: { "orders-core": "packages/orders" },
      });
      await Effect.runPromise(
        Effect.gen(function* () {
          const jev = yield* Jev;
          yield* jev.judge(code1, rules, [], judgedFile);
          yield* jev.locate(code1, { b }, judgedFile);
        }).pipe(Effect.provide(layer)),
      );
      const state = { code: { "1": "const port = 3000;" } };
      expect(sent).toEqual([
        { state, ids: ["a", "b"] },
        { state, ids: ["start:b:1", "end:b:1", "sufficient:b"] },
      ]);
    }
  });

  it("carries the full shared prepared context through judge and locate without replacing it from config", async () => {
    const readState = {
      workspacePackages: { "orders-core": "packages/orders" },
      symbols: { port: "const port: number" },
      references: { "port:caller.ts": "use(port);\n" },
    };
    const { sent, layer } = recordedJev({
      reads: ["workspacePackages", "symbols", "references"],
      workspacePackages: { stale: "packages/stale" },
    });
    await Effect.runPromise(
      Effect.gen(function* () {
        const jev = yield* Jev;
        yield* jev.judge(code1, rules, [], judgedFile, readState);
        yield* jev.locate(code1, { b }, judgedFile, readState);
      }).pipe(Effect.provide(layer)),
    );
    const state = describeState({ ...readState, code: { "1": "const port = 3000;" } });
    expect(sent).toEqual([
      { state, ids: ["a", "b"] },
      { state, ids: ["start:b:1", "end:b:1", "sufficient:b"] },
    ]);
  });

  it("refuses when a rule's appendState fails, naming the rule, and sends nothing for it", async () => {
    const hooked = {
      ...b,
      appendState: () => Promise.reject(new Error("db/schema.sql is missing")),
    };
    const { sent, layer } = recordedJev();

    const judged = Effect.gen(function* () {
      return yield* (yield* Jev).judge(["const port = 3000;"], { hooked }, [], judgedFile);
    });

    const refused = await Effect.runPromise(Effect.flip(Effect.provide(judged, layer)));

    expect(refused.message).toBe("the appendState of hooked failed: db/schema.sql is missing");
    expect(sent).toEqual([]);
  });

  it("sends the key from Credentials as a bearer token", async () => {
    const { authorizations, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")));
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: { probabilities: { a: 0.25 }, linter: {} },
    });
    expect(authorizations).toEqual(["Bearer tsk_saved"]);
  });

  it("asks each matcher beside its rule, in one request, and reads its score back", async () => {
    const scoped = { ...a, appliesTo: ["a port"], excludeIf: ["a test port", "a fixed port"] };
    const { asked, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")), {
      a: scoped,
      b,
    });
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: {
        probabilities: { a: 0.25, b: 0.25 },
        matchers: { a: { appliesTo: [0.25], excludeIf: [0.25, 0.25] } },
      },
    });
    expect(asked).toEqual([["a", "b", "appliesTo:a:0", "excludeIf:a:0", "excludeIf:a:1"]]);
  });

  it("refuses an answer outside 2xx with its status and what Jev said about it", async () => {
    const { judged } = judge(
      Effect.succeed(Redacted.make("tsk_saved")),
      { a },
      () => new Response('{\n  "detail": "request too large"\n}', { status: 413 }),
    );
    expect(await judged).toMatchObject({
      _tag: "Failure",
      failure: {
        _tag: "JevUnavailable",
        message: 'Jev answered HTTP 413: { "detail": "request too large" }',
      },
    });
  });

  it("refuses with Credentials' reason, before sending anything", async () => {
    const message = "No TypeSafe AI API key. Run `adhere login` to save one.";
    const { authorizations, judged } = judge(Effect.fail(CredentialsUnavailable.make({ message })));
    expect(await judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable", message },
    });
    expect(authorizations).toEqual([]);
  });

  it("asks what one request cannot hold over several, and merges the answers", async () => {
    // About 30k tokens a question: two fit in a 64k request, a third does not.
    const big = { description: "Big.", must: "x".repeat(90_000) };
    const { asked, judged } = judge(Effect.succeed(Redacted.make("tsk_saved")), {
      a: big,
      b: big,
      c: big,
    });
    expect(await judged).toMatchObject({
      _tag: "Success",
      success: { probabilities: { a: 0.25, b: 0.25, c: 0.25 }, linter: {} },
    });
    expect(asked).toEqual([["a", "b"], ["c"]]);
  });

  it("reads the firewall's HTML page as a block with its Ray ID, and a JSON 403 as a refusal", async () => {
    const key = Effect.succeed(Redacted.make("tsk_saved"));
    const page = () =>
      new Response(
        '<!DOCTYPE html>\n<html class="no-js ie6 oldie">Sorry, you have been blocked</html>',
        {
          status: 403,
          headers: { "content-type": "text/html; charset=UTF-8", "cf-ray": "a3fb098cae4f55a3-LAX" },
        },
      );
    expect(await judge(key, { a }, page).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevBlocked", ray: "a3fb098cae4f55a3-LAX" },
    });

    const denied = () => Response.json({ detail: "this key has no access" }, { status: 403 });
    expect(await judge(key, { a }, denied).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable" },
    });
  });

  it("reads Jev's max_tokens_exceeded as an overflow, and any other 400 as a refusal", async () => {
    const key = Effect.succeed(Redacted.make("tsk_saved"));
    const overflow = () =>
      Response.json({ detail: { error_type: "max_tokens_exceeded" } }, { status: 400 });
    expect(await judge(key, { a }, overflow).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevOverflow" },
    });

    const invalid = () => Response.json({ detail: "questions: field required" }, { status: 400 });
    expect(await judge(key, { a }, invalid).judged).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "JevUnavailable" },
    });
  });
});
