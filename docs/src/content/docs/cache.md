---
title: "Cache"
---

Judgments are cached in `.adhere/cache/`. **Commit it.** Every judgment is a
paid request, and Jev's answers vary a little from run to run, so a committed
cache gives everyone and CI the same findings without paying for them again,
and a pull request changes the judgments of only the files it changes.

| What changed                                                                                                                    | What is judged again                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A file's code                                                                                                                   | Every rule, for that file.                                                       |
| A file's comments alone                                                                                                         | Nothing.                                                                         |
| A file is moved or copied                                                                                                       | Nothing. Identical files share their judgments.                                  |
| A rule's text, a matcher, the source of its `appendState`, or its options                                                       | That rule, for every file.                                                       |
| A rule's declared `reads` alone                                                                                                 | Nothing. Only the config's `reads` and `typeAware` change the cache.             |
| The config's `reads`, `typeAware`, `maxSymbolLength`, or `maxSymbolDocumentationLength`, and `includeComments` with `typeAware` | Every rule, once.                                                                |
| What the reads find: a file it imports, the workspace's packages, the file's `dependents`                                       | Nothing, so a judgment can go stale. Delete the cache to judge every file again. |
| The threshold is lowered                                                                                                        | Nothing. Cached judgments newly above it are located.                            |
| adhere asks its questions differently, after an upgrade                                                                         | Every rule, once.                                                                |

A rule's declared reads are advisory, so they are not in the fingerprint; only
the config's settings that enable them affect the cache. Enabling `typeAware`
adds the bundled rules that declare `symbols` or `references` to the run, and
their cached judgments return with them.

To keep the cache out of diffs, mark it as generated in `.gitattributes`:

```text
.adhere/cache/** linguist-generated -diff
```

> **Where lint gates a merge.** Anyone who can commit can also write a cache
> file saying that code passes. Lint a pull request against the cache as merged,
> not as the pull request has it. Only the files it changes are judged again:
>
> ```sh
> rm -rf .adhere/cache && git checkout origin/main -- .adhere/cache
> adhere lint --yes
> ```

<details>
<summary>How the cache is stored and pruned</summary>

- `files/` holds Jev's answers by the content they are about. Each cache file
  is named for the hash of a source file's content as Jev reads it, without
  its comments.
- Each answer sits under a fingerprint of the model and the rule: its text,
  its matchers, and its `appendState`'s source.
- `tallies/` keeps the linter check's answers, one tally per rule, under a key
  that changes with the rule's text and the model.
- A cache file is written once and never changed: it is also named for the hash
  of its own text. Two branches that judge the same code add files rather than
  edit them, so git merges the cache without a conflict.
- After a run that reads every file, adhere prunes the cache: it deletes answers
  about content no file has, and folds what is left into one file per content. A
  run narrowed by `--filter` does not prune.
- Pruning keeps answers to rules the run left out, so a run with other presets
  or rules, or with one topic, loses nothing another run still asks. It keeps
  answers to a rule's old texts too, until the content they are about is gone.
- It also keeps answers about a file the run read but judged against no rule,
  such as a test when no rule judges tests. A file the config excludes is not
  read, so answers about it go.

</details>
