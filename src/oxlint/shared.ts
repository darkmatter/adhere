/**
 * The files a shared rules repo checks its lintable rules with. `lint/index.js`
 * is plain ESM and reads `lint/rules.json`, so a consumer needs no Vite+ or
 * other package at runtime, only the shared repo as a git dependency.
 */

/** Where a shared repo keeps its lint package. */
export const SHARED_LINT_DIRECTORY = "lint";

/** The package export a consumer imports: `@org/repo/lint`. */
export const SHARED_LINT_EXPORT = "./lint";

/** `lint/index.js`, the module behind the export. */
export const SHARED_LINT_ENTRY = "./lint/index.js";

/** The declarations beside it, so a TypeScript config can import the export. */
export const SHARED_LINT_TYPES = `${SHARED_LINT_DIRECTORY}/index.d.ts`;

/** The Oxlint-shaped settings the repo's rules and plugins are enabled in. */
export const SHARED_LINT_RULES = `${SHARED_LINT_DIRECTORY}/rules.json`;

/** No rule or plugin is enabled until one is added. */
export const SHARED_LINT_RULES_JSON = "{}\n";

/** The package name consumers import: npm names are lowercase, though org/repo may not be. */
export const sharedPackageName = (org: string, repo: string) =>
  `@${org.toLowerCase()}/${repo.toLowerCase()}`;

/**
 * The shared repo's package.json. alchemy's CLI runs on effect and its Node
 * platform, which are pinned, as is the platform's own dependency, since a
 * range of prereleases takes the newest: effect 4.0.0-rc.118 moved modules
 * alchemy 2.0.0-beta.79 imports (checked 2026-09-28). Only `./lint` is
 * exported; the alchemy stack is a development dependency, not a runtime one.
 */
export const sharedPackageJson = (org: string, repo: string) =>
  `${JSON.stringify(
    {
      name: sharedPackageName(org, repo),
      private: true,
      type: "module",
      files: [SHARED_LINT_DIRECTORY],
      exports: { [SHARED_LINT_EXPORT]: SHARED_LINT_ENTRY },
      devDependencies: {
        "@effect/platform-node": "4.0.0-rc.117",
        alchemy: "2.0.0-beta.79",
        effect: "4.0.0-rc.117",
      },
      overrides: { "@effect/platform-node-shared": "4.0.0-rc.117" },
    },
    null,
    2,
  )}\n`;

/**
 * Reads `rules.json` beside itself, so a checkout, a git dependency, and a
 * consumer's config all see the same file. A plugin path that starts with `.`
 * names a file in `lint/` and becomes absolute, since Oxlint resolves a
 * relative plugin path against the consumer's config, not this package.
 */
export const SHARED_LINT_INDEX = `import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const settings = JSON.parse(readFileSync(new URL("./rules.json", import.meta.url), "utf8"));

const resolvePlugin = (entry) => {
  if (typeof entry !== "string") {
    return entry.specifier.startsWith(".")
      ? { ...entry, specifier: fileURLToPath(new URL(entry.specifier, import.meta.url)) }
      : entry;
  }
  return entry.startsWith(".") ? fileURLToPath(new URL(entry, import.meta.url)) : entry;
};

export const plugins = settings.plugins;
export const jsPlugins = (settings.jsPlugins ?? []).map(resolvePlugin);
export const rules = settings.rules ?? {};
export const options = settings.options;

// Leaving plugins out keeps oxlint's base set; [] replaces it.
export default {
  ...(plugins === undefined ? {} : { plugins }),
  jsPlugins,
  rules,
  ...(options === undefined ? {} : { options }),
};
`;

/** The same export, typed for the TypeScript config that imports it. */
export const SHARED_LINT_TYPES_SOURCE = `/** A built-in Oxlint plugin, as its plugins setting names them. */
export type SharedPluginName =
  | "eslint"
  | "react"
  | "unicorn"
  | "typescript"
  | "oxc"
  | "import"
  | "jsdoc"
  | "jest"
  | "vitest"
  | "jsx-a11y"
  | "nextjs"
  | "react-perf"
  | "promise"
  | "node"
  | "vue";

/** An Oxlint rule severity. */
export type SharedRuleLevel = "allow" | "off" | "warn" | "error" | "deny" | number;

/** A JS plugin path, or a package specifier under a name. */
export type SharedPlugin = string | { name: string; specifier: string };

/** The linter options the generated package supports. */
export interface SharedLintOptions {
  denyWarnings?: boolean;
  maxWarnings?: number;
  reportUnusedDisableDirectives?: SharedRuleLevel;
  respectEslintDisableDirectives?: boolean;
  typeAware?: boolean;
  typeCheck?: boolean;
}

/** The Oxlint settings the generated package exposes. */
export interface SharedLintConfig {
  plugins?: SharedPluginName[];
  jsPlugins: SharedPlugin[];
  rules: Record<string, SharedRuleLevel>;
  options?: SharedLintOptions;
}

export const plugins: SharedPluginName[] | undefined;
export const jsPlugins: SharedPlugin[];
export const rules: Record<string, SharedRuleLevel>;
export const options: SharedLintOptions | undefined;

declare const config: SharedLintConfig;
export default config;
`;
