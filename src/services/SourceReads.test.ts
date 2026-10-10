import { isNote, withoutComments } from "#comments.ts";
import { suppressionsOf } from "#suppress.ts";
import { Effect, Fiber, Layer, Path } from "effect";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { API, Checker, LanguageService, Program, Snapshot } from "typescript/async";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import packageJson from "../../package.json";
import { NativeLsp } from "./NativeLsp.ts";
import {
  SourceReads,
  SourceReadsLive,
  type SourceReadRequest,
  type SourceReadState,
} from "./SourceReads.ts";

const library = [
  "export const start = 0;",
  "// ordinary comment",
  "// @adhere: keep this note",
  "// adhere-ignore sample -- never send this directive",
  "/** The original documented value. */",
  "export const original = 42;",
  "  export const neighbor = 2;",
  "\texport const another = 3;",
  "export const lastNeighbor = 4;",
  "export const outsideWindow = 5;",
  "export const unused = 6;",
  ...Array<string>(4).fill(""),
  "export interface Shape { first: number }",
  "export const between = 7;",
  "export interface Shape { second: string }",
  ...Array<string>(12).fill(""),
  "export function pair(value: number): number;",
  ...Array<string>(10).fill(""),
  "export function pair(value: string): string;",
  ...Array<string>(10).fill(""),
  "export function pair(value: number | string) { return value; }",
  "",
].join("\n");
const consumer = [
  'import { original as local, Shape, pair, unused } from "./lib";',
  'import { external } from "./types";',
  'import { secret as dependency } from "private";',
  "export const result = local;",
  "export const object = { local };",
  "export function shadow(local: string) { return local.trim(); }",
  "export function narrow(value: string | undefined) {",
  '  if (typeof value === "string") return value.trim();',
  "  return value;",
  "}",
  'export const shape: Shape = { first: 1, second: "ok" };',
  "export const first = pair(1);",
  'export const second = pair("text");',
  "export const externalValue = external;",
  "export const privateValue = dependency;",
  "",
].join("\n");
const sources = {
  "lib.ts": library,
  "use.ts": consumer,
  "types.d.ts": "export declare const external: number;",
  "node_modules/private/package.json": JSON.stringify({ name: "private", types: "index.d.ts" }),
  "node_modules/private/index.d.ts": "export declare const secret: number;",
};
const both: SourceReadRequest = { symbols: true, references: true, includeComments: false };
const roots: string[] = [];
const within = async <A>(promise: Promise<A>, milliseconds: number): Promise<A> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Native lifecycle did not settle in time")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};
const normalized = (text: string, includeComments = false) => {
  const directed = suppressionsOf(text.split("\n")).lines;
  return includeComments ? directed : withoutComments(directed, isNote);
};
const run = <A, E>(root: string, work: Effect.Effect<A, E, SourceReads>) =>
  Effect.runPromise(
    work.pipe(Effect.provide(SourceReadsLive(root).pipe(Layer.provide(Path.layer)))),
  );
async function fixture(
  files: Readonly<Record<string, string>> = sources,
  config: object | false = {
    compilerOptions: { strict: true, types: [], module: "Preserve", moduleResolution: "Bundler" },
    files: ["lib.ts", "use.ts", "types.d.ts"],
  },
) {
  const root = await mkdtemp(join(tmpdir(), "adhere-source-reads-"));
  roots.push(root);
  await Promise.all(
    Object.entries(files).map(async ([name, text]) => {
      const path = join(root, name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, text);
    }),
  );
  if (config !== false) await writeFile(join(root, "tsconfig.json"), JSON.stringify(config));
  const prepare = (names: readonly string[]) =>
    Effect.flatMap(SourceReads, (reads) => reads.prepare(names.map((name) => join(root, name))));
  const read = (name: string, requested: SourceReadRequest = both) =>
    Effect.flatMap(SourceReads, (reads) =>
      reads.read(
        { path: join(root, name), contents: files[name]! },
        normalized(files[name]!, requested.includeComments),
        requested,
      ),
    ).pipe(Effect.map((state) => state as SourceReadState));
  return { root, read, prepare };
}
afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("native TypeScript compiler and declaration reads", () => {
  it("registers thousands of paths without native work and opens only the file actually read", async () => {
    const { root, read, prepare } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const attach = vi.spyOn(API, "fromLSPConnection");
    const update = vi.spyOn(API.prototype, "getCurrentLanguageServerSnapshot");
    const openDocument = vi.spyOn(NativeLsp.prototype, "openDocument");
    const closeDocument = vi.spyOn(NativeLsp.prototype, "closeDocument");
    const dispose = vi.spyOn(Snapshot.prototype, "dispose");
    const close = vi.spyOn(API.prototype, "close");
    const result = await run(
      root,
      Effect.gen(function* () {
        yield* prepare(Array.from({ length: 12_222 }, (_, index) => `not-read/${index}.ts`));
        const unprepared = yield* read("use.ts").pipe(Effect.flip);
        expect(unprepared.message).toContain("was not prepared");
        expect(unprepared.message).not.toMatch(/reinstall/i);
        expect(yield* read("use.ts", { ...both, symbols: false, references: false })).toEqual({});
        yield* prepare(["use.ts"]);
        expect(open).not.toHaveBeenCalled();
        expect(attach).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(openDocument).not.toHaveBeenCalled();
        const state = yield* read("use.ts");
        expect(closeDocument).toHaveBeenCalledExactlyOnceWith(join(root, "use.ts"));
        expect(dispose).toHaveBeenCalledOnce();
        expect(close).not.toHaveBeenCalled();
        return state;
      }),
    );
    expect(result.symbols!.local).toContain("The original documented value.");
    expect(open).toHaveBeenCalledOnce();
    expect(attach).toHaveBeenCalledOnce();
    expect(openDocument).toHaveBeenCalledExactlyOnceWith(join(root, "use.ts"), consumer);
    expect(update.mock.calls).toEqual([[]]);
    expect(close).toHaveBeenCalledOnce();
  });

  it("keeps compiler types/docs, shadowed bindings, narrowing and overloads without reference searches", async () => {
    const { root, read } = await fixture();
    const search = vi
      .spyOn(LanguageService.prototype, "getReferencedSymbolsForNode")
      .mockRejectedValue(new Error("Reference searches are forbidden"));
    const result = await run(root, read("use.ts"));
    const local = result.symbols!.local!;
    expect(local).toContain("```typescript\n42\n```");
    expect(local).toContain("```typescript\nstring\n```");
    expect(local.match(/The original documented value\./g)).toHaveLength(1);
    expect(result.symbols!.value).toContain("```typescript\nstring | undefined\n```");
    expect(result.symbols!.value).toContain("```typescript\nstring\n```");
    expect(result.symbols!.value).toContain("```typescript\nundefined\n```");
    expect(result.symbols!.pair).toContain("(value: number): number");
    expect(result.symbols!.pair).toContain("(value: string): string");
    expect(Object.values(result.symbols!).every((value) => typeof value === "string")).toBe(true);
    expect(search).not.toHaveBeenCalled();
  });

  it("shares documentation across instantiated methods while retaining types, tags and separate bindings", async () => {
    const files = {
      "lib.ts": [
        "export interface Box<T> {",
        "  /**",
        "   * Read the stored value.",
        "   * @returns The stored value.",
        "   * @example box.get();",
        "   */",
        "  get(): T;",
        "}",
        "export const first = {} as Box<string>;",
        "export const second = {} as Box<number>;",
        "export const mapped: Readonly<Box<string>> = first;",
        "/** An unrelated reader. */",
        "export const other = { get: () => true };",
      ].join("\n"),
      "use.ts": [
        'import { first, second, mapped, other } from "./lib";',
        "export const results = [first.get(), second.get(), mapped.get(), other.get()];",
      ].join("\n"),
      "types.d.ts": "",
    };
    const { root, read } = await fixture(files);
    const result = await run(root, read("use.ts"));
    const get = result.symbols!.get!;
    expect(get).toContain("() => string");
    expect(get).toContain("() => number");
    expect(get).toContain("() => boolean");
    expect(get.match(/Read the stored value\./g)).toHaveLength(1);
    expect(get.match(/\*\*@returns\*\*/g)).toHaveLength(1);
    expect(get).toContain("The stored value.");
    expect(get).toContain("**@example** box.get();");
    expect(result.references!.get!["lib.ts"]).toContain("  get(): T;");
    expect(result.references!.get!["lib.ts"]).toContain("get: () => true");
  });

  it("reads const-asserted empty tuple properties and their normal usages without losing surrounding types or references", async () => {
    const files = {
      "lib.ts": "export const original = 42;",
      "use.ts": [
        'import { original } from "./lib";',
        'export const value = { action: "update", stables: [] } as const;',
        "export const used = value.stables;",
        "export const linked = original;",
      ].join("\n"),
      "types.d.ts": "",
    };
    const { root, read } = await fixture(files);
    const result = await run(root, read("use.ts"));
    expect(result.symbols!.stables).toBe("```typescript\nreadonly []\n```");
    expect(result.symbols!.used).toBe("```typescript\nreadonly []\n```");
    expect(result.symbols!.value).toContain(
      '{ readonly action: "update"; readonly stables: readonly []; }',
    );
    expect(result.symbols!.action).toBe('```typescript\n"update"\n```');
    expect(result.references!.original).toEqual({ "lib.ts": "export const original = 42;" });
    expect(result.references).not.toHaveProperty("stables");
  });

  it("keeps error types unavailable without hiding explicitly declared any types", async () => {
    const files = {
      "lib.ts": "",
      "use.ts": [
        "/** The unresolved value's documentation. */",
        "export declare const unavailable: MissingType;",
        "export declare const explicit: any;",
      ].join("\n"),
      "types.d.ts": "",
    };
    const { root, read } = await fixture(files);
    const result = await run(root, read("use.ts"));
    expect(result.symbols!.unavailable).toBe("The unresolved value's documentation.");
    expect(result.symbols!.explicit).toBe("```typescript\nany\n```");
  });

  it("returns complete declarations, separates distinct scopes and omits unused/self/external targets", async () => {
    const { root, read } = await fixture();
    const result = await run(root, read("use.ts"));
    const refs = result.references!;
    expect(refs.local).toEqual({ "lib.ts": "export const original = 42;" });
    expect(refs.local!["lib.ts"]).not.toContain("neighbor");
    expect(refs.Shape!["lib.ts"]).toBe(
      "export interface Shape { first: number }\n…\nexport interface Shape { second: string }",
    );
    expect(refs.pair!["lib.ts"]).toContain("\n…\n");
    expect(refs.pair!["lib.ts"]).toContain("export function pair(value: number): number;");
    expect(refs.pair!["lib.ts"]).toContain("export function pair(value: string): string;");
    expect(refs).not.toHaveProperty("unused");
    expect(refs).not.toHaveProperty("external");
    expect(refs).not.toHaveProperty("dependency");
    expect(Object.values(refs).flatMap(Object.keys)).not.toContain("use.ts");
    expect(JSON.stringify(refs)).not.toMatch(/ordinary comment|never send this directive/);
    expect(refs.local!["lib.ts"]).not.toContain("@adhere");
    expect(JSON.stringify(refs)).not.toContain(library);
  });

  it("includes full function and initializer bodies, complete types, and only the referenced class members", async () => {
    const calculate = [
      "export function calculate(value: number): number {",
      "\tconst doubled = value * 2;",
      "\tconst increased = doubled + 1;",
      "\tconst rounded = Math.round(increased);",
      "\tconst bounded = Math.max(0, rounded);",
      "\tconst final = bounded + 2;",
      "\treturn final;",
      "}",
    ].join("\n");
    const transform = [
      "export const transform = (value: number): number => {",
      "  const first = value + 1;",
      "  const second = first + 1;",
      "  const third = second + 1;",
      "  const fourth = third + 1;",
      "  return fourth;",
      "};",
    ].join("\n");
    const settings = [
      "export const settings = {",
      "  first: 1,",
      "  second: 2,",
      "  third: 3,",
      "  fourth: 4,",
      "  fifth: 5,",
      "  sixth: 6,",
      "};",
    ].join("\n");
    const method = [
      "  run(value: number): number {",
      "    const first = value + 1;",
      "    const second = first + 1;",
      "    const third = second + 1;",
      "    const fourth = third + 1;",
      "    return fourth;",
      "  }",
    ].join("\n");
    const accessors = [
      "  get current(): number {",
      "    return this.stored;",
      "  }",
      "  set current(value: number) {",
      "    this.stored = value;",
      "  }",
    ].join("\n");
    const worker = [
      "export class Worker {",
      "  private stored = 0;",
      method,
      accessors,
      "  unrelated() { return -1; }",
      "}",
    ].join("\n");
    const shape = [
      "export interface Shape {",
      "  first: number;",
      "  second: number;",
      "  third: number;",
      "  fourth: number;",
      "  fifth: number;",
      "  sixth: number;",
      "}",
    ].join("\n");
    const alias = shape.replace("interface Shape", "type Alias =") + ";";
    const destructured = "export const { first, second } = settings;";
    const declarations = {
      calculate,
      transform,
      settings,
      Worker: worker,
      Shape: shape,
      Alias: alias,
    };
    const files = {
      "lib.ts": [
        "export const outsideBefore = 0;",
        ...Object.values(declarations),
        destructured,
        "export const outsideAfter = 0;",
      ].join("\n\n"),
      "use.ts": [
        'import { calculate, transform, settings, Worker, Shape, Alias, first } from "./lib";',
        "export const worker = new Worker();",
        "worker.current = calculate(transform(settings.first));",
        "export const result = worker.run(worker.current) + first;",
        "export type SelectedShape = Shape;",
        "export type SelectedAlias = Alias;",
      ].join("\n"),
      "types.d.ts": "",
    };
    const { root, read } = await fixture(files);
    const result = await run(root, read("use.ts", { ...both, symbols: false }));
    for (const [name, text] of Object.entries(declarations)) {
      expect(result.references![name]).toEqual({ "lib.ts": text });
    }
    expect(result.references!.run).toEqual({ "lib.ts": method });
    expect(result.references!.current).toEqual({ "lib.ts": accessors });
    expect(result.references!.first).toEqual({
      "lib.ts": `  first: 1,\n…\n${destructured}`,
    });
    expect(JSON.stringify(result.references)).not.toMatch(/outsideBefore|outsideAfter/);
  });

  it("respects selectors and source comment/directive policy while always preserving compiler JSDoc", async () => {
    const { root, read, prepare } = await fixture();
    const result = await run(
      root,
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        return {
          symbols: yield* read("use.ts", { ...both, references: false }),
          references: yield* read("use.ts", { ...both, symbols: false, includeComments: true }),
        };
      }),
    );
    expect(Object.keys(result.symbols)).toEqual(["symbols"]);
    expect(result.symbols.symbols!.local).toContain("The original documented value.");
    expect(Object.keys(result.references)).toEqual(["references"]);
    expect(result.references.references!.local!["lib.ts"]).toBe(
      normalized(library, true).slice(1, 6).join("\n"),
    );
    expect(result.references.references!.local!["lib.ts"]).toContain(
      "/** The original documented value. */",
    );
    expect(result.references.references!.local!["lib.ts"]).not.toContain("adhere-ignore");
  });

  it("serializes concurrent same-file and child-project reads while isolating aliases and inferred ownership", async () => {
    const child = (target: string) =>
      JSON.stringify({
        compilerOptions: {
          strict: true,
          types: [],
          module: "Preserve",
          moduleResolution: "Bundler",
          paths: { "#value": [target] },
        },
        include: ["src/**/*.ts"],
      });
    const files = {
      "tsconfig.json": JSON.stringify({
        files: [],
        references: [{ path: "./packages/a" }, { path: "./packages/b" }],
      }),
      "packages/a/tsconfig.json": child("./src/value.ts"),
      "packages/b/tsconfig.json": child("./alt/value.ts"),
      "packages/a/src/value.ts": "/** First project. */\nexport const value = 1;",
      "packages/b/alt/value.ts": "/** Second project. */\nexport const value = 2;",
      "packages/a/src/use.ts":
        'import { value as local } from "#value";\nexport const result = local;',
      "packages/b/src/use.ts":
        'import { value as local } from "#value";\nexport const result = local;',
      "packages/a/excluded.ts": "export const outside = 3;\nexport const use = outside;",
    };
    const { root, read, prepare } = await fixture(files, false);
    const update = vi.spyOn(API.prototype, "getCurrentLanguageServerSnapshot");
    const openDocument = NativeLsp.prototype.openDocument;
    const closeDocument = NativeLsp.prototype.closeDocument;
    const opening = vi.spyOn(NativeLsp.prototype, "openDocument");
    const closing = vi.spyOn(NativeLsp.prototype, "closeDocument");
    let active = 0;
    let peak = 0;
    opening.mockImplementation(async function (this: NativeLsp, file, text) {
      active += 1;
      peak = Math.max(peak, active);
      await openDocument.call(this, file, text);
    });
    closing.mockImplementation(async function (this: NativeLsp, file) {
      await closeDocument.call(this, file);
      active -= 1;
    });
    const names = ["packages/a/src/use.ts", "packages/b/src/use.ts", "packages/a/excluded.ts"];
    const result = await run(
      root,
      prepare(names).pipe(
        Effect.andThen(
          Effect.all(
            [...names, names[0]!].map((name) => read(name)),
            { concurrency: 8 },
          ),
        ),
      ),
    );
    expect(result[0]!.symbols!.local).toContain("First project.");
    expect(result[1]!.symbols!.local).toContain("Second project.");
    expect(result[0]!.references!.local).toEqual({
      "packages/a/src/value.ts": "export const value = 1;",
    });
    expect(result[1]!.references!.local).toEqual({
      "packages/b/alt/value.ts": "export const value = 2;",
    });
    expect(result[2]!.symbols!.outside).toContain("```typescript\n3\n```");
    expect(result[2]!.references).toEqual({});
    expect(result[3]).toEqual(result[0]);
    expect(peak).toBe(1);
    expect(active).toBe(0);
    expect(update.mock.calls).toEqual([[], [], [], []]);
  });

  it("supports declarations and compiler types/docs without any tsconfig", async () => {
    const files = {
      "lib.ts": "/** Inferred docs. */\nexport const value = 1;",
      "use.ts": 'import { value as local } from "./lib";\nexport const used = local;',
    };
    const { root, read, prepare } = await fixture(files, false);
    const result = await run(
      root,
      prepare(["lib.ts", "use.ts"]).pipe(Effect.andThen(read("use.ts"))),
    );
    expect(result.symbols!.local).toContain("Inferred docs.");
    expect(result.references!.local).toEqual({ "lib.ts": "export const value = 1;" });
    expect(Object.keys(result).sort()).toEqual(["references", "symbols"]);
  });

  it("follows used namespace members with UTF-16 positions and excludes declarations outside the audit root", async () => {
    const files = {
      "outside.ts": "/** Outside documentation. */\nexport const outside = 1;",
      "workspace/tsconfig.json": JSON.stringify({
        compilerOptions: {
          strict: true,
          types: [],
          module: "Preserve",
          moduleResolution: "Bundler",
        },
        files: ["use.ts", "lib.ts"],
      }),
      "workspace/lib.ts": "/** Unicode documentation 😀. */\nexport const original = 42;",
      "workspace/use.ts": [
        'import * as api from "./lib";',
        'import { outside } from "../outside";',
        'export const emoji = "😀"; export const used = api.original;',
        "export const external = outside;",
      ].join("\n"),
    };
    const { root, read } = await fixture(files, false);
    const result = await run(join(root, "workspace"), read("workspace/use.ts"));
    expect(result.symbols!.original).toContain("Unicode documentation 😀.");
    expect(result.symbols!.outside).toContain("Outside documentation.");
    expect(result.references!.original).toEqual({
      "lib.ts": "export const original = 42;",
    });
    expect(result.references).not.toHaveProperty("outside");
  });

  it("pins each read to its supplied text despite disk changes and accepts new text in a later read", async () => {
    const { root, read, prepare } = await fixture();
    const openDocument = NativeLsp.prototype.openDocument;
    const opening = vi.spyOn(NativeLsp.prototype, "openDocument");
    opening.mockImplementationOnce(async function (this: NativeLsp, file, text) {
      await openDocument.call(this, file, text);
      await writeFile(file, consumer.replace("local: string", "local: number"));
    });
    const result = await run(
      root,
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        const original = yield* read("use.ts");
        const reads = yield* SourceReads;
        const changed = yield* Effect.promise(() => readFile(join(root, "use.ts"), "utf8"));
        const updated = yield* reads.read(
          { path: join(root, "use.ts"), contents: changed },
          normalized(changed),
          both,
        );
        return { original, updated: updated as SourceReadState };
      }),
    );
    expect(result.original.symbols!.local).toContain("```typescript\nstring\n```");
    expect(result.updated.symbols!.local).toContain("```typescript\nnumber\n```");
    expect(result.updated.symbols!.local).not.toContain("```typescript\nstring\n```");
  });

  it("refuses a native snapshot whose source differs from the supplied judged text", async () => {
    const { root, read } = await fixture();
    const getSourceFile = Program.prototype.getSourceFile;
    const gettingSource = vi.spyOn(Program.prototype, "getSourceFile");
    gettingSource.mockImplementationOnce(async function (this: Program, file) {
      const source = await getSourceFile.call(this, file);
      if (source) Object.defineProperty(source, "text", { value: source.text + "\n// mismatch" });
      return source;
    });
    const failure = await run(root, read("use.ts").pipe(Effect.flip));
    expect(failure.message).toContain(
      "changed between the source walk and native TypeScript snapshot",
    );
    expect(failure.message).not.toMatch(/reinstall/i);
  });

  it("stays lazy, bootstraps one direct file, and closes its only compiler and attached SDK", async () => {
    const { root, read, prepare } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const attach = vi.spyOn(API, "fromLSPConnection");
    const close = vi.spyOn(API.prototype, "close");
    await run(
      root,
      prepare([]).pipe(
        Effect.andThen(read("use.ts", { ...both, symbols: false, references: false })),
        Effect.tap((state) =>
          Effect.sync(() => {
            expect(state).toEqual({});
            expect(open).not.toHaveBeenCalled();
          }),
        ),
        Effect.andThen(Effect.all([read("use.ts"), read("use.ts")], { concurrency: 8 })),
      ),
    );
    expect(open).toHaveBeenCalledOnce();
    expect(attach).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    const connection = (await open.mock.results[0]!.value) as NativeLsp;
    expect(() => process.kill(connection.pid!, 0)).toThrow();
  });

  it("closes both resources after a compiler documentation failure, without reinstall advice", async () => {
    const { root, read, prepare } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const close = vi.spyOn(API.prototype, "close");
    const documenting = vi.spyOn(Checker.prototype, "getDocumentationCommentOfSymbol");
    const failure = await run(
      root,
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        documenting.mockRejectedValueOnce(new Error("native documentation failed"));
        return yield* read("use.ts").pipe(Effect.flip);
      }),
    );
    expect(failure.message).toContain("native documentation failed");
    expect(failure.message).not.toMatch(/reinstall/i);
    expect(close).toHaveBeenCalledOnce();
    const connection = (await open.mock.results[0]!.value) as NativeLsp;
    expect(() => process.kill(connection.pid!, 0)).toThrow();
  });

  it.each(["project lookup", "checker lookup"])(
    "refuses a pending SDK %s when its compiler exits, including late rejection cleanup",
    async (phase) => {
      const { root, read, prepare } = await fixture();
      const open = vi.spyOn(NativeLsp, "open");
      const entered = Promise.withResolvers<void>();
      const pending = Promise.withResolvers<never>();
      const outcome = run(
        root,
        Effect.gen(function* () {
          yield* prepare(["use.ts"]);
          const blocked = () => {
            entered.resolve();
            return pending.promise;
          };
          if (phase === "project lookup")
            vi.spyOn(Snapshot.prototype, "getDefaultProjectForFile").mockImplementationOnce(
              blocked,
            );
          else vi.spyOn(Checker.prototype, "getSymbolAtLocation").mockImplementationOnce(blocked);
          return yield* read("use.ts").pipe(Effect.flip);
        }),
      );
      await entered.promise;
      const connection = (await open.mock.results[0]!.value) as NativeLsp;
      process.kill(connection.pid!, "SIGKILL");
      try {
        const failure = await within(outcome, 3000);
        expect(failure.message).toMatch(/Native TypeScript LSP (closed|exited)/);
        expect(failure.message).not.toMatch(/reinstall/i);
        expect(() => process.kill(connection.pid!, 0)).toThrow();
      } finally {
        pending.reject(new Error("late SDK rejection"));
        await outcome.catch(() => {});
      }
    },
  );

  it("cancels a queued read without opening its document or interrupting the native owner", async () => {
    const { root, read, prepare } = await fixture();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const getSymbol = Checker.prototype.getSymbolAtLocation;
    const gettingSymbol = vi.spyOn(Checker.prototype, "getSymbolAtLocation");
    const openDocument = vi.spyOn(NativeLsp.prototype, "openDocument");
    gettingSymbol.mockImplementationOnce(async function (this: Checker, nodes) {
      entered.resolve();
      await release.promise;
      return getSymbol.call(this, nodes);
    });
    try {
      const result = await run(
        root,
        Effect.gen(function* () {
          yield* prepare(["use.ts"]);
          const reads = yield* SourceReads;
          return yield* Effect.all(
            [
              read("use.ts"),
              Effect.promise(async () => {
                await entered.promise;
                const queued = Effect.runFork(
                  reads.read(
                    { path: join(root, "use.ts"), contents: consumer },
                    normalized(consumer),
                    both,
                  ),
                );
                try {
                  await new Promise<void>((resolve) => setImmediate(resolve));
                  await within(Effect.runPromise(Fiber.interrupt(queued)), 1000);
                  expect(openDocument).toHaveBeenCalledOnce();
                } finally {
                  release.resolve();
                  await Effect.runPromise(Fiber.interrupt(queued));
                }
              }),
            ],
            { concurrency: 8 },
          );
        }),
      );
      expect(result[0].symbols!.local).toContain("The original documented value.");
      expect(openDocument).toHaveBeenCalledOnce();
    } finally {
      release.resolve();
    }
  });

  it("finishes a healthy interrupted owner and reuses its layer and compiler for the next read", async () => {
    const { root, read, prepare } = await fixture();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const open = vi.spyOn(NativeLsp, "open");
    const closeDocument = vi.spyOn(NativeLsp.prototype, "closeDocument");
    const dispose = vi.spyOn(Snapshot.prototype, "dispose");
    const close = vi.spyOn(API.prototype, "close");
    const typeToString = Checker.prototype.typeToString;
    vi.spyOn(Checker.prototype, "typeToString").mockImplementationOnce(async function (
      this: Checker,
      ...args
    ) {
      entered.resolve();
      await release.promise;
      return typeToString.apply(this, args);
    });
    const connection = await run(
      root,
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        const reads = yield* SourceReads;
        const reading = read("use.ts").pipe(Effect.provideService(SourceReads, reads));
        const owner = Effect.runFork(reading);
        try {
          yield* Effect.promise(() => within(entered.promise, 3000));
          let interrupted = false;
          const cancellation = Effect.runPromise(Fiber.interrupt(owner)).then(() => {
            interrupted = true;
          });
          yield* Effect.promise(() => new Promise<void>((resolve) => setImmediate(resolve)));
          expect(interrupted).toBe(false);
          expect(closeDocument).not.toHaveBeenCalled();
          expect(dispose).not.toHaveBeenCalled();
          release.resolve();
          yield* Effect.promise(() => within(cancellation, 3000));
          expect(interrupted).toBe(true);
          expect(closeDocument).toHaveBeenCalledExactlyOnceWith(join(root, "use.ts"));
          expect(dispose).toHaveBeenCalledOnce();
          expect(close).not.toHaveBeenCalled();
          const native = (yield* Effect.promise(() => open.mock.results[0]!.value)) as NativeLsp;
          expect(() => process.kill(native.pid!, 0)).not.toThrow();
          const state = yield* Effect.promise(() => within(Effect.runPromise(reading), 3000));
          expect(state.symbols!.local).toContain("```typescript\n42\n```");
          expect(state.symbols!.local).toContain("The original documented value.");
          expect(state.references!.local).toEqual({ "lib.ts": "export const original = 42;" });
          expect(closeDocument).toHaveBeenCalledTimes(2);
          expect(dispose).toHaveBeenCalledTimes(2);
          expect(close).not.toHaveBeenCalled();
          expect(open).toHaveBeenCalledOnce();
          expect(() => process.kill(native.pid!, 0)).not.toThrow();
          return native;
        } finally {
          release.resolve();
          yield* Fiber.interrupt(owner);
        }
      }),
    );
    expect(close).toHaveBeenCalledOnce();
    expect(() => process.kill(connection.pid!, 0)).toThrow();
  });

  it("bounds cancellation during a stalled SDK call by its phase deadline and reaps its compiler", async () => {
    const { root, read, prepare } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const entered = Promise.withResolvers<void>();
    const pending = Promise.withResolvers<never>();
    const fiber = Effect.runFork(
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        vi.spyOn(Checker.prototype, "getSymbolAtLocation").mockImplementationOnce(() => {
          entered.resolve();
          return pending.promise;
        });
        return yield* read("use.ts");
      }).pipe(Effect.provide(SourceReadsLive(root).pipe(Layer.provide(Path.layer)))),
    );
    await entered.promise;
    const connection = (await open.mock.results[0]!.value) as NativeLsp;
    let interrupted = false;
    const cancellation = Effect.runPromise(Fiber.interrupt(fiber)).then(() => {
      interrupted = true;
    });
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(interrupted).toBe(false);
      await vi.advanceTimersByTimeAsync(30_000);
      await vi.advanceTimersByTimeAsync(2000);
      vi.useRealTimers();
      await within(cancellation, 3000);
      expect(interrupted).toBe(true);
      expect(() => process.kill(connection.pid!, 0)).toThrow();
    } finally {
      vi.useRealTimers();
      pending.reject(new Error("late SDK rejection after cancellation"));
      await cancellation;
    }
  });

  it("bounds a stalled snapshot release after a documentation failure and still reaps its compiler", async () => {
    const { root, read, prepare } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const close = vi.spyOn(API.prototype, "close");
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const lateDispose = Promise.withResolvers<void>();
    const dispose = Snapshot.prototype.dispose;
    const disposing = vi.spyOn(Snapshot.prototype, "dispose");
    const documenting = vi.spyOn(Checker.prototype, "getDocumentationCommentOfSymbol");
    disposing.mockImplementationOnce(async function (this: Snapshot) {
      entered.resolve();
      try {
        await release.promise;
        await dispose.call(this);
      } finally {
        lateDispose.resolve();
      }
    });
    const outcome = run(
      root,
      Effect.gen(function* () {
        yield* prepare(["use.ts"]);
        documenting.mockRejectedValueOnce(new Error("native documentation failed"));
        return yield* read("use.ts").pipe(Effect.flip);
      }),
    );
    await entered.promise;
    const connection = (await open.mock.results[0]!.value) as NativeLsp;
    try {
      const failure = await within(outcome, 3500);
      expect(failure.message).toContain("native documentation failed");
      expect(close).toHaveBeenCalledOnce();
      expect(() => process.kill(connection.pid!, 0)).toThrow();
    } finally {
      release.resolve();
      await lateDispose.promise;
      await outcome.catch(() => {});
    }
  });

  it("refuses a successful query if its per-read snapshot release stalls past the SDK deadline", async () => {
    const { root, read } = await fixture();
    const open = vi.spyOn(NativeLsp, "open");
    const close = vi.spyOn(API.prototype, "close");
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    // The SDK memoizes disposal: the read and API.close must await the same stalled release.
    vi.spyOn(Snapshot.prototype, "dispose").mockImplementation(() => {
      entered.resolve();
      return release.promise;
    });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const outcome = run(root, read("use.ts").pipe(Effect.flip));
    try {
      await entered.promise;
      const connection = (await open.mock.results[0]!.value) as NativeLsp;
      await vi.advanceTimersByTimeAsync(30_000);
      await vi.advanceTimersByTimeAsync(2000);
      vi.useRealTimers();
      const failure = await within(outcome, 3000);
      expect(failure.message).toContain("Native TypeScript SDK timed out: disposeSnapshot");
      expect(failure.message).not.toMatch(/reinstall/i);
      expect(close).toHaveBeenCalledOnce();
      expect(() => process.kill(connection.pid!, 0)).toThrow();
      release.reject(new Error("late snapshot release rejection"));
      await expect(within(close.mock.results[0]!.value as Promise<void>, 3000)).rejects.toThrow(
        "late snapshot release rejection",
      );
    } finally {
      vi.useRealTimers();
      release.reject(new Error("late snapshot release rejection"));
      const closing = close.mock.results[0]?.value as Promise<void> | undefined;
      await within(Promise.all([closing?.catch(() => {}), outcome.catch(() => {})]), 3000);
    }
  });

  it("validates the packaged compiler handoff and preserves standalone laziness", async () => {
    const { root, read } = await fixture();
    vi.stubGlobal("Bun", { isStandaloneExecutable: true });
    vi.stubEnv("ADHERE_TYPESCRIPT_PACKAGE", undefined);
    expect(await run(root, read("use.ts", { ...both, symbols: false, references: false }))).toEqual(
      {},
    );
    const missing = await run(root, read("use.ts").pipe(Effect.flip));
    expect(missing.message).toContain("raw executable has no installed compiler");
    vi.stubEnv(
      "ADHERE_TYPESCRIPT_PACKAGE",
      createRequire(import.meta.url).resolve(
        `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
      ),
    );
    expect((await run(root, read("use.ts"))).symbols!.local).toContain(
      "The original documented value.",
    );
    const manifest = join(root, "wrong-compiler.json");
    await writeFile(
      manifest,
      JSON.stringify({
        name: `@typescript/typescript-${process.platform}-${process.arch}`,
        version: "7.0.1",
        os: [process.platform],
        cpu: [process.arch],
      }),
    );
    vi.stubEnv("ADHERE_TYPESCRIPT_PACKAGE", manifest);
    const mismatch = await run(root, read("use.ts").pipe(Effect.flip));
    expect(mismatch.message).toContain(`@${packageJson.devDependencies.typescript}`);
    expect(mismatch.message).toContain("Reinstall @drkmttr/adhere");
  });

  it("bounds SDK attachment and closes a late successful attachment after reaping its compiler", async () => {
    const { root, read } = await fixture();
    const starting = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const attach = API.fromLSPConnection.bind(API);
    const attaching = vi.spyOn(API, "fromLSPConnection");
    const nativeClose = vi.spyOn(NativeLsp.prototype, "close");
    const close = vi.spyOn(API.prototype, "close");
    attaching.mockImplementationOnce(async (options) => {
      const attached = await attach.call(API, options);
      starting.resolve();
      await release.promise;
      return attached;
    });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const outcome = run(root, read("use.ts").pipe(Effect.flip));
    try {
      await starting.promise;
      await vi.advanceTimersByTimeAsync(30_000);
      await vi.advanceTimersByTimeAsync(2000);
      vi.useRealTimers();
      const failure = await within(outcome, 3500);
      expect(failure.message).toContain("Native TypeScript SDK timed out: API attachment");
      const connection = nativeClose.mock.contexts[0] as NativeLsp;
      expect(() => process.kill(connection.pid!, 0)).toThrow();
      expect(close).not.toHaveBeenCalled();
      release.resolve();
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(close).toHaveBeenCalledOnce();
      await within(close.mock.results[0]!.value as Promise<void>, 3000);
    } finally {
      vi.useRealTimers();
      release.resolve();
      await outcome.catch(() => {});
    }
  });

  it("waits for late SDK attachment before cancellation closes the native process", async () => {
    const { root, read } = await fixture();
    const starting = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const attach = API.fromLSPConnection.bind(API);
    const attaching = vi.spyOn(API, "fromLSPConnection");
    const open = vi.spyOn(NativeLsp, "open");
    const close = vi.spyOn(API.prototype, "close");
    attaching.mockImplementationOnce(async (options) => {
      starting.resolve();
      await release.promise;
      return attach.call(API, options);
    });
    const fiber = Effect.runFork(
      read("use.ts").pipe(Effect.provide(SourceReadsLive(root).pipe(Layer.provide(Path.layer)))),
    );
    await starting.promise;
    let interrupted = false;
    const cancellation = Effect.runPromise(Fiber.interrupt(fiber)).then(() => {
      interrupted = true;
    });
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(interrupted).toBe(false);
      expect(close).not.toHaveBeenCalled();
      release.resolve();
      await cancellation;
      expect(close).toHaveBeenCalledOnce();
      const connection = (await open.mock.results[0]!.value) as NativeLsp;
      expect(() => process.kill(connection.pid!, 0)).toThrow();
    } finally {
      release.resolve();
      await cancellation;
    }
  });
});
