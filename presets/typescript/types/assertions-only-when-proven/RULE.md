---
description: A type assertion with `as`, or a non-null assertion with `!`, should claim only what the code around it has already established, and should not be used to make a type error go away. `as const` claims nothing and is out of scope.
excludeIf: ["data read from outside the program, such as a parsed body or a fetch response"]
level: warning
---

## Should

```ts
const input = document.querySelector("#email");
if (!(input instanceof HTMLInputElement)) throw new Error("#email is not an input");
input.value = email;
```

## Should not

```ts
const input = document.querySelector("#email") as HTMLInputElement;
input.value = email;
```
