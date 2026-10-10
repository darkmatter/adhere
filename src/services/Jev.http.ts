import type { AppendState, JevState, JudgedFile, RuleId } from "#config.ts";
import { sectionsOf } from "#excerpt.ts";
import { jev } from "#providers/jev.ts";
import {
  Answered,
  type Provider,
  type Question,
  RequestFailed,
  type State,
} from "#providers/provider.ts";
import { questionsOf, type SystemOneQuestion } from "#providers/systemOne.ts";
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
  Duration,
  Effect,
  Layer,
  Predicate,
  Record,
  Redacted,
  Result,
  Schedule,
  Schema,
} from "effect";
import { FetchHttpClient } from "effect/http";
import { RateLimiter } from "effect/persistence";

/** A provider's answers to `noul`s, which the eval's harness reads too, to `choice`s, and to a locate request's both. */
export const NoulAnswers = Schema.Struct({
  ...Answered.fields,
  answers: Schema.Record(Schema.String, Schema.Finite),
});
const ChoiceAnswers = Schema.Struct({
  ...Answered.fields,
  answers: Schema.Record(Schema.String, Schema.String),
});
const LocateAnswers = Answered;

const refused = (message: string) => JevUnavailable.make({ message });

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

/** Bun's API, for a rule's hook. Read off `globalThis`, as presets.ts reads it: Vitest runs this on Node. */
const bun = (globalThis as { readonly Bun?: unknown }).Bun as Parameters<AppendState>[2];

/**
 * A body as it goes out: when its rule's `reads` names the workspace's
 * packages, with them in its state, and when it has `appendState`, with what
 * the hook returns spread over that. A hook that fails refuses the run.
 */
const hooked = (
  sent: Body<SystemOneQuestion> & { readonly state: JevState },
  group: Rules,
  file: JudgedFile,
  workspacePackages: Readonly<Record<string, string>>,
): Effect.Effect<Body<SystemOneQuestion>, JevUnavailable> => {
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
    catch: (cause) => refused(`the appendState of ${id} failed: ${messageOf(cause)}`),
  });
};

/**
 * A provider's rejection, as the run takes it: a `ContextOverflow` skips the
 * file, a `RequestBlocked` reports it blocked, and anything else refuses the
 * run with what the provider said. Read by tag, not class, so a provider
 * built against another copy of adhere is read the same.
 */
const rejected = (cause: unknown): JevOverflow | JevBlocked | JevUnavailable => {
  if (Predicate.isTagged(cause, "ContextOverflow")) return JevOverflow.make();
  if (Predicate.isTagged(cause, "RequestBlocked") && Predicate.hasProperty(cause, "reference")) {
    return JevBlocked.make({ ray: String(cause.reference) });
  }
  return refused(messageOf(cause));
};

/** Whether a failed attempt is worth another: a `RequestFailed`, read by tag, with no answer, a 408, a 429, or a 5xx. */
const isTransient = (cause: unknown): boolean => {
  if (!Predicate.isTagged(cause, "RequestFailed") || !Predicate.hasProperty(cause, "status")) {
    return false;
  }
  const { status } = cause;
  return (
    status === 0 ||
    status === 408 ||
    status === 429 ||
    (Predicate.isNumber(status) && status >= 500)
  );
};

/**
 * One request to `provider`, as adhere asks every provider: each attempt
 * after `pace`, given 30 seconds before its signal aborts it, and logged when
 * it fails. One that failed transiently is tried again up to three times,
 * after half a second, one, and two. What it answers decodes as `Answers`.
 * The eval's harness asks its providers this way too.
 */
export const askProvider = <A>(
  provider: Provider,
  state: State,
  questions: ReadonlyArray<Question>,
  Answers: Schema.Codec<A, unknown, never, never>,
  apiKey?: string,
  pace: Effect.Effect<unknown, unknown> = Effect.void,
): Effect.Effect<A, JevOverflow | JevBlocked | JevUnavailable> =>
  pace.pipe(
    Effect.andThen(
      Effect.tryPromise({
        try: (signal) =>
          provider.ask(state, questions, apiKey === undefined ? { signal } : { apiKey, signal }),
        catch: (cause) => cause,
      }).pipe(
        Effect.timeoutOrElse({
          duration: "30 seconds",
          orElse: () =>
            Effect.fail(new RequestFailed(`${provider.model} did not answer in 30 seconds`, 0)),
        }),
      ),
    ),
    Effect.tapError((cause) => Effect.logDebug(`attempt failed: ${messageOf(cause)}`)),
    Effect.retry({ while: isTransient, times: 3, schedule: Schedule.exponential("500 millis") }),
    Effect.mapError(rejected),
    Effect.flatMap((answered) =>
      Schema.decodeUnknownEffect(Answers)(answered).pipe(
        Effect.mapError((problem) =>
          refused(`${provider.model}'s answers did not decode: ${problem.message}`),
        ),
      ),
    ),
  );

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
    const fetch = yield* FetchHttpClient.Fetch;
    const limiter = yield* RateLimiter.RateLimiter;

    const provider: Provider = config.provider ?? jev({ model: config.model, fetch });
    // The key it asks with, when it names one `adhere login` saves. Read when
    // a request needs it, not in the layer: a run with nothing pending needs none.
    const apiKey: Effect.Effect<string | undefined, JevUnavailable> =
      provider.savedKey === undefined
        ? Effect.succeed(undefined)
        : yield* Effect.cached(
            credentials.key(provider.savedKey).pipe(
              Effect.map(Redacted.value),
              Effect.mapError((problem) => refused(problem.message)),
            ),
          );

    // `--rpm`: one attempt per 60/rpm seconds, evenly spaced rather than in a
    // burst each minute, so a retry waits its turn too.
    const pace =
      config.rpm === undefined
        ? Effect.void
        : RateLimiter.sleep(limiter, {
            key: "provider",
            algorithm: "token-bucket",
            limit: 1,
            window: Duration.millis(60_000 / config.rpm),
          });

    /** One request. `kind` names the question for the log: judge, locate, conflicts, and so on. */
    const ask = <A>(
      kind: string,
      body: Body<SystemOneQuestion>,
      Answers: Schema.Codec<A, unknown, never, never>,
    ) =>
      Effect.gen(function* () {
        const key = yield* apiKey;
        const questions = Object.keys(body.questions).length;
        yield* Effect.logDebug(
          `${kind}: asking ${provider.model} ${questions} ${questions === 1 ? "question" : "questions"}, about ${tokensOf(body)} tokens`,
        );
        const [elapsed, answered] = yield* Effect.timed(
          askProvider(provider, body.state, questionsOf(body.questions), Answers, key, pace),
        );
        yield* Effect.logDebug(
          `${kind}: ${provider.model} answered in ${Math.round(Duration.toMillis(elapsed))} ms`,
        );
        return answered;
      });

    /** Every answer to a body, over as many requests as Jev's context needs. */
    const answersTo = <A>(
      kind: string,
      body: Body<SystemOneQuestion>,
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
      bodyOf: (group: Rules) => Body<SystemOneQuestion> & { readonly state: JevState },
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
      const all = (scores: ReadonlyArray<number | undefined>): scores is ReadonlyArray<number> =>
        scores.every((score) => score !== undefined);
      // A rule is answered when its question and each of its matchers' are: a
      // matcher left unanswered, as a refusal leaves one, leaves its rule
      // unanswered too, to ask again on the next run rather than cache as a no.
      const judged = Object.entries(rules).flatMap(([id, rule]) => {
        const scored = (kind: keyof MatcherScores) =>
          (rule[kind] ?? []).map((_, index) => answers[matcherKey(kind, id, index)]);
        const probability = answers[id];
        const appliesTo = scored("appliesTo");
        const excludeIf = scored("excludeIf");
        return probability === undefined || !all(appliesTo) || !all(excludeIf)
          ? []
          : [{ id, rule, probability, appliesTo, excludeIf }];
      });
      const matchers: Record<RuleId, MatcherScores> = Record.fromEntries(
        judged.flatMap(({ id, rule, appliesTo, excludeIf }) =>
          rule.appliesTo === undefined && rule.excludeIf === undefined
            ? []
            : [[id, { appliesTo, excludeIf }] as const],
        ),
      );
      return {
        probabilities: Record.fromEntries(
          judged.map(({ id, probability }) => [id, probability] as const),
        ),
        linter: Record.fromEntries(
          sampled.flatMap((id) => {
            const answer = answers[linterKey(id)];
            return answer === undefined ? [] : [[id, answer] as const];
          }),
        ),
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
      // or none at all, which a model should not give, leaves the rule unlocated; lines
      // outside the section leave it without lines.
      return Record.filterMap(rules, (_, id) => {
        const chosen = sections.length === 1 ? 1 : Number(answers[id]);
        const section = sections[chosen - 1];
        const sufficiency = answers[sufficiencyKey(id)];
        if (section === undefined || typeof sufficiency !== "number") return Result.failVoid;
        const [start, end] = (["start", "end"] as const).map((edge) =>
          Number(answers[edgeKey(edge, id, chosen)]),
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
