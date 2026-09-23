# services/provide-at-entry

A library module that provides its own layers breaks the rule; the entry
point providing the app layer once follows it.

```ts breaks
import { Effect } from "effect";
import { DatabaseLive } from "../db.ts";
import { InvoiceRepo } from "./InvoiceRepo.ts";

export const listOverdueInvoices = Effect.gen(function* () {
  const invoices = yield* InvoiceRepo;
  return yield* invoices.overdue();
}).pipe(Effect.provide(InvoiceRepo.layer), Effect.provide(DatabaseLive));
```

```ts follows
import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";
import { DatabaseLive } from "./db.ts";
import { InvoiceRepo } from "./invoices/InvoiceRepo.ts";

const AppLayer = InvoiceRepo.layer.pipe(Layer.provideMerge(DatabaseLive));

const main = Effect.gen(function* () {
  const invoices = yield* InvoiceRepo;
  const overdue = yield* invoices.overdue();
  yield* Console.log(`${overdue.length} overdue invoices`);
});

main.pipe(Effect.provide(AppLayer), BunRuntime.runMain);
```
