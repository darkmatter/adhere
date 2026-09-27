---
description: A type that describes the same data as another type, a schema, a function, or a constant should be derived from it, with a utility type such as `Pick`, with `typeof` or `keyof`, or as a schema's inferred type, and should not restate its fields or values by hand.
level: warning
---

## Should

```ts
const ROLES = ["admin", "member", "guest"] as const;
type Role = (typeof ROLES)[number];

const User = z.object({ id: z.string(), email: z.string(), role: z.enum(ROLES) });
type User = z.infer<typeof User>;
```

## Should not

```ts
const ROLES = ["admin", "member", "guest"];
type Role = "admin" | "member" | "guest";

const User = z.object({ id: z.string(), email: z.string(), role: z.enum(ROLES) });
type User = { id: string; email: string; role: Role };
```
