---
description: Domain records are defined with Schema.Class, not with a plain interface or type alias.
---

```ts
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
