import type { SavedKey } from "#providers/provider.ts";
import { Config, Context, Effect, FileSystem, Layer, Option, Path, Redacted, Schema } from "effect";

/** No key to send, or the saved key cannot be read or written. */
export class CredentialsUnavailable extends Schema.TaggedError<CredentialsUnavailable>()(
  "CredentialsUnavailable",
  { message: Schema.String },
) {}

/** An API key is one word: a space or a second line is a bad paste. */
const ApiKey = Schema.String.pipe(Schema.check(Schema.isPattern(/^\S+$/)));

/** What `adhere login` saves: TypeSafe AI's key, and with `--openai`, OpenAI's. */
class SavedCredentials extends Schema.Class<SavedCredentials>("SavedCredentials")({
  apiKey: Schema.optionalKey(Schema.RedactedFromValue(ApiKey)),
  openaiApiKey: Schema.optionalKey(Schema.RedactedFromValue(ApiKey)),
}) {}

const SavedCredentialsJson = Schema.fromJsonString(SavedCredentials);

/** The saved keys, by the name a provider asks for them by. */
type Saved = Partial<Record<SavedKey, Redacted.Redacted<string>>>;

/**
 * Each key: the variable that wins over the saved one, how `adhere login`
 * asks for it and names it, and what a run says when there is none, or when
 * the file holds none.
 */
export const KEYS = {
  typesafe: {
    variable: "TYPESAFE_API_KEY",
    label: "TypeSafe AI API key",
    said: "API key",
    missing: "No TypeSafe AI API key. Run `adhere login` to save one, or set TYPESAFE_API_KEY.",
    absent: (file: string) => `${file} holds no API key. Run \`adhere login\` to save one again.`,
  },
  openai: {
    variable: "OPENAI_API_KEY",
    label: "OpenAI API key",
    said: "OpenAI API key",
    missing: "No OpenAI API key. Run `adhere login --openai` to save one, or set OPENAI_API_KEY.",
    absent: (file: string) =>
      `${file} holds no OpenAI API key. Run \`adhere login --openai\` to save one.`,
  },
} as const satisfies Record<SavedKey, unknown>;

/** The API keys providers ask with: where a request gets one, and where `adhere login` keeps them. */
export class Credentials extends Context.Service<
  Credentials,
  {
    /** `name`'s key: its variable, such as `TYPESAFE_API_KEY`, when set, otherwise the one `adhere login` saved. */
    readonly key: (
      name: SavedKey,
    ) => Effect.Effect<Redacted.Redacted<string>, CredentialsUnavailable>;
    /** Where the saved keys live, whether or not there are any. */
    readonly file: Effect.Effect<string, CredentialsUnavailable>;
    /** Saves `name`'s key for later runs, beside the other, readable only by the user. */
    readonly save: (
      name: SavedKey,
      apiKey: Redacted.Redacted<string>,
    ) => Effect.Effect<void, CredentialsUnavailable>;
    /** Deletes `name`'s saved key, and the file with no key left in it. False when there was none. */
    readonly remove: (name: SavedKey) => Effect.Effect<boolean, CredentialsUnavailable>;
  }
>()("@drkmttr/adhere/services/Credentials") {}

const refused = (message: string) => CredentialsUnavailable.make({ message });

/**
 * The keys live in `$XDG_CONFIG_HOME/adhere/credentials.json`, or under
 * `~/.config` without it, on every platform. The file is written whole to a
 * temporary file created readable only by the user, then renamed over the
 * old one, so no reader sees half a key or a key with looser permissions.
 */
export const CredentialsLive = Layer.effect(Credentials)(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const file = Config.NonEmptyString("XDG_CONFIG_HOME").pipe(
      Config.orElse(() =>
        Config.NonEmptyString("HOME").pipe(
          Config.orElse(() => Config.NonEmptyString("USERPROFILE")),
          Config.map((home) => path.join(home, ".config")),
        ),
      ),
      Config.map((configHome) => path.join(configHome, "adhere", "credentials.json")),
      Effect.mapError(() =>
        refused("No home directory to keep the API key in: set HOME or XDG_CONFIG_HOME."),
      ),
    );

    /**
     * The keys the file holds, or nothing when there is no file. A file that
     * does not read as keys refuses, so nothing writes over what it holds.
     */
    const savedIn = Effect.fn("Credentials.savedIn")(function* (target: string) {
      const text = yield* Effect.gen(function* () {
        return (yield* fs.exists(target)) ? yield* fs.readFileString(target) : undefined;
      }).pipe(Effect.mapError((problem) => refused(`Cannot read ${target}: ${problem.message}`)));
      if (text === undefined) return undefined;
      const { apiKey, openaiApiKey } = yield* Schema.decodeUnknownEffect(SavedCredentialsJson)(
        text,
      ).pipe(
        Effect.mapError(() =>
          refused(
            `${target} does not hold keys as \`adhere login\` saves them. Fix it, or delete it and run \`adhere login\` again.`,
          ),
        ),
      );
      return {
        ...(apiKey === undefined ? {} : { typesafe: apiKey }),
        ...(openaiApiKey === undefined ? {} : { openai: openaiApiKey }),
      } satisfies Saved;
    });

    /** Writes the keys whole, as the layer's comment says; the file goes when none is left. */
    const write = Effect.fn("Credentials.write")(function* (target: string, saved: Saved) {
      const temporary = `${target}.tmp`;
      const json = yield* Schema.encodeEffect(SavedCredentialsJson)(
        new SavedCredentials({
          ...(saved.typesafe === undefined ? {} : { apiKey: saved.typesafe }),
          ...(saved.openai === undefined ? {} : { openaiApiKey: saved.openai }),
        }),
      ).pipe(Effect.orDie);
      yield* Effect.gen(function* () {
        if (saved.typesafe === undefined && saved.openai === undefined) {
          return yield* fs.remove(target, { force: true });
        }
        yield* fs.makeDirectory(path.dirname(target), { recursive: true, mode: 0o700 });
        // A mode applies only when a file is created: never reuse a leftover.
        yield* fs.remove(temporary, { force: true });
        yield* fs.writeFileString(temporary, `${json}\n`, { mode: 0o600 });
        yield* fs.rename(temporary, target);
      }).pipe(Effect.mapError((problem) => refused(`Cannot save ${target}: ${problem.message}`)));
    });

    // Read when a request needs the key, not before: a cached run needs none.
    const key = Effect.fn("Credentials.key")(function* (name: SavedKey) {
      const { variable, missing, absent } = KEYS[name];
      const fromEnvironment = yield* Config.option(Config.Redacted(variable)).pipe(
        Effect.mapError((problem) => refused(`Cannot read ${variable}: ${problem.message}`)),
      );
      if (Option.isSome(fromEnvironment)) return fromEnvironment.value;
      const target = yield* file;
      const saved = yield* savedIn(target);
      if (saved === undefined) return yield* refused(missing);
      return saved[name] ?? (yield* refused(absent(target)));
    });

    const save = Effect.fn("Credentials.save")(function* (
      name: SavedKey,
      apiKey: Redacted.Redacted<string>,
    ) {
      yield* Schema.decodeUnknownEffect(ApiKey)(Redacted.value(apiKey)).pipe(
        Effect.mapError(() => refused("An API key is one word, with no spaces or line breaks.")),
      );
      const target = yield* file;
      yield* write(target, { ...(yield* savedIn(target)), [name]: apiKey });
    });

    const remove = Effect.fn("Credentials.remove")(function* (name: SavedKey) {
      const target = yield* file;
      const rest: Saved = { ...(yield* savedIn(target)) };
      if (rest[name] === undefined) return false;
      delete rest[name];
      yield* write(target, rest);
      return true;
    });

    return Credentials.of({ key, file, save, remove });
  }),
);
