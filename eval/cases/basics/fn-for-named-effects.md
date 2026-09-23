# basics/fn-for-named-effects

A named function that returns `Effect.gen` breaks the rule; the same function
through `Effect.fn` follows it.

```ts breaks
import { Effect } from "effect";
import type { ProjectId } from "./ids.ts";
import { ProjectRepo } from "./ProjectRepo.ts";

export const archiveProject = (projectId: ProjectId) =>
  Effect.gen(function* () {
    const projects = yield* ProjectRepo;
    const project = yield* projects.find(projectId);
    yield* projects.save({ ...project, archived: true });
    return project.name;
  });
```

```ts follows
import { Effect } from "effect";
import type { ProjectId } from "./ids.ts";
import { ProjectRepo } from "./ProjectRepo.ts";

export const archiveProject = Effect.fn("archiveProject")(function* (projectId: ProjectId) {
  const projects = yield* ProjectRepo;
  const project = yield* projects.find(projectId);
  yield* projects.save({ ...project, archived: true });
  return project.name;
});
```
