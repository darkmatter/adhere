#!/usr/bin/env bun
import { cli } from "#cli.ts";
import * as adhere from "#index.ts";
import { version } from "#version.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { plugin } from "bun";
import { Effect } from "effect";
import { Command } from "effect/unstable/cli";

// A config file may import `@drkmttr/adhere`, for `defineConfig`. The compiled
// executable resolves no packages from disk, so it answers that import with
// its own copy, whether or not the audited repo has the package installed.
plugin({
  name: "@drkmttr/adhere",
  setup: (build) => {
    build.module("@drkmttr/adhere", () => ({ exports: { ...adhere }, loader: "object" }));
  },
});

Command.run(cli, { version }).pipe(
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this executable entrypoint supplies Bun's process services.
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
