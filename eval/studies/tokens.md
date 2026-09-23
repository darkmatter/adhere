# Tokens and context

**Question.** adhere keeps each request within Jev's context, which Jev 1.13's
model card gives as 32,000 tokens for the state and its longest question and
64,000 for a whole request. It has to estimate tokens without Jev's tokenizer.
How far off is the estimate, and what does Jev do with a request that does
not fit?

**Setup.** jev-1.13.0, 2026-09-23. Every eval request reports Jev's own count
as `usage.input_tokens`; `harness.ts` sets it beside adhere's estimate, one
token per three bytes of the request's JSON.

## Results

- **Numbered TypeScript runs 3.23 bytes a token.** Fitting Jev's count
  against the state's size over 231 requests left at most 107 tokens
  unexplained, and two runs gave the same counts.
- **Questions run about 3.15 bytes a token**, counting the overhead Jev adds
  per question, for the question shape with criteria.
- **The estimate ran 4 to 19 percent high** over every request of the first
  study, and 12 to 16 percent high for the shipped question.
- **Past its context, Jev answers `400 {"detail":{"error_type":"max_tokens_exceeded"}}`.**
  A state of about 41,000 tokens, at the measured rate, drew that answer.
- **Denser text outruns the estimate.** A file of 800 lines of rare CJK
  comments fits at 26,900 tokens by the estimate, and Jev refuses it.

## Decided

adhere estimates at three bytes a token and skips a file whose code and
longest question would not fit in 32,000, less 1,000 for what Jev wraps
around a request (c9b5a04). It splits a request that would pass 64,000
(c9b5a04), and skips a file Jev refuses as over its context, as it does one
the estimate holds back (f971a7d). The CJK file above runs to the end as "1
skipped".
