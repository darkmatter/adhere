import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import packageJson from "../package.json";
import { describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const main = join(process.cwd(), "src", "main.ts");

describe("cli", () => {
  it("reports the package version, marked as source when run from it", async () => {
    const { stderr, stdout } = await execFileAsync("bun", ["src/main.ts", "--version"], {
      cwd: process.cwd(),
    });

    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(`adhere v${packageJson.version} (source)`);
  });

  it("prints help listing every command when run bare", async () => {
    const { stdout } = await execFileAsync("bun", [main], { cwd: process.cwd() });
    const subcommands = stdout.slice(stdout.indexOf("SUBCOMMANDS"), stdout.indexOf("EXAMPLES"));

    for (const name of [
      "lint",
      "validate",
      "init",
      "list",
      "install",
      "login",
      "logout",
      "skill",
    ]) {
      expect(subcommands).toMatch(new RegExp(`^  ${name} `, "m"));
    }
  });

  it("documents file-based limits and rejects negative file counts", async () => {
    const { stdout } = await execFileAsync("bun", [main, "lint", "--help"], {
      cwd: process.cwd(),
    });
    expect(stdout).toContain("files needing requests");
    expect(stdout).toContain("A file can send multiple requests");
    const refused = await execFileAsync("bun", [main, "lint", "--limit", "-1"], {
      cwd: process.cwd(),
    }).then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    expect(`${refused?.stdout}${refused?.stderr}`).toContain(
      "--limit is a number of files, 0 or more, not -1.",
    );
  });

  it("prints the reference skill, or with setup or fix, the one for setting up or fixing findings", async () => {
    const print = async (...args: ReadonlyArray<string>) =>
      (await execFileAsync("bun", [main, "skill", ...args], { cwd: process.cwd() })).stdout;
    expect(await print()).toMatch(/^---\nname: adhere\n/);
    expect(await print("docs")).toBe(await print());
    expect(await print("setup")).toMatch(/^---\nname: adhere-setup\n/);
    expect(await print("fix")).toMatch(/^---\nname: adhere-fix\n/);
  });

  it("validates a single rule without asking Jev, and says how its wording differs from the tips", async () => {
    const root = join(tmpdir(), `adhere-validate-${Date.now()}`);
    await mkdir(join(root, ".adhere", "rules", "ports"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "rules", "ports", "RULE.md"),
      '---\ndescription: A port is a branded integer.\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n',
      "utf8",
    );

    // It exits 0: the tips are advice, and one rule has nothing to contradict.
    const { stdout } = await execFileAsync("bun", [main, "validate"], { cwd: root });

    expect(stdout).toBe(
      [
        "1 rule loaded.",
        "1 rule is not worded as the rule writing tips recommend:",
        "  ports (.adhere/rules/ports/RULE.md)",
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

  it("saves an OpenAI key piped to login --openai beside TypeSafe AI's, and logout --openai deletes only it", async () => {
    const configHome = join(tmpdir(), `adhere-login-openai-${Date.now()}`);
    const file = join(configHome, "adhere", "credentials.json");

    await piped(["login"], "tsk_test\n", configHome);
    const login = await piped(["login", "--openai"], "sk-test\n", configHome);
    expect(login.stdout).toBe(`Saved the OpenAI API key to ${file}.\n`);
    expect(await readFile(file, "utf8")).toBe('{"apiKey":"tsk_test","openaiApiKey":"sk-test"}\n');

    const logout = await piped(["logout", "--openai"], "", configHome);
    expect(logout.stdout).toBe(`Deleted the OpenAI API key saved in ${file}.\n`);
    expect(await readFile(file, "utf8")).toBe('{"apiKey":"tsk_test"}\n');
    const again = await piped(["logout", "--openai"], "", configHome);
    expect(again.stdout).toBe(`No OpenAI API key is saved in ${file}.\n`);
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
    for (const name of ["ports", "secrets"]) {
      await mkdir(join(root, ".adhere", "rules", name), { recursive: true });
      await writeFile(
        join(root, ".adhere", "rules", name, "RULE.md"),
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

  it("lists another repo's rules, and copies one topic, then the rest, under its org and repo, skipping what is there", async () => {
    const source = join(tmpdir(), `adhere-install-source-${Date.now()}`);
    const root = join(tmpdir(), `adhere-install-${Date.now()}`);
    const rules = join(source, ".adhere", "rules");
    for (const directory of ["data/ports", "data/columns", "style/small"]) {
      await mkdir(join(rules, directory), { recursive: true });
    }
    await mkdir(join(source, ".adhere", "cache"), { recursive: true });
    await mkdir(root, { recursive: true });
    const ports = "---\ndescription: A port must be branded.\n---\n\nconst Port = 1\n";
    await writeFile(join(rules, "data", "ports", "RULE.md"), ports, "utf8");
    // Listing a RULE.ts would run it, so list names it without a description.
    await writeFile(
      join(rules, "data", "columns", "RULE.ts"),
      'throw new Error("list and install never run a rule");\n',
      "utf8",
    );
    await writeFile(
      join(rules, "data", "columns", "schema.ts"),
      "export const schema = 1;\n",
      "utf8",
    );
    await writeFile(
      join(rules, "style", "small", "RULE.md"),
      "---\ndescription: A file should be small.\n---\n\nx\n",
      "utf8",
    );
    await writeFile(join(source, ".adhere", "cache", "stale.md"), "not a rule\n", "utf8");
    const git = (...args: ReadonlyArray<string>) => execFileAsync("git", args, { cwd: source });
    await git("init", "--quiet");
    await git("add", "-A");
    await git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "-m", "rules");
    // Bash can read .bashrc when these are set, writing shell startup output
    // into the local upload-pack's Git protocol.
    const { SSH_CLIENT: _sshClient, SSH2_CLIENT: _ssh2Client, ...localEnv } = process.env;
    // git reads github.com as the local repo, so nothing is fetched.
    const env = {
      ...localEnv,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: `url.file://${source}.insteadOf`,
      GIT_CONFIG_VALUE_0: "https://github.com/acme/rules.git",
    };
    const adhere = async (...args: ReadonlyArray<string>) =>
      (await execFileAsync("bun", [main, ...args], { cwd: root, env })).stdout;

    expect(await adhere("list", "acme/rules")).toBe(
      [
        "data/columns  (TypeScript, which list does not run)",
        "data/ports    A port must be branded.",
        "style/small   A file should be small.",
        "",
      ].join("\n"),
    );
    const installed = ".adhere/rules/acme/rules";
    expect(await adhere("install", "acme/rules/data")).toBe(
      `created: ${installed}/data/columns/, ${installed}/data/ports/\nskipped: none\n`,
    );
    expect(await adhere("install", "acme/rules")).toBe(
      `created: ${installed}/style/small/\nskipped: ${installed}/data/columns/, ${installed}/data/ports/\n`,
    );
    expect(await readFile(join(root, installed, "data", "ports", "RULE.md"), "utf8")).toBe(ports);
    // A rule's directory comes whole, with the helpers its RULE.ts imports.
    expect((await readdir(join(root, installed, "data", "columns"))).sort()).toEqual([
      "RULE.ts",
      "schema.ts",
    ]);
    expect((await readdir(join(root, installed))).sort()).toEqual(["data", "style"]);
  });

  it("uses inferred native context with no config or tsconfig and preserves explicit code-only opt-out", async () => {
    const root = await mkdtemp(join(tmpdir(), "adhere-default-reads-"));
    const { TYPESAFE_API_KEY: _key, ...env } = process.env;
    const options = {
      cwd: root,
      env: { ...env, XDG_CONFIG_HOME: join(root, "config") },
      timeout: 20_000,
    };
    const source = "export const port = 3000;\n";
    const capturedFile = join(root, "inferred-state.json");
    try {
      await mkdir(join(root, ".adhere", "rules", "ports"), { recursive: true });
      await writeFile(join(root, "server.ts"), source, "utf8");
      await writeFile(
        join(root, ".adhere", "rules", "ports", "RULE.ts"),
        `export default {
          description: "A port must be named.",
          must: "const port = PORT;",
          appendState: async (state, file, bun) => {
            await bun.write(${JSON.stringify(capturedFile)}, JSON.stringify(state));
            return {};
          },
        };\n`,
        "utf8",
      );
      const planned = await execFileAsync("bun", [main, "lint", "--limit", "0"], {
        ...options,
        env: {
          ...options.env,
          ADHERE_TYPESCRIPT_PACKAGE: join(root, "missing-compiler", "package.json"),
        },
      });
      expect(planned.stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
      await expect(stat(capturedFile)).rejects.toMatchObject({ code: "ENOENT" });
      await expect(stat(join(root, "tsconfig.json"))).rejects.toMatchObject({ code: "ENOENT" });

      const refused = await execFileAsync("bun", [main, "lint"], options).then(
        () => undefined,
        (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) =>
          error,
      );
      expect(refused?.code).toBe(1);
      expect(`${refused?.stdout}${refused?.stderr}`).toContain("TYPESAFE_API_KEY");
      expect(`${refused?.stdout}${refused?.stderr}`).not.toMatch(/reinstall|add a root tsconfig/i);
      expect(refused?.stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
      const state: Readonly<Record<string, unknown>> = JSON.parse(
        await readFile(capturedFile, "utf8"),
      );
      expect(state).toMatchObject({
        code: { "1": source },
        workspacePackages: {},
        symbols: { port: "```typescript\n3000\n```" },
        references: {},
      });
      await expect(stat(join(root, ".adhere", "config.ts"))).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(stat(join(root, "tsconfig.json"))).rejects.toMatchObject({ code: "ENOENT" });

      await writeFile(
        join(root, ".adhere", "config.ts"),
        "export default { reads: [] };\n",
        "utf8",
      );
      const { stderr } = await execFileAsync("bun", [main, "lint", "--limit", "0"], options);
      expect(stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
      await expect(stat(join(root, "tsconfig.json"))).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);

  it.each([
    { policy: "default", reads: undefined },
    { policy: "code-only", reads: [] },
  ])(
    "prepares $policy context for a request hook before refusing an absent API key",
    async ({ reads }) => {
      const root = await mkdtemp(join(tmpdir(), "adhere-default-context-"));
      const { TYPESAFE_API_KEY: _key, ...env } = process.env;
      const library = "export const value = 1;\n";
      const caller = 'import { value } from "orders-core";\nconsole.log(value);\n';
      const capturedFile = join(root, "request-state.json");
      try {
        for (const directory of [".adhere", "packages/orders"]) {
          await mkdir(join(root, directory), { recursive: true });
        }
        const files: Readonly<Record<string, string>> = {
          "packages/orders/library.ts": library,
          "packages/orders/caller.ts": caller,
          "package.json": JSON.stringify({ workspaces: ["packages/*"] }),
          "packages/orders/package.json": JSON.stringify({
            name: "orders-core",
            exports: "./library.ts",
          }),
          ...(reads === undefined
            ? {
                "tsconfig.json": JSON.stringify({
                  compilerOptions: {
                    target: "ES2022",
                    module: "ESNext",
                    moduleResolution: "Bundler",
                    types: [],
                  },
                  files: ["packages/orders/library.ts", "packages/orders/caller.ts"],
                }),
              }
            : {}),
          ".adhere/config.ts": `export default {
          ${reads === undefined ? "" : "reads: [],"}
          rules: {
            named: {
              description: "A value must be named.",
              must: "export const value = VALUE;",
              appendState: async (state, file, bun) => {
                await bun.write(${JSON.stringify(capturedFile)}, JSON.stringify({ state, file }));
                return {};
              },
            },
          },
        };\n`,
        };
        for (const [file, text] of Object.entries(files)) {
          await writeFile(join(root, file), text, "utf8");
        }
        const planning = await execFileAsync(
          "bun",
          [main, "lint", "--limit", "0", "--filter", "packages/orders/caller.ts"],
          {
            cwd: root,
            env: {
              ...env,
              XDG_CONFIG_HOME: join(root, "config"),
              ADHERE_TYPESCRIPT_PACKAGE: join(root, "missing-compiler", "package.json"),
            },
            timeout: 20_000,
          },
        );
        expect(planning.stderr.split("\n")[0]).toBe(
          "1 file matching the filter and 1 rule: 1 check.",
        );
        await expect(stat(capturedFile)).rejects.toMatchObject({ code: "ENOENT" });

        // Only execution runs the hook; isolated missing credentials prevent HTTP.
        const refused = await execFileAsync(
          "bun",
          [main, "lint", "--filter", "packages/orders/caller.ts"],
          {
            cwd: root,
            env: { ...env, XDG_CONFIG_HOME: join(root, "config") },
            timeout: 20_000,
          },
        ).then(
          () => undefined,
          (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) =>
            error,
        );
        expect(refused?.code).toBe(1);
        expect(`${refused?.stdout}${refused?.stderr}`).toContain("TYPESAFE_API_KEY");
        const captured: {
          readonly state: Readonly<Record<string, unknown>>;
          readonly file: { readonly path: string; readonly contents: string };
        } = JSON.parse(await readFile(capturedFile, "utf8"));
        expect(captured.file).toEqual({
          path: join(root, "packages/orders/caller.ts"),
          contents: caller,
        });
        if (reads === undefined) {
          expect(captured.state).toMatchObject({
            code: { "1": caller },
            workspacePackages: { "orders-core": "packages/orders" },
            symbols: { value: "```typescript\n1\n```" },
            references: { value: { "packages/orders/library.ts": library.trimEnd() } },
          });
        } else {
          expect(captured.state).toEqual({ code: { "1": caller } });
          await expect(stat(join(root, "tsconfig.json"))).rejects.toMatchObject({ code: "ENOENT" });
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
    30_000,
  );

  it("takes several presets, repeated or separated by commas, and refuses an unknown one", async () => {
    const root = join(tmpdir(), `adhere-presets-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "index.ts"), "export const x = 1;\n", "utf8");
    await writeFile(join(root, "adhere.config.ts"), "export default { reads: [] };\n", "utf8");
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

    const refused = await execFileAsync("bun", [main, "lint", "--preset", "effect,vue"], {
      cwd: root,
    }).then(
      () => undefined,
      (error: { readonly code: number; readonly stdout: string; readonly stderr: string }) => error,
    );
    expect(refused?.code).toBe(1);
    expect(`${refused?.stdout}${refused?.stderr}`).toContain("(not vue)");
  });

  it("turns a preset rule off by its id, takes a rule of a preset the run leaves out, and refuses one no rule has", async () => {
    const root = join(tmpdir(), `adhere-overrides-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "index.ts"), "export const x = 1;\n", "utf8");
    await writeFile(join(root, "adhere.config.ts"), "export default { reads: [] };\n", "utf8");
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const lint = () =>
      execFileAsync("bun", [main, "lint", "--preset", "effect", "--limit", "0"], { cwd: root });
    const rules = async () =>
      Number(/(\d+) rules?/.exec((await lint()).stderr.split("\n")[0] ?? "")?.[1]);
    const config = (overrides: string) =>
      writeFile(
        join(root, "adhere.config.ts"),
        `export default { reads: [], overrides: ${overrides} };\n`,
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
    for (const directory of [".adhere/rules/named", "src", "gen"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    const files: Readonly<Record<string, string>> = {
      "src/a.ts": "export const a = 1;\n",
      "gen/b.ts": "export const b = 1;\n",
      "adhere.config.ts": 'export default { reads: [], exclude: ["gen/**"] };\n',
      ".adhere/rules/named/RULE.md":
        "---\ndescription: A constant must be named.\n---\n\nexport const named = 1;\n",
    };
    for (const [file, text] of Object.entries(files)) {
      await writeFile(join(root, file), text, "utf8");
    }
    // --limit 0 plans the run and judges nothing, so nothing is sent to Jev.
    const { stderr } = await execFileAsync("bun", [main, "lint", "--limit", "0"], { cwd: root });
    expect(stderr.split("\n")[0]).toBe("1 file and 1 rule: 1 check.");
  });

  it("reads a rule written in TypeScript with the package's defineRule, and not the config beside it", async () => {
    const root = join(tmpdir(), `adhere-ts-rule-${Date.now()}`);
    for (const directory of [".adhere/rules/ports", "src"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    const files: Readonly<Record<string, string>> = {
      "src/a.ts": "export const port = 3000;\n",
      ".adhere/config.ts":
        'import { defineConfig } from "@drkmttr/adhere";\n\nexport default defineConfig({ reads: [] });\n',
      ".adhere/rules/ports/RULE.ts": [
        'import { defineRule } from "@drkmttr/adhere";',
        "",
        "export default defineRule({",
        '  description: "A port must be a branded integer.",',
        '  must: "const port = Port.make(3000);",',
        "  appendState: (state) => ({ sections: Object.keys(state.code).length }),",
        "});",
        "",
      ].join("\n"),
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
    for (const directory of [".adhere/rules/named", "src", "test"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    const files: Readonly<Record<string, string>> = {
      "src/a.ts": "export const a = 1;\n",
      "src/a.test.ts": "export const t = 1;\n",
      "test/helper.ts": "export const h = 1;\n",
      "adhere.config.ts": "export default { reads: [] };\n",
      ".adhere/rules/named/RULE.md":
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
    await mkdir(join(root, ".adhere", "rules", "tests"), { recursive: true });
    await writeFile(
      join(root, ".adhere", "rules", "tests", "RULE.md"),
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
    await mkdir(join(root, ".adhere", "rules", "ports"), { recursive: true });
    await writeFile(join(root, "adhere.config.ts"), "export default { reads: [] };\n", "utf8");
    await writeFile(
      join(root, ".adhere", "rules", "ports", "RULE.md"),
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
