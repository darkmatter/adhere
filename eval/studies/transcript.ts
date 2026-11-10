/**
 * Whether Jev judges a coding agent's turn better asked about `code`, in the
 * words and sections `adhere lint --type transcript` uses for a file today,
 * or asked about `transcript`, in words for a turn and in entries split at
 * blank lines. Each arm judges every turn in `transcript-cases.md` against
 * the three rules together, with what the user asked as `userPrompt`, then
 * locates each rule it flags above the threshold in one more request, as
 * lint does. `transcript.md` has the question, the arms' words, the decision
 * rule, and the results.
 *
 *   bun eval/studies/transcript.ts plan
 *   bun eval/studies/transcript.ts [runs] [results.json]
 *
 * `plan` prints each case's sections, both arms' words, and the most the
 * requests could cost, and sends nothing. A run sends every request `runs`
 * times, three by default, and refuses before sending when that could cost
 * over $1.
 */
import {
  DEFAULT_MODEL,
  DEFAULT_THRESHOLD,
  examplesOf,
  type ReadState,
  type Rule,
  type RuleId,
} from "#config.ts";
import { type Range, sectionsOf } from "#excerpt.ts";
import { parseRuleMarkdown } from "#markdown.ts";
import { Answered } from "#providers/provider.ts";
import { questionsOf, type SystemOneQuestion } from "#providers/systemOne.ts";
import { Credentials } from "#services/Credentials.ts";
import { askProvider } from "#services/Jev.http.ts";
import {
  type Body,
  edgeKey,
  fits,
  judgeBody,
  judgeQuestion,
  type Lines,
  locateBody,
  requestsOf,
  type Rules,
  sufficiencyKey,
  sufficiencyQuestion,
  tokensOf,
} from "#services/Jev.ts";
import { jev } from "@drkmttr/adhere";
import { Console, Effect, FileSystem, Redacted } from "effect";
import { auc, percentile, run, table } from "../harness.ts";
import cases from "./transcript-cases.md" with { type: "text" };

/** Dollars a token, as `alchemy-context.ts` counts them, and the most a run may cost. */
const PRICE = 0.042 / 1_000_000;
const CAP = 1;

type Side = "breaks" | "follows";

interface Case {
  readonly name: string;
  readonly rule: RuleId;
  readonly side: Side;
  readonly context: ReadState;
  readonly lines: Lines;
  /** The lines that hold a mark: where a finding of the case's rule should be. */
  readonly marked: ReadonlyArray<number>;
}

/** One rule's judgment of one case in one run, with the lines Jev located it on when it flagged it. */
interface Judged {
  readonly run: number;
  readonly arm: string;
  readonly sample: string;
  readonly rule: RuleId;
  readonly kind: Side | "off-target";
  readonly probability: number;
  readonly located?: Range;
}

/** A way of asking: how it splits a turn into sections, and its judge and locate requests. */
interface Arm {
  readonly name: string;
  readonly sections: (lines: Lines) => ReadonlyArray<Range>;
  readonly judge: (lines: Lines, rules: Rules, context: ReadState) => Body<SystemOneQuestion>;
  readonly locate: (lines: Lines, rules: Rules, context: ReadState) => Body<SystemOneQuestion>;
}

const RULE_BLOCK = /^## (\S+)\n\n(`{4,})md\n([\s\S]*?)\n\2$/gm;
const CASE_BLOCK =
  /^### (breaks|follows): (.+)\n\nPrompt: (.+)\n\n(?:Marks: (.+)\n\n)?(`{3,})text\n([\s\S]*?)\n\5$/gm;

/** The rules and cases `transcript-cases.md` plants. Each mark must be on a line of its case. */
const planted = Effect.gen(function* () {
  const blocks = Array.from(cases.matchAll(RULE_BLOCK));
  const rules: Record<RuleId, Rule> = {};
  for (const [, id = "", , text = ""] of blocks) {
    rules[id] = yield* parseRuleMarkdown(text, `${id}/RULE.md`);
  }
  const problems: Array<string> = [];
  const samples = Array.from(cases.matchAll(CASE_BLOCK), (match): Case => {
    const [, side = "", name = "", prompt = "", marks = "", , text = ""] = match;
    const rule = blocks.findLast((block) => block.index < match.index)?.[1] ?? "";
    const lines = text.split("\n");
    const found = Array.from(marks.matchAll(/`([^`]+)`/g), ([, mark = ""]) =>
      lines.flatMap((line, index) => (line.includes(mark) ? [index + 1] : [])),
    );
    if (rules[rule] === undefined || found.some((at) => at.length === 0)) problems.push(name);
    if ((side === "breaks") !== found.length > 0) problems.push(name);
    return {
      name: `${rule}: ${name}`,
      rule,
      side: side === "breaks" ? "breaks" : "follows",
      context: { userPrompt: prompt },
      lines,
      marked: [...new Set(found.flat())],
    };
  });
  if (samples.length !== (cases.match(/^### /gm)?.length ?? 0)) problems.push("unread cases");
  if (problems.length > 0) return yield* Effect.die(`transcript-cases.md: ${problems.join(", ")}`);
  return { rules, samples };
});

const today: Arm = {
  name: "code",
  sections: sectionsOf,
  judge: (lines, rules, context) => judgeBody(DEFAULT_MODEL, lines, rules, [], context),
  locate: (lines, rules, context) => locateBody(DEFAULT_MODEL, lines, rules, context),
};

/** A turn's entries: one from each line with text after a blank line, so a tool call with its result, or a message. */
const entriesOf = (lines: Lines): ReadonlyArray<Range> => {
  const starts = lines.flatMap((line, index) =>
    index === 0 || (line.trim() !== "" && lines[index - 1]?.trim() === "") ? [index + 1] : [],
  );
  return starts.map((first, index) => ({
    first,
    last: (starts[index + 1] ?? lines.length + 1) - 1,
  }));
};

/** What the code arm's questions say, and what the transcript arm says instead. */
const WORDS: ReadonlyArray<readonly [string, string]> = [
  ["code that `rule` is about", "steps that `rule` is about"],
  ["this file", "this transcript"],
  ["`code`", "`transcript`"],
];
const reword = (text: string) =>
  WORDS.reduce((said, [from, to]) => said.replaceAll(from, to), text);

/** A yes-or-no question of the code arm's in the transcript arm's words, with the rule's fields as they were. */
const reworded = <I extends { readonly question: string }>(asked: {
  readonly instructions: I;
  readonly criteria: { readonly true: string; readonly false: string };
}): SystemOneQuestion => ({
  type: "noul",
  instructions: { ...asked.instructions, question: reword(asked.instructions.question) },
  criteria: { true: reword(asked.criteria.true), false: reword(asked.criteria.false) },
});

const COMMENT =
  "Only `transcript` is the audit target: a coding agent's turn, each tool call with its result and the agent's messages, split into numbered entries. `userPrompt` is what the user asked for in this turn. All other state entries provide context, not additional transcript to audit.";

/** The turn as the transcript arm sends it: its entries under their numbers from 1, beside the context. */
const stateOf = (lines: Lines, context: ReadState) => ({
  ...context,
  transcript: Object.fromEntries(
    entriesOf(lines).map(({ first, last }, index) => [
      String(index + 1),
      lines.slice(first - 1, last).join("\n"),
    ]),
  ),
  __comment: COMMENT,
});

/** What the entry the section question asks for does, as `offense` in Jev.ts says it. */
const offenseOf = (rule: Rule): string => {
  const { good, bad } = examplesOf(rule);
  const avoided = `\`${(bad?.word ?? "never").replace(" ", "_")}\``;
  if (good === undefined) return `shows the pattern in ${avoided}`;
  const kept = `\`${good.word.replace(" ", "_")}\``;
  return bad === undefined
    ? `diverges from ${kept}`
    : `diverges from ${kept} or resembles ${avoided}`;
};

const transcriptArm: Arm = {
  name: "transcript",
  sections: entriesOf,
  judge: (lines, rules, context) => ({
    model: DEFAULT_MODEL,
    state: stateOf(lines, context),
    questions: Object.fromEntries(
      Object.entries(rules).map(([id, rule]) => [id, reworded(judgeQuestion(rule))]),
    ),
  }),
  // The code arm's locate request, asked of entries: which one, then each one's start and end line.
  locate: (lines, rules, context) => {
    const entries = entriesOf(lines);
    const numbers = Object.fromEntries(entries.map((_, index) => [String(index + 1), null]));
    const questions = Object.entries(rules).flatMap(([id, rule]) => {
      const { instructions } = judgeQuestion(rule);
      const choice = (
        question: string,
        criteria: Readonly<Record<string, string | null>>,
      ): SystemOneQuestion => ({
        type: "choice",
        instructions: { ...instructions, question },
        criteria,
      });
      const edges = entries.flatMap(({ first, last }, index) => {
        const options = Object.fromEntries(
          lines
            .slice(first - 1, last)
            .flatMap((text, at) =>
              text.trim() === "" ? [] : [[String(first + at), text.trim().slice(0, 120)]],
            ),
        );
        return (["start", "end"] as const).map(
          (edge) =>
            [
              edgeKey(edge, id, index + 1),
              choice(
                `Which line of \`transcript["${index + 1}"]\` does the part that breaks \`rule\` ${edge} on?`,
                options,
              ),
            ] as const,
        );
      });
      const section =
        entries.length > 1
          ? [
              [
                id,
                choice(`Which entry of \`transcript\` most clearly ${offenseOf(rule)}?`, numbers),
              ] as const,
            ]
          : [];
      return [
        ...section,
        ...edges,
        [sufficiencyKey(id), reworded(sufficiencyQuestion(rule, context))] as const,
      ];
    });
    return {
      model: DEFAULT_MODEL,
      state: stateOf(lines, context),
      questions: Object.fromEntries(questions),
    };
  },
};

const ARMS: ReadonlyArray<Arm> = [today, transcriptArm];

/** Where Jev located rule `id`, as `JevLive.locate` reads it: start and end lines within the section it chose. */
const placeOf = (
  answers: Answered["answers"],
  id: RuleId,
  sections: ReadonlyArray<Range>,
): Range | undefined => {
  const chosen = sections.length === 1 ? 1 : Number(answers[id]);
  const section = sections[chosen - 1];
  const [start = NaN, end = NaN] = (["start", "end"] as const).map((edge) =>
    Number(answers[edgeKey(edge, id, chosen)]),
  );
  return section !== undefined &&
    [start, end].every((line) => section.first <= line && line <= section.last)
    ? { first: Math.min(start, end), last: Math.max(start, end) }
    : undefined;
};

/** One body's answers, over as many requests as it needs, with the tokens Jev read and the model that answered. */
const askAll = (body: Body<SystemOneQuestion>, key: string) =>
  Effect.map(
    Effect.forEach(requestsOf(body), (request) =>
      askProvider(
        jev({ model: request.model }),
        request.state,
        questionsOf(request.questions),
        Answered,
        key,
      ),
    ),
    (responses) => ({
      answers: responses.reduce<Answered["answers"]>((all, r) => ({ ...all, ...r.answers }), {}),
      tokens: responses.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0),
      model: responses.find((r) => r.model !== undefined)?.model ?? DEFAULT_MODEL,
    }),
  );

const judgeCase = (arm: Arm, sample: Case, rules: Rules, key: string, round: number) =>
  Effect.gen(function* () {
    const judged = yield* askAll(arm.judge(sample.lines, rules, sample.context), key);
    const probabilities = Object.entries(judged.answers).flatMap(([id, answer]) =>
      id in rules && typeof answer === "number" ? [[id, answer] as const] : [],
    );
    const flagged = Object.fromEntries(
      probabilities.flatMap(([id, p]) => {
        const rule = rules[id];
        return p > DEFAULT_THRESHOLD && rule !== undefined ? [[id, rule] as const] : [];
      }),
    );
    const located =
      Object.keys(flagged).length === 0
        ? undefined
        : yield* askAll(arm.locate(sample.lines, flagged, sample.context), key);
    const sections = arm.sections(sample.lines);
    const judgments = probabilities.map(([id, probability]): Judged => {
      const place = located === undefined ? undefined : placeOf(located.answers, id, sections);
      return {
        run: round,
        arm: arm.name,
        sample: sample.name,
        rule: id,
        kind: id === sample.rule ? sample.side : "off-target",
        probability,
        ...(place === undefined || flagged[id] === undefined ? {} : { located: place }),
      };
    });
    return {
      judgments,
      unanswered: Object.keys(rules).length - judgments.length,
      tokens: judged.tokens + (located?.tokens ?? 0),
      model: judged.model,
    };
  });

/** An arm's questions about one rule, without the rule's fields: what `transcript.md` quotes. */
const wordingOf = (arm: Arm, sample: Case, rules: Rules) => {
  const one = Object.fromEntries(Object.entries(rules).filter(([id]) => id === sample.rule));
  const judge = arm.judge(sample.lines, one, sample.context);
  const locate = arm.locate(sample.lines, one, sample.context);
  const shown = (asked: SystemOneQuestion | undefined) => {
    if (asked === undefined || typeof asked.instructions === "string") return "(none)";
    const criteria =
      asked.type === "noul" && asked.criteria !== undefined
        ? `\n    yes: ${asked.criteria.true}\n    no: ${asked.criteria.false}`
        : "";
    return `${asked.instructions.question}${criteria}`;
  };
  return [
    `### ${arm.name}`,
    `  __comment: ${String(judge.state.__comment)}`,
    `  judge: ${shown(judge.questions[sample.rule])}`,
    `  section: ${shown(locate.questions[sample.rule])}`,
    `  start: ${shown(locate.questions[edgeKey("start", sample.rule, 1)])}`,
    `  sufficiency: ${shown(locate.questions[sufficiencyKey(sample.rule)])}`,
  ].join("\n");
};

const study = Effect.gen(function* () {
  const { rules, samples } = yield* planted;
  const args = process.argv.slice(2);
  const runs = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 3);
  const saveTo = args.find((arg) => arg.endsWith(".json"));

  const unfit = samples.filter((sample) => !fits(sample.lines, rules, sample.context));
  if (unfit.length > 0) return yield* Effect.die(`too long for Jev: ${unfit.map((s) => s.name)}`);
  // The most: every rule flagged in every case, so each case's locate request asks of all of them.
  const most =
    runs *
    ARMS.flatMap((arm) =>
      samples.flatMap((sample) => [
        ...requestsOf(arm.judge(sample.lines, rules, sample.context)),
        ...requestsOf(arm.locate(sample.lines, rules, sample.context)),
      ]),
    ).reduce((sum, request) => sum + tokensOf(request) + 1_000, 0);
  yield* Console.log(
    table(
      ["case", "lines", ...ARMS.map((arm) => `${arm.name} sections`)],
      samples.map((sample) => [
        sample.name,
        String(sample.lines.length),
        ...ARMS.map((arm) => String(arm.sections(sample.lines).length)),
      ]),
    ),
  );
  const [first] = samples;
  if (first !== undefined) {
    yield* Console.log(`\n${ARMS.map((arm) => wordingOf(arm, first, rules)).join("\n\n")}\n`);
  }
  yield* Console.log(
    `${samples.length} cases, ${runs} runs: at most ${ARMS.length * samples.length * runs * 2} requests of ${most} tokens, $${(most * PRICE).toFixed(3)}.`,
  );
  if (args[0] === "plan") return;
  if (most * PRICE > CAP) return yield* Effect.die(`over the $${CAP} cap`);

  const key = Redacted.value(yield* (yield* Credentials).key("typesafe"));
  const jobs = Array.from({ length: runs }, (_, round) =>
    ARMS.flatMap((arm) => samples.map((sample) => ({ arm, sample, round: round + 1 }))),
  ).flat();
  const done = yield* Effect.forEach(
    jobs,
    ({ arm, sample, round }) => judgeCase(arm, sample, rules, key, round),
    { concurrency: 8 },
  );
  const judgments = done.flatMap((job) => job.judgments);
  const tokens = done.reduce((sum, job) => sum + job.tokens, 0);
  const unanswered = done.reduce((sum, job) => sum + job.unanswered, 0);
  const models = [...new Set(done.map((job) => job.model))].join(", ");
  yield* Console.log(
    `\n${models}: ${judgments.length} judgments, ${unanswered} unanswered, ${tokens} tokens, $${(tokens * PRICE).toFixed(3)}.\n`,
  );

  const markedIn = new Map(samples.map((sample) => [sample.name, sample.marked]));
  const rows = ARMS.flatMap((arm) =>
    Array.from({ length: runs }, (_, index) => {
      const of = judgments.filter((j) => j.arm === arm.name && j.run === index + 1);
      const p = (kind: Judged["kind"]) =>
        of.filter((j) => j.kind === kind).map((j) => j.probability);
      const above = (kind: Judged["kind"]) =>
        of.filter((j) => j.kind === kind && j.probability > DEFAULT_THRESHOLD);
      const caught = above("breaks");
      const placed = caught.flatMap((j) => (j.located === undefined ? [] : [j.located]));
      const onMark = caught.filter(({ located, sample }) =>
        (markedIn.get(sample) ?? []).some(
          (line) => located !== undefined && located.first <= line && line <= located.last,
        ),
      );
      const wrong = above("follows").length + above("off-target").length;
      return {
        arm: arm.name,
        run: index + 1,
        score: caught.length - wrong,
        onMark: onMark.length,
        cells: [
          arm.name,
          String(index + 1),
          auc(p("breaks"), p("follows")).toFixed(3),
          `${caught.length}/${p("breaks").length}`,
          `${above("follows").length} / ${above("off-target").length}`,
          String(caught.length - wrong),
          `${onMark.length}/${caught.length}`,
          String(
            percentile(
              placed.map((r) => r.last - r.first + 1),
              0.5,
            ) ?? "–",
          ),
        ],
      };
    }),
  );
  yield* Console.log(
    table(
      [
        "arm",
        "run",
        "planted AUC",
        "caught",
        "wrong: follows / off-target",
        "caught − wrong",
        "lines on a mark",
        "lines shown, median",
      ],
      rows.map((row) => row.cells),
    ),
  );
  const [code, transcript] = ARMS.map((arm) => {
    const of = rows.filter((row) => row.arm === arm.name);
    const mean = (pick: (row: (typeof of)[number]) => number) =>
      of.reduce((sum, row) => sum + pick(row), 0) / Math.max(1, of.length);
    return { score: mean((row) => row.score), onMark: mean((row) => row.onMark) };
  });
  if (code !== undefined && transcript !== undefined) {
    const adopt =
      (transcript.score - code.score >= 3 && transcript.onMark >= code.onMark - 1) ||
      (transcript.score >= code.score && transcript.onMark - code.onMark >= 3);
    yield* Console.log(
      `\nMeans: code ${code.score.toFixed(2)} caught − wrong and ${code.onMark.toFixed(2)} on a mark; transcript ${transcript.score.toFixed(2)} and ${transcript.onMark.toFixed(2)}. Decision: ${adopt ? "adopt the transcript arm" : "keep the code arm"}.\n`,
    );
  }
  yield* Console.log(
    table(
      ["case", ...ARMS.map((arm) => `${arm.name}: p (lines)`)],
      samples.map((sample) => [
        `${sample.side}: ${sample.name}`,
        ...ARMS.map((arm) =>
          judgments
            .filter((j) => j.arm === arm.name && j.sample === sample.name && j.rule === sample.rule)
            .map(
              (j) =>
                `${j.probability.toFixed(2)} (${j.located === undefined ? "–" : `${j.located.first}–${j.located.last}`})`,
            )
            .join(", "),
        ),
      ]),
    ),
  );
  const offTarget = judgments.filter(
    (j) => j.kind === "off-target" && j.probability > DEFAULT_THRESHOLD,
  );
  yield* Console.log(
    `\nOff-target flags:\n${offTarget.map((j) => `- ${j.arm}, run ${j.run}: ${j.sample} as ${j.rule}, ${j.probability.toFixed(2)}`).join("\n") || "(none)"}`,
  );
  if (saveTo !== undefined) {
    const fs = yield* FileSystem.FileSystem;
    yield* fs.writeFileString(
      saveTo,
      `${JSON.stringify({ models, tokens, judgments }, null, 2)}\n`,
    );
    yield* Console.error(`wrote ${saveTo}`);
  }
});

run(study);
