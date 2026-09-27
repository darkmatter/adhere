---
description: A test must set up the state it needs itself, or in a `beforeEach`, and must never rely on state another test left behind, such as a module-level variable, a record another test inserted, or a mock another test configured.
excludeIf: ["state a suite sets up once for all its tests, in beforeAll or its body, that no test changes"]
tests: only
---

## Must

```ts
let cart: Cart;
beforeEach(() => {
  cart = new Cart();
});

it("adds an item", () => {
  cart.add(book);
  expect(cart.items).toEqual([book]);
});

it("totals its items", () => {
  cart.add(book);
  cart.add(pen);
  expect(cart.total()).toBe(book.price + pen.price);
});
```

## Never

```ts
const cart = new Cart();

it("adds an item", () => {
  cart.add(book);
  expect(cart.items).toEqual([book]);
});

it("totals its items", () => {
  cart.add(pen);
  expect(cart.total()).toBe(book.price + pen.price);
});
```
