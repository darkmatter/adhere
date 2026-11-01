import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const fixture = join(process.cwd(), "test", "fixtures", "trial-review-check.ts");

describe("trial review", () => {
  it("defaults to 100 files, carries notes into evidence, and uses revised native options", async () => {
    const { stdout } = await execFileAsync("bun", [fixture], { cwd: process.cwd() });
    const result = JSON.parse(stdout) as Record<string, unknown>;
    // The revision writes the file too, so it repeats the reads declaration the first write asks for.
    expect(String(result.adherePrompt)).toContain(
      'Declare the context Jev needs beside the code as `reads: ["dependents"]`',
    );
    expect(result).toEqual({
      defaultFiles: 100,
      parses: [100, 1],
      rejects: [true, true, true, true, true],
      untestedSuffix: " (not trialled)",
      untestedStatus: "Not trialled: The trial was skipped.",
      cancelledSuffix: "",
      cancelledStatus: "Not written.",
      acceptedStatus: "Trialled on 2 files: 1 finding.",
      evidence: expect.stringContaining("- false-positive — this is a test helper: src/a.ts:4"),
      adherePrompt: expect.stringContaining("- false-positive — this is a test helper: src/a.ts:4"),
      pluginPrompt: expect.stringContaining("- false-positive — this is a test helper: src/a.ts:4"),
      nativePrompt: expect.stringContaining("- false-positive — this is a test helper: src/a.ts:4"),
      inspectionPrompt: expect.stringContaining(".adhere/trial/style%2Fno-console.json"),
      snippet: ["error", "always"],
      strayingDraft: {
        _tag: "Loaded",
        warnings: expect.arrayContaining([expect.stringContaining('does not say "must"')]),
      },
      unloadableDraft: {
        _tag: "Unavailable",
        problems: [expect.stringContaining("Could not load")],
      },
    });
  });
});
