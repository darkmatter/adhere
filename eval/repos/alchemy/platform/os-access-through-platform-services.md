# platform/os-access-through-platform-services

File, path, process, terminal, and HTTP access must go through Effect's platform services (FileSystem, Path, ChildProcess, Terminal, HttpClient, KeyValueStore), acquired with yield*, never through node: builtins, Bun globals, or fetch. The Bun implementations must be provided once at the entry point with BunServices.layer.

Since left out of the preset, for Effect's language service to check (4ae0126).

102 findings, from 0.96 down to 0.71. Each showed this hint:

```ts
import { Effect, FileSystem, Path } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { BunRuntime, BunServices } from "@effect/platform-bun";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* fs.readFileString(path.join(path.resolve(), "config.json"));
  const response = yield* HttpClient.get("https://api.example.com/users");
  const users = yield* HttpClientResponse.schemaBodyJson(Users)(response);
  return { config, users };
});

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain);
```

Highest probability first: the probability, where Jev pointed, and that line.

```text
0.96 packages/better-auth/test/http.ts:28
     const response = await fetch(url, { ...init, signal });
0.95 packages/alchemy/src/Telemetry/Attributes.ts:70
     catch: () => null as never,
0.95 packages/alchemy/test/Cloudflare/Utils/Http.ts:83
     const res = await fetch(u, {
0.94 packages/alchemy/test/AWS/Local/fixtures/raw.ts:12
     import { spawnSync } from "node:child_process";
0.94 packages/cloudflare-runtime/src/vite/preview-server.ts:261
     content: new Uint8Array(await NodeFs.readFile(file)),
0.93 packages/alchemy/src/AWS/AppSync/GraphQLHttp.ts:95
     fetch(signed.url, {
0.93 packages/alchemy/src/Prisma/Internal/ArtifactFile.ts:5
     import { lstat, open, realpath } from "node:fs/promises";
0.93 packages/alchemy/test/Cloudflare/Website/TypeScriptCompat.ts:4
     import { spawn } from "node:child_process";
0.93 packages/alchemy/test/State/destroy-consistency-repro.ts:23
     import { existsSync, readdirSync } from "node:fs";
0.92 packages/alchemy-test/src/DevCli.ts:66
     last = await fetch(url, init);
0.92 packages/alchemy/src/AWS/OSIS/BindingHttp.ts:236
     fetch(signed.url, {
0.92 packages/alchemy/src/AWS/OpenSearch/DataPlaneHttp.ts:181
     body,
0.92 packages/alchemy/src/Cli/commands/profile/commands.ts:194
     }),
0.92 packages/alchemy/src/Cloudflare/Access.ts:34
     fetch(`https://${domain}`, { redirect: "manual", signal }),
0.92 packages/alchemy/src/Railway/Bind.ts:83
     fetch(
0.92 packages/alchemy/test/AWS/Lambda/fixtures/otel-handler.ts:52
     fetch(`${endpoint}/v1/probe`, {
0.92 packages/floci/src/index.ts:246
     const res = await fetch(`${endpoint}/_floci/health`, { signal });
0.92 packages/frontend-frameworks/src/astro/prerenderer.ts:175
     const response = await fetch(`${origin()}${PRERENDER_ENDPOINT}`, {
0.92 packages/frontend-frameworks/src/nextjs/aws.ts:366
     * deploy ships the OpenNext bundles from disk, never in-memory). */
0.91 packages/alchemy/src/AWS/AMP/BindingHttp.ts:184
     fetch(signed.url, {
0.91 packages/alchemy/test/Cloudflare/Workers/fixtures/do-rpc/object.ts:24
     const response = await fetch(
0.91 packages/cloudflare-runtime/src/core/bindings/browser/Browser.ts:561
     signal: AbortSignal.timeout(perRequestTimeoutMs),
0.91 packages/cloudflare-runtime/src/core/registry/Registry.ts:13
     import * as NFS from "node:fs";
0.90 packages/alchemy/src/Kubernetes/internal/client.ts:324
     requestJson({
0.90 packages/alchemy/src/Prisma/Internal/ArchivePlatform.ts:38
     readonly close: () => void | Promise<void>;
0.90 packages/cloudflare-runtime/src/rolldown/test/setup.ts:1
     import path from "node:path";
0.90 packages/cloudflare-runtime/src/vite/assets/ViteAssets.ts:10
     import * as NodeFs from "node:fs/promises";
0.90 packages/frontend-frameworks/src/core/Loader.ts:3
     import { existsSync, readFileSync } from "node:fs";
0.90 packages/frontend-frameworks/src/sveltekit/aws.ts:141
     );
0.89 packages/alchemy/src/State/LocalState.ts:7
     import { existsSync } from "node:fs";
0.89 packages/alchemy/test/AWS/Lambda/fixtures/lockfile-pinning/handler-impl.ts:1
     import { createRequire } from "node:module";
0.89 packages/alchemy/test/Cloudflare/Workers/fixtures/otel-traced-worker.ts:47
     fetch(`${endpoint}/v1/traces`, {
0.89 packages/alchemy/test/Neon/fixtures/StorageNative.ts:39
     return client.fetch(url, {
0.89 packages/cloudflare-runtime/src/core/remote-bindings/Access.ts:30
     fetch(`https://${domain}`, { redirect: "manual", signal }),
0.89 packages/cloudflare-runtime/src/core/workerd/Workerd.ts:143
     const fs = await import("node:fs/promises");
0.89 packages/cloudflare-runtime/src/vite/test/setup.ts:1
     import path from "node:path";
0.89 packages/frontend-frameworks/src/sveltekit/node.ts:22
     import * as NodeFs from "node:fs";
0.89 packages/frontend-frameworks/src/vinext/PrerenderCache.ts:1
     import fs from "node:fs";
0.89 packages/frontend-frameworks/src/waku/Waku.ts:981
     never,
0.88 packages/alchemy/src/AWS/Lambda/RuntimeExtension.ts:31
     const registration = await fetch(`${base}/register`, {
0.88 packages/cloudflare-runtime/src/core/scripts/generate-capnp.ts:1
     import { $ } from "bun";
0.88 packages/cloudflare-runtime/src/core/test/setup.ts:1
     import path from "node:path";
0.88 packages/frontend-frameworks/src/solidstart/SolidStart.ts:469
     const response = await fetch(url, { redirect: "manual" });
0.87 packages/alchemy/test/Docker/Runtime.ts:2
     import * as NodeChildProcess from "node:child_process";
0.87 packages/frontend-frameworks/src/vinext/cli.ts:317
     process.stderr.write(String(chunk));
0.86 packages/alchemy/test/AWS/EFS/efs-handler.ts:3
     import { promises as fs } from "node:fs";
0.86 packages/cloudflare-runtime/src/vite/dev-server.ts:25
     import * as NodeFs from "node:fs/promises";
0.86 packages/frontend-frameworks/src/octane/Octane.ts:351
     const response = await fetch(url, { redirect: "manual" });
0.85 packages/alchemy/scripts/build.ts:2
     import { rm } from "node:fs/promises";
0.85 packages/cloudflare-runtime/src/core/test/sandbox.ts:36
     const res = await fetch(new URL("/", proxyInstance.url));
0.85 packages/frontend-frameworks/src/core/DevChild.ts:220
     const killTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
0.84 packages/alchemy/test/Cloudflare/Workers/fixtures/drizzle-workflow/db.ts:4
     import path from "node:path";
0.84 packages/frontend-frameworks/src/nextjs/DevServer.ts:181
     * fixture/app's installed copy is the one driven, never a hoisted sibling.
0.83 packages/alchemy-test/src/StrayOutput.ts:30
     // this module uses node:fs append directly (append mode interleaves safely
0.83 packages/alchemy/test/AWS/ApiGateway/TestLease.ts:3
     import { tmpdir } from "node:os";
0.82 packages/alchemy/scripts/aws-test-lanes.ts:21
     import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
0.82 packages/alchemy/src/Git/Hasher/Hasher.ts:341
     `https://self${HASH_ROUTE}?mode=bounds&base=${opts.base}&max=${opts.maxObjectSize}`,
0.82 packages/alchemy/test/AWS/ACMPCA/fixtures/handler.ts:250
     { error: "Not found", method: request.method, pathname },
0.82 packages/frontend-frameworks/fixtures/sveltekit-spa/src/routes/widgets/+page.ts:16
     const response = await fetch("/api/widgets");
0.82 packages/frontend-frameworks/src/nextjs/node.ts:281
     const server = net.createServer();
0.82 packages/frontend-frameworks/src/vinext/cache/seed.ts:13
     import { existsSync } from "node:fs";
0.81 packages/alchemy/src/Neon/InvokeFunctionHttp.ts:68
     fetch(target, {
0.81 packages/alchemy/test/Fly/fixtures/transport.ts:122
     const request = https.request(
0.81 packages/alchemy/test/nodeProbe.ts:15
     const probe = Bun.spawnSync([nodePath, "-p", "process.versions.node"]);
0.81 packages/cloudflare-runtime/src/core/Docker.ts:12
     import * as NodeHttp from "node:http";
0.81 packages/cloudflare-runtime/src/vite/preview-plugin.ts:4
     import * as NodeFs from "node:fs";
0.81 packages/frontend-frameworks/src/react-router/ReactRouter.ts:469
     Effect.promise(async () => {
0.81 packages/frontend-frameworks/src/vite/Vite.ts:342
     return { url };
0.80 packages/alchemy/test/Cloudflare/Workers/fixtures/prisma-orm/db.ts:5
     import path from "node:path";
0.80 packages/alchemy/test/Command/fixture/lifecycle.ts:38
     process.on("SIGTERM", onTerm);
0.80 packages/alchemy/test/Fly/fixtures/bluegreen-create-proxy.ts:11
     import { createServer } from "node:http";
0.79 packages/alchemy/src/Cli/commands/dev.ts:67
     process.env.NODE_EXTRA_CA_CERTS ??= Floci.FLOCI_CA_PATH;
0.79 packages/alchemy/test/Cloudflare/Website/fixtures/sveltekit-spa-app/src/routes/widgets/+page.ts:19
     const response = await fetch("/api/widgets");
0.78 packages/alchemy/test/AWS/OAM/TestLease.ts:3
     import { tmpdir } from "node:os";
0.78 packages/alchemy/test/Cloudflare/Utils/OtlpCollector.ts:2
     import { createServer, type Server } from "node:http";
0.78 packages/cloudflare-runtime/src/core/DockerLoopback.ts:2
     import * as NodeFs from "node:fs";
0.78 packages/cloudflare-runtime/src/core/bindings/queue/Queue.ts:274
     fetch(endpoint, {
0.78 packages/frontend-frameworks/src/sveltekit/SvelteKit.ts:310
     return NodeFs.existsSync(remapped) ? remapped + query : undefined;
0.78 packages/frontend-frameworks/src/tanstack-start/TanStackStart.ts:323
     const response = await fetch(url, { redirect: "manual" });
0.77 packages/frontend-frameworks/src/nuxt/Nuxt.ts:549
     yield* Effect.tryPromise({
0.77 packages/node-utils/src/dependency-watcher.ts:2
     import { readFileSync } from "node:fs";
0.76 packages/alchemy/test/Fly/fixtures/bluegreen-worker-test.ts:42
     const response = await fetch("http://" + host + ":3000/health", {
0.76 packages/alchemy/test/Fly/fixtures/multi-container-http.ts:3
     import * as http from "node:http";
0.76 packages/frontend-frameworks/src/vinext/Modules.ts:2
     import { join } from "node:path";
0.75 packages/alchemy/src/Cloudflare/Workers/Sources/shared.ts:6
     import { fileURLToPath } from "node:url";
0.75 packages/better-auth/src/SQLite.ts:2
     import path from "pathe";
0.75 packages/cloudflare-runtime/src/core/globals/Globals.ts:60
     fetch(url, { method: "POST" }),
0.74 packages/alchemy/src/Cloudflare/Workers/Sources/Vite.ts:178
     rootDir: nodePath.resolve(initialCwd, rootDir),
0.74 packages/alchemy/src/Neon/Website/Artifact.ts:621
     'import { registerHooks, createRequire } from "node:module";',
0.74 packages/alchemy/src/Railway/hosted.ts:401
     const g=globalThis,port=Number(process.env.PORT??3000);
0.74 packages/frontend-frameworks/src/core/DevChildRunner.ts:62
     process.stdout.write(`${devChildUrlMarker(url)}\n`);
0.73 packages/alchemy-test/src/Tui.ts:374
     const proc = Bun.spawn(cmd, {
0.73 packages/alchemy/src/Local/RpcSpawner.ts:181
     Effect.sync(() => new WebSocket(new URL("/parent", url))),
0.73 packages/alchemy/test/AWS/LicenseManager/seller-handler.ts:202
     yield* deleteToken({ TokenId: token.TokenId! });
0.73 packages/alchemy/test/Planetscale/Postgres/fixtures/Stack.ts:4
     import path from "node:path";
0.73 packages/cloudflare-runtime/src/core/globals/Internet.ts:28
     pem = NodeFs.readFileSync(bundlePath, "utf8");
0.73 packages/frontend-frameworks/src/vinext/source.ts:541
     /* @vite-ignore */ pathToFileURL(require.resolve("vite")).href
0.73 packages/pkg/src/cli/pack.ts:306
     dir: path.relative(cwd, absDir).split(path.sep).join("/"),
0.72 packages/cloudflare-runtime/src/rolldown/test/fixtures/node-compat/index.ts:32
     return new Response("OK!");
0.71 packages/alchemy/test/AWS/ECR/handler.ts:4
     import crypto from "node:crypto";
0.71 packages/alchemy/test/AWS/Signer/handler.ts:241
     }
0.71 packages/alchemy/test/Local/fixtures/runtimes.ts:1
     import { spawnSync } from "node:child_process";
```
