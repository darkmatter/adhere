# errors/domain-errors-are-tagged

Domain failures as a bare `Error` and a plain object break the rule; tagged
errors follow it.

```ts breaks
import { Effect } from "effect";
import type { Account, Cents } from "./Account.ts";
import { Ledger } from "./Ledger.ts";

export const withdraw = Effect.fn("withdraw")(function* (account: Account, amount: Cents) {
  if (account.frozen) {
    return yield* Effect.fail(new Error(`Account ${account.id} is frozen`));
  }
  if (account.balance < amount) {
    return yield* Effect.fail({ reason: "insufficient-funds", accountId: account.id });
  }
  return yield* Ledger.debit(account.id, amount);
});
```

```ts follows
import { Effect, Schema } from "effect";
import { type Account, AccountId, Cents } from "./Account.ts";
import { Ledger } from "./Ledger.ts";

export class AccountFrozen extends Schema.TaggedError<AccountFrozen>()("AccountFrozen", {
  accountId: AccountId,
}) {}

export class InsufficientFunds extends Schema.TaggedError<InsufficientFunds>()(
  "InsufficientFunds",
  { accountId: AccountId, shortBy: Cents },
) {}

export const withdraw = Effect.fn("withdraw")(function* (account: Account, amount: Cents) {
  if (account.frozen) return yield* new AccountFrozen({ accountId: account.id });
  if (account.balance < amount) {
    const shortBy = Cents.make(amount - account.balance);
    return yield* new InsufficientFunds({ accountId: account.id, shortBy });
  }
  return yield* Ledger.debit(account.id, amount);
});
```
