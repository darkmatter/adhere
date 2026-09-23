import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import packageJson from "../package.json";
import { describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const main = join(process.cwd(), "src", "main.ts");

describe("cli", () => {
  it("reports the package version", async () => {
    const { stderr, stdout } = await execFileAsync("bun", ["src/main.ts", "--version"], {
      cwd: process.cwd(),
    });

    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(`adhere v${packageJson.version}`);
  });

  it("prints help listing every command when run bare", async () => {
    const { stdout } = await execFileAsync("bun", [main], { cwd: process.cwd() });
    const subcommands = stdout.slice(stdout.indexOf("SUBCOMMANDS"), stdout.indexOf("EXAMPLES"));

    for (const name of ["lint", "validate", "init", "skill"]) {
      expect(subcommands).toMatch(new RegExp(`^  ${name} `, "m"));
    }
  });

  it("validates a repo's rules without calling Jev", async () => {
    const root = join(tmpdir(), `adhere-validate-${Date.now()}`);
    await mkdir(join(root, ".adhere"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "ports.md"),
      '---\ndescription: A port is a branded integer.\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n',
      "utf8",
    );

    const { stdout } = await execFileAsync("bun", [main, "validate"], { cwd: root });

    expect(stdout).toContain("1 rule loaded.");
    expect(stdout).toContain("No contradictions found among configured rules.");
  });
});
