# services/no-mutable-state

A service that exposes a mutable counter and set breaks the rule. One that
keeps its counts in a `Ref` inside the layer, exposing only readonly methods,
follows it.

```ts breaks
import { Context, type Effect } from "effect";
import type { ClientId } from "./ids.ts";

export class RateLimiter extends Context.Service<
  RateLimiter,
  {
    requestsThisMinute: number;
    blocked: Set<ClientId>;
    readonly check: (clientId: ClientId) => Effect.Effect<boolean>;
  }
>()("@app/RateLimiter") {}
```

```ts follows
import { Context, Effect, HashMap, Layer, Option, Ref } from "effect";
import type { ClientId } from "./ids.ts";

const LIMIT = 100;

export class RateLimiter extends Context.Service<
  RateLimiter,
  {
    readonly check: (clientId: ClientId) => Effect.Effect<boolean>;
    readonly remaining: (clientId: ClientId) => Effect.Effect<number>;
  }
>()("@app/RateLimiter") {
  static readonly layer = Layer.effect(
    RateLimiter,
    Effect.gen(function* () {
      const counts = yield* Ref.make(HashMap.empty<ClientId, number>());
      const usedBy = (map: HashMap.HashMap<ClientId, number>, clientId: ClientId) =>
        Option.getOrElse(HashMap.get(map, clientId), () => 0);
      return RateLimiter.of({
        check: (clientId) =>
          Ref.modify(counts, (map) => {
            const used = usedBy(map, clientId);
            return [used < LIMIT, HashMap.set(map, clientId, used + 1)];
          }),
        remaining: (clientId) =>
          Effect.map(Ref.get(counts), (map) => LIMIT - usedBy(map, clientId)),
      });
    }),
  );
}
```
