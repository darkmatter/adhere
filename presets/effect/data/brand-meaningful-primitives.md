---
description: A primitive with semantic meaning, such as an id, email, URL, port, or count, is a branded schema.
---

```ts
export const UserId = Schema.String.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export const Email = Schema.String.pipe(Schema.brand("Email"))
export type Email = typeof Email.Type

export const Port = Schema.Int.pipe(Schema.check(Schema.isBetween({minimum: 1, maximum: 65535})), Schema.brand("Port"))
export type Port = typeof Port.Type
```
