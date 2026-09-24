# data/variants-are-tagged-unions

A union of hand-written object types joined by a tag field breaks the rule;
tagged classes in a `Schema.Union` follow it.

```ts breaks
import type { Iban, Last4, WalletProvider } from "./primitives.ts";

export type PaymentMethod =
  | { readonly kind: "card"; readonly last4: Last4 }
  | { readonly kind: "bank"; readonly iban: Iban }
  | { readonly kind: "wallet"; readonly provider: WalletProvider };

export const describeMethod = (method: PaymentMethod): string => {
  switch (method.kind) {
    case "card":
      return `Card ending ${method.last4}`;
    case "bank":
      return `Bank account ${method.iban}`;
    default:
      return `Wallet (${method.provider})`;
  }
};
```

```ts follows
import { Match, Schema } from "effect";
import { Iban, Last4, WalletProvider } from "./primitives.ts";

export class Card extends Schema.TaggedClass<Card>("Card")("Card", { last4: Last4 }) {}
export class Bank extends Schema.TaggedClass<Bank>("Bank")("Bank", { iban: Iban }) {}
export class Wallet extends Schema.TaggedClass<Wallet>("Wallet")("Wallet", {
  provider: WalletProvider,
}) {}

export const PaymentMethod = Schema.Union([Card, Bank, Wallet]);
export type PaymentMethod = typeof PaymentMethod.Type;

export const describeMethod = (method: PaymentMethod) =>
  Match.value(method).pipe(
    Match.tag("Card", ({ last4 }) => `Card ending ${last4}`),
    Match.tag("Bank", ({ iban }) => `Bank account ${iban}`),
    Match.tag("Wallet", ({ provider }) => `Wallet (${provider})`),
    Match.exhaustive,
  );
```
