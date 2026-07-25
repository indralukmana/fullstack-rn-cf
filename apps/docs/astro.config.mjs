import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://docs.rn-cf.example",
  output: "static",
  server: { port: 4321 },
  integrations: [
    starlight({
      title: "RN CF Docs",
      editLink: {
        baseUrl: "https://github.com/indralukmana/fullstack-rn-cf/-/edit/main/apps/docs/",
      },
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        { label: "Architecture", slug: "architecture" },
        { label: "Authentication", slug: "auth" },
        { label: "Billing", slug: "billing" },
        { label: "Security", slug: "security" },
        { label: "API Reference", slug: "api-reference" },
        { label: "Testing", slug: "testing" },
        { label: "CI/CD", slug: "ci-cd" },
        { label: "Deployment", slug: "deployment" },
        { label: "Contributing", slug: "contributing" },
      ],
    }),
  ],
});
