/**
 * Cloudflare's Clef on Workers AI. Clef follows System One, so adhere's
 * questions go as Jev's provider sends them, but for three differences: at
 * most 64 questions to a request, ids of letters, digits, `_`, `.` and `-`
 * where adhere's hold `/` and `:`, and no `choice` of one option. So the
 * questions go in chunks of 64, each under its place in its chunk, and a
 * choice of one option is answered by it, unasked.
 *
 * Clef cuts a state too long for it short rather than refuse it, and says so
 * only by the tokens it read: on 2026-10-10, clef read at most 64,000 and
 * clef-flash 24,000, well under the 65,536 their pages give. A request that
 * reads that many, or that Workers AI refuses as too large with a 413, is
 * over the model's context, and skips the file.
 */
import { decoded, failed, post } from "#providers/post.ts";
import { ContextOverflow, type Provider, withoutSingleChoices } from "#providers/provider.ts";
import { answersOf, requestOf, SystemOneAnswered } from "#providers/systemOne.ts";
import { Schema } from "effect";

const QUESTIONS_PER_REQUEST = 64;
const MOST_TOKENS = { clef: 64_000, "clef-flash": 24_000 } as const;

/** Workers AI's envelope around Clef's answers. */
const Ran = Schema.fromJsonString(Schema.Struct({ result: SystemOneAnswered }));

export interface CloudflareOptions {
  /** The Cloudflare account that runs the model. */
  readonly accountId: string;
  /** A Cloudflare API token that can run Workers AI models. */
  readonly apiToken: string;
  /** The model to ask. Defaults to "clef". */
  readonly model?: "clef" | "clef-flash";
  /** What sends the requests. Defaults to `fetch`. */
  readonly fetch?: typeof globalThis.fetch;
}

export const cloudflare = ({
  accountId,
  apiToken,
  model = "clef",
  fetch,
}: CloudflareOptions): Provider => ({
  model,
  ask: async (state, questions, { signal }) => {
    const { answers, asked } = withoutSingleChoices(questions);
    const chunks = Array.from({ length: Math.ceil(asked.length / QUESTIONS_PER_REQUEST) }, (_, n) =>
      asked.slice(n * QUESTIONS_PER_REQUEST, (n + 1) * QUESTIONS_PER_REQUEST),
    );
    const ran = await Promise.all(
      chunks.map(async (chunk) => {
        const { response, text } = await post(
          "Cloudflare",
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/cloudflare/${model}`,
          { Authorization: `Bearer ${apiToken}` },
          requestOf(
            model,
            state,
            chunk.map((question, place) => ({ ...question, id: `q${place}` })),
          ),
          signal,
          fetch,
        );
        const overflow = () => new ContextOverflow(`The request is over ${model}'s context`);
        if (response.status === 413) throw overflow();
        if (!response.ok) throw failed("Cloudflare", response, text);
        const { result } = decoded("Cloudflare", Ran, text);
        if ((result.usage?.input_tokens ?? 0) >= MOST_TOKENS[model]) throw overflow();
        return { chunk, result };
      }),
    );
    for (const { chunk, result } of ran) {
      const answered = answersOf(result.answers);
      chunk.forEach((question, place) => {
        const answer = answered[`q${place}`];
        if (answer !== undefined) answers[question.id] = answer;
      });
    }
    return {
      answers,
      inputTokens: ran.reduce((sum, { result }) => sum + (result.usage?.input_tokens ?? 0), 0),
      model,
    };
  },
});
