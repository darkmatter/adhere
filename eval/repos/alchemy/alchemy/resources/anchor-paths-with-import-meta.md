# alchemy/resources/anchor-paths-with-import-meta

A path prop such as main or rootDir on a resource declared outside the directory alchemy runs from must be anchored to the declaring file with import.meta, never given as a bare relative string, which resolves from the root instead.

3 findings, from 0.79 down to 0.76. Each showed this hint:

```ts
// backend/src/api.ts
export default Cloudflare.Worker("Api", { main: import.meta.url }, program);
export const Site = Cloudflare.Website.Vite("Site", { rootDir: path.resolve(import.meta.dirname, "../frontend") });
```

Highest probability first: the probability, where Jev pointed, and the code around it, the line marked `>`.

```text
0.79 packages/alchemy/test/Cloudflare/Workers/WorkflowBinding.types.ts:187:5
  184 │ class EffectWorker extends Cloudflare.Worker<EffectWorker>()(
  185 │   "EffectWorker",
  186 │   {
> 187 │     main: "./src/worker.ts",
  188 │     env: { STR: "hello" },
  189 │   },
  190 │   nativeImplementation,
  191 │ ) {}

0.79 packages/alchemy/test/types/WorkerClassEnv.ts:14:5
  11 │ export class Api extends Cloudflare.Worker<Api>()(
  12 │   "Api",
  13 │   Effect.gen(function* () {
> 14 │     return { main: "./api.ts", env: yield* apiEnv };
  15 │   }),
  16 │ ) {}

0.76 packages/alchemy/test/Local/fixtures/dev-cli/alchemy.run.ts:13:7
   5 │ export default Alchemy.Stack(
   6 │   "DevCliKillFixture",
   7 │   {
   8 │     providers: Cloudflare.providers(),
   9 │     state: Alchemy.localState(),
  10 │   },
  11 │   Effect.gen(function* () {
  12 │     const worker = yield* Cloudflare.Worker("KillFixtureWorker", {
> 13 │       main: "./worker.ts",
  14 │     });
  15 │     return { workerUrl: worker.url.as<string>() };
  16 │   }),
  17 │ );
```
