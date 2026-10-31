---
title: "Rule format"
---

A repo's own rules live in `.adhere/rules/`, organized just like skills:

```text
.adhere/
  config.ts           optional
  cache/              commit it
  rules/
    data/             a topic: a directory that holds no rule
      brand-ports/
        RULE.md       the rule data/brand-ports
      columns/
        RULE.ts       a rule written in TypeScript
        schema.ts     a helper it imports, not read as a rule
```

- The directory's path is the rule id: `.adhere/rules/data/brand-ports/RULE.md`
  is `data/brand-ports`.
- A rule can be markdown `RULE.md`, or typescript [`RULE.ts`](#rules-as-typescript-files). A
  directory with both refuses the run.
- Files not named `RULE` are ignored.

## Rules as Markdown files

A `RULE.md` is front matter, then a body that holds the rule's code:

````md
---
description: A port must be a branded, range-checked integer, never a bare number.
threshold: 0.8
---

Why: a bare `number` accepts 70000 and -1.

## Must

```ts
const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
```

## Never

```ts
const port: number = Number(process.env.PORT);
```
````

| Front matter             | Meaning                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`            | Required. One sentence that says what code must be and what it must never be.                                                                  |
| `threshold`              | The rule's own cutoff, in place of the config's.                                                                                               |
| `level`                  | `warning` reports the rule's findings as warnings, which do not fail the run. Use it for a nit, or for a rule that tends to flag code wrongly. |
| `tests`                  | Rules skip tests by default. `only` is for a rule about tests, which judges nothing else. `include` is for one that holds in tests as well.    |
| `appliesTo`, `excludeIf` | Where the rule applies. See [Scoping a rule](#scoping-a-rule).                                                                                 |

| Heading in the body          | The code under it                                           |
| ---------------------------- | ----------------------------------------------------------- |
| `## Must`                    | must be written                                             |
| `## Never`                   | must never be written, which is what a violation looks like |
| `## Should`, `## Should not` | the same, for a guideline                                   |

- A rule needs code under at least one heading.
- A rule is a requirement ("must", "never") or a guideline ("should", "should
  not"), and cannot mix the two.
- A rule with only a `never` block suits a rule with no single correct form to
  show, such as a hand-rolled retry loop or an error caught and dropped.
- Put neither kind of code in the other's place: code that must never be
  written, under `must`, reads to Jev as the pattern to follow.
- Prose around the code is the rule's details: Jev reads it after the
  description, so use it to say why the rule holds or where it does not apply.
  The report shows the description alone.

A guideline about architecture, which a normal linter cannot check, with code
under `## Should` and `## Should not`:

````md
---
description: A third-party API going offline should not also take our app down.
---

Our APIs should not depend on a third-party API on a critical path. The
user-facing side should be unaffected if it goes offline, and ingestion should
happen in a separate, asynchronous process.

## Should

```ts
import db from "./lib/db";
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode reads only our own database.
export async function findRestaurants(zipCode: string) {
  return db.restaurants.find({ where: { zipCode } });
}

// A scheduled job copies new restaurants in, off the request path.
export async function syncRestaurants(since: Date) {
  const restaurants = await googleMaps.findAll({ updatedSince: since });
  await Promise.all(restaurants.map((restaurant) => db.restaurants.upsert(restaurant)));
}
```

## Should not

```ts
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode
export async function findRestaurants(zipCode: string) {
  // When Google Maps is down, slow, or over quota, so is this endpoint.
  return googleMaps.findAll({ where: { zipCode } });
}
```
````

<details>
<summary>More on headings, fences, and loading</summary>

- A heading names the code in its section, which runs to the next heading at its
  level or higher, so a deeper heading such as `### A bare number` stays inside
  it.
- Only a heading that is the word alone names code, in any case and with or
  without a colon: `## Never:` does, `## Never do this` does not.
- A fence can instead name its code after its language, as in `ts never`, which
  GitHub does not show. A fence's own word wins over its heading's word.
- A rule inline in a config takes the same keys, with its code under `must`,
  `never`, `should`, and `shouldNot`, and its prose under `details`.
- `loadRules(directory)` from the package root does the same load for your own
  tooling.

</details>

## Scoping a rule

`appliesTo` and `excludeIf` say where a rule applies, apart from what it asks
for. Each is a list of descriptions of code: a JSON array on one line in front
matter, or an array in a config or a TypeScript rule.

<!-- prettier-ignore -->
```md
---
description: Structured variants must be Schema.TaggedClass members of a Schema.Union, never hand-written object types joined by a tag field.
appliesTo: ["a declared union type or schema"]
excludeIf: ["a type that mirrors a third-party format whose tag key that format fixes, such as a Slack Block Kit block"]
---
```

| Key         | Jev is asked, of the code that breaks the rule | A finding stands when     |
| ----------- | ---------------------------------------------- | ------------------------- |
| `appliesTo` | whether any of it is as described              | Jev says yes to every one |
| `excludeIf` | whether all of it is as described              | Jev says yes to none      |

The questions are about the code that breaks the rule, not the whole file, so a
file with a real violation beside code an `excludeIf` describes keeps its
finding.

A yes is a probability above 0.5. At `--log-level debug`, lint logs each
finding its matchers dropped, with their scores.

> **Narrowing the description often works better.** In the preset study, Jev
> scored an `excludeIf` near 0.5 for real and false findings alike. See
> [Writing good rules](/adhere/writing-good-rules/).

## Rules as TypeScript files

A rule's directory can hold a `RULE.ts` instead of a `RULE.md`. It
default-exports `defineRule({...})`, which takes the same fields as a config's
inline rule. TypeScript adds what a `RULE.md` cannot have: a
[state hook](/adhere/state-hooks/#state-hooks), which adds to what Jev reads for the rule, and
[rule options](/adhere/state-hooks/#rule-options), which each project that uses the rule sets.

- adhere imports a `RULE.ts`, as it imports a config, so its code runs on
  every lint.
- It can import other files by relative path, such as a helper beside it in
  its directory. The executable resolves no packages besides
  `@drkmttr/adhere`.
- A `RULE.ts` that default-exports no rule refuses the run.

## Where rules live

- Rules in the root `.adhere/rules/` apply project-wide.
- A nested `.adhere/` scopes its rules to the directory that contains it. A rule
  in `packages/api/.adhere/rules/data/brand-ports/RULE.md` has the same id,
  `data/brand-ports`, but applies only to files under `packages/api/`.
- If a nested rule has the same id as a root rule, the nearest containing
  `.adhere/` shadows the less-specific rule for that subtree. Outside that
  subtree, the root rule still applies.
- Nested `.adhere/` directories are not discovered under `node_modules/`,
  `dist/`, and the other [skipped directories](/adhere/running-lint/#what-gets-read).

To keep your rules with the rest of your documentation, point `rules` at a
directory such as `docs/adhere/`:

```ts
export default defineConfig({ presets: ["effect"], rules: "./docs/adhere" });
```

That directory holds a directory per rule, as `.adhere/rules/` does, and its
rules apply project-wide.
