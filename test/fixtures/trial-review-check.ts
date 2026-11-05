/** Bun-only checks for the trial review, run as a subprocess by trial-review.test.ts. */
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Effect, Layer, Path } from "effect";
import {
  adhereRevisionPrompt,
  inspectionPrompt,
  nativeRevisionPrompt,
  pluginRevisionPrompt,
  type Shape,
} from "../../src/create/ask.ts";
import { nativeSnippet } from "../../src/create/oxlint.ts";
import { loadedDraft } from "../../src/create/wizard.ts";
import {
  DEFAULT_TRIAL_FILES,
  parseTrialFiles,
  trialEvidence,
  trialStatus,
  trialWriteSuffix,
  type FindingReview,
} from "../../src/create/trial-review.ts";
import type { TrialRun } from "../../src/create/trial.ts";

const run = (overrides: Partial<TrialRun> = {}): TrialRun => ({
  draft: { kind: "adhere", id: "style/no-console", format: "markdown", source: "RULE.md" },
  scope: { kind: "files", limit: 100 },
  revision: "revision",
  selectedFiles: ["src/a.ts", "src/b.ts"],
  files: 2,
  judged: 1,
  cached: 1,
  skipped: 0,
  waiting: 0,
  findings: [],
  reportPath: ".adhere/trial/style%2Fno-console.json",
  notes: [],
  ...overrides,
});

const shape = {
  format: "markdown",
  reads: ["dependents"],
  typeAware: false,
} as unknown as Shape;

const evidence = "The user's verdicts:\n- false-positive — this is a test helper: src/a.ts:4";
const reviews: ReadonlyArray<FindingReview> = [
  { where: "src/a.ts:4", verdict: "false-positive", note: "this is a test helper" },
  { where: "src/b.ts:9", verdict: "correct" },
];

const untested = { _tag: "Untested", draft: "text", reason: "The trial was skipped." } as const;
const accepted = {
  _tag: "Accepted",
  draft: "text",
  run: run({ findings: [{ rule: "style/no-console", file: "src/a.ts" }] }),
  reviews: [],
} as const;

const snippet = JSON.parse(nativeSnippet("eslint/no-console", ["always"])) as {
  readonly rules: Readonly<Record<string, unknown>>;
};

const platform = Layer.mergeAll(BunFileSystem.layer, Path.layer);
const loaded = (text: string) =>
  Effect.runPromise(Effect.scoped(loadedDraft(text, "RULE.ts")).pipe(Effect.provide(platform)));

const straying = [
  "export default {",
  '  description: "A port is a number.",',
  '  must: "const port = Port.make(3000);",',
  "};",
  "",
].join("\n");

console.log(
  JSON.stringify({
    defaultFiles: DEFAULT_TRIAL_FILES,
    parses: ["100", "1"].map(parseTrialFiles),
    rejects: ["0", "-1", "1.5", "abc", ""].map((input) => parseTrialFiles(input) === undefined),
    untestedSuffix: trialWriteSuffix(untested),
    untestedStatus: trialStatus(untested),
    cancelledSuffix: trialWriteSuffix({ _tag: "Cancelled", draft: "text", reason: "no" } as const),
    cancelledStatus: trialStatus({ _tag: "Cancelled", draft: "text", reason: "no" } as const),
    acceptedStatus: trialStatus(accepted),
    evidence: trialEvidence(run({ findings: [{ rule: "r", file: "src/a.ts" }] }), reviews),
    adherePrompt: adhereRevisionPrompt(
      "No console",
      "style/no-console",
      shape,
      "RULE.md",
      evidence,
    ),
    pluginPrompt: pluginRevisionPrompt(
      "No console",
      "style/no-console",
      {
        plugin: "export default {}",
        pluginName: "style",
        ruleName: "no-console",
        valid: [],
        invalid: [],
      },
      evidence,
    ),
    nativePrompt: nativeRevisionPrompt("No console", "eslint/no-console", [], evidence),
    inspectionPrompt: inspectionPrompt(".adhere/trial/style%2Fno-console.json", "style/no-console"),
    snippet: snippet.rules["eslint/no-console"],
    strayingDraft: await loaded(straying),
    unloadableDraft: await loaded("throw new Error('boom');\n"),
  }),
);
