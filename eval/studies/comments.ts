/**
 * Whether Jev judges a file better without its comments: adhere's question as
 * it sends it, against the same with every comment taken out of the file and
 * each line keeping its number. A comment can claim what the code does not:
 * two of alchemy's AutoScaling deletes say a missing resource is fine, and
 * AWS refuses it. `comments.md` has the results.
 *
 *   bun eval/studies/comments.ts [results.json]
 */
import { withoutComments } from "#comments.ts";
import { judgeBody } from "#services/Jev.ts";
import { runStudy } from "../harness.ts";

runStudy([
  ["with comments", judgeBody],
  ["without comments", (model, lines, rules) => judgeBody(model, withoutComments(lines), rules)],
]);
