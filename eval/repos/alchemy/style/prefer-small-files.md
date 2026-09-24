# style/prefer-small-files

Prefer small focused files with one primary responsibility.

An example rule from an earlier `adhere init`, in the checkout's `.adhere/style/`, not a preset rule.

7 findings, from 0.84 down to 0.81. Each showed this hint:

```ts
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.84 packages/alchemy/src/Util/Node.ts:15:1
> 15 │ export const initialCwd: string = process.cwd();

0.83 packages/alchemy/src/AWS/IdentityCenter/common.ts:36:1
> 36 │ export const listInstances = Effect.fn(function* () {
  37 │   return yield* ssoAdmin.listInstances
  38 │     .items({
  39 │       MaxResults: 100,
  40 │     })
  41 │     .pipe(
  42 │       Stream.runCollect,
  43 │       Effect.map(
  44 │         (instances) => Array.from(instances) as ssoAdmin.InstanceMetadata[],
  45 │       ),
  46 │     );
  47 │ });

0.82 packages/cloudflare-runtime/src/rolldown/test/fixtures/export-types/entry.ts:7:1
> 7 │ export default {
  8 │   fetch: () => new Response("default"),
  9 │ };

0.81 packages/alchemy/src/AWS/Deadline/internal.ts:81:1
>  81 │ export const reapDeadlineLogGroups = Effect.fn(function* (prefix: string) {
   82 │   const groups = yield* logs.describeLogGroups
   83 │     .pages({ logGroupNamePrefix: prefix })
   84 │     .pipe(
   85 │       EffectStream.runCollect,
   86 │       Effect.map((chunk) =>
   87 │         Array.from(chunk)
   88 │           .flatMap((page) => page.logGroups ?? [])
   89 │           .map((group) => group.logGroupName)
   90 │           .filter((name): name is string => name != null),
   91 │       ),
   92 │     );
   93 │   yield* Effect.forEach(
   94 │     groups,
   95 │     (logGroupName) =>
   96 │       logs
   97 │         .deleteLogGroup({ logGroupName })
   98 │         .pipe(Effect.catchTag("ResourceNotFoundException", () => Effect.void)),
   99 │     { concurrency: 4, discard: true },
  100 │   );
  101 │ });

0.81 packages/alchemy/src/AWS/MediaPackageV2/internal.ts:1:1
> 1 │ import * as mediapackagev2 from "@distilled.cloud/aws/mediapackagev2";
  2 │ import * as Effect from "effect/Effect";
  3 │ import * as Schedule from "effect/Schedule";
  4 │ import * as Stream from "effect/Stream";

0.81 packages/alchemy/src/Neon/Website/Artifact.ts:320:3
  317 │   const seeds = new Set<string>(entry ? [entry] : []);
  318 │   const manifests: string[] = [];
  319 │   let visited = 0;
> 320 │   const collect: (
  321 │     source: string,
  322 │     boundary?: string,
  323 │     ancestors?: ReadonlySet<string>,
  324 │     runtimePackage?: boolean,
  325 │   ) => Effect.Effect<void, WebsiteArtifactError | PlatformError> = Effect.fn(

0.81 packages/frontend-frameworks/src/core/index.ts:1:1
> 1 │ export {
  2 │   parseBuildOutput,
  3 │   readBuildOutput,
  4 │   sortServerModules,
  5 │   stringifyBuildOutput,
  6 │   toOutputFile,
  7 │   writeBuildOutput,
  8 │ } from "./BuildOutput.ts";
```
