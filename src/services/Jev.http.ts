import type { AppendState, JevState, JudgedFile, RuleId } from "#config.ts";
import { sectionsOf } from "#excerpt.ts";
import { AdhereConfig } from "#services/AdhereConfig.ts";
import { Credentials } from "#services/Credentials.ts";
import {
  type Body,
  type ComparedRule,
  edgeKey,
  conflictBody,
  contradictBody,
  Jev,
  JevBlocked,
  JevOverflow,
  JevUnavailable,
  type Judged,
  judgeBody,
  type Lines,
  linterKey,
  locateBody,
  matcherKey,
  type MatcherScores,
  namedPairs,
  type Pair,
  pairProbability,
  requestGroups,
  requestsOf,
  type Rules,
  sufficiencyKey,
  tokensOf,
} from "#services/Jev.ts";
import {
  type Cause,
  Duration,
  Effect,
  Layer,
  Option,
  Record,
  Result,
  Schedule,
  Schema,
} from "effect";
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/http";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import { RateLimiter } from "effect/persistence";

const SYSTEM_ONE = "https://api.typesafe.ai/v1/systemone";

const NoulAnswers = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Struct({ noul: Schema.Finite })),
});
const ChoiceAnswers = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Struct({ choice: Schema.String })),
});
/** A locate request's answers: a choice per rule, and a noul per sufficiency question. */
const LocateAnswers = Schema.Struct({
  answers: Schema.Record(
    Schema.String,
    Schema.Struct({
      choice: Schema.optionalKey(Schema.String),
      noul: Schema.optionalKey(Schema.Finite),
    }),
  ),
});

const refused = (message: string) => JevUnavailable.make({ message });

/** Bun's API, for a rule's hook. Read off `globalThis`, as presets.ts reads it: Vitest runs this on Node. */
const bun = (globalThis as { readonly Bun?: unknown }).Bun as Parameters<AppendState>[2];

/**
 * A body as it goes out: when its rule's `reads` names the workspace's
 * packages, with them in its state, and when it has `appendState`, with what
 * the hook returns spread over that. A hook that fails refuses the run.
 */
const hooked = (
  sent: Body & { readonly state: JevState },
  group: Rules,
  file: JudgedFile,
  workspacePackages: Readonly<Record<string, string>>,
): Effect.Effect<Body, JevUnavailable> => {
  const body = Object.values(group).some(
    (rule) => rule.reads?.includes("workspacePackages") === true,
  )
    ? { ...sent, state: { ...sent.state, workspacePackages } }
    : sent;
  const [hook] = Object.entries(group).flatMap(([id, rule]) =>
    rule.appendState === undefined ? [] : [[id, rule.appendState] as const],
  );
  if (hook === undefined) return Effect.succeed(body);
  const [id, appendState] = hook;
  return Effect.tryPromise({
    try: async () => ({
      ...body,
      state: { ...body.state, ...(await appendState(body.state, file, bun)) },
    }),
    catch: (cause) =>
      refused(
        `the appendState of ${id} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  });
};

/** A failed attempt, for the log: the status and Ray ID when Jev's side answered, the cause otherwise. */
const attemptFailure = (
  problem: HttpClientError.HttpClientError | RateLimiter.RateLimiterError | Cause.TimeoutError,
): string =>
  HttpClientError.isHttpClientError(problem) && problem.reason._tag === "StatusCodeError"
    ? `HTTP ${problem.reason.response.status}, Ray ID ${problem.reason.response.headers["cf-ray"] ?? "none"}`
    : problem.message;

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

/** A firewall's block page: HTML where Jev answers JSON, even for its own errors. */
const isBlockPage = (response: HttpClientResponse.HttpClientResponse, body: string): boolean =>
  (response.headers["content-type"] ?? "").includes("text/html") ||
  body.trimStart().startsWith("<");

/**
 * A request that failed. A 400 saying the request is over Jev's context is a
 * `JevOverflow`, which skips the file. Any other answer outside 2xx refuses
 * the run with its status and what Jev said, since the status alone does not
 * say why, and a request that got no answer refuses with the cause.
 */
const failed = (
  problem: HttpClientError.HttpClientError | RateLimiter.RateLimiterError | Cause.TimeoutError,
) => {
  if (!HttpClientError.isHttpClientError(problem) || problem.reason._tag !== "StatusCodeError") {
    return Effect.fail(refused(`System One request failed: ${problem.message}`));
  }
  const { response } = problem.reason;
  return Effect.flatMap(
    Effect.orElseSucceed(response.text, () => "").pipe(
      Effect.tap((body) =>
        Effect.logDebug(
          `Jev answered HTTP ${response.status}, ${response.headers["content-type"] ?? "no content type"}, ${body.length} characters, Ray ID ${response.headers["cf-ray"] ?? "none"}`,
        ),
      ),
      Effect.tap((body) => Effect.logTrace(`Jev's answer: ${body.slice(0, 4000)}`)),
    ),
    (body): Effect.Effect<never, JevOverflow | JevBlocked | JevUnavailable> =>
      response.status === 400 && isOverflow(body)
        ? Effect.fail(JevOverflow.make())
        : response.status === 403 && isBlockPage(response, body)
          ? Effect.fail(JevBlocked.make({ ray: response.headers["cf-ray"] ?? "none given" }))
          : Effect.fail(refused(`Jev answered HTTP ${response.status}${detailOf(body)}`)),
  );
};

/**
 * Comparing rules has no file to skip, so a request over Jev's context, or one
 * the firewall blocks, refuses instead.
 */
const refuseOverflow = <A>(
  self: Effect.Effect<A, JevOverflow | JevBlocked | JevUnavailable>,
): Effect.Effect<A, JevUnavailable> =>
  self.pipe(
    Effect.catchTag("JevOverflow", () =>
      Effect.fail(refused("Comparing the rules took a request over Jev's context")),
    ),
    Effect.catchTag("JevBlocked", ({ ray }) =>
      Effect.fail(
        refused(
          `The firewall in front of Jev's API blocked comparing the rules (Cloudflare Ray ID ${ray})`,
        ),
      ),
    ),
  );

export const JevLive = Layer.effect(Jev)(
  Effect.gen(function* () {
    const config = yield* AdhereConfig;
    const credentials = yield* Credentials;
    const http = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
    // `--rpm`: one request per 60/rpm seconds, evenly spaced rather than in a
    // burst each minute. Before the retries, so a retry waits its turn too.
    type Failure = HttpClientError.HttpClientError | RateLimiter.RateLimiterError;
    const paced: HttpClient.HttpClient.With<Failure> =
      config.rpm === undefined
        ? // The same client, typed to fail the ways the throttled one can.
          HttpClient.transformResponse(
            http,
            (response): Effect.Effect<HttpClientResponse.HttpClientResponse, Failure> => response,
          )
        : http.pipe(
            HttpClient.withRateLimiter({
              limiter: yield* RateLimiter.RateLimiter,
              key: "jev",
              algorithm: "token-bucket",
              limit: 1,
              window: Duration.millis(60_000 / config.rpm),
            }),
          );
    const client = paced.pipe(
      HttpClient.transformResponse(Effect.timeout("30 seconds")),
      // Every failed attempt, including those retried, so a log shows what retrying hid.
      HttpClient.transformResponse(
        Effect.tapError((problem) => Effect.logDebug(`attempt failed: ${attemptFailure(problem)}`)),
      ),
      HttpClient.retryTransient({
        schedule: Schedule.exponential("500 millis"),
        times: 3,
      }),
    );

    /** One request. `kind` names the question for the log: judge, locate, blocks, and so on. */
    const ask = <A>(kind: string, body: Body, Answers: Schema.Codec<A, unknown, never, never>) =>
      Effect.gen(function* () {
        // Read here, not in the layer: a run with nothing pending needs no key.
        const apiKey = yield* credentials.apiKey.pipe(
          Effect.mapError((problem) => refused(problem.message)),
        );
        const request = yield* HttpClientRequest.bodyJson(
          HttpClientRequest.post(SYSTEM_ONE),
          body,
        ).pipe(Effect.orDie);
        const questions = Object.keys(body.questions).length;
        yield* Effect.logDebug(
          `${kind}: sending ${questions} ${questions === 1 ? "question" : "questions"}, about ${tokensOf(body)} tokens`,
        );
        const [elapsed, response] = yield* Effect.timed(
          client.execute(HttpClientRequest.bearerToken(request, apiKey)).pipe(Effect.catch(failed)),
        );
        yield* Effect.logDebug(
          `${kind}: HTTP ${response.status} in ${Math.round(Duration.toMillis(elapsed))} ms, Ray ID ${response.headers["cf-ray"] ?? "none"}`,
        );
        return yield* HttpClientResponse.schemaBodyJson(Answers)(response).pipe(
          Effect.mapError((problem) =>
            refused(`System One response did not decode: ${problem.message}`),
          ),
        );
      });

    /** Every answer to a body, over as many requests as Jev's context needs. */
    const answersTo = <A>(
      kind: string,
      body: Body,
      Answers: Schema.Codec<
        { readonly answers: Readonly<Record<string, A>> },
        unknown,
        never,
        never
      >,
    ) =>
      Effect.map(
        Effect.forEach(requestsOf(body), (request) => ask(kind, request, Answers)),
        (responses) =>
          responses.reduce<Record<string, A>>(
            (answers, response) => ({ ...answers, ...response.answers }),
            {},
          ),
      );

    /**
     * Every answer about a file's rules: a body for each group that
     * `requestGroups` makes of them, each with its rule's hook run right
     * before it goes out.
     */
    const answersAbout = <A>(
      kind: string,
      rules: Rules,
      bodyOf: (group: Rules) => Body & { readonly state: JevState },
      file: JudgedFile,
      Answers: Schema.Codec<
        { readonly answers: Readonly<Record<string, A>> },
        unknown,
        never,
        never
      >,
    ) =>
      Effect.map(
        Effect.forEach(requestGroups(rules), (group) =>
          Effect.flatMap(
            hooked(bodyOf(group), group, file, config.workspacePackages ?? {}),
            (body) => answersTo(kind, body, Answers),
          ),
        ),
        (groups) =>
          groups.reduce<Record<string, A>>((answers, some) => ({ ...answers, ...some }), {}),
      );

    const judge = Effect.fn("Jev.judge")(function* (
      lines: Lines,
      rules: Rules,
      sampled: ReadonlyArray<RuleId>,
      file: JudgedFile,
    ) {
      const answers = yield* answersAbout(
        "judge",
        rules,
        (group) => judgeBody(config.model, lines, group, sampled),
        file,
        NoulAnswers,
      );
      /** Each rule's answer, read from the question it rode under. */
      const answered = (ids: ReadonlyArray<RuleId>, keyOf: (id: RuleId) => string) =>
        Record.fromEntries(
          ids.flatMap((id) => {
            const answer = answers[keyOf(id)];
            return answer === undefined ? [] : [[id, answer.noul] as const];
          }),
        );
      // A matcher Jev left unanswered counts as a no.
      const scored = (
        kind: keyof MatcherScores,
        id: RuleId,
        matchers: ReadonlyArray<string> = [],
      ) => matchers.map((_, index) => answers[matcherKey(kind, id, index)]?.noul ?? 0);
      const matchers: Record<RuleId, MatcherScores> = Record.fromEntries(
        Object.entries(rules).flatMap(([id, rule]) =>
          rule.appliesTo === undefined && rule.excludeIf === undefined
            ? []
            : [
                [
                  id,
                  {
                    appliesTo: scored("appliesTo", id, rule.appliesTo),
                    excludeIf: scored("excludeIf", id, rule.excludeIf),
                  },
                ] as const,
              ],
        ),
      );
      return {
        probabilities: answered(Object.keys(rules), (id) => id),
        linter: answered(sampled, linterKey),
        ...(Record.isEmptyRecord(matchers) ? {} : { matchers }),
      } satisfies Judged;
    });

    const locate = Effect.fn("Jev.locate")(function* (
      lines: Lines,
      rules: Rules,
      file: JudgedFile,
    ) {
      const sections = sectionsOf(lines);
      const answers = yield* answersAbout(
        "locate",
        rules,
        (group) => locateBody(config.model, lines, group),
        file,
        LocateAnswers,
      );
      // A file of one section has every finding in it. An answer that names no section,
      // or none at all, which Jev should not give, leaves the rule unlocated; lines outside
      // the section leave it without lines.
      return Record.filterMap(rules, (_, id) => {
        const chosen = sections.length === 1 ? 1 : Number(answers[id]?.choice);
        const section = sections[chosen - 1];
        const sufficiency = answers[sufficiencyKey(id)]?.noul;
        if (section === undefined || sufficiency === undefined) return Result.failVoid;
        const [start, end] = (["start", "end"] as const).map((edge) =>
          Number(answers[edgeKey(edge, id, chosen)]?.choice),
        );
        const within = (line: number | undefined): line is number =>
          line !== undefined && section.first <= line && line <= section.last;
        return Result.succeed(
          within(start) && within(end)
            ? {
                section,
                sufficiency,
                lines: { first: Math.min(start, end), last: Math.max(start, end) },
              }
            : { section, sufficiency },
        );
      });
    });

    const conflicts = Effect.fn("Jev.conflicts")(function* (
      rules: ReadonlyArray<ComparedRule>,
      partners: ReadonlyArray<ReadonlyArray<number>>,
    ) {
      const answers = yield* answersTo(
        "conflicts",
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
            ask("contradicts", contradictBody(config.model, rules, pair), NoulAnswers).pipe(
              refuseOverflow,
            ),
            ({ answers }) => pairProbability(answers, pair),
          ),
        { concurrency: 8 },
      );
    });

    return Jev.of({ judge, locate, conflicts, contradicts });
  }),
).pipe(Layer.provide(RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory))));
