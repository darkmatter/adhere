/**
 * Keeps `src/oxlint/catalog.json` in step with the pinned oxlint version.
 *
 *   bun scripts/oxlint-catalog.ts          regenerate: ask the installed oxlint
 *                                          for every rule, then fetch each
 *                                          rule's docs summary (the only
 *                                          network use)
 *   bun scripts/oxlint-catalog.ts --check  offline: prove the snapshot still
 *                                          matches the installed oxlint, is
 *                                          sorted and unique, and has a summary
 *                                          for every rule
 *
 * IDs are the ones a `.oxlintrc.json` accepts, so plugin scopes whose docs path
 * uses underscores are aliased: `jsx_a11y` is `jsx-a11y`, `react_perf` is
 * `react-perf`; eslint rules stay unprefixed. A new category or fix value in
 * oxlint also needs that schema extended in `src/oxlint/catalog.ts`.
 */
import { OxlintCatalog, OxlintCategory, OxlintFix } from "../src/oxlint/catalog.ts";
import { Schema } from "effect";
import { existsSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = join(root, "src", "oxlint", "catalog.json");
const FETCH_CONCURRENCY = 8;
const USER_AGENT = "adhere-oxlint-catalog (+https://github.com/darkmatter/adhere)";

const RawRule = Schema.Struct({
  scope: Schema.String,
  value: Schema.String,
  category: OxlintCategory,
  type_aware: Schema.Boolean,
  fix: OxlintFix,
  default: Schema.Boolean,
  docs_url: Schema.String,
});
type RawRule = typeof RawRule.Type;
const RawRules = Schema.fromJsonString(Schema.Array(RawRule));

/** Docs path segments whose spelling differs from the configuration plugin name. */
const scopeAliases: Readonly<Record<string, string>> = {
  jsx_a11y: "jsx-a11y",
  react_perf: "react-perf",
};

function oxlintExecutable(): string {
  const local = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "oxlint.cmd" : "oxlint",
  );
  if (existsSync(local)) return local;
  const onPath = Bun.which("oxlint");
  if (onPath !== null) return onPath;
  throw new Error("oxlint is not installed; run `bun install` first.");
}

async function runOxlint(...args: string[]): Promise<string> {
  const child = Bun.spawn([oxlintExecutable(), ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`oxlint ${args.join(" ")} exited ${exitCode}: ${stderr.trim()}`);
  }
  return stdout;
}

async function localCatalog(): Promise<{ version: string; rules: readonly RawRule[] }> {
  const [versionOutput, rulesOutput] = await Promise.all([
    runOxlint("--version"),
    runOxlint("--rules", "--format=json"),
  ]);
  const version = /\b\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\b/.exec(versionOutput)?.[0];
  if (version === undefined) {
    throw new Error(`Unrecognized \`oxlint --version\` output: ${versionOutput.trim()}`);
  }
  const rules = Schema.decodeUnknownSync(RawRules)(rulesOutput);
  if (rules.length === 0) throw new Error("`oxlint --rules --format=json` reported no rules.");
  return { version, rules };
}

/** The ID a `.oxlintrc.json` uses for a rule the CLI reports. */
function configId(rule: RawRule): string {
  if (rule.scope === "eslint") return rule.value;
  return `${scopeAliases[rule.scope] ?? rule.scope}/${rule.value}`;
}

const compareIds = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const namedEntities: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (entity, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return namedEntities[body.toLowerCase()] ?? entity;
  });
}

/** The first paragraph under the docs page's "What it does" heading. */
function summaryOf(html: string): string | undefined {
  const paragraph = /<h3 id="what-it-does"[^>]*>[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/.exec(
    html,
  )?.[1];
  if (paragraph === undefined) return undefined;
  const text = decodeEntities(paragraph.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0 ? undefined : text;
}

async function fetchSummary(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Fetching ${url}: HTTP ${response.status}`);
  const summary = summaryOf(await response.text());
  if (summary === undefined) throw new Error(`Fetching ${url}: no "What it does" paragraph`);
  return summary;
}

async function summariesOf(rules: readonly RawRule[]): Promise<readonly string[]> {
  const summaries = Array.from({ length: rules.length }, () => "");
  let next = 0;
  const worker = async () => {
    while (next < rules.length) {
      const index = next;
      next += 1;
      summaries[index] = await fetchSummary(rules[index]!.docs_url);
    }
  };
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, rules.length) }, worker));
  return summaries;
}

async function readCatalog(): Promise<OxlintCatalog> {
  const file = Bun.file(catalogPath);
  if (!(await file.exists())) {
    throw new Error(`${catalogPath} is missing; run \`bun run oxlint:catalog\` first.`);
  }
  try {
    return Schema.decodeUnknownSync(Schema.fromJsonString(OxlintCatalog))(await file.text());
  } catch (error) {
    throw new Error(
      `${catalogPath} does not decode: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function regenerate(): Promise<void> {
  const { version, rules: live } = await localCatalog();
  const sorted = [...live].sort((left, right) => compareIds(configId(left), configId(right)));
  const ids = sorted.map(configId);
  const repeated = ids.find((id, index) => index > 0 && ids[index - 1] === id);
  if (repeated !== undefined) throw new Error(`oxlint reports ${repeated} twice.`);

  console.log(
    `Fetching ${sorted.length} rule summaries from oxc.rs (concurrency ${FETCH_CONCURRENCY})…`,
  );
  const summaries = await summariesOf(sorted);
  const rules = sorted.map((rule, index) => ({
    id: configId(rule),
    category: rule.category,
    typeAware: rule.type_aware,
    fix: rule.fix,
    default: rule.default,
    docsUrl: rule.docs_url,
    summary: summaries[index]!,
  }));
  const catalog: OxlintCatalog = { version, rules };

  await mkdir(dirname(catalogPath), { recursive: true });
  const temporary = `${catalogPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`);
  await rename(temporary, catalogPath);
  console.log(`Wrote ${catalogPath} (${rules.length} rules from oxlint ${version}).`);
}

async function check(): Promise<void> {
  const catalog = await readCatalog();
  const { version, rules: live } = await localCatalog();
  const problems: string[] = [];

  if (catalog.version !== version) {
    problems.push(`catalog version is ${catalog.version}, but the installed oxlint is ${version}`);
  }

  const snapshot = new Map(catalog.rules.map((rule) => [rule.id, rule] as const));
  if (snapshot.size !== catalog.rules.length) problems.push("catalog repeats a rule ID");
  for (const rule of catalog.rules) {
    if (rule.summary.trim().length === 0) problems.push(`${rule.id} has no summary`);
  }

  const expected = new Set<string>();
  for (const rule of live) {
    const id = configId(rule);
    expected.add(id);
    const saved = snapshot.get(id);
    if (saved === undefined) {
      problems.push(`catalog is missing ${id}`);
      continue;
    }
    const fields = [
      ["category", rule.category, saved.category],
      ["typeAware", rule.type_aware, saved.typeAware],
      ["fix", rule.fix, saved.fix],
      ["default", rule.default, saved.default],
      ["docsUrl", rule.docs_url, saved.docsUrl],
    ] as const;
    for (const [field, reported, stored] of fields) {
      if (reported !== stored) {
        problems.push(
          `${id} ${field} is ${JSON.stringify(stored)}, but oxlint ${version} reports ${JSON.stringify(reported)}`,
        );
      }
    }
  }

  for (const id of snapshot.keys()) {
    if (!expected.has(id)) problems.push(`catalog lists ${id}, which oxlint ${version} does not`);
  }

  const ids = catalog.rules.map((rule) => rule.id);
  for (let index = 1; index < ids.length; index += 1) {
    if (compareIds(ids[index - 1]!, ids[index]!) >= 0) {
      problems.push("catalog rules are not sorted by ID");
      break;
    }
  }

  if (problems.length > 0) {
    const shown = problems
      .slice(0, 25)
      .map((problem) => `  - ${problem}`)
      .join("\n");
    const more = problems.length > 25 ? `\n  … ${problems.length - 25} more problem(s)` : "";
    throw new Error(
      `The oxlint catalog is stale (${problems.length} problem(s)):\n${shown}${more}\n\nRun \`bun run oxlint:catalog\` and commit src/oxlint/catalog.json.`,
    );
  }

  console.log(
    `The oxlint catalog is current: ${catalog.rules.length} rules from oxlint ${version}.`,
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    console.error("usage: bun scripts/oxlint-catalog.ts [--check]");
    process.exit(1);
  }
  await (args[0] === "--check" ? check() : regenerate());
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
