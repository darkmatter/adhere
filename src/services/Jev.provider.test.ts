import { decodeConfig, resolveConfig, type JevState, type Rule, type Rules } from "#config.ts";
import {
  type AskOptions,
  ContextOverflow,
  type Provider,
  type Question,
  RequestBlocked,
  RequestFailed,
  type SavedKey,
  type State,
} from "#providers/provider.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { Credentials } from "#services/Credentials.ts";
import { JevLive } from "#services/Jev.http.ts";
import { describeState, Jev, judgeBody, locateBody, requestsOf } from "#services/Jev.ts";
import { questionsOf, requestOf, type SystemOneRequest } from "#providers/systemOne.ts";
import { Effect, Layer, Logger, Redacted, References } from "effect";
import { FetchHttpClient } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

const plain: Rule = { description: "Ports must be named.", must: "const port = PORT;" };
const named: Rule = {
  description: "Handlers must be named.",
  must: "export const handle = () => 1;",
};
const lines = ["const port = 3000;"];
const file = { path: "/repo/src/server.ts", contents: lines.join("\n") };

// Restore JSON escapes only inside string tokens, leaving layout and source backslashes intact.
const jsonFromDiagnostic = (text: string): string =>
  text.replace(/"(?:\\[\s\S]|[^"\\])*"/g, (token) =>
    token.replace(/\n/g, "\\n").replace(/\t/g, "\\t"),
  );

/**
 * Jev under a config whose provider answers: any request Jev's own provider
 * sends, or any read of its key, dies. The saved OpenAI key is "sk-saved".
 */
const judged = (
  ask: Provider["ask"],
  savedKey?: SavedKey,
  rules: Rules = { plain, named },
  provider: Provider = {
    model: "clef-flash",
    ask,
    ...(savedKey === undefined ? {} : { savedKey }),
  },
  kind: "judge" | "locate" = "judge",
) =>
  Effect.gen(function* () {
    const jev = yield* Jev;
    return kind === "judge"
      ? yield* jev.judge(lines, rules, [], file)
      : yield* jev.locate(lines, rules, file);
  }).pipe(
    Effect.provide(
      JevLive.pipe(
        Layer.provide([
          Layer.succeed(FetchHttpClient.Fetch, (() => {
            throw new Error("a provider sends nothing to Jev");
          }) as unknown as typeof globalThis.fetch),
          Layer.succeed(
            AdhereConfig,
            resolveConfig({
              presets: [],
              rules: {},
              model: "jev-latest",
              provider,
            }),
          ),
          Layer.succeed(Credentials, {
            key: (name) =>
              name === "openai"
                ? Effect.succeed(Redacted.make("sk-saved"))
                : Effect.die("a provider needs no TypeSafe key"),
            file: Effect.die("unused"),
            save: () => Effect.die("unused"),
            remove: () => Effect.die("unused"),
          }),
        ]),
      ),
    ),
  );

describe("a config's provider", () => {
  it("is asked adhere's questions, split into their parts, about the file's state", async () => {
    const asked: Array<{ readonly state: State; readonly questions: ReadonlyArray<Question> }> = [];
    const result = await Effect.runPromise(
      judged(async (state, questions) => {
        asked.push({ state, questions });
        return { answers: { plain: 0.93 } };
      }),
    );
    const [{ state, questions } = { state: {}, questions: [] }] = asked;
    expect(state).toEqual({ code: { "1": "const port = 3000;" } });
    expect(questions.map((question) => question.id)).toEqual(["plain", "named"]);
    expect(questions[0]).toMatchObject({
      type: "noul",
      question: expect.stringContaining("Does `code` diverge from the pattern shown in `must`"),
      fields: { rule: "Ports must be named.", must: "const port = PORT;" },
      yes: expect.stringContaining("`code` diverges from the pattern shown in `must`"),
      no: expect.stringContaining("`code` follows the pattern"),
    });
    // A question the provider leaves out goes unanswered, as when Jev gives no answer.
    expect(result.probabilities).toEqual({ plain: 0.93 });
  });

  it("is asked with the key `adhere login` saved for it, when it names one", async () => {
    const keys: Array<string | undefined> = [];
    const ask: Provider["ask"] = async (_state, _questions, { apiKey }) => {
      keys.push(apiKey);
      return { answers: {} };
    };
    await Effect.runPromise(judged(ask, "openai"));
    await Effect.runPromise(judged(ask));
    expect(keys).toEqual(["sk-saved", undefined]);
  });

  it("skips the file when the request is over its context, and reports it blocked when it is blocked", async () => {
    const overflowed = await Effect.runPromise(
      Effect.flip(judged(() => Promise.reject(new ContextOverflow("too long")))),
    );
    expect(overflowed._tag).toBe("JevOverflow");
    const blocked = await Effect.runPromise(
      Effect.flip(judged(() => Promise.reject(new RequestBlocked("ref-7")))),
    );
    expect(blocked).toMatchObject({ _tag: "JevBlocked", ray: "ref-7" });
  });

  it.each([
    ["All", "judge"],
    ["Trace", "judge"],
    ["Debug", "judge"],
    ["All", "locate"],
    ["Trace", "locate"],
    ["Debug", "locate"],
  ] as const)(
    "logs split requests after appendState with line criteria only at All (minimum: %s, kind: %s)",
    async (minimum, kind) => {
      const context = `export function caller() {\n\tconst escaped = "\\n\\t";\n\treturn "${"hook-context".repeat(40_000)}";\n}`;
      const added = { references: { "port:caller.ts": context } };
      const hooked: Rule = {
        ...plain,
        appliesTo: ["a server"],
        appendState: async () => added,
      };
      const body = (
        kind === "judge"
          ? judgeBody("clef-flash", lines, { plain: hooked })
          : locateBody("clef-flash", lines, { plain: hooked })
      ) as SystemOneRequest & { readonly state: JevState };
      const requests = requestsOf({ ...body, state: describeState({ ...body.state, ...added }) });
      expect(requests.length).toBeGreaterThan(1);
      const request = requests[0]!;
      const asked: Array<{
        state: State;
        questions: ReadonlyArray<Question>;
        apiKey: string | undefined;
      }> = [];
      let originalBody = "";
      const originalAdded = JSON.stringify(added);
      const logs: Array<Logger.Options<unknown>> = [];
      const overflowed = await Effect.runPromise(
        Effect.flip(
          judged(
            async (state, questions, { apiKey }) => {
              asked.push({ state, questions, apiKey });
              originalBody = JSON.stringify(requestOf("clef-flash", state, questions));
              throw new ContextOverflow("too long");
            },
            "openai",
            { plain: hooked },
            undefined,
            kind,
          ),
        ).pipe(
          Effect.provide(Logger.layer([Logger.make((entry) => logs.push(entry))])),
          Effect.provideService(References.MinimumLogLevel, minimum),
        ),
      );
      expect(overflowed._tag).toBe("JevOverflow");
      expect(asked).toEqual([
        { state: request.state, questions: questionsOf(request.questions), apiKey: "sk-saved" },
      ]);
      const messages = logs.flatMap(({ message }) =>
        Array.isArray(message) ? message : [message],
      );
      const oversized = messages.filter((message) =>
        String(message).includes("too long request payload"),
      );
      if (minimum !== "Debug") {
        const label = `${kind}: too long request payload (provider overflow)\n`;
        expect(oversized).toHaveLength(1);
        expect(String(oversized[0]).startsWith(label)).toBe(true);
        const json = jsonFromDiagnostic(String(oversized[0]).slice(label.length));
        const logged = JSON.parse(json) as typeof request;
        const id = kind === "judge" ? "plain" : "start:plain:1";
        expect(Object.keys(request.questions)).toEqual([id]);
        const question = request.questions[id]!;
        expect(question.instructions).toMatchObject({ rule: plain.description, must: plain.must });
        if (minimum === "Trace" && question.type === "choice") {
          const { criteria, ...withoutCriteria } = question;
          expect(criteria).toEqual({ "1": lines[0] });
          expect(logged.questions[id]).not.toHaveProperty("criteria");
          expect(logged).toEqual({ ...request, questions: { [id]: withoutCriteria } });
          expect(json).toBe(JSON.stringify(logged, null, 2));
        } else {
          expect(json).toBe(JSON.stringify(request, null, 2));
          expect(logged).toEqual(request);
          expect(logged.questions[id]?.criteria).toBeDefined();
        }
        expect(logged.state).toMatchObject(added);
        if (minimum === "Trace") expect(Object.keys(logged.state)[0]).toBe("code");
        expect(logged.model).toBe("clef-flash");
        expect(
          logs.find(({ message }) => Array.isArray(message) && message.includes(oversized[0]))
            ?.logLevel,
        ).toBe("Trace");
      } else {
        expect(oversized).toEqual([]);
        const label = `${kind}: first ${kind === "locate" ? "match-to-lines " : ""}request payload\n`;
        const previews = messages.filter((message) => String(message).startsWith(label));
        expect(previews).toHaveLength(1);
        const logged = JSON.parse(
          jsonFromDiagnostic(String(previews[0]).slice(label.length)),
        ) as SystemOneRequest;
        expect(logged.state).toEqual(request.state);
        expect(Object.keys(logged.state)[0]).toBe("code");
        expect(logged.model).toBe(request.model);
        const id = kind === "judge" ? "plain" : "start:plain:1";
        if (kind === "locate") {
          const { criteria, ...question } = request.questions[id]!;
          expect(criteria).toBeDefined();
          expect(logged.questions).toEqual({ [id]: question });
        } else {
          expect(logged.questions).toEqual(request.questions);
        }
      }
      for (const message of messages.filter((message) =>
        String(message).includes("request payload"),
      )) {
        expect(String(message)).toContain("\n\tconst escaped = ");
        expect(String(message)).toContain(String.raw`\\n\\t`);
        expect(String(message)).not.toContain(String.raw`\n\tconst escaped`);
      }
      expect(originalBody).toContain(String.raw`\n\tconst escaped`);
      expect(JSON.stringify(added)).toBe(originalAdded);
      const sent = asked[0]!;
      expect(JSON.stringify(requestOf("clef-flash", sent.state, sent.questions))).toBe(
        originalBody,
      );
      expect(JSON.parse(originalBody)).toEqual(request);
      expect(JSON.stringify(messages)).not.toContain("sk-saved");
      expect(request).not.toHaveProperty("apiKey");
      expect(request).not.toHaveProperty("signal");
      expect(messages).toContain("attempt failed: too long");
    },
  );

  it.each(["All", "Trace", "Debug", "Info"] as const)(
    "previews only the first judge and match-to-lines request per shared JevLive (minimum: %s)",
    async (minimum) => {
      const context = `export function caller() {\n\tconst escaped = "\\n\\t";\n\treturn "${"preview-context".repeat(40_000)}";\n}`;
      const added = { references: { "port:caller.ts": context } };
      const readState = { workspacePackages: { server: "src" } };
      const hookedRules = {
        plain: { ...plain, appliesTo: ["a server"], appendState: async () => added },
        named: { ...named, appliesTo: ["a server"], appendState: async () => added },
      };
      const files = [file, { path: "/repo/src/other.ts", contents: "  const port = 8080;" }, file];
      const expected = files.flatMap((current) => {
        const code = current.contents.split("\n");
        return ["judge", "locate"].flatMap((kind) =>
          Object.entries(hookedRules).flatMap(([id, rule]) => {
            const body = (
              kind === "judge"
                ? judgeBody("clef-flash", code, { [id]: rule }, [], readState)
                : locateBody("clef-flash", code, { [id]: rule }, readState)
            ) as SystemOneRequest & { readonly state: JevState };
            const split = requestsOf({
              ...body,
              state: describeState({ ...body.state, ...added }),
            });
            expect(split.length).toBeGreaterThan(1);
            return split;
          }),
        );
      });
      const firstJudge = expected[0]!;
      const firstLocate = expected.find((body) =>
        Object.keys(body.questions)[0]?.startsWith("start:"),
      )!;
      const asked: Array<SystemOneRequest> = [];
      const snapshots: string[] = [];
      const keys: Array<string | undefined> = [];
      const logs: Array<Logger.Options<unknown>> = [];
      const provider: Provider = {
        model: "clef-flash",
        savedKey: "openai",
        ask: async (state, questions, { apiKey }) => {
          const body = requestOf("clef-flash", state, questions);
          asked.push(body);
          snapshots.push(JSON.stringify(body));
          keys.push(apiKey);
          if (asked.length === 1) throw new RequestFailed("retry first request", 503);
          return { answers: {} };
        },
      };
      await Effect.runPromise(
        Effect.gen(function* () {
          const jev = yield* Jev;
          for (const current of files) {
            const code = current.contents.split("\n");
            const judged = yield* jev.judge(code, hookedRules, [], current, readState);
            expect(judged.probabilities).toEqual({});
            expect(yield* jev.locate(code, hookedRules, current, readState)).toEqual({});
          }
        }).pipe(
          Effect.provide(
            JevLive.pipe(
              Layer.provide([
                Layer.succeed(FetchHttpClient.Fetch, (() => {
                  throw new Error("preview tests send no HTTP requests");
                }) as unknown as typeof globalThis.fetch),
                Layer.succeed(AdhereConfig, resolveConfig({ presets: [], rules: {}, provider })),
                Layer.succeed(Credentials, {
                  key: () => Effect.succeed(Redacted.make("sk-saved")),
                  file: Effect.die("unused"),
                  save: () => Effect.die("unused"),
                  remove: () => Effect.die("unused"),
                }),
              ]),
            ),
          ),
          Effect.provide(Logger.layer([Logger.make((entry) => logs.push(entry))])),
          Effect.provideService(References.MinimumLogLevel, minimum),
        ),
      );
      expect(asked).toEqual([firstJudge, ...expected]);
      expect(asked.map((body) => JSON.stringify(body))).toEqual(snapshots);
      expect(snapshots[0]).toContain(String.raw`\n\tconst escaped`);
      expect(snapshots.map((json) => JSON.parse(json))).toEqual(asked);
      expect(keys).toEqual(asked.map(() => "sk-saved"));
      const messages = logs.flatMap(({ message }) =>
        Array.isArray(message) ? message : [message],
      );
      const previews = messages.filter((message) => String(message).includes("request payload"));
      if (minimum === "Info") {
        expect(previews).toEqual([]);
        expect(JSON.stringify(messages)).not.toContain("preview-context");
      } else {
        const labels = [
          "judge: first request payload\n",
          "locate: first match-to-lines request payload\n",
        ];
        expect(previews).toHaveLength(2);
        for (const [index, body] of [firstJudge, firstLocate].entries()) {
          const label = labels[index]!;
          expect(String(previews[index]).startsWith(label)).toBe(true);
          const text = String(previews[index]).slice(label.length);
          expect(text).toContain("\n\tconst escaped = ");
          expect(text).toContain(String.raw`\\n\\t`);
          expect(text).not.toContain(String.raw`\n\tconst escaped`);
          const json = jsonFromDiagnostic(text);
          const logged = JSON.parse(json) as SystemOneRequest;
          expect(logged.model).toBe(body.model);
          expect(logged.state).toEqual(body.state);
          expect(logged.state).toMatchObject({ ...readState, ...added });
          if (minimum === "All") {
            expect(json).toBe(JSON.stringify(body, null, 2));
            expect(logged).toEqual(body);
          } else {
            expect(Object.keys(logged.state)[0]).toBe("code");
            if (index === 0) {
              expect(logged.questions).toEqual(body.questions);
              expect(logged.questions.plain?.criteria).toBeDefined();
            } else {
              const { criteria, ...question } = body.questions["start:plain:1"]!;
              expect(criteria).toEqual({ "1": lines[0] });
              expect(logged.questions).toEqual({ "start:plain:1": question });
            }
          }
          expect(
            logs.find(({ message }) => Array.isArray(message) && message.includes(previews[index]))
              ?.logLevel,
          ).toBe("Debug");
        }
      }
      expect(JSON.stringify(messages)).not.toContain("sk-saved");
      expect(messages.some((message) => String(message).includes("too long request payload"))).toBe(
        false,
      );
    },
  );

  it("is asked as a method, so a class can implement it", async () => {
    class Fixed implements Provider {
      readonly model = "fixed";
      readonly #probability = 0.61;
      async ask(_state: State, questions: ReadonlyArray<Question>, _options: AskOptions) {
        return { answers: Object.fromEntries(questions.map(({ id }) => [id, this.#probability])) };
      }
    }
    const fixed = new Fixed();
    const result = await Effect.runPromise(
      Effect.flatMap(decodeConfig({ provider: fixed }), (config) =>
        judged(fixed.ask, undefined, { plain }, config.provider),
      ),
    );
    expect(result.probabilities).toEqual({ plain: 0.61 });
  });

  it("is asked again after a RequestFailed with no answer, a 408, a 429, or a 5xx, but refuses any other at once", async () => {
    const statuses = [503, 200];
    const retried = await Effect.runPromise(
      judged(async () => {
        const status = statuses.shift();
        if (status !== 200) throw new RequestFailed(`Clef answered HTTP ${status}`, status ?? 0);
        return { answers: { plain: 0.93 } };
      }),
    );
    expect(retried.probabilities).toEqual({ plain: 0.93 });
    expect(statuses).toEqual([]);

    let asked = 0;
    const refused = await Effect.runPromise(
      Effect.flip(
        judged(async () => {
          asked++;
          throw new RequestFailed("Clef answered HTTP 401: bad token", 401);
        }),
      ),
    );
    expect(refused).toMatchObject({
      _tag: "JevUnavailable",
      message: "Clef answered HTTP 401: bad token",
    });
    expect(asked).toBe(1);
  });

  it("leaves a rule unanswered while any of its matchers is, so it is asked again", async () => {
    const scoped: Rule = { ...plain, appliesTo: ["a server"], excludeIf: ["a test"] };
    const answering = (answers: Readonly<Record<string, number>>) =>
      Effect.runPromise(judged(async () => ({ answers }), undefined, { plain: scoped }));
    const refusedMatcher = await answering({ plain: 0.93, "appliesTo:plain:0": 0.9 });
    expect(refusedMatcher.probabilities).toEqual({});
    expect(refusedMatcher.matchers).toBeUndefined();
    const all = await answering({
      plain: 0.93,
      "appliesTo:plain:0": 0.9,
      "excludeIf:plain:0": 0.1,
    });
    expect(all.probabilities).toEqual({ plain: 0.93 });
    expect(all.matchers).toEqual({ plain: { appliesTo: [0.9], excludeIf: [0.1] } });
  });

  it("refuses the run with what it said when it rejects otherwise", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(judged(() => Promise.reject(new Error("Clef answered HTTP 429: slow down")))),
    );
    expect(refused).toMatchObject({
      _tag: "JevUnavailable",
      message: "Clef answered HTTP 429: slow down",
    });
  });

  it("refuses the run when its answers are not probabilities and keys", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(judged(async () => ({ answers: { plain: { noul: 0.93 } } }) as never)),
    );
    expect(refused).toMatchObject({
      _tag: "JevUnavailable",
      message: expect.stringContaining("clef-flash's answers did not decode"),
    });
  });

  it("is a model and a function", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ provider: { model: "clef-flash", ask: "https://example.com" } })),
    );
    expect(refused.message).toContain("a function");
  });
});
