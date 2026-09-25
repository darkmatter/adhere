# alchemy/runtime/lambda-no-post-response-work

In a Lambda handler, anything that must not be lost must be written durably, to a queue or a table, inside the handler before it responds, never left to a dangling promise, a forked fiber, or a finalizer, because Lambda freezes the instance after the response.

1 finding, at 0.76. It showed this hint:

```ts
fetch: Effect.gen(function* () {
  const event = yield* HttpServerRequest.schemaBodyJson(AuditEvent);
  yield* sendMessage({ MessageBody: JSON.stringify(event) });
  return HttpServerResponse.empty({ status: 202 });
}),
```

The probability, where Jev pointed, and the code around it, the line marked `>`:

```text
0.76 packages/alchemy/test/Neon/fixtures/function-effect.ts:32:3
  30 │ const recordNativeLifecycle = (id: string, phase: string) => {
  31 │   console.info(JSON.stringify({ nativeLifecycle: { id, phase } }));
> 32 │   nativeWaitUntil(Effect.runPromise(recordLifecycle(id, phase)));
  33 │ };
```
