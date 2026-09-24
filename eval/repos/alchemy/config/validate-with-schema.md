# config/validate-with-schema

A config value with constraints must be read with Config.schema, never mapped and checked by hand.

The preset words it differently now: A config value with constraints must be validated as it is read, with Config.schema or Config.mapOrFail, never checked by hand after reading.

7 findings, from 0.92 down to 0.72. Each showed this hint:

```ts
const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
);
const Environment = Schema.Literals(["development", "staging", "production"]);

const program = Effect.gen(function* () {
  const port = yield* Config.schema(Port, "PORT");
  const env = yield* Config.schema(Environment, "ENV");

  return { port, env };
});
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.92 packages/alchemy/src/Phase.ts:25:5
  22 │ export const ALCHEMY_PHASE = Config.String("ALCHEMY_PHASE").pipe(
  23 │   Config.withDefault("plan"),
  24 │   Config.mapEffect((value) => {
> 25 │     if (value !== "plan" && value !== "runtime") {
  26 │       return Effect.die(new Error(`Invalid ALCHEMY_PHASE: ${value}`));
  27 │     }
  28 │     return Effect.succeed(value as AlchemyPhase);
  29 │   }),
  30 │   Effect.orDie,
  31 │ );

0.87 packages/alchemy/src/Prisma/PrismaEnvironment.ts:72:9
  65 │ export const fromProfile = () =>
  66 │   Layer.effect(
  67 │     PrismaEnvironment,
  68 │     Effect.gen(function* () {
  69 │       const baseUrl = yield* Config.String(PRISMA_API_URL_ENV).pipe(
  70 │         Config.orElse(() => Config.String(PRISMA_MANAGEMENT_API_URL_ENV)),
  71 │         Config.withDefault(DEFAULT_BASE_URL),
> 72 │         Effect.flatMap(normalizeBaseUrl),
  73 │       );
  74 │       const { resolve } = yield* resolveProviderConfig<
  75 │         PrismaAuthConfig,
  76 │         PrismaResolvedCredentials
  77 │       >(PRISMA_AUTH_PROVIDER_NAME);
  78 │       const credentials = yield* resolve;
  79 │       return { ...credentials, baseUrl };
  80 │     }),
  81 │   );

0.84 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:82:9
  68 │       const { count, runOnly } = globalThis.__ALCHEMY_RUNTIME__
  69 │         ? yield* Effect.all({
  70 │             count: Config.Number("WORKERS"),
  71 │             runOnly: Config.String("RUN_ONLY").pipe(
  72 │               Effect.map((value) => value === "1"),
  73 │             ),
  74 │           }).pipe(
  75 │             // These controls are plain Machine env, not packed runtime bindings.
  76 │             Effect.provideService(
  77 │               ConfigProvider.ConfigProvider,
  78 │               ConfigProvider.fromEnv(),
  79 │             ),
  80 │             Effect.orDie,
  81 │           )
> 82 │         : { count: options.workers ?? 1, runOnly: options.runOnly ?? false };
  83 │       const ready = new Set<string>();
  84 │       let sharedOpen = true;

0.82 packages/alchemy/src/Cli/exec.ts:194:7
  187 │     Effect.flatMap((watcher) => {
  188 │       const generation = devKeepAlive(runDev(options)).pipe(
  189 │         Effect.provideService(StackModuleLoader, {
  190 │           import: () => watcher.import().then(({ value }) => value),
  191 │         }),
  192 │         Effect.scoped,
  193 │       );
> 194 │       return Effect.forever(
  195 │         Effect.raceFirst(generation, nextChange(watcher)).pipe(
  196 │           Effect.flatMap((paths) =>
  197 │             paths === undefined ? Effect.void : logReload(paths),
  198 │           ),
  199 │         ),
  200 │       );
  201 │     }),

0.74 packages/alchemy/src/Runtime/Bootstrap/Fly.ts:72:9
  68 │   return runProcess("Fly service", program, {
  69 │     managedHttpShutdownTimeoutMs:
  70 │       timeout === undefined
  71 │         ? undefined
> 72 │         : /^\d+$/.test(timeout)
  73 │           ? Number(timeout)
  74 │           : NaN,
  75 │   });

0.73 packages/alchemy/src/Cli/commands/flags.ts:72:5
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

0.72 packages/cloudflare-runtime/src/core/bindings/queue/Queue.ts:101:11
> 101 │           if (
  102 │             consumer.deadLetterQueue !== undefined &&
  103 │             consumer.deadLetterQueue === consumer.queueName
  104 │           ) {
  105 │             return yield* new ConfigError({
  106 │               subtag: "Queue",
  107 │               message: `Dead letter queue for queue "${consumer.queueName}" cannot be itself`,
  108 │               hint: "Point `deadLetterQueue` at a different queue name.",
  109 │               detail: { queueName: consumer.queueName },
  110 │             });
  111 │           }
```
