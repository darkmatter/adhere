import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { constants, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import packageJson from "../package.json";
import { afterEach, describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const platform = `${process.platform}-${process.arch}`;
const platformPackage = `${packageJson.name}-${platform}`;
const compilerPackage = `@typescript/typescript-${platform}`;
const executable = process.platform === "win32" ? "adhere.exe" : "adhere";
const launcherSource = join(process.cwd(), "bin", "adhere.js");
const roots: string[] = [];

const temporaryRoot = async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "adhere-launcher-")));
  roots.push(root);
  return root;
};

const writePackage = async (
  nodeModules: string,
  name: string,
  manifest: Record<string, unknown>,
) => {
  const directory = join(nodeModules, name);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({ name, ...manifest }));
  return directory;
};

const nativePackage = (nodeModules: string, version = packageJson.devDependencies.typescript) =>
  writePackage(nodeModules, compilerPackage, {
    version,
    os: [process.platform],
    cpu: [process.arch],
    files: ["lib"],
    exports: { "./package.json": "./package.json" },
  });

const installed = async (hoisted = false) => {
  const root = await temporaryRoot();
  const main = await writePackage(join(root, "node_modules"), packageJson.name, {
    version: packageJson.version,
    type: "module",
    optionalDependencies: { [platformPackage]: packageJson.version },
  });
  const launcher = join(main, "bin", "adhere.js");
  await mkdir(join(main, "bin"));
  await copyFile(launcherSource, launcher);
  const selected = await writePackage(
    join(hoisted ? root : main, "node_modules"),
    platformPackage,
    {
      version: packageJson.version,
      os: [process.platform],
      cpu: [process.arch],
      dependencies: { [compilerPackage]: packageJson.devDependencies.typescript },
    },
  );
  await mkdir(join(selected, "bin"));
  const binary = join(selected, "bin", executable);
  // A real runtime executable works as the mock platform binary on Windows too.
  await copyFile(process.execPath, binary);
  if (process.platform !== "win32") await chmod(binary, 0o755);

  return {
    root,
    main,
    selected,
    run: (script: string, args: readonly string[] = []) =>
      execFileAsync(process.execPath, [launcher, "-e", script, ...args], {
        cwd: root,
        env: {
          ...process.env,
          NODE_PATH: "",
          ADHERE_TYPESCRIPT_PACKAGE: join(root, "inherited", "package.json"),
        },
        timeout: 10000,
      }),
  };
};

const printCompiler = "console.log(process.env.ADHERE_TYPESCRIPT_PACKAGE ?? 'unset')";

describe("npm launcher", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it("prefers the selected platform binary's compiler over consumer and main-package dependencies", async () => {
    const installation = await installed();
    const compiler = await nativePackage(join(installation.selected, "node_modules"));
    await nativePackage(join(installation.main, "node_modules"), "7.0.1");
    await nativePackage(join(installation.root, "node_modules"), "7.0.1");
    await writePackage(join(installation.root, "node_modules"), "typescript", { version: "5.9.3" });

    const { stdout, stderr } = await installation.run(printCompiler);
    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(join(compiler, "package.json"));
  });

  it("shares the same hoisted native package with a matching consumer TypeScript SDK", async () => {
    const installation = await installed(true);
    const compiler = await nativePackage(join(installation.root, "node_modules"));
    const sdk = await writePackage(join(installation.root, "node_modules"), "typescript", {
      version: packageJson.devDependencies.typescript,
      optionalDependencies: { [compilerPackage]: packageJson.devDependencies.typescript },
    });

    const { stdout, stderr } = await installation.run(printCompiler);
    const shared = createRequire(join(sdk, "package.json")).resolve(
      `${compilerPackage}/package.json`,
    );
    expect(shared).toBe(join(compiler, "package.json"));
    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(shared);
  });

  it.each(["--version", "lint"])(
    "still launches %s without a compiler dependency, clearing the inherited handoff",
    async (command) => {
      const installation = await installed();
      const { stdout, stderr } = await installation.run(
        "console.log(JSON.stringify({ compiler: process.env.ADHERE_TYPESCRIPT_PACKAGE ?? null, args: process.argv.slice(1) }))",
        ["--", command],
      );

      expect(stderr).toBe("");
      expect(JSON.parse(stdout)).toEqual({ compiler: null, args: [command] });
    },
  );

  it("preserves stdin, stdout, stderr, arguments, and the executable's exit code", async () => {
    const installation = await installed();
    const running = installation.run(
      "process.stdout.write(require('node:fs').readFileSync(0, 'utf8')); console.error(process.argv.slice(1).join('|')); process.exitCode = 23",
      ["--", "lint", "a file.ts"],
    );
    running.child.stdin?.end("piped input\n");
    const refused = await running.then(
      () => undefined,
      (error: { code: number; stdout: string; stderr: string }) => error,
    );

    expect(refused).toMatchObject({
      code: 23,
      stdout: "piped input\n",
      stderr: "lint|a file.ts\n",
    });
  });

  it.skipIf(process.platform === "win32")(
    "preserves the signal exit status and diagnostic",
    async () => {
      const installation = await installed();
      const killed = await installation.run("process.kill(process.pid, 'SIGTERM')").then(
        () => undefined,
        (error: { code: number; stdout: string; stderr: string }) => error,
      );

      expect(killed).toMatchObject({
        code: 128 + constants.signals.SIGTERM,
        stdout: "",
        stderr: "adhere: the executable was killed by SIGTERM.\n",
      });
    },
  );

  it("clears the inherited compiler handoff for the source-checkout fallback too", async () => {
    const root = await temporaryRoot();
    await mkdir(join(root, ".git"));
    await mkdir(join(root, "bin"));
    await mkdir(join(root, "src"));
    await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
    await copyFile(launcherSource, join(root, "bin", "adhere.js"));
    await writeFile(join(root, "src", "main.ts"), printCompiler);

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [join(root, "bin", "adhere.js")],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_PATH: "",
          ADHERE_TYPESCRIPT_PACKAGE: join(root, "untrusted.json"),
        },
        timeout: 10000,
      },
    );
    expect(stderr).toBe("");
    expect(stdout).toBe("unset\n");
  });
});
