import { spawn } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { RULES_DIRECTORY, type RuleId } from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { Effect } from "effect";

/**
 * A GitHub repo whose `.adhere/rules/` another repo copies: `org/repo`, then
 * optionally a topic or a rule's id, then optionally `#` and a branch or tag,
 * as in `darkmatter/standards/data/brand-ports#v3`.
 */
export interface Source {
  readonly repo: string;
  /** A rule id or a topic, `data/brand-ports` or `data`; empty for every rule. */
  readonly rule: string;
  readonly ref?: string;
}

export const parseSource = (spec: string): Source | undefined => {
  const [path = "", ref] = spec.split("#");
  const [org, repo, ...rule] = path.split("/").filter((segment) => segment.length > 0);
  if (org === undefined || repo === undefined || ref === "") return undefined;
  return { repo: `${org}/${repo}`, rule: rule.join("/"), ...(ref === undefined ? {} : { ref }) };
};

const failed = (what: string) => (cause: unknown) =>
  new Error(`${what}: ${cause instanceof Error ? cause.message : String(cause)}`);

/**
 * A shallow clone in a temporary directory, deleted when the scope closes.
 * git, rather than GitHub's API, so a private repo is reached with whatever
 * credentials git already has, and `url.<base>.insteadOf` can point
 * github.com elsewhere, such as at SSH.
 */
const cloned = (source: Source) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const directory = await mkdtemp(join(tmpdir(), "adhere-install-"));
        const branch = source.ref === undefined ? [] : ["--branch", source.ref];
        const url = `https://github.com/${source.repo}.git`;
        await new Promise<void>((resolve, reject) => {
          let stderr = "";
          spawn("git", ["clone", "--quiet", "--depth", "1", ...branch, url, directory], {
            stdio: ["inherit", "ignore", "pipe"],
          })
            .on("error", reject)
            .on("exit", (code) =>
              code === 0
                ? resolve()
                : reject(new Error(stderr.trim() || `git exited with ${code}`)),
            )
            .stderr?.on("data", (chunk) => {
              stderr += chunk;
            });
        });
        return directory;
      },
      catch: failed(`Could not clone ${source.repo}`),
    }),
    (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
  );

/**
 * The repo's rules in its root `.adhere/rules/`, as lint reads them there:
 * each directory that holds a RULE.md or a RULE.ts, by its path, with that file.
 */
const rulesIn = (source: Source, clone: string) =>
  Effect.tryPromise({
    try: async () => {
      const directory = join(clone, RULES_DIRECTORY);
      const entries = await readdir(directory, { recursive: true }).catch(() => []);
      const rules = entries
        .flatMap((entry) => {
          const [, id, name] = /^(.+)\/(RULE\.(?:md|ts))$/.exec(entry.split(sep).join("/")) ?? [];
          return id === undefined || name === undefined ? [] : [{ id: id as RuleId, name }];
        })
        .filter(
          ({ id }) => source.rule === "" || id === source.rule || id.startsWith(`${source.rule}/`),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      if (rules.length === 0) {
        throw new Error(
          source.rule === ""
            ? `it has no rules in ${RULES_DIRECTORY}/`
            : `it has no rule or topic ${source.rule} in ${RULES_DIRECTORY}/`,
        );
      }
      return rules.map(({ id, name }) => ({ id, name, directory: join(directory, id) }));
    },
    catch: failed(`Nothing to copy from ${source.repo}`),
  });

/**
 * Each rule a source names, with its description. A rule written in
 * TypeScript is listed without one: reading it would run the repo's code.
 */
export const listRules = (source: Source) =>
  Effect.scoped(
    Effect.gen(function* () {
      const rules = yield* rulesIn(source, yield* cloned(source));
      return yield* Effect.forEach(rules, ({ id, name, directory }) =>
        Effect.gen(function* () {
          if (name === "RULE.ts") return { id, description: "(TypeScript, which list does not run)" };
          const text = yield* Effect.tryPromise({
            try: () => readFile(join(directory, name), "utf8"),
            catch: failed(`Could not read ${id}`),
          });
          const rule = yield* parseRuleMarkdown(text, `${source.repo}/${id}/${name}`);
          return { id, description: rule.description };
        }),
      );
    }),
  );

export interface InstallResult {
  readonly created: ReadonlyArray<string>;
  readonly skipped: ReadonlyArray<string>;
}

/**
 * Copies the rules a source names, each its whole directory, helpers and all,
 * into `root`'s `.adhere/rules/` under the source's org and repo, so
 * `data/ports` from acme/rules is the rule `acme/rules/data/ports`, and two
 * sources' rules never collide. They are the project's own rules from then
 * on, and a copied RULE.ts runs whenever lint does. As with init, a rule
 * already there is skipped, unless `force` replaces its directory.
 */
export const installRules = (root: string, source: Source, options: { readonly force?: boolean }) =>
  Effect.scoped(
    Effect.gen(function* () {
      const rules = yield* rulesIn(source, yield* cloned(source));
      const created: Array<string> = [];
      const skipped: Array<string> = [];
      for (const { id, directory } of rules) {
        const path = `${RULES_DIRECTORY}/${source.repo}/${id}/`;
        const target = join(root, path);
        const copied = yield* Effect.tryPromise({
          try: async () => {
            const exists = await access(target).then(
              () => true,
              () => false,
            );
            if (exists && options.force !== true) return false;
            await rm(target, { recursive: true, force: true });
            await mkdir(dirname(target), { recursive: true });
            await cp(directory, target, { recursive: true });
            return true;
          },
          catch: failed(`Could not write ${path}`),
        });
        (copied ? created : skipped).push(path);
      }
      return { created, skipped } satisfies InstallResult;
    }),
  );
