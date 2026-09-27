---
description: Input from outside the program, such as a request's parameters or body, must reach a shell command only as a separate argument, and a file path only after the resolved path is checked to be inside the directory meant for it; it must never be interpolated into a command string, passed to `eval` or `new Function`, or joined into a path unchecked.
---

## Must

```ts
const file = resolve(UPLOADS, request.params.name);
if (!file.startsWith(UPLOADS + sep)) return new Response("Not found", { status: 404 });
const { stdout } = await execFile("ffprobe", ["-show_format", file]);
```

## Never

```ts
const file = join(UPLOADS, request.params.name);
const { stdout } = await exec(`ffprobe -show_format ${file}`);
```
