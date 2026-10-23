import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";

export default defineConfig({
  // Canonical URL: dm.sh/adhere proxies the GitHub Pages build (darkmatter/web).
  site: "https://dm.sh",
  base: "/adhere",
  integrations: [
    starlight({
      plugins: [starlightLinksValidator()],
      title: "adhere",
      description: "A linter for non-deterministic rules. Powered by TypeSafe AI.",
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/darkmatter/adhere" }],
      editLink: { baseUrl: "https://github.com/darkmatter/adhere/edit/main/docs/" },
      customCss: ["./src/styles/darkmatter.css"],
      // darkmatter is dark-only: pin the theme and drop the picker.
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      expressiveCode: { themes: ["github-dark-default"] },
      sidebar: [
        { label: "Introduction", link: "/" },
        { label: "Install", slug: "install" },
        { label: "Getting started", slug: "getting-started" },
        {
          label: "Rules",
          items: [
            "rule-format",
            "writing-good-rules",
            "generate-rules",
            "install-rules",
            "presets",
          ],
        },
        { label: "Usage", items: ["reading-the-report", "config", "running-lint", "commands"] },
        { label: "Validate & improve rules", items: ["validating-rules", "live-evals"] },
        {
          label: "Advanced features",
          items: ["state-hooks", "providers", "comments-and-suppressions"],
        },
        { label: "Agent skills", slug: "agent-skills" },
        { label: "Reference", items: ["cache", "how-a-file-is-judged"] },
        { label: "Compose your AGENTS.md", slug: "compose-agents-md" },
      ],
    }),
  ],
});
