import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { CONFIG_FILES } from "#config.ts";
import { Effect } from "effect";

export interface InitResult {
  readonly created: ReadonlyArray<string>;
  readonly skipped: ReadonlyArray<string>;
}

export interface InitOptions {
  readonly force?: boolean;
}

const CONFIG = `import type { Config } from "@drkmttr/adhere";

export default {
  threshold: 0.8,
} satisfies Config;
`;

const SMALL_FILES = `---
description: A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.
threshold: 0.8
---

A guideline, so its description and its code say should and should not. A
rule that must hold says must and never instead, as name-domain-actions does.
Use this rule as a template for repository-specific conventions.

\`\`\`ts should
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
\`\`\`

\`\`\`ts should not
export const parsePort = (value: string) => Port.make(Number.parseInt(value, 10));
export const sendWelcomeEmail = (to: Email) => Mailer.send(to, welcomeTemplate);
export const renderInvoice = (invoice: Invoice) => Html.table(invoice.lines);
\`\`\`
`;

const NAME_EFFECTS = `---
description: A function must be named after the domain action it performs, never after a generic verb like handle.
threshold: 0.8
---

\`\`\`ts must
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
\`\`\`

A fence tagged \`never\` shows what a violation looks like. It is optional, and
a rule can have one without the block above.

\`\`\`ts never
export const handle = (id: string) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(id);
  });
\`\`\`
`;

const CONFIG_PATH = CONFIG_FILES[0];

const files = [
  [CONFIG_PATH, CONFIG],
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
      const status = yield* writeScaffoldFile(root, path, contents, options);
      if (status === "created") {
        created.push(relative(root, join(root, path)));
      } else {
        skipped.push(relative(root, join(root, path)));
      }
    }
    return { created, skipped };
  });
