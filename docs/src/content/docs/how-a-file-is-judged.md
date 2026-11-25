---
title: "How a file is judged"
---

1. **Split.** adhere splits the file into sections of whole statements, in runs
   of at most 30 lines.
2. **Judge.** One request per file asks Jev, for each rule, how likely the file
   is to break it.
3. **Locate.** A second request, only for rules above their threshold, asks
   which section and lines break the rule, and whether Jev sees enough to
   decide.

A file too long for Jev's context is skipped and counted in the summary.

<details>
<summary>The steps in detail</summary>

**Split.** adhere splits each file into sections of whole statements, such as
its imports, constants, and functions, packed in order into runs of at most 30
lines. A class or function longer than that splits into its methods or the
statements of its body. Jev reads the file as these sections.

**Judge: one request per file.**

- The state is `code`, the file's sections under their numbers from 1, as
  `{ code: { "1": "…", "2": "…" } }`, without their comments (see
  [Comments](/adhere/comments-and-suppressions/#comments)), beside what the config [`reads`](/adhere/state-hooks/#what-jev-reads).
- Each rule is one `noul` (yes/no probability) question that carries the rule's
  description and details, and its code under its words, `must` and `never`, or
  a guideline's `should` and `should_not`. It asks whether the file diverges
  from the pattern `must` shows, with `never` as an example of diverging. For
  a rule with only code that must never be written, it asks whether the file
  contains that code.
- Criteria for each answer draw the line at the rule's scope, so a file with no
  code the rule is about is a no.
- No rule sits in the state, so a rule's probability depends only on the state
  and that rule, not on which other rules share the request. Every question
  shares the state cost of the request.
- On up to 10 files per project rule, the rule's question has a second one
  beside it, the linter check (see [Validating rules](/adhere/validating-rules/)),
  with the same fields.
- A rule with `appendState` has requests of its own, here and below, whose
  state adds to this one.

**Locate: a second request, only when at least one rule's probability is above
its threshold.** Per flagged rule:

- When the file has more than one section, adhere asks one `choice` question
  among the sections' numbers, which yields the section to report. The options
  carry no text of their own, since each is a key of the state. On the eval,
  options that described each section, by its first line or by what it
  declares, located violations no better than options without text.
- For each section, adhere asks two `choice` questions among its lines, each
  option the line's text: the line the violation starts on and the one it ends
  on. The report underlines the lines chosen in the reported section. On the
  eval, lines asked for in this request were named as accurately as lines asked
  for in a request of their own, and they held a violation for 94% of real
  findings, most often as one line ([study](https://github.com/darkmatter/adhere/blob/main/eval/studies/pinpoint.md)).
- adhere asks one `noul` carrying the rule: whether you can tell if `code`
  breaks it from the state alone, without knowing what other files, libraries,
  services, or configuration do beyond what it shows. It yields the `context`
  score and its warning.

**Limits.** Jev reads at most 32k tokens of state and one question together, and
64k tokens in a request. adhere estimates tokens from the JSON it sends, at
about three bytes a token, and leaves 1k of room for what Jev wraps around it.

- When a file's questions would not fit in one request, they are split across
  several.
- If a file's state and longest question would not fit together, or a provider
  reports a context overflow, adhere retries once without `references` when that
  map is present. Target code, `symbols`, and other context remain intact; no
  declaration excerpt is shortened to fit. Removing references may still leave
  the request too large, in which case the file is skipped and counted in the
  summary. A file with more than 255 code sections is also skipped, and the rest
  of the run goes on.
- A file is also skipped when Jev itself counts it as over its context. Text
  denser than the estimate, such as CJK, can cause that.

</details>
