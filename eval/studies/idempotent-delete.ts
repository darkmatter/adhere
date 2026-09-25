/**
 * Whether taking a file's comments out, or scoping the rule to a provider's
 * delete handler, helps alchemy's idempotent-delete rule tell the deletes
 * that fail on a resource already gone from the rest. Four arms, the preset's
 * rule and the rule reworded, each with the file's comments kept and taken
 * out, over an alchemy checkout's files outside tests that mention delete,
 * scored against deletes whose behavior was checked against AWS and read in
 * the code. `idempotent-delete.md` has the verdicts and the results.
 *
 *   bun eval/studies/idempotent-delete.ts <alchemy checkout> [results.json]
 *   bun eval/studies/idempotent-delete.ts <alchemy checkout> --rescore results.json
 */
import { withoutComments } from "#comments.ts";
import type { Rule } from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { CredentialsLive } from "#services/Credentials.ts";
import { fits, judgeBody, type Lines } from "#services/Jev.ts";
import { isInSkippedTree, isTestFile } from "#services/SourceWalker.ts";
import { walkFiles } from "#walk.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Layer, Path, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { type Arm, askJev, auc, Run, table } from "../harness.ts";

const ID = "providers/idempotent-delete";

/** The rule scoped to its subject: a provider's delete handler, not any code that deletes. */
const SCOPED =
  "The delete handler of a resource provider, the `delete:` lifecycle method given the resource's `output`, must treat a resource that is already gone as success, catching the not-found error, never failing when it runs again. Code outside a provider's delete handler, such as a runtime binding, a Worker route, or a storage client, is not in scope.";

/**
 * Whether each labeled file's delete fails when its resource is already gone:
 * the files `adhere lint` 0.9.5 reported under this rule outside tests, two
 * provider deletes it missed, and the provider deletes the scoped rule
 * flagged above 0.8 without comments. Seven of those are left out: IoT
 * FleetWise's, which the account that checked the rest could not call,
 * Application Signals' account-wide one, and Cloudflare's.
 */
const VERDICTS: Readonly<Record<string, "real" | "false">> = {
  "packages/alchemy/src/AWS/AutoScaling/ScalingPolicy.ts": "real",
  "packages/alchemy/src/AWS/AutoScaling/ScheduledAction.ts": "real",
  "packages/alchemy/src/AWS/AutoScaling/LifecycleHook.ts": "real",
  "packages/alchemy/src/AWS/EC2/FlowLog.ts": "real",
  "packages/alchemy/src/AWS/EntityResolution/IdMappingWorkflow.ts": "real",
  "packages/alchemy/src/AWS/EntityResolution/IdNamespace.ts": "real",
  "packages/alchemy/src/AWS/EntityResolution/MatchingWorkflow.ts": "real",
  "packages/alchemy/src/AWS/EntityResolution/SchemaMapping.ts": "real",
  "packages/alchemy/src/AWS/XRay/ResourcePolicy.ts": "real",
  "packages/alchemy/src/AWS/Athena/WorkGroup.ts": "false",
  "packages/alchemy/src/AWS/CloudWatch/Dashboard.ts": "false",
  "packages/alchemy/src/AWS/CodeArtifact/Domain.ts": "false",
  "packages/alchemy/src/AWS/CodeBuild/Project.ts": "false",
  "packages/alchemy/src/AWS/CodeBuild/ReportGroup.ts": "false",
  "packages/alchemy/src/AWS/CodeDeploy/Application.ts": "false",
  "packages/alchemy/src/AWS/CodeDeploy/DeploymentConfig.ts": "false",
  "packages/alchemy/src/AWS/CodeDeploy/DeploymentGroup.ts": "false",
  "packages/alchemy/src/AWS/CodePipeline/Pipeline.ts": "false",
  "packages/alchemy/src/AWS/Config/AggregationAuthorization.ts": "false",
  "packages/alchemy/src/AWS/EC2/KeyPair.ts": "false",
  "packages/alchemy/src/AWS/Glue/Job.ts": "false",
  "packages/alchemy/src/AWS/MailManager/AddonInstance.ts": "false",
  "packages/alchemy/src/AWS/MailManager/AddonSubscription.ts": "false",
  "packages/alchemy/src/AWS/MediaTailor/PlaybackConfiguration.ts": "false",
  "packages/alchemy/src/AWS/SES/ReceiptFilter.ts": "false",
  "packages/alchemy/src/AWS/SES/ReceiptRuleSet.ts": "false",
  "packages/alchemy/src/AWS/SNS/PlatformApplication.ts": "false",
  "packages/alchemy/src/AWS/SSMIncidents/ResponsePlan.ts": "false",
  "packages/alchemy/src/AWS/SimpleDB/Domain.ts": "false",
  "packages/alchemy/src/AWS/StepFunctions/StateMachine.ts": "false",
  "packages/alchemy/src/AWS/VerifiedPermissions/PolicyStore.ts": "false",
  "packages/alchemy/src/AWS/CloudWatch/AlarmMuteRule.ts": "false",
  "packages/alchemy/src/AWS/CloudWatch/CompositeAlarm.ts": "false",
  "packages/alchemy/src/AWS/CloudWatch/Alarm.ts": "false",
  "packages/alchemy/src/AWS/StepFunctions/Activity.ts": "false",
  "packages/alchemy/src/ACME/Certificate.ts": "false",
  "packages/alchemy/src/Cloudflare/SecretsStore/LocalSecretsStoreGateway.ts": "false",
  "packages/alchemy/src/AWS/ApiGateway/DeleteUsagePlanKeyHttp.ts": "false",
  "packages/alchemy/src/Neon/Storage.ts": "false",
  "packages/alchemy/src/Fly/WriteSecretHttp.ts": "false",
  "packages/alchemy/src/Cloudflare/KV/WriteNamespaceHttp.ts": "false",
  "packages/alchemy/src/Server/SQSQueueEventSource.ts": "false",
  "packages/alchemy/src/Cloudflare/Stream/StreamBinding.ts": "false",
  "packages/alchemy/src/Cloudflare/R2/WriteBucketBinding.ts": "false",
  "packages/cloudflare-runtime/src/core/bindings/cache/Cache.worker.ts": "false",
  "packages/alchemy/src/Cloudflare/Tunnel/WriteTunnel.ts": "false",
};

const THRESHOLDS = [0.7, 0.8, 0.9] as const;
const PRICE = 0.042;

/** The checkout's files adhere reads under `packages/`, outside tests, that mention delete. */
const samplesOf = Effect.fn("idempotentDelete.samples")(function* (checkout: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.join(checkout, "packages");
  const enter = (relative: string) =>
    !isInSkippedTree(relative) && !relative.split("/").includes(".git");
  const files = (yield* walkFiles(fs, path, root, enter))
    .map((relative) => `packages/${relative}`)
    .filter(
      (file) =>
        file.endsWith(".ts") &&
        !file.endsWith(".d.ts") &&
        !isInSkippedTree(file) &&
        !isTestFile(file),
    )
    .sort();
  const read = yield* Effect.forEach(
    files,
    (file) => Effect.map(fs.readFileString(path.join(checkout, file)), (text) => ({ file, text })),
    { concurrency: 16 },
  );
  return read
    .filter(({ text }) => /delete/i.test(text))
    .map(({ file, text }) => ({ name: file, lines: text.split("\n") }));
});

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const [checkout, first, second] = process.argv.slice(2);
  if (checkout === undefined) {
    return yield* Effect.die(
      "usage: bun eval/studies/idempotent-delete.ts <alchemy checkout> [results.json | --rescore results.json]",
    );
  }
  const presetFile = path.resolve(
    import.meta.dirname,
    "../../presets/alchemy/providers/idempotent-delete.md",
  );
  const preset = yield* parseRuleMarkdown(yield* fs.readFileString(presetFile), presetFile);
  const scoped: Rule = { ...preset, description: SCOPED };
  const ask =
    (rule: Rule, prepare: (lines: Lines) => Lines): Arm[1] =>
    (model, lines) =>
      judgeBody(model, prepare(lines), { [ID]: rule });
  const kept = (lines: Lines) => lines;
  const arms: ReadonlyArray<Arm> = [
    ["preset", ask(preset, kept)],
    ["preset, no comments", ask(preset, withoutComments)],
    ["scoped", ask(scoped, kept)],
    ["scoped, no comments", ask(scoped, withoutComments)],
  ];

  const found = yield* samplesOf(checkout);
  // As `adhere lint` does, a file too long for Jev's context is left out: Jev refuses it with a 400.
  const samples = found.filter((sample) => fits(sample.lines, { [ID]: scoped }));
  yield* Console.error(`${found.length - samples.length} files too long to judge, left out`);
  const missing = Object.keys(VERDICTS).filter(
    (file) => !samples.some((sample) => sample.name === file),
  );
  if (missing.length > 0) {
    return yield* Effect.die(`labeled files not in the checkout: ${missing.join(", ")}`);
  }
  const saved = first === "--rescore" ? second : undefined;
  const run: Run =
    saved === undefined
      ? yield* askJev(arms, samples, { [ID]: preset }, true)
      : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Run))(
          yield* fs.readFileString(saved),
        );
  if (saved === undefined && first !== undefined) {
    yield* fs.writeFileString(first, `${JSON.stringify(run, null, 2)}\n`);
  }

  const of = (arm: string) => run.judgments.filter((j) => j.arm === arm);
  const byLabel = (arm: string, label: "real" | "false") =>
    of(arm)
      .filter((j) => VERDICTS[j.sample] === label)
      .map((j) => j.probability);
  const count = (probabilities: ReadonlyArray<number>, threshold: number) =>
    probabilities.filter((p) => p > threshold).length;
  const tokens = (arm: string) =>
    run.requests.filter((r) => r.arm === arm).reduce((sum, r) => sum + r.used, 0);

  yield* Console.log(
    `${run.models}: ${samples.length} files outside tests that mention delete and fit Jev's context, ${Object.values(VERDICTS).filter((v) => v === "real").length} labeled real and ${Object.values(VERDICTS).filter((v) => v === "false").length} false.\n`,
  );
  yield* Console.log(
    table(
      [
        "Arm",
        ...THRESHOLDS.map((t) => `Real above ${t}`),
        ...THRESHOLDS.map((t) => `False above ${t}`),
        ...THRESHOLDS.map((t) => `All above ${t}`),
        "AUC",
        "Cost",
      ],
      arms.map(([arm]) => {
        const real = byLabel(arm, "real");
        const wrong = byLabel(arm, "false");
        const all = of(arm).map((j) => j.probability);
        return [
          arm,
          ...THRESHOLDS.map((t) => `${count(real, t)}/${real.length}`),
          ...THRESHOLDS.map((t) => `${count(wrong, t)}/${wrong.length}`),
          ...THRESHOLDS.map((t) => String(count(all, t))),
          auc(real, wrong).toFixed(2),
          `$${((tokens(arm) / 1e6) * PRICE).toFixed(2)}`,
        ];
      }),
    ),
  );
  yield* Console.log(
    `\n${table(
      ["File", "Verdict", ...arms.map(([arm]) => arm)],
      Object.entries(VERDICTS).map(([file, verdict]) => [
        file.replace(/^packages\/alchemy\/src\//, ""),
        verdict,
        ...arms.map(([arm]) => {
          const found = of(arm).find((j) => j.sample === file);
          return found === undefined ? "–" : found.probability.toFixed(2);
        }),
      ]),
    )}`,
  );
});

program.pipe(
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- a study script is an entry point.
  Effect.provide(Layer.mergeAll(FetchHttpClient.layer, CredentialsLive)),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- a study script is an entry point.
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
