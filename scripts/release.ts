#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import packageJson from "../package.json" with { type: "json" };

const tagName = `v${packageJson.version}`;

const run = (command: string, args: ReadonlyArray<string>) =>
  spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const expectClean = (command: string, args: ReadonlyArray<string>) => {
  const result = run(command, args);
  if (result.status !== 0) {
    fail(result.stderr.trim() || `${command} ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
};

const branch = expectClean("git", ["branch", "--show-current"]);
if (branch !== "main") {
  fail(`Release must be created from main; current branch is ${branch || "detached"}.`);
}

const status = expectClean("git", ["status", "--porcelain"]);
if (status.length > 0) {
  fail("Release requires a clean working tree.");
}

const localTag = run("git", ["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`]);
if (localTag.status === 0) {
  fail(`Tag ${tagName} already exists locally.`);
}

const remoteTag = run("git", ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`]);
if (remoteTag.status === 0) {
  fail(`Tag ${tagName} already exists on origin.`);
}
if (remoteTag.status !== 2) {
  fail(remoteTag.stderr.trim() || `Could not check origin for ${tagName}.`);
}

const release = spawnSync("gh", ["release", "create", tagName, "--generate-notes"], {
  stdio: "inherit",
});

process.exit(release.status ?? 1);
