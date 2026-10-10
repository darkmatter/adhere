/** Gold labels are fixed before any model responses; paths and target bytes never encode the label. */
export interface ContextCase {
  readonly name: string;
  readonly family: string;
  readonly rule: string;
  readonly variant: "checked" | "unchecked" | "control";
  readonly label: "real" | "false";
  readonly note: string;
  readonly files: Readonly<Record<string, string>>;
}

interface Family {
  readonly name: string;
  readonly rule: string;
  readonly subject: string;
  readonly checked: string;
  readonly unchecked: string;
  readonly distraction: string;
  readonly notes: readonly [string, string, string];
}

const families: readonly Family[] = [
  {
    name: "timeout",
    rule: "typescript/async/network-calls-have-timeouts",
    subject: [
      'import { settings } from "./neighbor";',
      "export async function loadRemote() {",
      '  return await fetch("https://billing.example.invalid/invoices", settings());',
      "}",
      "",
    ].join("\n"),
    checked: [
      "export function settings(): RequestInit {",
      "  return { signal: AbortSignal.timeout(5_000) };",
      "}",
      "",
    ].join("\n"),
    unchecked: ["export function settings(): RequestInit {", "  return {};", "}", ""].join("\n"),
    distraction: [
      "export async function loadCatalog() {",
      '  return await fetch("https://billing.example.invalid/catalog");',
      "}",
      "",
    ].join("\n"),
    notes: [
      "The judged request receives a finite AbortSignal timeout from settings().",
      "settings() supplies no timeout or signal for the judged third-party request.",
      "The judged request remains bounded; an unrelated request in the helper file is not its violation.",
    ],
  },
  {
    name: "validation",
    rule: "typescript/types/validate-external-data",
    subject: [
      'import { inspect } from "./neighbor";',
      "export async function readRecord(request: Request) {",
      "  const raw: unknown = await request.json();",
      '  if (!inspect(raw)) throw new TypeError("Invalid record");',
      "  const record: { id: string; email: string } = raw;",
      "  return record;",
      "}",
      "",
    ].join("\n"),
    checked: [
      "export function inspect(value: unknown): value is { id: string; email: string } {",
      '  return typeof value === "object" && value !== null &&',
      '    "id" in value && typeof value.id === "string" &&',
      '    "email" in value && typeof value.email === "string";',
      "}",
      "",
    ].join("\n"),
    unchecked: [
      "export function inspect(value: unknown): value is { id: string; email: string } {",
      "  return true;",
      "}",
      "",
    ].join("\n"),
    distraction: [
      "export async function readSummary(request: Request) {",
      "  return (await request.json()) as { id: string; email: string };",
      "}",
      "",
    ].join("\n"),
    notes: [
      "The guard checks both fields before the target assigns external data a declared type.",
      "The predicate claims a type but performs no runtime validation; the target trusts unvalidated JSON.",
      "The target still uses the complete guard; another function's unchecked cast is not a target violation.",
    ],
  },
  {
    name: "logging",
    rule: "security/no-secrets-in-output",
    subject: [
      "export function emit(value: string) {",
      '  console.info("value", value);',
      "}",
      "",
    ].join("\n"),
    checked: [
      'import { emit } from "./subject";',
      "export function handle(request: Request) {",
      '  const selected = request.headers.get("x-request-id") ?? "";',
      "  emit(selected);",
      "}",
      "",
    ].join("\n"),
    unchecked: [
      'import { emit } from "./subject";',
      "export function handle(request: Request) {",
      '  const selected = request.headers.get("authorization") ?? "";',
      "  emit(selected);",
      "}",
      "",
    ].join("\n"),
    distraction: [
      "export function audit(request: Request) {",
      '  console.info("authorization", request.headers.get("authorization"));',
      "}",
      "",
    ].join("\n"),
    notes: [
      "The sole caller passes a public request correlation identifier, not a credential.",
      "The sole caller passes an Authorization credential, which the target logs verbatim.",
      "The target logs only a public request ID; the separate credential log belongs to another function.",
    ],
  },
  {
    name: "comparison",
    rule: "security/constant-time-secret-compare",
    subject: [
      "export function matches(received: string, expected: string) {",
      "  return received === expected;",
      "}",
      "",
    ].join("\n"),
    checked: [
      'import { matches } from "./subject";',
      "export function handle(request: Request, configured: string) {",
      '  const received = request.headers.get("x-region") ?? "";',
      "  return matches(received, configured);",
      "}",
      "",
    ].join("\n"),
    unchecked: [
      'import { matches } from "./subject";',
      "export function handle(request: Request, configured: string) {",
      '  const received = request.headers.get("x-api-key") ?? "";',
      "  return matches(received, configured);",
      "}",
      "",
    ].join("\n"),
    distraction: [
      "export function checkAccess(request: Request, expectedApiKey: string) {",
      '  return request.headers.get("x-api-key") === expectedApiKey;',
      "}",
      "",
    ].join("\n"),
    notes: [
      "The sole caller compares a public routing region with the configured region.",
      "The sole caller checks a received API key against the configured credential using target ordinary equality.",
      "The target still compares public routing codes; the separate API-key equality is outside it.",
    ],
  },
];

export const contextCases: readonly ContextCase[] = families.flatMap((family) =>
  (["checked", "unchecked", "control"] as const).map((variant, index) => ({
    name: `${family.name}-${index + 1}`,
    family: family.name,
    rule: family.rule,
    variant,
    label: variant === "unchecked" ? "real" : "false",
    note: family.notes[index]!,
    files: {
      "subject.ts": family.subject,
      "neighbor.ts":
        variant === "unchecked"
          ? family.unchecked
          : family.checked + (variant === "control" ? family.distraction : ""),
    },
  })),
);
