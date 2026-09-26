---
description: Code that writes out a file must import that file's contents from a file of its own, with `with { type: "text" }`, and never inline them as a string literal.
threshold: 0.8
---

Adhere's own rule. Contents inlined in a template literal need their backticks
and `${` escaped, as a code fence inside one shows, and cannot be opened or
previewed as the file they become. A file of its own reads as it is written.

## Must

```ts
import smallFiles from "./scaffold/prefer-small-files.md" with { type: "text" };

const files = [[".adhere/style/prefer-small-files.md", smallFiles]] as const;
```

## Never

```ts
const SMALL_FILES = `---
description: A file should be small and focused.
---

\`\`\`ts
export const parsePort = (value: string) => Port.make(Number.parseInt(value, 10));
\`\`\`
`;

const files = [[".adhere/style/prefer-small-files.md", SMALL_FILES]] as const;
```
