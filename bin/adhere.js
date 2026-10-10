#!/usr/bin/env node
/**
 * `adhere` on PATH. Runs the executable compiled for this machine, which the
 * install fetched as the optional dependency `@drkmttr/adhere-<platform>-<arch>`
 * (see scripts/npm-packages.ts). For semantic reads, passes the native TypeScript
 * compiler package resolved from that executable's dependencies to the bundled
 * SDK. A missing compiler does not block plain commands; the reads adapter
 * validates it when needed. A checkout has no executable installed, so there it
 * runs src/main.ts with Bun instead.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { constants } from "node:os";
import { fileURLToPath } from "node:url";

const platform = `${process.platform}-${process.arch}`;
const platformPackage = `@drkmttr/adhere-${platform}`;
const executable = process.platform === "win32" ? "adhere.exe" : "adhere";
const args = process.argv.slice(2);

const resolveExecutable = () => {
  try {
    return createRequire(import.meta.url).resolve(`${platformPackage}/bin/${executable}`);
  } catch {
    return undefined;
  }
};

const resolveCompilerPackage = (prebuilt) => {
  try {
    return createRequire(prebuilt).resolve(`@typescript/typescript-${platform}/package.json`);
  } catch {
    return undefined;
  }
};

const run = (command, commandArgs, compilerPackage) => {
  const env = { ...process.env };
  // This private handoff must not let an inherited value redirect the compiler.
  delete env.ADHERE_TYPESCRIPT_PACKAGE;
  if (compilerPackage) env.ADHERE_TYPESCRIPT_PACKAGE = compilerPackage;
  const result = spawnSync(command, commandArgs, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.signal) {
    // A killed process says nothing itself, so say what killed it.
    const memory =
      result.signal === "SIGKILL" ? ", usually the system ending it for running out of memory" : "";
    console.error(`adhere: the executable was killed by ${result.signal}${memory}.`);
    process.exitCode = 128 + (constants.signals[result.signal] ?? 0);
    return;
  }
  process.exitCode = result.status ?? 1;
};

const prebuilt = resolveExecutable();
if (prebuilt) run(prebuilt, args, resolveCompilerPackage(prebuilt));
else if (existsSync(new URL("../.git", import.meta.url)))
  run("bun", [fileURLToPath(new URL("../src/main.ts", import.meta.url)), ...args]);
else {
  console.error(
    `adhere: ${platformPackage} is not installed, so there is no executable for ${platform}.` +
      " It is an optional dependency of @drkmttr/adhere: reinstall without --omit=optional or --no-optional." +
      " If it is still missing, adhere does not ship an executable for this platform.",
  );
  process.exitCode = 1;
}
