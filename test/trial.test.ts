import { readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { Crypto, Effect, FileSystem, Layer, Path } from "effect";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { AuditCache, type Answers } from "../src/services/AuditCache.ts";
import {
  DEFAULT_TRIAL_LIMIT,
  previewTrial,
  runTrial,
  TrialUnavailable,
} from "../src/create/trial.ts";
import { emptySourceReads, onDisk, sendingJev, testCrypto } from "./audit.fixtures.ts";

const source = (description = "A port is a branded integer.") =>
  `---\ndescription: ${description}\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n`;

const draft = (text = source()) =>
  ({ kind: "adhere", id: "ports", format: "markdown", source: text }) as const;

const platform = Layer.mergeAll(BunFileSystem.layer, Path.layer, testCrypto);

const reportOf = async (root: string) =>
  JSON.parse(await readFile(join(root, ".adhere/trial/ports.json"), "utf8")) as Record<
    string,
    unknown
  >;

/** A cache that keeps answers by content hash and remembers writes and prunes. */
const memoryCache = (seed: Readonly<Record<string, Answers>> = {}) => {
  const entries = new Map(Object.entries(seed));
  const writes: Array<string> = [];
  const prunes = 0;
  const layer = Layer.succeed(AuditCache, {
    get: (hash) => Effect.sync(() => entries.get(hash) ?? {}),
    put: (hash, answers) =>
      Effect.sync(() => {
        writes.push(hash);
        entries.set(hash, { ...entries.get(hash), ...answers });
      }),
    tally: () => Effect.succeed(undefined),
    putTally: () => Effect.void,
    prune: () => Effect.die("a trial never prunes the cache"),
  });
  return { layer, entries, writes, prunes };
};

const fakes = (answers: { judge: Record<string, number>; locate: Record<string, number> }) => {
  const jev = sendingJev(answers);
  const cache = memoryCache();
  return {
    jev,
    cache,
    layers: {
      jev: jev.layer,
      cache: cache.layer,
      sourceReads: emptySourceReads,
    },
  };
};

type TrialEnv = Crypto.Crypto | FileSystem.FileSystem | Path.Path;

const run = <A, E>(effect: Effect.Effect<A, E, TrialEnv>) =>
  Effect.runPromise(effect.pipe(Effect.provide(platform)));

const tree = () => ({
  "adhere.config.ts": `export default {
  model: "trial-model",
  threshold: 0.8,
  reads: [],
  exclude: ["gen/**"],
  rules: {
    project: { description: "A project rule.", must: "project()" },
  },
};`,
  ".adhere/rules/project/RULE.md": "---\ndescription: A project rule.\n---\n\nproject()\n",
  "src/a.ts": "const a = 1;\nconst b = 2;\nconst port = 3000;\n",
  "src/b.ts": "const a = 1;\nconst b = 2;\nconst port = 4000;\n",
  "src/c.test.ts": "const port = 5000;\n",
  "gen/excluded.ts": "const port = 6000;\n",
  "node_modules/pkg/index.ts": "const port = 7000;\n",
});

describe("trial", () => {
  it("judges only the draft rule and inherits the project's runtime settings", async () => {
    const root = await onDisk(tree());
    try {
      const { layers, jev } = fakes({
        judge: { ports: 0.9, project: 0.99 },
        locate: { ports: 3 },
      });
      const preview = await run(
        previewTrial(draft(), { kind: "all" }, { root, services: { cache: layers.cache } }),
      );
      expect(preview).toMatchObject({
        eligible: 2,
        selected: 2,
        requests: 2,
        cached: 0,
      });
      expect(jev.sent).toEqual([]);

      const result = await run(runTrial(draft(), { kind: "all" }, { root, services: layers }));
      expect(result.findings.map((finding) => finding.rule)).toEqual(["ports", "ports"]);
      // One judge and one locate request per file.
      expect(jev.sent).toHaveLength(4);
      expect(result.selectedFiles).toEqual(["src/a.ts", "src/b.ts"]);

      const report = await reportOf(root);
      expect(report).toMatchObject({
        kind: "adhere",
        eligible: 2,
        selectedFiles: ["src/a.ts", "src/b.ts"],
        plan: { model: "trial-model", threshold: 0.8, requests: 2 },
      });
      const plan = report.plan as { rules: number; checks: number };
      // One rule over two files: the draft's. The config's project rule was not planned.
      expect(plan.rules).toBe(1);
      expect(plan.checks).toBe(2);
      expect(JSON.stringify(report)).not.toContain("A project rule.");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("caps the file count before planning, cached files included, and scans all when asked", async () => {
    const root = await onDisk(tree());
    try {
      const { layers, cache } = fakes({ judge: { ports: 0.9 }, locate: { ports: 3 } });
      const first = await run(
        runTrial(draft(), { kind: "files", limit: 1 }, { root, services: layers }),
      );
      expect(first.selectedFiles).toEqual(["src/a.ts"]);
      expect(first.cached).toBe(0);
      expect(cache.writes.length).toBeGreaterThan(0);

      const second = await run(
        runTrial(draft(), { kind: "files", limit: 2 }, { root, services: layers }),
      );
      expect(second.selectedFiles).toEqual(["src/a.ts", "src/b.ts"]);
      expect(second.files).toBe(2);
      // `src/a.ts` came from cache but still used one of the two slots.
      expect(second.cached).toBe(1);
      expect(second.judged).toBe(1);

      const all = await run(
        previewTrial(draft(), { kind: "all" }, { root, services: { cache: layers.cache } }),
      );
      expect(all.eligible).toBe(2);
      expect(all.selected).toBe(2);
      expect(DEFAULT_TRIAL_LIMIT).toBe(100);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps pinned files verbatim on a rerun, and refuses one no longer eligible", async () => {
    const root = await onDisk(tree());
    try {
      const { layers } = fakes({ judge: { ports: 0.9 }, locate: { ports: 3 } });
      const first = await run(
        runTrial(draft(), { kind: "files", limit: 2 }, { root, services: layers }),
      );
      const pinned = await run(
        runTrial(
          draft(),
          { kind: "files", limit: 2 },
          { root, services: layers, files: first.selectedFiles },
        ),
      );
      expect(pinned.selectedFiles).toEqual(["src/a.ts", "src/b.ts"]);
      expect(pinned.revision).toBe(first.revision);

      const changed = await run(
        runTrial(
          draft(source("A port is a branded integer, never a bare one.")),
          { kind: "files", limit: 2 },
          { root, services: layers, files: first.selectedFiles },
        ),
      );
      expect(changed.selectedFiles).toEqual(first.selectedFiles);
      expect(changed.revision).not.toBe(first.revision);

      const refused = await Effect.runPromise(
        Effect.flip(
          runTrial(
            draft(),
            { kind: "files", limit: 2 },
            { root, services: layers, files: ["src/gone.ts"] },
          ).pipe(Effect.provide(platform)),
        ),
      );
      expect(refused).toBeInstanceOf(TrialUnavailable);
      expect(refused.reason).toBe("selection");
      expect(refused.message).toContain("src/gone.ts");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("writes a report even with no findings, and never installs, prunes, or touches rules", async () => {
    const root = await onDisk(tree());
    try {
      const { layers, cache } = fakes({ judge: { ports: 0.1 }, locate: { ports: 3 } });
      const result = await run(runTrial(draft(), { kind: "all" }, { root, services: layers }));
      expect(result.findings).toEqual([]);
      const report = await reportOf(root);
      expect(report.revision).toBe(result.revision);
      const judged = report.result as { findings: ReadonlyArray<unknown> };
      expect(judged.findings).toEqual([]);

      // The project's rules are untouched, no reports directory appears, and the cache was not pruned.
      expect(await readFile(join(root, ".adhere/rules/project/RULE.md"), "utf8")).toContain(
        "A project rule.",
      );
      await expect(readFile(join(root, ".adhere/reports/report.json"), "utf8")).rejects.toThrow();
      expect(cache.prunes).toBe(0);
      expect(await readFile(join(root, ".adhere/trial/report.json"), "utf8")).toBe(
        await readFile(join(root, ".adhere/trial/ports.json"), "utf8"),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("roots the live cache at the trial checkout, not at the caller's cwd", async () => {
    const root = await onDisk(tree());
    try {
      const jev = sendingJev({ judge: { ports: 0.9 }, locate: { ports: 3 } });
      const result = await run(
        runTrial(
          draft(),
          { kind: "files", limit: 1 },
          { root, services: { jev: jev.layer, sourceReads: emptySourceReads } },
        ),
      );
      expect(result.selectedFiles).toEqual(["src/a.ts"]);
      expect((await readdir(join(root, ".adhere/cache/files"))).length).toBeGreaterThan(0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("notes a read the draft declares that this run does not enable", async () => {
    const root = await onDisk(tree());
    try {
      const { layers } = fakes({ judge: { ports: 0.9 }, locate: { ports: 3 } });
      const declaring = `---\ndescription: A port is a branded integer.\nreads: ["symbols"]\n---\n\nconst Port = Schema.Int.pipe(Schema.brand("Port"))\n`;
      const result = await run(
        runTrial(draft(declaring), { kind: "files", limit: 1 }, { root, services: layers }),
      );
      const report = await reportOf(root);
      const notes = report.notes as ReadonlyArray<string>;
      expect(notes.join("\n")).toContain(
        "The rule declares reads symbols, which this run does not enable",
      );
      // A declaration enables nothing: the trial still planned the rule compiler-free.
      expect(result.findings.map((finding) => finding.rule)).toEqual(["ports"]);
      const plan = report.plan as { rules: number };
      expect(plan.rules).toBe(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("previews without sending, writing, or caching", async () => {
    const root = await onDisk(tree());
    try {
      const { layers, cache, jev } = fakes({
        judge: { ports: 0.9 },
        locate: { ports: 3 },
      });
      const preview = await run(
        previewTrial(draft(), { kind: "all" }, { root, services: { cache: layers.cache } }),
      );
      expect(preview.requests).toBe(2);
      expect(jev.sent).toEqual([]);
      expect(cache.writes).toEqual([]);
      await expect(readFile(join(root, ".adhere/trial/ports.json"), "utf8")).rejects.toThrow();
      await expect(readFile(join(root, ".adhere/cache"), "utf8")).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
