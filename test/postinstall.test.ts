import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vite-plus/test";

const exec = promisify(execFile);
const main = join(process.cwd(), "src/main.ts");
const roots: string[] = [];
const start = "<!-- adhere:instructions:start -->";
const end = "<!-- adhere:instructions:end -->";
const run = (cwd: string) => exec("bun", [main, "postinstall"], { cwd });
const project = async () => {
  const root = await mkdtemp(join(tmpdir(), "adhere-instructions-"));
  roots.push(root);
  return root;
};
const put = async (root: string, directory: string, name: string, text: string) => {
  await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, directory, name), text);
};
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("postinstall", () => {
  it("uses .agents as a fallback, renders Markdown files recursively, and preserves handwritten content across updates", async () => {
    const root = await project();
    await writeFile(join(root, "AGENTS.md"), "# Handwritten\n");
    await put(root, ".agents/instructions", "20-style.md", "Style\n");
    await put(root, ".agents/instructions", "10-rules.md", "Rules\n");
    await put(root, ".agents/instructions", "ignored.txt", "Ignored");
    await put(root, ".agents/instructions/nested", "hidden.md", "Nested");
    expect((await run(root)).stdout).toBe(
      "Updated AGENTS.md: 3 instruction files from .agents/instructions.\n",
    );
    const target = join(root, "AGENTS.md");
    const expected = `# Handwritten\n\n${start}\n\nRules\n\nStyle\n\nNested\n\n${end}\n`;
    expect(await readFile(target, "utf8")).toBe(expected);
    expect((await run(root)).stdout).toBe(
      "Unchanged AGENTS.md: 3 instruction files from .agents/instructions.\n",
    );
    expect(await readFile(target, "utf8")).toBe(expected);
    await writeFile(target, `${expected}\nFooter\n`);
    await put(root, ".agents/instructions", "10-rules.md", "Updated");
    await run(root);
    expect(await readFile(target, "utf8")).toBe(
      `${expected.replace("Rules", "Updated")}\nFooter\n`,
    );
  });

  it("renders a shared repo's instructions before local fragments, then nested local files", async () => {
    const root = await project();
    await put(root, ".adhere/instructions", "00-workflow.md", "Workflow");
    await put(root, ".adhere/instructions/nested", "fine-print.md", "Fine print");
    await put(root, ".adhere/instructions/acme/rules", "security.md", "Shared security");
    await put(root, ".adhere/instructions/acme/rules/deep", "extra.md", "Shared extra");
    expect((await run(root)).stdout).toBe(
      "Updated AGENTS.md: 4 instruction files from .adhere/instructions.\n",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      `${start}\n\nShared extra\n\nShared security\n\nWorkflow\n\nFine print\n\n${end}\n`,
    );
  });

  it("prefers .adhere and clears its block when that directory becomes empty", async () => {
    const root = await project();
    await put(root, ".adhere/instructions", "rule.md", "Adhere");
    await put(root, ".agents/instructions", "rule.md", "Agents");
    expect((await run(root)).stdout).toBe(
      "Updated AGENTS.md: 1 instruction file from .adhere/instructions.\n",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(`${start}\n\nAdhere\n\n${end}\n`);
    await rm(join(root, ".adhere/instructions/rule.md"));
    expect((await run(root)).stdout).toBe(
      "Updated AGENTS.md: 0 instruction files from .adhere/instructions.\n",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(`${start}\n\n${end}\n`);
  });

  it("resolves an instructions override relative to each supported config location", async () => {
    for (const [directory, name] of [
      [".adhere", "config.ts"],
      [".", "adhere.config.ts"],
      [".", ".adhere.config.ts"],
    ]) {
      const root = await project();
      await put(root, directory!, name!, 'export default { instructions: "custom" };');
      await put(root, `${directory}/custom`, "rule.md", "Custom");
      await put(root, ".agents/instructions", "rule.md", "Default");
      await run(root);
      expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
        `${start}\n\nCustom\n\n${end}\n`,
      );
    }
  });

  it("does nothing when the selected directory is absent", async () => {
    const root = await project();
    expect((await run(root)).stdout).toBe(
      "Skipped AGENTS.md: no instructions directory (.adhere/instructions, .agents/instructions).\n",
    );
    await expect(readFile(join(root, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await put(root, ".", "adhere.config.ts", 'export default { instructions: "missing" };');
    await put(root, ".agents/instructions", "rule.md", "Default");
    await writeFile(join(root, "AGENTS.md"), "Keep me");
    expect((await run(root)).stdout).toBe(
      "Skipped AGENTS.md: no instructions directory (missing).\n",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe("Keep me");
  });

  it("refuses malformed or duplicate markers without writing", async () => {
    const root = await project();
    await put(root, ".agents/instructions", "rule.md", "Rules");
    for (const previous of [
      start,
      end,
      `${end}\n${start}`,
      `${start}\n${start}\n${end}`,
      `${start}\n${end}\n${end}`,
    ]) {
      await writeFile(join(root, "AGENTS.md"), previous);
      const failure = await run(root).catch((error: { code: number; stderr: string }) => error);
      expect(failure).toMatchObject({ code: 1 });
      expect(failure.stderr).toContain("malformed or duplicate");
      expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(previous);
    }
  });

  it("refuses reserved markers in instruction files without writing", async () => {
    const root = await project();
    await put(root, ".agents/instructions", "rule.md", start);
    await writeFile(join(root, "AGENTS.md"), "Keep me");
    await expect(run(root)).rejects.toMatchObject({ code: 1 });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe("Keep me");
  });
});
