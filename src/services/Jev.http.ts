import { AdhereConfig } from "#services/AdhereConfig.ts";
import { Credentials } from "#services/Credentials.ts";
import {
  blockBody,
  type Body,
  type ComparedRule,
  conflictBody,
  contradictBody,
  Jev,
  JevOverflow,
  JevUnavailable,
  judgeBody,
  type Lines,
  locateBody,
  namedPairs,
  needsBlocks,
  type Pair,
  pairProbability,
  requestsOf,
  type Rules,
} from "#services/Jev.ts";
import { type Cause, Effect, Layer, Option, Record, Schedule, Schema } from "effect";
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/unstable/http";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";

const NoulAnswers = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Struct({ noul: Schema.Finite })),
});
const ChoiceAnswers = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Struct({ choice: Schema.String })),
});

const refused = (message: string) => JevUnavailable.make({ message });

/** Jev's error body, on one line and cut short, or nothing when it sent none. */
const detailOf = (body: string): string => {
  const text = body.trim().replace(/\s+/g, " ");
  return text.length === 0 ? "" : `: ${text.slice(0, 300)}`;
};

/** What Jev answers, with a 400, to a request over its context. */
const Overflowed = Schema.fromJsonString(
  Schema.Struct({ detail: Schema.Struct({ error_type: Schema.Literal("max_tokens_exceeded") }) }),
);
const isOverflow = (body: string): boolean =>
  Option.isSome(Schema.decodeUnknownOption(Overflowed)(body));

/**
 * A request that failed. A 400 saying the request is over Jev's context is a
 * `JevOverflow`, which skips the file. Any other answer outside 2xx refuses
 * the run with its status and what Jev said, since the status alone does not
 * say why, and a request that got no answer refuses with the cause.
 */
const failed = (problem: HttpClientError.HttpClientError | Cause.TimeoutError) => {
  if (!HttpClientError.isHttpClientError(problem) || problem.reason._tag !== "StatusCodeError") {
    return Effect.fail(refused(`System One request failed: ${problem.message}`));
  }
  const { response } = problem.reason;
  return Effect.flatMap(
    Effect.orElseSucceed(response.text, () => ""),
    (body): Effect.Effect<never, JevOverflow | JevUnavailable> =>
      response.status === 400 && isOverflow(body)
        ? Effect.fail(JevOverflow.make())
        : Effect.fail(refused(`Jev answered HTTP ${response.status}${detailOf(body)}`)),
  );
};

/** Comparing rules has no file to skip, so a request over Jev's context refuses instead. */
const refuseOverflow = <A>(
  self: Effect.Effect<A, JevOverflow | JevUnavailable>,
): Effect.Effect<A, JevUnavailable> =>
  Effect.catchTag(self, "JevOverflow", () =>
    Effect.fail(refused("Comparing the rules took a request over Jev's context")),
  );

export const JevLive = Layer.effect(Jev)(
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const credentials = yield* Credentials;
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.transformResponse(Effect.timeout("30 seconds")),
      HttpClient.retryTransient({
        schedule: Schedule.exponential("500 millis"),
        times: 3,
      }),
    );

    const ask = <A>(body: Body, Answers: Schema.Codec<A, unknown, never, never>) =>
      Effect.gen(function* () {
        // Read here, not in the layer: a run with nothing pending needs no key.
        const apiKey = yield* credentials.apiKey.pipe(
          Effect.mapError((problem) => refused(problem.message)),
        );
        const request = yield* HttpClientRequest.bodyJson(
          HttpClientRequest.post(SYSTEM_ONE),
          body,
        ).pipe(Effect.orDie);
        const response = yield* client
          .execute(HttpClientRequest.bearerToken(request, apiKey))
          .pipe(Effect.catch(failed));
        return yield* HttpClientResponse.schemaBodyJson(Answers)(response).pipe(
          Effect.mapError((problem) =>
            refused(`System One response did not decode: ${problem.message}`),
          ),
        );
      });

    /** Every answer to a body, over as many requests as Jev's context needs. */
    const answersTo = <A>(
      body: Body,
      Answers: Schema.Codec<
        { readonly answers: Readonly<Record<string, A>> },
        unknown,
        never,
        never
      >,
    ) =>
      Effect.map(
        Effect.forEach(requestsOf(body), (request) => ask(request, Answers)),
        (responses) =>
          responses.reduce<Record<string, A>>(
            (answers, response) => ({ ...answers, ...response.answers }),
            {},
          ),
      );

    const judge = Effect.fn("Jev.judge")(function* (lines: Lines, rules: Rules) {
      const answers = yield* answersTo(judgeBody(config.model, lines, rules), NoulAnswers);
      return Record.map(answers, (answer) => answer.noul);
    });

    const chosen = (answers: Readonly<Record<string, { choice: string }>>) =>
      Record.map(answers, (answer) => Number(answer.choice));

    const locate = Effect.fn("Jev.locate")(function* (lines: Lines, rules: Rules) {
      const blocks = needsBlocks(lines)
        ? chosen(yield* answersTo(blockBody(config.model, lines, rules), ChoiceAnswers))
        : undefined;
      return chosen(
        yield* answersTo(locateBody(config.model, lines, rules, blocks), ChoiceAnswers),
      );
    });

    const conflicts = Effect.fn("Jev.conflicts")(function* (
      rules: ReadonlyArray<ComparedRule>,
      partners: ReadonlyArray<ReadonlyArray<number>>,
    ) {
      const answers = yield* answersTo(
        conflictBody(config.model, rules, partners),
        ChoiceAnswers,
      ).pipe(refuseOverflow);
      return namedPairs(answers, partners);
    });

    const contradicts = Effect.fn("Jev.contradicts")(function* (
      rules: ReadonlyArray<ComparedRule>,
      pairs: ReadonlyArray<Pair>,
    ) {
      return yield* Effect.forEach(
        pairs,
        (pair) =>
          Effect.map(
            ask(contradictBody(config.model, rules, pair), NoulAnswers).pipe(refuseOverflow),
            ({ answers }) => pairProbability(answers, pair),
          ),
        { concurrency: 8 },
      );
    });

    return Jev.of({ judge, locate, conflicts, contradicts });
  }),
);
