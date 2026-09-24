---
description: Preview stages should reference a long-lived database or cluster with ref and create only cheap per-stage pieces such as a branch, and should not provision a whole project or cluster for every preview.
---

```ts should
const project = stage.startsWith("pr-")
  ? yield* Neon.Project.ref("AppDb", { stage: "staging" })
  : yield* Neon.Project("AppDb", { region: "aws-us-east-1" });
const branch = yield* Neon.Branch("Branch", { project });
```

```ts should not
const project = yield* Neon.Project("AppDb", { region: "aws-us-east-1" }); // a new project per PR
const branch = yield* Neon.Branch("Branch", { project });
```
