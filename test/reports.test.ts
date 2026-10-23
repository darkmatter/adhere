import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vite-plus/test";
import type { AuditResult } from "../src/workflows/audit.ts";
import { renderJson, renderMarkdown, renderRuleReports } from "../src/workflows/format.ts";
import { findingA } from "./audit.fixtures.ts";

const result: AuditResult = {
  files: 7,
  judged: 1,
  cached: 2,
  skipped: 1,
  waiting: 2,
  suppressed: 3,
  blocked: [{ file: "/repo/src/blocked.ts", ray: "test-ray" }],
  findings: [findingA],
};

describe("report formats", () => {
  it("keeps the full JSON result and thresholds with relative paths and preset rule ids", () => {
    const json = renderJson(
      { ...result, findings: [{ ...findingA, preset: "effect" }] },
      { root: "/repo", threshold: 0.7, sufficiencyThreshold: 0.65, provider: "test-model" },
    );
    expect(JSON.parse(json)).toEqual({
      ...result,
      threshold: 0.7,
      sufficiencyThreshold: 0.65,
      provider: "test-model",
      findings: [
        { ...findingA, rule: `effect/${findingA.rule}`, preset: "effect", file: "src/server.ts" },
      ],
      blocked: [{ file: "src/blocked.ts", ray: "test-ray" }],
    });
  });

  it("groups all occurrences of each rule and preserves code fences, scores, and incomplete-run counts", () => {
    const finding = {
      ...findingA,
      rule: "data/ports",
      context: 0.4,
      excerpt: { start: 2, lines: ["const markdown = `", "```", "`;"] },
    };
    const reports = renderRuleReports(
      {
        ...result,
        findings: [
          finding,
          { ...finding, file: "/repo/src/other.ts" },
          { ...findingA, rule: "data_ports", level: "warning" },
          { ...findingA, rule: "data/ports", preset: "effect" },
          { ...findingA, rule: "../../outside" },
        ],
      },
      { json: true, md: true },
      { root: "/repo" },
    );
    expect([...reports.keys()]).toEqual([
      "data%2Fports.json",
      "data%2Fports.md",
      "data_ports.json",
      "data_ports.md",
      "effect%2Fdata%2Fports.json",
      "effect%2Fdata%2Fports.md",
      "..%2F..%2Foutside.json",
      "..%2F..%2Foutside.md",
    ]);
    const markdown = reports.get("data%2Fports.md") ?? "";
    expect(markdown).toContain("# data/ports\n\n2 findings");
    expect(markdown).toContain("## src/server.ts:");
    expect(markdown).toContain("## src/other.ts:");
    expect(markdown).toContain("Confidence: 0.9");
    expect(markdown).toContain("Context: 0.4");
    expect(markdown).toContain("Warning: this file may not show enough");
    expect(markdown).toContain("````typescript\nconst markdown = `\n```\n`;\n````");
    expect(markdown).toContain("### must");
    expect(markdown).toContain("2 waiting, 1 blocked, 3 suppressed");
    expect(markdown).toContain("src/blocked.ts (Ray ID test-ray)");
    expect(reports.get("data_ports.md")).toContain("Level: **warning**");
    expect(JSON.parse(reports.get("data%2Fports.json") ?? "").findings).toEqual([
      { ...finding, file: "src/server.ts" },
      { ...finding, file: "src/other.ts" },
    ]);
    expect(renderRuleReports({ ...result, findings: [] }, { json: true, md: true }).size).toBe(0);
  });

  it("combines Markdown findings from every rule with a single run summary, including an empty report", () => {
    const markdown = renderMarkdown({
      ...result,
      findings: [findingA, { ...findingA, rule: "second" }],
    });
    expect(markdown).toContain(`# ${findingA.rule}`);
    expect(markdown).toContain("# second");
    expect(markdown.match(/## Run summary/g)).toHaveLength(1);
    expect(markdown).toContain("Found 2 errors.");
    expect(renderMarkdown({ ...result, findings: [] })).toContain("Found 0 errors.");
  });
});

const execFileAsync = promisify(execFile);
const main = join(process.cwd(), "src/main.ts");
const lint = (root: string, ...flags: ReadonlyArray<string>) =>
  execFileAsync("bun", [main, "lint", ...flags], { cwd: root }).then(
    (output) => ({ ...output, code: 0 }),
    (error: { readonly stdout: string; readonly stderr: string; readonly code: number }) => error,
  );

/** A local provider answers every question without credentials or network requests. */
const configure = (root: string, probability: number, level: "error" | "warning") =>
  writeFile(
    join(root, ".adhere/config.ts"),
    `export default {
    reads: [],
    rules: {
      "data/ports": { description: "Ports are branded.", must: "const port = Port(3000);", level: ${JSON.stringify(level)} },
      "data_ports": { description: "Ports are named.", must: "const port = PORT;", level: ${JSON.stringify(level)} },
    },
    provider: {
      model: "reports-${probability}-${level}",
      ask: async (_state, questions) => ({
        answers: Object.fromEntries(questions.map((q) => [q.id,
          q.type === "choice" ? Object.keys(q.options)[0] :
          q.id.startsWith("sufficient:") ? 0.4 : ${probability}
        ])),
      }),
    },
  };\n`,
  );

describe("lint reports", () => {
  it.each([
    { flags: ["--json"], names: ["data%2Fports.json", "data_ports.json"] },
    { flags: ["--md"], names: ["data%2Fports.md", "data_ports.md"] },
    {
      flags: ["--json", "--md"],
      names: ["data%2Fports.json", "data%2Fports.md", "data_ports.json", "data_ports.md"],
    },
  ])(
    "writes $flags as rule files, replaces stale reports, and preserves them for plan-only runs",
    async ({ flags, names }) => {
      const root = await mkdtemp(join(tmpdir(), "adhere-reports-"));
      try {
        await mkdir(join(root, ".adhere"));
        await writeFile(join(root, "a.ts"), "export const a = 3000;\n");
        await writeFile(join(root, "b.ts"), "export const b = 3001;\n");
        await configure(root, 0.95, "error");
        const first = await lint(root, ...flags, "--log-level", "debug");
        expect(first.code).toBe(1);
        expect(first.stdout).toBe("");
        expect(first.stderr).toContain(`Wrote ${names.length} report files`);
        const directory = join(root, ".adhere/reports");
        expect((await readdir(directory)).sort()).toEqual(names);
        const contents = await Promise.all(
          names.map((name) => readFile(join(directory, name), "utf8")),
        );
        for (const [index, name] of names.entries()) {
          const report = contents[index] ?? "";
          if (name.endsWith(".json")) {
            const rule = name.startsWith("data%2F") ? "data/ports" : "data_ports";
            expect(JSON.parse(report)).toMatchObject({
              files: 2,
              judged: 2,
              findings: [
                { rule, file: "a.ts", level: "error" },
                { rule, file: "b.ts", level: "error" },
              ],
            });
          } else {
            expect(report).toContain("## a.ts:1");
            expect(report).toContain("## b.ts:1");
            expect(report).toContain("export const a = 3000;");
          }
        }

        const cached = await lint(root, "--json", "--stdout");
        expect(cached.code).toBe(1);
        expect(JSON.parse(cached.stdout)).toMatchObject({ judged: 0, cached: 2 });
        expect(JSON.parse(cached.stdout).findings).toHaveLength(4);
        await configure(root, 0.1, "error");
        const planned = await lint(root, ...flags, "--limit", "0");
        expect(planned.code).toBe(0);
        expect(planned.stdout).toBe("");
        expect(
          await Promise.all(names.map((name) => readFile(join(directory, name), "utf8"))),
        ).toEqual(contents);
        const clean = await lint(root, ...flags);
        expect(clean.code).toBe(0);
        expect(clean.stdout).toBe("");
        expect(await readdir(directory)).toEqual([]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it("keeps warning exit codes and supports Markdown without JSON", async () => {
    const root = await mkdtemp(join(tmpdir(), "adhere-report-warnings-"));
    try {
      await mkdir(join(root, ".adhere"));
      await writeFile(join(root, "a.ts"), "export const a = 3000;\n");
      await configure(root, 0.95, "warning");
      const warnings = await lint(root, "--md");
      expect(warnings.code).toBe(0);
      expect(warnings.stdout).toBe("");
      expect(await readFile(join(root, ".adhere/reports/data%2Fports.md"), "utf8")).toContain(
        "Level: **warning**",
      );
      const denied = await lint(root, "--json", "--stdout", "--deny-warnings");
      expect(denied.code).toBe(1);
      expect(JSON.parse(denied.stdout).findings).toHaveLength(2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each(["--json", "--md"])(
    "prints all findings with %s --stdout and leaves report files untouched",
    async (format) => {
      const root = await mkdtemp(join(tmpdir(), "adhere-stdout-"));
      try {
        await mkdir(join(root, ".adhere"));
        await writeFile(join(root, "a.ts"), "export const a = 3000;\n");
        await configure(root, 0.95, "error");
        const combined = await lint(root, format, "--stdout", "--log-level", "debug");
        expect(combined.code).toBe(1);
        if (format === "--json") {
          expect(JSON.parse(combined.stdout).findings).toHaveLength(2);
        } else {
          expect(combined.stdout).toContain("# data/ports");
          expect(combined.stdout).toContain("# data\\_ports");
          expect(combined.stdout.match(/## Run summary/g)).toHaveLength(1);
          expect(combined.stdout).toContain("Found 2 errors.");
        }
        const directory = join(root, ".adhere/reports");
        await expect(readdir(directory)).rejects.toMatchObject({ code: "ENOENT" });
        await mkdir(directory);
        await writeFile(join(directory, "previous.md"), "previous report");
        await configure(root, 0.1, "error");
        const clean = await lint(root, format, "--stdout");
        expect(clean.code).toBe(0);
        if (format === "--json") {
          expect(JSON.parse(clean.stdout).findings).toEqual([]);
        } else {
          expect(clean.stdout).toContain("Found 0 errors.");
        }
        expect(await readdir(directory)).toEqual(["previous.md"]);
        expect(await readFile(join(directory, "previous.md"), "utf8")).toBe("previous report");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it("refuses mixed stdout formats before planning or sending requests", async () => {
    const root = await mkdtemp(join(tmpdir(), "adhere-report-options-"));
    try {
      await mkdir(join(root, ".adhere"));
      await configure(root, 0.95, "error");
      const refused = await lint(root, "--json", "--md", "--stdout", "--limit", "0");
      expect(refused.code).toBe(1);
      expect(`${refused.stdout}${refused.stderr}`).toContain(
        "Choose either --json or --md with --stdout",
      );
      expect(refused.stderr).not.toContain("Plan only");
      await expect(readdir(join(root, ".adhere/reports"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
