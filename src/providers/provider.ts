/**
 * What adhere asks a decision model, and what it takes back. A provider puts
 * adhere's questions to its model in whatever form the model takes; adhere
 * builds the questions, splits them into requests, paces and retries them,
 * and reads the answers. Jev's provider is the default.
 */
import { Schema } from "effect";

/**
 * What the questions ask about: the file's code by section under `code`,
 * beside what adhere read for it; comparing rules, the rules under `rules`.
 */
export type State = Readonly<Record<string, unknown>>;

/**
 * One of adhere's questions, as adhere phrases it. `question` names what it
 * asks about in backticks: keys of the state, such as `code`, and of
 * `fields`, such as `rule`, `must`, `never`, or `matcher`, which hold the
 * rule it asks about and its examples. A `noul` asks whether something holds,
 * `yes` and `no` saying what each answer means when adhere says. A `choice`
 * asks for the key of one of its `options`, each beside what it means when
 * its key does not say; it can have a single option.
 */
export type Question =
  | {
      readonly id: string;
      readonly type: "noul";
      readonly question: string;
      readonly fields: Readonly<Record<string, unknown>>;
      readonly yes?: string;
      readonly no?: string;
    }
  | {
      readonly id: string;
      readonly type: "choice";
      readonly question: string;
      readonly fields: Readonly<Record<string, unknown>>;
      readonly options: Readonly<Record<string, string | null>>;
    };

/**
 * A provider's answers by question id: a `noul`'s probability that it holds,
 * from 0 to 1, or the key of a `choice`'s option. An id left out goes
 * unanswered: its rule is asked again on the next run, or its finding not
 * located. `inputTokens` and `model`, what the model read and which version
 * answered, are for the record, such as the eval's costs.
 */
export const Answered = Schema.Struct({
  answers: Schema.Record(Schema.String, Schema.Union([Schema.Finite, Schema.String])),
  inputTokens: Schema.optional(Schema.Finite),
  model: Schema.optional(Schema.String),
});
export interface Answered extends Schema.Schema.Type<typeof Answered> {}

/** The keys `adhere login` saves: TypeSafe AI's, for Jev, and with `--openai`, OpenAI's. */
export const SAVED_KEYS = ["typesafe", "openai"] as const;
export type SavedKey = (typeof SAVED_KEYS)[number];

/**
 * What adhere passes each call of `ask`: the key, when the provider names a
 * `savedKey`, and the signal that aborts the call when adhere gives up on it.
 */
export interface AskOptions {
  readonly apiKey?: string;
  readonly signal: AbortSignal;
}

/**
 * Where adhere's questions go. `ask` answers one request's questions. Its
 * rejection stops the run, as Jev being down does, but for three:
 * `ContextOverflow` skips the file, `RequestBlocked` reports it blocked, and
 * `RequestFailed` is tried again when its status says it may pass. adhere
 * paces each call with `--rpm`, and gives up on one after 30 seconds. `model`
 * names what it asks: adhere's cache keeps answers by it, so a new model is
 * asked again. A provider that names a `savedKey` gets that key as `apiKey`:
 * its environment variable when set, otherwise the one `adhere login` saved.
 * adhere calls `ask` on the provider, so a class can implement it.
 */
export interface Provider {
  readonly model: string;
  readonly savedKey?: SavedKey;
  ask(state: State, questions: ReadonlyArray<Question>, options: AskOptions): Promise<Answered>;
}

/**
 * Splits off the choices of a single option, which some APIs refuse to be
 * asked: each is answered by its option, and the rest are left to ask.
 */
export const withoutSingleChoices = (questions: ReadonlyArray<Question>) => {
  const answers: Record<string, number | string> = {};
  const asked = questions.filter((question) => {
    const [only, ...others] = question.type === "choice" ? Object.keys(question.options) : [];
    if (only === undefined || others.length > 0) return true;
    answers[question.id] = only;
    return false;
  });
  return { answers, asked };
};

/** Thrown from `ask` when the request is longer than the model takes: adhere skips the file. */
export class ContextOverflow extends Error {
  readonly _tag = "ContextOverflow";
}

/**
 * Thrown from `ask` when something in front of the model refused the request
 * for what it holds: adhere reports the file blocked, with `reference` to look
 * the block up by, and goes on.
 */
export class RequestBlocked extends Error {
  readonly _tag = "RequestBlocked";
  constructor(readonly reference: string) {
    super(`blocked, reference ${reference}`);
  }
}

/**
 * Thrown from `ask` when the request failed: `status` is the HTTP status it
 * got, or 0 when it got no answer. adhere tries one with no answer, a 408, a
 * 429, or a 5xx again, up to three times, after half a second, one, and two;
 * any other stops the run with its message.
 */
export class RequestFailed extends Error {
  readonly _tag = "RequestFailed";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
