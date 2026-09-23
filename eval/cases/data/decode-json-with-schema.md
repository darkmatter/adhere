# data/decode-json-with-schema

`JSON.parse` with a cast breaks the rule. Decoding through
`Schema.fromJsonString` follows it, next to a `JSON.stringify` that decodes
nothing.

```ts breaks
import { Effect } from "effect";
import type { WebhookEvent } from "./WebhookEvent.ts";
import { Webhooks } from "./Webhooks.ts";

export const handleWebhook = Effect.fn("handleWebhook")(function* (body: string) {
  const event = JSON.parse(body) as WebhookEvent;
  yield* Webhooks.dispatch(event);
});
```

```ts follows
import { Effect, Schema } from "effect";
import { WebhookEvent } from "./WebhookEvent.ts";
import { Webhooks } from "./Webhooks.ts";

const WebhookEventFromJson = Schema.fromJsonString(WebhookEvent);

export const handleWebhook = Effect.fn("handleWebhook")(function* (body: string) {
  const event = yield* Schema.decodeUnknownEffect(WebhookEventFromJson)(body);
  yield* Webhooks.dispatch(event);
});

export const describeEvent = (event: WebhookEvent): string => JSON.stringify(event, null, 2);
```
