# basics/external-calls-are-resilient

An HTTP call with neither a timeout nor a retry breaks the rule. The same call
through a client with both follows it, and so does a FileSystem read, which
the rule puts out of scope.

```ts breaks
import { Effect, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { type CustomerId, Invoice } from "./domain.ts";

const Invoices = Schema.Array(Invoice);

export const fetchInvoices = Effect.fn("fetchInvoices")(function* (customerId: CustomerId) {
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(
    `https://billing.example.com/customers/${customerId}/invoices`,
  );
  return yield* HttpClientResponse.schemaBodyJson(Invoices)(response);
});
```

```ts follows
import { Effect, Schedule, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { type CustomerId, Invoice } from "./domain.ts";

const Invoices = Schema.Array(Invoice);

export const fetchInvoices = Effect.fn("fetchInvoices")(function* (customerId: CustomerId) {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk,
    HttpClient.transformResponse(Effect.timeout("5 seconds")),
    HttpClient.retryTransient({ schedule: Schedule.exponential("200 millis"), times: 3 }),
  );
  const response = yield* client.get(
    `https://billing.example.com/customers/${customerId}/invoices`,
  );
  return yield* HttpClientResponse.schemaBodyJson(Invoices)(response);
});
```

```ts follows
import { Effect, FileSystem, Path, Schema } from "effect";
import { Manifest } from "./manifest.ts";

const ManifestFromJson = Schema.fromJsonString(Manifest);

export const readManifest = Effect.fn("readManifest")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const text = yield* fs.readFileString(path.join(root, "manifest.json"));
  return yield* Schema.decodeUnknownEffect(ManifestFromJson)(text);
});
```
