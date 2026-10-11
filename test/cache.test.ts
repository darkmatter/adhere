import { createHash } from "node:crypto";
import { join } from "node:path";
import { Crypto, Effect, FileSystem, Layer, Path, Record } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { AuditCache, AuditCacheLive } from "../src/services/AuditCache.ts";

describe("cache files", () => {
  const directory = join(process.cwd(), ".adhere", "cache");
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  const sha256Crypto = Layer.succeed(
    Crypto.Crypto,
    Crypto.make({
      randomBytes: (size) => new Uint8Array(size),
      digest: (_algorithm, data) =>
        Effect.sync(() => new Uint8Array(createHash("sha256").update(data).digest())),
    }),
  );

  /** Files in a map of path to text; listing a directory gives its direct children. */
  const memoryFiles = (seed: Readonly<Record<string, string>> = {}) => {
    const files = new Map(Object.entries(seed));
    const layer = FileSystem.layerNoop({
      readDirectory: (path) =>
        Effect.sync(() => [
          ...new Set(
            [...files.keys()]
              .filter((file) => file.startsWith(`${path}/`))
              .map((file) => file.slice(path.length + 1).split("/")[0] ?? ""),
          ),
        ]),
      readFileString: (path) => Effect.succeed(files.get(path) ?? ""),
      writeFileString: (path, text) =>
        Effect.sync(() => {
          files.set(path, text);
        }),
      makeDirectory: () => Effect.void,
      remove: (path) =>
        Effect.sync(() => {
          files.delete(path);
        }),
    });
    return { files, layer };
  };

  const run = <A>(
    fs: Layer.Layer<FileSystem.FileSystem>,
    program: Effect.Effect<A, never, AuditCache>,
  ) =>
    Effect.runPromise(
      program.pipe(
        Effect.provide(
          AuditCacheLive.pipe(Layer.provide(Layer.mergeAll(fs, Path.layer, sha256Crypto))),
        ),
      ),
    );

  /** The names of the cache's files in `folder`, in order. */
  const listed = (files: ReadonlyMap<string, string>, folder: string) =>
    [...files.keys()]
      .filter((file) => file.startsWith(`${directory}/${folder}/`))
      .map((file) => file.slice(`${directory}/${folder}/`.length))
      .sort();

  it("adds a file for each new set of answers, named for the content and its own text, and reads their union", async () => {
    const memory = memoryFiles();
    const union = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        yield* cache.put("c0ffee", { f1: { probability: 0.1 } });
        yield* cache.put("c0ffee", { f2: { probability: 0.9, section: { first: 3, last: 3 } } });
        yield* cache.put("c0ffee", { f2: { probability: 0.9, section: { first: 3, last: 3 } } });
        return yield* cache.get("c0ffee", join(process.cwd(), "src/a.ts"));
      }),
    );
    expect(union).toEqual({
      f1: { probability: 0.1 },
      f2: { probability: 0.9, section: { first: 3, last: 3 } },
    });
    const first = '{\n  "answers": {\n    "f1": {\n      "probability": 0.1\n    }\n  }\n}\n';
    expect(listed(memory.files, "files")).toHaveLength(2);
    expect(memory.files.get(`${directory}/files/c0ffee.${sha(first).slice(0, 16)}.json`)).toBe(
      first,
    );
  });

  it("carries entries and tallies over from the layout before content keys, with relative paths", async () => {
    const file = join(process.cwd(), "src/a.ts");
    const memory = memoryFiles({
      [`${directory}/${sha(file)}`]: JSON.stringify({
        hash: "c0ffee",
        judgments: { a: { fingerprint: "f1", probability: 0.8, line: 2 } },
      }),
      [`${directory}/${sha("\u0000tally\u0000k1")}`]: JSON.stringify({ files: { [file]: 0.3 } }),
    });
    const [answers, stale, tally] = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        return [
          yield* cache.get("c0ffee", file),
          // The same path with other content: the old entry was about an earlier version.
          yield* cache.get("decade", file),
          yield* cache.tally("k1"),
        ] as const;
      }),
    );
    // Its line, from before sections, is dropped.
    expect(answers).toEqual({ f1: { probability: 0.8 } });
    expect(stale).toEqual({});
    expect(tally).toEqual({ files: { [file]: 0.3 } });
    expect(listed(memory.files, "files")).toHaveLength(1);
    const [kept] = listed(memory.files, "tallies");
    expect(memory.files.get(`${directory}/tallies/${kept}`)).toBe(
      '{\n  "files": {\n    "src/a.ts": 0.3\n  }\n}\n',
    );
  });

  it("prunes answers about content no file has, keeps every rule's answers and tallies, and folds each group", async () => {
    const memory = memoryFiles({ [`${directory}/${"0".repeat(64)}`]: "{}" });
    const [deleted, kept] = await run(
      memory.layer,
      Effect.gen(function* () {
        const cache = yield* AuditCache;
        yield* cache.put("live", { f1: { probability: 0.1 } });
        yield* cache.put("live", {
          f1: { probability: 0.1, section: { first: 4, last: 4 } },
          other: { probability: 0.5 },
        });
        yield* cache.put("gone", { f1: { probability: 0.2 } });
        yield* cache.putTally("k1", { files: { [join(process.cwd(), "src/a.ts")]: 0.3 } });
        yield* cache.putTally("k1", { files: { [join(process.cwd(), "src/b.ts")]: 0.6 } });
        yield* cache.putTally("k2", { files: {} });
        const deleted = yield* cache.prune({ hashes: new Set(["live"]), tallies: new Set(["k1"]) });
        return [deleted, yield* cache.get("live", join(process.cwd(), "src/a.ts"))] as const;
      }),
    );
    // "other" answers a rule the run left out, such as another preset's: it stays.
    expect(kept).toEqual({
      f1: { probability: 0.1, section: { first: 4, last: 4 } },
      other: { probability: 0.5 },
    });
    const folded =
      '{\n  "answers": {\n    "f1": {\n      "probability": 0.1,\n      "section": {\n        "first": 4,\n        "last": 4\n      }\n    },\n    "other": {\n      "probability": 0.5\n    }\n  }\n}\n';
    expect(listed(memory.files, "files")).toEqual([`live.${sha(folded).slice(0, 16)}.json`]);
    const tallies = listed(memory.files, "tallies");
    // k2 is the tally of a rule the run left out: it stays too.
    expect(tallies.map((name) => name.split(".")[0]).sort()).toEqual(["k1", "k2"]);
    const k1 = tallies.find((name) => name.startsWith("k1."));
    expect(memory.files.get(`${directory}/tallies/${k1}`)).toBe(
      '{\n  "files": {\n    "src/a.ts": 0.3,\n    "src/b.ts": 0.6\n  }\n}\n',
    );
    expect(memory.files.has(`${directory}/${"0".repeat(64)}`)).toBe(false);
    // Live's first file, which its second holds all of; gone's file; both of k1's; and the old file.
    expect(deleted).toBe(5);
  });
});
