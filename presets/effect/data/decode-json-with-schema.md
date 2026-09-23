---
description: JSON crossing a boundary must be decoded with Schema.fromJsonString, never with JSON.parse followed by a cast.
---

```ts must
const MoveFromJson = Schema.fromJsonString(Move);

const program = Effect.gen(function* () {
  const jsonString = '{"from":{"row":"A","column":"1"},"to":{"row":"B","column":"2"}}';
  const move = yield* Schema.decodeUnknownEffect(MoveFromJson)(jsonString);
  const json = yield* Schema.encodeEffect(MoveFromJson)(move);
  return json;
});
```

```ts never
const settings = JSON.parse(text) as Settings;
```
