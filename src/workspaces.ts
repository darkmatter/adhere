import { Effect, FileSystem, Path } from "effect";
import { posix } from "node:path";
import { scan, type Token } from "#highlight.ts";

/** A workspace's packages: each one's name, with its directory from the root. */
export type WorkspacePackages = Readonly<Record<string, string>>;

const ESCAPES: Readonly<Record<string, string>> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
};

/** Decode a quoted module name without evaluating code; only calls accept plain templates. */
const specifierOf = (token: Token | undefined, templates = false): string | undefined => {
  if (token?.kind !== "string") return undefined;
  const quote = token.text[0];
  if (quote !== '"' && quote !== "'" && !(templates && quote === "`")) return undefined;
  if (token.text.at(-1) !== quote) return undefined;
  const body = token.text.slice(1, -1);
  if (quote === "`" && /(?:^|[^\\])(?:\\\\)*\$\{/.test(body)) return undefined;
  return body.replace(
    /\\(u\{[\da-fA-F]{1,6}\}|u[\da-fA-F]{4}|x[\da-fA-F]{2}|[\s\S])/g,
    (_, escaped: string) => {
      if (/^(?:u\{|u[\da-fA-F]{4}$|x[\da-fA-F]{2}$)/.test(escaped)) {
        const point = Number.parseInt(
          escaped.startsWith("u{") ? escaped.slice(2, -1) : escaped.slice(1),
          16,
        );
        return point <= 0x10ffff ? String.fromCodePoint(point) : `\\${escaped}`;
      }
      return ESCAPES[escaped] ?? escaped;
    },
  );
};

/**
 * Every module specifier named by this file's literal imports, type imports,
 * re-exports, or import/require calls, once each, in order. Tokens keep comments,
 * strings, regexes, and templates opaque; computed modules and imports inside
 * template substitutions are not resolved.
 */
export const importSpecifiersIn = (code: string): ReadonlyArray<string> => {
  const tokens = scan(code).flatMap((token) => {
    if (token.kind === "comment" || token.text.trim() === "") return [];
    // Highlighting groups punctuation; module clauses need individual delimiters.
    return token.kind === undefined && /^[^\w$]+$/.test(token.text)
      ? [...token.text].map((text): Token => ({ text }))
      : [token];
  });
  const specifiers = new Set<string>();
  const keep = (specifier: string | undefined) => {
    if (specifier !== undefined) specifiers.add(specifier);
  };
  for (const [index, token] of tokens.entries()) {
    if (tokens[index - 1]?.text === ".") continue;
    const next = tokens[index + 1];
    if ((token.text === "import" || token.text === "require") && next?.text === "(") {
      const end = tokens[index + 3]?.text;
      if (end === ")" || end === ",") {
        keep(specifierOf(tokens[index + 2], true));
      }
      continue;
    }
    if (token.kind !== "keyword" || (token.text !== "import" && token.text !== "export")) continue;
    if (token.text === "import" && next?.kind === "string") {
      keep(specifierOf(next));
      continue;
    }
    const head = next?.text === "type" ? tokens[index + 2]?.text : next?.text;
    if (token.text === "export" && head !== "{" && head !== "*") continue;
    let depth = 0;
    for (let at = index + 1; at < tokens.length; at += 1) {
      const part = tokens[at]!;
      if ([";", "=", "(", ")", "."].includes(part.text)) break;
      if (part.text === "{") depth += 1;
      else if (part.text === "}") depth -= 1;
      if (depth !== 0) continue;
      if (part.text === "from" && tokens[at + 1]?.kind === "string") {
        keep(specifierOf(tokens[at + 1]));
        break;
      }
      if (part.kind === "keyword" && !["type", "as", "from"].includes(part.text)) break;
    }
  }
  return [...specifiers];
};

/**
 * Only packages this file imports, by `importSpecifiersIn`. Subpaths identify
 * their canonical package, without walking the global catalog.
 */
export const workspacePackagesIn = (
  code: string,
  catalog: WorkspacePackages,
): WorkspacePackages => {
  const names = new Set<string>();
  for (const specifier of importSpecifiersIn(code)) {
    if (specifier.startsWith(".") || specifier.startsWith("/")) continue;
    const name = specifier.split("/", specifier.startsWith("@") ? 2 : 1).join("/");
    if (Object.hasOwn(catalog, name)) names.add(name);
  }
  return Object.fromEntries([...names].sort().map((name) => [name, catalog[name]!]));
};

/** What JSON text holds, or nothing when it is not JSON. */
const parsed = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** The strings of a value that is an array of them, and none of any other value. */
const strings = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * A root package.json's workspace patterns: `workspaces` as an array, which
 * npm, Bun, and Yarn read, or as Yarn's `{ packages: [...] }`.
 */
const manifestPatterns = (manifest: unknown): ReadonlyArray<string> => {
  const workspaces = (manifest as { readonly workspaces?: unknown } | undefined)?.workspaces;
  return Array.isArray(workspaces)
    ? strings(workspaces)
    : strings((workspaces as { readonly packages?: unknown } | undefined)?.packages);
};

/**
 * The patterns under `packages:` in a pnpm-workspace.yaml: the list items
 * that follow it, up to the next key. Read line by line, since that list is
 * all of the file adhere needs and the executable carries no YAML parser.
 */
const pnpmPatterns = (yaml: string): ReadonlyArray<string> => {
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex((line) => /^packages:\s*$/.test(line));
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^\S/.test(line) && !line.startsWith("-"));
  return (end < 0 ? rest : rest.slice(0, end)).flatMap((line) => {
    const [, item] = /^\s*-\s*(.+?)\s*$/.exec(line) ?? [];
    return item === undefined ? [] : [item.replace(/^["']|["']$/g, "")];
  });
};

/** Whether a directory's name matches a pattern segment, where `*` stands for any run of characters. */
const matches = (segment: string, name: string): boolean =>
  new RegExp(
    `^${segment
      .split("*")
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*")}$`,
  ).test(name);

/**
 * The packages of the workspace whose root is `root`, by name, sorted, so
 * the same workspace always reads the same: from the root package.json's
 * `workspaces` and from pnpm-workspace.yaml's `packages`. A pattern's `*` is
 * any directory and `**` any depth of them, outside `node_modules` and dot
 * directories, and one that starts with `!` leaves out what it matches. A
 * root that has neither file, or names no workspaces, has no packages.
 */
export const workspacePackagesOf = Effect.fn("workspacePackagesOf")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const read = (file: string) =>
    fs.readFileString(path.join(root, file)).pipe(Effect.orElseSucceed(() => ""));
  const children = (directory: string) =>
    fs.readDirectory(path.join(root, directory)).pipe(
      Effect.orElseSucceed((): ReadonlyArray<string> => []),
      Effect.map((names) =>
        names.filter((name) => name !== "node_modules" && !name.startsWith(".")),
      ),
      Effect.flatMap((names) =>
        Effect.filter(names, (name) =>
          fs.stat(path.join(root, directory, name)).pipe(
            Effect.map((info) => info.type === "Directory"),
            Effect.orElseSucceed(() => false),
          ),
        ),
      ),
      Effect.map((names) =>
        names.map((name) => (directory === "" ? name : `${directory}/${name}`)),
      ),
    );
  /** The directories under `directory` that the pattern's remaining segments lead to. */
  const expand = (
    directory: string,
    segments: ReadonlyArray<string>,
  ): Effect.Effect<ReadonlyArray<string>> => {
    const [segment, ...rest] = segments;
    if (segment === undefined) return Effect.succeed([directory]);
    if (segment === "**") {
      return Effect.gen(function* () {
        const below = yield* Effect.forEach(yield* children(directory), (child) =>
          expand(child, segments),
        );
        return [...(yield* expand(directory, rest)), ...below.flat()];
      });
    }
    if (!segment.includes("*")) {
      return expand(directory === "" ? segment : `${directory}/${segment}`, rest);
    }
    return Effect.flatMap(children(directory), (names) =>
      Effect.map(
        Effect.forEach(
          names.filter((name) => matches(segment, name.slice(name.lastIndexOf("/") + 1))),
          (child) => expand(child, rest),
        ),
        (found) => found.flat(),
      ),
    );
  };
  const segmentsOf = (pattern: string) =>
    pattern.split("/").filter((segment) => segment !== "" && segment !== ".");
  const patterns = [
    ...manifestPatterns(parsed(yield* read("package.json"))),
    ...pnpmPatterns(yield* read("pnpm-workspace.yaml")),
  ];
  const directoriesOf = (chosen: ReadonlyArray<string>) =>
    Effect.map(
      Effect.forEach(chosen, (pattern) => expand("", segmentsOf(pattern))),
      (found) => new Set(found.flat()),
    );
  const included = yield* directoriesOf(patterns.filter((pattern) => !pattern.startsWith("!")));
  const excluded = yield* directoriesOf(
    patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1)),
  );
  const named = yield* Effect.forEach(
    [...included].filter((directory) => !excluded.has(directory)),
    (directory) =>
      Effect.map(read(`${directory}/package.json`), (text) => {
        const name = (parsed(text) as { readonly name?: unknown } | undefined)?.name;
        return typeof name === "string" ? [[name, directory] as const] : [];
      }),
  );
  return Object.fromEntries(
    named.flat().sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  ) as WorkspacePackages;
});

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

/**
 * For each workspace package, the other workspace packages whose package.json
 * depends on it, by name with directory, sorted. A package no other one names
 * is left out.
 */
export const workspaceDependentsOf = Effect.fn("workspaceDependentsOf")(function* (
  root: string,
  catalog: WorkspacePackages,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dependents = new Map<string, Map<string, string>>();
  // Sequential over the sorted catalog, so each package's dependents are inserted sorted.
  yield* Effect.forEach(Object.entries(catalog), ([name, directory]) =>
    Effect.map(
      fs
        .readFileString(path.join(root, directory, "package.json"))
        .pipe(Effect.orElseSucceed(() => "")),
      (text) => {
        const manifest = parsed(text) as Readonly<Record<string, unknown>> | undefined;
        for (const field of DEPENDENCY_FIELDS) {
          const named = manifest?.[field];
          if (named === null || typeof named !== "object") continue;
          for (const dependency of Object.keys(named)) {
            if (dependency === name || !Object.hasOwn(catalog, dependency)) continue;
            const found = dependents.get(dependency) ?? new Map<string, string>();
            dependents.set(dependency, found.set(name, directory));
          }
        }
      },
    ),
  );
  return Object.fromEntries(
    [...dependents].map(([name, found]) => [name, Object.fromEntries(found)]),
  ) as Readonly<Record<string, WorkspacePackages>>;
});

/** TypeScript source extensions an import resolves to, in the order tried. */
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"] as const;
/** The source extensions an emitted extension in a specifier stands for. */
const EMITTED: Readonly<Record<string, ReadonlyArray<string>>> = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

/** The paths a relative specifier can name, most specific first. */
const candidatesOf = (target: string): ReadonlyArray<string> => {
  const extension = posix.extname(target);
  const emitted = EMITTED[extension] ?? [];
  const stem = target.slice(0, target.length - extension.length);
  return [
    target,
    ...emitted.map((source) => `${stem}${source}`),
    ...SOURCE_EXTENSIONS.map((source) => `${target}${source}`),
    ...SOURCE_EXTENSIONS.map((source) => `${target}/index${source}`),
  ];
};

/**
 * For each file, the files that import it by a relative specifier, sorted.
 * Keys and values are `/`-separated paths from one root, as `imports` gives
 * them; a specifier resolves only to a file `imports` has, by the first of its
 * candidates found: as written, with `.js` as `.ts`, with a source extension
 * added, then as a directory's index. Package and path-alias imports do not count.
 */
export const dependentFilesIn = (
  imports: ReadonlyMap<string, ReadonlyArray<string>>,
): ReadonlyMap<string, ReadonlyArray<string>> => {
  const dependents = new Map<string, Set<string>>();
  for (const [importer, specifiers] of imports) {
    for (const specifier of specifiers) {
      if (specifier !== "." && specifier !== ".." && !/^\.\.?\//.test(specifier)) continue;
      const target = posix.join(posix.dirname(importer), specifier);
      const found = candidatesOf(target).find((candidate) => imports.has(candidate));
      if (found === undefined || found === importer) continue;
      dependents.set(found, (dependents.get(found) ?? new Set()).add(importer));
    }
  }
  return new Map([...dependents].map(([file, found]) => [file, [...found].sort()]));
};

/** The workspace package a `/`-separated path from the root lies in: the one with the deepest directory holding it. */
export const packageOf = (file: string, catalog: WorkspacePackages): string | undefined =>
  Object.entries(catalog)
    .filter(([, directory]) => file.startsWith(`${directory}/`))
    .sort(([, a], [, b]) => b.length - a.length)[0]?.[0];
