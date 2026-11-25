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
  refreshReadme,
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
    JSON.stringify({ name: "@acme/standards", exports: { "./oxlint": "./oxlint/index.js" } }),
  );
  await put(root, "oxlint/rules.json", "{}\n");
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
    expect(readme).toContain(`${README_START}\n<a id="adhere-contents"></a>`);
    expect(readme).toContain("- [Rules](#adhere-rules)");
    expect(readme).toContain("- [Lint settings](#adhere-lint-settings)");
    expect(readme).toContain('<a id="adhere-rule-style-names"></a>');
    expect(readme).toContain(
      "<summary><h3><code>style/names</code></h3></summary>\n\nNames say what happens.",
    );
    expect(readme).toContain("Source: [`style/names`](./.adhere/rules/style/names/RULE.md).");
    expect(readme).toContain(
      "Source: [`style/small-files`](./.adhere/rules/style/small-files/RULE.md).",
    );
    expect(readme).toContain("**[↑ Back to contents](#adhere-contents)**");
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
      "oxlint/rules.json",
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
    expect(readme).toContain('<a id="adhere-lint-settings"></a>\n\n### Lint settings\n');
    expect(readme).toContain("- [`typescript/no-explicit-any`](./oxlint/rules.json):");
    expect(readme).toContain("enabled as `error`");
    expect(readme).toContain("- [`unicorn/filename-case`](./oxlint/rules.json):");
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
      "oxlint/rules.json",
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
      '<a id="adhere-custom-lint-plugins"></a>\n\n### Custom lint plugins\n',
    );
    expect(readme).toContain(
      "- [`acme/no-foo`](./oxlint/plugins/acme.js): custom plugin `acme`, enabled as `error`.",
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

  it("orders rules by topic and id, including bare ids, without nesting the contents", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(root, ".adhere/rules/beta/second/RULE.md", rule("Second."));
    await put(root, ".adhere/rules/alpha/first/RULE.md", rule("First."));
    await put(root, ".adhere/rules/legacy/RULE.md", rule("A rule with no topic."));

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    const contents = readme.slice(readme.indexOf("### Contents"), readme.indexOf("## Rules"));
    expect([...contents.matchAll(/^- \[([^\]]+)\]/gm)].map((match) => match[1])).toEqual([
      "Rules",
      "Lint settings",
      "Custom lint plugins",
    ]);
    expect(contents).not.toMatch(/^ +- /m);
    expect(
      [...readme.matchAll(/<summary><h3><code>([^<]+)<\/code><\/h3><\/summary>/g)].map(
        (match) => match[1],
      ),
    ).toEqual(["alpha/first", "beta/second", "legacy"]);
    expect(readme).toContain('<a id="adhere-rule-legacy"></a>');
    expect(readme).toContain("Source: [`legacy`](./.adhere/rules/legacy/RULE.md).");
    expect((await refresh(root)).changed).toBe(false);
  });

  it("remembers two rules whose ids slug alike as distinct anchors", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(root, ".adhere/rules/style/a-b/RULE.md", rule("Hyphenated."));
    await put(root, ".adhere/rules/style/a.b/RULE.md", rule("Dotted."));

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(
      [...readme.matchAll(/<a id="(adhere-rule-[^"]+)"><\/a>/g)].map((match) => match[1]),
    ).toEqual(["adhere-rule-style-a-b", "adhere-rule-style-a-b-2"]);
  });

  it("embeds a Markdown rule's body, keeping its examples and rebasing its links", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/linked/RULE.md",
      [
        "---",
        "description: A rule links what it names.",
        "---",
        "",
        "Read [the sibling](./sibling.md) and ![a picture](./shot.png), and the",
        "code under [Must](#must).",
        "",
        "## Must",
        "",
        "```ts",
        "const good = 1;",
        "```",
        "",
        "## Never",
        "",
        "```ts",
        'const bad = "<value>";',
        "```",
        "",
      ].join("\n"),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).not.toContain("description: A rule links what it names.");
    expect(readme).toContain("Read [the sibling](./.adhere/rules/style/linked/sibling.md)");
    expect(readme).toContain("![a picture](./.adhere/rules/style/linked/shot.png)");
    expect(readme).toContain("code under [Must](#adhere-heading-style-linked-must).");
    expect(readme).toContain('<a id="adhere-heading-style-linked-must"></a>\n\n##### Must\n');
    expect(readme).toContain("##### Never");
    expect(readme).toContain("```ts\nconst good = 1;\n```");
    expect(readme).toContain('```ts\nconst bad = "<value>";\n```');
    expect(readme).toContain("Source: [`style/linked`](./.adhere/rules/style/linked/RULE.md).");
  });

  it("keeps a heading's anchor apart from a rule's and resolves fragments by their source name", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/a/RULE.md",
      [
        "---",
        "description: Rule a.",
        "---",
        "",
        "See [the first must](#must), [the second must](#must-1), [the file](#nowhere),",
        "and the [rule beside it](./b/RULE.md).",
        "",
        "## b",
        "",
        "## Must",
        "",
        "## Must",
        "",
      ].join("\n"),
    );
    await put(root, ".adhere/rules/style/a-b/RULE.md", rule("Rule a-b."));

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    // The rule `style/a-b` and the heading `b` of `style/a` name different anchors.
    expect(readme).toContain('<a id="adhere-rule-style-a-b"></a>');
    expect(readme).toContain('<a id="adhere-heading-style-a-b"></a>');
    expect(readme).toContain("[the first must](#adhere-heading-style-a-must)");
    // GitHub names the second `Must` `#must-1`; the guide names it after the body.
    expect(readme).toContain('<a id="adhere-heading-style-a-must-2"></a>\n\n##### Must\n');
    expect(readme).toContain("[the second must](#adhere-heading-style-a-must-2)");
    expect(readme).toContain("[the file](./.adhere/rules/style/a/RULE.md#nowhere)");
    expect(readme).toContain("[rule beside it](./.adhere/rules/style/a/b/RULE.md)");
  });

  it("rewrites only prose: code spans and indented code stay, a heading's link rebases", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/inline/RULE.md",
      [
        "---",
        "description: Code stays as written.",
        "---",
        "",
        "Show ``a `[text](./guide.md)` b`` and `handlers[type](event)`, then",
        "[the sibling](./sibling.md).",
        "",
        "    [indented](./hidden.md)",
        "",
        "## See [the sibling](./sibling.md)",
        "",
      ].join("\n"),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("Show ``a `[text](./guide.md)` b`` and `handlers[type](event)`, then");
    expect(readme).toContain("[the sibling](./.adhere/rules/style/inline/sibling.md).");
    expect(readme).toContain("    [indented](./hidden.md)");
    expect(readme).toContain("##### See [the sibling](./.adhere/rules/style/inline/sibling.md)");
  });

  it("rebases links in list items and still keeps indented code", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/lists/RULE.md",
      [
        "---",
        "description: Lists and code.",
        "---",
        "",
        "    [indented](./hidden.md)",
        "",
        "- Item",
        "",
        "      [also code](./item.md)",
        "",
        "- Related:",
        "    - [Small](../small/RULE.md)",
        "",
        "- Also [deep](./deep/RULE.md)",
        "",
        "Paragraph [wrapped](./wrapped.md) over",
        "    two [lines](./lines.md).",
        "",
      ].join("\n"),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("    [indented](./hidden.md)");
    expect(readme).toContain("      [also code](./item.md)");
    expect(readme).toContain("[Small](./.adhere/rules/style/lists/../small/RULE.md)");
    expect(readme).toContain("[deep](./.adhere/rules/style/lists/deep/RULE.md)");
    expect(readme).toContain("    two [lines](./.adhere/rules/style/lists/lines.md).");
  });

  it("rebases a reference definition's target and keeps code as written", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/refs/RULE.md",
      [
        "---",
        "description: References and code.",
        "---",
        "",
        "Read [the guide][guide] and ![a shot][shot], and `[not a link](./x.md)`.",
        "",
        "[guide]: ./guide.md",
        "[shot]: ../shot.png",
        "",
        "## Must",
        "",
        "```ts",
        'const ref = "[also](./not.md)";',
        "```",
        "",
      ].join("\n"),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    expect(readme).toContain("Read [the guide][guide] and ![a shot][shot]");
    expect(readme).toContain("[guide]: ./.adhere/rules/style/refs/guide.md");
    expect(readme).toContain("[shot]: ./.adhere/rules/style/refs/../shot.png");
    expect(readme).toContain("`[not a link](./x.md)`");
    expect(readme).toContain('const ref = "[also](./not.md)";');
  });

  it("closes a fence a rule leaves open before the rest of the README", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/open/RULE.md",
      ["---", "description: Code.", "---", "", "## Must", "", "```ts", "const x = 1;", ""].join(
        "\n",
      ),
    );
    await put(
      root,
      ".adhere/rules/style/after/RULE.md",
      ["---", "description: After.", "---", "", "See [the open rule](./open/RULE.md).", ""].join(
        "\n",
      ),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    // The guide closes the fence before `Source:`, so nothing after it is code.
    expect(readme).toContain("```ts\nconst x = 1;\n```\n\nSource: [`style/open`]");
    expect(readme.match(/^ {0,3}```/gm)?.length).toBe(2);
    expect(readme).toContain("See [the open rule](./.adhere/rules/style/after/open/RULE.md).");
    expect(readme).toContain("### Lint settings");
    expect(readme).toContain("### Custom lint plugins");
  });

  it("keeps an indented heading inside its list item", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/list/RULE.md",
      [
        "---",
        "description: Lists.",
        "---",
        "",
        "- Item",
        "",
        "  ### Sub",
        "",
        "  - Nested [link](./x.md)",
        "",
      ].join("\n"),
    );

    await refresh(root);
    const readme = await readFile(join(root, "README.md"), "utf8");
    // The anchor shares the heading's indent, so the list item does not end there.
    expect(readme).toContain(
      '- Item\n\n  <a id="adhere-heading-style-list-sub"></a>\n\n  ###### Sub',
    );
    expect(readme).toContain("  - Nested [link](./.adhere/rules/style/list/x.md)");
  });

  it("refuses a rule whose body carries a marker", async () => {
    const root = await project();
    await shared(root);
    await put(root, "README.md", "# Standards\n");
    await put(
      root,
      ".adhere/rules/style/marked/RULE.md",
      `---\ndescription: A rule.\n---\n\n## Must\n\n\`\`\`ts\n${README_START}\n\`\`\`\n`,
    );

    await expect(refresh(root)).rejects.toThrow(
      /has an adhere rules marker in its description or body/,
    );
    expect(await readFile(join(root, "README.md"), "utf8")).toBe("# Standards\n");
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
    expect(readme).toContain('<a id="adhere-rule-effect-typed"></a>');
    expect(readme).toContain("This rule is TypeScript");
    expect(readme).not.toContain("(TypeScript, which list does not run)");
    expect(readme).toContain("[`effect/typed`](./.adhere/rules/effect/typed/RULE.ts).");
    expect(readme).not.toContain("must not run a rule");
    expect(readme).not.toContain("throw new Error");
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
      "Source: [`style/name-domain-actions`](./.adhere/rules/style/name-domain-actions/RULE.md).",
    );
    // The rules' own examples are embedded, with their headings demoted.
    expect(readme).toContain("##### Should");
    expect(readme).toContain("##### Should not");
    expect(readme).toContain("export const parsePort = (value: string) =>");
    // Install first, the generated guide, then contributing, setup, and release.
    expect(readme.indexOf("## Use these rules")).toBeLessThan(
      readme.indexOf("## Rules and lint settings"),
    );
    expect(readme.indexOf("## Rules and lint settings")).toBeLessThan(
      readme.indexOf("## Add a rule"),
    );
    expect(readme.indexOf("## Add a rule")).toBeLessThan(
      readme.indexOf("## Add a lint setting or plugin"),
    );
    expect(readme.indexOf("## Add a lint setting or plugin")).toBeLessThan(
      readme.indexOf("## Setup"),
    );
    expect(readme.indexOf("## Setup")).toBeLessThan(readme.indexOf("## Tag a release"));
  });
});

describe("adhere rules readme", () => {
  const run = (
    cwd: string,
    args: ReadonlyArray<string> = [],
    env?: Readonly<Record<string, string | undefined>>,
  ) =>
    exec("bun", [main, "rules", "readme", ...args], { cwd, ...(env === undefined ? {} : { env }) });

  const gitAt = async (cwd: string, args: ReadonlyArray<string>) =>
    (await exec("git", args, { cwd })).stdout.trim();

  const gitIn = (cwd: string) => async (args: ReadonlyArray<string>) => {
    await exec("git", args, { cwd });
  };

  /**
   * Bash can read .bashrc when these are set, writing shell startup output into
   * the local upload-pack's Git protocol.
   */
  const localEnv = () => {
    const { SSH_CLIENT: _sshClient, SSH2_CLIENT: _ssh2Client, ...rest } = process.env;
    return rest;
  };

  /**
   * Bare repos standing in for `acme/standards` and `acme/app`: the shared repo
   * with one rule and a README, its index current already when `current`, and a
   * consumer repo. The environment rewrites both GitHub URLs to them and
   * commits with an identity a fresh clone lacks.
   */
  const standards = async ({ current = false }: { readonly current?: boolean } = {}) => {
    const root = await project();
    const remote = join(root, "standards.git");
    const app = join(root, "app.git");
    for (const bare of [remote, app]) {
      await exec("git", ["init", "--quiet", "--bare", "--initial-branch", "main", bare]);
    }
    const seed = join(root, "standards-seed");
    await exec("git", ["init", "--quiet", "--initial-branch", "main", seed]);
    // No ./oxlint export: a rules-only repo still has a README index to publish.
    await put(seed, "package.json", JSON.stringify({ name: "@acme/standards" }));
    await put(seed, "README.md", "# Standards\n");
    await put(seed, ".adhere/rules/style/small-files/RULE.md", rule("Files stay small."));
    if (current) await Effect.runPromise(refreshReadme(seed));
    const consumerSeed = join(root, "app-seed");
    await exec("git", ["init", "--quiet", "--initial-branch", "main", consumerSeed]);
    await put(consumerSeed, "package.json", JSON.stringify({ name: "app" }));
    await put(consumerSeed, "README.md", "# App\n");
    for (const [directory, bare] of [
      [seed, remote],
      [consumerSeed, app],
    ] as const) {
      const git = gitIn(directory);
      await git(["add", "-A"]);
      await git(["-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "-m", "seed"]);
      await git(["remote", "add", "origin", bare]);
      await git(["push", "--quiet", "origin", "main"]);
    }
    return {
      remote,
      app,
      env: {
        ...localEnv(),
        GIT_CONFIG_COUNT: "4",
        GIT_CONFIG_KEY_0: `url.file://${remote}.insteadOf`,
        GIT_CONFIG_VALUE_0: "https://github.com/acme/standards.git",
        GIT_CONFIG_KEY_1: `url.file://${app}.insteadOf`,
        GIT_CONFIG_VALUE_1: "https://github.com/acme/app.git",
        GIT_CONFIG_KEY_2: "user.name",
        GIT_CONFIG_VALUE_2: "adhere tests",
        GIT_CONFIG_KEY_3: "user.email",
        GIT_CONFIG_VALUE_3: "adhere@example.com",
      },
    };
  };

  /** A repo that installs rules from elsewhere, with a GitHub origin when named. */
  const consumer = async (origin?: string) => {
    const root = await project();
    await put(root, "package.json", JSON.stringify({ name: "app" }));
    if (origin !== undefined) {
      const git = gitIn(root);
      await git(["init", "--quiet"]);
      await git(["remote", "add", "origin", origin]);
    }
    return root;
  };

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
    expect(failure.stderr).toContain("adhere rules readme org/repo");
  });

  it("pushes a named repo's refreshed README on a review branch", async () => {
    const { remote, env } = await standards();
    const root = await consumer();
    const before = await gitAt(remote, ["rev-parse", "main"]);

    const { stdout } = await run(root, ["acme/standards"], env);
    const branch = /^Pushed (adhere\/readme-\d+) to acme\/standards\.$/m.exec(stdout)?.[1];
    expect(branch).toBeDefined();
    expect(stdout).toContain("Updated README.md: 1 rule, 0 enabled lint settings.");
    expect(stdout).toContain(
      `Open the pull request: https://github.com/acme/standards/compare/${branch}?expand=1`,
    );
    // README.md alone is committed, on its own branch; the default branch stays put.
    expect(await gitAt(remote, ["show", "--name-only", "--format=", `${branch}`])).toBe(
      "README.md",
    );
    expect(await gitAt(remote, ["show", `${branch}:README.md`])).toContain(README_START);
    expect(await gitAt(remote, ["rev-parse", "main"])).toBe(before);
    // The checkout the command ran in is left alone.
    expect(await readFile(join(root, "README.md"), "utf8").catch(() => undefined)).toBeUndefined();
  });

  it("falls back to the standards repo the origin's owner names", async () => {
    const { remote, app, env } = await standards();
    const root = await consumer("https://github.com/acme/app.git");
    const appRefs = await gitAt(app, ["for-each-ref", "--format=%(refname)"]);

    // The origin names acme/app; its org's shared rules are acme/standards.
    expect((await run(root, [], env)).stdout).toContain(
      "Open the pull request: https://github.com/acme/standards/compare/adhere/readme-",
    );
    const refs = await gitAt(remote, [
      "for-each-ref",
      "--format=%(refname:short)",
      "refs/heads/adhere/",
    ]);
    const branch = refs.split("\n")[0];
    expect(branch).toMatch(/^adhere\/readme-\d+$/);
    expect(await gitAt(remote, ["show", `${branch}:README.md`])).toContain(README_START);
    // The consumer repo itself is never cloned or pushed to.
    expect(await gitAt(app, ["for-each-ref", "--format=%(refname)"])).toBe(appRefs);
  });

  it("pushes nothing when the README is already current", async () => {
    const { remote, env } = await standards({ current: true });
    const root = await consumer();
    const refs = await gitAt(remote, ["for-each-ref", "--format=%(refname)"]);

    expect((await run(root, ["acme/standards"], env)).stdout).toBe(
      "Unchanged README.md: 1 rule, 0 enabled lint settings.\nNo change, so nothing was pushed.\n",
    );
    expect(await gitAt(remote, ["for-each-ref", "--format=%(refname)"])).toBe(refs);
  });

  it("names the repo to refresh when the origin is not GitHub", async () => {
    const root = await consumer("https://gitlab.com/acme/standards.git");
    const failure = await run(root).catch((error: { code: number; stderr: string }) => error);
    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain("is not a GitHub repo");
    expect(failure.stderr).toContain("adhere rules readme org/repo");
  });
});
