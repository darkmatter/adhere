import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { Effect } from "effect";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { initProject } from "../src/init.ts";
import {
  README_END,
  README_START,
  refreshIndexIfShared,
  refreshSharedReadme,
  validateReadme,
} from "../src/readme.ts";

const exec = promisify(execFile);
const main = join(process.cwd(), "src/main.ts");
const roots: string[] = [];

const project = async () => {
  const root = await mkdtemp(join(tmpdir(), "adhere-readme-"));
  roots.push(root);
  return root;
};

const put = async (root: string, path: string, text: string) => {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
};

const shared = async (root: string) => {
  await put(
    root,
    "package.json",
    JSON.stringify({ name: "@acme/standards", exports: { "./lint": "./lint/index.js" } }),
  );
  await put(root, "lint/rules.json", "{}\n");
};

const rule = (description: string) =>
  `---\ndescription: ${description}\n---\n\n## Must\n\n\`\`\`ts\nconst value = 1;\n\`\`\`\n`;

const refresh = (root: string) => Effect.runPromise(refreshSharedReadme(root));

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("shared README index", () => {
  it("keeps handwritten prose, lists rules deterministically, and follows renames and deletions", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n\nHandwritten setup notes.\n");
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));
    await put(root, ".adhere/rules/style/names/RULE.md", rule("Names say what happens."));

    const first = await refresh(root);
    expect(first.changed).toBe(true);
    expect(first.message).toBe("Updated README.md: 2 rules, 0 enabled lint settings.");
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("# Standards\n\nHandwritten setup notes.");
    expect(readme).toContain(`${README_START}\n**Rules**`);
    expect(readme).toContain(
      "- [`style/names`](./.adhere/rules/style/names/RULE.md): Names say what happens.",
    );
    expect(readme).toContain(
      "- [`style/small-files`](./.adhere/rules/style/small-files/RULE.md): Files stay small.",
    );
    expect(readme.indexOf("style/names")).toBeLessThan(readme.indexOf("style/small-files"));
    expect(readme).toContain(`${README_END}\n`);

    const second = await refresh(root);
    expect(second.changed).toBe(false);
    expect(second.message).toBe("Unchanged README.md: 2 rules, 0 enabled lint settings.");
    expect(await readFile(join(root, "README.md"), "utf8")).toBe(readme);

    await rm(join(root, ".adhere/rules/style/names"), { recursive: true });
    await put(root, ".adhere/rules/style/domain-names/RULE.md", rule("Names say what happens."));
    await put(root, ".adhere/rules/style/extra/RULE.md", rule("Extra."));
    await refresh(root);
    const renamed = await readFile(join(root, "README.md"), "utf8");
    expect(renamed).not.toContain("style/names");
    expect(renamed).toContain("style/domain-names");
    expect(renamed).toContain("style/extra");
    await rm(join(root, ".adhere/rules/style/extra"), { recursive: true });
    await refresh(root);
    expect(await readFile(join(root, "README.md"), "utf8")).not.toContain("style/extra");
  });

  it("lists enabled native settings with their severity and leaves off settings out", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      "lint/rules.json",
      `${JSON.stringify(
        {
          rules: {
            "typescript/no-explicit-any": "error",
            "unicorn/filename-case": ["warn", { case: "kebabCase" }],
            "eslint/no-console": "off",
            "no-var": 0,
            eqeqeq: ["off", "smart"],
          },
        },
        null,
        2,
      )}\n`,
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("- [`typescript/no-explicit-any`](./lint/rules.json):");
    expect(readme).toContain("enabled as `error`");
    expect(readme).toContain("- [`unicorn/filename-case`](./lint/rules.json):");
    expect(readme).toContain("enabled as `warn`");
    expect(readme).not.toContain("eslint/no-console");
    expect(readme).not.toContain("no-var");
    expect(readme).not.toContain("eqeqeq");
  });

  it("links a custom plugin's enabled rules to its file and omits its off rules", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      "lint/rules.json",
      `${JSON.stringify(
        {
          jsPlugins: [
            { name: "acme", specifier: "./plugins/acme.js" },
            { name: "vendor", specifier: "vendor-package" },
          ],
          rules: {
            "acme/no-foo": "error",
            "acme/skip": "off",
            "vendor/thing": "warn",
          },
        },
        null,
        2,
      )}\n`,
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain(
      "- [`acme/no-foo`](./lint/plugins/acme.js): custom plugin `acme`, enabled as `error`.",
    );
    expect(readme).not.toContain("acme/skip");
    expect(readme).toContain("- `vendor/thing`: custom plugin `vendor`, enabled as `warn`.");
  });

  it("refuses malformed or duplicate markers without writing", async () => {
    const root = await project();
    await shared(root);
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));
    for (const previous of [
      `${README_START}\n`,
      `${README_END}\n`,
      `${README_END}\n${README_START}\n`,
      `${README_START}\n${README_START}\n${README_END}\n`,
      `${README_START}\n${README_END}\n${README_END}\n`,
    ]) {
      await put(root, "README.md", previous);
      await expect(refresh(root)).rejects.toThrow(/malformed or duplicate/);
      expect(await readFile(join(root, "README.md"), "utf8")).toBe(previous);
    }
  });

  it("refuses a directory that is not a shared repo and writes no README", async () => {
    const root = await project();
    await put(root, "package.json", JSON.stringify({ name: "app" }));
    await put(root, "README.md", "# App\n");
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));

    await expect(refresh(root)).rejects.toThrow(/not a shared rules repo/);
    expect(await readFile(join(root, "README.md"), "utf8")).toBe("# App\n");
  });

  it("leaves a legacy rules-only repo without an index", async () => {
    const root = await project();
    await put(root, "package.json", JSON.stringify({ name: "legacy" }));
    await put(root, "README.md", "# Legacy\n");
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));

    expect(await Effect.runPromise(refreshIndexIfShared(root))).toBe(false);
    expect(await readFile(join(root, "README.md"), "utf8")).toBe("# Legacy\n");
  });

  it("refreshes a shared repo's index from the org guard", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));

    expect(await Effect.runPromise(refreshIndexIfShared(root))).toBe(true);
    expect(await readFile(join(root, "README.md"), "utf8")).toContain(README_START);
  });

  it("fails the org guard on malformed markers without writing", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", `${README_START}\n`);
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));

    await expect(Effect.runPromise(refreshIndexIfShared(root))).rejects.toThrow(
      /malformed or duplicate/,
    );
    expect(await readFile(join(root, "README.md"), "utf8")).toBe(`${README_START}\n`);
  });

  it("checks README markers before a local writer starts", async () => {
    const root = await project();
    await put(root, "README.md", `${README_START}\n`);

    await expect(Effect.runPromise(validateReadme(root))).rejects.toThrow(/malformed or duplicate/);
    expect(await readFile(join(root, "README.md"), "utf8")).toBe(`${README_START}\n`);

    await put(root, "README.md", "# Standards\n");
    await expect(Effect.runPromise(validateReadme(root))).resolves.toBeUndefined();
    expect(await readFile(join(root, "README.md"), "utf8")).toBe("# Standards\n");
  });

  it("names a RULE.ts without running it", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/effect/typed/RULE.ts",
      'throw new Error("the README index must not run a rule");\n',
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain(
      "- [`effect/typed`](./.adhere/rules/effect/typed/RULE.ts): (TypeScript, which list does not run)",
    );
    expect((await refresh(root)).changed).toBe(false);
  });

  it("keeps an existing shared README's prose and refreshes only its block", async () => {
    const root = await project();
    await put(root, "package.json", '{ "name": "standards" }\n');
    await put(root, "README.md", "# Our standards\n\nHandwritten install notes.\n");
    await Effect.runPromise(initProject(root, { shared: "acme/standards" }));

    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("# Our standards\n\nHandwritten install notes.");
    expect(readme).not.toContain("## Use these rules");
    expect(readme).toContain(README_START);
    expect(readme).toContain("style/prefer-small-files");
  });

  it("scaffolds a shared README with its examples already in the managed index", async () => {
    const root = await project();
    await put(root, "package.json", '{ "name": "standards" }\n');
    await Effect.runPromise(initProject(root, { shared: "acme/standards" }));

    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("## Use these rules");
    expect(readme).toContain(README_START);
    expect(readme).toContain(
      "- [`style/name-domain-actions`](./.adhere/rules/style/name-domain-actions/RULE.md): A function must be named after the domain action it performs, never after a generic verb like handle.",
    );
    expect(readme).toContain(
      "- [`style/prefer-small-files`](./.adhere/rules/style/prefer-small-files/RULE.md): A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.",
    );
  });
});

describe("adhere rules readme", () => {
  const run = (cwd: string) => exec("bun", [main, "rules", "readme"], { cwd });

  it("refreshes locally and reports an unchanged second run", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(root, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));

    expect((await run(root)).stdout).toBe("Updated README.md: 1 rule, 0 enabled lint settings.\n");
    expect((await run(root)).stdout).toBe(
      "Unchanged README.md: 1 rule, 0 enabled lint settings.\n",
    );
  });

  it("fails clearly outside a shared repo", async () => {
    const root = await project();
    await put(root, "package.json", JSON.stringify({ name: "app" }));
    const failure = await run(root).catch((error: { code: number; stderr: string }) => error);
    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain("not a shared rules repo");
  });
});
