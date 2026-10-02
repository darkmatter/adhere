---
description: Variants of a domain type, alternatives that carry fields and that a service returns, stores, or decodes, must be tagged schemas such as Schema.TaggedClass or Schema.TaggedStruct members of a Schema.Union, never TypeScript object types joined by a tag field.
---

A tagged schema decodes each variant at the boundary and lets `Match.tag`
check every case, where a hand-written union is neither validated nor checked
for a case added later. Simple alternatives without fields may be
Schema.Literals.

The rule judges declared union types. A union used only inside one module,
such as a view's state, a reducer's actions, or a function's own result, is
not a domain type, and neither is a generic type, an object literal with a tag
field, or a type that mirrors a third-party format whose tag key that format
fixes, such as a Slack Block Kit block. A union that a service returns, or an
event a module emits, is in scope even in a file that declares nothing else.

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
type Payment = { kind: "card"; last4: string } | { kind: "invoice"; dueDate: string };

interface Payments {
  readonly find: (id: PaymentId) => Effect.Effect<Payment, PaymentNotFound>;
}
```
