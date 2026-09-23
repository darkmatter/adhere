#!/usr/bin/env bun
import { auditCommand, runContradictionsCommand, runInitCommand } from "#cli.ts";
import { AdhereConfigLive } from "#services/AdhereConfig.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect } from "effect";
import { Command } from "effect/unstable/cli";

const [subcommand, ...args] = Bun.argv.slice(2);

const program =
  subcommand === "init"
    ? runInitCommand(args)
    : subcommand === "contradictions"
      ? runContradictionsCommand(args).pipe(Effect.provide(AdhereConfigLive({})))
      : Command.run(auditCommand, { version: "0.1.0" });

program.pipe(
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this executable entrypoint supplies Bun's process services.
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
