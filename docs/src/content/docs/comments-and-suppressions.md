---
title: "Comments and suppressions"
---

## Comments

Jev reads a file's code, not its comments. adhere takes every comment out before
it hashes or sends a file, or a declaration from
[`references`](/adhere/state-hooks/#what-jev-reads), blanking each one so every line keeps its
number. The report's excerpts still show comments. Compiler-provided
documentation and JSDoc tags still reach Jev in the type and documentation
strings that [`symbols`](/adhere/state-hooks/#what-jev-reads) sends when type awareness is on.
These strings are not editor hovers.

Jev takes what comments claim at their word, which hid real violations in the
studies: see [Writing good rules](/adhere/writing-good-rules/).

A comment that says `@adhere` anywhere in it is a note for Jev, and stays. Write
one for a fact the code relies on that the file cannot show, once you have
checked it, with how you know:

```ts
/**
 * Deletes the activity. @adhere DeleteActivity succeeds on a missing
 * activity, so no not-found error needs catching; probed 2026-09-25.
 */
```

- A note informs Jev. It suppresses nothing, and Jev still judges the code
  around it.
- `includeComments: true` in the config sends every comment, for a project whose
  rules are about comments, such as doc comments on exports.

## Suppressing a finding

Suppress a finding Jev got wrong with a comment in the code that says why:

```ts
// adhere-ignore alchemy/providers/idempotent-delete -- DeleteActivity succeeds on a missing activity; probed 2026-09-25
delete: Effect.fn(function* ({ output }) {
  yield* sfn.deleteActivity({ activityArn: output.activityArn });
}),
```

| Comment                                       | What it covers                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adhere-ignore`, on a line of its own         | The statement that starts on the next line of code: above, the whole handler, wherever in it Jev points, since the lines it points at can move between runs. |
| `adhere-ignore`, at the end of a line of code | The statement that starts on that line.                                                                                                                      |
| `adhere-ignore-file`, anywhere in a file      | The whole file. The rules it names are not judged there at all.                                                                                              |

- A comment names rules as a report does, separated by commas.
- What follows `--` is the reason, for whoever reads the code next.
- A finding without lines is covered when its section overlaps the statement.
- Jev never reads these comments, even with `includeComments: true`.
- The summary counts the findings they suppress.
