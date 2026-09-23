---
description: Structured variants must be Schema.TaggedClass in a Schema.Union, matched with Match.tag and Match.exhaustive, never a plain union checked with a switch.
---

```ts must
export class Success extends Schema.TaggedClass<Success>("Success")("Success", {
  value: Schema.Number,
}) {}

export class Failure extends Schema.TaggedClass<Failure>("Failure")("Failure", {
  error: Schema.String,
}) {}

export const Result = Schema.Union([Success, Failure]);
export type Result = typeof Result.Type;

const renderResult = (result: Result) =>
  Match.value(result).pipe(
    Match.tag("Success", ({ value }) => `Got: ${value}`),
    Match.tag("Failure", ({ error }) => `Error: ${error}`),
    Match.exhaustive,
  );
```

```ts never
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

const area = (shape: Shape) =>
  shape.kind === "circle" ? Math.PI * shape.radius ** 2 : shape.side ** 2;
```
