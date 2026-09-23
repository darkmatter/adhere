# data/variants-are-tagged-unions

Structured variants must be Schema.TaggedClass in a Schema.Union, matched with Match.tag and Match.exhaustive, never a plain union checked with a switch.

33 findings, from 0.91 down to 0.71. Each showed this hint:

```ts
export class Success extends Schema.TaggedClass<Success>("Success")("Success", {
  value: Schema.Number,
}) {}

export class Failure extends Schema.TaggedClass<Failure>("Failure")("Failure", {
  error: Schema.String,
}) {}

export const Result = Schema.Union([Success, Failure]);
export type Result = typeof Result.Type;

const renderResult = (result: Result) =>
  Match.value(result).pipe(
    Match.tag("Success", ({ value }) => `Got: ${value}`),
    Match.tag("Failure", ({ error }) => `Error: ${error}`),
    Match.exhaustive,
  );
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.91 packages/alchemy/src/AWS/StepFunctions/Asl/Jsonata.ts:230
     switch (root.kind) {
0.90 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:75
     switch (entry.kind) {
0.89 packages/alchemy/src/Local/RpcSerialization.ts:123
     switch (reason._tag) {
0.88 packages/alchemy/src/AWS/Website/SsrSite.ts:161
     const serverOriginOf = (server: SsrSiteServerOrigin): Input<string> =>
0.88 packages/cloudflare-runtime/src/core/platform-proxy/PlatformProxyProtocol.shared.ts:161
     switch (typeof value) {
0.86 packages/alchemy/src/Fly/DeploymentState.ts:19
     if (protocol !== undefined && protocol !== "1" && protocol !== "2")
0.86 packages/alchemy/src/Infisical/AuthProvider.ts:321
     config.method === "universal-auth"
0.85 packages/alchemy/src/AWS/CloudWatch/binding-common.ts:29
     switch (resource.Type) {
0.83 packages/cloudflare-runtime/src/core/internal/internal-modules.ts:29
     switch (module.type) {
0.82 packages/alchemy/src/AWS/ELBv2/common.ts:183
     switch (action.type) {
0.82 packages/alchemy/src/Git/Jobs/Fork.ts:341
     }
0.82 packages/alchemy/src/Git/Protocol/Pkt.ts:204
     case "incomplete":
0.81 packages/alchemy/src/Alchemist/Progress.ts:53
     switch (event._tag) {
0.80 packages/alchemy-test/src/FileLog.ts:33
     switch (event._tag) {
0.79 packages/alchemy/src/Git/Protocol/PackWriter.ts:130
     event._tag === "data" ? Stream.succeed(event.bytes) : Stream.empty,
0.79 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:95
     (event.trigger.type === "schedule" &&
0.78 packages/alchemy-test/src/PlainReporter.ts:271
     switch (event.result.status) {
0.78 packages/alchemy/src/Alchemist/routes/state.ts:41
     if (source.backend === "local") {
0.78 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:621
     } else if (build.kind === "external") {
0.78 packages/alchemy/src/SQLite/SQLiteError.ts:681
     case "SQLITE_BUSY":
0.78 packages/cloudflare-runtime/src/internal/workflows-shared/subscription.ts:314
     if (result.done || isTerminalEvent(result.value)) {
0.77 packages/cloudflare-runtime/src/core/registry/RegistryProxy.ts:206
     switch (subscriber.kind) {
0.76 packages/alchemy/src/Redis/Resp.ts:461
     case PLUS: {
0.74 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:61
     | FunctionEcrImageSource;
0.74 packages/alchemy/src/Prisma/Internal/Observed.ts:175
     if (source == null) return { type: "empty" };
0.73 packages/alchemy/src/Prisma/PrismaLogs.ts:82
     raw.type === "log" || raw.type === "terminal" ? raw.type : "unknown";
0.73 packages/alchemy/src/Stripe/missing.ts:10
     if (error._tag === "NotFound") {
0.72 packages/alchemy/src/AWS/Pipes/builders.ts:222
     case "AWS.Kinesis.Stream":
0.72 packages/alchemy/src/AWS/StepFunctions/Asl/compile.ts:441
     case "gen": {
0.72 packages/alchemy/src/Cloudflare/Workers/RuntimeBindings.ts:69
     switch (b.type) {
0.71 packages/alchemy/src/AWS/RDS/ConnectHttp.ts:41
     switch (resource.Type) {
0.71 packages/alchemy/src/AWS/StepFunctions/Asl/simulate.ts:219
     case "all":
0.71 packages/alchemy/src/Cloudflare/Email/Rule.ts:13
     export type Matcher =
```
