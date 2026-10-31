import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { catalogOf, describeRules, installSelected, matchOf, parseSource } from "#install.ts";
import { Effect } from "effect";
import { afterEach, describe, expect, it } from "vite-plus/test";

const roots: string[] = [];
const onDisk = async (files: Readonly<Record<string, string>>) => {
  const root = await mkdtemp(join(tmpdir(), "adhere-install-test-"));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text, "utf8");
  }
  return root;
};
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const SHARED = {
  ".adhere/instructions/00-workflow.md": "Workflow\n",
  ".adhere/instructions/security/hardening.md": "Hardening\n",
  ".adhere/instructions/notes.txt": "Not Markdown\n",
  ".adhere/rules/data/ports/RULE.md":
    "---\ndescription: A port must be branded.\n---\n\nconst Port = 1\n",
  ".adhere/rules/data/columns/RULE.ts": 'throw new Error("the catalog must not run a rule");\n',
  ".adhere/rules/data/columns/schema.ts": "export const schema = 1;\n",
  ".adhere/rules/instructions/known/RULE.md":
    "---\ndescription: A rule under a topic named instructions.\n---\n\nx\n",
  ".adhere/rules/legacy/RULE.md": "---\ndescription: An older rule.\n---\n\nx\n",
  ".adhere/rules/legacy/child/RULE.md": "---\ndescription: A child of an older rule.\n---\n\nx\n",
  // Listing a rule never parses another, so a malformed one cannot stop a copy.
  ".adhere/rules/broken/RULE.md": "Not a rule\n",
} as const;

const source = { repo: "acme/rules", rule: "" };
const clone = () => onDisk(SHARED);

describe("parseSource", () => {
  it("reads a repo, then a topic or rule, then a branch or tag", () => {
    expect(parseSource("acme/rules")).toEqual({ repo: "acme/rules", rule: "" });
    expect(parseSource("acme/rules/data/ports#v3")).toEqual({
      repo: "acme/rules",
      rule: "data/ports",
      ref: "v3",
    });
    expect(parseSource("acme/rules#main")).toEqual({
      repo: "acme/rules",
      rule: "",
      ref: "main",
    });
    expect(parseSource("acme")).toBeUndefined();
    expect(parseSource("acme/rules#")).toBeUndefined();
  });

  it("refuses a . or .. segment, which would copy outside .adhere/", () => {
    for (const spec of [
      "./rules",
      "../rules",
      "acme/../rules",
      "acme/./rules",
      "acme/rules/../data",
      "acme/rules/./data",
      "acme/rules/data/..",
      "acme/rules/data/.",
    ]) {
      expect(parseSource(spec)).toBeUndefined();
    }
    // Only a whole segment is refused: a repo or rule name may still have dots.
    expect(parseSource("acme/rules.js/data")).toEqual({ repo: "acme/rules.js", rule: "data" });
  });
});

describe("catalogOf", () => {
  it("reads Markdown instructions recursively and rules by their id", async () => {
    const catalog = await Effect.runPromise(catalogOf(source, await clone()));
    expect(catalog.instructions).toEqual(["00-workflow.md", "security/hardening.md"]);
    expect(catalog.rules).toEqual([
      { id: "broken", name: "RULE.md" },
      { id: "data/columns", name: "RULE.ts" },
      { id: "data/ports", name: "RULE.md" },
      { id: "instructions/known", name: "RULE.md" },
      { id: "legacy", name: "RULE.md" },
      { id: "legacy/child", name: "RULE.md" },
    ]);
  });

  it("refuses a repo with neither instructions nor rules", async () => {
    const empty = await onDisk({ ".adhere/cache/stale.md": "not a rule\n" });
    await expect(Effect.runPromise(catalogOf(source, empty))).rejects.toThrow(
      "it has no instruction files in .adhere/instructions/ and no rules in .adhere/rules/",
    );
  });
});

describe("describeRules", () => {
  const descriptions = async (ids: ReadonlyArray<string>) => {
    const from = await clone();
    const catalog = await Effect.runPromise(catalogOf(source, from));
    return Effect.runPromise(
      describeRules(
        source,
        from,
        catalog.rules.filter(({ id }) => ids.includes(id)),
      ),
    );
  };

  it("reads a description only for the rules it is given", async () => {
    expect(await descriptions(["data/ports"])).toEqual([
      { id: "data/ports", name: "RULE.md", description: "A port must be branded." },
    ]);
    expect(await descriptions(["data/columns", "legacy"])).toEqual([
      {
        id: "data/columns",
        name: "RULE.ts",
        description: "(TypeScript, which list does not run)",
      },
      { id: "legacy", name: "RULE.md", description: "An older rule." },
    ]);
  });

  it("refuses a malformed rule only when it reads that rule", async () => {
    await expect(descriptions(["broken"])).rejects.toThrow();
  });
});

describe("matchOf", () => {
  const match = async (rule: string) => {
    const catalog = await Effect.runPromise(catalogOf(source, await clone()));
    return Effect.runPromise(matchOf({ repo: "acme/rules", rule }, catalog));
  };

  it("chooses from every instruction file and rule for a bare repo", async () => {
    const bare = (await match("")) as {
      kind: string;
      instructions: ReadonlyArray<string>;
      rules: ReadonlyArray<{ id: string }>;
    };
    expect(bare.kind).toBe("choose");
    expect(bare.instructions).toEqual(["00-workflow.md", "security/hardening.md"]);
    expect(bare.rules.map(({ id }) => id)).toEqual([
      "broken",
      "data/columns",
      "data/ports",
      "instructions/known",
      "legacy",
      "legacy/child",
    ]);
  });

  it("filters a topic to its rules, and never treats it as instruction files", async () => {
    expect(await match("data")).toMatchObject({
      kind: "choose",
      instructions: [],
      rules: [{ id: "data/columns" }, { id: "data/ports" }],
    });
    expect(await match("instructions")).toMatchObject({
      kind: "choose",
      instructions: [],
      rules: [{ id: "instructions/known" }],
    });
  });

  it("copies an exact rule with no rule under it directly, whatever else is malformed", async () => {
    expect(await match("data/ports")).toEqual({
      kind: "direct",
      rule: { id: "data/ports", name: "RULE.md" },
    });
  });

  it("chooses by id too when an exact rule also has rules under it", async () => {
    expect(await match("legacy")).toMatchObject({
      kind: "choose",
      instructions: [],
      rules: [{ id: "legacy" }, { id: "legacy/child" }],
    });
  });

  it("names what it could not find", async () => {
    await expect(match("missing")).rejects.toThrow(
      "it has no rule or topic missing in .adhere/rules/",
    );
    await expect(match("00-workflow")).rejects.toThrow(
      "it has no rule or topic 00-workflow in .adhere/rules/",
    );
  });
});

describe("installSelected", () => {
  const picks = {
    instructions: ["00-workflow.md", "security/hardening.md"],
    rules: ["data/ports", "data/columns"],
  };
  const paths = [
    ".adhere/instructions/acme/rules/00-workflow.md",
    ".adhere/instructions/acme/rules/security/hardening.md",
    ".adhere/rules/acme/rules/data/ports/",
    ".adhere/rules/acme/rules/data/columns/",
  ];

  it("copies instruction files and whole rule directories, skipping what is there", async () => {
    const from = await clone();
    const root = await onDisk({});
    const first = await Effect.runPromise(installSelected(root, source, from, picks, {}));
    expect(first).toEqual({ created: paths, skipped: [] });
    expect(await readFile(join(root, paths[1]!), "utf8")).toBe("Hardening\n");
    expect(
      await readFile(join(root, ".adhere/rules/acme/rules/data/columns/schema.ts"), "utf8"),
    ).toBe("export const schema = 1;\n");

    const again = await Effect.runPromise(installSelected(root, source, from, picks, {}));
    expect(again).toEqual({ created: [], skipped: paths });
  });

  it("replaces what is there only with force, and never deletes what is left unpicked", async () => {
    const from = await clone();
    const root = await onDisk({});
    await Effect.runPromise(installSelected(root, source, from, picks, {}));
    const local = join(root, ".adhere/rules/acme/rules/data/ports/RULE.md");
    await writeFile(local, "A local edit\n", "utf8");

    expect(await Effect.runPromise(installSelected(root, source, from, picks, {}))).toEqual({
      created: [],
      skipped: paths,
    });
    expect(await readFile(local, "utf8")).toBe("A local edit\n");

    expect(
      await Effect.runPromise(installSelected(root, source, from, picks, { force: true })),
    ).toEqual({ created: paths, skipped: [] });
    expect(await readFile(local, "utf8")).toBe(SHARED[".adhere/rules/data/ports/RULE.md"]);

    const nothing = { instructions: [], rules: [] };
    expect(await Effect.runPromise(installSelected(root, source, from, nothing, {}))).toEqual({
      created: [],
      skipped: [],
    });
    expect(await readFile(local, "utf8")).toBe(SHARED[".adhere/rules/data/ports/RULE.md"]);
  });
});
