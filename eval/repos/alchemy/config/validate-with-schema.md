# config/validate-with-schema

A config value with constraints must be read with Config.schema, never mapped and checked by hand.

4 findings, from 0.92 down to 0.77. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.92 packages/alchemy/src/Phase.ts:25
     if (value !== "plan" && value !== "runtime") {
0.87 packages/alchemy/src/Prisma/PrismaEnvironment.ts:72
     Effect.flatMap(normalizeBaseUrl),
0.81 packages/alchemy/test/Fly/fixtures/bluegreen-worker-managed.ts:82
     : { count: options.workers ?? 1, runOnly: options.runOnly ?? false };
0.77 packages/alchemy/src/Cli/exec.ts:94
     const once = yield* devOnce;
```
