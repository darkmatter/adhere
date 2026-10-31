/** Bun-only checks for `adhere rules create`, run as a subprocess by create-agent.test.ts. */
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import { Candidates, PluginDraft, Shape } from "../../src/create/ask.ts";
import {
  enabledNative,
  nativeSetting,
  pluginProblems,
  pluginSnippet,
  projectFiles,
  ruleTesterOf,
  testRuntime,
  verifyPlugin,
} from "../../src/create/oxlint.ts";
import { oxlintRule } from "../../src/oxlint/catalog.ts";

const shape = {
  linter: null,
  linterOptions: [],
  mechanical: true,
  mechanicalReason: "It sees a name.",
  scope: "project",
  scopeReason: "Only this repo.",
  format: "markdown",
  formatReason: "Text is enough.",
  typeAware: false,
  reads: [],
  contextReason: "The file is enough.",
  names: ["style/no-foo"],
};

const wire = (over: Record<string, unknown> = {}) => ({
  ...shape,
  linterOptions: JSON.stringify(shape.linterOptions),
  ...over,
});

const plugin = [
  "export default {",
  ' meta: { name: "acme" },',
  " rules: {",
  '  "no-foo": {',
  "   meta: { schema: [] },",
  "   create(context) {",
  "    return { Identifier(node) {",
  '     if (node.name === "foo") context.report({ node, message: "No foo." });',
  "    } };",
  "   },",
  "  },",
  " },",
  "};",
].join("\n");

const answer = {
  plugin,
  pluginName: "acme",
  ruleName: "no-foo",
  valid: ["const bar = 1;"],
  invalid: [{ code: "const foo = 1;", errors: [{ message: "No foo." }] }],
};

/** The same draft as it crosses the wire: every diagnostic location is present, null when unspecified. */
const wireDraft = {
  ...answer,
  invalid: answer.invalid.map((example) => ({
    code: example.code,
    errors: example.errors.map((error) => ({ message: error.message, line: null, column: null })),
  })),
};

const rejects = (decode: () => unknown) => {
  try {
    decode();
    return false;
  } catch {
    return true;
  }
};

const directory = await mkdtemp(join(tmpdir(), "adhere-create-agent-"));
let noTester = false;
try {
  noTester = ruleTesterOf(directory) === undefined;
} finally {
  await rm(directory, { recursive: true, force: true });
}

const consumer = await mkdtemp(join(tmpdir(), "adhere-consumer-"));
let consumerLocal = false;
try {
  await writeFile(join(consumer, "package.json"), "{}\n");
  await mkdir(join(consumer, "node_modules", "oxlint"), { recursive: true });
  await writeFile(
    join(consumer, "node_modules", "oxlint", "package.json"),
    JSON.stringify({
      name: "oxlint",
      version: "0.0.0",
      exports: { "./plugins-dev": "./plugins-dev.js" },
    }),
  );
  await writeFile(join(consumer, "node_modules", "oxlint", "plugins-dev.js"), "export {};\n");
  const local = ruleTesterOf(consumer);
  consumerLocal = local !== undefined && local.path.startsWith(consumer);
} finally {
  await rm(consumer, { recursive: true, force: true });
}

const passed = await Effect.runPromise(verifyPlugin(answer, process.cwd()));
const failed = await Effect.runPromise(
  verifyPlugin(
    { ...answer, invalid: [{ code: "const foo = 1;", errors: [{ message: "Wrong." }] }] },
    process.cwd(),
  ),
);

const completeNative: Record<string, unknown> = {
  rules: { "no-console": "warn" },
  plugins: ["eslint"],
};
const disabledNative: Record<string, unknown> = {
  rules: { "no-console": "warn" },
  plugins: [],
};
const offNative: Record<string, unknown> = {
  rules: { "no-console": ["off", { allow: ["warn"] }] },
};
const allowNative: Record<string, unknown> = {
  rules: { "no-console": "allow" },
};
const allowOptionsNative: Record<string, unknown> = {
  rules: { "no-console": ["allow", { allow: ["warn"] }] },
};
const typeAwareNative: Record<string, unknown> = {
  rules: { "typescript/no-floating-promises": "warn" },
  options: { typeAware: false },
};
const lodashOptions = [{ paths: [{ name: "lodash" }] }];
const restrictedNative: Record<string, unknown> = {
  rules: { "no-restricted-imports": ["error", { paths: [{ name: "lodash" }] }] },
};
const bannedLodash = enabledNative({}, "no-restricted-imports", lodashOptions);
const bareLodash = enabledNative({}, "no-restricted-imports");

const lint = await mkdtemp(join(tmpdir(), "adhere-lodash-"));
let bansLodash = false;
let bareMissesLodash = false;
try {
  await writeFile(join(lint, "a.ts"), 'import lodash from "lodash";\nexport default lodash;\n');
  const lintWith = async (config: unknown, name: string) => {
    await writeFile(join(lint, name), JSON.stringify(config) + "\n");
    const result = spawnSync(
      join(process.cwd(), "node_modules", ".bin", "oxlint"),
      ["-c", name, "a.ts"],
      { cwd: lint, encoding: "utf8" },
    );
    return { code: result.status, output: (result.stdout ?? "") + (result.stderr ?? "") };
  };
  const restricted = await lintWith(bannedLodash, "restricted.json");
  bansLodash = restricted.code !== 0 && restricted.output.includes("no-restricted-imports");
  bareMissesLodash = (await lintWith(bareLodash, "bare.json")).code === 0;
} finally {
  await rm(lint, { recursive: true, force: true });
}

/** The subset of a generated document these checks inspect. */
interface JsonSchemaDocument {
  readonly type?: string;
  readonly properties?: Record<string, JsonSchemaDocument>;
  readonly required?: ReadonlyArray<string>;
  readonly additionalProperties?: unknown;
  readonly items?: JsonSchemaDocument;
  readonly anyOf?: ReadonlyArray<JsonSchemaDocument>;
}

/** Every object in the document is strict: all of its properties are required and extras are rejected. */
const strictDocument = (document: JsonSchemaDocument | undefined): boolean => {
  if (document === undefined) return false;
  const properties = document.properties;
  if (properties !== undefined) {
    const required = document.required;
    if (document.additionalProperties !== false || required === undefined) return false;
    if (!Object.keys(properties).every((key) => required.includes(key))) return false;
    if (!Object.values(properties).every(strictDocument)) return false;
  }
  if (document.items !== undefined && !strictDocument(document.items)) return false;
  return (document.anyOf ?? []).every(strictDocument);
};

const pluginDocument = Schema.toJsonSchemaDocument(PluginDraft, {
  onExcessProperty: "error",
}).schema as JsonSchemaDocument;
const pluginDocumentText = JSON.stringify(pluginDocument);
const pluginErrorDocument = pluginDocument.properties?.invalid?.items?.properties?.errors?.items;
const candidatesDocument = Schema.toJsonSchemaDocument(Candidates, {
  onExcessProperty: "error",
}).schema as JsonSchemaDocument;
const candidatesDocumentText = JSON.stringify(candidatesDocument);

const shapeDocument = Schema.toJsonSchemaDocument(Shape, { onExcessProperty: "error" }).schema as {
  properties: Record<string, { type?: string; enum?: unknown }>;
  required?: readonly string[];
  additionalProperties?: unknown;
};
const shapeDocumentText = JSON.stringify(shapeDocument);
const linterSchema = shapeDocument.properties.linter;
const optionsSchema = shapeDocument.properties.linterOptions;

console.log(
  JSON.stringify({
    shapeMissingMechanical: rejects(() =>
      Schema.decodeUnknownSync(Shape)({ ...wire(), mechanical: undefined }),
    ),
    shapeValid: !rejects(() => Schema.decodeUnknownSync(Shape)(wire())),
    linterNative: !rejects(() => Schema.decodeUnknownSync(Shape)(wire({ linter: "no-console" }))),
    linterInvalid: rejects(() => Schema.decodeUnknownSync(Shape)(wire({ linter: "not/a-rule" }))),
    shapeOptionsNative:
      JSON.stringify(
        Schema.decodeUnknownSync(Schema.fromJsonString(Shape))(
          JSON.stringify(
            wire({ linter: "no-restricted-imports", linterOptions: JSON.stringify(lodashOptions) }),
          ),
        ).linterOptions,
      ) === JSON.stringify(lodashOptions),
    shapeOptionsBadJson: rejects(() =>
      Schema.decodeUnknownSync(Shape)(wire({ linterOptions: "{" })),
    ),
    shapeOptionsNotArray: rejects(() =>
      Schema.decodeUnknownSync(Shape)(wire({ linterOptions: "{}" })),
    ),
    shapeCompactSchema:
      shapeDocumentText.length < 15000 &&
      optionsSchema !== undefined &&
      optionsSchema.type === "string" &&
      optionsSchema.enum === undefined &&
      linterSchema !== undefined &&
      linterSchema.enum === undefined &&
      shapeDocument.additionalProperties === false &&
      !shapeDocumentText.includes("contentMediaType") &&
      Object.keys(shapeDocument.properties).every((key) => shapeDocument.required?.includes(key)),
    draftMissingPlugin: rejects(() =>
      Schema.decodeUnknownSync(PluginDraft)({ valid: [], invalid: [] }),
    ),
    draftMissingLocation: rejects(() =>
      Schema.decodeUnknownSync(PluginDraft)({
        ...wireDraft,
        invalid: [{ code: "const foo = 1;", errors: [{ message: "No foo.", column: null }] }],
      }),
    ),
    draftValid: !rejects(() => Schema.decodeUnknownSync(PluginDraft)(wireDraft)),
    draftNullLocations: (() => {
      const error = Schema.decodeUnknownSync(PluginDraft)(wireDraft).invalid[0]?.errors[0];
      return (
        error !== undefined &&
        error.line === undefined &&
        error.column === undefined &&
        !JSON.stringify(error).includes("line")
      );
    })(),
    draftNumberLocations: (() => {
      const error = Schema.decodeUnknownSync(PluginDraft)({
        ...wireDraft,
        invalid: [{ code: "const foo = 1;", errors: [{ message: "No foo.", line: 2, column: 3 }] }],
      }).invalid[0]?.errors[0];
      return error?.line === 2 && error.column === 3;
    })(),
    draftDocumentStrict:
      pluginDocumentText.length < 15000 &&
      !pluginDocumentText.includes("contentMediaType") &&
      strictDocument(pluginDocument) &&
      strictDocument(pluginErrorDocument) &&
      pluginErrorDocument?.properties?.line?.anyOf?.some((part) => part.type === "null") === true,
    candidatesDocumentStrict:
      candidatesDocumentText.length < 15000 &&
      !candidatesDocumentText.includes("contentMediaType") &&
      strictDocument(candidatesDocument),
    native: oxlintRule("no-console") !== undefined,
    unknownNative: oxlintRule("not/a-rule") === undefined,
    nativeUnchanged: enabledNative(completeNative, "no-console") === completeNative,
    nativeKeepsOnOptions:
      JSON.stringify(
        enabledNative({ rules: { "no-console": ["warn", { allow: ["warn"] }] } }, "no-console"),
      ) === JSON.stringify({ rules: { "no-console": ["warn", { allow: ["warn"] }] } }),
    nativeKeepsOffOptions:
      JSON.stringify(enabledNative(offNative, "no-console")) ===
      JSON.stringify({ rules: { "no-console": ["error", { allow: ["warn"] }] } }),
    nativeAllowsAlias:
      JSON.stringify(enabledNative(allowNative, "no-console")) ===
      JSON.stringify({ rules: { "no-console": "error" } }),
    nativeAllowKeepsOptions:
      JSON.stringify(enabledNative(allowOptionsNative, "no-console")) ===
      JSON.stringify({ rules: { "no-console": ["error", { allow: ["warn"] }] } }),
    nativeEnablesDisabledPlugin:
      JSON.stringify(enabledNative(disabledNative, "no-console")) ===
      JSON.stringify({ rules: { "no-console": "warn" }, plugins: ["eslint"] }),
    nativeEnablesTypeAware:
      JSON.stringify(enabledNative(typeAwareNative, "typescript/no-floating-promises")) ===
      JSON.stringify({
        rules: { "typescript/no-floating-promises": "warn" },
        options: { typeAware: true },
      }),
    nativeSettingOptions: JSON.stringify(nativeSetting([{ max: 200 }])) === '["error",{"max":200}]',
    nativeWritesOptions:
      JSON.stringify(bannedLodash) ===
      JSON.stringify({
        rules: { "no-restricted-imports": ["error", { paths: [{ name: "lodash" }] }] },
      }),
    nativeOnOptions:
      enabledNative(restrictedNative, "no-restricted-imports", lodashOptions) === restrictedNative,
    nativeReplacesDiffering:
      JSON.stringify(
        enabledNative({ rules: { "no-console": ["warn", { a: 1 }] } }, "no-console", [{ b: 2 }]),
      ) === JSON.stringify({ rules: { "no-console": ["error", { b: 2 }] } }),
    bansLodash,
    bareMissesLodash,
    projectMjs:
      pluginSnippet("no-foo", "no-foo").includes(".adhere/oxlint/no-foo.mjs") &&
      projectFiles(process.cwd(), "no-foo").test.endsWith("no-foo.test.mjs"),
    guardsAccept: pluginProblems(answer).length === 0,
    guardsRejectReserved: pluginProblems({ ...answer, pluginName: "typescript" }).length > 0,
    guardsRejectImports:
      pluginProblems({ ...answer, plugin: 'import "vite-plus";\nexport default {};' }).length > 0,
    tester: ruleTesterOf(process.cwd())?.specifier,
    noTester,
    consumerLocal,
    runtime: typeof testRuntime()?.path === "string",
    passed: passed._tag,
    failed: failed._tag,
    failedProblems: failed._tag === "Failed" ? failed.problems.length : 0,
  }),
);
