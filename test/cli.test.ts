import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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

  it("prints the skill for writing rules, or with fix, the one for verifying and fixing findings", async () => {
    const print = async (...args: ReadonlyArray<string>) =>
      (await execFileAsync("bun", [main, "skill", ...args], { cwd: process.cwd() })).stdout;
    expect(await print()).toMatch(/^---\nname: adhere\n/);
    expect(await print("rules")).toBe(await print());
    expect(await print("fix")).toMatch(/^---\nname: adhere-fix\n/);
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

  it("takes several presets, repeated or separated by commas, and refuses an unknown one", async () => {
    const root = join(tmpdir(), `adhere-presets-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "index.ts"), "export const x = 1;\n", "utf8");
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const plan = (...presets: ReadonlyArray<string>) =>
      execFileAsync("bun", [main, "lint", ...presets, "--limit", "0"], { cwd: root }).then(
        ({ stderr }) => stderr.split("\n")[0],
        ({ stderr }: { readonly stderr: string }) => stderr.split("\n")[0],
      );

    const effect = await plan("--preset", "effect");
    const alchemy = await plan("--preset", "alchemy");
    const both = await plan("--preset", "effect,alchemy");
    const count = (line: string | undefined) => Number(/(\d+) rules/.exec(line ?? "")?.[1]);
    expect(count(both)).toBe(count(effect) + count(alchemy));
    expect(await plan("--preset", "effect", "--preset", "alchemy")).toBe(both);
    expect(await plan("--preset", "alchemy, effect")).toBe(both);

    const refused = await execFileAsync("bun", [main, "lint", "--preset", "effect,react"], {
      cwd: root,
    }).then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    expect(`${refused?.stdout}${refused?.stderr}`).toContain("(not react)");
  });

  it("turns a preset rule off by its id, takes a rule of a preset the run leaves out, and refuses one no rule has", async () => {
    const root = join(tmpdir(), `adhere-overrides-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "index.ts"), "export const x = 1;\n", "utf8");
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const lint = () =>
      execFileAsync("bun", [main, "lint", "--preset", "effect", "--limit", "0"], { cwd: root });
    const rules = async () =>
      Number(/(\d+) rules?/.exec((await lint()).stderr.split("\n")[0] ?? "")?.[1]);
    const config = (overrides: string) =>
      writeFile(
        join(root, "adhere.config.ts"),
        `export default { overrides: ${overrides} };\n`,
        "utf8",
      );

    const all = await rules();
    await config(
      '{ "effect/basics/gen-for-sequencing": "off", "alchemy/providers/idempotent-delete": "warning" }',
    );
    expect(await rules()).toBe(all - 1);

    await config('{ "effect/basics/no-such-rule": "off" }');
    const refused = await lint().then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    expect(`${refused?.stdout}${refused?.stderr}`).toContain(
      "overrides names effect/basics/no-such-rule, which is no preset or project rule.",
    );
  });

  it("never reads a file the config excludes", async () => {
    const root = join(tmpdir(), `adhere-exclude-${Date.now()}`);
    for (const directory of [".adhere", "src", "gen"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    const files: Readonly<Record<string, string>> = {
      "src/a.ts": "export const a = 1;\n",
      "gen/b.ts": "export const b = 1;\n",
      "adhere.config.ts": 'export default { exclude: ["gen/**"] };\n',
      ".adhere/named.md":
        "---\ndescription: A constant must be named.\n---\n\nexport const named = 1;\n",
    };
    for (const [file, text] of Object.entries(files)) {
      await writeFile(join(root, file), text, "utf8");
    }
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const { stderr } = await execFileAsync("bun", [main, "lint", "--limit", "0"], { cwd: root });
    expect(stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
  });

  it("judges tests only by a rule about tests", async () => {
    const root = join(tmpdir(), `adhere-tests-${Date.now()}`);
    for (const directory of [".adhere", "src", "test"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    const files: Readonly<Record<string, string>> = {
      "src/a.ts": "export const a = 1;\n",
      "src/a.test.ts": "export const t = 1;\n",
      "test/helper.ts": "export const h = 1;\n",
      ".adhere/named.md":
        "---\ndescription: A constant must be named.\n---\n\nexport const named = 1;\n",
    };
    for (const [file, text] of Object.entries(files)) {
      await writeFile(join(root, file), text, "utf8");
    }
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const plan = () =>
      execFileAsync("bun", [main, "lint", "--limit", "0"], { cwd: root }).then(
        ({ stderr }) => stderr.split("\n")[0],
        ({ stderr }: { readonly stderr: string }) => stderr.split("\n")[0],
      );

    // src/a.ts alone: no rule judges tests.
    expect(await plan()).toBe("1 file and 1 rule: 1 check.");
    await writeFile(
      join(root, ".adhere", "tests.md"),
      "---\ndescription: A test must be named.\ntests: only\n---\n\nexport const named = 1;\n",
      "utf8",
    );
    // Now the two tests as well, each judged only by the rule on tests.
    expect(await plan()).toBe("3 files and 2 rules: 3 checks.");
  });

  it("prunes the cache after a run that read every file, keeping other rules' answers, and not after a filtered one", async () => {
    const root = join(tmpdir(), `adhere-prune-${Date.now()}`);
    const cache = join(root, ".adhere", "cache");
    await mkdir(join(cache, "files"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "ports.md"),
      '---\ndescription: A port must be a branded integer.\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n',
      "utf8",
    );
    const source = "export const port = 3000;\n";
    await writeFile(join(root, "server.ts"), source, "utf8");
    // An answer about server.ts as it is, to a rule this run does not have, as another preset leaves.
    const hash = createHash("sha256").update(source).digest("hex");
    await writeFile(
      join(cache, "files", `${hash}.fedcba9876543210.json`),
      '{\n  "answers": {\n    "another-rule": {\n      "probability": 0.9\n    }\n  }\n}\n',
      "utf8",
    );
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
    const kept = (await readdir(join(cache, "files"))).filter((name) =>
      name.startsWith(`${hash}.`),
    );
    const texts = await Promise.all(
      kept.map((name) => readFile(join(cache, "files", name), "utf8")),
    );
    expect(texts).toEqual([expect.stringContaining('"another-rule"')]);
  });
});
