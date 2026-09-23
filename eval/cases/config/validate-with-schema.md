# config/validate-with-schema

Range and choice checks written by hand after reading config break the rule.
`Config.schema` follows it, next to a free-form label read as a plain string.

```ts breaks
import { Config, Effect } from "effect";

export const WorkerSettings = Effect.gen(function* () {
  const concurrency = yield* Config.int("WORKER_CONCURRENCY");
  if (concurrency < 1 || concurrency > 64) {
    return yield* Effect.die(`WORKER_CONCURRENCY must be between 1 and 64, got ${concurrency}`);
  }
  const region = (yield* Config.string("WORKER_REGION")).toLowerCase();
  if (region !== "us" && region !== "eu" && region !== "ap") {
    return yield* Effect.die(`WORKER_REGION must be us, eu, or ap, got ${region}`);
  }
  return { concurrency, region };
});
```

```ts follows
import { Config, Effect, Schema } from "effect";

const Concurrency = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 64 })),
);
const Region = Schema.Literals(["us", "eu", "ap"]);

export const WorkerSettings = Effect.gen(function* () {
  const concurrency = yield* Config.schema(Concurrency, "WORKER_CONCURRENCY");
  const region = yield* Config.schema(Region, "WORKER_REGION");
  const label = yield* Config.string("WORKER_LABEL");
  return { concurrency, region, label };
});
```
