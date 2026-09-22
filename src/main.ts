#!/usr/bin/env bun
import { auditCommand } from "#cli.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect } from "effect";
import { Command } from "effect/unstable/cli";

Command.run(auditCommand, { version: "0.1.0" }).pipe(
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this executable entrypoint supplies Bun's process services.
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
