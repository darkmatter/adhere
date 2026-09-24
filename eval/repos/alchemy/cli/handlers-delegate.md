# cli/handlers-delegate

A command handler must only parse input and call a service. Business logic must live in the service, never in the handler.

Since left out of the preset: effect-solutions shows the pattern but does not ask for it.

6 findings, from 0.85 down to 0.71. Each showed this hint:

```ts
const addCommand = Command.make("add", { text }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const task = yield* repo.add(text);
    yield* Console.log(`Added task #${task.id}: ${task.text}`);
  }),
).pipe(Command.withDescription("Add a new task"));
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.85 packages/alchemy/src/Cli/commands/prisma.ts:57:5
  54 │     yield* Console.log(
  55 │       `Watching ${loaded.directory}; each generation uses a fresh process.`,
  56 │     );
> 57 │     yield* fs.watch(loaded.directory, { recursive: true }).pipe(

0.81 packages/alchemy/src/Cli/commands/dev.ts:67:9
  64 │       // they launch) inherit it — they are forked from here, not from the exec
  65 │       // child below.
  66 │       if (yield* fs.exists(Floci.FLOCI_CA_PATH)) {
> 67 │         process.env.NODE_EXTRA_CA_CERTS ??= Floci.FLOCI_CA_PATH;
  68 │       }
  69 │       const spawner = yield* RpcSpawner.RpcSpawner;

0.78 packages/alchemy/src/Cli/commands/nuke.ts:147:15
  139 │             for (const resource of scan.resources) {
  140 │               const matches = yield* Effect.forEach(predicates, (predicate) =>
  141 │                 predicate({
  142 │                   ...resource.attributes,
  143 │                   Type: resource.providerId,
  144 │                   LogicalId: resource.displayName,
  145 │                 }),
  146 │               );
> 147 │               if (!matches.some(Boolean)) targets.push(resource);
  148 │             }

0.73 packages/alchemy/src/Cli/commands/logs.ts:99:5
  94 │   const format = (entry: {
  95 │     resource: { fqn: string };
  96 │     timestamp: Date;
  97 │     message: string;
  98 │   }) =>
> 99 │     `${paint(colors.get(entry.resource.fqn) ?? "gray", `${formatLocalTimestamp(entry.timestamp)} [${entry.resource.fqn}]`)} ${entry.message}`;

0.73 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:69:11
  67 │         )
  68 │         .handle("createTask", ({ payload }) => {
> 69 │           const task = new Task({
  70 │             id: crypto.randomUUID(),
  71 │             title: payload.title,
  72 │             completed: false,
  73 │           });
  74 │           return tasks
  75 │             .put(task.id, JSON.stringify(task))
  76 │             .pipe(Effect.orDie, Effect.as(task));
  77 │         })

0.71 packages/alchemy/src/Cli/commands/cloudflare.ts:385:7
  360 │     Effect.fn(function* ({ envFile, profile, workerName, tail, limit, since }) {
  361 │       const scriptName = workerName ?? STATE_STORE_SCRIPT_NAME;
  362 │       const target = {
  363 │         profile,
  364 │         workerName,
  365 │         envFile: Option.getOrUndefined(envFile),
  366 │       };
  367 │       const formatLine = (line: { timestamp: Date; message: string }) =>
  368 │         `${formatLocalTimestamp(line.timestamp)} [${scriptName}] ${line.message}`;
  369 │       if (tail) {
  370 │         yield* CliKit.accessors.output.info(`Tailing ${scriptName}...`);
  371 │         yield* Cloudflare.tailStateLogs(target).pipe(
  372 │           Stream.runForEach((line) => Console.log(formatLine(line))),
  373 │         );
  374 │         return;
  375 │       }
  376 │       const lines = yield* Cloudflare.stateLogs({
  377 │         ...target,
  378 │         limit,
  379 │         since: since ? yield* parseSince(since) : undefined,
  380 │       });
  381 │       if (lines.length === 0) {
  382 │         yield* Console.log(`(no log entries for ${scriptName})`);
  383 │         return;
  384 │       }
> 385 │       for (const line of lines) yield* Console.log(formatLine(line));
  386 │     }),
  387 │   ),
  388 │ ).pipe(
```
