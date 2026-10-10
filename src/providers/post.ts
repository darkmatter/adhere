/** How each built-in provider sends a request and reads what comes back. */
import { RequestFailed } from "#providers/provider.ts";
import { Schema } from "effect";

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

/**
 * POSTs `body` as JSON, once: adhere tries again. A request that gets no
 * answer, or whose answer breaks off, throws a `RequestFailed` with status 0.
 */
export const post = async (
  name: string,
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
  signal: AbortSignal,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<{ readonly response: Response; readonly text: string }> => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
    return { response, text: await response.text() };
  } catch (cause) {
    throw new RequestFailed(`${name} did not answer: ${messageOf(cause)}`, 0);
  }
};

/**
 * A response that is not ok, as the `RequestFailed` to throw: its status, the
 * Ray ID of the Cloudflare edge in front of the API when there is one, and
 * its body on one line and cut short.
 */
export const failed = (name: string, response: Response, text: string): RequestFailed => {
  const ray = response.headers.get("cf-ray");
  const detail = text.trim().replace(/\s+/g, " ").slice(0, 300);
  return new RequestFailed(
    `${name} answered HTTP ${response.status}${ray === null ? "" : `, Ray ID ${ray}`}${detail === "" ? "" : `: ${detail}`}`,
    response.status,
  );
};

/** An ok response's body, decoded by `schema`. One that does not decode throws, naming who sent it. */
export const decoded = <A>(name: string, schema: Schema.Codec<A, string>, text: string): A => {
  try {
    return Schema.decodeUnknownSync(schema)(text);
  } catch (cause) {
    throw new Error(`${name}'s answer did not decode: ${messageOf(cause)}`);
  }
};
