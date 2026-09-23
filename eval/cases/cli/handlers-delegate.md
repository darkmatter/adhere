# cli/handlers-delegate

A handler that prices and writes an invoice itself breaks the rule; one that
parses its input and calls a billing service follows it.

```ts breaks
import { Console, Effect, FileSystem } from "effect";
import { Argument, Command } from "effect/unstable/cli";

const customer = Argument.string("customer");
const hours = Argument.integer("hours");

export const invoiceCommand = Command.make("invoice", { customer, hours }, ({ customer, hours }) =>
  Effect.gen(function* () {
    const rate = customer.startsWith("vip-") ? 90 : 120;
    const subtotal = hours * rate;
    const tax = subtotal > 1000 ? subtotal * 0.2 : subtotal * 0.1;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const fs = yield* FileSystem.FileSystem;
    yield* fs.writeFileString(`invoices/${customer}.txt`, `Total due: ${total}`);
    yield* Console.log(`Invoiced ${customer}: ${total}`);
  }),
);
```

```ts follows
import { Console, Effect } from "effect";
import { Argument, Command } from "effect/unstable/cli";
import { Billing } from "./Billing.ts";
import { CustomerId } from "./ids.ts";

const customer = Argument.string("customer");
const hours = Argument.integer("hours");

export const invoiceCommand = Command.make("invoice", { customer, hours }, ({ customer, hours }) =>
  Effect.gen(function* () {
    const billing = yield* Billing;
    const invoice = yield* billing.invoice(CustomerId.make(customer), hours);
    yield* Console.log(`Invoiced ${customer}: ${invoice.total}`);
  }),
).pipe(Command.withDescription("Invoice a customer for hours worked"));
```
