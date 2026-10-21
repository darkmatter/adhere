---
title: "State Hooks and Type-Awareness"
---

Jev judges a file from its state: the file's `code`, and maps of context beside
it. The config chooses the maps every rule reads (see
[What Jev reads](#what-jev-reads)). A rule written in TypeScript can add state
of its own with a hook (see [State hooks](#state-hooks)), and take settings
from each project that uses it (see [Rule options](#rule-options)).

## What Jev reads

The state sent for one file, `packages/orders/src/total.ts`, with every map
on and each map's `__comment` cut short:

````json
{
  "code": {
    "1": "import { formatCents } from \"money\";\nimport { sum } from \"./sum\";\n\nexport const total = (prices: number[]): string => formatCents(sum(prices));\n"
  },
  "workspacePackages": {
    "__comment": "Workspace packages imported by `code`; …",
    "money": "packages/money"
  },
  "dependents": {
    "__comment": "What depends on the file `code` holds. …",
    "packages": { "web": "packages/web" },
    "files": ["packages/orders/src/index.ts"]
  },
  "symbols": {
    "__comment": "Compiler-rendered types and documentation for symbols used in `code`; …",
    "formatCents": "```typescript\n(cents: number) => string\n```\n\nFormats cents as dollars, as in `$12.50`.",
    "prices": "```typescript\nnumber[]\n```",
    "sum": "```typescript\n(values: number[]) => number\n```",
    "total": "```typescript\n(prices: number[]) => string\n```"
  },
  "references": {
    "__comment": "Declarations of symbols used in `code`. …",
    "formatCents:packages/money/src/index.ts": "export const formatCents = (cents: number): string => `$${(cents / 100).toFixed(2)}`;",
    "sum:packages/orders/src/sum.ts": "export const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);"
  },
  "__comment": "Only `code` is the audit target; it is split into numbered sections. All other state entries provide context, not additional code to audit."
}
````

- **`code`** is always sent: the file's [sections](/adhere/how-a-file-is-judged/),
  numbered from 1, without [comments](/adhere/comments-and-suppressions/#comments) unless `includeComments` is
  on.
- **`workspacePackages`**, on by default: the repo's own packages the file
  imports, each with its directory. A package the file imports that is not
  listed is an installed one.
- **`dependents`**, off by default: the workspace packages whose
  `package.json` depends on the file's package, and up to 50 files that import
  the file by a relative path, with `omittedFiles` counting the rest. Imports
  by package name or `tsconfig` path alias do not count, nor do files that
  `--filter` or `exclude` leaves out. To find them, lint reads every file once
  more before it plans.
- **`symbols`**, with type awareness: the compiler's type of each name the
  code uses, with its documentation and JSDoc tags, leaving out
  standard-library and runtime built-ins. `maxSymbolLength` and
  `maxSymbolDocumentationLength` cap each one (see [Config](/adhere/config/)).
- **`references`**, with type awareness: the whole declaration of each symbol
  the code uses from another file of the repo, keyed by the name the code uses
  and the declaring file's path. A function comes with its body, a method
  without the rest of its class.
- **`__comment`**, in each map and a rule's [`options`](#rule-options), tells
  Jev what the map holds. The top-level one says only `code` is judged. adhere
  adds them before a [state hook](#state-hooks) runs, and again to any map the
  hook returns without one.

`reads` in the config chooses the workspace maps, and `typeAware` adds the
compiler's:

```ts
// .adhere/config.ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  reads: ["workspacePackages", "dependents"], // default: ["workspacePackages"]
  typeAware: true, // or --type-aware; off by default
});
```

- `reads: []`, with type awareness off, sends the code alone. Neither
  workspace map needs the compiler.
- `typeAware` adds `symbols` and `references` whatever `reads` says. The
  compiler uses each file's `tsconfig.json`, and works without one.
- An unknown name in `reads` refuses the run. Only the config has `reads`.
- A rule's description can name a map in backticks, as Jev's questions name
  `code`. To give Jev something no map covers, such as another file, add it
  with a [state hook](#state-hooks).
- `adhere lint --log-level debug` logs a run's first request in full.

**Cost and privacy.** Type awareness sends Jev more than the file it judges:
whole declarations from other files, and the compiler's documentation and JSDoc
tags in `symbols`, even with `includeComments` off. It also starts the native
compiler during the run. The plan's estimate leaves those tokens out.

<details>
<summary>Where the packages come from</summary>

- The packages are read on every run from the working directory's
  `package.json`, whose `workspaces` npm, Bun, and Yarn read, and from
  `pnpm-workspace.yaml`'s `packages`.
- In a pattern, `*` is any directory and `**` any depth of them, and one that
  starts with `!` leaves out what it matches. Each matched directory's
  `package.json` gives the name, and its directory is given from the working
  directory.
- Nothing need be installed, so a run in CI reads the same packages as one on a
  laptop.
- A working directory that is not a workspace's root has none.
- Only an import whose path is a plain string counts, and one of a subpath, such
  as `orders-core/client`, counts as its package's.

</details>

## State hooks

A rule can add to what Jev reads for it with `appendState`, a hook in its
[`RULE.ts`](/adhere/rule-format/#rules-as-typescript-files) or in a config's inline rule:

```ts
// .adhere/rules/data/columns/RULE.ts
import { defineRule } from "@drkmttr/adhere";

export default defineRule({
  description:
    "A query must name only columns its table has in `schema`, and never a column it lacks.",
  must: 'db.select("id", "email").from("users")',
  never: 'db.select("mail").from("users")',
  appendState: async (state, file, Bun) => ({
    schema: await Bun.file("db/schema.sql").text(),
  }),
});
```

- The hook runs right before each request about the rule goes out. It gets the
  request's state, the file the request is about, and Bun's API. What it
  returns is spread over the state.
- The description can name a key the hook adds, in backticks, as the questions
  name `code`.
- A rule with a hook goes to Jev in requests of its own, so only that rule reads
  what its hook adds. Each of those requests sends the file and its context
  again.
- What the hook reads outside the file is not part of the cache. When
  `db/schema.sql` changes, a file already judged is not judged again until it
  or the rule changes.

<details>
<summary>More on the hook</summary>

- `state` is what Jev reads beside each question: `code`, the file's sections
  as Jev reads them, under their numbers from 1, as in
  `{ code: { "1": "import …", "2": "export const …" } }`, beside the maps
  [What Jev reads](#what-jev-reads) lists.
- `file` is the file's absolute `path`, and its `contents` as written, comments
  and all.
- Nothing the hook returns is checked, so it can change `code` too, or replace
  it. A hook can break its own rule's answers, and adhere does not stop it.
- It can be async. A hook that throws refuses the run, naming the rule.
- The plan counts the rule's requests, but not the tokens a hook adds, which are
  not known until it runs. A request over Jev's context skips the file, as a
  file too long does.
- `Bun` is typed when `@types/bun` is installed and `.adhere/tsconfig.json`
  lists it, as `"types": ["bun"]`. Otherwise it is `unknown`.

</details>

## Rule options

A `RULE.ts` can take settings from each project that uses it, such as which
paths run on the edge. It declares them as `options`, with an Effect Schema, and
a config sets them under the rule's id in [`overrides`](/adhere/config/#overrides):

```ts
// .adhere/rules/edge/no-node/RULE.ts
import { defineRule, Schema } from "@drkmttr/adhere";

export default defineRule({
  description: "A file under a path in `options.edgePaths` must never import a `node:` module.",
  never: 'import { readFileSync } from "node:fs";',
  options: Schema.Struct({ edgePaths: Schema.Array(Schema.String) }),
});
```

```ts
// .adhere/config.ts
export default defineConfig({
  overrides: { "edge/no-node": { options: { edgePaths: ["src/edge", "workers"] } } },
});
```

- Jev reads the decoded settings as `options`, so the description can name them
  in backticks. A rule's `appendState` gets them too, in its `state`.
- A key the schema does not make optional must be set. An unset or invalid
  option refuses the run, naming the rule. Options set for a rule that takes
  none also refuse it.
- A rule with options goes to Jev in requests of its own, as one with a hook
  does. Each of those requests sends the file and its context again.
- Changing a rule's options judges that rule again, and no other.
- The plan counts the tokens options add. A file whose options leave no room
  for a question is skipped before any request.
- `Schema` is Effect's, re-exported by adhere. A `RULE.ts` needs no `effect` of
  its own, and decodes with the same copy adhere does.
- A `RULE.md` cannot take options.
