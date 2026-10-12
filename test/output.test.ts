import { stripVTControlCharacters } from "node:util";

import { describe, expect, it } from "vite-plus/test";
import { sectionsOf } from "../src/excerpt.ts";
import { tokenize } from "../src/highlight.ts";

import { failing, render } from "../src/workflows/audit.ts";
import { findingA } from "./audit.fixtures.ts";

describe("highlight", () => {
  /** Each line of the code, with every classified token marked `[kind text]`. */
  const marked = (code: string) =>
    tokenize(code).map((line) =>
      line.map(({ text, kind }) => (kind === undefined ? text : `[${kind} ${text}]`)).join(""),
    );

  it("marks keywords, type names, constants, strings, and comments", () => {
    expect(marked('const port: number = Number(process.env.PORT ?? "80"); // why')).toEqual([
      '[keyword const] port: [type number] = [type Number](process.env.PORT ?? [string "80"]); [comment // why]',
    ]);
  });

  it("reads a word after a dot or before a colon as a property, not a keyword", () => {
    expect(marked('cache.get(key); ({ type: "noul" as const })')).toEqual([
      'cache.get(key); ({ type: [string "noul"] [keyword as] [keyword const] })',
    ]);
  });

  it("reads a slash as a regex where an expression can start, and as division after a value", () => {
    expect(marked("const fence = /[/]`{3,}/g; const half = total / 2 / scale;")).toEqual([
      "[keyword const] fence = [string /[/]`{3,}/g]; [keyword const] half = total / [constant 2] / scale;",
    ]);
  });

  it("cuts a comment or template that crosses lines into one token per line", () => {
    expect(marked("/* one\n\n   two */ const s = `a\n${b}`;")).toEqual([
      "[comment /* one]",
      "",
      "[comment    two */] [keyword const] s = [string `a]",
      "[string ${b}`];",
    ]);
  });

  it("reads a template in another's ${…} as part of it, braces and all", () => {
    expect(marked("const list = `${xs.map((x) => `- ${x}`).join(`}`)}`; const n = 1;")).toEqual([
      "[keyword const] list = [string `${xs.map((x) => `- ${x}`).join(`}`)}`]; [keyword const] n = [constant 1];",
    ]);
  });

  it("gives back every character of the input, however malformed", () => {
    for (const code of [
      '"unterminated',
      "/* open",
      "`open\n\n",
      "`${open",
      "`${a}\\",
      "a\r\nb",
      "é → 🎉",
      "y / z /",
    ]) {
      const text = tokenize(code).map((line) => line.map((token) => token.text).join(""));
      expect(text.join("\n")).toBe(code);
    }
  });
});

describe("sections", () => {
  /** A statement of `n` lines: `const name = [` then its values, then `];`. */
  const statement = (name: string, n: number): ReadonlyArray<string> => [
    `const ${name} = [`,
    ...Array.from({ length: n - 2 }, (_, index) => `  ${index},`),
    "];",
  ];

  it("packs whole statements into sections of at most 30 lines, covering every line", () => {
    const code = [
      'import { a } from "a";',
      "",
      "// the first",
      ...statement("first", 20),
      "",
      ...statement("second", 20),
      ...statement("third", 5),
    ];
    expect(sectionsOf(code)).toEqual([
      { first: 1, last: 23 },
      { first: 24, last: 49 },
    ]);
  });

  it("splits a long statement into the statements of its largest group", () => {
    const code = [
      "export class Big {",
      ...Array.from({ length: 4 }, (_, index) => [
        `  method${index}() {`,
        ...Array.from({ length: 12 }, (_, line) => `    this.call(${line});`),
        "  }",
      ]).flat(),
      "}",
    ];
    const sections = sectionsOf(code);
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0]?.first).toBe(1);
    expect(sections.at(-1)?.last).toBe(code.length);
    for (const section of sections) expect(section.last - section.first).toBeLessThan(30);
  });

  it("keeps a decorator with the declaration it decorates", () => {
    const code = [
      ...statement("before", 28),
      "@Command({",
      "  name: 'reset',",
      "})",
      "export class Reset {}",
    ];
    expect(sectionsOf(code)).toEqual([
      { first: 1, last: 28 },
      { first: 29, last: 32 },
    ]);
  });
});

describe("render", () => {
  const result = {
    files: 1,
    judged: 1,
    cached: 0,
    skipped: 0,
    waiting: 0,
    blocked: [],
    findings: [findingA],
    suppressed: 0,
  };

  it("prints the vp-lint frame with the code to write as the hint, then the legend for its scores", () => {
    expect(render(result, { root: "/repo" }).join("\n")).toBe(
      [
        "  × a: Ports are branded.",
        "    confidence 0.90 · context 0.90",
        "   ╭─[src/server.ts:2:3]",
        " 1 │ const before = 1;",
        " 2 │   const port: number = Number(process.env.PORT);",
        "   ·   ──────────────────────────────────────────────",
        " 3 │ const after = 2;",
        "   ╰────",
        '  hint: const Port = Schema.Int.pipe(Schema.brand("Port"))',
        "        type Port = typeof Port.Type",
        "",
        "  confidence  0–0.74 < 0.8 < 0.85–1  Jev's probability that the file breaks the rule",
        "  context     0–0.49 < 0.6 < 0.70–1  its probability that the file shows enough to decide",
        "",
        "Found 1 error.",
        "1 file, 1 judged, 0 cached.",
      ].join("\n"),
    );
  });

  it("numbers the section's lines right-aligned, and underlines the lines Jev names past a tab", () => {
    const excerpt = { start: 9, lines: ["\tif (port) {", "\t\tlisten(port);", "\t}"] };
    const finding = {
      ...findingA,
      section: { first: 9, last: 11 },
      lines: { first: 10, last: 10 },
      excerpt,
    };
    expect(render({ ...result, findings: [finding] }, { root: "/repo" }).slice(2, 8)).toEqual([
      "    ╭─[src/server.ts:10:3]",
      "  9 │ \tif (port) {",
      " 10 │ \t\tlisten(port);",
      "    · \t\t─────────────",
      " 11 │ \t}",
      "    ╰────",
    ]);
  });

  it("marks the lines of a span of several with a bar beside the code, not an underline each", () => {
    const finding = { ...findingA, lines: { first: 2, last: 3 } };
    expect(render({ ...result, findings: [finding] }, { root: "/repo" }).slice(2, 7)).toEqual([
      "   ╭─[src/server.ts:2:3]",
      " 1 │   const before = 1;",
      " 2 │ ┃   const port: number = Number(process.env.PORT);",
      " 3 │ ┃ const after = 2;",
      "   ╰────",
    ]);
  });

  it("places a finding without lines at its section's first line, with no underline", () => {
    const { lines: _, ...unlined } = findingA;
    expect(render({ ...result, findings: [unlined] }, { root: "/repo" }).slice(2, 7)).toEqual([
      "   ╭─[src/server.ts:1:1]",
      " 1 │ const before = 1;",
      " 2 │   const port: number = Number(process.env.PORT);",
      " 3 │ const after = 2;",
      "   ╰────",
    ]);
  });

  it("shows a finding's scores under its header, and warns under the section when its context is below the threshold", () => {
    const finding = { ...findingA, context: 0.45 };
    const lines = render({ ...result, findings: [finding] }, { root: "/repo" });
    expect(lines.slice(0, 2)).toEqual([
      "  × a: Ports are branded.",
      "    confidence 0.90 · context 0.45",
    ]);
    expect(lines.slice(8, 12)).toEqual([
      "  warning: this file may not show enough to check this rule",
      "     help: add what the code relies on outside this file as a note Jev reads:",
      "           // @adhere <the fact>, and how you know it",
      '  hint: const Port = Schema.Int.pipe(Schema.brand("Port"))',
    ]);
    // Above the threshold, which the caller can set, there is no warning.
    const enough = render({ ...result, findings: [finding] }, { sufficiencyThreshold: 0.4 });
    expect(enough.some((line) => line.includes("warning:"))).toBe(false);
    expect(enough).toContain(
      "  context     0–0.24 < 0.4 < 0.55–1  its probability that the file shows enough to decide",
    );
  });

  it("shows the code never to write, labeled with its word, for a rule without code to write", () => {
    const code = 'throw new Error("x")\nthrow new Error("y")';
    const finding = { ...findingA, examples: { bad: { word: "never" as const, code } } };
    const lines = render({ ...result, findings: [finding] }, { root: "/repo" });
    expect(lines).toContain('  never: throw new Error("x")');
    expect(lines).toContain('         throw new Error("y")');
    expect(lines.some((line) => line.includes("hint:"))).toBe(false);
  });

  const sgr = (code: string, text: string) => `\u001b[${code}m${text}\u001b[0m`;

  it("names a preset rule's preset first in its header, and a project rule plainly", () => {
    const fromPreset = { ...findingA, rule: "basics/ports", preset: "effect" };
    const lines = render({ ...result, findings: [fromPreset, findingA] }, { root: "/repo" });
    expect(lines.filter((line) => line.startsWith("  × "))).toEqual([
      "  × effect/basics/ports: Ports are branded.",
      "  × a: Ports are branded.",
    ]);
  });

  it("marks a warning's header and counts warnings apart from errors", () => {
    const warning = { ...findingA, rule: "b", level: "warning" as const };
    const lines = render({ ...result, findings: [findingA, warning] }, { root: "/repo" });
    expect(lines.filter((line) => /^  [×⚠] /.test(line))).toEqual([
      "  × a: Ports are branded.",
      "  ⚠ b: Ports are branded.",
    ]);
    expect(lines).toContain("Found 1 error and 1 warning.");
    expect(render({ ...result, findings: [warning] }, { root: "/repo" })).toContain(
      "Found 0 errors and 1 warning.",
    );
    const amber = "38;2;214;154;0;1";
    expect(render({ ...result, findings: [warning] }, { color: true }).join("\n")).toContain(
      `  ${sgr(amber, "⚠")} ${sgr(amber, "b")}: `,
    );
  });

  it("fails a run on its errors, and on its warnings only when asked to", () => {
    const warning = { ...findingA, level: "warning" as const };
    expect(failing([findingA, warning])).toEqual([findingA]);
    expect(failing([warning])).toEqual([]);
    expect(failing([findingA, warning], true)).toEqual([findingA, warning]);
  });

  const green = "38;2;152;195;121";
  const amber = "38;2;229;192;123";
  const rose = "38;2;224;108;117";
  const dim = "2";

  it("colors only the rule red in the header on a terminal, dims the scores' labels, and counts skipped files", () => {
    const red = "38;2;164;20;71;1";
    const colored = render({ ...result, skipped: 2 }, { color: true }).join("\n");
    expect(colored).toContain(
      `  ${sgr(red, "×")} ${sgr(red, "a")}: ${sgr("38;2;230;230;255", "Ports are branded.")}\n    ${sgr(dim, "confidence ")}${sgr(green, "0.90")}${sgr(dim, " · context ")}${sgr(green, "0.90")}`,
    );
    expect(colored).toContain("\u001b[38;2;5;125;160;1m/repo/src/server.ts");
    expect(colored.endsWith("1 file, 1 judged, 0 cached, 2 skipped.")).toBe(true);
  });

  it("colors a confidence by how far it is from its rule's threshold: amber within a quarter of the room above it, either side, red below, green above", () => {
    const scores = (probability: number, threshold: number) =>
      render(
        { ...result, findings: [{ ...findingA, probability, threshold }] },
        { color: true },
      )[1];
    const confidence = (code: string, text: string) =>
      `${sgr(dim, "confidence ")}${sgr(code, text)}`;
    // At 0.80 the room above is 0.20, so the band is 0.05 either side.
    expect(scores(0.74, 0.8)).toContain(confidence(rose, "0.74"));
    expect(scores(0.75, 0.8)).toContain(confidence(amber, "0.75"));
    expect(scores(0.8, 0.8)).toContain(confidence(amber, "0.80"));
    expect(scores(0.84, 0.8)).toContain(confidence(amber, "0.84"));
    expect(scores(0.85, 0.8)).toContain(confidence(green, "0.85"));
    // The band narrows as the threshold rises, which leaves a range above it.
    expect(scores(0.87, 0.9)).toContain(confidence(rose, "0.87"));
    expect(scores(0.92, 0.9)).toContain(confidence(amber, "0.92"));
    expect(scores(0.93, 0.9)).toContain(confidence(green, "0.93"));
  });

  it("colors a context the same way around the sufficiency threshold, and warns below the threshold itself", () => {
    const lines = (value: number) =>
      render({ ...result, findings: [{ ...findingA, context: value }] }, { color: true });
    const context = (code: string, text: string) => `${sgr(dim, " · context ")}${sgr(code, text)}`;
    const warns = (value: number) => lines(value).some((line) => line.includes("warning: "));
    // At 0.60 the room above is 0.40, so the band is 0.10 either side.
    expect(lines(0.49)[1]).toContain(context(rose, "0.49"));
    expect(lines(0.5)[1]).toContain(context(amber, "0.50"));
    expect(lines(0.69)[1]).toContain(context(amber, "0.69"));
    expect(lines(0.7)[1]).toContain(context(green, "0.70"));
    // The warning keeps its own cutoff, inside the amber range.
    expect(warns(0.59)).toBe(true);
    expect(warns(0.6)).toBe(false);
  });

  it("sets the legend as a table: a bold label, the threshold in amber between the ranges far below and well above it, each in its scores' color, and a dim meaning", () => {
    const colored = render(result, { color: true });
    const less = sgr(amber, "<");
    expect(colored).toContain(
      `  ${sgr("1", "confidence")}  ${sgr(rose, "0–0.74")} ${less} ${sgr(amber, "0.8")} ${less} ${sgr(green, "0.85–1")}  ${sgr(dim, "Jev's probability that the file breaks the rule")}`,
    );
    expect(colored).toContain(
      `  ${sgr("1", "context")}     ${sgr(rose, "0–0.49")} ${less} ${sgr(amber, "0.6")} ${less} ${sgr(green, "0.70–1")}  ${sgr(dim, "its probability that the file shows enough to decide")}`,
    );
  });

  it("puts the run's threshold in the legend with its ranges either side, and no range below one too low to have it", () => {
    const confidence = (threshold: number) =>
      render(result, { threshold })
        .find((line) => line.startsWith("  confidence"))
        ?.replace(/ +/g, " ")
        .replace(" confidence ", "")
        .replace(" Jev's probability that the file breaks the rule", "");
    expect(confidence(0.7)).toBe("0–0.62 < 0.7 < 0.78–1");
    expect(confidence(0.9)).toBe("0–0.87 < 0.9 < 0.93–1");
    expect(confidence(0.75)).toBe("0–0.68 < 0.75 < 0.82–1");
    expect(confidence(1)).toBe("0–0.99 < 1 < 1–1");
    expect(confidence(0)).toBe("0 < 0.25–1");
    // Its cells stay under context's, whose columns they share.
    expect(render(result, { threshold: 0 })).toContain(
      "  confidence           0   < 0.25–1  Jev's probability that the file breaks the rule",
    );
  });

  it("leaves the legend out of a report with no findings", () => {
    expect(render({ ...result, findings: [] })).toEqual([
      "Found 0 errors.",
      "1 file, 1 judged, 0 cached.",
    ]);
  });

  it("highlights the section and the hint on a terminal", () => {
    const colored = render(result, { color: true });
    expect(colored).toContain(
      ` ${sgr("2", "2")} │   ${sgr("34", "const")} port: ${sgr("36", "number")} = ${sgr("36", "Number")}(process.env.PORT);`,
    );
    expect(colored).toContain(
      `${sgr("38;2;242;205;205", "  hint: ")}${sgr("34", "const")} ${sgr("36", "Port")} = ${sgr("36", "Schema")}.${sgr("36", "Int")}.pipe(${sgr("36", "Schema")}.brand(${sgr("32", '"Port"')}))`,
    );
  });

  it("adds color and nothing else, and closes every color on the line that opens it", () => {
    const code = "/* Decoded once,\n\n   at the edge. */\nconst message = `${file}:\n  ${line}`;";
    const findings = [{ ...findingA, examples: { good: { word: "must" as const, code } } }];
    const colored = render({ ...result, findings }, { color: true });
    expect(colored.map((line) => stripVTControlCharacters(line))).toEqual(
      render({ ...result, findings }),
    );
    for (const line of colored) {
      expect(line.split("\u001b[").length - 1).toBe(2 * (line.split("\u001b[0m").length - 1));
    }
  });
});
