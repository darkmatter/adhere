# adhere

Audits the repository you run it in against the topics published by the
`effect-solutions` CLI.
Line rules propose candidates. [Jev](https://typesafe.ai) judges each excerpt
against the topic's documented pattern. The report uses the same frame as `vp lint`.

## Run

Requires Bun, the `effect-solutions` CLI on `PATH`, and `TYPESAFE_API_KEY`.

```sh
bun install
export TYPESAFE_API_KEY=...
bun src/main.ts
bun src/main.ts --topics config --threshold 0.5
```

The scan starts at the current working directory. When that directory contains
`agents/`, `apps/`, or `packages/`, only those trees are read. Verdicts are
cached in `.adhere-cache.json` in the working directory.
