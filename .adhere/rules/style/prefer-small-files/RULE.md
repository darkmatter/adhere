---
description: A file should be small and focused, with one primary responsibility, and should not mix unrelated concerns.
threshold: 0.8
---

A guideline, so its description and its headings say should and should not. A
rule that must hold says must and never instead, as name-domain-actions does.
Use this rule as a template for repository-specific conventions.

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
