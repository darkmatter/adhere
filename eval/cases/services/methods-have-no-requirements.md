# services/methods-have-no-requirements

A service method that declares `Mailer | UserRepo` as requirements breaks the
rule; acquiring them in the layer follows it.

```ts breaks
import { Context, type Effect } from "effect";
import type { NotifyError } from "./errors.ts";
import type { UserId } from "./ids.ts";
import type { Mailer } from "./Mailer.ts";
import type { UserRepo } from "./UserRepo.ts";

export class Notifier extends Context.Service<
  Notifier,
  {
    readonly notify: (
      userId: UserId,
      message: string,
    ) => Effect.Effect<void, NotifyError, Mailer | UserRepo>;
  }
>()("@app/Notifier") {}
```

```ts follows
import { Context, Effect, Layer } from "effect";
import type { NotifyError } from "./errors.ts";
import type { UserId } from "./ids.ts";
import { Mailer } from "./Mailer.ts";
import { UserRepo } from "./UserRepo.ts";

export class Notifier extends Context.Service<
  Notifier,
  { readonly notify: (userId: UserId, message: string) => Effect.Effect<void, NotifyError> }
>()("@app/Notifier") {
  static readonly layer = Layer.effect(
    Notifier,
    Effect.gen(function* () {
      const mailer = yield* Mailer;
      const users = yield* UserRepo;
      return Notifier.of({
        notify: Effect.fn("Notifier.notify")(function* (userId, message) {
          const user = yield* users.find(userId);
          yield* mailer.send(user.email, message);
        }),
      });
    }),
  );
}
```
