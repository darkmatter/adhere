import type { Preset } from "#config.ts";

/**
 * `presets/` sits next to `src/` in a checkout. In a compiled executable
 * (`bun build --compile --asset ./presets`) Bun embeds it under the bundle's
 * own directory instead, hence the fork on `Bun.isStandaloneExecutable`, which
 * is the check Bun's docs give for this. Measured on Bun 1.4. The `typeof`
 * guard is for Vitest, which imports this module on Node.
 */
const presetsRoot =
  typeof Bun !== "undefined" && Bun.isStandaloneExecutable
  ? new URL("./presets/", import.meta.url)
  : new URL("../presets/", import.meta.url);

/** Built-in rule sets, each a directory of Markdown rule files in `presets/`. */
export const presets = {
  effect: { rules: new URL("effect/", presetsRoot) },
} as const satisfies Record<string, Preset>;

export const presetNames = ["effect"] as const satisfies ReadonlyArray<
  keyof typeof presets
>;
export type PresetName = (typeof presetNames)[number];
