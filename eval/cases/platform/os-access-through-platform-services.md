# platform/os-access-through-platform-services

Reading a file through `node:fs` and `process.cwd()` breaks the rule; the same
read through `FileSystem` and `Path` follows it.

```ts breaks
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";

export const loadTemplate = Effect.fn("loadTemplate")(function* (name: string) {
  return yield* Effect.promise(() =>
    readFile(join(process.cwd(), "templates", `${name}.html`), "utf8"),
  );
});
```

```ts follows
import { Effect, FileSystem, Path } from "effect";

export const loadTemplate = Effect.fn("loadTemplate")(function* (name: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  return yield* fs.readFileString(path.join(path.resolve(), "templates", `${name}.html`));
});
```
