---
description: A command handler must only parse input and call a service. Business logic must live in the service, never in the handler.
---

```ts must
const addCommand = Command.make("add", { text }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const task = yield* repo.add(text);
    yield* Console.log(`Added task #${task.id}: ${task.text}`);
  }),
).pipe(Command.withDescription("Add a new task"));
```

```ts never
Command.make("rename", { from, to }, ({ from, to }) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const text = yield* fs.readFileString(from);
    yield* fs.writeFileString(to, text.replaceAll("draft", "final"));
    yield* fs.remove(from);
  }),
);
```
