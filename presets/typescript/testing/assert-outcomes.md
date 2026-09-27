---
description: A test must assert what the code under test returned or did, such as its result, what it rendered, or the state it left, never only that it ran without throwing or returned something defined.
tests: only
---

## Must

```ts
it("applies the discount to each line", () => {
  const total = checkout([{ price: 100, quantity: 2 }], { discount: 0.1 });
  expect(total).toBe(180);
});
```

## Never

```ts
it("applies the discount to each line", () => {
  const total = checkout([{ price: 100, quantity: 2 }], { discount: 0.1 });
  expect(total).toBeDefined();
});
```
