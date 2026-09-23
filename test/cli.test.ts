import { execFile } from "node:child_process";
import { promisify } from "node:util";
import packageJson from "../package.json";
import { describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);

describe("cli", () => {
  it("reports the package version", async () => {
    const { stderr, stdout } = await execFileAsync("bun", ["src/main.ts", "--version"], {
      cwd: process.cwd(),
    });

    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(`adhere v${packageJson.version}`);
  });
});
