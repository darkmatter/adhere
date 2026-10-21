---
title: adhere
description: A linter for non-deterministic rules. Powered by TypeSafe AI.
template: splash
hero:
  tagline: A linter for non-deterministic rules. Powered by TypeSafe AI.
  actions:
    - text: Get started
      link: /adhere/getting-started/
      icon: right-arrow
    - text: GitHub
      link: https://github.com/darkmatter/adhere
      variant: minimal
      icon: external
---

A linter for rules a normal linter cannot check, such as "business logic should
live in services" or "modules should expose lots of functionality behind a
small API". You can write a rule as a Markdown file, with code that shows it:

````md
---
description: A third-party API going offline should not also take our app down.
---

Our APIs should not depend on a third-party API on a critical path. The
user-facing side should be unaffected if it goes offline, and ingestion should
happen in a separate, asynchronous process.

## Should

```ts
import db from "./lib/db";
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode reads only our own database.
export async function findRestaurants(zipCode: string) {
  return db.restaurants.find({ where: { zipCode } });
}

// A scheduled job copies new restaurants in, off the request path.
export async function syncRestaurants(since: Date) {
  const restaurants = await googleMaps.findAll({ updatedSince: since });
  await Promise.all(restaurants.map((restaurant) => db.restaurants.upsert(restaurant)));
}
```

## Should not

```ts
import googleMaps from "./lib/maps";

// GET /api/restaurants/:zipCode
export async function findRestaurants(zipCode: string) {
  // When Google Maps is down, slow, or over quota, so is this endpoint.
  return googleMaps.findAll({ where: { zipCode } });
}
```
````

adhere asks [Jev](https://typesafe.ai), TypeSafe AI's System One model, whether
each file breaks each rule. Jev answers with a calibrated probability. adhere
reports each rule whose probability is above a threshold, and shows the part of
the file Jev points at. The report looks like Oxlint's, the linter `vp lint`
runs:

![adhere lint demo](https://github.com/darkmatter/adhere/raw/main/eval/demo.gif)

Rules a normal linter can check exactly, such as a banned import or a type
error, belong in that linter. [`adhere validate`](/adhere/validating-rules/) lists the
rules Jev thinks a linter could check, and finds rules that contradict each
other.
