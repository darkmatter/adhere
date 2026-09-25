/**
 * Jev's price for input tokens, in dollars per million, by the name a config
 * sends as its model. Output tokens are free. From TypeSafe AI's models page,
 * https://docs.typesafe.ai/models, on 2026-09-25, when jev-latest and
 * jev-preview both pointed to jev-1.13.0.
 */
const DOLLARS_PER_MILLION: Readonly<Record<string, number>> = {
  "jev-1.13.0": 0.042,
  "jev-latest": 0.042,
  "jev-preview": 0.042,
};

/** The model's price per million input tokens, when adhere knows it. */
export const priceOf = (model: string): number | undefined => DOLLARS_PER_MILLION[model];
