import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
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
  threshold: 0.7,
} satisfies Config;
`;

const SMALL_FILES = `---
description: Prefer small focused files with one primary responsibility.
threshold: 0.8
---

Use this rule as a template for repository-specific conventions.

\`\`\`ts
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
\`\`\`
`;

const NAME_EFFECTS = `---
description: Name functions after the domain action they perform.
threshold: 0.8
---

\`\`\`ts
export const loadCustomerProfile = (customerId: CustomerId) =>
  Effect.gen(function* () {
    return yield* CustomerStore.find(customerId);
  });
\`\`\`
`;

const files = [
  ["adhere.config.ts", CONFIG],
  [".adhere/style/prefer-small-files.md", SMALL_FILES],
  [".adhere/style/name-domain-actions.md", NAME_EFFECTS],
] as const;

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

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
    for (const [path, contents] of files) {
      const status = yield* writeScaffoldFile(root, path, contents, options);
      if (status === "created") {
        created.push(relative(root, join(root, path)));
      } else {
        skipped.push(relative(root, join(root, path)));
      }
    }
    return { created, skipped };
  });
