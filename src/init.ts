import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { CONFIG_FILES } from "#config.ts";
import {
  SHARED_LINT_DIRECTORY,
  SHARED_LINT_INDEX,
  SHARED_LINT_RULES,
  SHARED_LINT_RULES_JSON,
  SHARED_LINT_TYPES,
  SHARED_LINT_TYPES_SOURCE,
  sharedPackageJson,
  sharedPackageName,
} from "#oxlint/shared.ts";
import { README_END, README_START, refreshReadme } from "#readme.ts";
import { Effect, Schema } from "effect";

export interface InitResult {
  readonly created: ReadonlyArray<string>;
  readonly skipped: ReadonlyArray<string>;
  /** The package manager that added adhere, or why none did. */
  readonly install: Install;
}

export type Install =
  | {
      readonly status: "installed";
      /** @drkmttr/adhere, added, or in a shared repo, package.json, installed. */
      readonly what: string;
      readonly packageManager: PackageManager;
    }
  | { readonly status: "listed" }
  | { readonly status: "no-package-json" };

export interface InitOptions {
  readonly force?: boolean;
  /**
   * `org/repo`: scaffold a repo whose rules other repos copy with `adhere
   * install`, rather than one that lints itself.
   */
  readonly shared?: string;
  /** Who can see the shared repo alchemy creates. Defaults to public. */
  readonly visibility?: Visibility;
}

export type Visibility = "public" | "private";

// adhere-ignore-file import-written-files -- src/index.ts exports initProject, so a Bun text import here breaks loading the package on Node and in Vitest (checked 2026-09-26), and the compiled executable has no files beside it to read.
const CONFIG = `import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  threshold: 0.8,
});
`;

/**
 * A project for the config and any rules written in TypeScript. A tsconfig's
 * globs skip dot directories, so without it the editor opens
 * `.adhere/config.ts` outside any project, where it cannot resolve
 * `@drkmttr/adhere`, whose types only `bundler`, `node16`, and `nodenext`
 * resolution reach.
 */
const TSCONFIG = `{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true
  },
  "include": ["**/*.ts"]
}
`;

const SMALL_FILES = `---
description: A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.
threshold: 0.8
---

Why: a file that does one thing is easier to find, read, and change. A helper
that serves only that thing belongs in the same file.

## Should

\`\`\`ts
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
\`\`\`

## Should not

\`\`\`ts
export const parsePort = (value: string) => Port.make(Number.parseInt(value, 10));
export const sendWelcomeEmail = (to: Email) => Mailer.send(to, welcomeTemplate);
export const renderInvoice = (invoice: Invoice) => Html.table(invoice.lines);
\`\`\`
`;

const INSTRUCTIONS = `# Working with adhere

- Run \`adhere lint\` before you commit, and fix what it reports.
- A rule belongs in \`.adhere/rules/\`: one sentence saying what code must be,
  with code that shows it.
- Run \`adhere validate\` after changing a rule. When a finding is wrong for
  this code alone, say why in a suppression comment instead of weakening the
  rule.
`;

const NAME_EFFECTS = `---
description: A function must be named after the domain action it performs, never after a generic verb like handle.
threshold: 0.8
---

Why: a name like \`handle\` or \`process\` says nothing about what the function
does, so every caller has to open it to find out.

## Must

\`\`\`ts
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
\`\`\`

## Never

\`\`\`ts
export const handle = (id: string) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(id);
  });
\`\`\`
`;

const sharedReadme = (org: string, repo: string) => `# ${repo}

Shared [adhere](https://github.com/darkmatter/adhere) rules and lint settings
for ${org}'s repositories. \`.adhere/rules/\` holds the rules Jev judges files
against, \`.adhere/instructions/\` holds instruction files for \`AGENTS.md\`, and
\`lint/\` is a plain ESM Oxlint config package for rules a linter can check
exactly.

## Rules and lint settings

The list below is generated from \`.adhere/rules/\` and \`lint/rules.json\` by
\`adhere rules readme\`. Run it after adding, renaming, or deleting a rule, or
after changing a lint setting; it replaces only the block between its markers.

${README_START}
${README_END}

## Use these rules

List the rules, then copy them into a repo: every one, one topic, or one rule.

\`\`\`sh
adhere list ${org}/${repo}
adhere install ${org}/${repo}                        # choose at a terminal
adhere install ${org}/${repo} --all                  # everything, without a prompt
adhere install ${org}/${repo}/style
adhere install ${org}/${repo}/style/prefer-small-files
\`\`\`

At a terminal, a bare install lists what it can copy: instruction files
first, then rules grouped by topic. \`--all\` copies every instruction file and
rule the source names without asking and needs no terminal. Without either, a
run without a terminal fails and names the matches. A topic is the same list
filtered to that topic, and an exact rule's path copies just that rule;
neither copies instructions.

Rules land in \`.adhere/rules/${org}/${repo}/\` and instructions in
\`.adhere/instructions/${org}/${repo}/\`, and are that repo's own from then on,
to edit or to start other rules from. To take a later version, install again
with \`--force\`, which overwrites local edits; deselecting a file never
deletes it.

## Use its lint settings

The lint package is not published. Pin this repo as a git dependency, at a
tag: tags are repo-wide, covering the rules, the instructions, and \`lint/\`
together.

\`\`\`sh
bun add -D "github:${org}/${repo}#v1.0.0"
\`\`\`

Then spread it into Vite+'s config, or plain Oxlint's:

\`\`\`ts
import sharedLint from "${sharedPackageName(org, repo)}/lint";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ...sharedLint,
    jsPlugins: [...sharedLint.jsPlugins, "./.adhere/oxlint/local.mjs"],
    rules: {
      ...sharedLint.rules,
      "local/my-rule": "error",
    },
  },
});
\`\`\`

\`\`\`ts
// oxlint.config.ts, with plain Oxlint: oxlint -c oxlint.config.ts
import sharedLint from "${sharedPackageName(org, repo)}/lint";

export default { ...sharedLint };
\`\`\`

\`lint/index.js\` reads \`lint/rules.json\` and resolves the shared package's
plugin paths, so spreading its export works from any directory. Paths you add
stay relative to your config. Your project's own JS plugins live in
\`.adhere/oxlint/\` as \`.mjs\` files.

## Add a lint setting or plugin

\`lint/rules.json\` starts \`{}\` and takes \`rules\`, \`jsPlugins\`, \`plugins\`, and
\`options\`. \`options\` is Oxlint's own options object; Vite+ uses the same
\`lint.options\` shape, and type-aware rules need \`oxlint-tsgolint\`, which Vite+
includes. Turn on a built-in rule by naming it:

\`\`\`json
{ "rules": { "typescript/no-explicit-any": "error" } }
\`\`\`

A rule from a built-in plugin that Oxlint leaves off by default (\`react\`,
\`import\`, \`jsdoc\`, \`jest\`, \`vitest\`, \`jsx-a11y\`, \`nextjs\`, \`react-perf\`,
\`promise\`, \`node\`, \`vue\`) also needs that plugin in \`plugins\`. The list
replaces Oxlint's default set (\`eslint\`, \`typescript\`, \`unicorn\`, \`oxc\`), so
name every plugin you still want:

\`\`\`json
{
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "react"],
  "rules": { "react/jsx-no-target-blank": "error" }
}
\`\`\`

A custom plugin is a plain ESM file in \`lint/plugins/\`; register it by a path
relative to \`lint/\`, and enable one of its rules by the plugin's name:

\`\`\`json
{
  "jsPlugins": ["./plugins/${repo}.js"],
  "rules": { "${repo}/no-foo": "error" }
}
\`\`\`

Keep the keys you are not changing. A project writes its own \`.mjs\` plugins to
\`.adhere/oxlint/\` and registers them in its \`vite.config.ts\` or
\`oxlint.config.ts\` instead; see the lint settings above.

## Add a rule

Add a directory under \`.adhere/rules/<topic>/\` with the rule in a \`RULE.md\`;
its path is the rule's id. See
[Rules as Markdown files](https://dm.sh/adhere/rule-format/#rules-as-markdown-files)
and the [rule writing tips](https://dm.sh/adhere/writing-good-rules/#rule-writing-tips).
\`adhere validate\` checks each rule's wording and asks Jev whether any two
contradict. CI runs it on every push to main and every pull request.

## Setup

\`alchemy.run.ts\` creates this repository on GitHub, or adopts it when it
exists, and sets the \`TYPESAFE_API_KEY\` secret CI's \`adhere validate\` needs.
Install, which init already did, deploy once, then push:

\`\`\`sh
npm install
TYPESAFE_API_KEY=... npx alchemy deploy
git init && git add -A && git commit -m "Add shared adhere rules"
git remote add origin git@github.com:${org}/${repo}.git && git push -u origin main
\`\`\`

Deploying again updates the secret, as after rotating the key.

## Tag a release

Tag the whole repo after committing rules, instructions, or lint changes. One
tag covers all of them, and consumers pin that tag; there are no per-rule
tags.

\`\`\`sh
git tag v1.0.0
git push origin v1.0.0
\`\`\`
`;

const SHARED_WORKFLOW = `name: adhere

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh
      - run: ~/.local/bin/adhere validate
        env:
          TYPESAFE_API_KEY: \${{ secrets.TYPESAFE_API_KEY }}
`;

const sharedStack = (
  org: string,
  repo: string,
  visibility: Visibility,
) => `import * as Alchemy from "alchemy";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

const owner = "${org}";

export default Alchemy.Stack(
  "${repo}",
  { providers: GitHub.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const repository = yield* GitHub.Repository("rules", {
      owner,
      name: "${repo}",
      description: "Shared adhere rules",
      visibility: "${visibility}",
    });
    // CI's adhere validate asks Jev whether any two rules contradict. Naming
    // the repository by its output makes alchemy create it before the secret.
    yield* GitHub.Secret("typesafe-api-key", {
      owner,
      repository: Output.map(repository.fullName, (fullName) => fullName.split("/")[1] ?? ""),
      name: "TYPESAFE_API_KEY",
      value: yield* Config.Redacted("TYPESAFE_API_KEY"),
    });
    return { url: repository.htmlUrl };
  }).pipe(Effect.orDie),
);
`;

const SHARED_GITIGNORE = `node_modules/
.alchemy/
`;

const CONFIG_PATH = CONFIG_FILES[0];

/** The project of the config at `.adhere/config.ts`, and of the rules written in TypeScript beside it. */
const CONFIG_PROJECT = ".adhere/tsconfig.json";

const RULE_EXAMPLES = [
  [".adhere/rules/style/prefer-small-files/RULE.md", SMALL_FILES],
  [".adhere/rules/style/name-domain-actions/RULE.md", NAME_EFFECTS],
] as const;

const SHARED_EXAMPLES = [
  [".adhere/instructions/00-workflow.md", INSTRUCTIONS],
  ...RULE_EXAMPLES,
] as const;

/**
 * A shared repo has no config: \`adhere install\` copies its rules and
 * instructions, and \`validate\` reads \`.adhere/rules/\` without one.
 */
const filesFor = (
  shared: string | undefined,
  visibility: Visibility,
): ReadonlyArray<readonly [string, string]> => {
  if (shared === undefined) {
    return [[CONFIG_PATH, CONFIG], [CONFIG_PROJECT, TSCONFIG], ...RULE_EXAMPLES];
  }
  const [org = "", repo = ""] = shared.split("/");
  return [
    ["README.md", sharedReadme(org, repo)],
    [".github/workflows/adhere.yaml", SHARED_WORKFLOW],
    ["alchemy.run.ts", sharedStack(org, repo, visibility)],
    ["package.json", sharedPackageJson(org, repo)],
    [`${SHARED_LINT_DIRECTORY}/index.js`, SHARED_LINT_INDEX],
    [SHARED_LINT_TYPES, SHARED_LINT_TYPES_SOURCE],
    [SHARED_LINT_RULES, SHARED_LINT_RULES_JSON],
    [".gitignore", SHARED_GITIGNORE],
    ...SHARED_EXAMPLES,
  ];
};

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

/** A config at another accepted path. Scaffolding a second one would refuse every run. */
const otherConfig = (root: string) =>
  Effect.promise(async () => {
    for (const file of CONFIG_FILES) {
      if (file !== CONFIG_PATH && (await exists(join(root, file)))) return file;
    }
    return undefined;
  });

const writeScaffoldFile = (root: string, path: string, contents: string, options: InitOptions) =>
  Effect.tryPromise({
    try: async () => {
      const target = join(root, path);
      const alreadyExists = await exists(target);
      if (alreadyExists && options.force !== true) return "skipped" as const;
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, contents, "utf8");
      return "created" as const;
    },
    catch: (cause) =>
      new Error(
        `Could not write ${path}: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  });

const PACKAGE = "@drkmttr/adhere";

const PackageManifest = Schema.fromJsonString(
  Schema.Struct({
    dependencies: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
    devDependencies: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
  }),
);

type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

/** The first lockfile at the root names the package manager; npm when there is none. */
const lockfiles: ReadonlyArray<readonly [string, PackageManager]> = [
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
];

const packageManagerAt = async (root: string): Promise<PackageManager> => {
  for (const [file, manager] of lockfiles) {
    if (await exists(join(root, file))) return manager;
  }
  return "npm";
};

/**
 * pnpm refuses to add to a workspace root without a flag. `-w` fails outside a
 * workspace, so this one, which works in both, stands in for it.
 */
const addFlags: Record<PackageManager, ReadonlyArray<string>> = {
  bun: [],
  pnpm: ["--ignore-workspace-root-check"],
  yarn: [],
  npm: [],
};

/**
 * Adds adhere to devDependencies, so the config's `import type` resolves. A
 * shared repo's package.json, which init writes, lists what it needs already,
 * so there it installs that instead.
 */
const installPackages = (root: string, shared: boolean) =>
  Effect.tryPromise({
    try: async (): Promise<Install> => {
      const manifest = await readFile(join(root, "package.json"), "utf8").catch(
        (cause: unknown) => {
          if (
            typeof cause === "object" &&
            cause !== null &&
            "code" in cause &&
            cause.code === "ENOENT"
          ) {
            return undefined;
          }
          throw cause;
        },
      );
      if (manifest === undefined) return { status: "no-package-json" };
      const { dependencies, devDependencies } = Schema.decodeUnknownSync(PackageManifest)(manifest);
      if (
        !shared &&
        (dependencies?.[PACKAGE] !== undefined || devDependencies?.[PACKAGE] !== undefined)
      ) {
        return { status: "listed" };
      }
      const packageManager = await packageManagerAt(root);
      const args = shared ? ["install"] : ["add", "-D", PACKAGE, ...addFlags[packageManager]];
      await new Promise<void>((resolve, reject) => {
        spawn(packageManager, args, {
          cwd: root,
          stdio: "inherit",
        })
          .on("error", reject)
          .on("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(`${packageManager} exited with ${code}`)),
          );
      });
      return { status: "installed", what: shared ? "package.json" : PACKAGE, packageManager };
    },
    catch: (cause) =>
      new Error(
        `Could not install ${shared ? "package.json" : PACKAGE}: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  });

export const initProject = (
  root: string,
  options: InitOptions = {},
): Effect.Effect<InitResult, Error> =>
  Effect.gen(function* () {
    const created: Array<string> = [];
    const skipped: Array<string> = [];
    const existing = options.shared === undefined ? yield* otherConfig(root) : undefined;
    for (const [path, contents] of filesFor(options.shared, options.visibility ?? "public")) {
      if (path === CONFIG_PATH && existing !== undefined) {
        skipped.push(existing);
        continue;
      }
      // A config at another path is in the project's own tsconfig, or not ours to place.
      if (path === CONFIG_PROJECT && existing !== undefined) continue;
      // A shared README holds the author's prose; refresh its managed block instead.
      if (
        options.shared !== undefined &&
        path === "README.md" &&
        (yield* Effect.promise(() => exists(join(root, path))))
      ) {
        skipped.push(relative(root, join(root, path)));
        continue;
      }
      const status = yield* writeScaffoldFile(root, path, contents, options);
      if (status === "created") {
        created.push(relative(root, join(root, path)));
      } else {
        skipped.push(relative(root, join(root, path)));
      }
    }
    if (options.shared !== undefined) {
      yield* refreshReadme(root).pipe(Effect.mapError((cause) => new Error(cause.message)));
    }
    const install = yield* installPackages(root, options.shared !== undefined);
    return { created, skipped, install };
  });
