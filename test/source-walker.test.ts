import { rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect, FileSystem, Layer, Path } from "effect";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";

import { describe, expect, it } from "vite-plus/test";
import { isNote, withoutComments } from "../src/comments.ts";
import { suppresses, suppressionsOf } from "../src/suppress.ts";
import {
  DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
  DEFAULT_MAX_SYMBOL_LENGTH,
} from "../src/config.ts";
import { workspaceDependentsOf, workspacePackagesOf } from "../src/workspaces.ts";

import { AdhereConfig, AdhereConfigLive } from "../src/services/AdhereConfig.ts";

import {
  isInSkippedTree,
  isScannable,
  isTestFile,
  passesFilter,
  SourceWalker,
  SourceWalkerLive,
} from "../src/services/SourceWalker.ts";
import { walkFiles } from "../src/walk.ts";
import { rules, lineAt, realFileSystem, onDisk } from "./audit.fixtures.ts";

describe("walk", () => {
  it("lists files a directory at a time, never into a skipped one or through a link to one", async () => {
    const root = await onDisk({
      "src/a.ts": "",
      "src/deep/b.ts": "",
      "node_modules/pkg/index.ts": "",
      "packages/api/node_modules/dep/index.ts": "",
      ".git/HEAD": "",
    });
    await symlink(join(root, "src"), join(root, "packages", "api", "linked"));
    await symlink("..", join(root, "src", "deep", "up"));
    await symlink(join(root, "src", "a.ts"), join(root, "packages", "api", "alias.ts"));
    await symlink(join(root, "nowhere"), join(root, "src", "dangling"));

    const progress: Array<readonly [number, number]> = [];
    const files = await Effect.runPromise(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        return yield* walkFiles(
          fs,
          path,
          root,
          (relative) => {
            const name = relative.split("/").at(-1);
            return name !== "node_modules" && name !== ".git";
          },
          (directories, found) => Effect.sync(() => progress.push([directories, found])),
        );
      }).pipe(Effect.provide(realFileSystem)),
    );

    // The link to a file is listed; the link to src/, the cycle, and the link to nothing are not.
    expect(files).toEqual(["packages/api/alias.ts", "src/a.ts", "src/deep/b.ts"]);
    // The root, src/, src/deep/, packages/, and packages/api/ were read, in that many steps.
    expect(progress.at(-1)).toEqual([5, 3]);
  });
});

describe("workspace packages", () => {
  const packagesOf = (root: string) =>
    Effect.runPromise(workspacePackagesOf(root).pipe(Effect.provide(realFileSystem)));
  const named = (name: string) => JSON.stringify({ name });

  it("loads workspace package context by default and respects empty or subset replacements", async () => {
    const path = await Effect.runPromise(Path.Path.pipe(Effect.provide(Path.layer)));
    for (const reads of [
      undefined,
      [],
      ["workspacePackages"],
      ["symbols"],
      ["references"],
    ] as const) {
      const root = await onDisk({
        ".adhere/config.ts": `export default ${JSON.stringify({
          rules,
          ...(reads === undefined ? {} : { reads }),
        })};\n`,
        "package.json": JSON.stringify({ workspaces: ["packages/*"] }),
        "packages/orders/package.json": named("orders-core"),
      });
      try {
        const config = await Effect.runPromise(
          AdhereConfig.pipe(
            Effect.provide(
              AdhereConfigLive({}).pipe(
                Layer.provide([
                  BunFileSystem.layer,
                  Layer.succeed(Path.Path, {
                    ...path,
                    resolve: (...parts) => path.resolve(root, ...parts),
                  }),
                ]),
              ),
            ),
          ),
        );
        const expectedReads = (reads ?? ["workspacePackages"]).filter(
          (read) => read === "workspacePackages",
        );
        expect(config.typeAware).toBe(false);
        expect(config.reads).toEqual(expectedReads);
        expect(config.rules).toEqual(rules);
        expect(config.workspacePackages).toEqual(
          expectedReads.some((name) => name === "workspacePackages")
            ? { "orders-core": "packages/orders" }
            : undefined,
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  it("defaults only workspace reads with no config file when a preset or discovered rules supplies the rules", async () => {
    const path = await Effect.runPromise(Path.Path.pipe(Effect.provide(Path.layer)));
    for (const preset of [false, true]) {
      const root = await onDisk({
        "package.json": JSON.stringify({ workspaces: ["packages/*"] }),
        "packages/orders/package.json": named("orders-core"),
        ...(preset
          ? {}
          : {
              ".adhere/rules/ports/RULE.md":
                "---\ndescription: A port must be named.\n---\nconst port = PORT;\n",
            }),
      });
      try {
        const config = await Effect.runPromise(
          AdhereConfig.pipe(
            Effect.provide(
              AdhereConfigLive(preset ? { presets: ["effect"] } : {}).pipe(
                Layer.provide([
                  BunFileSystem.layer,
                  Layer.succeed(Path.Path, {
                    ...path,
                    resolve: (...parts) => path.resolve(root, ...parts),
                  }),
                ]),
              ),
            ),
          ),
        );
        expect(config.reads).toEqual(["workspacePackages"]);
        expect(config.typeAware).toBe(false);
        expect(config.workspacePackages).toEqual({ "orders-core": "packages/orders" });
        expect(Object.keys(config.rules).length).toBeGreaterThan(0);
        expect(config.scopedRules?.some((entry) => entry.preset === "effect")).toBe(preset);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  it("reads a root package.json's workspaces, by name, with each package's directory", async () => {
    const root = await onDisk({
      "package.json": JSON.stringify({
        workspaces: ["packages/*", "apps/**", "!packages/private"],
      }),
      "packages/orders/package.json": named("orders-core"),
      "packages/cache/package.json": named("@acme/cache"),
      "packages/private/package.json": named("private"),
      "packages/notes/README.md": "no manifest, so no package",
      "apps/web/package.json": named("web"),
      "apps/tools/cli/package.json": named("cli"),
      "apps/web/node_modules/zod/package.json": named("zod"),
      "elsewhere/package.json": named("elsewhere"),
    });

    expect(await packagesOf(root)).toEqual({
      "@acme/cache": "packages/cache",
      cli: "apps/tools/cli",
      "orders-core": "packages/orders",
      web: "apps/web",
    });
  });

  it("reads Yarn's workspaces.packages, and pnpm-workspace.yaml's packages", async () => {
    const yarn = await onDisk({
      "package.json": JSON.stringify({ workspaces: { packages: ["libs/*"] } }),
      "libs/a/package.json": named("a"),
    });
    expect(await packagesOf(yarn)).toEqual({ a: "libs/a" });

    const pnpm = await onDisk({
      "package.json": named("root"),
      "pnpm-workspace.yaml":
        "packages:\n  - 'packages/*'\n  - \"tools/cli\"\n  - '!packages/skip'\nallowBuilds:\n  msgpackr-extract: false\n",
      "packages/b/package.json": named("b"),
      "packages/skip/package.json": named("skip"),
      "tools/cli/package.json": named("cli"),
    });
    expect(await packagesOf(pnpm)).toEqual({ b: "packages/b", cli: "tools/cli" });
  });

  it("has no packages without a workspace, or with a manifest it cannot read", async () => {
    expect(await packagesOf(await onDisk({ "package.json": named("alone") }))).toEqual({});
    expect(await packagesOf(await onDisk({ "package.json": "{ not json" }))).toEqual({});
    expect(await packagesOf(await onDisk({ "README.md": "no manifest" }))).toEqual({});
  });

  it("lists, per package, the other workspace packages whose manifest depends on it", async () => {
    const root = await onDisk({
      "package.json": JSON.stringify({ workspaces: ["packages/*"] }),
      "packages/core/package.json": JSON.stringify({
        name: "core",
        dependencies: { core: "workspace:*", zod: "^4" },
      }),
      "packages/web/package.json": JSON.stringify({
        name: "web",
        dependencies: { core: "workspace:*" },
        devDependencies: { tools: "workspace:*" },
      }),
      "packages/api/package.json": JSON.stringify({
        name: "api",
        peerDependencies: { core: "*" },
        optionalDependencies: { tools: "*" },
      }),
      "packages/tools/package.json": named("tools"),
    });
    const dependents = await Effect.runPromise(
      Effect.flatMap(workspacePackagesOf(root), (catalog) =>
        workspaceDependentsOf(root, catalog),
      ).pipe(Effect.provide(realFileSystem)),
    );
    expect(dependents).toEqual({
      core: { api: "packages/api", web: "packages/web" },
      tools: { api: "packages/api", web: "packages/web" },
    });
    expect(Object.keys(dependents.core!)).toEqual(["api", "web"]);
  });
});

describe("adhere-ignore", () => {
  const provider = [
    "export const Policy = Provider.effect({",
    "  // adhere-ignore alchemy/providers/idempotent-delete -- AWS returns success for a missing policy",
    "  delete: Effect.fn(function* ({ output }) {",
    "    yield* autoscaling.deletePolicy({ PolicyName: output.policyName });",
    "  }),",
    "  read: Effect.fn(function* ({ output }) {",
    "    return yield* autoscaling.describePolicy({ PolicyName: output.policyName });",
    "  }),",
    "});",
  ];

  it("covers the statement below the comment, wherever in it Jev points, and blanks the comment", () => {
    const { lines, suppressions } = suppressionsOf(provider);
    expect(lines).toHaveLength(provider.length);
    expect(lines[1]).toBe("");
    expect(lines.filter((line, index) => line !== provider[index])).toEqual([""]);
    const rule = "alchemy/providers/idempotent-delete";
    expect([3, 4, 5].map((line) => suppresses(suppressions, rule, lineAt(line)))).toEqual([
      true,
      true,
      true,
    ]);
    expect(suppresses(suppressions, rule, lineAt(7))).toBe(false);
    // A section that holds the statement, beside code it does not cover, is covered too.
    expect(suppresses(suppressions, rule, { first: 6, last: 9 })).toBe(false);
    expect(suppresses(suppressions, rule, { first: 1, last: 7 })).toBe(true);
    expect(suppresses(suppressions, "effect/data/brand-meaningful-primitives", lineAt(4))).toBe(
      false,
    );
  });

  it("covers a trailing comment's own line, a whole file, and several rules at once", () => {
    const { lines, suppressions } = suppressionsOf([
      "// adhere-ignore-file effect/basics/gen-for-sequencing -- generated",
      "const a = 1; // adhere-ignore data/ports, data/names -- a fixed port",
      "const b = 2;",
    ]);
    expect(lines).toEqual(["", "const a = 1;", "const b = 2;"]);
    expect(suppresses(suppressions, "effect/basics/gen-for-sequencing", lineAt(3))).toBe(true);
    expect(suppresses(suppressions, "data/ports", lineAt(2))).toBe(true);
    expect(suppresses(suppressions, "data/names", lineAt(2))).toBe(true);
    expect(suppresses(suppressions, "data/ports", lineAt(3))).toBe(false);
  });

  it("reads a comment only: a string that mentions adhere-ignore, or a comment naming no rule, suppresses nothing", () => {
    const code = [
      'const hint = "// adhere-ignore data/ports -- in a string";',
      "// adhere-ignore -- no rule named",
      "const port = 1;",
    ];
    const { lines, suppressions } = suppressionsOf(code);
    expect(lines).toEqual(code);
    expect(suppressions.statements).toEqual([]);
    expect(suppressions.file.size).toBe(0);
  });
});

describe("comments", () => {
  it("keeps a comment that says @adhere anywhere in it, and returns a file without comments as it is", () => {
    const lines = [
      "// plain",
      "/** Deletes the activity. @adhere DeleteActivity succeeds on a missing activity. */",
      "const x = 1; // trailing",
    ];
    expect(withoutComments(lines, isNote)).toEqual(["", lines[1], "const x = 1;"]);
    const bare = ["const x = 1;", "const y = x / 2;"];
    expect(withoutComments(bare, isNote)).toBe(bare);
  });

  it("takes comments out, keeping every line and its number", () => {
    const lines = [
      "/**",
      " * Deleting a missing policy returns success.",
      " */",
      "const retries = 3; // enough",
      "const every = /* seconds */ 5;",
      "  // gone",
      "export const x = 1;",
    ];
    expect(withoutComments(lines)).toEqual([
      "",
      "",
      "",
      "const retries = 3;",
      "const every =  5;",
      "",
      "export const x = 1;",
    ]);
  });

  it("keeps a string, template literal, or regular expression that holds a comment's marks", () => {
    const lines = [
      'const url = "https://example.com"; // the site',
      "const path = `a//b/*c*/`;",
      "const slashes = /\\/\\//g;",
    ];
    expect(withoutComments(lines)).toEqual([
      'const url = "https://example.com";',
      "const path = `a//b/*c*/`;",
      "const slashes = /\\/\\//g;",
    ]);
  });

  it("takes JSX comments out, and keeps a URL in JSX text", () => {
    const lines = [
      "return (",
      "  <div>",
      "    {/* the docs */}",
      '    <a href="https://example.com">https://example.com/docs</a>',
      "  </div>",
      ");",
    ];
    expect(withoutComments(lines)).toEqual([
      "return (",
      "  <div>",
      "    {}",
      '    <a href="https://example.com">https://example.com/docs</a>',
      "  </div>",
      ");",
    ]);
  });
});

describe("source walker", () => {
  it("lists only paths and classifications, then reads current contents on demand", async () => {
    const root = await onDisk({
      "src/a.ts": "export const before = 1;\n",
      "src/a.test.ts": "export const test = 1;\n",
      "src/skip.ts": "export const skipped = 1;\n",
      "src/types.d.ts": "declare const declared: number;\n",
      ".adhere/config.ts": "export default {};\n",
    });
    try {
      const [fs, path] = await Effect.runPromise(
        Effect.all([FileSystem.FileSystem, Path.Path]).pipe(Effect.provide(realFileSystem)),
      );
      const reads: Array<string> = [];
      const layer = SourceWalkerLive(["src/**"]).pipe(
        Layer.provide(
          Layer.mergeAll(
            Layer.succeed(FileSystem.FileSystem, {
              ...fs,
              readFileString: (file) =>
                Effect.suspend(() => {
                  reads.push(file);
                  return fs.readFileString(file);
                }),
            }),
            Layer.succeed(Path.Path, {
              ...path,
              resolve: (...parts) => path.resolve(root, ...parts),
            }),
            Layer.succeed(AdhereConfig, {
              typeAware: false,
              model: "jev-latest",
              threshold: 0.7,
              sufficiencyThreshold: 0.7,
              maxSymbolDocumentationLength: DEFAULT_MAX_SYMBOL_DOCUMENTATION_LENGTH,
              maxSymbolLength: DEFAULT_MAX_SYMBOL_LENGTH,
              reads: [],
              rules,
              exclude: ["src/skip.ts"],
            }),
          ),
        ),
      );
      await Effect.runPromise(
        Effect.gen(function* () {
          const walker = yield* SourceWalker;
          const files = yield* walker.files;
          expect(files).toEqual([
            { path: join(root, "src/a.test.ts"), test: true },
            { path: join(root, "src/a.ts") },
          ]);
          expect(reads).toEqual([]);
          const file = files.find((file) => file.path.endsWith("/a.ts"))!;
          yield* Effect.promise(() => writeFile(file.path, "export const after = 2;\n", "utf8"));
          expect(yield* walker.read(file)).toEqual({
            ...file,
            lines: ["export const after = 2;", ""],
          });
          expect(reads).toEqual([file.path]);
        }).pipe(Effect.provide(layer)),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps the files a filter's globs match, and leaves out what a ! pattern matches", () => {
    expect(passesFilter("src/a.ts", [])).toBe(true);
    expect(passesFilter("src/deep/a.ts", ["src/**"])).toBe(true);
    expect(passesFilter("lib/a.ts", ["src/**"])).toBe(false);
    expect(passesFilter("src/billing.service.ts", ["**/*.service.ts"])).toBe(true);
    expect(passesFilter("packages/web/a.ts", ["packages/{api,web}/**"])).toBe(true);
    expect(passesFilter("src/gen/a.ts", ["src/**", "!src/gen/**"])).toBe(false);
    expect(passesFilter("src/a.ts", ["!src/gen/**"])).toBe(true);
    expect(passesFilter("src\\a.ts", ["src/*.ts"])).toBe(true);
  });

  it("skips dependency, generated, and .adhere trees by whole path segment", () => {
    expect(isInSkippedTree("src/server.ts")).toBe(false);
    expect(isInSkippedTree("vendorized/lib.ts")).toBe(false);
    expect(isInSkippedTree("packages/api/node_modules/pkg/index.ts")).toBe(true);
    expect(isInSkippedTree("dist/main.ts")).toBe(true);
    expect(isInSkippedTree(".adhere/config.ts")).toBe(true);
  });

  it("reads .ts, .tsx, .mts, and .cts files, but not declaration files or JavaScript", () => {
    for (const name of ["a.ts", "Button.tsx", "a.mts", "a.cts"]) {
      expect(isScannable(`/repo/src/${name}`, "/adhere")).toBe(true);
    }
    for (const name of ["a.d.ts", "a.d.mts", "a.d.cts", "a.js", "a.jsx", "a.mjs"]) {
      expect(isScannable(`/repo/src/${name}`, "/adhere")).toBe(false);
    }
  });

  it("counts .test.ts and .spec.ts files, and files under a test directory, as tests", () => {
    expect(isTestFile("src/a.test.ts")).toBe(true);
    expect(isTestFile("src/a.spec.ts")).toBe(true);
    expect(isTestFile("src/Button.test.tsx")).toBe(true);
    expect(isTestFile("src/a.spec.mts")).toBe(true);
    expect(isTestFile("src/test-utils.tsx")).toBe(true);
    expect(isTestFile("packages/api/test/helpers/layer.ts")).toBe(true);
    expect(isTestFile("src/__tests__/a.ts")).toBe(true);
    expect(isTestFile("fixtures/worker.ts")).toBe(true);
    expect(isTestFile("src/testing/clock.ts")).toBe(true);
    expect(isTestFile("src/coder/fixture/case-env.ts")).toBe(true);
    expect(isTestFile("src/__mocks__/fs.ts")).toBe(true);
    for (const name of [
      "fixtures.ts",
      "GitHubHttpFixtures.ts",
      "ledger-copy.fixture.ts",
      "fetch-errors.fixtures.ts",
      "attribution-test-fixtures.ts",
      "linear-test-helpers.ts",
      "GitHubHttpTestUtils.ts",
      "test-utils.ts",
    ]) {
      expect(isTestFile(`src/${name}`)).toBe(true);
    }
    expect(isTestFile("src/test.ts")).toBe(false);
    expect(isTestFile("src/latest-utils.ts")).toBe(false);
    expect(isTestFile("src/tester/TestRun.ts")).toBe(false);
    expect(isTestFile("src/test-runs/test-draft.ts")).toBe(false);
    expect(isTestFile("src/AWS/B2BI/TestConversionHttp.ts")).toBe(false);
  });
});
