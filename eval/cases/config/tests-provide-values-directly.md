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
