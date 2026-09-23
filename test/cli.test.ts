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

  it("validates a single rule without asking Jev, and says how its wording differs from the tips", async () => {
    const root = join(tmpdir(), `adhere-validate-${Date.now()}`);
    await mkdir(join(root, ".adhere"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "ports.md"),
      '---\ndescription: A port is a branded integer.\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n',
      "utf8",
    );

    // It exits 0: the tips are advice, and one rule has nothing to contradict.
    const { stdout } = await execFileAsync("bun", [main, "validate"], { cwd: root });

    expect(stdout).toBe(
      [
        "1 rule loaded.",
        "1 rule is not worded as the rule writing tips recommend:",
        "  ports (.adhere/ports.md)",
        '    The description does not say "must", though the rule has a must example.',
        "    The rule has no never example. Rules with one example of each kind judge best.",
        "Rule writing tips: https://github.com/darkmatter/adhere#rule-writing-tips",
        "1 rule has fewer than 10 answers from lint yet, which asks as it judges files.",
        "No contradictions found among configured rules.",
        "",
      ].join("\n"),
    );
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

  it("asks Jev to compare rules that share files, and refuses without an API key", async () => {
    const root = join(tmpdir(), `adhere-validate-key-${Date.now()}`);
    await mkdir(join(root, ".adhere"), { recursive: true });
    for (const name of ["ports", "secrets"]) {
      await writeFile(
        join(root, ".adhere", `${name}.md`),
        `---\ndescription: Rule about ${name}.\n---\n\n${name}()\n`,
        "utf8",
      );
    }
    // No key from the environment, and none saved where a config directory would hold one.
    const { TYPESAFE_API_KEY: _key, ...env } = process.env;

    const refused = await execFileAsync("bun", [main, "validate"], {
      cwd: root,
      env: { ...env, XDG_CONFIG_HOME: join(root, "config") },
    }).then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    expect(`${refused?.stdout}${refused?.stderr}`).toContain("TYPESAFE_API_KEY");
  });

  it("prunes the cache after a run that read every file, and not after a filtered one", async () => {
    const root = join(tmpdir(), `adhere-prune-${Date.now()}`);
    const cache = join(root, ".adhere", "cache");
    await mkdir(join(cache, "files"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "ports.md"),
      '---\ndescription: A port must be a branded integer.\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n',
      "utf8",
    );
    await writeFile(join(root, "server.ts"), "export const port = 3000;\n", "utf8");
    // Answers about content no file has, and a file from the layout before content keys.
    const stale = join(cache, "files", `${"0".repeat(64)}.0123456789abcdef.json`);
    const old = join(cache, "f".repeat(64));
    await writeFile(stale, '{\n  "answers": {}\n}\n', "utf8");
    await writeFile(old, "{}", "utf8");
    const exists = (file: string) =>
      stat(file).then(
        () => true,
        () => false,
      );

    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    await execFileAsync("bun", [main, "lint", "--limit", "0", "--filter", "*.ts"], { cwd: root });
    expect([await exists(stale), await exists(old)]).toEqual([true, true]);

    await execFileAsync("bun", [main, "lint", "--limit", "0"], { cwd: root });
    expect([await exists(stale), await exists(old)]).toEqual([false, false]);
  });
});
