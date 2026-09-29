import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { CONFIG_FILES } from "#config.ts";
import { Effect } from "effect";

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

// adhere-ignore-file rules/import-written-files -- src/index.ts exports initProject, so a Bun text import here breaks loading the package on Node and in Vitest (checked 2026-09-26), and the compiled executable has no files beside it to read.
const CONFIG = `import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  threshold: 0.8,
});
`;

/**
 * A project for the config alone. A tsconfig's globs skip dot directories, so
 * without it the editor opens `.adhere/config.ts` outside any project, where
 * it cannot resolve `@drkmttr/adhere`, whose types only `bundler`, `node16`,
 * and `nodenext` resolution reach.
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
  "include": ["config.ts"]
}
`;

const SMALL_FILES = `---
description: A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.
threshold: 0.8
---

A guideline, so its description and its headings say should and should not. A
rule that must hold says must and never instead, as name-domain-actions does.
Use this rule as a template for repository-specific conventions.

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

const NAME_EFFECTS = `---
description: A function must be named after the domain action it performs, never after a generic verb like handle.
threshold: 0.8
---

## Must

\`\`\`ts
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
\`\`\`

## Never

The code under Never shows what a violation looks like. It is optional, and a
rule can have it without the code under Must.

\`\`\`ts
export const handle = (id: string) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(id);
  });
\`\`\`
`;

const sharedReadme = (org: string, repo: string) => `# ${repo}

Shared [adhere](https://github.com/darkmatter/adhere) rules for ${org}'s
repositories. Each rule is a Markdown file in \`.adhere/\`, and a repo that
copies it in has Jev judge its files against it when it runs \`adhere lint\`.

## Use these rules

List the rules, then copy them into a repo, all of them or one topic or rule:

\`\`\`sh
adhere list ${org}/${repo}
adhere install ${org}/${repo}
adhere install ${org}/${repo}/style
adhere install ${org}/${repo}/style/prefer-small-files
\`\`\`

The copies land in \`.adhere/${org}/${repo}/\` and are that repo's own from then
on, to edit or to start other rules from. To take a later version of a rule,
install it again with \`--force\`, which overwrites local edits.

## Add a rule

Add a Markdown file under \`.adhere/<topic>/\`; its path is its id. See
[Rules as Markdown files](https://github.com/darkmatter/adhere#rules-as-markdown-files)
and the [rule writing tips](https://github.com/darkmatter/adhere#rule-writing-tips).
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
      - run: npx --yes @drkmttr/adhere validate
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

/**
 * alchemy's CLI runs on effect and its Node platform. They are pinned, as is
 * the platform's own dependency, since a range of prereleases takes the newest:
 * effect 4.0.0-rc.118 moved modules alchemy 2.0.0-beta.79 imports (checked
 * 2026-09-28).
 */
const sharedPackage = (repo: string) =>
  `${JSON.stringify(
    {
      name: repo,
      private: true,
      type: "module",
      devDependencies: {
        "@effect/platform-node": "4.0.0-rc.117",
        alchemy: "2.0.0-beta.79",
        effect: "4.0.0-rc.117",
      },
      overrides: { "@effect/platform-node-shared": "4.0.0-rc.117" },
    },
    null,
    2,
  )}\n`;

const SHARED_GITIGNORE = `node_modules/
.alchemy/
`;

const CONFIG_PATH = CONFIG_FILES[0];

/** The config's own project, which only a config at `.adhere/config.ts` needs. */
const CONFIG_PROJECT = ".adhere/tsconfig.json";

const EXAMPLES = [
  [".adhere/style/prefer-small-files.md", SMALL_FILES],
  [".adhere/style/name-domain-actions.md", NAME_EFFECTS],
] as const;

/**
 * A shared repo has no config: \`adhere install\` copies only rule files, and
 * \`validate\` reads \`.adhere/\` without one.
 */
const filesFor = (
  shared: string | undefined,
  visibility: Visibility,
): ReadonlyArray<readonly [string, string]> => {
  if (shared === undefined) {
    return [[CONFIG_PATH, CONFIG], [CONFIG_PROJECT, TSCONFIG], ...EXAMPLES];
  }
  const [org = "", repo = ""] = shared.split("/");
  return [
    ["README.md", sharedReadme(org, repo)],
    [".github/workflows/adhere.yaml", SHARED_WORKFLOW],
    ["alchemy.run.ts", sharedStack(org, repo, visibility)],
    ["package.json", sharedPackage(repo)],
    [".gitignore", SHARED_GITIGNORE],
    ...EXAMPLES,
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
 * workspace, so the first one, which works in both, stands in for it. pnpm 11
 * also fails on msgpackr-extract's unapproved build script. It comes with
 * effect, and adhere never calls msgpackr, so the second flag lets pnpm skip
 * the build with a warning.
 */
const addFlags: Record<PackageManager, ReadonlyArray<string>> = {
  bun: [],
  pnpm: ["--ignore-workspace-root-check", "--config.strict-dep-builds=false"],
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
      const manifest = await readFile(join(root, "package.json"), "utf8").catch(() => undefined);
      if (manifest === undefined) return { status: "no-package-json" };
      const { dependencies, devDependencies } = JSON.parse(manifest);
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
      const status = yield* writeScaffoldFile(root, path, contents, options);
      if (status === "created") {
        created.push(relative(root, join(root, path)));
      } else {
        skipped.push(relative(root, join(root, path)));
      }
    }
    const install = yield* installPackages(root, options.shared !== undefined);
    return { created, skipped, install };
  });
