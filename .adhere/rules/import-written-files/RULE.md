---
description: Code that writes out a file should import that file's contents from a file of its own, with `with { type: "text" }`, and should not inline them as a string literal, unless the contents are only a line or two.
threshold: 0.8
---

Adhere's own rule. Contents inlined in a template literal need their backticks
and `${` escaped, as a code fence inside one shows, and cannot be opened or
previewed as the file they become. A file of its own reads as it is written.
Contents of a line or two, like `export default {};\n`, read fine inline.

## Should

```ts
import smallFiles from "./scaffold/prefer-small-files.md" with { type: "text" };

const files = [[".adhere/style/prefer-small-files.md", smallFiles]] as const;
```

## Should not

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
