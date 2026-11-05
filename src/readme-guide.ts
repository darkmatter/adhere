/**
 * The managed guide in a shared repo's README: a contents list, its
 * `.adhere/rules/` grouped by topic with each rule's statement and its own
 * examples, the native Oxlint rules its `oxlint/rules.json` enables, and the
 * rules its custom Oxlint plugins add.
 *
 * A RULE.md body is embedded by editing what Markdown makes of it: heading
 * markers are demoted and anchored, and link, image, and reference definition
 * targets are rebased. Every other byte stays as the rule wrote it, so code,
 * HTML, entities, and list and paragraph layout are untouched.
 */
import { oxlintRule } from "#oxlint/catalog.ts";
import { SHARED_LINT_DIRECTORY, SHARED_LINT_RULES } from "#oxlint/shared.ts";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { Definition, Heading, Image, Link, Nodes } from "mdast";

/** A rule as the guide shows it: its description, and the body a RULE.md embeds. */
export interface ReadmeRule {
  readonly id: string;
  readonly name: "RULE.md" | "RULE.ts";
  readonly description: string;
  /** A RULE.md's Markdown after its front matter; absent for a RULE.ts, which is never read. */
  readonly body?: string;
}

/** The lint settings an index reads: enabled rules and configured plugin entries. */
export interface LintConfig {
  readonly rules?: Readonly<Record<string, unknown>>;
  readonly jsPlugins?: ReadonlyArray<unknown>;
}

const OFF = new Set<unknown>(["off", "allow", "0", 0]);

/** The severity a rule setting turns on, or undefined when it is off. */
const levelOf = (setting: unknown): "error" | "warn" | "on" | undefined => {
  const level = Array.isArray(setting) ? setting[0] : setting;
  if (OFF.has(level)) return undefined;
  if (level === "error" || level === 2) return "error";
  if (level === "warn" || level === 1) return "warn";
  return "on";
};

const enabledAs = (setting: unknown): string => {
  const level = levelOf(setting);
  return level === "on" || level === undefined ? "enabled" : `enabled as \`${level}\``;
};

/** A plugin entry's name and specifier: `{ name, specifier }` or a bare specifier. */
const pluginsIn = (config: LintConfig): ReadonlyMap<string, string | undefined> => {
  const plugins = new Map<string, string | undefined>();
  for (const entry of config.jsPlugins ?? []) {
    if (typeof entry === "string") {
      const base = entry.split("/").at(-1) ?? entry;
      plugins.set(base.replace(/\.(?:mjs|cjs|js)$/, ""), entry);
    } else if (
      typeof entry === "object" &&
      entry !== null &&
      "name" in entry &&
      typeof entry.name === "string"
    ) {
      plugins.set(
        entry.name,
        "specifier" in entry && typeof entry.specifier === "string" ? entry.specifier : undefined,
      );
    }
  }
  return plugins;
};

/** An `oxlint/rules.json` plugin path as a link from the README, or undefined when it is a package. */
const pluginLink = (specifier: string | undefined): string | undefined => {
  if (specifier === undefined || !specifier.startsWith("./") || specifier.includes("..")) {
    return undefined;
  }
  return `./${SHARED_LINT_DIRECTORY}/${specifier.slice(2)}`;
};

const link = (label: string, target: string | undefined) =>
  target === undefined ? `\`${label}\`` : `[\`${label}\`](${target})`;

/** One line per enabled lint setting; a rule with an off setting does nothing. */
export const lintEntries = (config: LintConfig) => {
  const plugins = pluginsIn(config);
  const native: Array<string> = [];
  const custom: Array<string> = [];
  for (const id of Object.keys(config.rules ?? {}).sort()) {
    const setting = config.rules?.[id];
    const level = levelOf(setting);
    if (level === undefined) continue;
    const plugin = id.includes("/") ? id.slice(0, id.indexOf("/")) : undefined;
    const specifier = plugin === undefined ? undefined : plugins.get(plugin);
    if (plugin !== undefined && specifier !== undefined) {
      custom.push(
        `- ${link(id, pluginLink(specifier))}: custom plugin \`${plugin}\`, ${enabledAs(setting)}.`,
      );
      continue;
    }
    const summary = (oxlintRule(id)?.summary ?? "").replace(/\s+/g, " ").trim();
    native.push(
      summary === ""
        ? `- ${link(id, `./${SHARED_LINT_RULES}`)}: ${enabledAs(setting)}.`
        : `- ${link(id, `./${SHARED_LINT_RULES}`)}: ${summary} (${enabledAs(setting)}).`,
    );
  }
  return { native, custom };
};

/**
 * The block's own anchors. Each is explicit rather than GitHub's heading slug,
 * and prefixed, so an author's heading cannot claim one.
 */
const CONTENTS_ANCHOR = "adhere-contents";
const RULES_ANCHOR = "adhere-rules";
const LINT_SETTINGS_ANCHOR = "adhere-lint-settings";
const PLUGINS_ANCHOR = "adhere-custom-lint-plugins";

/** The topic of a rule whose id is one segment, with no topic directory. */
const OTHER_TOPIC = "Other";

const backToContents = `**[↑ Back to contents](#${CONTENTS_ANCHOR})**`;

/** An id, topic, or heading as part of an anchor: lowercase, hyphenated. */
const slugOf = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "");

/** The anchor for `key`, numbered when an earlier one slugs the same. */
const uniqueAnchor = (used: Set<string>, prefix: string, key: string): string => {
  const base = `${prefix}-${slugOf(key)}`;
  let anchor = base;
  for (let number = 2; used.has(anchor); number += 1) anchor = `${base}-${number}`;
  used.add(anchor);
  return anchor;
};

/** A rule and the anchor its entry answers to. */
interface IndexRule {
  readonly rule: ReadmeRule;
  readonly anchor: string;
}

/** A rule's first id segment, its rules sorted by id. */
interface Topic {
  readonly name: string;
  readonly anchor: string;
  readonly rules: ReadonlyArray<IndexRule>;
}

/** The topics, and every anchor the block has emitted so far. */
interface Grouping {
  readonly topics: ReadonlyArray<Topic>;
  /** Shared with the headings each rule's body adds, so no two anchors collide. */
  readonly used: Set<string>;
}

/**
 * Rules by topic, topics by name, each with its anchor: the same set of rules
 * always groups and orders the same way.
 */
const topicsOf = (rules: ReadonlyArray<ReadmeRule>): Grouping => {
  const used = new Set<string>();
  const groups = new Map<string, { name: string; anchor: string; rules: Array<IndexRule> }>();
  for (const rule of [...rules].sort((a, b) => a.id.localeCompare(b.id))) {
    const cut = rule.id.indexOf("/");
    const name = cut === -1 ? OTHER_TOPIC : rule.id.slice(0, cut);
    let group = groups.get(name);
    if (group === undefined) {
      group = { name, anchor: uniqueAnchor(used, "adhere-topic", name), rules: [] };
      groups.set(name, group);
    }
    group.rules.push({ rule, anchor: uniqueAnchor(used, "adhere-rule", rule.id) });
  }
  return { topics: [...groups.values()].sort((a, b) => a.name.localeCompare(b.name)), used };
};

/** A description as `<summary>` reads it: Markdown does not run in raw HTML, so code spans become tags. */
const summaryText = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

/** A heading's text as GitHub anchors it, for the fragment a rule's body links to. */
const headingSlug = (text: string): string =>
  text
    .replace(/<[^>]+>/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]/gu, "")
    .replace(/ /g, "-");

/** A target written inside a rule's file, as a link from the README. */
const rebase = (source: string, target: string, byHeading: ReadonlyMap<string, string>): string => {
  if (target.startsWith("<") || target.startsWith("/")) return target;
  if (target.startsWith("#")) {
    const anchor = byHeading.get(target.slice(1).toLowerCase());
    // Not a heading the body spells: the fragment is still the rule file's to answer.
    return anchor === undefined ? `${source}${target}` : `#${anchor}`;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return target;
  const directory = source.slice(0, source.lastIndexOf("/") + 1);
  return `${directory}${target.startsWith("./") ? target.slice(2) : target}`;
};

/** A parsed node's point: mdast records columns, and offsets in the parsed text. */
interface MarkdownPoint {
  readonly line: number;
  readonly column: number;
  readonly offset?: number | undefined;
}

const offsetOf = (
  point: MarkdownPoint | undefined,
  starts: ReadonlyArray<number>,
): number | undefined =>
  point === undefined
    ? undefined
    : (point.offset ?? (starts[point.line - 1] ?? 0) + point.column - 1);

/** Where each line of `text` starts. */
const lineStartsOf = (text: string): Array<number> => {
  const starts = [0];
  for (let at = text.indexOf("\n"); at !== -1; at = text.indexOf("\n", at + 1)) starts.push(at + 1);
  return starts;
};

/** Every node of a tree, the tree first. */
const each = (node: Nodes, visit: (node: Nodes) => void): void => {
  visit(node);
  if ("children" in node) for (const child of node.children) each(child, visit);
};

/** Text as GitHub slugs a heading: code values, link text, and image alt. */
const textOf = (node: Nodes): string => {
  if (node.type === "image" || node.type === "imageReference") return node.alt ?? "";
  if ("value" in node && typeof node.value === "string") return node.value;
  return "children" in node ? node.children.map(textOf).join("") : "";
};

/** Where a link, image, or definition's target sits, when the source spells it verbatim. */
const targetRange = (
  body: string,
  node: Link | Image | Definition,
  target: string,
  starts: ReadonlyArray<number>,
): { start: number; end: number } | undefined => {
  const start = offsetOf(node.position?.start, starts);
  const end = offsetOf(node.position?.end, starts);
  if (start === undefined || end === undefined) return undefined;
  const raw = body.slice(start, end);
  const opener = raw.indexOf(node.type === "definition" ? "]:" : "](");
  const at = opener === -1 ? -1 : raw.indexOf(target, opener + 2);
  return at === -1 ? undefined : { start: start + at, end: start + at + target.length };
};

/** The anchor and blank line that introduce a demoted heading, indented to match it. */
const anchorBlock = (body: string, lineStart: number, anchor: string): string => {
  const previous =
    lineStart === 0 ? "" : body.slice(body.lastIndexOf("\n", lineStart - 2) + 1, lineStart - 1);
  // At column 0 the anchor would end the list item an indented heading belongs to.
  const indent = /^ */.exec(body.slice(lineStart, lineStart + 3))?.[0] ?? "";
  return `${previous.trim() === "" ? "" : "\n"}${indent}<a id="${anchor}"></a>\n\n`;
};

/**
 * A RULE.md's body as the guide shows it: headings demoted under their topic,
 * each with an `adhere-heading-` anchor of its own, and link, image, and
 * reference definition targets rebased from the rule's directory onto the
 * README. A `#fragment` naming one of the body's headings resolves by the
 * source name GitHub gives it (`#must`, then `#must-1`), since a heading like
 * `Must` repeats; any other fragment becomes a link into the rule's file.
 * Everything else stays as the rule wrote it: fenced and indented code, inline
 * code, HTML, entities, and list layout are all left untouched. The one thing
 * added is a closing fence when the body ends inside one, since the guide
 * embeds it at the top level of the README and the fence would run on through
 * `Source:`, the later rules, and the author's own sections.
 */
const embedBody = (source: string, anchor: string, body: string, used: Set<string>): string => {
  const prefix = anchor.replace("adhere-rule-", "adhere-heading-");
  const starts = lineStartsOf(body);
  const headings: Array<Heading> = [];
  const resources: Array<Link | Image | Definition> = [];
  const tree = fromMarkdown(body);
  each(tree, (node) => {
    if (node.type === "heading") headings.push(node);
    else if (node.type === "link" || node.type === "image" || node.type === "definition") {
      resources.push(node);
    }
  });
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const byHeading = new Map<string, string>();
  const repeats = new Map<string, number>();
  for (const heading of headings) {
    const start = offsetOf(heading.position?.start, starts);
    if (start === undefined) continue;
    const lineStart = body.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = body.indexOf("\n", lineStart);
    const line = body.slice(lineStart, lineEnd === -1 ? body.length : lineEnd);
    const marker = /^ {0,3}(#{1,6})(?:[ \t]|$)/.exec(line);
    // A setext heading is left as written: the guide only demotes ATX ones.
    if (marker === null) continue;
    const slug = headingSlug(textOf(heading));
    const repeat = repeats.get(slug) ?? 0;
    repeats.set(slug, repeat + 1);
    const at = uniqueAnchor(used, prefix, slug);
    // GitHub numbers a repeated heading from `-1`, and a rule's links name that.
    const named = repeat === 0 ? slug : `${slug}-${repeat}`;
    if (!byHeading.has(named)) byHeading.set(named, at);
    const hashStart = lineStart + marker[0].indexOf("#");
    edits.push({ start: lineStart, end: lineStart, text: anchorBlock(body, lineStart, at) });
    edits.push({
      start: hashStart,
      end: hashStart + (marker[1] ?? "#").length,
      text: "#".repeat(Math.min(6, heading.depth + 3)),
    });
  }
  for (const node of resources) {
    const target = node.url;
    if (target === "") continue;
    const rewritten = rebase(source, target, byHeading);
    if (rewritten === target) continue;
    const range = targetRange(body, node, target, starts);
    // A target the source escapes or encodes away from its parsed form stays as written.
    if (range === undefined) continue;
    edits.push({ ...range, text: rewritten });
  }
  let edited = body;
  let limit = Number.POSITIVE_INFINITY;
  for (const edit of [...edits].sort((a, b) => b.start - a.start || b.end - a.end)) {
    if (edit.end > limit) continue;
    edited = `${edited.slice(0, edit.start)}${edit.text}${edited.slice(edit.end)}`;
    limit = edit.start;
  }
  // A fence left open at the end would swallow everything the README says after it.
  const last = tree.children.at(-1);
  const tail =
    last?.type === "code" ? body.slice(offsetOf(last.position?.start, starts) ?? 0).trimEnd() : "";
  const fence = /^ {0,3}(`{3,}|~{3,})/.exec(tail)?.[1];
  if (fence === undefined) return edited;
  const closing = tail.split("\n").at(-1)?.trim() ?? "";
  const closed = tail.includes("\n") && closing.startsWith(fence) && /^(`+|~+)$/.test(closing);
  return closed ? edited : `${edited}\n${fence}`;
};

/** One rule's expandable entry: its statement, its body, and the file it came from. */
const ruleEntry = (rule: ReadmeRule, anchor: string, used: Set<string>): ReadonlyArray<string> => {
  const source = `./.adhere/rules/${rule.id}/${rule.name}`;
  const label = `<code>${summaryText(rule.id)}</code>`;
  const statement = summaryText(rule.description.replace(/\s+/g, " ").trim());
  // Only the blank line after the front matter goes: body bytes stay as written.
  const body = (rule.body ?? "").replace(/^\n+/, "").trimEnd();
  return [
    `<a id="${anchor}"></a>`,
    "",
    "<details>",
    `<summary><h3>${label}</h3></summary>`,
    "",
    ...(rule.name === "RULE.ts"
      ? [
          `This rule is TypeScript, so the guide does not read or run it: [\`${rule.id}\`](${source}).`,
        ]
      : [
          statement,
          "",
          ...(body === "" ? [] : [embedBody(source, anchor, body, used), ""]),
          `Source: [\`${rule.id}\`](${source}).`,
        ]),
    "",
    "</details>",
  ];
};

/**
 * The managed block's body: section links, rules as expandable entries, then
 * the lint settings and plugins. Rules sort by id and topics by name, so the
 * same checkout always writes the same text.
 */
export const renderReadmeIndex = (rules: ReadonlyArray<ReadmeRule>, config: LintConfig): string => {
  const entries = lintEntries(config);
  const { topics, used } = topicsOf(rules);
  const contents = [
    `- [Rules](#${RULES_ANCHOR})`,
    `- [Lint settings](#${LINT_SETTINGS_ANCHOR})`,
    `- [Custom lint plugins](#${PLUGINS_ANCHOR})`,
  ];
  const body =
    topics.length === 0
      ? ["- None.", ""]
      : topics.flatMap(({ anchor, rules: group }) => [
          `<a id="${anchor}"></a>`,
          "",
          ...group.flatMap(({ rule, anchor: at }) => [...ruleEntry(rule, at, used), ""]),
          "",
        ]);
  return [
    `<a id="${CONTENTS_ANCHOR}"></a>`,
    "",
    "### Contents",
    "",
    ...contents,
    "",
    `<a id="${RULES_ANCHOR}"></a>`,
    "",
    "## Rules",
    "",
    ...body,
    `<a id="${LINT_SETTINGS_ANCHOR}"></a>`,
    "",
    "### Lint settings",
    "",
    ...(entries.native.length === 0 ? ["- None."] : entries.native),
    "",
    `<a id="${PLUGINS_ANCHOR}"></a>`,
    "",
    "### Custom lint plugins",
    "",
    ...(entries.custom.length === 0 ? ["- None."] : entries.custom),
    "",
    backToContents,
  ].join("\n");
};
