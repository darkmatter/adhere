import type { Rule } from "#config.ts";
import { cloudflare } from "#providers/cloudflare.ts";
import { jev } from "#providers/jev.ts";
import { openai } from "#providers/openai.ts";
import { ContextOverflow, type Question, RequestFailed } from "#providers/provider.ts";
import { questionsOf, requestOf } from "#providers/systemOne.ts";
import { conflictBody, contradictBody, judgeBody, locateBody } from "#services/Jev.ts";
import { describe, expect, it } from "vite-plus/test";

const plain: Rule = {
  description: "Ports must be named.",
  must: "const port = PORT;",
  never: "listen(3000)",
  appliesTo: ["a server's entry point"],
};
const lines = ["const port = 3000;", "", "listen(port);"];
const compared = [
  { id: "a", rule: plain },
  { id: "b", rule: { description: "Ports must be literals.", must: "listen(3000)" } },
];

/** A fetch that records each request's URL, headers, and body, and answers with `respond`. */
const recording = (respond: (body: Record<string, unknown>, sent: number) => Response) => {
  const sent: Array<{ url: string; authorization: string | null; body: Record<string, unknown> }> =
    [];
  const fetch = (async (url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    sent.push({
      url: String(url),
      authorization: new Headers(init?.headers).get("authorization"),
      body,
    });
    return respond(body, sent.length);
  }) as typeof globalThis.fetch;
  return { sent, fetch };
};

const noul = (id: string): Question => ({ id, type: "noul", question: `Is ${id} so?`, fields: {} });

/** What adhere passes `ask` beside the key: a signal no test aborts. */
const signal = new AbortController().signal;

describe("System One", () => {
  it("puts adhere's questions back as adhere built them, for Jev and Clef", () => {
    const bodies = [
      judgeBody("jev-latest", lines, { plain }, ["plain"]),
      locateBody("jev-latest", lines, { plain }),
      conflictBody("jev-latest", compared, [[1], [0]]),
      contradictBody("jev-latest", compared, [0, 1]),
    ];
    for (const body of bodies) {
      const rebuilt = requestOf(body.model, body.state, questionsOf(body.questions));
      expect(JSON.stringify(rebuilt)).toBe(JSON.stringify(body));
    }
  });
});

describe("jev", () => {
  it("sends adhere's request to TypeSafe with the key, and reads each answer as a value", async () => {
    const body = judgeBody("jev-latest", lines, { plain });
    const { sent, fetch } = recording(() =>
      Response.json({
        model: "jev-1.13.0",
        answers: { plain: { noul: 0.91 }, "appliesTo:plain:0": { noul: 0.2 } },
        usage: { input_tokens: 420 },
      }),
    );
    const answered = await jev({ apiKey: "tsk_test", fetch }).ask(
      body.state,
      questionsOf(body.questions),
      { signal },
    );
    expect(sent.map(({ url, authorization }) => [url, authorization])).toEqual([
      ["https://api.typesafe.ai/v1/systemone", "Bearer tsk_test"],
    ]);
    expect(JSON.stringify(sent[0]?.body)).toBe(JSON.stringify(body));
    expect(answered).toEqual({
      answers: { plain: 0.91, "appliesTo:plain:0": 0.2 },
      inputTokens: 420,
      model: "jev-1.13.0",
    });
  });
});

describe("saved keys", () => {
  it("are named by jev and openai built without a key, and asked with the key adhere passes", async () => {
    const toJev = recording(() => Response.json({ answers: {} }));
    const toOpenAI = recording(() => Response.json({ answers: [] }));
    const jevProvider = jev({ fetch: toJev.fetch });
    const openaiProvider = openai({ fetch: toOpenAI.fetch });
    expect([jevProvider.savedKey, openaiProvider.savedKey]).toEqual(["typesafe", "openai"]);
    expect(jev({ apiKey: "tsk_own" }).savedKey).toBeUndefined();
    await jevProvider.ask({}, [noul("a")], { apiKey: "tsk_saved", signal });
    await openaiProvider.ask({}, [noul("a")], { apiKey: "sk-saved", signal });
    expect([...toJev.sent, ...toOpenAI.sent].map(({ authorization }) => authorization)).toEqual([
      "Bearer tsk_saved",
      "Bearer sk-saved",
    ]);
    await expect(jevProvider.ask({}, [noul("a")], { signal })).rejects.toThrow(
      "No TypeSafe AI API key",
    );
  });
});

describe("cloudflare", () => {
  it("asks 64 questions to a request under ids Clef takes, answers a choice of one option unasked, and puts each answer back under its key", async () => {
    const questions: ReadonlyArray<Question> = [
      ...Array.from({ length: 70 }, (_, index) => noul(`linter:rule/${index}`)),
      { id: "start:rule:1", type: "choice", question: "Where?", fields: {}, options: { "3": "x" } },
    ];
    const { sent, fetch } = recording((body) =>
      Response.json({
        result: {
          model: "clef",
          answers: Object.fromEntries(
            Object.keys(body.questions as object).map((id) => [id, { type: "noul", noul: 0.5 }]),
          ),
          usage: { input_tokens: 100 },
        },
      }),
    );
    const answered = await cloudflare({ accountId: "acct", apiToken: "cft", fetch }).ask(
      { code: { "1": "x" } },
      questions,
      { signal },
    );
    expect(sent.map(({ url }) => url)).toEqual([
      "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/cloudflare/clef",
      "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/cloudflare/clef",
    ]);
    expect(sent.map(({ body }) => Object.keys(body.questions as object).length)).toEqual([64, 6]);
    expect(Object.keys(sent[1]?.body.questions as object)).toEqual([
      "q0",
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
    ]);
    expect(answered.answers["linter:rule/69"]).toBe(0.5);
    expect(answered.answers["start:rule:1"]).toBe("3");
    expect(answered.inputTokens).toBe(200);
  });

  it("skips as over its context a request it read to its limit, or one Workers AI refused as too large", async () => {
    const read = (tokens: number) =>
      recording(() =>
        Response.json({
          result: { answers: { q0: { noul: 0.5 } }, usage: { input_tokens: tokens } },
        }),
      ).fetch;
    const flash = (fetch: typeof globalThis.fetch) =>
      cloudflare({ accountId: "acct", apiToken: "cft", model: "clef-flash", fetch }).ask(
        {},
        [noul("a")],
        { signal },
      );
    expect((await flash(read(23_999))).answers).toEqual({ a: 0.5 });
    await expect(flash(read(24_000))).rejects.toBeInstanceOf(ContextOverflow);
    const tooLarge = recording(() => new Response("{}", { status: 413 })).fetch;
    await expect(flash(tooLarge)).rejects.toBeInstanceOf(ContextOverflow);
  });
});

describe("openai", () => {
  it("asks each question as a decision question, its parts in JSON, and leaves a refusal unanswered", async () => {
    const questions: ReadonlyArray<Question> = [
      {
        id: "plain",
        type: "noul",
        question: "Does `code` diverge from `must`?",
        fields: { rule: "Ports must be named.", must: "const port = PORT;" },
        yes: "it diverges",
        no: "it follows",
      },
      {
        id: "plain:section",
        type: "choice",
        question: "Which?",
        fields: {},
        options: { "1": null, "2": "the second" },
      },
      {
        id: "start:plain:1",
        type: "choice",
        question: "Where?",
        fields: {},
        options: { "7": "x" },
      },
      noul("refused"),
    ];
    const { sent, fetch } = recording(() =>
      Response.json({
        model: "gpt-6-luna",
        answers: [
          { type: "predicate", name: "plain", probability: 0.9 },
          {
            type: "choice",
            name: "plain:section",
            choice: "2",
            probabilities: [],
            confidence: 0.8,
          },
          { type: "refusal", name: "refused" },
        ],
        usage: { input_tokens: 300 },
      }),
    );
    const answered = await openai({ apiKey: "sk-test", fetch }).ask(
      { code: { "1": "x" } },
      questions,
      { signal },
    );
    expect(sent[0]?.body).toEqual({
      model: "gpt-6-luna",
      input: JSON.stringify({ code: { "1": "x" } }),
      questions: [
        {
          type: "predicate",
          name: "plain",
          instructions: JSON.stringify({
            instructions: {
              question: "Does `code` diverge from `must`?",
              rule: "Ports must be named.",
              must: "const port = PORT;",
            },
            criteria: { true: "it diverges", false: "it follows" },
          }),
        },
        {
          type: "choice",
          name: "plain:section",
          instructions: "Which?",
          choices: [{ value: "1" }, { value: "2", description: "the second" }],
        },
        { type: "predicate", name: "refused", instructions: "Is refused so?" },
      ],
    });
    expect(answered).toEqual({
      answers: { "start:plain:1": "7", plain: 0.9, "plain:section": "2" },
      inputTokens: 300,
      model: "gpt-6-luna",
    });
  });
});

describe("a failed request", () => {
  it("is thrown once, as a RequestFailed with its status and Ray ID, or status 0 when nothing answered", async () => {
    const busy = recording(
      () => new Response("busy\n", { status: 503, headers: { "cf-ray": "8c1f-LAX" } }),
    );
    const failed = await jev({ apiKey: "tsk_test", fetch: busy.fetch })
      .ask({}, [noul("a")], { signal })
      .catch((cause: unknown) => cause);
    expect(failed).toBeInstanceOf(RequestFailed);
    expect(failed).toMatchObject({
      status: 503,
      message: "Jev answered HTTP 503, Ray ID 8c1f-LAX: busy",
    });
    expect(busy.sent).toHaveLength(1);

    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;
    await expect(
      openai({ apiKey: "sk-test", fetch: down }).ask({}, [noul("a")], { signal }),
    ).rejects.toMatchObject({ status: 0, message: "OpenAI did not answer: fetch failed" });
  });

  it("is an answer that does not decode, naming who sent it", async () => {
    const { fetch } = recording(() => Response.json({ answers: "none" }));
    await expect(
      openai({ apiKey: "sk-test", fetch }).ask({}, [noul("a")], { signal }),
    ).rejects.toThrow("OpenAI's answer did not decode");
  });
});
