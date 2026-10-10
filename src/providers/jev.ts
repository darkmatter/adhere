/**
 * TypeSafe's Jev, adhere's default provider: adhere's questions as System One
 * requests to TypeSafe's API, as adhere built them. With no provider in the
 * config, adhere asks this one with the key `adhere login` saved, or
 * `TYPESAFE_API_KEY`; a config names it to ask with another key or model.
 */
import { decoded, failed, post } from "#providers/post.ts";
import { ContextOverflow, type Provider, RequestBlocked } from "#providers/provider.ts";
import { answersOf, requestOf, SystemOneAnswered } from "#providers/systemOne.ts";
import { Option, Schema } from "effect";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";

const Answer = Schema.fromJsonString(SystemOneAnswered);

/** What Jev answers, with a 400, to a request over its context. */
const Overflowed = Schema.fromJsonString(
  Schema.Struct({ detail: Schema.Struct({ error_type: Schema.Literal("max_tokens_exceeded") }) }),
);

export interface JevOptions {
  /** A TypeSafe AI API key. Defaults to `TYPESAFE_API_KEY`, or the key `adhere login` saved. */
  readonly apiKey?: string;
  /** The model to ask. Defaults to "jev-latest". */
  readonly model?: string;
  /** What sends the requests. Defaults to `fetch`. */
  readonly fetch?: typeof globalThis.fetch;
}

export const jev = ({ apiKey, model = "jev-latest", fetch }: JevOptions = {}): Provider => ({
  model,
  ...(apiKey === undefined ? { savedKey: "typesafe" as const } : {}),
  ask: async (state, questions, { apiKey: saved, signal }) => {
    const key = apiKey ?? saved;
    if (key === undefined) throw new Error("No TypeSafe AI API key to ask Jev with");
    const { response, text } = await post(
      "Jev",
      SYSTEM_ONE,
      { Authorization: `Bearer ${key}` },
      requestOf(model, state, questions),
      signal,
      fetch,
    );
    if (response.ok) {
      const answered = decoded("Jev", Answer, text);
      return {
        answers: answersOf(answered.answers),
        inputTokens: answered.usage?.input_tokens,
        model: answered.model,
      };
    }
    // Over Jev's context, a 400 that skips the file. The firewall in front of
    // TypeSafe's API answers a 403 with an HTML page, where Jev answers JSON:
    // a block, with the Ray ID TypeSafe can look it up by.
    if (response.status === 400 && Option.isSome(Schema.decodeUnknownOption(Overflowed)(text))) {
      throw new ContextOverflow("The request is over Jev's context");
    }
    const html =
      (response.headers.get("content-type") ?? "").includes("text/html") ||
      text.trimStart().startsWith("<");
    if (response.status === 403 && html) {
      throw new RequestBlocked(response.headers.get("cf-ray") ?? "none given");
    }
    throw failed("Jev", response, text);
  },
});
