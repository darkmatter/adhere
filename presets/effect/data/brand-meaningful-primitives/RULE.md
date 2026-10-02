---
description: A primitive with semantic meaning in a domain type, such as an id, email, URL, or port in a service's contract, an event, or a stored record, must be declared as a branded schema, never as a bare string or number.
---

Two ids of different things are both strings, so nothing stops one being
passed where the other belongs. A brand makes that mix-up a type error where
the value crosses from one module to another.

The rule judges where a domain type is declared: a schema field, interface, or
type alias for what services exchange, return, or store. A shape that mirrors
an external payload or a table row until it is mapped, a view's props or view
model, and a literal, local variable, or parameter whose type is declared
elsewhere are not domain types. A type the code's own modules pass between
them, such as a reference to a thread, an issue, or a delivery, is a domain
type even in a file that also mirrors a payload.

## Must

```ts
export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const Email = Schema.String.pipe(Schema.brand("Email"));
export type Email = typeof Email.Type;

export const Port = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.brand("Port"),
);
export type Port = typeof Port.Type;
```

## Never

```ts
type AccountId = string;

const Session = Schema.Struct({
  accountId: Schema.String,
  email: Schema.String,
});
```
