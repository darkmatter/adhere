---
description: A path prop such as main or rootDir on a resource declared outside the directory alchemy runs from must be anchored to the declaring file with import.meta, never given as a bare relative string, which resolves from the root instead.
---

## Must

```ts
// backend/src/api.ts
export default Cloudflare.Worker("Api", { main: import.meta.url }, program);
export const Site = Cloudflare.Website.Vite("Site", { rootDir: path.resolve(import.meta.dirname, "../frontend") });
```

## Never

```ts
// backend/src/api.ts
export default Cloudflare.Worker("Api", { main: "src/api.ts" }, program); // resolves to <root>/src/api.ts
```
