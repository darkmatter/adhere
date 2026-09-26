---
description: Structured variants, alternatives that carry fields, must be Schema.TaggedClass members of a Schema.Union, never hand-written object types joined by a tag field. Simple alternatives without fields may be Schema.Literals. The rule judges declared union types and schemas; an object literal with a tag field is out of scope, and so is a type that mirrors a third-party format whose tag key that format fixes, such as the type of a Slack Block Kit block.
---

## Must

```ts
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

## Never

```ts
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

const area = (shape: Shape) =>
  shape.kind === "circle" ? Math.PI * shape.radius ** 2 : shape.side ** 2;
```
