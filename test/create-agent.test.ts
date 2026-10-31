import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const fixture = join(process.cwd(), "test", "fixtures", "create-agent-check.ts");

describe("create rule checks", () => {
  it("parses with Bun, routes native rules, and verifies plugins with oxlint", async () => {
    const { stdout } = await execFileAsync("bun", [fixture], { cwd: process.cwd() });
    const result = JSON.parse(stdout) as Record<string, unknown>;
    expect(result).toEqual({
      shapeMissingMechanical: true,
      shapeValid: true,
      linterNative: true,
      linterInvalid: true,
      shapeOptionsNative: true,
      shapeOptionsBadJson: true,
      shapeOptionsNotArray: true,
      shapeCompactSchema: true,
      draftMissingPlugin: true,
      draftMissingLocation: true,
      draftValid: true,
      draftNullLocations: true,
      draftNumberLocations: true,
      draftDocumentStrict: true,
      candidatesDocumentStrict: true,
      native: true,
      unknownNative: true,
      nativeUnchanged: true,
      nativeKeepsOnOptions: true,
      nativeKeepsOffOptions: true,
      nativeAllowsAlias: true,
      nativeAllowKeepsOptions: true,
      nativeEnablesDisabledPlugin: true,
      nativeEnablesTypeAware: true,
      nativeSettingOptions: true,
      nativeWritesOptions: true,
      nativeOnOptions: true,
      nativeReplacesDiffering: true,
      bansLodash: true,
      bareMissesLodash: true,
      projectMjs: true,
      guardsAccept: true,
      guardsRejectReserved: true,
      guardsRejectImports: true,
      tester: expect.stringMatching(/^(oxlint|vite-plus)\/.*plugins-dev$/),
      noTester: true,
      consumerLocal: true,
      runtime: true,
      passed: "Passed",
      failed: "Failed",
      failedProblems: 1,
    });
  });
});
