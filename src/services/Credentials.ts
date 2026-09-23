import { Config, Context, Effect, FileSystem, Layer, Option, Path, Redacted, Schema } from "effect";

/** No key to send, or the saved key cannot be read or written. */
export class CredentialsUnavailable extends Schema.TaggedError<CredentialsUnavailable>()(
  "CredentialsUnavailable",
  { message: Schema.String },
) {}

/** A TypeSafe AI API key is one word: a space or a second line is a bad paste. */
const ApiKey = Schema.String.pipe(Schema.check(Schema.isPattern(/^\S+$/)));

/** What `adhere login` saves. */
class SavedCredentials extends Schema.Class<SavedCredentials>("SavedCredentials")({
  apiKey: Schema.RedactedFromValue(ApiKey),
}) {}

const SavedCredentialsJson = Schema.fromJsonString(SavedCredentials);

/** The TypeSafe AI API key: where a request gets it, and where `adhere login` keeps it. */
export class Credentials extends Context.Service<
  Credentials,
  {
    /** `TYPESAFE_API_KEY` when it is set, otherwise the key `adhere login` saved. */
    readonly apiKey: Effect.Effect<Redacted.Redacted<string>, CredentialsUnavailable>;
    /** Where the saved key lives, whether or not there is one. */
    readonly file: Effect.Effect<string, CredentialsUnavailable>;
    /** Saves a key for later runs, readable only by the user. */
    readonly save: (
      apiKey: Redacted.Redacted<string>,
    ) => Effect.Effect<void, CredentialsUnavailable>;
    /** Deletes the saved key. False when there was none. */
    readonly remove: Effect.Effect<boolean, CredentialsUnavailable>;
  }
>()("@drkmttr/adhere/services/Credentials") {}

const refused = (message: string) => CredentialsUnavailable.make({ message });

/**
 * The key lives in `$XDG_CONFIG_HOME/adhere/credentials.json`, or under
 * `~/.config` without it, on every platform. The file is written whole to a
 * temporary file created readable only by the user, then renamed over the
 * old one, so no reader sees half a key or a key with looser permissions.
 */
export const CredentialsLive = Layer.effect(Credentials)(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const file = Config.nonEmptyString("XDG_CONFIG_HOME").pipe(
      Config.orElse(() =>
        Config.nonEmptyString("HOME").pipe(
          Config.orElse(() => Config.nonEmptyString("USERPROFILE")),
          Config.map((home) => path.join(home, ".config")),
        ),
      ),
      Config.map((configHome) => path.join(configHome, "adhere", "credentials.json")),
      Effect.mapError(() =>
        refused("No home directory to keep the API key in: set HOME or XDG_CONFIG_HOME."),
      ),
    );

    const exists = (target: string) =>
      fs
        .exists(target)
        .pipe(Effect.mapError((problem) => refused(`Cannot read ${target}: ${problem.message}`)));

    const readSaved = Effect.fn("Credentials.readSaved")(function* (target: string) {
      const text = yield* fs
        .readFileString(target)
        .pipe(Effect.mapError((problem) => refused(`Cannot read ${target}: ${problem.message}`)));
      const saved = yield* Schema.decodeUnknownEffect(SavedCredentialsJson)(text).pipe(
        Effect.mapError(() =>
          refused(`${target} holds no API key. Run \`adhere login\` to save one again.`),
        ),
      );
      return saved.apiKey;
    });

    // Read when a request needs the key, not before: a cached run needs none.
    const apiKey = Effect.fn("Credentials.apiKey")(function* () {
      const fromEnvironment = yield* Config.option(Config.redacted("TYPESAFE_API_KEY")).pipe(
        Effect.mapError((problem) => refused(`Cannot read TYPESAFE_API_KEY: ${problem.message}`)),
      );
      if (Option.isSome(fromEnvironment)) return fromEnvironment.value;
      const target = yield* file;
      if (!(yield* exists(target))) {
        return yield* refused(
          "No TypeSafe AI API key. Run `adhere login` to save one, or set TYPESAFE_API_KEY.",
        );
      }
      return yield* readSaved(target);
    });

    const save = Effect.fn("Credentials.save")(function* (key: Redacted.Redacted<string>) {
      const saved = yield* Schema.decodeUnknownEffect(SavedCredentials)({
        apiKey: Redacted.value(key),
      }).pipe(
        Effect.mapError(() => refused("An API key is one word, with no spaces or line breaks.")),
      );
      const json = yield* Schema.encodeEffect(SavedCredentialsJson)(saved).pipe(Effect.orDie);
      const target = yield* file;
      const temporary = `${target}.tmp`;
      yield* Effect.gen(function* () {
        yield* fs.makeDirectory(path.dirname(target), { recursive: true, mode: 0o700 });
        // A mode applies only when a file is created: never reuse a leftover.
        yield* fs.remove(temporary, { force: true });
        yield* fs.writeFileString(temporary, `${json}\n`, { mode: 0o600 });
        yield* fs.rename(temporary, target);
      }).pipe(Effect.mapError((problem) => refused(`Cannot save ${target}: ${problem.message}`)));
    });

    const remove = Effect.fn("Credentials.remove")(function* () {
      const target = yield* file;
      if (!(yield* exists(target))) return false;
      yield* fs
        .remove(target)
        .pipe(Effect.mapError((problem) => refused(`Cannot delete ${target}: ${problem.message}`)));
      return true;
    });

    return Credentials.of({ apiKey: apiKey(), file, save, remove: remove() });
  }),
);
