import { AdhereConfig } from "#services/AdhereConfig.ts";
import {
  blockBody,
  Jev,
  JevUnavailable,
  judgeBody,
  locateBody,
  needsBlocks,
  type Rules,
} from "#services/Jev.ts";
import { Config, Effect, Layer, Record, Schedule, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";

const NoulAnswers = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Struct({ noul: Schema.Finite })),
});
const ChoiceAnswers = Schema.Struct({
  answers: Schema.Record(
    Schema.String,
    Schema.Struct({ choice: Schema.String }),
  ),
});

const refused = (message: string) => JevUnavailable.make({ message });

export const JevLive = Layer.effect(Jev)(
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.transformResponse(Effect.timeout("30 seconds")),
      HttpClient.retryTransient({
        schedule: Schedule.exponential("500 millis"),
        times: 3,
      }),
    );

    const ask = <A>(
      body: unknown,
      Answers: Schema.Codec<A, unknown, never, never>,
    ) =>
      Effect.gen(function* () {
        // Read lazily: a run with nothing pending never needs the key.
        const apiKey = yield* Config.redacted("TYPESAFE_API_KEY").pipe(
          Effect.mapError((problem) =>
            refused(`Cannot read TYPESAFE_API_KEY: ${problem.message}`),
          ),
        );
        const request = yield* HttpClientRequest.bodyJson(
          HttpClientRequest.post(SYSTEM_ONE),
          body,
        ).pipe(Effect.orDie);
        const response = yield* client
          .execute(HttpClientRequest.bearerToken(request, apiKey))
          .pipe(
            Effect.mapError((problem) =>
              refused(`System One request failed: ${problem.message}`),
            ),
          );
        return yield* HttpClientResponse.schemaBodyJson(Answers)(response).pipe(
          Effect.mapError((problem) =>
            refused(`System One response did not decode: ${problem.message}`),
          ),
        );
      });

    const judge = Effect.fn("Jev.judge")(function* (
      code: string,
      rules: Rules,
    ) {
      const { answers } = yield* ask(
        judgeBody(config.model, code, rules),
        NoulAnswers,
      );
      return Record.map(answers, (answer) => answer.noul);
    });

    const chosen = (answers: Readonly<Record<string, { choice: string }>>) =>
      Record.map(answers, (answer) => Number(answer.choice));

    const locate = Effect.fn("Jev.locate")(function* (
      code: string,
      rules: Rules,
    ) {
      const blocks = needsBlocks(code)
        ? chosen(
            (yield* ask(blockBody(config.model, code, rules), ChoiceAnswers))
              .answers,
          )
        : undefined;
      const { answers } = yield* ask(
        locateBody(config.model, code, rules, blocks),
        ChoiceAnswers,
      );
      return chosen(answers);
    });

    return Jev.of({ judge, locate });
  }),
);
