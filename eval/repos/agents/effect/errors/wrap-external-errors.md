# effect/errors/wrap-external-errors

The [preset rule](../../../../../presets/effect/errors/wrap-external-errors/RULE.md)
targets raw external errors crossing into the application. The one reviewed
pre-ignore finding in `darkmatter/agents` points to the opposite boundary.

- `packages/connect/integrations/src/linear/tools/linear-read-tools.ts:21` (probability 0.85, context 0.30):
  The `linear_get_issue` handler in `LinearReadToolsLive` receives a typed
  `LinearOperationError` from `LinearRead.getIssueDetail`. It returns only
  the message that the `GetLinearIssue` tool declares as its failure shape;
  it does not pass through a raw SDK error.

**Regression hint:** Flag an SDK rejection that enters the application
unwrapped. Keep a tool that maps an already tagged application error to its
declared public message unflagged.
