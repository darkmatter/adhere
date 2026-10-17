import { loaded, a, b, rules } from "./audit.fixtures.ts";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  AdhereConfig as AdhereConfigSchema,
  DEFAULT_READS,
  decodeConfig,
  type Loaded,
  type Preset,
  resolveConfig,
} from "../src/config.ts";

import { type RuleEntry, shownId, withOverrides } from "../src/rules.ts";

describe("config", () => {
  it("applies the default model, thresholds, workspace reads, and typeAware false only at resolution", async () => {
    const config = await Effect.runPromise(
      loaded({}, { "data/brand": { description: "d", must: "r" } }),
    );
    expect(config.reads).toBeUndefined();
    expect(config.typeAware).toBeUndefined();
    expect(config.maxSymbolDocumentationLength).toBeUndefined();
    expect(config.maxSymbolLength).toBeUndefined();
    expect(Object.hasOwn(config, "reads")).toBe(false);
    expect(DEFAULT_READS).toEqual(["workspacePackages"]);
    expect(resolveConfig(config)).toEqual({
      model: "jev-latest",
      threshold: 0.8,
      sufficiencyThreshold: 0.6,
      reads: ["workspacePackages"],
      typeAware: false,
      maxSymbolDocumentationLength: 256,
      maxSymbolLength: 256,
      rules: { "data/brand": { description: "d", must: "r" } },
    });
  });

  it("enables both native reads only with typeAware, independently of legacy read selections", async () => {
    for (const reads of [
      undefined,
      [],
      ["workspacePackages"],
      ["symbols"],
      ["references"],
      ["symbols", "references"],
    ] as const) {
      for (const typeAware of [false, true]) {
        const config = await Effect.runPromise(
          loaded({ typeAware, ...(reads === undefined ? {} : { reads }) }),
        );
        const effective = resolveConfig(config);
        const workspace = reads === undefined || reads.some((read) => read === "workspacePackages");
        expect(effective.typeAware).toBe(typeAware);
        expect(effective.reads).toEqual([
          ...(workspace ? ["workspacePackages"] : []),
          ...(typeAware ? ["symbols", "references"] : []),
        ]);
      }
    }
  });

  it("lets an explicit typeAware flag override config while an absent flag preserves it", async () => {
    for (const typeAware of [undefined, false, true]) {
      const config = await Effect.runPromise(loaded(typeAware === undefined ? {} : { typeAware }));
      expect(resolveConfig(config, {}).typeAware).toBe(typeAware ?? false);
      for (const flag of [false, true]) {
        const resolved = resolveConfig(config, { typeAware: flag });
        expect(resolved.typeAware).toBe(flag);
        expect(resolved.reads).toEqual(
          flag ? ["workspacePackages", "symbols", "references"] : ["workspacePackages"],
        );
      }
    }
    const refused = await Effect.runPromise(Effect.flip(decodeConfig({ typeAware: "true" })));
    expect(refused.message).toContain("typeAware");
  });

  it("takes the sufficiency threshold from the flag, then the config, then the default", async () => {
    const config = await Effect.runPromise(loaded({ sufficiencyThreshold: 0.6 }));
    expect(resolveConfig(config).sufficiencyThreshold).toBe(0.6);
    expect(resolveConfig(config, { sufficiencyThreshold: 0.5 }).sufficiencyThreshold).toBe(0.5);
  });

  it("keeps configured symbol and documentation limits, including zero", async () => {
    for (const field of ["maxSymbolLength", "maxSymbolDocumentationLength"] as const) {
      for (const length of [0, 32, 1024]) {
        const config = await Effect.runPromise(loaded({ [field]: length }));
        expect(resolveConfig(config)[field]).toBe(length);
      }
    }
  });

  it("refuses symbol limits that are not non-negative integers", async () => {
    for (const field of ["maxSymbolLength", "maxSymbolDocumentationLength"] as const) {
      for (const length of [-1, 1.5, Infinity, NaN, "256"]) {
        const refused = await Effect.runPromise(Effect.flip(decodeConfig({ [field]: length })));
        expect(refused.message).toContain(field);
      }
    }
  });

  it("folds presets into the rules, with a config rule winning over a preset rule", async () => {
    const override = { description: "mine", must: "mine" };
    const preset: Loaded<Preset> = { rules: { a, b } };
    const config = await Effect.runPromise(loaded({}, { a: override }));
    const resolved = resolveConfig(config, { presets: ["effect"] }, { effect: preset });
    expect(resolved.rules).toEqual({ a: override, b });
  });

  it("leaves rules unset when the config names none, so the loader can pick .adhere/", async () => {
    const decoded = await Effect.runPromise(decodeConfig({}));
    expect(decoded.rules).toBeUndefined();
  });

  it("accepts a directory path as the rules of a config", async () => {
    const decoded = await Effect.runPromise(decodeConfig({ rules: "./team-rules" }));
    expect(decoded.rules).toBe("./team-rules");
  });

  it("decodes overrides by rule id: off, a level, or a level and a threshold", async () => {
    const overrides = {
      "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
      "effect/basics/gen-for-sequencing": "off",
    } as const;
    expect((await Effect.runPromise(decodeConfig({ overrides }))).overrides).toEqual(overrides);
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ overrides: { "effect/basics/gen-for-sequencing": "nit" } })),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
  });

  it("applies overrides by the id a report shows: off drops a rule, a level or threshold replaces its own", async () => {
    const entry = (id: string, preset?: string): RuleEntry => ({
      id,
      ...(preset === undefined ? {} : { preset }),
      scope: "/repo",
      rule: { description: id, must: "a()", threshold: 0.7 },
    });
    const entries = [
      entry("providers/idempotent-delete", "alchemy"),
      entry("basics/gen-for-sequencing", "effect"),
      entry("style/names"),
      entry("style/kept"),
    ];
    const overridden = await Effect.runPromise(
      withOverrides(entries, {
        "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
        "effect/basics/gen-for-sequencing": "off",
        "style/names": "warning",
      }),
    );
    expect(overridden.map((one) => [shownId(one), one.rule.level, one.rule.threshold])).toEqual([
      ["alchemy/providers/idempotent-delete", "warning", 0.9],
      ["style/names", "warning", 0.7],
      ["style/kept", undefined, 0.7],
    ]);
  });

  it("decodes a rule's options from its override, refusing missing, invalid, or untaken ones", async () => {
    const options = Schema.Struct({
      edgePaths: Schema.Array(Schema.String),
      strict: Schema.optionalKey(Schema.Boolean),
    });
    const entries: ReadonlyArray<RuleEntry> = [
      { id: "edge", scope: "/repo", rule: { description: "edge", must: "a()", options } },
      { id: "plain", scope: "/repo", rule: { description: "plain", must: "a()" } },
    ];
    const [edge, plain] = await Effect.runPromise(
      withOverrides(entries, { edge: { options: { strict: true, edgePaths: ["src/edge"] } } }),
    );
    expect(edge?.rule.optionValues).toEqual({ edgePaths: ["src/edge"], strict: true });
    expect(plain?.rule.optionValues).toBeUndefined();
    const refusal = (overrides: Parameters<typeof withOverrides>[1]) =>
      Effect.runPromise(Effect.flip(withOverrides(entries, overrides)));
    for (const overrides of [{}, { edge: "warning" as const }]) {
      expect((await refusal(overrides)).message).toMatch(/options of edge.*edgePaths/s);
    }
    expect((await refusal({ edge: { options: { edgePaths: "src/edge" } } })).message).toMatch(
      /options of edge/,
    );
    expect((await refusal({ edge: "off", plain: { options: {} } })).message).toBe(
      "overrides sets options for plain, which takes none.",
    );
  });

  it("keeps the config's exclude globs, and refuses a rule's tests other than only or include", async () => {
    const configured = await Effect.runPromise(loaded({ exclude: ["gen/**"] }));
    expect(resolveConfig(configured).exclude).toEqual(["gen/**"]);
    const refused = await Effect.runPromise(
      Effect.flip(
        decodeConfig({ rules: { a: { description: "d", must: "a()", tests: "sometimes" } } }),
      ),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
  });

  it("threshold precedence: command line, then config, then preset, then 0.8", async () => {
    const registry = { effect: { threshold: 0.9, rules: {} } };
    const bare = await Effect.runPromise(loaded({}));
    expect(resolveConfig(bare).threshold).toBe(0.8);
    expect(resolveConfig(bare, { presets: ["effect"] }, registry).threshold).toBe(0.9);
    const configured = await Effect.runPromise(loaded({ presets: ["effect"], threshold: 0.6 }));
    expect(resolveConfig(configured, {}, registry).threshold).toBe(0.6);
    expect(resolveConfig(configured, { threshold: 0.85 }, registry).threshold).toBe(0.85);
  });

  it("refuses an unknown preset", async () => {
    const refused = await Effect.runPromise(Effect.flip(decodeConfig({ presets: ["vue"] })));
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("effect");
  });

  it("refuses a rule without an example, or one that is both a requirement and a guideline", async () => {
    const refusal = (rule: typeof AdhereConfigSchema.Encoded.rules) =>
      Effect.runPromise(Effect.flip(decodeConfig({ rules: rule })));
    const bare = await refusal({ "data/brand": { description: "d" } });
    expect(bare._tag).toBe("ConfigUnavailable");
    expect(bare.message).toContain("a rule needs an example: must, never, should, or shouldNot");
    const mixed = await refusal({ "data/brand": { description: "d", must: "a()", should: "b()" } });
    expect(mixed.message).toContain(
      "a rule is a requirement (must, never) or a guideline (should, shouldNot), not both",
    );
  });

  it("accepts a rule with only code never to write, and a guideline", async () => {
    const never = { description: "Domain code does not throw.", never: "throw new Error()" };
    const guideline = { description: "A file should be small.", should: "export const one = 1;" };
    const config = await Effect.runPromise(decodeConfig({ rules: { never, guideline } }));
    expect(config.rules).toEqual({ never, guideline });
  });

  it("takes a function as a rule's appendState, and refuses anything else", async () => {
    const appendState = () => ({});
    const decoded = await Effect.runPromise(decodeConfig({ rules: { a: { ...a, appendState } } }));
    expect(decoded.rules).toEqual({ a: { ...a, appendState } });
    const refused = await Effect.runPromise(
      Effect.flip(decodeConfig({ rules: { a: { ...a, appendState: "{}" } } })),
    );
    expect(refused.message).toContain("Expected a function");
  });

  it("keeps configured shared reads through resolution and refuses unknown reads", async () => {
    const reads = ["workspacePackages", "dependents", "symbols", "references"] as const;
    const decoded = await Effect.runPromise(decodeConfig({ reads, rules }));
    expect(decoded.reads).toEqual(reads);
    expect(decoded.rules).toEqual(rules);
    expect(resolveConfig({ ...decoded, rules }).reads).toEqual(["workspacePackages", "dependents"]);
    expect(resolveConfig({ ...decoded, rules }).typeAware).toBe(false);
    const refused = await Effect.runPromise(Effect.flip(decodeConfig({ reads: ["comments"] })));
    expect(refused.message).toContain(
      'Expected "workspacePackages" | "dependents" | "symbols" | "references"\n  at ["reads"][0]',
    );
  });

  it("replaces default reads with explicit empty or subset lists rather than merging them", async () => {
    for (const reads of [
      [],
      ["workspacePackages"],
      ["symbols"],
      ["references"],
      ["symbols", "references"],
    ] as const) {
      const config = await Effect.runPromise(loaded({ reads }, rules));
      expect(config.reads).toEqual(reads);
      expect(resolveConfig(config).reads).toEqual(
        reads.filter((read) => read === "workspacePackages"),
      );
    }
  });
});
