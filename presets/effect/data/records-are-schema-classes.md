---
description: Domain records must be defined with Schema.Class, never with a plain interface or type alias.
---

```ts must
export class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.Date,
}) {
  get displayName() {
    return `${this.name} (${this.email})`;
  }
}
```

```ts never
interface Invoice {
  readonly id: InvoiceId;
  readonly total: Money;
}
```
