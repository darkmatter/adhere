import type { Preset } from "#config.ts";

/**
 * `presets/` sits next to `src/` in a checkout. In a compiled executable
 * (`bun build --compile --asset ./presets`) Bun embeds it under the bundle's
 * own directory instead, hence the fork on `Bun.isStandaloneExecutable`, which
 * is the check Bun's docs give for this. Measured on Bun 1.4. The `typeof`
 * guard is for Vitest, which imports this module on Node.
 */
const isStandaloneExecutable = typeof Bun !== "undefined" && Bun.isStandaloneExecutable;

const presetsRoot = isStandaloneExecutable
  ? new URL("./presets/", import.meta.url)
  : new URL("../presets/", import.meta.url);

/**
 * Built-in rule sets, each a directory of Markdown rule files in `presets/`,
 * and the topics each divides into: its subdirectories.
 */
const topics = {
  effect: ["basics", "config", "data", "errors", "services", "testing"],
  alchemy: ["apis", "data", "durable", "providers", "resources", "runtime", "secrets", "security"],
} as const;

type Topics = typeof topics;
type WholePreset = keyof Topics;

/** A whole preset, `effect`, or one of its topics, `effect/basics`. */
export type PresetName = { [P in WholePreset]: P | `${P}/${Topics[P][number]}` }[WholePreset];

export const presetNames: ReadonlyArray<PresetName> = Object.entries(topics).flatMap(
  ([preset, names]) => [preset, ...names.map((topic) => `${preset}/${topic}`)],
) as ReadonlyArray<PresetName>;

/** A built-in preset. With `topic`, only the rules under that subdirectory apply. */
export interface BuiltInPreset extends Preset {
  readonly rules: URL;
  readonly topic?: string;
}

/**
 * A topic's rules keep the ids they have in the whole preset, so
 * `effect/basics` and `effect` judge `basics/gen-for-sequencing` alike and
 * share its cached answers.
 */
export const presetOf = (name: PresetName): BuiltInPreset => {
  const [preset = name, topic] = name.split("/");
  return {
    rules: new URL(`${preset}/`, presetsRoot),
    ...(topic === undefined ? {} : { topic }),
  };
};

export const presets: Readonly<Record<WholePreset, BuiltInPreset>> = {
  effect: presetOf("effect"),
  alchemy: presetOf("alchemy"),
};

/** The directory each whole preset reads, for checking `topics` against it. */
export const topicsOf = (preset: WholePreset): ReadonlyArray<string> => topics[preset];
