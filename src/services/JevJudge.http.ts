import { type Candidate, type Verdict, JevJudge, JevUnavailable } from "#models/Judge.ts";
import { Config, Effect, Layer, Redacted, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
} from "effect/unstable/http";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import type { HttpClientResponse } from "effect/unstable/http/HttpClientResponse";

/** The System One endpoint: the only API TypeSafe documents. */
const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";

/** A yes/no question, as System One's `noul` shape. */
const NoulQuestion = Schema.Struct({
  type: Schema.Literals(["noul"]),
  instructions: Schema.String,
});

/** A category question, as System One's `choice` shape. */
const ChoiceQuestion = Schema.Struct({
  type: Schema.Literals(["choice"]),
  criteria: Schema.Record(Schema.String, Schema.String),
  instructions: Schema.String,
});

/** One evaluation request body, exactly the System One API's shape. */
const EvaluationRequest = Schema.Struct({
  state: Schema.String,
  model: Schema.Literals(["jev-latest"]),
  questions: Schema.Struct({
    violates: NoulQuestion,
    reason: ChoiceQuestion,
  }),
});

/** Jev's answer to the yes/no question: the probability it is true. */
const NoulAnswer = Schema.Struct({
  type: Schema.Literals(["noul"]),
  noul: Schema.Finite,
});

/** Jev's answer to the category question: the chosen category, with confidence. */
const ChoiceAnswer = Schema.Struct({
  type: Schema.Literals(["choice"]),
  choice: Schema.String,
  confidence: Schema.Finite,
});

/** One evaluation response, decoded at the boundary before use. */
const EvaluationResponse = Schema.Struct({
  model: Schema.String,
  answers: Schema.Struct({
    violates: NoulAnswer,
    reason: ChoiceAnswer,
  }),
});

const encodeRequest = Schema.encodeEffect(EvaluationRequest);
const decodeResponse = Schema.decodeUnknownEffect(
  Schema.fromJsonString(EvaluationResponse),
);

/** The prompt that asks Jev to judge one candidate against one topic. */
const stateOf = (excerpt: string, pattern: string): string =>
  `Topic documentation (the pattern to judge against):\n${pattern}\n\nCode excerpt (the code to judge):\n${excerpt}`;

/** What a violation means, named per-candidate so the reason is specific. */
const instructionsOf = (topic: string, rule: string): string =>
  `Does the code excerpt violate the documented ${topic} pattern that the rule "${rule}" guards? Answer true only if the code genuinely diverges from the documented pattern, not merely because a keyword appears.`;

const refused = (message: string) => JevUnavailable.make({ message });

/** One question set: the violation probability and its named reason. */
const questionsOf = (topic: string, rule: string) => ({
  violates: {
    type: "noul" as const,
    instructions: instructionsOf(topic, rule),
  },
  reason: {
    type: "choice" as const,
    criteria: {
      violation:
        "The code diverges from the documented pattern this rule guards",
      compliant:
        "The code follows the documented pattern or the pattern does not apply",
    },
    instructions:
      "Which is it: a genuine violation of the documented pattern, or compliant?",
  },
});

/** One candidate's request body: pattern, excerpt, and questions. */
const payloadOf = (candidate: Candidate, pattern: string) => ({
  state: stateOf(candidate.excerpt, pattern),
  model: "jev-latest" as const,
  questions: questionsOf(candidate.topic, candidate.rule),
});

/** One candidate's request, built and authorized. */
const requestOf = Effect.fn("JevJudge.requestOf")(
  (
    candidate: Candidate,
    pattern: string,
    apiKey: Redacted.Redacted,
  ): Effect.Effect<HttpClientRequest.HttpClientRequest> =>
    Effect.gen(function* () {
      const body = yield* encodeRequest(payloadOf(candidate, pattern));
      const request = HttpClientRequest.post(SYSTEM_ONE);
      const withBody = yield* HttpClientRequest.bodyJson(request, body);
      return HttpClientRequest.bearerToken(withBody, apiKey);
    }).pipe(Effect.orDie),
);

/** A transport failure, as the judge's own refusal. */
const transportRefused = (problem: HttpClientError.HttpClientError) =>
  refused(`System One request failed: ${problem.message}`);

/** One response's body text, or the refusal when it could not be read. */
const textOf = (response: HttpClientResponse) =>
  response.text.pipe(
    Effect.mapError((problem) =>
      refused(`System One response unreadable: ${String(problem)}`),
    ),
  );

/** One response, decoded to the two answers the audit keeps. */
const decoded = Effect.fn("JevJudge.decoded")((text: string) =>
  decodeResponse(text).pipe(
    Effect.mapError((problem) =>
      refused(`System One response did not decode: ${String(problem)}`),
    ),
  ),
);

/** One response, from its body text to the answers the audit keeps. */
const evaluatedFrom = Effect.fn("JevJudge.evaluatedFrom")(
  (response: HttpClientResponse) => Effect.flatMap(textOf(response), decoded),
);

/** What one evaluation answered: the two answers the audit keeps. */
interface Evaluated {
  readonly answers: {
    readonly violates: { readonly noul: number };
    readonly reason: { readonly choice: string };
  };
}

/** One verdict, assembled from a candidate and its evaluated answers. */
const verdictOf = (candidate: Candidate, evaluated: Evaluated): Verdict => ({
  topic: candidate.topic,
  rule: candidate.rule,
  file: candidate.file,
  line: candidate.line,
  column: candidate.column,
  message: candidate.message,
  help: candidate.help,
  snippet: candidate.snippet,
  violates: evaluated.answers.violates.noul,
  reason: evaluated.answers.reason.choice,
});

/** One candidate's judgment: request, response, decoded answers, verdict. */
const judgedWith = Effect.fn("JevJudge.judgedWith")(
  (
    candidate: Candidate,
    pattern: string,
    apiKey: Redacted.Redacted,
    client: HttpClient.HttpClient,
  ) =>
    Effect.gen(function* () {
      const request = yield* requestOf(candidate, pattern, apiKey);
      const response = yield* HttpClient.execute(request).pipe(
        Effect.provideService(HttpClient.HttpClient, client),
        Effect.mapError(transportRefused),
      );
      const evaluated = yield* evaluatedFrom(response);
      return verdictOf(candidate, evaluated);
    }),
);

/**
 * The real judge: TypeSafe's System One API, the `jev-latest` model, one
 * HTTP call per candidate. The API key is read through Effect `Config`,
 * never `process.env` — the audit obeys the very topic it enforces.
 */
export const JevJudgeLive = Layer.effect(JevJudge)(
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("TYPESAFE_API_KEY").pipe(
      Effect.mapError((problem) =>
        refused(`Cannot read TYPESAFE_API_KEY: ${problem.message}`),
      ),
    );
    const client = yield* HttpClient.HttpClient;
    const judge = (candidate: Candidate, pattern: string) =>
      judgedWith(candidate, pattern, apiKey, client);
    return JevJudge.of({ judge });
  }),
);

/** The judge's platform: a fetch client layer, composed at the entry point. */
export const JevPlatform = FetchHttpClient.layer;
