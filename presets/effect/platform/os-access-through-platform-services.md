---
description: File, path, process, terminal, and HTTP access must go through Effect's platform services (FileSystem, Path, ChildProcess, Terminal, HttpClient, KeyValueStore), acquired with yield*, never through node: builtins, Bun globals, or fetch. The Bun implementations must be provided once at the entry point with BunServices.layer.
---

```ts must
import { Effect, FileSystem, Path } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { BunRuntime, BunServices } from "@effect/platform-bun";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* fs.readFileString(path.join(path.resolve(), "config.json"));
  const response = yield* HttpClient.get("https://api.example.com/users");
  const users = yield* HttpClientResponse.schemaBodyJson(Users)(response);
  return { config, users };
});

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain);
```

```ts never
import { readFileSync } from "node:fs";

const settings = readFileSync("settings.json", "utf8");
```
