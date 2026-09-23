---
description: Business logic must depend on a config service. Config primitives must be read only inside that service's layer, never in business logic.
---

```ts must
class ApiConfig extends Context.Service<
  ApiConfig,
  {
    readonly apiKey: Redacted.Redacted;
    readonly baseUrl: string;
  }
>()("@app/ApiConfig") {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function* () {
      const apiKey = yield* Config.redacted("API_KEY");
      const baseUrl = yield* Config.string("API_BASE_URL");
      return { apiKey, baseUrl };
    }),
  );
}
```

```ts never
const sendInvoice = Effect.fn("sendInvoice")(function* (invoice: Invoice) {
  const apiUrl = yield* Config.string("BILLING_API_URL");
  return yield* post(apiUrl, invoice);
});
```
