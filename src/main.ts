#!/usr/bin/env bun
import { cli } from "#cli.ts";
import * as adhere from "#index.ts";
import { version } from "#version.ts";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { plugin } from "bun";
import { Cause, Effect, Layer, Logger, References, Runtime } from "effect";
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

/**
 * Every log on stderr, so stdout carries the report and nothing else. The
 * pretty logger picks its stream from `LogToStderr`, not from an option.
 */
const logger = Layer.merge(
  Logger.layer([Logger.consolePretty()]),
  Layer.succeed(References.LogToStderr, true),
);

/**
 * How a failed run says so, through the logger above: runMain's own report
 * goes to stdout. A failure adhere declares, such as a refused request or a
 * config that does not decode, is its message alone; its stack would only
 * point into adhere. A defect, which is a bug, keeps its whole cause.
 */
const report = (cause: Cause.Cause<unknown>): Effect.Effect<void> => {
  if (Cause.hasInterruptsOnly(cause)) return Effect.void;
  const error = Cause.squash(cause);
  const marked = typeof error === "object" && error !== null && Runtime.errorReported in error;
  if (
    marked &&
    (error as { readonly [Runtime.errorReported]: boolean })[Runtime.errorReported] === false
  ) {
    return Effect.void;
  }
  return !Cause.hasDies(cause) && error instanceof Error
    ? Effect.logError(error.message)
    : Effect.logError(cause);
};

Command.run(cli, { version }).pipe(
  Effect.tapCause(report),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- this executable entrypoint supplies Bun's process services and the logger.
  Effect.provide(Layer.merge(BunServices.layer, logger)),
  (program) => BunRuntime.runMain(program, { disableErrorReporting: true }),
);
