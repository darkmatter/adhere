import packageJson from "../package.json";

/**
 * `git describe --tags --dirty --always` where `bun run build` compiled
 * this, which it defines: the release it follows, the commits since, and
 * whether the tree had changes, or the commit alone in a clone without tags.
 * A release build defines nothing.
 */
declare const ADHERE_BUILD: string;

/** Read off `globalThis`, as in `presets.ts`, for Vitest on Node and for Bun's types left out. */
const isStandaloneExecutable =
  (globalThis as { readonly Bun?: { readonly isStandaloneExecutable?: boolean } }).Bun
    ?.isStandaloneExecutable === true;

/**
 * What `--version` prints after `adhere v`: a local build's `git describe`,
 * such as `0.10.0-16-g9a41328`, so it is not taken for the release it
 * follows; a release build's version; and from source, the version the
 * checkout says, marked as such.
 */
export const version =
  typeof ADHERE_BUILD === "string" && ADHERE_BUILD !== ""
    ? ADHERE_BUILD.replace(/^v/, "")
    : isStandaloneExecutable
      ? packageJson.version
      : `${packageJson.version} (source)`;
