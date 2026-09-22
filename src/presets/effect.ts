import type { Rule, RuleId } from "#config.ts";

/**
 * References are lifted from the effect-solutions docs, adjusted only where
 * the installed Effect names an API differently (Schema.TaggedError,
 * Schema.Defect(), Random.withSeed). The platform/* rule follows the
 * effect/platform docs (effect.website/docs/platform).
 */
export const effect: Readonly<Record<RuleId, Rule>> = {
  "basics/gen-for-sequencing": {
    description:
      "Sequential effectful steps are written with Effect.gen and yield*, not nested flatMap or callback chains.",
    reference: `
const program = Effect.gen(function* () {
  const data = yield* fetchData
  yield* Effect.logInfo(\`Processing data: \${data}\`)
  return yield* processData(data)
})
`,
  },
  "basics/fn-for-named-effects": {
    description:
      "A named function that returns an Effect is defined with Effect.fn so the call site is traced.",
    reference: `
const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(\`Processing user \${userId}\`)
  const user = yield* getUser(userId)
  return yield* processData(user)
})
`,
  },
  "basics/instrument-with-pipe": {
    description:
      "Timeouts, retries, logging, and spans are attached with .pipe, not written into the body of the effect.",
    reference: `
const program = fetchData.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.both(Schedule.recurs(3)))),
  Effect.tap((data) => Effect.logInfo(\`Fetched: \${data}\`)),
  Effect.withSpan("fetchData")
)
`,
  },
  "basics/external-calls-are-resilient": {
    description:
      "A call over the network, such as an HTTP request, a database query, or a third-party API, carries a timeout and a retry schedule. Calls through the platform FileSystem and Path services are local and are not in scope.",
    reference: `
const retryPolicy = Schedule.exponential("100 millis").pipe(
  Schedule.both(Schedule.recurs(3))
)

const resilientCall = HttpClient.get("https://api.example.com/users").pipe(
  Effect.timeout("2 seconds"),
  Effect.retry(retryPolicy),
  Effect.timeout("10 seconds")
)
`,
  },
  "platform/os-access-through-platform-services": {
    description:
      "File, path, process, terminal, and HTTP access goes through Effect's platform services (FileSystem, Path, ChildProcess, Terminal, HttpClient, KeyValueStore), acquired with yield*, not through node: builtins, Bun globals, or fetch. The Bun implementations are provided once at the entry point with BunServices.layer.",
    reference: `
import { Effect, FileSystem, Path } from "effect"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { BunRuntime, BunServices } from "@effect/platform-bun"

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const config = yield* fs.readFileString(path.join(path.resolve(), "config.json"))
  const response = yield* HttpClient.get("https://api.example.com/users")
  const users = yield* HttpClientResponse.schemaBodyJson(Users)(response)
  return { config, users }
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
`,
  },
  "services/methods-have-no-requirements": {
    description:
      "Service method signatures have no requirements. Dependencies are acquired inside the layer, not declared on the method.",
    reference: `
class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<unknown[]>
    readonly execute: (sql: string) => Effect.Effect<void>
  }
>()("@app/Database") {}
`,
  },
  "services/no-mutable-state": {
    description:
      "A service exposes readonly members and does not expose mutable state.",
    reference: `
class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>
  }
>()("@app/Logger") {}
`,
  },
  "services/provide-at-entry": {
    description:
      "Layers are provided once at the program entry. A module that is not an entry point does not call Effect.provide.",
    reference: `
const appLayer = userServiceLayer.pipe(
  Layer.provideMerge(databaseLayer),
  Layer.provideMerge(loggerLayer),
  Layer.provideMerge(configLayer)
)

const program = Effect.gen(function* () {
  const users = yield* UserService
  yield* users.getUser()
})

const main = program.pipe(Effect.provide(appLayer))
`,
  },
  "services/memoize-parameterized-layers": {
    description:
      "The result of a parameterized layer constructor is stored in a module constant before it is used in more than one place.",
    reference: `
const postgresLayer = Postgres.layer({ url: "postgres://localhost/mydb", poolSize: 10 })

const goodAppLayer = Layer.merge(
  UserRepo.layer.pipe(Layer.provide(postgresLayer)),
  OrderRepo.layer.pipe(Layer.provide(postgresLayer))
)
`,
  },
  "services/test-layers-are-in-memory": {
    description:
      "A test implementation of a service is built with Layer.sync or Layer.succeed over in-memory state.",
    reference: `
static readonly testLayer = Layer.sync(Cache, () => {
  const store = new Map<string, string>()

  const get = (key: string) => Effect.succeed(store.get(key) ?? null)
  const set = (key: string, value: string) => Effect.sync(() => void store.set(key, value))

  return { get, set }
})
`,
  },
  "services/fresh-layer-per-test": {
    description:
      "Each it.effect provides its own layer. it.layer is used only to share an expensive resource across a suite.",
    reference: `
it.effect("starts at zero", () =>
  Effect.gen(function* () {
    const counter = yield* Counter
    expect(yield* counter.get()).toBe(0)
  }).pipe(Effect.provide(Counter.layer)),
)

it.effect("increments without leaking", () =>
  Effect.gen(function* () {
    const counter = yield* Counter
    yield* counter.increment()
    expect(yield* counter.get()).toBe(1)
  }).pipe(Effect.provide(Counter.layer)),
)
`,
  },
  "data/records-are-schema-classes": {
    description:
      "Domain records are defined with Schema.Class, not with a plain interface or type alias.",
    reference: `
export class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.Date,
}) {
  get displayName() {
    return \`\${this.name} (\${this.email})\`
  }
}
`,
  },
  "data/variants-are-tagged-unions": {
    description:
      "Structured variants are Schema.TaggedClass in a Schema.Union and are matched with Match.tag and Match.exhaustive.",
    reference: `
export class Success extends Schema.TaggedClass<Success>("Success")("Success", {
  value: Schema.Number,
}) {}

export class Failure extends Schema.TaggedClass<Failure>("Failure")("Failure", {
  error: Schema.String,
}) {}

export const Result = Schema.Union([Success, Failure])
export type Result = typeof Result.Type

const renderResult = (result: Result) =>
  Match.value(result).pipe(
    Match.tag("Success", ({ value }) => \`Got: \${value}\`),
    Match.tag("Failure", ({ error }) => \`Error: \${error}\`),
    Match.exhaustive,
  )
`,
  },
  "data/brand-meaningful-primitives": {
    description:
      "A primitive with semantic meaning, such as an id, email, URL, port, or count, is a branded schema.",
    reference: `
export const UserId = Schema.String.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export const Email = Schema.String.pipe(Schema.brand("Email"))
export type Email = typeof Email.Type

export const Port = Schema.Int.pipe(Schema.check(Schema.isBetween({minimum: 1, maximum: 65535})), Schema.brand("Port"))
export type Port = typeof Port.Type
`,
  },
  "data/decode-json-with-schema": {
    description:
      "JSON crossing a boundary is decoded with Schema.fromJsonString, not JSON.parse followed by a cast.",
    reference: `
const MoveFromJson = Schema.fromJsonString(Move)

const program = Effect.gen(function* () {
  const jsonString = '{"from":{"row":"A","column":"1"},"to":{"row":"B","column":"2"}}'
  const move = yield* Schema.decodeUnknownEffect(MoveFromJson)(jsonString)
  const json = yield* Schema.encodeEffect(MoveFromJson)(move)
  return json
})
`,
  },
  "errors/domain-errors-are-tagged": {
    description:
      "A domain failure is a Schema.TaggedError with its own tag.",
    reference: `
class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    field: Schema.String,
    message: Schema.String,
  }
) {}

class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    resource: Schema.String,
    id: Schema.String,
  }
) {}
`,
  },
  "errors/defects-for-bugs": {
    description:
      "A typed error is for a failure the caller can handle. A bug or invariant violation is a defect.",
    reference: `
const recovered: Effect.Effect<string, ValidationError> = program.pipe(
  Effect.catchTag("HttpError", (error) =>
    Effect.gen(function* () {
      yield* Effect.logWarning(\`HTTP \${error.statusCode}: \${error.message}\`)
      return "Recovered from HttpError"
    })
  )
)

const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie)
  yield* Effect.log(\`Starting on port \${config.port}\`)
})
`,
  },
  "errors/catch-defects-at-boundaries-only": {
    description:
      "Defects are caught only at a system boundary for logging or shutdown, never in business logic.",
    reference: `
// At app entry: if config fails, nothing can proceed
const main = Effect.gen(function* () {
  const config = yield* loadConfig.pipe(Effect.orDie)
  yield* Effect.log(\`Starting on port \${config.port}\`)
})
`,
  },
  "errors/wrap-external-errors": {
    description:
      "An error from an external library is wrapped in a tagged error with a Schema.Defect field, not passed through raw.",
    reference: `
class ApiError extends Schema.TaggedError<ApiError>()(
  "ApiError",
  {
    endpoint: Schema.String,
    statusCode: Schema.Number,
    error: Schema.Defect(),
  }
) {}

const fetchUser = (id: string) =>
  HttpClient.get(\`/api/users/\${id}\`).pipe(
    Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
    Effect.mapError((error) => new ApiError({
      endpoint: \`/api/users/\${id}\`,
      statusCode: 500,
      error
    }))
  )
`,
  },
  "config/business-logic-depends-on-config-service": {
    description:
      "Business logic depends on a config service. Config primitives are read only inside that service's layer.",
    reference: `
class ApiConfig extends Context.Service<
  ApiConfig,
  {
    readonly apiKey: Redacted.Redacted
    readonly baseUrl: string
  }
>()("@app/ApiConfig") {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function* () {
      const apiKey = yield* Config.redacted("API_KEY")
      const baseUrl = yield* Config.string("API_BASE_URL")
      return { apiKey, baseUrl }
    })
  )
}
`,
  },
  "config/secrets-are-redacted": {
    description: "A token, password, or key is read with Config.redacted.",
    reference: `
const program = Effect.gen(function* () {
  const apiKey = yield* Config.redacted("API_KEY")

  const headers = {
    Authorization: \`Bearer \${Redacted.value(apiKey)}\`
  }

  return headers
})
`,
  },
  "config/validate-with-schema": {
    description:
      "A config value with constraints is read with Config.schema, not mapped and checked by hand.",
    reference: `
const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({minimum: 1, maximum: 65535}))
)
const Environment = Schema.Literals(["development", "staging", "production"])

const program = Effect.gen(function* () {
  const port = yield* Config.schema(Port, "PORT")
  const env = yield* Config.schema(Environment, "ENV")

  return { port, env }
})
`,
  },
  "config/tests-provide-values-directly": {
    description:
      "A test supplies config with Layer.succeed on the config service, not by setting environment variables or a ConfigProvider.",
    reference: `
Effect.runPromise(
  program.pipe(
    Effect.provide(
      Layer.succeed(ApiConfig, {
        apiKey: Redacted.make("test-key"),
        baseUrl: "https://test.example.com"
      })
    )
  )
)
`,
  },
  "testing/test-clock-for-time": {
    description:
      "A test that depends on time uses TestClock. Real sleeps and it.live are used only when real time is required.",
    reference: `
it.effect("time-based test", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.delay(Effect.succeed("done"), "10 seconds").pipe(
      Effect.forkChild
    )
    yield* TestClock.adjust("10 seconds")
    const result = yield* Fiber.join(fiber)
    expect(result).toBe("done")
  })
)
`,
  },
  "testing/test-random": {
    description:
      "A test that depends on randomness controls it with a fixed seed through Random.withSeed, not Math.random or an unseeded Random.",
    reference: `
const program = Effect.gen(function*() {
  const value1 = yield* Random.next
  const value2 = yield* Random.next
  return [value1, value2]
})

await Effect.runPromise(Effect.all([
  program.pipe(Random.withSeed("my-seed")),
  program.pipe(Random.withSeed("my-seed"))
])) // => [[0.018368576514773527, 0.4010840628128671], [0.018368576514773527, 0.4010840628128671]]
`,
  },
  "cli/handlers-delegate": {
    description:
      "A command handler parses input and calls a service. Business logic lives in the service.",
    reference: `
const addCommand = Command.make("add", { text }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    const task = yield* repo.add(text)
    yield* Console.log(\`Added task #\${task.id}: \${task.text}\`)
  })
).pipe(Command.withDescription("Add a new task"))
`,
  },
};
