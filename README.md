# adhere

Audits the repository you run it in against the rules in `adhere.config.ts`.
A rule with a line test flags the match itself. A rule that cannot be written
that way sets `judged: true` and a `pattern`: the file and that pattern go to
[Jev](https://typesafe.ai), and Jev decides the flag. The report uses the same
frame as `vp lint`.

## Run

Requires Bun. `TYPESAFE_API_KEY` is required when the config contains a judged rule.

```ts
import { defineConfig, includes } from "@darkmatter/adhere";

export default defineConfig([
  {
    topic: "config",
    rule: "process-env-read",
    message: "Configuration is read from process.env.",
    help: "Read it with Config.string, Config.int, or Config.redacted.",
    ...includes("process.env."),
  },
]);
```

```sh
bun install
bun src/main.ts
bun src/main.ts --topics config --threshold 0.5
```

The scan starts at the current working directory. When that directory contains
`agents/`, `apps/`, or `packages/`, only those trees are read. Verdicts are
cached in `.adhere-cache/` in the working directory.
