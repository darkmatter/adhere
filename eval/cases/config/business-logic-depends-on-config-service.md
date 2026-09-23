# config/business-logic-depends-on-config-service

Business logic that reads `Config` itself breaks the rule; the same logic
reading a config service, whose layer reads `Config`, follows it.

```ts breaks
import { Config, Effect } from "effect";
import { Mailer } from "./Mailer.ts";
import type { User } from "./User.ts";

export const sendWelcomeEmail = Effect.fn("sendWelcomeEmail")(function* (user: User) {
  const sender = yield* Config.string("MAIL_FROM");
  const replyTo = yield* Config.string("MAIL_REPLY_TO");
  const mailer = yield* Mailer;
  yield* mailer.send({ from: sender, replyTo, to: user.email, subject: "Welcome aboard" });
});
```

```ts follows
import { Config, Context, Effect, Layer } from "effect";
import { Mailer } from "./Mailer.ts";
import type { User } from "./User.ts";

export class MailConfig extends Context.Service<
  MailConfig,
  { readonly sender: string; readonly replyTo: string }
>()("@app/MailConfig") {
  static readonly layer = Layer.effect(
    MailConfig,
    Effect.gen(function* () {
      const sender = yield* Config.string("MAIL_FROM");
      const replyTo = yield* Config.string("MAIL_REPLY_TO");
      return { sender, replyTo };
    }),
  );
}

export const sendWelcomeEmail = Effect.fn("sendWelcomeEmail")(function* (user: User) {
  const config = yield* MailConfig;
  const mailer = yield* Mailer;
  yield* mailer.send({
    from: config.sender,
    replyTo: config.replyTo,
    to: user.email,
    subject: "Welcome aboard",
  });
});
```
