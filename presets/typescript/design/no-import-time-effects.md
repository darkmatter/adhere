---
description: Importing a module must not do work with effects outside the module, such as reading files, making network requests, connecting to a database, starting a server or a timer, or registering a global listener; that work must happen in a function the module's caller runs, never at the module's top level.
excludeIf: ["code in a program's entry point, such as a main, server, or CLI file that exists to run on start"]
---

## Must

```ts
export const loadTemplates = async (dir: string) =>
  Promise.all((await readdir(dir)).map((name) => readFile(join(dir, name), "utf8")));

export const startMetrics = () => setInterval(flushMetrics, 10_000);
```

## Never

```ts
export const templates = await Promise.all(
  (await readdir("./templates")).map((name) => readFile(join("./templates", name), "utf8")),
);

setInterval(flushMetrics, 10_000);
```
