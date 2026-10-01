---
description: A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.
threshold: 0.8
---

Why: a file that does one thing is easier to find, read, and change. A helper
that serves only that thing belongs in the same file.

## Should

```ts
export const parsePort = (value: string) =>
  Port.make(Number.parseInt(value, 10));
```

## Should not

```ts
export const parsePort = (value: string) => Port.make(Number.parseInt(value, 10));
export const sendWelcomeEmail = (to: Email) => Mailer.send(to, welcomeTemplate);
export const renderInvoice = (invoice: Invoice) => Html.table(invoice.lines);
```
