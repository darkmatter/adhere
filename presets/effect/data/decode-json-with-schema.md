---
description: JSON crossing a boundary should be decoded with Schema.fromJsonString, not JSON.parse followed by a cast.
---

```ts
const MoveFromJson = Schema.fromJsonString(Move);

const program = Effect.gen(function* () {
  const jsonString = '{"from":{"row":"A","column":"1"},"to":{"row":"B","column":"2"}}';
  const move = yield* Schema.decodeUnknownEffect(MoveFromJson)(jsonString);
  const json = yield* Schema.encodeEffect(MoveFromJson)(move);
  return json;
});
```
