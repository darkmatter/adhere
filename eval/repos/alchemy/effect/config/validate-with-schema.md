# effect/config/validate-with-schema

A config value with constraints must be validated as it is read, with Config.schema or Config.mapOrFail, never checked by hand after reading.

2 findings, from 0.80 down to 0.73. Each showed this hint:

```ts
const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
);
const Environment = Schema.Literals(["development", "staging", "production"]);

const program = Effect.gen(function* () {
  const port = yield* Config.schema(Port, "PORT");
  const env = yield* Config.schema(Environment, "ENV");
  const timeoutMs = yield* Config.int("TIMEOUT_MS").pipe(
    Config.mapOrFail((ms) =>
      ms > 0 && ms <= 60_000
        ? Effect.succeed(ms)
        : Effect.fail(
            new Config.ConfigError(
              new ConfigProvider.SourceError({ message: "TIMEOUT_MS must be 1 to 60000" }),
            ),
          ),
    ),
  );

  return { port, env, timeoutMs };
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.80 packages/alchemy/src/Cli/commands/flags.ts:72:5
  60 │ export const resolveStage = Effect.fn(function* (
  61 │   kind: "live" | "dev",
  62 │   override: string | undefined,
  63 │   envFile: Option.Option<string>,
  64 │ ) {
  65 │   if (override) return override;
  66 │   const provider = yield* loadConfigProvider(envFile);
  67 │   const configured = yield* ALCHEMY_STAGE.pipe(
  68 │     Effect.provideService(ConfigProvider.ConfigProvider, provider),
  69 │     Effect.catch(() => Effect.succeed(undefined)),
  70 │   );
  71 │   if (configured !== undefined && configured !== "") {
> 72 │     if (!STAGE_NAME_PATTERN.test(configured)) {
  73 │       return yield* new UserInputError({
  74 │         message: `Invalid $ALCHEMY_STAGE '${configured}'. Must match [a-z0-9]+([-_a-z0-9]+)*.`,
  75 │       });
  76 │     }
  77 │     return configured;
  78 │   }
  79 │   return yield* userStage(kind);
  80 │ });

0.73 packages/alchemy/src/Cli/exec.ts:118:3
> 118 │   return once ? undefined : yield* Effect.never;
  119 │ });
```
