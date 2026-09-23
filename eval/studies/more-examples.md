# More examples for each Effect preset rule

The example-count study's data: two more examples of code that must be written
and two more of code that must never be, for each rule, beside the one of each
that the rule's own file has. Each shows a different case of its rule, in
names of its own, so none repeats a planted file in `cases/`.

Most are fragments, with `yield*` outside a generator, so a formatter that
parses the code blocks turns `yield* x` into `yield * x`. Keep them out of
`vp fmt`.

## basics/external-calls-are-resilient

```ts must
const orders = yield* sql`SELECT * FROM orders WHERE customer_id = ${customerId}`.pipe(
  Effect.timeout("3 seconds"),
  Effect.retry(Schedule.exponential("50 millis").pipe(Schedule.both(Schedule.recurs(2)))),
);
```

```ts must
const profile = yield* profiles.fetch(userId).pipe(
  Effect.timeout("2 seconds"),
  Effect.retry({ times: 2 }),
);
```

```ts never
const sessions = yield* sql`SELECT * FROM sessions WHERE user_id = ${userId}`;
```

```ts never
const message = yield* Effect.tryPromise({
  try: () => twilio.messages.create({ to, from, body }),
  catch: (error) => new SmsError({ error }),
});
```

## basics/fn-for-named-effects

```ts must
const sendReceipt = Effect.fn("sendReceipt")(function* (order: Order) {
  const mailer = yield* Mailer;
  yield* mailer.send(order.email, receiptFor(order));
});
```

```ts must
const refund = Effect.fn("Payments.refund")(function* (paymentId: PaymentId, amount: Cents) {
  const gateway = yield* Gateway;
  return yield* gateway.refund(paymentId, amount);
});
```

```ts never
function sendReceipt(order: Order) {
  return Effect.gen(function* () {
    const mailer = yield* Mailer;
    yield* mailer.send(order.email, receiptFor(order));
  });
}
```

```ts never
export const refund = (paymentId: PaymentId, amount: Cents) =>
  Gateway.pipe(Effect.flatMap((gateway) => gateway.refund(paymentId, amount)));
```

## basics/gen-for-sequencing

```ts must
const importFile = Effect.gen(function* () {
  const text = yield* readUpload;
  const rows = yield* parseCsv(text);
  return yield* saveRows(rows);
});
```

```ts must
const signUp = Effect.fn("signUp")(function* (email: Email) {
  const user = yield* createUser(email);
  yield* sendWelcome(user);
  return user;
});
```

```ts never
const importFile = readUpload.pipe(
  Effect.flatMap((text) => parseCsv(text).pipe(Effect.flatMap((rows) => saveRows(rows)))),
);
```

```ts never
const signUp = (email: Email) =>
  createUser(email).pipe(
    Effect.andThen((user) => sendWelcome(user).pipe(Effect.andThen(() => Effect.succeed(user)))),
  );
```

## basics/instrument-with-pipe

```ts must
const loadDashboard = Effect.fn("loadDashboard")(
  function* (userId: UserId) {
    const widgets = yield* Widgets.forUser(userId);
    return yield* render(widgets);
  },
  Effect.timeout("3 seconds"),
  Effect.withSpan("loadDashboard"),
);
```

```ts must
const cleanup = removeExpired.pipe(
  Effect.tapError((error) => Effect.logWarning("cleanup failed", error)),
  Effect.retry(Schedule.spaced("1 minute")),
);
```

```ts never
const loadDashboard = Effect.fn("loadDashboard")(function* (userId: UserId) {
  yield* Effect.logInfo(`loading the dashboard for ${userId}`);
  const widgets = yield* Effect.timeout(Widgets.forUser(userId), "3 seconds");
  return yield* render(widgets);
});
```

```ts never
const cleanup = Effect.gen(function* () {
  return yield* Effect.withSpan(Effect.retry(removeExpired, Schedule.spaced("1 minute")), "cleanup");
});
```

## cli/handlers-delegate

```ts must
const deployCommand = Command.make("deploy", { env }, ({ env }) =>
  Effect.gen(function* () {
    const deployer = yield* Deployer;
    const release = yield* deployer.deploy(Environment.make(env));
    yield* Console.log(`Deployed ${release.version} to ${env}`);
  }),
);
```

```ts must
const statsCommand = Command.make("stats", { since }, ({ since }) =>
  Effect.gen(function* () {
    const stats = yield* Stats;
    yield* Console.log(yield* stats.report(Since.make(since)));
  }),
);
```

```ts never
const deployCommand = Command.make("deploy", { env }, ({ env }) =>
  Effect.gen(function* () {
    const tag = yield* Git.latestTag;
    const [major, minor] = tag.split(".").map(Number);
    const next = `${major}.${minor + 1}.0`;
    yield* Shell.run(`docker build -t app:${next} .`);
    yield* Shell.run(`kubectl set image deploy/app app=app:${next} -n ${env}`);
  }),
);
```

```ts never
const importCommand = Command.make("import", { file }, ({ file }) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const rows = (yield* fs.readFileString(file)).split("\n").map((line) => line.split(","));
    const valid = rows.filter((row) => row.length === 3 && row[2] !== "");
    yield* Db.insertMany(valid);
  }),
);
```

## config/business-logic-depends-on-config-service

```ts must
const chargeCard = Effect.fn("chargeCard")(function* (card: Card, amount: Cents) {
  const billing = yield* BillingConfig;
  return yield* Gateway.charge(card, amount, billing.currency);
});
```

```ts must
class FeatureFlags extends Context.Service<FeatureFlags, { readonly betaSearch: boolean }>()(
  "@app/FeatureFlags",
) {
  static readonly layer = Layer.effect(
    FeatureFlags,
    Effect.map(Config.boolean("BETA_SEARCH"), (betaSearch) => ({ betaSearch })),
  );
}
```

```ts never
const chargeCard = Effect.fn("chargeCard")(function* (card: Card, amount: Cents) {
  const currency = yield* Config.string("BILLING_CURRENCY");
  return yield* Gateway.charge(card, amount, currency);
});
```

```ts never
const search = Effect.fn("search")(function* (query: string) {
  const beta = yield* Config.boolean("BETA_SEARCH");
  return beta ? yield* betaSearch(query) : yield* classicSearch(query);
});
```

## config/secrets-are-redacted

```ts must
const password = yield* Config.redacted("DATABASE_PASSWORD");
```

```ts must
const SmtpConfig = Config.all({
  host: Config.string("SMTP_HOST"),
  password: Config.redacted("SMTP_PASSWORD"),
});
```

```ts never
const password = yield* Config.string("DATABASE_PASSWORD");
```

```ts never
const SmtpConfig = Config.all({
  host: Config.string("SMTP_HOST"),
  password: Config.string("SMTP_PASSWORD"),
});
```

## config/tests-provide-values-directly

```ts must
const PagingTest = Layer.succeed(Paging, { pageSize: 5 });

it.effect("pages by the configured size", () =>
  listCustomers.pipe(
    Effect.map((page) => expect(page.items).toHaveLength(5)),
    Effect.provide(PagingTest),
  ),
);
```

```ts must
it.effect("signs with the configured key", () =>
  signPayload(payload).pipe(
    Effect.provide(Layer.succeed(SigningConfig, { key: Redacted.make("test-key") })),
  ),
);
```

```ts never
it.effect("pages by the configured size", () =>
  listCustomers.pipe(
    Effect.map((page) => expect(page.items).toHaveLength(5)),
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ PAGE_SIZE: "5" }))),
  ),
);
```

```ts never
beforeEach(() => {
  vi.stubEnv("SIGNING_KEY", "test-key");
});
```

## config/validate-with-schema

```ts must
const Percent = Schema.Number.pipe(Schema.check(Schema.isBetween({ minimum: 0, maximum: 100 })));
const sampleRate = yield* Config.schema(Percent, "TRACE_SAMPLE_RATE");
```

```ts must
const LogLevel = Schema.Literals(["debug", "info", "warn", "error"]);
const level = yield* Config.schema(LogLevel, "LOG_LEVEL");
```

```ts never
const raw = yield* Config.string("LOG_LEVEL");
const level = ["debug", "info", "warn", "error"].includes(raw) ? raw : "info";
```

```ts never
const sampleRate = yield* Config.number("TRACE_SAMPLE_RATE").pipe(
  Config.map((rate) => Math.min(100, Math.max(0, rate))),
);
```

## data/brand-meaningful-primitives

```ts must
export const InvoiceNumber = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^INV-\d+$/)),
  Schema.brand("InvoiceNumber"),
);
export type InvoiceNumber = typeof InvoiceNumber.Type;
```

```ts must
export const RetryCount = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
  Schema.brand("RetryCount"),
);
export const WebhookUrl = Schema.String.pipe(Schema.brand("WebhookUrl"));
```

```ts never
const sendWebhook = (url: string, attempt: number) =>
  HttpClient.post(url).pipe(Effect.retry({ times: 3 - attempt }));
```

```ts never
export class Invoice extends Schema.Class<Invoice>("Invoice")({
  number: Schema.String,
  billingEmail: Schema.String,
}) {}
```

## data/decode-json-with-schema

```ts must
const settings = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Settings))(text);
```

```ts must
const ChatMessageFromJson = Schema.fromJsonString(ChatMessage);
const message = yield* socket.receive.pipe(
  Effect.flatMap(Schema.decodeUnknownEffect(ChatMessageFromJson)),
);
```

```ts never
const message: ChatMessage = JSON.parse(event.data);
```

```ts never
const config = JSON.parse(yield* fs.readFileString("config.json")) as unknown as AppConfig;
```

## data/records-are-schema-classes

```ts must
export class Shipment extends Schema.Class<Shipment>("Shipment")({
  id: ShipmentId,
  carrier: Carrier,
  shippedAt: Schema.Date,
}) {}
```

```ts must
export class Address extends Schema.Class<Address>("Address")({
  street: Schema.String,
  city: Schema.String,
  postcode: Postcode,
}) {}
```

```ts never
export type Shipment = {
  readonly id: ShipmentId;
  readonly carrier: Carrier;
  readonly shippedAt: Date;
};
```

```ts never
interface Customer {
  name: string;
  tier: "free" | "pro";
}
```

## data/variants-are-tagged-unions

```ts must
class Pending extends Schema.TaggedClass<Pending>("Pending")("Pending", {}) {}
class Shipped extends Schema.TaggedClass<Shipped>("Shipped")("Shipped", {
  trackingId: TrackingId,
}) {}
const OrderStatus = Schema.Union([Pending, Shipped]);
type OrderStatus = typeof OrderStatus.Type;
```

```ts must
const label = Match.type<OrderStatus>().pipe(
  Match.tag("Pending", () => "Waiting to ship"),
  Match.tag("Shipped", ({ trackingId }) => `Shipped: ${trackingId}`),
  Match.exhaustive,
);
```

```ts never
type OrderStatus = { status: "pending" } | { status: "shipped"; trackingId: string };
```

```ts never
switch (event._tag) {
  case "Created":
    return onCreated(event);
  case "Deleted":
    return onDeleted(event);
}
```

## errors/catch-defects-at-boundaries-only

```ts must
const app = router.pipe(
  Effect.catchDefect((defect) =>
    Effect.logError("request died", defect).pipe(
      Effect.as(HttpServerResponse.text("Internal error", { status: 500 })),
    ),
  ),
);
```

```ts must
cli.pipe(
  Effect.catchCause((cause) => Console.error(Cause.pretty(cause))),
  BunRuntime.runMain,
);
```

```ts never
const parsed = yield* parseRow(row).pipe(Effect.catchCause(() => Effect.succeed(undefined)));
```

```ts never
const rows = yield* Effect.forEach(files, (file) =>
  importFile(file).pipe(Effect.catchDefect(() => Effect.succeed([]))),
);
```

## errors/defects-for-bugs

```ts must
const owner = owners.get(order.ownerId);
if (owner === undefined) {
  return yield* Effect.die(`order ${order.id} has no owner ${order.ownerId}`);
}
```

```ts must
class CardDeclined extends Schema.TaggedError<CardDeclined>()("CardDeclined", {
  reason: Schema.String,
}) {}

return yield* new CardDeclined({ reason: response.declineReason });
```

```ts never
class UnreachableState extends Schema.TaggedError<UnreachableState>()("UnreachableState", {
  state: Schema.String,
}) {}
```

```ts never
if (ledger.debits !== ledger.credits) {
  return yield* new LedgerUnbalanced({ difference: ledger.debits - ledger.credits });
}
```

## errors/domain-errors-are-tagged

```ts must
class SeatUnavailable extends Schema.TaggedError<SeatUnavailable>()("SeatUnavailable", {
  seat: SeatId,
}) {}

return yield* new SeatUnavailable({ seat });
```

```ts must
class QuotaExceeded extends Schema.TaggedError<QuotaExceeded>()("QuotaExceeded", {
  limit: Schema.Number,
}) {}
```

```ts never
return yield* Effect.fail({ code: "SEAT_TAKEN", seat });
```

```ts never
return yield* Effect.fail("quota exceeded");
```

## errors/wrap-external-errors

```ts must
class GeocodeError extends Schema.TaggedError<GeocodeError>()("GeocodeError", {
  address: Schema.String,
  error: Schema.Defect(),
}) {}

const geocode = (address: string) =>
  Effect.tryPromise({
    try: () => maps.geocode({ address }),
    catch: (error) => new GeocodeError({ address, error }),
  });
```

```ts must
const parsed = Effect.try({
  try: () => yaml.parse(text),
  catch: (error) => new YamlError({ error }),
});
```

```ts never
const geocode = (address: string) => Effect.promise(() => maps.geocode({ address }));
```

```ts never
const parsed = Effect.try(() => yaml.parse(text));
```

## platform/os-access-through-platform-services

```ts must
const terminal = yield* Terminal.Terminal;
yield* terminal.display("Done.\n");
```

```ts must
const store = yield* KeyValueStore.KeyValueStore;
yield* store.set("last-run", new Date().toISOString());
```

```ts never
const response = await fetch("https://api.example.com/health");
```

```ts never
process.stdout.write("Done.\n");
const here = process.cwd();
```

## services/fresh-layer-per-test

```ts must
it.effect("rejects a duplicate email", () =>
  signUp(email).pipe(Effect.flip, Effect.provide(UsersTest)),
);
```

```ts must
it.layer(ElasticsearchContainer.layer, { timeout: "2 minutes" })("search index", (it) => {
  it.effect("finds a document by title", () =>
    search("adhere").pipe(Effect.provide(Search.layer)),
  );
});
```

```ts never
layer(Cache.testLayer)((it) => {
  it.effect("stores a value", () => Cache.set("a", 1));
  it.effect("starts empty", () => Cache.size.pipe(Effect.map((size) => expect(size).toBe(0))));
});
```

```ts never
describe("Users", () => {
  it.layer(UsersTest)((it) => {
    it.effect("signs up", () => signUp(email));
    it.effect("has no users yet", () => countUsers.pipe(Effect.map((n) => expect(n).toBe(0))));
  });
});
```

## services/memoize-parameterized-layers

```ts must
const HttpLive = Http.layer({ baseUrl: "https://api.example.com" });

const AppLayer = Layer.mergeAll(
  Users.layer.pipe(Layer.provide(HttpLive)),
  Orders.layer.pipe(Layer.provide(HttpLive)),
);
```

```ts must
const MetricsLive = Metrics.layer({ prefix: "shop" });

export const ApiLayer = Api.layer.pipe(Layer.provide(MetricsLive));
export const WorkerLayer = Worker.layer.pipe(Layer.provide(MetricsLive));
```

```ts never
const AppLayer = Layer.mergeAll(
  Users.layer.pipe(Layer.provide(Http.layer({ baseUrl: "https://api.example.com" }))),
  Orders.layer.pipe(Layer.provide(Http.layer({ baseUrl: "https://api.example.com" }))),
);
```

```ts never
export const ApiLayer = Api.layer.pipe(Layer.provide(Metrics.layer({ prefix: "shop" })));
export const WorkerLayer = Worker.layer.pipe(Layer.provide(Metrics.layer({ prefix: "shop" })));
```

## services/methods-have-no-requirements

```ts must
class Search extends Context.Service<
  Search,
  { readonly query: (text: string) => Effect.Effect<ReadonlyArray<Hit>, SearchError> }
>()("@app/Search") {}
```

```ts must
const SearchLive = Layer.effect(
  Search,
  Effect.gen(function* () {
    const client = yield* ElasticClient;
    return Search.of({ query: (text) => client.search(text) });
  }),
);
```

```ts never
class Search extends Context.Service<
  Search,
  {
    readonly query: (text: string) => Effect.Effect<ReadonlyArray<Hit>, SearchError, ElasticClient>;
  }
>()("@app/Search") {}
```

```ts never
class Audit extends Context.Service<
  Audit,
  { readonly record: (event: AuditEvent) => Effect.Effect<void, never, Clock | Database> }
>()("@app/Audit") {}
```

## services/no-mutable-state

```ts must
class Sessions extends Context.Service<
  Sessions,
  {
    readonly get: (id: SessionId) => Effect.Effect<Option.Option<Session>>;
    readonly set: (session: Session) => Effect.Effect<void>;
  }
>()("@app/Sessions") {}
```

```ts must
class Clock extends Context.Service<Clock, { readonly now: Effect.Effect<Date> }>()("@app/Clock") {}
```

```ts never
class Sessions extends Context.Service<
  Sessions,
  {
    sessions: Map<SessionId, Session>;
    readonly get: (id: SessionId) => Effect.Effect<Session>;
  }
>()("@app/Sessions") {}
```

```ts never
class Cart extends Context.Service<Cart, { items: Array<Item>; total: number }>()("@app/Cart") {}
```

## services/provide-at-entry

```ts must
// handler.ts, the function's entry point
export const handler = (event: SQSEvent) =>
  Effect.runPromise(processBatch(event).pipe(Effect.provide(AppLayer)));
```

```ts must
// orders/place.ts: no provide, so the requirements stay in the type
export const placeOrder = Effect.fn("placeOrder")(function* (cart: Cart) {
  const orders = yield* Orders;
  return yield* orders.place(cart);
});
```

```ts never
export const sendDigest = Effect.fn("sendDigest")(
  function* (user: User) {
    const mailer = yield* Mailer;
    yield* mailer.send(user.email, digestFor(user));
  },
  Effect.provide(Mailer.layer),
);
```

```ts never
export const cachedPrices = Prices.all.pipe(
  Effect.provide(PricesLive.pipe(Layer.provide(RedisLive))),
);
```

## services/test-layers-are-in-memory

```ts must
const ClockTest = Layer.succeed(Clock, { now: Effect.succeed(new Date("2026-01-01")) });
```

```ts must
const PaymentsTest = Layer.sync(Payments, () => {
  const charges: Array<Charge> = [];
  return Payments.of({ charge: (charge) => Effect.sync(() => void charges.push(charge)) });
});
```

```ts never
const PaymentsTest = Payments.layer.pipe(
  Layer.provide(StripeClient.layer({ apiKey: Redacted.make("sk_test_123") })),
);
```

```ts never
const FilesTest = Layer.effect(
  Files,
  Effect.map(FileSystem.FileSystem, (fs) =>
    Files.of({ read: (name) => fs.readFileString(`/tmp/fixtures/${name}`) }),
  ),
);
```

## testing/test-clock-for-time

```ts must
it.effect("expires a token after an hour", () =>
  Effect.gen(function* () {
    const token = yield* issueToken;
    yield* TestClock.adjust("61 minutes");
    expect(yield* isValid(token)).toBe(false);
  }),
);
```

```ts must
it.effect("debounces saves", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(debouncedSave(doc));
    yield* TestClock.adjust("500 millis");
    yield* Fiber.join(fiber);
  }),
);
```

```ts never
it("expires a token after a second", async () => {
  const token = issueToken({ ttlMs: 1000 });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expect(isValid(token)).toBe(false);
});
```

```ts never
it.live("debounces saves", () =>
  Effect.gen(function* () {
    yield* debouncedSave(doc);
    yield* Effect.sleep("600 millis");
  }),
);
```

## testing/test-random

```ts must
it.effect("picks the same winner for the same seed", () =>
  pickWinner(entrants).pipe(
    Random.withSeed("draw-7"),
    Effect.map((winner) => expect(winner).toBe("ada")),
  ),
);
```

```ts must
const sample = sampleUsers(100).pipe(Random.withSeed(42));
```

```ts never
it.effect("shuffles the deck", () =>
  Effect.gen(function* () {
    const order = yield* Random.shuffle(cards);
    expect(order).toHaveLength(52);
  }),
);
```

```ts never
it("generates a coupon code", () => {
  const code = generateCoupon(() => Math.floor(Math.random() * 36));
  expect(code).toMatch(/^[A-Z0-9]{8}$/);
});
```
