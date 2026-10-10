/**
 * Verify built npm artifacts through the installed Node launcher.
 * Run after build:npm: bun scripts/verify-npm.ts (requires Bun and Node 24+).
 * Installs dependencies from npm, but never sends a paid Jev request.
 * Scoped tarballs, consumers and child processes are cleaned up on every exit.
 */
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Schema, Stream } from "effect";
import { ChildProcess } from "effect/process";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "../package.json";

const repository = fileURLToPath(new URL("../", import.meta.url));
const platforms = ["darwin-arm64", "darwin-x64", "linux-arm64", "linux-x64", "win32-x64"];
const platform = `${process.platform}-${process.arch}`;
const platformPackage = `${packageJson.name}-${platform}`;
const compilerPackage = `@typescript/typescript-${platform}`;
const compilerVersion = packageJson.devDependencies.typescript;
const executable = process.platform === "win32" ? "adhere.exe" : "adhere";
const Package = Schema.fromJsonString(
  Schema.Struct({
    name: Schema.String,
    version: Schema.String,
    license: Schema.String,
    os: Schema.optionalKey(Schema.Array(Schema.String)),
    cpu: Schema.optionalKey(Schema.Array(Schema.String)),
    dependencies: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
    files: Schema.optionalKey(Schema.Array(Schema.String)),
  }),
);
const readPackage = Effect.fn("verifyNpm.readPackage")(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem;
  return yield* Schema.decodeUnknownEffect(Package)(
    yield* fs.readFileString(join(directory, "package.json")),
  );
});

const run = Effect.fn("verifyNpm.run")(
  function* (
    command: string,
    args: readonly string[],
    cwd: string,
    env: NodeJS.ProcessEnv = process.env,
    expectedExit = 0,
  ) {
    const child = yield* ChildProcess.make(command, args, {
      cwd,
      env,
      stdin: "ignore",
      forceKillAfter: "2 seconds",
    });
    // Drain output while waiting, so a full pipe cannot stall the child.
    const { status, output } = yield* Effect.all(
      {
        status: child.exitCode,
        output: Stream.mkString(Stream.decodeText(child.all)),
      },
      { concurrency: "unbounded" },
    );
    assert.equal(status, expectedExit, `${command} ${args.join(" ")} failed:\n${output}`);
    return output;
  },
  Effect.scoped,
  Effect.timeout("90 seconds"),
);

const library = [
  "export const outsideBefore = 0;",
  "",
  "export const firstPadding = 1;",
  "export const secondPadding = 2;",
  "export const thirdPadding = 3;",
  "/** Double a number. */",
  "export function twice(value: number): number {",
  "\treturn value * 2;",
  "}",
  "",
  "export const outsideAfter = 0;",
  "",
].join("\n");
const declarationExcerpt = [
  "export function twice(value: number): number {",
  "\treturn value * 2;",
  "}",
].join("\n");
const caller = [
  'import { twice as scale } from "@adhere-smoke/library";',
  "export const first = scale(1);",
  "\texport const second = scale(2);",
  "  export const third = scale(3);",
  "",
].join("\n");
const config = (marker: string) => `
import assert from "node:assert/strict";
import { basename } from "node:path";
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  rules: {
    nativeSmoke: {
      description: "Exported functions must keep their callers type-safe.",
      must: "export function twice(value: number): number { return value * 2; }",
      appendState(state, file) {
        assert.equal(basename(file.path), "caller.ts");
        assert.equal(file.contents, ${JSON.stringify(caller)});
        assert.deepEqual(state.workspacePackages, { "@adhere-smoke/library": "modules/library" });
        assert.equal(typeof state.symbols.scale, "string");
        assert(state.symbols.scale.includes("(value: number) => number"));
        assert(state.symbols.scale.includes("Double a number."), "Compiler reads must include JSDoc");
        assert.deepEqual(state.references, { scale: { "library.ts": ${JSON.stringify(declarationExcerpt)} } },
          "References must contain complete declarations without neighboring statements, preserving indentation");
        assert(!JSON.stringify(state.references).includes("outsideBefore"));
        assert(!JSON.stringify(state.references).includes("outsideAfter"));
        assert(Object.values(state.code).some((code) => code.includes("\\n\\texport const second")),
          "Judged source must preserve indentation too");
        console.log(${JSON.stringify(marker)});
        return {};
      },
    },
  },
});
`;

const verify = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  assert(platforms.includes(platform), `No built npm package is supported for ${platform}.`);
  const nodeVersion = yield* run("node", ["--version"], repository);
  assert(Number(nodeVersion.trim().slice(1).split(".")[0]) >= 24, "Node 24+ is required.");
  const sdkDirectory = dirname(createRequire(import.meta.url).resolve("typescript/package.json"));
  const notices = yield* Effect.forEach(
    ["LICENSE", "NOTICE.txt", "vendor/vscode-jsonrpc/License.txt"],
    (file) => fs.readFileString(join(sdkDirectory, file)),
  );
  const license = yield* fs.readFileString(join(repository, "LICENSE"));
  const verifyPlatform = Effect.fn("verifyNpm.platform")(function* (
    directory: string,
    os: string,
    cpu: string,
  ) {
    const manifest = yield* readPackage(directory);
    const binary = os === "win32" ? "adhere.exe" : "adhere";
    assert.equal(manifest.name, `${packageJson.name}-${os}-${cpu}`);
    assert.equal(manifest.version, packageJson.version);
    assert.equal(manifest.license, packageJson.license);
    assert.deepEqual(manifest.os, [os]);
    assert.deepEqual(manifest.cpu, [cpu]);
    assert.deepEqual(manifest.dependencies, {
      [`@typescript/typescript-${os}-${cpu}`]: compilerVersion,
    });
    assert.deepEqual(manifest.files, [`bin/${binary}`, "THIRD_PARTY_NOTICES.txt"]);
    yield* fs.access(join(directory, "bin", binary));
    assert.equal(yield* fs.readFileString(join(directory, "LICENSE")), license);
    const bundledNotices = yield* fs.readFileString(join(directory, "THIRD_PARTY_NOTICES.txt"));
    for (const notice of notices)
      assert(bundledNotices.includes(notice), `${directory} is missing an installed SDK notice.`);
  });
  const npmDirectory = join(repository, "dist", "npm");
  assert.deepEqual((yield* fs.readDirectory(npmDirectory)).sort(), [...platforms].sort());
  for (const target of platforms) {
    const [os, cpu] = target.split("-");
    yield* verifyPlatform(join(npmDirectory, target), os!, cpu!);
  }
  const releaseDirectory = join(repository, "dist", "release");
  assert.equal(yield* fs.readFileString(join(releaseDirectory, "LICENSE")), license);
  const releaseNotices = yield* fs.readFileString(
    join(releaseDirectory, "THIRD_PARTY_NOTICES.txt"),
  );
  for (const notice of notices)
    assert(releaseNotices.includes(notice), "Raw releases must carry the bundled SDK's notices.");
  yield* Console.log(
    "Verified exact native dependencies, licenses and notices for all five platforms and raw releases.",
  );

  const temporary = yield* fs.makeTempDirectoryScoped({ prefix: "adhere-verify-npm-" });
  const mainTarball = join(temporary, "main.tgz");
  const platformTarball = join(temporary, "platform.tgz");
  // Pack the checkout as-is: neither pin nor any write to its manifest is needed.
  for (const [directory, tarball] of [
    [repository, mainTarball],
    [join(npmDirectory, platform), platformTarball],
  ] as const)
    yield* run(
      "bun",
      ["pm", "pack", "--ignore-scripts", "--gzip-level", "1", "--filename", tarball],
      directory,
    );

  for (const projectTypeScript of [false, true]) {
    const consumer = join(temporary, projectTypeScript ? "typescript" : "bundled-sdk");
    yield* fs.makeDirectory(join(consumer, ".adhere"), { recursive: true });
    yield* fs.makeDirectory(join(consumer, "modules", "library"), { recursive: true });
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "development",
      XDG_CONFIG_HOME: join(temporary, `config-${basename(consumer)}`),
    };
    delete env.TYPESAFE_API_KEY;
    delete env.ADHERE_TYPESCRIPT_PACKAGE;
    const marker = `ADHERE_NATIVE_NPM_SMOKE:${consumer}`;
    const files = {
      "package.json": JSON.stringify({
        name: "adhere-npm-smoke",
        private: true,
        type: "module",
        workspaces: ["modules/*"],
        devDependencies: {
          [packageJson.name]: "file:../main.tgz",
          [platformPackage]: "file:../platform.tgz",
          ...(projectTypeScript ? { typescript: compilerVersion } : {}),
        },
      }),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          types: [],
          noEmit: true,
        },
        files: ["library.ts", "caller.ts"],
      }),
      "library.ts": library,
      "caller.ts": caller,
      "modules/library/package.json": JSON.stringify({
        name: "@adhere-smoke/library",
        version: "1.0.0",
        private: true,
        exports: "./index.ts",
      }),
      "modules/library/index.ts": 'export { twice } from "../../library";\n',
      ".adhere/config.ts": config(marker),
    };
    yield* Effect.forEach(Object.entries(files), ([file, contents]) =>
      fs.writeFileString(join(consumer, file), contents),
    );
    yield* run("bun", ["install", "--ignore-scripts", "--linker", "hoisted"], consumer, env);
    const launcher = join(consumer, "node_modules", packageJson.name, "bin", "adhere.js");
    const binary = createRequire(launcher).resolve(`${platformPackage}/bin/${executable}`);
    yield* verifyPlatform(dirname(dirname(binary)), process.platform, process.arch);
    const compiler = createRequire(binary).resolve(`${compilerPackage}/package.json`);
    const native = yield* readPackage(dirname(compiler));
    assert.equal(native.name, compilerPackage);
    assert.equal(native.version, compilerVersion);
    assert.deepEqual(native.os, [process.platform]);
    assert.deepEqual(native.cpu, [process.arch]);

    if (projectTypeScript) {
      const sdk = createRequire(join(consumer, "package.json")).resolve("typescript/package.json");
      assert.equal((yield* readPackage(dirname(sdk))).version, compilerVersion);
      const shared = createRequire(sdk).resolve(`${compilerPackage}/package.json`);
      assert.equal(
        yield* fs.realPath(shared),
        yield* fs.realPath(compiler),
        "Native compiler must dedupe.",
      );
      yield* run("node", [join(dirname(sdk), "bin", "tsc"), "--noEmit"], consumer, env);
    } else {
      assert(
        !(yield* fs.exists(join(consumer, "node_modules", "typescript"))),
        "SDK must be bundled.",
      );
    }
    const version = yield* run("node", [launcher, "--version"], consumer, env);
    assert.equal(version.trim(), `adhere v${packageJson.version}`);
    // One real pending request, not a --limit 0 planning-only smoke.
    const output = yield* run(
      "node",
      [launcher, "lint", "--yes", "--filter", "caller.ts", "--limit", "1"],
      consumer,
      env,
      1,
    );
    assert(output.split(/\r?\n/).includes(marker), `Native request hook did not pass:\n${output}`);
    assert(
      output.includes(
        "No TypeSafe AI API key. Run `adhere login` to save one, or set TYPESAFE_API_KEY.",
      ),
      `Expected refusal before HTTP:\n${output}`,
    );
    yield* Console.log(
      `${basename(consumer)}: ${marker}; missing-key refusal confirmed without HTTP.`,
    );
  }
});

verify.pipe(
  Effect.timeout("5 minutes"),
  Effect.scoped,
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
