import { ConfigProvider, Effect, FileSystem, Layer, Path, Record, Redacted } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Credentials, CredentialsLive } from "../src/services/Credentials.ts";

describe("credentials", () => {
  const FILE = "/config/adhere/credentials.json";
  const SAVED = { [FILE]: '{"apiKey":"tsk_saved"}\n' };

  /** Files in a map, each with the mode it was created with, and each made directory's mode. */
  const memoryFiles = (seed: Readonly<Record<string, string>> = {}) => {
    const files = new Map<string, { readonly text: string; readonly mode?: number | undefined }>(
      Object.entries(seed).map(([path, text]) => [path, { text }]),
    );
    const directories = new Map<string, number | undefined>();
    const layer = FileSystem.layerNoop({
      exists: (path) => Effect.succeed(files.has(path)),
      readFileString: (path) => Effect.succeed(files.get(path)?.text ?? ""),
      writeFileString: (path, text, options) =>
        Effect.sync(() => {
          files.set(path, { text, mode: options?.mode });
        }),
      rename: (from, to) =>
        Effect.sync(() => {
          const file = files.get(from);
          files.delete(from);
          if (file !== undefined) files.set(to, file);
        }),
      remove: (path) =>
        Effect.sync(() => {
          files.delete(path);
        }),
      makeDirectory: (path, options) =>
        Effect.sync(() => {
          directories.set(path, options?.mode);
        }),
    });
    return { files, directories, layer };
  };

  /** The live service over `fs`, with `env` as the whole environment. */
  const run = <A, E>(
    env: Readonly<Record<string, string>>,
    fs: Layer.Layer<FileSystem.FileSystem>,
    program: Effect.Effect<A, E, Credentials>,
  ) =>
    Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.merge(
            CredentialsLive.pipe(Layer.provide(Layer.merge(fs, Path.layer))),
            ConfigProvider.layer(ConfigProvider.fromEnv({ env })),
          ),
        ),
      ),
    );

  const apiKey = Effect.gen(function* () {
    return Redacted.value(yield* (yield* Credentials).key("typesafe"));
  });

  it("saves a key under XDG_CONFIG_HOME, readable only by the user, and reads it back", async () => {
    const memory = memoryFiles();
    const saved = Effect.gen(function* () {
      yield* (yield* Credentials).save("typesafe", Redacted.make("tsk_saved"));
      return yield* apiKey;
    });
    expect(await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, saved)).toBe("tsk_saved");
    expect(Object.fromEntries(memory.files)).toEqual({
      [FILE]: { text: '{"apiKey":"tsk_saved"}\n', mode: 0o600 },
    });
    expect(memory.directories.get("/config/adhere")).toBe(0o700);
  });

  it("keeps the key under ~/.config without XDG_CONFIG_HOME", async () => {
    const file = Effect.gen(function* () {
      return yield* (yield* Credentials).file;
    });
    expect(await run({ HOME: "/home/me" }, memoryFiles().layer, file)).toBe(
      "/home/me/.config/adhere/credentials.json",
    );
  });

  it("prefers TYPESAFE_API_KEY to the saved key, and uses the saved key without it", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const fromEnvironment = { ...env, TYPESAFE_API_KEY: "tsk_env" };
    expect(await run(fromEnvironment, memoryFiles(SAVED).layer, apiKey)).toBe("tsk_env");
    expect(await run(env, memoryFiles(SAVED).layer, apiKey)).toBe("tsk_saved");
  });

  it("refuses without a key, naming adhere login, and refuses a file that holds none", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const missing = await run(env, memoryFiles().layer, Effect.flip(apiKey));
    expect(missing.message).toBe(
      "No TypeSafe AI API key. Run `adhere login` to save one, or set TYPESAFE_API_KEY.",
    );
    const broken = await run(env, memoryFiles({ [FILE]: "{}" }).layer, Effect.flip(apiKey));
    expect(broken.message).toBe(
      `${FILE} holds no API key. Run \`adhere login\` to save one again.`,
    );
  });

  it("refuses a file that does not read as keys, and writes nothing over it", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const text = '{"apiKey":"tsk_saved",';
    const memory = memoryFiles({ [FILE]: text });
    const message = `${FILE} does not hold keys as \`adhere login\` saves them. Fix it, or delete it and run \`adhere login\` again.`;
    expect((await run(env, memory.layer, Effect.flip(apiKey))).message).toBe(message);
    const writes = Effect.gen(function* () {
      const credentials = yield* Credentials;
      return [
        yield* Effect.flip(credentials.save("openai", Redacted.make("sk-new"))),
        yield* Effect.flip(credentials.remove("typesafe")),
      ];
    });
    const refused = await run(env, memory.layer, writes);
    expect(refused.map((problem) => problem.message)).toEqual([message, message]);
    expect(memory.files.get(FILE)?.text).toBe(text);
  });

  it("refuses to save a key with a space, and writes nothing", async () => {
    const memory = memoryFiles();
    const save = Effect.gen(function* () {
      yield* (yield* Credentials).save("typesafe", Redacted.make("tsk one"));
    });
    const refused = await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, Effect.flip(save));
    expect(refused.message).toBe("An API key is one word, with no spaces or line breaks.");
    expect(memory.files.size).toBe(0);
  });

  it("deletes the saved key, and says when there was none", async () => {
    const memory = memoryFiles(SAVED);
    const removed = Effect.gen(function* () {
      const credentials = yield* Credentials;
      return [yield* credentials.remove("typesafe"), yield* credentials.remove("typesafe")];
    });
    expect(await run({ XDG_CONFIG_HOME: "/config" }, memory.layer, removed)).toEqual([true, false]);
    expect(memory.files.size).toBe(0);
  });

  it("keeps the OpenAI key beside TypeSafe AI's, prefers OPENAI_API_KEY, and deletes only the one asked", async () => {
    const env = { XDG_CONFIG_HOME: "/config" };
    const memory = memoryFiles(SAVED);
    const openai = Effect.gen(function* () {
      const credentials = yield* Credentials;
      yield* credentials.save("openai", Redacted.make("sk-saved"));
      return Redacted.value(yield* credentials.key("openai"));
    });
    expect(await run(env, memory.layer, openai)).toBe("sk-saved");
    expect(memory.files.get(FILE)?.text).toBe('{"apiKey":"tsk_saved","openaiApiKey":"sk-saved"}\n');
    const openaiKey = Effect.gen(function* () {
      return Redacted.value(yield* (yield* Credentials).key("openai"));
    });
    expect(await run({ ...env, OPENAI_API_KEY: "sk-env" }, memory.layer, openaiKey)).toBe("sk-env");
    const removed = Effect.gen(function* () {
      return yield* (yield* Credentials).remove("openai");
    });
    expect(await run(env, memory.layer, removed)).toBe(true);
    expect(memory.files.get(FILE)?.text).toBe('{"apiKey":"tsk_saved"}\n');
    expect(await run(env, memory.layer, apiKey)).toBe("tsk_saved");
    const none = await run(env, memory.layer, Effect.flip(openaiKey));
    expect(none.message).toBe(
      `${FILE} holds no OpenAI API key. Run \`adhere login --openai\` to save one.`,
    );
  });
});
