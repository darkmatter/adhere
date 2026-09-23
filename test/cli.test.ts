import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
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

    for (const name of ["lint", "validate", "init", "login", "logout", "skill"]) {
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

  /** `adhere <args>` with `input` piped to stdin and config kept under `configHome`. */
  const piped = (args: ReadonlyArray<string>, input: string, configHome: string) => {
    const running = execFileAsync("bun", [main, ...args], {
      env: { ...process.env, XDG_CONFIG_HOME: configHome },
    });
    running.child.stdin?.end(input);
    return running;
  };

  it("saves a key piped to login, readable only by the user, and logout deletes it", async () => {
    const configHome = join(tmpdir(), `adhere-login-${Date.now()}`);
    const file = join(configHome, "adhere", "credentials.json");

    const login = await piped(["login"], "tsk_test\n", configHome);
    expect(login.stdout).toBe(`Saved the API key to ${file}.\n`);
    expect(await readFile(file, "utf8")).toBe('{"apiKey":"tsk_test"}\n');
    expect((await stat(file)).mode & 0o777).toBe(0o600);

    const logout = await piped(["logout"], "", configHome);
    expect(logout.stdout).toBe(`Deleted the API key saved in ${file}.\n`);
    const again = await piped(["logout"], "", configHome);
    expect(again.stdout).toBe(`No API key is saved in ${file}.\n`);
  });

  it("refuses a piped key that is not one word, and saves nothing", async () => {
    const configHome = join(tmpdir(), `adhere-login-refused-${Date.now()}`);

    const refused = await piped(["login"], "tsk one\n", configHome).then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    // The runtime logs a refusal to stdout or stderr, depending on where each leads.
    expect(`${refused?.stdout}${refused?.stderr}`).toContain(
      "An API key is one word, with no spaces or line breaks.",
    );
    await expect(stat(join(configHome, "adhere", "credentials.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
