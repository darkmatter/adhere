import { access, mkdir, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Effect, FileSystem, Layer, Path, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { presetsOf } from "../src/config.ts";
import { initProject } from "../src/init.ts";
import { parseRuleMarkdown } from "../src/markdown.ts";
import { sharedPackageJson } from "../src/oxlint/shared.ts";
import { presetOf, presets, topicsOf, wholePresetOf } from "../src/presets.ts";
import { applicableRules, loadAdhereRuleSet, loadRules, shownId } from "../src/rules.ts";

import { strayingOf } from "../src/wording.ts";
import { realFileSystem, onDisk } from "./audit.fixtures.ts";

describe("markdown rules", () => {
  const parse = (text: string) => Effect.runPromise(parseRuleMarkdown(text, "rules/a.md"));

  it("front matter is the description and threshold; an untagged fence is code to write", async () => {
    const rule = await parse(
      [
        "---",
        "description: Ports are branded.",
        "threshold: 0.8",
        "---",
        "",
        "Why: a bare number accepts 70000.",
        "",
        "```ts",
        'const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "type Port = typeof Port.Type",
        "```",
        "",
      ].join("\n"),
    );
    expect(rule).toEqual({
      description: "Ports are branded.",
      threshold: 0.8,
      details: "Why: a bare number accepts 70000.",
      must: 'const Port = Schema.Int.pipe(Schema.brand("Port"))\ntype Port = typeof Port.Type',
    });
  });

  it("prose around the code is the rule's details, without the fences and the headings that name code", async () => {
    const rule = await parse(
      [
        "---",
        "description: Ports are branded.",
        "---",
        "",
        "Why: a bare number accepts 70000 and -1.",
        "",
        "## Must",
        "",
        "A port read from the environment is parsed once, at the edge.",
        "",
        "```ts",
        'const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "```",
        "",
        "## Never",
        "",
        "```ts",
        "const port: number = Number(process.env.PORT)",
        "```",
        "",
        "",
        "",
        "## Where it does not apply",
        "",
        "A port in a test fixture.",
        "",
      ].join("\n"),
    );
    expect(rule.details).toBe(
      [
        "Why: a bare number accepts 70000 and -1.",
        "",
        "A port read from the environment is parsed once, at the edge.",
        "",
        "## Where it does not apply",
        "",
        "A port in a test fixture.",
      ].join("\n"),
    );
    // A body that is all code, or code and its headings alone, has none.
    expect(await parse("---\ndescription: d\n---\nconst x = 1\n")).not.toHaveProperty("details");
    expect(
      await parse("---\ndescription: d\n---\n\n## Must\n\n```ts\na()\n```\n"),
    ).not.toHaveProperty("details");
  });

  it("without a fence, the whole body is code to write", async () => {
    const rule = await parse("---\ndescription: d\n---\nconst x = 1\n");
    expect(rule).toEqual({ description: "d", must: "const x = 1" });
  });

  it("fences tagged must and never, or should and should not, hold code under those words", async () => {
    const fenced = (...fences: ReadonlyArray<string>) =>
      parse(
        `---\ndescription: d\n---\n\n${fences.map((fence) => `\`\`\`${fence}\n\`\`\``).join("\n\n")}\n`,
      );
    expect(await fenced("ts never\nb()", "ts must\na()")).toEqual({
      description: "d",
      must: "a()",
      never: "b()",
    });
    expect(await fenced("ts should\na()", "ts should not\nb()")).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    // An untagged fence is code to write at the rule's level: should, in a guideline.
    expect(await fenced("ts\na()", "ts should not\nb()")).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    expect(await fenced("ts must not\nb()")).toEqual({ description: "d", never: "b()" });
  });

  it("a rule can be only code never to write", async () => {
    const rule = await parse(
      "---\ndescription: A module has no default export.\n---\n\n```ts never\nexport default {}\n```\n",
    );
    expect(rule).toEqual({
      description: "A module has no default export.",
      never: "export default {}",
    });
  });

  const body = (...lines: ReadonlyArray<string>) =>
    parse(["---", "description: d", "---", "", ...lines, ""].join("\n"));

  it("a heading of must and never, or should and should not, names the code in its section", async () => {
    expect(
      await body("## Must", "", "```ts", "a()", "```", "", "## Never", "", "```ts", "b()", "```"),
    ).toEqual({
      description: "d",
      must: "a()",
      never: "b()",
    });
    // In any case, with or without a colon or a closing run of #s.
    expect(
      await body("# should", "```ts", "a()", "```", "### Should not: ###", "```ts", "b()", "```"),
    ).toEqual({
      description: "d",
      should: "a()",
      shouldNot: "b()",
    });
    expect(await body("## Must not", "```ts", "b()", "```")).toEqual({
      description: "d",
      never: "b()",
    });
  });

  it("a deeper heading stays in the section above it, and the next heading at its level ends it", async () => {
    const rule = await body(
      "## Never",
      "",
      "### A bare number",
      "",
      "```ts",
      "b()",
      "```",
      "",
      "## Notes",
      "",
      "```ts",
      "a()",
      "```",
    );
    // Headings that name no code are prose, so they stay in the details.
    expect(rule).toEqual({
      description: "d",
      details: "### A bare number\n\n## Notes",
      must: "a()",
      never: "b()",
    });
  });

  it("a fence's own word wins over its heading's", async () => {
    const rule = await body("## Must", "", "```ts never", "b()", "```", "", "```ts", "a()", "```");
    expect(rule).toEqual({ description: "d", must: "a()", never: "b()" });
  });

  it("names a word only in a heading that is the word alone, outside any fence", async () => {
    expect(await body("## Why never", "", "```ts", "a()", "```")).toEqual({
      description: "d",
      details: "## Why never",
      must: "a()",
    });
    // A `#` line in a fence is code, so the fence after it is still under Never.
    expect(
      await body("## Never", "", "```sh", "# Must", "b", "```", "", "```sh", "c", "```"),
    ).toEqual({
      description: "d",
      never: "# Must\nb",
    });
  });

  it("front matter's tests says a rule judges test files, only them or as well", async () => {
    expect(await parse("---\ndescription: d\ntests: only\n---\na()\n")).toEqual({
      description: "d",
      tests: "only",
      must: "a()",
    });
    expect(await parse("---\ndescription: d\ntests: include\n---\na()\n")).toMatchObject({
      tests: "include",
    });
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown("---\ndescription: d\ntests: always\n---\na()\n", "rules/a.md"),
      ),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("front matter's appliesTo and excludeIf are JSON arrays of strings", async () => {
    expect(
      await parse(
        '---\ndescription: d\nappliesTo: ["a declared union"]\nexcludeIf: ["a Slack block", "a row"]\n---\na()\n',
      ),
    ).toEqual({
      description: "d",
      appliesTo: ["a declared union"],
      excludeIf: ["a Slack block", "a row"],
      must: "a()",
    });
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown(
          "---\ndescription: d\nexcludeIf: a Slack block\n---\na()\n",
          "rules/a.md",
        ),
      ),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("front matter's level makes a rule's findings warnings", async () => {
    expect(await parse("---\ndescription: d\nlevel: warning\n---\na()\n")).toEqual({
      description: "d",
      level: "warning",
      must: "a()",
    });
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\ndescription: d\nlevel: nit\n---\na()\n", "rules/a.md")),
    );
    expect(refused.message).toContain("rules/a.md");
  });

  it("refuses a body with no code, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\ndescription: d\n---\n\n", "rules/a.md")),
    );
    expect(refused.message).toContain("rules/a.md: the body needs code");
  });

  it("refuses a rule that is both a requirement and a guideline, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(
        parseRuleMarkdown(
          "---\ndescription: d\n---\n\n```ts must\na()\n```\n\n```ts should not\nb()\n```\n",
          "rules/a.md",
        ),
      ),
    );
    expect(refused.message).toBe(
      "rules/a.md: a rule is a requirement (must, never) or a guideline (should, should not), not both",
    );
  });

  it("refuses a file without a description, naming the file", async () => {
    const refused = await Effect.runPromise(
      Effect.flip(parseRuleMarkdown("---\nthreshold: 0.8\n---\ncode", "rules/a.md")),
    );
    expect(refused._tag).toBe("ConfigUnavailable");
    expect(refused.message).toContain("rules/a.md");
    expect(refused.message).toContain("description");
  });

  it("loads a directory: each rule is a directory holding a RULE.md, and its path is the id", async () => {
    const tree: Record<string, string> = {
      "/repo/rules/basics/gen/RULE.md": "---\ndescription: gen\n---\n```ts\ngen()\n```\n",
      "/repo/rules/data/brand/RULE.md": "---\ndescription: brand\n---\nbrand()\n",
    };
    const fs = FileSystem.layerNoop({
      // A recursive listing names directories too. A README and a note in a rule's directory are no rules.
      readDirectory: () =>
        Effect.succeed([
          "basics",
          "basics/gen",
          "basics/gen/RULE.md",
          "data",
          "data/brand",
          "data/brand/RULE.md",
          "data/brand/why.md",
          "README.md",
          "notes.txt",
        ]),
      readFileString: (file) => Effect.succeed(tree[file] ?? ""),
    });
    const rules = await Effect.runPromise(
      loadRules("/repo/rules").pipe(Effect.provide(Layer.merge(fs, Path.layer))),
    );
    expect(rules).toEqual({
      "basics/gen": { description: "gen", must: "gen()" },
      "data/brand": { description: "brand", must: "brand()" },
    });
  });
});

describe("rule ids in output", () => {
  it("puts a preset rule's whole preset first, and leaves the project's own ids alone", () => {
    expect(shownId({ id: "basics/gen-for-sequencing", preset: "effect" })).toBe(
      "effect/basics/gen-for-sequencing",
    );
    expect(shownId({ id: "data/brand-ports" })).toBe("data/brand-ports");
    expect(wholePresetOf("effect/basics")).toBe("effect");
    expect(wholePresetOf("alchemy")).toBe("alchemy");
  });
});

describe("nested .adhere rules", () => {
  it("loads every .adhere directory with the containing directory as scope", async () => {
    const root = await onDisk({
      ".adhere/rules/style/service/RULE.md": "---\ndescription: root\n---\nroot()\n",
      ".adhere/cache/ignored.md": "not a rule, so reading it would refuse the load",
      "packages/api/.adhere/rules/style/service/RULE.md": "---\ndescription: api\n---\napi()\n",
      "packages/api/.adhere/rules/api/schema/RULE.md": "---\ndescription: schema\n---\nschema()\n",
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries).toEqual([
      {
        id: "style/service",
        file: `${root}/.adhere/rules/style/service/RULE.md`,
        scope: root,
        rule: { description: "root", must: "root()" },
      },
      {
        id: "api/schema",
        file: `${root}/packages/api/.adhere/rules/api/schema/RULE.md`,
        scope: `${root}/packages/api`,
        rule: { description: "schema", must: "schema()" },
      },
      {
        id: "style/service",
        file: `${root}/packages/api/.adhere/rules/style/service/RULE.md`,
        scope: `${root}/packages/api`,
        rule: { description: "api", must: "api()" },
      },
    ]);
  });

  it("loads a RULE.ts by its default export, which can import a helper beside it", async () => {
    // Neither the config nor the helper default-exports a rule, so reading either as one would refuse the load.
    const root = await onDisk({
      ".adhere/config.ts": "export default {};\n",
      ".adhere/rules/data/ports/RULE.ts": [
        'import { ports } from "./ports.ts";',
        "",
        'export default { description: "A port must be branded.", must: "Port.make(3000)", appendState: () => ({ ports }) };',
        "",
      ].join("\n"),
      ".adhere/rules/data/ports/ports.ts": "export const ports = [3000];\n",
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries).toMatchObject([
      {
        id: "data/ports",
        file: `${root}/.adhere/rules/data/ports/RULE.ts`,
        scope: root,
        rule: { description: "A port must be branded.", must: "Port.make(3000)" },
      },
    ]);
    const added = await entries[0]?.rule.appendState?.(
      { code: {} },
      { path: "", contents: "" },
      undefined as never,
    );
    expect(added).toEqual({ ports: [3000] });
  });

  it("refuses a TypeScript rule file that default-exports no rule, naming the file", async () => {
    const root = await onDisk({
      ".adhere/rules/ports/RULE.ts": 'export const rule = { description: "d", must: "m()" };\n',
    });

    const refused = await Effect.runPromise(
      Effect.flip(loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem))),
    );

    expect(refused.message).toContain(
      `${root}/.adhere/rules/ports/RULE.ts: a rule file must default-export defineRule({...})`,
    );
  });

  it("loads the rules beside Markdown files that are not rules, such as instructions", async () => {
    const root = await onDisk({
      ".adhere/rules/data/ports/RULE.md": "---\ndescription: ports\n---\nports()\n",
      ".adhere/rules/secrets.md": "---\ndescription: secrets\n---\nsecrets()\n",
      ".adhere/instructions/00-workflow.md": "# Workflow\n",
    });

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries.map(({ id }) => id)).toEqual(["data/ports"]);
  });

  it("refuses a rule's directory that holds both a RULE.md and a RULE.ts", async () => {
    const root = await onDisk({
      ".adhere/rules/ports/RULE.md": "---\ndescription: ports\n---\nports()\n",
      ".adhere/rules/ports/RULE.ts": "export default {};\n",
    });

    const refused = await Effect.runPromise(
      Effect.flip(loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem))),
    );

    expect(refused.message).toBe(".adhere/rules/ports: a rule is a RULE.md or a RULE.ts, not both");
  });

  it("skips .adhere directories inside dependency and generated trees, and through links", async () => {
    // A skipped file is not a rule, so reading it would refuse the load.
    const root = await onDisk({
      ".adhere/rules/e2e/isolated/RULE.md": "---\ndescription: isolated\n---\nisolated()\n",
      "node_modules/@drkmttr/adhere/.adhere/rules/refusals-name-the-file/RULE.md": "not a rule",
      "dist/.adhere/rules/style/service/RULE.md": "not a rule",
      ".git/.adhere/rules/leftover/RULE.md": "not a rule",
    });
    // A workspace package linked into node_modules and back, as pnpm links them.
    await mkdir(join(root, "packages"), { recursive: true });
    await symlink(join(root, ".adhere"), join(root, "packages", "linked"));
    await symlink("..", join(root, "packages", "loop"));

    const entries = await Effect.runPromise(
      loadAdhereRuleSet(root).pipe(Effect.provide(realFileSystem)),
    );

    expect(entries.map((entry) => entry.id)).toEqual(["e2e/isolated"]);
  });

  it("applies root rules globally and lets the nearest nested rule shadow the same id", () => {
    const rootOnly = { description: "Root only.", must: "rootOnly()" };
    const rootShadowed = { description: "Root service.", must: "root()" };
    const apiShadow = { description: "API service.", must: "api()" };
    const apiOnly = { description: "API only.", must: "apiOnly()" };

    const entries = [
      {
        id: "style/root-only",
        file: "/repo/.adhere/rules/style/root-only/RULE.md",
        scope: "/repo",
        rule: rootOnly,
      },
      {
        id: "style/service",
        file: "/repo/.adhere/rules/style/service/RULE.md",
        scope: "/repo",
        rule: rootShadowed,
      },
      {
        id: "style/service",
        file: "/repo/packages/api/.adhere/rules/style/service/RULE.md",
        scope: "/repo/packages/api",
        rule: apiShadow,
      },
      {
        id: "api/schema",
        file: "/repo/packages/api/.adhere/rules/api/schema/RULE.md",
        scope: "/repo/packages/api",
        rule: apiOnly,
      },
    ];

    expect(applicableRules("/repo/packages/api/src/index.ts", entries)).toEqual({
      "api/schema": apiOnly,
      "style/root-only": rootOnly,
      "style/service": apiShadow,
    });
    expect(applicableRules("/repo/packages/web/src/index.ts", entries)).toEqual({
      "style/root-only": rootOnly,
      "style/service": rootShadowed,
    });
  });
});

describe("presets", () => {
  it("names each preset's topics after its subdirectories that are not rules", async () => {
    for (const name of Object.keys(presets) as ReadonlyArray<keyof typeof presets>) {
      const directory = fileURLToPath(presets[name].rules);
      const entries = await readdir(directory, { withFileTypes: true });
      const topics = entries.filter(
        (entry) => entry.isDirectory() && !existsSync(join(directory, entry.name, "RULE.md")),
      );
      expect([...topicsOf(name)].sort()).toEqual(topics.map((entry) => entry.name).sort());
    }
  });

  it("reads a topic from its whole preset's directory, keeping the preset's rule ids", () => {
    expect(presetOf("effect/basics")).toEqual({ rules: presets.effect.rules, topic: "basics" });
    expect(presetOf("alchemy")).toEqual({ rules: presets.alchemy.rules });
  });

  it("applies each preset once, and a topic only when its whole preset is not named", () => {
    expect(
      presetsOf(
        { presets: ["effect", "effect/basics", "alchemy/secrets"] },
        { presets: ["effect"] },
      ),
    ).toEqual(["effect", "alchemy/secrets"]);
    expect(presetsOf({ presets: ["effect/basics", "effect/data"] }, {})).toEqual([
      "effect/basics",
      "effect/data",
    ]);
  });
});

describe("init", () => {
  it("scaffolds config and example rules without clobbering existing files", async () => {
    const root = join(tmpdir(), `adhere-init-${Date.now()}`);
    await Effect.runPromise(initProject(root));
    const config = await readFile(join(root, ".adhere", "config.ts"), "utf8");
    const project = JSON.parse(await readFile(join(root, ".adhere", "tsconfig.json"), "utf8"));
    const rule = await readFile(
      join(root, ".adhere", "rules", "style", "prefer-small-files", "RULE.md"),
      "utf8",
    );

    expect(config).toContain('import { defineConfig } from "@drkmttr/adhere";');
    expect(config).toContain("export default defineConfig({");
    // A tsconfig's globs skip .adhere/, so the config and TypeScript rules get a project that resolves the package.
    expect(project).toMatchObject({
      compilerOptions: { moduleResolution: "bundler" },
      include: ["**/*.ts"],
    });
    expect(rule).toContain("description:");

    const second = await Effect.runPromise(initProject(root));
    expect(second.created).toEqual([]);
    expect(second.skipped).toContain(".adhere/config.ts");
    expect(second.skipped).toContain(".adhere/tsconfig.json");
    expect(second.skipped).toContain(".adhere/rules/style/prefer-small-files/RULE.md");
  });

  it("scaffolds example rules worded as the rule writing tips recommend", async () => {
    const root = join(tmpdir(), `adhere-init-wording-${Date.now()}`);
    await Effect.runPromise(initProject(root));

    for (const name of ["prefer-small-files", "name-domain-actions"]) {
      const file = join(root, ".adhere", "rules", "style", name, "RULE.md");
      const rule = await Effect.runPromise(parseRuleMarkdown(await readFile(file, "utf8"), file));
      expect(strayingOf(rule)).toEqual([]);
    }
  });

  it("adds adhere to package.json only where there is one without it", async () => {
    const bare = join(tmpdir(), `adhere-init-bare-${Date.now()}`);
    expect((await Effect.runPromise(initProject(bare))).install).toEqual({
      status: "no-package-json",
    });

    const listed = join(tmpdir(), `adhere-init-listed-${Date.now()}`);
    await mkdir(listed, { recursive: true });
    await writeFile(
      join(listed, "package.json"),
      JSON.stringify({ devDependencies: { "@drkmttr/adhere": "^0.9.0" } }),
      "utf8",
    );
    expect((await Effect.runPromise(initProject(listed))).install).toEqual({ status: "listed" });
  });

  it("refuses malformed dependency data instead of trusting package.json", async () => {
    const root = await onDisk({
      "package.json": JSON.stringify({ devDependencies: { "@drkmttr/adhere": false } }),
    });
    await expect(Effect.runPromise(initProject(root))).rejects.toThrow(/devDependencies/);
  });

  it("refuses an unreadable manifest instead of treating it as absent", async () => {
    const root = await onDisk({ "package.json/placeholder": "" });
    await expect(Effect.runPromise(initProject(root))).rejects.toThrow(/Could not install/);
  });

  it("scaffolds a shared repo with a README, a CI workflow that validates, and a stack, but no config", async () => {
    const root = join(tmpdir(), `adhere-init-shared-${Date.now()}`);
    await mkdir(root, { recursive: true });
    // An existing package.json with nothing to install keeps npm off the network.
    await writeFile(join(root, "package.json"), '{ "name": "standards" }\n', "utf8");
    const result = await Effect.runPromise(initProject(root, { shared: "acme/standards" }));
    const read = (path: string) => readFile(join(root, path), "utf8");

    expect(result.created).toEqual([
      "README.md",
      ".github/workflows/adhere.yaml",
      "alchemy.run.ts",
      "lint/index.js",
      "lint/index.d.ts",
      "lint/rules.json",
      ".gitignore",
      ".adhere/instructions/00-workflow.md",
      ".adhere/rules/style/prefer-small-files/RULE.md",
      ".adhere/rules/style/name-domain-actions/RULE.md",
    ]);
    expect(result.skipped).toEqual(["package.json"]);
    expect(result.install).toEqual({
      status: "installed",
      what: "package.json",
      packageManager: "npm",
    });
    const readme = await read("README.md");
    expect(readme).toContain("adhere install acme/standards --all");
    expect(readme).toContain("instruction files\nfirst, then rules grouped by topic");
    expect(readme).toContain("needs no terminal");
    expect(readme).toContain("github:acme/standards#v1.0.0");
    expect(readme).toContain('from "@acme/standards/lint"');
    expect(readme).toContain(".adhere/instructions/acme/standards/");
    expect(readme).toContain("there are no per-rule");
    expect(await read("lint/rules.json")).toBe("{}\n");
    expect(await read("lint/index.d.ts")).toContain("export default config;");
    expect(await read("lint/index.js")).not.toContain("vite-plus");
    expect(await read(".github/workflows/adhere.yaml")).toContain(
      "- run: ~/.local/bin/adhere validate\n        env:\n          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}",
    );
    const stack = await read("alchemy.run.ts");
    expect(stack).toContain('const owner = "acme";');
    expect(stack).toContain('name: "standards",');
    expect(stack).toContain('name: "TYPESAFE_API_KEY",');
    expect(stack).toContain('visibility: "public",');
    await expect(access(join(root, ".adhere", "config.ts"))).rejects.toThrow();
  });

  it("scaffolds a lint export that reads rules.json and resolves shared plugin paths", async () => {
    const root = join(tmpdir(), `adhere-init-lint-${Date.now()}`);
    await mkdir(root, { recursive: true });
    // An existing manifest with no dependencies keeps init's install off the network.
    await writeFile(join(root, "package.json"), '{ "name": "standards", "type": "module" }\n');
    const result = await Effect.runPromise(initProject(root, { shared: "Acme/Standards" }));
    const read = (path: string) => readFile(join(root, path), "utf8");

    expect(result.skipped).toEqual(["package.json"]);
    expect(JSON.parse(sharedPackageJson("Acme", "Standards"))).toMatchObject({
      name: "@acme/standards",
      private: true,
      type: "module",
      files: ["lint"],
      exports: { "./lint": "./lint/index.js" },
    });
    expect(await read("lint/rules.json")).toBe("{}\n");
    const types = await read("lint/index.d.ts");
    expect(types).toContain("plugins?: SharedPluginName[];");
    expect(types).toContain("rules: Record<string, SharedRuleLevel>;");
    expect(types).not.toContain("[setting: string]");
    const readme = await read("README.md");
    expect(readme).toContain('from "@acme/standards/lint"');
    expect(readme).toContain("github:Acme/Standards#v1.0.0");
    const source = await read("lint/index.js");
    expect(source).not.toContain("vite-plus");
    expect(source).not.toContain('from "alchemy');
    // With no plugins configured the export must omit the key; [] would replace oxlint's defaults.
    const emptyRoot = join(root, "lint-empty");
    await mkdir(emptyRoot, { recursive: true });
    await writeFile(join(emptyRoot, "index.js"), source);
    await writeFile(join(emptyRoot, "rules.json"), "{}\n");
    const empty = (await import(pathToFileURL(join(emptyRoot, "index.js")).href)) as {
      readonly default: Readonly<Record<string, unknown>>;
    };
    expect(empty.default).not.toHaveProperty("plugins");

    const plugin = join(root, "lint", "plugins", "acme.js");
    await mkdir(join(root, "lint", "plugins"), { recursive: true });
    await writeFile(plugin, 'export default { meta: { name: "acme" }, rules: {} };\n', "utf8");
    await writeFile(
      join(root, "lint", "rules.json"),
      JSON.stringify({
        plugins: ["react"],
        options: { typeAware: true },
        jsPlugins: [
          "./plugins/acme.js",
          "some-package",
          { name: "aliased", specifier: "./plugins/acme.js" },
        ],
        rules: { "acme/no-foo": "error" },
      }),
      "utf8",
    );

    // The scaffold writes this module at a temporary path only the test knows, so a static import cannot reach it.
    const shared = (await import(pathToFileURL(join(root, "lint", "index.js")).href)) as {
      readonly default: {
        readonly plugins: ReadonlyArray<string>;
        readonly jsPlugins: ReadonlyArray<
          string | { readonly name: string; readonly specifier: string }
        >;
        readonly rules: Readonly<Record<string, string>>;
        readonly options: Readonly<Record<string, unknown>>;
      };
      readonly plugins: ReadonlyArray<string>;
      readonly jsPlugins: ReadonlyArray<
        string | { readonly name: string; readonly specifier: string }
      >;
      readonly rules: Readonly<Record<string, string>>;
      readonly options: Readonly<Record<string, unknown>>;
    };

    expect(shared.default).toEqual({
      plugins: ["react"],
      options: { typeAware: true },
      jsPlugins: [plugin, "some-package", { name: "aliased", specifier: plugin }],
      rules: { "acme/no-foo": "error" },
    });
    expect(shared.plugins).toEqual(["react"]);
    expect(shared.jsPlugins).toEqual(shared.default.jsPlugins);
    expect(shared.rules).toEqual({ "acme/no-foo": "error" });
    expect(shared.options).toEqual({ typeAware: true });
  });

  it("makes a shared repo private when asked", async () => {
    const root = join(tmpdir(), `adhere-init-private-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "package.json"), '{ "name": "standards" }\n', "utf8");
    await Effect.runPromise(initProject(root, { shared: "acme/standards", visibility: "private" }));

    expect(await readFile(join(root, "alchemy.run.ts"), "utf8")).toContain(
      'visibility: "private",',
    );
  });

  it("keeps a config at another accepted path instead of adding a second one", async () => {
    const root = join(tmpdir(), `adhere-init-existing-${Date.now()}`);
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "adhere.config.ts"), "export default {};\n", "utf8");

    const result = await Effect.runPromise(initProject(root, { force: true }));

    expect(result.skipped).toContain("adhere.config.ts");
    expect(result.created).not.toContain(".adhere/config.ts");
    expect(result.created).not.toContain(".adhere/tsconfig.json");
    await expect(access(join(root, ".adhere", "config.ts"))).rejects.toThrow();
    await expect(access(join(root, ".adhere", "tsconfig.json"))).rejects.toThrow();
  });
});
