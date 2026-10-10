import { decodeConfig, resolveConfig, type Rule, type Rules } from "#config.ts";
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
import { Jev } from "#services/Jev.ts";
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

const plain: Rule = { description: "Ports must be named.", must: "const port = PORT;" };
const named: Rule = {
  description: "Handlers must be named.",
  must: "export const handle = () => 1;",
};
const lines = ["const port = 3000;"];
const file = { path: "/repo/src/server.ts", contents: lines.join("\n") };

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
) =>
  Effect.gen(function* () {
    const jev = yield* Jev;
    return yield* jev.judge(lines, rules, [], file);
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
