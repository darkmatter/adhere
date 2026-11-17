# effect/services/dependencies-through-layers

The [preset rule](../../../../../presets/effect/services/dependencies-through-layers/RULE.md)
targets callers wiring application services by hand. Review found no such
caller in these 18 pre-ignore findings in `darkmatter/agents`. The useful
questions were what each function returns and who constructs it.

## Story and route fixtures

- `apps/chat/src/features/review/memory/create-refine-approve/rule-editor-answers.ts:62-66` (probability 0.84, context 0.52):
  `createRuleEditorAnswers` takes Storybook controls, fixture data, and read
  context to decide how simulated editor requests should turn out.
- `apps/chat/src/features/review/repositories/new-repository-defaults/new-repository-defaults-held.ts:34` (probability 0.85, context 0.67):
  `heldDefaultsOf` lets the story panel release two queues of pending mock
  requests, reads then saves. The queues belong to that story instance.
- `apps/chat/src/features/review/shell/data-exploration/repository-service.ts:115-127` (probability 0.83, context 0.62):
  `repositoryServerOf` maps the explorer story's read and enrollment callbacks
  to the interface its view expects. Callers supply mock responses, not
  application service implementations.
- `apps/platform-runtime/src/sessions/handlers/session-route-store.ts:36-45` (probability 0.84, context 0.55):
  `sessionRouteStoreFromDatabase` wraps Promise stubs for route tests,
  including the case with no configured database. Production builds the
  route store from its managed runtime instead.

## Helpers built by their owner

- `packages/ai/agents/src/CoderAgent/services/CoderCheckoutGitCommand.ts:120` (probability 0.83, context 0.54):
  `coderGit` takes a process spawner, but its only production caller,
  `CoderCheckoutGit`, yields that spawner while constructing its own layer.
- `packages/compute/omp/src/internal/sessionPoolCreation.ts:56` (probability 0.91, context 0.62):
  Only the session registry calls `createSessionPoolCreation`. It passes its
  own maps and cleanup callback so concurrent requests can share a pending
  creation; callers outside the registry do not assemble it.
- `packages/compute/omp/src/internal/sessionPoolRegistry.ts:78` (probability 0.88, context 0.59):
  `createSessionPoolRegistry` allocates the live and pending session maps for
  one pool. The pool constructs and keeps that state; the registry is not
  provided separately to consumers.
- `packages/compute/omp/src/services/OmpSessionPool.ts:131-133` (probability 0.84, context 0.46):
  `createOmpSessionPool` constructs the SDK-backed pool inside the
  runtime-owned `RuntimePool` layer, which also closes it. The other direct
  calls construct fixtures for pool tests.
- `packages/compute/omp/src/services/OmpWorkspace.ts:73` (probability 0.93, context 0.77):
  The only caller of `createOmpWorkspaceManager` is
  `createOmpWorkspaceManagerEffect`, which obtains the filesystem, path,
  and digest before constructing the manager.

## Routes, programs, and callbacks

- `apps/platform-runtime/src/app-threads.ts:25-30` (probability 0.88, context 0.57):
  `threadRoutes` registers handlers against the supplied thread API and
  returns a Hono router, not an Effect service implementation.
- `apps/platform-runtime/src/durable/workflows/projection.ts:60` (probability 0.85, context 0.62):
  `sessionProjection` returns an Effect that runs one projection pass.
  The job executes that program; it does not wire a new service.
- `apps/platform-runtime/src/runtime/store-facades.ts:12-29` (probability 0.89, context 0.58):
  `createSessionStore` gives Promise-based routes access to existing store
  services through `runtime.runPromise`. The managed runtime still resolves
  those services.
- `packages/core/lib/src/instrumentation/spans/observer.ts:53` (probability 0.81, context 0.54):
  `createSpanObserver` takes buffer limits, metadata, and callbacks for
  sending and warning. These configure a buffer; they are not service
  implementations.
- `packages/storage/database/src/native-sql/SqlGateway.ts:277-279` (probability 0.88, context 0.69):
  `createRunnerStorageGateway` builds WebSocket handlers from relay
  settings and authorization and logging callbacks. The server acquires
  the gateway and closes it.

## External clients and their methods

- `packages/connect/auth/src/internal/authCalls.ts:83` (probability 0.85, context 0.57):
  `authCalls` wraps `AuthWorker.fetch`, the binding to another Worker.
  Its argument is the external fetch interface, not an application service.
- `packages/connect/integrations/src/github/adapters/GitHubMutations.ts:57` (probability 0.85, context 0.42):
  `makeGitHubMutations` builds methods over the transport created by
  `createGitHubClient`. The HTTP client incorporates those methods; its
  consumers do not wire a mutation service.
- `packages/connect/integrations/src/github/adapters/GitHubReads.ts:36` (probability 0.83, context 0.41):
  `makeGitHubReads` builds the read methods for `createGitHubClient` over
  its existing transport. The read methods have no separate service owner.
- `packages/connect/integrations/src/github/adapters/GithubReviewer.ts:32` (probability 0.82, context 0.56):
  `createReviewerGithubAdapter` translates a Promise-based `GitHubClient`
  into the reviewer's GitHub API. It wraps that client rather than asking
  callers for Effect service implementations.

**Regression hint:** Compare two constructors with the same signature. Leave
one unflagged when only the owning layer calls it with services it yielded.
Flag the one a business caller uses to assemble another service by hand.
