import { describe, expect, it } from "vite-plus/test";
import {
  dependentFilesIn,
  importSpecifiersIn,
  packageOf,
  workspacePackagesIn,
} from "./workspaces.ts";

const catalog = {
  "@repo/foo": "packages/foo",
  "@repo/types": "packages/types",
  "@repo/reexport": "packages/reexport",
  "@repo/dynamic": "packages/dynamic",
  legacy: "packages/legacy",
};

describe("file-local workspace packages", () => {
  it("keeps static and type imports and re-exports under canonical package names", () => {
    const code = `
      import Foo, { value } from "@repo/foo/utils";
      import type { Model } from "@repo/types";
      import type DefaultModel from "@repo/types/model";
      import { type OtherModel } from "@repo/types/other";
      import * as Types from "@repo/types";
      import "legacy/setup";
      export { value as renamed } from "@repo/reexport/value";
      export type { Shape } from "@repo/reexport/types";
      export type * from "@repo/reexport";
      export * as all from "@repo/reexport/all";
      import Missing from "@repo/foobar";
      import External from "external";
      import Relative from "../@repo/foo";
    `;
    expect(workspacePackagesIn(code, catalog)).toEqual({
      "@repo/foo": "packages/foo",
      "@repo/types": "packages/types",
      "@repo/reexport": "packages/reexport",
      legacy: "packages/legacy",
    });
    expect(workspacePackagesIn("export const value = 1;", catalog)).toEqual({});
    expect(catalog).toHaveProperty("@repo/dynamic");
  });

  it("ignores import text in comments, strings, regexes, and templates, and computed modules", () => {
    const code = `
      // import Foo from "@repo/foo";
      /* export * from "@repo/reexport"; */
      const quoted = 'import type { Model } from "@repo/types";';
      const pattern = /require("legacy")/;
      const template = \`import("@repo/dynamic")\`;
      api.require("legacy");
      api.import("@repo/foo");
      api?.require("@repo/types");
      import(moduleName);
      require("@repo/foo/" + name);
      import("@repo/dynamic" + suffix);
    `;
    expect(workspacePackagesIn(code, catalog)).toEqual({});
    expect(workspacePackagesIn('import "@repo/foo";', {})).toEqual({});
  });

  it("reads escaped specifiers and literal import/require calls without a compiler", () => {
    const code = String.raw`
      import type { Model } from "\u0040repo\u002ftypes/model";
      export * from '\x40repo/reexport';
      const dynamic = import /* loader */ ("@repo/dynamic/utils", { with: { type: "json" } });
      type Model = import("@repo/types").Model;
      const legacy = require /* loader */ ('legacy/subpath',);
      import Legacy = require("legacy");
      const foo = require("\u{40}repo\/foo");
    `;
    expect(workspacePackagesIn(code, catalog)).toEqual(catalog);
    expect(workspacePackagesIn("import(`@repo/foo/utils`)", catalog)).toEqual({
      "@repo/foo": "packages/foo",
    });
    expect(workspacePackagesIn("import(`@repo/foo/${name}`)", catalog)).toEqual({});
  });
});

describe("dependent files", () => {
  it("resolves relative specifiers to known files as written, by emitted extension, added extension, or index", () => {
    const dependents = dependentFilesIn(
      new Map([
        ["src/a.ts", importSpecifiersIn('import { b } from "./b.js"; export * from "./lib";')],
        ["src/b.ts", importSpecifiersIn('import "../util"; import x from "pkg/./b";')],
        [
          "src/lib/index.ts",
          importSpecifiersIn('const self = require("./index.ts"); import("..");'),
        ],
        ["src/c.tsx", importSpecifiersIn('import { b } from "./b"; import "./missing";')],
        ["util.ts", []],
        ["src/index.ts", []],
      ]),
    );
    expect(Object.fromEntries(dependents)).toEqual({
      "src/b.ts": ["src/a.ts", "src/c.tsx"],
      "src/lib/index.ts": ["src/a.ts"],
      "util.ts": ["src/b.ts"],
      "src/index.ts": ["src/lib/index.ts"],
    });
  });

  it("places a file in the deepest package directory that holds it", () => {
    const catalog = { outer: "packages/outer", inner: "packages/outer/inner", other: "packages/o" };
    expect(packageOf("packages/outer/inner/src/a.ts", catalog)).toBe("inner");
    expect(packageOf("packages/outer/src/a.ts", catalog)).toBe("outer");
    expect(packageOf("packages/outer-x/a.ts", catalog)).toBeUndefined();
  });
});
