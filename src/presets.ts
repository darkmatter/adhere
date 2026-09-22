import type { Preset } from "#config.ts";

/** Built-in rule sets, each a directory of Markdown rule files in `presets/`. */
export const presets = {
  effect: { rules: new URL("../presets/effect/", import.meta.url) },
} as const satisfies Record<string, Preset>;

export const presetNames = ["effect"] as const satisfies ReadonlyArray<
  keyof typeof presets
>;
export type PresetName = (typeof presetNames)[number];
