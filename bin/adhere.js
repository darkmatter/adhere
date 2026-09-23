#!/usr/bin/env node
/**
 * `adhere` on PATH. Runs the executable compiled for this machine, which the
 * install fetched as the optional dependency `@drkmttr/adhere-<platform>-<arch>`
 * (see scripts/npm-packages.ts). A checkout has none installed, so there it
 * runs src/main.ts with Bun instead.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
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

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
};

const prebuilt = resolveExecutable();
if (prebuilt) run(prebuilt, args);
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
