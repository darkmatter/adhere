/**
 * Local native TypeScript spike; full source files printed verbatim, once each.
 * No Jev requests or files written.
 *
 * bun scripts/probe-typescript.ts
 * bun scripts/probe-typescript.ts tsconfig.json src/excerpt.ts 211 14
 * bun scripts/probe-typescript.ts tsconfig.json src/services/Jev.http.ts 346 24
 *
 * Positions are one-based UTF-16 columns, as in an editor. Outgoing targets
 * are declarations, not a search for concrete runtime implementations.
 */
import assert from "node:assert/strict";
import { dirname, relative, resolve, sep } from "node:path";
import { API, SymbolFlags, type Project } from "typescript/async";
import {
  getTokenAtPosition,
  isExportSpecifier,
  isIdentifier,
  isImportSpecifier,
  type Node,
  type SourceFile,
} from "typescript/ast";
import { createFileSystemWithLib } from "typescript/fs";
import { isNote, withoutComments } from "../src/comments.ts";
import { sectionsOf } from "../src/excerpt.ts";
import { suppressionsOf } from "../src/suppress.ts";

const nameOf = (node: Node, name: string) =>
  node.forEachChild((child) =>
    isIdentifier(child) && child.getText() === name ? child : undefined,
  );

async function inspect(project: Project, root: string, file: string, position: number) {
  const sources = new Map<string, Promise<SourceFile | undefined>>();
  const sourceOf = async (path: string) => {
    const pending = sources.get(path) ?? project.program.getSourceFile(path);
    sources.set(path, pending);
    const source = await pending;
    assert(source, `${path} is not in this TypeScript project`);
    return source;
  };
  const describe = (source: SourceFile, node: Node) => {
    const point = source.getLineAndCharacterOfPosition(node.getStart(source));
    const line = point.line + 1;
    const lines = withoutComments(suppressionsOf(source.text.split("\n")).lines, isNote);
    const sections = sectionsOf(lines);
    const section = sections.findIndex(({ first, last }) => first <= line && line <= last);
    assert(section >= 0, `No section contains ${source.fileName}:${line}`);
    return {
      pathname: relative(root, source.fileName).split(sep).join("/"),
      line,
      column: point.character + 1,
      section: String(section + 1),
    };
  };
  const source = await sourceOf(file);
  const token = getTokenAtPosition(source, position);
  assert(isIdentifier(token), "Choose a position inside an identifier");
  const query = describe(source, token);
  const local = await project.checker.getSymbolAtLocation(token);
  const target =
    local && local.flags & SymbolFlags.Alias
      ? await project.checker.getAliasedSymbol(local)
      : local;
  if (!target || (await project.checker.isUnknownSymbol(target))) {
    return { status: "unresolved", query, symbol: null, definitions: [], references: [] };
  }

  const declarations = await Promise.all(
    target.declarations.map(async (handle) => {
      const node = await handle.resolve();
      assert(node, `Cannot resolve declaration in ${handle.path}`);
      return { source: await sourceOf(handle.path), node, name: nameOf(node, target.name) };
    }),
  );
  const definitions = declarations.map(({ source: declaringSource, node, name }) =>
    describe(declaringSource, name ?? node),
  );
  const primary = declarations.find(({ name }) => name !== undefined);
  assert(primary?.name, "This identifier has no named declaration to query");
  // Query the canonical declaration: asking an import alias only finds its local alias group.
  const groups = await project.languageService.getReferencedSymbolsForNode(
    primary.name,
    primary.name.getStart(primary.source),
  );
  const references = new Map<string, ReturnType<typeof describe>>();
  const bindings = new Set<string>();
  for (const group of groups) {
    const declaredNames = new Set<string>();
    for (const handle of group.symbol?.declarations ?? [group.definition]) {
      const declaration = await handle.resolve();
      assert(declaration, `Cannot resolve binding in ${handle.path}`);
      const name = nameOf(declaration, group.symbol?.name ?? target.name);
      if (name) declaredNames.add(`${handle.path}:${name.getStart()}:${name.getEnd()}`);
    }
    for (const handle of group.references) {
      const node = await handle.resolve();
      assert(node, `Cannot resolve reference in ${handle.path}`);
      const key = `${handle.path}:${node.getStart()}:${node.getEnd()}`;
      if (
        declaredNames.has(key) ||
        isImportSpecifier(node.parent) ||
        isExportSpecifier(node.parent)
      ) {
        bindings.add(key);
      } else {
        references.set(key, describe(await sourceOf(handle.path), node));
      }
    }
  }
  return {
    status: "resolved",
    query,
    symbol: { name: target.name, localName: local?.name, referenceCount: references.size },
    definitions,
    bindingCount: bindings.size,
    references: [...references.values()].sort(
      (a, b) => a.pathname.localeCompare(b.pathname) || a.line - b.line || a.column - b.column,
    ),
  };
}

async function printReport(
  project: Project,
  root: string,
  result: Awaited<ReturnType<typeof inspect>>,
) {
  console.log(`Symbol: ${result.symbol?.name ?? "unresolved"}`);
  console.log(`Reference usages: ${result.symbol?.referenceCount ?? "unknown"}`);
  if ("bindingCount" in result) {
    console.log(`Declaration/import/export bindings excluded: ${result.bindingCount}`);
  }
  const groups = [
    ["Query", [result.query]],
    ["Definitions", result.definitions],
    ["References", result.references],
  ] as const;
  const paths = new Set(
    groups.flatMap(([, locations]) => locations.map(({ pathname }) => pathname)),
  );
  for (const pathname of paths) {
    const source = await project.program.getSourceFile(resolve(root, pathname));
    assert(source, `Cannot read ${pathname} from the project snapshot`);
    console.log(`\n=== ${pathname} ===`);
    for (const [label, locations] of groups) {
      const here = locations.filter((location) => location.pathname === pathname);
      if (here.length) {
        console.log(
          `${label}: ${here.map(({ line, column, section }) => `${line}:${column} (section ${section})`).join(", ")}`,
        );
      }
    }
    // No line prefixes, escaping, trimming, or indentation changes inside the source.
    process.stdout.write(`\n${source.text}\n`);
  }
}

const args = process.argv.slice(2);
assert(
  args.length === 0 || args.length === 4,
  "usage: bun scripts/probe-typescript.ts [tsconfig file line column]",
);
const cwd = process.cwd();
const fixture = args.length === 0;
const root = fixture
  ? resolve(cwd, ".adhere", "typescript-reads-probe")
  : dirname(resolve(args[0]!));
const config = fixture ? resolve(root, "tsconfig.json") : resolve(args[0]!);
const fixtureFiles: Record<string, string> = {
  "lib.ts": [
    "export interface Item { value: number }",
    "export function parse(value: number): number {",
    "\tconst result = value;",
    "  return result;",
    "}",
    "",
    "export const unused = 0;",
    "export function recur(value: number): number { return value ? recur(value - 1) : 0; }",
    "export function Widget() { return null; }",
  ].join("\n"),
  "barrel.ts": 'export { parse as renamed, type Item, Widget } from "./lib";',
  "calls.tsx": [
    'import { renamed as decode, type Item, Widget as View } from "#barrel";',
    'import * as api from "#barrel";',
    "export const item: Item = { value: 1 };",
    "export const result = decode(item.value);",
    "export const again = decode(item.value);",
    "export const handler = decode;",
    "export const queried = api.renamed(item.value);",
    "export const view = <View />;",
  ].join("\n"),
  "shadow.ts": [
    'import { parse as decode } from "./lib";',
    "export function run(decode: (value: number) => number) {",
    "  return decode(1);",
    "}",
  ].join("\n"),
  "unresolved.ts": [
    'import { missing } from "./not-here";',
    "export const value = missing();",
  ].join("\n"),
};
const virtual = createFileSystemWithLib(
  Object.entries({
    ...Object.fromEntries(
      Object.entries(fixtureFiles).map(([path, text]) => [resolve(root, path), text]),
    ),
    [config]: JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        types: [],
        jsx: "preserve",
        paths: { "#*": ["./*"] },
      },
      files: Object.keys(fixtureFiles),
    }),
  }),
);
const api = new API({ cwd });

try {
  const started = performance.now();
  const snapshot = await api.createSnapshot({
    openProjects: [config],
    ...(fixture ? { fileSystem: virtual } : {}),
  });
  const projectLoadMs = performance.now() - started;
  const project = snapshot.getConfiguredProject(config);
  assert(project, `Cannot open project ${config}`);
  if (!fixture) {
    const file = resolve(args[1]!);
    const line = Number(args[2]);
    const column = Number(args[3]);
    const source = await project.program.getSourceFile(file);
    assert(source, `${file} is not in ${config}`);
    const lineText = source.text.split("\n")[line - 1];
    assert(
      Number.isInteger(line) &&
        Number.isInteger(column) &&
        lineText !== undefined &&
        column >= 1 &&
        column <= lineText.replace(/\r$/, "").length,
      "Invalid line or column",
    );
    const queried = performance.now();
    const result = await inspect(
      project,
      root,
      file,
      source.getPositionOfLineAndCharacter(line - 1, column - 1),
    );
    console.log(
      `Project load: ${projectLoadMs.toFixed(1)} ms; query and locations: ${(performance.now() - queried).toFixed(1)} ms`,
    );
    await printReport(project, root, result);
  } else {
    for (const [path, text] of Object.entries(fixtureFiles)) {
      const source = await project.program.getSourceFile(resolve(root, path));
      assert.equal(source?.text, text, `${path}: source whitespace changed`);
    }
    console.log("PASS source text preserved, including tabs, spaces, and blank lines");
    assert.deepEqual(await project.program.getProgramDiagnostics(), []);
    assert.deepEqual(await project.program.getGlobalDiagnostics(), []);
    assert.deepEqual(await project.program.getSyntacticDiagnostics(), []);
    const diagnostics = await project.program.getSemanticDiagnostics();
    assert.deepEqual(
      diagnostics.map(({ code }) => code),
      [2307],
    ); // Deliberately missing module.
    const cases = [
      ["incoming", "lib.ts", "parse(value", "parse", "lib.ts", 4],
      ["alias through barrel and paths", "calls.tsx", "decode(item.value)", "parse", "lib.ts", 4],
      ["namespace member", "calls.tsx", "renamed(item.value)", "parse", "lib.ts", 4],
      ["shadowed parameter", "shadow.ts", "decode(1)", "decode", "shadow.ts", 1],
      ["type-only use", "calls.tsx", "Item =", "Item", "lib.ts", 1],
      ["JSX", "calls.tsx", "View />", "Widget", "lib.ts", 1],
      ["recursion", "lib.ts", "recur(value:", "recur", "lib.ts", 1],
      ["unused", "lib.ts", "unused =", "unused", "lib.ts", 0],
      ["unresolved import", "unresolved.ts", "missing()", null, null, null],
    ] as const;
    let sample: Awaited<ReturnType<typeof inspect>> | undefined;
    for (const [label, path, marker, name, definition, count] of cases) {
      const position = fixtureFiles[path]!.indexOf(marker);
      assert(position >= 0, `Missing fixture marker ${marker}`);
      const result = await inspect(project, root, resolve(root, path), position);
      assert.equal(result.status, name === null ? "unresolved" : "resolved", label);
      assert.equal(result.symbol?.name ?? null, name, label);
      assert.equal(result.symbol?.referenceCount ?? null, count, label);
      assert.deepEqual(
        result.definitions.map(({ pathname }) => pathname),
        definition ? [definition] : [],
        label,
      );
      console.log(`PASS ${label}: ${count ?? "unknown"} references`);
      if (label === "incoming") sample = result;
    }
    console.log(`Project load: ${projectLoadMs.toFixed(1)} ms`);
    assert(sample);
    await printReport(project, root, sample);
  }
} finally {
  await api.close();
}
