# data/variants-are-tagged-unions

Structured variants must be Schema.TaggedClass in a Schema.Union, matched with Match.tag and Match.exhaustive, never a plain union checked with a switch.

The preset words it differently now: Structured variants, alternatives that carry fields, must be Schema.TaggedClass members of a Schema.Union, never hand-written object types joined by a tag field. Simple alternatives without fields may be Schema.Literals.

33 findings, from 0.89 down to 0.71. Each showed this hint:

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

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.89 packages/alchemy/src/Local/RpcSerialization.ts:123:11
  109 │     Effect.map((exit): RpcSerializedExit<Success, Error> => {
  110 │       if (exit._tag === "Success") {
  111 │         // Success values need the same marker treatment as args: provider
  112 │         // attributes can legitimately carry `Redacted` secrets (e.g. a local
  113 │         // container's bound env), and a raw Redacted reaching capnweb dies
  114 │         // with `TypeError: Cannot serialize value: <redacted>`.
  115 │         return {
  116 │           _tag: "Success",
  117 │           value: serializeRpcArgs(exit.value) as Success,
  118 │         };
  119 │       }
  120 │       return {
  121 │         _tag: "Failure",
  122 │         cause: exit.cause.reasons.map((reason): RpcSerializedCause<Error> => {
> 123 │           switch (reason._tag) {
  124 │             case "Fail":
  125 │               return {
  126 │                 _tag: "Fail",
  127 │                 error: serializeError(reason.error) as Error,
  128 │               };
  129 │             case "Die":
  130 │               return { _tag: "Die", defect: serializeError(reason.defect) };
  131 │             case "Interrupt":
  132 │               return { _tag: "Interrupt", fiberId: reason.fiberId };
  133 │           }
  134 │         }),
  135 │       };
  136 │     }),

0.89 packages/cloudflare-runtime/src/core/registry/RegistryTypes.shared.ts:75:3
  74 │ export const resolvedTargetKey = (entry: ResolvedTarget | Subscriber) => {
> 75 │   switch (entry.kind) {
  76 │     case "worker":
  77 │       return `worker:${entry.scriptName}` as const;
  78 │     case "durable-object":
  79 │       return `durable-object:${entry.scriptName}:${entry.className}` as const;
  80 │     case "queue-consumer":
  81 │       return `queue-consumer:${entry.queueName}` as const;
  82 │     case "workflow":
  83 │       return `workflow:${entry.scriptName}:${entry.workflowName}` as const;
  84 │   }
  85 │ };

0.88 packages/alchemy/src/AWS/StepFunctions/Asl/Jsonata.ts:230:3
  227 │ const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
  228 │
  229 │ const renderRoot = (root: ExprRoot): string => {
> 230 │   switch (root.kind) {
  231 │     case "input":
  232 │       return "$states.context.Execution.Input";
  233 │     case "variable":
  234 │       return `$${root.name}`;
  235 │     case "token":
  236 │       return "$states.context.Task.Token";
  237 │   }
  238 │ };

0.87 packages/cloudflare-runtime/src/core/platform-proxy/PlatformProxyProtocol.shared.ts:241:5
  238 │   const custom = decodeUnknown?.(encoded);
  239 │   if (custom !== undefined) return custom.value;
  240 │   switch (encoded.$) {
> 241 │     case "undefined":
  242 │       return undefined;
  243 │     case "null":
  244 │       return null;

0.86 packages/alchemy/src/Fly/DeploymentState.ts:19:3
  17 │   const metadata = machine.config?.metadata;
  18 │   const protocol = metadata?.[keys.protocol];
> 19 │   if (protocol !== undefined && protocol !== "1" && protocol !== "2")

0.85 packages/alchemy/src/AWS/Website/SsrSite.ts:82:3
> 82 │   domain?: string | WebsiteStandaloneDomainProps | null;

0.84 packages/alchemy/src/Infisical/AuthProvider.ts:321:9
  317 │   details: (_, config) =>
  318 │     Effect.succeed({
  319 │       lines: [
  320 │         { key: "method", value: config.method },
> 321 │         config.method === "universal-auth"
  322 │           ? { key: "clientId", value: config.clientId }
  323 │           : {
  324 │               key: "token",
  325 │               value: displayRedacted(Redacted.make(config.token)),
  326 │             },
  327 │         { key: "apiBaseUrl", value: config.apiBaseUrl ?? DEFAULT_API_BASE_URL },
  328 │       ],
  329 │     }),

0.83 packages/alchemy/src/AWS/CloudWatch/binding-common.ts:29:3
  28 │ export const getTaggableResourceArn = (resource: TaggableResource) => {
> 29 │   switch (resource.Type) {
  30 │     case "AWS.CloudWatch.Alarm":
  31 │     case "AWS.CloudWatch.CompositeAlarm":
  32 │       return resource.alarmArn;
  33 │     case "AWS.CloudWatch.Dashboard":
  34 │       return resource.dashboardArn;
  35 │     case "AWS.CloudWatch.MetricStream":
  36 │       return resource.metricStreamArn;
  37 │     case "AWS.CloudWatch.InsightRule":
  38 │       return resource.ruleArn;
  39 │     case "AWS.CloudWatch.AlarmMuteRule":
  40 │       return resource.alarmMuteRuleArn;
  41 │   }
  42 │ };

0.83 packages/alchemy/src/Git/Protocol/Pkt.ts:204:9
  193 │ ): Effect.Effect<ReadonlyArray<PktLine>, PktLineError> =>
  194 │   Effect.suspend(() => {
  195 │     const out: Array<PktLine> = [];
  196 │     let pos = offset;
  197 │     while (pos < buf.length) {
  198 │       const r = readPktLineAt(buf, pos);
  199 │       switch (r._tag) {
  200 │         case "pkt":
  201 │           out.push(r.pkt);
  202 │           pos = r.next;
  203 │           break;
> 204 │         case "incomplete":
  205 │           return Effect.fail(
  206 │             new PktLineError({ reason: `truncated pkt-line at offset ${pos}` }),
  207 │           );
  208 │         case "invalid":
  209 │           return Effect.fail(new PktLineError({ reason: r.reason }));
  210 │       }
  211 │     }
  212 │     return Effect.succeed(out);
  213 │   });

0.82 packages/cloudflare-runtime/src/core/internal/internal-modules.ts:29:3
  26 │ export const moduleToWorkerd = (
  27 │   module: Module,
  28 │ ): WorkerdConfig.Worker_Module => {
> 29 │   switch (module.type) {
  30 │     case "ESModule":
  31 │       return { name: module.name, esModule: module.content };
  32 │     case "CommonJsModule":
  33 │       return { name: module.name, commonJsModule: module.content };
  34 │     case "Text":
  35 │       return { name: module.name, text: module.content };
  36 │     case "Data":
  37 │       return { name: module.name, data: module.content };
  38 │     case "Wasm":
  39 │       return { name: module.name, wasm: module.content };
  40 │     case "Json":
  41 │       return { name: module.name, json: module.content };
  42 │     case "PythonModule":
  43 │       return { name: module.name, pythonModule: module.content };
  44 │   }
  45 │ };

0.81 packages/alchemy/src/Alchemist/Progress.ts:53:3
  50 │ const spanEventOf = (
  51 │   event: ProgressEvent,
  52 │ ): { name: string; attributes: Record<string, unknown> } | undefined => {
> 53 │   switch (event._tag) {

0.81 packages/alchemy/src/AWS/ELBv2/common.ts:183:5
  180 │ export const serializeActions = (actions: ListenerAction[]): elbv2.Action[] =>
  181 │   actions.map((action, index): elbv2.Action => {
  182 │     const Order = index + 1;
> 183 │     switch (action.type) {

0.81 packages/alchemy/src/Git/Protocol/PackWriter.ts:130:5
  129 │   Stream.flatMap(events, (event) =>
> 130 │     event._tag === "data" ? Stream.succeed(event.bytes) : Stream.empty,
  131 │   );

0.81 packages/alchemy/src/Neon/FunctionTriggerEvent.ts:95:5
   92 │   if (
   93 │     !event.trigger.id ||
   94 │     !event.trigger.name ||
>  95 │     (event.trigger.type === "schedule" &&
   96 │       "scheduled_at" in event.data &&
   97 │       !event.data.scheduled_at) ||
   98 │     ("bucket_name" in event.data &&
   99 │       (!event.data.bucket_name || !event.data.object_key))
  100 │   )

0.79 packages/alchemy-test/src/FileLog.ts:33:3
  31 │ /** Render an event as a log chunk; `undefined` = nothing to write. */
  32 │ export const formatEvent = (event: TestEvent): string | undefined => {
> 33 │   switch (event._tag) {
  34 │     case "PlanPreview":
  35 │       return `${formatPlanPreview(event.phases)}\n`;

0.79 packages/alchemy/src/Git/Jobs/Fork.ts:341:3
> 341 │   }
  342 │ });

0.78 packages/alchemy/src/Cloudflare/Containers/ContainerProvider.ts:621:9
  618 │           yield* docker.image
  619 │             .push(imageRef, credentials, platform)
  620 │             .pipe(retryContainerPublication);
> 621 │         } else if (build.kind === "external") {

0.76 packages/alchemy/src/AWS/Lambda/FunctionImage.ts:61:3
  59 │ export type FunctionImageSource =
  60 │   | FunctionDockerImageSource
> 61 │   | FunctionEcrImageSource;

0.75 packages/alchemy-test/src/PlainReporter.ts:271:7
  270 │       const count = progress(state, event.result.status);
> 271 │       switch (event.result.status) {
  272 │         case "pass":
  273 │           return write(`${count} ${green("✓")} ${title} ${duration}${retries}`);
  274 │         case "fail": {
  275 │           // Show the failure's details immediately so it can be inspected
  276 │           // while the run continues (passed tests stay silent). The end-of-run
  277 │           // Failures section repeats them consolidated, with file hook logs.
  278 │           const lines = [`${count} ${red("✗")} ${title} ${duration}${retries}`];
  279 │           if (event.result.error !== undefined) {
  280 │             lines.push(indent(red(event.result.error)));
  281 │           }
  282 │           if (event.result.logs.length > 0) {
  283 │             lines.push(dim("--- captured output ---"));
  284 │             lines.push(formatLogs(event.result.logs));
  285 │             lines.push(dim("--- end output ---"));
  286 │           }
  287 │           return write(lines.join("\n"));
  288 │         }
  289 │         case "skip":
  290 │           return write(`${count} ${yellow("↓")} ${title} ${dim("[skipped]")}`);
  291 │         case "todo":
  292 │           // Warning-styled: a todo is unimplemented coverage, not a pass —
  293 │           // it must not blend in with the dim noise around it.
  294 │           return write(
  295 │             `${count} ${yellow(
  296 │               `○ ${event.test.file} > ${event.test.titlePath.join(" > ")} ${bold("[todo]")}`,
  297 │             )}`,
  298 │           );
  299 │       }

0.75 packages/alchemy/src/Prisma/PrismaLogs.ts:82:9
  80 │       const raw = parsed as Partial<PrismaDeploymentLogRecord>;
  81 │       recordType =
> 82 │         raw.type === "log" || raw.type === "terminal" ? raw.type : "unknown";

0.75 packages/alchemy/src/Redis/Resp.ts:461:5
  458 │   const type = buf[cursor]!;
  459 │   const next = cursor + 1;
  460 │   switch (type) {
> 461 │     case PLUS: {
  462 │       const line = parseLine(buf, next);
  463 │       if (line === undefined) return INCOMPLETE;
  464 │       if (line instanceof ProtocolError) return { ok: false, error: line };
  465 │       return ok({ _tag: "Reply", value: line.text }, line.next);
  466 │     }

0.75 packages/alchemy/src/SQLite/SQLiteError.ts:681:5
  679 │     case "SQLITE_ABORT":
  680 │       return new SQLiteAbort({ message, cause });
> 681 │     case "SQLITE_BUSY":
  682 │       return new SQLiteBusy({ message, cause });
  683 │     case "SQLITE_LOCKED":
  684 │       return new SQLiteLocked({ message, cause });

0.75 packages/cloudflare-runtime/src/internal/workflows-shared/subscription.ts:314:9
  299 │   async next(): Promise<IteratorResult<WorkflowSubscriptionEvent, undefined>> {
  300 │     if (this.#closed) {
  301 │       return { done: true, value: undefined };
  302 │     }
  303 │
  304 │     const request = this.#nextRequest.then(async () => {
  305 │       if (this.#closed) {
  306 │         return { done: true, value: undefined } as const;
  307 │       }
  308 │
  309 │       try {
  310 │         const result = await this.#nextEvent();
  311 │         if (this.#closed) {
  312 │           return { done: true, value: undefined } as const;
  313 │         }
> 314 │         if (result.done || isTerminalEvent(result.value)) {
  315 │           this.#finish();
  316 │         }
  317 │         return result;
  318 │       } catch (error) {
  319 │         this.#finish();
  320 │         throw error;
  321 │       }
  322 │     });
  323 │     this.#nextRequest = request;
  324 │     return request;
  325 │   }

0.74 packages/alchemy/src/Alchemist/routes/state.ts:41:3
  38 │ export const store = Effect.fn("Alchemist.state.store")(function* (
  39 │   source: StateSource,
  40 │ ) {
> 41 │   if (source.backend === "local") {
  42 │     return yield* Effect.provide(
  43 │       Effect.flatten(State.State),
  44 │       State.localState(),
  45 │     );
  46 │   }

0.74 packages/alchemy/src/AWS/StepFunctions/Asl/compile.ts:441:5
> 441 │     case "gen": {
  442 │       const iterator = node.body(inputExpr());
  443 │       const fragments: Fragment[] = [];
  444 │       let step = iterator.next();

0.74 packages/alchemy/src/Cloudflare/Workers/RuntimeBindings.ts:160:9
  147 │       if (b.queueId !== undefined && !isLocalId(b.queueId)) {
  148 │         const url = b.shim?.url;
  149 │         const token = b.shim?.token;
  150 │         if (url === undefined || token === undefined) {
  151 │           // Defensive: binding data produced by current eval always carries
  152 │           // the shim for this mode combination.
  153 │           return yield* new WorkerValidationError({
  154 │             message:
  155 │               `Queue binding "${b.name}" targets a live queue ` +
  156 │               "(Alchemy.remote()) but no producer shim was registered for it — " +
  157 │               "re-deploy, or remove remote() from the queue (local emulation).",
  158 │             value: b,
  159 │           });
> 160 │         }
  161 │         return Queue.remote({
  162 │           binding: b.name,
  163 │           queueName: b.queueName,
  164 │           url,
  165 │           token: typeof token === "string" ? token : Redacted.value(token),
  166 │         });
  167 │       }

0.74 packages/alchemy/src/Prisma/Internal/Observed.ts:175:3
  164 │ export const narrowDatabaseSource = (
  165 │   source: ObservedSource | undefined | null,
  166 │ ):
  167 │   | { readonly type: "empty" }
  168 │   | { readonly type: "unknown" }
  169 │   | { readonly type: "database"; readonly databaseId: string }
  170 │   | {
  171 │       readonly type: "backup";
  172 │       readonly databaseId: string;
  173 │       readonly backupId: string;
  174 │     } => {
> 175 │   if (source == null) return { type: "empty" };
  176 │   if (source.type === "empty") return { type: "empty" };
  177 │   if (source.type === "database" && source.databaseId !== undefined) {
  178 │     return { type: "database", databaseId: source.databaseId };
  179 │   }
  180 │   if (
  181 │     source.type === "backup" &&
  182 │     source.databaseId !== undefined &&
  183 │     source.backupId !== undefined
  184 │   ) {
  185 │     return {
  186 │       type: "backup",
  187 │       databaseId: source.databaseId,
  188 │       backupId: source.backupId,
  189 │     };
  190 │   }
  191 │   return { type: "unknown" };
  192 │ };

0.74 packages/cloudflare-runtime/src/core/registry/RegistryProxy.ts:206:17
  203 │             subscribe: <T extends Subscriber>(subscriber: T) =>
  204 │               Effect.sync<ServiceDesignatorFromSubscriber<T>>(() => {
  205 │                 subscribed.push(subscriber);
> 206 │                 switch (subscriber.kind) {

0.72 packages/alchemy/src/AWS/StepFunctions/Asl/simulate.ts:219:5
> 219 │     case "all":
  220 │       return Effect.forEach(node.branches, (branch) =>
  221 │         runNode(branch.node, childEnv(env)),
  222 │       );

0.72 packages/alchemy/src/Local/RpcServerBun.ts:14:9
  12 │     const server = yield* Effect.sync(() =>
  13 │       Bun.serve<
> 14 │         | { type: "session"; session: ServerRpcSession<any> }
  15 │         | { type: "pending"; sessionEnv: string | undefined }
  16 │         | { type: "parent" }
  17 │       >({

0.72 packages/alchemy/src/Stripe/missing.ts:10:3
   9 │ export const isMissingStripeResource = (error: StripeOpError): boolean => {
> 10 │   if (error._tag === "NotFound") {
  11 │     return true;
  12 │   }
  13 │   return (
  14 │     error._tag === "InvalidRequestError" && error.code === "resource_missing"
  15 │   );
  16 │ };

0.71 packages/alchemy/src/AWS/Pipes/builders.ts:222:5
> 222 │     case "AWS.Kinesis.Stream":
  223 │       return {
  224 │         arn: source.streamArn,
  225 │         statements: [
  226 │           {
  227 │             Effect: "Allow",
  228 │             Action: [
  229 │               "kinesis:DescribeStream",
  230 │               "kinesis:DescribeStreamSummary",
  231 │               "kinesis:GetRecords",
  232 │               "kinesis:GetShardIterator",
  233 │               "kinesis:ListShards",
  234 │               "kinesis:ListStreams",
  235 │             ],
  236 │             Resource: [source.streamArn],
  237 │           },
  238 │         ],
  239 │         parameters: {
  240 │           ...filterCriteria,
  241 │           KinesisStreamParameters: {
  242 │             StartingPosition: options.startingPosition ?? "LATEST",
  243 │             BatchSize: options.batchSize,
  244 │             MaximumBatchingWindowInSeconds: maximumBatchingWindowInSeconds,
  245 │           },
  246 │         },
  247 │       };

0.71 packages/alchemy/src/Git/GitHubCompat.ts:222:11
> 222 │           case "WrongObjectType":
  223 │           case "ValidationError":
  224 │           case "NoMergeBase":
  225 │             return ghError(422, "Validation Failed");
```
