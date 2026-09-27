---
description: Data from outside the program, such as a parsed request body, a fetch response, a file's contents, a message, or an environment variable, must be checked at runtime before code gives it a type, never cast with `as` or assigned from `any` to a declared type. A schema's parse or decode, such as Zod's or Effect Schema's, or a type guard that checks each field it claims, is a runtime check.
appliesTo: ["code that reads data from outside the program"]
excludeIf: ["a value read through a typed client of the program's own database"]
---

## Must

```ts
const User = z.object({ id: z.string(), email: z.string().email() });

const response = await fetch(`/api/users/${id}`);
const user = User.parse(await response.json());
```

## Never

```ts
const response = await fetch(`/api/users/${id}`);
const user = (await response.json()) as User;
```
