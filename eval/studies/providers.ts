/**
 * How other decision models judge adhere's questions beside Jev: OpenAI's
 * gpt-6-luna on its Decisions API, and Cloudflare's clef and clef-flash on
 * Workers AI. Every arm asks adhere's judge questions as adhere sends them,
 * through the provider a config would import from `@drkmttr/adhere`.
 * `providers.md` has the results.
 *
 *   himitsu exec common/openai-api-key cloudflare-account-id cloudflare-api-token typesafe-api-key -- \
 *     bun eval/studies/providers.ts [results.json]
 *   bun eval/studies/providers.ts --rescore results.json
 */
import { isNote, withoutComments } from "#comments.ts";
import { judgeBody } from "#services/Jev.ts";
import { cloudflare, openai } from "@drkmttr/adhere";
import { type Ask, runStudy } from "../harness.ts";

/** As `adhere lint` asks: without the file's comments, but its `@adhere` notes. */
const asSent: Ask = (model, lines, rules) =>
  judgeBody(model, withoutComments(lines, isNote), rules);

const { OPENAI_API_KEY = "", CLOUDFLARE_ACCOUNT_ID = "", CLOUDFLARE_API_TOKEN = "" } = process.env;

runStudy([
  ["jev", asSent],
  ["gpt-6-luna", asSent, openai({ apiKey: OPENAI_API_KEY })],
  [
    "clef",
    asSent,
    cloudflare({ accountId: CLOUDFLARE_ACCOUNT_ID, apiToken: CLOUDFLARE_API_TOKEN, model: "clef" }),
  ],
  [
    "clef-flash",
    asSent,
    cloudflare({
      accountId: CLOUDFLARE_ACCOUNT_ID,
      apiToken: CLOUDFLARE_API_TOKEN,
      model: "clef-flash",
    }),
  ],
]);
