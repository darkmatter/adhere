// The executable supplies @drkmttr/adhere to a config (src/main.ts), and here
// TypeScript resolves the name to this package's own src/index.ts. A relative
// import instead makes the executable load src/, whose # imports it cannot
// resolve.
import { defineConfig } from "@drkmttr/adhere";

export default defineConfig({
  presets: ["effect"],
  threshold: 0.9,
});
