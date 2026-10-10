import { isNote, withoutComments } from "#comments.ts";
import type { JudgedFile, ReadState } from "#config.ts";
import { WalkUnavailable } from "#models/Audit.ts";
import { suppressionsOf } from "#suppress.ts";
import { Context, Effect, Layer, Path, Schema, Scope, Semaphore } from "effect";
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import packageJson from "../../package.json";
import { NativeLsp } from "./NativeLsp.ts";
import type { Project, Symbol, Type } from "typescript/async";
import type { Node, SourceFile } from "typescript/ast";

export type SourceReferences = Record<string, Record<string, string>>;
export type SourceReadState = ReadState & {
  readonly symbols?: Record<string, string>;
  readonly references?: SourceReferences;
};
export interface SourceReadRequest {
  readonly symbols: boolean;
  readonly references: boolean;
  readonly includeComments: boolean;
}
export class SourceReads extends Context.Service<
  SourceReads,
  {
    readonly prepare: (files: readonly string[]) => Effect.Effect<void, WalkUnavailable>;
    readonly read: (
      file: JudgedFile,
      lines: readonly string[],
      requested: SourceReadRequest,
    ) => Effect.Effect<ReadState, WalkUnavailable>;
  }
>()("@drkmttr/adhere/services/SourceReads") {}

type Ast = typeof import("typescript/ast");
type Sdk = typeof import("typescript/async");
const CompilerPackage = Schema.fromJsonString(
  Schema.Struct({
    name: Schema.String,
    version: Schema.String,
    os: Schema.Array(Schema.String),
    cpu: Schema.Array(Schema.String),
  }),
);
const once = <K, V>(cache: Map<K, Promise<V>>, key: K, load: () => Promise<V>): Promise<V> => {
  const pending = cache.get(key) ?? load();
  cache.set(key, pending);
  return pending;
};
const sorted = <V>(entries: Iterable<readonly [string, V]>): Record<string, V> =>
  Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b)));
// Instantiated members can have different symbol IDs while sharing their source declarations.
const bindingKeyOf = (symbol: Symbol): string =>
  symbol.declarations.length
    ? symbol.declarations
        .map(({ path, index }) => JSON.stringify([path, index]))
        .sort()
        .join("\n")
    : `symbol:${symbol.id}`;

async function readOf(
  native: NativeLsp,
  project: Project,
  root: string,
  ast: Ast,
  sdk: Sdk,
  file: JudgedFile,
  requested: SourceReadRequest,
): Promise<SourceReadState> {
  const source = await native.sdk("getSourceFile", () =>
    project.program.getSourceFile(resolve(root, file.path)),
  );
  if (!source)
    throw new Error(`${file.path} is absent from its prepared native TypeScript project.`);
  if (source.text !== file.contents)
    throw new Error(
      `${file.path} changed between the source walk and native TypeScript snapshot. Rerun lint after saving files so the judged code and semantic context match.`,
    );
  const pathnameOf = (path: string) => relative(root, path).split(sep).join("/");
  const owned = (path: string) => {
    const pathname = pathnameOf(path);
    return (
      !isAbsolute(pathname) &&
      pathname !== ".." &&
      !pathname.startsWith("../") &&
      !pathname.split("/").includes("node_modules") &&
      !/\.d\.[cm]?ts$/i.test(pathname)
    );
  };
  const nodes: Node[] = [];
  const visit = (node: Node): void => {
    if (ast.isJSDoc(node)) return;
    if (
      (ast.isIdentifier(node) || ast.isPrivateIdentifier(node)) &&
      !(ast.isImportSpecifier(node.parent) && node.parent.propertyName === node)
    )
      nodes.push(node);
    node.forEachChild(visit);
  };
  visit(source);
  const symbols = nodes.length
    ? await native.sdk("getSymbolAtLocation", () => project.checker.getSymbolAtLocation(nodes))
    : [];
  const types =
    requested.symbols && nodes.length
      ? await native.sdk("getTypeAtLocation", () => project.checker.getTypeAtLocation(nodes))
      : [];
  const canonical = new Map<number, Promise<Symbol | undefined>>();
  const definitions = new Map<number, Promise<Node[]>>();
  const targetOf = (symbol: Symbol) =>
    once(canonical, symbol.id, async () => {
      const target =
        symbol.flags & sdk.SymbolFlags.Alias
          ? await native.sdk("getAliasedSymbol", () => project.checker.getAliasedSymbol(symbol))
          : symbol;
      return (await native.sdk("isUnknownSymbol", () => project.checker.isUnknownSymbol(target)))
        ? undefined
        : target;
    });
  const definitionsOf = (symbol: Symbol) =>
    once(definitions, symbol.id, async () => {
      const found: Node[] = [];
      for (const handle of symbol.declarations) {
        if (!owned(handle.path)) continue;
        const node = await native.sdk("resolveDeclaration", () => handle.resolve());
        if (!node)
          throw new Error(`Cannot resolve a native TypeScript declaration in ${handle.path}.`);
        found.push(node);
      }
      return found;
    });
  const usedOf = (node: Node) =>
    ast.isShorthandPropertyAssignment(node.parent) ||
    ast.isPropertyAccessExpression(node.parent) ||
    ast.isExportSpecifier(node.parent) ||
    (node.parent as Node & { readonly name?: Node }).name !== node;
  const usedBindings = new Set(
    nodes.flatMap((node, index) =>
      symbols[index] && usedOf(node) ? [`${symbols[index]!.id}:${node.getText(source)}`] : [],
    ),
  );
  const candidates = new Map<
    string,
    { name: string; node: Node; symbol: Symbol; type: Type | undefined }
  >();
  const excerpts = new Map<
    string,
    Map<string, { source: SourceFile; windows: Array<{ first: number; last: number }> }>
  >();
  for (const [index, node] of nodes.entries()) {
    const local = symbols[index];
    if (!local) continue;
    const name = node.getText(source);
    const shorthand = ast.isShorthandPropertyAssignment(node.parent);
    const used = usedOf(node);
    if (requested.symbols && (used || !usedBindings.has(`${local.id}:${name}`))) {
      const found = types[index];
      const type = found?.isErrorType() ? undefined : found;
      const key = `${local.id}:${type?.id ?? 0}:${name}`;
      if (!candidates.has(key)) candidates.set(key, { name, node, symbol: local, type });
    }
    if (!requested.references || !used) continue;
    const value = shorthand
      ? await native.sdk("getShorthandAssignmentValueSymbol", () =>
          project.checker.getShorthandAssignmentValueSymbol(node.parent),
        )
      : local;
    const target = value ? await targetOf(value) : undefined;
    if (!target) continue;
    for (const declaration of await definitionsOf(target)) {
      const linked = declaration.getSourceFile();
      if (linked.fileName === source.fileName || !owned(linked.fileName)) continue;
      let scope = declaration;
      while (
        ast.isBindingElement(scope) ||
        ast.isObjectBindingPattern(scope) ||
        ast.isArrayBindingPattern(scope)
      ) {
        scope = scope.parent;
      }
      // Variable and destructured bindings need the statement's export/const syntax and initializer.
      if (
        ast.isVariableDeclaration(scope) &&
        ast.isVariableDeclarationList(scope.parent) &&
        ast.isVariableStatement(scope.parent.parent)
      ) {
        scope = scope.parent.parent;
      }
      const first = linked.getLineAndCharacterOfPosition(
        scope.getStart(linked, requested.includeComments),
      ).line;
      const last = linked.getLineAndCharacterOfPosition(scope.getEnd() - 1).line + 1;
      const byFile = excerpts.get(name) ?? new Map();
      excerpts.set(name, byFile);
      const pathname = pathnameOf(linked.fileName);
      const entry = byFile.get(pathname) ?? { source: linked, windows: [] };
      byFile.set(pathname, entry);
      entry.windows.push({ first, last });
    }
  }
  const documentation = new Map<string, Promise<string>>();
  const documentationOf = (symbol: Symbol) =>
    once(documentation, bindingKeyOf(symbol), async () => {
      const comment = await native.sdk("getDocumentationCommentOfSymbol", () =>
        project.checker.getDocumentationCommentOfSymbol(symbol),
      );
      const tags = await native.sdk("getJsDocTagsOfSymbol", () =>
        project.checker.getJsDocTagsOfSymbol(symbol),
      );
      return [comment, ...tags.map(({ name, text }) => `**@${name}**${text ? ` ${text}` : ""}`)]
        .filter(Boolean)
        .join("\n\n");
    });
  const formattedTypes = new Map<string, Promise<string>>();
  const descriptions = new Map<
    string,
    Map<string, { types: Set<string>; documentation: string }>
  >();
  const entries = [...candidates.values()];
  for (let first = 0; first < entries.length; first += 8) {
    const jobs = entries.slice(first, first + 8).map(async ({ name, node, symbol, type }) => {
      const binding = bindingKeyOf(symbol);
      const text =
        type === undefined
          ? undefined
          : await once(formattedTypes, JSON.stringify([binding, type.id, name]), () =>
              native.sdk("typeToString", () =>
                project.checker.typeToString(type, node, sdk.TypeFormatFlags.NoTruncation),
              ),
            );
      const target = await targetOf(symbol);
      const docs = target ? await documentationOf(target) : "";
      return { name, binding, text, docs };
    });
    const rendered = await Promise.all(jobs).catch(async (cause) => {
      await native.close();
      // Do not release the transaction while other guarded jobs are still using its snapshot.
      await Promise.allSettled(jobs);
      throw cause;
    });
    for (const { name, binding, text, docs } of rendered) {
      if (!text && !docs) continue;
      const bindings = descriptions.get(name) ?? new Map();
      descriptions.set(name, bindings);
      const entry = bindings.get(binding) ?? { types: new Set<string>(), documentation: docs };
      bindings.set(binding, entry);
      if (text) entry.types.add(text);
    }
  }
  const cleaned = new Map<SourceFile, readonly string[]>();
  const references = sorted(
    [...excerpts].map(
      ([name, byFile]) =>
        [
          name,
          sorted(
            [...byFile].map(([pathname, { source: linked, windows }]) => {
              let lines = cleaned.get(linked);
              if (!lines) {
                const directed = suppressionsOf(linked.text.split("\n")).lines;
                lines = requested.includeComments ? directed : withoutComments(directed, isNote);
                cleaned.set(linked, lines);
              }
              const merged: Array<{ first: number; last: number }> = [];
              for (const window of windows.sort((a, b) => a.first - b.first || a.last - b.last)) {
                const previous = merged.at(-1);
                if (previous && window.first <= previous.last)
                  previous.last = Math.max(previous.last, window.last);
                else merged.push({ ...window });
              }
              return [
                pathname,
                merged.map(({ first, last }) => lines.slice(first, last).join("\n")).join("\n…\n"),
              ] as const;
            }),
          ),
        ] as const,
    ),
  );
  return {
    ...(requested.symbols
      ? {
          symbols: sorted(
            [...descriptions].map(
              ([name, bindings]) =>
                [
                  name,
                  [
                    ...new Set(
                      [...bindings.values()].map(({ types, documentation }) =>
                        [
                          ...[...types].map((text) => `\`\`\`typescript\n${text}\n\`\`\``),
                          documentation,
                        ]
                          .filter(Boolean)
                          .join("\n\n"),
                      ),
                    ),
                  ].join("\n\n---\n\n"),
                ] as const,
            ),
          ),
        }
      : {}),
    ...(requested.references ? { references } : {}),
  };
}

export const SourceReadsLive = (root?: string) =>
  Layer.effect(SourceReads)(
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const scope = yield* Effect.scope;
      const cwd = root === undefined ? path.resolve() : path.resolve(root);
      const preparedPaths = new Set<string>();
      const reading = yield* Semaphore.make(1);
      const attempt = <A>(work: () => Promise<A>, initializing = false) =>
        Effect.tryPromise({
          try: work,
          catch: (cause) =>
            WalkUnavailable.make({
              message: `Native TypeScript reads unavailable: ${cause instanceof Error ? cause.message : String(cause)}${initializing ? ` Reinstall @drkmttr/adhere with optional platform packages enabled, or install this checkout's development dependencies. Native TypeScript ${packageJson.devDependencies.typescript} is required.` : ""}`,
            }),
        });
      const load = yield* Effect.cached(
        Effect.acquireRelease(
          attempt(async () => {
            const bun = (globalThis as { Bun?: { isStandaloneExecutable?: boolean } }).Bun;
            let manifest = process.env.ADHERE_TYPESCRIPT_PACKAGE;
            const expected = `@typescript/typescript-${process.platform}-${process.arch}`;
            if (!manifest) {
              if (bun?.isStandaloneExecutable)
                throw new Error(
                  "This raw executable has no installed compiler. Run the npm/Bun-installed adhere launcher for symbols and references.",
                );
              const require = createRequire(import.meta.url);
              manifest = createRequire(require.resolve("typescript/package.json")).resolve(
                `${expected}/package.json`,
              );
            }
            if (!isAbsolute(manifest))
              throw new Error("The npm launcher must provide an absolute compiler package path.");
            const metadata = Schema.decodeUnknownSync(CompilerPackage)(
              await readFile(manifest, "utf8"),
            );
            if (
              metadata.name !== expected ||
              metadata.version !== packageJson.devDependencies.typescript ||
              !metadata.os.includes(process.platform) ||
              !metadata.cpu.includes(process.arch)
            )
              throw new Error(
                `Expected ${expected}@${packageJson.devDependencies.typescript} for this platform; found ${metadata.name}@${metadata.version}.`,
              );
            const executable = join(
              dirname(manifest),
              "lib",
              process.platform === "win32" ? "tsc.exe" : "tsc",
            );
            await access(executable);
            await access(join(dirname(executable), "lib.d.ts"));
            const ast = await import("typescript/ast");
            const sdk = await import("typescript/async");
            const native = await NativeLsp.open(
              executable,
              cwd,
              packageJson.devDependencies.typescript,
            );
            return { native, ast, sdk };
          }, true),
          ({ native }) => Effect.promise(() => native.close()),
        ).pipe(Effect.provideService(Scope.Scope, scope)),
      );
      return {
        prepare: (files) =>
          Effect.sync(() => {
            for (const file of files) preparedPaths.add(resolve(cwd, file));
          }),
        read: (file, _lines, requested) =>
          !requested.symbols && !requested.references
            ? Effect.succeed({})
            : Effect.suspend(() => {
                const pathname = resolve(cwd, file.path);
                if (preparedPaths.size === 0) preparedPaths.add(pathname);
                if (!preparedPaths.has(pathname))
                  return Effect.fail(
                    WalkUnavailable.make({
                      message: `${file.path} was not prepared; register eligible files before reading.`,
                    }),
                  );
                // Waiting readers can cancel; only the owner masks interruption during native work.
                return reading.withPermits(1)(
                  Effect.uninterruptible(
                    Effect.flatMap(load, ({ native, ast, sdk }) =>
                      attempt(async () => {
                        try {
                          await native.openDocument(pathname, file.contents);
                          const snapshot = await native.snapshot();
                          const project = await native.sdk("getDefaultProjectForFile", () =>
                            snapshot.getDefaultProjectForFile(pathname),
                          );
                          if (!project)
                            throw new Error(
                              `No native TypeScript project was loaded for ${file.path}.`,
                            );
                          const result = await readOf(
                            native,
                            project,
                            cwd,
                            ast,
                            sdk,
                            file,
                            requested,
                          );
                          await native.closeDocument(pathname);
                          await native.sdk("disposeSnapshot", () => snapshot.dispose());
                          return result;
                        } catch (cause) {
                          // Failure ends this session. API.close owns snapshots under the kill watchdog.
                          await native.close();
                          throw cause;
                        } finally {
                          native.api.clearSourceFileCache();
                        }
                      }),
                    ),
                  ),
                );
              }),
      };
    }),
  );
