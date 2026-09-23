# cli/handlers-delegate

A command handler must only parse input and call a service. Business logic must live in the service, never in the handler.

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

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.85 packages/alchemy/src/Cli/commands/prisma.ts:57
     yield* fs.watch(loaded.directory, { recursive: true }).pipe(
0.79 packages/alchemy/src/Cli/commands/dev.ts:67
     process.env.NODE_EXTRA_CA_CERTS ??= Floci.FLOCI_CA_PATH;
0.76 packages/alchemy/src/Cli/commands/nuke.ts:147
     if (!matches.some(Boolean)) targets.push(resource);
0.76 packages/alchemy/test/Cloudflare/Workers/fixtures/http-api/worker.ts:69
     const task = new Task({
0.72 packages/alchemy/src/Cli/commands/logs.ts:99
     `${paint(colors.get(entry.resource.fqn) ?? "gray", `${formatLocalTimestamp(entry.timestamp)} [${entry.resource.fqn}]`)}
0.71 packages/alchemy/src/Cli/commands/cloudflare.ts:385
     for (const line of lines) yield* Console.log(formatLine(line));
```
