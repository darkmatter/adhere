import { spawn } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { INSTRUCTIONS_DIRECTORY, RULES_DIRECTORY, type RuleId } from "#config.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { Effect } from "effect";

/**
 * A GitHub repo whose `.adhere/rules/` and `.adhere/instructions/` another
 * repo copies: `org/repo`, then optionally a topic or a rule's id, then
 * optionally `#` and a branch or tag, as in
 * `darkmatter/standards/data/brand-ports#v3`. A `.` or `..` segment is not a
 * repo, topic, or rule: copied under `.adhere/`, it would land outside.
 */
export interface Source {
  readonly repo: string;
  /** A rule id or a topic, `data/brand-ports` or `data`; empty for every rule. */
  readonly rule: string;
  readonly ref?: string;
}

export const parseSource = (spec: string): Source | undefined => {
  const [path = "", ref] = spec.split("#");
  const segments = path.split("/").filter((segment) => segment.length > 0);
  const [org, repo, ...rule] = segments;
  if (
    org === undefined ||
    repo === undefined ||
    ref === "" ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return undefined;
  }
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
export const cloned = (source: Source) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () => mkdtemp(join(tmpdir(), "adhere-install-")),
      catch: failed(`Could not create a temporary directory for ${source.repo}`),
    }),
    (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
  ).pipe(
    Effect.tap((directory) =>
      Effect.tryPromise({
        try: async () => {
          const branch = source.ref === undefined ? [] : ["--branch", source.ref];
          const url = `https://github.com/${source.repo}.git`;
          const { promise, resolve, reject } = Promise.withResolvers<void>();
          let stderr = "";
          spawn("git", ["clone", "--quiet", "--depth", "1", ...branch, url, directory], {
            stdio: ["inherit", "ignore", "pipe"],
          })
            .on("error", reject)
            .on("exit", (code) => {
              if (code === 0) resolve();
              else reject(new Error(stderr.trim() || `git exited with ${code}`));
            })
            .stderr?.on("data", (chunk) => {
              stderr += chunk;
            });
          await promise;
        },
        catch: failed(`Could not clone ${source.repo}`),
      }),
    ),
  );

/**
 * Every Markdown file under the clone's `.adhere/instructions/`, by its path
 * from there, so a shared repo's `security/hardening.md` is
 * `security/hardening.md`. A directory whose name ends in `.md` is not a file.
 */
const instructionsIn = (clone: string) =>
  Effect.tryPromise({
    try: async () => {
      const directory = join(clone, INSTRUCTIONS_DIRECTORY);
      const entries = await readdir(directory, { recursive: true }).catch((cause: unknown) => {
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          cause.code === "ENOENT"
        ) {
          return [];
        }
        throw cause;
      });
      const files: Array<string> = [];
      for (const entry of entries
        .map((one) => one.split(sep).join("/"))
        .filter((one) => one.endsWith(".md"))
        .sort()) {
        if ((await stat(join(directory, entry))).isFile()) files.push(entry);
      }
      return files;
    },
    catch: failed(`Could not read ${INSTRUCTIONS_DIRECTORY}/`),
  });

/**
 * The clone's rules in its root `.adhere/rules/`, as lint reads them there:
 * each directory that holds a RULE.md or a RULE.ts, by its path, with that
 * file. A directory with both refuses, as it does for lint.
 */
const rulesIn = (clone: string) =>
  Effect.tryPromise({
    try: async () => {
      const entries = await readdir(join(clone, RULES_DIRECTORY), { recursive: true }).catch(
        (cause: unknown) => {
          if (
            typeof cause === "object" &&
            cause !== null &&
            "code" in cause &&
            cause.code === "ENOENT"
          ) {
            return [];
          }
          throw cause;
        },
      );
      const byId = new Map<RuleId, "RULE.md" | "RULE.ts">();
      for (const entry of entries.map((one) => one.split(sep).join("/")).sort()) {
        const [, id, extension] = /^(.+)\/RULE\.(md|ts)$/.exec(entry) ?? [];
        if (id === undefined || extension === undefined) continue;
        const name = extension === "md" ? "RULE.md" : "RULE.ts";
        const previous = byId.get(id);
        if (previous !== undefined && previous !== name) {
          throw new Error(
            `${RULES_DIRECTORY}/${id} has both RULE.md and RULE.ts, and a rule is one`,
          );
        }
        byId.set(id, name);
      }
      return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id));
    },
    catch: failed(`Could not read ${RULES_DIRECTORY}/`),
  });

/** A rule a source offers: its id, and the file that defines it. */
interface CatalogRule {
  readonly id: RuleId;
  readonly name: "RULE.md" | "RULE.ts";
}

/** What a source offers: its instruction files and its rules. */
interface Catalog {
  /** Markdown files under `.adhere/instructions/`, by their path from there, sorted. */
  readonly instructions: ReadonlyArray<string>;
  readonly rules: ReadonlyArray<CatalogRule>;
}

/**
 * Everything a clone of `source` offers, without reading a rule: a malformed
 * RULE.md elsewhere must not stop a rule from being copied. `describeRules`
 * reads the descriptions `list` and the picker show.
 */
export const catalogOf = (source: Source, clone: string) =>
  Effect.gen(function* () {
    const instructions = yield* instructionsIn(clone);
    const rules = yield* rulesIn(clone);
    if (instructions.length === 0 && rules.length === 0) {
      return yield* Effect.fail(
        new Error(
          `Nothing to copy from ${source.repo}: it has no instruction files in ${INSTRUCTIONS_DIRECTORY}/ and no rules in ${RULES_DIRECTORY}/`,
        ),
      );
    }
    return { instructions, rules };
  });

/**
 * The description each rule shows: its Markdown's `description`, or a note
 * for a RULE.ts, which reading would run.
 */
export const describeRules = (source: Source, clone: string, rules: ReadonlyArray<CatalogRule>) =>
  Effect.forEach(rules, ({ id, name }) =>
    Effect.gen(function* () {
      if (name === "RULE.ts") {
        return { id, name, description: "(TypeScript, which list does not run)" };
      }
      const text = yield* Effect.tryPromise({
        try: () => readFile(join(clone, RULES_DIRECTORY, id, name), "utf8"),
        catch: failed(`Could not read ${id}`),
      });
      const rule = yield* parseRuleMarkdown(text, `${source.repo}/${id}/${name}`);
      return { id, name, description: rule.description };
    }),
  );

/** The rules a source's topic or id names, in catalog order. */
const rulesNamed = (source: Source, catalog: Catalog): ReadonlyArray<CatalogRule> =>
  source.rule === ""
    ? catalog.rules
    : catalog.rules.filter(({ id }) => id === source.rule || id.startsWith(`${source.rule}/`));

const nothingNamed = (source: Source): Error =>
  new Error(
    source.rule === ""
      ? `Nothing to copy from ${source.repo}: it has no rules in ${RULES_DIRECTORY}/`
      : `Nothing to copy from ${source.repo}: it has no rule or topic ${source.rule} in ${RULES_DIRECTORY}/`,
  );

/**
 * What a source names: one rule to copy as it is, or the files to choose
 * from. Only an exact rule id, with no rule deeper under it, is copied
 * without asking. A bare repo chooses from its instruction files and every
 * rule; a topic chooses from the rules under it, never from instructions,
 * even when a topic is named `instructions`.
 */
export type CatalogMatch =
  | { readonly kind: "direct"; readonly rule: CatalogRule }
  | {
      readonly kind: "choose";
      readonly instructions: ReadonlyArray<string>;
      readonly rules: ReadonlyArray<CatalogRule>;
    };

export const matchOf = (source: Source, catalog: Catalog) =>
  Effect.gen(function* () {
    const rules = rulesNamed(source, catalog);
    const exact = source.rule === "" ? undefined : rules.find(({ id }) => id === source.rule);
    const topic = source.rule !== "" && rules.some(({ id }) => id.startsWith(`${source.rule}/`));
    if (exact !== undefined && !topic) return { kind: "direct", rule: exact } as const;
    if (rules.length === 0 && source.rule !== "") return yield* Effect.fail(nothingNamed(source));
    return {
      kind: "choose",
      instructions: source.rule === "" ? catalog.instructions : [],
      rules,
    } as const;
  });

interface InstallResult {
  readonly created: ReadonlyArray<string>;
  readonly skipped: ReadonlyArray<string>;
}

/** The catalog entries a run copies: instruction paths, and rule ids. */
export interface InstallPicks {
  readonly instructions: ReadonlyArray<string>;
  readonly rules: ReadonlyArray<RuleId>;
}

/** Where one instruction file lands in the repo that copies it. */
export const instructionPath = (source: Source, instruction: string): string =>
  `${INSTRUCTIONS_DIRECTORY}/${source.repo}/${instruction}`;

/** Where one rule's directory lands in the repo that copies it, with its trailing slash. */
export const rulePath = (source: Source, rule: RuleId): string =>
  `${RULES_DIRECTORY}/${source.repo}/${rule}/`;

const copyInto = (
  from: string,
  target: string,
  path: string,
  options: { readonly force: boolean; readonly recursive: boolean },
) =>
  Effect.tryPromise({
    try: async () => {
      const exists = await access(target).then(
        () => true,
        () => false,
      );
      if (exists && !options.force) return false;
      if (exists) await rm(target, { recursive: true, force: true });
      await mkdir(dirname(target), { recursive: true });
      await cp(from, target, { recursive: options.recursive });
      return true;
    },
    catch: failed(`Could not write ${path}`),
  });

/**
 * Copies the picks from the clone into `root`: each instruction file to
 * `.adhere/instructions/<org>/<repo>/<path>`, and each rule's whole
 * directory, helpers and all, to `.adhere/rules/<org>/<repo>/<id>/`. Two
 * sources' files never collide, and they are the project's own from then on,
 * so a copied RULE.ts runs whenever lint does. Something already there is
 * skipped, unless `force` replaces it. Nothing picked is ever deleted.
 */
export const installSelected = (
  root: string,
  source: Source,
  clone: string,
  picks: InstallPicks,
  options: { readonly force?: boolean },
) =>
  Effect.gen(function* () {
    const created: Array<string> = [];
    const skipped: Array<string> = [];
    const force = options.force === true;
    for (const instruction of picks.instructions) {
      const path = instructionPath(source, instruction);
      const wrote = yield* copyInto(
        join(clone, INSTRUCTIONS_DIRECTORY, instruction),
        join(root, path),
        path,
        { force, recursive: false },
      );
      (wrote ? created : skipped).push(path);
    }
    for (const rule of picks.rules) {
      const path = rulePath(source, rule);
      const wrote = yield* copyInto(join(clone, RULES_DIRECTORY, rule), join(root, path), path, {
        force,
        recursive: true,
      });
      (wrote ? created : skipped).push(path);
    }
    return { created, skipped } satisfies InstallResult;
  });

/**
 * Each rule a source names, with its description. A rule written in
 * TypeScript is listed without one: reading it would run the repo's code.
 */
export const listRules = (source: Source) =>
  Effect.scoped(
    Effect.gen(function* () {
      const clone = yield* cloned(source);
      const catalog = yield* catalogOf(source, clone);
      const rules = rulesNamed(source, catalog);
      if (rules.length === 0) return yield* Effect.fail(nothingNamed(source));
      return (yield* describeRules(source, clone, rules)).map(({ id, description }) => ({
        id,
        description,
      }));
    }),
  );
