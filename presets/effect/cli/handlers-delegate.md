---
description: A command handler parses input and calls a service. Business logic lives in the service.
---

```ts
const addCommand = Command.make("add", { text }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const task = yield* repo.add(text);
    yield* Console.log(`Added task #${task.id}: ${task.text}`);
  }),
).pipe(Command.withDescription("Add a new task"));
```
