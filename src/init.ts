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
  | { readonly status: "installed"; readonly packageManager: PackageManager }
  | { readonly status: "listed" }
  | { readonly status: "no-package-json" };

export interface InitOptions {
  readonly force?: boolean;
}

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

const CONFIG_PATH = CONFIG_FILES[0];

/** The config's own project, which only a config at `.adhere/config.ts` needs. */
const CONFIG_PROJECT = ".adhere/tsconfig.json";

const files = [
  [CONFIG_PATH, CONFIG],
  [CONFIG_PROJECT, TSCONFIG],
  [".adhere/style/prefer-small-files.md", SMALL_FILES],
  [".adhere/style/name-domain-actions.md", NAME_EFFECTS],
] as const;

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

/** Adds adhere to devDependencies, so the config's `import type` resolves. */
const installAdhere = (root: string) =>
  Effect.tryPromise({
    try: async (): Promise<Install> => {
      const manifest = await readFile(join(root, "package.json"), "utf8").catch(() => undefined);
      if (manifest === undefined) return { status: "no-package-json" };
      const { dependencies, devDependencies } = JSON.parse(manifest);
      if (dependencies?.[PACKAGE] !== undefined || devDependencies?.[PACKAGE] !== undefined) {
        return { status: "listed" };
      }
      const packageManager = await packageManagerAt(root);
      await new Promise<void>((resolve, reject) => {
        spawn(packageManager, ["add", "-D", PACKAGE, ...addFlags[packageManager]], {
          cwd: root,
          stdio: "inherit",
        })
          .on("error", reject)
          .on("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(`${packageManager} exited with ${code}`)),
          );
      });
      return { status: "installed", packageManager };
    },
    catch: (cause) =>
      new Error(
        `Could not add ${PACKAGE} to package.json: ${cause instanceof Error ? cause.message : String(cause)}`,
      ),
  });

export const initProject = (
  root: string,
  options: InitOptions = {},
): Effect.Effect<InitResult, Error> =>
  Effect.gen(function* () {
    const created: Array<string> = [];
    const skipped: Array<string> = [];
    const existing = yield* otherConfig(root);
    for (const [path, contents] of files) {
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
    const install = yield* installAdhere(root);
    return { created, skipped, install };
  });
