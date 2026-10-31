/**
 * How `adhere rules create` looks: Clack's rail, drawn by effect/cli's own
 * prompts through their theme, with the wizard's own lines hung on the same
 * rail, and a spinner, as `gum spin` draws one, while an agent works.
 */
import { highlightedLines } from "#workflows/format.ts";
import { Status, clearingStatus } from "#services/Status.ts";
import { Console, Duration, Effect, Fiber } from "effect";
import { Prompt } from "effect/cli";

const rgbColor = (r: number, g: number, b: number) => `\x1B[38;2;${r};${g};${b}m`;
const colorCode = (n: number) => `\x1B[38;5;${n}m`;
const COLORS = {
  PURPLE: colorCode(99),
  KIWI: colorCode(156),
  PINK: colorCode(212),
  FG: rgbColor(220, 220, 240),
  MUTED: rgbColor(180, 180, 190),
  RED: colorCode(197),
  ACCENT: rgbColor(242, 205, 205),
};

/**
 * The prompts' theme. Every row's text starts in the fourth column: after the
 * prompt's symbol and two spaces, a select's pointer and its two-wide paging
 * arrow, or the paging arrow and a space before a multi-select's checkbox.
 */
export const look: Partial<Prompt.Theme> = {
  // primaryColor: `\x1B[0;37m`,
  // mutedColor: COLORS.MUTED,
  successColor: COLORS.KIWI,
  submittedColor: COLORS.PURPLE,
  errorColor: COLORS.RED,
  // toggleSeparator: " / ",
  // passwordMask: `${COLORS.MUTED}*${ESC}`,
  // prefix: `│\n│${COLORS.PINK} ◇${ESC}`,
  // prefix: `\n ◇`,
  // tick: `\n ✓`,
  // tick: `│\n│${COLORS.KIWI} ✓${ESC}`,
  // pointer: `${COLORS.PURPLE}‣${ESC}`,
  arrowUp: "↑ ",
  arrowDown: "↓ ",
  pointerSmall: "›",
  ellipsis: "…",
  descriptionSeparator: "\n\n - ",
  checkboxOn: "󰄲",
  checkboxOff: "",
  colors: true,
};

const columns = () => process.stderr.columns ?? 80;

/** `text` wrapped to the terminal, each further line indented under a choice's title as the first is. */
export const indented = (text: string) =>
  Bun.wrapAnsi(text, Math.max(columns() - 4, 20)).replaceAll("\n", "\n   ");

type Color = (theme: Prompt.Theme) => string;
const muted: Color = (theme) => theme.mutedColor;
const primary: Color = (theme) => theme.primaryColor;
const accent: Color = (_theme) => COLORS.PINK;

const paint = (theme: Prompt.Theme, text: string, color?: Color) =>
  theme.colors && color !== undefined ? `${color(theme)}${text}\x1b[0m` : text;

/**
 * Prints `text` beside `symbol`, wrapped to the terminal, its further lines
 * beside `bar`, in color when the theme has colors.
 */
const rail = (symbol: string, symbolColor: Color, text: string, textColor?: Color, bar = "│") =>
  Effect.gen(function* () {
    const theme = yield* Prompt.Theme;
    const [first = "", ...rest] = Bun.wrapAnsi(text, Math.max(columns() - 3, 20), {
      hard: true,
      trim: false,
    }).split("\n");
    yield* Console.error(
      [
        `${paint(theme, symbol, symbolColor)}  ${paint(theme, first, textColor)}`,
        ...rest.map((line) => `${paint(theme, bar, muted)}  ${paint(theme, line, textColor)}`),
      ].join("\n"),
    );
  });

export const intro = (text: string) => rail("┌", muted, text);
export const line = (text: string) => rail("│", muted, text);
export const note = (text: string) => rail("│", muted, text, muted);
export const warn = (text: string) => rail("▲", () => "\x1b[33m", text);
export const outro = (text: string) =>
  rail("└", (theme) => theme.successColor, text, undefined, " ");

/** A choice the agent made, not the user: what it chose, and why, muted beneath. */
export const decided = (what: string, why: string) =>
  rail("◇", (theme) => theme.successColor, what).pipe(Effect.andThen(note(why)));

/** What the agent says about something it shows the user, accented and in italics. */
export const said = (text: string) =>
  rail("│", muted, text, (theme) => `${theme.primaryColor}\x1b[3m`);

/**
 * Prints lines `from` to `to` of a file's `lines`, numbered from 1, on the
 * rail: the excerpt's lines `start` to `end` marked and highlighted as a
 * report highlights code, and the rest muted. A line too long for the
 * terminal is cut.
 */
export const excerpt = (
  lines: ReadonlyArray<string>,
  range: {
    readonly from: number;
    readonly to: number;
    readonly start: number;
    readonly end: number;
  },
) =>
  Effect.gen(function* () {
    const theme = yield* Prompt.Theme;
    const width = String(range.to).length;
    const room = Math.max(columns() - width - 8, 20);
    const cut = lines.slice(range.from - 1, range.to).map((text) => {
      const flat = text.replaceAll("\t", "  ");
      return flat.length > room ? `${flat.slice(0, room - 1)}…` : flat;
    });
    // Highlighted together, so a comment or template opened above an excerpt line colors it.
    const colored = highlightedLines(cut.join("\n"), theme.colors);
    const rows = cut.map((text, index) => {
      const number = String(range.from + index).padStart(width);
      const inside = range.from + index >= range.start && range.from + index <= range.end;
      const marker = inside ? paint(theme, "▌", primary) : " ";
      const body = inside
        ? `${paint(theme, number, muted)}  ${colored[index] ?? text}`
        : paint(theme, `${number}  ${text}`, muted);
      return `${paint(theme, "│", muted)}  ${marker} ${body}`;
    });
    yield* Console.error(rows.join("\n"));
  });

const frames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];

/**
 * Runs `effect` beside a spinner and `text` on the status line, then leaves
 * `text` on the rail with how long it took. Where the status line shows
 * nothing, as off a terminal, only that last line is printed.
 */
export const spinning = <A, E, R>(text: string, effect: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const theme = yield* Prompt.Theme;
    const status = yield* Status;
    let frame = 0;
    yield* line("");
    // The status line redraws at most every 100 ms.
    const spinner = yield* Effect.forkChild(
      Effect.suspend(() =>
        status.show(
          `${paint(theme, frames[frame++ % frames.length] ?? "", accent)}  ${paint(theme, `${text}…`, muted)}`,
        ),
      ).pipe(Effect.andThen(Effect.sleep("110 millis")), Effect.forever),
    );
    const [took, result] = yield* Effect.timed(effect).pipe(
      Effect.ensuring(Fiber.interrupt(spinner)),
      clearingStatus,
    );
    yield* note(`${text} · ${Math.max(1, Math.round(Duration.toSeconds(took)))}s`);
    return result;
  });
