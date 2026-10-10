import { Effect, FileSystem, Path } from "effect";
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
 * Only packages named by this file's literal imports, type imports, re-exports,
 * or import/require calls. Tokens keep comments, strings, regexes, and templates
 * opaque; computed modules and imports inside template substitutions are not resolved.
 * Subpaths identify their canonical package, without walking the global catalog.
 */
export const workspacePackagesIn = (
  code: string,
  catalog: WorkspacePackages,
): WorkspacePackages => {
  const tokens = scan(code).flatMap((token) => {
    if (token.kind === "comment" || token.text.trim() === "") return [];
    // Highlighting groups punctuation; module clauses need individual delimiters.
    return token.kind === undefined && /^[^\w$]+$/.test(token.text)
      ? [...token.text].map((text): Token => ({ text }))
      : [token];
  });
  const names = new Set<string>();
  const keep = (specifier: string | undefined) => {
    if (specifier === undefined || specifier.startsWith(".") || specifier.startsWith("/")) return;
    const name = specifier.split("/", specifier.startsWith("@") ? 2 : 1).join("/");
    if (Object.hasOwn(catalog, name)) names.add(name);
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
