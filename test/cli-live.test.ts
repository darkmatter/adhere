import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { versions } from "node:process";
import { BunServices } from "@effect/platform-bun";
import {
  EffectSolutions,
  EffectSolutionsLive,
} from "../src/services/EffectSolutions.ts";

// The real CLI boundary: `effect-solutions list` must be on PATH and answer.
describe.skipIf(versions.bun === undefined)(
  "effect-solutions CLI boundary",
  () => {
    it("lists the topics the audit is built against", () =>
      Effect.gen(function* () {
        const solutions = yield* EffectSolutions;
        const topics = yield* solutions.topics;
        const slugs = topics.map((t) => t.slug);
        // The audit's detectors key into these slugs; the CLI must publish them.
        expect(slugs).toContain("config");
        expect(slugs).toContain("basics");
        expect(slugs).toContain("services-and-layers");
        expect(slugs).toContain("error-handling");
        expect(slugs).toContain("testing");
        expect(slugs).toContain("cli");
        expect(slugs).toContain("data-modeling");
      }).pipe(
        Effect.provide(EffectSolutionsLive),
        // The layer's spawner comes from Bun's process services.
        Effect.provide(BunServices.layer),
        Effect.runPromise,
      ));
  },
);
