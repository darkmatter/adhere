import type { Config } from "./src/index.ts";

// Type-only import: erased at runtime, so the compiled binary loads this file
// without resolving the package (see README, "Configuration").
export default {
  presets: ["effect"],
} satisfies Config;
