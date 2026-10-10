/**
 * OpenAI's Decisions API: each of adhere's questions as a decision question,
 * a `noul` as a `predicate` and a `choice` as a `choice`. A decision
 * question's instructions are one string, so they hold the question as
 * System One asks it, in JSON: the question beside the fields it names, and
 * what yes and no mean. On the providers study's four repos, gpt-6-luna
 * ranked findings better and located them more often than with the same parts
 * in prose. The state is the input, in JSON. A question OpenAI refuses goes
 * unanswered.
 */
import { decoded, failed, post } from "#providers/post.ts";
import { type Provider, type Question, withoutSingleChoices } from "#providers/provider.ts";
import { systemOneQuestionOf } from "#providers/systemOne.ts";
import { Schema } from "effect";

const DECISIONS = "https://api.openai.com/v1/decisions";

/** A decision's answers, in question order: a predicate's probability, a choice's value, or a refusal, which has neither. */
const Decided = Schema.fromJsonString(
  Schema.Struct({
    answers: Schema.Array(
      Schema.Struct({
        name: Schema.NullOr(Schema.String),
        probability: Schema.optionalKey(Schema.Finite),
        choice: Schema.optionalKey(Schema.Union([Schema.String, Schema.Boolean])),
      }),
    ),
    model: Schema.optionalKey(Schema.String),
    usage: Schema.optionalKey(Schema.Struct({ input_tokens: Schema.Finite })),
  }),
);

/** System One's question without its type, in JSON, or its instructions alone when it says nothing of what yes and no mean. */
const instructionsOf = (question: Question): string => {
  const { type, ...asked } = systemOneQuestionOf(question);
  if (type === "noul" && asked.criteria !== undefined) return JSON.stringify(asked);
  return typeof asked.instructions === "string"
    ? asked.instructions
    : JSON.stringify(asked.instructions);
};

const decisionOf = (question: Question) =>
  question.type === "noul"
    ? { type: "predicate", name: question.id, instructions: instructionsOf(question) }
    : {
        type: "choice",
        name: question.id,
        instructions: instructionsOf(question),
        choices: Object.entries(question.options).map(([value, description]) =>
          description === null ? { value } : { value, description },
        ),
      };

export interface OpenAIOptions {
  /** An OpenAI API key. Defaults to `OPENAI_API_KEY`, or the key `adhere login --openai` saved. */
  readonly apiKey?: string;
  /** The model to ask. Defaults to "gpt-6-luna", the only one the Decisions API takes. */
  readonly model?: string;
  /** What sends the requests. Defaults to `fetch`. */
  readonly fetch?: typeof globalThis.fetch;
}

export const openai = ({ apiKey, model = "gpt-6-luna", fetch }: OpenAIOptions = {}): Provider => ({
  model,
  ...(apiKey === undefined ? { savedKey: "openai" as const } : {}),
  ask: async (state, questions, { apiKey: saved, signal }) => {
    const key = apiKey ?? saved;
    if (key === undefined) throw new Error("No OpenAI API key to ask gpt-6-luna with");
    // OpenAI takes no choice of one option.
    const { answers, asked } = withoutSingleChoices(questions);
    if (asked.length === 0) return { answers };
    const { response, text } = await post(
      "OpenAI",
      DECISIONS,
      { Authorization: `Bearer ${key}` },
      { model, input: JSON.stringify(state), questions: asked.map(decisionOf) },
      signal,
      fetch,
    );
    if (!response.ok) throw failed("OpenAI", response, text);
    const decided = decoded("OpenAI", Decided, text);
    for (const { name, probability, choice } of decided.answers) {
      if (name === null) continue;
      if (probability !== undefined) answers[name] = probability;
      else if (choice !== undefined) answers[name] = String(choice);
    }
    return { answers, inputTokens: decided.usage?.input_tokens, model: decided.model };
  },
});
