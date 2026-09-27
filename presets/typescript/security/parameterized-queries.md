---
description: A SQL query that includes a value must pass it as a bound parameter, or through a query builder or tagged template that binds it, never concatenate or interpolate the value into the query string.
excludeIf: ["an identifier, such as a table or column name, the code chose from a fixed list"]
---

## Must

```ts
const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
```

## Never

```ts
const { rows } = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```
