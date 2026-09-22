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

/**
 * The context Jev judges: the documented pattern and the code, kept apart
 * so the model does not have to split one string.
 */
const JudgmentState = Schema.Struct({
  pattern: Schema.String,
  code: Schema.String,
});

/** One evaluation request body, exactly the System One API's shape. */
const EvaluationRequest = Schema.Struct({
  state: JudgmentState,
  model: Schema.Literals(["jev-latest"]),
  questions: Schema.Struct({
    violates: NoulQuestion,
    reason: ChoiceQuestion,
    line: ChoiceQuestion,
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
    line: ChoiceAnswer,
  }),
});

const encodeRequest = Schema.encodeEffect(EvaluationRequest);
const decodeResponse = Schema.decodeUnknownEffect(
  Schema.fromJsonString(EvaluationResponse),
);

/** What a violation means, named per-candidate so the reason is specific. */
const instructionsOf = (topic: string, rule: string): string =>
  `Does state.code violate the documented ${topic} pattern in state.pattern that the rule "${rule}" guards? Answer true only if the code genuinely diverges from the documented pattern, not merely because a keyword appears.`;

const refused = (message: string) => JevUnavailable.make({ message });

/** Line numbers in a numbered file, each paired with its text, for Jev to point at. */
const lineCriteria = (code: string): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (const row of code.split("\n")) {
    const matched = /^(\d+) \| (.*)$/.exec(row);
    if (matched === null) continue;
    const text = matched[2]?.trim() ?? "";
    criteria[matched[1] ?? "1"] = text.length === 0 ? "(blank)" : text.slice(0, 120);
  }
  return criteria;
};

/** The line Jev named, or the first numbered line when the choice is not in the file. */
const pointedLine = (
  code: string,
  choice: string,
): { readonly line: number; readonly snippet: string } => {
  const criteria = lineCriteria(code);
  const snippet = criteria[choice];
  const line = Number(choice);
  if (snippet !== undefined && Number.isInteger(line) && line > 0) {
    return { line, snippet: snippet === "(blank)" ? "" : snippet };
  }
  const first = Object.entries(criteria)[0];
  return first === undefined
    ? { line: 1, snippet: "" }
    : { line: Number(first[0]), snippet: first[1] === "(blank)" ? "" : first[1] };
};

/** One question set: the violation probability, its named reason, and the line. */
const questionsOf = (topic: string, rule: string, code: string) => ({
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
      "Which is it: state.code is a genuine violation of state.pattern, or compliant?",
  },
  line: {
    type: "choice" as const,
    criteria: lineCriteria(code),
    instructions:
      "Which line of state.code most clearly violates state.pattern? If none does, pick the first line.",
  },
});

/** One candidate's request body: pattern, excerpt, and questions. */
const payloadOf = (candidate: Candidate, pattern: string) => ({
  state: { pattern, code: candidate.excerpt },
  model: "jev-latest" as const,
  questions: questionsOf(candidate.topic, candidate.rule, candidate.excerpt),
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
    readonly line: { readonly choice: string };
  };
}

/** One verdict, assembled from a candidate and its evaluated answers. */
const verdictOf = (candidate: Candidate, evaluated: Evaluated): Verdict => {
  const pointed = pointedLine(candidate.excerpt, evaluated.answers.line.choice);
  return {
    topic: candidate.topic,
    rule: candidate.rule,
    file: candidate.file,
    line: pointed.line,
    column: 1,
    message: candidate.message,
    help: candidate.help,
    snippet: pointed.snippet,
    violates: evaluated.answers.violates.noul,
    reason: evaluated.answers.reason.choice,
    decidedBy: "jev",
  };
};

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
 * HTTP call per candidate. The API key is read through Effect `Config`
 * when a judged rule actually runs, never `process.env`.
 */
export const JevJudgeLive = Layer.effect(JevJudge)(
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const judge = (candidate: Candidate, pattern: string) =>
      Effect.flatMap(
        Config.redacted("TYPESAFE_API_KEY").pipe(
          Effect.mapError((problem) =>
            refused(`Cannot read TYPESAFE_API_KEY: ${problem.message}`),
          ),
        ),
        (apiKey) => judgedWith(candidate, pattern, apiKey, client),
      );
    return JevJudge.of({ judge });
  }),
);

/** The judge's platform: a fetch client layer, composed at the entry point. */
export const JevPlatform = FetchHttpClient.layer;
