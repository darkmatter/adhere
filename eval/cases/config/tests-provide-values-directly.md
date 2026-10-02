# config/tests-provide-values-directly

A test that sets environment variables, or supplies a `ConfigProvider`, breaks
the rule; one that provides the config service with `Layer.succeed` follows it.

```ts breaks
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { ReportService } from "../src/ReportService.ts";

describe("ReportService", () => {
  it.effect("uploads a report to the configured bucket", () => {
    process.env.REPORTS_BUCKET = "test-bucket";
    process.env.REPORTS_REGION = "eu-west-1";
    return Effect.gen(function* () {
      const reports = yield* ReportService;
      const url = yield* reports.upload("weekly.csv");
      expect(url).toContain("test-bucket");
    }).pipe(Effect.provide(ReportService.layer));
  });
});
```

```ts breaks
import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { ReportService } from "../src/ReportService.ts";

const testConfig = ConfigProvider.fromUnknown({
  REPORTS_BUCKET: "test-bucket",
  REPORTS_REGION: "eu-west-1",
});

describe("ReportService", () => {
  it.effect("uploads a report to the configured bucket", () =>
    Effect.gen(function* () {
      const reports = yield* ReportService;
      const url = yield* reports.upload("weekly.csv");
      expect(url).toContain("test-bucket");
    }).pipe(Effect.provide(ReportService.layer), Effect.provide(ConfigProvider.layer(testConfig))),
  );
});
```

```ts follows
import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ReportsConfig, ReportService } from "../src/ReportService.ts";

describe("ReportService", () => {
  it.effect("uploads a report to the configured bucket", () =>
    Effect.gen(function* () {
      const reports = yield* ReportService;
      const url = yield* reports.upload("weekly.csv");
      expect(url).toContain("test-bucket");
    }).pipe(
      Effect.provide(ReportService.layer),
      Effect.provide(Layer.succeed(ReportsConfig, { bucket: "test-bucket", region: "eu-west-1" })),
    ),
  );
});
```

A configuration decoder must be given undecoded inputs to verify rejection and
fallback.

```ts follows
import { Config, ConfigProvider, Effect } from "effect";
import { expect, test } from "vitest";

const port = Config.Int("PORT");

test("rejects a non-integer port", async () => {
  const config = ConfigProvider.fromUnknown({ PORT: "invalid" });
  await expect(
    Effect.runPromise(port.pipe(Effect.provideService(ConfigProvider.ConfigProvider, config))),
  ).rejects.toThrow();
});
```

A consumer test must supply the config service rather than configuring its
production loader.

```ts breaks
import { Config, Context, Effect, Layer } from "effect";
import { beforeEach, expect, test } from "vitest";

class ApiConfig extends Context.Service<ApiConfig, { readonly url: string }>()("ApiConfig") {}

const ApiConfigLive = Layer.effect(
  ApiConfig,
  Effect.gen(function* () {
    return { url: yield* Config.String("DATABASE_URL") };
  }),
);

const fetchInvoice = Effect.gen(function* () {
  const config = yield* ApiConfig;
  return `${config.url}/invoice`;
});

beforeEach(() => {
  process.env.DATABASE_URL = "postgres://localhost/test";
});

test("loads the invoice", async () => {
  expect(await Effect.runPromise(fetchInvoice.pipe(Effect.provide(ApiConfigLive)))).toContain(
    "invoice",
  );
});
```
