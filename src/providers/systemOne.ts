/**
 * System One, the format Jev takes and Clef follows, and adhere's questions
 * in it. adhere builds its questions this way, as its cache and Jev have
 * always read them; a provider gets them split into their parts by
 * `questionsOf`, and Jev's and Clef's put them back with `requestOf`.
 */
import type { Answered, Question, State } from "#providers/provider.ts";
import { Schema } from "effect";

/** A question's instructions: the question alone, or beside the fields it names. */
type Instructions = string | (Readonly<Record<string, unknown>> & { readonly question: string });

/** A question as System One takes it: a `noul` with what yes and no mean, or a `choice` among its criteria's keys. */
export type SystemOneQuestion =
  | {
      readonly type: "noul";
      readonly instructions: Instructions;
      readonly criteria?: { readonly true: string; readonly false: string };
    }
  | {
      readonly type: "choice";
      readonly instructions: Instructions;
      readonly criteria: Readonly<Record<string, string | null>>;
    };

/** A request as System One takes it: questions by id about `state`, its questions typed as `Q`. */
export interface SystemOneRequest<Q = SystemOneQuestion> {
  readonly model: string;
  readonly state: State;
  readonly questions: Readonly<Record<string, Q>>;
}

/**
 * What System One answers: by id, a `noul`'s probability or a `choice`'s
 * key, with the model that answered and the tokens it read.
 */
export const SystemOneAnswered = Schema.Struct({
  answers: Schema.Record(
    Schema.String,
    Schema.Struct({
      noul: Schema.optionalKey(Schema.Finite),
      choice: Schema.optionalKey(Schema.String),
    }),
  ),
  model: Schema.optionalKey(Schema.String),
  usage: Schema.optionalKey(Schema.Struct({ input_tokens: Schema.Finite })),
});

/** Each question of a request split into what it asks, the fields it names, and what its answers mean. */
export const questionsOf = (
  questions: Readonly<Record<string, SystemOneQuestion>>,
): ReadonlyArray<Question> =>
  Object.entries(questions).map(([id, asked]) => {
    const { question, ...fields } =
      typeof asked.instructions === "string"
        ? { question: asked.instructions }
        : asked.instructions;
    if (asked.type === "choice")
      return { id, type: "choice", question, fields, options: asked.criteria };
    return asked.criteria === undefined
      ? { id, type: "noul", question, fields }
      : { id, type: "noul", question, fields, yes: asked.criteria.true, no: asked.criteria.false };
  });

/** A question as System One asks it, as adhere built it: a question with no fields is its instructions alone. */
export const systemOneQuestionOf = (asked: Question): SystemOneQuestion => {
  const instructions =
    Object.keys(asked.fields).length === 0
      ? asked.question
      : { question: asked.question, ...asked.fields };
  if (asked.type === "choice") return { type: "choice", instructions, criteria: asked.options };
  return asked.yes === undefined || asked.no === undefined
    ? { type: "noul", instructions }
    : { type: "noul", instructions, criteria: { true: asked.yes, false: asked.no } };
};

/** A request as System One takes it, each question by its id. */
export const requestOf = (
  model: string,
  state: State,
  questions: ReadonlyArray<Question>,
): SystemOneRequest => ({
  model,
  state,
  questions: Object.fromEntries(questions.map((asked) => [asked.id, systemOneQuestionOf(asked)])),
});

/** System One's answers as a provider gives them: each a probability or a key. One with neither is left out. */
export const answersOf = (answers: typeof SystemOneAnswered.Type.answers): Answered["answers"] =>
  Object.fromEntries(
    Object.entries(answers).flatMap(
      ([id, { noul, choice }]): ReadonlyArray<readonly [string, number | string]> =>
        noul !== undefined ? [[id, noul]] : choice !== undefined ? [[id, choice]] : [],
    ),
  );
