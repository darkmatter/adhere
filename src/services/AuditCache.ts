import { CACHE_DIRECTORY } from "#config.ts";
import { Context, Crypto, Effect, FileSystem, Layer, Option, Path, Record, Schema } from "effect";

/** A rule's judgment as a run holds it: Jev's answer, with the fingerprint of the rule's text. */
export const Judgment = Schema.Struct({
  fingerprint: Schema.String,
  probability: Schema.Finite,
  line: Schema.optionalKey(Schema.Finite),
});
export interface Judgment extends Schema.Schema.Type<typeof Judgment> {}

/**
 * An entry as adhere wrote it before the cache was keyed by content: one per
 * file, under the hash of the file's absolute path. Read only to carry its
 * judgments over. Entries written before the report read its excerpt from the
 * file also hold the line's text, as `snippet`; decoding drops it.
 */
export const CacheEntry = Schema.Struct({
  hash: Schema.String,
  judgments: Schema.Record(Schema.String, Judgment),
});
export interface CacheEntry extends Schema.Schema.Type<typeof CacheEntry> {}

/** Jev's answer about some code for one rule text: the probability, and the line once located. */
export const Answer = Schema.Struct({
  probability: Schema.Finite,
  line: Schema.optionalKey(Schema.Finite),
});
export interface Answer extends Schema.Schema.Type<typeof Answer> {}

/** Answers about one file's content, each under the fingerprint of the rule text it answers. */
export type Answers = Readonly<Record<string, Answer>>;

const Entry = Schema.Struct({ answers: Schema.Record(Schema.String, Answer) });
const decodeEntry = Schema.decodeUnknownOption(Schema.fromJsonString(Entry));
const decodeOldEntry = Schema.decodeUnknownOption(Schema.fromJsonString(CacheEntry));

/**
 * A rule's linter check so far: per file lint asked it on, Jev's probability
 * that a regular linter could have decided the file against the rule.
 */
export const Tally = Schema.Struct({
  files: Schema.Record(Schema.String, Schema.Finite),
});
export interface Tally extends Schema.Schema.Type<typeof Tally> {}
const decodeTally = Schema.decodeUnknownOption(Schema.fromJsonString(Tally));

/** What a run that read every file tells the cache. */
export interface Live {
  /** The hash of each file's content, too long to judge or not. */
  readonly hashes: ReadonlySet<string>;
  /** The key of each of the run's rules' tallies, to carry over from the layout before content keys. */
  readonly tallies: ReadonlySet<string>;
}

const hexOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const sha256 = Effect.fn("AuditCache.sha256")(function* (text: string) {
  const crypto = yield* Crypto.Crypto;
  const digest = yield* crypto.digest("SHA-256", new TextEncoder().encode(text)).pipe(Effect.orDie);
  return hexOf(digest);
});

/** Judgments by rule, as the answers the cache keeps: by the fingerprint of each rule's text. */
export const answersOf = (judgments: Readonly<Record<string, Judgment>>): Answers =>
  Object.fromEntries(
    Object.values(judgments).map(({ fingerprint, ...answer }) => [fingerprint, answer]),
  );

export class AuditCache extends Context.Service<
  AuditCache,
  {
    /**
     * Answers about content with this hash. `path` is where that content is
     * now, to carry over an entry written before the cache was keyed by content.
     */
    readonly get: (hash: string, path: string) => Effect.Effect<Answers>;
    /** Keeps answers about content with this hash, beside the ones already kept. */
    readonly put: (hash: string, answers: Answers) => Effect.Effect<void>;
    /** A rule's tally, under a key that changes with the rule's text. */
    readonly tally: (key: string) => Effect.Effect<Tally | undefined>;
    readonly putTally: (key: string, tally: Tally) => Effect.Effect<void>;
    /**
     * Deletes the answers about content no file has, and folds the rest into
     * one file per content and per tally. Answers to rules the run left out
     * stay, as do their tallies: a run with other presets or rules asks them.
     * Only after a run that read every file: it cannot tell what content the
     * files it did not read have. Succeeds with the files deleted.
     */
    readonly prune: (live: Live) => Effect.Effect<number>;
  }
>()("@drkmttr/adhere/services/AuditCache") {}

/** Keys in order, so the same content always writes the same text. */
const sorted = <A>(record: Readonly<Record<string, A>>): Record<string, A> =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const textOf = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/** One answer per rule text: one that has its line over one that has not, otherwise the first. */
const unionOf = (entries: ReadonlyArray<Answers>): Answers => {
  const union: Record<string, Answer> = {};
  for (const answers of entries) {
    for (const [fingerprint, answer] of Object.entries(answers)) {
      const held = union[fingerprint];
      if (held === undefined || (held.line === undefined && answer.line !== undefined)) {
        union[fingerprint] = answer;
      }
    }
  }
  return union;
};

/** One answer per file, the first. */
const tallyUnionOf = (tallies: ReadonlyArray<Tally>): Tally => {
  const files: Record<string, number> = {};
  for (const tally of tallies) {
    for (const [file, probability] of Object.entries(tally.files)) files[file] ??= probability;
  }
  return { files };
};

/** A group's file: the group, then the hash of the file's text. */
const NAME = /^([^.]+)\.[0-9a-f]{16}\.json$/;
/** A file from the layout before content keys: the hash of a path or of a tally's key. */
const OLD_NAME = /^[0-9a-f]{64}$/;

/**
 * `.adhere/cache/`, which is meant to be committed. `files/` holds answers by
 * the content they are about, and `tallies/` the linter check's tallies, with
 * paths from the working directory. A file is written once and never
 * rewritten: it is named for its group, a content hash or a tally key, and for
 * the hash of its own text. Two branches that add to a group add different
 * files, or the same one, so git merges them without a conflict. Reading a
 * group takes the union of its files, and pruning folds them back into one.
 *
 * A cache must never fail a run: whatever cannot be read counts as missing,
 * and whatever cannot be written is left unwritten.
 */
export const AuditCacheLive = Layer.effect(AuditCache)(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const crypto = yield* Crypto.Crypto;
    const root = path.resolve();
    const directory = path.join(root, CACHE_DIRECTORY);
    const hash = (text: string) => sha256(text).pipe(Effect.provideService(Crypto.Crypto, crypto));

    /** Each group's file names in one folder, listed once and kept current as files come and go. */
    const indexOf = (folder: string) =>
      Effect.cached(
        fs.readDirectory(path.join(directory, folder)).pipe(
          Effect.orElseSucceed((): ReadonlyArray<string> => []),
          Effect.map((names) => {
            const groups = new Map<string, Set<string>>();
            for (const name of names) {
              const group = NAME.exec(name)?.[1];
              if (group !== undefined)
                groups.set(group, (groups.get(group) ?? new Set()).add(name));
            }
            return groups;
          }),
        ),
      );
    const indexes = { files: yield* indexOf("files"), tallies: yield* indexOf("tallies") };
    type Folder = keyof typeof indexes;

    const read = <A>(decode: (text: string) => Option.Option<A>, file: string) =>
      fs.readFileString(file).pipe(
        Effect.map((text) => Option.getOrUndefined(decode(text))),
        Effect.orElseSucceed(() => undefined),
      );

    /** A group's files that decode, in name order. */
    const readGroup = Effect.fn("AuditCache.readGroup")(function* <A>(
      folder: Folder,
      group: string,
      decode: (text: string) => Option.Option<A>,
    ) {
      const names = [...((yield* indexes[folder]).get(group) ?? [])].sort();
      const decoded = yield* Effect.forEach(names, (name) =>
        read(decode, path.join(directory, folder, name)),
      );
      return decoded.filter((value): value is A => value !== undefined);
    });

    const nameOf = (group: string, text: string) =>
      Effect.map(hash(text), (digest) => `${group}.${digest.slice(0, 16)}.json`);

    /** Adds `value` to a group as a new file, unless the group has that file already. */
    const add = Effect.fn("AuditCache.add")(function* (
      folder: Folder,
      group: string,
      value: unknown,
    ) {
      const text = textOf(value);
      const name = yield* nameOf(group, text);
      const index = yield* indexes[folder];
      const names = index.get(group) ?? new Set<string>();
      if (names.has(name)) return;
      const written = yield* fs
        .makeDirectory(path.join(directory, folder), { recursive: true })
        .pipe(
          Effect.andThen(fs.writeFileString(path.join(directory, folder, name), text)),
          Effect.as(true),
          Effect.orElseSucceed(() => false),
        );
      if (written) index.set(group, names.add(name));
    });

    const remove = (file: string) =>
      fs.remove(file).pipe(
        Effect.as(1),
        Effect.orElseSucceed(() => 0),
      );

    /** Replaces a group's files with one holding `value`, or with none. Succeeds with the files deleted. */
    const fold = Effect.fn("AuditCache.fold")(function* (
      folder: Folder,
      group: string,
      value: unknown,
    ) {
      const index = yield* indexes[folder];
      const names = [...(index.get(group) ?? [])];
      const keep = value === undefined ? undefined : yield* nameOf(group, textOf(value));
      if (value !== undefined) yield* add(folder, group, value);
      let deleted = 0;
      for (const name of names) {
        if (name !== keep) deleted += yield* remove(path.join(directory, folder, name));
      }
      if (keep === undefined) index.delete(group);
      else index.set(group, new Set([keep]));
      return deleted;
    });

    const relativeOf = (tally: Tally): Tally => ({
      files: sorted(
        Record.mapKeys(tally.files, (file) =>
          path.isAbsolute(file) ? path.relative(root, file) : file,
        ),
      ),
    });

    const get = Effect.fn("AuditCache.get")(function* (contentHash: string, filePath: string) {
      const entries = yield* readGroup("files", contentHash, decodeEntry);
      if (entries.length > 0) return unionOf(entries.map((entry) => entry.answers));
      // Before content keys, a file's entry sat under the hash of its absolute path.
      const old = yield* read(decodeOldEntry, path.join(directory, yield* hash(filePath)));
      if (old === undefined || old.hash !== contentHash) return {};
      const answers = answersOf(old.judgments);
      yield* add("files", contentHash, { answers: sorted(answers) });
      return answers;
    });

    const tally = Effect.fn("AuditCache.tally")(function* (key: string) {
      const tallies = yield* readGroup("tallies", key, decodeTally);
      if (tallies.length > 0) {
        const { files } = tallyUnionOf(tallies);
        return { files: Record.mapKeys(files, (file) => path.resolve(root, file)) };
      }
      // Before, a tally sat under the hash of its key, with absolute paths.
      const old = yield* read(
        decodeTally,
        path.join(directory, yield* hash(`\u0000tally\u0000${key}`)),
      );
      if (old !== undefined) yield* add("tallies", key, relativeOf(old));
      return old;
    });

    const prune = Effect.fn("AuditCache.prune")(function* (live: Live) {
      // Tallies still in the layout before content keys move first, so deleting what is left of it loses nothing.
      yield* Effect.forEach(live.tallies, tally, { discard: true });
      let deleted = 0;
      // Folding replaces or removes the group being visited, which a Map's iteration allows.
      for (const group of (yield* indexes.files).keys()) {
        const entries = live.hashes.has(group) ? yield* readGroup("files", group, decodeEntry) : [];
        const answers = unionOf(entries.map((entry) => entry.answers));
        deleted += yield* fold(
          "files",
          group,
          Object.keys(answers).length === 0 ? undefined : { answers: sorted(answers) },
        );
      }
      for (const key of (yield* indexes.tallies).keys()) {
        const tallies = yield* readGroup("tallies", key, decodeTally);
        deleted += yield* fold(
          "tallies",
          key,
          tallies.length === 0 ? undefined : relativeOf(tallyUnionOf(tallies)),
        );
      }
      const old = yield* fs.readDirectory(directory).pipe(Effect.orElseSucceed(() => []));
      for (const name of old) {
        if (OLD_NAME.test(name)) deleted += yield* remove(path.join(directory, name));
      }
      return deleted;
    });

    return AuditCache.of({
      get,
      put: (contentHash, answers) => add("files", contentHash, { answers: sorted(answers) }),
      tally,
      putTally: (key, value) => add("tallies", key, relativeOf(value)),
      prune,
    });
  }),
);
