---
description: In a stack deployed to several stages, a resource whose physical name is global to an account or org should omit name, so alchemy derives one per stage, or derive it from the stage, and should not hardcode a single name every stage shares.
---

```ts should
const traces = yield* Axiom.Dataset("Traces", Stack.useSync(({ stage }) => ({
  name: `${stage}-traces`,
  kind: "otel:traces:v1" as const,
})));
const branch = yield* Neon.Branch("Preview", { project });
```

```ts should not
const traces = yield* Axiom.Dataset("Traces", { name: "app-traces", kind: "otel:traces:v1" });
```
