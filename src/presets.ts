import { effect } from "#presets/effect.ts";

export const presets = { effect } as const;

export const presetNames = ["effect"] as const satisfies ReadonlyArray<
  keyof typeof presets
>;
export type PresetName = (typeof presetNames)[number];
