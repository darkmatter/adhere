---
title: "Providers"
---

adhere asks TypeSafe AI's Jev by default. A provider asks another decision model
instead, and adhere exports one for each model
[the providers study](https://github.com/darkmatter/adhere/blob/main/eval/studies/providers.md) measured:

```ts
import { defineConfig, openai } from "@drkmttr/adhere";

// Asks with OPENAI_API_KEY, or the key `adhere login --openai` saved.
export default defineConfig({ provider: openai() });
```

| Provider     | Asks                                                            | Options                          |
| ------------ | --------------------------------------------------------------- | -------------------------------- |
| `jev`        | TypeSafe AI's Jev, `jev-latest` by default                      | `apiKey`, `model`                |
| `openai`     | OpenAI's `gpt-6-luna`, on its Decisions API                     | `apiKey`, `model`                |
| `cloudflare` | Cloudflare's `clef`, by default, or `clef-flash`, on Workers AI | `accountId`, `apiToken`, `model` |

- Without an `apiKey`, `jev` and `openai` ask with the key from
  [Login](/adhere/install/#login).
- Each provider also takes `fetch`, the function that sends its requests.
- Clef cuts a request too long for it short rather than refuse it, so
  `cloudflare` skips a file whose request reaches clef's limit: 64,000 tokens,
  or 24,000 for clef-flash.

<details>
<summary>Writing a provider</summary>

A provider is a model's name, and an `ask` that answers adhere's questions
about a state:

```ts
import { defineConfig, type Provider, RequestFailed } from "@drkmttr/adhere";

const mine: Provider = {
  model: "my-decision-model",
  ask: async (state, questions, { signal }) => {
    const response = await fetch("https://decisions.example.com/v1/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, questions }),
      signal,
    });
    if (!response.ok) {
      throw new RequestFailed(`My model answered HTTP ${response.status}`, response.status);
    }
    return { answers: await response.json() };
  },
};

export default defineConfig({ provider: mine });
```

- `state` is the file's code by section under `code`, beside what adhere read
  for it.
- Each question has an `id`, the `question` as adhere phrases it, and the
  `fields` it names in backticks, such as `rule`, `must`, and `never`. A
  `noul` asks whether something holds. A `choice` asks for the key of one of
  its `options`. Its `options` can hold just one entry.
- `ask` returns `{ answers }`: by id, a `noul`'s probability from 0 to 1, or a
  `choice`'s key. An id left out goes unanswered: its rule is not reported, and
  is asked again on the next run.
- A rejection stops the run, but for three errors adhere exports:
  `ContextOverflow` gets one retry without `references` when that map is
  present; if the request still overflows, the file is skipped.
  `RequestBlocked` reports it blocked, and `RequestFailed` is tried again, up
  to three times, when its `status` is 0, for no answer, or a 408, 429, or 5xx.
- adhere paces calls with `--rpm`, aborts `signal` after 30 seconds, and splits
  requests to fit Jev's 64,000 tokens. A model that takes less splits further
  in its `ask`.
- `model` replaces the config's `model`. The cache keeps answers by it, so a
  new model is asked again.
- A provider that sets `savedKey` to `"typesafe"` or `"openai"` gets that key
  as `apiKey`.
- The executable resolves no packages besides `@drkmttr/adhere`, so an `ask`
  uses `fetch` rather than an SDK.

</details>
