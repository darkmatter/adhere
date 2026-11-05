/**
 * The last step of `adhere rules create`: run the draft on real files before
 * anything is written, let the authoring agent read the saved report, and let
 * the user accept the draft, revise it from the evidence, or cancel.
 *
 * The trial is draft-only: nothing is installed, no rule is written, and the
 * cache is read but never pruned. A skipped or failed trial leaves the draft
 * explicitly untested; it never counts as validation.
 */
import { type Agent } from "#create/agents.ts";
import { RuleNotCreated, asking, inspectionPrompt } from "#create/ask.ts";
import { line, note, said, spinning, warn } from "#create/look.ts";
import {
  type TrialDraft,
  type TrialFinding,
  type TrialPreview,
  type TrialRun,
  type TrialScope,
  previewTrial,
  runTrial,
} from "#create/trial.ts";
import { Effect, type PlatformError, Terminal } from "effect";
import { Prompt } from "effect/cli";

/** How many files the trial reads unless the user picks another number. */
export const DEFAULT_TRIAL_FILES = 100;

/** A custom trial size: a positive whole number of files, or nothing. */
export const parseTrialFiles = (input: string): number | undefined => {
  const count = Number(input);
  return Number.isInteger(count) && count > 0 ? count : undefined;
};

/** What the user made of one finding. */
export type FindingVerdict = "correct" | "false-positive" | "unsure";

/** One finding the user judged, with the note they added when they did. */
export interface FindingReview {
  readonly where: string;
  readonly probability?: number;
  readonly verdict: FindingVerdict;
  readonly note?: string;
}

/**
 * Whether a draft may run. A `RULE.ts` and a plugin are code, so the user
 * approves them before the trial imports or loads them; a plugin's own tests
 * run again after every revision.
 */
export type Approval<D> =
  | { readonly _tag: "Approved"; readonly draft: D }
  | { readonly _tag: "Declined" }
  /** The draft could not be checked here; the trial can be skipped. */
  | { readonly _tag: "Unavailable"; readonly problems: ReadonlyArray<string> }
  /** The draft failed its own checks; nothing should be written. */
  | {
      readonly _tag: "Failed";
      readonly problems: ReadonlyArray<string>;
      readonly reason?: string;
    };

/**
 * A draft the trial can run, and what the wizard needs to show, approve, and
 * revise it. The caller owns the draft's real form; this module owns the loop.
 */
export type TrialFailure = RuleNotCreated | PlatformError.PlatformError | Terminal.QuitError;

export interface TrialSubject<D, R = never> {
  readonly agent: Agent;
  readonly root: string;
  readonly id: string;
  readonly draft: D;
  readonly toDraft: (draft: D) => TrialDraft;
  readonly approve: (draft: D) => Effect.Effect<Approval<D>, TrialFailure, R>;
  readonly revise: (draft: D, evidence: string) => Effect.Effect<D, TrialFailure, R>;
  readonly show: (draft: D) => Effect.Effect<void>;
}

/** What the trial left the wizard with. Only `Accepted` carries fresh evidence. */
export type TrialOutcome<D> =
  | {
      readonly _tag: "Accepted";
      readonly draft: D;
      readonly run: TrialRun;
      readonly reviews: ReadonlyArray<FindingReview>;
    }
  | { readonly _tag: "Untested"; readonly draft: D; readonly reason: string }
  | { readonly _tag: "Cancelled"; readonly draft: D; readonly reason: string };

const messageOf = (cause: unknown): string => {
  if (typeof cause === "object" && cause !== null && "message" in cause) {
    const message = (cause as { readonly message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return cause instanceof Error ? cause.message : String(cause);
};

const filesWord = (count: number) => `${count} file${count === 1 ? "" : "s"}`;

const whereOf = (finding: TrialFinding) => {
  const at = finding.lines ?? finding.section;
  if (at === undefined) return finding.file;
  return `${finding.file}:${at.first === at.last ? at.first : `${at.first}-${at.last}`}`;
};

/** What a preview costs, with only the numbers adhere actually knows. */
const describePreview = (preview: TrialPreview) => {
  const parts = [filesWord(preview.selected)];
  if (preview.requests > 0) {
    parts.push(`${preview.requests} request${preview.requests === 1 ? "" : "s"}`);
  }
  if (preview.tokens > 0) parts.push(`about ${preview.tokens} input tokens`);
  if (preview.price !== undefined && preview.tokens > 0) {
    const dollars = (preview.tokens / 1_000_000) * preview.price;
    parts.push(`about $${dollars < 0.01 ? dollars.toFixed(4) : dollars.toFixed(2)}`);
  }
  return parts.join(", ");
};

const showPreview = (scope: TrialScope, preview: TrialPreview) =>
  Effect.gen(function* () {
    const label = scope.kind === "all" ? "The entire repo" : `The first ${scope.limit} files`;
    yield* note(`${label}: ${describePreview(preview)}.`);
    if (preview.eligible > preview.selected) {
      yield* note(`${preview.eligible} eligible files; ${preview.selected} selected.`);
    }
    if (preview.cached > 0) yield* note(`${preview.cached} cached judgments.`);
    if (preview.deferred > 0) {
      yield* note(`${filesWord(preview.deferred)} wait for a later run.`);
    }
    if (preview.skipped > 0) yield* note(`${filesWord(preview.skipped)} skipped as too long.`);
    if (preview.requests === 0) {
      yield* note("Nothing to send: the selected files have no pending requests.");
    }
    if (preview.provider !== undefined) yield* note(`Requests go to ${preview.provider}.`);
    yield* note("Plan only: no requests sent.");
  });

const optionalNote = (message: string) =>
  Effect.map(Prompt.run(Prompt.String({ message, default: "" })), (value) =>
    value.trim() === "" ? undefined : value.trim(),
  );

/** Asks whether to go on without the trial, and never claims another judge fills in. */
const skipOrCancel = (reason: string) =>
  Effect.gen(function* () {
    yield* warn(reason);
    yield* note("adhere will not substitute another judge.");
    return yield* Prompt.run(
      Prompt.Confirm({ message: "Skip the trial and continue without it?", initial: true }),
    );
  });

type Previewed =
  | { readonly _tag: "Preview"; readonly preview: TrialPreview }
  | { readonly _tag: "Failed"; readonly message: string };

const previewOf = <D, R>(
  subject: TrialSubject<D, R>,
  draft: D,
  scope: TrialScope,
  files?: ReadonlyArray<string>,
) =>
  previewTrial(subject.toDraft(draft), scope, files === undefined ? {} : { files }).pipe(
    Effect.map((preview): Previewed => ({ _tag: "Preview", preview })),
    Effect.catch((cause): Effect.Effect<Previewed> =>
      Effect.succeed({ _tag: "Failed", message: messageOf(cause) }),
    ),
  );

type ScopeChoice = TrialScope | "custom" | "skip";

/** The trial's scope, with the default's real cost when it could be worked out. */
const chooseScope = <D, R>(subject: TrialSubject<D, R>, draft: D) =>
  Effect.gen(function* () {
    const base = yield* previewOf(subject, draft, {
      kind: "files",
      limit: DEFAULT_TRIAL_FILES,
    });
    if (base._tag === "Failed") {
      yield* note(`Could not estimate the trial: ${base.message}`);
    }
    const eligible = base._tag === "Preview" ? base.preview.eligible : undefined;
    const picked = yield* Prompt.run(
      Prompt.Select<ScopeChoice>({
        message: "Trial the draft on real files before writing it?",
        choices: [
          {
            title: `${DEFAULT_TRIAL_FILES} files`,
            value: { kind: "files", limit: DEFAULT_TRIAL_FILES } as const,
            description:
              base._tag === "Preview"
                ? describePreview(base.preview)
                : "adhere's default; the cost is shown before it runs.",
          },
          {
            title:
              eligible === undefined
                ? "The entire repo"
                : `The entire repo (${eligible} eligible files)`,
            value: { kind: "all" } as const,
            description: "Every eligible file; the cost is shown before it runs.",
          },
          {
            title: "Another number of files",
            value: "custom" as const,
            description: "A positive whole number, cached files included.",
          },
          {
            title: "Skip the trial",
            value: "skip" as const,
            description: "Write the draft untested.",
          },
        ],
      }),
    );
    if (picked === "skip") return { _tag: "Skip" } as const;
    if (picked === "custom") {
      const value = yield* Prompt.run(
        Prompt.String({
          message: "How many files?",
          validate: (input) => {
            const count = parseTrialFiles(input);
            return count === undefined
              ? Effect.fail("A positive whole number.")
              : Effect.succeed(String(count));
          },
        }),
      );
      return { _tag: "Scope", scope: { kind: "files", limit: Number(value) } } as const;
    }
    return {
      _tag: "Scope",
      scope: picked,
      ...(base._tag === "Preview" && picked.kind === "files" && picked.limit === DEFAULT_TRIAL_FILES
        ? { preview: base.preview }
        : {}),
    } as const;
  });

type Ran =
  | { readonly _tag: "Run"; readonly run: TrialRun }
  | { readonly _tag: "Failed"; readonly message: string };

const runOnce = <D, R>(
  subject: TrialSubject<D, R>,
  draft: D,
  scope: TrialScope,
  files?: ReadonlyArray<string>,
) =>
  spinning(
    `Trialling ${subject.id}`,
    runTrial(subject.toDraft(draft), scope, files === undefined ? {} : { files }),
  ).pipe(
    Effect.map((run): Ran => ({ _tag: "Run", run })),
    Effect.catch((cause): Effect.Effect<Ran> =>
      Effect.succeed({ _tag: "Failed", message: messageOf(cause) }),
    ),
  );

const showRun = (run: TrialRun) =>
  Effect.gen(function* () {
    yield* note(
      `Trialled ${filesWord(run.files)}: ${run.judged} judged, ${run.cached} cached, ${run.skipped} skipped, ${run.waiting} waiting.`,
    );
    yield* note(`${run.findings.length} finding${run.findings.length === 1 ? "" : "s"}.`);
    if (run.judged === 0 && run.files > 0) {
      yield* note("Every selected file was cached; no request was sent.");
    }
    yield* note(`Report: ${run.reportPath}`);
    for (const limitation of run.notes) yield* note(limitation);
  });

/** The authoring agent reads the saved report and the source it names, every run. */
const inspect = <D, R>(subject: TrialSubject<D, R>, run: TrialRun) =>
  spinning(
    `Asking ${subject.agent} to read the trial report`,
    asking(
      subject.agent,
      "to inspect the trial report",
      subject.root,
      inspectionPrompt(run.reportPath, subject.id),
    ),
  ).pipe(
    Effect.map((text) => ({ _tag: "Text", text }) as const),
    Effect.catch((cause) => Effect.succeed({ _tag: "Failed", message: messageOf(cause) } as const)),
  );

const MAX_SHOWN = 40;

const showFindings = (run: TrialRun) =>
  Effect.gen(function* () {
    let shown = 0;
    for (const [file, findings] of Map.groupBy(run.findings, (finding) => finding.file)) {
      yield* line(`${file}: ${findings.length} finding${findings.length === 1 ? "" : "s"}`);
      for (const finding of findings) {
        if (shown >= MAX_SHOWN) continue;
        shown += 1;
        const at = finding.lines ?? finding.section;
        const score =
          finding.probability === undefined
            ? ""
            : `  ${(finding.probability * 100).toFixed(0)}%${
                finding.threshold === undefined
                  ? ""
                  : ` (threshold ${(finding.threshold * 100).toFixed(0)}%)`
              }`;
        yield* note(
          `  ${at === undefined ? "" : `${at.first}-${at.last}`}${score}${
            finding.message === undefined ? "" : `  ${finding.message}`
          }`,
        );
      }
    }
    if (run.findings.length > shown) {
      yield* note(`… ${run.findings.length - shown} more in the report.`);
    }
  });

const drill = (findings: ReadonlyArray<TrialFinding>) =>
  Effect.gen(function* () {
    const reviews: Array<FindingReview> = [];
    for (const [index, finding] of findings.entries()) {
      yield* line("");
      yield* line(`${whereOf(finding)} (${index + 1} of ${findings.length})`);
      if (finding.excerpt !== undefined) yield* line(finding.excerpt);
      if (finding.probability !== undefined) {
        yield* said(
          `probability ${(finding.probability * 100).toFixed(0)}%${
            finding.threshold === undefined
              ? ""
              : `, threshold ${(finding.threshold * 100).toFixed(0)}%`
          }`,
        );
      }
      if (finding.message !== undefined) yield* said(finding.message);
      const verdict = yield* Prompt.run(
        Prompt.Select({
          message: "Is this finding right?",
          choices: [
            { title: "Correct", value: "correct" as const },
            { title: "False positive", value: "false-positive" as const },
            { title: "Unsure", value: "unsure" as const },
          ],
        }),
      );
      const note = yield* optionalNote("Note for the agent (optional)");
      reviews.push({
        where: whereOf(finding),
        ...(finding.probability === undefined ? {} : { probability: finding.probability }),
        verdict,
        ...(note === undefined ? {} : { note }),
      });
    }
    return reviews;
  });

const reviewFindings = (run: TrialRun) =>
  Effect.gen(function* () {
    if (run.findings.length === 0) {
      const choice = yield* Prompt.run(
        Prompt.Select({
          message: "No findings. What next?",
          choices: [
            { title: "Accept the draft", value: "accept" as const },
            { title: "Ask the agent to revise it anyway", value: "revise" as const },
            { title: "Cancel", value: "cancel" as const },
          ],
        }),
      );
      return choice === "accept"
        ? ({ _tag: "Accept", reviews: [] } as const)
        : choice === "revise"
          ? ({ _tag: "Revise", reviews: [] } as const)
          : ({ _tag: "Cancel" } as const);
    }
    yield* showFindings(run);
    const choice = yield* Prompt.run(
      Prompt.Select({
        message: "What do you make of these findings?",
        choices: [
          { title: "Accept all as correct", value: "accept" as const },
          { title: "Review them one by one", value: "drill" as const },
          { title: "Ask the agent to revise with this evidence", value: "revise" as const },
          { title: "Cancel", value: "cancel" as const },
        ],
      }),
    );
    if (choice === "accept") {
      const note = yield* optionalNote("Note for the agent about these findings (optional)");
      return {
        _tag: "Accept",
        reviews: run.findings.map((finding) => ({
          where: whereOf(finding),
          ...(finding.probability === undefined ? {} : { probability: finding.probability }),
          verdict: "correct" as const,
          ...(note === undefined ? {} : { note }),
        })),
      } as const;
    }
    if (choice === "drill") {
      const reviews = yield* drill(run.findings);
      const next = yield* Prompt.run(
        Prompt.Select({
          message: "Now what?",
          choices: [
            { title: "Accept the draft", value: "accept" as const },
            { title: "Ask the agent to revise with these verdicts", value: "revise" as const },
            { title: "Cancel", value: "cancel" as const },
          ],
        }),
      );
      return next === "accept"
        ? ({ _tag: "Accept", reviews } as const)
        : next === "revise"
          ? ({ _tag: "Revise", reviews } as const)
          : ({ _tag: "Cancel" } as const);
    }
    return choice === "revise"
      ? ({ _tag: "Revise", reviews: [] } as const)
      : ({ _tag: "Cancel" } as const);
  });

/** What the agent reads when revising: the report, the counts, and the user's verdicts. */
export const trialEvidence = (run: TrialRun, reviews: ReadonlyArray<FindingReview>) => {
  const lines = [
    `Trial report: ${run.reportPath}`,
    `Scope: ${run.scope.kind === "all" ? "the entire repo" : `the first ${run.scope.limit} files`}; ${filesWord(run.selectedFiles.length)} selected.`,
    `Counts: ${run.files} files, ${run.judged} judged, ${run.cached} cached, ${run.skipped} skipped, ${run.waiting} waiting.`,
    `Findings: ${run.findings.length}.`,
  ];
  if (reviews.length > 0) {
    lines.push("The user's verdicts:");
    for (const review of reviews) {
      lines.push(
        `- ${review.verdict}${review.note === undefined ? "" : ` — ${review.note}`}: ${review.where}`,
      );
    }
  }
  return lines.join("\n");
};

const approved = <D, R>(subject: TrialSubject<D, R>, draft: D) =>
  Effect.gen(function* () {
    const approval = yield* subject.approve(draft);
    if (approval._tag === "Approved" || approval._tag === "Declined") return approval;
    for (const problem of approval.problems) yield* warn(problem);
    if (approval._tag === "Failed") {
      return {
        _tag: "Stop",
        reason: approval.reason ?? "The draft did not pass its own checks.",
      } as const;
    }
    const skip = yield* skipOrCancel("The draft could not be trialled as it is.");
    return skip
      ? ({ _tag: "Skip", reason: "The draft could not be trialled as it is." } as const)
      : ({ _tag: "Declined" } as const);
  });

/**
 * Runs the draft, then loops on the user's review: accept it, revise it from
 * the evidence and run the same files again, or cancel. Nothing is written
 * here; the caller writes only on `Accepted` or an explicit `Untested`.
 */
export const trialAndReview = <D, R>(subject: TrialSubject<D, R>) =>
  Effect.gen(function* () {
    const first = yield* approved(subject, subject.draft);
    if (first._tag === "Declined") {
      return {
        _tag: "Cancelled",
        draft: subject.draft,
        reason: "The draft was not approved to run.",
      } as const;
    }
    if (first._tag === "Stop") {
      return { _tag: "Cancelled", draft: subject.draft, reason: first.reason } as const;
    }
    if (first._tag === "Skip") {
      return { _tag: "Untested", draft: subject.draft, reason: first.reason } as const;
    }
    let draft = first.draft;
    const chosen = yield* chooseScope(subject, draft);
    if (chosen._tag === "Skip") {
      return { _tag: "Untested", draft, reason: "The trial was skipped." } as const;
    }
    const scope = chosen.scope;
    const preview =
      chosen.preview === undefined
        ? yield* previewOf(subject, draft, scope)
        : ({ _tag: "Preview", preview: chosen.preview } as const);
    if (preview._tag === "Failed") {
      const skip = yield* skipOrCancel(`The trial could not be planned: ${preview.message}`);
      return skip
        ? ({ _tag: "Untested", draft, reason: preview.message } as const)
        : ({ _tag: "Cancelled", draft, reason: preview.message } as const);
    }
    yield* showPreview(scope, preview.preview);

    let pinned: ReadonlyArray<string> | undefined;
    for (;;) {
      const result = yield* runOnce(subject, draft, scope, pinned);
      if (result._tag === "Failed") {
        const skip = yield* skipOrCancel(`The trial did not run: ${result.message}`);
        return skip
          ? ({ _tag: "Untested", draft, reason: result.message } as const)
          : ({ _tag: "Cancelled", draft, reason: result.message } as const);
      }
      const run = result.run;
      pinned = run.selectedFiles;
      yield* showRun(run);
      const inspection = yield* inspect(subject, run);
      if (inspection._tag === "Text") {
        if (inspection.text.trim() !== "") yield* line(inspection.text.trim());
      } else {
        yield* warn(`The agent could not read the report: ${inspection.message}`);
      }
      const decision = yield* reviewFindings(run);
      if (decision._tag === "Accept") {
        return { _tag: "Accepted", draft, run, reviews: decision.reviews } as const;
      }
      if (decision._tag === "Cancel") {
        return { _tag: "Cancelled", draft, reason: "The trial was cancelled." } as const;
      }
      const revised = yield* subject.revise(draft, trialEvidence(run, decision.reviews));
      yield* subject.show(revised);
      const again = yield* approved(subject, revised);
      if (again._tag === "Declined") {
        return {
          _tag: "Cancelled",
          draft: revised,
          reason: "The revised draft was not approved to run.",
        } as const;
      }
      if (again._tag === "Stop") {
        return { _tag: "Cancelled", draft: revised, reason: again.reason } as const;
      }
      if (again._tag === "Skip") {
        return { _tag: "Untested", draft: revised, reason: again.reason } as const;
      }
      draft = again.draft;
      const next = yield* previewOf(subject, draft, scope, pinned);
      if (next._tag === "Failed") {
        const skip = yield* skipOrCancel(`The revised draft could not be planned: ${next.message}`);
        return skip
          ? ({ _tag: "Untested", draft, reason: next.message } as const)
          : ({ _tag: "Cancelled", draft, reason: next.message } as const);
      }
      yield* showPreview(scope, next.preview);
    }
  });

/** The write prompt's reminder when the draft was never trialled. */
export const trialWriteSuffix = <D>(outcome: TrialOutcome<D>) =>
  outcome._tag === "Untested" ? " (not trialled)" : "";

/** Whether a draft was trialled, for the write prompt and the closing line. */
export const trialStatus = <D>(outcome: TrialOutcome<D>) =>
  outcome._tag === "Accepted"
    ? `Trialled on ${filesWord(outcome.run.selectedFiles.length)}: ${outcome.run.findings.length} finding${outcome.run.findings.length === 1 ? "" : "s"}.`
    : outcome._tag === "Untested"
      ? `Not trialled: ${outcome.reason}`
      : "Not written.";
