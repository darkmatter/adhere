import { mkdir, readdir, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { Crypto, Effect, FileSystem, Layer, Path } from "effect";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { previewTrial, runTrial, TrialUnavailable } from "../src/create/trial.ts";
import { oxlintIdOf } from "../src/create/oxlint-trial.ts";
import { onDisk, testCrypto } from "./audit.fixtures.ts";

const platform = Layer.mergeAll(BunFileSystem.layer, Path.layer, testCrypto);
type TrialEnv = Crypto.Crypto | FileSystem.FileSystem | Path.Path;
const run = <A, E>(effect: Effect.Effect<A, E, TrialEnv>) =>
  Effect.runPromise(effect.pipe(Effect.provide(platform)));

const repoBinary = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));

/** A project that installed oxlint, without the rest of the repository. */
const oxlintProject = async (tree: Readonly<Record<string, string>>, tsgolint = false) => {
  const root = await onDisk({ "package.json": JSON.stringify({ name: "consumer" }), ...tree });
  await mkdir(join(root, "node_modules", ".bin"), { recursive: true });
  await symlink(repoBinary, join(root, "node_modules", ".bin", "oxlint"));
  if (tsgolint) {
    await symlink(
      fileURLToPath(new URL("../node_modules/oxlint-tsgolint", import.meta.url)),
      join(root, "node_modules", "oxlint-tsgolint"),
    );
  }
  return root;
};

const native = (config: unknown = { rules: { "no-console": "warn" } }) =>
  ({ kind: "native", id: "no-console", config }) as const;

const plugin = (source: string) =>
  ({
    kind: "plugin",
    pluginName: "acme",
    ruleName: "no-foo",
    plugin: source,
    config: { rules: { "acme/no-foo": "error" } },
  }) as const;

const PLUGIN = `
export default {
  meta: { name: "acme" },
  rules: {
    "no-foo": {
      meta: { schema: [] },
      create(context) {
        return {
          Identifier(node) {
            if (node.name === "foo") context.report({ node, message: "No foo." });
          },
        };
      },
    },
  },
};
`;

describe("oxlint trial", () => {
  it("runs the consumer binary over only the draft rule, leaving other configured rules off", async () => {
    const root = await oxlintProject({
      "src/a.ts": 'console.log("x");\ndebugger;\n',
      "src/clean.ts": "export const clean = 1;\n",
      "oxlint.json": JSON.stringify({ rules: { "no-debugger": "error" } }),
    });
    try {
      const result = await run(
        runTrial(
          native({ rules: { "no-console": "warn", "no-debugger": "error" } }),
          { kind: "all" },
          { root },
        ),
      );
      expect(result.selectedFiles).toEqual(["src/a.ts", "src/clean.ts"]);
      expect(result.files).toBe(2);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]).toMatchObject({
        rule: "no-console",
        file: "src/a.ts",
        section: { first: 1, last: 1 },
        excerpt: 'console.log("x");',
      });
      expect(result.findings.every((finding) => finding.rule !== "no-debugger")).toBe(true);
      expect(result.reportPath).toBe(".adhere/trial/no-console.json");
      expect(oxlintIdOf(native())).toBe("no-console");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("loads a plugin from a temporary config and runs only its rule", async () => {
    const root = await oxlintProject({ "src/value.ts": "export const foo = 1;\n" });
    try {
      const result = await run(
        runTrial(plugin(PLUGIN), { kind: "all" }, { root, writeReport: false }),
      );
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]).toMatchObject({
        rule: "acme/no-foo",
        file: "src/value.ts",
        message: "No foo.",
      });
      // Nothing permanent: no config, plugin, or report was written into the project.
      expect((await readdir(root)).sort()).toEqual(["node_modules", "package.json", "src"]);
      await expect(readdir(join(root, ".adhere"))).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("previews without running oxlint, and reports missing prerequisites as skip-able failures", async () => {
    const root = await oxlintProject({ "src/a.ts": 'console.log("x");\n' });
    const empty = await onDisk({ "src/a.ts": 'console.log("x");\n' });
    const bare = await oxlintProject({ "src/a.ts": 'console.log("x");\n' });
    try {
      const preview = await run(previewTrial(native(), { kind: "files", limit: 1 }, { root }));
      expect(preview).toMatchObject({
        eligible: 1,
        selected: 1,
        requests: 0,
        tokens: 0,
      });
      await expect(readdir(join(root, ".adhere"))).rejects.toThrow();

      const missing = await Effect.runPromise(
        Effect.flip(
          runTrial(native(), { kind: "all" }, { root: empty }).pipe(Effect.provide(platform)),
        ),
      );
      expect(missing).toBeInstanceOf(TrialUnavailable);
      expect(missing.reason).toBe("oxlint");
      expect(missing.message).toContain("does not bundle oxlint");

      const typeAware = await Effect.runPromise(
        Effect.flip(
          runTrial(
            native({ options: { typeAware: true }, rules: { "no-console": "error" } }),
            { kind: "all" },
            { root: bare },
          ).pipe(Effect.provide(platform)),
        ),
      );
      expect(typeAware.reason).toBe("compiler");
      expect(typeAware.message).toContain("oxlint-tsgolint");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(empty, { recursive: true, force: true });
      await rm(bare, { recursive: true, force: true });
    }
  });
});
