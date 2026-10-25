---
title: "Config"
---

A config file is optional. Without one, adhere reads the rules in
`.adhere/rules/` and any `--preset`. A config names presets, sets the model,
the thresholds, and what Jev reads, or gives rules inline. Put it in the
working directory of the repo being audited, at one of these paths (keep one):

- `.adhere/config.ts`, the default, next to the rules
- `adhere.config.ts`
- `.adhere.config.ts`

[Config file](/adhere/reference/config-file/) lists every key.

```ts
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  threshold: 0.8,
  presets: ["effect"],
  exclude: ["**/generated/**"],
  overrides: { "effect/basics/instrument-with-pipe": "off" },
  rules: {
    "data/brand-meaningful-primitives": {
      description:
        "A primitive with semantic meaning, such as an id, email, URL, port, or count, must be a branded schema.",
      must: `
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
`,
      never: "type UserId = string",
      threshold: 0.8,
    },
  },
});
```

Every key, grouped by what it changes:

**What adhere loads**

- `presets` — default: none. Built-in rule sets, or their topics. See
  [Presets](/adhere/presets/).
- `rules` — default: `.adhere/rules/`. Rules inline, as above, or a directory
  (see [Where rules live](/adhere/rule-format/#where-rules-live)). Either form replaces
  `.adhere/rules/`: none of its rules, root or nested, is read then.
- `overrides` — default: none. Settings for a rule by its id. See
  [Overrides](#overrides).
- `exclude` — default: none. Globs, relative to the working directory, for
  files no rule judges.
- `instructions` — default: `.adhere/instructions/`, then
  `.agents/instructions/`. Instructions directory relative to the config file,
  used by `adhere postinstall`.

**Thresholds**

- `threshold` — default: `0.8`. Report a rule when Jev's probability is above
  this.
- `sufficiencyThreshold` — default: `0.6`. Below it, a finding warns that Jev
  may not see enough to decide.

**What Jev reads**

- `reads` — default: `["workspacePackages"]`. The workspace context Jev
  reads. See [What Jev reads](/adhere/state-hooks/#what-jev-reads).
- `typeAware` — default: `false`. Add the compiler's `symbols` and
  `references`, as `--type-aware` does.
- `includeComments` — default: `false`. Send every comment to Jev. See
  [Comments](/adhere/comments-and-suppressions/#comments).
- `maxSymbolDocumentationLength` — default: `256`. Maximum characters of each
  symbol's combined documentation and JSDoc tags, before `maxSymbolLength`
  applies. A non-negative integer; `0` omits them.
- `maxSymbolLength` — default: `256`. Maximum characters of each complete
  `symbols[name]` string, including type signatures and documentation. A
  non-negative integer; `0` leaves names with empty content.

**Model**

- `model` — default: `"jev-latest"`. The model id sent to TypeSafe AI.
- `provider` — default: TypeSafe AI's Jev. Where the questions go instead, with
  its own model. See [Providers](/adhere/providers/).

An invalid shape refuses the run. A config can import other files by relative
path, but no packages besides `@drkmttr/adhere`: the executable does not
resolve `node_modules`.

<details>
<summary>More on types in the editor</summary>

- `defineConfig` types the config for the editor and returns it as it is.
  `satisfies Config`, with `import type { Config }`, does the same.
- The executable supplies `@drkmttr/adhere` to the config whether or not the
  repo has the package installed. The editor's types come from the package,
  which `adhere init` adds as a dev dependency.
- A tsconfig's globs skip dot directories, so the editor opens
  `.adhere/config.ts` outside any project, where it cannot resolve the package's
  types: they are reached only by `bundler`, `node16`, or `nodenext` resolution.
  `adhere init` writes `.adhere/tsconfig.json`, a project for the config and any
  [rules written in TypeScript](/adhere/rule-format/#rules-as-typescript-files), with `bundler`
  resolution. For a config written by hand, add that file, or include
  `.adhere/config.ts` in a tsconfig that resolves the same way.

</details>

## Overrides

Use `overrides` to change a rule without copying its text into `rules`. Name
the rule by the id the report shows. A preset rule's id starts with the
preset's name, as in `alchemy/providers/idempotent-delete`:

```ts
export default defineConfig({
  presets: ["effect", "alchemy"],
  overrides: {
    "alchemy/providers/idempotent-delete": { level: "warning", threshold: 0.9 },
    "effect/basics/instrument-with-pipe": "off",
  },
});
```

| Value                           | Effect                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `"off"`                         | drops the rule                                                                                             |
| `"warning"`, `"error"`          | sets its level                                                                                             |
| `{ level, threshold, options }` | sets any of them; `options` only for a rule that takes them ([options](/adhere/state-hooks/#rule-options)) |

An id that no preset or project rule has refuses the run, so a typo does not go
unnoticed. A rule of a preset that the run does not name is accepted.

## Precedence

For the model and the threshold, highest first:

1. `--threshold` on the command line
2. the config file
3. presets, in order (a later preset wins)
4. the defaults, `jev-latest` and `0.8`

For one rule:

- A rule's own `threshold` beats all of the above for that rule.
- An entry in `overrides` beats the rule's own `threshold` and `level`.
- A rule in `rules` replaces a preset rule with the same id.

`--sufficiency-threshold` beats the config's `sufficiencyThreshold`, which beats
the default, `0.6`.
